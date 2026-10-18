/** Pure catalog validation. File access belongs to the library reader. */
export type InputSpec = {name:string;required:boolean;default:string|null;constraints:string};
export type Evidence = {technical:'not-tested'|'passed'|'failed';visual:'not-reviewed'|'accepted'|'revision-needed';reports:string[]};
export type Module = {
 id:string;kind:'foundation'|'capability'|'style';title:string;summary:string;tags:string[];
 whenToUse:string[];whenNotToUse:string[];entryDocument:string;requires:string[];documents:string[];
 compatibleWith:string[];inputs:InputSpec[];assetRequirements:string[];fontRequirements:string[];
 fallbacks:string[];examples:string[];reviewChecks:string[];provenanceRefs:string[];evidence:Evidence;
};
export type Catalog = {schemaVersion:1;modules:Module[]};
export type Refs = {documentIds:Set<string>;provenanceIds:Set<string>};
type ObjectValue = Record<string,unknown>;
function object(value:unknown):value is ObjectValue {return !!value && typeof value==='object' && !Array.isArray(value);}
function fail(id:string,field:string,reason:string):never {throw new Error(`Module ${id}: ${field}: ${reason}`);}
function string(value:unknown,id:string,field:string):asserts value is string {
 if(typeof value!=='string'||!value.trim())fail(id,field,'expected nonempty string');
}
function strings(value:unknown,id:string,field:string):asserts value is string[] {
 if(!Array.isArray(value))fail(id,field,'expected string array');
 value.forEach(v=>string(v,id,field));
}
/** Only portable repository report paths or public HTTPS references are allowed. */
export function isReportReference(value:string):boolean {
 if(value.startsWith('https://')) {
  try {const u=new URL(value);return !u.username&&!u.password&&u.hostname.includes('.')&&!/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(u.hostname);}catch{return false;}
 }
 return /^quality\/reports\/[a-zA-Z0-9._/-]+$/.test(value)&&!value.split('/').some(p=>!p||p==='.'||p==='..');
}
export function validateCatalog(raw:unknown,refs:Refs):Catalog {
 if(!object(raw)||raw.schemaVersion!==1)fail('<catalog>','schemaVersion','expected 1');
 if(!Array.isArray(raw.modules))fail('<catalog>','modules','expected array');
 const ids=new Set<string>();
 for(const item of raw.modules){
  if(!object(item))fail('<unknown>','module','expected object');
  const id=typeof item.id==='string'?item.id:'<unknown>';
  for(const field of ['id','title','summary','entryDocument'])string(item[field],id,field);
  if(!/^[a-z][a-z0-9-]*$/.test(id))fail(id,'id','expected lowercase hyphenated ID');
  if(ids.has(id))fail(id,'id','duplicate ID');ids.add(id);
  if(typeof item.kind!=='string'||!['foundation','capability','style'].includes(String(item.kind)))fail(id,'kind','unknown enum');
  for(const field of ['tags','whenToUse','whenNotToUse','requires','documents','compatibleWith','assetRequirements','fontRequirements','fallbacks','examples','reviewChecks','provenanceRefs'])strings(item[field],id,field);
  if(!Array.isArray(item.inputs))fail(id,'inputs','expected array');
  for(const input of item.inputs){
   if(!object(input))fail(id,'inputs','expected object');
   string(input.name,id,'inputs.name');string(input.constraints,id,'inputs.constraints');
   if(typeof input.required!=='boolean')fail(id,'inputs.required','expected boolean');
   if(input.default!==null&&typeof input.default!=='string')fail(id,'inputs.default','expected string or null');
  }
  const e=item.evidence;
  if(!object(e))fail(id,'evidence','expected object');
  if(typeof e.technical!=='string'||!['not-tested','passed','failed'].includes(String(e.technical)))fail(id,'evidence.technical','unknown enum');
  if(typeof e.visual!=='string'||!['not-reviewed','accepted','revision-needed'].includes(String(e.visual)))fail(id,'evidence.visual','unknown enum');
  strings(e.reports,id,'evidence.reports');
  if((e.technical!=='not-tested'||e.visual!=='not-reviewed')&&!e.reports.length)fail(id,'evidence.reports','tested or reviewed status requires evidence');
  for(const report of e.reports)if(!isReportReference(report))fail(id,'evidence.reports','expected repository report path or public HTTPS URL');
 }
 const catalog=raw as unknown as Catalog;
 for(const m of catalog.modules){
  const check=(field:string,values:string[],valid:Set<string>)=>{for(const value of values)if(!valid.has(value))fail(m.id,field,`missing reference ${value}`);};
  check('entryDocument',[m.entryDocument],refs.documentIds);check('documents',m.documents,refs.documentIds);
  check('examples',m.examples,refs.documentIds);check('requires',m.requires,ids);check('compatibleWith',m.compatibleWith,ids);
  check('provenanceRefs',m.provenanceRefs,refs.provenanceIds);
 }
 const byId=new Map(catalog.modules.map(m=>[m.id,m]));const visiting=new Set<string>(),visited=new Set<string>();
 function visit(id:string){
  if(visiting.has(id))fail(id,'requires','dependency cycle');if(visited.has(id))return;
  visiting.add(id);for(const dep of byId.get(id)!.requires)visit(dep);visiting.delete(id);visited.add(id);
 }
 for(const id of ids)visit(id);
 return catalog;
}
export function findModules(catalog:Catalog,query?:string):Module[]{
 const q=query?.trim().toLowerCase();return catalog.modules.filter(m=>!q||[m.id,m.title,m.summary,...m.tags].some(v=>v.toLowerCase().includes(q)));
}
