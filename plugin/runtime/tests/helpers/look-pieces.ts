// Pieces drawn for the look sheet's tests (stage 11): the same look in different arrangements. Each piece is 8 s at
// 30 fps on a paper ground with a navy card, a vermilion bar and a black badge (the black point); a card slides every
// second and the picture cuts to a new arrangement every 2.5 s (the rhythm). Pieces differ in grain (noise of 0, 6 and
// 14 levels: a measure that varies widely), and a softened piece differs in edge width alone.
import { aeEase, rng, type Clip, H, W } from "./video-clips.js";

const PAPER = [232, 226, 218], NAVY = [26, 48, 92], VERMILION = [222, 72, 42], BLACK = [0, 0, 0];

function rect(f: Uint8Array, x0: number, y0: number, w: number, h: number, c: number[]): void {
  for (let y = Math.max(0, Math.round(y0)); y < Math.min(H, Math.round(y0 + h)); y++)
    for (let x = Math.max(0, Math.round(x0)); x < Math.min(W, Math.round(x0 + w)); x++) { const o = (y * W + x) * 3; f[o] = c[0]; f[o + 1] = c[1]; f[o + 2] = c[2]; }
}

/** A 3 x 3 box blur, `passes` times (a softer picture: wider edges, the same colours and levels). */
function soften(f: Uint8Array, passes: number): Uint8Array {
  let a = f;
  for (let p = 0; p < passes; p++) {
    const b = new Uint8Array(a.length);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue; s += a[(yy * W + xx) * 3 + c]; n++; }
      b[(y * W + x) * 3 + c] = Math.round(s / n);
    }
    a = b;
  }
  return a;
}

/** A piece: `seed` places its arrangements, `noise` its grain (levels), `soft` its blur passes. */
export function lookPiece(name: string, seed: number, noise = 0, soft = 0): Clip {
  const frames = 240, shotFrames = 75, r = rng(seed);
  // shots alternate between two pictures (a cut is a different picture, not the same one moved: the card and the bar
  // swap colour and size), each placed a little differently in each piece
  const layouts = Array.from({ length: Math.ceil(frames / shotFrames) }, (_, i) => {
    const l = { card: [40 + r() * 30, 40 + r() * 30], bar: [220 + r() * 30, 150 + r() * 20], badge: [300 + r() * 30, 30 + r() * 20], slide: r() < 0.5 ? 1 : -1, swap: i % 2 === 1 };
    return l;
  });
  const noiseAt = rng(seed * 7 + 1);
  return {
    name, frames,
    draw: (f) => {
      const L = layouts[Math.floor(f / shotFrames)], k = f % 30;
      // a card slide every second: 50 px over 8 frames, eased; it comes back at the next second
      const t = Math.min(1, k / 8), dx = (Math.floor(f / 30) % 2 ? 1 - aeEase(t, 0.4, 0.7) : aeEase(t, 0.4, 0.7)) * 50 * L.slide;
      const fr = new Uint8Array(W * H * 3);
      rect(fr, 0, 0, W, H, PAPER);
      if (!L.swap) { rect(fr, L.card[0] + dx, L.card[1], 130, 90, NAVY); rect(fr, L.bar[0], L.bar[1], 120, 26, VERMILION); }
      else { rect(fr, L.card[0] + 150 + dx, L.card[1] + 20, 70, 120, VERMILION); rect(fr, L.bar[0] - 190, L.bar[1] - 10, 150, 36, NAVY); }
      rect(fr, L.badge[0], L.badge[1], 36, 26, BLACK);
      const out = soft ? soften(fr, soft) : fr;
      if (noise) for (let i = 0; i < out.length; i++) out[i] = Math.max(0, Math.min(255, Math.round(out[i] + (noiseAt() * 2 - 1) * noise)));
      return out;
    },
    truth: { path: [], cuts: [75, 150, 225], swaps: [], base: 0 },
  };
}

/** Three pieces of one look (grain wide apart), and a fourth like the first but softer. */
export function lookPieces(): Clip[] {
  return [lookPiece("look-a", 11, 0), lookPiece("look-b", 23, 6), lookPiece("look-c", 37, 14), lookPiece("look-soft", 41, 0, 2)];
}
