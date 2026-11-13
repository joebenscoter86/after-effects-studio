import { __esmMin } from "./rolldown-runtime.js";
import { BUSY_LOCK_PATH, BUSY_LOCK_REFRESH_MS, BUSY_LOCK_STALE_MS, DEFAULT_TIMEOUT_MS, DISPATCHER_JSX, HEARTBEAT_BUSY_STALE_MS, HEARTBEAT_FILENAME, HEARTBEAT_STALE_MS, INSTANCES_DIR, INSTANCE_DIR_SWEEP_MS, LIVENESS_CHECK_MS, PHANTOM_LAUNCH_MS, RELAUNCH_UNCONSUMED_AFTER_MS, REQUEST_PREFIX, RESPONSE_PREFIX, RUNTIME_DIR, RUNTIME_DIR_IS_CUSTOM, RUNTIME_POINTER_PATH, RUNTIME_ROOT, STALE_RUNTIME_FILE_MS, init_config, instanceTargetFromEnv, requestPathFor, resolveAfterFxPath, responsePathFor, runtimeDirWarnings, sanitizeInstanceId } from "./core-1.js";
import { execFile, spawn } from "node:child_process";
import { mkdirSync, promises, unlinkSync, writeFileSync } from "node:fs";
import * as path$1 from "node:path";
import { randomUUID } from "node:crypto";

// transport/launcher.js
function jsxPath(p) {
	return `'${p.replace(/\\/g, "/").replace(/'/g, "\\'")}'`;
}
function appleScriptString(value) {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
function appBundlePath(aePath) {
	const normalized = aePath.replace(/\\/g, "/");
	const match = normalized.match(/^(.*?\.app)(\/|$)/);
	return match ? match[1] : normalized;
}
function buildInstanceLaunchPlan(aePath, instanceId, platform = process.platform) {
	if (platform === "darwin") return {
		command: "/usr/bin/open",
		args: [
			"-n",
			"--env",
			`AE_MCP_INSTANCE=${instanceId}`,
			"-a",
			appBundlePath(aePath)
		]
	};
	return {
		command: aePath,
		args: ["-m"]
	};
}
function buildLaunchPlan(aePath, platform = process.platform, runtimeDir = RUNTIME_DIR, dispatcherJsx = DISPATCHER_JSX) {
	if (platform === "darwin") {
		const dispatcher = jsxPath(dispatcherJsx);
		const bootstrap = `$.global.AE_MCP_RUNTIME_DIR_OVERRIDE = ${jsxPath(runtimeDir)}; try { if (new File(${dispatcher}).exists) $.evalFile(${dispatcher}); } catch (eBoot) { try { var _bootLog = new File(${jsxPath(runtimeDir)} + '/dispatcher.log'); if (_bootLog.open('a')) { _bootLog.writeln('[' + new Date().toString() + '] bootstrap: ' + eBoot); _bootLog.close(); } } catch (eLog) {} }`;
		return {
			command: "/usr/bin/osascript",
			args: [
				"-e",
				"with timeout of 7200 seconds",
				"-e",
				`tell application ${appleScriptString(appBundlePath(aePath))} to DoScript ${appleScriptString(bootstrap)}`,
				"-e",
				"end timeout"
			],
			diagnoseExit: true,
			detectPhantom: false
		};
	}
	return {
		command: aePath,
		args: ["-r", dispatcherJsx],
		diagnoseExit: false,
		detectPhantom: true
	};
}
function init_launcher() {
	return (init_launcher = __esmMin((() => {
		init_config();
	})))();
}

// transport/instances.js
function isAlive(heartbeat, now = Date.now()) {
	if (heartbeat === null || typeof heartbeat.ts !== "number") return false;
	return now - heartbeat.ts < (heartbeat.busy ? HEARTBEAT_BUSY_STALE_MS : HEARTBEAT_STALE_MS);
}
async function readInstance(dir, now = Date.now()) {
	const id = path$1.basename(dir);
	let heartbeat = null;
	try {
		const raw = await promises.readFile(path$1.join(dir, HEARTBEAT_FILENAME), "utf8");
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed.ts === "number") heartbeat = {
			...parsed,
			id: typeof parsed.id === "string" ? parsed.id : id,
			project: typeof parsed.project === "string" ? parsed.project : null,
			projectName: typeof parsed.projectName === "string" ? parsed.projectName : null,
			ts: parsed.ts
		};
	} catch {}
	return {
		id,
		dir,
		heartbeat,
		ageMs: heartbeat ? now - heartbeat.ts : null,
		alive: isAlive(heartbeat, now)
	};
}
async function listInstances(instancesDir = INSTANCES_DIR, now = Date.now()) {
	let entries;
	try {
		entries = await promises.readdir(instancesDir, { withFileTypes: true });
	} catch {
		return [];
	}
	const infos = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		infos.push(await readInstance(path$1.join(instancesDir, entry.name), now));
	}
	return infos.sort((a, b) => a.id.localeCompare(b.id));
}
function projectStem(name) {
	return path$1.basename(name).toLowerCase().replace(/\.aepx?$/i, "");
}
function projectPathKey(p) {
	return path$1.resolve(p).replace(/\\/g, "/").toLowerCase();
}
function matchesTarget(instance, target) {
	const wanted = target.trim();
	if (wanted.length === 0) return false;
	if (instance.id === wanted || instance.id === sanitizeInstanceId(wanted)) return true;
	const hb = instance.heartbeat;
	if (/[\\/]/.test(wanted)) return hb?.project ? projectPathKey(hb.project) === projectPathKey(wanted) : false;
	const project = hb?.projectName ?? (hb?.project ? path$1.basename(hb.project) : null);
	if (!project) return false;
	return projectStem(project) === projectStem(wanted);
}
function instanceLabel(instance) {
	return `${instance.heartbeat?.projectName ?? "untitled"} [${instance.id}]`;
}
function describeInstance(instance) {
	const hb = instance.heartbeat;
	const state = instance.alive ? hb?.busy ? "busy" : "live" : "stale";
	const seen = instance.ageMs === null ? "never seen" : `seen ${Math.round(instance.ageMs / 1e3)}s ago`;
	return `${instanceLabel(instance)} (${state}, ${seen})`;
}
function instanceSummary(instances) {
	return instances.length === 0 ? "none" : instances.map(describeInstance).join("; ");
}
async function resolveTarget(target, instancesDir = INSTANCES_DIR, now = Date.now()) {
	const all = await listInstances(instancesDir, now);
	const live = all.filter((i) => i.alive);
	if (target === null) {
		if (live.length === 0) return { mode: "push" };
		if (live.length === 1) return {
			mode: "pull",
			instance: live[0]
		};
		return {
			mode: "error",
			message: `${live.length} After Effects instances are live and none was named \u2014 set AE_MCP_INSTANCE to one of: ${live.map(instanceLabel).join(", ")}`,
			hint: `Name the instance by its id or by the project file it has open (e.g. "shotA" or "shotA.aep"): AE_MCP_INSTANCE on the server picks its default, and every tool takes an \`instance\` argument to address another for one call. Live instances: ${instanceSummary(live)}.`
		};
	}
	const matches = live.filter((i) => matchesTarget(i, target));
	if (matches.length === 1) return {
		mode: "pull",
		instance: matches[0]
	};
	if (matches.length > 1) return {
		mode: "error",
		message: `'${target}' matches ${matches.length} live After Effects instances: ` + matches.map(instanceLabel).join(", "),
		hint: `Address one of them by id instead. Live instances: ${instanceSummary(live)}.`
	};
	const stale = all.filter((i) => !i.alive && matchesTarget(i, target));
	return {
		mode: "error",
		message: `no live After Effects instance matches '${target}'${stale.length > 0 ? ` \u2014 it was last seen ${Math.round((stale[0].ageMs ?? 0) / 1e3)}s ago and has stopped ticking (After Effects quit, crashed, or is stuck in a modal dialog)` : live.length > 0 ? `; live instances: ${instanceSummary(live)}` : "; no instance has a live agent"}`,
		hint: INSTALL_HINT
	};
}
async function sweepDeadInstanceDirs(instancesDir = INSTANCES_DIR, now = Date.now()) {
	const removed = [];
	for (const instance of await listInstances(instancesDir, now)) {
		let lastActivity = instance.heartbeat?.ts ?? null;
		if (lastActivity === null) try {
			lastActivity = (await promises.stat(instance.dir)).mtimeMs;
		} catch {
			continue;
		}
		if (now - lastActivity < 36e5) continue;
		try {
			await promises.rm(instance.dir, {
				recursive: true,
				force: true
			});
			removed.push(instance.id);
		} catch {}
	}
	return removed;
}
var INSTALL_HINT;
function init_instances() {
	return (init_instances = __esmMin((() => {
		init_config();
		INSTALL_HINT = "Each instance needs the resident agent: run `npx @kumoproductions/mcp-aftereffects install-agent` once per After Effects version, then (re)start After Effects — the agent registers about ten seconds after launch. To name an instance, set AE_MCP_INSTANCE in the environment that launches it (works with `AfterFX.exe -m`); the server-side AE_MCP_INSTANCE can also name the project file it has open.";
	})))();
}

