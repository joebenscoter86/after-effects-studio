// Grading for the picture evals (plugin/evals/evals.json ids 18 to 22, 24, 26 and 27): the
// thresholds, in one table per eval, and the functions that turn rendered
// frames into one result per check. The measurements are the plugin's own
// (runtime/dist/color: measureEdge, alphaChange, measureScreen,
// sampleRegions, histogramOf), run on the PNG files ae_render_frame wrote, so
// a number here is the number the agent could have read from the tool.
//
// Every check reports what it measured, the value, the limit and pass or
// fail. "Setup" checks confirm the shot is the one the setup script claims to
// build; when one fails the run is invalid and every eval check fails with
// that reason (the eval cannot say anything about the agent then).
//
// The facts the limits come from (After Effects 2027, 8 bpc, no working
// space; plugin/library/references/keying.md and the stage 6 live check):
//   F1 a good key on a real 1080x1920 shot: partial share 0.012 to 0.04,
//      typical edge width 5 to 8 px, a handful of specks, edge flicker about
//      0.02 (0.02 to 0.04) mean alpha change per frame pair;
//   F2 a key with the screen left partly opaque: partial share 0.24, typical
//      width 48 px, one frame-sized patch at mean alpha 0.35;
//   F3 Key Cleaner at its defaults widened the edge 7.1 -> 15.1 px and gave
//      21 specks (measured worse, by eye a wider halo);
//   F4 grading a subject to a reference by sampled skin values got within
//      0.02 per channel;
//   F5 a capture's RGB is already laid over the comp background colour.
//   M  the Node model of the synthetic shot (release/tests/picture-model.mjs,
//      soft edges as a linear ramp as wide as the feather): a good key reads
//      partial share 0.010, typical width 5.4 px, no specks or patches; a
//      hard key 0 and 0 px; the screen left at alpha 0.35 reads share 0.72
//      and one 1.5 M px patch. Real After Effects feathers are not linear.
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { CURVE, FINISH, FOOTAGE, GRADE, KEYING, OVER, REVIEW, SCENES, SEAT, footageBlocks, footageLayout } from './scenes.mjs';

