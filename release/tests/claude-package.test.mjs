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

const README_OK = 'Comp Room creates and revises editable motion graphics in a local copy of Adobe After Effects. '
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
    const outDir = path.join(await tmp('claude-build-'), 'comp-room');
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
  await write(dir, 'runtime/node_modules/@scope/pkg/index.js', 'export {};\n');
  await fs.symlink('/etc/hosts', path.join(dir, 'link'));
  for (let i = 0; i < 510; i += 1) await write(dir, `filler/f${i}.txt`, 'x\n');

  const violations = await checkPackage(dir);
  const rules = [
    /manifest/i, /README/, /LICENSE/, /\.DS_Store/, /symlink/i, /bin\//, /lockfile/i,
    /root package\.json/i, /262,?144|256 KiB/i, /more than 512/i, /codex|gpt-/i,
    /private path|credential/i, /LFS/, /submodule/i, /character the Claude app/i,
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
  const { name, displayName } = JSON.parse(manifest);
  assert.equal(name, 'comp-room');
  assert.equal(displayName, 'Comp Room');
  const mcp = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  assert.deepEqual(Object.keys(mcp.mcpServers), ['comp-room']);
  const server = mcp.mcpServers['comp-room'];
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
  assert.deepEqual(pkg, { name: 'comp-room-runtime', version, private: true, type: 'module', serverName: 'comp-room' });
});

