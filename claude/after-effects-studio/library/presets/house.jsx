// house.jsx: the JoeB house style library. Prepended by go.sh. ES3 ExtendScript.
// Every mode and device call writes a marker so check.py can read the build back.
var H = (typeof AES_HOUSE_CONFIG !== "undefined") ? AES_HOUSE_CONFIG : {};
var _defaults = {assets:"",rig:"",lib:"",kit:"",lut:"",textures:"",project:"",head:[540,720],headTop:549,fps:30};
for(var _k in _defaults) if(_defaults.hasOwnProperty(_k) && H[_k] === undefined) H[_k]=_defaults[_k];
// Configure asset directories (trailing slash), LUT and MASTER rig before house calls.

var WHITE = [1, 1, 1], BRICK = [0.545, 0.231, 0.196], ORANGE = [0.949, 0.329, 0.176], LIGHTGREY = [0.878, 0.878, 0.878],
    INK = [0.09, 0.12, 0.30], RED = [0.816, 0.192, 0.176], PAPER = [0.97, 0.965, 0.95], NEAR_BLACK = [0.07, 0.08, 0.12], CREAM = [0.961, 0.957, 0.937],
    CAP_YELLOW = [0.957, 0.941, 0.486], CAP_INK = [0.09, 0.082, 0.07];   // the v5 karaoke caption colours
var out = [];
function F(n) { return n / H.fps; }
function comp(n) { for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof CompItem && it.name == n) return it; } return null; }
var c = comp("MASTER");
function footage(path) {
  var f = new File(path);
  for (var i = 1; i <= app.project.numItems; i++) { var it = app.project.item(i); if (it instanceof FootageItem && it.file && it.file.fsName == f.fsName) return it; }
  if (!f.exists) throw new Error("missing file " + path);
  return app.project.importFile(new ImportOptions(f));
}
function lay(n) { try { return c.layer(n); } catch (e) { return null; } }
function camera() { return c.layer("CAMERA"); }
function board() { return c.layer("BOARD"); }
function span(L, a, b) { L.inPoint = a; L.outPoint = b; return L; }
function removePrefix(p) { // removes layers named p..., then effects named p... on the layers that remain (mode zoom blurs live on FX)
  for (var i = c.numLayers; i >= 1; i--) if (c.layer(i).name.indexOf(p) == 0) c.layer(i).remove();
  for (var l = 1; l <= c.numLayers; l++) { var ef = c.layer(l).property("ADBE Effect Parade"); if (!ef) continue; for (var k = ef.numProperties; k >= 1; k--) if (ef.property(k).name.indexOf(p) == 0) ef.property(k).remove(); } }
function clearKeys(prop) { while (prop.numKeys) prop.removeKey(1); return prop; }
function dims(prop) { return (prop.propertyValueType == PropertyValueType.TwoD_SPATIAL || prop.propertyValueType == PropertyValueType.ThreeD_SPATIAL) ? 1 : (prop.value instanceof Array ? prop.value.length : 1); }
function easeAt(prop, times, infl) {
  for (var k = 1; k <= prop.numKeys; k++) { var kt = prop.keyTime(k), hit = false; for (var i = 0; i < times.length; i++) if (Math.abs(kt - times[i]) < 0.001) hit = true; if (!hit) continue;
    var e = []; for (var d = 0; d < dims(prop); d++) e.push(new KeyframeEase(0, infl)); prop.setTemporalEaseAtKey(k, e, e); }
}
function keysAt(prop, ts, vs, infl) { for (var i = 0; i < ts.length; i++) prop.setValueAtTime(ts[i], vs[i]); if (infl) easeAt(prop, ts, infl); }
function keys(prop, ts, vs, infl) { return keysAt(prop, ts, vs, infl); }
function hold(prop, times) { for (var k = 1; k <= prop.numKeys; k++) { var kt = prop.keyTime(k), hit = !times; if (times) for (var i = 0; i < times.length; i++) if (Math.abs(kt - times[i]) < 0.001) hit = true; if (hit) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } }
function fx(L, match) { return L.property("ADBE Effect Parade").addProperty(match); }
function fxByName(L, name) { return L.property("ADBE Effect Parade").property(name); }
function deep(group, name) { // find a property by display name anywhere inside a group (Keylight nests Clip Black under Screen Matte)
  for (var i = 1; i <= group.numProperties; i++) { var p = group.property(i); if (p.name == name) return p; if (p.numProperties) { var r = deep(p, name); if (r) return r; } } return null; }
function setByName(group, name, v) { var p = deep(group, name); if (!p) throw new Error("no prop " + name + " in " + group.name); p.setValue(v); return p; }
function under(L, ref) { L.moveAfter(ref); return L; } // place L directly below ref in the stack
function parentLocal(child, parent, t, pos, sc) { c.time = t; child.parent = parent; if (pos) child.position.setValue(pos); if (sc) child.scale.setValue(sc); }
function mark(L, t, text) { // one layer cannot hold two markers at the same time (a second setValueAtTime replaces the first), so same-time marks merge
  // as "a|b" tokens, ordered mode: first, then move:, then anything else (stable within each group)
  var m = L.property("ADBE Marker"), toks = [text];
  for (var k = 1; k <= m.numKeys; k++) if (Math.abs(m.keyTime(k) - t) < 0.001) { toks = m.keyValue(k).comment.split("|"); for (var q = 0; q < toks.length; q++) if (toks[q] == text) return; toks.push(text); break; }
  var groups = [[], [], []];
  for (var i = 0; i < toks.length; i++) groups[toks[i].indexOf("mode:") == 0 ? 0 : (toks[i].indexOf("move:") == 0 ? 1 : 2)].push(toks[i]);
  m.setValueAtTime(t, new MarkerValue(groups[0].concat(groups[1], groups[2]).join("|"))); }
function textLayer(name, str, font, size, color, pos, just, ref, tracking) {
  var L = c.layers.addText(str); L.name = name; if (ref) L.moveAfter(ref);
  var sp = L.property("Source Text"); var td = sp.value;
  td.font = font; td.fontSize = size; td.applyFill = true; td.fillColor = color; td.applyStroke = false;
  td.justification = just || ParagraphJustification.CENTER_JUSTIFY; if (tracking !== undefined) td.tracking = tracking;
  sp.setValue(td);
  var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]);
  L.position.setValue(pos); return L;
}
function setText(L, str) { var sp = L.property("Source Text"); var td = sp.value; td.text = str; sp.setValue(td); }
function roundRect(name, w, h, r, color, pos, ref, strokeColor, strokeW) {
  var L = c.layers.addShape(); L.name = name; if (ref) L.moveAfter(ref);
  var g = L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); var v = g.property("ADBE Vectors Group");
  var rc = v.addProperty("ADBE Vector Shape - Rect"); rc.property("ADBE Vector Rect Size").setValue([w, h]); rc.property("ADBE Vector Rect Roundness").setValue(r);
  if (strokeW) { var st = v.addProperty("ADBE Vector Graphic - Stroke"); st.property("ADBE Vector Stroke Color").setValue(strokeColor); st.property("ADBE Vector Stroke Width").setValue(strokeW); }
  var fl = v.addProperty("ADBE Vector Graphic - Fill"); fl.property("ADBE Vector Fill Color").setValue(color);
  L.position.setValue(pos); return L;
}
function shadow(L, dist, dir, soft, opac255) { // AE Drop Shadow: direction 225 casts down-left (the house light comes from the right)
  var s = fx(L, "ADBE Drop Shadow"); s.property("Shadow Color").setValue([0, 0, 0, 1]); s.property("Opacity").setValue(opac255); s.property("Direction").setValue(dir); s.property("Distance").setValue(dist); s.property("Softness").setValue(soft); return s; }
