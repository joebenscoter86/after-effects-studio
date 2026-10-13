// PUBLIC REVIEW COPY: replace <developer-home> with the local path before replay. Exact executed bytes are retained in ignored quality/reports/raw.
if(app.project.numItems!==0 || app.project.file!==null) throw new Error('Expected inspected empty untitled project; stop');
var prefix='AFT17_FRESH_20261009_';
var folder=app.project.items.addFolder(prefix+'OWNED');
var c=app.project.items.addComp(prefix+'CURVE_STUDY',1344,752,1,6,30);c.parentFolder=folder;
var ink=[0.075,0.085,0.11], copper=[0.64,0.32,0.16];
function anim(p,t,v){for(var i=0;i<t.length;i++)p.setValueAtTime(t[i],v[i]);for(var j=1;j<=p.numKeys;j++)AE.setEase(p,j,82,82);}
function txt(name,s,size,pos,start){var l=c.layers.addText(s);l.name=prefix+name;var p=l.property('ADBE Text Properties').property('ADBE Text Document');var d=p.value;d.font='HelveticaNeue';d.fontSize=size;d.fillColor=ink;p.setValue(d);l.position.setValue(pos);anim(l.opacity,[start,start+0.2],[0,100]);return l;}
var bg=c.layers.addShape();bg.name=prefix+'BACKGROUND';bg.position.setValue([0,0]);AE.rect(bg,[1344,752],[672,376],{fill:[0.84,0.79,0.70]});
var imp=app.project.importFile(new ImportOptions(new File('<developer-home>/after-effects-studio/quality/renders/2026-10-09-fresh-session-registration/arc-01-input.png')));imp.name=prefix+'ART';imp.parentFolder=folder;
var art=c.layers.add(imp);art.name=prefix+'MATERIAL';art.anchorPoint.setValue([672,376]);art.position.setValue([662,386]);art.scale.setValue([105,105]);anim(art.opacity,[1.8,2.4],[0,100]);
var src=[[1012.0, 470], [1013.0, 468], [1012.0, 462], [1010.0, 456], [1008.5, 450], [1007.0, 444], [1005.5, 438], [1004.5, 432], [1002.5, 426], [1001.0, 420], [1000.0, 414], [998.0, 408], [997.0, 402], [995.0, 396], [993.5, 390], [992.0, 384], [990.5, 378], [989.0, 372], [987.5, 366], [986.0, 360], [984.0, 354], [983.0, 348], [981.0, 342], [980.0, 336], [978.0, 330], [976.5, 324], [975.0, 318], [973.0, 312], [972.0, 306], [970.0, 300], [968.5, 294], [967.0, 288], [965.0, 282], [963.5, 276], [961.5, 270], [960.0, 264], [957.5, 258], [955.5, 252], [953.5, 246], [951.5, 240], [949.5, 234], [947.0, 228], [944.0, 222], [942.0, 216], [939.0, 210], [936.0, 204], [938.5, 198], [935.5, 192], [931.5, 186], [928.0, 180], [923.5, 174], [919.0, 168], [913.5, 162], [908.5, 156], [902.5, 150], [896.0, 144], [888.0, 138], [878.5, 132], [867.5, 126]];
var verts=[],zero=[];for(var k=0;k<src.length;k++){verts.push([662+1.05*(src[k][0]-672),386+1.05*(src[k][1]-376)]);zero.push([0,0]);}
var g=c.layers.addShape();g.name=prefix+'MEASURED_GUIDE';g.position.setValue([0,0]);
var ct=g.property('ADBE Root Vectors Group');var path=ct.addProperty('ADBE Vector Shape - Group');var sh=new Shape();sh.vertices=verts;sh.inTangents=zero;sh.outTangents=zero;sh.closed=false;path.property('ADBE Vector Shape').setValue(sh);
var stroke=ct.addProperty('ADBE Vector Graphic - Stroke');stroke.property('ADBE Vector Stroke Color').setValue(copper);stroke.property('ADBE Vector Stroke Width').setValue(3);stroke.property('ADBE Vector Stroke Line Cap').setValue(2);
var trim=ct.addProperty('ADBE Vector Filter - Trim');anim(trim.property('ADBE Vector Trim End'),[0.3,1.3],[0,100]);anim(g.position,[1.3,1.8],[[-140,0],[0,0]]);anim(g.opacity,[2.7,3.1],[100,0]);
var eyebrow=txt('EYEBROW','FORM STUDY / 01',17,[96,165],0.1);
var title=txt('TITLE','ARC / 01',76,[91,272],0.2);
var sub=txt('PAYOFF','A curve, resolved.',30,[96,333],2.7);
var foot=txt('DISCLOSURE','FICTIONAL CONCEPT / REGISTRATION STUDY',14,[96,690],0.1);
var line=c.layers.addShape();line.name=prefix+'RULE';line.position.setValue([96,302]);AE.rect(line,[270,2],[135,0],{fill:copper});anim(line.scale,[2.5,2.9],[[0,100],[100,100]]);
c.time=2.4;c.openInViewer();
var ids=[];for(var n=1;n<=c.numLayers;n++){var l=c.layer(n);ids.push({id:l.id,name:l.name});}
return {compId:c.id,folderId:folder.id,footageId:imp.id,layers:ids,guideVertexCount:verts.length,imageTransform:{anchor:art.anchorPoint.value,position:art.position.value,scale:art.scale.value},titleBounds:title.sourceRectAtTime(4,false),projectItems:app.project.numItems};
