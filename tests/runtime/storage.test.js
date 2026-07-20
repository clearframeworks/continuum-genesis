import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { addMemory, listMemory, loadStore, seedMemory } from "../../packages/memory-runtime/src/storage.js";

test("storage seeds, lists, and adds memory", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "continuum-genesis-"));
  try {
    await seedMemory([
      {
        title: "Demo item",
        body: "This is safe demo memory.",
        tags: ["demo"]
      }
    ], cwd);

    let items = await listMemory({}, cwd);
    assert.equal(items.length, 1);

    await addMemory({
      title: "Follow up",
      body: "Send a short customer update.",
      tags: ["customer"]
    }, cwd);

    items = await listMemory({ q: "customer" }, cwd);
    assert.equal(items.length, 1);

    const store = await loadStore(cwd);
    assert.equal(store.items.length, 2);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("seedMemory requires force before replacing an existing store", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "continuum-genesis-"));
  try {
    await seedMemory([
      {
        title: "Original item",
        body: "This should not be replaced silently.",
        tags: ["demo"]
      }
    ], cwd);

    await assert.rejects(() => seedMemory([
      {
        title: "Replacement item",
        body: "This requires explicit force.",
        tags: ["demo"]
      }
    ], cwd), /pass --force/);

    let items = await listMemory({}, cwd);
    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Original item");

    await seedMemory([
      {
        title: "Replacement item",
        body: "This replacement is explicit.",
        tags: ["demo"]
      }
    ], cwd, { force: true });

    items = await listMemory({}, cwd);
    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Replacement item");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
