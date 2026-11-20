// il_OcNyqDOE technique 03: the graded scene from 02 made 3D and spread in Z (sky 7940 back, branches -1810 forward),
// each layer rescaled and moved so the default camera (zoom 2666.7) keeps the framing. No camera layer.
// args { prelude, artLib, scene }. Static, 4 s. Values from proof/03/art/brief.md (recipe's Z values; X/Y/scale fitted to our art).
// Second run: args.v2 = true builds on the v2 art (02/art/layout-v2.json): branches at 1.9 times, grass 1.45, free-standing lamp.
// VERIFY: the default view of a 1920 x 1080 comp has zoom 2666.7 (on-screen factor 2666.7 / (2666.7 + Z)).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O 03 depth", 4);
var L = HW.build(c, { depth: true, grade: true, prefix: "", v2: args.v2 });
return { comp: c.name, id: c.id, layers: c.numLayers, cameras: 0 };
