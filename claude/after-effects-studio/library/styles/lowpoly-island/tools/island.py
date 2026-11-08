# Low-poly isometric island: the whole shared scene as one Blender world, rendered as one plate.
# usage:
#   Blender -b --factory-startup --python island.py -- <scene.json> <out_dir> [frames=a-b] [res=WxH] [samples=N] [still=f,f,...] [font=<ttf>]
# Writes <out_dir>/plate/island_NNNN.png (RGBA: the far sea fades to alpha so After Effects draws the sky behind it) and
# <out_dir>/track.json (per frame, in pixels: the screen's four corners, the lamp and the beam tip, the tile icon colour).
# Hex columns, primitive props, flat shading, no textures. Time of day is a set of keyed colours. One orthographic camera whose
# keys jump at the cuts. The screen on the centre tile is a holdout: After Effects pins the real clip under the plate there.
import bpy, bmesh, math, json, os, sys, random
from mathutils import Vector, Matrix, Euler
from bpy_extras.object_utils import world_to_camera_view

A = sys.argv[sys.argv.index("--") + 1:]
SCENE_PATH, OUT = os.path.abspath(A[0]), os.path.abspath(A[1])
OPT = dict(x.split("=", 1) for x in A[2:] if "=" in x)
SC_JSON = json.load(open(SCENE_PATH))
WORDS = json.load(open(os.path.join(os.path.dirname(SCENE_PATH), SC_JSON.get("words", "words.json"))))
B = {b["id"]: b for b in SC_JSON["beats"]}
FPS = SC_JSON["fps"]; DUR = SC_JSON["duration"]; NF = int(math.ceil(DUR * FPS))
tT, tP, tI, tN, tL, tC, tE = (B[k]["t0"] for k in ("title", "picture", "input", "number", "line", "carry", "end"))
RES = tuple(int(v) for v in OPT["res"].split("x")) if "res" in OPT else (SC_JSON["width"], SC_JSON["height"])
HERE = os.path.dirname(os.path.abspath(__file__))
FONT = OPT.get("font", os.path.join(HERE, "..", "assets", "fonts", "Fredoka[wdth,wght].ttf"))
random.seed(7)

def tf(f): return (f - 1) / FPS          # frame -> seconds (frame 1 is t = 0)

# ---------------- palette (sRGB hex) ----------------
def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)
P = {"sand": "#F2DDB0", "sandSide": "#C9A97E", "grass": "#93CC7A", "grassSide": "#6E8F5E", "hill": "#7DBA6E",
     "rock": "#C3BCD2", "rockSide": "#958DA8", "wall": "#F7EFE4", "wall2": "#F3D9C6", "wall3": "#DDE8EE",
     "coral": "#E8826B", "teal": "#5FAFAE", "plum": "#8E6FA8", "roofRed": "#D9614E", "pine": "#4F9A6A", "leaf": "#7CC36A",
     "trunk": "#9A6B4E", "stone": "#D8D2E0", "white": "#FBF7F0", "red": "#D9524A", "navy": "#2E3560", "plank": "#B98A63",
     "skin": "#F1B998", "shirt": "#E8826B", "paper": "#FBF7F0", "ink": "#7A86A8", "phone": "#3A4170", "glass": "#5B6E8C"}

# time of day: keyed colours (sun, ambient, sea), interpolated by time
def tod_keys():
    return [  # t, sunColor, sunEnergy, sunElev, sunAz, ambient, ambStrength, deep, shallow
        (0.0,        "#FFF6E6", 3.4, 52, 140, "#BFD9F2", 0.85, "#4E9FC4", "#8FDCD4"),
        (tL - 0.6,   "#FFE6C8", 3.1, 40, 150, "#C9D6EE", 0.80, "#4C97BE", "#8AD4CC"),
        (tL + 0.45,  "#FFB27A", 2.3, 14, 170, "#B7A6D6", 0.70, "#4A6FA6", "#6FA6B8"),
        (tC - 0.05,  "#A9A6F0", 1.15, 32, 200, "#5A5EAE", 0.62, "#232A5E", "#3A4A80"),
        (DUR + 1,    "#A9A6F0", 1.05, 32, 200, "#5559A8", 0.60, "#20285A", "#36467C")]

def tod(t):
    K = tod_keys()
    for i in range(len(K) - 1):
        a, b = K[i], K[i + 1]
        if a[0] <= t <= b[0]:
            u = (t - a[0]) / (b[0] - a[0]); u = u * u * (3 - 2 * u)
            out = []
            for j in range(1, len(a)):
                if isinstance(a[j], str):
                    ca, cb = lin(a[j]), lin(b[j]); out.append(tuple(ca[k] + (cb[k] - ca[k]) * u for k in range(3)))
                else:
                    out.append(a[j] + (b[j] - a[j]) * u)
            return out
    return tod(K[-1][0] - 1e-6)

# ---------------- arrival curves ----------------
def rise(s, T=0.32, A=0.14, lam=7.0, w=16.0):     # 0 -> 1: cubic ease up, then a damped-sine overshoot
    if s <= 0: return 0.0
    if s < T: u = s / T; return (1 - (1 - u) ** 3) * (1 + A)
    return 1 + A * math.exp(-lam * (s - T)) * math.cos(w * (s - T))

def pop(s, k=8.0, w=18.0):                         # scale 1 - e^(-ks) cos(ws): about 25 % overshoot
    if s <= 0: return 0.0
    return 1 - math.exp(-k * s) * math.cos(w * s)

def drop(s, h=2.4, T=0.26):                        # height above rest and squash (z scale) for drop-and-stack
    if s <= 0: return h, 1.0
    if s < T: u = s / T; return h * (1 - u * u), 1.0 + 0.18 * u * u   # fall, stretching
    v = s - T
    return 0.16 * math.exp(-7 * v) * abs(math.sin(13 * v)), 1 - 0.24 * math.exp(-9 * v) * math.cos(19 * v)

# ---------------- scene ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
for a_, v_ in (("taa_render_samples", int(OPT.get("samples", 32))), ("use_raytracing", True), ("use_shadows", True),
               ("use_gtao", True), ("gtao_distance", 0.6), ("shadow_ray_count", 2), ("shadow_step_count", 8)):
    try: setattr(sc.eevee, a_, v_)
    except Exception: pass