// transport/dialogs.js
function scriptProgressMatch(d) {
	if (SCRIPT_PROGRESS_NAME.test(d.title ?? "") || SCRIPT_PROGRESS_NAME.test(d.text)) return "name";
	const shape = SCRIPT_PROGRESS_SHAPE;
	if (!d.title && !d.text && d.layer === shape.layer && Math.abs(d.width - shape.width) <= shape.tolerance && Math.abs(d.height - shape.height) <= shape.tolerance) return "size";
	return null;
}
function splitScriptProgress(windows) {
	return {
		dialogs: windows.filter((w) => !w.scriptProgress),
		scripts: windows.filter((w) => !!w.scriptProgress)
	};
}
function scriptRunningMessage(scripts) {
	return `After Effects is still running a script (${scripts.every((s) => s.scriptProgress === "name") ? "its 'Executing Script' progress window is up" : "a window shaped like its 'Executing Script' progress window is up (its name could not be read, so it was recognised by size)"}): it is busy, not blocked by a dialog`;
}
function encodeScript(script) {
	return Buffer.from(script, "utf16le").toString("base64");
}
function scanSupported(platform) {
	return platform === "win32" || platform === "darwin";
}
function dialogScanSupported(platform = process.platform) {
	return scanSupported(platform);
}
function parseDialogScan(raw) {
	const trimmed = raw.replace(/^﻿/, "").trim();
	if (!trimmed) return [];
	let parsed;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		return [];
	}
	const list = Array.isArray(parsed) ? parsed : [parsed];
	const out = [];
	for (const entry of list) {
		if (entry === null || typeof entry !== "object") continue;
		const e = entry;
		if (typeof e.id !== "string" || typeof e.text !== "string" || typeof e.pid !== "number") continue;
		out.push({
			pid: e.pid,
			id: e.id,
			text: e.text.replace(/\r\n/g, "\n").trim(),
			width: typeof e.width === "number" ? e.width : 0,
			height: typeof e.height === "number" ? e.height : 0,
			window: typeof e.window === "string" && e.window.length > 0 ? e.window : null,
			...typeof e.accessibility === "boolean" ? { accessibility: e.accessibility } : {},
			...typeof e.startedAt === "number" && e.startedAt > 0 ? { startedAt: e.startedAt } : {},
			...typeof e.title === "string" ? { title: e.title.trim() } : {},
			...typeof e.layer === "number" ? { layer: e.layer } : {}
		});
		const last = out[out.length - 1];
		const progress = scriptProgressMatch(last);
		if (progress !== null) last.scriptProgress = progress;
	}
	return out;
}
async function scanAeWindows(platform = process.platform) {
	if (!scanSupported(platform)) return [];
	try {
		return parseDialogScan(platform === "darwin" ? await osascriptRunner(DARWIN_SCRIPT, { AE_MCP_DIALOG_MODE: "scan" }) : await runner(SCAN_SCRIPT, {}));
	} catch {
		return [];
	}
}
async function scanAeDialogs(platform = process.platform) {
	return splitScriptProgress(await scanAeWindows(platform)).dialogs;
}
async function dismissAeDialog(id, platform = process.platform) {
	const notFound = {
		posted: false,
		closed: false,
		text: null,
		reason: "not_found"
	};
	const shape = platform === "darwin" ? /^\d{1,10}:\d{1,10}$/ : /^\d{1,20}$/;
	if (!scanSupported(platform) || !shape.test(id)) return notFound;
	try {
		const raw = platform === "darwin" ? await osascriptRunner(DARWIN_SCRIPT, {
			AE_MCP_DIALOG_MODE: "dismiss",
			AE_MCP_DIALOG_ID: id
		}) : await runner(DISMISS_SCRIPT, { AE_MCP_DIALOG_ID: id });
		const r = JSON.parse(raw.replace(/^\uFEFF/, "").trim());
		const posted = r.posted === true;
		return {
			posted,
			closed: r.closed === true,
			text: typeof r.text === "string" ? r.text.replace(/\r\n/g, "\n").trim() : null,
			...posted ? {} : { reason: typeof r.reason === "string" && DISMISS_REASONS.has(r.reason) ? r.reason : "not_found" }
		};
	} catch {
		return notFound;
	}
}
function describeDialogs(dialogs) {
	return dialogs.map((d) => {
		const where = d.window ? ` in "${d.window}"` : "";
		return `${d.text ? `"${d.text.replace(/\s*\n\s*/g, " ")}"` : "(text unavailable)"} (pid ${d.pid}${where}, id ${d.id})`;
	}).join("; ");
}
function dialogBlockMessage(dialogs) {
	const n = dialogs.length;
	return `After Effects is showing ${n === 1 ? "a modal dialog" : `${n} modal dialogs`}, and no script can run until ${n === 1 ? "it is" : "they are"} closed: ${describeDialogs(dialogs)}`;
}
function dialogHint(dialogs) {
	return dialogs.some((d) => d.accessibility === false) ? `${DIALOG_HINT} ${ACCESSIBILITY_HINT}` : DIALOG_HINT;
}
var SCRIPT_PROGRESS_NAME, SCRIPT_PROGRESS_SHAPE, SCRIPT_RUNNING_HINT, SCAN_TIMEOUT_MS, HELPER, SCAN_SCRIPT, DISMISS_SCRIPT, DARWIN_SCRIPT, defaultRunner, defaultOsascriptRunner, runner, osascriptRunner, DISMISS_REASONS, DIALOG_HINT, ACCESSIBILITY_HINT;
function init_dialogs() {
	return (init_dialogs = __esmMin((() => {
		SCRIPT_PROGRESS_NAME = /^\s*executing script\b/i;
		SCRIPT_PROGRESS_SHAPE = {
			layer: 8,
			width: 363,
			height: 181,
			tolerance: 2
		};
		SCRIPT_RUNNING_HINT = "Do not close that window: its only action cancels the running script. Wait for the script to finish (raise timeoutMs for long work), then inspect the project before repeating a write.";
		SCAN_TIMEOUT_MS = 8e3;
		HELPER = String.raw`
Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class AeMcpWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern IntPtr SendMessageTimeout(IntPtr h, uint m, IntPtr w, StringBuilder l, uint f, uint t, out IntPtr r);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public static string Cls(IntPtr h) { var s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  static string Txt(IntPtr h) { var s = new StringBuilder(8192); IntPtr r; SendMessageTimeout(h, 0x000D, (IntPtr)8192, s, 2, 500, out r); return s.ToString(); }
  public static List<IntPtr> Tops() { var l = new List<IntPtr>(); EnumWindows((h, p) => { l.Add(h); return true; }, IntPtr.Zero); return l; }
  public static string Message(IntPtr w) {
    var parts = new List<string>();
    EnumChildWindows(w, (h, p) => {
      var c = Cls(h);
      if (c == "Edit" || c == "Static") { var t = Txt(h).Trim(); if (t.Length > 0) parts.Add(t); }
      return true;
    }, IntPtr.Zero);
    return String.Join("\n", parts);
  }
}
"@
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ae = @{}
Get-Process AfterFX -ErrorAction SilentlyContinue | ForEach-Object { $ae[[int]$_.Id] = $_.MainWindowTitle }
function Get-AeDialogs {
  $found = @()
  foreach ($h in [AeMcpWin]::Tops()) {
    $p = [uint32]0; [void][AeMcpWin]::GetWindowThreadProcessId($h, [ref]$p)
    if (-not $ae.ContainsKey([int]$p)) { continue }
    if (-not [AeMcpWin]::IsWindowVisible($h)) { continue }
    if ([AeMcpWin]::Cls($h) -ne "#32770") { continue }
    $text = [AeMcpWin]::Message($h)
    if ($text.Length -eq 0) { continue }
    $r = New-Object AeMcpWin+RECT; [void][AeMcpWin]::GetWindowRect($h, [ref]$r)
    $found += [pscustomobject]@{ pid = [int]$p; id = [string][int64]$h; text = $text; width = $r.R - $r.L; height = $r.B - $r.T; window = $ae[[int]$p] }
  }
  return ,$found
}
`;
		SCAN_SCRIPT = `${HELPER}
ConvertTo-Json -Compress -Depth 3 -InputObject (Get-AeDialogs)
`;
		DISMISS_SCRIPT = `${HELPER}
$target = [string]$env:AE_MCP_DIALOG_ID
$vk = 0x1B
$match = @(Get-AeDialogs | Where-Object { $_.id -eq $target })
if ($match.Count -eq 0) { ConvertTo-Json -Compress -InputObject @{ posted = $false; closed = $false; text = $null }; exit }
$h = [IntPtr][int64]$target
[void][AeMcpWin]::PostMessage($h, 0x0100, [IntPtr]$vk, [IntPtr]0)
[void][AeMcpWin]::PostMessage($h, 0x0101, [IntPtr]$vk, [IntPtr]0)
$closed = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 100
  if (-not [AeMcpWin]::IsWindow($h) -or -not [AeMcpWin]::IsWindowVisible($h)) { $closed = $true; break }
}
ConvertTo-Json -Compress -InputObject @{ posted = $true; closed = $closed; text = $match[0].text }
`;
		DARWIN_SCRIPT = String.raw`
ObjC.import('Cocoa'); ObjC.import('CoreGraphics'); ObjC.import('ApplicationServices');
function envVar(k) { var v = $.NSProcessInfo.processInfo.environment.objectForKey(k); return v.isNil() ? '' : ObjC.unwrap(v); }
var trusted = !!$.AXIsProcessTrusted();
function isAe(bundle) { return /^com\.adobe\.aftereffects/i.test(bundle); }
function aeProcesses() {
  var out = {}, apps = $.NSWorkspace.sharedWorkspace.runningApplications;
  for (var i = 0, n = Number(apps.count); i < n; i++) {
    var a = apps.objectAtIndex(i), bundle = ObjC.unwrap(a.bundleIdentifier) || '';
    if (!isAe(bundle)) continue;
    out[a.processIdentifier] = { startedAt: a.launchDate.isNil() ? 0 : Math.round(a.launchDate.timeIntervalSince1970 * 1000) };
  }
  return out;
}
function cgWindows() {
  var r = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0);
  return ObjC.deepUnwrap(ObjC.castRefToObject(r)) || [];
}
// Attribute names must be NSStrings. An element read from a single-valued
// attribute has to be cast before it is passed back in; ones out of an AX
// array can be passed as they are.
function ax(el, attr) { var ref = Ref(); return $.AXUIElementCopyAttributeValue(el, $(attr), ref) === 0 ? ref[0] : null; }
function axElement(el, attr) { var v = ax(el, attr); return v ? ObjC.castRefToObject(v) : null; }
function axList(el, attr) {
  var v = ax(el, attr), out = [];
  if (!v) return out;
  var arr = ObjC.castRefToObject(v);
  for (var i = 0, n = Number(arr.count); i < n; i++) out.push(arr.objectAtIndex(i));
  return out;
}
function axString(el, attr) { var v = ax(el, attr); if (!v) return ''; var s = ObjC.unwrap(ObjC.castRefToObject(v)); return typeof s === 'string' ? s : ''; }
function axNums(el, attr) {
  var v = ax(el, attr); if (!v) return null;
  var m = ObjC.unwrap(ObjC.castRefToObject(v).description).match(/[xw]:(-?[\d.]+) [yh]:(-?[\d.]+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}
function axTexts(el, out, depth, budget) {
  var kids = axList(el, 'AXChildren');
  for (var i = 0; i < kids.length && budget.n-- > 0; i++) {
    var role = axString(kids[i], 'AXRole');
    if (role === 'AXStaticText' || role === 'AXTextArea' || role === 'AXTextField') {
      var t = axString(kids[i], 'AXValue').trim(); if (t) out.push(t);
    } else if (depth < 6) axTexts(kids[i], out, depth + 1, budget);
  }
  return out;
}
function axButtons(el, out, depth) {
  var kids = axList(el, 'AXChildren');
  for (var i = 0; i < kids.length; i++) {
    if (axString(kids[i], 'AXRole') === 'AXButton') out.push(kids[i]);
    else if (depth < 6) axButtons(kids[i], out, depth + 1);
  }
  return out;
}
function axBool(el, attr) { var v = ax(el, attr); return v ? ObjC.unwrap(ObjC.castRefToObject(v)) == true : false; }
function axApp(pid, cache) {
  if (cache[pid]) return cache[pid];
  var app = $.AXUIElementCreateApplication(pid), wins = [], title = '';
  axList(app, 'AXWindows').forEach(function (w) {
    var aw = { el: w, pos: axNums(w, 'AXPosition'), size: axNums(w, 'AXSize'), modal: axBool(w, 'AXModal'), title: axString(w, 'AXTitle') };
    // AE reports no AXMainWindow; its main window is the titled, non-modal one.
    if (!title && !aw.modal && aw.title) title = aw.title;
    wins.push(aw);
  });
  return (cache[pid] = { wins: wins, title: title });
}
function near(a, b) { return Math.abs(a - b) < 2; }
// Seen on AE 26.5: the missing-files warning sits at layer 8, the System
// Compatibility Report at 101, the Adobe Licensing prompt at 0 — so with AX
// the test is AXModal, and without it only layers 8 and 101 are guessed at.
var GUESSED_LAYERS = { 8: true, 101: true };
function scan() {
  var procs = aeProcesses(), wins = cgWindows(), cache = {}, found = [];
  var titles = {};
  wins.forEach(function (w) { if (w.kCGWindowLayer === 0 && w.kCGWindowName && !titles[w.kCGWindowOwnerPID]) titles[w.kCGWindowOwnerPID] = w.kCGWindowName; });
  wins.forEach(function (w) {
    var pid = w.kCGWindowOwnerPID, b = w.kCGWindowBounds;
    if (!procs[pid] || !(w.kCGWindowAlpha > 0)) return;
    var d = { pid: pid, id: pid + ':' + w.kCGWindowNumber, text: '', width: Math.round(b.Width), height: Math.round(b.Height),
      window: titles[pid] || null, accessibility: trusted, startedAt: procs[pid].startedAt, number: w.kCGWindowNumber, el: null,
      title: w.kCGWindowName || '', layer: w.kCGWindowLayer };
    var modal = !!GUESSED_LAYERS[w.kCGWindowLayer];
    if (trusted) {
      var app = axApp(pid, cache);
      if (app.title) d.window = app.title;
      app.wins.forEach(function (aw) {
        if (!d.el && aw.pos && aw.size && near(aw.pos[0], b.X) && near(aw.pos[1], b.Y) && near(aw.size[0], b.Width) && near(aw.size[1], b.Height)) { d.el = aw.el; modal = aw.modal; }
      });
      if (modal && d.el) d.text = axTexts(d.el, [], 0, { n: 400 }).filter(function (t) { return !/^(Adobe )?After Effects$/.test(t); }).join('\n');
    }
    if (modal) found.push(d);
  });
  return found;
}
function strip(d) { return { pid: d.pid, id: d.id, text: d.text, width: d.width, height: d.height, window: d.window, accessibility: d.accessibility, startedAt: d.startedAt, title: d.title, layer: d.layer }; }
// AE's "Executing Script ..." progress window (layer 8, 363 x 181): its only
// action cancels the running script, so it is never dismissed. Same rule as
// scriptProgressMatch in dialogs.ts.
function isScriptProgress(d) {
  var named = /^\s*executing script\b/i;
  if (named.test(d.title || '') || named.test(d.text || '')) return true;
  return !d.title && !d.text && d.layer === 8 && Math.abs(d.width - 363) <= 2 && Math.abs(d.height - 181) <= 2;
}
function gone(number) {
  for (var i = 0; i < 10; i++) {
    delay(0.1);
    if (!cgWindows().some(function (w) { return w.kCGWindowNumber === number; })) return true;
  }
  return false;
}
function dismiss(target) {
  var none = { posted: false, closed: false, text: null };
  var d = null;
  scan().forEach(function (x) { if (x.id === target) d = x; });
  if (!d) { none.reason = 'not_found'; return none; }
  if (isScriptProgress(d)) { none.reason = 'script_progress'; return none; }
  if (!trusted) { none.reason = 'no_permission'; return none; }
  var cancel = d.el ? axElement(d.el, 'AXCancelButton') : null;
  if (cancel) {
    $.AXUIElementPerformAction(cancel, $('AXPress'));
    return { posted: true, closed: gone(d.number), text: d.text || null, method: 'cancel_button' };
  }
  // AE exposes no AXCancelButton. Escape goes to the app's focused window,
  // which is often the main window rather than the dialog, so focus the
  // dialog inside AE first (this does not activate AE).
  if (d.el) {
    $.AXUIElementPerformAction(d.el, $('AXRaise'));
    $.AXUIElementSetAttributeValue(d.el, $('AXFocused'), $.kCFBooleanTrue);
  }
  [true, false].forEach(function (down) { $.CGEventPostToPid(d.pid, $.CGEventCreateKeyboardEvent($(), 53, down)); });
  if (gone(d.number)) return { posted: true, closed: true, text: d.text || null, method: 'escape' };
  // Escape did nothing: an OK-only warning has no choice to make, so its one
  // button is pressed; anything offering choices is left for the user.
  var buttons = d.el ? axButtons(d.el, [], 0).filter(function (b) { return axString(b, 'AXTitle'); }) : [];
  if (buttons.length === 1) {
    $.AXUIElementPerformAction(buttons[0], $('AXPress'));
    return { posted: true, closed: gone(d.number), text: d.text || null, method: 'only_button' };
  }
  return { posted: true, closed: false, text: d.text || null, method: 'escape' };
}
var mode = envVar('AE_MCP_DIALOG_MODE');
if (mode === 'dismiss') {
  var result;
  try { result = dismiss(envVar('AE_MCP_DIALOG_ID')); } catch (e) { result = { posted: false, closed: false, text: null, reason: 'not_found' }; }
  JSON.stringify(result);
} else JSON.stringify(scan().map(strip));
`;
		defaultRunner = (script, env) => new Promise((resolve, reject) => {
			execFile("powershell.exe", [
				"-NoProfile",
				"-NonInteractive",
				"-ExecutionPolicy",
				"Bypass",
				"-EncodedCommand",
				encodeScript(script)
			], {
				env: {
					...process.env,
					...env
				},
				timeout: SCAN_TIMEOUT_MS,
				windowsHide: true,
				encoding: "utf8",
				maxBuffer: 1048576
			}, (err, stdout) => err ? reject(err) : resolve(stdout));
		});
		defaultOsascriptRunner = (script, env) => new Promise((resolve, reject) => {
			execFile("/usr/bin/osascript", [
				"-l",
				"JavaScript",
				"-e",
				script
			], {
				env: {
					...process.env,
					...env
				},
				timeout: SCAN_TIMEOUT_MS,
				encoding: "utf8",
				maxBuffer: 1048576
			}, (err, stdout) => err ? reject(err) : resolve(stdout));
		});
		runner = defaultRunner;
		osascriptRunner = defaultOsascriptRunner;
		DISMISS_REASONS = /* @__PURE__ */ new Set([
			"not_found",
			"no_permission",
			"script_progress"
		]);
		DIALOG_HINT = "`instance.dismiss_dialog { id }` closes it by its cancel action (what Escape does), so a warning is acknowledged and a question (save changes?) is cancelled, never answered — then retry. If the user needs to answer it, ask them; it is often hidden behind the After Effects main window.";
		ACCESSIBILITY_HINT = "On macOS, reading a dialog's text and closing it need Accessibility permission for the app that runs this MCP server (System Settings > Privacy & Security > Accessibility). Without it, dialogs are only detected; ask the user to close them in After Effects.";
	})))();
}