function blur(L, amount) { var g = fx(L, "ADBE Gaussian Blur 2"); g.property("ADBE Gaussian Blur 2-0001").setValue(amount); g.property("ADBE Gaussian Blur 2-0002").setValue(1); return g.property("ADBE Gaussian Blur 2-0001"); }
function fitInto(L, w, h) { var r = L.sourceRectAtTime(0, false); var s = Math.min(w / r.width, h / r.height) * 100; L.scale.setValue([s, s]); return s; }

// ---------- modes ----------
// Camera moves are keys on CAMERA (scale, rotation, and position for SPLIT). Mode visuals are M_ layers with in/out spans
// (and M_ zoom blur effects on FX), so a rebuild clears them with resetModes(). Every mode writes a mode: marker on CAMERA.
// Every mode entry is a hard cut: jump() holds the value up to the frame before, so nothing ramps across a hold, and every
// entry zeroes the camera roll the same way (a punch's roll never carries into the next mode).
function modeMark(t, name) { mark(camera(), t, "mode:" + name); }
function jump(prop, t, v) { // hard cut: hold the current value up to the frame before t, then v at t (no ramp from an earlier key)
  // the key at t is made before the held key, so it does not inherit HOLD from it
  var prev = prop.valueAtTime(t - F(1), false); prop.setValueAtTime(t, v); prop.setValueAtTime(t - F(1), prev); hold(prop, [t - F(1)]); return prop; }
function camScale(ts, vs, infl) { keysAt(camera().scale, ts, vs, infl); }
function resetModes() { // clear every mode's camera keys, CAMERA markers, M_ layers and M_ effects, back to ROOM WIDE at rest
  var cam = camera(); clearKeys(cam.scale).setValue([100, 100]); clearKeys(cam.rotation).setValue(0); clearKeys(cam.position).setValue(H.head);
  clearKeys(cam.property("ADBE Marker")); removePrefix("M_");
}
function holdOut(prop, t) { // HOLD out of the key at t only, so the move into it still animates
  var k = prop.nearestKeyIndex(t); prop.setInterpolationTypeAtKey(k, prop.keyInInterpolationType(k), KeyframeInterpolationType.HOLD); }
