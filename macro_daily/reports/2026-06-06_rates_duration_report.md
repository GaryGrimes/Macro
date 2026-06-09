# 2026-06-06 Rates Duration Report

## 2026-06-06 一句话结论

2026-06-05 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 +10bp，DGS30 5D 为 +2bp。 曲线是 bear flattening，技术衰竭没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-06-05。Latest confirmed U.S. rates data is 2026-06-05; 2026-06-06 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-06-05 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-06-05. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- Treasury-derived T5YIFR proxy: inflation-forward cross-check; latestDate 2026-06-05; proxyUsed: true. T5YIFR uses a Treasury-derived local proxy for 2026-06-05 because FRED T5YIFR cache ends on 2026-05-22.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-06-05. CNN Fear & Greed is fear as of 2026-06-05; VIX is neutral and junk bond demand / HY OAS is extreme fear.
- FRED public market data cache: public history and cross-asset feed; latestDate 2026-05-18. Loaded 18 public series for rate history and cross-asset checks.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.17% | +12bp | +19bp | +30bp | +61bp | 84% | 1.6 |
| DGS3 | 4.22% | +12bp | +16bp | +33bp | +64bp | 5D 79%; 3M 76% | 1.3 |
| DGS5 | 4.29% | +11bp | +16bp | +30bp | +58bp | 5D 79%; 3M 74% | 1.3 |
| DGS10 | 4.55% | +8bp | +10bp | +19bp | +43bp | 5D 63%; 3M 67% | 0.9 |
| DGS30 | 5.01% | +4bp | +2bp | +7bp | +29bp | 5D 17%; 3M 52% | 0.2 |

分位数使用 1962-01-02 到 2026-06-05 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。

## 市场 2026-06-05 在交易什么

覆盖窗口：2026-06-05 to 2026-06-06。状态：ready。
摘要：2026-06-05 的市场反应主线是非农就业强于预期后，市场重新交易 higher-for-longer / 更少降息，美债收益率上行压制权益估值；其中 AI beta、半导体和高估值成长股对实际利率与折现率上行更敏感，因此在风险偏好层面承压。本地 rates cache 已覆盖 2026-06-05，曲线 tape 显示短中端上行更强、10Y 上行、30Y 跟随有限，和 Fed path / real-yield discount-rate shock 叙事一致。
来源结构：官方：1 条 / 25%；媒体：4 条 / 69%；社群：1 条 / 7%

1）非农超预期 / Fed path 重新定价: 42% - 2026-06-05 的核心冲击是就业数据强于预期，使市场减少对近期降息的定价，并把利率上行解释为 policy path / higher-for-longer 重新定价。该主题与本地规则中的 Fed path repricing 对应；本地曲线 tape 的 3Y/5Y 上行强于 30Y，进一步支持短中端政策路径和 real-yield 折现率冲击是主线。
   - 官方 / U.S. Bureau of Labor Statistics / 2026-06-05: BLS 发布 2026-06-05 Employment Situation，提供 2026年5月就业、失业率和工资数据，是非农冲击的官方基础输入。
   - 媒体 / Reuters / 2026-06-05: Reuters 市场报道把强于预期的就业数据与美债收益率上行、降息预期降温和风险资产承压联系起来，支持 policy path repricing 作为当日主导叙事。
2）实际利率 / 折现率上行压制 AI beta 成长估值: 28% - 非农强劲本身不是增长衰退冲击，而是通过收益率和实际折现率上行压制高估值成长股；AI beta、半导体和长久期成长资产对折现率更敏感，因此权益 selloff 的风险偏好层面应归入 Risk appetite / liquidity shock，而不是简单写成 recession hedge。
   - 媒体 / MarketWatch / 2026-06-05: MarketWatch 对 2026-06-05 美股走势的报道把就业数据、收益率上行和成长股估值压力联系起来；这支持 AI beta / 高估值成长股受折现率冲击影响的解释。
   - 媒体 / CNBC / 2026-06-05: CNBC 市场报道显示强就业数据后科技和高成长板块承压，交易员把收益率上行视为估值压力来源；该证据用于风险偏好和 AI beta 成长估值压力主题。
