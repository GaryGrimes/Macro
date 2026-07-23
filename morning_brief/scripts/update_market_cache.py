import csv
import io
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "cache"
CACHE_FILE = CACHE_DIR / "market_history.json"


SYMBOLS = {
    "SPX": {"name": "S&P 500", "yahoo": "^GSPC", "fred": "SP500"},
    "DJI": {"name": "Dow Jones", "yahoo": "^DJI", "fred": "DJIA"},
    "IXIC": {"name": "Nasdaq Composite", "yahoo": "^IXIC", "fred": "NASDAQCOM"},
    "RUT": {"name": "Russell 2000", "yahoo": "^RUT"},
    "VIX": {"name": "CBOE VIX", "yahoo": "^VIX", "fred": "VIXCLS"},
    "10Y": {"name": "10Y UST", "yahoo": "^TNX", "fred": "DGS10"},
    "30Y": {"name": "30Y UST", "yahoo": "^TYX", "fred": "DGS30"},
    "BRENT": {"name": "Brent Front Month", "yahoo": "BZ=F", "fred": "DCOILBRENTEU"},
    "WTI": {"name": "WTI Front Month", "yahoo": "CL=F", "fred": "DCOILWTICO"},
    "GOLD": {"name": "Gold", "yahoo": "GC=F"},
    "BTC": {"name": "Bitcoin", "yahoo": "BTC-USD"},
    "DXY": {"name": "U.S. Dollar Index", "yahoo": "DX-Y.NYB"},
    "UPS": {"name": "UPS", "yahoo": "UPS"},
    "AMD": {"name": "AMD", "yahoo": "AMD"},
}

NEW_YORK = ZoneInfo("America/New_York")
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) MacroMorningBrief/1.0"


def daterange(start, end):
    cur = start
    while cur <= end:
        yield cur
        cur += timedelta(days=1)


def parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def open_url(url):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json,text/plain,*/*"},
    )
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(request, timeout=30) as response:
        return response.read().decode("utf-8", errors="replace")


def yahoo_daily(code, start, end, scale=1.0):
    symbol = urllib.parse.quote(code, safe="")
    period1 = int(datetime.combine(start, datetime.min.time(), tzinfo=timezone.utc).timestamp())
    period2 = int(datetime.combine(end + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc).timestamp())
    query = urllib.parse.urlencode({
        "period1": period1,
        "period2": period2,
        "interval": "1d",
        "events": "history",
    })
    errors = []
    for host in ("query2.finance.yahoo.com", "query1.finance.yahoo.com"):
        url = f"https://{host}/v8/finance/chart/{symbol}?{query}"
        try:
            payload = json.loads(open_url(url))
            result = payload.get("chart", {}).get("result") or []
            if not result:
                raise RuntimeError(payload.get("chart", {}).get("error") or "empty result")
            timestamps = result[0].get("timestamp") or []
            closes = result[0].get("indicators", {}).get("quote", [{}])[0].get("close") or []
            output = {}
            for stamp, value in zip(timestamps, closes):
                if value is None:
                    continue
                day = datetime.fromtimestamp(stamp, NEW_YORK).date()
                if start <= day <= end:
                    output[day.isoformat()] = float(value) * scale
            if not output:
                raise RuntimeError("no daily closes in requested window")
            return output, host
        except Exception as exc:
            errors.append(f"{host}: {exc}")
            time.sleep(0.25)
    raise RuntimeError("; ".join(errors))


def fred_daily(series_id, start, end):
    query = urllib.parse.urlencode({
        "id": series_id,
        "cosd": start.isoformat(),
        "coed": end.isoformat(),
    })
    text = open_url(f"https://fred.stlouisfed.org/graph/fredgraph.csv?{query}")
    output = {}
    for row in csv.DictReader(io.StringIO(text)):
        value = row.get(series_id)
        if value and value != ".":
            output[row["observation_date"]] = float(value)
    if not output:
        raise RuntimeError("no FRED observations in requested window")
    return output


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
    if sym in {"10Y", "30Y"}:
        return f"{value:.2f}%"
    if sym in {"BRENT", "WTI", "GOLD", "BTC", "UPS", "AMD"}:
        return f"${value:,.2f}"
    if value >= 1000:
        return f"{value:,.2f}"
    return f"{value:.2f}"


def build_js(cache, as_of, output_js):
    data = json.loads(output_js.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
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
            ticker["change"] = f"{(latest - prev) * 100:+.0f}bp" if sym in {"10Y", "30Y"} else f"{change:+.2f}%"
            ticker["direction"] = "up" if change > 0 else "down" if change < 0 else "flat"
        ticker["history"] = series
    data["asOf"] = as_of.isoformat()
    body = "window.MORNING_BRIEF_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
    output_js.write_text(body, encoding="utf-8")


def main():
    as_of = parse_date(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    output_js = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else None
    if output_js and not output_js.exists():
        raise SystemExit(f"output data file does not exist: {output_js}")
    start = as_of - timedelta(days=366)
    cache = load_cache()
    cache.setdefault("series", {})
    source_status = {}
    failures = []
    for sym, cfg in SYMBOLS.items():
        raw = {}
        source = None
        errors = []
        try:
            raw, source = yahoo_daily(cfg["yahoo"], start - timedelta(days=10), as_of, cfg.get("yahoo_scale", 1.0))
        except Exception as exc:
            errors.append(f"Yahoo: {exc}")
        if not raw and cfg.get("fred"):
            try:
                raw = fred_daily(cfg["fred"], start - timedelta(days=10), as_of)
                source = f"FRED {cfg['fred']}"
            except Exception as exc:
                errors.append(f"FRED: {exc}")
        dense = forward_fill_daily(raw, start, as_of)
        if dense:
            cache["series"][sym] = dense
            latest_date = dense[-1]["date"]
            source_status[sym] = {"source": source, "latest": latest_date}
            print(f"{sym}: {source} · {len(dense)} points through {latest_date}")
            if latest_date != as_of.isoformat():
                failures.append(f"{sym} source is stale: latest={latest_date}, expected={as_of}")
        else:
            source_status[sym] = {"source": "existing cache", "errors": errors}
            failures.append(f"{sym} fetch failed: {'; '.join(errors)}")
    cache["audit"] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "conclusion": "latest_points_verified" if not failures else "source_refresh_incomplete",
        "latest_verified_as_of": as_of.isoformat() if not failures else None,
        "sources": source_status,
        "non_trading_day_policy": "Non-crypto series are forward-filled only after a source observation exists.",
    }
    cache["note"] = "Daily dense local cache refreshed from Yahoo Finance with FRED official-series fallback."
    if not failures:
        cache["asOf"] = as_of.isoformat()
    save_cache(cache)
    if output_js:
        build_js(cache, as_of, output_js)
    print(f"updated {CACHE_FILE}" + (f" and {output_js}" if output_js else ""))
    if failures:
        raise SystemExit("market refresh incomplete:\n- " + "\n- ".join(failures))


if __name__ == "__main__":
    main()