function unroll(t) { jump(camera().rotation, t, 0); hold(camera().rotation, [t]); } // roll back to level as a hard cut, held
function easeOut(prop, t0, t1, v1) { // one eased move from the key at t0 to v1 at t1: a true ease-out (fastest at t0, settles at t1), about 80% done at the
  // midpoint. Normalised curve: out handle (0.2, 0.75), in handle (0.7, 1). Speeds are per dimension in value units per second.
  var v0 = prop.valueAtTime(t0, false); prop.setValueAtTime(t1, v1);
  var k0 = prop.nearestKeyIndex(t0), k1 = prop.nearestKeyIndex(t1), D = t1 - t0, n = dims(prop), eo = [], ei = [], e0 = [], e1 = [];
  for (var d = 0; d < n; d++) {
    var a = (typeof v0 == "number") ? v0 : v0[d], b = (typeof v1 == "number") ? v1 : (d < v1.length ? v1[d] : a);   // AE value arrays fail instanceof Array
    eo.push(new KeyframeEase((b - a) / D * 0.75 / 0.2, 20)); e0.push(new KeyframeEase(0, 33)); ei.push(new KeyframeEase(0, 30)); e1.push(new KeyframeEase(0, 33));
  }
  // both keys go BEZIER before any ease is set: a key made after a HOLD key is born HOLD, and a HOLD in-type on k1 zeroes k0's out speed
  prop.setInterpolationTypeAtKey(k0, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  prop.setInterpolationTypeAtKey(k1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
  prop.setTemporalEaseAtKey(k0, e0, eo); prop.setTemporalEaseAtKey(k1, ei, e1);
  return prop;
}
function roomWide(t) { jump(camera().scale, t, [100, 100]); hold(camera().scale, [t]); unroll(t); modeMark(t, "ROOM WIDE"); }
function roomPush(t0, t1, from, to) { // hard cut in at `from`, ease-out push: about 80% of the move by t0 + 1 s, settled by t0 + 2 s (or t1 if sooner)
  from = from || 100; to = to || 130; var s = camera().scale;
  jump(s, t0, [from, from]); easeOut(s, t0, Math.min(t1, t0 + 2.0), [to, to]); unroll(t0);
  modeMark(t0, "ROOM PUSH"); mark(camera(), t0, "move:push");
}
function zoomBlur(t0, frames, amount) { // radial zoom blur on the FX adjustment layer for a few frames
  var L = c.layer("FX"); var rb = fx(L, "ADBE Radial Blur"); rb.name = "M_zoomblur_" + Math.round(t0 * 100);
  setByName(rb, "Type", 2); setByName(rb, "Center", H.head);
  var a = deep(rb, "Amount"); a.setValueAtTime(t0 - F(1), 0); a.setValueAtTime(t0, amount); a.setValueAtTime(t0 + F(frames), 0); hold(a, [t0 - F(1)]);
}
function roomTight(t) { // jump cut into a shot already mid-zoom: 1.75, then one ease-out creep to 1.86 by t + 0.5 s (most of it in the first 8 frames)
  var s = camera().scale; jump(s, t, [175, 175]); easeOut(s, t, t + 0.5, [186, 186]); unroll(t);
  zoomBlur(t, 6, 40); modeMark(t, "ROOM TIGHT"); mark(camera(), t, "move:tight");
}
function punchIn(t) { // frame 1 +3% with 2 frames of radial blur, then ease to 130 over 0.7 s with 1.5 deg roll
  var s = camera().scale; jump(s, t, [103, 103]); keysAt(s, [t + 0.7], [[130, 130]], 80); easeAt(s, [t], 80);
  var r = camera().rotation; jump(r, t, 0); keysAt(r, [t + 0.7], [1.5], 80); easeAt(r, [t], 80);
  zoomBlur(t, 2, 30); modeMark(t, "ROOM PUSH"); mark(camera(), t, "move:punch");
}
function whipOut(t0) { // from wherever the camera is at t0 (1.86 after a tight) to 1.00 in 10 frames, lands on the reveal word; ROOM, MAT, WALL_ANCHOR
  // and JOE carry motion blur from the rig (a null does not blur)
  var s = camera().scale, r = camera().rotation, t1 = t0 + F(10);
  jump(s, t0, s.valueAtTime(t0, false)); keysAt(s, [t1], [[100, 100]], 85); easeAt(s, [t0], 85); holdOut(s, t1);
  jump(r, t0, r.valueAtTime(t0, false)); keysAt(r, [t1], [0], 85); easeAt(r, [t0], 85); holdOut(r, t1);   // any roll levels out with the whip
  mark(camera(), t1, "move:whip"); modeMark(t1, "ROOM WIDE");
}
function zoomOut(t0, t1) { // from wherever the camera is at t0 (1.30 after a push) back to 1.00 at t1; any roll levels out with the move
  var s = camera().scale, r = camera().rotation;
  jump(s, t0, s.valueAtTime(t0, false)); keysAt(s, [t1], [[100, 100]], 75); easeAt(s, [t0], 75); holdOut(s, t1);
  jump(r, t0, r.valueAtTime(t0, false)); keysAt(r, [t1], [0], 75); easeAt(r, [t0], 75); holdOut(r, t1);
  mark(camera(), t1, "move:zoomout"); modeMark(t1, "ROOM WIDE");
}
// FACE CARD, the mat world (head-pop, Joe 2026-10-05: "go back to the 'head popping' out style that we were running on the remotion/hyperframes
// stack"; geometry from the 2026-07-26 canvas canon). The card is 952x676 at the bottom of the frame with the room plate inside it; Joe sits in it
// at 88% and his head breaks the card's top edge by MATCARD.pop px (his matte is the card plus the column above it, so shoulders and chair stay
// clipped by the card; the column stops MATCARD.rise px above the card, because the top of the take, above the green screen, keys to a faint grey band
// that shows on the light mat). The mat above the card (y 220 to MATCARD.stageBottom) is the stage for the headline and the star. Captions: BIG at MATCARD.capY.
var MATCARD = { w: 952, h: 676, c: [540, 1546], r: 28, k: 0.88, pop: 100, rise: 300, top: 1208, stageBottom: 1090, capY: 1735, capScale: 78 };
function faceCard(t0, t1) { // mat, card, a matted copy of the room and of Joe, stacked over the room and full-frame Joe for the span
  // (a track matte on JOE itself would blank Joe outside the matte layer's span, so the card carries its own copies; ROOM and JOE get no keys)
  var M = MATCARD, tag = Math.round(t0 * 100), j = c.layer("JOE"), room = c.layer("ROOM"), headTop = M.top - M.pop;
  jump(camera().scale, t0, [100, 100]); hold(camera().scale, [t0]); unroll(t0);
  var m = c.layer("MAT").duplicate(); m.name = "M_MAT_" + tag; m.enabled = true; m.moveBefore(j); span(m, t0, t1);
  var card = roundRect("M_FACECARD_" + tag, M.w, M.h, M.r, NEAR_BLACK, M.c, null); card.moveBefore(m); span(card, t0, t1); shadow(card, 26, 180, 70, 72);
  // a copy keeps the layer's own scale (a reel's setup.jsx may have scaled and lifted JOE to put his head top on H.headTop) times k, and lands
  // the point that sits at H.headTop in the room on headTop in the card
  function place(L, P, S) { c.time = t0; L.parent = null; L.position.expression = ""; clearKeys(L.scale).setValue([S[0] * M.k, S[1] * M.k]);
    clearKeys(L.position).setValue([540 + (P[0] - 540) * M.k, headTop + (P[1] - H.headTop) * M.k]); clearKeys(L.rotation).setValue(0); span(L, t0, t1); }
  var rc = room.duplicate(); rc.name = "M_ROOMCARD_" + tag; rc.moveBefore(card); place(rc, [540, 960], room.scale.value);
  var rm = roundRect("M_ROOMMATTE_" + tag, M.w, M.h, M.r, WHITE, M.c, null); rm.moveBefore(rc); span(rm, t0, t1);
  try { rc.setTrackMatte(rm, TrackMatteType.ALPHA); } catch (e) { rc.trackMatteType = TrackMatteType.ALPHA; }
  var jc = j.duplicate(); jc.name = "M_JOECARD_" + tag; jc.moveBefore(rm); jc.audioEnabled = false; place(jc, j.position.value, j.scale.value);
  var mask = roundRect("M_FACEMATTE_" + tag, M.w, M.h + M.rise, M.r, WHITE, [M.c[0], M.c[1] - M.rise / 2], null); mask.moveBefore(jc); span(mask, t0, t1);
  try { jc.setTrackMatte(mask, TrackMatteType.ALPHA); } catch (e2) { jc.trackMatteType = TrackMatteType.ALPHA; }
  modeMark(t0, "FACE CARD"); return card;
}
function split(t0, t1) { // top 845 px panel with heavy grain; Joe at 1.4x with CAMERA dropped to y 1180: on the rig take (2026-09-26 sheet) the hair
  // top measured y 918 to 955 (74 to 111 px under the seam) and the face centre about y 1530
  var p = c.layer("SPLIT").duplicate(); p.name = "M_SPLIT_" + Math.round(t0 * 100); p.enabled = true; span(p, t0, t1);
  var mk = p.property("ADBE Mask Parade").addProperty("ADBE Mask Atom"); var sh = new Shape();   // the plate is full frame with black below the seam: keep the panel only
  sh.vertices = [[0, 0], [1080, 0], [1080, 845], [0, 845]]; sh.closed = true; mk.property("ADBE Mask Shape").setValue(sh);
  var g = fx(p, "ADBE Noise HLS2"); setByName(g, "Noise", 3); setByName(g, "Lightness", 22); setByName(g, "Grain Size", 1.6);   // Noise is the type popup (3 = Grain); Lightness is the amount
  deep(g, "Noise Phase").expression = "time * 720";                                                                                 // animate the grain
  var s = camera().scale; jump(s, t0, [140, 140]); hold(s, [t0]); jump(s, t1, [100, 100]); hold(s, [t1]);
  var cp = camera().position; jump(cp, t0, [540, 1180]); hold(cp, [t0]); jump(cp, t1, H.head); hold(cp, [t1]);
  unroll(t0); modeMark(t0, "SPLIT"); return p;
}
function cornerFace(t0, t1) { // full insert plate with small Joe bottom right
  unroll(t0);
  var i = c.layer("INSERT").duplicate(); i.name = "M_INSERT_" + Math.round(t0 * 100); i.enabled = true; span(i, t0, t1);
  var j = c.layer("JOE_CORNER").duplicate(); j.name = "M_CORNER_" + Math.round(t0 * 100); j.enabled = true; j.audioEnabled = false; span(j, t0, t1);
  var m = roundRect("M_CORNERMATTE_" + Math.round(t0 * 100), 320, 320, 24, WHITE, [860, 1620], null); m.moveBefore(j); span(m, t0, t1);
  try { j.setTrackMatte(m, TrackMatteType.ALPHA); } catch (e) { j.trackMatteType = TrackMatteType.ALPHA; }
  var bg = roundRect("M_CORNERBG_" + Math.round(t0 * 100), 332, 332, 28, NEAR_BLACK, [860, 1620], null); bg.moveAfter(j); shadow(bg, 16, 225, 30, 120); span(bg, t0, t1);
  modeMark(t0, "CORNER FACE"); return i;
}
function fullInsert(t0, t1) { unroll(t0); var i = c.layer("INSERT").duplicate(); i.name = "M_INSERT_" + Math.round(t0 * 100); i.enabled = true; span(i, t0, t1); modeMark(t0, "FULL INSERT"); return i; }
function sessionInsert(t0, t1, tileSrc, clipStart) { // SESSION mode (session reels, 2026-10-01): the INSERT halftone plate, the speaker's Zoom tile as a call card in
  // CORNER FACE's corner (400 x 225, radius 18, 6 px white border, muted, plays from t0); the hero is a screenCard in the same row that the beat script
  // places at [540, 760], width at most 1000, at the capture's own aspect. PHRASE captions at y 1380 (captions.py)
  unroll(t0); var tag = Math.round(t0 * 100);
  var i = c.layer("INSERT").duplicate(); i.name = "M_INSERT_" + tag; i.enabled = true; span(i, t0, t1);
  var bg = roundRect("M_SESSBG_" + tag, 412, 237, 24, WHITE, [820, 1620], null); bg.moveBefore(i); shadow(bg, 16, 225, 30, 120); span(bg, t0, t1);
  var v = c.layers.add(footage(tileSrc)); v.name = "M_SESSTILE_" + tag; v.audioEnabled = false; v.moveBefore(bg); v.startTime = (clipStart === undefined ? t0 : clipStart); span(v, t0, t1);   // clipStart: the comp time of the clip's frame 0, when one clip runs across rows
  var r = v.sourceRectAtTime(t0, false); var s = Math.max(400 / r.width, 225 / r.height) * 100;
  v.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]); v.scale.setValue([s, s]); v.position.setValue([820, 1620]);
  var m = roundRect("M_SESSMATTE_" + tag, 400, 225, 18, WHITE, [820, 1620], null); m.moveBefore(v); span(m, t0, t1);
  try { v.setTrackMatte(m, TrackMatteType.ALPHA); } catch (e) { v.trackMatteType = TrackMatteType.ALPHA; }
  modeMark(t0, "SESSION"); return i;
}
function callFace(t0, t1, tileSrc, zoom, clipStart) { // CALL mode (session reels where the call is the reel, Joe 2026-10-01): the room, the speaker's Zoom tile as a big
  // card (760 x 428, radius 22, 8 px white border, shadow down-left; shrunk from 1000 wide so the soft Zoom pixels read sharper, Joe 2026-10-01) on the
  // halftone INSERT plate (Joe 2026-10-01: "the room is for the talking head reels"), centre [540, 960], parented to CAMERA so pushes carry the card (the plate stays still); BIG
  // captions above it at y 460 (captions.py). zoom (default 1; 1.22 is the house punch) scales the picture about the face inside the card, so two CALL
  // shots in a row read as a cut. The tile clip's frame 0 plays at clipStart (default t0; pass it when one clip runs across several rows). startTime
  // is set before the span (setting it after shifts the in point). The camera comes back to rest on the cut (a punch can follow in the same row)
  jump(camera().scale, t0, [100, 100]); hold(camera().scale, [t0]); unroll(t0); var tag = Math.round(t0 * 100), z = zoom || 1, W = 760, HH = 428;
  var pl = c.layer("INSERT").duplicate(); pl.name = "M_INSERT_" + tag; pl.enabled = true; span(pl, t0, t1);   // the session set: halftone, not the room
  var n = c.layers.addNull(); n.name = "M_CALL_" + tag; n.anchorPoint.setValue([0, 0]); n.moveBefore(pl); parentLocal(n, camera(), 0, [540, 960]); span(n, t0, t1);
  var bg = roundRect("M_CALLBG_" + tag, W + 16, HH + 16, 30, WHITE, [0, 0], null); bg.moveBefore(pl); shadow(bg, 14, 225, 26, 130);
  var v = c.layers.add(footage(tileSrc)); v.name = "M_CALLTILE_" + tag; v.audioEnabled = false; v.moveBefore(bg); v.startTime = (clipStart === undefined ? t0 : clipStart);
  var need = t1 - v.startTime; if (v.source.duration < need && need - v.source.duration < 0.25) v.stretch = need / v.source.duration * 100;   // an upscaled clip can come back a frame short (25 -> 30 fps)
  var r = v.sourceRectAtTime(t0, false), s = Math.max(W / r.width, HH / r.height) * 100 * z;
  v.anchorPoint.setValue([r.left + r.width * (z > 1 ? 0.58 : 0.5), r.top + r.height * 0.5]); v.scale.setValue([s, s]);   // both tiles frame the face right of centre
  var m = roundRect("M_CALLMATTE_" + tag, W, HH, 22, WHITE, [0, 0], null); m.moveBefore(v);
  try { v.setTrackMatte(m, TrackMatteType.ALPHA); } catch (e) { v.trackMatteType = TrackMatteType.ALPHA; }
  bg.parent = n; v.parent = n; m.parent = n; bg.position.setValue([0, 0]); v.position.setValue([0, 0]); m.position.setValue([0, 0]);
  span(bg, t0, t1); span(v, t0, t1); span(m, t0, t1);
  modeMark(t0, "CALL"); return n;
}

