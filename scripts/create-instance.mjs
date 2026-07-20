import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEmptyStore, getStorePath } from "../packages/memory-runtime/src/storage.js";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
const id = normalizeId(process.argv[2] || "instance-001");
const relativeDataDir = path.join(".continuum-instances", id).replace(/\\/g, "/");
const dataDir = path.join(ROOT, ".continuum-instances", id);
const instancePath = path.join(dataDir, "instance.json");
const eventsPath = path.join(dataDir, "events.jsonl");
const now = new Date().toISOString();
const previousDataDir = process.env.CONTINUUM_GENESIS_DATA_DIR;

await mkdir(dataDir, { recursive: true });

let created = false;
try {
  await readFile(instancePath, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeJson(instancePath, createInstanceOracle());
  created = true;
}

process.env.CONTINUUM_GENESIS_DATA_DIR = dataDir;
try {
  await readFile(getStorePath(ROOT), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeJson(getStorePath(ROOT), createEmptyStore());
}
if (previousDataDir === undefined) {
  delete process.env.CONTINUUM_GENESIS_DATA_DIR;
} else {
  process.env.CONTINUUM_GENESIS_DATA_DIR = previousDataDir;
}

await writeFile(eventsPath, `${JSON.stringify({
  ts: now,
  type: created ? "instance_created" : "instance_checked",
  instance_id: id,
  base_product: packageJson.name
})}\n`, { flag: "a" });

console.log(JSON.stringify({
  ok: true,
  instance_id: id,
  created,
  data_dir: relativeDataDir,
  oracle: `${relativeDataDir}/instance.json`,
  memory_store: `${relativeDataDir}/memory.json`
}, null, 2));

function createInstanceOracle() {
  return {
    schema: "continuum-instance/v0",
    id,
    created_at: now,
    updated_at: now,
    base_product: {
      name: packageJson.name,
      version: packageJson.version,
      boundary: "code, protocol, formats, SDK, local runtime, local cockpit"
    },
    mission: "Save tokens and give AI the proper task-fit guidance from a repo or data set so it can answer the prompt at hand as well as it can in that moment.",
    oracle: {
      source_of_truth: "json",
      rule: "The instance JSON record is the oracle. System detail is logged and timestamped. A model receives only the shard needed for the current prompt."
    },
    visibility: {
      user_surface: "Show concise receipts and status, not every internal detail.",
      model_surface: "Inject the smallest task-fit shard; do not send broad logs or history by default.",
      audit_surface: "Keep detailed timestamped logs for review, evaluation, and rewind."
    },
    upgrade_gate: {
      universal_rule: "An OS self-upgrade is approved only when the proposal improves token savings, improves timing or relevance of injected context, or both.",
      pass_requires: [
        "Names the prompt, repo, or data set the upgrade helps.",
        "States the expected token effect or why the same tokens carry better guidance.",
        "Keeps instance memory, logs, decisions, and private data outside the base product.",
        "Admits answer quality can still be bottlenecked by model output rather than memory input.",
        "Provides a rollback path."
      ],
      reject_if: [
        "Adds ceremony without improving retrieval, injection timing, token use, or answer quality.",
        "Moves instance data into the base product.",
        "Requires the AI to read broad history when a compact shard would do.",
        "Claims better answers without a test, receipt, or measurable acceptance condition."
      ]
    },
    runtime: {
      host: "127.0.0.1",
      port: 8788,
      data_dir: relativeDataDir
    },
    isolation: {
      instance_data: "memory, event logs, decisions, evaluation receipts, and runtime configuration",
      never_shared_between_instances: ["memory", "event_logs", "decisions", "evaluation_receipts", "runtime_config"],
      base_product_may_change_only_through_upgrade_gate: true
    }
  };
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeId(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(normalized)) {
    throw new Error("instance id must use lowercase letters, numbers, and hyphens");
  }
  return normalized;
}
