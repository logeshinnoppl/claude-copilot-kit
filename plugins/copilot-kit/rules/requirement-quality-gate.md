# Requirement Quality Gate

**Hard gate (by instruction): a ticket may not move to implementation until this checklist is satisfied.** No hook blocks edits before the gate passes; it is followed because the `requirement-analyzer` skill, the `planner-agent` subagent and the SessionStart rules instruct it. Neither skill nor agent should hand off to coding until every applicable item below is either present in the ticket or explicitly waived by the developer. Reviewers should check the PR for the recorded gate result and any waivers.

## The 12-point checklist

A ticket is implementation-ready only when it has:

1. **Business objective** — why this work matters, in one or two sentences.
2. **User story** — who does what, and why, in standard "as a / I want / so that" form or equivalent.
3. **Acceptance criteria** — specific, testable conditions for "this works." Vague criteria ("improve performance") are not acceptable; they must be measurable or observably verifiable.
4. **Figma frame / UI reference** — for anything with a UI surface. Not required for pure backend/API/infra tickets.
5. **Technical constraints** — known limitations: performance budgets, browser/runtime support, backward compatibility requirements, etc.
6. **Components/modules affected** — the parts of the system this change touches, at least at a high level.
7. **Edge cases / expected error handling** — what should happen on invalid input, empty states, network failure, concurrent access, etc.
8. **Testing scope** — what kind of testing is expected (unit/integration/e2e) and any scenarios that must be covered.
9. **Browser/device scope** — for UI work: which browsers/devices/viewports are in scope.
10. **Analytics events / tracking** — any events, metrics, or logging this feature must emit, if applicable.
11. **Out of scope** — what this ticket explicitly does NOT cover, to prevent scope creep in either direction.
12. **Definition of done** — the condition under which this ticket is considered complete and ready to close.

## What counts as "present" (the quality bar)

An item is only **present** if it is specific enough to act on. Boilerplate does not count.

| # | Present means | Does NOT count |
|---|---|---|
| 1 | States the user/business problem and the outcome | "Improve checkout" |
| 2 | Names a real actor, action, and benefit | "As a user I want it to work" |
| 3 | Each AC is observable/measurable (Given/When/Then or exact values), numbered AC1..ACn | "Should be fast", "works correctly" |
| 4 | Link/frame/screenshot of the UI, or N/A for non-UI | "Follow existing design" with no reference |
| 5 | Concrete limits (perf budget, supported versions, backward-compat) or an explicit "none" | blank |
| 6 | Named modules/endpoints/pages | "Frontend" |
| 7 | At least invalid input, empty state, and failure behaviour stated | "Handle errors" |
| 8 | Which layers (unit/integration/e2e) and must-cover scenarios | "Add tests" |
| 9 | Named browsers/devices/viewports, or N/A | "All browsers" |
| 10 | Event names + properties, or an explicit "none" | blank |
| 11 | At least one explicit exclusion, or an explicit "nothing excluded" | blank |
| 12 | A checkable done condition (e.g. "AC1–AC4 pass, deployed to staging") | "When finished" |

## Sources of requirements

The gate is identical whatever the source: a Jira ticket (fetched through the Atlassian connector), pasted ticket text, or a no-Jira brief written with the `requirement-intake` skill using `templates/requirement-brief.md`. A no-Jira task must produce the same 12 fields; a one-line chat request is not a requirement until it has been turned into a brief and the developer has confirmed it.

## Gate behavior

- If any applicable item is missing, `requirement-analyzer` produces a **refinement output** listing: missing details, affected files (from a repo scan), risks, a draft task breakdown, required tests, and a complexity score (see `model-routing.md`).
- The refinement output is presented to the developer for confirmation *before* any code is written. Do not guess and proceed on missing acceptance criteria, scope, or edge-case handling — ask.
- Items 4 (Figma), 9 (browser/device), and 10 (analytics) are only applicable when relevant to the ticket type (e.g., a pure backend job has no Figma frame). Do not block on inapplicable items — but do explicitly record them as "N/A" rather than silently skipping them, so it's clear they were considered.
- A developer can explicitly waive a missing item ("skip AC detail, I'll review the diff directly") — record that waiver in the plan output so it's traceable later.

## Why this gate exists

Per the current-state analysis: the dominant failure mode today is starting implementation on an underspecified ticket, which produces a prompt loop of repeated fixes. This gate moves the correction cost from "after code is written" (expensive: tokens, review time, re-testing) to "before code is written" (cheap: a clarifying question).
