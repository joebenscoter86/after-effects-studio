// Tests for the Claude package builder and its directory-rule checks.
// Run: node --test release/tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { checkPackage } from '../claude-checks.mjs';
import { buildClaudePackage } from '../build-claude-package.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLUGIN = path.join(ROOT, 'plugin');
const BUILDER = path.join(ROOT, 'release', 'build-claude-package.mjs');

const tmp = (prefix) => fs.mkdtemp(path.join(os.tmpdir(), prefix));

async function write(root, rel, data) {
  const file = path.join(root, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

async function listFiles(root, rel = '') {
  const out = [];
  for (const entry of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = path.posix.join(rel, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(root, child)));
    else out.push(child);
  }
  return out;
}

const README_OK = 'After Effects Studio creates and revises editable motion graphics in a local copy of Adobe After Effects. '
  + 'It bundles a production-derived motion language, native control tools, worked examples and review guidance, '
  + 'so a request becomes an editable project with rendered frames you can inspect before accepting the result.\n';

async function cleanFixture() {
  const dir = await tmp('claude-check-clean-');
  await write(dir, '.claude-plugin/plugin.json', '{"name":"x"}\n');
  await write(dir, 'README.md', README_OK);
  await write(dir, 'LICENSE', 'terms\n');
  await write(dir, 'runtime/package.json', '{"name":"r"}\n');
  await write(dir, 'assets/big.png', Buffer.alloc(300_000));
  return dir;
}

let shared;
async function sharedBuild() {
  shared ??= (async () => {
    const outDir = path.join(await tmp('claude-build-'), 'after-effects-studio');
    return buildClaudePackage({ outDir });
  })();
  return shared;
}

test('checkPackage passes a clean fixture', async () => {
  assert.deepEqual(await checkPackage(await cleanFixture()), []);
});

test('checkPackage flags each rule once', async () => {
  const dir = await tmp('claude-check-bad-');
  await write(dir, 'README.md', 'Too short.\n');
  await write(dir, '.DS_Store', 'x');
  await write(dir, 'bin/x', '#!/bin/sh\n');
  await write(dir, 'runtime/package-lock.json', '{}\n');
  await write(dir, 'package.json', '{}\n');
  await write(dir, 'docs/huge.md', Buffer.alloc(262_145, 'a'));
  await write(dir, 'docs/host.md', 'Open a new Codex task.\n');
  await write(dir, 'docs/private.md', 'see /Users/someone/secret\n');
  await write(dir, 'assets/lfs.bin', 'version https://git-lfs.github.com/spec/v1\noid sha256:abc\n');
  await write(dir, '.gitmodules', '[submodule "x"]\n');
  await fs.symlink('/etc/hosts', path.join(dir, 'link'));
  for (let i = 0; i < 510; i += 1) await write(dir, `filler/f${i}.txt`, 'x\n');

  const violations = await checkPackage(dir);
  const rules = [
    /manifest/i, /README/, /LICENSE/, /\.DS_Store/, /symlink/i, /bin\//, /lockfile/i,
    /root package\.json/i, /262,?144|256 KiB/i, /more than 512/i, /codex|gpt-/i,
    /private path|credential/i, /LFS/, /submodule/i,
  ];
  for (const rule of rules) {
    const hits = violations.filter((v) => rule.test(v));
    assert.equal(hits.length, 1, `expected exactly one violation matching ${rule}, got ${JSON.stringify(hits)}`);
  }
});

test('checkPackage allows runtime package.json below the root', async () => {
  const dir = await cleanFixture();
  await write(dir, 'runtime/node_modules/zod/package.json', '{"name":"zod"}\n');
  assert.deepEqual(await checkPackage(dir), []);
});

test('skills and library match plugin/ byte for byte', async () => {
  const { outDir } = await sharedBuild();
  for (const tree of ['skills', 'library']) {
    const src = (await listFiles(path.join(PLUGIN, tree))).filter((f) => !f.endsWith('.DS_Store')).sort();
    const out = (await listFiles(path.join(outDir, tree))).sort();
    assert.deepEqual(out, src, `${tree} file list differs`);
    for (const rel of src) {
      const a = await fs.readFile(path.join(PLUGIN, tree, rel));
      const b = await fs.readFile(path.join(outDir, tree, rel));
      assert.ok(a.equals(b), `${tree}/${rel} differs from plugin/`);
    }
  }
});

test('manifest and MCP config', async () => {
  const { outDir } = await sharedBuild();
  const manifest = await fs.readFile(path.join(outDir, '.claude-plugin/plugin.json'));
  assert.ok(manifest.equals(await fs.readFile(path.join(ROOT, 'claude/src/plugin.json'))));
  const mcp = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const server = mcp.mcpServers['after-effects-studio'];
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/start.mjs']);
  assert.equal(server.cwd, undefined);
  assert.equal(server.env.AE_MCP_ENABLE_EVAL, '1');
});

test('LICENSE equals license.md and both are present', async () => {
  const { outDir } = await sharedBuild();
  const license = await fs.readFile(path.join(outDir, 'LICENSE'));
  const terms = await fs.readFile(path.join(outDir, 'license.md'));
  assert.ok(license.length > 0);
  assert.ok(license.equals(terms));
  assert.ok(terms.equals(await fs.readFile(path.join(PLUGIN, 'license.md'))));
});

test('runtime package.json is minimal', async () => {
  const { outDir } = await sharedBuild();
  const { version } = JSON.parse(await fs.readFile(path.join(PLUGIN, 'runtime/package.json'), 'utf8'));
  const pkg = JSON.parse(await fs.readFile(path.join(outDir, 'runtime/package.json'), 'utf8'));
  assert.deepEqual(pkg, { name: 'after-effects-studio-runtime', version, private: true, type: 'module' });
});

test('a rebuild removes files that are no longer produced', async () => {
  const outDir = path.join(await tmp('claude-rebuild-'), 'after-effects-studio');
  await buildClaudePackage({ outDir });
  await write(outDir, 'stale/leftover.md', 'old\n');
  const { files } = await buildClaudePackage({ outDir });
  assert.ok(!files.includes('stale/leftover.md'));
  await assert.rejects(fs.access(path.join(outDir, 'stale/leftover.md')));
});

test('builder refuses to write over the repository or plugin/', async () => {
  await assert.rejects(buildClaudePackage({ outDir: ROOT }), /refus/i);
  await assert.rejects(buildClaudePackage({ outDir: PLUGIN }), /refus/i);
});

test('check mode detects drift', async () => {
  const outDir = path.join(await tmp('claude-drift-'), 'after-effects-studio');
  const build = spawnSync(process.execPath, [BUILDER, '--out', outDir], { encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr);
  const clean = spawnSync(process.execPath, [BUILDER, '--check', '--out', outDir], { encoding: 'utf8' });
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  await fs.appendFile(path.join(outDir, 'skills/ae-control/SKILL.md'), 'x');
  const drift = spawnSync(process.execPath, [BUILDER, '--check', '--out', outDir], { encoding: 'utf8' });
  assert.equal(drift.status, 1);
  assert.match(drift.stdout, /skills\/ae-control\/SKILL\.md/);
});
