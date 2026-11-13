// Readable runtime for the Claude package (claude-release-plan.md, CL-2).
// The server's own TypeScript is transpiled file by file, then packed into dist/index.js and a handful of chunks in
// dist/chunks/, one or more per area of the source (core, color, operations, tools, transport), each under the
// directory's 256 KiB limit and unminified, with the real export names. The exact dependency files the server imports
// are copied unchanged into node_modules/. Nothing installs at startup. Packing the own code into chunks keeps the
// package under the directory's 512-file limit (75 own files became 10).
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LICENSE_NAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT', 'license', 'license.md'];
// Match Node's own resolution: the "module" condition is webpack-only and Node never uses it.
const ESBUILD_SHARED = { platform: 'node', format: 'esm', target: 'node24', conditions: ['node'] };
// A chunk is filled to this much of the source's transpiled bytes, leaving room under the 256 KiB file limit.
export const CHUNK_FILL = 240 * 1024;
const FILE_LIMIT = 262_144;

// The own modules' chunks: grouped by area (their top folder under src/, "core" for files at the top), each area's
// files packed in name order until the next would pass CHUNK_FILL. The entry stays in dist/index.js, because it reads
// ../package.json relative to itself. Returns Map(transpiled file -> chunk name).
export function planChunks(sizes, entry) {
  const area = (rel) => (rel.includes('/') ? rel.split('/')[0] : 'core');
  const groups = new Map();
  for (const rel of Object.keys(sizes).sort()) { if (rel === entry) continue; if (!groups.has(area(rel))) groups.set(area(rel), []); groups.get(area(rel)).push(rel); }
  const plan = new Map();
  for (const [name, files] of groups) {
    let bin = 1, used = 0;
    for (const rel of files) {
      if (sizes[rel] > CHUNK_FILL) throw new Error(`${rel} is ${sizes[rel]} bytes transpiled, more than one chunk holds (${CHUNK_FILL}); split the source file`);
      if (used && used + sizes[rel] > CHUNK_FILL) { bin++; used = 0; }
      used += sizes[rel];
      plan.set(rel, `${name}-${bin}`);
    }
  }
  return plan;
}

async function listTs(root, rel = '') {
  const out = [];
  for (const entry of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...(await listTs(root, child)));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) out.push(child);
  }
  return out;
}

