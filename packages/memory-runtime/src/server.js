import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildShard, renderShardAsText } from "../../shard-format/src/index.js";
import { addMemory, listMemory, loadStore } from "./storage.js";

const VERSION = "0.1.0";
const HOST = process.env.CONTINUUM_GENESIS_HOST || "127.0.0.1";
const PORT = Number(process.env.CONTINUUM_GENESIS_PORT || 8787);
const ROOT = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const APP_DIR = path.join(ROOT, "apps", "text-cockpit");

const CONTENT_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Continuum Genesis memory runtime listening at http://${HOST}:${PORT}`);
});

async function route(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const method = req.method === "HEAD" ? "GET" : req.method;

  if (method === "OPTIONS") {
    applyCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "GET" && url.pathname === "/health") {
    const store = await loadStore(ROOT);
    sendJson(res, 200, {
      ok: true,
      service: "continuum-genesis-memory-runtime",
      version: VERSION,
      memory_items: store.items.length,
      boundary: "reference-runtime"
    }, req.method === "HEAD");
    return;
  }

  if (method === "GET" && url.pathname === "/v0/memory") {
    const items = await listMemory({ q: url.searchParams.get("q") || "" }, ROOT);
    sendJson(res, 200, { ok: true, items }, req.method === "HEAD");
    return;
  }

  if (req.method === "POST" && url.pathname === "/v0/memory") {
    const body = await readJson(req);
    const result = await addMemory(body, ROOT);
    sendJson(res, 201, { ok: true, item: result.item });
    return;
  }

  if (req.method === "POST" && url.pathname === "/v0/shards") {
    const body = await readJson(req);
    const store = await loadStore(ROOT);
    const shard = buildShard({
      query: body.query || "",
      maxItems: body.max_items || body.maxItems || 8,
      items: store.items
    });
    sendJson(res, 200, { ok: true, shard, text: renderShardAsText(shard) });
    return;
  }

  if (method === "GET") {
    await serveStatic(url.pathname, res, req.method === "HEAD");
    return;
  }

  sendJson(res, 405, { ok: false, error: "method not allowed" });
}

async function serveStatic(pathname, res, headOnly = false) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const clean = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const cleanRelative = clean.replace(/^[/\\]+/, "");
  const staticRoot = cleanRelative.startsWith(`packages${path.sep}sdk-js${path.sep}src${path.sep}`)
    ? ROOT
    : APP_DIR;
  const filePath = path.join(staticRoot, cleanRelative);
  if (!filePath.startsWith(staticRoot)) {
    sendJson(res, 403, { ok: false, error: "forbidden" });
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
    sendJson(res, 404, { ok: false, error: "not found" });
  }
}

function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:8787");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, payload, headOnly = false) {
  applyCors(res);
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
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
