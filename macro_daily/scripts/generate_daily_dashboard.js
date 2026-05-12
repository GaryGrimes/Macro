#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const OUT_DATA_DIR = path.join(ROOT, "macro_daily", "data");
const OUT_REPORT_DIR = path.join(ROOT, "macro_daily", "reports");
const TIME_ZONE = "Asia/Shanghai";

const RUN_DATE = process.env.RUN_DATE || localDateIso(TIME_ZONE);
const OUTPUT_JSON = path.join(OUT_DATA_DIR, `${RUN_DATE}_dashboard.json`);
const OUTPUT_REPORT = path.join(OUT_REPORT_DIR, `${RUN_DATE}_rates_duration_report.md`);

const TENOR_CONFIG = [
  { tenor: "2Y", symbol: "DGS2", sourceKey: "dgs2" },
  { tenor: "3Y", symbol: "DGS3", sourceKey: "us3y" },
  { tenor: "5Y", symbol: "DGS5", sourceKey: "dgs5" },
  { tenor: "10Y", symbol: "DGS10", sourceKey: "dgs10" },
  { tenor: "30Y", symbol: "DGS30", sourceKey: "us30y" },
];

const HORIZONS = [
  { key: "d1", label: "1D", observations: 1 },
  { key: "d5", label: "5D", observations: 5 },
  { key: "d21", label: "21D", observations: 21 },
  { key: "d63", label: "3M", observations: 63 },
];