// ---------- captions ----------
// BIG one-word-per-cut captions and PHRASE sentence-case lines, both driven by captions.py's plan()/to_jsx() output
// (a CAPS data literal of [word,t0,t1,y] / [text,t0,t1] tuples). y per mode: ROOM WIDE 460, ROOM PUSH 400, ROOM TIGHT 330
// (Joe's head top measures y 549 in ROOM WIDE and the zoom anchor is his face; controller ruling 2026-09-26).
function bigWord(word, t0, t1, y) {
  // fontSize 123 measured to a 90px cap height on the sheet (2026-09-26): Inter-ExtraBold's cap height is ~0.733 of its em, so
  // a literal fontSize:90 undershoots to ~66px; 123 closes the gap to within 10%.
  var L = textLayer("C_BIG_" + Math.round(t0 * 1000), word.toUpperCase(), "Inter-ExtraBold", 123, WHITE, [540, y || 460], ParagraphJustification.CENTER_JUSTIFY, c.layer("CAPTIONS_ANCHOR"), -10);
  shadow(L, 4, 225, 6, 30); span(L, t0, t1);
  if (y == MATCARD.capY) L.scale.setValue([MATCARD.capScale, MATCARD.capScale]);   // FACE CARD: one word over his chest in the card, the old canvas size
  return L;
}
function bigWordEmphasis(word, t0, t1, y, red) { var L = bigWord(word, t0, t1, y); L.scale.setValue([133, 133]); if (red) { var sp = L.property("Source Text"); var td = sp.value; td.fillColor = RED; sp.setValue(td); } return L; }
function phrase(text, t0, t1, words, y) { // y: 1536, or 800 in SPLIT (from captions.py)
  // Karaoke landing (Joe 2026-09-26, "the color landing as I said each word ... worked great"): the v5 caption look.
  // Inter-ExtraBold 66, white with a 7 px near-black outline under the fill; each word has a yellow copy that is lit
  // from its start to its end and pops 100 > 114 > 100 over 0.16 s. A chunk wider than 940 px shrinks to fit.
  // words = [[word, start, end], ...] from captions.py; without them the chunk shows white, whole, with no highlight.
  var id = "C_PH_" + Math.round(t0 * 1000), Y = y || 1536, SIZE = 66, GAP = 22, MAXW = 940;
  if (!words || !words.length) { var parts = text.split(" "); words = []; for (var q = 0; q < parts.length; q++) words.push([parts[q], t0, t0]); }
  function mk(name, str, col, a, b) { var L = textLayer(name, str, "Inter-ExtraBold", SIZE, col, [540, Y], ParagraphJustification.CENTER_JUSTIFY, c.layer("CAPTIONS_ANCHOR"), -10);
    var sp = L.property("Source Text"); var td = sp.value; td.applyStroke = true; td.strokeColor = CAP_INK; td.strokeWidth = 7; td.strokeOverFill = false; sp.setValue(td);
    var r = L.sourceRectAtTime(a, false); L.anchorPoint.setValue([r.left + r.width / 2, -0.733 * SIZE / 2]);   // baseline-true: every word pivots on the middle of the cap height above its baseline, so "you" and "This" share a baseline
    shadow(L, 3, 225, 8, 60); span(L, a, b); return L; }
  var base = [], total = 0, timed = false; for (var q = 0; q < words.length; q++) if (words[q][2] > words[q][1]) timed = true;
  for (var k = 0; k < words.length; k++) { var L = mk(id + "_" + k, words[k][0], WHITE, t0, t1); var w = L.sourceRectAtTime(t0, false).width; base.push({ l: L, w: w }); total += w + (k ? GAP : 0); }
  var sc = total > MAXW ? MAXW / total : 1; var x = 540 - total * sc / 2;
  for (var k = 0; k < base.length; k++) { var b = base[k], cx = x + b.w * sc / 2; b.l.position.setValue([cx, Y]); b.l.scale.setValue([100 * sc, 100 * sc]);
    var ws = words[k][1], we = k + 1 < words.length ? words[k][2] : Math.max(words[k][2], ws + 0.12);   // only the last word gets the 0.12 s floor, so two words never light at once
    if (timed && (words[k][2] > words[k][1] || k == words.length - 1)) { var hi = mk(id + "_" + k + "_hi", words[k][0], CAP_YELLOW, ws, Math.min(we, t1)); hi.position.setValue([cx, Y]);
      keysAt(hi.scale, [ws, ws + 0.07, ws + 0.16], [[100 * sc, 100 * sc], [114 * sc, 114 * sc], [100 * sc, 100 * sc]], 33); }
    x += (b.w + GAP) * sc; }
  return base[0].l;
}
function captionsFromData(D) { removePrefix("C_"); for (var i = 0; i < D.big.length; i++) bigWord(D.big[i][0], D.big[i][1], D.big[i][2], D.big[i][3]); for (var j = 0; j < D.phrase.length; j++) phrase(D.phrase[j][0], D.phrase[j][1], D.phrase[j][2], D.phrase[j][3], D.phrase[j][4]); out.push("captions " + D.big.length + " big, " + D.phrase.length + " phrase"); }

