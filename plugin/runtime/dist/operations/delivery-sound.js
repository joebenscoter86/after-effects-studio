// The delivered file's sound, read in Node (render.deliver): whether it sits
// on its frame, and its loudness.
//
// On its frame. After Effects' AAC encoder starts the sound with 1,024
// samples of priming silence and writes no edit list to skip them, so players
// play the priming and the voice runs 1,024 samples late (0.64 of a frame at
// 30 fps, 48 kHz; measured on the first production delivery, 2026-11-12).
// The fix is a lossless remux with ffmpeg (-c copy): the sound is shifted
// back by the priming, and ffmpeg's MP4/QuickTime muxer writes that as an
// edit list on the sound track that skips the priming (media time 1,024),
// which players honour. The edit list is read here from the file's own boxes
// (moov > trak > edts > elst), before and after, so the check measures what
// a player will do without decoding anything.
//
// Loudness. ffmpeg's ebur128 filter (with peak=true) gives the integrated
// loudness (LUFS), the loudness range (LU) and the true peak (dBTP; ffmpeg
// prints it as dBFS) of the file as delivered.
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
/** Priming samples After Effects' AAC encoder puts at the start of the sound (measured 2026-11-12, AE 2027). */
export const AE_AAC_PRIMING_SAMPLES = 1024;
export const FFPROBE = ["ffprobe", "/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe"];
export const FFMPEG = ["ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"];
/** Run the first of `cands` that is installed; null when none is. `failed` is a non-zero exit. */
export function runTool(cands, argv, timeoutMs = 120_000) {
    return new Promise((resolve) => {
        const tryAt = (i) => {
            if (i >= cands.length)
                return resolve(null);
            execFile(cands[i], argv, { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
                if (err && err.code === "ENOENT")
                    return tryAt(i + 1);
                resolve({ stdout: String(stdout), stderr: String(stderr), failed: err !== null });
            });
        };
        tryAt(0);
    });
}
function* boxes(buf, start, end) {
    let o = start;
    while (o + 8 <= end) {
        let size = buf.readUInt32BE(o);
        const type = buf.toString("latin1", o + 4, o + 8);
        let header = 8;
        if (size === 1) {
            if (o + 16 > end)
                return;
            size = Number(buf.readBigUInt64BE(o + 8));
            header = 16;
        }
        else if (size === 0)
            size = end - o;
        if (size < header || o + size > end)
            return;
        yield { type, start: o + header, end: o + size };
        o += size;
    }
}
const child = (buf, parent, type) => {
    for (const b of boxes(buf, parent.start, parent.end))
        if (b.type === type)
            return b;
    return null;
};
/** The first sound track of a movie box (moov), or null when it has none. */
export function soundTrackFromMoov(moov) {
    const root = { type: "moov", start: 0, end: moov.length };
    const mvhd = child(moov, root, "mvhd");
    const movieTimescale = mvhd
        ? moov.readUInt32BE(mvhd.start + (moov[mvhd.start] === 1 ? 20 : 12))
        : 0;
    for (const trak of boxes(moov, 0, moov.length)) {
        if (trak.type !== "trak")
            continue;
        const mdia = child(moov, trak, "mdia");
        if (!mdia)
            continue;
        const hdlr = child(moov, mdia, "hdlr");
        if (!hdlr || moov.toString("latin1", hdlr.start + 8, hdlr.start + 12) !== "soun")
            continue;
        const mdhd = child(moov, mdia, "mdhd");
        const mediaTimescale = mdhd
            ? moov.readUInt32BE(mdhd.start + (moov[mdhd.start] === 1 ? 20 : 12))
            : 0;
        const minf = child(moov, mdia, "minf");
        const stbl = minf ? child(moov, minf, "stbl") : null;
        const stsd = stbl ? child(moov, stbl, "stsd") : null;
        let codec = "";
        let sampleRate = 0;
        if (stsd && stsd.start + 16 <= stsd.end) {
            const entry = stsd.start + 8;
            codec = moov.toString("latin1", entry + 4, entry + 8);
            // Audio sample entry: 8 header, 8 reserved/data reference, 8 version/vendor, 2 channels, 2 sample size, 4 more, then the rate as 16.16.
            if (entry + 36 <= stsd.end)
                sampleRate = moov.readUInt32BE(entry + 32) >>> 16;
        }
        let edits = null;
        const edts = child(moov, trak, "edts");
        const elst = edts ? child(moov, edts, "elst") : null;
        if (elst) {
            const v1 = moov[elst.start] === 1;
            const count = moov.readUInt32BE(elst.start + 4);
            edits = [];
            let o = elst.start + 8;
            for (let i = 0; i < count && o + (v1 ? 20 : 12) <= elst.end; i++) {
                const segmentDuration = v1 ? Number(moov.readBigUInt64BE(o)) : moov.readUInt32BE(o);
                const mediaTime = v1 ? Number(moov.readBigInt64BE(o + 8)) : moov.readInt32BE(o + 4);
                edits.push({ segmentDuration, mediaTime });
                o += v1 ? 20 : 12;
            }
        }
        // A QuickTime version 2 description keeps the real rate elsewhere and puts 1.0 here: fall back on the track's timescale.
        return {
            codec,
            sampleRate: sampleRate >= 8000 ? sampleRate : mediaTimescale,
            mediaTimescale,
            movieTimescale,
            edits,
        };
    }
    return null;
}
/** Read only the file's movie box (moov), walking the top-level boxes by their headers. */
export async function readMoov(file) {
    const fh = await fs.open(file, "r");
    try {
        const { size } = await fh.stat();
        const head = Buffer.alloc(16);
        let o = 0;
        while (o + 8 <= size) {
            await fh.read(head, 0, 16, o);
            let boxSize = head.readUInt32BE(0);
            const type = head.toString("latin1", 4, 8);
            let header = 8;
            if (boxSize === 1) {
                boxSize = Number(head.readBigUInt64BE(8));
                header = 16;
            }
            else if (boxSize === 0)
                boxSize = size - o;
            if (boxSize < header)
                return null;
            if (type === "moov") {
                const body = Buffer.alloc(boxSize - header);
                await fh.read(body, 0, body.length, o + header);
                return body;
            }
            o += boxSize;
        }
        return null;
    }
    finally {
        await fh.close();
    }
}
export function soundSyncOf(t) {
    const rate = t.sampleRate || t.mediaTimescale || 48_000;
    let delaySeconds = 0;
    let skipped = 0;
    for (const e of t.edits ?? []) {
        if (e.mediaTime === -1) {
            delaySeconds += t.movieTimescale ? e.segmentDuration / t.movieTimescale : 0;
            continue;
        }
        skipped = t.mediaTimescale ? Math.round((e.mediaTime * rate) / t.mediaTimescale) : e.mediaTime;
        break;
    }
    const aac = t.codec === "mp4a";
    // An edit list that already skips something is the encoder's own account of its priming: trusted.
    const priming = aac ? (skipped > 0 ? skipped : AE_AAC_PRIMING_SAMPLES) : 0;
    const late = Math.max(0, priming - skipped) + Math.round(delaySeconds * rate);
    const lateMs = Math.round((late / rate) * 1e5) / 100;
    return {
        codec: t.codec,
        sampleRate: rate,
        primingSamples: priming,
        skippedSamples: skipped,
        lateBySamples: late,
        lateMs,
        reading: late === 0
            ? aac
                ? `the sound is on its frame: the edit list skips the AAC encoder's ${priming} samples of priming`
                : `the sound is on its frame (${t.codec || "uncompressed"} sound, no priming)`
            : `the sound plays ${late} samples (${lateMs} ms) late` +
                (aac && skipped === 0
                    ? `: the AAC encoder's ${priming} samples of priming are not skipped (no edit list)`
                    : ""),
    };
}
/** The delivered file's sound sync, read from its boxes; null when it has no sound track or is not an MP4/QuickTime file. */
export async function readSoundSync(file) {
    const moov = await readMoov(file).catch(() => null);
    if (!moov)
        return null;
    const t = soundTrackFromMoov(moov);
    return t ? soundSyncOf(t) : null;
}
/**
 * Put the sound on its frame: remux the file with ffmpeg (-c copy, nothing
 * re-encoded), the sound shifted back by the samples it is late, which the
 * muxer writes as an edit list on the sound track. The new file replaces the
 * old one only when its edit list is read back skipping those samples (to
 * within one); otherwise the delivered file is left as it was.
 */
