# Connectors (optional)

| Need | Bundled? | How |
|---|---|---|
| Playwright browser tools | Yes (`.mcp.json`, pinned `@playwright/mcp@0.0.83`) | Needs Node 18+/`npx`; first run downloads the package. Project also needs `@playwright/test` + browsers for the headless spec. |
| Jira / Confluence | No (needs per-user auth) | Add the Atlassian remote MCP in Claude Code (`claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp`, then authenticate via `/mcp`) or enable your org's Atlassian connector. Verify the URL in Atlassian's current docs. **Without it, set `tracker: "none"` and use `/copilot-kit:requirement-intake`.** |
| Figma | No | Add Figma's MCP server if you use design frames; otherwise paste a link/screenshot and the analyzer marks it unverified. |
| Bitbucket / GitHub / GitLab PRs | No | Use a connected MCP tool if your org has one, else the host CLI; otherwise `create-pr` prints the PR text and branch for manual opening. |

Credentials never go in this plugin or in `.copilot-kit.json`.
