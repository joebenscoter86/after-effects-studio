import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const bundle=path.resolve(process.argv[2]), label=process.argv[3];
if(!label||!/^[a-z0-9-]+$/.test(label))throw Error('unique label required');
const root=path.resolve('quality/renders/2026-11-02-project-open-preservation',label);
const reportPath=path.resolve('quality/reports/2026-11-02-project-open-preservation',label+'.json');
if(existsSync(root)||existsSync(reportPath))throw Error('refuse overwrite');mkdirSync(root,{recursive:true});
const child=spawn(process.execPath,[bundle+'/scripts/start.mjs'],{cwd:bundle,env:{...process.env,AE_MCP_READONLY:'0',AE_MCP_ENABLE_EVAL:'1'},stdio:['pipe','pipe','pipe']});
let n=1,buf='',stderr='';const pending=new Map(), events=[];
child.stderr.on('data',d=>stderr+=d);
child.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){const line=buf.slice(0,i);buf=buf.slice(i+1);let r;try{r=JSON.parse(line)}catch{continue}const p=pending.get(r.id);if(p){clearTimeout(p.timer);pending.delete(r.id);r.error?p.reject(Error(JSON.stringify(r.error))):p.resolve(r.result)}}});
function rpc(method,params={}){const id=n++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('timeout; inspect before retry'))},90000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n')})}
async function tool(name,args={},allowError=false){const raw=await rpc('tools/call',{name,arguments:args});const r=raw.structuredContent??JSON.parse(raw.content.find(c=>c.type==='text').text);events.push({at:new Date().toISOString(),tool:name,args,response:r});if(raw.isError&&!allowError)throw Error(JSON.stringify(r));return r}
const doOp=(operation,args={},allowError=false)=>tool('ae_do',{operation,args},allowError);
const ev=code=>doOp('eval.run',{code});
const hash=p=>existsSync(p)?{sha256:createHash('sha256').update(readFileSync(p)).digest('hex'),bytes:readFileSync(p).length}:null;
const report={label,bundle,bundleHash:hash(bundle+'/runtime/dist/index.js'),events,cases:[]};
async function snapshot(){return (await ev('var a=[];for(var i=1;i<=app.project.numItems;i++){a.push(app.project.item(i).name);}return {file:app.project.file?app.project.file.fsName:null,dirty:app.project.dirty,items:a,queue:app.project.renderQueue.numItems};')).result}
async function setup(name){await doOp('project.new',{save:false});await ev('app.project.items.addFolder("SAVED_MARKER"); return {ok:true};');const p=root+'/'+name+'.aep';await tool('ae_save_project',{path:p});copyFileSync(p,p+'.backup');return p}
try{
 await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'project-open-preservation-debug',version:'1'}});child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const ctx=await tool('ae_context');report.initialProject=ctx.result.project;
 if(ctx.result.project.numItems!==0)throw Error('expected empty owned project; no mutations dispatched');
 report.version=await tool('ae_version_info');report.catalog=await tool('ae_catalog',{category:'eval'});
 const same=await setup('same-file');await ev('app.project.item(1).name="UNSAVED_SAME";return {ok:true};');const c1={name:'same-file-discard',before:hash(same),nativeBefore:await snapshot()};c1.open=await doOp('project.open',{path:same,save:false});c1.after=hash(same);c1.nativeAfter=await snapshot();c1.preserved=c1.before.sha256===c1.after.sha256;report.cases.push(c1);console.log(JSON.stringify(c1));
 const target=await setup('target');const current=await setup('different-file');await ev('app.project.item(1).name="UNSAVED_DIFFERENT";return {ok:true};');const c2={name:'different-file-discard',before:hash(current),targetBefore:hash(target),nativeBefore:await snapshot()};c2.open=await doOp('project.open',{path:target});c2.after=hash(current);c2.targetAfter=hash(target);c2.nativeAfter=await snapshot();c2.preserved=c2.before.sha256===c2.after.sha256&&c2.targetBefore.sha256===c2.targetAfter.sha256;report.cases.push(c2);console.log(JSON.stringify(c2));
 const missing=await setup('missing-target');await ev('app.project.item(1).name="UNSAVED_MISSING";return {ok:true};');const c3={name:'missing-target-save-true',before:hash(missing),nativeBefore:await snapshot()};c3.open=await doOp('project.open',{path:root+'/does-not-exist.aep',save:true},true);c3.after=hash(missing);c3.nativeAfter=await snapshot();c3.preserved=c3.before.sha256===c3.after.sha256;report.cases.push(c3);console.log(JSON.stringify(c3));
 const explicit=await setup('explicit-save');await ev('app.project.item(1).name="REQUESTED_SAVE";return {ok:true};');const c4={name:'explicit-save-true',before:hash(explicit)};c4.open=await doOp('project.open',{path:target,save:true});c4.after=hash(explicit);c4.targetState=await snapshot();await doOp('project.open',{path:explicit,save:false});c4.savedState=await snapshot();c4.passed=c4.before.sha256!==c4.after.sha256&&c4.savedState.items[0]==='REQUESTED_SAVE';report.cases.push(c4);console.log(JSON.stringify(c4));
 await doOp('project.new',{save:false});await ev('app.project.items.addFolder("UNTITLED_WORK");return {ok:true};');const c5={name:'untitled-save-true',before:await snapshot()};c5.open=await doOp('project.open',{path:target,save:true},true);c5.after=await snapshot();c5.passed=c5.open.ok===false&&c5.after.file===null&&c5.after.items[0]==='UNTITLED_WORK';report.cases.push(c5);console.log(JSON.stringify(c5));
 await doOp('project.new',{save:false});await doOp('project.open',{path:target,save:false});const c6={name:'clean-same-file',before:hash(target)};c6.open=await doOp('project.open',{path:target,save:false});c6.after=hash(target);c6.state=await snapshot();c6.preserved=c6.before.sha256===c6.after.sha256;report.cases.push(c6);console.log(JSON.stringify(c6));
 await doOp('project.new',{save:false});report.finished=true;
}catch(e){report.error=String(e);console.log(JSON.stringify({error:report.error}));process.exitCode=1}
finally{report.stderr=stderr;writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');child.stdin.end();setTimeout(()=>child.kill(),500).unref()}
