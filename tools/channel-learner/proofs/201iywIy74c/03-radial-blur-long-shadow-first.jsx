// Technique 3: long soft shadow from a blacked-out duplicate + CC Radial Fast Blur.
// VERIFY:
// VERIFY: match name "ADBE Fill" and display names "Color", "Opacity" on it
// VERIFY: match name "CC Radial Fast Blur" and its properties "Center", "Amount", "Zoom" (Zoom dropdown: 1 = Standard)
// VERIFY: layer.duplicate() puts the copy ABOVE the original; the script renames/reorders by name afterwards
// VERIFY: shape-layer effects read Center in comp pixels (layer position 0,0, comp-sized shape layer)
// VERIFY: CC Radial Fast Blur may clip its streaks to the layer bounds (comp-sized, should be fine)
// VERIFY: "ADBE Vector Rect Roundness", "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Position"
// VERIFY: addProperty("ADBE Vector Graphic - Fill") on a group's contents, then fetched again by name
$.evalFile(args.prelude);
var c = P.freshComp("03 radial blur long shadow", 1080, 1920, 24, 4, [0.99, 0.99, 0.99]);

// Ground: near-white solid (ASSUMED 253/255 as measured in the recipe).
var ground = P.solid(c, "Ground", [253 / 255, 253 / 255, 253 / 255], 1080, 1920);

// Card: rounded 16:9 stand-in for the thumbnail. ASSUMED sized 880x495 so it reads on a phone;
// the recipe's 32% of picture width would be tiny in 9:16. Corner radius ~1.1% of 1920 scaled = 30.
var sh = P.shape(c, "Card");
var rect = P.contents(sh).addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([880, 495]);
rect.property("ADBE Vector Rect Position").setValue([540, 960]);
rect.property("ADBE Vector Rect Roundness").setValue(30);
P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
P.contents(sh).property("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([0.16, 0.38, 0.85, 1]);
var card = sh.layer;

// Step 1-2: duplicate, rename the lower copy.
// SUBSTITUTE: duplicate by hand (Cmd+D) -> layer.duplicate().
var shadow = card.duplicate();
shadow.name = "TECH Shadow"; // recipe says "Shadow"; TECH prefix so the runner can disable it for the before frame
shadow.moveAfter(card);       // kept below the original (card on top, shadow below, ground at the bottom)

// Stand-in artwork letters on the card (only the silhouette matters for the shadow).
var label = P.text(c, "CARD", { size: 200, color: [1, 1, 1], pos: [540, 960], name: "Card label" });
label.moveBefore(card);

// Step 4: Fill, black, opacity 100%.
var fill = P.effect(shadow, "ADBE Fill");
fill.property("Color").setValue([0, 0, 0, 1]);
fill.property("Opacity").setValue(100);

// Step 5-6, 9: CC Radial Fast Blur, Zoom Standard, Amount 85 (final).
// ASSUMED: Center scaled from the recipe's 438,159 (1920x1080 view, card centred at 960,540):
// offset (-522,-381) x 1.43 (card 880 wide vs ~615) from the card centre 540,960 -> -208,415 (off the left edge, up-left of the card).
var blur = P.effect(shadow, "CC Radial Fast Blur");
blur.property("Center").setValue([-208, 415]);
blur.property("Amount").setValue(85);
blur.property("Zoom").setValue(1); // Standard

// Step 8: layer opacity 35%.
P.tf(shadow, "ADBE Opacity").setValue(35);

// Step 7: top copy is on (never switched off here).
return { comp: c.name, id: c.id, layers: c.numLayers, shadow: shadow.name };
