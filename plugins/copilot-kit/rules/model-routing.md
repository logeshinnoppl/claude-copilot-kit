# Model & Token Routing

> **Advisory, not enforced.** Claude Code skills cannot switch the session model by themselves. This rule produces a *recommendation* (tier + score) that the developer applies with `/model`; subagents can pin a model in their own frontmatter. Token budgets are likewise soft guidance plus the stop/re-plan rule — nothing hard-caps usage. Measured usage is available from the kit's usage report.

Purpose: stop defaulting to the largest/most expensive model for every task, and stop unbounded re-prompting from burning tokens. This rule governs both which model tier a task should use, and when to stop and re-plan instead of continuing to iterate.

## 1. Complexity scoring (1–10)

Score every ticket/task before implementation starts (the `requirement-analyzer` skill does this automatically as part of Gate 1). Score upward for each factor present:

- Number of files/modules affected (single file = low, cross-module = higher)
- Security-sensitive surface (auth, payments, PII, access control)
- Database schema or API contract changes
- Root cause is unknown/requires investigation, not just implementation
- Depth of business logic involved (simple CRUD vs. multi-step domain rules)
- Cross-service or cross-repo dependency

| Score | Tier | Examples |
|---|---|---|
| 1–3 | Small | Copy/text change, CSS/style tweak, simple isolated bug fix, single small test |
| 4–6 | Medium | New component/module, API wiring, multi-file feature within one service |
| 7–10 | Large | Architecture change, security-sensitive work, complex/unclear-root-cause debugging, cross-service changes |

## 2. Routing policy

- Small (1–3): use the fastest/cheapest available model. Do not escalate to a larger model just because it's available.
- Medium (4–6): use the mid-tier model by default. Escalate to large only if a medium-tier attempt genuinely stalls (see stop condition below), not preemptively.
- Large (7–10): use the largest available model. For anything touching security, auth, payments, or a schema migration, treat it as Large regardless of file count.
- When in doubt between two tiers, pick the lower one and let the stop/re-plan mechanism (below) escalate if needed — this is cheaper than over-provisioning by default.

## 3. Token budget and stop condition

- Set a soft token/turn budget per ticket before starting (a rough guide: Small ≈ a few turns, Medium ≈ a dozen or so, Large ≈ set explicitly with the developer up front); you can check actuals with `node ${CLAUDE_PLUGIN_ROOT}/scripts/usage-report.js`.
- If usage exceeds the budget without reaching a validated stopping point (tests passing, plan step complete):
  1. **Stop** generating more changes.
  2. **Summarize** what's been tried, what worked, what didn't, and the current diff state.
  3. **Re-plan** with a fresh, condensed context (the summary, not the full prior transcript) — this is the same mechanism as `/compact` or starting a new planning pass with the summary as input.
  4. **Continue** with the fresh context, escalating model tier one level if the stall looks complexity-related rather than prompt-quality-related.
- Never silently keep looping on the same failing approach across many turns — repeated failure with no new information is a signal to stop and re-plan, not to keep retrying.

## 4. Signals that indicate a mis-routed task

- Retry ratio (follow-up corrections ÷ first prompt) is high → the ticket or prompt quality is the problem, not the model — fix the requirement/prompt template, don't just jump to a bigger model.
- Small tasks resolved in one shot on a large model → the routing policy is being ignored; enforce it.
- A task keeps stalling even after escalation → the task is probably underspecified; route back to `requirement-analyzer`/`plan-feature` for re-scoping rather than continuing to spend tokens.

## 5. Reporting

Every completed task should be able to answer, in the PR description or task log: which model tier was used, the complexity score that justified it, and the retry count. This feeds the AI usage dashboard (cost per feature, model mix, retry ratio) described in the delivery plan.
