import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('../library/', import.meta.url);
const docs = [
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
 ['scene-recipes','Seven explanatory scene recipes','recipes/recipes.md','recipes'],
 ['joeb-preset','Optional JoeB paper navy vermilion preset','presets/joeb.md','preset'],
 ['motion-jsx','Portable brand-neutral motion helpers','scripts/motion.jsx','code'],
 ['house-jsx','JoeB rig helpers; requires configured rig and media','presets/house.jsx','code'],
 ['joeb-motion-jsx','JoeB motion helpers; load after house-jsx','presets/motion.jsx','code'],
];
const manifest = {version:1, documents:docs.map(([id,title,path,kind]) => ({id,title,path,kind,sha256:createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex')}))};
writeFileSync(new URL('manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log(`Indexed ${docs.length} documents in ${fileURLToPath(root)}`);
