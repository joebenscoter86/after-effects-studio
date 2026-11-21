// Shared pieces for the nHh0NRo8G2U "phase" scene, recipes 01-06 (loaded after prelude.jsx with $.evalFile(args.lib)).
// ExtendScript (ES3). The phase bar (01), its labels and their rise (02), the six step pictures and their pop (03),
// the five arrows (04), the photo precomp's black-and-white and jitter and the whole-frame finish (05), helpers.
// Every comp a script makes carries the script's number in its name ("nHh0 05 photos"), so re-running one script
// never removes another script's precomp (P.freshComp removes comps by name).
//
// VERIFY: TextDocument.font set to a missing PostScript name ("Satoshi-Black") does not throw, and reads back as another font or with fontObject.isSubstitute true
// VERIFY: TextDocument.resetParagraphStyle exists (used by the Tf0EiCGOEYs lib, which ran)
// VERIFY: ParagraphJustification.LEFT_JUSTIFY with anchor [0, 0] puts the layer origin at the left end of the baseline
// VERIFY: layer.setTrackMatte(matte, TrackMatteType.ALPHA_INVERTED) (AE 2023+) leaves the matte layer visible
// VERIFY: setTemporalEaseAtKey on Trim Paths End/Start (1D) takes one KeyframeEase per side; Scale takes one per dimension (prop.value.length); Position (spatial) one
// VERIFY: KeyframeEase speed units: %/s for Trim Paths and Scale, px/s for Position
// VERIFY: Trim Paths added at the root Contents ("ADBE Root Vectors Group") after the group trims the group's path
// VERIFY: "ADBE Vector Stroke Line Join" 1 = Miter, "ADBE Vector Stroke Line Cap" 1 = Butt
// VERIFY: the bounce expression's array * number (v*amp) works in the comp's expression engine (JavaScript engine supports array operators)
// VERIFY: effect("TECH Photo Jitter").active reads false when the effect switch is off (the expression also honours the checkbox value as a fallback)
// VERIFY: match names "ADBE HUE SATURATION", "ADBE Posterize Time", "ADBE Geometry2", "ADBE Checkbox Control" can be added with canAddProperty/addProperty
// VERIFY: Hue/Saturation display names "Channel Control" (1 = Master) and "Master Saturation"; Posterize Time "Frame Rate"
// VERIFY: Transform effect display names "Uniform Scale", "Position", and "Scale" (or "Scale Height"; NH.transformScale sets whichever exists, never "Scale Width")
// VERIFY: renaming an effect (fx.name = "TECH ...") is allowed and it can be fetched again by the new name
// VERIFY: Posterize Time on an adjustment layer steps the nested precomps below it (the recipe does this in the interface)
// VERIFY: an adjustment layer made from a solid (layer.adjustmentLayer = true) is comp-sized, so Transform's Position default is the comp centre
var NH = {};
// art.jsx must be evaluated at this file's top level: evaluated inside NH.init its `var ART` stayed local (run 2026-11-21: "ART is undefined").
if (typeof args !== "undefined" && args.artDir) $.evalFile(args.artLib || (File(args.lib).parent.fsName + "/art.jsx"));

// ---------------------------------------------------------------------------------------------------------------
// Fitting the recipes' 1920 x 1080 layout into the 1080 x 1920 phone frame. ONE uniform scale about one centre.
// The art brief may change these two; scripts may also pass args.scale and args.centre.
NH.SCALE = 0.8;              // every size, position, stroke width and travel distance is multiplied by this
NH.CENTRE = [540, 960];      // where the recipe frame's centre lands in the tall frame
NH.SOURCE_CENTRE = [960, 540]; // the recipe frame's centre (1920 x 1080)
// Not scaled: percentages, timings, eases, opacities, counts, wiggle frequency, Transform's Scale 101 %.
// ---------------------------------------------------------------------------------------------------------------

NH.W = 1080;
NH.H = 1920;
NH.FPS = 23.976;             // recipe 01 step 1: the screen shows 23.976 (narrator says 24)
NH.FRAMES = 96;              // set by NH.scene; precomps take the same length
NH.LABEL_WORDS = ["Grow", "Use"]; // stand-ins; the art brief gives the real words through args.labels
NH.artDir = null;
NH.artFolder = null;
NH.N = "";

