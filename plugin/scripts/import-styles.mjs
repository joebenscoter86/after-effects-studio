#!/usr/bin/env node
// Import proven styles from the Content style library into plugin/library/styles/ (claude-release-plan.md, CL-9).
// A one-way, dev-time copy with provenance: the plugin never reads Content at runtime.
//
//   node plugin/scripts/import-styles.mjs --from <Content>/production/styles
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FONT_BINARY = /\.(ttf|otf|woff2?)$/i;
const NO_SCAN = /\.(png|jpe?g|gif|webp|ttf|otf|woff2?)$/i;
const PRIVATE_HOME = /\/Users\/[A-Za-z0-9._-]+\/|\/home\/[A-Za-z0-9._-]+\//;
const CONTENT_REF = /~\/Assets|production\/|harness|prove\.mjs|go\.sh|Higgsfield|joeb/i;
const LEMO_LICENSE = 'assets/LICENSE-lemo-opuscar.txt';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function listFiles(root, rel = '') {
  const out = [];
  for (const e of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(root, child)));
    else if (e.isFile()) out.push(child);
  }
  return out.sort();
}

async function readPackages(stylesRoot) {
  const packages = [];
  for (const e of await fs.readdir(stylesRoot, { withFileTypes: true })) {
    const file = path.join(stylesRoot, e.name, 'style.json');
    if (e.isDirectory() && await exists(file)) packages.push(JSON.parse(await fs.readFile(file, 'utf8')));
  }
  return packages.sort((a, b) => a.id.localeCompare(b.id));
}

function exclusionReason(style) {
  if (style.id === 'joeb-house') return "house look: needs Joe's rig and reel helpers";
  if (style.study === true) return 'study package (blocked)';
  if (style.status !== 'proven') return `status ${style.status}: ${style.statusNote || 'no note'}`;
  const generated = style.generated;
  if (generated && (Array.isArray(generated) ? generated.length : Object.keys(generated).length)) return 'needs generated pieces';
  return null;
}

export async function selectStyles(stylesRoot) {
  return (await readPackages(stylesRoot)).filter((s) => exclusionReason(s) === null);
}

// Which files of a style package ship: everything except proofs, the package manifest (index.json
// carries its metadata), font binaries, the per-style upstream license copy, and font licenses
// whose font is not shipped.
function shippedFiles(files, style) {
  const kept = files.filter((rel) => !rel.startsWith('proof/') && rel !== 'style.json' && rel !== LEMO_LICENSE
    && !FONT_BINARY.test(rel) && !/(^|\/)OFL-[^/]*\.txt$/.test(rel));
  const stems = new Set(kept.map((rel) => `${path.posix.dirname(rel)}/${path.posix.basename(rel).replace(/\.[^.]*$/, '').toLowerCase()}`));
  for (const rel of files) {
    const m = rel.match(/^(.*\/)?OFL-([^/]*)\.txt$/);
    if (m && stems.has(`${(m[1] ?? './').replace(/\/$/, '') || '.'}/${m[2].toLowerCase()}`)) kept.push(rel);
  }
  if (!kept.includes('STYLE.md') || !kept.includes(style.module)) throw new Error(`${style.id}: STYLE.md or ${style.module} missing`);
  return kept.sort();
}

function firstSentence(text) {
  const m = text.match(/^.*?\.(?=\s|$)/);
  return m ? m[0] : text;
}

