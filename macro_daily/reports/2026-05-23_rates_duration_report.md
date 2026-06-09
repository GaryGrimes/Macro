# 2026-05-23 Rates Duration Report

## 2026-05-23 一句话结论

2026-05-22 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 -3bp，DGS30 5D 为 -4bp。 曲线是 parallel bull / mixed，技术衰竭没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-22。Latest confirmed U.S. rates data is 2026-05-22; 2026-05-23 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-22 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-05-22. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- Treasury-derived T5YIFR proxy: inflation-forward cross-check; latestDate 2026-05-22; proxyUsed: true. T5YIFR uses a Treasury-derived local proxy for 2026-05-22 because FRED T5YIFR cache ends on 2026-05-21.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-05-22. CNN Fear & Greed is greed as of 2026-05-22; VIX is neutral and junk bond demand / HY OAS is fear.
- FRED public market data cache: public history and cross-asset feed; latestDate 2026-05-18. Loaded 18 public series for rate history and cross-asset checks.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.01% | -8bp | -8bp | +18bp | +58bp | 53% | -0.7 |
| DGS3 | 4.07% | -8bp | -7bp | +23bp | +60bp | 5D 43%; 3M 74% | -0.6 |
| DGS5 | 4.27% | +2bp | +1bp | +31bp | +66bp | 5D 12%; 3M 79% | 0.1 |
| DGS10 | 4.56% | -1bp | -3bp | +22bp | +52bp | 5D 23%; 3M 74% | -0.3 |
| DGS30 | 5.08% | -2bp | -4bp | +16bp | +38bp | 5D 28%; 3M 63% | -0.5 |

分位数使用 1962-01-02 到 2026-05-22 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。

## 市场 2026-05-22 在交易什么

覆盖窗口：2026-05-19 to 2026-05-23。状态：ready。
摘要：2026-05-22 的市场消化不是新一轮单边长端失控，而是 2026-05-19 至 2026-05-21 的长端高位、Fed minutes 偏鹰风险和能源通胀叙事被重新校准。官方曲线显示 2026-05-22 DGS10 从 2026-05-21 的 4.57% 降到 4.56%，DGS30 从 5.10% 降到 5.08%，2Y 从 4.09% 降到 4.01%，但 5Y nominal 从 4.25% 升到 4.27%，5Y real yield 从 1.68% 升到 1.73%。这说明长端期限溢价压力仍在高位，但 2026-05-22 的边际变化更像中端实际利率继续重定价、短端和长端从高位回落，而不是全面 duration capitulation。
来源结构：官方：6 条 / 54%；机构：2 条 / 14%；媒体：4 条 / 27%；社群：1 条 / 2%；自动化：1 条 / 3%

1）Fed 路径 / 实际利率重定价: 32% - Fed minutes 仍是 2026-05-22 市场解释利率高位的核心宏观背景，但本地 tape 显示重定价更集中在 5Y real yield：2026-05-22 的 5Y real yield 升至 1.73%，而 10Y 和 30Y real yield 分别小幅降至 2.16% 和 2.79%。因此该主题支持 higher-for-longer 和实际折现率偏紧的判断，但不支持把 2026-05-22 解读成全曲线同向加速卖出。
   - 官方 / Federal Reserve FOMC Minutes / 2026-05-20: Federal Reserve 2026-04-29 FOMC minutes 在 2026-05-20 发布，讨论通胀高于目标、能源与地缘冲突带来的不确定性，以及若通胀持续高于 2% 时政策可能需要更偏收紧的风险。该证据解释了为什么 2026-05-22 的中端实际利率仍不能简单按买点处理。
   - 官方 / U.S. Treasury Daily Treasury Real Yield Curve / 2026-05-22: U.S. Treasury real yield curve 显示 2026-05-22 的 5Y、10Y、30Y real yield 分别为 1.73%、2.16%、2.79%；相对 2026-05-21，5Y 上行 5bp，但 10Y 和 30Y 分别下行 2bp 和 1bp。该结构支持中端实际利率重定价，而不是长端实际利率同步失控。
   - 机构 / Wells Fargo Investment Institute / 2026-05-21: Wells Fargo 在 2026-05-21 的 bond market commentary 中把 2026-05-20 的收益率下行与 Iran 战争降温乐观情绪和 Fed minutes 同时联系起来，并指出 minutes 显示若通胀保持高位，多数官员认为未来加息可能有必要。该证据说明市场在 2026-05-22 前仍把政策路径风险作为利率高位的重要解释。
