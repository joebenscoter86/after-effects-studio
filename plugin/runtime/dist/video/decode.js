// Reading a video file with ffmpeg, frame-exact, without After Effects (stage 13). Each frame's own timestamp is read
// from the file (references come out of social apps re-encoded, sometimes at a variable rate), frames are streamed
// through a pipe a few at a time (never a whole clip in memory), and frames that repeat the one before are found and
// their cadence read, so a 24 fps piece inside a 30 fps file is fitted on its own 24 frames at their own times.
import { spawn } from "node:child_process";
import { FFMPEG, FFPROBE, runTool } from "../operations/delivery-sound.js";
export const VIDEO_TOOLS = { ffmpeg: FFMPEG, ffprobe: FFPROBE };
export const NO_FFMPEG = "ffmpeg and ffprobe are not installed, so the video cannot be read. Install them (macOS: brew install ffmpeg; Windows: winget install ffmpeg) and try again.";
function rate(s) {
    if (!s)
        return NaN;
    const [a, b] = s.split("/").map(Number);
    return b ? a / b : a;
}
/** Probe a video file: its size, its frames' own times, and whether its rate varies. null when ffprobe is missing. */
export async function probeVideo(file, tools = VIDEO_TOOLS) {
    const head = await runTool(tools.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height,r_frame_rate,avg_frame_rate,duration:format=duration", "-of", "json", file], 60_000);
    if (head === null)
        return null;
    if (head.failed)
        return { error: `ffprobe could not read ${file}: ${head.stderr.trim().slice(0, 300)}` };
    let j;
    try {
        j = JSON.parse(head.stdout);
    }
    catch {
        return { error: `ffprobe gave no stream information for ${file}` };
    }
    const st = j.streams?.[0];
    if (!st)
        return { error: `${file} has no video stream` };
    // Packet times (no decoding), sorted into presentation order.
    const pk = await runTool(tools.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time", "-of", "csv=p=0", file], 120_000);
    if (pk === null)
        return null;
    // (an empty line would read as 0, a phantom frame that shifts every time by one)
    const raw = pk.stdout.split("\n").map((l) => l.split(",")[0].trim()).filter((l) => l !== "" && l !== "N/A").map(Number).filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
    if (!raw.length)
        return { error: `${file} has no video frames` };
    const t0 = raw[0], times = raw.map((t) => t - t0);
    const iv = [];
    for (let i = 1; i < times.length; i++)
        iv.push(times[i] - times[i - 1]);
    const sorted = [...iv].sort((a, b) => a - b), med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const nominal = rate(String(st.r_frame_rate)), duration = Number(j.format?.duration ?? st.duration ?? times[times.length - 1] + med);
    return {
        file,
        width: Number(st.width),
        height: Number(st.height),
        frames: times.length,
        duration,
        nominalFps: nominal,
        averageFps: duration > 0 ? times.length / duration : nominal,
        times,
        variableRate: sorted.length > 1 && sorted[sorted.length - 1] - sorted[0] > 0.1 * med,
        intervals: { min: sorted[0] ?? 0, max: sorted[sorted.length - 1] ?? 0, median: med },
    };
}
/**
 * Stream frames from..to of a file, one at a time, scaled (and cropped) as asked. Seeks half a frame before the first
 * so ffmpeg starts exactly on it, and passes every coded frame through (no frames added or dropped for a nominal rate).
 */
export async function* readFrames(info, o, tools = VIDEO_TOOLS) {
    const from = Math.max(0, Math.min(info.frames - 1, o.from)), to = Math.max(from, Math.min(info.frames - 1, o.to));
    const half = (info.intervals.median || 1 / 30) / 2, seek = Math.max(0, info.times[from] - half);
    const filters = [];
    if (o.fps)
        filters.push(`fps=${o.fps}`);
    if (o.crop)
        filters.push(`crop=${Math.round(o.crop[2])}:${Math.round(o.crop[3])}:${Math.round(o.crop[0])}:${Math.round(o.crop[1])}`);
    filters.push(`scale=${o.width}:${o.height}:flags=area`);
    const count = o.fps ? Math.max(1, Math.round((info.times[to] - info.times[from]) * o.fps) + 1) : to - from + 1;
    const args = ["-v", "error", ...(seek > 0 ? ["-ss", seek.toFixed(6)] : []), "-i", info.file, "-map", "0:v:0", ...(o.fps ? [] : ["-fps_mode", "passthrough"]),
        "-frames:v", String(count), "-vf", filters.join(","), "-f", "rawvideo", "-pix_fmt", o.gray ? "gray" : "rgb24", "pipe:1"];
    const size = o.width * o.height * (o.gray ? 1 : 3);
    let proc = null;
    for (const bin of tools.ffmpeg) {
        try {
            proc = await new Promise((resolve, reject) => {
                const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
                p.once("error", reject);
                p.once("spawn", () => resolve(p));
            });
            break;
        }
        catch (e) {
            if (e.code !== "ENOENT")
                throw e;
        }
    }
    if (!proc)
        throw new Error(NO_FFMPEG);
    let stderr = "";
    proc.stderr.on("data", (d) => { stderr += String(d); });
    let buf = Buffer.alloc(0), index = from;
    try {
        for await (const chunk of proc.stdout) {
            buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
            while (buf.length >= size && (o.fps ? index - from < count : index <= to)) {
                yield { index: o.fps ? index - from : index, time: o.fps ? info.times[from] + (index - from) / o.fps : info.times[index], data: new Uint8Array(buf.subarray(0, size)) };
                buf = buf.subarray(size);
                index++;
            }
        }
    }
    finally {
        if (proc.exitCode === null)
            proc.kill();
    }
    if (!o.fps && index <= to && stderr.trim())
        throw new Error(`ffmpeg stopped at frame ${index} of ${info.file}: ${stderr.trim().slice(0, 300)}`);
}
/** Mean absolute difference of two equal-sized frames (0..255). */
export function meanDiff(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++)
        s += Math.abs(a[i] - b[i]);
    return s / a.length;
}
/**
 * Repeated frames and their cadence, from the frame-to-frame differences (diffs[i] = frame i against frame i - 1,
 * diffs[0] unused). A frame repeats when it differs from the one before by under `still` while the frames round it
 * move (over `moving`): a held picture is not a repeat. A 24 fps piece inside a 30 fps file repeats every fifth frame.
 */
export function cadenceOf(diffs, fps, still = 0.6, moving = 1.5) {
    const repeats = [];
    for (let i = 1; i < diffs.length; i++) {
        if (diffs[i] >= still)
            continue;
        const before = i >= 2 ? diffs[i - 1] : Infinity, after = i + 1 < diffs.length ? diffs[i + 1] : Infinity;
        if (Math.min(before, after) > moving)
            repeats.push(i);
    }
    let period = null;
    if (repeats.length >= 3) {
        const gaps = [];
        for (let i = 1; i < repeats.length; i++)
            gaps.push(repeats[i] - repeats[i - 1]);
        const counts = new Map();
        for (const g of gaps)
            counts.set(g, (counts.get(g) ?? 0) + 1);
        const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (best >= 2 && n >= 0.6 * gaps.length)
            period = best;
    }
    const originalFps = period ? Math.round((fps * (period - 1)) / period * 1000) / 1000 : null;
    return {
        repeats,
        period,
        originalFps,
        reading: period
            ? `Every ${period}th frame repeats the one before while things move: likely made at ${originalFps} fps inside ${Math.round(fps * 1000) / 1000} fps. Moves are measured on the unique frames at their own times.`
            : repeats.length
                ? `${repeats.length} frames repeat the one before, with no steady pattern; they are left out of the fits.`
                : "No repeated frames while things move.",
    };
}
//# sourceMappingURL=decode.js.map