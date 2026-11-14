// Offline tests for the pixel-headline style's builders (library/styles/pixel-headline/pixelheadline.jsx). The module runs in
// a vm context against a recording fake of the slice of After Effects it touches; nothing here can reach After Effects.
// What the fake assumes (only a live build confirms): property lookups by match name or display name, keys written with
// setValuesAtTimes and read back with nearestKeyIndex, text bounds roughly proportional to font size and letter count.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { describe, expect, it } from "vitest";

import { lintJsxFile } from "./helpers/lint-jsx.js";

const STYLES = new URL("../../library/styles/", import.meta.url);
const LIB = readFileSync(new URL("aes-lib.jsx", STYLES), "utf8");
const MOD_PATH = fileURLToPath(new URL("pixel-headline/pixelheadline.jsx", STYLES));
const MOD = readFileSync(MOD_PATH, "utf8");

type Key = { t: number; v: any };
class Prop {
  value: any = 0;
  expression = "";
  keys: Key[] = [];
  eases: Record<number, { inE: any[]; outE: any[] }> = {};
  interp: Record<number, [number, number]> = {};
  kids: Prop[] = [];
  propertyValueType = 1;
  constructor(public matchName: string, public name = matchName, public parentProp: Prop | null = null) {}
  get numProperties() { return this.kids.length; }
  get numKeys() { return this.keys.length; }
  property(n: any): any {
    if (typeof n === "number") { while (this.kids.length < n) this.kids.push(new Prop(`#${this.kids.length + 1}`, `#${this.kids.length + 1}`, this)); return this.kids[n - 1]; }
    return this.kids.find((k) => k.matchName === n || k.name === n) ?? this.addProperty(n);
  }
  addProperty(mn: string) { const p = new Prop(mn, mn, this); this.kids.push(p); return p; }
  setValue(v: any) { this.value = v; }
  setValuesAtTimes(ts: number[], vs: any[]) { ts.forEach((t, i) => this.setValueAtTime(t, vs[i])); }
  setValueAtTime(t: number, v: any) { const k = this.keys.find((x) => Math.abs(x.t - t) < 1e-9); if (k) k.v = v; else this.keys.push({ t, v }); this.keys.sort((a, b) => a.t - b.t); }
  nearestKeyIndex(t: number) { let best = 0; this.keys.forEach((k, i) => { if (Math.abs(k.t - t) < Math.abs(this.keys[best].t - t)) best = i; }); return best + 1; }
  keyTime(i: number) { return this.keys[i - 1].t; }
  valueAtTime(t: number) { if (!this.keys.length) return this.value; let v = this.keys[0].v; for (const k of this.keys) if (k.t <= t + 1e-9) v = k.v; return v; }
  keyValue(i: number) { return this.keys[i - 1].v; }
  removeKey(i: number) { const k = this.keys.splice(i - 1, 1)[0]; if (k) { delete this.eases[k.t]; delete this.interp[k.t]; } }
  setInterpolationTypeAtKey(i: number, a: number, b: number) { this.interp[this.keys[i - 1].t] = [a, b]; }
  setTemporalEaseAtKey(i: number, a: any[], b: any[]) { this.eases[this.keys[i - 1].t] = { inE: a, outE: b }; }
  keyInTemporalEase(i: number) { return this.eases[this.keys[i - 1].t]?.inE; }
  keyOutTemporalEase(i: number) { return this.eases[this.keys[i - 1].t]?.outE; }
}

function makeAE(opts: { deepGlow: boolean; workingSpace?: string }) {
  const comps: any[] = [];
  let layerId = 0;
  function makeLayer(comp: any, kind: string, name: string): any {
    const root = new Prop("root");
    const tg = root.property("ADBE Transform Group");
    const L: any = {
      id: ++layerId, kind, name, comp, parent: null, inPoint: 0, outPoint: 1e9, startTime: 0, motionBlur: false, adjustmentLayer: false, enabled: true,
      hasAudio: kind === "footage" || kind === "precomp", audioEnabled: true, matte: null as any, matteType: null as any,
      property: (n: any) => root.property(n),
      position: Object.assign(tg.property("ADBE Position"), { propertyValueType: 6413 }),
      anchorPoint: tg.property("ADBE Anchor Point"), scale: tg.property("ADBE Scale"), opacity: tg.property("ADBE Opacity"),
      sourceRectAtTime() {
        const td = root.property("ADBE Text Properties").property("ADBE Text Document").value;
        const s = td.fontSize, n = Math.max(...String(td.text).split("\r").map((l: string) => l.length)), desc = /[gjpqy]/.test(td.text);
        return { left: -0.29 * s * n, top: -0.73 * s, width: 0.58 * s * n, height: 0.73 * s + (desc ? 0.24 * s : 0) };
      },
      duplicate() { const C = makeLayer(comp, kind, name + " copy"); C.inPoint = L.inPoint; C.scale.keys = L.scale.keys.map((k: Key) => ({ ...k })); comp._layers.unshift(C); return C; },
      moveAfter(o: any) { const a = comp._layers; a.splice(a.indexOf(L), 1); a.splice(a.indexOf(o) + 1, 0, L); },
      moveBefore(o: any) { const a = comp._layers; a.splice(a.indexOf(L), 1); a.splice(a.indexOf(o), 0, L); },
      setTrackMatte(m: any, t: any) { L.matte = m; L.matteType = t; },
      timeRemapEnabled: false, blendingMode: 0, collapseTransformation: false, containingComp: comp,
      remove() { const a = comp._layers; a.splice(a.indexOf(L), 1); L.removed = true; },
      moveToBeginning() { const a = comp._layers; a.splice(a.indexOf(L), 1); a.unshift(L); },
    };
    // parenting is recorded with the parent's scale at that moment (After Effects bakes the parent's transform into the child)
    let parent: any = null;
    Object.defineProperty(L, "parent", { get: () => parent, set: (v: any) => { if (parent && !v) L.unparentedAt = { scale: parent.scale.value, keys: parent.scale.keys.length, expr: parent.position.expression }; parent = v; } });
    L.scale.value = [100, 100, 100]; L.scale.propertyValueType = 6414;
    root.property("ADBE Text Properties").property("ADBE Text Document").value = { text: "", fontSize: 10 };
    root.kids.find((k) => k.matchName === "ADBE Text Properties")!.addProperty("ADBE Text Animators");
    // "Source Text" is the text document
    root.kids.push(Object.assign(root.property("ADBE Text Properties").property("ADBE Text Document"), { name: "Source Text" }));
    return L;
  }
  function makeComp(name: string, w: number, h: number, dur: number, fps: number) {
    const comp: any = {
      name, width: w, height: h, duration: dur, frameRate: fps, frameDuration: 1 / fps, motionBlur: false, _layers: [] as any[],
      get numLayers() { return comp._layers.length; },
      layer(i: any) { return typeof i === "number" ? comp._layers[i - 1] : comp._layers.find((l: any) => l.name === i); },
      layers: {
        addText(str: string) { const L = makeLayer(comp, "text", str); L.property("Source Text").value = { text: str, fontSize: 10 }; comp._layers.unshift(L); return L; },
        addShape() { const L = makeLayer(comp, "shape", "Shape Layer"); comp._layers.unshift(L); return L; },
        addSolid(c: any, n: string) { const L = makeLayer(comp, "solid", n); L.color = c; comp._layers.unshift(L); return L; },
        addNull() { const L = makeLayer(comp, "null", "Null"); comp._layers.unshift(L); return L; },
        add(item: any) { const L = makeLayer(comp, item.isComp ? "precomp" : "footage", item.name); L.source = item; comp._layers.unshift(L); return L; },
      },
      isComp: true,
    };
    comps.push(comp);
    return comp;
  }
  const app = {
    effects: opts.deepGlow ? [{ matchName: "ADBE Glo2" }, { matchName: "PEDG2" }] : [{ matchName: "ADBE Glo2" }],
    fonts: { getFontsByFamilyNameAndStyleName: (f: string, s: string) => (f === "Inter" && s === "Bold" ? [{ postScriptName: "Inter-Bold" }] : []) },
    project: { workingSpace: opts.workingSpace ?? "", bitsPerChannel: 8, items: { addComp: (n: string, w: number, h: number, _p: number, d: number, f: number) => makeComp(n, w, h, d, f) } },
  };
  function KeyframeEase(this: any, speed: number, influence: number) { this.speed = speed; this.influence = influence; }
  function Shape(this: any) { this.vertices = []; this.inTangents = []; this.outTangents = []; this.closed = true; }
  const ctx = vm.createContext({
    app, KeyframeEase, Shape, Math,
    KeyframeInterpolationType: { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 },
    PropertyValueType: { TwoD_SPATIAL: 6413, ThreeD_SPATIAL: 6412, TwoD: 6416, ThreeD: 6414, OneD: 6417 },
    TrackMatteType: { ALPHA: 1, ALPHA_INVERTED: 2, LUMA: 3 },
    BlendingMode: { NORMAL: 1, ADD: 2, COLOR: 3, SOFT_LIGHT: 4, STENCIL_ALPHA: 5, SILHOUETE_ALPHA: 6 },   // After Effects' own spelling
    ParagraphJustification: { LEFT_JUSTIFY: 1, CENTER_JUSTIFY: 2, RIGHT_JUSTIFY: 3 },
  });
  vm.runInContext(LIB, ctx);
  vm.runInContext(MOD, ctx);
  const comp = makeComp("Beat", 1080, 1920, 4.5, 30);
  return { PH: (ctx as any).AESPixelHeadline, comp, comps, makeComp };
}