try:
    sc.eevee.ray_tracing_options.resolution_scale = "2"
    sc.eevee.horizon_quality = 0.8; sc.eevee.fast_gi_distance = 0.8
except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.resolution_percentage = 100
sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, NF
sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
sc.render.image_settings.compression = 15
try: sc.view_settings.view_transform = "Khronos PBR Neutral"
except Exception: sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"

world = bpy.data.worlds.new("sky"); sc.world = world; world.use_nodes = True
BG = world.node_tree.nodes["Background"]

def node(tree, kind, **inputs):
    n = tree.nodes.new(kind)
    for k, v in inputs.items(): n.inputs[k].default_value = v
    return n

def flat_mat():                                    # base colour from the object's colour (one material for every solid piece)
    m = bpy.data.materials.new("flat"); m.use_nodes = True; t = m.node_tree
    b = t.nodes["Principled BSDF"]; b.inputs["Roughness"].default_value = 0.9; b.inputs["Specular IOR Level"].default_value = 0.25
    oi = t.nodes.new("ShaderNodeObjectInfo"); t.links.new(oi.outputs["Color"], b.inputs["Base Color"]); return m
MFLAT = flat_mat()

def glow_mat(name, glass, on):                     # emissive part: glass in the day, its own warm light when obj.color alpha rises
    m = bpy.data.materials.new(name); m.use_nodes = True; t = m.node_tree
    b = t.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*lin(glass), 1); b.inputs["Roughness"].default_value = 0.45
    oi = t.nodes.new("ShaderNodeObjectInfo")
    b.inputs["Emission Color"].default_value = (*lin(on), 1)
    mul = t.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 7.0
    t.links.new(oi.outputs["Alpha"], mul.inputs[0]); t.links.new(mul.outputs[0], b.inputs["Emission Strength"]); return m
MWIN = glow_mat("window", "#56688A", "#FFC27A")
MSCREENGLOW = glow_mat("devscreen", "#9FD8E6", "#BFF3FF")

MHOLD = bpy.data.materials.new("screen_holdout"); MHOLD.use_nodes = True
_t = MHOLD.node_tree; _t.nodes.remove(_t.nodes["Principled BSDF"]); _h = _t.nodes.new("ShaderNodeHoldout")
_t.links.new(_h.outputs[0], _t.nodes["Material Output"].inputs["Surface"])

MRING = bpy.data.materials.new("splash"); MRING.use_nodes = True; MRING.surface_render_method = "BLENDED"
_t = MRING.node_tree; _t.nodes.remove(_t.nodes["Principled BSDF"])
_oi = _t.nodes.new("ShaderNodeObjectInfo"); _em = node(_t, "ShaderNodeEmission", Strength=1.2); _em.inputs["Color"].default_value = (0.95, 0.98, 1, 1)
_tr = _t.nodes.new("ShaderNodeBsdfTransparent"); _mx = _t.nodes.new("ShaderNodeMixShader")
_t.links.new(_oi.outputs["Alpha"], _mx.inputs[0]); _t.links.new(_tr.outputs[0], _mx.inputs[1]); _t.links.new(_em.outputs[0], _mx.inputs[2])
_t.links.new(_mx.outputs[0], _t.nodes["Material Output"].inputs["Surface"])

# ---------------- meshes ----------------
MESH = {}
def mesh_prism(key, n, r0, r1, h, rot=0.0):        # n-gon column, bottom at z=0, top at z=h, flat shaded
    if key in MESH: return MESH[key]
    bm = bmesh.new()
    bot = [bm.verts.new((r0 * math.cos(rot + 2 * math.pi * i / n), r0 * math.sin(rot + 2 * math.pi * i / n), 0)) for i in range(n)]
    if r1 > 0:
        top = [bm.verts.new((r1 * math.cos(rot + 2 * math.pi * i / n), r1 * math.sin(rot + 2 * math.pi * i / n), h)) for i in range(n)]
        bm.faces.new(top)
        for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
    else:
        apex = bm.verts.new((0, 0, h))
        for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], apex))
    bm.faces.new(list(reversed(bot)))
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    MESH[key] = me; return me

def mesh_box(key="box"):                           # unit cube, bottom at z=0, centred in x and y
    if key in MESH: return MESH[key]
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bmesh.ops.translate(bm, verts=bm.verts, vec=(0, 0, 0.5))
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free(); MESH[key] = me; return me

def mesh_ico(key="ico"):
    if key in MESH: return MESH[key]
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    MESH[key] = me; return me

def mesh_gable(key="gable"):                       # triangular prism roof, 1 x 1 footprint, ridge along x, height 1
    if key in MESH: return MESH[key]
    bm = bmesh.new(); v = [bm.verts.new(p) for p in ((-.5, -.5, 0), (.5, -.5, 0), (.5, .5, 0), (-.5, .5, 0), (-.5, 0, 1), (.5, 0, 1))]
    for f in ((0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)): bm.faces.new([v[i] for i in f])
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free(); MESH[key] = me; return me

def mesh_ring(key="ring"):                         # flat hexagonal ring for surf and splashes, radius 1
    if key in MESH: return MESH[key]
    bm = bmesh.new(); n = 12; o = [bm.verts.new((math.cos(2 * math.pi * i / n), math.sin(2 * math.pi * i / n), 0)) for i in range(n)]
    i_ = [bm.verts.new((.86 * math.cos(2 * math.pi * i / n), .86 * math.sin(2 * math.pi * i / n), 0)) for i in range(n)]
    for i in range(n): bm.faces.new((o[i], o[(i + 1) % n], i_[(i + 1) % n], i_[i]))
    me = bpy.data.meshes.new(key); bm.to_mesh(me); bm.free(); MESH[key] = me; return me

