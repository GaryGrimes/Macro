const COLUMN_CONFIG = [
  {
    id: "breakevens",
    title: "Breakevens",
    subtitle: "Market inflation compensation",
    items: ["t5yie", "t10yie", "swap5y"],
  },
  {
    id: "anchor",
    title: "Long Anchor",
    subtitle: "Long-end regime checks",
    items: ["t5yifr", "clev5y", "anchor_gap"],
  },
  {
    id: "surveys",
    title: "Surveys",
    subtitle: "Survey-based expectations",
    items: ["umich1", "umich5", "nyfed3"],
  },
  {
    id: "components",
    title: "Components",
    subtitle: "Nominal vs real inputs",
    items: ["dgs5", "dfii5", "dgs10"],
  },
  {
    id: "signals",
    title: "Triggers",
    subtitle: "Heuristic watch flags",
    items: ["survey_gap", "drift_1m", "cpi3m"],
  },
  {
    id: "panic",
    title: "Panic",
    subtitle: "Risk appetite and crypto stress",
    items: ["cnn_fear", "ath999", "panic_blend"],
  },
];

const SERIES_DEFS = [
  {
    id: "t5yie",
    symbol: "T5YIE",
    name: "5Y Breakeven Inflation",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Primary watch item. If this drifts up persistently, the market anchor is softening.",
    live: { fred: "T5YIE" },
    sample: { base: 2.58, trend: 0.00004, wave: 0.09, seed: 1.3, min: 2.18, max: 2.92 },
  },
  {
    id: "t10yie",
    symbol: "T10YIE",
    name: "10Y Breakeven Inflation",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Longer horizon compensation. Helps confirm whether the drift is broader.",
    live: { fred: "T10YIE" },
    sample: { base: 2.46, trend: 0.00003, wave: 0.08, seed: 1.9, min: 2.12, max: 2.78 },
  },
  {
    id: "swap5y",
    symbol: "SWAP5Y",
    name: "5Y Inflation Swap",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Context cross-check. Sample placeholder until another live feed is wired.",
    sampleOnly: true,
    sample: { base: 2.68, trend: 0.00005, wave: 0.1, seed: 2.6, min: 2.24, max: 3.02 },
  },
  {
    id: "t5yifr",
    symbol: "T5YIFR",
    name: "5Y5Y Forward Inflation",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Cleaner long-end anchor. If this rises with T5YIE, the story gets harder.",
    live: { fred: "T5YIFR" },
    sample: { base: 2.49, trend: 0.00002, wave: 0.06, seed: 3.4, min: 2.18, max: 2.76 },
  },
  {
    id: "clev5y",
    symbol: "CLEV5Y",
    name: "Cleveland 5Y Exp.",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Model-based expected inflation placeholder. Wire Cleveland data later if needed.",
    sampleOnly: true,
    sample: { base: 2.43, trend: 0.00001, wave: 0.05, seed: 4.4, min: 2.2, max: 2.65 },
  },
  {
    id: "umich1",
    symbol: "UMICH1",
    name: "Michigan 1Y Survey",
    unit: "pct",
    decimals: 1,
    chartType: "line",
    note: "Short-end survey expectations. This is where the recent heat is usually visible first.",
    sampleOnly: true,
    stepped: true,
    sample: { base: 4.7, trend: 0.00003, wave: 0.22, seed: 5.2, min: 3.2, max: 5.4 },
  },
  {
    id: "umich5",
    symbol: "UMICH5",
    name: "Michigan 5Y Survey",
    unit: "pct",
    decimals: 1,
    chartType: "line",
    note: "Medium-run survey expectations. This is the survey leg of the thesis.",
    sampleOnly: true,
    stepped: true,
    sample: { base: 3.3, trend: 0.00002, wave: 0.12, seed: 6.1, min: 2.6, max: 3.8 },
  },
  {
    id: "nyfed3",
    symbol: "NYFED3",
    name: "NY Fed 3Y Survey",
    unit: "pct",
    decimals: 1,
    chartType: "line",
    note: "Another survey cross-check. Sample placeholder.",
    sampleOnly: true,
    stepped: true,
    sample: { base: 3.1, trend: 0.00001, wave: 0.1, seed: 7.2, min: 2.5, max: 3.6 },
  },
  {
    id: "dgs5",
    symbol: "DGS5",
    name: "5Y Treasury Nominal",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Nominal leg for the breakeven decomposition.",
    live: { fred: "DGS5" },
    sample: { base: 3.91, trend: 0.00006, wave: 0.2, seed: 8.4, min: 3.15, max: 4.62 },
  },
  {
    id: "dfii5",
    symbol: "DFII5",
    name: "5Y TIPS Real Yield",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Real leg for the breakeven decomposition.",
    live: { fred: "DFII5" },
    sample: { base: 1.35, trend: 0.00002, wave: 0.18, seed: 9.7, min: 0.55, max: 2.05 },
  },
  {
    id: "dgs10",
    symbol: "DGS10",
    name: "10Y Treasury Nominal",
    unit: "pct",
    decimals: 2,
    chartType: "line",
    note: "Long nominal cross-check.",
    live: { fred: "DGS10" },
    sample: { base: 4.34, trend: 0.00005, wave: 0.17, seed: 10.2, min: 3.6, max: 5.02 },
  },
  {
    id: "cpi3m",
    symbol: "CORE3M",
    name: "Core CPI 3M Ann.",
    unit: "pct",
    decimals: 1,
    chartType: "line",
    note: "Inflation momentum context. Sample placeholder.",
    sampleOnly: true,
    sample: { base: 3.4, trend: 0.00002, wave: 0.28, seed: 11.8, min: 2.2, max: 4.5 },
  },
  {
    id: "cnn_fear",
    symbol: "CNN-FGI",
    name: "CNN Fear & Greed",
    unit: "index",
    decimals: 0,
    chartType: "line",
    note: "Equity risk sentiment. Low readings mean broader panic tone.",
    live: { source: "cnn_fear_greed" },
    sample: { base: 34, trend: 0.004, wave: 8.2, seed: 12.7, min: 8, max: 82 },
  },
  {
    id: "ath999",
    symbol: "ATH999",
    name: "Bitcoin ATH999",
    unit: "ratio",
    decimals: 2,
    chartType: "line",
    note: "BTC valuation heat proxy. Below 1 usually reads as colder, stressier tape.",
    sampleOnly: true,
    sample: { base: 0.86, trend: 0.00008, wave: 0.22, seed: 13.4, min: 0.22, max: 2.4 },
  },
];

