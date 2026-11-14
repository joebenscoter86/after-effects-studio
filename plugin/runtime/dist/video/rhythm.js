// A piece's rhythm for the look sheet (stage 11): stage 13's census over the whole piece (0.1 s steps) and its shot
// list, run into a temporary folder and reduced to numbers. Nothing of the pictures is kept.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCensus, runShots } from "./run-shots-census.js";
/** The rhythm of a movie, or an error. */
export async function measureRhythm(file) {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "look-rhythm-"));
    try {
        const census = await runCensus({ file, outDir: path.join(tmp, "census") });
        if (!census.ok)
            return { error: census.error };
        const shotsReply = await runShots({ file, outDir: path.join(tmp, "shots"), pictures: false });
        if (!shotsReply.ok)
            return { error: shotsReply.error };
        const shots = JSON.parse(await fs.readFile(path.join(tmp, "shots", "shots.json"), "utf8"));
        const fps = shots.video.nominalFps || 30, seconds = shots.video.frames / fps;
        const lengths = shots.shots.map((s) => (s.to - s.from + 1) / fps).sort((a, b) => a - b);
        const mid = lengths.length ? (lengths.length % 2 ? lengths[lengths.length >> 1] : (lengths[lengths.length / 2 - 1] + lengths[lengths.length / 2]) / 2) : seconds;
        const c = census.cadence, r = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
        return {
            seconds: r(seconds, 2),
            census: { calm: c.shares.calm, local: c.shares.local, travel: c.shares.travel, travelPerMinute: c.travel.perMinute, calmRunMedian: c.calmRuns.medianSeconds, calmRunLongest: c.calmRuns.maxSeconds, burstsPer10s: c.burstsPer10s },
            shots: { count: lengths.length, cutsPerMinute: r((shots.cuts.length / Math.max(1e-6, seconds)) * 60, 2), medianSeconds: r(mid, 2), shortestSeconds: r(lengths[0] ?? seconds, 2), longestSeconds: r(lengths[lengths.length - 1] ?? seconds, 2) },
        };
    }
    finally {
        await fs.rm(tmp, { recursive: true, force: true });
    }
}
//# sourceMappingURL=rhythm.js.map