// A movie's frames as RGB pictures, decoded by ffmpeg without After Effects (stage 11), for the measures that read
// rendered frames (reference.report and the look sheet). Colour is the risk: the YUV-to-RGB matrix and range are
// read from the stream's own tags, and where a tag is missing the one After Effects assumes for video is used
// (Rec. 709, video range), and the reply says which were read and which assumed.
import { spawn } from "node:child_process";

import type { DecodedPng } from "../color/png16.js";
import { runTool } from "../operations/delivery-sound.js";
import { NO_FFMPEG, probeVideo, type VideoInfo, type VideoTools, VIDEO_TOOLS } from "./decode.js";

export interface MovieColour {
  /** The YUV-to-RGB matrix and range used, as ffmpeg names them. */
  matrix: string;
  range: "tv" | "pc";
  /** What the stream's tags said (null where it said nothing), and which of matrix and range were assumed. */
  tags: { space: string | null; range: string | null; transfer: string | null; primaries: string | null };
  assumed: Array<"matrix" | "range">;
  reading: string;
}

const MATRIX: Record<string, string> = { bt709: "bt709", smpte170m: "bt601", bt470bg: "bt601", bt601: "bt601", fcc: "fcc", smpte240m: "smpte240m", bt2020nc: "bt2020", bt2020c: "bt2020" };

/** The colour a movie will be decoded with: its tags, and After Effects' video assumptions where they are missing. */
export async function movieColour(file: string, tools: VideoTools = VIDEO_TOOLS): Promise<MovieColour | null> {
  const r = await runTool(tools.ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_space,color_range,color_transfer,color_primaries", "-of", "json", file], 60_000);
  if (r === null) return null;
  let st: Record<string, string> = {};
  try { st = JSON.parse(r.stdout).streams?.[0] ?? {}; } catch { /* no tags */ }
  const tag = (v: string | undefined) => (v && v !== "unknown" && v !== "unspecified" ? v : null);
  const tags = { space: tag(st.color_space), range: tag(st.color_range), transfer: tag(st.color_transfer), primaries: tag(st.color_primaries) };
  const assumed: Array<"matrix" | "range"> = [];
  const matrix = tags.space && MATRIX[tags.space] ? MATRIX[tags.space] : (assumed.push("matrix"), "bt709");
  const range: "tv" | "pc" = tags.range === "pc" || tags.range === "jpeg" ? "pc" : tags.range === "tv" || tags.range === "mpeg" ? "tv" : (assumed.push("range"), "tv");
  const said = (k: string, v: string | null) => (v ? `${k} ${v}` : `${k} not tagged`);
  return { matrix, range, tags, assumed,
    reading: `Decoded with matrix ${matrix} and ${range === "tv" ? "video" : "full"} range: ${said("colour space", tags.space)}, ${said("range", tags.range)}${assumed.length ? `; ${assumed.join(" and ")} assumed as After Effects reads untagged video (Rec. 709, video range)` : "; both read from the file"}.` };
}

/**
 * The frames at `picks` (indices into the file's frames, ascending), decoded at full size as 0..1 RGB pictures, in
 * order. Picks close together are streamed as one run (frames between them decoded and dropped); a run starts with a
 * seek, so frames spread over a long movie are not all decoded.
 */
export async function* movieFrames(info: VideoInfo, picks: number[], colour: MovieColour, tools: VideoTools = VIDEO_TOOLS): AsyncGenerator<{ frame: number; time: number; img: DecodedPng }> {
  const runs: number[][] = [];
  for (const f of picks) { const r = runs[runs.length - 1]; if (r && f - r[r.length - 1] <= 8) r.push(f); else runs.push([f]); }
  for (const run of runs) yield* movieRun(info, run, colour, tools);
}

async function* movieRun(info: VideoInfo, picks: number[], colour: MovieColour, tools: VideoTools): AsyncGenerator<{ frame: number; time: number; img: DecodedPng }> {
  if (!picks.length) return;
  const from = picks[0], to = picks[picks.length - 1], want = new Set(picks);
  const half = (info.intervals.median || 1 / 30) / 2, seek = Math.max(0, info.times[from] - half);
  const w = info.width, h = info.height, size = w * h * 3;
  const args = ["-v", "error", ...(seek > 0 ? ["-ss", seek.toFixed(6)] : []), "-i", info.file, "-map", "0:v:0", "-fps_mode", "passthrough",
    "-frames:v", String(to - from + 1), "-vf", `scale=${w}:${h}:in_color_matrix=${colour.matrix}:in_range=${colour.range}:out_range=pc:flags=accurate_rnd+full_chroma_int`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"];
  let proc: ReturnType<typeof spawn> | null = null;
  for (const bin of tools.ffmpeg) {
    try {
      proc = await new Promise<ReturnType<typeof spawn>>((resolve, reject) => { const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] }); p.once("error", reject); p.once("spawn", () => resolve(p)); });
      break;
    } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
  }
  if (!proc) throw new Error(NO_FFMPEG);
  let stderr = "";
  proc.stderr!.on("data", (d) => { stderr += String(d); });
  let buf: Buffer = Buffer.alloc(0), index = from;
  try {
    for await (const chunk of proc.stdout!) {
      buf = buf.length ? Buffer.concat([buf, chunk as Buffer]) : (chunk as Buffer);
      while (buf.length >= size && index <= to) {
        if (want.has(index)) {
          const rgb = new Float64Array(size);
          for (let i = 0; i < size; i++) rgb[i] = buf[i] / 255;
          yield { frame: index, time: info.times[index], img: { width: w, height: h, rgb, bitDepth: 8 } };
        }
        buf = buf.subarray(size);
        index++;
      }
    }
  } finally {
    if (proc.exitCode === null) proc.kill();
  }
  if (index <= to) throw new Error(`ffmpeg stopped at frame ${index} of ${info.file} (wanted up to ${to})${stderr ? `: ${stderr.trim().slice(0, 300)}` : ""}`);
}

export { probeVideo };
