# Living screencast

> A screen recording that is not a recording: a redrawn, razor-sharp app window on wallpaper, a recording-software camera that pushes in to the cursor and the caret, and a chunky low-res pixel mascot that lives on the top edges of the UI and acts out what the software is doing.

Adapted for native After Effects from Lemo-Opuscar's *Living Screencast* style (MIT, LemoLab; see `assets/LICENSE-lemo-opuscar.txt`). Grammar only: its references (screen-recording apps with auto-zoom, guided product tours, mascot-led apps, playful launch films) are traditions, not layouts to copy. The mascot in this package is our own (an orange block with an antenna); never reuse another product's character, UI, music or footage.

## 1. What it is, and what it is not

A walkthrough of one piece of software that looks like a screen recording of the real product. Every window, menu, chip and button is redrawn from native shapes and type, so the camera can go anywhere and text stays sharp at any zoom. A mascot made of big square pixels lives in that high-resolution world; the clash of the two resolutions (a hard-edged low-res sprite on anti-aliased UI) is the look.

Two actors, never a hand: the **cursor** is the user, the **mascot** is the software. When the software reads, the mascot runs along the rows; when it counts, it rides the progress bar; when it finishes, it lands on the result.

Not a dark keynote (no black stage, no invented abstract UI), not a pixel-art game (only the mascot and its props are pixels), not a real capture (nothing is a screenshot; a real image may appear as content inside the UI, never as the UI).

## 2. Grammar

- **Real UI, redrawn.** Every label, mode and shortcut matches the product it shows (here: a proof tool whose beat strip lists the scene's real beats, its document is `shared-v1`, its frame count is the clip's real 338). No lorem ipsum.
- **Window on wallpaper.** A light window (`#F8F7F4`, chrome `#F0EEEA`, hairlines `#E0DCD4`, 26 px corners, a soft drop shadow) floats on a warm gradient wallpaper (`#E8C7B1` to `#EEE7DC`) under a translucent menu bar. The camera never shows past the screen.
- **Colour.** The product's own colours rule (ink `#22211F`, muted `#8B8880`, one accent `#2F6FEB`). The mascot keeps one saturated hue no UI element uses: orange `#FF7A2F`, shade `#E5611B`, antenna tip `#FFD3AE`, eyes `#241F1C`.
- **Type.** UI in Inter Tight Medium and Bold; editorial headings in Newsreader Medium; numbers, file meta and keys in IBM Plex Mono. A title, if any, is diegetic: an empty-state heading, a dialog title.
- **The pixel grid is sacred.** The mascot is a 10 by 9 sprite of 12 px pixels with crisp edges; it scales with the camera; its position is stepped to the half pixel (6 px), so its motion reads as stepped while the UI moves on ones.
- **Gravity is the top edge of the UI.** The mascot only stands on the top edge of a real element: the window, a heading's letters, a tile, the card, the progress bar, the composer, a dialog title. Never on nothing, never covering text to be read.
- **Overlays are information only.** A chapter pill (01 to 04), a frosted caption pill at the bottom, a key HUD while typing, a time-lapse tag while the app works. Nothing else sits on the screen.

## 3. Camera grammar

A recording-software camera: one continuous take inside the screen, zoom never below 1, clamped so the frame never leaves the screen.

| Move | Expresses | In AE |
|---|---|---|
| Slow drift at rest | the app is alive while we listen | a linear key pair on the world null, a few percent of scale |
| Push in to the cursor or caret | this is where it happens | ease the world null to scale 1.25 to 1.75 centred on the click or the caret |
| Follow the mascot along a floor | the software working | key the centre with the mascot's floor |
| Whip between panes, with blur | cause here, effect there | a fast travel key pair plus a Directional Blur adjustment layer keyed 0, 70, 0 only during the whip |
| Rack focus | attention moves, nothing else does | Gaussian Blur on the pane not being read (a picture, never text) |
| Pull back to the full window | the whole in view | ease back to scale 1 |
| Push in plus vignette | the one promise to remember | a slow push on the result and a feathered inverted-mask vignette |

## 4. Native moves (pick what the story needs)

