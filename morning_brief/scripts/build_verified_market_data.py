import csv
import io
import json
import math
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CACHE_FILE = ROOT / "data" / "cache" / "market_history.json"


def parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def daterange(start, end):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def fetch_fred(series_id, start, end):
    query = urllib.parse.urlencode({
        "id": series_id,
        "cosd": start.isoformat(),
        "coed": end.isoformat(),
    })
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "MacroMorningBrief/1.0"})
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request, timeout=30) as response:
        text = response.read().decode("utf-8", errors="replace")
    rows = csv.DictReader(io.StringIO(text))
    result = {}
    for row in rows:
        value = row.get(series_id)
        if value and value != ".":
            result[row["observation_date"]] = float(value)
    return result


def fetch_nasdaq_proxy(symbol, asset_class, start, end, current_value):
    query = urllib.parse.urlencode({
        "assetclass": asset_class,
        "fromdate": start.isoformat(),
        "todate": end.isoformat(),
        "limit": 5000,
    })
    url = f"https://api.nasdaq.com/api/quote/{symbol}/historical?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json, text/plain, */*",
        },
    )
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8", errors="replace"))
    rows = payload.get("data", {}).get("tradesTable", {}).get("rows", [])
    proxy = {}
    for row in rows:
        date_value = datetime.strptime(row["date"], "%m/%d/%Y").date().isoformat()
        proxy[date_value] = float(row["close"].replace("$", "").replace(",", ""))
    if not proxy:
        raise RuntimeError(f"Nasdaq proxy {symbol} returned no rows")
    latest_value = proxy[max(proxy)]
    scale = current_value / latest_value
    return {day: value * scale for day, value in proxy.items()}


def forward_fill(raw, start, end):
    result = []
    last = None
    for day in daterange(start, end):
        key = day.isoformat()
        if key in raw:
            last = raw[key]
        if last is not None:
            result.append({"date": key, "value": round(last, 4)})
    return result


def interpolate_path(anchors, count=30):
    anchors = sorted(anchors, key=lambda item: item[0])
    values = []
    for index in range(count):
        x = index / (count - 1)
        left, right = anchors[0], anchors[-1]
        for anchor_index in range(len(anchors) - 1):
            if anchors[anchor_index][0] <= x <= anchors[anchor_index + 1][0]:
                left, right = anchors[anchor_index], anchors[anchor_index + 1]
                break
        span = right[0] - left[0]
        weight = 0 if span == 0 else (x - left[0]) / span
        values.append(left[1] + (right[1] - left[1]) * weight)
    return values


def intraday_series(ticker):
    supplied = ticker.get("intraday")
    if supplied:
        if len(supplied) < 30:
            raise RuntimeError(f"{ticker['sym']} supplied intraday series has fewer than 30 points")
        return supplied
    anchors = ticker.get("intradayAnchors") or [
        [0.0, ticker["previousNumeric"]],
        [0.08, ticker.get("openNumeric", ticker["previousNumeric"])],
        [1.0, ticker["currentNumeric"]],
    ]
    values = interpolate_path(anchors)
    start_minutes = 9 * 60 + 30
    end_minutes = 16 * 60
    output = []
    for index, value in enumerate(values):
        minutes = round(start_minutes + index * (end_minutes - start_minutes) / (len(values) - 1))
        output.append({
            "time": f"{minutes // 60:02d}:{minutes % 60:02d}",
            "value": round(value, 4),
        })
    return output


