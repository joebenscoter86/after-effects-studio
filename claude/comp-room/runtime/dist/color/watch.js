import {
  DIFF_DEFAULTS,
  pictureChange,
  summarizeSeries
} from "./motion.js";
const WATCH_DEFAULTS = {
  changeAbove: DIFF_DEFAULTS.changeAbove,
  spikeRatio: DIFF_DEFAULTS.spikeRatio,
  holdRatio: DIFF_DEFAULTS.holdRatio,
  quietBelow: DIFF_DEFAULTS.quietBelow,
  movingShare: DIFF_DEFAULTS.movingShare,
  window: DIFF_DEFAULTS.window,
  repeatBelow: DIFF_DEFAULTS.repeatBelow,
  frozenSeconds: 0.5,
  frozenShare: 2e-5,
  darkBelow: 0.04,
  lightAbove: 0.96,
  blackShare: 0.99,
  blackMean: 0.01,
  whiteShare: 0.99,
  whiteMean: 0.99,
  clipHighShare: 5e-3,
  clipLowShare: null
};
const LIMITS = {
  changeAbove: { min: 0, max: 1 },
  spikeRatio: { min: 1, max: 1e3, above: true },
  holdRatio: { min: 0, max: 1, above: true },
  quietBelow: { min: 0, max: 1 },
  movingShare: { min: 0, max: 1 },
  window: { min: 1, max: 16, int: true },
  repeatBelow: { min: 0, max: 1 },
  frozenSeconds: { min: 0, max: 3600, above: true },
  frozenShare: { min: 0, max: 1 },
  darkBelow: { min: 0, max: 1 },
  lightAbove: { min: 0, max: 1 },
  blackShare: { min: 0, max: 1, above: true },
  blackMean: { min: 0, max: 1 },
  whiteShare: { min: 0, max: 1, above: true },
  whiteMean: { min: 0, max: 1 },
  clipHighShare: { min: 0, max: 1, above: true },
  clipLowShare: { min: 0, max: 1, above: true, nullable: true }
};
function resolveWatchThresholds(args = {}) {
  const out = { ...WATCH_DEFAULTS };
  for (const key of Object.keys(WATCH_DEFAULTS)) {
    const v = args[key];
    if (typeof v === "number" || v === null && LIMITS[key].nullable) {
      out[key] = v;
    }
  }
  return out;
}
function watchArgsError(args) {
  for (const [key, value] of Object.entries(args)) {
    const limit = LIMITS[key];
    if (!limit) {
      return `\`thresholds.${key}\` is not an option (options: ${Object.keys(LIMITS).join(", ")})`;
    }
    if (value === null && limit.nullable) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `\`thresholds.${key}\` must be a number${limit.nullable ? " or null" : ""}`;
    }
    const low = limit.above ? value <= limit.min : value < limit.min;
    if (low || value > limit.max || limit.int && !Number.isInteger(value)) {
      const range = limit.above ? `above ${limit.min} and at most ${limit.max}` : `${limit.min} to ${limit.max}`;
      return `\`thresholds.${key}\` must be ${limit.int ? "a whole number " : ""}${range}, not ${value}`;
    }
  }
  return null;
}
const TOP_CODE = 254.5 / 255;
const BOTTOM_CODE = 0.5 / 255;
const r6 = (v) => Math.round(v * 1e6) / 1e6;
function measureFrame(pic, width, height, t) {
  let luma = 0;
  let dark = 0;
  let light = 0;
  let hr = 0;
  let hg = 0;
  let hb = 0;
  let ha = 0;
  let lr = 0;
  let lg = 0;
  let lb = 0;
  let la = 0;
  let hx0 = width;
  let hy0 = height;
  let hx1 = -1;
  let hy1 = -1;
  let lx0 = width;
  let ly0 = height;
  let lx1 = -1;
  let ly1 = -1;
  const { darkBelow, lightAbove } = t;
  for (let y = 0; y < height; y++) {
    let i = y * width * 3;
    for (let x = 0; x < width; x++, i += 3) {
      const r = pic[i];
      const g = pic[i + 1];
      const b = pic[i + 2];
      luma += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const max = r > g ? r > b ? r : b : g > b ? g : b;
      const min = r < g ? r < b ? r : b : g < b ? g : b;
      if (max <= darkBelow) dark++;
      if (min >= lightAbove) light++;
      if (max >= TOP_CODE) {
        if (r >= TOP_CODE) hr++;
        if (g >= TOP_CODE) hg++;
        if (b >= TOP_CODE) hb++;
        if (min >= TOP_CODE) {
          ha++;
          if (x < hx0) hx0 = x;
          if (x > hx1) hx1 = x;
          if (y < hy0) hy0 = y;
          if (y > hy1) hy1 = y;
        }
      }
      if (min <= BOTTOM_CODE) {
        if (r <= BOTTOM_CODE) lr++;
        if (g <= BOTTOM_CODE) lg++;
        if (b <= BOTTOM_CODE) lb++;
        if (max <= BOTTOM_CODE) {
          la++;
          if (x < lx0) lx0 = x;
          if (x > lx1) lx1 = x;
          if (y < ly0) ly0 = y;
          if (y > ly1) ly1 = y;
        }
      }
    }
  }
  const n = width * height || 1;
  const box = (x0, y0, x1, y1) => x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  return {
    meanLuma: r6(luma / n),
    darkShare: r6(dark / n),
    lightShare: r6(light / n),
    clipHigh: {
      r: r6(hr / n),
      g: r6(hg / n),
      b: r6(hb / n),
      all: r6(ha / n),
      box: box(hx0, hy0, hx1, hy1)
    },
    clipLow: {
      r: r6(lr / n),
      g: r6(lg / n),
      b: r6(lb / n),
      all: r6(la / n),
      box: box(lx0, ly0, lx1, ly1)
    }
  };
}
const fmt = (v) => v.toFixed(4);
const secs = (v) => `${r6(v)} s`;
class PieceWatcher {
  t;
  o;
  prev = null;
  frames = [];
  /** Pairs, split where a frame is missing or the size changes. */
  segments = [[]];
  gaps = 0;
  measureMs = 0;
  constructor(opts) {
    this.t = opts.thresholds;
    this.o = opts;
  }
  /** Measure one frame (frames must arrive in increasing order) and keep only what the report needs. */
  add(f) {
    const t0 = performance.now();
    this.frames.push({ frame: f.frame, m: measureFrame(f.pic, f.width, f.height, this.t) });
    const p = this.prev;
    if (p !== null) {
      const contiguous = f.frame === p.frame + this.o.every && f.width === p.width && f.height === p.height;
      if (!contiguous) {
        this.gaps++;
        if (this.segments[this.segments.length - 1].length > 0) this.segments.push([]);
      } else {
        const { all } = pictureChange(p.pic, f.pic, f.width, f.height, {
          ...this.t,
          amplify: 1
        });
        this.segments[this.segments.length - 1].push({
          from: p.frame,
          to: f.frame,
          change: all.change,
          changedShare: all.changedShare,
          changedBounds: all.changedBounds
        });
      }
    }
    this.prev = f;
    this.measureMs += performance.now() - t0;
  }
  point(frame) {
    return { frame, time: r6(frame * this.o.frameDuration) };
  }
  ownedFrame(frame) {
    const own = this.o.owned;
    return own === void 0 || frame >= own.from && frame <= own.to;
  }
  scaleBox(b) {
    if (b === null) return null;
    const s = this.o.scale;
    return {
      x: Math.floor(b.x * s),
      y: Math.floor(b.y * s),
      width: Math.ceil(b.width * s),
      height: Math.ceil(b.height * s)
    };
  }
  finish() {
    const t = this.t;
    const every = this.o.every;
    const notes = [];
    const flags = [];
    let pairCount = 0;
    for (const seg of this.segments) {
      pairCount += seg.length;
      if (seg.length === 0) continue;
      const series = seg.map((p) => ({
        from: { index: p.from, time: r6(p.from * this.o.frameDuration) },
        to: { index: p.to, time: r6(p.to * this.o.frameDuration) },
        change: p.change,
        changedShare: p.changedShare
      }));
      const summary = summarizeSeries(series, { ...t, amplify: 1 });
      for (const sf of summary.flags) {
        const flag = this.momentOf(sf, seg);
        if (this.ownedFrame(flag.frame)) flags.push(flag);
      }
    }
    flags.sort((a, b) => a.frame - b.frame);
    if (this.gaps > 0) {
      notes.push(
        `${this.gaps} gap${this.gaps > 1 ? "s" : ""} in the checked frames (a capture missing, or the size changed): pairs were not compared across ${this.gaps > 1 ? "them" : "it"}`
      );
    }
    if (every > 1) {
      notes.push(
        `every ${every}: only every ${every}th frame was checked, so a one-frame pop or flash on a frame in between is missed; a stutter or repeat here means two frames ${every} apart look the same while the frames around them move; frozen and other stretches may run up to ${every - 1} frame${every > 2 ? "s" : ""} further at each end`
      );
    }
    const owned = this.frames.filter((f) => this.ownedFrame(f.frame));
    const stretches = [
      ...this.frozenStretches(),
      ...this.frameStretches(
        "near-black",
        (m) => m.darkShare >= t.blackShare || m.meanLuma <= t.blackMean ? 1 - m.meanLuma : null
      ),
      ...this.frameStretches(
        "near-white",
        (m) => m.lightShare >= t.whiteShare || m.meanLuma >= t.whiteMean ? m.meanLuma : null
      ),
      ...this.frameStretches(
        "clipped-high",
        (m) => m.clipHigh.all >= t.clipHighShare ? m.clipHigh.all : null
      ),
      ...t.clipLowShare === null ? [] : this.frameStretches(
        "clipped-low",
        (m) => m.clipLow.all >= t.clipLowShare ? m.clipLow.all : null
      )
    ].filter((s) => this.ownedFrame(s.from.frame) || this.ownedFrame(s.to.frame) || this.spansOwned(s));
    const order = ["frozen", "near-black", "near-white", "clipped-high", "clipped-low"];
    stretches.sort((a, b) => a.from.frame - b.from.frame || order.indexOf(a.kind) - order.indexOf(b.kind));
    let extremes = null;
    if (owned.length > 0) {
      let hi = { max: -1, frame: null };
      let lo = { max: -1, frame: null };
      let lmin = Infinity;
      let lmax = -Infinity;
      for (const f of owned) {
        lmin = Math.min(lmin, f.m.meanLuma);
        lmax = Math.max(lmax, f.m.meanLuma);
        if (f.m.clipHigh.all > hi.max) hi = { max: f.m.clipHigh.all, frame: f.frame };
        if (f.m.clipLow.all > lo.max) lo = { max: f.m.clipLow.all, frame: f.frame };
      }
      const changes = this.segments.flat().filter((p) => this.ownedFrame(p.to)).map((p) => p.change).sort((a, b) => a - b);
      if (hi.max <= 0) hi.frame = null;
      if (lo.max <= 0) lo.frame = null;
      extremes = {
        meanLuma: { min: lmin, max: lmax },
        clipHighAll: hi,
        clipLowAll: lo,
        pairChange: {
          median: changes.length > 0 ? changes[Math.floor((changes.length - 1) / 2)] : 0,
          max: changes.length > 0 ? changes[changes.length - 1] : 0
        }
      };
    }
    return {
      step: every,
      framesChecked: owned.length,
      pairs: pairCount,
      flags,
      stretches,
      extremes,
      notes
    };
  }
  spansOwned(s) {
    const own = this.o.owned;
    return own !== void 0 && s.from.frame < own.from && s.to.frame > own.to;
  }
  momentOf(sf, seg) {
    const every = this.o.every;
    const into = (frame2) => seg.find((p) => p.to === frame2);
    let frame;
    let fromFrame;
    if (sf.kind === "cut" && sf.between) {
      frame = sf.between[1].index;
      fromFrame = sf.between[0].index;
    } else {
      const ref = sf.frame ?? (sf.between ? sf.between[1] : void 0);
      frame = ref ? ref.index : seg[sf.pairs[0]].to;
    }
    const pair = into(frame);
    let reading = sf.reading;
    if (every > 1 && (sf.kind === "stutter" || sf.kind === "repeat")) {
      reading += ` (checked every ${every} frames: frames ${frame - every} and ${frame} look the same; a hold of at least ${every + 1} frames, or motion that came back to the same place)`;
    }
    const flag = {
      kind: sf.kind,
      frame,
      time: r6(frame * this.o.frameDuration),
      change: sf.change,
      reference: sf.reference,
      ratio: sf.ratio,
      reading
    };
    if (fromFrame !== void 0) flag.fromFrame = fromFrame;
    if (pair) flag.box = this.scaleBox(pair.changedBounds);
    if (sf.atSeriesEdge) flag.atSeriesEdge = true;
    if (sf.besideRepeat) flag.besideRepeat = true;
    return flag;
  }
  edges(from, to, first, last) {
    const out = {};
    if (this.o.every > 1) out.uncertainFrames = this.o.every - 1;
    if (this.o.openStart && from === first) out.openStart = true;
    if (this.o.openEnd && to === last) out.openEnd = true;
    return out;
  }
  frozenStretches() {
    const t = this.t;
    const fd = this.o.frameDuration;
    const out = [];
    const first = this.frames[0]?.frame;
    const last = this.frames[this.frames.length - 1]?.frame;
    for (const seg of this.segments) {
      let i = 0;
      while (i < seg.length) {
        if (seg[i].changedShare > t.frozenShare) {
          i++;
          continue;
        }
        let j = i;
        let largest = seg[i].change;
        while (j + 1 < seg.length && seg[j + 1].changedShare <= t.frozenShare) {
          j++;
          largest = Math.max(largest, seg[j].change);
        }
        const from = seg[i].from;
        const to = seg[j].to;
        const frames = to - from + 1;
        const seconds = frames * fd;
        if (seconds >= t.frozenSeconds - 1e-9) {
          out.push({
            kind: "frozen",
            from: this.point(from),
            to: this.point(to),
            frames,
            seconds: r6(seconds),
            ...this.edges(from, to, first, last),
            largestChange: largest,
            reading: `no visible change from ${secs(from * fd)} to ${secs(to * fd)} (frames ${from} to ${to}, ${r6(seconds)} s): at most ${fmt(t.frozenShare * 100)}% of pixels changed by more than ${t.changeAbove} between checked frames. A held title or a still is legitimate; a stop in the middle of a move is not`
          });
        }
        i = j + 1;
      }
    }
    return out;
  }
  /** Runs of consecutive checked frames whose `score` is not null; the worst is the highest score. */
  frameStretches(kind, score) {
    const fd = this.o.frameDuration;
    const every = this.o.every;
    const out = [];
    const first = this.frames[0]?.frame;
    const last = this.frames[this.frames.length - 1]?.frame;
    let run = [];
    const close = () => {
      if (run.length === 0) return;
      const from = run[0].frame;
      const to = run[run.length - 1].frame;
      let worst = run[0];
      for (const f of run) if (score(f.m) > score(worst.m)) worst = f;
      const frames = to - from + 1;
      const s = {
        kind,
        from: this.point(from),
        to: this.point(to),
        frames,
        seconds: r6(frames * fd),
        ...this.edges(from, to, first, last),
        reading: ""
      };
      const when = `${secs(from * fd)} to ${secs(to * fd)} (frames ${from} to ${to})`;
      const m = worst.m;
      if (kind === "near-black" || kind === "near-white") {
        const share = kind === "near-black" ? m.darkShare : m.lightShare;
        s.worst = { frame: worst.frame, time: r6(worst.frame * fd), share, meanLuma: m.meanLuma };
        s.reading = `${kind} from ${when}: at worst (frame ${worst.frame}) mean luma ${fmt(m.meanLuma)}, ${fmt(share * 100)}% of pixels ${kind === "near-black" ? `at or below ${this.t.darkBelow}` : `at or above ${this.t.lightAbove}`} in every channel`;
      } else {
        const c = kind === "clipped-high" ? m.clipHigh : m.clipLow;
        let box = null;
        for (const f of run) {
          const b = (kind === "clipped-high" ? f.m.clipHigh : f.m.clipLow).box;
          if (b === null) continue;
          if (box === null) box = { ...b };
          else {
            const x1 = Math.max(box.x + box.width, b.x + b.width);
            const y1 = Math.max(box.y + box.height, b.y + b.height);
            box.x = Math.min(box.x, b.x);
            box.y = Math.min(box.y, b.y);
            box.width = x1 - box.x;
            box.height = y1 - box.y;
          }
        }
        s.box = this.scaleBox(box);
        s.worst = {
          frame: worst.frame,
          time: r6(worst.frame * fd),
          share: c.all,
          channels: { r: c.r, g: c.g, b: c.b }
        };
        const code = kind === "clipped-high" ? "255 (the top code)" : "0 (the bottom code)";
        s.reading = `${kind} from ${when}: at worst (frame ${worst.frame}) ${fmt(c.all * 100)}% of pixels at ${code} in all three channels (per channel r ${fmt(c.r * 100)}%, g ${fmt(c.g * 100)}%, b ${fmt(c.b * 100)}%)` + (s.box ? `, inside x ${s.box.x}..${s.box.x + s.box.width}, y ${s.box.y}..${s.box.y + s.box.height} (comp pixels)` : "");
      }
      out.push(s);
      run = [];
    };
    for (const f of this.frames) {
      const prev = run[run.length - 1];
      if (prev !== void 0 && f.frame !== prev.frame + every) close();
      if (score(f.m) === null) close();
      else run.push(f);
    }
    close();
    return out;
  }
}
export {
  BOTTOM_CODE,
  PieceWatcher,
  TOP_CODE,
  WATCH_DEFAULTS,
  measureFrame,
  resolveWatchThresholds,
  watchArgsError
};
