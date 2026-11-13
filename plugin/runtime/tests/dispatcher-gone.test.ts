// A queued script call must not raise a modal when its script file is gone.
//
// First production use, 2026-11-12: After Effects showed "Unable to execute
// script at line 1. File or folder does not exist" (one OK button), which
// blocks every script until someone clicks it. A push call's DoScript can sit
// queued in After Effects (behind a running script or a modal) long after the
// call gave up; it then ran the bootstrap's line 1, an evalFile of the
// dispatcher, after the dispatcher's folder had gone. Now the bootstrap runs
// the dispatcher only when it is there, and the transport sends nothing when
// it is not.
//
// The bootstrap is run here as JavaScript against a fake `$` and `File`; the
// transport's launcher is a fake. Nothing reaches After Effects.

import { promises as fs } from "node:fs";
import { EventEmitter } from "node:events";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BUSY_LOCK_PATH, REQUEST_PREFIX, RUNTIME_DIR } from "../src/config.js";
import {
  FileIpcTransport,
  type LaunchedProcess,
  type SpawnFn,
} from "../src/transport/FileIpcTransport.js";
import { buildLaunchPlan } from "../src/transport/launcher.js";

/** The ExtendScript the DoScript carries, from the osascript arguments. */
function bootstrapOf(args: string[]): string {
  const tell = args.find((a) => a.startsWith("tell application"))!;
  const m = /DoScript "(.*)"$/.exec(tell)!;
  return m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

/**
 * Run the bootstrap with a fake $ and File whose files exist when `exists`
 * says so; `evalThrows` makes the evalFile itself throw, as After Effects
 * does when the file (or one of its #includes) is gone.
 */
function runBootstrap(
  code: string,
  exists: (p: string) => boolean,
  evalThrows = false,
): { evaluated: string[]; global: Record<string, unknown>; logged: string[] } {
  const evaluated: string[] = [];
  const logged: string[] = [];
  const global: Record<string, unknown> = {};
  const $ = {
    global,
    evalFile(p: string) {
      if (evalThrows || !exists(p)) throw new Error("File or folder does not exist");
      evaluated.push(p);
    },
  };
  class File {
    constructor(public path: string) {}
    get exists() {
      return exists(this.path);
    }
    open() {
      return true;
    }
    writeln(line: string) {
      logged.push(`${this.path}: ${line}`);
    }
    close() {}
  }
  new Function("$", "File", code)($, File);
  return { evaluated, global, logged };
}

describe("the macOS bootstrap runs the dispatcher only when it is there", () => {
  const DISPATCHER = "/plugins/after-effects-studio/runtime/jsx/dispatcher.jsx";
  const plan = buildLaunchPlan(
    "/Applications/Adobe After Effects 2027/Adobe After Effects 2027.app",
    "darwin",
    "/tmp/rt",
    DISPATCHER,
  );
  const code = bootstrapOf(plan.args);

  it("evalFiles the dispatcher when it exists", () => {
    const r = runBootstrap(code, () => true);
    expect(r.evaluated).toEqual([DISPATCHER]);
    expect(r.global.AE_MCP_RUNTIME_DIR_OVERRIDE).toBe("/tmp/rt");
  });

  it("does nothing, and throws nothing, when a queued run arrives after the dispatcher's folder has gone", () => {
    const r = runBootstrap(code, () => false);
    expect(r.evaluated).toEqual([]);
  });

  it("lets nothing out into a dialog when the evalFile itself throws 'File or folder does not exist', and logs it in the mailbox", () => {
    let r!: ReturnType<typeof runBootstrap>;
    expect(() => (r = runBootstrap(code, () => true, true))).not.toThrow();
    expect(r.evaluated).toEqual([]);
    expect(r.logged).toHaveLength(1);
    expect(r.logged[0]).toMatch(
      /^\/tmp\/rt\/dispatcher\.log: \[.*\] bootstrap: Error: File or folder does not exist$/,
    );
  });
});

class FakeChild extends EventEmitter implements LaunchedProcess {
  pid = 4321;
  stderr = null;
  kill(): void {
    this.emit("exit", null);
  }
  unref(): void {}
}

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

describe("the push path with its dispatcher gone", () => {
  it("writes no request and launches nothing, and says to restart the server", async () => {
    const label = `dispatcher_gone_${process.pid}`;
    let launched = 0;
    // Were anything written, take it straight back out of the shared mailbox.
    const spawn: SpawnFn = () => {
      launched++;
      void (async () => {
        for (const name of await fs.readdir(RUNTIME_DIR).catch(() => [] as string[])) {
          if (!name.startsWith(REQUEST_PREFIX)) continue;
          const full = path.join(RUNTIME_DIR, name);
          const body = await fs.readFile(full, "utf8").catch(() => "");
          if (body.includes(label)) await fs.unlink(full).catch(() => {});
        }
      })();
      return new FakeChild();
    };
    const transport = new FileIpcTransport({
      instance: null,
      spawn,
      scanDialogs: async () => [],
      reapIntervalMs: 60_000,
      dispatcherJsx: path.join(RUNTIME_DIR, "no-such-folder", "dispatcher.jsx"),
    });
    const res = await transport.execute({ code: "return 1;", label, timeoutMs: 400 });
    expect(res.ok).toBe(false);
    expect(res.errorCode).toBe("TRANSPORT");
    expect(res.error).toMatch(
      /dispatcher script .* is not there.*nothing was sent to After Effects/,
    );
    expect(launched).toBe(0);
    const left = [];
    for (const name of await fs.readdir(RUNTIME_DIR)) {
      if (!name.startsWith(REQUEST_PREFIX)) continue;
      const body = await fs.readFile(path.join(RUNTIME_DIR, name), "utf8").catch(() => "");
      if (body.includes(label)) left.push(name);
    }
    expect(left).toEqual([]);
  });
});
