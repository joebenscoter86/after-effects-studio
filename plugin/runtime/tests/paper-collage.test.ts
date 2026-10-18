import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync(new URL('../../library/scripts/paper-collage.jsx',import.meta.url),'utf8');

function fixture(){
 let writes=0;
 function prop(value:any){return {value,numKeys:0,expression:'',expressionEnabled:false,dimensionsSeparated:false,setValue(v:any){this.value=v;writes++;},setValueAtTime(){writes++;}};}
 function group():any{const children:Record<string,any>={};return {property(n:string){return children[n]??(children[n]=n==='ADBE Vector Shape'||n==='ADBE Vector Fill Color'||n==='ADBE Vector Stroke Color'||n==='ADBE Vector Stroke Width'?prop(null):group());},addProperty(n:string){writes++;const child=group();children[n]=child;return child;}};}
 const position=prop([200,150]),rotation=prop(0),opacity=prop(100),anchor=prop([0,0]);
 const entries:any[]=[];
 const effects:any={canAddProperty:()=>true,get numProperties(){return entries.length;},property(n:number){return entries[n-1];},addProperty(){writes++;const effect={name:'effect',property:()=>prop(0)};entries.push(effect);return effect;}};
 const transform={property:(name:string)=>({'ADBE Position':position,'ADBE Rotate Z':rotation,'ADBE Opacity':opacity,'ADBE Anchor Point':anchor}[name])};
 const comp:any={duration:5,frameRate:30,width:800,height:600,layers:{addShape(){writes++;return layer;}}};
 const root=group();
 const layer:any={id:41,name:'owned',locked:false,containingComp:comp,property:(name:string)=>name==='ADBE Transform Group'?transform:name==='ADBE Effect Parade'?effects:name==='ADBE Root Vectors Group'?root:null};
 const context=vm.createContext({Shape:function(this:any){this.vertices=[];this.inTangents=[];this.outTangents=[];this.closed=true;}});
 vm.runInContext(code,context);
 const opts={owner:'fixture',ownedLayerIds:[41],texture:.2,border:.3,shadow:.4,intensity:.4,stepHz:12,seed:123};
 return {api:context.AESCollage,layer,comp,position,rotation,effects,opts,writes:()=>writes};
}

describe('portable collage helper preflight',()=>{
 it('loads without inspecting a project',()=>{vm.runInNewContext(code,{get app(){throw new Error('load inspected host');}});});
 it.each([{owner:''},{ownedLayerIds:[]},{ownedLayerIds:[NaN]},{texture:-.01},{border:1.01},{shadow:Infinity},{intensity:-1},{intensity:1.1},{stepHz:0},{stepHz:31},{seed:-1},{seed:1.5},{seed:Infinity}])('rejects bad cutout options before writing %j',patch=>{
  const f=fixture(),r=f.api.treatCutout(f.layer,{...f.opts,...patch});expect(r.ok).toBe(false);expect(f.writes()).toBe(0);
 });
 it.each([{width:0},{height:NaN},{color:[1,0]},{color:[1,0,2]},{seed:-1},{stepHz:31},{intensity:Infinity}])('rejects bad paper options before writing %j',patch=>{
  const f=fixture(),r=f.api.paper(f.comp,{owner:'fixture',name:'paper',width:400,height:250,color:[.95,.92,.85],texture:.2,border:.3,shadow:.4,intensity:.4,stepHz:12,seed:123,...patch});
  expect(r.ok).toBe(false);expect(f.writes()).toBe(0);
 });
 it('rejects expressed and unknown keyed position before any effect is added',()=>{
  for(const conflict of ['expression','keys']){const f=fixture();if(conflict==='expression')f.position.expression='value';else f.position.numKeys=2;const r=f.api.treatCutout(f.layer,f.opts);expect(r.error.code).toBe('CONFLICT');expect(f.writes()).toBe(0);}
 });
 it('rejects a rotation expression even when position is explicitly keyed',()=>{
  const f=fixture();f.position.numKeys=2;f.rotation.expression='value';const r=f.api.treatCutout(f.layer,{...f.opts,keyedProperties:['ADBE Transform Group/ADBE Position']});
  expect(r.error.code).toBe('CONFLICT');expect(f.writes()).toBe(0);
 });
 it('does not mutate a locked or unowned layer',()=>{
  const f=fixture();f.layer.locked=true;expect(f.api.treatCutout(f.layer,f.opts).error.code).toBe('CONFLICT');expect(f.writes()).toBe(0);
  f.layer.locked=false;expect(f.api.treatCutout(f.layer,{...f.opts,ownedLayerIds:[99]}).error.code).toBe('CONFLICT');expect(f.writes()).toBe(0);
 });
 it('uses only explicit seed and sampled time, preserving authored keyed position',()=>{
  const f=fixture();f.position.numKeys=2;const original=f.position.value;
  const r=f.api.treatCutout(f.layer,{...f.opts,keyedProperties:['ADBE Transform Group/ADBE Position']});
  expect(r.ok).toBe(true);expect(r.createdEffects).toHaveLength(3);expect(f.position.value).toBe(original);
  expect(f.position.expression).toContain('value+');expect(f.position.expression).toContain('time*12');expect(f.position.expression).not.toContain('index');
  expect(f.api.treatCutout(f.layer,{...f.opts,keyedProperties:['ADBE Transform Group/ADBE Position']}).error.code).toBe('CONFLICT');
  expect(f.effects.numProperties).toBe(3);
 });
 it('disables positional and rotational boil at zero intensity',()=>{
  const f=fixture(),r=f.api.treatCutout(f.layer,{...f.opts,intensity:0});
  expect(r.ok).toBe(true);expect(r.changedPropertyPaths).toHaveLength(0);expect(f.position.expression).toBe('');expect(f.rotation.expression).toBe('');
 });
 it('creates an editable native paper shape with owned identity and seed-only boil',()=>{
  const f=fixture();const r=f.api.paper(f.comp,{owner:'fixture',name:'Paper',width:400,height:250,color:[.95,.92,.85],texture:.2,border:.3,shadow:.4,intensity:.4,stepHz:12,seed:123});
  expect(r.ok).toBe(true);expect(r.created[0].layerId).toBe(41);expect(r.shapePaths[0]).toContain('ADBE Vector Shape');
  expect(f.rotation.expression).toContain('time*12');expect(f.rotation.expression).not.toContain('index');
  expect(f.effects.numProperties).toBe(3);
 });
});
