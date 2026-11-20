# Deferred until after Comp Room 0.4.2

Written 2026-11-19. Joe's plan: ship 0.4.2 (the 57 proven cookbook recipes plus the bundled runtime), then pick all of this back up, likely within a couple of days.

## Comp Room plugin (next release)

1. **Material library.** Substance materials on 3D text and shapes: the user picks each material once in a library project, and scripts copy it onto titles after that. See `docs/superpowers/specs/2026-11-16-comp-room-0.4.1-design.md`, "0.4.2 outline".
   - Proven: `project.merge` of a library `.aep`, then `copyToComp` of the title, the environment light and the HDRI layer, with the text changed by script.
   - Open: whether a script can set the material's own parameters (Hue Shift, Luminosity, Color); a check that the right material arrived; a smooth anodized or brushed SBSAR, because a plain material with legacy metal settings read as clay.
   - The test library is `~/Assets/house-materials-test.aep`; materials and HDRIs are in `~/Assets/substance-materials/`.
2. **"Speaker in a real room" headline preset.** A variant of the pixel-headline style, stated as layout rules relative to the measured speaker. Joe's exact values go in his own preset.
3. **Two techniques from the finish-line reel**, to be re-proven on generated art before they join the cookbook:
   - studio-to-card hand-over (job `hand-over`);
   - footage opening out of a glowing line (job `reveal`).
4. **Cookbook follow-ups** (`product/arsenal-catalog-design.md`):
   - re-prove the picture recipes at 9:16;
   - mood tags that match the house words;
   - ranking variety;
   - status auto-loosening;
   - honest pinning.
5. **Minors parked by the 0.4.1 final review** (in the 0.4.1 hand-over notes).

## Cookbook proofs

6. **`eoBEBx1PbS4` 07 (warm-sided title) and 08 (hollow outline title).** Waiting on the material library.
7. **`8oVLS0ZlKC4` 06 (glowing orb).** Partly matches: the disc renders 20 to 40 levels too bright, cause not found.
8. **First video's puppet pin.** Done by hand in the tutorial; stays unproven.
9. **Write build-found values back into recipes 14, 15 and 17** from the first video: values the proofs needed but the tutorial never showed.

## Learning

10. **New tutorials, chosen to fill the 14 jobs with no proven technique.** Also the nightly learner at a few videos a night (YouTube's bot check limits downloads).

## Content repo (house style)

11. **New house look: premium dark studio** (dark mode, blue lights, dark background, Blender objects) replacing the paper matte. Update the Content house style and Comp Room's optional JoeB preset (`plugin/library/presets/joeb.md`).
12. **Joe's house set of materials,** once the material library exists.
13. **Content-side defaults from 0.4.1:**
    - review once before the first look, then on request;
    - idle-layer threshold 3 s;
    - a pointer to read the motion-studio skill and the brief template first.

## Housekeeping

14. **Five old directory-submission commits** on `claude/after-effects-anthropic-plugin-491bba`.
15. **Two merged remote branches** to delete on `public`.

Study material for all of this lives in `~/Assets/comp-room-studies/`, outside the repo.
