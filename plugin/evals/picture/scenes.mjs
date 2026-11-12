// The synthetic shots the picture evals build in After Effects, as data. Each
// setup script (keying-shot.jsx, grade-plate.jsx, over-still.jsx) carries a
// copy of its scene as one line of JSON between the markers `// SCENE-BEGIN`
// and `// SCENE-END`; release/tests/picture-evals.test.mjs checks that the
// copies match this file, so the grader and the shot agree on every box and
// colour.
//
// Nothing here is footage: every shot is solids, masks and effects built by
// the setup script. Coordinates are comp pixels, origin top left.

const r2 = (v) => Math.round(v * 100) / 100;

/** A polygon approximating an ellipse, or an arc of one from..to radians (closed by its chord). */
export function ellipse(cx, cy, rx, ry, n = 48, from = 0, to = 2 * Math.PI) {
  const pts = [];
  const closed = to - from >= 2 * Math.PI - 1e-9;
  const steps = closed ? n : n - 1;
  for (let i = 0; i < n; i++) {
    const t = from + ((to - from) * i) / steps;
    pts.push([r2(cx + rx * Math.cos(t)), r2(cy + ry * Math.sin(t))]);
  }
  return pts;
}

const strands = [0, 1, 2, 3, 4, 5].map((i) => {
  const bx = 470 + 28 * i;
  const tx = 430 + 44 * i;
  return [
    [bx - 1.5, 660],
    [bx + 1.5, 660],
    [tx + 1.5, 515],
    [tx - 1.5, 515],
  ];
});

/**
 * Keying: a vertical green-screen shot, built in a source comp and placed as
 * one layer ("green shot") in the comp the agent keys. The screen is a
 * left-to-right ramp, 1.5x brighter on the right; fine grain over everything
 * (After Effects' Noise effect on an adjustment layer at the top of the
 * source comp); a figure of masked solids with feathered (soft) edges and six
 * thin hair strands, which drifts by `motion.to` px over frames
 * 0..motion.untilFrame and then holds; a grey stand in the top-left corner
 * that is not screen and must be masked out.
 */
export const KEYING = {
  id: "keying-shot",
  version: 1,
  width: 1080,
  height: 1920,
  fps: 24,
  frames: 16,
  bg: [0, 0, 0],
  layer: "green shot",
  screen: { left: [0.2, 0.36, 0.24], right: [0.3, 0.54, 0.36] },
  grainAmount: 2,
  motion: { to: [4, 2], untilFrame: 8 },
  parts: [
    {
      name: "body",
      colour: [0.16, 0.21, 0.36],
      feather: 6,
      polygons: [
        [
          [300, 1080],
          [780, 1080],
          [800, 1940],
          [280, 1940],
        ],
        [
          [230, 1110],
          [320, 1100],
          [330, 1700],
          [250, 1710],
        ],
      ],
    },
    {
      name: "skin",
      colour: [0.67, 0.46, 0.4],
      feather: 6,
      polygons: [
        [
          [480, 940],
          [600, 940],
          [600, 1100],
          [480, 1100],
        ],
        ellipse(540, 820, 150, 190),
      ],
    },
    {
      name: "hair",
      colour: [0.22, 0.15, 0.1],
      feather: 4,
      polygons: [ellipse(540, 800, 160, 185, 25, Math.PI, 2 * Math.PI)],
    },
    { name: "strands", colour: [0.22, 0.15, 0.1], feather: 1.5, polygons: strands },
  ],
  stand: { colour: [0.45, 0.45, 0.47], box: { x: 40, y: 40, width: 110, height: 290 } },
  /** Frames the grader reads: edge on a moving and a held frame; flicker on held consecutive frames. */
  gradeFrames: { keyed: [4, 10, 11, 12, 13], edge: [4, 10], flicker: [10, 11, 12, 13], source: 10 },
  /** Boxes that are screen in every frame (clear of the figure, its drift and feather, and the stand). */
  screenBoxes: [
    { name: "screen left", x: 40, y: 420, width: 160, height: 580 },
    { name: "screen right", x: 860, y: 300, width: 180, height: 1300 },
    { name: "screen top", x: 300, y: 60, width: 500, height: 380 },
    { name: "screen low left", x: 40, y: 1750, width: 160, height: 150 },
  ],
  /** Boxes inside the figure in every frame, at least 17 px from any soft edge. */
  subjectBoxes: [
    { name: "body core", x: 340, y: 1140, width: 400, height: 740 },
    { name: "head core", x: 470, y: 830, width: 140, height: 130 },
    { name: "hair core", x: 480, y: 660, width: 120, height: 100 },
  ],
  /** The stand's box grown by 6 px: where the garbage mask must leave nothing. */
  standBox: { name: "corner stand", x: 34, y: 34, width: 122, height: 302 },
};

