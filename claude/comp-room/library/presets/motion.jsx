// motion.jsx: the JoeB motion kit (2026-10-06). Prepended by go.sh after house.jsx. Definitions only: nothing here runs at load.
// The rules these functions serve are in production/joeb-motion-playbook.md; the worked example is
// production/after-effects/2026-10-05-house-polish-proto/scripts/ (b01 frame, b02 and b03 sections), which is built from this file.
var NAVY = [0.078, 0.129, 0.239], VERM = [0.886, 0.278, 0.169], WIN = [0.082, 0.09, 0.11], PAPERC = [0.949, 0.933, 0.894], GREY = [0.62, 0.64, 0.69],
    LINE = [0.078, 0.129, 0.239], SOFT = [0.42, 0.46, 0.55];
var KIT = H.assets + "house-kit/objects/", PAPER_LOOP = H.assets + "house-kit/plates/paper-grid-loop.mov";   // generated icons (tools/greenkey.py) and the 10 s grid loop (tools/make_grid.py)
var GROT = null, ROUND = null, SERIF = null, STAGE = null, topL = null, MG_END = 0, CAPS = [];
function font(fam, sty) { var f = app.fonts.getFontsByFamilyNameAndStyleName(fam, sty); if (!f || !f.length) throw new Error(fam + " " + sty + " is not installed (Google Fonts, ~/Library/Fonts)"); return f[0].postScriptName; }

// ---------- the frame ----------
// matBegin(t0, t1): the mat for a span: head-pop face card, the moving paper grid, grain off, the card key tightened for light paper.
// Call it once per mat span, before any title, caption or picture in that span. New layers then stack above the paper in the order made.
function matBegin(t0, t1) {
  if (!GROT) { GROT = font("Inter Tight", "Medium"); ROUND = font("Inter Tight", "SemiBold"); SERIF = font("Instrument Serif", "Italic"); }
  c.motionBlur = true; c.shutterAngle = 180; var tag = Math.round(t0 * 100);
  faceCard(t0, t1);
  STAGE = c.layers.add(footage(PAPER_LOOP)); STAGE.name = "M_PAPER_" + tag; STAGE.moveBefore(c.layer("M_MAT_" + tag)); STAGE.position.setValue([540, 960]);
  STAGE.timeRemapEnabled = true; var tr = STAGE.property("ADBE Time Remapping"); tr.setValueAtTime(10 - F(1), 10 - F(1)); tr.removeKey(tr.numKeys); tr.expression = "loopOut('cycle')"; STAGE.inPoint = t0; STAGE.outPoint = t1;
  c.layer("GRAIN").enabled = false;   // no grain on paper (the whole comp, room spans included, until Joe rules on the room)
  setByName(c.layer("M_JOECARD_" + tag).property("ADBE Effect Parade").property(1), "Clip Black", 42);   // the key's faint haze reads as a grey band on light paper; check hair edges
  topL = STAGE; MG_END = t1; return STAGE;
}
function sectionEnd(t) { MG_END = t; }   // the default out point for S() and icon() from here on
function place(L, t0, t1) { L.moveBefore(topL); topL = L; if (t0 !== undefined) span(L, t0, t1); return L; }
function shp(name, t0, t1) { var L = c.layers.addShape(); L.name = "D_" + name; return place(L, t0, t1); }
function grp(L) { return L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group").property("ADBE Vectors Group"); }
function pathOf(v, pts, closed) { var p = v.addProperty("ADBE Vector Shape - Group"); var s = new Shape(); s.vertices = pts; s.closed = !!closed; p.property("ADBE Vector Shape").setValue(s); }
function rectOf(v, w, h, r) { var rc = v.addProperty("ADBE Vector Shape - Rect"); rc.property("ADBE Vector Rect Size").setValue([w, h]); rc.property("ADBE Vector Rect Roundness").setValue(r); }
function ellOf(v, d) { v.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([d, d]); }
function strokeOf(v, color, w, dash) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(color); st.property("ADBE Vector Stroke Width").setValue(w);
  st.property("ADBE Vector Stroke Line Cap").setValue(2); st.property("ADBE Vector Stroke Line Join").setValue(2);
  if (dash) { st.property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1").setValue(dash); v.property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1").setValue(dash); } }
