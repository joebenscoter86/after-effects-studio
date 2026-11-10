import { z } from "zod";
import { resolveTarget } from "../transport/instances.js";
import { catalogTool } from "./catalog.js";
import { compInfoTool } from "./comp-info.js";
import { contextTool } from "./context.js";
import { doTool } from "./do.js";
import { layerInfoTool } from "./layer-info.js";
import { projectExportTool } from "./project-export.js";
import { projectImportTool } from "./project-import.js";
import { projectInfoTool } from "./project-info.js";
import { renderFrameTool } from "./render-frame.js";
import { saveProjectTool } from "./save-project.js";
import { versionInfoTool } from "./version-info.js";
const INSTANCE_PARAM = z.string().optional().describe(
  "After Effects instance to address for this call, when several are running (AfterFX.exe -m): an instance id (its AE_MCP_INSTANCE at launch, or the `name` given to instance.start) or the name of the project file it has open. Omit to use this server's default (AE_MCP_INSTANCE, else the single live instance). ae_context and ae_do instance.list show what is live."
);
const INSTANCE_FREE_TOOLS = /* @__PURE__ */ new Set(["ae_catalog"]);
function bindTransportToInstance(transport, instance) {
  return {
    execute: (req) => transport.execute({ instance, ...req }),
    describeTarget: () => resolveTarget(instance),
    ...transport.close ? { close: () => transport.close() } : {}
  };
}
function withInstanceParam(tool) {
  if (INSTANCE_FREE_TOOLS.has(tool.name)) return tool;
  return {
    ...tool,
    inputShape: { ...tool.inputShape, instance: INSTANCE_PARAM },
    handler: async (args, transport) => {
      const { instance, ...rest } = args ?? {};
      const named = typeof instance === "string" ? instance.trim() : "";
      return tool.handler(rest, named ? bindTransportToInstance(transport, named) : transport);
    }
  };
}
const ALL_TOOLS = [
  projectInfoTool,
  compInfoTool,
  layerInfoTool,
  renderFrameTool,
  saveProjectTool,
  projectExportTool,
  projectImportTool,
  versionInfoTool,
  catalogTool,
  doTool,
  contextTool
].map((tool) => withInstanceParam(tool));
export {
  ALL_TOOLS,
  INSTANCE_PARAM,
  bindTransportToInstance
};