/** The deliberate error baked into the grade subject's colours: out = true × cast + lift, per channel. */
export const GRADE_ERROR = { cast: [1.08, 1.0, 0.86], lift: 0.05 };

export const withGradeError = (c) =>
  c.map((v, i) => Math.round((v * GRADE_ERROR.cast[i] + GRADE_ERROR.lift) * 1e4) / 1e4);

const TRUE_SHADOW = [0.07, 0.07, 0.08];
const TRUE_NEUTRAL = [0.45, 0.45, 0.45];
const TRUE_HIGHLIGHT = [0.82, 0.82, 0.8];

/**
 * Grade to plate: a landscape plate (precomp layer "plate") with a dark
 * doorway, a grey panel and a light window panel; a subject (precomp layer
 * "subject") whose shirt, trousers and held card are the plate's neutral,
 * shadow and highlight values put through GRADE_ERROR (a warm cast and raised
 * blacks), plus a grey ramp strip (true 0.06 at the bottom to 0.84 at the top)
 * that shows crushing or clipping.
 */
export const GRADE = {
  id: "grade-plate",
  version: 1,
  width: 1920,
  height: 1080,
  fps: 24,
  frames: 24,
  bg: [0, 0, 0],
  layer: "subject",
  plateLayer: "plate",
  error: GRADE_ERROR,
  truth: { shadow: TRUE_SHADOW, neutral: TRUE_NEUTRAL, highlight: TRUE_HIGHLIGHT },
  plate: {
    wall: [0.42, 0.4, 0.37],
    rects: [
      { name: "doorway", colour: TRUE_SHADOW, box: { x: 100, y: 300, width: 300, height: 700 } },
      { name: "grey panel", colour: TRUE_NEUTRAL, box: { x: 1400, y: 250, width: 350, height: 350 } },
      { name: "window panel", colour: TRUE_HIGHLIGHT, box: { x: 1450, y: 700, width: 350, height: 250 } },
    ],
  },
  subject: {
    rects: [
      { name: "shirt", colour: withGradeError(TRUE_NEUTRAL), box: { x: 720, y: 400, width: 460, height: 360 } },
      { name: "trousers", colour: withGradeError(TRUE_SHADOW), box: { x: 720, y: 760, width: 460, height: 320 } },
      { name: "card", colour: withGradeError(TRUE_HIGHLIGHT), box: { x: 780, y: 460, width: 160, height: 120 } },
    ],
    head: { colour: withGradeError([0.67, 0.46, 0.4]), centre: [950, 290], radii: [90, 110] },
    strip: {
      box: { x: 1110, y: 420, width: 40, height: 640 },
      top: withGradeError([0.84, 0.84, 0.84]),
      bottom: withGradeError([0.06, 0.06, 0.06]),
    },
  },
  gradeFrame: 0,
  /** The named reference regions the task gives and the grader samples. */
  regions: {
    "subject shadow": { x: 780, y: 820, width: 300, height: 220 },
    "subject neutral": { x: 800, y: 620, width: 200, height: 120 },
    "subject highlight": { x: 800, y: 480, width: 120, height: 80 },
    "plate shadow": { x: 140, y: 360, width: 220, height: 580 },
    "plate neutral": { x: 1440, y: 290, width: 270, height: 270 },
    "plate highlight": { x: 1490, y: 740, width: 270, height: 170 },
  },
  /** The subject's bounding box: the histogram for crushing and clipping is read here. */
  subjectBox: { x: 700, y: 170, width: 500, height: 910 },
};

