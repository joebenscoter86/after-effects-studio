#!/usr/bin/env node
import { __esmMin } from "./chunks/rolldown-runtime.js";
import { RUNTIME_DIR, denyTool, errorResult, init_cli, init_config, init_errors, init_policy, instanceTargetFromEnv, policySummary, readOnlyMode, runCli } from "./chunks/core-1.js";
import { FileIpcTransport, init_FileIpcTransport } from "./chunks/transport-1.js";
import { init_operations } from "./chunks/operations-1.js";
import { ALL_TOOLS, init_library, init_tools, libraryTool } from "./chunks/tools-1.js";
import { createRequire } from "node:module";
import { McpServer } from "modelcontextprotocol-sdk/server/mcp.js";
import { StdioServerTransport } from "modelcontextprotocol-sdk/server/stdio.js";

// index.js
function annotationsFor(tool) {
	switch (tool.effect) {
		case "read": return { readOnlyHint: true };
		case "destructive": return { destructiveHint: true };
		case "write": return { destructiveHint: false };
	}
}
function register(tool) {
	server.registerTool(tool.name, {
		title: tool.title,
		description: tool.description,
		inputSchema: tool.inputShape,
		annotations: annotationsFor(tool)
	}, async (args) => {
		try {
			return await tool.handler(args, transport);
		} catch (err) {
			return errorResult("TRANSPORT", err instanceof Error ? err.message : String(err), {
				details: { tool: tool.name },
				stack: err instanceof Error ? err.stack ?? null : null
			});
		}
	});
}
async function instanceBanner() {
	const named = instanceTargetFromEnv();
	const target = await transport.describeTarget();
	switch (target.mode) {
		case "pull": return `instance: ${target.instance.id} (resident agent${named ? `, AE_MCP_INSTANCE=${named}` : ", the only live one"})`;
		case "push": return "instance: none registered yet — calls launch AfterFX.exe -r into the running After Effects (instances started with -m need the agent: `mcp-aftereffects install-agent`)";
		case "error": return `instance: UNRESOLVED \u2014 ${target.message}`;
	}
}
async function main() {
	const argv = process.argv.slice(2);
	if (argv.length > 0) {
		process.exitCode = await runCli(argv);
		return;
	}
	console.error(`[mcp-aftereffects] policy: ${policySummary()}`);
	console.error(`[mcp-aftereffects] mailbox: ${RUNTIME_DIR}`);
	console.error(`[mcp-aftereffects] ${await instanceBanner()}`);
	if (readOnlyMode()) console.error(`[mcp-aftereffects] read-only mode \u2014 ${skipped.length > 0 ? `tools withheld: ${skipped.join(", ")}; ` : ""}ae_do accepts only operations that cannot modify the project.`);
	else console.error("[mcp-aftereffects] WRITE ACCESS IS ON — tools can create, mutate and delete project content. Set AE_MCP_READONLY=1 for inspection-only sessions.");
	const stdio = new StdioServerTransport();
	await server.connect(stdio);
}
var version, serverName, transport, server, skipped;
function init_server() {
	return (init_server = __esmMin((async () => {
		init_cli();
		init_config();
		init_errors();
		init_policy();
		init_FileIpcTransport();
		await init_operations();
		init_tools();
		init_library();
		({version, serverName} = createRequire(import.meta.url)("../package.json"));
		transport = new FileIpcTransport();
		server = new McpServer({
			name: serverName ?? "after-effects-studio",
			version
		}, { instructions: "Local native After Effects control with a detailed production-derived motion language for any brand or style. Before designing or building motion in After Effects, read ae_library documents motion-language, production-workflow and brief-template; load construction, camera-continuity, assets-depth, type-evidence and worked-scenes as relevant. This craft foundation is the default for all styles, not an optional JoeB preset. Everything required is bundled; do not require the original repo, personal rig or assets. Inspect ae_context and discover exact operations with ae_catalog. eval.run enables custom ES3. A call that throws is rolled back and says whether that worked (details.rollback); a batch.run is rolled back only with stopOnError. Inspect failures, unconfirmed rollbacks and timeouts before retrying. Render and visually inspect actual artifacts, and distinguish technical success from visual quality. The paper/navy/vermilion JoeB appearance is optional." });
		skipped = [];
		for (const tool of [...ALL_TOOLS, libraryTool]) {
			if (denyTool(tool.name, tool.blockedInReadOnly)) {
				skipped.push(tool.name);
				continue;
			}
			register(tool);
		}
		main().catch((err) => {
			process.stderr.write(`mcp-aftereffects fatal: ${err && err.stack ? err.stack : String(err)}
`);
			process.exit(1);
		});
	})))();
}

await init_server();
export {  };