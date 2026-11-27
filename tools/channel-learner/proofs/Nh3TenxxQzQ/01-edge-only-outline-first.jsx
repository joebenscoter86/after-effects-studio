// Technique 01: edge-only light outline from a solid logo (Lumenfold lockup).
// Lockup precomp -> Fill (black) -> CC Light Sweep (Sweep Intensity 0, edge light only), layer mode Add, over the backdrop.
// VERIFY: "ADBE Fill" and "CC Light Sweep" are accepted by canAddProperty as match names (CC Light Sweep may need "CC Light Sweep" exactly as typed)
// VERIFY: Fill property display name "Color"
// VERIFY: CC Light Sweep property display names: Center, Direction, Shape, Width, Edge Intensity, Edge Thickness, Sweep Intensity, Light Color, Light Reception
// VERIFY: Shape dropdown index for Sharp (assumed 3 of Linear, Smooth, Sharp); Light Reception index for Add (assumed 1 of Add, Composite, Cutout)
// VERIFY: Direction accepts 14 as degrees (single value, not revolutions)
// VERIFY: Montserrat-SemiBold resolves; TextDocument.font read-back equals the PostScript name when it is not substituted
// VERIFY: args.artDir holds mark.png and backdrop.png (the proof's shared-art folder)
// VERIFY: Light Center is in precomp layer space; the precomp is comp-sized so it equals comp pixels
// VERIFY: tracking 40 is in 1/1000 em units as TextDocument.tracking expects
// ASSUMED: lockup layout numbers below (mark 0.749 scale, name width 562 px, gap 0.18 of mark height, centre 46% down)
// ASSUMED: Width 80 and Edge Thickness 4 (tutorial 79 and 4 scaled by our mark height 571 over the tutorial's 560, about 1.02)
$.evalFile(args.prelude);
var W = 1080, H = 1920;
var art = args.artDir || args.art;
var NAME = "01 edge-only outline";

// ---- lockup precomp (comp-sized, so effect points read comp pixels)
var lk = P.freshComp("01 lockup", W, H, 24, 4, [0, 0, 0]);
var artFolder = null;
for (var fi = 1; fi <= app.project.numItems; fi++) { if (app.project.item(fi) instanceof FolderItem && app.project.item(fi).name === "art 01") artFolder = app.project.item(fi); }
if (!artFolder) artFolder = app.project.items.addFolder("art 01");
var markItem = app.project.importFile(new ImportOptions(new File(art + "/mark.png")));
markItem.parentFolder = artFolder;
var ml = lk.layers.add(markItem);
ml.name = "mark";
var mScale = 562 / 1.1 / markItem.width * 100;           // name width = 1.1 x mark width, name = 562 px
var mH = markItem.height * mScale / 100;
var lockH = 0;
var textSize = 90;
var tl = P.text(lk, "Lumenfold", { size: textSize, font: "Montserrat-SemiBold", tracking: 40, name: "name" });
var r = tl.sourceRectAtTime(0, false);
textSize = textSize * 562 / r.width;                      // second pass: hit the target width
tl.remove();
tl = P.text(lk, "Lumenfold", { size: textSize, font: "Montserrat-SemiBold", tracking: 40, name: "name" });
var td = tl.property("ADBE Text Properties").property("ADBE Text Document");
if (td.value.font !== "Montserrat-SemiBold") {
  // fall back to ExtraBold, noted in build-notes
  var d2 = td.value; d2.font = "Montserrat-ExtraBold"; td.setValue(d2);
}
r = tl.sourceRectAtTime(0, false);
var gap = 0.18 * mH;
lockH = mH + gap + r.height;
var top = H * 0.46 - lockH / 2;
var cy = H * 0.46;
P.tf(ml, "Scale").setValue([mScale, mScale]);
P.tf(ml, "Position").setValue([W / 2, top + mH / 2]);
P.tf(tl, "Position").setValue([W / 2, top + mH + gap + r.height / 2]);

// ---- main comp
var c = P.freshComp(NAME, W, H, 24, 4, [0, 0, 0]);
var bgItem = app.project.importFile(new ImportOptions(new File(art + "/backdrop.png")));
bgItem.parentFolder = artFolder;
var bg = c.layers.add(bgItem);
bg.name = "backdrop";
var L = c.layers.add(lk);
L.name = "lockup";
L.blendingMode = BlendingMode.ADD;   // recipe step 3: Add (black fill then adds nothing over the backdrop)

var fill = P.effect(L, "ADBE Fill");
fill.name = "TECH Fill";
L.property("ADBE Effect Parade").property("TECH Fill").property("Color").setValue([0, 0, 0, 1]);

var ls = P.effect(L, "CC Light Sweep");
ls.name = "TECH CC Light Sweep";
var e = L.property("ADBE Effect Parade").property("TECH CC Light Sweep");
e.property("Center").setValue([W / 2, cy]);
e.property("Direction").setValue(14);
e.property("Shape").setValue(3);              // Sharp
e.property("Width").setValue(80);
e.property("Sweep Intensity").setValue(0);
e.property("Edge Intensity").setValue(90);
e.property("Edge Thickness").setValue(4);
e.property("Light Color").setValue([1, 1, 1, 1]);
e.property("Light Reception").setValue(1);    // Add

lk.hideShyLayers = false;
return { comp: c.name, id: c.id, layers: c.numLayers, font: td.value.font, lockupHeight: lockH };
