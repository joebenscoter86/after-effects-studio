// Grading for the picture evals (plugin/evals/evals.json ids 18 to 20): the
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

import { FINISH, GRADE, KEYING, OVER, SCENES } from './scenes.mjs';

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
};

/** The scored check ids of an eval, in verdict order ("<eval>.<check>"). */
export const checkIds = (name) => THRESHOLDS[name].filter((t) => !t.setup).map((t) => `${name}.${t.id}`);

/** What each eval's setup, task and final renders are. */
export const EVALS = {
  keying: { scene: KEYING, setup: 'keying-shot.jsx', renders: ['key-source_0.png', ...KEYING.gradeFrames.keyed.map((_, i) => `key_${i}.png`)] },
  grade: { scene: GRADE, setup: 'grade-plate.jsx', renders: ['grade_0.png'] },
  over: { scene: OVER, setup: 'over-still.jsx', renders: ['glow-still.png', 'over-reference_0.png'] },
  finish: { scene: FINISH, setup: 'finish-check.jsx', renders: [], findings: 'findings.json' },
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

/** The exact final ae_render_frame calls for an eval, writing into `dir`. */
export function renderPlan(name, dir) {
  const f = (file) => JSON.stringify(path.join(dir, file));
  if (name === 'finish') return finishPlan(dir);
  const head = `Final renders for the ${name} eval. Make these calls exactly, once, when your work is finished, then run the grader without --plan. ` +
    `Ids come from what the setup script returned. With \`frames\`, ae_render_frame writes <outPath stem>_<index>.png (key_0.png, grade_0.png, ...); the grader reads those.\n`;
  const limits = THRESHOLDS[name].filter((t) => !t.setup).map((t) => `  ${name}.${t.id}: ${t.what}, limit ${limitText(t)}`).join('\n');
  let calls;
  if (name === 'keying') {
    calls = [
      `ae_render_frame { compNameOrId: <sourceComp id>, frames: [${KEYING.gradeFrames.source}], outPath: ${f('key-source.png')} }`,
      `ae_render_frame { compNameOrId: <keyComp id>, frames: [${KEYING.gradeFrames.keyed.join(', ')}], outPath: ${f('key.png')}, isolate: "${KEYING.layer}", channels: "rgba" }`,
    ];
  } else if (name === 'grade') {
    calls = [`ae_render_frame { compNameOrId: <gradeComp id>, frames: [${GRADE.gradeFrame}], outPath: ${f('grade.png')} }`];
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
  return 'Findings for the finish eval. When your checks are done, and not before, write what a viewer would notice in each comp to ' +
    `${JSON.stringify(path.join(dir, EVALS.finish.findings))}, then run the grader without --plan. The file is JSON: ` +
    '{ "seeded": [ <finding>, ... ], "clean": [ <finding>, ... ] }, one finding per problem, each ' +
    `{ "kind": one of ${FINISH_KINDS.map((k) => `"${k}"`).join(', ')}, "from": seconds from the comp's start, "to": seconds (for a stretch), "note": what you saw }. ` +
    '"flash" is a one-frame flash or pop, "frozen" a stretch where the picture stops changing, "off-frame" a layer leaving the frame, ' +
    '"clipped" a highlight clipped to white, "other" anything else. Leave a list empty when the comp has nothing to report.\n' +
    `Checks and limits:\n${limits}\n`;
}

/** Read an eval's renders from `dir` (missing files come back null) and grade them. */
export async function gradeDir(name, dir, rt) {
  const read = async (file) => {
    try { return rt.png16.decodePng(await fs.readFile(path.join(dir, file))); } catch { return null; }
  };
  if (name === 'keying') {
    const [source, ...keyed] = await Promise.all(EVALS.keying.renders.map(read));
    const missing = keyed.findIndex((k) => !k);
    if (missing >= 0) return allFailed('keying', `key_${missing}.png missing`, gradeKeying({ source, keyed: [] }, rt).setup);
    return gradeKeying({ source, keyed }, rt);
  }
  if (name === 'grade') return gradeGrade({ frame: await read(EVALS.grade.renders[0]) }, rt);
  if (name === 'finish') {
    let findings = null;
    try { findings = JSON.parse(await fs.readFile(path.join(dir, EVALS.finish.findings), 'utf8')); } catch { findings = null; }
    return gradeFinish(findings);
  }
  const [still, reference] = await Promise.all(EVALS.over.renders.map(read));
  if (!still) return allFailed('over', 'glow-still.png missing', reference ? [] : [failed('over', table('over')['reference-is-over'], 'over-reference_0.png missing')]);
  return gradeOver({ still, reference }, rt);
}
