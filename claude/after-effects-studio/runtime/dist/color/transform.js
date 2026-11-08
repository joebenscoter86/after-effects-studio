const AP1_TO_REC709 = [
  [1.70505099, -0.62179212, -0.08325887],
  [-0.13025642, 1.1408047, -0.01054832],
  [-0.02400336, -0.12896898, 1.15297233]
];
const AP0_TO_REC709 = [
  [2.52140088, -1.13399574, -0.38756249],
  [-0.27621892, 1.37259556, -0.09628267],
  [-0.01538264, -0.15292998, 1.16835777]
];
const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];
const HILL_IN = [
  [0.59719, 0.35458, 0.04823],
  [0.076, 0.90834, 0.01566],
  [0.0284, 0.13383, 0.83777]
];
const HILL_OUT = [
  [1.60475, -0.53108, -0.07367],
  [-0.10208, 1.10813, -605e-5],
  [-327e-5, -0.07276, 1.07602]
];
function srgbEncode(x) {
  const v = Math.min(1, Math.max(0, x));
  return v <= 31308e-7 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}
function apply(m, r, g, b) {
  return [
    m[0][0] * r + m[0][1] * g + m[0][2] * b,
    m[1][0] * r + m[1][1] * g + m[1][2] * b,
    m[2][0] * r + m[2][1] * g + m[2][2] * b
  ];
}
function rrtOdtFit(v) {
  return (v * (v + 0.0245786) - 90537e-9) / (v * (0.983729 * v + 0.432951) + 0.238081);
}
function sceneLinearToDisplaySrgb(rgb, toRec709) {
  for (let i = 0; i < rgb.length; i += 3) {
    let [r, g, b] = apply(toRec709, rgb[i], rgb[i + 1], rgb[i + 2]);
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);
    [r, g, b] = apply(HILL_IN, r, g, b);
    r = rrtOdtFit(r);
    g = rrtOdtFit(g);
    b = rrtOdtFit(b);
    [r, g, b] = apply(HILL_OUT, r, g, b);
    rgb[i] = srgbEncode(r);
    rgb[i + 1] = srgbEncode(g);
    rgb[i + 2] = srgbEncode(b);
  }
}
function profileForWorkingSpace(workingSpace) {
  const ws = workingSpace.toLowerCase();
  if (ws.includes("acescg")) {
    return {
      toRec709: AP1_TO_REC709,
      note: "ACEScg \u2192 sRGB via ACES output transform (RRT+ODT fit)"
    };
  }
  if (ws.includes("aces2065") || ws.includes("aces 2065")) {
    return {
      toRec709: AP0_TO_REC709,
      note: "ACES2065-1 \u2192 sRGB via ACES output transform (RRT+ODT fit)"
    };
  }
  if (ws.includes("scene-referred rec.709") || ws.includes("linear rec.709")) {
    return {
      toRec709: IDENTITY,
      note: "linear Rec.709 \u2192 sRGB via ACES output transform (RRT+ODT fit)"
    };
  }
  return null;
}
export {
  AP0_TO_REC709,
  AP1_TO_REC709,
  profileForWorkingSpace,
  sceneLinearToDisplaySrgb,
  srgbEncode
};
