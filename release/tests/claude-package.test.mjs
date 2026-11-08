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

// ---- Task 2: readable runtime -------------------------------------------------

const LICENSE_NAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT', 'license', 'license.md'];

async function vendoredPackageDirs(nodeModules) {
  const dirs = [];
  for (const rel of await listFiles(nodeModules)) {
    if (!rel.endsWith('/package.json')) continue;
    const dir = path.posix.dirname(rel);
    // A package root sits directly under node_modules, or under a scope folder.
    if (/(^|\/node_modules\/)(@[^/]+\/)?[^/@][^/]*$/.test(dir)) dirs.push(dir);
  }
  return dirs;
}

test('runtime is readable and within limits', async () => {
  const { outDir } = await sharedBuild();
  const runtimeFiles = await listFiles(path.join(outDir, 'runtime'));
  for (const rel of runtimeFiles) {
    const { size } = await fs.stat(path.join(outDir, 'runtime', rel));
    assert.ok(size <= 262_144, `runtime/${rel} is ${size} bytes`);
  }
  const entry = await fs.readFile(path.join(outDir, 'runtime/dist/index.js'), 'utf8');
  assert.match(entry, /registerTool/);
  assert.ok(runtimeFiles.includes('dist/tools/do.js'), 'own modules are emitted file by file');
});

test('every vendored package has a license and a notice', async () => {
  const { outDir } = await sharedBuild();
  const notices = await fs.readFile(path.join(outDir, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  const nodeModules = path.join(outDir, 'runtime/node_modules');
  const dirs = await vendoredPackageDirs(nodeModules);
  assert.ok(dirs.includes('zod') && dirs.includes('@modelcontextprotocol/sdk'), `vendored: ${dirs.join(', ')}`);
  for (const dir of dirs) {
    const { name } = JSON.parse(await fs.readFile(path.join(nodeModules, dir, 'package.json'), 'utf8'));
    const entries = await fs.readdir(path.join(nodeModules, dir));
    assert.ok(LICENSE_NAMES.some((n) => entries.includes(n)), `${dir} has no license file`);
    assert.ok(notices.includes(`${name}@`), `${name} missing from THIRD-PARTY-NOTICES.txt`);
  }
});

test('notices credit the style library source', async () => {
  const { outDir } = await sharedBuild();
  const notices = await fs.readFile(path.join(outDir, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  assert.match(notices, /Lemo-Opuscar/);
  assert.match(notices, /Copyright \(c\) 2026 LemoLab/);
});

test('vendored modules are not ignored by git', () => {
  const r = spawnSync('git', ['check-ignore', '-q', 'claude/after-effects-studio/runtime/node_modules/zod/package.json'], { cwd: ROOT });
  assert.equal(r.status, 1, 'the vendored runtime would be dropped from a Git-based install');
});

test('builder fails cleanly without installed deps', async () => {
  const { buildReadableRuntime } = await import('../claude-runtime.mjs');
  const bare = await tmp('claude-bare-runtime-');
  for (const rel of ['package.json', 'LICENSE']) await fs.copyFile(path.join(PLUGIN, 'runtime', rel), path.join(bare, rel));
  await fs.cp(path.join(PLUGIN, 'runtime/src'), path.join(bare, 'src'), { recursive: true });
  await assert.rejects(buildReadableRuntime(bare, await tmp('claude-bare-out-')), /npm ci --ignore-scripts/);
});

// ---- Task 6: Claude docs and fatal violations ---------------------------------

function section(markdown, heading) {
  const start = markdown.indexOf(`\n${heading}\n`);
  if (start < 0) return '';
  const rest = markdown.slice(start + heading.length + 2);
  const next = rest.search(/\n## /);
  return next < 0 ? rest : rest.slice(0, next);
}

test('README covers directory requirements', async () => {
  const { outDir } = await sharedBuild();
  const readme = await fs.readFile(path.join(outDir, 'README.md'), 'utf8');
  const prose = readme.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  assert.ok(prose.length >= 40, `README prose has ${prose.length} words`);
  for (const heading of ['## Requirements', '## Where it works', '## What it runs and sends', '## Privacy',
    '## Example prompts', '## Install', '## Remove']) {
    assert.ok(readme.includes(`\n${heading}\n`), `missing heading ${heading}`);
  }
  const prompts = section(readme, '## Example prompts').split('\n').filter((l) => /^\s*[-*] \S/.test(l));
  assert.ok(prompts.length >= 3, `only ${prompts.length} example prompts`);
  for (const needle of ['Node.js 24', 'nodejs.org', 'AE_MCP_READONLY=1', 'AE_MCP_ENABLE_EVAL=0']) {
    assert.ok(readme.includes(needle), `README does not mention ${needle}`);
  }
});

test('install commands match the manifest name', async () => {
  const { outDir } = await sharedBuild();
  const { name } = JSON.parse(await fs.readFile(path.join(ROOT, 'claude/src/plugin.json'), 'utf8'));
  const install = await fs.readFile(path.join(outDir, 'docs/local-install.md'), 'utf8');
  assert.ok(install.includes(`claude plugin install ${name}@jb-technology`));
  assert.ok(install.includes(`claude plugin uninstall ${name}@jb-technology`));
  const readme = await fs.readFile(path.join(outDir, 'README.md'), 'utf8');
  assert.ok(readme.includes(`claude plugin install ${name}@jb-technology`));
});

test('build output passes all checks', async () => {
  const { outDir } = await sharedBuild();
  assert.deepEqual(await checkPackage(outDir), []);
});

test('builder exits 1 on violations', async () => {
  const src = await tmp('claude-src-');
  await fs.cp(path.join(ROOT, 'claude/src'), src, { recursive: true });
  await write(src, 'docs/extra.md', 'Start a new Codex task.\n');
  const outDir = path.join(await tmp('claude-violation-'), 'after-effects-studio');
  const r = spawnSync(process.execPath, [BUILDER, '--src', src, '--out', outDir], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /docs\/extra\.md/);
});

// Start the packaged server the way Claude Code does: ${CLAUDE_PLUGIN_ROOT} substituted,
// the user's environment overlaid by the config's own env, launched from another folder.
async function catalogCategories(outDir, userEnv) {
  const { mcpServers } = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const server = mcpServers['after-effects-studio'];
  const sub = (v) => v.replaceAll('${CLAUDE_PLUGIN_ROOT}', outDir);
  const input = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'ae_catalog', arguments: {} } },
  ].map((m) => JSON.stringify(m)).join('\n') + '\n';
  const env = { ...process.env, ...userEnv, ...(server.env ?? {}) };
  for (const key of Object.keys(env)) if (env[key] === undefined) delete env[key];
  const r = spawnSync(sub(server.command), server.args.map(sub), { cwd: os.tmpdir(), env, input, encoding: 'utf8', timeout: 20_000 });
  const reply = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((m) => m.id === 2);
  assert.ok(reply, `no catalog reply: ${r.stderr}`);
  const body = reply.result.structuredContent ?? JSON.parse(reply.result.content[0].text);
  return body.categories.map((c) => c.category);
}

test('custom scripting is on by default and the user can turn it off', async () => {
  const { outDir } = await sharedBuild();
  const defaults = await catalogCategories(outDir, { AE_MCP_ENABLE_EVAL: undefined });
  assert.ok(defaults.includes('eval'), 'eval.run should be available by default');
  const off = await catalogCategories(outDir, { AE_MCP_ENABLE_EVAL: '0' });
  assert.ok(!off.includes('eval'), 'AE_MCP_ENABLE_EVAL=0 in the user environment must remove eval.run');
});
