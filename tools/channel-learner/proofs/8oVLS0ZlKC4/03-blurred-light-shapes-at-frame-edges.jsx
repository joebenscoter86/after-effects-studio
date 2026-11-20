// 8oVLS0ZlKC4 03: 01 + 02, plus three #355EA0 light circles (346 px, no stroke) above the finish, parented to the lower dark circle:
// top centre (48 % across, centre on the top edge, Scale 70, Blur 555.6 Horizontal and Vertical), bottom at 28 % (Blur 599.6 Vertical,
// wiggle(2,100)) and 68 % (Blur 600 Vertical), Repeat Edge Pixels off. args: prelude, artLib, sw, artDir, showType, before (lights off).
// ASSUMED: the bottom-right circle has no wiggle (recipe: unknown; left off as its build notes suggest).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.sw);
return SW.build("8oVL 03 light pockets", "03", { artDir: args.artDir, showType: args.showType, finish: true, lights: true, beforeLights: args.before === true, lightBlurScale: args.lightBlurScale || 1 });
