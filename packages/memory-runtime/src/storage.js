import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createMemoryItem } from "../../shard-format/src/index.js";

const DEFAULT_STORE = {
  schema: "continuum-genesis-store/v0",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  items: []
};
const storeLocks = new Map();

export function getDataDir(cwd = process.cwd()) {
  return process.env.CONTINUUM_GENESIS_DATA_DIR
    ? path.resolve(process.env.CONTINUUM_GENESIS_DATA_DIR)
    : path.join(cwd, ".continuum-genesis");
}

export function getStorePath(cwd = process.cwd()) {
  return path.join(getDataDir(cwd), "memory.json");
}

export async function loadStore(cwd = process.cwd()) {
  const storePath = getStorePath(cwd);
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STORE,
      ...parsed,
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch (error) {
    if (error.code === "ENOENT") return createEmptyStore();
    throw error;
  }
}

export async function saveStore(store, cwd = process.cwd()) {
  return withStoreLock(cwd, () => writeStoreUnlocked(store, cwd));
}

export async function addMemory(input, cwd = process.cwd()) {
  return withStoreLock(cwd, async () => {
    const store = await loadStore(cwd);
    const seen = new Set(store.items.map((item) => item.id));
    let item = createMemoryItem(sanitizeRuntimeMemoryInput(input));
    while (seen.has(item.id)) item = createMemoryItem(sanitizeRuntimeMemoryInput(input));
    store.items.unshift(item);
    const saved = await writeStoreUnlocked(store, cwd);
    return { store: saved, item };
  });
}

export async function listMemory({ q = "" } = {}, cwd = process.cwd()) {
  const store = await loadStore(cwd);
  const query = String(q || "").trim().toLowerCase();
  if (!query) return store.items;
  return store.items.filter((item) => {
    const haystack = [item.title, item.body, ...(item.tags || [])].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

export async function seedMemory(seedItems = [], cwd = process.cwd(), options = {}) {
  return withStoreLock(cwd, async () => {
    const existing = await loadStore(cwd);
    if (!options.force && existing.items.length) {
      throw validationError("memory store already has items; pass --force to replace it");
    }

    const store = createEmptyStore();
    const now = new Date();
    const seen = new Set();
    store.items = seedItems.map((item, index) => {
      const memoryItem = createMemoryItem({
        ...item,
        id: item.id || `demo_${String(index + 1).padStart(3, "0")}`,
        source: item.source || "demo-seed",
        created_at: item.created_at || now.toISOString()
      }, now, { trustMetadata: true });

      if (seen.has(memoryItem.id)) {
        throw validationError(`seed memory item id is duplicated: ${memoryItem.id}`);
      }
      seen.add(memoryItem.id);
      return memoryItem;
    });
    return writeStoreUnlocked(store, cwd);
  });
}

export function createEmptyStore() {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_STORE,
    created_at: now,
    updated_at: now,
    items: []
  };
}

async function writeStoreUnlocked(store, cwd = process.cwd()) {
  const dir = getDataDir(cwd);
  const storePath = getStorePath(cwd);
  const tmpPath = `${storePath}.${process.pid}.${Date.now()}.${randomSuffix()}.tmp`;
  await mkdir(dir, { recursive: true });
  const payload = {
    ...store,
    updated_at: new Date().toISOString(),
    items: Array.isArray(store.items) ? store.items : []
  };
  await writeFile(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(tmpPath, storePath);
  return payload;
}

function sanitizeRuntimeMemoryInput(input = {}) {
  return {
    type: input.type,
    title: input.title,
    body: input.body,
    tags: input.tags,
    source: input.source
  };
}

async function withStoreLock(cwd, action) {
  const key = getStorePath(cwd);
  const previous = storeLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current, () => current);
  storeLocks.set(key, queued);

  await previous.catch(() => {});
  try {
    return await action();
  } finally {
    release();
    if (storeLocks.get(key) === queued) storeLocks.delete(key);
  }
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.publicMessage = message;
  return error;
}

function randomSuffix() {
  const bytes = new Uint8Array(4);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now()}-${process.hrtime.bigint()}`;
}
