import { z } from "zod";
import { jsxVal } from "../registry.js";
import { defineTool, toMcpResult } from "./define-tool.js";
/**
 * Items listed in one reply by default. A 394-item project once returned
 * 82,681 characters, more than the host takes in one result (limits report,
 * defect 1); a 521-item scratch project returned 205,100. About 400
 * characters an item: 100 items stay near 40,000.
 */
export const PROJECT_INFO_DEFAULT_LIMIT = 100;
/** The read: project fields, counts of every item by type, and one page of items. */
export function projectInfoCode(args) {
    const limit = Math.max(1, Math.min(1000, Math.floor(args.limit ?? PROJECT_INFO_DEFAULT_LIMIT)));
    const offset = Math.max(0, Math.floor(args.offset ?? 0));
    return `
    var proj = app.project;
    var _limit = ${jsxVal(limit)};
    var _offset = ${jsxVal(offset)};
    var counts = {};
    var items = [];
    for (var i = 1; i <= proj.numItems; i++) {
        var it = proj.item(i);
        var tn = AE.itemTypeName(it);
        counts[tn] = (counts[tn] || 0) + 1;
        if (i > _offset && items.length < _limit) items.push(AE.serializeItemSummary(it));
    }
    var active = proj.activeItem;
    var shownTo = Math.min(proj.numItems, _offset + items.length);
    return {
        file: proj.file ? proj.file.fsName.replace(/\\\\/g, "/") : null,
        dirty: app.project.dirty,
        numItems: proj.numItems,
        counts: counts,
        bitsPerChannel: proj.bitsPerChannel,
        timeDisplayType: String(proj.timeDisplayType),
        activeItem: active ? { id: active.id, name: active.name, typeName: AE.itemTypeName(active) } : null,
        items: items,
        shown: { from: items.length ? _offset + 1 : 0, to: shownTo, of: proj.numItems },
        more: shownTo < proj.numItems ? "Items " + (shownTo + 1) + " to " + proj.numItems + " not listed: call again with offset " + shownTo + " (limit up to 1000), or use project.find_layers or comp info for what you need." : null
    };
`;
}
export const projectInfoTool = defineTool({
    name: "ae_project_info",
    title: "Project info",
    description: "Project-level info: file path, dirty flag, counts of items by type, active item, and the items with type/summary, " +
        `${PROJECT_INFO_DEFAULT_LIMIT} at a time (offset and limit for the rest; \`more\` says what was left out). Start here.`,
    group: "inspect",
    blockedInReadOnly: false,
    effect: "read",
    inputShape: {
        limit: z
            .number()
            .int()
            .min(1)
            .max(1000)
            .optional()
            .describe(`Items to list (default ${PROJECT_INFO_DEFAULT_LIMIT}; about 400 characters each).`),
        offset: z.number().int().min(0).optional().describe("Items to skip before listing (default 0)."),
    },
    handler: async (args, transport) => {
        const result = await transport.execute({ code: projectInfoCode(args), label: "project_info" });
        return toMcpResult(result);
    },
});
//# sourceMappingURL=project-info.js.map