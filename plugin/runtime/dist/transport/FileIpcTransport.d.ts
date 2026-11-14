import type { Readable } from "node:stream";
import type { AeTransport, EvalRequest, EvalResult, RollbackReport } from "./AeTransport.js";
import { type AeDialog } from "./dialogs.js";
import { type TargetResolution } from "./instances.js";
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
export type SpawnFn = (command: string, args: string[], options: LaunchSpawnOptions) => LaunchedProcess;
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
export declare const ORPHAN_TMP_SWEEP_MS: number;
/**
 * Delete `.request-*.json.tmp` and `.response-*.json.tmp` in `dir` older than
 * ORPHAN_TMP_SWEEP_MS. Best-effort; never throws.
 */
export declare function sweepOrphanTmpFiles(dir: string, now?: number): Promise<string[]>;
/** Default for FileIpcTransportOptions.reapIntervalMs. */
export declare const REAP_INTERVAL_MS = 1000;
/** Default for FileIpcTransportOptions.emptyTmpGraceMs. */
export declare const EMPTY_TMP_GRACE_MS = 10000;
/**
 * A response nobody has collected for this long has no live owner polling for
 * it (owners poll every POLL_INTERVAL_MS), so the script that wrote it is done.
 */
export declare const UNCLAIMED_RESPONSE_GRACE_MS = 2000;
/** How long the leftovers of a timed-out request are watched for. */
export declare const ORPHAN_WATCH_MS: number;
/**
 * Said with every timeout after pickup. Live, 2026-11-10: an undo raised an
 * After Effects error box mid-script; the call timed out "picked up", and
 * instance.dialogs returned no dialogs while the box was up.
 */
export declare const PICKED_UP_TIMEOUT_NOTE: string;
/**
 * What a call says when its deadline passes with a launch still waiting in
 * After Effects (macOS: its osascript alive, the request never consumed):
 * when that launch was sent, by whom, and that nothing new was launched.
 * Live, 2026-11-14: a second DoScript sent 3 s after the first, while the
 * first still waited, raised After Effects' "second script" warning.
 */
