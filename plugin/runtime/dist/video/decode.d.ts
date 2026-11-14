export interface VideoTools {
    ffmpeg: string[];
    ffprobe: string[];
}
export declare const VIDEO_TOOLS: VideoTools;
export interface VideoInfo {
    file: string;
    width: number;
    height: number;
    /** Frames in the video stream. */
    frames: number;
    duration: number;
    /** The stream's nominal rate (r_frame_rate) and its average (frames over duration). */
    nominalFps: number;
    averageFps: number;
    /** Each frame's presentation time, seconds from the first frame. */
    times: number[];
    /** Whether the frame intervals differ by more than a tenth of a frame: a variable frame rate. */
    variableRate: boolean;
    /** Shortest and longest frame interval, seconds. */
    intervals: {
        min: number;
        max: number;
        median: number;
    };
}
export declare const NO_FFMPEG = "ffmpeg and ffprobe are not installed, so the video cannot be read. Install them (macOS: brew install ffmpeg; Windows: winget install ffmpeg) and try again.";
/** Probe a video file: its size, its frames' own times, and whether its rate varies. null when ffprobe is missing. */
export declare function probeVideo(file: string, tools?: VideoTools): Promise<VideoInfo | {
    error: string;
} | null>;
export interface ReadOptions {
    /** First and last frame (indices into the file's frames, inclusive). */
    from: number;
    to: number;
    /** Crop in source pixels before scaling: [x, y, width, height]. */
    crop?: [number, number, number, number];
    /** Output size (after the crop). */
    width: number;
    height: number;
    /** One channel (luma) or three (RGB). */
    gray?: boolean;
    /** Resample to this many frames a second (a census's steps); frames are then numbered from 0 and timed i / fps from the first. */
    fps?: number;
}
export interface Frame {
    index: number;
    time: number;
    data: Uint8Array;
}
/**
 * Stream frames from..to of a file, one at a time, scaled (and cropped) as asked. Seeks half a frame before the first
 * so ffmpeg starts exactly on it, and passes every coded frame through (no frames added or dropped for a nominal rate).
 */
export declare function readFrames(info: VideoInfo, o: ReadOptions, tools?: VideoTools): AsyncGenerator<Frame>;
/** Mean absolute difference of two equal-sized frames (0..255). */
export declare function meanDiff(a: Uint8Array, b: Uint8Array): number;
export interface Cadence {
    /** Frames that repeat the one before (indices). */
    repeats: number[];
    /** While something moves, every period-th frame repeats: the likely original rate, or null when there is no pattern. */
    period: number | null;
    originalFps: number | null;
    reading: string;
}
/**
 * Repeated frames and their cadence, from the frame-to-frame differences (diffs[i] = frame i against frame i - 1,
 * diffs[0] unused). A frame repeats when it differs from the one before by under `still` while the frames round it
 * move (over `moving`): a held picture is not a repeat. A 24 fps piece inside a 30 fps file repeats every fifth frame.
 */
export declare function cadenceOf(diffs: number[], fps: number, still?: number, moving?: number): Cadence;
//# sourceMappingURL=decode.d.ts.map