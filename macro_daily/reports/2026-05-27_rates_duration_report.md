# 2026-05-27 Rates Duration Report

## 2026-05-27 一句话结论

2026-05-22 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 -3bp，DGS30 5D 为 -5bp。 曲线是 twist / mixed，技术衰竭没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-22。Latest confirmed U.S. rates data is 2026-05-22; 2026-05-27 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-22 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-05-22. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- FRED T5YIFR: inflation-forward cross-check; latestDate 2026-05-22. FRED T5YIFR is available through 2026-05-22.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-05-22. CNN Fear & Greed is greed as of 2026-05-22; VIX is neutral and junk bond demand / HY OAS is fear.
- FRED public market data cache: public history and cross-asset feed; latestDate 2026-05-18. Loaded 18 public series for rate history and cross-asset checks.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.13% | +5bp | +4bp | +30bp | +70bp | 38% | 0.4 |
| DGS3 | 4.18% | +5bp | +4bp | +34bp | +71bp | 5D 36%; 3M 80% | 0.3 |
| DGS5 | 4.27% | +2bp | +1bp | +31bp | +66bp | 5D 12%; 3M 79% | 0.1 |
| DGS10 | 4.56% | -1bp | -3bp | +22bp | +52bp | 5D 23%; 3M 74% | -0.3 |
| DGS30 | 5.07% | -3bp | -5bp | +15bp | +37bp | 5D 33%; 3M 62% | -0.6 |

分位数使用 1962-01-02 到 2026-05-22 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。

## 市场 2026-05-22 在交易什么

覆盖窗口：2026-05-18 to 2026-05-22。状态：ready。
摘要：2026-05-21 的市场消化主线不是单纯追逐收益率绝对高位，而是三条叙事叠加：能源冲击和 Fed minutes 让政策路径重新偏鹰，长端仍被财政供给、期限溢价和 30Y 接近 5.10% 的高位约束，2026-05-20 的 Iran 谈判消息又使部分能源通胀溢价回吐。官方曲线显示 10Y 收益率在 2026-05-20 到 2026-05-21 持平于 4.57%，30Y 从 5.11% 小幅回落到 5.10%，但 5Y 和 10Y 实际利率继续上行，说明 market reaction 更像从恐慌式能源通胀转向 higher-for-longer / real-yield repricing，而不是已经确认的长端买点。
来源结构：官方：5 条 / 50%；机构：2 条 / 16%；媒体：4 条 / 30%；社群：2 条 / 4%

1）Fed 路径 / 实际利率重定价: 33% - Fed minutes 和 2026-05-21 实际利率曲线共同支持 higher-for-longer 叙事：FOMC 讨论强调通胀高于目标、能源与地缘冲突提高不确定性，并提到如果通胀持续高于 2%，部分政策收紧可能合适；本地曲线中 5Y real yield 从 2026-05-20 的 1.63% 升到 2026-05-21 的 1.68%，10Y real yield 从 2.13% 升到 2.18%，说明政策路径和实际折现率仍是市场消化的主线。
   - 官方 / Federal Reserve FOMC Minutes / 2026-05-20: Federal Reserve 2026-04-29 FOMC minutes 在 2026-05-20 发布，显示委员会继续关注能源冲击、通胀高于目标和政策路径两侧风险；多数参与者认为如果通胀继续高于 2%，未来可能需要更偏收紧的政策反应。这使 2026-05-21 的利率 tape 仍需按 Fed path repricing 解读，而不是简单当成已结束的 selloff。
   - 官方 / U.S. Treasury Daily Treasury Real Yield Curve / 2026-05-21: U.S. Treasury real yield curve 显示 2026-05-21 的 5Y、10Y、30Y real yield 分别为 1.68%、2.18%、2.80%；相对 2026-05-20，5Y 和 10Y 实际利率均上行 5bp，确认名义曲线中的折现率压力没有完全消退。
   - 机构 / Wells Fargo Investment Institute / 2026-05-21: Wells Fargo 在 2026-05-21 的 bond market commentary 中把 2026-05-20 的收益率下行与 Iran 战争降温乐观情绪和 Fed minutes 同时联系起来，并指出 minutes 显示若通胀保持高位，多数官员认为未来加息可能有必要。
