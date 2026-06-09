
const RANGE_CONFIG = {
  "7D": { label: "7-day range", days: 7 },
  "30D": { label: "30-day range", days: 30 },
  "6M": { label: "6-month range", days: 183 },
  "1Y": { label: "1-year range", days: 365 },
  "2Y": { label: "2-year range", days: 730 },
};

const API_ROUTES = {
  cnn: (mode) => `/api/cnn-fear${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`,
  ahr: (mode) => `/api/ahr999${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`,
  fred: (id, mode) => `/api/fred?id=${encodeURIComponent(id)}${mode ? `&mode=${encodeURIComponent(mode)}` : ""}`,
  treasuryYields: (mode) => `/api/treasury-yields${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`,
  macroDaily: (date) => `/api/macro-daily?date=${encodeURIComponent(date)}`,
};

const HOME_YIELD_DEFS = [
  { id: "us3y", symbol: "US3Y", name: "3Y Treasury Yield", fredId: "DGS3", unit: "pct", decimals: 2, color: "#7fd1ff" },
  { id: "us10y", symbol: "US10Y", name: "10Y Treasury Yield", fredId: "DGS10", unit: "pct", decimals: 2, color: "#8bf0c8" },
  { id: "us30y", symbol: "US30Y", name: "30Y Treasury Yield", fredId: "DGS30", unit: "pct", decimals: 2, color: "#ffb864" },
];

const DEFAULT_RATE_SHOCK_ROWS = ["2Y", "3Y", "5Y", "10Y", "30Y"].map((tenor) => ({
  tenor,
  level: "--",
  d1: "--",
  d1Pctile: "--",
  d5: "--",
  d5Pctile: "--",
  d21: "--",
  d21Pctile: "--",
  regimePctile: "--",
  zScore: "--",
  signal: "Awaiting daily task",
}));

const DEFAULT_NARRATIVES = [
  {
    id: "fed_path",
    title: "Fed path repricing",
    score: 0,
    updatedAt: "--",
    core: "市场是否在重定价 cuts fewer / higher for longer。",
    checks: [
      "DGS2 / DGS3 上行",
      "SOFR futures 隐含降息次数减少",
      "Fed funds futures terminal / cuts repricing",
      "2s5s flattening",
      "real yield 上行",
    ],
    interpretation: "如果 3Y 明显上行，且 10Y/30Y 跟随有限，市场主要在交易 Fed path。",
  },
  {
    id: "inflation_comp",
    title: "Inflation compensation shock",
    score: 0,
    updatedAt: "--",
    core: "市场是否在外推油价、商品或 survey 通胀扰动。",
    checks: ["T5YIE", "T10YIE", "T5YIFR", "oil / gasoline", "commodity basket", "UMICH1 / inflation survey surprise"],
    interpretation: "如果 breakeven 上行贡献大而 real yield 稳定，是 inflation compensation shock；要继续监控二阶 Fed 传导。",
  },
  {
    id: "growth_scare",
    title: "Growth scare / recession hedge",
    score: 0,
    updatedAt: "--",
    core: "市场是否在交易增长放缓或衰退对冲。",
    checks: ["DGS10 down", "real yield down", "breakeven down", "oil/copper down", "HY spread widening", "USD / JPY / gold risk-off"],
    interpretation: "如果利率下行伴随 breakeven 和周期资产走弱，长债表现好不等于权益风险低。",
  },
  {
    id: "term_premium",
    title: "Long-end term premium / fiscal supply",
    score: 0,
    updatedAt: "--",
    core: "长端是否被财政供给、duration demand 或 term premium 独立拖累。",
    checks: ["30Y up > 10Y up > 5Y up", "5s30s steepening", "10s30s steepening", "ACM / Kim-Wright term premium up", "auction tail", "MOVE index up"],
    interpretation: "如果 30Y 独立走弱，这不是普通 Fed path 问题，而是长端 duration supply / fiscal risk 问题。",
  },
  {
    id: "risk_liquidity",
    title: "Risk appetite / liquidity shock",
    score: 0,
    updatedAt: "--",
    core: "风险偏好、美元流动性或交叉资产压力是否主导利率表现。",
    checks: ["VIX / MOVE", "credit spread", "equity breadth", "USD funding", "safe-haven demand", "dealer balance sheet stress"],
    interpretation: "如果风险资产和波动率同步恶化，利率信号需要和流动性压力一起解读。",
  },
  {
    id: "technical_exhaustion",
    title: "Technical positioning / exhaustion",
    score: 0,
    updatedAt: "--",
    core: "短期单边走势是否已经拥挤、衰竭或接近反身性拐点。",
    checks: ["US10Y 九转", "US30Y 九转", "RSI", "Bollinger z-score", "20D move percentile", "CFTC Treasury futures positioning"],
    interpretation: "技术面只做 timing overlay；没有宏观归因时不单独生成交易 thesis。",
  },
];

const NARRATIVE_CN = {
  fed_path: {
    title: "美联储路径重定价",
    core: "最强证据来自过去63个有效观测里的熊平背景，而不是新的5日冲击。",
    interpretation: "政策路径重定价仍是背景叙事，但当前没有出现新的短端主导冲击。",
  },
  inflation_comp: {
    title: "通胀补偿冲击",
    core: "breakeven 在中期窗口仍偏正，但5日窗口转弱；当前不是通胀补偿主导的利率冲击。",
    interpretation: "通胀补偿只是弱观察项，本地5日 tape 没有形成广泛的 breakeven 主导 selloff。",
  },
  growth_scare: {
    title: "增长担忧 / 衰退对冲",
    core: "5日名义利率回落和 breakeven 走弱符合轻度对冲需求，但风险代理没有确认衰退式冲击。",
    interpretation: "增长担忧叙事偏弱，因为5日 rally 幅度小，整体风险 tape 也不是明显防御。",
  },
  term_premium: {
    title: "长端期限溢价 / 财政供给",
    core: "本地曲线代理没有显示30Y在5日窗口内独立承压。",
    interpretation: "没有30Y主导的熊陡，不支持升级长端久期；同时也移除了主要的长端压力否决项。",
  },
  risk_liquidity: {
    title: "风险偏好 / 流动性冲击",
    core: "风险偏好信号分化：CNN总分偏贪婪，但垃圾债需求内部项较弱。",
    interpretation: "风险/流动性不是利率主导信号，但信用偏好偏弱，久期判断仍需保留条件。",
  },
  technical_exhaustion: {
    title: "技术面拥挤 / 衰竭",
    core: "当前技术指标没有显示明确的收益率上行衰竭形态。",
    interpretation: "技术信号不足以单独触发或升级久期动作，仍需基本面冲击配合。",
  },
};

const DEFAULT_DURATION_STEPS = [
  { index: 0, title: "No trade / wait", condition: "利率涨幅不极端、叙事仍在强化或长端风险未释放。", active: false },
  { index: 1, title: "Watchlist only", condition: "数据待更新，先观察叙事权重和曲线形态是否确认。", active: true },
  { index: 2, title: "Start 10Y nibble", condition: "10Y 1W/1M 上行进入高分位，且技术面出现短期 exhaustion。", active: false },
  { index: 3, title: "Start 10Y nibble / intermediate-duration watch", condition: "real yield 主导、Fed path repricing 接近充分，但仍缺 MOVE / auction / positioning 确认。", active: false },
  { index: 4, title: "Add long-end duration", condition: "30Y 极端上行后，5s30s/10s30s steepening 停滞，term premium 放缓。", active: false },
  { index: 5, title: "Add convex duration", condition: "长端风险已 price in，增长/通胀回落信号和技术 exhaustion 同时出现。", active: false },
];

const DEFAULT_DURATION_RULES = [
  {
    title: "优先加 10Y",
    body: "当折现率已经变贵，但 30Y term premium 风险还没完全释放时，10Y 是更稳的 duration 表达。",
    triggers: ["10Y yield 上行进入高分位", "real yield 是主导贡献", "Fed path repricing 接近充分", "30Y 没有明显独立恶化", "技术面显示 exhaustion"],
  },
  {
    title: "谨慎加 30Y",
    body: "只有当 long-end term premium 接近过度定价，且长端曲线陡峭化停止时，30Y 才比 10Y 更值得加。",
    triggers: ["30Y 上行极端", "10s30s / 5s30s steepening 停止", "term premium 上行放缓", "auction 没继续恶化", "growth scare 开始出现"],
  },
  {
    title: "不要加长端",
    body: "如果是 bear steepening 加速，不是普通高收益率机会，先不要接 30Y。",
    triggers: ["30Y up > 10Y up", "10s30s steepening", "term premium rising", "auction weak", "MOVE rising", "fiscal supply narrative strengthening"],
  },
  {
    title: "可以逆向试仓",
    body: "当市场叙事单一拥挤、利率上行极端、驱动停止恶化并出现技术衰竭时，才进入认知分歧窗口。",
    triggers: ["1W / 1M 利率上行极端", "主流叙事单一且拥挤", "驱动没有继续恶化", "九转顶部", "RSI / z-score 极端"],
  },
];

const DEFAULT_TECHNICAL_SIGNALS = [
  { title: "US10Y 九转", value: "--", status: "pending", note: "识别 10Y 收益率连续单边后的短期动能衰竭。" },
  { title: "US30Y 九转", value: "--", status: "pending", note: "识别长端收益率是否进入 extension extreme。" },
  { title: "RSI", value: "--", status: "pending", note: "辅助判断短期超买/超卖，不单独作为交易结论。" },
  { title: "Bollinger z-score", value: "--", status: "pending", note: "看当前收益率偏离滚动均值的程度。" },
  { title: "20D move percentile", value: "--", status: "pending", note: "衡量近 20D 利率变动在历史中的罕见度。" },
  { title: "MOVE index", value: "--", status: "pending", note: "判断 rates vol 是否仍在放大，避免过早接长端。" },
  { title: "CFTC positioning", value: "--", status: "pending", note: "观察 Treasury futures 仓位是否拥挤或开始反转。" },
  { title: "Timing overlay", value: "--", status: "pending", note: "把技术衰竭和基本面归因叠加后再给动作建议。" },
];

const DEFAULT_MARKET_REACTION = {
  asOf: "--",
  coverageWindow: "--",
  sourceCoverageStatus: "missing",
  summary: "等待每日自动化拉取媒体、机构和社群证据后生成市场消化叙事。",
  sourceMix: [
    { type: "media", count: 0, weight: 0 },
    { type: "institution", count: 0, weight: 0 },
    { type: "community", count: 0, weight: 0 },
  ],
  themes: [
    {
      rank: 1,
      title: "等待研究输入",
      weight: 100,
      stance: "unavailable",
      interpretation: "当日没有 market reaction research 输入；不要把指标归因误读成市场共识。",
      linkedNarrativeIds: [],
      evidence: [
        {
          sourceType: "automation",
          sourceName: "local dashboard",
          publishedAt: "--",
          summary: "每日任务需要先拉取权威媒体、机构和社群讨论，再填充该模块。",
          reliability: 0,
          weight: 0,
        },
      ],
    },
  ],
};

const DEFAULT_DAILY_DASHBOARD = {
  date: "",
  source: "template",
  generatedAt: "",
  reportTitle: "Awaiting daily Macro task",
  reportSummary: "今日 Rate Shock / Narrative / Duration 数据尚未生成；当前展示为空白模板。",
  rateShockRows: DEFAULT_RATE_SHOCK_ROWS,
  marketReaction: DEFAULT_MARKET_REACTION,
  narratives: DEFAULT_NARRATIVES,
  durationAction: {
    currentIndex: 1,
    label: "Watchlist only",
    explanation: "还没有检测到今日自动化分析结果，先保留观察档位。",
    reasons: ["等待 1D / 5D / 21D percentile 与 z-score", "等待 narrative ranking", "等待 term premium 与 technical exhaustion 读数"],
    steps: DEFAULT_DURATION_STEPS,
    rules: DEFAULT_DURATION_RULES,
  },
  technical: {
    signals: DEFAULT_TECHNICAL_SIGNALS,
    adviceTitle: "Waiting for automation",
    adviceBody: "每日任务会把技术衰竭信号与 Rate Shock / Driver Attribution / Narrative Ranking 叠加，再输出是否支持 nibble 10Y 或继续等待。",
  },
};

const MACRO_COLUMNS = [
  {
    title: "Breakevens",
    subtitle: "Market inflation compensation",
    items: ["t5yie", "t10yie", "swap5y"],
  },
  {
    title: "Long Anchor",
    subtitle: "Long-end regime checks",
    items: ["t5yifr", "clev5y", "anchor_gap"],
  },
  {
    title: "Surveys",
    subtitle: "Survey-based expectations",
    items: ["umich1", "umich5", "nyfed3"],
  },
  {
    title: "Components",
    subtitle: "Nominal vs real inputs",
    items: ["dgs5", "dfii5", "dgs10"],
  },
  {
    title: "Triggers",
    subtitle: "Heuristic watch flags",
    items: ["survey_gap", "drift_1m", "cpi3m"],
  },
];

const FEAR_COLUMNS = [
  {
    title: "Core",
    subtitle: "Headline sentiment gauges",
    items: ["cnn_fear", "ahr999", "panic_blend"],
  },
  {
    title: "Breadth",
    subtitle: "Participation and momentum",
    items: ["market_momentum_sp500", "stock_price_strength", "stock_price_breadth"],
  },
  {
    title: "Stress",
    subtitle: "Options, credit, haven demand",
    items: ["put_call_options", "market_volatility_vix", "junk_bond_demand", "safe_haven_demand"],
  },
];

const SERIES_DEFS = [
  { id: "t5yie", symbol: "T5YIE", name: "5Y Breakeven Inflation", unit: "pct", decimals: 2, note: "Treasury nominal 5Y minus real 5Y.", live: { type: "treasury", key: "t5yie" }, page: "macro" },
  { id: "t10yie", symbol: "T10YIE", name: "10Y Breakeven Inflation", unit: "pct", decimals: 2, note: "Treasury nominal 10Y minus real 10Y.", live: { type: "treasury", key: "t10yie" }, page: "macro" },
  { id: "swap5y", symbol: "SWAP5Y", name: "5Y Inflation Swap", unit: "pct", decimals: 2, note: "Live source not wired yet.", page: "macro" },
  { id: "t5yifr", symbol: "T5YIFR", name: "5Y5Y Forward Inflation", unit: "pct", decimals: 2, note: "Long-end anchor check.", live: { type: "fred", id: "T5YIFR" }, page: "macro" },
  { id: "clev5y", symbol: "CLEV5Y", name: "Cleveland 5Y Exp.", unit: "pct", decimals: 2, note: "No stable free CSV source wired yet.", page: "macro" },
  { id: "umich1", symbol: "UMICH1", name: "Michigan 1Y Survey", unit: "pct", decimals: 1, note: "Short-end survey expectations.", live: { type: "fred", id: "MICH" }, page: "macro" },
  { id: "umich5", symbol: "UMICH5", name: "Michigan 5Y Survey", unit: "pct", decimals: 1, note: "No stable free CSV source wired yet.", page: "macro" },
  { id: "nyfed3", symbol: "NYFED3", name: "NY Fed 3Y Survey", unit: "pct", decimals: 1, note: "No stable free CSV source wired yet.", page: "macro" },
  { id: "dgs5", symbol: "DGS5", name: "5Y Treasury Nominal", unit: "pct", decimals: 2, note: "Treasury nominal curve, 5Y point.", live: { type: "treasury", key: "dgs5" }, page: "macro" },
  { id: "dfii5", symbol: "DFII5", name: "5Y TIPS Real Yield", unit: "pct", decimals: 2, note: "Treasury real yield curve, 5Y point.", live: { type: "treasury", key: "dfii5" }, page: "macro" },
  { id: "dgs10", symbol: "DGS10", name: "10Y Treasury Nominal", unit: "pct", decimals: 2, note: "Treasury nominal curve, 10Y point.", live: { type: "treasury", key: "dgs10" }, page: "macro" },
  { id: "cpi3m", symbol: "CORE3M", name: "Core CPI 3M Ann.", unit: "pct", decimals: 1, note: "Inflation momentum context.", live: { type: "fred", id: "CORESTICKM679SFRBATL" }, page: "macro" },
  { id: "cnn_fear", symbol: "CNN-FGI", name: "CNN Fear & Greed", unit: "index", decimals: 0, note: "Headline fear gauge.", live: { type: "cnn", key: "fear_and_greed", historyKey: "fear_and_greed_historical" }, page: "fear" },
  { id: "ahr999", symbol: "AHR999", name: "Bitcoin AHR999", unit: "ratio", decimals: 2, note: "BTC valuation heat proxy.", live: { type: "ahr" }, page: "fear" },
  { id: "market_momentum_sp500", symbol: "MOMO", name: "Market Momentum", unit: "index", decimals: 0, note: "S&P 500 vs 125D average.", live: { type: "cnn", key: "market_momentum_sp500" }, page: "fear" },
  { id: "market_momentum_sp125", symbol: "MA125", name: "125-day Moving Average", unit: "index", decimals: 0, note: "Companion moving average for momentum.", live: { type: "cnn", key: "market_momentum_sp125" }, page: "fear", hidden: true },
  { id: "stock_price_strength", symbol: "STRN", name: "Stock Price Strength", unit: "number", decimals: 2, note: "52-week highs vs lows.", live: { type: "cnn", key: "stock_price_strength" }, page: "fear" },
  { id: "stock_price_breadth", symbol: "BRDT", name: "Stock Price Breadth", unit: "index", decimals: 0, note: "Breadth volume participation.", live: { type: "cnn", key: "stock_price_breadth" }, page: "fear" },
  { id: "put_call_options", symbol: "PUT/CALL", name: "Put/Call Options", unit: "ratio", decimals: 2, note: "Options protection demand.", live: { type: "cnn", key: "put_call_options" }, page: "fear" },
  { id: "market_volatility_vix", symbol: "VIX", name: "Market Volatility", unit: "number", decimals: 2, note: "VIX stress signal.", live: { type: "cnn", key: "market_volatility_vix" }, page: "fear" },
  { id: "market_volatility_vix_50", symbol: "VIX-50MA", name: "VIX 50-day Moving Average", unit: "number", decimals: 2, note: "Companion moving average for VIX.", live: { type: "cnn", key: "market_volatility_vix_50" }, page: "fear", hidden: true },
  { id: "junk_bond_demand", symbol: "JUNK", name: "Junk Bond Demand", unit: "number", decimals: 2, note: "Risk appetite in credit.", live: { type: "cnn", key: "junk_bond_demand" }, page: "fear" },
  { id: "safe_haven_demand", symbol: "HAVEN", name: "Safe Haven Demand", unit: "number", decimals: 2, note: "Defensive rotation gauge.", live: { type: "cnn", key: "safe_haven_demand" }, page: "fear" },
];

