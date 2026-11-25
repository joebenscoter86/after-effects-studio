// piece: stage
// name: Lit stage for a face card beat
// does: Makes a vertical Advanced 3D comp with a dark ground, a backplate that catches light and shadow, a key with soft shadows, a fill, a slowly drifting camera and grain on the graphics only, all coloured by the style.
// use it for: every face card beat that puts lit 3D graphics above the speaker; graphics live in about y 220 to 1180
// job: add-depth; support: light-the-hero, establish-place
// provides: light: key; light: fill; camera: push; finish: grain; depth: shadow
// works with: piece-plate, piece-flip, piece-spot
// call: PCS.stage({ name, duration, env, stitch })
// option name: the new comp's name
// option duration: seconds
// option env: path to an environment light map (.hdr); default assets/studio-strips.hdr beside the pieces when it is there, else no environment light
// option stitch: { path, start } puts the speaker's clip in a rounded card at the bottom, starting at that time in the clip
// returns: { comp, backplate, key, fill, cam, grain, warnings }
// example:
//   PCS.use('example-warm-paper');
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5 });
// note: 2D layers (grain, the face card) stay on top; pieces seat new 3D layers under them by themselves.
// ---
PCS.need('spot');
PCS.stage = function (o) {
  var S = PCS.S;
  var comp = app.project.items.addComp(o.name, 1080, 1920, 1, o.duration, 30);
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
