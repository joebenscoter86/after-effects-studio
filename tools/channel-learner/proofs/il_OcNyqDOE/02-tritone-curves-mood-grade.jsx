// il_OcNyqDOE technique 02: one mood grade (Tritone + single-point Curves) pasted on every scene layer, sky and town left ungraded.
// args { prelude, artLib, scene }. Static, 4 s. Grade effects are named "TECH Tritone" / "TECH Curves (Levels stand-in)":
// disable them for the before frame (the wall's Tritone stays off either way, step 7).
// VERIFY: Tritone property names Highlights / Midtones / Shadows / Blend With Original; Levels "Gamma" on ADBE Easy Levels2.
// SUBSTITUTE: Curves point (input 63 % -> output 37 %) by Levels Gamma 0.5 (recipe build notes).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.scene);
var c = HW.comp("il_O 02 grade", 4);
var L = HW.build(c, { depth: false, grade: true, prefix: "TECH " });
return { comp: c.name, id: c.id, layers: c.numLayers, top: c.layer(1).name, bottom: c.layer(c.numLayers).name };