// ---------- hero stack and the character build-in (Joe 2026-09-30: "that looks amazing. fold that into the house") ----------
// From the neoeditfx teardown (reference/teardowns/2026-09-30-neoeditfx-kinetic-caption-pack-ad.md), prototyped on the ai-delete takes
// (production/after-effects/2026-09-30-phrase-stack-proto/). A key line lifted out of the captions into the wall zone: white Inter-ExtraBold
// context lines and one hero line in Playfair Display Black Italic, house orange-red with a soft glow, the lines overlapping (white over
// the hero). Each line builds in character by character (fade up out of a blur, small rise; the hero slides in from the right) 3 frames
// before its word; the stack dissolves out left to right. Captions are OFF for its span (captions.py): it is the captions or the stack.
var HS = { small: 82, hero: 180, y: 365, maxW: 960, overlap: 14, gap: 4, ramp: 40, lead: 3, glow: 55, heroFont: null };
function heroFont() { // a variable-font instance: resolve its PostScript name through app.fonts (~/Library/Fonts/PlayfairDisplay-Italic-VF.ttf)
  if (HS.heroFont) return HS.heroFont;
  var f = app.fonts.getFontsByFamilyNameAndStyleName("Playfair Display", "Black Italic");
  if (!f || !f.length) throw new Error("Playfair Display Black Italic is not installed (Google Fonts, PlayfairDisplay-Italic-VF.ttf)");
  return (HS.heroFont = f[0].postScriptName);
}
function charAnim(L, name, p, shape, t0, t1) { // one Text Animator over characters (spaces skipped): shape 2 (ramp up) sweeps IN, 3 (ramp down) sweeps OUT, left to right
  var an = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.name = name;
  var ap = an.property("ADBE Text Animator Properties");
  if (p.opacity !== undefined) ap.addProperty("ADBE Text Opacity").setValue(p.opacity);
  if (p.blur) ap.addProperty("ADBE Text Blur").setValue(p.blur);
  if (p.pos) ap.addProperty("ADBE Text Position 3D").setValue(p.pos);
  var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector"), adv = sel.property("ADBE Text Range Advanced");
  adv.property("ADBE Text Range Units").setValue(1); adv.property("ADBE Text Range Type2").setValue(2); adv.property("ADBE Text Range Shape").setValue(shape);
  adv.property("ADBE Text Levels Max Ease").setValue(50); adv.property("ADBE Text Levels Min Ease").setValue(50);
  sel.property("ADBE Text Percent Start").setValue(0); sel.property("ADBE Text Percent End").setValue(HS.ramp);
  keysAt(sel.property("ADBE Text Percent Offset"), [t0, t1], [-HS.ramp, 100], 60);
  return an;
}
function buildIn(L, t, frames, size) { // the character build-in on any text layer; size = its font size (blur and rise scale with it). The hook card's
  // entry: its key word pre-rolls (t = -F(5), so frame 1 already reads its first letters), the other lines follow 2 to 8 frames later
  var k = size / 70; charAnim(L, "IN", { opacity: 0, blur: [16 * k, 16 * k], pos: [0, 28 * Math.sqrt(k), 0] }, 2, t, t + F(frames)); return L;
}
function heroStack(t0, t1, lines, cut, y) {
  // lines: [[text, tWord, isHero], ...] top to bottom, at most one hero; tWord = the line's first spoken word. cut (true when a mode change
  // follows): the dissolve finishes on t1 instead of running 2 frames past it. y: the stack's centre (365: ROOM WIDE and ROOM PUSH; not
  // for ROOM TIGHT, where the head top sits near y 400). Screen-locked, directly below CAPTIONS_ANCHOR.
  var id = "D_HERO_" + Math.round(t0 * 100), Ls = [], rs = [], total = 0, heroWord = "", tHero = t0, Y = y || HS.y;
  for (var i = 0; i < lines.length; i++) {
    var hero = !!lines[i][2]; if (hero) heroWord = lines[i][0];
    var L = textLayer(id + "_" + i + (hero ? "_hero" : ""), lines[i][0], hero ? heroFont() : "Inter-ExtraBold", hero ? HS.hero : HS.small, hero ? ORANGE : WHITE, [540, Y], ParagraphJustification.CENTER_JUSTIFY, c.layer("CAPTIONS_ANCHOR"), hero ? 0 : -10);
    var r = L.sourceRectAtTime(t0, false), s = r.width > HS.maxW ? HS.maxW / r.width : 1; L.scale.setValue([100 * s, 100 * s]);
    Ls.push(L); rs.push({ h: r.height * s, hero: hero });
  }
  function gap(a, b) { return (rs[a].hero || rs[b].hero) ? -HS.overlap : HS.gap; }
  for (var i = 0; i < Ls.length; i++) total += rs[i].h + (i ? gap(i - 1, i) : 0);
  var yy = Y - total / 2, o0 = cut ? t1 - F(6) : t1 - F(4), o1 = cut ? t1 : t1 + F(2);
  for (var i = 0; i < Ls.length; i++) {
    if (i) yy += gap(i - 1, i);
    var L = Ls[i], hero = rs[i].hero, tIn = Math.max(t0, lines[i][1]) - F(HS.lead), n = lines[i][0].replace(/ /g, "").length;
    L.position.setValue([540, yy + rs[i].h / 2]); yy += rs[i].h; if (hero) tHero = lines[i][1];
    charAnim(L, "IN", hero ? { opacity: 0, blur: [22, 22], pos: [40, 12, 0] } : { opacity: 0, blur: [16, 16], pos: [0, 28, 0] }, 2, tIn, tIn + (hero ? F(9) : Math.min(F(12), Math.max(F(5), F(1.2 * n)))));
    charAnim(L, "OUT", { opacity: 0, blur: [16, 16], pos: [0, -14, 0] }, 3, o0, o1);
    shadow(L, 3, 225, 10, hero ? 70 : 110); span(L, Math.max(0, tIn), cut ? t1 : t1 + F(3));
    if (hero) { var g = L.duplicate(); g.name = L.name + "_glow"; g.moveAfter(L); blur(g, 22); g.opacity.setValue(HS.glow); }
  }
  var low = null; for (var i = 0; i < Ls.length; i++) if (!rs[i].hero && (!low || Ls[i].index > low.index)) low = Ls[i];   // white lines over the hero
  for (var i = 0; i < Ls.length; i++) if (rs[i].hero && low && Ls[i].index < low.index) { var g = c.layer(Ls[i].name + "_glow"); Ls[i].moveAfter(low); g.moveAfter(Ls[i]); }
  mark(Ls[0], tHero, "device:heroStack|word:" + heroWord);   // on the hero's word, so check.py times it against the brief's @word
  return Ls;
}

