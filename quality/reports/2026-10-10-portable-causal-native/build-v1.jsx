if(app.project.numItems!==0 || app.project.file!==null || app.project.dirty) throw new Error("Expected clean empty untitled project");
var c=app.project.items.addComp("AFT17 | THRESHOLD | MASTER",1920,1080,1,8,30);
var graphite=[0.16,0.20,0.23], muted=[0.38,0.45,0.49], pale=[0.87,0.92,0.94], amber=[0.86,0.48,0.08], line=[0.61,0.69,0.73], white=[0.96,0.98,0.99];
var root=c.layers.addNull();root.name="AFT17 Controls";root.guideLayer=true;
var e=root.property("ADBE Effect Parade").addProperty("ADBE Slider Control");e.name="Temperature";
e.property(1).setValueAtTime(45/30,20);e.property(1).setValueAtTime(105/30,26);e.property(1).setValueAtTime(125/30,28);
e=root.property("ADBE Effect Parade").addProperty("ADBE Slider Control");e.name="Threshold frame";e.property(1).setValue(105);
var ctrl='thisComp.layer("AFT17 Controls")';var T=ctrl+'.effect("Threshold frame")("Slider")/30;';
function shp(name){var l=c.layers.addShape();l.name="AFT17 "+name;l.property("ADBE Transform Group").property("ADBE Position").setValue([0,0]);return l;}
function rect(name,x,y,w,h,fill,stroke,sw){var l=shp(name);AE.rect(l,[w,h],[x,y],{name:name,roundness:0,fill:fill,stroke:stroke,strokeWidth:sw||2});return l;}
function path(name,pts,color,width,start,end){var l=shp(name),g=l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");g.name="Geometry";var z=g.property("ADBE Vectors Group"),p=z.addProperty("ADBE Vector Shape - Group"),s=new Shape();s.vertices=pts;s.closed=false;var it=[],ot=[];for(var i=0;i<pts.length;i++){it.push([0,0]);ot.push([0,0]);}s.inTangents=it;s.outTangents=ot;p.property("ADBE Vector Shape").setValue(s);var st=z.addProperty("ADBE Vector Graphic - Stroke");st.property("ADBE Vector Stroke Color").setValue(color);st.property("ADBE Vector Stroke Width").setValue(width);if(start!==undefined){var tr=z.addProperty("ADBE Vector Filter - Trim");tr.property("ADBE Vector Trim End").setValueAtTime(start/30,0);tr.property("ADBE Vector Trim End").setValueAtTime(end/30,100);AE.setEase(tr.property("ADBE Vector Trim End"),1,28,28);AE.setEase(tr.property("ADBE Vector Trim End"),2,85,85);}return l;}
function txt(name,s,x,y,size,color,bold,align){var l=c.layers.addText(s);l.name="AFT17 "+name;var p=l.property("ADBE Text Properties").property("ADBE Text Document"),d=p.value;d.font=bold?"Arial-BoldMT":"ArialMT";d.fontSize=size;d.fillColor=color;d.applyFill=true;d.applyStroke=false;d.justification=align?ParagraphJustification.CENTER_JUSTIFY:ParagraphJustification.LEFT_JUSTIFY;p.setValue(d);l.property("ADBE Transform Group").property("ADBE Position").setValue([x,y]);return l;}
function reveal(l,a,b){var p=l.property("ADBE Transform Group").property("ADBE Opacity");p.setValueAtTime(a/30,0);p.setValueAtTime(b/30,100);}
rect("Background",960,540,1920,1080,pale);
txt("Title","At the threshold.",120,150,66,graphite,true);
txt("Subtitle","Fictional temperature-control system",122,204,27,muted,false);
path("Header rule",[[120,252],[1800,252]],line,2,0,18);
txt("Gauge heading","01  /  TEMPERATURE",325,315,22,muted,true);
txt("Vent heading","02  /  RESPONSE",1260,315,22,muted,true);
path("Gauge outline",[[438,760],[438,400],[522,400],[522,760]],graphite,4,6,25);
var fill=rect("Gauge column",480,760,50,1,graphite);
var rc=fill.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Shape - Rect");
rc.property("ADBE Vector Rect Size").expression='var v='+ctrl+'.effect("Temperature")("Slider");[50,Math.max(2,(v-20)*45)];';
rc.property("ADBE Vector Rect Position").expression='var v='+ctrl+'.effect("Temperature")("Slider");[480,760-Math.max(2,(v-20)*45)/2];';
reveal(fill,25,34);
path("Base",[[414,778],[546,778]],graphite,4,15,30);
txt("Lower scale","20",365,768,25,muted,false);
txt("Upper scale","28",365,410,25,muted,false);
path("Threshold mark",[[424,490],[550,490]],amber,4,26,40);
txt("Threshold label","26  /  TRIGGER",580,459,24,amber,true);
var value=txt("Value","20",480,887,72,graphite,true,true);
value.property("ADBE Text Properties").property("ADBE Text Document").expression='var v='+ctrl+'.effect("Temperature")("Slider");Math.floor(v+0.00001).toString();';
txt("Value caption","ILLUSTRATIVE VALUE",480,922,17,muted,true,true);
path("Route",[[550,490],[930,490],[930,560],[1260,560]],line,3,22,40);
var signal=path("Signal trail",[[550,490],[930,490],[930,560],[1260,560]],amber,6);
var sg=signal.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
sg.property("ADBE Vector Trim End").expression='var t='+T+'linear(time,t,t+1,0,100);';
signal.property("ADBE Transform Group").property("ADBE Opacity").expression='var t='+T+'time<t?0:100;';
var dot=shp("Signal head");AE.ellipse(dot,[16,16],[0,0],{fill:amber});
dot.property("ADBE Transform Group").property("ADBE Position").expression='var t='+T+'var d=linear(time,t,t+1,0,780);var p;if(d<=380)p=[550+d,490];else if(d<=450)p=[930,490+d-380];else p=[930+d-450,560];p;';
dot.property("ADBE Transform Group").property("ADBE Opacity").expression='var t='+T+'time<t?0:100;';
var vent=rect("Vent frame",1440,560,360,300,white,graphite,4);reveal(vent,16,30);
var well=rect("Vent interior",1440,560,314,256,graphite);reveal(well,23,34);
for(var i=0;i<5;i++){var y=456+i*52;var slat=rect("Louver "+(i+1),0,0,310,48,pale,graphite,2);slat.property("ADBE Transform Group").property("ADBE Position").setValue([1440,y]);slat.property("ADBE Transform Group").property("ADBE Scale").expression='var t='+T+'var u=clamp((time-t-31/30)/(23/30),0,1);u=u*u*(3-2*u);[100,100-78*u];';reveal(slat,25+i*2,29+i*2);}
var receiver=shp("Vent receiver");AE.ellipse(receiver,[20,20],[1260,560],{fill:pale,stroke:graphite,strokeWidth:3});var recvFill=receiver.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color");recvFill.expression='var t='+T+'time<t+1?[0.87,0.92,0.94]:[0.86,0.48,0.08];';
reveal(receiver,32,40);
var status=txt("Vent state","VENT CLOSED",1440,816,36,graphite,true,true);
status.property("ADBE Text Properties").property("ADBE Text Document").expression='var t='+T+'time<t+54/30?"VENT CLOSED":"VENT OPEN";';
reveal(status,30,40);
txt("Footer","ILLUSTRATIVE VALUES  /  NO LIVE SENSOR DATA",120,1000,18,muted,true);
txt("System label","THERMAL STUDY   /   01",1530,1000,18,muted,false);
c.time=0;c.openInViewer();
return {compId:c.id,compName:c.name,layers:c.numLayers,appVersion:app.version,build:app.buildNumber,workingSpace:app.project.workingSpace,frameRate:c.frameRate,duration:c.duration};
