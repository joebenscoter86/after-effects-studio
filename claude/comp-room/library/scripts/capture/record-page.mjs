// record-page.mjs: record a web page as a smooth, deterministic clip.
// Read the `page-recording` technique first (techniques/page-recording.md).
//
// The page's clock is replaced before any of its scripts run: performance.now, Date,
// requestAnimationFrame, setTimeout/setInterval and every Web Animation (CSS animations
// and transitions included) advance only when this script ticks them, in steps of
// 1/(2*fps) s (1/60 s at the default 30 fps). The scroll position is set before every
// tick from a keyframed curve; a screenshot is taken every second tick and piped to
// ffmpeg as PNG. Real time never shows in the clip, so a slow machine still gives an
// even 30 fps with no dropped or doubled frames.
//
// Usage:
//   node record-page.mjs <config.json> [--out clip.mp4] [--probe dir]
//
// Config (JSON):
//   url        page to record (a local server is best; see the technique)
//   w, h       viewport in CSS pixels           dsf     device scale factor (default 1)
//   mobile     true: mobile viewport and touch  dur     clip length in seconds
//   fps        output frame rate (default 30; the clock ticks twice per frame)
//   warm       seconds of page time to run at the start scroll before frame 0 (default 0)
//   keys       scroll keyframes [[t, y], ...] in seconds and CSS pixels; monotone cubic,
//              still at both ends unless endVel is true (keeps moving at the last key)
//   crf        x264 quality (default 12)       epoch   virtual Date at t=0 (ms, default fixed)
//   out        mp4 to write                     probe   { dir, times: [t, ...] } PNG stills only
//   chrome     optional path to a Chromium/Chrome executable (or set CHROME_PATH)
//
// Needs: Node 18+, playwright-core (or playwright) with a Chromium build installed
// (`npx playwright install chromium`), and ffmpeg on PATH.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
if (!args[0] || args[0].startsWith('--')) {
  console.error('Usage: node record-page.mjs <config.json> [--out clip.mp4] [--probe dir]');
  process.exit(2);
}
const flag = name => { const i = args.indexOf(name); return i > 0 ? args[i + 1] : undefined; };
const cfg = JSON.parse(fs.readFileSync(args[0], 'utf8'));
if (flag('--out')) cfg.out = flag('--out');
if (flag('--probe')) cfg.probe = { dir: flag('--probe'), times: cfg.probe?.times || [0, cfg.dur / 2, cfg.dur - 1 / (cfg.fps || 30)] };
for (const k of ['url', 'w', 'h', 'dur']) if (cfg[k] === undefined) { console.error(`config is missing "${k}"`); process.exit(2); }
if (!cfg.out && !cfg.probe) { console.error('config needs "out" (a clip) or "probe" (stills)'); process.exit(2); }

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { try { ({ chromium } = await import('playwright')); }
  catch { console.error('Install playwright-core next to this script or in the working folder: npm i playwright-core'); process.exit(2); } }

const FPS = cfg.fps || 30;
const TICK = 1000 / (2 * FPS);
const DSF = cfg.dsf || 1;

