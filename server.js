const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { URL } = require("url");

const HOST = "127.0.0.1";
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const CNN_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
const FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=";
const DISK_CACHE_DIR = path.join(ROOT, ".cache");
const AHR_STATE_FILE = path.join(DISK_CACHE_DIR, "ahr_state.json");
const CACHE = new Map();
const TTL_MS = {
  cnn: 5 * 60 * 1000,
  ahr: 60 * 1000,
  fred: 15 * 60 * 1000,
};

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

      if (url.pathname === "/api/cnn-fear") {
        const mode = String(url.searchParams.get("mode") || "").trim().toLowerCase();
        return proxyCnn(res, mode);
      }

      if (url.pathname === "/api/ahr999") {
        const mode = String(url.searchParams.get("mode") || "").trim().toLowerCase();
        return proxyAhr999(res, mode);
      }

      if (url.pathname === "/api/fred") {
        const seriesId = String(url.searchParams.get("id") || "").trim().toUpperCase();
        const mode = String(url.searchParams.get("mode") || "").trim().toLowerCase();
        return proxyFred(res, seriesId, mode);
      }

      return serveStatic(url.pathname, res);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Server error: ${error.message}`);
    }
  })
  .listen(PORT, HOST, () => {
    process.stdout.write(`Serving on http://${HOST}:${PORT}\n`);
  });

async function proxyCnn(res, mode = "") {
  const cacheKey = "cnn";
  const cached = CACHE.get(cacheKey);
  const diskCached = cached || readDiskCache(cacheKey);
  if (mode === "cache") {
    if (diskCached) {
      return respondJson(res, 200, diskCached.body, cached ? "HIT" : "DISK");
    }
    return respondJson(res, 404, JSON.stringify({ error: "No local CNN cache" }), "BYPASS");
  }

  const isFresh = cached && Date.now() - cached.savedAt < TTL_MS[cacheKey];
  if (isFresh && mode !== "refresh") {
    return respondJson(res, 200, cached.body, "HIT");
  }

  try {
    const body = await fetchCnnViaPython();
    saveCache(cacheKey, body);
    return respondJson(res, 200, body, "MISS");
  } catch (pythonError) {
    try {
      const body = await fetchRemoteJson(CNN_URL, {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://edition.cnn.com/",
        Origin: "https://edition.cnn.com",
        "Accept-Language": "en-US,en;q=0.9",
      });
      saveCache(cacheKey, body);
      return respondJson(res, 200, body, "MISS");
    } catch (httpsError) {
      if (diskCached) {
        return respondJson(res, 200, diskCached.body, "STALE");
      }
      return respondJson(
        res,
        502,
        JSON.stringify({
          error: "CNN proxy request failed",
          detail: pythonError.message,
          fallback: httpsError.message,
        }),
        "BYPASS",
      );
    }
  }
}

async function proxyFred(res, seriesId, mode = "") {
  if (!/^[A-Z0-9_]+$/.test(seriesId)) {
    return respondJson(
      res,
      400,
      JSON.stringify({ error: "Invalid FRED series id", detail: seriesId || "missing id" }),
      "BYPASS",
    );
  }

  const cacheKey = `fred_${seriesId}`;
  const cached = CACHE.get(cacheKey);
  const diskCached = cached || readDiskCache(cacheKey);
  if (mode === "cache") {
    if (diskCached) {
      return respondCsv(res, 200, diskCached.body, cached ? "HIT" : "DISK");
    }
    return respondJson(
      res,
      404,
      JSON.stringify({ error: "No local FRED cache", detail: seriesId }),
      "BYPASS",
    );
  }

  const isFresh = cached && Date.now() - cached.savedAt < TTL_MS.fred;
  if (isFresh && mode !== "refresh") {
    return respondCsv(res, 200, cached.body, "HIT");
  }

  try {
    const body = await fetchFredCsvIncremental(seriesId, diskCached?.body || "");
    saveCache(cacheKey, body);
    return respondCsv(res, 200, body, diskCached ? "INCREMENTAL" : "MISS");
  } catch (curlError) {
    try {
      const targetUrl = buildFredUrl(seriesId, diskCached?.body || "");
      const fetchedBody = await fetchRemoteJson(targetUrl, {
        "User-Agent": "MacroMonitor/1.0",
        Accept: "text/csv,*/*",
      });
      if (!fetchedBody.startsWith("observation_date,")) {
        throw new Error(`Unexpected FRED response: ${fetchedBody.slice(0, 120)}`);
      }
      const body = diskCached?.body ? mergeFredCsv(diskCached.body, fetchedBody) : fetchedBody;
      saveCache(cacheKey, body);
      return respondCsv(res, 200, body, diskCached ? "INCREMENTAL" : "MISS");
    } catch (httpsError) {
      if (diskCached) {
        return respondCsv(res, 200, diskCached.body, "STALE");
      }
      return respondJson(
        res,
        502,
        JSON.stringify({
          error: "FRED proxy request failed",
          detail: curlError.message,
          fallback: httpsError.message,
        }),
        "BYPASS",
      );
    }
  }
}

