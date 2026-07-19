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

It gives developers a small local runtime, a public shard format, a JavaScript SDK, an installable text cockpit, and a repeatable evaluation harness. The goal is simple: store durable project facts, retrieve only what a task needs, and hand a compact context shard to a model or workflow.

## Why It Exists

Most AI workflows still choose between two weak defaults: re-send a large context bundle every turn, or rely on whatever a model remembers on its own. Genesis exposes a third pattern: keep project memory outside the model, retrieve the relevant slice on demand, and make the context unit small enough to inspect.

## Core Ideas

- **Task-scoped context**: retrieve a small shard instead of re-sending a whole project.
- **Inspectable memory**: memory items are plain JSON and can be reviewed before use.
- **Local-first runtime**: the reference service runs on `127.0.0.1` with no cloud account or API key.
- **Portable interface**: the text cockpit can run in a browser or install as a PWA.
- **Measured behavior**: the evaluation harness separates the naked benchmark from native model-memory comparisons.

## How It Works

```text
memory items -> local runtime -> retrieval pass -> context shard -> model, agent, or workflow
```

The reference selector is intentionally simple: keyword and recency scoring. That keeps the mechanics auditable while leaving room for semantic retrieval, embeddings, graph memory, or agent-specific adapters.

## Quick Start

```powershell
npm install
npm run seed
npm start
```

Open `http://127.0.0.1:8787/` and try the text cockpit.

The cockpit is installable as a PWA when served by the local runtime.

Build a shard from the command line:

```powershell
npm run shard -- --query "What should the follow-up email remember?"
```

Run checks:

```powershell
npm test
npm run leak:check
npm run security:triple
```

Run the comparison harness. The naked/no-memory run is the floor benchmark. Add a captured native model-memory result file when comparing model memory against Continuum shards:

```powershell
npm run eval:memory
npm run eval:memory -- --model-memory examples/evaluation/model-memory-results.sample.json
```

## API Surface

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Check runtime status |
| `GET /v0/memory` | List stored memory items |
| `POST /v0/memory` | Add a memory item |
| `POST /v0/shards` | Build a task-scoped context shard |

## Architecture

```text
apps/text-cockpit/        installable browser interface
packages/memory-runtime/  local file-backed HTTP runtime
packages/shard-format/    memory item and shard helpers
packages/sdk-js/          JavaScript client
examples/                 safe seed data and evaluation shape
tests/                    runtime, PWA, and release-safety checks
docs/                     protocol, setup, boundary, and release notes
```

## Terminology

Genesis uses familiar AI infrastructure language where it helps:

- **Persistent memory**: durable project facts outside a model session.
- **Retrieval**: selecting the memory that matters for the current task.
- **Context shard**: the compact payload passed into a model or workflow.
- **Memory provider**: an implementation that can serve memory to an agent, CLI, or app.
- **Local-first**: data starts on the developer's machine and does not require a hosted account.

See [docs/terminology.md](docs/terminology.md).

## Status And Roadmap

Genesis is at `v0.1.0`: usable as a local reference runtime and public protocol seed.

Near-term roadmap:

- MCP adapter for agent clients.
- Import/export commands for portable memory sets.
- Semantic retrieval option behind a local-only flag.
- Expanded benchmark fixtures for native model-memory comparisons.
- More client examples for browser apps, CLIs, and workflow runners.

See [docs/roadmap.md](docs/roadmap.md).

## Benchmarks

We publish our full benchmark results — internal and external, wins and regressions — with every number labeled as officially scored, vendor self-reported, or independently reproduced. Summary: we hold recall parity with every credible system in the domain (~63% LongMemEval-S, a ceiling the whole field shares), and our token-first engine reaches near-parity at ~26× fewer prompt tokens per query.

See [docs/benchmarks.md](docs/benchmarks.md).

Our position on why the recall ceiling exists — retrieval delivers complete evidence for ~87% of questions while answers land at ~63%, so the shared bottleneck is the responder LLM, not the memory layer — is argued with its limits in [docs/thesis-llm-bottleneck.md](docs/thesis-llm-bottleneck.md).

## Public Boundary

Genesis is the open memory layer: protocol, shard format, reference runtime, SDK, and local cockpit. Managed Continuum adds production hosting, security review, isolation, stronger routing, business integrations, monitoring, and support.

Use Genesis freely for local prototypes and research. Move to managed protocols before storing sensitive business records, customer data, regulated information, or operational memory that requires access control and audit discipline.

## Security Posture

Before every public push, run:

```powershell
npm run security:triple
```

The release gate runs unit tests, leak checks, and a release-shape scan for local paths, provider key patterns, private runtime markers, customer-data markers, and service-worker caching mistakes.

See [SECURITY.md](SECURITY.md), [docs/public-private-boundary.md](docs/public-private-boundary.md), and [docs/release-checklist.md](docs/release-checklist.md).

## Project Practice

Issues and pull requests use lightweight templates. Contributions stay small, auditable, and compatible with the MIT license.

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [CHANGELOG.md](CHANGELOG.md).

## Related Public Tools

- [Plainsight](https://github.com/clearframeworks/plainsight) - MIT, device-local document risk reader.
- [Throughline](https://github.com/clearframeworks/throughline) - MIT public archive of EVAN's first public venture.

## License

MIT. Copyright ClearFrameworks LLC.
