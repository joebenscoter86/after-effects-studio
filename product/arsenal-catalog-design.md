# Technique catalog at scale: plugin side of the brief contract

Status: draft for Joe, 2026-11-14. Nothing is built. The brief side (job vocabulary, beat format) is being drafted in the Content repo by the session "Brief contract for a growing technique catalog"; the two are reconciled before either is built.

## Intent

Joe's plan: an agent tears down tutorial videos every night, indefinitely, so the technique catalog grows from 64 recipes (24 proven) to hundreds. A recipe is an ingredient; a reel needs a brief that picks and combines them. "It's not that the ingredients inform the brief, but that the brief uses the ingredients available." With 12 ingredients the brief writer can read them all; with 400 it cannot, and if it tries it will reach for whatever it read first.

So the catalog must stay usable at any size: the brief writer's work per beat stays the same whether the catalog holds 25 or 2,000 techniques.

## What breaks today

- **The menu is prose written by an agent.** `product/arsenal-drafts/INDEX.md` is regenerated whole by a menu agent; it already shows every recipe as `unproven` after 24 were proven today. It will not survive nightly growth.
- **Reading, not querying.** The only way to choose is to read the menu.
- **Duplicates.** Nineteen techniques were already taught by more than one of five videos. A nightly run will learn the same drop shadow dozens of times.
- **Package limits.** The Claude directory allows 512 files and 256 KiB per non-image file; the design capped the arsenal at 12 package files.

## Goals

1. **Query, never browse.** Per beat, the brief writer asks for candidates by job and filters, and gets a ranked shortlist of about five.
2. **The index is built by code** from the recipes' own fields, every run, with tests. No agent writes it.
3. **One technique, one entry.** A newly learned technique is matched against the catalog first and merged as a variant when it is already there.
4. **Proven means something and is visible**: only Joe proves, as `assemble.mjs` already enforces.
5. **More choice must give better picks.** An eval shows it.

## Non-goals

- Composition (how techniques combine into a shot, how shots make a piece). That is the next layer, learned from finished pieces; this document only makes the ingredients findable.
- Writing briefs. The Content repo owns intent.

## The record: fields every recipe carries

Recipes keep their prose body. Added to the header, as data (the recipe form gains these lines; the writer and checker prompts fill and check them):

