# Backlog / enhancement ideas

Verification gaps (not yet tested)
- [ ] End-to-end run on a real repo with Jira connected; with Jira absent.
- [ ] PR creation against Bitbucket/GitHub/GitLab.
- [ ] Windows run of hooks; plugin-upload path in the Claude app.
- [ ] Behaviour of `disable-model-invocation` skills inside subagents.

Enhancements
- [ ] Stack-specific add-on plugins (e.g. python, java, node) with command defaults.
- [ ] Dashboard for usage.jsonl (cost needs a maintained price table).
- [ ] CI job: validate plugin + run guard fixtures on every PR.
- [ ] `plugin eval` suites for the skills.
- [ ] Bitbucket MCP / pipeline-status integration; Jira write-back of PR link.
- [ ] LICENSE + icon if listing in a public directory.
- [ ] Band v2: persist mode across sessions; action buttons (run next skill); parse READY/NEEDS FIXES verdicts; read configured commands from `.copilot-kit.json`; type-check with `tsc`.
- [ ] Verify the band in a live Claude Code session (terminal and desktop).
- [ ] Real retry-ratio metric (needs a definition the team agrees on).
