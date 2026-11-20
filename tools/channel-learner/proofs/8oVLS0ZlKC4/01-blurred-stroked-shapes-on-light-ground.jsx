// 8oVLS0ZlKC4 01: two huge navy circles with a 9 px #0082FF stroke and a one-way (Vertical) Gaussian Blur 103.6, Repeat Edge Pixels off,
// on a #E4F4FF ground; the "Still Water" art (proof/01/art/brief.md) on top. args: prelude, artLib, sw, artDir, showType, before.
// before: true switches off both blurs and strokes (recipe 01's before frame f002152).
// ASSUMED: 60 fps (recipe), 5 s still.
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.sw);
return SW.build("8oVL 01 hourglass", "01", { artDir: args.artDir, showType: args.showType, before01: args.before === true });