export const THRESHOLDS = {
  keying: [
    { id: 'source-is-green', setup: true, equals: 'green', unit: '', what: 'screen kind of the un-keyed source render',
      why: 'the setup builds a green screen; anything else means the source comp is not the built shot', source: 'the scene as built (scenes.mjs)', guess: false },
    { id: 'source-is-uneven', setup: true, min: 1.2, unit: 'x', what: 'screen level ratio (brightest / darkest grid cell) of the source',
      why: 'the setup builds a ramp 1.5x brighter on the right; the model of the built ramp reads 1.36 on the grid the grader uses; below 1.2 the unevenness the task is about is missing', source: 'scene; keying.md fact 4 (real screen 1.5x)', guess: false },
    { id: 'screen-transparent', min: 0.99, unit: 'share', what: 'transparent share in the screen-only boxes, worst box and frame',
      why: 'a good key leaves the screen fully transparent; 1% allows a few grain specks, which are counted on their own', source: 'F2 (bad key: no transparent screen at all)', guess: false },
    { id: 'subject-opaque', min: 0.99, unit: 'share', what: 'opaque share in the figure-core boxes, worst box and frame',
      why: 'the figure is opaque in the shot; holes or a see-through body show here', source: 'the scene as built (scenes.mjs)', guess: false },
    { id: 'stand-gone', min: 0.99, unit: 'share', what: 'transparent share over the corner stand (its box grown by 6 px)',
      why: 'the stand is not screen, so no key removes it; only a garbage mask does', source: 'scene; keying.md step 5 (garbage mask)', guess: false },
    { id: 'largest-patch', max: 0.05, unit: 'of frame', what: 'largest partly transparent patch, as a share of the frame, worst frame',
      why: 'the bad real key had one frame-sized patch; 5% still allows a feathered garbage-mask band (a 24 px feather read as a 40 to 60 px band)', source: 'F2; keying.md fact 3', guess: true },
    { id: 'partial-share', min: 0.004, max: 0.04, unit: 'share', what: 'partly transparent share of the frame, each edge frame',
      why: 'the model good key reads 0.010 and a hard cut 0; 0.04 is the top of the real good range, the half-keyed screen reads 0.24 (real) or 0.72 (model)', source: 'F1, F2, M', guess: true },
    { id: 'typical-width', min: 3, max: 12, unit: 'px', what: 'median edge width on the 50% contour, each edge frame',
      why: 'the shot is feathered 6 px (model reads 5.4); under 3 px is a cut-out edge, over 12 (twice the feather, above the 11 px thin-edge limit) a halo', source: 'F1 (5 to 8 px), F2 (48 px), F3 (15.1 px), M', guess: true },
    { id: 'specks', max: 10, unit: 'count', what: 'specks (stray islands outside the figure), worst frame',
      why: 'a good real key left a handful; clean-up at defaults left 21', source: 'F1, F3', guess: true },
    { id: 'edge-flicker', max: 0.04, unit: 'mean |dA|', what: 'edge-zone alpha change per consecutive held frame pair, mean of the pairs',
      why: 'the top of the real good key range; the figure holds on these frames, so change is chatter. Synthetic grain strength versus real grain is not measured', source: 'F1', guess: true },
  ],
  grade: [
    { id: 'shadow-match', max: 0.02, unit: 'per channel', what: 'largest channel difference, subject shadow vs plate shadow (region means)',
      why: 'matching by sampled values reached 0.02 per channel on a real shot', source: 'F4', guess: false },
    { id: 'neutral-match', max: 0.02, unit: 'per channel', what: 'largest channel difference, subject neutral vs plate neutral (region means)',
      why: 'matching by sampled values reached 0.02 per channel on a real shot; the neutral carries the cast', source: 'F4', guess: false },
    { id: 'highlight-match', max: 0.02, unit: 'per channel', what: 'largest channel difference, subject highlight vs plate highlight (region means)',
      why: 'matching by sampled values reached 0.02 per channel on a real shot; the highlight shows a gain error most', source: 'F4', guess: false },
    { id: 'plate-untouched', max: 0.01, unit: 'per channel', what: 'largest channel difference of each plate region from the value the setup built',
      why: 'the task grades the subject to the plate, not the plate to the subject; 0.01 is a few 8-bit steps', source: 'the scene as built (scenes.mjs)', guess: false },
    { id: 'no-crush', max: 0.002, unit: 'share', what: 'share of the subject box in the lowest of 32 histogram bins, worst channel',
      why: 'nothing in the shot is below 0.06 ungraded or graded right; a crushed black piles up in bin 0', source: 'scene (histogram)', guess: true },
    { id: 'no-clip', max: 0.002, unit: 'share', what: 'share of the subject box in the highest of 32 histogram bins, worst channel',
      why: 'nothing in the shot is above 0.96 ungraded or graded right; a clipped white piles up in the last bin', source: 'scene (histogram)', guess: true },
  ],
  over: [
    { id: 'reference-is-over', setup: true, max: 0.01, unit: 'per channel', what: 'reference render corner vs navy',
      why: 'the reference must be the glow over navy from ae_render_frame `over`, or the comparison means nothing', source: 'the scene as built (scenes.mjs)', guess: false },
    { id: 'still-has-alpha', min: 0.5, unit: 'share', what: 'partly transparent share of the still in the glow\'s soft ring',
      why: 'a reusable still has to carry the glow\'s soft alpha; a flat RGB file has none', source: 'the scene as built (scenes.mjs)', guess: false },
    { id: 'matches-over', max: 0.01, unit: 'per channel', what: 'largest channel mean |difference| in the soft ring: the still laid over navy as straight colour vs the reference',
      why: 'straight colour composites to what `over` gives within 8-bit rounding; a capture whose RGB still holds the pink background differs by about 0.1 there', source: 'F5', guess: false },
  ],
  finish: [
    { id: 'findings-readable', setup: true, equals: 'yes', unit: '', what: 'picture-grade/findings.json exists and holds the seeded and clean lists',
      why: 'every check reads the findings file; without it nothing the agent concluded can be scored', source: 'the plan (node grade.mjs finish --plan)', guess: false },
    { id: 'flash', max: 0.05, unit: 's', what: 'error of the named one-frame flash time against the seeded flash',
      why: 'the flash is one frame long; 0.05 s is a frame and a half at 30 fps, so naming the frame before or after still counts and anything further does not', source: 'the scene as built (scenes.mjs FINISH.flash)', guess: false },
    { id: 'frozen', max: 0.1, unit: 's', what: 'larger of the errors of the named frozen stretch start and end against the seeded hold',
      why: 'the hold runs from frame 60 to 80; three frames either way allows a stretch reported from the last moving frame or with every 2', source: 'the scene as built (scenes.mjs FINISH.frozen)', guess: false },
    { id: 'off-frame', min: 3, max: 4.5, unit: 's', what: 'named time the title starts to leave the frame',
      why: 'the title only moves between 3.0 and 4.5 s and is wholly off frame by the end of the slide; when inside that it crosses the edge depends on the font width, which the setup does not fix', source: 'the scene as built (scenes.mjs FINISH.title)', guess: true },
    { id: 'clipped', max: 0.1, unit: 's', what: 'error of the named clipped-highlight start against the seeded glare',
      why: 'the glare appears on frame 120 (4.0 s); three frames allows a stretch reported with every 2 or from the first sampled frame', source: 'the scene as built (scenes.mjs FINISH.glare)', guess: false },
    { id: 'clean-quiet', max: 0, unit: 'findings', what: 'findings named for the clean comp',
      why: 'the clean comp holds a steady move and a still title: nothing a viewer would flag, so any finding there is a false alarm', source: 'the scene as built (scenes.mjs FINISH, clean)', guess: false },
  ],
  review: [
    { id: 'findings-readable', setup: true, equals: 'yes', unit: '', what: 'picture-grade/findings.json exists and every finding is in the review form (kind, from, where, evidence, severity)',
      why: 'the checks read the findings file; a review not in the form the review document asks for cannot be scored', source: 'the plan (node grade.mjs review --plan); library review.md', guess: false },
    { id: 'found', min: 3, unit: 'of 4', what: 'planted defects named with their kind and a time inside the span where they show',
      why: 'four defects are planted, each visible in the frames to a careful viewer; three of four is the bar the review step is meant to clear, and one miss is allowed because only one of the four is fully given away by ae_check_comp', source: 'the scene as built (scenes.mjs REVIEW); the stage 2 brief', guess: true },
    { id: 'stray', max: 2, unit: 'findings', what: 'findings that match no planted defect',
      why: 'the comp has nothing else wrong that the setup put there; two extras allow a reviewer to name a real nit the setup did not plan, more means listing everything, which a review must not pass by', source: 'the scene as built (scenes.mjs REVIEW); the stage 2 brief', guess: true },
  ],
  seat: [
    { id: 'grain-match', min: 0.75, max: 1.25, unit: 'x plate', what: 'element frame-to-frame grain over the plate\'s (look, mean of channels, frames 0 and 1)',
      why: 'grain that changes every frame is what a viewer sees; within a quarter is the look option\'s own default tolerance. A clean element reads 0; Noise at the plate\'s amount reads 1.0 (After Effects 27.0, 2026-11-12)', source: 'SEAT.expected; keying.md, integration facts', guess: true },
    { id: 'softness-match', min: 0.75, max: 1.25, unit: 'x plate', what: 'element edge width over the plate\'s (look sharpness, 10 to 90% rise, frame 0)',
      why: 'the element\'s stripe edges against the plate\'s panel edge; within a quarter is the look option\'s default tolerance. The sharp element reads 0.17; Gaussian Blur at the plate\'s Blurriness reads 1.01 (After Effects 27.0)', source: 'SEAT.expected; keying.md, integration facts', guess: true },
    { id: 'plate-untouched', max: 0.1, unit: 'share', what: 'larger relative change of the plate\'s edge width and frame-to-frame grain from what the built plate measured',
      why: 'the task changes the element, not the plate; the plate built three times read the same, and over three frame pairs it moved by at most 1.3% (grain 4.41 to 4.43 steps, edge 4.64 to 4.70 px), so a tenth is about eight times the measured spread and far below what blurring or cleaning the plate does', source: 'SEAT.expected (measured on the built scene, three builds, three frame pairs)', guess: false },
    { id: 'element-kept', max: 0.04, unit: 'luma', what: 'change of the element region\'s mean luma from the built element',
      why: 'grain and blur leave the mean where it was (+0.004 measured); hiding, fading or recolouring the element moves it', source: 'SEAT.expected', guess: true },
  ],
  curve: [
    { id: 'findings-readable', setup: true, equals: 'yes', unit: '', what: 'picture-grade/findings.json exists and every finding names a kind, a layer and a time',
      why: 'every check reads the findings file; without it nothing the agent concluded can be scored', source: 'the plan (node grade.mjs curve --plan)', guess: false },
    { id: 'linear-move', min: 1.9, max: 3.1, unit: 's', what: 'named time of the move with no ease, on card B',
      why: 'card B moves from 2.0 to 3.0 s on linear keys; any time inside the move, or three frames either side, counts', source: 'the scene as built (scenes.mjs CURVE.linear)', guess: false },
    { id: 'late-hit', min: 3, max: 5, unit: 'frames', what: 'named frames after its beat of the late hit, on badge 3',
      why: 'badge 3 appears four frames after beat 3 (5.0 s); one frame either way allows counting from the frame before or after', source: 'the scene as built (scenes.mjs CURVE.badges)', guess: false },
    { id: 'eased-quiet', max: 0, unit: 'findings', what: 'findings naming card A',
      why: 'card A makes one move eased at both ends: nothing a viewer would flag, so any finding on it is a false alarm', source: 'the scene as built (scenes.mjs CURVE.eased)', guess: false },
    { id: 'on-beat-quiet', max: 0, unit: 'findings', what: 'timing findings (late or early) naming badge 1 or badge 2',
      why: 'both appear on the frame of their beat', source: 'the scene as built (scenes.mjs CURVE.badges)', guess: false },
  ],
  footage: [
    { id: 'clip-read', setup: true, equals: 'yes', unit: '', what: 'footage-truth.json beside the grader holds the plate as measured from the handed clip, at the render\'s size',
      why: 'every check compares with the clip\'s own grain and edge width; without them nothing can be scored', source: 'the suite writer (release/claude-evals.mjs), from the clip it was handed', guess: false },
    { id: 'grain-match', min: 0.75, max: 1.25, unit: 'x plate', what: 'element frame-to-frame grain over the plate\'s (look, mean of channels, frames 0 and 1; the plate as the clip measured, in its still blocks)',
      why: 'as the seat eval: grain that changes every frame is what a viewer sees, and within a quarter is the look option\'s own default tolerance', source: 'footage-truth.json; the seat eval', guess: true },
    { id: 'softness-match', min: 0.75, max: 1.25, unit: 'x plate', what: 'element edge width over the plate\'s (look sharpness, 10 to 90% rise, frame 0; the plate\'s median over its still blocks with an edge)',
      why: 'as the seat eval; on footage the plate\'s softness is read where it holds still, so a moving subject\'s motion blur does not count as softness', source: 'footage-truth.json; the seat eval', guess: true },
    { id: 'plate-untouched', max: 0.15, unit: 'share', what: 'larger relative change of the plate\'s grain and edge width, read in the render over the same blocks, from what the clip measured',
      why: 'the task changes the element, not the plate. The truth is read from ffmpeg\'s decode of the clip and the render from After Effects; stage 11 measured the two decodes within 0.0013 of each other, so 0.15 (looser than the seat eval\'s 0.1) leaves room for that and still catches a plate blurred or cleaned', source: 'footage-truth.json; the stage 11 colour proof', guess: true },
    { id: 'element-kept', max: 0.04, unit: 'luma', what: 'change of the element region\'s mean luma from the card and stripe as built',
      why: 'grain and blur leave the mean where it was; hiding, fading or recolouring the element moves it', source: 'scenes.mjs FOOTAGE (the card and stripe colours over the region)', guess: true },
  ],
};

