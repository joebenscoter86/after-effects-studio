import { spawn as nodeSpawn } from "node:child_process";
import { mkdirSync, promises as fs, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import {
  BUSY_LOCK_PATH,
  BUSY_LOCK_REFRESH_MS,
  BUSY_LOCK_STALE_MS,
  DEFAULT_TIMEOUT_MS,
  INSTANCES_DIR,
  LIVENESS_CHECK_MS,
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
  runtimeDirWarnings
} from "../config.js";
import {
  SCRIPT_RUNNING_HINT,
  dialogBlockMessage,
  dialogHint,
  scanAeWindows,
  scriptRunningMessage,
  splitScriptProgress
} from "./dialogs.js";
import {
  describeInstance,
  listInstances,
  readInstance,
  resolveTarget,
  sweepDeadInstanceDirs
} from "./instances.js";
import { buildLaunchPlan } from "./launcher.js";
const ORPHAN_TMP_SWEEP_MS = 5 * 6e4;
async function sweepOrphanTmpFiles(dir, now = Date.now()) {
  const removed = [];
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return removed;
  }
  for (const entry of entries) {
    const isTmp = (entry.startsWith(`.${REQUEST_PREFIX}`) || entry.startsWith(`.${RESPONSE_PREFIX}`)) && entry.endsWith(".json.tmp");
    if (!isTmp) continue;
    const full = path.join(dir, entry);
    try {
      const stat = await fs.stat(full);
      if (stat.isFile() && now - stat.mtimeMs > ORPHAN_TMP_SWEEP_MS) {
        await fs.unlink(full);
        removed.push(entry);
      }
    } catch {
    }
  }
  return removed;
}
const REAP_INTERVAL_MS = 1e3;
const EMPTY_TMP_GRACE_MS = 1e4;
const UNCLAIMED_RESPONSE_GRACE_MS = 2e3;
const ORPHAN_WATCH_MS = 30 * 6e4;
const PICKED_UP_TIMEOUT_NOTE = "The most likely cause is a modal dialog in After Effects \u2014 an error box raised by the script (an undo raised one on 2026-11-10) or a warning \u2014 which blocks all scripting until a person clicks it; instance.dialogs may not list it, so look at the After Effects window. Once it is dismissed the script finishes and the plugin cleans up after it (busy lock, temp response).";
class FileIpcTransport {
  afterFxPath = null;
  inflight = Promise.resolve();
  /** Non-null when the mailbox directory is unusable; reported per call. */
  setupError = null;
  instanceOption;
  spawnFn;
  scanDialogs;
  reapIntervalMs;
  emptyTmpGraceMs;
  orphans = /* @__PURE__ */ new Map();
  reapTimer = null;
  constructor(options = {}) {
    this.instanceOption = options.instance;
    this.reapIntervalMs = options.reapIntervalMs ?? REAP_INTERVAL_MS;
    this.emptyTmpGraceMs = options.emptyTmpGraceMs ?? EMPTY_TMP_GRACE_MS;
    this.spawnFn = options.spawn ?? ((command, args, opts) => nodeSpawn(command, args, opts));
    this.scanDialogs = options.scanDialogs ?? (() => scanAeWindows());
    try {
      mkdirSync(RUNTIME_DIR, { recursive: true, mode: RUNTIME_DIR_MODE });
      if (RUNTIME_DIR_IS_CUSTOM) {
        mkdirSync(RUNTIME_ROOT, { recursive: true, mode: RUNTIME_DIR_MODE });
        writeFileSync(RUNTIME_POINTER_PATH, RUNTIME_DIR, "utf8");
      } else {
        try {
          unlinkSync(RUNTIME_POINTER_PATH);
        } catch {
        }
      }
      for (const warning of runtimeDirWarnings()) {
        process.stderr.write(`mcp-aftereffects: WARNING \u2014 ${warning}
`);
      }
    } catch (err) {
      this.setupError = `cannot use runtime directory ${RUNTIME_DIR}: ${err instanceof Error ? err.message : String(err)}`;
    }
    void this.sweepStaleFiles();
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
      return failure(
        "TRANSPORT",
        `mcp-aftereffects transport error: ${err instanceof Error ? err.message : String(err)}`,
        { stack: err instanceof Error && err.stack ? err.stack : null }
      );
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
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (this.setupError !== null) {
      return failure("TRANSPORT", this.setupError, {
        durationMs: Date.now() - started
      });
    }
    const target = await this.resolveTarget(req.instance);
    if (target.mode === "error") {
      const { dialogs, scripts } = await this.lookAtAe();
      if (dialogs.length > 0) return dialogFailure(dialogs, target.message, started);
      if (scripts.length > 0) {
        return failure("NO_INSTANCE", `${target.message} \u2014 ${scriptRunningMessage(scripts)}`, {
          durationMs: Date.now() - started,
          hint: SCRIPT_RUNNING_HINT
        });
      }
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
      // Sent explicitly rather than by omission: the JSX side defaults a
      // missing field to true, and "group this" must not depend on a key
      // surviving the trip.
      undoGroup: req.undoGroup !== false,
      suppressDialogs: req.suppressDialogs !== false,
      // Explicit as well: a missing field means "no rollback" to serve.jsx,
      // and rollback only ever applies inside an undo group.
      rollback: req.undoGroup !== false && req.rollback === true
    };
    if (target.mode === "pull") {
      return this.executePull(request, target.instance, started, timeoutMs);
    }
    return this.executePush(request, started, timeoutMs);
  }
  // --- Pull: the instance's agent serves its own mailbox ---------------------
  async executePull(request, instance, started, timeoutMs) {
    const dir = instance.dir;
    const requestPath = path.join(dir, `${REQUEST_PREFIX}${request.id}.json`);
    const responsePath = path.join(dir, `${RESPONSE_PREFIX}${request.id}.json`);
    await fs.mkdir(dir, { recursive: true });
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
      if (!requestConsumed && now - lastLivenessAt >= LIVENESS_CHECK_MS) {
        lastLivenessAt = now;
        if (!await this.fileExists(requestPath)) {
          requestConsumed = true;
        } else {
          const current = await readInstance(dir, now);
          if (!current.alive) {
            const reclaimed2 = await this.safeUnlink(requestPath);
            if (!reclaimed2) this.watchOrphan(request.id, dir);
            const outcome = reclaimed2 ? "the request was never picked up and has been discarded" : "the request disappeared before it could be reclaimed; the operation may have started";
            const { dialogs, scripts } = await this.lookAtAe();
            if (dialogs.length > 0) {
              return dialogFailure(
                dialogs,
                `After Effects instance '${instance.id}' stopped responding; ${outcome}`,
                started
              );
            }
            if (scripts.length > 0) {
              return failure(
                reclaimed2 ? "NO_INSTANCE" : "TIMEOUT",
                `After Effects instance '${instance.id}' stopped responding: ${scriptRunningMessage(scripts)}; ${outcome}`,
                { durationMs: Date.now() - started, hint: SCRIPT_RUNNING_HINT }
              );
            }
            return failure(
              reclaimed2 ? "NO_INSTANCE" : "TIMEOUT",
              `After Effects instance '${instance.id}' stopped responding (${describeInstance(current)}); ` + outcome,
              {
                durationMs: Date.now() - started,
                hint: reclaimed2 ? "Is that After Effects still running, and free of modal dialogs? Scripts do not run while one is open. If it was restarted, the agent re-registers about ten seconds after launch \u2014 retry then." : "Inspect the actual AE project and owned item IDs before retrying. A write may already have completed."
              }
            );
          }
        }
      }
      await sleep(POLL_INTERVAL_MS);
    }
    const reclaimed = await this.safeUnlink(requestPath);
    if (!reclaimed) this.watchOrphan(request.id, dir);
    const pullTimeoutBase = `timeout after ${timeoutMs}ms waiting for After Effects instance '${instance.id}' to respond` + (reclaimed ? " (the request was never picked up and has been discarded)" : " (the request WAS picked up by the instance; the operation may still be running)");
    const pull = await this.lookAtAe();
    if (pull.dialogs.length > 0) return dialogFailure(pull.dialogs, pullTimeoutBase, started);
    if (pull.scripts.length > 0) {
      return failure("TIMEOUT", `${pullTimeoutBase}. ${scriptRunningMessage(pull.scripts)}.`, {
        durationMs: Date.now() - started,
        hint: SCRIPT_RUNNING_HINT
      });
    }
    const pullTimeoutMessage = reclaimed ? pullTimeoutBase : `${pullTimeoutBase}. ${PICKED_UP_TIMEOUT_NOTE}`;
    return failure("TIMEOUT", pullTimeoutMessage, {
      durationMs: Date.now() - started,
      hint: "Is After Effects showing a modal dialog, or rendering/previewing? Scripts wait for both. For a long operation, raise timeoutMs. Inspect the project before repeating a write."
    });
  }
  // --- Push: launch the dispatcher into the registered instance ---------------
  async executePush(request, started, timeoutMs) {
    try {
      this.afterFxPath ??= resolveAfterFxPath();
    } catch (err) {
      return failure("AE_NOT_FOUND", err instanceof Error ? err.message : String(err), {
        durationMs: Date.now() - started
      });
    }
    if ((await listInstances()).some((i) => !i.alive)) {
      const { dialogs, scripts } = await this.lookAtAe();
      if (dialogs.length > 0) {
        return dialogFailure(dialogs, "nothing was sent to After Effects", started);
      }
      if (scripts.length > 0) {
        return failure("TIMEOUT", `${scriptRunningMessage(scripts)}; nothing was sent to After Effects`, {
          durationMs: Date.now() - started,
          hint: SCRIPT_RUNNING_HINT
        });
      }
    }
    const id = request.id;
    const requestPath = requestPathFor(id);
    const responsePath = responsePathFor(id);
    await this.writeRequest(RUNTIME_DIR, requestPath, request);
    const deadline = started + timeoutMs;
    if (!await this.acquireBusyLock(deadline, id)) {
      await this.safeUnlink(requestPath);
      return failure(
        "TIMEOUT",
        `timeout after ${timeoutMs}ms waiting for After Effects to become available \u2014 another call (possibly from another MCP server process) holds the dispatcher busy lock`,
        {
          durationMs: Date.now() - started,
          hint: `The lock (${BUSY_LOCK_PATH}) is refreshed while its owner is alive and expires ${Math.round(BUSY_LOCK_STALE_MS / 1e3)}s after the owner stops. If this persists, check AE for a stuck script or a modal dialog, and avoid running two MCP servers against one AE.`
        }
      );
    }
    let leaveLockForRunningScript = false;
    try {
      const spawnState = { error: null, child: null, exited: false };
      const launch = this.launchDispatcher(spawnState);
      if (spawnState.error !== null) {
        return await this.spawnFailure(spawnState.error, requestPath, started);
      }
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
        if (spawnState.error !== null) {
          return await this.spawnFailure(spawnState.error, requestPath, started);
        }
        const now = Date.now();
        if (now - lastRefreshAt >= BUSY_LOCK_REFRESH_MS) {
          lastRefreshAt = now;
          await this.refreshBusyLock(id);
        }
        if (!requestConsumed && now - lastLaunchAt >= RELAUNCH_UNCONSUMED_AFTER_MS) {
          if (!await this.fileExists(requestPath)) {
            requestConsumed = true;
          } else if (launch.detectPhantom && spawnState.child !== null && !spawnState.exited) {
            if (now - lastLaunchAt >= PHANTOM_LAUNCH_MS) {
              return await this.phantomFailure(spawnState, requestPath, started);
            }
          } else if (attempts < MAX_LAUNCH_ATTEMPTS && now - lastLaunchAt >= RELAUNCH_UNCONSUMED_AFTER_MS * attempts) {
            const { dialogs, scripts } = await this.lookAtAe();
            if (dialogs.length === 0 && scripts.length > 0) {
              lastLaunchAt = Date.now();
              await sleep(POLL_INTERVAL_MS);
              continue;
            }
            if (dialogs.length > 0) {
              const reclaimed2 = await this.safeUnlink(requestPath);
              leaveLockForRunningScript = !reclaimed2;
              if (!reclaimed2) this.watchOrphan(id, RUNTIME_DIR);
              return dialogFailure(
                dialogs,
                reclaimed2 ? `the request was never picked up after ${attempts} launch attempt${attempts === 1 ? "" : "s"} and has been discarded` : "the request disappeared before it could be reclaimed; the operation may have started",
                started
              );
            }
            attempts++;
            lastLaunchAt = Date.now();
            this.launchDispatcher(spawnState);
          }
        }
        await sleep(POLL_INTERVAL_MS);
      }
      const reclaimed = await this.safeUnlink(requestPath);
      leaveLockForRunningScript = !reclaimed;
      if (!reclaimed) this.watchOrphan(id, RUNTIME_DIR);
      const { dialogs: pushDialogs, scripts: pushScripts } = await this.lookAtAe();
      if (pushDialogs.length === 0 && pushScripts.length > 0) {
        return failure(
          "TIMEOUT",
          `timeout after ${timeoutMs}ms waiting for After Effects to respond` + (reclaimed ? " (the request was never picked up and has been discarded)" : " (the request WAS picked up by AE; the operation may still be running)") + `. ${scriptRunningMessage(pushScripts)}.`,
          { durationMs: Date.now() - started, hint: SCRIPT_RUNNING_HINT }
        );
      }
      if (pushDialogs.length > 0) {
        return dialogFailure(
          pushDialogs,
          reclaimed ? `timeout after ${timeoutMs}ms; the request was never picked up and has been discarded` : `timeout after ${timeoutMs}ms; the request WAS picked up by AE and may be waiting on the dialog`,
          started
        );
      }
      return failure(
        "TIMEOUT",
        `timeout after ${timeoutMs}ms waiting for After Effects to respond` + (reclaimed ? ` (the request was never picked up by AE after ${attempts} launch attempt${attempts === 1 ? "" : "s"} and has been discarded)` : ` (the request WAS picked up by AE; the operation may still be running). ${PICKED_UP_TIMEOUT_NOTE}`),
        {
          durationMs: Date.now() - started,
          hint: "Is AE running with a project open? Is 'Allow Scripts to Write Files and Access Network' enabled? Is AE showing a modal dialog (e.g. 'Attempt was made to run a second script')? Dismiss it \u2014 scripting is blocked while it is open. " + (process.platform === "darwin" ? "Is your MCP client allowed to control After Effects (System Settings \u2192 Privacy & Security \u2192 Automation)? " : "") + "Do not repeat a write until you inspect the actual project state. Preserve unsaved work; do not force-quit AE as routine recovery."
        }
      );
    } finally {
      if (!leaveLockForRunningScript) await this.releaseBusyLock(id);
    }
  }
  /**
   * Write a request atomically (tmp + rename). The tmp name is dotted so it
   * can never match the JSX side's `request-*.json` glob mid-write.
   */
  async writeRequest(dir, requestPath, request) {
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
  launchDispatcher(state) {
    const launch = buildLaunchPlan(this.afterFxPath);
    state.child = null;
    state.exited = false;
    try {
      const child = this.spawnFn(launch.command, launch.args, {
        stdio: launch.diagnoseExit ? ["ignore", "ignore", "pipe"] : "ignore",
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
          state.error = new Error(
            `${launch.command} exited with code ${code}${detail ? `: ${detail}` : ""}`
          );
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
    } catch {
    }
    const reclaimed = await this.safeUnlink(requestPath);
    if (!reclaimed) {
      return failure(
        "TIMEOUT",
        "the launcher was stopped, but the request disappeared before it could be reclaimed; the operation may have started in After Effects",
        {
          durationMs: Date.now() - started,
          hint: "Inspect the actual AE project and owned item IDs before retrying. A write may already have completed."
        }
      );
    }
    return failure(
      "NO_INSTANCE",
      "no running After Effects instance received the script: the launched AfterFX.exe started booting an instance of its own. That happens when no After Effects is running, or when every running one was started with `AfterFX.exe -m` \u2014 those never receive `-r` scripts. The booting instance was terminated and the request discarded; nothing was executed.",
      {
        durationMs: Date.now() - started,
        hint: "Either drive one After Effects started WITHOUT -m, or set up multi-instance use: `npx @kumoproductions/mcp-aftereffects install-agent`, restart After Effects, and set AE_MCP_INSTANCE to the instance to address (see README, 'Multiple After Effects instances')."
      }
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
  async acquireBusyLock(deadline, id) {
    for (; ; ) {
      try {
        const handle = await fs.open(BUSY_LOCK_PATH, "wx");
        try {
          await handle.writeFile(
            JSON.stringify({ pid: process.pid, id, startedAt: (/* @__PURE__ */ new Date()).toISOString() }),
            "utf8"
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
            const holder = await this.lockHolder();
            if (holder !== null && holder !== id && await this.requestFinished(holder, RUNTIME_DIR, true)) {
              await this.safeUnlink(BUSY_LOCK_PATH);
            }
          }
        } catch {
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
  async lookAtAe() {
    return splitScriptProgress(await this.scanDialogs());
  }
  /** Id recorded in the busy lock, or null when there is none or it is unreadable. */
  async lockHolder() {
    try {
      const raw = await fs.readFile(BUSY_LOCK_PATH, "utf8");
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
    const responsePath = path.join(dir, `${RESPONSE_PREFIX}${id}.json`);
    try {
      const stat = await fs.stat(responsePath);
      if (!foreign || Date.now() - stat.mtimeMs >= UNCLAIMED_RESPONSE_GRACE_MS) return true;
    } catch {
    }
    const tmpPath = path.join(dir, `.${RESPONSE_PREFIX}${id}.json.tmp`);
    try {
      const stat = await fs.stat(tmpPath);
      if (stat.size === 0 && Date.now() - stat.mtimeMs >= this.emptyTmpGraceMs) {
        await this.safeUnlink(tmpPath);
        return true;
      }
    } catch {
    }
    return false;
  }
  /** Watch the leftovers of a request that timed out after After Effects picked it up. */
  watchOrphan(id, dir) {
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
  async reapOrphans() {
    for (const orphan of Array.from(this.orphans.values())) {
      try {
        if (await this.requestFinished(orphan.id, orphan.dir, false)) {
          await this.safeUnlink(path.join(orphan.dir, `${RESPONSE_PREFIX}${orphan.id}.json`));
          await this.safeUnlink(path.join(orphan.dir, `.${RESPONSE_PREFIX}${orphan.id}.json.tmp`));
          await this.releaseBusyLock(orphan.id);
          this.orphans.delete(orphan.id);
        } else if (Date.now() > orphan.watchUntil) {
          this.orphans.delete(orphan.id);
        }
      } catch {
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
  async ownsBusyLock(id) {
    try {
      const raw = await fs.readFile(BUSY_LOCK_PATH, "utf8");
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
      await fs.utimes(BUSY_LOCK_PATH, now, now);
    } catch {
    }
  }
  /** Drop the lock, but only while it is still ours. */
  async releaseBusyLock(id) {
    if (!await this.ownsBusyLock(id)) return;
    await this.safeUnlink(BUSY_LOCK_PATH);
  }
  async fileExists(p) {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
  /** AE never started, so nothing will consume the request — take it back. */
  async spawnFailure(err, requestPath, started) {
    await this.safeUnlink(requestPath);
    const automationDenied = isAutomationDenial(err.message);
    return failure(
      automationDenied ? "AUTOMATION_DENIED" : "TRANSPORT",
      `could not launch After Effects (${this.afterFxPath}): ${err.message}`,
      {
        stack: err.stack ?? null,
        durationMs: Date.now() - started,
        hint: process.platform === "darwin" ? automationDenied ? "Allow the agent host to control After Effects in System Settings \u2192 Privacy & Security \u2192 Automation, then retry a read-only connection check. No project write was dispatched." : "Check that AE_MCP_EXE points at the After Effects .app bundle and that your MCP client is allowed to control After Effects (System Settings \u2192 Privacy & Security \u2192 Automation)." : "Check that AE_MCP_EXE points at a real AfterFX.exe and that After Effects is not blocked by policy or antivirus."
      }
    );
  }
  toEvalResult(parsed, durationMs) {
    if (parsed.ok) {
      return {
        ok: true,
        result: parsed.result,
        error: null,
        errorCode: null,
        stack: null,
        logs: parsed.logs ?? [],
        durationMs,
        ...parsed.rollback ? { rollback: parsed.rollback } : {}
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
      ...parsed.rollback ? { rollback: parsed.rollback } : {}
    };
  }
  async tryReadResponse(responsePath) {
    let raw;
    try {
      raw = await fs.readFile(responsePath, "utf8");
    } catch {
      return { kind: "pending" };
    }
    return readResponseText(raw);
  }
  /** Unlink and report whether the file was actually there. */
  async safeUnlink(p) {
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
  async sweepStaleFiles() {
    try {
      const entries = await fs.readdir(RUNTIME_DIR);
      const cutoff = Date.now() - STALE_RUNTIME_FILE_MS;
      for (const entry of entries) {
        const isMail = (entry.startsWith(REQUEST_PREFIX) || entry.startsWith(RESPONSE_PREFIX)) && entry.endsWith(".json");
        if (!isMail) continue;
        const full = path.join(RUNTIME_DIR, entry);
        try {
          const stat = await fs.stat(full);
          if (stat.mtimeMs < cutoff) await fs.unlink(full);
        } catch {
        }
      }
      await sweepOrphanTmpFiles(RUNTIME_DIR);
      try {
        for (const entry of await fs.readdir(INSTANCES_DIR)) {
          await sweepOrphanTmpFiles(path.join(INSTANCES_DIR, entry));
        }
      } catch {
      }
      try {
        const lockStat = await fs.stat(BUSY_LOCK_PATH);
        if (Date.now() - lockStat.mtimeMs > BUSY_LOCK_STALE_MS) await fs.unlink(BUSY_LOCK_PATH);
      } catch {
      }
      await sweepDeadInstanceDirs();
    } catch {
    }
  }
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
const UNREADABLE_RESPONSE_GRACE_MS = 2e3;
function readResponseText(raw) {
  if (!raw) return { kind: "pending" };
  try {
    return { kind: "ready", response: JSON.parse(raw) };
  } catch {
    return { kind: "unreadable", bytes: Buffer.byteLength(raw, "utf8"), tail: raw.slice(-80) };
  }
}
class UnreadableResponseWatch {
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
}
function unreadableResponseFailure(read, started) {
  return failure(
    "DISPATCHER",
    `After Effects wrote a response that is not valid JSON (${read.bytes} bytes, ending in ${JSON.stringify(read.tail)}); the script already ran`,
    {
      durationMs: Date.now() - started,
      hint: "The response was cut off while it was being written, usually by a value its writer could not encode. Whatever the call does to the project has already happened: inspect the actual project state before retrying a write."
    }
  );
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
export {
  EMPTY_TMP_GRACE_MS,
  FileIpcTransport,
  ORPHAN_TMP_SWEEP_MS,
  ORPHAN_WATCH_MS,
  PICKED_UP_TIMEOUT_NOTE,
  REAP_INTERVAL_MS,
  UNCLAIMED_RESPONSE_GRACE_MS,
  UNREADABLE_RESPONSE_GRACE_MS,
  UnreadableResponseWatch,
  isAutomationDenial,
  readResponseText,
  serializeRequest,
  sweepOrphanTmpFiles,
  unreadableResponseFailure
};