// Recipe figures, in recipe pixels (1920 x 1080), as the recipes give them.
NH.BAR = {
  x0: 365, x1: 1556, y: 540, stroke: 60,           // recipe 01 step 2 and layout
  segs: [
    { name: "Bar 1", color: "#BFF06C", start: 0, end: 70, keys: [0, 24] },   // steps 3, 8
    // ASSUMED: the blue's typed value is unknown; #8FD3E0 is its measured render (recipe 01 step 5)
    { name: "Bar 2", color: "#8FD3E0", start: 71, end: 100, keys: [20, 44] } // steps 4, 9, 11
  ]
};
NH.LABEL = {
  size: 40.9, tracking: -95, fill: "#F3F3F3",       // recipe 01 step 6
  faces: ["Satoshi-Black", "Inter-ExtraBold", "Montserrat-Black"], // Satoshi is not installed on this Mac (checked ~/Library/Fonts)
  pos: [[366.6, 493], [1212.1, 493]],              // baseline-left positions (anchor 0,0)
  rise: 61, keys: [[10, 22], [32, 44]]             // recipe 02 steps 3, 6
};
NH.STEP = {
  x: [440, 635, 838, 1074, 1294, 1497],             // recipe 03 layout: measured centres
  y: 678,                                           // ASSUMED: one row at the middle of the measured 673-684
  h: [131, 103, 144, 139, 129, 134],                // measured heights
  w: [119, 104, 93, 160, 128, 85],                  // measured widths (stand-ins use them; art is fitted by height)
  maxW: 160,                                        // ASSUMED: art wider than the widest measured picture is fitted to this width
  popFirst: 22, popEvery: 10, popLen: 12,           // recipe 03 step 6, step 3
  // ASSUMED stand-in look: distinct saturated colours so the black-and-white finish (05) has tones to remove
  colors: ["#E8833A", "#D94F4F", "#3AA6A0", "#8A5CC2", "#E6C34A", "#4A7FD9"]
};
NH.ARROW = {
  pct: [28.2, 38.6, 49.0, 61.9, 73.0], y: 682,      // recipe 04 layout: centres in % of the 1920 width, row y
  offsets: [0, 8, 17, 29, 39],                      // step 7: in-point offsets of the five copies
  shaftKeys: [35, 47], barbKeys: [36, 49],          // step 5: keys inside the arrow's own timeline
  stroke: 3, half: 20, tip: [20, 0], barbEnd: [7, 13] // build notes: shaft (-20,0)->(20,0); barbs to about (7, +-13)
};
NH.FINISH = { posterize: 12, wiggleFps: 6, wiggleFreq: 222, wiggleAmp: 3, frameScale: 101, saturation: -100 }; // recipe 05
NH.BOUNCE = [
  "amp = .1;",
  "freq = 2.0;",
  "decay = 2.0;",
  "n = 0;",
  "if (numKeys > 0){ n = nearestKey(time).index; if (key(n).time > time){ n--; } }",
  "if (n == 0){ t = 0; } else { t = time - key(n).time; }",
  "if (n > 0 && t < 1){",
  "  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);",
  "  value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);",
  "} else { value; }"
].join("\n"); // recipe 03 step 5 (lines after freq inferred by the recipe)

// The S-curve cubic-bezier(0.88, 0.14, 0.12, 0.86): influence 88 %, speed at each key 0.14 / 0.88 of the average (lesson 31).
NH.S_INFL = 88;
NH.S_SLOPE = 0.14 / 0.88;

// ---- set-up --------------------------------------------------------------------------------------------------
NH.init = function (args, n) {
  NH.N = n;
  if (args.scale !== undefined) NH.SCALE = args.scale;
  if (args.centre) NH.CENTRE = [args.centre[0], args.centre[1]];
  var i;
  if (args.labels && args.labels.length) {
    for (i = 0; i < NH.BAR.segs.length && i < args.labels.length; i++) NH.LABEL_WORDS[i] = args.labels[i];
  }
  // Art-brief hooks (all optional; recipe values otherwise). args.segColors: [hexA, hexB]; args.labelColor: hex;
  // args.labelFaces: PostScript names tried first; args.labelSize: recipe px; args.stepHeights: six heights in recipe px;
  // args.ground: hex for the Background solid (each script passes it to NH.scene).
  if (args.segColors) for (i = 0; i < NH.BAR.segs.length && i < args.segColors.length; i++) NH.BAR.segs[i].color = args.segColors[i];
  if (args.labelColor) NH.LABEL.fill = args.labelColor;
  if (args.labelFaces) NH.LABEL.faces = args.labelFaces.concat(NH.LABEL.faces);
  if (args.labelSize) NH.LABEL.size = args.labelSize;
  if (args.stepHeights) for (i = 0; i < 6 && i < args.stepHeights.length; i++) NH.STEP.h[i] = args.stepHeights[i];
  NH.ground = args.ground || null;
  if (args.artDir) {
    NH.artDir = args.artDir;
    NH.artFolder = args.artFolder || ("nHh0 art " + n); // art.jsx is loaded at the library's top level (above)
  }
};

