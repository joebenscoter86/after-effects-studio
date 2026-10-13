// ES3 eval.run function BODY. No external dependencies; never invokes AE here.
// Additive build: no save, close, project switch, selection, viewer, or undo calls.
if (!app.project) { throw new Error("An open AE project is required."); }
var stamp = (new Date()).getTime().toString() + "_" + Math.floor(Math.random()*100000).toString();
var prefix = "InboxReview_" + stamp;
var comp = app.project.items.addComp(prefix,1280,720,1,9,30);
comp.bgColor=[0.13,0.055,0.15];
var AU=[0.13,0.055,0.15], IV=[0.97,0.94,0.86], MI=[0.38,1,0.73], MU=[0.61,0.53,0.62];
function tr(layer,name){return layer.property("ADBE Transform Group").property(name);}
function keys(p,t,v,mode){
  var i,j,dim,ins,outs;
  for(i=0;i<t.length;i++)p.setValueAtTime(t[i],v[i]);
  for(i=1;i<=p.numKeys;i++){
    if(mode==="linear")p.setInterpolationTypeAtKey(i,KeyframeInterpolationType.LINEAR,KeyframeInterpolationType.LINEAR);
    else {
      dim=(!p.isSpatial && (p.propertyValueType===PropertyValueType.TwoD || p.propertyValueType===PropertyValueType.ThreeD))?p.value.length:1;
      ins=[];outs=[];
      for(j=0;j<dim;j++){ins.push(new KeyframeEase(0,82));outs.push(new KeyframeEase(0,55));}
      p.setInterpolationTypeAtKey(i,KeyframeInterpolationType.BEZIER,KeyframeInterpolationType.BEZIER);
      p.setTemporalEaseAtKey(i,ins,outs);
    }
  }
  if(p.isSpatial){for(i=1;i<=p.numKeys;i++){p.setSpatialAutoBezierAtKey(i,false);p.setSpatialTangentsAtKey(i,[0,0],[0,0]);}}
}
function shape(name,verts,closed,fill,stroke,width,parent){
  var l=comp.layers.addShape();l.name=prefix+" / "+name;
  tr(l,"ADBE Position").setValue([0,0]);
  if(parent){l.parent=parent;tr(l,"ADBE Position").setValue([0,0]);}
  var c=l.property("ADBE Root Vectors Group");
  var g=c.addProperty("ADBE Vector Group");g.name="Geometry";
  var v=g.property("ADBE Vectors Group"),s=new Shape(),a=[],i;
  s.vertices=verts;s.closed=closed;
  for(i=0;i<verts.length;i++)a.push([0,0]);s.inTangents=a;s.outTangents=a;
  v.addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s);
  if(fill){var f=v.addProperty("ADBE Vector Graphic - Fill");f.property("ADBE Vector Fill Color").setValue(fill);}
  if(stroke){var st=v.addProperty("ADBE Vector Graphic - Stroke");st.property("ADBE Vector Stroke Color").setValue(stroke);st.property("ADBE Vector Stroke Width").setValue(width||2);}
  return l;
}
function box(name,x,y,w,h,fill,stroke,parent){return shape(name,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],true,fill,stroke,2,parent);}
function txt(name,text,x,y,size,color,parent){
  var l=comp.layers.addText(text);l.name=prefix+" / "+name;
  var p=l.property("ADBE Text Properties").property("ADBE Text Document"),d=p.value;
  d.font="ArialMT";d.fontSize=size;d.applyFill=true;d.fillColor=color;d.applyStroke=false;d.justification=ParagraphJustification.LEFT_JUSTIFY;p.setValue(d);
  var r=l.sourceRectAtTime(0,false);
  tr(l,"ADBE Anchor Point").setValue([r.left,r.top]);
  if(parent)l.parent=parent;
  tr(l,"ADBE Position").setValue([x,y]);return l;
}
function visibility(layer,a,b){layer.inPoint=a;layer.outPoint=b;}
function fade(layer,a,b){keys(tr(layer,"ADBE Opacity"),[a,b],[0,100],"linear");}
// Opaque native background and structural typography.
box("Background",0,0,1280,720,AU,null,null);
box("Top mint rule",72,56,44,4,MI,null,null);
txt("Eyebrow","FICTIONAL INBOX REVIEW",136,48,16,IV,null);
var h1=txt("Headline 01","Review six incoming requests.",72,94,40,IV,null);visibility(h1,0,3.2);
var h2=txt("Headline 02","Defer four. Approve two.",72,94,40,IV,null);visibility(h2,3.2,6.7);
var h3=txt("Headline 03","Two approved requests carry forward.",72,94,40,IV,null);visibility(h3,6.7,9);
var src=txt("Source heading","INBOX / 6 REQUESTS",72,191,18,IV,null);visibility(src,0,3.3);
var def=txt("Deferred heading","DEFERRED / 4 REQUESTS",72,191,18,IV,null);visibility(def,3.3,9);
var next=txt("Destination heading","NEXT WORKSPACE",902,191,18,MI,null);fade(next,4.65,4.95);
var divider=shape("Workspace divider",[[850,235],[850,577]],false,null,MU,1,null);fade(divider,4.65,4.95);
var pane=box("Destination container",891,243,302,311,null,MU,null);fade(pane,4.65,4.95);
var slot1=box("Destination slot 01",949,258,184,128,null,MI,null);fade(slot1,4.85,5.1);
var slot2=box("Destination slot 02",949,408,184,128,null,MI,null);fade(slot2,4.85,5.1);
// The scan moves across the same field as all six documents. Rightmost pair is accepted.
var scan=shape("Review cursor",[[0,251],[0,520]],false,null,MI,3,null);
keys(tr(scan,"ADBE Position"),[1.65,2.85],[[134,0],[864,0]],"linear");visibility(scan,1.65,2.9);
var scanning=txt("Review instruction","REVIEWING",72,582,16,MI,null);visibility(scanning,1.65,3.2);
var deferredIndex=0,approvedIndex=0,groups=[],i;
for(i=0;i<6;i++){
  var accepted=(i===2 || i===5),col=i%3,row=Math.floor(i/3);
  var x=240+260*col,y=321+150*row;
  var root=comp.layers.addNull(9);root.name=prefix+" / Request "+(i+1)+" / MOTION";
  tr(root,"ADBE Anchor Point").setValue([0,0]);tr(root,"ADBE Position").setValue([0,0]);
  var doc=shape("Request "+(i+1)+" / document",[[-80,-57],[60,-57],[80,-37],[80,57],[-80,57]],true,IV,null,0,root);
  shape("Request "+(i+1)+" / fold",[[60,-57],[60,-37],[80,-37]],false,null,AU,2,root);
  txt("Request "+(i+1)+" / ID","REQUEST 0"+(i+1),-61,-36,16,AU,root);
  shape("Request "+(i+1)+" / content line A",[[-60,-2],[44,-2]],false,null,AU,2,root);
  shape("Request "+(i+1)+" / content line B",[[-60,9],[17,9]],false,null,AU,2,root);
  var st=txt("Request "+(i+1)+" / decision",accepted?"APPROVED":"DEFERRED",-60,31,12,AU,root);visibility(st,3.2,9);
  var arrival=0.18+i*0.11,pt=[arrival,arrival+0.6],pv=[[-130,y],[x,y]];
  if(accepted){
    var destY=321+150*approvedIndex;
    pt.push(5.15+approvedIndex*0.13);pv.push([x,y]);
    pt.push(6.15+approvedIndex*0.13);pv.push([1041,destY]);approvedIndex++;
    var fill=doc.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color");
    keys(fill,[2.67,2.80],[IV,MI],"linear");
    var select=box("Request "+(i+1)+" / selection",-87,-64,174,128,null,MI,root);visibility(select,2.67,4.85);
  }else{
    var dx=240+(deferredIndex%2)*260,dy=321+Math.floor(deferredIndex/2)*150;
    pt.push(3.35+deferredIndex*0.08);pv.push([x,y]);
    pt.push(4.2+deferredIndex*0.08);pv.push([dx,dy]);deferredIndex++;
    var f2=doc.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color");
    keys(f2,[3.2,3.35],[IV,[0.72,0.66,0.70]],"linear");
  }
  keys(tr(root,"ADBE Position"),pt,pv,"travel");groups.push(root);
}
// Summary is deliberately still for the final two seconds; all original IDs remain visible.
var summary=txt("Final accounting","6 reviewed    /    4 deferred    /    2 approved",72,634,25,IV,null);fade(summary,6.65,6.9);
var deferredNote=txt("Deferred note","Four stay here for later.",72,578,21,IV,null);fade(deferredNote,4.25,4.5);
var approvedNote=txt("Carry note","Two carry forward.",902,578,21,MI,null);fade(approvedNote,6.35,6.6);
// Markers expose editorial beats without requiring private rig controls.
var labels=["Six arrive","Review and select","Defer four","Carry same approved pair","Final readable hold"];
var beats=[0,1.65,3.2,5.15,6.7];
for(i=0;i<beats.length;i++){comp.markerProperty.setValueAtTime(beats[i],new MarkerValue(labels[i]));}
return {compIds:[comp.id],compositionName:comp.name,duration:comp.duration,width:comp.width,height:comp.height,frameRate:comp.frameRate,layerCount:comp.numLayers};
