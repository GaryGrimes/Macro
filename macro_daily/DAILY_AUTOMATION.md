# Macro 看板每日自动化任务

本任务用于支撑首页的 `Rate Shock Tape`、`Market Narrative Ranking`、`Duration Action Panel` 和 `Technical Exhaustion Panel`。首页只负责读取本地结果；每日任务负责拉数据、计算、归因、调用模型深度分析，并把结构化 JSON 与研报保存到本地。

## 必读上下文

自动化任务不能读取用户与 Codex 的聊天上下文。每次执行前，必须先读取以下本地文件作为长期记忆：

```text
macro_daily/PRODUCT_SPEC.md
macro_daily/DAILY_AUTOMATION.md
```

`PRODUCT_SPEC.md` 记录产品定位、保留边界、首页模块顺序和用户真实需求；本文件记录每日任务的执行步骤、计算口径和输出契约。若二者冲突，以 `PRODUCT_SPEC.md` 的产品边界优先，以本文件的计算细节执行。

## 输出文件

每日任务必须生成两类文件，日期使用本地运行日：

```text
macro_daily/data/YYYY-MM-DD_dashboard.json
macro_daily/reports/YYYY-MM-DD_rates_duration_report.md
```

如果要生成可直接浏览的报告，可以额外输出：

```text
macro_daily/reports/YYYY-MM-DD_rates_duration_report.html
```

首页检查逻辑：

- 同时存在 `dashboard.json` 和 `.md` 或 `.html` 研报时，首页读取本地 JSON。
- 缺任意一个文件时，首页显示横幅提醒去 Codex 执行本任务。
- 当天多次打开页面，优先复用本地文件，不重复触发远端分析。

## 每日执行步骤

1. 确认日期与覆盖市场日

   - `runDate` 使用本地日期。
   - `marketDate` 使用最新可确认的美国利率数据日期。
   - 如果美国市场休市，必须在 JSON 和研报中标注“无新完整交易日”，不要伪造日内变化。

2. 本地加载与更新数据

   优先使用项目现有 `.cache` 和 `server.js` 数据代理；缺口再补远端源。

   必需数据：

   - Treasury nominal curve：`DGS2 / DGS3 / DGS5 / DGS10 / DGS30`
   - Treasury real yields：`DFII5 / DFII10 / DFII30`，如果 30Y real yield 不稳定则标注 proxy
   - Breakevens：`T5YIE / T10YIE / T5YIFR`
   - Risk and volatility：`MOVE / VIX / HY spread / DXY / Gold / Oil / Copper`
   - Policy path：SOFR futures、Fed funds futures implied cuts；若暂未接入，先写 `unavailable`
   - Term premium：ACM 或 Kim-Wright；若暂未接入，用 `5s30s / 10s30s / auction` proxy 并标注
   - Auction：tail、bid-to-cover、dealer take-down；若没有当日 auction，写 `no auction today`
   - Technical：US10Y/US30Y 九转、RSI、Bollinger z-score、20D move percentile、MOVE

3. 计算 Rate Shock Tape

   对 `DGS2 / DGS3 / DGS5 / DGS10 / DGS30` 计算：

   - level
   - `1D / 5D / 21D / 3M` bp change
   - 近 10 年 percentile
   - 2022-01-01 之后 regime percentile
   - rolling realized volatility adjusted z-score
   - signal：`policy path shock / duration selloff / long-end stress / bull rally / mixed`

4. 计算曲线形态与驱动归因

   曲线：

   - `3s10s = DGS10 - DGS3`
   - `5s30s = DGS30 - DGS5`
   - `10s30s = DGS30 - DGS10`
   - 标签：bear flattening、bear steepening、bull steepening、bull flattening、mixed

   驱动：

   - `ΔDGS5 = ΔDFII5 + ΔT5YIE`
   - `ΔDGS10 = ΔDFII10 + ΔT10YIE`
   - `30Y` 用 real yield、term premium、curve steepening 和 auction proxy 归因

5. 生成 Market Narrative Ranking

   六类叙事固定为：

   - Fed path repricing
   - Inflation compensation shock
   - Growth scare / recession hedge
   - Long-end term premium / fiscal supply
   - Risk appetite / liquidity shock
   - Technical positioning / exhaustion

   每类输出：

   - `score`: 0 到 3
   - `updatedAt`: 最新证据时间
   - `core`: 核心叙事一句话
   - `checks`: 证据清单
   - `interpretation`: 信号解释
   - `evidence`: 可选，按权重再按时间倒序列出核心证据

