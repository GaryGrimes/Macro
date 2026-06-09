#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const OUT_DATA_DIR = path.join(ROOT, "macro_daily", "data");
const OUT_REPORT_DIR = path.join(ROOT, "macro_daily", "reports");
const PUBLIC_DATA_CACHE = path.join(CACHE_DIR, "public_market_data.json");
const MONTHLY_PREFLIGHT_STATE = path.join(CACHE_DIR, "monthly_preflight_state.json");
const TIME_ZONE = "Asia/Shanghai";

const RUN_DATE = process.env.RUN_DATE || localDateIso(TIME_ZONE);
const OUTPUT_JSON = path.join(OUT_DATA_DIR, `${RUN_DATE}_dashboard.json`);
const OUTPUT_REPORT = path.join(OUT_REPORT_DIR, `${RUN_DATE}_rates_duration_report.md`);
const MARKET_REACTION_INPUT = path.join(OUT_DATA_DIR, `${RUN_DATE}_market_reaction_sources.json`);

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
  const monthlyPreflight = runMonthlyPreflightIfNeeded(RUN_DATE);

  const treasury = readTreasuryCache();
  const fredT5yifr = readFredCache("T5YIFR");
  const cnn = readCnnCache();
  const publicData = readPublicDataCache();

  const marketDate = treasury.updatedAt;
  const generatedAt = localDateTimeIso(TIME_ZONE);
  const dataGaps = [];
  const t5yifrSource = selectT5YifrSeries(treasury, fredT5yifr, marketDate);
  const marketReactionInput = readMarketReactionInput(RUN_DATE, marketDate);
  const feedStatus = buildFeedStatus({ treasury, publicData, marketDate });

  if (!feedStatus.hasTenYearRatesHistory) {
    dataGaps.push(
      `Rate shock percentiles use local Treasury cache from ${treasury.historyStart} to ${marketDate}; full 10-year and full 2022+ windows are unavailable in local cache.`,
    );
  }
  if (!treasury.series.dgs2) {
    dataGaps.push("DGS2 is unavailable because the local Treasury cache does not include the 2Y node.");
  }
  if (!feedStatus.hasPolicyPath) {
    dataGaps.push("SOFR futures and Fed funds futures implied cuts are unavailable in local cache.");
  }
  if (!feedStatus.hasTermPremium) {
    dataGaps.push("ACM / Kim-Wright term premium is unavailable; 5s30s, 10s30s, and auction evidence are used as long-end proxies.");
  }
  if (!feedStatus.hasAuction) {
    dataGaps.push("Treasury auction tail, bid-to-cover, and dealer take-down are unavailable in local cache.");
  }
  if (!feedStatus.hasMove) {
    dataGaps.push("MOVE index is unavailable in local cache; VIX and CNN credit/sentiment components are used as risk proxies.");
  }
  if (!feedStatus.hasCftc) {
    dataGaps.push("CFTC Treasury futures positioning is unavailable in local cache.");
  }
  if (feedStatus.missingCrossAssets.length) {
    const verb = feedStatus.missingCrossAssets.length === 1 ? "is" : "are";
    dataGaps.push(`${feedStatus.missingCrossAssets.join(", ")} ${verb} unavailable in local cache.`);
  }
  if (t5yifrSource.proxyUsed) {
    dataGaps.push(t5yifrSource.note);
  }
  if (!marketReactionInput) {
    dataGaps.push(
      `市场反应研究输入 ${path.relative(ROOT, MARKET_REACTION_INPUT)} 不可用；模块 1.5 会显示需要研究输入状态。`,
    );
  } else if (marketReactionInput.error) {
    dataGaps.push(marketReactionInput.error);
  }

  const rateShockRows = buildRateShockRows(treasury, marketDate);
  const curveShape = buildCurveShape(treasury, marketDate);
  const driverAttribution = buildDriverAttribution(treasury, t5yifrSource, marketDate);
  const technical = buildTechnicalPanel(treasury, marketDate, publicData);
  const crossAssetSignals = buildCrossAssetSignals(cnn, publicData, marketDate);
  const crossSourceVerification = buildCrossSourceVerification({
    treasury,
    fredT5yifr,
    t5yifrSource,
    crossAssetSignals,
    publicData,
  });
  const marketReaction = buildMarketReaction({
    marketDate,
    rateShockRows,
    curveShape,
    driverAttribution,
    technical,
    crossAssetSignals,
    sourceInput: marketReactionInput,
  });
  curveShape.eventContext = buildCurveEventContext({
    marketDate,
    marketReaction,
  });
  driverAttribution.curveLink = buildDriverCurveLink({
    marketDate,
    curveShape,
    driverAttribution,
    marketReaction,
  });
  const narratives = buildNarratives({
    marketDate,
    rateShockRows,
    marketReaction,
    curveShape,
    driverAttribution,
    technical,
    crossAssetSignals,
  });
  const durationAction = buildDurationAction({
    marketDate,
    rateShockRows,
    marketReaction,
    curveShape,
    driverAttribution,
    technical,
    narratives,
  });
  const firstRead = buildFirstRead({
    marketDate,
    rateShockRows,
    curveShape,
    driverAttribution,
    durationAction,
    technical,
  });
  const reportTitle = buildReportTitle(rateShockRows, curveShape, technical);
  const reportSummary = buildReportSummary(marketDate, rateShockRows, curveShape, durationAction, technical);

  const dashboard = {
    date: RUN_DATE,
    marketDate,
    source: "macro_daily automation",
    generatedAt,
    reportTitle,
    reportSummary,
    firstRead,
    marketStatus:
      marketDate < RUN_DATE
        ? `Latest confirmed U.S. rates data is ${marketDate}; ${RUN_DATE} does not yet have a complete U.S. rates close in local cache.`
        : `Latest confirmed U.S. rates data is ${marketDate}.`,
    rateShockRows,
    curveShape,
    driverAttribution,
    crossAssetSignals,
    crossSourceVerification,
    marketReaction,
    narratives,
    durationAction,
    technical,
    dataGaps,
    dataQuality: {
      treasuryCacheFetchedAt: treasury.fetchedAt,
      treasuryHistoryStart: treasury.historyStart,
      percentileProxyUsed: !feedStatus.hasTenYearRatesHistory,
      percentileProxyNote:
        feedStatus.hasTenYearRatesHistory
          ? "Rate shock percentiles use the locally cached 10-year public history."
          : "A trailing local-cache percentile is shown with * because the local Treasury cache starts after the required 10-year and 2022-01-01 windows.",
      publicDataFetchedAt: publicData?.fetchedAt || "unavailable",
      feedStatus,
      monthlyPreflight,
      missingRequiredSources: dataGaps,
    },
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(dashboard, null, 2)}\n`);
  fs.writeFileSync(OUTPUT_REPORT, buildReport(dashboard));
  process.stdout.write(`Wrote ${OUTPUT_JSON}\n`);
  process.stdout.write(`Wrote ${OUTPUT_REPORT}\n`);
}

function runMonthlyPreflightIfNeeded(runDate) {
  const month = runDate.slice(0, 7);
  const state = readJsonIfExists(MONTHLY_PREFLIGHT_STATE) || {};
  const reportPath = path.join(OUT_REPORT_DIR, `${month}_monthly_preflight.md`);
  const jsonPath = path.join(OUT_DATA_DIR, `${month}_monthly_preflight.json`);
  if (state.lastCompletedMonth === month && fs.existsSync(reportPath) && fs.existsSync(jsonPath)) {
    return {
      status: "skipped",
      month,
      reason: `Monthly preflight already completed for ${month}.`,
      reportPath: path.relative(ROOT, reportPath),
      jsonPath: path.relative(ROOT, jsonPath),
    };
  }
  try {
    execFileSync(process.execPath, [path.join(__dirname, "monthly_preflight.js")], {
      cwd: ROOT,
      env: { ...process.env, RUN_DATE: runDate },
      stdio: "pipe",
      maxBuffer: 8 * 1024 * 1024,
    });
    fs.writeFileSync(
      MONTHLY_PREFLIGHT_STATE,
      `${JSON.stringify({ lastCompletedMonth: month, completedAt: new Date().toISOString(), reportPath, jsonPath }, null, 2)}\n`,
    );
    return {
      status: "completed",
      month,
      reportPath: path.relative(ROOT, reportPath),
      jsonPath: path.relative(ROOT, jsonPath),
    };
  } catch (error) {
    return {
      status: "failed",
      month,
      message: error.message,
      stdout: error.stdout ? String(error.stdout).slice(0, 2000) : "",
      stderr: error.stderr ? String(error.stderr).slice(0, 2000) : "",
    };
  }
}

function readMarketReactionInput(runDate, marketDate) {
  const candidates = [
    path.join(OUT_DATA_DIR, `${runDate}_market_reaction_sources.json`),
    path.join(OUT_DATA_DIR, `${marketDate}_market_reaction_sources.json`),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return {
          filePath,
          payload: JSON.parse(fs.readFileSync(filePath, "utf8")),
        };
      }
    } catch (error) {
      return {
        filePath,
        error: `Market reaction input parse failed: ${error.message}`,
      };
    }
  }
  return null;
}

function readPublicDataCache() {
  try {
    if (!fs.existsSync(PUBLIC_DATA_CACHE)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(PUBLIC_DATA_CACHE, "utf8"));
  } catch (error) {
    return {
      source: "public market data cache",
      fetchedAt: "unavailable",
      series: {},
      fetchErrors: [{ message: error.message }],
    };
  }
}

function buildFeedStatus({ treasury, publicData, marketDate }) {
  const requiredRateStart = shiftIsoDate(marketDate, -3653);
  const hasTenYearRatesHistory = treasury.historyStart <= requiredRateStart;
  const publicSeries = publicData?.series || {};
  const hasPublicSeries = (seriesId, maxAgeDays = 7) => latestPublicDate(publicData, seriesId) >= shiftIsoDate(marketDate, -maxAgeDays);
  const missingCrossAssets = [
    ["VIX", "VIXCLS", 7],
    ["HY OAS", "BAMLH0A0HYM2", 7],
    ["DXY/broad dollar", "DTWEXBGS", 7],
    ["Oil", "DCOILWTICO", 10],
    ["Gold", ["GOLDAMGBD228NLBM", "GOLD_PROXY_COMEX"], 7],
    ["Copper", "PCOPPUSDM", 120],
  ]
    .filter(([, seriesId, maxAgeDays]) => {
      const candidates = Array.isArray(seriesId) ? seriesId : [seriesId];
      return !candidates.some((candidate) => hasPublicSeries(candidate, maxAgeDays));
    })
    .map(([label]) => label);
  return {
    hasTenYearRatesHistory,
    rateHistoryStart: treasury.historyStart,
    requiredRateStart,
    publicDataFetchedAt: publicData?.fetchedAt || "unavailable",
    publicSeriesCount: Object.keys(publicSeries).length,
    hasPolicyPath: Boolean(publicData?.policyPath?.asOf),
    hasTermPremium: Boolean(publicData?.termPremium?.asOf),
    hasAuction: Boolean(publicData?.auction?.asOf) || hasRecentAuctionInput(marketDate),
    hasMove: hasPublicSeries("MOVE") || hasPublicSeries("MOVECLS") || hasPublicSeries("MOVE_PROXY_RATES_VOL"),
    hasCftc: Boolean(publicData?.cftc?.asOf),
    missingCrossAssets,
  };
}

function hasRecentAuctionInput(marketDate) {
  const files = fs.existsSync(OUT_DATA_DIR) ? fs.readdirSync(OUT_DATA_DIR) : [];
  return files.some((file) => {
    if (!/_market_reaction_sources\.json$/.test(file)) {
      return false;
    }
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(OUT_DATA_DIR, file), "utf8"));
      const text = JSON.stringify(payload).toLowerCase();
      return text.includes("auction") && text.includes(marketDate.slice(0, 7));
    } catch {
      return false;
    }
  });
}

function latestPublicDate(publicData, seriesId) {
  const points = publicData?.series?.[seriesId]?.points || [];
  return latestDate(points);
}

function buildCrossSourceVerification({ treasury, fredT5yifr, t5yifrSource, crossAssetSignals, publicData }) {
  return [
    {
      source: "U.S. Treasury Daily Treasury Yield Curve + Real Yield Curve XML",
      role: "primary rates source",
      latestDate: treasury.updatedAt,
      fetchedAt: treasury.fetchedAt,
      note: "Used for nominal curve, real-yield curve, breakeven proxies, curve shape, rate shock tape, and technical calculations.",
    },
    {
      source: t5yifrSource.source,
      role: "inflation-forward cross-check",
      latestDate: latestDate(t5yifrSource.series) || latestDate(fredT5yifr) || "unavailable",
      proxyUsed: t5yifrSource.proxyUsed,
      note: t5yifrSource.note,
    },
    {
      source: "CNN Fear & Greed local proxy",
      role: "risk-appetite cross-check",
      latestDate: latestCrossAssetDate(crossAssetSignals) || "unavailable",
      note: crossAssetSignals.interpretation,
    },
    {
      source: "FRED public market data cache",
      role: "public history and cross-asset feed",
      latestDate: latestPublicDate(publicData, "DGS10") || latestPublicDate(publicData, "VIXCLS") || "unavailable",
      fetchedAt: publicData?.fetchedAt || "unavailable",
      note: publicData
        ? `Loaded ${Object.keys(publicData.series || {}).length} public series for rate history and cross-asset checks.`
        : "Public data cache is not present; run macro_daily/scripts/update_public_data_cache.js when network is available.",
    },
    {
      source: "Federal Reserve H.15 / FRED",
      role: "official secondary rates cross-check",
      latestDate: "checked separately during run",
      note: "Used as a sanity check for methodology and release lag. Treasury XML remains the controlling source when it is fresher than H.15/FRED page views.",
    },
  ];
}

function buildMarketReaction(context) {
  const { marketDate, rateShockRows, curveShape, driverAttribution, technical, sourceInput } = context;
  if (!sourceInput || sourceInput.error || !sourceInput.payload) {
    return buildMissingMarketReaction({
      marketDate,
      rateShockRows,
      curveShape,
      driverAttribution,
      technical,
      error: sourceInput?.error || "",
    });
  }

  const payload = sourceInput.payload.marketReaction || sourceInput.payload;
  const rawThemes = Array.isArray(payload.themes) && payload.themes.length
    ? payload.themes
    : groupReactionEvidence(payload.sources || payload.evidence || []);
  const themes = normalizeReactionThemes(rawThemes);

  return {
    asOf: payload.asOf || marketDate,
    coverageWindow: formatCoverageWindow(payload.coverageWindow, marketDate),
    sourceCoverageStatus: themes.length ? "ready" : "empty",
    summary:
      payload.summary ||
      (themes.length
        ? `${marketDate} 的市场反应研究整理出 ${themes.length} 条可交易叙事。`
        : "市场反应研究文件已存在，但没有可用主题。"),
    inputPath: path.relative(ROOT, sourceInput.filePath),
    methodology:
      payload.methodology ||
      "权重综合来源可靠度、发布时间接近度、证据强度，以及不同来源之间的相互确认程度。",
    sourceMix: buildReactionSourceMix(themes),
    themes: themes.length ? themes : buildMissingMarketReaction({ marketDate, rateShockRows, curveShape, driverAttribution, technical }).themes,
  };
}

function buildMissingMarketReaction({ marketDate, rateShockRows, curveShape, driverAttribution, technical, error = "" }) {
  const tenYear = findRow(rateShockRows, "10Y");
  const thirtyYear = findRow(rateShockRows, "30Y");
  const localRead = [
    `DGS10 5D ${tenYear?.d5 || "unavailable"} (${tenYear?.d5Pctile || "unavailable"})`,
    `DGS30 5D ${thirtyYear?.d5 || "unavailable"} (${thirtyYear?.d5Pctile || "unavailable"})`,
    `${curveShape.label}`,
    `${driverAttribution["10Y"]?.dominantDriver || "driver unavailable"}`,
    technical.hasExhaustion ? "technical exhaustion present" : "technical exhaustion absent",
  ].join("; ");

  return {
    asOf: marketDate,
    coverageWindow: `${shiftIsoDate(marketDate, -3)} to ${marketDate}`,
    sourceCoverageStatus: "missing_research_input",
    summary:
      "市场反应研究输入缺失；本模块不会只凭本地价格指标倒推出媒体或市场共识。",
    methodology:
      "每日自动化必须先浏览并总结权威媒体、机构材料、官方发布和社群讨论，再分配市场反应叙事权重。",
    sourceMix: [
      { type: "media", count: 0, weight: 0 },
      { type: "institution", count: 0, weight: 0 },
      { type: "community", count: 0, weight: 0 },
    ],
    themes: [
      {
        rank: 1,
        title: "研究输入缺失",
        weight: 100,
        stance: "unavailable",
        interpretation:
          "Module 1 和 Module 2 只能作为本地诊断，不能当成更广泛市场叙事正在交易什么的证据。",
        linkedNarrativeIds: [],
        evidence: [
          {
            sourceType: "automation",
            sourceName: "本地利率看板",
            publishedAt: marketDate,
            summary: error ? `${error}；本地诊断：${localRead}。` : `本地诊断：${localRead}。`,
            reliability: 0,
            weight: 0,
          },
        ],
      },
    ],
  };
}

function buildCurveEventContext({ marketDate, marketReaction }) {
  const reactionDate = marketReaction?.asOf || marketDate;
  const themes = Array.isArray(marketReaction?.themes) ? marketReaction.themes : [];
  const ready = marketReaction?.sourceCoverageStatus === "ready";
  const topThemes = themes
    .filter((theme) => theme.stance !== "unavailable")
    .slice(0, 3)
    .map((theme) => ({
      title: theme.title,
      weight: theme.weight,
      linkedNarrativeIds: theme.linkedNarrativeIds || [],
      interpretation: theme.interpretation,
    }));
  return {
    asOf: reactionDate,
    sourceCoverageStatus: marketReaction?.sourceCoverageStatus || "missing_research_input",
    dataDateMismatch: ready && reactionDate > marketDate,
    summary: ready
      ? `外部市场叙事覆盖到 ${reactionDate}，本地曲线 tape 覆盖到 ${marketDate}。`
      : "缺少外部市场反应输入，曲线模块只能解释本地 rates tape。",
    implication:
      ready && reactionDate > marketDate
        ? "曲线形态数值尚未包含较新的事件冲击；报告必须把外部事件作为待本地 rates cache 确认的交易背景，而不是把旧曲线读数当作最新市场反应。"
        : "曲线形态和外部叙事日期一致或外部叙事不可用。",
    topThemes,
  };
}

function buildDriverCurveLink({ marketDate, curveShape, driverAttribution, marketReaction }) {
  const fiveYear = driverAttribution["5Y"];
  const tenYear = driverAttribution["10Y"];
  const thirtyYear = driverAttribution["30Y"];
  const topThemes = (marketReaction?.themes || [])
    .filter((theme) => theme.stance !== "unavailable")
    .slice(0, 3)
    .map((theme) => theme.title);
  const realYieldLed =
    fiveYear?.dominantDriver === "real-yield" ||
    tenYear?.dominantDriver === "real-yield";
  const breakevenLed =
    fiveYear?.dominantDriver === "breakeven" ||
    tenYear?.dominantDriver === "breakeven";
  const longEndStress =
    curveShape.label === "bear steepening" ||
    Number(curveShape.raw?.spread10s30ChangeBp) > 3 ||
    Number(curveShape.raw?.d30Bp) > Number(curveShape.raw?.d10Bp) + 3;

  const evidence = [
    `Module 2 curve label is ${curveShape.label} as of ${marketDate}.`,
    `5Y attribution is ${fiveYear?.dominantDriver || "unavailable"}: real yield ${fiveYear?.realYield?.contribution || "unavailable"}, breakeven ${fiveYear?.breakeven?.contribution || "unavailable"}.`,
    `10Y attribution is ${tenYear?.dominantDriver || "unavailable"}: real yield ${tenYear?.realYield?.contribution || "unavailable"}, breakeven ${tenYear?.breakeven?.contribution || "unavailable"}.`,
    `30Y proxy: ${thirtyYear?.move || "unavailable"} with 10s30s ${curveShape.spreads?.["10s30s"]?.change || "unavailable"} and 5s30s ${curveShape.spreads?.["5s30s"]?.change || "unavailable"}.`,
  ];
  if (topThemes.length) {
    evidence.unshift(`Module 1.5 top themes: ${topThemes.join(" / ")}.`);
  }

  let conclusion;
  if (curveShape.label === "bear flattening" && realYieldLed && !longEndStress) {
    conclusion =
      "Module 3 confirms Module 2: the selloff is short/intermediate-led and real-yield-led, matching a nonfarm / Fed-path discount-rate shock rather than a 30Y term-premium shock.";
  } else if (curveShape.label === "bear steepening" && longEndStress) {
    conclusion =
      "Module 3 confirms Module 2: 30Y and curve-steepening proxies point to long-end term-premium / supply stress, so long-end duration should not be upgraded mechanically.";
  } else if (breakevenLed) {
    conclusion =
      "Module 3 qualifies Module 2: breakeven contribution is the main driver, so the curve read should be treated as inflation-compensation-sensitive rather than pure Fed-path real-yield repricing.";
  } else {
    conclusion =
      "Module 3 qualifies Module 2: driver attribution does not fully confirm a single curve narrative, so the curve label remains a price-shape description rather than a standalone trade reason.";
  }

  return {
    asOf: marketDate,
    module2Label: curveShape.label,
    linkedThemes: topThemes,
    conclusion,
    evidence,
  };
}

function groupReactionEvidence(evidenceItems) {
  const grouped = new Map();
  evidenceItems.forEach((item) => {
    const title = item.theme || item.title || "Unclassified market reaction";
    if (!grouped.has(title)) {
      grouped.set(title, {
        title,
        stance: item.stance || "mixed",
        interpretation: item.interpretation || item.summary || "",
        linkedNarrativeIds: item.linkedNarrativeIds || [],
        evidence: [],
      });
    }
    grouped.get(title).evidence.push(item);
  });
  return Array.from(grouped.values());
}

function normalizeReactionThemes(rawThemes) {
  const weighted = rawThemes
    .map((theme) => {
      const evidence = Array.isArray(theme.evidence) ? theme.evidence : [];
      const evidenceScore = evidence.reduce((sum, item) => sum + reactionEvidenceScore(item), 0);
      const weight = Number.isFinite(Number(theme.weight)) ? Number(theme.weight) : evidenceScore;
      return {
        ...theme,
        weight,
        evidence: evidence.map(normalizeReactionEvidence),
      };
    })
    .filter((theme) => theme.title && Number.isFinite(theme.weight));

  const total = weighted.reduce((sum, theme) => sum + theme.weight, 0) || 1;
  return weighted
    .sort((a, b) => b.weight - a.weight)
    .map((theme, index) => ({
      rank: index + 1,
      title: theme.title,
      weight: round((theme.weight / total) * 100, 0),
      stance: theme.stance || "mixed",
      interpretation: theme.interpretation || theme.summary || "未提供主题解释。",
      linkedNarrativeIds: Array.isArray(theme.linkedNarrativeIds) ? theme.linkedNarrativeIds : [],
      evidence: theme.evidence,
    }));
}

function normalizeReactionEvidence(item) {
  return {
    sourceType: item.sourceType || item.type || "media",
    sourceName: item.sourceName || item.name || "source",
    publishedAt: item.publishedAt || item.date || "unavailable",
    url: item.url || "",
    summary: item.summary || item.quoteOrSummary || "",
    reliability: Number.isFinite(Number(item.reliability)) ? Number(item.reliability) : sourceTypeReliability(item.sourceType || item.type),
    weight: Number.isFinite(Number(item.weight)) ? Number(item.weight) : reactionEvidenceScore(item),
  };
}

function reactionEvidenceScore(item) {
  const reliability = Number.isFinite(Number(item.reliability))
    ? Number(item.reliability)
    : sourceTypeReliability(item.sourceType || item.type);
  const evidenceWeight = Number.isFinite(Number(item.evidenceWeight)) ? Number(item.evidenceWeight) : 1;
  return Math.max(0, reliability * evidenceWeight);
}

function sourceTypeReliability(type) {
  const key = String(type || "").toLowerCase();
  if (["official", "institution"].includes(key)) {
    return 1;
  }
  if (["media", "wire"].includes(key)) {
    return 0.85;
  }
  if (["community", "social"].includes(key)) {
    return 0.45;
  }
  return 0.6;
}

function buildReactionSourceMix(themes) {
  const totals = new Map();
  let totalWeight = 0;
  themes.forEach((theme) => {
    (theme.evidence || []).forEach((item) => {
      const type = item.sourceType || "media";
      const weight = Number(item.weight) || 0;
      const current = totals.get(type) || { type, count: 0, weight: 0 };
      current.count += 1;
      current.weight += weight;
      totals.set(type, current);
      totalWeight += weight;
    });
  });
  return Array.from(totals.values()).map((item) => ({
    ...item,
    weight: totalWeight > 0 ? round((item.weight / totalWeight) * 100, 0) : 0,
  }));
}

function formatCoverageWindow(window, marketDate) {
  if (!window) {
    return `${shiftIsoDate(marketDate, -3)} to ${marketDate}`;
  }
  if (typeof window === "string") {
    return window;
  }
  return `${window.from || shiftIsoDate(marketDate, -3)} to ${window.to || marketDate}`;
}

function readCacheFile(name) {
  const filePath = path.join(CACHE_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const wrapper = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return wrapper.body || "";
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
  augmentTreasurySeriesFromFred(series);
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

function augmentTreasurySeriesFromFred(series) {
  const mapping = {
    dgs2: "DGS2",
    us3y: "DGS3",
    dgs5: "DGS5",
    dgs10: "DGS10",
    us10y: "DGS10",
    us30y: "DGS30",
    dfii5: "DFII5",
    dfii10: "DFII10",
    dfii30: "DFII30",
    t5yie: "T5YIE",
    t10yie: "T10YIE",
  };
  Object.entries(mapping).forEach(([key, seriesId]) => {
    const fredSeries = readFredCache(seriesId);
    if (!fredSeries.length) {
      return;
    }
    series[key] = mergeSeriesByDate(fredSeries, series[key] || []);
  });
}

function mergeSeriesByDate(primary, fallback) {
  const byDate = new Map();
  fallback.forEach((point) => byDate.set(point.date, point));
  primary.forEach((point) => byDate.set(point.date, point));
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
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

function selectT5YifrSeries(treasury, fredSeries, marketDate) {
  const fredLatestDate = latestDate(fredSeries);
  if (fredLatestDate >= marketDate) {
    return {
      series: fredSeries,
      source: "FRED T5YIFR",
      proxyUsed: false,
      note: `FRED T5YIFR is available through ${fredLatestDate}.`,
    };
  }

  const derived = buildT5YifrSeriesFromTreasury(treasury);
  const derivedLatestDate = latestDate(derived);
  if (derivedLatestDate >= marketDate) {
    return {
      series: derived,
      source: "Treasury-derived T5YIFR proxy",
      proxyUsed: true,
      note: `T5YIFR uses a Treasury-derived local proxy for ${marketDate} because FRED T5YIFR cache ends on ${fredLatestDate || "unavailable"}.`,
    };
  }

  return {
    series: fredSeries,
    source: "FRED T5YIFR",
    proxyUsed: false,
    note: `T5YIFR is unavailable for ${marketDate}; FRED cache ends on ${fredLatestDate || "unavailable"} and Treasury-derived proxy ends on ${derivedLatestDate || "unavailable"}.`,
  };
}

function buildT5YifrSeriesFromTreasury(treasury) {
  return alignSeries(treasury.series.t5yie, treasury.series.t10yie, (t5yie, t10yie) => {
    const fiveYear = t5yie / 100;
    const tenYear = t10yie / 100;
    return (((1 + tenYear) ** 10 / (1 + fiveYear) ** 5) ** (1 / 5) - 1) * 100;
  });
}

function latestDate(series = []) {
  return series.length ? series[series.length - 1].date : "";
}

function readCnnCache() {
  const body = readCacheFile("cnn");
  if (!body) {
    return null;
  }
  return JSON.parse(body);
}

function buildRateShockRows(treasury, marketDate) {
  const percentileProxy = treasury.historyStart > shiftIsoDate(marketDate, -3653);
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
      d1Pctile: formatPercentile(horizonMetrics.d1.percentile, percentileProxy),
      d5: formatBp(d5Metrics.changeBp),
      d5Pctile: formatPercentile(d5Metrics.percentile, percentileProxy),
      d21: formatBp(horizonMetrics.d21.changeBp),
      d21Pctile: formatPercentile(horizonMetrics.d21.percentile, percentileProxy),
      d3m: formatBp(horizonMetrics.d63.changeBp),
      d3mPctile: formatPercentile(horizonMetrics.d63.percentile, percentileProxy),
      regimePctile: formatPercentile(d5Metrics.regimePercentile, percentileProxy),
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

function buildDriverAttribution(treasury, t5yifrSource, marketDate) {
  const dgs5 = getChange(treasury.series.dgs5, 5);
  const dfii5 = getChange(treasury.series.dfii5, 5);
  const t5yie = getChange(treasury.series.t5yie, 5);
  const dgs10 = getChange(treasury.series.dgs10, 5);
  const t10yie = getChange(treasury.series.t10yie, 5);
  const real10Series = alignSeries(treasury.series.dgs10, treasury.series.t10yie, (nominal, breakeven) => nominal - breakeven);
  const dfii10 = getChange(real10Series, 5);
  const t5yifr = getChange(t5yifrSource.series, 5);
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
      source: t5yifrSource.source,
      proxyUsed: t5yifrSource.proxyUsed,
      note: Number.isFinite(t5yifr.changeBp)
        ? `T5YIFR moved ${formatBp(t5yifr.changeBp)} from ${t5yifr.previousDate} to ${marketDate}; source is ${t5yifrSource.source}.`
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

function buildTechnicalPanel(treasury, marketDate, publicData) {
  const percentileProxy = treasury.historyStart > shiftIsoDate(marketDate, -3653);
  const tenYear = buildTechnicalForSeries(treasury.series.dgs10, "US10Y");
  const thirtyYear = buildTechnicalForSeries(treasury.series.us30y, "US30Y");
  const moveSignal = buildMoveSignal(publicData, marketDate);
  const cftcSignal = buildCftcSignal(publicData, marketDate);
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
        value: `10Y ${formatBp(tenYear.move20dBp)} ${formatPercentile(tenYear.move20dPercentile, percentileProxy)} / 30Y ${formatBp(thirtyYear.move20dBp)} ${formatPercentile(thirtyYear.move20dPercentile, percentileProxy)}`,
        status:
          tenYear.move20dPercentile >= 90 || thirtyYear.move20dPercentile >= 90
            ? "exhaustion"
            : "neutral",
        note: percentileProxy
          ? "Percentile uses available local Treasury cache and is marked with *."
          : "Percentile uses the locally cached public history.",
      },
      {
        title: "MOVE index",
        value: moveSignal.value,
        status: moveSignal.status,
        source: moveSignal.source,
        note: moveSignal.note,
      },
      {
        title: "CFTC Treasury futures positioning",
        value: cftcSignal.value,
        status: cftcSignal.status,
        source: cftcSignal.source,
        note: cftcSignal.note,
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
    moveSignal,
    cftcSignal,
    hasExhaustion,
    adviceTitle: hasExhaustion ? "Timing signal only" : "No exhaustion confirmation",
    adviceBody: hasExhaustion
      ? "Technical signals can support only a conditional timing overlay; they do not create a standalone duration trade."
      : `${marketDate} yield RSI, Bollinger z-scores, nine-turn proxies, and 20D move percentiles are not extreme enough to support a duration nibble by themselves.`,
  };
}

function buildMoveSignal(publicData, marketDate) {
  const seriesId = selectPublicSeriesId(publicData, ["MOVE", "MOVECLS", "MOVE_PROXY_RATES_VOL"], marketDate);
  const seriesMeta = publicData?.series?.[seriesId] || {};
  const points = seriesMeta.points || [];
  const latest = latestPointOnOrBefore(points, marketDate);
  if (!latest) {
    return {
      value: "unavailable",
      status: "unavailable",
      source: "unavailable",
      note: "MOVE or a rates-volatility proxy is not present in local cache.",
    };
  }
  const change = changeFromLookback(points, latest.date, 21);
  const status = Number.isFinite(change.changePct)
    ? change.changePct >= 20
      ? "stress rising"
      : change.changePct <= -20
        ? "stress falling"
        : "neutral"
    : "neutral";
  return {
    value: `${formatNumber(latest.value, 1)} as of ${latest.date}; 21D ${Number.isFinite(change.changePct) ? `${formatSigned(change.changePct, 1)}%` : "unavailable"}`,
    status,
    source: seriesMeta.source || seriesId,
    note: seriesMeta.proxyNote || "Used as a rates-volatility trend input.",
  };
}

function buildCftcSignal(publicData, marketDate) {
  const points = publicData?.cftc?.points || [];
  const latest = latestPointOnOrBefore(points, marketDate);
  if (!latest) {
    return {
      value: "unavailable",
      status: "unavailable",
      source: "unavailable",
      note: "CFTC Treasury futures positioning is not present in local cache.",
    };
  }
  const fourWeekChange = Number.isFinite(latest.fourWeekChange) ? latest.fourWeekChange : null;
  const status =
    latest.leveragedNetPctOi <= -20 && fourWeekChange !== null && fourWeekChange < 0
      ? "short crowding rising"
      : latest.leveragedNetPctOi <= -20
        ? "short crowded"
        : latest.leveragedNetPctOi >= 20
          ? "long crowded"
          : "neutral";
  return {
    value: `Lev net ${formatSigned(latest.leveragedNetPctOi, 1)}% OI as of ${latest.date}; 4W ${fourWeekChange !== null ? formatSigned(fourWeekChange, 1) : "unavailable"} pts`,
    status,
    source: publicData?.cftc?.source || "CFTC",
    note: publicData?.cftc?.proxyNote || "Aggregated Treasury futures positioning; used for trend and crowding, not precise DV01 exposure.",
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

function buildCrossAssetSignals(cnn, publicData, marketDate) {
  const keys = [
    ["fear_and_greed", "CNN Fear & Greed"],
    ["market_volatility_vix", "VIX"],
    ["junk_bond_demand", "Junk bond demand"],
    ["safe_haven_demand", "Safe haven demand"],
    ["stock_price_breadth", "Stock breadth"],
    ["market_momentum_sp500", "S&P 500 momentum"],
  ];
  const cnnSignals = keys
    .map(([key, title]) => {
      const item = cnn?.[key];
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
  const publicSignals = buildPublicCrossAssetSignals(publicData, marketDate);
  const signals = [...cnnSignals, ...publicSignals];
  const fearGreed = signals.find((signal) => signal.title === "CNN Fear & Greed");
  const vix = signals.find((signal) => signal.title === "VIX") || signals.find((signal) => signal.title === "VIXCLS");
  const junk = signals.find((signal) => signal.title === "Junk bond demand") || signals.find((signal) => signal.title === "HY OAS");
  return {
    source: publicSignals.length ? "CNN local cache + FRED public cache" : "CNN local cache",
    signals,
    interpretation: `CNN Fear & Greed is ${fearGreed?.rating || "unavailable"} as of ${fearGreed?.updatedAt || "unavailable"}; VIX is ${vix?.rating || "unavailable"} and junk bond demand / HY OAS is ${junk?.rating || "unavailable"}.`,
  };
}

function buildPublicCrossAssetSignals(publicData, marketDate) {
  const defs = [
    ["VIXCLS", "VIXCLS", "volatility", "index", classifyVix],
    ["BAMLH0A0HYM2", "HY OAS", "credit spread", "pct", classifyHyOas],
    ["DTWEXBGS", "Broad dollar", "dollar", "index", classifyChangeSignal],
    ["DCOILWTICO", "WTI oil", "oil", "usd", classifyChangeSignal],
    [["GOLDAMGBD228NLBM", "GOLD_PROXY_COMEX"], "Gold", "gold", "usd", classifyChangeSignal],
    ["PCOPPUSDM", "Copper", "copper", "usd", classifyChangeSignal],
  ];
  return defs
    .map(([seriesIdOrIds, title, type, unit, classifier]) => {
      const seriesId = selectPublicSeriesId(publicData, seriesIdOrIds, marketDate);
      const seriesMeta = publicData?.series?.[seriesId] || {};
      const points = seriesMeta.points || [];
      const latest = latestPointOnOrBefore(points, marketDate);
      if (!latest) {
        return null;
      }
      const change = changeFromLookback(points, latest.date, 5);
      return {
        title,
        type,
        score: round(latest.value, 2),
        rating: classifier(latest.value, change.changePct),
        updatedAt: latest.date,
        latestValue: round(latest.value, 2),
        unit,
        source: seriesMeta.source || "public cache",
        proxyNote: seriesMeta.proxyNote,
        change5D: Number.isFinite(change.changePct) ? `${formatSigned(change.changePct, 1)}%` : "unavailable",
      };
    })
    .filter(Boolean);
}

function selectPublicSeriesId(publicData, seriesIdOrIds, marketDate) {
  const candidates = Array.isArray(seriesIdOrIds) ? seriesIdOrIds : [seriesIdOrIds];
  return (
    candidates.find((seriesId) => latestPointOnOrBefore(publicData?.series?.[seriesId]?.points || [], marketDate)) ||
    candidates[0]
  );
}

function latestPointOnOrBefore(points, date) {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].date <= date && Number.isFinite(points[index].value)) {
      return points[index];
    }
  }
  return null;
}

function changeFromLookback(points, date, observations) {
  const valid = points.filter((point) => point.date <= date && Number.isFinite(point.value));
  if (valid.length <= observations) {
    return { change: NaN, changePct: NaN };
  }
  const latest = valid[valid.length - 1];
  const previous = valid[valid.length - 1 - observations];
  return {
    change: latest.value - previous.value,
    changePct: previous.value ? ((latest.value - previous.value) / previous.value) * 100 : NaN,
  };
}

function classifyVix(value) {
  if (value >= 25) return "fear";
  if (value <= 15) return "greed";
  return "neutral";
}

function classifyHyOas(value) {
  if (value >= 5) return "fear";
  if (value <= 3.5) return "greed";
  return "neutral";
}

function classifyChangeSignal(_value, changePct) {
  if (!Number.isFinite(changePct)) return "neutral";
  if (changePct >= 3) return "rising";
  if (changePct <= -3) return "falling";
  return "neutral";
}

function buildNarratives(context) {
  const { marketDate, curveShape, driverAttribution, technical, crossAssetSignals, marketReaction } = context;
  const reactionSupport = buildNarrativeReactionSupport(marketReaction);
  const fedReaction = reactionSupport.get("fed_path");
  const inflationReaction = reactionSupport.get("inflation_comp");
  const growthReaction = reactionSupport.get("growth_scare");
  const termReaction = reactionSupport.get("term_premium");
  const riskReaction = reactionSupport.get("risk_liquidity");
  const technicalReaction = reactionSupport.get("technical_exhaustion");
  const moves = curveShape.raw;
  const d5Ten = findRow(context.rateShockRows, "10Y")?.raw?.d5Bp;
  const d21Ten = findRow(context.rateShockRows, "10Y")?.raw?.d21Bp;
  const d3mThree = findRow(context.rateShockRows, "3Y")?.raw?.d3mBp;
  const inflation5 = driverAttribution["5Y"].raw.breakevenBp;
  const inflation10 = driverAttribution["10Y"].raw.breakevenBp;
  const riskStress = crossAssetSignals.signals?.some(
    (signal) => /fear/i.test(signal.rating) && signal.title === "Junk bond demand",
  );
  const growthCore =
    moves.d10Bp < 0
      ? "The 5D nominal rally and lower breakevens are consistent with a mild hedge bid, but risk proxies do not confirm a recession-style shock."
      : `DGS10 rose ${formatBp(moves.d10Bp)} over 5D, so a growth-scare / recession-hedge rates rally is not confirmed.`;
  const growthInterpretation =
    moves.d10Bp < 0
      ? "The growth-scare narrative is weak because the 5D rally is small and the broader risk tape is mixed rather than decisively defensive."
      : "The growth-scare narrative is weak because yields are not rallying over the 5D window and risk proxies are mixed rather than decisively defensive.";
  const growthEvidence =
    moves.d10Bp < 0
      ? `DGS10 fell ${formatBp(d5Ten)} over 5D, while CNN risk proxies are mixed.`
      : `DGS10 rose ${formatBp(d5Ten)} over 5D, while CNN risk proxies are mixed.`;

  const narratives = [
    {
      id: "fed_path",
      title: "Fed path repricing",
      score: Math.max(d3mThree >= 40 && moves.d3Bp > moves.d10Bp ? 1 : 0, fedReaction ? 2 : 0),
      updatedAt: fedReaction?.updatedAt || marketDate,
      core:
        fedReaction
          ? `External reaction points to policy-path repricing: ${fedReaction.title}.`
          : "The strongest policy-path evidence is the 63-observation bear flattening background, not a fresh 5D shock.",
      checks: [
        ...reactionChecks(fedReaction),
        `DGS3 63-observation move is ${findRow(context.rateShockRows, "3Y")?.d3m || "unavailable"}.`,
        `DGS3 5D move is ${formatBp(moves.d3Bp)}, while DGS10 5D move is ${formatBp(moves.d10Bp)}.`,
        "SOFR futures implied cuts are unavailable.",
        "Fed funds futures implied cuts are unavailable.",
      ],
      interpretation:
        fedReaction
          ? `Market-reaction evidence says the newer event tape is trading stronger-for-longer / fewer cuts, but local rates cache still only confirms curve data through ${marketDate}.`
          : `Policy-path repricing remains a background narrative, but ${marketDate} does not show a fresh front-end-led shock.`,
      evidence: [
        ...reactionEvidence(fedReaction),
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
      score: Math.max(inflation5 > 0 || inflation10 > 0 ? 1 : 0, inflationReaction ? 1 : 0),
      updatedAt: inflationReaction?.updatedAt || marketDate,
      core:
        inflationReaction
          ? `External reaction mentions inflation compensation, but local 5D breakeven attribution has not confirmed it as the main driver.`
          : `Breakevens are positive over 21/63 observations but softer over the 5D window, so inflation compensation is not the main shock on ${marketDate}.`,
      checks: [
        ...reactionChecks(inflationReaction),
        `5Y breakeven contribution over 5D is ${driverAttribution["5Y"].breakeven.contribution}.`,
        `10Y breakeven contribution over 5D is ${driverAttribution["10Y"].breakeven.contribution}.`,
        `T5YIFR 5D move is ${driverAttribution.inflationAnchor.t5yifr}.`,
        "Oil, gasoline, and commodity basket data are unavailable.",
      ],
      interpretation:
        "Inflation compensation is a weak watch item; there is no broad breakeven-led rates selloff in the local 5D tape.",
      evidence: [
        ...reactionEvidence(inflationReaction),
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
      score: Math.max(moves.d10Bp < 0 && inflation10 <= 0 ? 1 : 0, growthReaction ? 1 : 0),
      updatedAt: growthReaction?.updatedAt || marketDate,
      core: growthReaction ? `External reaction has a growth/risk read: ${growthReaction.title}.` : growthCore,
      checks: [
        ...reactionChecks(growthReaction),
        `DGS10 5D move is ${formatBp(d5Ten)}.`,
        `DGS10 21-observation move is ${formatBp(d21Ten)}.`,
        `10Y breakeven 5D contribution is ${driverAttribution["10Y"].breakeven.contribution}.`,
        crossAssetSignals.interpretation,
      ],
      interpretation: growthInterpretation,
      evidence: [
        ...reactionEvidence(growthReaction),
        {
          time: marketDate,
          weight: 1,
          text: growthEvidence,
        },
      ],
    },
    {
      id: "term_premium",
      title: "Long-end term premium / fiscal supply",
      score: Math.max(moves.d30Bp > moves.d10Bp && curveShape.raw.spread10s30ChangeBp > 0 ? 1 : 0, termReaction ? 1 : 0),
      updatedAt: termReaction?.updatedAt || marketDate,
      core:
        termReaction
          ? `External reaction includes long-end / duration-demand pressure, but local 30Y curve proxies remain the confirmation layer.`
          : "Local curve proxies do not show independent 30Y stress over the 5D window.",
      checks: [
        ...reactionChecks(termReaction),
        `DGS30 5D move is ${formatBp(moves.d30Bp)} versus DGS10 ${formatBp(moves.d10Bp)}.`,
        `5s30s 5D change is ${curveShape.spreads["5s30s"].change}.`,
        `10s30s 5D change is ${curveShape.spreads["10s30s"].change}.`,
        "ACM / Kim-Wright term premium is unavailable.",
        "Auction tail and bid-to-cover are unavailable.",
        "MOVE index is unavailable.",
      ],
      interpretation:
        `The absence of 30Y-led bear steepening argues against upgrading long-end duration, but it also removes the main long-end stress veto for ${marketDate}.`,
      evidence: [
        ...reactionEvidence(termReaction),
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
      score: Math.max(riskStress ? 1 : 0, riskReaction ? 2 : 0),
      updatedAt: riskReaction?.updatedAt || latestCrossAssetDate(crossAssetSignals) || marketDate,
      core:
        riskReaction
          ? `External reaction flags risk/liquidity pressure: ${riskReaction.title}.`
          : "Risk appetite is mixed: headline CNN Fear & Greed is in greed, while junk-bond-demand internals are weaker.",
      checks: [
        ...reactionChecks(riskReaction),
        crossAssetSignals.interpretation,
        "HY OAS is unavailable.",
        "DXY and funding stress data are unavailable.",
        "MOVE index is unavailable.",
      ],
      interpretation:
        riskReaction
          ? "External market-reaction evidence says growth/AI beta valuation pressure was part of the selloff; local cross-asset caches remain stale and cannot independently confirm the full move."
          : "Risk/liquidity does not dominate the rates signal, but weak credit appetite keeps the duration read conditional.",
      evidence: [
        ...reactionEvidence(riskReaction),
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
      score: Math.max(technical.hasExhaustion ? 2 : 0, technicalReaction ? 1 : 0),
      updatedAt: technicalReaction?.updatedAt || marketDate,
      core:
        technicalReaction
          ? `External reaction includes technical / positioning pressure: ${technicalReaction.title}.`
          : technical.hasExhaustion
          ? `RSI and Bollinger z-scores show a yield-up exhaustion setup on ${marketDate}, but it is only a timing overlay.`
          : `Technical indicators do not show a clear yield-up exhaustion setup on ${marketDate}.`,
      checks: technical.signals.map((signal) => `${signal.title}: ${signal.value}`),
      interpretation:
        technical.hasExhaustion
          ? "Technical signals can support timing only after rate-shock and driver attribution agree; they do not create a standalone trade."
          : "Technical signals are not strong enough to create or upgrade a duration action without a fundamental shock.",
      evidence: [
        ...reactionEvidence(technicalReaction),
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

function buildNarrativeReactionSupport(marketReaction) {
  const support = new Map();
  if (marketReaction?.sourceCoverageStatus !== "ready" || !Array.isArray(marketReaction.themes)) {
    return support;
  }
  marketReaction.themes.forEach((theme) => {
    (theme.linkedNarrativeIds || []).forEach((id) => {
      const existing = support.get(id);
      const weight = Number(theme.weight) || 0;
      if (!existing || weight > existing.weight) {
        support.set(id, {
          id,
          title: theme.title,
          weight,
          updatedAt: marketReaction.asOf || latestReactionEvidenceDate(theme) || "unavailable",
          interpretation: theme.interpretation,
          evidence: theme.evidence || [],
        });
      }
    });
  });
  return support;
}

function latestReactionEvidenceDate(theme) {
  return (theme.evidence || [])
    .map((item) => item.publishedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function reactionChecks(reaction) {
  if (!reaction) {
    return [];
  }
  return [
    `External market reaction: ${reaction.title} (${formatPercent(reaction.weight / 100)} weight).`,
    reaction.interpretation,
  ].filter(Boolean);
}

function reactionEvidence(reaction) {
  if (!reaction) {
    return [];
  }
  return [
    {
      time: reaction.updatedAt,
      weight: Math.max(1, Math.round((reaction.weight || 0) / 25)),
      text: reaction.interpretation || reaction.title,
    },
  ];
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
  const longEndParticipates =
    Number.isFinite(curveShape.raw.d30Bp) &&
    Number.isFinite(curveShape.raw.d10Bp) &&
    curveShape.raw.d30Bp >= curveShape.raw.d10Bp - 2 &&
    curveShape.raw.spread10s30ChangeBp <= 0 &&
    curveShape.raw.spread5s30ChangeBp <= 0;
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
  if (thirtyExtreme && !longEndVeto && longEndParticipates && technical.hasExhaustion) {
    currentIndex = 4;
  }

  const labels = [
    "No trade / wait",
    "Watchlist only",
    "Start 10Y nibble",
    "Start 10Y nibble / intermediate-duration watch",
    "Add long-end duration",
    "Add convex duration / STRIPS-like exposure",
  ];
  const explanation =
    currentIndex === 0
      ? `${marketDate} does not show an extreme 5D rates shock, 30Y stress is not the binding problem, and technical exhaustion is absent; the duration panel stays at No trade / wait.`
      : currentIndex === 3
        ? "The duration panel upgrades to intermediate duration because the 10Y shock is extreme, real-yield led, and technically stretched, while 30Y does not show enough independent participation to justify long-end duration."
        : currentIndex === 4
          ? "The duration panel upgrades to long-end duration because 30Y shock is extreme, term-premium proxies are not steepening, and 30Y participates closely enough in the 10Y shock."
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
      tenExtreme
        ? "10Y shock is extreme in the available local-cache window and is real-yield led."
        : "The 5D rates move is small enough that there is no need to chase duration.",
      "Local CNN headline risk appetite is not in broad panic.",
    ],
    opposes: [
      thirtyExtreme && !longEndParticipates
        ? "30Y shock is elevated, but 30Y lags 10Y by more than 2bp over 5D, so long-end participation is not strong enough for index 4."
        : tenExtreme
          ? "30Y shock is not extreme enough and long-end confirmation is not strong enough to upgrade beyond intermediate duration."
        : "10Y and 30Y shock percentiles are not extreme in the available local-cache window.",
      technical.hasExhaustion
        ? "Technical exhaustion is present, but it is only a timing overlay and cannot justify long-end duration by itself."
        : "Technical exhaustion is not confirmed by RSI, Bollinger z-score, 20D percentile, or nine-turn proxy.",
      "SOFR/Fed funds futures, MOVE, formal term premium, and CFTC positioning are unavailable.",
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

function buildFirstRead({ marketDate, rateShockRows, curveShape, driverAttribution, durationAction, technical }) {
  const tenYear = findRow(rateShockRows, "10Y");
  const thirtyYear = findRow(rateShockRows, "30Y");
  const missingConfirmations = [
    "MOVE",
    "拍卖",
    "持仓",
    "期限溢价",
  ];
  if (durationAction.currentIndex === 3) {
    return {
      title: "Start 10Y nibble / intermediate-duration watch",
      subtitle:
        `10Y 利率冲击已经进入可试仓区间，但${missingConfirmations.join("、")}证据缺失，当前只支持小比例试 7-10Y，不支持正式加满中久期。`,
      asOf: marketDate,
      source: "durationAction + rateShock + driverAttribution",
    };
  }
  if (durationAction.currentIndex === 2) {
    return {
      title: "Start 10Y nibble",
      subtitle:
        `10Y 5D 为 ${tenYear?.d5 || "unavailable"}，技术面开始支持试仓；但确认信号仍不足，先保持小比例。`,
      asOf: marketDate,
      source: "durationAction + technical",
    };
  }
  if (durationAction.currentIndex === 4) {
    return {
      title: "Add long-end duration watch",
      subtitle:
        `30Y 冲击达到高分位且长端曲线没有继续恶化，但仍需 MOVE、拍卖和期限溢价确认后再提高长端权重。`,
      asOf: marketDate,
      source: "durationAction + curveShape",
    };
  }
  if (durationAction.currentIndex === 5) {
    return {
      title: "Convex duration watch",
      subtitle:
        "长端稳定、增长/通胀回落与技术衰竭同时出现；仅在这些条件继续确认时考虑 convex duration。",
      asOf: marketDate,
      source: "durationAction",
    };
  }
  if (durationAction.currentIndex === 1) {
    return {
      title: "Watchlist only",
      subtitle:
        `利率 tape 还没有给出足够清晰的试仓窗口；等待 ${curveShape.label}、real-yield 归因和技术面进一步确认。`,
      asOf: marketDate,
      source: "durationAction",
    };
  }
  return {
    title: "No trade / wait",
    subtitle:
      `DGS10 5D ${tenYear?.d5 || "unavailable"}、DGS30 5D ${thirtyYear?.d5 || "unavailable"}；${technical.hasExhaustion ? "技术面有扰动但不足以独立触发动作" : "技术面未确认衰竭"}。`,
    asOf: marketDate,
    source: "durationAction",
  };
}

function buildReportTitle(rateShockRows, curveShape, technical) {
  const tenYear = findRow(rateShockRows, "10Y");
  const thirtyYear = findRow(rateShockRows, "30Y");
  const tenSelloffExtreme = (tenYear?.raw?.d5Pctile || 0) >= 85 && (tenYear?.raw?.d5Bp || 0) > 0;
  const thirtySelloffExtreme = (thirtyYear?.raw?.d5Pctile || 0) >= 90 && (thirtyYear?.raw?.d5Bp || 0) > 0;

  if (curveShape.label === "bear steepening") {
    return "Long-end stress is the binding rates risk";
  }
  if (tenSelloffExtreme && technical.hasExhaustion) {
    return "10Y shock is entering a duration watch window";
  }
  if (thirtySelloffExtreme) {
    return "Long-end selloff is elevated but not independently leading";
  }
  if ((tenYear?.raw?.d5Bp || 0) < 0 && (thirtyYear?.raw?.d5Bp || 0) < 0) {
    return "Rates tape is rallying without exhaustion confirmation";
  }
  return "Rates tape is not in a shock window";
}

function buildReportSummary(marketDate, rateShockRows, curveShape, durationAction, technical) {
  const tenYear = findRow(rateShockRows, "10Y");
  const thirtyYear = findRow(rateShockRows, "30Y");
  const exhaustionText = technical.hasExhaustion ? "with a technical timing overlay" : "without technical exhaustion confirmation";
  return `${marketDate} rates show DGS10 5D ${tenYear?.d5 || "unavailable"}, DGS30 5D ${thirtyYear?.d5 || "unavailable"}, ${curveShape.label}, and duration index ${durationAction.currentIndex} ${exhaustionText}.`;
}

function buildReport(dashboard) {
  const rows = dashboard.rateShockRows;
  const d3 = findRow(rows, "3Y");
  const d5 = findRow(rows, "5Y");
  const d10 = findRow(rows, "10Y");
  const d30 = findRow(rows, "30Y");
  const fiveDayTone = describeFiveDayTone(d10, d30);
  const tenShockExtreme = (d10?.raw?.d5Pctile || 0) >= 85 && (d10?.raw?.d5Bp || 0) > 0;
  const thirtyShockExtreme = (d30?.raw?.d5Pctile || 0) >= 90 && (d30?.raw?.d5Bp || 0) > 0;
  const shockSentence =
    tenShockExtreme || thirtyShockExtreme
      ? `${dashboard.marketDate} 的美国利率日终数据显示显著 5D selloff shock：DGS10 5D 为 ${d10.d5}（${d10.d5Pctile}），DGS30 5D 为 ${d30.d5}（${d30.d5Pctile}）。`
      : `${dashboard.marketDate} 的美国利率日终数据没有显示新的极端 shock：DGS10 5D 为 ${d10.d5}，DGS30 5D 为 ${d30.d5}。`;
  const narrativeExtrapolation =
    dashboard.technical.hasExhaustion
      ? `${dashboard.marketDate} 的主流叙事没有达到单一拥挤状态。5D shock 已经显著，且 RSI / Bollinger 给出 timing 支持；但驱动主要是 10Y real-yield led，30Y term-premium proxy 没有继续恶化，MOVE / auction / CFTC 仍缺失。因此可以把它当成 intermediate duration 的条件化窗口，但不能把它直接外推成 long-end 或 convex duration。`
      : `${dashboard.marketDate} 的主流叙事没有达到单一拥挤状态。63-observation 的背景仍偏 policy-path bear flattening，但 5D window 不是前端加速上行；inflation compensation 也不是 5D 的主导上行驱动；30Y term-premium proxy 没有继续恶化。技术面没有顶部衰竭确认，因此不能把${fiveDayTone}直接外推成可加仓窗口。`;
  const topNarratives = dashboard.narratives
    .map((item, index) => `${index + 1}. ${item.title}: ${stars(item.score)} score ${item.score} - ${item.core}`)
    .join("\n");
  const missing = dashboard.dataGaps.map((item) => `- ${item}`).join("\n");
  const crossChecks = (dashboard.crossSourceVerification || [])
    .map((item) => {
      const proxy = item.proxyUsed ? "; proxyUsed: true" : "";
      return `- ${item.source}: ${item.role}; latestDate ${item.latestDate}${proxy}. ${item.note}`;
    })
    .join("\n");
  const marketReactionText = formatMarketReactionReport(dashboard.marketReaction);
  const marketReactionConflict = formatMarketReactionConflict(dashboard);
  const marketReactionAsOf = dashboard.marketReaction?.asOf || dashboard.marketDate;
  const curveEventContext = formatCurveEventContext(dashboard);
  const driverCurveLink = formatDriverCurveLink(dashboard);
  const checks = dashboard.narratives
    .map((item) => `- ${item.title}: score ${item.score}; updatedAt ${item.updatedAt}; ${item.interpretation}`)
    .join("\n");
  return `# ${dashboard.date} Rates Duration Report