/** The scored check ids of an eval, in verdict order ("<eval>.<check>"). */
export const checkIds = (name) => THRESHOLDS[name].filter((t) => !t.setup).map((t) => `${name}.${t.id}`);

/** What each eval's setup, task and final renders are. */
export const EVALS = {
  keying: { scene: KEYING, setup: 'keying-shot.jsx', renders: ['key-source_0.png', ...KEYING.gradeFrames.keyed.map((_, i) => `key_${i}.png`)] },
  grade: { scene: GRADE, setup: 'grade-plate.jsx', renders: ['grade_0.png'] },
  over: { scene: OVER, setup: 'over-still.jsx', renders: ['glow-still.png', 'over-reference_0.png'] },
  finish: { scene: FINISH, setup: 'finish-check.jsx', renders: [], findings: 'findings.json' },
  review: { scene: REVIEW, setup: 'review-plate.jsx', renders: [], findings: 'findings.json', encoded: true },
  seat: { scene: SEAT, setup: 'seat-plate.jsx', renders: SEAT.gradeFrames.map((_, i) => `seat_${i}.png`) },
  curve: { scene: CURVE, setup: 'curve-sync.jsx', renders: [], findings: 'findings.json' },
  footage: { scene: FOOTAGE, setup: 'seat-footage.jsx', renders: FOOTAGE.gradeFrames.map((_, i) => `footage_${i}.png`), truth: 'footage-truth.json' },
};

/** Import the plugin's measuring modules from a runtime dist folder. */
export async function loadRuntime(distDir) {
  const mod = (f) => import(pathToFileURL(path.join(distDir, 'color', f)).href);
  const [matte, screen, sheet, png16] = await Promise.all(['matte.js', 'screen.js', 'sheet.js', 'png16.js'].map(mod));
  return { matte, screen, sheet, png16 };
}

// ---------------------------------------------------------------------------

const r4 = (v) => Math.round(v * 1e4) / 1e4;
const fmt = (v) => (typeof v === 'number' ? String(r4(v)) : String(v));

function limitText(t) {
  if (t.equals !== undefined) return `= ${t.equals}`;
  const u = t.unit ? ` ${t.unit}` : '';
  if (t.min !== undefined && t.max !== undefined) return `${t.min} to ${t.max}${u}`;
  return t.min !== undefined ? `>= ${t.min}${u}` : `<= ${t.max}${u}`;
}

const within = (t, v) => typeof v === 'number' && Number.isFinite(v)
  && (t.min === undefined || v >= t.min) && (t.max === undefined || v <= t.max);

/** One result: every value must be within the limit. */
function result(name, t, values, note) {
  const vals = Array.isArray(values) ? values : [values];
  const pass = t.equals !== undefined ? vals.every((v) => v === t.equals) : vals.length > 0 && vals.every((v) => within(t, v));
  return { id: `${name}.${t.id}`, what: note ? `${t.what} (${note})` : t.what, values: vals, value: vals.map(fmt).join(', '), limit: limitText(t), pass, setup: !!t.setup };
}

/** A failed result whose value says why nothing could be measured. */
const failed = (name, t, why) => ({ id: `${name}.${t.id}`, what: t.what, values: [], value: why, limit: limitText(t), pass: false, setup: !!t.setup });

function table(name) {
  return Object.fromEntries(THRESHOLDS[name].map((t) => [t.id, t]));
}

/** Every eval check failed for one reason (missing file, wrong size, invalid run). */
function allFailed(name, why, setup = []) {
  return { setup, checks: THRESHOLDS[name].filter((t) => !t.setup).map((t) => failed(name, t, why)) };
}

function sizeError(img, scene, label) {
  if (!img) return `${label}: render missing`;
  if (img.width !== scene.width || img.height !== scene.height) {
    return `${label}: size ${img.width}x${img.height}, expected ${scene.width}x${scene.height}`;
  }
  return null;
}

/** After setup checks: the run is invalid when any failed. */
function invalidIfSetupFailed(name, setup) {
  const bad = setup.filter((s) => !s.pass);
  if (bad.length === 0) return null;
  return allFailed(name, `invalid run: setup check ${bad.map((s) => s.id).join(', ')} failed`, setup);
}

const regionStats = (rt, img, boxes) => rt.sheet.sampleRegions(img, boxes);

// ---------------------------------------------------------------------------
// Keying
// ---------------------------------------------------------------------------

/**
 * images.source: the un-keyed source comp at gradeFrames.source.
 * images.keyed: the keyed layer, isolated, channels 'rgba', at gradeFrames.keyed (in order).
 */
