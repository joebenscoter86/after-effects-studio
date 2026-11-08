#!/usr/bin/env node
// cel.mjs: real footage (or one still) -> a 1950s printed cel for AESMidcenturyToon. The picture is flattened into four flat inks (warm
// near-black, a brick shadow, a peach mid and the cream paper), the colour is printed a few px down-right of a broken ink line, and it is
// sampled on twos (12 fps) so the footage moves like the drawn cast. Output is an mp4 at 12 fps, or a png when --still is given or --out
// ends in .png. Needs Node 20+ and ffmpeg. No npm packages.
//
//   node cel.mjs --in clip.mp4 --out cel.mp4 [--ss 4.0 --t 3.0] [--crop x,y,w,h] [--size 640] [--reg 6] [--still]
import { spawnSync } from 'node:child_process';
const A = process.argv.slice(2), arg = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : A[i + 1]; }, flag = k => A.includes('--' + k);
const IN = arg('in'), OUT = arg('out'); if (!IN || !OUT) { console.error('usage: node cel.mjs --in <video|image> --out <file.mp4|file.png> [options]'); process.exit(2); }
const S = +arg('size', 640), cr = arg('crop', null), c = cr ? cr.split(',') : null, reg = +arg('reg', 6);
// four bands of grey -> four flat inks (ink 2B221D, brick 9A4E3C, peach E9A27F, cream F1E6CF); nothing reaches pure white
const band = (a, b, cc, d) => `if(lt(val\\,56)\\,${a}\\,if(lt(val\\,120)\\,${b}\\,if(lt(val\\,188)\\,${cc}\\,${d})))`;
const inks = `lutrgb=r=${band(43, 154, 233, 241)}:g=${band(34, 78, 162, 230)}:b=${band(29, 60, 127, 207)}`;
const pre = (c ? `crop=${c[2]}:${c[3]}:${c[0]}:${c[1]},` : '') + `scale=${S}:${S}:force_original_aspect_ratio=increase:flags=lanczos,crop=${S}:${S},`
  + 'format=gray,eq=contrast=1.25:brightness=0.06:gamma=1.3,gblur=sigma=1.2';
const graph = `[0:v]${pre},split[a][b];`
  + `[a]gblur=sigma=3,format=rgb24,${inks},crop=${S - reg}:${S - reg}:0:0,pad=${S}:${S}:${reg}:${reg}:color=0xF1E6CF,format=gbrp[w];`   // the colour cel, printed off its line
  + '[b]edgedetect=mode=wires:low=0.07:high=0.18,negate,erosion,gblur=sigma=0.6,format=rgb24,'
  + 'lutrgb=r=if(lt(val\\,128)\\,43\\,255):g=if(lt(val\\,128)\\,34\\,255):b=if(lt(val\\,128)\\,29\\,255),format=gbrp[e];'   // the line in warm ink
  + '[w][e]blend=all_mode=multiply,format=yuv420p[o]';
const still = flag('still') || /\.png$/i.test(OUT);
const args = ['-v', 'error', '-y', '-ss', String(arg('ss', 0)), ...(still ? [] : ['-t', String(arg('t', 3))]), '-i', IN, '-filter_complex', graph, '-map', '[o]'];
if (still) args.push('-frames:v', '1'); else args.push('-r', '12', '-an', '-c:v', 'libx264', '-crf', '14', '-pix_fmt', 'yuv420p');
const r = spawnSync('ffmpeg', [...args, OUT], { encoding: 'utf8' });
if (r.status) { console.error('ffmpeg failed (is it installed?)\n' + r.stderr); process.exit(1); }
console.log(OUT);
