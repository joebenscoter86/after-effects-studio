// 8oVLS0ZlKC4 02: recipe 01's scene plus three adjustment layers, bottom to top: TECH Glow (two Glows, Threshold 100 % = 255 by script,
// Radius 331 with wiggle(2,100), Intensity 0.3, Composite Behind), TECH Blur (CC Radial Fast Blur, Center 960,540, Amount 95 with
// wiggle(2,10), Zoom Darkest), TECH Noise (9, colour noise off, clip on). Values as the recipe writes them; the Amount slider stops at
// 100, which 95 + wiggle reaches (read back in rbAmount). args: prelude, artLib, sw, artDir, showType, before (finish layers off).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.sw);
return SW.build("8oVL 02 finish", "02", { artDir: args.artDir, showType: args.showType, finish: true, beforeFinish: args.before === true });
