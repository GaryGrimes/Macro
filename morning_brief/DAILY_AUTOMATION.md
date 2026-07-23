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

总优先级：信息搜集与市场解读高于对每个边缘行情点的伪精确。先确认主线、资产强弱顺序、因果传导和下一交易日的验证点，再补足支撑判断所需的关键数据；不要为了填满表格牺牲分析质量。

1. 确认日期

   - 用户在香港时区早上运行时，覆盖交易日通常是美国市场上一交易日。
   - 遇到美股休市、周末或节假日，必须明确写出“无新完整交易日”，不要伪造收盘数据。

2. 采集当日富途早报

   在生成本方早报之前运行：

   ```powershell
   python3 morning_brief\scripts\fetch_futu_morning_brief.py YYYY-MM-DD
   ```

   - `YYYY-MM-DD` 是北京时间的早报生成日，不是覆盖交易日。
   - 固定读取公开的“富途早晚报”专题（topic `162`），只选择北京时间当日发布且标题以“富途早报”开头的最新文章；不得把“美股前瞻”或其他栏目误作富途早报。
   - 当日没有匹配文章时，脚本必须写出 `status=not_published` 的 manifest 并返回非零状态；不得使用前一日文章冒充。
   - 固定落盘目录为 `morning_brief/data/futu/YYYY-MM-DD/`，至少包含 `manifest.json`、原始 `article.html`、正文 `article_body.html`、清洗后的 `article.txt` 以及 `images/` 下的正文原图。manifest 必须记录文章 URL、发布时间、正文哈希、图片原始 URL、本地路径、哈希、字节数和失败项。
   - 图片是信息源的一部分。后续查漏补缺必须实际检查有信息量的图表、概念图、表格截图及其上下文，不能只读取图片 alt 文本；纯装饰图可以忽略，但要在审阅记录中说明。
   - `failed` 或 `partial` 必须明确报告采集不完整；不得把不完整采集写成“已成功吸收”。`not_published` 可以在注明限制后继续独立早报流程。

3. 更新本地行情缓存

   优先运行：

   ```powershell
   python morning_brief\scripts\update_market_cache.py YYYY-MM-DD
   ```

   - `YYYY-MM-DD` 是覆盖交易日。
   - 成功后应更新 `morning_brief/data/cache/market_history.json`。
   - 更新器按 Yahoo Finance 日线、FRED 官方日线、已有缓存的顺序处理；任一配置资产无法更新到覆盖交易日时必须返回失败，不得把旧缓存伪装成当日数据。
   - 更新器默认只更新缓存，不再覆盖历史日期的数据脚本。若确需同步一个已经存在的数据脚本，可把其路径作为第二个参数显式传入。
   - 如果行情源限流、需要 apikey 或网络失败，可以使用已有缓存，但必须在早报的数据说明里标注“使用本地缓存/部分数据需复核”。
   - 已有当日核验配置时，可运行 `python morning_brief\scripts\build_verified_market_data.py morning_brief\data\YYYY-MM-DD_verified_market.json`，一次完成一年历史缓存、当日序列与页面数据脚本的生成。

4. 核验关键行情

   写入正文前必须核对以下数据，且至少用两个可靠来源交叉验证：

   - Dow Jones 收盘点位与涨跌幅；
   - S&P 500 收盘点位与涨跌幅；
   - Nasdaq Composite 收盘点位与涨跌幅；
   - Russell 2000 收盘点位与涨跌幅；
   - VIX 收盘点位与涨跌幅；
   - 2Y / 5Y / 10Y / 30Y Treasury 收益率；
   - Brent / WTI 收盘价与涨跌幅；
   - DXY、Gold、BTC。

   红线：三大指数强弱顺序、油价方向和美债曲线方向必须确认；它们直接决定正文主线。边缘资产的精确小数若暂时无法确认，可以采用可靠近似值，但要标注口径，不得据此写过度精确的结论。

   数据一致性要求：

   - 页面中所有重复出现的同一组市场数据必须来自同一份当日数据对象或同一组常量，不允许一个图表手写旧值、另一个表格写新值。
   - 美债名义曲线、Treasury Curve Move 图、5.1 曲线变化表、Dashboard 美债摘要必须同时更新到同一个覆盖交易日。
   - 所有资产的历史序列、当日 `intraday` 序列、显示值必须使用同一数量级单位。BTC 必须全程使用美元价格，例如 `81719`，不得在历史序列里用 `81.719` 或 `81` 代表千美元。
   - 生成前必须先跑 `morning_brief/scripts/audit_market_cache.js`，再跑 `morning_brief/scripts/validate_market_data.js`。如果发现缓存最新点和页面显示不一致、非交易日假波动、数量级混用、长期区间稀疏、`intraday` 点数不足、旧 hover 逻辑残留，必须先修数据再写正文。
   - 如果正文写明 Nasdaq / S&P 500 创新高，`6m / 1y` 图表的长期走势必须体现最新收盘点高于此前区间高点；不能让抽样或旧缓存造成视觉上“前高压住最新点”。
   - 如果使用本地缓存补足历史序列，必须把最新收盘点追加到缓存和当日数据文件，并在数据说明中标注“本地缓存/部分数据需复核”。

