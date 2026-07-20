# Why we stopped chasing the recall number

*2026-07-20*

We spent a long stretch doing what everyone in the persistent-memory space does: trying to push our benchmark score up. Iteration after iteration on the memory engine — typed records, temporal grounding, write-time distillation, consolidation. Real engineering, honestly built.

Then we ran the official numbers, and they told us a story we didn't expect.

Our deliberately simple keyword baseline retrieved the *complete* evidence for **87.45%** of LongMemEval-S questions — and answered only **63.0%** correctly. Do the arithmetic: even if every retrieval miss caused a wrong answer, **at least two-thirds of all failures happened with the full evidence already in the prompt**. The model had everything it needed and still fumbled the answer.

Then it got more uncomfortable. Our sophisticated engine — the one with all the machinery — scored **55.6%**. Lower than our simple baseline. And when we lined our numbers up against the field, everyone credible lands in the same 49–64% band, no matter how different their architectures are. A keyword selector and a temporal knowledge graph, 0.8 points apart. Meanwhile, the one published experiment that swapped only the *reader model* moved a score by +7.4 points without touching the memory at all.

That's not a memory problem. That's a ceiling that belongs to the model doing the answering — and no amount of memory engineering climbs past it. We wrote the full argument up as [The Reader Is the Bottleneck](../docs/thesis-llm-bottleneck.md), with every number labeled by how it was produced in the [benchmark results](../docs/benchmarks.md).

So we stopped chasing the number. Not out of defeat — out of honesty about what a memory layer actually *is*. It never produces the answer. It's a supply chain for evidence: find the right material, deliver it to the model, cheap and fast, from a record you own. Judged on the axes it actually controls, our token-first engine reaches the field's accuracy band at **~26× fewer prompt tokens per query**. That's the contest a memory layer can honestly win.

The industry mostly sells the other story — memory as intelligence, an AI that "grows with you." We think that's a mirage, and we wrote down why, including exactly what result would prove us wrong: [The Persistent Mirage](../docs/the-persistent-mirage.md).

The short version of where we landed: smaller promise, true promise. Save tokens. Deliver the right context at the right moment. Prove it with receipts.
