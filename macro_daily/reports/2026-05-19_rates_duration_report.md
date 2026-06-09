# 2026-05-19 Rates Duration Report

## 2026-05-19 一句话结论

2026-05-18 的美国利率日终数据显示显著 5D selloff shock：DGS10 5D 为 +19bp（86%），DGS30 5D 为 +16bp（79%）。 曲线是 parallel bear / mixed，技术衰竭有条件出现。Duration Action Panel 维持 3 - Start 10Y nibble / intermediate-duration watch。

## 利率冲击是否罕见

本地可确认的市场日期是 2026-05-18。Latest confirmed U.S. rates data is 2026-05-18; 2026-05-19 does not yet have a complete U.S. rates close in local cache. 本报告使用 2026-05-18 作为 marketDate。

## 多方验证记录

- U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML: primary rates source; latestDate 2026-05-18. Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.
- FRED T5YIFR: inflation-forward cross-check; latestDate 2026-05-18. FRED T5YIFR is available through 2026-05-18.
- CNN Fear & Greed local proxy: risk-appetite cross-check; latestDate 2026-05-15. CNN Fear & Greed is greed as of 2026-05-15; VIX is neutral and junk bond demand / HY OAS is fear.
- FRED public market data cache: public history and cross-asset feed; latestDate 2026-05-15. Loaded 16 public series for rate history and cross-asset checks.
- Federal Reserve H.15 / FRED: official secondary rates cross-check; latestDate checked separately during run. Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | 4.07% | -2bp | +12bp | +36bp | +60bp | 70% | 1.1 |
| DGS3 | 4.14% | 0bp | +18bp | +42bp | +64bp | 5D 82%; 3M 76% | 1.6 |
| DGS5 | 4.27% | +1bp | +20bp | +43bp | +61bp | 5D 84%; 3M 76% | 1.7 |
| DGS10 | 4.61% | +2bp | +19bp | +35bp | +52bp | 5D 86%; 3M 75% | 1.9 |
| DGS30 | 5.14% | +2bp | +16bp | +26bp | +43bp | 5D 79%; 3M 68% | 1.9 |

分位数使用 1962-01-02 到 2026-05-18 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。

## 市场 2026-05-18 在交易什么

覆盖窗口：2026-05-15 to 2026-05-19。状态：ready。
摘要：Market reaction centered on oil-led inflation pressure, renewed Fed-hike pricing, and long-end term-premium/auction absorption; community discussion echoed the long-duration financing shock but was kept low weight.
来源结构：media: 8 sources / 68%; community: 4 sources / 11%; official: 2 sources / 21%

1）Fed path / real-yield repricing: 31% - Wire and market commentary framed the Treasury selloff as a repricing away from 2026 cuts and toward possible Fed hikes as energy-driven inflation pressure persisted.
   - media / Reuters via MarketScreener / 2026-05-15: Reuters reported that Fed policy expectations had tilted toward possible hikes, with CME FedWatch odds for at least one December hike rising to 49.5% from 14.3% a week earlier.
   - media / Reuters via Sahm Capital / 2026-05-15: Reuters described U.S. yields reaching multi-month highs as investors priced a higher probability that the Fed may need to hike in response to inflation pressure.
   - community / Reddit r/Economics / 2026-05-18: Discussion focused on futures pricing a hike rather than cuts, but this is treated as low-reliability community color.
2）Energy inflation and inflation-expectation repricing: 28% - Coverage repeatedly tied the global rates selloff to oil above $100 and inflation expectations from the Middle East energy shock.
   - media / Reuters via Investing.com Canada / 2026-05-18: Reuters reported that bonds from Tokyo to New York extended losses as rising energy prices fanned inflation fears and rate-hike bets.
   - media / Reuters via Investing.com / 2026-05-18: Reuters noted 10Y Treasury yields had reached 4.631% and 30Y yields 5.159% during the global bond rout as oil-driven inflation risk dominated the market setup.
   - media / Kiplinger / 2026-05-15: Kiplinger linked rising long-term rates to crude oil above $100 and market concern that elevated energy prices would feed longer-term inflation.
3）Long-end term premium / fiscal supply and auction absorption: 23% - The long-end narrative was active because 30Y yields remained above 5%, but auction evidence was mixed: the May 13 long-bond sale tailed modestly while indirect demand stayed sizable.
   - official / U.S. Treasury / 2026-05-18: Treasury's 2026-05-18 curve showed DGS30 at 5.14% and DGS10 at 4.61%, keeping long-end yield levels elevated.
   - official / TreasuryDirect / 2026-05-13: The 30Y auction cleared at a 5.046% high yield with a 2.30 bid-to-cover ratio, giving a direct supply-absorption check for the long end.
   - media / Fazen Markets / InvestingLive summary / 2026-05-13: Auction commentary characterized the result as a modest tail with healthy indirect participation but a tepid overall grade.
