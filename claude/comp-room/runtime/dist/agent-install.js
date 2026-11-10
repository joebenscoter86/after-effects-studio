import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { AGENT_JSX, AGENT_STUB_FILENAME, RUNTIME_DIR, RUNTIME_ROOT } from "./config.js";
import { jsxPath } from "./transport/launcher.js";
function aeProfileRoot(platform = process.platform, env = process.env, home = os.homedir()) {
  if (platform === "win32") {
    const appData = env.APPDATA ?? path.join(home, "AppData", "Roaming");
    return path.join(appData, "Adobe", "After Effects");
  }
  return path.join(home, "Library", "Preferences", "Adobe", "After Effects");
}
async function listAeVersionDirs(root) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const versions = entries.filter((e) => e.isDirectory() && /^\d+\.\d+$/.test(e.name)).map((e) => e.name);
  return versions.sort((a, b) => compareVersions(b, a));
}
function compareVersions(a, b) {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}
function startupDirFor(root, version) {
  return path.join(root, version, "Scripts", "Startup");
}
function stubSource(agentJsx = AGENT_JSX, runtimeRoot = RUNTIME_ROOT, mailbox = RUNTIME_DIR) {
  return [
    "// mcp-aftereffects resident agent bootstrap.",
    "// Written by `mcp-aftereffects install-agent`; remove with `uninstall-agent`.",
    "// Loads jsx/agent.jsx from the package so a package update takes effect at",
    "// the next After Effects launch without reinstalling this stub. The mailbox",
    "// path below is fixed here on purpose; re-run install-agent to change it.",
    "(function () {",
    `    var agentFile = new File(${jsxPath(agentJsx)});`,
    "    if (!agentFile.exists) return;",
    `    var runtimeRoot = ${jsxPath(runtimeRoot)};`,
    "    $.global.AE_MCP_RUNTIME_ROOT_OVERRIDE = runtimeRoot;",
    `    $.global.AE_MCP_AGENT_MAILBOX = ${jsxPath(mailbox)};`,
    "    try {",
    "        $.evalFile(agentFile);",
    "    } catch (eLoad) {",
    "        try {",
    '            var why = (eLoad && eLoad.message) ? String(eLoad.message) : "unknown error";',
    '            if (eLoad && eLoad.line) why += " (line " + String(eLoad.line) + ")";',
    '            var log = new File(runtimeRoot + "/agent-fatal.log");',
    '            log.encoding = "UTF-8";',
    '            if (log.open("a")) {',
    '                log.writeln("[" + new Date().toString() + "] stub: could not load " + agentFile.fsName + ": " + why);',
    "                log.close();",
    "            }",
    "        } catch (eLog) { /* nothing left to try */ }",
    "    }",
    "})();",
    ""
  ].join("\n");
}
async function targetStartupDirs(opts) {
  if (opts.dir) return [{ version: "custom", dir: path.resolve(opts.dir) }];
  const root = aeProfileRoot(opts.platform, opts.env, opts.home);
  const versions = opts.version ? [opts.version] : await listAeVersionDirs(root);
  return versions.map((version) => ({ version, dir: startupDirFor(root, version) }));
}
async function agentInstallStatus(opts = {}) {
  const expected = stubSource();
  const statuses = [];
  for (const { version, dir } of await targetStartupDirs(opts)) {
    const stubPath = path.join(dir, AGENT_STUB_FILENAME);
    let installed = false;
    let current = false;
    try {
      const actual = await fs.readFile(stubPath, "utf8");
      installed = true;
      current = actual === expected;
    } catch {
    }
    statuses.push({ version, stubPath, installed, current });
  }
  return statuses;
}
async function installAgent(opts = {}) {
  const report = { written: [], unchanged: [] };
  const targets = await targetStartupDirs(opts);
  if (targets.length === 0) {
    throw new Error(
      `no After Effects version folder found under ${aeProfileRoot(opts.platform, opts.env, opts.home)} \u2014 launch After Effects once so it creates its profile, or pass --dir <Scripts/Startup folder>`
    );
  }
  const source = stubSource();
  for (const { dir } of targets) {
    const stubPath = path.join(dir, AGENT_STUB_FILENAME);
    try {
      if (await fs.readFile(stubPath, "utf8") === source) {
        report.unchanged.push(stubPath);
        continue;
      }
    } catch {
    }
    report.written.push(stubPath);
    if (opts.dryRun) continue;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(stubPath, source, "utf8");
  }
  return report;
}
async function uninstallAgent(opts = {}) {
  const removed = [];
  for (const { dir } of await targetStartupDirs(opts)) {
    const stubPath = path.join(dir, AGENT_STUB_FILENAME);
    try {
      await fs.access(stubPath);
    } catch {
      continue;
    }
    removed.push(stubPath);
    if (!opts.dryRun) await fs.unlink(stubPath);
  }
  return { removed };
}
export {
  aeProfileRoot,
  agentInstallStatus,
  installAgent,
  listAeVersionDirs,
  startupDirFor,
  stubSource,
  uninstallAgent
};