3）美债收益率上行 / 短中端政策路径主导: 18% - 外部报道显示非农后美债收益率上行；本地曲线 tape 已覆盖 2026-06-05，显示 3Y/5Y 5D 上行更强、10Y 上行、30Y 跟随有限，形态更接近 bear flattening / policy path shock，而不是 30Y 独立 term-premium stress。
   - 媒体 / Reuters / 2026-06-05: Reuters rates/bonds 报道把就业数据后美债收益率上行和政策预期重定价放在同一条线索下；本地看板的 2026-06-05 曲线 tape 显示短中端上行更强，可作为该叙事的价格确认。
4）社群交易口径：AI / 半导体拥挤交易降温: 12% - 交易员和社群讨论把就业数据后的收益率上行解读为对 crowded AI beta / 半导体多头的估值压力；该口径和权威媒体的成长股承压叙事一致，但社群权重低于官方和权威媒体。
   - 社群 / Trader commentary / social discussion / 2026-06-05: 社群和交易员口径集中讨论强非农、收益率上行与 AI / 半导体高估值交易降温之间的关系；该证据只作为低权重辅助，不能单独决定主导叙事。

外部叙事与本地 tape 差异：外部覆盖把 非农超预期 / Fed path 重新定价 / 实际利率 / 折现率上行压制 AI beta 成长估值 排在最高权重，但本地 5D 归因显示 5Y 由 real-yield 主导、10Y 由 real-yield 主导；10Y breakeven 贡献为 -2bp，所以本报告把 inflation / Fed-path 叙事视为市场消化过程，而不是 breakeven 主导 tape 的证明。

## 哪段曲线在动

5D 比较日期是 2026-05-29。DGS3 +16bp，DGS5 +16bp，DGS10 +10bp，DGS30 +2bp。3s10s 为 33bp，5D 变化 -6bp；5s30s 为 72bp，5D 变化 -14bp；10s30s 为 46bp，5D 变化 -8bp。

含义：Short/intermediate policy-path repricing is stronger than long-end stress; 10Y is cleaner than 30Y if a shock window appears.

事件背景：外部叙事日期和本地曲线日期没有明显错位。 主要事件叙事是：非农超预期 / Fed path 重新定价（42%）；实际利率 / 折现率上行压制 AI beta 成长估值（28%）；美债收益率上行 / 短中端政策路径主导（18%）。 曲线形态和外部叙事日期一致或外部叙事不可用。

## 驱动归因

5Y 5D move +16bp: real yield +20bp / 83%, breakeven -4bp / 17%, residual 0bp / 0%。

10Y 5D move +10bp: real yield +12bp / 86%, breakeven -2bp / 14%, residual 0bp / 0%。

30Y 5D move +2bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

模块2联动证据：Module 3 confirms Module 2: the selloff is short/intermediate-led and real-yield-led, matching a nonfarm / Fed-path discount-rate shock rather than a 30Y term-premium shock. Module 1.5 top themes: 非农超预期 / Fed path 重新定价 / 实际利率 / 折现率上行压制 AI beta 成长估值 / 美债收益率上行 / 短中端政策路径主导. Module 2 curve label is bear flattening as of 2026-06-05. 5Y attribution is real-yield: real yield +20bp, breakeven -4bp. 10Y attribution is real-yield: real yield +12bp, breakeven -2bp. 30Y proxy: +2bp with 10s30s -8bp and 5s30s -14bp.

## 市场正在交易什么分歧

