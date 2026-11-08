#!/usr/bin/env node
// glass.mjs: real footage (or one still) -> a leaded stained-glass panel for AESStainedGlass. The frame is cut the way a glazier leads a
// figure, by what each part is: skin is one flesh pane (with a darker pane for beard, hair and shadow), bright things are white glass,
// clothes deep murrey, foliage green, the room cobalt ground cut into hand-jittered lozenge quarries. Small pieces join their neighbours,
// every place two pieces meet gets a lead came, each piece takes its own slight shade and darkens by its lead, and the face is painted
// back in dark brown grisaille trace lines from the unsmoothed frame. Light, glow and glass texture are added in After Effects.
// Output: an mp4 stepping at 8 fps (the medium's rate: glass moves piece by piece) or a png when --still is given.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node glass.mjs --in clip.mp4 --out glass.mp4 [--ss 4.0 --t 1.6] [--crop x,y,w,h] [--w 560 --h 560] [--fps 8] [--still]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flag = k => A.includes('--' + k);
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node glass.mjs --in <video|image> --out <file.mp4|file.png> [options]'); process.exit(2); }
const W = +arg('w', 560), H = +arg('h', 560), FPS = +arg('fps', 8), cr = arg('crop', null), c = cr ? cr.split(',') : null;
const still = flag('still') || /\.png$/i.test(OUT), SS = String(arg('ss', 0)), T = String(arg('t', 1.6));
const hex = h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
// the glass: [colour, role]; role "ground" pieces are cut into quarries, "skin" pieces take grisaille. Few colours, flat panes.
const GLASS = [['2047B0', 'ground'], ['C4926E', 'skin'], ['C08A66', 'skin'], ['7E4A33', 'skin'], ['D0D8C4', 'figure'], ['4A1C38', 'figure'], ['2F7F3C', 'figure']].map(([h, r]) => ({ c: hex(h), r }));
const LEAD = [18, 16, 15], BROWN = [62, 34, 20];