function skillMarkdown(entries) {
  const titles = entries.map((s) => s.title);
  const list = titles.length > 1 ? `${titles.slice(0, -1).join(', ')} or ${titles.at(-1)}` : titles[0];
  const description = `Build After Effects motion graphics in a named visual style from the bundled style library: ${list}. `
    + 'Use when the user names one of these looks, asks which styles are available, or wants help choosing a style; ordinary motion work without a named look does not need it.';
  const rows = entries.map((s) => `| ${s.title} | \`${s.id}\` | ${s.tier} | ${s.goodFor} | ${s.needs.length ? s.needs.join(', ') : 'none'} |`);
  return `---
name: visual-styles
description: ${description}
---

# Visual styles

${entries.length} visual styles, each with a written grammar (type, colour, motion, camera), an After Effects recipe and an ES3 module. Read through \`ae_library\`: **motion-language**, **production-workflow** and **brief-template** first (the foundation for every style), then **style-index**, then the chosen style's **style-<id>**. When building with its helpers, also read **style-lib-jsx** and **style-<id>-jsx**. If the library tool is unavailable, the same files are at \`../../library/styles/index.json\`, \`../../library/styles/<id>/STYLE.md\`, the module named in the index, and \`../../library/styles/aes-lib.jsx\`, relative to this skill's folder.

1. Choose the style with the user from the table below. If they describe a look that is not listed, name the closest style and say how it differs.
2. Write the brief in the style's grammar (STYLE.md sections 2 to 4), adapted to the user's subject. A style is a grammar, not a template.
3. Check what the style needs (the table and STYLE.md section 7). Fonts are free families named in the index: use them if installed, otherwise choose a fallback and remeasure. Footage tools need Node and often ffmpeg; the 3D styles render plates with Blender. Ask before running a tool; tools read the inputs you give them and write to a cache folder you choose.
4. Build natively with \`ae_do\` and \`eval.run\`: load \`aes-lib.jsx\`, then the style's module, and follow the AE recipe (STYLE.md section 6). The module's \`buildScene(comp, scene, opts)\` builds the library's seven-beat test scene; read it as a worked example of the technique, not as a builder for the user's scene.
5. Render frames and check them against STYLE.md before showing the user.

The styles are adaptations of Lemo-Opuscar (MIT, LemoLab), each proven in the author's own test harness before import. \`style-index\` records each style's proof status; a style not yet built through this plugin is labelled as such.

| Style | id | Tier | Good for | Needs |
|---|---|---|---|---|
${rows.join('\n')}
`;
}

