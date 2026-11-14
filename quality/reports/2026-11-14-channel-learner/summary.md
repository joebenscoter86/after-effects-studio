# Channel learner: where it stands (written 08:35, 2026-11-14)

## The short version

- **All 25 techniques from the video you sent are built in After Effects, each from its written recipe alone, and set beside the tutorial's own result.** A reviewer who did not build them judged 24 as matching. One cannot be judged: recording a puppet pin by hand (tip 8) cannot be done by script.
- **"Matches" means the mechanism works with the same measured character** (shape, count, spacing, direction, softness, timing). It does not mean the build looks finished. Every build uses plain stand-in art beside a finished illustration or photo.
- **Nothing is accepted yet.** A recipe becomes proven on your yes. The pairs are in five sheets for you to look at.
- Nothing is pushed.

## How the proofs were run

1. A builder agent got the recipe and its build script, never the video, and ran it in After Effects through the plugin, fixing the script as it went.
2. A separate reviewer set each render beside the tutorial's result, measured both, and wrote a verdict.
3. A build judged "partly" went back to a builder with the reviewer's figures, then to a fresh review.

## Results

| # | Technique | Verdict | Rounds | Note |
|---|---|---|---|---|
| 1 | Dotted line | Matches | 1 | |
| 2 | Line with end dots | Matches | 1 | |
| 3 | Tapered stroke | Matches | 1 | |
| 4 | Carousel by rotation | Matches | 2 | Recipe's radius was wrong (0.61 of the width; 0.48 matched) |
| 5 | Stagger layers in time | Matches | 1 | Judged on start times; the tutorial's result is a Timeline panel |
| 6 | 3D orbit ring | Matches | 3 | Ring is a little tall in the frame |
| 7 | Face the camera | Matches | 1 | |
| 8 | Record puppet pin motion | Cannot be judged | 1 | By hand only; the build is a stand-in |
| 9 | Endless background | Matches | 1 | |
| 10 | Graphic as particles | Matches | 1 | |
| 11 | White-on-light finish | Matches | 2 | Gradient overlay is a Gradient Ramp stand-in |
| 12 | Long soft shadow | Matches | 3 | Two of four shadow directions differ (8 and 22 degrees) |
| 13 | Dot grid texture | Matches | 1 | |
| 14 | 3D floor shadows | Matches | 2 | Recipe's 45 % darkness gave half the shadow; 78 % matched |
| 15 | Grow Bounds fix | Matches | 1 | |
| 16 | Lock focus to a layer | Matches | 1 | Recipe gives no aperture |
| 17 | Depth fog | Matches | 4 | Reached partly by tuning the stand-in scene |
| 18 | Smooth text reveal | Matches | 2 | |
| 19 | Text on a path | Matches | 1 | Letters about 37 % too tall |
| 20 | Two-pass glow | Matches | 1 | Build's haze is stronger; banding at 8 bpc |
| 21 | Texture through a matte | Matches | 1 | Levels stands in for Curves; letters 30 % brighter |
| 22 | Hide layers with shy | Matches | 1 | Proved by reading the switches back, not by sight |
| 23 | Shutter angle blur | Matches | 1 | |
| 24 | Sharp scaled precomp | Matches | 1 | |
| 25 | Custom media frame | Matches | 1 | |

Seventeen matched on the first build. Seven needed corrections; one cannot be judged.

## What I saw myself

I looked at the pairs for 6, 11 to 20 and 25. I have not looked at the rest, and I watched none of the movies.

- **Agree with the verdict:** 6, 14, 16, 19, 20, 25. The mechanism is plainly the same.
- **Looser than the verdict suggests:**
  - **12:** the build's top-left shadow runs nearly level where the tutorial's shadows all run down and to the right.
  - **17:** the fog measures the same, but the build reads as flat bars under a veil. The tutorial's depth comes from its painting.
  - **11:** the disc's shading is there, but the tutorial's scene also has soft shadows round every disc, which this tip does not cover.
- **Cannot tell at this size:** 13 (1 px dots; the reviewer judged it on an enlarged crop).

## What the proofs taught

- **Three "partly" verdicts traced to recipe errors.** The carousel radius (4), the floor shadow darkness (14) and the white-on-light shading direction (11) were wrong or misleading in the recipe, and were found only by building.
- **Two came from reviewer errors.** One review under-read the orbit ring's roll (6 degrees for 16) and missed its direction. Another took a bar's shadow for the title letters' shadows (12), and the builder added ten shadows the tutorial does not have. Both were caught by the next reviewer.
- **About twenty places where a recipe's wording disagrees with the tutorial's picture.** These are being written back into the recipes now, with a checker to follow.
- **Plugin gaps.** The builders needed raw scripting for: stroke dashes and caps, Taper, Trim Paths, staggering layers, placing a camera, linking focus to a layer, layer styles, track mattes, the shy and collapse switches, comp shutter settings, reordering effects, and checking a font is not a substitute. Puppet pins cannot be scripted at all.

## Still running

- A writer is putting the proof findings into the 25 recipes. Values found only by building (such as 78 % darkness) are added as notes; what the tutorial states is kept.
- Then a checker verifies the changed lines against the frames, and the draft is rebuilt.
- After Effects is with the other session for its live checks of the launch fix (from 08:24).

## Decisions for you

1. **Look at the pairs** and say which techniques you accept as proven. Sheets: `quality/renders/channel-study/YBeMmC43Q1U/proof/sheets/`. Each technique's folder also has `review.md` and, for moving ones, `build.mov`.
2. **Finished art.** The proofs show mechanisms on stand-ins. If you want to judge a finished look, pick two or three techniques and I will build them with proper art.
3. **More videos.** YouTube's bot check stopped downloads after six videos. I will not sign in or use browser cookies to pass it. The choices are a much slower pace, or you supplying the files.
4. **Merging.** The menu lists 19 techniques taught in more than one video. The recipe texts are not merged.
5. **Push.** About 65 local commits on `adobe/channel-learner`. The repository is public.

## Where to look

- Pairs, five to a sheet: `quality/renders/channel-study/YBeMmC43Q1U/proof/sheets/`
- Recipes for your video: `product/arsenal-drafts/YBeMmC43Q1U.md`
- The menu for all 64 recipes: `product/arsenal-drafts/INDEX.md`
- Build scripts: `tools/channel-learner/proofs/first-video/`
- The full record, in order: `quality/reports/2026-11-14-channel-learner/report.md`

## Correction

Between 07:30 and 08:25 my progress messages and the record carried times up to an hour fast (I told you After Effects was handed over at 09:25; it was 08:24). The record is corrected from the commit times.
