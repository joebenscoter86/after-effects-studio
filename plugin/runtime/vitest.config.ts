import { mkdtempSync, rmSync } from "node:fs";
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
// mid-run, could be an offline test's. The folder is new for every run, so
// two runs at once (two sessions, say) never share a mailbox or a busy lock;
// each test gets its own launch-lock folder inside it (tests/setup).
//
// What proves the rest offline is running it where starting osascript or
// After Effects is refused: `npm run test:offline` (macOS) runs this suite
// under tests/no-osascript.sb.
const LIVE = ["AE_MCP_E2E", "AE_MCP_E2E_MULTI", "AE_MCP_E2E_DESTRUCTIVE"].some(
  (name) => process.env[name] === "1",
);
const OFFLINE_ROOT = LIVE ? null : mkdtempSync(path.join(os.tmpdir(), "comp-room-offline-"));
if (OFFLINE_ROOT !== null) {
  process.on("exit", () => rmSync(OFFLINE_ROOT, { recursive: true, force: true }));
}

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
    setupFiles: ["tests/setup/launch-lock-per-test.ts"],
    env:
      OFFLINE_ROOT === null
        ? {}
        : {
            TMPDIR: OFFLINE_ROOT,
            TMP: OFFLINE_ROOT,
            TEMP: OFFLINE_ROOT,
            COMP_ROOM_OFFLINE_ROOT: OFFLINE_ROOT,
            AE_MCP_LAUNCH_LOCK_DIR: path.join(OFFLINE_ROOT, "launch-locks"),
          },
  },
});
