export const SHARD_SCHEMA = "continuum-shard/v0";
export const MEMORY_ITEM_SCHEMA = "continuum-memory-item/v0";

const DEFAULT_MAX_ITEMS = 8;
const DEFAULT_TERMS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "with"
]);

export function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags
    .map((tag) => String(tag || "").trim().toLowerCase())
    .filter(Boolean))]
    .slice(0, 20);
}

export function createMemoryItem(input = {}, now = new Date()) {
  const title = String(input.title || "").trim();
  const body = String(input.body || "").trim();
  if (!title) throw new Error("memory item title is required");
  if (!body) throw new Error("memory item body is required");

  const timestamp = now.toISOString();
  return {
    schema: MEMORY_ITEM_SCHEMA,
    id: input.id || createId("mem", now),
    type: String(input.type || "note").trim().toLowerCase(),
    title,
    body,
    tags: normalizeTags(input.tags),
    source: String(input.source || "local").trim().slice(0, 80),
    created_at: input.created_at || timestamp,
    updated_at: timestamp
  };
}

export function buildShard({
  query = "",
  items = [],
  maxItems = DEFAULT_MAX_ITEMS,
  mode = "reference-keyword-recency",
  now = new Date()
} = {}) {
  const cleanQuery = String(query || "").trim();
  const limit = Math.max(1, Math.min(Number(maxItems) || DEFAULT_MAX_ITEMS, 30));
  const scored = items
    .map((item) => ({ item, score: scoreMemoryItem(cleanQuery, item, now) }))
    .filter((entry) => entry.score > 0 || !cleanQuery)
    .sort((a, b) => b.score - a.score || Date.parse(b.item.updated_at || 0) - Date.parse(a.item.updated_at || 0))
    .slice(0, limit);

  return {
    schema: SHARD_SCHEMA,
    id: createId("shard", now),
    query: cleanQuery,
    mode,
    generated_at: now.toISOString(),
    item_count: scored.length,
    items: scored.map(({ item, score }) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      body: item.body,
      tags: item.tags || [],
      source: item.source || "local",
      updated_at: item.updated_at || item.created_at,
      score
    })),
    safety_notice: "Reference shard only. Review before sending to any model or third-party service."
  };
}

export function renderShardAsText(shard = {}) {
  const lines = [
    `# Continuum Genesis Shard`,
    ``,
    `Schema: ${shard.schema || SHARD_SCHEMA}`,
    `Query: ${shard.query || ""}`,
    `Mode: ${shard.mode || "reference-keyword-recency"}`,
    `Generated: ${shard.generated_at || ""}`,
    ``,
    `Safety: ${shard.safety_notice || "Review before use."}`,
    ``
  ];

  const items = Array.isArray(shard.items) ? shard.items : [];
  if (!items.length) {
    lines.push("No matching memory items.");
    return lines.join("\n");
  }

  items.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${item.title || item.id}`);
    lines.push(`Type: ${item.type || "note"} | Tags: ${(item.tags || []).join(", ") || "none"} | Score: ${item.score ?? 0}`);
    lines.push(String(item.body || "").trim());
    lines.push("");
  });

  return lines.join("\n").trimEnd();
}

export function tokenize(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !DEFAULT_TERMS.has(term));
}

export function scoreMemoryItem(query, item = {}, now = new Date()) {
  const terms = tokenize(query);
  const haystack = [
    item.title,
    item.body,
    ...(Array.isArray(item.tags) ? item.tags : [])
  ].join(" ").toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += 5;
    if (String(item.title || "").toLowerCase().includes(term)) score += 3;
    if ((item.tags || []).some((tag) => String(tag).toLowerCase() === term)) score += 4;
  }

  const updated = Date.parse(item.updated_at || item.created_at || "");
  if (Number.isFinite(updated)) {
    const ageDays = Math.max(0, (now.getTime() - updated) / 86400000);
    score += Math.max(0, 3 - ageDays / 30);
  }

  return Math.round(score * 100) / 100;
}

export function validateShard(shard = {}) {
  const errors = [];
  if (shard.schema !== SHARD_SCHEMA) errors.push(`schema must be ${SHARD_SCHEMA}`);
  if (!Array.isArray(shard.items)) errors.push("items must be an array");
  if (typeof shard.query !== "string") errors.push("query must be a string");
  return { ok: errors.length === 0, errors };
}

export function createId(prefix, now = new Date()) {
  const time = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}_${rand}`;
}
