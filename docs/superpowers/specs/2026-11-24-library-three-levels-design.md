# Comp Room library: directions, worlds, recipes

Design, 2026-11-24. Written in a Content session with Joe; the build belongs in the Comp Room repo (`~/after-effects-studio`, GitHub `joebenscoter86/after-effects-studio`, plugin 0.4.3 on `main`).

## Why

Joe's bar for a reel is "I paid a motion designer $1,000". The builds execute well; the briefs come out the same. Three recent JoeB briefs used 8 of the arsenal's 101 recipes, the most-used one a glow, and one brief used none.

A test on 2026-11-24 re-briefed a posted reel (done-by-lunch) from the same script and tools, changing only the order of work: look at the whole library as pictures, pick a reel-level direction, then write the idea. Joe on the resulting After Effects comp: "night and day better than what I'm getting out right now."

The same test showed what the library lacks. The comp wanted glass keys on a dark floor. Comp Room already ships `style-glass-product`, and the agent never reached for it, for three reasons that will catch any agent:

1. **Two doors.** Recipes are found through `ae_arsenal`; styles are documents in `ae_library`. An agent that goes through one never sees the other.
2. **No picture.** The agent used what it could see (it tiled the recipe stills into a sheet). Styles were a list of titles.
3. **Filed by what it is, not what it gives.** The style is called "Glass product", a launch-film look. The agent wanted "a material for objects on a dark floor". Nothing connected the two.

Evidence, all under `/Users/joeb/Projects/Content/.claude/worktrees/projects-ui-animation-a440f8/docs/experiments/2026-11-24-rebrief-test/`: `rebrief.md`, `directions.md` (two hand-written direction records), `board-old-vs-new.png`, `keys-one-take.mp4`, `ae/keys-one-take.aep`.

## Goals

- An agent writing a brief can see everything the library can do, as pictures, before it has an idea.
- The library holds three levels, and a brief picks top-down: direction, then world, then recipes.
- One catalog and one tool for all three.
- A user's own entries sit beside the shipped ones in the same shape.

## Non-goals

- New recipes, worlds or directions beyond what is needed to prove the shape. Content comes after.
- Changing how After Effects is driven (`ae_do`, `ae_render_frame`).
- Changing Joe's Content repo. That is a separate piece of work once this ships.

## Anti-goals

- A longer rulebook. The fix is visibility and structure, not more instructions.
- Anything that makes one look the default. No entry is ranked first by preference.
- Entries without a picture.

## The three levels

| Level | What it is | Answers | Comes from |
|---|---|---|---|
| **Direction** | How a whole piece holds together: its material family, light, camera behaviour, three to five signature moves, transition family, rhythm, type treatment, and what breaks it | "What kind of film is this?" | Teardowns of finished professional work |
| **World** | A set a section lives in: floor, light rig, environment, lens, materials, ready to drop content into | "Where does this happen and what is it made of?" | Built and proven here; shipped as code or a project, not prose |
| **Recipe** | One technique for one beat | "How do I do this move?" | Tutorials, as today |

