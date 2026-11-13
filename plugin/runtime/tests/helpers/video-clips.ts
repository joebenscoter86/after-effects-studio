// Test clips with known moves, drawn frame by frame here and encoded with ffmpeg when a test runs; nothing is committed
// as media. Each clip carries its truth: where the moving thing is on every frame, its scale and opacity, and the frames
// of any cut or one-frame swap. Used by the video tests (shot list, census, tracker, fits).
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export const W = 384;
export const H = 216;
export const FPS = 30;

/** A deterministic random generator (the same textures on every run). */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/**
 * After Effects' ease between two keys with zero speed at both ends: the time axis is a cubic bezier with control points
 * at outInfluence and 1 - inInfluence, the value axis rises 0, 0, 1, 1. outInfluence and inInfluence are 0..1.
 */
export function aeEase(t: number, outInfluence: number, inInfluence: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const x1 = outInfluence, x2 = 1 - inInfluence;
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (bx(m) < t) lo = m; else hi = m; }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * u * u + u * u * u;
}

/** A damped spring from 0 to 1: damping ratio zeta (< 1 overshoots), natural frequency omega (radians a second). */
export function spring(tSeconds: number, zeta: number, omega: number): number {
  if (tSeconds <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * tSeconds) * (Math.cos(wd * tSeconds) + ((zeta * omega) / wd) * Math.sin(wd * tSeconds));
}

/** A textured patch: blocks of light and dark with a diagonal gradient, so a match locks on it and on nothing else. */
function patchTexture(size: number, seed: number): Uint8Array {
  const r = rng(seed), out = new Uint8Array(size * size * 3), cell = Math.max(4, Math.round(size / 6));
  const cells: number[] = [];
  for (let i = 0; i < 64; i++) cells.push(r());
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const c = cells[(Math.floor(y / cell) * 8 + Math.floor(x / cell)) % 64], g = (x + y) / (2 * size);
    const v = 40 + 180 * (0.65 * c + 0.35 * g), o = (y * size + x) * 3;
    out[o] = Math.min(255, v + 30); out[o + 1] = v; out[o + 2] = Math.max(0, v - 40);
  }
  return out;
}

/** A background: flat grey, or a scrolling noise texture (offset px to the left per frame). */
function background(kind: "flat" | "texture", seed: number): (frame: number) => Uint8Array {
  if (kind === "flat") { const b = new Uint8Array(W * H * 3).fill(70); return () => b; }
  const r = rng(seed), tw = W * 2, tex = new Uint8Array(tw * H);
  for (let i = 0; i < tex.length; i++) tex[i] = 50 + Math.floor(r() * 60);
  return (frame) => {
    const b = new Uint8Array(W * H * 3), off = (frame * 3) % W;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = tex[y * tw + ((x + off) % tw)], o = (y * W + x) * 3; b[o] = v; b[o + 1] = v; b[o + 2] = v + 10; }
    return b;
  };
}

/** Composite a patch at centre (cx, cy), scale s (of its base size), opacity a, onto a frame (nearest-neighbour). */
function place(frame: Uint8Array, patch: Uint8Array, base: number, cx: number, cy: number, s: number, a: number): void {
  const size = base * s, x0 = cx - size / 2, y0 = cy - size / 2;
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, Math.ceil(y0 + size)); y++)
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, Math.ceil(x0 + size)); x++) {
      const px = Math.min(base - 1, Math.floor(((x + 0.5 - x0) / size) * base)), py = Math.min(base - 1, Math.floor(((y + 0.5 - y0) / size) * base));
      if (px < 0 || py < 0) continue;
      const o = (y * W + x) * 3, p = (py * base + px) * 3;
      for (let c = 0; c < 3; c++) frame[o + c] = Math.round(frame[o + c] * (1 - a) + patch[p + c] * a);
    }
}

export interface Truth {
  /** Per frame: the patch's centre, scale (1 = base size) and opacity, or null where it is not in shot. */
  path: Array<{ x: number; y: number; scale: number; opacity: number } | null>;
  /** The move's first and last frame (the frames where it starts and stops moving). */
  move?: { from: number; to: number; kind: "ease" | "linear" | "spring" | "scale" | "fade"; params?: Record<string, number> };
  cuts: number[];
  swaps: number[];
  base: number;
}

