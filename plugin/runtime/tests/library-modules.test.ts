import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateCatalog, findModules } from '../src/tools/library-modules.js';
import { readLibrary } from '../src/tools/library.js';
const refs = {documentIds:new Set(['core','type']),provenanceIds:new Set(['original'])};
const module = (id='foundation') => ({id,kind:'foundation',title:'Motion foundation',summary:'Construct a clear visual argument',tags:['clarity'],whenToUse:['Every scene'],whenNotToUse:[],entryDocument:'core',requires:[],documents:['core'],compatibleWith:[],inputs:[{name:'message',required:true,default:null,constraints:'One primary message'}],assetRequirements:[],fontRequirements:[],fallbacks:[],examples:[],reviewChecks:['Read order'],provenanceRefs:['original'],evidence:{technical:'not-tested',visual:'not-reviewed',reports:[]}});
const catalog = () => ({schemaVersion:1,modules:[module()]});
describe('module contract',()=>{
 it('accepts portable metadata and searches trimmed case-insensitive tags',()=>{
  const c=validateCatalog(catalog(),refs);expect(findModules(c,' CLARITY ').map(m=>m.id)).toEqual(['foundation']);expect(findModules(c,'  ')).toHaveLength(1);expect(findModules(c,'absent')).toEqual([]);
 });
 it.each([
 ['kind','bad'],['title',''],['summary',4],['tags','bad'],['entryDocument','absent'],['documents',['absent']],['requires',['absent']],['compatibleWith',['absent']],['provenanceRefs',['absent']],['examples',['absent']],['inputs',[{name:'x',required:'yes',default:null,constraints:'x'}]],['evidence',{technical:'passed',visual:'not-reviewed',reports:[]}],['evidence',{technical:'passed',visual:'accepted',reports:['/tmp/private/report.md']}],['evidence',{technical:'passed',visual:'accepted',reports:['../report.md']}],['evidence',{technical:'passed',visual:'accepted',reports:['http://example.com/report']}],['evidence',{technical:'unknown',visual:'not-reviewed',reports:[]}]
 ])('rejects invalid %s and identifies module/field',(field,value)=>{
  const c=catalog();Object.assign(c.modules[0],{[field]:value});expect(()=>validateCatalog(c,refs)).toThrow(new RegExp(`foundation.*${field}`));
 });
 it('rejects duplicate IDs, self dependencies and cycles',()=>{
  const c=catalog();c.modules.push(module());expect(()=>validateCatalog(c,refs)).toThrow(/duplicate/i);
  const self=catalog();Object.assign(self.modules[0],{requires:['foundation']});expect(()=>validateCatalog(self,refs)).toThrow(/cycle|self/i);
  const cycle={schemaVersion:1,modules:[{...module(),requires:['typography']},{...module('typography'),requires:['foundation']}]};expect(()=>validateCatalog(cycle,refs)).toThrow(/cycle/i);
 });
 it('rejects bad root schema and accepts evidence with portable report paths',()=>{
  expect(()=>validateCatalog({schemaVersion:2,modules:[]},refs)).toThrow(/schemaVersion/);
  const c=catalog();Object.assign(c.modules[0].evidence,{technical:'passed',reports:['quality/reports/run/report.md','https://example.com/report']});expect(validateCatalog(c,refs).modules).toHaveLength(1);
 });
});
const roots:string[]=[];
afterEach(()=>{for(const r of roots.splice(0))rmSync(r,{recursive:true,force:true});});
function fixture(advertise=true){
 const root=mkdtempSync(path.join(os.tmpdir(),'aes-modules-'));roots.push(root);
 const docs=[{id:'core',title:'Core',kind:'foundation',path:'core.md',content:'core content'},{id:'type',title:'Typography',kind:'technique',path:'type.md',content:'type content'}];
 if(advertise)docs.push({id:'module-catalog',title:'Modules',kind:'catalog',path:'modules.json',content:JSON.stringify(catalog())});
 writeFileSync(path.join(root,'source-map.json'),JSON.stringify({sources:[{id:'original'}]}));
 const entries=docs.map(({content,...d})=>{writeFileSync(path.join(root,d.path),content);return {...d,sha256:createHash('sha256').update(content).digest('hex')};});
 const save=()=>writeFileSync(path.join(root,'manifest.json'),JSON.stringify({documents:entries}));save();return {root,entries,save};
}
describe('library discovery and trust boundaries',()=>{
 it('keeps legacy index and direct reads, adds compact union discovery',()=>{
  const legacy=fixture(false);expect(readLibrary(undefined,undefined,legacy.root).modules).toEqual([]);
  const f=fixture();const result=readLibrary(undefined,' CLARITY ',f.root);expect(result.modules?.map(m=>m.id)).toEqual(['foundation']);expect(result.documents?.map(d=>d.id)).toEqual(['core']);expect(result.modules?.[0]).not.toHaveProperty('inputs');
  expect(readLibrary(undefined,' ',f.root).documents).toHaveLength(3);
  expect(readLibrary(undefined,'core',f.root).documents?.map(d=>d.id)).toEqual(['core']);
  expect(readLibrary('core',undefined,f.root)).toEqual({document:'core',title:'Core',kind:'foundation',content:'core content'});
 });
 it('fails advertised missing/tampered/malformed catalogs but ordinary reads still work',()=>{
  const f=fixture();writeFileSync(path.join(f.root,'modules.json'),'bad');expect(()=>readLibrary(undefined,undefined,f.root)).toThrow(/hash/i);
  expect(readLibrary('core',undefined,f.root).content).toBe('core content');
  f.entries[2].sha256=createHash('sha256').update('bad').digest('hex');f.save();expect(()=>readLibrary(undefined,undefined,f.root)).toThrow(/catalog/i);
  rmSync(path.join(f.root,'modules.json'));expect(()=>readLibrary(undefined,undefined,f.root)).toThrow(/catalog/i);
 });
 it('rejects catalog traversal and symlink escapes before returning data',()=>{
  const f=fixture();const outside=fixture();f.entries[2].path='../modules.json';f.save();expect(()=>readLibrary(undefined,undefined,f.root)).toThrow(/escape/i);
  f.entries[2].path='modules.json';f.save();rmSync(path.join(f.root,'modules.json'));symlinkSync(path.join(outside.root,'modules.json'),path.join(f.root,'modules.json'));expect(()=>readLibrary(undefined,undefined,f.root)).toThrow(/escape/i);
 });
 it('rejects source-map symlink escape',()=>{
  const f=fixture();const outside=fixture();rmSync(path.join(f.root,'source-map.json'));symlinkSync(path.join(outside.root,'source-map.json'),path.join(f.root,'source-map.json'));expect(()=>readLibrary(undefined,undefined,f.root)).toThrow(/escape/i);
 });
});

