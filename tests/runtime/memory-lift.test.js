import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("memory comparison check treats naked mode as benchmark", () => {
  const result = spawnSync(process.execPath, ["scripts/evaluate-memory-lift.mjs", "--json"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.benchmark.recalled_items, 0);
  assert.equal(report.continuum.recalled_items, report.continuum.expected_items);
  assert.equal(report.continuum.recall_rate, 1);
  assert.equal(report.native_model_memory, null);
  assert.equal(report.comparison, null);
});
