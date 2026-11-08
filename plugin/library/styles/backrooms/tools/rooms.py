# Liminal found footage: the whole shared scene as one continuous camcorder take through an empty mustard office, rendered by Blender.
# usage:
#   Blender -b --factory-startup --python rooms.py -- <scene.json> <out_dir> [res=WxH] [samples=N] [still=f,f,...] [frames=a-b] [notice=<ttf>]
# Writes <out_dir>/f_NNNN.png (RGB, low resolution on purpose: the VHS pass in After Effects upscales it) and <out_dir>/data.json
# (per frame, in 1080x1920 pixels: the TV screen's four corners, whether it shows, its blur and fog; the blackouts and tape tears).
# Every frame is set from a function of time (no keyframes) and rendered in a loop; finished frames are skipped, so a render resumes.
# The space: axis-aligned partitions with gaps, a drop ceiling of tiles with a light panel every 2.4 m. Every panel is an area light
# with no shadows (flat light that leaks through walls) and a cutoff distance; a few are dead, a few flicker, and two dead zones keep
# a corridor end and the far room dark. A world volume makes the fog, lit only by nearby panels, so the dead zones read as dark haze.
# One saturated colour: a red alarm lamp in the far room. The TV's screen is pinned by After Effects on top of the plate.
import bpy, bmesh, math, json, os, sys, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

A = sys.argv[sys.argv.index("--") + 1:]
SCENE_PATH, OUT = os.path.abspath(A[0]), os.path.abspath(A[1])
OPT = dict(x.split("=", 1) for x in A[2:] if "=" in x)
SCN = json.load(open(SCENE_PATH))
B = {b["id"]: b for b in SCN["beats"]}
WORDS = json.load(open(os.path.join(os.path.dirname(SCENE_PATH), SCN.get("words", "words.json"))))
FPS = SCN["fps"]; DUR = SCN["duration"]; NF = int(math.ceil(DUR * FPS))
tT, tP, tI, tN, tL, tC, tE = (B[k]["t0"] for k in ("title", "picture", "input", "number", "line", "carry", "end"))
RES = tuple(int(v) for v in OPT.get("res", "720x1280").split("x"))
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = OPT.get("notice", os.path.join(HERE, "..", "assets", "fonts", "BarlowSemiCondensed-SemiBold.ttf"))
OW, OH = SCN["width"], SCN["height"]             # the track is in the comp's pixels whatever the render size
random.seed(43)

def tf(f): return (f - 1) / FPS
def sm(u): u = max(0.0, min(1.0, u)); return u * u * (3 - 2 * u)
def lerp(a, b, u): return a + (b - a) * u
def win(t, a, b): return sm((t - a) / (b - a)) if b > a else float(t >= a)
def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

# ---------------- scene ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
E = sc.eevee
for a_, v_ in (("taa_render_samples", int(OPT.get("samples", "24"))), ("use_raytracing", True), ("use_fast_gi", True), ("fast_gi_distance", 3.0),
               ("use_shadows", False), ("volumetric_start", 0.1), ("volumetric_end", 40.0), ("volumetric_tile_size", "8"), ("volumetric_samples", 48),
               ("volumetric_sample_distribution", 0.85), ("use_volumetric_shadows", False), ("horizon_quality", 0.6)):
    try: setattr(E, a_, v_)
    except (AttributeError, TypeError): pass
sc.render.resolution_x, sc.render.resolution_y = RES; sc.render.resolution_percentage = 100; sc.render.fps = FPS
sc.render.film_transparent = False; sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"
try: sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Base Contrast"
except Exception: sc.view_settings.view_transform = "Standard"
sc.view_settings.exposure = 0.0
COL = sc.collection

# ---------------- materials ----------------
def node_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]
def nn(t, kind, **kw):
    n = t.nodes.new(kind)
    for k, v in kw.items(): setattr(n, k, v)
    return n