## ${dashboard.date} 一句话结论

${shockSentence} 曲线是 ${dashboard.curveShape.label}，技术衰竭${dashboard.technical.hasExhaustion ? "有条件出现" : "没有确认"}。Duration Action Panel 维持 ${dashboard.durationAction.currentIndex} - ${dashboard.durationAction.label}。

## 利率冲击是否罕见

本地可确认的市场日期是 ${dashboard.marketDate}。${dashboard.marketStatus} 本报告使用 ${dashboard.marketDate} 作为 marketDate。

## 多方验证记录

${crossChecks}

| Tenor | Level | 1D | 5D | 21D | 3M | Local percentile note | 5D z |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| DGS2 | ${findRow(rows, "2Y").level} | ${findRow(rows, "2Y").d1} | ${findRow(rows, "2Y").d5} | ${findRow(rows, "2Y").d21} | ${findRow(rows, "2Y").d3m} | ${findRow(rows, "2Y").d5Pctile} | ${findRow(rows, "2Y").zScore} |
| DGS3 | ${d3.level} | ${d3.d1} | ${d3.d5} | ${d3.d21} | ${d3.d3m} | 5D ${d3.d5Pctile}; 3M ${d3.d3mPctile} | ${d3.zScore} |
| DGS5 | ${d5.level} | ${d5.d1} | ${d5.d5} | ${d5.d21} | ${d5.d3m} | 5D ${d5.d5Pctile}; 3M ${d5.d3mPctile} | ${d5.zScore} |
| DGS10 | ${d10.level} | ${d10.d1} | ${d10.d5} | ${d10.d21} | ${d10.d3m} | 5D ${d10.d5Pctile}; 3M ${d10.d3mPctile} | ${d10.zScore} |
| DGS30 | ${d30.level} | ${d30.d1} | ${d30.d5} | ${d30.d21} | ${d30.d3m} | 5D ${d30.d5Pctile}; 3M ${d30.d3mPctile} | ${d30.zScore} |

