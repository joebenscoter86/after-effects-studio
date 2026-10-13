// Evidence-led correction after draft sheet: crossed letter entrances and detached 03.
var c=AE.findCompByNameOrId('AFT17I | MARGIN | MASTER');
var rule=c.layer('AFT17I Rule becomes slash');
var sizes=rule.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').property('ADBE Vector Shape - Rect').property('ADBE Vector Rect Size');
sizes.setValueAtKey(2,[1000,7]);sizes.setValueAtKey(3,[1000,7]);
var pts=[[312,290],[800,290],[800,290],[1250,290],[1250,547]];
for(var i=1;i<=5;i++)rule.position.setValueAtKey(i,pts[i-1]);
c.layer('AFT17I Index 03').position.setValue([1330,517]);
var g=c.layer('AFT17I Glyph G');
for(var k=1;k<=g.position.numKeys;k++){var v=g.position.keyValue(k);v[1]-=4.046;g.position.setValueAtKey(k,v);}
return {ruleId:rule.id,rulePositions:pts,index:[1330,517],gOpticalOvershoot:4.046,layers:c.numLayers};
