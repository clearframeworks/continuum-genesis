# Thesis: The Reader Is the Bottleneck

**Looking for source code, tests, or reproduction commands?** This is a position paper,
not the implementation entry point. Start with the runnable repo surface:
[README](../../README.md), [reproduce locally](../../docs/reproduce.md), source in
`packages/`, tests in `tests/`, and the local harness in
`scripts/evaluate-memory-lift.mjs`.

*Position paper, 2026-07-19. All numbers interpreted here are published, with provenance labels, in [docs/benchmarks.md](../../docs/benchmarks.md). This document adds no new measurements — it argues what the existing ones mean.*

**Claim: on standard long-memory benchmarks, the measured accuracy ceiling is primarily a limitation of the responder LLM — the "reader" that must answer from retrieved evidence — not of the memory or retrieval layer.**

Stated precisely: given current-generation readers (our runs use gpt-4o-mini end to end), most wrong answers occur *after* the memory system has already done its job. The evidence for this is arithmetic, not interpretive. Its spine is our own runs, scored with the benchmarks' official scorers; published numbers from other parties enter this document only as independent corroboration from outside our lab.

The claim is bounded. It is not "memory never matters" — the [limits section](#the-limits-of-this-claim) quantifies exactly how much of the failure is still the memory's fault, including in our own builds.

## What counts as evidence here

This paper weighs only benchmark scores produced by the benchmark's *own official scorer* and reproducible by anyone who runs it. That standard is the argument's foundation, so it cuts three ways — including against us:

- **Self-reported numbers on private harnesses do not count.** The persistent-memory field is full of impressive scores posted on custom pipelines. We treat every one of them — including the ones that would flatter us — as unverified until reproduced on the standard. Anyone can post a high number on a harness they built. Our own "~26× fewer tokens" efficiency figure sits in exactly this bucket: it is our measurement on our setup, labeled as such, not a standardized result.
- **When the standard is cheap, avoiding it is a signal.** LongMemEval-S runs on the public scorer for a few dollars. A group with a genuine result runs that cheap standard and posts the official number. Reporting a private, custom number instead is not proof of anything — but it is an unexplained avoidance of the one comparable measurement, and an unverified figure carries no weight against a score actually earned on the standard.
- **You cannot compare a test you took to a test you didn't.** Our 63.0% is an official `evaluate_qa.py` score; it is not comparable to a vendor's blog number from a different harness, in either direction. So this paper's spine is deliberately narrow: results we ran ourselves on the official scorer.

This is a rule about *proof*, not *deletion*. Third-party numbers that land beside our official scores — Zep's self-reported 63.8% next to our 63.0%, for instance — we keep and cite as labeled corroboration: they show we are not an outlier in the field. What we refuse is to treat any unverified number as decisive in either direction — not a rival's 90% as a threat, and not as a trophy.

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

This arithmetic bound is the thesis's primary evidence. It is ours, it is officially scored, and it is the most direct form the evidence can take: it does not compare systems or infer from component swaps — it shows the reader failing with the complete evidence already in its hands.

The per-category pattern in [benchmarks.md §3](../../docs/benchmarks.md#3-internal-numbers-the-bigger-picture) says the same thing from a different angle: the categories that fail hardest — temporal reasoning (54.1%), multi-session assembly (53.4%), preference inference (13.3%) — are precisely the ones that demand reasoning *over* retrieved evidence, not the ones that demand finding it.

## Move 3: The convergence proof

If the memory layer were the bottleneck, then radically different memory designs should produce radically different scores. They do not:

| System | Architecture | LongMemEval-S | Label |
| --- | --- | --- | --- |
| Continuum keyword baseline | keyword + recency, no embeddings | 63.0% | ours, officially scored |
| Zep / Graphiti | temporal knowledge graph | 63.8% (gpt-4o-mini) | vendor, self-reported |
| Continuum token-first engine | distill-at-write, typed records | 55.6% | ours, officially scored |
| Mem0 | write-time distillation + hybrid retrieval | ~49% | third-party comparisons |

A deliberately simple keyword selector and a temporal knowledge graph share essentially no design decisions, yet with the same reader (gpt-4o-mini) they land **0.8 points apart**. The honest field clusters in a 49–64% band regardless of architecture.

We contribute the higher-integrity half of that convergence: our 63.0% is officially scored with the benchmark's own scorer; Zep's 63.8% is vendor self-reported. Where the two lenses agree, ours is the one carrying the receipts — this convergence is our finding, corroborated from outside, not an external finding we are borrowing.

And the strongest, most admissible version of this convergence is entirely in-house, on tests we ran ourselves — so it survives the evidentiary standard above without leaning on anyone's self-reported number. Beyond the two builds above, we put a full ladder of memory-side variants through the official scorer, all at the same gpt-4o-mini reader:

| Our variant (all official `evaluate_qa.py`, gpt-4o-mini, 500 Q) | LongMemEval-S |
| --- | --- |
| Hybrid keyword + preference selector | 63.2% |
| Keyword baseline | 63.0% |
| Global-context variant | 62.8% |
| Chain-of-thought reader prompt | 55.8% |
| Token-first distillation engine | 55.6% |
| Earlier global-context variants | 54.2–54.8% |

Seven variants, one lab, one official scorer. The best memory-side design we built **tied** the simple baseline (63.2% vs 63.0%); nothing exceeded it, and most of the added sophistication scored *lower*. This is the convergence claim in its cleanest form — carried by our own officially-scored attempts to beat the baseline, none of which did — and the field's self-reported numbers above (Zep at 63.8%, the honest cluster in the 49–64% range) land in exactly the same place, corroborating from outside that we are not an outlier. Within a single lab, on the axis the memory controls, effort failed to move the number.

When systems that share nothing architecturally converge on the same outcome, the most economical explanation is that the limit lives in the one component they *do* share: the reader.

### The outside lens: the reverse experiment

Everything above holds the reader fixed and varies the memory. Independently — a different party, a different memory architecture, numbers we did not produce — the *reverse* experiment has been published. Zep held their memory system fixed and changed only the reader, from gpt-4o-mini to gpt-4o, and their score moved from **63.8% to 71.2%** — a **+7.4 point** jump from touching nothing but the reader. **[vendor, self-reported]**

We did not run a reader swap ourselves; that result is Zep's, and we cite it with credit. Its value here is precisely that it is not ours: an outside lens, on a system we do not control, landing exactly where our finding predicts. Taken together:

- **Change the memory architecture, keep the reader:** score moves ~1 point *(our data, officially scored, against theirs)*.
- **Keep the memory architecture, change the reader:** score moves ~7 points *(their data, self-reported)*.

The component whose replacement moves the score is the bottleneck. That component is the reader. Our arithmetic bound (Move 2) shows it from the inside; the reader-swap corroborates it from the outside.

## What persistence actually is

The three moves establish a fact about components. This section states its consequence.

**The memory layer never produces the answer.** In every system measured here — ours, Zep's, Mem0's — the final artifact is generated by the reader LLM. The memory's entire contribution ends the moment the evidence enters the prompt. This is implicit throughout the thesis; it deserves to be explicit, because it changes what a memory layer can honestly be held to.

If the artifact always belongs to the reader, then the honest question for a memory layer is not *"did the system answer correctly?"* but *"did the memory deliver better evidence than the alternative — cheaper and faster?"* And the baseline alternative is the reader's own native option: put the entire raw history in the context window and let the reader fend for itself.

Zep's own published results stage this contest directly, with the same reader on both sides:

| What answers from (reader: gpt-4o-mini) | LongMemEval | Label |
| --- | --- | --- |
| Full raw history in context — the reader's own "memory" | 55.4% | vendor, self-reported |
| A memory layer (Zep) selecting evidence | 63.8% | vendor, self-reported |

The memory layer earns its +8.4 points not by reasoning better — it does not reason at all — but by delivering *better-curated* evidence than a raw dump, at a fraction of the tokens. (The same measured gap appears with the stronger reader: 60.2% full-context vs 71.2% with Zep, from the same table — and those full-context rows reproduce Move 3's reader-swap effect on the baseline itself: 55.4% → 60.2% from changing nothing but the reader.)

That is the real persistence contest, and it runs entirely on axes the memory actually controls: evidence quality, token cost, latency, ownership. It is the contest our token-first engine was built for — reaching its accuracy band at **~26× fewer prompt tokens per query** ([benchmarks.md §3](../../docs/benchmarks.md#3-internal-numbers-the-bigger-picture)).

The structural point follows. End-to-end QA accuracy is a real user outcome and worth reporting — we report ours. But it is reader-capped (Moves 1–3), so presenting it as a *memory* metric conflates the reader's reasoning with the memory's retrieval, and optimizing a memory design against a reader-bound number chases a signal the memory cannot move. That conflation is precisely why honest scores cluster in a narrow band regardless of architecture. A memory-honest scorecard keeps the two ledgers separate: **what the memory owns** — evidence quality, tokens, latency, ownership, auditability — and **what the reader owns** — the artifact.

---

## What follows from this

1. **Memory layers cannot engineer past the reader's reasoning ceiling.** Sophistication on the memory side buys efficiency, structure, and auditability — it does not buy answer accuracy the reader cannot produce. Our own experience is the proof: our more sophisticated token-first engine scored *lower* (55.6% vs 63.0%) than our simple baseline, because extra machinery at the memory layer cannot recover points that are lost at the reading step, while its own compression can lose a few more.

2. **The accuracy ceiling rises when the reader improves, not when the memory gets more sophisticated.** Our arithmetic bound is the most direct demonstration — the reader failing with complete evidence in hand — and Zep's +7.4-point reader swap corroborates it from outside our lab. As frontier readers improve, every honest memory system's benchmark score should rise together — and the ranking between them should barely change.

3. **The real differentiation on the memory layer is therefore not recall score.** It is retrieval quality per token, cost, data ownership, and auditability — the axes where designs genuinely separate. Our token-first engine reaches its score at ~26× fewer prompt tokens per query than the baseline ([benchmarks.md §3](../../docs/benchmarks.md#3-internal-numbers-the-bigger-picture)). Accuracy plateaus; token spend does not.

## The limits of this claim

We publish this as a thesis, not a theorem, and the boundaries matter:

- **Retrieval misses are real and they are ours.** 12.55% of questions did not get complete evidence in the top-10. Those are genuine memory-layer failures, and they account for up to one-third of our errors. The claim is that the reader is the *dominant, shared* bottleneck — not that retrieval is solved.
- **Memory design still matters within the band.** Our own two builds differ by 7.4 points (63.0% vs 55.6%). Our distillation engine lost real information at write time — a genuine memory failure mode we have documented rather than hidden. Design choices move you *within* the band; they have not been shown to move anyone *out* of it.
- **The reader-share estimate is a lower bound in one direction only.** We attribute failures conservatively toward retrieval; the reader's true share of errors is likely higher than two-thirds, but we only claim the bound the arithmetic supports.
- **Scope is this benchmark family and this reader class.** The evidence is LongMemEval-S (with corroborating pattern on LoCoMo) using gpt-4o-mini. A materially stronger reader raises the ceiling — that is the thesis's own prediction — and could also change the error composition.
- **Our numbers are officially scored but self-reported.** We ran the benchmarks' own official scorers and retain the logs, but no third party has independently reproduced our runs yet. We hold our numbers to the same standard we hold everyone else's ([benchmarks.md](../../docs/benchmarks.md#how-to-read-the-labels)).
- **The memory-vs-full-context comparison is one measured result, not a law.** The 55.4%/63.8% contest comes from Zep's own paper, and its full-context baseline is likewise vendor self-reported. The +8.4-point gap is what was measured on this benchmark with this reader — we do not claim a memory layer always beats full context, and a raw dump is not the only native-memory strategy a reader can be given (summarization and sliding windows exist, with their own trade-offs).

## Conclusion

Our memory system delivered complete evidence for ~87% of questions. The reader converted that into correct answers 63% of the time. Those two numbers — both ours, both officially scored — are the thesis. A completely different architecture with the same reader landed at the same score, and an outside party's published reader swap — their experiment, not ours — broke through the ceiling by changing nothing but the reader: independent corroboration, from a lens we do not control, of a finding we measured ourselves. The ceiling belongs to the reader.

That is why we stopped chasing the recall number, and why every claim we publish pairs accuracy with token cost: the memory layer's honest competition is efficiency, ownership, and auditability — and the day the ceiling moves, it will be because the readers got better, for everyone at once.

---

## Provenance

- Retrieval diagnostic: session-level `recall_all@10 = 0.8745` (also `recall_all@5 = 0.7702`), official LongMemEval `print_retrieval_metrics.py`, keyword-baseline selector, session ranking, run of 2026-07-18 — the same run chain that produced the 63.0% QA score. Turn-level ranking scores lower (`recall_all@10 = 0.7043`); we cite the session-level figure because the QA run retrieves at session granularity.
- QA scores, per-category tables, token counts, and all external figures with their labels: [docs/benchmarks.md](../../docs/benchmarks.md).
- Zep reader-swap figures (63.8% gpt-4o-mini / 71.2% gpt-4o, same memory system) and full-context baseline figures (55.4% gpt-4o-mini / 60.2% gpt-4o) from Table 2 of [their paper](https://arxiv.org/abs/2501.13956) **[vendor, self-reported]** — verified against the published table before citing.
- Scorer output logs retained internally; reproducible fixtures are on the [roadmap](../../docs/roadmap.md).