// ---------- devices, part 1 (wall and head zone) ----------
// Wall devices hang behind JOE (directly below WALL_ANCHOR) and ride CAMERA, so every push scales them about the face.
// Screen-locked devices sit directly below BOARD. Every device writes a device:<name>|word:<word> marker at its time.
// BC sits at y 500 (the brief had 455): with Joe's head top at y 549 a 455 card ends above the hair, and the house wants his head over
// the bottom-centre card; 500 mirrors TC (30 above the side row there, 30 below it here)
var SLOTS = { TL: [205, 320], TC: [540, 290], TR: [875, 320], BL: [205, 470], BC: [540, 500], BR: [875, 470] };
function wallLayer(L) { L.moveAfter(c.layer("WALL_ANCHOR")); return L; }   // directly below WALL_ANCHOR: behind JOE, above ROOM
function toCamera(L, pos, sc) { parentLocal(L, camera(), 0, pos, sc); }   // parent at t=0 (camera identity) and set local values
function whiteFlashIn(L, t) { // white at t, back to normal three frames later. Exposure works in linear light, so +4 stops alone only lifts a dark
  // screenshot from about 23 to 58 of 255 (measured 2026-09-26); the master Offset (+1 linear) carries the flash to white.
  // The master controls display as "Exposure" and "Offset" (there is no "Master Exposure"), so they are found by match name.
  var e = fx(L, "ADBE Exposure2"); var m = e.property("ADBE Exposure2-0003"), o = e.property("ADBE Exposure2-0004");
  m.setValueAtTime(t, 4); m.setValueAtTime(t + F(3), 0); o.setValueAtTime(t, 1); o.setValueAtTime(t + F(3), 0); return e; }
function wallCard(src, slot, t, word, t1, w) {
  w = w || 238; var pos = SLOTS[slot] || slot;
  // never glue an array into a string: in this AE engine "x" + [540, 290] throws "invalid numeric result (divide by zero?)"
  var id = "D_CARD_" + (typeof slot == "string" ? slot : "P" + Math.round(pos[0]) + "x" + Math.round(pos[1])) + "_" + Math.round(t * 100);
  var n = c.layers.addNull(); n.name = id; n.anchorPoint.setValue([0, 0]); wallLayer(n); toCamera(n, pos, [100, 100]);
  var img = c.layers.add(footage(src)); img.name = id + "_img"; wallLayer(img);
  var r = img.sourceRectAtTime(0, false); var s = (w - 24) / r.width * 100; var h = r.height * s / 100 + 24;
  var bg = roundRect(id + "_bg", w, h, 16, WHITE, [0, 0], null, [0.85, 0.85, 0.85], 1); wallLayer(bg); shadow(bg, 22, 225, 24, 140);   // 140/255: the room wall is dark
  img.moveBefore(bg); var m = roundRect(id + "_matte", w - 24, h - 24, 10, WHITE, [0, 0], null); m.moveBefore(img);
  try { img.setTrackMatte(m, TrackMatteType.ALPHA); } catch (e) { img.trackMatteType = TrackMatteType.ALPHA; }
  bg.parent = n; img.parent = n; m.parent = n; bg.position.setValue([0, 0]); m.position.setValue([0, 0]); img.position.setValue([0, 0]); img.scale.setValue([s, s]);
  span(n, t, t1); span(bg, t, t1); span(img, t, t1); span(m, t, t1);
  whiteFlashIn(bg, t); whiteFlashIn(img, t);
  mark(n, t, "device:wallCard|word:" + (word || "")); return n;
}
function wallCards(srcs, slots, t, word, t1) { var arr = []; for (var i = 0; i < srcs.length; i++) arr.push(wallCard(srcs[i], slots[i], t + F(2 * i), word, t1)); return arr; }
function flyOut(cards, t) { // radial from the head, ease-in, 10 frames, motion blur, 2-frame stagger
  for (var i = 0; i < cards.length; i++) { var n = cards[i]; var p = n.position.value; var v = [p[0] - H.head[0], p[1] - H.head[1]]; var len = Math.sqrt(v[0] * v[0] + v[1] * v[1]) || 1;
    var far = [p[0] + v[0] / len * 1400, p[1] + v[1] / len * 1400]; var t0 = t + F(2 * i); n.motionBlur = true;
    keysAt(n.position, [t0, t0 + F(10)], [p, far], 0); n.position.setTemporalEaseAtKey(1, [new KeyframeEase(0, 85)], [new KeyframeEase(0, 85)]);
    n.outPoint = t0 + F(11);
    for (var k = 1; k <= c.numLayers; k++) { var ch = c.layer(k); if (ch.parent && ch.parent.index == n.index) { ch.motionBlur = true; ch.outPoint = t0 + F(11); } } }   // compare by index: DOM wrappers are not ==
  mark(cards[0], t, "device:flyOut|word:");
}
function cardGrow(card, t, toW) { toW = toW || 410; var bg = c.layer(card.name + "_bg");
  var size = bg.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group").property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Size").value;
  var w = size[0], h = size[1], s = toW / w * 100;
  card.anchorPoint.setValue([0, h / 2]); var p = card.position.value; card.position.setValue([p[0], p[1] + h / 2]);   // anchor at bottom-centre so the bottom edge stays put
  keysAt(card.scale, [t, t + F(11)], [[100, 100], [s, s]], 75); mark(card, t, "device:cardGrow|word:"); }
