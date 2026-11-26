// Technique 13: caption fades in as a dim ghost, fills to full word by word, sharpens from blur, block keeps swelling.
// VERIFY: "ADBE Text Animators" / "ADBE Text Animator" / "ADBE Text Animator Properties" / "ADBE Text Opacity" match names
// VERIFY: new animator already contains "ADBE Text Selectors" > "ADBE Text Selector" (Range Selector 1); fetched by index 1
// VERIFY: "ADBE Text Percent Start" is Start; "ADBE Text Range Advanced" group holds Units, Based On, Mode, Amount, Shape, Smoothness
// VERIFY: Based On match name "ADBE Text Range Type2", value 3 = Words (1 chars, 2 chars excl spaces, 3 words, 4 lines)
// VERIFY: Shape "ADBE Text Range Shape" 1 = Square; Smoothness "ADBE Text Selector Smoothness" (100 is the default)
// VERIFY: P.effect(layer,"Gaussian Blur") accepts the display name; props "Blurriness", "Repeat Edge Pixels" (1 = on)
// VERIFY: animator.name can be set to "TECH fill-in" and animator.enabled=false switches it off
// VERIFY: Easy Ease via setTemporalEaseAtKey with KeyframeEase(0,33.33); Scale takes 2 ease objects on a 2D layer, 3 on a 3D layer
// VERIFY: null layer anchor set to [0,0] so children at position [0,0] land on the null; shape layer children inherit scale about that origin
// VERIFY: Leading property of TextDocument (d.leading) with d.autoLeading=false
$.evalFile(args.prelude);
var c = P.freshComp("13 text fill-in blur and scale finish", 1080, 1920, 24, 5, [0, 0, 0]);
var cx = c.width / 2, cy = c.height / 2;
var B = 0.5; // ASSUMED: technique starts 0.5 s in; recipe times (25 fps timecodes 10:22..12:23) are kept relative to 10:22
function ease(prop, n) {
  var k, e = [], i;
  for (i = 0; i < n; i++) e.push(new KeyframeEase(0, 33.33));
  for (k = 1; k <= prop.numKeys; k++) prop.setTemporalEaseAtKey(k, e, e);
}

// Null chain: scale null (new, keyed) above orb null (the "earlier null").
var top = c.layers.addNull(c.duration); top.name = "scale null";
var orb = c.layers.addNull(c.duration); orb.name = "orb null";
top.threeDLayer = false;
P.tf(top, "ADBE Anchor Point").setValue([0, 0]);
P.tf(top, "ADBE Position").setValue([cx, cy]);
P.tf(orb, "ADBE Anchor Point").setValue([0, 0]);
P.tf(orb, "ADBE Position").setValue([0, 0]);
// ASSUMED: the earlier null's 416 % is folded into the ring size below, so it stays at 100 % here.
orb.parent = top;
var sc = P.tf(top, "ADBE Scale");
sc.setValueAtTime(B, [100, 100]);
sc.setValueAtTime(B + 51 / 25, [205, 205]);
ease(P.tf(top, "ADBE Scale"), 2);

// Stand-in ring: four offset echo outlines, deep blue to cyan. Ends about 880 px wide (x2.05), so 430 px at null scale 100.
var cols = [[0.1, 0.15, 0.8, 1], [0.1, 0.4, 0.95, 1], [0.1, 0.65, 1, 1], [0.35, 0.95, 1, 1]];
var i, sh, sidx;
for (i = 0; i < 4; i++) {
  sh = P.shape(c, "ring echo " + (i + 1));
  P.ellipse(sh, [430 - i * 6, 414 - i * 6]);
  sidx = P.stroke(sh, cols[i], 5, 2);
  P.tf(sh.layer, "ADBE Position").setValue([-8 + i * 5, 6 - i * 4]);
  sh.layer.parent = orb;
}

// Caption: three lines, white, centred. Layer scale 25.2 % = 4.5/7.1 of 40 % (the recipe's smaller cut); leading opened.
var t = P.text(c, "By giving you a\rstarting point\rinstantly", { size: 80, name: "caption" });
var tp = t.property("ADBE Text Properties").property("ADBE Text Document");
var d = tp.value;
d.autoLeading = false;
d.leading = 80 * 132 / 77.5; // recipe: 132 at font size 77.5
tp.setValue(d);
var r = t.sourceRectAtTime(0, false);
P.tf(t, "ADBE Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
P.tf(t, "ADBE Scale").setValue([25.2, 25.2]);
P.tf(t, "ADBE Position").setValue([2, 4]); // block centre about 49 % across, 51 % down of the ring
// ASSUMED: text parented to the orb null so it grows with the ring (inferred from the finished piece, step 7 silent)
t.parent = orb;

// Animator: Opacity ghost + Range Selector, Based On Words, Start 0 -> 100 %.
var anims = t.property("ADBE Text Properties").property("ADBE Text Animators");
var an = anims.addProperty("ADBE Text Animator");
an = t.property("ADBE Text Properties").property("ADBE Text Animators").property(an.propertyIndex);
an.name = "TECH fill-in";
an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
an = t.property("ADBE Text Properties").property("ADBE Text Animators").property(1);
an.property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(12); // ASSUMED: 12 (10 to 15 said)
var rs = an.property("ADBE Text Selectors").property(1);
var adv = rs.property("ADBE Text Range Advanced");
adv.property("ADBE Text Range Type2").setValue(3); // Words
adv.property("ADBE Text Range Shape").setValue(1); // Square
adv.property("ADBE Text Selector Smoothness").setValue(100);
var st = rs.property("ADBE Text Percent Start");
st.setValueAtTime(B + 28 / 25, 0);
st.setValueAtTime(B + 47 / 25, 100);
ease(rs.property("ADBE Text Percent Start"), 1);

// Layer opacity 0 -> 100 (cannot be named TECH; keys stay when the finish is "off")
var op = P.tf(t, "ADBE Opacity");
op.setValueAtTime(B + 10 / 25, 0);
op.setValueAtTime(B + 29 / 25, 100);
ease(P.tf(t, "ADBE Opacity"), 1);

// Gaussian Blur 25 -> 0, done as the Start key begins to move.
var g = P.effect(t, "Gaussian Blur");
g.name = "TECH Gaussian Blur";
g = t.property("ADBE Effect Parade").property(g.propertyIndex);
g.property("Repeat Edge Pixels").setValue(1);
g.property("Blurriness").setValueAtTime(B + 18 / 25, 25);
g.property("Blurriness").setValueAtTime(B + 28 / 25, 0);
ease(g.property("Blurriness"), 1);

return { comp: c.name, id: c.id, layers: c.numLayers };
