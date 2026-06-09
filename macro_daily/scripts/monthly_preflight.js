#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const OUT_DATA_DIR = path.join(ROOT, "macro_daily", "data");
const OUT_REPORT_DIR = path.join(ROOT, "macro_daily", "reports");

const RUN_DATE = process.env.RUN_DATE || localDateIso();
const MONTH = RUN_DATE.slice(0, 7);
const OUTPUT_JSON = path.join(OUT_DATA_DIR, `${MONTH}_monthly_preflight.json`);
const OUTPUT_REPORT = path.join(OUT_REPORT_DIR, `${MONTH}_monthly_preflight.md`);

const REQUIRED_TREASURY_SERIES = ["dgs2", "us3y", "dgs5", "dgs10", "us30y", "dfii5", "t5yie", "t10yie"];
const REQUIRED_PUBLIC_SERIES = [
  "DGS2",
  "DGS3",
  "DGS5",
  "DGS10",
  "DGS30",
  "DFII5",
  "DFII10",
  "DFII30",
  "T5YIE",
  "T10YIE",
  "T5YIFR",
  ["MOVE", "MOVECLS", "MOVE_PROXY_RATES_VOL"],
  "VIXCLS",
  "BAMLH0A0HYM2",
  "DTWEXBGS",
  "DCOILWTICO",
  ["GOLDAMGBD228NLBM", "GOLD_PROXY_COMEX"],
  "PCOPPUSDM",
];

const PUBLIC_SERIES_MAX_AGE_DAYS = {
  DCOILWTICO: 10,
  PCOPPUSDM: 120,
};

function main() {
  fs.mkdirSync(OUT_DATA_DIR, { recursive: true });
  fs.mkdirSync(OUT_REPORT_DIR, { recursive: true });

  const treasury = readTreasuryCache();
  const publicData = readJsonIfExists(path.join(CACHE_DIR, "public_market_data.json"));
  const marketDate = treasury?.updatedAt || latestTreasuryDate(treasury) || RUN_DATE;
  const cacheChecks = checkCaches({ treasury, publicData, marketDate });
  const codeReview = reviewCodebase();
  const result = {
    month: MONTH,
    runDate: RUN_DATE,
    generatedAt: new Date().toISOString(),
    marketDate,
    cacheChecks,
    codeReview,
    policy:
      "This monthly preflight may validate caches and produce recommendations before dashboard generation, but it must not edit code until the user explicitly confirms.",
  };

  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(OUTPUT_REPORT, buildReport(result));
  process.stdout.write(`Wrote ${OUTPUT_JSON}\n`);
  process.stdout.write(`Wrote ${OUTPUT_REPORT}\n`);
}

function checkCaches({ treasury, publicData, marketDate }) {
  const issues = [];
  const warnings = [];
  const ok = [];

  if (!treasury) {
    issues.push("Treasury cache is missing or cannot be parsed.");
  } else {
    const historyStart = treasury.historyStart || latestTreasuryDate(treasury);
    const requiredStart = shiftIsoDate(marketDate, -3653);
    if (historyStart && historyStart <= requiredStart) {
      ok.push(`Treasury cache covers the 10-year window from ${historyStart} to ${marketDate}.`);
    } else {
      warnings.push(
        `Treasury cache starts at ${historyStart || "unavailable"}; full 10-year percentiles require ${requiredStart} or earlier.`,
      );
    }
    REQUIRED_TREASURY_SERIES.forEach((key) => {
      const points = treasury.series?.[key] || [];
      if (!points.length) {
        issues.push(`Treasury cache is missing ${key}.`);
        return;
      }
      const latest = points[points.length - 1]?.date || "unavailable";
      if (latest < shiftIsoDate(marketDate, -7)) {
        warnings.push(`${key} latest point is ${latest}, more than 7 calendar days behind marketDate ${marketDate}.`);
      }
      const duplicateCount = countDuplicateDates(points);
      if (duplicateCount) {
        warnings.push(`${key} contains ${duplicateCount} duplicate date rows.`);
      }
    });
  }

  if (!publicData) {
    warnings.push("Public market data cache is missing; run update_public_data_cache.js when network access is available.");
  } else {
    const series = publicData.series || {};
    const missing = REQUIRED_PUBLIC_SERIES.filter((seriesId) => !hasAnyPublicSeries(series, seriesId));
    if (missing.length) {
      warnings.push(`Public cache is missing ${missing.map(formatSeriesRequirement).join(", ")}.`);
    } else {
      ok.push("Public cache contains all configured FRED/public series.");
    }
    REQUIRED_PUBLIC_SERIES.forEach((seriesId) => {
      const selectedSeriesId = selectAvailablePublicSeries(series, seriesId);
      const points = series[selectedSeriesId]?.points || [];
      if (!points.length) {
        return;
      }
      const latest = points[points.length - 1]?.date || "unavailable";
      const maxAgeDays = PUBLIC_SERIES_MAX_AGE_DAYS[selectedSeriesId] || 7;
      if (latest < shiftIsoDate(marketDate, -maxAgeDays)) {
        warnings.push(`${selectedSeriesId} latest point is ${latest}, more than ${maxAgeDays} calendar days behind marketDate ${marketDate}.`);
      }
    });
    if ((publicData.fetchErrors || []).length) {
      warnings.push(`Public cache has ${publicData.fetchErrors.length} fetch errors from the last update.`);
    }
    if (!publicData.cftc?.asOf) {
      warnings.push("Public cache is missing CFTC Treasury futures positioning.");
    } else {
      ok.push(`CFTC Treasury futures positioning is available through ${publicData.cftc.asOf}.`);
    }
    const networkWarnings = publicDataNetworkWarnings(publicData);
    warnings.push(...networkWarnings);
  }

  return {
    status: issues.length ? "fail" : warnings.length ? "warn" : "pass",
    issues,
    warnings,
    ok,
  };
}

