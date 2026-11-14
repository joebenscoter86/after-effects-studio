import { __esmMin } from "./rolldown-runtime.js";
import { describeInstance, init_instances, init_launcher, jsxPath, listInstances } from "./transport-1.js";
import { spawnSync } from "node:child_process";
import { existsSync, promises, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as os$1 from "node:os";
import * as path$1 from "node:path";

// config.js
function findPackageRoot(startDir) {
	let dir = startDir;
	for (;;) {
		if (existsSync(path$1.join(dir, "package.json"))) return dir;
		const parent = path$1.dirname(dir);
		if (parent === dir) throw new Error(`mcp-aftereffects: no package.json found above ${startDir}`);
		dir = parent;
	}
}
function resolveRuntimeDir() {
	const override = process.env.AE_MCP_RUNTIME_DIR?.trim();
	return override ? path$1.resolve(override) : DEFAULT_RUNTIME_DIR;
}
function requestPathFor(id) {
	return path$1.join(RUNTIME_DIR, `${REQUEST_PREFIX}${id}.json`);
}
function responsePathFor(id) {
	return path$1.join(RUNTIME_DIR, `${RESPONSE_PREFIX}${id}.json`);
}
function rejectedOutputPath(outPath) {
	const abs = path$1.resolve(outPath);
	const roots = [path$1.resolve(RUNTIME_DIR), path$1.resolve(RUNTIME_ROOT)];
	for (const root of roots) {
		const rel = path$1.relative(root, abs);
		if (rel === "" || !rel.startsWith("..") && !path$1.isAbsolute(rel)) return `refusing to write inside the mcp-aftereffects IPC mailbox (${root}). That directory is the transport's trust boundary \u2014 pick a path outside it.`;
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
	return {
		scope: (mode & 2) !== 0 ? "world" : "group",
		mode: mode & 511
	};
}
function unsafeRuntimeDirWarning(dir = RUNTIME_DIR) {
	const loose = looseWriteScope(dir);
	if (loose === null) return null;
	return `mailbox ${dir} is ${loose.scope}-writable (mode ${loose.mode.toString(8)}). Any local account that can write there can execute code inside After Effects. Fix with: chmod 700 ${JSON.stringify(dir)} \u2014 or unset AE_MCP_RUNTIME_DIR to use the per-user default.`;
}
function unsafePointerDirWarning(dir = RUNTIME_ROOT) {
	const loose = looseWriteScope(dir);
	if (loose === null) return null;
	return `mailbox pointer directory ${dir} is ${loose.scope}-writable (mode ${loose.mode.toString(8)}). It holds ${path$1.basename(RUNTIME_POINTER_PATH)}, which the dispatcher follows to locate the mailbox, so any local account that can write there can point After Effects at a mailbox of its own. Fix with: chmod 700 ${JSON.stringify(dir)}`;
}
function uncheckedMailboxAclWarning(platform = process.platform) {
	if (platform !== "win32" || !RUNTIME_DIR_IS_CUSTOM) return null;
	return `mailbox ${RUNTIME_DIR} comes from AE_MCP_RUNTIME_DIR and its Windows ACL is not verified here. Any account that can write there can execute code inside After Effects \u2014 keep the mailbox on a per-user path (not a shared, world-writable, or synced folder), or unset AE_MCP_RUNTIME_DIR to use the default under the per-user temp dir.`;
}
function runtimeDirWarnings() {
	const warnings = [unsafeRuntimeDirWarning(RUNTIME_DIR)];
	if (path$1.resolve(RUNTIME_DIR) !== path$1.resolve(RUNTIME_ROOT)) warnings.push(unsafePointerDirWarning(RUNTIME_ROOT));
	warnings.push(uncheckedMailboxAclWarning());
	return warnings.filter((w) => w !== null);
}
function runningAfterFxApps(psOutput) {
	let text = psOutput;
	if (text === void 0) text = spawnSync("ps", ["-axo", "command="], {
		encoding: "utf8",
		timeout: 2e3
	}).stdout ?? "";
	const apps = /* @__PURE__ */ new Set();
	for (const line of text.split("\n")) {
		const m = AE_APP_IN_PROCESS.exec(line.trim());
		if (m?.[1]) apps.add(m[1]);
	}
	return [...apps];
}
function discoverAfterFxPaths(platform = process.platform, root = platform === "darwin" ? "/Applications" : "C:/Program Files/Adobe") {
	let names;
	try {
		names = readdirSync(root);
	} catch {
		return [];
	}
	return names.map((name) => ({
		name,
		year: AE_RELEASE_DIR.exec(name)?.[1]
	})).filter((e) => e.year !== void 0 && Number(e.year) >= MIN_AE_YEAR).sort((a, b) => Number(b.year) - Number(a.year)).map(({ name, year }) => platform === "darwin" ? path$1.join(root, name, `Adobe After Effects ${year}.app`) : path$1.join(root, name, "Support Files", "AfterFX.exe")).filter((candidate) => existsSync(candidate));
}
function resolveAfterFxPath(platform = process.platform, root, running = () => platform === "darwin" ? runningAfterFxApps() : []) {
	for (const env of [process.env.AE_MCP_EXE, process.env.AE_EXE]) if (env && existsSync(env)) return env;
	const discovered = discoverAfterFxPaths(platform, root);
	const yearOf = (p) => Number(/Adobe After Effects (\d{4})/.exec(p)?.[1]);
	const live = running().filter((app) => existsSync(app));
	const supported = SUPPORTED_AE_YEARS.flatMap((y) => discovered.filter((p) => yearOf(p) === y));
	const ordered = [
		...live,
		...supported,
		...discovered
	];
	if (ordered.length) return ordered[0];
	const candidates = platform === "darwin" ? DEFAULT_AE_PATHS_DARWIN : DEFAULT_AE_PATHS_WIN32;
	for (const candidate of candidates) if (existsSync(candidate)) return candidate;
	throw new Error(platform === "darwin" ? "Could not locate After Effects. Set the AE_MCP_EXE env var to the .app bundle, e.g. \"/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app\"" : "Could not locate AfterFX.exe. Set the AE_MCP_EXE env var to the full path, e.g. \"C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe\"");
}
function instanceDirFor(id) {
	return path$1.join(INSTANCES_DIR, id);
}
function sanitizeInstanceId(raw) {
	if (raw === null || raw === void 0) return null;
	let s = raw.trim();
	if (s.length === 0) return null;
	s = s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
	if (s.length > 64) s = s.slice(0, 64);
	return s.length > 0 ? s : null;
}
function instanceTargetFromEnv(env = process.env) {
	const value = env.AE_MCP_INSTANCE?.trim();
	return value ? value : null;
}
var PACKAGE_ROOT, DISPATCHER_JSX, RUNTIME_ROOT, DEFAULT_RUNTIME_DIR, RUNTIME_POINTER_PATH, RUNTIME_DIR, RUNTIME_DIR_IS_CUSTOM, REQUEST_PREFIX, RESPONSE_PREFIX, STALE_RUNTIME_FILE_MS, DEFAULT_AE_PATHS_WIN32, DEFAULT_AE_PATHS_DARWIN, AE_RELEASE_DIR, SUPPORTED_AE_YEARS, MIN_AE_YEAR, AE_APP_IN_PROCESS, DEFAULT_TIMEOUT_MS, BUSY_LOCK_PATH, BUSY_LOCK_STALE_MS, BUSY_LOCK_REFRESH_MS, RELAUNCH_UNCONSUMED_AFTER_MS, INSTANCES_DIRNAME, INSTANCES_DIR, HEARTBEAT_FILENAME, HEARTBEAT_STALE_MS, HEARTBEAT_BUSY_STALE_MS, INSTANCE_DIR_SWEEP_MS, LIVENESS_CHECK_MS, AGENT_JSX, AGENT_STUB_FILENAME, INSTANCE_ID_MAX_LENGTH, PHANTOM_LAUNCH_MS;
function init_config() {
	return (init_config = __esmMin((() => {
		PACKAGE_ROOT = findPackageRoot(path$1.dirname(fileURLToPath(import.meta.url)));
		DISPATCHER_JSX = path$1.join(PACKAGE_ROOT, "jsx", "dispatcher.jsx");
		RUNTIME_ROOT = path$1.join(os$1.tmpdir(), "mcp-aftereffects");
		DEFAULT_RUNTIME_DIR = path$1.join(RUNTIME_ROOT, "runtime");
		RUNTIME_POINTER_PATH = path$1.join(RUNTIME_ROOT, "runtime-dir.txt");
		RUNTIME_DIR = resolveRuntimeDir();
		RUNTIME_DIR_IS_CUSTOM = path$1.resolve(RUNTIME_DIR) !== path$1.resolve(DEFAULT_RUNTIME_DIR);
		REQUEST_PREFIX = "request-";
		RESPONSE_PREFIX = "response-";
		STALE_RUNTIME_FILE_MS = 36e5;
		DEFAULT_AE_PATHS_WIN32 = [
			"C:/Program Files/Adobe/Adobe After Effects 2027/Support Files/AfterFX.exe",
			"C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe",
			"C:/Program Files/Adobe/Adobe After Effects 2025/Support Files/AfterFX.exe",
			"C:/Program Files/Adobe/Adobe After Effects 2024/Support Files/AfterFX.exe"
		];
		DEFAULT_AE_PATHS_DARWIN = [
			"/Applications/Adobe After Effects 2027/Adobe After Effects 2027.app",
			"/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app",
			"/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app",
			"/Applications/Adobe After Effects 2024/Adobe After Effects 2024.app"
		];
		AE_RELEASE_DIR = /^Adobe After Effects (\d{4})$/;
		SUPPORTED_AE_YEARS = [
			2027,
			2026,
			2025,
			2024
		];
		MIN_AE_YEAR = 2024;
		AE_APP_IN_PROCESS = /^(.*\/Adobe After Effects \d{4}\.app)\/Contents\/MacOS\/After Effects(?:\s|$)/;
		DEFAULT_TIMEOUT_MS = 6e4;
		BUSY_LOCK_PATH = path$1.join(RUNTIME_DIR, "dispatcher-busy.lock");
		BUSY_LOCK_STALE_MS = 9e4;
		BUSY_LOCK_REFRESH_MS = 15e3;
		RELAUNCH_UNCONSUMED_AFTER_MS = 2500;
		INSTANCES_DIRNAME = "instances";
		INSTANCES_DIR = path$1.join(RUNTIME_DIR, INSTANCES_DIRNAME);
		HEARTBEAT_FILENAME = "heartbeat.json";
		HEARTBEAT_STALE_MS = 5e3;
		HEARTBEAT_BUSY_STALE_MS = 9e5;
		INSTANCE_DIR_SWEEP_MS = STALE_RUNTIME_FILE_MS;
		LIVENESS_CHECK_MS = 1e3;
		AGENT_JSX = path$1.join(PACKAGE_ROOT, "jsx", "agent.jsx");
		AGENT_STUB_FILENAME = "mcp-aftereffects-agent.jsx";
		INSTANCE_ID_MAX_LENGTH = 64;
		PHANTOM_LAUNCH_MS = 4e3;
	})))();
}

// agent-install.js
function aeProfileRoot(platform = process.platform, env = process.env, home = os$1.homedir()) {
	if (platform === "win32") {
		const appData = env.APPDATA ?? path$1.join(home, "AppData", "Roaming");
		return path$1.join(appData, "Adobe", "After Effects");
	}
	return path$1.join(home, "Library", "Preferences", "Adobe", "After Effects");
}
async function listAeVersionDirs(root) {
	let entries;
	try {
		entries = await promises.readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	return entries.filter((e) => e.isDirectory() && /^\d+\.\d+$/.test(e.name)).map((e) => e.name).sort((a, b) => compareVersions(b, a));
}
function compareVersions(a, b) {
	const [aMajor, aMinor] = a.split(".").map(Number);
	const [bMajor, bMinor] = b.split(".").map(Number);
	return aMajor - bMajor || aMinor - bMinor;
}
function startupDirFor(root, version) {
	return path$1.join(root, version, "Scripts", "Startup");
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
		"            var why = (eLoad && eLoad.message) ? String(eLoad.message) : \"unknown error\";",
		"            if (eLoad && eLoad.line) why += \" (line \" + String(eLoad.line) + \")\";",
		"            var log = new File(runtimeRoot + \"/agent-fatal.log\");",
		"            log.encoding = \"UTF-8\";",
		"            if (log.open(\"a\")) {",
		"                log.writeln(\"[\" + new Date().toString() + \"] stub: could not load \" + agentFile.fsName + \": \" + why);",
		"                log.close();",
		"            }",
		"        } catch (eLog) { /* nothing left to try */ }",
		"    }",
		"})();",
		""
	].join("\n");
}
async function targetStartupDirs(opts) {
	if (opts.dir) return [{
		version: "custom",
		dir: path$1.resolve(opts.dir)
	}];
	const root = aeProfileRoot(opts.platform, opts.env, opts.home);
	return (opts.version ? [opts.version] : await listAeVersionDirs(root)).map((version) => ({
		version,
		dir: startupDirFor(root, version)
	}));
}
async function agentInstallStatus(opts = {}) {
	const expected = stubSource();
	const statuses = [];
	for (const { version, dir } of await targetStartupDirs(opts)) {
		const stubPath = path$1.join(dir, AGENT_STUB_FILENAME);
		let installed = false;
		let current = false;
		try {
			const actual = await promises.readFile(stubPath, "utf8");
			installed = true;
			current = actual === expected;
		} catch {}
		statuses.push({
			version,
			stubPath,
			installed,
			current
		});
	}
	return statuses;
}
async function installAgent(opts = {}) {
	const report = {
		written: [],
		unchanged: []
	};
	const targets = await targetStartupDirs(opts);
	if (targets.length === 0) throw new Error(`no After Effects version folder found under ${aeProfileRoot(opts.platform, opts.env, opts.home)} \u2014 launch After Effects once so it creates its profile, or pass --dir <Scripts/Startup folder>`);
	const source = stubSource();
	for (const { dir } of targets) {
		const stubPath = path$1.join(dir, AGENT_STUB_FILENAME);
		try {
			if (await promises.readFile(stubPath, "utf8") === source) {
				report.unchanged.push(stubPath);
				continue;
			}
		} catch {}
		report.written.push(stubPath);
		if (opts.dryRun) continue;
		await promises.mkdir(dir, { recursive: true });
		await promises.writeFile(stubPath, source, "utf8");
	}
	return report;
}
async function uninstallAgent(opts = {}) {
	const removed = [];
	for (const { dir } of await targetStartupDirs(opts)) {
		const stubPath = path$1.join(dir, AGENT_STUB_FILENAME);
		try {
			await promises.access(stubPath);
		} catch {
			continue;
		}
		removed.push(stubPath);
		if (!opts.dryRun) await promises.unlink(stubPath);
	}
	return { removed };
}
function init_agent_install() {
	return (init_agent_install = __esmMin((() => {
		init_config();
		init_launcher();
	})))();
}

// cli.js
function parseCliArgs(argv) {
	const [command = "help", ...rest] = argv;
	const parsed = {
		command,
		dryRun: false,
		unknown: []
	};
	for (let i = 0; i < rest.length; i++) {
		const arg = rest[i];
		if (arg === "--dry-run") parsed.dryRun = true;
		else if (arg === "--version" && rest[i + 1]) parsed.version = rest[++i];
		else if (arg === "--dir" && rest[i + 1]) parsed.dir = rest[++i];
		else parsed.unknown.push(arg);
	}
	return parsed;
}
async function runCli(argv, out = (line) => process.stdout.write(`${line}
`)) {
	const args = parseCliArgs(argv);
	if (args.unknown.length > 0) {
		out(`unknown argument(s): ${args.unknown.join(" ")}
`);
		out(USAGE);
		return 2;
	}
	const opts = {
		version: args.version,
		dir: args.dir,
		dryRun: args.dryRun
	};
	try {
		switch (args.command) {
			case "help":
			case "--help":
			case "-h":
				out(USAGE);
				return 0;
			case "install-agent": {
				const report = await installAgent(opts);
				for (const p of report.written) out(`${args.dryRun ? "would write" : "wrote"}    ${p}`);
				for (const p of report.unchanged) out(`up to date  ${p}`);
				if (report.written.length > 0 && !args.dryRun) {
					out("");
					out("Restart After Effects for the agent to load. Then `mcp-aftereffects instances` lists it.");
				}
				return 0;
			}
			case "uninstall-agent": {
				const report = await uninstallAgent(opts);
				if (report.removed.length === 0) out("nothing to remove");
				for (const p of report.removed) out(`${args.dryRun ? "would remove" : "removed"}  ${p}`);
				return 0;
			}
			case "agent-status": {
				const statuses = await agentInstallStatus(opts);
				if (statuses.length === 0) {
					out(`no After Effects version folder under ${aeProfileRoot()}`);
					return 1;
				}
				for (const s of statuses) {
					const state = !s.installed ? "not installed" : s.current ? "installed" : "installed (stale — run install-agent)";
					out(`${s.version.padEnd(8)} ${state.padEnd(40)} ${s.stubPath}`);
				}
				return 0;
			}
			case "instances": {
				const instances = await listInstances();
				out(`mailbox: ${RUNTIME_DIR}`);
				if (instances.length === 0) {
					out(`no instances registered under ${INSTANCES_DIR} \u2014 is the agent installed and After Effects running?`);
					return 0;
				}
				for (const i of instances) out(`${i.alive ? "live " : "stale"}  ${describeInstance(i)}`);
				return 0;
			}
			default:
				out(`unknown command: ${args.command}
`);
				out(USAGE);
				return 2;
		}
	} catch (err) {
		out(`error: ${err instanceof Error ? err.message : String(err)}`);
		return 1;
	}
}
var USAGE;
function init_cli() {
	return (init_cli = __esmMin((() => {
		init_config();
		init_agent_install();
		init_instances();
		USAGE = `mcp-aftereffects \u2014 MCP server for Adobe After Effects

  mcp-aftereffects                    start the MCP server on stdio (what MCP clients run)
  mcp-aftereffects install-agent      install the resident agent into After Effects' user-level
                                      Scripts/Startup folder(s); needed to drive instances started
                                      with \`AfterFX.exe -m\`. Restart After Effects afterwards.
  mcp-aftereffects uninstall-agent    remove it again
  mcp-aftereffects agent-status       show where the agent is installed and whether it is current
  mcp-aftereffects instances          list the After Effects instances whose agent is live
  mcp-aftereffects help               this text

Options for install-agent / uninstall-agent / agent-status:
  --version <major.minor>   only that After Effects version folder (e.g. 26.3); default: all present
  --dir <path>              an explicit Scripts/Startup folder instead of the profile-derived ones
  --dry-run                 report what would change without writing

Address an instance from the server side with AE_MCP_INSTANCE=<id or project file name>; name an
instance at launch by setting AE_MCP_INSTANCE in the environment that starts AfterFX.exe.
`;
	})))();
}

// errors.js
function isRetryable(code) {
	return RETRYABLE.has(code);
}
function errorEnvelope(code, message, extra = {}) {
	const error = {
		code,
		message,
		retryable: isRetryable(code)
	};
	const hint = extra.hint ?? (code === "TIMEOUT" ? "Inspect the actual After Effects project state before retrying. A write may already have completed." : void 0);
	if (hint !== void 0) error.hint = hint;
	if (extra.details !== void 0) error.details = extra.details;
	if (extra.stack !== void 0 && extra.stack !== null) error.stack = extra.stack;
	if (extra.logs !== void 0 && extra.logs.length > 0) error.logs = extra.logs;
	if (extra.durationMs !== void 0) error.durationMs = extra.durationMs;
	return {
		ok: false,
		error
	};
}
function errorResult(code, message, extra = {}) {
	const envelope = errorEnvelope(code, message, extra);
	const lines = [`[${code}] ${message}`];
	if (envelope.error.hint) lines.push(`hint: ${envelope.error.hint}`);
	if (envelope.error.details) lines.push(JSON.stringify(envelope.error.details, null, 2));
	if (envelope.error.stack) lines.push(envelope.error.stack);
	return {
		content: [{
			type: "text",
			text: lines.join("\n")
		}],
		structuredContent: envelope,
		isError: true
	};
}
var RETRYABLE;
function init_errors() {
	return (init_errors = __esmMin((() => {
		RETRYABLE = /* @__PURE__ */ new Set();
	})))();
}

// policy.js
function evalRunEnabled() {
	if (readOnlyMode()) return false;
	return process.env.AE_MCP_ENABLE_EVAL === "1";
}
function readOnlyMode() {
	return process.env.AE_MCP_READONLY === "1";
}
function allowedCategories() {
	const raw = process.env.AE_MCP_ALLOW_CATEGORIES?.trim();
	if (!raw) return null;
	const categories = raw.split(",").map((s) => s.trim()).filter(Boolean);
	return categories.length > 0 ? new Set(categories) : null;
}
function denyOperation(op) {
	if (readOnlyMode() && !op.readOnly) return {
		message: `operation '${op.name}' modifies the project and AE_MCP_READONLY=1 is set`,
		hint: "Unset AE_MCP_READONLY to allow mutations, or use a read-only operation (ae_catalog lists only those while read-only mode is on)."
	};
	const allowed = allowedCategories();
	if (allowed && !allowed.has(op.category)) return {
		message: `operation category '${op.category}' is not in AE_MCP_ALLOW_CATEGORIES`,
		hint: `Allowed categories: ${Array.from(allowed).sort().join(", ")}`
	};
	if (op.category === "eval" && !evalRunEnabled()) return EVAL_DENIAL;
	return null;
}
function denyUnregisteredOperation(name) {
	return name === "eval.run" && !evalRunEnabled() ? EVAL_DENIAL : null;
}
function denyUnregisteredCategory(category) {
	return category === "eval" && !evalRunEnabled() ? EVAL_DENIAL : null;
}
function denyTool(name, blockedInReadOnly) {
	if (readOnlyMode() && blockedInReadOnly) return {
		message: `tool '${name}' modifies the project and AE_MCP_READONLY=1 is set`,
		hint: "Unset AE_MCP_READONLY to allow mutations."
	};
	return null;
}
function policySummary() {
	const parts = [];
	parts.push(readOnlyMode() ? "readonly=ON (no project mutations)" : "readonly=off");
	const allowed = allowedCategories();
	parts.push(allowed ? `categories=${Array.from(allowed).sort().join("|")}` : "categories=all");
	parts.push(evalRunEnabled() ? "eval.run=ENABLED" : "eval.run=disabled");
	return parts.join(", ");
}
var EVAL_DENIAL;
function init_policy() {
	return (init_policy = __esmMin((() => {
		EVAL_DENIAL = {
			message: "eval.run is disabled on this server",
			hint: "Set AE_MCP_ENABLE_EVAL=1 (and unset AE_MCP_READONLY) to allow arbitrary ExtendScript, or use a dedicated operation from ae_catalog."
		};
	})))();
}

// registry.js
function registerOp(op) {
	if (op.appConfig && !op.params.some((p) => p.name === APP_CONFIG_CONFIRM_PARAM.name)) op.params = [...op.params, APP_CONFIG_CONFIRM_PARAM];
	operations.set(op.name, op);
}
function denyAppConfig(op, args) {
	if (!op.appConfig || args.confirm === true) return null;
	return `'${op.name}' changes the user's After Effects application configuration, which persists beyond this project. It runs only with confirm: true \u2014 pass that only when the user explicitly asked for this configuration change.`;
}
function getOp(name) {
	return operations.get(name);
}
function listOps(category) {
	const all = Array.from(operations.values());
	if (!category) return all;
	return all.filter((op) => op.category === category);
}
function wantsUndoGroup(op, args) {
	return op.undoGroup ? op.undoGroup(args) : true;
}
function wantsRollback(op, args) {
	if (!wantsUndoGroup(op, args)) return false;
	return op.rollback ? op.rollback(args) : !op.readOnly;
}
function prepareOp(op, args) {
	return op.prepare ? op.prepare(args) : {
		ok: true,
		args
	};
}
function wantsDialogSuppression(op, args) {
	return op.suppressDialogs ? op.suppressDialogs(args) : true;
}
function jsxVal(v) {
	return JSON.stringify(v === void 0 ? null : v).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function jsxFail(message) {
	return `return { ok: false, error: ${jsxVal(message)} };`;
}
function jsxCompPreamble(args) {
	return `
        var _comp = AE.findCompByNameOrId(${jsxVal(args.comp)});
        if (!_comp) return { ok: false, error: "no comp matching " + ${jsxVal(String(args.comp))} };
    `;
}
function jsxCompLayerPreamble(args) {
	return `
        ${jsxCompPreamble(args)}
        var _layerArg = ${jsxVal(args.layer)};
        var _layer = AE.findLayerInComp(_comp, _layerArg);
        if (!_layer) {
            var _layerDesc = (_layerArg !== null && typeof _layerArg === "object") ? ("id " + _layerArg.id) : _layerArg;
            return { ok: false, error: "no layer matching " + _layerDesc + " (comp has " + _comp.numLayers + " layers)" };
        }
    `;
}
function jsxPropertyLookup(pathArg = "_propPath") {
	return `
        var _node = _layer;
        for (var _pi = 0; _pi < ${pathArg}.length; _pi++) {
            var _next = null;
            try { _next = _node.property(${pathArg}[_pi]); } catch (e) {}
            if (!_next) return { ok: false, error: "property segment '" + ${pathArg}[_pi] + "' not found at depth " + _pi };
            _node = _next;
        }
    `;
}
var operations, APP_CONFIG_CONFIRM_PARAM, AMBIENT_CONTEXT_JSX;
function init_registry() {
	return (init_registry = __esmMin((() => {
		operations = /* @__PURE__ */ new Map();
		APP_CONFIG_CONFIRM_PARAM = {
			name: "confirm",
			type: "boolean",
			description: "Must be true. This operation changes the user's After Effects APPLICATION configuration (it persists beyond the project) — set it only when the user explicitly requested this change, never as a side effect of other work.",
			required: true
		};
		AMBIENT_CONTEXT_JSX = `
    var _ctx = {};
    try {
        var _ai = app.project.activeItem;
            _ctx.project = { numItems: app.project.numItems, dirty: app.project.dirty, file: app.project.file ? app.project.file.fsName.replace(/\\\\/g,"/") : null };
        // Which After Effects instance answered (its resident agent's id), so
        // a session driving several never has to guess where an edit landed.
        try { _ctx.instance = $.global.AE_MCP_AGENT ? $.global.AE_MCP_AGENT.state.id : null; } catch (eInst) { _ctx.instance = null; }
        // Set once a request changed the render queue in this session: undo
        // and rollback refuse until a project is opened or created.
        try { var _sess = $.global.AE_MCP_SESSION; if (_sess && _sess.renderQueueChanged) _ctx.undoBlocked = { reason: "render queue changed by a script in this session", by: _sess.renderQueueChanged.by, at: _sess.renderQueueChanged.at }; } catch (eSess) {}
        if (_ai && _ai instanceof CompItem) {
            _ctx.activeComp = { id: _ai.id, name: _ai.name, width: _ai.width, height: _ai.height, fps: _ai.frameRate, duration: _ai.duration, numLayers: _ai.numLayers };
            var _sel = [];
            for (var _si = 1; _si <= _ai.numLayers; _si++) {
                if (_ai.layer(_si).selected) _sel.push({ index: _si, name: _ai.layer(_si).name });
            }
            _ctx.selectedLayers = _sel;
        } else {
            _ctx.activeComp = null;
            _ctx.selectedLayers = [];
        }
    } catch (eCtx) { _ctx.error = AE.errText(eCtx); }
`;
	})))();
}

// opschema.js
function isPlainObject(v) {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}
function typeMatches(type, v) {
	switch (type) {
		case "string": return typeof v === "string";
		case "number": return typeof v === "number" && Number.isFinite(v);
		case "boolean": return typeof v === "boolean";
		case "array": return Array.isArray(v);
		case "object": return isPlainObject(v);
		case "any": return true;
	}
}
function describeValue(v) {
	if (v === null) return "null";
	if (Array.isArray(v)) return "array";
	if (typeof v === "number" && !Number.isFinite(v)) return "non-finite number";
	return typeof v;
}
function levenshtein(a, b) {
	if (a === b) return 0;
	const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
	const curr = Array.from({ length: b.length + 1 }, () => 0);
	for (let i = 1; i <= a.length; i++) {
		curr[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
		}
		for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
	}
	return prev[b.length];
}
function suggestName(key, candidates) {
	const lowered = key.toLowerCase();
	let best = null;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const candidate of candidates) {
		const distance = levenshtein(lowered, candidate.toLowerCase());
		if (distance < bestDistance) {
			bestDistance = distance;
			best = candidate;
		}
	}
	if (best === null) return null;
	const budget = Math.max(1, Math.floor(Math.max(key.length, best.length) * .4));
	return bestDistance <= budget ? best : null;
}
function summarizeParams(params) {
	return params.map((p) => `${p.name}: ${p.type} (${p.required ? "required" : "optional"}${p.nullable ? ", nullable" : ""})`);
}
function validateOpArgs(op, raw) {
	if (raw === void 0 || raw === null) raw = {};
	if (!isPlainObject(raw)) return {
		ok: false,
		issues: [{
			path: "args",
			message: `must be an object, got ${describeValue(raw)}`
		}]
	};
	const issues = [];
	const declared = op.params;
	const declaredNames = declared.map((p) => p.name);
	for (const param of declared) {
		const value = raw[param.name];
		if (value === void 0) {
			if (param.required) issues.push({
				path: param.name,
				message: `missing required parameter (${param.type}) \u2014 ${param.description}`
			});
			continue;
		}
		if (value === null) {
			if (!param.nullable && param.type !== "any") issues.push({
				path: param.name,
				message: `must be ${param.type}, got null \u2014 omit the key instead of passing null`
			});
			continue;
		}
		if (!typeMatches(param.type, value)) issues.push({
			path: param.name,
			message: `must be ${param.type}, got ${describeValue(value)}`
		});
	}
	for (const key of Object.keys(raw)) {
		if (declaredNames.includes(key)) continue;
		if (raw[key] === void 0) continue;
		const suggestion = suggestName(key, declaredNames);
		issues.push({
			path: key,
			message: suggestion ? `unknown parameter \u2014 did you mean '${suggestion}'?` : `unknown parameter (this operation accepts: ${declaredNames.join(", ") || "no parameters"})`
		});
	}
	if (issues.length > 0) return {
		ok: false,
		issues
	};
	return {
		ok: true,
		value: raw
	};
}
function init_opschema() {
	return (init_opschema = __esmMin((() => {})))();
}

// validate.js
function validateAeProjectDoc(doc) {
	const v = new Validator();
	if (!v.isObject(doc)) {
		v.err("", "document is not an object");
		return {
			ok: false,
			issues: v.issues,
			warnings: v.warnings
		};
	}
	const d = doc;
	if (typeof d.schemaVersion !== "number") v.err("schemaVersion", "missing or not a number");
	else if (d.schemaVersion > 3) v.err("schemaVersion", `document schemaVersion ${d.schemaVersion} is newer than runtime ${3}; refusing to import (use skipValidation to force)`);
	if (!Array.isArray(d.items)) {
		v.err("items", "missing or not an array");
		return {
			ok: v.issues.length === 0,
			issues: v.issues,
			warnings: v.warnings
		};
	}
	const seenIds = /* @__PURE__ */ new Set();
	const folderIds = /* @__PURE__ */ new Set();
	const itemTypeById = /* @__PURE__ */ new Map();
	for (let i = 0; i < d.items.length; i++) {
		const item = d.items[i];
		const base = `items[${i}]`;
		if (!v.isObject(item)) {
			v.err(base, "not an object");
			continue;
		}
		if (typeof item.id !== "number") v.err(`${base}.id`, "missing or not a number");
		else {
			if (seenIds.has(item.id)) v.err(`${base}.id`, `duplicate item id ${item.id}`);
			seenIds.add(item.id);
			itemTypeById.set(item.id, item.type);
			if (item.type === "FolderItem") folderIds.add(item.id);
		}
		if (typeof item.name !== "string") v.err(`${base}.name`, "missing or not a string");
		if (typeof item.type !== "string") v.err(`${base}.type`, "missing or not a string");
		if (item.type !== "FolderItem" && item.type !== "CompItem" && item.type !== "FootageItem" && item.type !== "UnknownItem") v.err(`${base}.type`, `unknown item type: ${item.type}`);
		if (item.parentFolderId !== null && item.parentFolderId !== void 0 && typeof item.parentFolderId !== "number") v.err(`${base}.parentFolderId`, "must be number or null");
		if (item.type === "CompItem") {
			if (typeof item.width !== "number") v.err(`${base}.width`, "missing or not a number");
			if (typeof item.height !== "number") v.err(`${base}.height`, "missing or not a number");
			if (typeof item.duration !== "number") v.err(`${base}.duration`, "missing or not a number");
			if (typeof item.frameRate !== "number") v.err(`${base}.frameRate`, "missing or not a number");
			if (Array.isArray(item.layers)) for (let li = 0; li < item.layers.length; li++) validateLayer(v, `${base}.layers[${li}]`, item.layers[li]);
		} else if (item.type === "FootageItem") {
			if (typeof item.sourceKind !== "string") v.err(`${base}.sourceKind`, "missing or not a string");
			if (item.sourceKind === "solid") {
				if (!Array.isArray(item.color) || item.color.length !== 3) v.err(`${base}.color`, "solid requires [r,g,b]");
			} else if (item.sourceKind === "file") {
				if (item.file !== null && typeof item.file !== "string") v.err(`${base}.file`, "file must be string or null");
			}
		}
	}
	for (let i = 0; i < d.items.length; i++) {
		const item = d.items[i];
		if (item && typeof item.parentFolderId === "number") {
			if (!seenIds.has(item.parentFolderId)) v.warn(`items[${i}].parentFolderId`, `parent id ${item.parentFolderId} not in items list`);
			else if (!folderIds.has(item.parentFolderId)) v.warn(`items[${i}].parentFolderId`, `parent id ${item.parentFolderId} is not a FolderItem`);
		}
	}
	for (let i = 0; i < d.items.length; i++) {
		const item = d.items[i];
		if (item && item.type === "CompItem" && Array.isArray(item.layers)) for (let li = 0; li < item.layers.length; li++) {
			const layer = item.layers[li];
			if (layer && layer.type === "AVLayer" && typeof layer.sourceId === "number") {
				if (!seenIds.has(layer.sourceId)) v.warn(`items[${i}].layers[${li}].sourceId`, `layer source id ${layer.sourceId} not in items list \u2014 layer will be skipped on import`);
			}
		}
	}
	return {
		ok: v.issues.length === 0,
		issues: v.issues,
		warnings: v.warnings
	};
}
function validateLayer(v, path, layer) {
	if (!v.isObject(layer)) {
		v.err(path, "not an object");
		return;
	}
	if (typeof layer.index !== "number") v.err(`${path}.index`, "missing or not a number");
	if (typeof layer.name !== "string") v.err(`${path}.name`, "missing or not a string");
	if (typeof layer.type !== "string") v.err(`${path}.type`, "missing or not a string");
	else if ([
		"AVLayer",
		"TextLayer",
		"ShapeLayer",
		"CameraLayer",
		"LightLayer",
		"Layer"
	].indexOf(layer.type) === -1) v.warn(`${path}.type`, `unknown layer type: ${layer.type}`);
	if (layer.transformGroup) validatePropertyGroup(v, `${path}.transformGroup`, layer.transformGroup);
	if (layer.effectsGroup) validatePropertyGroup(v, `${path}.effectsGroup`, layer.effectsGroup);
	if (layer.masksGroup) validatePropertyGroup(v, `${path}.masksGroup`, layer.masksGroup);
	if (layer.textGroup) validatePropertyGroup(v, `${path}.textGroup`, layer.textGroup);
	if (layer.contentsGroup) validatePropertyGroup(v, `${path}.contentsGroup`, layer.contentsGroup);
	if (layer.markers) validateProperty(v, `${path}.markers`, layer.markers);
	if (layer.timeRemapProperty) validateProperty(v, `${path}.timeRemapProperty`, layer.timeRemapProperty);
}
function validatePropertyGroup(v, path, group) {
	if (!v.isObject(group)) {
		v.err(path, "not an object");
		return;
	}
	if (typeof group.matchName !== "string") v.err(`${path}.matchName`, "missing or not a string");
	if (Array.isArray(group.properties)) for (let i = 0; i < group.properties.length; i++) validateProperty(v, `${path}.properties[${i}]`, group.properties[i]);
	if (Array.isArray(group.groups)) for (let i = 0; i < group.groups.length; i++) validatePropertyGroup(v, `${path}.groups[${i}]`, group.groups[i]);
}
function validateProperty(v, path, prop) {
	if (!v.isObject(prop)) {
		v.err(path, "not an object");
		return;
	}
	if (typeof prop.matchName !== "string") v.err(`${path}.matchName`, "missing or not a string");
	if (Array.isArray(prop.keyframes)) for (let i = 0; i < prop.keyframes.length; i++) validateKeyframe(v, `${path}.keyframes[${i}]`, prop.keyframes[i]);
}
function validateKeyframe(v, path, kf) {
	if (!v.isObject(kf)) {
		v.err(path, "not an object");
		return;
	}
	if (typeof kf.time !== "number") v.err(`${path}.time`, "missing or not a number");
}
var Validator;
function init_validate() {
	return (init_validate = __esmMin((() => {
		Validator = class {
			issues = [];
			warnings = [];
			err(path, message) {
				this.issues.push({
					path,
					message
				});
			}
			warn(path, message) {
				this.warnings.push({
					path,
					message
				});
			}
			isObject(v) {
				return typeof v === "object" && v !== null && !Array.isArray(v);
			}
		};
	})))();
}

export { AMBIENT_CONTEXT_JSX, BUSY_LOCK_PATH, BUSY_LOCK_REFRESH_MS, BUSY_LOCK_STALE_MS, DEFAULT_TIMEOUT_MS, DISPATCHER_JSX, HEARTBEAT_BUSY_STALE_MS, HEARTBEAT_FILENAME, HEARTBEAT_STALE_MS, INSTANCES_DIR, INSTANCE_DIR_SWEEP_MS, LIVENESS_CHECK_MS, PACKAGE_ROOT, PHANTOM_LAUNCH_MS, RELAUNCH_UNCONSUMED_AFTER_MS, REQUEST_PREFIX, RESPONSE_PREFIX, RUNTIME_DIR, RUNTIME_DIR_IS_CUSTOM, RUNTIME_POINTER_PATH, RUNTIME_ROOT, STALE_RUNTIME_FILE_MS, agentInstallStatus, denyAppConfig, denyOperation, denyTool, denyUnregisteredCategory, denyUnregisteredOperation, errorResult, evalRunEnabled, getOp, init_agent_install, init_cli, init_config, init_errors, init_opschema, init_policy, init_registry, init_validate, instanceDirFor, instanceTargetFromEnv, jsxCompLayerPreamble, jsxCompPreamble, jsxFail, jsxPropertyLookup, jsxVal, listOps, policySummary, prepareOp, readOnlyMode, registerOp, rejectedOutputPath, requestPathFor, resolveAfterFxPath, responsePathFor, runCli, runtimeDirWarnings, sanitizeInstanceId, suggestName, summarizeParams, validateAeProjectDoc, validateOpArgs, wantsDialogSuppression, wantsRollback, wantsUndoGroup };