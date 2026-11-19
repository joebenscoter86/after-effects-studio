import { type Json } from "./keying-shared.js";
export declare const MOTION_EDGE_COST = "The motion edge keys every frame twice, with Object Matte and with the separately installed keyer, so a render does twice the keying work: the whole 8.9 s studio take (2176 \u00D7 3840, 30 fps) rendered in 986 s to ProRes 4444 (measured on one machine), roughly 2 minutes of render per second of 4K (measured on one machine). Time a few frames on the user's machine for the estimate you give them.";
export interface MotionEdgeSettings {
    keyerMatchName: string;
    keyerSettings: Record<string, number | number[]>;
    threshold: {
        black: number;
        white: number;
    };
    motionGrow: number;
    motionBlur: number;
    band: number;
}
/** The settings from the call's arguments, with the defaults filled in; or why they are refused. */
export declare function motionEdgeSettings(args: Record<string, unknown>): {
    ok: true;
    settings: MotionEdgeSettings;
} | {
    ok: false;
    error: string;
};
/**
 * JSX: refuse unless an installed effect has the keyer's match name (app.effects).
 * Leaves `_keyerName`, the effect's display name, for the code after it.
 */
export declare function motionKeyerCheckJsx(matchName: string): string;
/**
 * JSX: build the motion edge around the matted layer. Five comps, none of them
 * a copy of the user's comp:
 *  - "<layer> object matte": a copy of the matted layer as clicked (it keeps the selections);
 *  - "<layer> keyer": a copy of the take with every effect taken off and the keyer on;
 *  - "<layer> motion": the take, the take again one frame later in Difference, and an
 *    adjustment layer with Levels (the threshold), Tint, Minimax (motionGrow) and Box Blur (motionBlur);
 *  - "<layer> band": the Object Matte comp with Minimax on its alpha (band, Don't Shrink
 *    Edges), Luma-matted by the motion comp;
 *  - "<layer> motion edge": the Object Matte outline over the band (switched off) over the
 *    keyer's edge, which takes the band as its Alpha matte.
 * The last goes into the comp above the matted layer, which is switched off and otherwise
 * untouched (it keeps the sound); every copy's sound is off.
 */
export declare function motionEdgeBuildJsx(args: {
    comp: unknown;
    layer: unknown;
} & MotionEdgeSettings): string;
/** JSX: remove what motionEdgeBuildJsx made and switch the matted layer back as it was. */
export declare function motionEdgeUndoJsx(args: {
    comp: unknown;
    layer: unknown;
}): string;
export interface MotionEdgeIO {
    status(): Promise<Json>;
    execute(code: string, opts: {
        label: string;
        timeoutMs?: number;
    }): Promise<Json>;
}
export declare function runMotionEdge(args: Record<string, unknown>, io: MotionEdgeIO): Promise<Json>;
//# sourceMappingURL=keying-subject-motion.d.ts.map