// ---- mapping -------------------------------------------------------------------------------------------------
NH.x = function (x) { return NH.CENTRE[0] + (x - NH.SOURCE_CENTRE[0]) * NH.SCALE; };
NH.y = function (y) { return NH.CENTRE[1] + (y - NH.SOURCE_CENTRE[1]) * NH.SCALE; };
NH.pt = function (p) { return [NH.x(p[0]), NH.y(p[1])]; };
NH.len = function (v) { return v * NH.SCALE; };
NH.t = function (frames) { return frames / NH.FPS; };
NH.hex = function (h) {
  h = h.replace("#", "");
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
};
NH.vec = function (v, n) {
  var out = [], i;
  for (i = 0; i < n; i++) out.push(i < v.length ? v[i] : 0);
  return out;
};
NH.dims = function (prop) {
  var v = prop.value;
  return (v instanceof Array) ? v.length : 1;
};
NH.r1 = function (v) { return Math.round(v * 10) / 10; };

// ---- comps ---------------------------------------------------------------------------------------------------
// Fresh comp at the phone size; also removes the solids the earlier build of the same comp used, once nothing else uses them.
// (Candidate for the prelude: "each re-run leaves orphan solids; remove only your own".)
NH.freshComp = function (name, frames, bg) {
  var i, j, it, src, ids = {}, solids = [];
  for (i = app.project.numItems; i >= 1; i--) {
    it = app.project.item(i);
    if (it instanceof CompItem && it.name === name) {
      for (j = 1; j <= it.numLayers; j++) {
        src = it.layer(j).source;
        if (src && (src instanceof FootageItem) && (src.mainSource instanceof SolidSource) && !ids[src.id]) {
          ids[src.id] = true;
          solids.push(src);
        }
      }
    }
  }
  var c = P.freshComp(name, NH.W, NH.H, NH.FPS, frames / NH.FPS, bg);
  for (i = 0; i < solids.length; i++) if (solids[i].usedIn.length === 0) solids[i].remove();
  return c;
};
// The main comp "nHh0 <n> <short>" with its Background layer at the bottom.
NH.scene = function (n, shortName, frames, groundHex) {
  NH.FRAMES = frames;
  if (NH.ground) groundHex = NH.ground; // art brief's ground (args.ground)
  var c = NH.freshComp("nHh0 " + n + " " + shortName, frames, NH.hex(groundHex));
  NH.background(c, groundHex);
  return c;
};
// Background: a comp-size solid named "Background"; on an art run with backdrop.png in artDir, that picture instead (same name).
NH.background = function (c, groundHex) {
  var l;
  if (NH.artDir && File(NH.artDir + "/backdrop.png").exists) {
    var item = ART.footage(NH.artDir, "backdrop.png", NH.artFolder);
    l = c.layers.add(item);
    var s = Math.max(c.width / item.width, c.height / item.height) * 100;
    P.tf(l, "ADBE Scale").setValue(NH.vec([s, s, s], NH.dims(P.tf(l, "ADBE Scale"))));
    P.tf(l, "ADBE Position").setValue(NH.vec([c.width / 2, c.height / 2], NH.dims(P.tf(l, "ADBE Position"))));
  } else {
    l = P.solid(c, "Background", NH.hex(groundHex), c.width, c.height);
  }
  l.name = "Background";
  l.moveToEnd();
  return l;
};
NH.adjustment = function (c, name) {
  var l = P.solid(c, name, [1, 1, 1], c.width, c.height);
  l.adjustmentLayer = true;
  l.name = name;
  return l;
};

