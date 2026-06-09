# 2026-05-16 Rates Duration Report

## 2026-05-16 一句话结论

2026-05-15 的美国利率日终数据显示显著 5D selloff shock：DGS10 5D 为 +21bp（94%*），DGS30 5D 为 +17bp（91%*）。 曲线是 parallel bear / mixed，技术衰竭有条件出现。Duration Action Panel 维持 3 - Start 10Y nibble / intermediate-duration watch。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-15。Latest confirmed U.S. rates data is 2026-05-15; 2026-05-16 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-15 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-05-15. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- FRED T5YIFR: inflation-forward cross-check; latestDate 2026-05-15. FRED T5YIFR is available through 2026-05-15.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-05-15. CNN Fear & Greed is greed as of 2026-05-15; VIX is neutral and junk bond demand is fear.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.09% | +9bp | +19bp | +31bp | +66bp | 94%* | 1.8 |
| DGS3 | 4.14% | +10bp | +22bp | +34bp | +67bp | 5D 95%*; 3M 87%* | 1.9 |
| DGS5 | 4.26% | +13bp | +24bp | +35bp | +63bp | 5D 95%*; 3M 86%* | 2.0 |
| DGS10 | 4.59% | +12bp | +21bp | +27bp | +54bp | 5D 94%*; 3M 86%* | 2.1 |
| DGS30 | 5.12% | +10bp | +17bp | +19bp | +44bp | 5D 91%*; 3M 86%* | 2.0 |

星号表示分位数使用 2024-01-02 到 2026-05-15 的本地 Treasury cache 代理，不是完整 10 年或完整 2022-01-01 后样本。该限制会降低极端分位的可比性。

## 市场前一交易日在交易什么

覆盖窗口：2026-05-12 to 2026-05-15。状态：missing_research_input。
摘要：Market reaction research input is missing; this panel is intentionally not inferring media consensus from local market data alone.
来源结构：media: 0 sources / 0%; institution: 0 sources / 0%; community: 0 sources / 0%

1）Research input missing: 100% - Use Module 1 and Module 2 for local diagnostics only; do not treat them as evidence of what the broader market narrative was trading.
   - automation / local rates dashboard / 2026-05-15: Local diagnostics: DGS10 5D +21bp (94%*); DGS30 5D +17bp (91%*); parallel bear / mixed; real-yield; technical exhaustion present.

## 哪段曲线在动

5D 比较日期是 2026-05-08。DGS3 +22bp，DGS5 +24bp，DGS10 +21bp，DGS30 +17bp。3s10s 为 45bp，5D 变化 -1bp；5s30s 为 86bp，5D 变化 -7bp；10s30s 为 53bp，5D 变化 -4bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move +24bp: real yield +16bp / 67%, breakeven +8bp / 33%, residual 0bp / 0%。

10Y 5D move +21bp: real yield +17bp / 81%, breakeven +4bp / 19%, residual 0bp / 0%。

30Y 5D move +17bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Technical positioning / exhaustion: ★★☆☆ score 2 - RSI and Bollinger z-scores show a yield-up exhaustion setup on 2026-05-15, but it is only a timing overlay.
2. Fed path repricing: ★☆☆☆ score 1 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
3. Inflation compensation shock: ★☆☆☆ score 1 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-15.
4. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
5. Growth scare / recession hedge: ☆☆☆☆ score 0 - DGS10 rose +21bp over 5D, so a growth-scare / recession-hedge rates rally is not confirmed.
6. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.

完整叙事检查：

- Technical positioning / exhaustion: score 2; updatedAt 2026-05-15; Technical signals can support timing only after rate-shock and driver attribution agree; they do not create a standalone trade.
- Fed path repricing: score 1; updatedAt 2026-05-15; Policy-path repricing remains a background narrative, but 2026-05-15 does not show a fresh front-end-led shock.
- Inflation compensation shock: score 1; updatedAt 2026-05-15; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-15; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
- Growth scare / recession hedge: score 0; updatedAt 2026-05-15; The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-15; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-15.

## 叙事是否过度外推

2026-05-15 的主流叙事没有达到单一拥挤状态。5D shock 已经显著，且 RSI / Bollinger 给出 timing 支持；但驱动主要是 10Y real-yield led，30Y term-premium proxy 没有继续恶化，MOVE / auction / CFTC 仍缺失。因此可以把它当成 intermediate duration 的条件化窗口，但不能把它直接外推成 long-end 或 convex duration。

## Duration 动作建议

当前档位：3 - Start 10Y nibble / intermediate-duration watch。

原因：The duration panel upgrades to intermediate duration because the 10Y shock is extreme, real-yield led, and technically stretched, while 30Y does not show enough independent participation to justify long-end duration.

支持条件：
- 5D curve proxies do not show fresh 30Y-led bear steepening.
- 10Y shock is extreme in the available local-cache window and is real-yield led.
- Local CNN headline risk appetite is not in broad panic.

反对条件：
- 30Y shock is elevated, but 30Y lags 10Y by more than 2bp over 5D, so long-end participation is not strong enough for index 4.
- Technical exhaustion is present, but it is only a timing overlay and cannot justify long-end duration by itself.
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

- US10Y 九转: up 4 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 4 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 72.2 / 30Y 71.4; status exhaustion; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +2.60 / 30Y +2.64; status exhaustion; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +33bp 83%* / 30Y +24bp 79%*; status neutral; Percentile uses available local Treasury cache and is marked with *.
- MOVE index: unavailable; status unavailable; MOVE is not present in local cache.
- CFTC Treasury futures positioning: unavailable; status unavailable; CFTC futures positioning is not present in local cache.
- Timing overlay: Timing support present; status watch; Technical exhaustion must be paired with rate-shock and driver attribution before any duration upgrade.

结论：Technical signals can support only a conditional timing overlay; they do not create a standalone duration trade.

## 需要证伪/确认的下一批数据

- Rate shock percentiles use local Treasury cache from 2024-01-02 to 2026-05-15; full 10-year and full 2022+ windows are unavailable in local cache.
- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s and 10s30s are used as long-end proxies.
- Treasury auction tail, bid-to-cover, and dealer take-down are unavailable in local cache.
- MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used only as risk proxies.
- CFTC Treasury futures positioning is unavailable in local cache.
- Oil, copper, gold, DXY, and HY OAS are unavailable in local cache.
- Market reaction research input macro_daily/data/2026-05-16_market_reaction_sources.json is unavailable; Module 1.5 will show a research-needed state.
