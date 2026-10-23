#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): optional fast feedback loop. OFF unless the project opts in
// with {"postEditCheck": true} in .copilot-kit.json (whole-repo lint after every edit is slow on big repos).
const { execSync } = require("child_process");
const { readStdinJson, resolveCommands } = require("./lib");
const input = readStdinJson();
const { cfg, commands } = resolveCommands(input.cwd || process.cwd());
if (cfg.postEditCheck !== true) process.exit(0);
const failures = [];
for (const [label, cmd] of [["lint", commands.lint], ["typecheck", commands.typecheck]]) {
  if (!cmd) continue;
  try { execSync(cmd, { cwd: cfg._root, stdio: "pipe", timeout: 150000 }); }
  catch (e) {
    const out = `${e.stdout || ""}${e.stderr || ""}`.trim().split("\n").slice(-25).join("\n");
    failures.push(`${label} failed (${cmd}):\n${out}`);
  }
}
if (failures.length) { process.stderr.write(`[copilot-kit post-edit-check]\n${failures.join("\n\n")}\nFix these before continuing.\n`); process.exit(2); }
process.exit(0);