${dashboard.dataQuality.percentileProxyUsed ? `星号表示分位数使用 ${dashboard.dataQuality.treasuryHistoryStart} 到 ${dashboard.marketDate} 的本地 Treasury cache 代理，不是完整 10 年或完整 2022-01-01 后样本。该限制会降低极端分位的可比性。` : `分位数使用 ${dashboard.dataQuality.treasuryHistoryStart} 到 ${dashboard.marketDate} 的本地公开历史缓存；当前已覆盖完整 10 年窗口和 2022-01-01 后 regime 窗口。`}

## 市场 ${marketReactionAsOf} 在交易什么

${marketReactionText}

外部叙事与本地 tape 差异：${marketReactionConflict}

## 哪段曲线在动

5D 比较日期是 ${d10.comparedTo.d5}。DGS3 ${d3.d5}，DGS5 ${d5.d5}，DGS10 ${d10.d5}，DGS30 ${d30.d5}。3s10s 为 ${dashboard.curveShape.spreads["3s10s"].level}，5D 变化 ${dashboard.curveShape.spreads["3s10s"].change}；5s30s 为 ${dashboard.curveShape.spreads["5s30s"].level}，5D 变化 ${dashboard.curveShape.spreads["5s30s"].change}；10s30s 为 ${dashboard.curveShape.spreads["10s30s"].level}，5D 变化 ${dashboard.curveShape.spreads["10s30s"].change}。

