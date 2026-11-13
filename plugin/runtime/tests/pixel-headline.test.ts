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
  setInterpolationTypeAtKey(i: number, a: number, b: number) { this.interp[this.keys[i - 1].t] = [a, b]; }
  setTemporalEaseAtKey(i: number, a: any[], b: any[]) { this.eases[this.keys[i - 1].t] = { inE: a, outE: b }; }
  keyInTemporalEase(i: number) { return this.eases[this.keys[i - 1].t]?.inE; }
  keyOutTemporalEase(i: number) { return this.eases[this.keys[i - 1].t]?.outE; }
}

function makeAE(opts: { deepGlow: boolean }) {
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
        const s = td.fontSize, n = td.text.length, desc = /[gjpqy]/.test(td.text);
        return { left: -0.29 * s * n, top: -0.73 * s, width: 0.58 * s * n, height: 0.73 * s + (desc ? 0.24 * s : 0) };
      },
      duplicate() { const C = makeLayer(comp, kind, name + " copy"); C.inPoint = L.inPoint; C.scale.keys = L.scale.keys.map((k: Key) => ({ ...k })); comp._layers.unshift(C); return C; },
      moveAfter(o: any) { const a = comp._layers; a.splice(a.indexOf(L), 1); a.splice(a.indexOf(o) + 1, 0, L); },
      moveBefore(o: any) { const a = comp._layers; a.splice(a.indexOf(L), 1); a.splice(a.indexOf(o), 0, L); },
      setTrackMatte(m: any, t: any) { L.matte = m; L.matteType = t; },
      get timeRemapEnabled() { return false; },
    };
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
    project: { items: { addComp: (n: string, w: number, h: number, _p: number, d: number, f: number) => makeComp(n, w, h, d, f) } },
  };
  function KeyframeEase(this: any, speed: number, influence: number) { this.speed = speed; this.influence = influence; }
  function Shape(this: any) { this.vertices = []; this.inTangents = []; this.outTangents = []; this.closed = true; }
  const ctx = vm.createContext({
    app, KeyframeEase, Shape, Math,
    KeyframeInterpolationType: { LINEAR: 6612, BEZIER: 6613, HOLD: 6614 },
    PropertyValueType: { TwoD_SPATIAL: 6413, ThreeD_SPATIAL: 6412, TwoD: 6416, ThreeD: 6414, OneD: 6417 },
    TrackMatteType: { ALPHA: 1, ALPHA_INVERTED: 2, LUMA: 3 },
    ParagraphJustification: { LEFT_JUSTIFY: 1, CENTER_JUSTIFY: 2, RIGHT_JUSTIFY: 3 },
  });
  vm.runInContext(LIB, ctx);
  vm.runInContext(MOD, ctx);
  const comp = makeComp("Beat", 1080, 1920, 4.5, 30);
  return { PH: (ctx as any).AESPixelHeadline, comp, comps, makeComp };
}

const F = (n: number) => n / 30;
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
const footage = (name: string) => ({ name, width: 1080, height: 1920, isComp: false });
const words = (w: number) => [["How", w - F(30)], ["to", w - F(26)], ["make", w - F(21)], ["the", w - F(16)], ["best", w - F(12)], ["shots", w], ["in", w + F(20.75)], ["thirty", w + F(27.2)], ["seconds", w + F(33.6)]]
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
    expect(Object.values(op.interp).every(([a, b]) => a === 6614 && b === 6614)).toBe(true);
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
    expect(Object.values(trim.property("ADBE Vector Trim End").interp).every(([a]) => a === 6612)).toBe(true);
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
    expect(r.ground.name).toBe("PH Inset ground");
    expect(comp._layers.indexOf(r.ground)).toBe(comp._layers.indexOf(st.speaker) + 1);
    expect(r.ground.property("ADBE Effect Parade").kids[0].property("Color").expression).toMatch(/sampleImage/);
    const back = PH.exitInset(comp, { speaker: st.speaker, at: 5 });
    expect(back).toBeCloseTo(5 + F(8), 9);
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
});