const DEFAULT_PAGE_SERIES = {
  macro: "t5yie",
  fear: "cnn_fear",
};

const state = {
  isOpen: false,
  activePage: "macro",
  selectedId: "t5yie",
  range: "6M",
  seriesMap: new Map(),
  lastRefreshAt: null,
  hoverIndex: null,
  chartAnimationFrame: null,
  chartAnimationStartedAt: 0,
  networkStatus: {
    treasury: "pending",
    fred: "pending",
    cnn: "pending",
    ahr: "pending",
  },
  feedHealth: {
    phase: "idle",
    tone: "idle",
    title: "等待刷新",
    detail: "尚未开始获取数据。",
    feeds: {},
  },
  refreshSeq: 0,
  loadProgress: {
    total: 0,
    completed: 0,
    phase: "idle",
    detail: "尚未开始获取数据。",
  },
  dailyDashboard: {
    status: "loading",
    date: "",
    expected: null,
    data: DEFAULT_DAILY_DASHBOARD,
    message: "检查今日 Macro 数据与研报...",
  },
};

const homeYieldState = {
  range: "6M",
  selectedSeries: "all",
  axisMode: "absolute",
  series: [],
  status: "loading",
  message: "Loading US Treasury yield trends...",
  hoverDate: null,
  animationFrame: null,
  animationStartedAt: 0,
};

const refs = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  bindEvents();
  initializeEmptyState();
  tickClock();
  window.setInterval(tickClock, 1000);
  render();
  loadDailyDashboard();
  loadCachedSnapshot().finally(() => {
    updateLoadProgress({
      phase: "ok",
      total: getTotalRefreshUnits(),
      completed: getTotalRefreshUnits(),
      detail: "已读取本地缓存；需要补数据时点击刷新。",
    });
  });
});

function cacheRefs() {
  refs.flyout = document.getElementById("inflation-flyout");
  refs.backdrop = document.getElementById("flyout-backdrop");
  refs.panelTime = document.getElementById("panel-time");
  refs.taskbarClock = document.getElementById("taskbar-clock");
  refs.refreshButton = document.getElementById("refresh-button");
  refs.statusStrip = document.getElementById("status-strip");
  refs.tabs = Array.from(document.querySelectorAll("[data-page]"));
  refs.panels = Array.from(document.querySelectorAll("[data-page-panel]"));
  refs.macroGrid = document.getElementById("macro-grid");
  refs.fearGrid = document.getElementById("fear-grid");
  refs.rangeSwitcher = document.getElementById("range-switcher");
  refs.chartSymbol = document.getElementById("chart-symbol");
  refs.chartName = document.getElementById("chart-name");
  refs.chartChange = document.getElementById("chart-change");
  refs.chartContext = document.getElementById("chart-context");
  refs.chartMode = document.getElementById("chart-mode");
  refs.chartUpdated = document.getElementById("chart-updated");
  refs.chartSource = document.getElementById("chart-source");
  refs.chartCanvas = document.getElementById("trend-canvas");
  refs.chartTooltip = document.getElementById("chart-tooltip");
  refs.chartLegend = document.getElementById("chart-legend");
  refs.chartNote = document.getElementById("chart-note");
  refs.lockedFlag = document.getElementById("locked-flag");
  refs.anchorSummary = document.getElementById("anchor-summary");
  refs.readSummary = document.getElementById("read-summary");
  refs.heroBaseCase = document.getElementById("hero-base-case");
  refs.heroFirstReadNote = document.getElementById("hero-first-read-note");
  refs.fearSummary = document.getElementById("fear-summary");
  refs.fearReading = document.getElementById("fear-reading");
  refs.fearSourceNote = document.getElementById("fear-source-note");
  refs.fearSentimentStrip = document.getElementById("fear-sentiment-strip");
  refs.globalLoadStatus = document.getElementById("global-load-status");
  refs.globalLoadProgress = document.getElementById("global-load-progress");
  refs.globalLoadDetail = document.getElementById("global-load-detail");
  refs.homeSeriesSwitcher = document.getElementById("home-series-switcher");
  refs.homeAxisSwitcher = document.getElementById("home-axis-switcher");
  refs.homeRangeSwitcher = document.getElementById("home-range-switcher");
  refs.homeYieldCanvas = document.getElementById("home-yield-canvas");
  refs.homeYieldTooltip = document.getElementById("home-yield-tooltip");
  refs.homeYieldLegend = document.getElementById("home-yield-legend");
  refs.homeYieldFooter = document.getElementById("home-yield-footer");
  refs.dailyCacheBanner = document.getElementById("daily-cache-banner");
  refs.dailyCacheTitle = document.getElementById("daily-cache-title");
  refs.dailyCacheDetail = document.getElementById("daily-cache-detail");
  refs.dailyCacheDate = document.getElementById("daily-cache-date");
  refs.dailyCacheSource = document.getElementById("daily-cache-source");
  refs.rateShockTableBody = document.getElementById("rate-shock-table-body");
  refs.marketReactionSummary = document.getElementById("market-reaction-summary");
  refs.marketReactionGrid = document.getElementById("market-reaction-grid");
  refs.narrativeRankingGrid = document.getElementById("narrative-ranking-grid");
  refs.narrativeDetailGrid = document.getElementById("narrative-detail-grid");
  refs.durationActionSummary = document.getElementById("duration-action-summary");
  refs.durationLadder = document.getElementById("duration-ladder");
  refs.durationRuleGrid = document.getElementById("duration-rule-grid");
  refs.technicalGrid = document.getElementById("technical-grid");
  refs.technicalAdvice = document.getElementById("technical-advice");
}

function bindEvents() {
  refs.flyout.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  refs.backdrop.addEventListener("click", () => {
    state.isOpen = false;
    renderFlyoutState();
  });
  document.addEventListener("click", (event) => {
    if (!state.isOpen) {
      return;
    }
    if (!refs.flyout.contains(event.target) && !event.target.closest(".taskbar-tabs")) {
      state.isOpen = false;
      renderFlyoutState();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.isOpen = false;
      renderFlyoutState();
    }
  });
  refs.refreshButton.addEventListener("click", () => {
    beginLoadProgress();
    refreshDashboard("refresh");
    refreshHomeYieldChart("refresh");
  });
  refs.tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.stopPropagation();
      state.isOpen = true;
      state.activePage = tab.dataset.page;
      if (getSeries(state.selectedId)?.page !== state.activePage) {
        state.selectedId = DEFAULT_PAGE_SERIES[state.activePage];
      }
      render();
      startChartAnimation();
    });
  });
  refs.rangeSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-range]");
    if (!button) {
      return;
    }
    state.range = button.dataset.range;
    renderRangeButtons();
    renderChart();
    startChartAnimation();
  });
  refs.chartCanvas.addEventListener("mousemove", handleChartHover);
  refs.chartCanvas.addEventListener("mouseleave", hideTooltip);
  refs.homeSeriesSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-series]");
    if (!button) {
      return;
    }
    homeYieldState.selectedSeries = button.dataset.homeSeries;
    if (homeYieldState.selectedSeries !== "all") {
      homeYieldState.axisMode = "absolute";
    }
    renderHomeControls();
    renderHomeYieldLegend();
    startHomeYieldAnimation();
  });
  refs.homeAxisSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-axis]");
    if (!button || homeYieldState.selectedSeries !== "all") {
      return;
    }
    homeYieldState.axisMode = button.dataset.homeAxis;
    renderHomeControls();
    renderHomeYieldLegend();
    startHomeYieldAnimation();
  });
  refs.homeRangeSwitcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-range]");
    if (!button) {
      return;
    }
    homeYieldState.range = button.dataset.homeRange;
    renderHomeControls();
    renderHomeYieldLegend();
    startHomeYieldAnimation();
  });
  refs.homeYieldCanvas.addEventListener("mousemove", handleHomeYieldHover);
  refs.homeYieldCanvas.addEventListener("mouseleave", hideHomeYieldTooltip);
  window.addEventListener("resize", () => {
    renderChart();
    drawHomeYieldChart(1);
  });
}

function initializeEmptyState() {
  const map = new Map();
  SERIES_DEFS.forEach((def) => map.set(def.id, makeEmptySeries(def)));
  buildDerivedSeries(map);
  state.seriesMap = map;
}

async function loadCachedSnapshot() {
  updateLoadProgress({
    phase: "loading",
    detail: "优先读取本地缓存...",
    completed: 0,
    total: getTotalRefreshUnits(),
  });
  await Promise.all([loadCachedDashboard(), refreshHomeYieldChart("cache")]);
  updateLoadProgress({
    phase: "ok",
    detail: "本地缓存已载入，未自动连接远端数据源。",
    completed: getTotalRefreshUnits(),
    total: getTotalRefreshUnits(),
  });
}

async function loadCachedDashboard() {
  const fredDefs = SERIES_DEFS.filter((def) => def.live?.type === "fred");
  const treasuryDefs = SERIES_DEFS.filter((def) => def.live?.type === "treasury");
  const [fredResults, treasuryResults, cnnBundle, ahrSeries] = await Promise.all([
    Promise.all(fredDefs.map((def) => fetchFredSeries(def, "cache"))),
    fetchTreasurySeriesBundle(treasuryDefs, "cache"),
    fetchCnnBundle("cache"),
    fetchAhrSeries("cache"),
  ]);
  const fredMap = new Map(fredResults.filter((result) => result.ok).map((result) => [result.series.id, result.series]));
  const treasuryMap = new Map(treasuryResults.filter((result) => result.ok).map((result) => [result.series.id, result.series]));
  const seriesMap = new Map();

  for (const def of SERIES_DEFS) {
    if (def.live?.type === "fred") {
      seriesMap.set(def.id, fredMap.get(def.id) ?? makeEmptySeries(def));
    } else if (def.live?.type === "treasury") {
      seriesMap.set(def.id, treasuryMap.get(def.id) ?? makeEmptySeries(def));
    } else if (def.live?.type === "cnn") {
      seriesMap.set(def.id, buildCnnSeries(def, cnnBundle));
    } else if (def.live?.type === "ahr") {
      seriesMap.set(def.id, ahrSeries ?? makeEmptySeries(def));
    } else {
      seriesMap.set(def.id, makeEmptySeries(def));
    }
  }

  buildDerivedSeries(seriesMap);
  state.seriesMap = seriesMap;
  state.lastRefreshAt = getLatestDataDate(seriesMap) ? new Date() : state.lastRefreshAt;
  state.networkStatus = {
    fred: summarizeFredStatus(fredResults),
    treasury: summarizeTreasuryStatus(treasuryResults),
    cnn: cnnBundle.ok ? `cnn ${formatCacheStatus(cnnBundle.cacheStatus)}` : `cnn ${cnnBundle.reason}`,
    ahr: ahrSeries?.source === "live" ? `ahr ${formatCacheStatus(ahrSeries.cacheStatus)}` : "ahr unavailable",
  };
  render();
}

async function loadDailyDashboard() {
  const date = todayLocalIso();
  state.dailyDashboard = {
    ...state.dailyDashboard,
    status: "loading",
    date,
    message: "检查今日 Macro 数据与研报...",
  };
  renderDailyDiagnostics();

  if (window.location.protocol === "file:") {
    state.dailyDashboard = {
      ...state.dailyDashboard,
      status: "missing",
      date,
      message: "需要通过 node server.js 打开 localhost，才能检查本地每日缓存。",
      expected: {
        dashboard: `macro_daily/data/${date}_dashboard.json`,
        report: `macro_daily/reports/${date}_rates_duration_report.md`,
      },
      data: normalizeDailyDashboard(null, date),
    };
    renderDailyDiagnostics();
    return;
  }

  try {
    const response = await fetch(API_ROUTES.macroDaily(date), { cache: "no-store" });
    const contentType = response.headers.get("Content-Type") || "";
    if (!response.ok || !contentType.includes("application/json")) {
      const detail = await response.text();
      throw new Error(detail || `HTTP ${response.status}`);
    }
    const payload = await response.json();
    const status = payload.exists ? "ready" : "missing";
    state.dailyDashboard = {
      status,
      date: payload.date || date,
      expected: payload.expected || null,
      data: normalizeDailyDashboard(payload.dashboard, payload.date || date),
      message: payload.exists
        ? "今日 Macro 数据与研报已在本地，首页已读取缓存。"
        : "今日 Macro 数据或研报不存在，请去 Codex 执行每日 Macro 自动化任务。",
    };
  } catch (error) {
    state.dailyDashboard = {
      ...state.dailyDashboard,
      status: "error",
      date,
      message: error?.message || "本地每日缓存检查失败。",
      data: normalizeDailyDashboard(null, date),
    };
  }
  renderDailyDiagnostics();
}

function normalizeDailyDashboard(raw, date) {
  const source = raw && typeof raw === "object" ? raw : {};
  const rawNarratives = Array.isArray(source.narratives) ? source.narratives : [];
  const narrativesById = new Map(rawNarratives.map((item) => [item.id, item]));
  const narratives = DEFAULT_NARRATIVES.map((item) => ({
    ...item,
    ...(narrativesById.get(item.id) || {}),
    checks: Array.isArray(narrativesById.get(item.id)?.checks) ? narrativesById.get(item.id).checks : item.checks,
  }));
  const durationAction = {
    ...DEFAULT_DAILY_DASHBOARD.durationAction,
    ...(source.durationAction || {}),
    steps: Array.isArray(source.durationAction?.steps) && source.durationAction.steps.length
      ? source.durationAction.steps
      : DEFAULT_DURATION_STEPS,
    rules: Array.isArray(source.durationAction?.rules) && source.durationAction.rules.length
      ? source.durationAction.rules
      : DEFAULT_DURATION_RULES,
  };
  const technical = {
    ...DEFAULT_DAILY_DASHBOARD.technical,
    ...(source.technical || {}),
    signals: Array.isArray(source.technical?.signals) && source.technical.signals.length
      ? source.technical.signals
      : DEFAULT_TECHNICAL_SIGNALS,
  };
  const marketReaction = normalizeMarketReaction(source.marketReaction);

  return {
    ...DEFAULT_DAILY_DASHBOARD,
    ...source,
    date: source.date || date || todayLocalIso(),
    rateShockRows: Array.isArray(source.rateShockRows) && source.rateShockRows.length
      ? source.rateShockRows
      : DEFAULT_RATE_SHOCK_ROWS,
    marketReaction,
    narratives,
    durationAction,
    technical,
  };
}

function normalizeMarketReaction(reaction) {
  if (!reaction || typeof reaction !== "object") {
    return DEFAULT_MARKET_REACTION;
  }
  return {
    ...DEFAULT_MARKET_REACTION,
    ...reaction,
    sourceMix: Array.isArray(reaction.sourceMix) && reaction.sourceMix.length
      ? reaction.sourceMix
      : DEFAULT_MARKET_REACTION.sourceMix,
    themes: Array.isArray(reaction.themes) && reaction.themes.length
      ? reaction.themes
      : DEFAULT_MARKET_REACTION.themes,
  };
}

function renderDailyDiagnostics() {
  if (!refs.dailyCacheBanner) {
    return;
  }
  renderDailyCacheBanner();
  const dashboard = state.dailyDashboard.data || normalizeDailyDashboard(null, state.dailyDashboard.date);
  renderRateShockTape(dashboard.rateShockRows || DEFAULT_RATE_SHOCK_ROWS);
  renderMarketReaction(dashboard.marketReaction || DEFAULT_MARKET_REACTION);
  renderNarrativeRanking(dashboard.narratives || DEFAULT_NARRATIVES);
  renderNarrativeDetails(dashboard.narratives || DEFAULT_NARRATIVES);
  renderDurationAction(dashboard.durationAction || DEFAULT_DAILY_DASHBOARD.durationAction);
  renderTechnicalPanel(dashboard.technical || DEFAULT_DAILY_DASHBOARD.technical);
}

