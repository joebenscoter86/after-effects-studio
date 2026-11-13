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
export const CONTENT_REF = /~\/Assets|production\/|harness|prove\.mjs|\bprov(e|es|ing)\b|go\.sh|Higgsfield|\bJoe\b|joeb|Runpod|assets\/LICENSE-lemo-opuscar/i;
const FONT_SOURCE = 'free (OFL) from Google Fonts, not included';
const LEMO_LICENSE = 'assets/LICENSE-lemo-opuscar.txt';
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const LEMO = 'https://github.com/lemomo-ai/lemo-opuscar/tree/main';

// Rewrites that make imported text true for a plugin user. Re-running the importer reapplies them,
// so the imported copies are never edited by hand.
const RULES = [
  [/^The proof is the shared test scene, built by `buildScene` and proven with `node production\/styles\/harness\/prove\.mjs ([a-z0-9-]+)`.*$/gm,
    (_, id) => `Before import, the shared test scene was built by \`buildScene\` from a blank project and rendered in the author's proof setup, then compared with Lemo-Opuscar's ${id} reference. In this plugin, render frames of your own build and check them against this file.`],
  [/\(production\/styles\/scene\)/g, () => "(the library's seven-beat test scene)"],
  [/(cloned at )?`~\/Assets\/lemo-opuscar/g, (_, cloned) => `${cloned ? 'at ' : ''}\`${LEMO}`],
  [/Cache: `~\/Assets\/joeb\/styles\/[a-z0-9-]+\/` \(([^)]*)\), per scene for reel renders\./g, (_, what) => `Cache: the folder you pass as \`--cache\` (${what}).`],
  [/before proving \(/g, () => 'before building ('],
  [/because prove\.mjs runs prepare while it holds the After Effects lock\./g, () => 'so After Effects is not left waiting on it.'],
  [/(?:, because |: | \()prove runs prepare while it holds the After Effects lock\)?\./g, () => ', so After Effects is not left waiting on it.'],
  [/before proving/gi, (m) => (m.startsWith('BEFORE') ? 'BEFORE building' : 'before building')],
  [/found while proving it/g, () => 'found while building it'],
  [/ \(Joe's QA\)/g, () => ' (found in review)'],
  [/ \(Joe's favourite\)/g, () => ''],
  [/assets\/LICENSE-lemo-opuscar\.txt/g, () => 'library/styles/LICENSE-lemo-opuscar.txt'],
  // Fonts are not shipped: say where they come from instead of pointing at files that are not there.
  [/\((all )?OFL, bundled in `assets\/fonts\/`([;)])/g, (_, all, end) => `(${all ? 'all ' : ''}${FONT_SOURCE}${end}`],
  [/\(`assets\/fonts\/(?!EMSTech)[^`]*`, (all )?OFL([;)])/g, (_, all, end) => `(${all ? 'all ' : ''}${FONT_SOURCE}${end}`],
  [/Fonts? \(OFL, (?:bundled in )?`assets\/fonts\/`\)/g, (m) => `${m.startsWith('Fonts') ? 'Fonts' : 'Font'} (${FONT_SOURCE})`],
  [/\(OFL\), bundled in `assets\/fonts\/`/g, () => `(${FONT_SOURCE})`],
];

// Fonts are not shipped. A tool that needs one looks for FONT_PATH, then the user's and the system's font folders.
const FIND_FONT = "import os from 'node:os';\n// Fonts are not shipped: use FONT_PATH or an installed copy; with none, Blender falls back to its built-in font.\n"
  + "const findFont = (name) => [process.env.FONT_PATH, path.join(os.homedir(), 'Library', 'Fonts', name), path.join('/Library/Fonts', name)].find((p) => p && fs.existsSync(p)) || null;\n";

// Exact, per-file replacements for Content-specific notes. A missing original means upstream changed: fail loudly.
const EDITS = {
  'blueprint/STYLE.md': [[
    '- A build that throws leaves its untitled project open in AE, and the next proof (anyone\'s) then stops on "untitled and has unsaved changes". The harness now discards an untitled project whose only comps are named PROOF, and closes the project it started when a build throws.',
    '- A build that throws can leave its untitled project open in AE. Inspect it before the next build, and never discard unsaved work you did not create.']],
  'paper-lantern/STYLE.md': [[
    /^- The bridge can drop mid-build \(network\) and `prove\.mjs` then reports an empty response.*\n/m, '']],
  'whiteboard/STYLE.md': [[
    '- The scene folder is not visible from AE (the harness strips it), so the frame comes in through a prepare tool (`tools/print.mjs`) like every other input.',
    '- After Effects may not see the scene folder, so the frame comes in through a prepare tool (`tools/print.mjs`) like every other input.']],
  'glass-product/tools/glass_scene.py': [[
    '    clip = os.path.expanduser(OPT.get("clip", "~/Assets/joeb/styles/scene/clip.mp4"))',
    '    if "clip" not in OPT:\n        sys.exit("glass_scene.py: the input shot needs clip=<path to your footage>")\n    clip = os.path.expanduser(OPT["clip"])']],
  'silkscreen-poster/STYLE.md': [['- Shared scene: `production/styles/scene/`.', "- Shared scene: the library's seven-beat test scene (not shipped)."]],
  'lowpoly-island/STYLE.md': [
    ['- The proof harness passes the scene to After Effects without its folder, so `words.json` cannot be read there: the line beat\'s word times travel in `track.json` from `island.py`, which reads them anyway to light a window per word.',
      '- After Effects may not see the scene folder, so the line beat\'s word times travel in `track.json` from `island.py`, which reads them anyway to light a window per word.'],
    ['Blender reads the bundled Fredoka file for the 3D digits.', 'For the 3D digits Blender uses an installed Fredoka (or the file in `FONT_PATH`), else its built-in font.']],
  'backrooms/STYLE.md': [
    ['- `prove.mjs` checks every tool named in `needs` on the PATH, and Blender is not on it (it is called by its app path): `needs` lists node and ffmpeg only, and `plates.mjs` finds Blender itself (or `BLENDER`).',
      '- Blender is called by its app path, not the PATH: `plates.mjs` finds it at `/Applications/Blender.app` or through `BLENDER`.'],
    ['(Blender reads the bundled Barlow file for the notice)', '(for the notice Blender uses an installed Barlow Semi Condensed, or the file in `FONT_PATH`, else its built-in font)']],
  'glass-product/STYLE.md': [
    ['Frames are cached under `~/Assets/joeb/styles/glass-product/frames/<shot>/`;', 'Frames are cached under `<cache>/frames/<shot>/`;'],
    ['- No Higgsfield pieces: every object is modelled and rendered in Blender.', '- No generated pieces: every object is modelled and rendered in Blender.'],
    [" No Runpod or paid GPU without Joe's go on the price.", '']],
  'crt-terminal/crt.jsx': [['install assets/fonts/VT323-Regular.ttf (OFL)', 'install the free VT323 font (OFL, Google Fonts)']],
  'crt-terminal/tools/glyphs.mjs': [['(bundled: assets/fonts/VT323-Regular.ttf)', '(VT323, free from Google Fonts)']],
  'lowpoly-island/tools/plate.mjs': [
    ["const font = path.join(HERE, '..', 'assets', 'fonts', 'Fredoka[wdth,wght].ttf');", FIND_FONT + "const font = findFont('Fredoka[wdth,wght].ttf');"],
    ["for (const f of [path.join(HERE, 'island.py'), sceneFile, words, font]) h.update(fs.readFileSync(f));", "for (const f of [path.join(HERE, 'island.py'), sceneFile, words, font].filter(Boolean)) h.update(fs.readFileSync(f));"],
    ["`samples=${samples}`, `font=${font}`]", "`samples=${samples}`, ...(font ? [`font=${font}`] : [])]"]],
  'lowpoly-island/tools/island.py': [
    ['FONT = OPT.get("font", os.path.join(HERE, "..", "assets", "fonts", "Fredoka[wdth,wght].ttf"))', 'FONT = OPT.get("font")  # fonts are not shipped: an installed Fredoka, else Blender\'s built-in font'],
    ['fnt = bpy.data.fonts.load(FONT)\n', 'fnt = bpy.data.fonts.load(FONT) if FONT and os.path.exists(FONT) else None\n'],
    ['cu.body = ch; cu.font = fnt; cu.size = 2.0;', 'cu.body = ch; cu.font = fnt or cu.font; cu.size = 2.0;']],
  'tilt-shift/tools/plate.mjs': [
    ["const font = path.join(HERE, '..', 'assets', 'fonts', 'BarlowSemiCondensed-SemiBold.ttf');", FIND_FONT + "const font = findFont('BarlowSemiCondensed-SemiBold.ttf');"],
    ["for (const f of [path.join(HERE, 'town.py'), sceneFile, words, font]) h.update(fs.readFileSync(f));", "for (const f of [path.join(HERE, 'town.py'), sceneFile, words, font].filter(Boolean)) h.update(fs.readFileSync(f));"],
    ["`samples=${samples}`, `font=${font}`]", "`samples=${samples}`, ...(font ? [`font=${font}`] : [])]"]],
  'backrooms/tools/plates.mjs': [
    ["const rooms = path.join(HERE, 'rooms.py'), font = path.join(PKG, 'assets', 'fonts', 'BarlowSemiCondensed-SemiBold.ttf');", FIND_FONT + "const rooms = path.join(HERE, 'rooms.py'), font = findFont('BarlowSemiCondensed-SemiBold.ttf');"],
    [".update(fs.readFileSync(font)).digest('hex')", ".update(font ? fs.readFileSync(font) : '').digest('hex')"],
    ["frames, `notice=${font}`]", "frames, ...(font ? [`notice=${font}`] : [])]"]],
  'backrooms/tools/rooms.py': [
    ['FONT = OPT.get("notice", os.path.join(HERE, "..", "assets", "fonts", "BarlowSemiCondensed-SemiBold.ttf"))', 'FONT = OPT.get("notice")  # fonts are not shipped: an installed Barlow Semi Condensed, else Blender\'s built-in font'],
    ['    fnt = bpy.data.fonts.load(FONT)\n', '    fnt = bpy.data.fonts.load(FONT) if FONT and os.path.exists(FONT) else None\n'],
    ['cu.body = txt; cu.font = fnt; cu.size = size;', 'cu.body = txt; cu.font = fnt or cu.font; cu.size = size;']],
};
// Summary, good-for and trigger text that ships in the index and the skill.
const FIELD_EDITS = { 'glass-product': [['should look like an Apple launch', 'should feel like a premium product launch']] };
const TRIGGER_EXCLUDE = /la linea|rsa animate|gatsby/i;

function adapt(id, rel, text) {
  let out = text.replaceAll(`production/styles/${id}/`, `library/styles/${id}/`);
  for (const [pattern, replace] of RULES) out = out.replace(pattern, replace);
  for (const [from, to] of EDITS[`${id}/${rel}`] ?? []) {
    const hit = typeof from === 'string' ? out.includes(from) : from.test(out);
    if (!hit) throw new Error(`import-styles: expected text not found in ${id}/${rel}; upstream changed, review the edit`);
    out = typeof from === 'string' ? out.replace(from, to) : out.replace(from, to);
  }
  return out;
}

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

// Styles the plugin wrote itself live beside the imported ones, each with a plugin-style.json holding its index entry.
// An import never removes them, and they are listed with origin "plugin".
const PLUGIN_STYLE = 'plugin-style.json';
async function readPluginStyles(stylesDir) {
  if (!(await exists(stylesDir))) return [];
  const out = [];
  for (const e of await fs.readdir(stylesDir, { withFileTypes: true })) {
    if (!e.isDirectory() || !(await exists(path.join(stylesDir, e.name, PLUGIN_STYLE)))) continue;
    const s = JSON.parse(await fs.readFile(path.join(stylesDir, e.name, PLUGIN_STYLE), 'utf8'));
    if (s.id !== e.name) throw new Error(`${e.name}/${PLUGIN_STYLE} names the id "${s.id}"; it must match its folder, ${e.name}`);
    out.push({ ...s, origin: 'plugin', contentStatus: null, contentProof: null, pluginProof: s.pluginProof ?? null });
  }
  return out;
}
const byId = (a, b) => a.id.localeCompare(b.id);

function firstSentence(text) {
  const m = text.match(/^.*?\.(?=\s|$)/);
  return m ? m[0] : text;
}

function skillMarkdown(entries) {
  const titles = entries.map((s) => s.title);
  const list = titles.length > 1 ? `${titles.slice(0, -1).join(', ')} or ${titles.at(-1)}` : titles[0];
  const description = `Build After Effects motion graphics in a named visual style from the bundled style library: ${list}. `
    + 'Use when the user names one of these looks, asks which styles are available, or wants help choosing a style; ordinary motion work without a named look does not need it.';
  if (description.length > 1024) throw new Error(`visual-styles description is ${description.length} characters; the limit is 1024`);
  const fonts = (s) => [...new Set(s.fonts.map((f) => f.family))].join(', ') || 'none';
  const own = entries.filter((s) => s.origin === 'plugin').map((s) => s.title);
  const ownList = own.length > 1 ? `${own.slice(0, -1).join(', ')} and ${own.at(-1)}` : own[0];
  const rows = entries.map((s) => `| ${s.title} | \`${s.id}\` | ${s.tier} | ${s.goodFor} | ${fonts(s)} | ${s.needs.length ? s.needs.join(', ') : 'none'} |`);
  return `---
name: visual-styles
description: ${description}
---

# Visual styles

${entries.length} visual styles, each with a written grammar (type, colour, motion, camera), an After Effects recipe and an ES3 module. Also available: **Paper collage** (\`paper-collage\`), which has its own skill and library module.

Read through \`ae_library\`: **motion-language**, **production-workflow** and **brief-template** first (the foundation for every style), then the chosen style's **style-<id>**. The table below already holds what \`style-index\` lists; read the index only for a style's tools or its proof status. If the library tool is unavailable, the same files are at \`../../library/styles/<id>/STYLE.md\` and \`../../library/styles/index.json\` relative to this skill's folder.

1. Choose the style with the user from the table. If they describe a look that is not listed, name the closest style and say how it differs.
2. Write the brief in the style's grammar (STYLE.md sections 2 to 4), adapted to the user's subject. A style is a grammar, not a template.
3. Fonts: each style uses the free (OFL) families in the Fonts column, from Google Fonts; none are included. A module's \`fontOK()\` stops the build when one is missing. Install the family, or substitute the closest installed family of the same kind by replacing the family name in the module text before loading it, and remeasure the text.
4. Tools: most styles prepare footage or stills with small Node scripts that use ffmpeg; the 3D styles render plates with Blender. Ask before running one; it reads the input files you name and writes to a cache folder you choose, replacing its own earlier outputs there. The 3D plate scripts render the library's seven-beat test scene format (\`scene.json\` with the beats title, picture, input, number, line, carry and end, plus \`words.json\`); for the user's own scene, adapt the script's beats or build the recipe's native layers without plates.
5. Build natively with \`ae_do\` and \`eval.run\`. Each \`eval.run\` call runs in its own function scope, so load the shared helpers and the style's module in the same call as the code that uses them, for example \`$.evalFile(File(LIB + "/styles/aes-lib.jsx")); $.evalFile(File(LIB + "/styles/<id>/<module>"));\` followed by your build code, where \`LIB\` is the absolute path of the \`library\` folder two levels above this skill's folder. Follow the AE recipe (STYLE.md section 6). The module's \`buildScene(comp, scene, opts)\` builds the library's seven-beat test scene; read it as a worked example of the technique, not as a builder for the user's scene. Its captions and labels are the test scene's own lines, written into the module, and its timings assume about ten seconds for the seven beats; if you call it with the user's \`scene.json\` (the 3D plates need that format), replace those lines and give each beat at least a second.
6. Render frames and check them against STYLE.md before showing the user.

The styles are adaptations of Lemo-Opuscar (MIT, LemoLab)${own.length ? `, except ${ownList}: ${own.length > 1 ? 'they are' : 'it is'} the plugin's own, written from its own measurements (\`origin\` is \`plugin\` in \`style-index\`, and \`proofNote\` says how far ${own.length > 1 ? 'each is' : 'it is'} tested)` : ''}. In \`style-index\`, \`contentStatus\` and \`contentProof\` record that a style was proven in the author's own proof setup before import; \`pluginProof\` stays null until the style has been built and checked through this plugin. Say which applies when you present a style.

${own.map((t) => `${t} is the plugin's own style; read its STYLE.md for what was measured and how far it is tested.`).join('\n')}${own.length ? '\n\n' : ''}| Style | id | Tier | Good for | Fonts | Needs |
|---|---|---|---|---|---|
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
        const rewritten = adapt(style.id, rel, text);
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
    const field = (text) => {
      let out = text;
      for (const [pattern, replace] of RULES) out = out.replace(pattern, replace);
      for (const [from, to] of FIELD_EDITS[style.id] ?? []) out = out.replace(from, to);
      return out;
    };
    entries.push({
      id: style.id, title: style.title, tier: style.tier, summary: field(style.summary),
      goodFor: field(notes[style.id]?.goodFor ?? firstSentence(style.summary)),
      triggers: style.triggers.filter((t) => !TRIGGER_EXCLUDE.test(t)).map(field),
      module: style.module, moduleGlobal: style.moduleGlobal,
      needs: [...needs].sort(),
      fonts: (style.fonts ?? []).map(({ family, style: face, license: lic }) => ({ family, style: face, license: lic, source: 'Google Fonts' })),
      tools: (style.tools ?? []).map((t) => t.file),
      contentStatus: style.status, contentProof: style.proof?.date ?? null,
      pluginProof: null,
    });
  }

  // Replace earlier imports: only folders an earlier index listed, plus this run's.
  const indexPath = path.join(to, 'styles', 'index.json');
  const previousIndex = await exists(indexPath) ? JSON.parse(await fs.readFile(indexPath, 'utf8')).styles : [];
  const ownStyles = await readPluginStyles(path.join(to, 'styles'));
  const ownIds = new Set(ownStyles.map((s) => s.id));
  const previous = previousIndex.map((s) => s.id).filter((id) => !ownIds.has(id));
  // Plugin-route evidence belongs to the plugin, not to Content: keep it across re-imports.
  for (const entry of entries) entry.pluginProof = previousIndex.find((s) => s.id === entry.id)?.pluginProof ?? null;
  for (const id of new Set([...previous, ...selected.map((s) => s.id)])) {
    await fs.rm(path.join(to, 'styles', id), { recursive: true, force: true });
  }
  for (const f of staged) {
    await fs.mkdir(path.dirname(path.join(to, f.out)), { recursive: true });
    await fs.writeFile(path.join(to, f.out), f.data);
  }
  const listed = [...entries, ...ownStyles].sort(byId);
  await fs.writeFile(indexPath, `${JSON.stringify({ source: { repo: 'Content', path: 'production/styles', commit }, styles: listed }, null, 2)}\n`);

  const mapPath = path.join(to, 'source-map.json');
  const map = JSON.parse(await fs.readFile(mapPath, 'utf8'));
  const ours = new Set(staged.map((f) => f.sourcePath));
  const prefixes = [...previous, ...selected.map((s) => s.id)].map((id) => `production/styles/${id}/`);
  // Remove only what an import wrote: the import entry and per-file historical-* entries under imported folders.
  const importedFile = (s) => s.id?.startsWith('historical-') && (ours.has(s.path) || prefixes.some((p) => s.path.startsWith(p)));
  map.sources = map.sources.filter((s) => s.id !== 'content-style-library' && !importedFile(s));
  map.sources.push({
    id: 'content-style-library',
    path: 'production/styles',
    sourceRevision: commit,
    styles: selected.map((s) => s.id),
    classification: 'mit-licensed-adaptation',
    adaptedTo: ['library/styles/', 'skills/visual-styles/SKILL.md'],
    scope: 'Proven Content style packages that need no generated art: STYLE.md, the ES3 module and the tools each needs. Font binaries, proofs and generated pieces are not copied. Content-only notes are rewritten by plugin/scripts/import-styles.mjs.',
    attribution: 'Styles adapted from Lemo-Opuscar (MIT, Copyright (c) 2026 LemoLab, https://github.com/lemomo-ai/lemo-opuscar); grammar and native After Effects ports by Joe Benscoter. Each STYLE.md states what it takes from its source.',
  });
  for (const f of staged) map.sources.push({ path: f.sourcePath, sha256: f.sourceSha, id: `historical-${sha256(f.sourcePath).slice(0, 12)}` });
  await fs.writeFile(mapPath, `${JSON.stringify(map, null, 2)}\n`);

  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillMarkdown(listed));

  return { imported: selected.map((s) => s.id), skipped, files: staged.map((f) => f.out).sort(), adaptations };
}

// Re-list the plugin's own styles in the index and the skill without Content: imported entries are kept as they are.
export async function refreshStyles({ to, skillDir }) {
  const indexPath = path.join(to, 'styles', 'index.json');
  const index = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  const own = await readPluginStyles(path.join(to, 'styles'));
  const listed = [...index.styles.filter((s) => s.origin !== 'plugin'), ...own].sort(byId);
  await fs.writeFile(indexPath, `${JSON.stringify({ source: index.source, styles: listed }, null, 2)}\n`);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, 'SKILL.md'), skillMarkdown(listed));
  return { own: own.map((s) => s.id), total: listed.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--refresh')) {
  const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const r = await refreshStyles({ to: path.join(pluginRoot, 'library'), skillDir: path.join(pluginRoot, 'skills', 'visual-styles') });
  console.log(`listed ${r.total} styles; the plugin's own: ${r.own.join(', ') || 'none'}`);
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--from');
  if (i < 0) { console.error('usage: node plugin/scripts/import-styles.mjs --from <Content>/production/styles | --refresh'); process.exit(2); }
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
