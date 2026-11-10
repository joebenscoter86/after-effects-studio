#!/usr/bin/env node
// blocks.mjs: real footage (or one still) -> the blocks of a woodblock portrait (okubi-e) for AESUkiyoe. A print is cut as separate
// blocks, so this writes one grey matte per block (white = where that block prints): the sumi key block (outlines and the face in a few
// strokes), the flesh block, the sumi hair block, the blue-grey stubble block, the garment block, and the figure (everything that is not
// ground, so the ground's bokashi can be printed around it). Colour, registration, woodgrain and bokashi are added in After Effects.
// The frame is cut by what each part is (no shading: ukiyo-e has none): flesh is one flat pane, hair and garment are flat, the beard is a
// pale blue-grey shaved-skin block, the room is dropped. The crop is scaled to the print's width and padded: ground above the head,
// the garment carried down to the bottom border.
// Output: an mp4 stepping at 8 fps (figures in this medium move on eights) or a png when --still is given. --block preview writes a flat
// colour composite for checking by eye.
// Needs Node 20+ and ffmpeg. No npm packages.
//
//   node blocks.mjs --in clip.mp4 --out key.mp4 --block key|flesh|hair|beard|cloth|figure|preview
//                   [--ss 4.0 --t 1.6] [--crop x,y,w,h] [--w 908 --h 1650 --top 150] [--fps 8] [--still]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flag = k => A.includes('--' + k);
const IN = arg('in'), OUT = arg('out'), BLOCK = arg('block', 'preview');
if (!IN || !OUT) { console.error('usage: node blocks.mjs --in <video|image> --out <file.mp4|file.png> --block <name> [options]'); process.exit(2); }
const W = +arg('w', 908), H = +arg('h', 1650), TOP = +arg('top', 150), FPS = +arg('fps', 8), cr = arg('crop', '305,1088,520,832').split(',').map(Number);
const still = flag('still') || /\.png$/i.test(OUT), SS = String(arg('ss', 0)), T = String(arg('t', 1.6));
const CW = W, CH = Math.round(cr[3] * W / cr[2]);                   // the crop scaled to the print's width
const BLOCKS = ['figure', 'flesh', 'hair', 'beard', 'cloth', 'key'];
if (BLOCK !== 'preview' && !BLOCKS.includes(BLOCK)) { console.error('unknown block ' + BLOCK + '; one of ' + BLOCKS.join(', ') + ', preview'); process.exit(2); }

function decode(vf, ch) {   // raw frames from ffmpeg at the crop's scaled size: rgb24 (ch 3) or gray (ch 1)
  const args = ['-v', 'error', '-ss', SS, ...(still ? [] : ['-t', T]), '-i', IN, '-vf', `crop=${cr[2]}:${cr[3]}:${cr[0]}:${cr[1]},scale=${CW}:${CH}:flags=lanczos,` + vf + (still ? '' : `,fps=${FPS}`),
    ...(still ? ['-frames:v', '1'] : []), '-f', 'rawvideo', '-pix_fmt', ch === 3 ? 'rgb24' : 'gray', '-'];
  const r = spawnSync('ffmpeg', args, { maxBuffer: 2 ** 30 }); if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
  const n = CW * CH * ch, out = []; for (let o = 0; o + n <= r.stdout.length; o += n) out.push(r.stdout.subarray(o, o + n)); return out; }
const smooth = decode('median=radius=4,gblur=sigma=2', 3), detail = decode('format=gray,gblur=sigma=1.1', 1);