async function copyFile(from, to) {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

// The package root that owns a file: the nearest ancestor below node_modules whose package.json has a name.
function packageRootOf(file, nodeModules) {
  let dir = path.dirname(file);
  while (dir.startsWith(nodeModules + path.sep)) {
    const manifest = path.join(dir, 'package.json');
    if (existsSync(manifest)) {
      try { if (JSON.parse(readFileSync(manifest, 'utf8')).name) return dir; } catch { /* keep walking */ }
    }
    dir = path.dirname(dir);
  }
  throw new Error(`no package root for ${file}`);
}

// Each vendored package must be the version package-lock.json pins; a stale node_modules would ship old code.
export async function checkLockedVersions(pluginRuntimeDir, packageRoots) {
  const lock = JSON.parse(await fs.readFile(path.join(pluginRuntimeDir, 'package-lock.json'), 'utf8'));
  const problems = [];
  for (const root of packageRoots) {
    const rel = path.relative(pluginRuntimeDir, root).split(path.sep).join('/');
    const { name, version } = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    const locked = lock.packages?.[rel]?.version;
    if (locked !== version) problems.push(`${name} ${version} is installed but the lockfile has ${locked ?? 'no entry'}`);
  }
  return problems;
}

export async function buildReadableRuntime(pluginRuntimeDir, outRuntimeDir) {
  const nodeModules = path.join(pluginRuntimeDir, 'node_modules');
  if (!existsSync(path.join(nodeModules, 'esbuild')) || !existsSync(path.join(nodeModules, 'rolldown')) || !existsSync(path.join(nodeModules, '@modelcontextprotocol'))) {
    throw new Error(`runtime dependencies are not installed in ${pluginRuntimeDir}; run npm ci --ignore-scripts there first`);
  }
  const { build } = await import(pathToFileURL(path.join(nodeModules, 'esbuild', 'lib', 'main.js')).href);
  const src = path.join(pluginRuntimeDir, 'src');

  // Own code: transpiled file by file into a temporary folder, then packed into dist/index.js (one level below
  // package.json) and dist/chunks/<area>-<n>.js. Module markers in the chunks name each file relative to src/.
  const sources = await listTs(src);
  const scratch = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'claude-runtime-')));   // rolldown names modules by their real path
  const tmp = path.join(scratch, 'server');   // a fixed folder name: the entry's generated names come from it, so builds match
  let appFiles;
  try {
    await build({ ...ESBUILD_SHARED, absWorkingDir: pluginRuntimeDir, entryPoints: sources.map((rel) => path.join('src', rel)), outbase: 'src', outdir: tmp, bundle: false, logLevel: 'silent' });
    const sizes = {};
    for (const rel of sources) { const js = rel.replace(/\.ts$/, '.js').split(path.sep).join('/'); sizes[js] = (await fs.stat(path.join(tmp, js))).size; }
    const plan = planChunks(sizes, 'index.js');
    const byId = new Map([...plan].map(([rel, name]) => [path.join(tmp, rel), name]));
    const names = [...new Set(plan.values())];
    const { rolldown } = await import(pathToFileURL(path.join(nodeModules, 'rolldown', 'dist', 'index.mjs')).href);
    const bundle = await rolldown({ input: path.join(tmp, 'index.js'), cwd: tmp, platform: 'node', logLevel: 'silent', external: (id) => !id.startsWith('.') && !path.isAbsolute(id) });
    const outDist = path.join(outRuntimeDir, 'dist');
    const written = await bundle.write({
      dir: outDist, format: 'esm', entryFileNames: 'index.js', chunkFileNames: 'chunks/[name].js', minify: false, minifyInternalExports: false, strictExecutionOrder: true,   // modules run in source order across chunks (the source has import cycles)
      codeSplitting: { includeDependenciesRecursively: false, groups: names.map((n, k) => ({ name: n, test: (id) => byId.get(id) === n, priority: names.length - k, minSize: 0 })) },
    });
    await bundle.close();
    appFiles = written.output.filter((o) => o.type === 'chunk').map((o) => path.join('dist', o.fileName));
    for (const rel of appFiles) {
      const text = await fs.readFile(path.join(outRuntimeDir, rel), 'utf8');
      if (Buffer.byteLength(text) > FILE_LIMIT) throw new Error(`${rel} is ${Buffer.byteLength(text)} bytes, over the 256 KiB file limit; lower CHUNK_FILL`);
      if (text.includes(scratch) || text.includes(os.homedir())) throw new Error(`${rel} names a local folder; the chunks must name modules relative to src/`);
    }
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }

  // Dependencies: exactly the files a bundle of the server would pull in, copied unchanged.
  const probe = await build({
    ...ESBUILD_SHARED,
    absWorkingDir: pluginRuntimeDir,
    entryPoints: ['src/index.ts'],
    bundle: true,
    write: false,
    metafile: true,
    outfile: 'probe.js',
    logLevel: 'silent',
  });
  const vendor = new Set();
  const roots = new Set();
  for (const input of Object.keys(probe.metafile.inputs)) {
    if (!input.includes('node_modules/')) continue;
    const file = path.resolve(pluginRuntimeDir, input);
    vendor.add(file);
    const root = packageRootOf(file, nodeModules);
    roots.add(root);
    // Nested package.json files set the module type for their subtree; keep every one on the way up.
    for (let dir = path.dirname(file); dir.length >= root.length; dir = path.dirname(dir)) {
      const manifest = path.join(dir, 'package.json');
      if (existsSync(manifest)) vendor.add(manifest);
      if (dir === root) break;
    }
  }
  const stale = await checkLockedVersions(pluginRuntimeDir, [...roots]);
  if (stale.length) throw new Error(`installed dependencies differ from package-lock.json (${stale.join('; ')}); run npm ci --ignore-scripts in ${pluginRuntimeDir}`);
  for (const root of roots) {
    const license = LICENSE_NAMES.find((n) => existsSync(path.join(root, n)));
    if (!license) throw new Error(`missing license file for vendored package at ${root}`);
    vendor.add(path.join(root, license));
  }

  // The Claude app refuses an uploaded plugin with "@" in a path, so a scoped package (@scope/name) is vendored as
  // scope-name and the server's own imports are rewritten to match. Node resolves a bare name by its folder, not by
  // the name field in its package.json, so the copied files stay unchanged.
  const renames = new Map();
  for (const root of roots) {
    const name = path.relative(nodeModules, root).split(path.sep).join('/');
    if (!name.startsWith('@')) continue;
    const flat = name.slice(1).replace('/', '-');
    if ([...roots].some((r) => path.relative(nodeModules, r) === flat)) throw new Error(`cannot vendor ${name} as ${flat}: that package is also vendored`);
    renames.set(name, flat);
  }
  const outRel = (rel) => {
    const parts = rel.split(path.sep);
    const i = parts.indexOf('node_modules');
    if (i >= 0 && parts[i + 1]?.startsWith('@') && renames.has(`${parts[i + 1]}/${parts[i + 2]}`)) parts.splice(i + 1, 2, renames.get(`${parts[i + 1]}/${parts[i + 2]}`));
    return parts.join(path.sep);
  };

  const vendorFiles = [];
  for (const file of [...vendor].sort()) {
    const rel = outRel(path.relative(pluginRuntimeDir, file));
    await copyFile(file, path.join(outRuntimeDir, rel));
    vendorFiles.push(rel);
  }
  // Real import and export statements only (line-anchored), so example code in a JSDoc comment is left alone.
  const SPECIFIER = /^(\s*(?:import|export)\b[^\n]*?\bfrom\s*["']|\s*import\s*\(\s*["'])(@[^"'/]+\/[^"'/]+)(\/[^"']*)?(["'])/gm;
  for (const rel of [...appFiles, ...vendorFiles.filter((f) => f.endsWith('.js'))]) {
    const file = path.join(outRuntimeDir, rel), text = await fs.readFile(file, 'utf8');
    const next = text.replace(SPECIFIER, (all, head, name, sub, tail) => {
      if (!renames.has(name)) throw new Error(`${rel} imports ${name}, which is not vendored`);
      return `${head}${renames.get(name)}${sub || ''}${tail}`;
    });
    if (next !== text) {
      if (vendorFiles.includes(rel)) throw new Error(`${rel} is a vendored file that imports a scoped package; it would have to be changed`);
      await fs.writeFile(file, next);
    }
  }
  const packages = [...roots].map((r) => path.relative(nodeModules, r).split(path.sep).join('/')).map((n) => renames.get(n) ?? n).sort();
  return { appFiles, vendorFiles, packages };
}
