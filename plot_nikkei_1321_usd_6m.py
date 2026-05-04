from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path


CSV_PATH = Path("reports/nikkei_1321_usd_6m.csv")
OUT_PATH = Path("reports/nikkei_1321_usd_6m_indexed.svg")


def polyline(points: list[tuple[float, float]]) -> str:
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def nice_ticks(low: float, high: float, count: int = 6) -> list[float]:
    step = (high - low) / (count - 1)
    return [low + step * i for i in range(count)]


def main() -> int:
    rows = []
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(
                {
                    "date": datetime.fromisoformat(row["date"]),
                    "jpy": float(row["1321_t_close_jpy"]),
                    "usd": float(row["1321_t_close_usd"]),
                }
            )

    first_jpy = rows[0]["jpy"]
    first_usd = rows[0]["usd"]
    dates = [r["date"] for r in rows]
    jpy_index = [r["jpy"] / first_jpy * 100 for r in rows]
    usd_index = [r["usd"] / first_usd * 100 for r in rows]

    width = 1200
    height = 660
    left = 88
    right = 42
    top = 76
    bottom = 82
    plot_w = width - left - right
    plot_h = height - top - bottom

    ymin = min(min(jpy_index), min(usd_index))
    ymax = max(max(jpy_index), max(usd_index))
    ymin = int(ymin // 5 * 5)
    ymax = int((ymax + 4.999) // 5 * 5)

    def x_for(i: int) -> float:
        return left + i / (len(rows) - 1) * plot_w

    def y_for(v: float) -> float:
        return top + (ymax - v) / (ymax - ymin) * plot_h

    jpy_points = [(x_for(i), y_for(v)) for i, v in enumerate(jpy_index)]
    usd_points = [(x_for(i), y_for(v)) for i, v in enumerate(usd_index)]

    month_ticks = []
    seen_months = set()
    for i, date in enumerate(dates):
        key = date.strftime("%Y-%m")
        if key not in seen_months:
            seen_months.add(key)
            month_ticks.append((i, key))

    y_ticks = nice_ticks(ymin, ymax)
    start_note = f"Start: JPY {rows[0]['jpy']:,.0f}; USD {rows[0]['usd']:.2f}"
    end_note = f"End: JPY {rows[-1]['jpy']:,.0f} (+{jpy_index[-1] - 100:.2f}%); USD {rows[-1]['usd']:.2f} (+{usd_index[-1] - 100:.2f}%)"

    svg = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#202124}.axis{stroke:#424242;stroke-width:1}.grid{stroke:#d9d9d9;stroke-width:1}.tick{font-size:14px}.small{font-size:13px}.title{font-size:24px;font-weight:700}.subtitle{font-size:14px;fill:#555}</style>',
        '<text x="88" y="38" class="title">1321.T Nikkei 225 ETF: JPY vs USD Trend</text>',
        '<text x="88" y="60" class="subtitle">Indexed close price, first trading day = 100; 2025-10-27 to 2026-04-24</text>',
    ]

    for tick in y_ticks:
        y = y_for(tick)
        svg.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width - right}" y2="{y:.1f}" class="grid"/>')
        svg.append(f'<text x="{left - 14}" y="{y + 5:.1f}" text-anchor="end" class="tick">{tick:.0f}</text>')

    for i, label in month_ticks:
        x = x_for(i)
        svg.append(f'<line x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{height - bottom}" class="grid" opacity="0.55"/>')
        svg.append(f'<text x="{x:.1f}" y="{height - 45}" text-anchor="middle" class="tick">{label}</text>')

    svg.extend(
        [
            f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height - bottom}" class="axis"/>',
            f'<line x1="{left}" y1="{height - bottom}" x2="{width - right}" y2="{height - bottom}" class="axis"/>',
            f'<line x1="{left}" y1="{y_for(100):.1f}" x2="{width - right}" y2="{y_for(100):.1f}" stroke="#666" stroke-width="1.2" stroke-dasharray="5 5" opacity="0.7"/>',
            f'<polyline points="{polyline(jpy_points)}" fill="none" stroke="#1f77b4" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
            f'<polyline points="{polyline(usd_points)}" fill="none" stroke="#d62728" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
            '<rect x="88" y="88" width="294" height="74" rx="6" fill="#fff" stroke="#cfcfcf"/>',
            '<line x1="108" y1="116" x2="154" y2="116" stroke="#1f77b4" stroke-width="4" stroke-linecap="round"/>',
            '<text x="166" y="121" class="small">1321.T priced in JPY</text>',
            '<line x1="108" y1="142" x2="154" y2="142" stroke="#d62728" stroke-width="4" stroke-linecap="round"/>',
            '<text x="166" y="147" class="small">1321.T converted to USD</text>',
            f'<rect x="88" y="{height - 146}" width="420" height="52" rx="6" fill="#fff" stroke="#cfcfcf" opacity="0.95"/>',
            f'<text x="106" y="{height - 124}" class="small">{start_note}</text>',
            f'<text x="106" y="{height - 102}" class="small">{end_note}</text>',
            f'<text transform="translate(28 {top + plot_h / 2:.1f}) rotate(-90)" text-anchor="middle" class="tick">Indexed price</text>',
            f'<text x="{left + plot_w / 2:.1f}" y="{height - 12}" text-anchor="middle" class="tick">Date</text>',
            '</svg>',
        ]
    )

    OUT_PATH.parent.mkdir(exist_ok=True)
    OUT_PATH.write_text("\n".join(svg), encoding="utf-8")
    print(OUT_PATH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