6. 生成 Duration Action Panel

   固定六档：

   - `0 No trade / wait`
   - `1 Watchlist only`
   - `2 Start 10Y nibble`
   - `3 Add 10Y / intermediate`
   - `4 Add long-end duration`
   - `5 Add convex duration`

   每天必须输出：

   - 当前档位
   - 为什么是当前档位
   - 支持条件
   - 反对条件
   - 什么信号会升级或降级档位

7. 生成 Technical Exhaustion Panel

   输出每项读数与状态：

   - US10Y 九转
   - US30Y 九转
   - RSI
   - Bollinger z-score
   - 20D move percentile
   - MOVE index
   - CFTC Treasury futures positioning
   - Timing overlay

   结论必须和基本面叠加，不允许单靠技术指标给出加仓建议。

8. 写研报

   研报顺序：

   - 今日一句话结论
   - 利率冲击是否罕见
   - 哪段曲线在动
   - 驱动归因
   - 市场正在交易什么分歧
   - 叙事是否过度外推
   - duration 动作建议
   - 需要证伪/确认的下一批数据

## 模块定义与计算手册

以下规则是每日任务的固定口径。除非用户明确修改，不要在日报里临时换算法。

### 通用计算约定

- 所有利率水平使用百分比点，例如 `4.52%`。
- 所有利率变化使用 bp，例如 `+12bp`。
- `1D / 5D / 21D / 3M` 分别表示相对最近有效交易日之前 `1 / 5 / 21 / 63` 个有效观测点的变化。
- 遇到周末、节假日或缺失值，用最近有效观测点做比较，不要用自然日空值计算变化。
- `近10年 percentile` 使用最近有效日期向前 10 年的历史样本。
- `2022+ regime percentile` 使用 `2022-01-01` 之后的样本。
- 对于正向利率变化，percentile 衡量“上行幅度在历史上有多极端”；对于负向变化，percentile 衡量“下行幅度在历史上有多极端”。因此 `+30bp 95%` 和 `-30bp 95%` 都表示同方向极端。
- 如果某项数据源缺失，字段写 `unavailable`，研报中必须说明该结论使用了 proxy，不要假装有完整数据。

### Module 1：Rate Shock Tape

定义：判断美债各期限收益率在 `1D / 5D / 21D / 3M` 是否出现异常波动，以及异常集中在短端、中端还是长端。

覆盖期限：

```text
DGS2 / DGS3 / DGS5 / DGS10 / DGS30
```

核心公式：

```text
level_t = latest yield
change_h_bp = (yield_t - yield_t-h) * 100
```

方向分位：

```text
if change_h_bp >= 0:
  percentile = rank(change_h_bp among historical positive h-day changes)
else:
  percentile = rank(abs(change_h_bp) among historical absolute negative h-day changes)
```

波动调整 z-score：

```text
daily_change_bp = daily yield change in bp
rolling_vol_63d = stdev(daily_change_bp over trailing 63 observations)
horizon_vol = rolling_vol_63d * sqrt(h)
z_score_h = change_h_bp / horizon_vol
```

默认展示 `5D z-score`；如果当日冲击特别大，可在研报中额外解释 `1D z-score`。

Signal 标签规则：

- `policy path shock`：`DGS2 / DGS3` 上行领先，且 `3Y move > 10Y move > 30Y move`。
- `duration selloff`：`DGS10` 上行进入高分位，且 3Y/30Y 没有明显独立领先。
- `long-end stress`：`DGS30` 上行领先，且 `5s30s` 或 `10s30s` steepening。
- `bull rally`：各期限显著下行，尤其 `10Y / 30Y` 下行进入高分位。
- `mixed`：期限间方向不一致或变化幅度不足。

输出到首页的每行字段：

```json
{
  "tenor": "10Y",
  "level": "4.52%",
  "d1": "+12bp",
  "d1Pctile": "94%",
  "d5": "+31bp",
  "d5Pctile": "96%",
  "d21": "+58bp",
  "d21Pctile": "91%",
  "regimePctile": "74%",
  "zScore": "+2.1",
  "signal": "duration selloff"
}
```

### Module 2：Curve Shape

定义：判断市场冲击来自短端政策路径、中端真实利率，还是长端 term premium / fiscal supply。

固定曲线：

```text
3s10s = DGS10 - DGS3
5s30s = DGS30 - DGS5
10s30s = DGS30 - DGS10
```