const RANGE_CONFIG = {
  "7D": { label: "7-day range", days: 7 },
  "30D": { label: "30-day range", days: 30 },
  "6M": { label: "6-month range", days: 183 },
  "1Y": { label: "1-year range", days: 365 },
  "2Y": { label: "2-year range", days: 730 },
};

const state = {
  isOpen: true,
  selectedId: "cnn_fear",
  lockedId: "cnn_fear",
  range: "7D",
  seriesMap: new Map(),
  derivedMap: new Map(),
  hoverUnlockTimer: null,
  hoverTooltipIndex: null,
  lastRefreshAt: null,
};

const refs = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  bindEvents();
  tickClock();
  window.setInterval(tickClock, 1000);
  renderRangeButtons();
  renderColumns();
  updateFlyoutVisibility();
  refreshDashboard();
});

function cacheRefs() {
  refs.trayButton = document.getElementById("tray-button");
  refs.trayPrice = document.getElementById("tray-price");
  refs.flyout = document.getElementById("inflation-flyout");
  refs.backdrop = document.getElementById("flyout-backdrop");
  refs.panelTime = document.getElementById("panel-time");
  refs.taskbarClock = document.getElementById("taskbar-clock");
  refs.refreshButton = document.getElementById("refresh-button");
  refs.statusStrip = document.getElementById("status-strip");
  refs.columnGrid = document.getElementById("column-grid");
  refs.rangeSwitcher = document.getElementById("range-switcher");
  refs.chartSymbol = document.getElementById("chart-symbol");
  refs.chartName = document.getElementById("chart-name");
  refs.chartChange = document.getElementById("chart-change");
  refs.chartContext = document.getElementById("chart-context");
  refs.lockedFlag = document.getElementById("locked-flag");
  refs.chartMode = document.getElementById("chart-mode");
  refs.chartUpdated = document.getElementById("chart-updated");
  refs.chartSource = document.getElementById("chart-source");
  refs.chartCanvas = document.getElementById("trend-canvas");
  refs.chartTooltip = document.getElementById("chart-tooltip");
  refs.anchorSummary = document.getElementById("anchor-summary");
  refs.readSummary = document.getElementById("read-summary");
  refs.heroBaseCase = document.getElementById("hero-base-case");
}

