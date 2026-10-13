export interface TextContent {
    type: "text";
    text: string;
}
export interface ImageContent {
    type: "image";
    data: string;
    mimeType: string;
}
export type ToolContent = TextContent | ImageContent;
export interface ToolResult {
    [key: string]: unknown;
    content: ToolContent[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
}
//# sourceMappingURL=types.d.ts.map