async function proxyAhr999(res, mode = "") {
  const cacheKey = "ahr";
  const cached = CACHE.get(cacheKey);
  const diskCached = cached || readDiskCache(cacheKey);
  if (mode === "cache") {
    if (diskCached) {
      return respondJson(res, 200, diskCached.body, cached ? "HIT" : "DISK");
    }
    return respondJson(res, 404, JSON.stringify({ error: "No local AHR999 cache" }), "BYPASS");
  }

  const isFresh = cached && Date.now() - cached.savedAt < TTL_MS.ahr;
  if (isFresh && mode !== "refresh") {
    return respondJson(res, 200, cached.body, "HIT");
  }

  try {
    const payload = await buildAhr999PayloadIncremental();
    const body = JSON.stringify(payload);
    saveCache(cacheKey, body);
    return respondJson(res, 200, body, "MISS");
  } catch (error) {
    if (diskCached) {
      return respondJson(res, 200, diskCached.body, "STALE");
    }
    return respondJson(
      res,
      502,
      JSON.stringify({
        error: "AHR999 derived data failed",
        detail: error.message,
      }),
      "BYPASS",
    );
  }
}

function proxyJson(res, cacheKey, targetUrl, headers) {
  const cached = CACHE.get(cacheKey);
  const isFresh = cached && Date.now() - cached.savedAt < TTL_MS[cacheKey];
  if (isFresh) {
    return respondJson(res, 200, cached.body, "HIT");
  }

  const request = https.request(
    targetUrl,
    {
      method: "GET",
      headers,
    },
    (upstream) => {
      let body = "";
      upstream.on("data", (chunk) => {
        body += chunk;
      });
      upstream.on("end", () => {
        const statusCode = upstream.statusCode || 502;
        if (statusCode >= 200 && statusCode < 300) {
          saveCache(cacheKey, body);
          return respondJson(res, statusCode, body, "MISS");
        }

        if (cached) {
          return respondJson(res, 200, cached.body, "STALE");
        }

        return respondJson(
          res,
          statusCode,
          JSON.stringify({
            error: `${cacheKey.toUpperCase()} upstream error`,
            statusCode,
            body: body.slice(0, 300),
          }),
          "BYPASS",
        );
      });
    },
  );

  request.on("error", (error) => {
    if (cached) {
      return respondJson(res, 200, cached.body, "STALE");
    }
    return respondJson(
      res,
      502,
      JSON.stringify({
        error: `${cacheKey.toUpperCase()} proxy request failed`,
        detail: error.message,
      }),
      "BYPASS",
    );
  });

  request.end();
}

async function getFredCsv(seriesId) {
  const cacheKey = `fred_${seriesId}`;
  const cached = CACHE.get(cacheKey);
  const diskCached = cached || readDiskCache(cacheKey);
  const isFresh = cached && Date.now() - cached.savedAt < TTL_MS.fred;
  if (isFresh) {
    return cached.body;
  }

  try {
    const body = await fetchFredCsvIncremental(seriesId, diskCached?.body || "");
    saveCache(cacheKey, body);
    return body;
  } catch (curlError) {
    if (diskCached) {
      return diskCached.body;
    }
    throw curlError;
  }
}

async function fetchFredCsvIncremental(seriesId, cachedCsv = "") {
  const targetUrl = buildFredUrl(seriesId, cachedCsv);
  const fetchedBody = await fetchViaCurl(targetUrl);
  if (!fetchedBody.startsWith("observation_date,")) {
    throw new Error(`Unexpected FRED response: ${fetchedBody.slice(0, 120)}`);
  }
  return cachedCsv ? mergeFredCsv(cachedCsv, fetchedBody) : fetchedBody;
}