function bindEvents() {
  refs.trayButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFlyout();
  });
  refs.refreshButton.addEventListener("click", () => refreshDashboard());

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
  window.addEventListener("resize", renderChart);
}

async function refreshDashboard() {
  refs.statusStrip.textContent = "Refreshing live feeds...";
  refs.refreshButton.disabled = true;

  const baseMap = new Map();
  for (const def of SERIES_DEFS) {
    let series = null;
    if (def.live && !def.sampleOnly) {
      if (def.live.fred) {
        series = await tryFetchFredSeries(def);
      } else if (def.live.source === "cnn_fear_greed") {
        series = await tryFetchCnnFearSeries(def);
      }
    }
    if (!series && def.sampleOnly) {
      series = makeSampleSeries(def);
    }
    if (!series) {
      series = makeEmptySeries(def);
    }
    baseMap.set(def.id, series);
  }

  state.seriesMap = baseMap;
  state.derivedMap = buildDerivedSeries(baseMap);
  state.lastRefreshAt = new Date();
  refs.refreshButton.disabled = false;

  updateSummaryState();
  renderColumns();
  renderTray();
  renderChart();

  const liveCount = countSeriesBySource("live");
  const sampleCount = countSeriesBySource("sample");
  const emptyCount = countSeriesBySource("empty");
  refs.statusStrip.textContent = `Live ${liveCount} / Sample ${sampleCount} / No data ${emptyCount} · ${formatDateTime(state.lastRefreshAt)}`;
}

async function tryFetchFredSeries(def) {
  try {
    const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${def.live.fred}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const csv = await response.text();
    const data = parseFredCsv(csv);
    if (!data.length) {
      return null;
    }
    return {
      ...def,
      source: "live",
      updatedAt: data[data.length - 1].date,
      data,
    };
  } catch {
    return null;
  }
}

