#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const PUBLIC_DOWNLOAD_DIR = path.join(CACHE_DIR, "public_downloads");
const PUBLIC_CACHE_PATH = path.join(CACHE_DIR, "public_market_data.json");
const TREASURY_CACHE_PATH = path.join(CACHE_DIR, "treasury_yield_curve.json");
const FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=";
const CFTC_TFF_URL = "https://publicreporting.cftc.gov/resource/gpe5-46if.json";
const CFTC_FINANCIAL_FUTURES_ZIP_URL = `https://www.cftc.gov/files/dea/history/fut_fin_txt_${new Date().getFullYear()}.zip`;
const CFTC_FINANCIAL_FUTURES_ZIP = path.join(PUBLIC_DOWNLOAD_DIR, `fut_fin_txt_${new Date().getFullYear()}.zip`);
const GITHUB_XAUUSD_URL = "https://raw.githubusercontent.com/FeziweMelvin/XAUUSD-Gold-Price/main/XAU_1d_data.csv";
const GITHUB_XAUUSD_CACHE = path.join(CACHE_DIR, "github_xauusd_gold.json");
const GOLD_PROXY_SERIES_ID = "GOLD_PROXY_COMEX";
const MOVE_PROXY_SERIES_ID = "MOVE_PROXY_RATES_VOL";

const FRED_SERIES = [
  ["DGS2", "2Y nominal Treasury"],
  ["DGS3", "3Y nominal Treasury"],
  ["DGS5", "5Y nominal Treasury"],
  ["DGS10", "10Y nominal Treasury"],
  ["DGS30", "30Y nominal Treasury"],
  ["DFII5", "5Y real Treasury"],
  ["DFII10", "10Y real Treasury"],
  ["DFII30", "30Y real Treasury"],
  ["T5YIE", "5Y breakeven"],
  ["T10YIE", "10Y breakeven"],
  ["T5YIFR", "5Y5Y forward inflation"],
  ["VIXCLS", "CBOE VIX"],
  ["BAMLH0A0HYM2", "ICE BofA HY OAS"],
  ["DTWEXBGS", "Trade-weighted U.S. dollar broad index"],
  ["DCOILWTICO", "WTI crude oil"],
  ["GOLDAMGBD228NLBM", "London gold PM fix"],
  ["PCOPPUSDM", "Copper price"],
];

const MANUAL_GOLD_POINTS = [
  {
    date: "2026-05-08",
    value: 4730.7,
    source: "AP / COMEX Gold Jun 2026 futures",
    url: "https://finance.yahoo.com/markets/commodities/articles/bc-gold-futures-140023156.html",
  },
  {
    date: "2026-05-11",
    value: 4728.7,
    source: "AP / COMEX Gold Jun 2026 futures",
    url: "https://finance.yahoo.com/markets/commodities/articles/bc-gold-futures-140024415.html",
  },
  {
    date: "2026-05-12",
    value: 4686.7,
    source: "AP / COMEX Gold Jun 2026 futures",
    url: "https://finance.yahoo.com/markets/commodities/articles/bc-gold-futures-140025062.html",
  },
  {
    date: "2026-05-13",
    value: 4706.7,
    source: "AP / COMEX Gold Jun 2026 futures",
    url: "https://finance.yahoo.com/news/bc-gold-futures-140024123.html",
  },
  {
    date: "2026-05-14",
    value: 4685.3,
    source: "AP / COMEX Gold Jun 2026 futures",
    url: "https://finance.yahoo.com/markets/commodities/articles/bc-gold-futures-140025014.html",
  },
  {
    date: "2026-05-15",
    value: 4561.9,
    source: "AP / COMEX Gold Jun 2026 futures",
    url: "https://finance.yahoo.com/markets/commodities/articles/bc-gold-futures-140023174.html",
  },
];

