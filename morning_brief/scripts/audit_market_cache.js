const fs = require("fs");
const path = require("path");

const dataFile = process.argv[2];
if (!dataFile) {
  throw new Error("usage: node morning_brief/scripts/audit_market_cache.js morning_brief/data/YYYY-MM-DD_market_data.js");
}

const repoMorningBrief = path.dirname(path.dirname(dataFile));
const cacheFile = path.join(repoMorningBrief, "data", "cache", "market_history.json");
const rawData = fs.readFileSync(dataFile, "utf8");
const data = JSON.parse(rawData.split("=", 2)[1].trim().replace(/;\s*$/, ""));
const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));

const cryptoSymbols = new Set(["BTC"]);
const warnings = [];
const failures = [];

function valueFromDisplay(display) {
  if (!/[0-9]/.test(String(display))) return NaN;
  return Number(String(display).replace(/[^0-9.-]/g, ""));
}

function nearlyEqual(a, b, tolerance = 0.02) {
  return Math.abs(a - b) <= tolerance;
}

function isWeekend(date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

for (const ticker of data.tickers) {
  const series = cache.series?.[ticker.sym];
  if (!Array.isArray(series) || series.length < 250) {
    failures.push(`${ticker.sym}: cache history missing or too short`);
    continue;
  }

  const latest = series.at(-1);
  if (latest.date !== data.asOf) {
    failures.push(`${ticker.sym}: cache latest date ${latest.date} != report asOf ${data.asOf}`);
  }

  const displayValue = valueFromDisplay(ticker.value);
  if (Number.isFinite(displayValue) && !nearlyEqual(latest.value, displayValue)) {
    failures.push(`${ticker.sym}: cache latest ${latest.value} != display ${displayValue}`);
  }

  if (!cryptoSymbols.has(ticker.sym)) {
    const changedWeekend = [];
    for (let i = 1; i < series.length; i += 1) {
      if (isWeekend(series[i].date) && !nearlyEqual(series[i].value, series[i - 1].value, 0.0001)) {
        changedWeekend.push(series[i].date);
      }
    }
    if (changedWeekend.length) {
      failures.push(`${ticker.sym}: non-trading weekend values changed (${changedWeekend.slice(0, 3).join(", ")}${changedWeekend.length > 3 ? "..." : ""})`);
    }
  }
}

if (!cache.audit) {
  warnings.push("cache.audit metadata missing");
} else if (!String(cache.audit.conclusion || "").includes("latest_points_verified")) {
  warnings.push("cache.audit does not state latest point verification status");
}

if (warnings.length) {
  console.warn(`cache audit warnings:\n- ${warnings.join("\n- ")}`);
}

if (failures.length) {
  throw new Error(`cache audit failed:\n- ${failures.join("\n- ")}`);
}

console.log(`market cache audit ok: ${data.asOf} · ${data.tickers.length} tickers`);
