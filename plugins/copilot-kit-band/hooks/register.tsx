import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Checks, Mode, StageId, Stages, Totals } from '../types'

const COMMAND = 'copilot-kit-band'

const ORDER: StageId[] = ['req', 'gate', 'plan', 'impl', 'e2e', 'review', 'pr']
const LABEL: Record<StageId, string> = {
  req: 'Req',
  gate: 'Gate',
  plan: 'Plan',
  impl: 'Validate',
  e2e: 'E2E',
  review: 'Review',
  pr: 'PR',
}
const SKILL_STAGE: Record<string, StageId> = {
  deliver: 'plan', // fast lane: req and gate are folded into one approval block, see applySkill
  'requirement-intake': 'req',
  'requirement-analyzer': 'gate',
  'plan-feature': 'plan',
  'run-tests-fix': 'impl',
  'playwright-tester': 'e2e',
  'code-review': 'review',
  'create-pr': 'pr',
}
// Heuristic only: a Bash command that looks like lint/typecheck/test/build/e2e.
const CHECK_COMMAND =
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?(lint|typecheck|test|build|test:e2e)\b|\b(eslint|tsc|jest|vitest|pytest|mocha|playwright\s+test|cargo\s+(test|build|clippy)|go\s+(test|build|vet)|mvn|gradle|make\s+(test|lint|build))\b/

const blankStages = (): Stages => ({
  req: 'todo',
  gate: 'todo',
  plan: 'todo',
  impl: 'todo',
  e2e: 'todo',
  review: 'todo',
  pr: 'todo',
})
const blankTotals = (): Totals => ({ turns: 0, input: 0, output: 0, model: null })

const mode = atom({ plugin: 'copilot-kit-band', key: 'mode' } as const, 'full' as Mode)
const stages = atom({ plugin: 'copilot-kit-band', key: 'stages' } as const, blankStages())
const checks = atom({ plugin: 'copilot-kit-band', key: 'checks' } as const, { pass: 0, fail: 0 } as Checks)
const blocked = atom({ plugin: 'copilot-kit-band', key: 'blocked' } as const, 0)
const totals = atom({ plugin: 'copilot-kit-band', key: 'totals' } as const, blankTotals())

// "copilot-kit:run-tests-fix" or a bare "run-tests-fix"; another plugin's prefix is not ours.
function stageOfSkill(name: string): StageId | null {
  const bare = name.startsWith('copilot-kit:') ? name.slice('copilot-kit:'.length) : name
  return name.includes(':') && !name.startsWith('copilot-kit:') ? null : (SKILL_STAGE[bare] ?? null)
}

const mark = (current: Stages, stage: StageId): Stages => {
  const next = { ...current }
  const at = ORDER.indexOf(stage)
  ORDER.forEach((id, i) => {
    if (i < at && next[id] === 'active') next[id] = 'done'
  })
  next[stage] = 'active'
  return next
}

// deliver folds Req + Gate + Plan into one pass, so the first two are done as soon as it starts.
const applySkill = (current: Stages, bare: string, stage: StageId): Stages => {
  const next = mark(current, stage)
  if (bare === 'deliver') {
    next.req = 'done'
    next.gate = 'done'
  }
  return next
}
const bareName = (name: string) => (name.startsWith('copilot-kit:') ? name.slice('copilot-kit:'.length) : name)

// Work done inside deliver or by hand: edits mean Validate has started; browser/e2e activity after that means E2E.
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const E2E_COMMAND = /playwright|tests?\/e2e/
const onWork = (current: Stages, isEdit: boolean, isE2e: boolean): Stages | null => {
  if (isEdit && current.impl === 'todo' && current.e2e === 'todo' && current.review === 'todo' && current.plan !== 'todo') return mark(current, 'impl')
  if (isE2e && current.impl !== 'todo' && current.e2e === 'todo' && current.review === 'todo') return mark(current, 'e2e')
  return null
}

const tokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(n))
const glyph = (s: 'todo' | 'active' | 'done') => (s === 'done' ? '✓' : s === 'active' ? '●' : '○')