async function tryFetchCnnFearSeries(def) {
  try {
    const response = await fetch("https://production.dataviz.cnn.io/index/fearandgreed/graphdata", {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const history = payload?.fear_and_greed_historical?.data;
    if (!Array.isArray(history) || !history.length) {
      return null;
    }

    const data = history
      .map((point) => {
        const rawValue = point.y ?? point.score ?? point.value;
        const rawDate = point.x ?? point.timestamp ?? point.date;
        const value = Number.parseFloat(rawValue);
        const date = normalizeExternalDate(rawDate);
        return { date, value };
      })
      .filter((point) => point.date && !Number.isNaN(point.value));

    if (!data.length) {
      return null;
    }

    const liveSeries = {
      ...def,
      source: "live",
      updatedAt: data[data.length - 1].date,
      data,
    };

    const current = payload?.fear_and_greed;
    if (current && current.score != null) {
      liveSeries.latestMeta = {
        score: Number.parseFloat(current.score),
        rating: current.rating ?? "",
        timestamp: normalizeExternalDate(current.timestamp ?? current.lastUpdated),
      };
    }

    return liveSeries;
  } catch {
    return null;
  }
}

function parseFredCsv(csv) {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => {
      const [date, valueText] = row.split(",");
      return { date, value: Number.parseFloat(valueText) };
    })
    .filter((point) => point.date && !Number.isNaN(point.value))
    .slice(-2200);
}

function makeSampleSeries(def) {
  const dates = makeBusinessDates(2200);
  const data = (def.stepped ? buildSteppedSeries : buildLineSeries)(dates, def.sample);
  return {
    ...def,
    source: "sample",
    updatedAt: data[data.length - 1].date,
    data,
  };
}

function makeEmptySeries(def) {
  return {
    ...def,
    source: "empty",
    updatedAt: "",
    data: [],
  };
}

function buildLineSeries(dates, sample) {
  return dates.map((date, index) => {
    const wave =
      Math.sin(index * 0.07 + sample.seed) * sample.wave +
      Math.cos(index * 0.021 + sample.seed * 0.7) * sample.wave * 0.44 +
      Math.sin(index * 0.15 + sample.seed * 1.9) * sample.wave * 0.16;
    return {
      date,
      value: clamp(sample.base + sample.trend * index + wave, sample.min, sample.max),
    };
  });
}

function buildSteppedSeries(dates, sample) {
  return dates.map((date, index) => {
    const block = Math.floor(index / 21);
    const wave =
      Math.sin(block * 0.85 + sample.seed) * sample.wave +
      Math.cos(block * 0.41 + sample.seed * 1.7) * sample.wave * 0.46;
    return {
      date,
      value: clamp(sample.base + block * sample.trend * 21 + wave, sample.min, sample.max),
    };
  });
}

function buildDerivedSeries(baseMap) {
  const derived = new Map();
  const t5yie = baseMap.get("t5yie");
  const t5yifr = baseMap.get("t5yifr");
  const umich5 = baseMap.get("umich5");

  if (t5yie && umich5) {
    const data = alignSeries(t5yie.data, umich5.data, (market, survey) => survey - market);
    derived.set("survey_gap", {
      id: "survey_gap",
      symbol: "SURV-GAP",
      name: "Survey - 5Y Breakeven",
      unit: "pp",
      decimals: 2,
      chartType: "line",
      note: "Positive means survey expectations run hotter than market pricing.",
      source: inferCompositeSource([t5yie.source, umich5.source]),
      updatedAt: data[data.length - 1].date,
      data,
    });
  }

  if (t5yie) {
    const data = t5yie.data.map((point, index, array) => ({
      date: point.date,
      value: (point.value - (array[Math.max(0, index - 21)]?.value ?? point.value)) * 100,
    }));
    derived.set("drift_1m", {
      id: "drift_1m",
      symbol: "DRIFT1M",
      name: "T5YIE 1M Change",
      unit: "bp",
      decimals: 0,
      chartType: "line",
      note: "One-month drift in 5Y breakeven. Positive readings mean re-acceleration.",
      source: t5yie.source,
      updatedAt: t5yie.updatedAt,
      data,
    });
  }

  if (t5yie && t5yifr) {
    const data = alignSeries(t5yie.data, t5yifr.data, (front, anchor) => (front - anchor) * 100);
    derived.set("anchor_gap", {
      id: "anchor_gap",
      symbol: "ANCH-GAP",
      name: "T5YIE - T5YIFR",
      unit: "bp",
      decimals: 0,
      chartType: "line",
      note: "Wide positive gaps fit a more conditional shock story.",
      source: inferCompositeSource([t5yie.source, t5yifr.source]),
      updatedAt: data[data.length - 1].date,
      data,
    });
  }

  const cnnFear = baseMap.get("cnn_fear");
  const ath999 = baseMap.get("ath999");
  if (cnnFear && ath999) {
    const data = alignSeries(cnnFear.data, ath999.data, (fear, ath) => {
      const fearStress = 100 - fear;
      const athStress = clamp((1.2 - ath) / 1.2, 0, 1) * 100;
      return fearStress * 0.6 + athStress * 0.4;
    });
    derived.set("panic_blend", {
      id: "panic_blend",
      symbol: "PANIC-X",
      name: "Composite Panic Blend",
      unit: "index",
      decimals: 0,
      chartType: "line",
      note: "Blends equity fear and BTC coldness into one 0-100 panic gauge.",
      source: inferCompositeSource([cnnFear.source, ath999.source]),
      updatedAt: data[data.length - 1].date,
      data,
    });
  }

  return derived;
}

function alignSeries(left, right, combiner) {
  return left.map((point, index) => {
    const match = right[Math.min(index, right.length - 1)];
    return {
      date: point.date,
      value: combiner(point.value, match.value),
    };
  });
}

function inferCompositeSource(sources) {
  return sources.every((source) => source === "live") ? "live" : "sample";
}

function makeBusinessDates(count) {
  const dates = [];
  const cursor = new Date();
  while (dates.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates.reverse();
}

function updateSummaryState() {
  const t5yie = getSeries("t5yie");
  const t5yifr = getSeries("t5yifr");
  const umich5 = getSeries("umich5");
  const t5yieValue = getLatestValue(t5yie);
  const t5yifrValue = getLatestValue(t5yifr);
  const umich5Value = getLatestValue(umich5);

  refs.anchorSummary.textContent = `5Y breakeven ${formatSeriesValue(t5yie, t5yieValue)} · 5Y5Y ${formatSeriesValue(t5yifr, t5yifrValue)}`;

  let readText = "Market still reads this as conditional rather than permanent re-inflation.";
  let heroText = "Survey up / market still anchored";
  const hasT5yie = Number.isFinite(t5yieValue);
  const hasT5yifr = Number.isFinite(t5yifrValue);
  const hasUmich5 = Number.isFinite(umich5Value);

  if (hasT5yie && hasT5yifr && t5yieValue >= 2.75 && t5yifrValue >= 2.6) {
    readText = "Both front-end and forward anchor are lifting. De-anchoring risk is moving higher.";
    heroText = "Anchor drift is no longer a tail risk";
  } else if (hasT5yie && t5yieValue >= 2.7) {
    readText = "5Y breakeven is pressing higher. Watch whether the move broadens into the forward anchor.";
    heroText = "Breakeven watch is active";
  } else if (hasUmich5 && hasT5yie && umich5Value - t5yieValue > 0.5) {
    readText = "Surveys are hotter than market pricing. For now, the market still treats this as conditional.";
  }

  refs.readSummary.textContent = readText;
  refs.heroBaseCase.textContent = heroText;
}

function renderColumns() {
  refs.columnGrid.innerHTML = "";
  for (const column of COLUMN_CONFIG) {
    const card = document.createElement("section");
    card.className = "metric-column";
    const liveCount = column.items.filter((id) => getSeries(id)?.source === "live").length;
    card.innerHTML = `
      <div class="column-head">
        <div class="column-title-line">
          <h3 class="column-title">${column.title}</h3>
          <span class="source-pill ${liveCount ? "live" : "sample"}">${liveCount ? `${liveCount} live` : "sample"}</span>
        </div>
        <p class="column-subtitle">${column.subtitle}</p>
      </div>
      <div class="metric-list"></div>
    `;

    const list = card.querySelector(".metric-list");
    for (const id of column.items) {
      const series = getSeries(id);
      if (series) {
        list.appendChild(renderMetricRow(series));
      }
    }
    refs.columnGrid.appendChild(card);
  }
}

function renderMetricRow(series) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "metric-row";
  row.dataset.seriesId = series.id;

  if (series.id === state.selectedId) {
    row.classList.add("is-selected");
  }
  if (series.id === state.lockedId) {
    row.classList.add("is-locked");
  }

  const delta = getRangeDelta(series, "30D");
  const deltaClass = classifyDelta(series, delta);

  row.innerHTML = `
    <div class="metric-main">
      <div class="metric-symbol-line">
        <span class="metric-symbol">${series.symbol}</span>
        <span class="source-pill ${series.source}">${getSourcePillText(series)}</span>
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
        <span class="metric-value">${formatSeriesValue(series, getLatestValue(series))}</span>
      </div>
      <div class="metric-value-line">
        <span class="metric-delta ${deltaClass}">${formatDelta(series, delta)}</span>
      </div>
    </div>
  `;

  row.addEventListener("click", () => handleMetricClick(series.id));
  return row;
}

function handleMetricHover(seriesId) {
  if (state.lockedId && state.lockedId !== seriesId) {
    if (state.hoverUnlockTimer) {
      window.clearTimeout(state.hoverUnlockTimer);
    }
    state.hoverUnlockTimer = window.setTimeout(() => {
      state.lockedId = null;
      state.selectedId = seriesId;
      renderColumns();
      renderChart();
    }, 500);
    return;
  }

  if (!state.lockedId) {
    state.selectedId = seriesId;
    renderColumns();
    renderChart();
  }
}

function handleMetricClick(seriesId) {
  state.lockedId = seriesId;
  state.selectedId = seriesId;
  renderColumns();
  renderChart();
}

function renderTray() {
  const primary = getSeries("t5yie");
  refs.trayPrice.textContent = formatSeriesValue(primary, getLatestValue(primary));
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

  const config = RANGE_CONFIG[state.range];
  const rangeView = getRangeView(series, config.days);
  const points = rangeView.points;
  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest && first ? latest.value - first.value : 0;
  const deltaClass = classifyDelta(series, delta);

  refs.chartSymbol.textContent = series.symbol;
  refs.chartName.textContent = series.name;
  refs.chartChange.textContent = formatDelta(series, delta);
  refs.chartChange.className = deltaClass;
  refs.chartContext.textContent = series.note;
  refs.lockedFlag.hidden = state.lockedId !== series.id;
  refs.chartMode.textContent = config.label;
  refs.chartUpdated.textContent = latest?.date ? formatDate(latest.date) : "无数据";
  refs.chartSource.textContent = getSourceLabel(series);

  drawChart(points, series, rangeView);
}

function drawChart(points, series, rangeView) {
  const canvas = refs.chartCanvas;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  const padding = { top: 20, right: 18, bottom: 26, left: 18 };
  const sentimentBands = getSentimentBands(series);

  if (!points.length) {
    if (sentimentBands) {
      const emptyYFor = (value) =>
        padding.top + (1 - value / 100) * (rect.height - padding.top - padding.bottom);
      drawSentimentBands(ctx, rect.width, rect.height, padding, emptyYFor, sentimentBands);
    }
    drawAxes(
      ctx,
      rect.width,
      rect.height,
      padding,
      0,
      100,
      series,
      rangeView,
    );
    ctx.fillStyle = "#7d90a5";
    ctx.font = '14px "IBM Plex Mono"';
    ctx.fillText("无数据", 24, 48);
    canvas._plot = null;
    return;
  }

  const plotWidth = rect.width - padding.left - padding.right;
  const plotHeight = rect.height - padding.top - padding.bottom;
  const values = series.chartType === "candle"
    ? points.flatMap((point) => [point.high, point.low])
    : points.map((point) => point.value);
  const minValue = sentimentBands ? 0 : Math.min(...values);
  const maxValue = sentimentBands ? 100 : Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const xPositions = points.map((point) => {
    const current = new Date(point.date).getTime();
    const ratio = (current - rangeView.startTime) / Math.max(rangeView.endTime - rangeView.startTime, 1);
    return padding.left + clamp(ratio, 0, 1) * plotWidth;
  });
  const xFor = (index) => xPositions[index];
  const yFor = (value) => padding.top + (1 - (value - minValue) / valueRange) * plotHeight;

  if (sentimentBands) {
    drawSentimentBands(ctx, rect.width, rect.height, padding, yFor, sentimentBands);
  }

  drawAxes(ctx, rect.width, rect.height, padding, minValue, maxValue, series, rangeView);
  if (series.chartType === "candle") {
    drawCandles(ctx, points, xFor, yFor);
  } else {
    drawLine(ctx, points, xFor, yFor, rect.height, plotHeight);
  }

  if (state.hoverTooltipIndex != null && points[state.hoverTooltipIndex]) {
    const point = points[state.hoverTooltipIndex];
    const x = xFor(state.hoverTooltipIndex);
    const y = yFor(point.close ?? point.value);
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

  canvas._plot = { points, xPositions, yFor, series, bounds: rect };
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
  ctx.fillText(formatSeriesValue(series, maxValue), padding.left + 8, padding.top + 12);
  ctx.fillText(formatSeriesValue(series, minValue), padding.left + 8, height - padding.bottom - 8);
  if (rangeView) {
    const startLabel = formatAxisDate(rangeView.startTime);
    const endLabel = formatAxisDate(rangeView.endTime);
    const endWidth = ctx.measureText(endLabel).width;
    ctx.fillText(startLabel, padding.left, height - 8);
    ctx.fillText(endLabel, width - padding.right - endWidth, height - 8);
  }
}

function drawSentimentBands(ctx, width, height, padding, yFor, bands) {
  for (const band of bands) {
    const top = yFor(band.max);
    const bottom = yFor(band.min);
    ctx.fillStyle = band.color;
    ctx.fillRect(padding.left, top, width - padding.left - padding.right, bottom - top);

    ctx.fillStyle = band.labelColor;
    ctx.font = '12px "IBM Plex Mono"';
    ctx.fillText(band.label, width - padding.right - ctx.measureText(band.label).width - 8, top + 18);
  }
}

function drawLine(ctx, points, xFor, yFor, height) {
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.value);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  const stroke = ctx.createLinearGradient(0, 0, 0, height);
  stroke.addColorStop(0, "rgba(127, 209, 255, 0.95)");
  stroke.addColorStop(1, "rgba(127, 209, 255, 0.18)");
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  const fillPath = new Path2D();
  points.forEach((point, index) => {
    const x = xFor(index);
    const y = yFor(point.value);
    if (index === 0) {
      fillPath.moveTo(x, y);
    } else {
      fillPath.lineTo(x, y);
    }
  });
  fillPath.lineTo(xFor(points.length - 1), height - 26);
  fillPath.lineTo(xFor(0), height - 26);
  fillPath.closePath();

  const fill = ctx.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, "rgba(127, 209, 255, 0.18)");
  fill.addColorStop(1, "rgba(127, 209, 255, 0)");
  ctx.fillStyle = fill;
  ctx.fill(fillPath);
}

