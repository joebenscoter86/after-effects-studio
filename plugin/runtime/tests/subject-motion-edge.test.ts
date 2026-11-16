// Offline tests for subject.motion_edge: a cut-out made with Object Matte gets
// a soft, motion-blurred edge where the subject moves, taken from a second,
// per-pixel keyer effect the user installs separately. The keyer's match name
// is a parameter; these tests use a made-up one. Nothing here reaches After
// Effects: the generated JSX is read as text, the keyer lookup is run against
// a fake `app`, and the run goes through injected calls.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  MOTION_EDGE_COST,
  MOTION_EDGE_DEFAULTS,
  motionEdgeBuildJsx,
  motionEdgeSettings,
  motionEdgeUndoJsx,
  motionKeyerCheckJsx,
  runMotionEdge,
  type MotionEdgeIO,
} from "../src/operations/keying.js";
import { validateOpArgs } from "../src/opschema.js";
import { getOp, listOps } from "../src/registry.js";
import "../src/operations/index.js";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const KEYER = "XYZ Made Up Keyer";

const build = (over: Record<string, unknown> = {}) =>
  motionEdgeBuildJsx({
    comp: "Main",
    layer: "take",
    keyerMatchName: KEYER,
    keyerSettings: { "Despill Strength": 1 },
    threshold: { black: 0.25, white: 0.45 },
    motionGrow: 25,
    motionBlur: 15,
    band: 50,
    ...over,
  });

describe("the defaults", () => {
  it("are the values measured on the 4K studio take", () => {
    expect(MOTION_EDGE_DEFAULTS).toMatchObject({
      threshold: { black: 0.25, white: 0.45 },
      motionGrow: 25,
      motionBlur: 15,
      motionBlurIterations: 2,
      band: 50,
      bandChannel: 2,
    });
  });

  it("fill in what the caller leaves out", () => {
    const s = motionEdgeSettings({ comp: "Main", layer: 1, keyerMatchName: KEYER });
    expect(s).toEqual({
      ok: true,
      settings: {
        keyerMatchName: KEYER,
        keyerSettings: {},
        threshold: { black: 0.25, white: 0.45 },
        motionGrow: 25,
        motionBlur: 15,
        band: 50,
      },
    });
  });
});