const TREASURY_FRED_MAP = {
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

const CFTC_TREASURY_MARKETS = [
  "2-YEAR U.S. TREASURY NOTES - CHICAGO BOARD OF TRADE",
  "5-YEAR U.S. TREASURY NOTES - CHICAGO BOARD OF TRADE",
  "10-YEAR U.S. TREASURY NOTES - CHICAGO BOARD OF TRADE",
  "U.S. TREASURY BONDS - CHICAGO BOARD OF TRADE",
  "ULTRA U.S. TREASURY BONDS - CHICAGO BOARD OF TRADE",
];

function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const fetchedAt = new Date().toISOString();
  const publicCache = readJsonIfExists(PUBLIC_CACHE_PATH) || {
    source: "public market data cache",
    fetchedAt: "",
    series: {},
    fetchErrors: [],
  };
  publicCache.fetchedAt = fetchedAt;
  publicCache.fetchErrors = [];
  publicCache.networkDiagnostics = diagnoseNetwork();

  for (const [seriesId, description] of FRED_SERIES) {
    const existingCsv = readFredCache(seriesId);
    try {
      const csv = fetchFredCsv(seriesId, existingCsv);
      writeFredCache(seriesId, csv, fetchedAt);
      publicCache.series[seriesId] = {
        source: "FRED",
        description,
        fetchedAt,
        points: parseFredCsv(csv),
      };
      process.stdout.write(`updated FRED ${seriesId}\n`);
    } catch (error) {
      publicCache.fetchErrors.push({
        source: "FRED",
        seriesId,
        message: error.message,
      });
      if (existingCsv) {
        publicCache.series[seriesId] = {
          source: "FRED local cache",
          description,
          fetchedAt: getFredCacheFetchedAt(seriesId) || fetchedAt,
          stale: true,
          points: parseFredCsv(existingCsv),
        };
        process.stderr.write(`FRED ${seriesId} using stale local cache\n`);
      }
      process.stderr.write(`FRED ${seriesId} failed: ${error.message}\n`);
    }
  }

  updateGoldProxy(publicCache, fetchedAt);
  updateMoveProxy(publicCache, fetchedAt);
  updateCftcTreasuryFutures(publicCache, fetchedAt);
  mergeFredRatesIntoTreasuryCache(publicCache, fetchedAt);
  fs.writeFileSync(PUBLIC_CACHE_PATH, `${JSON.stringify(publicCache, null, 2)}\n`);
  process.stdout.write(`wrote ${PUBLIC_CACHE_PATH}\n`);
}

function updateMoveProxy(publicCache, fetchedAt) {
  const dgs10 = publicCache.series.DGS10?.points || [];
  const dgs30 = publicCache.series.DGS30?.points || [];
  const byDate = new Map();
  dgs10.forEach((point, index) => {
    if (!index) return;
    const previous = dgs10[index - 1];
    byDate.set(point.date, { date: point.date, dgs10Bp: (point.value - previous.value) * 100 });
  });
  dgs30.forEach((point, index) => {
    if (!index) return;
    const previous = dgs30[index - 1];
    const existing = byDate.get(point.date) || { date: point.date };
    existing.dgs30Bp = (point.value - previous.value) * 100;
    byDate.set(point.date, existing);
  });
  const daily = Array.from(byDate.values())
    .filter((point) => Number.isFinite(point.dgs10Bp) || Number.isFinite(point.dgs30Bp))
    .sort((a, b) => a.date.localeCompare(b.date));
  const points = daily
    .map((point, index) => {
      const window = daily.slice(Math.max(0, index - 20), index + 1);
      if (window.length < 10) return null;
      const squared = window.flatMap((item) => [item.dgs10Bp, item.dgs30Bp].filter(Number.isFinite)).map((value) => value * value);
      if (!squared.length) return null;
      const dailyRmsBp = Math.sqrt(squared.reduce((sum, value) => sum + value, 0) / squared.length);
      return {
        date: point.date,
        value: round(dailyRmsBp * Math.sqrt(252), 2),
        dailyRmsBp: round(dailyRmsBp, 2),
      };
    })
    .filter(Boolean);
  if (!points.length) {
    return;
  }
  publicCache.series[MOVE_PROXY_SERIES_ID] = {
    source: "FRED DGS10/DGS30 realized yield volatility proxy",
    description: "MOVE proxy: annualized 21-observation RMS of daily 10Y/30Y yield changes in basis points",
    fetchedAt,
    proxyFor: "MOVE",
    proxyNote: "This is not the ICE BofA MOVE index. It is a local rates-volatility trend proxy used when official MOVE history is unavailable.",
    points,
  };
  process.stdout.write(`updated ${MOVE_PROXY_SERIES_ID}\n`);
}

