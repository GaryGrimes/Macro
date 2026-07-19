const fs = require("fs");
const path = require("path");

const file = process.argv[2];
if (!file) {
  throw new Error("usage: node morning_brief/scripts/validate_html.js morning_brief/YYYY-MM-DD_us_market_brief.html");
}

const html = fs.readFileSync(file, "utf8");
const scripts = [...html.matchAll(/<script(?:\s+src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
const inlineScripts = scripts.filter(match => !match[1]);

for (const match of inlineScripts) {
  new Function(match[2]);
}

for (const match of scripts.filter(match => match[1])) {
  const scriptPath = path.resolve(path.dirname(file), match[1].split("?")[0]);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`external script missing: ${scriptPath}`);
  }
}

for (const id of ["tickerStrip", "sparkChart", "curveChart", "bondMoveChart", "regimeChart"]) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`required chart node missing: ${id}`);
  }
}

console.log(`html validation ok: ${file} · ${inlineScripts.length} inline script(s)`);
