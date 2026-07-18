import test from "node:test";
import assert from "node:assert/strict";
import { buildShard, createMemoryItem, renderShardAsText, validateShard } from "../../packages/shard-format/src/index.js";

test("buildShard selects relevant memory", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");
  const items = [
    createMemoryItem({
      id: "one",
      title: "Customer update style",
      body: "Send short customer updates after the field crew confirms the next step.",
      tags: ["customer", "follow-up"]
    }, now),
    createMemoryItem({
      id: "two",
      title: "Owner dashboard",
      body: "Show quotes, jobs, unread updates, and unresolved field notes.",
      tags: ["dashboard"]
    }, now)
  ];

  const shard = buildShard({
    query: "customer follow-up",
    items,
    maxItems: 1,
    now
  });

  assert.equal(shard.schema, "continuum-shard/v0");
  assert.equal(shard.items.length, 1);
  assert.equal(shard.items[0].id, "one");
  assert.equal(validateShard(shard).ok, true);
});

test("renderShardAsText creates a readable packet", () => {
  const shard = buildShard({
    query: "dashboard",
    items: [
      createMemoryItem({
        id: "dash",
        title: "Owner dashboard",
        body: "Show the owner pending quotes and unresolved field notes.",
        tags: ["dashboard"]
      }, new Date("2026-07-18T12:00:00.000Z"))
    ],
    now: new Date("2026-07-18T12:00:00.000Z")
  });
  const text = renderShardAsText(shard);
  assert.match(text, /Continuum Genesis Shard/);
  assert.match(text, /Owner dashboard/);
});
