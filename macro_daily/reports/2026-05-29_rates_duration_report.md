# 2026-05-29 Rates Duration Report

## 2026-05-29 一句话结论

2026-05-28 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 -12bp，DGS30 5D 为 -13bp。 曲线是 parallel bull / mixed，技术衰竭没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-28。Latest confirmed U.S. rates data is 2026-05-28; 2026-05-29 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-28 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-05-28. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- Treasury-derived T5YIFR proxy: inflation-forward cross-check; latestDate 2026-05-28; proxyUsed: true. T5YIFR uses a Treasury-derived local proxy for 2026-05-28 because FRED T5YIFR cache ends on 2026-05-22.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-05-22. CNN Fear & Greed is greed as of 2026-05-22; VIX is neutral and junk bond demand / HY OAS is fear.
- FRED public market data cache: public history and cross-asset feed; latestDate 2026-05-18. Loaded 18 public series for rate history and cross-asset checks.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 3.99% | -1bp | -5bp | +15bp | +61bp | 35% | -0.4 |
| DGS3 | 4.07% | -2bp | -4bp | +21bp | +68bp | 5D 31%; 3M 78% | -0.3 |
| DGS5 | 4.15% | -2bp | -7bp | +18bp | +64bp | 5D 42%; 3M 78% | -0.6 |
| DGS10 | 4.45% | -3bp | -12bp | +9bp | +48bp | 5D 69%; 3M 71% | -1.1 |
| DGS30 | 4.98% | -3bp | -13bp | +4bp | +34bp | 5D 74%; 3M 59% | -1.5 |

分位数使用 1962-01-02 到 2026-05-28 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。

## 市场 2026-05-28 在交易什么

覆盖窗口：2026-05-26 to 2026-05-29。状态：ready。
摘要：2026-05-28 的市场消化从 2026-05 中旬的长端 selloff 高位转向降温确认：官方 Treasury 曲线显示 2Y、3Y、5Y、10Y、30Y 分别收在 3.99%、4.07%、4.15%、4.45%、4.98%，较 2026-05-22 全线回落，30Y 重新低于 5%。外部叙事主要集中在三条线：一是 Iran 相关能源风险降温推动 yields 回落；二是 GDP 下修和通胀未超预期使 Fed path 压力边际缓和；三是 Reuters 仍强调财政赤字、sticky inflation 和 term premium 对长债避险属性的结构性挑战。因此本地 tape 支持中长端压力缓和和 10Y 观察窗口，但不支持直接把长端高收益率当作无条件加 30Y 或 convex duration 的买点。
来源结构：媒体：5 条 / 39%；官方：7 条 / 59%；社群：1 条 / 2%

1）政策路径 / 实际利率重定价缓和: 31% - 2026-05-28 的 GDP 下修和通胀未超预期，使市场把政策路径压力从更鹰派的 higher-for-longer 冲击中拉回。Reuters 盘中记录 2Y 在 4.04%、10Y 在 4.48% 附近，官方日终曲线进一步显示 2Y 3.99%、10Y 4.45%；同时 real yield 曲线显示 5Y、10Y、30Y 分别降至 1.61%、2.06%、2.70%。这说明政策路径和实际折现率仍是主线，但边际方向已从 2026-05 中旬的上行冲击变成降温。
   - 媒体 / Reuters via Investing.com / 2026-05-28: Reuters 报道 2026-05-28 美国 Q1 GDP 被下修，价格压力指标大体符合预期；债券市场反应为 Treasury yields 大体持平，2Y 约 4.04%、10Y 约 4.48%。该证据支持 Fed path 压力边际缓和，而不是新的前端加速上行。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-28: U.S. Treasury 官方日终曲线显示 2026-05-28 的 2Y、3Y、5Y、10Y、30Y 分别为 3.99%、4.07%、4.15%、4.45%、4.98%；较 2026-05-22 全线回落，说明本地 tape 不再是前端或长端单边加速 selloff。
   - 官方 / U.S. Treasury Daily Treasury Real Yield Curve / 2026-05-28: U.S. Treasury real yield curve 显示 2026-05-28 的 5Y、10Y、30Y real yield 分别为 1.61%、2.06%、2.70%，较 2026-05-22 分别下降 12bp、10bp、7bp；这确认了名义利率回落主要带有实际折现率降温特征。
