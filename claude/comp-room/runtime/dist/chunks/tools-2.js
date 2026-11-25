import { __esmMin } from "./rolldown-runtime.js";
import { init_schemas, string } from "../vendor/zod-2.js";
import { init_registry, jsxVal } from "./core-1.js";
import { defineTool, init_define_tool, toMcpResult } from "./tools-1.js";

// server/tools/save-project.js
var saveProjectTool;
function init_save_project() {
	return (init_save_project = __esmMin((() => {
		init_schemas();
		init_registry();
		init_define_tool();
		saveProjectTool = defineTool({
			name: "ae_save_project",
			title: "Save project",
			description: "Save the project. Pass `path` for Save As.",
			group: "document",
			blockedInReadOnly: true,
			effect: "destructive",
			inputShape: { path: string().optional().describe("Optional absolute path to save the project to (Save As). If omitted, save to the existing path — errors if the project has never been saved.") },
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
				const result = await transport.execute({
					code,
					label: "save_project"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

// server/tools/version-info.js
var CODE, versionInfoTool;
function init_version_info() {
	return (init_version_info = __esmMin((() => {
		init_define_tool();
		CODE = `
    return {
        app: {
            version: app.version,
            buildName: AE.safeGet(function () { return app.buildName; }, null),
            buildNumber: AE.safeGet(function () { return app.buildNumber; }, null),
            language: AE.safeGet(function () { return String(app.isoLanguage); }, null),
            memoryInUse: AE.safeGet(function () { return app.memoryInUse; }, null),
            availableGPUs: AE.safeGet(function () { return app.availableGPUAccelTypes ? app.availableGPUAccelTypes.length : 0; }, null)
        },
        capabilities: {
            saveFrameToPng: AE.safeGet(function () {
                // A create/remove probe dirties even a previously clean project.
                // Inspect an existing comp only; null means there is no comp
                // from which to determine this capability safely.
                for (var i = 1; i <= app.project.numItems; i++) {
                    var item = app.project.item(i);
                    if (item instanceof CompItem) {
                        return typeof item.saveFrameToPng === "function";
                    }
                }
                return null;
            }, null),
            appEffects: AE.safeGet(function () { return !!(app.effects && app.effects.length); }, false),
            bridgeTalk: AE.safeGet(function () { return typeof BridgeTalk !== "undefined"; }, false),
            socket: AE.safeGet(function () { return typeof Socket !== "undefined"; }, false)
        },
        project: {
            numItems: app.project.numItems,
            file: app.project.file ? app.project.file.fsName.replace(/\\\\/g, "/") : null,
            dirty: app.project.dirty
        },
        // The resident agent (pull path), when this instance runs one. null
        // means the call arrived through the push path (AfterFX.exe -r).
        agent: AE.safeGet(function () {
            var a = $.global.AE_MCP_AGENT;
            if (!a) return null;
            return {
                id: a.state.id,
                idSource: a.state.idSource,
                agentVersion: a.state.agentVersion,
                ticks: a.state.ticks,
                served: a.state.served
            };
        }, null),
        server: {
            exportSchemaVersion: AE.EXPORT_SCHEMA_VERSION
        }
    };
`;
		versionInfoTool = defineTool({
			name: "ae_version_info",
			title: "Version info",
			description: "AE version, build, and read-only capabilities (saveFrameToPng, app.effects, Socket). saveFrameToPng is null when no existing comp can be inspected.",
			group: "inspect",
			blockedInReadOnly: false,
			effect: "read",
			inputShape: {},
			handler: async (_args, transport) => {
				const result = await transport.execute({
					code: CODE,
					label: "version_info"
				});
				return toMcpResult(result);
			}
		});
	})))();
}

export { init_save_project, init_version_info, saveProjectTool, versionInfoTool };