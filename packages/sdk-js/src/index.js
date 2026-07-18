export class ContinuumGenesisClient {
  constructor({ baseUrl = "http://127.0.0.1:8787", fetchImpl = globalThis.fetch, headers = {} } = {}) {
    if (!fetchImpl) throw new Error("fetch is required");
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.fetch = (...args) => fetchImpl(...args);
    this.headers = { ...headers };
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
