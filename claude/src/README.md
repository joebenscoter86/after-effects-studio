# Comp Room

Comp Room is a plugin for Adobe After Effects. Working from Claude, it creates and revises editable motion graphics in your own copy. The plugin pairs native After Effects control with a bundled, production-derived motion language: briefs, construction, camera continuity, typography, paper collage, worked scenes and visual review. You choose the subject, brand and style. The plugin builds native, editable compositions and shows you rendered frames so you can judge the result before you accept it.

Published by JB Technology LLC. Free for personal and paid client work, including delivery of editable projects. Terms are in [LICENSE](LICENSE). The upstream runtime and bundled dependencies keep their own licenses: see [PROVENANCE.md](PROVENANCE.md), `runtime/LICENSE` and [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).

## Requirements

- macOS with a licensed copy of Adobe After Effects 2027.
- Node.js 24 or newer, installed with the installer from [nodejs.org](https://nodejs.org). Check with `node -v`. The Claude desktop app may not find a Node installed with Homebrew or nvm.
- Claude Code, or a Cowork session running on your Mac (see below).
- macOS asks once whether Claude, or the terminal that runs it, may control After Effects. Allow it. For renders and exports, After Effects needs **Allow Scripts to Write Files and Access Network** turned on in Preferences → Scripting & Expressions.
- Optional: `ffmpeg` and `ffprobe` for the bundled export verifier and for the footage tools most visual styles use; Blender for the four 3D styles (backrooms, glass product, low-poly island and tilt-shift).
- Fonts: each visual style names the free (OFL) Google Fonts families it uses. None are bundled; install the ones a style needs, or let Claude substitute a similar installed family.

## Where it works

| Where | What you get |
|---|---|
| Claude Code on your Mac | After Effects control, plus the skills and motion library |
| A Cowork session running on your Mac | The same as Claude Code. The first time, macOS asks whether Claude may control After Effects |
| Regular Claude chat, or Cowork running in the cloud | The skills only. After Effects control needs a session on the Mac that runs After Effects; there is no cloud relay |

## What it runs and sends

- **A local server.** Claude runs the plugin's `start.mjs` with Node, which starts the bundled server in `runtime/` and talks to Claude over standard input and output. It opens no network port, uses no cloud relay and needs no account.
- **After Effects scripting.** The server asks macOS to run scripts in After Effects and exchanges temporary request and response files with it in a per-user temporary folder.
- **After Effects dialogs.** When a modal dialog blocks scripting, the server reads its text to report it, which needs macOS Accessibility permission for the app running Claude. The `instance.dismiss_dialog` operation can close such a dialog by its cancel action (what Escape does) or press the only button of a one-button warning; it never answers a save prompt with Save or Don't Save.
- **Write access, on by default.** Through its tools, Claude can create, change and delete items in the open project; open, close and save projects; render frames and movies to paths you choose; run After Effects menu commands; change After Effects preferences; and start or stop After Effects.
- **Style tools.** Most visual styles include small Node scripts that prepare your footage or stills with ffmpeg, and the 3D styles render plates with Blender. Claude runs one only when a build needs it; it reads the input files you name and writes to a cache folder you choose, replacing its own earlier outputs there. The 3D plate scripts render the library's seven-beat test scene format, so a scene of your own means adapting the script or building without plates.
- **Custom scripting, on by default.** The `eval.run` operation runs custom ExtendScript with your user account's access to After Effects, your files and system commands. Treat a script like any code you run.
- **Turning things off.** Start Claude with `AE_MCP_ENABLE_EVAL=0` to remove custom scripting, or `AE_MCP_READONLY=1` to make the session inspection-only, for example `AE_MCP_READONLY=1 claude`.
- **What reaches Claude.** Your requests, tool inputs and results, project metadata such as item and layer names and settings, and the preview frames you ask for. The plugin does not upload your project or media to JB Technology LLC or anyone else.

## Privacy

The plugin runs on your Mac and has no server of its own. JB Technology LLC receives nothing from it. Read the full [privacy statement](https://github.com/joebenscoter86/after-effects-studio/blob/main/release/website/privacy.md). Anthropic's terms cover how Claude handles your conversation, and any asset or generation tool you use alongside the plugin has its own policy.

## Example prompts

- Check the After Effects version and my current project read-only, and tell me whether the connection works. Don't change anything yet.
- Create a polished motion graphic in After Effects.
- Inspect my AE project and improve its motion.
- Create a motion graphic using my brand colors and visual style.
- Make this explainer in the woodcut style.

## Install

In Claude Code, add the marketplace and install the plugin:

```
claude plugin marketplace add joebenscoter86/after-effects-studio
claude plugin install comp-room@jb-technology
```

Or in one step inside a Claude Code session:

```
/plugin install comp-room --marketplace joebenscoter86/after-effects-studio
```

In the Claude app, open Customize → Plugins → Add marketplace, enter `joebenscoter86/after-effects-studio`, then install Comp Room. Restart Claude, open After Effects, and follow [your first motion scene](docs/first-session.md). [Installation and update](docs/local-install.md) covers updates, and [connection and permission recovery](docs/connection-recovery.md) covers failed connections.

## Remove

```
claude plugin uninstall comp-room@jb-technology
```

Removing the plugin does not touch your After Effects projects, renders or exports.

## Working with existing projects

Claude inspects the open project before it writes and keeps unrelated work, including an unsaved project. Run one After Effects controller at a time. Each tool call is one undo step. A call that throws is rolled back before the error comes back, and the error says whether that worked; a batch is rolled back only when it was run with `stopOnError`. After a script changes the render queue, undo and rollback are refused for the rest of the After Effects session unless the call says it accepts the risk, because After Effects 2027 has crashed on undo after such changes. A request that timed out may still have run: inspect the project before retrying. Saves and exports cannot be undone with project undo.

## What's inside

Six skills (motion-studio, ae-control, motion-review, typography, paper-collage and visual-styles), twelve tools, and a hashed library of 91 documents and code helpers that the `ae_library` tool serves offline. The library includes 30 visual styles, from art deco to woodcut, each with a written grammar, an After Effects recipe and a worked ES3 module; they are adapted from Lemo-Opuscar (MIT). The motion language applies to every style; the paper, navy and vermilion JoeB look is an optional preset. [Architecture](docs/ARCHITECTURE.md) describes the package.
