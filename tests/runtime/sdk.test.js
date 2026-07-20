import test from "node:test";
import assert from "node:assert/strict";
import { ContinuumGenesisClient, defaultBaseUrl } from "../../packages/sdk-js/src/index.js";

test("SDK defaults to the current browser origin when one exists", async () => {
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, "location");
  let requestedUrl = "";

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { origin: "http://127.0.0.1:8799" }
  });

  try {
    assert.equal(defaultBaseUrl(), "http://127.0.0.1:8799");
    const client = new ContinuumGenesisClient({
      fetchImpl: async (url) => {
        requestedUrl = url;
        return {
          ok: true,
          json: async () => ({ ok: true })
        };
      }
    });
    await client.health();
    assert.equal(requestedUrl, "http://127.0.0.1:8799/health");
  } finally {
    if (previousLocation) Object.defineProperty(globalThis, "location", previousLocation);
    else delete globalThis.location;
  }
});

test("SDK refuses to send bearer credentials to non-HTTPS remote endpoints", () => {
  assert.throws(() => new ContinuumGenesisClient({
    baseUrl: "http://example.com",
    headers: { Authorization: "Bearer test-token" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true }) })
  }), /access tokens require HTTPS/);

  assert.doesNotThrow(() => new ContinuumGenesisClient({
    baseUrl: "https://example.com",
    headers: { Authorization: "Bearer test-token" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true }) })
  }));

  assert.doesNotThrow(() => new ContinuumGenesisClient({
    baseUrl: "http://127.0.0.1:8787",
    headers: { Authorization: "Bearer local-token" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true }) })
  }));
});
