# copilot-kit team guide: install, set up, use

Covers copilot-kit 1.2.0 and copilot-kit-band 0.1.3 (marketplace `thecommerceshop-tools`). A browsable copy of the 1.1.4 version of this guide was published as an artifact; this file is the version kept with the source.

## 1. What it is
A Claude Code plugin that keeps AI-assisted work on one path: **Requirement → Plan → Implement + validate → Playwright → Review → PR with evidence.** Jira is optional; both paths use the same 12-point requirement check.

The requirement check is followed because the skills and rules instruct it. No hook blocks edits before it passes. Reviewers should look for the recorded check and any waivers in the PR.

## 2. Before you start
- Node 18 or newer and git. The safety hooks are Node scripts; without Node they do not run and nothing warns you (`node -v`).
- Claude Code (terminal or desktop app), signed in.
- UI projects: `@playwright/test` (the plugin offers to add it).
- Optional: the Atlassian (Jira) connector.

## 3. Install
The marketplace holds two plugins: `copilot-kit` (lifecycle) and `copilot-kit-band` (optional status strip).

**A. Terminal**
```
/plugin marketplace add logeshinnoppl/claude-copilot-kit
/plugin install copilot-kit@thecommerceshop-tools
/reload-plugins
```
A private repository needs read access through your git credentials. The SSH form `git@github.com:logeshinnoppl/claude-copilot-kit.git` also works.

**B. Claude desktop app:** plugins page in settings, add the marketplace, install and enable **copilot-kit**, then start a new session.

**C. Automatic per project:** commit to `.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "thecommerceshop-tools": {
      "source": { "source": "github", "repo": "logeshinnoppl/claude-copilot-kit" }
    }
  },
  "enabledPlugins": { "copilot-kit@thecommerceshop-tools": true }
}
```

**Check:** type `/copilot-kit:`. Nine skills: `deliver`, `requirement-intake`, `requirement-analyzer`, `plan-feature`, `run-tests-fix`, `playwright-tester`, `code-review`, `create-pr`, `setup-project`.

Not yet verified from a clean machine: the in-session `/plugin` forms, the desktop-app route and the settings snippet above. The CLI commands `claude plugin marketplace add|update` and `claude plugin install|update` exist.

## 4. Set up a project (once per repo)
```
/copilot-kit:setup-project
```
It detects the stack (including the hints in `plugins/copilot-kit/rules/stack-hints.md` for Drupal, Magento, Shopify themes and BigCommerce) and writes `.copilot-kit.json`. Check every value and commit the file.

```json
{
  "tracker": "none",
  "commands": {
    "lint": "npm run lint",
    "typecheck": "npx tsc --noEmit",
    "test": "npm test",
    "build": "npm run build",
    "e2e": "npx playwright test"
  },
  "e2e": { "baseUrl": "http://localhost:3000", "startCommand": "npm run dev", "readyTimeoutSec": 120 },
  "baseBranch": "main",
  "prHost": "github",
  "postEditCheck": false
}
```
- `tracker`: `jira` or `none`. `prHost`: `github`, `gitlab`, `bitbucket` or `none`.
- A command set to `null` means that check is skipped. Set `commands.e2e` as soon as a Playwright spec exists.
- `postEditCheck: true` runs lint and type-check after every edit. Use it only if those commands are fast and reliable; a failing command can cause an edit loop.
- Never put credentials in this file.

## 5. Daily use
**Fast lane (small or medium change):**
```
/copilot-kit:deliver <ticket key or a sentence>
```
One compact approval (gate, plan, definition of done, whether to save the brief), then implement, validate, Playwright and an offer to review. Large or unclear work is sent to the full lane.

**Full lane (larger or unclear work):**
```
/copilot-kit:requirement-intake <rough idea>
/copilot-kit:requirement-analyzer <brief path or JIRA-123>
/copilot-kit:plan-feature
```
With Jira, start at `requirement-analyzer` with the ticket key.

| Stage | What happens |
|---|---|
| Requirement | One batch of questions on what is missing. Vague answers are rewritten into measurable ones; waivers are recorded. |
| Plan | Ordered tasks, each with files and the test that proves it. You approve before code. |
| Implement and validate | One task at a time, running the commands in `.copilot-kit.json`. A check counts as passed only if the real command ran and exited 0. If every command is null, the report says `Validate: N/A`. |
| Playwright | `playwright-tester` checks the finished UI change live (at most 12 browser calls), writes a `@playwright/test` spec, and lists anything headless cannot test under "Manual checks". |
| Review | `/copilot-kit:code-review`. READY FOR PR needs zero Critical, High and Medium findings unless a Medium was explicitly accepted. Run it right after the work. |
| PR | `/copilot-kit:create-pr` (manual only). Not yet tested against a real PR host. |

