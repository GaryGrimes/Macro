import argparse
import hashlib
import html
import json
import mimetypes
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
FUTU_DIR = ROOT / "data" / "futu"
TOPIC_ID = "162"
TOPIC_URL = f"https://news.futunn.com/news-topics/{TOPIC_ID}/futu-morning-post"
TOPIC_API = "https://news.futunn.com/news-site-api/topic/get-topics-news-list"
SHANGHAI = ZoneInfo("Asia/Shanghai")
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) MacroMorningBrief/1.0"
VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


def request_bytes(url, *, accept="*/*", referer=None, timeout=30, attempts=3):
    headers = {"User-Agent": USER_AGENT, "Accept": accept}
    if referer:
        headers["Referer"] = referer
    request = urllib.request.Request(url, headers=headers)
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            # Use urllib's default opener so unattended runs inherit the Mac's
            # configured HTTP(S) proxy instead of forcing a direct connection.
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read(), response.headers.get("Content-Type", "")
        except Exception as exc:
            last_error = exc
            if attempt < attempts:
                time.sleep(attempt * 2)
    raise last_error


def request_text(url, *, accept="text/html,application/json,*/*", referer=None, timeout=30):
    raw, content_type = request_bytes(url, accept=accept, referer=referer, timeout=timeout)
    match = re.search(r"charset=([^;\s]+)", content_type, flags=re.IGNORECASE)
    encoding = match.group(1).strip('"\'') if match else "utf-8"
    return raw.decode(encoding, errors="replace")


def find_article_items(value):
    if isinstance(value, list):
        if not value or all(isinstance(item, dict) for item in value):
            return value
        return []
    if not isinstance(value, dict):
        return []
    for key in ("data", "list", "items"):
        if key in value:
            found = find_article_items(value[key])
            if found:
                return found
    for child in value.values():
        found = find_article_items(child)
        if found and any("title" in item for item in found):
            return found
    return []


def published_at(item):
    value = item.get("time") or item.get("publishTime") or item.get("publish_time")
    if isinstance(value, (int, float)):
        stamp = value / 1000 if value > 10_000_000_000 else value
        return datetime.fromtimestamp(stamp, SHANGHAI)
    if isinstance(value, str):
        cleaned = value.strip()
        if re.fullmatch(r"\d+(?:\.\d+)?", cleaned):
            stamp = float(cleaned)
            stamp = stamp / 1000 if stamp > 10_000_000_000 else stamp
            return datetime.fromtimestamp(stamp, SHANGHAI)
        cleaned = cleaned.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(cleaned)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=SHANGHAI)
            return parsed.astimezone(SHANGHAI)
        except ValueError:
            pass
    return None


def select_daily_brief(items, target_date):
    candidates = []
    for item in items:
        title = str(item.get("title") or "").strip()
        if not title.startswith("富途早报"):
            continue
        published = published_at(item)
        if not published or published.date() != target_date:
            continue
        candidates.append((published, item))
    return max(candidates, key=lambda pair: pair[0])[1] if candidates else None


def format_start_tag(tag, attrs, closed=False):
    parts = [tag]
    for key, value in attrs:
        if value is None:
            parts.append(key)
        else:
            parts.append(f'{key}="{html.escape(value, quote=True)}"')
    suffix = " />" if closed else ">"
    return "<" + " ".join(parts) + suffix


class OriginContentParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.depth = 0
        self.capturing = False
        self.complete = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get("class", "").split()
        if not self.capturing and not self.complete and "origin_content" in classes:
            self.capturing = True
            self.depth = 1
            self.parts.append(format_start_tag(tag, attrs))
            return
        if self.capturing:
            self.parts.append(format_start_tag(tag, attrs))
            if tag not in VOID_ELEMENTS:
                self.depth += 1

    def handle_startendtag(self, tag, attrs):
        if self.capturing:
            self.parts.append(format_start_tag(tag, attrs, closed=True))

    def handle_endtag(self, tag):
        if not self.capturing:
            return
        self.parts.append(f"</{tag}>")
        if tag not in VOID_ELEMENTS:
            self.depth -= 1
        if self.depth == 0:
            self.capturing = False
            self.complete = True

    def handle_data(self, data):
        if self.capturing:
            self.parts.append(data)

    def handle_entityref(self, name):
        if self.capturing:
            self.parts.append(f"&{name};")

    def handle_charref(self, name):
        if self.capturing:
            self.parts.append(f"&#{name};")

    def handle_comment(self, data):
        if self.capturing:
            self.parts.append(f"<!--{data}-->")