export function gradeKeying(images, rt) {
  const T = table('keying');
  const scene = KEYING;
  const setup = [];
  const srcErr = sizeError(images.source, scene, 'source');
  if (srcErr) {
    setup.push(failed('keying', T['source-is-green'], srcErr), failed('keying', T['source-is-uneven'], srcErr));
  } else {
    const st = rt.screen.resolveScreenThresholds({}, scene.width, scene.height);
    const sr = rt.screen.measureScreen(images.source, st);
    setup.push(result('keying', T['source-is-green'], sr.screen ?? 'none'));
    setup.push(result('keying', T['source-is-uneven'], sr.evenness?.levelRatio ?? NaN));
  }
  const invalid = invalidIfSetupFailed('keying', setup);
  if (invalid) return invalid;

  const keyed = images.keyed ?? [];
  if (keyed.length !== scene.gradeFrames.keyed.length) return allFailed('keying', `keyed: ${keyed.length} renders, expected ${scene.gradeFrames.keyed.length}`, setup);
  for (const [i, img] of keyed.entries()) {
    const e = sizeError(img, scene, `key_${i}`);
    if (e) return allFailed('keying', e, setup);
    if (!img.alpha) return allFailed('keying', `key_${i}: no alpha channel (render with channels 'rgba')`, setup);
  }

  const t = rt.matte.resolveEdgeThresholds({}, scene.width, scene.height);
  const frameIndex = (f) => scene.gradeFrames.keyed.indexOf(f);
  const measured = new Map();
  const measure = (i) => {
    if (!measured.has(i)) measured.set(i, rt.matte.measureEdge(keyed[i], scene.bg, t));
    return measured.get(i);
  };
  const edgeIdx = scene.gradeFrames.edge.map(frameIndex);
  const edges = edgeIdx.map((i) => measure(i).report);
  const pixels = scene.width * scene.height;
  const frames = `frames ${scene.gradeFrames.edge.join(', ')}`;

  const minShare = (boxes, key) => Math.min(...edgeIdx.flatMap((i) => regionStats(rt, keyed[i], boxes).map((s) => s.alpha?.[key] ?? 0)));
  const checks = [
    result('keying', T['screen-transparent'], minShare(scene.screenBoxes, 'transparentShare'), frames),
    result('keying', T['subject-opaque'], minShare(scene.subjectBoxes, 'opaqueShare'), frames),
    result('keying', T['stand-gone'], minShare([scene.standBox], 'transparentShare'), frames),
    result('keying', T['largest-patch'], Math.max(...edges.map((r) => Math.max(0, ...r.patches.list.map((p) => p.area)) / pixels)), frames),
    result('keying', T['partial-share'], edges.map((r) => r.shares.partial), frames),
    result('keying', T['typical-width'], edges.map((r) => r.width.typical ?? NaN), frames),
    result('keying', T['specks'], Math.max(...edges.map((r) => r.specks.count)), frames),
  ];
  const flickIdx = scene.gradeFrames.flicker.map(frameIndex);
  const pairs = [];
  for (let k = 1; k < flickIdx.length; k++) {
    const a = flickIdx[k - 1], b = flickIdx[k];
    pairs.push({ ...rt.matte.alphaChange(measure(a).frame, measure(b).frame, t), from: { index: a, time: undefined }, to: { index: b, time: undefined } });
  }
  const flicker = rt.matte.summarizeFlicker(pairs).edge.meanAbsDelta;
  checks.push(result('keying', T['edge-flicker'], flicker, `frames ${scene.gradeFrames.flicker.join(', ')}`));
  return { setup, checks };
}

// ---------------------------------------------------------------------------
// Grade to plate
// ---------------------------------------------------------------------------

function crop(img, b) {
  const rgb = new Float64Array(b.width * b.height * 3);
  for (let y = 0; y < b.height; y++) {
    const from = ((b.y + y) * img.width + b.x) * 3;
    rgb.set(img.rgb.subarray(from, from + b.width * 3), y * b.width * 3);
  }
  return { width: b.width, height: b.height, rgb, bitDepth: img.bitDepth };
}

/** images.frame: the grade comp at gradeFrame, rendered as it composites (channels 'rgb'). */
export function gradeGrade(images, rt) {
  const T = table('grade');
  const scene = GRADE;
  const e = sizeError(images.frame, scene, 'grade');
  if (e) return allFailed('grade', e);
  const names = Object.keys(scene.regions);
  const stats = Object.fromEntries(regionStats(rt, images.frame, names.map((n) => ({ name: n, ...scene.regions[n] }))).map((s) => [s.name, s.mean]));
  const diff = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
  const checks = ['shadow', 'neutral', 'highlight'].map((k) =>
    result('grade', T[`${k}-match`], diff(stats[`subject ${k}`], stats[`plate ${k}`]),
      `subject ${stats[`subject ${k}`].map(fmt).join('/')} vs plate ${stats[`plate ${k}`].map(fmt).join('/')}`));
  const plateDiff = Math.max(...['shadow', 'neutral', 'highlight'].map((k) => diff(stats[`plate ${k}`], scene.truth[k])));
  checks.push(result('grade', T['plate-untouched'], plateDiff));
  const h = rt.sheet.histogramOf(crop(images.frame, scene.subjectBox), 32);
  const share = (bin) => Math.max(...['r', 'g', 'b'].map((c) => h[c][bin] / h.pixels));
  checks.push(result('grade', T['no-crush'], share(0)));
  checks.push(result('grade', T['no-clip'], share(31)));
  return { setup: [], checks };
}

// ---------------------------------------------------------------------------
// Sit an element in its plate
// ---------------------------------------------------------------------------

/** images.frames: the seat comp at gradeFrames (two consecutive frames), rendered as it composites (channels 'rgb'). */
export function gradeSeat(images, rt) {
  const T = table('seat');
  const scene = SEAT;
  const frames = images.frames ?? [];
  for (const [i, f] of scene.gradeFrames.entries()) {
    const e = sizeError(frames[i], scene, `seat_${i}`);
    if (e) return allFailed('seat', e);
  }
  const look = {
    regions: [
      { name: 'plate', ...scene.regions.plate, role: 'plate' },
      { name: 'element', ...scene.regions.element, role: 'element' },
    ],
  };
  const first = rt.sheet.measureLook(frames[0], look);
  const series = rt.sheet.summarizeLookSeries(frames.map((f) => rt.sheet.lookCrops(f, look)), look);
  const by = (list, n) => list.find((r) => r.name === n);
  const mean3 = (v) => (v ? (v[0] + v[1] + v[2]) / 3 : NaN);
  const pt = mean3(by(series.regions, 'plate').temporal);
  const et = mean3(by(series.regions, 'element').temporal);
  const pr = by(first.regions, 'plate');
  const er = by(first.regions, 'element');
  const pw = pr.sharpness?.edgeWidth ?? NaN;
  const ew = er.sharpness?.edgeWidth ?? NaN;
  const x = scene.expected;
  const checks = [
    result('seat', T['grain-match'], pt > 0 ? et / pt : NaN, `element ${fmt(et)} vs plate ${fmt(pt)} 8-bit steps`),
    result('seat', T['softness-match'], pw > 0 ? ew / pw : NaN, `element ${fmt(ew)} px vs plate ${fmt(pw)} px`),
    result('seat', T['plate-untouched'], Math.max(Math.abs(pw / x.plate.edgeWidth - 1), Math.abs(pt / x.plate.temporalGrain - 1)),
      `plate edge ${fmt(pw)} px (built ${x.plate.edgeWidth}), grain ${fmt(pt)} (built ${x.plate.temporalGrain})`),
    result('seat', T['element-kept'], Math.abs((er.levels?.lumaMean ?? NaN) - x.element.lumaMean), `element mean luma ${fmt(er.levels?.lumaMean)} (built ${x.element.lumaMean})`),
  ];
  return { setup: [], checks };
}

// ---------------------------------------------------------------------------
// Reusable still over a new background
// ---------------------------------------------------------------------------

function ringPixels(scene) {
  const out = [];
  const { centre } = scene.glow;
  for (let y = 0; y < scene.height; y++) for (let x = 0; x < scene.width; x++) {
    const r = Math.hypot(x + 0.5 - centre[0], y + 0.5 - centre[1]);
    if (r >= scene.ring.inner && r <= scene.ring.outer) out.push(y * scene.width + x);
  }
  return out;
}

