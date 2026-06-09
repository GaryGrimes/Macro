# 2026-05-15 Rates Duration Report

## 2026-05-15 一句话结论

2026-05-14 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 +6bp，DGS30 5D 为 +5bp，曲线是 parallel bear / mixed，技术衰竭没有确认。Duration Action Panel 维持 0 - No trade / wait。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-14。Latest confirmed U.S. rates data is 2026-05-14; 2026-05-15 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-14 作为 marketDate。

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.00% | +2bp | +8bp | +24bp | +60bp | 63%* | 0.8 |
| DGS3 | 4.04% | +4bp | +10bp | +25bp | +61bp | 5D 67%*; 3M 86%* | 0.9 |
| DGS5 | 4.13% | +1bp | +9bp | +23bp | +52bp | 5D 64%*; 3M 79%* | 0.8 |
| DGS10 | 4.47% | +1bp | +6bp | +18bp | +43bp | 5D 44%*; 3M 78%* | 0.6 |
| DGS30 | 5.02% | -1bp | +5bp | +13bp | +33bp | 5D 43%*; 3M 72%* | 0.6 |

星号表示分位数使用 2024-01-02 到 2026-05-14 的本地 Treasury cache 代理，不是完整 10 年或完整 2022-01-01 后样本。该限制会降低极端分位的可比性。

## 哪段曲线在动

5D 比较日期是 2026-05-07。DGS3 +10bp，DGS5 +9bp，DGS10 +6bp，DGS30 +5bp。3s10s 为 43bp，5D 变化 -4bp；5s30s 为 89bp，5D 变化 -4bp；10s30s 为 55bp，5D 变化 -1bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move +9bp: real yield +3bp / 33%, breakeven +6bp / 67%, residual 0bp / 0%。

10Y 5D move +6bp: real yield +4bp / 67%, breakeven +2bp / 33%, residual 0bp / 0%。

30Y 5D move +5bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
2. Fed path repricing: ★☆☆☆ score 1 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
3. Inflation compensation shock: ★☆☆☆ score 1 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-14.
4. Growth scare / recession hedge: ☆☆☆☆ score 0 - DGS10 rose +6bp over 5D, so a growth-scare / recession-hedge rates rally is not confirmed.
5. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.
6. Technical positioning / exhaustion: ☆☆☆☆ score 0 - Technical indicators do not show a clear yield-up exhaustion setup on 2026-05-14.

完整叙事检查：

- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-15; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
- Fed path repricing: score 1; updatedAt 2026-05-14; Policy-path repricing remains a background narrative, but 2026-05-14 does not show a fresh front-end-led shock.
- Inflation compensation shock: score 1; updatedAt 2026-05-14; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Growth scare / recession hedge: score 0; updatedAt 2026-05-14; The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-14; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-14.
- Technical positioning / exhaustion: score 0; updatedAt 2026-05-14; Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.

## 叙事是否过度外推

2026-05-14 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把温和上行直接外推成可加仓窗口。

## Duration 动作建议

当前档位：0 - No trade / wait。

原因：2026-05-14 does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait.

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

- US10Y 九转: up 3 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 3 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 67.4 / 30Y 65.7; status neutral; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +1.42 / 30Y +1.32; status neutral; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +15bp 59%* / 30Y +9bp 40%*; status neutral; Percentile uses available local Treasury cache and is marked with *.
- MOVE index: unavailable; status unavailable; MOVE is not present in local cache.
- CFTC Treasury futures positioning: unavailable; status unavailable; CFTC futures positioning is not present in local cache.
- Timing overlay: No standalone timing signal; status wait; Technical panel does not upgrade the duration action without a fundamental shock.

结论：2026-05-14 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.

## 需要证伪/确认的下一批数据

- Rate shock percentiles use local Treasury cache from 2024-01-02 to 2026-05-14; full 10-year and full 2022+ windows are unavailable in local cache.
- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s and 10s30s are used as long-end proxies.
- Treasury auction tail, bid-to-cover, and dealer take-down are unavailable in local cache.
- MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used only as risk proxies.
- CFTC Treasury futures positioning is unavailable in local cache.
- Oil, copper, gold, DXY, and HY OAS are unavailable in local cache.
- T5YIFR uses a Treasury-derived local proxy for 2026-05-14 because FRED T5YIFR cache ends on 2026-05-13.
