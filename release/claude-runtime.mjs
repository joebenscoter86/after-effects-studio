// Readable runtime for the Claude package (claude-release-plan.md, CL-2).
// The server's own TypeScript is transpiled file by file, then bundled with the exact dependency files it imports into
// dist/index.js, dist/chunks/ (the own code, one or more chunks per area of the source: core, color, operations, tools,
// transport) and dist/vendor/ (the dependencies, one or more chunks per package, named after it). Every chunk is under
// the directory's 256 KiB limit and unminified, with the real export names. Each bundled package's license is written
// to licenses/<package>.txt. Nothing installs at startup and no node_modules/ ships: bundling the dependencies keeps
// the package under the directory's 512-file limit (decided 2026-11-19: 289 runtime files became 42).
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LICENSE_NAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT', 'license', 'license.md'];
// Match Node's own resolution: the "module" condition is webpack-only and Node never uses it.
const ESBUILD_SHARED = { platform: 'node', format: 'esm', target: 'node24', conditions: ['node'] };
// A chunk is filled to this much of its modules' bytes, leaving room under the 256 KiB file limit.
export const CHUNK_FILL = 240 * 1024;
const FILE_LIMIT = 262_144;
const BUILTINS = new Set(builtinModules);
const isBuiltin = (id) => id.startsWith('node:') || BUILTINS.has(id) || BUILTINS.has(id.split('/')[0]);

// Pack files into named chunks: grouped by area(file), each area's files packed in name order until the next would
// pass CHUNK_FILL. Returns Map(file -> "<area>-<n>").
function pack(sizes, area, files = Object.keys(sizes)) {
  const groups = new Map();
  for (const rel of [...files].sort()) { const a = area(rel); if (!groups.has(a)) groups.set(a, []); groups.get(a).push(rel); }
  const plan = new Map();
  for (const [name, members] of groups) {
    let bin = 1, used = 0;
    for (const rel of members) {
      if (sizes[rel] > CHUNK_FILL) throw new Error(`${rel} is ${sizes[rel]} bytes, more than one chunk holds (${CHUNK_FILL}); split the source file`);
      if (used && used + sizes[rel] > CHUNK_FILL) { bin++; used = 0; }
      used += sizes[rel];
      plan.set(rel, `${name}-${bin}`);
    }
  }
  return plan;
}

// The own modules' chunks: grouped by area (their top folder under src/, "core" for files at the top). The entry stays
// in dist/index.js, because it reads ../package.json relative to itself. Returns Map(transpiled file -> chunk name).
export function planChunks(sizes, entry) {
  return pack(sizes, (rel) => (rel.includes('/') ? rel.split('/')[0] : 'core'), Object.keys(sizes).filter((rel) => rel !== entry));
}

// The dependencies' chunks: one area per package, named after it (a scoped @scope/name becomes scope-name, since the
// Claude app refuses "@" in a path). sizes: Map-like object (file -> bytes); packageOf(file) -> flat package name.
export function planVendorChunks(sizes, packageOf) {
  return pack(sizes, packageOf);
}

export const flatName = (name) => (name.startsWith('@') ? name.slice(1).replace('/', '-') : name);

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

