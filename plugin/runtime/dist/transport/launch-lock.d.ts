export interface LaunchLockRecord {
    token: string;
    serverPid: number;
    /** The launcher's pid once it is spawned; null while it is being started. */
    launcherPid: number | null;
    requestId: string;
    /** ISO time the lock was taken, just before the launch. */
    launchedAt: string;
}
/** The lock file for one After Effects: named after its app bundle, so each install has its own. */
export declare function launchLockPath(dir: string, afterFxPath: string): string;
/** Is there a process with this pid? EPERM means there is, owned by someone else. */
export declare function pidAlive(pid: number): boolean;
export type LaunchLockClaim = {
    token: string;
} | {
    heldBy: LaunchLockRecord;
};
export declare class LaunchLock {
    readonly file: string;
    private readonly staleMs;
    constructor(file: string, staleMs?: number);
    /**
     * Take the lock for a launch of `requestId`, or report the live launch
     * that holds it. Throws only when the lock folder itself is unusable; the
     * caller then launches without it, as before this lock existed.
     */
    tryAcquire(requestId: string): Promise<LaunchLockClaim>;
    /** Record the launcher's pid, so other processes can tell when it is gone. */
    setLauncher(token: string, launcherPid: number): Promise<void>;
    /** Give the lock back, if it is still the one `token` took. */
    release(token: string): Promise<void>;
    /** The record in the lock, or null when there is none. An unreadable one is dated by its mtime. */
    read(): Promise<LaunchLockRecord | null>;
    /** Can the launch this record describes still deliver a script? */
    private alive;
}
//# sourceMappingURL=launch-lock.d.ts.map