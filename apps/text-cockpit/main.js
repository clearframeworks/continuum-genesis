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
  memoryList: document.getElementById("memoryList"),
  installApp: document.getElementById("installApp"),
  managedEndpoint: document.getElementById("managedEndpoint"),
  managedToken: document.getElementById("managedToken"),
  checkManaged: document.getElementById("checkManaged"),
  clearManaged: document.getElementById("clearManaged"),
  managedBadge: document.getElementById("managedBadge"),
  managedMessage: document.getElementById("managedMessage")
};

let installPrompt = null;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  els.installApp.hidden = false;
});

els.installApp.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  els.installApp.hidden = true;
});

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
els.checkManaged.addEventListener("click", checkManagedAccess);
els.clearManaged.addEventListener("click", clearManagedAccess);

loadManagedFields();
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

async function checkManagedAccess() {
  const endpoint = els.managedEndpoint.value.trim().replace(/\/+$/, "");
  const token = els.managedToken.value.trim();

  if (!endpoint || !token) {
    setManagedState("locked", "Managed Continuum requires both an endpoint and an access token from Clear Frameworks.");
    return;
  }

  try {
    const managed = new ContinuumGenesisClient({
      baseUrl: endpoint,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const health = await managed.health();
    sessionStorage.setItem("continuum_genesis_managed_endpoint", endpoint);
    sessionStorage.setItem("continuum_genesis_managed_token", token);
    setManagedState("connected", `Connected to ${health.service || "managed Continuum"}. Protected features remain controlled by that managed instance.`);
  } catch (error) {
    setManagedState("locked", `Access check failed: ${error.message}`);
  }
}

function clearManagedAccess() {
  sessionStorage.removeItem("continuum_genesis_managed_endpoint");
  sessionStorage.removeItem("continuum_genesis_managed_token");
  els.managedEndpoint.value = "";
  els.managedToken.value = "";
  setManagedState("locked", "Managed access cleared. This starter is running local-only.");
}

function loadManagedFields() {
  els.managedEndpoint.value = sessionStorage.getItem("continuum_genesis_managed_endpoint") || "";
  els.managedToken.value = sessionStorage.getItem("continuum_genesis_managed_token") || "";
  if (els.managedEndpoint.value && els.managedToken.value) {
    setManagedState("ready", "Managed credentials are present for this browser session. Check access before using protected features.");
  }
}

function setManagedState(state, message) {
  els.managedBadge.textContent = state;
  els.managedBadge.className = `badge ${state === "connected" ? "" : "locked"}`;
  els.managedMessage.textContent = message;
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
