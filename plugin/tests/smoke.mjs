// Uses only Node built-ins, including when testing a copied plugin cache.
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
const pluginRootArg=process.argv.indexOf('--plugin-root');
const root=pluginRootArg>=0?pathToFileURL(process.argv[pluginRootArg+1].replace(/\/$/,'')+'/'):new URL('../',import.meta.url);
const scratch=process.argv.includes('--scratch');
const emptyProjectCheck=process.argv.includes('--empty-project-check');
const live=scratch||emptyProjectCheck||process.argv.includes('--live');
const outputArg=process.argv.indexOf('--output');
const output=outputArg>=0?process.argv[outputArg+1]:fileURLToPath(new URL('../verification/',import.meta.url));
mkdirSync(output,{recursive:true});
const hostArg=process.argv.indexOf('--host');
const host=hostArg>=0?process.argv[hostArg+1]:'codex';
const cwdArg=process.argv.indexOf('--cwd');
// The server is named after the package: the Claude package's manifest name (comp-room), or after-effects-studio for Codex.
const serverName=host==='claude'?JSON.parse(readFileSync(new URL('.claude-plugin/plugin.json',root),'utf8')).name:'after-effects-studio';
const config=JSON.parse(readFileSync(new URL('.mcp.json',root),'utf8')).mcpServers[serverName];
assert(config,`Missing ${serverName} MCP registration`);
let launchCwd;
if(host==='claude'){
 // Claude Code substitutes the plugin root and starts the server from the user's working directory.
 assert.equal(config.cwd,undefined,'Claude MCP config must not set cwd');
 const pluginRoot=fileURLToPath(root).replace(/\/$/,'');
 const sub=v=>v.replaceAll('${CLAUDE_PLUGIN_ROOT}',pluginRoot);
 config.command=sub(config.command);config.args=config.args.map(sub);
 launchCwd=cwdArg>=0?process.argv[cwdArg+1]:tmpdir();
}else{
 assert.equal(config.cwd,'.','MCP working directory must resolve to the installed plugin root');
 launchCwd=resolve(fileURLToPath(root),config.cwd);
}
assert(config.args.every(arg=>!arg.includes('${')),'MCP arguments contain an unresolved variable');
const child=spawn(config.command,config.args,{cwd:launchCwd,env:{...process.env,...config.env,AE_MCP_READONLY:scratch||emptyProjectCheck?'0':'1'},stdio:['pipe','pipe','pipe']});
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
// A library document reply is text only: its first line carries the document's id, kind, size and sha256.
async function libText(args){const r=await rpc('tools/call',{name:'ae_library',arguments:args});if(r.isError)throw new Error(JSON.stringify(r));assert.equal(r.structuredContent,undefined);return r.content.find(c=>c.type==='text').text;}
const LIB_REPLY=40000;
// One block of a sections reply: "== <name> (<N> characters) ==" and then exactly N characters.
function block(t,name){const h=`\n== ${name} (`;const i=t.indexOf(h);if(i<0)return null;const m=t.slice(i+h.length).match(/^(\d+) characters\) ==\n/);if(!m)return null;const a=i+h.length+m[0].length;return t.slice(a,a+Number(m[1]));}
// The whole document, read the way a session must: whole when it fits, otherwise its opening and every section.
async function wholeDocument(id){
 const first=await libText({document:id});assert(first.length<=LIB_REPLY,`${id}: reply ${first.length}`);
 const lines=first.split('\n');
 if(!/^(OUTLINE ONLY|PART 1 OF)/.test(lines[1]??''))return{header:lines[0],text:first.slice(first.indexOf('\n\n')+2)};
 const get=async(names)=>{const t=await libText({document:id,section:names});assert(t.length<=LIB_REPLY,`${id}: ${names} reply ${t.length}`);assert.equal(t.split('\n')[0],lines[0]);return t;};
 if(lines[1].startsWith('PART 1 OF')){const n=Number(lines[1].match(/^PART 1 OF (\d+)/)[1]);let text=first.slice(first.indexOf('\n\n')+2);for(let k=2;k<=n;k++){const nm=`(whole) (part ${k} of ${n})`;text+=block(await get([nm]),nm);}return{header:lines[0],text};}
 // the outline: "  - <name> (<N> characters[; its own text in K parts])", nested by two spaces
 const rows=[];for(const l of lines){const m=l.match(/^( *)- (.+) \((\d+) characters(?:; its own text in (\d+) parts)?\)$/);if(m)rows.push({depth:m[1].length/2,name:m[2],parts:Number(m[4]??1)});}
 const opAt=first.lastIndexOf('\nOpening');let text='';
 const opHead=first.slice(opAt+1).split('\n')[0];const opBody=first.slice(opAt+1+opHead.length+1);
 const opParts=opHead.match(/part 1 of (\d+)/);text+=opBody;if(opParts)for(let k=2;k<=Number(opParts[1]);k++){const nm=`(opening) (part ${k} of ${opParts[1]})`;text+=block(await get([nm]),nm);}
 for(let i=0;i<rows.length;i++){
  const r=rows[i];const t=await get([r.name]);const whole=block(t,r.name);
  if(whole!==null){text+=whole;while(rows[i+1]&&rows[i+1].depth>r.depth)i++;continue;}
  if(r.parts>1){for(let k=1;k<=r.parts;k++){const nm=`${r.name} (part ${k} of ${r.parts})`;text+=block(await get([nm]),nm);}continue;}
  // too long, its own text in one piece: it follows the subsections' outline at the end of the reply
  const own=t.slice(t.indexOf('\n',t.indexOf(`== ${r.name} (`))+1).split('\n');let j=0;if(own[0]==='Subsections:'){j=1;while(/^ *- /.test(own[j]))j++;}
  text+=own.slice(j).join('\n');
 }
 return{header:lines[0],text};
}
const report={checks:[],live,scratch};
let scratchId=null;
try{
 const init=await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'studio-smoke',version:'1.0.0'}});
 assert.equal(init.serverInfo.name,serverName);
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const ts=await rpc('tools/list');assert(ts.tools.some(t=>t.name==='ae_library'));report.tools=ts.tools.map(t=>t.name);
 const libCount=JSON.parse(readFileSync(new URL('library/manifest.json',root),'utf8')).documents.length;   // the shipped manifest's count, so the check follows the library
 const lib=await tool('ae_library');assert.equal(lib.documents.length,libCount);assert.deepEqual(lib.startHere,["motion-language","production-workflow","brief-template"]);
 assert.deepEqual(lib.modules.map(m=>m.id),['foundation','typography','paper-collage','visual-styles']);
 const shipped=new Map(JSON.parse(readFileSync(new URL('library/manifest.json',root),'utf8')).documents.map(e=>[e.id,e]));let inParts=0;
 for(const d of lib.documents){const e=shipped.get(d.id);const {header,text}=await wholeDocument(d.id);
  assert(header.includes(`sha256 ${e.sha256}`),`${d.id}: header ${header}`);
  if(e.path.endsWith('.json')&&!header.includes(`, ${text.length} characters,`)){inParts++;continue;}  // JSON in parts is its values laid out again
  assert(header.includes(`, ${text.length} characters,`),`${d.id}: size`);
  assert.equal(createHash('sha256').update(text).digest('hex'),e.sha256,`${d.id}: rebuilt text`);assert(text.length>100);
  if(text.length+header.length+2>LIB_REPLY)inParts++;}
 const bad=await rpc('tools/call',{name:'ae_library',arguments:{document:'../../package.json'}});assert.equal(bad.isError,true);
 report.checks.push(`MCP handshake, tool discovery, all ${libCount} hashed library documents read whole (${inParts} of them through their sections), four module routes, default craft routing and traversal rejection`);
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