function drawCandles(ctx, points, xFor, yFor) {
  const candleWidth = Math.max(4, Math.min(10, points.length > 1 ? (xFor(1) - xFor(0)) * 0.58 : 8));

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const x = xFor(index);
    const rising = point.close >= point.open;

    ctx.strokeStyle = rising ? "#8bf0c8" : "#ff7b72";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, yFor(point.high));
    ctx.lineTo(x, yFor(point.low));
    ctx.stroke();

    ctx.fillStyle = rising ? "rgba(139, 240, 200, 0.26)" : "rgba(255, 123, 114, 0.26)";
    ctx.fillRect(
      x - candleWidth / 2,
      Math.min(yFor(point.open), yFor(point.close)),
      candleWidth,
      Math.max(2, Math.abs(yFor(point.close) - yFor(point.open))),
    );
  }
}

function handleChartHover(event) {
  const plot = refs.chartCanvas._plot;
  if (!plot || !plot.points.length) {
    return;
  }
  const bounds = refs.chartCanvas.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const index = getNearestPointIndex(plot.xPositions, x);
  state.hoverTooltipIndex = index;
  renderChart();
  const point = plot.points[index];
  showTooltip(point, plot.series, plot.xPositions[index], plot.yFor(point.close ?? point.value), bounds);
}