/** images.still: the agent's reusable still. images.reference: the glow isolated over navy. */
export function gradeOver(images, rt) {
  const T = table('over');
  const scene = OVER;
  const setup = [];
  const refErr = sizeError(images.reference, scene, 'over-reference');
  if (refErr) setup.push(failed('over', T['reference-is-over'], refErr));
  else setup.push(result('over', T['reference-is-over'], Math.max(...[0, 1, 2].map((c) => Math.abs(images.reference.rgb[c] - scene.navy[c])))));
  const stillErr = sizeError(images.still, scene, 'glow-still');
  if (stillErr) return allFailed('over', stillErr, setup);
  const invalid = invalidIfSetupFailed('over', setup);
  if (invalid) return invalid;
  const ring = ringPixels(scene);
  const { still, reference } = images;
  const checks = [];
  if (!still.alpha) checks.push(failed('over', T['still-has-alpha'], 'glow-still: no alpha channel'));
  else {
    const partial = ring.filter((p) => still.alpha[p] > 2 / 255 && still.alpha[p] < 1 - 2 / 255).length / ring.length;
    checks.push(result('over', T['still-has-alpha'], partial));
  }
  const sum = [0, 0, 0];
  for (const p of ring) {
    const a = still.alpha ? still.alpha[p] : 1;
    for (let c = 0; c < 3; c++) sum[c] += Math.abs(still.rgb[p * 3 + c] * a + scene.navy[c] * (1 - a) - reference.rgb[p * 3 + c]);
  }
  checks.push(result('over', T['matches-over'], Math.max(...sum.map((s) => s / ring.length))));
  return { setup, checks };
}

// ---------------------------------------------------------------------------
// Verdict and plan
// ---------------------------------------------------------------------------
// The whole-piece check: graded on what the agent names, not on a render
// ---------------------------------------------------------------------------

/** Where each seeded defect is, in seconds, from the scene. */
export const FINISH_TRUTH = {
  flash: FINISH.flash.frame / FINISH.fps,
  frozen: { from: FINISH.frozen.fromFrame / FINISH.fps, to: FINISH.frozen.toFrame / FINISH.fps },
  offFrame: { from: FINISH.title.moveFromFrame / FINISH.fps, to: FINISH.title.moveToFrame / FINISH.fps },
  clipped: FINISH.glare.fromFrame / FINISH.fps,
};

export const FINISH_KINDS = ['flash', 'frozen', 'off-frame', 'clipped', 'other'];

/** Null when `list` is a findings list ([{ kind, from, to? }]), else what is wrong. */
function listError(list, name) {
  if (!Array.isArray(list)) return `${name} is not a list`;
  for (const [i, f] of list.entries()) {
    if (!f || typeof f !== 'object') return `${name}[${i}] is not an object`;
    if (!FINISH_KINDS.includes(f.kind)) return `${name}[${i}].kind is ${JSON.stringify(f.kind)}, not one of ${FINISH_KINDS.join(', ')}`;
    if (typeof f.from !== 'number' || !Number.isFinite(f.from)) return `${name}[${i}].from is not a number of seconds`;
    if (f.to !== undefined && (typeof f.to !== 'number' || !Number.isFinite(f.to))) return `${name}[${i}].to is not a number of seconds`;
  }
  return null;
}

/**
 * findings: the parsed picture-grade/findings.json, { seeded: [...], clean: [...] },
 * each item { kind: flash | frozen | off-frame | clipped | other, from: s, to?: s }.
 * For each seeded defect the closest named item of its kind is scored; any
 * finding for the clean comp is a false alarm. Extra findings for the seeded
 * comp (the jump where the glare appears, say) are not scored.
 */
export function gradeFinish(findings) {
  const T = table('finish');
  const why = !findings || typeof findings !== 'object' || Array.isArray(findings)
    ? 'findings.json missing or not a JSON object'
    : listError(findings.seeded, 'seeded') ?? listError(findings.clean, 'clean');
  const setup = [why === null ? result('finish', T['findings-readable'], 'yes') : failed('finish', T['findings-readable'], why)];
  const invalid = invalidIfSetupFailed('finish', setup);
  if (invalid) return invalid;
  const of = (kind) => findings.seeded.filter((f) => f.kind === kind);
  const checks = [];
  const scored = (id, kind, err) => {
    const items = of(kind);
    checks.push(items.length === 0
      ? failed('finish', T[id], `no ${kind} named for the seeded comp`)
      : result('finish', T[id], r4(Math.min(...items.map(err)))));
  };
  scored('flash', 'flash', (f) => Math.abs(f.from - FINISH_TRUTH.flash));
  scored('frozen', 'frozen', (f) => Math.max(Math.abs(f.from - FINISH_TRUTH.frozen.from), Math.abs((f.to ?? f.from) - FINISH_TRUTH.frozen.to)));
  // The off-frame value is the named time itself (the one closest to the middle of the slide when several are named).
  const offs = of('off-frame');
  const mid = (FINISH_TRUTH.offFrame.from + FINISH_TRUTH.offFrame.to) / 2;
  checks.push(offs.length === 0
    ? failed('finish', T['off-frame'], 'no off-frame named for the seeded comp')
    : result('finish', T['off-frame'], r4(offs.reduce((a, b) => (Math.abs(b.from - mid) < Math.abs(a.from - mid) ? b : a)).from)));
  scored('clipped', 'clipped', (f) => Math.abs(f.from - FINISH_TRUTH.clipped));
  checks.push(result('finish', T['clean-quiet'], findings.clean.length));
  return { setup, checks };
}

// ---------------------------------------------------------------------------
// The independent review: graded on the reviewer's findings, not on a render
// ---------------------------------------------------------------------------

/** The review document's severity scale (library review.md), most noticed first. */
export const SEVERITIES = ['first-watch', 'careful-watch', 'polish'];
/** Kinds a finding may have. More than were planted, so the list does not say what to look for. */
export const REVIEW_KINDS = ['colour', 'focus', 'timing', 'edge', 'framing', 'exposure', 'motion', 'continuity', 'other'];
/** Seconds either side of a defect's span inside which a named time counts: three frames at 30 fps. */
export const REVIEW_TOLERANCE = 0.1;

/** Where each planted defect shows, in seconds, by the kind a reviewer would file it under (from the scene). */
export const REVIEW_TRUTH = (() => {
  const s = REVIEW, sec = (f) => f / s.fps;
  const [t1, t2] = s.takes;
  return {
    edge: { what: 'a light fringe round the presenter in take 1', from: sec(t1.fromFrame), to: sec(t1.toFrame + 1) },
    colour: { what: 'the presenter in take 2 graded toward magenta against the neutral wall', from: sec(t2.fromFrame), to: sec(t2.toFrame + 1) },
    focus: { what: 'the wall blurred while the presenter stays sharp', from: sec(s.soft.fromFrame), to: sec(s.soft.toFrame + 1) },
    timing: { what: `the badge lands on frame ${s.badge.landFrame}, ${s.badge.landFrame - s.marker.frame} frames after the "${s.marker.name}" marker`,
      from: sec(s.marker.frame), to: sec(s.badge.landFrame) },
  };
})();

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isSeconds = (v) => typeof v === 'number' && Number.isFinite(v);

/** Null when `doc` is a review in the document's form, else what is wrong. */
function reviewError(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'findings.json missing or not a JSON object';
  if (!Array.isArray(doc.findings)) return 'findings is not a list';
  for (const [i, f] of doc.findings.entries()) {
    const at = `findings[${i}]`;
    if (!f || typeof f !== 'object') return `${at} is not an object`;
    if (!REVIEW_KINDS.includes(f.kind)) return `${at}.kind is ${JSON.stringify(f.kind)}, not one of ${REVIEW_KINDS.join(', ')}`;
    if (!isSeconds(f.from)) return `${at}.from is not a number of seconds`;
    if (f.to !== undefined && !isSeconds(f.to)) return `${at}.to is not a number of seconds`;
    if (!SEVERITIES.includes(f.severity)) return `${at}.severity is ${JSON.stringify(f.severity)}, not one of ${SEVERITIES.join(', ')}`;
    for (const k of ['where', 'evidence']) if (!isText(f[k])) return `${at}.${k} is missing or empty`;
  }
  for (const k of ['intended', 'notJudged']) if (doc[k] !== undefined && !Array.isArray(doc[k])) return `${k} is not a list`;
  return null;
}

