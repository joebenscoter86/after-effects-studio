// SKU3QdqKLOs technique 01: a counter driven by one slider on a control null. Art build (PROOF/01/art/brief.md).
// A null "Controls" carries a Slider Control named "Value 1", keyed 0 at 0:00 to 83 at 3:00, linear (recipe step 5).
// The counter's Source Text expression rounds the slider and adds "%" (step 8). Montserrat Black 111 px, white,
// left-aligned: the left edge holds still at x 110 and the figure grows to the right. Portrait 1080 x 1920, 24 fps, 5 s.
// The author-pass stand-in version is 01-value-driven-counter-first.jsx.
//
// args: prelude, artLib, lib (sku3-lib.jsx), artDir (PROOF/01/art). Optional: args.end (default 83).
$.evalFile(args.prelude);
$.evalFile(args.artLib);
$.evalFile(args.lib);

var W = 1080, H = 1920, FPS = 24, DUR = 5, END = args.end || 83, FOLDER = "art SKU3 01";
var c = P.freshComp("SKU3 01 counter", W, H, FPS, DUR, [16 / 255, 24 / 255, 33 / 255]);
backdrop(c, args.artDir, FOLDER);

// Dressing, static, bottom to top as the brief orders it: footnote, caption, accent rule, heading, kicker.
var MONO = "IBMPlexMono-Medium", COND = "BarlowSemiCondensed-SemiBold", BODY = "Montserrat-Medium";
txt(c, "SAMPLE DATA  /  2026 HOUSEHOLD SURVEY", { size: 24, color: ART.hex("#5D6778"), font: MONO, just: "L", x: 110, top: 1257, name: "Footnote" });
txt(c, "of us reach for a phone within\rten minutes of waking.", { size: 38, leading: 52, color: ART.hex("#A9B3C4"), font: BODY, just: "L", x: 110, top: 1088, name: "Caption" });
rect(c, "Accent rule", 110, 1046, 206, 1051, ART.hex("#FF6B3D"));
txt(c, "BEFORE THE\rKETTLE BOILS", { size: 68, leading: 74, color: ART.hex("#EEF2F8"), font: COND, just: "L", x: 110, top: 772, name: "Heading" });
txt(c, "THE MORNING SCROLL", { size: 30, color: ART.hex("#FF6B3D"), font: MONO, just: "L", x: 110, top: 710, name: "Kicker" });

// The technique: the counter, left edge fixed at x 110, digits centred on y 998 (ink 957-1039).
var counter = txt(c, END + "%", { size: 111, color: [1, 1, 1], font: "Montserrat-Black", just: "L", x: 110, cy: 998, name: "Counter" });
var rr = counter.sourceRectAtTime(0, false);
var ctl = rig(c, END, "linear"); // made before the expression names it
counter.property("ADBE Text Properties").property("ADBE Text Document").expression = "Math.round(" + SLIDER + ') + "%"';
ctl.moveToBeginning();

return { comp: c.name, id: c.id, layers: c.numLayers, landedWidth: rr.width, landedHeight: rr.height, fontWarnings: FONT_WARN.join("; ") };
