import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../../library/scripts/typography.jsx',import.meta.url),'utf8');
function setup(text='Café déjà vu',paragraph=false){
 let state:any={text,font:'Original',fontSize:60,boxText:paragraph,boxTextSize:[400,200],boxOverflow:false};let writes=0;
 const fonts:any={Approved:{postScriptName:'Approved',isSubstitute:false,hasGlyphsFor:()=>true}};
 const clone=()=>({...state,boxTextSize:[...state.boxTextSize],fontObject:fonts[state.font]});
 const prop:any={numKeys:0,expression:'',expressionEnabled:false,get value(){return clone();},valueAtTime:()=>clone(),setValue:(v:any)=>{writes++;state={...v};}};
 const layer:any={id:8,locked:false,containingComp:{duration:5},property:()=>({property:()=>prop}),sourceRectAtTime:()=>({left:0,top:-state.fontSize*.8,width:state.text.length*state.fontSize*.5,height:state.fontSize})};
 const context=vm.createContext({app:{fonts:{getFontsByPostScriptName:(n:string)=>fonts[n]?[fonts[n]]:[]}}});vm.runInContext(code,context);
 const options:any={owner:'fixture',ownedLayerIds:[8],rect:{left:0,top:0,width:300,height:100},minFontSize:20,maxFontSize:80,wrap:paragraph?'paragraph':'preserve',time:0,requestedFont:'Approved',fallbackFonts:[]};
 return {api:context.AESType,layer,prop,options,read:()=>JSON.stringify(state),writes:()=>writes};
}
describe('portable typography measurement and fitting',()=>{
 it('loads without touching app or project',()=>{vm.runInNewContext(code,{get app(){throw new Error('load touched host');}});});
 it.each([{time:NaN},{time:Infinity},{time:-1},{time:6},{minFontSize:0},{maxFontSize:10},{maxFontSize:Infinity},{rect:{left:0,top:0,width:0,height:100}},{rect:{left:NaN,top:0,width:100,height:100}},{wrap:'auto'},{owner:''},{ownedLayerIds:[9]},{fallbackFonts:['']}])('rejects invalid input without writes %j',patch=>{const f=setup(),before=f.read();const r=f.api.fit(f.layer,{...f.options,...patch});expect(r.ok).toBe(false);expect(f.read()).toBe(before);expect(f.writes()).toBe(0);});
 it('guards nontext, locked, keyed and expressed targets before writing',()=>{
  for(const kind of ['nontext','locked','keys','expression']){const f=setup(),before=f.read();if(kind==='nontext')f.layer.property=()=>null;if(kind==='locked')f.layer.locked=true;if(kind==='keys')f.prop.numKeys=2;if(kind==='expression')f.prop.expression='value';expect(f.api.fit(f.layer,f.options).ok).toBe(false);expect(f.read()).toBe(before);expect(f.writes()).toBe(0);}
 });
 it('fits full accented copy, reports source bounds and keeps minimum',()=>{const f=setup(),r=f.api.fit(f.layer,f.options);expect(r.ok).toBe(true);expect(r.overflow).toBe(false);expect(r.fontSize).toBeGreaterThanOrEqual(20);expect(r.bounds.space).toBe('source');expect(JSON.parse(f.read()).text).toBe('Café déjà vu');});
 it('uses only approved fallback names and reports them',()=>{const f=setup();expect(f.api.fit(f.layer,{...f.options,requestedFont:'Missing'}).error.code).toBe('FONT_UNAVAILABLE');expect(f.writes()).toBe(0);const r=f.api.fit(f.layer,{...f.options,requestedFont:'Missing',fallbackFonts:['Approved']});expect(r.resolvedFont).toBe('Approved');expect(r.warnings.length).toBeGreaterThan(0);});
 it.each(['',' \n\t '])('returns zero drawable bounds for blank copy',text=>{const f=setup(text);const r=f.api.fit(f.layer,f.options);expect(r.bounds.width).toBe(0);expect(r.bounds.height).toBe(0);expect(JSON.parse(f.read()).text).toBe(text);});
 it('reports long unbroken overflow without truncating or shrinking below minimum',()=>{const f=setup('long'.repeat(200));const r=f.api.fit(f.layer,f.options);expect(r.overflow).toBe(true);expect(r.fontSize).toBe(20);expect(JSON.parse(f.read()).text.length).toBe(800);});
 it('refuses point/paragraph conversion',()=>{const f=setup();expect(f.api.fit(f.layer,{...f.options,wrap:'paragraph'}).error.code).toBe('UNSUPPORTED');expect(f.writes()).toBe(0);});
 it('throws for invalid measurement time instead of mutating',()=>{const f=setup();expect(()=>f.api.measure(f.layer,NaN)).toThrow(/time/i);expect(f.writes()).toBe(0);});
 it('restores after a native measurement error, and flags failed restoration',()=>{
  const f=setup(),before=f.read();f.layer.sourceRectAtTime=()=>{throw new Error('native bounds failure');};const r=f.api.fit(f.layer,f.options);expect(r.error.code).toBe('NATIVE_ERROR');expect(f.read()).toBe(before);
  const g=setup();g.prop.setValue=()=>{throw new Error('native write failure');};expect(g.api.fit(g.layer,g.options).uncertain).toBe(true);
 });
});
function animationSetup(){
 const f=setup('Make motion clear');let changes=0;
 function prop(value:any){return {value,numKeys:0,expression:'',expressionEnabled:false,dimensionsSeparated:false,isSpatial:false,keys:[] as any[],setValue(v:any){this.value=v;changes++;},setValueAtTime(t:number,v:any){this.keys.push([t,v]);this.numKeys++;changes++;},setTemporalEaseAtKey(){},setInterpolationTypeAtKey(){}};}
 function group(){const children:Record<string,any>={};return {numProperties:0,property(n:string){return children[n]??(children[n]=n.includes('Properties')||n==='ADBE Text Selectors'||n==='ADBE Text Range Advanced'?group():prop(0));},addProperty(n:string){changes++;this.numProperties++;const g:any=(n==='ADBE Text Opacity')?prop(0):group();g.propertyIndex=this.numProperties;g.name=n;children[String(this.numProperties)]=g;return g;}};}
 const transforms:any={'ADBE Position':prop([300,400,0]),'ADBE Scale':prop([100,100,100]),'ADBE Anchor Point':prop([0,0,0]),'ADBE Rotate Z':prop(0),'ADBE Opacity':prop(100)};
 const animators=group(),masks=group();const comp={duration:5,frameRate:30};
 f.layer.containingComp=comp;f.layer.inPoint=0;f.layer.outPoint=5;f.layer.parent=null;f.layer.threeDLayer=false;f.layer.name='Editable';
 f.layer.property=(n:string)=>n==='ADBE Text Properties'?{property:(k:string)=>k==='ADBE Text Document'?f.prop:animators}:n==='ADBE Transform Group'?{property:(k:string)=>transforms[k]}:masks;
 const context=vm.createContext({Shape:function(){},KeyframeEase:function(){},KeyframeInterpolationType:{BEZIER:1}});vm.runInContext(code,context);
 return {...f,api:context.AESType,transforms,animators,masks,comp,changes:()=>changes,options:{owner:'fixture',ownedLayerIds:[8],technique:'clean',unit:'word',start:0.5,duration:0.6,intensity:0.4}};
}
describe('editable typography animation',()=>{
 it.each(['clean','stagger','masked','impact'])('implements %s while retaining source copy',technique=>{const f=animationSetup(),copy=f.read();const r=f.api.reveal(f.layer,{...f.options,technique});expect(r.ok).toBe(true);expect(r.targets.length).toBeGreaterThan(0);expect(f.read()).toBe(copy);expect(f.api.reveal(f.layer,{...f.options,technique}).error.code).toBe('CONFLICT');});
 it.each([{duration:0},{duration:-1},{start:-1},{start:4.9},{intensity:Infinity},{intensity:2},{technique:'unknown'},{unit:'character'}])('rejects invalid timing/mode before writes %j',patch=>{const f=animationSetup();expect(f.api.reveal(f.layer,{...f.options,...patch}).ok).toBe(false);expect(f.changes()).toBe(0);});
 it('preflights later targeted properties and expressions before any earlier write',()=>{const f=animationSetup();f.transforms['ADBE Scale'].expression='value';expect(f.api.reveal(f.layer,{...f.options,technique:'impact'}).error.code).toBe('CONFLICT');expect(f.changes()).toBe(0);});
 it('supports line stagger and preserves original string',()=>{const f=animationSetup();expect(f.api.reveal(f.layer,{...f.options,technique:'stagger',unit:'line'}).ok).toBe(true);expect(JSON.parse(f.read()).text).toBe('Make motion clear');});
 it('aligns distinct owned replacement layers and retains both copies',()=>{const a=animationSetup(),b=animationSetup();b.layer.id=9;b.layer.containingComp=a.comp;const r=a.api.replacePhrase(a.comp,{owner:'fixture',ownedLayerIds:[8,9],sourceLayer:a.layer,targetLayer:b.layer,start:2,duration:.5,align:'left'});expect(r.ok).toBe(true);expect(r.sourceLayerId).toBe(8);expect(r.targetLayerId).toBe(9);expect(JSON.parse(a.read()).text).toBe('Make motion clear');expect(JSON.parse(b.read()).text).toBe('Make motion clear');});
 it('refuses same identity and target conflict without touching source',()=>{const a=animationSetup(),b=animationSetup();const opts={owner:'fixture',ownedLayerIds:[8,9],sourceLayer:a.layer,targetLayer:a.layer,start:2,duration:.5,align:'left'};expect(a.api.replacePhrase(a.comp,opts).ok).toBe(false);b.layer.id=9;b.layer.containingComp=a.comp;b.transforms['ADBE Opacity'].numKeys=2;expect(a.api.replacePhrase(a.comp,{...opts,targetLayer:b.layer}).error.code).toBe('CONFLICT');expect(a.changes()).toBe(0);expect(b.changes()).toBe(0);});
});

describe('animation failure identities and alignment',()=>{
 it('retains the created identity when naming a new animator fails',()=>{const f=animationSetup();f.animators.addProperty=()=>({propertyIndex:1,get name(){return 'Animator 1';},set name(v){throw new Error('native rename failed');}} as any);const r=f.api.reveal(f.layer,{...f.options,technique:'stagger'});expect(r.uncertain).toBe(true);expect(r.created).toHaveLength(1);expect(r.created[0].layerId).toBe(8);});
 it.each([['left',300],['center',350],['right',400]])('aligns measured %s bounds of different widths',(align,expected)=>{const a=animationSetup(),b=animationSetup();b.layer.id=9;b.layer.containingComp=a.comp;a.layer.sourceRectAtTime=()=>({left:10,top:-40,width:300,height:50});b.layer.sourceRectAtTime=()=>({left:10,top:-40,width:200,height:50});const r=a.api.replacePhrase(a.comp,{owner:'fixture',ownedLayerIds:[8,9],sourceLayer:a.layer,targetLayer:b.layer,start:2,duration:.5,align});expect(r.ok).toBe(true);expect(b.transforms['ADBE Position'].value[0]).toBe(expected);});
});
