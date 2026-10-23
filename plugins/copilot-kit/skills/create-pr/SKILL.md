---
name: create-pr
description: Commits the change, pushes the branch and opens a pull request with validation evidence and the AI review summary, using the project's git host (Bitbucket, GitHub, GitLab) via MCP or CLI. Use after code-review returns READY FOR PR.
argument-hint: "[ticket key or brief ref]"
disable-model-invocation: true
---

# Create PR

Manual-only (`/copilot-kit:create-pr`) because it pushes and publishes.

## Preconditions (verify, don't assume)
- `code-review` verdict READY FOR PR with zero unresolved Critical/High.
- `run-tests-fix` ALL GREEN from this session.
- Working tree holds only this task's changes (coding-standards §7).
- Not on the base branch. If on it, create a feature branch named `<type>/<KEY-or-LOCAL-ref>-<slug>` first.

## Procedure
1. `git status` / `git diff`: look for debug output, commented-out code, unrelated churn, lockfile noise, and secrets. Stop if found.
2. Commit (imperative mood, includes the ticket/ref ID, says why). Stage specific files, never blindly everything.
3. Push the feature branch. Never force-push; never push to the base branch.
4. Open the PR with `${CLAUDE_PLUGIN_ROOT}/templates/pr-template.md` filled with **real** data. Method: a connected Bitbucket/GitHub/GitLab MCP tool if one is available in this session; otherwise the host's CLI (`gh pr create`, `glab mr create`, `bb`/REST via the developer's own tooling) per `.copilot-kit.json` `prHost`; if neither exists, print the filled description and the branch name for the developer to open manually and say so. Do not claim a PR was opened without a returned URL.
5. Link the ticket: Jira key in title/description (Jira mode) or the `LOCAL-` ref plus the brief path (no-Jira mode).
6. Report the PR URL and, if CI status is retrievable, its actual state — never assume it passes.

## Rules
- A validation row is filled only from a command you ran this session; otherwise write "not run".
- Review counts must match the actual code-review output.
- Unresolved Medium/Low findings go under follow-ups with a rationale.
- Never merge, delete branches, or approve the PR.
