import { type ReferenceReport } from "./sheet.js";
type Json = Record<string, any>;
/** The rhythm of a piece, from stage 13's census (0.1 s steps over the whole piece) and shot list. */
export interface PieceRhythm {
    seconds: number;
    census: {
        calm: number;
        local: number;
        travel: number;
        travelPerMinute: number;
        calmRunMedian: number;
        calmRunLongest: number;
        burstsPer10s: number;
    };
    shots: {
        count: number;
        cutsPerMinute: number;
        medianSeconds: number;
        shortestSeconds: number;
        longestSeconds: number;
    };
}
/** Type read from a piece's project (its text layers), when one was given. */
export interface PieceType {
    layers: number;
    fonts: string[];
    /** Text sizes as a share of the frame's height: the median layer's and the largest. */
    sizeMedian: number | null;
    sizeLargest: number | null;
    trackingMedian: number | null;
    fills: string[];
}
export interface LookPiece {
    kind: "look-piece";
    label: string;
    source: Json;
    report: ReferenceReport;
    rhythm: PieceRhythm | null;
    type: PieceType | null;
}
/** How a measure is spread and compared: by difference (a step in its unit) or by ratio (a factor). */
type How = "add" | "ratio";
interface MeasureDef {
    key: string;
    group: string;
    name: string;
    unit: string;
    how: How;
    step: number;
    floor?: number;
    digits: number;
}
interface Value {
    def: MeasureDef;
    value: number;
}
export declare const LOOK_RULES: {
    /** A measure is part of the look when its range across pieces is within this many of its comparison steps. */
    lookSteps: number;
    /** A main colour is part of the look when this share of the pieces carry it (at least two thirds). */
    colourPieces: number;
    /** Main colours under this share of a piece are left out of its palette. */
    colourShare: number;
    /** A build's colour this large with nothing like it in the pieces is named. */
    newColourShare: number;
    /** Pieces before a sheet is called a look. */
    lookPieces: number;
};
/** Every measure a piece gives. */
export declare function pieceMeasures(p: {
    report: ReferenceReport;
    rhythm?: PieceRhythm | null;
    type?: PieceType | null;
}): Value[];
export interface SheetMeasure {
    key: string;
    group: string;
    name: string;
    unit: string;
    how: How;
    step: number;
    floor?: number;
    digits: number;
    median: number;
    min: number;
    max: number;
    pieces: number;
    look: boolean;
    why?: string;
}
export interface SheetColour {
    hex: string;
    lab: [number, number, number];
    pieces: number;
    ofPieces: number;
    shareMin: number;
    shareMax: number;
    look: boolean;
}
export interface LookSheet {
    kind: "look-sheet";
    version: 1;
    pieces: Array<{
        label: string;
        file: string;
        source: Json;
    }>;
    rules: typeof LOOK_RULES;
    /** "one piece", "not yet a look" (two) or "a look" (three or more), always with how many pieces. */
    standing: string;
    measures: SheetMeasure[];
    palette: SheetColour[];
    type: {
        fonts: Array<{
            font: string;
            pieces: number;
        }>;
        pieces: number;
    } | null;
    notMeasured: string[];
    notes: string[];
}
/** The shot list's known limit, said beside the shot lengths. */
export declare const SHOT_LIMIT = "Shot lengths come from video.shots, which can read a change inside a shot (a launch, a flip) as a cut, so a shot can read shorter than it is.";
/** A sheet from pieces (with the file each was saved to). */
export declare function buildSheet(pieces: Array<{
    piece: LookPiece;
    file: string;
}>): LookSheet;
export interface SheetDifference {
    measure: string;
    size: number;
    reading: string;
    value: number | string;
    range?: [number, number];
    pieces: number;
}
/** A piece (a report, with its rhythm and type when measured) compared with a sheet: only the look's measures, against the user's own range. */
export declare function compareWithSheet(sheet: LookSheet, piece: {
    report: ReferenceReport;
    rhythm?: PieceRhythm | null;
    type?: PieceType | null;
}): Json;
export declare function isSheet(x: unknown): x is LookSheet;
export declare function isPiece(x: unknown): x is LookPiece;
/** The sheet's readable page: the look first, then what varies, the colours, the rhythm's limits and what was not measured. */
export declare function sheetMarkdown(s: LookSheet): string;
export {};
//# sourceMappingURL=look.d.ts.map