function blur(src, w, h, r) {   // separable box blur of a Float32Array w*h
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), k = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { tmp[y * w + x] = s / k; s += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = s / k; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  return out; }
const soft = (m, w, h, r, lo, hi) => { const b = blur(m, w, h, r), o = new Float32Array(w * h); for (let i = 0; i < o.length; i++) o[i] = Math.min(1, Math.max(0, (b[i] - lo) / (hi - lo))); return o; };
function components(mask, w, h) {   // 4-connected components of a 0/1 mask: { id: Int32Array, size: [] }
  const id = new Int32Array(w * h).fill(-1), size = [], st = [];
  for (let s = 0; s < w * h; s++) { if (!mask[s] || id[s] >= 0) continue; const c = size.length; let n = 0; id[s] = c; st.push(s);
    while (st.length) { const p = st.pop(); n++; const x = p % w, y = (p - x) / w;
      if (x > 0 && mask[p - 1] && id[p - 1] < 0) { id[p - 1] = c; st.push(p - 1); } if (x < w - 1 && mask[p + 1] && id[p + 1] < 0) { id[p + 1] = c; st.push(p + 1); }
      if (y > 0 && mask[p - w] && id[p - w] < 0) { id[p - w] = c; st.push(p - w); } if (y < h - 1 && mask[p + w] && id[p + w] < 0) { id[p + w] = c; st.push(p + w); } }
    size.push(n); }
  return { id, size }; }
function keepBig(mask, w, h, min) { const { id, size } = components(mask, w, h), o = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) if (id[p] >= 0 && size[id[p]] >= min) o[p] = 1; return o; }
function fillHoles(mask, w, h) {   // background reachable from the border stays background; every enclosed hole joins the mask
  const inv = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) inv[p] = mask[p] ? 0 : 1;
  const { id } = components(inv, w, h), edge = new Set();
  for (let x = 0; x < w; x++) { edge.add(id[x]); edge.add(id[(h - 1) * w + x]); } for (let y = 0; y < h; y++) { edge.add(id[y * w]); edge.add(id[y * w + w - 1]); }
  const o = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) o[p] = mask[p] || !edge.has(id[p]) ? 1 : 0; return o; }
function close(mask, w, h, r) {   // morphological close (blur then threshold), smooths a cut into a woodblock contour
  const f = new Float32Array(w * h); for (let p = 0; p < w * h; p++) f[p] = mask[p];
  const a = blur(f, w, h, r), d = new Float32Array(w * h); for (let p = 0; p < w * h; p++) d[p] = a[p] > .2 ? 1 : 0;
  const b = blur(d, w, h, r), o = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) o[p] = b[p] > .8 ? 1 : 0; return o; }

