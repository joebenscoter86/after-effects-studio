// The Node half of the response seam (the JSX half is response-write-safety).
//
// A response file is renamed into place complete, so one that does not parse
// is not "still being written" for longer than a torn read lasts. The poll
// loop used to treat every unparseable response as pending, forever: a cut-off
// file kept the caller waiting for its whole timeout (five minutes for
// ae_project_export_json) and the busy lock held for 90 seconds after that.
// Found on 2026-11-09, quality/reports/2026-11-09-comp-room-limits, defect 14.
//
// These are the pure pieces that decide; no mailbox and no After Effects.

import { describe, expect, it } from "vitest";

import {
  UNREADABLE_RESPONSE_GRACE_MS,
  UnreadableResponseWatch,
  readResponseText,
  unreadableResponseFailure,
} from "../src/transport/FileIpcTransport.js";

const CUT_OFF = '{"id":"abc","ok":true,"phase":"execute","result":{"groups":[{"name":"';

describe("readResponseText", () => {
  it("returns a complete response", () => {
    const read = readResponseText('{"id":"abc","ok":true,"result":1,"error":null,"stack":null,"logs":[]}');
    expect(read.kind).toBe("ready");
    if (read.kind === "ready") expect(read.response.result).toBe(1);
  });

  it("treats an empty file as still pending", () => {
    expect(readResponseText("").kind).toBe("pending");
  });

  it("reports a cut-off file as unreadable, with its size and how it ends", () => {
    const read = readResponseText(CUT_OFF);
    expect(read.kind).toBe("unreadable");
    if (read.kind === "unreadable") {
      expect(read.bytes).toBe(Buffer.byteLength(CUT_OFF, "utf8"));
      expect(CUT_OFF.endsWith(read.tail)).toBe(true);
      expect(read.tail.length).toBeLessThanOrEqual(80);
    }
  });
});

describe("UnreadableResponseWatch", () => {
  const unreadable = readResponseText(CUT_OFF);
  const pending = readResponseText("");

  it("does not give up on the first unreadable look (it may be a torn read)", () => {
    const watch = new UnreadableResponseWatch();
    expect(watch.settled(unreadable, 1_000)).toBe(false);
    expect(watch.settled(unreadable, 1_000 + UNREADABLE_RESPONSE_GRACE_MS - 1)).toBe(false);
  });

  it("gives up once the same unreadable content has sat for the grace period", () => {
    const watch = new UnreadableResponseWatch();
    watch.settled(unreadable, 1_000);
    expect(watch.settled(unreadable, 1_000 + UNREADABLE_RESPONSE_GRACE_MS)).toBe(true);
  });

  it("starts over when the file changes size or goes away in between", () => {
    const watch = new UnreadableResponseWatch();
    watch.settled(unreadable, 1_000);
    const grown = readResponseText(`${CUT_OFF}more`);
    expect(watch.settled(grown, 1_000 + UNREADABLE_RESPONSE_GRACE_MS)).toBe(false);
    expect(watch.settled(pending, 1_000 + UNREADABLE_RESPONSE_GRACE_MS + 10)).toBe(false);
    expect(watch.settled(unreadable, 1_000 + UNREADABLE_RESPONSE_GRACE_MS + 20)).toBe(false);
  });

  it("is short enough to matter and long enough for a rename", () => {
    expect(UNREADABLE_RESPONSE_GRACE_MS).toBeGreaterThanOrEqual(500);
    expect(UNREADABLE_RESPONSE_GRACE_MS).toBeLessThanOrEqual(5_000);
  });
});

describe("unreadableResponseFailure", () => {
  it("says what happened and that the script already ran", () => {
    const read = readResponseText(CUT_OFF);
    if (read.kind !== "unreadable") throw new Error("fixture should be unreadable");
    const result = unreadableResponseFailure(read, Date.now() - 2_500);

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("DISPATCHER");
    expect(result.error).toContain("not valid JSON");
    expect(result.error).toContain(String(read.bytes));
    expect(result.error).toMatch(/already ran|ran to completion/);
    expect(result.durationMs).toBeGreaterThanOrEqual(2_500);
  });
});
