// After Effects discovery must find any installed yearly version, newest first, not only a fixed list.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { discoverAfterFxPaths, resolveAfterFxPath, runningAfterFxApps } from "../src/config.js";

function macRoot(years: string[], extra: string[] = []): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "ae-apps-"));
  for (const y of years) mkdirSync(path.join(root, `Adobe After Effects ${y}`, `Adobe After Effects ${y}.app`), { recursive: true });
  for (const name of extra) mkdirSync(path.join(root, name), { recursive: true });
  return root;
}

describe("After Effects discovery", () => {
  const saved = { AE_MCP_EXE: process.env.AE_MCP_EXE, AE_EXE: process.env.AE_EXE };
  beforeEach(() => { delete process.env.AE_MCP_EXE; delete process.env.AE_EXE; });
  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  });

  it("lists installed macOS versions newest first", () => {
    const root = macRoot(["2025", "2027", "2026"]);
    expect(discoverAfterFxPaths("darwin", root)).toEqual([
      path.join(root, "Adobe After Effects 2027", "Adobe After Effects 2027.app"),
      path.join(root, "Adobe After Effects 2026", "Adobe After Effects 2026.app"),
      path.join(root, "Adobe After Effects 2025", "Adobe After Effects 2025.app"),
    ]);
  });

  it("skips folders without the app and names that are not a yearly release", () => {
    const root = macRoot(["2026"], ["Adobe After Effects 2028", "Adobe After Effects (Beta)", "Adobe Premiere Pro 2027"]);
    expect(discoverAfterFxPaths("darwin", root)).toEqual([
      path.join(root, "Adobe After Effects 2026", "Adobe After Effects 2026.app"),
    ]);
  });

  it("finds AfterFX.exe under a Windows Adobe folder", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "ae-win-"));
    mkdirSync(path.join(root, "Adobe After Effects 2027", "Support Files"), { recursive: true });
    writeFileSync(path.join(root, "Adobe After Effects 2027", "Support Files", "AfterFX.exe"), "");
    expect(discoverAfterFxPaths("win32", root)).toEqual([path.join(root, "Adobe After Effects 2027", "Support Files", "AfterFX.exe")]);
  });

  it("returns nothing for a missing folder", () => {
    expect(discoverAfterFxPaths("darwin", path.join(os.tmpdir(), "no-such-applications-folder"))).toEqual([]);
  });

  it("resolves a version newer than the built-in list", () => {
    const root = macRoot(["2027"]);
    expect(resolveAfterFxPath("darwin", root, () => [])).toBe(path.join(root, "Adobe After Effects 2027", "Adobe After Effects 2027.app"));
  });

  it("still prefers AE_MCP_EXE", () => {
    const root = macRoot(["2027", "2026"]);
    process.env.AE_MCP_EXE = path.join(root, "Adobe After Effects 2026", "Adobe After Effects 2026.app");
    expect(resolveAfterFxPath("darwin", root, () => [])).toBe(process.env.AE_MCP_EXE);
  });

  it("prefers the release that is already running", () => {
    const root = macRoot(["2026", "2027"]);
    const app2027 = path.join(root, "Adobe After Effects 2027", "Adobe After Effects 2027.app");
    expect(resolveAfterFxPath("darwin", root, () => [app2027])).toBe(app2027);
  });

  it("prefers the supported 2026 over a newer release that is not running", () => {
    const root = macRoot(["2026", "2027"]);
    expect(resolveAfterFxPath("darwin", root, () => [])).toBe(path.join(root, "Adobe After Effects 2026", "Adobe After Effects 2026.app"));
  });

  it("ignores releases older than 2024", () => {
    const root = macRoot(["2023", "2024"]);
    expect(discoverAfterFxPaths("darwin", root)).toEqual([path.join(root, "Adobe After Effects 2024", "Adobe After Effects 2024.app")]);
  });

  it("reads running releases from the process list", () => {
    const ps = "/usr/libexec/x\n/Applications/Adobe After Effects 2027/Adobe After Effects 2027.app/Contents/MacOS/After Effects -psn\n/Applications/Adobe After Effects 2027/Adobe After Effects 2027.app/Contents/MacOS/dynamiclinkmanager\n";
    expect(runningAfterFxApps(ps)).toEqual(["/Applications/Adobe After Effects 2027/Adobe After Effects 2027.app"]);
  });
});
