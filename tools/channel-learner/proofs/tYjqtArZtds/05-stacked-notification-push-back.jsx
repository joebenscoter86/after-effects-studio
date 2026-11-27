// Technique 5: a second notification card lands on top of the first; the first sinks 98 px (136 x 0.72), shrinks to 90 % and wobbles.
// Built: Larkvault warning card (original) + fix card (duplicate set, shifted +15 frames, TECH-named, on top). Phone scale: recipe x 0.72.
// VERIFY: comp.motionBlur = true exists on CompItem (comp Motion Blur switch); layer.motionBlur = true on shape/text/footage/adjustment layers
// VERIFY: setting layer.startTime on a layer that already has keys carries its keys with it (keys are layer-relative); expression key(n).time then reads comp time
// VERIFY: layer.parent = x does NOT keep world position, so positions are set AFTER parenting (local values relative to the parent null)
// VERIFY: match names "ADBE Box Blur2" (Fast Box Blur) with "Blur Radius"; "ADBE Vector Shape - Rect", "ADBE Vector Rect Size", "ADBE Vector Rect Roundness", "ADBE Vector Graphic - Fill", "ADBE Vector Fill Color"
// VERIFY: PostScript names "InterTight-SemiBold" and "InterTight-Regular" (variable font instances); TextDocument.isSubstitute exists (guarded with typeof); fallback "Inter-ExtraBold" for the name only
// VERIFY: layer.adjustmentLayer = true on a shape layer blurs only inside the fill's outline
// VERIFY: Rectangle Roundness larger than half the height clamps to a full half-circle end
// VERIFY: addNull(duration) signature; null anchor [0,0] settable; null.enabled = false still works as a parent
// VERIFY: the bounce expression text is a reconstruction (the recipe does not quote it); sourceRectAtTime(0,false) on a text layer gives left/top/width/height
// VERIFY: Scale on a null is a 2D property; setValueAtTime with [100,100] arrays; default key interpolation is linear
// VERIFY: ImportOptions import of app-icon.png / wallpaper.png from args.artDir (or args.art = folder)
$.evalFile(args.prelude);

var K = 0.72;
var FPS = 30;
var W = 1080, H = 1920;
var c = P.freshComp("05 stacked notification push back", W, H, FPS, 4, [0.97, 0.97, 0.97]);
c.motionBlur = true; // inferred in the recipe (shutter ~180 degrees, the default)

var artDir = args.artDir || args.art;
var artFolder = null;
function importArt(fname, dir) {
  var i, it;
  for (i = 1; i <= app.project.numItems; i++) {
    it = app.project.item(i);
    if (it instanceof FootageItem && it.name === fname && it.parentFolder && it.parentFolder.name === "art 05") return it;
  }
  var f = new File((dir || artDir) + "/" + fname);
  if (!f.exists) throw new Error("art not found: " + f.fsName);
  if (!artFolder) {
    for (i = 1; i <= app.project.numItems; i++) {
      it = app.project.item(i);
      if (it instanceof FolderItem && it.name === "art 05") artFolder = it;
    }
    if (!artFolder) artFolder = app.project.items.addFolder("art 05");
  }
  var imp = app.project.importFile(new ImportOptions(f));
  imp.parentFolder = artFolder;
  return imp;
}

// The bounce expression: overshoot from the speed into the last key, amp .04, freq 1.8, decay 3, time_max 3.
// The bounce expression word for word, as the recipe quotes it from the video's description (lead correction, lesson 51).
var BOUNCE = [
  "amp = .04;",
  "freq = 1.8;",
  "decay = 3;",
  "n = 0;",
  "time_max = 3;",
  "",
  "",
  "if (numKeys > 0) {",
  "    n = nearestKey(time).index;",
  "    if (key(n).time > time) {",
  "        n--;",
  "    }",
  "}",
  "",
  "",
  "if (n == 0) {",
  "    t = 0;",
  "} else {",
  "    t = time - key(n).time;",
  "}",
  "",
  "",
  "if (n > 0 && t < time_max) {",
  "    v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);",
  "    ",
  "    // Ease Out Factor (starts at 1, gradually reduces to 0)",
  "    easeFactor = easeOut(t, 0, time_max, 1, 0);",
  "    ",
  "    value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t) * easeFactor;",
  "} else {",
  "    value;",
  "}"
].join("\n");

