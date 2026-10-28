---
name: playwright-tester
description: Converts acceptance criteria into Playwright end-to-end tests. Drives a real browser through the Playwright MCP tools to verify behaviour live, then writes a Playwright Test spec (@playwright/test, playwright.dev) and runs it headlessly with the project's e2e command. Use for any change with a user-facing UI flow.
argument-hint: "[feature or AC list]"
---

# Playwright Tester

Uses **Playwright** (https://playwright.dev/) twice: the Playwright MCP server (bundled by this plugin as `playwright`) to explore the live app, and **`@playwright/test`** to run the durable regression spec. Neither alone is sufficient.

## Preconditions (check, don't assume)
- Playwright MCP tools are available (names contain `playwright`, e.g. `browser_navigate`, `browser_snapshot`). If not: stop and tell the developer to enable the plugin's `playwright` MCP server (needs Node 18+ and `npx`).
- `@playwright/test` is a project dependency and browsers are installed. Check `package.json`/config **once**. If missing, ask the developer a single question to add it (`npm i -D @playwright/test` + `npx playwright install`, and a minimal `playwright.config` with `e2e.baseUrl`) and wait. Do **not** search `~/.npm/_npx` or other caches, set `NODE_PATH`, or write a throwaway `.cjs` script: that is not a durable regression spec. For a project with no `package.json` (static site), propose a small `tests/e2e/` folder with its own `package.json`.
- The app is running at a known URL (`.copilot-kit.json` → `e2e.baseUrl` / `e2e.startCommand`). Ask if unknown.
- ACs are known.

## Procedure
1. Write each AC as Given/When/Then.
2. **Explore live, bounded**: **hard cap of 12 Playwright MCP calls in total** for the whole feature. Do not loop `browser_run_code_unsafe` (each call takes 30–40s); use it at most twice, and only when a snapshot cannot answer. Stop exploring as soon as the Then is confirmed. If something fails, debug with the spec's own trace/`--reporter=line`, not more live exploration. Use the Playwright MCP tools: navigate → snapshot (prefer the accessibility snapshot to locate elements) → click/type/fill_form/select/press_key → wait_for the expected state (no fixed sleeps) → snapshot again to confirm the Then → check console messages and network requests for errors → **always `browser_close` when done** (a leftover Chrome profile locks the MCP for the next session).
3. Only then write the spec (`*.spec.ts`/`.js` using `@playwright/test`) in the project's e2e location and conventions, using the selectors/assertions just confirmed. Prefer role/label/test-id locators and web-first assertions (`expect(locator).toBeVisible()`); no `waitForTimeout`.
4. Run it headlessly with the project's e2e command (`commands.e2e`), not piped through `tail`/`head`, and report the observed exit code; then run the whole e2e suite once.
4b. If the app loads slow remote assets (e.g. a 3D model from a CDN), stub or route them in the spec (`page.route`) or use a local fixture so each test takes seconds, not 30s; keep one unstubbed smoke test at most.
5. Cover negative/edge cases from the ACs the same way (invalid input, empty state, permission denied).
6. Test data must be synthetic. Never type real credentials; use test accounts from env vars/fixtures.

## If MCP is unavailable
Do not write an unverified spec silently. Report it; only if the developer explicitly accepts, write the spec and label every scenario **NOT live-verified**.

## Output format
```markdown
## Playwright Scenarios — <feature>
### Scenario: <name>
Given … / When … / Then …
- Live-verified via Playwright MCP: yes/no (tools actually used: …)
- Spec: <path>
- Live-verified AFTER the change was made (not only before): yes/no
- Headless run: `<command>` → exit <n> ✅/❌
### Coverage: AC → scenario
```