function frame(rgb, gray) {
  const w = CW, h = CH, N = w * h, L = new Float32Array(N), skin = new Uint8Array(N), dark = new Uint8Array(N);
  for (let p = 0; p < N; p++) { const r = rgb[3 * p], g = rgb[3 * p + 1], b = rgb[3 * p + 2], mx = Math.max(r, g, b), sat = mx ? (mx - Math.min(r, g, b)) / mx : 0;
    L[p] = (.3 * r + .59 * g + .11 * b) / 255;
    if (r > g && g >= b - 6 && sat > .27 && L[p] > .36 && r - b > 30) skin[p] = 1;            // flesh: warm, saturated, light (the chair is paler, the shelf darker)
    if (L[p] < .2 && b < r + 5) dark[p] = 1; }                                               // hair and clothes: near black and not the navy wall
  // the face: the biggest flesh piece; its box steers hair (above the brow line) from garment (below the jaw)
  const sk = keepBig(close(skin, w, h, 3), w, h, 3000), sc = components(sk, w, h);
  let big = -1; for (let k = 0; k < sc.size.length; k++) if (big < 0 || sc.size[k] > sc.size[big]) big = k;
  let x0 = w, x1 = 0, y0 = h, y1 = 0; for (let p = 0; p < N; p++) if (sc.id[p] === big) { const x = p % w, y = (p - x) / w; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  // the face's centre and width from the brow band (above the ears, which widen one side): the head is about that wide plus its hair
  let cs = 0, ws = 0, nr = 0; for (let y = Math.round(y0 + (y1 - y0) * .15); y < y0 + (y1 - y0) * .4; y += 2) { let a = w, b = 0;
    for (let x = 0; x < w; x++) if (sc.id[y * w + x] === big) { if (x < a) a = x; if (x > b) b = x; } if (b > a) { cs += (a + b) / 2; ws += b - a; nr++; } }
  const fh = y1 - y0, fcx = nr ? cs / nr : (x0 + x1) / 2, fw = nr ? ws / nr : x1 - x0;
  // the face hull: each row of the face between its outermost flesh pixels (the jaw's shadow, eyes and mouth sit inside it)
  const hull = new Uint8Array(N), ra = new Int32Array(h).fill(-1), rb = new Int32Array(h).fill(-1);
  for (let y = y0; y <= y1; y++) { for (let x = 0; x < w; x++) if (sc.id[y * w + x] === big) { if (ra[y] < 0) ra[y] = x; rb[y] = x; } if (ra[y] >= 0) for (let x = ra[y]; x <= rb[y]; x++) hull[y * w + x] = 1; }
  // the figure: flesh plus dark pieces that touch it (hair, garment), the room dropped, holes (eyes, mouth, shadows) filled. Dark pieces may
  // join only where a head or body can be: the hair a little wider than the brow, at the cheeks the face's own rows (plus a sideburn),
  // below the jaw a neck that widens into shoulders. This drops the room's shelves, wall, chair and props.
  const yb = Math.round(y0 + fh * .15), y3 = y0 + fh * .3, ys = y1 + fh * .06;
  function span(y) { if (y < y3) { const r = y < yb ? yb : y; return [Math.min(ra[r], fcx - fw * .5) - fw * .22, Math.max(rb[r], fcx + fw * .5) + fw * .22]; }
    if (y <= y1 && ra[y] >= 0) return [ra[y] - fw * .05, rb[y] + fw * .05];
    const hw = fw * .42 + Math.max(0, y - ys) * 2.4; return [fcx - hw, fcx + hw]; }
  const fig0 = new Uint8Array(N);
  for (let y = 0; y < h; y++) { const s2 = span(y); for (let x = 0; x < w; x++) { const p = y * w + x; if ((dark[p] && x >= s2[0] && x <= s2[1]) || (sk[p] && x >= Math.min(s2[0], fcx - fw * .95) && x <= Math.max(s2[1], fcx + fw * .95))) fig0[p] = 1; } }
  const fc = components(close(fig0, w, h, 4), w, h), votes = new Map();                     // the face's piece, and the body below the jaw
  for (let p = 0; p < N; p++) if (sc.id[p] === big && fc.id[p] >= 0) votes.set(fc.id[p], (votes.get(fc.id[p]) || 0) + 1);
  for (let k = 0; k < fc.size.length; k++) if (fc.size[k] > 20000) votes.set(k, (votes.get(k) || 0) + 1);
  const fig1 = new Uint8Array(N); for (let p = 0; p < N; p++) fig1[p] = fc.id[p] >= 0 && votes.has(fc.id[p]) ? 1 : 0;
  const fig = close(fillHoles(fig1, w, h), w, h, 6);
  // the beard: busy (stubble) or dark inside the lower face, rounded into one soft block: a pale blue-grey shaved-skin tint, no texture
  const g = new Float32Array(N); for (let p = 0; p < N; p++) g[p] = gray[p] / 255;
  const gm = blur(g, w, h, 3), g2 = new Float32Array(N); for (let p = 0; p < N; p++) g2[p] = (g[p] - gm[p]) ** 2;
  const vr = blur(g2, w, h, 6), bz = new Float32Array(N);
  for (let p = 0; p < N; p++) { const y = (p - p % w) / w; if (hull[p] && y > y0 + fh * .5 && (vr[p] > .00012 || L[p] < .3)) bz[p] = 1; }
  const bs = blur(bz, w, h, 18), bd0 = new Uint8Array(N); for (let p = 0; p < N; p++) bd0[p] = bs[p] > .36 ? 1 : 0;
  const beard = close(fillHoles(keepBig(bd0, w, h, 4000), w, h), w, h, 12);
  const flesh = fillHoles(sk, w, h), lab = new Uint8Array(N);                               // 0 ground, 1 flesh, 2 hair, 3 beard, 4 garment
  for (let p = 0; p < N; p++) { if (!fig[p]) continue; const y = (p - p % w) / w;
    if (beard[p] && (hull[p] || flesh[p])) { lab[p] = 3; continue; }
    if (flesh[p] || (hull[p] && !(dark[p] && y < y0 + fh * .25))) { lab[p] = 1; continue; }
    const x = p % w; if (y > y0 + fh * .5 && y <= y1 && x >= ra[y] - fw * .06 && x <= rb[y] + fw * .06) { lab[p] = 3; continue; }   // the jaw's shadowed edge is beard
    lab[p] = y < y0 + fh * .55 ? 2 : 4; }
  // the key block: contours where blocks meet (not flesh to beard, which is colour only), and the face in a few strokes
  const key = new Float32Array(N);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const p = y * w + x, a = lab[p], b2 = lab[p + 1], c = lab[p + w];
    const cut = (u, v) => u !== v && !((u === 1 && v === 3) || (u === 3 && v === 1));
    if (cut(a, b2) || cut(a, c)) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) key[p + j * w + i] = 1; }
  // features: where the frame is clearly darker than its neighbourhood, on flesh only (eyes, brows, nostrils, mouth, ear), small specks dropped
  const gb = blur(g, w, h, 7), gB = blur(g, w, h, 16), feat = new Uint8Array(N);
  for (let p = 0; p < N; p++) if ((lab[p] === 1 && (gb[p] - g[p] > .07 || gB[p] - g[p] > .075) && g[p] < .55) || (lab[p] === 3 && gb[p] - g[p] > .12 && g[p] < .4)) feat[p] = 1;
  const fk = keepBig(feat, w, h, 50); for (let p = 0; p < N; p++) if (fk[p]) key[p] = 1;
  const keyS = soft(key, w, h, 1, .25, .6);
  const out = {}; for (const bl of BLOCKS) out[bl] = new Float32Array(N);
  for (let p = 0; p < N; p++) { out.figure[p] = fig[p]; out.flesh[p] = lab[p] === 1 || lab[p] === 3 ? 1 : 0; out.hair[p] = lab[p] === 2 ? 1 : 0;
    out.beard[p] = lab[p] === 3 ? 1 : 0; out.cloth[p] = lab[p] === 4 ? 1 : 0; out.key[p] = keyS[p]; }
  for (const bl of ['figure', 'flesh', 'hair', 'beard', 'cloth']) out[bl] = soft(out[bl], w, h, 1, .3, .7);
  return out; }

