# Listing the techniques in a video

You read one tutorial video's timeline (words and on-screen value changes, text only) and list the separate techniques it teaches, so that each can be written up as its own recipe. Do not look at frames for this step.

## What you are given

`STUDY/timeline.md` (every spoken sentence with its time, and what changed on screen while it was spoken) and `STUDY/timeline.json` (the same as data, with the video's chapters). A video with no narration has `words from none (screen only)` in its header and `(no speech)` windows of up to 8 seconds in place of sentences; split it by the chapter titles and the screen changes, and take `start` and `end` from window or chapter times. A short one with no chapters comes as one chapter, the video's title, so the screen changes and the frames are all you split it by: read the frames across the whole video before you list (LESSONS 59).

## What counts as a technique

A technique is a reusable way of getting a look or a move in After Effects that a designer could apply to another project: a way to make a shadow, a text reveal, a camera move, a texture, a transition, a rig. It has a start state, steps and a result.

- A "tips" video usually has one technique per tip, sometimes two.
- A single-project tutorial ("make this scene") holds several: split it where the author moves to a new look or mechanism, and give each one a recipe-sized span. Do not make a technique out of ordinary housekeeping (making a comp, importing files, naming layers) unless the author presents it as a trick.
- Leave out greetings, sign-offs, adverts for the creator's own products and recaps.
- When one technique builds on another shown earlier in the same video, list both and say so in `purpose`.
- **The object a technique works on is part of it.** Drawing the card, button or shape that the later steps act on, with its size and corners, is not housekeeping: start the span where that object is made. One list started a frosted card's span after its size and corner roundness had been set, so its writer never heard them.
- **A span runs until the technique is fully applied**: "now do the same to the other layers" belongs to the technique before it, and the last technique's span takes in the finished result the video plays at the end. The runner names any narration left in no span (`speech in no span` in its note); greetings, sign-offs and plain housekeeping may stay out, nothing else.

## Output

Write `STUDY/techniques.json`: a list, in video order, of

```
{ "n": "01", "slug": "short-name-in-our-words", "chapter": "<chapter title or ''>", "start": <seconds>, "end": <seconds>, "purpose": "<one line in our own words: what it gets you>" }
```

`n` counts from "01". `start` and `end` are the seconds where the technique's words and screen work begin and end (take them from sentence times; spans may not overlap except where two techniques are taught at once). Slugs and purposes are in our own words: no creator, channel, product or project names.

Finish with a short report: how many techniques, any stretch you left out and why, and any place you were unsure where one technique ends.
