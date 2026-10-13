import type { z } from "zod";
import type { ToolEffect } from "../policy.js";
import type { AeTransport, EvalResult } from "../transport/AeTransport.js";
import type { ToolResult } from "./types.js";
export type ToolGroup = "inspect" | "document" | "render" | "operations";
export type ArgsOf<S extends z.ZodRawShape> = z.infer<z.ZodObject<S>>;
export type ToolSpec<S extends z.ZodRawShape> = {
    name: string;
    title: string;
    description: string;
    group: ToolGroup;
    /**
     * Whether AE_MCP_READONLY withholds this tool entirely. Deliberately its own
     * axis rather than a claim about the tool: `ae_render_frame` writes a PNG but
     * never touches the project, so read-only mode keeps it (the agent still
     * needs its eyes), and `ae_do` stays registered because its operations are
     * gated one by one — withholding it would leave `ae_catalog` advertising
     * operations nothing can execute.
     */
    blockedInReadOnly: boolean;
    /** MCP behaviour hint for clients that gate on readOnlyHint/destructiveHint. */
    effect: ToolEffect;
    inputShape: S;
    handler: (args: ArgsOf<S>, transport: AeTransport) => Promise<ToolResult>;
};
/**
 * Typed tool factory. Infers the handler's argument type from `inputShape`
 * so every tool definition stays short and consistent.
 */
export declare function defineTool<S extends z.ZodRawShape>(spec: ToolSpec<S>): ToolSpec<S>;
/** Wraps a successful payload into a standard MCP ToolResult. */
export declare function jsonResult(payload: Record<string, unknown>): ToolResult;
/**
 * Our JSX convention is that an operation reports application-level failure by
 * RETURNING `{ ok: false, error }` — the script itself ran fine, so the
 * transport reports success. Every caller must therefore look one level down,
 * or a "comp not found" reads as a successful render.
 */
export declare function jsxReportedFailure(result: unknown): {
    error: string;
} | null;
/**
 * Converts a transport-level EvalResult (the parsed dispatcher response) into
 * an MCP ToolResult, mapping all three failure layers — transport, dispatcher,
 * and the operation's own `{ ok: false }` — onto the unified error envelope.
 */
export declare function toMcpResult(result: EvalResult): ToolResult;
//# sourceMappingURL=define-tool.d.ts.map