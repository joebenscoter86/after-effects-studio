// piece: stage
// name: Lit stage for a face card beat
// does: Makes a vertical Advanced 3D comp with a dark ground, a backplate that catches light and shadow, a key with soft shadows, a fill, a slowly drifting camera and grain on the graphics only, all coloured by the style.
// use it for: every face card beat that puts lit 3D graphics above the speaker; a held picture that keeps moving (its camera drifts slowly for the whole comp)
// job: add-depth; support: light-the-hero, establish-place, keep-it-alive
// provides: light: key; light: fill; camera: push; finish: grain; depth: shadow
// works with: piece-plate, piece-flip, piece-spot
// call: PCS.stage({ name, duration, env, stitch, replace })
// option name: the new comp's name
// option duration: seconds
// option env: path to an environment light map (.hdr); default assets/studio-strips.hdr beside the pieces when it is there, else no environment light
// option stitch: { path, start } puts the speaker's clip in a rounded card at the bottom, starting at that time in the clip
// option replace: true rebuilds the comp in its place: an earlier comp of this name is removed first, with its solids, nulls and the light map it brought in (footage from elsewhere, such as the speaker's clip, stays), and the new one goes in the same folder; for look-and-fix rounds. It refuses a comp used inside another
// returns: { comp, backplate, key, fill, cam, grain, warnings }
// example:
//   PCS.use('example-warm-paper');
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5, replace: true });
// note: 2D layers (grain, the face card) stay on top; pieces seat new 3D layers under them by themselves.
// note: read before placing anything. Graphics live on screen in y 220 to 1180, above the speaker's card (its top edge is at screen y 1360); fill that area: no more than about a fifth of it empty, so make objects big.
// note: one hero per picture: bigger, nearer, or in the pool of light (piece-spot). Two equal plates means no hero.
// note: those numbers are on screen; the positions you give are the comp's, and the camera (low, left of centre, drifting) shows an object at depth 0 higher than its comp y: about 50 px in the lower half and 60 to 80 px near the top. So screen y 220 to 1180 is comp y about 285 to 1230 at depth 0. Objects also lean differently at the top and bottom. Check a placing with PCS.onScreen(layer, null, t), which gives [x, y] on screen, or a render, not by arithmetic.
// note: type on a plate is flat (piece-label); only a hero word is an object (piece-type3d). Move things off with piece-tip-away, never a fade.
// note: the camera's slow drift keeps a held picture alive by itself; a pool that keeps rising (piece-spot, long dur) adds to it. No other motion is needed to hold.
// ---
PCS.need('spot');
PCS.stage = function (o) {
  var S = PCS.S; var folder = null; var same = [];
  for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name === o.name) { same.push(it); } }
  if (same.length && !o.replace) { PCS.warnings.push('stage: a comp named "' + o.name + '" already exists; pass replace: true to rebuild it in its place'); }
  if (same.length && o.replace) {
    for (var u = 0; u < same.length; u++) { if (same[u].usedIn.length) { throw new Error('stage: "' + o.name + '" is used inside ' + same[u].usedIn[0].name + ', so it was not replaced'); } }
    folder = same[0].parentFolder;
    for (var r = 0; r < same.length; r++) { PCS.removeComp(same[r]); }
  }
  var comp = app.project.items.addComp(o.name, 1080, 1920, 1, o.duration, 30);
  if (folder && folder !== app.project.rootFolder) { comp.parentFolder = folder; }
  comp.bgColor = S.ground;
  comp.renderer = 'ADBE Calder';
  if (comp.renderer !== 'ADBE Calder') { throw new Error('Advanced 3D renderer did not take'); }
  var bp = comp.layers.addSolid(S.backplate, 'backplate', 5000, 5000, 1);
  bp.threeDLayer = true; PCS.TG(bp).property('ADBE Position').setValue([540, 700, 520]);
  var envPath = o.env || (PCS.dir + '/assets/studio-strips.hdr');
  if (new File(envPath).exists) {
    var hdr = comp.layers.add(PCS.importOnce(envPath)); hdr.name = 'env-map'; hdr.enabled = false;
    var env = comp.layers.addLight('env', [540, 960]);
    try { env.lightType = LightType.ENVIRONMENT; env.lightSource = hdr; } catch (e) {}
    PCS.sp(env, 'ADBE Light Options Group', 'ADBE Light Intensity', S.envIntensity);
  } else { PCS.warnings.push('No environment light map at ' + envPath + ': stage built without one'); }
  var key = PCS.spot(comp, { name: 'key', pos: [-250, -250, -1100], aim: [540, 750, 520], color: S.keyColor, intensity: S.keyIntensity, shadow: true });
  var fill = PCS.spot(comp, { name: 'fill', pos: [900, 900, -1300], aim: [540, 950, 0], color: S.fillColor, intensity: S.fillIntensity });
  if (S.fillReach) {   // the fill lifts the objects and stops before the backplate, so they separate from it
    var FG = 'ADBE Light Options Group';
    PCS.sp(fill, FG, 'ADBE Light Falloff Type', 2); PCS.sp(fill, FG, 'ADBE Light Falloff Start', S.fillReach); PCS.sp(fill, FG, 'ADBE Light Falloff Distance', 250);
  }
  var cam = comp.layers.addCamera('cam', [540, 960]);
  var d = o.duration;
  PCS.kf(PCS.TG(cam).property('ADBE Position'), [[0, [400, 950, -1500]], [d, [470, 965, -1470]]]);
  try { PCS.TG(cam).property('ADBE Anchor Point').setValue([540, 1010, 0]); } catch (e2) {}
  try { cam.property('ADBE Camera Options Group').property('ADBE Camera Zoom').setValue(1500); } catch (e3) {}
  try { cam.property('ADBE Camera Options Group').property('ADBE Camera Depth of Field').setValue(0); } catch (e4) {}
  var fin = comp.layers.addSolid([1, 1, 1], 'grain', 1080, 1920, 1); fin.adjustmentLayer = true;
  try { var nz = fin.property('ADBE Effect Parade').addProperty('ADBE Noise'); nz.property(1).setValue(S.grain); nz.property(2).setValue(0); } catch (e5) {}
  if (!S.grain) { fin.enabled = false; }
  fin.moveToBeginning();
  if (o.stitch) {
    var J = comp.layers.add(PCS.importOnce(o.stitch.path)); J.name = 'face card'; J.startTime = -o.stitch.start;
    PCS.TG(J).property('ADBE Scale').setValue([81, 81]);
    PCS.TG(J).property('ADBE Anchor Point').setValue([540, 560]);
    PCS.TG(J).property('ADBE Position').setValue([540, 1360]);
    var mk = J.property('ADBE Mask Parade').addProperty('ADBE Mask Atom');
    mk.property('ADBE Mask Shape').setValue(AE.geometryShape('rect', [540, 930], [1040, 740], 56));
    J.moveToBeginning();
  }
  bp.moveToEnd();
  return { comp: comp, backplate: bp, key: key, fill: fill, cam: cam, grain: fin, warnings: PCS.warnings };
};