function fillOf(v, color) { v.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(color); }
function drawOn(v, t0, t1) { var e = v.addProperty("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"); keysAt(e, [t0, t1], [0, 100], 70); }
function fade(L, ts, vs) { keysAt(L.opacity, ts, vs, 50); }
function nul(name, pos, t0, t1) { var n = c.layers.addNull(); n.name = "D_" + name; n.position.setValue(pos); place(n, t0, t1); return n; }
function kid(L, n) { L.parent = n; return L; }
function dropOut(L, t) { L.motionBlur = true; var p = L.position.value; keysAt(L.position, [t, t + F(6)], [p, [p[0], p[1] + 520]], 60); keysAt(L.opacity, [t + F(2), t + F(6)], [100, 0]); }

// ---------- titles: two lines, grotesk ink + italic serif accent, held for the whole section ----------
function title(t0, t1, top, bottom, pre) {
  var a = textLayer("D_T1_" + Math.round(t0 * 100), top, GROT, 78, NAVY, [540, 214], null, null, -24); place(a, Math.max(0, t0), t1);
  var b = textLayer("D_T2_" + Math.round(t0 * 100), bottom, SERIF, 150, VERM, [540, 326], null, null, -14); place(b, Math.max(0, t0), t1);
  var bw = b.sourceRectAtTime(1, false).width; if (bw > 930) b.scale.setValue([93000 / bw, 93000 / bw]);
  buildIn(a, t0 - (pre || 0), 8, 80); buildIn(b, t0 - (pre || 0) + F(3), 9, 150);
  var w = Math.min(bw, 930) * 0.42, u = shp("TU_" + Math.round(t0 * 100), Math.max(0, t0), t1), v = grp(u);
  pathOf(v, [[-w / 2, 0], [w / 2, 0]], false); strokeOf(v, VERM, 5); drawOn(v, t0 + F(8) - (pre || 0), t0 + F(18) - (pre || 0)); u.position.setValue([540, 408]);
}
var matTitle = title;
// matCaps(rows, end): rows = [[seconds, "words"], ...]; calm lowercase captions between the stage and his head. capsToTop() after the pictures are built.
function matCaps(rows, end) { CAPS = rows; for (var i = 0; i < rows.length; i++) { var cl = textLayer("C_P_" + i, rows[i][1], ROUND, 48, NAVY, [540, 1052], null, null, -6); place(cl, rows[i][0], i + 1 < rows.length ? rows[i + 1][0] : end); } }
function capsToTop() { for (var i = 0; i < CAPS.length; i++) { var cL = c.layer("C_P_" + i); cL.moveBefore(topL); topL = cL; } }

// ---------- motion (frames at 30 fps) ----------
function K(prop, fr, vs, mode) {   // "s" settle (pace out, soft in), "io" heavy S-curve, "i" accelerate away, "l" linear
  for (var i = 0; i < fr.length; i++) prop.setValueAtTime(F(fr[i]), vs[i]); if (mode == "l") return prop;
  var T = PropertyValueType, a = 1; if (prop.propertyValueType === T.TwoD || prop.propertyValueType === T.ThreeD) a = prop.value.length;
  for (var j = 0; j < fr.length; j++) { var k = prop.nearestKeyIndex(F(fr[j])); prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
    var inI = mode == "i" ? 12 : (mode == "io" ? 82 : 85), outI = mode == "i" ? 75 : (mode == "io" ? 82 : 28), ei = [], eo = [];
    for (var d = 0; d < a; d++) { ei.push(new KeyframeEase(0, inI)); eo.push(new KeyframeEase(0, outI)); } prop.setTemporalEaseAtKey(k, ei, eo); }
  return prop; }
var ELASTIC = "var n = 0; if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }\nif (n > 0 && n == numKeys) { var t = time - key(n).time, v = velocityAtTime(key(n).time - thisComp.frameDuration / 10); value + v * 0.05 * Math.sin(2.6 * t * 2 * Math.PI) / Math.exp(6.5 * t); } else value;";
function pop(L, fr, from) { K(L.scale, [fr, fr + 3], [[from || 0, from || 0], [100, 100]], "l"); L.scale.expression = ELASTIC; }   // 3 linear frames into the spring (the pros' pop, mined)
function S(name, f0, f1) { return shp(name, F(f0), f1 === undefined ? MG_END : F(f1)); }
function trim(v) { return v.addProperty("ADBE Vector Filter - Trim"); }
function draw(v, f0, f1, mode) { var t = trim(v); K(t.property("ADBE Vector Trim End"), [f0, f1], [0, 100], mode || "s"); return t; }
function sk(v, color, w, dash, gap) { strokeOf(v, color, w); if (dash) { var d = v.property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Dashes"); d.addProperty("ADBE Vector Stroke Dash 1").setValue(dash); v.property("ADBE Vector Graphic - Stroke").property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Gap 1").setValue(gap || dash); } }
function pagePath(v, w, h, fold) { pathOf(v, [[-w / 2, -h / 2], [w / 2 - fold, -h / 2], [w / 2, -h / 2 + fold], [w / 2, h / 2], [-w / 2, h / 2]], true); }
function at0(L) { L.position.setValue([0, 0]); L.anchorPoint.setValue([0, 0]); return L; }
function dashLine(name, p0, p1, f0, f1, fOut) { var L = S(name, f0, fOut), v = grp(L); pathOf(v, [p0, p1], false); sk(v, LINE, 1.8, 9, 7); draw(v, f0, f1); return at0(L); }

