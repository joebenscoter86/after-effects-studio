// The harness must never overwrite the committed bundle: when a source file is
// newer than dist/index.js it builds a test server somewhere that is not
// committed, the way the release builds (one esbuild bundle), and runs that.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, utimesSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ensureBuilt, TEST_BUILD_DIR } from "./harness.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE = path.join(ROOT, "dist", "index.js");
const hash = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");

describe("the test harness's build", () => {
  it("leaves the committed bundle alone when the source is newer, and runs a bundle it builds elsewhere", () => {
    const before = hash(BUNDLE);
    const st = statSync(BUNDLE);
    // Make the bundle look older than every source file.
    utimesSync(BUNDLE, new Date(0), new Date(0));
    try {
      const entry = ensureBuilt();
      expect(hash(BUNDLE)).toBe(before);
      expect(entry).toBe(path.join(TEST_BUILD_DIR, "index.js"));
      expect(path.relative(ROOT, entry).startsWith("dist")).toBe(false);
      expect(existsSync(entry)).toBe(true);
      // One self-contained bundle, as the release builds it: no relative imports into src or dist.
      expect(readFileSync(entry, "utf8")).not.toMatch(/from "\.\/(tools|operations|color)\//);
    } finally {
      utimesSync(BUNDLE, st.atime, st.mtime);
    }
  }, 60_000);

  it("runs the committed bundle when it is newer than the source", () => {
    expect(ensureBuilt()).toBe(BUNDLE);
  });
});
