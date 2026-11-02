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
 await doOp('project.new',{save:false});await ev('var c=app.project.items.addComp("QUEUE_PROBE",64,64,1,4/30,30);c.layers.addSolid([0.1,0.5,0.7],"PROBE",64,64,1,4/30);return {comp:c.id};');
 const aep=root+'/queue-project.aep';await tool('ae_save_project',{path:aep});copyFileSync(aep,aep+'.backup');const c1={name:'render-reopen-discard',before:hash(aep),beforeState:await snapshot()};
 await doOp('render.add_to_queue',{comp:'QUEUE_PROBE',outputPath:root+'/queue-probe.mov'});report.templates=await doOp('render.list_templates');await doOp('render.set_output',{queueIndex:1,renderTemplate:'Best Settings',outputTemplate:'High Quality',outputPath:root+'/queue-probe.mov'});c1.render=await doOp('render.start');c1.afterRender=hash(aep);c1.renderedState=await snapshot();c1.open=await doOp('project.open',{path:aep,save:false});c1.after=hash(aep);c1.reopenedState=await snapshot();c1.preserved=c1.before.sha256===c1.after.sha256&&c1.reopenedState.queue===0;report.cases.push(c1);console.log(JSON.stringify(c1));
 if(c1.reopenedState.queue===1){await doOp('render.remove_item',{queueIndex:1});const c2={name:'cleanup-reopen',before:hash(aep)};c2.open=await doOp('project.open',{path:aep,save:false});c2.after=hash(aep);c2.state=await snapshot();c2.preserved=c2.before.sha256===c2.after.sha256;report.cases.push(c2);console.log(JSON.stringify(c2));}
 await doOp('render.add_to_queue',{comp:'QUEUE_PROBE',outputPath:root+'/saved-queue.mov'});const saved=root+'/saved-queue.aep';await tool('ae_save_project',{path:saved});copyFileSync(saved,saved+'.backup');const c3={name:'discard-queue-removal',before:hash(saved),beforeState:await snapshot()};await doOp('render.remove_item',{queueIndex:1});c3.removedState=await snapshot();c3.open=await doOp('project.open',{path:saved,save:false});c3.after=hash(saved);c3.reopenedState=await snapshot();c3.preserved=c3.before.sha256===c3.after.sha256&&c3.reopenedState.queue===1;report.cases.push(c3);console.log(JSON.stringify(c3));
 await doOp('project.new',{save:false});report.finished=true;
}catch(e){report.error=String(e);console.log(JSON.stringify({error:report.error}));process.exitCode=1}
finally{report.stderr=stderr;writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');child.stdin.end();setTimeout(()=>child.kill(),500).unref()}