def ob(name, me, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), col="#FFFFFF", parent=None, mat=None, jitter=0.0):
    o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    o.location = loc; o.scale = scale; o.rotation_euler = rot
    c = lin(col) if isinstance(col, str) else col
    j = 1 + random.uniform(-jitter, jitter); o.color = (min(1, c[0] * j), min(1, c[1] * j), min(1, c[2] * j), 1)
    if not o.data.materials: o.data.materials.append(mat or MFLAT)
    elif mat: o.material_slots[0].link = "OBJECT"; o.material_slots[0].material = mat
    if parent: o.parent = parent
    return o

def empty(name, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None); sc.collection.objects.link(e); e.location = loc; e.rotation_euler = rot
    if parent: e.parent = parent
    return e

# keys: fn(t) -> value for every frame in [f0, f1]; values outside hold (constant extrapolation)
def keyf(o, path, fn, t0, t1, index=-1):
    f0 = max(1, int(math.floor(t0 * FPS)) + 1); f1 = min(NF, int(math.ceil(t1 * FPS)) + 1)
    for f in range(f0, f1 + 1):
        v = fn(tf(f))
        if index >= 0: getattr(o, path)[index] = v
        else: setattr(o, path, v)
        o.keyframe_insert(path, index=index, frame=f)

# ---------------- hex grid ----------------
R = 1.0; GAP = 0.94; DEPTH = 3.0
def axial(q, r, c=(0, 0)): return (c[0] + R * math.sqrt(3) * (q + r / 2), c[1] + R * 1.5 * r)
def ring(k):
    if k == 0: return [(0, 0)]
    dirs = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]; out = []; q, r = -k, k   # start at direction 4 * k
    q, r = dirs[4][0] * k, dirs[4][1] * k
    for d in range(6):
        for _ in range(k):
            out.append((q, r)); q += dirs[d][0]; r += dirs[d][1]
    return out

TILES = []                                         # (empty, top height, x, y, kind)
def tile(name, x, y, top, kind, t_rise, splash=True, sink=None):
    top_c, side_c = {"sand": ("sand", "sandSide"), "grass": ("grass", "grassSide"), "hill": ("hill", "grassSide"), "rock": ("rock", "rockSide")}[kind]
    e = empty(name, (x, y, 0))
    ob(name + "_side", mesh_prism("hexside", 6, R * GAP, R * GAP, 1.0, math.pi / 6), (0, 0, -DEPTH), (1, 1, top - 0.03 + DEPTH), col=P[side_c], parent=e, jitter=.03)
    ob(name + "_cap", mesh_prism("hexcap", 6, R * GAP, R * GAP * .97, 1.0, math.pi / 6), (0, 0, top - 0.11), (1, 1, 0.11), col=P[top_c], parent=e, jitter=.045)
    depth = top + 0.5
    if t_rise is None or t_rise <= -0.5: e.location.z = 0
    else:
        keyf(e, "location", lambda t: -depth + depth * rise(t - t_rise), t_rise - 0.05, t_rise + 1.0, 2)
        if splash: splash_ring(name, x, y, t_rise + 0.12, 1.0)
    TILES.append((e, top, x, y, kind))
    return e

def splash_ring(name, x, y, t0, size):
    o = ob(name + "_splash", mesh_ring(), (x, y, 0.03), (size, size, 1), col=(1, 1, 1), mat=MRING); o.color[3] = 0
    o.visible_shadow = False
    def sz(t): s = max(0.0, t - t0); g = size * (0.75 + 0.9 * (1 - math.exp(-4 * s))); return g
    keyf(o, "scale", lambda t: sz(t), t0 - 0.05, t0 + 0.8, 0); keyf(o, "scale", lambda t: sz(t), t0 - 0.05, t0 + 0.8, 1)
    keyf(o, "color", lambda t: 0.0 if t < t0 else 0.85 * math.exp(-4.5 * (t - t0)), t0 - 0.05, t0 + 0.8, 3)

def surf(x, y, t_rise=None, size=1.03):            # a thin translucent ring at a tile's water line, once the tile is up
    o = ob("surf", mesh_ring(), (x, y, 0.02), (size, size, 1), rot=(0, 0, math.pi / 6), col=(1, 1, 1), mat=MRING); o.color[3] = 0.28
    o.visible_shadow = False
    if t_rise is not None and t_rise > -0.5: keyf(o, "color", lambda t: 0.0 if t < t_rise + 0.2 else min(0.28, (t - t_rise - 0.2) * 1.2), t_rise, t_rise + 0.5, 3)
    return o

# ---------------- props (each grows from its own arrival time) ----------------
def popper(name, x, y, z, t0, rot=0.0):           # an empty that pops (scale) at t0
    e = empty(name, (x, y, z), (0, 0, rot))
    keyf(e, "scale", lambda t: (lambda s: (s, s, s))(max(0.0, pop(t - t0))), t0 - 0.05, t0 + 0.9)
    return e

def dropper(name, x, y, z, t0, rot=0.0, h=2.4):   # an empty that falls, bounces and squashes, landing at t0 + 0.26
    e = empty(name, (x, y, z), (0, 0, rot))
    def loc(t): d, s = drop(t - t0, h); return d
    def scl(t):
        if t < t0: return (0.0, 0.0, 0.0)          # not there yet (scale reaches the children; hide_render does not)
        d, s = drop(t - t0, h); xy = 1 / math.sqrt(max(.4, s)); return (xy, xy, s)
    keyf(e, "location", lambda t: z + loc(t), t0 - 0.05, t0 + 1.0, 2)
    keyf(e, "scale", scl, t0 - 0.05, t0 + 1.0)
    return e

