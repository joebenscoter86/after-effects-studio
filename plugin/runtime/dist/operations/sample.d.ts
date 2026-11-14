type Json = any;
export interface MotionSoundIO {
    execute(code: string, opts: {
        label: string;
        timeoutMs: number;
        undoGroup?: boolean;
    }): Promise<Json>;
}
export declare function runCurve(args: Record<string, unknown>, io: MotionSoundIO): Promise<Json>;
/** Convert Audio to Keyframes' amplitude under this on every frame is silence (about -57 dB of full scale on its scale: 0.3 of full scale reads 21.2). */
export declare const SILENCE_BELOW = 0.1;
export declare function runSoundMarkers(args: Record<string, unknown>, io: MotionSoundIO): Promise<Json>;
export declare function runSync(args: Record<string, unknown>, io: MotionSoundIO): Promise<Json>;
export {};
//# sourceMappingURL=sample.d.ts.map