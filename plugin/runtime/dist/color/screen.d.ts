import { type Box } from "./matte.js";
import type { DecodedPng } from "./png16.js";
import type { Rgb } from "./sheet.js";
export type ScreenKind = "green" | "blue";
export interface ScreenThresholds {
    /** Which screen to look for; "auto" picks whichever of green or blue has more screen pixels. */
    screen: "auto" | ScreenKind;
    /** The screen channel must lead the larger other channel by at least this (capture values). */
    minExcess: number;
    /** …and by at least this share of its own level. */
    minDominance: number;
    /** Fewer screen pixels than this share of the measured ones means no screen. */
    minScreenShare: number;
    /** Pixels with alpha below this are left out (masked, transparent, or mixed with the background). */
    opaque: number;
    /** Evenness grid. */
    columns: number;
    rows: number;
    /** A cell needs at least this share of screen pixels to count as darkest or brightest. */
    minCellShare: number;
    /** The near-subject band starts this many px from the subject (skips its soft edge and spill)… */
    nearSkip: number;
    /** …and is this many px wide. */
    nearBand: number;
    /** A brightest / darkest level ratio above this reads as uneven. */
    unevenRatio: number;
    /** A screen-channel grain standard deviation above this reads as grainy. */
    grainAbove: number;
}
export type ScreenArgs = Partial<ScreenThresholds>;
/**
 * The defaults and why:
 * - minExcess 0.04 (about ten 8-bit steps): the real screen measured live
 *   (2026-11-10) led by 0.13 to 0.16 in its lit parts and about 0.06 in its
 *   darkest corner; skin, grey and brown lead by zero or less.
 * - minDominance 0.15: the lead must be a real share of the level, so a
 *   near-black pixel with a little green noise is not screen. The measured
 *   screen sat at 0.25 to 0.35.
 * - minScreenShare 0.02: below that, what leans green is set dressing or
 *   spill, not a screen.
 * - opaque 1 − 2/255, as `edge` and `sample` count opaque.
 * - grid: four cells across the shorter side, square-ish cells (4 × 7 at
 *   1080×1920, 7 × 4 at 1920×1080). The live measurement used 4 × 6.
 * - minCellShare 0.25: a cell that is mostly subject says little about the screen.
 * - nearSkip 1% of the shorter side, at least 2 px (11 at 1080): past the
 *   subject's soft edge and the worst spill. nearBand 5%, at least 4 px (54 at
 *   1080): close enough to be the screen the key meets at the subject.
 * - unevenRatio 1.1: a 10% spread in level is about what one Screen Colour
 *   with modest Clip settings absorbs; the measured screen was 1.5x.
 * - grainAbove 0.01 (about 2.5 8-bit steps): finer grain is quantisation.
 */
export declare const SCREEN_DEFAULTS: Omit<ScreenThresholds, "columns" | "rows" | "nearSkip" | "nearBand"> & {
    columns: "auto";
    rows: "auto";
    nearSkip: "auto";
    nearBand: "auto";
};
/** Said with every report: what the colours are, and what that means for Keylight. */
export declare const SCREEN_COLOUR_NOTE: string;
/** Caller overrides on top of the defaults, for a frame of this size. */
export declare function resolveScreenThresholds(args: ScreenArgs, width: number, height: number): ScreenThresholds;
/** Why a set of caller thresholds cannot be used, or null when it can. */
export declare function screenArgsError(args: Record<string, unknown>): string | null;
export interface ScreenCell {
    column: number;
    row: number;
    box: Box;
    /** Share of the cell's measured pixels that are screen. */
    screenShare: number;
    /** Mean capture colour of the cell's screen pixels; null when it has none. */
    mean: Rgb | null;
    /** Rec. 709 luma of `mean` (capture values, not linear light). */
    luma: number | null;
    /** The screen channel of `mean`: what the key keys on. */
    level: number | null;
}
export interface ScreenReport {
    /** Always "capture": the render as saveFrameToPng wrote it. */
    stage: "capture";
    /** The colours are capture values; see screenColourNote. */
    values: "capture";
    screen: ScreenKind | null;
    chosen: "detected" | "given";
    pixels: number;
    /** Opaque pixels: the ones measured. */
    measured: number;
    /** Pixels below `opaque`, left out. */
    leftOut: number;
    screenPixels: number;
    /** screenPixels / measured. */
    share: number;
    bounds: Box | null;
    colour: {
        median: Rgb;
        mean: Rgb;
        /** Median of the screen pixels nearSkip..nearSkip+nearBand px from the subject. */
        nearSubject: {
            colour: Rgb;
            pixels: number;
            band: {
                from: number;
                to: number;
            };
        } | null;
    } | null;
    subject: {
        box: Box;
        area: number;
        share: number;
    } | null;
    evenness: {
        columns: number;
        rows: number;
        cellWidth: number;
        cellHeight: number;
        cells: ScreenCell[];
        darkest: ScreenCell | null;
        brightest: ScreenCell | null;
        /** brightest.level / darkest.level. */
        levelRatio: number | null;
        lumaRatio: number | null;
        uneven: boolean;
        /**
         * Where screen was measured: the 5th to 95th percentile of the screen
         * pixels' x and y. horizontal and vertical are read across it.
         */
        extent: Box;
        /** Fitted level at the extent's right end / its left end, and bottom / top, through the screen's centroid. */
        horizontal: number | null;
        vertical: number | null;
        /** Every side darker by more than unevenRatio, strongest first; empty when none is. */
        darkerSide: Array<"left" | "right" | "top" | "bottom">;
        reading: string;
    } | null;
    grain: {
        /** Per channel, capture values. */
        stdDev: Rgb;
        /** The screen channel's standard deviation. */
        level: number;
        steps8bit: number;
        samples: number;
        grainy: boolean;
        reading: string;
    } | null;
    reading: string;
    warning?: string;
    screenColourNote: string;
}
/**
 * Measure the screen in one render of the un-keyed source. Throws nothing on
 * a frame without a screen: it says so in `reading`.
 */
export declare function measureScreen(img: DecodedPng, t: ScreenThresholds): ScreenReport;
//# sourceMappingURL=screen.d.ts.map