import { type CurveSample } from "../color/motion.js";
type Json = Record<string, any>;
export interface ChannelOptions {
    /** The picture's own rate (the original rate of a piece pulled up into another). */
    fps: number;
    atFps: number;
    /** The smallest travel worth a move, in the channel's unit. */
    minMove: number;
    /** The smallest change the measure can see, in the channel's unit (it sets where the visible span starts and ends). */
    epsAbs: number;
    /** Why the thing begins at this frame though nothing was measured before it: "appears" (the frame before was seen
     * empty) or "cut" (a shot starts here, and a move that is already moving here started with the shot). Else null. */
    beginsAt?: (frame: number) => "appears" | "cut" | null;
    /** True when a cut follows this frame: a move still moving on a shot's last frame ends with the shot (an ease in of 0). */
    endsAt?: (frame: number) => boolean;
    /** Where the visible span ends: the first frame that stays within this share of the travel from the end (0.02). */
    endShare?: number;
    /** A drift: speed under this share of the move's peak, and staying there (0.1, chosen on a drawn slide into a creep). */
    driftShare?: number;
    /** Speed (share of the travel a frame) over which "already moving" means the start was not seen. */
    movingSpeed?: number;
}
export declare function movesOfChannel(samples: CurveSample[], o: ChannelOptions): Json[];
export {};
//# sourceMappingURL=measure-move.d.ts.map