function buildFredUrl(seriesId, cachedCsv = "") {
  const url = `${FRED_URL}${encodeURIComponent(seriesId)}`;
  const lastDate = getLastValuedFredDate(cachedCsv);
  if (!lastDate) {
    return url;
  }
  const startDate = shiftIsoDate(lastDate, -7);
  return `${url}&observation_start=${encodeURIComponent(startDate)}`;
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

function shiftIsoDate(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
  const rows = Array.from(rowsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
  const header = nextCsv.trim().split(/\r?\n/)[0] || baseCsv.trim().split(/\r?\n/)[0];
  return `${header}\n${rows.join("\n")}\n`;
}

function parseFredCsv(csvText) {
  return csvText
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => {
      const [date, valueText] = row.split(",");
      return { date, value: Number.parseFloat(valueText) };
    })
    .filter((point) => point.date && Number.isFinite(point.value) && point.value > 0);
}

async function buildAhr999PayloadIncremental() {
  const csv = await getFredCsv("CBBTCUSD");
  const fetchedBtcData = parseFredCsv(csv);
  const previousState = readAhrState();
  const state = canUseAhrState(previousState, fetchedBtcData)
    ? appendAhrIncrement(previousState, fetchedBtcData)
    : buildAhrStateFromScratch(fetchedBtcData);

  writeAhrState(state);
  return buildAhr999PayloadFromState(state);
}

function canUseAhrState(state, fetchedBtcData) {
  if (!state?.btcData?.length || !state?.series?.length || !state.lastBtcDate || !fetchedBtcData.length) {
    return false;
  }

  const lastStoredBtc = state.btcData[state.btcData.length - 1];
  const matchingFetchedPoint = fetchedBtcData.find((point) => point.date === state.lastBtcDate);
  return Boolean(
    lastStoredBtc &&
      matchingFetchedPoint &&
      Number.isFinite(lastStoredBtc.value) &&
      Math.abs(lastStoredBtc.value - matchingFetchedPoint.value) < 1e-9,
  );
}

function appendAhrIncrement(state, fetchedBtcData) {
  const nextPoints = fetchedBtcData.filter((point) => point.date > state.lastBtcDate);
  if (!nextPoints.length) {
    return state;
  }

  const btcData = state.btcData.concat(nextPoints);
  const series = state.series.slice();
  const lastSeriesDate = series[series.length - 1]?.t || "";
  const startIndex = Math.max(199, btcData.findIndex((point) => point.date > lastSeriesDate));

  for (let index = startIndex; index < btcData.length; index += 1) {
    const point = computeAhrPoint(btcData, index);
    if (point) {
      series.push(point);
    }
  }

  return makeAhrState(btcData, series, "incremental");
}

function buildAhrStateFromScratch(btcData) {
  const genesisTime = Date.UTC(2009, 0, 3);
  const series = [];

  for (let index = 199; index < btcData.length; index += 1) {
    const point = computeAhrPoint(btcData, index, genesisTime);
    if (point) {
      series.push(point);
    }
  }

  if (!series.length) {
    throw new Error("Not enough BTC history to compute AHR999");
  }

  return makeAhrState(btcData, series, "full");
}

function computeAhrPoint(btcData, index, genesisTime = Date.UTC(2009, 0, 3)) {
  const window = btcData.slice(index - 199, index + 1);
  if (window.length < 200 || window.some((point) => !Number.isFinite(point.value) || point.value <= 0)) {
    return null;
  }

  const current = btcData[index];
  const time = new Date(`${current.date}T00:00:00Z`).getTime();
  const coinAgeDays = Math.max(1, Math.floor((time - genesisTime) / 86400000));
  const priceUsd = current.value;
  const gma200Usd = Math.exp(window.reduce((sum, point) => sum + Math.log(point.value), 0) / window.length);
  const indexGrowthVal = Math.pow(10, 5.84 * Math.log10(coinAgeDays) - 17.01);
  const ahr999 = (priceUsd / gma200Usd) * (priceUsd / indexGrowthVal);

  if (!Number.isFinite(ahr999)) {
    return null;
  }

  return {
    t: current.date,
    ahr999,
    price_usd: priceUsd,
    gma200_usd: gma200Usd,
    index_growth_val: indexGrowthVal,
    coin_age_days: coinAgeDays,
  };
}

function makeAhrState(btcData, series, calculationMode) {
  return {
    version: 1,
    source: "fred:CBBTCUSD derived",
    calculationMode,
    updatedAt: new Date().toISOString(),
    lastBtcDate: btcData[btcData.length - 1]?.date || "",
    lastAhrDate: series[series.length - 1]?.t || "",
    btcData,
    series,
  };
}

function buildAhr999PayloadFromState(state) {
  if (!state.series.length) {
    throw new Error("Not enough BTC history to compute AHR999");
  }

  const latest = state.series[state.series.length - 1];
  return {
    source: state.source,
    calculation_mode: state.calculationMode,
    price_usd: latest.price_usd,
    gma200_usd: latest.gma200_usd,
    index_growth_val: latest.index_growth_val,
    coin_age_days: latest.coin_age_days,
    ahr999: latest.ahr999,
    updated_at_unix: Math.floor(new Date(`${latest.t}T00:00:00Z`).getTime() / 1000),
    series: state.series,
    series_7d: state.series.slice(-7),
  };
}

function readAhrState() {
  try {
    const raw = fs.readFileSync(AHR_STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAhrState(state) {
  fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
  fs.writeFileSync(AHR_STATE_FILE, JSON.stringify(state), "utf8");
}

function fetchRemoteJson(targetUrl, headers) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      targetUrl,
      {
        method: "GET",
        headers,
      },
      (upstream) => {
        let body = "";
        upstream.on("data", (chunk) => {
          body += chunk;
        });
        upstream.on("end", () => {
          const statusCode = upstream.statusCode || 502;
          if (statusCode >= 200 && statusCode < 300) {
            resolve(body);
            return;
          }
          reject(new Error(`HTTP ${statusCode}: ${body.slice(0, 300)}`));
        });
      },
    );

    request.on("error", (error) => reject(error));
    request.end();
  });
}

