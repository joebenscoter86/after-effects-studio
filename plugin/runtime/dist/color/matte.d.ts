import type { DecodedPng } from "./png16.js";
import { type Rgb } from "./sheet.js";
export type Screen = "green" | "blue";
/** Where the matte is read from: the capture's alpha, or its luminance (Keylight's matte views). */
export type MatteFrom = "alpha" | "luma";
export interface EdgeThresholds {
    /**
     * Read the matte from the capture's alpha (default), or from its Rec. 709
     * luminance: Keylight's Screen Matte and Combined Matte views write the
     * matte in grey RGB with alpha 1 everywhere (measured live), so their
     * alpha says nothing.
     */
    from: MatteFrom;
    /** Alpha at or below this counts as transparent. */
    transparent: number;
    /** Alpha at or above this counts as opaque. */
    opaque: number;
    /** Widest transition still called a thin edge, in px; also the edge band for flicker. */
    maxEdgeWidth: number;
    /** An island at least this share of the largest one's area is a main area, not a speck. */
    mainAreaShare: number;
    /** How many holes, specks, patches and main areas are listed (all are counted). */
    listed: number;
    /** The screen colour spill is read against. */
    screen: Screen;
    /** Partly transparent pixels below this alpha are left out of the spill colour. */
    spillMinAlpha: number;
    /** How far the screen channel must exceed the other two (and the solid area's own lean). */
    spillThreshold: number;
    /** A pixel's alpha change above this counts as changed (flicker shares and bounds). */
    changeAbove: number;
    /** Side of the square window a patch's densest part is reported in, px. */
    patchWindow: number;
}
export type EdgeThresholdArgs = Partial<EdgeThresholds>;
/**
 * The defaults and why:
 * - transparent / opaque: two 8-bit steps from 0 and 1, the same cut `sample`
 *   uses for its alpha shares, so the two reports agree. Anything a key leaves
 *   above that in the screen is real (it will show over a bright plate).
 * - maxEdgeWidth: 1% of the frame's shorter side, at least 4 px (11 px at
 *   1080×1920). A keyed hair or shoulder edge at HD is a few pixels; wider
 *   transitions (heavy motion blur, a half-keyed remnant, an unkeyed screen)
 *   are reported as patches so they are not averaged into "edge".
 * - mainAreaShare 0.25: a second subject a quarter of the first's size is a
 *   subject; smaller islands are specks. Main areas are listed, so nothing is
 *   hidden either way.
 * - listed 5: enough to find the worst places without flooding the response.
 * - spillMinAlpha 0.1: un-matting divides by alpha, so below ~0.1 a pixel's
 *   recovered colour is mostly quantisation noise.
 * - spillThreshold 0.03: about eight 8-bit steps of lean towards the screen
 *   channel; smaller leans are within grading noise.
 * - changeAbove 0.05: alpha changes below this are invisible in practice;
 *   8-bit capture noise alone is 1/255.
 * - from "alpha": the keyed result's coverage. "luma" only for a render
 *   whose RGB is the matte (Keylight View 5 or 8); spill is not read then.
 * - patchWindow: four times maxEdgeWidth (44 px at 1080×1920): large enough
 *   to hold a remnant worth fixing, small enough that a long band's box does
 *   not hide where most of it is.
 */
