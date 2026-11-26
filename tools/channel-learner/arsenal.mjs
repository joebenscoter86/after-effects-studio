#!/usr/bin/env node
// The arsenal as Comp Room ships it: plugin/library/arsenal/, generated from the recipe drafts in one command.
//   node tools/channel-learner/arsenal.mjs [--renders <folder holding quality/renders>] [--jobs <Content's jobs.json>]
//     [--examples <file>] [--drafts <dir>] [--tags <file>] [--proofs <file>] [--credits <file>] [--out <dir>]
//     [--readme <file>] [--no-manifest] [--levels <levels.json>] [--styles <plugin/library/styles>] [--style-proofs <style packages>]
//     [--pieces <plugin/library/pieces>]
// Writes the jobs file (Content's version, groups, tags, ids, names and definitions, with the public examples in
// arsenal-public-examples.json, since Content's own examples come from the owner's reels; the fields the runtime does not
// read are dropped), the catalog data file, an index and the recipes grouped by job group, each proven recipe's status
// line shortened to its acceptance date (the drafts keep the full line); makes a small
// JPEG still from our own proof render for each proven technique (never a tutorial frame); writes the README gallery
// that shows those stills (the directory rule: every bundled image is shown in the README); regenerates the library
// manifest; rewrites the drafts' own catalog.json, which the merge step reads. Never hand-edit the output. Design: product/arsenal-catalog-design.md.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from './catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE_LIMIT = 262_144;    // the Claude directory's limit for a non-image file
const TEXT_FILES_MAX = 12;     // the arsenal's budget of package files, stills aside (design)
const STILL_WIDTH = 480;
const GROUP_ORDER = ['line', 'picture', 'connective', 'build-aid'];
const AID_LABEL = 'Build aids and unmatched recipes';
const START = '<!-- arsenal-stills:start -->';
const END = '<!-- arsenal-stills:end -->';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const EXAMPLES_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'arsenal-public-examples.json');

/** Names no shipped arsenal file may contain (whole words, any case), besides the creators in the credits. The one list. */
export const PRIVATE_NAMES = ['Joe', 'JoeB', 'Benscoter', 'Claude', 'Anthropic', 'Higgsfield'];

// ---------- scrubbing: the shipped text keeps the craft and drops where it was learned ----------

const DROPPED_FIELDS = /^(source|result|before|longest on|jobs):/;

function tidy(line) {
  const indent = line.match(/^\s*/)[0];
  let s = line.slice(indent.length);
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\s*[–-]\s*(?=[,;)])/g, '')
      .replace(/ +([,;)])/g, '$1')
      .replace(/(?<![\w$\])])\(\s*[,;]\s*/g, '(')
      .replace(/[,;]\s*(?=\))/g, '')
      .replace(/([,;])(\s*[,;])+/g, '$1')
      .replace(/(?<![\w$\])])\(\s+(?=\S)(?!\))/g, '(')
      .replace(/\s+(?:and|or|with|compared with|compared)\s*(?=[,;)])/g, '')
      .replace(/(?<![\w$\])])\s*\(\s*(?:compared|and|with|or)?\s*\)/g, '')
      .replace(/\s*\((?:frame,? ?|cut from,? ?|saved as)+\)/g, '')
      .replace(/,? (?:and )?saved as\s*(?=[,;.)]|[A-Z]|$)/g, '')
      .replace(/\b(a crop|a still) of(?=[,;.)])/g, '$1')
      .replace(/\bcut from\s*(?=[,;.)]|$)/g, 'cut from the source video')
      .replace(/[;,]?\s*\bgrid in\s*(?=[.;,)])/g, '')
      .replace(/ +\.(?=\s|$)/g, '.')
      .replace(/ {2,}/g, ' ');
  }
  return indent + s.trimEnd();
}

const FRAME = String.raw`(?:clean_)?f\d{4,6}(?:-crop)?`;
// A run of frame ids with what joins them ("f001 and f002", "f001–f002, f003") and the preposition before it.
const FRAMES = new RegExp(String.raw`(?:\s*\b(?:between|from|at|in|on|of|after|before|by|until|to|with)\s+)?\b${FRAME}(?:\s*(?:,|and|–|-|to|\/)\s*${FRAME})*\b`, 'g');
// A time in the source video: thirty seconds or more (a beat's keys sit well under that), alone or as a range,
// with the words that point at it. Times on a timeline ("keys at 0 s and 4.96 s") stay.
const SOURCE_TIME = /(\s*\b(?:(?:cut|cuts|in cuts|cut frame|shown|measured|glimpsed|on screen|settled to|appears|enters the crop by)\s+)?(?:at |by |about |from |before |after |until |to )*)(\d+(?:\.\d+)?)(?:\s*(?:–|-|\/|and)\s*\d+(?:\.\d+)?)* ?s\b/g;

/** One line with its provenance removed: video ids, frame numbers, study paths and source times. */
export function scrubLine(line, videos = []) {
  let s = line;
  for (const v of videos) s = s.split(v).join('the source video');
  s = s.replace(/measured on (?:STUDY\/)?scratch\/[^\s,;)]+(?:,? cut (?:from \S+ )?at [\d.]+ ?s)?/g, 'measured on a still of the result')
    .replace(/(?:STUDY\/)?scratch\/[^\s,;)]*[^\s,;).]/g, '')
    .replace(/\b[\w.-]+\.(?:png|jpe?g|mp4|mov)\b/g, '')
    .replace(/\s*\b(?:at |from )?source \d+(?:\.\d+)?(?:\s*(?:–|-|and)\s*\d+(?:\.\d+)?)? ?s\b/g, '')
    .replace(FRAMES, '')
    .replace(SOURCE_TIME, (m, lead, first) => (parseFloat(first) >= 30 ? (/^\s*\b(?:shown|measured)\b/.test(lead) ? lead.match(/^\s*\w+/)[0] : '') : m))
    .replace(/\s*\bcut (?:from )?\s*at\b(?=\s*[,;).])/g, '');
  return s === line ? line : tidy(s);
}

/** One recipe section's text with its provenance removed. */
export function scrubRecipe(text, { videos = [] } = {}) {
  return text.split('\n').filter((l) => !DROPPED_FIELDS.test(l)).map((l) => scrubLine(l, videos)).join('\n');
}

// ---------- three levels: styles, worlds, recipes (pieces among them) ----------
// Design: docs/superpowers/specs/2026-11-24-library-three-levels-design.md. The fields the drafts and tags do not hold
// come from product/arsenal-drafts/levels.json: the provides vocabulary, each recipe's provides and renderer, and each
// visual style's entry (level, provides, cost, the proof beat its still is cut from, composes).

export const LEVELS = ['style', 'world', 'recipe'];
export const RENDERERS = ['classic', 'advanced-3d', 'blender'];
export const STYLE_PREFIX = 'style-';

