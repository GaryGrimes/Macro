from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import csv


OUT_DIR = Path("/Users/kshen/Documents/Macro/reports")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PNG_PATH = OUT_DIR / "asset_channel_increment_2026q1.png"
CSV_PATH = OUT_DIR / "asset_channel_increment_chart_data.csv"


categories = [
    "居民活期",
    "居民定期",
    "银行理财",
    "公募基金",
    "私募证券\n基金",
    "保费收入",
    "非银存款",
]

# 2020-2025 are visual estimates read from the reference chart.
# 2026 is calculated from public data through 2026Q1 / 2026.03.
data = {
    "2020": [2.3, 8.0, 3.0, 3.5, 1.8, 4.0, 1.5],
    "2021": [0.0, 8.0, 4.0, 5.0, 2.3, 3.9, 4.4],
    "2022": [1.9, 12.0, 3.0, 1.0, -0.6, 4.2, 1.9],
    "2023": [-0.6, 15.0, -0.4, 1.2, 0.3, 4.5, 1.4],
    "2024": [0.3, 14.5, 3.0, 3.9, 0.1, 5.1, 6.3],
    "2025": [1.0, 11.0, 3.9, 4.2, 1.8, 5.8, 6.7],
    "2026": [1.16, 6.53, -1.38, -0.18, 0.38, 2.31, 2.32],
}

notes = {
    "2020-2025": "由原图柱高预估；2025红柱已用公开口径复算验证。",
    "2026": (
        "截至2026年3月：存款分项为央行人民币信贷收支表较2025年末净增；"
        "理财、公募、私募为规模较2025年末净增；保费收入为一季度累计流量。"
    ),
}

colors = {
    "2020": "#241b1f",
    "2021": "#54575a",
    "2022": "#8f9092",
    "2023": "#b8b8bb",
    "2024": "#e6e6e6",
    "2025": "#e6472e",
    "2026": "#2f6bd7",
}


def font(size, weight="regular"):
    if weight == "bold":
        return ImageFont.truetype("/System/Library/Fonts/STHeiti Medium.ttc", size)
    return ImageFont.truetype("/System/Library/Fonts/STHeiti Light.ttc", size)


def text_size(draw, text, fnt):
    box = draw.multiline_textbbox((0, 0), text, font=fnt, spacing=8)
    return box[2] - box[0], box[3] - box[1]


def draw_centered(draw, xy, text, fnt, fill="#666666", spacing=8):
    x, y = xy
    w, _ = text_size(draw, text, fnt)
    draw.multiline_text((x - w / 2, y), text, font=fnt, fill=fill, align="center", spacing=spacing)


def fmt_value(v):
    if abs(v) >= 10:
        return f"{v:.0f}"
    return f"{v:.1f}".rstrip("0").rstrip(".")


W, H = 1900, 1320
img = Image.new("RGB", (W, H), "#f7f7f7")
draw = ImageDraw.Draw(img)

title_font = font(58, "bold")
subtitle_font = font(33, "regular")
legend_font = font(31, "regular")
axis_font = font(29, "regular")
small_font = font(25, "regular")
label_font = font(32, "regular")

# Header
draw.line((0, 4, W, 4), fill="#111111", width=5)
draw.text((45, 75), "居民定期存款以外的资管渠道资金增量上升", font=title_font, fill="#080808")
draw.line((0, 185, W, 185), fill="#111111", width=3)

draw.text((45, 300), "2020年至2025年每年前11个月各类资金增量；新增2026年截至3月数据", font=subtitle_font, fill="#111111")
draw.text((1635, 375), "单位：万亿元", font=legend_font, fill="#111111")

# Legend
legend_x = 45
legend_y = 370
for year in data:
    draw.rectangle((legend_x, legend_y, legend_x + 36, legend_y + 36), fill=colors[year])
    if year == "2024":
        draw.rectangle((legend_x, legend_y, legend_x + 36, legend_y + 36), outline="#cfcfcf", width=1)
    draw.text((legend_x + 50, legend_y - 2), year, font=legend_font, fill="#222222")
    legend_x += 200 if year != "2026" else 0

# Plot area
left, right = 140, 1840
top, bottom = 470, 1010
y_min, y_max = -3, 16


def y_to_px(v):
    return bottom - (v - y_min) / (y_max - y_min) * (bottom - top)


grid_values = [-3, 0, 3, 6, 9, 12, 15]
for gv in grid_values:
    y = y_to_px(gv)
    if gv == 0:
        draw.line((left, y, right, y), fill="#777777", width=2)
    else:
        draw.line((left, y, left + 120, y), fill="#777777", width=2)
    draw.text((45, y - 18), str(gv), font=axis_font, fill="#666666")

years = list(data.keys())
group_w = (right - left) / len(categories)
bar_w = 19
gap = 8
cluster_w = len(years) * bar_w + (len(years) - 1) * gap
zero_y = y_to_px(0)

for ci, cat in enumerate(categories):
    cx = left + group_w * (ci + 0.5)
    start_x = cx - cluster_w / 2
    for yi, year in enumerate(years):
        val = data[year][ci]
        x0 = start_x + yi * (bar_w + gap)
        x1 = x0 + bar_w
        yv = y_to_px(val)
        y0, y1 = (yv, zero_y) if val >= 0 else (zero_y, yv)
        draw.rectangle((x0, y0, x1, y1), fill=colors[year])
        if year == "2024":
            draw.rectangle((x0, y0, x1, y1), outline="#cfcfcf", width=1)

        if year in ("2025", "2026"):
            txt = fmt_value(val)
            tw, th = text_size(draw, txt, label_font)
            ty = yv - th - 9 if val >= 0 else yv + 8
            fill = "#111111" if year == "2025" else colors["2026"]
            draw.text((x0 + bar_w / 2 - tw / 2, ty), txt, font=label_font, fill=fill)

    draw_centered(draw, (cx, bottom + 55), cat, axis_font, fill="#686868")

# Notes and sources
note_y = 1155
draw.text((45, note_y), "注：保费收入为累计流量；存款、理财、基金、私募口径为余额/净值/存续规模净增，彼此不完全可比。", font=small_font, fill="#777777")
draw.text((45, note_y + 60), "2020-2025为根据原图读取的近似值；2026为已披露最新数据，截至2026年3月。", font=small_font, fill="#777777")
draw.text((45, note_y + 120), "资料来源：央行、中基协、银行业理财登记托管中心、中国保险行业协会/金融监管总局公开披露；原图：Wind、普益标准、中金公司研究部。", font=small_font, fill="#777777")

img.save(PNG_PATH)

with CSV_PATH.open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.writer(f)
    writer.writerow(["category", *data.keys()])
    for i, cat in enumerate(categories):
        writer.writerow([cat.replace("\n", "")] + [data[year][i] for year in data])
    writer.writerow([])
    writer.writerow(["note", notes["2020-2025"]])
    writer.writerow(["note", notes["2026"]])

print(PNG_PATH)
print(CSV_PATH)
