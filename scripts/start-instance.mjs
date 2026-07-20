import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const id = normalizeId(process.argv[2] || "instance-001");
const dataDir = path.join(ROOT, ".continuum-instances", id);
const oraclePath = path.join(dataDir, "instance.json");

let oracle;
try {
  oracle = JSON.parse(await readFile(oraclePath, "utf8"));
} catch (error) {
  if (error.code === "ENOENT") {
    throw new Error(`instance not found: run "npm run instance:create -- ${id}" first`);
  }
  throw error;
}

process.env.CONTINUUM_GENESIS_DATA_DIR = dataDir;
process.env.CONTINUUM_GENESIS_INSTANCE_ID = oracle.id || id;
process.env.CONTINUUM_GENESIS_PORT = String(process.env.CONTINUUM_GENESIS_PORT || oracle.runtime?.port || 8788);
process.env.CONTINUUM_GENESIS_HOST = String(process.env.CONTINUUM_GENESIS_HOST || oracle.runtime?.host || "127.0.0.1");

const { startRuntimeServer } = await import("../packages/memory-runtime/src/server.js");
await startRuntimeServer();

function normalizeId(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(normalized)) {
    throw new Error("instance id must use lowercase letters, numbers, and hyphens");
  }
  return normalized;
}
