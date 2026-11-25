// piece: room
// name: Lit room for a full-frame cutaway
// does: Makes the full-frame setting for a cutaway: a floor and a back wall, a key that casts shadows, a front fill, a cool wash on the wall and a two-node camera looking down into the room that pushes in slowly with depth of field, all coloured by the style.
// use it for: a cutaway beat where objects stand or lie in a place (documents on a floor, a device on a desk, chosen items standing up); never behind the speaker's face card
// job: establish-place; support: add-depth, move-camera, light-the-hero
// provides: environment: room; floor: ground; light: key; light: fill; camera: push; camera: depth-of-field; depth: shadow
// works with: piece-plate, piece-spot, piece-stand-up, piece-hand-over, piece-picture-face
// call: PCS.room({ name, duration, comp, t, dur, cam })
// option name, duration: a new comp's name and length in seconds
// option comp: build the room inside this comp instead (piece-hand-over does this); its lights then rise from 0 at t over dur
// option t, dur: with comp, when the room's lights come up (default 0) and over how long (0.8)
// option cam: with comp, the camera to take over from t; without it a new camera named 'cam' is made
// option camDur: with cam, how long the camera takes to reach the room's view, default dur
// returns: { comp, floor, wall, key, fill, wash, env, cam, floorY, stand(h, x, z), lie(x, z, depth) }
// example:
//   var rm = PCS.room({ name: 'CUTAWAY 2', duration: 5 });
//   var card = PCS.plate(rm.comp, { name: 'card', w: 560, h: 380, round: 30, tilt: [0, -10], pos: rm.stand(380, 540, 700) });
//   PCS.spot(rm.comp, { name: 'pool', on: card, from: 'above', t: 1.2, dimKey: 0.4 });
// note: colours come from the style: its wall and floor values when it has them, else the wall from its backplate and quiet colour and the floor from its backplate and surface. The wash takes its wash colour, else its fill colour.
// note: rm.stand(h, x, z) is the position for an upright plate h tall standing on the floor at x, z; rm.lie(x, z, depth) for one lying flat, face up (give it tilt [-90, 0]).
// note: a pool on something in the room comes from above (piece-spot with from: 'above'), so it also lights the floor around it; from the front it would splash the wall.
// note: the light picture is set for a 1080 x 1920 frame with the camera's own framing; objects read best between z 300 and 1600 on the floor.
// ---
PCS.need('spot');
PCS.room = function (o) {
  var S = PCS.S; var G = 'ADBE Light Options Group';
  var comp = o.comp; var made = !comp;
  if (made) {
    comp = app.project.items.addComp(o.name, 1080, 1920, 1, o.duration, 30);
    comp.bgColor = S.ground; comp.renderer = 'ADBE Calder';
    if (comp.renderer !== 'ADBE Calder') { throw new Error('Advanced 3D renderer did not take'); }
  }
  var t = o.t || 0; var dur = (o.dur === undefined) ? 0.8 : o.dur; var D = comp.duration;
  var floorY = 1500;
  var wallC = S.wall || PCS.mix(S.backplate, S.quiet, 0.3);
  var floorC = S.floor || PCS.mix(S.backplate, S.surface, 0.6);
  var floor = comp.layers.addSolid(floorC, 'room floor', 6000, 6000, 1); floor.threeDLayer = true;
  PCS.TG(floor).property('ADBE Position').setValue([540, floorY, 1200]); PCS.TG(floor).property('ADBE Rotate X').setValue(90);
  var wall = comp.layers.addSolid(wallC, 'room wall', 7000, 4000, 1); wall.threeDLayer = true;
  PCS.TG(wall).property('ADBE Position').setValue([540, -300, 3600]);
  var env = null; var envPath = PCS.dir + '/assets/studio-strips.hdr';
  try { env = comp.layer('env'); } catch (e0) { env = null; }
  if (!env && new File(envPath).exists) {
    var hdr = comp.layers.add(PCS.importOnce(envPath)); hdr.name = 'env-map'; hdr.enabled = false;
    env = comp.layers.addLight('env', [540, 960]);
    try { env.lightType = LightType.ENVIRONMENT; env.lightSource = hdr; } catch (e1) {}
    PCS.sp(env, G, 'ADBE Light Intensity', Math.round(S.envIntensity * 0.67));
  }
  var key = PCS.spot(comp, { name: 'key', pos: [-500, -900, -300], aim: [540, floorY, 900], color: S.keyColor, intensity: Math.round(S.keyIntensity * 0.62), cone: 62, feather: 100, shadow: true, darkness: 70, diffusion: 40 });
  var fill = PCS.spot(comp, { name: 'fill', pos: [250, 700, -1300], aim: [540, 1250, 230], color: S.fillColor, intensity: Math.round(S.fillIntensity * 0.95), cone: 55, feather: 100 });
  var wash = PCS.spot(comp, { name: 'wall wash', pos: [-600, -400, 2300], aim: [700, 0, 3600], color: S.washColor || S.fillColor, intensity: 170, cone: 80, feather: 100 });
  if (!made) {
    PCS.cutAt(PCS.TG(floor).property('ADBE Opacity'), 0, 0); PCS.cutAt(PCS.TG(floor).property('ADBE Opacity'), t, 100);
    PCS.cutAt(PCS.TG(wall).property('ADBE Opacity'), 0, 0); PCS.cutAt(PCS.TG(wall).property('ADBE Opacity'), t, 100);
    var ls = [key, fill, wash];
    for (var i = 0; i < ls.length; i++) { var I = ls[i].property(G).property('ADBE Light Intensity'); PCS.kf(I, [[t, 0], [t + dur, I.value]]); }
  }
  var cam = o.cam;
  var p0 = [540, 120, -1380]; var p1 = [540, 560, -1120]; var a0 = [540, 980, 760]; var a1 = [540, 1010, 300];
  var tc = made ? 0 : t + (o.camDur === undefined ? dur : o.camDur);
  if (!cam) { cam = comp.layers.addCamera('cam', [540, 960]); try { cam.property('ADBE Camera Options Group').property('ADBE Camera Zoom').setValue(1500); } catch (e2) {} }
  var CP = PCS.TG(cam).property('ADBE Position'); var CA = PCS.TG(cam).property('ADBE Anchor Point');
  if (made) { PCS.kf(CP, [[0, p0], [D, p1]]); PCS.kf(CA, [[0, a0], [D, a1]]); }
  else {
    PCS.kfFrom(CP, [[t, CP.valueAtTime(t, false)], [tc, p0], [Math.max(D, tc + 0.5), p1]]);
    PCS.kfFrom(CA, [[t, CA.valueAtTime(t, false)], [tc, a0], [Math.max(D, tc + 0.5), a1]]);
  }
  var CO = cam.property('ADBE Camera Options Group');
  try { CO.property('ADBE Camera Depth of Field').setValue(1); CO.property('ADBE Camera Aperture').setValue(6); CO.property('ADBE Camera Blur Level').setValue(100); } catch (e3) {}
  try {
    var F = CO.property('ADBE Camera Focus Distance');
    if (made) { PCS.kf(F, [[0, 2500], [D, 1500]]); } else { PCS.kfFrom(F, [[0, 1500], [t, 1500], [tc, 2500], [Math.max(D, tc + 0.5), 1500]]); }
  } catch (e4) {}
  if (made) {
    var fin = comp.layers.addSolid([1, 1, 1], 'grain', 1080, 1920, 1); fin.adjustmentLayer = true;
    try { var nz = fin.property('ADBE Effect Parade').addProperty('ADBE Noise'); nz.property(1).setValue(S.grain); nz.property(2).setValue(0); } catch (e5) {}
    if (!S.grain) { fin.enabled = false; }
    fin.moveToBeginning();
  }
  floor.moveToEnd(); wall.moveToEnd();
  return {
    comp: comp, floor: floor, wall: wall, key: key, fill: fill, wash: wash, env: env, cam: cam, floorY: floorY,
    stand: function (h, x, z) { return [x, floorY - h / 2 - 1, z]; },
    lie: function (x, z, depth) { return [x, floorY - (depth || 0) - 1, z]; }
  };
};