export declare const EDGE_DEFAULTS: Omit<EdgeThresholds, "maxEdgeWidth" | "patchWindow"> & {
    maxEdgeWidth: "auto";
    patchWindow: "auto";
};
/** The alpha that marks the boundary itself, where edge width is sampled. */
export declare const CONTOUR_ALPHA = 0.5;
/** Default maxEdgeWidth for a frame: 1% of the shorter side, at least 4 px. */
export declare function autoMaxEdgeWidth(width: number, height: number): number;
/** Caller overrides on top of the defaults, for a frame of this size. */
export declare function resolveEdgeThresholds(args: EdgeThresholdArgs, width: number, height: number): EdgeThresholds;
/** Why a set of caller thresholds cannot be used, or null when it can. */
export declare function edgeArgsError(args: Record<string, unknown>): string | null;
export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface EdgeReport {
    /** Always "capture": the alpha as saveFrameToPng wrote it (see measurementStages). */
    stage: "capture";
    /** "alpha": the capture's alpha; "luma": its luminance, for a render whose RGB is the matte. */
    matteFrom: MatteFrom;
    pixels: number;
    shares: {
        opaque: number;
        partial: number;
        transparent: number;
    };
    width: {
        /** Median over the main areas' 50% contour, px; null when nothing could be measured. */
        typical: number | null;
        p90: number | null;
        worst: number | null;
        worstAt: {
            x: number;
            y: number;
        } | null;
        /** Contour pixels measured. */
        samples: number;
        /** Contour pixels where the alpha never reaches transparent (or opaque) anywhere in the frame. */
        unmeasured: number;
    };
    solidAreas: {
        count: number;
        list: Array<Box & {
            area: number;
        }>;
    };
    holes: {
        count: number;
        area: number;
        /** Hole pixels at or below `transparent` (the rest are partly transparent). */
        transparentArea: number;
        largest: (Box & {
            area: number;
            meanAlpha: number;
        }) | null;
        list: Array<Box & {
            area: number;
            meanAlpha: number;
        }>;
    };
    specks: {
        count: number;
        area: number;
        list: Array<Box & {
            area: number;
            meanAlpha: number;
            maxAlpha: number;
        }>;
    };
    patches: {
        count: number;
        area: number;
        list: PatchEntry[];
    };
    spill: {
        screen: Screen;
        /** Partly transparent pixels at or above spillMinAlpha that the colour is read from. */
        pixels: number;
        /** Their mean straight colour, comp background taken out; capture values. */
        mean: Rgb | null;
        /** Mean colour of the opaque pixels within maxEdgeWidth of a transparent pixel. */
        solidMean: Rgb | null;
        /** Screen channel minus the larger of the other two, for `mean` and `solidMean`. */
        excess: number | null;
        solidExcess: number | null;
        leansToScreen: boolean;
        reading: string;
    };
}
/** One listed patch: its box, and what is inside the box. */
export interface PatchEntry extends Box {
    area: number;
    meanAlpha: number;
    /**
     * The patch pixel deepest inside it (farthest from any transparent or
     * opaque pixel), and the patch's thickness there: distance to the nearest
     * transparent + nearest opaque pixel − 1, as edge width is measured, or
     * twice the depth − 1 where one of the two does not exist in the frame.
     */
    thickest: {
        x: number;
        y: number;
        thickness: number;
    };
    /** The patchWindow-square window (clipped to the box) holding the most patch pixels. */
    densest: Box & {
        pixels: number;
        share: number;
        meanAlpha: number;
    };
}
/** What one frame leaves for the next frame's flicker numbers. */
export interface AlphaFrame {
    width: number;
    height: number;
    alpha: Float32Array;
    /** Per pixel: 0 outside, 1 edge, 2 inside (see measureEdge). */
    zones: Uint8Array;
}
export interface ZoneChange {
    pixels: number;
    meanAbsDelta: number;
    maxAbsDelta: number;
    /** Share of the zone's pixels whose alpha changed by more than changeAbove. */
    changedShare: number;
    /** Bounding box of those pixels, or null. */
    changedBounds: Box | null;
}
export interface AlphaChange {
    edge: ZoneChange;
    inside: ZoneChange;
    outside: ZoneChange;
    all: ZoneChange;
}
/**
 * Distance from every pixel to the nearest pixel where `isSource` holds;
 * Infinity if none. Exported for the screen measurement (screen.ts).
 */