const matches = (f, kind) => f.kind === kind
  && f.from >= REVIEW_TRUTH[kind].from - REVIEW_TOLERANCE && f.from <= REVIEW_TRUTH[kind].to + REVIEW_TOLERANCE;

/**
 * doc: the parsed picture-grade/findings.json, { findings: [...], intended?: [...], notJudged?: [...] }.
 * A planted defect is found when a finding of its kind starts inside the span
 * where it shows (give or take REVIEW_TOLERANCE). A finding that matches no
 * defect is stray; more findings of a defect already found are neither.
 * `intended` (flags the reviewer judged intended) and `notJudged` are read for
 * form only.
 */
export function gradeReview(doc) {
  const T = table('review');
  const why = reviewError(doc);
  const setup = [why === null ? result('review', T['findings-readable'], 'yes') : failed('review', T['findings-readable'], why)];
  const invalid = invalidIfSetupFailed('review', setup);
  if (invalid) return invalid;
  const kinds = Object.keys(REVIEW_TRUTH);
  const hit = Object.fromEntries(kinds.map((k) => [k, doc.findings.filter((f) => matches(f, k))]));
  const found = kinds.filter((k) => hit[k].length > 0);
  const stray = doc.findings.filter((f) => !kinds.some((k) => matches(f, k)));
  const per = kinds.map((k) => (hit[k].length ? `${k} ${r4(hit[k][0].from)} s` : `${k} not named`)).join('; ');
  return {
    setup,
    checks: [
      result('review', T.found, found.length, per),
      result('review', T.stray, stray.length, stray.length ? stray.map((f) => `${f.kind} ${r4(f.from)} s`).join('; ') : 'none'),
    ],
  };
}

// ---------------------------------------------------------------------------

const line = (kind, r) => `${kind} ${r.id} ${r.pass ? 'PASS' : 'FAIL'} | measured: ${r.what} | value: ${r.value} | limit: ${r.limit}`;

