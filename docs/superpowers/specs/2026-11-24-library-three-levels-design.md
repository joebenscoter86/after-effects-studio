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
