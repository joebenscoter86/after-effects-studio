// Live check for stage 12b (proofing the one-click cut-out) on a real take
// with no green screen. Skipped unless AE_MCP_E2E=1 and the take is on disk.
//
// The take is the owner's own footage and is not in the repository. Its path
// is COMP_ROOM_NOGREEN_TAKE, or by default
// <home>/Assets/comp-room-tests/2026-11-11-pro-finish/nogreen/footage/raw_nogreen.mp4.
// The take is only read (imported into a disposable project); nothing is
// written next to it. Renders and the gap still go to E2E_SCRATCH_DIR.
//
// SESSION-MUTATING: swaps the open project for a disposable one and restores
// it afterwards.
//
// What runs without a person: subject.prepare on the take (all six steps, the
// seven user steps for "yourself"), subject.status before the click, and
// subject.check refusing before the click. The click itself needs a person:
// with AE_MCP_SUBJECT_CLICK_WAIT_S set (seconds), the suite waits that long
// for a selection, then runs subject.check and, when it finds a hole,
// subject.fill_gaps, and prints both results; and checks that a frame given
// no time to settle comes back not checked, with stop true. The order of the
// tests matters: the click test runs last.

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import "../../src/operations/index.js";
import { doTool } from "../../src/tools/do.js";
import type { FileIpcTransport } from "../../src/transport/FileIpcTransport.js";
import type { SavedProjectState } from "./harness.js";
import {
  backupAndOpenTestProject,
  E2E_SCRATCH_DIR,
  printSkipBanner,
  probeAe,
  restoreUserProject,
} from "./harness.js";

const E2E_ENABLED = process.env.AE_MCP_E2E === "1";
const TAKE =
  process.env.COMP_ROOM_NOGREEN_TAKE ??
  path.join(
    os.homedir(),
    "Assets",
    "comp-room-tests",
    "2026-11-11-pro-finish",
    "nogreen",
    "footage",
    "raw_nogreen.mp4",
  );
const WAIT_S = Number(process.env.AE_MCP_SUBJECT_CLICK_WAIT_S ?? "0");
const OUT = path.join(E2E_SCRATCH_DIR, "subject-cutout");

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function op(
  transport: FileIpcTransport,
  operation: string,
  args: Record<string, unknown>,
): Promise<Any> {
  const res = (await doTool.handler(
    { operation, args, timeoutMs: 300_000 } as never,
    transport,
  )) as Any;
  const sc = res.structuredContent;
  return res.isError
    ? { ok: false, error: sc?.error?.message, details: sc?.error?.details }
    : sc.result;
}

let ready = false;
let transport: FileIpcTransport | null = null;
let saved: SavedProjectState | null = null;

