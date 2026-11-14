// Technique 10: drifting copies of a small graphic made by CC Particle World.
// A leaf graphic sits in the comp as its own (hidden) layer. A black solid on top carries CC Particle World with
// Particle Type "Textured QuadPolygon" and Texture Layer pointing at the leaf, so every particle is a leaf.
// The producer is moved to the left and stretched tall, and the physics set to Direction Axis with almost no
// gravity, so the leaves drift sideways across a dark frame, spinning, at varied sizes.
// Not a finish: nothing is named TECH; the particle layer itself is the technique.
//
// VERIFY: match name "CC Particle World" (recipe gives it) is addable.
// VERIFY: effect groups ("Producer", "Physics", "Particle", "Texture", "Grid & Guides", "Direction Axis") appear as nested property groups in scripting; find() searches depth-first by display name, so it also works if they are flat.
// VERIFY: display names "Birth Rate", "Longevity (sec)", "Position X/Y/Z", "Radius X/Y/Z", "Animation", "Velocity", "Inherit Velocity %", "Gravity", "Resistance", "Extra", "Extra Angle", "Particle Type", "Texture Layer", "Scatter", "Align To Direction", "Texture Time", "Rotation Speed", "Initial Rotation", "Rotation Axis", "Birth Size", "Death Size", "Size Variation", "Max Opacity", "Color Map".
// VERIFY: Particle Type popup index for "Textured QuadPolygon" (args.particleType, default 13 is a guess); read the installed menu order.
// VERIFY: Animation popup index 2 = "Direction Axis" (1 = Explosive believed).
// VERIFY: Rotation Axis index 1 = "Any Axis"; Color Map index 1 = "Birth to Death"; Texture Time index 1 = "Current". The script does not set these three; it reads them back in the result so they can be checked against the recipe.
// VERIFY: Extra Angle "1x +0.0°" is the value 360 in scripting.
// VERIFY: Texture Layer takes the leaf layer's index; its second dropdown (Source / Masks / Effects & Masks) is not scriptable and is expected to default to "Source".
// VERIFY: a hidden (enabled = false) layer still serves as the texture.
// VERIFY: Direction Axis sub-properties are named "Axis X", "Axis Y", "Axis Z" (recorded in result.missing if not found).
// VERIFY: Grid & Guides checkboxes "Position", "Radius", "Motion Path", "Grid", "Horizon", "Axis Box" (recorded in result.missing if not found); whether the grid shows in a render at all.
// VERIFY: Birth Size 0.25 on a 300 x 300 texture comp gives leaves of a sensible size at 1920 x 1080; if tiny or huge, the texture comp's size is the lever, not the recipe values.
$.evalFile(args.prelude);
args = args || {};

// Candidate for the prelude: depth-first search of a property group by display name.
function find(group, name) {
  var i, p, r;
  for (i = 1; i <= group.numProperties; i++) {
    p = group.property(i);
    if (p.name === name) return p;
    if (p.propertyType !== PropertyType.PROPERTY) {
      r = find(p, name);
      if (r) return r;
    }
  }
  return null;
}
// Look inside a named sub-group first (to avoid a same-named property elsewhere), then anywhere in the effect.
function need(fx, groupName, name) {
  var g = groupName ? find(fx, groupName) : null;
  var p = g ? find(g, name) : null;
  if (!p) p = find(fx, name);
  if (!p) throw new Error("CC Particle World property not found: " + (groupName ? groupName + " > " : "") + name);
  return p;
}
var missing = [];
function setOptional(fx, groupName, name, v) {
  var g = find(fx, groupName);
  var p = g ? find(g, name) : null;
  // Run fix: in AE 2027 neither "Direction Axis" nor "Grid & Guides" is found as a group by display name; the properties
  // are reachable by a whole-effect search. The Grid & Guides "Position" and "Radius" come first in the effect, before
  // Producer's "Position X" and "Radius X", so the first match is the right one.
  if (!p) p = find(fx, name);
  if (!p) { missing.push(groupName + " > " + name); return; }
  p.setValue(v);
}
function fill(sh, color) {
  var f = P.contents(sh).addProperty("ADBE Vector Graphic - Fill");
  var idx = f.propertyIndex;
  P.contents(sh).property(idx).property("ADBE Vector Fill Color").setValue(color);
  return idx;
}

// The graphic. SUBSTITUTE: the tutorial imports a leaf vector file (its own tight bounds). A small comp holding a
// shape leaf stands in for it, so the texture is the leaf and not a comp-sized frame with a leaf in the middle.
// ASSUMED: leaf colour green; texture comp 300 x 300.
var leafComp = P.freshComp("10 leaf graphic", 300, 300, 24, 5, [0, 0, 0]);
var leaf = P.shape(leafComp, "leaf");
P.path(leaf, [[0, -140], [0, 140]], [[-95, 70], [75, -85]], [[95, 70], [-75, -85]], true);
fill(leaf, [0.36, 0.68, 0.28, 1]);
P.tf(leaf.layer, "ADBE Position").setValue([150, 150]);
P.tf(leaf.layer, "ADBE Rotate Z").setValue(25);
var vein = P.shape(leafComp, "vein");
P.path(vein, [[0, -120], [0, 125]], null, null, false);
P.stroke(vein, [0.22, 0.45, 0.17, 1], 6, 2);
P.tf(vein.layer, "ADBE Position").setValue([150, 150]);
P.tf(vein.layer, "ADBE Rotate Z").setValue(25);

