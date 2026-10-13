# Camera, depth and continuity

Derived from the VO explainer camera study and native production failures. Useful across light, dark, editorial, isometric and product styles. The camera should help the viewer understand a spatial relationship.

## Pick a camera mechanism

A 2D scene carrier or nested SCENE layer is often enough for a composed push/pan. It preserves a predictable coordinate system and editable native content. Use true 3D cameras/layers when parallax, perspective or actual spatial traversal is essential. Do not add 3D just to claim dimensionality. State which content is world-locked and which labels remain screen-locked.

## One move connects two ideas

The reference study found about six camera moves in 21 seconds, typically one 1.5–2s eased move followed by 1–2s of reading hold. The resulting production used about 15 moves in a minute instead of 96 stop-start keys. Those are calibration numbers for that explainer, not a universal camera budget.

Use one coherent ease for each move; avoid halfway stops without a story reason. Move toward, through or away from an identified subject: through a container to its contents, into a dot that becomes a new ground, out of a small chip to its surrounding system. Remove moves that simply decorate a word. A hold can carry a slow 2–4% zoom change over its span or remain still when proof needs stability.

## Frame-exact traversal

For a through-object transition, pick the change frame f first. End the outgoing layers and start incoming layers at exactly f/fps. Place the old framing peak on the preceding frame, and handle the incoming jump so the motion-blur shutter does not sample a mixed old/new scene. The original recipe placed the new framing half a frame before f while it remained invisible. Inspect the renderer's actual frames around f-2 through f+2; do not assume that recipe fits every shutter setup.

Two nested scene carriers can simplify visibility at a jump. Avoid interpolation across an intended discontinuity: use deliberate hold keys or separate layers. Match travel direction and retain an anchor so the destination feels connected. A wash may conceal a seam when it belongs to the design; it does not excuse a broken hand-off.

## Bound the frame through the move

In a 2D view centered at scene point cx, with scale z as a ratio and output width W, the visible right boundary in scene coordinates is `cx + W/(2*z)`; the left is `cx - W/(2*z)`. Ensure essential text bounds plus margin fit for every sampled camera pose. This generalizes the original 1080px camera clamp without carrying its private coordinates.

Make the background an actual layer, large enough for every pan and pull-out. AE's composition background color alone is not a dependable rendered background. Use an opaque output ground where intended; inspect alpha and render against both light/dark if delivering transparency.

## Depth hierarchy

Use occlusion first, then coherent shadow direction, relative scale, overlap, restrained perspective and selective blur. If an object emerges from a box, duplicate the box: full rear layer below the object, masked front rim above it. The rim should hide the lower moving edge until it clears the container. Parent moving surfaces and their labels in the same space.

Do not shake a presenter to sell an impact on a graphic. Localize the response to the receiving object or its environment. Avoid gratuitous parallax while the viewer is reading UI. Every depth cue should agree about where the objects sit.

## Camera review questions

What is the camera following? What relationship is revealed by its destination? Is the held result readable? Does type clip at maximum zoom? Does the background expose an edge? Is there a one-frame ghost? Can the viewer identify the same star before and after the move? Render those questions rather than answering from code alone.
