---
name: plan-feature
description: Turns a READY requirement into a bounded, reviewable implementation plan (analyze, inspect, plan) before any code is written; pauses for developer approval when scope is unclear or complexity is Large. Use after requirement-analyzer returns READY FOR PLANNING.
argument-hint: "[ticket key or brief ref]"
disallowed-tools: Edit, Write
---

# Plan Feature

## Preconditions
`requirement-analyzer` returned READY (or the developer explicitly waived remaining gaps — record the waiver). Known: complexity score and tier.

## Procedure
1. **Analyze** — restate goal and ACs in your own words.
2. **Inspect** — read only the affected files; note existing patterns (`${CLAUDE_PLUGIN_ROOT}/rules/coding-standards.md`).
3. **Surface unknowns** found during inspection now, not mid-implementation. If the requirement's premise is wrong (component doesn't exist), say so.
4. **Plan** — ordered, independently testable tasks; for each: files, approach, validating test(s). Flag tasks needing a new dependency, schema change, or security-sensitive code — these need explicit approval.
5. **Pause for approval** if scope is ambiguous, a repo convention must be deviated from, or complexity is Large. Otherwise state the plan up front and proceed task by task.

## Output format
```markdown
## Implementation Plan — <KEY/ref>
### Understanding
### Approach
### Tasks
1. **<task>** — files: <paths> — validates: <AC/test>
### Needs explicit approval before proceeding
### Test plan (test — covers AC)
### Model tier: <Small|Medium|Large> (score N/10, advisory)
```

## Completion
Every AC maps to ≥1 task and ≥1 test; no task silently expands scope. Then implement one task at a time with `run-tests-fix` after each.