// transport/FileIpcTransport.js
async function sweepOrphanTmpFiles(dir, now = Date.now()) {
	const removed = [];
	let entries;
	try {
		entries = await promises.readdir(dir);
	} catch {
		return removed;
	}
	for (const entry of entries) {
		if (!((entry.startsWith(`.${"request-"}`) || entry.startsWith(`.${"response-"}`)) && entry.endsWith(".json.tmp"))) continue;
		const full = path$1.join(dir, entry);
		try {
			const stat = await promises.stat(full);
			if (stat.isFile() && now - stat.mtimeMs > 3e5) {
				await promises.unlink(full);
				removed.push(entry);
			}
		} catch {}
	}
	return removed;
}
function failure(errorCode, message, extra = {}) {
	return {
		ok: false,
		result: null,
		error: extra.hint ? `${message}
${extra.hint}` : message,
		errorCode,
		stack: extra.stack ?? null,
		logs: [],
		durationMs: extra.durationMs ?? 0,
		...extra.dialogs ? { dialogs: extra.dialogs } : {}
	};
}
function readResponseText(raw) {
	if (!raw) return { kind: "pending" };
	try {
		return {
			kind: "ready",
			response: JSON.parse(raw)
		};
	} catch {
		return {
			kind: "unreadable",
			bytes: Buffer.byteLength(raw, "utf8"),
			tail: raw.slice(-80)
		};
	}
}
function unreadableResponseFailure(read, started) {
	return failure("DISPATCHER", `After Effects wrote a response that is not valid JSON (${read.bytes} bytes, ending in ${JSON.stringify(read.tail)}); the script already ran`, {
		durationMs: Date.now() - started,
		hint: "The response was cut off while it was being written, usually by a value its writer could not encode. Whatever the call does to the project has already happened: inspect the actual project state before retrying a write."
	});
}
function dialogFailure(dialogs, outcome, started) {
	return failure("DIALOG_OPEN", `${dialogBlockMessage(dialogs)} \u2014 ${outcome}`, {
		durationMs: Date.now() - started,
		hint: dialogHint(dialogs),
		dialogs
	});
}
function isAutomationDenial(message) {
	return /(?:-1743\b|not (?:authorized|permitted) to send apple events)/i.test(message);
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function serializeRequest(request) {
	return JSON.stringify(request).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
var ORPHAN_TMP_SWEEP_MS, REAP_INTERVAL_MS, EMPTY_TMP_GRACE_MS, UNCLAIMED_RESPONSE_GRACE_MS, ORPHAN_WATCH_MS, PICKED_UP_TIMEOUT_NOTE, FileIpcTransport, UNREADABLE_RESPONSE_GRACE_MS, UnreadableResponseWatch;
function init_FileIpcTransport() {
	return (init_FileIpcTransport = __esmMin((() => {
		init_config();
		init_dialogs();
		init_instances();
		init_launcher();
		ORPHAN_TMP_SWEEP_MS = 3e5;
		REAP_INTERVAL_MS = 1e3;
		EMPTY_TMP_GRACE_MS = 1e4;
		UNCLAIMED_RESPONSE_GRACE_MS = 2e3;
		ORPHAN_WATCH_MS = 18e5;
		PICKED_UP_TIMEOUT_NOTE = "The most likely cause is a modal dialog in After Effects — an error box raised by the script (an undo raised one on 2026-11-10) or a warning — which blocks all scripting until a person clicks it; instance.dialogs may not list it, so look at the After Effects window. Once it is dismissed the script finishes and the plugin cleans up after it (busy lock, temp response).";
		FileIpcTransport = class {
			afterFxPath = null;
			inflight = Promise.resolve();
			/** Non-null when the mailbox directory is unusable; reported per call. */
			setupError = null;
			instanceOption;
			spawnFn;
			dispatcherJsx;
			scanDialogs;
			reapIntervalMs;
			emptyTmpGraceMs;
			orphans = /* @__PURE__ */ new Map();
			reapTimer = null;
			constructor(options = {}) {
				this.instanceOption = options.instance;
				this.reapIntervalMs = options.reapIntervalMs ?? 1e3;
				this.emptyTmpGraceMs = options.emptyTmpGraceMs ?? 1e4;
				this.spawnFn = options.spawn ?? ((command, args, opts) => spawn(command, args, opts));
				this.dispatcherJsx = options.dispatcherJsx ?? DISPATCHER_JSX;
				this.scanDialogs = options.scanDialogs ?? (() => scanAeWindows());
				try {
					mkdirSync(RUNTIME_DIR, {
						recursive: true,
						mode: 448
					});
					if (RUNTIME_DIR_IS_CUSTOM) {
						mkdirSync(RUNTIME_ROOT, {
							recursive: true,
							mode: 448
						});
						writeFileSync(RUNTIME_POINTER_PATH, RUNTIME_DIR, "utf8");
					} else try {
						unlinkSync(RUNTIME_POINTER_PATH);
					} catch {}
					for (const warning of runtimeDirWarnings()) process.stderr.write(`mcp-aftereffects: WARNING \u2014 ${warning}
`);
				} catch (err) {
					this.setupError = `cannot use runtime directory ${RUNTIME_DIR}: ${err instanceof Error ? err.message : String(err)}`;
				}
				this.sweepStaleFiles();
			}
			/** Where the next call would go. For ae_context and the startup banner; never throws. */
			async describeTarget(instance) {
				return this.resolveTarget(instance);
			}
			/**
			* A per-call `instance` wins over the constructor option, which wins over
			* AE_MCP_INSTANCE; `instance: null` at construction forces push unless a
			* call names an instance explicitly.
			*/
			async resolveTarget(explicit) {
				const named = explicit?.trim();
				if (named) return resolveTarget(named);
				if (this.instanceOption === null) return { mode: "push" };
				const target = this.instanceOption === void 0 ? instanceTargetFromEnv() : this.instanceOption;
				return resolveTarget(target);
			}
			async execute(req) {
				const prev = this.inflight;
				let release;
				this.inflight = new Promise((res) => {
					release = res;
				});
				try {
					await prev;
					return await this.executeOne(req);
				} catch (err) {
					return failure("TRANSPORT", `mcp-aftereffects transport error: ${err instanceof Error ? err.message : String(err)}`, { stack: err instanceof Error && err.stack ? err.stack : null });
				} finally {
					release();
				}
			}
			/** Stop watching for the leftovers of timed-out requests. */
			async close() {
				if (this.reapTimer !== null) clearInterval(this.reapTimer);
				this.reapTimer = null;
			}
			async executeOne(req) {
				const started = Date.now();
				await this.reapOrphans();
				const timeoutMs = req.timeoutMs ?? 6e4;
				if (this.setupError !== null) return failure("TRANSPORT", this.setupError, { durationMs: Date.now() - started });
				const target = await this.resolveTarget(req.instance);
				if (target.mode === "error") {
					const { dialogs, scripts } = await this.lookAtAe();
					if (dialogs.length > 0) return dialogFailure(dialogs, target.message, started);
					if (scripts.length > 0) return failure("NO_INSTANCE", `${target.message} \u2014 ${scriptRunningMessage(scripts)}`, {
						durationMs: Date.now() - started,
						hint: SCRIPT_RUNNING_HINT
					});
					return failure("NO_INSTANCE", target.message, {
						durationMs: Date.now() - started,
						hint: target.hint
					});
				}
				const request = {
					id: randomUUID(),
					label: req.label ?? "action",
					code: req.code,
					payload: req.payload ?? null,
					undoGroup: req.undoGroup !== false,
					suppressDialogs: req.suppressDialogs !== false,
					rollback: req.undoGroup !== false && req.rollback === true,
					acceptRenderQueueRisk: req.acceptRenderQueueRisk === true
				};
				if (target.mode === "pull") return this.executePull(request, target.instance, started, timeoutMs);
				return this.executePush(request, started, timeoutMs);
			}
			async executePull(request, instance, started, timeoutMs) {
				const dir = instance.dir;
				const requestPath = path$1.join(dir, `${REQUEST_PREFIX}${request.id}.json`);
				const responsePath = path$1.join(dir, `${RESPONSE_PREFIX}${request.id}.json`);
				await promises.mkdir(dir, { recursive: true });
				await this.writeRequest(dir, requestPath, request);
				const deadline = started + timeoutMs;
				let requestConsumed = false;
				let lastLivenessAt = started;
				const unreadable = new UnreadableResponseWatch();
				while (Date.now() < deadline) {
					const read = await this.tryReadResponse(responsePath);
					if (read.kind === "ready") {
						await this.safeUnlink(responsePath);
						return this.toEvalResult(read.response, Date.now() - started);
					}
					if (unreadable.settled(read, Date.now()) && read.kind === "unreadable") {
						await this.safeUnlink(responsePath);
						return unreadableResponseFailure(read, started);
					}
					const now = Date.now();
					if (!requestConsumed && now - lastLivenessAt >= 1e3) {
						lastLivenessAt = now;
						if (!await this.fileExists(requestPath)) requestConsumed = true;
						else {
							const current = await readInstance(dir, now);
							if (!current.alive) {
								const reclaimed2 = await this.safeUnlink(requestPath);
								if (!reclaimed2) this.watchOrphan(request.id, dir);
								const outcome = reclaimed2 ? "the request was never picked up and has been discarded" : "the request disappeared before it could be reclaimed; the operation may have started";
								const { dialogs, scripts } = await this.lookAtAe();
								if (dialogs.length > 0) return dialogFailure(dialogs, `After Effects instance '${instance.id}' stopped responding; ${outcome}`, started);
								if (scripts.length > 0) return failure(reclaimed2 ? "NO_INSTANCE" : "TIMEOUT", `After Effects instance '${instance.id}' stopped responding: ${scriptRunningMessage(scripts)}; ${outcome}`, {
									durationMs: Date.now() - started,
									hint: SCRIPT_RUNNING_HINT
								});
								return failure(reclaimed2 ? "NO_INSTANCE" : "TIMEOUT", `After Effects instance '${instance.id}' stopped responding (${describeInstance(current)}); ` + outcome, {
									durationMs: Date.now() - started,
									hint: reclaimed2 ? "Is that After Effects still running, and free of modal dialogs? Scripts do not run while one is open. If it was restarted, the agent re-registers about ten seconds after launch — retry then." : "Inspect the actual AE project and owned item IDs before retrying. A write may already have completed."
								});
							}
						}
					}
					await sleep(80);
				}
				const reclaimed = await this.safeUnlink(requestPath);
				if (!reclaimed) this.watchOrphan(request.id, dir);
				const pullTimeoutBase = `timeout after ${timeoutMs}ms waiting for After Effects instance '${instance.id}' to respond` + (reclaimed ? " (the request was never picked up and has been discarded)" : " (the request WAS picked up by the instance; the operation may still be running)");
				const pull = await this.lookAtAe();
				if (pull.dialogs.length > 0) return dialogFailure(pull.dialogs, pullTimeoutBase, started);
				if (pull.scripts.length > 0) return failure("TIMEOUT", `${pullTimeoutBase}. ${scriptRunningMessage(pull.scripts)}.`, {
					durationMs: Date.now() - started,
					hint: SCRIPT_RUNNING_HINT
				});
				return failure("TIMEOUT", reclaimed ? pullTimeoutBase : `${pullTimeoutBase}. ${PICKED_UP_TIMEOUT_NOTE}`, {
					durationMs: Date.now() - started,
					hint: "Is After Effects showing a modal dialog, or rendering/previewing? Scripts wait for both. For a long operation, raise timeoutMs. Inspect the project before repeating a write."
				});
			}
			async executePush(request, started, timeoutMs) {
				try {
					this.afterFxPath ??= resolveAfterFxPath();
				} catch (err) {
					return failure("AE_NOT_FOUND", err instanceof Error ? err.message : String(err), { durationMs: Date.now() - started });
				}
				if ((await listInstances()).some((i) => !i.alive)) {
					const { dialogs, scripts } = await this.lookAtAe();
					if (dialogs.length > 0) return dialogFailure(dialogs, "nothing was sent to After Effects", started);
					if (scripts.length > 0) return failure("TIMEOUT", `${scriptRunningMessage(scripts)}; nothing was sent to After Effects`, {
						durationMs: Date.now() - started,
						hint: SCRIPT_RUNNING_HINT
					});
				}
				if (!await this.fileExists(this.dispatcherJsx)) return failure("TRANSPORT", `the dispatcher script ${this.dispatcherJsx} is not there (the plugin was updated, moved or removed while this server ran); nothing was sent to After Effects`, {
					durationMs: Date.now() - started,
					hint: "Restart the MCP server (or the agent host) so it runs from the plugin's current folder."
				});
				const id = request.id;
				const requestPath = requestPathFor(id);
				const responsePath = responsePathFor(id);
				await this.writeRequest(RUNTIME_DIR, requestPath, request);
				const deadline = started + timeoutMs;
				if (!await this.acquireBusyLock(deadline, id)) {
					await this.safeUnlink(requestPath);
					return failure("TIMEOUT", `timeout after ${timeoutMs}ms waiting for After Effects to become available \u2014 another call (possibly from another MCP server process) holds the dispatcher busy lock`, {
						durationMs: Date.now() - started,
						hint: `The lock (${BUSY_LOCK_PATH}) is refreshed while its owner is alive and expires ${Math.round(BUSY_LOCK_STALE_MS / 1e3)}s after the owner stops. If this persists, check AE for a stuck script or a modal dialog, and avoid running two MCP servers against one AE.`
					});
				}
				let leaveLockForRunningScript = false;
				try {
					const spawnState = {
						error: null,
						child: null,
						exited: false
					};
					const launch = this.launchDispatcher(spawnState);
					if (spawnState.error !== null) return await this.spawnFailure(spawnState.error, requestPath, started);
					let attempts = 1;
					let lastLaunchAt = started;
					let lastRefreshAt = started;
					let requestConsumed = false;
					const unreadable = new UnreadableResponseWatch();
					while (Date.now() < deadline) {
						const read = await this.tryReadResponse(responsePath);
						if (read.kind === "ready") {
							await this.safeUnlink(responsePath);
							return this.toEvalResult(read.response, Date.now() - started);
						}
						if (unreadable.settled(read, Date.now()) && read.kind === "unreadable") {
							await this.safeUnlink(responsePath);
							return unreadableResponseFailure(read, started);
						}
						if (spawnState.error !== null) return await this.spawnFailure(spawnState.error, requestPath, started);
						const now = Date.now();
						if (now - lastRefreshAt >= 15e3) {
							lastRefreshAt = now;
							await this.refreshBusyLock(id);
						}
						if (!requestConsumed && now - lastLaunchAt >= 2500) {
							if (!await this.fileExists(requestPath)) requestConsumed = true;
							else if (launch.detectPhantom && spawnState.child !== null && !spawnState.exited) {
								if (now - lastLaunchAt >= 4e3) return await this.phantomFailure(spawnState, requestPath, started);
							} else if (attempts < 3 && now - lastLaunchAt >= 2500 * attempts) {
								const { dialogs, scripts } = await this.lookAtAe();
								if (dialogs.length === 0 && scripts.length > 0) {
									lastLaunchAt = Date.now();
									await sleep(80);
									continue;
								}
								if (dialogs.length > 0) {
									const reclaimed2 = await this.safeUnlink(requestPath);
									leaveLockForRunningScript = !reclaimed2;
									if (!reclaimed2) this.watchOrphan(id, RUNTIME_DIR);
									return dialogFailure(dialogs, reclaimed2 ? `the request was never picked up after ${attempts} launch attempt${attempts === 1 ? "" : "s"} and has been discarded` : "the request disappeared before it could be reclaimed; the operation may have started", started);
								}
								attempts++;
								lastLaunchAt = Date.now();
								this.launchDispatcher(spawnState);
							}
						}
						await sleep(80);
					}
					const reclaimed = await this.safeUnlink(requestPath);
					leaveLockForRunningScript = !reclaimed;
					if (!reclaimed) this.watchOrphan(id, RUNTIME_DIR);
					const { dialogs: pushDialogs, scripts: pushScripts } = await this.lookAtAe();
					if (pushDialogs.length === 0 && pushScripts.length > 0) return failure("TIMEOUT", `timeout after ${timeoutMs}ms waiting for After Effects to respond` + (reclaimed ? " (the request was never picked up and has been discarded)" : " (the request WAS picked up by AE; the operation may still be running)") + `. ${scriptRunningMessage(pushScripts)}.`, {
						durationMs: Date.now() - started,
						hint: SCRIPT_RUNNING_HINT
					});
					if (pushDialogs.length > 0) return dialogFailure(pushDialogs, reclaimed ? `timeout after ${timeoutMs}ms; the request was never picked up and has been discarded` : `timeout after ${timeoutMs}ms; the request WAS picked up by AE and may be waiting on the dialog`, started);
					return failure("TIMEOUT", `timeout after ${timeoutMs}ms waiting for After Effects to respond` + (reclaimed ? ` (the request was never picked up by AE after ${attempts} launch attempt${attempts === 1 ? "" : "s"} and has been discarded)` : ` (the request WAS picked up by AE; the operation may still be running). ${PICKED_UP_TIMEOUT_NOTE}`), {
						durationMs: Date.now() - started,
						hint: "Is AE running with a project open? Is 'Allow Scripts to Write Files and Access Network' enabled? Is AE showing a modal dialog (e.g. 'Attempt was made to run a second script')? Dismiss it — scripting is blocked while it is open. " + (process.platform === "darwin" ? "Is your MCP client allowed to control After Effects (System Settings → Privacy & Security → Automation)? " : "") + "Do not repeat a write until you inspect the actual project state. Preserve unsaved work; do not force-quit AE as routine recovery."
					});
				} finally {
					if (!leaveLockForRunningScript) await this.releaseBusyLock(id);
				}
			}
			/**
			* Write a request atomically (tmp + rename). The tmp name is dotted so it
			* can never match the JSX side's `request-*.json` glob mid-write.
			*/
			async writeRequest(dir, requestPath, request) {
				const tmpRequestPath = path$1.join(dir, `.${REQUEST_PREFIX}${request.id}.json.tmp`);
				await promises.writeFile(tmpRequestPath, serializeRequest(request), "utf8");
				await promises.rename(tmpRequestPath, requestPath);
			}
			/**
			* Spawn the dispatcher launch command. Errors land in `state.error` rather
			* than throwing: a spawn failure (ENOENT, EACCES, EFTYPE, …) can never
			* produce a response, so the poll loop checks the state every tick instead
			* of waiting out the full timeout. When the plan says the exit code is
			* meaningful (osascript), a non-zero exit is treated the same way — that is
			* how a denied macOS Automation permission (-1743) surfaces in seconds.
			*/
			launchDispatcher(state) {
				const launch = buildLaunchPlan(this.afterFxPath, process.platform, RUNTIME_DIR, this.dispatcherJsx);
				state.child = null;
				state.exited = false;
				try {
					const child = this.spawnFn(launch.command, launch.args, {
						stdio: launch.diagnoseExit ? [
							"ignore",
							"ignore",
							"pipe"
						] : "ignore",
						windowsHide: true,
						detached: false
					});
					state.child = child;
					child.unref?.();
					child.on("error", (err) => {
						state.error = err;
					});
					let stderr = "";
					if (launch.diagnoseExit) {
						child.stderr?.setEncoding("utf8");
						child.stderr?.on("data", (chunk) => {
							if (stderr.length < 4096) stderr += chunk;
						});
					}
					child.on("exit", (code) => {
						state.exited = true;
						if (launch.diagnoseExit && code !== null && code !== 0 && state.error === null) {
							const detail = stderr.trim();
							state.error = /* @__PURE__ */ new Error(`${launch.command} exited with code ${code}${detail ? `: ${detail}` : ""}`);
						}
					});
				} catch (err) {
					state.error = err instanceof Error ? err : new Error(String(err));
				}
				return launch;
			}
			/**
			* The launcher child outlived a forwarder with our request untouched: it is
			* AfterFX.exe becoming an instance, not delivering to one. Stop it before
			* it can run the request on an empty project, take the request back, and
			* explain — this is the one failure whose "success" would have been a lie.
			*/
			async phantomFailure(state, requestPath, started) {
				try {
					state.child?.kill();
				} catch {}
				if (!await this.safeUnlink(requestPath)) return failure("TIMEOUT", "the launcher was stopped, but the request disappeared before it could be reclaimed; the operation may have started in After Effects", {
					durationMs: Date.now() - started,
					hint: "Inspect the actual AE project and owned item IDs before retrying. A write may already have completed."
				});
				return failure("NO_INSTANCE", "no running After Effects instance received the script: the launched AfterFX.exe started booting an instance of its own. That happens when no After Effects is running, or when every running one was started with `AfterFX.exe -m` — those never receive `-r` scripts. The booting instance was terminated and the request discarded; nothing was executed.", {
					durationMs: Date.now() - started,
					hint: "Either drive one After Effects started WITHOUT -m, or set up multi-instance use: `npx @kumoproductions/mcp-aftereffects install-agent`, restart After Effects, and set AE_MCP_INSTANCE to the instance to address (see README, 'Multiple After Effects instances')."
				});
			}
			/**
			* Acquire the cross-process busy lock, or give up at `deadline`.
			*
			* `open("wx")` is the atomic primitive: exactly one process can create the
			* file. A lock whose mtime is older than BUSY_LOCK_STALE_MS lost its owner
			* (crashed server, killed AE) and is broken by any waiter; the retry then
			* races other waiters on the "wx", which stays safe — one wins, the rest
			* keep waiting.
			*/
			async acquireBusyLock(deadline, id) {
				for (;;) try {
					const handle = await promises.open(BUSY_LOCK_PATH, "wx");
					try {
						await handle.writeFile(JSON.stringify({
							pid: process.pid,
							id,
							startedAt: (/* @__PURE__ */ new Date()).toISOString()
						}), "utf8");
					} finally {
						await handle.close();
					}
					return true;
				} catch {
					try {
						const stat = await promises.stat(BUSY_LOCK_PATH);
						if (Date.now() - stat.mtimeMs > 9e4) await this.safeUnlink(BUSY_LOCK_PATH);
						else {
							const holder = await this.lockHolder();
							if (holder !== null && holder !== id && await this.requestFinished(holder, RUNTIME_DIR, true)) await this.safeUnlink(BUSY_LOCK_PATH);
						}
					} catch {}
					if (Date.now() >= deadline) return false;
					await sleep(80);
				}
			}
			/**
			* What After Effects is showing: real dialogs, and its own script progress
			* window (a script still running), kept apart so the progress window is
			* never reported as a dialog or offered for dismissal.
			*/
			async lookAtAe() {
				return splitScriptProgress(await this.scanDialogs());
			}
			/** Id recorded in the busy lock, or null when there is none or it is unreadable. */
			async lockHolder() {
				try {
					const raw = await promises.readFile(BUSY_LOCK_PATH, "utf8");
					const holder = JSON.parse(raw).id;
					return typeof holder === "string" ? holder : null;
				} catch {
					return null;
				}
			}
			/**
			* Has request `id` (served from `dir`) visibly finished? True when its
			* response is there (and, for a request that is not ours, has sat unclaimed
			* for UNCLAIMED_RESPONSE_GRACE_MS), or when all that is left is an empty
			* tmp response untouched for emptyTmpGraceMs — which is then removed.
			*/
			async requestFinished(id, dir, foreign) {
				const responsePath = path$1.join(dir, `${RESPONSE_PREFIX}${id}.json`);
				try {
					const stat = await promises.stat(responsePath);
					if (!foreign || Date.now() - stat.mtimeMs >= 2e3) return true;
				} catch {}
				const tmpPath = path$1.join(dir, `.${RESPONSE_PREFIX}${id}.json.tmp`);
				try {
					const stat = await promises.stat(tmpPath);
					if (stat.size === 0 && Date.now() - stat.mtimeMs >= this.emptyTmpGraceMs) {
						await this.safeUnlink(tmpPath);
						return true;
					}
				} catch {}
				return false;
			}
			/** Watch the leftovers of a request that timed out after After Effects picked it up. */
			watchOrphan(id, dir) {
				this.orphans.set(id, {
					id,
					dir,
					watchUntil: Date.now() + ORPHAN_WATCH_MS
				});
				if (this.reapTimer === null) {
					this.reapTimer = setInterval(() => void this.reapOrphans(), this.reapIntervalMs);
					this.reapTimer.unref?.();
				}
			}
			/**
			* For every watched request that has finished: remove its late response and
			* tmp file (nobody is waiting for them any more) and release the busy lock
			* if it is still the one that request held. Never throws.
			*/
			async reapOrphans() {
				for (const orphan of Array.from(this.orphans.values())) try {
					if (await this.requestFinished(orphan.id, orphan.dir, false)) {
						await this.safeUnlink(path$1.join(orphan.dir, `${RESPONSE_PREFIX}${orphan.id}.json`));
						await this.safeUnlink(path$1.join(orphan.dir, `.${RESPONSE_PREFIX}${orphan.id}.json.tmp`));
						await this.releaseBusyLock(orphan.id);
						this.orphans.delete(orphan.id);
					} else if (Date.now() > orphan.watchUntil) this.orphans.delete(orphan.id);
				} catch {}
				if (this.orphans.size === 0 && this.reapTimer !== null) {
					clearInterval(this.reapTimer);
					this.reapTimer = null;
				}
			}
			/**
			* True while the lock on disk is the one this call created. A call whose
			* event loop stalls past BUSY_LOCK_STALE_MS (a laptop suspend is enough —
			* the staleness test is wall-clock) has its lock broken and retaken by a
			* waiter, so neither refreshing nor releasing may touch the file blindly:
			* refreshing would keep someone else's lock alive forever, and releasing
			* would hand a third caller a dispatch slot while the second is still
			* driving AE — the exact collision the lock exists to prevent.
			*/
			async ownsBusyLock(id) {
				try {
					const raw = await promises.readFile(BUSY_LOCK_PATH, "utf8");
					return JSON.parse(raw).id === id;
				} catch {
					return false;
				}
			}
			/** Touch the lock so waiters keep seeing a live owner. Best-effort. */
			async refreshBusyLock(id) {
				if (!await this.ownsBusyLock(id)) return;
				const now = /* @__PURE__ */ new Date();
				try {
					await promises.utimes(BUSY_LOCK_PATH, now, now);
				} catch {}
			}
			/** Drop the lock, but only while it is still ours. */
			async releaseBusyLock(id) {
				if (!await this.ownsBusyLock(id)) return;
				await this.safeUnlink(BUSY_LOCK_PATH);
			}
			async fileExists(p) {
				try {
					await promises.access(p);
					return true;
				} catch {
					return false;
				}
			}
			/** AE never started, so nothing will consume the request — take it back. */
			async spawnFailure(err, requestPath, started) {
				await this.safeUnlink(requestPath);
				const automationDenied = isAutomationDenial(err.message);
				return failure(automationDenied ? "AUTOMATION_DENIED" : "TRANSPORT", `could not launch After Effects (${this.afterFxPath}): ${err.message}`, {
					stack: err.stack ?? null,
					durationMs: Date.now() - started,
					hint: process.platform === "darwin" ? automationDenied ? "Allow the agent host to control After Effects in System Settings → Privacy & Security → Automation, then retry a read-only connection check. No project write was dispatched." : "Check that AE_MCP_EXE points at the After Effects .app bundle and that your MCP client is allowed to control After Effects (System Settings → Privacy & Security → Automation)." : "Check that AE_MCP_EXE points at a real AfterFX.exe and that After Effects is not blocked by policy or antivirus."
				});
			}
			toEvalResult(parsed, durationMs) {
				if (parsed.ok) return {
					ok: true,
					result: parsed.result,
					error: null,
					errorCode: null,
					stack: null,
					logs: parsed.logs ?? [],
					durationMs,
					...parsed.rollback ? { rollback: parsed.rollback } : {}
				};
				const dispatchFailure = parsed.phase === "dispatch";
				return {
					ok: false,
					result: null,
					error: dispatchFailure ? `dispatcher error: ${parsed.error}` : parsed.error,
					errorCode: dispatchFailure ? "DISPATCHER" : "JSX_THROW",
					line: typeof parsed.line === "number" ? parsed.line : null,
					stack: parsed.stack,
					logs: parsed.logs ?? [],
					durationMs,
					...parsed.rollback ? { rollback: parsed.rollback } : {}
				};
			}
			async tryReadResponse(responsePath) {
				let raw;
				try {
					raw = await promises.readFile(responsePath, "utf8");
				} catch {
					return { kind: "pending" };
				}
				return readResponseText(raw);
			}
			/** Unlink and report whether the file was actually there. */
			async safeUnlink(p) {
				try {
					await promises.unlink(p);
					return true;
				} catch {
					return false;
				}
			}
			/**
			* Drop request/response files old enough that no caller can still be waiting
			* on them — leftovers from a crashed server or a killed AE — and instance
			* directories whose agent has been silent for as long. Best-effort and never
			* fatal; a shared mailbox means another live client may own files we are
			* looking at, so only clearly-expired ones are touched.
			*/
			async sweepStaleFiles() {
				try {
					const entries = await promises.readdir(RUNTIME_DIR);
					const cutoff = Date.now() - STALE_RUNTIME_FILE_MS;
					for (const entry of entries) {
						if (!((entry.startsWith("request-") || entry.startsWith("response-")) && entry.endsWith(".json"))) continue;
						const full = path$1.join(RUNTIME_DIR, entry);
						try {
							if ((await promises.stat(full)).mtimeMs < cutoff) await promises.unlink(full);
						} catch {}
					}
					await sweepOrphanTmpFiles(RUNTIME_DIR);
					try {
						for (const entry of await promises.readdir(INSTANCES_DIR)) await sweepOrphanTmpFiles(path$1.join(INSTANCES_DIR, entry));
					} catch {}
					try {
						const lockStat = await promises.stat(BUSY_LOCK_PATH);
						if (Date.now() - lockStat.mtimeMs > 9e4) await promises.unlink(BUSY_LOCK_PATH);
					} catch {}
					await sweepDeadInstanceDirs();
				} catch {}
			}
		};
		UNREADABLE_RESPONSE_GRACE_MS = 2e3;
		UnreadableResponseWatch = class {
			since = null;
			bytes = -1;
			settled(read, now) {
				if (read.kind !== "unreadable") {
					this.since = null;
					this.bytes = -1;
					return false;
				}
				if (this.since === null || read.bytes !== this.bytes) {
					this.since = now;
					this.bytes = read.bytes;
					return false;
				}
				return now - this.since >= UNREADABLE_RESPONSE_GRACE_MS;
			}
		};
	})))();
}

export { ACCESSIBILITY_HINT, FileIpcTransport, SCRIPT_RUNNING_HINT, buildInstanceLaunchPlan, describeInstance, dialogBlockMessage, dialogHint, dialogScanSupported, dismissAeDialog, init_FileIpcTransport, init_dialogs, init_instances, init_launcher, instanceLabel, jsxPath, listInstances, readInstance, resolveTarget, scanAeDialogs, scanAeWindows, scriptRunningMessage, splitScriptProgress };