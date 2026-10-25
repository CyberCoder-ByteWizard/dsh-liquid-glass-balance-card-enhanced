/**
 * dsh-liquid-glass-balance-card-enhanced — host half.
 *
 * Registers local HTTP routes for the DSH web GUI:
 *
 *   GET  /api/liquid-glass-balance-card-enhanced/settings
 *   POST /api/liquid-glass-balance-card-enhanced/settings
 *   GET  /api/liquid-glass-balance-card-enhanced/balance
 *   GET  /api/liquid-glass-balance-card-enhanced/stats?range=today|yesterday|7d|30d|all
 *
 * All numbers come straight from DeepSeek's official servers — nothing is
 * estimated locally:
 *
 *   - platform.deepseek.com (web login token, same endpoints as the /usage page)
 *       GET /api/v0/users/get_user_summary            余额钱包 / 官方累计消费
 *       GET /api/v0/usage/by_api_key/amount?start&end&tz   token 用量（按模型 × 按天分桶）
 *       GET /api/v0/usage/by_api_key/cost?start&end&tz     金额用量（按模型 × 按天分桶）
 *   - api.deepseek.com (API key, official public endpoint)
 *       GET /user/balance                             余额（无登录 token 时的官方兜底）
 *
 * The usage page groups its series by 模型（调用类型）/ API Key；`amount` 的
 * `biz_data.series[]` 与 `cost` 的 `biz_data.data[].series[]` 每条都带 `model`
 * 字段，按模型聚合即可得到与官网「调用类型」页签一致的数据，无需任何本地计价。
 */
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync, rmSync } from "node:fs";

export const name = "dsh-liquid-glass-balance-card-enhanced";
export const inject = ["credentials"];

const PUBLIC_BASE_URL = "https://api.deepseek.com";
const BASE_URL_ENV = "DEEPSEEK_BASE_URL";
const BALANCE_PATH = "/user/balance";
const TIMEOUT_MS = 15000;
const STATE_FILE = "dsh-liquid-glass-balance-card-enhanced.json";
const CREDENTIAL_REF = credentialRef("DEEPSEEK_API_KEY");

/**
 * 开放平台（platform.deepseek.com）内部接口，用量页 `/usage` 调用的同一组。
 *
 * 鉴权用网页登录态 Bearer token。浏览器 localStorage 的 `userToken` 实际是
 * `{"value":"<token>","__version":"0"}` 这样的 JSON 包装，粘贴整段或裸 token
 * 均可（见 `normalizePlatformToken`）。start/end 是 epoch 秒，tz 是时区偏移
 * 秒数（北京 +28800）；`start/end` 会先按整小时对齐时区、余数折进时间戳，
 * 与网页端行为一致。
 */
const PLATFORM_BASE = "https://platform.deepseek.com";
const PLATFORM_TIMEOUT_MS = 20000;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function balanceUrl() {
  const base = process.env[BASE_URL_ENV] ?? PUBLIC_BASE_URL;
  return `${base.replace(/\/+$/, "")}${BALANCE_PATH}`;
}

function sendJson(res, status, body) {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(body));
}

/** Read a JSON request body (small size limit). */
async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) {
      const error = new Error("request body too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/** Extract a readable provider message from a DeepSeek error body. */
function providerMessage(text, status) {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "object" && parsed.error !== null && typeof parsed.error.message === "string") {
      return parsed.error.message;
    }
  } catch {}
  return `DeepSeek 接口返回 HTTP ${status}`;
}

// ---- manual key storage -------------------------------------------------

/** Absolute path of the plugin state file under the DSH home. */
function statePath(ctx) {
  let storages;
  const homeFn = typeof ctx.get === "function" ? ctx.get("dshHomePath") : void 0;
  if (typeof homeFn === "function") {
    storages = homeFn("storages");
  } else if (process.env.DSH_HOME) {
    storages = join(process.env.DSH_HOME, "storages");
  } else {
    storages = join(homedir(), ".dsh", "storages");
  }
  return join(storages, STATE_FILE);
}

