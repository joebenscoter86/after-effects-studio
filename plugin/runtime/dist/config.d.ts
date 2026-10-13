export declare const PACKAGE_ROOT: string;
export declare const DISPATCHER_JSX: string;
export declare const RUNTIME_ROOT: string;
export declare const DEFAULT_RUNTIME_DIR: string;
export declare const RUNTIME_POINTER_PATH: string;
/**
 * Mode for the mailbox directory: owner only.
 *
 * The mailbox is the transport's trust boundary. `dispatcher.jsx` executes the
 * `code` string of any request it finds there, with no signature to check and
 * no access to the capability policy — so write access to this directory is
 * equivalent to arbitrary code execution inside After Effects. The OS temp dir
 * is already per-user on both supported platforms; this narrows our own
 * subdirectory the rest of the way on POSIX. Ignored on Windows, where the
 * per-user ACL on %TEMP% is what carries the property.
 */
export declare const RUNTIME_DIR_MODE = 448;
export declare const RUNTIME_DIR: string;
/** True when AE_MCP_RUNTIME_DIR moved the mailbox off the discoverable default. */
export declare const RUNTIME_DIR_IS_CUSTOM: boolean;
export declare const REQUEST_PREFIX = "request-";
export declare const RESPONSE_PREFIX = "response-";
export declare function requestPathFor(id: string): string;
export declare function responsePathFor(id: string): string;
/**
 * Age past which an orphaned request/response file is swept on startup. Long
 * enough that it can never race a legitimately slow call (the longest built-in
 * timeout is the 10-minute project import).
 */
export declare const STALE_RUNTIME_FILE_MS: number;
/**
 * Reject a caller-supplied output path that lands inside the mailbox.
 *
 * `ae_render_frame` and `ae_project_export_json` write wherever they are told,
 * and both survive read-only mode. Neither has any business writing into the
 * IPC directory: a file dropped there is at best mistaken for mail and swept,
 * at worst shaped into a request the dispatcher executes. This closes the one
 * write target that feeds back into the transport itself. Returns an error
 * message, or null when the path is fine.
 */
export declare function rejectedOutputPath(outPath: string): string | null;
/**
 * Complain when the mailbox is writable by anyone but its owner.
 *
 * A group- or world-writable mailbox lets any local account plant a request,
 * which `dispatcher.jsx` will execute inside After Effects. That can happen
 * when `AE_MCP_RUNTIME_DIR` points somewhere shared (`/tmp/…`), or when a
 * pre-existing directory carries loose permissions. Returns a warning string,
 * or null when the mode is fine or unknowable.
 */
export declare function unsafeRuntimeDirWarning(dir?: string): string | null;
/**
 * Same complaint for the directory holding the mailbox POINTER, which is part
 * of the same trust boundary.
 *
 * `dispatcher.jsx` reads `runtime-dir.txt` from RUNTIME_ROOT and puts the
 * directory it names FIRST among the places it will execute a request from. So
 * write access here is as good as write access to the mailbox: plant a pointer,
 * plant a request, and the dispatcher runs it — even though the real mailbox is
 * private and the server is not using a custom one. RUNTIME_ROOT is always the
 * fixed per-user path (`AE_MCP_RUNTIME_DIR` moves the mailbox, never the
 * pointer), so this only fires on a pre-existing directory with loose modes.
 */
export declare function unsafePointerDirWarning(dir?: string): string | null;
/**
 * Say plainly that a custom mailbox is unverified on Windows.
 *
 * There the safety of the mailbox rests on the ACL of the directory it sits in,
 * which Node cannot read — so the mode checks above return null and print
 * nothing, which would otherwise read as "checked, and fine". The default under
 * `%TEMP%` is per-user and genuinely safe; `AE_MCP_RUNTIME_DIR` is the case
 * nothing verifies, so it gets one line at startup.
 */
