# 2026-05-20 Rates Duration Report

## 2026-05-20 一句话结论

2026-05-19 的美国利率日终数据显示显著 5D selloff shock：DGS10 5D 为 +21bp（88%），DGS30 5D 为 +15bp（77%）。 曲线是 parallel bear / mixed，技术衰竭有条件出现。Duration Action Panel 维持 3 - Start 10Y nibble / intermediate-duration watch。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-19。Latest confirmed U.S. rates data is 2026-05-19; 2026-05-20 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-19 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-05-19. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- FRED T5YIFR: inflation-forward cross-check; latestDate 2026-05-19. FRED T5YIFR is available through 2026-05-19.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-05-19. CNN Fear & Greed is greed as of 2026-05-19; VIX is neutral and junk bond demand / HY OAS is neutral.
- FRED public market data cache: public history and cross-asset feed; latestDate 2026-05-18. Loaded 18 public series for rate history and cross-asset checks.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.13% | +6bp | +13bp | +41bp | +66bp | 72% | 1.2 |
| DGS3 | 4.20% | +6bp | +19bp | +47bp | +70bp | 5D 84%; 3M 80% | 1.7 |
| DGS5 | 4.32% | +5bp | +20bp | +46bp | +67bp | 5D 85%; 3M 80% | 1.7 |
| DGS10 | 4.67% | +6bp | +21bp | +41bp | +59bp | 5D 88%; 3M 80% | 2.1 |
| DGS30 | 5.18% | +4bp | +15bp | +30bp | +48bp | 5D 77%; 3M 72% | 1.8 |

分位数使用 1962-01-02 到 2026-05-19 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。

## 市场 2026-05-19 在交易什么

覆盖窗口：2026-05-16 to 2026-05-20。状态：ready。
摘要：市场反应集中在通胀压力重新抬头与 Fed 路径重定价、长端期限溢价压力持续，以及高收益率和油价波动对风险偏好的二阶拖累。
来源结构：媒体：7 条 / 59%；官方：4 条 / 35%；社群：2 条 / 5%

1）Fed 路径 / 实际利率重定价: 32% - 权威媒体把本轮利率上行解释为市场重新定价更少降息或潜在加息风险，原因是通胀压力仍高；同时 5Y 到 30Y 实际利率同步上行，说明名义利率 selloff 有实际利率主导成分。
   - 媒体 / Reuters via Investing.com / 2026-05-19: Reuters 报道投资者认为债市压力短期难以缓和，粘性通胀和沉重政府融资需求继续压住长期债券收益率。
   - 媒体 / Reuters via Investing.com Canada / 2026-05-18: Reuters 将全球债券 selloff 与通胀担忧和加息押注联系起来，能源价格维持高位是市场重新定价的重要背景。
   - 官方 / U.S. Treasury real yield curve / 2026-05-19: 2026-05-19 实际利率曲线显示 5Y real yield 为 1.66%、10Y 为 2.18%、30Y 为 2.84%，确认名义利率上行中存在实际利率主导成分。
2）长端期限溢价 / 财政供给与拍卖吸收: 27% - 官方曲线数据和市场报道都显示，长端供给与期限溢价叙事仍然活跃：30Y 收益率维持在 5% 以上，10s30s 陡峭化压力仍未完全消失。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-19: 2026-05-19 官方曲线显示 DGS10 为 4.67%、DGS30 为 5.18%，30Y 仍是主要期限中收益率最高的一段。
   - 媒体 / Reuters via Investing.com / 2026-05-19: Reuters 强调投资者担心财政融资需求和通胀风险继续给长久期债券施压，这支持长端期限溢价压力叙事。
   - 官方 / TreasuryDirect / 2026-05-13: 2026-05-13 30Y 拍卖以 5.046% 高收益率发行、bid-to-cover 为 2.30，这是本地证据集中最近一次直接观察长端供给吸收能力的官方数据。
3）能源通胀 / 通胀预期重定价: 22% - 能源相关通胀担忧仍是市场解释的重要部分，但本地 breakeven 贡献弱于实际利率贡献，因此该主题是次要叙事，而不是 5D tape 的主导驱动。
   - 媒体 / Reuters via Investing.com / 2026-05-18: Reuters 描述油价驱动的通胀担忧推高全球收益率，随后能源价格略有缓和；这说明市场曾把债券压力与能源通胀联系起来。
   - 媒体 / Reuters via Investing.com / 2026-05-17: Reuters 报道油价上涨和债市 selloff 支撑美元并压低风险偏好，把利率上行与通胀压力和风险资产压力同时连接起来。
   - 官方 / U.S. Treasury Daily Treasury Rates and real yield curve / 2026-05-19: 按名义利率减实际利率估算，2026-05-19 的 5Y breakeven 约 2.66%、10Y breakeven 约 2.49%；通胀补偿水平偏高，但不是边际上行的最主要驱动。
4）风险偏好 / 流动性冲击: 11% - 高收益率和油价波动压制权益和美元以外的风险偏好，但报道没有显示纯粹流动性冲击；主要催化仍然是利率和通胀，而非独立的流动性事件。
   - 媒体 / Reuters via MarketScreener / 2026-05-19: Reuters 报道油价和 Treasury yields 处于高位令美股承压，说明利率冲击正在传导到权益风险偏好。
   - 媒体 / AP News / 2026-05-19: AP 市场报道描述股市下跌与债市压力并存，这更像风险偏好被利率拖累，而不是独立的系统性流动性事件。
