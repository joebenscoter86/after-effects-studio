/** Priming samples After Effects' AAC encoder puts at the start of the sound (measured 2026-11-12, AE 2027). */
export declare const AE_AAC_PRIMING_SAMPLES = 1024;
export declare const FFPROBE: string[];
export declare const FFMPEG: string[];
/** Run the first of `cands` that is installed; null when none is. `failed` is a non-zero exit. */
export declare function runTool(cands: string[], argv: string[], timeoutMs?: number): Promise<{
    stdout: string;
    stderr: string;
    failed: boolean;
} | null>;
/** One track's sound facts, from its boxes. */
export interface SoundTrackBoxes {
    /** Sample entry four-character code: 'mp4a' is AAC; 'sowt', 'twos', 'lpcm' and the like are PCM. */
    codec: string;
    sampleRate: number;
    /** The sound track's own timescale (mdhd), in which the edit list's media time is counted. */
    mediaTimescale: number;
    movieTimescale: number;
    /** The edit list, when there is one: entries in order. */
    edits: Array<{
        segmentDuration: number;
        mediaTime: number;
    }> | null;
}
/** The first sound track of a movie box (moov), or null when it has none. */
export declare function soundTrackFromMoov(moov: Buffer): SoundTrackBoxes | null;
/** Read only the file's movie box (moov), walking the top-level boxes by their headers. */
export declare function readMoov(file: string): Promise<Buffer | null>;
/** Where the delivered sound sits against the picture. */
export interface SoundSync {
    codec: string;
    sampleRate: number;
    /** Priming the encoder put at the start: the edit list's own skip when it has one, else After Effects' 1,024 for AAC, else 0. */
    primingSamples: number;
    /** Samples the edit list skips at the start (0 without one). */
    skippedSamples: number;
    /** Samples the sound plays late in a player (priming not skipped, plus any empty edit before it). */
    lateBySamples: number;
    lateMs: number;
    reading: string;
}
export declare function soundSyncOf(t: SoundTrackBoxes): SoundSync;
/** The delivered file's sound sync, read from its boxes; null when it has no sound track or is not an MP4/QuickTime file. */
export declare function readSoundSync(file: string): Promise<SoundSync | null>;
export interface SoundAlignment {
    aligned: boolean;
    /** How, or why not. */
    how: string;
    before?: SoundSync;
    after?: SoundSync;
}
/**
 * Put the sound on its frame: remux the file with ffmpeg (-c copy, nothing
 * re-encoded), the sound shifted back by the samples it is late, which the
 * muxer writes as an edit list on the sound track. The new file replaces the
 * old one only when its edit list is read back skipping those samples (to
 * within one); otherwise the delivered file is left as it was.
 */
export declare function alignSound(file: string, sync: SoundSync): Promise<SoundAlignment>;
export interface Loudness {
    integratedLufs: number;
    loudnessRangeLu: number | null;
    truePeakDbtp: number;
}
/** The summary ffmpeg's ebur128 filter prints at the end (peak=true), or null when there is none. */
export declare function parseEbur128Summary(stderr: string): Loudness | null;
/** volumedetect's mean and max, or nulls. */
export declare function parseVolumedetect(stderr: string): {
    meanDb: number | null;
    maxDb: number | null;
};
//# sourceMappingURL=delivery-sound.d.ts.map