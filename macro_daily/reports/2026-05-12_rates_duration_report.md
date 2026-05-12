# 2026-05-12 Rates Duration Report

## 2026-05-12 一句话结论

2026-05-11 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 -3bp，DGS30 5D 为 -4bp，曲线是 parallel bull / mixed，技术衰竭也没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-11。2026-05-12 的完整美国日终利率数据尚未进入本地缓存，因此本报告使用 2026-05-11 作为 marketDate。

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable | unavailable |
| DGS3 | 3.96% | +4bp | -2bp | +16bp | +46bp | 5D 16%*; 3M 76%* | -0.2 |
| DGS5 | 4.07% | +5bp | -1bp | +13bp | +37bp | 5D 4%*; 3M 67%* | -0.1 |
| DGS10 | 4.42% | +4bp | -3bp | +11bp | +26bp | 5D 23%*; 3M 63%* | -0.3 |
| DGS30 | 4.98% | +3bp | -4bp | +7bp | +20bp | 5D 25%*; 3M 52%* | -0.5 |

星号表示分位数使用 2024-01-02 到 2026-05-11 的本地 Treasury cache 代理，不是完整 10 年或完整 2022-01-01 后样本。该限制会降低极端分位的可比性。

## 哪段曲线在动

5D 比较日期是 2026-05-04。DGS3 -2bp，DGS5 -1bp，DGS10 -3bp，DGS30 -4bp。3s10s 为 46bp，5D 变化 -1bp；5s30s 为 91bp，5D 变化 -3bp；10s30s 为 56bp，5D 变化 -1bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move -1bp: real yield +4bp / 44%, breakeven -5bp / 56%, residual 0bp / 0%。

10Y 5D move -3bp: real yield 0bp / 0%, breakeven -3bp / 100%, residual 0bp / 0%。

30Y 5D move -4bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
2. Fed path repricing: ★☆☆☆ score 1 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
3. Growth scare / recession hedge: ★☆☆☆ score 1 - The 5D nominal rally and lower breakevens are consistent with a mild hedge bid, but risk proxies do not confirm a recession-style shock.
4. Inflation compensation shock: ☆☆☆☆ score 0 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-11.
5. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.
6. Technical positioning / exhaustion: ☆☆☆☆ score 0 - Technical indicators do not show a clear yield-up exhaustion setup on 2026-05-11.

完整叙事检查：

- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-12; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
- Fed path repricing: score 1; updatedAt 2026-05-11; Policy-path repricing remains a background narrative, but 2026-05-11 does not show a fresh front-end-led shock.
- Growth scare / recession hedge: score 1; updatedAt 2026-05-11; The growth-scare narrative is weak because the 5D rally is small and the broader risk tape is mixed rather than decisively defensive.
- Inflation compensation shock: score 0; updatedAt 2026-05-11; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-11; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-11.
- Technical positioning / exhaustion: score 0; updatedAt 2026-05-11; Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.

## 叙事是否过度外推

2026-05-11 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把温和回落直接外推成可加仓窗口。

## Duration 动作建议

当前档位：0 - No trade / wait。

原因：2026-05-11 does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait.

支持条件：
- 5D curve proxies do not show fresh 30Y-led bear steepening.
- The 5D rates move is small enough that there is no need to chase duration.
- Local CNN headline risk appetite is not in broad panic.

反对条件：
- 10Y and 30Y shock percentiles are not extreme in the available local-cache window.
- Technical exhaustion is not confirmed by RSI, Bollinger z-score, 20D percentile, or nine-turn proxy.
- DGS2, SOFR/Fed funds futures, MOVE, formal term premium, auction data, and CFTC positioning are unavailable.

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
- US30Y 九转: up 0 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 62.5 / 30Y 63.6; status neutral; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +1.14 / 30Y +1.03; status neutral; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +12bp 52%* / 30Y +8bp 35%*; status neutral; Percentile uses available local Treasury cache and is marked with *.
- MOVE index: unavailable; status unavailable; MOVE is not present in local cache.
- CFTC Treasury futures positioning: unavailable; status unavailable; CFTC futures positioning is not present in local cache.
- Timing overlay: No standalone timing signal; status wait; Technical panel does not upgrade the duration action without a fundamental shock.

结论：2026-05-11 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.

## 需要证伪/确认的下一批数据

- Rate shock percentiles use local Treasury cache from 2024-01-02 to 2026-05-11; full 10-year and full 2022+ windows are unavailable in local cache.
- DGS2 is unavailable because the local Treasury cache does not include the 2Y node.
- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s and 10s30s are used as long-end proxies.
- Treasury auction tail, bid-to-cover, and dealer take-down are unavailable in local cache.
- MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used only as risk proxies.
- CFTC Treasury futures positioning is unavailable in local cache.
- Oil, copper, gold, DXY, and HY OAS are unavailable in local cache.
