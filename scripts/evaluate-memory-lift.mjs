import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildShard } from "../packages/shard-format/src/index.js";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const FIXED_NOW = new Date("2026-07-18T12:00:00.000Z");

const scenarios = [
  {
    id: "customer-update",
    query: "How should the office update a customer after the crew confirms the next step?",
    expectedTitles: ["Customer update style"],
    requiredTerms: ["customer", "crew", "next step"]
  },
  {
    id: "job-records",
    query: "What record should the office keep so future job questions do not interrupt the field crew?",
    expectedTitles: ["Photo records matter"],
    requiredTerms: ["before", "after", "field crew"]
  },
  {
    id: "weekly-review",
    query: "What should be reviewed every Friday at the office?",
    expectedTitles: ["Friday office review"],
    requiredTerms: ["Friday", "estimates", "approvals", "closeout"]
  },
  {
    id: "owner-dashboard",
    query: "What does the owner want on the dashboard?",
    expectedTitles: ["Owner dashboard"],
    requiredTerms: ["pending quotes", "scheduled jobs", "customer updates", "field notes"]
  }
];

const seed = JSON.parse(await readFile(path.join(ROOT, "examples", "simple-business-memory", "seed.json"), "utf8"));
const items = seed.items.map((item, index) => ({
  ...item,
  id: `demo_${String(index + 1).padStart(3, "0")}`,
  source: "demo-seed",
  created_at: FIXED_NOW.toISOString(),
  updated_at: FIXED_NOW.toISOString()
}));

const continuum = evaluateShardCondition("continuum-shard", items);
const benchmark = evaluateShardCondition("benchmark-no-memory", []);
const nativeMemory = await loadNativeModelMemoryResult();
const report = {
  ok: true,
  purpose: "Isolated local check: naked/no-memory is the floor benchmark; Continuum shard is compared against a separately captured native model-memory run at the same scenario set.",
  benchmark,
  continuum,
  native_model_memory: nativeMemory,
  comparison: compareConditions(continuum, nativeMemory)
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Continuum Genesis memory comparison check");
  console.log(`Benchmark/no-memory: ${formatRate(benchmark.recall_rate)} (${benchmark.recalled_items}/${benchmark.expected_items})`);
  console.log(`Continuum shard:     ${formatRate(continuum.recall_rate)} (${continuum.recalled_items}/${continuum.expected_items})`);
  if (nativeMemory) {
    console.log(`Native model memory: ${formatRate(nativeMemory.recall_rate)} (${nativeMemory.recalled_items}/${nativeMemory.expected_items})`);
    console.log(`Continuum delta:     ${formatSigned(report.comparison.recalled_items_delta)} items, ${formatSigned(report.comparison.recall_rate_points_delta)} points`);
  } else {
    console.log("Native model memory: not supplied. Re-run with --model-memory <results.json> to score that condition.");
  }
}

function evaluateShardCondition(name, availableItems) {
  const results = scenarios.map((scenario) => {
    const shard = buildShard({
      query: scenario.query,
      items: availableItems,
      maxItems: 3,
      now: FIXED_NOW
    });
    const returnedTitles = shard.items.map((item) => item.title);
    const matchedTitles = scenario.expectedTitles.filter((title) => returnedTitles.includes(title));
    return {
      id: scenario.id,
      expected_titles: scenario.expectedTitles,
      returned_titles: returnedTitles,
      matched_titles: matchedTitles,
      recalled: matchedTitles.length
    };
  });
  const expected = results.reduce((sum, item) => sum + item.expected_titles.length, 0);
  const recalled = results.reduce((sum, item) => sum + item.recalled, 0);
  return {
    name,
    scenarios: results.length,
    expected_items: expected,
    recalled_items: recalled,
    recall_rate: expected ? recalled / expected : 0,
    results
  };
}

async function loadNativeModelMemoryResult() {
  const file = getFlagValue(process.argv.slice(2), "--model-memory");
  if (!file) return null;
  const raw = await readFile(path.resolve(ROOT, file), "utf8");
  const payload = JSON.parse(raw);
  const answers = Array.isArray(payload) ? payload : payload.answers;
  if (!Array.isArray(answers)) throw new Error("model memory results must be an array or { answers: [] }");

  const results = scenarios.map((scenario) => {
    const answer = answers.find((entry) => entry.id === scenario.id);
    const text = String(answer?.answer || "");
    const matchedTerms = scenario.requiredTerms.filter((term) => text.toLowerCase().includes(term.toLowerCase()));
    return {
      id: scenario.id,
      required_terms: scenario.requiredTerms,
      matched_terms: matchedTerms,
      recalled: matchedTerms.length === scenario.requiredTerms.length ? 1 : 0
    };
  });
  const expected = results.length;
  const recalled = results.reduce((sum, item) => sum + item.recalled, 0);
  return {
    name: "native-model-memory",
    scenarios: results.length,
    expected_items: expected,
    recalled_items: recalled,
    recall_rate: expected ? recalled / expected : 0,
    results
  };
}

function compareConditions(continuum, nativeMemory) {
  if (!nativeMemory) return null;
  return {
    recalled_items_delta: continuum.recalled_items - nativeMemory.recalled_items,
    recall_rate_points_delta: Math.round((continuum.recall_rate - nativeMemory.recall_rate) * 10000) / 100
  };
}

function formatRate(rate) {
  return `${Math.round(rate * 1000) / 10}%`;
}

function formatSigned(value) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function getFlagValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return "";
  return args[index + 1] || "";
}