// Each bundled package must be the version package-lock.json pins; a stale node_modules would ship old code.
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

  // Dependencies: exactly the files a bundle of the server pulls in (the same set the Codex bundle holds), with every
  // package.json on the way up to each package root, since those set the module type and the exports map.
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
  const rootOf = new Map();
  for (const input of Object.keys(probe.metafile.inputs)) {
    if (!input.includes('node_modules/')) continue;
    const file = path.resolve(pluginRuntimeDir, input);
    const root = packageRootOf(file, nodeModules);
    vendor.add(file);
    rootOf.set(file, root);
    for (let dir = path.dirname(file); dir.length >= root.length; dir = path.dirname(dir)) {
      const manifest = path.join(dir, 'package.json');
      if (existsSync(manifest)) vendor.add(manifest);
      if (dir === root) break;
    }
  }
  const roots = [...new Set(rootOf.values())].sort();
  const stale = await checkLockedVersions(pluginRuntimeDir, roots);
  if (stale.length) throw new Error(`installed dependencies differ from package-lock.json (${stale.join('; ')}); run npm ci --ignore-scripts in ${pluginRuntimeDir}`);
  const packages = [];
  for (const root of roots) {
    const { name, version } = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    const license = LICENSE_NAMES.find((n) => existsSync(path.join(root, n)));
    if (!license) throw new Error(`missing license file for bundled package ${name} at ${root}`);
    packages.push({ root, name, version, flat: flatName(name), license: path.join(root, license) });
  }
  const flatOf = new Map(packages.map((p) => [p.root, p.flat]));
  if (new Set(flatOf.values()).size !== packages.length) throw new Error(`two bundled packages share a chunk name: ${packages.map((p) => p.name).join(', ')}`);

  // Own code is transpiled file by file into a scratch folder, and the dependency files are copied beside it under the
  // same node_modules/ layout, so the bundler names every module relative to the scratch folder, never a local path.
  const sources = await listTs(src);
  const scratch = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'claude-runtime-')));   // rolldown names modules by their real path
  const tmp = path.join(scratch, 'server');   // a fixed folder name: the entry's generated names come from it, so builds match
  let appFiles, vendorFiles;
  try {
    await build({ ...ESBUILD_SHARED, absWorkingDir: pluginRuntimeDir, entryPoints: sources.map((rel) => path.join('src', rel)), outbase: 'src', outdir: tmp, bundle: false, logLevel: 'silent' });
    for (const file of vendor) await copyFile(file, path.join(scratch, path.relative(pluginRuntimeDir, file)));

    const sizes = {};
    for (const rel of sources) { const js = rel.replace(/\.ts$/, '.js').split(path.sep).join('/'); sizes[js] = (await fs.stat(path.join(tmp, js))).size; }
    const own = planChunks(sizes, 'index.js');
    const vendorSizes = {}, vendorPackage = {};
    for (const [file, root] of rootOf) {
      const id = path.join(scratch, path.relative(pluginRuntimeDir, file));
      vendorSizes[id] = (await fs.stat(file)).size;
      vendorPackage[id] = flatOf.get(root);
    }
    const theirs = planVendorChunks(vendorSizes, (id) => vendorPackage[id]);
    const byId = new Map([...[...own].map(([rel, name]) => [path.join(tmp, rel), name]), ...theirs]);
    const ownNames = [...new Set(own.values())], vendorNames = new Set(theirs.values());
    const clash = ownNames.filter((n) => vendorNames.has(n));
    if (clash.length) throw new Error(`a bundled package's chunk has the name of an own-code chunk: ${clash.join(', ')}`);
    const names = [...ownNames, ...vendorNames];

    const { rolldown } = await import(pathToFileURL(path.join(nodeModules, 'rolldown', 'dist', 'index.mjs')).href);
    const bundle = await rolldown({ input: path.join(tmp, 'index.js'), cwd: scratch, platform: 'node', logLevel: 'silent', external: isBuiltin });
    const outDist = path.join(outRuntimeDir, 'dist');
    const written = await bundle.write({
      dir: outDist, format: 'esm', entryFileNames: 'index.js', minify: false, minifyInternalExports: false, strictExecutionOrder: true,   // modules run in source order across chunks (the source has import cycles)
      chunkFileNames: (chunk) => (vendorNames.has(chunk.name) ? 'vendor/[name].js' : 'chunks/[name].js'),
      codeSplitting: { includeDependenciesRecursively: false, groups: names.map((n, k) => ({ name: n, test: (id) => byId.get(id) === n, priority: names.length - k, minSize: 0 })) },
    });
    await bundle.close();
    const outputs = written.output.filter((o) => o.type === 'chunk').map((o) => path.join('dist', o.fileName));
    for (const rel of outputs) {
      const text = await fs.readFile(path.join(outRuntimeDir, rel), 'utf8');
      if (Buffer.byteLength(text) > FILE_LIMIT) throw new Error(`${rel} is ${Buffer.byteLength(text)} bytes, over the 256 KiB file limit; lower CHUNK_FILL`);
      if (text.includes(scratch) || text.includes(os.homedir())) throw new Error(`${rel} names a local folder; the chunks must name modules relative to the build folder`);
    }
    appFiles = outputs.filter((rel) => !rel.startsWith(path.join('dist', 'vendor') + path.sep));
    vendorFiles = outputs.filter((rel) => rel.startsWith(path.join('dist', 'vendor') + path.sep));
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }

  // Each bundled package's license, opened by name@version (the same heading as in THIRD-PARTY-NOTICES.txt).
  const licenseFiles = [];
  for (const p of packages) {
    const rel = path.join('licenses', `${p.flat}.txt`);
    await fs.mkdir(path.join(outRuntimeDir, 'licenses'), { recursive: true });
    await fs.writeFile(path.join(outRuntimeDir, rel), `${p.name}@${p.version}\n\n${await fs.readFile(p.license, 'utf8')}`);
    licenseFiles.push(rel);
  }
  return { appFiles, vendorFiles, licenseFiles, packages: packages.map((p) => p.name) };
}
