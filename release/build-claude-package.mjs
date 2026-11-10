#!/usr/bin/env node
// Generate the Claude plugin package from canonical plugin/ plus the Claude-only files in claude/src/.
// Never edit the output by hand (claude-release-plan.md, CL-1).
//
//   node release/build-claude-package.mjs [--out <dir>]          write the package (default claude/<name>/);
//                                                                exit 1 if it breaks a directory rule
//   node release/build-claude-package.mjs --check [--out <dir>]  rebuild in a temp dir; exit 1 on drift
//   --src <dir> replaces claude/src (used by tests)
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPackage } from './claude-checks.mjs';
import { buildReadableRuntime } from './claude-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugin');
const CLAUDE_SRC = path.join(ROOT, 'claude', 'src');

// Mirrors release/build-package.py. README.md is replaced by claude/src/README.md once that exists.
const FILES = [
  'README.md', 'PROVENANCE.md', 'THIRD-PARTY-NOTICES.txt', 'license.md', 'runtime/LICENSE',
  'scripts/doctor.mjs', 'scripts/doctor-core.mjs', 'scripts/verify-export.mjs',
];
const TREES = ['assets', 'docs', 'examples', 'library', 'skills', 'runtime/jsx'];
const JUNK = new Set(['.DS_Store']);
// Codex listing art the Claude package never uses. The directory holds any bundled image the README does not show.
const CLAUDE_SKIP = new Set(['assets/cold-start-inbox-sheet.png', 'assets/native-demo-sheet.png']);

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function listTree(root, rel = '') {
  const out = [];
  for (const entry of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    if (JUNK.has(entry.name)) continue;
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listTree(root, child)));
    else out.push(child);
  }
  return out;
}

async function copy(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

function assertSafeOutDir(outDir, claudeSrc) {
  const resolved = path.resolve(outDir);
  for (const guarded of [ROOT, PLUGIN, CLAUDE_SRC, claudeSrc, os.homedir(), path.parse(resolved).root]) {
    const rel = path.relative(resolved, guarded);
    if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
      throw new Error(`refusing to clear ${resolved}: it contains or equals ${guarded}`);
    }
  }
  return resolved;
}

export async function buildClaudePackage({ outDir, runtime = buildReadableRuntime, claudeSrc = CLAUDE_SRC } = {}) {
  const manifest = JSON.parse(await fs.readFile(path.join(claudeSrc, 'plugin.json'), 'utf8'));
  const out = assertSafeOutDir(outDir ?? path.join(ROOT, 'claude', manifest.name), path.resolve(claudeSrc));

  // Clear only an empty folder or a previous build, never someone's other files.
  if (await exists(out)) {
    const entries = await fs.readdir(out);
    if (entries.length && !(await exists(path.join(out, '.claude-plugin', 'plugin.json')))) {
      throw new Error(`refusing to clear ${out}: it is not empty and holds no previous plugin build`);
    }
  }
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });

  for (const rel of FILES) await copy(path.join(PLUGIN, rel), path.join(out, rel));
  for (const tree of TREES) {
    for (const rel of await listTree(path.join(PLUGIN, tree))) {
      if (CLAUDE_SKIP.has(`${tree}/${rel}`)) continue;
      await copy(path.join(PLUGIN, tree, rel), path.join(out, tree, rel));
    }
  }

  await runtime(path.join(PLUGIN, 'runtime'), path.join(out, 'runtime'));
  const { version } = JSON.parse(await fs.readFile(path.join(PLUGIN, 'runtime', 'package.json'), 'utf8'));
  await fs.writeFile(path.join(out, 'runtime', 'package.json'),
    `${JSON.stringify({ name: `${manifest.name}-runtime`, version, private: true, type: 'module', serverName: manifest.name })}\n`);

  await copy(path.join(claudeSrc, 'plugin.json'), path.join(out, '.claude-plugin', 'plugin.json'));
  await copy(path.join(claudeSrc, 'mcp.json'), path.join(out, '.mcp.json'));
  await copy(path.join(claudeSrc, 'start.mjs'), path.join(out, 'start.mjs'));
  await copy(path.join(PLUGIN, 'license.md'), path.join(out, 'LICENSE'));
  if (await exists(path.join(claudeSrc, 'README.md'))) {
    await copy(path.join(claudeSrc, 'README.md'), path.join(out, 'README.md'));
  }
  if (await exists(path.join(claudeSrc, 'docs'))) {
    for (const rel of await listTree(path.join(claudeSrc, 'docs'))) {
      await copy(path.join(claudeSrc, 'docs', rel), path.join(out, 'docs', rel));
    }
  }

  const files = (await listTree(out)).sort();
  return { outDir: out, files, violations: await checkPackage(out) };
}

async function diffTrees(expectedDir, actualDir) {
  const expected = new Set(await listTreeAll(expectedDir));
  const actual = new Set(await exists(actualDir) ? await listTreeAll(actualDir) : []);
  const changes = [];
  for (const rel of [...expected].sort()) {
    if (!actual.has(rel)) changes.push(`missing: ${rel}`);
    else if (!(await fs.readFile(path.join(expectedDir, rel))).equals(await fs.readFile(path.join(actualDir, rel)))) {
      changes.push(`changed: ${rel}`);
    }
  }
  for (const rel of [...actual].sort()) if (!expected.has(rel)) changes.push(`extra: ${rel}`);
  return changes;
}

// Like listTree, but keeps junk files so --check reports them.
async function listTreeAll(root, rel = '') {
  const out = [];
  for (const entry of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await listTreeAll(root, child)));
    else out.push(child);
  }
  return out;
}

async function main(argv) {
  const check = argv.includes('--check');
  const i = argv.indexOf('--out');
  const j = argv.indexOf('--src');
  const claudeSrc = path.resolve(j >= 0 ? argv[j + 1] : CLAUDE_SRC);
  const manifest = JSON.parse(await fs.readFile(path.join(claudeSrc, 'plugin.json'), 'utf8'));
  const target = path.resolve(i >= 0 ? argv[i + 1] : path.join(ROOT, 'claude', manifest.name));

  if (check) {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-check-'));
    try {
      const { outDir } = await buildClaudePackage({ outDir: path.join(scratch, manifest.name), claudeSrc });
      const changes = await diffTrees(outDir, target);
      if (changes.length) {
        console.log(`${path.relative(ROOT, target) || target} is stale; rebuild with node release/build-claude-package.mjs`);
        for (const line of changes) console.log(`  ${line}`);
        return 1;
      }
      console.log(`${path.relative(ROOT, target) || target} is up to date`);
      return 0;
    } finally {
      await fs.rm(scratch, { recursive: true, force: true });
    }
  }

  const { outDir, files, violations } = await buildClaudePackage({ outDir: target, claudeSrc });
  console.log(`wrote ${files.length} files to ${path.relative(ROOT, outDir) || outDir}`);
  for (const line of violations) console.log(`violation: ${line}`);
  return violations.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (err) => {
    console.error(err.message);
    process.exitCode = 2;
  });
}