export declare function waitingLaunchSentence(since: Date, by: "this call" | "an earlier call", now?: Date): string;
export declare const WAITING_LAUNCH_HINT: string;
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
export declare class FileIpcTransport implements AeTransport {
    private afterFxPath;
    private inflight;
    /** Non-null when the mailbox directory is unusable; reported per call. */
    private readonly setupError;
    private readonly instanceOption;
    private readonly spawnFn;
    private readonly dispatcherJsx;
    private readonly scanDialogs;
    private readonly reapIntervalMs;
    private readonly emptyTmpGraceMs;
    private readonly platform;
    private readonly launchLockDir;
    private launchLockWarned;
    private readonly orphans;
    private reapTimer;
    constructor(options?: FileIpcTransportOptions);
    /** Where the next call would go. For ae_context and the startup banner; never throws. */
    describeTarget(instance?: string): Promise<TargetResolution>;
    /**
     * A per-call `instance` wins over the constructor option, which wins over
     * AE_MCP_INSTANCE; `instance: null` at construction forces push unless a
     * call names an instance explicitly.
     */
    private resolveTarget;
    execute(req: EvalRequest): Promise<EvalResult>;
    /** Stop watching for the leftovers of timed-out requests. */
    close(): Promise<void>;
    private executeOne;
    private executePull;
    private executePush;
    /**
     * Write a request atomically (tmp + rename). The tmp name is dotted so it
     * can never match the JSX side's `request-*.json` glob mid-write.
     */
    private writeRequest;
    /**
     * Spawn the dispatcher launch command. Errors land in `state.error` rather
     * than throwing: a spawn failure (ENOENT, EACCES, EFTYPE, …) can never
     * produce a response, so the poll loop checks the state every tick instead
     * of waiting out the full timeout. When the plan says the exit code is
     * meaningful (osascript), a non-zero exit is treated the same way — that is
     * how a denied macOS Automation permission (-1743) surfaces in seconds.
     */
    private launchDispatcher;
    /** The launch lock for this After Effects, or null where launches take none (Windows, or switched off). */
    private launchLockFor;
    /**
     * Launch the dispatcher holding the launch lock, or report the live launch
     * that holds it and launch nothing. The lock goes back when the launcher
     * exits or fails to start, or when the caller calls `release` (the request
     * was consumed). A lock folder that cannot be used costs the lock, not the
     * launch: the call goes ahead as it did before the lock existed.
     */
    private launchUnderLock;
    /**
     * The launcher child outlived a forwarder with our request untouched: it is
     * AfterFX.exe becoming an instance, not delivering to one. Stop it before
     * it can run the request on an empty project, take the request back, and
     * explain — this is the one failure whose "success" would have been a lie.
     */
    private phantomFailure;
    /**
     * Acquire the cross-process busy lock, or give up at `deadline`.
     *
     * `open("wx")` is the atomic primitive: exactly one process can create the
     * file. A lock whose mtime is older than BUSY_LOCK_STALE_MS lost its owner
     * (crashed server, killed AE) and is broken by any waiter; the retry then
     * races other waiters on the "wx", which stays safe — one wins, the rest
     * keep waiting.
     */
    private acquireBusyLock;
    /**
     * What After Effects is showing: real dialogs, and its own script progress
     * window (a script still running), kept apart so the progress window is
     * never reported as a dialog or offered for dismissal.
     */
    private lookAtAe;
    /** Id recorded in the busy lock, or null when there is none or it is unreadable. */
    private lockHolder;
    /**
     * Has request `id` (served from `dir`) visibly finished? True when its
     * response is there (and, for a request that is not ours, has sat unclaimed
     * for UNCLAIMED_RESPONSE_GRACE_MS), or when all that is left is an empty
     * tmp response untouched for emptyTmpGraceMs — which is then removed.
     */
    private requestFinished;
    /** Watch the leftovers of a request that timed out after After Effects picked it up. */
    private watchOrphan;
    /**
     * For every watched request that has finished: remove its late response and
     * tmp file (nobody is waiting for them any more) and release the busy lock
     * if it is still the one that request held. Never throws.
     */
    private reapOrphans;
    /**
     * True while the lock on disk is the one this call created. A call whose
     * event loop stalls past BUSY_LOCK_STALE_MS (a laptop suspend is enough —
     * the staleness test is wall-clock) has its lock broken and retaken by a
     * waiter, so neither refreshing nor releasing may touch the file blindly:
     * refreshing would keep someone else's lock alive forever, and releasing
     * would hand a third caller a dispatch slot while the second is still
     * driving AE — the exact collision the lock exists to prevent.
     */
    private ownsBusyLock;
    /** Touch the lock so waiters keep seeing a live owner. Best-effort. */
    private refreshBusyLock;
    /** Drop the lock, but only while it is still ours. */
    private releaseBusyLock;
    private fileExists;
    /** AE never started, so nothing will consume the request — take it back. */
    private spawnFailure;
    private toEvalResult;
    private tryReadResponse;
    /** Unlink and report whether the file was actually there. */
    private safeUnlink;
    /**
     * Drop request/response files old enough that no caller can still be waiting
     * on them — leftovers from a crashed server or a killed AE — and instance
     * directories whose agent has been silent for as long. Best-effort and never
     * fatal; a shared mailbox means another live client may own files we are
     * looking at, so only clearly-expired ones are touched.
     */
    private sweepStaleFiles;
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
export declare const UNREADABLE_RESPONSE_GRACE_MS = 2000;
/** What one look at a response file found. */
export type ResponseRead = {
    kind: "pending";
} | {
    kind: "ready";
    response: DispatcherResponse;
} | {
    kind: "unreadable";
    bytes: number;
    tail: string;
};
/** Classify the text of a response file. Empty means not written yet. */
export declare function readResponseText(raw: string): ResponseRead;
/**
 * Decides when an unreadable response stops being "maybe still arriving".
 * Feed it every look at the file; it answers true once the same unreadable
 * content has sat for UNREADABLE_RESPONSE_GRACE_MS.
 */
export declare class UnreadableResponseWatch {
    private since;
    private bytes;
    settled(read: ResponseRead, now: number): boolean;
}
/**
 * The failure for a response that arrived but cannot be parsed. Before this
 * existed the caller waited out its whole timeout on such a file.
 */
export declare function unreadableResponseFailure(read: Extract<ResponseRead, {
    kind: "unreadable";
}>, started: number): EvalResult;
/** AppleScript's -1743 is an explicit macOS Automation denial, not a generic launch failure. */
export declare function isAutomationDenial(message: string): boolean;
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
export declare function serializeRequest(request: unknown): string;
//# sourceMappingURL=FileIpcTransport.d.ts.map