import { execFile } from "node:child_process";
const SCRIPT_PROGRESS_NAME = /^\s*executing script\b/i;
const SCRIPT_PROGRESS_SHAPE = { layer: 8, width: 363, height: 181, tolerance: 2 };
function scriptProgressMatch(d) {
  if (SCRIPT_PROGRESS_NAME.test(d.title ?? "") || SCRIPT_PROGRESS_NAME.test(d.text)) return "name";
  const shape = SCRIPT_PROGRESS_SHAPE;
  if (!d.title && !d.text && d.layer === shape.layer && Math.abs(d.width - shape.width) <= shape.tolerance && Math.abs(d.height - shape.height) <= shape.tolerance) {
    return "size";
  }
  return null;
}
function splitScriptProgress(windows) {
  return {
    dialogs: windows.filter((w) => !w.scriptProgress),
    scripts: windows.filter((w) => !!w.scriptProgress)
  };
}
function scriptRunningMessage(scripts) {
  const how = scripts.every((s) => s.scriptProgress === "name") ? "its 'Executing Script' progress window is up" : "a window shaped like its 'Executing Script' progress window is up (its name could not be read, so it was recognised by size)";
  return `After Effects is still running a script (${how}): it is busy, not blocked by a dialog`;
}
const SCRIPT_RUNNING_HINT = "Do not close that window: its only action cancels the running script. Wait for the script to finish (raise timeoutMs for long work), then inspect the project before repeating a write.";
const SCAN_TIMEOUT_MS = 8e3;
const HELPER = String.raw`
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
const SCAN_SCRIPT = `${HELPER}
ConvertTo-Json -Compress -Depth 3 -InputObject (Get-AeDialogs)
`;
const DISMISS_SCRIPT = `${HELPER}
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
const DARWIN_SCRIPT = String.raw`
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
function encodeScript(script) {
  return Buffer.from(script, "utf16le").toString("base64");
}
const defaultRunner = (script, env) => new Promise((resolve, reject) => {
  execFile(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encodeScript(script)
    ],
    {
      env: { ...process.env, ...env },
      timeout: SCAN_TIMEOUT_MS,
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 1024 * 1024
    },
    (err, stdout) => err ? reject(err) : resolve(stdout)
  );
});
const defaultOsascriptRunner = (script, env) => new Promise((resolve, reject) => {
  execFile(
    "/usr/bin/osascript",
    ["-l", "JavaScript", "-e", script],
    {
      env: { ...process.env, ...env },
      timeout: SCAN_TIMEOUT_MS,
      encoding: "utf8",
      maxBuffer: 1024 * 1024
    },
    (err, stdout) => err ? reject(err) : resolve(stdout)
  );
});
let runner = defaultRunner;
let osascriptRunner = defaultOsascriptRunner;
function setPowerShellRunner(next) {
  const prev = runner;
  runner = next;
  return () => {
    runner = prev;
  };
}
function setOsascriptRunner(next) {
  const prev = osascriptRunner;
  osascriptRunner = next;
  return () => {
    osascriptRunner = prev;
  };
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
    if (typeof e.id !== "string" || typeof e.text !== "string" || typeof e.pid !== "number")
      continue;
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
    const raw = platform === "darwin" ? await osascriptRunner(DARWIN_SCRIPT, { AE_MCP_DIALOG_MODE: "scan" }) : await runner(SCAN_SCRIPT, {});
    return parseDialogScan(raw);
  } catch {
    return [];
  }
}
async function scanAeDialogs(platform = process.platform) {
  return splitScriptProgress(await scanAeWindows(platform)).dialogs;
}
const DISMISS_REASONS = /* @__PURE__ */ new Set(["not_found", "no_permission", "script_progress"]);
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
      ...posted ? {} : {
        reason: typeof r.reason === "string" && DISMISS_REASONS.has(r.reason) ? r.reason : "not_found"
      }
    };
  } catch {
    return notFound;
  }
}
function describeDialogs(dialogs) {
  return dialogs.map((d) => {
    const where = d.window ? ` in "${d.window}"` : "";
    const text = d.text ? `"${d.text.replace(/\s*\n\s*/g, " ")}"` : "(text unavailable)";
    return `${text} (pid ${d.pid}${where}, id ${d.id})`;
  }).join("; ");
}
function dialogBlockMessage(dialogs) {
  const n = dialogs.length;
  return `After Effects is showing ${n === 1 ? "a modal dialog" : `${n} modal dialogs`}, and no script can run until ${n === 1 ? "it is" : "they are"} closed: ${describeDialogs(dialogs)}`;
}
const DIALOG_HINT = "`instance.dismiss_dialog { id }` closes it by its cancel action (what Escape does), so a warning is acknowledged and a question (save changes?) is cancelled, never answered \u2014 then retry. If the user needs to answer it, ask them; it is often hidden behind the After Effects main window.";
const ACCESSIBILITY_HINT = "On macOS, reading a dialog's text and closing it need Accessibility permission for the app that runs this MCP server (System Settings > Privacy & Security > Accessibility). Without it, dialogs are only detected; ask the user to close them in After Effects.";
function dialogHint(dialogs) {
  return dialogs.some((d) => d.accessibility === false) ? `${DIALOG_HINT} ${ACCESSIBILITY_HINT}` : DIALOG_HINT;
}
export {
  ACCESSIBILITY_HINT,
  DARWIN_SCRIPT,
  DIALOG_HINT,
  SCRIPT_PROGRESS_NAME,
  SCRIPT_PROGRESS_SHAPE,
  SCRIPT_RUNNING_HINT,
  describeDialogs,
  dialogBlockMessage,
  dialogHint,
  dialogScanSupported,
  dismissAeDialog,
  parseDialogScan,
  scanAeDialogs,
  scanAeWindows,
  scriptProgressMatch,
  scriptRunningMessage,
  setOsascriptRunner,
  setPowerShellRunner,
  splitScriptProgress
};
