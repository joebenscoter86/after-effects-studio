// Artwork helpers for the rebuilds on artwork (loaded after the prelude with $.evalFile(args.artLib)).
// ExtendScript (ES3).
var ART = {};
// Folder named `name` at the project root, made once.
ART.folder = function (name) {
  var i, it;
  for (i = 1; i <= app.project.numItems; i++) {
    it = app.project.item(i);
    if (it instanceof FolderItem && it.name === name) return it;
  }
  return app.project.items.addFolder(name);
};
// Import `dir/file` once into folder `folderName`; re-runs reuse the footage item.
ART.footage = function (dir, file, folderName) {
  var f = ART.folder(folderName), i, it;
  for (i = 1; i <= f.numItems; i++) {
    it = f.item(i);
    if (it instanceof FootageItem && it.name === file) return it;
  }
  var src = new File(dir + "/" + file);
  if (!src.exists) throw new Error("art file missing: " + src.fsName);
  var item = app.project.importFile(new ImportOptions(src));
  item.parentFolder = f;
  return item;
};
// Set effect parameters by display name: { "Glow Threshold": 60, ... }. Returns the names it could not find.
ART.setFx = function (fx, values) {
  var missing = [], k, j, found;
  for (k in values) {
    found = false;
    for (j = 1; j <= fx.numProperties; j++) {
      if (fx.property(j).name === k) { fx.property(j).setValue(values[k]); found = true; break; }
    }
    if (!found) missing.push(k);
  }
  return missing;
};
// Soft glow as the briefs give it.
ART.glow = function (layer, threshold, radius, intensity) {
  var fx = P.effect(layer, "ADBE Glo2");
  var miss = ART.setFx(fx, { "Glow Threshold": threshold, "Glow Radius": radius, "Glow Intensity": intensity });
  if (miss.length) throw new Error("glow params not found: " + miss.join(", "));
  return fx;
};
ART.hex = function (h) {
  h = h.replace("#", "");
  return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
};
