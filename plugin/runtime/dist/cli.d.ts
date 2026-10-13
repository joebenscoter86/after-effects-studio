export declare const USAGE = "mcp-aftereffects \u2014 MCP server for Adobe After Effects\n\n  mcp-aftereffects                    start the MCP server on stdio (what MCP clients run)\n  mcp-aftereffects install-agent      install the resident agent into After Effects' user-level\n                                      Scripts/Startup folder(s); needed to drive instances started\n                                      with `AfterFX.exe -m`. Restart After Effects afterwards.\n  mcp-aftereffects uninstall-agent    remove it again\n  mcp-aftereffects agent-status       show where the agent is installed and whether it is current\n  mcp-aftereffects instances          list the After Effects instances whose agent is live\n  mcp-aftereffects help               this text\n\nOptions for install-agent / uninstall-agent / agent-status:\n  --version <major.minor>   only that After Effects version folder (e.g. 26.3); default: all present\n  --dir <path>              an explicit Scripts/Startup folder instead of the profile-derived ones\n  --dry-run                 report what would change without writing\n\nAddress an instance from the server side with AE_MCP_INSTANCE=<id or project file name>; name an\ninstance at launch by setting AE_MCP_INSTANCE in the environment that starts AfterFX.exe.\n";
interface ParsedArgs {
    command: string;
    version?: string;
    dir?: string;
    dryRun: boolean;
    unknown: string[];
}
export declare function parseCliArgs(argv: string[]): ParsedArgs;
/** Run one subcommand; returns the process exit code. Never throws. */
export declare function runCli(argv: string[], out?: (line: string) => void): Promise<number>;
export {};
//# sourceMappingURL=cli.d.ts.map