/* Function body for eval.run; ES3; AUTHORING ONLY, not executed in this test.
   Adds exactly one owned comp and native layers; no file I/O, project switching,
   saving, clearing, closing, viewer activation, undo-group nesting or imports. */
if (!app.project) throw new Error("An open AE project is required; this build will not create or switch projects.");
var stamp = (new Date()).getTime().toString() + "_" + Math.floor(Math.random() * 100000).toString();
var name = "AES_InboxReview_" + stamp;
var suffix = 0, collision = true, n;
while (collision) {
    collision = false;
    for (n = 1; n <= app.project.numItems; n++) {
        if (app.project.item(n).name === name) { collision = true; break; }
    }
    if (collision) { suffix++; name = "AES_InboxReview_" + stamp + "_" + suffix; }
}
var comp = app.project.items.addComp(name, 1280, 720, 1, 9, 30);
var prefix = "IR_" + stamp + "_";
var C = {bg:[0.1333,0.0588,0.1647], ivory:[0.9686,0.9373,0.8706], mint:[0.4471,1,0.7569], panel:[0.1961,0.1059,0.2314]};
comp.bgColor = C.bg;
comp.motionBlur = true;
comp.shutterAngle = 120;
comp.shutterPhase = -60;
var fontReadbacks = [];
function T(f) { return f / 30; }
function tr(layer, key) { return layer.property("ADBE Transform Group").property(key); }
function animate(prop, frames, vals, kind) {
    var i,j,k,dims,ins,outs,ii,oi;
    for (i=0;i<frames.length;i++) prop.setValueAtTime(T(frames[i]),vals[i]);
    for (i=0;i<frames.length;i++) {
        k=prop.nearestKeyIndex(T(frames[i]));
        if(kind === "linear") {
            prop.setInterpolationTypeAtKey(k,KeyframeInterpolationType.LINEAR,KeyframeInterpolationType.LINEAR);
        } else {
            dims=((prop.propertyValueType===PropertyValueType.TwoD || prop.propertyValueType===PropertyValueType.ThreeD)) ? prop.value.length : 1;
            ii=kind==="travel"?82:kind==="exit"?12:85;
            oi=kind==="travel"?82:kind==="exit"?75:28;
            ins=[];outs=[];
            for(j=0;j<dims;j++){ins.push(new KeyframeEase(0,ii));outs.push(new KeyframeEase(0,oi));}
            prop.setInterpolationTypeAtKey(k,KeyframeInterpolationType.BEZIER,KeyframeInterpolationType.BEZIER);
            prop.setTemporalEaseAtKey(k,ins,outs);
        }
        if(prop.propertyValueType===PropertyValueType.TwoD_SPATIAL || prop.propertyValueType===PropertyValueType.ThreeD_SPATIAL){
            prop.setSpatialAutoBezierAtKey(k,false);
            var tangent=[];for(var axis=0;axis<prop.value.length;axis++)tangent.push(0);
            prop.setSpatialTangentsAtKey(k,tangent,tangent);
        }
    }
}
function base(label,x,y,start,end) {
    var l=comp.layers.addShape();l.name=prefix+label;
    tr(l,"ADBE Anchor Point").setValue([0,0]);
    tr(l,"ADBE Position").setValue([x,y]);
    l.inPoint=T(start||0);l.outPoint=T(end===undefined?270:end);
    return l;
}
function content(layer,group) {return layer.property("ADBE Root Vectors Group").property(group).property("ADBE Vectors Group");}
function pathGroup(layer,label,pts,closed,fill,stroke,width) {
    var root=layer.property("ADBE Root Vectors Group");
    var g=root.addProperty("ADBE Vector Group");g.name=label;g.moveTo(1);
    var path=content(layer,label).addProperty("ADBE Vector Shape - Group");path.name="Geometry";
    var s=new Shape();s.vertices=pts;s.closed=closed;s.inTangents=[];s.outTangents=[];
    for(var i=0;i<pts.length;i++){s.inTangents.push([0,0]);s.outTangents.push([0,0]);}
    content(layer,label).property("Geometry").property("ADBE Vector Shape").setValue(s);
    if(fill){content(layer,label).addProperty("ADBE Vector Graphic - Fill");content(layer,label).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(fill);}
    if(stroke){content(layer,label).addProperty("ADBE Vector Graphic - Stroke");content(layer,label).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Color").setValue(stroke);content(layer,label).property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width").setValue(width||2);}
    return label;
}
function draw(layer,label,a,b) {
    content(layer,label).addProperty("ADBE Vector Filter - Trim");
    animate(content(layer,label).property("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"),[a,b],[0,100],"travel");
}
function groupOpacity(layer,label){return layer.property("ADBE Root Vectors Group").property(label).property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity");}
function rect(label,x,y,w,h,fill,stroke,start,end) {
    var l=base(label,x,y,start,end);
    pathGroup(l,"Rectangle",[[0,0],[w,0],[w,h],[0,h]],true,fill,stroke,2);
    return l;
}
function line(label,pts,color,width,a,b,end){var l=base(label,0,0,a,end);pathGroup(l,"Line",pts,false,null,color,width);if(b!==undefined)draw(l,"Line",a,b);return l;}
function label(text,x,y,size,color,start,end,maxWidth) {
    var l=comp.layers.addText(text);l.name=prefix+"Type_"+text;
    var st=l.property("ADBE Text Properties").property("ADBE Text Document");
    var td=st.value;td.font="ArialMT";td.fontSize=size;td.applyFill=true;td.fillColor=color;td.applyStroke=false;td.justification=ParagraphJustification.LEFT_JUSTIFY;st.setValue(td);
    var r=l.sourceRectAtTime(0,false);
    if(maxWidth && r.width>maxWidth){td=st.value;td.fontSize=size*maxWidth/r.width;st.setValue(td);r=l.sourceRectAtTime(0,false);}
    tr(l,"ADBE Anchor Point").setValue([r.left,r.top]);tr(l,"ADBE Position").setValue([x,y]);
    l.inPoint=T(start||0);l.outPoint=T(end===undefined?270:end);
    fontReadbacks.push({text:text,font:st.value.font,size:st.value.fontSize,width:r.width});
    return l;
}
function reveal(l,f){animate(tr(l,"ADBE Opacity"),[f,f+3],[0,100],"linear");}
// All coordinates are explicit comp pixels. Actual opaque ground, not only bgColor.
rect("Ground",0,0,1280,720,C.bg,null,0,270);
var sourcePanel=rect("ReviewSurface",64,218,744,220,C.panel,null,0,270);
reveal(sourcePanel,4);
line("ReviewBaseline",[[64,438],[808,438]],C.ivory,2,0,18,270);
var title=label("Inbox review",64,59,44,C.ivory,0,270,750);reveal(title,0);
var demo=label("FICTIONAL EXAMPLE",986,74,17,C.mint,6,270,230);reveal(demo,6);
var sourceTitle=label("6 requests",64,171,27,C.ivory,10,174,700);reveal(sourceTitle,10);
// The receiving space draws while the viewer still sees the original set.
var dest=rect("NextWorkspaceOutline",870,218,346,220,null,C.mint,134,270);
draw(dest,"Rectangle",134,150);
var destTitle=label("Next workspace",870,171,27,C.ivory,136,270,346);reveal(destTitle,136);
var deferredPanel=rect("DeferredSurface",64,497,744,148,C.panel,null,82,270);reveal(deferredPanel,82);
var deferredTitle=label("Deferred",84,466,24,C.ivory,82,139,690);reveal(deferredTitle,82);
var scan=line("ReviewScan",[[100,241],[100,415]],C.mint,3,78,82,126);
animate(tr(scan,"ADBE Position"),[78,122],[[0,0],[660,0]],"linear");
animate(tr(scan,"ADBE Opacity"),[122,125],[100,0],"linear");
var scanning=label("Reviewing",650,171,21,C.mint,76,126,158);reveal(scanning,76);
var xs=[128,250,372,494,616,738];
var deferredXs=[148,336,524,712];var deferredIndex=0;
var docReadbacks=[];
for(var i=0;i<6;i++) {
    var id="R0"+(i+1),entry=22+i*5,hit=Math.round(78+(xs[i]-100)/660*44),keep=(i===1||i===4);
    var doc=base("Request_"+id,xs[i],282,entry,270);doc.motionBlur=true;
    var poly=[[-46,-62],[24,-62],[46,-40],[46,62],[-46,62]];
    pathGroup(doc,"Surface",poly,true,C.ivory,null,0);
    animate(groupOpacity(doc,"Surface"),[entry+6,entry+12],[0,100],"linear");
    pathGroup(doc,"Outline",poly,true,null,C.ivory,2);draw(doc,"Outline",entry,entry+11);
    pathGroup(doc,"Fold",[[24,-62],[24,-40],[46,-40]],false,null,C.bg,2);draw(doc,"Fold",entry+8,entry+15);
    pathGroup(doc,"DetailA",[[-28,10],[27,10]],false,null,C.bg,3);draw(doc,"DetailA",entry+9,entry+17);
    pathGroup(doc,"DetailB",[[-28,24],[11,24]],false,null,C.bg,3);draw(doc,"DetailB",entry+12,entry+20);
    var idLayer=label(id,0,0,24,C.bg,entry+9,270,62);idLayer.parent=doc;tr(idLayer,"ADBE Position").setValue([-29,-28]);reveal(idLayer,entry+9);idLayer.motionBlur=true;
    if(keep){
        animate(tr(doc,"ADBE Position"),[entry,entry+14,(i===1?152:143),(i===1?174:164)],[[xs[i],282],[xs[i],330],[xs[i],330],[i===1?964:1122,330]],"travel");
        animate(content(doc,"Surface").property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color"),[hit,hit+3],[C.ivory,C.mint],"linear");
        pathGroup(doc,"ApprovedCheck",[[-9,44],[-2,51],[12,36]],false,null,C.bg,3);draw(doc,"ApprovedCheck",hit+2,hit+8);
        animate(tr(doc,"ADBE Scale"),[hit,hit+3,hit+9],[ [100,100],[106,106],[100,100]],"linear");
    }else{
        var dx=deferredXs[deferredIndex];deferredIndex++;
        animate(tr(doc,"ADBE Position"),[entry,entry+14,hit+3,hit+21],[[xs[i],282],[xs[i],330],[xs[i],330],[dx,571]],"travel");
        animate(tr(doc,"ADBE Scale"),[hit+3,hit+21],[[100,100],[74,74]],"travel");
        animate(tr(doc,"ADBE Opacity"),[hit+3,hit+21],[100,62],"linear");
        animate(tr(idLayer,"ADBE Opacity"),[hit+3,hit+21],[100,78],"linear");
    }
    docReadbacks.push({id:id,approved:keep,entryFrame:entry,scanHitFrame:hit,destination:keep?"Next workspace":"Deferred"});
}
// Retain the same document layers, IDs, fold and check during the carry.
// There are no duplicate target documents and no hidden source copy to clean up.
var four=label("4 deferred",84,466,24,C.ivory,139,270,690);reveal(four,139);
var two=label("2 approved",870,502,38,C.mint,177,270,346);reveal(two,177);
var carried=label("Carried forward",872,554,25,C.ivory,181,270,340);reveal(carried,181);
var resolved=label("Review complete",64,171,27,C.ivory,174,270,744);reveal(resolved,174);
var summary=label("6 reviewed  /  4 deferred  /  2 approved",64,668,23,C.ivory,187,270,1152);reveal(summary,187);
// Final landing cue localized to receiving boundary, not the camera or all type.
animate(content(dest,"Rectangle").property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Width"),[174,177,184],[2,4,2],"linear");
return {compIds:[comp.id],compName:comp.name,width:comp.width,height:comp.height,duration:comp.duration,fps:comp.frameRate,layerCount:comp.numLayers,requests:docReadbacks,fontReadbacks:fontReadbacks,reviewFrames:[0,14,43,68,82,94,111,122,142,148,158,169,173,184,210,269],buildCompleted:true};
