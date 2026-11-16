# Matching a new recipe against the catalog before adding it

A technique already in the catalog is not added twice: the new recipe becomes a **variant** of the existing entry, with its own source and its differences (`product/arsenal-catalog-design.md`, "One technique, one entry"). You decide which new recipes are variants, write their two merge lines and their tags. A checker who did not write them confirms each merge.

## What you are given

- The new video's checked recipes, `STUDY/recipes/<n>-*.md`.
- The catalog: `product/arsenal-drafts/catalog.json` (one record per recipe: id, name, line, job, support, group) and the drafts it is built from, `product/arsenal-drafts/<video>.md`.
- The job vocabulary, `plugin/library/arsenal/jobs-v1.json`, and the existing tags, `product/arsenal-drafts/tags.json` with `tags-notes.md`.

## For each new recipe

1. **Find candidates by job.** List catalog records whose job or support jobs overlap the new recipe's beat, and any whose name or `group` names the same mechanism.
2. **Same mechanism, or only the same look?** A variant teaches the same mechanism (the same effects or structure doing the same work) in another scene, with other values or an extra step. A recipe that reaches a similar look by another route (a focus distance set by hand against focus locked to a layer; a drop shadow against a radial-blurred copy) is a new entry; put it in the same `group` so `taught_by` counts it, and say why it is not a variant.
3. **Write the merge lines with both recipes open side by side.** Directly after `status:`:
   - `variant of: <parent id> (<parent video id> #<n>)`
   - `differs: <one paragraph>`: what is shared (name the parent's settings), then each difference as "here … ; in the parent …". Every claim about the parent points at a line you have just read in the parent's section: its steps, layout, timing, build notes or unknowns. Write nothing about the parent from memory. A parent figure that came from a proof build or another recipe, not from its own video, is said to be so.
   - Do not list a value as a difference unless the parent gives a different value for the same thing.
4. **Tag it** against jobs v1: one primary `job`, up to two `support` jobs, or kind `build-aid` (setup that never shows on screen alone) or `unmatched`. Never invent a job id. A variant's tag carries `variant_of: "<parent video id>#<nn>"` and the parent's kind.
5. A merge line edits the recipe, so the recipe needs a fresh check of the changed lines: the checker writes `merge: confirmed` or `merge: refused` with the false claims (`check.md`, check 11). `assemble.mjs` refuses a recipe with a `variant of:` line whose check does not say `merge: confirmed`.

## Report

One line per new recipe: new entry or variant of what, its tags, and for each non-variant the nearest existing entry and why it is not the same.
