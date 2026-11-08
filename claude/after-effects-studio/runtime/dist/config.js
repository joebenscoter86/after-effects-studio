import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as os from "node:os";
import * as path from "node:path";
function findPackageRoot(startDir) {
  let dir = startDir;
  for (; ; ) {
    if (existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`mcp-aftereffects: no package.json found above ${startDir}`);
    }
    dir = parent;
  }
}
const PACKAGE_ROOT = findPackageRoot(path.dirname(fileURLToPath(import.meta.url)));
const DISPATCHER_JSX = path.join(PACKAGE_ROOT, "jsx", "dispatcher.jsx");
const RUNTIME_ROOT = path.join(os.tmpdir(), "mcp-aftereffects");
const DEFAULT_RUNTIME_DIR = path.join(RUNTIME_ROOT, "runtime");
const RUNTIME_POINTER_PATH = path.join(RUNTIME_ROOT, "runtime-dir.txt");
const RUNTIME_DIR_MODE = 448;
function resolveRuntimeDir() {
  const override = process.env.AE_MCP_RUNTIME_DIR?.trim();
  return override ? path.resolve(override) : DEFAULT_RUNTIME_DIR;
}
const RUNTIME_DIR = resolveRuntimeDir();
const RUNTIME_DIR_IS_CUSTOM = path.resolve(RUNTIME_DIR) !== path.resolve(DEFAULT_RUNTIME_DIR);
const REQUEST_PREFIX = "request-";
const RESPONSE_PREFIX = "response-";
function requestPathFor(id) {
  return path.join(RUNTIME_DIR, `${REQUEST_PREFIX}${id}.json`);
}
function responsePathFor(id) {
  return path.join(RUNTIME_DIR, `${RESPONSE_PREFIX}${id}.json`);
}
const STALE_RUNTIME_FILE_MS = 60 * 60 * 1e3;
function rejectedOutputPath(outPath) {
  const abs = path.resolve(outPath);
  const roots = [path.resolve(RUNTIME_DIR), path.resolve(RUNTIME_ROOT)];
  for (const root of roots) {
    const rel = path.relative(root, abs);
    const inside = rel === "" || !rel.startsWith("..") && !path.isAbsolute(rel);
    if (inside) {
      return `refusing to write inside the mcp-aftereffects IPC mailbox (${root}). That directory is the transport's trust boundary \u2014 pick a path outside it.`;
    }
  }
  return null;
}
function looseWriteScope(dir) {
  if (process.platform === "win32") return null;
  let mode;
  try {
    mode = statSync(dir).mode;
  } catch {
    return null;
  }
  if ((mode & 18) === 0) return null;
  return { scope: (mode & 2) !== 0 ? "world" : "group", mode: mode & 511 };
}
function unsafeRuntimeDirWarning(dir = RUNTIME_DIR) {
  const loose = looseWriteScope(dir);
  if (loose === null) return null;
  return `mailbox ${dir} is ${loose.scope}-writable (mode ${loose.mode.toString(8)}). Any local account that can write there can execute code inside After Effects. Fix with: chmod 700 ${JSON.stringify(dir)} \u2014 or unset AE_MCP_RUNTIME_DIR to use the per-user default.`;
}
function unsafePointerDirWarning(dir = RUNTIME_ROOT) {
  const loose = looseWriteScope(dir);
  if (loose === null) return null;
  return `mailbox pointer directory ${dir} is ${loose.scope}-writable (mode ${loose.mode.toString(8)}). It holds ${path.basename(RUNTIME_POINTER_PATH)}, which the dispatcher follows to locate the mailbox, so any local account that can write there can point After Effects at a mailbox of its own. Fix with: chmod 700 ${JSON.stringify(dir)}`;
}
function uncheckedMailboxAclWarning(platform = process.platform) {
  if (platform !== "win32" || !RUNTIME_DIR_IS_CUSTOM) return null;
  return `mailbox ${RUNTIME_DIR} comes from AE_MCP_RUNTIME_DIR and its Windows ACL is not verified here. Any account that can write there can execute code inside After Effects \u2014 keep the mailbox on a per-user path (not a shared, world-writable, or synced folder), or unset AE_MCP_RUNTIME_DIR to use the default under the per-user temp dir.`;
}
function runtimeDirWarnings() {
  const warnings = [unsafeRuntimeDirWarning(RUNTIME_DIR)];
  if (path.resolve(RUNTIME_DIR) !== path.resolve(RUNTIME_ROOT)) {
    warnings.push(unsafePointerDirWarning(RUNTIME_ROOT));
  }
  warnings.push(uncheckedMailboxAclWarning());
  return warnings.filter((w) => w !== null);
}
const DEFAULT_AE_PATHS_WIN32 = [
  "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe",
  "C:/Program Files/Adobe/Adobe After Effects 2025/Support Files/AfterFX.exe",
  "C:/Program Files/Adobe/Adobe After Effects 2024/Support Files/AfterFX.exe"
];
const DEFAULT_AE_PATHS_DARWIN = [
  "/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app",
  "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app",
  "/Applications/Adobe After Effects 2024/Adobe After Effects 2024.app"
];
const AE_RELEASE_DIR = /^Adobe After Effects (\d{4})$/;
function discoverAfterFxPaths(platform = process.platform, root = platform === "darwin" ? "/Applications" : "C:/Program Files/Adobe") {
  let names;
  try {
    names = readdirSync(root);
  } catch {
    return [];
  }
  return names.map((name) => ({ name, year: AE_RELEASE_DIR.exec(name)?.[1] })).filter((e) => e.year !== void 0).sort((a, b) => Number(b.year) - Number(a.year)).map(({ name, year }) => platform === "darwin" ? path.join(root, name, `Adobe After Effects ${year}.app`) : path.join(root, name, "Support Files", "AfterFX.exe")).filter((candidate) => existsSync(candidate));
}
function resolveAfterFxPath(platform = process.platform, root) {
  for (const env of [process.env.AE_MCP_EXE, process.env.AE_EXE]) {
    if (env && existsSync(env)) return env;
  }
  const discovered = discoverAfterFxPaths(platform, root);
  if (discovered.length) return discovered[0];
  const candidates = platform === "darwin" ? DEFAULT_AE_PATHS_DARWIN : DEFAULT_AE_PATHS_WIN32;
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    platform === "darwin" ? 'Could not locate After Effects. Set the AE_MCP_EXE env var to the .app bundle, e.g. "/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app"' : 'Could not locate AfterFX.exe. Set the AE_MCP_EXE env var to the full path, e.g. "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe"'
  );
}
const DEFAULT_TIMEOUT_MS = 6e4;
const POLL_INTERVAL_MS = 80;
const BUSY_LOCK_PATH = path.join(RUNTIME_DIR, "dispatcher-busy.lock");
const BUSY_LOCK_STALE_MS = 9e4;
const BUSY_LOCK_REFRESH_MS = 15e3;
const RELAUNCH_UNCONSUMED_AFTER_MS = 2500;
const MAX_LAUNCH_ATTEMPTS = 3;
const INSTANCES_DIRNAME = "instances";
const INSTANCES_DIR = path.join(RUNTIME_DIR, INSTANCES_DIRNAME);
const HEARTBEAT_FILENAME = "heartbeat.json";
function instanceDirFor(id) {
  return path.join(INSTANCES_DIR, id);
}
const HEARTBEAT_STALE_MS = 5e3;
const HEARTBEAT_BUSY_STALE_MS = 15 * 6e4;
const INSTANCE_DIR_SWEEP_MS = STALE_RUNTIME_FILE_MS;
const LIVENESS_CHECK_MS = 1e3;
const AGENT_JSX = path.join(PACKAGE_ROOT, "jsx", "agent.jsx");
const AGENT_STUB_FILENAME = "mcp-aftereffects-agent.jsx";
const INSTANCE_ID_MAX_LENGTH = 64;
function sanitizeInstanceId(raw) {
  if (raw === null || raw === void 0) return null;
  let s = raw.trim();
  if (s.length === 0) return null;
  s = s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  if (s.length > INSTANCE_ID_MAX_LENGTH) s = s.slice(0, INSTANCE_ID_MAX_LENGTH);
  return s.length > 0 ? s : null;
}
function instanceTargetFromEnv(env = process.env) {
  const value = env.AE_MCP_INSTANCE?.trim();
  return value ? value : null;
}
const PHANTOM_LAUNCH_MS = 4e3;
export {
  AGENT_JSX,
  AGENT_STUB_FILENAME,
  BUSY_LOCK_PATH,
  BUSY_LOCK_REFRESH_MS,
  BUSY_LOCK_STALE_MS,
  DEFAULT_RUNTIME_DIR,
  DEFAULT_TIMEOUT_MS,
  DISPATCHER_JSX,
  HEARTBEAT_BUSY_STALE_MS,
  HEARTBEAT_FILENAME,
  HEARTBEAT_STALE_MS,
  INSTANCES_DIR,
  INSTANCES_DIRNAME,
  INSTANCE_DIR_SWEEP_MS,
  INSTANCE_ID_MAX_LENGTH,
  LIVENESS_CHECK_MS,
  MAX_LAUNCH_ATTEMPTS,
  PACKAGE_ROOT,
  PHANTOM_LAUNCH_MS,
  POLL_INTERVAL_MS,
  RELAUNCH_UNCONSUMED_AFTER_MS,
  REQUEST_PREFIX,
  RESPONSE_PREFIX,
  RUNTIME_DIR,
  RUNTIME_DIR_IS_CUSTOM,
  RUNTIME_DIR_MODE,
  RUNTIME_POINTER_PATH,
  RUNTIME_ROOT,
  STALE_RUNTIME_FILE_MS,
  discoverAfterFxPaths,
  instanceDirFor,
  instanceTargetFromEnv,
  rejectedOutputPath,
  requestPathFor,
  resolveAfterFxPath,
  responsePathFor,
  runtimeDirWarnings,
  sanitizeInstanceId,
  uncheckedMailboxAclWarning,
  unsafePointerDirWarning,
  unsafeRuntimeDirWarning
};
