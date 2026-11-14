import { spawn as nodeSpawn } from "node:child_process";
import { mkdirSync, promises as fs, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import type { Readable } from "node:stream";

import {
  BUSY_LOCK_PATH,
  DISPATCHER_JSX,
  BUSY_LOCK_REFRESH_MS,
  BUSY_LOCK_STALE_MS,
  DEFAULT_TIMEOUT_MS,
  INSTANCES_DIR,
  LIVENESS_CHECK_MS,
  launchLockDir,
  MAX_LAUNCH_ATTEMPTS,
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
  instanceTargetFromEnv,
  requestPathFor,
  resolveAfterFxPath,
  responsePathFor,
  runtimeDirWarnings,
} from "../config.js";
import type { AeErrorCode } from "../errors.js";
import type { AeTransport, EvalRequest, EvalResult, RollbackReport } from "./AeTransport.js";
import {
  type AeDialog,
  SCRIPT_RUNNING_HINT,
  dialogBlockMessage,
  dialogHint,
  scanAeWindows,
  scriptRunningMessage,
  splitScriptProgress,
} from "./dialogs.js";
import {
  type InstanceInfo,
  type TargetResolution,
  describeInstance,
  listInstances,
  readInstance,
  resolveTarget,
  sweepDeadInstanceDirs,
} from "./instances.js";
import { LaunchLock, type LaunchLockRecord, launchLockPath } from "./launch-lock.js";
import { type LaunchPlan, buildLaunchPlan } from "./launcher.js";

/**
 * The slice of ChildProcess the transport uses. Injectable (see
 * FileIpcTransportOptions.spawn) so a test can stand in a launcher child that
 * never exits — the signature of AE booting a throwaway instance — without an
 * executable that behaves that way on every platform.
 */
export interface LaunchedProcess {
  pid?: number;
  on(event: "exit", listener: (code: number | null) => void): unknown;
  on(event: "error", listener: (err: Error) => void): unknown;
  kill(): unknown;
  unref?(): void;
  stderr?: Readable | null;
}

export interface LaunchSpawnOptions {
  stdio: "ignore" | ["ignore", "ignore", "pipe"];
  windowsHide: boolean;
  detached: boolean;
}

export type SpawnFn = (
  command: string,
  args: string[],
  options: LaunchSpawnOptions,
) => LaunchedProcess;

export interface FileIpcTransportOptions {
  /**
   * Which After Effects instance to address. A string is what AE_MCP_INSTANCE
   * would hold (an instance id, or the name of the project file an instance
   * has open); `null` forces the legacy push path regardless of live agents;
   * undefined (the default) reads AE_MCP_INSTANCE at call time.
   */
  instance?: string | null;
  /** Process launcher; defaults to child_process.spawn. */
  spawn?: SpawnFn;
  /**
   * Modal-window scan; defaults to scanAeWindows (Windows and macOS), which
   * marks After Effects' script progress window. Injectable for tests.
   */
  scanDialogs?: () => Promise<AeDialog[]>;
  /**
   * How often the leftovers of a request that timed out after pickup are
   * looked at in the background (default 1 s): its late response, its empty
   * tmp response, its busy lock.
   */
  reapIntervalMs?: number;
  /**
   * How long a zero-byte `.response-<id>.json.tmp` must sit untouched before
   * it is taken as the remains of a write that failed rather than one in
   * progress (default 10 s; serve.jsx writes a whole response in one call).
   */
  emptyTmpGraceMs?: number;
  /** The dispatcher script the push path launches (default: the package's jsx/dispatcher.jsx). Injectable for tests. */
  dispatcherJsx?: string;
  /**
   * The platform whose launch plan the push path follows (default:
   * process.platform). Injectable so the macOS launch rules can be tested
   * with a fake launcher on any machine.
   */
  platform?: NodeJS.Platform;
  /**
   * Folder of the launch lock (macOS only; config.ts, "The launch lock").
   * Default: launchLockDir(). null launches without it.
   */
  launchLockDir?: string | null;
}

/** A temp request/response file older than this is an orphan (see sweepStaleFiles). */
export const ORPHAN_TMP_SWEEP_MS = 5 * 60_000;

/**
 * Delete `.request-*.json.tmp` and `.response-*.json.tmp` in `dir` older than
 * ORPHAN_TMP_SWEEP_MS. Best-effort; never throws.
 */
export async function sweepOrphanTmpFiles(dir: string, now: number = Date.now()): Promise<string[]> {
  const removed: string[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return removed;
  }
  for (const entry of entries) {
    const isTmp =
      (entry.startsWith(`.${REQUEST_PREFIX}`) || entry.startsWith(`.${RESPONSE_PREFIX}`)) &&
      entry.endsWith(".json.tmp");
    if (!isTmp) continue;
    const full = path.join(dir, entry);
    try {
      const stat = await fs.stat(full);
      if (stat.isFile() && now - stat.mtimeMs > ORPHAN_TMP_SWEEP_MS) {
        await fs.unlink(full);
        removed.push(entry);
      }
    } catch {
      /* raced with its writer or another sweep */
    }
  }
  return removed;
}

/** Default for FileIpcTransportOptions.reapIntervalMs. */
export const REAP_INTERVAL_MS = 1_000;
/** Default for FileIpcTransportOptions.emptyTmpGraceMs. */
export const EMPTY_TMP_GRACE_MS = 10_000;
/**
 * A response nobody has collected for this long has no live owner polling for
 * it (owners poll every POLL_INTERVAL_MS), so the script that wrote it is done.
 */
export const UNCLAIMED_RESPONSE_GRACE_MS = 2_000;
/** How long the leftovers of a timed-out request are watched for. */
export const ORPHAN_WATCH_MS = 30 * 60_000;

/**
 * Said with every timeout after pickup. Live, 2026-11-10: an undo raised an
 * After Effects error box mid-script; the call timed out "picked up", and
 * instance.dialogs returned no dialogs while the box was up.
 */
export const PICKED_UP_TIMEOUT_NOTE =
  "The most likely cause is a modal dialog in After Effects — an error box raised by the script (an undo raised one on 2026-11-10) " +
  "or a warning — which blocks all scripting until a person clicks it; instance.dialogs may not list it, so look at the After Effects window. " +
  "Once it is dismissed the script finishes and the plugin cleans up after it (busy lock, temp response).";

/**
 * What a call says when its deadline passes behind a launch it would not
 * double (macOS): when that launch was sent, by whom, and that nothing new
 * was launched. "this call": our own osascript is alive and the request was
 * never consumed, so the DoScript waits in After Effects. "another call": the
 * launch lock is held by a live launcher, which may be waiting or already
 * running its script. Live, 2026-11-14: a second DoScript sent 3 s after the
 * first, while the first still waited, raised After Effects' "second script"
 * warning.
 */
export function waitingLaunchSentence(since: Date, by: "this call" | "another call", now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(since.getHours())}:${pad(since.getMinutes())}:${pad(since.getSeconds())}`;
  const seconds = Math.max(0, Math.round((now.getTime() - since.getTime()) / 1000));
  const what = by === "this call" ? "a launch has been waiting" : "a script has been running or waiting";
  return `${what} in After Effects since ${clock} (${seconds} s ago, sent by ${by}), and nothing new was launched`;
}

export const WAITING_LAUNCH_HINT =
  "Look at the After Effects window: a dialog there blocks every script until someone closes it (instance.dialogs lists it when " +
  "Accessibility allows), and a running script holds the next one until it ends. When it clears, the waiting launch runs; it no " +
  "longer finds this request, so retry after that. Do not quit or force-quit After Effects to clear it, and do not repeat a write " +
  "until you have inspected the project.";

export const RUNNING_ELSEWHERE_HINT =
  "Retry when that script has ended; a render can take minutes. If nothing should be running, look at the After Effects window " +
  "for a dialog (instance.dialogs lists it when Accessibility allows). Do not quit or force-quit After Effects to clear it, and do " +
  "not repeat a write until you have inspected the project.";

/** The leftovers of one request that timed out after pickup. */
interface Orphan {
  id: string;
  dir: string;
  watchUntil: number;
}

interface SpawnState {
  error: Error | null;
  child: LaunchedProcess | null;
  exited: boolean;
}

interface MailboxRequest {
  id: string;
  label: string;
  code: string;
  payload: unknown;
  undoGroup: boolean;
  suppressDialogs: boolean;
  rollback: boolean;
  acceptRenderQueueRisk: boolean;
}

export interface DispatcherResponse {
  id: string | null;
  ok: boolean;
  /** "dispatch" = failed before running our code; "execute" = our code threw. */
  phase?: "dispatch" | "execute";
  result: unknown;
  error: string | null;
  /**
   * 1-based line in the compiled function body where execution threw
   * (ExtendScript Error.line). Absent/null from dispatchers predating the
   * field. new Function's synthesized header is line 1, so the wrapped
   * request code starts at line 2 — callers that know the wrapper layout
   * (ae_do) translate this to a line in the code they assembled.
   */
  line?: number | null;
  stack: string | null;
  logs: string[];
  /** How a rollback of the call went; absent from dispatchers predating stage 7. */
  rollback?: RollbackReport | null;
}

/**
 * File-IPC transport. Two ways to reach After Effects, chosen per call by
 * `resolveTarget` (see transport/instances.ts):
 *
 * PUSH — write `request-<id>.json` into the shared mailbox, launch the
 * dispatcher inside AE (`AfterFX.exe -r` on Windows, `osascript`/DoScript on
 * macOS — see launcher.ts), poll `response-<id>.json`. Reaches the one
 * instance registered as THE running AE; instances started with `-m` are
 * invisible to it.
 *
 * PULL — write the request into `<mailbox>/instances/<id>/`, where the
 * resident agent (jsx/agent.jsx, loaded from that instance's Startup folder)
 * polls every 250 ms, and poll the response next to it. Nothing is spawned,
 * so nothing can collide with a script AE is already running. Used whenever
 * the instance named by AE_MCP_INSTANCE has a live heartbeat, or exactly one
 * agent is live and nothing was named.
 *
 * Mailbox: every request/response is its own file in a machine-wide directory
 * under the OS temp dir (see config.ts). That is what makes concurrent MCP
 * clients safe — the old single `request.json` / `response.json` pair meant a
 * second client could delete another's response (spurious timeout on a call
 * that actually applied) or overwrite an unconsumed request (a call that
 * silently never ran). With per-id files neither is expressible.
 *
 * Concurrency: calls from THIS process are still serialized with a promise
 * chain. AE executes JSX single-threaded, so overlapping our own calls would
 * only queue inside AE with less visibility.
 *
 * After Effects is resolved lazily on the first push (not in the constructor)
 * so the MCP server can start — and list its tools — on a machine where AE
 * isn't installed yet; the helpful "set AE_MCP_EXE" error surfaces per call.
 * Pull never needs the executable at all.
 */
export class FileIpcTransport implements AeTransport {
  private afterFxPath: string | null = null;
  private inflight: Promise<unknown> = Promise.resolve();
  /** Non-null when the mailbox directory is unusable; reported per call. */
  private readonly setupError: string | null = null;
  private readonly instanceOption: string | null | undefined;
  private readonly spawnFn: SpawnFn;
  private readonly dispatcherJsx: string;
  private readonly scanDialogs: () => Promise<AeDialog[]>;
  private readonly reapIntervalMs: number;
  private readonly emptyTmpGraceMs: number;
  private readonly platform: NodeJS.Platform;
  private readonly launchLockDir: string | null;
  private launchLockWarned = false;
  private readonly orphans = new Map<string, Orphan>();
  private reapTimer: NodeJS.Timeout | null = null;

  constructor(options: FileIpcTransportOptions = {}) {
    this.instanceOption = options.instance;
    this.reapIntervalMs = options.reapIntervalMs ?? REAP_INTERVAL_MS;
    this.emptyTmpGraceMs = options.emptyTmpGraceMs ?? EMPTY_TMP_GRACE_MS;
    this.spawnFn = options.spawn ?? ((command, args, opts) => nodeSpawn(command, args, opts));
    this.dispatcherJsx = options.dispatcherJsx ?? DISPATCHER_JSX;
    this.platform = options.platform ?? process.platform;
    this.launchLockDir =
      this.platform !== "darwin" ? null : options.launchLockDir !== undefined ? options.launchLockDir : launchLockDir();
    this.scanDialogs = options.scanDialogs ?? (() => scanAeWindows());
    try {
      // 0o700: write access to the mailbox is code execution inside AE (see
      // RUNTIME_DIR_MODE). recursive:true applies the mode to what it creates;
      // a directory that already exists keeps its mode, which is what
      // runtimeDirWarnings reports on below.
      mkdirSync(RUNTIME_DIR, { recursive: true, mode: RUNTIME_DIR_MODE });
      if (RUNTIME_DIR_IS_CUSTOM) {
        // dispatcher.jsx and agent.jsx derive the default mailbox path
        // themselves; when AE_MCP_RUNTIME_DIR moves it, this pointer is how
        // the JSX side finds it. Written at the fixed default location, which
        // is always writable.
        mkdirSync(RUNTIME_ROOT, { recursive: true, mode: RUNTIME_DIR_MODE });
        writeFileSync(RUNTIME_POINTER_PATH, RUNTIME_DIR, "utf8");
      } else {
        // Back on the default: clear any pointer a previous custom-dir run
        // left behind, or the JSX side would keep looking somewhere we no
        // longer write to.
        try {
          unlinkSync(RUNTIME_POINTER_PATH);
        } catch {
          /* nothing to clear */
        }
      }
      // Reported after both directories exist: the pointer directory is part of
      // the same trust boundary (the JSX side follows runtime-dir.txt before
      // looking at the default mailbox) and can only be checked once it's there.
      for (const warning of runtimeDirWarnings()) {
        process.stderr.write(`mcp-aftereffects: WARNING — ${warning}\n`);
      }
    } catch (err) {
      // Do NOT throw: the server must still start and list its tools so the
      // user gets a readable error from a tool call instead of a dead process.
      this.setupError = `cannot use runtime directory ${RUNTIME_DIR}: ${err instanceof Error ? err.message : String(err)}`;
    }
    void this.sweepStaleFiles();
  }

  /** Where the next call would go. For ae_context and the startup banner; never throws. */
  async describeTarget(instance?: string): Promise<TargetResolution> {
    return this.resolveTarget(instance);
  }

  /**
   * A per-call `instance` wins over the constructor option, which wins over
   * AE_MCP_INSTANCE; `instance: null` at construction forces push unless a
   * call names an instance explicitly.
   */
  private async resolveTarget(explicit?: string): Promise<TargetResolution> {
    const named = explicit?.trim();
    if (named) return resolveTarget(named);
    if (this.instanceOption === null) return { mode: "push" };
    const target =
      this.instanceOption === undefined ? instanceTargetFromEnv() : this.instanceOption;
    return resolveTarget(target);
  }

  async execute(req: EvalRequest): Promise<EvalResult> {
    // Serialize so our own concurrent tool calls queue here rather than inside AE.
    const prev = this.inflight;
    let release!: () => void;
    this.inflight = new Promise<void>((res) => {
      release = res;
    });
    try {
      await prev;
      return await this.executeOne(req);
    } catch (err) {
      // AeTransport contract: never throw — surface filesystem errors (e.g.
      // EPERM writing into the mailbox) as a normal failure result.
      return failure(
        "TRANSPORT",
        `mcp-aftereffects transport error: ${err instanceof Error ? err.message : String(err)}`,
        { stack: err instanceof Error && err.stack ? err.stack : null },
      );
    } finally {
      release();
    }
  }

  /** Stop watching for the leftovers of timed-out requests. */
  async close(): Promise<void> {
    if (this.reapTimer !== null) clearInterval(this.reapTimer);
    this.reapTimer = null;
  }

  private async executeOne(req: EvalRequest): Promise<EvalResult> {
    const started = Date.now();
    // Whatever an earlier timed-out request left that is now provably done
    // with goes before this one starts (the background reaper may not have
    // looked yet).
    await this.reapOrphans();
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (this.setupError !== null) {
      return failure("TRANSPORT", this.setupError, {
        durationMs: Date.now() - started,
      });
    }

    const target = await this.resolveTarget(req.instance);
    if (target.mode === "error") {
      // A named instance that stopped ticking is most often one stuck behind
      // a dialog — say which, rather than only that it went quiet.
      const { dialogs, scripts } = await this.lookAtAe();
      if (dialogs.length > 0) return dialogFailure(dialogs, target.message, started);
      if (scripts.length > 0) {
        return failure("NO_INSTANCE", `${target.message} — ${scriptRunningMessage(scripts)}`, {
          durationMs: Date.now() - started,
          hint: SCRIPT_RUNNING_HINT,
        });
      }
      return failure("NO_INSTANCE", target.message, {
        durationMs: Date.now() - started,
        hint: target.hint,
      });
    }

    const request: MailboxRequest = {
      id: randomUUID(),
      label: req.label ?? "action",
      code: req.code,
      payload: req.payload ?? null,
      // Sent explicitly rather than by omission: the JSX side defaults a
      // missing field to true, and "group this" must not depend on a key
      // surviving the trip.
      undoGroup: req.undoGroup !== false,
      suppressDialogs: req.suppressDialogs !== false,
      // Explicit as well: a missing field means "no rollback" to serve.jsx,
      // and rollback only ever applies inside an undo group.
      rollback: req.undoGroup !== false && req.rollback === true,
      acceptRenderQueueRisk: req.acceptRenderQueueRisk === true,
    };

    if (target.mode === "pull") {
      return this.executePull(request, target.instance, started, timeoutMs);
    }
    return this.executePush(request, started, timeoutMs);
  }

  // --- Pull: the instance's agent serves its own mailbox ---------------------

  private async executePull(
    request: MailboxRequest,
    instance: InstanceInfo,
    started: number,
    timeoutMs: number,
  ): Promise<EvalResult> {
    const dir = instance.dir;
    const requestPath = path.join(dir, `${REQUEST_PREFIX}${request.id}.json`);
    const responsePath = path.join(dir, `${RESPONSE_PREFIX}${request.id}.json`);
    await fs.mkdir(dir, { recursive: true });
    await this.writeRequest(dir, requestPath, request);

    // No busy lock and no launch: the agent dequeues one request per tick, so
    // two server processes aimed at the same instance simply queue in its
    // directory, and the "second script" refusal that the lock guards against
    // on the push path cannot happen here.
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
      if (!requestConsumed && now - lastLivenessAt >= LIVENESS_CHECK_MS) {
        lastLivenessAt = now;
        if (!(await this.fileExists(requestPath))) {
          requestConsumed = true;
        } else {
          // Still waiting to be picked up: is anyone there to pick it up? A
          // heartbeat that stopped (and did not say `busy`) means AE quit,
          // crashed, or is stuck in a modal — fail now, not at the deadline.
          const current = await readInstance(dir, now);
          if (!current.alive) {
            // AE can consume the request between the existence check above
            // and this unlink. Only a successful reclaim proves that no
            // script picked it up; a missing file means the write is uncertain.
            const reclaimed = await this.safeUnlink(requestPath);
            if (!reclaimed) this.watchOrphan(request.id, dir);
            const outcome = reclaimed
              ? "the request was never picked up and has been discarded"
              : "the request disappeared before it could be reclaimed; the operation may have started";
            const { dialogs, scripts } = await this.lookAtAe();
            if (dialogs.length > 0) {
              return dialogFailure(
                dialogs,
                `After Effects instance '${instance.id}' stopped responding; ${outcome}`,
                started,
              );
            }
            if (scripts.length > 0) {
              return failure(
                reclaimed ? "NO_INSTANCE" : "TIMEOUT",
                `After Effects instance '${instance.id}' stopped responding: ${scriptRunningMessage(scripts)}; ${outcome}`,
                { durationMs: Date.now() - started, hint: SCRIPT_RUNNING_HINT },
              );
            }
            return failure(
              reclaimed ? "NO_INSTANCE" : "TIMEOUT",
              `After Effects instance '${instance.id}' stopped responding (${describeInstance(current)}); ` +
                outcome,
              {
                durationMs: Date.now() - started,
                hint: reclaimed
                  ? "Is that After Effects still running, and free of modal dialogs? Scripts do not run while one is open. " +
                    "If it was restarted, the agent re-registers about ten seconds after launch — retry then."
                  : "Inspect the actual AE project and owned item IDs before retrying. A write may already have completed.",
              },
            );
          }
        }
      }
      await sleep(POLL_INTERVAL_MS);
    }

    const reclaimed = await this.safeUnlink(requestPath);
    if (!reclaimed) this.watchOrphan(request.id, dir);
    const pullTimeoutBase =
      `timeout after ${timeoutMs}ms waiting for After Effects instance '${instance.id}' to respond` +
      (reclaimed
        ? " (the request was never picked up and has been discarded)"
        : " (the request WAS picked up by the instance; the operation may still be running)");
    const pull = await this.lookAtAe();
    if (pull.dialogs.length > 0) return dialogFailure(pull.dialogs, pullTimeoutBase, started);
    if (pull.scripts.length > 0) {
      return failure("TIMEOUT", `${pullTimeoutBase}. ${scriptRunningMessage(pull.scripts)}.`, {
        durationMs: Date.now() - started,
        hint: SCRIPT_RUNNING_HINT,
      });
    }
    const pullTimeoutMessage = reclaimed ? pullTimeoutBase : `${pullTimeoutBase}. ${PICKED_UP_TIMEOUT_NOTE}`;
    return failure("TIMEOUT", pullTimeoutMessage, {
      durationMs: Date.now() - started,
      hint:
        "Is After Effects showing a modal dialog, or rendering/previewing? Scripts wait for both. " +
        "For a long operation, raise timeoutMs. Inspect the project before repeating a write.",
    });
  }

  // --- Push: launch the dispatcher into the registered instance ---------------

  private async executePush(
    request: MailboxRequest,
    started: number,
    timeoutMs: number,
  ): Promise<EvalResult> {
    try {
      this.afterFxPath ??= resolveAfterFxPath();
    } catch (err) {
      return failure("AE_NOT_FOUND", err instanceof Error ? err.message : String(err), {
        durationMs: Date.now() - started,
      });
    }

    // 0. A resident agent that registered and then stopped ticking is the
    // signature of an After Effects stuck behind a dialog — and every `-r`
    // launched at it would only stack a "Cannot run a script while a modal
    // dialog is waiting for response" alert on top. Look before launching.
    if ((await listInstances()).some((i) => !i.alive)) {
      const { dialogs, scripts } = await this.lookAtAe();
      if (dialogs.length > 0) {
        return dialogFailure(dialogs, "nothing was sent to After Effects", started);
      }
      if (scripts.length > 0) {
        // A second script sent into a running one is what raises AE's
        // "second script" warning — a real modal. Do not send.
        return failure("TIMEOUT", `${scriptRunningMessage(scripts)}; nothing was sent to After Effects`, {
          durationMs: Date.now() - started,
          hint: SCRIPT_RUNNING_HINT,
        });
      }
    }

    // The script file After Effects is told to run must be there: on Windows
    // `-r` of a missing file, and on macOS an unguarded evalFile of one,
    // raise a modal ("Unable to execute script at line 1. File or folder
    // does not exist") that blocks all scripting. Nothing is written or
    // launched when it is gone.
    if (!(await this.fileExists(this.dispatcherJsx))) {
      return failure(
        "TRANSPORT",
        `the dispatcher script ${this.dispatcherJsx} is not there (the plugin was updated, moved or removed while this server ran); nothing was sent to After Effects`,
        {
          durationMs: Date.now() - started,
          hint: "Restart the MCP server (or the agent host) so it runs from the plugin's current folder.",
        },
      );
    }

    const id = request.id;
    const requestPath = requestPathFor(id);
    const responsePath = responsePathFor(id);

    // 1. Write the request atomically (tmp + rename).
    await this.writeRequest(RUNTIME_DIR, requestPath, request);

    // 2. Acquire the cross-process busy lock. AE refuses a script delivered
    // while another script runs — with a modal warning that halts all
    // scripting until dismissed — so two server processes must not dispatch
    // concurrently. Same-process calls are already serialized by `inflight`;
    // the lock extends that across processes (see config.ts).
    const deadline = started + timeoutMs;
    if (!(await this.acquireBusyLock(deadline, id))) {
      await this.safeUnlink(requestPath);
      return failure(
        "TIMEOUT",
        `timeout after ${timeoutMs}ms waiting for After Effects to become available — ` +
          "another call (possibly from another MCP server process) holds the dispatcher busy lock",
        {
          durationMs: Date.now() - started,
          hint:
            `The lock (${BUSY_LOCK_PATH}) is refreshed while its owner is alive and expires ` +
            `${Math.round(BUSY_LOCK_STALE_MS / 1000)}s after the owner stops. If this persists, ` +
            "check AE for a stuck script or a modal dialog, and avoid running two MCP servers against one AE.",
        },
      );
    }
    // True when the request was consumed but no response arrived in time: the
    // script may still be running inside AE, so the lock must outlive this
    // call and expire on its own instead of inviting an immediate collision.
    let leaveLockForRunningScript = false;
    // Held until the launcher exits (launchUnderLock): on macOS the
    // osascript lives as long as its DoScript, waiting and running.
    const lock = this.launchLockFor();
    try {
      // 3. Launch the dispatcher (launcher.ts picks the per-platform command)
      // unless another launch is still waiting in After Effects: on macOS a
      // second DoScript sent while one waits is how AE's "second script"
      // warning starts. The command returns immediately on Windows; on macOS
      // osascript blocks for the DoScript duration — either way the actual
      // work happens inside AE and we learn the outcome from the response
      // file, not the child.
      const spawnState: SpawnState = { error: null, child: null, exited: false };
      const ls: {
        plan: LaunchPlan | null;
        launchedAt: number;
        attempts: number;
        // The live launch this call waits behind instead of launching:
        // another call's (this server's or another's), or, after a relaunch
        // was refused the lock, whoever took it.
        waitingBehind: LaunchLockRecord | null;
      } = { plan: null, launchedAt: started, attempts: 0, waitingBehind: null };
      const tryLaunch = async (): Promise<void> => {
        const outcome = await this.launchUnderLock(spawnState, id, lock);
        if ("heldBy" in outcome) {
          ls.waitingBehind = outcome.heldBy;
          return;
        }
        ls.waitingBehind = null;
        ls.plan = outcome.plan;
        ls.launchedAt = Date.now();
        ls.attempts++;
      };
      await tryLaunch();
      if (spawnState.error !== null) {
        return await this.spawnFailure(spawnState.error, requestPath, started);
      }

      // 4. Poll for OUR response file. While polling: keep the busy lock
      // fresh, and watch what became of the launch while the request sits
      // unconsumed. What can be wrong there:
      //   - AE refused the script (its "second script" warning) because
      //     something we cannot see was running when ours arrived — the
      //     launcher child exited normally, so launch again;
      //   - macOS, the launcher (osascript) is still alive: AE has the
      //     DoScript and has not started it — a dialog, a running script, a
      //     slow start. Launching again is exactly how a second script
      //     arrives, so never do; look for a dialog to say so early, else
      //     wait for the deadline;
      //   - Windows, the launcher child is still alive: nothing was
      //     registered to receive the hand-off, and it is booting an
      //     instance of its own that would run the request on an empty
      //     project ~8s from now. Kill it and say so; relaunching would only
      //     boot a second one.
      let lastRefreshAt = started;
      let requestConsumed = false;
      let looksWhileWaiting = 0;
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
        if (spawnState.error !== null) {
          return await this.spawnFailure(spawnState.error, requestPath, started);
        }
        const now = Date.now();
        if (now - lastRefreshAt >= BUSY_LOCK_REFRESH_MS) {
          lastRefreshAt = now;
          await this.refreshBusyLock(id);
        }
        const current = ls.plan;
        if (!requestConsumed && ls.waitingBehind !== null) {
          // Someone else's launch still waits in After Effects. Launch only
          // once it is served or gone; if it runs from our own mailbox it
          // may even serve this request.
          if (!(await this.fileExists(requestPath))) {
            requestConsumed = true;
            } else {
            await tryLaunch();
            if (spawnState.error !== null) {
              return await this.spawnFailure(spawnState.error, requestPath, started);
            }
          }
        } else if (!requestConsumed && current !== null && now - ls.launchedAt >= RELAUNCH_UNCONSUMED_AFTER_MS) {
          if (!(await this.fileExists(requestPath))) {
            requestConsumed = true;
          } else if (spawnState.child !== null && !spawnState.exited && current.detectPhantom) {
            if (now - ls.launchedAt >= PHANTOM_LAUNCH_MS) {
              return await this.phantomFailure(spawnState, requestPath, started);
            }
            // A forwarder that is merely slow exits shortly; give it until
            // PHANTOM_LAUNCH_MS before deciding.
          } else if (spawnState.child !== null && !spawnState.exited) {
            // macOS: our DoScript waits in After Effects. A dialog there
            // would keep it waiting past any deadline, so look for one a
            // couple of times (as often as the relaunches used to), and
            // otherwise wait. Nothing is launched.
            if (
              looksWhileWaiting < MAX_LAUNCH_ATTEMPTS - 1 &&
              now - ls.launchedAt >= RELAUNCH_UNCONSUMED_AFTER_MS * (looksWhileWaiting + 1)
            ) {
              looksWhileWaiting++;
              const { dialogs } = await this.lookAtAe();
              if (dialogs.length > 0) {
                const reclaimed = await this.safeUnlink(requestPath);
                leaveLockForRunningScript = !reclaimed;
                if (!reclaimed) this.watchOrphan(id, RUNTIME_DIR);
                return dialogFailure(
                  dialogs,
                  reclaimed
                    ? `${waitingLaunchSentence(new Date(ls.launchedAt), "this call")}; the request was never picked up and has been discarded`
                    : "the request disappeared before it could be reclaimed; the operation may have started",
                  started,
                );
              }
            }
          } else if (
            ls.attempts < MAX_LAUNCH_ATTEMPTS &&
            now - ls.launchedAt >= RELAUNCH_UNCONSUMED_AFTER_MS * ls.attempts
          ) {
            // Unconsumed with the launcher gone: either AE refused the
            // script (the "second script" case — relaunching fixes it) or a
            // dialog blocks scripting, where each relaunch only adds another
            // alert. Tell the two apart before launching again.
            const { dialogs, scripts } = await this.lookAtAe();
            if (dialogs.length === 0 && scripts.length > 0) {
              // Someone else's script is still running: launching again would
              // only stack AE's "second script" warning. Wait for it.
              ls.launchedAt = Date.now();
              await sleep(POLL_INTERVAL_MS);
              continue;
            }
            if (dialogs.length > 0) {
              const reclaimed = await this.safeUnlink(requestPath);
              leaveLockForRunningScript = !reclaimed;
              if (!reclaimed) this.watchOrphan(id, RUNTIME_DIR);
              return dialogFailure(
                dialogs,
                reclaimed
                  ? `the request was never picked up after ${ls.attempts} launch attempt${ls.attempts === 1 ? "" : "s"} and has been discarded`
                  : "the request disappeared before it could be reclaimed; the operation may have started",
                started,
              );
            }
            await tryLaunch();
            if (spawnState.error !== null) {
              return await this.spawnFailure(spawnState.error, requestPath, started);
            }
          }
        }
        await sleep(POLL_INTERVAL_MS);
      }

      // 5. Timed out. Reclaim the request if it is still sitting unconsumed:
      // leaving it there is how a "failed" mutation used to get picked up by a
      // later spawn and apply itself minutes after the caller gave up. If the
      // dispatcher already consumed it this unlink is a no-op.
      const reclaimed = await this.safeUnlink(requestPath);
      leaveLockForRunningScript = !reclaimed;
      if (!reclaimed) this.watchOrphan(id, RUNTIME_DIR);
      const { dialogs: pushDialogs, scripts: pushScripts } = await this.lookAtAe();
      // A launch this call would not double, and this request never picked
      // up: say that, in those words. Behind another call's launch, its
      // script may be waiting or already running (a render of minutes holds
      // every other call); behind our own, the DoScript waits.
      const behindAnother = reclaimed && ls.waitingBehind !== null ? ls.waitingBehind : null;
      const ownWaiting =
        reclaimed &&
        behindAnother === null &&
        ls.plan !== null &&
        !ls.plan.detectPhantom &&
        spawnState.child !== null &&
        !spawnState.exited;
      if (behindAnother !== null || ownWaiting) {
        const waiting = waitingLaunchSentence(
          new Date(behindAnother !== null ? behindAnother.launchedAt : ls.launchedAt),
          behindAnother !== null ? "another call" : "this call",
        );
        if (pushDialogs.length > 0) {
          return dialogFailure(
            pushDialogs,
            `timeout after ${timeoutMs}ms; ${waiting}; the request was never picked up and has been discarded`,
            started,
          );
        }
        const why =
          pushScripts.length > 0
            ? `${scriptRunningMessage(pushScripts)}. `
            : behindAnother !== null
              ? "One After Effects takes one script at a time, so a long one, such as a render, makes every other call wait. "
              : "After Effects is probably showing a dialog or is busy with another script. ";
        return failure(
          "TIMEOUT",
          `timeout after ${timeoutMs}ms: ${waiting}. ${why}The request was never picked up and has been discarded.`,
          {
            durationMs: Date.now() - started,
            hint: behindAnother !== null ? RUNNING_ELSEWHERE_HINT : WAITING_LAUNCH_HINT,
          },
        );
      }
      if (pushDialogs.length === 0 && pushScripts.length > 0) {
        return failure(
          "TIMEOUT",
          `timeout after ${timeoutMs}ms waiting for After Effects to respond` +
            (reclaimed
              ? " (the request was never picked up and has been discarded)"
              : " (the request WAS picked up by AE; the operation may still be running)") +
            `. ${scriptRunningMessage(pushScripts)}.`,
          { durationMs: Date.now() - started, hint: SCRIPT_RUNNING_HINT },
        );
      }
      if (pushDialogs.length > 0) {
        return dialogFailure(
          pushDialogs,
          reclaimed
            ? `timeout after ${timeoutMs}ms; the request was never picked up and has been discarded`
            : `timeout after ${timeoutMs}ms; the request WAS picked up by AE and may be waiting on the dialog`,
          started,
        );
      }
      return failure(
        "TIMEOUT",
        `timeout after ${timeoutMs}ms waiting for After Effects to respond` +
          (reclaimed
            ? ` (the request was never picked up by AE after ${ls.attempts} launch attempt${ls.attempts === 1 ? "" : "s"} and has been discarded)`
            : ` (the request WAS picked up by AE; the operation may still be running). ${PICKED_UP_TIMEOUT_NOTE}`),
        {
          durationMs: Date.now() - started,
          hint:
            "Is AE running with a project open? Is 'Allow Scripts to Write Files and Access Network' enabled? " +
            "Is AE showing a modal dialog (e.g. 'Attempt was made to run a second script')? Dismiss it — scripting is blocked while it is open. " +
            (process.platform === "darwin"
              ? "Is your MCP client allowed to control After Effects (System Settings → Privacy & Security → Automation)? "
              : "") +
            "Do not repeat a write until you inspect the actual project state. Preserve unsaved work; do not force-quit AE as routine recovery.",
        },
      );
    } finally {
      if (!leaveLockForRunningScript) await this.releaseBusyLock(id);
    }
  }

  /**
   * Write a request atomically (tmp + rename). The tmp name is dotted so it
   * can never match the JSX side's `request-*.json` glob mid-write.
   */
  private async writeRequest(
    dir: string,
    requestPath: string,
    request: MailboxRequest,
  ): Promise<void> {
    const tmpRequestPath = path.join(dir, `.${REQUEST_PREFIX}${request.id}.json.tmp`);
    await fs.writeFile(tmpRequestPath, serializeRequest(request), "utf8");
    await fs.rename(tmpRequestPath, requestPath);
  }

  /**
   * Spawn the dispatcher launch command. Errors land in `state.error` rather
   * than throwing: a spawn failure (ENOENT, EACCES, EFTYPE, …) can never
   * produce a response, so the poll loop checks the state every tick instead
   * of waiting out the full timeout. When the plan says the exit code is
   * meaningful (osascript), a non-zero exit is treated the same way — that is
   * how a denied macOS Automation permission (-1743) surfaces in seconds.
   */
  private launchDispatcher(state: SpawnState, onGone: () => void = () => {}): LaunchPlan {
    const launch = buildLaunchPlan(this.afterFxPath as string, this.platform, RUNTIME_DIR, this.dispatcherJsx);
    state.child = null;
    state.exited = false;
    try {
      const child = this.spawnFn(launch.command, launch.args, {
        stdio: launch.diagnoseExit ? ["ignore", "ignore", "pipe"] : "ignore",
        windowsHide: true,
        detached: false,
      });
      state.child = child;
      // We don't wait for the child; AE may keep it short- or long-lived
      // depending on whether a new instance was started. Just make sure we
      // don't leak a handle that blocks node exit.
      child.unref?.();
      child.on("error", (err) => {
        state.error = err;
        onGone();
      });
      let stderr = "";
      if (launch.diagnoseExit) {
        child.stderr?.setEncoding("utf8");
        child.stderr?.on("data", (chunk: string) => {
          if (stderr.length < 4096) stderr += chunk;
        });
      }
      child.on("exit", (code) => {
        state.exited = true;
        onGone();
        if (launch.diagnoseExit && code !== null && code !== 0 && state.error === null) {
          const detail = stderr.trim();
          state.error = new Error(
            `${launch.command} exited with code ${code}${detail ? `: ${detail}` : ""}`,
          );
        }
      });
    } catch (err) {
      state.error = err instanceof Error ? err : new Error(String(err));
      onGone();
    }
    return launch;
  }

  /** The launch lock for this After Effects, or null where launches take none (Windows, or switched off). */
  private launchLockFor(): LaunchLock | null {
    if (this.launchLockDir === null || this.afterFxPath === null) return null;
    return new LaunchLock(launchLockPath(this.launchLockDir, this.afterFxPath));
  }

  /**
   * Launch the dispatcher holding the launch lock, or report the live launch
   * that holds it and launch nothing. The lock goes back only when the
   * launcher exits or fails to start: on macOS the osascript lives as long as
   * its DoScript, waiting and then running, and one DoScript at a time is
   * what After Effects' "second script" warning asks for. A lock folder that
   * cannot be used costs the lock, not the launch: the call goes ahead as it
   * did before the lock existed.
   */
  private async launchUnderLock(
    state: SpawnState,
    requestId: string,
    lock: LaunchLock | null,
  ): Promise<{ plan: LaunchPlan } | { heldBy: LaunchLockRecord }> {
    let token: string | null = null;
    if (lock !== null) {
      try {
        const claim = await lock.tryAcquire(requestId);
        if ("heldBy" in claim) return { heldBy: claim.heldBy };
        token = claim.token;
      } catch (err) {
        if (!this.launchLockWarned) {
          this.launchLockWarned = true;
          console.error(
            `[mcp-aftereffects] launch lock ${lock.file} is unusable (${err instanceof Error ? err.message : String(err)}); ` +
              "launching without it, so another server process could launch at the same moment",
          );
        }
      }
    }
    let recorded: Promise<void> = Promise.resolve();
    let released = false;
    const release = (): void => {
      if (released || token === null || lock === null) return;
      released = true;
      const own = token;
      void recorded.then(() => lock.release(own)).catch(() => {});
    };
    const plan = this.launchDispatcher(state, release);
    if (token !== null && lock !== null && state.error === null && state.child?.pid !== undefined) {
      const own = token;
      const pid = state.child.pid;
      recorded = lock.setLauncher(own, pid).catch(() => {});
      await recorded;
    } else if (state.error !== null || state.child === null) {
      release();
    }
    return { plan };
  }

  /**
   * The launcher child outlived a forwarder with our request untouched: it is
   * AfterFX.exe becoming an instance, not delivering to one. Stop it before
   * it can run the request on an empty project, take the request back, and
   * explain — this is the one failure whose "success" would have been a lie.
   */
  private async phantomFailure(
    state: SpawnState,
    requestPath: string,
    started: number,
  ): Promise<EvalResult> {
    try {
      state.child?.kill();
    } catch {
      /* already gone */
    }
    const reclaimed = await this.safeUnlink(requestPath);
    if (!reclaimed) {
      return failure(
        "TIMEOUT",
        "the launcher was stopped, but the request disappeared before it could be reclaimed; the operation may have started in After Effects",
        {
          durationMs: Date.now() - started,
          hint: "Inspect the actual AE project and owned item IDs before retrying. A write may already have completed.",
        },
      );
    }
    return failure(
      "NO_INSTANCE",
      "no running After Effects instance received the script: the launched AfterFX.exe started booting an " +
        "instance of its own. That happens when no After Effects is running, or when every running one was " +
        "started with `AfterFX.exe -m` — those never receive `-r` scripts. The booting instance was terminated " +
        "and the request discarded; nothing was executed.",
      {
        durationMs: Date.now() - started,
        hint:
          "Either drive one After Effects started WITHOUT -m, or set up multi-instance use: " +
          "`npx @kumoproductions/mcp-aftereffects install-agent`, restart After Effects, and set AE_MCP_INSTANCE " +
          "to the instance to address (see README, 'Multiple After Effects instances').",
      },
    );
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
  private async acquireBusyLock(deadline: number, id: string): Promise<boolean> {
    for (;;) {
      try {
        const handle = await fs.open(BUSY_LOCK_PATH, "wx");
        try {
          await handle.writeFile(
            JSON.stringify({ pid: process.pid, id, startedAt: new Date().toISOString() }),
            "utf8",
          );
        } finally {
          await handle.close();
        }
        return true;
      } catch {
        try {
          const stat = await fs.stat(BUSY_LOCK_PATH);
          if (Date.now() - stat.mtimeMs > BUSY_LOCK_STALE_MS) {
            await this.safeUnlink(BUSY_LOCK_PATH);
          } else {
            // A lock whose request has visibly finished — its response sits
            // unclaimed, or all that is left of it is an empty tmp response —
            // belongs to a script that is no longer running, whichever
            // process took it. Waiting out the stale threshold on it would
            // only turn the next call into a busy-lock timeout.
            const holder = await this.lockHolder();
            if (holder !== null && holder !== id && (await this.requestFinished(holder, RUNTIME_DIR, true))) {
              await this.safeUnlink(BUSY_LOCK_PATH);
            }
          }
        } catch {
          // Lock vanished between open and stat, or the mailbox itself is
          // unreadable — fall through to the deadline check either way.
        }
        if (Date.now() >= deadline) return false;
        await sleep(POLL_INTERVAL_MS);
      }
    }
  }

  /**
   * What After Effects is showing: real dialogs, and its own script progress
   * window (a script still running), kept apart so the progress window is
   * never reported as a dialog or offered for dismissal.
   */
  private async lookAtAe(): Promise<{ dialogs: AeDialog[]; scripts: AeDialog[] }> {
    return splitScriptProgress(await this.scanDialogs());
  }

  /** Id recorded in the busy lock, or null when there is none or it is unreadable. */
  private async lockHolder(): Promise<string | null> {
    try {
      const raw = await fs.readFile(BUSY_LOCK_PATH, "utf8");
      const holder = (JSON.parse(raw) as { id?: unknown }).id;
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
  private async requestFinished(id: string, dir: string, foreign: boolean): Promise<boolean> {
    const responsePath = path.join(dir, `${RESPONSE_PREFIX}${id}.json`);
    try {
      const stat = await fs.stat(responsePath);
      if (!foreign || Date.now() - stat.mtimeMs >= UNCLAIMED_RESPONSE_GRACE_MS) return true;
    } catch {
      /* no response */
    }
    const tmpPath = path.join(dir, `.${RESPONSE_PREFIX}${id}.json.tmp`);
    try {
      const stat = await fs.stat(tmpPath);
      if (stat.size === 0 && Date.now() - stat.mtimeMs >= this.emptyTmpGraceMs) {
        await this.safeUnlink(tmpPath);
        return true;
      }
    } catch {
      /* no tmp */
    }
    return false;
  }

  /** Watch the leftovers of a request that timed out after After Effects picked it up. */
  private watchOrphan(id: string, dir: string): void {
    this.orphans.set(id, { id, dir, watchUntil: Date.now() + ORPHAN_WATCH_MS });
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
  private async reapOrphans(): Promise<void> {
    for (const orphan of Array.from(this.orphans.values())) {
      try {
        if (await this.requestFinished(orphan.id, orphan.dir, false)) {
          await this.safeUnlink(path.join(orphan.dir, `${RESPONSE_PREFIX}${orphan.id}.json`));
          await this.safeUnlink(path.join(orphan.dir, `.${RESPONSE_PREFIX}${orphan.id}.json.tmp`));
          await this.releaseBusyLock(orphan.id);
          this.orphans.delete(orphan.id);
        } else if (Date.now() > orphan.watchUntil) {
          // The busy lock expires on its own (BUSY_LOCK_STALE_MS); the
          // hourly sweep takes any file.
          this.orphans.delete(orphan.id);
        }
      } catch {
        /* best-effort */
      }
    }
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
  private async ownsBusyLock(id: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(BUSY_LOCK_PATH, "utf8");
      return (JSON.parse(raw) as { id?: unknown }).id === id;
    } catch {
      return false;
    }
  }

  /** Touch the lock so waiters keep seeing a live owner. Best-effort. */
  private async refreshBusyLock(id: string): Promise<void> {
    if (!(await this.ownsBusyLock(id))) return;
    const now = new Date();
    try {
      await fs.utimes(BUSY_LOCK_PATH, now, now);
    } catch {
      /* lock swept or broken — nothing to refresh */
    }
  }

  /** Drop the lock, but only while it is still ours. */
  private async releaseBusyLock(id: string): Promise<void> {
    if (!(await this.ownsBusyLock(id))) return;
    await this.safeUnlink(BUSY_LOCK_PATH);
  }

  private async fileExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  /** AE never started, so nothing will consume the request — take it back. */
  private async spawnFailure(
    err: Error,
    requestPath: string,
    started: number,
  ): Promise<EvalResult> {
    await this.safeUnlink(requestPath);
    const automationDenied = isAutomationDenial(err.message);
    return failure(
      automationDenied ? "AUTOMATION_DENIED" : "TRANSPORT",
      `could not launch After Effects (${this.afterFxPath}): ${err.message}`,
      {
        stack: err.stack ?? null,
        durationMs: Date.now() - started,
        hint:
          process.platform === "darwin"
            ? automationDenied
              ? "Allow the agent host to control After Effects in System Settings → Privacy & Security → Automation, then retry a read-only connection check. No project write was dispatched."
              : "Check that AE_MCP_EXE points at the After Effects .app bundle and that your MCP client is " +
                "allowed to control After Effects (System Settings → Privacy & Security → Automation)."
            : "Check that AE_MCP_EXE points at a real AfterFX.exe and that After Effects is not blocked by policy or antivirus.",
      },
    );
  }

  private toEvalResult(parsed: DispatcherResponse, durationMs: number): EvalResult {
    if (parsed.ok) {
      return {
        ok: true,
        result: parsed.result,
        error: null,
        errorCode: null,
        stack: null,
        logs: parsed.logs ?? [],
        durationMs,
        ...(parsed.rollback ? { rollback: parsed.rollback } : {}),
      };
    }
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
      ...(parsed.rollback ? { rollback: parsed.rollback } : {}),
    };
  }

  private async tryReadResponse(responsePath: string): Promise<ResponseRead> {
    let raw: string;
    try {
      raw = await fs.readFile(responsePath, "utf8");
    } catch {
      // Missing: normal, still waiting.
      return { kind: "pending" };
    }
    return readResponseText(raw);
  }

  /** Unlink and report whether the file was actually there. */
  private async safeUnlink(p: string): Promise<boolean> {
    try {
      await fs.unlink(p);
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
  private async sweepStaleFiles(): Promise<void> {
    try {
      const entries = await fs.readdir(RUNTIME_DIR);
      const cutoff = Date.now() - STALE_RUNTIME_FILE_MS;
      for (const entry of entries) {
        const isMail =
          (entry.startsWith(REQUEST_PREFIX) || entry.startsWith(RESPONSE_PREFIX)) &&
          entry.endsWith(".json");
        if (!isMail) continue;
        const full = path.join(RUNTIME_DIR, entry);
        try {
          const stat = await fs.stat(full);
          if (stat.mtimeMs < cutoff) await fs.unlink(full);
        } catch {
          /* raced with another client; leave it alone */
        }
      }
      // Temp files are written and renamed into place within milliseconds;
      // one this old is the remains of a write that never finished — for
      // example the zero-byte `.response-<id>.json.tmp` an earlier request
      // from another server process left on 2026-11-10. In the shared
      // mailbox and in every instance's own.
      await sweepOrphanTmpFiles(RUNTIME_DIR);
      try {
        for (const entry of await fs.readdir(INSTANCES_DIR)) {
          await sweepOrphanTmpFiles(path.join(INSTANCES_DIR, entry));
        }
      } catch {
        /* no instances directory */
      }
      // An expired busy lock from a crashed run would otherwise make the first
      // call of this session wait out the stale threshold. A live owner
      // refreshes its lock every BUSY_LOCK_REFRESH_MS, so a lock this old has
      // no owner left; a fresh one is never touched.
      try {
        const lockStat = await fs.stat(BUSY_LOCK_PATH);
        if (Date.now() - lockStat.mtimeMs > BUSY_LOCK_STALE_MS) await fs.unlink(BUSY_LOCK_PATH);
      } catch {
        /* no lock, or raced with its owner */
      }
      await sweepDeadInstanceDirs();
    } catch {
      /* directory missing or unreadable — setupError already covers it */
    }
  }
}

function failure(
  errorCode: AeErrorCode,
  message: string,
  extra: { stack?: string | null; durationMs?: number; hint?: string; dialogs?: AeDialog[] } = {},
): EvalResult {
  return {
    ok: false,
    result: null,
    error: extra.hint ? `${message}\n${extra.hint}` : message,
    errorCode,
    stack: extra.stack ?? null,
    logs: [],
    durationMs: extra.durationMs ?? 0,
    ...(extra.dialogs ? { dialogs: extra.dialogs } : {}),
  };
}

/** DIALOG_OPEN: what the dialogs say first, then what became of the call. */
/**
 * How long an unparseable response may sit unchanged before it is final.
 *
 * serve.jsx writes a tmp file and renames it into place, so a response that
 * does not parse is at worst a torn read of that rename — gone by the next
 * poll. One that is still there, the same size, after this long was written
 * that way and will never get better.
 */
export const UNREADABLE_RESPONSE_GRACE_MS = 2_000;

/** What one look at a response file found. */
export type ResponseRead =
  | { kind: "pending" }
  | { kind: "ready"; response: DispatcherResponse }
  | { kind: "unreadable"; bytes: number; tail: string };

/** Classify the text of a response file. Empty means not written yet. */
export function readResponseText(raw: string): ResponseRead {
  if (!raw) return { kind: "pending" };
  try {
    return { kind: "ready", response: JSON.parse(raw) as DispatcherResponse };
  } catch {
    return { kind: "unreadable", bytes: Buffer.byteLength(raw, "utf8"), tail: raw.slice(-80) };
  }
}

/**
 * Decides when an unreadable response stops being "maybe still arriving".
 * Feed it every look at the file; it answers true once the same unreadable
 * content has sat for UNREADABLE_RESPONSE_GRACE_MS.
 */
export class UnreadableResponseWatch {
  private since: number | null = null;
  private bytes = -1;

  settled(read: ResponseRead, now: number): boolean {
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
}

/**
 * The failure for a response that arrived but cannot be parsed. Before this
 * existed the caller waited out its whole timeout on such a file.
 */
export function unreadableResponseFailure(
  read: Extract<ResponseRead, { kind: "unreadable" }>,
  started: number,
): EvalResult {
  return failure(
    "DISPATCHER",
    `After Effects wrote a response that is not valid JSON (${read.bytes} bytes, ending in ${JSON.stringify(read.tail)}); ` +
      "the script already ran",
    {
      durationMs: Date.now() - started,
      hint:
        "The response was cut off while it was being written, usually by a value its writer could not encode. " +
        "Whatever the call does to the project has already happened: inspect the actual project state before retrying a write.",
    },
  );
}

function dialogFailure(dialogs: AeDialog[], outcome: string, started: number): EvalResult {
  return failure("DIALOG_OPEN", `${dialogBlockMessage(dialogs)} — ${outcome}`, {
    durationMs: Date.now() - started,
    hint: dialogHint(dialogs),
    dialogs,
  });
}

/** AppleScript's -1743 is an explicit macOS Automation denial, not a generic launch failure. */
export function isAutomationDenial(message: string): boolean {
  return /(?:-1743\b|not (?:authorized|permitted) to send apple events)/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serialize a request for the mailbox.
 *
 * U+2028/U+2029 are legal raw inside JSON strings, so `JSON.stringify` emits
 * them as-is — but they are LINE TERMINATORS to the ES3 parser that reads this
 * file on the other side. One of them anywhere in the request (a layer name
 * inside an imported project document, say) would otherwise cut a string
 * literal in half mid-parse. `jsxVal` has always escaped them on the codegen
 * path; the transport path needs the same treatment, because `payload` carries
 * caller-supplied content that never passes through `jsxVal`.
 */
export function serializeRequest(request: unknown): string {
  return JSON.stringify(request)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
