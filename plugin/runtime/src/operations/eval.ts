// eval.run — last resort escape hatch, moved from static ae_eval into the registry.
// All execution now goes through ae_do for consistency + ambient context.
//
// The code comes inline (`code`) or from a script file (`file`). A file is
// read and checked here, in Node, before After Effects is contacted, so a
// wrong path costs no round trip and a long build script no longer has to be
// pasted into the call. Either way the code runs the same: as a function body
// with the AE.* helpers and `args` in scope, inside the call's undo group, and
// rolled back if it throws (unless the caller passes rollback: false).

import { readFileSync, realpathSync, statSync } from "node:fs";
import * as path from "node:path";

import { RUNTIME_DIR, RUNTIME_ROOT } from "../config.js";
import { type PrepareResult, jsxVal, registerOp } from "../registry.js";

/** Largest script file eval.run reads. Build scripts measured so far are ~365 KB. */
export const MAX_SCRIPT_FILE_BYTES = 1024 * 1024;
/** Largest `args` value, serialized. It is inlined into the generated code. */
export const MAX_SCRIPT_ARGS_BYTES = 1024 * 1024;

/** realpath when the path exists, else the plain resolved path. */
function realOrResolved(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** True when `p` is `root` or inside it. */
function isInside(p: string, root: string): boolean {
  const rel = path.relative(root, p);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function refuse(error: string, hint?: string): PrepareResult {
  return hint ? { ok: false, error, hint } : { ok: false, error };
}

/**
 * Check and read a script file. Exported for tests; ae_do reaches it through
 * the operation's `prepare` hook.
 */
export function readScriptFile(file: string): { ok: true; code: string } | { ok: false; error: string; hint?: string } {
  if (!path.isAbsolute(file)) {
    return {
      ok: false,
      error: `file must be an absolute path (got '${file}'): the server's working directory is not yours`,
    };
  }
  let stat;
  try {
    stat = statSync(file);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    return code === "ENOENT" || code === "ENOTDIR"
      ? { ok: false, error: `script file ${file} does not exist` }
      : { ok: false, error: `cannot read script file ${file}: ${(err as Error).message}` };
  }
  if (!stat.isFile()) return { ok: false, error: `${file} is not a file` };
  if (stat.size === 0) return { ok: false, error: `script file ${file} is empty` };
  if (stat.size > MAX_SCRIPT_FILE_BYTES) {
    return {
      ok: false,
      error: `script file ${file} is too large (${stat.size} bytes; the limit is ${MAX_SCRIPT_FILE_BYTES})`,
      hint: "Split it, or move bulk data out of the code into a file the script reads itself.",
    };
  }
  // The mailbox is the transport's trust boundary: whatever sits there is
  // executed by After Effects. Compared after resolving symlinks on both
  // sides (on macOS the temp dir itself is a symlink into /private).
  const real = realOrResolved(file);
  for (const root of [RUNTIME_DIR, RUNTIME_ROOT]) {
    if (isInside(real, realOrResolved(root))) {
      return {
        ok: false,
        error: `refusing to run a script from inside the plugin's mailbox (${root})`,
        hint: "Keep scripts somewhere of your own; the mailbox only carries the plugin's requests.",
      };
    }
  }
  let text: string;
  try {
    text = readFileSync(real, "utf8");
  } catch (err) {
    return { ok: false, error: `cannot read script file ${file}: ${(err as Error).message}` };
  }
  if (text.indexOf("\u0000") !== -1) {
    return { ok: false, error: `script file ${file} looks binary (it contains NUL bytes); eval.run takes ExtendScript source` };
  }
  // A BOM is not code. CRLF and lone CR become LF so the line the error
  // reports is the line an editor shows.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  text = text.replace(/\r\n?/g, "\n");
  return { ok: true, code: text };
}

registerOp({
  name: "eval.run",
  category: "eval",
  description:
    "Execute custom ExtendScript (ES3). LAST RESORT — check ae_catalog first for a dedicated operation. " +
    "Pass the code inline as `code`, or as a script `file` (an absolute path; read and checked before After Effects " +
    "is contacted) — exactly one of the two. Code is a function body ending with `return <JSON-serializable>;`. " +
    "AE.* helpers are in scope, and `args` holds the optional `args` value you pass (null when omitted). " +
    "`log(msg)` pushes breadcrumbs. An error reports the line in YOUR code (or file:line), not in the plugin's wrapper. " +
    "The code already runs inside an automatic undo group (one Ctrl+Z reverts the call). If it THROWS, the call is " +
    "rolled back before the error is returned — its changes are undone with dialogs suppressed, and details.rollback " +
    "says whether that succeeded and what is left if not; returning { ok: false } is not a throw and is not rolled back. " +
    "Pass rollback: false for deliberately incremental work whose partial result you want to keep. " +
    "No undo is ever issued for a call that changed the render queue, and after a scripted render-queue change in the " +
    "session rollback is refused unless acceptRenderQueueRisk: true (After Effects 2027 has gone into crash recovery on " +
    "undo after such changes — observed twice, a precaution); details.rollback then lists addedItems and what to do next. " +
    "Do NOT call app.beginUndoGroup/endUndoGroup yourself; an unbalanced group leaks past this call and corrupts undo for " +
    "the whole session (and defeats the rollback). Do NOT undo/redo from here either (app.executeCommand 16/2035): inside " +
    "this call's group AE resolves them against it, so nothing is reverted — use project.undo / project.redo, which run " +
    "outside the group. Do NOT close/open/replace the project from here (app.open, app.newProject, app.project.close): the " +
    "open undo group is orphaned at the project boundary, AE raises an async 'UndoGroup Mismatch' dialog, and undo stays " +
    "broken for the session — use project.open / project.new, which run outside the group.",
  params: [
    {
      name: "code",
      type: "string",
      description: "ExtendScript function body. Give this or `file`, not both.",
      required: false,
    },
    {
      name: "file",
      type: "string",
      description:
        "Absolute path to a script file holding the function body (UTF-8, at most 1 MiB, not inside the plugin's mailbox). Give this or `code`, not both.",
      required: false,
    },
    {
      name: "args",
      type: "any",
      description: "Any JSON value, available to the code as `args` (null when omitted).",
      required: false,
    },
    {
      name: "rollback",
      type: "boolean",
      description:
        "Default true: if the code throws, undo the call's changes before returning the error. false keeps the partial result.",
      required: false,
    },
    {
      name: "acceptRenderQueueRisk",
      type: "boolean",
      description:
        "Default false. After a scripted render-queue change in this After Effects session, undo is refused (After Effects 2027 has gone into crash recovery on undo after such changes — observed twice; a precaution). Pass true only when the user accepts that risk, ideally after saving.",
      required: false,
    },
  ],
  rollback: (args) => args.rollback !== false,
  prepare(args) {
    const hasCode = typeof args.code === "string";
    const hasFile = typeof args.file === "string";
    if (hasCode === hasFile) {
      return refuse("give either `code` (inline ExtendScript) or `file` (an absolute path to a script), not both and not neither");
    }
    if (args.args !== undefined) {
      const size = Buffer.byteLength(JSON.stringify(args.args) ?? "null", "utf8");
      if (size > MAX_SCRIPT_ARGS_BYTES) {
        return refuse(`args is too large (${size} bytes serialized; the limit is ${MAX_SCRIPT_ARGS_BYTES})`);
      }
    }
    if (!hasFile) return { ok: true, args };
    const file = String(args.file);
    const read = readScriptFile(file);
    if (!read.ok) return refuse(read.error, read.hint);
    return { ok: true, args: { ...args, code: read.code }, source: { file } };
  },
  toJsx(args) {
    // `args` is declared on the code's own first line, so line N of the
    // caller's code (or file) is line N of what this returns: ae_do's error
    // line arithmetic needs no special case.
    return `var args = ${jsxVal(args.args)}; ${String(args.code)}`;
  },
});
