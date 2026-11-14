import { type FrozenRun, type Box, type FrameEdge } from "../color/matte.js";
import { type DecodedPng } from "../color/png16.js";
import type { AeTransport } from "../transport/AeTransport.js";
export declare const compLayerParams: {
    name: string;
    type: "any";
    description: string;
    required: boolean;
}[];
/** JSX: `_fxRoot` = the layer's effect stack. */
export declare const FX_ROOT_JSX = "\n            var _fxRoot = _layer.property(\"ADBE Effect Parade\");\n            if (!_fxRoot) return { ok: false, error: \"layer '\" + _layer.name + \"' cannot carry effects\" };\n";
export declare const OBJECT_MATTE_MATCH_NAME = "ADBE Samurai";
export declare const OBJECT_MATTE_SELECTIONS_MATCH_NAME = "ADBE Samurai Strokes Group";
/** For the agent: how a whole piece's cut-out was rendered in production (2026-11-12). */
export declare const SUBJECT_WHOLE_PIECE_NOTE: string;
/** Two clicks closer than this share of the source's shorter side probably selected the same thing. */
export declare const CLOSE_CLICK_SHARE = 0.05;
export declare const COUNT_NOTE = "A selection count is not a check: it does not say what was selected. Run subject.check and look at its picture before building anything on the cut-out.";
export declare const NEED_CLICK = "run subject.prepare and ask the user for the click, relaying its steps word for word";
export declare const subjectIndexParam: {
    name: string;
    type: "number";
    description: string;
    required: boolean;
};
/** A hole or opening at least this big (px at the comp's size) is a finding the agent stops on and shows. */
export declare const CUTOUT_HOLE_LIMIT = 1000;
export declare const CUTOUT_OVER = "#ff00ff";
/** Settle time asked of ae_render_frame per frame. Measured: 20 to 40 s a frame the first time on a 2176 x 3840 take. */
export declare const CUTOUT_SECONDS_PER_FRAME = 60;
/** ae_render_frame's largest settleTimeoutMs. */
export declare const SETTLE_MAX_MS = 600000;
export declare const THUMB = 360;
/** zlib level for the check's own pictures: 3.5 times faster than the default 6 on a synthetic 1080 x 1920 frame with noise, for files about 3% larger. */
export declare const PICTURE_DEFLATE = 1;
export type RegionBox = Box & {
    area: number;
    edges?: FrameEdge[];
};
export interface RegionFinding {
    kind: "hole" | "opening";
    frames: number[];
    smallestArea: number;
    largestArea: number;
    /** The frame where it was largest. */
    largestFrame: number;
    box: Box;
    edges?: FrameEdge[];
}
export declare const intersects: (a: Box, b: Box) => boolean;
export declare const union: (a: Box, b: Box) => Box;
export declare const fmt: (n: number) => string;
export declare const boxText: (b: Box) => string;
export declare const plural: (n: number, one: string, many?: string) => string;
export declare const boxArea: (b: Box) => number;
export declare const iou: (a: Box, b: Box) => number;
/**
 * Two regions are alike (the same thing on two frames, or on two renders of
 * one frame) when their boxes overlap by at least half their union, or when
 * they overlap and their areas are within a factor of two. A small opening
 * under a microphone stand inside the box of a missed microphone is not
 * alike to it (2026-11-11: 1,862 px against 114,769 px).
 */
export declare function alikeRegions(a: Box & {
    area: number;
}, b: Box & {
    area: number;
}): boolean;
/** An `accept` entry: a plain box (it accepts openings) or { box, kind }. */
export type AcceptEntry = Box | {
    box: Box;
    kind?: "hole" | "opening" | "speck";
}
/** A frozen outline seen and accepted (a subject that really is still), optionally only over these frames. */
 | {
    kind: "frozen";
    from?: number;
    to?: number;
};
export declare const isFrozenEntry: (e: AcceptEntry) => e is {
    kind: "frozen";
    from?: number;
    to?: number;
};
/** Whether a frozen run is one the user accepted: an entry of kind frozen, over frames that overlap it (or any). */
export declare function frozenAccepted(run: FrozenRun, accept: AcceptEntry[]): boolean;
/**
 * Whether a finding is one the user accepted: an entry of the same kind
 * (openings unless the entry says "hole") whose box overlaps the finding's by
 * at least half their union. A hole is never accepted through an opening's
 * box, and a box does not accept what merely lies inside it.
 */
