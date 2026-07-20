# Benchmark Results — Internal and External

*Last updated: 2026-07-19. Runs executed 2026-07-18/19 with the official scorers for each benchmark.*

This page reports every benchmark number we have — ours and the field's — with each number labeled by how it was produced. Nothing here is a marketing figure. The purpose of this page is not to claim we win on recall. It is to show that we hold parity with every credible system in the domain, explain why the recall number itself has stopped moving for everyone, and point at where the actual differentiation lives.

**The short version:** two of our systems with completely different architectures, and the field's honest reproduced numbers, all converge near the same recall ceiling (~50–63% on LongMemEval-S). When designs that share nothing architecturally cluster at the same score, the bottleneck is the task, not the build. We stopped chasing that number. We use the benchmark as proof we are not worse than anyone who reports reproducible results — and we compete on the system around the memory, not on the recall score.

---

## How to read the labels

Every number on this page carries one of three tags:

- **[ours, officially scored]** — we ran the benchmark's own official evaluation script on our output. Not yet independently reproduced by a third party, so by our own standard these are self-reported. Scorer output logs are retained.
- **[vendor, self-reported]** — published by the vendor about their own system. Unverified.
- **[independent reproduction]** — a party other than the vendor re-ran the evaluation.

We apply the same skepticism to our numbers that we apply to everyone else's.

---

## 1. The ceiling finding

Three systems, three architectures, one score band:

| System | Architecture | LongMemEval-S | Label |
| --- | --- | --- | --- |
| Continuum keyword baseline | keyword + recency scoring, no embeddings | **63.0%** (315/500) | ours, officially scored |
| Continuum token-first engine | distill-at-write, typed records, compact retrieval | **55.6%** (278/500) | ours, officially scored |
| Zep / Graphiti | temporal knowledge graph | **63.8%** | vendor, self-reported (gpt-4o-mini responder) |
| Mem0 | write-time distillation + hybrid retrieval | **~49%** | independent / third-party comparisons |

A deliberately simple keyword selector, a sophisticated token-first engine, and a temporal knowledge graph share essentially no design decisions — and they all land between roughly 49% and 64% on the same test. Our own two builds bracket the field's honest numbers from both sides.

That convergence is the finding. When radically different systems bottleneck at the same outcome, the remaining errors live in the task itself — ambiguous questions, preference inference, cross-session assembly — not in any one retrieval design. Pushing a system from 63% to 70% on this benchmark is an exercise in overfitting to the test, not in building better memory.

### Why the ceiling exists

Persistent memory is a *forget-then-reason* problem, and it is capped at both ends.

1. **Every system forgets blind.** The full history cannot fit in the model, so every architecture keeps only a slice — chosen *before* the question is known. That is compression under uncertainty: no design (keyword, embeddings, knowledge graph, write-time distillation) can predict which past detail a future question will need. Some question always needs the thing that was dropped.

2. **The two failure modes are a seesaw.** Keep more, and noise and token cost explode. Keep less or distill harder, and you drop the specific detail some questions need — which is exactly how our token-first engine gives up its 7.4 points against the keyword baseline (55.6% vs 63.0%). Every system rides the same accuracy/coverage curve; different builds are just different points on it. That is why they converge instead of separating.

3. **Even perfect retrieval hits a reasoning wall.** Most misses occur with the right context already retrieved — temporal-reasoning and multi-hop questions fail in the responder model, not in the memory layer. Our keyword baseline retrieved the complete evidence set for 87.45% of questions (session `recall_all@10 = 0.8745`, official retrieval scorer) yet answered only 63.0% correctly — so at least two-thirds of its errors happened with everything needed already in the prompt. That part of the ceiling belongs to the model's reasoning limit, and no retrieval design can buy it back. We make this argument in full, with its limits, in [the reader-bottleneck thesis](../blog/thesis-llm-bottleneck.md).

The ~63% band is where those two hard limits — compression under uncertainty on one end, the responder's reasoning ceiling on the other — meet on this task. It is a property of the task's shape, not of anyone's code, which is why the number does not move for anyone. The one axis the ceiling does not cap is cost: accuracy plateaus, token spend does not (see §3). That is why efficiency, and the system around the memory, are where differentiation actually lives.

So we stopped chasing the number. The benchmark's job, for us, is to establish a floor: we are not worse than anyone credible who took the official test.

## 2. Official external numbers (the parity proof)

### LongMemEval-S (500 questions, official `evaluate_qa.py`, gpt-4o-mini judge)

| System | Score | Label |
| --- | --- | --- |
| Continuum keyword baseline | 63.0% | ours, officially scored |
| Zep / Graphiti | 63.8% (gpt-4o-mini) / 71.2% (gpt-4o) | vendor, self-reported |
| Continuum token-first engine | 55.6% | ours, officially scored |
| Mem0 | ~49% | third-party comparisons |

Note the responder model matters: our runs use gpt-4o-mini end to end. Zep's 63.8% is their gpt-4o-mini figure; their 71.2% uses gpt-4o, which is not comparable to our runs.

### Why we don't compare against 90%+ headlines

Vendor marketing in this domain regularly circulates recall figures above 90%. To our knowledge, none have survived independent reproduction. The clearest documented case:

