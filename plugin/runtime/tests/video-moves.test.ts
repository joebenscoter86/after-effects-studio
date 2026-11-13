// video.moves and motion.compare_moves (stage 13): the table and beat sheet from tracks, and a build compared with the
// measured moves, both as a property and as a track of its render. The operations are registered and in the catalog.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import "../src/operations/index.js";
import { getOp } from "../src/registry.js";
import { aeEase } from "../src/video/fit.js";
import { runCompareMoves, runMoves } from "../src/video/run-moves.js";
import { runShots } from "../src/video/run-shots-census.js";
import { runTrack } from "../src/video/run-track.js";
import { clips, writeClip } from "./helpers/video-clips.js";

let dir: string;
const tracks: Record<string, string> = {};
let shots = "";
beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ae-video-moves-"));
  for (const [name, region] of [["slide-ease", [296, 84, 48, 48]], ["slide-linear", [296, 84, 48, 48]]] as const) {
    const c = clips().find((x) => x.name === name)!, f = await writeClip(c, dir);
    if (!f) return;
    const r: any = await runTrack({ file: f, outDir: path.join(dir, name), region });
    tracks[name] = r.files.json;
    if (name === "slide-ease") shots = (await runShots({ file: f, outDir: path.join(dir, "shots"), pictures: false }) as any).files.json;
  }
}, 120_000);
afterAll(async () => { await fs.rm(dir, { recursive: true, force: true }); });

describe("video.moves", () => {
  it("the table, marked measured / inferred / untested, and a beat sheet with the events", async (ctx) => {
    if (!tracks["slide-ease"]) return ctx.skip();
    const r: any = await runMoves({ outDir: path.join(dir, "moves"), tracks: [{ path: tracks["slide-ease"], label: "slide" }], shots,
      inferred: [{ label: "pop", channel: "scale", reason: "too fast to track at this size" }], untested: [{ label: "glow", reason: "not a region" }] });
    expect(r.counts).toEqual({ measured: 1, inferred: 1, untested: 1 });
    expect(r.moves[0]).toMatchObject({ move: "slide", channel: "position", best: "ease" });
    const sheet = await fs.readFile(r.files.beatSheet, "utf8");
    expect(sheet).toMatch(/## Scene 1 — /);
    expect(sheet).toMatch(/slide \(position\) 260(\.\d+)?px over 2\d(\.\d+)? frames, ease/);
    const json = JSON.parse(await fs.readFile(r.files.json, "utf8"));
    expect(json.moves[0].apply.keys).toHaveLength(2);
  });
});

describe("motion.compare_moves", () => {
  it("a track against itself is within; an eased move built linear is outside, and says why", async (ctx) => {
    if (!tracks["slide-ease"]) return ctx.skip();
    const same: any = await runCompareMoves({ measured: tracks["slide-ease"], buildTrack: tracks["slide-ease"] });
    expect(same.within).toBe(true);
    const lin: any = await runCompareMoves({ measured: tracks["slide-ease"], buildTrack: tracks["slide-linear"] });
    expect(lin.within).toBe(false);
    expect(lin.reading).toMatch(/move 1 \(position\): (duration|ease out|ease in|built as linear)/);
    expect(lin.reading).toMatch(/outside tolerance|built as linear against a measured ease/);
  });
  it("a property read from After Effects, fitted the same way; and the note to compare the render too", async (ctx) => {
    if (!tracks["slide-ease"]) return ctx.skip();
    const frames = Array.from({ length: 60 }, (_, f) => ({ frame: f, time: f / 30, value: [60 + 260 * aeEase((f - 10) / 24, 0.33, 0.8), 108] }));
    const r: any = await runCompareMoves({ measured: tracks["slide-ease"], comp: "C", layer: "L", property: "Position" },
      async () => ({ ok: true, layer: "L", property: "Position", fps: 30, frames }));
    expect(r.within).toBe(true);
    expect(r.note).toMatch(/the picture is the one that counts/);
  });
  it("refuses without a build", async () => {
    expect((await runCompareMoves({ measured: [{ fits: {}, channel: "position" }] }) as any).error).toMatch(/buildTrack/);
  });
});

describe("registration", () => {
  it("the five operations are registered, read-only", () => {
    for (const n of ["video.shots", "video.census", "video.track", "video.moves", "motion.compare_moves"]) { const op = getOp(n); expect(op?.readOnly).toBe(true); }
    expect(getOp("motion.compare_moves")?.category).toBe("motion");
  });
});
