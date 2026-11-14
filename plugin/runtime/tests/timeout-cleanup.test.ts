// What a request that timed out AFTER After Effects picked it up leaves
// behind, and who cleans it up.
//
// Live, 2026-11-10 (side-session note undo-hazard-live-finding.md): an undo
// raised an After Effects error box mid-script. The call timed out after 60 s
// "WAS picked up by AE"; instance.dialogs saw nothing; the push path's
// dispatcher-busy.lock was left behind and went stale; and once the box was
// dismissed a zero-byte `.response-<id>.json.tmp` from that request stayed in
// the runtime folder.
//
// The launcher is injected: a fake child that consumes our request (as
// serve.jsx does, consume-on-read) and then answers late, never, or with an
// empty tmp file. No After Effects, osascript or AfterFX.exe is involved.

import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BUSY_LOCK_PATH,
  HEARTBEAT_FILENAME,
  REQUEST_PREFIX,
  RUNTIME_DIR,
  instanceDirFor,
  responsePathFor,
} from "../src/config.js";
import {
  FileIpcTransport,
  type LaunchedProcess,
  type SpawnFn,
} from "../src/transport/FileIpcTransport.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const noDialogs = async () => [];
const savedExe = process.env.AE_MCP_EXE;

class FakeChild extends EventEmitter implements LaunchedProcess {
  pid = 4243;
  stderr = null;
  kill(): void {
    this.emit("exit", null);
  }
  unref(): void {}
}

/** Ids of the requests the fake consumed, in order. */
let consumed: string[];

/**
 * A launcher whose "After Effects" consumes the request labelled `label` and
 * then does `answer(id, dir)` and exits, as osascript does when its DoScript
 * returns — or, with no answer, stays alive: the script still running.
 */
function consumingSpawn(
  label: string,
  dir: string,
  answer: ((id: string) => Promise<void>) | null,
): SpawnFn {
  return () => {
    const child = new FakeChild();
    void (async () => {
      for (let tries = 0; tries < 40; tries++) {
        await sleep(25);
        for (const name of await fs.readdir(dir).catch(() => [] as string[])) {
          if (!name.startsWith(REQUEST_PREFIX) || !name.endsWith(".json")) continue;
          const full = path.join(dir, name);
          try {
            const req = JSON.parse(await fs.readFile(full, "utf8")) as { id: string; label: string };
            if (req.label !== label) continue;
            await fs.unlink(full);
            consumed.push(req.id);
            if (answer) {
              await answer(req.id);
              child.emit("exit", 0);
            }
            return;
          } catch {
            /* torn read or someone else's mail */
          }
        }
      }
    })();
    return child;
  };
}

async function writeResponse(dir: string, id: string, result: unknown): Promise<void> {
  const body = JSON.stringify({ id, ok: true, phase: "execute", result, error: null, stack: null, logs: [] });
  const tmp = path.join(dir, `.response-${id}.json.tmp`);
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, path.join(dir, `response-${id}.json`));
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function lockId(): Promise<string | null> {
  try {
    return (JSON.parse(await fs.readFile(BUSY_LOCK_PATH, "utf8")) as { id?: string }).id ?? null;
  } catch {
    return null;
  }
}

function tmpPathFor(dir: string, id: string): string {
  return path.join(dir, `.response-${id}.json.tmp`);
}

async function ago(p: string, ms: number): Promise<void> {
  const t = new Date(Date.now() - ms);
  await fs.utimes(p, t, t);
}

beforeEach(async () => {
  consumed = [];
  process.env.AE_MCP_EXE = "/usr/bin/true";
  await fs.mkdir(RUNTIME_DIR, { recursive: true });
});

afterEach(async () => {
  if (savedExe === undefined) delete process.env.AE_MCP_EXE;
  else process.env.AE_MCP_EXE = savedExe;
  await fs.unlink(BUSY_LOCK_PATH).catch(() => {});
});