// Card geometry (recipe 1350 x 315 x 0.72), centre 35 % down the frame.
var CW = 1350 * K, CH = 315 * K;       // 972 x 227
var CX = W / 2, CY = Math.round(H * 0.35); // 540, 672
var SINK = 136 * K;                    // 98 px (0.43 x card height)
var DELAY = 15 / FPS;                  // copy starts 15 frames later

function hex(h) {
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}

// Local helpers (candidates for the prelude).
function pill(name, withFill, strokeColor, strokeW) {
  var sh = P.shape(c, name);
  P.contents(sh).addProperty("ADBE Vector Shape - Rect");
  P.contents(sh).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").setValue([CW, CH]);
  P.contents(sh).property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Roundness").setValue(79); // lead notes: Roundness 79 on a 227 px card (corner radius ~0.33 of height)
  if (withFill) {
    var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
    var fi = f.propertyIndex;
    P.contents(sh).property(fi).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
  }
  if (strokeW) P.stroke(sh, strokeColor, strokeW, 1);
  return sh.layer;
}
function nullLayer(name) {
  var n = c.layers.addNull(c.duration);
  n.name = name;
  P.tf(n, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(n, "ADBE Position").setValue([0, 0]);
  n.enabled = false;
  return n;
}
function mkText(str, size, color, font, name, x, y, alignRight) {
  var t = P.text(c, str, { size: size, color: hex(color), font: font, name: name });
  return { layer: t, x: x, y: y, right: !!alignRight };
}
// Place a text layer (after parenting) with its left (or right) edge on x, vertical middle on y.
function placeText(o, parent) {
  o.layer.parent = parent;
  var r = o.layer.sourceRectAtTime(0, false);
  P.tf(o.layer, "ADBE Anchor Point").setValue([o.right ? r.left + r.width : r.left, r.top + r.height / 2]);
  P.tf(o.layer, "ADBE Position").setValue([o.x, o.y]);
}
// Entrance keys on a group null (layer-relative times 0 and 4 frames): 150 px (x0.72) above and 60 % -> rest, then the bounce.
function entrance(n) {
  var pos = P.tf(n, "ADBE Position");
  pos.setValueAtTime(0, [0, -150 * K]);
  pos.setValueAtTime(4 / FPS, [0, 0]);
  var sc = P.tf(n, "ADBE Scale");
  sc.setValueAtTime(0, [60, 60]);
  sc.setValueAtTime(4 / FPS, [100, 100]);
  P.tf(n, "ADBE Position").expression = BOUNCE;
  P.tf(n, "ADBE Scale").expression = BOUNCE;
}

var wp = c.layers.add(importArt("wallpaper-05.png", args.artDir));
wp.name = "wallpaper";
P.tf(wp, "ADBE Position").setValue([W / 2, H / 2]);

var iconItem = importArt("app-icon.png", args.sharedDir);

// Build one finished notification, bottom to top. Returns the layers by group.
function notification(sfx, o) {
  var pre = o.tech ? "TECH " : "";
  var card = [], logo = [], text = [];
  var depth = pill(pre + "Depth" + sfx, true, null, 0);
  P.tf(depth, "ADBE Opacity").setValue(5);
  var glass = pill(pre + "Notification" + sfx, true, null, 0);
  glass.adjustmentLayer = true;
  P.effect(glass, "ADBE Box Blur2").property("Blur Radius").setValue(30 * K);
  var rim = pill(pre + "Stroke" + sfx, false, [0.8, 0.8, 0.8, 1], 4 * K);
  card.push(depth, glass, rim);

  var LOGO = CH * 0.6; // 136 px
  var lx = -CW / 2 + CW * 0.12; // logo centre x (-389)
  var ic = c.layers.add(iconItem);
  ic.name = pre + "Logo" + sfx;
  logo.push(ic);
  var badge = null, bang = null;
  if (o.badge) {
    badge = P.shape(c, pre + "Badge" + sfx);
    P.ellipse(badge, [LOGO * 0.3, LOGO * 0.3]);
    var f = P.contents(badge).addProperty("ADBE Vector Graphic - Fill");
    P.contents(badge).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(hex("D7263D").concat([1]));
    logo.push(badge.layer);
    bang = mkText("!", 26, "FFFFFF", "InterTight-SemiBold", pre + "Badge mark" + sfx, 0, 0, false);
    logo.push(bang.layer);
  }
  var tx = lx + LOGO / 2 + CW * 0.03; // text left edge
  var nm = mkText(o.title, 38, o.titleColor, "InterTight-SemiBold", pre + "Title" + sfx, tx, -30, false);
  var doc = nm.layer.property("ADBE Text Properties").property("ADBE Text Document").value;
  if (typeof doc.isSubstitute !== "undefined" && doc.isSubstitute) {
    // fall back to Inter ExtraBold for the name only
    var tp = nm.layer.property("ADBE Text Properties").property("ADBE Text Document");
    var d2 = tp.value;
    d2.font = "Inter-ExtraBold";
    tp.setValue(d2);
  }
  var ms = mkText(o.message, 30, "3A3A3C", "InterTight-Regular", pre + "Message" + sfx, tx, 24, false);
  var nw = mkText("now", 28, "8E8E93", "InterTight-Regular", pre + "Time" + sfx, CW / 2 - CW * 0.06, -62, true);
  text.push(nm.layer, ms.layer, nw.layer);

  var cardN = nullLayer(pre + "Null card" + sfx);
  var logoN = nullLayer(pre + "Null logo" + sfx);
  var textN = nullLayer(pre + "Null text" + sfx);
  var master = nullLayer(pre + "Main null" + sfx);
  P.tf(master, "ADBE Position").setValue([CX, CY]);
  cardN.parent = master; logoN.parent = master; textN.parent = master;
  P.tf(cardN, "ADBE Position").setValue([0, 0]);
  P.tf(logoN, "ADBE Position").setValue([0, 0]);
  P.tf(textN, "ADBE Position").setValue([0, 0]);

  var i;
  for (i = 0; i < card.length; i++) { card[i].parent = cardN; P.tf(card[i], "ADBE Position").setValue([0, 0]); }
  ic.parent = logoN;
  P.tf(ic, "ADBE Position").setValue([lx, 0]);
  P.tf(ic, "ADBE Scale").setValue([LOGO / 954 * 100, LOGO / 954 * 100]);
  if (o.badge) {
    badge.layer.parent = logoN;
    P.tf(badge.layer, "ADBE Position").setValue([lx + LOGO / 2 - 6, -LOGO / 2 + 6]);
    bang.layer.parent = logoN;
    var br = bang.layer.sourceRectAtTime(0, false);
    P.tf(bang.layer, "ADBE Position").setValue([lx + LOGO / 2 - 6, -LOGO / 2 + 6]);
  }
  placeText(nm, textN); placeText(ms, textN); placeText(nw, textN);

  entrance(cardN); entrance(logoN); entrance(textN);

  var all = card.concat(logo).concat(text);
  for (i = 0; i < all.length; i++) all[i].motionBlur = true;
  return { card: card.concat([cardN]), logo: logo.concat([logoN]), text: text.concat([textN]), master: master };
}

// --- Original: the warning card (first notification) ---
var a = notification("", {
  tech: false, badge: true,
  title: "Backup failed", titleColor: "D7263D",
  message: "Storage is full. 214 photos were not saved."
});

// Push-back keys on the original's main null: first key at frame 13, second at frame 19.
var mp = P.tf(a.master, "ADBE Position");
mp.setValueAtTime(13 / FPS, [CX, CY]);
mp.setValueAtTime(19 / FPS, [CX, CY + SINK]);
var ms2 = P.tf(a.master, "ADBE Scale");
ms2.setValueAtTime(13 / FPS, [100, 100]);
ms2.setValueAtTime(19 / FPS, [90, 90]);
P.tf(a.master, "ADBE Position").expression = BOUNCE;
P.tf(a.master, "ADBE Scale").expression = BOUNCE;

// --- Duplicate set: the fix card, on top (built after, so it sits above) ---
var b = notification(" 2", {
  tech: true, badge: false,
  title: "Backup complete", titleColor: "1C1C1E",
  message: "All 1,418 photos are safe."
});

// Slide the copy later: card parts at +15 frames, logo group +2, text group +4 further (recipe 04 offsets).
function shift(list, t) {
  var i;
  for (i = 0; i < list.length; i++) list[i].startTime = t;
}
shift(b.card, DELAY);
shift(b.logo, DELAY + 2 / FPS);
shift(b.text, DELAY + 4 / FPS);
b.master.startTime = DELAY;

return { comp: c.name, id: c.id, layers: c.numLayers };
