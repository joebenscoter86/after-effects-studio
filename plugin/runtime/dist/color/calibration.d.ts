import type { AeTransport } from "../transport/AeTransport.js";
export interface CalibrationResult {
    kind: "identity" | "linear" | "unknown";
    /** For "linear": PNG value = scale × buffer value. 1 for "identity". */
    scale: number;
    samples: Array<{
        input: number;
        output: number;
    }>;
}
export declare function calibrationKey(projectFile: string | null, workingSpace: string, bitsPerChannel: number): string;
/** Analysis half, separated for offline tests. */
export declare function analyzeCalibrationPng(buf: Buffer): CalibrationResult;
/**
 * Measure the capture transfer for the current project state. One AE round
 * trip (one undo group; the calibration comp and its solids are removed
 * before it returns). Results are cached per project/working-space/depth for
 * the lifetime of the server process.
 */
export declare function measureCaptureTransfer(transport: AeTransport, key: string, allowRender?: boolean): Promise<CalibrationResult | {
    error: string;
}>;
//# sourceMappingURL=calibration.d.ts.map