// Reading a video file's motion without After Effects (stage 13): the shot list, a census of movement, a tracked move
// with its fits, and the table of moves with a beat sheet. The same tools read a reference and a build's own render.
// All run in Node with ffmpeg; results go to the caller's folder and the reply carries the summary and the paths.
import { jsxFail, registerOp } from "../registry.js";
import { runMoves } from "../video/run-moves.js";
import { runCensus, runShots } from "../video/run-shots-census.js";
import { runTrack } from "../video/run-track.js";
const common = [
    { name: "file", type: "string", description: "Absolute path of the video file (a reference, or a build's render)", required: true },
    { name: "outDir", type: "string", description: "Absolute folder for the JSON and pictures (made if missing)", required: true },
    { name: "start", type: "number", description: "Seconds into the file to start (default its first frame)", required: false },
    { name: "end", type: "number", description: "Seconds into the file to end (default its last frame)", required: false },
    { name: "atFps", type: "number", description: "Also give frames at this rate beside seconds and the file's own frames (default 30)", required: false },
];
const ffmpegNote = " Needs ffmpeg and ffprobe (refuses plainly without them); never uses After Effects, so it fills no disk cache. Frames are read at their own timestamps (a variable rate is said).";
registerOp({
    name: "video.shots",
    category: "video",
    readOnly: true,
    description: "The shot list of a video file: exact cut frames (a cut changes the frame by 12 or more out of 255 on a 64 x 36 grey picture and by 4 times the median round it), one-frame swaps inside a shot (a frame that differs from both neighbours while they match, over the whole frame or one region of a 4 x 4 grid, which a scene score misses), brightness flashes set aside, and the shots. Writes shots.json, a contact sheet per shot and five consecutive frames round each change." + ffmpegNote,
    params: [...common, { name: "pictures", type: "boolean", description: "Write the contact sheets and change strips (default true)", required: false }],
    toJsx: () => jsxFail("video.shots runs in Node; call it through ae_do"),
    run: (args) => runShots(args),
});
registerOp({
    name: "video.census",
    category: "video",
    readOnly: true,
    description: "A census of movement: each short step (default 0.1 s) of a band of the frame classed calm (under 0.4 % of it changed), local movement, whole-stage travel (at least half the textured 16 px blocks moved) or a cut, with cadence numbers: shares, travel moves a minute and their median length and speed, bursts every 10 s, calm runs. A stage with little texture (a dark one) reads calmer than it looks. Writes census.json (labels c, l, T, X per step) and a strip." + ffmpegNote,
    params: [...common,
        { name: "window", type: "number", description: "Seconds a step (default 0.1)", required: false },
        { name: "band", type: "array", description: "[top, bottom] of the band as shares of the height (default [0.15, 0.6])", required: false },
        { name: "pageTest", type: "boolean", description: "Skip steps where the top of the frame is not a flat page (default false)", required: false }],
    toJsx: () => jsxFail("video.census runs in Node; call it through ae_do"),
    run: (args) => runCensus(args),
});
registerOp({
    name: "video.track",
    category: "video",
    readOnly: true,
    description: "Follow one thing across a span of a video file and measure its moves: position, scale and opacity per frame (normalised cross-correlation over a range of scales with a sub-pixel peak; opacity as the window's regression on the template), the moves in motion.curve's own terms, and each move fitted three ways with its rms (After Effects ease: out and in influence; linear; spring: frequency, damping, overshoot, settle, and the hand-study form A, f, d), the best and by how much, and its keys ready for keyframe.apply (a spring also as the library's motion-jsx spring, and baked keys). Repeated frames are found (a 24 fps piece in 30 fps repeats every fifth) and moves are fitted on the unique frames at their own times. Says where it lost the region and fits nothing past it. A move whose start or end was not seen (already moving at the first frame measured, or still moving where it stops) is partial: its duration, distance and the unseen ease are not measured. Each move has two durations: the fit's keys (what is set in After Effects) and the visible span (the last frame at rest to the first frame within 2 % of the end, as a hand study counts it); a witness (plain frame differencing round the region) gives the span over which anything there changes, and a move it outlasts is marked uncertain. Moves never span a cut. `ink` adds a second measure, a mask in a fixed box (by luma, colour, or difference from an empty frame) with its bounding box, centroid, area and level per frame: for anything that grows from nothing, draws on, fades, glows or blurs. Where both measures see a move, agreement within 2 frames and 5 % is a measurement and disagreement is reported, uncertain. Rotation, skew, blur and colour are not measured, and the reply says so. Writes track.json and track.csv." + ffmpegNote,
    params: [...common,
        { name: "region", type: "any", description: "[x, y, width, height] round the thing in the reference frame, in pixels or as shares of the frame (all 1 or under)", required: true },
        { name: "ref", type: "number", description: "Seconds: the reference frame where the region is drawn, the thing at rest (default the span's last frame)", required: false },
        { name: "scaleRange", type: "array", description: "[smallest, largest] scale to search, against the reference (default [0.25, 2.5])", required: false },
        { name: "ink", type: "object", description: "The ink measure: { box (default the region), mask: { luma: [lo, hi] | minChannel: [lo, hi] | hue: [from, to] with minSat, minVal | rgb: [r, g, b] with tol | empty: seconds of a frame without the thing, with tol }, curves: any of centroid, x0, x1, y0, y1, width, height, size, level (default centroid, size, level), minCount, minPixels }. A moving ground defeats the empty-frame difference", required: false }],
    toJsx: () => jsxFail("video.track runs in Node; call it through ae_do"),
    run: (args) => runTrack(args),
});
registerOp({
    name: "video.moves",
    category: "video",
    readOnly: true,
    description: "The table of moves and a beat sheet in the brief's form, from video.track files (and video.shots and video.census when given): each move with its start, duration and distance, ease or spring values, fit and rms, marked measured, inferred (carried by hand, with the reason) or untested, and its keys ready to apply. The beat sheet has a scene per shot with the measured events; what the picture cannot say is left marked. Writes moves.json and beat-sheet.md. Reads files only.",
    params: [
        { name: "outDir", type: "string", description: "Absolute folder for moves.json and beat-sheet.md", required: true },
        { name: "tracks", type: "array", description: "track.json paths from video.track, or [{ path, label }]", required: true },
        { name: "shots", type: "string", description: "shots.json from video.shots", required: false },
        { name: "census", type: "string", description: "census.json from video.census", required: false },
        { name: "transcript", type: "string", description: "A transcript JSON (word or segment tokens with times): each scene gets its words and each event the word spoken as it starts", required: false },
        { name: "inferred", type: "array", description: "Moves carried by hand: [{ label, channel, reason, ... }]", required: false },
        { name: "untested", type: "array", description: "Moves named but not tracked: [{ label, reason }]", required: false },
        { name: "atFps", type: "number", description: "Frames at this rate (default 30)", required: false },
    ],
    toJsx: () => jsxFail("video.moves runs in Node; call it through ae_do"),
    run: (args) => runMoves(args),
});
//# sourceMappingURL=video.js.map