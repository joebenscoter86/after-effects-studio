// The response file is the only way a caller ever hears back, so the JSX side
// must never hand over one that cannot be parsed.
//
// Found on 2026-11-09 (quality/reports/2026-11-09-comp-room-limits, defect 14):
// After Effects' own "Create Shapes from Text" names the vector group of an
// emoji with HALF of its surrogate pair (char code 55357). ExtendScript cannot
// encode an unpaired surrogate as UTF-8: File.write stops at that character and
// leaves everything before it in the file. serve.jsx ignored that, renamed the
// cut-off file into place, and the Node side — which treats an unparseable
// response as "still being written" — polled it until the caller's timeout
// (five minutes for ae_project_export_json), then kept the busy lock.
//
// These tests run the real serve.jsx against a stand-in File that fails the
// way ExtendScript's does. No After Effects is involved.

import { readFileSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it } from "vitest";

const SERVE_PATH = fileURLToPath(new URL("../jsx/serve.jsx", import.meta.url));
const JSON2_PATH = fileURLToPath(new URL("../jsx/json2.jsx", import.meta.url));

/**
 * ExtendScript's JSON, not Node's. Node's JSON.stringify has escaped unpaired
 * surrogates since ES2019, which would hide the bug; the serializer After
 * Effects runs (json2.jsx here) emits them raw.
 */
function extendScriptJson(): { parse: (t: string) => unknown; stringify: (v: unknown) => string } {
  const src = readFileSync(JSON2_PATH, "utf8");
  const load = new Function("JSON", `${src}\nreturn JSON;`) as (j: undefined) => ReturnType<typeof extendScriptJson>;
  return load(undefined);
}

const MAILBOX = "/mailbox";
const LONE_HIGH_SURROGATE = String.fromCharCode(0xd83d);

/** Index of the first surrogate code unit that is not half of a valid pair, or -1. */
function firstUnpairedSurrogate(text: string): number {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        i++;
        continue;
      }
      return i;
    }
    if (c >= 0xdc00 && c <= 0xdfff) return i;
  }
  return -1;
}

/** In-memory disk shared by every FakeFile of one test. */
let disk: Map<string, string>;
/** Paths whose NEXT write silently stores only half of what it was given. */
let shortWrites: Set<string>;

/**
 * The slice of ExtendScript's File that serve.jsx uses. `write` reproduces the
 * failure seen in After Effects 2027: text containing an unpaired surrogate is
 * written up to that character and the call reports failure.
 */
class FakeFile {
  encoding = "";
  error = "";
  private mode: string | null = null;

  constructor(public fsName: string) {}

  get name(): string {
    return path.posix.basename(this.fsName);
  }
  get exists(): boolean {
    return disk.has(this.fsName);
  }
  get modified(): Date {
    return new Date(0);
  }
  /** Size in bytes, as ExtendScript reports it. */
  get length(): number {
    return Buffer.byteLength(disk.get(this.fsName) ?? "", "utf8");
  }
  open(mode: string): boolean {
    if (mode === "r" && !disk.has(this.fsName)) {
      this.error = "File or folder does not exist";
      return false;
    }
    this.mode = mode;
    if (mode === "w") disk.set(this.fsName, "");
    if (mode === "a" && !disk.has(this.fsName)) disk.set(this.fsName, "");
    return true;
  }
  read(): string {
    return disk.get(this.fsName) ?? "";
  }
  write(text: string): boolean {
    if (this.mode !== "w" && this.mode !== "a") return false;
    let accepted = text;
    let ok = true;
    const bad = firstUnpairedSurrogate(text);
    if (bad !== -1) {
      accepted = text.slice(0, bad);
      ok = false;
      this.error = "I/O error";
    } else if (shortWrites.delete(this.fsName)) {
      // A disk that fills up mid-write: half arrives and nothing complains.
      accepted = text.slice(0, Math.floor(text.length / 2));
    }
    disk.set(this.fsName, (disk.get(this.fsName) ?? "") + accepted);
    return ok;
  }
  close(): boolean {
    this.mode = null;
    return true;
  }
  remove(): boolean {
    return disk.delete(this.fsName);
  }
  rename(newName: string): boolean {
    const dest = path.posix.join(path.posix.dirname(this.fsName), newName);
    const content = disk.get(this.fsName);
    if (content === undefined) return false;
    disk.delete(this.fsName);
    disk.set(dest, content);
    this.fsName = dest;
    return true;
  }
}

interface AeMcp {
  serveRequest(requestFile: FakeFile, mailboxDir: string, logPath: string): void;
}

/** Load the real serve.jsx with stand-ins for the ExtendScript globals it touches. */
function loadServe(): AeMcp {
  const src = readFileSync(SERVE_PATH, "utf8");
  const app = {
    beginSuppressDialogs() {},
    endSuppressDialogs() {},
    beginUndoGroup() {},
    endUndoGroup() {},
  };
  const load = new Function("File", "Folder", "app", "JSON", `${src}\nreturn AE_MCP;`) as (
    file: typeof FakeFile,
    folder: undefined,
    appObject: typeof app,
    json: ReturnType<typeof extendScriptJson>,
  ) => AeMcp;
  return load(FakeFile, undefined, app, extendScriptJson());
}

/** Put a request in the mailbox, serve it, and return whatever landed as its response. */
function serve(id: string, code: string): { raw: string | undefined; tmpLeftBehind: boolean } {
  const requestPath = `${MAILBOX}/request-${id}.json`;
  disk.set(requestPath, JSON.stringify({ id, code }));
  loadServe().serveRequest(new FakeFile(requestPath), MAILBOX, `${MAILBOX}/dispatcher.log`);
  return {
    raw: disk.get(`${MAILBOX}/response-${id}.json`),
    tmpLeftBehind: disk.has(`${MAILBOX}/.response-${id}.json.tmp`),
  };
}

beforeEach(() => {
  disk = new Map();
  shortWrites = new Set();
});

describe("serve.jsx response writing", () => {
  it("delivers a result that contains an unpaired surrogate (the half-emoji group name)", () => {
    const { raw } = serve("lone", "return { name: String.fromCharCode(55357), after: 'still here' };");

    expect(raw, "a response file must exist").toBeDefined();
    const parsed = JSON.parse(raw!) as { ok: boolean; result: { name: string; after: string } };
    expect(parsed.ok).toBe(true);
    expect(parsed.result.name).toBe(LONE_HIGH_SURROGATE);
    expect(parsed.result.after).toBe("still here");
  });

  it("still delivers ordinary non-ASCII text unchanged", () => {
    const text = "Précision — 東京 🙂";
    const { raw } = serve("utf8", `return ${JSON.stringify(text)};`);

    const parsed = JSON.parse(raw!) as { ok: boolean; result: string };
    expect(parsed.ok).toBe(true);
    expect(parsed.result).toBe(text);
  });

  it("never renames a short write into place: the caller gets a parseable error instead", () => {
    shortWrites.add(`${MAILBOX}/.response-short.json.tmp`);
    const { raw } = serve("short", "return 'a perfectly ordinary result';");

    expect(raw, "a response file must exist").toBeDefined();
    const parsed = JSON.parse(raw!) as { ok: boolean; error: string | null };
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toMatch(/could not (write|serialize) response/);
  });
});