describe("the build", () => {
  it("makes a difference of the take against itself one frame later", () => {
    const j = build();
    expect(j).toContain("BlendingMode.DIFFERENCE");
    expect(j).toMatch(/_t1\.startTime = _t1\.startTime \+ _fd/);
    expect(j).toMatch(/var _fd = _comp\.frameDuration/);
  });

  it("thresholds, tints, grows and blurs the difference on one adjustment layer, in that order", () => {
    const j = build();
    expect(j).toContain("adjustmentLayer = true");
    const order = ["ADBE Easy Levels2", "ADBE Tint", "ADBE Minimax", "ADBE Box Blur2"].map((m) =>
      j.indexOf(`_ap.addProperty(${JSON.stringify(m)})`),
    );
    for (const i of order) expect(i).toBeGreaterThan(0);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(j).toContain('["ADBE Easy Levels2-0003","Input Black",0.25]');
    expect(j).toContain('["ADBE Easy Levels2-0004","Input White",0.45]');
    expect(j).toContain('["ADBE Minimax-0002","Radius",25]');
    expect(j).toContain('["ADBE Box Blur2-0001","Blur Radius",15]');
    expect(j).toContain('["ADBE Box Blur2-0002","Iterations",2]');
  });

  it("sets the stock effects' properties by match name first, the English name only as a fallback, and says so", () => {
    const j = build();
    // Every stock effect is set through _setEach, never by an English name alone.
    expect(j).not.toMatch(/_setAll\(_ap\.property/);
    expect(j).not.toMatch(/_setAll\(_bOm/);
    expect(j).toMatch(/function _setEach\(fx, list, what\)/);
    // The lookup tries the match name before the English name.
    const each = j.slice(j.indexOf("function _setEach"));
    expect(each.indexOf("_find(fx, ent[0])")).toBeGreaterThan(0);
    expect(each.indexOf("_find(fx, ent[1])")).toBeGreaterThan(each.indexOf("_find(fx, ent[0])"));
    expect(j).toMatch(/English/);
    // A match name that finds another property than the English name loses, and is reported.
    expect(each).toMatch(/pm\.matchName !== pn\.matchName\) \{ p = pn; _mismatch\.push/);
    expect(j).toMatch(/matchNameMismatch: _mismatch/);
    // The keyer's settings stay keyed by the caller's own names.
    expect(j).toMatch(/_setAll\(_ck\.property\("ADBE Effect Parade"\)\.property\(1\)/);
  });

  it("fetches every effect again by index after all are added (adding one invalidates earlier references)", () => {
    const j = build();
    const lastAdd = j.lastIndexOf('_ap.addProperty("ADBE Box Blur2")');
    const firstSet = j.indexOf("_setEach(_ap.property(");
    expect(firstSet).toBeGreaterThan(lastAdd);
    expect(j.slice(lastAdd, firstSet)).toMatch(/_ap = _adj\.property\("ADBE Effect Parade"\)/);
  });

  describe("the stock settings lookup, run against a made-up effect", () => {
    const j = build();
    const helpers = j.slice(j.indexOf("function _find("), j.indexOf("function _strip("));
    const PROPERTY = 6212;
    const prop = (matchName: string, name: string) => ({
      matchName,
      name,
      propertyType: PROPERTY,
      value: null as unknown,
      setValue(v: unknown) {
        this.value = v;
      },
    });
    const effect = (props: Any[]) => ({
      numProperties: props.length,
      property: (k: number | string) =>
        typeof k === "number"
          ? props[k - 1]
          : (props.find((p) => p.matchName === k || p.name === k) ?? null),
    });
    const run = (fx: Any, list: Any[]) =>
      new Function(
        "PropertyType",
        `${helpers}\n_setEach(arguments[1], arguments[2], "Minimax"); return _mismatch;`,
      )({ PROPERTY }, fx, list);

    it("sets by match name in any language", () => {
      const radius = prop("ADBE Minimax-0002", "Rayon");
      const mismatch = run(effect([prop("ADBE Minimax-0001", "Opération"), radius]), [
        ["ADBE Minimax-0002", "Radius", 25],
      ]);
      expect(radius.value).toBe(25);
      expect(mismatch).toEqual([]);
    });

    it("falls back to the English name when the match name is unknown", () => {
      const radius = prop("ADBE Minimax-0099", "Radius");
      run(effect([radius]), [["ADBE Minimax-0002", "Radius", 25]]);
      expect(radius.value).toBe(25);
    });

    it("sets the English-named property and reports it when the match name finds another", () => {
      const channel = prop("ADBE Minimax-0002", "Channel");
      const radius = prop("ADBE Minimax-0003", "Radius");
      const mismatch = run(effect([channel, radius]), [["ADBE Minimax-0002", "Radius", 25]]);
      expect(radius.value).toBe(25);
      expect(channel.value).toBeNull();
      expect(mismatch).toHaveLength(1);
      expect(mismatch[0]).toMatch(/ADBE Minimax-0002/);
    });
  });

  it("grows the Object Matte's alpha by the band, with Don't Shrink Edges on", () => {
    const j = build({ band: 50 });
    expect(j).toContain(
      '[["ADBE Minimax-0002","Radius",50],["ADBE Minimax-0003","Channel",2],["ADBE Minimax-0005","Don\'t Shrink Edges",1]]',
    );
  });

  it("mattes the band by the motion as Luma, then the keyer's edge by the band as Alpha", () => {
    const j = build();
    const luma = j.indexOf("TrackMatteType.LUMA");
    const alpha = j.indexOf("TrackMatteType.ALPHA)");
    expect(luma).toBeGreaterThan(0);
    expect(alpha).toBeGreaterThan(luma);
    expect(j).toMatch(/_bOm\.setTrackMatte\(_bMo, TrackMatteType\.LUMA\)/);
    expect(j).toMatch(/_eCk\.setTrackMatte\(_eBand, TrackMatteType\.ALPHA\)/);
    expect(j).toMatch(/_eBand\.enabled = false/);
  });

  it("stacks the outline over the band over the keyer's edge", () => {
    const j = build();
    const ck = j.indexOf("_eCk = _me.layers.add(");
    const band = j.indexOf("_eBand = _me.layers.add(");
    const om = j.indexOf("_eOm = _me.layers.add(");
    // layers.add puts each new layer on top: added bottom first.
    expect(ck).toBeGreaterThan(0);
    expect(band).toBeGreaterThan(ck);
    expect(om).toBeGreaterThan(band);
  });

  it("looks the keyer up by the given match name and sets its settings", () => {
    const j = build();
    expect(j).toContain("app.effects");
    expect(j).toContain(JSON.stringify(KEYER));
    expect(j).toMatch(/"Despill Strength":1/);
  });

  it("places one precomp above the matted layer, switches the original off and turns the copies' sound off", () => {
    const j = build();
    expect(j).toContain('" motion edge"');
    expect(j).toMatch(/_pl\.moveBefore\(_layer\)/);
    expect(j).toContain("_layer.enabled = false");
    expect(j).toContain("audioEnabled = false");
    for (const copy of ["_om", "_ck", "_t0", "_t1"]) expect(j).toContain(`_mute(${copy})`);
    expect(j).toContain('"compRoom":"motion-edge"');
    // It works around the user's comp: no duplicate of the comp itself.
    expect(j).not.toMatch(/_comp\.duplicate\(\)/);
  });

  it("refuses a layer that already has a motion edge, or no Object Matte", () => {
    const j = build();
    expect(j).toMatch(/already has a layer/);
    expect(j).toMatch(/has no Object Matte/);
  });
});

describe("the keyer lookup", () => {
  const run = (effects: unknown) =>
    new Function("app", `${motionKeyerCheckJsx(KEYER)}\nreturn { ok: true, name: _keyerName };`)({
      effects,
    });

  it("finds the keyer among the installed effects", () => {
    expect(
      run([
        { displayName: "Levels", matchName: "ADBE Easy Levels2" },
        { displayName: "The Keyer", matchName: KEYER },
      ]),
    ).toEqual({ ok: true, name: "The Keyer" });
  });

  it("refuses clearly when no installed effect has that match name", () => {
    const r = run([{ displayName: "Levels", matchName: "ADBE Easy Levels2" }]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain(KEYER);
    expect(r.error).toMatch(/no installed effect/);
    expect(r.error).toMatch(/installed separately/);
  });

  it("refuses when the installed effects cannot be read", () => {
    const r = new Function("app", `${motionKeyerCheckJsx(KEYER)}\nreturn { ok: true };`)({
      get effects() {
        throw new Error("no");
      },
    });
    expect(r.ok).toBe(false);
  });

  it("comes before anything is built", () => {
    const j = build();
    expect(j.indexOf("app.effects")).toBeLessThan(j.indexOf(".duplicate()"));
  });
});

describe("the undo", () => {
  it("removes the precomp layer and the comps it made, and switches the original back as it was", () => {
    const j = motionEdgeUndoJsx({ comp: "Main", layer: "take" });
    expect(j).toContain('" motion edge"');
    expect(j).toContain("motion-edge");
    expect(j).toContain("itemByID");
    expect(j).toContain(".remove()");
    expect(j).toMatch(/_layer\.enabled = _was/);
  });
});

// ----------------------------------------------------- the run, with a fake

function fakeIO({ status = {} as Any, build = undefined as Any } = {}): MotionEdgeIO & {
  calls: Any[];
} {
  const calls: Any[] = [];
  return {
    calls,
    status: async () => {
      calls.push({ status: true });
      return {
        ok: true,
        layer: "take",
        objectMatte: { present: true },
        selections: [{ name: "Add Object 1", kind: "object", clickFrame: 0 }],
        summary: "1 object selected",
        ...status,
      } as Any;
    },
    execute: async (code: string, opts: Any) => {
      calls.push({ execute: opts.label, code });
      if (/undo/.test(opts.label))
        return { ok: true, removed: ["take motion edge"], restored: "take", enabled: true };
      return (
        build ?? {
          ok: true,
          motionLayer: "take motion edge",
          precomp: "take motion edge",
          keyer: { matchName: KEYER, name: "The Keyer" },
          comps: { objectMatte: "take object matte" },
          wasEnabled: true,
        }
      );
    },
  };
}

const ARGS = { comp: "Main", layer: "take", keyerMatchName: KEYER };

describe("subject.motion_edge", () => {
  it("builds and says what it built and what it costs", async () => {
    const io = fakeIO();
    const res = await runMotionEdge({ ...ARGS, keyerSettings: { "Despill Strength": 1 } }, io);
    expect(res.ok).toBe(true);
    expect(res.motionLayer).toBe("take motion edge");
    expect(res.settings.threshold).toEqual({ black: 0.25, white: 0.45 });
    expect(res.cost).toBe(MOTION_EDGE_COST);
    expect(res.cost).toMatch(/986 s/);
    expect(res.cost).toMatch(/twice/);
    expect(res.undo).toMatch(/undo: true/);
    const ex = io.calls.find((c: Any) => c.execute);
    expect(ex.code).toContain(JSON.stringify(KEYER));
    expect(ex.code).toMatch(/"Despill Strength":1/);
  });

  it("passes the keyer's refusal through", async () => {
    const io = fakeIO({
      build: { ok: false, error: `no installed effect has the match name '${KEYER}'` },
    });
    const res = await runMotionEdge(ARGS, io);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no installed effect/);
  });

  it("refuses before anything is clicked", async () => {
    const io = fakeIO({
      status: {
        selections: [],
        summary: "Object Matte is on the layer but has no selection yet: the user has not clicked",
      },
    });
    const res = await runMotionEdge(ARGS, io);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not clicked/);
    expect(io.calls.some((c: Any) => c.execute)).toBe(false);
  });

  it("refuses a layer that has a soft edge", async () => {
    const io = fakeIO({ status: { softEdge: { layer: "take soft edge" } } });
    const res = await runMotionEdge(ARGS, io);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("'take soft edge'");
    expect(res.error).toMatch(/already has a soft edge/);
    expect(res.error).toMatch(
      /undo it first with subject\.soften_edge \{ comp, layer, undo: true \}/,
    );
    expect(io.calls.some((c: Any) => c.execute)).toBe(false);
  });

  it("says the rest of the cut-out path now uses the motion-edge layer", async () => {
    const res = await runMotionEdge(ARGS, fakeIO());
    expect(res.next).not.toMatch(/do not use/);
    expect(res.next).toMatch(/subject\.check/);
    expect(res.next).toMatch(/subject\.render_cutout/);
    expect(res.next).toMatch(/subject\.use_cutout/);
    expect(getOp("subject.motion_edge")!.description).not.toMatch(/do not use its layer yet/);
  });

  it("undoes on request in one call, without a keyer", async () => {
    const io = fakeIO();
    const res = await runMotionEdge({ comp: "Main", layer: "take", undo: true }, io);
    expect(res.ok).toBe(true);
    expect(io.calls).toHaveLength(1);
    expect(io.calls[0].execute).toMatch(/undo/);
  });
});

describe("parameter validation", () => {
  const bad: Array<[string, Record<string, unknown>, RegExp]> = [
    ["no keyer", { comp: "Main", layer: 1 }, /keyerMatchName/],
    ["an empty keyer", { comp: "Main", layer: 1, keyerMatchName: " " }, /keyerMatchName/],
    ["settings not an object", { ...ARGS, keyerSettings: [1] }, /keyerSettings/],
    [
      "a setting that is not a number",
      { ...ARGS, keyerSettings: { Mode: "fast" } },
      /keyerSettings/,
    ],
    ["black over white", { ...ARGS, threshold: { black: 0.5, white: 0.4 } }, /threshold/],
    ["a threshold outside 0..1", { ...ARGS, threshold: { black: -0.1, white: 0.4 } }, /threshold/],
    ["a threshold that is not an object", { ...ARGS, threshold: 0.3 }, /threshold/],
    ["a negative grow", { ...ARGS, motionGrow: -1 }, /motionGrow/],
    ["a blur that is not a number", { ...ARGS, motionBlur: "15" }, /motionBlur/],
    ["a zero band", { ...ARGS, band: 0 }, /band/],
  ];
  for (const [what, args, msg] of bad)
    it(`refuses ${what}, before reaching After Effects`, async () => {
      const io = fakeIO();
      const res = await runMotionEdge(args, io);
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(msg);
      expect(io.calls).toEqual([]);
    });

  it("takes a partial threshold, booleans and arrays in the keyer's settings", () => {
    const s = motionEdgeSettings({
      ...ARGS,
      threshold: { white: 0.5 },
      keyerSettings: { "Despill Strength": 1, Invert: false, Colour: [0, 1, 0] },
    });
    expect(s.ok).toBe(true);
    expect((s as Any).settings.threshold).toEqual({ black: 0.25, white: 0.5 });
    expect((s as Any).settings.keyerSettings).toEqual({
      "Despill Strength": 1,
      Invert: 0,
      Colour: [0, 1, 0],
    });
  });

  it("checks the parameter types against the registered schema", () => {
    const op = getOp("subject.motion_edge")!;
    expect(validateOpArgs(op, { ...ARGS, keyerSettings: { "Despill Strength": 1 } }).ok).toBe(true);
    expect(validateOpArgs(op, { ...ARGS, keyerSettings: "Despill Strength" }).ok).toBe(false);
  });
});

describe("registration and docs", () => {
  it("is a subject operation that runs in Node, with its parameters", () => {
    const op = getOp("subject.motion_edge")!;
    expect(op).toBeDefined();
    expect(listOps("subject").map((o) => o.name)).toContain("subject.motion_edge");
    expect(op.run).toBeTypeOf("function");
    expect(op.toJsx({})).toMatch(/runs in Node/);
    expect(op.readOnly).toBeFalsy();
    expect(op.params.map((p) => p.name)).toEqual([
      "comp",
      "layer",
      "keyerMatchName",
      "keyerSettings",
      "threshold",
      "motionGrow",
      "motionBlur",
      "band",
      "undo",
    ]);
    expect(op.params.find((p) => p.name === "keyerMatchName")!.required).toBe(false);
    expect(op.description).toMatch(/machine-learning keyer effect installed separately/);
    expect(op.description).toMatch(/soften_edge/);
    expect(op.description).toMatch(/twice/);
  });

  // The release name guard: nothing that ships names a third-party tool or its maker.
  const THIRD_PARTY =
    /Boris|\bBCC\b|Continuum|Red Giant|Maxon|Primatte|Sapphire|Mocha|Video Copilot|Foundry|Nuke|Resolve|Runway|Kognat|Rotobot/i;
  const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
  const section = (text: string) =>
    text
      .split("\n")
      .filter((l) => l.includes("motion_edge"))
      .join("\n");

  it("names no third-party tool in its catalog text", () => {
    const op = getOp("subject.motion_edge")!;
    const text = [op.description, ...op.params.map((p) => p.description)].join("\n");
    expect(text).not.toMatch(THIRD_PARTY);
  });

  it("is documented for the model and the user, naming no third-party tool", () => {
    const keying = section(read("../../library/references/keying.md"));
    const skill = section(read("../../skills/motion-studio/SKILL.md"));
    for (const doc of [keying, skill]) {
      expect(doc).toMatch(/subject\.motion_edge/);
      expect(doc).toMatch(/installed separately/);
      expect(doc).not.toMatch(THIRD_PARTY);
    }
    expect(keying).toMatch(/soften_edge/);
    expect(keying).toMatch(/2 minutes/);
    expect(keying).toMatch(/confirmed only on English After Effects/);
  });
});