export interface Clip {
  name: string;
  frames: number;
  draw: (f: number) => Uint8Array;
  truth: Truth;
  /** ffmpeg setpts expression for a variable frame rate (frames keep these times); the drawing follows them. */
  setpts?: string;
  /** Each frame's real time, seconds (default frame / 30). */
  times?: number[];
  /** For a piece made at another rate inside this file: that rate, and the frames that repeat the one before. */
  madeAt?: number;
  repeats?: number[];
}

const BASE = 48;

function moveClip(name: string, frames: number, start: number, dur: number, from: [number, number], to: [number, number], curve: (t: number) => number, kind: "ease" | "linear" | "spring", params: Record<string, number>, bg: "flat" | "texture" = "flat"): Clip {
  const patch = patchTexture(BASE, 7), back = background(bg, 11), path: Truth["path"] = [];
  for (let f = 0; f < frames; f++) {
    const t = f <= start ? 0 : f >= start + dur ? 1 : (f - start) / dur, k = curve(t);
    path.push({ x: from[0] + (to[0] - from[0]) * k, y: from[1] + (to[1] - from[1]) * k, scale: 1, opacity: 1 });
  }
  return {
    name, frames,
    draw: (f) => { const fr = Uint8Array.from(back(f)); const p = path[f]!; place(fr, patch, BASE, p.x, p.y, 1, 1); return fr; },
    truth: { path, move: { from: start, to: start + dur, kind, params }, cuts: [], swaps: [], base: BASE },
  };
}

