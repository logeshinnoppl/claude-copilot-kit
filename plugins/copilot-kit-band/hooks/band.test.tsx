import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'copilot-kit-band',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const SURFACES = ['terminal', 'desktop'] as const

test('stages, checks and guard blocks show in the band, on every surface', async ($, on) => {
  on('command.register', () => ({ value: { command: 'copilot-kit-band' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', (_, e) => {
    if (e.tool === 'Bash' && e.command.includes('cat .env')) return { deny: '[copilot-kit guard] reading a secret file' }
    if (e.tool === 'Bash' && e.command.includes('failing')) return { result: { stdout: '', stderr: 'x', interrupted: false }, isError: true }
    return { result: {} }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Skill', skill: 'copilot-kit:requirement-analyzer' })
  await $.tool.call({ tool: 'Skill', skill: 'copilot-kit:plan-feature' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Bash', command: 'npm run lint failing' })
  await $.tool.call({ tool: 'Bash', command: 'cat .env' })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /✓ Gate/ }))?.text).toContain('✓ Gate')
    expect((await ui.find({ type: 'Text', text: /● Plan/ }))?.text).toContain('● Plan')
    expect((await ui.find({ type: 'Text', text: /○ PR/ }))?.text).toContain('○ PR')
    expect((await ui.find({ type: 'Text', text: /checks 1✓ 1✗/ }))?.text).toContain('guard blocked 1')
    await ui.unmount()
  }
})

test('deliver folds Req and Gate, edits start Validate, playwright starts E2E, review follows', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  await $.tool.call({ tool: 'Skill', skill: 'copilot-kit:deliver' })
  await $.tool.call({ tool: 'mcp__plugin_copilot-kit_playwright__browser_navigate', url: 'x' } as never)
  await $.tool.call({ tool: 'Bash', command: "python3 - <<'EOF'\nprint(1)\nEOF" })
  await $.tool.call({ tool: 'Bash', command: 'node tests/e2e/gallery.cjs' })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /✓ Req/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /✓ Gate/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /✓ Plan/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /✓ Validate/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /● E2E/ })).toBeTruthy()
  await ui.unmount()
})

test("another plugin's skill of the same name does not move the band", async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  await $.tool.call({ tool: 'Skill', skill: 'anthropic-skills:requirement-analyzer' })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /○ Gate/ })).toBeTruthy()
  await ui.unmount()
})

test('/copilot-kit-band compact folds it, off hides it, on brings it back', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  // Nothing draws beneath the plugin: this hook stands for the engine's own (empty) band.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  await $.command.run({ command: 'copilot-kit-band', args: 'compact', origin: 'user' })
  let ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Button', key: 'expand' })).toBeTruthy()
  await ui.unmount()

  await $.command.run({ command: 'copilot-kit-band', args: 'off', origin: 'user' })
  ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Button', key: 'hide' })).toBeFalsy()
  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeTruthy()
  await ui.unmount()

  await $.command.run({ command: 'copilot-kit-band', args: 'on', origin: 'user' })
  ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Button', key: 'compact' })).toBeTruthy()
  await ui.unmount()
})

test('a typed slash command moves the band', async ($, on) => {
  on('prompt.submit', (_, e) => ({ text: e.text }))

  await $.prompt.submit({ text: '/copilot-kit:plan-feature improve lighting' })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /● Plan/ })).toBeTruthy()
  await ui.unmount()
})
