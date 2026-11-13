import { z } from "zod";
/**
 * Items listed in one reply by default. A 394-item project once returned
 * 82,681 characters, more than the host takes in one result (limits report,
 * defect 1); a 521-item scratch project returned 205,100. About 400
 * characters an item: 100 items stay near 40,000.
 */
export declare const PROJECT_INFO_DEFAULT_LIMIT = 100;
/** The read: project fields, counts of every item by type, and one page of items. */
export declare function projectInfoCode(args: {
    limit?: number;
    offset?: number;
}): string;
export declare const projectInfoTool: import("./define-tool.js").ToolSpec<{
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}>;
//# sourceMappingURL=project-info.d.ts.map