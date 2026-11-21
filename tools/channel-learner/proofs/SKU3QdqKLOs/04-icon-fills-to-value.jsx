// SKU3QdqKLOs technique 04: an icon that fills up to a value. Art build (PROOF/04/art/brief.md).
// A flat icon (icon-drop.png, white on alpha) coloured dim slate #273641 with the Fill effect; a duplicate above it
// coloured with the brief's accent (#FF6B3D in place of the recipe's #FFCD10), shown only through an alpha track matte:
// a shape layer holding one vertical two-point path (bottom vertex first) through the icon's middle, 464 px Butt
// stroke, Trim Paths End = the rig's slider. The stroke's band rises from the bottom with a hard horizontal edge.
// Rig: null "Controls", Slider "Value 1", 0 at 0:00 to 83 at 3:00, Easy Ease (End 83 gives the measured 86 % fill).
// The figure counts first, on its own slider "Value 2" (0 to 86 over 0:00-0:18). Portrait 1080 x 1920, 24 fps, 5 s.
// The author-pass stand-in version (a scripted rocket) is 04-icon-fills-to-value-first.jsx.
//
// args: prelude, artLib, lib, artDir. Optional: args.end (fill slider's end, default 83), args.figure (default 86).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.lib);

var W = 1080, H = 1920, FPS = 24, DUR = 5, FOLDER = "art SKU3 04";
var END = args.end || 83, FIGURE = args.figure || 86;
var c = P.freshComp("SKU3 04 icon", W, H, FPS, DUR, [16 / 255, 24 / 255, 33 / 255]);
backdrop(c, args.artDir, FOLDER);
var MONO = "IBMPlexMono-Medium", COND = "BarlowSemiCondensed-SemiBold", BODY = "Montserrat-Medium";
txt(c, "WATER, SECOND TIME AROUND", { size: 30, color: ART.hex("#FF6B3D"), font: MONO, just: "C", x: 540, top: 550, name: "Kicker" });
txt(c, "EVERY DROP COUNTS", { size: 72, color: ART.hex("#EEF2F8"), font: COND, just: "C", x: 540, top: 627, name: "Heading" });
txt(c, "of the city's water\ris now reused.", { size: 36, leading: 48, color: ART.hex("#A9B3C4"), font: BODY, just: "L", x: 470, top: 1018, name: "Caption" });
var figure = txt(c, FIGURE + "%", { size: 111, color: [1, 1, 1], font: "Montserrat-Black", just: "L", x: 470, cy: 935, name: "Figure" });

// Icon: layer top-left 96,788, i.e. centre 268,960; the drop's ink spans y 789-1131 (344 px canvas, ink rows 1-343).
var IC = [268, 960], ICON_TOP = 789, ICON_BOTTOM = 1131;
var dim = c.layers.add(ART.footage(args.artDir, "icon-drop.png", FOLDER));
dim.name = "Icon dim";
P.tf(dim, "ADBE Position").setValue(IC);
P.effect(dim, "ADBE Fill").property("Color").setValue(ART.hex("#273641"));
var bright = dim.duplicate();
bright.name = "Icon bright";
bright.property("ADBE Effect Parade").property(1).property("Color").setValue(ART.hex("#FF6B3D"));

var ctl = rig(c, END, 33.33); // ASSUMED: default Easy Ease influence; the recipe shows hourglass keys only
slider(ctl, "Value 2", FIGURE, 0, 18 / FPS, 33.33);
figure.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(" + sliderRef("Value 2") + ') + "%"';

// Matte: path from 16 px below the drop's bottom to 16 px above its top (brief), bottom vertex first, 464 px stroke.
var mt = P.shape(c, "Matte stroke");
var yB = ICON_BOTTOM + 17, yT = ICON_TOP - 16;
P.path(mt, [[IC[0], yB], [IC[0], yT]], null, null, false);
P.stroke(mt, [1, 0.8, 0, 1], 464, 1); // colour irrelevant (matte only); Butt cap keeps the edge flat
var t = P.contents(mt).addProperty("ADBE Vector Filter - Trim");
P.contents(mt).property(t.propertyIndex).property("ADBE Vector Trim End").expression = SLIDER;
P.tf(mt.layer, "ADBE Position").setValue([0, 0]);
P.tf(mt.layer, "ADBE Anchor Point").setValue([0, 0]);
var matte = mt.layer;
matte.moveBefore(bright);
bright.moveBefore(matte);
bright.setTrackMatte(matte, TrackMatteType.ALPHA);
matte.enabled = false;
ctl.moveToBeginning();

var L = yB - yT;
return { comp: c.name, id: c.id, layers: c.numLayers, matteLength: L, matteTop: yT, matteBottom: yB,
  predictedFill: (END / 100 * L - (yB - ICON_BOTTOM)) / (ICON_BOTTOM - ICON_TOP + 1), fontWarnings: FONT_WARN.join("; ") };
