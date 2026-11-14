// One dispatcher launch at a time per user and per After Effects, across
// every server process, whatever its TMPDIR (see config.ts, "The launch
// lock"). The lock is a file created with open("wx"), the one atomic
// primitive every process shares. It records who launched what:
//
//   { token, serverPid, launcherPid, requestId, launchedAt }
//
// and it is held while that launcher lives, its script waiting or running: a waiter
// breaks it only when the launcher is gone (its pid is dead, or, in the
// process that wrote it, it is no longer in the table below) or when it is
// older than LAUNCH_LOCK_STALE_MS.
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { LAUNCH_LOCK_SPAWN_GRACE_MS, LAUNCH_LOCK_STALE_MS } from "../config.js";
import { appBundlePath } from "./launcher.js";
/**
 * Tokens of the launches this process holds. Inside the process that wrote a
 * lock this is the answer to "is its launcher still alive" — better than
 * probing a pid — and it is kept on globalThis so two copies of this module
 * in one process (a test that re-imports with another TMPDIR) agree.
 */
const HELD_KEY = Symbol.for("comp-room.launch-lock.held");
const held = globalThis[HELD_KEY] ??
    (globalThis[HELD_KEY] = new Set());
/** The lock file for one After Effects: named after its app bundle, so each install has its own. */
export function launchLockPath(dir, afterFxPath) {
    const key = createHash("sha256").update(appBundlePath(afterFxPath)).digest("hex").slice(0, 12);
    return path.join(dir, `launch-${key}.lock`);
}
/** Is there a process with this pid? EPERM means there is, owned by someone else. */
export function pidAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (err) {
        return err.code === "EPERM";
    }
}
export class LaunchLock {
    file;
    staleMs;
    constructor(file, staleMs = LAUNCH_LOCK_STALE_MS) {
        this.file = file;
        this.staleMs = staleMs;
    }
    /**
     * Take the lock for a launch of `requestId`, or report the live launch
     * that holds it. Throws only when the lock folder itself is unusable; the
     * caller then launches without it, as before this lock existed.
     */
    async tryAcquire(requestId) {
        await fs.mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
        for (let tries = 0; tries < 3; tries++) {
            const record = {
                token: randomUUID(),
                serverPid: process.pid,
                launcherPid: null,
                requestId,
                launchedAt: new Date().toISOString(),
            };
            try {
                const handle = await fs.open(this.file, "wx", 0o600);
                try {
                    await handle.writeFile(JSON.stringify(record), "utf8");
                }
                finally {
                    await handle.close();
                }
                held.add(record.token);
                return { token: record.token };
            }
            catch (err) {
                if (err.code !== "EEXIST")
                    throw err;
            }
            const current = await this.read();
            if (current === null)
                continue; // released between open and read: try again
            if (this.alive(current))
                return { heldBy: current };
            await unlinkQuietly(this.file);
        }
        const current = await this.read();
        return { heldBy: current ?? placeholder(requestId) };
    }
    /** Record the launcher's pid, so other processes can tell when it is gone. */
    async setLauncher(token, launcherPid) {
        const current = await this.read();
        if (current === null || current.token !== token)
            return;
        const tmp = `${this.file}.${token}.tmp`;
        await fs.writeFile(tmp, JSON.stringify({ ...current, launcherPid }), { encoding: "utf8", mode: 0o600 });
        await fs.rename(tmp, this.file);
    }
    /** Give the lock back, if it is still the one `token` took. */
    async release(token) {
        held.delete(token);
        const current = await this.read();
        if (current !== null && current.token === token)
            await unlinkQuietly(this.file);
    }
    /** The record in the lock, or null when there is none. An unreadable one is dated by its mtime. */
    async read() {
        let raw;
        let mtimeMs;
        try {
            [raw, mtimeMs] = await Promise.all([
                fs.readFile(this.file, "utf8"),
                fs.stat(this.file).then((s) => s.mtimeMs),
            ]);
        }
        catch {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed.token === "string" && typeof parsed.serverPid === "number") {
                return {
                    token: parsed.token,
                    serverPid: parsed.serverPid,
                    launcherPid: typeof parsed.launcherPid === "number" ? parsed.launcherPid : null,
                    requestId: typeof parsed.requestId === "string" ? parsed.requestId : "",
                    launchedAt: typeof parsed.launchedAt === "string" && !Number.isNaN(Date.parse(parsed.launchedAt))
                        ? parsed.launchedAt
                        : new Date(mtimeMs).toISOString(),
                };
            }
        }
        catch {
            /* torn: created, not yet written */
        }
        // Unreadable: a lock in the instant between create and write, or junk.
        // Dated by its mtime and owned by nobody, so it holds only for the grace.
        return { token: "", serverPid: -1, launcherPid: null, requestId: "", launchedAt: new Date(mtimeMs).toISOString() };
    }
    /** Can the launch this record describes still deliver a script? */
    alive(record) {
        const age = Date.now() - Date.parse(record.launchedAt);
        if (age > this.staleMs)
            return false;
        if (record.serverPid === process.pid)
            return held.has(record.token);
        if (record.launcherPid !== null)
            return pidAlive(record.launcherPid);
        if (record.serverPid > 0 && !pidAlive(record.serverPid))
            return false;
        return age < LAUNCH_LOCK_SPAWN_GRACE_MS;
    }
}
function placeholder(requestId) {
    return { token: "", serverPid: -1, launcherPid: null, requestId, launchedAt: new Date().toISOString() };
}
async function unlinkQuietly(file) {
    try {
        await fs.unlink(file);
    }
    catch {
        /* already gone */
    }
}
//# sourceMappingURL=launch-lock.js.map