function showTooltip(point, series, x, y, bounds) {
  refs.chartTooltip.hidden = false;
  const tooltipValue = series.chartType === "candle"
    ? `O ${formatSeriesValue(series, point.open)} / C ${formatSeriesValue(series, point.close)}`
    : formatSeriesValue(series, point.value);
  refs.chartTooltip.innerHTML = `
    <div class="tooltip-label">${series.symbol}</div>
    <div class="tooltip-value">${tooltipValue}</div>
    <div class="tooltip-date">${formatDate(point.date)}</div>
  `;
  const tooltipRect = refs.chartTooltip.getBoundingClientRect();
  const horizontalMargin = 12;
  const verticalMargin = 12;
  const clampedLeft = clamp(
    x,
    tooltipRect.width / 2 + horizontalMargin,
    bounds.width - tooltipRect.width / 2 - horizontalMargin,
  );
  const aboveTop = y - tooltipRect.height - 16;
  const belowTop = y + 16;
  if (aboveTop < verticalMargin) {
    refs.chartTooltip.style.transform = "translateX(-50%)";
    refs.chartTooltip.style.top = `${clamp(
      belowTop,
      verticalMargin,
      bounds.height - tooltipRect.height - verticalMargin,
    )}px`;
  } else {
    refs.chartTooltip.style.transform = "translateX(-50%)";
    refs.chartTooltip.style.top = `${clamp(
      aboveTop,
      verticalMargin,
      bounds.height - tooltipRect.height - verticalMargin,
    )}px`;
  }
  refs.chartTooltip.style.left = `${clampedLeft}px`;
}