默认用 `5D` 变化判断形态；如果 `1D` 是重大事件日，研报中同时给 `1D` 形态。

标签规则，默认容忍阈值为 `3bp`：

- `bear flattening`：收益率整体上行，且 `DGS3 up > DGS10 up > DGS30 up`。含义是 Fed path / cuts fewer / higher for longer。
- `bear steepening`：收益率整体上行，且 `DGS30 up > DGS10 up > DGS3 up`。含义是 long-end term premium / fiscal supply / duration demand 出问题。
- `bull steepening`：收益率整体下行，且 `DGS3 down > DGS10 down > DGS30 down`。含义是 Fed cuts / growth scare。
- `bull flattening`：收益率整体下行，且 `DGS30 down > DGS10 down > DGS3 down`。含义是长期通胀、财政担忧缓和或长端需求回归。
- `twist / mixed`：短端和长端方向不同，或排序没有超过阈值。

研报必须解释“这对 10Y vs 30Y 的含义”。特别是 `bear steepening` 时，不要把高 30Y yield 机械解释成买点。

### Module 3：Driver Attribution

定义：把名义利率变动拆成 real yield、breakeven inflation compensation 和 term premium / residual，判断这波利率是否适合逆向。

5Y 与 10Y 固定公式：

```text
ΔDGS5  = ΔDFII5  + ΔT5YIE  + residual_5Y
ΔDGS10 = ΔDFII10 + ΔT10YIE + residual_10Y
```

其中：

```text
residual = Δnominal - Δreal_yield - Δbreakeven
```

贡献度口径：

```text
abs_total = abs(real_contribution) + abs(breakeven_contribution) + abs(residual)
share = abs(component) / abs_total
```

输出时同时保留方向，例如：

```text
10Y 5D move +31bp:
real yield +19bp / 61%
breakeven +6bp / 19%
residual +6bp / 19%
```

30Y 归因规则：

- 首选：`DGS30 / DFII30 / 30Y breakeven / ACM or Kim-Wright term premium`。
- 如果 30Y breakeven 或 term premium 缺失，使用 proxy：
  - `10s30s` steepening
  - `5s30s` steepening
  - auction tail / bid-to-cover
  - MOVE index
  - swap spread changes
- 使用 proxy 时，JSON 和研报必须写 `proxyUsed: true`。

解释规则：

- `real-yield-led selloff`：real yield 贡献最大，通常更像折现率冲击。
- `breakeven-led selloff`：breakeven 贡献最大，但必须加一句 `watch second-round transmission to real yield`。
- `term-premium-led selloff`：30Y 或曲线 steepening 独立恶化，先谨慎加长端。
- `growth-led rally`：real yield 与 breakeven 同时下行，偏 growth scare / recession hedge。

### Module 4：Market Narrative Ranking

定义：把市场正在交易的分歧转成六类可排序叙事。它不是新闻列表，而是规则化归因系统。

固定六类：

```text
1. Fed path repricing
2. Inflation compensation shock
3. Growth scare / recession hedge
4. Long-end term premium / fiscal supply
5. Risk appetite / liquidity shock
6. Technical positioning / exhaustion
```

Score 规则：

```text
0 = 无信号或数据不足
1 = 弱信号：只有一个核心证据，或证据方向不完全一致
2 = 中信号：至少两个核心证据一致，且有一个价格/曲线信号确认
3 = 强信号：多个核心证据一致，跨资产或分位数极端确认，且叙事在 1D/5D 中持续
```

排序规则：

```text
先按 score 从高到低排序；
score 相同则按 evidence weight 从高到低；
仍相同则按 updatedAt 时间倒序。
```

各类检查项：

Fed path repricing：

- `DGS2 / DGS3` 上行。
- SOFR futures 隐含降息次数减少。
- Fed funds futures terminal / cuts repricing。
- `2s5s` flattening。
- real yield 上行。
- 判读：如果 3Y 明显上行，且 10Y/30Y 跟随有限，市场主要在重定价 Fed path。

Inflation compensation shock：

- `T5YIE / T10YIE / T5YIFR` 上行。
- oil / gasoline / commodity basket 上行。
- UMICH1 或其他 survey inflation surprise。
- breakeven 贡献高于 real yield。
- 判读：如果 breakeven 上行贡献大而 real yield 稳定，是 inflation compensation shock，但要看是否二阶传导到 Fed path。

Growth scare / recession hedge：

