# copilot-kit-band

Optional, read-only status band for [copilot-kit](../copilot-kit). It sits above the prompt in the Claude Code terminal and desktop app and shows where the work is in the lifecycle. It changes nothing: no edits, no commands, no prompts sent. Remove it and copilot-kit works exactly as before.

```
copilot-kit ✓ Req  ✓ Gate  ● Plan  ○ Validate  ○ E2E  ○ Review  ○ PR   [Compact] [Hide]
checks 3✓ 1✗ · guard blocked 1 · turns 5 · tokens 254k (out 12k) · claude-sonnet-5-5
```

## Install
`/plugin install copilot-kit-band@thecommerceshop-tools` (or `claude --plugin-dir plugins/copilot-kit-band`). Needs a Claude Code build with plugin mods (2.1.290+). Not drawn in the VS Code chat panel, cloud sessions or `claude -p`.

## Use
- `/copilot-kit-band compact | full | off | on | reset` (or the Compact / Expand / Hide buttons). `reset` clears the band for a new task.
- Mode and counters last for the session only.

## What it shows (and how)
- **Stage**: set when a copilot-kit skill runs (`requirement-intake`/`analyzer`, `plan-feature`, `run-tests-fix`, `playwright-tester`, `code-review`, `create-pr`), by slash command or by the model. `●` is the latest stage; earlier started stages show `✓`. It means "this skill ran", not "this skill passed": verdicts such as READY or NEEDS FIXES are text the model writes and are not parsed.
- **checks**: Bash commands that look like lint/typecheck/test/build/e2e, counted by exit status. A heuristic, not the project's configured commands.
- **guard blocked**: tool calls refused by the copilot-kit guard hook.
- **tokens**: from each finished turn's usage (input incl. cache, output, last model).

## Develop
`claude plugin validate plugins/copilot-kit-band` and `claude plugin test plugins/copilot-kit-band` (needs Node on PATH).