2）能源通胀 / Iran 风险溢价降温: 24% - 2026-05-27 至 2026-05-28 的外部市场解释把 Treasury yields 回落与 Iran 谈判/停火延长期待联系起来。该主题通过能源通胀预期影响 Fed path 和 long-end compensation：如果地缘风险继续降温，油价通胀冲击和 breakeven 上行动能会减弱。本地 proxy 也一致：2026-05-28 5Y breakeven 约 2.54%、10Y breakeven 约 2.39%，未显示新的通胀补偿上行冲击。
   - 媒体 / Investing.com / 2026-05-28: Investing.com 在 2026-05-28 00:44 报道 U.S. Treasury yields 因市场乐观预期 Washington 与 Tehran 可能达成协议而下行；10Y yield 下行 2.8bp 至 4.463%，30Y 下行 2.1bp 至 5.004%。该证据把利率回落和能源通胀风险降温联系起来。
   - 媒体 / MarketScreener / 2026-05-28: MarketScreener 2026-05-28 快讯称，Axios 报道美国与 Iran 达成延长停火协议、待 Trump 批准后，U.S. Treasury yields 下行，10Y last down 2.8bp at 4.453%。该证据支持地缘能源风险从推高利率转为压低利率的短线叙事。
   - 官方 / U.S. Treasury Daily Treasury Rates and Real Yield Curve / 2026-05-28: 按 2026-05-28 Treasury nominal minus real yield 估算，5Y breakeven 约 2.54%、10Y breakeven 约 2.39%，均未显示新的通胀补偿冲击；这让 Iran 降温叙事更像是缓和原有通胀风险，而不是生成新的 inflation compensation selloff。
3）长端期限溢价 / 财政供给约束仍在: 22% - 长端结构性担忧没有消失，但 2026-05-28 的边际 tape 已从 30Y-led stress 转为高位回落。Reuters 仍强调 sticky inflation、财政赤字、未来 Treasury issuance 和 term premium 让长债避险属性受挑战；但官方曲线显示 30Y 从 2026-05-22 的 5.07% 降到 2026-05-28 的 4.98%，10s30s 维持在约 51bp 至 53bp 的低 50bp 区间，没有新的急剧 bear steepening。该主题应作为不要直接升级 long-end/convex duration 的风险约束，而不是当天的主导 selloff 信号。
   - 媒体 / Reuters via Investing.com / 2026-05-28: Reuters 2026-05-28 分析称，long-dated Treasuries 因 Iran war、通胀补偿、美国经济韧性和财政赤字驱动的供给预期而承压，并指出 10Y term premium 近期升至约 0.86%。该证据支持长期期限溢价仍是长端风险约束。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-28: 官方曲线显示 2026-05-28 30Y 收在 4.98%，低于 2026-05-22 的 5.07% 和 2026-05-19 的 5.18%；长端压力仍高，但边际加速已经缓和，不符合新的 30Y-led capitulation。
   - 官方 / U.S. Treasury Tentative Auction Schedule / 2026-05-28: Treasury tentative auction schedule 显示 5Y note 在 2026-05-27 auction、7Y note 在 2026-05-28 auction、10Y TIPS settlement 在 2026-05-29。该证据说明供给事件窗口密集，但本地 cache 尚无 auction tail、bid-to-cover、dealer take-down，不能把供给日历直接等同于拍卖吸收恶化。
4）增长放缓 / 风险偏好改善的混合信号: 13% - GDP 下修通常支持 duration，但 Reuters 同时记录市场把较软的核心通胀与较弱 headline growth 解读为 risk-on：压力从 Fed path 缓和而非增长恐慌主导。官方利率日终下行支持 duration，但缺少 HY OAS、VIX、DXY、oil、gold 等新鲜跨资产确认，因此不能把它升级为强 growth scare / recession hedge。
   - 媒体 / Reuters via Investing.com / 2026-05-28: Reuters 2026-05-28 报道 GDP 下修和核心通胀较软带来 risk-on 反应，市场认为价格压力缓和但劳动力恶化不明显，从而支持较不限制性的政策预期。该证据支持 policy relief 多于 recession hedge。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-28: 2026-05-28 官方 10Y 收在 4.45%、30Y 收在 4.98%，较 2026-05-22 下行约 11bp 和 9bp；该价格证据支持 duration relief，但仅凭利率下行无法证明 growth scare 已成为主导叙事。