| Field | Values | Why |
|---|---|---|
| `id` | `<video>-<n>-<slug>` today; a stable catalog id after merging | Joins briefs to builds |
| `jobs` | 1 to 4 ids from the shared job vocabulary (Content's list) | The main query key |
| `look` | a few tags from a small controlled list (flat, 3D, glow, paper, photo, dark, light, playful, editorial, cinematic…) | Style filter |
| `needs` | none / type / shapes / photo / footage / illustration / 3D camera / character | So a brief only gets what its assets allow |
| `duration` | typical seconds on screen | Fits a beat |
| `motion` | still / loop / one-shot / transition | Fits a beat |
| `difficulty` | 1 to 3 (steps, hand-only parts) | Ranking and build planning |
| `status` | unproven / proven (with Joe's acceptance) / cannot-script | Filter; ranking |
| `taught_by` | count of distinct creators and videos | How fundamental it is; ranking |
| `variants` | ids merged into this entry | Merging |
| `pairs_with` | ids, from shots seen together in finished work | Seeds the next layer; empty for now |
| `thumb` | a still of our own proof render (never the creator's frame) | What the shortlist shows |

## The catalog file

- **One data file** (`plugin/library/arsenal/catalog.json`) generated from the recipes by `assemble.mjs`, plus the recipes themselves grouped several to a file by job category, read one section at a time (`ae_library` with `section`, already built on another branch).
- At about 1 KB a record, the data file holds a few hundred techniques inside one 256 KiB file. Past that, it splits by job category (one file per category, still well inside the 12-file cap at 15 to 30 jobs if categories are grouped). Raising the cap is a decision for Joe.
- Thumbnails stay out of the package (images count against the file cap) unless Joe decides otherwise; the shortlist can carry the one-line description and the build's own words instead.

## The query

A plugin operation, `arsenal.find` (or a mode of `ae_library`):

```
in:  { job, look?: [..], needs_at_most?: [..], duration?: s, motion?, proven_only?: bool, exclude?: [ids], limit?: 5 }
out: [ { id, name, line, jobs, look, needs, duration, status, taught_by, section } ]
```

Ranking, simple and explainable: match on job first; then filters as hard cuts; then proven before unproven, more creators before fewer, and look-tag overlap. Every result carries the `section` to read the full recipe. When nothing passes the filters, it returns the nearest by job with the failed filter named, so the brief writer can relax one constraint deliberately.

## The nightly run, at scale

1. Gather and align (no model, as now). Stop at YouTube's bot check, as now.
2. Distil, check (writer and checker prompts with today's lessons).
3. **Match before adding:** each new recipe is compared with catalog entries sharing a job; a match becomes a variant (its own source, its differences), not a new entry. A checker confirms the merge.
4. `assemble.mjs` rebuilds the catalog file and the index; tests cover the fields.
5. **Proving queue by demand:** techniques chosen by briefs, or taught by many creators, are proven first, with generated art, in batches, when After Effects is free. Joe accepts.

## How we'd know it works

The planning eval in the design (a storyboard whose beats need techniques it does not name) run twice: against today's catalog and against a larger one. The larger catalog must raise the score. If it lowers it, the ranking or the vocabulary is wrong, not the catalog.

## Open questions

1. The job vocabulary is shared: the Content repo drafts it, the plugin files every recipe under it. Who approves a new job: Joe each time, or a rule (for example, a job proposed by three recipes)?
2. Does the shortlist need pictures? Pictures make choosing better but cost package files or a hosted catalog.
3. Where does the nightly run live: a session Joe starts each evening, a scheduled routine, or a machine kept awake? Overnight After Effects needs an unlocked screen, and YouTube's bot check limits downloads.
4. Should unproven techniques be offered to briefs at all, or only after a cheap first build?
5. Do merged variants keep each creator's settings, or one canonical recipe with notes?

## Reconciled with the Content draft (2026-11-14)

Content's draft: `docs/superpowers/specs/2026-11-14-brief-technique-catalog-contract-design.md` on branch `adobe/brief-catalog-contract` in the Content repo (commit 320c2656, local only). It proposes **jobs v1**: 27 jobs in three groups (18 line jobs such as `land-number`, `step-through-process`, `before-after`; 6 picture jobs such as `add-depth`, `light-the-hero`, `finish-the-look`; 3 connective jobs: `hand-over`, `move-camera`, `keep-it-alive`), a beat format, and a query per beat. The two drafts agree on the split and the shape. Changes this side takes from it:

1. **Jobs come from jobs v1, not craft categories.** Today's `jobs:` fields ("lines and shapes", "glow and colour") are craft groups a brief cannot ask for. Every recipe is re-tagged: one primary job and up to two support jobs from jobs v1, taken from its `what it does for a beat` line. Build aids (shy layers, Grow Bounds, crisp precomps, stagger by drag, shutter angle) get `build-aid` and never come back from a beat query. A recipe that fits no job is tagged `unmatched` and goes to a proposals queue; neither the plugin nor the nightly learner ever invents a job id.
2. **The query takes the beat as Content writes it**: `vocab` (pinned version), `job`, `support`, `duration`, `takeaway`, `mood` (soft), `assets` (typed: footage, screen, photo, logo, voice, library, type), `constraints` (aspect, theme, palette, status), `exclude`, `limit`. It refuses an unknown job id and lists the valid ones.
3. **The answer carries what Content needs to choose**: `id@revision`, name, one line, a still from **our own proof build** (never the tutorial's frame), status and how it was proven, `needs`, natural play length, and a one-line `fit` saying why it ranked for this beat. The catalog version is stamped on every answer.
4. **Revisions.** Recipes get stable ids and revisions; a brief pins `id@revision`; a retracted or improved recipe stays fetchable at the pinned revision.
5. **Status gains `shipped`** beside `proven` (matched to the tutorial and accepted by Joe): used in a posted reel. Who writes it back is open.
6. **A wanted list.** When a beat finds nothing, Content adds the ask to a wanted list; the nightly learner reads it when choosing what to tear down next, so the catalog grows toward what briefs ask for.
7. **The `look` field becomes mood tags** matched softly against the beat's mood words; no hard filter.

Still to settle between the two sides:
- **Stills in the package.** Content needs a still per candidate; this side had kept images out of the package. Options: stills ship only for proven recipes (24 today), or the catalog is read from a hosted copy. Decision for Joe.
- **Where jobs v1 lives for the plugin.** Proposed: Content owns `jobs.json`; the plugin vendors a pinned copy (like a lockfile), written brand-agnostic as Content drafted it, since Comp Room ships to other users.
- **Combinations.** Both drafts return single recipes; pairing (a matte window plus its glow) stays the brief writer's call for now, with `pairs_with` filled from finished pieces later.
- **Fit to 9:16 and the house palette.** Recipes were measured on 16:9 tutorial frames; whether the catalog can say "works at 1080x1920" or the brief writer judges from the still is open.