export declare function acceptedBy(f: RegionFinding, accept: AcceptEntry[]): boolean;
/** Holes and openings at least `limit` px, each kind grouped across frames where they are alike. */
export declare function cutoutFindings(frames: Array<{
    frame: number;
    holes?: RegionBox[] | null;
    openings?: RegionBox[] | null;
}>, limit: number): RegionFinding[];
export type Json = any;
/** Every After Effects call subject.check and subject.fill_gaps make. */
export interface CutoutIO {
    /** subject.status for the layer. */
    status(): Promise<Json>;
    /** ae_render_frame with these arguments; its result payload, or { ok: false, error }. */
    render(args: Record<string, unknown>): Promise<Json>;
    /** A written PNG, decoded. */
    readImage(file: string): Promise<DecodedPng>;
    /** The fill's build in After Effects (fillBuildJsx). */
    build(args: {
        comp: unknown;
        layer: unknown;
        stillPath: string;
    }): Promise<Json>;
    /** Undo the fill's build (fillUnbuildJsx). */
    unbuild(args: {
        comp: unknown;
        fillLayer: string;
        maskLayer: string;
        stillItemId: number | null;
    }): Promise<Json>;
    writePng?(file: string, data: Buffer): Promise<void>;
    /** Free bytes on the volume holding `dir` (default: fs.statfs), or null when unknown. */
    freeBytes?(dir: string): Promise<number | null>;
    /** Which volume holds `dir` (default: the device of its nearest existing folder). */
    volumeOf?(dir: string): Promise<string | number | null>;
}
/** What the pixel helpers need from After Effects: a render, and the files it wrote. */
export type PixelIO = Pick<CutoutIO, "render" | "readImage" | "writePng" | "freeBytes" | "volumeOf">;
export declare function writePng(io: PixelIO, file: string, data: Buffer): Promise<void>;
export declare const GB = 1000000000;
export declare const gb: (n: number) => string;
/** On top of what a check writes (captures, pictures): 1 GB. */
export declare const PICTURE_MARGIN_BYTES: number;
/** One raw RGBA capture at most (uncompressed 8 bit): the upper bound used for a check's files. */
export declare const captureBytes: (size: [number, number] | number[] | null | undefined) => number;
/** Free bytes on the volume holding `dir`, read on its nearest existing folder; null when it cannot be read. */
export declare function statfsFree(dir: string): Promise<number | null>;
/** null when `dir` has room for `needed` plus `margin`; otherwise a refusal that says the numbers. */
export declare function spaceRefusal(io: {
    freeBytes?(dir: string): Promise<number | null>;
}, dir: string, needed: number, margin: number, what: string): Promise<Json | null>;
/**
 * After Effects' disk cache written while it tracks Object Matte through
 * `frames` frames of a source this size: one 16-bit RGBA frame of the source
 * per frame (8 bytes a pixel). Measured: one render of 320 frames of a 2176 x
 * 3840 take added about 19 GB (estimate 21.4 GB).
 */
export declare function cacheBytesFor(frames: number, sourceSize: [number, number] | number[] | null | undefined): number;
/** The volume holding `dir`: the device number of its nearest existing folder, or null. */
export declare function volumeKey(dir: string): Promise<number | null>;
export type SpaceParts = {
    movie?: number;
    cache?: number;
    pictures?: number;
};
export declare const PART_NAMES: Record<keyof SpaceParts, string>;
/**
 * Room for each part on the drive that holds it: the parts on one volume are
 * added up and checked against that volume's free space plus `margin`. A
 * refusal names the first drive short of room, with every part and number.
 */