function decode(vf, ch) {   // raw frames from ffmpeg: rgb24 (ch 3) or gray (ch 1)
  const pre = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},`;
  const args = ['-v', 'error', '-ss', SS, ...(still ? [] : ['-t', T]), '-i', IN, '-vf', pre + vf + (still ? '' : `,fps=${FPS}`), ...(still ? ['-frames:v', '1'] : []),
    '-f', 'rawvideo', '-pix_fmt', ch === 3 ? 'rgb24' : 'gray', '-'];
  const r = spawnSync('ffmpeg', args, { maxBuffer: 2 ** 30 }); if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
  const n = W * H * ch, out = []; for (let o = 0; o + n <= r.stdout.length; o += n) out.push(r.stdout.subarray(o, o + n)); return out; }
// pieces come from a heavily smoothed frame, classified by what each part is (skin, bright, dark, foliage, room) and skin cut into three tones
const smooth = decode('median=radius=4,gblur=sigma=2.5', 3);
const detail = decode('format=gray,gblur=sigma=1.2', 1);

function rnd(seed) { let s = (seed * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
function boxBlur(src, r) {   // separable box blur of a Float32Array W*H
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H), k = 2 * r + 1;
  for (let y = 0; y < H; y++) { let s = 0; for (let x = -r; x <= r; x++) s += src[y * W + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) { tmp[y * W + x] = s / k; s += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)]; } }
  for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) { out[y * W + x] = s / k; s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
  return out; }

function frame(rgb, gray) {
  const N = W * H, lab = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const r = rgb[3 * i], g = rgb[3 * i + 1], b = rgb[3 * i + 2], L = (.3 * r + .59 * g + .11 * b) / 255;
    let k = 0;                                                                        // the room: cobalt ground
    if (r > g && g >= b - 4 && r - b > 40 && L > .1) { if (L > .5) k = 1; else k = 3; }   // skin: one flesh pane, beard and shadow a darker one
    else if (L > .62) k = 4;                                                          // bright things: white glass
    else if (L < .15) k = 5;                                                          // hair and clothes: deep murrey
    else if (g > r + 8 && g > b + 8) k = 6;                                           // foliage: green
    lab[i] = k; }
  // a 7x7 majority pass removes specks and rounds the cuts
  const m = new Uint8Array(N), h = new Int32Array(GLASS.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { h.fill(0);
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) h[lab[Math.min(H - 1, Math.max(0, y + j)) * W + Math.min(W - 1, Math.max(0, x + i))]]++;
    let b = lab[y * W + x]; for (let k = 0; k < h.length; k++) if (h[k] > h[b]) b = k; m[y * W + x] = b; }
  // connected pieces; a piece under 500 px joins the neighbour it touches most (one colour = one piece, no crumbs)
  const comp = new Int32Array(N).fill(-1), size = [], stack = [];
  for (let s = 0; s < N; s++) { if (comp[s] >= 0) continue; const id = size.length; let n = 0; comp[s] = id; stack.push(s);
    while (stack.length) { const p = stack.pop(); n++; const x = p % W, y = (p - x) / W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && comp[q] < 0 && m[q] === m[p]) { comp[q] = id; stack.push(q); } }
    size.push(n); }
  for (let pass = 0; pass < 3; pass++) { const vote = new Map();
    for (let p = 0; p < N; p++) { if (size[comp[p]] >= 300) continue; const x = p % W, y = (p - x) / W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && comp[q] !== comp[p]) {
        const key = comp[p], v = vote.get(key) || new Map(); v.set(comp[q], (v.get(comp[q]) || 0) + 1); vote.set(key, v); } }
    const into = new Map(); for (const [k, v] of vote) { let b = -1, bn = 0; for (const [q, n] of v) if (n > bn && size[q] >= size[k]) { bn = n; b = q; } if (b >= 0) into.set(k, b); }
    const colOf = new Int32Array(size.length); for (let p = 0; p < N; p++) colOf[comp[p]] = m[p];
    for (let p = 0; p < N; p++) if (into.has(comp[p])) { const t = into.get(comp[p]); m[p] = colOf[t]; size[t] += 0; comp[p] = t; }
    for (let k = 0; k < size.length; k++) size[k] = 0; for (let p = 0; p < N; p++) size[comp[p]]++; }
  // the big ground is cut into jittered lozenge quarries (tall diamonds), each its own shade
  const QX = 64, QY = 92, quarry = new Int32Array(N).fill(-1), seam = new Uint8Array(N);
  for (let p = 0; p < N; p++) { if (GLASS[m[p]].r !== 'ground' || size[comp[p]] < 6000) continue; const x = p % W, y = (p - x) / W;
    const u = x / QX + y / QY + .08 * Math.sin(y * .05), v = x / QX - y / QY + .08 * Math.sin(x * .045), fu = u - Math.floor(u), fv = v - Math.floor(v);
    quarry[p] = (Math.floor(u) + 50) * 1000 + Math.floor(v) + 500; if (fu < .045 || fv < .045) seam[p] = 1; }
  // leads: wherever two pieces meet (and along quarry seams), about 6 px wide, with a soft edge
  const lead = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x;
    if (seam[p] || (x < W - 1 && m[p] !== m[p + 1]) || (y < H - 1 && m[p] !== m[p + W])) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      if (i * i + j * j > 8) continue; const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < W && yy < H) lead[yy * W + xx] = 1; } }
  const leadAA = boxBlur(lead, 1), aged = boxBlur(lead, 9);
  // grisaille: trace lines where the frame is locally darker than its surroundings, on skin pieces only
  const g = new Float32Array(N); for (let p = 0; p < N; p++) g[p] = gray[p] / 255; const gb = boxBlur(g, 9), sob = new Float32Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const p = y * W + x, gx = g[p + 1 - W] + 2 * g[p + 1] + g[p + 1 + W] - g[p - 1 - W] - 2 * g[p - 1] - g[p - 1 + W], gy = g[p + W - 1] + 2 * g[p + W] + g[p + W + 1] - g[p - W - 1] - 2 * g[p - W] - g[p - W + 1]; sob[p] = Math.hypot(gx, gy); }
  const shade = new Map(), out = Buffer.alloc(N * 3);
  for (let p = 0; p < N; p++) { const k = quarry[p] >= 0 ? 1e7 + quarry[p] : comp[p];
    if (!shade.has(k)) { const r = rnd(k % 100000 + 7); shade.set(k, [.9 + r() * .18, (r() - .5) * .08]); }
    const [b, hu] = shade.get(k), col = GLASS[m[p]].c; let r = col[0] * b * (1 + hu), gg = col[1] * b, bl = col[2] * b * (1 - hu);
    const age = 1 - .32 * Math.min(1, aged[p] * 1.6); r *= age; gg *= age; bl *= age;
    if (GLASS[m[p]].r === 'skin') { const dark = m[p] < 3 ? Math.max(0, (.36 - g[p]) * 5) : 0, a = Math.min(.9, Math.max(0, (gb[p] - g[p] - .02) * 8, dark, (gb[p] > g[p] ? (sob[p] - .28) * 3 : 0)));   // trace lines only: eyes, brows, nostrils, mouth
      r = r * (1 - a) + BROWN[0] * a; gg = gg * (1 - a) + BROWN[1] * a; bl = bl * (1 - a) + BROWN[2] * a; }
    const L = leadAA[p]; out[3 * p] = Math.min(255, r * (1 - L) + LEAD[0] * L); out[3 * p + 1] = Math.min(255, gg * (1 - L) + LEAD[1] * L); out[3 * p + 2] = Math.min(255, bl * (1 - L) + LEAD[2] * L); }
  return out; }

const frames = smooth.map((f, i) => frame(f, detail[Math.min(i, detail.length - 1)]));
const enc = ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];
if (still) enc.push('-frames:v', '1'); else enc.push('-an', '-c:v', 'libx264', '-crf', '10', '-pix_fmt', 'yuv420p');
const r = spawnSync('ffmpeg', [...enc, OUT], { input: Buffer.concat(frames), maxBuffer: 2 ** 28 });
if (r.status) { console.error('ffmpeg failed encoding\n' + r.stderr); process.exit(1); }
console.log(OUT);