4）Risk appetite / liquidity shock: 10% - Equity and dollar coverage showed the bond rout denting sentiment, but the move was not a full risk-off liquidity shock because rates and oil were the primary catalysts.
   - media / Reuters via Investing.com / 2026-05-17: Reuters described the global bond selloff as denting risk appetite while oil and elevated yields drove the cross-asset tone.
   - media / Reuters via MeckTimes / 2026-05-18: Reuters reported that U.S. stocks were mixed after yields and oil eased from intraday pressure, implying risk stress was present but not dominant.
5）Technical momentum / exhaustion: 8% - Technical and community commentary focused on the speed of the yield move and mortgage-rate transmission, but this remains a timing overlay.
   - community / Reddit r/MortgageRates / 2026-05-18: Mortgage-rate commentary described a minor recovery after Friday's sharp selloff and noted the 10Y yield had closed at 4.59% on 2026-05-15.
   - community / Reddit r/RealEstate / 2026-05-18: Community discussion emphasized 10Y around 4.6% and 30Y above 5% as a mortgage and financing-cost shock.

外部叙事与本地 tape 差异：external coverage ranked Fed path / real-yield repricing / Energy inflation and inflation-expectation repricing highest, but local 5D attribution is real-yield led for 5Y and real-yield led for 10Y; 10Y breakeven contribution is +1bp, so the report treats the inflation/Fed-path story as market digestion rather than proof of a breakeven-led tape.

## 哪段曲线在动

5D 比较日期是 2026-05-11。DGS3 +18bp，DGS5 +20bp，DGS10 +19bp，DGS30 +16bp。3s10s 为 47bp，5D 变化 +1bp；5s30s 为 87bp，5D 变化 -4bp；10s30s 为 53bp，5D 变化 -3bp。

含义：Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.

## 驱动归因

5Y 5D move +20bp: real yield +18bp / 90%, breakeven +2bp / 10%, residual 0bp / 0%。

10Y 5D move +19bp: real yield +18bp / 95%, breakeven +1bp / 5%, residual 0bp / 0%。

30Y 5D move +16bp。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.

## 市场正在交易什么分歧

1. Technical positioning / exhaustion: ★★☆☆ score 2 - RSI and Bollinger z-scores show a yield-up exhaustion setup on 2026-05-18, but it is only a timing overlay.
2. Inflation compensation shock: ★☆☆☆ score 1 - Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-18.
3. Risk appetite / liquidity shock: ★☆☆☆ score 1 - Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.
4. Fed path repricing: ☆☆☆☆ score 0 - The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.
5. Growth scare / recession hedge: ☆☆☆☆ score 0 - DGS10 rose +19bp over 5D, so a growth-scare / recession-hedge rates rally is not confirmed.
6. Long-end term premium / fiscal supply: ☆☆☆☆ score 0 - Local curve proxies do not show independent 30Y stress over the 5D window.

完整叙事检查：

- Technical positioning / exhaustion: score 2; updatedAt 2026-05-18; Technical signals can support timing only after rate-shock and driver attribution agree; they do not create a standalone trade.
- Inflation compensation shock: score 1; updatedAt 2026-05-18; Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.
- Risk appetite / liquidity shock: score 1; updatedAt 2026-05-15; Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.
- Fed path repricing: score 0; updatedAt 2026-05-18; Policy-path repricing remains a background narrative, but 2026-05-18 does not show a fresh front-end-led shock.
- Growth scare / recession hedge: score 0; updatedAt 2026-05-18; The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.
- Long-end term premium / fiscal supply: score 0; updatedAt 2026-05-18; The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-18.

## 叙事是否过度外推

2026-05-18 的主流叙事没有达到单一拥挤状态。5D shock 已经显著，且 RSI / Bollinger 给出 timing 支持；但驱动主要是 10Y real-yield led，30Y term-premium proxy 没有继续恶化，MOVE / auction / CFTC 仍缺失。因此可以把它当成 intermediate duration 的条件化窗口，但不能把它直接外推成 long-end 或 convex duration。

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

- US10Y 九转: up 5 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- US30Y 九转: up 5 / down 0; status neutral; Proxy rule compares each yield with its value four valid observations earlier.
- RSI: 10Y 72.7 / 30Y 72.7; status exhaustion; RSI is calculated on yield changes, not bond-price changes.
- Bollinger z-score: 10Y +2.39 / 30Y +2.42; status exhaustion; 20 valid-observation moving average and standard deviation.
- 20D move percentile: 10Y +35bp 81% / 30Y +26bp 72%; status neutral; Percentile uses the locally cached public history.
- MOVE index: unavailable; status unavailable; MOVE is not present in local cache.
- CFTC Treasury futures positioning: unavailable; status unavailable; CFTC futures positioning is not present in local cache.
- Timing overlay: Timing support present; status watch; Technical exhaustion must be paired with rate-shock and driver attribution before any duration upgrade.

结论：Technical signals can support only a conditional timing overlay; they do not create a standalone duration trade.

## 需要证伪/确认的下一批数据

- SOFR futures and Fed funds futures implied cuts are unavailable in local cache.
- ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.
- MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used as risk proxies.
- CFTC Treasury futures positioning is unavailable in local cache.
- Gold is unavailable in local cache.