function hideTooltip() {
  state.hoverTooltipIndex = null;
  refs.chartTooltip.hidden = true;
  renderChart();
}

function getSeries(id) {
  return state.seriesMap.get(id) || state.derivedMap.get(id);
}

function getLatestValue(series) {
  if (!series?.data?.length) {
    return null;
  }
  return series.data[series.data.length - 1].value;
}

function getRangeView(series, days) {
  const endTime = series?.data?.length
    ? new Date(series.data[series.data.length - 1].date).getTime()
    : Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;
  const points = (series.data || []).filter((point) => new Date(point.date).getTime() >= startTime);
  return { points, startTime, endTime };
}

function getRangeDelta(series, rangeKey) {
  const points = getRangeView(series, RANGE_CONFIG[rangeKey].days).points;
  if (points.length < 2) {
    return null;
  }
  return points[points.length - 1].value - points[0].value;
}

function formatSeriesValue(series, value) {
  if (!Number.isFinite(value)) {
    return "无数据";
  }
  if (series.unit === "bp") {
    return `${Math.round(value)}bp`;
  }
  if (series.unit === "index") {
    return `${value.toFixed(series.decimals ?? 0)}`;
  }
  if (series.unit === "ratio") {
    return `${value.toFixed(series.decimals ?? 2)}x`;
  }
  if (series.unit === "pp") {
    return `${value.toFixed(series.decimals ?? 2)}pp`;
  }
  return `${value.toFixed(series.decimals ?? 2)}%`;
}