2）长端期限溢价 / 财政供给与拍卖吸收: 27% - 长端叙事仍是风险约束，但 2026-05-22 的边际 tape 已不是长端加速恶化。官方曲线显示 30Y 从 2026-05-19 的 5.18% 降到 2026-05-22 的 5.08%，10s30s 从约 49bp 小幅走到约 52bp，未出现急剧扩张；20Y auction 仍提供财政供给和投资者吸收能力的观察点。该主题限制长端 duration 加仓，但不足以单独触发追空或完全放弃 10Y 观察。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-22: U.S. Treasury nominal curve 显示 2026-05-22 DGS10 为 4.56%、DGS30 为 5.08%；30Y 仍在 5% 上方，但较 2026-05-19 的 5.18% 已回落 10bp，说明长端压力高位存在但边际加速放缓。
   - 官方 / TreasuryDirect / 2026-05-20: TreasuryDirect 2026-05-20 20Y auction result 提供长端供给吸收证据；该拍卖可用来观察高收益率环境下的投资者承接能力，但看板仍缺结构化 auction tail、bid-to-cover 和 dealer take-down cache，因此只能作为 marketReaction 证据和 term premium proxy。
   - 媒体 / CNN via KMBC / 2026-05-19: CNN 报道 30Y Treasury yield 在 2026-05-19 接近 5.2%、为 2007 年以来高位，并把 selloff 归因于通胀、财政赤字、地缘风险和央行政策风险。该来源支持长端期限溢价叙事，但 2026-05-22 官方曲线显示 30Y 已从高点回落。
3）能源通胀 / 通胀预期重定价: 18% - 能源通胀仍解释 2026-05-19 附近的利率冲击背景，但 2026-05-22 的 breakeven proxy 不支持通胀补偿成为边际主导。按 Treasury nominal minus real yield 估算，2026-05-22 的 5Y breakeven 约 2.54%，较 2026-05-21 下降 3bp；10Y breakeven 约 2.40%，较 2026-05-21 仅上行 1bp。该主题保留为政策路径风险的输入，而不是单独的 duration 卖出主线。
   - 媒体 / Anadolu Agency / 2026-05-20: Anadolu Agency 报道 2026-05-20 因美国与 Iran 谈判进展乐观，2Y 到 10Y Treasury yields 下行约 10bp；市场把可能降低能源供应风险理解为缓和通胀压力，这解释了 2026-05-20 至 2026-05-22 breakeven 从高位回吐的外部叙事。
   - 媒体 / Trading Economics / 2026-05-21: Trading Economics 在 2026-05-21 指出，10Y yield 在 2026-05-20 大跌后仍低于 4.6%，市场关注 Iran 战争降温、油价回落和 Fed minutes 中的加息风险；这说明能源通胀叙事从推高收益率转为边际缓和，但并未完全消失。
   - 官方 / U.S. Treasury Daily Treasury Rates and Real Yield Curve / 2026-05-22: 按 Treasury nominal minus real yield proxy 估算，2026-05-22 的 5Y breakeven 约 2.54%、10Y breakeven 约 2.40%；相对 2026-05-21，5Y 下降约 3bp，10Y 小幅上升约 1bp。该证据显示通胀补偿不是 2026-05-22 的主要上行驱动。
4）技术动能 / 衰竭: 12% - 30Y 在 2026-05-19 触及 5.18% 后到 2026-05-22 回落到 5.08%，技术层面出现从高位降温的初步证据，但该证据仍需和 real yield、curve shape、MOVE proxy 与风险资产数据一起验证。技术衰竭可以把 10Y 纳入观察或小仓位试探条件，但不能单独升级到长端或 convex duration 加仓。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-22: U.S. Treasury nominal curve 显示 30Y yield 从 2026-05-19 的 5.18% 回落到 2026-05-22 的 5.08%，10Y 从 4.69% 回落到 4.56%。该路径给技术降温提供价格证据，但不等同于基本面确认买点。
   - 社群 / Reddit r/getagraph / 2026-05-22: Reddit r/getagraph 发布 2026-05-21 Treasury rates 摘要，显示 30Y 为 5.10%；这类社群数据可作为低权重情绪和关注度观察，但不能替代 Treasury 官方曲线。
   - 自动化 / Local source coverage audit / 2026-05-23: 2026-05-23 本地运行时未能通过 shell 直连 FRED；本文件只把可核验的 2026-05-19 至 2026-05-22 官方、机构、媒体和低权重社群证据纳入主题排序。未验证的 2026-05-23 周末市场评论不作为证据。