5. 生成或更新 HTML 初稿

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

   模块 2 / 固定市场仪表盘必须先写“昨日第一事实”和“市场昨天交易逻辑”，再进入 ticker 图和资产表。不能只写机械的行情表或泛泛解释。必须明确：

   - 昨天最重要的事实是什么，例如非农、CPI、FOMC、公司财报、油价冲击或地缘事件；
   - 这个事实如何改变市场定价，例如 Fed path、real yield、breakeven、term premium、risk appetite、earnings beta；
   - 至少三条价格证据是否同向验证，例如 2Y/10Y、Nasdaq/Russell、VIX、DXY、Gold、BTC、油价、重点板块；
   - 对今天最先要验证的变量是什么。模块 2 的即时交易逻辑必须比后文催化表更早出现，后文只能展开，不能首次提出主线。

6. 吸收当日富途早报（初稿完成后的最后一道内容步骤）

   - 必须先完成基于权威来源、独立研究和行情证据的本方初稿，再查看当日富途早报正文及图片。富途不得参与先验主线形成，定位仅为“查漏补缺”。
   - 逐项比较富途材料与初稿，并把内部审阅记录落盘为 `morning_brief/data/futu/YYYY-MM-DD/absorption_review.json`。顶层 `status` 使用 `complete`；每项至少包含：`候选信息 / 初稿是否已覆盖 / 信息重要度 / 富途来源层级 / 独立核验来源 / 核验结果 / 置信度 / 纳入或排除 / 理由`。若当日未发布，写 `status=skipped_not_published` 和原因，不生成虚构候选项。
   - 优先寻找可能遗漏的高重要度宏观事件、政策变化、公司公告、财报线索、板块传导、异常价格行为和下一交易日催化；不得为了增加篇幅吸收低权重新闻。
   - 富途转载、二手引述、未注明原始出处或仅出现在图片中的断言，一律降权。涉及数字、政策、公司公告、市场收盘和因果判断时，必须回到官方公告、监管机构、公司 IR、交易所数据或至少一个独立可靠来源复核。
   - 置信度分为高 / 中 / 低：高为原始来源与价格证据一致；中为可靠二手来源且部分交叉验证；低为单一二手来源、图片断言或无法复核。低置信度内容原则上不进入结论，只能作为待验证点并明确保留意见。
   - 对与初稿冲突的内容不得直接覆盖。应并列证据，判断是时间口径、市场口径、事实错误还是合理分歧；无法解决时保留本方独立结论并披露冲突。
   - 最终 HTML 只写经筛选后的增量信息，并标明富途线索及其独立核验来源；不整段复制富途全文，不把富途原图作为邮件附件。若确有必要引用图中信息，应转述结论、链接原文并说明核验情况。
   - 修改初稿后，重新执行全部数据一致性、HTML、视觉、结构和空目录离线检查。最终发送版本必须是吸收步骤完成后的版本。

7. 图表要求

   - 顶部 ticker 图必须使用本地日频缓存，至少覆盖一年；若能拿到官方交易日历史表，优先用交易日序列，不要为了凑 365 个自然日而生成平滑假走势。
   - `1d / 7d / 30d / 6m / 1y` 切换必须可用。
   - `1d` 必须展示日内走势，不得用日频缓存点拼接冒充日内图。每个 ticker 的 `intraday` 至少 30 个点；若没有真实分钟线，必须使用经核验的开盘、盘中关键时段、收盘路径重建，并在数据说明中标注。
   - `7d / 30d / 6m / 1y` 必须展示对应周期的日频走势。`30d` 至少 20 个点，`6m` 至少 45 个点，`1y` 至少 60 个点。若历史数组是交易日序列，6m 使用约 126 个交易日、1y 使用约 252 个交易日；若是自然日缓存，非交易日必须以前值延续。长期图要优先保证趋势方向和最新高低点关系正确；抽样点不得误导读者。
   - S&amp;P/ticker 历史图、Treasury 曲线图、美债期限变化图和 Regime map 必须支持 hover；悬浮框显示对应日期/期限及完整数值，并保持在面板内、不能被裁切或遮挡。静态状态下仍须通过标题、图例、轴标签和图下注释自解释。
   - 美债市场专栏标题下必须有一张 2Y / 5Y / 10Y / 30Y 曲线变化图。
   - 美债期限变化图固定提供 `1d / 7d / 30d / 6m` 切换。图下列出四个窗口的结构简介，空间不足时用“展开全部分析 / 收起详细分析”控制完整文字；切换期限时标题、曲线、bp 变化、Hover 和对应简介高亮必须同步更新。
   - “5.1 曲线变化”表按 `期限 / 1d / 7d / 30d / 6m / 含义` 排列。四个窗口只显示该窗口的 bp 变化，避免重复当前收益率；保留正负号和红涨绿跌。“含义”必须概括半年、月、周、日的完整演变，而非只解释 1d。
   - Dashboard 的美债曲线说明用角落按钮展开，不得遮挡曲线、图例或图下注释。
   - Regime map 默认以各时间点的几何重心为视图中心并自动包住点群，支持滚轮及 `− / ↺ / +` 缩放。中性轴离开当前视野时要贴边显示为虚线，不能让读者误把局部视图边缘当成新原点。
   - Regime map 按 `30d → 7d → 1d → 当前` 绘制带箭头的轨迹。点位标签必须动态避让彼此、轨迹和坐标轴文字；可加浅底，但不得覆盖“增长承压 / 增长韧性 / 通胀压力”等轴说明。
   - Regime 区固定保留五张卡：原始“增长韧性 × 通胀压力”，以及“实际利率 × 通胀补偿”“美元流动性 × 市场宽度”“Fed path × term premium”“AI capex 动能 × 变现/ROI 证据”。五张卡必须共用自动居中、缩放、贴边中性轴、箭头轨迹和 hover 规则。
   - “实际利率 × 通胀补偿”和“Fed path × term premium”优先使用官方、可复核的利率数据；“美元流动性 × 市场宽度”和“AI capex × ROI”若使用复合评分或事件评分，必须在卡片正文中明确标注口径，不得包装成交易所直接报价。