function formatDelta(series, value) {
  if (!Number.isFinite(value)) {
    return "无数据";
  }
  const sign = value > 0 ? "+" : "";
  if (series.unit === "bp") {
    return `${sign}${Math.round(value)}bp`;
  }
  if (series.unit === "index") {
    return `${sign}${value.toFixed(1)}`;
  }
  if (series.unit === "ratio") {
    return `${sign}${value.toFixed(2)}x`;
  }
  return `${sign}${Math.round(value * 100)}bp`;
}

function classifyDelta(series, value) {
  if (!Number.isFinite(value)) {
    return "flat";
  }
  const thresholdMap = {
    bp: 1,
    pct: 0.02,
    pp: 0.02,
    index: 1,
    ratio: 0.03,
  };
  const threshold = thresholdMap[series.unit] ?? 0.02;
  if (value > threshold) {
    return "positive";
  }
  if (value < -threshold) {
    return "negative";
  }
  return "flat";
}

function countSeriesBySource(source) {
  let count = 0;
  for (const series of state.seriesMap.values()) {
    if (series.source === source) {
      count += 1;
    }
  }
  for (const series of state.derivedMap.values()) {
    if (series.source === source) {
      count += 1;
    }
  }
  return count;
}

function getSourceLabel(series) {
  if (series.source === "empty") {
    return "无数据";
  }
  if (series.source !== "live") {
    return "Sample fallback";
  }
  if (series.live?.fred) {
    return "FRED public CSV";
  }
  if (series.live?.source === "cnn_fear_greed") {
    return "CNN graphdata endpoint";
  }
  return "Live feed";
}

function getSourcePillText(series) {
  if (series.source === "empty") {
    return "no data";
  }
  return series.source;
}

function getSentimentBands(series) {
  if (series.id !== "cnn_fear") {
    return null;
  }

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
  refs.panelTime.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  refs.taskbarClock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toggleFlyout() {
  state.isOpen = true;
  updateFlyoutVisibility();
}

function closeFlyout() {
  state.isOpen = true;
  updateFlyoutVisibility();
}

function updateFlyoutVisibility() {
  refs.trayButton.setAttribute("aria-expanded", String(state.isOpen));
  refs.flyout.setAttribute("aria-hidden", String(!state.isOpen));
  refs.backdrop.hidden = !state.isOpen;
}

function handleOutsideClick(event) {
  return event;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date) {
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAxisDate(timestamp) {
  return new Date(timestamp).toLocaleDateString([], {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeExternalDate(rawDate) {
  if (rawDate == null) {
    return "";
  }

  if (typeof rawDate === "number") {
    return new Date(rawDate).toISOString().slice(0, 10);
  }

  if (/^\d+$/.test(String(rawDate))) {
    const numeric = Number.parseInt(rawDate, 10);
    const millis = String(rawDate).length === 10 ? numeric * 1000 : numeric;
    return new Date(millis).toISOString().slice(0, 10);
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function getNearestPointIndex(xPositions, x) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < xPositions.length; index += 1) {
    const distance = Math.abs(xPositions[index] - x);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }
  return nearestIndex;
}