/** The clips the video tests use, with their truth. */
export function clips(): Clip[] {
  const out: Clip[] = [];
  out.push(moveClip("slide-ease", 60, 10, 24, [60, 108], [320, 108], (t) => aeEase(t, 0.33, 0.8), "ease", { outInfluence: 33, inInfluence: 80 }));
  out.push(moveClip("slide-linear", 60, 10, 20, [60, 108], [320, 108], (t) => t, "linear", {}));
  // a spring over a 1.2 s window: ζ 0.35, ω 12 rad/s (about 30 % overshoot, settled within 2 % by about 20 frames)
  const zeta = 0.35, omega = 12, sp = moveClip("slide-spring", 70, 10, 40, [60, 108], [260, 108], (t) => spring(t * (40 / FPS), zeta, omega), "spring", { zeta, omega });
  out.push(sp);
  // scale 1 -> 1.8 about the centre, eased; fade 0 -> 1, linear
  { const patch = patchTexture(BASE, 9), back = background("flat", 3), path: Truth["path"] = [];
    for (let f = 0; f < 50; f++) { const t = f <= 10 ? 0 : f >= 25 ? 1 : (f - 10) / 15; path.push({ x: 192, y: 108, scale: 1 + 0.8 * aeEase(t, 0.33, 0.33), opacity: 1 }); }
    out.push({ name: "scale", frames: 50, draw: (f) => { const fr = Uint8Array.from(back(f)); const p = path[f]!; place(fr, patch, BASE, p.x, p.y, p.scale, 1); return fr; },
      truth: { path, move: { from: 10, to: 25, kind: "scale", params: { scale: 1.8 } }, cuts: [], swaps: [], base: BASE } }); }
  { const patch = patchTexture(BASE, 13), back = background("flat", 5), path: Truth["path"] = [];
    for (let f = 0; f < 40; f++) { const t = f <= 8 ? 0 : f >= 20 ? 1 : (f - 8) / 12; path.push({ x: 192, y: 108, scale: 1, opacity: t }); }
    out.push({ name: "fade", frames: 40, draw: (f) => { const fr = Uint8Array.from(back(f)); const p = path[f]!; place(fr, patch, BASE, p.x, p.y, 1, p.opacity); return fr; },
      truth: { path, move: { from: 8, to: 20, kind: "fade" }, cuts: [], swaps: [], base: BASE } }); }
  // a hard cut at frame 30, and a one-frame swap at frame 45 (one frame of another shot inside the second shot)
  { const a = patchTexture(BASE, 21), b = patchTexture(BASE, 23), backA = background("flat", 1), backB = background("texture", 2), path: Truth["path"] = [];
    for (let f = 0; f < 70; f++) path.push(f < 30 ? { x: 120 + f, y: 100, scale: 1, opacity: 1 } : f === 45 ? null : { x: 260 - (f - 30), y: 120, scale: 1, opacity: 1 });
    out.push({ name: "cut-and-swap", frames: 70,
      draw: (f) => {
        if (f === 45) { const fr = new Uint8Array(W * H * 3).fill(200); place(fr, b, BASE, 100, 60, 1.5, 1); return fr; }
        const fr = Uint8Array.from(f < 30 ? backA(f) : backB(f)), p = path[f]!; place(fr, f < 30 ? a : b, BASE, p.x, p.y, 1, 1); return fr;
      },
      truth: { path, cuts: [30], swaps: [45], base: BASE } }); }
  // a variable frame rate: intervals alternate 1/30 + 8 ms and 1/30 - 8 ms; the move follows the frames' real times
  { const patch = patchTexture(BASE, 7), back = background("flat", 11), n = 60, times = Array.from({ length: n }, (_, i) => i / FPS + (i % 2) * 0.008), path: Truth["path"] = [];
    const a = 10 / FPS, b = 34 / FPS;
    for (let f = 0; f < n; f++) { const k = aeEase((times[f] - a) / (b - a), 0.33, 0.8); path.push({ x: 60 + 260 * k, y: 108, scale: 1, opacity: 1 }); }
    out.push({ name: "variable-rate", frames: n, times, setpts: `(N/${FPS}+mod(N\\,2)*0.008)/TB`,
      draw: (f) => { const fr = Uint8Array.from(back(f)); const p = path[f]!; place(fr, patch, BASE, p.x, p.y, 1, 1); return fr; },
      truth: { path, move: { from: 10, to: 34, kind: "ease", params: { outInfluence: 33, inInfluence: 80 } }, cuts: [], swaps: [], base: BASE } }); }
  // a 24 fps piece inside a 30 fps file: drawn at 24, shown at 30 by repeating every fifth frame (a pull-up)
  { const patch = patchTexture(BASE, 7), back = background("flat", 11), n = 75, src = (j: number) => Math.floor((j * 24) / FPS), path: Truth["path"] = [];
    const a = 8 / 24, b = 27 / 24;   // the move: 24 fps frames 8 to 27 (0.333 s to 1.125 s)
    for (let j = 0; j < n; j++) { const t = src(j) / 24, k = aeEase((t - a) / (b - a), 0.4, 0.6); path.push({ x: 60 + 260 * k, y: 108, scale: 1, opacity: 1 }); }
    const repeats = Array.from({ length: n }, (_, j) => j).filter((j) => j > 0 && src(j) === src(j - 1));
    out.push({ name: "pulled-up-24", frames: n, madeAt: 24, repeats,
      draw: (f) => { const fr = Uint8Array.from(back(f)); const p = path[f]!; place(fr, patch, BASE, p.x, p.y, 1, 1); return fr; },
      truth: { path, move: { from: 10, to: 34, kind: "ease", params: { outInfluence: 40, inInfluence: 60, startSeconds: a, endSeconds: b } }, cuts: [], swaps: [], base: BASE } }); }
  // an eased slide over a background that scrolls 3 px a frame: the tracker must follow the patch, not the ground
  out.push(moveClip("slide-over-moving-ground", 60, 10, 24, [60, 108], [320, 108], (t) => aeEase(t, 0.5, 0.5), "ease", { outInfluence: 50, inInfluence: 50 }, "texture"));
  return out;
}

/** Encode a clip with ffmpeg (H.264, yuv420p, quality high) into dir; null when ffmpeg is not installed. */
export async function writeClip(clip: Clip, dir: string, ffmpeg = ["ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]): Promise<string | null> {
  const file = path.join(dir, `${clip.name}.mp4`);
  const raw = Buffer.concat(Array.from({ length: clip.frames }, (_, f) => Buffer.from(clip.draw(f))));
  await fs.mkdir(dir, { recursive: true });
  for (const bin of ffmpeg) {
    const ok = await new Promise<boolean | null>((resolve) => {
      const p = execFile(bin, ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
        // a fine time base before and after the encoder, or the times round back to whole frames of 1/30
        ...(clip.setpts ? ["-vf", `settb=1/90000,setpts=${clip.setpts}`, "-fps_mode", "vfr", "-enc_time_base:v", "1:90000", "-video_track_timescale", "90000"] : []),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "12", "-g", "1000", file], (err) => {
        if (err && (err as NodeJS.ErrnoException).code === "ENOENT") resolve(null); else resolve(!err);
      });
      p.stdin?.end(raw);
    });
    if (ok === null) continue;
    return ok ? file : null;
  }
  return null;
}
