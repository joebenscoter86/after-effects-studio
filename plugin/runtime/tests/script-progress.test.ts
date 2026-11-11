// After Effects' own "Executing Script ..." progress window is not a dialog.
//
// Live, 2026-11-10 (stage7-live-check.md, After Effects 2027, macOS, no
// Accessibility trust): while a script runs for more than a moment, After
// Effects shows a CG window at layer 8, 363 x 181, named "Executing Script
// ...". Idle, the only on-screen window is layer 0, named after the project.
// The dialog scan took it for a modal (layer 8), a 6 s $.sleep with a 2 s
// timeout came back DIALOG_OPEN "(text unavailable)", and the hint offered
// instance.dismiss_dialog — whose only effect on that window is cancelling
// the running script.

import { promises as fs } from "node:fs";
import { EventEmitter } from "node:events";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BUSY_LOCK_PATH, REQUEST_PREFIX, RUNTIME_DIR } from "../src/config.js";
import { getOp } from "../src/registry.js";
import "../src/operations/index.js";
import {
  type AeDialog,
  DARWIN_SCRIPT,
  parseDialogScan,
  scanAeDialogs,
  scanAeWindows,
  setOsascriptRunner,
} from "../src/transport/dialogs.js";
import {
  FileIpcTransport,
  type LaunchedProcess,
  type SpawnFn,
} from "../src/transport/FileIpcTransport.js";

/** As measured: the progress window, its CG name readable. */
const PROGRESS = {
  pid: 812,
  id: "812:9001",
  text: "",
  width: 363,
  height: 181,
  window: "h2h4.aep",
  accessibility: false,
  title: "Executing Script ...",
  layer: 8,
};
/** The same window where the CG name could not be read. */
const PROGRESS_NAMELESS = { ...PROGRESS, id: "812:9002", title: "" };
/** A real warning at the same layer. */
const WARNING = {
  pid: 812,
  id: "812:4471",
  text: "",
  width: 492,
  height: 260,
  window: "h2h4.aep",
  accessibility: false,
  title: "",
  layer: 8,
};

let restores: Array<() => void> = [];
afterEach(() => {
  restores.forEach((r) => r());
  restores = [];
});
function scanReturns(entries: unknown[]): void {
  restores.push(setOsascriptRunner(async () => JSON.stringify(entries)));
}

describe("recognising the progress window", () => {
  it("by its window name", () => {
    const [d] = parseDialogScan(JSON.stringify([PROGRESS]));
    expect(d.scriptProgress).toBe("name");
  });

  it("falls back to layer 8 at 363 x 181 with no readable text when the name is unavailable", () => {
    const [d] = parseDialogScan(JSON.stringify([PROGRESS_NAMELESS]));
    expect(d.scriptProgress).toBe("size");
  });

  it("leaves a real dialog at the same layer alone", () => {
    const [d] = parseDialogScan(JSON.stringify([WARNING]));
    expect(d.scriptProgress).toBeUndefined();
  });

  it("does not take a 363 x 181 window with readable text for it", () => {
    const [d] = parseDialogScan(JSON.stringify([{ ...PROGRESS_NAMELESS, text: "Disk is full." }]));
    expect(d.scriptProgress).toBeUndefined();
  });

  it("asks the macOS scan for the window name and layer", () => {
    expect(DARWIN_SCRIPT).toContain("kCGWindowName");
    expect(DARWIN_SCRIPT).toMatch(/title:\s*d\.title/);
    expect(DARWIN_SCRIPT).toMatch(/layer:\s*d\.layer/);
  });

  it("is refused by the dismiss script itself, too", () => {
    expect(DARWIN_SCRIPT).toMatch(/script_progress/);
  });
});

describe("scans", () => {
  it("scanAeDialogs lists only real dialogs", async () => {
    scanReturns([PROGRESS, WARNING]);
    const dialogs = await scanAeDialogs("darwin");
    expect(dialogs.map((d) => d.id)).toEqual(["812:4471"]);
  });

  it("scanAeWindows keeps the progress window, marked", async () => {
    scanReturns([PROGRESS, WARNING]);
    const all = await scanAeWindows("darwin");
    expect(all.map((d) => [d.id, d.scriptProgress ?? null])).toEqual([
      ["812:9001", "name"],
      ["812:4471", null],
    ]);
  });
});

