// eoBEBx1PbS4 technique 03: a shadowless parallel light as an extra backlight (rim), on 02's scene.
// args { prelude, scene }. Judge at comp time 0:00:02:21 (frame 69): environment light Y about 212.
// The technique's light is "TECH Parallel Light 1" in comp "eoBE 03 rim 3D": for the before frame set its Intensity to 0
// (switching it off made the nested environment light throw a wrong, sideways shadow; run second).
// VERIFY: Accepts Shadows Only = 2 on a solid's Material Options; Light Options names Intensity / Color / Casts Shadows / Shadow Darkness;
// VERIFY: a parallel light's Transform carries "Point of Interest"; extrusion direction (back, away from camera) so bases sit on the floor.
$.evalFile(args.prelude);
$.evalFile(args.scene);
var c = P.freshComp("eoBE 03 rim", 1920, 1080, TIDES.FPS, 120 / TIDES.FPS, [0, 0, 0]); // 2D comp: 3D scene precomp + face texture + floor smoothing
// Second run: the scene carries 01's fallback look (tile on the front faces, paint-coloured bevels and sides).
var s = TIDES.texturedScene(c, "art eoBE 03", args.opts);
var w = s.word;
var main = c;
c = s.c3d; // the lights below go into the 3D scene comp
// Recipe 03 steps 1-4: Parallel, Casts Shadows off, Position 2920,-100,2663.3, POI 960,540,0, Intensity 407 %, white.
var L = TIDES.rim(c, "TECH Parallel Light 1", 407);
// SUBSTITUTE for the renderer's shadow sampling: floor smoothing on top (see tides-scene.jsx).
var sm = TIDES.floorSmooth(main, 719, (args.opts && args.opts.blur) || 10);
var r = w.sourceRectAtTime(0, false);
return { comp: main.name, scene: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), order: (function () { var a = [], i; for (i = 1; i <= c.numLayers; i++) a.push(c.layer(i).name); return a.join(" / "); })(), accepts: s.floor.property("ADBE Material Options Group").property("ADBE Accepts Shadows").value, wordWidth: r.width * 4.5 };
