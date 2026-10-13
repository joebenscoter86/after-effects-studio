# AFT-3 distribution-route research

Date: 2026-10-06 (America/Los_Angeles). Scope: compare the current local package to OpenAI's current public plugin and marketplace guidance. No publication, submission, outreach or native AE operation was performed.

## Evidence inspected

- Local package: `plugin/.mcp.json`, `plugin/.codex-plugin/plugin.json`, `plugin/scripts/start.mjs`, `plugin/runtime/src/index.ts`, `plugin/runtime/src/config.ts`, `plugin/runtime/src/transport/FileIpcTransport.ts`, `plugin/docs/ARCHITECTURE.md` and `plugin/README.md`. Current behavior is a bundled Node MCP stdio server with local AE file IPC and OS scripting, with no hosted HTTPS endpoint.
- Official [package guide](https://developers.openai.com/plugins/build/plugins): compatibility manifest remains supported; portable root manifest is recommended; Git-backed marketplaces exist but are separate from the universal directory; locally running MCP needs HTTPS deployment or an OpenAI contact for local support.
- Official [Claude plugin submission conversion guide](https://developers.openai.com/plugins/guides/submit-claude-plugin): local MCP can require OpenAI contact; local execution and application/file access warrant product-specific review before submitting.
- Official [MCP server guide](https://developers.openai.com/plugins/build/mcp-server): standard public submissions require a stable publicly reachable HTTPS MCP endpoint; temporary/local tunnels do not satisfy that route.
- Official [remote review guide](https://developers.openai.com/plugins/deploy/app-review): remote submissions require verified publisher identity, Apps Management permission and a reachable review endpoint. Those are downstream requirements for the remote path, not proof of local-MCP eligibility.

## Finding

The current plugin fits the documented local/Git-backed Codex marketplace format after release checks. It is an inference that an openly accessible Git source and install instructions can serve as a public Codex release; this has not been validated with a public install. That route is separate from the universal directory. The ordinary public directory route for MCP assumes a public HTTPS endpoint. Because the product's value depends on the user's local AE process and files, documented guidance points to OpenAI contact/product-specific review for a local MCP path. No current official page reviewed here confirms that this plugin can be listed with its present local MCP configuration, and no external confirmation has been requested or received.

The [technical brief](../../../release/submission/local-controller-brief.md) states the architecture, data flow, permissions, route comparison, recommendation and an unsent inquiry draft. The open choice is whether to target a public Codex Git launch first while pursuing directory guidance, or to make confirmed directory support a prerequisite for any public launch. AFT-3 remains open pending Joe's route decision and, if directory placement is required, external confirmation.