class TextParser(HTMLParser):
    BREAK_TAGS = {"br", "div", "figcaption", "h1", "h2", "h3", "h4", "li", "p", "section"}

    def __init__(self):
        super().__init__()
        self.parts = []
        self.ignored_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.ignored_depth += 1
        elif not self.ignored_depth and tag in self.BREAK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style"} and self.ignored_depth:
            self.ignored_depth -= 1
        elif not self.ignored_depth and tag in self.BREAK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.ignored_depth:
            self.parts.append(data)

    def text(self):
        lines = []
        for line in "".join(self.parts).splitlines():
            cleaned = re.sub(r"\s+", " ", line).strip()
            if cleaned:
                lines.append(cleaned)
        return "\n".join(lines) + "\n"


class ImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []

    def handle_starttag(self, tag, attrs):
        if tag != "img":
            return
        values = dict(attrs)
        url = next(
            (values.get(key) for key in ("data-original", "data-src", "data-lazy-src", "src") if values.get(key)),
            None,
        )
        if not url and values.get("srcset"):
            url = values["srcset"].split(",")[-1].strip().split()[0]
        if url and not url.startswith("data:"):
            self.images.append({"url": url, "alt": values.get("alt", "").strip(), "role": "body"})


def extract_origin_content(article_html):
    parser = OriginContentParser()
    parser.feed(article_html)
    body = "".join(parser.parts).strip()
    if not parser.complete or not body:
        raise RuntimeError("article body .origin_content was not found")
    return body + "\n"


def extract_text(body_html):
    parser = TextParser()
    parser.feed(body_html)
    return parser.text()


def extract_images(body_html, article_url):
    parser = ImageParser()
    parser.feed(body_html)
    output = []
    seen = set()
    for image in parser.images:
        url = urllib.parse.urljoin(article_url, image["url"])
        if url in seen:
            continue
        seen.add(url)
        output.append({"url": url, "alt": image["alt"], "role": image["role"]})
    return output


def extension_for(url, content_type):
    media_type = content_type.split(";", 1)[0].strip().lower()
    extension = mimetypes.guess_extension(media_type) if media_type else None
    if extension == ".jpe":
        extension = ".jpg"
    if extension:
        return extension
    suffix = Path(urllib.parse.urlparse(url).path).suffix.lower()
    return suffix if re.fullmatch(r"\.[a-z0-9]{1,5}", suffix) else ".bin"


