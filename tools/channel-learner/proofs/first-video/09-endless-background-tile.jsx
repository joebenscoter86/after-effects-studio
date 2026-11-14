// Technique 9: slide a background endlessly with mirrored tiling.
// A stand-in landscape seen through a train window. Motion Tile with Mirror Edges on, and an expression on
// Tile Center that slides only X, makes the landscape scroll sideways forever with flipped copies at the joins.
//
// VERIFY: P.effect accepts the display name "Motion Tile" (match name ADBE Tile)
// VERIFY: Motion Tile property display names "Tile Center", "Tile Width", "Tile Height", "Output Width", "Output Height", "Mirror Edges", "Phase", "Horizontal Phase Shift"
// VERIFY: Motion Tile works on a shape layer whose bounds are the comp (anchor [0,0], position [0,0]); if it tiles an empty or wrong-sized buffer, precompose the landscape into a 1920x1080 comp and apply the effect to that layer
// VERIFY: a renamed effect ("TECH Motion Tile") is still reached by layer.property("ADBE Effect Parade").property(index)
// VERIFY: shape property match names ADBE Vector Shape - Rect / ADBE Vector Rect Size / ADBE Vector Rect Position / ADBE Vector Ellipse Position
$.evalFile(args.prelude);

// Local helpers (candidates for the prelude: P.group, P.groupContents, P.rect, P.ellipseAt, P.fill).
function group(layer, name) {
  var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
  g.name = name;
  return g.propertyIndex;
}
function groupContents(layer, gi) {
  return layer.property("ADBE Root Vectors Group").property(gi).property("ADBE Vectors Group");
}
function rect(layer, gi, center, size) {
  var r = groupContents(layer, gi).addProperty("ADBE Vector Shape - Rect");
  var idx = r.propertyIndex;
  groupContents(layer, gi).property(idx).property("ADBE Vector Rect Size").setValue(size);
  groupContents(layer, gi).property(idx).property("ADBE Vector Rect Position").setValue(center);
}
function ellipseAt(layer, gi, center, size) {
  var e = groupContents(layer, gi).addProperty("ADBE Vector Shape - Ellipse");
  var idx = e.propertyIndex;
  groupContents(layer, gi).property(idx).property("ADBE Vector Ellipse Size").setValue(size);
  groupContents(layer, gi).property(idx).property("ADBE Vector Ellipse Position").setValue(center);
}
function fill(layer, gi, color) {
  var f = groupContents(layer, gi).addProperty("ADBE Vector Graphic - Fill");
  groupContents(layer, gi).property(f.propertyIndex).property("ADBE Vector Fill Color").setValue(color);
}
function poly(layer, gi, verts) {
  var p = groupContents(layer, gi).addProperty("ADBE Vector Shape - Group");
  var sh = new Shape();
  sh.vertices = verts;
  sh.closed = true;
  groupContents(layer, gi).property(p.propertyIndex).property("ADBE Vector Shape").setValue(sh);
}
function flatShape(comp, name) {
  var l = comp.layers.addShape();
  l.name = name;
  P.tf(l, "ADBE Anchor Point").setValue([0, 0]);
  P.tf(l, "ADBE Position").setValue([0, 0]);
  return l;
}

var DUR = 5;
var c = P.freshComp("09 endless background tile", 1920, 1080, 24, DUR, [0.12, 0.13, 0.17]);

