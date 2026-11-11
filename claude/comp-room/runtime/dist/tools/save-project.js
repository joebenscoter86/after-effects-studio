import { z } from "zod";
import { jsxVal } from "../registry.js";
import { defineTool, toMcpResult } from "./define-tool.js";
const saveProjectTool = defineTool({
  name: "ae_save_project",
  title: "Save project",
  description: "Save the project. Pass `path` for Save As.",
  group: "document",
  // Overwrites the .aep on disk — not undoable with Ctrl+Z.
  blockedInReadOnly: true,
  effect: "destructive",
  inputShape: {
    path: z.string().optional().describe(
      "Optional absolute path to save the project to (Save As). If omitted, save to the existing path \u2014 errors if the project has never been saved."
    )
  },
  handler: async (args, transport) => {
    const code = `
        var _path = ${jsxVal(args.path ?? null)};
        if (_path) {
            // Save As into a folder that does not exist yet fails inside AE on a
            // temp file name; create the folder first, as the render ops do.
            var f = AE.ensureParentDir(_path);
            if (f.parent && !f.parent.exists) {
                return { ok: false, saved: false, error: "cannot create folder " + f.parent.fsName.replace(/\\\\/g, "/") + " for the project file" };
            }
            app.project.save(f);
            return { ok: true, saved: true, path: f.fsName.replace(/\\\\/g, "/") };
        }
        if (!app.project.file) {
            return { ok: false, saved: false, error: "project has no existing path; pass 'path' to save as" };
        }
        app.project.save();
        return { ok: true, saved: true, path: app.project.file.fsName.replace(/\\\\/g, "/") };
    `;
    const result = await transport.execute({ code, label: "save_project" });
    return toMcpResult(result);
  }
});
export {
  saveProjectTool
};
