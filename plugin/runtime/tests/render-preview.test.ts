// render.preview (agent-eyes plan, stage 4): a quick movie to watch at speed,
// through the render queue. The generated ExtendScript runs here against a
// mock render queue and file system, so nothing can reach After Effects. What
// is checked: it leaves the queue as it found it (only its own item is added
// and removed, every other item's render flag is back), never overwrites a
// file unless asked, creates the folder, refuses a missing comp, and reports
// path, duration, frame count and render time.

import { describe, expect, it } from "vitest";

import "../src/operations/index.js";
import { getOp } from "../src/registry.js";

type Disk = Map<string, { bytes: number; modifiedMs: number }>;

interface MockOm {
  file: { fsName: string } | null;
  templates: string[];
  applied: string | null;
  applyTemplate(name: string): void;
}

interface MockItem {
  comp: { name: string };
  templates: string[];
  render: boolean;
  status: string;
  timeSpanStart: number;
  timeSpanDuration: number;
  numOutputModules: number;
  elapsedSeconds: number;
  removed: boolean;
  settings: Record<string, string>;
  setSettingsCalls: Array<Record<string, string>>;
  om: MockOm;
  outputModule(i: number): MockOm;
  setSettings(s: Record<string, string>): void;
  getSettings(): Record<string, string>;
  remove(): void;
}

const TEMPLATES = ["Lossless", "High Quality", "H.264 - Match Render Settings - 15 Mbps"];

interface World {
  disk: Disk;
  items: MockItem[];
  createdDirs: string[];
  renderedWhileFlags: boolean[][];
  rendering: boolean;
  renderThrows?: string;
  /** What the render writes for our item; false = writes nothing. */
  writes?: boolean;
  /** Settings AE reads back after setSettings (to simulate a key it ignores). */
  readBack?: (s: Record<string, string>) => Record<string, string>;
}

function makeItem(
  world: World,
  comp: { name: string },
  status = "QUEUED",
  render = true,
): MockItem {
  const om: MockOm = {
    file: null,
    templates: TEMPLATES,
    applied: null,
    applyTemplate(name: string) {
      if (!TEMPLATES.includes(name)) throw new Error(`no template ${name}`);
      this.applied = name;
    },
  };
  const item: MockItem = {
    comp,
    templates: ["Best Settings", "Draft Settings"],
    render,
    status,
    timeSpanStart: 0,
    timeSpanDuration: 99,
    numOutputModules: 1,
    elapsedSeconds: 3,
    removed: false,
    settings: { Resolution: "Full" },
    setSettingsCalls: [],
    om,
    outputModule: () => om,
    setSettings(s) {
      this.setSettingsCalls.push(s);
      this.settings = { ...this.settings, ...(world.readBack ? world.readBack(s) : s) };
    },
    getSettings() {
      return this.settings;
    },
    remove() {
      this.removed = true;
      world.items.splice(world.items.indexOf(this), 1);
    },
  };
  return item;
}

const COMP = {
  name: "Main",
  duration: 10,
  frameDuration: 1 / 25,
  workAreaStart: 2,
  workAreaDuration: 4,
  width: 1080,
  height: 1920,
};

function run(
  args: Record<string, unknown>,
  world: World,
  comp: typeof COMP | null = COMP,
  opName = "render.preview",
) {
  const code = getOp(opName)!.toJsx(args);
  let clock = 1_000;
  const MockFile = class {
    constructor(readonly fsName: string) {}
    get exists() {
      return world.disk.has(this.fsName);
    }
    get length() {
      return world.disk.get(this.fsName)?.bytes ?? 0;
    }
    get modified() {
      const ms = world.disk.get(this.fsName)?.modifiedMs;
      return ms === undefined ? null : new Date(ms);
    }
  };
  const rq = {
    get numItems() {
      return world.items.length;
    },
    get rendering() {
      return world.rendering;
    },
    item: (i: number) => world.items[i - 1],
    items: {
      add: (c: { name: string }) => {
        const it = makeItem(world, c);
        world.items.push(it);
        return it;
      },
    },
    render: () => {
      if (world.renderThrows) throw new Error(world.renderThrows);
      world.renderedWhileFlags.push(world.items.map((it) => it.render));
      clock += 2_500;
      for (const it of world.items) {
        if (!it.render || it.status !== "QUEUED") continue;
        it.status = "DONE";
        if (it.om.file && world.writes !== false)
          world.disk.set(it.om.file.fsName, { bytes: 4096, modifiedMs: clock });
      }
    },
  };
  const AE = {
    findCompByNameOrId: (ref: unknown) => (comp && ref === comp.name ? comp : null),
    ensureParentDir: (p: string) => {
      world.createdDirs.push(p.slice(0, p.lastIndexOf("/")));
      return new MockFile(p);
    },
    applyTemplate: (target: MockOm, name: string, label: string) => {
      try {
        target.applyTemplate(name);
        return null;
      } catch {
        return `${label}: no template named '${name}' — available: ${target.templates.join(" | ")}`;
      }
    },
    errText: (e: unknown) => (e instanceof Error ? e.message : String(e)),
    safeGet: (fn: () => unknown, fallback: unknown) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    },
  };
  const RealDate = Date;
  const FakeDate = class extends RealDate {
    getTime() {
      return clock;
    }
  };
  const fn = new Function(
    "app",
    "AE",
    "RQItemStatus",
    "File",
    "GetSettingsFormat",
    "Date",
    code,
  ) as (...a: unknown[]) => Record<string, any>;
  return fn(
    { project: { renderQueue: rq } },
    AE,
    { QUEUED: "QUEUED", DONE: "DONE", ERR_STOPPED: "ERR_STOPPED", USER_STOPPED: "USER_STOPPED" },
    MockFile,
    { STRING_SETTABLE: "settable" },
    FakeDate,
  );
}

