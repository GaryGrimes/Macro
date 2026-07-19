const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) {
  throw new Error("usage: node morning_brief/scripts/validate_market_data.js morning_brief/data/YYYY-MM-DD_market_data.js");
}

const raw = fs.readFileSync(file, "utf8");
const data = JSON.parse(raw.split("=", 2)[1].trim().replace(/;\s*$/, ""));

const expected = {
  SPX: { min: 1000, max: 20000 },
  DJI: { min: 10000, max: 100000 },
  IXIC: { min: 5000, max: 60000 },
  RUT: { min: 500, max: 10000 },
  VIX: { min: 5, max: 100 },
  "10Y": { min: 0, max: 10 },
  "30Y": { min: 0, max: 10 },
  BRENT: { min: 10, max: 300 },
  WTI: { min: 10, max: 300 },
  GOLD: { min: 500, max: 10000 },
  BTC: { min: 1000, max: 500000 },
  UPS: { min: 10, max: 500 },
  AMD: { min: 5, max: 1000 },
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function valuesFor(ticker) {
  return [
    ...ticker.history.map(point => point.value),
    ...ticker.intraday.map(point => point.value),
  ];
}

function checkRange(sym, values) {
  const bounds = expected[sym];
  if (!bounds) return;
  const bad = values.find(value => value < bounds.min || value > bounds.max);
  assert(bad === undefined, `${sym} value out of expected magnitude: ${bad}`);
}

function checkNoUnitMix(sym, values) {
  const positive = values.filter(value => value > 0);
  const min = Math.min(...positive);
  const max = Math.max(...positive);
  assert(max / min < 100, `${sym} likely mixes units: min=${min}, max=${max}`);
}

function checkRangeDensity(ticker) {
  assert(Array.isArray(ticker.intraday) && ticker.intraday.length >= 30, `${ticker.sym} intraday needs at least 30 points`);
  assert(Array.isArray(ticker.ranges["30d"]) && ticker.ranges["30d"].length >= 20, `${ticker.sym} 30d range too sparse`);
  assert(Array.isArray(ticker.ranges["6m"]) && ticker.ranges["6m"].length >= 45, `${ticker.sym} 6m range too sparse`);
  assert(Array.isArray(ticker.ranges["1y"]) && ticker.ranges["1y"].length >= 60, `${ticker.sym} 1y range too sparse`);
}

function checkNewHighText(ticker) {
  const text = `${ticker.note || ""}`;
  const saysNewHigh = /(刷新|创|同创|再创).{0,10}新高|record high/i.test(text);
  const negatesNewHigh = /(不是|并非|未|没有|低于).{0,12}新高/i.test(text);
  if (!saysNewHigh || negatesNewHigh) return;
  const latest = ticker.history.at(-1)?.value;
  const prevHigh = Math.max(...ticker.history.slice(0, -1).map(point => point.value));
  assert(latest > prevHigh, `${ticker.sym} text implies new high but latest=${latest} <= previous high=${prevHigh}`);
}

assert(data && Array.isArray(data.tickers), "ticker data missing");
assert(data.asOf, "asOf missing");
assert(Array.isArray(data.treasury?.movePeriods), "treasury move periods missing");
assert(data.treasury.movePeriods.map(period => period.key).join(",") === "1d,7d,30d,6m", "treasury move period order invalid");
for (const period of data.treasury.movePeriods) {
  assert(Array.isArray(period.baseValues) && period.baseValues.length === 4, `${period.key} treasury base values invalid`);
  period.baseValues.forEach(value => assert(Number.isFinite(value) && value > 0 && value < 10, `${period.key} treasury value invalid`));
  assert(period.summary && period.detail, `${period.key} treasury interpretation missing`);
}

for (const ticker of data.tickers) {
  assert(ticker.sym, "ticker symbol missing");
  assert(Array.isArray(ticker.history) && ticker.history.length >= 250, `${ticker.sym} history missing or too short`);
  assert(Array.isArray(ticker.intraday), `${ticker.sym} intraday missing`);
  checkRangeDensity(ticker);
  const values = valuesFor(ticker);
  values.forEach(value => assert(Number.isFinite(value), `${ticker.sym} contains non numeric value`));
  checkRange(ticker.sym, values);
  checkNoUnitMix(ticker.sym, values);
  checkNewHighText(ticker);
}

const htmlFile = path.join(path.dirname(path.dirname(file)), `${path.basename(file).replace("_market_data.js", "_us_market_brief.html")}`);
if (fs.existsSync(htmlFile)) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const pointerMoves = html.match(/onpointermove/g) || [];
  const pointerLeaves = html.match(/onpointerleave/g) || [];
  assert(pointerMoves.length >= 4, "core charts must expose pointer hover interactions");
  assert(pointerLeaves.length >= 4, "core chart tooltips must hide on pointer leave");
  assert(/chart-tooltip/.test(html), "chart tooltip styling missing");
  assert((html.match(/data-bond-period=/g) || []).length === 4, "bond period controls missing");
  assert(/bondNotesToggle/.test(html), "bond period analysis toggle missing");
  assert(/期限<\/th><th>1d<\/th><th>7d<\/th><th>30d<\/th><th>6m<\/th><th>含义/.test(html), "bond horizon table missing");
}

console.log(`market data validation ok: ${data.asOf} · ${data.tickers.length} tickers`);
