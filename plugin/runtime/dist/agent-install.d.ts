/** Where After Effects keeps per-user, per-version files. */
export declare function aeProfileRoot(platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, home?: string): string;
/** Version folders ("26.3", "25.0", …) present under the profile root, newest first. */
export declare function listAeVersionDirs(root: string): Promise<string[]>;
export declare function startupDirFor(root: string, version: string): string;
/**
 * The bootstrap stub. ES3, self-guarding: a missing agent file (package
 * uninstalled or moved) is a silent no-op rather than a modal at every AE
 * launch; anything the agent itself throws is caught by its own top-level
 * guard, and a failure to LOAD it (an #include that no longer resolves, a
 * syntax error) is written to <runtime root>/agent-fatal.log instead of
 * surfacing as a dialog that would block every instance at startup.
 */
export declare function stubSource(agentJsx?: string, runtimeRoot?: string, mailbox?: string): string;
export interface StubStatus {
    version: string;
    stubPath: string;
    /** A stub exists at that path. */
    installed: boolean;
    /** …and its contents match what this package would write now. */
    current: boolean;
}
export interface InstallOptions {
    /** Only this AE version folder (e.g. "26.3"). Default: every version present. */
    version?: string;
    /** Write the stub into exactly this directory instead of the profile-derived ones. */
    dir?: string;
    dryRun?: boolean;
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    home?: string;
}
export declare function agentInstallStatus(opts?: InstallOptions): Promise<StubStatus[]>;
export interface InstallReport {
    /** Stub paths written (or that would be, on a dry run). */
    written: string[];
    /** Stub paths already up to date. */
    unchanged: string[];
}
/**
 * Write the stub into every target Startup folder, creating Scripts/Startup
 * where missing. A folder for an AE version that was never launched does not
 * exist yet and is not created — there is nothing to hook.
 */
export declare function installAgent(opts?: InstallOptions): Promise<InstallReport>;
export declare function uninstallAgent(opts?: InstallOptions): Promise<{
    removed: string[];
}>;
//# sourceMappingURL=agent-install.d.ts.map