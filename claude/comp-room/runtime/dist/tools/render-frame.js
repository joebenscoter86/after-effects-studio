import { promises as fs } from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import {
  alphaChange,
  edgeArgsError,
  measureEdge,
  resolveEdgeThresholds,
  summarizeFlicker
} from "../color/matte.js";
import {
  decodePng,
  encodePngGray8,
  encodePngSrgb8,
  encodePngSrgbRgba8
} from "../color/png16.js";
import {
  measureScreen,
  resolveScreenThresholds,
  screenArgsError
} from "../color/screen.js";
import {
  diffArgsError,
  pictureChange,
  pictureOf,
  resolveDiffThresholds,
  summarizeSeries
} from "../color/motion.js";
import {
  settleTimeoutFor,
  stampFiles,
  waitForSettled
} from "../color/settled-read.js";
import {
  analyzeFrame,
  compareRegions,
  composeContactSheet,
  flattenOver,
  resample,
  frameLabel,
  histogramOf,
  lookArgsError,
  lookCrops,
  measureLook,
  rgbHex,
  sampleRegions,
  summarizeLookSeries,
  unmatte
} from "../color/sheet.js";
import { rejectedOutputPath } from "../config.js";
import { errorResult } from "../errors.js";
import { readOnlyMode } from "../policy.js";
import { MISSING_SOURCES_FN, OCIO_CAPTURE_FN, RENDER_FRAME_FN } from "../operations/snippets.js";
import { jsxVal } from "../registry.js";
import { colorConversion, validRgb } from "./capture-shared.js";
import { defineTool, toMcpResult } from "./define-tool.js";
const STRIP_DEFAULT_MAX_DIMENSION = 360;
const FRAME_PICK = 0.25;
const NEAR_FRAME_BOUNDARY = 0.02;
function frameWarnings(frames, near = NEAR_FRAME_BOUNDARY) {
  const parts = [];
  const firstAt = /* @__PURE__ */ new Map();
  for (const [i, f] of frames.entries()) {
    if (typeof f.frame !== "number") continue;
    const seen = firstAt.get(f.frame);
    if (seen === void 0) firstAt.set(f.frame, i);
    else parts.push(`#${seen} and #${i} both render frame ${f.frame}`);
  }
  for (const [i, f] of frames.entries()) {
    if (typeof f.frame !== "number" || typeof f.frameOffset !== "number") continue;
    const below = 1 - f.frameOffset;
    if (below > 0 && below <= near) {
      parts.push(
        `#${i} (${f.time} s) renders frame ${f.frame}, ${(below * 100).toFixed(1)}% of a frame below frame ${f.frame + 1}`
      );
    }
  }
  if (parts.length === 0) return void 0;
  return `${parts.join("; ")}. A time resolves to the frame it falls in, so a rounded time just below a boundary renders the frame before and a series of rounded times can repeat frames (diff then reads stutters). Pass \`frames: [..]\` to address frames by number, or exact times.`;
}
const MEASUREMENT_STAGES = {
  capture: "the PNG as saveFrameToPng wrote it, before any colour conversion: working-space values (scaled by AE's capture transfer in colour-managed projects), 8 or 16 bits. Its RGB is already laid over the comp background colour (`bgColor`): capture = colour\xB7alpha + bgColor\xB7(1 \u2212 alpha), so a half-covered pixel reads half background and an empty one reads bgColor; on a black background that is premultiplied colour. Alpha is the coverage AE wrote",
  output: "the file as written (writtenTo), after colour conversion when colorManaged is auto, so 8-bit display values. With channels 'rgb': over the comp background as AE composited it, or over `over`. With 'rgba': the colour recovered from under the background (straight, 0 where alpha is 0), plus alpha. With 'alpha': the matte, in r = g = b. The same as the capture when colorManaged is off or the conversion failed"
};
const HISTOGRAM_DEFAULT_BINS = 32;
const layerRefSchema = z.union([
  z.string(),
  z.number().int().positive(),
  z.object({ id: z.number().int() })
]);
const regionSchema = z.object({
  name: z.string().min(1).describe("Label reported back with the numbers."),
  x: z.number().int().describe("Left edge (or the point), capture pixels from the left."),
  y: z.number().int().describe("Top edge (or the point), capture pixels from the top."),
  width: z.number().int().positive().optional().describe("Omit with height for a single pixel."),
  height: z.number().int().positive().optional()
});
const renderFrameTool = defineTool({
  name: "ae_render_frame",
  title: "Render frame",
  description: "Render one or more frames to PNG. Use to visually verify edits. The agent's 'eyes' \u2014 pair with mutations for a visual feedback loop. Headless and deterministic. Pass `time` for one frame, or `times` for several in ONE call (motion checks): files land at <outPath stem>_<index>.png and are listed in `frames`. `contactSheet` tiles every frame into one labelled PNG (<stem>_sheet.png) so a motion check is one image; `analyze` measures each capture (uniform edge bands = black bars / transparent margins, content bounds, coverage) so off-frame elements and letterboxing are caught numerically. In color-managed projects (workingSpace != None) the capture applies AE's own display transform via a transient OCIO Display Transform adjustment layer, and the PNG comes back viewer-accurate and sRGB-tagged. Where that layer cannot be used \u2014 read-only mode, an AE without the OCIO effect, or a failed capture calibration \u2014 the result falls back to a pure-math ACES conversion or to raw values with an explicit colorWarning; check colorPipeline / colorWarning on the response. Seeing the matte: `channels` picks what the file holds \u2014 'rgb' (default, transparency composited over `over`: the comp background as AE composites it, a checkerboard or a colour such as '#ff00ff'), 'rgba' (alpha kept, straight colour), or 'alpha' (the matte as greyscale: white opaque, black transparent). `isolate` renders one layer or a list alone (cameras and lights stay as they are), then restores every layer switch, even when the render fails. `alphaChannel` reports whether the capture carried alpha at all. Reading colour: `sample` takes named points or rectangles and returns mean / min / max per channel and alpha coverage for each; `histogram` counts the whole frame per channel; `compare` (with `times` and `sample`) reports each region's difference between two of the rendered frames. Matte quality: `edge` reports, from the capture's alpha, the shares of opaque / partly transparent / transparent pixels, edge width (typical and worst, px), holes, specks, partly transparent patches that are not thin edges (an unkeyed screen, a remnant), the soft edge's colour with the comp background taken out and whether it leans to the screen colour (spill), and with `times` the frame-to-frame change in alpha along the edge, inside the solid area and outside it (flicker). Green screen: `screen`, on a render of the UN-KEYED source (Keylight View 'source' or the key off, the keyed layer isolated), reports green or blue, which pixels are screen and their share, a suggested screen colour (the median, and the colour just outside the subject), evenness on a grid (darkest and brightest cells, the spread as a ratio, the darker side) and grain. Sitting in the scene: `look` reads grain, edge width, black and white points and CIELAB colour of named regions, names the cast on a neutral (with the gains that remove it) and skin's hue, and compares an element with its plate (add grain, soften, seat the blacks); with `times` on consecutive frames, the grain from frame to frame. Watching motion: `diff` (with `times`) reports how much the picture changes between consecutive frames, where, and per `sample` region, and flags pairs that stand out (a one-frame pop, a stutter where a frame repeats, a cut); `strip: { at, frames }` renders the frames around a moment into one small contact sheet with diff on. For playback at speed, render.preview (ae_do) writes a quick movie. It reports numbers and places, never a pass or fail. Every number is labelled with its stage \u2014 'capture' (before colour conversion) or 'output' (the file as written) \u2014 described once in `measurementStages`.",
  group: "render",
  // Survives read-only mode: it writes a PNG, and the visual verification loop
  // is the whole point of an audit session. Note this is NOT a
  // never-touches-the-project tool. In a color-managed project the capture
  // path adds a transient adjustment layer, and the calibration probe builds a
  // scratch comp — both removed before the call returns, both leaving the
  // project dirty and one undo step consumed. Read-only mode is exactly where
  // that must not happen, so both are gated on !readOnlyMode() below and the
  // call degrades to the pure-math path instead.
  blockedInReadOnly: false,
  effect: "write",
  inputShape: {
    compNameOrId: z.union([z.string(), z.number()]).describe("Composition name or numeric item id."),
    time: z.number().nonnegative().optional().describe(
      "Time in seconds to render. Give exactly one of `time`, `times`, `strip` or `frames`. Each rendered frame reports `frame` (the frame the time falls in: floor(time / frameDuration), worked out in After Effects) and `frameOffset` (where in it, 0..1); `frameWarning` says when two times land on one frame or a time sits within 2% of a frame below a boundary (a rounded time renders the frame before). Times are never moved."
    ),
    times: z.array(z.number().nonnegative()).min(1).max(32).optional().describe(
      "Several times in seconds, rendered in ONE call. Files are written as <outPath stem>_<index><ext> and reported in `frames` (index-aligned)."
    ),
    strip: z.object({
      at: z.number().nonnegative().describe("The moment, seconds (snapped to the nearest frame)."),
      frames: z.number().int().min(2).max(32).describe("How many consecutive frames, centred on `at` (one more after it when even)."),
      step: z.number().int().positive().optional().describe("Frames between rendered frames. Default 1 (every frame)."),
      maxDimension: z.number().int().min(16).max(2048).optional().describe(
        "Longest side of each tile on the sheets, px. Default 360. The frames themselves are rendered at the comp's size."
      )
    }).optional().describe(
      "'What happens around this moment' in one call: N consecutive frames around `at`, worked out from the comp's frame rate inside After Effects and rendered through the `times` path (files <stem>_<index>, listed in `frames`), tiled small into the contact sheet, with `diff` and its sheet on (pass `diff: false` to skip, or diff options to tune). The window is shifted to stay inside the comp; `strip` in the response says where it landed. Instead of `time` / `times`."
    ),
    frames: z.array(z.number().int().nonnegative()).min(1).max(32).optional().describe(
      "Frame numbers (0 = the comp's first frame) instead of times: each is rendered a quarter of a frame inside it, so a time never lands on the frame before. Through the `times` path: files <stem>_<index>, reported in `frames` with their `frame`. Instead of `time` / `times` / `strip`."
    ),
    outPath: z.string().describe(
      "Absolute path to write the PNG. Parent directory is created if missing. With `times`, used as the naming stem for every frame."
    ),
    useDisplayStartTime: z.boolean().optional().describe("If true, times are interpreted relative to comp.displayStartTime. Default false."),
    colorManaged: z.enum(["auto", "off"]).optional().describe(
      "'auto' (default): detect the working space and return a viewer-accurate, 8-bit sRGB-tagged PNG. 'off': raw legacy output (16-bit, untagged, working-space values \u2014 dark/wrong-looking in color-managed projects)."
    ),
    settleTimeoutMs: z.number().int().positive().max(6e5).optional().describe(
      "How long to wait for the captures to finish writing (saveFrameToPng writes after the script returns). Default: 15 s for one frame, plus 3 s for each further 1080\xD71920 frame (scaled by size, at least 1 s each). Frames that do not finish are named in `captureSettle` and marked failed in `frames`; the others are still measured."
    ),
    analyze: z.boolean().optional().describe(
      "Measure each capture: uniform bands at every edge (width + transparent/color \u2014 black bars, letterboxing, empty margins), the bounding box of non-background pixels, coverage, mean RGB. Reported per frame as `analysis` (measured on the capture before color conversion)."
    ),
    contactSheet: z.object({
      columns: z.number().int().positive().optional().describe("Tiles per row (default ceil(sqrt(n)))."),
      thumbWidth: z.number().int().min(16).max(2048).optional().describe("Tile width in px, never upscaled (default 480)."),
      outPath: z.string().optional().describe("Sheet path (default <outPath stem>_sheet.png).")
    }).optional().describe(
      "Tile all rendered frames into ONE labelled PNG (#index + time above each tile). Pass {} for defaults. Frames that carry alpha (channels 'rgba') are shown over a checkerboard on the sheet."
    ),
    channels: z.enum(["rgb", "rgba", "alpha"]).optional().describe(
      "What the written file holds. 'rgb' (default): 8-bit sRGB, transparency composited over `over`. 'rgba': 8-bit sRGB with the alpha channel kept and straight colour (AE lays its capture over the comp background; that background is taken out again). 'alpha': the matte as 8-bit greyscale, white = opaque, black = transparent. Needs colorManaged 'auto'. If the capture has no alpha channel, `alphaWarning` says so."
    ),
    over: z.union([
      z.enum(["background", "checkerboard"]),
      z.string().regex(/^#[0-9a-fA-F]{6}$/),
      z.array(z.number().min(0).max(1)).length(3)
    ]).optional().describe(
      "With channels 'rgb': what transparent pixels are shown against. 'background' (default): the comp's background colour (`bgColor`), as AE itself composites the capture. 'checkerboard': light and dark grey squares, so transparency is visible. A colour as '#rrggbb' or [r, g, b] in 0..1 \u2014 magenta shows holes in a key. For the last two the comp background is taken out of the capture first, so soft edges show the new backdrop only."
    ),
    isolate: z.union([layerRefSchema, z.array(layerRefSchema).min(1)]).optional().describe(
      "Render these layers alone: a layer (index, name, or { id }) or a list. Every other layer is switched off for the capture, adjustment layers included; camera, light and audio-only layers are left as they are; named layers are switched on even if they were off (to see a matte layer); solo is cleared. Every switch is restored afterwards, even when the render fails, and `isolation` reports it. Top-level layers of this comp only. Not available in read-only mode."
    ),
    sample: z.object({
      regions: z.array(regionSchema).min(1).max(64),
      stage: z.enum(["both", "capture", "output"]).optional().describe("Which pixels to measure (default 'both'; see measurementStages).")
    }).optional().describe(
      "Read colour values. Named points ({ name, x, y }) or rectangles (+ width, height) in capture pixels (comp pixels at full resolution); regions running off the frame are clipped. Per region and stage: mean / min / max of r, g, b (0..1), alpha mean / min / max and the shares of opaque, partly covered and transparent pixels; 'output' also gives meanHex. Reported as `samples` (per frame with `times`)."
    ),
    histogram: z.union([
      z.boolean(),
      z.object({
        bins: z.number().int().min(2).max(256).optional().describe("Default 32."),
        stage: z.enum(["output", "capture"]).optional().describe("Default 'output'.")
      })
    ]).optional().describe(
      "Whole-frame per-channel histogram: pixel counts for r, g, b (and a when present) in equal bins over 0..1, 1.0 in the last bin. `true` for defaults."
    ),
    compare: z.object({
      from: z.number().int().nonnegative().optional().describe("Index into `times` (default 0)."),
      to: z.number().int().nonnegative().optional().describe("Index into `times` (default 1).")
    }).optional().describe(
      "With `times` and `sample`: each region's difference between two rendered frames, to \u2212 from, per stage: meanDelta (signed average shift), meanAbsDelta and maxAbsDelta per channel, and the same for alpha. Reported as `comparison`."
    ),
    edge: z.union([
      z.boolean(),
      z.object({
        from: z.enum(["alpha", "luma"]).optional().describe(
          "Where the matte is read: 'alpha' (default, the keyed result's coverage) or 'luma' (Rec. 709 luminance of the capture), for Keylight's Screen Matte (View 5) and Combined Matte (8) views, which write the matte in grey RGB with alpha 1 everywhere. With 'luma' spill is not read and no alpha channel is needed."
        ),
        transparent: z.number().min(0).max(1).optional().describe(
          "Alpha at or below counts as transparent. Default 2/255 (as `sample` counts)."
        ),
        opaque: z.number().min(0).max(1).optional().describe("Alpha at or above counts as opaque. Default 1 \u2212 2/255."),
        maxEdgeWidth: z.number().min(1).optional().describe(
          "Widest transition still called a thin edge, px; wider partly transparent regions are reported as patches, and it is the edge band for flicker. Default 1% of the frame's shorter side, at least 4 (11 at 1080\xD71920)."
        ),
        mainAreaShare: z.number().min(0).max(1).optional().describe(
          "An island of covered pixels at least this share of the largest is a main solid area, smaller ones are specks. Default 0.25."
        ),
        listed: z.number().int().min(0).max(50).optional().describe(
          "How many holes, specks, patches and solid areas are listed (all are counted). Default 5."
        ),
        screen: z.enum(["green", "blue"]).optional().describe("Screen colour spill is read against. Default 'green'."),
        spillMinAlpha: z.number().min(0).max(1).optional().describe(
          "Partly transparent pixels below this alpha are left out of the spill colour. Default 0.1."
        ),
        spillThreshold: z.number().min(0).max(1).optional().describe(
          "The soft edge leans to the screen when its screen channel exceeds the larger other channel by more than this, and by this much more than the solid area's own. Default 0.03."
        ),
        changeAbove: z.number().min(0).max(1).optional().describe("Flicker: an alpha change above this counts as changed. Default 0.05."),
        patchWindow: z.number().min(1).optional().describe(
          "Side of the square window each patch's densest part is reported in, px. Default 4 \xD7 maxEdgeWidth (44 at 1080\xD71920)."
        )
      })
    ]).optional().describe(
      "Matte quality as numbers, measured on the capture's alpha (stage 'capture'), or with `from: 'luma'` on its luminance (Keylight's matte views); `true` for the defaults. Each report says `matteFrom`. Reported as `edge` (per frame with `times`), with the thresholds used as `edgeThresholds`: shares {opaque, partial, transparent}; width {typical (median), p90, worst, worstAt, samples, unmeasured} \u2014 px the alpha takes from transparent to opaque across the 50% contour of the main solid areas (0 = hard edge; unmeasured = the alpha never reaches transparent or opaque anywhere, as when the screen is left partly opaque); solidAreas; holes {count, area, transparentArea, largest, list} \u2014 regions below opaque enclosed by the solid area (not touching the frame edge); specks {count, area, list} \u2014 islands outside the main areas; patches {count, area, list} \u2014 partly transparent regions thicker than maxEdgeWidth, each with its box, thickest {x, y, thickness} (the deepest point and the thickness there, px) and densest {x, y, width, height, pixels, share, meanAlpha} (the patchWindow square holding most of it, so a long band's box does not hide where it is); spill {mean, solidMean, excess, solidExcess, leansToScreen, reading} \u2014 the straight colour of the partly transparent pixels (comp background taken out) against the solid just inside the edge. Boxes are {x, y, width, height} in capture pixels. With two or more `times`: `edgeFlicker` {pairs, overall} \u2014 mean / max change in alpha and the changed share and bounds, for consecutive frames, split into edge, inside (a hole opening counts here) and outside (specks); real motion counts as change too."
    ),
    screen: z.union([
      z.boolean(),
      z.object({
        screen: z.enum(["auto", "green", "blue"]).optional().describe(
          "Which screen to look for. Default 'auto': green or blue, whichever has more pixels."
        ),
        minExcess: z.number().min(0).max(1).optional().describe(
          "A pixel is screen when its screen channel leads the larger other channel by at least this (capture values). Default 0.04."
        ),
        minDominance: z.number().min(0).max(1).optional().describe("\u2026and by at least this share of its own level. Default 0.15."),
        minScreenShare: z.number().min(0).max(1).optional().describe(
          "Fewer screen pixels than this share of the measured ones means no screen. Default 0.02."
        ),
        opaque: z.number().min(0).max(1).optional().describe(
          "Pixels with alpha below this are left out (masked or transparent). Default 1 \u2212 2/255."
        ),
        columns: z.number().int().min(1).max(64).optional().describe(
          "Evenness grid columns. Default: four cells across the shorter side, square-ish cells."
        ),
        rows: z.number().int().min(1).max(64).optional().describe("Evenness grid rows. Default as columns."),
        minCellShare: z.number().min(0).max(1).optional().describe(
          "A cell needs this share of screen pixels to count as darkest or brightest. Default 0.25."
        ),
        nearSkip: z.number().min(0).optional().describe(
          "The near-subject colour is read from screen pixels starting this many px from the subject. Default 1% of the shorter side, at least 2 (11 at 1080\xD71920)."
        ),
        nearBand: z.number().min(1).optional().describe(
          "\u2026in a band this many px wide. Default 5% of the shorter side, at least 4 (54 at 1080)."
        ),
        unevenRatio: z.number().min(1).optional().describe("A brightest / darkest level ratio above this reads as uneven. Default 1.1."),
        grainAbove: z.number().min(0).max(1).optional().describe(
          "A screen-channel grain standard deviation above this reads as grainy. Default 0.01."
        )
      })
    ]).optional().describe(
      "Measure a green or blue screen, on the capture (stage 'capture'), opaque pixels only; `true` for the defaults. Render the UN-KEYED source: set Keylight's View to 'source' (key.view) or switch the key off, and isolate the keyed layer. Reported as `screen` (per frame with `times`), with the thresholds used as `screenThresholds`: screen ('green' | 'blue' | null), chosen, measured / leftOut pixels, screenPixels, share, bounds; colour {median, mean, nearSubject {colour, pixels, band}} \u2014 the suggested Screen Colour; subject {box, area, share}; evenness {columns, rows, cells [{column, row, box, screenShare, mean, luma, level}], darkest, brightest, levelRatio, lumaRatio, uneven, extent (5th to 95th percentile of the screen pixels' positions), horizontal (right / left) and vertical (bottom / top) read across that extent, darkerSide (every side darker past unevenRatio, strongest first), reading}; grain {stdDev, level, steps8bit, samples, grainy, reading}; reading; warning; screenColourNote (capture values and what they mean for Keylight's Screen Colour)."
    ),
    look: z.object({
      regions: z.array(
        regionSchema.extend({
          role: z.enum(["neutral", "skin", "plate", "element"]).optional().describe(
            "neutral: a surface that should read grey or white (a wall, a card, a metal grille) \u2014 its cast is named and the gains that remove it given; skin: its hue angle is read against the usual range; plate / element: for `pairs`."
          )
        })
      ).min(1).max(64),
      pairs: z.array(z.object({ element: z.string(), plate: z.string() })).optional().describe(
        "Element regions read against plate regions, by name: grain, edge width, black and white points, with what to do."
      ),
      minContrast: z.number().gt(0).max(1).optional().describe("Smallest luma step (0..1) read as an edge. Default 0.1."),
      grainTolerance: z.number().gt(0).max(1).optional().describe("Default 0.25: within a quarter of the plate's grain matches."),
      sharpnessTolerance: z.number().gt(0).max(1).optional().describe("Default 0.25: within a quarter of the plate's edge width matches.")
    }).optional().describe(
      "Does it sit in the scene: for each named region, on the file as written (stage 'output'; with channels 'rgba' only the opaque pixels, straight colour), levels {black, white, mean per channel, lumaBlack, lumaWhite, lumaMean} (0.5th and 99.5th percentiles, 0..1), grain {spatial: per channel in 8-bit steps, the robust spread of each pixel against its 3 x 3 neighbourhood}, sharpness {edgeWidth: median 10 to 90% rise across edges with a luma step of at least minContrast, px (a hard step about 0.8, a Gaussian blur of sigma s about 2.56 s), edges}, colour (CIELAB L, a, b, chroma, hue of the mean). role 'neutral' adds cast {a, b, amount, toward, gains, channelMixer} and a reading; role 'skin' a hue reading. pairs add, per element and plate, grain, sharpness and levels compared, with readings (add grain, soften, seat the blacks). With `times` on consecutive frames, lookSeries adds frame-to-frame grain per region (a still element reads 0). Reported as `look` (per frame with `times`)."
    ),
    diff: z.union([
      z.boolean(),
      z.object({
        changeAbove: z.number().min(0).max(1).optional().describe(
          "A pixel has changed when one of its channels moved by more than this (display values). Default 0.04, about ten 8-bit steps: well above frame-to-frame grain."
        ),
        spikeRatio: z.number().optional().describe(
          "A pair stands out as a spike when its change is at least this many times its neighbours' on each side it has. Default 3."
        ),
        holdRatio: z.number().optional().describe(
          "A pair is a hold (a repeated frame) when its change is at most this share of the moving neighbours' on both sides. Default 0.25."
        ),
        quietBelow: z.number().min(0).max(1).optional().describe(
          "Mean changes below this read as no visible change: neighbours this quiet are not moving, and a spike is measured against at least this. Default 0.002."
        ),
        movingShare: z.number().min(0).max(1).optional().describe(
          "Neighbours count as moving, and a spike counts, only with at least this share of pixels changed. Default 0.0005 (about 1,000 pixels at 1080\xD71920)."
        ),
        window: z.number().int().optional().describe("Pairs on each side compared with a pair. Default 3."),
        amplify: z.number().optional().describe("Gain of the difference images on the diff sheet. Default 8."),
        repeatBelow: z.number().min(0).max(1).optional().describe(
          "A pair changing this little is a repeated frame (identical frames read 0); repeats are never a reference for other pairs. Default 0.0001."
        ),
        sheet: z.union([
          z.boolean(),
          z.object({
            columns: z.number().int().positive().optional(),
            thumbWidth: z.number().int().min(16).max(2048).optional(),
            outPath: z.string().optional().describe("Default <outPath stem>_diff.png.")
          })
        ]).optional().describe(
          "Also write the difference images, amplified and labelled '#from>to change' ('!' on flagged pairs), tiled into one PNG beside the contact sheet. Default off; on with `strip`."
        )
      })
    ]).optional().describe(
      "Frame-to-frame change, with `times` (two or more) or `strip`; `true` for the defaults. Measured on the written file (stage 'output', display values; `diff.picture` says what exactly: with the default rgb output the capture is already over the comp background, so transparent areas do not change). Reported as `diff` {stage, picture, pairs, series} with the thresholds used as `diffThresholds`. Each consecutive pair: from, to, change (mean absolute difference over pixels and channels, 0..1), maxAbsDelta, changedPixels, changedShare (a channel moved by more than changeAbove), changedBounds, and with `sample` the same per region. series: pairs, median, mean, largest, smallest, flags [{kind 'pop' | 'stutter' | 'cut' | 'repeat', pairs, frame or between, change, reference, ratio, atSeriesEdge?, besideRepeat?, unreliablePairs?, reading}], reading. A pop is a frame that differs from both neighbours; a stutter a frame that repeats the one before while the frames around it move; a cut one pair far above its neighbours; a repeat an unchanged pair at the start or end of the series beside motion. Repeated frames are never a reference, and the pairs beside one are named unreliable. Flags are hints from numbers: look at the frames."
    )
  },
  handler: async (args, transport) => {
    const given = [args.time, args.times, args.strip, args.frames].filter(
      (v) => v !== void 0
    ).length;
    if (given !== 1) {
      return errorResult(
        "INVALID_ARGS",
        "give exactly one of `time`, `times`, `strip` or `frames`",
        {
          hint: "`time: 1.5` renders one frame; `times: [0, 1, 2]` renders several in one call; `strip: { at: 1.5, frames: 9 }` renders the frames around a moment; `frames: [42, 43]` renders frames by number."
        }
      );
    }
    if (args.frames !== void 0 && (!Array.isArray(args.frames) || args.frames.length < 1 || args.frames.length > 32 || !args.frames.every((k) => Number.isInteger(k) && k >= 0))) {
      return errorResult(
        "INVALID_ARGS",
        "`frames` must be 1 to 32 whole frame numbers, 0 or more (0 = the comp's first frame)"
      );
    }
    if (args.settleTimeoutMs !== void 0 && !(Number.isInteger(args.settleTimeoutMs) && args.settleTimeoutMs > 0)) {
      return errorResult("INVALID_ARGS", "`settleTimeoutMs` must be a positive whole number of ms");
    }
    let strip = null;
    if (args.strip !== void 0) {
      const planned = planStrip(args.strip);
      if ("error" in planned) return planned.error;
      strip = planned.plan;
    }
    const count = strip?.frames ?? args.frames?.length ?? args.times?.length ?? 1;
    const checked = checkEyesOptions({ ...args, count }, strip !== null);
    if ("error" in checked) return checked.error;
    const rejection = rejectedOutputPath(args.outPath);
    if (rejection !== null) {
      return errorResult("IO", rejection, {
        details: { outPath: path.resolve(args.outPath) },
        hint: "Render to a path outside the mailbox."
      });
    }
    const abs = path.resolve(args.outPath).replace(/\\/g, "/");
    if (args.contactSheet?.outPath !== void 0) {
      const sheetRejection = rejectedOutputPath(args.contactSheet.outPath);
      if (sheetRejection !== null) {
        return errorResult("IO", sheetRejection, {
          details: { outPath: path.resolve(args.contactSheet.outPath) },
          hint: "Write the contact sheet to a path outside the mailbox."
        });
      }
    }
    return nativeFlow(args, checked.options, abs, transport, strip);
  }
});
function invalid(message, hint) {
  return { error: errorResult("INVALID_ARGS", message, hint ? { hint } : {}) };
}
function parseColor(value) {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  }
  if (Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === "number" && v >= 0 && v <= 1)) {
    return [value[0], value[1], value[2]];
  }
  return null;
}
function checkEyesOptions(args, isStrip = false) {
  const channels = args.channels ?? "rgb";
  if (args.colorManaged === "off" && (channels !== "rgb" || args.over !== void 0)) {
    return invalid(
      "`channels` and `over` need colorManaged 'auto'",
      "colorManaged 'off' returns the raw capture untouched (it already keeps any alpha AE wrote)."
    );
  }
  let over = "background";
  if (args.over !== void 0) {
    if (channels !== "rgb") {
      return invalid(
        `\`over\` applies only to channels 'rgb', not '${channels}'`,
        "'rgba' keeps transparency in the file; 'alpha' is the matte itself."
      );
    }
    if (args.over === "checkerboard") over = { kind: "checkerboard" };
    else if (args.over !== "background") {
      const color = parseColor(args.over);
      if (color === null) {
        return invalid(
          "`over` must be 'background', 'checkerboard', '#rrggbb' or [r, g, b] in 0..1"
        );
      }
      over = { kind: "color", color };
    }
  }
  let isolate = null;
  if (args.isolate !== void 0) {
    isolate = Array.isArray(args.isolate) ? args.isolate : [args.isolate];
    if (isolate.length === 0) return invalid("`isolate` needs at least one layer");
    if (readOnlyMode()) {
      return {
        error: errorResult(
          "FORBIDDEN",
          "`isolate` switches layers off and back on, and AE_MCP_READONLY=1 is set",
          {
            hint: "Unset AE_MCP_READONLY, or render without isolate."
          }
        )
      };
    }
  }
  let sample = null;
  if (args.sample !== void 0) {
    const regions = args.sample.regions ?? [];
    if (regions.length === 0) return invalid("`sample.regions` needs at least one region");
    const names = /* @__PURE__ */ new Set();
    for (const r of regions) {
      if (names.has(r.name)) return invalid(`region name '${r.name}' is used twice`);
      names.add(r.name);
    }
    const stage = args.sample.stage ?? "both";
    sample = { regions, stages: stage === "both" ? ["capture", "output"] : [stage] };
  }
  let histogram = null;
  if (args.histogram !== void 0 && args.histogram !== false) {
    const h = args.histogram === true ? {} : args.histogram;
    histogram = { bins: h.bins ?? HISTOGRAM_DEFAULT_BINS, stage: h.stage ?? "output" };
  }
  let compare = null;
  if (args.compare !== void 0) {
    const n = args.count;
    if (n < 2) return invalid("`compare` needs `times` (or `strip`) with at least two frames");
    if (sample === null) {
      return invalid("`compare` needs `sample`: it reports differences for the sampled regions");
    }
    const from = args.compare.from ?? 0;
    const to = args.compare.to ?? 1;
    if (from >= n || to >= n)
      return invalid(`\`compare\` indices must be below ${n}, the number of times`);
    if (from === to) return invalid("`compare.from` and `compare.to` must be different frames");
    compare = { from, to };
  }
  let edge = null;
  if (args.edge !== void 0 && args.edge !== false) {
    edge = args.edge === true ? {} : args.edge;
    if (typeof edge !== "object" || edge === null)
      return invalid("`edge` must be true or an object");
    const problem = edgeArgsError(edge);
    if (problem !== null) return invalid(problem);
  }
  let screen = null;
  if (args.screen !== void 0 && args.screen !== false) {
    screen = args.screen === true ? {} : args.screen;
    if (typeof screen !== "object" || screen === null)
      return invalid("`screen` must be true or an object");
    const problem = screenArgsError(screen);
    if (problem !== null) return invalid(problem);
  }
  let look = null;
  if (args.look !== void 0) {
    const problem = lookArgsError(args.look);
    if (problem !== null) return invalid(problem);
    look = args.look;
  }
  let diff = null;
  const diffArg = args.diff ?? (isStrip ? true : void 0);
  if (diffArg !== void 0 && diffArg !== false) {
    const d = diffArg === true ? {} : diffArg;
    if (typeof d !== "object" || d === null) return invalid("`diff` must be true or an object");
    if (args.count < 2) {
      return invalid(
        "`diff` needs `times` with at least two frames, or `strip`",
        "It compares consecutive rendered frames: `times: [1, 1.04, 1.08], diff: true`."
      );
    }
    const problem = diffArgsError(d);
    if (problem !== null) return invalid(problem);
    const { sheet: sheetArg, ...thresholds } = d;
    const sheetOn = sheetArg ?? isStrip;
    if (sheetOn !== false && sheetOn !== true && (typeof sheetOn !== "object" || sheetOn === null)) {
      return invalid("`diff.sheet` must be true, false or an object");
    }
    diff = {
      thresholds: resolveDiffThresholds(thresholds),
      sheet: sheetOn === false ? null : sheetOn === true ? {} : sheetOn
    };
  }
  return {
    options: {
      channels,
      over,
      overGiven: args.over !== void 0,
      isolate,
      sample,
      histogram,
      compare,
      edge,
      screen,
      look,
      diff
    }
  };
}
function planStrip(strip) {
  const fail = (message) => ({
    error: errorResult("INVALID_ARGS", message, {
      hint: "`strip: { at: 2.5, frames: 9 }` renders the nine frames around 2.5 s."
    })
  });
  if (typeof strip !== "object" || strip === null) return fail("`strip` must be an object");
  const { at, frames } = strip;
  const step = strip.step ?? 1;
  const maxDimension = strip.maxDimension ?? STRIP_DEFAULT_MAX_DIMENSION;
  if (typeof at !== "number" || !Number.isFinite(at) || at < 0)
    return fail("`strip.at` must be a time in seconds, 0 or more");
  if (!Number.isInteger(frames) || frames < 2 || frames > 32)
    return fail("`strip.frames` must be a whole number from 2 to 32");
  if (!Number.isInteger(step) || step < 1)
    return fail("`strip.step` must be a whole number, 1 or more");
  if (!Number.isInteger(maxDimension) || maxDimension < 16 || maxDimension > 2048)
    return fail("`strip.maxDimension` must be a whole number of px from 16 to 2048");
  const first = -Math.floor((frames - 1) / 2);
  const offsets = Array.from({ length: frames }, (_, k) => (first + k) * step);
  return { plan: { at, offsets, frames, step, maxDimension } };
}
function sheetPathFor(abs, explicit) {
  if (explicit !== void 0) return path.resolve(explicit).replace(/\\/g, "/");
  const ext = path.extname(abs) || ".png";
  const stem = abs.slice(0, abs.length - (path.extname(abs).length || 0));
  return `${stem}_sheet${ext}`;
}
function framePaths(abs, count, multi) {
  if (!multi) return [abs];
  const ext = path.extname(abs) || ".png";
  const stem = abs.slice(0, abs.length - (path.extname(abs).length || 0));
  const out = [];
  for (let i = 0; i < count; i++) out.push(`${stem}_${i}${ext}`);
  return out;
}
const ISOLATE_FN = `
    function _refText(ref) {
        if (typeof ref === "string") return '"' + ref + '"';
        if (typeof ref === "number") return "index " + ref;
        if (ref && typeof ref.id === "number") return "id " + ref.id;
        return String(ref);
    }
    function _restoreLayers(saved) {
        var failed = [];
        for (var i = saved.length - 1; i >= 0; i--) {
            var s = saved[i];
            if (!s.changed) continue;
            try {
                if (s.layer.locked) s.layer.locked = false;
                if (s.layer.enabled !== s.enabled) s.layer.enabled = s.enabled;
                if (s.hasSolo && s.layer.solo !== s.solo) s.layer.solo = s.solo;
                if (s.locked) s.layer.locked = true;
            } catch (eRestore) {
                failed.push(AE.safeGet(function () { return s.layer.index + " " + s.layer.name; }, "?") + ": " + AE.errText(eRestore));
            }
        }
        return failed;
    }
    function _isolateLayers(c, refs) {
        var keep = {};
        var named = [];
        for (var ri = 0; ri < refs.length; ri++) {
            var hit = AE.findLayerInComp(c, refs[ri]);
            if (!hit) return { ok: false, error: "isolate: no layer matching " + _refText(refs[ri]) + " in comp " + c.name };
            if (keep["k" + hit.index]) continue;
            keep["k" + hit.index] = true;
            named.push({ index: hit.index, name: hit.name });
        }
        var saved = [];
        var changed = 0;
        try {
            for (var li = 1; li <= c.numLayers; li++) {
                var L = c.layer(li);
                // Audio-only layers put nothing in the picture, and their
                // video switch may refuse to change: leave them be.
                if (AE.safeGet(function () { return L.hasVideo; }, true) === false) continue;
                var mn = AE.safeGet(function () { return L.matchName; }, "");
                var view = (mn === "ADBE Camera Layer" || mn === "ADBE Light Layer");
                var s = { layer: L, enabled: L.enabled, locked: !!L.locked, hasSolo: false, solo: false, changed: false };
                try { s.solo = !!L.solo; s.hasSolo = true; } catch (eSolo) { }
                saved.push(s);
                var want = keep["k" + L.index] ? true : (view ? s.enabled : false);
                if (want === s.enabled && !s.solo) continue;
                s.changed = true;
                changed++;
                if (s.locked) L.locked = false;
                if (s.solo) L.solo = false;
                if (L.enabled !== want) L.enabled = want;
            }
        } catch (eIso) {
            var undone = _restoreLayers(saved);
            return { ok: false, error: "isolate: could not switch layers (" + AE.errText(eIso) + ")" + (undone.length ? "; NOT restored: " + undone.join("; ") : "; every switch restored") };
        }
        return { ok: true, saved: saved, layers: named, changed: changed };
    }
`;
function renderJsx(args, times, paths, tryOcio, isolate, strip = null, frameNums = null) {
  return `
        ${RENDER_FRAME_FN}
        ${MISSING_SOURCES_FN}
        ${OCIO_CAPTURE_FN}
        ${ISOLATE_FN}
        var _arg = ${jsxVal(args.compNameOrId)};
        var comp = AE.findCompByNameOrId(_arg);
        if (!comp) return { ok: false, error: "no comp matching " + String(_arg) };
        var _missingMedia = _missingSources(comp);
        if (_missingMedia.length) return { ok: false, error: "source media missing for comp " + comp.name + "; restore or relink before rendering", missingFootage: _missingMedia };
        var _ws = AE.safeGet(function () { return app.project.workingSpace; }, "None");
        var _times = ${jsxVal(times)};
        var _strip = ${jsxVal(strip === null ? null : { at: strip.at, offsets: strip.offsets })};
        var _frameNums = ${jsxVal(frameNums)};
        var _paths = ${jsxVal(paths)};
        var _pick = ${jsxVal(FRAME_PICK)};
        var _stripOut = null;
        if (_frameNums !== null) {
            var _lastF = Math.max(0, Math.round(comp.duration / comp.frameDuration) - 1);
            _times = [];
            for (var _ni = 0; _ni < _frameNums.length; _ni++) {
                if (_frameNums[_ni] > _lastF) return { ok: false, error: "frame " + _frameNums[_ni] + " is past the comp's last frame, " + _lastF + " (comp " + comp.name + ")" };
                _times.push((_frameNums[_ni] + _pick) * comp.frameDuration);
            }
        }
        if (_strip !== null) {
            var _fd = comp.frameDuration;
            var _lastK = Math.max(0, Math.round(comp.duration / _fd) - 1);
            var _k0 = Math.round(_strip.at / _fd);
            var _offs = _strip.offsets;
            var _shift = 0;
            if (_k0 + _offs[_offs.length - 1] > _lastK) _shift = _lastK - (_k0 + _offs[_offs.length - 1]);
            if (_k0 + _offs[0] + _shift < 0) _shift = -(_k0 + _offs[0]);
            _times = [];
            var _clamped = 0;
            for (var _si = 0; _si < _offs.length; _si++) {
                var _k = _k0 + _offs[_si] + _shift;
                if (_k > _lastK) { _k = _lastK; _clamped++; }
                _times.push((_k + _pick) * _fd);
            }
            _stripOut = {
                at: Math.round(_k0 * _fd * 1e6) / 1e6,
                frameRate: Math.round(1e3 / _fd) / 1e3,
                firstFrame: _k0 + _offs[0] + _shift,
                lastFrame: Math.min(_lastK, _k0 + _offs[_offs.length - 1] + _shift),
                shiftedFrames: _shift
            };
            if (_clamped > 0) _stripOut.note = "the comp is shorter than the strip: the last " + _clamped + " frames repeat the comp's last frame (they read as stutters in diff)";
        }
        var _useDst = ${jsxVal(!!args.useDisplayStartTime)};
        var _useOcio = ${jsxVal(tryOcio)} && _ws !== "None" && _ws !== "";
        var _isolate = ${jsxVal(isolate)};
        var _frames = [];
        function _renderAll(kind) {
            for (var _fi = 0; _fi < _times.length; _fi++) {
                var _r = _renderFrame(comp, _times[_fi], _paths[_fi], _useDst);
                _r.captureKind = kind;
                if (_r.ok) {
                    // The frame this time falls in, counted from frame 0 in the
                    // convention of time; within a millionth of a frame of a
                    // boundary counts as on it (k / fps in floating point).
                    var _pos = _times[_fi] / comp.frameDuration;
                    var _fk = Math.floor(_pos + 1e-6);
                    _r.frame = _fk;
                    _r.frameOffset = Math.max(0, Math.round((_pos - _fk) * 1e6) / 1e6);
                }
                _frames.push(_r);
            }
        }
        var _iso = null;
        if (_isolate !== null) {
            _iso = _isolateLayers(comp, _isolate);
            if (!_iso.ok) return { ok: false, error: _iso.error };
        }
        var _renderError = null;
        try {
            if (_useOcio) {
                var _maxT = _times[0];
                for (var _mi = 1; _mi < _times.length; _mi++) { if (_times[_mi] > _maxT) _maxT = _times[_mi]; }
                if (_useDst) _maxT = _maxT + comp.displayStartTime;
                _captureWithOcio(comp, _maxT, _renderAll);
            }
            if (_frames.length === 0) _renderAll("direct");
        } catch (eRender) {
            _renderError = eRender;
        }
        var _isoReport = null;
        if (_iso) {
            var _notRestored = _restoreLayers(_iso.saved);
            _isoReport = { layers: _iso.layers, changed: _iso.changed, restored: _notRestored.length === 0 };
            if (_notRestored.length) _isoReport.notRestored = _notRestored;
        }
        if (_renderError !== null) {
            var _fail = { ok: false, error: "render failed: " + AE.errText(_renderError) };
            if (_isoReport) _fail.isolation = _isoReport;
            return _fail;
        }
        var _allOk = true;
        var _firstError = null;
        for (var _ci = 0; _ci < _frames.length; _ci++) {
            if (!_frames[_ci].ok) { _allOk = false; if (_firstError === null) _firstError = _frames[_ci].error; }
        }
        var _out = { ok: _allOk, frames: _frames, captureKind: _frames.length > 0 ? _frames[0].captureKind : null };
        if (_isoReport) _out.isolation = _isoReport;
        if (_stripOut) _out.strip = _stripOut;
        if (!_allOk) _out.error = _firstError;
        if (_allOk) {
            _out.compName = comp.name;
            _out.workingSpace = _ws;
            _out.bitsPerChannel = AE.safeGet(function () { return app.project.bitsPerChannel; }, 8);
            _out.projectFile = app.project.file ? app.project.file.fsName.replace(/\\\\/g, "/") : null;
            _out.bgColor = AE.safeGet(function () { return [comp.bgColor[0], comp.bgColor[1], comp.bgColor[2]]; }, null);
        }
        return _out;
    `;
}
async function nativeFlow(args, opts, abs, transport, strip = null) {
  const startedAt = performance.now();
  const frameNums = args.frames ?? null;
  const multi = args.times !== void 0 || strip !== null || frameNums !== null;
  const times = strip !== null || frameNums !== null ? null : args.times ?? [args.time];
  const count = strip?.frames ?? frameNums?.length ?? times?.length ?? 1;
  const paths = framePaths(abs, count, multi);
  const contactSheet = args.contactSheet ?? (strip !== null ? {} : void 0);
  const before = await stampFiles(paths);
  const tryOcio = args.colorManaged !== "off" && !readOnlyMode();
  const result = await transport.execute({
    code: renderJsx(args, times, paths, tryOcio, opts.isolate, strip, frameNums),
    label: "render_frame",
    timeoutMs: 12e4 + (count - 1) * 3e4
  });
  const aeCallMs = performance.now() - startedAt;
  if (!result.ok) return toMcpResult(result);
  const payload = result.result;
  const frames = payload?.frames ?? [];
  const frameSize = frames[0]?.size;
  if (payload && strip !== null) {
    payload.strip = {
      at: strip.at,
      frames: strip.frames,
      step: strip.step,
      maxDimension: strip.maxDimension,
      ...payload.strip
    };
  }
  if (payload && payload.ok === true) {
    const warning = frameWarnings(frames);
    if (warning !== void 0) payload.frameWarning = warning;
  }
  if (payload && payload.ok === true && !multi && frames.length === 1) {
    payload.writtenTo = frames[0].writtenTo;
    payload.time = frames[0].time;
    if (frames[0].frame !== void 0) payload.frame = frames[0].frame;
    if (frames[0].frameOffset !== void 0) payload.frameOffset = frames[0].frameOffset;
    payload.size = frames[0].size;
    delete payload.frames;
  }
  if (!payload || payload.ok !== true) {
    return toMcpResult(result);
  }
  if (payload.isolation && !payload.isolation.restored) {
    payload.isolationWarning = "some layer switches could not be restored after isolate \u2014 check these layers in the timeline: " + (payload.isolation.notRestored ?? []).join("; ");
  }
  const written = (multi ? frames.map((f) => f.writtenTo) : [payload.writtenTo]).filter(
    (p) => typeof p === "string"
  );
  const put = (i, key, value) => {
    if (multi) frames[i][key] = value;
    else payload[key] = value;
  };
  const managed = args.colorManaged !== "off";
  let convert = null;
  let backdrop = null;
  if (managed) {
    payload.method = "native";
    payload.channels = opts.channels;
    convert = await colorConversion(payload, transport);
    if (convert === null && (opts.channels !== "rgb" || opts.overGiven)) {
      payload.channelsWarning = "colour conversion failed (see colorWarning), so the raw capture was kept and `channels` / `over` were not applied";
    }
    if (convert !== null && opts.channels === "rgb") backdrop = chooseBackdrop(payload, opts);
  }
  const bg = validRgb(payload.bgColor);
  const unmatting = convert !== null && (opts.channels === "rgba" || backdrop !== null);
  const settle = await waitForSettled(written, {
    timeoutMs: args.settleTimeoutMs ?? settleTimeoutFor(written.length, frameSize ? frameSize[0] * frameSize[1] : 1080 * 1920),
    before: before.slice(0, written.length)
  });
  payload.captureSettle = settle;
  if (settle.unsettled.length > 0) {
    const secs = (settle.timeoutMs / 1e3).toFixed(1);
    for (const u of settle.unsettled) {
      if (!multi || !frames[u.index]) continue;
      frames[u.index].ok = false;
      frames[u.index].error = `the capture did not finish writing within ${secs} s (${u.state}, ${u.bytes} bytes)`;
    }
    payload.captureWarning = `${settle.unsettled.length} of ${written.length} captures did not finish writing within ${secs} s (saveFrameToPng writes asynchronously): frames ${settle.unsettled.map((u) => u.index).join(", ")}. ` + (settle.settled.length > 0 ? "The others were measured; see captureSettle, or render the missing ones again with a longer settleTimeoutMs." : "Nothing could be measured; try again with a longer settleTimeoutMs.");
    if (settle.settled.length === 0) {
      if (args.analyze) payload.analysisWarning = "analysis failed: no capture finished writing";
      if (managed)
        payload.colorWarning = "color post-processing failed, file left as raw capture: no capture finished writing";
      return toMcpResult(result);
    }
  }
  const finished = new Set(settle.settled);
  const keep = new Set(opts.compare ? [opts.compare.from, opts.compare.to] : []);
  const kept = /* @__PURE__ */ new Map();
  const sheetImages = [];
  const sheetLabels = [];
  let sheetThumb = null;
  const diffPairs = [];
  const diffThumbs = [];
  let diffPrev = null;
  let diffThumb = null;
  const diffSkipped = [];
  let read = 0;
  const edgePairs = [];
  let edgePrev = null;
  let edgeMeasured = 0;
  let edgeFromLuma = 0;
  let withAlpha = 0;
  const lookFrames = [];
  let writing = convert !== null;
  for (const [i, file] of written.entries()) {
    if (!finished.has(i)) continue;
    let capture;
    try {
      capture = decodePng(await fs.readFile(file));
      read++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      payload.captureWarning = `could not read the capture: ${msg}`;
      if (args.analyze) payload.analysisWarning = `analysis failed: ${msg}`;
      if (managed)
        payload.colorWarning = `color post-processing failed, file left as raw capture: ${msg}`;
      return toMcpResult(result);
    }
    if (capture.alpha) withAlpha++;
    if (opts.edge) {
      const fromLuma = opts.edge.from === "luma";
      if (fromLuma) edgeFromLuma++;
      if (!capture.alpha && !fromLuma) edgePrev = null;
      else {
        try {
          const t = resolveEdgeThresholds(opts.edge, capture.width, capture.height);
          payload.edgeThresholds ??= t;
          const { report, frame } = measureEdge(capture, bg ?? [0, 0, 0], t);
          put(i, "edge", report);
          edgeMeasured++;
          if (edgePrev !== null && edgePrev.index === i - 1) {
            edgePairs.push({
              from: { index: i - 1, time: frames[i - 1]?.time },
              to: { index: i, time: frames[i]?.time },
              ...alphaChange(edgePrev.frame, frame, t)
            });
          }
          edgePrev = multi ? { index: i, frame } : null;
        } catch (err) {
          payload.edgeWarning = `edge measurement failed: ${err instanceof Error ? err.message : String(err)}`;
          edgePrev = null;
        }
      }
    }
    if (opts.screen) {
      try {
        const t = resolveScreenThresholds(opts.screen, capture.width, capture.height);
        payload.screenThresholds ??= t;
        put(i, "screen", measureScreen(capture, t));
      } catch (err) {
        payload.screenWarning = `screen measurement failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    if (args.analyze) {
      try {
        put(i, "analysis", analyzeFrame(capture));
      } catch (err) {
        payload.analysisWarning = `analysis failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    let output = capture;
    if (writing && convert !== null) {
      try {
        output = await writeOutput(
          file,
          capture,
          convert,
          opts.channels,
          backdrop,
          bg ?? [0, 0, 0]
        );
      } catch (err) {
        payload.colorWarning = `color post-processing failed, file left as raw capture: ${err instanceof Error ? err.message : String(err)}`;
        writing = false;
      }
    }
    const pixels = { capture, output };
    if (opts.sample) put(i, "samples", sampleReport(pixels, opts.sample));
    if (opts.look) {
      try {
        put(i, "look", measureLook(output, opts.look));
        if (multi)
          lookFrames.push({
            index: i,
            frame: frames[i]?.frame,
            crops: lookCrops(output, opts.look)
          });
      } catch (err) {
        payload.lookWarning = `look measurement failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    if (opts.histogram) {
      const { bins, stage } = opts.histogram;
      put(i, "histogram", { stage, ...histogramOf(pixels[stage], bins) });
    }
    if (keep.has(i)) kept.set(i, pixels);
    const straight = output !== capture && output.alpha !== void 0;
    if (contactSheet) {
      sheetThumb ??= thumbSizeFor(
        output,
        contactSheet.thumbWidth ?? stripThumbWidth(strip, output)
      );
      sheetImages.push(
        sheetTile(output === capture ? { ...capture, alpha: void 0 } : output, sheetThumb)
      );
      sheetLabels.push(frameLabel(i, frames[i]?.time ?? payload.time));
    }
    if (opts.diff) {
      payload.diffThresholds ??= opts.diff.thresholds;
      const pic = pictureOf(output, straight);
      const { width, height } = output;
      if (diffPrev !== null && diffPrev.index !== i - 1) {
        diffSkipped.push(`${diffPrev.index}>${i} (frames between are missing)`);
      } else if (diffPrev !== null && (diffPrev.width !== width || diffPrev.height !== height)) {
        diffSkipped.push(`${i - 1}>${i} (frame sizes differ)`);
      } else if (diffPrev !== null) {
        if (opts.diff.sheet) {
          diffThumb ??= thumbSizeFor(
            output,
            opts.diff.sheet.thumbWidth ?? contactSheet?.thumbWidth ?? stripThumbWidth(strip, output)
          );
        }
        try {
          const res = pictureChange(diffPrev.pic, pic, width, height, opts.diff.thresholds, {
            regions: opts.sample?.regions,
            thumb: diffThumb ?? void 0
          });
          const pair = {
            from: { index: i - 1, time: frames[i - 1]?.time },
            to: { index: i, time: frames[i]?.time },
            ...res.all
          };
          if (res.regions) pair.regions = res.regions;
          if (res.thumb && diffThumb) {
            const grey = new Float64Array(res.thumb.length * 3);
            for (let k = 0; k < res.thumb.length; k++) grey.fill(res.thumb[k], k * 3, k * 3 + 3);
            diffThumbs.push({
              pair: diffPairs.length,
              img: { width: diffThumb.width, height: diffThumb.height, rgb: grey, bitDepth: 8 }
            });
          }
          diffPairs.push(pair);
        } catch (err) {
          payload.diffWarning = `diff failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
      payload.diff ??= {
        stage: "output",
        picture: diffPicture(output === capture, opts.channels, payload.over),
        pairs: [],
        series: summarizeSeries([], opts.diff.thresholds)
      };
      diffPrev = { index: i, pic, width, height };
    }
  }
  payload.alphaChannel = withAlpha === 0 ? "absent" : withAlpha === read ? "present" : "mixed";
  if (unmatting && withAlpha > 0 && bg === null) {
    payload.channelsWarning = "the comp background colour (bgColor) is unknown, so the colour under it was recovered as if it were black; soft edges may carry the real background";
  }
  if (convert !== null && payload.alphaChannel === "absent") {
    if (opts.channels === "alpha") {
      payload.alphaWarning = "the capture has no alpha channel, so the matte is all white (fully opaque). If this comp should be transparent here, saveFrameToPng did not write alpha for it.";
    } else if (opts.channels === "rgba") {
      payload.alphaWarning = "the capture has no alpha channel, so the file's alpha is fully opaque";
    } else if (opts.overGiven) {
      payload.alphaWarning = "the capture has no alpha channel, so there was nothing to composite over `over`";
    }
  }
  if (opts.edge) {
    if (edgeFromLuma === 0 && withAlpha < read) {
      payload.edgeWarning = `${read - withAlpha} of ${read} captures have no alpha channel, so their matte could not be measured (a comp with no transparency, or an AE that flattens)`;
    } else if (edgeFromLuma === 0 && edgeMeasured > 0 && bg === null) {
      payload.edgeWarning = "the comp background colour (bgColor) is unknown, so the soft edge's colour was recovered as if it were black; the spill reading may carry the real background";
    }
    if (edgePairs.length > 0) {
      payload.edgeFlicker = { pairs: edgePairs, overall: summarizeFlicker(edgePairs) };
    }
  }
  if (opts.look && lookFrames.length >= 2) {
    const consecutive = lookFrames.every(
      (f, k) => k === 0 || typeof f.frame === "number" && typeof lookFrames[k - 1].frame === "number" && f.frame - lookFrames[k - 1].frame === 1
    );
    if (consecutive)
      payload.lookSeries = summarizeLookSeries(
        lookFrames.map((f) => f.crops),
        opts.look
      );
    else
      payload.lookWarning = "frame-to-frame grain needs consecutive frames (one frame apart, in order); these were not, so lookSeries was left out";
  }
  if (opts.compare && opts.sample) {
    const { from, to } = opts.compare;
    const a = kept.get(from);
    const b = kept.get(to);
    if (a && b) {
      const report = opts.sample.regions.map((r) => ({ name: r.name }));
      for (const stage of opts.sample.stages) {
        compareRegions(a[stage], b[stage], opts.sample.regions).forEach((diff, j) => {
          report[j][stage] = stageBlock(diff, stage);
        });
      }
      payload.comparison = {
        from: { index: from, time: frames[from]?.time },
        to: { index: to, time: frames[to]?.time },
        regions: report
      };
    }
  }
  if (opts.diff && payload.diff) {
    payload.diff.pairs = diffPairs;
    payload.diff.series = summarizeSeries(diffPairs, opts.diff.thresholds);
    if (diffSkipped.length > 0) {
      payload.diffWarning = `some consecutive pairs were not compared: ${diffSkipped.join("; ")}` + (settle.unsettled.length > 0 ? " \u2014 captures missing, see captureSettle" : "");
    }
  }
  const stages = /* @__PURE__ */ new Set([
    ...opts.sample?.stages ?? [],
    ...opts.histogram ? [opts.histogram.stage] : [],
    ...opts.edge || opts.screen ? ["capture"] : [],
    ...opts.diff ? ["output"] : []
  ]);
  if (stages.size > 0) {
    payload.measurementStages = {};
    for (const s of stages) payload.measurementStages[s] = MEASUREMENT_STAGES[s];
  }
  if (contactSheet && sheetImages.length > 0) {
    await attachContactSheet(
      payload,
      sheetLabels,
      sheetImages,
      sheetPathFor(abs, contactSheet.outPath),
      contactSheet
    );
  }
  if (opts.diff?.sheet && payload.diff && diffThumbs.length > 0) {
    await attachDiffSheet(
      payload,
      payload.diff,
      diffThumbs,
      abs,
      opts.diff.sheet,
      opts.diff.thresholds
    );
  }
  const totalMs = performance.now() - startedAt;
  payload.timing = {
    aeCallMs: Math.round(aeCallMs),
    settleMs: settle.waitedMs,
    nodeMs: Math.max(0, Math.round(totalMs - aeCallMs - settle.waitedMs)),
    totalMs: Math.round(totalMs)
  };
  return toMcpResult(result);
}
function thumbSizeFor(img, thumbWidth) {
  const width = Math.max(16, Math.min(thumbWidth ?? 480, img.width));
  return { width, height: Math.max(1, Math.round(img.height * width / img.width)) };
}
function stripThumbWidth(strip, img) {
  if (strip === null) return void 0;
  return Math.max(
    1,
    Math.round(strip.maxDimension * img.width / Math.max(img.width, img.height))
  );
}
function sheetTile(img, thumb) {
  const flat = img.alpha ? { ...img, rgb: flattenOver(img, { kind: "checkerboard" }), alpha: void 0 } : img;
  if (flat.width <= thumb.width) return flat;
  return {
    ...flat,
    width: thumb.width,
    height: thumb.height,
    rgb: resample(flat, thumb.width, thumb.height)
  };
}
function diffPicture(raw, channels, over) {
  if (raw) {
    return "the capture as AE wrote it (no colour conversion: colorManaged off, or the conversion failed): its RGB already laid over the comp background (bgColor), so empty areas read the background in both frames; alpha not compared";
  }
  if (channels === "alpha") return "the written file: the matte (alpha as grey), white opaque";
  if (channels === "rgba") {
    return "the written file's straight colour weighted by its alpha (as over black), so colour under transparent pixels does not count";
  }
  if (over === void 0 || over === "background") {
    return "the written file: the picture as AE composited it over the comp background (bgColor), so transparent areas read the background in both frames and do not change";
  }
  return "the written file: the picture laid over `over`, so transparent areas read that backdrop";
}
async function attachDiffSheet(payload, diff, thumbs, abs, opts, t) {
  try {
    const flagged = new Set(diff.series.flags.flatMap((f) => f.pairs));
    const labels = thumbs.map(({ pair }) => {
      const p = diff.pairs[pair];
      return `#${p.from.index}>${p.to.index} ${p.change.toFixed(4)}${flagged.has(pair) ? " !" : ""}`;
    });
    const sheet = composeContactSheet(
      thumbs.map((th) => th.img),
      { columns: opts.columns, thumbWidth: thumbs[0].img.width, labels }
    );
    const sheetPath = opts.outPath !== void 0 ? path.resolve(opts.outPath).replace(/\\/g, "/") : `${abs.slice(0, abs.length - path.extname(abs).length)}_diff${path.extname(abs) || ".png"}`;
    await fs.mkdir(path.dirname(sheetPath), { recursive: true });
    await fs.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
    payload.diffSheet = {
      writtenTo: sheetPath,
      size: [sheet.width, sheet.height],
      columns: sheet.columns,
      rows: sheet.rows,
      thumbSize: [sheet.thumbWidth, sheet.thumbHeight],
      frames: thumbs.length,
      amplify: t.amplify
    };
  } catch (err) {
    payload.diffWarning = `diff sheet failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}
function stageBlock(stats, stage) {
  const { name: _name, ...rest } = stats;
  if (stage === "output" && Array.isArray(rest.mean)) rest.meanHex = rgbHex(rest.mean);
  return rest;
}
function sampleReport(pixels, sample) {
  const report = sample.regions.map((r) => ({ name: r.name }));
  for (const stage of sample.stages) {
    sampleRegions(pixels[stage], sample.regions).forEach((stats, j) => {
      report[j][stage] = stageBlock(stats, stage);
    });
  }
  return report;
}
function chooseBackdrop(payload, opts) {
  if (opts.over === "background") {
    payload.over = "background";
    return null;
  }
  payload.over = opts.over.kind === "checkerboard" ? "checkerboard" : opts.over.color;
  return opts.over;
}
async function attachContactSheet(payload, labels, tiles, sheetPath, opts) {
  try {
    const sheet = composeContactSheet(tiles, {
      columns: opts.columns,
      thumbWidth: opts.thumbWidth ?? tiles[0].width,
      labels
    });
    await fs.mkdir(path.dirname(sheetPath), { recursive: true });
    await fs.writeFile(sheetPath, encodePngSrgb8(sheet.width, sheet.height, sheet.rgb));
    payload.contactSheet = {
      writtenTo: sheetPath,
      size: [sheet.width, sheet.height],
      columns: sheet.columns,
      rows: sheet.rows,
      thumbSize: [sheet.thumbWidth, sheet.thumbHeight],
      frames: tiles.length
    };
  } catch (err) {
    payload.contactSheetWarning = `contact sheet failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}
async function writeOutput(file, capture, convert, channels, backdrop, bg) {
  const { width, height } = capture;
  const opaque = () => new Float64Array(width * height).fill(1);
  let bytes;
  if (channels === "alpha") {
    bytes = encodePngGray8(width, height, capture.alpha ?? opaque());
  } else if (channels === "rgb" && backdrop === null) {
    const rgb = Float64Array.from(capture.rgb);
    convert(rgb);
    bytes = encodePngSrgb8(width, height, rgb);
  } else {
    const rgb = unmatte(capture, bg);
    convert(rgb);
    bytes = channels === "rgba" ? encodePngSrgbRgba8(width, height, rgb, capture.alpha ?? opaque()) : encodePngSrgb8(width, height, flattenOver({ ...capture, rgb }, backdrop));
  }
  await fs.writeFile(file, bytes);
  return decodePng(bytes);
}
export {
  FRAME_PICK,
  NEAR_FRAME_BOUNDARY,
  frameWarnings,
  renderFrameTool
};
