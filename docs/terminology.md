# Terminology

Continuum Genesis uses plain infrastructure terms so the project is easy to compare with other AI memory systems.

## Memory Item

A durable fact, note, rule, decision, or observation stored outside the model session.

## Retrieval

The selection step that finds relevant memory for a task. The reference runtime uses keyword and recency scoring; other providers can use embeddings, graph search, rerankers, or hybrid retrieval while preserving the same shard contract.

## Context Shard

A compact packet of task-relevant memory. A shard is meant to be small enough to inspect before sending to a model, agent, or workflow.

## Memory Provider

Any implementation that serves memory and shards to a client. Genesis includes a local file-backed provider.

## Native Model Memory

Memory supplied by the model or provider account rather than by an external runtime. Genesis treats native memory as a comparison condition in evaluation, not as the same thing as a context shard.

## Naked Benchmark

A no-memory control condition. It is useful as a floor, but the main comparison is Continuum shard retrieval against native model memory on the same scenario set.

## Local-First

The runtime starts on the developer's machine, binds to loopback, and avoids cloud accounts or API keys in the reference path.
