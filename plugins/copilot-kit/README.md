# copilot-kit (Claude Code plugin)

Governed lifecycle for AI-assisted delivery: **Requirement gate → Plan → Implement + validate → Playwright → Review → PR with evidence.** Language-agnostic; Jira optional.

## Install
Team marketplace (recommended): `/plugin marketplace add <your-git-url-or-path>` then `/plugin install copilot-kit@thecommerceshop-tools`.
Try locally: `claude --plugin-dir /path/to/copilot-kit`.
Per-project auto-install: add to `.claude/settings.json` → `extraKnownMarketplaces` and `enabledPlugins` (see the repo README).
Then in each repo run **`/copilot-kit:setup-project`** once and commit `.copilot-kit.json`.

## Daily flow
1. `/copilot-kit:requirement-analyzer PROJ-123` (Jira) — or `/copilot-kit:requirement-intake <rough idea>` (no Jira) then the analyzer.
2. `/copilot-kit:plan-feature` → approve the plan.
3. Implement task by task; `/copilot-kit:run-tests-fix` after each (or delegate to `test-fix-agent`).
4. UI work: `/copilot-kit:playwright-tester`.
5. `/copilot-kit:code-review` (or `review-agent`), then `/copilot-kit:create-pr`.

## Jira vs no-Jira
`.copilot-kit.json` → `"tracker": "jira" | "none"`. Both paths enforce the same 12-point gate and "what counts as present" quality bar (`rules/requirement-quality-gate.md`). No-Jira briefs use `templates/requirement-brief.md`, get a `LOCAL-<date>-<slug>` reference, and require explicit developer confirmation. If Jira is configured but unreachable, the analyzer offers pasted text (marked unverified) or intake.

## What is enforced vs advisory
- **Hooks (deterministic):** secret-file and destructive-command guard (deny/ask tiers), optional post-edit lint/typecheck, usage logging.
- **Instructions (model-followed):** the rules, gate, evidence requirements. Skills are not sandboxed; `allowed-tools` only pre-approves tools, read-only skills use `disallowed-tools`.
- **Advisory:** model routing and token budgets (plugins can't switch models; use `/model`).
- The guard is a backstop for common mistakes, not a security boundary. Combine with org permission settings.

## Usage report
Stop hook records per-session token usage by model (no prompt text) to `$CLAUDE_PLUGIN_DATA/usage.jsonl` (default `~/.claude/copilot-kit/`). Report: `node <plugin>/scripts/usage-report.js --by ticket|branch|project|model`. Ticket is inferred from the git branch name. Disable with `COPILOT_KIT_USAGE_LOG=off`.

## Prerequisites
Node 18+, git, and for UI tests `@playwright/test` + browsers in the target repo.

## Develop
`node scripts/test-guard.js` runs the guard fixtures. `claude plugin validate .` validates the manifest.
