import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { getOp } from "../src/registry.js";
import "../src/operations/index.js";

// Execute the real generated operation at the external AE boundary. Model a
// host which saves a dirty project when app.open handles its close implicitly;
// the operation must make the discard decision explicit instead. Live AE
// characterization is a separate check, not something this host model proves.
function projectHost(options: { unsaved?: boolean; refuseClose?: boolean } = {}) {
  const files = new Map([
    ["/current.aep", "saved current"],
    ["/target.aep", "saved target"],
  ]);
  class HostFile {
    constructor(public fsName: string) {}
    get exists() {
      return files.has(this.fsName);
    }
  }
  function makeProject(path: string | null, contents: string, dirty: boolean) {
    return {
      file: path === null ? null : new HostFile(path),
      numItems: 1,
      contents,
      dirty,
      save() {
        if (!this.file) throw new Error("host Save As dialog would be required");
        files.set(this.file.fsName, this.contents);
        this.dirty = false;
      },
      close(choice: string) {
        if (options.refuseClose) return false;
        if (choice !== "discard" && this.dirty) this.save();
        active = null;
        return true;
      },
    };
  }
  let active: ReturnType<typeof makeProject> | null = makeProject(
    options.unsaved ? null : "/current.aep",
    "unsaved edits",
    true,
  );
  const app = {
    get project() {
      return active;
    },
    open(file: HostFile) {
      if (active?.dirty) active.save();
      active = makeProject(file.fsName, files.get(file.fsName)!, false);
      return active;
    },
  };
  return {
    files,
    current: () => active,
    run(args: Record<string, unknown>) {
      return runInNewContext(`(function () { ${getOp("project.open")!.toJsx(args)} })()`, {
        app,
        File: HostFile,
        CloseOptions: { DO_NOT_SAVE_CHANGES: "discard" },
      });
    },
  };
}

describe("project.open explicit save/discard contract", () => {
  it("discards dirty same-file state without rewriting its saved contents", () => {
    const host = projectHost();
    expect(host.run({ path: "/current.aep", save: false }).ok).toBe(true);
    expect(host.files.get("/current.aep")).toBe("saved current");
    expect(host.current()?.contents).toBe("saved current");
    expect(host.current()?.dirty).toBe(false);
  });

  it("leaves the previous file untouched when opening a different file without saving", () => {
    const host = projectHost();
    expect(host.run({ path: "/target.aep" }).ok).toBe(true);
    expect(host.files.get("/current.aep")).toBe("saved current");
    expect(host.current()?.file?.fsName).toBe("/target.aep");
    expect(host.current()?.contents).toBe("saved target");
  });

  it("checks the target exists before saving or discarding current work", () => {
    const host = projectHost();
    expect(host.run({ path: "/missing.aep", save: true }).ok).toBe(false);
    expect(host.files.get("/current.aep")).toBe("saved current");
    expect(host.current()?.contents).toBe("unsaved edits");
    expect(host.current()?.dirty).toBe(true);
  });

  it("refuses save=true when current nonempty work has no save path", () => {
    const host = projectHost({ unsaved: true });
    expect(host.run({ path: "/target.aep", save: true }).ok).toBe(false);
    expect(host.current()?.file).toBeNull();
    expect(host.current()?.contents).toBe("unsaved edits");
    expect(host.current()?.dirty).toBe(true);
  });

  it("saves dirty current work only when save=true was requested", () => {
    const host = projectHost();
    expect(host.run({ path: "/target.aep", save: true }).ok).toBe(true);
    expect(host.files.get("/current.aep")).toBe("unsaved edits");
    expect(host.current()?.file?.fsName).toBe("/target.aep");
  });

  it("does not open the target when the host refuses to close current work", () => {
    const host = projectHost({ refuseClose: true });
    expect(host.run({ path: "/target.aep", save: false }).ok).toBe(false);
    expect(host.current()?.file?.fsName).toBe("/current.aep");
    expect(host.current()?.contents).toBe("unsaved edits");
    expect(host.files.get("/current.aep")).toBe("saved current");
  });
});
