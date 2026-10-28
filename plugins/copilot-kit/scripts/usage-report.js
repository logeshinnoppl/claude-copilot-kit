#!/usr/bin/env node
// Usage: node usage-report.js [path-to-usage.jsonl] [--by ticket|branch|project|model|phases]
// --by phases: per session, the skill/phase sequence with minutes since session start.
// Prints token usage per group from the latest snapshot of each session. Tokens only: apply your own
// price table for cost (prices change). "prompts" = human turns per session (a rough retry proxy, not a true retry ratio).
const fs = require("fs"); const path = require("path"); const os = require("os");
const args = process.argv.slice(2);
const byIdx = args.indexOf("--by"); const by = byIdx >= 0 ? args[byIdx + 1] : "ticket";
const file = args.find((a, i) => !a.startsWith("--") && i !== byIdx + 1) ||
  path.join(process.env.CLAUDE_PLUGIN_DATA || path.join(os.homedir(), ".claude", "copilot-kit"), "usage.jsonl");
if (!fs.existsSync(file)) { console.error("No usage log at " + file); process.exit(1); }
const latest = new Map();
for (const l of fs.readFileSync(file, "utf8").split("\n")) { if (!l.trim()) continue; try { const o = JSON.parse(l); latest.set(o.session_id, o); } catch {} }
if (by === "phases") {
  for (const s of latest.values()) {
    const t0 = Date.parse(s.started); if (!(s.phases || []).length) continue;
    console.log(`${s.session_id.slice(0, 8)}  ${s.project || "(none)"}`);
    for (const p of s.phases) console.log(`  +${((Date.parse(p.ts) - t0) / 60000).toFixed(1)}m\t${p.skill}`);
  }
  process.exit(0);
}
const rows = new Map();
for (const s of latest.values()) for (const [model, u] of Object.entries(s.models || {})) {
  const key = by === "model" ? model : (s[by] || "(none)");
  const r = rows.get(key) || { sessions: new Set(), prompts: 0, input: 0, output: 0, cache_read: 0, cache_write: 0, models: new Set() };
  r.sessions.add(s.session_id); r.input += u.input; r.output += u.output; r.cache_read += u.cache_read; r.cache_write += u.cache_write; r.models.add(model); rows.set(key, r);
}
const promptsBy = new Map(); for (const s of latest.values()) { const k = by === "model" ? "" : (s[by] || "(none)"); promptsBy.set(k, (promptsBy.get(k) || 0) + (s.prompts || 0)); }
console.log(["group", "sessions", "prompts", "input", "output", "cache_read", "cache_write", "models"].join("\t"));
for (const [k, r] of [...rows].sort((a, b) => b[1].output - a[1].output))
  console.log([k, r.sessions.size, by === "model" ? "-" : promptsBy.get(k), r.input, r.output, r.cache_read, r.cache_write, [...r.models].join(",")].join("\t"));
