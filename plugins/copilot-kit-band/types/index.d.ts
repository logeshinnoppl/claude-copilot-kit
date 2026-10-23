export type Mode = 'full' | 'compact' | 'off'
export type StageId = 'req' | 'gate' | 'plan' | 'impl' | 'e2e' | 'review' | 'pr'
export type StageStatus = 'todo' | 'active' | 'done'
export type Stages = Record<StageId, StageStatus>
export type Checks = { pass: number; fail: number }
export type Totals = {
  turns: number
  input: number
  output: number
  model: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'copilot-kit-band': {
      mode: Mode
      stages: Stages
      checks: Checks
      blocked: number
      totals: Totals
    }
  }
}