def mathn(t, op, a, b=None):
    n = t.nodes.new("ShaderNodeMath"); n.operation = op
    for i, v in ((0, a), (1, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: t.links.new(v, n.inputs[i])
    return n.outputs[0]
def mixc(t, fac, a, b):
    m = t.nodes.new("ShaderNodeMix"); m.data_type = "RGBA"
    if isinstance(fac, (int, float)): m.inputs["Factor"].default_value = fac
    else: t.links.new(fac, m.inputs["Factor"])
    for slot, c in ((6, a), (7, b)):
        if isinstance(c, tuple): m.inputs[slot].default_value = (*c, 1)
        else: t.links.new(c, m.inputs[slot])
    return m.outputs[2]
def noise(t, scale, detail=3, coord=None):
    n = t.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = detail
    if coord is not None: t.links.new(coord, n.inputs["Vector"])
    return n.outputs["Fac"]

def wallpaper():
    m, t, b = node_mat("wallpaper"); geo = nn(t, "ShaderNodeNewGeometry"); sep = nn(t, "ShaderNodeSeparateXYZ"); t.links.new(geo.outputs["Position"], sep.inputs[0])
    # vertical stripes: a wave across x + y (the walls are axis aligned), faint
    s = mathn(t, "ADD", sep.outputs[0], sep.outputs[1]); st = mathn(t, "SINE", mathn(t, "MULTIPLY", s, 2 * math.pi / 0.16))
    stripe = mathn(t, "MULTIPLY", mathn(t, "ADD", st, 1.0), 0.5)
    base = mixc(t, mathn(t, "MULTIPLY", mathn(t, "GREATER_THAN", stripe, 0.55), 0.6), lin("#d5bd66"), lin("#b89a45"))
    mott = mixc(t, mathn(t, "MULTIPLY", noise(t, 1.6, 4, geo.outputs["Position"]), 0.35), base, lin("#bfa35a"))
    # a discoloured band under the ceiling and tide marks at the foot, both with a ragged edge
    ragged = mathn(t, "MULTIPLY", noise(t, 9.0, 3, geo.outputs["Position"]), 0.12)
    top = mathn(t, "GREATER_THAN", mathn(t, "ADD", sep.outputs[2], ragged), 2.42)
    foot = mathn(t, "LESS_THAN", mathn(t, "SUBTRACT", sep.outputs[2], ragged), 0.16)
    c = mixc(t, mathn(t, "MULTIPLY", top, 0.35), mott, lin("#9d8a4e"))
    c = mixc(t, mathn(t, "MULTIPLY", foot, 0.55), c, lin("#7d6a3c"))
    t.links.new(c, b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.85; b.inputs["Specular IOR Level"].default_value = 0.2
    return m
def flat(name, hexc, rough=0.8, emit=None, strength=0.0):
    m, t, b = node_mat(name); b.inputs["Base Color"].default_value = (*lin(hexc), 1); b.inputs["Roughness"].default_value = rough
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = strength
    return m
def carpet():
    m, t, b = node_mat("carpet"); geo = nn(t, "ShaderNodeNewGeometry")
    c = mixc(t, mathn(t, "MULTIPLY", noise(t, 22.0, 6, geo.outputs["Position"]), 0.6), lin("#8c763c"), lin("#6f5c2c"))
    stain = mathn(t, "GREATER_THAN", noise(t, 0.35, 2, geo.outputs["Position"]), 0.62)
    c = mixc(t, mathn(t, "MULTIPLY", stain, 0.35), c, lin("#5e4d25"))
    t.links.new(c, b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 1.0; b.inputs["Specular IOR Level"].default_value = 0.05
    return m
def ceiling():
    m, t, b = node_mat("ceiling"); geo = nn(t, "ShaderNodeNewGeometry"); sep = nn(t, "ShaderNodeSeparateXYZ"); t.links.new(geo.outputs["Position"], sep.inputs[0])
    def seam(axis):   # 1 on a 0.6 m grid line, 0 elsewhere
        fr = mathn(t, "FRACT", mathn(t, "DIVIDE", axis, 0.6)); d = mathn(t, "MINIMUM", fr, mathn(t, "SUBTRACT", 1.0, fr))
        return mathn(t, "LESS_THAN", d, 0.018)
    g = mathn(t, "MAXIMUM", seam(sep.outputs[0]), seam(sep.outputs[1]))
    snap = nn(t, "ShaderNodeVectorMath"); snap.operation = "SNAP"; snap.inputs[1].default_value = (0.6, 0.6, 10)
    t.links.new(geo.outputs["Position"], snap.inputs[0])
    wn = nn(t, "ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "3D"; t.links.new(snap.outputs[0], wn.inputs["Vector"])
    yellowed = mathn(t, "GREATER_THAN", wn.outputs["Value"], 0.93)
    c = mixc(t, mathn(t, "MULTIPLY", yellowed, 0.7), lin("#e6dfc6"), lin("#c9b77e"))
    c = mixc(t, mathn(t, "MULTIPLY", noise(t, 3.0, 4, geo.outputs["Position"]), 0.25), c, lin("#d4c9a6"))
    c = mixc(t, g, c, lin("#8f8466"))
    t.links.new(c, b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.95
    return m

M_WALL = wallpaper(); M_FLOOR = carpet(); M_CEIL = ceiling()
M_TRIM = flat("trim", "#4d3d26", 0.6)
M_PAPER = flat("paper", "#ece0bb", 0.9); M_INK = flat("ink", "#1d1a16", 0.7)
M_TVBODY = flat("tvbody", "#2b2824", 0.45); M_CART = flat("cart", "#3b3d3e", 0.5); M_BEZEL = flat("bezel", "#141312", 0.35)
M_SCREEN = flat("screen", "#0d0f12", 0.15, lin("#7f8aa0"), 1.6)
M_RED = flat("redlamp", "#ff1a0d", 0.3, (1.0, 0.03, 0.01), 160.0)
M_THING = flat("thing", "#050505", 1.0)
M_TAPE = flat("tape", "#d9d0a8", 0.6)

# ---------------- geometry helpers ----------------
H = 2.75
def box(name, x0, y0, z0, x1, y1, z1, mat):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector(((v.co.x + .5) * (x1 - x0) + x0, (v.co.y + .5) * (y1 - y0) + y0, (v.co.z + .5) * (z1 - z0) + z0))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    ob = bpy.data.objects.new(name, me); COL.objects.link(ob); return ob
def plane(name, cx, cy, cz, w, h, mat, facing):   # a vertical rectangle facing +y / -y / +x / -x, or "down"
    me = bpy.data.meshes.new(name); hw, hh = w / 2, h / 2
    if facing == "down": vs = [(-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0)]
    elif facing == "-y": vs = [(-hw, 0, -hh), (hw, 0, -hh), (hw, 0, hh), (-hw, 0, hh)]
    elif facing == "+y": vs = [(hw, 0, -hh), (-hw, 0, -hh), (-hw, 0, hh), (hw, 0, hh)]
    elif facing == "+x": vs = [(0, -hw, -hh), (0, hw, -hh), (0, hw, hh), (0, -hw, hh)]
    else: vs = [(0, hw, -hh), (0, -hw, -hh), (0, -hw, hh), (0, hw, hh)]
    me.from_pydata(vs, [], [(0, 1, 2, 3)]); me.materials.append(mat)
    ob = bpy.data.objects.new(name, me); ob.location = (cx, cy, cz); COL.objects.link(ob); return ob
WT = 0.12
def wall_x(x, y0, y1, gaps=()):      # a partition along y at x, with gaps [(a, b)]
    cuts = sorted(gaps); s = y0
    for a, b in cuts + [(y1, y1)]:
        if a > s + 0.01:
            box("wall", x - WT / 2, s, 0, x + WT / 2, a, H, M_WALL)
            box("trim", x - WT / 2 - .012, s, 0, x + WT / 2 + .012, a, .1, M_TRIM)
        s = b
def wall_y(y, x0, x1, gaps=()):
    cuts = sorted(gaps); s = x0
    for a, b in cuts + [(x1, x1)]:
        if a > s + 0.01:
            box("wall", s, y - WT / 2, 0, a, y + WT / 2, H, M_WALL)
            box("trim", s, y - WT / 2 - .012, 0, a, y + WT / 2 + .012, .1, M_TRIM)
        s = b
def pillar(x, y, s=0.5):
    box("pillar", x - s / 2, y - s / 2, 0, x + s / 2, y + s / 2, H, M_WALL); box("trim", x - s / 2 - .012, y - s / 2 - .012, 0, x + s / 2 + .012, y + s / 2 + .012, .1, M_TRIM)

# ---------------- the space ----------------
X0, X1, Y0, Y1 = -8.0, 19.0, -5.0, 30.0
box("floor", X0, Y0, -0.05, X1, Y1, 0, M_FLOOR); box("ceiling", X0, Y0, H, X1, Y1, H + 0.05, M_CEIL)
# corridor A (x -1.25..1.25) runs to a far wall at y 28; the room R opens off its right side through a wide doorway
wall_x(-1.25, Y0, 28, gaps=[(2.0, 3.2), (11.0, 12.6), (23.0, 24.4)])
wall_x(1.25, Y0, 28, gaps=[(5.6, 9.8), (15.2, 16.4), (24.0, 25.6)])
wall_y(28, -1.25, 1.25)
# room R: x 1.25..17, y 4..12.4; its far right part is the dead zone
wall_y(4.0, 1.25, 17.0, gaps=[(10.5, 11.6)]); wall_y(12.4, 1.25, 17.0, gaps=[(7.6, 8.8)]); wall_x(17.0, 4.0, 12.4)
pillar(9.0, 5.0); pillar(13.6, 5.0)
# emptiness behind the gaps: stubs and pillars on a grid, more partitions beyond
for (x, y) in ((-3.8, 1.0), (-3.8, 6.0), (-3.8, 13.0), (-6.4, 9.0), (-3.8, 19.0), (-3.8, 25.0), (4.0, 15.0), (8.0, 18.0), (4.0, 22.0), (11.0, 15.5)):
    pillar(x, y, 0.45)
wall_y(14.0, 1.25, 6.5); wall_x(6.5, 14.0, 20.0, gaps=[(16.5, 17.6)]); wall_y(20.0, 6.5, 12.0); wall_x(-6.0, -5.0, 8.0, gaps=[(2.0, 3.0)]); wall_y(-2.0, 1.25, 7.0)
wall_y(17.0, -6.0, -1.25, gaps=[(-4.2, -3.2)]); wall_x(-6.0, 17.0, 30.0)

# ---------------- light: a panel every 2.4 m, each an area light with no shadows ----------------
DEAD_ZONES = [((-3.0, 15.4), (3.0, 22.6)), ((8.9, 3.0), (17.5, 13.4))]   # (x0, y0), (x1, y1)
def in_dead(x, y): return any(a[0] <= x <= b[0] and a[1] <= y <= b[1] for a, b in DEAD_ZONES)
M_PANEL_ON = {}
PANELS = []
for i in range(int((X1 - X0) / 2.4) + 1):
    for j in range(int((Y1 - Y0) / 2.4) + 1):
        x = X0 + 1.2 + 2.4 * i; y = Y0 + 1.2 + 2.4 * j
        if x > X1 - .3 or y > Y1 - .3: continue
        dead = in_dead(x, y) or random.random() < 0.05
        flick = (not dead) and random.random() < 0.06
        tint = random.choice([(1.0, 0.95, 0.84), (1.0, 0.97, 0.88), (0.98, 0.98, 0.9), (0.96, 1.0, 0.86), (1.0, 0.93, 0.8)])
        key = "dead" if dead else "%.2f%.2f%.2f" % tint
        if key not in M_PANEL_ON:
            if dead: M_PANEL_ON[key] = flat("panel_dead", "#9a9584", 0.6)
            else: M_PANEL_ON[key] = flat("panel_" + key, "#ffffff", 0.4, tint, 4.5)
        mat = M_PANEL_ON[key]
        if flick: mat = flat("panel_flick", "#ffffff", 0.4, tint, 4.5)   # own material: its strength moves
        pn = plane("panel", x, y, H - .004, 0.6, 1.2, mat, "down")
        ld = bpy.data.lights.new("p", "AREA"); ld.shape = "RECTANGLE"; ld.size = 0.6; ld.size_y = 1.2; ld.color = tint
        ld.use_shadow = False; ld.use_custom_distance = True; ld.cutoff_distance = 3.9
        lo = bpy.data.objects.new("p", ld); lo.location = (x, y, H - .03); COL.objects.link(lo)
        base = 0.0 if dead else 42.0 * random.uniform(0.9, 1.08)
        ld.energy = base
        PANELS.append({"light": ld, "mat": mat if flick else None, "base": base, "flick": flick, "x": x, "y": y, "seed": random.random() * 100})

# ---------------- props ----------------
def notice(name, cx, y, cz, w, h, lines, facing="-y"):
    """A laser-printed sheet taped to a wall facing -y at (cx, y, cz). lines: [(text, size, dz, align)] from the top."""
    plane(name, cx, y, cz, w, h, M_PAPER, facing)
    for k, (tx, ty) in enumerate(((-w / 2 + .03, h / 2 - .01), (w / 2 - .03, h / 2 - .01))):
        tp = plane(name + "_tape", cx + tx, y - .0015, cz + ty, .07, .025, M_TAPE, facing); tp.rotation_euler = (0, math.radians(18 if k else -18), 0)
    fnt = bpy.data.fonts.load(FONT)
    for (txt, size, dz, align, xo) in lines:
        cu = bpy.data.curves.new(name + "_t", "FONT"); cu.body = txt; cu.font = fnt; cu.size = size; cu.align_x = align; cu.align_y = "TOP"
        ob = bpy.data.objects.new(name + "_t", cu); ob.data.materials.append(M_INK); COL.objects.link(ob)
        ob.rotation_euler = (math.radians(90), 0, 0)
        ax = {"LEFT": cx - w / 2 + .03, "CENTER": cx, "RIGHT": cx + w / 2 - .03}[align] + xo
        ob.location = (ax, y - .002, cz + h / 2 - dz)
    return
NUMB = B["number"]; VAL = str(NUMB.get("value", "")); LAB = str(NUMB.get("label", "")).upper()
NX, NY, NZ = 3.6, 12.4 - WT / 2 - .004, 1.42
notice("rules", NX, NY, NZ, 0.30, 0.42, [
    ("NOTICE TO ALL STAFF", .021, .03, "LEFT", 0), ("FORM %s-B   REV. 4" % VAL, .0115, .062, "LEFT", 0),
    (VAL, .135, .085, "CENTER", 0), (LAB, .042, .222, "CENTER", 0),
    ("1. Every frame on this tape is counted.", .0118, .285, "LEFT", 0),
    ("2. Do not film the same corridor twice.", .0118, .307, "LEFT", 0),
    ("3. If the lights go out, keep recording.", .0118, .329, "LEFT", 0),
    ("Thank you for your cooperation.", .0105, .368, "LEFT", 0), ("Management", .0105, .386, "LEFT", 0)])
# an ink rule under the header
box("rule", NX - .12, NY - .003, NZ + .21 - .074, NX + .12, NY - .0015, NZ + .21 - .071, M_INK)
# the same notice, small, in corridor A (repetition), and a second one in the far room
notice("repeat", -1.25 + WT / 2 + .004, 9.2, 1.45, 0.21, 0.29, [("NOTICE TO ALL STAFF", .015, .02, "LEFT", 0), (VAL, .09, .05, "CENTER", 0)], facing="+x")

# the AV cart and the CRT; the TV is a parent empty so it can be somewhere else later
def tv_rig(name):
    root = bpy.data.objects.new(name, None); COL.objects.link(root)
    parts = [box(name + "_body", -.36, -.28, 0, .36, .30, .56, M_TVBODY), box(name + "_bezel", -.33, -.30, .05, .33, -.27, .51, M_BEZEL),
             box(name + "_knobs", .24, -.305, .08, .3, -.29, .14, M_CART)]
    scr = plane(name + "_screen", 0, -.306, .28, .58, .435, M_SCREEN, "-y"); parts.append(scr)
    for p in parts: p.parent = root
    ld = bpy.data.lights.new(name + "_glow", "AREA"); ld.shape = "RECTANGLE"; ld.size = .58; ld.size_y = .435; ld.color = (.75, .82, 1.0)
    ld.energy = 14; ld.use_shadow = False; ld.use_custom_distance = True; ld.cutoff_distance = 6
    lo = bpy.data.objects.new(name + "_glow", ld); lo.parent = root; lo.location = (0, -.33, .28); lo.rotation_euler = (math.radians(-90), 0, 0); COL.objects.link(lo)
    return root, scr, ld
CART = (5.8, 11.75)
box("cart_top", CART[0] - .42, CART[1] - .32, .92, CART[0] + .42, CART[1] + .32, .95, M_CART); box("cart_shelf", CART[0] - .42, CART[1] - .32, .3, CART[0] + .42, CART[1] + .32, .33, M_CART)
for dx in (-.4, .4):
    for dy in (-.3, .3): box("cart_leg", CART[0] + dx - .015, CART[1] + dy - .015, .05, CART[0] + dx + .015, CART[1] + dy + .015, .95, M_CART)
TV, SCREEN, TVGLOW = tv_rig("tv")
TV_A = Vector((CART[0], CART[1], .95)); TV_A_ROT = math.radians(-14)      # on the cart, turned a little toward the doorway
TV_B = Vector((11.9, 10.7, 0.0)); TV_B_ROT = math.radians(-58)            # later: on the floor in the dark, facing the camera
# the red alarm lamp over the far room's dead zone: the one saturated colour
box("lamp_base", 11.75, 12.4 - WT / 2 - .06, 2.18, 12.05, 12.4 - WT / 2, 2.32, M_CART)
lamp = bpy.data.objects.new("lamp", bpy.data.meshes.new("lamp")); COL.objects.link(lamp)
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=.07); bm.to_mesh(lamp.data); bm.free()
lamp.data.materials.append(M_RED); lamp.location = (11.9, 12.4 - WT / 2 - .09, 2.25)
rl = bpy.data.lights.new("redl", "POINT"); rl.color = (1, .05, .02); rl.energy = 14; rl.shadow_soft_size = .1; rl.use_shadow = False
rlo = bpy.data.objects.new("redl", rl); rlo.location = (11.9, 12.1, 2.2); COL.objects.link(rlo)

# the thing that is almost human: a flat organic silhouette, small head, long neck, narrow high shoulders, long arms
def thing():
    cu = bpy.data.curves.new("thing", "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
    pts = [(0, 2.05), (.07, 2.02), (.085, 1.93), (.05, 1.85), (.035, 1.70), (.16, 1.60), (.19, 1.50), (.2, 1.2), (.22, .78), (.2, .62), (.15, .66),
           (.14, 1.05), (.12, 1.0), (.1, .6), (.11, 0), (.03, 0), (.02, .7), (-.02, .7), (-.03, 0), (-.11, 0), (-.1, .6), (-.12, 1.0), (-.14, 1.05),
           (-.15, .66), (-.2, .62), (-.22, .78), (-.2, 1.2), (-.19, 1.5), (-.16, 1.6), (-.035, 1.7), (-.05, 1.85), (-.085, 1.93), (-.07, 2.02)]
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts) - 1); sp.use_cyclic_u = True
    for p, (x, z) in zip(sp.bezier_points, pts): p.co = (x, z, 0); p.handle_left_type = p.handle_right_type = "AUTO"
    ob = bpy.data.objects.new("thing", cu); ob.data.materials.append(M_THING); COL.objects.link(ob)
    ob.rotation_euler = (math.radians(90), 0, 0); ob.scale = (1.0, 1.08, 1.0); return ob
THING = thing(); THING_AT = Vector((0.25, 19.6, 0.0))

# ---------------- world: dim, with fog that only nearby panels light ----------------
world = bpy.data.worlds.new("w"); sc.world = world; world.use_nodes = True; wt = world.node_tree
wt.nodes["Background"].inputs["Color"].default_value = (*lin("#1a160c"), 1); wt.nodes["Background"].inputs["Strength"].default_value = 0.02
vol = wt.nodes.new("ShaderNodeVolumePrincipled"); vol.inputs["Density"].default_value = 0.035; vol.inputs["Anisotropy"].default_value = 0.25
vol.inputs["Color"].default_value = (*lin("#e8dcb0"), 1)
wt.links.new(vol.outputs[0], wt.nodes["World Output"].inputs["Volume"])

# ---------------- the camera: one handheld take; the only cut is a tape tear ----------------
cam_d = bpy.data.cameras.new("cam"); cam_d.sensor_fit = "HORIZONTAL"; cam_d.sensor_width = 36; cam_d.clip_start = .03; cam_d.clip_end = 80
cam_d.dof.use_dof = True
cam = bpy.data.objects.new("cam", cam_d); COL.objects.link(cam); sc.camera = cam
EYE = 1.56
TEAR = tN                                          # the input to number cut is a tracking tear
BLACKOUTS = [(7.40, 0.10), (tC + 0.04, 0.12), (DUR - 0.62, 0.08)]   # (start, length): the lights drop out
HELD = (tE + 0.25, DUR - 0.35)                    # a held breath: the handheld noise freezes
FREEZE = DUR - 0.3                                 # the battery dies: the last frames hold

def head_toward(p, q): return math.degrees(math.atan2(q[0] - p[0], q[1] - p[1]))
TVA_SCREEN = TV_A + Vector((0, 0, .28)); TVB_SCREEN = TV_B + Vector((0, 0, .28))
P_TITLE0, P_TITLE1 = Vector((0.12, 1.9, EYE)), Vector((0.14, 2.3, EYE))
P_PIC1 = Vector((0.55, 5.35, EYE))
P_IN1 = Vector((3.25, 9.15, EYE - .04))
P_NUM0, P_NUM1 = Vector((NX, NY - .60, NZ)), Vector((NX, NY - .52, NZ))
P_LINE1 = Vector((3.3, 8.75, EYE))
H_PIC1 = head_toward(P_PIC1, (4.6, 12.0)); H_IN1 = head_toward(P_IN1, TVA_SCREEN); H_LINE1 = 32.0; H_CARRY = head_toward(P_LINE1, TVB_SCREEN)

def path(t):
    """position, heading (deg, + toward +x), pitch (deg), focal length (mm), focus distance (m), f-stop, walking (0..1), fear (0..1)"""
    if t < tP:
        u = sm(t / tP); p = P_TITLE0.lerp(P_TITLE1, u); h = 0.0; pit = -1.0; fl = 30.0
        fd = lerp(1.2, 9.0, sm((t - 0.35) / 0.5)) + 1.6 * math.sin(max(0, t - .85) * 9) * math.exp(-max(0, t - .85) * 5)   # power on: blur, hunt, lock
        return p, h, pit, fl, fd, 2.4, 0.15, 0.1
    if t < tI:
        u = (t - tP) / (tI - tP); p = P_TITLE1.lerp(P_PIC1, sm(u)); h = lerp(0, H_PIC1, sm((u - .38) / .62)); pit = -2.0; fl = 30.0
        far = (THING_AT - p).length; near_ = 7.2
        fd = lerp(far, near_, sm((u - .42) / .28)) + (1.5 * math.sin((u - .1) * 30) * math.exp(-(u - .1) * 9) if u > .1 else 0)
        return p, h, pit, fl, fd, 2.8, 1.0, 0.2
    if t < tN:
        u = (t - tI) / (tN - tI); p = P_PIC1.lerp(P_IN1, sm(u * 1.15)); h = lerp(H_PIC1, H_IN1, sm(u * 1.4))
        d = (TVA_SCREEN - p).length; pit = math.degrees(math.atan2(TVA_SCREEN.z - p.z, (TVA_SCREEN.xy - p.xy).length)) * sm(u * 1.4) - 2 * (1 - sm(u * 1.4))
        fl = lerp(30, 92, sm((u - .15) / .7))
        # zoom opens the aperture and the focus hunts: blur, lock, slip, lock
        hunt = 0.0
        if u > .25: hunt = d * (0.45 * math.exp(-(u - .25) * 7) * math.cos((u - .25) * 26))
        if .62 < u < .78: hunt += d * 0.28 * math.sin((u - .62) / .16 * math.pi)
        return p, h, pit, fl, d + hunt, 2.0, 1.0 - sm(u * 1.3), 0.3
    if t < tL:
        u = (t - tN) / (tL - tN); p = P_NUM0.lerp(P_NUM1, sm(u)); d = abs(NY - p.y)
        return p, 0.0, 0.0, 30.0, d + 0.1 * math.exp(-u * 6) * math.cos(u * 30), 4.0, 0.0, 0.35
    if t < tC:
        u = (t - tL) / (tC - tL); p = P_NUM1.lerp(P_LINE1, sm(u)); h = lerp(0, H_LINE1, sm((u - .2) / .8))
        pit = lerp(0, -3, sm(u)); fd = lerp(.55, 4.2, sm((u - .1) / .6))
        return p, h, pit, 30.0, fd, 2.8, 0.55, 0.5
    # carry and end: whip right toward a sound, settle, zoom into the dark: the TV is there now
    u = t - tC; p = P_LINE1.copy(); d = (TVB_SCREEN - p).length
    h = lerp(H_LINE1, H_CARRY, sm(u / .38)) + 4 * math.sin(min(1, u / .38) * math.pi) * (1 if u < .38 else 0)
    pit = math.degrees(math.atan2(TVB_SCREEN.z - p.z, (TVB_SCREEN.xy - p.xy).length)) * sm(u / .5) - 3 * (1 - sm(u / .5))
    fl = lerp(30, 70, sm((u - .45) / .7)) + lerp(0, 22, sm((t - tE) / (DUR - tE)))
    hunt = 0.0
    if u > .45: hunt = d * 0.5 * math.exp(-(u - .45) * 4) * math.cos((u - .45) * 17)
    if tE + .5 < t < tE + .8: hunt += d * .22 * math.sin((t - tE - .5) / .3 * math.pi)
    fd = lerp(3.5, d, sm((u - .4) / .3)) + hunt
    return p, h, pit, fl, fd, 2.0, 0.0, lerp(.6, 1.0, sm(u / 1.2))

def noise1(t, seed, freqs):
    return sum(math.sin(t * f * 2 * math.pi + seed * (k + 1) * 1.7) / (k + 1) for k, f in enumerate(freqs)) / 1.6
WALK_T = [0.0]
def handheld(t, walk, fear):
    hold = 1.0
    if HELD[0] < t < HELD[1]: hold = 1 - sm((t - HELD[0]) / .25) * (1 - sm((t - (HELD[1] - .2)) / .2))
    step = 1.85 * 2 * math.pi * t
    bob = walk * .028 * abs(math.sin(step / 2)); sway = walk * .018 * math.sin(step / 2); wroll = walk * 0.9 * math.sin(step / 2)
    breath = .006 * math.sin(2 * math.pi * .27 * t)
    a = (.25 + .9 * fear) * hold
    dyaw = a * .55 * noise1(t, 1.3, (.6, 1.7, 4.3)); dpit = a * .45 * noise1(t, 2.9, (.5, 1.3, 3.7)) + walk * .5 * math.sin(step)
    droll = wroll + a * .6 * noise1(t, 4.1, (.4, 1.1, 2.9))
    return Vector((sway * hold, 0, (bob + breath) * hold)), dyaw, dpit, droll

def blackout(t):
    for s, l in BLACKOUTS:
        if s <= t < s + l: return 0.04
        if s + l <= t < s + l + .05: return 0.5
    return 1.0

def tv_place(t):
    if t < tN + 0.3: TV.location = TV_A; TV.rotation_euler = (0, 0, TV_A_ROT); return "A"
    if t < tC + 0.04: TV.location = Vector((0, 0, -50)); return None          # gone: the cart is empty when the camera looks back
    TV.location = TV_B; TV.rotation_euler = (0, 0, TV_B_ROT); return "B"   # back after the blackout, on the floor in the dark

def apply(t):
    tt = min(t, FREEZE)
    p, h, pit, fl, fd, fs, walk, fear = path(tt)
    off, dyaw, dpit, droll = handheld(tt, walk, fear)
    hr = math.radians(h + dyaw); right = Vector((math.cos(hr), -math.sin(hr), 0))
    cam.location = p + right * off.x + Vector((0, 0, off.z))
    cam.rotation_euler = (math.radians(90 + pit + dpit), math.radians(droll), -hr)
    cam_d.lens = fl; cam_d.dof.focus_distance = max(.12, fd); cam_d.dof.aperture_fstop = fs
    k = blackout(tt)
    for P_ in PANELS:
        if P_["base"] <= 0: continue
        e = P_["base"] * k
        if P_["flick"]:
            ph = math.sin(tt * 23 + P_["seed"]) + math.sin(tt * 7.1 + P_["seed"] * 2)
            if ph > 1.35: e *= 0.08
        P_["light"].energy = e
        if P_["mat"] is not None: P_["mat"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 4.5 * e / max(1e-3, P_["base"])
    for m in M_PANEL_ON.values():
        if m.name.startswith("panel_dead"): continue
        m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 4.5 * k
    which = tv_place(tt)
    TVGLOW.energy = 14 if which == "A" else (22 if which == "B" else 0)
    # the thing stands at the corridor's end only while the camera is looking for it in the picture beat
    THING.location = THING_AT if (tP + .1 < tt < tP + 1.05) else Vector((0, 0, -50))
    return {"fl": fl, "fd": fd, "fs": fs, "which": which}

# ---------------- the track for After Effects ----------------
os.makedirs(OUT, exist_ok=True)
def px(co):
    v = world_to_camera_view(sc, cam, co); return [round(v.x * OW, 2), round((1 - v.y) * OH, 2)], v.z
sw, sh = .58 / 2, .435 / 2
corners = [Vector((-sw, -.306, .28 + sh)), Vector((sw, -.306, .28 + sh)), Vector((-sw, -.306, .28 - sh)), Vector((sw, -.306, .28 - sh))]
data = {"fps": FPS, "w": OW, "h": OH, "render": list(RES), "frames": NF, "screen": [], "screenOn": [], "screenBlur": [], "screenFog": [],
        "lineWords": [w["s"] for w in WORDS if tL - .02 <= w["s"] < tC - .02], "blackouts": BLACKOUTS, "tear": TEAR, "freeze": FREEZE, "held": list(HELD), "cuts": [tP, tI, tN, tL, tC, tE]}
for f in range(1, NF + 1):
    t_ = tf(f); st = apply(t_); bpy.context.view_layer.update()
    mw = TV.matrix_world; cs = []; zs = []
    for c in corners:
        q, z = px(mw @ c); cs.append(q); zs.append(z)
    on = st["which"] is not None and min(zs) > .05 and any(-200 < q[0] < OW + 200 and -200 < q[1] < OH + 200 for q in cs)
    # the screen's blur: the circle of confusion of its centre, in comp pixels (After Effects blurs the pinned clip to match)
    S1 = st["fd"] * 1000; S2 = max(.1, sum(zs) / 4) * 1000; fl = st["fl"]
    coc = (fl * fl / (st["fs"] * max(1, S1 - fl))) * abs(S2 - S1) / S2
    data["screen"].append(cs); data["screenOn"].append(1 if on else 0)
    data["screenBlur"].append(round(min(60, coc / 36 * OW), 2)); data["screenFog"].append(round(math.exp(-0.045 * sum(zs) / 4), 3))
json.dump(data, open(os.path.join(OUT, "data.json"), "w"))
print("TRACK DONE", NF, "frames")

# ---------------- render ----------------
if "still" in OPT: frames = [int(x) for x in OPT["still"].split(",")]
elif "frames" in OPT: a_, b_ = OPT["frames"].split("-"); frames = list(range(int(a_), int(b_) + 1))
else: frames = list(range(1, NF + 1))
for f in frames:
    p_ = os.path.join(OUT, "f_%04d.png" % f)
    if "still" not in OPT and os.path.exists(p_) and os.path.getsize(p_) > 5000: continue
    apply(tf(f)); sc.render.filepath = p_; bpy.ops.render.render(write_still=True)
print("ROOMS DONE", len(frames))
