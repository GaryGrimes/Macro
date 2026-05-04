
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
};

const HOME_YIELD_DEFS = [
  { id: "us3y", symbol: "US3Y", name: "3Y Treasury Yield", fredId: "DGS3", unit: "pct", decimals: 2, color: "#7fd1ff" },
  { id: "us10y", symbol: "US10Y", name: "10Y Treasury Yield", fredId: "DGS10", unit: "pct", decimals: 2, color: "#8bf0c8" },
  { id: "us30y", symbol: "US30Y", name: "30Y Treasury Yield", fredId: "DGS30", unit: "pct", decimals: 2, color: "#ffb864" },
];

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
  { id: "t5yie", symbol: "T5YIE", name: "5Y Breakeven Inflation", unit: "pct", decimals: 2, note: "Primary watch item.", live: { type: "fred", id: "T5YIE" }, page: "macro" },
  { id: "t10yie", symbol: "T10YIE", name: "10Y Breakeven Inflation", unit: "pct", decimals: 2, note: "Longer horizon compensation.", live: { type: "fred", id: "T10YIE" }, page: "macro" },
  { id: "swap5y", symbol: "SWAP5Y", name: "5Y Inflation Swap", unit: "pct", decimals: 2, note: "Live source not wired yet.", page: "macro" },
  { id: "t5yifr", symbol: "T5YIFR", name: "5Y5Y Forward Inflation", unit: "pct", decimals: 2, note: "Long-end anchor check.", live: { type: "fred", id: "T5YIFR" }, page: "macro" },
  { id: "clev5y", symbol: "CLEV5Y", name: "Cleveland 5Y Exp.", unit: "pct", decimals: 2, note: "No stable free CSV source wired yet.", page: "macro" },
  { id: "umich1", symbol: "UMICH1", name: "Michigan 1Y Survey", unit: "pct", decimals: 1, note: "Short-end survey expectations.", live: { type: "fred", id: "MICH" }, page: "macro" },
  { id: "umich5", symbol: "UMICH5", name: "Michigan 5Y Survey", unit: "pct", decimals: 1, note: "No stable free CSV source wired yet.", page: "macro" },
  { id: "nyfed3", symbol: "NYFED3", name: "NY Fed 3Y Survey", unit: "pct", decimals: 1, note: "No stable free CSV source wired yet.", page: "macro" },
  { id: "dgs5", symbol: "DGS5", name: "5Y Treasury Nominal", unit: "pct", decimals: 2, note: "Nominal leg for breakeven.", live: { type: "fred", id: "DGS5" }, page: "macro" },
  { id: "dfii5", symbol: "DFII5", name: "5Y TIPS Real Yield", unit: "pct", decimals: 2, note: "Real leg for breakeven.", live: { type: "fred", id: "DFII5" }, page: "macro" },
  { id: "dgs10", symbol: "DGS10", name: "10Y Treasury Nominal", unit: "pct", decimals: 2, note: "Long nominal cross-check.", live: { type: "fred", id: "DGS10" }, page: "macro" },
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
  networkStatus: {
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
  loadCachedSnapshot().finally(() => {
    beginLoadProgress();
    refreshHomeYieldChart("refresh");
    refreshDashboard("refresh");
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
    phase: "loading",
    detail: "本地缓存已载入，开始增量更新远端数据...",
    completed: 0,
    total: getTotalRefreshUnits(),
  });
}