const HIDDEN_HINT = 'copilot-kit band hidden. Run /copilot-kit-band on to bring it back.'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'copilot-kit band: on | compact | full | off | reset',
    })
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'reset') {
      await update($, stages, () => blankStages())
      await update($, checks, () => ({ pass: 0, fail: 0 }))
      await update($, blocked, () => 0)
      await update($, totals, () => blankTotals())
      return { text: 'copilot-kit band reset for a new task.' }
    }
    const next: Mode | null =
      arg === 'off' ? 'off' : arg === 'compact' ? 'compact' : arg === 'full' || arg === 'on' || arg === '' ? 'full' : null
    if (next === null) return { text: 'Usage: /copilot-kit-band on | compact | full | off | reset' }
    await update($, mode, () => next)
    return { text: `copilot-kit band: ${next}.` }
  })

  // A gating hook: never let a bookkeeping failure block or alter the tool call.
  on('tool.call', async ($, e, next) => {
    try {
      if (e.tool === 'Skill') {
        const stage = stageOfSkill(e.skill)
        if (stage) await update($, stages, s => applySkill(s, bareName(e.skill), stage))
      } else {
        const tool = String(e.tool)
        const isE2e = /playwright/i.test(tool) || (tool === 'Bash' && E2E_COMMAND.test(String((e as { command?: string }).command ?? '')))
        const isEdit = EDIT_TOOLS.has(tool)
        if (isEdit || isE2e) await update($, stages, s => onWork(s, isEdit, isE2e) ?? s)
      }
    } catch {}
    const ran = await next(e)
    try {
      if (e.tool === 'Bash' && CHECK_COMMAND.test(e.command) && !ran.deny) {
        await update($, checks, c => (ran.isError ? { ...c, fail: c.fail + 1 } : { ...c, pass: c.pass + 1 }))
      }
      if (ran.deny?.includes('[copilot-kit guard]') || ran.text?.includes('[copilot-kit guard]')) {
        await update($, blocked, n => n + 1)
      }
    } catch {}
    return ran
  })

  // A typed slash command (/copilot-kit:plan-feature) is a command, not a Skill tool call.
  on('prompt.submit', async ($, e, next) => {
    try {
      const typed = e.command?.name ?? e.text.trim().match(/^\/([\w:.-]+)/)?.[1]
      const stage = typed ? stageOfSkill(typed) : null
      if (stage && typed) await update($, stages, s => applySkill(s, bareName(typed), stage))
    } catch {}
    return next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    const stage = stageOfSkill(e.pluginName === 'copilot-kit' ? `copilot-kit:${e.skill.replace(/^copilot-kit:/, '')}` : e.skill)
    if (stage) await update($, stages, s => applySkill(s, bareName(e.skill), stage))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    await update($, totals, t => ({
      turns: t.turns + 1,
      input: t.input + (u ? u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens : 0),
      output: t.output + (u ? u.output_tokens : 0),
      model: u ? u.model : t.model,
    }))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const how = await read($, mode)
    if (e.props.hasSurvey || how === 'off') return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const s = await read($, stages)
    const c = await read($, checks)
    const b = await read($, blocked)
    const t = await read($, totals)
    const done = ORDER.filter(id => s[id] === 'done').length
    const active = ORDER.find(id => s[id] === 'active')
    const total = t.input + t.output
    const checkText = `checks ${c.pass}✓ ${c.fail}✗`

    if (how === 'compact') {
      return (
        <Box>
          <Text bold>copilot-kit </Text>
          <Text>
            {active ? `${LABEL[active]} (${done}/${ORDER.length} done)` : `${done}/${ORDER.length} done`} · {checkText} · {tokens(total)} tok{' '}
          </Text>
          <Button key="expand" label="Expand" onPress={() => update($, mode, () => 'full')} />
          <Button key="hide" label="Hide" onPress={async () => { await update($, mode, () => 'off'); $.ui.toast(HIDDEN_HINT) }} />
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box>
          <Text bold>copilot-kit </Text>
          {ORDER.map(id => (
            <Text key={id} bold={s[id] === 'active'} dimColor={s[id] === 'todo'}>
              {glyph(s[id])} {LABEL[id]}{'  '}
            </Text>
          ))}
          <Button key="compact" label="Compact" onPress={() => update($, mode, () => 'compact')} />
          <Button key="hide" label="Hide" onPress={async () => { await update($, mode, () => 'off'); $.ui.toast(HIDDEN_HINT) }} />
        </Box>
        <Text dimColor>
          {checkText} · guard blocked {b} · turns {t.turns} · tokens {tokens(total)} (out {tokens(t.output)}){t.model ? ` · ${t.model}` : ''}
        </Text>
      </Box>
    )
  })
}