test('a rebuild removes files that are no longer produced', async () => {
  const outDir = path.join(await tmp('claude-rebuild-'), 'comp-room');
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
  const outDir = path.join(await tmp('claude-drift-'), 'comp-room');
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

test('every path is one the Claude app accepts in an uploaded plugin', async () => {
  const { outDir } = await sharedBuild();
  const bad = (await listFiles(outDir)).filter((rel) => /[^A-Za-z0-9._\/-]/.test(rel));
  assert.deepEqual(bad, []);
  const imports = [];
  for (const rel of (await listFiles(path.join(outDir, 'runtime'))).filter((f) => f.endsWith('.js'))) {
    const text = await fs.readFile(path.join(outDir, 'runtime', rel), 'utf8');
    for (const m of text.matchAll(/^\s*(?:(?:import|export)\b[^\n]*?\bfrom\s*|import\s*\(\s*)["'](@[^"']+)["']/gm)) imports.push(`${rel}: ${m[1]}`);
  }
  assert.deepEqual(imports, [], 'no runtime file imports a scoped package name');
});

test('every vendored package has a license and a notice', async () => {
  const { outDir } = await sharedBuild();
  const notices = await fs.readFile(path.join(outDir, 'THIRD-PARTY-NOTICES.txt'), 'utf8');
  const nodeModules = path.join(outDir, 'runtime/node_modules');
  const dirs = await vendoredPackageDirs(nodeModules);
  assert.ok(dirs.includes('zod') && dirs.includes('modelcontextprotocol-sdk'), `vendored: ${dirs.join(', ')}`);
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
  assert.match(notices, /EMS Tech/);
  assert.match(notices, /SIL OPEN FONT LICENSE/i);
});

test('no file of the built package is ignored by git', async () => {
  const { outDir, files } = await sharedBuild();
  const { name } = JSON.parse(await fs.readFile(path.join(ROOT, 'claude/src/plugin.json'), 'utf8'));
  assert.equal(path.basename(outDir), name);
  const input = files.map((f) => `claude/${name}/${f}`).join('\n') + '\n';
  const r = spawnSync('git', ['check-ignore', '--stdin', '--no-index'], { cwd: ROOT, input, encoding: 'utf8' });
  assert.equal(r.stdout, '', 'these files would be dropped from a Git-based install');
});

test('a renamed package keeps its vendored runtime in git', () => {
  const r = spawnSync('git', ['check-ignore', '-q', '--no-index', 'claude/renamed-plugin/runtime/node_modules/zod/package.json'], { cwd: ROOT });
  assert.equal(r.status, 1, 'the ignore exception must not depend on the plugin name');
});

test('the committed package matches a fresh build', () => {
  const r = spawnSync(process.execPath, [BUILDER, '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `rebuild with node release/build-claude-package.mjs and commit:\n${r.stdout}`);
});

test('refuses to clear a folder that is not a previous build', async () => {
  const outDir = await tmp('claude-userdir-');
  await write(outDir, 'notes.txt', 'mine\n');
  await assert.rejects(buildClaudePackage({ outDir }), /refus/i);
  assert.equal(await fs.readFile(path.join(outDir, 'notes.txt'), 'utf8'), 'mine\n');
  const empty = await tmp('claude-empty-');
  await buildClaudePackage({ outDir: empty });
  await fs.access(path.join(empty, '.claude-plugin/plugin.json'));
});

test('vendored versions must match the lockfile', async () => {
  const { checkLockedVersions } = await import('../claude-runtime.mjs');
  const dir = await tmp('claude-lock-');
  await write(dir, 'package-lock.json', JSON.stringify({ packages: { 'node_modules/zod': { version: '4.6.7' }, 'node_modules/@x/y': { version: '1.0.0' } } }));
  await write(dir, 'node_modules/zod/package.json', JSON.stringify({ name: 'zod', version: '4.4.3' }));
  await write(dir, 'node_modules/@x/y/package.json', JSON.stringify({ name: '@x/y', version: '1.0.0' }));
  const problems = await checkLockedVersions(dir, [path.join(dir, 'node_modules/zod'), path.join(dir, 'node_modules/@x/y')]);
  assert.deepEqual(problems, ['zod 4.4.3 is installed but the lockfile has 4.6.7']);
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
  const outDir = path.join(await tmp('claude-violation-'), 'comp-room');
  const r = spawnSync(process.execPath, [BUILDER, '--src', src, '--out', outDir], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /docs\/extra\.md/);
});

// Start the packaged server the way Claude Code does: ${CLAUDE_PLUGIN_ROOT} substituted,
// the user's environment overlaid by the config's own env, launched from another folder.
async function catalogCategories(outDir, userEnv) {
  const { mcpServers } = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const server = mcpServers['comp-room'];
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

// Adobe's trademark guidelines bar its marks from a plug-in's product name (D-entry for the Comp Room rename).
// The repository URL keeps its name; the license waits on Joe's approval of its text.
test('the packaged server introduces itself as comp-room', async () => {
  const { outDir } = await sharedBuild();
  const { mcpServers } = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const server = mcpServers['comp-room'];
  const sub = (v) => v.replaceAll('${CLAUDE_PLUGIN_ROOT}', outDir);
  const input = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }) + '\n';
  const r = spawnSync(sub(server.command), server.args.map(sub), { cwd: os.tmpdir(), input, encoding: 'utf8', timeout: 20_000 });
  const reply = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((m) => m.id === 1);
  assert.ok(reply, `no initialize reply: ${r.stderr}`);
  assert.equal(reply.result.serverInfo.name, 'comp-room');
  assert.doesNotMatch(reply.result.instructions, /After Effects Studio/i);
});

test('no shipped file names the old product', async () => {
  const { outDir, files } = await sharedBuild();
  const exempt = new Set(['LICENSE', 'license.md']);
  const hits = [];
  for (const rel of files) {
    if (exempt.has(rel) || rel.startsWith('runtime/node_modules/')) continue;
    // The runtime is shared: the Codex package's server name stays the fallback, and this package's serverName overrides it.
    const text = (await fs.readFile(path.join(outDir, rel), 'utf8'))
      .replaceAll('joebenscoter86/after-effects-studio', '').replace('serverName ?? "after-effects-studio"', '');
    if (/after[- ]effects[- ]studio/i.test(text)) hits.push(rel);
  }
  assert.deepEqual(hits, []);
});

// Directory checklist: a bundled image is shown in the README with Markdown image syntax, and no file names a
// bundled image in backticks or a code block (a reviewer hold otherwise). The manifest's icon is exempt.
test('bundled images follow the directory image rule', async () => {
  const { outDir, files } = await sharedBuild();
  const { icon } = JSON.parse(await fs.readFile(path.join(outDir, '.claude-plugin/plugin.json'), 'utf8'));
  const images = files.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
  const readme = await fs.readFile(path.join(outDir, 'README.md'), 'utf8');
  const unshown = images.filter((f) => f !== path.normalize(icon) && !readme.includes(`](${f})`));
  assert.deepEqual(unshown, [], 'bundled images missing from the README');
  const named = [];
  for (const rel of files) {
    if (rel.startsWith('runtime/node_modules/') || !/\.(md|txt|json|mjs|js|jsx)$/.test(rel)) continue;
    const text = await fs.readFile(path.join(outDir, rel), 'utf8');
    const spans = [...text.matchAll(/```[\s\S]*?```|`[^`\n]*`/g)].map((m) => m[0]);
    for (const img of images) {
      const base = path.basename(img);
      const stem = base.replace(/\.[^.]+$/, '');
      if (spans.some((s) => s.includes(base) || (s.includes(stem) && /\*/.test(s)) || s.includes(img))) named.push(`${rel} names ${img}`);
    }
  }
  assert.deepEqual(named, []);
});

test('custom scripting is on by default and the user can turn it off', async () => {
  const { outDir } = await sharedBuild();
  const defaults = await catalogCategories(outDir, { AE_MCP_ENABLE_EVAL: undefined });
  assert.ok(defaults.includes('eval'), 'eval.run should be available by default');
  const off = await catalogCategories(outDir, { AE_MCP_ENABLE_EVAL: '0' });
  assert.ok(!off.includes('eval'), 'AE_MCP_ENABLE_EVAL=0 in the user environment must remove eval.run');
});

// ---- CL-9: the style library in the Claude package ---------------------------------

test('README discloses style tool dependencies and the six skills', async () => {
  const { outDir } = await sharedBuild();
  const readme = await fs.readFile(path.join(outDir, 'README.md'), 'utf8');
  const disclosure = section(readme, '## Requirements') + section(readme, '## What it runs and sends');
  assert.match(disclosure, /ffmpeg/);
  assert.match(disclosure, /Blender/);
  const skills = (await fs.readdir(path.join(outDir, 'skills'))).sort();
  assert.equal(skills.length, 6);
  assert.match(readme, /Six skills \(/);
  for (const skill of skills) assert.ok(readme.includes(skill), `README does not name ${skill}`);
});

test('the package ships the style library without fonts', async () => {
  const { outDir, files } = await sharedBuild();
  const index = JSON.parse(await fs.readFile(path.join(outDir, 'library/styles/index.json'), 'utf8'));
  assert.equal(index.styles.length, 30);
  assert.deepEqual(files.filter((f) => f.startsWith('library/styles/') && /\.(ttf|otf|woff2?)$/i.test(f)), []);
  await fs.access(path.join(outDir, 'skills/visual-styles/SKILL.md'));
});

// ---- Pro finish stage 2: the reviewer agent -----------------------------------

// The plugin's own MCP tools as Claude Code names them. Observed in a live session, not documented.
const pluginTool = (name, server, tool) => `mcp__plugin_${name}_${server}__${tool}`;
// The reviewer may read files and look; it may not change the project, write files or run commands.
const REVIEWER_PLUGIN_TOOLS = ['ae_check_comp', 'ae_render_frame', 'ae_comp_info', 'ae_layer_info', 'ae_context', 'ae_library'];
const REVIEWER_BUILT_INS = new Set(['Read', 'Glob', 'Grep', 'ToolSearch']);

function frontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(m, 'the agent file starts with a frontmatter block');
  const fields = {};
  for (const line of m[1].split('\n')) {
    if (/^\s*(#|$)/.test(line)) continue;
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    assert.ok(kv, `frontmatter line is key: value: ${line}`);
    fields[kv[1]] = kv[2];
  }
  return { fields, head: m[1], body: m[2] };
}

async function serverToolNames(outDir) {
  const { mcpServers } = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const server = mcpServers['comp-room'];
  const sub = (v) => v.replaceAll('${CLAUDE_PLUGIN_ROOT}', outDir);
  const input = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
  ].map((m) => JSON.stringify(m)).join('\n') + '\n';
  const env = { ...process.env, ...(server.env ?? {}) };
  delete env.AE_MCP_READONLY;
  const r = spawnSync(sub(server.command), server.args.map(sub), { cwd: os.tmpdir(), env, input, encoding: 'utf8', timeout: 20_000 });
  const reply = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l)).find((m) => m.id === 2);
  assert.ok(reply, `no tools/list reply: ${r.stderr}`);
  return reply.result.tools.map((t) => t.name);
}

test('the reviewer agent ships in agents/, copied from claude/src', async () => {
  const { outDir, files } = await sharedBuild();
  assert.ok(files.includes('agents/motion-reviewer.md'), files.filter((f) => f.startsWith('agents')).join(', '));
  const built = await fs.readFile(path.join(outDir, 'agents/motion-reviewer.md'));
  assert.ok(built.equals(await fs.readFile(path.join(ROOT, 'claude/src/agents/motion-reviewer.md'))));
});

test('the reviewer agent can look but not change anything', async () => {
  const { outDir } = await sharedBuild();
  const text = await fs.readFile(path.join(outDir, 'agents/motion-reviewer.md'), 'utf8');
  const { fields, head, body } = frontMatter(text);
  assert.equal(fields.name, 'motion-reviewer');
  assert.ok(fields.description.length > 40, 'a description Claude can choose the agent by');
  assert.equal(fields.permissionMode, undefined, 'plugin agents ignore permissionMode; tools is the limit');
  assert.match(head, /observed/i, 'the frontmatter says the MCP tool names are observed, not documented');
  const tools = fields.tools.split(',').map((t) => t.trim()).filter(Boolean);
  const { name } = JSON.parse(await fs.readFile(path.join(outDir, '.claude-plugin/plugin.json'), 'utf8'));
  const { mcpServers } = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const [server] = Object.keys(mcpServers);
  const mcp = tools.filter((t) => t.startsWith('mcp__'));
  assert.deepEqual(mcp.sort(), REVIEWER_PLUGIN_TOOLS.map((t) => pluginTool(name, server, t)).sort());
  for (const t of tools.filter((x) => !x.startsWith('mcp__'))) assert.ok(REVIEWER_BUILT_INS.has(t), `${t} is not a read-only built-in`);
  for (const banned of ['ae_do', 'ae_project_import_json', 'ae_project_export_json', 'ae_save_project', 'Write', 'Edit', 'Bash', 'Agent', 'NotebookEdit']) {
    assert.ok(!tools.some((t) => t === banned || t.endsWith(`__${banned}`)), `${banned} must not be granted`);
  }
  // Its brief: read the review procedure through ae_library and return the ranked list.
  assert.match(body, /ae_library/);
  assert.match(body, /`review`/);
  assert.match(body, /first-watch/);
});

test('every plugin tool the reviewer agent names is one the packaged server serves', async () => {
  const { outDir } = await sharedBuild();
  const { fields } = frontMatter(await fs.readFile(path.join(outDir, 'agents/motion-reviewer.md'), 'utf8'));
  const { name } = JSON.parse(await fs.readFile(path.join(outDir, '.claude-plugin/plugin.json'), 'utf8'));
  const { mcpServers } = JSON.parse(await fs.readFile(path.join(outDir, '.mcp.json'), 'utf8'));
  const [server] = Object.keys(mcpServers);
  const served = new Set((await serverToolNames(outDir)).map((t) => pluginTool(name, server, t)));
  assert.ok(served.size >= 10, `the server listed ${served.size} tools`);
  const named = fields.tools.split(',').map((t) => t.trim()).filter((t) => t.startsWith('mcp__'));
  assert.deepEqual(named.filter((t) => !served.has(t)), []);
});