function updateCftcTreasuryFutures(publicCache, fetchedAt) {
  try {
    const rows = readCftcFinancialFuturesRows();
    const points = aggregateCftcTreasuryRows(rows);
    if (!points.length) {
      throw new Error("CFTC response did not contain Treasury futures rows");
    }
    publicCache.cftc = {
      source: "CFTC Traders in Financial Futures official annual zip",
      asOf: points[points.length - 1].date,
      fetchedAt,
      description: "Aggregated Treasury futures positioning across 2Y, 5Y, 10Y, classic bond, and ultra bond contracts.",
      proxyNote: "Used for positioning trend and crowding only; contract DV01 differences are not normalized.",
      points,
    };
    process.stdout.write("updated CFTC Treasury futures positioning\n");
  } catch (error) {
    publicCache.fetchErrors.push({
      source: "CFTC",
      seriesId: "CFTC_TREASURY_FUTURES",
      message: error.message,
    });
    process.stderr.write(`CFTC Treasury futures failed: ${error.message}\n`);
  }
}

function updateGoldProxy(publicCache, fetchedAt) {
  const existingCsv = readGithubGoldCache();
  let githubCsv = existingCsv;
  let stale = Boolean(existingCsv);
  let githubFetchSucceeded = false;
  try {
    githubCsv = readDownloadedText("XAU_1d_data.csv") || fetchTextWithCurl(GITHUB_XAUUSD_URL);
    if (!githubCsv.startsWith("Date;")) {
      throw new Error(`unexpected GitHub XAUUSD response: ${githubCsv.slice(0, 120)}`);
    }
    writeGithubGoldCache(githubCsv, fetchedAt);
    stale = false;
    githubFetchSucceeded = true;
    process.stdout.write("updated GitHub XAUUSD gold history\n");
  } catch (error) {
    publicCache.fetchErrors.push({
      source: "GitHub",
      seriesId: GOLD_PROXY_SERIES_ID,
      message: error.message,
    });
    if (existingCsv) {
      process.stderr.write("GitHub XAUUSD using stale local cache\n");
    } else {
      process.stderr.write("GitHub XAUUSD unavailable; using manual COMEX gold overlay only\n");
    }
    process.stderr.write(`GitHub XAUUSD failed: ${error.message}\n`);
  }

  const githubPoints = githubCsv ? parseGithubXauUsdCsv(githubCsv) : [];
  const manualPoints = MANUAL_GOLD_POINTS.map((point) => ({
    date: point.date,
    value: point.value,
    manual: true,
    source: point.source,
    url: point.url,
  }));
  const points = mergePointSeries(manualPoints, githubPoints);
  if (!points.length) {
    return;
  }
  const sourceLabel = githubPoints.length
    ? stale
      ? "GitHub XAUUSD local cache + manual AP COMEX overlay"
      : "GitHub XAUUSD + manual AP COMEX overlay"
    : "manual AP COMEX overlay";
  publicCache.series[GOLD_PROXY_SERIES_ID] = {
    source: sourceLabel,
    description: "Gold proxy series: historical XAUUSD GitHub data patched with recent AP/COMEX front futures closes",
    fetchedAt,
    stale: stale && !githubFetchSucceeded,
    proxyFor: "Gold",
    proxyNote: "This is not LBMA PM fix. It is used only as a cross-asset gold proxy when official FRED gold is unavailable.",
    manualRecentPoints: manualPoints,
    points,
  };
  process.stdout.write(`updated ${GOLD_PROXY_SERIES_ID}\n`);
}

