---
name: code-review
description: Runs an adversarial AI review of the diff against project rules (coding, security, testing) and the acceptance criteria; produces severity-tagged findings and a READY FOR PR / NEEDS FIXES verdict. Use after run-tests-fix is green and before create-pr.
argument-hint: "[base branch, default from .copilot-kit.json baseBranch]"
disallowed-tools: Edit, Write
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*)
---

# Code Review

Read-only. Review the diff cold, as if it were someone else's PR.

## Procedure
1. `git diff <base>...HEAD` (base from `.copilot-kit.json` `baseBranch`, else ask) and `git status`. Read surrounding code/tests when a hunk isn't enough.
2. Check separately against `${CLAUDE_PLUGIN_ROOT}/rules/coding-standards.md`, `security-rules.md`, `testing-standards.md`.
3. For each acceptance criterion, cite the lines that satisfy it; flag ACs with no change and changes with no AC (unexplained scope).
4. Severity: **Critical** (vulnerability, data loss, breaks prod) · **High** (functional bug, AC unmet, missing error handling on a real path) · **Medium** (convention violation, missing edge-case test) · **Low** (nit).
5. Check that validation evidence exists from this session (run-tests-fix output). If absent, that is a High finding.
6. Zero findings is allowed but must be stated with what you checked. Do not soften findings.

## Output format
```markdown
## AI Code Review — <KEY/ref>
### Acceptance criteria coverage
- AC1 → file:line ✅ / MISSING
### Findings
| Severity | File:Line | Finding | Suggested fix |
### Summary
Critical: N, High: N, Medium: N, Low: N
### Verdict: READY FOR PR | NEEDS FIXES
```
READY FOR PR requires zero Critical/High **and zero Medium** (fix them or have the developer explicitly accept each one, recorded in the output); otherwise the verdict is NEEDS FIXES. For Large changes prefer the `review-agent` subagent (separate context).