/** "material: glass" -> ["material", "glass"]; "depth" -> ["depth", null]. */
export function parseProvides(p) {
  const m = String(p).match(/^\s*([a-z-]+)\s*(?::\s*([a-z0-9-]+)\s*)?$/);
  return m ? [m[1], m[2] ?? null] : null;
}
const normProvides = (p) => { const k = parseProvides(p); return k ? (k[1] ? `${k[0]}: ${k[1]}` : k[0]) : String(p); };

/** Problems with one provides list against the vocabulary (keys, each with its fixed words). */
export function providesProblems(list, vocab, where) {
  const out = [];
  if (!Array.isArray(list)) return [`${where}: provides is not a list`];
  for (const p of list) {
    const k = parseProvides(p);
    if (!k) out.push(`${where}: provides "${p}" is not "key" or "key: word"`);
    else if (!vocab[k[0]]) out.push(`${where}: provides key "${k[0]}" is not in the vocabulary (${Object.keys(vocab).join(', ')})`);
    else if (k[1] && !vocab[k[0]].includes(k[1])) out.push(`${where}: provides "${k[0]}: ${k[1]}" is not one of the ${k[0]} words (${vocab[k[0]].join(', ')})`);
  }
  return out;
}

/** Why an entry has no still; null when it should have one. */
export function noStillReason(r) {
  if (r.kind === 'build-aid') return 'build aid: serves no beat, so no proof still';
  if (r.kind === 'unmatched') return 'unmatched: fits no job yet, so no proof still';
  if (r.status !== 'proven') return 'unproven: no proof build yet';
  return null;
}

/** The proof movie time a style still is cut from: the card's beat time for the beat levels.json names. */
export function styleStillTime(card, beat, beats) {
  const i = beats.indexOf(beat);
  if (i < 0 || !Array.isArray(card?.beatTimes) || card.beatTimes[i] === undefined) throw new Error(`no time for beat "${beat}" in the proof card`);
  return card.beatTimes[i];
}

/**
 * Checks levels.json against the catalog and the style index; returns the problems (empty when it is sound).
 * Every recipe needs a record and every technique at least one provides; every style needs a record and the reverse;
 * a style still is never cut from a private beat.
 */
export function levelsProblems(levels, catalog, styles = []) {
  const p = [];
  const vocab = levels.provides ?? {};
  for (const [k, words] of Object.entries(vocab)) if (!Array.isArray(words)) p.push(`provides key "${k}" has no word list`);
  const ids = new Set(catalog.recipes.map((r) => r.id));
  for (const r of catalog.recipes) {
    const l = levels.recipes?.[r.id];
    if (!l) { p.push(`recipe ${r.id} has no levels record`); continue; }
    p.push(...providesProblems(l.provides, vocab, `recipe ${r.id}`));
    if (r.kind === 'technique' && Array.isArray(l.provides) && !l.provides.length) p.push(`recipe ${r.id}: a technique needs at least one provides`);
    if (l.renderer !== undefined && !RENDERERS.includes(l.renderer)) p.push(`recipe ${r.id}: renderer "${l.renderer}" is not one of ${RENDERERS.join(', ')}`);
  }
  for (const id of Object.keys(levels.recipes ?? {})) if (!ids.has(id)) p.push(`levels record for ${id}, which is not a recipe`);
  const styleIds = new Set(styles.map((s) => s.id));
  const beats = levels.beats ?? [];
  for (const s of styles) {
    const l = levels.styles?.[s.id];
    if (!l) { p.push(`style ${s.id} has no levels record`); continue; }
    if (!['style', 'world'].includes(l.level)) p.push(`style ${s.id}: level "${l.level}" is not style or world`);
    for (const a of l.also_level ?? []) if (!LEVELS.includes(a) || a === l.level) p.push(`style ${s.id}: also_level "${a}" is not another level`);
    p.push(...providesProblems(l.provides, vocab, `style ${s.id}`));
    if (Array.isArray(l.provides) && !l.provides.length) p.push(`style ${s.id}: needs at least one provides`);
    if (!RENDERERS.includes(l.cost?.renderer)) p.push(`style ${s.id}: cost.renderer "${l.cost?.renderer}" is not one of ${RENDERERS.join(', ')}`);
    if (l.still) {
      if (!beats.includes(l.still.beat)) p.push(`style ${s.id}: still beat "${l.still.beat}" is not one of ${beats.join(', ')}`);
      if (levels.private_beats?.[l.still.beat]) p.push(`style ${s.id}: still beat "${l.still.beat}" is private (${levels.private_beats[l.still.beat]})`);
    }
    for (const c of l.composes ?? []) if (!ids.has(c) && !styleIds.has(c.replace(STYLE_PREFIX, ''))) p.push(`style ${s.id}: composes ${c}, which is in no catalog`);
  }
  for (const id of Object.keys(levels.styles ?? {})) if (!styleIds.has(id)) p.push(`levels record for style ${id}, which is not in the style index`);
  return p;
}

const sha8 = (text) => createHash('sha256').update(text).digest('hex').slice(0, 8);
const firstSentence = (text) => (String(text).match(/^.*?\.(?=\s|$)/) ?? [text])[0];

/** One catalog entry for a visual style: its ae_library document, its level and what it provides. */
export function styleEntry(s, l, styleDoc, still, block = null) {
  const record = {
    id: `${STYLE_PREFIX}${s.id}`, level: l.level, ...(l.also_level?.length ? { also_level: l.also_level } : {}),
    ...(block ? { block } : {}),
    name: s.title, line: firstSentence(s.summary), good_for: s.goodFor,
    status: s.contentStatus === 'proven' || s.pluginProof?.technical === 'passed' ? 'proven' : 'unproven',
    kind: 'style', job: null, support: [], mood: [], needs: s.needs ?? [], duration: null, motion: null, difficulty: null, taught_by: 1, variants: [],
    provides: l.provides.map(normProvides), cost: l.cost, composes: l.composes ?? [], shelf: 'shipped',
    section: { document: `${STYLE_PREFIX}${s.id}`, heading: null },
    still: still ?? null,
  };
  record.revision = sha8(`${styleDoc}\n${JSON.stringify({ ...record, still: undefined })}`);
  if (!record.still) record.no_still = l.still ? 'no still made yet from its proof movie' : 'no proof movie to cut a still from';
  // Field order: id and revision first, as the recipes have them.
  const { id, revision, ...rest } = record;
  return { id, revision, ...rest };
}

// ---------- pieces: runnable code, one file each ----------
// A piece is one ES3 file in plugin/library/pieces/ that makes one object or one move (pcs-core.jsx is what they share).
// Its header (comment lines "// key: value" up to "// ---") says what it does, the jobs it serves and how to call it;
// its proof picture is a render of pieces/proof/<name>.jsx, kept at quality/renders/pieces/<name>.png.

export const PIECE_PREFIX = 'piece-';
const PIECE_REQUIRED = ['piece', 'name', 'does', 'use it for', 'job', 'call', 'example'];
const PIECE_SINGLE = ['piece', 'name', 'does', 'use it for', 'job', 'provides', 'needs', 'works with', 'call', 'returns', 'renderer'];