function fetchFredCsv(seriesId, existingCsv) {
  const lastDate = getLastValuedFredDate(existingCsv);
  const start = lastDate ? `&observation_start=${encodeURIComponent(shiftIsoDate(lastDate, -10))}` : "";
  const url = `${FRED_URL}${encodeURIComponent(seriesId)}${start}`;
  const nextCsv = readDownloadedText(`${seriesId}.csv`) || fetchTextWithCurl(url);
  if (!nextCsv.startsWith("observation_date,")) {
    throw new Error(`unexpected FRED response: ${nextCsv.slice(0, 120)}`);
  }
  return existingCsv ? mergeFredCsv(existingCsv, nextCsv) : nextCsv;
}

function readDownloadedText(fileName) {
  const filePath = path.join(PUBLIC_DOWNLOAD_DIR, fileName);
  try {
    if (!fs.existsSync(filePath)) {
      return "";
    }
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function fetchTextWithCurl(url) {
  try {
    return execFileSync("curl", ["-L", "--fail", "--silent", "--show-error", url], {
      cwd: ROOT,
      env: process.env,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      timeout: 30000,
    });
  } catch (error) {
    throw new Error(String(error.stderr || error.message).trim());
  }
}

function buildCftcTreasuryUrl() {
  const params = new URLSearchParams({
    "$limit": "50000",
    "$select": [
      "market_and_exchange_names",
      "report_date_as_yyyy_mm_dd",
      "open_interest_all",
      "lev_money_positions_long",
      "lev_money_positions_short",
      "asset_mgr_positions_long",
      "asset_mgr_positions_short",
    ].join(","),
    "$where": `market_and_exchange_names in(${CFTC_TREASURY_MARKETS.map((item) => `'${item}'`).join(",")})`,
    "$order": "report_date_as_yyyy_mm_dd DESC",
  });
  return `${CFTC_TFF_URL}?${params.toString()}`;
}

function readCftcFinancialFuturesRows() {
  fs.mkdirSync(PUBLIC_DOWNLOAD_DIR, { recursive: true });
  if (!fs.existsSync(CFTC_FINANCIAL_FUTURES_ZIP)) {
    execFileSync("curl", ["-L", "--fail", "--silent", "--show-error", "-o", CFTC_FINANCIAL_FUTURES_ZIP, CFTC_FINANCIAL_FUTURES_ZIP_URL], {
      cwd: ROOT,
      env: process.env,
      timeout: 60000,
      maxBuffer: 4 * 1024 * 1024,
    });
  }
  const csvText = execFileSync("unzip", ["-p", CFTC_FINANCIAL_FUTURES_ZIP], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30000,
  });
  return parseCsvObjects(csvText).filter((row) => isTreasuryCftcMarket(row.Market_and_Exchange_Names));
}

function isTreasuryCftcMarket(name = "") {
  const upper = name.toUpperCase();
  return upper.includes("CHICAGO BOARD OF TRADE") && (upper.includes("TREASURY") || upper.includes("UST "));
}

function parseCsvObjects(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  values.push(value.trim());
  return values;
}

function aggregateCftcTreasuryRows(rows) {
  const byDate = new Map();
  rows.forEach((row) => {
    const date = String(row.report_date_as_yyyy_mm_dd || row["Report_Date_as_YYYY-MM-DD"] || "").slice(0, 10);
    if (!date) return;
    const existing = byDate.get(date) || {
      date,
      openInterest: 0,
      leveragedLong: 0,
      leveragedShort: 0,
      assetManagerLong: 0,
      assetManagerShort: 0,
      contractCount: 0,
    };
    existing.openInterest += parseNumber(row.open_interest_all || row.Open_Interest_All);
    existing.leveragedLong += parseNumber(row.lev_money_positions_long || row.Lev_Money_Positions_Long_All);
    existing.leveragedShort += parseNumber(row.lev_money_positions_short || row.Lev_Money_Positions_Short_All);
    existing.assetManagerLong += parseNumber(row.asset_mgr_positions_long || row.Asset_Mgr_Positions_Long_All);
    existing.assetManagerShort += parseNumber(row.asset_mgr_positions_short || row.Asset_Mgr_Positions_Short_All);
    existing.contractCount += 1;
    byDate.set(date, existing);
  });
  const points = Array.from(byDate.values())
    .filter((point) => point.openInterest > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  return points.map((point, index) => {
    const leveragedNet = point.leveragedLong - point.leveragedShort;
    const assetManagerNet = point.assetManagerLong - point.assetManagerShort;
    const leveragedNetPctOi = (leveragedNet / point.openInterest) * 100;
    const assetManagerNetPctOi = (assetManagerNet / point.openInterest) * 100;
    const previous = index >= 4 ? points[index - 4] : null;
    const previousLeveragedNetPctOi = previous
      ? ((previous.leveragedLong - previous.leveragedShort) / previous.openInterest) * 100
      : NaN;
    return {
      date: point.date,
      value: round(leveragedNetPctOi, 2),
      leveragedNet,
      leveragedNetPctOi: round(leveragedNetPctOi, 2),
      assetManagerNet,
      assetManagerNetPctOi: round(assetManagerNetPctOi, 2),
      fourWeekChange: Number.isFinite(previousLeveragedNetPctOi)
        ? round(leveragedNetPctOi - previousLeveragedNetPctOi, 2)
        : null,
      openInterest: point.openInterest,
      contractCount: point.contractCount,
    };
  });
}

function parseNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function diagnoseNetwork() {
  const proxyEnv = Object.fromEntries(
    [
      "HTTP_PROXY",
      "HTTPS_PROXY",
      "ALL_PROXY",
      "http_proxy",
      "https_proxy",
      "all_proxy",
      "NO_PROXY",
      "no_proxy",
    ]
      .filter((key) => process.env[key])
      .map((key) => [key, process.env[key]]),
  );
  return {
    checkedAt: new Date().toISOString(),
    proxyEnv,
    dnsFred: commandOutput(process.execPath, [
      "-e",
      "require('dns').lookup('fred.stlouisfed.org',(error,address)=>{ if (error) { console.error(error.code + ': ' + error.message); process.exit(1); } console.log(address); })",
    ]),
    directIpConnect: commandOutput("curl", [
      "-x",
      "",
      "-I",
      "--connect-timeout",
      "5",
      "--max-time",
      "10",
      "--silent",
      "--show-error",
      "https://1.1.1.1",
    ]),
  };
}

function commandOutput(command, args) {
  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
        timeout: 12000,
      }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      output: String(error.stdout || "").trim(),
      error: String(error.stderr || error.message).trim(),
    };
  }
}