def house(name, x, y, z, t0, walls, roof, rot, w=0.95, d=0.75, h=0.62, word_t=None):
    e = dropper(name, x, y, z, t0, rot)
    ob(name + "_w", mesh_box(), (0, 0, 0), (w, d, h), col=P[walls], parent=e, jitter=.02)
    r = dropper(name + "_roofE", 0, 0, h, t0 + 0.12, 0, 1.6); r.parent = e
    ob(name + "_r", mesh_gable(), (0, 0, 0), (w * 1.12, d * 1.18, 0.42), col=P[roof], parent=r, jitter=.03)
    ob(name + "_ch", mesh_box(), (w * .28, d * .2, 0.18), (0.12, 0.12, 0.3), col=P[walls], parent=r)
    wins = []                                      # windows on the two faces the camera sees (+y local and +x local)
    for i, wx in enumerate((-w * .25, w * .25)):
        o = ob(name + "_win%d" % i, mesh_box("winbox"), (wx, d / 2 + 0.005, h * .38), (0.17, 0.03, 0.19), col=(1, .76, .45), mat=MWIN, parent=e)
        o.color[3] = 0; wins.append(o)
    o = ob(name + "_winS", mesh_box("winbox"), (w / 2 + 0.005, 0, h * .38), (0.03, 0.17, 0.19), col=(1, .76, .45), mat=MWIN, parent=e); o.color[3] = 0; wins.append(o)
    ob(name + "_door", mesh_box(), (0, -d / 2 - 0.005, 0), (0.16, 0.03, 0.3), col=P["trunk"], parent=e)
    if word_t is not None:
        for k, o in enumerate(wins): light(o, word_t + 0.04 * k)
    return e

def light(o, t0, level=1.0):                       # an emissive part switching on with a flicker
    def a(t):
        s = t - t0
        if s < 0: return 0.0
        return level * min(1.0, 0.25 + s * 9) * (0.85 if 0.05 < s < 0.09 else 1.0)
    keyf(o, "color", a, t0 - 0.05, t0 + 0.2, 3)

def pine(name, x, y, z, t0, s=1.0):
    e = popper(name, x, y, z, t0, random.uniform(0, 3))
    ob(name + "_tr", mesh_prism("trunk6", 6, .07, .06, .18), (0, 0, 0), (s, s, s), col=P["trunk"], parent=e)
    ob(name + "_c1", mesh_prism("cone6", 6, .34, 0, .5), (0, 0, .14 * s), (s, s, s), col=P["pine"], parent=e, jitter=.06)
    ob(name + "_c2", mesh_prism("cone6", 6, .34, 0, .5), (0, 0, .36 * s), (.75 * s, .75 * s, .8 * s), col=P["pine"], parent=e, jitter=.06)
    return e

def roundtree(name, x, y, z, t0, s=1.0):
    e = popper(name, x, y, z, t0, random.uniform(0, 3))
    ob(name + "_tr", mesh_prism("trunk6", 6, .07, .06, .18), (0, 0, 0), (s, s, 1.4 * s), col=P["trunk"], parent=e)
    ob(name + "_l", mesh_ico(), (0, 0, .42 * s), (.28 * s, .28 * s, .26 * s), col=P["leaf"], parent=e, jitter=.06)
    return e

def lamppost(name, x, y, z, t0, t_on):
    e = popper(name, x, y, z, t0)
    ob(name + "_p", mesh_prism("post", 6, .03, .03, .5), (0, 0, 0), col=P["navy"], parent=e)
    l = ob(name + "_l", mesh_box("lampbox"), (0, 0, .5), (.09, .09, .1), col=(1, .78, .5), mat=MWIN, parent=e); l.color[3] = 0
    light(l, t_on, 1.4); return e

def windmill(name, x, y, z, t0, rot):
    e = popper(name, x, y, z, t0, rot)
    ob(name + "_t", mesh_prism("mill8", 8, .26, .18, .85), (0, 0, 0), col=P["white"], parent=e)
    ob(name + "_cap", mesh_prism("millcap", 8, .22, 0, .25), (0, 0, .85), col=P["roofRed"], parent=e)
    hub = empty(name + "_hub", (0, .24, .8), parent=e)
    keyf(hub, "rotation_euler", lambda t: t * 2.4, 0, DUR, 1)
    for k in range(4):
        b = empty(name + "_b%d" % k, (0, 0, 0), (0, k * math.pi / 2, 0), parent=hub)
        ob(name + "_bl%d" % k, mesh_box(), (0.0, .0, .04), (.09, .02, .48), col=P["plank"], parent=b)
    return e

# ---------------- the island ----------------
CEN = (0.0, 0.0)
SKIP3 = {2, 9}                                     # two outer tiles missing keep the coast irregular
rise_t = {}
inner = ring(0) + ring(1)
for (q, r) in inner: rise_t[(q, r)] = -1.0       # mid-construction: the centre is already up
r2, r3 = ring(2), ring(3)
for i, qr in enumerate(r2): rise_t[qr] = 0.02 + 0.05 * i
for i, qr in enumerate(r3):
    if i in SKIP3: continue
    rise_t[qr] = 0.30 + 0.048 * i
extra = [((2, 2), 1.15), ((-3, 4), 1.2), ((4, -1), 1.25)]
for qr, t in extra: rise_t[qr] = t
for (q, r), t in rise_t.items():
    x, y = axial(q, r, CEN); k = max(abs(q), abs(r), abs(-q - r))
    if k == 0: kind, top = "rock", 1.0
    elif k == 1: kind, top = "hill", 0.72
    elif k == 2: kind, top = "grass", 0.5
    else: kind, top = "sand", 0.3 + 0.05 * random.random()
    if k == 2 and (q, r) in ((2, 0), (-2, 2)): kind, top = "sand", 0.34
    tile("T%d_%d" % (q, r), x, y, top, kind, t if t > -0.5 else None)
    if k >= 3: surf(x, y, t)

def top_at(q, r):
    k = max(abs(q), abs(r), abs(-q - r))
    for (e, top, x, y, kind) in TILES:
        if e.name == "T%d_%d" % (q, r): return x, y, top
    return None

# houses: one house lights per spoken word of the line beat (six words, six houses)
line_words = [w for w in WORDS if tL - 0.05 <= w["s"] < tC - 0.05]
word_times = [w["s"] for w in line_words] or [tL + 0.2 * i for i in range(6)]
HOUSES = [((2, -1), "wall", "coral", 0.3), ((0, 2), "wall2", "teal", 1.2), ((-2, 1), "wall3", "roofRed", -0.4),
          ((1, -2), "wall", "plum", 0.9), ((-1, -1), "wall2", "coral", 0.2), ((1, 1), "wall3", "roofRed", -0.6)]