function world(extra: Partial<World> = {}): World {
  return {
    disk: new Map(),
    items: [],
    createdDirs: [],
    renderedWhileFlags: [],
    rendering: false,
    ...extra,
  };
}

const OUT = "/scratch/previews/main.mov";

describe("render.preview", () => {
  it("is registered as a render operation that changes the project", () => {
    const op = getOp("render.preview")!;
    expect(op.category).toBe("render");
    expect(op.readOnly).toBeFalsy();
    expect(op.params.map((p) => p.name)).toEqual(
      expect.arrayContaining([
        "comp",
        "outputPath",
        "span",
        "outputTemplate",
        "resolution",
        "overwrite",
      ]),
    );
  });

  it("renders the work area to the file and reports path, duration, frames and render time", () => {
    const w = world();
    const out = run({ comp: "Main", outputPath: OUT }, w);
    expect(out).toMatchObject({
      ok: true,
      outputPath: OUT,
      timeSpanStart: 2,
      durationSeconds: 4,
      frameCount: 100,
      frameRate: 25,
      renderSeconds: 2.5,
      bytes: 4096,
      outputTemplate: "High Quality",
      resolution: "full",
      span: "workArea",
    });
    expect(w.createdDirs).toContain("/scratch/previews");
    expect(w.items).toHaveLength(0);
  });

  it("leaves the render queue as it found it: other items stay, unrendered, flags restored", () => {
    const w = world();
    const other = makeItem(w, { name: "Other" });
    const done = makeItem(w, { name: "Old" }, "DONE", false);
    w.items.push(other, done);
    const out = run({ comp: "Main", outputPath: OUT }, w);
    expect(out.ok).toBe(true);
    expect(w.items).toEqual([other, done]);
    expect(other.render).toBe(true);
    expect(other.status).toBe("QUEUED");
    expect(done.render).toBe(false);
    // While the queue rendered, only the preview's own item was switched on.
    expect(w.renderedWhileFlags).toEqual([[false, false, true]]);
  });

  it("renders the whole comp, or an explicit span", () => {
    expect(run({ comp: "Main", outputPath: OUT, span: "comp" }, world())).toMatchObject({
      timeSpanStart: 0,
      durationSeconds: 10,
      frameCount: 250,
    });
    expect(
      run({ comp: "Main", outputPath: OUT, timeSpanStart: 1, timeSpanDuration: 2 }, world()),
    ).toMatchObject({ timeSpanStart: 1, durationSeconds: 2, frameCount: 50 });
  });

  it("never overwrites an existing file unless asked", () => {
    const w = world();
    w.disk.set(OUT, { bytes: 10, modifiedMs: 1 });
    const out = run({ comp: "Main", outputPath: OUT }, w);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/already exists/);
    expect(out.error).toMatch(/overwrite/);
    expect(w.items).toHaveLength(0);
    expect(w.renderedWhileFlags).toHaveLength(0);
    const again = run({ comp: "Main", outputPath: OUT, overwrite: true }, w);
    expect(again.ok).toBe(true);
    expect(again.overwritten).toBe(true);
  });

  it("refuses a missing comp clearly, before touching the queue", () => {
    const w = world();
    const out = run({ comp: "Nope", outputPath: OUT }, w);
    expect(out).toMatchObject({ ok: false });
    expect(out.error).toMatch(/no comp matching Nope/);
    expect(w.items).toHaveLength(0);
  });

  it("refuses while the queue is already rendering", () => {
    const out = run({ comp: "Main", outputPath: OUT }, world({ rendering: true }));
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/already rendering/);
  });

  it("refuses an unknown output template, removing its item and listing the names", () => {
    const w = world();
    const out = run({ comp: "Main", outputPath: OUT, outputTemplate: "Tiny" }, w);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/Tiny/);
    expect(out.error).toMatch(/High Quality/);
    expect(w.items).toHaveLength(0);
  });

  it("leaves resolution alone at full, and reads it back when asked for less", () => {
    const full = world();
    run({ comp: "Main", outputPath: OUT }, full);
    expect(full.renderedWhileFlags).toHaveLength(1);
    const w = world();
    const out = run({ comp: "Main", outputPath: OUT, resolution: "half" }, w);
    expect(out).toMatchObject({ ok: true, resolution: "half", resolutionReadBack: "Half" });
    expect(out.warnings).toEqual([]);
  });

  it("warns when the resolution did not take", () => {
    const out = run(
      { comp: "Main", outputPath: OUT, resolution: "quarter" },
      world({ readBack: () => ({ Resolution: "Full" }) }),
    );
    expect(out.ok).toBe(true);
    expect(out.resolutionReadBack).toBe("Full");
    expect(out.warnings.join(" ")).toMatch(/resolution/i);
  });

  it("removes its item and restores the others even when the render throws", () => {
    const w = world({ renderThrows: "disk full" });
    const other = makeItem(w, { name: "Other" });
    w.items.push(other);
    const out = run({ comp: "Main", outputPath: OUT }, w);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/disk full/);
    expect(w.items).toEqual([other]);
    expect(other.render).toBe(true);
  });

  it("fails when the render leaves no new file", () => {
    const out = run({ comp: "Main", outputPath: OUT }, world({ writes: false }));
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no new file/);
  });

  it("says the project is left modified by the queue change", () => {
    const out = run({ comp: "Main", outputPath: OUT }, world());
    expect(out.projectModified).toBe(true);
    expect(out.projectNote).toMatch(/render-queue item was added and removed/);
  });

  it("lists the templates through a temporary item, leaving the queue as it was", () => {
    const w = world();
    const other = makeItem(w, { name: "Other" });
    w.items.push(other);
    const out = run({ comp: "Main", listTemplates: true }, w);
    expect(out).toMatchObject({
      ok: true,
      outputTemplates: TEMPLATES,
      renderTemplates: ["Best Settings", "Draft Settings"],
      projectModified: true,
    });
    expect(w.items).toEqual([other]);
    expect(other.render).toBe(true);
    expect(w.renderedWhileFlags).toEqual([]);
  });

  it("refuses a missing comp when listing templates", () => {
    const w = world();
    const out = run({ comp: "Nope", listTemplates: true }, w);
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/no comp matching Nope/);
  });

  it("needs an outputPath unless it is only listing templates", () => {
    const out = run({ comp: "Main" }, world());
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/outputPath/);
  });
});

