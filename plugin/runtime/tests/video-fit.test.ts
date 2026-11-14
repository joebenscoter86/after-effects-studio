// The move fits (stage 13) on exact curves: After Effects' ease, linear and a damped spring recovered with their
// parameters, the right one named best, and the values ready to apply.
import { describe, expect, it } from "vitest";

import { aeEase, fitMove, fitSpringTail, keysFor, springFromRest } from "../src/video/fit.js";

const fps = 30;
const sample = (n: number, fn: (t: number) => number) => Array.from({ length: n }, (_, i) => ({ time: i / fps, y: fn(i / fps) }));

describe("move fits", () => {
  it("an After Effects ease: influences and times recovered, named best", () => {
    const a = 10 / fps, b = 34 / fps, s = sample(50, (t) => aeEase((t - a) / (b - a), 0.33, 0.8));
    const r = fitMove(s, { start: 11 / fps, end: 32 / fps });
    expect(r.best).toBe("ease");
    expect(r.ease.outInfluence).toBeCloseTo(33, 0); expect(r.ease.inInfluence).toBeCloseTo(80, 0);
    expect(Math.abs(r.ease.start * fps - 10)).toBeLessThan(0.1); expect(Math.abs(r.ease.end * fps - 34)).toBeLessThan(0.1);
    expect(r.ease.rms).toBeLessThan(0.002); expect(r.margin).toBeGreaterThan(3);
    const k = keysFor(r.ease, [60], [320], fps) as any;
    expect(k.keys[0]).toMatchObject({ interp: "ease", outInfluence: r.ease.outInfluence, outSpeed: 0, value: 60 });
    expect(k.keys[1]).toMatchObject({ interp: "ease", inInfluence: r.ease.inInfluence, inSpeed: 0, value: 320 });
  });
  it("a linear move is named linear", () => {
    const s = sample(40, (t) => Math.max(0, Math.min(1, (t - 10 / fps) / (20 / fps))));
    const r = fitMove(s, { start: 10 / fps, end: 30 / fps });
    expect(r.best).toBe("linear"); expect(r.linear.rms).toBeLessThan(0.002);
  });
  it("a damped spring: frequency, damping, overshoot and the hand study's tail form", () => {
    const zeta = 0.35, omega = 12, d = zeta * omega, f = (omega * Math.sqrt(1 - zeta * zeta)) / (2 * Math.PI), t0 = 10 / fps;
    const s = sample(60, (t) => springFromRest(t - t0, f, d));
    const r = fitMove(s, { start: t0, end: 30 / fps });
    expect(r.best).toBe("spring");
    expect(r.spring.f).toBeCloseTo(f, 2); expect(r.spring.d).toBeCloseTo(d, 1);
    expect(r.spring.overshoot).toBeCloseTo(Math.exp(-zeta * Math.PI / Math.sqrt(1 - zeta * zeta)), 2);
    const tail = fitSpringTail(s)!;
    expect(tail.f).toBeCloseTo(f, 1); expect(tail.d).toBeCloseTo(d, 0); expect(tail.A).toBeCloseTo(r.spring.A, 1);
    const k = keysFor(r.spring, [0], [100], fps) as any;
    expect(k.librarySpring.freq).toBeCloseTo(f, 2); expect(k.baked.length).toBeGreaterThan(5);
  });
  it("no tail fit for a move that does not overshoot", () => {
    expect(fitSpringTail(sample(30, (t) => Math.min(1, t * 2)))).toBeNull();
  });
});
