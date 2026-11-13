import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('../library/', import.meta.url);
const docs = [
 ['typography-examples','Portable typography worked examples','examples/typography.md','examples'],
 ['typography-recipes','Editable typography entrance and replacement recipes','recipes/typography.md','recipes'],
 ['typography-jsx','Portable typography measurement and fitting','scripts/typography.jsx','code'],
 ['typography-technique','Typography native scope and fitting contract','techniques/typography.md','technique'],
 ['paper-collage-recipes','Native paper and cutout material recipe','recipes/paper-collage.md','recipes'],
 ['paper-collage-jsx','Native paper and deterministic cutout helpers','scripts/paper-collage.jsx','code'],
 ['paper-collage-style','Portable paper collage material and motion profile','styles/paper-collage.md','style'],
 ['paper-collage-examples','Worked native paper collage examples','examples/paper-collage.md','examples'],
 ['module-catalog','Validated motion modules','modules.json','catalog'],
 ['module-template','Motion module authoring contract','templates/module.md','template'],
 ['motion-language','The core motion language for every style','language/core.md','foundation'],
 ['production-workflow','Portable cold-start production workflow','language/production-workflow.md','foundation'],
 ['construction','Detailed construction timing and gesture grammar','language/construction.md','technique'],
 ['camera-continuity','Camera depth and continuous transitions','language/camera-continuity.md','technique'],
 ['assets-depth','Motion-ready art material quality and occlusion','language/assets-depth.md','technique'],
 ['type-evidence','Typography narration and authentic evidence','language/type-evidence.md','technique'],
 ['reference-study','Measure and transfer a reference mechanism','language/reference-study.md','technique'],
 ['failure-atlas','Production failures causes and corrections','language/failure-atlas.md','review'],
 ['worked-scenes','Three detailed source-derived scene studies','examples/worked-scenes.md','examples'],
 ['brief-template','Portable scene and production brief','templates/brief.md','template'],
 ['design','Design before motion','references/design.md','guidance'],
 ['timing','Timing and motion vocabulary','references/timing.md','guidance'],
 ['scripting','Native AE scripting and build pitfalls','references/scripting.md','guidance'],
 ['quality','Visual review and delivery checks','references/quality.md','guidance'],
 ['review','Review by someone who did not build the piece','references/review.md','guidance'],
 ['keying','Keying, compositing and sitting an element in its scene','references/keying.md','guidance'],
 ['page-recording','Page recording: a web page as a smooth 30 fps clip','techniques/page-recording.md','technique'],
 ['word-timing','Word timing: a stressed word\'s first frame from the voice','techniques/word-timing.md','technique'],
 ['phone-clip-cards','Phone clip cards: screen recordings into clean video cards','techniques/phone-clip-cards.md','technique'],
 ['unattended-runs','Unattended runs: planning overnight and long After Effects work','techniques/unattended-runs.md','technique'],
 ['page-recorder-mjs','Page recorder command-line script (Node, Playwright, ffmpeg)','scripts/capture/record-page.mjs','code'],
 ['page-recorder-config','Page recorder example config, desktop','scripts/capture/record-page.example.json','examples'],
 ['page-recorder-config-mobile','Page recorder example config, phone','scripts/capture/record-page.mobile.example.json','examples'],
 ['check-clip-py','Clip freeze and jump check with contact sheet (Python, ffmpeg)','scripts/capture/check-clip.py','code'],
 ['word-timing-py','Word timing script: level per frame, trim and transcribe (Python, ffmpeg)','scripts/capture/word-timing.py','code'],
 ['clip-card-py','Clip card script: crop, trim and slow a screen recording (Python, ffmpeg)','scripts/capture/clip-card.py','code'],
 ['scene-recipes','Seven explanatory scene recipes','recipes/recipes.md','recipes'],
 ['joeb-preset','Optional JoeB paper navy vermilion preset','presets/joeb.md','preset'],
 ['motion-jsx','Portable brand-neutral motion helpers','scripts/motion.jsx','code'],
 ['house-jsx','JoeB rig helpers; requires configured rig and media','presets/house.jsx','code'],
 ['joeb-motion-jsx','JoeB motion helpers; load after house-jsx','presets/motion.jsx','code'],
];
// The style library (CL-9): one index, the shared helpers, and each imported style's notes and module.
const styleIndex = JSON.parse(readFileSync(new URL('styles/index.json', root), 'utf8'));
docs.push(['style-index','Visual style library index: tiers, uses and needs','styles/index.json','catalog'],
 ['style-lib-jsx','Shared ES3 helpers for every style (AESLib)','styles/aes-lib.jsx','code']);
for (const s of styleIndex.styles) docs.push([`style-${s.id}`,`${s.title} style`,`styles/${s.id}/STYLE.md`,'style'],
 [`style-${s.id}-jsx`,`${s.title} helpers (${s.moduleGlobal})`,`styles/${s.id}/${s.module}`,'code']);
const manifest = {version:1, documents:docs.map(([id,title,path,kind]) => ({id,title,path,kind,sha256:createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex')}))};
writeFileSync(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(`Indexed ${docs.length} documents in ${fileURLToPath(root)}`);