2）长端期限溢价 / 财政供给与拍卖吸收: 28% - 长端叙事仍然存在，但边际上没有进一步恶化：官方曲线显示 30Y 从 2026-05-19 的 5.18% 降到 2026-05-21 的 5.10%，10s30s 仍在高位但未继续陡峭化；2026-05-20 的 20Y auction 高收益率和 bid-to-cover 提供供给吸收观察点。该主题约束 30Y duration 加仓，但不像 2026-05-19 那样是单边加速信号。
   - 官方 / U.S. Treasury Daily Treasury Rates / 2026-05-21: U.S. Treasury nominal curve 显示 2026-05-21 DGS10 为 4.57%、DGS30 为 5.10%；30Y 仍在 5% 上方，但较 2026-05-19 的 5.18% 已回落，说明长端压力高位存在但边际加速放缓。
   - 官方 / TreasuryDirect / 2026-05-20: TreasuryDirect 2026-05-20 20Y auction result 提供 2026-05-20 长端供给吸收证据；该拍卖可用来观察高收益率环境下的投资者承接能力，但看板仍缺结构化 auction tail / dealer take-down cache，因此仅作为 marketReaction 证据而非完整规则输入。
   - 媒体 / CNN via KMBC / 2026-05-19: CNN 报道 30Y Treasury yield 在 2026-05-19 接近 5.2%、为 2007 年以来高位，并把 selloff 归因于通胀、财政赤字、地缘风险和央行政策风险。这支持长端期限溢价叙事，但 2026-05-21 本地 tape 已显示边际回落。
3）能源通胀 / 通胀预期重定价: 20% - 能源通胀仍是解释债券 selloff 的关键背景，但 2026-05-20 至 2026-05-21 的本地 breakeven proxy 已下行：5Y breakeven proxy 从 2.59% 降到 2.57%，10Y breakeven proxy 从 2.44% 降到 2.39%。因此该主题解释前几日冲击来源和 Fed 风险，却不是 2026-05-21 的边际主导驱动。
   - 媒体 / Anadolu Agency / 2026-05-20: Anadolu Agency 报道 2026-05-20 因美国与 Iran 谈判进展乐观，2Y 到 10Y Treasury yields 下行约 10bp；市场把可能降低能源供应风险理解为缓和通胀压力，这解释了 breakeven 从高位回吐的外部叙事。
   - 媒体 / Trading Economics / 2026-05-21: Trading Economics 在 2026-05-21 指出，10Y yield 在 2026-05-20 大跌后仍低于 4.6%，市场关注 Iran 战争降温、油价回落和 Fed minutes 中的加息风险；这说明能源通胀叙事从推高收益率转为边际缓和，但并未完全消失。
   - 官方 / U.S. Treasury Daily Treasury Rates and Real Yield Curve / 2026-05-21: 按 Treasury nominal minus real yield proxy 估算，2026-05-21 的 5Y breakeven 约 2.57%、10Y breakeven 约 2.39%，较 2026-05-20 分别下降约 2bp 和 5bp，显示通胀补偿不是 2026-05-21 的边际上行驱动。
4）风险偏好 / 流动性冲击: 11% - 风险偏好证据更像利率和能源叙事的二阶传导，而不是独立流动性 shock。2026-05-20 Iran 谈判乐观降低能源通胀压力并支持债券反弹；2026-05-21 收益率小幅回升前，Wells Fargo 仍把市场焦点放在 PMI、失业申请和 Fed minutes，而不是 funding stress。
   - 机构 / Wells Fargo Investment Institute / 2026-05-21: Wells Fargo 描述 2026-05-20 Treasury yields 因 Iran 乐观情绪下行，2026-05-21 开盘前 yields 又随 PMI、失业申请和 housing starts 等数据等待而略升；该证据支持宏观风险偏好切换，但不支持独立流动性压力成为主线。
   - 媒体 / CNN via KMBC / 2026-05-19: CNN 报道高收益率对美股估值和融资成本形成压力，说明 rates shock 正在向风险资产传导；但文章主因仍是通胀、财政和地缘政治，而不是短端融资市场失灵。