含义：${dashboard.curveShape.interpretation}

事件背景：${curveEventContext}

## 驱动归因

5Y 5D move ${dashboard.driverAttribution["5Y"].move}: real yield ${dashboard.driverAttribution["5Y"].realYield.contribution} / ${dashboard.driverAttribution["5Y"].realYield.share}, breakeven ${dashboard.driverAttribution["5Y"].breakeven.contribution} / ${dashboard.driverAttribution["5Y"].breakeven.share}, residual ${dashboard.driverAttribution["5Y"].residual.contribution} / ${dashboard.driverAttribution["5Y"].residual.share}。

10Y 5D move ${dashboard.driverAttribution["10Y"].move}: real yield ${dashboard.driverAttribution["10Y"].realYield.contribution} / ${dashboard.driverAttribution["10Y"].realYield.share}, breakeven ${dashboard.driverAttribution["10Y"].breakeven.contribution} / ${dashboard.driverAttribution["10Y"].breakeven.share}, residual ${dashboard.driverAttribution["10Y"].residual.contribution} / ${dashboard.driverAttribution["10Y"].residual.share}。

30Y 5D move ${dashboard.driverAttribution["30Y"].move}。30Y real yield、30Y breakeven、ACM / Kim-Wright term premium 均为 unavailable；本报告使用 5s30s 与 10s30s 作为 proxyUsed: true 的长端代理。${dashboard.driverAttribution["30Y"].interpretation}