function renderDailyCacheBanner() {
  const status = state.dailyDashboard.status || "loading";
  const dashboard = state.dailyDashboard.data || DEFAULT_DAILY_DASHBOARD;
  const expected = state.dailyDashboard.expected || {};
  refs.dailyCacheBanner.className = `daily-cache-banner is-${status}`;
  if (status === "ready") {
    refs.dailyCacheTitle.textContent = dashboard.reportTitle || "今日 Macro 数据与研报已就绪";
    refs.dailyCacheDetail.textContent = dashboard.reportSummary || "已读取本地每日任务输出。";
  } else if (status === "missing") {
    refs.dailyCacheTitle.textContent = "今日 Macro 数据与研报尚未生成";
    refs.dailyCacheDetail.textContent = `请在 Codex 执行每日 Macro 自动化任务。预期文件：${expected.dashboard || "macro_daily/data/YYYY-MM-DD_dashboard.json"} / ${expected.report || "macro_daily/reports/YYYY-MM-DD_rates_duration_report.md"}`;
  } else if (status === "error") {
    refs.dailyCacheTitle.textContent = "本地每日缓存检查失败";
    refs.dailyCacheDetail.textContent = state.dailyDashboard.message || "请确认本地 server 正常运行。";
  } else {
    refs.dailyCacheTitle.textContent = "检查今日 Macro 数据与研报...";
    refs.dailyCacheDetail.textContent = "如果本地已有今日 JSON 和研报，首页会直接读取；否则提示去 Codex 执行每日任务。";
  }
  refs.dailyCacheDate.textContent = state.dailyDashboard.date || dashboard.date || "--";
  refs.dailyCacheSource.textContent = status === "ready" ? (dashboard.source || "local daily cache") : "local check";
}

function renderRateShockTape(rows) {
  const visibleRows = rows.filter(hasRateShockData);
  refs.rateShockTableBody.innerHTML = visibleRows
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.tenor || "--")}</td>
        <td>${escapeHtml(row.level ?? "--")}</td>
        <td>${renderBpChip(row.d1)}</td>
        <td>${renderPctileRail(row.d1Pctile)}</td>
        <td>${renderBpChip(row.d5)}</td>
        <td>${renderPctileRail(row.d5Pctile)}</td>
        <td>${renderBpChip(row.d21)}</td>
        <td>${renderPctileRail(row.d21Pctile)}</td>
        <td>${renderPctileRail(row.regimePctile)}</td>
        <td>${renderZScoreChip(row.zScore)}</td>
        <td class="rate-signal">${renderSignalPill(row.signal)}</td>
      </tr>
    `)
    .join("");
}

function hasRateShockData(row) {
  return [row.level, row.d1, row.d5, row.d21, row.d1Pctile, row.d5Pctile, row.d21Pctile, row.regimePctile, row.zScore]
    .some((value) => String(value ?? "").toLowerCase() !== "unavailable" && String(value ?? "").trim() !== "--");
}

function parseBpValue(value) {
  const match = String(value ?? "").match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parsePctileValue(value) {
  const match = String(value ?? "").match(/[-+]?\d+(?:\.\d+)?/);
  return match ? clamp(Number(match[0]), 0, 100) : null;
}

function renderBpChip(value) {
  const bp = parseBpValue(value);
  if (!Number.isFinite(bp)) {
    return `<span class="rate-empty">--</span>`;
  }
  const tone = bp > 0 ? "up" : bp < 0 ? "down" : "flat";
  const strength = Math.min(1, Math.abs(bp) / 25).toFixed(2);
  return `<span class="rate-chip is-${tone}" style="--strength:${strength}">${escapeHtml(String(value))}</span>`;
}

function renderZScoreChip(value) {
  const score = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(score)) {
    return `<span class="rate-empty">--</span>`;
  }
  const tone = score > 0 ? "up" : score < 0 ? "down" : "flat";
  const strength = Math.min(1, Math.abs(score) / 2).toFixed(2);
  return `<span class="rate-chip is-${tone}" style="--strength:${strength}">${escapeHtml(String(value))}</span>`;
}

function renderPctileRail(value) {
  const pctile = parsePctileValue(value);
  if (!Number.isFinite(pctile)) {
    return `<span class="rate-empty">--</span>`;
  }
  const tone = pctile >= 85 ? "extreme" : pctile >= 70 ? "elevated" : pctile <= 30 ? "calm" : "normal";
  return `
    <span class="pctile-cell is-${tone}" title="${escapeHtml(formatPctileTitle(pctile))}">
      <span class="pctile-rail" aria-hidden="true">
        <span class="pctile-fill" style="width:${pctile}%"></span>
        <span class="pctile-marker" style="left:${pctile}%"></span>
      </span>
      <span class="pctile-label">${escapeHtml(String(value))}</span>
    </span>
  `;
}

function formatPctileTitle(pctile) {
  if (pctile >= 85) {
    return "极高分位：这次同方向变化幅度很罕见；方向请看对应 bp 列。";
  }
  if (pctile >= 70) {
    return "偏高分位：这次同方向变化大于常态；方向请看对应 bp 列。";
  }
  if (pctile <= 15) {
    return "极低分位：这次同方向变化并不罕见，冲击强度低。";
  }
  if (pctile <= 30) {
    return "偏低分位：这次同方向变化偏常态，不构成独立冲击。";
  }
  return "中性分位：当前同方向变化接近历史常态区间。";
}

function renderSignalPill(value) {
  const text = String(value || "Awaiting daily task");
  const normalized = text.toLowerCase();
  const tone = normalized.includes("bear") || normalized.includes("selloff") || normalized.includes("shock")
    ? "up"
    : normalized.includes("bull") || normalized.includes("rally")
      ? "down"
      : "flat";
  return `<span class="signal-pill is-${tone}">${escapeHtml(text)}</span>`;
}

function renderMarketReaction(reaction) {
  if (!refs.marketReactionSummary || !refs.marketReactionGrid) {
    return;
  }
  const model = normalizeMarketReaction(reaction);
  const status = String(model.sourceCoverageStatus || "").toLowerCase();
  const isMissing = status.includes("missing") || status.includes("unavailable");
  const sourceMix = Array.isArray(model.sourceMix) ? model.sourceMix : [];
  const sourceMixText = sourceMix.length
    ? sourceMix
        .map((item) => `${formatSourceType(item.type)} ${Number(item.count || 0)} / ${formatWeight(item.weight)}`)
        .join(" · ")
    : "来源结构不可用";

  refs.marketReactionSummary.innerHTML = `
    <div>
      <span class="reaction-kicker">${escapeHtml(model.asOf || "--")}</span>
      <h3>${escapeHtml(model.summary || DEFAULT_MARKET_REACTION.summary)}</h3>
      <p>${escapeHtml(sourceMixText)}</p>
    </div>
    <span class="reaction-status is-${isMissing ? "missing" : "ready"}">${escapeHtml(isMissing ? "需要研究输入" : "已加权整理")}</span>
  `;

  refs.marketReactionGrid.innerHTML = model.themes
    .map((theme, index) => {
      const evidence = Array.isArray(theme.evidence) ? theme.evidence : [];
      const linked = Array.isArray(theme.linkedNarrativeIds) ? theme.linkedNarrativeIds : [];
      return `
        <article class="market-reaction-card">
          <div class="reaction-card-head">
            <span class="reaction-rank">#${escapeHtml(String(theme.rank || index + 1))}</span>
            <span class="reaction-weight">${escapeHtml(formatWeight(theme.weight))}</span>
          </div>
          <h3>${escapeHtml(theme.title || "未命名市场叙事")}</h3>
          <p>${escapeHtml(theme.interpretation || "等待研究证据填充。")}</p>
          <div class="reaction-tags">
            <span>${escapeHtml(formatReactionStance(theme.stance))}</span>
            ${linked.map((id) => `<span>${escapeHtml(formatNarrativeId(id))}</span>`).join("")}
          </div>
          <ul class="reaction-evidence-list">
            ${evidence
              .map((item) => `
                <li>
                  <span>${escapeHtml(formatSourceType(item.sourceType))} · ${escapeHtml(item.sourceName || "来源")}</span>
                  <strong>${escapeHtml(item.publishedAt || "--")}</strong>
                  <p>${escapeHtml(item.summary || item.quoteOrSummary || "")}</p>
                </li>
              `)
              .join("")}
          </ul>
        </article>
      `;
    })
    .join("");
}

function formatWeight(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number)}%` : "--";
}

function formatSourceType(value) {
  const key = String(value || "").toLowerCase();
  const labels = {
    media: "媒体",
    institution: "机构",
    community: "社群",
    official: "官方",
    automation: "自动化",
  };
  return labels[key] || String(value || "来源");
}

function formatReactionStance(value) {
  const key = String(value || "").toLowerCase();
  const labels = {
    dominant: "主导叙事",
    secondary: "次要叙事",
    mixed: "分歧叙事",
    unavailable: "不可用",
    empty: "无有效输入",
  };
  return labels[key] || String(value || "分歧叙事");
}

function formatNarrativeId(id) {
  return NARRATIVE_CN[id]?.title || String(id || "").replaceAll("_", " ");
}

