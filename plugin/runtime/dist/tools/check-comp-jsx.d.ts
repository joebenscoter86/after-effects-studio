/** Where inside a frame a capture is taken: a quarter in (see ae_render_frame FRAME_PICK). */
export declare const CHECK_FRAME_PICK = 0.25;
export declare function planJsx(compNameOrId: string | number): string;
/**
 * One chunk of frames. `factor` null leaves the comp's resolution as it is
 * (read-only mode); otherwise the comp is set to [factor, factor] for the
 * captures and put back in a finally, so a throw anywhere in between still
 * restores it. Nobody has confirmed that saveFrameToPng honours
 * resolutionFactor: Node measures the PNG that comes back and works either way.
 */
export declare function captureJsx(compNameOrId: string | number, frames: number[], paths: string[], factor: number | null, tryOcio: boolean): string;
export interface StructureOptions {
    /** The checked range, comp seconds from the comp's start: [from, to). */
    from: number;
    to: number;
    /** Regular sample step for bounds, seconds. */
    step: number;
    /** Inset of the safe area from each edge, comp pixels: [left, top, right, bottom]. */
    margins: [number, number, number, number];
    /** "text": text layers only; "all": every visible layer that has pixels. */
    boundsOf: "text" | "all";
    /** Bounds samples per layer at most (evenly thinned beyond it). */
    maxSamples: number;
    /** Findings and errors reported at most, per list. */
    maxItems: number;
    /** Properties visited at most while looking for expression errors. */
    maxProperties: number;
}
/**
 * The read-only structure checks. Expressions in error are read last, and the
 * whole script runs after the capture pass: expressionError may only be filled
 * in once After Effects has evaluated the expression, which rendering the
 * frames makes it do (to be confirmed live).
 */
export declare function structureJsx(compNameOrId: string | number, o: StructureOptions): string;
//# sourceMappingURL=check-comp-jsx.d.ts.map