5）技术动能 / 衰竭: 8% - 技术讨论集中在 10Y 和 30Y 上行速度、以及向按揭利率和融资成本的传导，但这只是 timing overlay，权重低于利率、通胀和长端供给叙事。
   - 社群 / Reddit r/Bonds / 2026-05-19: 社群讨论关注 30Y 收益率高于 5% 究竟是衰竭信号，还是融资成本进入新 regime；该证据只作为低可靠度背景色彩。
   - 社群 / Reddit r/MortgageRates / 2026-05-19: 按揭利率讨论强调 Treasury selloff 向借贷成本传导，可作为低权重的技术和仓位观察，但不能单独定义市场主线。

外部叙事与本地 tape 差异：外部覆盖把 Fed 路径 / 实际利率重定价 / 长端期限溢价 / 财政供给与拍卖吸收 排在最高权重，但本地 5D 归因显示 5Y 由 real-yield 主导、10Y 由 real-yield 主导；10Y breakeven 贡献为 +2bp，所以本报告把 inflation / Fed-path 叙事视为市场消化过程，而不是 breakeven 主导 tape 的证明。

## 哪段曲线在动

5D 比较日期是 2026-05-12。DGS3 +19bp，DGS5 +20bp，DGS10 +21bp，DGS30 +15bp。3s10s 为 47bp，5D 变化 +2bp；5s30s 为 86bp，5D 变化 -5bp；10s30s 为 51bp，5D 变化 -6bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move +20bp: real yield +23bp / 88%, breakeven -3bp / 12%, residual 0bp / 0%。

10Y 5D move +21bp: real yield +19bp / 90%, breakeven +2bp / 10%, residual 0bp / 0%。

30Y 5D move +15bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Technical positioning / exhaustion: ★★☆☆ score 2 - RSI and Bollinger z-scores show a yield-up exhaustion setup on 2026-05-19, but it is only a timing overlay.
2. Inflation compensation shock: ★☆☆☆ score 1 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-19.
3. Fed path repricing: ☆☆☆☆ score 0 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
4. Growth scare / recession hedge: ☆☆☆☆ score 0 - DGS10 rose +21bp over 5D, so a growth-scare / recession-hedge rates rally is not confirmed.
5. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.
6. Risk appetite / liquidity shock: ☆☆☆☆ score 0 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.

完整叙事检查：

- Technical positioning / exhaustion: score 2; updatedAt 2026-05-19; Technical signals can support timing only after rate-shock and driver attribution agree; they do not create a standalone trade.
- Inflation compensation shock: score 1; updatedAt 2026-05-19; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Fed path repricing: score 0; updatedAt 2026-05-19; Policy-path repricing remains a background narrative, but 2026-05-19 does not show a fresh front-end-led shock.
- Growth scare / recession hedge: score 0; updatedAt 2026-05-19; The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-19; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-19.
- Risk appetite / liquidity shock: score 0; updatedAt 2026-05-19; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.

## 叙事是否过度外推

2026-05-19 的主流叙事没有达到单一拥挤状态。5D shock 已经显著，且 RSI / Bollinger 给出 timing 支持；但驱动主要是 10Y real-yield led，30Y term-premium proxy 没有继续恶化，MOVE / auction / CFTC 仍缺失。因此可以把它当成 intermediate duration 的条件化窗口，但不能把它直接外推成 long-end 或 convex duration。

## Duration 动作建议

当前档位：3 - Start 10Y nibble / intermediate-duration watch。

原因：The duration panel upgrades to intermediate duration because the 10Y shock is extreme, real-yield led, and technically stretched, while 30Y does not show enough independent participation to justify long-end duration.

支持条件：
- 5D curve proxies do not show fresh 30Y-led bear steepening.
- 10Y shock is extreme in the available local-cache window and is real-yield led.
- Local CNN headline risk appetite is not in broad panic.

反对条件：
- 30Y shock is not extreme enough and long-end confirmation is not strong enough to upgrade beyond intermediate duration.
- Technical exhaustion is present, but it is only a timing overlay and cannot justify long-end duration by itself.
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

- US10Y 九转: up 6 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 6 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 72.7 / 30Y 72.7; status exhaustion; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +2.47 / 30Y +2.43; status exhaustion; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +37bp 82% / 30Y +29bp 76%; status neutral; Percentile uses the locally cached public history.
- MOVE index: 62.2 as of 2026-05-18; 21D -20.2%; status stress falling; This is not the ICE BofA MOVE index. It is a local rates-volatility trend proxy used when official MOVE history is unavailable.
- CFTC Treasury futures positioning: Lev net -31.8% OI as of 2026-05-12; 4W +2.9 pts; status short crowded; Used for positioning trend and crowding only; contract DV01 differences are not normalized.
- Timing overlay: Timing support present; status watch; Technical exhaustion must be paired with rate-shock and driver attribution before any duration upgrade.

结论：Technical signals can support only a conditional timing overlay; they do not create a standalone duration trade.

## 需要证伪/确认的下一批数据

- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.