8. 写作原则

   - 先主线，后新闻。
   - 先权重，后细节。
   - 先传导链，后观点。
   - 先验证点，后仓位含义。
   - 不做新闻堆叠；每条催化必须有标签、来源层级、信息权重、影响资产和传导逻辑。
   - 信息搜集优先覆盖：权威收盘综述、主导板块与个股、政策/地缘变化、下一交易日或下一周的官方日历、公司财报与美债供给。正文必须回答“为什么是今天发生”“为什么是这些资产反应”“什么价格会证伪”。
   - 不写模糊的 “Sign-flip 条件” 卡片。若需要反转/失效判断，必须命名为“今日交易假设的失效条件”或同等明确标题，并用表格写清：当前假设、失效触发器、先看资产、解读/动作含义。
   - 失效触发器必须有可观察阈值或时间条件，例如收益率点位、油价点位、VIX 水平、板块相对强弱、开盘后若干小时内是否扩散；不能只写“若走弱/若强硬/若需求弱”。
   - “今天该验证什么”负责列今日观察变量；“交易假设的失效条件”负责说明什么信号会证伪早报主线。两者不能重复。

9. 交付前检查

   必须检查：

   - HTML 内联脚本语法；
   - 数据脚本可被加载；
   - 关键行情没有缩写错误，例如 BTC 不写成 `$80k`，而写完整数字；
   - 图表节点存在；
   - 旧日期、旧价格、旧涨跌幅没有残留。
   - 四张核心图的 `pointermove` / `pointerleave` 交互必须存在并可触发；悬浮框不能超出面板或盖住展开按钮。
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
    node morning_brief/scripts/validate_html.js morning_brief/YYYY-MM-DD_us_market_brief.html
    ```

## 发布与本地数据归档

每次生成的报告必须连同已落盘的本地数据一起进入仓库，不得只提交 HTML。固定归档范围为：

- `morning_brief/YYYY-MM-DD_us_market_brief.html`
- `morning_brief/data/YYYY-MM-DD_verified_market.json`
- `morning_brief/data/YYYY-MM-DD_market_data.js`
- `morning_brief/data/cache/market_history.json`
- `morning_brief/data/futu/YYYY-MM-DD/manifest.json`
- `morning_brief/data/futu/YYYY-MM-DD/article.html`
- `morning_brief/data/futu/YYYY-MM-DD/article_body.html`
- `morning_brief/data/futu/YYYY-MM-DD/article.txt`
- `morning_brief/data/futu/YYYY-MM-DD/images/*`
- `morning_brief/data/futu/YYYY-MM-DD/absorption_review.json`

若当日 `manifest.json` 为 `not_published`，富途目录只需归档 manifest 和说明未执行吸收的 `absorption_review.json`；不得伪造不存在的正文或图片文件。

在完成上述校验后，执行以下命令提交并推送。该脚本只暂存早报报告和数据路径，不会把 Macro 看板或其他未完成工作带入提交：

```powershell
powershell -ExecutionPolicy Bypass -File morning_brief/scripts/publish_daily_brief.ps1 -ReportDate YYYY-MM-DD -CommitAndPush
```

若只需要在提交前检查落盘文件及校验结果，不传 `-CommitAndPush`。

## 每日输出摘要

完成后向用户简要说明：

- 生成的 HTML 文件路径；
- 覆盖交易日；
- 是否使用实时数据或本地缓存；
- 哪些关键数据源已交叉核验；
- 富途早报采集状态、落盘路径和图片数量；
- 富途查漏补缺后纳入与排除的关键信息及其置信度；
- 是否存在需要人工复核的数据点。
