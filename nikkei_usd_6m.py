from __future__ import annotations

import csv
import json
import math
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


START = "2025-10-25"
END = "2026-04-25"
OUT = Path("reports/nikkei_1321_usd_6m.csv")
SUMMARY = Path("reports/nikkei_1321_usd_6m_summary.json")


def ts(date_text: str) -> int:
    return int(datetime.fromisoformat(date_text).replace(tzinfo=timezone.utc).timestamp())


def fetch_chart(symbol: str) -> dict:
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{symbol}?period1={ts(START)}&period2={ts(END)}"
        "&interval=1d&events=history&includeAdjustedClose=true"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "codex-data-check/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    error = payload.get("chart", {}).get("error")
    if error:
        raise RuntimeError(f"{symbol}: {error}")
    return payload["chart"]["result"][0]


def rows_from_chart(result: dict) -> list[dict]:
    quote = result["indicators"]["quote"][0]
    adjclose = result["indicators"].get("adjclose", [{}])[0].get("adjclose", quote["close"])
    exchange_tz = timezone(timedelta(seconds=result["meta"]["gmtoffset"]))
    rows = []
    for idx, epoch in enumerate(result["timestamp"]):
        date = datetime.fromtimestamp(epoch, tz=exchange_tz).date().isoformat()
        close = quote["close"][idx]
        adj = adjclose[idx] if idx < len(adjclose) else close
        if close is None:
            continue
        rows.append(
            {
                "date": date,
                "open": quote["open"][idx],
                "high": quote["high"][idx],
                "low": quote["low"][idx],
                "close": close,
                "adj_close": adj,
                "volume": quote["volume"][idx],
            }
        )
    return rows


def pct(a: float, b: float) -> float:
    return (b / a - 1.0) * 100.0


def main() -> int:
    OUT.parent.mkdir(exist_ok=True)
    etf = fetch_chart("1321.T")
    fx = fetch_chart("JPY=X")

    etf_rows = rows_from_chart(etf)
    fx_rows = rows_from_chart(fx)
    fx_by_date = {r["date"]: r for r in fx_rows}

    merged = []
    for r in etf_rows:
        fxr = fx_by_date.get(r["date"])
        if not fxr:
            continue
        usd_jpy = float(fxr["adj_close"])
        jpy_close = float(r["adj_close"])
        usd_close = jpy_close / usd_jpy
        merged.append(
            {
                "date": r["date"],
                "1321_t_close_jpy": round(jpy_close, 4),
                "usd_jpy": round(usd_jpy, 6),
                "1321_t_close_usd": round(usd_close, 6),
                "check_jpy_from_usd": round(usd_close * usd_jpy, 4),
                "1321_t_volume": r["volume"],
            }
        )

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(merged[0].keys()))
        writer.writeheader()
        writer.writerows(merged)

    first = merged[0]
    last = merged[-1]
    usd_values = [r["1321_t_close_usd"] for r in merged]
    jpy_values = [r["1321_t_close_jpy"] for r in merged]
    fx_values = [r["usd_jpy"] for r in merged]
    checksum_error = max(
        abs(r["1321_t_close_jpy"] - r["check_jpy_from_usd"]) for r in merged
    )
    summary = {
        "range_requested": {"start": START, "end": END},
        "range_available": {"start": first["date"], "end": last["date"]},
        "rows": len(merged),
        "formula": "1321_t_close_usd = 1321_t_close_jpy / usd_jpy",
        "first": first,
        "last": last,
        "jpy_return_pct": round(pct(first["1321_t_close_jpy"], last["1321_t_close_jpy"]), 4),
        "usd_return_pct": round(pct(first["1321_t_close_usd"], last["1321_t_close_usd"]), 4),
        "usd_jpy_change_pct": round(pct(first["usd_jpy"], last["usd_jpy"]), 4),
        "jpy_min": min(jpy_values),
        "jpy_max": max(jpy_values),
        "usd_min": round(min(usd_values), 6),
        "usd_max": round(max(usd_values), 6),
        "usd_jpy_min": round(min(fx_values), 6),
        "usd_jpy_max": round(max(fx_values), 6),
        "max_reconstruction_error_jpy": round(checksum_error, 8),
        "source_meta": {
            "etf": {
                "symbol": etf["meta"]["symbol"],
                "name": etf["meta"].get("longName"),
                "currency": etf["meta"].get("currency"),
                "last_price": etf["meta"].get("regularMarketPrice"),
                "last_time": etf["meta"].get("regularMarketTime"),
            },
            "fx": {
                "symbol": fx["meta"]["symbol"],
                "name": fx["meta"].get("longName"),
                "currency": fx["meta"].get("currency"),
                "last_price": fx["meta"].get("regularMarketPrice"),
                "last_time": fx["meta"].get("regularMarketTime"),
            },
        },
    }
    SUMMARY.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
