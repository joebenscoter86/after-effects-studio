import type { Readable } from "node:stream";
import type { AeTransport, EvalRequest, EvalResult } from "./AeTransport.js";
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
    /** Modal-dialog scan; defaults to scanAeDialogs (Windows and macOS). Injectable for tests. */
    scanDialogs?: () => Promise<AeDialog[]>;
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
    private readonly scanDialogs;
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