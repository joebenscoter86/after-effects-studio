import { describe, expect, it } from "vitest";

import { versionInfoTool } from "../src/tools/version-info.js";
import { nullTransport } from "./helpers/null-transport.js";

function runVersionProbe(compCount: number, supportsSaveFrame: boolean) {
  const transport = nullTransport();
  const calls = { addComp: 0, remove: 0 };
  class CompItem {
    saveFrameToPng?: () => void;
    constructor() {
      if (supportsSaveFrame) this.saveFrameToPng = () => {};
    }
  }
  const items = Array.from({ length: compCount }, () => new CompItem());
  const project = {
    numItems: items.length,
    file: null,
    dirty: false,
    item(index: number) {
      return items[index - 1];
    },
    items: {
      addComp() {
        calls.addComp++;
        return { remove: () => calls.remove++ };
      },
    },
  };
  const app = {
    version: "26.5",
    project,
    availableGPUAccelTypes: [],
  };
  const AE = {
    EXPORT_SCHEMA_VERSION: 1,
    safeGet<T>(fn: () => T, fallback: T): T {
      try {
        return fn();
      } catch {
        return fallback;
      }
    },
  };

  return versionInfoTool.handler({}, transport).then(() => {
    expect(transport.calls).toHaveLength(1);
    const code = transport.calls[0].code;
    const result = new Function("app", "AE", "CompItem", "$", code)(app, AE, CompItem, {
      global: {},
    }) as { capabilities: { saveFrameToPng: boolean | null }; project: { dirty: boolean } };
    return { result, project, calls };
  });
}

describe("ae_version_info project preservation", () => {
  it("does not create a scratch comp in an empty project", async () => {
    const { result, project, calls } = await runVersionProbe(0, true);
    expect(result.capabilities.saveFrameToPng).toBeNull();
    expect(result.project.dirty).toBe(false);
    expect(project.numItems).toBe(0);
    expect(calls).toEqual({ addComp: 0, remove: 0 });
  });

  it("reads the capability from an existing comp without mutation", async () => {
    const { result, project, calls } = await runVersionProbe(1, true);
    expect(result.capabilities.saveFrameToPng).toBe(true);
    expect(project.numItems).toBe(1);
    expect(calls).toEqual({ addComp: 0, remove: 0 });
  });
});
