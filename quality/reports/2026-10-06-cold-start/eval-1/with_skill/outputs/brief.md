# Production brief — Inbox review

**Takeaway:** six fictional requests are reviewed; four remain visibly deferred and the same two approved requests carry into the next workspace. No request silently disappears.

**Delivery:** authoring package only: standalone ES3 function body for `eval.run`, this brief and a review handoff. Do not execute AE in this test. A future run adds one uniquely named 1280 × 720 composition, 30 fps, 270 frames / 9 seconds, pixel aspect 1. All text, paths, surfaces and animation remain native and editable. There are no imports or external assets. The current project is not saved, closed, cleared or switched, and existing compositions/layers are untouched.

## Design and inputs

The geometric document is the intentional subject, so native paths are finished design material here. Palette: deep aubergine #220F2A ground, raised aubergine #321B3B surfaces, warm ivory #F7EFDE documents/type, electric mint #72FFC1 selection/approved state. No borrowed house palette, presenter, music, VO, external art, or custom rig. The data is explicitly fictional and labeled on screen.

Use a quiet sans serif hierarchy: 44 px title, 27 px area labels, 24 px document IDs, 38 px final approved count, 23 px summary. ArialMT is requested as a common ordinary font, not a bundled dependency; live font readback and rendered glyph verification remain required. A proportional width guard uses actual `sourceRectAtTime` bounds. Final type has dedicated space and receives no scene translation.

Coordinates in comp pixels:

- Opaque ground covers all 1280 × 720.
- Title at (64,59); fictional marker at (986,74).
- Review area [64,218] to [808,438]. Six 92 × 124 folded-corner pages are centered at x = 128,250,372,494,616,738, y = 330. IDs R01 through R06 remain attached throughout.
- Deferred area [64,497] to [808,645]. R01, R03, R04, R06 finish at x = 148,336,524,712, y = 571, 74% scale. Page edges end at approximately y = 617, inside the surface. The count appears above this area.
- Next workspace [870,218] to [1216,438]. The **original** R02 and R05 layers finish at (964,330) and (1122,330), 100% scale. Their final bounds are [918,268]–[1010,392] and [1076,268]–[1168,392]. Their exact IDs, folds and drawn checks survive the transfer.
- Final result occupies x = 870–1216, y = 502–581. Bottom audit line begins at (64,668).

## Operation and composed poses

**Start (f68 / 2.27 s):** a constructed review surface holds six fully readable ivory requests. Each arrived while its outline, material, fold, ID and two rules were being built. The viewer can count the original set.

**Action (f111 / 3.70 s):** a mint scan crosses the actual row. State changes are tied to its crossing of each page center. Four move down into a retained deferred area; R02 and R05 become mint and receive a native check. This is a deferral operation, not deletion, so the four remain visible instead of collapsing away. The original source area progressively empties.

**Hard transfer (f143–174 / 4.77–5.80 s):** destination border and label have been constructed before arrival. Rightmost R05 travels first from (616,330) to (1122,330), f143–164. Leftmost R02 follows from (250,330) to (964,330), f152–174. This ordering lets the front page clear the shared horizontal route; it avoids overtaking and preserves stable identities. Both pivot at the center and retain scale 100%, rotation 0°. There are no target duplicates and no copy swap. Inspect minimum page separation throughout the overlap, particularly f154–168, before accepting.

**Payoff (f190–269 / 6.33–8.97 s):** two checked mint requests rest in the outlined next workspace. The four deferred requests remain countable below their original environment. Final type states “2 approved,” “Carried forward,” and “6 reviewed / 4 deferred / 2 approved.” The fully resolved picture holds almost 2.7 seconds.

## Event schedule at 30 fps

| Frames | Visible event | Purpose and timing |
|---|---|---|
| 0–18 | Title, review ground and baseline establish | Guide first; line draw deliberately eases 82/82 |
| 6–13 | Fictional marker and “6 requests” | Explicit evidence status and count |
| 22,27,32,37,42,47 | Six individual page constructions begin | 5f stagger; each travels from y282 to330 in14f |
| Entry…+11 | Page outline draws | Establish silhouette before completed material |
| Entry+6…+12 | Ivory material resolves | 6f fill-opacity build |
| Entry+8…+20 | Fold, ID and internal rules resolve | Small offsets build structure, not six finished cards popping in |
| 68–77 | Six-page state holds | Ordinary explanatory pose before intervention |
| 78–122 | Scanner goes x100→760 at constant speed | Exact crossing controls state events |
| 80,88,96,104,112,121 | Hits R01…R06 | Derived from spatial crossing, rounded to nearest frame |
| Hit…+3 | Approved pages turn mint | Semantic color change applies only to R02/R05 |
| Hit+2…+8 | Check draws on approved page | Shape confirmation supplements color |
| Hit…+9 | Approved page 100→106→100% local emphasis | Brief bounded impulse; no camera shake |
| Hit+3…+21 | Other pages move into deferred set | 18f 82/82 travel and scale100→74%; IDs retained |
| 82–85 | Deferred receiving surface appears | Available before first landing |
| 122–125 | Scan clears | End at126; no residual scanner at payoff |
| 134–150 | Destination outline constructs | Clear destination before carry lands |
| 143–164 | R05 travels into next workspace | Leads the horizontal queue |
| 152–174 | R02 travels into next workspace | Same two objects bridge environments |
| 174–184 | Local destination outline response | Stroke2→4→2px, not global motion |
| 174–190 | Review-complete label, counts and audit line | Progressive reading hierarchy |
| 190–269 | Full result still | Final readability takes priority over decorative motion |

Settle/travel helpers follow the supplied influence grammar (settle out28/in85; deliberate travel82/82; linear short impulses). Whole-row pace is slower than a dense 2.5-second construction scene because viewers must track six individual IDs and a four/two decision without VO. The camera is intentionally static: the page movement itself explains the relationship between visible workspaces. Depth comes from simple layer order and surface boundaries; no imitation photorealism, decorative orbit or unjustified shadow stack.

## Ownership and review

One `AES_InboxReview_<timestamp>_<random>` composition; collision checked against existing item names. Owned layers have `IR_<unique>_` prefixes. Existing project state is not used as a rig. The function returns comp IDs, name, dimensions, counts, per-request timing/state and font readbacks. No undo groups are opened by the function because `eval.run` owns its execution context. If execution fails or times out, inspect live state before retrying; partial new work may exist.

Review the ordinary construction at f43/f68 and the hard carry at f148/f158/f169/f173. Render at least f0,14,43,68,82,94,111,122,142,148,158,169,173,184,210,269. Around the carry, inspect a dense every-frame strip f143–176, including shutter sampling. Check scan-to-state alignment, R01/R03/R04/R06 retention, R02/R05 identity, text bounds/glyphs, source emptiness, destination containment, and exactly four plus two at the payoff. Check muted playback at full speed for crowded entrances, excessive scan speed and sufficient hold. No audio check is relevant because no audio is specified.

This is an unexecuted authoring package. Script parsing cannot establish AE compatibility or visual quality. No render, playback, export, technical decode or user approval is claimed. The final craft judgment depends on those subsequent artifact checks.
