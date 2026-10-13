// Append after library/scripts/motion.jsx in an eval.run function body.
// Caller provides DEMO_NAME. Creates only one named scratch comp and its layers.
var c = app.project.items.addComp(DEMO_NAME, 960, 540, 1, 5, 30);
c.bgColor = [0.035,0.047,0.07];
c.motionBlur = true;
c.shutterAngle = 180;
function box(name,x,y,w,h,color,round) {
  var l=c.layers.addShape();l.name=name;l.position.setValue([x,y]);
  var root=l.property('ADBE Root Vectors Group');
  var r=root.addProperty('ADBE Vector Shape - Rect');
  r.property('ADBE Vector Rect Size').setValue([w,h]);
  r.property('ADBE Vector Rect Roundness').setValue(round||0);
  var f=root.addProperty('ADBE Vector Graphic - Fill');
  f.property('ADBE Vector Fill Color').setValue(color);
  return l;
}
function label(name,txt,size,x,y,color) {
  var l=c.layers.addText(txt);l.name=name;
  var p=l.property('ADBE Text Properties').property('ADBE Text Document');
  var d=p.value;d.font='ArialMT';d.fontSize=size;d.fillColor=color;d.applyFill=true;d.applyStroke=false;p.setValue(d);
  l.position.setValue([x,y]);return l;
}
var ink=[0.92,0.94,0.96],muted=[0.50,0.58,0.67],accent=[0.40,0.90,0.72];
for(var i=0;i<15;i++){var g=box('AES_GRID_'+i,60+i*60,270,1,450,[0.085,0.105,0.14]);}
for(var j=0;j<8;j++){box('AES_ROW_'+j,480,60+j*60,840,1,[0.085,0.105,0.14]);}
label('AES_EYEBROW','AFTER EFFECTS STUDIO',13,60,58,accent);
var title=label('AES_TITLE','Make the idea move.',52,60,150,ink);
AESMotion.keys(title.position,[0,0.6],[[60,175],[60,150]],'settle');
AESMotion.keys(title.opacity,[0,0.32],[0,100],'linear');
label('AES_SUBTITLE','Design. Choreograph. Verify.',19,62,187,muted);
var names=['01  DESIGN','02  MOTION','03  PROOF'];
for(var k=0;k<3;k++){
  var x=185+k*295,t=0.55+k*0.24;
  var card=box('AES_CARD_'+k,x,329,250,178,[0.075,0.095,0.13],16);
  AESMotion.keys(card.scale,[t,t+0.55],[[100,0],[100,100]],'settle');
  var text=label('AES_STEP_'+k,names[k],14,x-100,278,muted);text.inPoint=t+0.18;
  var rail=box('AES_RAIL_'+k,x,370,200,3,[0.14,0.19,0.24]);
  rail.inPoint=t+0.18;
  var bar=box('AES_BAR_'+k,x-100,370,200,3,accent);
  bar.inPoint=t+0.3;
  bar.anchorPoint.setValue([-100,0]);
  AESMotion.keys(bar.scale,[t+0.3,t+1.2],[[0,100],[100,100]],'travel');
  if(k===0){
    for(var n=0;n<3;n++){var strip=box('AES_TYPE_'+n,x-10,308+n*15,180-n*35,5,ink,2);strip.inPoint=t+0.3+n*.1;AESMotion.keys(strip.scale,[t+0.3+n*.1,t+.7+n*.1],[[0,100],[100,100]],'settle');}
  }else if(k===1){
    var orbit=box('AES_BLOCK',x-65,325,30,30,accent,7);
    orbit.inPoint=t+.3;
    AESMotion.keys(orbit.position,[t+.3,t+1.2,t+1.8],[[x-65,325],[x+55,325],[x+30,325]],'travel');
    orbit.motionBlur=true;
  }else{
    var badge=label('AES_OK','OK',34,x-28,339,accent);badge.inPoint=t+.6;AESMotion.pop(badge,t+.6,0.1,[100,100]);
  }
}
label('AES_FOOTER','NATIVE LAYERS  /  EDITABLE MOTION  /  LOCAL CONTROL',11,60,483,muted);
return {compId:c.id,compName:c.name,layers:c.numLayers,width:c.width,height:c.height,duration:c.duration};
