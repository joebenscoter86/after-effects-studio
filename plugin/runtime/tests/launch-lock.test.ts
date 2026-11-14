// The macOS launch rules, with fake launchers and no After Effects:
//   - a launcher (osascript) still alive with the request unconsumed means
//     After Effects has the DoScript and has not started it: never launch
//     again, and say so at the deadline in plain words;
//   - one that exited with the request unconsumed is After Effects' refusal:
//     launch again, as before;
//   - one launch at a time per user and per After Effects, across server
//     processes with different TMPDIRs (the launch lock).
// Live, 2026-11-14: a relaunch 3 s after a DoScript that was still waiting
// raised After Effects' "second script" warning.

import { execFileSync, spawn as nodeSpawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DISPATCHER_JSX, LAUNCH_LOCK_STALE_MS, REQUEST_PREFIX, RUNTIME_DIR } from "../src/config.js";
import type { AeDialog } from "../src/transport/dialogs.js";
import { parseDialogScan, setOsascriptRunner, setPowerShellRunner } from "../src/transport/dialogs.js";
import { FileIpcTransport, type LaunchedProcess, type SpawnFn } from "../src/transport/FileIpcTransport.js";
import { LaunchLock, type LaunchLockRecord, launchLockPath } from "../src/transport/launch-lock.js";

const AE = "/usr/bin/true"; // resolveAfterFxPath only stats it; every launcher here is fake
const savedExe = process.env.AE_MCP_EXE;

let restoreRunners: Array<() => void> = [];
beforeAll(() => {
  restoreRunners = [setPowerShellRunner(async () => "[]"), setOsascriptRunner(async () => "[]")];
});
afterAll(() => restoreRunners.forEach((restore) => restore()));

let lockDir = "";
beforeEach(async () => {
  process.env.AE_MCP_EXE = AE;
  lockDir = await fs.mkdtemp(path.join(os.tmpdir(), "launch-lock-"));
});
afterEach(async () => {
  if (savedExe === undefined) delete process.env.AE_MCP_EXE;
  else process.env.AE_MCP_EXE = savedExe;
  for (const child of live.splice(0)) child.exit(0);
  await fs.rm(lockDir, { recursive: true, force: true });
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A launcher that stays alive until told to exit: osascript waiting on its DoScript. */
class FakeLauncher extends EventEmitter implements LaunchedProcess {
  static next = 990_000; // above macOS's pid range: never a real process
  pid = FakeLauncher.next++;
  stderr = null;
  exited = false;
  exit(code: number | null): void {
    if (this.exited) return;
    this.exited = true;
    this.emit("exit", code);
  }
  kill(): void {
    this.exit(null);
  }
  unref(): void {}
}

const live: FakeLauncher[] = [];

/** Spawns launchers that never touch the request; `exitAfterMs` null keeps them alive. */
function launcher(exitAfterMs: number | null): { spawn: SpawnFn; launches: FakeLauncher[] } {
  const launches: FakeLauncher[] = [];
  const spawn: SpawnFn = () => {
    const child = new FakeLauncher();
    launches.push(child);
    live.push(child);
    if (exitAfterMs !== null) setTimeout(() => child.exit(0), exitAfterMs);
    return child;
  };
  return { spawn, launches };
}

function macTransport(spawn: SpawnFn, dialogs: AeDialog[] = []): FileIpcTransport {
  return new FileIpcTransport({
    instance: null,
    platform: "darwin",
    launchLockDir: lockDir,
    spawn,
    scanDialogs: async () => dialogs,
    reapIntervalMs: 60_000,
  });
}

const WAITING = /a launch has been waiting in After Effects since \d\d:\d\d:\d\d \(\d+ s ago, sent by this call\), and nothing new was launched/;
const BEHIND_ANOTHER =
  /a script has been running or waiting in After Effects since \d\d:\d\d:\d\d \(\d+ s ago, sent by another call\), and nothing new was launched/;

/** Do what dispatcher.jsx does first: take the request labelled `label` out of `dir`. Returns its id. */
async function consume(dir: string, label: string): Promise<string> {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    for (const name of await fs.readdir(dir).catch(() => [] as string[])) {
      if (!name.startsWith(REQUEST_PREFIX) || !name.endsWith(".json")) continue;
      try {
        const body = JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) as { id: string; label: string };
        if (body.label !== label) continue;
        await fs.unlink(path.join(dir, name));
        return body.id;
      } catch {
        /* torn read */
      }
    }
    await sleep(25);
  }
  throw new Error(`no request labelled ${label} in ${dir}`);
}

