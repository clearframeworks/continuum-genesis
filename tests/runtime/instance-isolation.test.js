import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { addMemory, listMemory } from "../../packages/memory-runtime/src/storage.js";

test("CONTINUUM_GENESIS_DATA_DIR isolates instance memory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "continuum-instance-root-"));
  const previous = process.env.CONTINUUM_GENESIS_DATA_DIR;
  const instanceA = path.join(root, "instance-a");
  const instanceB = path.join(root, "instance-b");

  try {
    process.env.CONTINUUM_GENESIS_DATA_DIR = instanceA;
    await addMemory({
      title: "Instance A rule",
      body: "This memory belongs only to instance A.",
      tags: ["instance-a"]
    }, root);

    process.env.CONTINUUM_GENESIS_DATA_DIR = instanceB;
    assert.equal((await listMemory({}, root)).length, 0);

    await addMemory({
      title: "Instance B rule",
      body: "This memory belongs only to instance B.",
      tags: ["instance-b"]
    }, root);

    process.env.CONTINUUM_GENESIS_DATA_DIR = instanceA;
    const aItems = await listMemory({}, root);
    assert.equal(aItems.length, 1);
    assert.equal(aItems[0].title, "Instance A rule");

    process.env.CONTINUUM_GENESIS_DATA_DIR = instanceB;
    const bItems = await listMemory({}, root);
    assert.equal(bItems.length, 1);
    assert.equal(bItems[0].title, "Instance B rule");
  } finally {
    if (previous === undefined) {
      delete process.env.CONTINUUM_GENESIS_DATA_DIR;
    } else {
      process.env.CONTINUUM_GENESIS_DATA_DIR = previous;
    }
    await rm(root, { recursive: true, force: true });
  }
});