/**
 * Reusable still: a soft glow (a solid with a wide-feathered elliptical mask)
 * in a comp whose background is a strong pink, so a capture laid over that
 * background shows pink in every soft pixel.
 */
export const OVER = {
  id: "over-still",
  version: 1,
  width: 1080,
  height: 1080,
  fps: 24,
  frames: 24,
  bg: [0.85, 0.2, 0.6],
  layer: "glow",
  glow: { colour: [1, 0.92, 0.7], centre: [540, 540], radius: 220, feather: 200 },
  navy: [11 / 255, 31 / 255, 58 / 255],
  navyHex: "#0b1f3a",
  gradeFrame: 0,
  /** The soft ring (radius in px from the centre) where the glow is partly transparent. */
  ring: { inner: 150, outer: 300 },
};

/**
 * The whole-piece check: two comps built side by side, 1080x1920 at 30 fps,
 * 150 frames (5 s), a dark blue-grey background, a square "dot" that moves
 * left to right the whole time, and a centred title.
 *   seeded: four defects at known frames. A one-frame white flash
 *     (`flash.frame`); the dot holds still from frozen.fromFrame to
 *     frozen.toFrame (nothing else moves then, so the whole picture is frozen);
 *     the title slides right from title.moveFromFrame to title.moveToFrame and
 *     leaves the frame on the way (when exactly depends on the font's width);
 *     a white feathered glare (`glare`) clipped to 255 from glare.fromFrame to
 *     glare.toFrame.
 *   clean: the same dot moving steadily from start to end and the title held
 *     in place; nothing a viewer would flag.
 * Nothing is pure white except the flash and the glare (the title is 0.95).
 */
export const FINISH = {
  id: "finish-check",
  version: 1,
  width: 1080,
  height: 1920,
  fps: 30,
  frames: 150,
  bg: [0.12, 0.14, 0.2],
  dot: { name: "dot", size: 160, colour: [0.85, 0.55, 0.3], y: 1500, fromX: 150, toX: 930 },
  flash: { name: "flash", frame: 36, colour: [1, 1, 1] },
  frozen: { fromFrame: 60, toFrame: 80 },
  title: { name: "Title", text: "FINISH", fontSize: 140, colour: [0.95, 0.93, 0.88], x: 540, y: 700, moveFromFrame: 90, moveToFrame: 135, toX: 1500 },
  glare: { name: "glare", fromFrame: 120, toFrame: 134, centre: [300, 1100], radius: 140, feather: 40, colour: [1, 1, 1] },
};

/** The grade error of the second take: out = true × cast per channel (red and blue up, green down: magenta). */
const REVIEW_CAST = [1.14, 0.88, 1.12];
const castOf = (c) => c.map((v, i) => Math.round(Math.min(1, v * REVIEW_CAST[i]) * 1e4) / 1e4);
// The presenter, in comp pixels at take 1's framing: trousers, shirt, neck, head. Each a masked solid the size of the comp.
const PRESENTER = [
  { name: "trousers", colour: [0.12, 0.12, 0.13], polygon: [[780, 860], [1140, 860], [1150, 1100], [770, 1100]] },
  { name: "shirt", colour: [0.62, 0.62, 0.62], polygon: [[760, 560], [1160, 560], [1180, 880], [740, 880]] },
  { name: "neck", colour: [0.67, 0.46, 0.4], polygon: [[925, 500], [995, 500], [995, 580], [925, 580]] },
  { name: "head", colour: [0.67, 0.46, 0.4], polygon: ellipse(960, 410, 105, 130) },
];