export declare function distanceTo(alpha: Float64Array, width: number, height: number, isSource: (a: number) => boolean, scratch: Float32Array, out: Float32Array): void;
export interface Region {
    area: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    alphaSum: number;
    alphaMax: number;
    transparent: number;
    touchesBorder: boolean;
}
export declare const newRegion: () => Region;
export declare function addPixel(r: Region, x: number, y: number, a: number): void;
export declare const box: (r: Region) => Box;
/**
 * Flood-fill every region of pixels where `inSet` holds (4- or 8-connected),
 * writing 1-based region ids into `labels` and returning one Region each.
 * Exported for the screen measurement (screen.ts).
 */
export declare function labelRegions(alpha: Float64Array, width: number, height: number, inSet: (p: number) => boolean, eight: boolean, labels: Int32Array, queue: Int32Array, transparentAt: number): Region[];
/**
 * The matte in a render whose RGB is the matte (Keylight's Screen Matte and
 * Combined Matte views): Rec. 709 luminance of the capture values, clamped to
 * 0..1; a grey pixel (r = g = b) is taken as it is.
 */
export declare function lumaMatte(img: DecodedPng): Float64Array;
/**
 * Measure one capture's matte. `bg` is the comp background AE laid the
 * capture's RGB over (see unmatte); it is taken out before the spill colour
 * is read. The matte is the capture's alpha, or with `t.from` "luma" its
 * luminance (then spill is not read: there is no subject colour). Throws when
 * the matte comes from alpha and the capture has none.
 */
export declare function measureEdge(img: DecodedPng, bg: Rgb, t: EdgeThresholds): {
    report: EdgeReport;
    frame: AlphaFrame;
};
/**
 * The change in alpha from `prev` to `cur`, split by where it happened. Each
 * frame marks its pixels as edge (within maxEdgeWidth of both a transparent
 * and an opaque pixel), inside (otherwise, alpha ≥ 0.5) or outside. A pixel
 * inside the solid area in either frame counts as inside — so a hole opening
 * or closing is inside, not edge; otherwise outside in either frame counts
 * as outside (specks appearing); the rest is edge. Real motion is change
 * too: read these on a held shot, or against how much the subject moves.
 */
export declare function alphaChange(prev: AlphaFrame, cur: AlphaFrame, t: EdgeThresholds): AlphaChange;
export interface FlickerPair extends AlphaChange {
    from: {
        index: number;
        time: number | undefined;
    };
    to: {
        index: number;
        time: number | undefined;
    };
}
export interface FlickerSummary {
    meanAbsDelta: number;
    maxAbsDelta: number;
    changedShare: number;
    /** The pair with the largest meanAbsDelta in this zone, or null when nothing changed. */
    worstPair: {
        from: number;
        to: number;
    } | null;
}
/** Over every pair: mean of the per-pair means, the largest single change, the worst pair. */
export declare function summarizeFlicker(pairs: FlickerPair[]): Record<"edge" | "inside" | "outside" | "all", FlickerSummary>;
export interface EnclosedHole extends Box {
    area: number;
    meanAlpha: number;
}
/**
 * The holes `edge` reports (4-connected regions below `below`, default edge's
 * opaque threshold, that do not reach the frame edge), as a list and as a
 * mask: 1 for every pixel of a kept hole. Holes smaller than `minArea` pixels
 * are left out of both and counted in `dropped`; holes `keep` refuses are left
 * out and counted in `leftOut`.
 */