describe('portable validator command',()=>{
 const cli=fileURLToPath(new URL('../../tests/library-modules.mjs',import.meta.url));
 function packageFixture(){const f=fixture();const pkg=mkdtempSync(path.join(os.tmpdir(),'aes-package-'));roots.push(pkg);cpSync(f.root,path.join(pkg,'library'),{recursive:true});return pkg;}
 function run(pkg:string,extra:string[]=[]){return spawnSync(process.execPath,[cli,'--plugin-root',pkg,...extra],{encoding:'utf8'});}
 it('validates copied package data without dependencies or repository reports',()=>{const p=packageFixture();expect(run(p).status).toBe(0);});
 it('rejects corrupt hashes, traversal and outside-root links',()=>{
  const p=packageFixture();writeFileSync(path.join(p,'library/core.md'),'tampered');expect(run(p).status).not.toBe(0);
  const p2=packageFixture();const mpath=path.join(p2,'library/manifest.json');const m=JSON.parse(readFileSync(mpath,'utf8'));m.documents[0].path='../../escape';writeFileSync(mpath,JSON.stringify(m));expect(run(p2).stderr).toMatch(/escape/i);
  const p3=packageFixture();rmSync(path.join(p3,'library/core.md'));symlinkSync(path.join(p2,'library/core.md'),path.join(p3,'library/core.md'));expect(run(p3).stderr).toMatch(/escape/i);
 });
 it('checks local evidence only in explicit repository mode, including symlink escape',()=>{
  const p=packageFixture(),lib=path.join(p,'library');const c=catalog();Object.assign(c.modules[0].evidence,{technical:'passed',reports:['quality/reports/example/report.md']});const content=JSON.stringify(c);writeFileSync(path.join(lib,'modules.json'),content);
  const mp=path.join(lib,'manifest.json');const m=JSON.parse(readFileSync(mp,'utf8'));m.documents[2].sha256=createHash('sha256').update(content).digest('hex');writeFileSync(mp,JSON.stringify(m));
  expect(run(p).status).toBe(0);expect(run(p,['--repository-root',p]).status).not.toBe(0);
  mkdirSync(path.join(p,'quality/reports/example'),{recursive:true});writeFileSync(path.join(p,'quality/reports/example/report.md'),'review');expect(run(p,['--repository-root',p]).status).toBe(0);
  rmSync(path.join(p,'quality/reports/example/report.md'));const outside=fixture();symlinkSync(path.join(outside.root,'core.md'),path.join(p,'quality/reports/example/report.md'));expect(run(p,['--repository-root',p]).stderr).toMatch(/escape/i);
 });
});