function keywordRise(word, t, t1, tag, spokenWord) { // appears at y 730 behind the face (the head occludes it), rises to y 440, clear of the hair (top y 549)
  var L = textLayer("D_KEY_" + Math.round(t * 100), word.toUpperCase(), "Inter-ExtraBold", 130, BRICK, [540, 730], ParagraphJustification.CENTER_JUSTIFY, null, -20);
  wallLayer(L); toCamera(L, [540, 730], [100, 100]); span(L, t, t1); L.motionBlur = true;
  var r = L.sourceRectAtTime(0, false); if (r.width * 1 > 918) L.scale.setValue([918 / r.width * 100, 918 / r.width * 100]);
  keysAt(L.position, [t, t + F(2), t + F(11)], [[540, 730], [540, 730], [540, 440]], 80);
  var b = blur(L, 40); b.setValueAtTime(t, 40); b.setValueAtTime(t + F(6), 0);
  if (tag) { var T = textLayer("D_KEYTAG_" + Math.round(t * 100), tag, "Inter-ExtraBold", 70, WHITE, [800, 330], ParagraphJustification.CENTER_JUSTIFY, null, 0); wallLayer(T); toCamera(T, [800, 330], [100, 100]); span(T, t + F(13), t1); }   // tag sits about 20 px clear of the settled word's cap line (sheet 2026-09-26)
  mark(L, t, "device:keywordRise|word:" + (spokenWord || word.toLowerCase())); return L;
}
function edgeLabels(left, right, t, t1, word) {
  var A = textLayer("D_EDGE_L_" + Math.round(t * 100), left.toUpperCase(), "Inter-ExtraBold", 72, LIGHTGREY, [-200, 620], ParagraphJustification.CENTER_JUSTIFY, board(), 0); span(A, t, t1); A.motionBlur = true;
  var B = textLayer("D_EDGE_R_" + Math.round(t * 100), right.toUpperCase(), "Inter-ExtraBold", 72, LIGHTGREY, [1280, 620], ParagraphJustification.CENTER_JUSTIFY, board(), 0); span(B, t + F(5), t1); B.motionBlur = true;
  keysAt(A.position, [t, t + F(5), t + F(23)], [[-200, 620], [290, 620], [290, 500]], 70);
  keysAt(B.position, [t + F(5), t + F(10), t + F(28)], [[1280, 620], [790, 620], [790, 500]], 70);
  mark(A, t, "device:edgeLabels|word:" + (word || "")); return [A, B];
}
function iconPop(src, pos, w, t, t1, word, tile) { // tile (default on): a white rounded tile behind the icon, as the reference's app icons, so dark marks read on the dark wall
  if (tile === undefined) tile = true; var parts = [];
  if (tile) { var T = roundRect("D_ICONTILE_" + Math.round(t * 100), w, w, Math.round(w * 0.22), WHITE, pos, board()); span(T, t, t1); shadow(T, 14, 225, 20, 140); parts.push(T); }
  var L = c.layers.add(footage(src)); L.name = "D_ICON_" + Math.round(t * 100); L.moveAfter(board()); span(L, t, t1);
  fitInto(L, tile ? w * 0.62 : w, tile ? w * 0.62 : w); L.position.setValue(pos); if (!tile) shadow(L, 14, 225, 20, 140); parts.push(L);
  for (var i = 0; i < parts.length; i++) { var P = parts[i]; var s = P.scale.value[0];
    var b = blur(P, 24); b.setValueAtTime(t, 24); b.setValueAtTime(t + F(7), 0);
    keysAt(P.opacity, [t, t + F(7)], [0, 100], 70); keysAt(P.scale, [t, t + F(7)], [[s * 1.03, s * 1.03], [s, s]], 70); }
  mark(L, t, "device:iconPop|word:" + (word || "")); return L;
}
// ---------- devices, part 2 (UI and finishing) ----------
function kineticTitle(lead, word, iconSrc, t, t1, spokenWord, tWord) { // tWord (default t + 11 frames): when the big word and icon slide in, so the word can land on its spoken time while the lead rises earlier
  var tw = tWord || t + F(11);
  var Lw = textLayer("D_KIN_LEAD_" + Math.round(t * 100), lead, "Inter-SemiBold", 48, WHITE, [305, 440], ParagraphJustification.LEFT_JUSTIFY, board(), 0); span(Lw, t, t1);
  keysAt(Lw.position, [t, t + F(12)], [[305, 440], [305, 250]], 80); var lb = blur(Lw, 20); lb.setValueAtTime(t, 20); lb.setValueAtTime(t + F(10), 0);
  var W = textLayer("D_KIN_WORD_" + Math.round(t * 100), word.toUpperCase(), "Inter-ExtraBold", 220, ORANGE, [-400, 400], ParagraphJustification.LEFT_JUSTIFY, board(), -30);
  var sp = W.property("Source Text"); var td = sp.value; td.horizontalScale = 0.78; sp.setValue(td);   // condensed look without a condensed font installed (horizontalScale is a multiplier: 1 = 100%)
  var wr = W.sourceRectAtTime(0, false); W.anchorPoint.setValue([wr.left + wr.width / 2, wr.top + wr.height / 2]);   // re-centre after the squeeze
  span(W, tw, t1); W.motionBlur = true; shadow(W, 10, 180, 20, 115);
  keysAt(W.position, [tw, tw + F(15)], [[-400, 400], [425, 400]], 85);   // x 425 (was 462): the word ends before the icon tile
  // the lead sits flush with the word's left edge (centred at x 305 a long lead ran off the frame), shrunk to end by x 740, clear of the icon tile
  var wl = 425 - wr.width / 2, lr = Lw.sourceRectAtTime(0, false); Lw.anchorPoint.setValue([lr.left, lr.top + lr.height / 2]);
  if (lr.width > 740 - wl) Lw.scale.setValue([(740 - wl) / lr.width * 100, (740 - wl) / lr.width * 100]);
  clearKeys(Lw.position); keysAt(Lw.position, [t, t + F(12)], [[wl, 440], [wl, 250]], 80);
  if (iconSrc) { var IT = roundRect("D_KIN_TILE_" + Math.round(t * 100), 180, 180, 40, WHITE, [0, 0], board()); span(IT, tw, t1); shadow(IT, 12, 225, 18, 140);   // white tile so a dark mark reads on the dark wall
    var I = c.layers.add(footage(iconSrc)); I.name = "D_KIN_ICON_" + Math.round(t * 100); I.moveAfter(board()); span(I, tw, t1); I.motionBlur = true; var s = fitInto(I, 112, 112); IT.parent = I; IT.position.setValue([I.sourceRectAtTime(0, false).width / 2, I.sourceRectAtTime(0, false).height / 2]); IT.scale.setValue([100 / (s / 100), 100 / (s / 100)]); IT.moveAfter(I);
    keysAt(I.position, [tw, tw + F(15), tw + F(27)], [[1010, 520], [870, 330], [850, 330]], 80); keysAt(I.scale, [tw, tw + F(15)], [[s * 0.4, s * 0.4], [s, s]], 80); var ib = blur(I, 20); ib.setValueAtTime(tw, 20); ib.setValueAtTime(tw + F(13), 0); }
  mark(W, tWord ? tw + F(15) : t, "device:kineticTitle|word:" + (spokenWord || word.toLowerCase())); return W;   // marked where the word lands, which is the spoken word
}
function screenCard(src, t, t1, bezel, word, size) { // size [w, h] (default 880 x 495): a tall window (Finder) gets its own aspect instead of a 16:9 crop
  var id = "D_SCREEN_" + Math.round(t * 100); var n = c.layers.addNull(); n.name = id; n.anchorPoint.setValue([0, 0]); n.moveAfter(board()); n.position.setValue([540, 290]);
  // above the head in the room (y 42 to 537, head top 549); SPLIT callers set their own position
  var w = size ? size[0] : 880, h = size ? size[1] : 495; var bg = roundRect(id + "_bg", w + (bezel ? 48 : 0), h + (bezel ? 48 : 0), 12, bezel ? [0.93, 0.92, 0.90] : WHITE, [0, 0], null); bg.moveAfter(board()); shadow(bg, 12, 180, 20, 100);
  var img = c.layers.add(footage(src)); img.name = id + "_img"; img.moveBefore(bg); var m = roundRect(id + "_matte", w, h, 10, WHITE, [0, 0], null); m.moveBefore(img);
  try { img.setTrackMatte(m, TrackMatteType.ALPHA); } catch (e) { img.trackMatteType = TrackMatteType.ALPHA; }
  bg.parent = n; img.parent = n; m.parent = n; bg.position.setValue([0, 0]); m.position.setValue([0, 0]); img.position.setValue([0, 0]);
  var r = img.sourceRectAtTime(0, false); var s = Math.max(w / r.width, h / r.height) * 100; img.scale.setValue([s, s]); img.anchorPoint.setValue([r.left + r.width / 2, r.top + r.height / 2]);
  span(n, t, t1); span(bg, t, t1); span(img, t, t1); span(m, t, t1);
  mark(n, t, "device:screenCard|word:" + (word || "")); return n;
}
function screenZoom(card, rect, t0, t1) { // rect = [cx, cy, zoom] in the recording's own pixels relative to its centre: pan the image inside the matte
  var img = c.layer(card.name + "_img"); var s0 = img.scale.value[0]; var s1 = s0 * rect[2]; img.motionBlur = true;
  keysAt(img.scale, [t0, t1], [[s0, s0], [s1, s1]], 80); keysAt(img.position, [t0, t1], [[0, 0], [-rect[0] * rect[2] * s0 / 100, -rect[1] * rect[2] * s0 / 100]], 80);
  mark(card, t0, "device:screenZoom|word:");
}
function typeIn(text, pos, size, t0, t1, ref, word, tEnd, color) { // text types in at a steady rate, retimed to land the whole string by t1; holds to tEnd (default t1 + 1, pass the card's out point); color default near-black for light cards
  var L = textLayer("D_TYPE_" + Math.round(t0 * 100), text, "Inter-Regular", size || 28, color || NEAR_BLACK, pos, ParagraphJustification.LEFT_JUSTIFY, ref || board(), 0); span(L, t0, tEnd || (t1 + 1));
  var r = L.sourceRectAtTime(0, false); L.anchorPoint.setValue([r.left, r.top + r.height / 2]); L.position.setValue(pos);
  var an = L.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
  var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); var st = sel.property("ADBE Text Percent Start"); st.setValueAtTime(t0, 0); st.setValueAtTime(t1, 100);
  mark(L, t0, "device:typeIn|word:" + (word || "")); return L;
}
function notification(iconSrc, title, body, t0, t1, word) {
  var id = "D_NOTIF_" + Math.round(t0 * 100); var n = c.layers.addNull(); n.name = id; n.anchorPoint.setValue([0, 0]); n.moveAfter(board()); n.position.setValue([540, 360]);   // pill y 274 to 446, clear of the hair
  var bg = roundRect(id + "_bg", 880, 172, 40, [0.81, 0.81, 0.81], [0, 0], null); bg.moveAfter(board()); bg.opacity.setValue(85); bg.parent = n; bg.position.setValue([0, 0]);
  var I = c.layers.add(footage(iconSrc)); I.name = id + "_icon"; I.moveAfter(board()); fitInto(I, 96, 96); I.parent = n; I.position.setValue([-340, 0]);
  var T = textLayer(id + "_title", title, "Inter-SemiBold", 34, [0, 0, 0], [0, 0], ParagraphJustification.LEFT_JUSTIFY, board(), 0); T.parent = n; var tr = T.sourceRectAtTime(0, false); T.anchorPoint.setValue([tr.left, tr.top + tr.height / 2]); T.position.setValue([-260, -26]);
  var B = textLayer(id + "_body", body, "Inter-Regular", 30, [0.27, 0.27, 0.27], [0, 0], ParagraphJustification.LEFT_JUSTIFY, board(), 0); B.parent = n; var br = B.sourceRectAtTime(0, false); B.anchorPoint.setValue([br.left, br.top + br.height / 2]); B.position.setValue([-260, 26]);
  var N = textLayer(id + "_now", "now", "Inter-Regular", 26, [0.45, 0.45, 0.45], [0, 0], ParagraphJustification.RIGHT_JUSTIFY, board(), 0); N.parent = n; var nr = N.sourceRectAtTime(0, false); N.anchorPoint.setValue([nr.left + nr.width, nr.top + nr.height / 2]); N.position.setValue([400, -26]);
  var parts = [bg, I, T, B, N]; for (var i = 0; i < parts.length; i++) { span(parts[i], t0, t1);
    keysAt(parts[i].opacity, [t0, t0 + F(5), t1 - F(4), t1], [0, i == 0 ? 85 : 100, i == 0 ? 85 : 100, 0], 60); }
  keysAt(n.scale, [t0, t0 + F(5), t1 - F(4), t1], [[102, 102], [100, 100], [100, 100], [96, 96]], 60); span(n, t0, t1);
  var bb = blur(bg, 16); bb.setValueAtTime(t0, 16); bb.setValueAtTime(t0 + F(5), 0); bb.setValueAtTime(t1 - F(4), 0); bb.setValueAtTime(t1, 12);
  // word by word reveal on the body, 2 frames apart
  var an = B.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator"); an.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
  var sel = an.property("ADBE Text Selectors").addProperty("ADBE Text Selector"); sel.property("ADBE Text Range Advanced").property("ADBE Text Range Units").setValue(1); sel.property("ADBE Text Range Advanced").property("ADBE Text Range Type2").setValue(3);   // based on words
  var st = sel.property("ADBE Text Percent Start"); var nWords = body.replace(/\s+/g, " ").split(" ").length; st.setValueAtTime(t0 + F(5), 0); st.setValueAtTime(t0 + F(5 + 2 * nWords), 100);   // no HOLD: held keys kept the whole body hidden, then popped it in at the end (2026-09-26)
  mark(n, t0, "device:notification|word:" + (word || "")); return n;
}
function cardReseat(card, dy, t) { var p = card.position.value; card.motionBlur = true; keysAt(card.position, [t, t + F(10)], [p, [p[0], p[1] + dy]], 80);
  card.position.expression = "v = value; t = time - " + (t + F(10)) + "; (t > 0) ? v + [0, 10*Math.sin(t*2*Math.PI*0.6)] : v"; mark(card, t, "device:cardReseat|word:"); }
