import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SHEET_WIDTH, cellHeight, makeProofSheets, probe, stillSheetCommand } from '../proofs/contact-sheet.mjs';

const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

test('the sheet is 512 wide and its cells keep the reference shape within limits', () => {
  assert.equal(SHEET_WIDTH, 512);
  assert.equal(cellHeight([1920, 1080], 512, 144, 512), 288);
  assert.equal(cellHeight([400, 1200], 512, 144, 512), 512); // a tall crop is held at a square cell
  assert.equal(cellHeight([3000, 300], 512, 144, 512), 144);
  const cmd = stillSheetCommand({ ref: 'r.png', build: 'b.png', out: 's.png', refSize: [1920, 1080] }).join(' ');
  assert.match(cmd, /scale=512:288/);
  assert.match(cmd, /vstack/);
});

test('makeProofSheets writes a 512-wide still sheet, and a motion sheet when both movies exist', { skip: !hasFfmpeg }, async () => {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'sheet-test-'));
  const lavfi = (src, out, extra = []) => spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', src, ...extra, out]);
  lavfi('color=c=red:s=800x450', path.join(dir, 'reference.png'), ['-frames:v', '1']);
  lavfi('color=c=blue:s=1920x1080', path.join(dir, 'build.png'), ['-frames:v', '1']);
  let made = await makeProofSheets(dir);
  assert.deepEqual(made, ['sheet.png', 'side-by-side.png']);
  let s = probe(path.join(dir, 'sheet.png'));
  assert.equal(s.width, 512);
  assert.equal(s.height, 576);
  lavfi('testsrc=s=640x360:d=1:r=24', path.join(dir, 'reference.mp4'), ['-pix_fmt', 'yuv420p']);
  lavfi('testsrc=s=1920x1080:d=1:r=24', path.join(dir, 'build.mov'), ['-pix_fmt', 'yuv420p']);
  made = await makeProofSheets(dir);
  assert.ok(made.includes('sheet-motion.png'));
  s = probe(path.join(dir, 'sheet-motion.png'));
  assert.equal(s.width, 512);
  assert.equal(s.height, 4 * 144);
});

test('makeProofSheets refuses without a reference or a build', async () => {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'sheet-test-'));
  await assert.rejects(makeProofSheets(dir, { run: () => {}, read: () => ({}) }), /reference\.png is missing/);
});