describe("e2e subject cut-out on the no-green-screen take", () => {
  beforeAll(async () => {
    if (!E2E_ENABLED) {
      printSkipBanner("subject-cutout", "SKIPPING — AE_MCP_E2E not set");
      return;
    }
    try {
      await fs.access(TAKE);
    } catch {
      printSkipBanner("subject-cutout", "SKIPPING — the take is not on this machine", [
        " Set COMP_ROOM_NOGREEN_TAKE to the no-green-screen take to run it.",
      ]);
      return;
    }
    const probe = await probeAe("subject-cutout");
    if (!probe.ready || !probe.transport) return;
    transport = probe.transport;
    saved = await backupAndOpenTestProject(transport);
    await fs.mkdir(OUT, { recursive: true });
    const res = await transport.execute({
      code: `
        var f = new File(${JSON.stringify(TAKE)});
        var item = app.project.importFile(new ImportOptions(f));
        var comp = app.project.items.addComp("cutout_e2e", 1080, 1920, 1, item.duration, item.frameRate || 30);
        var layer = comp.layers.add(item);
        layer.property("ADBE Transform Group").property("ADBE Scale").setValue([50, 50]);
        return { ok: true, layer: layer.name, size: [item.width, item.height], duration: item.duration };
      `,
      label: "subject_cutout_fixture",
      timeoutMs: 120_000,
    });
    if (!res.ok) throw new Error("fixture setup failed: " + res.error);
    ready = true;
  }, 180_000);

  afterAll(async () => {
    if (transport && saved) await restoreUserProject(transport, saved);
  });

  it("subject.prepare opens the take for the click and sets the viewer to Full", async (ctx) => {
    if (!ready || !transport) return ctx.skip();
    const res = await op(transport, "subject.prepare", {
      comp: "cutout_e2e",
      layer: 1,
      time: 0.5,
      subject: "yourself",
    });
    expect(res.couldNotDo, JSON.stringify(res.couldNotDo)).toEqual([]);
    expect(res.did).toHaveLength(6);
    expect(res.viewerResolution.commandId).toBeTypeOf("number");
    expect(res.steps).toHaveLength(7);
    expect(res.steps[4]).toBe(
      "Move the pointer over yourself in the Layer panel. You tint magenta. Click once.",
    );
  });

  it("before the click, subject.status says nobody has clicked and subject.check refuses", async (ctx) => {
    if (!ready || !transport || WAIT_S > 0) return ctx.skip();
    const st = await op(transport, "subject.status", { comp: "cutout_e2e", layer: 1 });
    expect(st.summary).toMatch(/has not clicked/);
    const check = await op(transport, "subject.check", {
      comp: "cutout_e2e",
      layer: 1,
      outDir: OUT,
    });
    expect(check.ok).toBe(false);
    expect(check.error).toMatch(/has not clicked/);
  });

  it(
    "after a person clicks: subject.check renders the cut-out across the clip and reports holes; subject.fill_gaps fills the gaps",
    async (ctx) => {
      if (!ready || !transport || !(WAIT_S > 0)) return ctx.skip();
      const until = Date.now() + WAIT_S * 1000;
      let st: Any = null;
      while (Date.now() < until) {
        st = await op(transport, "subject.status", { comp: "cutout_e2e", layer: 1 });
        if (st?.selections?.length) break;
        await new Promise((r) => setTimeout(r, 3000));
      }
      expect(st?.selections?.length, "nobody clicked within the wait").toBeGreaterThan(0);
      console.log(
        "subject.status:",
        JSON.stringify(
          { summary: st.summary, selections: st.selections, closeClicks: st.closeClicks },
          null,
          2,
        ),
      );
      const check = await op(transport, "subject.check", {
        comp: "cutout_e2e",
        layer: 1,
        outDir: OUT,
        clickFrame: 15,
      });
      console.log(
        "subject.check:",
        JSON.stringify(
          {
            stop: check.stop,
            findings: check.findings,
            inOut: check.inOut,
            picture: check.picture,
          },
          null,
          2,
        ),
      );
      expect(check.ok).toBe(true);
      expect(check.frames.length).toBeGreaterThanOrEqual(8);
      await fs.access(check.picture);
      if (check.findings.some((f: Any) => f.kind === "hole")) {
        const fill = await op(transport, "subject.fill_gaps", {
          comp: "cutout_e2e",
          layer: 1,
          frame: 15,
          stillPath: path.join(OUT, "gap-mask.png"),
          outDir: OUT,
        });
        console.log(
          "subject.fill_gaps:",
          JSON.stringify(
            {
              filled: fill.filled,
              after: fill.after?.reading,
              layers: fill.layers,
              limits: fill.limits,
            },
            null,
            2,
          ),
        );
        expect(fill.ok).toBe(true);
      }
    },
    Math.max(60, WAIT_S + 600) * 1000,
  );
  it("a frame that does not finish rendering is not checked, and the check stops", async (ctx) => {
    // Runs after the click test, which waits for the person's click.
    if (!ready || !transport || !(WAIT_S > 0)) return ctx.skip();
    const st = await op(transport, "subject.status", { comp: "cutout_e2e", layer: 1 });
    if (!st?.selections?.length) return ctx.skip();
    // A frame far from the click, not rendered yet, with 1 ms to settle: it cannot finish in time.
    const res = await op(transport, "subject.check", {
      comp: "cutout_e2e",
      layer: 1,
      outDir: OUT,
      frames: [st.span.outFrame - 1],
      secondsPerFrame: 0.001,
    });
    console.log(
      "subject.check with no time to settle:",
      JSON.stringify({ stop: res.stop, checked: res.checked, findings: res.findings }, null, 2),
    );
    expect(res.stop).toBe(true);
    expect(res.checked.frames).toBe(0);
    expect(res.findings.some((f: Any) => f.kind === "not-checked")).toBe(true);
  });
});
