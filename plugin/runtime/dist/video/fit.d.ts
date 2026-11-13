export interface Sample {
    time: number;
    /** The move's progress, 0 at its start value and 1 at its end value (may overshoot). */
    y: number;
}
/** Nelder–Mead on f, from x0 with initial steps; bounded by clamping inside f. */
export declare function nelderMead(f: (x: number[]) => number, x0: number[], steps: number[], iterations?: number): {
    x: number[];
    value: number;
};
/** After Effects' value between two keys with zero speed: time is a cubic bezier with control points at the influences. */
export declare function aeEase(t: number, outInfluence: number, inInfluence: number): number;
/** A damped spring from rest at 0 to 1 (damping d per second, ringing frequency f Hz), t seconds after it starts. */
export declare function springFromRest(t: number, f: number, d: number): number;
export interface EaseFit {
    model: "ease";
    start: number;
    end: number;
    outInfluence: number;
    inInfluence: number;
    rms: number;
}
export interface LinearFit {
    model: "linear";
    start: number;
    end: number;
    rms: number;
}
export interface SpringFit {
    model: "spring";
    start: number;
    /** Ringing frequency (Hz) and damping (per second). */
    f: number;
    d: number;
    /** The hand study's form, from the first time the move reaches its end value: y = 1 + A e^(-d t) sin(2 pi f t). */
    A: number;
    reachesEndAt: number;
    overshoot: number;
    /** Seconds from the start until it stays within 2 % of its end. */
    settle: number;
    rms: number;
}
export type Fit = EaseFit | LinearFit | SpringFit;
/** The three fits of one move, the best (lowest rms) and how much better it is than the next (ratio of their rms). */
export declare function fitMove(s: Sample[], guess: {
    start: number;
    end: number;
}): {
    ease: EaseFit;
    linear: LinearFit;
    spring: SpringFit;
    best: Fit["model"];
    margin: number;
};
/**
 * The move as seen: its keys where it crosses `lo` and `1 - lo` of its travel (interpolated between samples, so a
 * 24 fps source is not rounded to its frames), the influences fitted with the keys held there. This is how a hand study
 * times a move, from when it visibly starts to when it visibly stops; tuned on the hand study (1.5 % put six of seven
 * of its timed moves within two frames). The free fit's keys (fitMove) are the ones that rebuild the curve exactly.
 */
export declare function fitEaseSeen(s: Sample[], lo?: number): (EaseFit & {
    seen: true;
}) | null;
/**
 * The hand study's spring on a move's tail: from the first sample at or past its end value, y - 1 = A e^(-d t) sin(2 pi f t).
 * null when the move does not overshoot.
 */
export declare function fitSpringTail(s: Sample[]): {
    A: number;
    f: number;
    d: number;
    from: number;
    rms: number;
} | null;
/** keyframe.apply's form for a fit, between value a and value b (numbers or arrays), plus the library spring and baked keys. */
export declare function keysFor(fit: Fit, a: number[], b: number[], fps: number): Record<string, unknown>;
//# sourceMappingURL=fit.d.ts.map