// the house kit outside the repo (kept by the post-ship sweep): plates, the signature card and generated props (alpha PNGs, ink overlays)
var RIG = H.rig, PROPS = RIG + "props/";
function signoff(t) { // the house signature card on the mat, "Joe B" writes on, red period, "real tools · zero hype" (3.13 s, rendered from the approved v5 card)
  // the card's frames 0 to 4 carry a stray "link" caption baked in from the reel it was rendered from, so it plays from frame 5 (2.97 s on screen; found 2026-10-02)
  var L = c.layers.add(footage(RIG + "plates/signoff-card.mp4")); L.name = "D_SIGNOFF"; L.moveAfter(c.layer("CAPTIONS_ANCHOR")); L.startTime = t - F(5); span(L, t, Math.min(t + 3.133 - F(5), c.duration)); L.audioEnabled = false;
  modeMark(t, "FACE CARD"); return L; }
function ctaLockup(keyword, t, spokenWord, dy) { // dy: lift the lockup in a pushed or tight frame (ROOM TIGHT: -125, head top near y 400)
  dy = dy || 0;
  var C = textLayer("D_CTA_COMMENT_" + Math.round(t * 100), "Comment", "SignPainter-HouseScript", 66, WHITE, [335, 330 + dy], ParagraphJustification.LEFT_JUSTIFY, board(), 0); span(C, t, c.duration);
  var K = textLayer("D_CTA_KEY_" + Math.round(t * 100), "“" + keyword.toUpperCase() + "”", "Inter-ExtraBold", 100, BRICK, [540, 495 + dy], ParagraphJustification.CENTER_JUSTIFY, board(), -10); span(K, t, c.duration); K.motionBlur = true;
  var r = K.sourceRectAtTime(0, false); if (r.width > 972) K.scale.setValue([972 / r.width * 100, 972 / r.width * 100]);
  keysAt(K.position, [t, t + F(9)], [[540, 495 + dy], [540, 425 + dy]], 85);   // keyword settles at y 425 + dy, cap line clear of the hair
  var kb = blur(K, 14); kb.setValueAtTime(t, 14); kb.setValueAtTime(t + F(7), 0);   // was swallowed by the comment above until 2026-09-27, so every lockup slid in sharp
  mark(C, t, "device:ctaLockup|word:" + (spokenWord || keyword.toLowerCase())); return K;
}
function sessionTag(n, total, t, t1, pos) { // the series pill on the hook beat (Joe 2026-10-01: "SESSION 1 OF 10"): white pill, Inter-ExtraBold 34 caps
  // near-black, default centre [540, 255] (just under Instagram's top bar); call it 2 frames before the hook card; the text builds in, the pill comes up
  // defocus-to-sharp over 5 frames; holds dead still and hard cuts out with the hook beat (t1)
  pos = pos || [540, 255]; var id = "D_SESSTAG_" + Math.round(t * 100);
  var T = textLayer(id + "_txt", "SESSION " + n + " OF " + total, "Inter-ExtraBold", 34, NEAR_BLACK, pos, null, board(), 40);
  var r = T.sourceRectAtTime(0, false);
  var P = roundRect(id + "_pill", r.width + 44, r.height + 24, 28, WHITE, pos, null); P.moveAfter(T); shadow(P, 10, 225, 16, 140);
  span(T, t, t1); span(P, t, t1); buildIn(T, t, 8, 34);
  var pb = blur(P, 12); pb.setValueAtTime(t, 12); pb.setValueAtTime(t + F(5), 0); P.opacity.setValueAtTime(t, 0); P.opacity.setValueAtTime(t + F(5), 100);
  mark(T, t, "device:sessionTag|word:session"); return T;
}
