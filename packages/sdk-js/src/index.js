export class ContinuumGenesisClient {
  constructor({ baseUrl = defaultBaseUrl(), fetchImpl = globalThis.fetch, headers = {} } = {}) {
    if (!fetchImpl) throw new Error("fetch is required");
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.fetch = (...args) => fetchImpl(...args);
    this.headers = { ...headers };
    assertSafeCredentialEndpoint(this.baseUrl, this.headers);
  }

  async health() {
    return this.request("/health");
  }

  async listMemory({ query = "" } = {}) {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return this.request(`/v0/memory${suffix}`);
  }

  async addMemory(item) {
    return this.request("/v0/memory", {
      method: "POST",
      body: item
    });
  }

  async createShard({ query = "", maxItems = 8 } = {}) {
    return this.request("/v0/shards", {
      method: "POST",
      body: {
        query,
        max_items: maxItems
      }
    });
  }

  async request(path, options = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const payload = await response.json();
    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `Continuum Genesis request failed: ${response.status}`);
    }
    return payload;
  }
}

export function defaultBaseUrl() {
  if (typeof globalThis.location?.origin === "string" && globalThis.location.origin) {
    return globalThis.location.origin;
  }
  return "http://127.0.0.1:8787";
}

export function normalizeBaseUrl(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    throw new Error("endpoint must be an absolute http(s) URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("endpoint must use http or https");
  }
  url.hash = "";
  url.search = "";
  return url.href.replace(/\/+$/, "");
}

export function assertSafeCredentialEndpoint(baseUrl, headers = {}) {
  const hasCredential = Object.entries(headers)
    .some(([key, value]) => key.toLowerCase() === "authorization" && String(value || "").trim());
  if (!hasCredential) return;

  const url = new URL(baseUrl);
  if (url.protocol === "https:") return;
  if (url.protocol === "http:" && isLoopbackHost(url.hostname)) return;
  throw new Error("access tokens require HTTPS or loopback HTTP endpoint");
}

function isLoopbackHost(host = "") {
  const value = String(host).trim().toLowerCase().replace(/^\[|\]$/g, "");
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}