// ---- keys and eases ------------------------------------------------------------------------------------------
// eases: one [inSpeed, inInfluence, outSpeed, outInfluence] per key.
NH.ease = function (prop, eases) {
  var k, i, n, a, b, e;
  for (k = 1; k <= prop.numKeys; k++) {
    prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    n = prop.isSpatial ? 1 : NH.dims(prop);
    e = eases[k - 1];
    a = [];
    b = [];
    for (i = 0; i < n; i++) {
      a.push(new KeyframeEase(e[0], e[1]));
      b.push(new KeyframeEase(e[2], e[3]));
    }
    prop.setTemporalEaseAtKey(k, a, b);
  }
};
// The S-curve on every key of a two-key move: speed = 0.159 x the average speed of the move (units per second).
NH.sEase = function (prop, delta, frames) {
  var sp = NH.S_SLOPE * Math.abs(delta) / NH.t(frames), list = [], k;
  for (k = 1; k <= prop.numKeys; k++) list.push([sp, NH.S_INFL, sp, NH.S_INFL]);
  NH.ease(prop, list);
  return sp;
};
// Straight spatial path: no auto-bezier drift between keys.
NH.straight = function (prop) {
  var k, n = NH.dims(prop);
  for (k = 1; k <= prop.numKeys; k++) {
    prop.setSpatialAutoBezierAtKey(k, false);
    prop.setSpatialContinuousAtKey(k, false);
    prop.setSpatialTangentsAtKey(k, NH.vec([0, 0], n), NH.vec([0, 0], n));
  }
};
// Set effect parameters by display name; throws on a missing name.
NH.setFx = function (fx, values) {
  var missing = [], k, j, found;
  for (k in values) {
    found = false;
    for (j = 1; j <= fx.numProperties; j++) {
      if (fx.property(j).name === k) { fx.property(j).setValue(values[k]); found = true; break; }
    }
    if (!found) missing.push(k);
  }
  if (missing.length) throw new Error(fx.name + ": parameters not found: " + missing.join(", "));
};
NH.fxProp = function (fx, name) {
  var j;
  for (j = 1; j <= fx.numProperties; j++) if (fx.property(j).name === name) return fx.property(j);
  throw new Error(fx.name + ": parameter not found: " + name);
};
// Add an effect by match name and rename it; returns the re-fetched effect.
NH.effect = function (layer, matchName, newName) {
  var fx = P.effect(layer, matchName);
  fx.name = newName;
  return layer.property("ADBE Effect Parade").property(newName);
};

// ---- fonts ---------------------------------------------------------------------------------------------------
NH.fontLog = [];
NH.setFont = function (prop, faces, label) {
  var i, d, back, fo, ok = false, used = null;
  for (i = 0; i < faces.length && !ok; i++) {
    d = prop.value;
    d.font = faces[i];
    prop.setValue(d);
    back = prop.value;
    fo = back.fontObject; // AE 24+; undefined leaves only the name check
    ok = (back.font === faces[i]) && !(fo && fo.isSubstitute);
    used = back.font;
  }
  NH.fontLog.push(label + ": wanted " + faces[0] + ", used " + used + ((ok && used === faces[0]) ? "" : " (SUBSTITUTE)") + (ok ? "" : " (NO FACE FOUND)"));
};

// ---- recipe 01: the phase bar ---------------------------------------------------------------------------------
// Two duplicate open strokes, butt caps, each with Trim Paths at the Contents level; End drawn on from its own Start.
NH.bar = function (c) {
  var out = [], i, sg, sh, root, ti, end, p0 = NH.pt([960, NH.BAR.y]);
  // Second segment first so the first ends up above it (order does not show: the segments never overlap).
  for (i = NH.BAR.segs.length - 1; i >= 0; i--) {
    sg = NH.BAR.segs[i];
    sh = P.shape(c, sg.name);
    P.path(sh, [[NH.x(NH.BAR.x0) - p0[0], 0], [NH.x(NH.BAR.x1) - p0[0], 0]], null, null, false);
    P.stroke(sh, NH.hex(sg.color), NH.len(NH.BAR.stroke), 1);
    P.tf(sh.layer, "ADBE Position").setValue(NH.vec(p0, NH.dims(P.tf(sh.layer, "ADBE Position"))));
    root = sh.layer.property("ADBE Root Vectors Group");
    ti = root.addProperty("ADBE Vector Filter - Trim").propertyIndex;
    sh.layer.property("ADBE Root Vectors Group").property(ti).property("ADBE Vector Trim Start").setValue(sg.start);
    end = sh.layer.property("ADBE Root Vectors Group").property(ti).property("ADBE Vector Trim End");
    // Pitfall: key End from the segment's own Start, not from 0.
    end.setValueAtTime(NH.t(sg.keys[0]), sg.start);
    end.setValueAtTime(NH.t(sg.keys[1]), sg.end);
    NH.sEase(end, sg.end - sg.start, sg.keys[1] - sg.keys[0]);
    out.unshift(sh.layer);
  }
  return out; // [Bar 1, Bar 2]
};

