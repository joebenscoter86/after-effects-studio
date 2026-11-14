// Technique 03: fade both ends of an open stroke with Taper (recipe 03-tapered-stroke).
// A white ellipse, trimmed open to an arc over a centred headline, 16 px butt-cap stroke, with Gaussian Blur,
// CC Radial Fast Blur and Glow on the layer. Taper Start Length and End Length at 100% make it thin to nothing at both ends.
//
// Switch-off: Taper is a stroke property, not an effect or layer. Its Start/End Length are driven by an expression that
// reads a Slider Control named "TECH taper" and returns 0 when that effect is switched off. Disabling "TECH taper" gives
// the "before" frame (even width, hard ends).
//
// VERIFY: "ADBE Vector Stroke Taper" group and its "ADBE Vector Taper Length Units", "ADBE Vector Taper Start Length",
//         "ADBE Vector Taper End Length" match names (need After Effects 17.0 or later).
// VERIFY (run): "ADBE Vector Taper Length Units" value 1 = Percent, 2 = Pixels (the guess was the other way round).
// VERIFY: "ADBE Vector Stroke Line Cap" value 1 = Butt Cap.
// VERIFY: the expression Effect object's .active is false when the effect's eye is off, and effect(...)(1) reads the slider.
// VERIFY: effect display names "Slider Control", "Gaussian Blur", "CC Radial Fast Blur", "Glow", "Tint" and the property
//         display names used below (Blurriness, Repeat Edge Pixels, Center, Amount, Zoom, Glow Threshold, Glow Radius,
//         Glow Intensity, Map Black To, Map White To, Amount to Tint).
// VERIFY: CC Radial Fast Blur "Zoom" value 2 = Brightest (1 Standard, 3 Darkest assumed).
// VERIFY: Glow enums left at their defaults match the recipe: Glow Based On Color Channels, Composite Original Behind,
//         Glow Operation Add, Glow Colors Original Colors, Color Looping Triangle A>B>A, Color Loops 1, Color Phase 0.
//         Gaussian Blur's Blur Dimensions left at its default, Horizontal and Vertical.
// VERIFY: Glow Threshold takes 60 for 60%.
// VERIFY: effect point values on a shape layer at default transform are in comp pixels, so Center 962.4, 692.4 lands
//         just below the comp centre as in the recipe.
// VERIFY (rebuild): Exposure "ADBE Exposure2", Glow Colors 2 = A & B, characterRange for the accent word.
// VERIFY: "ADBE Vector Ellipse Position" moves the ellipse inside its group; "ADBE Vector Trim Offset" is in degrees.
$.evalFile(args.prelude);
// Rebuild with artwork (2026-11-14): art from PROOF/03/art (brief.md). Pass args.artLib (art.jsx) and args.artDir.
// Layers, bottom to top: starfield, planet (Exposure darkened), planet shade (soft radial dark under the headline),
// arc bloom (wide blue copy: recipe's Gaussian Blur + CC Radial Fast Blur + wide Glow), arc core (white, Taper, tight
// blue Glow), headline. The Taper switch "TECH taper" sits on "arc core" and drives the taper on both arc layers.
$.evalFile(args.artLib);
var ARTDIR = args.artDir;

var c = P.freshComp("03 tapered stroke", 1920, 1080, 24, 4, ART.hex("#03050E"));
(function () { var i, it; for (i = app.project.numItems; i >= 1; i--) { it = app.project.item(i); if (it instanceof FootageItem && it.name === "03 planet shade" && it.usedIn.length === 0) it.remove(); } })();

var sf = c.layers.add(ART.footage(ARTDIR, "starfield.png", "art 03"));
sf.name = "starfield";

// Brief: planet at 74.6 % (diameter 1608), centre 979, 1009; darkened (Exposure -0.8).
var CX = 979, CY = 1009, R = 804;
var pl = c.layers.add(ART.footage(ARTDIR, "planet.png", "art 03"));
pl.name = "planet";
P.tf(pl, "ADBE Scale").setValue([74.6, 74.6]);
P.tf(pl, "ADBE Position").setValue([CX, CY]);
var ex = P.effect(pl, "ADBE Exposure2");
ART.setFx(ex, { "Exposure": args.exposure !== undefined ? args.exposure : -0.8 });

// Brief: soft radial dark (#03050E at 60 % in the centre, clear at the edge) over the lower centre, under the headline.
var sd = P.solid(c, "03 planet shade", ART.hex("#03050E"));
sd.name = "planet shade";
var mk = sd.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
var ms = new Shape();
var mx = 960, my = 650, rx = 560, ry = 300, k = 0.5523;
ms.vertices = [[mx, my - ry], [mx + rx, my], [mx, my + ry], [mx - rx, my]];
ms.inTangents = [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]];
ms.outTangents = [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]];
ms.closed = true;
mk.property("ADBE Mask Shape").setValue(ms);
sd.property("ADBE Mask Parade").property(1).property("ADBE Mask Feather").setValue([260, 260]);
P.tf(sd, "ADBE Opacity").setValue(args.shade !== undefined ? args.shade : 60);