for i, ((q, r), wc, rc, rot) in enumerate(HOUSES):
    x, y, top = top_at(q, r)
    wt = word_times[i % len(word_times)] if i < len(word_times) else word_times[-1] + 0.08 * i
    house("H%d" % i, x, y, top, 0.55 + 0.11 * i, wc, rc, rot, word_t=wt)
TREES = [((-1, 0), "pine"), ((0, -1), "round"), ((1, 0), "pine"), ((-1, 2), "pine"), ((2, -2), "round"), ((0, -2), "pine"),
         ((-2, 0), "round"), ((-2, 2), "pine"), ((2, 0), "round")]
for i, ((q, r), kind) in enumerate(TREES):
    x, y, top = top_at(q, r); f = pine if kind == "pine" else roundtree
    f("Tr%d" % i, x + random.uniform(-.2, .2), y + random.uniform(-.2, .2), top, 0.85 + 0.07 * i, 1.0)
    if kind == "pine": f("Tr%db" % i, x + .35, y - .3, top, 0.9 + 0.07 * i, 0.7)
mx, my, mt = top_at(-1, 1); windmill("Mill", mx, my, mt, 1.0, 0.4)
lamp_times = [tC + 0.05 + 0.1 * i for i in range(5)]
for i, (q, r) in enumerate([(3, -1), (1, 2), (-2, 3), (3, -3), (-3, 2)]):
    v = top_at(q, r)
    if v: lamppost("L%d" % i, v[0] + .3, v[1] + .2, v[2], 1.1 + 0.04 * i, lamp_times[i])
# a dock and a little boat bobbing with the water
dx, dy, dtop = top_at(-3, 4) or (0, 6, .3)
for k in range(4):
    ob("dock%d" % k, mesh_box(), (dx - 0.62 - 0.42 * k, dy + 0.62 + 0.42 * k * .3, 0.12), (0.4, 0.5, 0.06), rot=(0, 0, -0.3), col=P["plank"], jitter=.06)
    ob("dockp%d" % k, mesh_prism("pile", 6, .04, .04, .9), (dx - 0.62 - 0.42 * k, dy + 0.85 + 0.42 * k * .3, -0.8), col=P["trunk"])
boat = empty("boat", (dx - 2.4, dy + 2.0, 0.0), (0, 0, 0.5))
ob("hull", mesh_prism("hull", 6, .32, .22, .2), (0, 0, -.05), (1.6, .7, 1), col=P["red"], parent=boat)
ob("mast", mesh_prism("post", 6, .03, .03, .5), (0, 0, .1), (1, 1, 1.4), col=P["plank"], parent=boat)
ob("sail", mesh_prism("sail", 3, .3, 0, .6), (.05, 0, .2), (1, .1, 1), col=P["white"], parent=boat)
keyf(boat, "location", lambda t: 0.04 * math.sin(t * 2.1) - 0.02, 0, DUR, 2)
keyf(boat, "rotation_euler", lambda t: 0.06 * math.sin(t * 2.1 + 1), 0, DUR, 0)

# ---------------- the centre: the screen (input), then the lighthouse (carry, end) ----------------
cx, cy, ctop = top_at(0, 0)
CAM_AZ = 45.0
SCR_W, SCR_H = 1.62, 1.62 * 675 / 948
screen = empty("screen", (cx, cy, ctop), (0, 0, math.radians(CAM_AZ - 90)))
fold = empty("screen_fold", (0, 0, 0.1), parent=screen)           # pivot on the bottom edge: fold = rotation about local x
spop = empty("screen_pop", (0, 0, 0), parent=fold)
ob("scr_leg1", mesh_box(), (-.5, -.05, -.1), (.07, .07, .3), col=P["navy"], parent=spop)
ob("scr_leg2", mesh_box(), (.5, -.05, -.1), (.07, .07, .3), col=P["navy"], parent=spop)
ob("scr_frame", mesh_box(), (0, -0.05, 0.1), (SCR_W + .12, .08, SCR_H + .12), col=P["navy"], parent=spop)
me = bpy.data.meshes.new("scrface"); me.from_pydata([(-SCR_W / 2, 0, 0), (SCR_W / 2, 0, 0), (SCR_W / 2, 0, SCR_H), (-SCR_W / 2, 0, SCR_H)], [], [(0, 1, 2, 3)])
face = ob("scr_face", me, (0, -0.005 + 0.0, 0.16), col=(0, 0, 0), mat=MHOLD, parent=spop)
face.location.y = -0.05 + 0.041 + 0.003
TILT = math.radians(10)
tFold0, tFold1 = tC + 0.08, tC + 0.34
def fold_rot(t):                                  # stands tilted back a little; folds flat backwards in the carry, with a bounce
    if t < tFold0: return TILT
    s = t - tFold0; u = min(1.0, s / (tFold1 - tFold0)); a = TILT + (math.pi / 2 - TILT) * (u * u)
    if s > tFold1 - tFold0: a = math.pi / 2 - 0.12 * math.exp(-8 * (s - (tFold1 - tFold0))) * abs(math.sin(14 * (s - (tFold1 - tFold0))))
    return a
keyf(fold, "rotation_euler", fold_rot, tI - 0.1, tFold1 + 0.6, 0)
def scr_scale(t):
    if t < tI: return 0.0
    if t < tFold1 + 0.1: return max(0.0, pop(t - tI))
    s = t - (tFold1 + 0.1); return max(0.0, 1 - s / 0.14)
keyf(spop, "scale", lambda t: (scr_scale(t),) * 3, tI - 0.05, tFold1 + 0.4)
screen_vis = lambda t: tI <= t < tFold1 + 0.24

# the lighthouse drops and stacks, piece by piece, onto the tile the screen left
LS = 1.3                                          # the hero: big enough to own the end frame
LH = [("lh_base", mesh_prism("lh_base", 8, .46 * LS, .42 * LS, .26 * LS), P["stone"], 0.26 * LS), ("lh_b1", mesh_prism("lh_b1", 8, .36 * LS, .33 * LS, .34 * LS), P["red"], 0.34 * LS),
      ("lh_b2", mesh_prism("lh_b2", 8, .33 * LS, .30 * LS, .34 * LS), P["white"], 0.34 * LS), ("lh_b3", mesh_prism("lh_b3", 8, .30 * LS, .27 * LS, .34 * LS), P["red"], 0.34 * LS),
      ("lh_gal", mesh_prism("lh_gal", 8, .40 * LS, .40 * LS, .06 * LS), P["navy"], 0.06 * LS), ("lh_lan", mesh_prism("lh_lan", 8, .22 * LS, .22 * LS, .28 * LS), None, 0.28 * LS),
      ("lh_roof", mesh_prism("lh_roof", 8, .30 * LS, 0, .3 * LS), P["red"], 0.3 * LS)]
