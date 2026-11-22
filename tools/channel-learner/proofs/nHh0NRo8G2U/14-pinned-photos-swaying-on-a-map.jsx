// nHh0NRo8G2U technique 14: three instant-photo prints, each hung from a red pushpin at its top centre, rock a few
// degrees around their pins (Rotation wiggle(.5,10)) over a greyed, contrasty map; the pins and the map stay still
// (recipe 14). Map precomp "nHh0 14 map" the size of the map plate, cover-fitted into the tall comp 1080 x 1920,
// 23.976 fps, 6 s.
// args: prelude; optional artDir (map.png, photo-1.png ... photo-3.png, pin.png), places ([[x, y] x3] in plate pixels:
// North America, western Europe, Asia). Art run: prints ([{ file, pin, scale, pinScale, name }] plate px), sceneScale
// (map precomp Scale %), focus ([x, y] plate px at the frame centre) or framePos.
//
// VERIFY: each print swings about its pin (anchor at the pin point), never about its own centre; pins do not move
// VERIFY: the prints and pins stay in full colour (above the grade); the plate turns grey with deep ink and bright paper
// VERIFY: return.report: prints are 38, 49 and 46 px wide in the frame (3.5 / 4.5 / 4.3 % of 1080) - small, as the recipe measures; scale NHM.PRINT_FRAC if the brief wants them bigger
$.evalFile(args.prelude);
var DIR = args.libDir || (new File(args.prelude)).parent.fsName;   // the libraries sit beside the prelude
$.evalFile(DIR + "/art.jsx");
$.evalFile(DIR + "/nh-core-lib.jsx");
$.evalFile(DIR + "/nh-map-lib.jsx");

var FRAMES = 144; // ASSUMED: 6 s of sway (no keys; comp length unknown)
var c = NH.scene("nHh0 14 pinned photos", FRAMES);
// Art run: args.prints (brief specs, plate px) switch to the brief-driven builder; args.sceneScale scales the whole scene.
var m = args.prints ?
  NHM.buildBrief(c, { n: "14", frames: FRAMES, artDir: args.artDir, artFolder: "art 14", sceneScale: args.sceneScale, focus: args.focus,
    framePos: args.framePos, prints: args.prints, highlights: null }) :
  NHM.build(c, { n: "14", frames: FRAMES, artDir: args.artDir, artFolder: "art 14", places: args.places, highlights: false });

return { comp: c.name, id: c.id, layers: c.numLayers, mapComp: m.mapComp.name, report: m.report };