export async function alignSound(file, sync) {
    if (sync.lateBySamples <= 0)
        return { aligned: true, how: "already on its frame", before: sync, after: sync };
    const ext = path.extname(file);
    const tmp = path.join(path.dirname(file), `.${path.basename(file, ext)}.sound-aligned${ext}`);
    const offset = (sync.lateBySamples / sync.sampleRate).toFixed(9);
    const r = await runTool(FFMPEG, [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        file,
        "-itsoffset",
        `-${offset}`,
        "-i",
        file,
        "-map",
        "0",
        "-map",
        "-0:a",
        "-map",
        "1:a",
        "-c",
        "copy",
        tmp,
    ]);
    if (r === null)
        return {
            aligned: false,
            how: "ffmpeg is not installed, so the file could not be remuxed",
            before: sync,
        };
    const giveUp = async (how) => {
        await fs.rm(tmp, { force: true });
        return { aligned: false, how, before: sync };
    };
    if (r.failed)
        return giveUp(`ffmpeg could not remux the file: ${r.stderr.trim().slice(0, 300)}`);
    const after = await readSoundSync(tmp).catch(() => null);
    const wanted = sync.skippedSamples + sync.lateBySamples;
    if (!after || Math.abs(after.skippedSamples - wanted) > 1 || after.lateBySamples > 1) {
        return giveUp(`the remuxed file's edit list does not skip the ${wanted} samples (${after ? `it skips ${after.skippedSamples}` : "it has no sound track that could be read"}); the delivered file was left as it was`);
    }
    await fs.rename(tmp, file);
    return {
        aligned: true,
        how: `remuxed with ffmpeg (-c copy, nothing re-encoded): an edit list on the sound track now skips the ${wanted} samples of priming`,
        before: sync,
        after,
    };
}
const num = (s) => (s === "-inf" ? -Infinity : Number(s));
/** The summary ffmpeg's ebur128 filter prints at the end (peak=true), or null when there is none. */
export function parseEbur128Summary(stderr) {
    const at = stderr.lastIndexOf("Summary:");
    if (at < 0)
        return null;
    const s = stderr.slice(at);
    const i = /Integrated loudness:\s*I:\s*(-?[\d.]+|-inf)\s*LUFS/.exec(s);
    const lra = /Loudness range:\s*LRA:\s*(-?[\d.]+)\s*LU/.exec(s);
    const tp = /True peak:\s*Peak:\s*(-?[\d.]+|-inf)\s*dBFS/.exec(s);
    if (!i || !tp)
        return null;
    return {
        integratedLufs: num(i[1]),
        loudnessRangeLu: lra ? Number(lra[1]) : null,
        truePeakDbtp: num(tp[1]),
    };
}
/** volumedetect's mean and max, or nulls. */
export function parseVolumedetect(stderr) {
    const m = /mean_volume:\s*(-?[\d.]+|-inf) dB/.exec(stderr);
    const x = /max_volume:\s*(-?[\d.]+|-inf) dB/.exec(stderr);
    return m && x ? { meanDb: num(m[1]), maxDb: num(x[1]) } : { meanDb: null, maxDb: null };
}
//# sourceMappingURL=delivery-sound.js.map