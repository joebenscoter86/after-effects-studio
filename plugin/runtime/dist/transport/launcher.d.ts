export interface LaunchPlan {
    command: string;
    args: string[];
    /**
     * Watch stderr + exit code and treat non-zero as a launch failure. True for
     * osascript (its exit code carries the Automation-permission diagnosis);
     * false for AfterFX.exe, whose exit code is noise.
     */
    diagnoseExit: boolean;
    /**
     * Treat a child that is still alive PHANTOM_LAUNCH_MS after spawning, with
     * the request unconsumed, as AE booting a throwaway instance rather than
     * forwarding. True for AfterFX.exe (a forwarder exits within a second);
     * false for osascript, which legitimately blocks for the DoScript duration.
     */
    detectPhantom: boolean;
}
/** ExtendScript single-quoted string literal for a filesystem path. */
export declare function jsxPath(p: string): string;
/**
 * How to start a NEW After Effects instance (instance.start), as opposed to
 * reaching a running one. Windows: `AfterFX.exe -m` — the spawned process IS
 * the instance, so the AE_MCP_INSTANCE the caller puts in its environment is
 * what jsx/agent.jsx reads. macOS: `open -n` starts a second copy of the
 * bundle; `--env` (macOS 12+) carries the variable into it. Verified on AE
 * 26.5 / macOS 26.4: the second instance starts and its agent registers under
 * that name. `open` exits at once, so the spawned pid is not After Effects'.
 */
export declare function buildInstanceLaunchPlan(aePath: string, instanceId: string, platform?: NodeJS.Platform): {
    command: string;
    args: string[];
};
export declare function buildLaunchPlan(aePath: string, platform?: NodeJS.Platform, runtimeDir?: string, dispatcherJsx?: string): LaunchPlan;
//# sourceMappingURL=launcher.d.ts.map