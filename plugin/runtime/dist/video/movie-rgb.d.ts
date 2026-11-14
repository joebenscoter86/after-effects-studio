import type { DecodedPng } from "../color/png16.js";
import { probeVideo, type VideoInfo, type VideoTools } from "./decode.js";
export interface MovieColour {
    /** The YUV-to-RGB matrix and range used, as ffmpeg names them. */
    matrix: string;
    range: "tv" | "pc";
    /** What the stream's tags said (null where it said nothing), and which of matrix and range were assumed. */
    tags: {
        space: string | null;
        range: string | null;
        transfer: string | null;
        primaries: string | null;
    };
    assumed: Array<"matrix" | "range">;
    reading: string;
}
/** The colour a movie will be decoded with: its tags, and After Effects' video assumptions where they are missing. */
export declare function movieColour(file: string, tools?: VideoTools): Promise<MovieColour | null>;
/**
 * The frames at `picks` (indices into the file's frames, ascending), decoded at full size as 0..1 RGB pictures, in
 * order. Picks close together are streamed as one run (frames between them decoded and dropped); a run starts with a
 * seek, so frames spread over a long movie are not all decoded.
 */
export declare function movieFrames(info: VideoInfo, picks: number[], colour: MovieColour, tools?: VideoTools): AsyncGenerator<{
    frame: number;
    time: number;
    img: DecodedPng;
}>;
export { probeVideo };
//# sourceMappingURL=movie-rgb.d.ts.map