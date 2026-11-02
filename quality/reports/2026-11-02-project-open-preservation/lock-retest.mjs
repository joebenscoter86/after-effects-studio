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
 const source=path.resolve('quality/renders/2026-11-02-lock-cutaway/delivery-v2-preservation-failure.aep');report.sourceBefore=hash(source);const aep=root+'/pin-tumbler-observed-v2-revalidated.aep';copyFileSync(source,aep);copyFileSync(source,aep+'.backup');report.copyBefore=hash(aep);await doOp('project.open',{path:aep,save:false});
 const capture='var c=AE.findCompByNameOrId(1);if(!c||c.name!=="PIN_TUMBLER_EXPLAINER_v01")throw Error("wrong owned comp");c.time=12;var a=[];for(var i=1;i<=c.numLayers;i++){a.push(AE.serializeLayerFull(c.layer(i),{}));}return {id:c.id,name:c.name,width:c.width,height:c.height,duration:c.duration,fps:c.frameRate,layers:a};';
 report.nativeBefore=await ev(capture);report.beforeState=await snapshot();
 report.framesBefore=await tool('ae_render_frame',{compNameOrId:1,times:[1.2,5.1,9,12,472/30,659/30],outPath:root+'/before.png',contactSheet:{columns:3,thumbWidth:480},colorManaged:'off'});
 report.addQueue=await doOp('render.add_to_queue',{comp:1,outputPath:root+'/revalidated.mov'});await doOp('render.set_output',{queueIndex:1,renderTemplate:'Best Settings',outputTemplate:'High Quality',outputPath:root+'/revalidated.mov'});report.render=await doOp('render.start');report.afterRenderHash=hash(aep);report.afterRenderState=await snapshot();
 report.reopen=await doOp('project.open',{path:aep,save:false});report.afterReopenHash=hash(aep);report.afterReopenState=await snapshot();report.nativeAfter=await ev(capture);report.framesAfter=await tool('ae_render_frame',{compNameOrId:1,times:[1.2,5.1,9,12,472/30,659/30],outPath:root+'/after.png',contactSheet:{columns:3,thumbWidth:480},colorManaged:'off'});report.nativeEqual=JSON.stringify(report.nativeBefore.result)===JSON.stringify(report.nativeAfter.result);report.filePreserved=report.copyBefore.sha256===report.afterReopenHash.sha256;report.sourceAfter=hash(source);report.sourcePreserved=report.sourceBefore.sha256===report.sourceAfter.sha256;
 await ev('var c=AE.findCompByNameOrId(1);c.time=12;c.openInViewer();return {comp:c.id,time:c.time};');report.finished=true;
 console.log(JSON.stringify({nativeEqual:report.nativeEqual,filePreserved:report.filePreserved,sourcePreserved:report.sourcePreserved,afterReopenState:report.afterReopenState,framesBefore:report.framesBefore,framesAfter:report.framesAfter}));

}catch(e){report.error=String(e);console.log(JSON.stringify({error:report.error}));process.exitCode=1}
finally{report.stderr=stderr;writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');child.stdin.end();setTimeout(()=>child.kill(),500).unref()}