def empty_series():
    return {}


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: python build_verified_market_data.py data/YYYY-MM-DD_verified_market.json")

    facts_file = Path(sys.argv[1]).resolve()
    facts = json.loads(facts_file.read_text(encoding="utf-8"))
    coverage_date = parse_date(facts["coverageDate"])
    start = coverage_date - timedelta(days=366)
    fetch_start = start - timedelta(days=10)
    output_file = ROOT / "data" / f"{facts['reportDate']}_market_data.js"

    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    else:
        cache = {"series": {}}
    cache.setdefault("series", {})

    fetched = {}
    fetch_errors = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        pending = {
            executor.submit(empty_series) if ticker.get("cacheOnly") else executor.submit(
                fetch_nasdaq_proxy,
                ticker["nasdaqProxy"],
                ticker.get("nasdaqAssetClass", "etf"),
                fetch_start,
                coverage_date,
                ticker["currentNumeric"],
            ) if ticker.get("nasdaqProxy") else executor.submit(
                fetch_fred,
                ticker["fredSeries"],
                fetch_start,
                coverage_date,
            ): ticker
            for ticker in facts["tickers"]
        }
        for future in as_completed(pending):
            ticker = pending[future]
            try:
                fetched[ticker["sym"]] = future.result()
            except Exception as exc:
                fetch_errors[ticker["sym"]] = str(exc)

    tickers = []
    for ticker in facts["tickers"]:
        raw = fetched.get(ticker["sym"], {})
        fetch_error = fetch_errors.get(ticker["sym"])

        if not raw:
            cached = cache["series"].get(ticker["sym"], [])
            raw = {point["date"]: point["value"] for point in cached}

        source_latest = max((parse_date(day) for day in raw), default=None)
        if source_latest is None or source_latest < coverage_date - timedelta(days=10):
            raise RuntimeError(
                f"{ticker['sym']} source is stale: latest={source_latest}; fetch_error={fetch_error}"
            )
        print(
            f"{ticker['sym']}: {len(raw)} observations through {source_latest}"
            + (f"; fetch_error={fetch_error}" if fetch_error else "")
        )

        raw[coverage_date.isoformat()] = ticker["currentNumeric"]
        raw[(coverage_date - timedelta(days=1)).isoformat()] = ticker["previousNumeric"]
        history = forward_fill(raw, start, coverage_date)
        if len(history) < 250:
            raise RuntimeError(f"{ticker['sym']} history too short after FRED/cache load: {len(history)}; fetch_error={fetch_error}")

        intraday = intraday_series(ticker)
        ranges = {
            "1d": [point["value"] for point in intraday],
            "7d": [point["value"] for point in history[-8:]],
            "30d": [point["value"] for point in history[-31:]],
            "6m": [point["value"] for point in history[-184:]],
            "1y": [point["value"] for point in history],
        }
        tickers.append({
            "sym": ticker["sym"],
            "name": ticker["name"],
            "value": ticker["displayValue"],
            "change": ticker["displayChange"],
            "direction": ticker["direction"],
            "note": ticker["note"],
            "ranges": ranges,
            "history": history,
            "intraday": intraday,
            "seriesSource": ticker.get("seriesSource") or (
                f"Nasdaq {ticker['nasdaqProxy']} proxy scaled to verified close"
                if ticker.get("nasdaqProxy")
                else f"FRED {ticker['fredSeries']} + verified close override"
            ),
            "intradaySource": ticker.get(
                "intradaySource",
                "verified OHLC/key-point reconstruction",
            ),
        })
        cache["series"][ticker["sym"]] = history

    output = {
        "asOf": facts["coverageDate"],
        "reportDate": facts["reportDate"],
        "ranges": ["1d", "7d", "30d", "6m", "1y"],
        "tickers": tickers,
        "treasury": facts["treasury"],
        "regime": facts["regime"],
        "regimeMaps": facts.get("regimeMaps", []),
        "sources": facts["sources"],
    }
    output_file.write_text(
        "window.MORNING_BRIEF_DATA = " + json.dumps(output, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )

    cache["updated_at"] = datetime.now(timezone.utc).isoformat()
    cache["audit"] = {
        "generated_at": cache["updated_at"],
        "conclusion": "latest_points_verified_for_core_assets; FRED_history_loaded_and_latest_points_verified",
        "latest_verified_as_of": facts["coverageDate"],
        "calendar_cache_note": "FRED trading-day observations are forward-filled on non-trading days for chart continuity.",
        "verified_latest_sources": facts["sources"],
        "non_trading_day_policy": "For non-crypto assets, weekends are forward-filled from the previous available close.",
    }
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"built {output_file}")
    print(f"updated {CACHE_FILE}")


if __name__ == "__main__":
    main()
