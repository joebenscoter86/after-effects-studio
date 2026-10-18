// Built-ins and the compiled pure validator only. Data always comes from --plugin-root.
import {readFileSync,realpathSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateCatalog} from '../runtime/dist/tools/library-modules.js';
function arg(name){const i=process.argv.indexOf(name);if(i<0)return undefined;const v=process.argv[i+1];if(!v||v.startsWith('--'))throw new Error(`Missing ${name} value`);return v;}
function inside(base,relative){
 const candidate=path.resolve(base,relative);
 const check=file=>{const rel=path.relative(base,file);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw new Error(`Path escapes root: ${relative}`);};
 check(candidate);const file=realpathSync(candidate);check(file);if(!statSync(file).isFile())throw new Error(`Expected file: ${relative}`);return file;
}
try{
 const plugin=arg('--plugin-root');if(!plugin)throw new Error('Usage: --plugin-root <path> [--repository-root <path>]');
 const base=realpathSync(path.join(plugin,'library'));
 const manifest=JSON.parse(readFileSync(inside(base,'manifest.json'),'utf8'));
 const documents=new Map();
 for(const entry of manifest.documents){
  if(documents.has(entry.id))throw new Error(`Duplicate document ${entry.id}`);
  const content=readFileSync(inside(base,entry.path),'utf8');
  if(createHash('sha256').update(content).digest('hex')!==entry.sha256)throw new Error(`Hash mismatch: ${entry.id}`);
  documents.set(entry.id,content);
 }
 if(!documents.has('module-catalog'))throw new Error('No advertised module-catalog to validate');
 const sources=JSON.parse(readFileSync(inside(base,'source-map.json'),'utf8')).sources;
 const catalog=validateCatalog(JSON.parse(documents.get('module-catalog')),{documentIds:new Set(documents.keys()),provenanceIds:new Set(sources.map(s=>s.id).filter(id=>typeof id==='string'))});
 const repository=arg('--repository-root');
 if(repository){const repo=realpathSync(repository);for(const m of catalog.modules)for(const report of m.evidence.reports)if(!report.startsWith('https://'))inside(repo,report);}
 console.log(JSON.stringify({ok:true,modules:catalog.modules.map(m=>m.id),documents:documents.size,repositoryEvidenceChecked:!!repository}));
}catch(e){console.error(e.message);process.exitCode=1;}