- `DGS10` 下行。
- real yield 下行。
- breakeven 下行。
- oil / copper 下行。
- HY spread widening。
- equity cyclicals underperform。
- USD / JPY / gold 出现 risk-off。
- 判读：如果利率下行不是因为通胀锚定，而是增长风险上升，长债可能表现好，但权益风险不一定低。

Long-end term premium / fiscal supply：

- `30Y up > 10Y up > 5Y up`。
- `5s30s / 10s30s` steepening。
- ACM / Kim-Wright term premium 上行。
- Treasury auction tail 扩大。
- bid-to-cover 偏弱。
- dealer balance sheet stress。
- MOVE index 上行。
- swap spread changes。
- 判读：如果 30Y 独立走弱，这不是普通 Fed path 问题，而是长端 duration supply / fiscal risk / term premium 问题。

Risk appetite / liquidity shock：

- VIX / MOVE 上行。
- credit spread widening。
- equity breadth 走弱。
- DXY 或美元融资压力上行。
- safe-haven demand 上升。
- 判读：如果风险资产和波动率同步恶化，利率信号要和流动性压力一起读。

Technical positioning / exhaustion：

- US10Y / US30Y 九转接近 8 或 9。
- RSI 极端。
- Bollinger z-score 极端。
- 20D move percentile 极端。
- CFTC Treasury futures positioning 拥挤。
- 判读：只做 timing overlay，不做 thesis。

Narrative JSON 字段：

```json
{
  "id": "term_premium",
  "title": "Long-end term premium / fiscal supply",
  "score": 3,
  "updatedAt": "2026-05-11",
  "core": "30Y-led selloff points to long-end supply stress.",
  "checks": ["30Y up > 10Y up > 5Y up", "10s30s steepening", "MOVE up"],
  "interpretation": "This argues against jumping straight into 30Y duration.",
  "evidence": [
    {
      "time": "2026-05-11",
      "weight": 3,
      "text": "30Y 5D move is in the 96th percentile and 10s30s steepened."
    }
  ]
}
```

### Module 5：Duration Action Panel

定义：把前面所有诊断落到可执行的 duration 建仓档位。

固定档位：

```text
0. No trade / wait
1. Watchlist only
2. Start 10Y nibble
3. Add 10Y / intermediate duration
4. Add long-end duration
5. Add convex duration / STRIPS-like exposure
```

决策优先级：

1. 先检查是否存在 `不要加长端` 的否决条件。
2. 再判断是否满足 `加 10Y`。
3. 再判断是否满足 `加 30Y / long-end`。
4. 最后才判断是否升级到 `convex duration`。

Rule A：优先加 10Y

- `10Y` yield 上行进入高分位，默认 `5D 或 21D >= 85%`。
- real yield 是主导贡献。
- Fed path repricing 接近充分，短端不再继续明显领涨。
- `30Y` 没有明显独立恶化。
- 技术面显示 exhaustion。
- 动作含义：`2 Start 10Y nibble` 或 `3 Add 10Y`。

Rule B：谨慎加 30Y

- `30Y` 上行极端，默认 `5D 或 21D >= 90%`，更理想是 `>= 95%`。
- `10s30s / 5s30s` steepening 停止。
- term premium 上行放缓。
- auction 没继续恶化。
- growth scare 或 disinflation 信号开始出现。
- 技术面 exhaustion。
- 动作含义：`4 Add long-end duration`。

Rule C：不要加长端

- `30Y up > 10Y up`。
- `10s30s` steepening。
- term premium rising。
- auction weak。
- MOVE rising。
- fiscal supply narrative strengthening。
- 动作含义：即使绝对收益率很高，也不升到 `4` 或 `5`。

Rule D：可以逆向试仓

- `1W / 1M` 利率上行极端。
- 主流叙事单一且拥挤。
- 驱动没有继续恶化。
- 九转顶部。
- RSI / z-score 极端。
- 市场叙事与高维约束存在明确分歧。
- 动作含义：通常先 `2 Start 10Y nibble`，除非 Rule B 也满足。

当前档位选择：

```text
0 No trade:
  利率涨幅不极端，或 3Y/30Y 仍在加速，或 MOVE/term premium/auction 继续恶化。

1 Watchlist only:
  信号混合、数据不足、或只满足部分条件。

2 Start 10Y nibble:
  10Y 冲击进入高分位，驱动开始清楚，技术面支持试仓，但仍有长端风险。

3 Add 10Y:
  10Y 冲击极端，real yield 或 Fed path repricing 已较充分，长端风险没有继续恶化。

4 Add long-end duration:
  30Y 冲击极端且 term premium / curve steepening 开始稳定。

5 Add convex duration:
  Rule B 满足，同时出现 bull flattening、growth scare/disinflation 确认、技术衰竭和叙事反转。
```

