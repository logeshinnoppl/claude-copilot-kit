# Coding Standards

These standards apply to every change Claude makes, regardless of language or framework. They exist to keep AI-generated code indistinguishable in quality from the team's own hand-written code, and to stop the "prompt loop" pattern (repeated fixes because the first pass ignored project conventions).

## 1. Match the existing codebase first

- Before writing new code, read at least one existing file of the same kind (component, service, test, migration) in this repo and mirror its structure, naming, and idioms.
- Never introduce a new library, pattern, or architectural style to solve a problem the codebase already has a convention for. If an existing convention seems wrong, flag it to the developer instead of silently deviating.
- Match the project's existing formatting/linting configuration exactly (indentation, quote style, import order). Do not reformat unrelated code.

## 2. Scope discipline

- Touch only the files required to satisfy the acceptance criteria for the current task. Do not perform opportunistic refactors, renames, or "drive-by" cleanups in the same change.
- If a real defect or risk is spotted outside the current scope, note it in the plan/PR description rather than fixing it inline.
- Implement one planned task at a time (see `plan-feature` skill) and validate before moving to the next.

## 3. Naming and readability

- Names must describe intent, not implementation (`retryCount`, not `i2`).
- Functions do one thing; if a function needs "and" to describe it, split it.
- Prefer explicit code over clever code. Optimize for the next reader, not for fewest characters.
- Public functions, classes, and modules get a short doc comment describing purpose, inputs, outputs, and side effects — following whatever doc-comment convention the language/repo already uses (JSDoc, docstrings, XML doc comments, etc.).

## 4. Error handling

- Never silently swallow an error (empty catch blocks, ignored return codes). Either handle it meaningfully or propagate it with context.
- Fail fast and loud in development; fail safe and logged in production paths.
- User-facing errors must be actionable; internal errors must be diagnosable (include enough context to trace back to the failing operation).

## 5. Dependencies

- Do not add a new third-party dependency to solve something the standard library or an already-installed dependency can do.
- If a new dependency is genuinely needed, state why in the plan before adding it, and check it's actively maintained and license-compatible.
- Never upgrade or downgrade unrelated dependencies as a side effect of a task.

## 6. Comments and documentation

- Comment the "why," not the "what" — code should be self-explanatory for the "what."
- Update existing comments/docs/README sections that your change makes inaccurate. Stale docs are a defect.
- Do not leave TODO comments unless they're tied to a tracked ticket ID.

## 7. Committing structure

- Keep changes structured so a diff maps cleanly to the acceptance criteria — a reviewer should be able to check off each AC against a specific hunk of the diff.
- Do not mix generated/build artifacts, lockfile churn unrelated to the task, or IDE config changes into the commit unless the task specifically requires it.

## 8. Consistency over personal preference

- If this file and the repo's own linter/formatter config disagree, the repo's tooling config wins — treat that as a signal to update this file, not to override the tool.
- When in doubt between two valid approaches, pick the one already used more often in this codebase.

## When this rule conflicts with a skill or subagent instruction

Skill- or subagent-specific instructions may narrow these standards for a specific workflow step (e.g., stricter typing during `plan-feature`). They may not override sections 2 (scope discipline), 4 (error handling), or 5 (dependencies) without explicit developer approval recorded in the plan.
