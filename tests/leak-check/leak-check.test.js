import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const SKIP_DIRS = new Set([".git", "node_modules", ".continuum-genesis"]);
const TEXT_EXTENSIONS = new Set([".js", ".json", ".md", ".html", ".css", ".yml", ".yaml", ".txt", ""]);

const BLOCKED_PATTERNS = [
  { name: "OpenAI key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { name: "provider API key env", pattern: /\b(OPENAI|ANTHROPIC|SUPABASE|RAILWAY|VERCEL)_[A-Z0-9_]*KEY\b/ },
  { name: "Windows user path", pattern: /C:\\Users\\/i },
  { name: "private backend path", pattern: /\bark-os\b/i },
  { name: "protected product path", pattern: /\bevan-os\b|\bapi\/evan\b|\bevan\/index\.html\b/i },
  { name: "internal security brand", pattern: /\bObelisk\b/ },
  { name: "known private client marker", pattern: /\bDesign\s*&\s*Remodeling\s*Experts\b|\bDRE\b/ }
];

test("public tree contains no obvious private material", async () => {
  const files = await listFiles(ROOT);
  const findings = [];
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
    const text = await readFile(file, "utf8");
    for (const rule of BLOCKED_PATTERNS) {
      if (rule.pattern.test(text)) {
        findings.push(`${rule.name}: ${path.relative(ROOT, file)}`);
      }
    }
  }

  assert.deepEqual(findings, []);
});

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...await listFiles(path.join(dir, entry.name)));
    } else if (entry.isFile()) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}