export declare function uncheckedMailboxAclWarning(platform?: NodeJS.Platform): string | null;
/** Every startup warning about the mailbox location, in report order. */
export declare function runtimeDirWarnings(): string[];
/**
 * Locate After Effects — AfterFX.exe on Windows, the .app bundle on macOS.
 * Honors AE_MCP_EXE (and the legacy AE_EXE name) first so the user can
 * override without editing source, then probes the default install paths for
 * AE 2026 → 2025 → 2024.
 */
export declare function resolveAfterFxPath(platform?: NodeJS.Platform): string;
/** Default per-call timeout (ms) for JSX execution before we give up polling. */
export declare const DEFAULT_TIMEOUT_MS = 60000;
/** Poll interval (ms) while waiting for our response file to appear. */
export declare const POLL_INTERVAL_MS = 80;
/** Lock file marking a dispatcher call in flight. Lives in the shared mailbox. */
export declare const BUSY_LOCK_PATH: string;
/**
 * Age past which a busy lock is considered orphaned. Its owner refreshes the
 * mtime every BUSY_LOCK_REFRESH_MS while alive, so this can be far shorter
 * than any legitimate call duration.
 */
export declare const BUSY_LOCK_STALE_MS = 90000;
/** How often the lock owner refreshes the lock's mtime while polling. */
export declare const BUSY_LOCK_REFRESH_MS = 15000;
/**
 * With the request still unconsumed this long after a launch, launch the
 * dispatcher again (linear backoff: xN for the Nth attempt).
 */
export declare const RELAUNCH_UNCONSUMED_AFTER_MS = 2500;
/** Total dispatcher launches per call, first attempt included. */
export declare const MAX_LAUNCH_ATTEMPTS = 3;
export declare const INSTANCES_DIRNAME = "instances";
export declare const INSTANCES_DIR: string;
export declare const HEARTBEAT_FILENAME = "heartbeat.json";
export declare function instanceDirFor(id: string): string;
/** The agent refreshes heartbeat.json every second; past this it is presumed gone. */
export declare const HEARTBEAT_STALE_MS = 5000;
/**
 * …unless the last heartbeat said `busy`. Scheduled ticks do not fire while a
 * script runs, so a long request (the 10-minute project import) legitimately
 * silences the heartbeat. Matches the longest built-in call timeout with room.
 */
export declare const HEARTBEAT_BUSY_STALE_MS: number;
/** An instance directory whose heartbeat is this old is swept at startup. */
export declare const INSTANCE_DIR_SWEEP_MS: number;
/** How often a pull call re-checks that its instance is alive while the request waits. */
export declare const LIVENESS_CHECK_MS = 1000;
export declare const AGENT_JSX: string;
/** Name of the bootstrap stub `install-agent` drops into Scripts/Startup. */
export declare const AGENT_STUB_FILENAME = "mcp-aftereffects-agent.jsx";
export declare const INSTANCE_ID_MAX_LENGTH = 64;
/**
 * Instance ids become directory names under the mailbox. Keep them to
 * [A-Za-z0-9._-] — jsx/agent.jsx applies the identical rule to what it reads
 * from AE_MCP_INSTANCE, so both sides derive the same directory from the same
 * value. Returns null when nothing usable is left.
 */
export declare function sanitizeInstanceId(raw: string | null | undefined): string | null;
/**
 * The instance this server addresses, as the user wrote it: an id, or the
 * name of the project file an instance has open. Read at call time (not at
 * import) so a test — or a client that restarts the server — sees the current
 * value. Unset means "auto": pull when exactly one agent is live, push when
 * none is.
 */
export declare function instanceTargetFromEnv(env?: NodeJS.ProcessEnv): string | null;
/**
 * A `-r` launch whose AfterFX.exe child is still alive this long after
 * spawning, with the request still unconsumed, is booting an instance of its
 * own instead of forwarding to a running one (a forwarding child exits within
 * a second). Left alone it would run the script on an empty project ~8s later
 * and quit — reporting success for work that touched nothing. Generous enough
 * for a cold-cache forwarder; the relaunch logic waits for it too.
 */
export declare const PHANTOM_LAUNCH_MS = 4000;
//# sourceMappingURL=config.d.ts.map