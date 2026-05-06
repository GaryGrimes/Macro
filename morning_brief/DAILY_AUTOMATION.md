# 每日美股市场简报自动化指令

本文件是每日生成 `morning_brief` 简报时使用的执行指令。目标是把早报能力独立放在本目录下，避免影响 Macro 看板现有入口、样式、服务端逻辑和缓存结构。

## 固定边界

- 只在 `morning_brief/` 下新增或更新早报相关文件。
- 不修改项目根目录的 `index.html`、`app_v2.js`、`styles_v2.css`、`server.js`，除非用户明确要求把早报接入 Macro 看板。
- 每日输出应是独立 HTML，可直接用浏览器打开。
- 数据文件放在 `morning_brief/data/`，本地缓存放在 `morning_brief/data/cache/`，更新脚本放在 `morning_brief/scripts/`。

## 每日运行目标

生成上一美股交易日的市场早报，默认文件名：

```text
morning_brief/YYYY-MM-DD_us_market_brief.html
```

其中 `YYYY-MM-DD` 使用早报生成日，而正文中必须明确写出覆盖交易日，例如：

```text
覆盖交易日：2026-05-04
```

## 执行流程

1. 确认日期

   - 用户在香港时区早上运行时，覆盖交易日通常是美国市场上一交易日。
   - 遇到美股休市、周末或节假日，必须明确写出“无新完整交易日”，不要伪造收盘数据。

2. 更新本地行情缓存

   优先运行：

   ```powershell
   python morning_brief\scripts\update_market_cache.py YYYY-MM-DD
   ```

   - `YYYY-MM-DD` 是覆盖交易日。
   - 成功后应更新 `morning_brief/data/cache/market_history.json`。
   - 如果行情源限流、需要 apikey 或网络失败，可以使用已有缓存，但必须在早报的数据说明里标注“使用本地缓存/部分数据需复核”。

3. 核验关键行情

   写入正文前必须核对以下数据，且至少用两个可靠来源交叉验证：

   - Dow Jones 收盘点位与涨跌幅；
   - S&P 500 收盘点位与涨跌幅；
   - Nasdaq Composite 收盘点位与涨跌幅；
   - Russell 2000 收盘点位与涨跌幅；
   - VIX 收盘点位与涨跌幅；
   - 2Y / 5Y / 10Y / 30Y Treasury 收益率；
   - Brent / WTI 收盘价与涨跌幅；
   - DXY、Gold、BTC。

   红线：如果三大指数强弱顺序、油价、收益率或 BTC 价格无法确认，不要继续写结论。先补数据源。

   数据一致性要求：

   - 页面中所有重复出现的同一组市场数据必须来自同一份当日数据对象或同一组常量，不允许一个图表手写旧值、另一个表格写新值。
   - 美债名义曲线、Treasury Curve Move 图、5.1 曲线变化表、Dashboard 美债摘要必须同时更新到同一个覆盖交易日。
   - 所有资产的历史序列、当日 `intraday` 序列、显示值必须使用同一数量级单位。BTC 必须全程使用美元价格，例如 `81719`，不得在历史序列里用 `81.719` 或 `81` 代表千美元。
   - 生成前必须先跑 `morning_brief/scripts/audit_market_cache.js`，再跑 `morning_brief/scripts/validate_market_data.js`。如果发现缓存最新点和页面显示不一致、非交易日假波动、数量级混用、长期区间稀疏、`intraday` 点数不足、旧 hover 逻辑残留，必须先修数据再写正文。
   - 如果正文写明 Nasdaq / S&P 500 创新高，`6m / 1y` 图表的长期走势必须体现最新收盘点高于此前区间高点；不能让抽样或旧缓存造成视觉上“前高压住最新点”。
   - 如果使用本地缓存补足历史序列，必须把最新收盘点追加到缓存和当日数据文件，并在数据说明中标注“本地缓存/部分数据需复核”。

4. 生成或更新 HTML

   HTML 必须保留当前早报模板顺序：

   - 标题三要素；
   - 一句话总览；
   - 固定市场仪表盘；
   - 美股复盘主线；
   - 今日催化与事件分层；
   - 美债市场专栏；
   - 今天该验证什么；
   - 板块和主题异动；
   - 对重点持仓/关注资产的影响。

