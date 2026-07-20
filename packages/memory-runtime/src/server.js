import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildShard, renderShardAsText } from "../../shard-format/src/index.js";
import { addMemory, listMemory, loadStore } from "./storage.js";

const VERSION = "0.1.0";
const DEFAULT_HOST = process.env.CONTINUUM_GENESIS_HOST || "127.0.0.1";
const DEFAULT_PORT = Number(process.env.CONTINUUM_GENESIS_PORT || 8787);
const ROOT = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)));

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

export function createRuntimeServer({
  root = ROOT,
  appDir = path.join(root, "apps", "text-cockpit"),
  host = DEFAULT_HOST,
  port = DEFAULT_PORT
} = {}) {
  const settings = { root: path.resolve(root), appDir: path.resolve(appDir), host, port: Number(port) };
  const server = http.createServer(async (req, res) => {
    try {
      await route(req, res, settings);
    } catch (error) {
      sendError(req, res, error, settings);
    }
  });
  server.continuumSettings = settings;
  return server;
}

export async function startRuntimeServer(options = {}) {
  const server = createRuntimeServer(options);
  const settings = server.continuumSettings;
  await new Promise((resolve) => server.listen(settings.port, settings.host, resolve));
  const address = server.address();
  if (address && typeof address === "object") settings.port = address.port;
  console.log(`Continuum Genesis memory runtime listening at http://${settings.host}:${settings.port}`);
  return server;
}

if (isMainModule()) {
  await startRuntimeServer();
}

async function route(req, res, settings) {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${settings.host}:${settings.port}`}`);
  const method = req.method === "HEAD" ? "GET" : req.method;
  const apiRoute = isRuntimeApiPath(url.pathname);

  if (method === "OPTIONS") {
    if (apiRoute && !runtimeRequestAllowed(req, settings)) {
      sendJson(req, res, 403, { ok: false, error: "runtime API access is limited to the local app origin" }, false, settings);
      return;
    }
    applyCors(req, res, settings);
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "GET" && url.pathname === "/health") {
    const store = await loadStore(settings.root);
    sendJson(req, res, 200, {
      ok: true,
      service: "continuum-genesis-memory-runtime",
      version: VERSION,
      memory_items: store.items.length,
      boundary: "reference-runtime"
    }, req.method === "HEAD", settings);
    return;
  }

  if (method === "GET" && url.pathname === "/v0/memory") {
    requireRuntimeApiAccess(req, settings);
    const items = await listMemory({ q: url.searchParams.get("q") || "" }, settings.root);
    sendJson(req, res, 200, { ok: true, items }, req.method === "HEAD", settings);
    return;
  }

  if (req.method === "POST" && url.pathname === "/v0/memory") {
    requireRuntimeApiAccess(req, settings);
    const body = await readJson(req);
    const result = await addMemory(body, settings.root);
    sendJson(req, res, 201, { ok: true, item: result.item }, false, settings);
    return;
  }

  if (req.method === "POST" && url.pathname === "/v0/shards") {
    requireRuntimeApiAccess(req, settings);
    const body = await readJson(req);
    const store = await loadStore(settings.root);
    const shard = buildShard({
      query: body.query || "",
      maxItems: body.max_items || body.maxItems || 8,
      items: store.items
    });
    sendJson(req, res, 200, { ok: true, shard, text: renderShardAsText(shard) }, false, settings);
    return;
  }

  if (method === "GET") {
    await serveStatic(url.pathname, res, req.method === "HEAD", settings);
    return;
  }

  sendJson(req, res, 405, { ok: false, error: "method not allowed" }, false, settings);
}

async function serveStatic(pathname, res, headOnly = false, settings) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const clean = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const cleanRelative = clean.replace(/^[/\\]+/, "");
  const staticRoot = cleanRelative.startsWith(`packages${path.sep}sdk-js${path.sep}src${path.sep}`)
    ? settings.root
    : settings.appDir;
  const filePath = path.join(staticRoot, cleanRelative);
  if (!filePath.startsWith(staticRoot)) {
    sendJson(null, res, 403, { ok: false, error: "forbidden" }, false, settings);
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "Content-Type": CONTENT_TYPES.get(path.extname(filePath)) || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    if (headOnly) {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  } catch {
    sendJson(null, res, 404, { ok: false, error: "not found" }, false, settings);
  }
}

function requireRuntimeApiAccess(req, settings) {
  if (!runtimeRequestAllowed(req, settings)) {
    throw httpError(403, "runtime API access is limited to the local app origin");
  }
}

function runtimeRequestAllowed(req, settings) {
  const hostHeader = String(req.headers.host || "");
  if (!allowedHost(hostHeader, settings)) return false;

  const origin = req.headers.origin;
  if (origin && !allowedOrigin(String(origin), hostHeader, settings)) return false;

  const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite === "cross-site") return false;
  return true;
}

function allowedHost(hostHeader, settings) {
  const host = parseHostname(hostHeader);
  if (!host) return false;
  return isLoopbackHost(host) || (settings.host !== "0.0.0.0" && host === normalizeHost(settings.host));
}

function allowedOrigin(origin, hostHeader, settings) {
  if (origin === "null") return false;
  let originUrl;
  let requestUrl;
  try {
    originUrl = new URL(origin);
    requestUrl = new URL(`http://${hostHeader || `${settings.host}:${settings.port}`}`);
  } catch {
    return false;
  }

  if (originUrl.protocol !== "http:") return false;
  if (!allowedHost(originUrl.host, settings)) return false;
  if (originUrl.port !== requestUrl.port) return false;
  if (normalizeHost(originUrl.hostname) === normalizeHost(requestUrl.hostname)) return true;
  return isLoopbackHost(originUrl.hostname) && isLoopbackHost(requestUrl.hostname);
}

function applyCors(req, res, settings) {
  const origin = req?.headers?.origin ? String(req.headers.origin) : "";
  const hostHeader = req?.headers?.host ? String(req.headers.host) : `${settings.host}:${settings.port}`;
  if (origin && allowedOrigin(origin, hostHeader, settings)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(req, res, status, payload, headOnly = false, settings = { host: DEFAULT_HOST, port: DEFAULT_PORT }) {
  applyCors(req, res, settings);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache"
  });
  if (headOnly) {
    res.end();
    return;
  }
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function readJson(req) {
  requireJsonContent(req);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw httpError(413, "request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "invalid JSON body");
  }
}

function requireJsonContent(req) {
  const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") {
    throw httpError(415, "content-type must be application/json");
  }
}

function sendError(req, res, error, settings) {
  const status = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600
    ? error.statusCode
    : 500;
  const message = status >= 500
    ? "internal server error"
    : error.publicMessage || error.message || "request failed";
  sendJson(req, res, status, { ok: false, error: message }, false, settings);
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.publicMessage = message;
  return error;
}

function isRuntimeApiPath(pathname) {
  return pathname === "/health" || pathname.startsWith("/v0/");
}

function parseHostname(hostHeader) {
  try {
    return normalizeHost(new URL(`http://${hostHeader}`).hostname);
  } catch {
    return "";
  }
}

function normalizeHost(host = "") {
  return String(host).trim().toLowerCase().replace(/^\[|\]$/g, "");
}

function isLoopbackHost(host = "") {
  const value = normalizeHost(host);
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