模块2联动证据：${driverCurveLink}

## 市场正在交易什么分歧

${topNarratives}

完整叙事检查：

${checks}

## 叙事是否过度外推

${narrativeExtrapolation}

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

function formatMarketReactionReport(reaction) {
  const model = reaction || {};
  const themes = Array.isArray(model.themes) ? model.themes : [];
  const sourceMix = Array.isArray(model.sourceMix)
    ? model.sourceMix.map((item) => `${formatSourceTypeCn(item.type)}：${item.count || 0} 条 / ${item.weight || 0}%`).join("；")
    : "来源结构不可用";
  const lines = [
    `覆盖窗口：${model.coverageWindow || "unavailable"}。状态：${model.sourceCoverageStatus || "unavailable"}。`,
    `摘要：${model.summary || "unavailable"}`,
    `来源结构：${sourceMix}`,
    "",
  ];
  themes.forEach((theme) => {
    lines.push(`${theme.rank || "-"}）${theme.title}: ${theme.weight || 0}% - ${theme.interpretation || "未提供解释。"}`);
    (theme.evidence || []).forEach((item) => {
      lines.push(`   - ${formatSourceTypeCn(item.sourceType)} / ${item.sourceName || "未知来源"} / ${item.publishedAt || "unavailable"}: ${item.summary || item.quoteOrSummary || ""}`);
    });
  });
  return lines.join("\n");
}

