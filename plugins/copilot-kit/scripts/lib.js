// Shared helpers for copilot-kit hooks. Dependency-free, Node 18+.
const fs = require("fs");
const path = require("path");
const os = require("os");

function readStdinJson() {
  try { return JSON.parse(fs.readFileSync(0, "utf8") || "{}"); } catch { return {}; }
}

// Walk up from cwd to find .copilot-kit.json (project config).
function findConfigPath(cwd) {
  let dir = cwd || process.cwd();
  for (let i = 0; i < 12; i++) {
    const p = path.join(dir, ".copilot-kit.json");
    if (fs.existsSync(p)) return p;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadConfig(cwd) {
  const p = findConfigPath(cwd);
  let cfg = {};
  if (p) { try { cfg = JSON.parse(fs.readFileSync(p, "utf8")); } catch { cfg = { _error: "invalid JSON in " + p }; } }
  cfg._path = p;
  cfg._root = p ? path.dirname(p) : (cwd || process.cwd());
  return cfg;
}

// Commands: config wins; else infer from package.json scripts; else null.
function resolveCommands(cwd) {
  const cfg = loadConfig(cwd);
  const c = Object.assign({}, cfg.commands || {});
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cfg._root, "package.json"), "utf8"));
    const s = pkg.scripts || {};
    if (!c.lint && s.lint) c.lint = "npm run lint --silent";
    if (!c.typecheck && s.typecheck) c.typecheck = "npm run typecheck --silent";
    if (!c.test && s.test) c.test = "npm test --silent";
    if (!c.build && s.build) c.build = "npm run build --silent";
    if (!c.e2e && s["test:e2e"]) c.e2e = "npm run test:e2e";
  } catch {}
  return { cfg, commands: c };
}

function dataDir() {
  const d = process.env.CLAUDE_PLUGIN_DATA || path.join(os.homedir(), ".claude", "copilot-kit");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

module.exports = { readStdinJson, loadConfig, resolveCommands, findConfigPath, dataDir };