1. Fed path repricing: ★★☆☆ score 2 - External reaction points to policy-path repricing: 非农超预期 / Fed path 重新定价.
2. Risk appetite / liquidity shock: ★★☆☆ score 2 - External reaction flags risk/liquidity pressure: 实际利率 / 折现率上行压制 AI beta 成长估值.
3. Long-end term premium / fiscal supply: ★☆☆☆ score 1 - External reaction includes long-end / duration-demand pressure, but local 30Y curve proxies remain the confirmation layer.
4. Technical positioning / exhaustion: ★☆☆☆ score 1 - External reaction includes technical / positioning pressure: 社群交易口径：AI / 半导体拥挤交易降温.
5. Inflation compensation shock: ☆☆☆☆ score 0 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-06-05.
6. Growth scare / recession hedge: ☆☆☆☆ score 0 - DGS10 rose +10bp over 5D, so a growth-scare / recession-hedge rates rally is not confirmed.

完整叙事检查：

- Fed path repricing: score 2; updatedAt 2026-06-05; Market-reaction evidence says the newer event tape is trading stronger-for-longer / fewer cuts, but local rates cache still only confirms curve data through 2026-06-05.
- Risk appetite / liquidity shock: score 2; updatedAt 2026-06-05; External market-reaction evidence says growth/AI beta valuation pressure was part of the selloff; local cross-asset caches remain stale and cannot independently confirm the full move.
- Long-end term premium / fiscal supply: score 1; updatedAt 2026-06-05; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-06-05.
- Technical positioning / exhaustion: score 1; updatedAt 2026-06-05; Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.
- Inflation compensation shock: score 0; updatedAt 2026-06-05; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Growth scare / recession hedge: score 0; updatedAt 2026-06-05; The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.

## 叙事是否过度外推

2026-06-05 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把温和上行直接外推成可加仓窗口。

## Duration 动作建议

当前档位：0 - No trade / wait。

原因：2026-06-05 does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait.

支持条件：
- 5D curve proxies do not show fresh 30Y-led bear steepening.
- The 5D rates move is small enough that there is no need to chase duration.
- Local CNN headline risk appetite is not in broad panic.

反对条件：
- 10Y and 30Y shock percentiles are not extreme in the available local-cache window.
- Technical exhaustion is not confirmed by RSI, Bollinger z-score, 20D percentile, or nine-turn proxy.
- SOFR/Fed funds futures, MOVE, formal term premium, and CFTC positioning are unavailable.

升级信号：
- Move to index 2 if DGS10 5D or 21D selloff reaches >=85th percentile, real yield leads, and technical exhaustion appears.
- Move to index 3 if 10Y shock becomes extreme while 30Y term-premium proxies remain stable.
- Move to index 4 only if 30Y shock is extreme and 5s30s/10s30s steepening stops after term-premium pressure stabilizes.
- Move to index 5 only after long-end stabilization coincides with bull flattening, growth/disinflation confirmation, and exhaustion.

降级或维持低档信号：
- Stay at index 0 if DGS3 or DGS30 accelerates without exhaustion.
- Stay at index 0 if 10s30s bear steepening resumes or auction/MOVE data later show stress.

## Technical Exhaustion Panel

- US10Y 九转: up 3 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 1 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 45.6 / 30Y 35.1; status neutral; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +0.64 / 30Y -0.36; status neutral; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +14bp 45% / 30Y +4bp 17%; status neutral; Percentile uses the locally cached public history.
- MOVE index: 62.2 as of 2026-05-18; 21D -20.2%; status stress falling; This is not the ICE BofA MOVE index. It is a local rates-volatility trend proxy used when official MOVE history is unavailable.
- CFTC Treasury futures positioning: Lev net -31.8% OI as of 2026-05-12; 4W +2.9 pts; status short crowded; Used for positioning trend and crowding only; contract DV01 differences are not normalized.
- Timing overlay: No standalone timing signal; status wait; Technical panel does not upgrade the duration action without a fundamental shock.

结论：2026-06-05 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.

## 需要证伪/确认的下一批数据

- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.
- Treasury auction tail, bid-to-cover, and dealer take-down are unavailable in local cache.
- MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used as risk proxies.
- VIX, HY OAS, DXY/broad dollar, Oil, Gold are unavailable in local cache.
- T5YIFR uses a Treasury-derived local proxy for 2026-06-05 because FRED T5YIFR cache ends on 2026-05-22.