const F = (n: number) => n / 30;
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
const footage = (name: string, width = 1080, height = 1920, duration = 20) => ({ name, width, height, duration, isComp: false });
const words = (w: number): Array<{ text: string; t: number }> => ([["How", w - F(30)], ["to", w - F(26)], ["make", w - F(21)], ["the", w - F(16)], ["best", w - F(12)], ["shots", w], ["in", w + F(20.75)], ["thirty", w + F(27.2)], ["seconds", w + F(33.6)]] as Array<[string, number]>)
  .map(([text, t]) => ({ text, t }));
function referenceBrief(clipsN = 3, extra: any = {}) {
  return { type: "opener", take: footage("take"), takeStart: 5.1, speakerScale: 90, face: { x0: 391, y0: 871, x1: 689, y1: 1272 }, pivotY: 1070,
    words: words(1.6), stressed: 5, clips: Array.from({ length: clipsN }, (_, i) => ({ item: footage(`clip${i}`), start: 1 })), side: "left",
    accent: [1, 0, 0], ground: [0.8, 0.8, 0.81], grade: { mixer: [90, 105, 84], inBlack: 0.03, inWhite: 0.52, gamma: 1.85, saturation: 30 }, seed: 7, ...extra };
}

describe("pixel-headline module", () => {
  it("is ES3 and loads without touching After Effects", () => {
    expect(lintJsxFile(MOD_PATH).filter((f) => f.severity === "error")).toEqual([]);
    vm.runInNewContext(LIB + "\n" + MOD, { get app() { throw new Error("load touched app"); } });
  });

  it("the giant word: sized by letter height, keyed on the word signature from W, nothing before W", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const r = PH.heroWord(comp, { text: "shots", at: 1.6, colour: [1, 0, 0] });
    const L = r.layer;
    expect(L.property("Source Text").value.fontSize).toBeCloseTo(0.284 * 1080, 6);
    expect(L.inPoint).toBe(1.6);
    expect(L.position.value).toEqual([540, 1920 * 0.275 - 18]);
    const keys = L.scale.keys;
    expect(keys.map((k: Key) => k.t)).toEqual(PH.SIG.word.map((q: number[]) => 1.6 + F(q[0])));
    expect(keys.map((k: Key) => k.v[0])).toEqual(PH.SIG.word.map((q: number[]) => q[1] * 100));
    const first = L.scale.eases[keys[0].t];
    expect(first.outE[0].influence).toBeCloseTo(7.32, 6);
    expect(first.outE[0].speed).toBeCloseTo(0.1005 * 100 * 30, 6);
    expect(L.scale.eases[keys[1].t].inE[0].influence).toBeCloseTo(89.47, 6);
  });

  it("the glow: Deep Glow's exposure 0, 0.64 at W, 0 at W + 24.26 when installed; the stock pair otherwise", () => {
    const deep = makeAE({ deepGlow: true });
    const r = deep.PH.heroWord(deep.comp, { text: "shots", at: 1.6 });
    expect(r.glow).toBe("deep");
    const fx = r.layer.property("ADBE Effect Parade").kids[0];
    expect(fx.matchName).toBe("PEDG2");
    const x = fx.property(25);
    expect(x.keys.map((k: Key) => [k.t, k.v])).toEqual([[1.6 - F(2), 0], [1.6, 0.64], [1.6 + F(24.26), 0]]);
    expect(x.eases[1.6 + F(24.26)].inE[0].influence).toBe(5);
    const stock = makeAE({ deepGlow: false });
    const s = stock.PH.heroWord(stock.comp, { text: "shots", at: 1.6 });
    expect(s.glow).toBe("stock");
    expect(s.glowLayer.name).toBe("PH Word glow");
    expect(s.glowLayer.property("ADBE Effect Parade").kids.map((k: Prop) => k.matchName)).toEqual(["ADBE Glo2", "ADBE Glo2"]);
    const op = s.glowLayer.opacity.keys;
    expect(op[0].t).toBeCloseTo(1.6 - F(1), 9);
    expect(op.at(-1)).toEqual({ t: 1.6 + F(23), v: 0 });
    // the copy sits directly under the word
    expect(stock.comp._layers.indexOf(s.glowLayer)).toBe(stock.comp._layers.indexOf(s.layer) + 1);
  });

  it("the lead-in: a native reveal, words 4.75 frames apart, falling 136 px on the Strength keys", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const L = PH.leadIn(comp, { text: "How to make the best", at: 0.6 });
    const fx = L.property("ADBE Effect Parade");
    expect(fx.property("Reveal Delay").property(1).value).toBe(4.75);
    const st = fx.property("Reveal Strength").property(1);
    expect(st.keys.map((k: Key) => [k.t, k.v])).toEqual([[0.6 + F(-1.865), 100], [0.6 + F(26.119), 0]]);
    expect(st.eases[st.keys[0].t].outE[0].speed).toBeCloseTo(-2.322 * 30, 6);
    expect(st.eases[st.keys[1].t].inE[0].influence).toBeCloseTo(82.3, 6);
    const an = L.property("ADBE Text Properties").property("ADBE Text Animators").property("PH Reveal");
    const sel = an.property("ADBE Text Selectors").property("PH Words");
    expect(sel.property("ADBE Text Range Type2").value).toBe(3);
    const amount = sel.property("ADBE Text Expressible Amount").expression;
    expect(amount).toMatch(/textIndex - 1/); expect(amount).toMatch(/Reveal Delay/); expect(amount).toMatch(/Reveal Strength/);
    expect(amount).toMatch(/textTotal - textIndex/);   // the exit runs from the last word
    expect(fx.property("Reveal Exit").property(1).value).toBe(-1);
    expect(sel.property("ADBE Text Expressible Amount").expression).not.toMatch(/Pseudo\//);
    const props = an.property("ADBE Text Animator Properties");
    expect(props.property("ADBE Text Position 3D").value).toEqual([0, -136, 0]);
    expect(props.property("ADBE Text Opacity").value).toBe(0);
    expect(props.kids.map((k: Prop) => k.matchName)).not.toContain("ADBE Text Blur");
    expect(L.position.value).toEqual([540, 1920 * 0.147]);
  });

  it("the tail: 6.4 frames apart, sliding 154 px with blur 10, moved under a descender", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const plain = PH.tail(comp, { text: "in thirty seconds", at: 2.29 });
    const props = plain.property("ADBE Text Properties").property("ADBE Text Animators").property("PH Reveal").property("ADBE Text Animator Properties");
    expect(props.property("ADBE Text Position 3D").value).toEqual([-154, 0, 0]);
    expect(props.property("ADBE Text Blur").value).toEqual([10, 10]);
    expect(plain.property("ADBE Effect Parade").property("Reveal Delay").property(1).value).toBe(6.4);
    const y0 = plain.position.value[1];
    const word = PH.heroWord(comp, { text: "story", at: 1.6 }).layer;
    const under = PH.tail(comp, { text: "in thirty seconds", at: 2.29, under: word });
    expect(under.position.value[1]).toBeGreaterThan(y0);
  });

  it("the block schedule: deterministic, the signature counts per frame, outward, off the lead-in until W + 6", () => {
    const { PH } = makeAE({ deepGlow: true });
    const o = { box: { x0: 130, x1: 950, y0: 305, y1: 531 }, width: 1080, height: 1920, seed: 7, cell: 39, lineBand: [232, 290] };
    const a = PH.blockSchedule(o), b = PH.blockSchedule(o);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const B = PH.SIG.blocks;
    for (let f = 0; f < B.count.length; f++) {
      const on = a.filter((x: any) => x.opacity >= 70 && x.on <= f && f < x.off).length;
      expect(on, `frame ${f}`).toBe(B.count[f]);
    }
    for (const x of a) {
      expect(x.x % 39).toBe(0); expect(x.y % 39).toBe(0); expect(x.y + 39).toBeLessThanOrEqual(1920 * 0.45 + 39);
      if (x.on < 6) expect(x.y + 39 <= 232 || x.y >= 290, `block at ${x.y} on the lead-in before W + 6`).toBe(true);
    }
    const mean = (f0: number, f1: number) => { const s = a.filter((x: any) => x.opacity >= 70 && x.on >= f0 && x.on <= f1); return s.reduce((t: number, x: any) => t + x.d, 0) / s.length; };
    expect(mean(9, 13)).toBeGreaterThan(mean(4, 7) + 0.5);
    const weak = a.filter((x: any) => x.opacity < 70);
    expect(weak.length).toBeGreaterThan(0);
    for (const x of weak) { expect(x.opacity).toBeGreaterThanOrEqual(25); expect(x.opacity).toBeLessThanOrEqual(50); }
  });

  it("the pixel blocks: one shape layer of squares with Hold opacity keys, from W", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const word = PH.heroWord(comp, { text: "shots", at: 1.6 });
    const r = PH.pixelBlocks(comp, { word, at: 1.6, colour: [1, 0, 0], seed: 7 });
    const root = r.layer.property("ADBE Root Vectors Group");
    expect(root.numProperties).toBe(r.blocks.length);
    const g = root.property(1), op = g.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity");
    expect(op.keys.map((k: Key) => k.t)).toEqual([0, 1.6 + F(r.blocks[0].on), 1.6 + F(r.blocks[0].off)]);
    expect((Object.values(op.interp) as Array<[number, number]>).every(([a, b]) => a === 6614 && b === 6614)).toBe(true);
  });

  it("cards: three in the reference's size, the card pop from each first frame, 4 frames apart from W + 8", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const st = PH.cardStack(comp, { clips: [0, 1, 2].map((i) => ({ item: footage(`c${i}`), start: 1 })), at: 1.6, side: "left" });
    expect(st.layout.cardScale).toBeCloseTo(100 * (0.278 * 1080 / 1.06) / 790, 6);
    expect(st.first).toEqual([1.6 + F(8), 1.6 + F(12), 1.6 + F(16)]);
    const c1 = st.layers[0];
    expect(c1.audioEnabled).toBe(false);
    expect(c1.scale.keys.map((k: Key) => k.t)).toEqual(PH.SIG.card.map((q: number[]) => st.first[0] + F(q[0])));
    expect(c1.scale.keys[1].v[0]).toBeCloseTo(1.0776 * st.layout.cardScale, 6);
    const pre = c1.source;
    expect(pre._layers.map((l: any) => l.name)).toEqual(["Clip", "Inner", "Rim", "Outer"]);
    expect(pre.layer("Outer").scale.value[0]).toBe(106);
    expect(pre.layer("Rim").adjustmentLayer).toBe(true);
    expect(pre.layer("Rim").matte.name).toBe("Outer");
    expect(pre.layer("Clip").matte.name).toBe("Inner");
    const blur = pre.layer("Clip").property("ADBE Effect Parade").kids[0].property("Blurriness");
    expect(blur.keys.map((k: Key) => [k.t, k.v])).toEqual([[st.first[0] - F(2), 70], [st.first[0] + F(7), 70], [st.first[0] + F(12), 0]]);
  });

  it("cards for any count: smaller with more cards, kept off the face, a warning when they cannot be", () => {
    const { PH } = makeAE({ deepGlow: true });
    const three = PH.stackLayout({ n: 3, side: "left", width: 1080, height: 1920 });
    const four = PH.stackLayout({ n: 4, side: "left", width: 1080, height: 1920 });
    expect(four.h / three.h).toBeCloseTo((1 + 0.65 * 2) / (1 + 0.65 * 3), 9);
    expect(four.pos[1][1] - four.pos[0][1]).toBeCloseTo(four.h * 0.65, 9);
    const right = PH.stackLayout({ n: 3, side: "right", width: 1080, height: 1920 });
    expect(right.pos[0][0]).toBeCloseTo(1080 - three.pos[0][0], 9);
    // a face that the reference's step toward the speaker would reach
    const face = { x0: 391, y0: 871, x1: 689, y1: 1272 };
    const safe = PH.stackLayout({ n: 3, side: "left", width: 1080, height: 1920, face });
    expect(safe.warnings).toEqual([]);
    for (const p of safe.pos) expect(p[0] + (safe.w * 1.0776) / 2).toBeLessThanOrEqual(face.x0);
    for (const p of safe.pos) expect(p[0] - safe.w / 2).toBeGreaterThanOrEqual(0);
    const blocked = PH.stackLayout({ n: 3, side: "left", width: 1080, height: 1920, face: { x0: 0, y0: 0, x1: 1080, y1: 1920 } });
    expect(blocked.warnings.length).toBe(1);
  });

  it("the drawn line: linear trims from W + 7.5 to W + 18 and W + 15 to W + 22, longer with more cards", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const lay = PH.stackLayout({ n: 3, side: "left", width: 1080, height: 1920 });
    const L = PH.drawnLine(comp, { at: 1.6, path: PH.linePath(comp, lay, "left"), colour: [1, 0, 0], cards: 3 });
    const trim = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    expect(trim.property("ADBE Vector Trim End").keys.map((k: Key) => k.t)).toEqual([1.6 + F(7.5), 1.6 + F(18)]);
    expect(trim.property("ADBE Vector Trim Start").keys.map((k: Key) => k.t)).toEqual([1.6 + F(15), 1.6 + F(22)]);
    expect((Object.values(trim.property("ADBE Vector Trim End").interp) as Array<[number, number]>).every(([a]) => a === 6612)).toBe(true);
    const L4 = PH.drawnLine(comp, { at: 1.6, path: PH.linePath(comp, lay, "left"), cards: 4 });
    const t4 = L4.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    expect(t4.property("ADBE Vector Trim End").keys[1].t).toBeCloseTo(1.6 + F(22), 9);
  });

  it("the push: 171.5 % to 100 % over 42 frames about the face; the speaker's sway divided out only past 3 %", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const a = PH.push(comp, { at: 0, pivotY: 1070, layers: [] });
    expect(a.layer.scale.keys.map((k: Key) => [k.t, k.v[0]])).toEqual([[0, PH.SIG.push[0][1] * 100], [F(42), 100]]);
    expect(a.layer.position.expression).toMatch(/1070 \+ \(960 - 1070\) \* s/);
    expect(a.divided).toBe(false);
    const small = PH.push(comp, { at: 0, layers: [], sway: [{ f: 0, r: 1.02 }, { f: 40, r: 1 }] });
    expect(small.divided).toBe(false);
    const big = PH.push(comp, { at: 0, layers: [], sway: [{ f: 0, r: 1.15 }, { f: 40, r: 1 }] });
    expect(big.divided).toBe(true);
    expect(big.layer.scale.expression).toMatch(/Speaker sway/);
  });

  it("a whole beat from a brief: the layer order, what it reports, and nothing outside the brief", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const rep = PH.beat(comp, referenceBrief());
    expect(comp._layers.map((l: any) => l.name)).toEqual(["PH Camera", "PH Tail", "PH Word", "PH Pixels", "PH Lead-in", "PH Line", "PH Card 3", "PH Card 2", "PH Card 1", "PH Speaker", "PH Ground"]);
    expect(rep.W).toBe(1.6);
    expect(rep.glow).toBe("deep");
    expect(rep.warnings).toEqual([]);
    expect(rep.cards).toEqual([1.6 + F(8), 1.6 + F(12), 1.6 + F(16)]);
    expect(rep.pushAt).toBeCloseTo(words(1.6)[0].t - F(18), 9);
    expect(comp.layer("PH Speaker").parent.name).toBe("PH Camera");
    expect(comp.layer("PH Ground").parent).toBe(null);
    expect(comp.motionBlur).toBe(true);
    expect(comp._layers.filter((l: any) => l.kind !== "null" && !l.motionBlur).map((l: any) => l.name)).toEqual([]);
  });

  it("a punch beat: the word, its glow and the blocks only", () => {
    const { PH, comp } = makeAE({ deepGlow: false });
    const rep = PH.beat(comp, referenceBrief(3, { type: "punch" }));
    expect(comp._layers.map((l: any) => l.name)).toEqual(["PH Word", "PH Word glow", "PH Pixels", "PH Speaker", "PH Ground"]);
    expect(rep.glow).toBe("stock");
    expect(rep.cards).toBeUndefined();
  });

  it("four cards on the right, another word and colour: inputs only", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const rep = PH.beat(comp, referenceBrief(4, { side: "right", accent: [0.1, 0.4, 1], words: words(1.6).map((w, i) => (i === 5 ? { ...w, text: "edits" } : w)) }));
    expect(rep.cards).toEqual([1.6 + F(8), 1.6 + F(12), 1.6 + F(16), 1.6 + F(20)]);
    expect(rep.cardPos.every((p: number[]) => p[0] > 540)).toBe(true);
    expect(comp.layer("PH Word").property("Source Text").value.text).toBe("edits");
  });

  it("a lead-in past 24 characters wraps to two lines that stack upward; a tail stacks downward", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    expect(PH.wrap("How to make the best", 24)).toEqual(["How to make the best"]);
    expect(PH.wrap("Three websites that changed how I edit", 24)).toEqual(["Three websites that", "changed how I edit"]);
    const L = PH.leadIn(comp, { text: "Three websites that changed how I edit", at: 1 });
    expect(L.property("Source Text").value.text).toBe("Three websites that\rchanged how I edit");
    expect(L.position.value[1]).toBeCloseTo(1920 * 0.147 - 64 * 1.2, 9);
    const T = PH.tail(comp, { text: "and the one I use every single day", at: 2 });
    expect(T.position.value[1]).toBeCloseTo(1920 * 0.318, 9);
    expect(T.property("Source Text").value.text.split("\r").length).toBe(2);
  });

  it("exitBeat clears a beat in reverse within 10 frames: words from the last, the word, cards from the last", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    PH.beat(comp, referenceBrief());
    const at = 4.0, r = PH.exitBeat(comp, { at });
    expect(r.end).toBeLessThanOrEqual(at + F(10) + 1e-9);
    const lead = comp.layer("PH Lead-in"), fx = lead.property("ADBE Effect Parade");
    expect(fx.property("Reveal Exit").property(1).value).toBe(at);
    const st = fx.property("Reveal Strength").property(1).keys;
    expect(st.at(-2)).toEqual({ t: at, v: 0 }); expect(st.at(-1).t).toBeCloseTo(at + F(6), 9); expect(st.at(-1).v).toBe(100);
    const w = comp.layer("PH Word").scale.keys;
    expect(w.at(-1).v[0]).toBe(0); expect(w.at(-1).t).toBeCloseTo(at + F(7), 9);
    const c3 = comp.layer("PH Card 3").scale.keys, c1 = comp.layer("PH Card 1").scale.keys;
    expect(c3.at(-2).t).toBeCloseTo(at, 9); expect(c1.at(-2).t).toBeCloseTo(at + F(4), 9);
    expect(comp.layer("PH Card 1").outPoint).toBeCloseTo(at + F(10), 9);
    expect(r.layers).toContain("PH Tail");
  });

  it("a long line still leaves within 10 frames: the exit's word delay shrinks", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const L = PH.leadIn(comp, { text: "when in reality all you need is", at: 1 });
    const end = PH.exitText(L, 3);
    expect(end).toBeCloseTo(3 + F(10), 9);
    expect(L.property("ADBE Effect Parade").property("Reveal Exit Delay").property(1).value).toBeCloseTo(4 / 6, 9);
  });

  it("the footage as the ground: no ground solid, the take covering the frame, pushed with the scene", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const rep = PH.beat(comp, referenceBrief(0, { footageGround: true, take: { name: "room", width: 1920, height: 1080, isComp: false } }));
    expect(comp.layer("PH Ground")).toBeUndefined();
    const S = comp.layer("PH Speaker");
    expect(S.scale.value[0]).toBeCloseTo(100 * Math.max(1080 / 1920, 1920 / 1080), 9);
    expect(S.position.value).toEqual([540, 960]);
    expect(S.parent.name).toBe("PH Camera");
    expect(rep.glow).toBe("deep");
  });

  it("the zoom-out inset: scaled down, a feathered mask, a ground solid sampled from the footage", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const st = PH.stage(comp, { take: { name: "room", width: 1920, height: 1080, isComp: false }, footageGround: true });
    const r = PH.zoomOut(comp, { speaker: st.speaker, scale: 60, position: [540, 1400], feather: 60, ground: "sample" });
    expect(st.speaker.scale.value).toEqual([60, 60]);
    expect(st.speaker.position.value).toEqual([540, 1400]);
    const mk = st.speaker.property("ADBE Mask Parade").property("Inset edge");
    expect(mk.property("ADBE Mask Feather").value).toEqual([100, 100]);
    const r2 = PH.zoomOut(comp, { speaker: PH.stage(comp, { take: { name: "room2", width: 1920, height: 1080, isComp: false }, footageGround: true, prefix: "PH Z " }).speaker, scale: 60, position: [540, 1400], trimTop: 0.07, ground: [0, 0, 0], prefix: "PH Z " });
    expect(r2.speaker.property("ADBE Mask Parade").property("Inset edge").property("ADBE Mask Shape").value.vertices[0]).toEqual([0, 0.07 * 1080]);
    expect(r.ground.name).toBe("PH Inset ground");
    expect(comp._layers.indexOf(r.ground)).toBe(comp._layers.indexOf(st.speaker) + 1);
    expect(r.ground.property("ADBE Effect Parade").kids[0].property("Color").expression).toMatch(/sampleImage/);
    const back = PH.exitInset(comp, { speaker: st.speaker, at: 5 });
    expect(back).toBeCloseTo(5 + F(42), 9);   // back on the push's curve
  });

  it("a landscape card: the rim and corners scale by its shorter side, its width set on screen", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const L = PH.card(comp, { clip: footage("site"), at: 2, pos: [540, 700], size: [1280, 800], width: 0.88 * 1080, name: "PH Site" });
    const pre = L.source;
    const outer = pre.layer("Outer").property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Shape - Rect");
    const inner = pre.layer("Inner").property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Shape - Rect");
    expect(inner.property("ADBE Vector Rect Size").value).toEqual([1280, 800]);
    expect(outer.property("ADBE Vector Rect Size").value).toEqual([1280 + 48, 800 + 48]);
    expect(inner.property("ADBE Vector Rect Roundness").value).toBeCloseTo(0.076 * 800, 9);
    expect(L.scale.keys.at(-1).v[0]).toBeCloseTo(100 * 0.88 * 1080 / 1328, 9);
    expect(L.scale.keys.map((k: Key) => k.t)).toEqual(PH.SIG.card.map((q: number[]) => 2 + F(q[0])));
  });

  it("several beats share one camera and one speaker; the second push holds full frame until it starts", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const r1 = PH.beat(comp, referenceBrief(0, { prefix: "PH B1 " }));
    const r2 = PH.beat(comp, { ...referenceBrief(0, { prefix: "PH B2 " }), words: words(6.6), speaker: r1.speaker, groundLayer: r1.ground, camera: r1.camera });
    expect(comp._layers.filter((l: any) => l.kind === "null").length).toBe(1);
    expect(comp._layers.filter((l: any) => /Speaker$/.test(l.name)).length).toBe(1);
    const keys = r1.camera.scale.keys;
    const p2 = r2.pushAt;
    const hold = keys.find((k: Key) => Math.abs(k.t - (p2 - F(1))) < 1e-9);
    expect(hold.v[0]).toBe(100);
    expect(keys.find((k: Key) => Math.abs(k.t - p2) < 1e-9).v[0]).toBeCloseTo(PH.SIG.push[0][1] * 100, 9);
    expect(comp.layer("PH B2 Word").parent).toBe(r1.camera);
  });

  it("a shrunk word keeps its tallest letters where an unshrunk word's are; baseline overrides", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const full = PH.heroWord(comp, { text: "shots", at: 1 });
    const long = PH.heroWord(comp, { text: "transformation", at: 1, prefix: "PH L " });
    expect(long.size).toBeLessThan(full.size);
    expect(long.box.y0).toBeCloseTo(full.box.y0, 6);
    expect(long.box.x1 - long.box.x0).toBeCloseTo(0.85 * 1080, 6);
    const set = PH.heroWord(comp, { text: "shots", at: 1, baseline: 383, prefix: "PH S " });
    expect(set.layer.position.value[1]).toBeCloseTo(383 - 18, 9);
    const T = PH.tail(comp, { text: "three names", at: 2, baseline: 1500, prefix: "PH S " });
    expect(T.position.value[1]).toBe(1500);
  });

  it("a two-line lead-in's second line starts when it is spoken", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const L = PH.leadIn(comp, { text: "Three websites that changed how I edit", at: [1, 2.5] });
    const fx = L.property("ADBE Effect Parade");
    expect(fx.property("Reveal Line 2").property(1).value).toBeCloseTo(2.5 - 1 - 3 * 4.75 / 30, 9);
    const amount = L.property("ADBE Text Properties").property("ADBE Text Animators").property("PH Reveal").property("ADBE Text Selectors").property("PH Words").property("ADBE Text Expressible Amount").expression;
    expect(amount).toMatch(/textIndex > 3/);
    expect(fx.property("Reveal Strength").property(1).keys[0].t).toBeCloseTo(1 + F(-1.865), 9);
    // a beat takes the second line's time from its first word
    const { PH: PH2, comp: c2 } = makeAE({ deepGlow: true });
    const ws = [["Three", 0.2], ["websites", 0.4], ["that", 0.6], ["changed", 0.8], ["how", 1.2], ["I", 1.3], ["edit", 1.4], ["everything", 2.2]].map(([text, t]) => ({ text, t }));
    PH2.beat(c2, { ...referenceBrief(0), words: ws, stressed: 7 });
    expect(c2.layer("PH Lead-in").property("ADBE Effect Parade").property("Reveal Line 2").property(1).value).toBeCloseTo(0.8 - 0.2 - 3 * 4.75 / 30, 9);   // line 2 starts at "changed"
  });

  it("a lead-in wider than 85 % of the frame shrinks to fit", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const L = PH.leadIn(comp, { text: "WWWWWWWWWWWWWWWWWWWWWWWWW", at: 1, maxChars: 30 });
    const td = L.property("Source Text").value;
    expect(0.58 * td.fontSize * 25).toBeCloseTo(0.85 * 1080, 6);
  });

  it("moveCard: a landed card moves on the push's curve to a place on screen, no overshoot", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const C = PH.card(comp, { clip: footage("site"), at: 1, pos: [540, 700], size: [1280, 800], width: 950, name: "PH Site" });
    const end = PH.moveCard(comp, { layer: C, at: 3, pos: [300, 1300], scale: 30, dur: 0.6 });
    expect(end).toBeCloseTo(3.6, 9);
    expect(C.position.keys.map((k: Key) => [k.t, k.v])).toEqual([[3, [540, 700]], [3.6, [300, 1300]]]);
    const last = C.scale.keys.at(-1)!; expect(last.t).toBeCloseTo(3.6, 9); expect(last.v.slice(0, 2)).toEqual([30, 30]);   // z is left as it was
    const e = C.scale.eases[3].outE[0];
    expect(e.influence).toBeCloseTo(2, 9);
    expect(C.scale.eases[3.6].inE[0].influence).toBeCloseTo(38.48, 6);
  });

  it("every card covers its clip: an upright 860 x 1204 clip fills the upright card", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const C = PH.card(comp, { clip: { name: "up", width: 860, height: 1204, isComp: false }, at: 1, pos: [300, 700], scale: 35.85, name: "PH Up" });
    const cs = C.source.layer("Clip").scale.value[0];
    expect(860 * cs / 100).toBeGreaterThanOrEqual(790);
    expect(1204 * cs / 100).toBeGreaterThanOrEqual(1100);
    const ref = PH.card(comp, { clip: footage("ref"), at: 1, pos: [300, 700], scale: 35.85, name: "PH Ref" });
    expect(ref.source.layer("Clip").scale.value[0]).toBeCloseTo(104 * 790 / 1080, 6);
    expect(C.collapseTransformation).toBe(true);   // the rim frosts what is behind the card only when it collapses into the main comp

  });

  // ---- what the first full piece taught (STYLE.md: the director's sections)
  const fx = (L: any, mn: string) => L.property("ADBE Effect Parade").kids.find((k: any) => k.matchName === mn || k.name === mn);
  const val = (L: any, mn: string, prop: string) => fx(L, mn).property(prop).value;

  it("the clean ground: light is the reference's radial ramp; dark is a ramp top to bottom with a soft added lift, both with noise", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const g = PH.ground(comp, {});
    expect(g.tone).toBe("light"); expect(g.lift).toBe(null);
    expect(val(g.layer, "ADBE Ramp", "Start Color").map((x: number) => +x.toFixed(6))).toEqual([0.84, 0.84, 0.85]);
    expect(val(g.layer, "ADBE Ramp", "Ramp Shape")).toBe(2);
    const { PH: P2, comp: c2 } = makeAE({ deepGlow: true });
    const n = [0.08, 0.13, 0.24], d = P2.ground(c2, { tone: "dark", colour: n });
    expect(val(d.layer, "ADBE Ramp", "Start Color").map((x: number) => +x.toFixed(4))).toEqual([0.064, 0.104, 0.192]);
    expect(val(d.layer, "ADBE Ramp", "End Color").map((x: number) => +x.toFixed(4))).toEqual([0.0336, 0.0546, 0.1008]);
    expect(val(d.layer, "ADBE Ramp", "Ramp Shape")).toBe(1);
    expect(val(d.layer, "ADBE Noise2", "Amount of Noise")).toBe(1.3);
    expect(d.lift.blendingMode).toBe(5 - 3);   // ADD
    expect(val(d.lift, "ADBE Ramp", "Start of Ramp")).toEqual([540, 1920 * 0.6]);
    expect(c2._layers.indexOf(d.lift)).toBeLessThan(c2._layers.indexOf(d.layer));   // the lift sits above the ground
  });

  it("stage reports the project's working space, and labels the footage as the ground a fallback", () => {
    const { PH, comp } = makeAE({ deepGlow: true, workingSpace: "ACEScg" });
    const st = PH.stage(comp, { take: footage("take"), footageGround: true });
    expect(st.workingSpace).toBe("ACEScg");
    expect(st.warnings.join(" ")).toMatch(/working colour space is ACEScg/);
    expect(st.warnings.join(" ")).toMatch(/fallback/);
    const { PH: P2, comp: c2 } = makeAE({ deepGlow: true });
    expect(P2.stage(c2, { take: footage("take") }).warnings).toEqual([]);
  });

  it("the speaker from a rendered cut-out: stencilled by its alpha, remnants out by brightness and colour, standing on the bottom edge", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    expect(() => PH.speaker(comp, {})).toThrow(/cannot be made unattended/);
    const sp = PH.speaker(comp, { cutout: footage("cutout", 1088, 1920), take: footage("take", 1088, 1920),
      remnants: [{ box: [244, 1165, 349, 1265], frames: [[0, 870], [900, 1305]] }] });
    const C = sp.comp, names = C._layers.map((l: any) => l.name);
    expect(names).toEqual(["Remnant 1", "Cut-out alpha", "Base"]);
    expect(C.layer("Cut-out alpha").blendingMode).toBe(5);   // STENCIL_ALPHA
    expect(C.layer("Base").source.name).toBe("take");
    const h = C.layer("Remnant 1");
    expect(h.blendingMode).toBe(6);   // SILHOUETTE_ALPHA
    expect(val(h, "ADBE Color Range", "Min (a, U, G)")).toBe(128 + 15);   // anything redder than a* 15 is skin, kept
    expect(val(h, "ADBE Extract", "Black Point")).toBe(35);
    expect(h.opacity.keys.map((q: Key) => [Math.round(q.t * 30), q.v])).toEqual([[0, 100], [870, 0], [900, 100], [1305, 0]]);
    const L = sp.layer;
    expect(L.anchorPoint.value).toEqual([544, 1920]); expect(L.position.value).toEqual([540, 1920]);
    expect(L.scale.value).toEqual([100, 100]);
    expect(L.source).toBe(C);
  });

  it("the speaker's look: balance on every copy, the skin evened inside a choked skin matte, amounts on sliders", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const sp = PH.speaker(comp, { cutout: footage("cutout", 1088, 1920), look: { mixer: [98, 107, 84], gamma: 1.02, contrast: 0.03, average: [0.66, 0.46, 0.39] }, prefix: "PH J " });
    const C = sp.comp, ctl = comp.layer("PH J Skin controls");
    expect(sp.controls).toBe(ctl);
    expect(ctl.property("ADBE Effect Parade").kids.map((k: any) => [k.name, k.property(1).value])).toEqual([
      ["Colour even", 70], ["Average pull", 30], ["Light even", 30], ["Colour blur", 0.046 * 1088], ["Light blur", 0.132 * 1088], ["Skin choke", -3]]);
    for (const nm of ["Base", "Light even", "Colour even"]) expect(val(C.layer(nm), "ADBE CHANNEL MIXER", "Red-Red")).toBe(98);
    for (const nm of ["Light even", "Colour even", "Average pull"]) { expect(C.layer(nm).matte).toBe(C.layer("Skin key")); expect(C.layer(nm).matteType).toBe(2); }
    expect(C.layer("Colour even").blendingMode).toBe(3); expect(C.layer("Light even").blendingMode).toBe(4);
    expect(C.layer("Colour even").opacity.expression).toContain('comp("Beat").layer("PH J Skin controls").effect("Colour even")');
    expect(C.layer("Skin key").enabled).toBe(false);
    expect(C._layers[0].name).toBe("Cut-out alpha");   // the stencil is on top of the look
  });

  it("on a dark ground: the glow's exposure and radius, the cards' entrance and rim, the blocks' density", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    PH.setPiece({ tone: "dark", accent: [0.886, 0.278, 0.169] });
    const hw = PH.heroWord(comp, { text: "today", at: 2 });
    const dg = hw.layer.property("ADBE Effect Parade").kids.find((k: any) => k.matchName === "PEDG2");
    expect(dg.property(25).keys.map((q: Key) => q.v)).toEqual([0, 0.14, 0]);
    expect(dg.property("Radius").value).toBe(250);
    expect(hw.layer.property("Source Text").value.fillColor).toEqual([0.886, 0.278, 0.169]);   // the piece's accent
    const C = PH.card(comp, { clip: footage("c"), at: 2, pos: [300, 900], scale: 30, name: "PH D Card 1" });
    const clip = C.source.layer("Clip"), rim = C.source.layer("Rim");
    expect(val(rim, "ADBE Exposure2", "Exposure")).toBe(1);
    expect(fx(clip, "ADBE Exposure2").property("Exposure").keys.map((q: Key) => q.v)).toEqual([0.5, 0.5, 0]);
    const B = PH.uiCard(comp, { kind: "bubble", text: "YES", at: 2, pos: [540, 1300], width: 380, name: "PH D Card 2" });
    expect(fx(B.source.layer("Clip"), "ADBE Exposure2").property("Exposure").keys.map((q: Key) => q.v)).toEqual([0.3, 0.3, 0]);
    const light = makeAE({ deepGlow: true }), L2 = light.PH.card(light.comp, { clip: footage("c"), at: 2, pos: [300, 900], scale: 30, name: "PH L Card 1" });
    expect(val(L2.source.layer("Rim"), "ADBE Exposure2", "Exposure")).toBe(0.15);
    expect(fx(L2.source.layer("Clip"), "ADBE Exposure2").property("Exposure").keys.map((q: Key) => q.v)).toEqual([2, 2, 0]);
  });

  it("blocks keep out of the word's box at its peak on a dark ground and for a two-word word; a frame-wide word sends them up and down", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const hw = PH.heroWord(comp, { text: "make it big", at: 2, widthShare: 0.92 });
    const px = PH.pixelBlocks(comp, { word: hw, at: 2, seed: 3 });
    const cb = px.clearBox;
    expect(cb).not.toBe(null);
    expect(cb.x0).toBeLessThan(hw.box.x0); expect(cb.y1).toBeGreaterThan(hw.box.y1);
    const hits = px.blocks.filter((q: any) => q.x + q.w > cb.x0 && q.x < cb.x1 && q.y + q.h > cb.y0 && q.y < cb.y1);
    expect(hits).toEqual([]);
    expect(px.blocks.length).toBeGreaterThan(0);
    const cy = (hw.box.y0 + hw.box.y1) / 2;
    expect(px.blocks.every((q: any) => q.y + q.h <= cb.y0 + 1e-9 || q.y >= cb.y1 - 1e-9)).toBe(true);   // above or below only
    expect(cy).toBeGreaterThan(0);
    // a single word on a light ground keeps the calibrated schedule (blocks may fall behind its letters)
    const one = PH.heroWord(comp, { text: "shots", at: 2, prefix: "PH O " }), p1 = PH.pixelBlocks(comp, { word: one, at: 2, seed: 7, prefix: "PH O " });
    expect(p1.clearBox).toBe(null);
  });

  it("the tail: one size for the piece; up to three words slide the measured 154 px (scaled by size), longer tails a third of an em", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const slide = (L: any) => L.property("ADBE Text Properties").property("ADBE Text Animators").property("PH Reveal").property("ADBE Text Animator Properties").property("ADBE Text Position 3D").value[0];
    const a = PH.tail(comp, { text: "in thirty seconds", at: 2, prefix: "PH A " });
    expect(slide(a)).toBeCloseTo(-154, 9);
    PH.setPiece({ tailSize: 70 });
    const b = PH.tail(comp, { text: "right?", at: 2, prefix: "PH B " });
    expect(b.property("Source Text").value.fontSize).toBe(70);
    expect(slide(b)).toBeCloseTo(-154 * 70 / 86, 9);
    const c = PH.tail(comp, { text: "and I will send you", at: 2, prefix: "PH C " });
    expect(slide(c)).toBeCloseTo(-0.34 * 70, 9);
    PH.setPiece({ tailSlide: 24 });
    expect(slide(PH.tail(comp, { text: "right?", at: 2, prefix: "PH D " }))).toBe(-24);   // one slide for the piece, any length
  });

  it("a giant word tucked behind the speaker: baseline below the top of the hair, 92 % of the frame wide, under the speaker", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const sp = PH.speaker(comp, { cutout: footage("cutout", 1088, 1920) });
    const hw = PH.heroWord(comp, { text: "focus", at: 2, tuck: { hairY: 790 }, behind: sp.layer });
    expect(hw.layer.position.value[1]).toBe(790 + 55 - 18);
    expect(hw.box.x1 - hw.box.x0).toBeCloseTo(0.92 * 1080, 6);
    expect(comp._layers.indexOf(hw.layer)).toBe(comp._layers.indexOf(sp.layer) + 1);
    const px = PH.pixelBlocks(comp, { word: hw, at: 2 });
    expect(comp._layers.indexOf(px.layer)).toBe(comp._layers.indexOf(hw.layer) + 1);
  });

  it("zoomOut: the target taken with the camera at rest, sampleAt, an ease in and out; a falling value leaves its key falling", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const st = PH.stage(comp, { take: footage("take", 2160, 3840), scale: 50 });
    const cam = PH.push(comp, { at: 0, layers: [st.speaker] }).layer;   // 171.5 % at 0, 100 % from frame 42
    cam.anchorPoint.value = [0, 0];
    const z = PH.zoomOut(comp, { speaker: st.speaker, scale: 40, position: [540, 1152], ground: "sample", sampleAt: [0.5, 0.14], prefix: "PH Z " });
    expect(z.target).toEqual([0, 192]);   // at 100 %, not the 171.5 % of time 0 (which would give 112)
    expect(comp.layer("PH Z Inset ground").property("ADBE Effect Parade").kids[0].property("Color").expression).toContain("L.width * 0.5, L.height * 0.14");
    const { PH: P2, comp: c2 } = makeAE({ deepGlow: true });
    const s2 = P2.stage(c2, { take: footage("take", 2160, 3840), scale: 50 });
    P2.zoomOut(c2, { speaker: s2.speaker, scale: 40, position: [540, 1500], at: 2, ease: "inOut", cutout: true });
    const sk = s2.speaker.scale;
    expect(sk.keys.map((q: Key) => [+(q.t * 30).toFixed(6), q.v[0]])).toEqual([[60, 50], [86, 40]]);
    expect(sk.eases[sk.keys[0].t].outE[0].influence).toBe(82);
    expect(c2.layer("PH Inset ground")).toBe(undefined);   // a cut-out on a clean ground needs no inset ground or mask
    const P3 = makeAE({ deepGlow: true }), s3 = P3.PH.stage(P3.comp, { take: footage("take", 2160, 3840), scale: 50 });
    P3.PH.zoomOut(P3.comp, { speaker: s3.speaker, scale: 40, position: [540, 1500], at: 2, cutout: true });
    const out = s3.speaker.scale.eases[s3.speaker.scale.keys[0].t].outE;
    expect(out[0].speed).toBeLessThan(0); expect(out[1].speed).toBeLessThan(0);   // 50 -> 40 falls
  });

  it("clearing a beat unparents what stays with the camera at rest, so a rebuild does not zoom twice", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    const st = PH.stage(comp, { take: footage("take"), prefix: "PH S " });
    const cam = PH.push(comp, { at: 0, layers: [st.speaker], prefix: "PH X " }).layer;
    cam.scale.value = [171.5, 171.5, 171.5];
    const card1 = PH.card(comp, { clip: footage("c"), at: 1, pos: [300, 900], scale: 30, name: "PH X Card 1" });
    const r = PH.clear(comp, { prefix: "PH X " });
    expect(r.layers).toBe(2);
    expect(cam.removed).toBe(true); expect(card1.removed).toBe(true);
    expect(st.speaker.parent).toBe(null);
    expect(st.speaker.unparentedAt).toEqual({ scale: [100, 100, 100], keys: 0, expr: "" });
    expect(st.speaker.removed).toBeUndefined();
  });

  it("the proof: a large card per item behind the speaker, its name above; earlier cards step back; the set restarts each clip", () => {
    const { PH, makeComp } = makeAE({ deepGlow: true }), comp = makeComp("Piece", 1080, 1920, 20, 30);
    const sp = PH.speaker(comp, { cutout: footage("cutout", 1088, 1920) });
    const items = [0, 1, 2].map((i) => ({ clip: footage("site" + i, 1280, 800, 30), at: 2 + i * 3 + F(8), text: "Name " + (i + 1), W: 2 + i * 3 }));
    const r = PH.proof(comp, { items, nameBaseline: 470, behind: sp.layer, back: { scale: 22, pos: [[205, 1085], [875, 1085]] },
      set: { at: 11, pos: [[362, 439], [540, 650], [718, 861]], scale: 45 }, prefix: "PH P " });
    expect(r.cards.map((c: any) => c.name)).toEqual(["PH P Card 1", "PH P Card 2", "PH P Card 3"]);
    expect(r.names.map((n: any) => n.prefix)).toEqual(["PH P A ", "PH P B ", "PH P C "]);
    expect(r.names[0].word.layer.position.value[1]).toBe(470 - 18);
    const thin = PH.proof(comp, { items: [{ ...items[0], blockScale: 0.1 }], prefix: "PH Q " }), full = r.names[0].blocks.blocks.length;
    expect(thin.names[0].blocks.blocks.length).toBeLessThan(full);   // a name's blocks thin with its blockScale
    for (const c of r.cards) expect(comp._layers.indexOf(c)).toBeGreaterThan(comp._layers.indexOf(sp.layer));
    const c1 = r.cards[0];
    expect(c1.scale.keys.some((q: Key) => near(q.t, 5) && q.v[0] !== 22)).toBe(true);   // the step-back starts at the next name's W
    expect(c1.scale.keys.some((q: Key) => near(q.t, 5.3) && q.v[0] === 22)).toBe(true);
    expect(r.cards[2].scale.keys.some((q: Key) => near(q.t, 11 + F(8) + 0.6) && q.v[0] === 45)).toBe(true);   // staggered 4 frames
    const TR = r.cards[1].source.layer("Clip").property("ADBE Time Remapping");
    const j = 11 + F(4);
    const len = 20 - j, r6 = (x: number) => +x.toFixed(6);
    expect(TR.keys.map((q: Key) => [r6(q.t), r6(q.v)])).toEqual([[r6(5 + F(8)), 0], [r6(j - F(1)), r6(j - F(1) - 5 - F(8))], [r6(j), 0], [r6(j + len), r6(len)]]);
    expect(TR.interp[TR.keys[1].t]).toEqual([6612, 6614]);   // holds until the restart
  });

  it("interface cards and the strike: a prompt bar in the accent, a bubble with its comment, a stroke drawn on in 6 frames and left on", () => {
    const { PH, comp } = makeAE({ deepGlow: true });
    PH.setPiece({ accent: [0.9, 0.3, 0.2] });
    const bar = PH.uiCard(comp, { kind: "bar", at: 2, pos: [540, 1300], width: 880, name: "PH X5 Card 1" });
    const piece = bar.source.layer("Clip").source;
    expect(piece.layer("Send").property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").kids.find((k: any) => k.matchName === "ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").value).toEqual([0.9, 0.3, 0.2]);
    expect(piece.layer("Caret").opacity.expression).toContain("Math.floor(time * 2)");
    const roundness = (L: any) => L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property(1).property("ADBE Vector Rect Roundness").value;
    expect(roundness(bar.source.layer("Inner"))).toBe(90);
    const bub = PH.uiCard(comp, { kind: "bubble", text: "HELLO", at: 2, pos: [860, 860], width: 340, name: "PH X3 Card 1" });
    expect(bub.source.layer("Clip").source.layer("Comment").property("Source Text").value.text).toBe("HELLO");
    const L = PH.strike(comp, { from: [40, 1500], to: [340, 800], at: 3, prefix: "PH X6 " });
    expect(L.name).toBe("PH X6 Line");
    const tr = L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Filter - Trim");
    expect(tr.property("ADBE Vector Trim End").keys.map((q: Key) => [q.t, q.v])).toEqual([[3, 0], [3 + F(6), 100]]);
    expect(tr.property("ADBE Vector Trim Start").keys).toEqual([]);
  });

  it("how long a line takes, and the whole beat's warnings: no time to land, a short hold, long lines, the margins, a giant phrase", () => {
    const { PH } = makeAE({ deepGlow: true });
    expect(PH.lineTime(9, "lead") * 30).toBeCloseTo(8 * 4.75 + 26.119, 9);
    expect(PH.lineTime(5, "tail") * 30).toBeCloseTo(4 * 6.4 + 26.078, 9);
    // settled = under 2 px left to travel, the measure a hold is counted from; against the first piece's timeline (a five-word
    // tail line at a 24 px slide settled 41.5 frames after it started; a giant word 22.5 frames after W)
    expect(PH.settleTime(5, "tail", 24) * 30).toBeCloseTo(41.5, 0);
    expect(PH.popSettle(PH.SIG.word, 0.92 * 1080 / 2) * 30).toBeCloseTo(22.5, 0);
    expect(PH.settleTime(5, "lead") * 30).toBeLessThan(PH.lineTime(5, "lead") * 30);
    const clean = makeAE({ deepGlow: true });
    expect(clean.PH.beat(clean.comp, referenceBrief(3, { exitAt: 4.4 })).warnings).toEqual([]);
    const late = makeAE({ deepGlow: true });
    expect(late.PH.beat(late.comp, referenceBrief(3, { exitAt: 3.3 })).warnings.join(" | ")).toMatch(/cannot land in its window/);
    const short = makeAE({ deepGlow: true });
    expect(short.PH.beat(short.comp, referenceBrief(3, { exitAt: 3.6 })).warnings.join(" | ")).toMatch(/the hold is \d+(\.\d)? frames/);
    const ws = ["Here", "is", "a", "line", "with", "far", "too", "many", "words", "BIG", "today"].map((text, i) => ({ text, t: 0.5 + i * 0.15 }));
    const long = makeAE({ deepGlow: true });
    const w = long.PH.beat(long.comp, { ...referenceBrief(0), clips: [], words: ws, stressed: 9, maxChars: 60, leadBaseline: 150 }).warnings.join(" | ");
    expect(w).toMatch(/lead-in line 1 has 9 words/);
    expect(w).toMatch(/the lead-in enters the top margin/);
    const ph = makeAE({ deepGlow: true });
    expect(ph.PH.heroWord(ph.comp, { text: "one big idea", at: 2 }).warnings.join(" ")).toMatch(/choose one stressed word/);
  });

  it("blocks on a dark ground: scheduled as calibrated, then the ones touching the word's peak box dropped; the first piece's blocks, frame for frame", () => {
    // Boxes measured live in After Effects for two giant words of the first full piece (92 % of the frame wide, Inter Bold);
    // seeds, line bands and densities as built; the counts per frame from W + 4 to W + 14 as delivered.
    const { PH } = makeAE({ deepGlow: true });
    const cases = [
      { box: { x0: 40.2019, x1: 1033.8019, y0: 383.0384, y1: 607.348 }, pivot: [540, 538], seed: 103, lineBand: [324, 382], blockScale: 0.2, counts: [2, 2, 5, 7, 0, 1, 2, 4, 3, 3, 1] },
      { box: { x0: 43.7541, x1: 1037.3542, y0: 318.3935, y1: 610.0176 }, pivot: [540, 588], seed: 113, lineBand: [250, 308], blockScale: 0.3, counts: [17, 19, 26, 28, 10, 12, 14, 10, 5, 5, 2] },
      // a word tucked behind the speaker, low in the frame: the grid stops at 45 % of the height, as built
      { box: { x0: 47.8216, x1: 1041.4216, y0: 651.6025, y1: 903.5068 }, pivot: [540, 827], seed: 105, lineBand: [586, 644], blockScale: 0.2, counts: [3, 3, 3, 3, 0, 2, 2, 3, 3, 3, 1] },
    ];
    for (const c of cases) {
      const r = PH.blocksFor({ ...c, text: "word", width: 1080, height: 1920, cell: 39, dark: true });
      const per = Array.from({ length: 11 }, (_, i) => r.blocks.filter((q: any) => q.on <= i + 4 && i + 4 < q.off).length);
      expect(per).toEqual(c.counts);
      const X = r.clearBox;
      expect(r.blocks.filter((q: any) => q.x + q.w > X.x0 && q.x < X.x1 && q.y + q.h > X.y0 && q.y < X.y1)).toEqual([]);
    }
    // gridDepth 1 reaches the bottom of the frame: more blocks below the tucked word (extended)
    const low = cases[2], deep = PH.blocksFor({ ...low, text: "word", width: 1080, height: 1920, cell: 39, dark: true, gridDepth: 1 });
    expect(deep.blocks.length).toBeGreaterThan(PH.blocksFor({ ...low, text: "word", width: 1080, height: 1920, cell: 39, dark: true }).blocks.length);
    expect(deep.blocks.some((q: any) => q.y >= 0.45 * 1920)).toBe(true);
  });
});
