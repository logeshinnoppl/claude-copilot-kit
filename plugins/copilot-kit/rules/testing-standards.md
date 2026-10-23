# Testing Standards

Testing expectations are language-agnostic. Adapt the exact commands to the repo's actual test runner (see the "Repo-specific commands" block at the bottom, which each project fills in once).

## 1. What must be tested

- Every acceptance criterion in the source ticket maps to at least one test (unit, integration, or end-to-end) — no AC ships untested.
- New business logic gets unit tests for: the happy path, each documented edge case, and at least one failure/error path.
- Bug fixes get a regression test that fails without the fix and passes with it, added *before* the fix if practical.
- Public API contracts (REST/GraphQL endpoints, exported functions/classes, CLI commands) get contract-level tests independent of internal implementation details.
- UI changes affecting a user-facing flow get a Playwright scenario derived from the acceptance criteria (see `playwright-tester` skill) — not just a unit test of the component in isolation.

## 2. What NOT to test

- Do not test third-party library internals or language built-ins.
- Do not write tests that assert on implementation details (private state, internal call order) when a behavioral assertion would do — these break on safe refactors and provide false confidence.
- Do not duplicate the same assertion across unit, integration, and e2e layers "for safety" — pick the lowest layer that can actually catch the regression.

## 3. Test quality bar

- Tests must be deterministic: no reliance on real wall-clock time, real network calls, unseeded randomness, or test execution order.
- Each test asserts one behavior. Prefer several small, clearly named tests over one large test with many assertions.
- Test names describe the scenario and expected outcome (e.g. `returns 409 when the SKU already exists`), not the mechanism (`test1`, `worksCorrectly`).
- Mocks/stubs are scoped to the test that needs them and torn down afterward; no shared mutable test state leaks between tests.

## 4. Validation sequence (must pass, in order, before a PR is opened)

1. Lint
2. Typecheck (if the language has one)
3. Unit tests (affected + full suite if fast enough; affected-only with a note if the full suite is slow)
4. Build
5. Playwright smoke / e2e tests for touched flows

A task is not "done" until all five pass locally. See the `run-tests-fix` skill for the automated loop. Projects can opt in to an automatic lint/typecheck run after every edit with `"postEditCheck": true` in `.copilot-kit.json`.

## 5. Coverage expectations

- New code should not lower overall coverage. If the repo enforces a coverage threshold in CI, treat a drop below it as a build failure to fix before opening a PR, not something to note and move on from.
- 100% coverage is not the goal — meaningful coverage of behavior is. Do not write vacuous tests purely to hit a number.

## 6. Manual/QA scope

- Automated checks (lint, typecheck, unit, build, Playwright smoke) are Claude's responsibility and must be green before human review.
- Manual QA is reserved for business judgment and edge cases automation can't reasonably express — it should never be the first line of defense for a defect a unit or smoke test could have caught.

## Repo-specific commands

Commands come from the project's `.copilot-kit.json` (`commands.lint|typecheck|test|build|e2e`), created by `/copilot-kit:setup-project`. If a command is not configured, it is inferred only from `package.json` scripts. If it still can't be determined, **ask the developer** — never invent a command, and never report a check as passed because its command was unknown. A check that genuinely does not apply (e.g. no typecheck in the language) must be recorded as `N/A (reason)`, not as passed.