function renderNarrativeRanking(narratives) {
  const ranked = getRankedNarratives(narratives);
  refs.narrativeRankingGrid.innerHTML = ranked
    .map((item, index) => {
      const display = getNarrativeDisplay(item);
      return `
        <article class="narrative-card">
          <div class="narrative-card-head">
            <span class="narrative-rank">#${index + 1}</span>
            <span class="star-score" aria-label="${escapeHtml(String(item.score || 0))} 分">${formatStars(item.score)}</span>
          </div>
          <h3 class="narrative-title">${escapeHtml(display.title)}</h3>
          <p>${escapeHtml(display.core || "等待每日任务填入核心叙事。")}</p>
          <div class="narrative-meta">
            <span class="narrative-chip">得分 ${escapeHtml(String(item.score ?? 0))}</span>
            <span class="narrative-chip">${escapeHtml(item.updatedAt || "--")}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderNarrativeDetails(narratives) {
  const ranked = getRankedNarratives(narratives);
  refs.narrativeDetailGrid.innerHTML = ranked
    .map((item) => {
      const display = getNarrativeDisplay(item);
      const checks = display.checks;
      const scoreLogic = getNarrativeScoreLogic(item);
      return `
        <article class="narrative-detail-card">
          <div class="narrative-card-head">
            <h3>${escapeHtml(display.title)}</h3>
            <span class="star-score">${formatStars(item.score)}</span>
          </div>
          <div class="score-rationale">
            <span class="score-rationale-label">${escapeHtml(`${Number(item.score || 0)}星边界`)}</span>
            <p>${escapeHtml(scoreLogic)}</p>
          </div>
          <ul class="evidence-list">
            ${checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("")}
          </ul>
          <p>${escapeHtml(display.interpretation || "等待每日任务生成信号解释。")}</p>
        </article>
      `;
    })
    .join("");
}

function getNarrativeDisplay(item) {
  const config = NARRATIVE_CN[item.id] || {};
  const checks = Array.isArray(item.checks) && item.checks.length ? item.checks : [];
  const translatedCore = translateNarrativeText(item.core || "");
  const translatedInterpretation = translateNarrativeText(item.interpretation || "");
  return {
    title: config.title || translateNarrativeText(item.title || ""),
    core: translatedCore || config.core || "",
    interpretation: translatedInterpretation || config.interpretation || "",
    checks: checks.map((check) => translateNarrativeText(check)).filter(Boolean),
  };
}

function getNarrativeScoreLogic(item) {
  const score = clamp(Math.round(Number(item.score) || 0), 0, 3);
  const evidenceCount = Array.isArray(item.evidence) ? item.evidence.length : 0;
  const checkCount = Array.isArray(item.checks) ? item.checks.length : 0;
  const hasEvidence = evidenceCount > 0 || checkCount > 0;
  if (score === 0) {
    return "当前是0星：检查项没有形成同向确认。0星已经是下限；不是1星，因为还缺至少一条清晰、可落到价格或曲线的核心证据。";
  }
  if (score === 1) {
    return `当前是1星：${hasEvidence ? "已有背景或单条证据" : "仅有弱线索"}，但证据方向仍混合。不是0星，因为信号没有完全消失；不是2星，因为还没有两条以上核心证据与价格/曲线确认同向。`;
  }
  if (score === 2) {
    return "当前是2星：至少两条核心证据大体同向，并有价格或曲线信号配合。不是1星，因为已经不只是单条弱证据；不是3星，因为还缺极端分位、跨资产确认或1D/5D持续强化。";
  }
  return "当前是3星：多条证据同向，且出现极端分位、跨资产或短线持续性确认。不是2星，因为信号已经从中等确认升级为强确认；3星是当前评分上限。";
}

function translateNarrativeText(text) {
  const source = String(text || "").trim();
  if (!source) {
    return "";
  }
  const exact = {
    "HY OAS is unavailable.": "HY OAS 暂无本地数据。",
    "DXY and funding stress data are unavailable.": "DXY 和美元融资压力暂无本地数据。",
    "MOVE index is unavailable.": "MOVE 指数暂无本地数据。",
    "SOFR futures implied cuts are unavailable.": "SOFR 期货隐含降息次数暂无本地数据。",
    "Fed funds futures implied cuts are unavailable.": "联邦基金期货隐含降息次数暂无本地数据。",
    "Oil, gasoline, and commodity basket data are unavailable.": "油价、汽油和商品篮子暂无本地数据。",
    "ACM / Kim-Wright term premium is unavailable.": "ACM / Kim-Wright 期限溢价暂无本地数据。",
    "Auction tail and bid-to-cover are unavailable.": "国债拍卖 tail 和 bid-to-cover 暂无本地数据。",
    "MOVE index: unavailable": "MOVE 指数：暂无本地数据",
    "CFTC Treasury futures positioning: unavailable": "CFTC 美债期货持仓：暂无本地数据",
    "Timing overlay: No standalone timing signal": "择时叠加：没有独立择时信号",
    "The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.": "最强证据来自过去63个有效观测里的熊平背景，而不是新的5日冲击。",
    "Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.": "风险偏好信号分化：CNN总分偏贪婪，但垃圾债需求内部项较弱。",
    "Local curve proxies do not show independent 30Y stress over the 5D window.": "本地曲线代理没有显示30Y在5日窗口内独立承压。",
    "Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.": "技术信号不足以单独触发或升级久期动作，仍需基本面冲击配合。",
    "Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.": "通胀补偿只是弱观察项，本地5日 tape 没有形成广泛的 breakeven 主导 selloff。",
    "Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.": "风险/流动性不是利率主导信号，但信用偏好偏弱，久期判断仍需保留条件。",
  };
  if (exact[source]) {
    return exact[source];
  }
  let match = source.match(/^CNN Fear & Greed is (\w+) as of ([\d-]+); VIX is (\w+) and junk bond demand is ([\w\s]+)\.$/);
  if (match) {
    return `CNN 恐惧与贪婪在 ${match[2]} 为${translateRating(match[1])}；VIX 为${translateRating(match[3])}，垃圾债需求为${translateRating(match[4])}。`;
  }
  match = source.match(/^DGS(\d+) 63-observation move is ([+-]?\d+)bp\.$/);
  if (match) {
    return `DGS${match[1]} 过去63个有效观测变化为 ${match[2]}bp。`;
  }
  match = source.match(/^DGS(\d+) 5D move is ([+-]?\d+)bp, while DGS(\d+) 5D move is ([+-]?\d+)bp\.$/);
  if (match) {
    return `DGS${match[1]} 5日变化为 ${match[2]}bp，同时 DGS${match[3]} 5日变化为 ${match[4]}bp。`;
  }
  match = source.match(/^DGS(\d+) 5D move is ([+-]?\d+)bp(?: versus DGS(\d+) ([+-]?\d+)bp)?\.$/);
  if (match) {
    return match[3]
      ? `DGS${match[1]} 5日变化为 ${match[2]}bp，相比 DGS${match[3]} 为 ${match[4]}bp。`
      : `DGS${match[1]} 5日变化为 ${match[2]}bp。`;
  }
  match = source.match(/^DGS(\d+) 21-observation move is ([+-]?\d+)bp\.$/);
  if (match) {
    return `DGS${match[1]} 过去21个有效观测变化为 ${match[2]}bp。`;
  }
  match = source.match(/^(\d+)Y breakeven contribution over 5D is ([+-]?\d+)bp\.$/);
  if (match) {
    return `${match[1]}年 breakeven 对5日变化的贡献为 ${match[2]}bp。`;
  }
  match = source.match(/^T5YIFR 5D move is ([+-]?\d+)bp\.$/);
  if (match) {
    return `T5YIFR 5日变化为 ${match[1]}bp。`;
  }
  match = source.match(/^(\d+)s(\d+)s 5D change is ([+-]?\d+)bp\.$/);
  if (match) {
    return `${match[1]}s${match[2]}s 5日变化为 ${match[3]}bp。`;
  }
  match = source.match(/^US(\d+)Y 九转: up (\d+) \/ down (\d+)$/);
  if (match) {
    return `US${match[1]}Y 九转：上行 ${match[2]} / 下行 ${match[3]}`;
  }
  match = source.match(/^RSI: 10Y ([\d.]+) \/ 30Y ([\d.]+)$/);
  if (match) {
    return `RSI：10Y ${match[1]} / 30Y ${match[2]}`;
  }
  match = source.match(/^Bollinger z-score: 10Y ([+-]?[\d.]+) \/ 30Y ([+-]?[\d.]+)$/);
  if (match) {
    return `布林 z-score：10Y ${match[1]} / 30Y ${match[2]}`;
  }
  match = source.match(/^20D move percentile: 10Y ([+-]?\d+)bp ([\d%*]+) \/ 30Y ([+-]?\d+)bp ([\d%*]+)$/);
  if (match) {
    return `20日变化分位：10Y ${match[1]}bp ${match[2]} / 30Y ${match[3]}bp ${match[4]}`;
  }
  match = source.match(/^Breakevens are positive over 21\/63 observations but softer over the 5D window, so inflation compensation is not the main shock on ([\d-]+)\.$/);
  if (match) {
    return `breakeven 在21日/63日窗口仍偏正，但5日窗口转弱；${match[1]} 不是通胀补偿主导的利率冲击。`;
  }
  match = source.match(/^Technical indicators do not show a clear yield-up exhaustion setup on ([\d-]+)\.$/);
  if (match) {
    return `${match[1]} 的技术指标没有显示明确的收益率上行衰竭形态。`;
  }
  match = source.match(/^Policy-path repricing remains a background narrative, but ([\d-]+) does not show a fresh front-end-led shock\.$/);
  if (match) {
    return `政策路径重定价仍是背景叙事，但 ${match[1]} 没有出现新的短端主导冲击。`;
  }
  match = source.match(/^The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for ([\d-]+)\.$/);
  if (match) {
    return `没有30Y主导的熊陡，不支持升级长端久期；同时也移除了 ${match[1]} 的主要长端压力否决项。`;
  }
  match = source.match(/^DGS10 rose ([+-]?\d+)bp over 5D, so a growth-scare \/ recession-hedge rates rally is not confirmed\.$/);
  if (match) {
    return `DGS10 5日上行 ${match[1]}bp，因此增长担忧/衰退对冲式利率 rally 没有被确认。`;
  }
  match = source.match(/^DGS10 fell ([+-]?\d+)bp over 5D, while CNN risk proxies are mixed\.$/);
  if (match) {
    return `DGS10 5日下行 ${match[1]}bp，但 CNN 风险代理信号仍然混合。`;
  }
  match = source.match(/^DGS10 rose ([+-]?\d+)bp over 5D, while CNN risk proxies are mixed\.$/);
  if (match) {
    return `DGS10 5日上行 ${match[1]}bp，同时 CNN 风险代理信号仍然混合。`;
  }
  if (source === "The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.") {
    return "增长担忧叙事偏弱，因为5日窗口里收益率没有 rally，风险代理也只是混合而非明显防御。";
  }
  return source
    .replaceAll("Risk appetite", "风险偏好")
    .replaceAll("liquidity", "流动性")
    .replaceAll("Fed path repricing", "美联储路径重定价")
    .replaceAll("Growth scare", "增长担忧")
    .replaceAll("recession hedge", "衰退对冲")
    .replaceAll("Inflation compensation shock", "通胀补偿冲击")
    .replaceAll("Long-end term premium", "长端期限溢价")
    .replaceAll("fiscal supply", "财政供给")
    .replaceAll("Technical positioning", "技术面仓位")
    .replaceAll("exhaustion", "衰竭");
}

function translateRating(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const labels = {
    greed: "贪婪",
    "extreme greed": "极度贪婪",
    neutral: "中性",
    fear: "恐惧",
    "extreme fear": "极度恐惧",
  };
  return labels[normalized] || value;
}

function renderDurationAction(action) {
  const reasons = Array.isArray(action.reasons) ? action.reasons : [];
  refs.durationActionSummary.innerHTML = `
    <article class="duration-summary-card">
      <strong>${escapeHtml(action.label || "Watchlist only")}</strong>
      <p>${escapeHtml(action.explanation || "等待每日任务生成当前档位说明。")}</p>
      <ul class="duration-reason-list">
        ${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
    </article>
  `;
  const currentIndex = Number.isFinite(Number(action.currentIndex)) ? Number(action.currentIndex) : 1;
  const steps = Array.isArray(action.steps) && action.steps.length ? action.steps : DEFAULT_DURATION_STEPS;
  refs.durationLadder.innerHTML = steps
    .map((step) => {
      const index = Number.isFinite(Number(step.index)) ? Number(step.index) : 0;
      return `
        <article class="duration-step ${index === currentIndex || step.active ? "is-active" : ""}">
          <div class="duration-step-head">
            <span class="duration-step-index">${index}</span>
          </div>
          <h3 class="duration-step-title">${escapeHtml(step.title || "--")}</h3>
          <p>${escapeHtml(step.condition || "等待规则填充。")}</p>
        </article>
      `;
    })
    .join("");
  const rules = Array.isArray(action.rules) && action.rules.length ? action.rules : DEFAULT_DURATION_RULES;
  refs.durationRuleGrid.innerHTML = rules
    .map((rule) => `
      <article class="duration-rule-card">
        <h3>${escapeHtml(rule.title || "--")}</h3>
        <p>${escapeHtml(rule.body || "")}</p>
        <ul class="duration-reason-list">
          ${(Array.isArray(rule.triggers) ? rule.triggers : []).map((trigger) => `<li>${escapeHtml(trigger)}</li>`).join("")}
        </ul>
      </article>
    `)
    .join("");
}

function renderTechnicalPanel(technical) {
  const signals = Array.isArray(technical.signals) && technical.signals.length ? technical.signals : DEFAULT_TECHNICAL_SIGNALS;
  refs.technicalGrid.innerHTML = signals
    .map((signal) => renderTechnicalSignal(signal))
    .join("");
  refs.technicalAdvice.innerHTML = `
    <strong>${escapeHtml(technical.adviceTitle || "Waiting for automation")}</strong>
    <p>${escapeHtml(technical.adviceBody || "技术面只做 timing overlay，需和基本面叠加。")}</p>
  `;
}

function renderTechnicalSignal(signal) {
  const title = String(signal.title || "--");
  if (title.includes("九转")) {
    return renderNineTurnSignal(signal);
  }
  if (title === "RSI") {
    return renderRsiSignal(signal);
  }
  if (title.includes("Bollinger")) {
    return renderBollingerSignal(signal);
  }
  if (title.includes("20D move percentile")) {
    return renderMovePercentileSignal(signal);
  }
  if (title.includes("Timing overlay")) {
    return renderTimingOverlaySignal(signal);
  }
  return renderUnavailableOrSimpleSignal(signal);
}

function renderTechnicalCard(signal, body, extraClass = "") {
  return `
    <article class="technical-signal ${extraClass}">
      <div class="technical-signal-head">
        <h3 class="technical-title">${escapeHtml(signal.title || "--")}</h3>
        <span class="technical-status is-${escapeHtml(normalizeStatus(signal.status))}">${escapeHtml(signal.status || "pending")}</span>
      </div>
      ${body}
      <p>${escapeHtml(signal.note || "等待每日任务填充读数。")}</p>
    </article>
  `;
}

function renderNineTurnSignal(signal) {
  const match = String(signal.value || "").match(/up\s+(\d+)\s+\/\s+down\s+(\d+)/i);
  const up = match ? clamp(Number(match[1]), 0, 9) : 0;
  const down = match ? clamp(Number(match[2]), 0, 9) : 0;
  const active = Math.max(up, down);
  const direction = up >= down ? "up" : "down";
  const dots = Array.from({ length: 9 }, (_, index) => {
    const isActive = index < active;
    return `<span class="nine-dot ${isActive ? "is-active" : ""}"></span>`;
  }).join("");
  const body = `
    <div class="nine-turn-visual" aria-label="${escapeHtml(String(signal.value || ""))}">
      <div class="nine-turn-counts">
        <span><strong>${up}</strong><small>up</small></span>
        <span><strong>${down}</strong><small>down</small></span>
      </div>
      <div class="nine-dot-row is-${direction}">${dots}</div>
    </div>
  `;
  return renderTechnicalCard(signal, body, "is-visual");
}

function renderRsiSignal(signal) {
  const pair = parseTenThirtyPair(signal.value);
  const body = `
    <div class="gauge-stack">
      ${renderPercentGauge("10Y", pair.ten, 0, 100, "30 / 70")}
      ${renderPercentGauge("30Y", pair.thirty, 0, 100, "30 / 70")}
    </div>
  `;
  return renderTechnicalCard(signal, body, "is-visual");
}

function renderBollingerSignal(signal) {
  const pair = parseTenThirtyPair(signal.value);
  const body = `
    <div class="gauge-stack">
      ${renderBipolarGauge("10Y", pair.ten, -3, 3)}
      ${renderBipolarGauge("30Y", pair.thirty, -3, 3)}
    </div>
  `;
  return renderTechnicalCard(signal, body, "is-visual");
}

function renderMovePercentileSignal(signal) {
  const match = String(signal.value || "").match(/10Y\s+([+-]?\d+)bp\s+([\d.]+)%\*?\s+\/\s+30Y\s+([+-]?\d+)bp\s+([\d.]+)%\*?/i);
  const tenMove = match ? Number(match[1]) : NaN;
  const tenPct = match ? Number(match[2]) : NaN;
  const thirtyMove = match ? Number(match[3]) : NaN;
  const thirtyPct = match ? Number(match[4]) : NaN;
  const body = `
    <div class="gauge-stack">
      ${renderPercentGauge("10Y", tenPct, 0, 100, `${formatSignedBp(tenMove)} / ${formatNumberOrDash(tenPct)}%`)}
      ${renderPercentGauge("30Y", thirtyPct, 0, 100, `${formatSignedBp(thirtyMove)} / ${formatNumberOrDash(thirtyPct)}%`)}
    </div>
  `;
  return renderTechnicalCard(signal, body, "is-visual");
}

function renderTimingOverlaySignal(signal) {
  const status = normalizeStatus(signal.status);
  const body = `
    <div class="timing-overlay-visual is-${status}">
      <span class="timing-orb"></span>
      <strong>${escapeHtml(signal.value || "--")}</strong>
    </div>
  `;
  return renderTechnicalCard(signal, body, "is-visual is-wide");
}

function renderUnavailableOrSimpleSignal(signal) {
  const value = String(signal.value ?? "--");
  const unavailable = value.toLowerCase().includes("unavailable") || normalizeStatus(signal.status) === "unavailable";
  const body = unavailable
    ? `<div class="unavailable-visual"><span></span><strong>unavailable</strong></div>`
    : `<div class="technical-value">${escapeHtml(value)}</div>`;
  return renderTechnicalCard(signal, body, unavailable ? "is-unavailable" : "");
}

function parseTenThirtyPair(value) {
  const match = String(value || "").match(/10Y\s+([+-]?[\d.]+)\s+\/\s+30Y\s+([+-]?[\d.]+)/i);
  return {
    ten: match ? Number(match[1]) : NaN,
    thirty: match ? Number(match[2]) : NaN,
  };
}

function renderPercentGauge(label, value, min, max, annotation) {
  const pct = Number.isFinite(value) ? clamp(((value - min) / (max - min)) * 100, 0, 100) : 0;
  return `
    <div class="technical-gauge">
      <div class="gauge-meta">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(formatNumberOrDash(value))}</strong>
      </div>
      <div class="gauge-track is-percent">
        <span class="gauge-band is-low"></span>
        <span class="gauge-band is-high"></span>
        <span class="gauge-marker" style="left:${pct}%"></span>
      </div>
      <small>${escapeHtml(annotation)}</small>
    </div>
  `;
}

function renderBipolarGauge(label, value, min, max) {
  const pct = Number.isFinite(value) ? clamp(((value - min) / (max - min)) * 100, 0, 100) : 50;
  const fillWidth = Number.isFinite(value) ? Math.abs(pct - 50) : 0;
  const fillLeft = value >= 0 ? 50 : 50 - fillWidth;
  return `
    <div class="technical-gauge">
      <div class="gauge-meta">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(formatSignedNumberOrDash(value))}</strong>
      </div>
      <div class="gauge-track is-bipolar">
        <span class="gauge-zero"></span>
        <span class="gauge-fill" style="left:${fillLeft}%;width:${fillWidth}%"></span>
        <span class="gauge-marker" style="left:${pct}%"></span>
      </div>
      <small>-3 / 0 / +3</small>
    </div>
  `;
}

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "pending";
}

function formatSignedBp(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return `${value > 0 ? "+" : ""}${Math.round(value)}bp`;
}

function formatNumberOrDash(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return Number(value).toFixed(Math.abs(value) >= 10 ? 0 : 1);
}

function formatSignedNumberOrDash(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return `${value > 0 ? "+" : ""}${Number(value).toFixed(2)}`;
}

function getRankedNarratives(narratives) {
  return narratives
    .slice()
    .sort((left, right) => {
      const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
      if (scoreDiff) {
        return scoreDiff;
      }
      return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
    });
}

function formatStars(score) {
  const count = clamp(Math.round(Number(score) || 0), 0, 3);
  return `${"★".repeat(count)}${"☆".repeat(4 - count)}`;
}

async function refreshDashboard(mode = "refresh") {
  const refreshStartedAt = new Date();
  const refreshSeq = state.refreshSeq + 1;
  state.refreshSeq = refreshSeq;
  const previousSignature = getSeriesSignature(state.seriesMap);
  setFeedHealth({
    phase: "loading",
    tone: "loading",
    title: "数据获取中",
    detail: "正在连接 Treasury、FRED、CNN 和 AHR999。",
    feeds: {
      treasury: { state: "loading", label: "Treasury", detail: "连接中" },
      fred: { state: "loading", label: "FRED", detail: "连接中" },
      cnn: { state: "loading", label: "CNN", detail: "连接中" },
      ahr: { state: "loading", label: "AHR999", detail: "连接中" },
    },
  });
  refs.refreshButton.disabled = true;

  const fredDefs = SERIES_DEFS.filter((def) => def.live?.type === "fred");
  const treasuryDefs = SERIES_DEFS.filter((def) => def.live?.type === "treasury");
  const cnnSeriesCount = SERIES_DEFS.filter((def) => def.live?.type === "cnn").length;
  const [initialFredResults, initialTreasuryResults, initialCnnBundle, initialAhrSeries] = await Promise.all([
    Promise.all(fredDefs.map((def) => trackRefreshUnit(fetchFredSeries(def, mode), def.symbol))),
    trackRefreshUnit(fetchTreasurySeriesBundle(treasuryDefs, mode), `Treasury x${treasuryDefs.length}`, treasuryDefs.length),
    trackRefreshUnit(fetchCnnBundle(mode), `CNN x${cnnSeriesCount}`, cnnSeriesCount),
    trackRefreshUnit(fetchAhrSeries(mode), "AHR999"),
  ]);
  let fredResults = initialFredResults;
  let treasuryResults = initialTreasuryResults;
  let cnnBundle = initialCnnBundle;
  let ahrSeries = initialAhrSeries;

  if (needsRetry(fredResults, treasuryResults, cnnBundle, ahrSeries)) {
    setFeedHealth({
      phase: "retrying",
      tone: "warning",
      title: "重新尝试连接中",
      detail: "部分数据源第一次连接失败，正在再试一次。",
      feeds: buildFeedHealth(fredResults, treasuryResults, cnnBundle, ahrSeries),
    });
    const retryFredDefs = fredDefs.filter((def) => !fredResults.find((result) => result.id === def.id && result.ok));
    const retryTreasuryDefs = treasuryDefs.filter((def) => !treasuryResults.find((result) => result.id === def.id && result.ok));
    const [retryFredResults, retryTreasuryResults, retryCnnBundle, retryAhrSeries] = await Promise.all([
      Promise.all(retryFredDefs.map((def) => fetchFredSeries(def, mode))),
      retryTreasuryDefs.length ? fetchTreasurySeriesBundle(retryTreasuryDefs, mode) : Promise.resolve([]),
      cnnBundle.ok ? Promise.resolve(cnnBundle) : fetchCnnBundle(mode),
      ahrSeries?.source === "live" ? Promise.resolve(ahrSeries) : fetchAhrSeries(mode),
    ]);
    fredResults = mergeFredResults(fredResults, retryFredResults);
    treasuryResults = mergeFredResults(treasuryResults, retryTreasuryResults);
    cnnBundle = retryCnnBundle;
    ahrSeries = retryAhrSeries;
  }

  const fredMap = new Map(fredResults.filter((result) => result.ok).map((result) => [result.series.id, result.series]));
  const treasuryMap = new Map(treasuryResults.filter((result) => result.ok).map((result) => [result.series.id, result.series]));
  const seriesMap = new Map();

  for (const def of SERIES_DEFS) {
    if (def.live?.type === "fred") {
      seriesMap.set(def.id, fredMap.get(def.id) ?? makeEmptySeries(def));
    } else if (def.live?.type === "treasury") {
      seriesMap.set(def.id, treasuryMap.get(def.id) ?? makeEmptySeries(def));
    } else if (def.live?.type === "cnn") {
      seriesMap.set(def.id, buildCnnSeries(def, cnnBundle));
    } else if (def.live?.type === "ahr") {
      seriesMap.set(def.id, ahrSeries ?? makeEmptySeries(def));
    } else {
      seriesMap.set(def.id, makeEmptySeries(def));
    }
  }

  buildDerivedSeries(seriesMap);
  const nextSignature = getSeriesSignature(seriesMap);
  const changedCount = countSignatureChanges(previousSignature, nextSignature);
  const latestDataDate = getLatestDataDate(seriesMap);
  state.seriesMap = seriesMap;
  state.lastRefreshAt = new Date();
  state.networkStatus = {
    fred: summarizeFredStatus(fredResults),
    treasury: summarizeTreasuryStatus(treasuryResults),
    cnn: cnnBundle.ok ? `cnn ${formatCacheStatus(cnnBundle.cacheStatus)}` : `cnn ${cnnBundle.reason}`,
    ahr: ahrSeries?.source === "live" ? `ahr ${formatCacheStatus(ahrSeries.cacheStatus)}` : "ahr unavailable",
  };
  refs.refreshButton.disabled = false;
  const hasWarning = hasAnyWarning(fredResults, treasuryResults, cnnBundle, ahrSeries);
  setFeedHealth({
    phase: hasAnyError(fredResults, treasuryResults, cnnBundle, ahrSeries) || hasWarning ? "partial" : "ready",
    tone: hasAnyLive(seriesMap) ? (hasAnyError(fredResults, treasuryResults, cnnBundle, ahrSeries) || hasWarning ? "warning" : "ok") : "error",
    title: hasAnyLive(seriesMap) ? "数据已更新" : "数据获取失败",
    detail: formatStatus(cnnBundle, seriesMap, { changedCount, latestDataDate, refreshStartedAt, refreshSeq }),
    feeds: buildFeedHealth(fredResults, treasuryResults, cnnBundle, ahrSeries),
  });
  render();
  maybeFinishLoadProgress();
}

async function fetchFredSeries(def, mode = "") {
  try {
    const response = await fetch(API_ROUTES.fred(def.live.id, mode), { cache: "no-store" });
    if (!response.ok) {
      const detail = await safeJson(response);
      return { ok: false, id: def.id, reason: detail?.error || `HTTP ${response.status}` };
    }
    const text = await response.text();
    const data = parseFredCsvText(text);

    return data.length
      ? {
          ok: true,
          id: def.id,
          series: {
            ...def,
            source: "live",
            data,
            updatedAt: data[data.length - 1].date,
            cacheStatus: response.headers.get("X-Proxy-Cache") || "MISS",
          },
        }
      : { ok: false, id: def.id, reason: "empty response" };
  } catch (error) {
    return { ok: false, id: def.id, reason: error?.message || "request failed" };
  }
}

async function fetchTreasurySeriesBundle(defs, mode = "") {
  if (!defs.length) {
    return [];
  }
  try {
    const response = await fetch(API_ROUTES.treasuryYields(mode), { cache: "no-store" });
    if (!response.ok) {
      const detail = await safeJson(response);
      return defs.map((def) => ({ ok: false, id: def.id, reason: detail?.error || `HTTP ${response.status}` }));
    }
    const payload = await response.json();
    const cacheStatus = response.headers.get("X-Proxy-Cache") || "MISS";
    return defs.map((def) => {
      const data = normalizeHomeYieldPoints(payload.series?.[def.live.key || def.id]);
      return data.length
        ? {
            ok: true,
            id: def.id,
            series: {
              ...def,
              source: "live",
              data,
              updatedAt: data[data.length - 1].date,
              cacheStatus,
              latestMeta: {
                source: payload.source,
                frequency: payload.frequency,
              },
            },
          }
        : { ok: false, id: def.id, reason: "empty Treasury response" };
    });
  } catch (error) {
    return defs.map((def) => ({ ok: false, id: def.id, reason: error?.message || "Treasury request failed" }));
  }
}

async function refreshHomeYieldChart(mode = "refresh") {
  renderHomeControls();
  homeYieldState.status = "loading";
  homeYieldState.message =
    mode === "cache"
      ? "Loading local Treasury curve cache..."
      : "Updating US3Y / US10Y / US30Y from Treasury daily curve...";
  renderHomeYieldLegend();
  drawHomeYieldChart(1);

  const task = fetchHomeYieldBundle(mode);
  const result = mode === "refresh" ? await trackRefreshUnit(task, "Treasury curve", HOME_YIELD_DEFS.length) : await task;
  homeYieldState.series = result.series || [];
  const errors = result.errors || [];

  if (homeYieldState.series.length) {
    const latestDate = getLatestHomeYieldDate();
    const errorText = errors.length ? ` · ${errors.length} feed unavailable` : "";
    const staleText = homeYieldState.series.some((series) => series.cacheStatus === "STALE") ? " · using stale local cache" : "";
    homeYieldState.status = errors.length ? "partial" : "ready";
    homeYieldState.message = `Updated ${latestDate ? formatDate(latestDate) : "--"} · Source: ${result.sourceLabel || "Treasury daily curve"}${errorText}${staleText}`;
  } else {
    homeYieldState.status = "error";
    homeYieldState.message = errors.map((error) => `${error.symbol || "Treasury"}: ${error.reason}`).join(" · ") || "No data";
  }

  renderHomeYieldLegend();
  startHomeYieldAnimation();
  if (mode === "refresh") {
    maybeFinishLoadProgress();
  }
}

async function fetchHomeYieldBundle(mode = "") {
  try {
    const response = await fetch(API_ROUTES.treasuryYields(mode), { cache: "no-store" });
    if (!response.ok) {
      const detail = await safeJson(response);
      return fetchHomeYieldFredFallback(mode, detail?.error || `HTTP ${response.status}`);
    }
    const payload = await response.json();
    const cacheStatus = response.headers.get("X-Proxy-Cache") || "MISS";
    const series = HOME_YIELD_DEFS.map((def) => {
      const data = normalizeHomeYieldPoints(payload.series?.[def.id]);
      return data.length
        ? {
            ok: true,
            series: {
              ...def,
              source: "live",
              data,
              updatedAt: data[data.length - 1].date,
              cacheStatus,
              latestMeta: {
                source: payload.source,
                frequency: payload.frequency,
              },
            },
          }
        : { ok: false, symbol: def.symbol, reason: "empty Treasury response" };
    });
    return {
      series: series.filter((result) => result.ok).map((result) => result.series),
      errors: series.filter((result) => !result.ok),
      sourceLabel: payload.frequency ? `${payload.source} (${payload.frequency})` : payload.source,
    };
  } catch (error) {
    return fetchHomeYieldFredFallback(mode, error?.message || "Treasury request failed");
  }
}

async function fetchHomeYieldFredFallback(mode, reason) {
  const results = await Promise.all(HOME_YIELD_DEFS.map((def) => fetchHomeYieldSeries(def, mode)));
  const errors = results
    .filter((result) => !result.ok)
    .concat([{ symbol: "Treasury", reason }]);
  return {
    series: results.filter((result) => result.ok).map((result) => ({
      ...result.series,
      latestMeta: {
        ...(result.series.latestMeta || {}),
        fallbackReason: reason,
      },
    })),
    errors,
    sourceLabel: "FRED fallback",
  };
}

function normalizeHomeYieldPoints(points) {
  return (Array.isArray(points) ? points : [])
    .map((point) => ({
      date: point.date,
      value: Number.parseFloat(point.value),
      filled: Boolean(point.filled),
    }))
    .filter((point) => point.date && Number.isFinite(point.value));
}

async function fetchHomeYieldSeries(def, mode = "") {
  try {
    const response = await fetch(API_ROUTES.fred(def.fredId, mode), { cache: "no-store" });
    if (!response.ok) {
      const detail = await safeJson(response);
      return { ok: false, symbol: def.symbol, reason: detail?.error || `HTTP ${response.status}` };
    }
    const data = parseFredCsvText(await response.text());
    return data.length
      ? {
          ok: true,
          series: {
            ...def,
            source: "live",
            data,
            updatedAt: data[data.length - 1].date,
            cacheStatus: response.headers.get("X-Proxy-Cache") || "MISS",
          },
        }
      : { ok: false, symbol: def.symbol, reason: "empty response" };
  } catch (error) {
    return { ok: false, symbol: def.symbol, reason: error?.message || "request failed" };
  }
}

function parseFredCsvText(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => {
      const [date, valueText] = row.split(",");
      return { date, value: Number.parseFloat(valueText) };
    })
    .filter((point) => point.date && Number.isFinite(point.value));
}

async function fetchCnnBundle(mode = "") {
  try {
    const response = await fetch(API_ROUTES.cnn(mode), { cache: "no-store" });
    if (!response.ok) {
      const detail = await safeJson(response);
      return {
        ok: false,
        payload: null,
        reason: [detail?.error || `HTTP ${response.status}`, detail?.detail].filter(Boolean).join(": "),
        cacheStatus: "BYPASS",
      };
    }
    const payload = await response.json();
    return { ok: true, payload, reason: "live", cacheStatus: response.headers.get("X-Proxy-Cache") || "MISS" };
  } catch (error) {
    return { ok: false, payload: null, reason: error?.message || "blocked", cacheStatus: "BYPASS" };
  }
}

async function fetchAhrSeries(mode = "") {
  const def = SERIES_DEFS.find((item) => item.id === "ahr999");
  try {
    const response = await fetch(API_ROUTES.ahr(mode), { cache: "no-store" });
    if (!response.ok) {
      const detail = await safeJson(response);
      return {
        ...makeEmptySeries(def),
        latestMeta: {
          proxyError: detail?.error || `HTTP ${response.status}`,
        },
      };
    }
    const payload = await response.json();
    const history = Array.isArray(payload.series) ? payload.series : Array.isArray(payload.series_7d) ? payload.series_7d : [];
    const data = history
      .map((point) => ({
        date: normalizeExternalDate(point.t),
        value: Number.parseFloat(point.ahr999),
      }))
      .filter((point) => point.date && Number.isFinite(point.value));

    const updatedAt = normalizeExternalDate(payload.updated_at_unix) || data[data.length - 1]?.date || todayIso();
    const currentValue = Number.parseFloat(payload.ahr999);
    if (Number.isFinite(currentValue) && updatedAt) {
      const currentIndex = data.findIndex((point) => point.date === updatedAt);
      if (currentIndex >= 0) {
        data[currentIndex] = { date: updatedAt, value: currentValue };
      } else {
        data.push({ date: updatedAt, value: currentValue });
      }
    }
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    return data.length
      ? {
          ...def,
          source: "live",
          data,
          updatedAt,
          latestMeta: {
            source: payload.source,
            priceUsd: payload.price_usd,
            ma200: payload.ma200_usd || payload.sma200_usd || payload.gma200_usd,
            indexGrowth: payload.index_growth_val,
            historyPoints: data.length,
          },
          cacheStatus: response.headers.get("X-Proxy-Cache") || "MISS",
        }
      : null;
  } catch (error) {
    return {
      ...makeEmptySeries(def),
      latestMeta: {
        proxyError: error?.message || "AHR proxy unavailable",
      },
    };
  }
}

function setFeedHealth(nextHealth) {
  state.feedHealth = nextHealth;
  renderFeedHealth();
}

function beginLoadProgress() {
  updateLoadProgress({
    phase: "loading",
    total: getTotalRefreshUnits(),
    completed: 0,
    detail: "加载中，正在按系列增量更新...",
  });
}

function getTotalRefreshUnits() {
  const dashboardUnits = SERIES_DEFS.filter((def) => def.live?.type === "fred" || def.live?.type === "treasury" || def.live?.type === "ahr").length;
  const cnnUnits = SERIES_DEFS.filter((def) => def.live?.type === "cnn").length;
  return dashboardUnits + cnnUnits + HOME_YIELD_DEFS.length;
}

async function trackRefreshUnit(promise, label, units = 1) {
  try {
    return await promise;
  } finally {
    advanceLoadProgress(label, units);
  }
}

function advanceLoadProgress(label, units = 1) {
  const nextCompleted = Math.min(state.loadProgress.total, state.loadProgress.completed + units);
  updateLoadProgress({
    ...state.loadProgress,
    phase: "loading",
    completed: nextCompleted,
    detail: `${label} 已更新`,
  });
}

function maybeFinishLoadProgress() {
  if (!state.loadProgress.total || state.loadProgress.completed < state.loadProgress.total) {
    return;
  }
  const finalPhase =
    state.feedHealth.tone === "error" ? "error" : state.feedHealth.tone === "warning" ? "warning" : "ok";
  updateLoadProgress({
    ...state.loadProgress,
    phase: finalPhase,
    detail: `全部 ${state.loadProgress.total} 个系列已完成增量更新`,
  });
}

function updateLoadProgress(nextProgress) {
  state.loadProgress = {
    ...state.loadProgress,
    ...nextProgress,
  };
  renderLoadProgress();
}

function renderLoadProgress() {
  const progress = state.loadProgress;
  const total = progress.total || 0;
  const completed = progress.completed || 0;
  const phase = progress.phase || "idle";
  const titleMap = {
    idle: "等待",
    loading: "加载中",
    ok: "已完成",
    warning: "部分完成",
    error: "错误",
  };
  if (refs.globalLoadStatus) {
    refs.globalLoadStatus.className = `global-load-strip ${phase}`;
    refs.globalLoadStatus.querySelector(".global-load-title").textContent = titleMap[phase] || "加载中";
    refs.globalLoadProgress.textContent = `${completed} / ${total}`;
    refs.globalLoadDetail.textContent = progress.detail || "";
  }
  renderFeedHealth();
}

function renderFeedHealth() {
  const health = state.feedHealth;
  refs.statusStrip.className = `status-strip ${health.tone || "idle"}`;
  const progress = state.loadProgress;
  const progressText = progress.total ? `${progress.completed || 0} / ${progress.total}` : "";
  const feeds = Object.entries(health.feeds || {})
    .map(([key, feed]) => {
      const stateClass = feed.state || "idle";
      return `
        <span class="feed-chip ${stateClass}" title="${escapeHtml(feed.detail || "")}">
          <span class="feed-dot"></span>
          <span class="feed-name">${escapeHtml(feed.label || key)}</span>
          <span class="feed-detail">${escapeHtml(feed.detail || stateClass)}</span>
        </span>
      `;
    })
    .join("");

  refs.statusStrip.innerHTML = `
    <div class="status-main">
      <span class="status-icon" aria-hidden="true"></span>
      <div>
        <div class="status-title">${escapeHtml(health.title || "状态未知")}</div>
        <div class="status-detail">${escapeHtml([progress.phase === "loading" ? `加载中 ${progressText}` : "", health.detail || progress.detail || ""].filter(Boolean).join(" · "))}</div>
      </div>
    </div>
    <div class="feed-chip-row">${feeds}</div>
  `;
}

function needsRetry(fredResults, treasuryResults, cnnBundle, ahrSeries) {
  return fredResults.some((result) => !result.ok) || treasuryResults.some((result) => !result.ok) || !cnnBundle.ok || ahrSeries?.source !== "live";
}

function hasAnyError(fredResults, treasuryResults, cnnBundle, ahrSeries) {
  return needsRetry(fredResults, treasuryResults, cnnBundle, ahrSeries);
}

function hasAnyWarning(fredResults, treasuryResults, cnnBundle, ahrSeries) {
  return (
    fredResults.some((result) => result.ok && result.series?.cacheStatus === "STALE") ||
    treasuryResults.some((result) => result.ok && result.series?.cacheStatus === "STALE") ||
    cnnBundle.cacheStatus === "STALE" ||
    ahrSeries?.cacheStatus === "STALE"
  );
}

function hasAnyLive(seriesMap) {
  return Array.from(seriesMap.values()).some((series) => series.source === "live");
}

function getSeriesSignature(seriesMap) {
  const signature = new Map();
  seriesMap.forEach((series, id) => {
    const latest = series?.data?.[series.data.length - 1];
    signature.set(id, {
      source: series?.source || "empty",
      length: series?.data?.length || 0,
      date: latest?.date || "",
      value: Number.isFinite(latest?.value) ? latest.value : null,
    });
  });
  return signature;
}

function countSignatureChanges(previousSignature, nextSignature) {
  let changes = 0;
  nextSignature.forEach((next, id) => {
    const previous = previousSignature.get(id);
    if (!previous || previous.source !== next.source || previous.length !== next.length || previous.date !== next.date || previous.value !== next.value) {
      changes += 1;
    }
  });
  return changes;
}

function getLatestDataDate(seriesMap) {
  return Array.from(seriesMap.values())
    .flatMap((series) => series?.data?.length ? [series.data[series.data.length - 1].date] : [])
    .sort()
    .at(-1) || "";
}

function mergeFredResults(originalResults, retryResults) {
  const retryMap = new Map(retryResults.map((result) => [result.id, result]));
  return originalResults.map((result) => (result.ok ? result : retryMap.get(result.id) || result));
}

function summarizeFredStatus(fredResults) {
  const liveCount = fredResults.filter((result) => result.ok).length;
  const staleCount = fredResults.filter((result) => result.ok && result.series?.cacheStatus === "STALE").length;
  const failed = fredResults.find((result) => !result.ok);
  if (liveCount === fredResults.length) {
    return staleCount ? `fred ${liveCount}/${fredResults.length} live · ${staleCount} stale` : `fred ${liveCount}/${fredResults.length} live`;
  }
  if (liveCount > 0) {
    return `fred partial ${liveCount}/${fredResults.length}: ${failed?.reason || "unknown"}`;
  }
  return `fred error: ${failed?.reason || "unavailable"}`;
}

function summarizeTreasuryStatus(treasuryResults) {
  const liveCount = treasuryResults.filter((result) => result.ok).length;
  const staleCount = treasuryResults.filter((result) => result.ok && result.series?.cacheStatus === "STALE").length;
  const failed = treasuryResults.find((result) => !result.ok);
  if (liveCount === treasuryResults.length) {
    return staleCount
      ? `treasury ${liveCount}/${treasuryResults.length} live · ${staleCount} stale`
      : `treasury ${liveCount}/${treasuryResults.length} live`;
  }
  if (liveCount > 0) {
    return `treasury partial ${liveCount}/${treasuryResults.length}: ${failed?.reason || "unknown"}`;
  }
  return `treasury error: ${failed?.reason || "unavailable"}`;
}

function buildFeedHealth(fredResults, treasuryResults, cnnBundle, ahrSeries) {
  const fredLive = fredResults.filter((result) => result.ok).length;
  const fredStale = fredResults.filter((result) => result.ok && result.series?.cacheStatus === "STALE").length;
  const fredFailed = fredResults.find((result) => !result.ok);
  const fredState = !fredResults.length ? "ok" : fredLive === fredResults.length && !fredStale ? "ok" : fredLive > 0 ? "warning" : "error";
  const treasuryLive = treasuryResults.filter((result) => result.ok).length;
  const treasuryStale = treasuryResults.filter((result) => result.ok && result.series?.cacheStatus === "STALE").length;
  const treasuryFailed = treasuryResults.find((result) => !result.ok);
  const treasuryState = treasuryLive === treasuryResults.length && !treasuryStale ? "ok" : treasuryLive > 0 ? "warning" : "error";
  const cnnState = cnnBundle.ok ? (cnnBundle.cacheStatus === "STALE" ? "warning" : "ok") : "error";
  const ahrState = ahrSeries?.source === "live" ? (ahrSeries.cacheStatus === "STALE" ? "warning" : "ok") : "error";

  return {
    treasury: {
      state: treasuryState,
      label: "Treasury",
      detail: treasuryState === "ok" ? `${treasuryLive}/${treasuryResults.length} live` : treasuryStale ? `${treasuryStale} stale cache` : treasuryFailed?.reason || "unavailable",
    },
    fred: {
      state: fredState,
      label: "FRED",
      detail: fredState === "ok" ? `${fredLive}/${fredResults.length} live` : fredStale ? `${fredStale} stale cache` : fredFailed?.reason || "unavailable",
    },
    cnn: {
      state: cnnState,
      label: "CNN",
      detail: cnnBundle.ok ? formatCacheStatus(cnnBundle.cacheStatus) : cnnBundle.reason,
    },
    ahr: {
      state: ahrState,
      label: "AHR999",
      detail: ahrSeries?.source === "live" ? formatCacheStatus(ahrSeries.cacheStatus || "live") : ahrSeries?.latestMeta?.proxyError || "unavailable",
    },
  };
}

function buildCnnSeries(def, bundle) {
  if (!bundle.ok || !bundle.payload) {
    return makeEmptySeries(def);
  }

  const payload = bundle.payload;
  const current = payload[def.live.key] || null;
  const historyRoot = def.live.historyKey ? payload[def.live.historyKey] : payload[`${def.live.key}_historical`] || current?.historical || current;
  const historyData = extractHistory(historyRoot);
  const currentValue = extractValue(current);
  const rating = extractRating(current);
  const updatedAt = historyData[historyData.length - 1]?.date || normalizeExternalDate(current?.timestamp || current?.lastUpdated) || todayIso();
  const data = historyData.length
    ? historyData
    : Number.isFinite(currentValue)
      ? [{ date: updatedAt, value: currentValue }]
      : [];

  if (!data.length) {
    return makeEmptySeries(def);
  }

  return {
    ...def,
    source: "live",
    data,
    updatedAt,
    latestMeta: {
      rating,
      raw: current,
    },
  };
}

function buildDerivedSeries(seriesMap) {
  const t5yie = seriesMap.get("t5yie");
  const t5yifr = seriesMap.get("t5yifr");
  const umich5 = seriesMap.get("umich5");
  const cnnFear = seriesMap.get("cnn_fear");
  const ahr999 = seriesMap.get("ahr999");

  seriesMap.set("survey_gap", buildPairedDerived({
    id: "survey_gap",
    symbol: "SURV-GAP",
    name: "Survey - 5Y Breakeven",
    unit: "pp",
    decimals: 2,
    note: "Positive means survey expectations run hotter than market pricing.",
    page: "macro",
  }, t5yie, umich5, (market, survey) => survey - market));

  seriesMap.set("anchor_gap", buildPairedDerived({
    id: "anchor_gap",
    symbol: "ANCH-GAP",
    name: "T5YIE - T5YIFR",
    unit: "bp",
    decimals: 0,
    note: "Front end versus long-end anchor.",
    page: "macro",
  }, t5yie, t5yifr, (front, anchor) => (front - anchor) * 100));

  seriesMap.set("drift_1m", buildLookbackDerived({
    id: "drift_1m",
    symbol: "DRIFT1M",
    name: "T5YIE 1M Change",
    unit: "bp",
    decimals: 0,
    note: "One-month drift in breakeven.",
    page: "macro",
  }, t5yie, 21, (now, prev) => (now - prev) * 100));

  seriesMap.set("panic_blend", buildPairedDerived({
    id: "panic_blend",
    symbol: "PANIC-X",
    name: "Composite Panic Blend",
    unit: "index",
    decimals: 0,
    note: "Blends equity fear and BTC coldness.",
    page: "fear",
  }, cnnFear, ahr999, (fear, ahr) => (100 - fear) * 0.6 + clamp((1.2 - ahr) / 1.2, 0, 1) * 100 * 0.4));
}

function buildPairedDerived(def, left, right, combiner) {
  if (!left?.data?.length || !right?.data?.length) {
    return makeEmptySeries(def);
  }
  const rightByDate = new Map(right.data.map((point) => [point.date, point.value]));
  const data = left.data
    .filter((point) => rightByDate.has(point.date))
    .map((point) => ({ date: point.date, value: combiner(point.value, rightByDate.get(point.date)) }))
    .filter((point) => Number.isFinite(point.value));

  return data.length
    ? { ...def, source: inferSource([left.source, right.source]), data, updatedAt: data[data.length - 1].date }
    : makeEmptySeries(def);
}

function buildLookbackDerived(def, base, lookback, combiner) {
  if (!base?.data?.length) {
    return makeEmptySeries(def);
  }
  const data = base.data
    .map((point, index, array) => {
      if (index < lookback) {
        return null;
      }
      return { date: point.date, value: combiner(point.value, array[index - lookback].value) };
    })
    .filter(Boolean);

  return data.length
    ? { ...def, source: base.source, data, updatedAt: data[data.length - 1].date }
    : makeEmptySeries(def);
}

function makeEmptySeries(def) {
  return { ...def, source: "empty", data: [], updatedAt: "", latestMeta: null };
}

function inferSource(sources) {
  return sources.every((source) => source === "live") ? "live" : "empty";
}

function render() {
  renderFlyoutState();
  renderTabs();
  renderDailyDiagnostics();
  renderColumns();
  updateMacroSummary();
  updateFearSummary();
  renderRangeButtons();
  renderChart();
}

function renderFlyoutState() {
  refs.flyout.setAttribute("aria-hidden", String(!state.isOpen));
  refs.backdrop.hidden = !state.isOpen;
}

function renderTabs() {
  refs.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.page === state.activePage));
  refs.panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.pagePanel === state.activePage));
}

function renderColumns() {
  renderColumnGroup(refs.macroGrid, MACRO_COLUMNS);
  renderColumnGroup(refs.fearGrid, FEAR_COLUMNS);
}

function renderColumnGroup(container, columns) {
  container.innerHTML = "";
  for (const column of columns) {
    const seriesList = column.items.map((id) => getSeries(id)).filter(Boolean);
    const liveCount = seriesList.filter((series) => series.source === "live").length;
    const emptyCount = seriesList.filter((series) => series.source === "empty").length;
    const card = document.createElement("section");
    card.className = "metric-column";
    card.innerHTML = `
      <div class="column-head">
        <div class="column-title-line">
          <h3 class="column-title">${column.title}</h3>
          <span class="source-pill ${liveCount ? "live" : "empty"}">${liveCount ? `${liveCount} live` : `${emptyCount} no data`}</span>
        </div>
        <p class="column-subtitle">${column.subtitle}</p>
      </div>
      <div class="metric-list"></div>
    `;
    const list = card.querySelector(".metric-list");
    seriesList.forEach((series) => list.appendChild(renderMetricRow(series)));
    container.appendChild(card);
  }
}

function renderMetricRow(series) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "metric-row";
  if (series.id === state.selectedId) {
    row.classList.add("is-selected");
  }
  const latest = getLatestValue(series);
  const delta = getRangeDelta(series, "30D");
  const rating = getSeriesRating(series);
  const ratingHtml = rating
    ? `<span class="rating-pill ${fearRatingClass(rating)}">${escapeHtml(rating)}</span>`
    : "";
  row.innerHTML = `
    <div class="metric-main">
      <div class="metric-symbol-line">
        <span class="metric-symbol">${series.symbol}</span>
        <span class="source-pill ${series.source}">${getSourcePill(series)}</span>
        ${ratingHtml}
      </div>
      <div class="metric-meta-line">
        <span class="metric-name">${series.name}</span>
      </div>
      <div class="metric-meta-line">
        <span class="metric-note">${series.note}</span>
      </div>
    </div>
    <div class="metric-side">
      <div class="metric-value-line">
        <span class="metric-value">${formatValue(series, latest)}</span>
      </div>
      <div class="metric-value-line">
        <span class="metric-delta ${classifyDelta(series, delta)}">${formatDelta(series, delta)}</span>
      </div>
    </div>
  `;
  row.addEventListener("click", () => {
    state.selectedId = series.id;
    state.activePage = series.page;
    render();
    startChartAnimation();
  });
  return row;
}
function updateMacroSummary() {
  const t5yie = getSeries("t5yie");
  const t5yifr = getSeries("t5yifr");
  const umich5 = getSeries("umich5");
  const t5yieValue = getLatestValue(t5yie);
  const t5yifrValue = getLatestValue(t5yifr);
  const umich5Value = getLatestValue(umich5);

  refs.anchorSummary.textContent = `5Y breakeven ${formatValue(t5yie, t5yieValue)} · 5Y5Y ${formatValue(t5yifr, t5yifrValue)}`;
  let readText = "Market still reads this as conditional rather than permanent re-inflation.";
  const baseText = getHeroBaseCaseText();

  if (Number.isFinite(t5yieValue) && Number.isFinite(t5yifrValue) && t5yieValue >= 2.75 && t5yifrValue >= 2.6) {
    readText = "Both front-end and forward anchor are lifting. De-anchoring risk is moving higher.";
  } else if (Number.isFinite(t5yieValue) && t5yieValue >= 2.7) {
    readText = "5Y breakeven is pressing higher. Watch whether the move broadens into the forward anchor.";
  } else if (Number.isFinite(umich5Value) && Number.isFinite(t5yieValue) && umich5Value - t5yieValue > 0.5) {
    readText = "Surveys are hotter than market pricing. For now, the market still treats this as conditional.";
  }

  refs.readSummary.textContent = readText;
  const firstRead = getHeroFirstRead();
  refs.heroBaseCase.textContent = firstRead.title || baseText;
  if (refs.heroFirstReadNote) {
    refs.heroFirstReadNote.textContent = firstRead.subtitle || "Run daily Macro task for a live summary.";
  }
}

function getHeroFirstRead() {
  const dashboard = state.dailyDashboard?.data || {};
  if (state.dailyDashboard?.status === "ready" && dashboard.firstRead) {
    return {
      title: dashboard.firstRead.title || getHeroBaseCaseText(),
      subtitle: dashboard.firstRead.subtitle || dashboard.firstRead.summary || dashboard.reportSummary || "",
    };
  }
  if (state.dailyDashboard?.status === "ready") {
    return {
      title: getHeroBaseCaseText(),
      subtitle: dashboard.reportSummary || "",
    };
  }
  if (state.dailyDashboard?.status === "missing") {
    return {
      title: "Run daily Macro task",
      subtitle: "今日数据和研报尚未生成。",
    };
  }
  return {
    title: "Shock rarity before asset choice",
    subtitle: "Run daily Macro task for a live summary.",
  };
}

function getHeroBaseCaseText() {
  const action = state.dailyDashboard?.data?.durationAction;
  if (state.dailyDashboard?.status === "ready" && action?.label) {
    return action.label;
  }
  if (state.dailyDashboard?.status === "missing") {
    return "Run daily Macro task";
  }
  return "Shock rarity before asset choice";
}

function updateFearSummary() {
  const fear = getSeries("cnn_fear");
  const ahr = getSeries("ahr999");
  const value = getLatestValue(fear);
  const rating = getSeriesRating(fear);
  refs.fearSummary.textContent = `CNN Fear & Greed ${formatValue(fear, value)}`;
  refs.fearReading.textContent = rating || "No data";
  const cnnText = fear.source === "live" ? `CNN proxy ${cnnBundleLabel(state.networkStatus.cnn)}` : state.networkStatus.cnn;
  const ahrText = ahr?.source === "live" ? `AHR proxy ${cnnBundleLabel(state.networkStatus.ahr)}` : state.networkStatus.ahr;
  const ahrHistory = ahr?.latestMeta?.historyPoints ? ` · AHR ${ahr.latestMeta.historyPoints} pts` : "";
  refs.fearSourceNote.textContent = `${cnnText} · ${ahrText}${ahrHistory}`;
  renderFearSentimentStrip(rating);
}

function renderFearSentimentStrip(activeRating) {
  if (!refs.fearSentimentStrip) {
    return;
  }
  const normalized = normalizeRating(activeRating);
  refs.fearSentimentStrip.innerHTML = getFearRatingScale()
    .map((item) => {
      const isActive = item.key === normalized;
      return `
        <div class="sentiment-step ${item.className} ${isActive ? "is-active" : ""}">
          <span class="sentiment-label">${item.label}</span>
          <span class="sentiment-range">${item.range}</span>
        </div>
      `;
    })
    .join("");
}

function renderRangeButtons() {
  refs.rangeSwitcher.querySelectorAll("[data-range]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.range === state.range);
  });
}

function renderChart(progress = 1) {
  const series = getSeries(state.selectedId);
  if (!series) {
    return;
  }

  const range = RANGE_CONFIG[state.range];
  const rangeView = getRangeView(series, range.days);
  const points = rangeView.points;
  const chartConfig = getChartConfig(series, range.days);
  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest && first ? latest.value - first.value : null;
  const rating = getSeriesRating(series);

  refs.chartSymbol.textContent = series.symbol;
  refs.chartName.textContent = series.name;
  refs.chartChange.textContent = formatDelta(series, delta);
  refs.chartChange.className = classifyDelta(series, delta);
  refs.chartContext.textContent = series.note;
  refs.chartMode.textContent = range.label;
  refs.chartUpdated.textContent = latest?.date ? formatDate(latest.date) : "无数据";
  refs.chartSource.textContent = getSourceLabel(series);
  refs.chartLegend.innerHTML = buildLegendHtml(chartConfig.legend);
  refs.chartNote.textContent = getChartNote(series.id);
  refs.lockedFlag.hidden = true;

  let ratingNode = refs.chartName.nextElementSibling;
  if (!ratingNode || !ratingNode.classList.contains("rating-pill")) {
    ratingNode = document.createElement("span");
    ratingNode.className = "rating-pill";
    refs.chartName.insertAdjacentElement("afterend", ratingNode);
  }
  if (rating) {
    ratingNode.hidden = false;
    ratingNode.textContent = rating;
    ratingNode.className = `rating-pill ${fearRatingClass(rating)}`;
  } else {
    ratingNode.hidden = true;
  }

  drawChart(points, series, rangeView, chartConfig, progress);
}

function startChartAnimation() {
  if (state.chartAnimationFrame) {
    cancelAnimationFrame(state.chartAnimationFrame);
  }
  state.hoverIndex = null;
  refs.chartTooltip.hidden = true;
  state.chartAnimationStartedAt = performance.now();
  const step = (now) => {
    const progress = clamp((now - state.chartAnimationStartedAt) / 850, 0, 1);
    renderChart(progress);
    if (progress < 1) {
      state.chartAnimationFrame = requestAnimationFrame(step);
    } else {
      state.chartAnimationFrame = null;
    }
  };
  state.chartAnimationFrame = requestAnimationFrame(step);
}

function drawChart(points, series, rangeView, chartConfig, progress = 1) {
  const canvas = refs.chartCanvas;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const padding = { top: 20, right: 18, bottom: 28, left: 18 };
  const plotWidth = rect.width - padding.left - padding.right;
  const plotHeight = rect.height - padding.top - padding.bottom;
  const sentimentBands = chartConfig.showFearBands ? getFearBands() : null;

  if (!points.length) {
    if (sentimentBands) {
      drawFearBands(ctx, rect.width, padding, (value) => padding.top + (1 - value / 100) * plotHeight, sentimentBands, plotHeight);
    }
    drawAxes(ctx, rect.width, rect.height, padding, sentimentBands ? 0 : 0, sentimentBands ? 100 : 1, series, rangeView);
    ctx.fillStyle = "#7d90a5";
    ctx.font = '14px "IBM Plex Mono"';
    ctx.fillText("无数据", 24, 42);
    canvas._plot = null;
    return;
  }

  const values = points.map((point) => point.value);
  chartConfig.overlays.forEach((overlay) => {
    overlay.points.forEach((point) => values.push(point.value));
  });
  let minValue = sentimentBands ? 0 : Math.min(...values);
  let maxValue = sentimentBands ? 100 : Math.max(...values);
  if (!sentimentBands && minValue === maxValue) {
    minValue -= Math.abs(minValue || 1) * 0.05;
    maxValue += Math.abs(maxValue || 1) * 0.05;
  }
  if (!sentimentBands) {
    const pad = (maxValue - minValue || 1) * 0.08;
    minValue -= pad;
    maxValue += pad;
  }
  const yFor = (value) => padding.top + (1 - (value - minValue) / Math.max(maxValue - minValue, 1e-9)) * plotHeight;
  const xPositions = points.map((point) => {
    const time = new Date(point.date).getTime();
    const ratio = (time - rangeView.startTime) / Math.max(rangeView.endTime - rangeView.startTime, 1);
    return padding.left + clamp(ratio, 0, 1) * plotWidth;
  });

  if (sentimentBands) {
    drawFearBands(ctx, rect.width, padding, yFor, sentimentBands, plotHeight);
  }
  drawAxes(ctx, rect.width, rect.height, padding, minValue, maxValue, series, rangeView);
  const cutoffX = padding.left + plotWidth * progress;
  drawLine(ctx, points, xPositions, yFor, rect.height - padding.bottom, null, cutoffX);
  chartConfig.overlays.forEach((overlay) => {
    const overlayX = overlay.points.map((point) => {
      const time = new Date(point.date).getTime();
      const ratio = (time - rangeView.startTime) / Math.max(rangeView.endTime - rangeView.startTime, 1);
      return padding.left + clamp(ratio, 0, 1) * plotWidth;
    });
    drawLine(ctx, overlay.points, overlayX, yFor, rect.height - padding.bottom, overlay.color, cutoffX);
    overlay.xPositions = overlayX;
  });

  if (state.hoverIndex != null && points[state.hoverIndex]) {
    const point = points[state.hoverIndex];
    const x = xPositions[state.hoverIndex];
    const y = yFor(point.value);
    ctx.strokeStyle = "rgba(173, 216, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, rect.height - padding.bottom);
    ctx.stroke();
    ctx.fillStyle = "#7fd1ff";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  canvas._plot = { xPositions, points, yFor, bounds: rect, series, chartConfig };
}

function drawFearBands(ctx, width, padding, yFor, bands, plotHeight) {
  bands.forEach((band) => {
    const top = yFor(band.max);
    const bottom = yFor(band.min);
    ctx.fillStyle = band.color;
    ctx.fillRect(padding.left, top, width - padding.left - padding.right, bottom - top);
    ctx.fillStyle = band.labelColor;
    ctx.font = '12px "IBM Plex Mono"';
    const labelWidth = ctx.measureText(band.label).width;
    ctx.fillText(band.label, width - padding.right - labelWidth - 8, Math.min(top + 18, padding.top + plotHeight - 10));
  });
}

function drawAxes(ctx, width, height, padding, minValue, maxValue, series, rangeView) {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = "#7d90a5";
  ctx.font = '11px "IBM Plex Mono"';
  ctx.fillText(formatValue(series, maxValue), padding.left + 8, padding.top + 12);
  ctx.fillText(formatValue(series, minValue), padding.left + 8, height - padding.bottom - 8);

  const startLabel = formatAxisDate(rangeView.startTime);
  const endLabel = formatAxisDate(rangeView.endTime);
  ctx.fillText(startLabel, padding.left, height - 8);
  const endWidth = ctx.measureText(endLabel).width;
  ctx.fillText(endLabel, width - padding.right - endWidth, height - 8);
}

function drawLine(ctx, points, xPositions, yFor, baseline, strokeColor, cutoffX = Number.POSITIVE_INFINITY) {
  if (points.length === 1) {
    const x = xPositions[0];
    if (x > cutoffX) {
      return;
    }
    const y = yFor(points[0].value);
    ctx.fillStyle = "#7fd1ff";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const firstX = xPositions[0] ?? 0;
  const lastX = xPositions[xPositions.length - 1] ?? cutoffX;
  if (cutoffX < firstX) {
    return;
  }
  const clipRight = Math.min(cutoffX, lastX);
  ctx.save();
  ctx.beginPath();
  ctx.rect(firstX - 4, 0, Math.max(clipRight - firstX + 8, 0), baseline + 8);
  ctx.clip();

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xPositions[index];
    const y = yFor(point.value);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  const stroke = strokeColor || ctx.createLinearGradient(0, 0, 0, baseline);
  if (!strokeColor) {
    stroke.addColorStop(0, "rgba(127, 209, 255, 0.95)");
    stroke.addColorStop(1, "rgba(127, 209, 255, 0.18)");
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  if (strokeColor) {
    ctx.restore();
    return;
  }

  const fillPath = new Path2D();
  points.forEach((point, index) => {
    const x = xPositions[index];
    const y = yFor(point.value);
    if (index === 0) {
      fillPath.moveTo(x, y);
    } else {
      fillPath.lineTo(x, y);
    }
  });
  fillPath.lineTo(xPositions[xPositions.length - 1], baseline);
  fillPath.lineTo(xPositions[0], baseline);
  fillPath.closePath();
  const fill = ctx.createLinearGradient(0, 0, 0, baseline);
  fill.addColorStop(0, "rgba(127, 209, 255, 0.18)");
  fill.addColorStop(1, "rgba(127, 209, 255, 0)");
  ctx.fillStyle = fill;
  ctx.fill(fillPath);
  ctx.restore();
}
function handleChartHover(event) {
  const plot = refs.chartCanvas._plot;
  if (!plot || !plot.points.length) {
    return;
  }
  const bounds = refs.chartCanvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  state.hoverIndex = nearestIndex(plot.xPositions, x);
  renderChart();
  const point = plot.points[state.hoverIndex];
  showTooltip(point, plot.series, plot.xPositions[state.hoverIndex], plot.yFor(point.value), bounds, plot.chartConfig);
}

function showTooltip(point, series, x, y, bounds, chartConfig) {
  const overlayLines = (chartConfig?.overlays || [])
    .map((overlay) => {
      const match = overlay.points.find((candidate) => candidate.date === point.date);
      return match
        ? `<div class="tooltip-date">${overlay.label}: ${formatValue(overlay.series, match.value)}</div>`
        : "";
    })
    .join("");
  refs.chartTooltip.hidden = false;
  refs.chartTooltip.innerHTML = `
    <div class="tooltip-label">${series.symbol}</div>
    <div class="tooltip-value">${formatValue(series, point.value)}</div>
    <div class="tooltip-date">${formatDate(point.date)}</div>
    ${overlayLines}
  `;
  positionChartTooltip(refs.chartTooltip, x, y, bounds);
}

function hideTooltip() {
  state.hoverIndex = null;
  refs.chartTooltip.hidden = true;
  renderChart();
}

function positionChartTooltip(tooltip, x, y, bounds, options = {}) {
  const rect = tooltip.getBoundingClientRect();
  const margin = 12;
  const gap = 14;
  const maxLeft = Math.max(margin, bounds.width - rect.width - margin);
  let left = x + gap;

  if (left + rect.width > bounds.width - margin) {
    left = x - rect.width - gap;
  }
  left = clamp(left, margin, maxLeft);

  let top = options.fixedTop ?? y - rect.height - gap;
  if (options.fixedTop === undefined && top < margin) {
    top = y + gap;
  }
  const maxTop = Math.max(margin, bounds.height - rect.height - margin);
  top = clamp(top, margin, maxTop);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function renderHomeControls() {
  refs.homeRangeSwitcher.querySelectorAll("[data-home-range]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.homeRange === homeYieldState.range);
  });
  refs.homeSeriesSwitcher.querySelectorAll("[data-home-series]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.homeSeries === homeYieldState.selectedSeries);
  });
  refs.homeAxisSwitcher.querySelectorAll("[data-home-axis]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.homeAxis === homeYieldState.axisMode);
  });
  refs.homeAxisSwitcher.classList.toggle("is-hidden", homeYieldState.selectedSeries !== "all");
}

function renderHomeYieldLegend() {
  const seriesItems = getVisibleHomeYieldSeries();
  refs.homeYieldLegend.innerHTML = buildLegendHtml(
    seriesItems.map((series) => ({
      color: series.color,
      label: formatHomeYieldLegendLabel(series),
    })),
  );
  refs.homeYieldFooter.textContent = homeYieldState.message;
}

function getVisibleHomeYieldSeries() {
  const source = homeYieldState.series.length
    ? homeYieldState.series
    : HOME_YIELD_DEFS.map((def) => ({ ...def, data: [] }));
  if (homeYieldState.selectedSeries === "all") {
    return source;
  }
  return source.filter((series) => series.id === homeYieldState.selectedSeries);
}

function getEffectiveHomeAxisMode() {
  return homeYieldState.selectedSeries === "all" ? homeYieldState.axisMode : "absolute";
}

function isHomeYieldNormalized() {
  return getEffectiveHomeAxisMode() === "normalized";
}

function formatHomeYieldLegendLabel(series) {
  if (!series.data?.length) {
    return series.symbol;
  }
  if (!isHomeYieldNormalized()) {
    return `${series.symbol} ${formatValue(series, getLatestValue(series))}`;
  }
  const points = getHomeYieldWindowPoints(series);
  const first = points[0]?.value;
  const last = points[points.length - 1]?.value;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) {
    return series.symbol;
  }
  const relativeChange = (last / first - 1) * 100;
  return `${series.symbol} ${formatSignedPercent(relativeChange)}`;
}

function formatHomePlotValue(series, point) {
  if (!point) {
    return "无数据";
  }
  if (!isHomeYieldNormalized()) {
    return formatValue(series, point.value);
  }
  return `${point.value.toFixed(1)} · ${formatValue(series, point.rawValue)}`;
}

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) {
    return "无数据";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function getHomeYieldWindowPoints(series) {
  const rangeView = getHomeYieldRangeView();
  return (series.data || []).filter((point) => {
    const time = new Date(point.date).getTime();
    return time >= rangeView.startTime && time <= rangeView.endTime;
  });
}

function startHomeYieldAnimation() {
  if (homeYieldState.animationFrame) {
    cancelAnimationFrame(homeYieldState.animationFrame);
  }
  homeYieldState.animationStartedAt = performance.now();
  const step = (now) => {
    const progress = clamp((now - homeYieldState.animationStartedAt) / 850, 0, 1);
    drawHomeYieldChart(progress);
    if (progress < 1) {
      homeYieldState.animationFrame = requestAnimationFrame(step);
    } else {
      homeYieldState.animationFrame = null;
    }
  };
  homeYieldState.animationFrame = requestAnimationFrame(step);
}

function drawHomeYieldChart(progress = 1) {
  const canvas = refs.homeYieldCanvas;
  if (!canvas) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const padding = { top: 22, right: 24, bottom: 34, left: 38 };
  const plotWidth = rect.width - padding.left - padding.right;
  const plotHeight = rect.height - padding.top - padding.bottom;
  const rangeView = getHomeYieldRangeView();
  const axisMode = getEffectiveHomeAxisMode();
  const normalized = axisMode === "normalized";
  const seriesViews = getVisibleHomeYieldSeries().map((series) => {
    const rawPoints = (series.data || []).filter((point) => {
      const time = new Date(point.date).getTime();
      return time >= rangeView.startTime && time <= rangeView.endTime;
    });
    const baseValue = rawPoints.find((point) => Number.isFinite(point.value) && point.value !== 0)?.value;
    const points = normalized && Number.isFinite(baseValue)
      ? rawPoints.map((point) => ({ ...point, rawValue: point.value, value: (point.value / baseValue) * 100 }))
      : rawPoints.map((point) => ({ ...point, rawValue: point.value }));
    return { series, points, rawPoints, baseValue };
  });
  const allValues = seriesViews.flatMap((view) => view.points.map((point) => point.value));

  if (!allValues.length) {
    drawHomeYieldAxes(ctx, rect.width, rect.height, padding, 0, 1, rangeView, axisMode);
    ctx.fillStyle = "#7d90a5";
    ctx.font = '14px "IBM Plex Mono"';
    ctx.fillText(homeYieldState.status === "loading" ? "Loading..." : "No data", padding.left, padding.top + 18);
    refs.homeYieldFooter.textContent = homeYieldState.message;
    canvas._homePlot = null;
    return;
  }

  let minValue = Math.min(...allValues);
  let maxValue = Math.max(...allValues);
  if (minValue === maxValue) {
    minValue -= Math.abs(minValue || 1) * 0.05;
    maxValue += Math.abs(maxValue || 1) * 0.05;
  }
  const pad = (maxValue - minValue || 1) * 0.1;
  minValue -= pad;
  maxValue += pad;

  const yFor = (value) => padding.top + (1 - (value - minValue) / Math.max(maxValue - minValue, 1e-9)) * plotHeight;
  const xFor = (date) => {
    const time = new Date(date).getTime();
    const ratio = (time - rangeView.startTime) / Math.max(rangeView.endTime - rangeView.startTime, 1);
    return padding.left + clamp(ratio, 0, 1) * plotWidth;
  };

  drawHomeYieldAxes(ctx, rect.width, rect.height, padding, minValue, maxValue, rangeView, axisMode);
  if (normalized) {
    ctx.fillStyle = "rgba(184, 204, 225, 0.7)";
    ctx.font = '11px "IBM Plex Mono"';
    ctx.fillText("start = 100", rect.width - padding.right - 84, padding.top + 13);
  }
  const cutoffX = padding.left + plotWidth * progress;
  const plotRecords = [];

  seriesViews.forEach((view) => {
    const xPositions = view.points.map((point) => xFor(point.date));
    drawHomeYieldLine(ctx, view.points, xPositions, yFor, view.series.color, cutoffX);
    view.points.forEach((point, index) => {
      plotRecords.push({ date: point.date, x: xPositions[index] });
    });
  });

  if (homeYieldState.hoverDate) {
    const markerX = xFor(homeYieldState.hoverDate);
    ctx.strokeStyle = "rgba(173, 216, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(markerX, padding.top);
    ctx.lineTo(markerX, rect.height - padding.bottom);
    ctx.stroke();
  }

  refs.homeYieldFooter.textContent = homeYieldState.message;
  canvas._homePlot = {
    bounds: rect,
    rangeView,
    seriesViews,
    records: collapsePlotRecords(plotRecords),
    xFor,
    yFor,
  };
}

function drawHomeYieldAxes(ctx, width, height, padding, minValue, maxValue, rangeView, axisMode = "absolute") {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = "#7d90a5";
  ctx.font = '11px "IBM Plex Mono"';
  const yFormatter = axisMode === "normalized"
    ? (value) => value.toFixed(1)
    : (value) => `${value.toFixed(2)}%`;
  ctx.fillText(yFormatter(maxValue), padding.left + 8, padding.top + 13);
  ctx.fillText(yFormatter(minValue), padding.left + 8, height - padding.bottom - 8);

  const startLabel = formatAxisDate(rangeView.startTime);
  const endLabel = formatAxisDate(rangeView.endTime);
  ctx.fillText(startLabel, padding.left, height - 10);
  const endWidth = ctx.measureText(endLabel).width;
  ctx.fillText(endLabel, width - padding.right - endWidth, height - 10);
}

function drawHomeYieldLine(ctx, points, xPositions, yFor, color, cutoffX) {
  if (!points.length) {
    return;
  }
  if (points.length === 1) {
    const x = xPositions[0];
    if (x <= cutoffX) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, yFor(points[0].value), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  ctx.beginPath();
  let hasSegment = false;
  points.forEach((point, index) => {
    const x = xPositions[index];
    const y = yFor(point.value);
    if (index === 0) {
      if (x <= cutoffX) {
        ctx.moveTo(x, y);
        hasSegment = true;
      }
      return;
    }

    const previousX = xPositions[index - 1];
    const previousY = yFor(points[index - 1].value);
    if (previousX <= cutoffX && !hasSegment) {
      ctx.moveTo(previousX, previousY);
      hasSegment = true;
    }
    if (x <= cutoffX) {
      ctx.lineTo(x, y);
      return;
    }
    if (previousX < cutoffX && x > cutoffX) {
      const ratio = (cutoffX - previousX) / Math.max(x - previousX, 1e-9);
      ctx.lineTo(cutoffX, previousY + (y - previousY) * ratio);
    }
  });

  if (!hasSegment) {
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function handleHomeYieldHover(event) {
  const plot = refs.homeYieldCanvas._homePlot;
  if (!plot || !plot.records.length) {
    return;
  }
  const bounds = refs.homeYieldCanvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const index = nearestIndex(
    plot.records.map((record) => record.x),
    x,
  );
  const record = plot.records[index];
  homeYieldState.hoverDate = record.date;
  drawHomeYieldChart(1);
  showHomeYieldTooltip(record.date, record.x, bounds, plot);
}

function showHomeYieldTooltip(date, x, bounds, plot) {
  const rows = plot.seriesViews
    .map((view) => {
      const point = findNearestDatePoint(view.points, date);
      return point
        ? `<div class="tooltip-value tooltip-value-row"><span style="color:${view.series.color}">${view.series.symbol}</span>: ${formatHomePlotValue(view.series, point)}</div>`
        : "";
    })
    .join("");
  refs.homeYieldTooltip.hidden = false;
  refs.homeYieldTooltip.innerHTML = `
    <div class="tooltip-label">${isHomeYieldNormalized() ? "Treasury Yield · start=100" : "Treasury Yield"}</div>
    ${rows}
    <div class="tooltip-date">${formatDate(date)}</div>
  `;
  positionChartTooltip(refs.homeYieldTooltip, x, 16, bounds, { fixedTop: 16 });
}

function hideHomeYieldTooltip() {
  homeYieldState.hoverDate = null;
  refs.homeYieldTooltip.hidden = true;
  drawHomeYieldChart(1);
}

function getHomeYieldRangeView() {
  const range = RANGE_CONFIG[homeYieldState.range] || RANGE_CONFIG["6M"];
  const latest = getLatestHomeYieldDate();
  const endTime = latest ? new Date(latest).getTime() : Date.now();
  const startTime = endTime - range.days * 24 * 60 * 60 * 1000;
  return { startTime, endTime };
}

function getLatestHomeYieldDate() {
  const dates = homeYieldState.series
    .map((series) => series.data?.[series.data.length - 1]?.date)
    .filter(Boolean)
    .sort();
  return dates[dates.length - 1] || null;
}

function collapsePlotRecords(records) {
  const byDate = new Map();
  records.forEach((record) => {
    if (!byDate.has(record.date)) {
      byDate.set(record.date, record);
    }
  });
  return Array.from(byDate.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function findNearestDatePoint(points, date) {
  if (!points.length) {
    return null;
  }
  const target = new Date(date).getTime();
  return points.reduce((winner, point) => {
    const distance = Math.abs(new Date(point.date).getTime() - target);
    const bestDistance = Math.abs(new Date(winner.date).getTime() - target);
    return distance < bestDistance ? point : winner;
  }, points[0]);
}

function getSeries(id) {
  return state.seriesMap.get(id) || null;
}

function getLatestValue(series) {
  return series?.data?.length ? series.data[series.data.length - 1].value : null;
}

function getRangeView(series, days) {
  const endTime = series?.data?.length ? new Date(series.data[series.data.length - 1].date).getTime() : Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;
  const points = (series?.data || []).filter((point) => new Date(point.date).getTime() >= startTime);
  return { points, startTime, endTime };
}

function getRangeDelta(series, rangeKey) {
  const points = getRangeView(series, RANGE_CONFIG[rangeKey].days).points;
  if (points.length < 2) {
    return null;
  }
  return points[points.length - 1].value - points[0].value;
}

function formatValue(series, value) {
  if (!Number.isFinite(value)) {
    return "无数据";
  }
  const decimals = getDisplayDecimals(series, value);
  if (series?.unit === "bp") {
    return `${Math.round(value)}bp`;
  }
  if (series?.unit === "index") {
    return `${value.toFixed(decimals)}`;
  }
  if (series?.unit === "ratio") {
    return `${value.toFixed(decimals)}`;
  }
  if (series?.unit === "number") {
    return `${value.toFixed(decimals)}`;
  }
  if (series?.unit === "pp") {
    return `${value.toFixed(decimals)}pp`;
  }
  return `${value.toFixed(decimals)}%`;
}

function formatDelta(series, value) {
  if (!Number.isFinite(value)) {
    return "无数据";
  }
  const sign = value > 0 ? "+" : "";
  const decimals = getDisplayDecimals(series, value, { delta: true });
  if (series?.unit === "bp") {
    return `${sign}${Math.round(value)}bp`;
  }
  if (series?.unit === "index") {
    return `${sign}${value.toFixed(decimals)}`;
  }
  if (series?.unit === "ratio") {
    return `${sign}${value.toFixed(decimals)}`;
  }
  if (series?.unit === "number") {
    return `${sign}${value.toFixed(decimals)}`;
  }
  if (series?.unit === "pp") {
    return `${sign}${value.toFixed(decimals)}pp`;
  }
  return `${sign}${Math.round(value * 100)}bp`;
}

function getDisplayDecimals(series, value, options = {}) {
  const base = series?.decimals ?? 2;
  if (series?.unit === "bp") {
    return 0;
  }
  if (!series?.data?.length) {
    return base;
  }

  const maxDecimals = getMaxDisplayDecimals(series);
  if (maxDecimals <= base) {
    return base;
  }

  const sample = series.data.slice(-260).map((point) => point.value).filter(Number.isFinite);
  if (Number.isFinite(value)) {
    sample.push(Math.abs(value));
  }

  const rawPrecision = Math.max(0, ...sample.map((item) => decimalPlaces(item, 6)));
  const nonZeroDeltas = [];
  for (let index = 1; index < sample.length; index += 1) {
    const delta = Math.abs(sample[index] - sample[index - 1]);
    if (delta > 0 && Number.isFinite(delta)) {
      nonZeroDeltas.push(delta);
    }
  }
  const minDelta = nonZeroDeltas.length ? Math.min(...nonZeroDeltas) : null;
  const deltaPrecision = minDelta ? clamp(Math.ceil(-Math.log10(minDelta)) + 1, base, maxDecimals) : base;
  const inferred = clamp(Math.max(base, rawPrecision, deltaPrecision), base, maxDecimals);

  if (!options.delta) {
    return inferred;
  }
  return clamp(Math.max(inferred, decimalPlaces(value, 6)), base, maxDecimals);
}

function getMaxDisplayDecimals(series) {
  if (series?.unit === "pct" && series?.live?.type === "fred") {
    return series.decimals ?? 2;
  }
  if (series?.id === "cnn_fear" || series?.id === "panic_blend") {
    return 1;
  }
  if (series?.unit === "ratio" || series?.unit === "number") {
    return 4;
  }
  if (series?.unit === "index" && series?.live?.type === "cnn") {
    return 2;
  }
  if (series?.unit === "pct" || series?.unit === "pp") {
    return 3;
  }
  return series?.decimals ?? 2;
}

function decimalPlaces(value, cap = 6) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const text = Math.abs(value).toFixed(cap).replace(/0+$/, "");
  const dotIndex = text.indexOf(".");
  return dotIndex >= 0 ? text.length - dotIndex - 1 : 0;
}

function classifyDelta(series, value) {
  if (!Number.isFinite(value)) {
    return "flat";
  }
  const thresholdMap = { bp: 1, pct: 0.02, pp: 0.02, index: 1, ratio: 0.01, number: 0.01 };
  const threshold = thresholdMap[series?.unit] ?? 0.02;
  if (value > threshold) {
    return "positive";
  }
  if (value < -threshold) {
    return "negative";
  }
  return "flat";
}

function getSourcePill(series) {
  if (series.source === "live") {
    return "live";
  }
  return series.live ? "error" : "not wired";
}

function getSourceLabel(series) {
  if (series.source !== "live") {
    return "无数据";
  }
  if (series.live?.type === "fred") {
    return "FRED public CSV";
  }
  if (series.live?.type === "treasury") {
    return "U.S. Treasury daily curve";
  }
  if (series.live?.type === "cnn") {
    return "CNN graphdata endpoint";
  }
  if (series.live?.type === "ahr") {
    return "FRED CBBTCUSD derived AHR999";
  }
  return "Live feed";
}

function formatCacheStatus(value) {
  const status = String(value || "").toUpperCase();
  const labels = {
    MISS: "fresh fetch",
    INCREMENTAL: "incremental",
    HIT: "memory cache",
    DISK: "local cache",
    STALE: "stale cache",
    BYPASS: "bypass",
  };
  return labels[status] || String(value || "unknown").toLowerCase();
}

function getChartConfig(series, days) {
  const overlays = [];
  if (series.id === "market_momentum_sp500") {
    const ma = getSeries("market_momentum_sp125");
    overlays.push({
      series: ma,
      label: "125-day MA",
      color: "#ff8a1c",
      points: getRangeView(ma, days).points,
    });
  }
  if (series.id === "market_volatility_vix") {
    const ma = getSeries("market_volatility_vix_50");
    overlays.push({
      series: ma,
      label: "50-day MA",
      color: "#ff8a1c",
      points: getRangeView(ma, days).points,
    });
  }
  return {
    showFearBands: series.id === "cnn_fear",
    overlays: overlays.filter((overlay) => overlay.series?.data),
    legend: buildLegend(series, overlays),
  };
}

function buildLegend(series, overlays) {
  const legend = [{ label: series.name, color: "#1490e7" }];
  overlays.forEach((overlay) => legend.push({ label: overlay.label, color: overlay.color }));
  return legend;
}

function buildLegendHtml(items) {
  return items
    .map(
      (item) => `<div class="legend-item"><span class="legend-swatch" style="background:${item.color}"></span><span>${item.label}</span></div>`,
    )
    .join("");
}

function getChartNote(id) {
  const notes = {
    t5yie: "5Y breakeven = 5年名义美债收益率 - 5年TIPS实际收益率，代表市场对未来5年平均通胀补偿的定价。若持续上破约2.75%，说明通胀风险溢价开始重新抬升。",
    t10yie: "10Y breakeven 衡量未来10年平均通胀补偿，期限更长、受长期锚影响更大。若它和T5YIE同步上行，说明漂移不只停留在短端。",
    swap5y: "5Y inflation swap 是OTC市场交易的5年通胀互换固定腿，可和TIPS breakeven交叉验证。当前未接入实时源，主要保留为后续补充的市场定价口径。",
    t5yifr: "5Y5Y forward inflation 表示市场对5年后开始、再往后5年的通胀补偿定价。它比现货breakeven更接近长期通胀锚，若上行通常比T5YIE更值得警惕。",
    clev5y: "Cleveland 5Y expected inflation 是模型估计的中期通胀预期，用来剥离部分流动性和风险溢价噪音。当前未接入稳定免费源，仅作为待补充的模型口径。",
    anchor_gap: "T5YIE - T5YIFR 衡量近端通胀补偿相对长期锚的溢价，单位为bp。正值扩大多是短中期通胀冲击，若T5YIFR也跟涨，风险从条件冲击升级为锚松动。",
    umich1: "Michigan 1Y 是消费者对未来一年通胀的调查预期，通常最先反映油价、食品和 headline CPI 记忆。它上行但breakeven不动，说明市场暂未完全买单。",
    umich5: "Michigan 5Y 是家庭部门中期通胀预期，是观察预期是否脱锚的重要 survey 口径。若它抬升并传导到T5YIFR，说明市场开始承认长期锚风险。",
    nyfed3: "NY Fed 3Y survey 是家庭部门三年通胀预期，可作为Michigan数据的交叉验证。多个survey同向上行时，预期漂移信号比单一调查更可靠。",
    dgs5: "5年名义美债收益率是T5YIE的名义腿，反映政策利率路径、期限溢价和通胀补偿的合成结果。要和DFII5一起看，判断breakeven变化来自名义端还是实际端。",
    dfii5: "5年TIPS实际收益率是T5YIE的实际利率腿，近似市场对真实利率和TIPS风险溢价的定价。若T5YIE上行同时DFII5下行，通胀补偿抬升更明显。",
    dgs10: "10年名义美债收益率是长端贴现率核心锚，受增长、通胀、期限溢价和财政供给共同影响。若它与breakeven同涨，通常说明名义利率压力来自通胀补偿。",
    survey_gap: "Survey - 5Y breakeven 衡量家庭中期通胀预期相对市场定价的差值。正值扩大说明survey更热、市场仍克制；差值收窄可能是市场补涨或survey降温。",
    drift_1m: "T5YIE 1M Change 观察5年breakeven过去约21个交易日的变化，单位为bp。连续正漂移比单日跳动更重要，说明通胀补偿正在形成趋势。",
    cpi3m: "Sticky core CPI 3M annualized 衡量粘性核心通胀的短期年化动能。若它维持高位，会给survey和breakeven上行提供基本面支撑。",
    cnn_fear: "CNN Fear & Greed 把七个情绪子项合成为0-100总分。低分代表风险厌恶，高分代表追逐风险；极端读数更适合作为反向情绪温度计。",
    market_momentum_sp500: "Market Momentum 比较标普500与125日均线。指数高于均线说明趋势和风险偏好偏强，跌破均线则提示动能转弱。",
    market_volatility_vix: "VIX 衡量标普500期权隐含波动率，是市场为未来风险付费的价格。高于50日均线并继续上行，通常代表防御需求增强。",
    stock_price_strength: "Stock Price Strength 比较NYSE创新高和创新低股票数量。创新高占优说明内部结构健康，创新低扩散则提示风险偏好变脆。",
    stock_price_breadth: "Stock Price Breadth 观察上涨参与度是否广泛。若指数上涨但成交量或个股参与不足，行情更依赖少数权重股，持续性较弱。",
    put_call_options: "Put/Call ratio 衡量看跌期权相对看涨期权的需求。比率上升说明保护性仓位增加，通常对应更强的下行担忧。",
    junk_bond_demand: "Junk Bond Demand 反映高收益债相对投资级债的风险偏好。需求走弱或利差扩大，说明信用市场开始要求更高补偿。",
    safe_haven_demand: "Safe Haven Demand 比较股票与美国国债的相对表现。资金转向国债时，通常说明市场从追风险切换到保本金。",
    ahr999: "AHR999 用 BTC 价格相对200日简单均价和指数增长估值衡量冷热。读数越低越接近冷区，越高越接近过热区。",
  };
  return notes[id] || "该指标暂无专属说明。请优先查看其来源、单位和图中趋势，避免把单点波动误读成稳定信号。";
}

function extractHistory(root) {
  const array = Array.isArray(root?.data) ? root.data : Array.isArray(root) ? root : [];
  return array
    .map((point) => {
      const value = extractValue(point);
      const date = normalizeExternalDate(point.x ?? point.date ?? point.timestamp ?? point.time);
      return { date, value };
    })
    .filter((point) => point.date && Number.isFinite(point.value));
}

function extractValue(source) {
  if (source == null) {
    return null;
  }
  const candidates = [source.score, source.value, source.y, source.current, source.rawData];
  for (const candidate of candidates) {
    const value = Number.parseFloat(candidate);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function extractRating(source) {
  if (!source) {
    return "";
  }
  return source.rating || source.status || source.text || "";
}

function normalizeExternalDate(rawDate) {
  if (rawDate == null || rawDate === "") {
    return "";
  }
  if (typeof rawDate === "number") {
    return new Date(rawDate < 1e12 ? rawDate * 1000 : rawDate).toISOString().slice(0, 10);
  }
  if (/^\d+$/.test(String(rawDate))) {
    const numeric = Number.parseInt(rawDate, 10);
    return new Date(String(rawDate).length === 10 ? numeric * 1000 : numeric).toISOString().slice(0, 10);
  }
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function classifyFearRating(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (value < 25) {
    return "Extreme Fear";
  }
  if (value < 45) {
    return "Fear";
  }
  if (value <= 55) {
    return "Neutral";
  }
  if (value <= 75) {
    return "Greed";
  }
  return "Extreme Greed";
}

function fearRatingClass(rating) {
  const normalized = normalizeRating(rating);
  if (normalized === "extreme-greed") {
    return "extreme-greed";
  }
  if (normalized === "greed") {
    return "greed";
  }
  if (normalized === "neutral") {
    return "neutral";
  }
  if (normalized === "extreme-fear") {
    return "extreme-fear";
  }
  return "fear";
}

function getSeriesRating(series) {
  if (!series || series.source !== "live") {
    return "";
  }
  if (series.latestMeta?.rating) {
    return series.latestMeta.rating;
  }
  return series.id === "cnn_fear" ? classifyFearRating(getLatestValue(series)) : "";
}

function normalizeRating(rating) {
  const value = String(rating || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  if (value.includes("extreme-greed")) {
    return "extreme-greed";
  }
  if (value.includes("extreme-fear")) {
    return "extreme-fear";
  }
  if (value.includes("greed")) {
    return "greed";
  }
  if (value.includes("neutral")) {
    return "neutral";
  }
  if (value.includes("fear")) {
    return "fear";
  }
  return "";
}

function getFearRatingScale() {
  return [
    { key: "extreme-fear", label: "Extreme Fear", range: "0-25", className: "extreme-fear" },
    { key: "fear", label: "Fear", range: "25-45", className: "fear" },
    { key: "neutral", label: "Neutral", range: "45-55", className: "neutral" },
    { key: "greed", label: "Greed", range: "55-75", className: "greed" },
    { key: "extreme-greed", label: "Extreme Greed", range: "75-100", className: "extreme-greed" },
  ];
}

function getFearBands() {
  return [
    { min: 0, max: 25, label: "0-25", color: "rgba(255, 91, 91, 0.18)", labelColor: "rgba(255, 167, 167, 0.85)" },
    { min: 25, max: 45, label: "25-45", color: "rgba(255, 208, 87, 0.16)", labelColor: "rgba(255, 224, 148, 0.86)" },
    { min: 45, max: 55, label: "45-55", color: "rgba(255, 149, 61, 0.18)", labelColor: "rgba(255, 188, 134, 0.88)" },
    { min: 55, max: 75, label: "55-75", color: "rgba(105, 193, 255, 0.16)", labelColor: "rgba(174, 224, 255, 0.88)" },
    { min: 75, max: 100, label: "75-100", color: "rgba(100, 221, 143, 0.18)", labelColor: "rgba(171, 242, 192, 0.88)" },
  ];
}

function tickClock() {
  const now = new Date();
  refs.panelTime.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  refs.taskbarClock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatStatus(cnnBundle, seriesMap, meta = {}) {
  const liveCount = Array.from(seriesMap.values()).filter((series) => series.source === "live").length;
  const noDataCount = Array.from(seriesMap.values()).filter((series) => series.source === "empty").length;
  const proxyStatus = window.location.protocol === "file:"
    ? "Use node server.js and open localhost"
    : `${state.networkStatus.treasury} / ${state.networkStatus.fred} / ${state.networkStatus.cnn} / ${state.networkStatus.ahr}`;
  const changedText = Number.isFinite(meta.changedCount) ? `changed ${meta.changedCount}` : "changed --";
  const latestText = meta.latestDataDate ? `latest ${meta.latestDataDate}` : "latest --";
  return `Refresh #${meta.refreshSeq || state.refreshSeq} · ${changedText} · ${latestText} · Live ${liveCount} / No data ${noDataCount} · ${proxyStatus} · ${formatDateTime(new Date())}`;
}

function cnnBundleLabel(value) {
  return String(value || "")
    .replace(/^cnn\s*/i, "")
    .replace(/^ahr\s*/i, "")
    .trim();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function formatAxisDate(timestamp) {
  return new Date(timestamp).toLocaleDateString([], { year: "2-digit", month: "numeric", day: "numeric" });
}

function formatDateTime(date) {
  return date.toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function nearestIndex(positions, x) {
  let winner = 0;
  let best = Number.POSITIVE_INFINITY;
  positions.forEach((position, index) => {
    const distance = Math.abs(position - x);
    if (distance < best) {
      best = distance;
      winner = index;
    }
  });
  return winner;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function todayLocalIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