function formatSourceTypeCn(value) {
  const labels = {
    media: "媒体",
    institution: "机构",
    official: "官方",
    community: "社群",
    automation: "自动化",
  };
  return labels[String(value || "").toLowerCase()] || String(value || "来源");
}

function formatMarketReactionConflict(dashboard) {
  const reaction = dashboard.marketReaction || {};
  if (reaction.sourceCoverageStatus !== "ready") {
    return "marketReaction 输入尚未就绪，因此本报告不比较外部共识与本地诊断。";
  }
  const topThemes = (reaction.themes || [])
    .slice(0, 2)
    .map((theme) => theme.title)
    .join(" / ");
  const fiveYear = dashboard.driverAttribution?.["5Y"];
  const tenYear = dashboard.driverAttribution?.["10Y"];
  return `外部覆盖把 ${topThemes || "unavailable"} 排在最高权重，但本地 5D 归因显示 5Y 由 ${fiveYear?.dominantDriver || "unavailable"} 主导、10Y 由 ${tenYear?.dominantDriver || "unavailable"} 主导；10Y breakeven 贡献为 ${tenYear?.breakeven?.contribution || "unavailable"}，所以本报告把 inflation / Fed-path 叙事视为市场消化过程，而不是 breakeven 主导 tape 的证明。`;
}

