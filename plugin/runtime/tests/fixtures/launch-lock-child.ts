// One server process for tests/launch-lock.test.ts: a push-path transport
// whose launcher is a real process that does nothing (/bin/sleep), so its pid
// is real and other processes can see it live and die. Bundled by the test
// with esbuild and run with its own TMPDIR. Logs every launch and exit to
// LAUNCH_LOG, then prints the call's result as one line of JSON.
//
// Env: LAUNCH_LOG, LAUNCH_WHO, LAUNCH_LOCK_DIR, LAUNCH_SLEEP_S, LAUNCH_TIMEOUT_MS,
// LAUNCH_DISPATCHER (the package's dispatcher.jsx), AE_MCP_EXE (any file).

import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

import { FileIpcTransport } from "../../src/transport/FileIpcTransport.js";

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const log = env("LAUNCH_LOG");
const who = env("LAUNCH_WHO");

const transport = new FileIpcTransport({
  instance: null,
  platform: "darwin",
  launchLockDir: env("LAUNCH_LOCK_DIR"),
  dispatcherJsx: env("LAUNCH_DISPATCHER"),
  scanDialogs: async () => [],
  reapIntervalMs: 60_000,
  spawn: () => {
    const child = spawn("/bin/sleep", [env("LAUNCH_SLEEP_S")], { stdio: "ignore" });
    appendFileSync(log, `${JSON.stringify({ who, event: "spawn", pid: child.pid, t: Date.now() })}\n`);
    child.on("exit", () => {
      appendFileSync(log, `${JSON.stringify({ who, event: "exit", pid: child.pid, t: Date.now() })}\n`);
    });
    return child;
  },
});

const result = await transport.execute({
  code: "return 1;",
  label: `launch_lock_${who}`,
  timeoutMs: Number(env("LAUNCH_TIMEOUT_MS")),
});
await transport.close();
process.stdout.write(`${JSON.stringify({ errorCode: result.errorCode, error: result.error })}\n`);
