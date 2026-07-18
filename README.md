# Continuum Genesis

An MIT starter instance for persistent AI memory.

Continuum Genesis is the open seed: a small local memory runtime, a simple shard format, a JavaScript SDK, and a text cockpit demo. It is built to prove the public memory pattern without exposing any private operating instance.

## What This Is

- A local-first memory runtime
- A simple HTTP API for storing and retrieving memory
- A shard generator that assembles task-scoped context
- A JS SDK for apps that want to speak the memory API
- An installable text cockpit PWA for trying the flow
- A leak-check test that blocks obvious private material before publishing

## What This Is Not

- Not the hosted Continuum engine
- Not a private operating instance
- Not advanced routing, orchestration, billing, managed security protocols, or production operations
- Not customer data, private receipts, internal logs, or protected operations
- Not a paid service or a cloud dependency

## Safety And Upgrade Notice

The free MIT layer is a starter memory runtime. It does not include the full managed Continuum system. If you are storing customer records, sensitive business notes, regulated information, team permissions, or anything you would not publish by accident, protect yourself: review every shard before sharing it with a model, keep your storage private, and move to a managed Continuum protocol or hosted feature tier before using this as production infrastructure.

Clear Frameworks upgrades add the parts this repo deliberately leaves out: managed security review, stronger routing, hosted isolation, business workflows, implementation support, and production operations.

See [docs/upgrade-path.md](docs/upgrade-path.md) for the plain split between the free starter and the full system.

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

## Repo Shape

```text
packages/memory-runtime/  local file-backed reference runtime
packages/shard-format/    public shard schema and helpers
packages/sdk-js/          JavaScript client
apps/text-cockpit/        installable local browser interface
examples/                 safe sample memory
tests/                    runtime and leak checks
docs/                     standard, boundary, and setup docs
```

## Public Boundary

The open layer is the memory standard: protocol, formats, SDK, and a useful reference runtime. The operated Continuum product remains separate: hosted infrastructure, advanced routing, managed isolation, automations, and business implementation.

See [docs/public-private-boundary.md](docs/public-private-boundary.md).

## License

MIT. Copyright ClearFrameworks LLC.