describe("render.list_templates with an empty queue", () => {
  it("reads through a temporary item for the named comp and removes it", () => {
    const w = world();
    const out = run({ comp: "Main" }, w, COMP, "render.list_templates");
    expect(out).toMatchObject({ ok: true, outputTemplates: TEMPLATES, temporaryItem: true });
    expect(w.items).toHaveLength(0);
  });

  it("still reads from the first item when the queue has one, adding nothing", () => {
    const w = world();
    w.items.push(makeItem(w, { name: "Other" }));
    const out = run({}, w, COMP, "render.list_templates");
    expect(out).toMatchObject({ ok: true, outputTemplates: TEMPLATES });
    expect(out.temporaryItem).toBeUndefined();
    expect(w.items).toHaveLength(1);
  });

  it("adds nothing in read-only mode", () => {
    const before = process.env.AE_MCP_READONLY;
    process.env.AE_MCP_READONLY = "1";
    try {
      const w = world();
      const out = run({ comp: "Main" }, w, COMP, "render.list_templates");
      expect(out.ok).toBe(false);
      expect(out.error).toMatch(/AE_MCP_READONLY/);
      expect(w.items).toHaveLength(0);
    } finally {
      if (before === undefined) delete process.env.AE_MCP_READONLY;
      else process.env.AE_MCP_READONLY = before;
    }
  });

  it("says to name a comp when the queue is empty", () => {
    const out = run({}, world(), COMP, "render.list_templates");
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/comp/);
  });
});
