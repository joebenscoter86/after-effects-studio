// eoBEBx1PbS4 technique 03: a shadowless parallel light as an extra backlight (rim), on 02's scene.
// args { prelude, scene }. Judge at comp time 0:00:02:21 (frame 69): environment light Y about 212.
// The technique's light is "TECH Parallel Light 1": switch it off for the before frame.
// VERIFY: Accepts Shadows Only = 2 on a solid's Material Options; Light Options names Intensity / Color / Casts Shadows / Shadow Darkness;
// VERIFY: a parallel light's Transform carries "Point of Interest"; extrusion direction (back, away from camera) so bases sit on the floor.
$.evalFile(args.prelude);
$.evalFile(args.scene);
var c = TIDES.comp("eoBE 03 rim");
var s = TIDES.set(c);
var w = TIDES.litWord(c, s.env);
// Recipe 03 steps 1-4: Parallel, Casts Shadows off, Position 2920,-100,2663.3, POI 960,540,0, Intensity 407 %, white.
var L = TIDES.rim(c, "TECH Parallel Light 1", 407);
var r = w.sourceRectAtTime(0, false);
return { comp: c.name, id: c.id, frames: Math.round(c.duration * c.frameRate), order: [c.layer(1).name, c.layer(2).name, c.layer(3).name, c.layer(4).name, c.layer(5).name].join(" / "), accepts: s.floor.property("ADBE Material Options Group").property("ADBE Accepts Shadows").value, wordWidth: r.width * 4.5 };
