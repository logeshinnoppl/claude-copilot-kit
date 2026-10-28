#!/usr/bin/env node
/**
 * Stop hook: writes a per-session usage snapshot (tokens by model, prompts, branch, ticket guess)
 * parsed from the real session transcript. Appends to <data dir>/usage.jsonl; the report keeps the
 * latest snapshot per session. Never blocks. No prompt/response text is stored.
 * Data dir: $CLAUDE_PLUGIN_DATA, else ~/.claude/copilot-kit. Set COPILOT_KIT_USAGE_LOG=off to disable.
 */
const fs = require("fs");
const path = require("path");
const { readStdinJson, dataDir } = require("./lib");

function summarize(file) {
  const byModel = {}; const seen = new Set(); let prompts = 0; let branch = null, cwd = null, first = null, last = null; const phases = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.timestamp) { first = first || o.timestamp; last = o.timestamp; }
    if (o.gitBranch) branch = o.gitBranch;
    if (o.cwd && !cwd) cwd = o.cwd; // first cwd = where the session started (later cds must not rename the project)
    if (o.type === "user" && o.message && !o.isSidechain && !o.isMeta) {
      const c = o.message.content;
      const isToolResult = Array.isArray(c) && c.some(x => x && x.type === "tool_result");
      if (!isToolResult) prompts++;
    }
    const m = o.message;
    if (o.type === "assistant" && m && Array.isArray(m.content)) for (const x of m.content)
      if (x && x.type === "tool_use" && x.name === "Skill" && x.input && x.input.skill) phases.push({ skill: String(x.input.skill).replace(/^copilot-kit:/, ""), ts: o.timestamp });
    if (o.type === "user" && m && typeof m.content === "string" && !o.isSidechain) {
      const t = m.content.match(/<command-name>\/?([\w:.-]+)<\/command-name>/);
      if (t) phases.push({ skill: t[1].replace(/^copilot-kit:/, ""), ts: o.timestamp });
    }
    if (o.type === "assistant" && m && m.usage && m.model && m.id) {
      if (seen.has(m.id)) continue; seen.add(m.id);
      const u = m.usage; const b = (byModel[m.model] ||= { input: 0, output: 0, cache_read: 0, cache_write: 0, messages: 0 });
      b.input += u.input_tokens || 0; b.output += u.output_tokens || 0;
      b.cache_read += u.cache_read_input_tokens || 0; b.cache_write += u.cache_creation_input_tokens || 0; b.messages++;
    }
  }
  return { byModel, prompts, branch, cwd, first, last, phases };
}

try {
  if (process.env.COPILOT_KIT_USAGE_LOG === "off") process.exit(0);
  const input = readStdinJson();
  if (!input.transcript_path || !fs.existsSync(input.transcript_path)) process.exit(0);
  const s = summarize(input.transcript_path);
  const ticket = ((s.branch || "").match(/[A-Za-z][A-Za-z0-9]+-\d+/) || [null])[0];
  const entry = { ts: new Date().toISOString(), session_id: input.session_id, user: process.env.USER || process.env.USERNAME || null,
    project: s.cwd ? path.basename(s.cwd) : null, branch: s.branch, ticket: ticket ? ticket.toUpperCase() : null,
    prompts: s.prompts, started: s.first, last_activity: s.last, phases: s.phases, models: s.byModel };
  fs.appendFileSync(path.join(dataDir(), "usage.jsonl"), JSON.stringify(entry) + "\n");
} catch (e) { /* never block the workflow */ }
process.exit(0);
