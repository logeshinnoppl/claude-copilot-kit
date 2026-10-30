---
name: setup-project
description: One-time per-repo setup for copilot-kit. Detects the stack and validation commands, asks whether the team uses Jira or works without it, and writes .copilot-kit.json. Use when the plugin is first installed in a repo or when the SessionStart notice says configuration is missing.
disable-model-invocation: true
---

# Setup Project

1. Look for `.copilot-kit.json`; if present, show it and ask what to change.
2. Detect the stack read-only (package.json scripts, pyproject/Makefile/go.mod/pom/gradle, existing Playwright config, default branch via `git symbolic-ref refs/remotes/origin/HEAD`, git remote host).
2b. Also check the platform signals in `${CLAUDE_PLUGIN_ROOT}/rules/stack-hints.md` (Drupal, Magento, Shopify theme, BigCommerce Stencil, static export; `composer.json`, `.ddev/`, `bin/magento`, `shopify.theme.toml`, `config.stencil.json`). Use its command table only as suggestions to confirm.
3. Propose values for `commands.lint|typecheck|test|build|e2e`, `e2e.baseUrl`/`startCommand`, `baseBranch`, `prHost` (bitbucket|github|gitlab|none). If `e2e.baseUrl` looks like a live production domain, warn and ask for a local or staging URL. For slow stacks offer `e2e.readyTimeoutSec` (seconds to wait for the site, default 120). Mark anything you could not detect as unknown and ask — do not guess commands.
4. Ask: **Does this project use Jira?** → `tracker: "jira"` (needs the Atlassian connector authenticated in Claude Code) or `"none"` (work from briefs via `requirement-intake`).
5. Ask whether to enable `postEditCheck` (lint/typecheck after every edit; off by default because it is slow on large repos).
6. Write `.copilot-kit.json` (template: `${CLAUDE_PLUGIN_ROOT}/templates/copilot-kit.config.example.json`). Suggest committing it so the team shares it. Do not store credentials in it.
7. Check prerequisites and report: `node --version` (18+), `git`, and for UI projects whether `@playwright/test` and browsers are installed (offer, don't run installs unasked).
