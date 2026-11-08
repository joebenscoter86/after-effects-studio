// Readable runtime for the Claude package (claude-release-plan.md, CL-2).
// The server's own TypeScript is transpiled file by file into dist/, and the exact dependency
// files the server imports are copied unchanged into node_modules/. Nothing installs at startup,
// and every file stays under the directory's 256 KiB limit.
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const LICENSE_NAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT', 'license', 'license.md'];
// Match Node's own resolution: the "module" condition is webpack-only and Node never uses it.
const ESBUILD_SHARED = { platform: 'node', format: 'esm', target: 'node24', conditions: ['node'] };

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

export async function buildReadableRuntime(pluginRuntimeDir, outRuntimeDir) {
  const nodeModules = path.join(pluginRuntimeDir, 'node_modules');
  if (!existsSync(path.join(nodeModules, 'esbuild')) || !existsSync(path.join(nodeModules, '@modelcontextprotocol'))) {
    throw new Error(`runtime dependencies are not installed in ${pluginRuntimeDir}; run npm ci --ignore-scripts there first`);
  }
  const { build } = await import(pathToFileURL(path.join(nodeModules, 'esbuild', 'lib', 'main.js')).href);
  const src = path.join(pluginRuntimeDir, 'src');

  // Own code: one readable output file per source file, dist/index.js one level below package.json.
  const sources = await listTs(src);
  await build({
    ...ESBUILD_SHARED,
    absWorkingDir: pluginRuntimeDir,
    entryPoints: sources.map((rel) => path.join('src', rel)),
    outbase: 'src',
    outdir: path.join(outRuntimeDir, 'dist'),
    bundle: false,
    logLevel: 'silent',
  });
  const appFiles = sources.map((rel) => path.join('dist', rel.replace(/\.ts$/, '.js')));

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
  for (const root of roots) {
    const license = LICENSE_NAMES.find((n) => existsSync(path.join(root, n)));
    if (!license) throw new Error(`missing license file for vendored package at ${root}`);
    vendor.add(path.join(root, license));
  }

  const vendorFiles = [];
  for (const file of [...vendor].sort()) {
    const rel = path.relative(pluginRuntimeDir, file);
    await copyFile(file, path.join(outRuntimeDir, rel));
    vendorFiles.push(rel);
  }
  const packages = [...roots].map((r) => path.relative(nodeModules, r)).sort();
  return { appFiles, vendorFiles, packages };
}
