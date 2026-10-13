/** What jsx/agent.jsx writes. Every field but `id`/`ts` is best-effort. */
export interface Heartbeat {
    id: string;
    idSource?: "env" | "random";
    agentVersion?: number;
    aeVersion?: string;
    project: string | null;
    projectName: string | null;
    dirty?: boolean;
    numItems?: number;
    startedAt?: number;
    ticks?: number;
    served?: number;
    busy?: boolean;
    busySince?: number | null;
    lastError?: string | null;
    /** Epoch milliseconds, AE's clock — same machine as ours. */
    ts: number;
}
export interface InstanceInfo {
    id: string;
    dir: string;
    heartbeat: Heartbeat | null;
    /** Milliseconds since the last heartbeat, or null without one. */
    ageMs: number | null;
    alive: boolean;
}
export declare function isAlive(heartbeat: Heartbeat | null, now?: number): boolean;
/** Describe one instance directory. Never throws; a missing or torn heartbeat reads as dead. */
export declare function readInstance(dir: string, now?: number): Promise<InstanceInfo>;
/** Every instance directory, alive or not, sorted by id. */
export declare function listInstances(instancesDir?: string, now?: number): Promise<InstanceInfo[]>;
/**
 * Does `target` (as the user wrote it) name this instance? Three forms:
 *   - an id, matched exactly or after the same sanitizing the agent applied;
 *   - a project file name, with or without its extension, matched
 *     case-insensitively on the stem — "shotA" and "ShotA.aep" both address
 *     the instance that has ShotA.aep open;
 *   - a project PATH (anything containing a separator), matched on the whole
 *     resolved path — the way to pick one of two instances whose projects
 *     share a file name in different folders.
 */
export declare function matchesTarget(instance: InstanceInfo, target: string): boolean;
export type TargetResolution = {
    mode: "push";
} | {
    mode: "pull";
    instance: InstanceInfo;
} | {
    mode: "error";
    message: string;
    hint: string;
};
/**
 * How an instance is named to people and models: the project it has open
 * first, because that is what anyone actually thinks of it as, then the id
 * in brackets — needed to address it when the project is untitled or open
 * twice. `ShotA.aep [ae-t6s4fl]`, `untitled [ae-9k2p1q]`.
 */
export declare function instanceLabel(instance: InstanceInfo): string;
export declare function describeInstance(instance: InstanceInfo): string;
export declare function instanceSummary(instances: InstanceInfo[]): string;
/**
 * Decide where a call goes.
 *
 * With a target: exactly one live instance must match. Without one: pull to
 * the single live instance if there is one, push when there is none — the
 * pre-agent behaviour, so a user who never installed the agent sees no change
 * — and refuse when several are live, because guessing would drive the wrong
 * project.
 */
export declare function resolveTarget(target: string | null, instancesDir?: string, now?: number): Promise<TargetResolution>;
/**
 * Remove instance directories nobody can still be using: heartbeat older than
 * INSTANCE_DIR_SWEEP_MS, or no heartbeat at all in a directory that old
 * (an agent creates the directory and heartbeats within the same tick).
 * Returns the ids removed. Best-effort — a directory that vanishes or is
 * held open underneath us is simply left for the next sweep.
 */
export declare function sweepDeadInstanceDirs(instancesDir?: string, now?: number): Promise<string[]>;
//# sourceMappingURL=instances.d.ts.map