/** A piece file's header: { piece, name, does, ..., options: [[name, text]], example: [lines], notes: [text] }. */
export function parsePieceHeader(text, file = 'piece') {
  const out = { options: [], example: [], notes: [] };
  let inExample = false;
  let ended = false;
  for (const raw of text.split('\n')) {
    if (!raw.startsWith('//')) { if (raw.trim()) break; continue; }
    const line = raw.replace(/^\/\/ ?/, '');
    if (/^---\s*$/.test(line)) { ended = true; break; }
    if (inExample && /^\s{2,}\S/.test(line)) { out.example.push(line.replace(/^\s{2}/, '')); continue; }
    inExample = false;
    const m = line.match(/^([a-z][A-Za-z0-9 ,]*?):\s*(.*)$/);   // option names may be camelCase or a list (option h, gap:)
    if (!m) continue;
    const [, key, value] = m;
    if (key === 'example') { inExample = true; if (value.trim()) out.example.push(value.trim()); continue; }
    if (key === 'note') { out.notes.push(value.trim()); continue; }
    const opt = key.match(/^option (.+)$/);
    if (opt) { out.options.push([opt[1].trim(), value.trim()]); continue; }
    if (PIECE_SINGLE.includes(key)) out[key] = value.trim();
  }
  if (!ended) throw new Error(`refused: ${file} has no header ending in "// ---"`);
  return out;
}

const listOf = (v) => String(v ?? '').split(/[;,]\s*/).map((x) => x.trim()).filter(Boolean);

/** The pieces in a folder: every <name>.jsx but the core, with its header and text. */
export function readPieces(piecesDir) {
  if (!piecesDir || !fs.existsSync(piecesDir)) return [];
  return fs.readdirSync(piecesDir).filter((n) => n.endsWith('.jsx') && n !== 'pcs-core.jsx').sort().map((n) => {
    const text = fs.readFileSync(path.join(piecesDir, n), 'utf8');
    return { name: n.replace(/\.jsx$/, ''), file: n, text, header: parsePieceHeader(text, n), proof: fs.existsSync(path.join(piecesDir, 'proof', n)) };
  });
}

