import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildShard, renderShardAsText } from "../../shard-format/src/index.js";
import { listMemory, loadStore, seedMemory } from "./storage.js";

const ROOT = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)));

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "seed") {
    const file = args[0];
    if (!file) throw new Error("usage: seed <seed-file.json>");
    const raw = await readFile(path.resolve(ROOT, file), "utf8");
    const seed = JSON.parse(raw);
    const items = Array.isArray(seed) ? seed : seed.items;
    if (!Array.isArray(items)) throw new Error("seed file must be an array or { items: [] }");
    const store = await seedMemory(items, ROOT, { force: args.includes("--force") });
    console.log(`Seeded ${store.items.length} memory items.`);
  } else if (command === "list") {
    const items = await listMemory({ q: getFlagValue(args, "--query") || getFlagValue(args, "-q") }, ROOT);
    console.log(JSON.stringify({ ok: true, items }, null, 2));
  } else if (command === "shard") {
    const query = getFlagValue(args, "--query") || getFlagValue(args, "-q") || args.join(" ");
    const maxItems = getFlagValue(args, "--max-items") || getFlagValue(args, "--max") || 8;
    const store = await loadStore(ROOT);
    const shard = buildShard({ query, maxItems, items: store.items });
    console.log(renderShardAsText(shard));
  } else {
    console.log("Usage:");
    console.log("  node packages/memory-runtime/src/cli.js seed examples/simple-business-memory/seed.json [--force]");
    console.log("  node packages/memory-runtime/src/cli.js list --query customer");
    console.log("  node packages/memory-runtime/src/cli.js shard --query \"customer update\"");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function getFlagValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
}
