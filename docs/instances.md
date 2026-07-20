# Instances

Continuum Genesis is the base product. An instance is the isolated data and runtime
wrapper around that product.

The instance oracle is JSON:

```text
.continuum-instances/<instance-id>/instance.json
```

That file holds the mission, runtime location, isolation boundary, and upgrade gate.
The AI does not need broad history by default. It gets the smallest task-fit shard the
runtime can build from the JSON-backed memory store.

Keep the surfaces separated:

- User surface: concise receipt/status only.
- Model surface: the smallest task-fit shard only.
- Audit surface: timestamped logs, receipts, decisions, and rewind detail.

## Instance 001

Create the first local isolated instance:

```powershell
npm run instance:create -- instance-001
npm run instance:start -- instance-001
```

Open:

```text
http://127.0.0.1:8788/
```

Instance data stays in `.continuum-instances/`, which is ignored by Git.

## Universal Upgrade Gate

Every self-upgrade proposal must answer yes to this:

> Does this improve token savings, improve context timing or relevance for the current
> repo/data prompt, or both?

Reject upgrades that add ceremony without improving retrieval, injection timing, token
use, or answer quality. Answer quality is measured separately because the output model
can remain the bottleneck even when memory input is correct.