describe("instance.dialogs and instance.dismiss_dialog", () => {
  const darwinOnly = it.runIf(process.platform === "darwin" || process.platform === "win32");

  darwinOnly("instance.dialogs reports a running script, not a dialog", async () => {
    scanReturns([PROGRESS]);
    const r = (await getOp("instance.dialogs")!.run!({}, undefined as never)) as {
      dialogs: AeDialog[];
      scriptRunning: Array<{ pid: number; matchedBy: string }>;
      note?: string;
    };
    expect(r.dialogs).toEqual([]);
    expect(r.scriptRunning).toEqual([{ pid: 812, id: "812:9001", matchedBy: "name" }]);
    expect(r.note).toMatch(/script is still running/);
    expect(r.note).not.toMatch(/dismiss_dialog \{/);
  });

  darwinOnly("instance.dismiss_dialog refuses the progress window and sends nothing", async () => {
    const modes: string[] = [];
    restores.push(
      setOsascriptRunner(async (_s, env) => {
        modes.push(env.AE_MCP_DIALOG_MODE ?? "");
        return JSON.stringify([PROGRESS]);
      }),
    );
    const r = (await getOp("instance.dismiss_dialog")!.run!({ id: "812:9001" }, undefined as never)) as {
      ok: boolean;
      error: string;
    };
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Executing Script/);
    expect(r.error).toMatch(/cancel/);
    expect(modes).not.toContain("dismiss");
  });
});

// --- The transport -----------------------------------------------------------

class FakeChild extends EventEmitter implements LaunchedProcess {
  pid = 4244;
  stderr = null;
  kill(): void {
    this.emit("exit", null);
  }
  unref(): void {}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Consume our request (AE picked it up) and never answer: a slow script. */
function slowScript(label: string): SpawnFn {
  return () => {
    const child = new FakeChild();
    void (async () => {
      for (let i = 0; i < 40; i++) {
        await sleep(25);
        for (const name of await fs.readdir(RUNTIME_DIR).catch(() => [] as string[])) {
          if (!name.startsWith(REQUEST_PREFIX) || !name.endsWith(".json")) continue;
          const full = path.join(RUNTIME_DIR, name);
          try {
            const req = JSON.parse(await fs.readFile(full, "utf8")) as { label: string };
            if (req.label !== label) continue;
            await fs.unlink(full);
            return;
          } catch {
            /* not ours */
          }
        }
      }
    })();
    return child;
  };
}

describe("a timeout while the progress window is up", () => {
  const savedExe = process.env.AE_MCP_EXE;
  beforeEach(async () => {
    process.env.AE_MCP_EXE = "/usr/bin/true";
    await fs.mkdir(RUNTIME_DIR, { recursive: true });
  });
  afterEach(async () => {
    if (savedExe === undefined) delete process.env.AE_MCP_EXE;
    else process.env.AE_MCP_EXE = savedExe;
    await fs.unlink(BUSY_LOCK_PATH).catch(() => {});
  });

  it("says a script is still running, not that a dialog blocks it", async () => {
    const progress = parseDialogScan(JSON.stringify([PROGRESS]));
    const transport = new FileIpcTransport({
      instance: null,
      spawn: slowScript("sp_slow"),
      scanDialogs: async () => progress,
      reapIntervalMs: 60_000,
    });
    const res = await transport.execute({ code: "return 1;", label: "sp_slow", timeoutMs: 500 });
    await transport.close();

    expect(res.errorCode).toBe("TIMEOUT");
    expect(res.error).toMatch(/still running/);
    expect(res.error).toMatch(/Executing Script/);
    expect(res.error).not.toMatch(/dismiss_dialog/);
    expect(res.error).not.toMatch(/most likely cause is a modal dialog/);
    expect(res.dialogs ?? []).toEqual([]);
  });

  it("still reports a real dialog next to it", async () => {
    const both = parseDialogScan(JSON.stringify([PROGRESS, { ...WARNING, text: "Disk is full." }]));
    const transport = new FileIpcTransport({
      instance: null,
      spawn: slowScript("sp_both"),
      scanDialogs: async () => both,
      reapIntervalMs: 60_000,
    });
    const res = await transport.execute({ code: "return 1;", label: "sp_both", timeoutMs: 500 });
    await transport.close();

    expect(res.errorCode).toBe("DIALOG_OPEN");
    expect(res.dialogs?.map((d) => d.id)).toEqual(["812:4471"]);
    expect(res.error).toContain("Disk is full.");
    expect(res.error).not.toContain("812:9001");
  });
});