/**
 * Accept both the raw bearer token and the JSON wrapper stored in the web
 * app's `localStorage.userToken` (`{"value":"…","__version":"0"}`).
 * @returns the bare token, or null when nothing usable was pasted.
 */
function normalizePlatformToken(raw) {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (text === "") return null;
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.value === "string" && parsed.value.trim() !== "") {
        return parsed.value.trim();
      }
    } catch {}
    return null;
  }
  return text;
}

/**
 * Plugin state: the manual API key (balance via the public API) and the
 * platform login token (official usage statistics). Either may be absent.
 * @returns {{ apiKey: string|null, platformToken: string|null }|null}
 */
function readState(ctx) {
  try {
    const parsed = JSON.parse(readFileSync(statePath(ctx), "utf8"));
    if (parsed === null || typeof parsed !== "object") return null;
    const mine = (value) => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);
    const apiKey = mine(parsed.apiKey);
    const platformToken = mine(parsed.platformToken);
    if (apiKey === null && platformToken === null) return null;
    return { apiKey, platformToken };
  } catch {}
  return null;
}

/**
 * Merge one credential field into the state file. `undefined` leaves a field
 * untouched; `null` clears it. The file is removed once both are empty.
 * @param ctx - plugin context.
 * @param patch - `{ apiKey?: string|null, platformToken?: string|null }`.
 */
function writeState(ctx, patch) {
  const current = readState(ctx) ?? { apiKey: null, platformToken: null };
  const next = {
    apiKey: patch.apiKey === void 0 ? current.apiKey : patch.apiKey,
    platformToken: patch.platformToken === void 0 ? current.platformToken : patch.platformToken
  };
  if (next.apiKey === null && next.platformToken === null) {
    clearState(ctx);
    return;
  }
  const path = statePath(ctx);
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(next), "utf8");
  try {
    chmodSync(tmp, 0o600);
  } catch {}
  renameSync(tmp, path);
}

function clearState(ctx) {
  try {
    rmSync(statePath(ctx), { force: true });
  } catch {}
}

/** Mask a key for display in the settings popover. */
function maskKey(key) {
  if (typeof key !== "string" || key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

// ---- official platform client (platform.deepseek.com) --------------------

const RANGE_ALIASES = {
  today: "今天",
  yesterday: "昨天",
  "7d": "近7天",
  "30d": "近30天"
};

/** Headers the platform web app sends, so the API accepts a pasted login token. */
function platformHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "x-client-bundle-id": "com.deepseek.chat",
    "x-client-platform": "web",
    "x-client-version": "1.0.0",
    "x-client-locale": "zh_CN",
    "x-client-timezone-offset": String(-new Date().getTimezoneOffset())
  };
}

/**
 * GET one platform endpoint and unwrap the `{ data: { biz_data } }` envelope.
 * @param token - platform login token (`userToken` from the web app storage).
 * @param pathname - absolute API path.
 * @param query - query parameters; `undefined` values are skipped.
 * @returns the `biz_data` payload.
 */
async function platformGet(token, pathname, query) {
  const url = new URL(pathname, PLATFORM_BASE);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== void 0) url.searchParams.set(key, String(value));
    }
  }
  let response;
  try {
    response = await fetch(url, {
      headers: platformHeaders(token),
      signal: AbortSignal.timeout(PLATFORM_TIMEOUT_MS)
    });
  } catch (error) {
    const wrapped = new Error(`连接开放平台失败：${error instanceof Error ? error.message : String(error)}`);
    wrapped.code = "platform-network";
    throw wrapped;
  }
  const text = await response.text();
  if (response.status === 401 || response.status === 403) {
    const denied = new Error(
      `开放平台登录态无效或已过期（HTTP ${response.status}）。请重新登录 platform.deepseek.com，从开发者工具里取最新的 userToken。`
    );
    denied.code = "platform-unauthorized";
    denied.status = response.status;
    throw denied;
  }
  if (!response.ok) {
    const failed = new Error(`开放平台接口 ${pathname} 返回 HTTP ${response.status}`);
    failed.code = "platform-http";
    failed.status = response.status;
    throw failed;
  }
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    const broken = new Error(`开放平台接口 ${pathname} 返回了非 JSON 内容`);
    broken.code = "platform-bad-json";
    throw broken;
  }
  const code = body && typeof body.code === "number" ? body.code : 0;
  if (code !== 0) {
    const refused = new Error(`开放平台拒绝请求：${body && body.msg ? body.msg : `code ${code}`}`);
    refused.code = "platform-biz";
    throw refused;
  }
  return body && body.data ? body.data.biz_data ?? body.data : null;
}

