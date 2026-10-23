# Decisions and corrections

1. Plugin over drop-in `.claude/`: namespacing, versioned updates, hooks use `${CLAUDE_PLUGIN_ROOT}`. Cost: no root CLAUDE.md → SessionStart hook injects a digest.
2. `allowed-tools` is NOT a binding (earlier claim was wrong). Read-only skills use `disallowed-tools`; evidence rules + instructions do the rest.
3. Model routing is advisory; plugins cannot switch models. Developer uses `/model`.
4. Guard hook rewritten (tokenizer, deny/ask tiers) after the first version produced false positives (`--force-with-lease`, `.env.example`) and misses (`grep … .env.local`, `curl|sh`, `git clean -fdx`). It is a backstop, not a sandbox.
5. Atlassian/Figma/PR-host MCPs are not bundled (per-user auth); Playwright MCP is bundled, pinned 0.0.83.
6. Post-edit lint/typecheck is opt-in (`postEditCheck`) because whole-repo lint per edit is slow.
7. Usage log stores token counts only (no prompt text), in `$CLAUDE_PLUGIN_DATA`.
8. Commands come from `.copilot-kit.json` then package.json; never invented.