/** The script's answer, written the way serve.jsx writes it. */
async function answer(dir: string, id: string): Promise<void> {
  const body = JSON.stringify({ id, ok: true, phase: "execute", result: 1, error: null, stack: null, logs: [] });
  await fs.writeFile(path.join(dir, `.response-${id}.json.tmp`), body, "utf8");
  await fs.rename(path.join(dir, `.response-${id}.json.tmp`), path.join(dir, `response-${id}.json`));
}

describe("macOS: a launcher still alive", () => {
  it("is not relaunched past 2.5 s, and the deadline says why in plain words", async () => {
    const { spawn, launches } = launcher(null);
    const transport = macTransport(spawn);
    const res = await transport.execute({ code: "return 1;", label: "ll_alive", timeoutMs: 3_500 });
    await transport.close();

    expect(launches).toHaveLength(1); // before: a second launch at 2.5 s
    expect(res.errorCode).toBe("TIMEOUT");
    expect(res.error).toMatch(WAITING);
    expect(res.error).toMatch(/sent by this call/);
    expect(res.error).toMatch(/After Effects is probably showing a dialog or is busy with another script/);
    expect(res.error).toMatch(/never picked up and has been discarded/);
    expect(res.error).toMatch(/Do not quit or force-quit After Effects/); // the hint rides on the error
  });

  it("holds the lock past its call, so a later call launches nothing and says the same; its exit lets the next one launch", async () => {
    const { spawn, launches } = launcher(null);
    const transport = macTransport(spawn);
    await transport.execute({ code: "return 1;", label: "ll_first", timeoutMs: 600 });
    expect(launches).toHaveLength(1);

    const later = await transport.execute({ code: "return 1;", label: "ll_later", timeoutMs: 800 });
    expect(launches).toHaveLength(1);
    expect(later.errorCode).toBe("TIMEOUT");
    expect(later.error).toMatch(BEHIND_ANOTHER);

    launches[0].exit(0); // the waiting DoScript finally ran, or gave up
    await sleep(50);
    await transport.execute({ code: "return 1;", label: "ll_after", timeoutMs: 300 });
    await transport.close();
    expect(launches).toHaveLength(2);
  });

  it("says the same next to a dialog it finds while waiting, still without launching", async () => {
    const dialogs = parseDialogScan(
      JSON.stringify([{ pid: 812, id: "812:4471", text: "Disk is full.", width: 492, height: 260, window: "a.aep", accessibility: true, title: "", layer: 8 }]),
    );
    const { spawn, launches } = launcher(null);
    const transport = macTransport(spawn, dialogs);
    const res = await transport.execute({ code: "return 1;", label: "ll_dialog", timeoutMs: 10_000 });
    await transport.close();

    expect(launches).toHaveLength(1);
    expect(res.errorCode).toBe("DIALOG_OPEN");
    expect(res.error).toMatch(WAITING);
    expect(res.error).toContain("Disk is full.");
    expect(res.durationMs ?? 0).toBeLessThan(5_000); // at the first look, 2.5 s in
  });

  it("stays held while the launcher runs the consumed request: a server with another TMPDIR launches nothing until it exits", async () => {
    const first = launcher(null);
    const lock = new LaunchLock(launchLockPath(lockDir, AE));
    const a = macTransport(first.spawn);
    const running = a.execute({ code: "return 1;", label: "ll_running", timeoutMs: 20_000 });
    const id = await consume(RUNTIME_DIR, "ll_running"); // After Effects starts on it: the script runs
    await sleep(2_700); // past the consumption check, 2.5 s after the launch
    expect(await lock.read()).not.toBeNull();

    // A second server: the same modules loaded again under another TMPDIR,
    // so its mailbox and busy lock are its own and only the launch lock is shared.
    const otherTmp = await fs.mkdtemp(path.join(os.tmpdir(), "launch-lock-other-"));
    const saved = { TMPDIR: process.env.TMPDIR, TMP: process.env.TMP, TEMP: process.env.TEMP };
    let other: typeof import("../src/transport/FileIpcTransport.js");
    let otherRuntime: string;
    try {
      process.env.TMPDIR = process.env.TMP = process.env.TEMP = otherTmp;
      vi.resetModules();
      other = await import("../src/transport/FileIpcTransport.js");
      otherRuntime = (await import("../src/config.js")).RUNTIME_DIR;
    } finally {
      for (const [name, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
    expect(otherRuntime.startsWith(otherTmp)).toBe(true);
    const second = launcher(null);
    const b = new other.FileIpcTransport({
      instance: null,
      platform: "darwin",
      launchLockDir: lockDir,
      spawn: second.spawn,
      scanDialogs: async () => [],
      reapIntervalMs: 60_000,
    });
    try {
      const blocked = await b.execute({ code: "return 1;", label: "ll_other", timeoutMs: 1_000 });
      expect(second.launches).toHaveLength(0);
      expect(blocked.errorCode).toBe("TIMEOUT");
      expect(blocked.error).toMatch(BEHIND_ANOTHER);
      expect(blocked.error).toMatch(/a long one, such as a render, makes every other call wait/);
      expect(blocked.error).toMatch(/Retry when that script has ended/);

      // The script ends: its answer arrives, then its osascript exits.
      await answer(RUNTIME_DIR, id);
      expect((await running).ok).toBe(true);
      expect(await lock.read()).not.toBeNull(); // the launcher still lives
      first.launches[0].exit(0);
      await sleep(50);
      expect(await lock.read()).toBeNull();
      await b.execute({ code: "return 1;", label: "ll_other_after", timeoutMs: 300 });
      expect(second.launches).toHaveLength(1);
    } finally {
      await a.close();
      await b.close();
      await fs.rm(otherTmp, { recursive: true, force: true });
    }
  });
});

describe("macOS: a launcher that exited with the request unconsumed", () => {
  it("is relaunched, as before", async () => {
    const { spawn, launches } = launcher(100);
    const transport = macTransport(spawn);
    const res = await transport.execute({ code: "return 1;", label: "ll_exited", timeoutMs: 3_500 });
    await transport.close();

    expect(launches).toHaveLength(2);
    expect(res.errorCode).toBe("TIMEOUT");
    expect(res.error).toMatch(/after 2 launch attempts/);
    expect(res.error).not.toMatch(/nothing new was launched/);
  });
});

describe("the launch lock across processes", () => {
  /** The pid of a process that has exited and been reaped: certainly dead. */
  const exitedPid = async (): Promise<number> => {
    const child = nodeSpawn("/usr/bin/true", [], { stdio: "ignore" });
    await new Promise((resolve) => child.on("exit", resolve));
    return child.pid as number;
  };

  async function writeLock(record: Partial<LaunchLockRecord>): Promise<string> {
    const file = launchLockPath(lockDir, AE);
    const full: LaunchLockRecord = {
      token: "foreign",
      serverPid: await exitedPid(),
      launcherPid: null,
      requestId: "someone-else",
      launchedAt: new Date().toISOString(),
      ...record,
    };
    await fs.writeFile(file, JSON.stringify(full), "utf8");
    return file;
  }

  it("is one file per user and per After Effects: the bundle and the binary inside it share it", () => {
    const bundle = "/Applications/Adobe After Effects 2027/Adobe After Effects 2027.app";
    expect(launchLockPath(lockDir, `${bundle}/Contents/MacOS/After Effects`)).toBe(launchLockPath(lockDir, bundle));
    expect(launchLockPath(lockDir, bundle)).not.toBe(
      launchLockPath(lockDir, "/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app"),
    );
  });

  it("is broken at once when its launcher is dead", async () => {
    await writeLock({ launcherPid: await exitedPid() });
    const { spawn, launches } = launcher(null);
    const transport = macTransport(spawn);
    await transport.execute({ code: "return 1;", label: "ll_dead", timeoutMs: 400 });
    await transport.close();
    expect(launches).toHaveLength(1);
  });

  it("is waited on while another process's launcher lives, and broken once it is older than the stated time", async () => {
    const other = nodeSpawn("/bin/sleep", ["30"], { stdio: "ignore" });
    try {
      await writeLock({ serverPid: other.pid as number, launcherPid: other.pid as number });
      const { spawn, launches } = launcher(null);
      const transport = macTransport(spawn);
      const res = await transport.execute({ code: "return 1;", label: "ll_foreign", timeoutMs: 600 });
      expect(launches).toHaveLength(0);
      expect(res.error).toMatch(BEHIND_ANOTHER);

      const old = new Date(Date.now() - LAUNCH_LOCK_STALE_MS - 60_000).toISOString();
      await writeLock({ serverPid: other.pid as number, launcherPid: other.pid as number, launchedAt: old });
      await transport.execute({ code: "return 1;", label: "ll_stale", timeoutMs: 400 });
      await transport.close();
      expect(launches).toHaveLength(1);
    } finally {
      other.kill();
    }
  });

  it("serialises two servers with different TMPDIRs: no two launchers alive at once", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "launch-lock-procs-"));
    // Inside the package, so the bundle finds package.json (and jsx/) above it.
    const cache = path.join(process.cwd(), "node_modules", ".cache", "launch-lock-test");
    try {
      await fs.mkdir(cache, { recursive: true });
      const bundle = path.join(cache, "child.mjs");
      execFileSync(
        path.join(process.cwd(), "node_modules", ".bin", "esbuild"),
        [path.join("tests", "fixtures", "launch-lock-child.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${bundle}`, "--log-level=error"],
        { stdio: "inherit" },
      );

      const run = async (shared: boolean) => {
        const log = path.join(root, `launches-${shared ? "shared" : "apart"}.jsonl`);
        const results = await Promise.all(
          ["a", "b"].map(async (who) => {
            const tmp = path.join(root, `tmp-${who}-${shared ? "s" : "x"}`);
            await fs.mkdir(tmp, { recursive: true });
            const child = nodeSpawn(process.execPath, [bundle], {
              env: {
                ...process.env,
                TMPDIR: tmp,
                TMP: tmp,
                TEMP: tmp,
                AE_MCP_EXE: AE,
                LAUNCH_LOG: log,
                LAUNCH_WHO: who,
                LAUNCH_LOCK_DIR: shared ? path.join(root, "locks") : path.join(tmp, "locks"),
                LAUNCH_SLEEP_S: "1.2",
                LAUNCH_TIMEOUT_MS: "5000",
                LAUNCH_DISPATCHER: DISPATCHER_JSX,
              },
              stdio: ["ignore", "pipe", "inherit"],
            });
            let out = "";
            child.stdout.setEncoding("utf8").on("data", (chunk: string) => (out += chunk));
            await new Promise<void>((resolve) => child.on("exit", () => resolve()));
            return JSON.parse(out.trim()) as { errorCode: string };
          }),
        );
        const events = (await fs.readFile(log, "utf8"))
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line) as { who: string; event: string; pid: number; t: number });
        const spans = events
          .filter((e) => e.event === "spawn")
          .map((s) => ({
            who: s.who,
            from: s.t,
            to: events.find((e) => e.event === "exit" && e.pid === s.pid)?.t ?? Number.POSITIVE_INFINITY,
          }))
          .sort((x, y) => x.from - y.from);
        // Sorted by start, launches are apart when each starts after every earlier one ended.
        let overlaps = 0;
        let lastEnd = Number.NEGATIVE_INFINITY;
        for (const span of spans) {
          if (span.from < lastEnd) overlaps++;
          lastEnd = Math.max(lastEnd, span.to);
        }
        return { results, spans, overlaps };
      };

      const shared = await run(true);
      expect(shared.results.map((r) => r.errorCode)).toEqual(["TIMEOUT", "TIMEOUT"]);
      expect(new Set(shared.spans.map((s) => s.who))).toEqual(new Set(["a", "b"]));
      expect(shared.overlaps).toBe(0);

      // The control: the same two servers with a lock each launch at the same moment.
      const apart = await run(false);
      expect(apart.overlaps).toBeGreaterThan(0);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
      await fs.rm(cache, { recursive: true, force: true });
    }
  }, 30_000);
});

describe("Windows", () => {
  it("takes no launch lock: it behaves as it did", async () => {
    const { spawn, launches } = launcher(50);
    const transport = new FileIpcTransport({
      instance: null,
      platform: "win32",
      launchLockDir: lockDir,
      spawn,
      scanDialogs: async () => [],
      reapIntervalMs: 60_000,
    });
    const pending = transport.execute({ code: "return 1;", label: "ll_windows", timeoutMs: 500 });
    await sleep(200);
    expect(await fs.readdir(lockDir)).toEqual([]);
    await pending;
    await transport.close();
    expect(launches).toHaveLength(1);
  });
});