function readFredCache(seriesId) {
  const wrapper = readJsonIfExists(path.join(CACHE_DIR, `fred_${seriesId}.json`));
  return typeof wrapper?.body === "string" ? wrapper.body : "";
}

function getFredCacheFetchedAt(seriesId) {
  const wrapper = readJsonIfExists(path.join(CACHE_DIR, `fred_${seriesId}.json`));
  if (!wrapper?.savedAt) {
    return "";
  }
  return new Date(wrapper.savedAt).toISOString();
}

function writeFredCache(seriesId, csv, fetchedAt) {
  fs.writeFileSync(
    path.join(CACHE_DIR, `fred_${seriesId}.json`),
    JSON.stringify({ body: csv, savedAt: Date.parse(fetchedAt) }),
    "utf8",
  );
}

function readGithubGoldCache() {
  const wrapper = readJsonIfExists(GITHUB_XAUUSD_CACHE);
  return typeof wrapper?.body === "string" ? wrapper.body : "";
}

function writeGithubGoldCache(csv, fetchedAt) {
  fs.writeFileSync(
    GITHUB_XAUUSD_CACHE,
    JSON.stringify({ body: csv, savedAt: Date.parse(fetchedAt), sourceUrl: GITHUB_XAUUSD_URL }),
    "utf8",
  );
}