/**
 * The independent review (eval 22): one comp, 1920x1080 at 30 fps, 6 s, a
 * composited presenter over a studio wall, with four planted defects a
 * reviewer has to find. Everything is solids and masks.
 *   plate: a neutral grey wall with a fine grid of darker lines (detail that
 *     shows focus), a precomp larger than the frame so a blur has no edge.
 *   take 1 (frames 0..89): the presenter with a light fringe `fringe.width` px
 *     wide all round (the masks grown, behind the parts): the outline defect.
 *   take 2 (frames 90..179), after an intended cut, closer: the presenter's
 *     colours put through REVIEW_CAST (magenta) against the neutral wall: the
 *     colour defect.
 *   plate soft (frames soft.fromFrame..soft.toFrame): the plate blurred while
 *     the presenter stays sharp: the focus defect.
 *   badge: drops in from above the frame and should land on the comp marker
 *     `marker` (2.0 s); it lands on landFrame, several frames late: the
 *     timing defect.
 * Both takes drift a little, so the picture never freezes.
 */
export const REVIEW = {
  id: "review-plate",
  version: 1,
  width: 1920,
  height: 1080,
  fps: 30,
  frames: 180,
  bg: [0, 0, 0],
  marker: { name: "hit", frame: 60, comment: "hit" },
  plate: { name: "plate", width: 2112, height: 1272, wall: [0.46, 0.46, 0.46], lines: [0.34, 0.34, 0.34], lineWidth: 4, spacing: 48 },
  soft: { name: "plate soft", fromFrame: 120, toFrame: 149, blur: 30 },
  fringe: { colour: [0.92, 0.92, 0.9], width: 4 },
  partFeather: 1,
  takes: [
    { name: "take 1", fromFrame: 0, toFrame: 89, fringe: true, cast: null, anchor: [960, 540], scale: 100, fromPos: [900, 540], toPos: [1020, 540],
      parts: PRESENTER },
    { name: "take 2", fromFrame: 90, toFrame: 179, fringe: false, cast: REVIEW_CAST, anchor: [960, 1080], scale: 125, fromPos: [1000, 1080], toPos: [1120, 1080],
      parts: PRESENTER.map((p) => ({ ...p, colour: castOf(p.colour) })) },
  ],
  badge: { name: "badge", colour: [0.95, 0.5, 0.15], size: [360, 140], x: 1500, fromY: -120, toY: 220, fromFrame: 45, landFrame: 68, toFrame: 89 },
  /** The brief the reviewer is handed (the eval prompt carries the same text). */
  brief: "A 6-second 1920x1080 teaser at 30 fps. A presenter, keyed, composited over a studio wall plate; it must read as one shot filmed in that room. " +
    "Two takes: take 1 from 0 to 3.0 s, then a cut to take 2 (closer) at 3.0 s, held to 6.0 s. The orange badge (a stand-in for the price tag) drops in " +
    "from the top and must land on the beat at the comp marker \"hit\", 2.0 s. No on-screen copy.",
};

const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/**
 * REVIEW as a generic build: comps in the order they are made, each with its
 * layers bottom to top. Layer: { name, solid?: colour, comp?: id, size?,
 * span?: [fromFrame, toFrame], masks?: [{ points, feather?, grow? }],
 * effects?: [{ matchName, set: [[property index, value]] }], anchor?, scale?,
 * position?: [x, y] | [[frame, [x, y]], ...] (linear keys) }. The main comp
 * has `markers`. Names are neutral: what the comp holds is found by looking.
 * review-plate.jsx carries this, base64-encoded, so a reviewer who reads the
 * setup script to run it learns nothing from it.
 */
