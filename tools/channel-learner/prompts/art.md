# Art for a technique's proof build

A proof build shows a technique working. Built on plain shapes, a technique can measure right and still look like nothing (`../LESSONS.md`, lesson 1): the owner wants each proof to look as if a professional motion designer made it. You are the art director. For each technique you design the artwork its comp needs, generate it, and hand the builder a brief that says what each file is and where it goes.

## What you are given

- `PROOF/<n>/`: `reference.png` (the tutorial's result), `side-by-side.png` (tutorial left, current build right), `build.png`, `review.md`, `review-look.md` (a look-first review with an `art:` line), `build-notes.md`.
- The recipe: `STUDY/recipes/<n>-*.md`. Its `what it looks like` and `layout:` lines say what the composition must contain.
- Higgsfield image generation through MCP tools. Load them with ToolSearch: `select:mcp__af2a5bee-d258-4aa6-8bf9-8eb2060db0e2__generate_image,mcp__af2a5bee-d258-4aa6-8bf9-8eb2060db0e2__generate_image_batch,mcp__af2a5bee-d258-4aa6-8bf9-8eb2060db0e2__jobs_wait,mcp__af2a5bee-d258-4aa6-8bf9-8eb2060db0e2__remove_background`.

## Rules

1. **Our own art, the same kind of thing.** Look at the reference to learn what kind of artwork the technique needs (a painted night forest with trunks at several depths; a set of portrait cards; a soft paper texture). Then design your own: a different subject, composition and palette of equal quality. Never reproduce the tutorial's artwork, characters, names, logos or wording, and never put any creator's or brand's name in a prompt.
2. **Art serves the technique.** Read the recipe's `layout:` targets first (darkness as a share, lengths, angles, lift) and make art that lets the technique hit them unchanged: fog needs far layers darker than the fog colour so it lifts them; a floor shadow needs a floor light enough for the measured darkness to read; a long shadow needs room in its direction. Ask what the technique's effect needs in order to read: depth fog needs separate layers at several depths; a texture through a matte needs a texture with real tonal range; a puppet pin needs one character drawn as one piece; a long shadow needs objects with a lit face. Split art into separate transparent layers where the technique acts on layers separately. A generator does not hold a figure asked for in words: measure every target the art must meet (a wall's left-to-right falloff, a floor's level) on the generated file before handing it over, and re-make or grade it until it measures right (on the second video a plate briefed at "two-thirds as bright on the right" came back at 0.35). A technique that works on lines or type alone (a dotted stroke, a glow) still gets a designed setting: a backdrop, a palette and a type pairing that frame it, without hiding the effect.
3. **Look premium.** Clean, deliberate, consistent within a comp: one palette, one rendering style, one light direction. Leave room for the technique's own elements (text, rings, strokes). No text inside generated images unless the brief needs it; type is set in After Effects. Photoreal subjects are fine where the technique suits photos (media frames, cards).
4. **Generate.**
   - Default model `gpt_image_2_6` (about 0.25 credits an image); `seedream_v4_5` (about 1 credit, up to 4K) for large plates and textures; `flux_2` when prompt adherence matters. Set `use_unlim: false`. Omit `folder_id`.
   - Prompts in plain English: subject, style, palette, light direction, framing, "plain flat background" or "isolated on plain white" when the piece will be cut out, aspect ratio to fit its use.
   - Use `generate_image_batch` for several pieces, then `jobs_wait` in groups of at most 12. Make two or three variants of a hero piece and keep the best.
   - Cut-outs: `remove_background` with the finished job id, `media_type: "image"`.
   - Download each kept result with `curl -sL -o <file> <url>` into `PROOF/<n>/art/` with a plain name (`backdrop.png`, `trunk-near.png`). Check each file opens and has alpha where it should (`ffprobe` or `sips -g hasAlpha`).
   - Look at every image you keep. Reject anything with stray text, extra limbs, watermarks, cut-off subjects or a style that clashes with the rest of the comp.
5. **The brief.** Write `PROOF/<n>/art/brief.md`:

```
technique: <n>
idea: <one or two sentences: the composition as a designer would pitch it>
palette: <hex values>
type: <installed fonts to use for any text, and sizes as shares of the height>
files:
- <file>: <what it is>; <size px>; <alpha yes/no>; layer <name>; position and scale as shares of the comp; 3D z if any; what the technique does to it
layer order: <bottom to top, including the technique's own layers>
notes for the builder: <anything the art needs to read well: blend modes, a slight blur on far layers, where the effect must stay visible>
generation: <model, prompt and job id for each kept file>
```

The builder never sees the video. The brief must not describe the reference; it describes our composition.

6. Write only inside `PROOF/<n>/art/`. No After Effects, no git. Avoid any shell read of `~/Desktop`.

## Report

One line per technique: the idea in a few words, the files made, credits spent. Then anything you could not get to look right.
