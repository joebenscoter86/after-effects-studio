#!/usr/bin/env node
// Resolve relative to this file, not the caller's working directory.
if (Number(process.versions.node.split('.')[0]) < 24) {
  console.error('After Effects Studio requires Node.js 24 or newer. Install Node.js 24+, confirm `node -v` shows that version, then restart the agent host.');
  process.exit(1);
}
// Explicit caller policy wins; the plugin provides full native scripting by default.
process.env.AE_MCP_ENABLE_EVAL ??= '1';
await import('../runtime/dist/index.js');
