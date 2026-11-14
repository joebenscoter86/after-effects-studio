import { mkdirSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { defineConfig } from "vitest/config";

// What keeps a test run away from the After Effects on this machine is the
// opt-in, not a stand-in on PATH (the launcher calls /usr/bin/osascript by its
// full path). Every suite that sends After Effects anything checks
// AE_MCP_E2E, AE_MCP_E2E_MULTI or AE_MCP_E2E_DESTRUCTIVE first. Without one,
// the run also gets a temp folder of its own: the mailbox follows TMPDIR, and
// a launch already waiting in After Effects (behind a dialog, say) runs the
// oldest request in the machine-wide mailbox when it is let through — which,
// mid-run, could be an offline test's. The launch lock (which follows
// neither) gets a folder of its own for the same reason.
const LIVE = ["AE_MCP_E2E", "AE_MCP_E2E_MULTI", "AE_MCP_E2E_DESTRUCTIVE"].some(
  (name) => process.env[name] === "1",
);
const OFFLINE_ROOT = path.join(os.tmpdir(), "comp-room-offline-tests");
if (!LIVE) mkdirSync(OFFLINE_ROOT, { recursive: true, mode: 0o700 });

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // After Effects is a single shared instance driven through one
    // request/response file pair: run suites sequentially so concurrent
    // suites never race over runtime/request.json.
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 120_000,
    hookTimeout: 60_000,
    globals: false,
    reporters: "default",
    env: LIVE
      ? {}
      : {
          TMPDIR: OFFLINE_ROOT,
          TMP: OFFLINE_ROOT,
          TEMP: OFFLINE_ROOT,
          AE_MCP_LAUNCH_LOCK_DIR: path.join(OFFLINE_ROOT, "launch-locks"),
        },
  },
});