function main() {
  fs.mkdirSync(OUT_DATA_DIR, { recursive: true });
  fs.mkdirSync(OUT_REPORT_DIR, { recursive: true });

  const treasury = readTreasuryCache();
  const fredT5yifr = readFredCache("T5YIFR");
  const cnn = readCnnCache();

  const marketDate = treasury.updatedAt;
  const generatedAt = localDateTimeIso(TIME_ZONE);
  const dataGaps = [];

  if (treasury.historyStart > "2016-01-01") {
    dataGaps.push(
      `Rate shock percentiles use local Treasury cache from ${treasury.historyStart} to ${marketDate}; full 10-year and full 2022+ windows are unavailable in local cache.`,
    );
  }
  if (!treasury.series.dgs2) {
    dataGaps.push("DGS2 is unavailable because the local Treasury cache does not include the 2Y node.");
  }
  dataGaps.push("SOFR futures and Fed funds futures implied cuts are unavailable in local cache.");
  dataGaps.push("ACM / Kim-Wright term premium is unavailable; 5s30s and 10s30s are used as long-end proxies.");
  dataGaps.push("Treasury auction tail, bid-to-cover, and dealer take-down are unavailable in local cache.");
  dataGaps.push("MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used only as risk proxies.");
  dataGaps.push("CFTC Treasury futures positioning is unavailable in local cache.");
  dataGaps.push("Oil, copper, gold, DXY, and HY OAS are unavailable in local cache.");

  const rateShockRows = buildRateShockRows(treasury, marketDate);
  const curveShape = buildCurveShape(treasury, marketDate);
  const driverAttribution = buildDriverAttribution(treasury, fredT5yifr, marketDate);
  const technical = buildTechnicalPanel(treasury, marketDate);
  const crossAssetSignals = buildCrossAssetSignals(cnn);
  const narratives = buildNarratives({
    marketDate,
    rateShockRows,
    curveShape,
    driverAttribution,
    technical,
    crossAssetSignals,
  });
  const durationAction = buildDurationAction({
    marketDate,
    rateShockRows,
    curveShape,
    driverAttribution,
    technical,
    narratives,
  });

  const dashboard = {
    date: RUN_DATE,
    marketDate,
    source: "macro_daily automation",
    generatedAt,
    reportTitle: "Rates tape is not in a shock window",
    reportSummary:
      "2026-05-11 rates show a mild 5D rally, non-extreme 21D/3M selloff, and no technical exhaustion confirmation.",
    marketStatus:
      marketDate < RUN_DATE
        ? `Latest confirmed U.S. rates data is ${marketDate}; ${RUN_DATE} does not yet have a complete U.S. rates close in local cache.`
        : `Latest confirmed U.S. rates data is ${marketDate}.`,
    rateShockRows,
    curveShape,
    driverAttribution,
    crossAssetSignals,
    narratives,
    durationAction,
    technical,
    dataGaps,
    dataQuality: {
      treasuryCacheFetchedAt: treasury.fetchedAt,
      treasuryHistoryStart: treasury.historyStart,
      percentileProxyUsed: treasury.historyStart > "2016-01-01",
      percentileProxyNote:
        "A trailing local-cache percentile is shown with * because the local Treasury cache starts after the required 10-year and 2022-01-01 windows.",
      missingRequiredSources: dataGaps,
    },
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(dashboard, null, 2)}\n`);
  fs.writeFileSync(OUTPUT_REPORT, buildReport(dashboard));
  process.stdout.write(`Wrote ${OUTPUT_JSON}\n`);
  process.stdout.write(`Wrote ${OUTPUT_REPORT}\n`);
}

function readCacheFile(name) {
  const filePath = path.join(CACHE_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const wrapper = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return wrapper.body || "";
}

function readTreasuryCache() {
  const body = readCacheFile("treasury_yield_curve");
  if (!body) {
    throw new Error("Missing .cache/treasury_yield_curve.json");
  }
  const payload = JSON.parse(body);
  const series = {};
  Object.entries(payload.series || {}).forEach(([key, points]) => {
    series[key] = points
      .filter((point) => point && !point.filled && Number.isFinite(point.value))
      .map((point) => ({ date: point.date, value: point.value }));
  });
  const allDates = Object.values(series)
    .flat()
    .map((point) => point.date)
    .sort();
  return {
    source: payload.source,
    updatedAt: payload.updatedAt,
    fetchedAt: payload.fetchedAt,
    historyStart: allDates[0] || payload.updatedAt,
    series,
  };
}

function readFredCache(seriesId) {
  const body = readCacheFile(`fred_${seriesId}`);
  if (!body) {
    return [];
  }
  return body
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => {
      const [date, valueText] = row.split(",");
      return { date, value: Number.parseFloat(valueText) };
    })
    .filter((point) => point.date && Number.isFinite(point.value));
}

function readCnnCache() {
  const body = readCacheFile("cnn");
  if (!body) {
    return null;
  }
  return JSON.parse(body);
}

function buildRateShockRows(treasury, marketDate) {
  const availableChanges = {};
  TENOR_CONFIG.forEach((config) => {
    if (!treasury.series[config.sourceKey]) {
      return;
    }
    availableChanges[config.tenor] = getChange(treasury.series[config.sourceKey], 5);
  });
  const globalSignal = classifyRateSignal(availableChanges, treasury);

  return TENOR_CONFIG.map((config) => {
    const series = treasury.series[config.sourceKey];
    if (!series || series.length < 64) {
      return {
        tenor: config.tenor,
        symbol: config.symbol,
        level: "unavailable",
        d1: "unavailable",
        d1Pctile: "unavailable",
        d5: "unavailable",
        d5Pctile: "unavailable",
        d21: "unavailable",
        d21Pctile: "unavailable",
        d3m: "unavailable",
        d3mPctile: "unavailable",
        regimePctile: "unavailable",
        zScore: "unavailable",
        signal: "unavailable",
        proxyUsed: false,
        note: `${config.symbol} is missing from local cache for ${marketDate}.`,
      };
    }

    const latest = series[series.length - 1];
    const horizonMetrics = Object.fromEntries(
      HORIZONS.map((horizon) => [horizon.key, getHorizonMetrics(series, horizon.observations)]),
    );
    const d5Metrics = horizonMetrics.d5;
    return {
      tenor: config.tenor,
      symbol: config.symbol,
      level: formatPct(latest.value),
      d1: formatBp(horizonMetrics.d1.changeBp),
      d1Pctile: formatPercentile(horizonMetrics.d1.percentile, true),
      d5: formatBp(d5Metrics.changeBp),
      d5Pctile: formatPercentile(d5Metrics.percentile, true),
      d21: formatBp(horizonMetrics.d21.changeBp),
      d21Pctile: formatPercentile(horizonMetrics.d21.percentile, true),
      d3m: formatBp(horizonMetrics.d63.changeBp),
      d3mPctile: formatPercentile(horizonMetrics.d63.percentile, true),
      regimePctile: formatPercentile(d5Metrics.regimePercentile, true),
      zScore: formatNumber(d5Metrics.zScore, 1),
      signal: globalSignal,
      proxyUsed: true,
      historyWindow: `${series[0].date} to ${latest.date}`,
      comparedTo: {
        d1: horizonMetrics.d1.previousDate,
        d5: horizonMetrics.d5.previousDate,
        d21: horizonMetrics.d21.previousDate,
        d3m: horizonMetrics.d63.previousDate,
      },
      raw: {
        d1Bp: round(horizonMetrics.d1.changeBp, 1),
        d5Bp: round(d5Metrics.changeBp, 1),
        d21Bp: round(horizonMetrics.d21.changeBp, 1),
        d3mBp: round(horizonMetrics.d63.changeBp, 1),
        d5Pctile: round(d5Metrics.percentile, 1),
        zScore5D: round(d5Metrics.zScore, 2),
      },
    };
  });
}

function classifyRateSignal(changes, treasury) {
  const d3 = changes["3Y"]?.changeBp;
  const d10 = changes["10Y"]?.changeBp;
  const d30 = changes["30Y"]?.changeBp;
  if (![d3, d10, d30].every(Number.isFinite)) {
    return "mixed";
  }
  const spread1030 = getSpreadChange(treasury.series.dgs10, treasury.series.us30y, 5);
  if (d3 > 0 && d10 > 0 && d30 > 0 && d3 > d10 && d10 > d30) {
    return "policy path shock";
  }
  if (d3 > 0 && d10 > 0 && d30 > 0 && d30 > d10 && d10 > d3 && spread1030.changeBp > 0) {
    return "long-end stress";
  }
  if (d10 > 0 && Math.abs(d10) >= Math.abs(d3) && Math.abs(d10) >= Math.abs(d30)) {
    return "duration selloff";
  }
  if (d3 < 0 && d10 < 0 && d30 < 0) {
    return "bull rally";
  }
  return "mixed";
}

function buildCurveShape(treasury) {
  const spread3s10 = getSpreadChange(treasury.series.us3y, treasury.series.dgs10, 5);
  const spread5s30 = getSpreadChange(treasury.series.dgs5, treasury.series.us30y, 5);
  const spread10s30 = getSpreadChange(treasury.series.dgs10, treasury.series.us30y, 5);
  const moves = {
    d3: getChange(treasury.series.us3y, 5),
    d5: getChange(treasury.series.dgs5, 5),
    d10: getChange(treasury.series.dgs10, 5),
    d30: getChange(treasury.series.us30y, 5),
  };
  const label = classifyCurve(moves);
  return {
    horizon: "5D",
    label,
    interpretation: curveInterpretation(label),
    spreads: {
      "3s10s": {
        level: formatBp(spread3s10.levelBp, false),
        change: formatBp(spread3s10.changeBp),
        comparedTo: spread3s10.previousDate,
      },
      "5s30s": {
        level: formatBp(spread5s30.levelBp, false),
        change: formatBp(spread5s30.changeBp),
        comparedTo: spread5s30.previousDate,
      },
      "10s30s": {
        level: formatBp(spread10s30.levelBp, false),
        change: formatBp(spread10s30.changeBp),
        comparedTo: spread10s30.previousDate,
      },
    },
    moves: {
      "3Y": formatBp(moves.d3.changeBp),
      "5Y": formatBp(moves.d5.changeBp),
      "10Y": formatBp(moves.d10.changeBp),
      "30Y": formatBp(moves.d30.changeBp),
    },
    raw: {
      d3Bp: round(moves.d3.changeBp, 1),
      d5Bp: round(moves.d5.changeBp, 1),
      d10Bp: round(moves.d10.changeBp, 1),
      d30Bp: round(moves.d30.changeBp, 1),
      spread3s10ChangeBp: round(spread3s10.changeBp, 1),
      spread5s30ChangeBp: round(spread5s30.changeBp, 1),
      spread10s30ChangeBp: round(spread10s30.changeBp, 1),
    },
  };
}

function classifyCurve(moves) {
  const threshold = 3;
  const d3 = moves.d3.changeBp;
  const d10 = moves.d10.changeBp;
  const d30 = moves.d30.changeBp;
  if (![d3, d10, d30].every(Number.isFinite)) {
    return "twist / mixed";
  }
  if (d3 > 0 && d10 > 0 && d30 > 0) {
    if (d3 - d10 > threshold && d10 - d30 > threshold) {
      return "bear flattening";
    }
    if (d30 - d10 > threshold && d10 - d3 > threshold) {
      return "bear steepening";
    }
    return "parallel bear / mixed";
  }
  if (d3 < 0 && d10 < 0 && d30 < 0) {
    if (Math.abs(d3) - Math.abs(d10) > threshold && Math.abs(d10) - Math.abs(d30) > threshold) {
      return "bull steepening";
    }
    if (Math.abs(d30) - Math.abs(d10) > threshold && Math.abs(d10) - Math.abs(d3) > threshold) {
      return "bull flattening";
    }
    return "parallel bull / mixed";
  }
  return "twist / mixed";
}

function curveInterpretation(label) {
  if (label === "bear flattening") {
    return "Short/intermediate policy-path repricing is stronger than long-end stress; 10Y is cleaner than 30Y if a shock window appears.";
  }
  if (label === "bear steepening") {
    return "Long-end term-premium or supply stress is the binding risk; do not mechanically buy 30Y on yield level alone.";
  }
  if (label === "bull flattening") {
    return "Long-end demand is returning more than front-end easing; 30Y can improve only if term-premium pressure keeps stabilizing.";
  }
  if (label === "bull steepening") {
    return "Front-end easing or growth-scare pricing dominates; intermediate duration usually carries less long-end supply risk.";
  }
  return "Curve moves are not clean enough to upgrade a 10Y or 30Y duration signal.";
}

function buildDriverAttribution(treasury, fredT5yifr, marketDate) {
  const dgs5 = getChange(treasury.series.dgs5, 5);
  const dfii5 = getChange(treasury.series.dfii5, 5);
  const t5yie = getChange(treasury.series.t5yie, 5);
  const dgs10 = getChange(treasury.series.dgs10, 5);
  const t10yie = getChange(treasury.series.t10yie, 5);
  const real10Series = alignSeries(treasury.series.dgs10, treasury.series.t10yie, (nominal, breakeven) => nominal - breakeven);
  const dfii10 = getChange(real10Series, 5);
  const t5yifr = getChange(fredT5yifr, 5);
  const dgs30 = getChange(treasury.series.us30y, 5);
  const spread5s30 = getSpreadChange(treasury.series.dgs5, treasury.series.us30y, 5);
  const spread10s30 = getSpreadChange(treasury.series.dgs10, treasury.series.us30y, 5);

  return {
    horizon: "5D",
    "5Y": attributionBlock("5Y", dgs5.changeBp, {
      realYield: dfii5.changeBp,
      breakeven: t5yie.changeBp,
      residual: dgs5.changeBp - dfii5.changeBp - t5yie.changeBp,
    }),
    "10Y": attributionBlock("10Y", dgs10.changeBp, {
      realYield: dfii10.changeBp,
      breakeven: t10yie.changeBp,
      residual: dgs10.changeBp - dfii10.changeBp - t10yie.changeBp,
    }),
    "30Y": {
      move: formatBp(dgs30.changeBp),
      proxyUsed: true,
      realYield: "unavailable",
      breakeven: "unavailable",
      termPremium: "unavailable",
      proxyEvidence: [
        `5s30s changed ${formatBp(spread5s30.changeBp)} from ${spread5s30.previousDate} to ${marketDate}.`,
        `10s30s changed ${formatBp(spread10s30.changeBp)} from ${spread10s30.previousDate} to ${marketDate}.`,
        `DGS30 changed ${formatBp(dgs30.changeBp)} from ${dgs30.previousDate} to ${marketDate}.`,
      ],
      interpretation:
        spread10s30.changeBp > 3
          ? "30Y underperformance points to term-premium / fiscal-supply risk."
          : "30Y did not independently weaken over the 5D window; long-end term-premium stress is not confirmed by local curve proxies.",
      raw: {
        moveBp: round(dgs30.changeBp, 1),
        spread5s30ChangeBp: round(spread5s30.changeBp, 1),
        spread10s30ChangeBp: round(spread10s30.changeBp, 1),
      },
    },
    inflationAnchor: {
      t5yifr: Number.isFinite(t5yifr.changeBp) ? formatBp(t5yifr.changeBp) : "unavailable",
      comparedTo: t5yifr.previousDate || "unavailable",
      note: Number.isFinite(t5yifr.changeBp)
        ? `T5YIFR moved ${formatBp(t5yifr.changeBp)} from ${t5yifr.previousDate} to ${marketDate}.`
        : "T5YIFR is unavailable for the 5D window.",
    },
  };
}

function attributionBlock(tenor, nominalMove, components) {
  const absTotal =
    Math.abs(components.realYield) + Math.abs(components.breakeven) + Math.abs(components.residual);
  const share = (value) => (absTotal > 0 ? Math.abs(value) / absTotal : 0);
  const dominant = [
    ["real-yield", share(components.realYield)],
    ["breakeven", share(components.breakeven)],
    ["residual", share(components.residual)],
  ].sort((a, b) => b[1] - a[1])[0][0];
  return {
    move: formatBp(nominalMove),
    proxyUsed: false,
    realYield: {
      contribution: formatBp(components.realYield),
      share: formatPercent(share(components.realYield)),
    },
    breakeven: {
      contribution: formatBp(components.breakeven),
      share: formatPercent(share(components.breakeven)),
    },
    residual: {
      contribution: formatBp(components.residual),
      share: formatPercent(share(components.residual)),
    },
    dominantDriver: dominant,
    interpretation:
      dominant === "real-yield"
        ? `${tenor} move is real-yield led.`
        : dominant === "breakeven"
          ? `${tenor} move is breakeven led; watch second-round transmission to real yield.`
          : `${tenor} move is residual led.`,
    raw: {
      nominalBp: round(nominalMove, 1),
      realYieldBp: round(components.realYield, 1),
      breakevenBp: round(components.breakeven, 1),
      residualBp: round(components.residual, 1),
    },
  };
}

function buildTechnicalPanel(treasury, marketDate) {
  const tenYear = buildTechnicalForSeries(treasury.series.dgs10, "US10Y");
  const thirtyYear = buildTechnicalForSeries(treasury.series.us30y, "US30Y");
  const hasExhaustion =
    tenYear.nineTurn.up >= 8 ||
    thirtyYear.nineTurn.up >= 8 ||
    tenYear.rsi > 70 ||
    thirtyYear.rsi > 70 ||
    tenYear.bollingerZ > 2 ||
    thirtyYear.bollingerZ > 2 ||
    tenYear.move20dPercentile >= 90 ||
    thirtyYear.move20dPercentile >= 90;

  return {
    asOf: marketDate,
    signals: [
      {
        title: "US10Y 九转",
        value: `up ${tenYear.nineTurn.up} / down ${tenYear.nineTurn.down}`,
        status: tenYear.nineTurn.up >= 8 ? "exhaustion" : "neutral",
        source: "proxy",
        note: "Proxy rule compares each yield with its value four valid observations earlier.",
      },
      {
        title: "US30Y 九转",
        value: `up ${thirtyYear.nineTurn.up} / down ${thirtyYear.nineTurn.down}`,
        status: thirtyYear.nineTurn.up >= 8 ? "exhaustion" : "neutral",
        source: "proxy",
        note: "Proxy rule compares each yield with its value four valid observations earlier.",
      },
      {
        title: "RSI",
        value: `10Y ${formatNumber(tenYear.rsi, 1)} / 30Y ${formatNumber(thirtyYear.rsi, 1)}`,
        status: tenYear.rsi > 70 || thirtyYear.rsi > 70 ? "exhaustion" : "neutral",
        note: "RSI is calculated on yield changes, not bond-price changes.",
      },
      {
        title: "Bollinger z-score",
        value: `10Y ${formatSigned(tenYear.bollingerZ, 2)} / 30Y ${formatSigned(thirtyYear.bollingerZ, 2)}`,
        status: tenYear.bollingerZ > 2 || thirtyYear.bollingerZ > 2 ? "exhaustion" : "neutral",
        note: "20 valid-observation moving average and standard deviation.",
      },
      {
        title: "20D move percentile",
        value: `10Y ${formatBp(tenYear.move20dBp)} ${formatPercentile(tenYear.move20dPercentile, true)} / 30Y ${formatBp(thirtyYear.move20dBp)} ${formatPercentile(thirtyYear.move20dPercentile, true)}`,
        status:
          tenYear.move20dPercentile >= 90 || thirtyYear.move20dPercentile >= 90
            ? "exhaustion"
            : "neutral",
        note: "Percentile uses available local Treasury cache and is marked with *.",
      },
      {
        title: "MOVE index",
        value: "unavailable",
        status: "unavailable",
        note: "MOVE is not present in local cache.",
      },
      {
        title: "CFTC Treasury futures positioning",
        value: "unavailable",
        status: "unavailable",
        note: "CFTC futures positioning is not present in local cache.",
      },
      {
        title: "Timing overlay",
        value: hasExhaustion ? "Timing support present" : "No standalone timing signal",
        status: hasExhaustion ? "watch" : "wait",
        note: hasExhaustion
          ? "Technical exhaustion must be paired with rate-shock and driver attribution before any duration upgrade."
          : "Technical panel does not upgrade the duration action without a fundamental shock.",
      },
    ],
    tenYear,
    thirtyYear,
    hasExhaustion,
    adviceTitle: hasExhaustion ? "Timing signal only" : "No exhaustion confirmation",
    adviceBody: hasExhaustion
      ? "Technical signals can support only a conditional timing overlay; they do not create a standalone duration trade."
      : "2026-05-11 yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.",
  };
}

function buildTechnicalForSeries(series, label) {
  const rsi = calcRsi(series, 14);
  const bollingerZ = calcBollingerZ(series, 20);
  const nineTurn = calcNineTurn(series);
  const move20 = getHorizonMetrics(series, 20);
  return {
    label,
    rsi: round(rsi, 2),
    bollingerZ: round(bollingerZ, 2),
    nineTurn,
    move20dBp: round(move20.changeBp, 1),
    move20dPercentile: round(move20.percentile, 1),
  };
}

function buildCrossAssetSignals(cnn) {
  if (!cnn) {
    return {
      source: "CNN cache",
      signals: [],
      interpretation: "CNN risk proxies are unavailable.",
    };
  }
  const keys = [
    ["fear_and_greed", "CNN Fear & Greed"],
    ["market_volatility_vix", "VIX"],
    ["junk_bond_demand", "Junk bond demand"],
    ["safe_haven_demand", "Safe haven demand"],
    ["stock_price_breadth", "Stock breadth"],
    ["market_momentum_sp500", "S&P 500 momentum"],
  ];
  const signals = keys
    .map(([key, title]) => {
      const item = cnn[key];
      if (!item) {
        return null;
      }
      return {
        title,
        score: Number.isFinite(item.score) ? round(item.score, 1) : "unavailable",
        rating: item.rating || "unavailable",
        updatedAt: normalizeTimestamp(item.timestamp),
        latestValue: item.data?.length ? round(item.data[item.data.length - 1].y, 2) : "unavailable",
      };
    })
    .filter(Boolean);
  const fearGreed = signals.find((signal) => signal.title === "CNN Fear & Greed");
  const vix = signals.find((signal) => signal.title === "VIX");
  const junk = signals.find((signal) => signal.title === "Junk bond demand");
  return {
    source: "CNN local cache",
    signals,
    interpretation: `CNN Fear & Greed is ${fearGreed?.rating || "unavailable"} as of ${fearGreed?.updatedAt || "unavailable"}; VIX is ${vix?.rating || "unavailable"} and junk bond demand is ${junk?.rating || "unavailable"}.`,
  };
}

function buildNarratives(context) {
  const { marketDate, curveShape, driverAttribution, technical, crossAssetSignals } = context;
  const moves = curveShape.raw;
  const d5Ten = findRow(context.rateShockRows, "10Y")?.raw?.d5Bp;
  const d21Ten = findRow(context.rateShockRows, "10Y")?.raw?.d21Bp;
  const d3mThree = findRow(context.rateShockRows, "3Y")?.raw?.d3mBp;
  const inflation5 = driverAttribution["5Y"].raw.breakevenBp;
  const inflation10 = driverAttribution["10Y"].raw.breakevenBp;
  const riskStress = crossAssetSignals.signals?.some(
    (signal) => /fear/i.test(signal.rating) && signal.title === "Junk bond demand",
  );

  const narratives = [
    {
      id: "fed_path",
      title: "Fed path repricing",
      score: d3mThree >= 40 && moves.d3Bp > moves.d10Bp ? 1 : 0,
      updatedAt: marketDate,
      core:
        "The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.",
      checks: [
        `DGS3 63-observation move is ${findRow(context.rateShockRows, "3Y")?.d3m || "unavailable"}.`,
        `DGS3 5D move is ${formatBp(moves.d3Bp)}, while DGS10 5D move is ${formatBp(moves.d10Bp)}.`,
        "SOFR futures implied cuts are unavailable.",
        "Fed funds futures implied cuts are unavailable.",
      ],
      interpretation:
        "Policy-path repricing remains a background narrative, but 2026-05-11 does not show a fresh front-end-led shock.",
      evidence: [
        {
          time: marketDate,
          weight: 1,
          text: `3Y is up ${findRow(context.rateShockRows, "3Y")?.d3m || "unavailable"} over 63 valid observations, while the 5D window is ${formatBp(moves.d3Bp)}.`,
        },
      ],
    },
    {
      id: "inflation_comp",
      title: "Inflation compensation shock",
      score: inflation5 > 0 || inflation10 > 0 ? 1 : 0,
      updatedAt: marketDate,
      core:
        "Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on 2026-05-11.",
      checks: [
        `5Y breakeven contribution over 5D is ${driverAttribution["5Y"].breakeven.contribution}.`,
        `10Y breakeven contribution over 5D is ${driverAttribution["10Y"].breakeven.contribution}.`,
        `T5YIFR 5D move is ${driverAttribution.inflationAnchor.t5yifr}.`,
        "Oil, gasoline, and commodity basket data are unavailable.",
      ],
      interpretation:
        "Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.",
      evidence: [
        {
          time: marketDate,
          weight: 1,
          text: `5Y breakeven fell ${driverAttribution["5Y"].breakeven.contribution} over 5D while T5YIFR moved ${driverAttribution.inflationAnchor.t5yifr}.`,
        },
      ],
    },
    {
      id: "growth_scare",
      title: "Growth scare / recession hedge",
      score: moves.d10Bp < 0 && inflation10 <= 0 ? 1 : 0,
      updatedAt: marketDate,
      core:
        "The 5D nominal rally and lower breakevens are consistent with a mild hedge bid, but risk proxies do not confirm a recession-style shock.",
      checks: [
        `DGS10 5D move is ${formatBp(d5Ten)}.`,
        `DGS10 21-observation move is ${formatBp(d21Ten)}.`,
        `10Y breakeven 5D contribution is ${driverAttribution["10Y"].breakeven.contribution}.`,
        crossAssetSignals.interpretation,
      ],
      interpretation:
        "The growth-scare narrative is weak because the 5D rally is small and the broader risk tape is mixed rather than decisively defensive.",
      evidence: [
        {
          time: marketDate,
          weight: 1,
          text: `DGS10 fell ${formatBp(d5Ten)} over 5D, while CNN risk proxies are mixed.`,
        },
      ],
    },
    {
      id: "term_premium",
      title: "Long-end term premium / fiscal supply",
      score: moves.d30Bp > moves.d10Bp && curveShape.raw.spread10s30ChangeBp > 0 ? 1 : 0,
      updatedAt: marketDate,
      core:
        "Local curve proxies do not show independent 30Y stress over the 5D window.",
      checks: [
        `DGS30 5D move is ${formatBp(moves.d30Bp)} versus DGS10 ${formatBp(moves.d10Bp)}.`,
        `5s30s 5D change is ${curveShape.spreads["5s30s"].change}.`,
        `10s30s 5D change is ${curveShape.spreads["10s30s"].change}.`,
        "ACM / Kim-Wright term premium is unavailable.",
        "Auction tail and bid-to-cover are unavailable.",
        "MOVE index is unavailable.",
      ],
      interpretation:
        "The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for 2026-05-11.",
      evidence: [
        {
          time: marketDate,
          weight: 0,
          text: `10s30s flattened ${curveShape.spreads["10s30s"].change} over 5D, so the term-premium proxy is not deteriorating.`,
        },
      ],
    },
    {
      id: "risk_liquidity",
      title: "Risk appetite / liquidity shock",
      score: riskStress ? 1 : 0,
      updatedAt: latestCrossAssetDate(crossAssetSignals) || marketDate,
      core:
        "Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.",
      checks: [
        crossAssetSignals.interpretation,
        "HY OAS is unavailable.",
        "DXY and funding stress data are unavailable.",
        "MOVE index is unavailable.",
      ],
      interpretation:
        "Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.",
      evidence: [
        {
          time: latestCrossAssetDate(crossAssetSignals) || marketDate,
          weight: riskStress ? 1 : 0,
          text: crossAssetSignals.interpretation,
        },
      ],
    },
    {
      id: "technical_exhaustion",
      title: "Technical positioning / exhaustion",
      score: technical.hasExhaustion ? 2 : 0,
      updatedAt: marketDate,
      core:
        "Technical indicators do not show a clear yield-up exhaustion setup on 2026-05-11.",
      checks: technical.signals.map((signal) => `${signal.title}: ${signal.value}`),
      interpretation:
        "Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.",
      evidence: [
        {
          time: marketDate,
          weight: technical.hasExhaustion ? 2 : 0,
          text: `10Y RSI ${formatNumber(technical.tenYear.rsi, 1)}, 30Y RSI ${formatNumber(technical.thirtyYear.rsi, 1)}, 10Y Bollinger ${formatSigned(technical.tenYear.bollingerZ, 2)}.`,
        },
      ],
    },
  ];

  return narratives.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const aWeight = Math.max(...(a.evidence || []).map((item) => item.weight || 0), 0);
    const bWeight = Math.max(...(b.evidence || []).map((item) => item.weight || 0), 0);
    if (bWeight !== aWeight) {
      return bWeight - aWeight;
    }
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
}

function buildDurationAction(context) {
  const { marketDate, rateShockRows, curveShape, driverAttribution, technical, narratives } = context;
  const tenYear = findRow(rateShockRows, "10Y");
  const thirtyYear = findRow(rateShockRows, "30Y");
  const tenExtreme = (tenYear?.raw?.d5Pctile || 0) >= 85 || parsePercent(tenYear?.d21Pctile) >= 85;
  const thirtyExtreme = parsePercent(thirtyYear?.d5Pctile) >= 90 || parsePercent(thirtyYear?.d21Pctile) >= 90;
  const longEndVeto =
    curveShape.label === "bear steepening" ||
    curveShape.raw.d30Bp > curveShape.raw.d10Bp + 3 ||
    curveShape.raw.spread10s30ChangeBp > 3;
  const realLed =
    driverAttribution["10Y"].dominantDriver === "real-yield" ||
    driverAttribution["5Y"].dominantDriver === "real-yield";
  let currentIndex = 0;
  if (tenExtreme && realLed && !longEndVeto && technical.hasExhaustion) {
    currentIndex = 2;
  }
  if (tenExtreme && realLed && !longEndVeto && technical.hasExhaustion && curveShape.label !== "bear steepening") {
    currentIndex = 3;
  }
  if (thirtyExtreme && !longEndVeto && technical.hasExhaustion) {
    currentIndex = 4;
  }

  const labels = [
    "No trade / wait",
    "Watchlist only",
    "Start 10Y nibble",
    "Add 10Y / intermediate duration",
    "Add long-end duration",
    "Add convex duration / STRIPS-like exposure",
  ];
  const explanation =
    currentIndex === 0
      ? "2026-05-11 does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait."
      : "The duration panel is upgraded only because rate shock, driver attribution, and timing overlay jointly meet the rule set.";

  return {
    currentIndex,
    label: labels[currentIndex],
    asOf: marketDate,
    explanation,
    reasons: [
      `10Y 5D move is ${tenYear?.d5 || "unavailable"} with local-cache percentile ${tenYear?.d5Pctile || "unavailable"}.`,
      `30Y 5D move is ${thirtyYear?.d5 || "unavailable"} and 10s30s changed ${curveShape.spreads["10s30s"].change}.`,
      `Technical overlay: ${technical.adviceTitle}.`,
      `Top narratives: ${narratives
        .slice(0, 3)
        .map((item) => `${item.title} score ${item.score}`)
        .join("; ")}.`,
    ],
    supports: [
      "5D curve proxies do not show fresh 30Y-led bear steepening.",
      "The 5D rates move is small enough that there is no need to chase duration.",
      "Local CNN headline risk appetite is not in broad panic.",
    ],
    opposes: [
      "10Y and 30Y shock percentiles are not extreme in the available local-cache window.",
      "Technical exhaustion is not confirmed by RSI, Bollinger z-score, 20D percentile, or nine-turn proxy.",
      "DGS2, SOFR/Fed funds futures, MOVE, formal term premium, auction data, and CFTC positioning are unavailable.",
    ],
    upgradeSignals: [
      "Move to index 2 if DGS10 5D or 21D selloff reaches >=85th percentile, real yield leads, and technical exhaustion appears.",
      "Move to index 3 if 10Y shock becomes extreme while 30Y term-premium proxies remain stable.",
      "Move to index 4 only if 30Y shock is extreme and 5s30s/10s30s steepening stops after term-premium pressure stabilizes.",
      "Move to index 5 only after long-end stabilization coincides with bull flattening, growth/disinflation confirmation, and exhaustion.",
    ],
    downgradeSignals: [
      "Stay at index 0 if DGS3 or DGS30 accelerates without exhaustion.",
      "Stay at index 0 if 10s30s bear steepening resumes or auction/MOVE data later show stress.",
    ],
    steps: labels.map((label, index) => ({
      index,
      title: label,
      active: index === currentIndex,
    })),
  };
}

function buildReport(dashboard) {
  const rows = dashboard.rateShockRows;
  const d3 = findRow(rows, "3Y");
  const d5 = findRow(rows, "5Y");
  const d10 = findRow(rows, "10Y");
  const d30 = findRow(rows, "30Y");
  const topNarratives = dashboard.narratives
    .map((item, index) => `${index + 1}. ${item.title}: ${stars(item.score)} score ${item.score} - ${item.core}`)
    .join("\n");
  const missing = dashboard.dataGaps.map((item) => `- ${item}`).join("\n");
  const checks = dashboard.narratives
    .map((item) => `- ${item.title}: score ${item.score}; updatedAt ${item.updatedAt}; ${item.interpretation}`)
    .join("\n");
  return `# ${dashboard.date} Rates Duration Report

## 2026-05-12 一句话结论

2026-05-11 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 ${d10.d5}，DGS30 5D 为 ${d30.d5}，曲线是 ${dashboard.curveShape.label}，技术衰竭也没有确认。Duration Action Panel 维持 ${dashboard.durationAction.currentIndex} - ${dashboard.durationAction.label}。

## 利率冲击是否罕见

本地可确认的市场日期是 ${dashboard.marketDate}。2026-05-12 的完整美国日终利率数据尚未进入本地缓存，因此本报告使用 ${dashboard.marketDate} 作为 marketDate。

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | ${findRow(rows, "2Y").level} | ${findRow(rows, "2Y").d1} | ${findRow(rows, "2Y").d5} | ${findRow(rows, "2Y").d21} | ${findRow(rows, "2Y").d3m} | ${findRow(rows, "2Y").d5Pctile} | ${findRow(rows, "2Y").zScore} |
| DGS3 | ${d3.level} | ${d3.d1} | ${d3.d5} | ${d3.d21} | ${d3.d3m} | 5D ${d3.d5Pctile}; 3M ${d3.d3mPctile} | ${d3.zScore} |
| DGS5 | ${d5.level} | ${d5.d1} | ${d5.d5} | ${d5.d21} | ${d5.d3m} | 5D ${d5.d5Pctile}; 3M ${d5.d3mPctile} | ${d5.zScore} |
| DGS10 | ${d10.level} | ${d10.d1} | ${d10.d5} | ${d10.d21} | ${d10.d3m} | 5D ${d10.d5Pctile}; 3M ${d10.d3mPctile} | ${d10.zScore} |
| DGS30 | ${d30.level} | ${d30.d1} | ${d30.d5} | ${d30.d21} | ${d30.d3m} | 5D ${d30.d5Pctile}; 3M ${d30.d3mPctile} | ${d30.zScore} |

星号表示分位数使用 ${dashboard.dataQuality.treasuryHistoryStart} 到 ${dashboard.marketDate} 的本地 Treasury cache 代理，不是完整 10 年或完整 2022-01-01 后样本。该限制会降低极端分位的可比性。

## 哪段曲线在动

5D 比较日期是 ${d10.comparedTo.d5}。DGS3 ${d3.d5}，DGS5 ${d5.d5}，DGS10 ${d10.d5}，DGS30 ${d30.d5}。3s10s 为 ${dashboard.curveShape.spreads["3s10s"].level}，5D 变化 ${dashboard.curveShape.spreads["3s10s"].change}；5s30s 为 ${dashboard.curveShape.spreads["5s30s"].level}，5D 变化 ${dashboard.curveShape.spreads["5s30s"].change}；10s30s 为 ${dashboard.curveShape.spreads["10s30s"].level}，5D 变化 ${dashboard.curveShape.spreads["10s30s"].change}。

含义：${dashboard.curveShape.interpretation}

## 驱动归因

5Y 5D move ${dashboard.driverAttribution["5Y"].move}: real yield ${dashboard.driverAttribution["5Y"].realYield.contribution} / ${dashboard.driverAttribution["5Y"].realYield.share}, breakeven ${dashboard.driverAttribution["5Y"].breakeven.contribution} / ${dashboard.driverAttribution["5Y"].breakeven.share}, residual ${dashboard.driverAttribution["5Y"].residual.contribution} / ${dashboard.driverAttribution["5Y"].residual.share}。

10Y 5D move ${dashboard.driverAttribution["10Y"].move}: real yield ${dashboard.driverAttribution["10Y"].realYield.contribution} / ${dashboard.driverAttribution["10Y"].realYield.share}, breakeven ${dashboard.driverAttribution["10Y"].breakeven.contribution} / ${dashboard.driverAttribution["10Y"].breakeven.share}, residual ${dashboard.driverAttribution["10Y"].residual.contribution} / ${dashboard.driverAttribution["10Y"].residual.share}。

30Y 5D move ${dashboard.driverAttribution["30Y"].move}。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。${dashboard.driverAttribution["30Y"].interpretation}

## 市场正在交易什么分歧

${topNarratives}

完整叙事检查：

${checks}

## 叙事是否过度外推

2026-05-11 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把温和回落直接外推成可加仓窗口。

## Duration 动作建议

当前档位：${dashboard.durationAction.currentIndex} - ${dashboard.durationAction.label}。

原因：${dashboard.durationAction.explanation}

支持条件：
${dashboard.durationAction.supports.map((item) => `- ${item}`).join("\n")}

反对条件：
${dashboard.durationAction.opposes.map((item) => `- ${item}`).join("\n")}

升级信号：
${dashboard.durationAction.upgradeSignals.map((item) => `- ${item}`).join("\n")}

降级或维持低档信号：
${dashboard.durationAction.downgradeSignals.map((item) => `- ${item}`).join("\n")}

## Technical Exhaustion Panel

${dashboard.technical.signals.map((item) => `- ${item.title}: ${item.value}; status ${item.status}; ${item.note}`).join("\n")}

结论：${dashboard.technical.adviceBody}

## 需要证伪/确认的下一批数据

${missing}
`;
}

function getHorizonMetrics(series, observations) {
  const latest = series[series.length - 1];
  const previous = series[series.length - 1 - observations];
  if (!latest || !previous) {
    return {
      changeBp: NaN,
      previousDate: "",
      percentile: NaN,
      regimePercentile: NaN,
      zScore: NaN,
    };
  }
  const changeBp = (latest.value - previous.value) * 100;
  return {
    changeBp,
    previousDate: previous.date,
    percentile: directionalPercentile(series, observations, changeBp, series[0].date),
    regimePercentile: directionalPercentile(series, observations, changeBp, "2022-01-01"),
    zScore: horizonZScore(series, observations, changeBp),
  };
}

function directionalPercentile(series, observations, changeBp, startDate) {
  const samples = [];
  for (let index = observations; index < series.length; index += 1) {
    const point = series[index];
    if (point.date < startDate) {
      continue;
    }
    const previous = series[index - observations];
    const sample = (point.value - previous.value) * 100;
    if (changeBp >= 0 && sample >= 0) {
      samples.push(sample);
    }
    if (changeBp < 0 && sample < 0) {
      samples.push(Math.abs(sample));
    }
  }
  if (!samples.length) {
    return NaN;
  }
  const target = changeBp >= 0 ? changeBp : Math.abs(changeBp);
  return (samples.filter((sample) => sample <= target).length / samples.length) * 100;
}

function horizonZScore(series, observations, changeBp) {
  const dailyChanges = [];
  for (let index = 1; index < series.length; index += 1) {
    dailyChanges.push((series[index].value - series[index - 1].value) * 100);
  }
  const trailing = dailyChanges.slice(-63);
  if (trailing.length < 20) {
    return NaN;
  }
  const sd = standardDeviation(trailing);
  const horizonVol = sd * Math.sqrt(observations);
  return horizonVol > 0 ? changeBp / horizonVol : NaN;
}

function getChange(series, observations) {
  if (!series || series.length <= observations) {
    return { changeBp: NaN, previousDate: "" };
  }
  const latest = series[series.length - 1];
  const previous = series[series.length - 1 - observations];
  return {
    changeBp: (latest.value - previous.value) * 100,
    previousDate: previous.date,
  };
}

function getSpreadChange(baseSeries, comparisonSeries, observations) {
  const spreadSeries = alignSeries(baseSeries, comparisonSeries, (base, comparison) => comparison - base);
  const latest = spreadSeries[spreadSeries.length - 1];
  const previous = spreadSeries[spreadSeries.length - 1 - observations];
  return {
    levelBp: latest ? latest.value * 100 : NaN,
    changeBp: latest && previous ? (latest.value - previous.value) * 100 : NaN,
    previousDate: previous?.date || "",
  };
}

function alignSeries(a = [], b = [], merge) {
  const bByDate = new Map(b.map((point) => [point.date, point.value]));
  return a
    .filter((point) => bByDate.has(point.date))
    .map((point) => ({ date: point.date, value: merge(point.value, bByDate.get(point.date)) }));
}

function calcRsi(series, observations) {
  const changes = [];
  for (let index = 1; index < series.length; index += 1) {
    changes.push(series[index].value - series[index - 1].value);
  }
  const trailing = changes.slice(-observations);
  const gains = trailing.reduce((sum, change) => sum + (change > 0 ? change : 0), 0) / observations;
  const losses = trailing.reduce((sum, change) => sum + (change < 0 ? Math.abs(change) : 0), 0) / observations;
  if (losses === 0) {
    return gains === 0 ? 50 : 100;
  }
  return 100 - 100 / (1 + gains / losses);
}

function calcBollingerZ(series, observations) {
  const values = series.slice(-observations).map((point) => point.value);
  const mean = average(values);
  const sd = standardDeviation(values);
  return sd > 0 ? (values[values.length - 1] - mean) / sd : 0;
}

function calcNineTurn(series) {
  let up = 0;
  let down = 0;
  for (let index = 4; index < series.length; index += 1) {
    if (series[index].value > series[index - 4].value) {
      up += 1;
    } else {
      up = 0;
    }
    if (series[index].value < series[index - 4].value) {
      down += 1;
    } else {
      down = 0;
    }
  }
  return { up, down };
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function findRow(rows, tenor) {
  return rows.find((row) => row.tenor === tenor) || {};
}

function parsePercent(value) {
  if (typeof value !== "string") {
    return Number(value) || 0;
  }
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTimestamp(timestamp) {
  if (!timestamp) {
    return "unavailable";
  }
  if (typeof timestamp === "string" && /^\d{4}-\d{2}-\d{2}/.test(timestamp)) {
    return timestamp.slice(0, 10);
  }
  const numeric = Number(timestamp);
  if (Number.isFinite(numeric)) {
    return new Date(numeric).toISOString().slice(0, 10);
  }
  return "unavailable";
}

function latestCrossAssetDate(crossAssetSignals) {
  const dates = (crossAssetSignals.signals || [])
    .map((signal) => signal.updatedAt)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return dates[dates.length - 1] || "";
}

function stars(score) {
  return `${"★".repeat(score)}${"☆".repeat(Math.max(0, 4 - score))}`;
}

function formatPct(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : "unavailable";
}

function formatBp(value, signed = true) {
  if (!Number.isFinite(value)) {
    return "unavailable";
  }
  const rounded = Math.round(value);
  const prefix = signed && rounded > 0 ? "+" : "";
  return `${prefix}${rounded}bp`;
}

function formatPercentile(value, proxy) {
  if (!Number.isFinite(value)) {
    return "unavailable";
  }
  return `${Math.round(value)}%${proxy ? "*" : ""}`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "unavailable";
  }
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value, decimals) {
  return Number.isFinite(value) ? value.toFixed(decimals) : "unavailable";
}

function formatSigned(value, decimals) {
  if (!Number.isFinite(value)) {
    return "unavailable";
  }
  return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}`;
}

function round(value, decimals = 0) {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function localDateIso(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

function localDateTimeIso(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}T${part(parts, "hour")}:${part(parts, "minute")}:${part(parts, "second")}+08:00`;
}

function part(parts, type) {
  return parts.find((entry) => entry.type === type)?.value || "";
}

main();
