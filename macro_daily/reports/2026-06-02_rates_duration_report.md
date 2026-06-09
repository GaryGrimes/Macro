# 2026-06-02 Rates Duration Report

## 2026-06-02 一句话结论

2026-05-28 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 -12bp，DGS30 5D 为 -13bp。 曲线是 parallel bull / mixed，技术衰竭没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-28。Latest confirmed U.S. rates data is 2026-05-28; 2026-06-02 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-28 作为 marketDate。

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

覆盖窗口：2026-05-25 to 2026-05-28。状态：missing_research_input。
摘要：市场反应研究输入缺失；本模块不会只凭本地价格指标倒推出媒体或市场共识。
来源结构：媒体：0 条 / 0%；机构：0 条 / 0%；社群：0 条 / 0%

1）研究输入缺失: 100% - Module 1 和 Module 2 只能作为本地诊断，不能当成更广泛市场叙事正在交易什么的证据。
   - 自动化 / 本地利率看板 / 2026-05-28: 本地诊断：DGS10 5D -12bp (69%); DGS30 5D -13bp (74%); parallel bull / mixed; real-yield; technical exhaustion absent。

外部叙事与本地 tape 差异：marketReaction 输入尚未就绪，因此本报告不比较外部共识与本地诊断。

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
- 市场反应研究输入 macro_daily/data/2026-06-02_market_reaction_sources.json 不可用；模块 1.5 会显示需要研究输入状态。