export declare function enclosedHoles(alpha: ArrayLike<number>, width: number, height: number, opts?: {
    below?: number;
    minArea?: number;
    keep?: (hole: EnclosedHole) => boolean;
}): {
    holes: EnclosedHole[];
    mask: Uint8Array;
    dropped: {
        count: number;
        area: number;
    };
    leftOut: {
        count: number;
        area: number;
    };
};
/** `mask` grown by `radius` px: every pixel within that Euclidean distance of a set pixel is set. */
export declare function growMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array;
export type FrameEdge = "top" | "bottom" | "left" | "right";
export interface Opening extends EnclosedHole {
    /** The frame edges it reaches between two of the subject's contacts. */
    edges: FrameEdge[];
}
/**
 * Holes and openings in a cut-out's matte. A hole is a region below `below`
 * (default edge's opaque threshold) that cannot reach the frame edge, as
 * `edge` reports it. An opening reaches the frame edge only between two
 * places where the subject touches that edge: on each of the four edges, the
 * pixels between the first and the last opaque pixel on it are treated as
 * solid (an edge with fewer than two opaque pixels is left open), and a
 * region enclosed only because of that sealing is an opening. On a take with
 * no green screen (2026-11-11) a microphone left out of the matte ran off the
 * bottom of the frame: an opening of about 115,000 px, not a hole. An opening
 * can also be a real gap, such as between an arm and the body. The sealed edge
 * pixels that were below opaque count in the opening they close. Regions
 * smaller than `minArea` are left out and counted in `dropped`.
 */
export declare function cutoutRegions(alpha: ArrayLike<number>, width: number, height: number, opts?: {
    below?: number;
    minArea?: number;
}): {
    holes: EnclosedHole[];
    openings: Opening[];
    dropped: {
        count: number;
        area: number;
    };
};
export interface OutlineOptions {
    /** Frames between the two frames of a drift comparison (default 30). */
    gap?: number;
    /** A drift (share of the frame whose alpha changed by more than `step`) under this counts as unmoved (default 0.002). */
    limit?: number;
    /** A frozen run must cover at least this many frames and two comparisons (default 60). */
    minFrames?: number;
    /** The alpha change that counts as a change (default 0.1). */
    step?: number;
}
export interface FrozenRun {
    from: number;
    to: number;
    length: number;
    /** The largest drift in the run, share of the frame. */
    drift: number;
    /** Median share of the frame, opaque in both frames, whose brightness changed by more than 0.05. */
    footageChange: number;
}
/**
 * Feed frames in order (any spacing) with their alpha and straight RGB; the
 * result says how much the outline changed between neighbouring frames and
 * over `gap` frames, and where it did not move. Frames are kept as 8-bit alpha
 * and luma, only as far back as a comparison can still need them. Measured at
 * full size.
 */
export declare function outlineTracker(opts?: OutlineOptions): {
    add(frame: number, alpha: ArrayLike<number>, rgb: ArrayLike<number> | null, width: number, height: number): void;
    result(): {
        at: string;
        neighbours: {
            pairs: number;
            min: number | null;
            median: number | null;
            max: number | null;
        };
        drift: {
            windows: number;
            min: number | null;
            median: number | null;
            max: number | null;
            gap: number;
        };
        limits: {
            gap: number;
            limit: number;
            minFrames: number;
            step: number;
        };
        frozen: FrozenRun[];
    };
};
/**
 * Chosen on the delivered cut-out of the 4K fresh-session test (320 frames,
 * 1080 x 1920): a thin dark sliver of chair 1 to 5 px off the right arm, on
 * frames 227 to 260, read 20 to 238 px; nothing else in the file was a piece
 * of 20 px or more apart from the body except a fingertip running off the
 * bottom edge (frame 49), which a piece touching the frame edge is not
 * counted as. Under 20 px are single specks of noise (3 px on frame 249);
 * over 2,000 px is another object, not a speck. `neck`: a piece joined to the
 * cut-out by a neck up to 2 px wide counts as apart (an opening of 1 px).
 * `minRun`: a speck stops a check only when the same piece is there on at
 * least this many frames in a row. On that file and on the cut-out matted at
 * 2176 x 3840 (cutout-12c), every piece of chair that lasted was on 2 or more
 * frames in a row (15, 2, 5 and 3), while bits on single frames (chair by the
 * left arm, a wisp of hair on frame 105) were each there for a thirtieth of a
 * second. Two files of one take: the limits and minRun come from them alone.
 */