function formatCurveEventContext(dashboard) {
  const context = dashboard.curveShape?.eventContext;
  if (!context || context.sourceCoverageStatus !== "ready") {
    return "缺少外部市场反应输入，曲线模块只能解释本地 rates tape。";
  }
  const themeText = (context.topThemes || [])
    .map((theme) => `${theme.title}（${Math.round(Number(theme.weight) || 0)}%）`)
    .join("；");
  const mismatch = context.dataDateMismatch
    ? `注意：外部叙事覆盖到 ${context.asOf}，但本地曲线数值只覆盖到 ${dashboard.marketDate}，所以较新的事件冲击不能被旧曲线读数机械否定。`
    : "外部叙事日期和本地曲线日期没有明显错位。";
  return `${mismatch}${themeText ? ` 主要事件叙事是：${themeText}。` : ""}${context.implication ? ` ${context.implication}` : ""}`;
}

function formatDriverCurveLink(dashboard) {
  const link = dashboard.driverAttribution?.curveLink;
  if (!link) {
    return "Module 3 尚未生成与 Module 2 的联动证据。";
  }
  const evidence = (link.evidence || []).map((item) => ` ${item}`).join("");
  return `${link.conclusion}${evidence}`;
}

function describeFiveDayTone(d10, d30) {
  const tenMove = d10?.raw?.d5Bp;
  const thirtyMove = d30?.raw?.d5Bp;
  const tenPctile = d10?.raw?.d5Pctile;
  const thirtyPctile = d30?.raw?.d5Pctile;
  if (Number.isFinite(tenMove) && Number.isFinite(thirtyMove)) {
    if (tenMove > 0 && thirtyMove > 0) {
      if ((tenPctile || 0) >= 85 || (thirtyPctile || 0) >= 85) {
        return "显著上行冲击";
      }
      return "温和上行";
    }
    if (tenMove < 0 && thirtyMove < 0) {
      return "温和回落";
    }
  }
  return "混合波动";
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

function shiftIsoDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