// ASSUMED: dark frame, 5 s, 24 fps (recipe gives no comp size, solid colour or scene).
var c = P.freshComp("10 graphic as particles", 1920, 1080, 24, 5, [0.04, 0.05, 0.07]);
// Re-runs: freshComp removes the comps but not the solids they used; remove this script's unused ones first.
(function () {
  var j, it, col;
  function near(a, b) { return Math.abs(a[0] - b[0]) < 0.002 && Math.abs(a[1] - b[1]) < 0.002 && Math.abs(a[2] - b[2]) < 0.002; }
  for (j = app.project.numItems; j >= 1; j--) {
    it = app.project.item(j);
    if (!(it instanceof FootageItem) || !(it.mainSource instanceof SolidSource) || it.usedIn.length !== 0) continue;
    col = it.mainSource.color;
    if ((it.name === "background" && near(col, [0.05, 0.07, 0.10])) || (it.name === "leaf particles" && near(col, [0, 0, 0]))) it.remove();
  }
})();
var bg = P.solid(c, "background", [0.05, 0.07, 0.10]);

// Step 1: the graphic as its own layer, scaled to 32 %. Hidden: it is only the texture source (inferred in recipe).
var leafLayer = c.layers.add(leafComp);
leafLayer.name = "leaf graphic";
P.tf(leafLayer, "ADBE Scale").setValue([32, 32]);
P.tf(leafLayer, "ADBE Position").setValue([1700, 160]);
leafLayer.enabled = false;

// Step 2: black solid at the top of the stack carrying CC Particle World.
var ps = P.solid(c, "leaf particles", [0, 0, 0]);
ps.moveToBeginning();
P.effect(ps, "CC Particle World");
var fx = ps.property("ADBE Effect Parade").property("CC Particle World");

// Recipe values (shown f009598). args.birthRate / args.longevity override.
need(fx, null, "Birth Rate").setValue(args.birthRate || 2.0);
need(fx, null, "Longevity (sec)").setValue(args.longevity || 1.0);

// Step 3: Particle Type first, as the recipe stresses.
// ASSUMED: index 13 for "Textured QuadPolygon"; pass args.particleType to correct it.
need(fx, "Particle", "Particle Type").setValue(args.particleType || 13);

// Step 4: Texture Layer = the leaf layer (by index); Scatter 0; Align To Direction off.
fx = ps.property("ADBE Effect Parade").property("CC Particle World");
need(fx, "Texture", "Texture Layer").setValue(leafLayer.index);
need(fx, "Texture", "Scatter").setValue(0);
need(fx, "Texture", "Align To Direction").setValue(0);

// Step 5: particle look as shown on screen.
need(fx, "Particle", "Rotation Speed").setValue(180);
need(fx, "Particle", "Initial Rotation").setValue(360);
need(fx, "Particle", "Birth Size").setValue(0.25);
need(fx, "Particle", "Death Size").setValue(0.25);
need(fx, "Particle", "Size Variation").setValue(50);
need(fx, "Particle", "Max Opacity").setValue(75);

// Step 6: emitter and physics for a sideways drift.
need(fx, "Producer", "Position X").setValue(-0.58);
need(fx, "Producer", "Position Y").setValue(0);
need(fx, "Producer", "Position Z").setValue(0);
need(fx, "Producer", "Radius X").setValue(0.025);
need(fx, "Producer", "Radius Y").setValue(0.225);
need(fx, "Producer", "Radius Z").setValue(0.025);
need(fx, "Physics", "Animation").setValue(2); // Direction Axis (VERIFY index)
fx = ps.property("ADBE Effect Parade").property("CC Particle World");
need(fx, "Physics", "Velocity").setValue(1.08);
need(fx, "Physics", "Inherit Velocity %").setValue(0);
need(fx, "Physics", "Gravity").setValue(0.03);
need(fx, "Physics", "Resistance").setValue(0);
need(fx, "Physics", "Extra").setValue(0.5);
need(fx, "Physics", "Extra Angle").setValue(360);
// Direction Axis is left at its default (Axis X 0, Y -1, Z 0); the recipe does not show it being changed.
// Run fix: the script first set it to (1, 0, 0) for a left-to-right drift. That sent the leaves away from the viewer
// into a cluster converging on a point left of centre, covering only about the left 40% of the frame. With the default
// axis, the recipe's values give leaves spread across the whole frame, as the layout line measures.
// args.axis = [x, y, z] still overrides.
if (args.axis) {
  setOptional(fx, "Direction Axis", "Axis X", args.axis[0]);
  setOptional(fx, "Direction Axis", "Axis Y", args.axis[1]);
  setOptional(fx, "Direction Axis", "Axis Z", args.axis[2]);
}

// ASSUMED: guides off (the grid is gone in the recipe's result frame; the change is not shown).
setOptional(fx, "Grid & Guides", "Position", 0);
setOptional(fx, "Grid & Guides", "Radius", 0);
setOptional(fx, "Grid & Guides", "Motion Path", 0);
setOptional(fx, "Grid & Guides", "Grid", 0);
setOptional(fx, "Grid & Guides", "Horizon", 0);
setOptional(fx, "Grid & Guides", "Axis Box", 0);

// Step 7: the particle layer composites over the scene in Normal mode (blend not shown; ASSUMED Normal, 100 %).

fx = ps.property("ADBE Effect Parade").property("CC Particle World");
return {
  comp: c.name,
  textureComp: leafComp.name,
  layers: c.numLayers,
  textureLayerIndex: leafLayer.index,
  readBack: {
    particleType: need(fx, "Particle", "Particle Type").value,
    animation: need(fx, "Physics", "Animation").value,
    rotationAxis: need(fx, "Particle", "Rotation Axis").value,
    colorMap: need(fx, "Particle", "Color Map").value,
    textureTime: need(fx, "Texture", "Texture Time").value,
    textureLayer: need(fx, "Texture", "Texture Layer").value
  },
  missing: missing.join("; ")
};
