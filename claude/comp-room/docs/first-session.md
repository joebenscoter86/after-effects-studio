# Your first motion scene

This is the guided first session in Claude Code, or in a Cowork session running on your Mac, with macOS and After Effects 2027. Install the plugin first with [installation and update](local-install.md).

For a polished scene, use the most capable model available to you. A lower-cost model can build editable drafts, but inspect its rendered frames closely. Model choice never replaces checking the actual movie.

1. Open After Effects and the project you intend to use. An empty project is fine. Leave any unrelated work open; the plugin inspects it before making changes.
2. Start a new Claude Code session or Cowork task and say: "Use Comp Room. Check the After Effects version and my current project read-only, then tell me whether the connection and required permissions work. Do not change the project yet." The first time, macOS asks whether Claude, or the terminal running Claude Code, may control Adobe After Effects. Allow it. If the check fails, follow [connection and permission recovery](connection-recovery.md); a generic failure does not prove which permission is missing.
3. Give the scene brief: "Create an editable five-second 16:9 scene about [subject]. The viewer should understand [takeaway]. Use [style or palette], and use only these assets: [files or none]. Inspect this exact project before writing, keep unrelated material intact, show me a rendered preview, and put your work in a named composition." With no assets, an intentionally geometric explanation suits a first try. A physical product or a real brand claim needs real artwork you are allowed to use.
4. Review the preview, then ask for one concrete revision: "Change the main line to [exact copy] and the accent to [color]. Keep the rest of the scene and all unrelated project items intact. Show before and after frames." Claude should revise its own composition rather than make a duplicate.
5. Ask for the composition name, which native layers changed, where the previews are, and which checks did not run. Saving the project and exporting a full movie are separate steps; ask for them when you want them. A sampled frame does not prove playback quality.

If Claude reports a timeout after a possible write, ask it to inspect the actual project and find any items it made before retrying. Do not repeat the same creation request blindly. A saved or unsaved existing project is real work; never clear, close or overwrite it for a test.

The plugin bundles its server and motion library. You do not need a source checkout, a private rig, a paid asset service, an npm install or any manual server configuration.