function hasAnyPublicSeries(series, seriesIdOrIds) {
  return Boolean(selectAvailablePublicSeries(series, seriesIdOrIds));
}

function selectAvailablePublicSeries(series, seriesIdOrIds) {
  const candidates = Array.isArray(seriesIdOrIds) ? seriesIdOrIds : [seriesIdOrIds];
  return candidates.find((seriesId) => (series[seriesId]?.points || []).length) || "";
}

function formatSeriesRequirement(seriesIdOrIds) {
  return Array.isArray(seriesIdOrIds) ? seriesIdOrIds.join(" or ") : seriesIdOrIds;
}

function publicDataNetworkWarnings(publicData) {
  const diagnostics = publicData.networkDiagnostics;
  if (!diagnostics) {
    return [];
  }
  const warnings = [];
  if (diagnostics.dnsFred && !diagnostics.dnsFred.ok) {
    warnings.push(`DNS lookup for fred.stlouisfed.org failed: ${diagnostics.dnsFred.error || "unknown error"}.`);
  }
  if (diagnostics.directIpConnect && !diagnostics.directIpConnect.ok) {
    warnings.push(`Direct IP connectivity test failed: ${diagnostics.directIpConnect.error || "unknown error"}.`);
  }
  return warnings;
}

function reviewCodebase() {
  const files = [
    "macro_daily/scripts/generate_daily_dashboard.js",
    "macro_daily/scripts/update_public_data_cache.js",
    "macro_daily/scripts/monthly_preflight.js",
  ];
  const metrics = files
    .filter((file) => fs.existsSync(path.join(ROOT, file)))
    .map((file) => {
      const text = fs.readFileSync(path.join(ROOT, file), "utf8");
      return {
        file,
        lines: text.split(/\r?\n/).length,
        functions: (text.match(/\nfunction\s+/g) || []).length,
        unavailableMentions: (text.match(/unavailable/g) || []).length,
      };
    });

  const suggestions = [
    {
      priority: 1,
      title: "Split dashboard generation into data, analytics, narrative, and report modules",
      detail:
        "generate_daily_dashboard.js now owns cache IO, calculations, narrative scoring, action rules, and Markdown rendering. That makes monthly changes riskier than necessary.",
      requiresConfirmation: true,
    },
    {
      priority: 1,
      title: "Create one feed registry for required sources and dataGaps",
      detail:
        "Missing-source strings are currently assembled in several places. A registry would prevent contradictions such as a feed appearing in cross-asset signals while still being listed as missing.",
      requiresConfirmation: true,
    },
    {
      priority: 2,
      title: "Separate external marketReaction from rule-based narrative scoring",
      detail:
        "The code already keeps these conceptually separate, but the function signatures pass marketReaction into scoring without using it consistently. Make that boundary explicit.",
      requiresConfirmation: true,
    },
    {
      priority: 2,
      title: "Move report prose templates out of analytics functions",
      detail:
        "Markdown generation embeds several English and Chinese explanations beside calculation logic. A small report renderer would make wording changes less likely to alter analytics.",
      requiresConfirmation: true,
    },
    {
      priority: 3,
      title: "Add fixture-based tests for the six fixed narratives and duration index",
      detail:
        "Current verification is mostly post-run validation. A small fixture test would catch score drift before a dashboard file is written.",
      requiresConfirmation: true,
    },
  ];

  const conflicts = [
    {
      title: "Public data cache can say VIX exists while Technical Exhaustion still says MOVE is unavailable",
      detail:
        "This is acceptable as a proxy distinction, but the report wording should stay precise: VIX is not MOVE, and VIX should not silently replace MOVE.",
    },
    {
      title: "Auction evidence currently lives in marketReaction rather than a structured auction cache",
      detail:
        "The market narrative can cite auctions, but duration rules still cannot use tail/bid-to-cover mechanically until auction data has a first-class schema.",
    },
    {
      title: "FRED-augmented Treasury history and Treasury XML history may overlap",
      detail:
        "The merge prefers FRED for overlapping dates. That is fine for standard DGS series, but it should be documented because Treasury XML remains the freshest controlling source intramonth.",
    },
  ];

  return {
    status: "advisory_only",
    metrics,
    suggestions,
    conflicts,
  };
}