/** Local calendar day start in epoch ms, shifted by `offsetDays`. */
function localDayStartMs(offsetDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.getTime();
}

/**
 * Translate a range alias into the platform query window.
 *
 * Mirrors the web app's own behaviour: the timezone is folded into whole hours
 * and the sub-hour remainder is added to the timestamps, so `tz` stays a
 * whole-hour offset in seconds.
 * @param range - today | yesterday | 7d | 30d（官网接口最多支持约 31 天回溯）。
 * @returns `{ startMs, endMs, query }` or null for an unknown alias.
 */
function officialRange(range) {
  let startMs;
  let endMs;
  switch (range) {
    case "today":
      startMs = localDayStartMs(0);
      endMs = localDayStartMs(1);
      break;
    case "yesterday":
      startMs = localDayStartMs(-1);
      endMs = localDayStartMs(0);
      break;
    case "7d":
      startMs = localDayStartMs(-6);
      endMs = localDayStartMs(1);
      break;
    case "30d":
      startMs = localDayStartMs(-29);
      endMs = localDayStartMs(1);
      break;
    default:
      return null;
  }
  const tzSec = -new Date().getTimezoneOffset() * 60;
  const tzHour = 3600 * Math.floor(tzSec / 3600);
  const remainder = tzSec - tzHour;
  return {
    startMs,
    endMs,
    query: {
      start: Math.floor(startMs / 1000) + remainder,
      end: Math.floor(endMs / 1000) + remainder,
      tz: tzHour
    }
  };
}