### Module 6：Technical Exhaustion Panel

定义：判断短期走势是否过度单边，只作为建仓 timing overlay。

US10Y / US30Y 九转 proxy：

```text
up_count:
  if yield_t > yield_t-4 then previous up_count + 1 else 0

down_count:
  if yield_t < yield_t-4 then previous down_count + 1 else 0
```

解释：

- `up_count 8-9`：收益率上行趋势可能进入顶部衰竭区，对 duration nibble 有 timing 支持。
- `down_count 8-9`：收益率下行趋势可能进入底部衰竭区，不适合追多 duration。
- 这是 Futu 九转的近似 proxy；如果未来接入真实九转源，应在 JSON 中标注 `source: futu` 或 `source: proxy`。

RSI：

```text
RSI_14 = 100 - 100 / (1 + avg_gain_14 / avg_loss_14)
```

对收益率而言：

- `RSI > 70`：收益率短期超买，duration 可能有反弹 timing。
- `RSI < 30`：收益率短期超卖，不宜追 duration。

Bollinger z-score：

```text
bollinger_z = (yield_t - moving_average_20d) / stdev_20d
```

判读：

- `z > +2`：收益率上行 extension。
- `z < -2`：收益率下行 extension。

20D move percentile：

- 用 `20D` 收益率变化和历史同方向变化比较。
- `>= 90%` 表示短期趋势很拥挤。

MOVE index：

- MOVE 上行且处于高分位：rates vol 仍在放大，长端建仓要谨慎。
- MOVE 回落：技术面更支持试仓或加仓。

最终建议规则：

- 只有技术衰竭，没有基本面归因：输出 `Timing signal only; no standalone trade`。
- 技术衰竭 + 10Y 冲击极端 + term premium 未失控：支持 `Start 10Y nibble`。
- 技术衰竭 + 30Y 冲击极端 + steepening 停止：支持 `Add long-end duration`。
- 技术衰竭缺失且叙事仍在强化：输出 `Wait for exhaustion or narrative break`。

## 模型分析输入与输出约束

每日任务可以调用 GPT/Codex 做深度分析，但必须先把计算好的结构化数据传给模型。模型不得凭空补数据。

推荐输入包：

```json
{
  "runDate": "2026-05-12",
  "marketDate": "2026-05-11",
  "rateShockTape": [],
  "curveShape": {},
  "driverAttribution": {},
  "crossAssetSignals": {},
  "technicalSignals": {},
  "dataGaps": []
}
```

模型输出必须包含两份内容：

- 结构化 `dashboard.json`，供首页读取。
- Markdown 研报，供人工复盘。

模型必须遵守：

- 不用“今天/昨天”，全部写具体日期。
- 对缺失数据写 `unavailable` 或 `proxyUsed`。
- 不把技术指标当作单独交易理由。
- 不把 30Y 高收益率机械解读为买点，必须先检查 bear steepening / term premium。
- 每个 duration 动作都必须写支持条件和反对条件。

## 首页 JSON schema

`macro_daily/data/YYYY-MM-DD_dashboard.json` 至少包含：

```json
{
  "date": "2026-05-12",
  "marketDate": "2026-05-11",
  "source": "macro_daily automation",
  "generatedAt": "2026-05-12T08:30:00+08:00",
  "reportTitle": "Rates shock is led by long-end term premium",
  "reportSummary": "10Y/30Y moves are elevated, but 30Y term premium is still the binding risk.",
  "rateShockRows": [],
  "narratives": [],
  "durationAction": {},
  "technical": {}
}
```

首页会容错读取缺失字段，但每日任务不应依赖容错；字段缺失代表任务未完整完成。

## 交付前检查

每日任务结束前必须检查：

- JSON 可被 `JSON.parse` 解析。
- 今日 JSON 和今日研报同时存在。
- `rateShockRows` 至少包含 `2Y / 3Y / 5Y / 10Y / 30Y`。
- `narratives` 必须包含六类固定叙事，且 `score` 在 0 到 3 之间。
- `durationAction.currentIndex` 在 0 到 5 之间。
- 所有报告中的日期必须写具体日期，不写“今天/昨天”这种相对日期。
