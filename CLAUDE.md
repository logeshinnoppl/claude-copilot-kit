# copilot-kit — development project

This repo is the source for **copilot-kit**, TheCommerceShop's Claude Code plugin implementing a governed AI-copilot lifecycle (Requirement → Plan → Implement+validate → Playwright → Review → PR evidence). It is also a plugin marketplace (`.claude-plugin/marketplace.json`, marketplace name `thecommerceshop-tools`).

Read first: @docs/REQUIREMENTS.md, @docs/DECISIONS.md, @docs/BACKLOG.md

## Layout
- `plugins/copilot-kit/` — the plugin: `.claude-plugin/plugin.json`, `skills/*/SKILL.md`, `agents/*.md`, `hooks/hooks.json`, `scripts/*.js`, `rules/*.md`, `templates/`, `docs/`, `.mcp.json`.
- `plugins/copilot-kit-band/` — optional read-only status band (TSX mod, own README; check with `claude plugin validate` + `claude plugin test`).
- `docs/` — requirements, decisions, backlog for this project (not shipped in the plugin).

## Working rules
- Plugin facts must be verified against current Claude Code docs or the local CLI (`claude plugin validate`, `claude --plugin-dir`), not assumed. A plugin-root CLAUDE.md is NOT loaded; always-on rules go through the SessionStart hook (`scripts/session-rules.js`).
- Skill `allowed-tools` only pre-approves; use `disallowed-tools` to restrict. Never claim a skill is "bound" to tools.
- Hooks: exec form (`command: "node"` + `args` with `${CLAUDE_PLUGIN_ROOT}`), dependency-free Node 18+, never block on logging failure. Guard changes require new fixtures in `scripts/test-guard.js`.
- Any change to rules/skills must keep both requirement paths (Jira and no-Jira) equivalent under the 12-point gate.
- Keep the SessionStart digest short (it costs tokens every session); put detail in `rules/`.
- No credentials in the repo. Pin MCP package versions.

## Before every commit
1. `node plugins/copilot-kit/scripts/test-guard.js`
2. `claude plugin validate plugins/copilot-kit && claude plugin validate .`
3. Smoke test: `claude -p "..." --plugin-dir plugins/copilot-kit` in a scratch repo.
4. Bump `version` in plugin.json and marketplace.json for user-visible changes.

## Test locally
`claude --plugin-dir plugins/copilot-kit` (then `/reload-plugins` after edits), or `/plugin marketplace add .` then `/plugin install copilot-kit@thecommerceshop-tools`.
