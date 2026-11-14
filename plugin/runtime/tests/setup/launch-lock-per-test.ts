// Offline runs only (vitest.config.ts sets COMP_ROOM_OFFLINE_ROOT): every
// test gets a launch-lock folder of its own. Most fake launchers in this suite
// never exit, and on macOS the launch lock is held until the launcher exits,
// so a shared folder would let one test's leftover launch hold up the next.
// Transports read the folder when they are built, so this runs before each
// test's own hooks. Tests of the lock itself pass a folder explicitly.

import { mkdtempSync } from "node:fs";
import * as path from "node:path";

import { beforeEach } from "vitest";

const root = process.env.COMP_ROOM_OFFLINE_ROOT;

if (root) {
  beforeEach(() => {
    process.env.AE_MCP_LAUNCH_LOCK_DIR = mkdtempSync(path.join(root, "launch-lock-"));
  });
}