5）技术动能 / 高位降温但未反转确认: 10% - 2026-05-19 至 2026-05-28，10Y 从 4.67% 回落到 4.45%，30Y 从 5.18% 回落到 4.98%，说明此前收益率上行 extension 出现降温。该主题支持把 10Y 纳入 watchlist 或小仓位试探条件，但由于 MOVE、CFTC 和完整 auction 质量数据缺失，技术信号仍只能作为 timing overlay，不能单独变成建仓理由。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-28: 官方曲线显示 10Y 从 2026-05-19 的 4.67% 降到 2026-05-28 的 4.45%，30Y 从 5.18% 降到 4.98%；这给收益率上行衰竭提供价格证据，但仍需技术指标和跨资产风险确认。
   - 社群 / Reddit r/getagraph / 2026-05-28: Reddit r/getagraph 发布 2026-05-27 Treasury rates 摘要，显示 5Y 4.17% 并记录日内下行；该社群来源只能作为低权重关注度和方向校验，不能替代官方 Treasury 曲线。

外部叙事与本地 tape 差异：外部覆盖把 政策路径 / 实际利率重定价缓和 / 能源通胀 / Iran 风险溢价降温 排在最高权重，但本地 5D 归因显示 5Y 由 breakeven 主导、10Y 由 real-yield 主导；10Y breakeven 贡献为 -5bp，所以本报告把 inflation / Fed-path 叙事视为市场消化过程，而不是 breakeven 主导 tape 的证明。

## 哪段曲线在动

5D 比较日期是 2026-05-20。DGS3 -4bp，DGS5 -7bp，DGS10 -12bp，DGS30 -13bp。3s10s 为 38bp，5D 变化 -8bp；5s30s 为 83bp，5D 变化 -6bp；10s30s 为 53bp，5D 变化 -1bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move -7bp: real yield -2bp / 29%, breakeven -5bp / 71%, residual 0bp / 0%。

10Y 5D move -12bp: real yield -7bp / 58%, breakeven -5bp / 42%, residual 0bp / 0%。

30Y 5D move -13bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Fed path repricing: ★☆☆☆ score 1 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
2. Growth scare / recession hedge: ★☆☆☆ score 1 - The 5D nominal rally and lower breakevens are consistent with a mild hedge bid, but risk proxies do not confirm a recession-style shock.
3. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
4. Inflation compensation shock: ☆☆☆☆ score 0 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-28.
5. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.
6. Technical positioning / exhaustion: ☆☆☆☆ score 0 - Technical indicators do not show a clear yield-up exhaustion setup on 2026-05-28.

完整叙事检查：

- Fed path repricing: score 1; updatedAt 2026-05-28; Policy-path repricing remains a background narrative, but 2026-05-28 does not show a fresh front-end-led shock.
- Growth scare / recession hedge: score 1; updatedAt 2026-05-28; The growth-scare narrative is weak because the 5D rally is small and the broader risk tape is mixed rather than decisively defensive.
- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-22; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
- Inflation compensation shock: score 0; updatedAt 2026-05-28; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-28; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-28.
- Technical positioning / exhaustion: score 0; updatedAt 2026-05-28; Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.

## 叙事是否过度外推

2026-05-28 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把温和回落直接外推成可加仓窗口。

## Duration 动作建议

当前档位：0 - No trade / wait。

原因：2026-05-28 does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait.

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

- US10Y 九转: up 0 / down 5; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 0 / down 5; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 53.7 / 30Y 51.1; status neutral; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y -0.37 / 30Y -0.74; status neutral; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +3bp 15% / 30Y 0bp 4%; status neutral; Percentile uses the locally cached public history.
- MOVE index: 62.2 as of 2026-05-18; 21D -20.2%; status stress falling; This is not the ICE BofA MOVE index. It is a local rates-volatility trend proxy used when official MOVE history is unavailable.
- CFTC Treasury futures positioning: Lev net -31.8% OI as of 2026-05-12; 4W +2.9 pts; status short crowded; Used for positioning trend and crowding only; contract DV01 differences are not normalized.
- Timing overlay: No standalone timing signal; status wait; Technical panel does not upgrade the duration action without a fundamental shock.

结论：2026-05-28 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.

## 需要证伪/确认的下一批数据

- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.
- MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used as risk proxies.
- VIX, HY OAS, DXY/broad dollar, Oil, Gold are unavailable in local cache.
- T5YIFR uses a Treasury-derived local proxy for 2026-05-28 because FRED T5YIFR cache ends on 2026-05-22.