// place the scaled crop in the print: ground above the head (TOP px), the garment carried down to the bottom border
function place(m) { const o = new Float32Array(W * H);
  for (let y = 0; y < H; y++) { const sy = Math.min(CH - 1, y - TOP); if (sy < 0) continue; for (let x = 0; x < W; x++) o[y * W + x] = m[sy * CW + x]; } return o; }
const COL = { ground: [232, 222, 200], flesh: [244, 214, 190], hair: [30, 28, 32], beard: [150, 162, 172], cloth: [42, 64, 110], key: [22, 20, 24] };
const frames = [];
for (let i = 0; i < smooth.length; i++) { const f = frame(smooth[i], detail[Math.min(i, detail.length - 1)]);
  if (BLOCK !== 'preview') { const m = place(f[BLOCK]), b = Buffer.alloc(W * H); for (let p = 0; p < W * H; p++) b[p] = Math.round(m[p] * 255); frames.push(b); continue; }
  const b = Buffer.alloc(W * H * 3), pl = {}; for (const k of BLOCKS) pl[k] = place(f[k]);
  for (let p = 0; p < W * H; p++) { let c = COL.ground.slice();
    for (const k of ['flesh', 'hair', 'beard', 'cloth', 'key']) { const a = pl[k][p]; if (a) c = c.map((v, j) => v * (1 - a) + COL[k][j] * a); }
    b[3 * p] = c[0]; b[3 * p + 1] = c[1]; b[3 * p + 2] = c[2]; }
  frames.push(b); }
const pix = BLOCK === 'preview' ? 'rgb24' : 'gray', enc = ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', pix, '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];
if (still) enc.push('-frames:v', '1'); else enc.push('-an', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p');
const r = spawnSync('ffmpeg', [...enc, OUT], { input: Buffer.concat(frames), maxBuffer: 2 ** 30 });
if (r.status) { console.error('ffmpeg failed encoding\n' + r.stderr); process.exit(1); }
console.log(OUT);
