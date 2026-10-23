#!/usr/bin/env node
/**
 * PreToolUse guard (Bash, Read, Grep, Edit, Write...). A BACKSTOP, not a sandbox:
 * it tokenizes shell commands (so flag order/quoting don't matter) and returns
 *   deny -> exit 2 (blocked, reason shown to Claude)
 *   ask  -> permissionDecision "ask" (developer must confirm)
 *   allow-> exit 0
 * Determined obfuscation (eval, base64, scripts that build commands) is out of scope;
 * the primary control is security-rules.md plus your org's permission settings.
 */
const { readStdinJson } = require("./lib");

const SECRET_NAME = /^(\.env(\..+)?|.+\.(pem|key|p12|pfx|keystore|jks)|id_(rsa|ed25519|ecdsa|dsa)|credentials(\.json)?|\.netrc|\.pgpass|.*secrets?\.(json|ya?ml|env|toml))$/i;
const SAFE_SUFFIX = /\.(example|sample|template|dist|tpl)$/i;
const READERS = new Set(["cat","less","more","head","tail","grep","egrep","fgrep","rg","ag","sed","awk","cp","scp","rsync","base64","xxd","od","strings","source",".","bat","nl","tac","curl","wget","tee","dd","jq","yq","openssl","gpg","zip","tar","find","xargs","python","python3","node","ruby","perl","type","cut","sort","diff","vim","vi","nano","code"]);
const SYSTEM_DIRS = new Set(["/","/*","~","~/","~/*","$HOME","$HOME/","$HOME/*","/home","/home/","/etc","/usr","/var","/bin","/sbin","/lib","/opt","/root","/boot","/System","/Users","/Library","/Applications","C:\\","C:/"]);

const BROAD_ROOTS = new Set([".","..","~","$HOME","/"]);
const GIT_CONTENT_READERS = new Set(["diff","show","blame","annotate","log","grep","cat-file","archive"]);

function isSecretPath(p) {
  if (!p) return false;
  const clean = String(p).replace(/^[<>]+/, "").replace(/\\/g, "/");
  const base = clean.split("/").filter(Boolean).pop() || "";
  if (/\/\.ssh\/|\/\.aws\/|\/\.gnupg\//.test("/" + clean)) return true;
  if (SAFE_SUFFIX.test(base)) return false;
  return SECRET_NAME.test(base) && !/\.pub$/i.test(base);
}

// Quote-aware tokenizer that also splits into command segments on ; && || | & newline.
function segments(cmd) {
  const segs = []; let cur = []; let tok = ""; let q = null; let has = false;
  const push = () => { if (has) { cur.push(tok); tok = ""; has = false; } };
  const end = (sep) => { push(); if (cur.length) segs.push({ tokens: cur, pipeTo: sep === "|" }); cur = []; };
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (q) { if (ch === q) q = null; else if (ch === "\\" && q === '"' && i + 1 < cmd.length) { tok += cmd[++i]; } else tok += ch; has = true; continue; }
    if (ch === "'" || ch === '"') { q = ch; has = true; continue; }
    if (ch === "\\" && i + 1 < cmd.length) { tok += cmd[++i]; has = true; continue; }
    if (ch === "\n" || ch === ";") { end(";"); continue; }
    if (ch === "&" ) { if (cmd[i+1] === "&") i++; end("&"); continue; }
    if (ch === "|") { if (cmd[i+1] === "|") { i++; end("||"); } else end("|"); continue; }
    if (/\s/.test(ch)) { push(); continue; }
    tok += ch; has = true;
  }
  end(";");
  return segs;
}

function programOf(tokens) {
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) { i++; continue; }
    if (["sudo","env","command","nohup","time","exec"].includes(t)) { i++; continue; }
    break;
  }
  const prog = (tokens[i] || "").split("/").pop();
  return { prog, args: tokens.slice(i + 1) };
}

function flagsOf(args) {
  const f = new Set();
  for (const a of args) {
    if (a === "--") break;
    if (/^--[\w-]+/.test(a)) f.add(a.split("=")[0]);
    else if (/^-[A-Za-z]+$/.test(a)) for (const c of a.slice(1)) f.add("-" + c);
  }
  return f;
}