function fetchCnnViaPython() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(ROOT, "cnn_proxy_helper.py");
    execFile(
      "python",
      [scriptPath],
      {
        cwd: ROOT,
        env: cleanProxyEnv(process.env),
        timeout: 20000,
        maxBuffer: 4 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || error.message || "python helper failed").trim()));
          return;
        }

        const body = String(stdout || "").trim();
        if (!body) {
          reject(new Error((stderr || "python helper returned empty response").trim()));
          return;
        }

        try {
          JSON.parse(body);
        } catch (parseError) {
          reject(new Error(`python helper returned invalid JSON: ${body.slice(0, 200)}`));
          return;
        }

        resolve(body);
      },
    );
  });
}

function fetchViaCurl(targetUrl) {
  return new Promise((resolve, reject) => {
    execFile(
      "curl.exe",
      ["--noproxy", "*", "-sSL", targetUrl],
      {
        cwd: ROOT,
        env: cleanProxyEnv(process.env),
        timeout: 30000,
        maxBuffer: 8 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error((stderr || error.message || "curl request failed").trim()));
          return;
        }
        resolve(String(stdout || ""));
      },
    );
  });
}

function saveCache(cacheKey, body) {
  const entry = { body, savedAt: Date.now() };
  CACHE.set(cacheKey, entry);
  try {
    fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
    fs.writeFileSync(path.join(DISK_CACHE_DIR, `${cacheKey}.json`), JSON.stringify(entry), "utf8");
  } catch {
    // Memory cache is enough when disk cache cannot be written.
  }
}

function readDiskCache(cacheKey) {
  try {
    const raw = fs.readFileSync(path.join(DISK_CACHE_DIR, `${cacheKey}.json`), "utf8");
    const entry = JSON.parse(raw);
    return typeof entry.body === "string" ? entry : null;
  } catch {
    return null;
  }
}

function cleanProxyEnv(env) {
  const nextEnv = { ...env };
  [
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
    "GIT_HTTP_PROXY",
    "GIT_HTTPS_PROXY",
  ].forEach((key) => {
    delete nextEnv[key];
  });
  nextEnv.NO_PROXY = "*";
  nextEnv.no_proxy = "*";
  return nextEnv;
}

function respondJson(res, statusCode, body, cacheStatus) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Proxy-Cache": cacheStatus,
  });
  res.end(body);
}

function respondCsv(res, statusCode, body, cacheStatus) {
  res.writeHead(statusCode, {
    "Content-Type": "text/csv; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Proxy-Cache": cacheStatus,
  });
  res.end(body);
}

function serveStatic(requestPath, res) {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, normalized);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(error.code === "ENOENT" ? "Not found" : "Read error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  });
}
