// Following one thing across a video's frames (stage 13): a template cut from the settled frame is matched in every
// frame by normalised cross-correlation (computed with an FFT) over a range of scales, at a working resolution, with a
// sub-pixel peak. Opacity is the regression slope of the matched window on the template (a fade over an unrelated
// ground scales the template's own contrast). Where the match fails while the thing is still there, the track says so
// and at which frame, and nothing past it is fitted. Rotation, skew, blur and colour are not measured, and the result
// says so.
/** In-place radix-2 FFT of (re, im), length a power of two; inverse when inv. */
export function fft(re, im, inv = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1)
            j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = ((inv ? 2 : -2) * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const a = i + k, b = a + len / 2, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
                re[b] = re[a] - xr;
                im[b] = im[a] - xi;
                re[a] += xr;
                im[a] += xi;
                const t = cr * wr - ci * wi;
                ci = cr * wi + ci * wr;
                cr = t;
            }
        }
    }
    if (inv)
        for (let i = 0; i < n; i++) {
            re[i] /= n;
            im[i] /= n;
        }
}
const pow2 = (n) => { let p = 1; while (p < n)
    p <<= 1; return p; };
/** 2-D FFT of a real W x H image into (re, im) of size P x Q (powers of two, zero-padded). */
function fft2(img, w, h, P, Q) {
    const re = new Float64Array(P * Q), im = new Float64Array(P * Q);
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
            re[y * P + x] = img[y * w + x];
    const rr = new Float64Array(P), ri = new Float64Array(P);
    for (let y = 0; y < Q; y++) {
        rr.set(re.subarray(y * P, y * P + P));
        ri.set(im.subarray(y * P, y * P + P));
        fft(rr, ri);
        re.set(rr, y * P);
        im.set(ri, y * P);
    }
    const cr = new Float64Array(Q), ci = new Float64Array(Q);
    for (let x = 0; x < P; x++) {
        for (let y = 0; y < Q; y++) {
            cr[y] = re[y * P + x];
            ci[y] = im[y * P + x];
        }
        fft(cr, ci);
        for (let y = 0; y < Q; y++) {
            re[y * P + x] = cr[y];
            im[y * P + x] = ci[y];
        }
    }
    return { re, im };
}
function ifft2(re, im, P, Q) {
    const cr = new Float64Array(Q), ci = new Float64Array(Q);
    for (let x = 0; x < P; x++) {
        for (let y = 0; y < Q; y++) {
            cr[y] = re[y * P + x];
            ci[y] = im[y * P + x];
        }
        fft(cr, ci, true);
        for (let y = 0; y < Q; y++) {
            re[y * P + x] = cr[y];
            im[y * P + x] = ci[y];
        }
    }
    const rr = new Float64Array(P), ri = new Float64Array(P);
    for (let y = 0; y < Q; y++) {
        rr.set(re.subarray(y * P, y * P + P));
        ri.set(im.subarray(y * P, y * P + P));
        fft(rr, ri, true);
        re.set(rr, y * P);
    }
    return re;
}
/** Resample a grey image to a new size (bilinear). */
export function resize(src, w, h, nw, nh) {
    const out = new Float64Array(nw * nh);
    for (let y = 0; y < nh; y++)
        for (let x = 0; x < nw; x++) {
            const sx = Math.min(w - 1, Math.max(0, ((x + 0.5) * w) / nw - 0.5)), sy = Math.min(h - 1, Math.max(0, ((y + 0.5) * h) / nh - 0.5));
            const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = sx - x0, fy = sy - y0;
            out[y * nw + x] = src[y0 * w + x0] * (1 - fx) * (1 - fy) + src[y0 * w + x1] * fx * (1 - fy) + src[y1 * w + x0] * (1 - fx) * fy + src[y1 * w + x1] * fx * fy;
        }
    return out;
}
/**
 * Best match of template t (tw x th) in frame f (fw x fh) over scales, by normalised cross-correlation. x, y: the
 * matched window's centre in frame pixels (sub-pixel); scale: of the template; opacity: the window's regression slope on
 * the (scaled) template, clamped 0..1.5. near: limit the search to a box round a point (x, y, radius).
 */