// The arc: circle of radius 804 centred at 979, 1009 (on the planet's edge), trimmed to the top 108 deg.
var D = 2 * R;
var BLUE_A = ART.hex("#8FC4FF"), BLUE_B = ART.hex("#2F6BFF");
var expr = 'var e = thisComp.layer("arc core").effect("TECH taper"); e.active ? e(1) : 0;';
function arc(name) {
  var sh = P.shape(c, name);
  P.ellipse(sh, [D, D]);
  // Layer sits at the comp centre (960, 540): ellipse offset to the circle's centre.
  P.contents(sh).property(1).property("ADBE Vector Ellipse Position").setValue([CX - 960, CY - 540]);
  // Step 1: white stroke, 16 px, Butt Cap, no fill.
  var s = P.stroke(sh, [1, 1, 1, 1], args.width || 16, 1);
  var t = P.contents(sh).addProperty("ADBE Vector Filter - Trim");
  var tIdx = t.propertyIndex;
  P.contents(sh).property(tIdx).property("ADBE Vector Trim Start").setValue(0);
  P.contents(sh).property(tIdx).property("ADBE Vector Trim End").setValue(30);       // 108 deg
  P.contents(sh).property(tIdx).property("ADBE Vector Trim Offset").setValue(-54);  // centred on the crest
  // Steps 3-4: Taper in Percent (1), Start and End Length 100, driven by the switch.
  var tp = function () { return P.contents(sh).property(s).property("ADBE Vector Stroke Taper"); };
  tp().property("ADBE Vector Taper Length Units").setValue(1);
  tp().property("ADBE Vector Taper Start Length").setValue(100);
  tp().property("ADBE Vector Taper Start Length").expression = expr;
  tp().property("ADBE Vector Taper End Length").setValue(100);
  tp().property("ADBE Vector Taper End Length").expression = expr;
  return sh.layer;
}
function blueGlow(layer, threshold, radius, intensity) {
  var fx = ART.glow(layer, threshold, radius, intensity);
  var idx = fx.propertyIndex;
  ART.setFx(layer.property("ADBE Effect Parade").property(idx), { "Glow Colors": 2 });
  var miss = ART.setFx(layer.property("ADBE Effect Parade").property(idx), { "Color A": BLUE_A, "Color B": BLUE_B });
  if (miss.length) throw new Error("glow colours not found: " + miss.join(", "));
}

// Bloom copy (below the core): the recipe's Step 2 effect stack, Gaussian Blur 9.9 (Repeat Edge Pixels) and
// CC Radial Fast Blur (Center 962.4, 692.4, Amount 62, Brightest), then the brief's wide blue Glow (radius 110,
// intensity 1.2). Recipe's Glow uses Original Colors on white and leaves the blue unexplained; the brief's A & B
// colours give the blue (the plain build's "ASSUMED blue tint" is gone).
var bl = arc("arc bloom");
var gb = P.effect(bl, "Gaussian Blur");
gb.property("Blurriness").setValue(9.9);
bl.property("ADBE Effect Parade").property(gb.propertyIndex).property("Repeat Edge Pixels").setValue(1);
var rb = P.effect(bl, "CC Radial Fast Blur");
rb.property("Center").setValue([962.4, 692.4]);
bl.property("ADBE Effect Parade").property(rb.propertyIndex).property("Amount").setValue(62);
bl.property("ADBE Effect Parade").property(rb.propertyIndex).property("Zoom").setValue(2); // Brightest
blueGlow(bl, 40, args.bloomRadius || 110, args.bloomIntensity || 1.2);
bl.blendingMode = BlendingMode.ADD;

// Core: white tapered stroke with the tight blue Glow (threshold 40 %, radius 20, intensity 2).
var co = arc("arc core");
var tech = P.effect(co, "Slider Control");
tech.name = "TECH taper";
co.property("ADBE Effect Parade").property("TECH taper").property(1).setValue(100);
blueGlow(co, 40, args.coreRadius || 20, args.coreIntensity || 2);

// Headline: Poppins SemiBold, cap height about 0.055 h (85 px type), line spacing 1.15, centred, #E9EEF8, centred
// at 0.57 down (layout 0.39-0.75); the last word in #8FC4FF.
var size = args.size || 85;
var hl = P.text(c, "Look past\rthe edge of\rthe horizon", { size: size, color: ART.hex("#E9EEF8"), name: "headline", font: args.font || "Poppins-SemiBold", pos: [960, 0.57 * 1080] });
var tdp = hl.property("ADBE Text Properties").property("ADBE Text Document");
var td = tdp.value;
td.autoLeading = false;
td.leading = Math.round(size * 1.15);
tdp.setValue(td);
var accent = "no characterRange";
try {
  td = tdp.value;
  var txt = td.text, at = txt.lastIndexOf("horizon");
  var cr = td.characterRange(at, at + 7);
  cr.fillColor = BLUE_A;
  tdp.setValue(td);
  accent = "set";
} catch (e) { accent = "failed: " + e.toString(); }
var hr = hl.sourceRectAtTime(0, false);
P.tf(hl, "ADBE Anchor Point").setValue([hr.left + hr.width / 2, hr.top + hr.height / 2]);

var order = []; for (var li = 1; li <= c.numLayers; li++) order.push(c.layer(li).name);
return { comp: c.name, id: c.id, order: order, accent: accent, font: tdp.value.font, headlineW: hr.width, headlineH: hr.height, top: hr.top };
