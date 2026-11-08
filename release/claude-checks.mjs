// Directory rules for a Claude plugin package (claude-release-plan.md, CL-1).
// checkPackage(dir) returns human-readable violations; an empty array means clean.
import fs from 'node:fs/promises';
import path from 'node:path';

export const MAX_FILES = 512;
export const MAX_BYTES = 262_144; // 256 KiB
const SIZE_EXEMPT = /\.(png|svg|jpe?g|gif|webp|ttf|otf|woff2?)$/i;
const BINARY = /\.(png|jpe?g|gif|webp|ttf|otf|woff2?)$/i;
const LOCKFILES = new Set(['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock']);
// Same pattern as release/build-package.py.
const PRIVATE = /\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\/|-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/;
const HOST_TEXT = /codex|gpt-/i;
const LFS = 'version https://git-lfs.github.com/spec/v1';

async function walk(root, rel = '', out = []) {
  for (const entry of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) out.push({ rel: child, kind: 'symlink' });
    else if (entry.isDirectory()) { out.push({ rel: child, kind: 'dir' }); await walk(root, child, out); }
    else out.push({ rel: child, kind: 'file' });
  }
  return out;
}

function proseWords(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
}

export async function checkPackage(dir) {
  const entries = await walk(dir);
  const files = entries.filter((e) => e.kind === 'file');
  const has = (rel) => files.some((f) => f.rel === rel);
  const v = [];

  if (!has('.claude-plugin/plugin.json')) v.push('missing manifest: .claude-plugin/plugin.json');
  if (!has('README.md')) v.push('missing README.md');
  else {
    const words = proseWords(await fs.readFile(path.join(dir, 'README.md'), 'utf8'));
    if (words < 40) v.push(`README.md has ${words} words; the directory needs at least 40`);
  }
  if (!['LICENSE', 'LICENSE.md', 'LICENSE.txt'].some(has)) v.push('missing LICENSE file at the package root');
  if (entries.some((e) => e.kind === 'dir' && e.rel === 'bin')) v.push('top-level bin/ makes claude.ai and Cowork refuse the plugin');
  if (has('package.json')) v.push('root package.json is not allowed');
  if (files.length > MAX_FILES) v.push(`${files.length} files: more than ${MAX_FILES} is held for review`);

  for (const e of entries) {
    const base = path.posix.basename(e.rel);
    if (e.kind === 'symlink') { v.push(`symlink not allowed: ${e.rel}`); continue; }
    if (base === '.git' || base === '.gitmodules') { v.push(`submodule or git metadata not allowed: ${e.rel}`); continue; }
    if (e.kind !== 'file') continue;
    if (base === '.DS_Store') { v.push(`.DS_Store not allowed: ${e.rel}`); continue; }
    if (LOCKFILES.has(base)) v.push(`lockfile not allowed: ${e.rel}`);
    const full = path.join(dir, e.rel);
    const { size } = await fs.stat(full);
    if (size > MAX_BYTES && !SIZE_EXEMPT.test(base)) v.push(`over 256 KiB (262,144 bytes): ${e.rel} is ${size} bytes`);
    if (BINARY.test(base)) continue;
    const text = await fs.readFile(full, 'latin1');
    if (text.startsWith(LFS)) v.push(`Git LFS pointer not allowed: ${e.rel}`);
    if (HOST_TEXT.test(text)) v.push(`Codex/GPT- host text in a Claude file: ${e.rel}`);
    if (PRIVATE.test(text)) v.push(`private path or credential pattern: ${e.rel}`);
  }
  return v;
}