export function matchTemplate(f, fw, fh, t, tw, th, scales, near) {
    const P = pow2(fw), Q = pow2(fh), F = fft2(f, fw, fh, P, Q);
    // integral images of f and f^2 for window sums
    const I = new Float64Array((fw + 1) * (fh + 1)), I2 = new Float64Array((fw + 1) * (fh + 1));
    for (let y = 0; y < fh; y++) {
        let s = 0, s2 = 0;
        for (let x = 0; x < fw; x++) {
            const v = f[y * fw + x];
            s += v;
            s2 += v * v;
            I[(y + 1) * (fw + 1) + x + 1] = I[y * (fw + 1) + x + 1] + s;
            I2[(y + 1) * (fw + 1) + x + 1] = I2[y * (fw + 1) + x + 1] + s2;
        }
    }
    const box = (A, x, y, w, h) => A[(y + h) * (fw + 1) + x + w] - A[y * (fw + 1) + x + w] - A[(y + h) * (fw + 1) + x] + A[y * (fw + 1) + x];
    let best = null;
    for (const sc of scales) {
        const w = Math.max(4, Math.round(tw * sc)), h = Math.max(4, Math.round(th * sc));
        if (w >= fw || h >= fh)
            continue;
        const ts = resize(t, tw, th, w, h);
        let m = 0;
        for (let i = 0; i < ts.length; i++)
            m += ts[i];
        m /= ts.length;
        let tv = 0;
        for (let i = 0; i < ts.length; i++) {
            ts[i] -= m;
            tv += ts[i] * ts[i];
        }
        if (tv < 1e-6)
            continue;
        const T = fft2(ts, w, h, P, Q);
        // correlation: F * conj(T)
        const re = new Float64Array(P * Q), im = new Float64Array(P * Q);
        for (let i = 0; i < P * Q; i++) {
            re[i] = F.re[i] * T.re[i] + F.im[i] * T.im[i];
            im[i] = F.im[i] * T.re[i] - F.re[i] * T.im[i];
        }
        const c = ifft2(re, im, P, Q), n = w * h;
        const x0 = near ? Math.max(0, Math.floor(near.x - near.r - w / 2)) : 0, x1 = near ? Math.min(fw - w, Math.ceil(near.x + near.r - w / 2)) : fw - w;
        const y0 = near ? Math.max(0, Math.floor(near.y - near.r - h / 2)) : 0, y1 = near ? Math.min(fh - h, Math.ceil(near.y + near.r - h / 2)) : fh - h;
        const score = (x, y) => { const s = box(I, x, y, w, h), s2 = box(I2, x, y, w, h), v = s2 - (s * s) / n; return v > 1e-6 ? c[y * P + x] / Math.sqrt(v * tv) : -1; };
        let bx = -1, by = -1, bs = -2;
        for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++) {
                const s = score(x, y);
                if (s > bs) {
                    bs = s;
                    bx = x;
                    by = y;
                }
            }
        if (bx < 0 || (best && bs <= best.ncc))
            continue;
        const para = (a, b, cc) => { const den = a - 2 * b + cc; return Math.abs(den) > 1e-9 ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - cc)) / den)) : 0; };
        const dx = bx > 0 && bx < fw - w ? para(score(bx - 1, by), bs, score(bx + 1, by)) : 0, dy = by > 0 && by < fh - h ? para(score(bx, by - 1), bs, score(bx, by + 1)) : 0;
        const slope = c[by * P + bx] / tv; // the window regressed on the zero-mean template
        best = { x: bx + dx + w / 2, y: by + dy + h / 2, scale: sc, ncc: bs, opacity: Math.max(0, Math.min(1.5, slope)) };
    }
    return best;
}
/** Scales round s: a geometric set from lo to hi in n steps. */
export function scaleSet(lo, hi, n) {
    if (n <= 1 || hi <= lo)
        return [lo];
    return Array.from({ length: n }, (_, i) => lo * Math.pow(hi / lo, i / (n - 1)));
}
/** Refine a scale by a parabola through the scores at s / k, s and s * k. */
export function refineScale(f, fw, fh, t, tw, th, m, k = 1.02) {
    const lo = matchTemplate(f, fw, fh, t, tw, th, [m.scale / k], { x: m.x, y: m.y, r: 3 }), hi = matchTemplate(f, fw, fh, t, tw, th, [m.scale * k], { x: m.x, y: m.y, r: 3 });
    if (!lo || !hi)
        return m;
    const a = lo.ncc, b = m.ncc, c = hi.ncc, den = a - 2 * b + c;
    const off = Math.abs(den) > 1e-9 ? Math.max(-1, Math.min(1, (0.5 * (a - c)) / den)) : 0;
    return { ...m, scale: m.scale * Math.pow(k, off) };
}
//# sourceMappingURL=track.js.map