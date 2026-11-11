import type { AeErrorCode } from "../errors.js";
import type { AeDialog } from "./dialogs.js";
import type { TargetResolution } from "./instances.js";
export interface EvalRequest {
    /** JSX code to execute inside the dispatcher. Convention: `return <JSON-serializable value>;` */
    code: string;
    /**
     * Bulk data for the JSX, delivered as a parsed value in the `payload`
     * variable rather than inlined into `code`. Use this for anything large or
     * caller-supplied — a whole project document, a manifest, a vertex list.
     * Inlining megabytes of JSON into generated source stresses ExtendScript's
     * parser and makes every character an escaping hazard; `payload` never
     * passes through the ES3 tokenizer at all.
     */
    payload?: unknown;
    /** Undo group label shown in AE's Edit menu. */
    label?: string;
    /**
     * Wrap the call in an undo group (default true), so one Ctrl+Z reverts it.
     * Pass false only for code that drives the undo stack itself — Undo and Redo.
     * AE resolves those against the group that is still open, so grouped they
     * revert nothing the caller asked for and desynchronize the stack.
     */
    undoGroup?: boolean;
    /**
     * Suppress AE's modal alert dialogs for the duration of the call (default
     * true). Pass false only for code that drives the undo stack — Undo and
     * Redo — because beginSuppressDialogs opens an undo-transaction-like scope
     * those would resolve against. Decided separately from `undoGroup`: project
     * boundary calls (project.open / project.new) run ungrouped but KEEP
     * suppression — they are the calls most likely to pop a modal.
     */
    suppressDialogs?: boolean;
    /**
     * Roll the call back if its code throws (default false, the old contract).
     * Only honoured inside an undo group: serve.jsx adds a marker inside the
     * still-open group, closes it, undoes once with dialogs suppressed and
     * reports the outcome in EvalResult.rollback. ae_do sets it per operation
     * (Operation.rollback).
     */
    rollback?: boolean;
    /**
     * Lift the session-level render-queue block on rollback (default false).
     * serve.jsx refuses to undo after a scripted render-queue change in the
     * session; this is the caller saying it accepts that risk. A request that
     * itself changed the render queue is never undone, override or not.
     */
    acceptRenderQueueRisk?: boolean;
    /** Per-call timeout in milliseconds. */
    timeoutMs?: number;
    /**
     * Address a specific After Effects instance for this call — an instance id
     * (its AE_MCP_INSTANCE at launch) or the name of the project file it has
     * open — overriding the transport's default target. Only the pull path can
     * honour it; a transport with a single fixed destination ignores it.
     */
    instance?: string;
}
/** What became of a rollback (jsx/serve.jsx, AE_MCP.rollBack). */
export interface RollbackReport {
    /** An undo was issued. */
    attempted: boolean;
    /** The undo ran without throwing and the checks below confirm the call's changes are gone. */
    rolledBack: boolean;
    /**
     * How far the result was checked: "signature" (the marker is gone and every
     * item matches its state before the call), "partial" (the same, over the
     * first 1000 items and the count), "marker" (only the marker could be
     * checked), "none".
     */
    verified: string;
    /** Why no undo was issued, or why it did not succeed. Null on success. */
    reason: string | null;
    /** What is still applied when the rollback did not succeed. */
    left: string | null;
    /** Errors After Effects reported (app.onError) while the undo ran with dialogs suppressed. */
    aeErrors: string[];
    /** What to do next, when the rollback was refused because of the render queue. */
    next?: string | null;
    /** Items present after the call that were not there before (up to 50), when the rollback did not succeed. */
    addedItems?: Array<{
        id: number;
        name: string;
    }>;
    /** Whether this call changed the render queue (null: unreadable), and the session flag. */
    renderQueue?: {
        changedInRequest: boolean | null;
        sessionFlag: unknown;
    };
    before?: {
        numItems: number;
        hash: string;
    } | null;
    after?: {
        numItems: number;
        hash: string;
    } | null;
}
export interface EvalResult {
    ok: boolean;
    /** Serialized return value from the JSX code. Always JSON-safe. */
    result: unknown;
    /** Error message if `ok` is false. */
    error: string | null;
    /**
     * Machine-readable failure class when `ok` is false. Lets callers branch on
     * "inspect before retry" (TIMEOUT) vs "AE isn't installed" (AE_NOT_FOUND) vs "the script
     * threw" (JSX_THROW) without parsing `error` prose.
     */
    errorCode: AeErrorCode | null;
    /**
     * 1-based line in the compiled request body where the script threw, when
     * the dispatcher reported one (JSX_THROW only). The compiled body = the
     * wrapped code handed to `execute`, offset by new Function's synthesized
     * header on line 1 — so `line - 1` indexes into that wrapped code, and
     * callers that assembled it can map further down to what they embedded.
     */
    line?: number | null;
    /** Optional stack trace from ExtendScript. */
    stack: string | null;
    /** Breadcrumb messages pushed via `log(...)` inside the JSX. */
    logs: string[];
    /** Wall-clock duration in milliseconds for the transport round trip. */
    durationMs: number;
    /**
     * Modal dialogs After Effects was found showing when the call failed
     * (DIALOG_OPEN). Handles can be passed to `instance.dismiss_dialog`.
     */
    dialogs?: AeDialog[];
    /** Present when the call needed a rollback: what was tried and what is left. */
    rollback?: RollbackReport | null;
}
export interface AeTransport {
    /** Execute a JSX snippet and return the parsed response. Never throws — errors are surfaced via `ok: false`. */
    execute(req: EvalRequest): Promise<EvalResult>;
    /** Optional hook to release resources (e.g. shut down a socket daemon). */
    close?(): Promise<void>;
    /**
     * Which After Effects instance the next call would go to, and how (push
     * via launch, or pull via a resident agent). Informational — for
     * `ae_context` and the startup banner; a transport with a single fixed
     * destination may omit it.
     */
    describeTarget?(): Promise<TargetResolution>;
}
//# sourceMappingURL=AeTransport.d.ts.map