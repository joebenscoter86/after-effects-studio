# Installation and update

Comp Room installs from the `jb-technology` marketplace in the public repository `joebenscoter86/after-effects-studio`. Adding the marketplace downloads the repository; nothing is built on your Mac and no npm install runs.

## Requirements

- macOS with a licensed copy of Adobe After Effects 2027.
- Node.js 24 or newer from the installer at [nodejs.org](https://nodejs.org). Run `node -v` in Terminal to check. The Claude desktop app starts plugins without your shell profile, so a Node installed with Homebrew or nvm may be invisible to it even when Terminal finds it. The nodejs.org installer puts Node where the app can find it.
- If After Effects is installed somewhere unusual, set `AE_MCP_EXE` to its `.app` bundle in the environment that starts Claude, then restart.

## Claude Code

```
claude plugin marketplace add joebenscoter86/after-effects-studio
claude plugin install comp-room@jb-technology
```

Inside a running session, the one-step form is:

```
/plugin install comp-room --marketplace joebenscoter86/after-effects-studio
```

Restart Claude Code so the plugin's server starts, then follow [your first motion scene](first-session.md).

## Claude app and Cowork

Open Customize → Plugins → Add marketplace, enter `joebenscoter86/after-effects-studio`, and install Comp Room. After Effects control needs a Cowork session running on your Mac. In regular chat, or a Cowork session in the cloud, only the skills load.

## Update

```
claude plugin marketplace update jb-technology
claude plugin update comp-room@jb-technology
```

Restart Claude afterwards. In the Claude app, update the plugin from Customize → Plugins.

## Remove

```
claude plugin uninstall comp-room@jb-technology
```

To forget the marketplace as well, run `claude plugin marketplace remove jb-technology`. Removing the plugin does not delete or change your After Effects projects, renders or exports.

## Check the installation

From the plugin's installed folder (Claude Code keeps it under `~/.claude/plugins/cache/jb-technology/comp-room/`), `node scripts/doctor.mjs` checks Node, the package files and the After Effects path without launching After Effects. A passing result does not prove that macOS Automation or After Effects scripting permission works; the read-only check in [your first motion scene](first-session.md) does.

## Local development

From a checkout of the repository, load the generated package directly:

```
claude --plugin-dir claude/comp-room
```

The package is generated from `plugin/` with `node release/build-claude-package.mjs`; never edit it by hand. `node release/build-claude-package.mjs --check` reports a stale package.