// ---- recipes 01/02: the labels ---------------------------------------------------------------------------------
// o.rise: recipe 02's rise out of the segment (inverted alpha matte to the segment, fast-in ease). Without it the
// labels sit at their final positions (recipe 01). o.labelColor: hex (recipe 06's dark green).
NH.labels = function (c, bars, o) {
  var out = [], i, l, prop, d, pos, p, k;
  for (i = 0; i < NH.BAR.segs.length; i++) {
    l = c.layers.addText(NH.LABEL_WORDS[i]);
    prop = l.property("ADBE Text Properties").property("ADBE Text Document");
    d = prop.value;
    d.resetCharStyle();
    d.resetParagraphStyle();
    d.fontSize = NH.len(NH.LABEL.size);
    d.fillColor = NH.hex(o.labelColor || NH.LABEL.fill);
    d.applyFill = true;
    d.applyStroke = false;
    d.tracking = NH.LABEL.tracking;
    d.justification = ParagraphJustification.LEFT_JUSTIFY;
    prop.setValue(d);
    l.name = "Label " + (i + 1);
    NH.setFont(prop, NH.LABEL.faces, l.name);
    P.tf(l, "ADBE Anchor Point").setValue(NH.vec([0, 0], NH.dims(P.tf(l, "ADBE Anchor Point"))));
    p = NH.pt(NH.LABEL.pos[i]);
    pos = P.tf(l, "ADBE Position");
    if (o.rise) {
      k = NH.LABEL.keys[i];
      pos.setValueAtTime(NH.t(k[0]), NH.vec([p[0], p[1] + NH.len(NH.LABEL.rise)], NH.dims(pos)));
      pos.setValueAtTime(NH.t(k[1]), NH.vec(p, NH.dims(pos)));
      NH.straight(pos);
      // cubic-bezier(0.04, 0.47, 0.53, 0.93): out of key 1 influence 4 %, 11.75 x average; into key 2 influence 47 %, 0.149 x average.
      var avg = NH.len(NH.LABEL.rise) / NH.t(k[1] - k[0]);
      NH.ease(pos, [[avg * 11.75, 4, avg * 11.75, 4], [avg * 0.149, 47, avg * 0.149, 47]]);
      l.setTrackMatte(bars[i], TrackMatteType.ALPHA_INVERTED);
      // Run 2026-11-21: setTrackMatte switched the segment's video off (the bar vanished); switch it back on (recipe 02 step 5).
      bars[i].enabled = true;
      l.inPoint = NH.t(k[0]);
    } else {
      pos.setValue(NH.vec(p, NH.dims(pos)));
    }
    out.push(l);
  }
  return out;
};