5. 图表要求

   - 顶部 ticker 图必须使用本地日频缓存，至少覆盖一年；若能拿到官方交易日历史表，优先用交易日序列，不要为了凑 365 个自然日而生成平滑假走势。
   - `1d / 7d / 30d / 6m / 1y` 切换必须可用。
   - `1d` 必须展示日内走势，不得用日频缓存点拼接冒充日内图。每个 ticker 的 `intraday` 至少 30 个点；若没有真实分钟线，必须使用经核验的开盘、盘中关键时段、收盘路径重建，并在数据说明中标注。
   - `7d / 30d / 6m / 1y` 必须展示对应周期的日频走势。`30d` 至少 20 个点，`6m` 至少 45 个点，`1y` 至少 60 个点。若历史数组是交易日序列，6m 使用约 126 个交易日、1y 使用约 252 个交易日；若是自然日缓存，非交易日必须以前值延续。长期图要优先保证趋势方向和最新高低点关系正确；抽样点不得误导读者。
   - 不做 hover 悬浮框。图表必须在静态状态下自解释：标题、图例、轴标签、关键点标注和图下注释应足够说明读法。
   - 美债市场专栏标题下必须有一张 2Y / 5Y / 10Y / 30Y 曲线变化图。
   - Dashboard 的美债曲线说明用角落按钮展开，不得遮挡曲线、图例或图下注释。
   - Regime map 等小图的点位标签必须避让坐标轴文字。右侧点位标签应向左显示，靠近轴线的标签应偏移并可加浅底，避免覆盖“增长承压 / 增长韧性 / 通胀压力”等轴说明。

6. 写作原则

   - 先主线，后新闻。
   - 先权重，后细节。
   - 先传导链，后观点。
   - 先验证点，后仓位含义。
   - 不做新闻堆叠；每条催化必须有标签、来源层级、信息权重、影响资产和传导逻辑。
   - 不写模糊的 “Sign-flip 条件” 卡片。若需要反转/失效判断，必须命名为“今日交易假设的失效条件”或同等明确标题，并用表格写清：当前假设、失效触发器、先看资产、解读/动作含义。
   - 失效触发器必须有可观察阈值或时间条件，例如收益率点位、油价点位、VIX 水平、板块相对强弱、开盘后若干小时内是否扩散；不能只写“若走弱/若强硬/若需求弱”。
   - “今天该验证什么”负责列今日观察变量；“交易假设的失效条件”负责说明什么信号会证伪早报主线。两者不能重复。

7. 交付前检查

   必须检查：

   - HTML 内联脚本语法；
   - 数据脚本可被加载；
   - 关键行情没有缩写错误，例如 BTC 不写成 `$80k`，而写完整数字；
   - 图表节点存在；
   - 旧日期、旧价格、旧涨跌幅没有残留。
   - 页面源码中不得残留已废弃的 `tooltip` / `mousemove` / `pointermove` / `bindSvgHover` 等 hover 逻辑。
   - `1d` ticker 图使用 `intraday` 数据；所有 ticker 的 `intraday` 数组至少包含 30 个点。
   - 对 BTC、Gold、Oil、指数、美债收益率分别检查数量级边界，避免把 `81.719` 和 `81719` 混在一张图里。
   - Nasdaq / S&P 500 若在正文中写“创新高”，数据检查必须确认最新点高于此前 `6m / 1y` 历史最高点。
   - Treasury Curve Move 图的日期和 bp 变化必须与 5.1 曲线变化表一致。
   - 视觉检查必须覆盖移动/桌面视口，重点看 ticker strip、Dashboard 双图、Treasury Curve Move、Regime map 是否文字重叠或遮挡。

   可使用：

   ```powershell
   node -e "const fs=require('fs'); const html=fs.readFileSync('morning_brief/YYYY-MM-DD_us_market_brief.html','utf8'); [...html.matchAll(/<script(?:\s+src=\"([^\"]+)\")?>([\s\S]*?)<\/script>/g)].forEach(s=>{ if(!s[1]) new Function(s[2]); }); console.log('html script ok')"
   ```

   建议追加数据一致性检查：

   ```powershell
   node morning_brief/scripts/audit_market_cache.js morning_brief/data/YYYY-MM-DD_market_data.js
   node morning_brief/scripts/validate_market_data.js morning_brief/data/YYYY-MM-DD_market_data.js
   ```

## 每日输出摘要

完成后向用户简要说明：

- 生成的 HTML 文件路径；
- 覆盖交易日；
- 是否使用实时数据或本地缓存；
- 哪些关键数据源已交叉核验；
- 是否存在需要人工复核的数据点。