5）风险偏好 / 流动性冲击: 11% - 风险偏好证据更像利率、能源和政策路径叙事的二阶传导，而不是独立 funding shock。2026-05-20 Iran 谈判乐观降低能源通胀压力并支持债券反弹；2026-05-22 官方曲线中短端和长端回落，也不符合流动性压力主导下的全曲线无差别抛售。
   - 机构 / Wells Fargo Investment Institute / 2026-05-21: Wells Fargo 描述 2026-05-20 Treasury yields 因 Iran 乐观情绪下行，2026-05-21 开盘前 yields 又随 PMI、失业申请和 housing starts 等数据等待而略升；该证据支持宏观风险偏好切换，但不支持独立流动性压力成为主线。
   - 媒体 / CNN via KMBC / 2026-05-19: CNN 报道高收益率对美股估值和融资成本形成压力，说明 rates shock 正在向风险资产传导；但文章主因仍是通胀、财政和地缘政治，而不是短端融资市场失灵。

外部叙事与本地 tape 差异：外部覆盖把 Fed 路径 / 实际利率重定价 / 长端期限溢价 / 财政供给与拍卖吸收 排在最高权重，但本地 5D 归因显示 5Y 由 real-yield 主导、10Y 由 breakeven 主导；10Y breakeven 贡献为 -9bp，所以本报告把 inflation / Fed-path 叙事视为市场消化过程，而不是 breakeven 主导 tape 的证明。

## 哪段曲线在动

5D 比较日期是 2026-05-15。DGS3 -7bp，DGS5 +1bp，DGS10 -3bp，DGS30 -4bp。3s10s 为 49bp，5D 变化 +4bp；5s30s 为 81bp，5D 变化 -5bp；10s30s 为 52bp，5D 变化 -1bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move +1bp: real yield +17bp / 52%, breakeven -16bp / 48%, residual 0bp / 0%。

10Y 5D move -3bp: real yield +6bp / 40%, breakeven -9bp / 60%, residual 0bp / 0%。

30Y 5D move -4bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Growth scare / recession hedge: ★☆☆☆ score 1 - The 5D nominal rally and lower breakevens are consistent with a mild hedge bid, but risk proxies do not confirm a recession-style shock.
2. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
3. Fed path repricing: ☆☆☆☆ score 0 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
4. Inflation compensation shock: ☆☆☆☆ score 0 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-22.
5. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.
6. Technical positioning / exhaustion: ☆☆☆☆ score 0 - Technical indicators do not show a clear yield-up exhaustion setup on 2026-05-22.

完整叙事检查：

- Growth scare / recession hedge: score 1; updatedAt 2026-05-22; The growth-scare narrative is weak because the 5D rally is small and the broader risk tape is mixed rather than decisively defensive.
- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-22; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
- Fed path repricing: score 0; updatedAt 2026-05-22; Policy-path repricing remains a background narrative, but 2026-05-22 does not show a fresh front-end-led shock.
- Inflation compensation shock: score 0; updatedAt 2026-05-22; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-22; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-22.
- Technical positioning / exhaustion: score 0; updatedAt 2026-05-22; Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.

## 叙事是否过度外推

2026-05-22 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把温和回落直接外推成可加仓窗口。

## Duration 动作建议

当前档位：0 - No trade / wait。

原因：2026-05-22 does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait.

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

- US10Y 九转: up 0 / down 2; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 0 / down 2; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 59.0 / 30Y 56.3; status neutral; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +0.95 / 30Y +0.77; status neutral; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +25bp 68% / 30Y +17bp 54%; status neutral; Percentile uses the locally cached public history.
- MOVE index: 62.2 as of 2026-05-18; 21D -20.2%; status stress falling; This is not the ICE BofA MOVE index. It is a local rates-volatility trend proxy used when official MOVE history is unavailable.
- CFTC Treasury futures positioning: Lev net -31.8% OI as of 2026-05-12; 4W +2.9 pts; status short crowded; Used for positioning trend and crowding only; contract DV01 differences are not normalized.
- Timing overlay: No standalone timing signal; status wait; Technical panel does not upgrade the duration action without a fundamental shock.

结论：2026-05-22 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.

## 需要证伪/确认的下一批数据

- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.
- Oil is unavailable in local cache.
- T5YIFR uses a Treasury-derived local proxy for 2026-05-22 because FRED T5YIFR cache ends on 2026-05-21.
