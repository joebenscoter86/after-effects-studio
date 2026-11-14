import { type DecodedPng } from "../color/png16.js";
import { type Json } from "./keying-shared.js";
export declare const SOFT_EDGE_COST = "The soft edge is two copies of the matte, so After Effects computes Object Matte twice for every frame: a render writes about twice the disk cache and takes several times as long (on the half-size take, 320 frames at 1088 \u00D7 1920: 342 s and 9.0 GB of cache, against 65 to 92 s and about 5 GB with one matte; subject.render_cutout counts both copies).";
/** The region's lower line: given, or `regionDepth` of the comp's height under the lowest top of the subject. */
export declare function softRegionBottom(tops: number[], compHeight: number, given?: number): number;
/**
 * JSX: build the soft edge of fact 38. Two duplicates of the matted layer
 * (both keep the selections): the upper with Refine Edge, the lower as
 * clicked, each with Decontaminate Edge Colors when asked and its sound off;
 * one solid with a feathered mask over the region, the upper copy's Alpha
 * matte and the lower's Alpha Inverted matte (applied after the effects, so
 * the two add up to one); the upper copy in Alpha Add; the three precomposed
 * into "<layer> soft edge", placed above the matted layer, which is switched
 * off and otherwise untouched (it keeps the sound).
 */
export declare function softenBuildJsx(args: {
    comp: unknown;
    layer: unknown;
    radius: number;
    smooth: number;
    chatterReduction: number;
    decontaminate: boolean;
    regionBottom: number;
    feather: number;
}): string;
/** JSX: remove what softenBuildJsx made and switch the matted layer back as it was. */
export declare function softenUndoJsx(args: {
    comp: unknown;
    layer: unknown;
}): string;
export interface SoftenIO {
    status(): Promise<Json>;
    render(args: Record<string, unknown>): Promise<Json>;
    readImage(file: string): Promise<DecodedPng>;
    execute(code: string, opts: {
        label: string;
        timeoutMs?: number;
    }): Promise<Json>;
    freeBytes?: (dir: string) => Promise<number | null>;
}
export declare function runSoftenEdge(args: Record<string, unknown>, io: SoftenIO): Promise<Json>;
//# sourceMappingURL=keying-subject-soften.d.ts.map