async function loadCachedDashboard() {
  const fredDefs = SERIES_DEFS.filter((def) => def.live?.type === "fred");
  const [fredResults, cnnBundle, ahrSeries] = await Promise.all([
    Promise.all(fredDefs.map((def) => fetchFredSeries(def, "cache"))),
    fetchCnnBundle("cache"),
    fetchAhrSeries("cache"),
  ]);
  const fredMap = new Map(fredResults.filter((result) => result.ok).map((result) => [result.series.id, result.series]));
  const seriesMap = new Map();

  for (const def of SERIES_DEFS) {
    if (def.live?.type === "fred") {
      seriesMap.set(def.id, fredMap.get(def.id) ?? makeEmptySeries(def));
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
    cnn: cnnBundle.ok ? `cnn ${formatCacheStatus(cnnBundle.cacheStatus)}` : `cnn ${cnnBundle.reason}`,
    ahr: ahrSeries?.source === "live" ? `ahr ${formatCacheStatus(ahrSeries.cacheStatus)}` : "ahr unavailable",
  };
  render();
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
    detail: "正在连接 FRED、CNN 和 AHR999。",
    feeds: {
      fred: { state: "loading", label: "FRED", detail: "连接中" },
      cnn: { state: "loading", label: "CNN", detail: "连接中" },
      ahr: { state: "loading", label: "AHR999", detail: "连接中" },
    },
  });
  refs.refreshButton.disabled = true;

  const fredDefs = SERIES_DEFS.filter((def) => def.live?.type === "fred");
  const cnnSeriesCount = SERIES_DEFS.filter((def) => def.live?.type === "cnn").length;
  const [initialFredResults, initialCnnBundle, initialAhrSeries] = await Promise.all([
    Promise.all(fredDefs.map((def) => trackRefreshUnit(fetchFredSeries(def, mode), def.symbol))),
    trackRefreshUnit(fetchCnnBundle(mode), `CNN x${cnnSeriesCount}`, cnnSeriesCount),
    trackRefreshUnit(fetchAhrSeries(mode), "AHR999"),
  ]);
  let fredResults = initialFredResults;
  let cnnBundle = initialCnnBundle;
  let ahrSeries = initialAhrSeries;

  if (needsRetry(fredResults, cnnBundle, ahrSeries)) {
    setFeedHealth({
      phase: "retrying",
      tone: "warning",
      title: "重新尝试连接中",
      detail: "部分数据源第一次连接失败，正在再试一次。",
      feeds: buildFeedHealth(fredResults, cnnBundle, ahrSeries),
    });
    const retryFredDefs = fredDefs.filter((def) => !fredResults.find((result) => result.id === def.id && result.ok));
    const [retryFredResults, retryCnnBundle, retryAhrSeries] = await Promise.all([
      Promise.all(retryFredDefs.map((def) => fetchFredSeries(def, mode))),
      cnnBundle.ok ? Promise.resolve(cnnBundle) : fetchCnnBundle(mode),
      ahrSeries?.source === "live" ? Promise.resolve(ahrSeries) : fetchAhrSeries(mode),
    ]);
    fredResults = mergeFredResults(fredResults, retryFredResults);
    cnnBundle = retryCnnBundle;
    ahrSeries = retryAhrSeries;
  }

  const fredMap = new Map(fredResults.filter((result) => result.ok).map((result) => [result.series.id, result.series]));
  const seriesMap = new Map();

  for (const def of SERIES_DEFS) {
    if (def.live?.type === "fred") {
      seriesMap.set(def.id, fredMap.get(def.id) ?? makeEmptySeries(def));
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
    cnn: cnnBundle.ok ? `cnn ${formatCacheStatus(cnnBundle.cacheStatus)}` : `cnn ${cnnBundle.reason}`,
    ahr: ahrSeries?.source === "live" ? `ahr ${formatCacheStatus(ahrSeries.cacheStatus)}` : "ahr unavailable",
  };
  refs.refreshButton.disabled = false;
  const hasWarning = hasAnyWarning(fredResults, cnnBundle, ahrSeries);
  setFeedHealth({
    phase: hasAnyError(fredResults, cnnBundle, ahrSeries) || hasWarning ? "partial" : "ready",
    tone: hasAnyLive(seriesMap) ? (hasAnyError(fredResults, cnnBundle, ahrSeries) || hasWarning ? "warning" : "ok") : "error",
    title: hasAnyLive(seriesMap) ? "数据已更新" : "数据获取失败",
    detail: formatStatus(cnnBundle, seriesMap, { changedCount, latestDataDate, refreshStartedAt, refreshSeq }),
    feeds: buildFeedHealth(fredResults, cnnBundle, ahrSeries),
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

async function refreshHomeYieldChart(mode = "refresh") {
  renderHomeControls();
  homeYieldState.status = "loading";
  homeYieldState.message = mode === "cache" ? "Loading local US Treasury yield cache..." : "Incrementally updating US3Y / US10Y / US30Y from FRED...";
  renderHomeYieldLegend();
  drawHomeYieldChart(1);

  const results = await Promise.all(
    HOME_YIELD_DEFS.map((def) => {
      const task = fetchHomeYieldSeries(def, mode);
      return mode === "refresh" ? trackRefreshUnit(task, def.symbol) : task;
    }),
  );
  homeYieldState.series = results.filter((result) => result.ok).map((result) => result.series);
  const errors = results.filter((result) => !result.ok);

  if (homeYieldState.series.length) {
    const latestDate = getLatestHomeYieldDate();
    const errorText = errors.length ? ` · ${errors.length} feed unavailable` : "";
    const staleText = homeYieldState.series.some((series) => series.cacheStatus === "STALE") ? " · using stale local cache" : "";
    homeYieldState.status = errors.length ? "partial" : "ready";
    homeYieldState.message = `Updated ${latestDate ? formatDate(latestDate) : "--"} · Source: FRED${errorText}${staleText}`;
  } else {
    homeYieldState.status = "error";
    homeYieldState.message = errors.map((result) => `${result.symbol}: ${result.reason}`).join(" · ") || "No data";
  }

  renderHomeYieldLegend();
  startHomeYieldAnimation();
  if (mode === "refresh") {
    maybeFinishLoadProgress();
  }
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
            gma200: payload.gma200_usd,
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
  const dashboardUnits = SERIES_DEFS.filter((def) => def.live?.type === "fred" || def.live?.type === "ahr").length;
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

function needsRetry(fredResults, cnnBundle, ahrSeries) {
  return fredResults.some((result) => !result.ok) || !cnnBundle.ok || ahrSeries?.source !== "live";
}

function hasAnyError(fredResults, cnnBundle, ahrSeries) {
  return needsRetry(fredResults, cnnBundle, ahrSeries);
}

function hasAnyWarning(fredResults, cnnBundle, ahrSeries) {
  return (
    fredResults.some((result) => result.ok && result.series?.cacheStatus === "STALE") ||
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

function buildFeedHealth(fredResults, cnnBundle, ahrSeries) {
  const fredLive = fredResults.filter((result) => result.ok).length;
  const fredStale = fredResults.filter((result) => result.ok && result.series?.cacheStatus === "STALE").length;
  const fredFailed = fredResults.find((result) => !result.ok);
  const fredState = fredLive === fredResults.length && !fredStale ? "ok" : fredLive > 0 ? "warning" : "error";
  const cnnState = cnnBundle.ok ? (cnnBundle.cacheStatus === "STALE" ? "warning" : "ok") : "error";
  const ahrState = ahrSeries?.source === "live" ? (ahrSeries.cacheStatus === "STALE" ? "warning" : "ok") : "error";

  return {
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
  let baseText = "Survey up / market still anchored";

  if (Number.isFinite(t5yieValue) && Number.isFinite(t5yifrValue) && t5yieValue >= 2.75 && t5yifrValue >= 2.6) {
    readText = "Both front-end and forward anchor are lifting. De-anchoring risk is moving higher.";
    baseText = "Anchor drift is no longer a tail risk";
  } else if (Number.isFinite(t5yieValue) && t5yieValue >= 2.7) {
    readText = "5Y breakeven is pressing higher. Watch whether the move broadens into the forward anchor.";
    baseText = "Breakeven watch is active";
  } else if (Number.isFinite(umich5Value) && Number.isFinite(t5yieValue) && umich5Value - t5yieValue > 0.5) {
    readText = "Surveys are hotter than market pricing. For now, the market still treats this as conditional.";
  }

  refs.readSummary.textContent = readText;
  refs.heroBaseCase.textContent = baseText;
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

function renderChart() {
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

  drawChart(points, series, rangeView, chartConfig);
}

function drawChart(points, series, rangeView, chartConfig) {
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
  drawLine(ctx, points, xPositions, yFor, rect.height - padding.bottom);
  chartConfig.overlays.forEach((overlay) => {
    const overlayX = overlay.points.map((point) => {
      const time = new Date(point.date).getTime();
      const ratio = (time - rangeView.startTime) / Math.max(rangeView.endTime - rangeView.startTime, 1);
      return padding.left + clamp(ratio, 0, 1) * plotWidth;
    });
    drawLine(ctx, overlay.points, overlayX, yFor, rect.height - padding.bottom, overlay.color);
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

function drawLine(ctx, points, xPositions, yFor, baseline, strokeColor) {
  if (points.length === 1) {
    const x = xPositions[0];
    const y = yFor(points[0].value);
    ctx.fillStyle = "#7fd1ff";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

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
  if (series?.unit === "bp") {
    return `${Math.round(value)}bp`;
  }
  if (series?.unit === "index") {
    return `${value.toFixed(series.decimals ?? 0)}`;
  }
  if (series?.unit === "ratio") {
    return `${value.toFixed(series.decimals ?? 2)}`;
  }
  if (series?.unit === "number") {
    return `${value.toFixed(series.decimals ?? 2)}`;
  }
  if (series?.unit === "pp") {
    return `${value.toFixed(series.decimals ?? 2)}pp`;
  }
  return `${value.toFixed(series?.decimals ?? 2)}%`;
}

function formatDelta(series, value) {
  if (!Number.isFinite(value)) {
    return "无数据";
  }
  const sign = value > 0 ? "+" : "";
  if (series?.unit === "bp") {
    return `${sign}${Math.round(value)}bp`;
  }
  if (series?.unit === "index") {
    return `${sign}${value.toFixed(1)}`;
  }
  if (series?.unit === "ratio") {
    return `${sign}${value.toFixed(series.decimals ?? 2)}`;
  }
  if (series?.unit === "number") {
    return `${sign}${value.toFixed(series.decimals ?? 2)}`;
  }
  return `${sign}${Math.round(value * 100)}bp`;
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
    cnn_fear: "该指数把七个市场情绪子指标合成为 0 到 100 的总分。分数越低代表市场越偏恐惧，越高则越偏贪婪。通常把极低读数视为风险厌恶升温，把极高读数视为情绪过热信号。",
    market_momentum_sp500: "市场动能把标普500当前水平与其过去125个交易日的移动平均线做比较。指数位于均线上方，通常说明价格动能偏强；跌破均线则往往代表风险偏好转弱。在“恐惧与贪婪”框架里，动能走弱通常更接近恐惧区间。",
    market_volatility_vix: "市场波动指标使用 VIX，并与其50日移动平均线一起观察。VIX 上升通常代表市场对未来波动的定价抬高、避险情绪升温；若 VIX 长时间高于其均线，往往意味着恐惧情绪在累积。",
    stock_price_strength: "股票价格强度衡量纽约证交所创新高与创新低股票的对比。创新高占优通常表示市场内部状态更强，创新低增多则更接近恐惧读数。",
    stock_price_breadth: "股票价格广度观察上涨参与度是否足够广泛。若只有少数大市值股票支撑指数，而多数股票没有跟随，说明风险偏好并不扎实。",
    put_call_options: "看跌/看涨期权比率衡量市场对下行保护的需求。看跌期权需求明显升温时，通常意味着投资者更偏防守，情绪更接近恐惧。",
    junk_bond_demand: "垃圾债需求反映投资者是否愿意承担信用风险。若高收益债利差扩大、需求下降，通常意味着风险偏好降温。",
    safe_haven_demand: "避险需求比较股票与美国国债的相对表现。资金明显流向国债等避险资产时，通常代表市场风险偏好减弱。",
    ahr999: "AHR999 是比特币价格相对长期估值框架的热度指标。这里用 FRED 的 Coinbase BTC/USD 日线计算：价格相对 200 日几何均价，再乘以价格相对指数增长估值。读数越低通常代表市场更冷、更谨慎；读数越高则更接近风险偏好过热。",
  };
  return notes[id] || "该指标用于补充观察市场情绪结构。一般来说，越偏防守或避险的信号越接近恐惧，越偏追逐风险的信号越接近贪婪。";
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
    : `${state.networkStatus.fred} / ${state.networkStatus.cnn} / ${state.networkStatus.ahr}`;
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
