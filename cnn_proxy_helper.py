import json
import os
import sys
from pathlib import Path


def ensure_vendor_path():
    vendor_path = Path(__file__).resolve().parent / "vendor_py"
    if vendor_path.exists():
        sys.path.insert(0, str(vendor_path))


def build_session():
    ensure_vendor_path()
    import requests

    session = requests.Session()
    session.trust_env = False
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            "Referer": "https://edition.cnn.com/",
            "Origin": "https://edition.cnn.com",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def clear_proxy_env():
    for key in (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
        "GIT_HTTP_PROXY",
        "GIT_HTTPS_PROXY",
    ):
        os.environ.pop(key, None)
    os.environ["NO_PROXY"] = "*"
    os.environ["no_proxy"] = "*"


def fetch_with_curl_cffi():
    ensure_vendor_path()
    from curl_cffi import requests as curl_requests

    response = curl_requests.get(
        "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
        impersonate="chrome131",
        headers={
            "Referer": "https://edition.cnn.com/",
            "Origin": "https://edition.cnn.com",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def main():
    clear_proxy_env()
    try:
        payload = fetch_with_curl_cffi()
    except Exception:
        session = build_session()
        response = session.get("https://production.dataviz.cnn.io/index/fearandgreed/graphdata", timeout=15)
        response.raise_for_status()
        payload = response.json()
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
