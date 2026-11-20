// Offline tests for AESLib.effectUsable (library/styles/aes-lib.jsx): an effect counts as usable only when it is installed
// and, for an effect in the licence table, its licence file is present. The helper runs in a vm context against a fake of
// app.effects, Folder.userData and File; nothing here can reach After Effects or the real Application Support folder.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { describe, expect, it } from "vitest";

import { lintJsxFile } from "./helpers/lint-jsx.js";

const LIB_PATH = fileURLToPath(new URL("../../library/styles/aes-lib.jsx", import.meta.url));
const LIB = readFileSync(LIB_PATH, "utf8");
const SUPPORT = "/fake/AppSupport";
const DEEP_LIC = SUPPORT + "/com.aescripts.DeepGlow2.lic";
const UNLICENSED = "Deep Glow is installed but not licensed; used the stock glow";

const TABLE =
  'var LICENSED = { PEDG2: { product: "DeepGlow2", label: "Deep Glow", fallback: "used the stock glow" } };';

function lib(opts: { effects: string[]; files?: string[]; table?: string }) {
  const present = new Set(opts.files ?? []);
  class File {
    constructor(public fsName: string) {}
    get exists() {
      return present.has(this.fsName);
    }
  }
  const ctx = vm.createContext({
    app: { effects: opts.effects.map((matchName) => ({ matchName })) },
    Folder: { userData: { fsName: SUPPORT } },
    File,
    Math,
  });
  let src = LIB;
  if (opts.table !== undefined) {
    if (!src.includes(TABLE)) throw new Error("licence table line changed");
    src = src.replace(TABLE, opts.table);
  }
  vm.runInContext(src, ctx);
  return (ctx as any).AESLib;
}

describe("AESLib.effectUsable", () => {
  it("aes-lib is ES3 and loads without touching After Effects", () => {
    expect(lintJsxFile(LIB_PATH).filter((f) => f.severity === "error")).toEqual([]);
    vm.runInNewContext(LIB, {
      get app() {
        throw new Error("load touched app");
      },
    });
  });

  it("installed with its licence file: usable", () => {
    const r = lib({ effects: ["ADBE Glo2", "PEDG2"], files: [DEEP_LIC] }).effectUsable("PEDG2");
    expect(r).toMatchObject({ usable: true, installed: true, licensed: true });
  });

  it("installed without its licence file: not usable, with the build report's sentence", () => {
    const r = lib({ effects: ["ADBE Glo2", "PEDG2"] }).effectUsable("PEDG2");
    expect(r).toMatchObject({ usable: false, installed: true, licensed: false });
    expect(r.reason).toBe(UNLICENSED);
  });

  it("not installed: not usable, whether or not a licence file is present", () => {
    for (const files of [[DEEP_LIC], []]) {
      const r = lib({ effects: ["ADBE Glo2"], files }).effectUsable("PEDG2");
      expect(r.usable).toBe(false);
      expect(r.installed).toBe(false);
    }
  });

  it("licensed: true overrides a missing licence file", () => {
    const r = lib({ effects: ["PEDG2"] }).effectUsable("PEDG2", { licensed: true });
    expect(r).toMatchObject({ usable: true, installed: true, licensed: true });
  });

  it("an effect not in the licence table: usable when installed, licence unknown", () => {
    const r = lib({ effects: ["ADBE Glo2"] }).effectUsable("ADBE Glo2");
    expect(r).toMatchObject({ usable: true, installed: true, licensed: null });
  });

  it("the reason takes its fallback phrase from the table entry", () => {
    const table =
      'var LICENSED = { XFX1: { product: "OtherFx", label: "Other FX", fallback: "used the stock blur" }, ' +
      'XFX2: { product: "Bare", label: "Bare FX" } };';
    const L = lib({ effects: ["XFX1", "XFX2"], table });
    expect(L.effectUsable("XFX1").reason).toBe(
      "Other FX is installed but not licensed; used the stock blur",
    );
    expect(L.effectUsable("XFX2").reason).toBe("Bare FX is installed but not licensed");
  });

  it("the Deep Glow sentence is unchanged", () => {
    expect(LIB).toContain(TABLE);
    expect(lib({ effects: ["PEDG2"] }).effectUsable("PEDG2").reason).toBe(UNLICENSED);
  });
});