// The landscape artwork: one 1920x1080 shape layer, deliberately uneven so the slide and the mirrored joins show.
// Groups render top to bottom in the order added, so the nearest things come first.
// Layout (recipe's layout: line): mountain peaks about 25-30% down (270-324 px), tree line from about 35% down (378 px)
// to the window's bottom (972 px).
var land = flatShape(c, "landscape");
var gi = group(land, "trees");
// Tree canopies at uneven spacing; their tops make the tree line at about 378-470 px.
ellipseAt(land, gi, [150, 560], [200, 330]);
ellipseAt(land, gi, [330, 600], [150, 260]);
ellipseAt(land, gi, [610, 620], [130, 220]);
ellipseAt(land, gi, [1000, 560], [230, 360]);
ellipseAt(land, gi, [1180, 610], [150, 250]);
ellipseAt(land, gi, [1520, 580], [190, 300]);
ellipseAt(land, gi, [1780, 620], [140, 230]);
fill(land, gi, [0.16, 0.38, 0.22, 1]);
gi = group(land, "trunks");
rect(land, gi, [150, 800], [28, 160]);
rect(land, gi, [330, 790], [22, 120]);
rect(land, gi, [610, 790], [18, 100]);
rect(land, gi, [1000, 800], [30, 160]);
rect(land, gi, [1180, 790], [20, 110]);
rect(land, gi, [1520, 800], [26, 140]);
rect(land, gi, [1780, 790], [20, 100]);
fill(land, gi, [0.33, 0.23, 0.15, 1]);
gi = group(land, "near hills");
ellipseAt(land, gi, [500, 980], [1400, 300]);
ellipseAt(land, gi, [1600, 1000], [1100, 280]);
fill(land, gi, [0.32, 0.56, 0.32, 1]);
gi = group(land, "far hills");
ellipseAt(land, gi, [250, 760], [900, 420]);
ellipseAt(land, gi, [1050, 740], [1000, 480]);
ellipseAt(land, gi, [1750, 770], [800, 380]);
fill(land, gi, [0.58, 0.74, 0.55, 1]);
gi = group(land, "mountains");
// Peaks at 270-324 px down, uneven widths.
poly(land, gi, [[-100, 760], [380, 280], [760, 760]]);
poly(land, gi, [[520, 760], [880, 324], [1240, 760]]);
poly(land, gi, [[1050, 760], [1420, 270], [1900, 760]]);
poly(land, gi, [[1600, 760], [1850, 300], [2100, 760]]);
fill(land, gi, [0.48, 0.55, 0.68, 1]);
gi = group(land, "sun");
ellipseAt(land, gi, [1560, 220], [130, 130]);
fill(land, gi, [1, 0.88, 0.55, 1]);
gi = group(land, "sky");
rect(land, gi, [960, 540], [1920, 1080]);
fill(land, gi, [0.62, 0.80, 0.93, 1]);

// The technique. Values as shown in the recipe: sizes 100, phase 0, Mirror Edges on.
var mt = P.effect(land, "Motion Tile");
var mtIdx = mt.propertyIndex;
mt.name = "TECH Motion Tile";
mt = land.property("ADBE Effect Parade").property(mtIdx);
mt.property("Tile Center").setValue([960, 540]);
mt.property("Tile Width").setValue(100);
mt.property("Tile Height").setValue(100);
mt.property("Output Width").setValue(100);
mt.property("Output Height").setValue(100);
mt.property("Mirror Edges").setValue(1);
// ASSUMED: the expression on Tile Center is never shown. A linear slide of X only, sized so that X reads -6006
// at 0:00:04:00 as on screen: 960 - 4 * 1741.5 = -6006. About 1740 px a second, landscape moving left.
mt.property("Tile Center").expression = "[value[0] - time * 1741.5, value[1]]";

// Train wall with the window opening, over the landscape (panels around the hole).
// Layout: main window 4-90% across (77-1728 px), top edge 15% down (162 px), bottom edge 90% down (972 px);
// a narrow second window strip at 97-100% across (1862-1920 px), so a wall post at 1728-1862 px.
// ASSUMED: the narrow strip's top and bottom match the main window. The layout also says the part of the opening left of
// "the post behind her" starts lower, at about 30% down; it is unclear which post that is, so it is left out.
var WL = 77, WT = 162, WR = 1728, WB = 972, SL = 1862;
var wall = flatShape(c, "train wall");
gi = group(wall, "frame");
rect(wall, gi, [960, WT / 2], [1920, WT]);
rect(wall, gi, [960, (WB + 1080) / 2], [1920, 1080 - WB]);
rect(wall, gi, [WL / 2, 540], [WL, 1080]);
rect(wall, gi, [(WR + SL) / 2, 540], [SL - WR, 1080]);
fill(wall, gi, [0.20, 0.22, 0.30, 1]);

// A seated figure in silhouette in front, so it reads as "the view out of the window behind a character".
// Layout: character about 15-52% across (288-998 px).
var fig = flatShape(c, "figure");
gi = group(fig, "head");
ellipseAt(fig, gi, [640, 470], [300, 330]);
fill(fig, gi, [0.08, 0.08, 0.11, 1]);
gi = group(fig, "torso");
rect(fig, gi, [643, 900], [710, 420]);
ellipseAt(fig, gi, [643, 720], [710, 200]);
fill(fig, gi, [0.08, 0.08, 0.11, 1]);
gi = group(fig, "neck");
rect(fig, gi, [640, 640], [120, 120]);
fill(fig, gi, [0.08, 0.08, 0.11, 1]);

return { comp: c.name, id: c.id, layers: c.numLayers, techEffect: mt.name, tileCenterAt4s: [960 - 4 * 1741.5, 540] };
