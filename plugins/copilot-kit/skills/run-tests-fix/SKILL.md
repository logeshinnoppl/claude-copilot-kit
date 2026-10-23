---
name: run-tests-fix
description: Runs the full local validation sequence (lint, typecheck, unit tests, build, e2e smoke) using the project's configured commands and iterates on failures until green or a clear diagnosis. Use after implementing a planned task, before the next task or a PR.
argument-hint: "[task description]"
---

# Run Tests & Fix

## Commands
Get the commands from `.copilot-kit.json` (`commands.lint|typecheck|test|build|e2e`); if absent they may be inferred from `package.json` scripts. If a command cannot be determined, ask the developer — never invent one. A step that truly doesn't apply is recorded `N/A (reason)`.

## Procedure
Run in order (`${CLAUDE_PLUGIN_ROOT}/rules/testing-standards.md` §4), stopping at the first failure, fixing, and resuming from that step:
1. Lint (auto-fix where the linter supports it)
2. Typecheck
3. Unit tests (at least affected; full suite if reasonably fast)
4. Build
5. E2E smoke (for a touched UI flow with no scenario yet, run `playwright-tester` first; this skill only runs the existing suite)

Every step is a real command execution whose exit code you observed in this run. "Passed" never means "should pass".

## Failure handling
- Diagnose root cause before editing. Never weaken/delete a test just to get green; a failing test may be catching a real bug.
- Fix needing out-of-scope changes → ask first (coding-standards §2).
- Same step fails 3 times without a new diagnosis → stop, summarise attempts, re-plan (model-routing §3).

## Output format
```markdown
## Validation Run — <task>
| Check | Command run | Exit | Result | Notes |
|---|---|---|---|---|
### Fixes applied
### Status: ALL GREEN | BLOCKED — <reason>
```
ALL GREEN requires every applicable check to show exit 0 from this run. The table feeds the PR's validation evidence.
