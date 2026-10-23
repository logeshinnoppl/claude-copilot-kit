# Requirements (as discussed)

## Context
TheCommerceShop is adopting Claude Code as its AI coding copilot, extending/replacing a Windsurf-based setup. Source plan: the "AI Copilot Engineering Lifecycle" deck (13 pages). Owner: Logesh (logesh.k@thecommerceshop.com).

## R1 Scope and form
- R1.1 Generic, language-agnostic rules, skills and subagents usable across programming languages.
- R1.2 Easy to load into any project (originally a drop-in `.claude/` folder; now a plugin).
- R1.3 Shareable with the whole team; installable via team marketplace or plugin upload.

## R2 Lifecycle (from the deck)
Requirement quality gate → AI context/rules → model & token control → automated engineering (plan, implement, validate) → review & measurement.

## R3 Requirement handling
- R3.1 12-point requirement quality gate (business objective, user story, AC, Figma/UI ref, technical constraints, affected components, edge cases, testing scope, browser/device scope, analytics, out of scope, definition of done).
- R3.2 Hard gate: no implementation until satisfied or explicitly waived (waivers recorded). Enforced by instruction only (skills, agents, SessionStart rules); no hook blocks edits. A hook-based gate is a possible future enhancement.
- R3.3 Jira is optional. Without Jira there must be an equivalent path whose requirement prompt matches the same norms (requirement-intake + brief template + developer confirmation).
- R3.4 Same quality bar ("what counts as present") for both paths.

## R4 Skills and agents
- Skills: requirement-intake, requirement-analyzer, plan-feature, run-tests-fix, playwright-tester, code-review, create-pr, setup-project.
- Agents: planner-agent, test-fix-agent, review-agent, pr-agent.
- R4.1 Skills must use real tools, not just prose: playwright-tester must drive Playwright (playwright.dev) via Playwright MCP and then write/run a `@playwright/test` spec; validation steps must be real command executions with observed exit codes; PRs must be opened with a real tool/CLI result.
- R4.2 Jira/Figma/PR-host tools are used when connected; graceful fallback when not.

## R5 Controls
- R5.1 Security rules (secrets, injection, authZ, destructive actions, untrusted fetched content).
- R5.2 Guard hook for secret-file reads and destructive commands (deny/ask tiers).
- R5.3 Model routing by complexity score and token-budget stop/re-plan rule — advisory only.
- R5.4 Usage measurement for the AI usage dashboard (tokens by model, per ticket/branch/project).

## R6 Delivery
- R6.1 Plugin + marketplace zips; install docs; workflow diagrams (full + simplified) exist as artifacts.
- R6.2 Honest limitations documented (enforced vs advisory).

## Non-functional
Node 18+, git; no credentials in repo; pinned MCP versions; Windows/Mac/Linux friendly (exec-form hooks).
