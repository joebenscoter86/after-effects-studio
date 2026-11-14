// The footage eval (27) on a clip drawn for the test: a still, grainy shot with soft panel edges, encoded with
// ffmpeg. The suite writer measures the plate from the clip, fills the setup in, and the case's own grader then
// scores renders made here in its place: a clean element fails on grain and softness, an element given the plate's
// grain and softness passes, and a plate given more grain fails as changed. No clip of anyone's is used, and nothing
// here reaches After Effects. Skips, saying so, without ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { writeEvalSuite, footageTruth, footageSetup } from '../claude-evals.mjs';
import { THRESHOLDS, loadRuntime, measureFootageTruth } from '../../plugin/evals/picture/checks.mjs';
import { FOOTAGE, footageBlocks, footageLayout } from '../../plugin/evals/picture/scenes.mjs';
import { footageFrame, writePng } from './picture-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = path.join(ROOT, 'plugin', 'runtime', 'dist');
const CANON = JSON.parse(await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'evals.json'), 'utf8'));
const run = promisify(execFile);
const HAVE_FFMPEG = ['ffmpeg', 'ffprobe'].every((t) => spawnSync(t, ['-version']).status === 0);
const skip = HAVE_FFMPEG ? false : 'ffmpeg and ffprobe are not installed: the footage eval tests are skipped';
const tmp = (prefix) => fs.mkdtemp(path.join(os.tmpdir(), prefix));
const rt = await loadRuntime(DIST);

// A wall with two dark panels, softened and grained afresh every frame (the noise filter's temporal mode).
const SCENE_FILTER = 'color=c=0x736e66:s=640x360:r=24:d=2,drawbox=x=60:y=50:w=220:h=260:color=0x1f1f22:t=fill,' +
  'drawbox=x=380:y=200:w=180:h=120:color=0x2a2a30:t=fill,gblur=sigma=1.6,noise=alls=12:allf=t+u,format=yuv420p';

async function drawClip(dir, name, filter) {
  const file = path.join(dir, name);
  await run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', filter, '-c:v', 'libx264', '-preset', 'fast', '-crf', '10', '-pix_fmt', 'yuv420p', file]);
  return file;
}

/** The clip's frames 0 and 1 as the suite writer decodes them. */
async function plateFrames(clip) {
  const video = await import(pathToFileURL(path.join(DIST, 'video', 'movie-rgb.js')).href);
  const info = await video.probeVideo(clip);
  const colour = await video.movieColour(clip);
  const out = [];
  for await (const f of video.movieFrames(info, FOOTAGE.gradeFrames, colour)) out.push(f.img);
  return out;
}

const failing = (verdict) => [...verdict.matchAll(/^PICTURE-CHECK footage\.(\S+) FAIL /gm)].map((m) => m[1]).sort();

