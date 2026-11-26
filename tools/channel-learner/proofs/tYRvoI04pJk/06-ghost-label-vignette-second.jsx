// Technique 06: faint ghost label (duplicate text, Gradient Overlay reversed, 50% opacity) + CC Vignette adjustment layer.
// VERIFY: app.findMenuCommandId("Gradient Overlay") exists and executeCommand adds the style to the selected layer (no dialog expected)
// VERIFY: layer style match names "ADBE Layer Styles", "gradientOverlay/enabled", "gradientOverlay/opacity", "gradientOverlay/reverse", "gradientOverlay/angle" (names below guessed from the Layer Styles scripting convention)
// VERIFY: gradientOverlay/opacity is 0-100 (percent) and gradientOverlay/angle is degrees
// VERIFY: match name "CC Vignette" and display names "Amount", "Angle of View", "Center", "Pin Highlights"
// VERIFY: comp.shutterAngle accepts 360; comp.motionBlur and layer.motionBlur property names
// VERIFY: setting layer.parent leaves Position values untouched (treated as parent-relative afterwards)
// VERIFY: P.effect with display name "CC Vignette" (canAddProperty may need match name "CC Vignette")
$.evalFile(args.prelude);
var c = P.freshComp("06 ghost label vignette", 1080, 1920, 24, 5, [0, 0, 0]);
c.motionBlur = true;
c.shutterAngle = 360; // ASSUMED: long shutter, recipe says above default 180
c.shutterPhase = -180;

// Art: backdrop plate (brief: layer "Backdrop", fills comp, still, bottom of stack).
var k;
for (k = app.project.numItems; k >= 1; k--) {
  if (app.project.item(k) instanceof FolderItem && app.project.item(k).name === "art 06") app.project.item(k).remove();
}
var artFolder = app.project.items.addFolder("art 06");
var bdFile = new File(args.art || "~/Assets/comp-room-studies/channel-study/tYRvoI04pJk/proof/06/art/backdrop.png");
var bdItem = app.project.importFile(new ImportOptions(bdFile));
bdItem.parentFolder = artFolder;
var bd = c.layers.add(bdItem);
bd.name = "Backdrop";
P.tf(bd, "ADBE Position").setValue([540, 960]);

// Parent null carrying the downward slide.
var nul = c.layers.addNull(c.duration);
nul.name = "scene null";
nul.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
var np = nul.property("ADBE Transform Group").property("ADBE Position");
np.setValue([0, 0]);
np.setValuesAtTimes([0.4, 4.5], [[0, -1100], [0, 0]]); // ASSUMED: second key dragged late (recipe: ~0.4 s and ~6.2 s; 6.2 is beyond a 5 s comp, so cut mid-move at 4.5 s)
np.setTemporalEaseAtKey(1, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]);
np.setTemporalEaseAtKey(2, [new KeyframeEase(0, 60)], [new KeyframeEase(0, 60)]); // ASSUMED eases (not shown in recipe)

// Red button (stand-in rounded rectangle), centred at 540,520.
var b = P.shape(c, "button");
var rect = P.contents(b).addProperty("ADBE Vector Shape - Rect");
rect.property("ADBE Vector Rect Size").setValue([480, 300]); // layout: ~37% of width wide in the reference; 480 px chosen for the 9:16 frame
rect.property("ADBE Vector Rect Roundness").setValue(80);
var fill = P.contents(b).addProperty("ADBE Vector Graphic - Fill");
P.contents(b).property(fill.propertyIndex).property("ADBE Vector Fill Color").setValue([0.898, 0.196, 0.176]);
P.tf(b.layer, "ADBE Anchor Point").setValue([0, 0]);
P.tf(b.layer, "ADBE Position").setValue([540, 540]);
b.layer.parent = nul;
P.tf(b.layer, "ADBE Position").setValue([540, 540]); // VERIFIED: assigning .parent keeps the world position (adds +1100 here), so set the parent-relative Position after parenting

// Button label (the original white text).
var label = P.text(c, "Start", { size: 180, name: "label", pos: [540, 540], font: "HelveticaNeue-Bold" });
label.parent = b.layer;
P.tf(label, "ADBE Position").setValue([0, 0]); // relative to the button, which sits at its own origin

// Ghost copy: duplicate of the label, 3D off, smaller, retyped, 50% opacity.
var ghost = label.duplicate();
ghost.name = "ghost label";
ghost.threeDLayer = false;
var doc = ghost.property("ADBE Text Properties").property("ADBE Text Document");
var d = doc.value;
d.text = "Loading"; // ASSUMED: any gerund status word
d.fontSize = 130; // recipe: 140.5 px against 202.5 px original on a 3840 comp, i.e. 0.69 of the label size (110 -> ~76); 70 chosen so glyph height ~5% of picture
doc.setValue(d);
var gr = ghost.sourceRectAtTime(0, false);
P.tf(ghost, "ADBE Anchor Point").setValue([gr.left + gr.width / 2, gr.top + gr.height / 2]);
ghost.parent = b.layer;
P.tf(ghost, "ADBE Position").setValue([-0.9, 977]); // absolute y = 540 + 977 = 1517 = 79% of 1920 // recipe: parent-relative about -0.9, well below the button (ASSUMED 700 px for a 9:16 frame)
P.tf(ghost, "ADBE Opacity").setValue(50);

// Gradient Overlay layer style. SUBSTITUTE: right-click > Layer Styles > Gradient Overlay, done via the menu command id.
c.openInViewer(); // the menu command acts on the active comp: make ours active first
var i;
for (i = 1; i <= c.numLayers; i++) c.layer(i).selected = false;
ghost.selected = true;
app.executeCommand(app.findMenuCommandId("Gradient Overlay"));
var ls = ghost.property("ADBE Layer Styles");
// Verified: the style group is "gradientFill/enabled"; children gradientFill/opacity (0-100), /reverse, /angle (degrees).
var go = ls.property("gradientFill/enabled");
go.property("gradientFill/opacity").setValue(60);
go.property("gradientFill/reverse").setValue(true);
go.property("gradientFill/angle").setValue(90);
// ASSUMED: gradient colours left at the style's default (stops are never shown in the recipe; script cannot edit gradient stops).

// Motion blur on for the moving layers.
b.layer.motionBlur = true;
label.motionBlur = true;
ghost.motionBlur = true;

// Finish: adjustment layer at the top with CC Vignette. TECH prefix so it can be switched off.
var adj = c.layers.addSolid([1, 1, 1], "TECH vignette", c.width, c.height, 1, c.duration);
adj.adjustmentLayer = true;
adj.moveToBeginning();
var v = P.effect(adj, "CC Vignette");
v.property("Amount").setValue(100);
v.property("Angle of View").setValue(45);
v.property("Center").setValue([540, 960]);
v.property("Pin Highlights").setValue(0);
ghost.name = "TECH ghost label"; // lets the runner disable the ghost for a "before" frame
return { comp: c.name, id: c.id, layers: c.numLayers };