// ---- recipe 03: the six step pictures ----------------------------------------------------------------------------
// Stand-ins: shape layers "Step k" (a rounded body at the measured size with an inner disc for tone), anchor at the centre.
// Art run (NH.artDir): step-<k>.png fitted to the measured height (width capped at NH.STEP.maxW), anchor at its centre.
// o.pop: Scale 0 -> full over 12 frames, S-curve ease, bounce expression, 10 frames apart from frame 22.
// o.jitter: recipe 05's per-photo posterizeTime(6) wiggle on Position, switchable by the effect "TECH Photo Jitter".
NH.fillGroup = function (layer, kind, size, color, offset, roundness) {
  var root = layer.property("ADBE Root Vectors Group");
  var gi = root.addProperty("ADBE Vector Group").propertyIndex;
  var vg = function () { return layer.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group"); };
  var si;
  if (kind === "rect") {
    si = vg().addProperty("ADBE Vector Shape - Rect").propertyIndex;
    vg().property(si).property("ADBE Vector Rect Size").setValue(size);
    vg().property(si).property("ADBE Vector Rect Position").setValue(offset);
    vg().property(si).property("ADBE Vector Rect Roundness").setValue(roundness);
  } else {
    si = vg().addProperty("ADBE Vector Shape - Ellipse").propertyIndex;
    vg().property(si).property("ADBE Vector Ellipse Size").setValue(size);
    vg().property(si).property("ADBE Vector Ellipse Position").setValue(offset);
  }
  var fi = vg().addProperty("ADBE Vector Graphic - Fill").propertyIndex;
  vg().property(fi).property("ADBE Vector Fill Color").setValue(color);
};
NH.stepLayer = function (c, k) {
  var i = k - 1, l, full, sc;
  var w = NH.len(NH.STEP.w[i]), h = NH.len(NH.STEP.h[i]);
  if (NH.artDir) {
    var item = ART.footage(NH.artDir, "step-" + k + ".png", NH.artFolder);
    l = c.layers.add(item);
    full = Math.min(h / item.height, NH.len(NH.STEP.maxW) / item.width) * 100;
  } else {
    l = c.layers.addShape();
    var col = NH.hex(NH.STEP.colors[i]);
    // ASSUMED stand-in: inner disc (added first, so it draws on top) in a darker tone of the body colour.
    NH.fillGroup(l, "ellipse", [Math.min(w, h) * 0.55, Math.min(w, h) * 0.55], [col[0] * 0.55, col[1] * 0.55, col[2] * 0.55], [0, -h * 0.08], 0);
    NH.fillGroup(l, "rect", [w, h], col, [0, 0], NH.len(18));
    full = 100;
  }
  l.name = "Step " + k;
  sc = P.tf(l, "ADBE Scale");
  sc.setValue(NH.vec([full, full, full], NH.dims(sc)));
  P.tf(l, "ADBE Position").setValue(NH.vec(NH.pt([NH.STEP.x[i], NH.STEP.y]), NH.dims(P.tf(l, "ADBE Position"))));
  return { layer: l, full: full };
};
NH.steps = function (c, o) {
  var out = [], k, s, sc, f0, n, fx, amp;
  // Step 6 first, so Step 1 ends on top (recipe 03 pitfall: the first step on top).
  for (k = 6; k >= 1; k--) {
    s = NH.stepLayer(c, k);
    if (o.pop) {
      sc = P.tf(s.layer, "ADBE Scale");
      n = NH.dims(sc);
      f0 = NH.STEP.popFirst + NH.STEP.popEvery * (k - 1);
      sc.setValueAtTime(NH.t(f0), NH.vec([0, 0, 0], n));
      sc.setValueAtTime(NH.t(f0 + NH.STEP.popLen), NH.vec([s.full, s.full, s.full], n));
      NH.sEase(sc, s.full, NH.STEP.popLen);
      P.tf(s.layer, "ADBE Scale").expression = NH.BOUNCE;
    }
    if (o.jitter) {
      fx = NH.effect(s.layer, "ADBE Checkbox Control", "TECH Photo Jitter");
      fx.property(1).setValue(1);
      amp = NH.r1(NH.len(NH.FINISH.wiggleAmp) * 100) / 100;
      // Recipe 05 step 3: posterizeTime(6) / wiggle(222,3), amplitude scaled. The condition is ours: it lets the runner
      // switch the jitter off for a before frame (effect switch off, or checkbox unticked).
      P.tf(s.layer, "ADBE Position").expression = [
        "posterizeTime(" + NH.FINISH.wiggleFps + ");",
        "var e = effect(\"TECH Photo Jitter\");",
        "(e.active && e(1) == 1) ? wiggle(" + NH.FINISH.wiggleFreq + "," + amp + ") : value"
      ].join("\n");
    }
    out.unshift(s.layer);
  }
  return out; // [Step 1 .. Step 6]
};

// ---- recipe 05: the photo precomp ------------------------------------------------------------------------------
// SUBSTITUTE: Layer > Pre-compose of the six photo layers is built directly: the photos are made inside "nHh0 <n> photos"
// (comp size, same length, starting at 0, so their key times are unchanged), with an adjustment layer "TECH Mono" on top.
NH.photos = function (c, o) {
  var pc = NH.freshComp("nHh0 " + NH.N + " photos", NH.FRAMES, [0, 0, 0]);
  var steps = NH.steps(pc, { pop: o.pop, jitter: true });
  var adj = NH.adjustment(pc, "TECH Mono");
  adj.moveToBeginning();
  var fx = NH.effect(adj, "ADBE HUE SATURATION", "TECH Hue/Saturation");
  NH.setFx(fx, { "Channel Control": 1, "Master Saturation": NH.FINISH.saturation });
  var l = c.layers.add(pc);
  l.name = "Photos";
  return { comp: pc, layer: l, steps: steps, saturation: NH.fxProp(adj.property("ADBE Effect Parade").property("TECH Hue/Saturation"), "Master Saturation").value };
};

// ---- recipe 04: the arrows ---------------------------------------------------------------------------------------
// The arrow precomp "nHh0 <n> arrow" (comp size): Shaft, Barb up, Barb down, each a stroke-only path with Trim Paths,
// drawn about the precomp's centre. Five copies of it in c, each in a gap between pictures, in-points offset.
NH.arrowPart = function (ac, name, verts, ins, outs) {
  var sh = P.shape(ac, name);
  var S = NH.SCALE, i, v = [], a = [], b = [];
  for (i = 0; i < verts.length; i++) {
    v.push([verts[i][0] * S, verts[i][1] * S]);
    a.push([ins[i][0] * S, ins[i][1] * S]);
    b.push([outs[i][0] * S, outs[i][1] * S]);
  }
  P.path(sh, v, a, b, false);
  var si = P.stroke(sh, [1, 1, 1], NH.len(NH.ARROW.stroke), 1);
  P.contents(sh).property(si).property("ADBE Vector Stroke Line Join").setValue(1);
  P.tf(sh.layer, "ADBE Position").setValue(NH.vec([ac.width / 2, ac.height / 2], NH.dims(P.tf(sh.layer, "ADBE Position"))));
  var ti = sh.layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Filter - Trim").propertyIndex;
  return { layer: sh.layer, trim: function () { return sh.layer.property("ADBE Root Vectors Group").property(ti); } };
};
NH.arrowComp = function () {
  var A = NH.ARROW, h = A.half, tp = A.tip, be = A.barbEnd;
  var ac = NH.freshComp("nHh0 " + NH.N + " arrow", NH.FRAMES, [0, 0, 0]);
  // ASSUMED barb curve (recipe gives only the drawn result). Run 2026-11-21: out-tangent (-8, -+1) left the tip almost along the
  // shaft; (-5, -+5) leaves it at the recipe's 45 deg back from the shaft, and
  // curls so its free end points straight up/down. First vertex at the tip, so End 0 -> 100 grows from the tip.
  var up = NH.arrowPart(ac, "Barb up", [tp, [be[0], -be[1]]], [[0, 0], [0, 7]], [[-5, -5], [0, 0]]);
  var dn = NH.arrowPart(ac, "Barb down", [tp, [be[0], be[1]]], [[0, 0], [0, -7]], [[-5, 5], [0, 0]]);
  // Shaft drawn left to right; Start 100 -> 0 grows it from the tip back to the tail.
  var sf = NH.arrowPart(ac, "Shaft", [[-h, 0], [h, 0]], [[0, 0], [0, 0]], [[0, 0], [0, 0]]);
  var st = sf.trim().property("ADBE Vector Trim Start");
  st.setValueAtTime(NH.t(A.shaftKeys[0]), 100);
  st.setValueAtTime(NH.t(A.shaftKeys[1]), 0);
  var spShaft = NH.sEase(sf.trim().property("ADBE Vector Trim Start"), 100, A.shaftKeys[1] - A.shaftKeys[0]);
  var parts = [up, dn], i, en, spBarb;
  for (i = 0; i < parts.length; i++) {
    en = parts[i].trim().property("ADBE Vector Trim End");
    en.setValueAtTime(NH.t(A.barbKeys[0]), 0);
    en.setValueAtTime(NH.t(A.barbKeys[1]), 100);
    spBarb = NH.sEase(parts[i].trim().property("ADBE Vector Trim End"), 100, A.barbKeys[1] - A.barbKeys[0]);
  }
  return { comp: ac, speeds: "shaft " + NH.r1(spShaft) + " %/s, barbs " + NH.r1(spBarb) + " %/s" };
};
// SUBSTITUTE: Pre-compose and Duplicate x4 with Shift+arrow nudges are built as five layers of one precomp.
NH.arrows = function (c) {
  var a = NH.arrowComp(), out = [], k, l;
  for (k = NH.ARROW.pct.length; k >= 1; k--) {
    l = c.layers.add(a.comp);
    l.name = "Arrow " + k;
    l.startTime = NH.t(NH.ARROW.offsets[k - 1]);
    P.tf(l, "ADBE Position").setValue(NH.vec(NH.pt([NH.ARROW.pct[k - 1] / 100 * 1920, NH.ARROW.y]), NH.dims(P.tf(l, "ADBE Position"))));
    out.unshift(l);
  }
  return { comp: a.comp, layers: out, speeds: a.speeds };
};

// ---- the whole scene ---------------------------------------------------------------------------------------------
// o: rise (02), pop (03), arrows (04), photoComp (05: photos in a black-and-white, jittering precomp), labelColor (06).
NH.content = function (c, o) {
  var out = {};
  out.bars = NH.bar(c);
  out.labels = NH.labels(c, out.bars, o);
  if (o.photoComp) out.photos = NH.photos(c, o);
  else out.steps = NH.steps(c, o);
  if (o.arrows) out.arrows = NH.arrows(c);
  return out;
};

// ---- recipe 05: the whole-frame finish ---------------------------------------------------------------------------
// Two adjustment layers above everything: "TECH Posterize Time" (12 fps) on top, "TECH Frame Jitter" (Transform:
// Scale 101 uniform, Position posterizeTime(6) wiggle(222,3), amplitude scaled) second.
NH.transformScale = function (fx, v) {
  var j, n = 0, nm;
  for (j = 1; j <= fx.numProperties; j++) {
    nm = fx.property(j).name;
    // With Uniform Scale on, Scale Width follows the height and is not set (it may refuse a value while disabled).
    if (nm === "Scale" || nm === "Scale Height") { fx.property(j).setValue(v); n++; }
  }
  if (!n) throw new Error(fx.name + ": no Scale parameter found");
};
NH.finish = function (c) {
  var jl = NH.adjustment(c, "TECH Frame Jitter");
  var tr = NH.effect(jl, "ADBE Geometry2", "TECH Transform");
  NH.setFx(tr, { "Uniform Scale": 1 });
  tr = jl.property("ADBE Effect Parade").property("TECH Transform");
  NH.transformScale(tr, NH.FINISH.frameScale);
  tr = jl.property("ADBE Effect Parade").property("TECH Transform");
  var amp = NH.r1(NH.len(NH.FINISH.wiggleAmp) * 100) / 100;
  NH.fxProp(tr, "Position").expression = "posterizeTime(" + NH.FINISH.wiggleFps + ");\nwiggle(" + NH.FINISH.wiggleFreq + "," + amp + ")";
  jl.moveToBeginning();
  var pl = NH.adjustment(c, "TECH Posterize Time");
  var pt = NH.effect(pl, "ADBE Posterize Time", "TECH Posterize Time");
  NH.setFx(pt, { "Frame Rate": NH.FINISH.posterize });
  pl.moveToBeginning();
  return { posterize: pl, jitter: jl, amp: amp };
};

// ---- art brief dressing: kicker, two-line headline, source line ---------------------------------------------------
// Set in the tall frame's own space (not scaled), centred on x 540, positions are baselines. o.paper: 06's ink colours;
// o.lift: px the kicker and headline move up (06: 40); o.above: the layer the kicker and headline sit directly above
// (default "Background"). The source goes to the top of the stack; call before NH.finish so the finish stays above it.
NH.DRESS = {
  kicker: { text: "THE LIFE OF A PAIR OF JEANS  01", face: "IBMPlexMono-Medium", size: 26, tracking: 150, y: 600, dark: "#8A8F99", paper: "#6B707A" },
  line1: { text: "From cotton field", face: "InstrumentSerif-Regular", size: 88, tracking: 0, y: 690, dark: "#F5F3EE", paper: "#1B2440" },
  line2: { text: "to laundry day", face: "InstrumentSerif-Italic", size: 88, tracking: 0, y: 774, dark: "#F5B93A", paper: "#1B2440" },
  source: { text: "Stages simplified for illustration", face: "IBMPlexMono-Regular", size: 22, tracking: 0, y: 1790, dark: "#6B707A", paper: "#6B707A" }
};
NH.dressText = function (c, name, s, paper, lift) {
  var l = c.layers.addText(s.text);
  var prop = l.property("ADBE Text Properties").property("ADBE Text Document");
  var d = prop.value;
  d.resetCharStyle();
  d.resetParagraphStyle();
  d.fontSize = s.size;
  d.fillColor = NH.hex(paper ? s.paper : s.dark);
  d.applyFill = true;
  d.applyStroke = false;
  d.tracking = s.tracking;
  d.justification = ParagraphJustification.CENTER_JUSTIFY;
  prop.setValue(d);
  l.name = name;
  NH.setFont(l.property("ADBE Text Properties").property("ADBE Text Document"), [s.face], name);
  P.tf(l, "ADBE Anchor Point").setValue(NH.vec([0, 0], NH.dims(P.tf(l, "ADBE Anchor Point"))));
  P.tf(l, "ADBE Position").setValue(NH.vec([c.width / 2, s.y - (lift || 0)], NH.dims(P.tf(l, "ADBE Position"))));
  return l;
};
NH.dress = function (c, o) {
  o = o || {};
  var D = NH.DRESS, ref = o.above || c.layer("Background");
  var src = NH.dressText(c, "Source", D.source, o.paper, 0);
  src.moveToBeginning();
  var h2 = NH.dressText(c, "Headline 2", D.line2, o.paper, o.lift);
  var h1 = NH.dressText(c, "Headline 1", D.line1, o.paper, o.lift);
  var k = NH.dressText(c, "Kicker", D.kicker, o.paper, o.lift);
  h2.moveBefore(ref);
  h1.moveBefore(ref);
  k.moveBefore(ref);
  return { kicker: k, headline: [h1, h2], source: src };
};
// Cap-plus-ascender height of a text layer anchored on its baseline (comp px).
NH.inkTop = function (l) { return NH.r1(-l.sourceRectAtTime(0, false).top * P.tf(l, "ADBE Scale").value[1] / 100); };

// ---- report --------------------------------------------------------------------------------------------------
NH.stack = function (c) {
  var s = [], i;
  for (i = 1; i <= c.numLayers; i++) s.push(c.layer(i).name);
  return s.join(" / ");
};
NH.report = function (c, extra) {
  var r = { comp: c.name, id: c.id, layers: c.numLayers, frames: Math.round(c.duration * NH.FPS), stack: NH.stack(c),
    fit: "SCALE " + NH.SCALE + " about (" + NH.CENTRE[0] + ", " + NH.CENTRE[1] + ")", fonts: NH.fontLog.join(" | "),
    art: NH.artDir ? NH.artDir : "stand-ins" };
  var k;
  if (extra) for (k in extra) r[k] = extra[k];
  return r;
};
