// The cut-out operations' own text (first production use, 2026-11-12): the
// cut-out needs the user's click, which cannot be made unattended, so an
// agent must get it before the user leaves; and a whole piece is scaled to
// delivery size first and rendered in halves with the cache emptied between.
// Nothing here reaches After Effects.

import { describe, expect, it } from "vitest";

import "../src/operations/index.js";
import {
  runSubjectPrepare,
  SUBJECT_ATTENDED_NOTE,
  SUBJECT_WHOLE_PIECE_NOTE,
} from "../src/operations/keying.js";
import { getOp } from "../src/registry.js";

describe("the cut-out's text says the click cannot be made unattended", () => {
  it("in the notes themselves, plainly, with the measured halves", () => {
    expect(SUBJECT_ATTENDED_NOTE).toMatch(/the user's own click/);
    expect(SUBJECT_ATTENDED_NOTE).toMatch(/cannot be done unattended/);
    expect(SUBJECT_ATTENDED_NOTE).toMatch(/before the user leaves/);
    expect(SUBJECT_WHOLE_PIECE_NOTE).toMatch(/scale the take to delivery size first/);
    expect(SUBJECT_WHOLE_PIECE_NOTE).toMatch(
      /in halves, emptying After Effects' disk cache between them/,
    );
    expect(SUBJECT_WHOLE_PIECE_NOTE).toMatch(
      /43\.5 s piece at 1088 x 1920 took about 4\.3 minutes and 12 GB of cache each/,
    );
  });

  it("in the descriptions of subject.prepare, subject.check and subject.render_cutout", () => {
    const prepare = getOp("subject.prepare")!.description;
    expect(prepare).toContain(SUBJECT_ATTENDED_NOTE);
    expect(prepare).toContain(SUBJECT_WHOLE_PIECE_NOTE);
    expect(getOp("subject.check")!.description).toMatch(
      /while the user is still there.*cannot be made unattended/,
    );
    const render = getOp("subject.render_cutout")!.description;
    expect(render).toContain(SUBJECT_WHOLE_PIECE_NOTE);
    expect(render).toMatch(/cannot make the click/);
  });

  it("in subject.prepare's result, beside the steps", async () => {
    const res = await runSubjectPrepare({ comp: "Main", layer: 1 }, {
      execute: async () => ({
        ok: true,
        comp: "Main",
        layer: "take.mov",
        steps: ["one"],
        notice: "notice",
        relay: "relay",
        footage: {
          sourceSize: [1088, 1920],
          compSize: [1080, 1920],
          scale: [100, 100],
          frames: 30,
          file: null,
          hasAudio: false,
        },
      }),
      probeAudio: async () => null,
    } as never);
    expect(res.attended).toBe(SUBJECT_ATTENDED_NOTE);
    expect(res.wholePiece).toBe(SUBJECT_WHOLE_PIECE_NOTE);
  });
});