A world is delivered as something that runs: a JSX builder (as the styles' `*-jsx` modules are today) or a template project, returning named slots (floor, key light, camera, a place for a screen). The 2026-11-24 test rebuilt a floor and lights from prose in ten minutes and left the environment light on its default, so nothing reflected. That is the failure a world entry prevents.

## One entry shape

Every entry, at every level, carries the same core fields. Existing arsenal fields stay; these are added or made universal:

- `id`, `revision`, `level` (`direction` | `world` | `recipe`), `name`, `line` (one sentence on what it does for the piece)
- `still` (required) and optionally `clip`. No picture, no entry: the catalog build refuses it.
- `provides`: a list from a small fixed vocabulary, the thing agents search by. First draft: `material`, `floor`, `light`, `environment`, `camera`, `depth`, `type`, `transition`, `backdrop`, `finish`, `motion`. Each may carry a word, for example `material: glass`, `floor: gloss-dark`.
- `needs`: as today (footage, screen, logo...), plus `blender` and `plates` where true.
- `cost`: `renderer` (classic, advanced-3d, blender) and a measured seconds per frame where known.
- `status`: proven or unproven, as today.
- `composes`: ids this entry has been proven with. A world lists recipes proven inside it. A direction lists the worlds and recipes it draws on.
- `mood`, `job`, `support`: as today. `job` stays required for recipes only.
- `shelf`: `shipped` or `user` (see below).

## The tool

Keep the name `ae_arsenal` so existing briefs and docs keep working. Changes:

- **`browse`** (new): returns a level as labelled contact sheets, a page at a time, with id, name and `provides` under each tile. Optional filters: `level`, `provides`, `shelf`. This is the action a brief starts with.
- **`find`**: accepts `level` and `provides` as well as `job`. A `job` query still returns recipes as today. A `provides` query crosses levels, so "material: glass" returns the glass world and any glass recipe together.
- **`get`**: works for any level. For a world it returns the builder and its slots.
- **`jobs`**: unchanged, and also returns the `provides` vocabulary.

The server instructions and the `motion-studio` skill change their opening step from "ask per beat by job" to: browse directions and worlds first; choose a direction; choose a world; then ask per beat.

## Moving what exists

- **30 visual styles** (`plugin/library/styles/`, today reached only through `ae_library` `style-index`): each becomes a `world` entry, a `direction` entry, or both, with its proof still. `style-glass-product` is the first one to move, because it is the known miss. Their documents stay readable through `ae_library`; the catalog entry points at them.
- **101 recipes**: gain `level: recipe`, `provides`, and `cost` where measured. Twenty-five have no still; they get one or drop to a clearly marked unproven state that `browse` hides by default.
- **Reference teardowns**: the `reference-teardown` document already describes measuring a finished video. Its output gains a direction record as a product, in the shape of the two prototypes in `directions.md`.

## A second shelf for the user

The server reads an optional second library folder in the same shape (a path in plugin settings or an environment variable). Its entries appear in `browse`, `find` and `get` marked `shelf: user`. This is where Joe's own worlds and directions live, in his Content repo, without being baked into the plugin. Anyone else with the plugin gets the same mechanism.

The JoeB-specific pieces now inside the plugin (`joeb-preset`, `house-jsx`, `joeb-motion-jsx`) are candidates to move to that shelf later. Not in this build.

## Not in this design, noted for later

- **A usage log and a spread rule** (which direction and world each reel used; a brief's candidates must come from different directions, at least one unused recently). This keeps a stated preference from becoming every brief. It belongs in the Content workflow, with the log possibly kept by the plugin.
- **A gap list**: every time a brief wants something and the library has nothing, it is recorded. The teardown skill works down that list. Today's entries: a dark-floor world with a real environment; glass on a dark ground; a glow that lights one object and not the frame; Apple-style Liquid Glass as a 2D effect.
- **Folding the Content repo's `DEVICES.md`** (54 picture mechanisms) into the recipe shelf.

## Approaches considered

1. **Reorder the brief docs only** (browse first, no library change). Cheapest, and the test shows order matters most. But the styles stay behind a second door with no pictures, so the same miss recurs.
2. **Three separate tools** (directions, worlds, recipes). Clear, but it recreates the two-doors problem as three.
3. **One catalog, one tool, three levels** (this design). More work once, and every entry is reachable the same way by picture or by need. Chosen.

## Build order

1. **Schema and catalog build**: add `level`, `provides`, `cost`, `composes`, `shelf`; make `still` required; migrate the 101 recipes.
2. **`browse`, and `find`/`get` across levels.**
3. **Move the styles in**, glass product first, as world and direction entries with stills.
4. **The first world as runnable code**: a dark gloss floor, one warm key, an environment the surfaces can reflect, a lens with depth of field, and slots for a screen slab and small objects. Proven by rebuilding one frame of `keys-one-take.aep` and comparing.
5. **The second shelf.**
6. **Skill and server-instruction wording.**

Steps 1 to 3 are the first deliverable and are useful alone.

## Left to the builder

- Whether `provides` values are free words or a fixed list per key. Start fixed and small.
- Contact sheet size and paging for `browse`.
- Whether a style becomes one entry with two levels or two entries. Whichever keeps `browse` readable.
- How world builders are packaged, following how the style `*-jsx` modules ship today.

## How to tell it worked

A fresh agent, given only "a reel wants glass keys on a dark floor with a real screen on a slab", reaches `style-glass-product` (or its world entry) within its first two library calls. Today it does not.

## Where the build differs from this design (added 2026-11-24, build steps 1 to 3)

Checked against the code at commit 741342b. Where the design and the code disagreed, the build follows the code.

- **The catalog build** is `tools/channel-learner/arsenal.mjs` (a development tool, not shipped), fed by the recipe drafts in `product/arsenal-drafts/`. The new fields live in one new drafts file, `product/arsenal-drafts/levels.json` (the `provides` vocabulary, each recipe's `provides` and renderer, each style's entry). `tags.json` and the drafts are untouched, so every recipe revision is unchanged and pinned `<id>@<revision>` ids resolve with no warning.
- **The 25 recipes with no still** are 10 build aids (no picture by design: they serve no beat), 14 unproven techniques and one unmatched recipe. None was given a still; each carries `no_still` with its reason, and `browse` hides them unless asked (`include_unpictured`) and says how many it hid. The build refuses an entry with neither a still nor a reason.
- **31 styles, not 30**: `pixel-headline` is the plugin's own style and has no proof movie, so it is listed with `no_still`. Styles were also reachable through the `visual-styles` skill's table, not only `ae_library` `style-index`.
- **Style stills** are one frame of each style's proof movie in Content (`production/styles/<id>/proof/proof.mp4`) at the "picture" beat, 480 wide like the recipe stills, made once by `arsenal.mjs --style-proofs <dir>` and kept. The "input" beat shows the proof's own speaker, so `levels.json` marks it private and the build refuses it.
- **One entry per style**, id `style-<id>` (its `ae_library` document id). `level` is a single value; a style that serves two levels lists the other in `also_level`, and a level query matches either. The four 3D styles (backrooms, glass-product, lowpoly-island, tilt-shift) are worlds that are also directions; the rest are directions.
- **Contact sheets**: the runtime has no dependencies beyond the MCP SDK and zod, no JPEG decoder, and its sheet font draws digits only. `browse` therefore returns a legend and each tile as its own labelled still, not one composed image.
- **`find`** with `job` is unchanged (162 asks across every job compared field for field with the old catalog; only the catalog version string differs). A `find` with `job` and `level`/`provides` together is refused rather than guessed at.
- **`get` for a world** returns its catalog facts and its `STYLE.md` (the same reply `ae_library` gives). Builders and slots arrive with step 4.
- **`cost`**: recipes carry the renderer only (none has a measured time); styles carry seconds per frame measured from their proof card (After Effects render of the 10.8 s, 324-frame proof; Blender plates not counted). `needs: blender` comes from the style index; no recipe needs Blender, and no entry was marked `plates`.
- **`composes`** is empty everywhere for now: nothing records which recipes were proven inside which style.
- **The catalog's list** is renamed from `recipes` to `entries`, and gains `levels` and `provides` (the vocabulary). The catalog version moves because it now covers every entry.

## Pieces, and the "direction" level renamed (added 2026-11-24, pieces build stage 1)

Plan: `docs/experiments/2026-11-24-rebrief-test/comp-room-pieces-plan.md` in Content.

- **"direction" is renamed "style".** The level as designed above ("how a whole piece holds together": material family, light, camera, signature moves, rhythm) is not what the entries at that level are. All 27 of them are the visual styles, which are looks a section can borrow: colour, type, light, material. Nothing in the catalog holds the whole-film record the design describes, and the two hand-written direction records in Content are not shipped. Calling the styles "directions" told an agent they decide the whole film, which they do not. The levels are now `style`, `world`, `recipe`. A whole-film direction can come back later as its own level once there are real records for it; renaming keeps every style entry where it was and only corrects the label.
- **Pieces** are runnable recipes: `plugin/library/pieces/<name>.jsx`, one object or one move per file, with a header the build reads (what it does, when to use it, jobs, provides, needs, works with, the call, options, returns, an example). Each has a proof scene in `pieces/proof/<name>.jsx` whose render becomes its still. They are catalog entries with `level: recipe`, `kind: piece`, `use_for`, `requires` (pieces they load themselves) and `call`. Shared helpers live in one file, `pieces/pcs-core.jsx`.
- A piece holds no look: colours, type, light and material come from a style object passed to `PCS.use`. The two in `pcs-core.jsx` are labelled examples.
- **`find`** by job ranks pieces ahead of written recipes on the same job. **`find` with `query`** takes plain words ("something that turns over"), keeps the entries carrying the most of its words, and lists pieces first. **`get`** for a piece returns its call (load line with this install's path, signature, options, returns, example, works with, notes), not prose.

## Styles as data (added 2026-11-24, pieces build stage 2)

- A style block is one file, `plugin/library/pieces/styles/<id>.json`: an id, a title, a role, a one-line description, where its values came from, what it provides, and `values` (ground, backplate, surface, ink, type, accent, onAccent, quiet, key and fill colour and intensity, environment intensity, grain, font, weight, depth, bevel, tilt, material). `pcs-core.jsx` reads every block when it loads; `PCS.use('<id>')` picks one, and keys a style object leaves out come from the house block.
- **Roles.** `house` is the default and there is exactly one: the graphite house look picked on 2026-11-24. `example` blocks (warm paper, night glass) prove the pieces carry no look of their own and are labelled as examples. `look` blocks write an existing visual style for pieces; so far `dark-keynote` and `glass-product`, the two whose looks are lit objects on a dark stage. Flat print looks (risograph, woodcut, whiteboard and the like) get no block: a thick lit slab contradicts them. A look block copies the style's own colours and fonts from its code and document and lists every value it had to choose (`chosen`).
- **Catalog.** House and example blocks are style entries of their own (`style-house`, `style-example-*`, with `role`, `block`, and `default` on house), listed first among the styles, each with a still of one shared proof scene (`pieces/proof/styles.jsx`) rendered under it. A look block adds `block` to its style's existing entry. `get` on any style with a block says how to use it in pieces and shows the values.
- **Open in the house style:** the quiet grid ground and the house face card with its cream rim are not in it yet (`open` on the entry).
- After Effects keeps script globals between runs, so `pcs-core.jsx` now resets its loaded pieces and styles each time it is loaded, and the proof scenes remove an earlier comp together with the solids only it used (`PCS.removeComp`).

## All the pieces, the room and the hand-over (added 2026-11-24, pieces build stage 3)

- **Nineteen pieces**, one file each. Objects: `stage`, `plate`, `two-sided`, `type3d`, `label`, `words`, `tick`, `rows`, `picture-face`, `room`. Placing: `on-face` (front and back). Light: `spot`. Moves, which all chain on one object: `flip`, `stand-up`, `tip-away`, `land-on`, `swap-face`, `hide` (show at, gone at), and `hand-over`. Every one is look-free (its colours come from the style) and has a proof scene.
- **Catalog pictures must show what the piece does.** The test: cover the name and say what the piece is for. A piece that makes something is one frame. A move is several frames of its proof render: the same band of each frame stacked (`band`), or whole frames side by side (`across`) when the whole picture changes, made by `tools/pieces/still.mjs`. The proof scene returns `frame`, or `frames` with `band` or `across`.
- **The environment light map is ours.** `tools/pieces/studio-strips.mjs` writes the soft strip lights as data into `pieces/assets/studio-strips.hdr` (512 x 256, 45 KB, run-length RGBE). Rendered against the original 2048 x 1024 map the stage measured 51 dB PSNR (39 dB with no map), so it lights the same.
- **A pool on the hero.** `spot` with `on` lights one object: from in front, up and to the left for a face card stage (from high above it only grazed the face and lit the wall; from straight in front, on the camera's line, a glossy graphite face threw its highlight back as a milky disc that washed out what was on it), from above with `from: 'above'` in a room so the pool also falls on the floor. Its strength follows how light the object's face is (1.5 x the style's key on graphite, down to 0.75 x on cream), so the object reads as lit and what is on its face stays readable, on graphite and on cream; `t` and `dimKey` let it rise while the key dips. The house values are unchanged.
- **Room.** `room` makes the full-frame cutaway: floor, back wall, key with shadows, front fill, a wash on the wall, a two-node camera that pushes in with depth of field. Wall and floor colours come from the style's `wall` and `floor` when it has them, else from its backplate, quiet and surface colours.
- **Hand-over.** `hand-over` turns a stage comp into a room in the same comp with the same camera: the face card slides away, the backplate falls back, the stage's lights give way to the room's, finished things tip away, and the carried object flies into the room and lands. Nothing cuts.
- **Finding a piece by its functions.** The catalog records the functions each piece file defines (`call.functions`); a piece's load line loads every piece whose function its example calls (`PCS.standUp` is in `stand-up.jsx`).
- **Fixed in the core on the way.** A lone hold keyframe holds its value for all time in After Effects, so hiding after a time hid an object from the start; cuts now go through `PCS.cutAt`. `PCS.num` read a plate's height from the end of `depth=` in its comment. Temporary nulls left their solids in the project, and the light map was imported again when another file of the same name was in the project.
- **Acceptance.** The test beat ("Is it right?" turning to "Ask for proof", a tile turning to its tick, "Yes" tipping away, a card of ticked rows standing up, the tile landing on it as a seal, a pool rising on the card) was rebuilt from `ae_arsenal` find and get answers alone. The rebuild found two plain-words searches that missed (a pill that stands up, words that appear one by one); the two headers now carry those words.

## The pieces check (added 2026-11-24, pieces build stage 4)

- **One command.** `node tools/pieces/check.mjs` builds every piece's proof scene in house, renders the frames the proof names, makes the still the way the catalog did (one frame, a band of frames stacked, or frames across), cuts it to the catalog's 480 px width and compares it with the shipped still. `--only`, `--style`, `--out`, `--keep` and `--accept` (take the new stills as the saved ones, then run the catalog generator). It is a step before a release in quality/release-criteria.md, and not in the offline tests: it needs After Effects open. When After Effects is not open it says so and exits with code 3 without starting it. A full run takes about 40 seconds and leaves the project as it found it.
- **The comparison.** A pixel has changed when a colour channel moved by more than 16 of 255; a piece fails when more than 0.1% of its pixels changed, about a 20 x 20 patch of the still. Measured on 2026-11-24: two renders of all 19 proofs never moved a pixel past 16 (worst single pixels 17 to 20); a real change of shading only (the plate and flip stills cut before the light map changed) moved 0.6% and 1.1% of pixels past 16; text 15% too big failed 14 pieces at 0.32% to 13.5%. The plate and flip stills were re-cut on the check's first run.