z = ctop; t_stack0 = tFold1 + 0.12; step = max(0.07, (tE - 0.02 - t_stack0 - 0.26) / (len(LH) - 1))
LAMP = None
for i, (nm, mesh, col, h) in enumerate(LH):
    t0 = t_stack0 + step * i
    e = dropper(nm, cx, cy, z, t0, 0, 1.9)
    if col is None:
        LAMP = ob(nm + "_m", mesh, (0, 0, 0), col=(1, .85, .55), mat=MWIN, parent=e); LAMP.color[3] = 0
    else:
        ob(nm + "_m", mesh, (0, 0, 0), col=col, parent=e, jitter=.02)
    z += h
LAMP_Z = ctop + sum(x[3] for x in LH[:5]) + 0.14 * LS
t_lamp = tE + 0.12
light(LAMP, t_lamp, 2.6)

# ---------------- picture: three pieces arrive on three islets ----------------
PIC = (40.0, 0.0)
lat = Vector((-math.sin(math.radians(CAM_AZ)), math.cos(math.radians(CAM_AZ)), 0))   # screen-right on the ground
wds = [w["s"] for w in WORDS if tP - 0.05 <= w["s"] < tI - 0.05]
arr = [(wds[i] if i < len(wds) else tP + 0.35 * i) + 0.1 for i in range(3)]
PICT = []
for i in range(3):
    p = Vector((PIC[0], PIC[1], 0)) + lat * (1.78 * (i - 1)); PICT.append(p)
    tile("P%d" % i, p.x, p.y, 0.35, "sand", arr[i] - 0.32); surf(p.x, p.y, arr[i] - 0.32)
face_rot = math.radians(CAM_AZ - 90)
# person
e = dropper("person", PICT[0].x, PICT[0].y, 0.35, arr[0] - 0.1, face_rot, 2.2)
ob("pr_legs", mesh_prism("legs", 6, .16, .15, .3), (0, 0, 0), col=P["navy"], parent=e)
ob("pr_body", mesh_prism("torso", 6, .2, .14, .42), (0, 0, .3), col=P["shirt"], parent=e)
ob("pr_head", mesh_ico(), (0, 0, .9), (.19, .19, .2), col=P["skin"], parent=e)
ob("pr_hair", mesh_prism("hair", 6, .2, 0, .14), (0, -.02, .98), (1, 1, 1), col=P["trunk"], parent=e)
# document
e = dropper("document", PICT[1].x, PICT[1].y, 0.35, arr[1] - 0.1, face_rot, 2.2)
d = empty("doc_lean", (0, 0, 0), (-0.18, 0, 0), parent=e)
ob("doc_sheet", mesh_box(), (0, 0, 0), (.72, .05, .96), col=P["paper"], parent=d)
for k in range(4):
    ob("doc_l%d" % k, mesh_box(), (-.05 if k else -.12, .028, .62 - .14 * k), (.42 if k else .28, .02, .05), col=P["ink"] if k else P["coral"], parent=d)
ob("doc_fold", mesh_prism("fold", 3, .12, .12, .05), (.27, .0, .86), (1, 1, 1), rot=(math.pi / 2, 0, 0), col=P["wall2"], parent=d)
# device
e = dropper("device", PICT[2].x, PICT[2].y, 0.35, arr[2] - 0.1, face_rot, 2.2)
d = empty("dev_lean", (0, 0, 0), (-0.15, 0, 0), parent=e)
ob("dev_body", mesh_box(), (0, 0, 0), (.6, .09, 1.02), col=P["phone"], parent=d)
scr = ob("dev_scr", mesh_box("devscr"), (0, .045, .1), (.5, .02, .82), col=(.75, .95, 1), mat=MSCREENGLOW, parent=d); scr.color[3] = 0
light(scr, arr[2] + 0.3, 0.6)
ob("dev_btn", mesh_ico(), (0, .05, .955), (.03, .02, .03), col=P["glass"], parent=d)

# ---------------- number: the digits rise out of the sea ----------------
NUM = (-40.0, 0.0)
digits = str(B["number"].get("value", 338))
nw = [w["s"] for w in WORDS if tN - 0.05 <= w["s"] < tL - 0.05]
fnt = bpy.data.fonts.load(FONT)
DIG = []
for i, ch in enumerate(digits):
    cu = bpy.data.curves.new("dig%d" % i, "FONT"); cu.body = ch; cu.font = fnt; cu.size = 2.0; cu.extrude = 0.2
    cu.resolution_u = 3; cu.align_x = "CENTER"; cu.align_y = "BOTTOM"; cu.bevel_depth = 0
    tmp = bpy.data.objects.new("dtmp%d" % i, cu); sc.collection.objects.link(tmp)
    dg = bpy.context.evaluated_depsgraph_get(); mesh = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg)); bpy.data.objects.remove(tmp)
    for p in mesh.polygons: p.use_smooth = False
    off = (i - (len(digits) - 1) / 2) * 1.35
    p = Vector((NUM[0], NUM[1], 0)) + lat * off
    t0 = tN + 0.08 + 0.2 * i
    e = empty("D%d" % i, (p.x, p.y, 0), (0, 0, math.radians(CAM_AZ + 90)))
    rot = empty("D%d_r" % i, (0, 0, 0), (math.pi / 2, 0, 0), parent=e)
    ob("D%d_m" % i, mesh, (0, 0, 0), col=P[("coral", "teal", "plum", "coral")[i % 4]], parent=rot)
    keyf(e, "location", lambda t, t0=t0: -2.3 + 2.3 * rise(t - t0, T=.3, A=.1), t0 - 0.05, t0 + 1.0, 2)
    splash_ring("D%d" % i, p.x, p.y, t0 + 0.12, 0.9)

