// Original independent AFT-17 study. Run as eval.run function body in an empty project.
if (app.project.numItems !== 0) throw new Error('Expected the expressly owned empty project');
app.project.bitsPerChannel = 16;
app.project.workingSpace = '';
var c = app.project.items.addComp('AFT17I | MARGIN | MASTER',1920,1080,1,7,30);
c.motionBlur = true; c.shutterAngle=120; c.shutterPhase=-60;
var ink=[36/255,38/255,36/255], paper=[243/255,240/255,232/255], blue=[37/255,89/255,214/255];
function keys(p,frames,values) {
  for(var i=0;i<frames.length;i++) p.setValueAtTime(frames[i]/30,values[i]);
  for(var j=1;j<=p.numKeys;j++) {
    AE.setEase(p,j,70,45,0,0);
    if(p.propertyValueType===PropertyValueType.TwoD_SPATIAL || p.propertyValueType===PropertyValueType.ThreeD_SPATIAL) {
      var zero=[];for(var d=0;d<p.value.length;d++)zero.push(0);
      p.setSpatialAutoBezierAtKey(j,false);p.setSpatialContinuousAtKey(j,false);p.setSpatialTangentsAtKey(j,zero,zero);
    }
  }
}
function text(name,content,size){
  var l=c.layers.addText(content);l.name='AFT17I '+name;
  var p=l.property('ADBE Text Properties').property('ADBE Text Document'), t=p.value;
  t.font='HelveticaNeue-Medium';t.fontSize=size;t.applyFill=true;t.fillColor=ink;t.applyStroke=false;
  t.tracking=0;t.justification=ParagraphJustification.LEFT_JUSTIFY;p.setValue(t);
  l.motionBlur=true;return l;
}
var ground=c.layers.addShape();ground.name='AFT17I Paper';ground.position.setValue([0,0]);
AE.rect(ground,[1920,1080],[960,540],{name:'Full frame',fill:paper});ground.locked=true;
var x=300, letters='MARGIN', records=[];
for(var i=0;i<6;i++){
  var l=text('Glyph '+letters.charAt(i),letters.charAt(i),238),r=l.sourceRectAtTime(0,false);
  l.anchorPoint.setValue([r.left,r.top]);
  var yy=420; var offset=90;if(i%2===1)offset=-85;
  keys(l.position,[6+i*3,36+i*3],[[x+(i-2.5)*30,yy+offset],[x,yy]]);
  keys(l.opacity,[6+i*3,12+i*3],[0,100]);
  records.push({name:l.name,id:l.id,x:x,y:yy,width:r.width,height:r.height,font:l.property('ADBE Text Properties').property('ADBE Text Document').value.font});
  x+=r.width+15;
}
var wordEnd=x-15;
var index=text('Index 03','03',100),ir=index.sourceRectAtTime(0,false);
index.anchorPoint.setValue([ir.left,ir.top]);index.position.setValue([1510,500]);
keys(index.opacity,[42,56],[0,100]);
var rule=c.layers.addShape();rule.name='AFT17I Rule becomes slash';rule.motionBlur=true;
AE.rect(rule,[1,7],[0,0],{name:'Persistent rule',fill:blue});
var rp=rule.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').property('ADBE Vector Shape - Rect');
keys(rp.property('ADBE Vector Rect Size'),[0,12,72,90],[[24,7],[1100,7],[1100,7],[100,7]]);
keys(rule.position,[0,12,72,90,110],[[312,380],[850,380],[850,380],[1400,380],[1445,547]]);
keys(rule.rotation,[90,110],[0,-70]);
var payoff=text('Payoff','Notes in motion.',42),pr=payoff.sourceRectAtTime(0,false);
payoff.anchorPoint.setValue([pr.left,pr.top]);keys(payoff.position,[115,129],[[300,730],[300,714]]);keys(payoff.opacity,[115,129],[0,100]);
c.markerProperty.setValueAtTime(0,new MarkerValue('Assemble: one letterform at a time'));
c.markerProperty.setValueAtTime(72/30,new MarkerValue('Rule contracts; identity persists'));
c.markerProperty.setValueAtTime(110/30,new MarkerValue('Rule registers as slash beside 03'));
c.markerProperty.setValueAtTime(129/30,new MarkerValue('Readable final hold'));
c.time=5;c.openInViewer();
return {compId:c.id,layers:c.numLayers,glyphs:records,wordEnd:wordEnd,index:{id:index.id,x:1510,y:500,width:ir.width,height:ir.height},ruleId:rule.id,payoff:{id:payoff.id,width:pr.width,height:pr.height}};
