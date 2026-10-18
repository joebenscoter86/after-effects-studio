// Uses only Node built-ins, including when testing a copied plugin cache.
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const pluginRootArg=process.argv.indexOf('--plugin-root');
const root=pluginRootArg>=0?pathToFileURL(process.argv[pluginRootArg+1].replace(/\/$/,'')+'/'):new URL('../',import.meta.url);
const scratch=process.argv.includes('--scratch');
const emptyProjectCheck=process.argv.includes('--empty-project-check');
const live=scratch||emptyProjectCheck||process.argv.includes('--live');
const outputArg=process.argv.indexOf('--output');
const output=outputArg>=0?process.argv[outputArg+1]:fileURLToPath(new URL('../verification/',import.meta.url));
mkdirSync(output,{recursive:true});
const config=JSON.parse(readFileSync(new URL('.mcp.json',root),'utf8')).mcpServers['after-effects-studio'];
assert(config,'Missing after-effects-studio MCP registration');
assert.equal(config.cwd,'.','MCP working directory must resolve to the installed plugin root');
assert(config.args.every(arg=>!arg.includes('${')),'MCP arguments contain an unresolved variable');
const child=spawn(config.command,config.args,{cwd:resolve(fileURLToPath(root),config.cwd),env:{...process.env,...config.env,AE_MCP_READONLY:scratch||emptyProjectCheck?'0':'1'},stdio:['pipe','pipe','pipe']});
let next=1,buffer='',stderr='';const pending=new Map();
child.stderr.on('data',d=>stderr+=d);
child.stdout.on('data',d=>{
 buffer+=d;let i;
 while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);if(!line.trim())continue;
  let r;try{r=JSON.parse(line);}catch(e){for(const v of pending.values())v.reject(e);continue;}
  const p=pending.get(r.id);if(p){clearTimeout(p.timer);pending.delete(r.id);r.error?p.reject(new Error(JSON.stringify(r.error))):p.resolve(r.result);}
 }
});
child.on('exit',code=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error(`Server exited ${code}: ${stderr}`));}pending.clear();});
function rpc(method,params={}){const id=next++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Uncertain completion: ${method} timed out. Inspect AE before retrying.`));},90000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
function unpack(r){if(r.isError)throw new Error(JSON.stringify(r));return r.structuredContent||JSON.parse(r.content.find(c=>c.type==='text').text);}
async function tool(name,args={}){return unpack(await rpc('tools/call',{name,arguments:args}));}
const report={checks:[],live,scratch};
let scratchId=null;
try{
 const init=await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'studio-smoke',version:'1.0.0'}});
 assert.equal(init.serverInfo.name,'after-effects-studio');
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const ts=await rpc('tools/list');assert(ts.tools.some(t=>t.name==='ae_library'));report.tools=ts.tools.map(t=>t.name);
 const lib=await tool('ae_library');assert.equal(lib.documents.length,29);assert.deepEqual(lib.startHere,["motion-language","production-workflow","brief-template"]);
 assert.deepEqual(lib.modules.map(m=>m.id),['foundation','typography','paper-collage']);
 for(const d of lib.documents){const doc=await tool('ae_library',{document:d.id});assert(doc.content.length>100);}
 const bad=await rpc('tools/call',{name:'ae_library',arguments:{document:'../../package.json'}});assert.equal(bad.isError,true);
 report.checks.push('MCP handshake, tool discovery, all 29 hashed library documents, three module routes, default craft routing and traversal rejection');
 const cat=await tool('ae_catalog');report.catalog=cat;report.checks.push('Offline policy-filtered operation catalog');
 if(live){
   const before=await tool('ae_context');
   const v=await tool('ae_version_info');
   const after=await tool('ae_context');
   report.host=v.result;report.before=before.result.project;report.afterVersion=after.result.project;
   assert.deepEqual(report.afterVersion,report.before,'ae_version_info changed the open project');
   report.checks.push('Live AE version and unchanged project context before/after inspection');
 }
 if(emptyProjectCheck){
   assert(report.before.file && report.before.dirty===false,'Empty-project check requires a clean saved project to restore');
   const restorePath=report.before.file;
   await tool('ae_do',{operation:'project.new',args:{save:false}});
   try{
     const emptyBefore=(await tool('ae_context')).result.project;
     assert.equal(emptyBefore.file,null);
     assert.equal(emptyBefore.numItems,0);
     assert.equal(emptyBefore.dirty,false);
     const emptyVersion=(await tool('ae_version_info')).result;
     const emptyAfter=(await tool('ae_context')).result.project;
     assert.deepEqual(emptyAfter,emptyBefore,'ae_version_info changed an empty project');
     assert.equal(emptyVersion.capabilities.saveFrameToPng,null);
     report.emptyBefore=emptyBefore;report.emptyAfter=emptyAfter;
     report.checks.push('Empty clean project stayed unchanged; unknown saveFrameToPng capability reported as null');
   }finally{
     const current=(await tool('ae_context')).result.project;
     if(current.file===null&&current.numItems===0&&current.dirty===false){
       await tool('ae_do',{operation:'project.open',args:{path:restorePath,save:false}});
       const restored=(await tool('ae_context')).result.project;
       assert.deepEqual(restored,report.before,'Restored project differs from preflight');
       report.restored=restored;
     }else{
       throw new Error('Empty project changed unexpectedly; original project was not reopened');
     }
   }
 }
 if(scratch){
   const name='AES_SMOKE_'+randomUUID().replaceAll('-','');
   const helper=readFileSync(new URL('library/scripts/motion.jsx',root),'utf8');
   const demo=readFileSync(new URL('examples/native-demo.jsx',root),'utf8');
   const build=await tool('ae_do',{operation:'eval.run',args:{code:`var DEMO_NAME=${JSON.stringify(name)};\n${helper}\n${demo}`}});
   // The operation result is nested once inside the ambient-context envelope.
   const body=build.result?.result??build.result;
   scratchId=body.compId;assert.equal(typeof scratchId,'number');report.created=body;
   const render=await tool('ae_render_frame',{compNameOrId:scratchId,times:[0.4,1,1.6,2.4,3.3,4.5],outPath:output+'/native-demo.png',contactSheet:{columns:3,thumbWidth:480},analyze:true,colorManaged:'off'});
   report.render=render.result;assert(render.result?.contactSheet?.writtenTo);
   report.checks.push('Created native shapes and text; applied spatial/scalar easing and spring expression; rendered six frames and contact sheet');
   await tool('ae_do',{operation:'eval.run',args:{code:`var item=AE.findItemById(${scratchId});if(!item||item.name!==${JSON.stringify(name)})throw new Error('Scratch identity mismatch');item.remove();return {removed:true};`}});
   scratchId=null;
   const after=await tool('ae_context');report.after=after.result.project;
   assert.equal(report.after.numItems,report.before.numItems);assert.equal(report.after.file,report.before.file);
   report.checks.push('Removed only owned scratch comp; original project path and item count retained; no save or project switch');
 }
 report.ok=true;
}catch(e){report.ok=false;report.error=String(e);report.scratchIdNeedingInspection=scratchId;process.exitCode=1;}
finally{
 writeFileSync(output+'/smoke-report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({ok:report.ok,checks:report.checks,error:report.error,report:output+'/smoke-report.json'},null,2));
 child.stdin.end();child.kill('SIGTERM');
}
