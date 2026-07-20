# Reproduce Continuum Genesis Locally

This page is for people who want to inspect the implementation before reading the blog thesis.
It uses only local source code and sample data. No hosted account or API key is required.

## Prerequisites

- Node.js 20 or newer
- PowerShell, Bash, or any shell that can run `npm`

## Clone And Install

```powershell
git clone https://github.com/clearframeworks/continuum-genesis.git
cd continuum-genesis
npm install
```

## Inspect The Source

| Path | Purpose |
| --- | --- |
| `packages/memory-runtime/src/server.js` | HTTP runtime: `/health`, `/v0/memory`, `/v0/shards` |
| `packages/memory-runtime/src/cli.js` | CLI entry point for seeding and shard generation |
| `packages/memory-runtime/src/storage.js` | Local JSON memory store |
| `packages/shard-format/src/index.js` | Retrieval scoring and shard rendering |
| `packages/sdk-js/src/index.js` | JavaScript client |
| `apps/text-cockpit/` | Browser/PWA cockpit |
| `tests/runtime/` | Runtime and shard behavior tests |
| `scripts/evaluate-memory-lift.mjs` | Small local memory-lift reproduction harness |

## Run The Tests

```powershell
npm test
npm run leak:check
npm run security:triple
```

What this proves:

- The memory runtime and shard formatter execute.
- The local PWA assets are present and route correctly.
- The leak/security gate does not find obvious public-release mistakes.

## Run The Local Memory Runtime

Seed sample memory:

```powershell
npm run seed
```

Build a context shard from the CLI:

```powershell
npm run shard -- --query "What should the follow-up email remember?"
```

Start the local cockpit:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:8787/
```

API checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
Invoke-RestMethod http://127.0.0.1:8787/v0/memory
```

Create a shard through HTTP:

```powershell
$body = @{ query = "customer update"; max_items = 3 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8787/v0/shards -Body $body -ContentType "application/json"
```

## Run The Small Evaluation Harness

```powershell
npm run eval:memory -- --json
```

Expected shape:

- `benchmark-no-memory` returns zero recalled items.
- `continuum-shard` returns the expected sample-memory items.
- `native_model_memory` is `null` unless you provide a separate captured model-memory result file.

Optional native-memory comparison:

```powershell
npm run eval:memory -- --model-memory examples/evaluation/model-memory-results.sample.json
```

## What This Does Not Prove

This local harness is a small reproducibility check. It is not the full LongMemEval-S or
LoCoMo benchmark run. The full benchmark figures are reported in
[benchmarks.md](benchmarks.md) with provenance labels:

- `ours, officially scored`: scored with the benchmark's official scripts, not yet
  independently reproduced.
- `vendor, self-reported`: published by the vendor, not independently verified here.
- `independent reproduction`: rerun by someone other than the vendor.

The full official benchmark logs are retained but are not yet packaged as a public
one-command reproduction artifact. Until they are, the benchmark claims should be read
with the labels attached.

## Short Version

This repository is not only a thesis document. It contains a runnable local memory
runtime, a shard builder, a browser cockpit, tests, and a small local reproduction
harness. The blog thesis explains why the measured results matter; this page shows where
the implementation lives.
