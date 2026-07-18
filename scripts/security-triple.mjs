import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const SKIP_DIRS = new Set([".git", "node_modules", ".continuum-genesis"]);
const TEXT_EXTENSIONS = new Set([".js", ".json", ".md", ".html", ".css", ".yml", ".yaml", ".txt", ""]);
const join = (...parts) => parts.join("");
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");

const releaseBlockedPatterns = [
  { name: "secret-looking assignment", pattern: /\b(secret|password|private[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"']{12,}["']/i },
  { name: "provider API key", pattern: /\b(OPENAI|ANTHROPIC|SUPABASE|RAILWAY|VERCEL)_[A-Z0-9_]*(KEY|TOKEN|SECRET)\b/ },
  { name: "local Windows path", pattern: /[A-Z]:\\Users\\/ },
  { name: "private backend name", pattern: new RegExp(`\\b${join("ar", "k", "-", "os")}\\b`, "i") },
  { name: "private product path", pattern: new RegExp(`\\b${join("ev", "an", "-", "os")}\\b|\\b${join("api", "/", "ev", "an")}\\b|\\b${join("ev", "an", "/", "index", ".", "html")}\\b`, "i") },
  { name: "known client marker", pattern: new RegExp(`\\b${join("Design", "\\s*&\\s*", "Remodeling", "\\s*", "Experts")}\\b|\\b${join("D", "R", "E")}\\b`) }
];

const passes = [
  ["unit and format tests", [process.execPath, [npmCli, "test"]]],
  ["public leak-check test", [process.execPath, [npmCli, "run", "leak:check"]]],
  ["release-shape scan", [null, []]]
];

for (const [label, command] of passes) {
  console.log(`\n[security:triple] ${label}`);
  if (command[0]) {
    const result = spawnSync(command[0], command[1], {
      cwd: ROOT,
      stdio: "inherit"
    });
    if (result.status !== 0) {
      console.error(`[security:triple] failed: ${label}`);
      process.exit(result.status || 1);
    }
  } else {
    await releaseShapeScan();
  }
}

console.log("\n[security:triple] all gates passed");

async function releaseShapeScan() {
  const findings = [];
  const files = await listFiles(ROOT);

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    if (rel.startsWith(".continuum-genesis/")) findings.push(`runtime data must not be tracked: ${rel}`);
    if (rel === ".env" || rel.startsWith(".env.")) findings.push(`env file must not ship: ${rel}`);

    const ext = path.extname(file);
    if (!TEXT_EXTENSIONS.has(ext)) continue;

    const text = await readFile(file, "utf8");
    for (const rule of releaseBlockedPatterns) {
      if (rule.pattern.test(text)) findings.push(`${rule.name}: ${rel}`);
    }

    if (rel.endsWith("sw.js") && (/\/v0\//.test(text) || /\/health/.test(text))) {
      if (!/url\.pathname\.startsWith\("\/v0\/"\) \|\| url\.pathname === "\/health"/.test(text)) {
        findings.push(`service worker may cache protected/runtime API routes: ${rel}`);
      }
    }
  }

  const manifest = JSON.parse(await readFile(path.join(ROOT, "apps", "text-cockpit", "manifest.webmanifest"), "utf8"));
  if (manifest.display !== "standalone") findings.push("manifest display must be standalone");
  if (!manifest.icons?.some((icon) => icon.sizes === "192x192")) findings.push("manifest needs 192x192 icon");
  if (!manifest.icons?.some((icon) => icon.sizes === "512x512")) findings.push("manifest needs 512x512 icon");

  if (findings.length) {
    console.error(findings.map((item) => `- ${item}`).join("\n"));
    process.exit(1);
  }
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...await listFiles(path.join(dir, entry.name)));
      continue;
    }

    if (!entry.isFile()) continue;
    const file = path.join(dir, entry.name);
    const info = await stat(file);
    if (info.size > 2 * 1024 * 1024) {
      throw new Error(`file is too large for starter repo review: ${path.relative(ROOT, file)}`);
    }
    files.push(file);
  }
  return files;
}