export declare function spacePlan(io: {
    freeBytes?(dir: string): Promise<number | null>;
    volumeOf?(dir: string): Promise<string | number | null>;
}, entries: Array<{
    where: string;
    parts: SpaceParts;
}>, margin: number, what: string): Promise<{
    volumes: Json[];
    refusal: Json | null;
}>;
/** The frames After Effects tracks through to render `frames`: the first to the last asked for. */
export declare const trackedSpan: (frames: number[]) => number;
/** Where After Effects keeps its disk cache: <Disk Cache folder>/Adobe/After Effects/<major.minor>. */
export declare function aeCacheRoot(folder: string | null | undefined, version: string | null | undefined): string | null;
/** Defaults for the frozen-outline finding (see outlineTracker); not yet calibrated live on a frozen and a real file. */
export declare const FROZEN_DEFAULTS: {
    gap: number;
    limit: number;
    minFrames: number;
};
export declare const frozenOpts: (args: Record<string, unknown>) => {
    gap: number;
    limit: number;
    minFrames: number;
};
/** A frozen run as a finding, with what it probably means and how to wave it through. */
export declare function frozenFinding(run: FrozenRun, pictures: Array<string | null>): Json;
/** Time spent in the renders a call made, summed over its ae_render_frame calls (ms). */
export interface RenderTally {
    frames: number;
    calls: number;
    ms: number;
    aeCallMs: number;
    settleMs: number;
    renderNodeMs: number;
}
/** Time spent on the pixels in Node (ms): reading the files, finding regions, writing the pictures and the sheet. */
export interface PixelTally {
    frames: number;
    readMs: number;
    regionsMs: number;
    picturesMs: number;
    sheetMs: number;
    ms: number;
}
export declare const renderTally: () => RenderTally;
export declare const pixelTally: () => PixelTally;
export declare const since: (t: number) => number;
export declare const roundTally: <T extends object>(t: T) => T;
export interface RenderedFrame {
    frame: number;
    ok: boolean;
    file?: string;
    error?: string;
    edge?: Json;
}
/**
 * Render `frames` with `base` arguments, in as many ae_render_frame calls as
 * its settle limit needs at `perFrameMs` a frame. A call that fails marks its
 * frames failed; a frame that did not settle comes back failed with
 * ae_render_frame's error.
 */
export declare function renderChunked(io: PixelIO, base: Record<string, unknown>, frames: number[], perFrameMs: number, outDir: string, stem: string, tally?: RenderTally, firstCall?: number): Promise<RenderedFrame[]>;
export declare function parseHex(c: string): [number, number, number];
export interface FrameReading {
    frame: number;
    checked: boolean;
    file?: string;
    picture?: string;
    holes: RegionBox[] | null;
    openings: RegionBox[] | null;
    opaqueShare?: number;
    holesUnderLimit?: {
        count: number;
        area: number;
    };
    openingsUnderLimit?: {
        count: number;
        area: number;
    };
    edgeWidth?: {
        typical: number | null;
        p90: number | null;
    } | null;
    solidAreas?: number | null;
    error?: string;
}
/** Read each rendered frame's alpha: holes and openings, a picture over `over`, and one contact sheet. */
export declare function measureFrames(io: PixelIO, rendered: RenderedFrame[], limit: number, over: string, sheetPath: string, tally?: PixelTally, pictures?: boolean, onImage?: (r: FrameReading, img: DecodedPng) => void): Promise<{
    readings: FrameReading[];
    picture: string | null;
}>;
export declare function regionLines(findings: RegionFinding[], frames: number): string[];
export declare const needSelection: (st: Json) => string | null;
export declare const perFrameMsOf: (args: Record<string, unknown>) => number;
/** The findings over the limit, the not-checked frames, and a plain statement, for a set of readings. */
export declare function summarize(readings: FrameReading[], limit: number, accept: AcceptEntry[], picture?: string | null, passText?: string | null): {
    findings: Json[];
    accepted: RegionFinding[];
    checked: {
        frames: number;
        of: number;
    };
    text: string;
};
export type KindRegion = RegionBox & {
    kind: "hole" | "opening";
};
export declare const regionsOf: (r: FrameReading) => KindRegion[];
/** A rendered frame drawn over the flat colour, written next to it as <file>_over.png. */
export declare function overPicture(io: PixelIO, file: string, over: string): Promise<string | null>;
/** JSX: remove subject.fill_gaps' two layers and its imported still. */
export declare function fillUnbuildJsx(args: {
    comp: unknown;
    fillLayer: string;
    maskLayer: string;
    stillItemId: number | null;
}): string;
/**
 * JSX for subject.fill_gaps' build: import the still, add it as a hidden
 * layer, duplicate the footage layer directly under the cut-out with its
 * Object Matte removed, and give the copy the still as its luma track matte
 * (setTrackMatte; its ALPHA form was confirmed in After Effects 27.0, LUMA was
 * not). Refuses when a fill is already there.
 */
