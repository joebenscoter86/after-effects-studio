/**
 * Said by every operation that changes the render queue (stage 7). serve.jsx
 * enforces it; this tells the caller before they find out by a refusal.
 */
export declare const RENDER_QUEUE_UNDO_WARNING = " After this, undo and rollback are refused for the rest of the After Effects session unless acceptRenderQueueRisk: true: After Effects 2027 has gone into crash recovery on undo after scripted render-queue changes (observed twice on 2026-11-10; a precaution, not a proven cause). Save the project before undoing anything afterwards; project.open / project.new clear the block.";
/** Said on every render.preview answer and on a list that used a temporary item. */
export declare const QUEUE_CHANGE_NOTE = "the project is left modified (unsaved): a render-queue item was added and removed. Nothing in the comps changed; save or revert as you normally would";
export declare const PARK_QUEUE_FN = "\n    function _parkQueue(rq) {\n        var _parked = [];\n        for (var _pi = 1; _pi <= rq.numItems; _pi++) {\n            var _ex = rq.item(_pi);\n            var _was = false;\n            try { _was = _ex.render; } catch (eR) {}\n            _parked.push(_was);\n            if (_was) { try { _ex.render = false; } catch (eP) {} }\n        }\n        return _parked;\n    }\n    function _unparkQueue(rq, _parked) {\n        for (var _ui = 0; _ui < _parked.length && _ui < rq.numItems; _ui++) {\n            if (_parked[_ui]) { try { rq.item(_ui + 1).render = true; } catch (eU) {} }\n        }\n    }\n";
type Json = any;
/**
 * Output templates a stock install has (Adobe's notes: High Quality and High
 * Quality with Alpha, ProRes 422 and 4444, since 2021; H.264 - Match Render
 * Settings at 5, 15 and 40 Mbps, 15 the default after a fresh install).
 * Lossless and Lossless with Alpha were present on the Mac this was built on
 * but are not named stock anywhere found; they are only fallbacks. A template
 * can be deleted, so each preset reads the list and says when it falls back.
 */
export declare const DELIVERY_PRESETS: Record<string, {
    what: string;
    first: string;
    then: Array<string | RegExp>;
    fallback: Array<string | RegExp>;
    fallbackWhy: string;
    alpha: boolean;
    aspect?: number;
}>;
export declare function chooseDeliveryTemplate(preset: string, templates: string[]): {
    template: string;
    fallback: boolean;
    why: string;
} | {
    error: string;
};
export interface CompFacts {
    width: number;
    height: number;
    frameRate: number;
    duration: number;
    hasSound: boolean;
    soundLayers: string[];
}
export interface FileFacts {
    width: number;
    height: number;
    frameRate: number;
    duration: number;
    hasAudio: boolean;
    /** From ffmpeg (dB) or from After Effects' Convert Audio to Keyframes (amplitude top), or null. */
    level: {
        source: "ffmpeg";
        meanDb: number;
        maxDb: number;
    } | {
        source: "After Effects";
        top: number;
    } | null;
}
/** Convert Audio to Keyframes' amplitude under this on every frame is silence (stage 6: a 0.3 tone reads 21.2, a four-channel take 0.002). */
export declare const DELIVERY_SILENCE_TOP = 0.1;
/** ffmpeg's max_volume at or under this is silence. */
export declare const DELIVERY_SILENCE_DB = -60;
/** The file against its comp: size, frame rate, duration (within half a frame), and sound when the comp has some. */
export declare function checkDelivered(comp: CompFacts, file: FileFacts): {
    passed: boolean;
    findings: {
        kind: string;
        reading: string;
    }[];
    comp: CompFacts;
    file: FileFacts;
    reading: string;
};
export interface DeliverIO {
    execute(code: string, opts: {
        label: string;
        timeoutMs: number;
        undoGroup?: boolean;
    }): Promise<Json>;
    exists?(file: string): Promise<boolean>;
    freeBytes?(dir: string): Promise<number | null>;
    /** ffprobe and ffmpeg's reading of the file, or null when they are not there. */
    probe?(file: string): Promise<{
        width: number;
        height: number;
        frameRate: number;
        duration: number;
        hasAudio: boolean;
        meanDb: number | null;
        maxDb: number | null;
    } | null>;
}
export declare function runDeliver(args: Record<string, unknown>, io: DeliverIO): Promise<Json>;
/** ffprobe's streams and ffmpeg's volumedetect, when both are installed; only reads the file. */
export declare function probeDelivered(file: string): Promise<{
    width: any;
    height: any;
    frameRate: number;
    duration: number;
    hasAudio: any;
    meanDb: number | null;
    maxDb: number | null;
} | null>;
export {};
//# sourceMappingURL=render.d.ts.map