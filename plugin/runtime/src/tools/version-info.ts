import { defineTool, toMcpResult } from "./define-tool.js";

// Returns AE version, build, and read-only capability checks. Useful for the
// agent to decide what APIs are available without changing the open project.

const CODE = `
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

export const versionInfoTool = defineTool({
  name: "ae_version_info",
  title: "Version info",
  description:
    "AE version, build, and read-only capabilities (saveFrameToPng, app.effects, Socket). " +
    "saveFrameToPng is null when no existing comp can be inspected.",
  group: "inspect",
  blockedInReadOnly: false,
  effect: "read",
  inputShape: {},
  handler: async (_args, transport) => {
    const result = await transport.execute({ code: CODE, label: "version_info" });
    return toMcpResult(result);
  },
});