// Scroll curve: monotone cubic Hermite (Fritsch-Carlson), zero velocity at both ends
// unless endVel. Monotone means no overshoot between keys, so the page never scrolls back.
function makeCurve(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  if (n === 1) return () => ys[0];
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  if (cfg.endVel) m[n - 1] = d[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return t => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (t - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}
const scrollAt = makeCurve(cfg.keys || [[0, 0]]);

// Runs in the page before its own scripts. Keeps one real rAF for "let the page paint".
const INIT = `(() => {
  const realRAF = window.requestAnimationFrame.bind(window);
  window.__realFrame = () => new Promise(r => realRAF(() => r()));
  let vt = 0; const epoch = ${Number(cfg.epoch) || 1762900000000};
  const OD = Date;
  performance.now = () => vt;
  class VDate extends OD { constructor(...a) { if (a.length === 0) super(epoch + vt); else super(...a); } static now() { return epoch + vt; } }
  window.Date = VDate;
  let rafQ = [], rafId = 1, timers = [], tid = 1;
  window.requestAnimationFrame = cb => { const id = rafId++; rafQ.push({ id, cb }); return id; };
  window.cancelAnimationFrame = id => { rafQ = rafQ.filter(r => r.id !== id); };
  window.setTimeout = (cb, ms = 0, ...args) => { const id = tid++; timers.push({ id, t: vt + Math.max(0, +ms || 0), cb, args }); return id; };
  window.setInterval = (cb, ms = 0, ...args) => { const id = tid++; const iv = Math.max(1, +ms || 0); timers.push({ id, t: vt + iv, cb, args, iv }); return id; };
  window.clearTimeout = window.clearInterval = id => { timers = timers.filter(x => x.id !== id); };
  const run = (f, a) => { try { typeof f === 'function' ? f(...(a || [])) : 0; } catch (e) { console.error('vclock cb error', e && e.stack || e); } };
  window.__tick = dt => {
    vt += dt;
    for (let guard = 0; guard < 1000; guard++) {
      let best = null; for (const x of timers) if (x.t <= vt && (!best || x.t < best.t)) best = x;
      if (!best) break;
      if (best.iv) best.t += best.iv; else timers = timers.filter(x => x !== best);
      run(best.cb, best.args);
    }
    const q = rafQ; rafQ = [];
    for (const r of q) run(r.cb, [vt]);
    for (const a of document.getAnimations()) {
      if (!a.__v) { a.__v = { t0: vt - (a.currentTime || 0) }; try { a.pause(); } catch (e) {} }
      try { a.currentTime = vt - a.__v.t0; } catch (e) {}
    }
    return vt;
  };
  const css = 'html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}html,body{scrollbar-width:none!important}html{scroll-behavior:auto!important}*{cursor:none!important;caret-color:transparent!important}';
  const add = () => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();`;

const gpu = process.platform === 'darwin' ? ['--use-angle=metal'] : [];
const executablePath = cfg.chrome || process.env.CHROME_PATH || undefined;
const browser = await chromium.launch({
  executablePath, headless: true,
  args: [...gpu, '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--force-color-profile=srgb',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: DSF,
  reducedMotion: 'no-preference', isMobile: !!cfg.mobile, hasTouch: !!cfg.mobile });
await ctx.addInitScript(INIT);
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
await page.goto(cfg.url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.mouse.move(-10, -10).catch(() => {});

// One line about the page: section offsets (to place scroll keys), height, GPU, fonts.
const info = await page.evaluate(() => {
  let gl = null;
  try { const g = document.createElement('canvas').getContext('webgl'); const e = g.getExtension('WEBGL_debug_renderer_info'); gl = g.getParameter(e.UNMASKED_RENDERER_WEBGL); } catch (e) { gl = 'n/a'; }
  return {
    sections: [...document.querySelectorAll('section,footer')].map(s => (s.id || s.className || s.tagName).toString().slice(0, 30) + '@' + Math.round(s.getBoundingClientRect().top + scrollY) + '+' + s.offsetHeight),
    scrollHeight: document.documentElement.scrollHeight, innerHeight, gl,
    fonts: [...document.fonts].filter(f => f.status === 'loaded').length + '/' + document.fonts.size,
  };
});
console.log(JSON.stringify(info));

// Round the scroll to whole device pixels, so text does not shimmer between frames.
const setScroll = y => page.evaluate(y => { window.scrollTo({ top: y, behavior: 'instant' }); return window.__realFrame(); }, Math.round(y * DSF) / DSF);
const tick = () => page.evaluate(d => window.__tick(d), TICK);

const warmTicks = Math.round((cfg.warm || 0) * 2 * FPS);
await setScroll(scrollAt(0));
for (let i = 0; i < warmTicks; i++) { await tick(); if (i % 2) await page.evaluate(() => window.__realFrame()); }

const total = Math.round(cfg.dur * FPS);
let ff = null;
if (cfg.out) {
  fs.mkdirSync(path.dirname(path.resolve(cfg.out)), { recursive: true });
  ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(cfg.crf ?? 12), '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', cfg.out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
}
const probeFrames = cfg.probe ? cfg.probe.times.map(t => Math.round(t * FPS)) : [];
if (cfg.probe) fs.mkdirSync(cfg.probe.dir, { recursive: true });
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  // Frame f shows page time f/fps; the two ticks before it carry the clock there.
  for (let k = 1; k >= 0; k--) {
    const t = f / FPS - k / (2 * FPS);
    await setScroll(scrollAt(Math.max(0, t)));
    await tick();
  }
  const probe = probeFrames.includes(f);
  if (ff || probe) {
    await page.evaluate(() => window.__realFrame());
    const buf = await page.screenshot({ type: 'png', animations: 'allow', caret: 'initial' });
    if (ff && !ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (probe) fs.writeFileSync(path.join(cfg.probe.dir, `t${(f / FPS).toFixed(2)}_y${Math.round(scrollAt(f / FPS))}.png`), buf);
  }
  if (f % 60 === 0) console.log(`frame ${f}/${total} y=${scrollAt(f / FPS).toFixed(0)} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
if (ff) { ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); if (code) { console.error(`ffmpeg exited ${code}`); process.exitCode = 1; } }
if (errs.length) console.log('PAGE MESSAGES:\n' + [...new Set(errs)].slice(0, 15).join('\n'));
await browser.close();
if (cfg.out) console.log(`wrote ${cfg.out} (${total} frames at ${FPS} fps)`);