export declare const SPECK_DEFAULTS: {
    opaque: number;
    minArea: number;
    maxArea: number;
    neck: number;
    minRun: number;
};
export interface SpeckPiece {
    x: number;
    y: number;
    width: number;
    height: number;
    area: number;
    /**
     * Mean CIELAB (D65, from the display sRGB values) over the piece's opaque
     * pixels, when the picture's RGB was given: tells a pale grey remnant (a
     * chair, a* about +7 on the first piece) from skin (a* about +30).
     */
    colour?: {
        L: number;
        a: number;
        b: number;
        pixels: number;
    };
}
/**
 * Small opaque pieces apart from the main cut-out, or joined to it only by a
 * neck up to 2 px wide: opaque at `opaque` alpha or more, `minArea` to
 * `maxArea` px, not touching the frame edge. Largest first. Works inside the
 * box around the opaque pixels and grows labels back only over the pixels
 * the erosion took (about 5.5 ms a 1080 x 1920 frame, 1.8 s for 320).
 */
export declare function speckPieces(alpha: Float64Array, width: number, height: number, opts?: Partial<typeof SPECK_DEFAULTS>, rgb?: Float64Array): SpeckPiece[];
/** The top row of the subject (alpha 0.5 or more), or -1 when there is none. */
export declare function subjectTop(alpha: Float64Array, width: number, height: number): number;
/** The frame whose matte overlaps the reference (the click frame) least: where the subject has moved furthest. */
export declare function furthestFrame(ref: Float64Array, others: Array<{
    frame: number;
    alpha: Float64Array;
}>, width: number, height: number): {
    frame: number;
    overlap: number;
};
export interface CoverageReport {
    /** Pixels solid in the matte as clicked, more than `deep` px inside its edge, that are under 0.99 in the result. */
    seenThrough: number;
    /** The lowest alpha of the result over those deep pixels (1 when nothing is seen through). */
    minAlpha: number;
    /** The rows the seen-through pixels span, or null. */
    band: {
        from: number;
        to: number;
    } | null;
    /** Result pixels at `spreadAlpha` or more lying more than `outside` px outside the outline as clicked: a smear. */
    outside: {
        px: number;
        box: {
            x: number;
            y: number;
            width: number;
            height: number;
        } | null;
    };
    deep: number;
    outsideDistance: number;
}
/**
 * The closing check of subject.soften_edge, on one frame: nothing that was
 * solid well inside the subject may become see-through (a seam, keying.md
 * fact 38), and nothing may spread far outside the outline (a smear, fact 39).
 */
export declare function matteCoverage(asClicked: Float64Array, result: Float64Array, width: number, height: number, opts?: {
    deep?: number;
    outside?: number;
    spreadAlpha?: number;
}): CoverageReport;
/**
 * Partial transparency deep inside a cut-out, read on the file alone: pixels at
 * `solid` or more (inside the body) and under `below`, more than `deep` px from
 * the nearest pixel under `solid` and from the frame's edge. A seam where two
 * copies of a matte meet reads like this; the soft edge of hair, near the
 * outline, does not. Chosen on the two files of the half-size take (the cut-out
 * as clicked and the soft edge, look C): every fourth frame read at most 82 and
 * 41 px; a band of the soft edge's alpha 20 rows high at 0.75 read 3,900 to
 * 4,400 px, and one 4 rows high at 0.9 read 760 to 890.
 */
export declare const SEEN_THROUGH_DEFAULTS: {
    solid: number;
    below: number;
    deep: number;
    minArea: number;
    minRun: number;
};
export interface SeenThroughReading {
    /** Pixels partly see-through deep inside the body. */
    px: number;
    /** The box round them, or null. */
    box: Box | null;
}
export declare function seenThroughInside(alpha: Float64Array, width: number, height: number, opts?: Partial<typeof SEEN_THROUGH_DEFAULTS>): SeenThroughReading;
//# sourceMappingURL=matte.d.ts.map