describe("a push request that times out after pickup", () => {
  it("names a modal dialog as the likely cause, and says instance.dialogs may not see it", async () => {
    const transport = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_message", RUNTIME_DIR, null),
      scanDialogs: noDialogs,
      reapIntervalMs: 60_000,
    });
    const res = await transport.execute({ code: "return 1;", label: "tc_message", timeoutMs: 600 });

    expect(res.errorCode).toBe("TIMEOUT");
    expect(res.error).toContain("WAS picked up");
    expect(res.error).toMatch(/modal dialog/);
    expect(res.error).toMatch(/instance\.dialogs may not (list|see) it/);
    await transport.close();
  });

  it("keeps the busy lock while the script may still run, then releases it and removes the response when it arrives", async () => {
    const transport = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_late", RUNTIME_DIR, null),
      scanDialogs: noDialogs,
      reapIntervalMs: 50,
    });
    const res = await transport.execute({ code: "return 1;", label: "tc_late", timeoutMs: 500 });
    expect(res.errorCode).toBe("TIMEOUT");
    const id = consumed[0];
    expect(await lockId()).toBe(id);

    // The dialog is dismissed and the script finishes: its response lands.
    await writeResponse(RUNTIME_DIR, id, { late: true });
    await sleep(400);

    expect(await exists(responsePathFor(id))).toBe(false);
    expect(await exists(tmpPathFor(RUNTIME_DIR, id))).toBe(false);
    expect(await lockId()).toBeNull();
    await transport.close();
  });

  it("lets the next request clean up an empty tmp response and the lock, instead of waiting on them", async () => {
    const first = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_empty", RUNTIME_DIR, async (id) => {
        // What was left live: a zero-byte tmp and no response.
        await fs.writeFile(tmpPathFor(RUNTIME_DIR, id), "", "utf8");
      }),
      scanDialogs: noDialogs,
      reapIntervalMs: 60_000, // the background reaper is not what this tests
      emptyTmpGraceMs: 200,
    });
    const res = await first.execute({ code: "return 1;", label: "tc_empty", timeoutMs: 500 });
    expect(res.errorCode).toBe("TIMEOUT");
    const stuck = consumed[0];
    expect(await lockId()).toBe(stuck);
    await ago(tmpPathFor(RUNTIME_DIR, stuck), 1_000);

    // The next request — from this server or another one sharing the mailbox.
    const second = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_next", RUNTIME_DIR, async (id) => writeResponse(RUNTIME_DIR, id, 42)),
      scanDialogs: noDialogs,
      reapIntervalMs: 60_000,
      emptyTmpGraceMs: 200,
    });
    const started = Date.now();
    const next = await second.execute({ code: "return 42;", label: "tc_next", timeoutMs: 3_000 });
    await second.close();
    expect(next.ok).toBe(true);
    expect(next.result).toBe(42);
    expect(Date.now() - started).toBeLessThan(1_500);
    expect(await exists(tmpPathFor(RUNTIME_DIR, stuck))).toBe(false);
    expect(await lockId()).toBeNull();
    await first.close();
  });

  it("does not touch a tmp response that may still be being written", async () => {
    const transport = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_fresh_tmp", RUNTIME_DIR, async (id) => {
        await fs.writeFile(tmpPathFor(RUNTIME_DIR, id), "", "utf8");
      }),
      scanDialogs: noDialogs,
      reapIntervalMs: 50,
      emptyTmpGraceMs: 60_000,
    });
    await transport.execute({ code: "return 1;", label: "tc_fresh_tmp", timeoutMs: 500 });
    const id = consumed[0];
    await sleep(300);
    expect(await exists(tmpPathFor(RUNTIME_DIR, id))).toBe(true);
    expect(await lockId()).toBe(id);
    await transport.close();
    await fs.unlink(tmpPathFor(RUNTIME_DIR, id)).catch(() => {});
  });
});

describe("a lock left by another server process", () => {
  it("is broken once that request's response has been sitting unclaimed", async () => {
    const foreign = randomUUID();
    await fs.writeFile(BUSY_LOCK_PATH, JSON.stringify({ pid: 0, id: foreign }), "utf8");
    await writeResponse(RUNTIME_DIR, foreign, "theirs");
    await ago(responsePathFor(foreign), 5_000);

    const transport = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_foreign", RUNTIME_DIR, async (id) => writeResponse(RUNTIME_DIR, id, "ours")),
      scanDialogs: noDialogs,
      reapIntervalMs: 60_000,
      emptyTmpGraceMs: 200,
    });
    const res = await transport.execute({ code: "return 1;", label: "tc_foreign", timeoutMs: 2_000 });
    expect(res.ok).toBe(true);
    expect(res.result).toBe("ours");
    // Their response is theirs to collect (or the hourly sweep's): left alone.
    expect(await exists(responsePathFor(foreign))).toBe(true);
    await fs.unlink(responsePathFor(foreign)).catch(() => {});
    await transport.close();
  });

  it("is kept while that request shows no sign of having finished", async () => {
    await fs.writeFile(BUSY_LOCK_PATH, JSON.stringify({ pid: 0, id: randomUUID() }), "utf8");
    const transport = new FileIpcTransport({
      instance: null,
      spawn: consumingSpawn("tc_foreign_live", RUNTIME_DIR, null),
      scanDialogs: noDialogs,
      reapIntervalMs: 60_000,
    });
    const res = await transport.execute({ code: "return 1;", label: "tc_foreign_live", timeoutMs: 400 });
    expect(res.errorCode).toBe("TIMEOUT");
    expect(res.error).toContain("busy lock");
    await transport.close();
  });
});