- Zep publicized **84%** on LoCoMo **[vendor, self-reported]**.
- An independent correction ([getzep/zep-papers#5](https://github.com/getzep/zep-papers/issues/5)) found the adversarial category had been included in the numerator but excluded from the denominator; re-running the corrected pipeline over ten seeds produced **58.44% ± 0.20** **[independent reproduction]**.
- Zep rebutted, claiming misconfiguration, and now states **75.14%** **[vendor, self-reported]**.

We take no side in that dispute. We cite it because it is the domain's best evidence that self-reported headline numbers routinely shed 25+ points under independent scrutiny — which is exactly why every number of ours on this page is labeled, scored with the official scripts, and stated with its weaknesses attached.

**The parity claim, stated precisely:** among systems with honest, reproducible LongMemEval numbers, everyone — including us — sits in the same band. We are not worse than anyone credible. We do not claim to be better.

## 3. Internal numbers (the bigger picture)

We maintain two builds and report both, including where the sophisticated one loses.

### LongMemEval-S, per category [ours, officially scored]

| Category | Keyword baseline | Token-first engine |
| --- | --- | --- |
| single-session-user | 90.0% | 84.3% |
| knowledge-update | 79.5% | 70.5% |
| single-session-assistant | 76.8% | 62.5% |
| temporal-reasoning | 54.1% | 56.4% |
| multi-session | 53.4% | 34.6% |
| single-session-preference | 13.3% | 26.7% |
| **Overall** | **63.0%** | **55.6%** |

### LoCoMo [ours, officially scored]

| Scope | Keyword baseline | Token-first engine |
| --- | --- | --- |
| Overall incl. adversarial (cat 5) | 43.4% | — (cat 5 not run) |
| Categories 1–4 only (identical subset) | 32.5% | 39.4% |

Keyword baseline per category: single-hop 13.8%, temporal 28.8%, multi-hop 13.6%, open-domain 42.4%, adversarial 81.2%. The adversarial category rewards saying "I don't know" and inflates overall scores — this is the same category at the center of the Zep/Mem0 dispute above, so we report the cat 1–4 subset separately for honest comparison.

### Retrieval diagnostic [ours, officially scored]

Scored with the official LongMemEval retrieval script (`print_retrieval_metrics.py`) on the keyword-baseline run chain (session ranking):

| Metric | Score |
| --- | --- |
| `recall_all@5` | 0.7702 |
| `recall_all@10` | 0.8745 |
| `ndcg_any@10` | 0.7184 |

`recall_all@10` is the strict criterion: *every* evidence session the benchmark requires was present in the top-10 retrieved — the same top-10 the QA run sends to the responder. The gap between 87.45% evidence-complete and 63.0% answer-correct is the subject of [the reader-bottleneck thesis](../blog/thesis-llm-bottleneck.md).

### Token cost — where the engine actually wins

Measured from the generation logs of the two LongMemEval-S runs (500 questions each, same responder):

| Build | Total prompt tokens | Avg per query | Recall |
| --- | --- | --- | --- |
| Keyword baseline (top-10 sessions) | 14,826,438 | ~29,700 | 63.0% |
| Token-first engine | 565,102 | ~1,130 | 55.6% |

The token-first engine answers with **~26× fewer prompt tokens** (median retrieved-context payload ~6.7k characters) at a cost of 7.4 points of recall. It also degrades more gracefully where it matters: it is *better* on temporal reasoning, preference questions, and the comparable LoCoMo subset, and worse mainly on multi-session assembly, which inherently rewards sending more context.

Stated plainly: **the sophisticated engine is cheaper and slightly worse on recall, and the simple baseline is our shipping recall number.** We are not hiding the regression — it is the trade we chose, because a memory system that runs on ~1.1k tokens per query is deployable in places a 30k-token-per-query system is not. The internal story is token efficiency, not a higher recall score.

## 4. What this means for the system

If recall is a domain plateau that every honest system shares, then recall is not where a memory product differentiates. The benchmark is a floor we have cleared, not our pitch.

What the plateau leaves as the actual competition:

- **Owned memory** — your project facts live in plain, inspectable JSON on your infrastructure, not inside a vendor's opaque store.
- **Model-agnostic** — the context shard is a portable payload; swap the model, keep the memory. Two completely different responder architectures hitting the same ceiling is also evidence the memory layer, not the model, is the right place for persistence.
- **Token efficiency** — parity recall at a fraction of the context spend, which is the difference between a memory system you can afford to call on every turn and one you can't.
- **Auditability** — every retrieval is a reviewable artifact, which is the same property that lets us publish scorer logs instead of headlines.

We will keep running the official benchmarks as regression floors, and we will update this page when the numbers change — in either direction.

---

## Provenance

- LongMemEval-S runs scored with the benchmark's official `evaluate_qa.py`, gpt-4o-mini judge, 500 questions, 2026-07-18 (keyword baseline) and 2026-07-19 (token-first engine). Retrieval diagnostics scored with the benchmark's official `print_retrieval_metrics.py` on the same run chain. LoCoMo scored with its official QA scoring, gpt-4o-mini judge.
- Token counts are the scorer/generation pipeline's own totals, not estimates.
- External figures: Zep LongMemEval from [their paper](https://arxiv.org/abs/2501.13956); LoCoMo dispute from [getzep/zep-papers#5](https://github.com/getzep/zep-papers/issues/5) and Zep's [rebuttal post](https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/); Mem0 LongMemEval figure from third-party comparisons. All external figures carry their labels above and should be treated with the same skepticism we invite toward ours.
- Our raw scorer output logs are retained internally. Publishing the full evaluation harness as reproducible fixtures is on the [roadmap](./roadmap.md).
