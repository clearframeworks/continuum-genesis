import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createMemoryItem } from "../../shard-format/src/index.js";

const DEFAULT_STORE = {
  schema: "continuum-genesis-store/v0",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  items: []
};

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
  const dir = getDataDir(cwd);
  const storePath = getStorePath(cwd);
  const tmpPath = `${storePath}.tmp`;
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

export async function addMemory(input, cwd = process.cwd()) {
  const store = await loadStore(cwd);
  const item = createMemoryItem(input);
  store.items.unshift(item);
  const saved = await saveStore(store, cwd);
  return { store: saved, item };
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

export async function seedMemory(seedItems = [], cwd = process.cwd()) {
  const store = createEmptyStore();
  const now = new Date();
  store.items = seedItems.map((item, index) => createMemoryItem({
    ...item,
    id: item.id || `demo_${String(index + 1).padStart(3, "0")}`,
    source: item.source || "demo-seed",
    created_at: item.created_at || now.toISOString()
  }, now));
  return saveStore(store, cwd);
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