function checkSegment(seg, nextSeg) {
  const { prog, args } = programOf(seg.tokens);
  const flags = flagsOf(args);
  const operands = args.filter(a => !a.startsWith("-"));

  if (prog === "rm" || prog === "rmdir" || prog === "unlink" || prog === "shred") {
    const rec = flags.has("-r") || flags.has("-R") || flags.has("--recursive");
    if (rec && operands.some(o => SYSTEM_DIRS.has(o.replace(/\/+$/, "") || "/") || SYSTEM_DIRS.has(o)))
      return { d: "deny", why: "recursive delete of a root/home/system path" };
    if (rec && operands.some(o => o === "." || o === ".." || o === "./" || o === "*" || o === "./*"))
      return { d: "ask", why: "recursive delete of the current/parent directory or a bare wildcard" };
  }
  if (prog === "grep" || prog === "egrep" || prog === "fgrep") {
    // grep -r does not honour .gitignore, so a broad root sweeps in .env and key files.
    const rec = flags.has("-r") || flags.has("-R") || flags.has("--recursive") || flags.has("--dereference-recursive");
    const broad = operands.slice(1).some(o => BROAD_ROOTS.has(o.replace(/\/+$/, "") || "/"));
    const excludesEnv = seg.tokens.some(t => /^--exclude=.*env/i.test(t));
    if (rec && broad && !excludesEnv) return { d: "ask", why: "recursive grep over a broad directory can read .env/key files (narrow the path or add --exclude='.env*')" };
  }
  if (prog === "git") {
    const sub = args.find(a => !a.startsWith("-"));
    if (sub === "push") {
      const forceTok = args.includes("--force") || args.includes("-f") || args.some(a => /^-[A-Za-z]+$/.test(a) && a.includes("f") && !a.startsWith("--"));
      if (forceTok && !args.some(a => a.startsWith("--force-with-lease"))) return { d: "deny", why: "git force-push (use --force-with-lease only with explicit developer approval)" };
      if (args.some(a => /^\+\S/.test(a))) return { d: "deny", why: "git force-push via a +refspec (use --force-with-lease only with explicit developer approval)" };
      if (args.some(a => a === "--delete" || a === "-d") || args.some(a => /^:[^:]+$/.test(a))) return { d: "ask", why: "deleting a remote branch" };
    }
    if (sub === "reset" && args.includes("--hard")) return { d: "ask", why: "git reset --hard discards uncommitted work" };
    if (sub === "clean" && (flags.has("-f") || flags.has("--force"))) return { d: "ask", why: "git clean -f deletes untracked files" };
    if (sub === "checkout" && (args.includes("--") && args.includes("."))) return { d: "ask", why: "discarding all working-tree changes" };
    if (sub === "branch" && (flags.has("-D"))) return { d: "ask", why: "force-deleting a branch" };
  }
  if ((prog === "sh" || prog === "bash" || prog === "zsh") && seg.fromPipe) return { d: "deny", why: "piping downloaded content into a shell" };
  if (/(^|\s)(drop\s+(table|database|schema)|truncate\s+table)\b/i.test(seg.tokens.join(" "))) return { d: "deny", why: "destructive SQL (DROP/TRUNCATE)" };
  if (/\bdelete\s+from\s+\w+\s*(;|$)/i.test(seg.tokens.join(" "))) return { d: "ask", why: "DELETE without WHERE" };
  if (["chmod","chown"].includes(prog) && (flags.has("-R")) && operands.some(o => SYSTEM_DIRS.has(o))) return { d: "deny", why: "recursive permission change on a system path" };

  // Secrets: content-reading programs touching secret files, or redirects from them
  const touchesSecret = seg.tokens.some(t => isSecretPath(t)) || seg.tokens.some(t => /^<.+/.test(t) && isSecretPath(t.slice(1)))
    || seg.tokens.some(t => t.includes(":") && isSecretPath(t.split(":").pop())); // git rev:path, e.g. HEAD:.env
  if (touchesSecret && prog === "git" && GIT_CONTENT_READERS.has(args.find(a => !a.startsWith("-"))))
    return { d: "deny", why: "reading a secret/credential file through git (diff/show/log/blame/grep/cat-file)" };
  if (touchesSecret && (READERS.has(prog) || seg.tokens.some(t => /^<.+/.test(t)) || seg.tokens.includes("<") ))
    return { d: "deny", why: "reading a secret/credential file (.env, keys, credentials)" };
  if (touchesSecret && prog === "git" && ["add","commit"].includes(args.find(a => !a.startsWith("-"))))
    return { d: "deny", why: "staging a secret/credential file" };
  return null;
}

function checkBash(cmd) {
  const segs = segments(cmd);
  for (let i = 0; i < segs.length; i++) {
    const prev = segs[i - 1];
    segs[i].fromPipe = Boolean(prev && prev.pipeTo);
    // curl|sh style
    if (segs[i].fromPipe) {
      const p = programOf(segs[i].tokens).prog;
      const pp = programOf(prev.tokens).prog;
      if (["sh","bash","zsh","python","python3","node","perl","ruby"].includes(p) && ["curl","wget"].includes(pp))
        return { d: "deny", why: "piping a download straight into an interpreter" };
    }
    const r = checkSegment(segs[i], segs[i + 1]);
    if (r) return r;
  }
  // `<<< ` / `< file` style redirects handled per segment; also `$(cat .env)`
  const sub = cmd.match(/\$\(([^)]*)\)|`([^`]*)`/g) || [];
  for (const s of sub) { const r = checkBash(s.replace(/^\$\(|\)$|^`|`$/g, "")); if (r) return r; }
  return null;
}

function main() {
  const input = readStdinJson();
  const tool = input.tool_name || "";
  const ti = input.tool_input || {};
  let res = null;
  if (tool === "Bash") res = checkBash(ti.command || "");
  else {
    const p = ti.file_path || ti.path || ti.notebook_path || "";
    if (isSecretPath(p)) res = { d: "deny", why: `${tool} on a secret/credential file (${p})` };
  }
  if (!res) process.exit(0);
  const reason = `[copilot-kit guard] ${res.why}. See security-rules.md. If this is genuinely required, ask the developer to run it themselves or approve it explicitly.`;
  if (res.d === "ask") {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } }));
    process.exit(0);
  }
  process.stderr.write(reason + "\n");
  process.exit(2);
}
if (require.main === module) main();
module.exports = { checkBash, isSecretPath };