function mergeFredRatesIntoTreasuryCache(publicCache, fetchedAt) {
  const wrapper = readJsonIfExists(TREASURY_CACHE_PATH);
  if (!wrapper?.body) {
    return;
  }
  const payload = JSON.parse(wrapper.body);
  payload.series = payload.series || {};
  Object.entries(TREASURY_FRED_MAP).forEach(([targetKey, seriesId]) => {
    const points = publicCache.series[seriesId]?.points || [];
    if (!points.length) {
      return;
    }
    const existing = Array.isArray(payload.series[targetKey]) ? payload.series[targetKey] : [];
    payload.series[targetKey] = mergePointSeries(
      points.map((point) => ({ date: point.date, value: point.value, filled: false })),
      existing,
    );
  });
  payload.updatedAt = latestDate(payload.series.dgs10 || []) || payload.updatedAt;
  payload.fetchedAt = fetchedAt;
  payload.historyAugmentedFrom = "FRED public CSV";
  wrapper.body = JSON.stringify(payload);
  wrapper.savedAt = Date.parse(fetchedAt);
  fs.writeFileSync(TREASURY_CACHE_PATH, JSON.stringify(wrapper), "utf8");
  process.stdout.write(`merged public FRED history into ${TREASURY_CACHE_PATH}\n`);
}

function mergePointSeries(primary, fallback) {
  const byDate = new Map();
  fallback.forEach((point) => byDate.set(point.date, point));
  primary.forEach((point) => byDate.set(point.date, point));
  return Array.from(byDate.values())
    .filter((point) => point.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function parseFredCsv(csvText) {
  return csvText
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => {
      const [date, valueText] = row.split(",");
      const value = Number.parseFloat(valueText);
      return { date, value };
    })
    .filter((point) => point.date && Number.isFinite(point.value));
}

function parseGithubXauUsdCsv(csvText) {
  return csvText
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => {
      const [dateText, , , , closeText] = row.split(";");
      const date = normalizeGithubDate(dateText);
      const value = Number.parseFloat(closeText);
      return { date, value, source: "GitHub XAUUSD" };
    })
    .filter((point) => point.date && Number.isFinite(point.value));
}

function normalizeGithubDate(dateText = "") {
  const match = dateText.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (!match) {
    return "";
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function mergeFredCsv(baseCsv, nextCsv) {
  const rowsByDate = new Map();
  [baseCsv, nextCsv].forEach((csvText) => {
    csvText
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .forEach((row) => {
        const [date] = row.split(",");
        if (date) {
          rowsByDate.set(date, row);
        }
      });
  });
  const header = nextCsv.trim().split(/\r?\n/)[0] || baseCsv.trim().split(/\r?\n/)[0];
  const rows = Array.from(rowsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
  return `${header}\n${rows.join("\n")}\n`;
}

function getLastValuedFredDate(csvText) {
  if (!csvText) {
    return "";
  }
  const rows = csvText.trim().split(/\r?\n/).slice(1);
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const [date, valueText] = rows[index].split(",");
    if (date && Number.isFinite(Number.parseFloat(valueText))) {
      return date;
    }
  }
  return "";
}

function latestDate(series) {
  return series.length ? series[series.length - 1].date : "";
}

function shiftIsoDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${filePath} parse failed: ${error.message}`);
  }
}

main();
