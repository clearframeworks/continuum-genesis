import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("text cockpit is installable as a PWA", async () => {
  const manifest = JSON.parse(await readFile("apps/text-cockpit/manifest.webmanifest", "utf8"));
  const serviceWorker = await readFile("apps/text-cockpit/sw.js", "utf8");
  const index = await readFile("apps/text-cockpit/index.html", "utf8");
  const main = await readFile("apps/text-cockpit/main.js", "utf8");

  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./?source=pwa");
  assert.equal(manifest.icons.some((icon) => icon.sizes === "192x192"), true);
  assert.equal(manifest.icons.some((icon) => icon.sizes === "512x512"), true);
  assert.match(index, /rel="manifest"/);
  assert.match(main, /navigator\.serviceWorker\.register/);
  assert.match(serviceWorker, /CACHE_NAME/);
  assert.doesNotMatch(serviceWorker, /Authorization|token|secret/i);
});