/** Problems with the pieces: required header fields, jobs and provides from the vocabularies, works-with ids that exist. */
export function piecesProblems(pieces, { jobs = [], vocab = {}, ids = [] } = {}) {
  const p = [];
  const known = new Set([...ids, ...pieces.map((x) => `${PIECE_PREFIX}${x.name}`)]);
  for (const x of pieces) {
    const h = x.header;
    const where = `piece ${x.file}`;
    for (const k of PIECE_REQUIRED) if (!h[k] || (k === 'example' && !h.example.length)) p.push(`${where}: no "${k}" line`);
    if (h.piece && h.piece !== x.name) p.push(`${where}: says "piece: ${h.piece}", but its file is ${x.file}`);
    const [job, support] = parseJobLine(h.job);
    for (const j of [job, ...support].filter(Boolean)) if (!jobs.includes(j)) p.push(`${where}: job "${j}" is not in the job vocabulary`);
    p.push(...providesProblems(listOf(h.provides), vocab, where));
    if (h.renderer && !RENDERERS.includes(h.renderer)) p.push(`${where}: renderer "${h.renderer}" is not one of ${RENDERERS.join(', ')}`);
    for (const w of listOf(h['works with'])) if (!known.has(w)) p.push(`${where}: works with ${w}, which is in no catalog`);
    if (!x.proof) p.push(`${where}: no proof scene at pieces/proof/${x.file}`);
  }
  return p;
}
/** "before-after; support: fail-then-fix, reveal-headline" -> ["before-after", ["fail-then-fix", "reveal-headline"]]. */
export function parseJobLine(line) {
  const m = String(line ?? '').match(/^\s*([a-z-]+)\s*(?:;\s*support:\s*(.*))?$/);
  return m ? [m[1], listOf(m[2])] : [null, []];
}
/** The PCS functions a piece file defines (PCS.<name> = function), in order: how an example's calls find their piece. */
export const functionsOf = (text) => [...new Set([...text.matchAll(/^PCS\.([A-Za-z0-9_]+)\s*=\s*function/gm)].map((m) => m[1]))];
/** The pieces a piece loads itself (PCS.need calls in its code). */
const requiresOf = (text) => [...new Set([...text.matchAll(/PCS\.need\(\s*['"]([a-z0-9-]+)['"]\s*\)/g)].map((m) => m[1]))];

/** One catalog entry for a piece: level recipe, kind piece, with its call instead of prose. */
export function pieceEntry(x, still) {
  const h = x.header;
  const [job, support] = parseJobLine(h.job);
  const record = {
    id: `${PIECE_PREFIX}${x.name}`, revision: sha8(x.text), level: 'recipe', name: h.name, line: h.does, use_for: h['use it for'],
    status: still ? 'proven' : 'unproven', kind: 'piece', job, support, mood: [], needs: listOf(h.needs),
    duration: null, motion: null, difficulty: null, taught_by: 1, variants: [],
    provides: listOf(h.provides).map(normProvides), cost: { renderer: h.renderer ?? 'advanced-3d' }, composes: listOf(h['works with']), shelf: 'shipped',
    requires: requiresOf(x.text),
    call: { load: x.name, functions: functionsOf(x.text), signature: h.call, options: h.options.map(([name, text]) => ({ name, text })), returns: h.returns ?? null, example: h.example.join('\n'), notes: h.notes },
    section: { document: `${PIECE_PREFIX}${x.name}`, heading: null },
    still: still ?? null,
  };
  if (!record.still) record.no_still = 'no proof render yet: render pieces/proof/' + x.file;
  return record;
}

// ---------- styles as data: pieces/styles/<id>.json ----------
// A style block is the small set of values the pieces read (PCS.use): ground, surface, ink, accent, light, grain, font,
// thickness, material. Roles: "house" (the default, exactly one), "example" (proves the pieces carry no look; never the
// house) and "look" (an existing visual style written as a block; its catalog entry stays the style's own and gains
// `block`). House and examples are catalog entries of their own, style-<id>, with a still of the style proof scene
// (pieces/proof/styles.jsx) rendered at quality/renders/pieces/styles/<id>.png.

export const STYLE_DEFAULT = 'house';
export const STYLE_ROLES = ['house', 'example', 'look'];
const BLOCK_COLOURS = ['ground', 'backplate', 'surface', 'ink', 'type', 'accent', 'onAccent', 'quiet', 'keyColor', 'fillColor'];
// fillReach: how far the fill reaches (0: everywhere), so objects lift and the backplate stays dark; litCap: the brightest a
// lit colour's channel may be (0: no cap), so a saturated colour renders saturated; rowDepth, rowBevel: piece-rows' bars.
const BLOCK_NUMBERS = ['keyIntensity', 'fillIntensity', 'envIntensity', 'grain', 'depth', 'bevel', 'fillReach', 'litCap', 'rowDepth', 'rowBevel'];
const BLOCK_STRINGS = ['font', 'weight'];
// typeLit: the colour to give a lit hero word so its face renders as the type colour under the style's light, set by
// render; 0 uses the type colour itself.
const BLOCK_COLOUR_OR_OFF = ['typeLit'];
export const BLOCK_KEYS = [...BLOCK_COLOURS, ...BLOCK_NUMBERS, ...BLOCK_STRINGS, ...BLOCK_COLOUR_OR_OFF, 'tilt', 'material'];
const MATERIAL_KEYS = ['specular', 'shininess', 'metal'];

/** The style blocks in pieces/styles/: { id, file, text, block }. */
export function readStyleBlocks(piecesDir) {
  const dir = piecesDir ? path.join(piecesDir, 'styles') : null;
  if (!dir || !fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort().map((n) => {
    const text = fs.readFileSync(path.join(dir, n), 'utf8');
    let block;
    try { block = JSON.parse(text); } catch (e) { throw new Error(`refused: pieces/styles/${n} is not JSON: ${e.message}`); }
    return { id: n.replace(/\.json$/, ''), file: n, text, block };
  });
}

const isColour = (v) => Array.isArray(v) && v.length === 3 && v.every((x) => typeof x === 'number' && x >= 0 && x <= 1);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Problems with the style blocks: shape, roles, one house default, provides from the vocabulary, borrowed looks that exist. */
export function styleBlockProblems(blocks, { vocab = {}, styleIds = [] } = {}) {
  const p = [];
  const known = new Set(styleIds);
  const defaults = blocks.filter((x) => x.block.default === true);
  if (blocks.length && (defaults.length !== 1 || defaults[0].id !== STYLE_DEFAULT || defaults[0].block.role !== 'house')) {
    p.push(`style blocks: exactly one default, "${STYLE_DEFAULT}" with role house (found ${defaults.map((x) => x.id).join(', ') || 'none'})`);
  }
  for (const x of blocks) {
    const b = x.block; const where = `style block ${x.file}`;
    if (b.id !== x.id) p.push(`${where}: says id "${b.id}", but its file is ${x.file}`);
    if (!/^[a-z0-9-]+$/.test(x.id)) p.push(`${where}: id is not lower-case words joined by hyphens`);
    for (const k of ['title', 'line', 'source']) if (!b[k]) p.push(`${where}: no "${k}"`);
    if (!STYLE_ROLES.includes(b.role)) p.push(`${where}: role "${b.role}" is not one of ${STYLE_ROLES.join(', ')}`);
    if (b.role === 'example' && !x.id.startsWith('example-')) p.push(`${where}: an example's id starts with "example-"`);
    if (b.role === 'look') {
      if (!b.borrowed_from || !known.has(b.borrowed_from)) p.push(`${where}: a look names the style it is borrowed from (borrowed_from), and ${b.borrowed_from ?? 'nothing'} is no style`);
    } else {
      if (b.borrowed_from) p.push(`${where}: only a look is borrowed from a style`);
      if (known.has(`${STYLE_PREFIX}${x.id}`)) p.push(`${where}: style-${x.id} is already a visual style; a block for it is a look`);
    }
    p.push(...providesProblems(b.provides ?? [], vocab, where));
    if (b.role !== 'look' && !(b.provides ?? []).length) p.push(`${where}: no provides`);
    const v = b.values ?? {};
    for (const k of BLOCK_KEYS) if (!(k in v)) p.push(`${where}: no value "${k}"`);
    for (const k of Object.keys(v)) if (!BLOCK_KEYS.includes(k)) p.push(`${where}: unknown value "${k}"; values: ${BLOCK_KEYS.join(', ')}`);
    for (const k of BLOCK_COLOURS) if (k in v && !isColour(v[k])) p.push(`${where}: ${k} is not [r, g, b] from 0 to 1`);
    for (const k of BLOCK_NUMBERS) if (k in v && !isNumber(v[k])) p.push(`${where}: ${k} is not a number of 0 or more`);
    for (const k of BLOCK_STRINGS) if (k in v && !(typeof v[k] === 'string' && v[k].trim())) p.push(`${where}: ${k} is not a name`);
    for (const k of BLOCK_COLOUR_OR_OFF) if (k in v && v[k] !== 0 && !isColour(v[k])) p.push(`${where}: ${k} is not [r, g, b] from 0 to 1, or 0`);
    if (b.previous) {   // the values before the last tune, loadable as <id>-previous
      const pv = b.previous.values ?? {};
      if (!b.previous.date || !b.previous.why) p.push(`${where}: previous needs a date and a why`);
      for (const k of Object.keys(pv)) if (!BLOCK_KEYS.includes(k)) p.push(`${where}: previous has unknown value "${k}"`);
    }
    if ('tilt' in v && !(Array.isArray(v.tilt) && v.tilt.length === 2 && v.tilt.every((n) => typeof n === 'number'))) p.push(`${where}: tilt is not [x, y] degrees`);
    if ('material' in v && v.material !== null && !(typeof v.material === 'object' && Object.entries(v.material).every(([k, n]) => MATERIAL_KEYS.includes(k) && isNumber(n)))) {
      p.push(`${where}: material is null or { ${MATERIAL_KEYS.join(', ')} } numbers`);
    }
    for (const k of b.chosen ?? []) if (!BLOCK_KEYS.includes(k)) p.push(`${where}: chosen names "${k}", which is no value`);
  }
  return p;
}

/** The catalog entry for a house or example style block: level style, with its block id and the pieces its proof uses. */
export function styleBlockEntry(x, still, composes = []) {
  const b = x.block;
  const record = {
    id: `${STYLE_PREFIX}${x.id}`, revision: sha8(x.text), level: 'style', name: b.title, line: b.line, role: b.role,
    ...(b.default ? { default: true } : {}), block: x.id,
    status: still ? 'proven' : 'unproven', kind: 'style', job: null, support: [], mood: [], needs: [], duration: null, motion: null, difficulty: null, taught_by: 1, variants: [],
    provides: (b.provides ?? []).map(normProvides), cost: { renderer: 'advanced-3d' }, composes, shelf: 'shipped',
    ...(b.open?.length ? { open: b.open } : {}),
    section: { document: `pieces-style-${x.id}`, heading: null },
    still: still ?? null,
  };
  if (!record.still) record.no_still = 'no proof render yet: render pieces/proof/styles.jsx with this style';
  return record;
}

// ---------- building ----------

function sectionsOf(text) {
  return text.split(/^(?=## )/m).filter((s) => s.startsWith('## ')).map((s) => s.trim());
}

const groupOf = (r, jobs) => (r.kind === 'technique' ? jobs.jobs.find((j) => j.id === r.job)?.group ?? 'build-aid' : 'build-aid');
const docId = (g) => `arsenal-${g}`;
const recipeFile = (g) => `recipes-${g}.md`;
const jobsFile = (jobs) => `jobs-v${String(jobs.version).replace(/^v/, '')}.json`;
const isStillKind = (r) => r.status === 'proven' && r.kind === 'technique';

/** Proven techniques with a proof render: id -> the render's path as proof-stills.json gives it. */
export function wantedStills(catalog) {
  return Object.fromEntries(catalog.recipes.filter((r) => isStillKind(r) && r.still).map((r) => [r.id, r.still]));
}

/**
 * A shipped recipe's status line: `status: proven (accepted by <name> <date>: ...)` becomes `status: proven (accepted <date>)`.
 * The drafts keep the full line, as the record. Any other line, a status line with no name among them, is left alone.
 */
export function publicStatus(line) {
  return line.replace(/^(\s*status: proven) \(accepted by \D+? (\d{4}-\d{2}-\d{2})\b.*\)\s*$/, '$1 (accepted $2)');
}

/** The top-level fields of Content's jobs file that the runtime reads (plugin/runtime/src/tools/arsenal.ts JobsFile). */
const JOBS_FIELDS = ['version', 'groups', 'tags', 'jobs'];

/** Content's phrases that name a person, and the generic wording the shipped jobs file uses instead. Exact phrases only. */
export const JOBS_REWORDING = {
  'never becomes a job without Joe': "never becomes a job without the owner's approval",
};
const reword = (s) => Object.entries(JOBS_REWORDING).reduce((t, [from, to]) => t.split(from).join(to), s);
const rewordAll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? reword(v) : v]));

/**
 * The shipped jobs file: Content's version, groups, tags and jobs (ids, groups, names and definitions as Content has them),
 * each job's example swapped for the public one (id -> one line), the group and tag text reworded by JOBS_REWORDING, laid
 * out as Content lays it out; the fields the runtime does not read are dropped. Refuses a Content job with no public
 * example, and a public example for a job Content lacks.
 */
export function publicJobs(content, examples) {
  const jobs = Object.fromEntries(Object.entries(content).filter(([k]) => JOBS_FIELDS.includes(k))
    .map(([k, v]) => [k, (k === 'groups' || k === 'tags') && v && typeof v === 'object' ? rewordAll(v) : v]));
  const ids = jobs.jobs.map((j) => j.id);
  const missing = ids.filter((id) => typeof examples[id] !== 'string' || !examples[id].trim());
  const unknown = Object.keys(examples).filter((id) => !ids.includes(id));
  const problems = [];
  if (missing.length) problems.push(`no public example for ${missing.join(', ')}`);
  if (unknown.length) problems.push(`public examples for jobs Content does not have: ${unknown.join(', ')}`);
  if (problems.length) throw new Error(`refused: ${problems.join('; ')}`);
  const inline = (o) => `{${Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')}}`;
  const block = (o) => `{\n${Object.entries(o).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n  }`;
  const top = Object.entries(jobs).filter(([k]) => k !== 'jobs').map(([k, v]) => `  ${JSON.stringify(k)}: ${v && typeof v === 'object' ? block(v) : JSON.stringify(v)}`);
  const rows = jobs.jobs.map((j) => `    ${inline({ ...j, example: examples[j.id] })}`);
  return `{\n${[...top, `  "jobs": [\n${rows.join(',\n')}\n  ]`].join(',\n')}\n}\n`;
}

/**
 * The arsenal's files from a built catalog (catalog.mjs buildCatalog). `jobs` is Content's jobs file, shipped with the
 * public `examples` (publicJobs); `stills` maps id -> JPEG bytes already made; `creators` are names no shipped file may
 * contain, checked with PRIVATE_NAMES.
 */
export function buildArsenal({ catalog, jobs, examples, draftsDir, stills = {}, creators = [], fileLimit = FILE_LIMIT, levels = null, styles = [], styleDocs = {}, pieces = [],
  styleBlocks = [], stylesProof = null }) {
  if ((pieces.length || styleBlocks.length) && !levels) throw new Error('refused: pieces and style blocks need levels.json');
  if (levels) {
    const styleIds = styles.map((x) => `${STYLE_PREFIX}${x.id}`);
    const bad = [...levelsProblems(levels, catalog, styles),
      ...piecesProblems(pieces, { jobs: catalog.jobs, vocab: levels.provides ?? {}, ids: [...catalog.recipes.map((r) => r.id), ...styleIds] }),
      ...styleBlockProblems(styleBlocks, { vocab: levels.provides ?? {}, styleIds })];
    // Piece code and style blocks ship as they are: the same name guard as the generated files.
    for (const [f, text] of [...pieces.map((x) => [`pieces/${x.file}`, x.text]), ...styleBlocks.map((x) => [`pieces/styles/${x.file}`, x.text])]) {
      for (const c of PRIVATE_NAMES) if (new RegExp(`\\b${c}\\b`, 'i').test(text)) bad.push(`${f} names a private name: ${c}`);
    }
    if (bad.length) throw new Error(`refused: ${bad.join('; ')}`);
  } else if (styles.length) throw new Error('refused: styles need levels.json');
  const jobsText = publicJobs(jobs, examples);
  const videos = [...new Set(catalog.recipes.map((r) => r.video).filter(Boolean))];
  const drafts = new Map();
  const textOf = (r) => {
    if (!drafts.has(r.section.file)) drafts.set(r.section.file, sectionsOf(fs.readFileSync(path.join(draftsDir, r.section.file), 'utf8')));
    const s = drafts.get(r.section.file).find((t) => t.startsWith(`## ${r.section.heading}\n`) && new RegExp(`^id:\\s*(?:${r.video}-)?${r.id.replace(r.video + '-', '')}\\s*$`, 'm').test(t));
    if (!s) throw new Error(`refused: no section "${r.section.heading}" (${r.id}) in ${r.section.file}`);
    return s;
  };

  // A variant ships in its parent's group file, right after its parent.
  const byId = new Map(catalog.recipes.map((r) => [r.id, r]));
  const home = (r) => (r.variant_of ? byId.get(r.variant_of) : r);
  const sectionText = new Map();
  const records = [];
  const shippedStills = {};
  for (const r of catalog.recipes) {
    const g = groupOf(home(r), jobs);
    const own = textOf(r).split('\n').map(publicStatus).map((l) => (r.variant_of && /^variant of:/.test(l) ? `variant of: ${r.variant_of}` : l)).join('\n');
    const body = scrubRecipe(own, { videos }).split('\n').filter((l, i) => i > 0 && !/^id:/.test(l)).join('\n');
    const job = r.kind === 'technique' ? `job: ${r.job}${r.support.length ? `; support: ${r.support.join(', ')}` : ''}` : `job: none (${r.kind})`;
    sectionText.set(r.id, { g, text: `## ${r.name}\nid: ${r.id}\nrevision: ${r.revision}\n${job}\n${body}\n` });
    let still = null;
    if (isStillKind(r) && stills[r.id]) {
      still = { path: `arsenal/stills/${r.id}.jpg`, sha256: sha(stills[r.id]) };
      shippedStills[r.id] = stills[r.id];
    }
    const lv = levels?.recipes?.[r.id];
    records.push({
      id: r.id, revision: r.revision, level: 'recipe', name: r.name, line: scrubLine(r.line, videos), status: r.status, kind: r.kind, job: r.job, support: r.support,
      mood: r.mood, needs: r.needs, duration: r.duration, motion: r.motion, difficulty: r.difficulty, taught_by: r.taught_by,
      ...(r.variant_of ? { variant_of: r.variant_of } : {}), variants: r.variants ?? [],
      provides: (lv?.provides ?? []).map(normProvides), cost: { renderer: lv?.renderer ?? 'classic' }, composes: [], shelf: 'shipped',
      section: { document: docId(g), heading: r.name }, still,
      ...(still ? {} : { no_still: noStillReason(r) ?? 'no still made yet from its proof render' }),
    });
  }
  // A parent and its variants are one chunk, so they always share a file.
  const byGroup = new Map();
  for (const r of catalog.recipes.filter((x) => !x.variant_of)) {
    const ids = [r.id, ...(r.variants ?? [])];
    const { g } = sectionText.get(r.id);
    (byGroup.get(g) ?? byGroup.set(g, []).get(g)).push({ ids, text: ids.map((id) => sectionText.get(id).text).join('\n') });
  }

  const files = new Map();
  files.set(jobsFile(jobs), jobsText);
  // A group too big for one package file goes into numbered parts (recipes-line.md, recipes-line-2.md, ...),
  // filled in catalog order; each record names the part that holds its section.
  const groups = GROUP_ORDER.filter((g) => byGroup.has(g));
  const recipeDocs = [];
  const docOf = new Map();
  for (const g of groups) {
    const label = g === 'build-aid' ? AID_LABEL : jobs.groups?.[g] ?? g;
    const intro = g === 'build-aid'
      ? 'Recipes that help a build but serve no beat, and recipes that fit no job yet. A beat query never returns them; read one by id with ae_arsenal get.'
      : 'Recipes whose primary job is in this group. Find candidates for a beat with ae_arsenal find; read one with ae_arsenal get, or a section here by its heading.';
    const head = (k) => `# Arsenal recipes: ${label}${k > 1 ? ` (part ${k})` : ''}\n\nGenerated from the recipe drafts; do not edit by hand. ${intro}\n\n`;
    const parts = [[]];
    for (const chunk of byGroup.get(g)) {
      const cur = parts[parts.length - 1];
      const grown = head(parts.length) + [...cur, chunk].map((c) => c.text).join('\n');
      if (cur.length && Buffer.byteLength(grown) > fileLimit) parts.push([chunk]);
      else cur.push(chunk);
    }
    const title = `Arsenal recipes: ${g === 'build-aid' ? AID_LABEL.toLowerCase() : (jobs.groups?.[g] ?? g).toLowerCase()}`;
    parts.forEach((chunks, i) => {
      const k = i + 1;
      const file = k === 1 ? recipeFile(g) : `recipes-${g}-${k}.md`;
      const id = k === 1 ? docId(g) : `${docId(g)}-${k}`;
      files.set(file, head(k) + chunks.map((c) => c.text).join('\n'));
      recipeDocs.push({ id, title: parts.length > 1 ? `${title} (part ${k} of ${parts.length})` : title, path: `arsenal/${file}`, kind: 'recipes' });
      for (const c of chunks) for (const rid of c.ids) docOf.set(rid, id);
    });
  }
  for (const rec of records) rec.section.document = docOf.get(rec.id);
  const styleRecords = styles.map((s) => {
    const sid = `${STYLE_PREFIX}${s.id}`;
    let still = null;
    if (levels.styles[s.id].still && stills[sid]) {
      still = { path: `arsenal/stills/${sid}.jpg`, sha256: sha(stills[sid]) };
      shippedStills[sid] = stills[sid];
    }
    if (styleDocs[s.id] === undefined) throw new Error(`refused: no STYLE.md text for style ${s.id}`);
    const look = styleBlocks.find((x) => x.block.role === 'look' && x.block.borrowed_from === `${STYLE_PREFIX}${s.id}`);
    return styleEntry(s, levels.styles[s.id], styleDocs[s.id], still, look?.id ?? null);
  });
  const pieceRecords = pieces.map((x) => {
    const pid = `${PIECE_PREFIX}${x.name}`;
    let still = null;
    if (stills[pid]) { still = { path: `arsenal/stills/${pid}.jpg`, sha256: sha(stills[pid]) }; shippedStills[pid] = stills[pid]; }
    return pieceEntry(x, still);
  });
  // The house and example styles, house first. Their proof scene's pieces are what they were proven with.
  const proofPieces = stylesProof ? requiresOf(stylesProof).filter((n) => pieces.some((x) => x.name === n)).map((n) => `${PIECE_PREFIX}${n}`) : [];
  const blockRecords = styleBlocks.filter((x) => x.block.role !== 'look')
    .sort((a, b) => (a.block.default ? 0 : 1) - (b.block.default ? 0 : 1) || a.id.localeCompare(b.id))
    .map((x) => {
      const sid = `${STYLE_PREFIX}${x.id}`;
      let still = null;
      if (stills[sid]) { still = { path: `arsenal/stills/${sid}.jpg`, sha256: sha(stills[sid]) }; shippedStills[sid] = stills[sid]; }
      return styleBlockEntry(x, still, proofPieces);
    });
  // Pieces first: when a piece and a written recipe fit, the piece is what to build with. Then the house style.
  const entries = [...pieceRecords, ...records, ...blockRecords, ...styleRecords];
  for (const e of entries) if (!e.still && !e.no_still) throw new Error(`refused: ${e.id} has no still and no reason for it`);
  // The catalog version: the recipes' as before when there are no styles, else over every entry.
  const version = styleRecords.length ? sha8(entries.map((e) => `${e.id}@${e.revision}`).sort().join('\n')) : catalog.version;
  files.set('catalog.json', `${JSON.stringify({ vocab: catalog.vocab, version, jobs: catalog.jobs, levels: LEVELS, provides: levels?.provides ?? {}, entries }, null, 1)}\n`);
  const documents = [
    { id: 'arsenal-index', title: 'Technique arsenal index: documents, vocabulary and counts', path: 'arsenal/index.json', kind: 'catalog' },
    { id: 'arsenal-catalog', title: 'Library catalog: one record per style, world, recipe and piece, queried by ae_arsenal', path: 'arsenal/catalog.json', kind: 'catalog' },
    { id: 'arsenal-jobs', title: `Job vocabulary ${catalog.vocab}: the jobs a beat asks for`, path: `arsenal/${jobsFile(jobs)}`, kind: 'catalog' },
    ...recipeDocs,
    ...(pieces.length ? [{ id: 'pieces-core-jsx', title: 'Pieces: the shared helpers every piece uses (PCS core)', path: 'pieces/pcs-core.jsx', kind: 'code' }] : []),
    ...styleBlocks.map((x) => ({ id: `pieces-style-${x.id}`, title: `Style block: ${x.block.title} (PCS.use('${x.id}'))`, path: `pieces/styles/${x.file}`, kind: 'style' })),
    ...(stylesProof ? [{ id: 'pieces-styles-proof', title: 'Proof scene for a style: the same pieces under any style', path: 'pieces/proof/styles.jsx', kind: 'code' }] : []),
    ...pieces.flatMap((x) => [
      { id: `${PIECE_PREFIX}${x.name}`, title: `Piece: ${x.header.name}`, path: `pieces/${x.file}`, kind: 'code' },
      { id: `${PIECE_PREFIX}${x.name}-proof`, title: `Proof scene for the ${x.header.name} piece`, path: `pieces/proof/${x.file}`, kind: 'code' },
    ]),
  ];
  const index = {
    arsenal: 'The library at three levels: styles (a look a section can borrow: colour, type, light, material), worlds (a set a section lives in) and recipes (one technique for one beat). Among the recipes, pieces are runnable code: one file each, called by name. Every entry has a still and says what it provides. Look at a level as pictures with ae_arsenal browse; ask per beat by job, by what an entry provides, or in plain words, with find (pieces come first); read any entry with get (a piece answers with its call); list the jobs and the provides vocabulary with jobs.',
    tool: 'ae_arsenal', vocab: catalog.vocab, version, documents,
    counts: {
      recipes: records.length, proven: records.filter((r) => r.status === 'proven').length, stills: Object.keys(shippedStills).length,
      ...(pieceRecords.length ? { pieces: pieceRecords.length } : {}),
      ...(styleBlocks.length ? { style_blocks: styleBlocks.length } : {}),
      ...(styleRecords.length ? Object.fromEntries(LEVELS.map((l) => [`${l}s`, entries.filter((e) => e.level === l || e.also_level?.includes(l)).length])) : {}),
    },
  };
  files.set('index.json', `${JSON.stringify(index, null, 1)}\n`);

  const problems = [];
  for (const [f, text] of files) {
    const bytes = Buffer.byteLength(text);
    if (bytes > fileLimit) problems.push(`${f} is ${bytes} bytes, over the ${fileLimit}-byte package file limit`);
    for (const [kind, names] of [['a creator', creators], ['a private name', PRIVATE_NAMES]]) {
      for (const c of names) {
        if (c && new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) problems.push(`${f} names ${kind}: ${c}`);
      }
    }
  }
  if (files.size > TEXT_FILES_MAX) problems.push(`${files.size} text files, over the arsenal's ${TEXT_FILES_MAX}`);
  if (problems.length) throw new Error(`refused: ${problems.join('; ')}`);
  return { files, stills: shippedStills, wanted: wantedStills(catalog), index };
}

/** Writes the arsenal into outDir, which it owns: makes missing stills, keeps existing ones, removes what is stale. */
export function writeArsenal({ catalog, jobs, examples, draftsDir, outDir, rendersRoot, makeStill = ffmpegStill, creators = [],
  levels = null, styles = [], styleDocs = {}, styleProofs = null, makeStyleStill = ffmpegStyleStill, pieces = [], styleBlocks = [], stylesProof = null }) {
  const stillsDir = path.join(outDir, 'stills');
  fs.mkdirSync(stillsDir, { recursive: true });
  const stills = {};
  const missing = [];
  for (const [id, from] of Object.entries(wantedStills(catalog))) {
    const to = path.join(stillsDir, `${id}.jpg`);
    if (!fs.existsSync(to)) {
      if (!rendersRoot) { missing.push(id); continue; }
      try { makeStill(path.resolve(rendersRoot, from), to); } catch { missing.push(id); continue; }
    }
    stills[id] = fs.readFileSync(to);
  }
  // A piece's still: its proof render, quality/renders/pieces/<name>.png under the renders root.
  for (const x of pieces) {
    const pid = `${PIECE_PREFIX}${x.name}`;
    const to = path.join(stillsDir, `${pid}.jpg`);
    if (!fs.existsSync(to)) {
      if (!rendersRoot) { missing.push(pid); continue; }
      try { makeStill(path.join(rendersRoot, 'quality', 'renders', 'pieces', `${x.name}.png`), to); } catch { missing.push(pid); continue; }
    }
    stills[pid] = fs.readFileSync(to);
  }
  // A house or example style's still: the style proof scene, quality/renders/pieces/styles/<id>.png under the renders root.
  for (const x of styleBlocks.filter((y) => y.block.role !== 'look')) {
    const sid = `${STYLE_PREFIX}${x.id}`;
    const to = path.join(stillsDir, `${sid}.jpg`);
    if (!fs.existsSync(to)) {
      if (!rendersRoot) { missing.push(sid); continue; }
      try { makeStill(path.join(rendersRoot, 'quality', 'renders', 'pieces', 'styles', `${x.id}.png`), to); } catch { missing.push(sid); continue; }
    }
    stills[sid] = fs.readFileSync(to);
  }
  // A style's still: one frame of its proof movie (<styleProofs>/<id>/proof/proof.mp4) at the beat levels.json names.
  for (const st of styles) {
    const l = levels?.styles?.[st.id];
    if (!l?.still) continue;
    const sid = `${STYLE_PREFIX}${st.id}`;
    const to = path.join(stillsDir, `${sid}.jpg`);
    if (!fs.existsSync(to)) {
      if (!styleProofs) { missing.push(sid); continue; }
      try {
        const card = JSON.parse(fs.readFileSync(path.join(styleProofs, st.id, 'proof', 'card.json'), 'utf8'));
        makeStyleStill(path.join(styleProofs, st.id, 'proof', 'proof.mp4'), styleStillTime(card, l.still.beat, levels.beats), to);
      } catch { missing.push(sid); continue; }
    }
    stills[sid] = fs.readFileSync(to);
  }
  const built = buildArsenal({ catalog, jobs, examples, draftsDir, stills, creators, levels, styles, styleDocs, pieces, styleBlocks, stylesProof });
  for (const f of fs.readdirSync(stillsDir)) if (!built.stills[f.replace(/\.jpg$/, '')]) fs.rmSync(path.join(stillsDir, f));
  for (const f of fs.readdirSync(outDir)) if (f !== 'stills' && !built.files.has(f)) fs.rmSync(path.join(outDir, f), { recursive: true });
  for (const [f, text] of built.files) fs.writeFileSync(path.join(outDir, f), text);
  if (!Object.keys(built.stills).length) fs.rmSync(stillsDir, { recursive: true });
  return { ...built, missing };
}

/** A small JPEG of our own proof render, STILL_WIDTH wide. */
function ffmpegStill(from, to) {
  if (!fs.existsSync(from)) throw new Error(`no render at ${from}`);
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', from, '-vf', `scale=${STILL_WIDTH}:-2:flags=lanczos`, '-q:v', '4', to], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${from}: ${r.stderr}`);
}

/** One frame of a style's proof movie at `time` seconds, as a small JPEG STILL_WIDTH wide. */
function ffmpegStyleStill(from, time, to) {
  if (!fs.existsSync(from)) throw new Error(`no proof movie at ${from}`);
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(time), '-i', from, '-frames:v', '1', '-vf', `scale=${STILL_WIDTH}:-2:flags=lanczos`, '-q:v', '4', to], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${from}: ${r.stderr}`);
}

/** The visual styles the catalog lists, with each STYLE.md's text: from plugin/library/styles (index.json and folders). */
export function readStyles(stylesDir) {
  const index = JSON.parse(fs.readFileSync(path.join(stylesDir, 'index.json'), 'utf8'));
  const docs = Object.fromEntries(index.styles.map((st) => [st.id, fs.readFileSync(path.join(stylesDir, st.id, 'STYLE.md'), 'utf8')]));
  return { styles: index.styles, styleDocs: docs };
}

// ---------- the README gallery ----------

/** The README block that shows every shipped still (paths relative to the package root). */
export function galleryBlock(catalog) {
  const all = catalog.entries ?? [];
  const shown = all.filter((r) => r.still && r.kind !== 'style');
  const styled = all.filter((r) => r.still && r.kind === 'style');
  if (!shown.length && !styled.length) return 'No proven technique has a still yet.';
  return [
    ...(styled.length ? [
      'Styles and worlds in the library: the visual styles, each a frame of its own proof build. ae_arsenal browse shows them by level.',
      '',
      ...styled.map((r) => `![${r.name} (${[r.level, ...(r.also_level ?? [])].join(' and ')})](library/${r.still.path})`),
      '',
    ] : []),
    'Proven techniques in the arsenal, each a still of our own proof build. The ae_arsenal tool returns them with its shortlist.',
    '',
    ...shown.map((r) => {
      const n = r.variants?.length ?? 0;
      return `![${r.name}${n ? ` (${n} variant${n === 1 ? '' : 's'})` : ''}](library/${r.still.path})`;
    }),
  ].join('\n');
}

export function withGallery(readme, block) {
  const a = readme.indexOf(START);
  const b = readme.indexOf(END);
  if (a < 0 || b < a) throw new Error(`refused: the README has no ${START} ... ${END} block`);
  return `${readme.slice(0, a + START.length)}\n${block}\n${readme.slice(b)}`;
}

/** Channel names from the credits table: the names no shipped file may contain. */
export function creatorsOf(credits) {
  const names = [];
  for (const line of credits.split('\n')) {
    const cells = line.split(/(?<!\\)\|/).map((c) => c.trim()); // a cell may hold an escaped pipe, \|
    const m = cells[2]?.match(/^\[([^\]]+)\]\(/);
    const name = m?.[1].replace(/\\\|/g, '|');
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

// ---------- CLI ----------

function arg(argv, name, fallback) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; }

function vendoredJobs(outDir) {
  const found = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter((f) => /^jobs-v[\d.]+\.json$/.test(f)) : [];
  if (found.length !== 1) throw Object.assign(new Error(`pass --jobs <Content's jobs.json>: ${outDir} holds ${found.length} vendored jobs files`), { usage: true });
  return path.join(outDir, found[0]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  try {
    const drafts = arg(argv, '--drafts', path.join(ROOT, 'product', 'arsenal-drafts'));
    const out = arg(argv, '--out', path.join(ROOT, 'plugin', 'library', 'arsenal'));
    const jobsPath = arg(argv, '--jobs') ?? vendoredJobs(out);
    const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
    const examples = JSON.parse(fs.readFileSync(arg(argv, '--examples', EXAMPLES_FILE), 'utf8'));
    const tags = JSON.parse(fs.readFileSync(arg(argv, '--tags', path.join(drafts, 'tags.json')), 'utf8'));
    const proofs = JSON.parse(fs.readFileSync(arg(argv, '--proofs', path.join(drafts, 'proof-stills.json')), 'utf8'));
    const creators = creatorsOf(fs.readFileSync(arg(argv, '--credits', path.join(drafts, 'CREDITS.md')), 'utf8'));
    const catalog = buildCatalog({ draftsDir: drafts, tags, jobs, proofs });
    // The merge step matches new recipes against this file; rewritten here so it never falls behind the drafts (lesson 43).
    fs.writeFileSync(path.join(drafts, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`);
    const levelsPath = arg(argv, '--levels', path.join(drafts, 'levels.json'));
    const levels = fs.existsSync(levelsPath) ? JSON.parse(fs.readFileSync(levelsPath, 'utf8')) : null;
    const stylesDir = arg(argv, '--styles', path.join(ROOT, 'plugin', 'library', 'styles'));
    const { styles, styleDocs } = levels && fs.existsSync(path.join(stylesDir, 'index.json')) ? readStyles(stylesDir) : { styles: [], styleDocs: {} };
    const piecesDir = arg(argv, '--pieces', path.join(ROOT, 'plugin', 'library', 'pieces'));
    const pieces = levels ? readPieces(piecesDir) : [];
    const styleBlocks = levels ? readStyleBlocks(piecesDir) : [];
    const stylesProofFile = path.join(piecesDir, 'proof', 'styles.jsx');
    const stylesProof = levels && fs.existsSync(stylesProofFile) ? fs.readFileSync(stylesProofFile, 'utf8') : null;
    fs.mkdirSync(out, { recursive: true });
    const res = writeArsenal({ catalog, jobs, examples, draftsDir: drafts, outDir: out, rendersRoot: arg(argv, '--renders', ROOT), creators,
      levels, styles, styleDocs, styleProofs: arg(argv, '--style-proofs', null), pieces, styleBlocks, stylesProof });
    const readme = arg(argv, '--readme', path.join(ROOT, 'claude', 'src', 'README.md'));
    fs.writeFileSync(readme, withGallery(fs.readFileSync(readme, 'utf8'), galleryBlock(JSON.parse(res.files.get('catalog.json')))));
    if (!argv.includes('--no-manifest')) {
      const m = spawnSync(process.execPath, [path.join(ROOT, 'plugin', 'scripts', 'manifest.mjs')], { encoding: 'utf8' });
      if (m.status !== 0) throw new Error(`manifest: ${m.stderr}`);
    }
    console.log(JSON.stringify({ vocab: catalog.vocab, version: res.index.version, recipes: catalog.recipes.length, styles: styles.length, pieces: pieces.length, style_blocks: styleBlocks.length, stills: Object.keys(res.stills).length, missing: res.missing, out }));
    if (res.missing.length) console.error(`no still for ${res.missing.join(', ')}: no proof render found; pass --renders <folder holding quality/renders>, or --style-proofs <folder of style packages with proof/proof.mp4> for a style`);
  } catch (e) { console.error(e.message); process.exit(e.usage ? 2 : 1); }
}