Diegetic title (the heading types on as it is spoken and the mascot lands on its letters) · karaoke ball (the mascot hops word to word along the field as each is spoken) · moving floor (the mascot rides a progress bar or a card) · time-lapse with a tag · spotlight freeze · cursor clicks with a push and a ripple · the cursor hides while typing (the real behaviour) · one thing becomes the next (a card morphs into a dialog's thumbnail while the dialog grows from its bounds) · the mascot goes to sleep on the finished item.

## 5. Sound palette

Two resolutions in the music: a hi-fi band (piano, upright bass, brushed kit, glockenspiel) is the world; a chiptune square or pulse voice is the mascot, its notes on the words it lands on. Foley: keyboard thock and click with human timing, trackpad clicks, pane swishes, popup pops, a chime on "Counted"; the mascot's steps, jumps and landings are 8-bit. A short drop to room tone before the promise. Voice calm, one feature per line; music ducked under it; master about -14 LUFS. Render audio outside AE and place it as a layer.

## 6. AE recipe (`screencast.jsx`, AESScreencast)

1. **World.** One null (`_WORLD`, anchor and position at 0) that every screen layer is parented to: the wallpaper (a solid 200 px larger than the frame on every side, with Gradient Ramp), the menu bar, the window and all UI. Parent while the null has no keys; key the camera last. Overlays are not parented.
2. **UI.** `shp()` builds one shape layer from a list of rects, ellipses and paths in world px, its anchor and position at the same point (so its own space is world space and scaling pivots there). `txt()` sets type on a baseline anchored on the ink rect (left, centre or right) from the full string, so a layer typed on later grows from one edge; `realign()` re-anchors every text layer from a fresh rect at the time its full string shows.
3. **Keys.** `keys(prop, [{ t, v, e }])` sorts, keeps one key per 1/60 s, sets them in one call and eases each key (`lin`, `hold`, `settle`, `travel`, `peak`, `snap`). Spatial properties get zero tangents, so a held position never loops. Source Text always goes through `AESLib.textKeys` / `AESLib.bakeText`, one call per layer.
4. **Mascot.** A `Mascot` collects hops, rides, looks, blinks and cheers in any order and keys them once. A null with separated X and Y position (a hop is linear in X and ballistic in Y, with a `peak` key), each dimension stepped by `Math.round(value / 6) * 6`. Body: one shape layer of pixel runs. Eyes (neutral, left, right, down, up, happy, shut) and legs (stand, walkA, walkB, none in the air) are one shape layer per pose, shown with held opacity keys. Scale (anchor at the feet): crouch, stretch on take-off, round in the air, squash and a damped bounce on landing, plus an idle breath expression. Four grey pixels of dust kick out on each landing.
5. **Cursor.** A `Cursor` collects moves (travel eased, straight), clicks (scale 100, 80, 100 plus an accent ripple) and hides (while typing), keyed once. A black arrow with a white outline and a small drop shadow, parented to the world so it zooms with the recording.
6. **Typing.** The spoken line is typed on per frame with `AESLib.bakeText`, each word's letters spread over its spoken duration. The caret's position is an expression on the typed layer's `sourceRectAtTime`; it blinks once typing stops. The key HUD bakes the last 15 characters, then `return`.
7. **Camera.** `camAt(W, H, s, cx, cy)` turns a scale and a point of interest into the world null's position, clamped so the screen always covers the frame. Scale and position are keyed in one call each. Directional Blur on an adjustment layer only during the whip; a feathered inverted mask on a black solid for the spotlight.
8. **Overlays.** Frosted glass is a Fast Box Blur adjustment layer with an alpha track matte (the pill shape, a disabled copy) under a white pill at about 65% with a white hairline. Captions are one centred text layer per beat inside a pill whose Rect Size is hold-keyed to the line's width.

**Gotchas found while proving it**

- Back-to-back karaoke hops looked like hovering in mid-beat stills: with one landing per spoken word (some 0.07 s apart) the mascot is airborne most of the time. Merge words closer than 0.12 s into one landing, start each hop at 40% of the gap after the last landing, and keep the hop low (24 px). The landing frames sit exactly on the edge; the reference's own karaoke hops are just as continuous.
- The progress row under the card sat in the mascot's lane on the way to the composer (its body covered "Counted"). The row clears (0.2 s fade) once the count is done, before the mascot crosses it: a text-free lane has to be planned, not hoped for.
- A text layer typed on later shows its first key before that key, so `realign()` must read the rect at the time the full string shows (`full` in `txt()`), not at 0; otherwise centred headings and right-aligned counters anchor on a blank or partial string.
- A white frosted caption pill vanished over the white composer when the camera pushed down. A soft Drop Shadow (Distance 6, Softness 24, about 16%) separates it from any UI under it.
- Directional Blur at 70 px on a 0.3 s whip smeared the frame to noise; 45 px reads as a whip and is still legible a frame later.
- Mixed linear and eased keys in a hop: separated X and Y position, linear keys at take-off and landing and a `peak` key (speed 0, 50% influence) at the top, give a ballistic arc without any spatial bezier loops. Spatial properties keyed with `keys()` get zero tangents for the same reason.
- Non-ASCII characters in the module (the multiplication sign, the middle dot) are written as `\u00D7` and `\u00B7` escapes, so the source survives whatever encoding the bridge reads it with.

**Close, not identical:** the reference builds its UI from the live DOM and measures every element each frame; here the coordinates are known because the UI is drawn from the same numbers. The scene's beats are shorter than the style's caption hold (max(1.8 s, speech + 0.6 s)). The proof has no sound. The mascot is a fixed 10 by 9 sprite with seven eye poses and three leg poses; it has no arms, so a cheer is a hop with happy eyes.

## 7. Dependencies

Inter Tight (Medium and Bold), Newsreader Medium and IBM Plex Mono Regular installed (OFL, bundled in `assets/fonts/`; `AESScreencast.fontOK()` checks). Effects: Gradient Ramp, Drop Shadow, Gaussian Blur, Fast Box Blur, Directional Blur. Node 20+ and ffmpeg for `tools/frame.mjs` (sizes the real frame for the viewer pane).

## 8. Pitfalls of the medium

Invented features or renamed modes: check every label against the product. The mascot floats or drifts off its element: stand it only on known top edges, key it from the same numbers that draw the UI. The mascot covers text or sits under a caption: give it a text-free lane (the top edge of the composer, not the line inside it). Blur on text the viewer must read, or zooming out past the screen: rack focus only on pictures and panes not being read; clamp the camera. A hand on screen: the cursor is the user. Motion blur on the transformed sprite smears the pixels: blur only on whips, on an adjustment layer. A click or pop landing on a product name masks it: shift foley off word onsets.

## Reference

The proof is the shared test scene, built by `buildScene` and proven with `node production/styles/harness/prove.mjs living-screencast`, which rebuilds it from a blank project and renders it with aerender. `proof/compare.jpg` sets it beside Lemo-Opuscar's living-screencast poster.

Build time: about 5.6 s for 117 layers, render about 24 s; every text key goes in through one batched call per layer (`AESLib.textKeys` / `AESLib.bakeText`).