function buildReport(result) {
  const cache = result.cacheChecks;
  const review = result.codeReview;
  return `# ${result.month} Monthly Macro Preflight

Generated at: ${result.generatedAt}
Run date: ${result.runDate}
Market date checked: ${result.marketDate}

## Policy

This preflight runs before dashboard generation on the first run of each month. It validates historical data cache health and produces code-health recommendations. It does not edit production code unless the user confirms a specific change plan.

## Historical Cache Validation

Status: ${cache.status}

Passes:
${formatList(cache.ok)}

Warnings:
${formatList(cache.warnings)}

Issues:
${formatList(cache.issues)}

## Network Diagnostics

${formatNetworkDiagnostics(result)}

## Script Size

${review.metrics.map((item) => `- ${item.file}: ${item.lines} lines, ${item.functions} functions, ${item.unavailableMentions} unavailable mentions`).join("\n")}

## Suggested Optimizations

${review.suggestions.map((item) => `- P${item.priority} ${item.title}: ${item.detail}`).join("\n")}

## Possible Logic Conflicts

${review.conflicts.map((item) => `- ${item.title}: ${item.detail}`).join("\n")}
`;
}

function formatNetworkDiagnostics(result) {
  const publicData = readJsonIfExists(path.join(CACHE_DIR, "public_market_data.json"));
  const diagnostics = publicData?.networkDiagnostics;
  if (!diagnostics) {
    return "- No public data network diagnostics recorded.";
  }
  return [
    `- checkedAt: ${diagnostics.checkedAt || "unavailable"}`,
    `- DNS fred.stlouisfed.org: ${diagnostics.dnsFred?.ok ? diagnostics.dnsFred.output : diagnostics.dnsFred?.error || "unavailable"}`,
    `- direct IP connectivity: ${diagnostics.directIpConnect?.ok ? "ok" : diagnostics.directIpConnect?.error || "unavailable"}`,
  ].join("\n");
}

function readTreasuryCache() {
  const wrapper = readJsonIfExists(path.join(CACHE_DIR, "treasury_yield_curve.json"));
  if (!wrapper?.body) {
    return null;
  }
  const payload = JSON.parse(wrapper.body);
  const series = {};
  Object.entries(payload.series || {}).forEach(([key, points]) => {
    series[key] = (points || [])
      .filter((point) => point?.date && Number.isFinite(point.value))
      .map((point) => ({ date: point.date, value: point.value, filled: Boolean(point.filled) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });
  const allDates = Object.values(series)
    .flat()
    .map((point) => point.date)
    .sort();
  return {
    updatedAt: payload.updatedAt || allDates[allDates.length - 1] || "",
    fetchedAt: payload.fetchedAt || "",
    historyStart: allDates[0] || "",
    series,
  };
}

function latestTreasuryDate(treasury) {
  const dates = Object.values(treasury?.series || {})
    .flat()
    .map((point) => point.date)
    .sort();
  return dates[dates.length - 1] || "";
}

function countDuplicateDates(points) {
  const seen = new Set();
  let count = 0;
  points.forEach((point) => {
    if (seen.has(point.date)) {
      count += 1;
    }
    seen.add(point.date);
  });
  return count;
}

function formatList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return {
      parseError: error.message,
    };
  }
}

function shiftIsoDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localDateIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

main();
