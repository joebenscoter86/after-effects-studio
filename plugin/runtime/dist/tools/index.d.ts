import { z } from "zod";
import type { ToolEffect } from "../policy.js";
import type { AeTransport } from "../transport/AeTransport.js";
import type { ToolGroup } from "./define-tool.js";
import type { ToolResult } from "./types.js";
export type AnyTool = {
    name: string;
    title: string;
    description: string;
    group: ToolGroup;
    blockedInReadOnly: boolean;
    effect: ToolEffect;
    inputShape: z.ZodRawShape;
    handler: (args: any, transport: AeTransport) => Promise<ToolResult>;
};
/**
 * The one argument every AE-touching tool shares: which After Effects
 * instance to talk to. Added here, in one place, rather than in each tool —
 * a tool's own handler never sees it; the transport it receives is already
 * bound to that instance.
 */
export declare const INSTANCE_PARAM: z.ZodOptional<z.ZodString>;
/**
 * A view of `transport` whose calls go to `instance` unless a call names one
 * itself — a Node-side operation bound to the main instance still has to
 * reach the worker it is starting.
 */
export declare function bindTransportToInstance(transport: AeTransport, instance: string): AeTransport;
/** Every MCP tool this server exposes, in registration order. */
export declare const ALL_TOOLS: AnyTool[];
//# sourceMappingURL=index.d.ts.map