/** Local date key (YYYY-MM-DD) from epoch ms. */
function localDateKey(time) {
  const d = new Date(time);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Bucket `time` is epoch seconds or milliseconds; normalise to local date key. */
function bucketDateKey(time) {
  if (typeof time !== "number" || !Number.isFinite(time)) return null;
  return localDateKey(time < 1e12 ? time * 1000 : time);
}

function roundMoney(value) {
  return Math.round(value * 1e6) / 1e6;
}

function roundTokens(value) {
  return Math.round(value);
}

function emptyStats() {
  return {
    calls: 0,
    cost: 0,
    costUsd: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}

function emptyDaily() {
  return {
    date: "",
    calls: 0,
    cost: 0,
    costUsd: 0,
    inputTokens: 0,
    cacheReadTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}

function createDailyMap(range) {
  const days = range === "7d" ? 7 : 30;
  const map = new Map();
  for (let i = days - 1; i >= 0; i--) {
    const time = localDayStartMs(-i);
    const date = localDateKey(time);
    map.set(date, { ...emptyDaily(), date });
  }
  return map;
}

/** Ensure a per-model accumulator entry exists. */
function modelEntry(map, model) {
  const key = typeof model === "string" && model !== "" ? model : "unknown";
  let entry = map.get(key);
  if (!entry) {
    entry = { model: key, calls: 0, inputTokens: 0, cacheReadTokens: 0, outputTokens: 0, cost: 0, costUsd: 0 };
    map.set(key, entry);
  }
  return entry;
}

/**
 * Range statistics straight from the platform (same numbers as `/usage`),
 * with a per-model breakdown (the page's「调用类型」view).
 * @param token - platform login token.
 * @param range - range alias.
 * @returns totals + `models[]` + optional `daily[]`, all sourced officially.
 */
async function officialStats(token, range) {
  const win = officialRange(range);
  if (!win) throw new Error(`unknown range: ${range}`);
  const [amountBody, costBody] = await Promise.all([
    platformGet(token, "/api/v0/usage/by_api_key/amount", win.query),
    platformGet(token, "/api/v0/usage/by_api_key/cost", win.query)
  ]);
  const stats = emptyStats();
  const models = new Map();
  const dailyEnabled = range === "7d" || range === "30d";
  const dailyMap = dailyEnabled ? createDailyMap(range) : null;
  const dayFor = (time) => {
    if (!dailyMap) return null;
    const date = bucketDateKey(time);
    if (date === null) return null;
    let day = dailyMap.get(date);
    if (!day) {
      day = { date, ...emptyDaily() };
      dailyMap.set(date, day);
    }
    return day;
  };

  // tokens：amount 接口按 (api_key × model) 出 series，跨 key 合并到模型维度。
  for (const series of amountBody?.series ?? []) {
    const model = modelEntry(models, series?.model);
    for (const bucket of series?.buckets ?? []) {
      const usage = bucket?.usage ?? {};
      const requests = Number(usage.REQUEST ?? 0) || 0;
      const input = Number(usage.PROMPT_CACHE_MISS_TOKEN ?? 0) || 0;
      const cacheRead = Number(usage.PROMPT_CACHE_HIT_TOKEN ?? 0) || 0;
      const output = Number(usage.RESPONSE_TOKEN ?? 0) || 0;
      const day = dayFor(bucket?.time);
      for (const target of [stats, model, day]) {
        if (!target) continue;
        target.calls += requests;
        target.inputTokens += input;
        target.cacheReadTokens += cacheRead;
        target.outputTokens += output;
      }
    }
  }

  // 金额：cost 接口按币种分组，组内再按 (api_key × model) 出 series。
  for (const group of costBody?.data ?? []) {
    const currency = String(group?.currency ?? "CNY").toUpperCase();
    for (const series of group?.series ?? []) {
      const model = modelEntry(models, series?.model);
      for (const bucket of series?.buckets ?? []) {
        const amount = Number(bucket?.cost ?? 0) || 0;
        const isUsd = currency === "USD";
        const day = dayFor(bucket?.time);
        for (const target of [stats, model, day]) {
          if (!target) continue;
          if (isUsd) target.costUsd += amount;
          else target.cost += amount;
        }
      }
    }
  }

  const finish = (target) => {
    target.totalTokens = target.inputTokens + target.cacheReadTokens + target.outputTokens;
    target.cost = roundMoney(target.cost);
    target.costUsd = roundMoney(target.costUsd);
    target.inputTokens = roundTokens(target.inputTokens);
    target.cacheReadTokens = roundTokens(target.cacheReadTokens);
    target.outputTokens = roundTokens(target.outputTokens);
    target.totalTokens = roundTokens(target.totalTokens);
    return target;
  };
  finish(stats);
  const modelList = [...models.values()]
    .map(finish)
    .sort((a, b) => b.totalTokens - a.totalTokens || a.model.localeCompare(b.model));
  // 官网会为每个历史用过的模型都返回全 0 series；只在存在真实用量时过滤掉
  // 全 0 行，避免列表被空模型淹没。
  const hasUsage = modelList.some((m) => m.totalTokens > 0 || m.calls > 0 || m.cost > 0 || m.costUsd > 0);
  const modelRows = hasUsage ? modelList.filter((m) => m.totalTokens > 0 || m.calls > 0 || m.cost > 0 || m.costUsd > 0) : modelList;
  const daily = dailyMap
    ? [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => finish({ ...d }))
    : null;
  const result = {
    ...stats,
    models: modelRows,
    daily,
    /* 官网数据源；客户端据此显示「官网实时」 */
    source: "platform",
    window: { startMs: win.startMs, endMs: win.endMs }
  };
  // 全为 0 通常意味着返回结构与预期不符（上游改版）。把顶层键带出去便于排查，
  // 不含任何 token 或金额明细。
  if (stats.totalTokens === 0 && stats.cost === 0 && stats.costUsd === 0) {
    result.warning = `官网返回 0 用量；amount 顶层键=[${Object.keys(amountBody ?? {}).join(",")}] cost 顶层键=[${Object.keys(costBody ?? {}).join(",")}]`;
  }
  return result;
}

/**
 * Rebuild the public `/user/balance` response shape from `get_user_summary`
 * wallets, so a platform token alone can drive the balance row. Also passes
 * through the official lifetime spend (`total_costs`).
 * @param biz - `get_user_summary` payload.
 * @returns `{ is_available, balance_infos: [...], total_costs: [...] }`.
 */
function balanceFromSummary(biz) {
  const sum = (list) => {
    const byCurrency = new Map();
    for (const wallet of list ?? []) {
      const currency = String(wallet?.currency ?? "CNY").toUpperCase();
      byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + (Number(wallet?.balance ?? 0) || 0));
    }
    return byCurrency;
  };
  const total = sum(biz?.normal_wallets);
  for (const [currency, value] of sum(biz?.bonus_wallets)) {
    total.set(currency, (total.get(currency) ?? 0) + value);
  }
  const granted = sum(biz?.bonus_wallets);
  const toppedUp = sum(biz?.normal_wallets);
  const money = (value) => (Math.round((value ?? 0) * 1e4) / 1e4).toFixed(2);
  const currencies = [...total.keys()].sort((a, b) => (a === "CNY" ? -1 : b === "CNY" ? 1 : a.localeCompare(b)));
  // 钱包列表为空时仍要给出一张卡，避免客户端显示「—」而看不出是零余额。
  if (currencies.length === 0) currencies.push("CNY");
  const totalCosts = (biz?.total_costs ?? [])
    .map((entry) => ({ currency: String(entry?.currency ?? "CNY").toUpperCase(), amount: money(Number(entry?.amount ?? 0) || 0) }))
    .filter((entry) => entry.amount !== "0.00");
  return {
    is_available: (total.get(currencies[0]) ?? 0) > 0,
    balance_infos: currencies.map((currency) => ({
      currency,
      total_balance: money(total.get(currency)),
      granted_balance: money(granted.get(currency)),
      topped_up_balance: money(toppedUp.get(currency))
    })),
    total_costs: totalCosts
  };
}

// ---- route registration (webServer/httpServer compatibility) ------------

function registerRoute(ctx, kind, path, handler, label) {
  let done = false;
  const doRegister = (server) => {
    if (done || !server || typeof server.register !== "function") return;
    done = true;
    ctx.effect(() => server.register({ kind, path, handler }), label);
  };
  const existing = ctx.get("webServer") ?? ctx.get("httpServer");
  if (existing) {
    doRegister(existing);
    return;
  }
  const listener = (serviceName) => {
    if (serviceName === "webServer" || serviceName === "httpServer") {
      doRegister(ctx.get(serviceName));
    }
  };
  ctx.on("internal/service", listener);
  ctx.effect(() => () => ctx.off("internal/service", listener), `${label}: service listener`);
}

// ---- plugin body ---------------------------------------------------------

export function apply(ctx) {
  // Settings: report whether a manual key is configured and whether the
  // harness-level DEEPSEEK_API_KEY fallback exists.
  registerRoute(ctx, "exact", "/api/liquid-glass-balance-card-enhanced/settings", async (req, res) => {
    try {
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        if (body.clear === true) {
          clearState(ctx);
          sendJson(res, 200, { ok: true });
          return;
        }
        const patch = {};
        if (typeof body.apiKey === "string") patch.apiKey = body.apiKey.trim() === "" ? null : body.apiKey.trim();
        if (typeof body.platformToken === "string") {
          const normalized = normalizePlatformToken(body.platformToken);
          patch.platformToken = normalized ?? "";
        }
        if (patch.apiKey === void 0 && patch.platformToken === void 0) {
          sendJson(res, 400, { ok: false, error: "bad-request", message: "需要 apiKey 或 platformToken" });
          return;
        }
        writeState(ctx, patch);
        sendJson(res, 200, { ok: true });
        return;
      }

      const manual = readState(ctx);
      let harnessConfigured = false;
      try {
        const hit = await ctx.credentials.resolve(CREDENTIAL_REF);
        harnessConfigured = hit !== void 0 && typeof hit.value === "string" && hit.value !== "";
      } catch {}
      sendJson(res, 200, {
        ok: true,
        manualConfigured: manual?.apiKey != null,
        maskedKey: manual?.apiKey ? maskKey(manual.apiKey) : null,
        harnessConfigured,
        platformConfigured: manual?.platformToken != null,
        maskedPlatformToken: manual?.platformToken ? maskKey(manual.platformToken) : null
      });
    } catch (error) {
      ctx.logger.warn("dsh-liquid-glass-balance-card-enhanced: settings route failed");
      ctx.logger.warn(error);
      const status = error && error.status ? error.status : 500;
      sendJson(res, status, {
        ok: false,
        error: "settings-failed",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }, "dsh-liquid-glass-balance-card-enhanced: settings route");

  // Balance: official summary first (platform token), then the public API key.
  registerRoute(ctx, "exact", "/api/liquid-glass-balance-card-enhanced/balance", async (req, res) => {
    try {
      const manual = readState(ctx);
      let warning;
      if (manual?.platformToken) {
        try {
          const biz = await platformGet(manual.platformToken, "/api/v0/users/get_user_summary");
          sendJson(res, 200, { ok: true, source: "platform", balance: balanceFromSummary(biz) });
          return;
        } catch (error) {
          // 登录态失效不应连带把余额弄丢；退回 API Key 路径并把原因带回去。
          warning = error instanceof Error ? error.message : String(error);
          ctx.logger.warn("dsh-liquid-glass-balance-card-enhanced: platform summary failed, falling back to API key");
          ctx.logger.warn(error);
        }
      }

      let apiKey = manual?.apiKey ?? null;
      let source = "manual";
      if (!apiKey) {
        const hit = await ctx.credentials.resolve(CREDENTIAL_REF);
        if (hit === void 0 || typeof hit.value !== "string" || hit.value === "") {
          sendJson(res, 503, {
            ok: false,
            error: "no-api-key",
            message: warning
              ?? "未配置凭据：请在卡片设置中粘贴 DeepSeek API Key（余额）或开放平台登录 token（官网用量），或在 DSH 设置 → 模型中配置 DEEPSEEK_API_KEY。"
          });
          return;
        }
        apiKey = hit.value;
        source = "harness";
      }

      const response = await fetch(balanceUrl(), {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      const text = await response.text();
      if (!response.ok) {
        sendJson(res, response.status, {
          ok: false,
          error: "provider",
          source,
          message: providerMessage(text, response.status)
        });
        return;
      }
      let body = null;
      try {
        body = JSON.parse(text);
      } catch {}
      sendJson(res, 200, { ok: true, source, balance: body, ...(warning ? { warning } : {}) });
    } catch (error) {
      ctx.logger.warn("dsh-liquid-glass-balance-card-enhanced: failed to fetch DeepSeek balance");
      ctx.logger.warn(error);
      sendJson(res, 502, {
        ok: false,
        error: "fetch-failed",
        source: "manual",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }, "dsh-liquid-glass-balance-card-enhanced: balance route");

  // Usage stats: official platform numbers only — no local estimation. A
  // missing login token is an explicit setup prompt instead of a guess.
  registerRoute(ctx, "exact", "/api/liquid-glass-balance-card-enhanced/stats", async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://x");
      const range = url.searchParams.get("range") ?? "today";
      if (!RANGE_ALIASES[range]) {
        sendJson(res, 400, {
          ok: false,
          error: "bad-range",
          message: `未知时间范围：${range}（可选 today / yesterday / 7d / 30d；官网数据最多回溯 30 天）`
        });
        return;
      }

      const state = readState(ctx);
      if (!state?.platformToken) {
        sendJson(res, 503, {
          ok: false,
          error: "no-platform-token",
          message: "未配置开放平台登录 token：所有用量均以官网 platform.deepseek.com 数据为准，请在卡片设置中粘贴 userToken。"
        });
        return;
      }
      const stats = await officialStats(state.platformToken, range);
      sendJson(res, 200, { ok: true, range, label: RANGE_ALIASES[range], ...stats });
    } catch (error) {
      ctx.logger.warn("dsh-liquid-glass-balance-card-enhanced: stats aggregation failed");
      ctx.logger.warn(error);
      sendJson(res, 500, {
        ok: false,
        error: "stats-failed",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }, "dsh-liquid-glass-balance-card-enhanced: stats route");
}
