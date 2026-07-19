# Thesis: The Reader Is the Bottleneck

*Position paper, 2026-07-19. All numbers interpreted here are published, with provenance labels, in [docs/benchmarks.md](./benchmarks.md). This document adds no new measurements — it argues what the existing ones mean.*

**Claim: on standard long-memory benchmarks, the measured accuracy ceiling is primarily a limitation of the responder LLM — the "reader" that must answer from retrieved evidence — not of the memory or retrieval layer.**

Stated precisely: given current-generation readers (our runs use gpt-4o-mini end to end), most wrong answers occur *after* the memory system has already done its job. The evidence for this is arithmetic, not interpretive, and it comes from our own runs plus the field's honest numbers.

The claim is bounded. It is not "memory never matters" — the [limits section](#the-limits-of-this-claim) quantifies exactly how much of the failure is still the memory's fault, including in our own builds.

---

## Move 1: Retrieval succeeds

On LongMemEval-S (500 questions), our keyword-baseline selector retrieved the **complete** set of evidence sessions within its top-10 for **87.45%** of questions — session-level `recall_all@10 = 0.8745`, measured with the benchmark's official retrieval scorer (`print_retrieval_metrics.py`) on the same run chain as our QA score. **[ours, officially scored]**

"Complete" is the strict criterion: every session the benchmark marks as required evidence was present in the retrieved context, not just some of it. The QA run sends exactly those top-10 sessions to the responder, so for ~87% of questions, everything needed to answer was in the prompt.

That is the memory layer's whole job, and it was done.

## Move 2: Answers still fail — and the arithmetic says where

The same run answered **63.0%** of questions correctly (315/500, official `evaluate_qa.py`). **[ours, officially scored]**

Put the two numbers side by side:

| Step | Success rate |
| --- | --- |
| Complete evidence retrieved into the prompt | 87.45% |
| Question answered correctly | 63.0% |

Now bound the failure attribution. 37.0% of questions were answered wrong. At most 12.55% of questions had incomplete retrieval. So even under the worst-case assumption for our thesis — that *every single retrieval miss* produced a wrong answer — at least **24.4 percentage points** of the failures occurred with the complete evidence already in front of the reader.

**At minimum, two-thirds of all wrong answers are reader failures, not memory failures.** The reader had everything it needed and still could not assemble the correct answer. This is a lower bound; the true reader share is higher, because some retrieval-incomplete questions were answered correctly anyway.

The per-category pattern in [benchmarks.md §3](./benchmarks.md#3-internal-numbers-the-bigger-picture) says the same thing from a different angle: the categories that fail hardest — temporal reasoning (54.1%), multi-session assembly (53.4%), preference inference (13.3%) — are precisely the ones that demand reasoning *over* retrieved evidence, not the ones that demand finding it.

## Move 3: The convergence proof

If the memory layer were the bottleneck, then radically different memory designs should produce radically different scores. They do not:

| System | Architecture | LongMemEval-S | Label |
| --- | --- | --- | --- |
| Continuum keyword baseline | keyword + recency, no embeddings | 63.0% | ours, officially scored |
| Zep / Graphiti | temporal knowledge graph | 63.8% (gpt-4o-mini) | vendor, self-reported |
| Continuum token-first engine | distill-at-write, typed records | 55.6% | ours, officially scored |
| Mem0 | write-time distillation + hybrid retrieval | ~49% | third-party comparisons |

A deliberately simple keyword selector and a temporal knowledge graph share essentially no design decisions, yet with the same reader (gpt-4o-mini) they land **0.8 points apart**. The honest field clusters in a 49–64% band regardless of architecture.

Convergence alone is suggestive. What makes it load-bearing is the **positive control** hiding in Zep's own published numbers: with the *same* memory system, swapping the reader from gpt-4o-mini to gpt-4o moved their score from **63.8% to 71.2%** — a **+7.4 point** jump from touching nothing but the reader.

So the field's own data gives us both directions of the experiment:

- **Change the memory architecture, keep the reader:** score moves ~1 point.
- **Keep the memory architecture, change the reader:** score moves ~7 points.

The component whose replacement moves the score is the bottleneck. That component is the reader. When systems that share nothing architecturally converge on the same outcome, the most economical explanation is that the limit lives in the one component they *do* share — and the reader-swap result confirms it directly.

---

## What follows from this

1. **Memory layers cannot engineer past the reader's reasoning ceiling.** Sophistication on the memory side buys efficiency, structure, and auditability — it does not buy answer accuracy the reader cannot produce. Our own experience is the proof: our more sophisticated token-first engine scored *lower* (55.6% vs 63.0%) than our simple baseline, because extra machinery at the memory layer cannot recover points that are lost at the reading step, while its own compression can lose a few more.

2. **The accuracy ceiling rises when the reader improves, not when the memory gets more sophisticated.** Zep's +7.4-point reader swap is the cleanest published demonstration. As frontier readers improve, every honest memory system's benchmark score should rise together — and the ranking between them should barely change.

3. **The real differentiation on the memory layer is therefore not recall score.** It is retrieval quality per token, cost, data ownership, and auditability — the axes where designs genuinely separate. Our token-first engine reaches its score at ~26× fewer prompt tokens per query than the baseline ([benchmarks.md §3](./benchmarks.md#3-internal-numbers-the-bigger-picture)). Accuracy plateaus; token spend does not.

## The limits of this claim

We publish this as a thesis, not a theorem, and the boundaries matter:

- **Retrieval misses are real and they are ours.** 12.55% of questions did not get complete evidence in the top-10. Those are genuine memory-layer failures, and they account for up to one-third of our errors. The claim is that the reader is the *dominant, shared* bottleneck — not that retrieval is solved.
- **Memory design still matters within the band.** Our own two builds differ by 7.4 points (63.0% vs 55.6%). Our distillation engine lost real information at write time — a genuine memory failure mode we have documented rather than hidden. Design choices move you *within* the band; they have not been shown to move anyone *out* of it.
- **The reader-share estimate is a lower bound in one direction only.** We attribute failures conservatively toward retrieval; the reader's true share of errors is likely higher than two-thirds, but we only claim the bound the arithmetic supports.
- **Scope is this benchmark family and this reader class.** The evidence is LongMemEval-S (with corroborating pattern on LoCoMo) using gpt-4o-mini. A materially stronger reader raises the ceiling — that is the thesis's own prediction — and could also change the error composition.
- **Our numbers are officially scored but self-reported.** We ran the benchmarks' own official scorers and retain the logs, but no third party has independently reproduced our runs yet. We hold our numbers to the same standard we hold everyone else's ([benchmarks.md](./benchmarks.md#how-to-read-the-labels)).

## Conclusion

Our memory system delivered complete evidence for ~87% of questions. The reader converted that into correct answers 63% of the time. A completely different architecture with the same reader landed at the same score; the same architecture with a better reader broke through it. The ceiling belongs to the reader.

That is why we stopped chasing the recall number, and why every claim we publish pairs accuracy with token cost: the memory layer's honest competition is efficiency, ownership, and auditability — and the day the ceiling moves, it will be because the readers got better, for everyone at once.

---

## Provenance

- Retrieval diagnostic: session-level `recall_all@10 = 0.8745` (also `recall_all@5 = 0.7702`), official LongMemEval `print_retrieval_metrics.py`, keyword-baseline selector, session ranking, run of 2026-07-18 — the same run chain that produced the 63.0% QA score. Turn-level ranking scores lower (`recall_all@10 = 0.7043`); we cite the session-level figure because the QA run retrieves at session granularity.
- QA scores, per-category tables, token counts, and all external figures with their labels: [docs/benchmarks.md](./benchmarks.md).
- Zep reader-swap figures (63.8% gpt-4o-mini / 71.2% gpt-4o, same memory system) from [their paper](https://arxiv.org/abs/2501.13956) **[vendor, self-reported]**.
- Scorer output logs retained internally; reproducible fixtures are on the [roadmap](./roadmap.md).
