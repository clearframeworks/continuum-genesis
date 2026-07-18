# Continuum Memory Standard v0

This document defines the public surface implemented by Continuum Genesis.

The goal is simple: an app should be able to save useful memory, ask for task-relevant context, and receive a small shard it can pass to an AI model or workflow.

## Terms

- **Memory item**: one saved fact, note, rule, decision, or observation.
- **Shard**: task-scoped context assembled from memory items.
- **Runtime**: the local service that stores memory and builds shards.
- **Client**: an app, CLI, or workflow calling the runtime.

## HTTP API

Base URL for the reference runtime:

```text
http://127.0.0.1:8787
```

### GET /health

Returns runtime status.

```json
{
  "ok": true,
  "service": "continuum-genesis-memory-runtime",
  "version": "0.1.0"
}
```

### POST /v0/memory

Adds a memory item.

Request:

```json
{
  "type": "note",
  "title": "Follow-up preference",
  "body": "The customer prefers short updates after 4 PM.",
  "tags": ["customer", "follow-up"]
}
```

Response:

```json
{
  "ok": true,
  "item": {
    "id": "mem_...",
    "type": "note",
    "title": "Follow-up preference",
    "body": "The customer prefers short updates after 4 PM.",
    "tags": ["customer", "follow-up"],
    "created_at": "2026-07-18T00:00:00.000Z",
    "updated_at": "2026-07-18T00:00:00.000Z"
  }
}
```

### GET /v0/memory

Lists memory items. Optional query:

```text
/v0/memory?q=follow-up
```

### POST /v0/shards

Builds a task-scoped shard.

Request:

```json
{
  "query": "Draft the customer follow-up.",
  "max_items": 5
}
```

Response:

```json
{
  "ok": true,
  "shard": {
    "schema": "continuum-shard/v0",
    "query": "Draft the customer follow-up.",
    "mode": "reference-keyword-recency",
    "items": []
  }
}
```

## Reference Selection

The reference runtime uses basic keyword and recency scoring. It is deliberately plain. It proves the public protocol and format, not the operated Continuum engine.

## Compatibility Rule

Clients should treat unknown fields as optional and preserve them when possible.