/** The verdict text: setup lines, one line per check, then the count. */
export function formatVerdict(name, res) {
  const scene = SCENES[name];
  const passed = res.checks.filter((c) => c.pass).length;
  return [
    `PICTURE-GRADE ${name} (scene ${scene.id} v${scene.version})`,
    ...res.setup.map((r) => line('PICTURE-SETUP', r)),
    ...res.checks.map((r) => line('PICTURE-CHECK', r)),
    `PICTURE-RESULT ${name} ${passed}/${res.checks.length} checks passed`,
  ].join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Read motion and sound: graded on what the agent names
// ---------------------------------------------------------------------------

/** Where the comp's two faults are, from the scene. */
export const CURVE_TRUTH = {
  linear: { layer: CURVE.linear.name, from: CURVE.linear.fromFrame / CURVE.fps, to: CURVE.linear.toFrame / CURVE.fps },
  late: { layer: CURVE.badges[2].name, frames: CURVE.badges[2].inFrame - CURVE.beats[2].frame, beat: CURVE.beats[2].frame / CURVE.fps },
};

export const CURVE_KINDS = ['no-ease', 'speed-jump', 'overshoot', 'late', 'early', 'other'];

const sameLayer = (a, b) => typeof a === 'string' && a.trim().toLowerCase() === b.toLowerCase();

/** Null when `doc.findings` is a list of { kind, layer, from, to?, frames? }, else what is wrong. */
function curveError(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'findings.json missing or not a JSON object';
  if (!Array.isArray(doc.findings)) return 'findings is not a list';
  for (const [i, f] of doc.findings.entries()) {
    if (!f || typeof f !== 'object') return `findings[${i}] is not an object`;
    if (!CURVE_KINDS.includes(f.kind)) return `findings[${i}].kind is ${JSON.stringify(f.kind)}, not one of ${CURVE_KINDS.join(', ')}`;
    if (typeof f.layer !== 'string' || !f.layer.trim()) return `findings[${i}].layer is not a layer name`;
    if (typeof f.from !== 'number' || !Number.isFinite(f.from)) return `findings[${i}].from is not a number of seconds`;
    if (f.to !== undefined && (typeof f.to !== 'number' || !Number.isFinite(f.to))) return `findings[${i}].to is not a number of seconds`;
    if (f.frames !== undefined && (typeof f.frames !== 'number' || !Number.isFinite(f.frames))) return `findings[${i}].frames is not a number`;
  }
  return null;
}

/**
 * doc: the parsed picture-grade/findings.json, { findings: [{ kind, layer, from, to?, frames?, note? }] }. The move
 * with no ease must be named on card B inside its move, the late hit on badge 3 with how many frames late (or a time
 * from which that follows), and nothing on card A or timing on the two hits that land on their beats.
 */
export function gradeCurve(doc) {
  const T = table('curve');
  const why = curveError(doc);
  const setup = [why === null ? result('curve', T['findings-readable'], 'yes') : failed('curve', T['findings-readable'], why)];
  const invalid = invalidIfSetupFailed('curve', setup);
  if (invalid) return invalid;
  const F = doc.findings;
  const checks = [];
  const lin = F.filter((f) => f.kind === 'no-ease' && sameLayer(f.layer, CURVE_TRUTH.linear.layer));
  const mid = (CURVE_TRUTH.linear.from + CURVE_TRUTH.linear.to) / 2;
  checks.push(lin.length === 0
    ? failed('curve', T['linear-move'], `no move with no ease named on ${CURVE_TRUTH.linear.layer}`)
    : result('curve', T['linear-move'], r4(lin.reduce((a, b) => (Math.abs(b.from - mid) < Math.abs(a.from - mid) ? b : a)).from)));
  const framesOf = (f) => (f.frames !== undefined ? f.frames : Math.round((f.from - CURVE_TRUTH.late.beat) * CURVE.fps));
  const late = F.filter((f) => f.kind === 'late' && sameLayer(f.layer, CURVE_TRUTH.late.layer));
  checks.push(late.length === 0
    ? failed('curve', T['late-hit'], `no late hit named on ${CURVE_TRUTH.late.layer}`)
    : result('curve', T['late-hit'], late.map(framesOf).reduce((a, b) => (Math.abs(b - CURVE_TRUTH.late.frames) < Math.abs(a - CURVE_TRUTH.late.frames) ? b : a))));
  checks.push(result('curve', T['eased-quiet'], F.filter((f) => sameLayer(f.layer, CURVE.eased.name)).length));
  checks.push(result('curve', T['on-beat-quiet'],
    F.filter((f) => (f.kind === 'late' || f.kind === 'early') && (sameLayer(f.layer, CURVE.badges[0].name) || sameLayer(f.layer, CURVE.badges[1].name))).length));
  return { setup, checks };
}

/** The curve eval has no final render: the agent writes what it found, and the grader reads that. */
function curvePlan(dir) {
  const limits = THRESHOLDS.curve.filter((t) => !t.setup).map((t) => `  curve.${t.id}: ${t.what}, limit ${limitText(t)}`).join('\n');
  return 'Findings for the curve eval. When your checks are done, and not before, hand the grader what a viewer would notice, once: ' +
    `node grade.mjs curve --findings '<json>' writes them to ${JSON.stringify(path.join(dir, EVALS.curve.findings))} and grades (or write that file yourself and run the grader without --plan). The JSON is: ` +
    '{ "findings": [ <finding>, ... ] }, one finding per problem, each ' +
    `{ "kind": one of ${CURVE_KINDS.map((k) => `"${k}"`).join(', ')}, "layer": the layer's name, "from": seconds from the comp's start where it starts, ` +
    '"to": seconds (for a span), "frames": for "late" or "early", frames after (+) or before (-) the beat, "note": what you saw }. ' +
    '"no-ease" is a move that starts or stops at full speed, "speed-jump" a sudden jump in speed inside a move, "overshoot" a move that passes ' +
    'its end and settles back, "late" and "early" a hit off its beat, "other" anything else. Leave the list empty if nothing is wrong.\n' +
    `Checks and limits:\n${limits}\n`;
}

// ---------------------------------------------------------------------------
// Sit an element in real footage: the plate measured from the clip itself
// ---------------------------------------------------------------------------

const lumaOf = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const mean3 = (v) => (v ? (v[0] + v[1] + v[2]) / 3 : NaN);
const median = (v) => { const s = [...v].sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };

/** Each block's frame-to-frame grain (mean of channels), edge width (null without an edge) and mean luma. */
export function measureFootagePlate(frames, rt, blocks) {
  const look = { regions: blocks.map((b, i) => ({ name: `block ${i}`, x: b.x, y: b.y, width: b.width, height: b.height, role: 'plate' })) };
  const first = rt.sheet.measureLook(frames[0], look);
  const series = rt.sheet.summarizeLookSeries(frames.map((f) => rt.sheet.lookCrops(f, look)), look);
  return blocks.map((b, i) => {
    const name = `block ${i}`;
    const f = first.regions.find((r) => r.name === name);
    const t = series.regions.find((r) => r.name === name);
    const edge = f?.sharpness?.edgeWidth;
    return { x: b.x, y: b.y, width: b.width, height: b.height, grain: r4(mean3(t?.temporal)), edge: Number.isFinite(edge) ? r4(edge) : null, luma: r4(f?.levels?.lumaMean ?? NaN) };
  });
}

/** The element region's mean luma as built: the card, and the stripe's share of the region. */
export function footageElementLuma(layout, scene = FOOTAGE) {
  const { region: r, stripe: s } = layout;
  const ox = Math.max(0, Math.min(r.x + r.width, s.x + s.width) - Math.max(r.x, s.x));
  const oy = Math.max(0, Math.min(r.y + r.height, s.y + s.height) - Math.max(r.y, s.y));
  const share = (ox * oy) / (r.width * r.height);
  return r4(lumaOf(scene.element.card.colour) * (1 - share) + lumaOf(scene.element.stripe.colour) * share);
}

/**
 * The plate's truth, from two consecutive frames of the handed clip (decoded at its own size): the blocks that hold
 * still (grain only: within 1.5 times the lowest quarter's grain, not near black or white), their median grain, the
 * median edge width of those with an edge, and the one block handed to the agent as its plate region (the still
 * block whose edge is nearest that median). Throws, saying why, when the clip has too few still blocks or edges.
 */
export function measureFootageTruth(frames, rt, scene = FOOTAGE) {
  const { width, height } = frames[0];
  const per = measureFootagePlate(frames, rt, footageBlocks(width, height, scene));
  const ok = per.filter((b) => b.luma >= 0.06 && b.luma <= 0.94 && b.grain > 0);
  const q = [...ok.map((b) => b.grain)].sort((a, b) => a - b)[Math.floor((ok.length - 1) / 4)];
  const still = ok.filter((b) => b.grain <= 1.5 * q);
  const edged = still.filter((b) => b.edge !== null);
  if (still.length < 4 || edged.length < 2) {
    throw new Error(`the clip has ${still.length} still blocks with grain and ${edged.length} of them with an edge; ` +
      'the footage eval needs at least 4 and 2: hand it a locked-off clip with grain and some still edges');
  }
  const grain = median(still.map((b) => b.grain));
  const edge = median(edged.map((b) => b.edge));
  const plate = edged.reduce((a, b) => (Math.abs(b.edge - edge) < Math.abs(a.edge - edge) ? b : a));
  const layout = footageLayout(width, height, scene);
  return {
    eval: 'footage', version: scene.version, width, height,
    grain: r4(grain), edge: r4(edge), blocks: per.length, still,
    plateRegion: { x: plate.x, y: plate.y, width: plate.width, height: plate.height },
    layout, elementLuma: footageElementLuma(layout, scene),
  };
}

/** images.frames: the seat comp at gradeFrames, as it composites. truth: footage-truth.json. */
export function gradeFootage(images, rt, truth) {
  const T = table('footage');
  const usable = truth && truth.eval === 'footage' && truth.version === FOOTAGE.version && Array.isArray(truth.still) && truth.grain > 0 && truth.edge > 0;
  const setup = [usable ? result('footage', T['clip-read'], 'yes') : failed('footage', T['clip-read'], 'footage-truth.json missing or not the plate of this eval')];
  const invalid = invalidIfSetupFailed('footage', setup);
  if (invalid) return invalid;
  const frames = images.frames ?? [];
  for (const [i] of FOOTAGE.gradeFrames.entries()) {
    const e = sizeError(frames[i], truth, `footage_${i}`);
    if (e) return allFailed('footage', e, setup);
  }
  const plate = measureFootagePlate(frames, rt, truth.still);
  const edged = plate.filter((b, i) => truth.still[i].edge !== null && b.edge !== null);
  const pg = median(plate.map((b) => b.grain));
  const pe = median(edged.map((b) => b.edge));
  const look = { regions: [{ name: 'element', ...truth.layout.region, role: 'element' }] };
  const first = rt.sheet.measureLook(frames[0], look);
  const series = rt.sheet.summarizeLookSeries(frames.map((f) => rt.sheet.lookCrops(f, look)), look);
  const er = first.regions.find((r) => r.name === 'element');
  const et = mean3(series.regions.find((r) => r.name === 'element')?.temporal);
  const ew = er?.sharpness?.edgeWidth ?? NaN;
  const checks = [
    result('footage', T['grain-match'], et / truth.grain, `element ${fmt(et)} vs plate ${fmt(truth.grain)} 8-bit steps`),
    result('footage', T['softness-match'], ew / truth.edge, `element ${fmt(ew)} px vs plate ${fmt(truth.edge)} px`),
    result('footage', T['plate-untouched'], Math.max(Math.abs(pe / truth.edge - 1), Math.abs(pg / truth.grain - 1)),
      `plate edge ${fmt(pe)} px (clip ${truth.edge}), grain ${fmt(pg)} (clip ${truth.grain}), over ${plate.length} blocks`),
    result('footage', T['element-kept'], Math.abs((er?.levels?.lumaMean ?? NaN) - truth.elementLuma), `element mean luma ${fmt(er?.levels?.lumaMean)} (built ${truth.elementLuma})`),
  ];
  return { setup, checks };
}

/** The exact final ae_render_frame calls for an eval, writing into `dir`. */
export function renderPlan(name, dir) {
  const f = (file) => JSON.stringify(path.join(dir, file));
  if (name === 'finish') return finishPlan(dir);
  if (name === 'review') return reviewPlan(dir);
  if (name === 'curve') return curvePlan(dir);
  const head = `Final renders for the ${name} eval. Make these calls exactly, once, when your work is finished, then run the grader without --plan. ` +
    `Ids come from what the setup script returned. With \`frames\`, ae_render_frame writes <outPath stem>_<call id>_<index>.png (seat_1a2b3c4d_0.png, ...), a new call id every call; the grader reads the newest call's files.\n`;
  const limits = THRESHOLDS[name].filter((t) => !t.setup).map((t) => `  ${name}.${t.id}: ${t.what}, limit ${limitText(t)}`).join('\n');
  let calls;
  if (name === 'keying') {
    calls = [
      `ae_render_frame { compNameOrId: <sourceComp id>, frames: [${KEYING.gradeFrames.source}], outPath: ${f('key-source.png')} }`,
      `ae_render_frame { compNameOrId: <keyComp id>, frames: [${KEYING.gradeFrames.keyed.join(', ')}], outPath: ${f('key.png')}, isolate: "${KEYING.layer}", channels: "rgba" }`,
    ];
  } else if (name === 'grade') {
    calls = [`ae_render_frame { compNameOrId: <gradeComp id>, frames: [${GRADE.gradeFrame}], outPath: ${f('grade.png')} }`];
  } else if (name === 'seat') {
    calls = [`ae_render_frame { compNameOrId: <seatComp id>, frames: [${SEAT.gradeFrames.join(', ')}], outPath: ${f('seat.png')} }`];
  } else if (name === 'footage') {
    calls = [`ae_render_frame { compNameOrId: <seatComp id>, frames: [${FOOTAGE.gradeFrames.join(', ')}], outPath: ${f('footage.png')} }`];
  } else {
    calls = [
      `(your reusable still of the glow, written by you to ${f('glow-still.png')})`,
      `ae_render_frame { compNameOrId: <overComp id>, frames: [${OVER.gradeFrame}], outPath: ${f('over-reference.png')}, isolate: "${OVER.layer}", over: "${OVER.navyHex}" }`,
    ];
  }
  return `${head}${calls.map((c) => `- ${c}`).join('\n')}\nChecks and limits:\n${limits}\n`;
}

/** The finish eval has no final render: the agent writes what it found, and the grader reads that. */
function finishPlan(dir) {
  const limits = THRESHOLDS.finish.filter((t) => !t.setup).map((t) => `  finish.${t.id}: ${t.what}, limit ${limitText(t)}`).join('\n');
  return 'Findings for the finish eval. When your checks are done, and not before, hand the grader what a viewer would notice in each comp, once: ' +
    `node grade.mjs finish --findings '<json>' writes them to ${JSON.stringify(path.join(dir, EVALS.finish.findings))} and grades (or write that file yourself and run the grader without --plan). The JSON is: ` +
    '{ "seeded": [ <finding>, ... ], "clean": [ <finding>, ... ] }, one finding per problem, each ' +
    `{ "kind": one of ${FINISH_KINDS.map((k) => `"${k}"`).join(', ')}, "from": seconds from the comp's start, "to": seconds (for a stretch), "note": what you saw }. ` +
    '"flash" is a one-frame flash or pop, "frozen" a stretch where the picture stops changing, "off-frame" a layer leaving the frame, ' +
    '"clipped" a highlight clipped to white, "other" anything else. Leave a list empty when the comp has nothing to report.\n' +
    `Checks and limits:\n${limits}\n`;
}

/** The review eval has no final render: the reviewer writes its review, and the grader reads that. */
function reviewPlan(dir) {
  const limits = THRESHOLDS.review.filter((t) => !t.setup).map((t) => `  review.${t.id}: ${t.what}, limit ${limitText(t)}`).join('\n');
  return 'Findings for the review eval. When your review is done, and not before, hand it to the grader, once: ' +
    `node grade.mjs review --findings '<json>' writes it to ${JSON.stringify(path.join(dir, EVALS.review.findings))} and grades (or write that file yourself and run the grader without --plan). The JSON is in the review document's form: ` +
    '{ "findings": [ <finding>, ... ], "intended": [ { "from": seconds, "note": why it is intended }, ... ], "notJudged": [ "what you could not judge", ... ] }. ' +
    'One finding per defect a viewer would notice, most noticeable first, each ' +
    `{ "kind": one of ${REVIEW_KINDS.map((k) => `"${k}"`).join(', ')}, "from": seconds from the comp's start where it starts, "to": seconds (for a span), ` +
    '"where": where in the frame, "what": what a viewer sees, "evidence": the file or number it rests on, ' +
    `"severity": one of ${SEVERITIES.map((k) => `"${k}"`).join(', ')} }. ` +
    'A flag from the whole-piece check that the brief explains goes in "intended", not in "findings". Leave "findings" empty if you find nothing.\n' +
    `Checks and limits:\n${limits}\n`;
}

/**
 * The file a render plan's name stands for: the name itself, or ae_render_frame's <stem>_<call id>_<index>.png for
 * it (a new call id every call), the newest when the call was made more than once. Null when there is neither.
 */
export async function findRender(dir, file) {
  try { await fs.access(path.join(dir, file)); return file; } catch { /* look for a call id */ }
  const m = file.match(/^(.*)_(\d+)(\.png)$/);
  if (!m) return null;
  const re = new RegExp(`^${m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_[0-9a-f]{8}_${m[2]}\\${m[3]}$`);
  let names;
  try { names = (await fs.readdir(dir)).filter((n) => re.test(n)); } catch { return null; }
  if (!names.length) return null;
  const dated = await Promise.all(names.map(async (n) => ({ n, t: (await fs.stat(path.join(dir, n))).mtimeMs })));
  return dated.sort((a, b) => b.t - a.t || (a.n < b.n ? 1 : -1))[0].n;
}

/** Read an eval's renders from `dir` (missing files come back null) and grade them. `truth`: the footage eval's plate. */
export async function gradeDir(name, dir, rt, { truth = null } = {}) {
  const read = async (file) => {
    const found = await findRender(dir, file);
    if (!found) return null;
    try { return rt.png16.decodePng(await fs.readFile(path.join(dir, found))); } catch { return null; }
  };
  if (name === 'keying') {
    const [source, ...keyed] = await Promise.all(EVALS.keying.renders.map(read));
    const missing = keyed.findIndex((k) => !k);
    if (missing >= 0) return allFailed('keying', `key_${missing}.png missing`, gradeKeying({ source, keyed: [] }, rt).setup);
    return gradeKeying({ source, keyed }, rt);
  }
  if (name === 'grade') return gradeGrade({ frame: await read(EVALS.grade.renders[0]) }, rt);
  if (name === 'seat') return gradeSeat({ frames: await Promise.all(EVALS.seat.renders.map(read)) }, rt);
  if (name === 'footage') return gradeFootage({ frames: await Promise.all(EVALS.footage.renders.map(read)) }, rt, truth);
  if (name === 'curve') {
    let doc = null;
    try { doc = JSON.parse(await fs.readFile(path.join(dir, EVALS.curve.findings), 'utf8')); } catch { doc = null; }
    return gradeCurve(doc);
  }
  if (name === 'finish') {
    let findings = null;
    try { findings = JSON.parse(await fs.readFile(path.join(dir, EVALS.finish.findings), 'utf8')); } catch { findings = null; }
    return gradeFinish(findings);
  }
  if (name === 'review') {
    let doc = null;
    try { doc = JSON.parse(await fs.readFile(path.join(dir, EVALS.review.findings), 'utf8')); } catch { doc = null; }
    return gradeReview(doc);
  }
  const [still, reference] = await Promise.all(EVALS.over.renders.map(read));
  if (!still) return allFailed('over', 'glow-still.png missing', reference ? [] : [failed('over', table('over')['reference-is-over'], 'over-reference_0.png missing')]);
  return gradeOver({ still, reference }, rt);
}