describe("a pull request that times out after pickup", () => {
  let dir: string;
  let timer: NodeJS.Timeout | null = null;

  beforeEach(async () => {
    const id = `t-${randomUUID().slice(0, 8)}`;
    dir = instanceDirFor(id);
    await fs.mkdir(dir, { recursive: true });
    const beat = async (busy: boolean) => {
      const body = JSON.stringify({ id, idSource: "env", aeVersion: "27.0", project: null, projectName: null, busy, ts: Date.now() });
      await fs.writeFile(path.join(dir, `${HEARTBEAT_FILENAME}.tmp`), body, "utf8");
      await fs.rename(path.join(dir, `${HEARTBEAT_FILENAME}.tmp`), path.join(dir, HEARTBEAT_FILENAME));
    };
    await beat(false);
    // The agent picked the request up and is now stuck behind a box: it says
    // busy, so the transport waits instead of declaring the instance dead.
    timer = setInterval(() => void beat(true), 200);
  });

  afterEach(async () => {
    if (timer) clearInterval(timer);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("says the same about a dialog, and cleans up when the response lands", async () => {
    const instance = path.basename(dir);
    const spawnNever: SpawnFn = () => new FakeChild();
    const transport = new FileIpcTransport({ instance, spawn: spawnNever, scanDialogs: noDialogs, reapIntervalMs: 50 });
    const call = transport.execute({ code: "return 1;", label: "tc_pull", timeoutMs: 700 });
    // Stand in for the agent: consume the request.
    let id = "";
    for (let i = 0; i < 40 && !id; i++) {
      await sleep(25);
      for (const name of await fs.readdir(dir)) {
        if (name.startsWith(REQUEST_PREFIX) && name.endsWith(".json")) {
          id = name.slice(REQUEST_PREFIX.length, -".json".length);
          await fs.unlink(path.join(dir, name));
        }
      }
    }
    const res = await call;
    expect(res.errorCode).toBe("TIMEOUT");
    expect(res.error).toMatch(/modal dialog/);
    expect(res.error).toMatch(/instance\.dialogs may not (list|see) it/);

    await writeResponse(dir, id, "late");
    await sleep(400);
    expect(await exists(path.join(dir, `response-${id}.json`))).toBe(false);
    await transport.close();
  });
});

describe("when a transport starts", () => {
  // Live, 2026-11-10: a `.response-<id>.json.tmp` left by an earlier request
  // from another server process stayed in the runtime folder.
  async function until(check: () => Promise<boolean>, ms = 2_000): Promise<boolean> {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      if (await check()) return true;
      await sleep(25);
    }
    return check();
  }

  it("sweeps temp responses and requests older than a few minutes, and keeps fresh ones", async () => {
    const old = [
      path.join(RUNTIME_DIR, `.response-${randomUUID()}.json.tmp`),
      path.join(RUNTIME_DIR, `.request-${randomUUID()}.json.tmp`),
    ];
    const fresh = path.join(RUNTIME_DIR, `.response-${randomUUID()}.json.tmp`);
    for (const p of [...old, fresh]) await fs.writeFile(p, "", "utf8");
    for (const p of old) await ago(p, 10 * 60_000);

    const transport = new FileIpcTransport({ instance: null, scanDialogs: noDialogs });
    expect(await until(async () => !(await exists(old[0])) && !(await exists(old[1])))).toBe(true);
    expect(await exists(fresh)).toBe(true);
    await transport.close();
    await fs.unlink(fresh).catch(() => {});
  });

  it("sweeps them in a live instance's mailbox too", async () => {
    const dir = instanceDirFor(`t-${randomUUID().slice(0, 8)}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, HEARTBEAT_FILENAME),
      JSON.stringify({ id: path.basename(dir), ts: Date.now(), busy: false }),
      "utf8",
    );
    const stale = path.join(dir, `.response-${randomUUID()}.json.tmp`);
    await fs.writeFile(stale, "", "utf8");
    await ago(stale, 10 * 60_000);

    const transport = new FileIpcTransport({ instance: null, scanDialogs: noDialogs });
    expect(await until(async () => !(await exists(stale)))).toBe(true);
    await transport.close();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("removes a lock nobody has refreshed for minutes, but never a live one", async () => {
    await fs.writeFile(BUSY_LOCK_PATH, JSON.stringify({ pid: 0, id: "gone" }), "utf8");
    await ago(BUSY_LOCK_PATH, 5 * 60_000);
    const first = new FileIpcTransport({ instance: null, scanDialogs: noDialogs });
    expect(await until(async () => !(await exists(BUSY_LOCK_PATH)))).toBe(true);
    await first.close();

    // A live owner refreshes every 15 s: its lock is always fresh.
    await fs.writeFile(BUSY_LOCK_PATH, JSON.stringify({ pid: process.pid, id: "live" }), "utf8");
    await ago(BUSY_LOCK_PATH, 20_000);
    const second = new FileIpcTransport({ instance: null, scanDialogs: noDialogs });
    await sleep(300);
    expect(await lockId()).toBe("live");
    await second.close();
  });
});