## 6. What runs by itself
| Piece | When | Kind |
|---|---|---|
| Session rules digest | Session start | Hook |
| Guard (secret-file reads, destructive commands) | Before Bash, Read, Edit, Write | Hook |
| Post-edit lint/type-check | After edits, if `postEditCheck` | Hook, opt-in |
| Usage log (tokens, skills and times; no prompt text) | Session end | Hook |
| Requirement check, plan approval, evidence | Throughout | Instruction (model-followed) |
| Model choice, token budget | Advice only | Advisory (`/model` is yours) |

The guard is a backstop, not a security boundary. Keep your organisation's permission settings.

## 7. Status band (optional)
```
/plugin install copilot-kit-band@thecommerceshop-tools
/copilot-kit-band compact     # on | compact | full | off | reset
```
Shows Req, Gate, Plan, Validate, E2E, Review, PR, checks, guard blocks and tokens. Read-only. Run `reset` for each new task. It does not track PR or read the review verdict.

## 8. Updating
```
/plugin marketplace update thecommerceshop-tools
/plugin update copilot-kit@thecommerceshop-tools
/reload-plugins
```
In the desktop app use the Update button. Start a **new session** afterwards.

## 9. Usage report
Logged to `~/.claude/copilot-kit/usage.jsonl` on your machine only.
```
node <plugin folder>/scripts/usage-report.js --by project   # ticket | branch | model | phases
```
Turn off with `COPILOT_KIT_USAGE_LOG=off`. The adoption figures on Claude's plugin settings page come from the app and may lag or show zero; the log is the source of truth.

## 10. Tips from the trial runs
- Use the fast lane for small changes; the full lane repeats gate and plan write-ups.
- Wire `commands.e2e` early, or validation is skipped.
- Run the review straight after the work; after about an hour idle the cache expires and the review re-reads everything.
- Do not paste shell commands into a session; they are treated as a prompt.
- One session per requirement; a session carrying earlier work costs tokens on every later turn.
- Disable synced plugins you do not use; copilot-kit itself adds about 1.2k tokens per turn.

## 11. E-commerce projects (Drupal, Magento, Shopify, BigCommerce)
See `plugins/copilot-kit/rules/stack-hints.md`. Never run e2e against production; take logins and storefront passwords from environment variables; use synthetic data and test payment modes; wait for slow stacks to start (`e2e.readyTimeoutSec`). Platform-native suites (Magento MFTF, Drupal Nightwatch or Behat) are not driven by the plugin. The hints are untested on real projects.

## 12. Troubleshooting
| Symptom | Cause and fix |
|---|---|
| Skills missing after install | `/reload-plugins` or a new session |
| Hooks do nothing | `node -v`; without Node 18+ the guard and logging silently do not run |
| Playwright says the browser is in use | A previous session left its browser open. Close it or end the leftover process, then retry |
| Wrong-language commands (for example Python in a JS project) | `.copilot-kit.json` does not match the project; edit it or rerun `setup-project` |
| Edits loop after each change | A `postEditCheck` command fails every time; set it to `false` or fix the command |
| No diff in review, no PR | The folder is not a git repository; `git init` |
| Jira ticket cannot be fetched | Atlassian connector not connected; the analyzer offers pasted text or intake |
| `git push` denied | The SSH key loaded belongs to another GitHub account; `ssh -T git@github.com` shows which |

## 13. Status and known limits
- Trialled on one static web project: intake, analysis, plan, fast lane, Playwright specs, review.
- Not yet tested: PR creation on GitHub, GitLab or Bitbucket; a run with Jira connected; Windows; the band on every app surface; the e-commerce stack hints.
- The guard does not cover file-pattern searches or other plugins' tools, and it fails open if Node is missing.
- Headless browsers cannot test Esc to leave fullscreen, real devices or Safari; these appear as manual checks.

Questions: Lokesh, logesh.k@thecommerceshop.com. Requirements, decisions and backlog are in this `docs/` folder.
