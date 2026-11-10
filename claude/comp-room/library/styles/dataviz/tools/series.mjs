// library/styles/dataviz/tools/series.mjs
// A real series from a real clip: the mean brightness (luma, 0 to 255) of every frame, measured by ffmpeg's signalstats.
// node tools/series.mjs --in <clip> --out <series.json>   ->   { "source": ..., "fps": 30, "n": 338, "unit": "mean luma (0 to 255)", "values": [...] }
// Node 20+ and ffmpeg only. The style never invents a number: every mark the module draws is one of these values or a spoken word's length.
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : undefined; };
const src = arg('in'), out = arg('out');
if (!src || !out) { console.error('usage: node tools/series.mjs --in <clip> --out <series.json>'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('missing ' + src); process.exit(1); }
const r = spawnSync('ffmpeg', ['-v', 'error', '-i', src, '-map', '0:v:0', '-vf', 'scale=270:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 2 ** 26 });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
const values = [...r.stdout.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map(m => Math.round(Number(m[1]) * 100) / 100);
const pr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', src], { encoding: 'utf8' });
const [a, b] = String(pr.stdout || '30/1').trim().split('/').map(Number), fps = b ? a / b : a;
if (!values.length) { console.error('no frames measured in ' + src); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ source: path.basename(src), fps, n: values.length, unit: 'mean luma (0 to 255)', values }) + '\n');
console.log(`${values.length} frames, luma ${Math.min(...values)} to ${Math.max(...values)} -> ${out}`);