export declare function fillBuildJsx(args: {
    comp: unknown;
    layer: unknown;
    stillPath: string;
}): string;
/** The CutoutIO a live call uses: subject.status and ae_render_frame through `transport`. */
export declare function liveCutoutIO(args: Record<string, unknown>, transport: AeTransport): CutoutIO;
export declare const NODE_ONLY: (name: string) => string;
export declare const overParam: {
    name: string;
    type: "string";
    description: string;
    required: boolean;
};
/** What subject.render_cutout and subject.check_file need from After Effects. */
export interface FileIO extends PixelIO {
    /** Run ExtendScript; its result, or { ok: false, error }. */
    execute(code: string, opts: {
        label: string;
        timeoutMs: number;
        undoGroup?: boolean;
    }): Promise<Json>;
    /** Whether a file exists on this machine (default: fs.access). */
    exists?(file: string): Promise<boolean>;
}
/** Default most frames subject.check_file reads one by one; beyond it, it reads pairs in steps. About 0.55 s a frame measured. */
export declare const CHECK_FILE_MAX_FRAMES = 400;
/** JSX: the movie (a file, or a footage item by id) in a throwaway comp of its own size. */
export declare function fileCompJsx(args: {
    path: string | null;
    item: number | null;
}): string;
/** JSX: remove the throwaway comp, and the imported footage item when asked. */
export declare function fileCleanupJsx(args: {
    compId: number;
    itemId: number | null;
    removeItem: boolean;
}): string;
/** The FileIO a live call uses. */
export declare function liveFileIO(transport: AeTransport): FileIO;
/**
 * Look C of keying.md fact 39, the user's choice for a person: Base Refine
 * Edge Radius 8, Smooth 0, Chatter Reduction 2, Decontaminate Edge Colors on
 * both copies. The region is everything above a line; by default that line
 * sits `regionDepth` of the comp's height under the lowest top of the subject
 * on the frames sampled (on the half-size take: tops 776 to 792, line 1022,
 * where the hair ends at the temples). Feather 60 px, as measured.
 */
export declare const SOFT_EDGE_DEFAULTS: {
    radius: number;
    smooth: number;
    chatterReduction: number;
    decontaminate: boolean;
    feather: number;
    regionDepth: number;
    /** By default the check samples the click frame and every `nearStep`th frame after it, up to `near` frames on. */
    near: number;
    nearStep: number;
    /** The closing check: a pixel solid in the matte as clicked and more than this far inside its edge must stay solid. */
    deep: number;
    /** Matte more than this far outside the outline as clicked counts as spread (a smear). */
    outside: number;
    /** Spread pixels allowed before the build is undone (look C left 0 to 12 px on the take; look D's smear was 156). */
    outsideLimit: number;
    /** Face colour against the matte as clicked, CIELAB difference allowed. */
    colourLimit: number;
};
//# sourceMappingURL=keying-shared.d.ts.map