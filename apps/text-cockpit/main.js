import { ContinuumGenesisClient } from "../../packages/sdk-js/src/index.js";

const client = new ContinuumGenesisClient();
const els = {
  form: document.getElementById("memoryForm"),
  title: document.getElementById("title"),
  body: document.getElementById("body"),
  tags: document.getElementById("tags"),
  query: document.getElementById("query"),
  buildShard: document.getElementById("buildShard"),
  refresh: document.getElementById("refresh"),
  shardOutput: document.getElementById("shardOutput"),
  healthBadge: document.getElementById("healthBadge"),
  count: document.getElementById("count"),
  memoryList: document.getElementById("memoryList")
};

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await client.addMemory({
      type: "note",
      title: els.title.value,
      body: els.body.value,
      tags: els.tags.value.split(",").map((tag) => tag.trim()).filter(Boolean)
    });
    els.form.reset();
    await refresh();
  } catch (error) {
    els.shardOutput.textContent = error.message;
  }
});

els.buildShard.addEventListener("click", buildShard);
els.refresh.addEventListener("click", refresh);

await refresh();

async function refresh() {
  try {
    const [health, memory] = await Promise.all([
      client.health(),
      client.listMemory()
    ]);
    els.healthBadge.textContent = health.ok ? "online" : "offline";
    els.count.textContent = String(memory.items.length);
    els.memoryList.innerHTML = memory.items.length
      ? memory.items.map(renderMemoryItem).join("")
      : `<div class="memory-item"><strong>No memory yet.</strong><p>Run npm run seed or save your first note.</p></div>`;
  } catch (error) {
    els.healthBadge.textContent = "offline";
    els.memoryList.innerHTML = `<div class="memory-item"><strong>Runtime unavailable.</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

async function buildShard() {
  try {
    const result = await client.createShard({
      query: els.query.value,
      maxItems: 8
    });
    els.shardOutput.textContent = result.text || JSON.stringify(result.shard, null, 2);
  } catch (error) {
    els.shardOutput.textContent = error.message;
  }
}

function renderMemoryItem(item) {
  return `
    <article class="memory-item">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.body)}</p>
      <div class="tags">${escapeHtml((item.tags || []).join(", ") || "untagged")}</div>
    </article>
  `;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
