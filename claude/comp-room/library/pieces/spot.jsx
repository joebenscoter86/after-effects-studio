// piece: spot
// name: Spot light
// does: Adds one spot light aimed at a point, coloured by the style, with soft shadows when asked.
// use it for: the key and fill of a stage; a pool of light that rises on the hero as it arrives ("the light tells the story")
// job: light-the-hero; support: add-depth
// provides: light: key; light: fill
// works with: piece-stage, piece-plate
// call: PCS.spot(comp, { name, pos, aim, color, intensity, cone, shadow, darkness, diffusion })
// option pos: [x, y, z] where the light sits
// option aim: [x, y, z] the point it points at
// option color: light colour; default the style's key colour
// option intensity: percent, default 80. Key it from 0 for a pool that rises on the hero
// option cone: cone angle in degrees, default 80 (feather 90)
// option shadow: true to cast shadows (darkness 60, diffusion 90 unless given)
// returns: the light layer
// example:
//   var st = PCS.stage({ name: 'BEAT 3', duration: 5 });
//   var pool = PCS.spot(st.comp, { name: 'pool', pos: [540, 300, -900], aim: [540, 900, 0], intensity: 0, cone: 60 });
//   PCS.kf(pool.property('ADBE Light Options Group').property('ADBE Light Intensity'), [[2.6, 0], [3.6, 60]]);
// note: never a point light near a glossy surface (it shows as a stray dot).
// ---
PCS.spot = function (comp, o) {
  var S = comp.layers.addLight(o.name || 'spot', [540, 960]); S.lightType = LightType.SPOT;
  PCS.TG(S).property('ADBE Position').setValue(o.pos);
  try { PCS.TG(S).property('ADBE Anchor Point').setValue(o.aim); } catch (e) {}
  var G = 'ADBE Light Options Group';
  PCS.sp(S, G, 'ADBE Light Color', o.color || PCS.S.keyColor);
  PCS.sp(S, G, 'ADBE Light Intensity', o.intensity === undefined ? 80 : o.intensity);
  PCS.sp(S, G, 'ADBE Light Cone Angle', o.cone || 80); PCS.sp(S, G, 'ADBE Light Cone Feather 2', 90);
  PCS.sp(S, G, 'ADBE Casts Shadows', o.shadow ? 1 : 0);
  if (o.shadow) { PCS.sp(S, G, 'ADBE Light Shadow Darkness', o.darkness || 60); PCS.sp(S, G, 'ADBE Light Shadow Diffusion', o.diffusion || 90); }
  return S;
};
