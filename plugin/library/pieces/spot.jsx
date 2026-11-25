// piece: spot
// name: Spot light, or a pool of light on the hero
// does: Adds one spot light coloured by the style. Given an object (on), it lights that object from in front, up and to one side, with a pool sized to it, and can rise as the object arrives while the stage's key dips, so the lit thing is the one to look at.
// use it for: the one thing the line is about ("the light tells the story"); the key and fill of a stage
// job: light-the-hero; support: add-depth, reveal-headline
// provides: light: key; light: fill
// works with: piece-stage, piece-plate
// call: PCS.spot(comp, { name, on, from, t, dur, dimKey, pos, aim, color, intensity, cone, feather, shadow, darkness, diffusion })
// option on: a layer to light: aims at its centre from in front, up and to the left, cone sized to it, feather 50
// option from: with on, 'front' (default, for a face card stage) or 'above' (for a room: high above, so the pool also falls on the floor around it)
// option t, dur: the pool rises from 0 at t over dur seconds (default 0.8); without t it is on from the start
// option dimKey: 0 to 1, the stage key falls to this share of its strength over the same time (0.6 makes the pool read twice as strong)
// option intensity: percent; with on, by how light the object is: 1.5 x the style's key on a dark object, down to 0.75 x on a near-white one, so a pool reads on graphite and never clips cream; else 80
// option pos, aim: [x, y, z] where the light sits and the point it points at (without on)
// option cone, feather: cone angle in degrees (default 80, or sized to the object with on) and feather percent (90, or 50 with on)
// option color: default the style's key colour
// option shadow: true to cast shadows (darkness 60, diffusion 90 unless given)
// returns: the light layer
// example:
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5 });
//   var card = PCS.plate(st.comp, { name: 'card', w: 400, h: 520, round: 34, pos: [790, 720, 0] });
//   PCS.spot(st.comp, { name: 'pool', on: card, t: 2.6, dimKey: 0.6 });
// note: light the hero from the front but off the camera's line: from high above a pool only grazes a face and lights the wall behind; straight from the camera it puts a milky highlight over a glossy face and washes what is on it.
// note: never a point light near a glossy surface (it shows as a stray dot).
// ---
PCS.spot = function (comp, o) {
  var G = 'ADBE Light Options Group'; var S = PCS.S;
  var aim = o.aim; var pos = o.pos; var cone = o.cone; var feather = o.feather;
  var full = (o.intensity === undefined) ? (o.on ? Math.round(S.keyIntensity * PCS.poolShare(o.on)) : 80) : o.intensity;
  if (o.on) {
    var c = PCS.toWorld(o.on, [0, 0, 0], o.t || 0);
    var half = 0.2 * (PCS.num(o.on, 'w', 400) + PCS.num(o.on, 'h', 400));   // about the object's half-size
    var r; var dist;
    if (o.from === 'above') { aim = [c[0], c[1] + 0.6 * half, c[2]]; pos = [c[0] - 150, c[1] - 1100, c[2] - 450]; r = 1.9 * half; dist = 1200; }
    // In front, up and to the left: off the camera's line, so a glossy face's highlight never sits in its middle as a white blob.
    else { aim = [c[0], c[1], c[2]]; pos = [c[0] - 700, c[1] - 600, c[2] - 900]; r = half; dist = 1288; }   // the pool sits on it, not around it
    if (cone === undefined) { cone = Math.min(90, 2 * Math.atan(r / dist) * 180 / Math.PI + 4); }
    if (feather === undefined) { feather = 50; }
  }
  var L = comp.layers.addLight(o.name || 'spot', [540, 960]); L.lightType = LightType.SPOT;
  PCS.TG(L).property('ADBE Position').setValue(pos);
  try { PCS.TG(L).property('ADBE Anchor Point').setValue(aim); } catch (e) {}
  PCS.sp(L, G, 'ADBE Light Color', o.color || S.keyColor);
  PCS.sp(L, G, 'ADBE Light Intensity', full);
  PCS.sp(L, G, 'ADBE Light Cone Angle', cone || 80); PCS.sp(L, G, 'ADBE Light Cone Feather 2', feather === undefined ? 90 : feather);
  PCS.sp(L, G, 'ADBE Casts Shadows', o.shadow ? 1 : 0);
  if (o.shadow) { PCS.sp(L, G, 'ADBE Light Shadow Darkness', o.darkness || 60); PCS.sp(L, G, 'ADBE Light Shadow Diffusion', o.diffusion || 90); }
  var d = o.dur || 0.8;
  if (o.t !== undefined) { PCS.kf(L.property(G).property('ADBE Light Intensity'), [[o.t, 0], [o.t + d, full]]); }
  if (o.dimKey !== undefined) {
    var key = null; try { key = comp.layer('key'); } catch (e2) {}
    if (key) {
      var ki = key.property(G).property('ADBE Light Intensity'); var k0 = ki.valueAtTime(o.t || 0, false);
      PCS.kfFrom(ki, [[o.t || 0, k0], [(o.t || 0) + d, k0 * o.dimKey]]);
    } else { PCS.warnings.push('spot dimKey: no layer named "key" in ' + comp.name); }
  }
  return L;
};
// How strong a pool should be on this object, as a share of the style's key: 1.5 on a dark face (luminance 0.3 or less),
// 0.75 on a near-white one (0.85 or more), in between by luminance. Set by render with the light off the camera's line:
// graphite lifts with its rows still short of white, cream lifts without clipping. The face colour is the plate's fill, else the style's surface.
PCS.poolShare = function (layer) {
  var c = PCS.S.surface;
  try { c = layer.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').property('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').value; } catch (e) {}
  var lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  var k = (lum - 0.3) / 0.55; k = Math.max(0, Math.min(1, k));
  return 1.5 - 0.75 * k;
};