function twoShadows(L, k) { var a = fx(L, "ADBE Drop Shadow"); a.property("Shadow Color").setValue([0.07, 0.1, 0.2, 1]); a.property("Opacity").setValue(70); a.property("Direction").setValue(135); a.property("Distance").setValue(5 * k); a.property("Softness").setValue(12 * k);
  var b = fx(L, "ADBE Drop Shadow"); b.property("Shadow Color").setValue([0.07, 0.1, 0.2, 1]); b.property("Opacity").setValue(46); b.property("Direction").setValue(135); b.property("Distance").setValue(30 * k); b.property("Softness").setValue(64 * k); }
var WHITEP = [1, 1, 1], FLAP = [0.84, 0.86, 0.9];
function icon(name, file, h, f0, f1) { var I = c.layers.add(footage(KIT + file)); I.name = "D_" + name; place(I, F(f0), f1 === undefined ? MG_END : F(f1)); var s = h / I.source.height * 100; I.scale.setValue([s, s]); return I; }

// the whip (Greg Isenberg, measured): one frame carries about 40% of the travel; new objects appear on the fast frame
var WHIP_OUT = [0, -8, -26, -66, -150, -430, -760], WHIP_IN = [640, 300, 118, 56, 26, 11, 4, 0];
function matWhipOut(N, f0, dir) { var p = N.position.value; for (var i = 0; i < WHIP_OUT.length; i++) N.position.setValueAtTime(F(f0 + i), [p[0], p[1] + (dir || 1) * WHIP_OUT[i]]); }   // dir 1 leaves upward, -1 downward
function matWhipIn(N, f0, dir) { var p = N.position.value; for (var i = 0; i < WHIP_IN.length; i++) N.position.setValueAtTime(F(f0 + i), [p[0], p[1] + (dir || 1) * WHIP_IN[i]]); }       // dir 1 arrives from below, -1 from above
// the AI: the Claude spark, tinted to the accent, turning slowly for as long as it lives
function spark(size, f0, t1) { var L = c.layers.add(footage(PROPS + "claude-spark-alpha.png")); L.name = "D_SPARK"; place(L, 0, t1); L.inPoint = F(f0); L.outPoint = t1; fx(L, "ADBE Fill").property("Color").setValue([VERM[0], VERM[1], VERM[2], 1]);
  var s = size / Math.max(L.source.width, L.source.height) * 100; L.scale.setValue([s, s]); L.rotation.expression = "time * 46"; return L; }
// (named matWhip*: house.jsx already has a camera whipOut(t0) for the room)
function placeBelow(L, ref) { L.moveAfter(ref); return L; }   // place() always stacks on top; use this to slip a layer under an existing one (files going behind a folder)
// popTo: the pop for IMAGE layers and anything whose resting scale is not 100: 3 linear frames from `from` x B to B, then the spring. One pop per layer;
// a layer that needs a second spring later gets the expression in the reference b03.jsx (NUMBOX), which springs after chosen key indexes.
function popTo(L, f, B, from) { var a = B * (from === undefined ? 0.3 : from); K(L.scale, [f, f + 3], [[a, a], [B, B]], "l"); L.scale.expression = ELASTIC; }
// barLine: a bar that grows from its left end (a round-capped stroke with Trim End; returns the Trim End property to key 0..100). Robust inside helpers,
// unlike a rect whose position is tied to its size by an expression.
function barLine(name, x0, y, len, thick, color, f0, f1) { var L = S(name, f0, f1), v = grp(L); pathOf(v, [[0, 0], [len, 0]], false); sk(v, color, thick); L.position.setValue([x0, y]); L.anchorPoint.setValue([0, 0]);
  return v.addProperty("ADBE Vector Filter - Trim").property("ADBE Vector Trim End"); }
function squashDelete(L, f, B) { K(L.scale, [f, f + 3], [[B, B], [B * 1.12, B * 0.04]], "i"); L.outPoint = F(f + 3); }   // B = the layer's resting scale %