5）技术动能 / 衰竭: 8% - 社群讨论和市场报道都关注 30Y 高于 5% 后是否进入衰竭区，但该证据可靠度低于官方曲线、Fed minutes 和机构研究。技术层只能作为 timing overlay；2026-05-21 的本地 tape 需要同时看 real yield、curve shape 和 long-end proxy 是否停止恶化。
   - 社群 / Reddit r/getagraph / 2026-05-22: Reddit r/getagraph 发布 2026-05-21 Treasury rates 摘要，显示 30Y 为 5.10%；这类社群数据可作为低权重情绪和关注度观察，但不能替代 Treasury 官方曲线。
   - 社群 / Reddit r/DrxTrading / 2026-05-21: Reddit r/DrxTrading 转述 WSJ / ING 观点，称 10Y yield 下行但 long-end yield 方向仍被看作偏上；该证据只说明交易员讨论仍聚焦长端高位，不足以单独定义主导市场叙事。

外部叙事与本地 tape 差异：外部覆盖把 Fed 路径 / 实际利率重定价 / 长端期限溢价 / 财政供给与拍卖吸收 排在最高权重，但本地 5D 归因显示 5Y 由 real-yield 主导、10Y 由 breakeven 主导；10Y breakeven 贡献为 -9bp，所以本报告把 inflation / Fed-path 叙事视为市场消化过程，而不是 breakeven 主导 tape 的证明。

## 哪段曲线在动

5D 比较日期是 2026-05-15。DGS3 +4bp，DGS5 +1bp，DGS10 -3bp，DGS30 -5bp。3s10s 为 38bp，5D 变化 -7bp；5s30s 为 80bp，5D 变化 -6bp；10s30s 为 51bp，5D 变化 -2bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move +1bp: real yield +17bp / 52%, breakeven -16bp / 48%, residual 0bp / 0%。

10Y 5D move -3bp: real yield +6bp / 40%, breakeven -9bp / 60%, residual 0bp / 0%。

30Y 5D move -5bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Fed path repricing: ★☆☆☆ score 1 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
2. Growth scare / recession hedge: ★☆☆☆ score 1 - The 5D nominal rally and lower breakevens are consistent with a mild hedge bid, but risk proxies do not confirm a recession-style shock.
3. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
4. Inflation compensation shock: ☆☆☆☆ score 0 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-22.
5. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.
6. Technical positioning / exhaustion: ☆☆☆☆ score 0 - Technical indicators do not show a clear yield-up exhaustion setup on 2026-05-22.

完整叙事检查：

- Fed path repricing: score 1; updatedAt 2026-05-22; Policy-path repricing remains a background narrative, but 2026-05-22 does not show a fresh front-end-led shock.
- Growth scare / recession hedge: score 1; updatedAt 2026-05-22; The growth-scare narrative is weak because the 5D rally is small and the broader risk tape is mixed rather than decisively defensive.
- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-22; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
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
- RSI: 10Y 59.6 / 30Y 55.1; status neutral; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +0.99 / 30Y +0.65; status neutral; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +25bp 68% / 30Y +16bp 52%; status neutral; Percentile uses the locally cached public history.
- MOVE index: 62.2 as of 2026-05-18; 21D -20.2%; status stress falling; This is not the ICE BofA MOVE index. It is a local rates-volatility trend proxy used when official MOVE history is unavailable.
- CFTC Treasury futures positioning: Lev net -31.8% OI as of 2026-05-12; 4W +2.9 pts; status short crowded; Used for positioning trend and crowding only; contract DV01 differences are not normalized.
- Timing overlay: No standalone timing signal; status wait; Technical panel does not upgrade the duration action without a fundamental shock.

结论：2026-05-22 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.

## 需要证伪/确认的下一批数据

- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.
- Oil is unavailable in local cache.
