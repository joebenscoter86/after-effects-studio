// piece: spot
// name: Spot light, or a pool of light on the hero
// does: Adds one spot light coloured by the style. Given an object (on), it lights that object from in front, up and to one side, with a pool sized to it that follows the object wherever it moves and goes out when the object is hidden or tips away; it can rise as the object arrives while the stage's key dips, so the lit thing is the one to look at.
// use it for: the one thing the line is about ("the light tells the story"); a light that keeps rising on a held picture; the key and fill of a stage
// job: light-the-hero; support: add-depth, reveal-headline, keep-it-alive
// provides: light: key; light: fill
// works with: piece-stage, piece-plate, piece-hide, piece-move
// call: PCS.spot(comp, { name, on, from, t, dur, dimKey, pos, aim, color, intensity, cone, feather, shadow, darkness, diffusion })
// option on: a layer to light: aims at its centre from in front, up and to the left, cone sized to it, feather 75. The light follows the layer (moves added before or after are both followed) and its pool grows and shrinks with it, is off while the layer is hidden or out of its time, and in front its light stops just past the object, so no pool is left on the wall behind
// option from: with on, 'front' (default, for a face card stage) or 'above' (for a room: high above, so the pool also falls on the floor around it)
// option t, dur: the pool rises from 0 at t over dur seconds (default 0.8); without t it is on from the start. A long dur (3 or more) is a light that keeps rising, which keeps a held picture alive
// option dimKey: 0 to 1, the stage's key and fill fall to this share of their strength over the same time (0.6 makes the pool read twice as strong)
// option intensity: percent; with on, by how light the object is and how much light already reaches it: 1.0 x the style's key plus fill on a dark object, down to 0.5 x on a near-white or fully saturated one, so a pool reads on graphite and never clips cream; else 80
// option pos, aim: [x, y, z] where the light sits and the point it points at (without on)
// option cone, feather: cone angle in degrees (default 80, or sized to the object with on) and feather percent (90, or 75 with on)
// option color: default the style's key colour
// option shadow: true to cast shadows (darkness 60, diffusion 90 unless given)
// returns: the light layer
// example:
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5 });
//   var card = PCS.plate(st.comp, { name: 'card', w: 400, h: 520, round: 34, pos: [790, 720, 0] });
//   PCS.spot(st.comp, { name: 'pool', on: card, t: 2.6, dimKey: 0.6 });
// note: one pool, on the one hero. Light it from the front but off the camera's line: from high above a pool only grazes a face and lights the wall behind; straight from the camera it puts a milky highlight over a glossy face and washes what is on it.
// note: hiding or tipping the object away takes its pool with it; to end a pool by itself, PCS.hideAfter(light, t).
// note: never a point light near a glossy surface (it shows as a stray dot).
// ---
PCS.spot = function (comp, o) {
  var G = 'ADBE Light Options Group'; var S = PCS.S;
  var aim = o.aim; var pos = o.pos; var cone = o.cone; var feather = o.feather;
  var full = (o.intensity === undefined) ? (o.on ? Math.round((S.keyIntensity + S.fillIntensity) * PCS.poolShare(o.on)) : 80) : o.intensity;
  var follow = null;
  if (o.on) {
    var c = PCS.toWorld(o.on, [0, 0, 0], o.t || 0);
    var half = 0.2 * (PCS.num(o.on, 'w', 400) + PCS.num(o.on, 'h', 400));   // about the object's half-size
    var r; var dist; var off; var aimOff;
    if (o.from === 'above') { aimOff = [0, 0.6 * half, 0]; off = [-150, -1100, -450]; r = 1.9 * half; dist = 1200; }
    // In front, up and to the left: off the camera's line, so a glossy face's highlight never sits in its middle as a white blob.
    else { aimOff = [0, 0, 0]; off = [-700, -600, -900]; r = half; dist = 1288; }   // the pool sits on it, not around it
    aim = [c[0] + aimOff[0], c[1] + aimOff[1], c[2] + aimOff[2]]; pos = [c[0] + off[0], c[1] + off[1], c[2] + off[2]];
    if (cone === undefined) { cone = Math.min(90, 2 * Math.atan(r / dist) * 180 / Math.PI + 4); }
    if (feather === undefined) { feather = 75; }
    follow = { ref: PCS.ref(o.on), off: off, aimOff: aimOff, reach: o.from === 'above' ? 0 : dist + half + PCS.depthOf(o.on) + 60, grow: o.cone === undefined };
  }
  var L = comp.layers.addLight(o.name || 'spot', [540, 960]); L.lightType = LightType.SPOT;
  PCS.TG(L).property('ADBE Position').setValue(pos);
  try { PCS.TG(L).property('ADBE Anchor Point').setValue(aim); } catch (e) {}
  PCS.sp(L, G, 'ADBE Light Color', o.color || S.keyColor);
  PCS.sp(L, G, 'ADBE Light Intensity', full);
  PCS.sp(L, G, 'ADBE Light Cone Angle', cone || 80); PCS.sp(L, G, 'ADBE Light Cone Feather 2', feather === undefined ? 90 : feather);
  PCS.sp(L, G, 'ADBE Casts Shadows', o.shadow ? 1 : 0);
  if (o.shadow) { PCS.sp(L, G, 'ADBE Light Shadow Darkness', o.darkness || 60); PCS.sp(L, G, 'ADBE Light Shadow Diffusion', o.diffusion || 90); }
  if (follow) {
    var v3 = function (a) { return '[' + a[0] + ',' + a[1] + ',' + a[2] + ']'; };
    var at = 'var L = ' + follow.ref + '; L.toWorld([0,0,0])';
    PCS.TG(L).property('ADBE Position').expression = at + ' + ' + v3(follow.off) + ';';
    try { PCS.TG(L).property('ADBE Anchor Point').expression = at + ' + ' + v3(follow.aimOff) + ';'; } catch (e3) {}
    // Off while the object is hidden (its opacity) or out of its time; hide and tip-away cut the opacity.
    L.property(G).property('ADBE Light Intensity').expression = 'var L = ' + follow.ref + '; L.active ? value * L.transform.opacity / 100 : 0;';
    if (follow.grow) {   // the pool keeps its size on the object as the object grows or shrinks (piece-move, piece-land-on)
      L.property(G).property('ADBE Light Cone Angle').expression = 'var s = ' + follow.ref + '.transform.scale[0] / 100; var h = (value - 4) / 2 * Math.PI / 180; Math.min(90, 2 * Math.atan(Math.tan(h) * s) * 180 / Math.PI + 4);';
    }
    if (follow.reach) {   // the light stops just past the object: nothing reaches the backplate behind it
      PCS.sp(L, G, 'ADBE Light Falloff Type', 2); PCS.sp(L, G, 'ADBE Light Falloff Start', Math.round(follow.reach)); PCS.sp(L, G, 'ADBE Light Falloff Distance', 250);
    }
  }
  var d = o.dur || 0.8;
  if (o.t !== undefined) { PCS.kf(L.property(G).property('ADBE Light Intensity'), [[o.t, 0], [o.t + d, full]]); }
  if (o.dimKey !== undefined) {   // the stage's key and fill dip together, so the pool is what lights the hero
    var dimmed = 0; var names = ['key', 'fill'];
    for (var di = 0; di < names.length; di++) {
      var sl = null; try { sl = comp.layer(names[di]); } catch (e2) {}
      if (!sl || !(sl instanceof LightLayer)) { continue; }
      var ki = sl.property(G).property('ADBE Light Intensity'); var k0 = ki.valueAtTime(o.t || 0, false);
      PCS.kfFrom(ki, [[o.t || 0, k0], [(o.t || 0) + d, k0 * o.dimKey]]); dimmed++;
    }
    if (!dimmed) { PCS.warnings.push('spot dimKey: no light named "key" or "fill" in ' + comp.name); }
  }
  return L;
};
// How strong a pool should be on this object, as a share of the light already on it (the style's key plus fill): 1.02 on
// a dark face, 0.51 on a near-white or fully saturated one, in between by its brightest channel (0.3 to 0.85): a channel
// at full strength clips first, so a vermilion takes the gentler pool that cream does. (Until the house
// tune of 2026-11-24 this was 1.5 to 0.75 of the key alone: the same pool where the fill was 80, but too faint once the
// fill was raised to lift graphite.) Set by render with the light off the camera's line:
// graphite lifts with its rows still short of white, cream lifts without clipping. The face colour is the one the plate
// was named with (its hi= note; the fill itself may be capped by the style's litCap), else its fill, else the surface.
PCS.poolShare = function (layer) {
  var c = PCS.S.surface;
  try { c = layer.property('ADBE Root Vectors Group').property(1).property('ADBE Vectors Group').property('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').value; } catch (e) {}
  var hi = PCS.num(layer, 'hi', Math.max(c[0], c[1], c[2]));
  var k = (hi - 0.3) / 0.55; k = Math.max(0, Math.min(1, k));
  return 1.02 - 0.51 * k;
};