export function reviewBuild(scene = REVIEW) {
  const P = scene.plate;
  const grid = [];
  for (let x = P.spacing / 2; x < P.width; x += P.spacing) grid.push({ points: rectPts(x - P.lineWidth / 2, 0, P.lineWidth, P.height) });
  for (let y = P.spacing / 2; y < P.height; y += P.spacing) grid.push({ points: rectPts(0, y - P.lineWidth / 2, P.width, P.lineWidth) });
  const plate = { id: "plate", name: "plate", size: [P.width, P.height], layers: [
    { name: "wall", solid: P.wall },
    { name: "wall detail", solid: P.lines, masks: grid },
  ] };
  const takes = scene.takes.map((t, i) => ({ id: `take${i + 1}`, name: t.name, size: [scene.width, scene.height], layers: [
    ...(t.fringe ? [{ name: "presenter 0", solid: scene.fringe.colour,
      masks: t.parts.map((p) => ({ points: p.polygon, feather: scene.partFeather, grow: scene.fringe.width })) }] : []),
    ...t.parts.map((p, j) => ({ name: `presenter ${j + 1}`, solid: p.colour, masks: [{ points: p.polygon, feather: scene.partFeather }] })),
  ] }));
  const B = scene.badge;
  const main = { id: "main", name: "review", size: [scene.width, scene.height], main: true,
    markers: [{ frame: scene.marker.frame, name: scene.marker.name, comment: scene.marker.comment }],
    layers: [
      { name: "plate", comp: "plate" },
      { name: "plate", comp: "plate", span: [scene.soft.fromFrame, scene.soft.toFrame],
        effects: [{ matchName: "ADBE Gaussian Blur 2", set: [[1, scene.soft.blur]] }] },
      ...scene.takes.map((t, i) => ({ name: t.name, comp: `take${i + 1}`, span: [t.fromFrame, t.toFrame], anchor: t.anchor, scale: t.scale,
        position: [[t.fromFrame, t.fromPos], [t.toFrame, t.toPos]] })),
      { name: B.name, solid: B.colour, size: B.size, span: [B.fromFrame, B.toFrame], position: [[B.fromFrame, [B.x, B.fromY]], [B.landFrame, [B.x, B.toY]]] },
    ] };
  return { id: scene.id, version: scene.version, width: scene.width, height: scene.height, fps: scene.fps, frames: scene.frames, bg: scene.bg,
    comps: [plate, ...takes, main] };
}

/** The build as the setup script carries it: base64 of its JSON. */
export const encodeBuild = (build) => Buffer.from(JSON.stringify(build), "utf8").toString("base64");
export const decodeBuild = (text) => JSON.parse(Buffer.from(text, "base64").toString("utf8"));

/**
 * Sit an element in its plate (stage 4 of the professional-finish plan): a
 * landscape plate (precomp layer "plate") of a wall and a dark panel, softened
 * by Gaussian Blur and grained by Noise on an adjustment layer inside the
 * plate comp, and a clean, sharp element (precomp layer "element": a light
 * card with a dark stripe) laid over it. The task is to give the element the
 * plate's grain and softness with effects on the element layer only.
 * `expected` holds what the plate measured in After Effects 27.0 (look, on
 * frames 0 and 1): the grader checks the plate is still that.
 */
export const SEAT = {
  id: "seat-plate",
  version: 1,
  width: 1280,
  height: 720,
  fps: 24,
  frames: 24,
  bg: [0, 0, 0],
  layer: "element",
  plateLayer: "plate",
  plate: {
    wall: [0.45, 0.43, 0.4],
    panel: { colour: [0.12, 0.12, 0.13], box: { x: 120, y: 150, width: 400, height: 450 } },
    /** Gaussian Blur Blurriness, then Noise Amount of Noise (%), on an adjustment layer. */
    blur: 6,
    noise: 6,
  },
  element: {
    card: { colour: [0.78, 0.76, 0.72], box: { x: 760, y: 160, width: 360, height: 400 } },
    stripe: { colour: [0.15, 0.15, 0.16], box: { x: 760, y: 330, width: 360, height: 80 } },
  },
  /** Two consecutive frames: grain is read between them. */
  gradeFrames: [0, 1],
  /** The plate region holds the panel's left edge; the element region the stripe's two edges, inside the card. */
  regions: {
    plate: { x: 40, y: 200, width: 180, height: 350 },
    element: { x: 800, y: 250, width: 280, height: 240 },
  },
  /** Measured in After Effects 27.0 with look on frames 0 and 1 of the built scene (2026-11-12). */
  expected: {
    plate: { temporalGrain: 4.19, spatialGrain: 5.42, edgeWidth: 4.7, lumaMean: 0.2616 },
    element: { temporalGrain: 0, spatialGrain: 0, edgeWidth: 0.8, lumaMean: 0.558 },
  },
};

export const SCENES = { keying: KEYING, grade: GRADE, over: OVER, finish: FINISH, review: REVIEW, seat: SEAT };