test('the footage eval: the clip is measured, the setup filled in, and the case grades renders against the clip', { skip }, async () => {
  const dir = await tmp('footage-');
  const clip = await drawClip(dir, 'grainy-wall.mp4', SCENE_FILTER);
  const out = path.join(dir, 'pkg', 'evals');
  const cases = await writeEvalSuite(CANON, out, { set: 'picture', env: { [FOOTAGE.env]: clip } });
  assert.deepEqual(cases.skipped, []);
  const written = cases.find((c) => c.id === 27);
  assert.ok(written, 'case 27 written');
  const caseDir = path.join(out, written.name, 'files');   // what the scaffold copies into the workspace

  // the plate's truth, measured from the clip with the grader's own code
  const truth = JSON.parse(await fs.readFile(path.join(caseDir, 'footage-truth.json'), 'utf8'));
  assert.equal(truth.eval, 'footage');
  assert.equal(truth.width, 640);
  assert.equal(truth.height, 360);
  assert.ok(truth.grain > 0.5 && truth.grain < 20, `grain ${truth.grain}`);
  assert.ok(truth.edge > 1 && truth.edge < 15, `edge ${truth.edge}`);
  assert.ok(truth.still.length >= 4);
  assert.deepEqual(truth.layout, footageLayout(640, 360));
  const card = truth.layout.card;
  for (const b of truth.still) {
    assert.ok(b.x + b.width <= card.x - FOOTAGE.margin || b.x >= card.x + card.width + FOOTAGE.margin ||
      b.y + b.height <= card.y - FOOTAGE.margin || b.y >= card.y + card.height + FOOTAGE.margin, 'no plate block near the card');
  }
  assert.ok(truth.still.some((b) => b.x === truth.plateRegion.x && b.y === truth.plateRegion.y && b.edge !== null));
  assert.match(truth.clip.colour, /^Decoded with matrix /);

  // the setup names the clip and the plate region, and the repository's copy names neither
  const setup = await fs.readFile(path.join(caseDir, 'seat-footage.jsx'), 'utf8');
  assert.ok(setup.includes(`var FOOTAGE_FILE = ${JSON.stringify(clip)};`));
  assert.ok(setup.includes(`var PLATE_REGION = ${JSON.stringify(truth.plateRegion)};`));
  const repo = await fs.readFile(path.join(ROOT, 'plugin', 'evals', 'picture', 'seat-footage.jsx'), 'utf8');
  assert.match(repo, /var FOOTAGE_FILE = null;\nvar PLATE_REGION = null;/);
  assert.throws(() => footageSetup('no block here', clip, truth.plateRegion), /FOOTAGE-BEGIN/);

  // the case's own grader, run as the agent runs it, on renders made here
  const plates = await plateFrames(clip);
  const grade = async (opts) => {
    const cwd = await tmp('footage-run-');
    for (const [i] of FOOTAGE.gradeFrames.entries()) {
      await writePng(rt, path.join(cwd, 'picture-grade', `footage_${i}.png`), footageFrame(plates[i], truth.layout, i, opts));
    }
    const plan = await run(process.execPath, [path.join(caseDir, 'grade.mjs'), 'footage', '--plan'], { cwd });
    assert.match(plan.stdout, /footage\.png/);
    const { stdout } = await run(process.execPath, [path.join(caseDir, 'grade.mjs'), 'footage'], { cwd });
    assert.match(stdout, /^PICTURE-SETUP footage\.clip-read PASS /m);
    return stdout;
  };
  assert.deepEqual(failing(await grade({})), ['grain-match', 'softness-match']);                       // clean and sharp: pasted on
  const matched = { sigma: truth.edge / 2.56, grain: truth.grain };
  assert.deepEqual(failing(await grade(matched)), []);                                                    // the plate's grain and softness
  assert.deepEqual(failing(await grade({ ...matched, plateGrain: 3 * truth.grain })), ['plate-untouched']); // the plate changed too
});

test('the footage eval refuses a clip it cannot measure, saying why', { skip }, async () => {
  const dir = await tmp('footage-bad-');
  const flat = await drawClip(dir, 'flat.mp4', 'color=c=0x736e66:s=640x360:r=24:d=1,noise=alls=12:allf=t+u,format=yuv420p');
  await assert.rejects(footageTruth(flat), /still blocks with grain and 0 of them with an edge/);
  const wide = await drawClip(dir, 'wide.mp4', 'color=c=0x736e66:s=2048x128:r=24:d=1,format=yuv420p');
  await assert.rejects(footageTruth(wide), /at most 1920 px on the longer side/);
  await assert.rejects(writeEvalSuite(CANON, path.join(dir, 'pkg', 'evals'), { set: 'picture', env: { [FOOTAGE.env]: flat } }), /with an edge/);
});

test('the footage scene: blocks avoid the card, the region holds the stripe, the checks are the seat eval\'s', () => {
  const layout = footageLayout(1080, 1920);
  const { card, stripe, region } = layout;
  assert.ok(region.x >= card.x && region.x + region.width <= card.x + card.width && region.y >= card.y && region.y + region.height <= card.y + card.height);
  assert.ok(stripe.y > region.y && stripe.y + stripe.height < region.y + region.height, 'both stripe edges inside the region');
  const blocks = footageBlocks(1080, 1920);
  assert.equal(blocks[0].width, 180);
  assert.ok(blocks.length > 40);
  assert.deepEqual(THRESHOLDS.footage.filter((t) => !t.setup).map((t) => t.id), ['grain-match', 'softness-match', 'plate-untouched', 'element-kept']);
  assert.throws(() => measureFootageTruth([{ width: 64, height: 64, rgb: new Float64Array(64 * 64 * 3), bitDepth: 8 }, { width: 64, height: 64, rgb: new Float64Array(64 * 64 * 3), bitDepth: 8 }], rt), /still blocks/);
});
