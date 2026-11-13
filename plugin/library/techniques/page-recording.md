# Recording a web page as a smooth clip

A page shown inside a piece (a site, a product page, a generated draft) reads as footage only when its scroll and its own animations move at an even 30 frames a second. A screen recorder cannot promise that: it samples real time, so a slow paint drops or doubles a frame and the scroll stutters. This technique takes the page's clock away from real time and steps it, so every frame is the page at exactly that moment.

## When to use it

- A page, or a part of one, has to appear in the piece scrolling, animating or both.
- The page can be opened in a local browser: a local file, a local server, or a site the user owns or may show. Serve local copies from a local server (`python3 -m http.server 8000` in the page's folder) so fonts and scripts load as they do online.

Not for: a page that plays `<video>` (video keeps real time; record it separately and composite), a page behind a sign-in the agent may not enter, or a page the user has no right to show.

## Method

1. **Step the clock before the page loads.** An init script replaces `performance.now`, `Date`, `requestAnimationFrame`, `setTimeout` and `setInterval` before any of the page's own scripts run. Time advances only when the recorder ticks it, in steps of 1/60 s. Every Web Animation (CSS animations and transitions included) is paused and its `currentTime` set from the virtual clock on each tick.
2. **Set the scroll per step.** Scroll keyframes `[[t, y], ...]` (seconds, CSS pixels) are joined by a monotone cubic curve (Fritsch-Carlson), still at both ends, so the page eases in and out and never scrolls back between keys. `endVel: true` keeps it moving at the last key, for a clip that is cut while still travelling. The scroll is rounded to whole device pixels so text does not shimmer.
3. **Screenshot every second step.** Two ticks of 1/60 s, then one PNG: 30 fps. Before each screenshot the recorder waits one real browser frame so the page has painted.
4. **Pipe the frames to ffmpeg** as PNG over standard input: H.264, `-crf 12`, `-preset slow`, yuv420p, BT.709 tags, `+faststart`.
5. **Warm up first.** `warm` seconds of virtual time run at the start scroll before frame 0, so an entrance animation is either finished or caught at the moment wanted.
6. **Find the scroll keys from the page.** The recorder prints one JSON line before recording: each `section`/`footer` with its top offset and height, the page height, the GPU renderer and the fonts loaded. Use `--probe <dir>` (or `probe: {dir, times}`) to write stills at chosen times without encoding, to check framing before a full run.

Scrollbars, the cursor and the text caret are hidden; `scroll-behavior` is forced to `auto` so a scroll lands where it is set.

## The values that worked

Six clips for the first full piece were recorded with these settings.

| Use | Viewport | dsf | Length | Warm | Keys (t s, y px) |
|---|---|---|---|---|---|
| Desktop page, long scroll | 1600 × 1000 | 1 | 15 s | 1 s | 0,0 · 1.1,1500 · 1.6,2150 · 2.3,2650 · 3.3,4400 · 15,6300, `endVel` |
| Desktop page, hold then drift | 1600 × 1000 | 1 | 15 s | 0–3 s | 0,0 · 3.4,0 · 15,1650, `endVel` |
| Phone page, small move | 430 × 602, `mobile` | 2 | 5 s | 0.3–2 s | 0,0 · 1,0 · 5,140 (or a 400–560 px move within one section) |

On an Apple-silicon laptop a 15 s clip at 1600 × 1000 took 85 to 105 s to record, and a 5 s phone clip 31 to 47 s. A phone viewport at device scale 2 gives an 860 × 1204 frame, sized for a card in a 1080 × 1920 piece. Fast early keys then a long slow tail read as "arrive, then read"; a still first second lets the viewer settle before the move.

## Scripts and dependencies

- `scripts/capture/record-page.mjs` (library document `page-recorder-mjs`): `node record-page.mjs <config.json> [--out clip.mp4] [--probe dir]`. The config fields are listed at the top of the file. Examples: `scripts/capture/record-page.example.json` (desktop, `page-recorder-config`) and `record-page.mobile.example.json` (phone, `page-recorder-config-mobile`).
- `scripts/capture/check-clip.py` (library document `check-clip-py`): `python3 check-clip.py <clip.mp4> <sheet.png> [--strict] [--expect-frames N]`.

Needs Node 18 or later with `playwright-core` (`npm i playwright-core` in a scratch folder next to a copy of the script) and a Chromium build: `npx playwright install chromium`, or point `CHROME_PATH` (or the config's `chrome`) at a full Chrome or Chrome for Testing binary when the bundled headless shell is missing or has no GPU. On macOS the recorder asks for Metal (`--use-angle=metal`). The check needs Python 3.9+, numpy and Pillow. Both need ffmpeg and ffprobe on PATH. Keep `node_modules` out of the user's project and out of this plugin.

## Checks

1. The recorder's JSON line: the GPU renderer is a real one when the page uses WebGL, and the faces the visible text uses are loaded (a count below the declared total is normal: unused faces never load). Read `PAGE MESSAGES` at the end: a script error can leave part of the page blank, while a 404 for a favicon is harmless.
2. `check-clip.py` on every clip. It prints the frame count (must equal `dur × 30`; pass `--expect-frames`), the mean absolute difference between consecutive frames and its median per half second, every identical pair (a freeze) and every pair more than 4× the median of the 14 around it and above 0.3 grey levels (a jump). Identical pairs are expected only where the page is meant to hold still; a freeze or a jump inside a move is a fault: look at the frames around it, then re-record.
3. Look at the 12-frame contact sheet: the right sections at the right times, nothing half-loaded, no cookie banner, no cursor.
4. Watch the clip once at full speed before placing it.

## Limits

- `<video>`, audio and anything driven by a worker's own timers keep real time.
- A page that reads time from the network (server clocks, live data) can still change between runs.
- A scroll-linked effect that reads `IntersectionObserver` or scroll events fires on the real paint after each scroll, which the recorder waits for; one that throttles with its own real-time debounce may lag by a frame.