export async function importStyles({ from, to, skillDir, commit }) {
  const all = await readPackages(from);
  const selected = all.filter((s) => exclusionReason(s) === null);
  const skipped = all.filter((s) => exclusionReason(s) !== null).map((s) => ({ id: s.id, reason: exclusionReason(s) }));
  let notes = {};
  if (await exists(path.join(from, 'picker', 'notes.json'))) notes = JSON.parse(await fs.readFile(path.join(from, 'picker', 'notes.json'), 'utf8'));

  // Read and check everything before writing anything.
  const staged = [];
  const adaptations = [];
  for (const style of selected) {
    const dir = path.join(from, style.id);
    for (const rel of shippedFiles(await listFiles(dir), style)) {
      const source = await fs.readFile(path.join(dir, rel));
      let data = source;
      const out = `styles/${style.id}/${rel}`;
      if (!NO_SCAN.test(rel)) {
        const text = source.toString('utf8');
        if (PRIVATE_HOME.test(text)) throw new Error(`private home path in ${style.id}/${rel}`);
        const rewritten = text.replaceAll(`production/styles/${style.id}/`, `library/styles/${style.id}/`);
        rewritten.split('\n').forEach((line, i) => {
          if (CONTENT_REF.test(line)) adaptations.push({ file: out, line: i + 1, text: line.trim() });
        });
        data = Buffer.from(rewritten, 'utf8');
      }
      staged.push({ out, data, sourcePath: `production/styles/${style.id}/${rel}`, sourceSha: sha256(source) });
    }
  }
  const lib = await fs.readFile(path.join(from, 'harness', 'lib', 'aes-lib.jsx'));
  staged.push({ out: 'styles/aes-lib.jsx', data: lib, sourcePath: 'production/styles/harness/lib/aes-lib.jsx', sourceSha: sha256(lib) });
  let licenseOwner = null;
  for (const s of selected) if (await exists(path.join(from, s.id, LEMO_LICENSE))) { licenseOwner = s.id; break; }
  if (licenseOwner) {
    const license = await fs.readFile(path.join(from, licenseOwner, LEMO_LICENSE));
    staged.push({ out: 'styles/LICENSE-lemo-opuscar.txt', data: license, sourcePath: `production/styles/${licenseOwner}/${LEMO_LICENSE}`, sourceSha: sha256(license) });
  }

  const entries = [];
  for (const style of selected) {
    const toolText = staged.filter((f) => f.out.startsWith(`styles/${style.id}/tools/`)).map((f) => f.data.toString('utf8')).join('\n');
    const needs = new Set((style.tools ?? []).flatMap((t) => t.needs ?? []));
    if (/blender/i.test(toolText)) needs.add('blender');
    entries.push({
      id: style.id, title: style.title, tier: style.tier, summary: style.summary,
      goodFor: notes[style.id]?.goodFor ?? firstSentence(style.summary),
      triggers: style.triggers, module: style.module, moduleGlobal: style.moduleGlobal,
      needs: [...needs].sort(),
      fonts: (style.fonts ?? []).map(({ family, style: face, license: lic }) => ({ family, style: face, license: lic })),
      tools: (style.tools ?? []).map((t) => t.file),
      contentStatus: style.status, contentProof: style.proof?.date ?? null,
    });
  }

  // Replace earlier imports: only folders an earlier index listed, plus this run's.
  const indexPath = path.join(to, 'styles', 'index.json');
  const previous = await exists(indexPath) ? JSON.parse(await fs.readFile(indexPath, 'utf8')).styles.map((s) => s.id) : [];
  for (const id of new Set([...previous, ...selected.map((s) => s.id)])) {
    await fs.rm(path.join(to, 'styles', id), { recursive: true, force: true });
  }
  for (const f of staged) {
    await fs.mkdir(path.dirname(path.join(to, f.out)), { recursive: true });
    await fs.writeFile(path.join(to, f.out), f.data);
  }
  await fs.writeFile(indexPath, `${JSON.stringify({ source: { repo: 'Content', path: 'production/styles', commit }, styles: entries }, null, 2)}\n`);

  const mapPath = path.join(to, 'source-map.json');
  const map = JSON.parse(await fs.readFile(mapPath, 'utf8'));
  const ours = new Set(staged.map((f) => f.sourcePath));
  const prefixes = [...previous, ...selected.map((s) => s.id)].map((id) => `production/styles/${id}/`);
  map.sources = map.sources.filter((s) => !ours.has(s.path) && !prefixes.some((p) => s.path.startsWith(p)));
  for (const f of staged) map.sources.push({ path: f.sourcePath, sha256: f.sourceSha, id: `historical-${sha256(f.sourcePath).slice(0, 12)}` });
  await fs.writeFile(mapPath, `${JSON.stringify(map, null, 2)}\n`);

  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillMarkdown(entries));

  return { imported: selected.map((s) => s.id), skipped, files: staged.map((f) => f.out).sort(), adaptations };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--from');
  if (i < 0) { console.error('usage: node plugin/scripts/import-styles.mjs --from <Content>/production/styles'); process.exit(2); }
  const from = path.resolve(process.argv[i + 1]);
  const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const git = (args) => spawnSync('git', ['-C', from, ...args], { encoding: 'utf8' }).stdout.trim();
  const commit = git(['rev-parse', '--short', 'HEAD']) + (git(['status', '--porcelain', '--', '.']) ? '-dirty' : '');
  const r = await importStyles({ from, to: path.join(pluginRoot, 'library'), skillDir: path.join(pluginRoot, 'skills', 'visual-styles'), commit });
  console.log(`imported ${r.imported.length} from Content ${commit}: ${r.imported.join(', ')}`);
  for (const s of r.skipped) console.log(`skipped ${s.id}: ${s.reason}`);
  console.log(`${r.files.length} files; ${r.adaptations.length} lines to adapt:`);
  for (const a of r.adaptations) console.log(`  ${a.file}:${a.line}: ${a.text.slice(0, 160)}`);
}
