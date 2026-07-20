<p align="center">
  <img src="./assets/continuum-genesis-logo.svg" alt="Continuum Genesis" width="720">
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2fd4c2"></a>
  <img alt="Runtime: local first" src="https://img.shields.io/badge/runtime-local--first-6ab8ff">
  <img alt="Interface: PWA" src="https://img.shields.io/badge/interface-PWA-57d99a">
</p>

# Continuum Genesis

Continuum Genesis is an MIT reference implementation of task-scoped AI memory.

This repository is the runnable base product: local runtime, shard format,
JavaScript SDK, installable text cockpit, tests, and a small evaluation harness.
Thesis writing and public interpretation are separated into [blog/](blog/).

## Run This First

No API key is required for the local reference runtime.

```powershell
npm install
npm test
npm run seed
npm run shard -- --query "What should the follow-up email remember?"
npm run eval:memory -- --json
```

Start the local cockpit:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:8787/
```

## Inspect The System

| Path | What to inspect |
| --- | --- |
| `packages/memory-runtime/src/server.js` | Local HTTP runtime and API routes |
| `packages/memory-runtime/src/cli.js` | Seed, list, and shard CLI |
| `packages/memory-runtime/src/storage.js` | File-backed memory store |
| `packages/shard-format/src/index.js` | Retrieval scoring and context-shard builder |
| `packages/sdk-js/src/index.js` | JavaScript client |
| `apps/text-cockpit/` | Installable browser/PWA interface |
| `tests/runtime/` | Runtime, shard, PWA, and memory-lift tests |
| `scripts/evaluate-memory-lift.mjs` | Small local reproduction harness |

See [docs/reproduce.md](docs/reproduce.md) for exact commands and what each one proves.

## What It Does

Genesis stores durable project facts, retrieves only what the current task needs, and
hands a compact context shard to a model, agent, CLI, or workflow.

```text
memory items -> local runtime -> retrieval pass -> context shard -> model or workflow
```

The reference selector is intentionally simple: keyword and recency scoring. That keeps
the mechanics auditable while leaving room for semantic retrieval, embeddings, graph
memory, or agent-specific adapters.

## Local Runtime

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Check runtime status |
| `GET /v0/memory` | List stored memory items |
| `POST /v0/memory` | Add a memory item |
| `POST /v0/shards` | Build a task-scoped context shard |

Useful commands:

```powershell
npm run seed
npm run shard -- --query "What should the follow-up email remember?"
npm run eval:memory
npm run security:triple
```

## Isolated Instances

The base product stays generic. Local instance data lives outside the product code:

```powershell
npm run instance:create -- instance-001
npm run instance:start -- instance-001
```

The instance JSON is the oracle for mission, runtime, isolation, and upgrade rules.
It keeps user receipts, model context shards, and audit logs as separate surfaces.
See [docs/instances.md](docs/instances.md).

## Benchmarks

Benchmark results live in [docs/benchmarks.md](docs/benchmarks.md), with each number
labeled as officially scored, vendor self-reported, or independently reproduced.

The short version: Genesis holds the same credible accuracy band as other long-memory
systems while optimizing for token efficiency, local ownership, and auditability.

For the argument behind that reading:

- [The Reader Is the Bottleneck](blog/thesis/reader-is-the-bottleneck.md)
- [The Persistent Mirage](blog/thesis/the-persistent-mirage.md)
- [The Reader Ceiling and Memory's Real Job](blog/notes/2026-07-20-reader-ceiling-memory-real-job.md)

## Docs And Blog

| Section | Purpose |
| --- | --- |
| [docs/](docs/) | Technical reference, reproduction, benchmarks, release checks |
| [blog/thesis/](blog/thesis/) | Formal measurement interpretation |
| [blog/notes/](blog/notes/) | Shorter public explanations |
| [blog/reflections/](blog/reflections/) | First-person or experiential writing |

## Security Posture

Before every public push, run:

```powershell
npm run security:triple
```

The release gate runs unit tests, leak checks, and a release-shape scan for local paths,
provider key patterns, private runtime markers, customer-data markers, and
service-worker caching mistakes.

See [SECURITY.md](SECURITY.md), [docs/public-private-boundary.md](docs/public-private-boundary.md),
and [docs/release-checklist.md](docs/release-checklist.md).

## Related Public Tools

- [Plainsight](https://github.com/clearframeworks/plainsight) - MIT, device-local document risk reader.
- [Throughline](https://github.com/clearframeworks/throughline) - MIT public archive of EVAN's first public venture.

## License

MIT. Copyright ClearFrameworks LLC.
