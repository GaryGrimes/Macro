# Macro 首页改版产品规格

本文件沉淀 2026-05-12 对话中确认的产品方向。自动化任务不能依赖聊天上下文，所以每日执行前必须先读取本文件和 `macro_daily/DAILY_AUTOMATION.md`。

## 一句话定位

Macro 看板从：

```text
US Inflation Expectation & Real Rate Regime Dashboard
```

改为：

```text
US Rates Shock & Duration Timing Dashboard
```

副标题语义：

```text
识别美债收益率异常波动、拆解主导驱动、判断市场正在交易什么分歧，并决定是否进入 duration 建仓/加仓窗口。
```

## 核心需求

用户每天打开首页，不是为了优先决定买 TIPS 还是 nominal Treasury，而是依次回答：

```text
1. 最近利率涨跌是否异常？
2. 是短端政策路径在动，还是长端 term premium / fiscal supply 在动？
3. 利率变化来自 real yield、breakeven，还是 term premium / residual？
4. 市场当前在交易什么分歧？
5. 主流叙事是否过度外推？
6. 技术面是否出现短期 exhaustion？
7. 当前应该不买、观察、试 10Y、加 10Y，还是加长端 / convex duration？
```

## 保留边界

- 已有页面不能删除。
- 首页原有 Treasury 曲线图保留，只改标题和右侧说明。
- `Macro` 页保留，用作 inflation expectation / breakeven / real yield / survey 背景页。
- `Fear` 页保留，用作 risk appetite / liquidity / sentiment 背景页。
- 原有 inflation expectation 模块降级为背景验证，不放在首页决策链核心位置。
- `My Variant View` 主观分歧模块本轮不要做。

## 首页模块顺序

### 1. 首屏 Hero + Treasury Curve

定位文案改成：

```text
US Rates Shock & Duration Timing
先判断利率异动是否罕见，再决定 duration 是否值得加。
```

保留 `US3Y / US10Y / US30Y` 曲线图。它的用途是先看短端政策路径与长端 term premium 谁在领涨/领跌。

### 2. Daily Macro Task Banner

首页打开时检查本地文件：

```text
macro_daily/data/YYYY-MM-DD_dashboard.json
macro_daily/reports/YYYY-MM-DD_rates_duration_report.md
```

如果同日数据和报告都存在，首页直接读取本地结果。

如果不存在，显示横幅提醒：

```text
今日 Macro 数据与研报尚未生成，请去 Codex 执行每日 Macro 自动化任务。
```

设计理由：当天可能多次打开 HTML 或点 Start，不能每次都重新分析；每日深度分析应由自动化任务生成并缓存。

### 3. Rate Shock Tape

目的：

```text
今天 / 本周 / 本月利率动得大不大，罕不罕见？
```

展示：

```text
DGS2 / DGS3 / DGS5 / DGS10 / DGS30
level
1D / 5D / 21D / 3M bp change
近10年 historical percentile
2022+ regime percentile
vol-adjusted z-score
signal
```

关键原则：

- 不能只看绝对 bp 变化。
- 必须同时看近 10 年 percentile 和 2022 后 regime percentile。
- 示例含义：过去 10 年看是 95 分位，但 2022 后 regime 里只是 70 分位，这两种交易含义不同。

### 4. Market Narrative Ranking

目的：

```text
市场现在到底在交易什么分歧？
```

不是新闻列表，而是规则化叙事排序器。

固定六类：

```text
1. Fed path repricing
2. Inflation compensation shock
3. Growth scare / recession hedge
4. Long-end term premium / fiscal supply
5. Risk appetite / liquidity shock
6. Technical positioning / exhaustion
```

每类给 `0-3` score。首页用星星表达：

```text
3 = ★★★☆
2 = ★★☆☆
1 = ★☆☆☆
0 = ☆☆☆☆
```

排序：

```text
先按权重/score，再按证据时间倒序。
```

每类下方继续列出核心叙事和检查项。例如 Fed path repricing 检查：

```text
DGS2 / DGS3 上行
SOFR futures 隐含降息次数减少
Fed funds futures terminal / cuts repricing
2s5s flattening
real yield 上行
```

### 5. Duration Action Panel

目的：

```text
直接告诉当前更适合不买、观察、试 10Y、加 10Y，还是加长端 / convex duration。
```

固定档位：

```text
0. No trade / wait
1. Watchlist only
2. Start 10Y nibble
3. Add 10Y / intermediate duration
4. Add long-end duration
5. Add convex duration / STRIPS-like exposure
```

必须解释：

- 为什么当前是这个档位。
- 支持条件是什么。
- 反对条件是什么。
- 什么信号会让档位升级或降级。

核心原则：

- 如果是 `bear steepening` 且 30Y 独立走弱，不要机械买 30Y。
- 如果 10Y 冲击极端、real yield 主导、长端 term premium 没失控，可以先考虑 10Y。
- 只有当 30Y term premium / curve steepening 开始稳定，才考虑加长端。

### 6. Technical Exhaustion Panel

目的：

```text
判断短期是否过度单边，是否支持试仓 timing。
```

指标：

```text
US10Y 九转
US30Y 九转
RSI
Bollinger z-score
20D move percentile
MOVE index
CFTC Treasury futures positioning
```

原则：

- 技术指标只做 timing overlay。
- 不能单靠九转、RSI 或 Bollinger 给交易建议。
- 最佳用法是和 Rate Shock / Driver Attribution / Narrative Ranking 叠加。

## 自动化任务职责

每日任务需要完成三件事：

1. 本地加载或更新市场数据。
2. 计算结构化指标和规则分数。
3. 调用模型生成深度分析，并把结果转换成首页可读取的 JSON。

每日任务输出：

```text
macro_daily/data/YYYY-MM-DD_dashboard.json
macro_daily/reports/YYYY-MM-DD_rates_duration_report.md
```

首页不负责做深度推理，只负责展示每日任务产物；没有产物就提醒用户执行任务。

## 数据与分析边界

- 数据缺失时写 `unavailable`，不要编。
- 使用 proxy 时写 `proxyUsed: true`。
- 报告里所有日期写绝对日期。
- 不写“今天/昨天”这种相对日期。
- 不提供投资建议承诺，只输出条件化的 duration timing 诊断。
- 每个结论必须可追溯到指标、叙事或技术证据。

## 后续扩展

后续可以再接：

- ACM / Kim-Wright term premium 正式数据源。
- SOFR futures / Fed funds futures implied cuts。
- Treasury auction tail / bid-to-cover。
- CFTC Treasury futures positioning。
- Cleveland / UMICH / NY Fed inflation expectation 慢变量。

但第一版优先级是：

```text
1. Rate Shock Tape
2. Market Narrative Ranking
3. Duration Action Panel
4. Technical Exhaustion Panel
```
