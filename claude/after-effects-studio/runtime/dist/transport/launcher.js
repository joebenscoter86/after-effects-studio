import { DISPATCHER_JSX, RUNTIME_DIR } from "../config.js";
function jsxPath(p) {
  return `'${p.replace(/\\/g, "/").replace(/'/g, "\\'")}'`;
}
function appleScriptString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function appBundlePath(aePath) {
  const normalized = aePath.replace(/\\/g, "/");
  const match = normalized.match(/^(.*?\.app)(\/|$)/);
  return match ? match[1] : normalized;
}
function buildInstanceLaunchPlan(aePath, instanceId, platform = process.platform) {
  if (platform === "darwin") {
    return {
      command: "/usr/bin/open",
      args: ["-n", "--env", `AE_MCP_INSTANCE=${instanceId}`, "-a", appBundlePath(aePath)]
    };
  }
  return { command: aePath, args: ["-m"] };
}
function buildLaunchPlan(aePath, platform = process.platform, runtimeDir = RUNTIME_DIR, dispatcherJsx = DISPATCHER_JSX) {
  if (platform === "darwin") {
    const bootstrap = `$.global.AE_MCP_RUNTIME_DIR_OVERRIDE = ${jsxPath(runtimeDir)}; $.evalFile(${jsxPath(dispatcherJsx)});`;
    return {
      command: "/usr/bin/osascript",
      args: [
        // The AppleScript default event timeout is 2 minutes; DoScript blocks
        // osascript until the JSX returns, so lift it well past every built-in
        // call timeout (the longest is the 10-minute project import).
        "-e",
        "with timeout of 7200 seconds",
        "-e",
        `tell application ${appleScriptString(appBundlePath(aePath))} to DoScript ${appleScriptString(bootstrap)}`,
        "-e",
        "end timeout"
      ],
      diagnoseExit: true,
      detectPhantom: false
    };
  }
  return { command: aePath, args: ["-r", dispatcherJsx], diagnoseExit: false, detectPhantom: true };
}
export {
  buildInstanceLaunchPlan,
  buildLaunchPlan,
  jsxPath
};
