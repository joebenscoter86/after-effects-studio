# Package boundaries

Codex discovers `.codex-plugin/plugin.json`, five skills and `.mcp.json`. The MCP launches `scripts/start.mjs`, which imports a bundled Node server. The server uses the upstream local OS scripting/file-mailbox transport to control After Effects. It does not open an HTTP listener or use a cloud relay.

`runtime/src` and `runtime/jsx` preserve the native operation engine. `runtime/dist/index.js` bundles the Node dependencies for portable installation. JSX support files remain next to the bundle under runtime. No package is fetched at startup. Node and AE remain host prerequisites.

`ae_library` reads only IDs in `library/manifest.json`, checks path containment and content hashes, and works with AE closed. The catalog lists actual policy-filtered operations; arbitrary custom scripts use eval.run when enabled. The index returns a `startHere` route to motion-language, production-workflow and brief-template. Both server instructions and the motion-studio skill require that foundation for creative work, then load relevant technique modules. Relative packaged files provide a fallback if library tooling is unavailable. This is agent instruction routing, not a runtime guarantee that an arbitrary client will follow the craft process.

Version 0.2.0 contains 29 indexed documents/code libraries, including a validated foundation/typography/paper-collage module catalog, native helper code, worked scenes and a failure atlas. Source hashes and a migration matrix make the adaptation inspectable. It does not bundle asset generation, licensed media, a user interface inside AE, or the complete JoeB production/funnel system. The house preset is opt-in and its rig dependencies are explicit. Normal motion scenes can use the independent helpers and native operations.

The runtime's local IPC handles its own clients. Other AE controllers must be sequenced by the operator. Inspect the exact open project before writes; the local AE application is shared. This package does not silently replace existing global MCP registrations.
