/** Where inside a frame a capture is taken: a quarter in (see ae_render_frame FRAME_PICK). */
export declare const CHECK_FRAME_PICK = 0.25;
export declare function planJsx(compNameOrId: string | number): string;
/**
 * One chunk of frames. `factor` null leaves the comp's resolution as it is
 * (read-only mode); otherwise the comp is set to [factor, factor] for the
 * captures and put back in a finally, so a throw anywhere in between still
 * restores it. saveFrameToPng uses the factor in force when it is called
 * (measured live, AE 2027: [2, 2] wrote 540x960 and [4, 4] 270x480 from a
 * 1080x1920 comp), so restoring it at the end of the same script is safe;
 * Node still measures the PNG that comes back and works either way. Each
 * call returns at once and the files are written over the following seconds:
 * the settle wait in Node scales with the frame count.
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
 * whole script runs after the capture pass. Measured live (AE 2027):
 * expressionError is filled in as soon as a broken expression is set, before
 * any render ("Expression disabled. Error at line ..."), and expressionEnabled
 * stays true. Whether it is filled in a project just opened and not yet
 * rendered is not known, so the read stays after the capture pass.
 */
export declare function structureJsx(compNameOrId: string | number, o: StructureOptions): string;
//# sourceMappingURL=check-comp-jsx.d.ts.map