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

   - 顶部 ticker 图必须使用本地日频缓存，至少覆盖一年。
   - `1d / 7d / 30d / 6m / 1y` 切换必须可用。
   - 图表 hover 必须显示当前鼠标位置对应的日期或期限与数值。
   - 美债市场专栏标题下必须有一张 2Y / 5Y / 10Y / 30Y 曲线变化图。
   - Dashboard 的美债曲线说明用角落按钮展开，不要让展开逻辑覆盖图表 hover。

6. 写作原则

   - 先主线，后新闻。
   - 先权重，后细节。
   - 先传导链，后观点。
   - 先验证点，后仓位含义。
   - 不做新闻堆叠；每条催化必须有标签、来源层级、信息权重、影响资产和传导逻辑。

7. 交付前检查

   必须检查：

   - HTML 内联脚本语法；
   - 数据脚本可被加载；
   - 关键行情没有缩写错误，例如 BTC 不写成 `$80k`，而写完整数字；
   - 图表节点存在；
   - 旧日期、旧价格、旧涨跌幅没有残留。

   可使用：

   ```powershell
   node -e "const fs=require('fs'); const html=fs.readFileSync('morning_brief/YYYY-MM-DD_us_market_brief.html','utf8'); [...html.matchAll(/<script(?:\s+src=\"([^\"]+)\")?>([\s\S]*?)<\/script>/g)].forEach(s=>{ if(!s[1]) new Function(s[2]); }); console.log('html script ok')"
   ```

## 每日输出摘要

完成后向用户简要说明：

- 生成的 HTML 文件路径；
- 覆盖交易日；
- 是否使用实时数据或本地缓存；
- 哪些关键数据源已交叉核验；
- 是否存在需要人工复核的数据点。
