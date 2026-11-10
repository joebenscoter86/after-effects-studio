# JoeB paper / navy / vermilion preset

Optional house style distilled from the user-approved Content motion playbook dated 2026-10-06. General projects should use their own visual direction. The newer playbook removes grain; older house helpers retain historical options and must not override this direction.

Paper #F2EEE4, edge #E4DED1; navy #14213D; one vermilion accent #E2472B; dark UI #15171C. Inter Tight Medium for the structural title, Instrument Serif Italic for its expressive second line. Fonts are user-installed dependencies; no font binaries ship here.

For the original 1080x1920 layout: title baselines y214/y326, underline y408, picture stage y430–1010, calm 1–3 word captions centered at y1052, face card 952x676 spanning y1208–1884 with the head breaking its upper edge. These are layout-specific coordinates, not automatically safe for every face or platform. Measure the user's footage and platform chrome.

Each section holds a two-line title and constructs one picture over time. Native guides, paths, exact text, masks and numbers sit alongside high-quality front-on objects. Let the accent arrive on the meaningful word. End a smooth build with a purposeful snap and use a shared whip for hand-off. No grain. Matte paper mode is the default; room cuts punctuate a question or emotional turn. Full-screen graphics need their own tested layout.

Generated asset brief: one front-on, orthographic object; consistent upper-left studio light; restrained palette; no baked shadow; no generated text; separately generated parts when they move independently. A flat green background is one extraction option when alpha output is unavailable. Use available generation tools, supplied assets or user-owned libraries; no provider is required by this plugin.

Contact shadow starting point: distance 5, softness 12, opacity 70/255. Lift shadow: distance 30, softness 64, opacity 46/255. Direction 135, color [0.07,0.1,0.2]. Adjust with object size and render the overlap.

## Existing rig helpers

`house-jsx` then `joeb-motion-jsx` preserve the real Content helpers. Set AES_HOUSE_CONFIG with local directories (trailing slash): assets, rig, lib, kit, textures; local lut file; project assets directory; fps and measured head position. Required assets, licensed templates, textures, LUTs, generated objects and Joe's footage are not bundled. A compatible MASTER rig is required for matBegin/faceCard/room calls. Do not execute those in an arbitrary project.

For a new generic scene start from `motion-jsx`; it has no rig, file path, font or brand dependency. Use the preset as design guidance and create the needed native scene structure explicitly.
