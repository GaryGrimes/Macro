import csv
import json
import os
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "cache"
CACHE_FILE = CACHE_DIR / "market_history.json"
OUTPUT_JS = ROOT / "data" / "2026-05-05_market_data.js"


SYMBOLS = {
    "SPX": {"name": "S&P 500", "source": "stooq", "code": "^spx"},
    "NDX": {"name": "Nasdaq", "source": "stooq", "code": "^ndq"},
    "RUT": {"name": "Russell 2000", "source": "stooq", "code": "^rut"},
    "VIX": {"name": "CBOE VIX", "source": "stooq", "code": "^vix"},
    "BTC": {"name": "Bitcoin", "source": "stooq", "code": "btcusd"},
}


def daterange(start, end):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def stooq_daily(code):
    apikey = os.environ.get("STOOQ_APIKEY")
    url = f"https://stooq.com/q/d/l/?s={code}&i=d"
    if apikey:
        url += f"&apikey={apikey}"
    with urllib.request.urlopen(url, timeout=20) as response:
        text = response.read().decode("utf-8", errors="replace")
    rows = csv.DictReader(text.splitlines())
    out = {}
    for row in rows:
        if row.get("Close") and row["Close"] != "No data":
            out[row["Date"]] = float(row["Close"])
    return out


def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    return {"updated_at": None, "series": {}}


def save_cache(cache):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache["updated_at"] = datetime.now(timezone.utc).isoformat()
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def forward_fill_daily(raw, start, end):
    series = []
    last = None
    for day in daterange(start, end):
        key = day.isoformat()
        if key in raw:
            last = raw[key]
        if last is not None:
            series.append({"date": key, "value": round(last, 4)})
    return series


def pct_change(latest, prev):
    if prev in (None, 0):
        return None
    return (latest / prev - 1) * 100


def fmt_price(value, sym):
    if sym == "BTC":
        return f"~${value / 1000:.0f}k"
    if value >= 1000:
        return f"{value:,.2f}"
    return f"{value:.2f}"


def build_js(cache, as_of):
    data = json.loads(OUTPUT_JS.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
    by_symbol = {ticker["sym"]: ticker for ticker in data["tickers"]}
    for sym, cfg in SYMBOLS.items():
        series = cache["series"].get(sym, [])
        if not series or sym not in by_symbol:
            continue
        latest = series[-1]["value"]
        prev = series[-2]["value"] if len(series) > 1 else None
        change = pct_change(latest, prev)
        ticker = by_symbol[sym]
        ticker["value"] = fmt_price(latest, sym)
        if change is not None:
            ticker["change"] = f"{change:+.2f}%"
            ticker["direction"] = "up" if change > 0 else "down" if change < 0 else "flat"
        ticker["history"] = series
    data["asOf"] = as_of.isoformat()
    body = "window.MORNING_BRIEF_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT_JS.write_text(body, encoding="utf-8")


def main():
    as_of = parse_date(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    start = as_of - timedelta(days=366)
    cache = load_cache()
    cache.setdefault("series", {})
    for sym, cfg in SYMBOLS.items():
        try:
            raw = stooq_daily(cfg["code"])
        except Exception as exc:
            print(f"warning: {sym} fetch failed: {exc}", file=sys.stderr)
            raw = {}
        dense = forward_fill_daily(raw, start, as_of)
        if dense:
            cache["series"][sym] = dense
        elif sym not in cache["series"]:
            print(f"warning: {sym} has no live data and no existing cache", file=sys.stderr)
    save_cache(cache)
    build_js(cache, as_of)
    print(f"updated {CACHE_FILE} and {OUTPUT_JS}")


if __name__ == "__main__":
    main()
