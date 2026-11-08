---
name: visual-styles
description: Build After Effects motion graphics in a named visual style from the bundled style library: Art Deco, Liminal found footage, Blueprint, CRT terminal, Dark keynote, Data storytelling, Copperplate engraving, Game Show, Glass product, Halftone dossier, Hologram HUD, Isometric infographic, Living screencast, Low-poly island, Microgame frenzy, Mid-century cartoon, One-line drawing, Paper-cut lightbox, Pictogram motion, Risograph print, Rubber hose cartoon, Silent film, Silkscreen poster, Spy titles, Stained glass, Swiss motion, Tilt-shift miniature, Ukiyo-e woodblock print, Whiteboard explainer or Woodcut print. Use when the user names one of these looks, asks which styles are available, or wants help choosing a style; ordinary motion work without a named look does not need it.
---

# Visual styles

30 visual styles, each with a written grammar (type, colour, motion, camera), an After Effects recipe and an ES3 module. Read through `ae_library`: **motion-language**, **production-workflow** and **brief-template** first (the foundation for every style), then **style-index**, then the chosen style's **style-<id>**. When building with its helpers, also read **style-lib-jsx** and **style-<id>-jsx**. If the library tool is unavailable, the same files are at `../../library/styles/index.json`, `../../library/styles/<id>/STYLE.md`, the module named in the index, and `../../library/styles/aes-lib.jsx`, relative to this skill's folder.

1. Choose the style with the user from the table below. If they describe a look that is not listed, name the closest style and say how it differs.
2. Write the brief in the style's grammar (STYLE.md sections 2 to 4), adapted to the user's subject. A style is a grammar, not a template.
3. Check what the style needs (the table and STYLE.md section 7). Fonts are free families named in the index: use them if installed, otherwise choose a fallback and remeasure. Footage tools need Node and often ffmpeg; the 3D styles render plates with Blender. Ask before running a tool; tools read the inputs you give them and write to a cache folder you choose.
4. Build natively with `ae_do` and `eval.run`: load `aes-lib.jsx`, then the style's module, and follow the AE recipe (STYLE.md section 6). The module's `buildScene(comp, scene, opts)` builds the library's seven-beat test scene; read it as a worked example of the technique, not as a builder for the user's scene.
5. Render frames and check them against STYLE.md before showing the user.

The styles are adaptations of Lemo-Opuscar (MIT, LemoLab), each proven in the author's own test harness before import. `style-index` records each style's proof status; a style not yet built through this plugin is labelled as such.

| Style | id | Tier | Good for | Needs |
|---|---|---|---|---|
| Art Deco | `art-deco` | native | A premium reveal or a big announcement that should feel like an event | ffmpeg, node |
| Liminal found footage | `backrooms` | 3d | Something eerie or unsettling, a 'nobody warned me about this' story | blender, ffmpeg, node |
| Blueprint | `blueprint` | native | How something works, an architecture or system explained part by part | ffmpeg, node |
| CRT terminal | `crt-terminal` | native | Anything about code, terminals or what the AI is really doing underneath | ffmpeg, node |
| Dark keynote | `dark-keynote` | native | A product or feature launch where the interface is the star | none |
| Data storytelling | `dataviz` | native | A real number or a before-and-after that carries the point | ffmpeg, node |
| Copperplate engraving | `engraving` | print | A deep dive or field guide that should feel scholarly | ffmpeg, node |
| Game Show | `game-show` | native | A list, a quiz or a countdown with high energy | ffmpeg, node |
| Glass product | `glass-product` | 3d | A hero product reveal that should look like an Apple launch | blender, ffmpeg, node |
| Halftone dossier | `halftone-dossier` | print | Investigating something: case files, receipts, 'here is the evidence' | ffmpeg, node |
| Hologram HUD | `hologram-hud` | native | Scanning or analysing something; breaking a thing into labelled parts | ffmpeg, node |
| Isometric infographic | `iso-infographic` | native | A workflow or system with several parts that connect | none |
| Living screencast | `living-screencast` | native | Walking through a real app or tool on screen (Joe's favourite) | ffmpeg, node |
| Low-poly island | `lowpoly-island` | 3d | Something that grows over time, a project or system built up piece by piece | blender, node |
| Microgame frenzy | `microgame` | native | Rapid-fire tips, one per beat, each in a different look | ffmpeg, node |
| Mid-century cartoon | `midcentury-toon` | painterly | A how-to or tutorial with a friendly presenter | ffmpeg, node |
| One-line drawing | `one-line` | native | One idea that connects everything; elegant and minimal | ffmpeg, node |
| Paper-cut lightbox | `paper-lantern` | print | A warm, story-like moment told in layers of light | none |
| Pictogram motion | `pictogram-motion` | native | A fast list of facts or steps on a strong beat | ffmpeg, node |
| Risograph print | `risograph` | print | A zine-feeling explainer with indie, creative energy | ffmpeg, node |
| Rubber hose cartoon | `rubber-hose` | painterly | A comedic bit where an object comes alive | ffmpeg, node |
| Silent film | `silent-film` | native | An old-way-versus-new-way contrast, played for laughs | ffmpeg, node |
| Silkscreen poster | `silkscreen-poster` | print | A destination or a big promise sold like a travel poster | ffmpeg, node |
| Spy titles | `spy-titles` | native | A secret, a hack or a mission; something with intrigue | ffmpeg, node |
| Stained glass | `stained-glass` | print | A big, reverent idea; something that feels like a revelation | ffmpeg, node |
| Swiss motion | `swiss-motion` | native | A clean, confident statement; the design-forward default | ffmpeg, node |
| Tilt-shift miniature | `tilt-shift` | 3d | Zooming out on a busy system; the big-picture view | blender, ffmpeg, node |
| Ukiyo-e woodblock print | `ukiyoe` | print | A journey or a landscape of ideas, told scroll by scroll | ffmpeg, node |
| Whiteboard explainer | `whiteboard` | native | Teaching a concept from scratch, explained as you'd draw it | ffmpeg, node |
| Woodcut print | `woodcut` | print | A bold, serious statement with grit | ffmpeg, node |
