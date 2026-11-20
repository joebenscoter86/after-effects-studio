// Switch every effect and layer named "TECH ..." in args.comp on or off (args.on). Returns what it touched.
var i, j, c = null, it, l, fx, n = 0;
for (i = 1; i <= app.project.numItems; i++) {
  it = app.project.item(i);
  if (it instanceof CompItem && it.name === args.comp) c = it;
}
if (!c) throw new Error("comp not found: " + args.comp);
for (i = 1; i <= c.numLayers; i++) {
  l = c.layer(i);
  if (l.name.indexOf("TECH ") === 0) { l.enabled = !!args.on; n++; }
  fx = l.property("ADBE Effect Parade");
  if (!fx) continue;
  for (j = 1; j <= fx.numProperties; j++) {
    if (fx.property(j).name.indexOf("TECH ") === 0) { fx.property(j).enabled = !!args.on; n++; }
  }
}
return { comp: c.name, on: !!args.on, touched: n };