# ---------------- the sea: faceted, shallow near land, faded to alpha with distance (the sky is drawn behind it) ----------------
def sea_mesh(x0, x1, y0, y1, step):
    nx, ny = int((x1 - x0) / step), int((y1 - y0) / step)
    bm = bmesh.new(); vs = [[bm.verts.new((x0 + i * step, y0 + j * step, 0)) for j in range(ny + 1)] for i in range(nx + 1)]
    for i in range(nx):
        for j in range(ny):
            a, b, c, d_ = vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]
            if (i + j) % 2: bm.faces.new((a, b, c)); bm.faces.new((a, c, d_))
            else: bm.faces.new((a, b, d_)); bm.faces.new((b, c, d_))
    me = bpy.data.meshes.new("sea"); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    return me
SEA = bpy.data.materials.new("sea"); SEA.use_nodes = True; SEA.surface_render_method = "BLENDED"
t = SEA.node_tree; bsdf = t.nodes["Principled BSDF"]; bsdf.inputs["Roughness"].default_value = 0.42; bsdf.inputs["Specular IOR Level"].default_value = 0.35
geo = t.nodes.new("ShaderNodeNewGeometry"); sep = t.nodes.new("ShaderNodeSeparateXYZ"); t.links.new(geo.outputs["Position"], sep.inputs[0])
DEEP = t.nodes.new("ShaderNodeRGB"); SHAL = t.nodes.new("ShaderNodeRGB")
def math_(op, a=None, b=None):
    n = t.nodes.new("ShaderNodeMath"); n.operation = op
    for k, v in ((0, a), (1, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[k].default_value = v
        else: t.links.new(v, n.inputs[k])
    return n.outputs[0]
def near(c, r0, r1, presence):                    # 1 inside r0 of centre c, 0 beyond r1
    dx = math_("SUBTRACT", sep.outputs[0], c[0]); dy = math_("SUBTRACT", sep.outputs[1], c[1])
    dd = math_("SQRT", math_("ADD", math_("MULTIPLY", dx, dx), math_("MULTIPLY", dy, dy)))
    m = t.nodes.new("ShaderNodeMapRange"); m.inputs["From Min"].default_value = r0; m.inputs["From Max"].default_value = r1
    m.inputs["To Min"].default_value = 1; m.inputs["To Max"].default_value = 0; m.interpolation_type = "SMOOTHSTEP"; t.links.new(dd, m.inputs["Value"])
    pv = t.nodes.new("ShaderNodeValue"); pv.outputs[0].default_value = presence
    return math_("MULTIPLY", m.outputs[0], pv.outputs[0]), pv
s1, PV_ISL = near(CEN, 4.4, 7.4, 1.0)
s2, PV_PIC = near(PIC, 1.6, 3.4, 1.0)
s3, PV_NUM = near(NUM, 1.6, 3.6, 1.0)
shallow = math_("MINIMUM", math_("MAXIMUM", math_("MAXIMUM", s1, s2), s3), 1.0)
mix = t.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; t.links.new(shallow, mix.inputs["Factor"])
t.links.new(DEEP.outputs[0], mix.inputs[6]); t.links.new(SHAL.outputs[0], mix.inputs[7]); t.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
cam_d = t.nodes.new("ShaderNodeCameraData")
FA = t.nodes.new("ShaderNodeValue"); FB = t.nodes.new("ShaderNodeValue")
fm = t.nodes.new("ShaderNodeMapRange"); fm.interpolation_type = "SMOOTHSTEP"; fm.inputs["To Min"].default_value = 1; fm.inputs["To Max"].default_value = 0
t.links.new(cam_d.outputs["View Z Depth"], fm.inputs["Value"]); t.links.new(FA.outputs[0], fm.inputs["From Min"]); t.links.new(FB.outputs[0], fm.inputs["From Max"])
t.links.new(fm.outputs[0], bsdf.inputs["Alpha"])
seaobj = bpy.data.objects.new("sea", sea_mesh(-56, 56, -42, 42, 0.6)); sc.collection.objects.link(seaobj); seaobj.data.materials.append(SEA)
seaobj.visible_shadow = False
tex = bpy.data.textures.new("waves", "CLOUDS"); tex.noise_scale = 1.1; tex.noise_depth = 1
drv = empty("wave_drift", (0, 0, 0))
keyf(drv, "location", lambda tt: 0.32 * tt, 0, DUR, 0); keyf(drv, "location", lambda tt: 0.21 * tt, 0, DUR, 1)
dm = seaobj.modifiers.new("waves", "DISPLACE"); dm.texture = tex; dm.texture_coords = "OBJECT"; dm.texture_coords_object = drv; dm.strength = 0.16; dm.mid_level = 0.5

# shallow water appears as the land rises
def keyval(nd, fn, t0, t1):
    f0 = max(1, int(t0 * FPS) + 1); f1 = min(NF, int(math.ceil(t1 * FPS)) + 1)
    for f in range(f0, f1 + 1):
        nd.outputs[0].default_value = fn(tf(f)); nd.outputs[0].keyframe_insert("default_value", frame=f)
keyval(PV_ISL, lambda tt: 0.55 + 0.45 * min(1, tt / 1.2), 0, 1.3)
keyval(PV_PIC, lambda tt: min(1, max(0, (tt - arr[0] + 0.3) / 0.6)), tP - 0.1, arr[2] + 0.4)
keyval(PV_NUM, lambda tt: min(1, max(0, (tt - tN) / 0.6)), tN - 0.1, tN + 0.8)

# ---------------- light ----------------
sun_d = bpy.data.lights.new("sun", "SUN"); sun_d.angle = math.radians(4); sun = bpy.data.objects.new("sun", sun_d); sc.collection.objects.link(sun)

# ---------------- camera: a vocabulary of orthographic shots, keys jump at the cuts ----------------
cam_d = bpy.data.cameras.new("cam"); cam_d.type = "ORTHO"; cam_d.clip_start = 1; cam_d.clip_end = 400
cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
DIST = 90.0
def sm(u): u = max(0.0, min(1.0, u)); return u * u * (3 - 2 * u)
def lerp(a, b, u): return a + (b - a) * u
def shot(t):                                       # target (x, y, z), azimuth, elevation, ortho scale, screen shift (island lower in frame)
    if t < tP:   u = t / tP;  return (0, 0, .4), lerp(36, 50, u), 24, lerp(16.0, 14.8, sm(u)), 2.3
    if t < tI:
        u = (t - tP) / (tI - tP); c = Vector((PIC[0], PIC[1], .55)) + lat * lerp(-0.55, 0.55, sm(u))
        return tuple(c), 45, 24, 9.6, 0.4
    if t < tN:   u = (t - tI) / (tN - tI); return (cx, cy, ctop + 0.75), CAM_AZ, 18, lerp(4.5, 4.15, sm(u)), -0.05
    if t < tL:   u = (t - tN) / (tL - tN); return (NUM[0], NUM[1], 1.0), 45, 22, lerp(8.4, 7.9, sm(u)), 0.9
    if t < tC:   u = (t - tL) / (tC - tL); return (0, 0, .4), lerp(58, 70, u), 30, 14.5, 1.0
    u = sm((t - tC - 0.05) / 1.05)                  # carry into end: one take, pull out from the screen to the whole island at night
    tz = lerp(ctop + 0.75, 0.8, u); el = lerp(18, 27, u); osz = lerp(4.5, 11.6, u); sh = lerp(-0.05, 1.7, u)
    az = CAM_AZ + 7 * max(0, (t - tE)) / (DUR - tE)
    return (lerp(cx, 0, u), lerp(cy, 0, u), tz), az, el, osz + 0.5 * max(0, t - tE) / (DUR - tE), sh

def place(t):
    (tx, ty, tz), az, el, osz, shift = shot(t)
    a, e = math.radians(az), math.radians(el)
    dirv = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
    rotq = (-dirv).to_track_quat("-Z", "Y"); up = rotq @ Vector((0, 1, 0))
    tgt = Vector((tx, ty, tz)) + up * shift * (osz / 16.0)
    cam.location = tgt + dirv * DIST; cam.rotation_euler = rotq.to_euler(); cam_d.ortho_scale = osz
    H = osz * 1.0; cot = math.cos(e) / math.sin(e)            # portrait: ortho scale spans the frame height
    FA.outputs[0].default_value = DIST + H * cot * 0.10; FB.outputs[0].default_value = DIST + H * cot * 0.34
    td = tod(t); sun_c, sun_e, sel, saz, amb, ambs, deep, shal = td
    sun_d.color = sun_c; sun_d.energy = sun_e
    sun.rotation_euler = Euler((math.radians(90 - sel), 0, math.radians(saz + 90)))
    BG.inputs["Color"].default_value = (*amb, 1); BG.inputs["Strength"].default_value = ambs
    DEEP.outputs[0].default_value = (*deep, 1); SHAL.outputs[0].default_value = (*shal, 1)

for f in range(1, NF + 1):
    t_ = tf(f); place(t_)
    cam.keyframe_insert("location", frame=f); cam.keyframe_insert("rotation_euler", frame=f); cam_d.keyframe_insert("ortho_scale", frame=f)
    FA.outputs[0].keyframe_insert("default_value", frame=f); FB.outputs[0].keyframe_insert("default_value", frame=f)
    sun_d.keyframe_insert("color", frame=f); sun_d.keyframe_insert("energy", frame=f); sun.keyframe_insert("rotation_euler", frame=f)
    BG.inputs["Color"].keyframe_insert("default_value", frame=f); BG.inputs["Strength"].keyframe_insert("default_value", frame=f)
    DEEP.outputs[0].keyframe_insert("default_value", frame=f); SHAL.outputs[0].keyframe_insert("default_value", frame=f)

# ---------------- the track for After Effects ----------------
os.makedirs(OUT, exist_ok=True)
W_, H_ = RES
def px(co):
    v = world_to_camera_view(sc, cam, co); return [round(v.x * W_, 2), round((1 - v.y) * H_, 2)]
# the face looks along its local +y at the camera, so the camera's right is local -x: TL, TR, BL, BR
corners = [Vector((SCR_W / 2, 0, SCR_H)), Vector((-SCR_W / 2, 0, SCR_H)), Vector((SCR_W / 2, 0, 0)), Vector((-SCR_W / 2, 0, 0))]
track = {"fps": FPS, "w": W_, "h": H_, "frames": NF, "screen": [], "screenOn": [], "lamp": [], "tip": [], "lampOn": t_lamp, "cuts": [tP, tI, tN, tL, tC], "lineWords": word_times,
         "tod": []}
for f in range(1, NF + 1):
    sc.frame_set(f); t_ = tf(f)
    mw = face.matrix_world
    track["screen"].append([px(mw @ c) for c in corners])
    track["screenOn"].append(1 if screen_vis(t_) else 0)
    lamp = Vector((cx, cy, LAMP_Z)); ang = math.radians(150 + 95 * max(0.0, t_ - t_lamp))
    track["lamp"].append(px(lamp)); track["tip"].append(px(lamp + Vector((math.cos(ang), math.sin(ang), 0)) * 7.5))
    td = tod(t_); track["tod"].append([round(x, 4) for x in td[0]] + [round(td[1], 3)])
json.dump(track, open(os.path.join(OUT, "track.json"), "w"))
print("TRACK DONE", NF, "frames")

# ---------------- render ----------------
plate = os.path.join(OUT, "plate"); os.makedirs(plate, exist_ok=True)
if "still" in OPT: frames = [int(x) for x in OPT["still"].split(",")]
elif "frames" in OPT: a_, b_ = OPT["frames"].split("-"); frames = list(range(int(a_), int(b_) + 1))
else: frames = list(range(1, NF + 1))
for f in frames:
    p = os.path.join(plate, "island_%04d.png" % f)
    if "still" not in OPT and os.path.exists(p) and os.path.getsize(p) > 5000: continue
    sc.frame_set(f); sc.render.filepath = p; bpy.ops.render.render(write_still=True)
print("PLATE DONE", len(frames))