def write_manifest(output_dir, manifest):
    path = output_dir / "manifest.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def fetch(target_date, output_root=FUTU_DIR, timeout=30):
    output_dir = output_root / target_date.isoformat()
    output_dir.mkdir(parents=True, exist_ok=True)
    images_dir = output_dir / "images"
    retrieved_at = datetime.now(timezone.utc).isoformat()
    api_url = TOPIC_API + "?" + urllib.parse.urlencode({"topicsId": TOPIC_ID, "pageSize": 48})
    manifest = {
        "status": "started",
        "target_date": target_date.isoformat(),
        "retrieved_at": retrieved_at,
        "topic_id": TOPIC_ID,
        "topic_url": TOPIC_URL,
        "topic_api": api_url,
        "selection_rule": "published in Asia/Shanghai on target_date and title starts with 富途早报",
        "article": None,
        "images": [],
        "errors": [],
    }

    try:
        payload = json.loads(request_text(api_url, accept="application/json,*/*", referer=TOPIC_URL, timeout=timeout))
        items = find_article_items(payload)
        article = select_daily_brief(items, target_date)
        if not article:
            manifest["status"] = "not_published"
            manifest["candidate_count"] = len(items)
            write_manifest(output_dir, manifest)
            return manifest, output_dir

        article_url = urllib.parse.urljoin(TOPIC_URL, str(article.get("url") or ""))
        if not article_url.startswith("https://news.futunn.com/"):
            raise RuntimeError(f"unexpected or missing article URL: {article_url}")
        article_page = request_text(article_url, referer=TOPIC_URL, timeout=timeout)
        body_html = extract_origin_content(article_page)
        article_text = extract_text(body_html)
        (output_dir / "article.html").write_text(article_page, encoding="utf-8")
        (output_dir / "article_body.html").write_text(body_html, encoding="utf-8")
        (output_dir / "article.txt").write_text(article_text, encoding="utf-8")

        published = published_at(article)
        manifest["article"] = {
            "title": str(article.get("title") or "").strip(),
            "url": article_url,
            "source": article.get("source"),
            "published_at": published.isoformat() if published else None,
            "abstract": article.get("abstract"),
            "body_sha256": hashlib.sha256(body_html.encode("utf-8")).hexdigest(),
            "text_characters": len(article_text),
        }

        image_candidates = []
        cover_url = article.get("pic")
        if isinstance(cover_url, str) and cover_url.strip():
            image_candidates.append({
                "url": urllib.parse.urljoin(article_url, cover_url.strip()),
                "alt": "富途专题封面图",
                "role": "cover",
            })
        seen_urls = {image["url"] for image in image_candidates}
        for image in extract_images(body_html, article_url):
            if image["url"] not in seen_urls:
                image_candidates.append(image)
                seen_urls.add(image["url"])
        if image_candidates:
            images_dir.mkdir(parents=True, exist_ok=True)
        for index, image in enumerate(image_candidates, start=1):
            try:
                content, content_type = request_bytes(
                    image["url"], accept="image/avif,image/webp,image/*,*/*", referer=article_url, timeout=timeout
                )
                digest = hashlib.sha256(content).hexdigest()
                filename = f"{index:03d}_{digest[:10]}{extension_for(image['url'], content_type)}"
                (images_dir / filename).write_bytes(content)
                manifest["images"].append({
                    "url": image["url"],
                    "alt": image["alt"],
                    "role": image["role"],
                    "file": f"images/{filename}",
                    "content_type": content_type,
                    "bytes": len(content),
                    "sha256": digest,
                })
            except Exception as exc:
                manifest["errors"].append({"image_url": image["url"], "error": str(exc)})

        manifest["image_candidates"] = len(image_candidates)
        manifest["status"] = "complete" if not manifest["errors"] else "partial"
    except Exception as exc:
        manifest["status"] = "failed"
        manifest["errors"].append({"stage": "article_fetch", "error": str(exc)})

    write_manifest(output_dir, manifest)
    return manifest, output_dir


def parse_args():
    parser = argparse.ArgumentParser(description="Fetch the daily public Futu morning brief and its content images.")
    parser.add_argument(
        "target_date",
        nargs="?",
        default=datetime.now(SHANGHAI).date().isoformat(),
        help="Asia/Shanghai date, YYYY-MM-DD",
    )
    parser.add_argument("--output-root", type=Path, default=FUTU_DIR)
    parser.add_argument("--timeout", type=int, default=30)
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        target_date = date.fromisoformat(args.target_date)
    except ValueError as exc:
        raise SystemExit(f"invalid target date: {args.target_date}") from exc
    manifest, output_dir = fetch(target_date, args.output_root.resolve(), args.timeout)
    print(f"Futu fetch status: {manifest['status']}")
    print(f"Futu artifacts: {output_dir}")
    if manifest.get("article"):
        print(f"Futu article: {manifest['article']['title']}")
        print(f"Futu images: {len(manifest['images'])}/{manifest.get('image_candidates', 0)}")
    if manifest["status"] in {"failed", "partial"}:
        return 1
    if manifest["status"] == "not_published":
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
