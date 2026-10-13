import type { AeTransport } from "./transport/AeTransport.js";
export type ParamType = "string" | "number" | "boolean" | "array" | "object" | "any";
export interface OperationParam {
    name: string;
    type: ParamType;
    description: string;
    required?: boolean;
    default?: unknown;
    /**
     * Accept an explicit `null` for this parameter. Off by default: everywhere
     * else a `null` is an omitted argument that would otherwise be embedded into
     * the generated ExtendScript as a silent wrong value. Set it only where
     * `null` carries meaning (e.g. unparenting a layer).
     */
    nullable?: boolean;
}
export interface Operation {
    name: string;
    category: string;
    description: string;
    params: OperationParam[];
    /**
     * True when the operation cannot modify the AE project. Drives
     * AE_MCP_READONLY: read-only operations stay available there, everything
     * else is filtered out of `ae_catalog` and rejected by `ae_do`. Default
     * (undefined) means "mutates" — new operations are opted into safety, not
     * out of it.
     */
    readOnly?: boolean;
    /**
     * True for operations that change the user's After Effects APPLICATION
     * configuration — preferences, memory limits, font substitution policy,
     * saved render templates, the active tool. These persist beyond the project
     * (and mostly beyond the session), so an AI must never call them as a side
     * effect of ordinary project work. Marking an operation appConfig:
     *   - injects a required `confirm: true` parameter into its schema, and
     *   - makes ae_do / batch.run refuse the call unless confirm === true,
     * with an error that spells out the contract: pass confirm only when the
     * USER explicitly asked for this configuration change.
     */
    appConfig?: boolean;
    /**
     * Whether this call may run inside the dispatcher's automatic undo group.
     * Omitted means yes, which is right for everything that MUTATES the project.
     * Return false for anything that drives the undo stack itself — Undo and Redo
     * are the whole list. AE resolves them against the group that is still open,
     * so `app.executeCommand(16)` between beginUndoGroup and endUndoGroup reverts
     * nothing the caller asked for and leaves the stack describing a step that
     * never happened. Those requests run bare instead (see EvalRequest.undoGroup).
     */
    undoGroup?(args: Record<string, unknown>): boolean;
    /**
     * Whether the dispatcher may suppress modal alert dialogs around this call.
     * Omitted means yes. Return false only for calls that drive the undo stack
     * (Undo/Redo): beginSuppressDialogs opens an undo-transaction-like scope of
     * its own that those would resolve against. Deliberately separate from
     * `undoGroup`: project boundary ops (project.open / project.new) run
     * ungrouped but keep suppression — they are the calls most likely to pop a
     * modal (missing footage/fonts on open).
     */
    suppressDialogs?(args: Record<string, unknown>): boolean;
    /** Generate the JSX code body (function body, ends with `return ...;`). */
    toJsx(args: Record<string, unknown>): string;
    /**
     * Node-side implementation. When present, ae_do calls this instead of
     * generating ExtendScript — for operations that manage After Effects from
     * OUTSIDE it (starting and stopping instances, looking at which are live).
     * Policy and argument validation apply exactly as for a JSX operation. The
     * result follows the same convention: return `{ ok: false, error }` (plus
     * optional `errorCode` / `hint`) for an expected failure. `toJsx` must still
     * be provided; it should return a `jsxFail` saying the operation cannot ride
     * inside batch.run, which only knows how to inline ExtendScript.
     */
    run?(args: Record<string, unknown>, transport: AeTransport): Promise<unknown>;
}
/** The consent parameter injected into every appConfig operation. */
export declare const APP_CONFIG_CONFIRM_PARAM: OperationParam;
export declare function registerOp(op: Operation): void;
/**
 * Denial text for an appConfig operation called without confirm: true.
 * Returns null when the call is allowed. Shared by ae_do and batch.run so the
 * contract reads identically on both paths.
 */
export declare function denyAppConfig(op: Operation, args: Record<string, unknown>): string | null;
export declare function getOp(name: string): Operation | undefined;
export declare function listOps(category?: string): Operation[];
/** True when `op` may run inside the dispatcher's automatic undo group. */
export declare function wantsUndoGroup(op: Operation, args: Record<string, unknown>): boolean;
/** True when the dispatcher may suppress modal dialogs around `op`. */
export declare function wantsDialogSuppression(op: Operation, args: Record<string, unknown>): boolean;
export declare function listCategories(): string[];
/**
 * Safely embed a value as a JSX literal (JSON-stringified). Two subtleties:
 *  - `undefined` (a common value for an omitted optional arg) is normalized to
 *    `null` first: JSON.stringify(undefined) returns the *value* undefined, not
 *    a string, so calling .replace on it would throw. `null` embeds as a falsy
 *    literal, keeping patterns like `${jsxVal(args.w)} || _comp.width` working.
 *  - U+2028/U+2029 are legal raw inside JSON strings but are line terminators
 *    in ExtendScript's pre-ES2019 grammar — escape them or the generated
 *    script fails to parse.
 */
export declare function jsxVal(v: unknown): string;
/**
 * A whole operation body that reports a validation failure decided on the
 * Node side (before anything reaches AE). Use it for early returns from
 * `toJsx` instead of an inline `return { ok: false, error: \`…\` }` template:
 * an interpolated message that itself contains braces (`{ layer, ranges }`)
 * confuses the codegen lint's template scanner, and the message is embedded
 * through `jsxVal` here exactly once.
 */
export declare function jsxFail(message: string): string;
/** Build the standard comp lookup preamble (defines `_comp`). */
export declare function jsxCompPreamble(args: Record<string, unknown>): string;
/**
 * Build the standard comp + layer lookup preamble (defines `_comp` and
 * `_layer`). Resolution goes through AE.findLayerInComp, which accepts a
 * 1-based index (range-checked — CompItem.layer() throws on out-of-range), a
 * layer name, or `{ id: n }` for a stable Layer.id reference (AE 22.0+).
 */
export declare function jsxCompLayerPreamble(args: Record<string, unknown>): string;
/** Build property lookup from a path array. */
export declare function jsxPropertyLookup(pathArg?: string): string;
/** Ambient context JSX snippet — appended to every ae_do response. */
export declare const AMBIENT_CONTEXT_JSX = "\n    var _ctx = {};\n    try {\n        var _ai = app.project.activeItem;\n            _ctx.project = { numItems: app.project.numItems, dirty: app.project.dirty, file: app.project.file ? app.project.file.fsName.replace(/\\\\/g,\"/\") : null };\n        // Which After Effects instance answered (its resident agent's id), so\n        // a session driving several never has to guess where an edit landed.\n        try { _ctx.instance = $.global.AE_MCP_AGENT ? $.global.AE_MCP_AGENT.state.id : null; } catch (eInst) { _ctx.instance = null; }\n        if (_ai && _ai instanceof CompItem) {\n            _ctx.activeComp = { id: _ai.id, name: _ai.name, width: _ai.width, height: _ai.height, fps: _ai.frameRate, duration: _ai.duration, numLayers: _ai.numLayers };\n            var _sel = [];\n            for (var _si = 1; _si <= _ai.numLayers; _si++) {\n                if (_ai.layer(_si).selected) _sel.push({ index: _si, name: _ai.layer(_si).name });\n            }\n            _ctx.selectedLayers = _sel;\n        } else {\n            _ctx.activeComp = null;\n            _ctx.selectedLayers = [];\n        }\n    } catch (eCtx) { _ctx.error = AE.errText(eCtx); }\n";
//# sourceMappingURL=registry.d.ts.map