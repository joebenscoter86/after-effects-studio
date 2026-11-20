// Probe: list property names, values and menu text of the effects these builds use. Removes its own comp and solid.
$.evalFile(args.prelude);
var k;
for (k = app.project.numItems; k >= 1; k--) if (app.project.item(k).name === "il_O probe solid" && app.project.item(k) instanceof FootageItem) app.project.item(k).remove();
var c = P.freshComp("il_O probe", 1920, 1080, 23.976, 2, [0, 0, 0]);
var s = P.solid(c, "il_O probe solid", [1, 1, 1]);
var names = args.effects, out = [], i;
function dump(g, pre) {
  var j, p, v;
  for (j = 1; j <= g.numProperties; j++) {
    p = g.property(j);
    if (p.propertyType === PropertyType.PROPERTY) {
      v = "?";
      try { v = String(p.value); } catch (e) { v = "?"; }
      try { if (p.isDropdownEffect) v += " (dropdown)"; } catch (e2) {}
      try { out.push(pre + p.name + " [" + p.matchName + "] = " + v); } catch (e3) { out.push(pre + "#" + j + " (unreadable)"); }
    } else {
      out.push(pre + "+ " + p.name + " [" + p.matchName + "]");
      dump(p, pre + "  ");
    }
  }
}
for (i = 0; i < names.length; i++) {
  var e = P.effect(s, names[i]);
  out.push("== " + e.name + " [" + e.matchName + "]");
  dump(s.property("ADBE Effect Parade").property(e.propertyIndex), "  ");
}
var src = s.source;
c.remove();
src.remove();
return out.join("\n");
