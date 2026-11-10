"""Glass product: the Blender plates for the shared scene (or a reel's own), one shot per beat.

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python tools/glass_scene.py -- shot=<id> out=<frames dir>
      [res=1080x1920] [samples=96] [frames=a-b] [preview] [clip=<mp4> clipss=4.0 crop=w:h:x:y] [number=338]

Shots (frames at 30 fps, the shared scene's beat lengths): title 39, picture 52, input 45, number 52, line 41, carry 41, end 54.
Frames already rendered are skipped (a render resumes). tools/plates.mjs encodes a finished folder into <cache>/<shot>.mov.

The world: one fictional hero, a thick clear glass tile (front glass, a satin frame, a screen, a light-guide ring, a gold-traced
board, a frosted back) floating over a black gloss floor in a black studio. Light comes only from emissive strips the camera cannot
see (side strips behind, a far rim strip, a soft top box, a sweep strip that travels behind the object), so clear glass reads as a thin
white outline with rainbow edges. Dispersion is faked (this Cycles has none): three refraction lobes at IOR 1.47 / 1.50 / 1.535, tinted
R, G, B. The one accent family is ice blue to soft violet and is reserved for light: the comet pulses in the guide ring, the caustic
rings on the floor. Neutral tone mapping (Khronos PBR Neutral), grain 0."""
import bpy, math, os, sys, subprocess
import numpy as np
from mathutils import Vector

A = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OPT = dict(x.split("=", 1) for x in A if "=" in x)
SHOT = OPT.get("shot", "title")
OUT = os.path.abspath(os.path.expanduser(OPT.get("out", "/tmp/glass-" + SHOT)))
PREVIEW = "preview" in A
DRAFT = "draft" in A                                                         # every frame at a quarter size, 8 samples: for timing an AE build
RES = tuple(int(v) for v in OPT.get("res", "1080x1920").split("x"))
FPS = 30
LENGTH = {"title": 39, "picture": 52, "input": 45, "number": 52, "line": 41, "carry": 41, "end": 54}
N = LENGTH[SHOT]
SWEEP_GREY = 0.05
ICE, VIOLET, COOL = (0.42, 0.78, 1.0), (0.66, 0.52, 1.0), (0.86, 0.92, 1.0)


def lin(c):
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# ---------------------------------------------------------------------------------------------------- setup
def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "METAL"; prefs.get_devices()
        for d in prefs.devices: d.use = d.type == "METAL"        # GPU only: CPU + GPU together is slower on Apple silicon
        sc.cycles.device = "GPU"
    except TypeError:
        pass
    sc.cycles.samples = int(OPT.get("samples", 8 if DRAFT else (24 if PREVIEW else 64)))
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 14; sc.cycles.transmission_bounces = 12; sc.cycles.glossy_bounces = 6
    sc.cycles.diffuse_bounces = 1; sc.cycles.transparent_max_bounces = 8
    sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = 1.0   # caustics are procedural
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.03
    sc.render.use_persistent_data = True
    sc.cycles.sample_clamp_indirect = 12.0
    w, h = RES
    if PREVIEW: w, h = w // 2, h // 2
    if DRAFT: w, h = w // 4, h // 4
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, N
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"; sc.render.image_settings.color_depth = "8"
    try:
        sc.view_settings.view_transform = "Khronos PBR Neutral"
    except TypeError:
        sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    world = bpy.data.worlds.new("black"); sc.world = world; world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0
    return sc


def new_obj(name, data):
    o = bpy.data.objects.new(name, data); bpy.context.scene.collection.objects.link(o); return o


def fcurves(action):
    if hasattr(action, "fcurves") and len(action.fcurves):
        return list(action.fcurves)
    out = []
    for layer in getattr(action, "layers", []):
        for strip in layer.strips:
            for cb in strip.channelbags:
                out.extend(cb.fcurves)
    return out


def nkeys(sock, pairs, interp="BEZIER"):
    """Key a node socket's default_value."""
    for f, v in pairs:
        sock.default_value = v; sock.keyframe_insert("default_value", frame=f)


# ---------------------------------------------------------------------------------------------------- materials
def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL": nt.nodes.remove(n)
    return m, nt, nt.nodes["Material Output"]


def clear_glass(name="clear", rough=0.015, spread=1.0, tint=(1, 1, 1)):
    """Clear glass with faked dispersion: three refraction lobes (R, G, B) at slightly different IORs, a Fresnel-weighted mirror coat."""
    m, nt, out = mat(name); N_ = nt.nodes; L = nt.links.new
    add1 = N_.new("ShaderNodeAddShader"); add2 = N_.new("ShaderNodeAddShader")
    lobes = []
    for col, ior in (((1, 0, 0), 1.50 - 0.03 * spread), ((0, 1, 0), 1.50), ((0, 0, 1), 1.50 + 0.035 * spread)):
        r = N_.new("ShaderNodeBsdfRefraction"); r.inputs["Color"].default_value = (col[0] * tint[0], col[1] * tint[1], col[2] * tint[2], 1)
        r.inputs["IOR"].default_value = ior; r.inputs["Roughness"].default_value = rough; lobes.append(r)
    L(lobes[0].outputs[0], add1.inputs[0]); L(lobes[1].outputs[0], add1.inputs[1]); L(add1.outputs[0], add2.inputs[0]); L(lobes[2].outputs[0], add2.inputs[1])
    gl = N_.new("ShaderNodeBsdfGlossy"); gl.inputs["Roughness"].default_value = rough
    fr = N_.new("ShaderNodeFresnel"); fr.inputs["IOR"].default_value = 1.5
    mix = N_.new("ShaderNodeMixShader"); L(fr.outputs[0], mix.inputs[0]); L(add2.outputs[0], mix.inputs[1]); L(gl.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs["Surface"]); return m


def principled(name, base=(0.5, 0.5, 0.5), metal=0.0, rough=0.3, trans=0.0, coat=0.0, emit=None, estr=0.0, aniso=0.0, ior=1.5):
    m, nt, out = mat(name); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Base Color"].default_value = (*lin(base), 1); b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough; b.inputs["Transmission Weight"].default_value = trans; b.inputs["IOR"].default_value = ior
    b.inputs["Coat Weight"].default_value = coat; b.inputs["Coat Roughness"].default_value = 0.02; b.inputs["Anisotropic"].default_value = aniso
    if emit:
        b.inputs["Emission Color"].default_value = (*lin(emit), 1); b.inputs["Emission Strength"].default_value = estr
    nt.links.new(b.outputs[0], out.inputs["Surface"]); return m


def frosted(name="frost"):
    return principled(name, base=(0.62, 0.66, 0.72), trans=1.0, rough=0.42, coat=0.6, ior=1.45)


def emitter(name, col, strength):
    m, nt, out = mat(name); e = nt.nodes.new("ShaderNodeEmission"); e.inputs["Color"].default_value = (*lin(col), 1)
    e.inputs["Strength"].default_value = strength; nt.links.new(e.outputs[0], out.inputs["Surface"]); return m, e


def math_node(nt, op, a, b=None, clamp=False):
    n = nt.nodes.new("ShaderNodeMath"); n.operation = op; n.use_clamp = clamp
    for i, v in enumerate((a, b)):
        if v is None: continue
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def guide_material(name="guide"):
    """Dark polished acrylic with comet pulses running round its ring (object-space angle): a Gaussian head with a white-hot core and an
    exponential tail whose hue drifts from ice blue to violet with age. Values named head1, head2 (0..1 round the ring) and power are keyed."""
    m, nt, out = mat(name); N_ = nt.nodes; L = nt.links.new
    b = N_.new("ShaderNodeBsdfPrincipled"); b.inputs["Base Color"].default_value = (0.004, 0.005, 0.007, 1)
    b.inputs["Roughness"].default_value = 0.06; b.inputs["Coat Weight"].default_value = 1.0; b.inputs["Coat Roughness"].default_value = 0.02
    tc = N_.new("ShaderNodeTexCoord"); sep = N_.new("ShaderNodeSeparateXYZ"); L(tc.outputs["Object"], sep.inputs[0])
    ang = math_node(nt, "ARCTAN2", sep.outputs[1], sep.outputs[0])
    a01 = math_node(nt, "DIVIDE", math_node(nt, "ADD", ang, math.pi), 2 * math.pi)
    power = N_.new("ShaderNodeValue"); power.name = "power"; power.outputs[0].default_value = 0.0
    total, age_mix = None, None
    for hn in ("head1", "head2"):
        h = N_.new("ShaderNodeValue"); h.name = hn; h.outputs[0].default_value = -5.0
        d = math_node(nt, "FRACT", math_node(nt, "SUBTRACT", h.outputs[0], a01))        # how far behind the head (0..1)
        dw = math_node(nt, "MINIMUM", d, math_node(nt, "SUBTRACT", 1.0, d))
        head = math_node(nt, "EXPONENT", math_node(nt, "MULTIPLY", math_node(nt, "POWER", math_node(nt, "DIVIDE", dw, 0.018), 2.0), -1.0))
        tail = math_node(nt, "MULTIPLY", math_node(nt, "EXPONENT", math_node(nt, "MULTIPLY", d, -9.0)), 0.45)
        tail = math_node(nt, "MULTIPLY", tail, math_node(nt, "LESS_THAN", d, 0.55))
        one = math_node(nt, "ADD", math_node(nt, "MULTIPLY", head, 1.6), tail)
        total = one if total is None else math_node(nt, "ADD", total, one)
        age_mix = d if age_mix is None else math_node(nt, "MINIMUM", age_mix, d)
    strength = math_node(nt, "MULTIPLY", total, power.outputs[0])
    ramp = N_.new("ShaderNodeValToRGB"); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (1, 1, 1, 1)
    cr.elements[1].position = 0.45; cr.elements[1].color = (*lin(VIOLET), 1)
    e = cr.elements.new(0.05); e.color = (*lin(ICE), 1)
    L(age_mix, ramp.inputs[0])
    em = N_.new("ShaderNodeEmission"); L(ramp.outputs[0], em.inputs["Color"]); L(strength, em.inputs["Strength"])
    add = N_.new("ShaderNodeAddShader"); L(b.outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1]); L(add.outputs[0], out.inputs["Surface"])
    return m


def board_material(name="board"):
    """A near-black board with gold traces (a generated mask): metal makes the transparency worth looking at."""
    rng = np.random.default_rng(7); S = 512; a = np.zeros((S, S), np.float32)
    for _ in range(46):
        x, y = rng.integers(20, S - 20, 2)
        for _ in range(rng.integers(2, 5)):
            if rng.random() < 0.5:
                x2 = int(np.clip(x + rng.integers(-180, 180), 16, S - 16)); a[y - 1:y + 2, min(x, x2):max(x, x2)] = 1; x = x2
            else:
                y2 = int(np.clip(y + rng.integers(-180, 180), 16, S - 16)); a[min(y, y2):max(y, y2), x - 1:x + 2] = 1; y = y2
        a[y - 5:y + 6, x - 5:x + 6] = 1
    a[236:276, 236:276] = 1                                       # a chip pad in the middle
    img = bpy.data.images.new("traces", S, S, alpha=False); px = np.ones((S, S, 4), np.float32)
    px[..., 0] = px[..., 1] = px[..., 2] = a[::-1]; img.pixels = px.ravel(); img.colorspace_settings.name = "Non-Color"; img.pack()
    m, nt, out = mat(name); N_ = nt.nodes; L = nt.links.new
    t = N_.new("ShaderNodeTexImage"); t.image = img; t.interpolation = "Cubic"
    tc = N_.new("ShaderNodeTexCoord"); L(tc.outputs["UV"], t.inputs[0])
    dark = N_.new("ShaderNodeBsdfPrincipled"); dark.inputs["Base Color"].default_value = (0.006, 0.008, 0.01, 1); dark.inputs["Roughness"].default_value = 0.35
    gold = N_.new("ShaderNodeBsdfPrincipled"); gold.inputs["Base Color"].default_value = (*lin((0.95, 0.74, 0.42)), 1)
    gold.inputs["Metallic"].default_value = 1.0; gold.inputs["Roughness"].default_value = 0.22
    mix = N_.new("ShaderNodeMixShader"); L(t.outputs["Color"], mix.inputs[0]); L(dark.outputs[0], mix.inputs[1]); L(gold.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs["Surface"]); return m


def screen_material(name="screen", frames=None):
    """The tile's screen: idle, a near-black panel with a faint cool radial; with frames, an image sequence (the real clip) as the display."""
    m, nt, out = mat(name); N_ = nt.nodes; L = nt.links.new
    em = N_.new("ShaderNodeEmission"); glossy = N_.new("ShaderNodeBsdfGlossy"); glossy.inputs["Roughness"].default_value = 0.05
    glossy.inputs["Color"].default_value = (0.05, 0.05, 0.05, 1)
    add = N_.new("ShaderNodeAddShader"); L(em.outputs[0], add.inputs[0]); L(glossy.outputs[0], add.inputs[1]); L(add.outputs[0], out.inputs["Surface"])
    st = N_.new("ShaderNodeValue"); st.name = "screen"; st.outputs[0].default_value = 0.0
    if frames:
        img = bpy.data.images.load(frames[0]); img.source = "SEQUENCE"
        t = N_.new("ShaderNodeTexImage"); t.image = img; t.image_user.frame_duration = len(frames); t.image_user.frame_start = 1
        t.image_user.use_auto_refresh = True; t.image_user.use_cyclic = False
        tc = N_.new("ShaderNodeTexCoord"); L(tc.outputs["UV"], t.inputs[0]); L(t.outputs["Color"], em.inputs["Color"])
    else:
        tc = N_.new("ShaderNodeTexCoord"); g = N_.new("ShaderNodeTexGradient"); g.gradient_type = "SPHERICAL"
        mp = N_.new("ShaderNodeMapping"); mp.inputs["Location"].default_value = (0, 0, 0); mp.inputs["Scale"].default_value = (2.4, 2.4, 2.4)
        L(tc.outputs["Object"], mp.inputs[0]); L(mp.outputs[0], g.inputs[0])
        ramp = N_.new("ShaderNodeValToRGB"); ramp.color_ramp.elements[0].color = (0, 0, 0, 1); ramp.color_ramp.elements[1].color = (*lin(COOL), 1)
        L(g.outputs[0], ramp.inputs[0]); L(ramp.outputs[0], em.inputs["Color"])
    L(st.outputs[0], em.inputs["Strength"]); return m


def floor_material(name="floor"):
    """Black gloss, a blurred mirror, with procedural caustics: a lens ring under the object (R/G/B radii offset) and event rings that
    spread (ringR, ringI keyed), all in the accent family. lensI and ringI are keyed; centre is the floor object's origin."""
    m, nt, out = mat(name); N_ = nt.nodes; L = nt.links.new
    b = N_.new("ShaderNodeBsdfPrincipled"); b.inputs["Base Color"].default_value = (0.002, 0.002, 0.003, 1)
    b.inputs["Roughness"].default_value = 0.16; b.inputs["Specular IOR Level"].default_value = 0.4
    tc = N_.new("ShaderNodeTexCoord"); sep = N_.new("ShaderNodeSeparateXYZ"); L(tc.outputs["Object"], sep.inputs[0])
    dist = math_node(nt, "SQRT", math_node(nt, "ADD", math_node(nt, "MULTIPLY", sep.outputs[0], sep.outputs[0]), math_node(nt, "MULTIPLY", sep.outputs[1], sep.outputs[1])))
    vals = {}
    for nm, v in (("lensR", 0.55), ("lensI", 0.0), ("ringR", 0.3), ("ringI", 0.0)):
        n = N_.new("ShaderNodeValue"); n.name = nm; n.outputs[0].default_value = v; vals[nm] = n.outputs[0]

    def ring(R, k, width, inten):
        rr = math_node(nt, "MULTIPLY", R, k)
        x = math_node(nt, "DIVIDE", math_node(nt, "SUBTRACT", dist, rr), width)
        return math_node(nt, "MULTIPLY", math_node(nt, "EXPONENT", math_node(nt, "MULTIPLY", math_node(nt, "MULTIPLY", x, x), -1.0)), inten)
    comb = N_.new("ShaderNodeCombineColor")
    # per channel: R a little inside, B a little outside (the dispersion of a lens ring)
    for ch, k, tint in ((0, 0.965, 0.42), (1, 1.0, 0.8), (2, 1.04, 1.0)):
        lens = ring(vals["lensR"], k, 0.05, vals["lensI"])
        ev = ring(vals["ringR"], k, 0.07, vals["ringI"])
        s = math_node(nt, "MULTIPLY", math_node(nt, "ADD", lens, ev), tint)
        L(s, comb.inputs[ch])
    em = N_.new("ShaderNodeEmission"); L(comb.outputs[0], em.inputs["Color"]); em.inputs["Strength"].default_value = 1.0
    add = N_.new("ShaderNodeAddShader"); L(b.outputs[0], add.inputs[0]); L(em.outputs[0], add.inputs[1])
    fade = N_.new("ShaderNodeMapRange"); fade.inputs["From Min"].default_value = 3.0; fade.inputs["From Max"].default_value = 8.0
    fade.interpolation_type = "SMOOTHSTEP"; L(dist, fade.inputs["Value"])
    tr = N_.new("ShaderNodeBsdfTransparent"); mx = N_.new("ShaderNodeMixShader"); L(fade.outputs[0], mx.inputs[0])
    L(add.outputs[0], mx.inputs[1]); L(tr.outputs[0], mx.inputs[2]); L(mx.outputs[0], out.inputs["Surface"])
    return m


# ---------------------------------------------------------------------------------------------------- shapes
def rrect_pts(w, h, r, n=12):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def slab(name, w, h, thick, r, m, hole=None, chamfer=0.01):
    """A rounded-rectangle slab in the XY plane, thickness along Z (centred), optionally with a rounded hole (w, h, r): a frame."""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
    cu.extrude = max(0.0, thick / 2 - chamfer); cu.bevel_depth = chamfer; cu.bevel_resolution = 4
    for spec in [(w, h, r)] + ([hole] if hole else []):
        pts = rrect_pts(*spec); sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
        for i, (x, y) in enumerate(pts): sp.points[i].co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    o = new_obj(name, cu); o.data.materials.append(m)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.convert(target="MESH"); o = bpy.context.view_layer.objects.active; o.select_set(False)
    for p in o.data.polygons: p.use_smooth = True
    return o


def uv_plane(name, w, h, m):
    me = bpy.data.meshes.new(name)
    me.from_pydata([(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new();
    for i, c in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))): uv.data[i].uv = c
    o = new_obj(name, me); o.data.materials.append(m); return o


def torus(name, R, r, m):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=160, minor_segments=20)
    o = bpy.context.object; o.name = name; o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o


def strip(name, w, h, loc, look_at, strength, col=(1, 1, 1)):
    """An emissive strip the camera never sees: it exists only in reflections and refractions."""
    m, e = emitter(name + "_m", col, strength)
    o = uv_plane(name, w, h, m); o.location = loc
    d = Vector(look_at) - Vector(loc); o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    o.visible_camera = False; o.visible_shadow = False
    return o, e


# ---------------------------------------------------------------------------------------------------- the hero tile
def tile(name="tile", frames=None):
    """The hero: a thick clear glass tile. Parts sit along its local Z (front = +Z) under one empty, so explode() can spread them."""
    root = new_obj(name, None); root.empty_display_size = 0.5
    parts = {}
    g = clear_glass(name + "_glass")
    parts["front"] = slab(name + "_front", 1.0, 1.0, 0.07, 0.22, g, chamfer=0.022); parts["front"].location.z = 0.045
    parts["screen"] = uv_plane(name + "_screen", 0.6, 0.6, screen_material(name + "_screen", frames)); parts["screen"].location.z = 0.006
    parts["guide"] = torus(name + "_guide", 0.385, 0.011, guide_material(name + "_guide")); parts["guide"].location.z = 0.0
    parts["frame"] = slab(name + "_frame", 1.0, 1.0, 0.05, 0.22, principled(name + "_satin", base=(0.72, 0.73, 0.76), metal=1.0, rough=0.24, aniso=0.5),
                          hole=(0.9, 0.9, 0.18), chamfer=0.012); parts["frame"].location.z = -0.005
    parts["board"] = uv_plane(name + "_board", 0.84, 0.84, board_material(name + "_board")); parts["board"].location.z = -0.024
    parts["back"] = slab(name + "_back", 1.0, 1.0, 0.035, 0.22, frosted(name + "_frost"), chamfer=0.012); parts["back"].location.z = -0.05
    for k, p in parts.items():
        p.parent = root; p["z0"] = p.location.z
    root.rotation_euler = (math.radians(90), 0, 0)                    # stand up, front facing -Y (the camera side)
    return root, parts


EXPLODE = {"front": 0.52, "screen": 0.33, "guide": 0.15, "frame": 0.0, "board": -0.2, "back": -0.42}
TILT = {"front": (4, -3), "screen": (-3, 4), "guide": (2, 2), "frame": (0, 0), "board": (-2, -4), "back": (3, 3)}


def explode(parts, pairs, mode="out"):
    """Key the exploded view: pairs of (frame, amount 0..1). Each part moves along the axis with a small deterministic tilt and a spin
    proportional to its offset."""
    for k, p in parts.items():
        off, (tx, ty) = EXPLODE[k], TILT[k]
        for f, amt in pairs:
            p.location.z = p["z0"] + off * amt; p.keyframe_insert("location", index=2, frame=f)
            p.rotation_euler = (math.radians(tx * amt), math.radians(ty * amt), math.radians(off * 40 * amt))
            p.keyframe_insert("rotation_euler", frame=f)


def set_interp(ob, kind, easing):
    if not ob.animation_data or not ob.animation_data.action: return
    for fc in fcurves(ob.animation_data.action):
        for kp in fc.keyframe_points:
            kp.interpolation = kind; kp.easing = easing


# ---------------------------------------------------------------------------------------------------- other heroes (the line-up)
def person(name):
    root = new_obj(name, None)
    fm = frosted(name + "_frost")
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.17, segments=64, ring_count=32, location=(0, 0, 0.62)); h = bpy.context.object; h.name = name + "_head"
    h.data.materials.append(fm)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.27, depth=0.5, vertices=96, location=(0, 0, 0.17)); b = bpy.context.object; b.name = name + "_body"
    bv = b.modifiers.new("bevel", "BEVEL"); bv.width = 0.12; bv.segments = 10; b.data.materials.append(fm)
    for o in (h, b):
        for p in o.data.polygons: p.use_smooth = True
    core_m, core_e = emitter(name + "_core", COOL, 0.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0, 0, 0.62)); c1 = bpy.context.object; c1.data.materials.append(core_m)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, 0, 0.2)); c2 = bpy.context.object; c2.data.materials.append(core_m)
    base = slab(name + "_base", 0.66, 0.66, 0.05, 0.33, principled(name + "_chrome", base=(0.8, 0.8, 0.82), metal=1.0, rough=0.16), chamfer=0.015)
    base.location.z = -0.1
    for o in (h, b, c1, c2, base): o.parent = root
    return root, core_e


def document(name):
    root = new_obj(name, None)
    sheet = slab(name + "_sheet", 0.7, 0.92, 0.07, 0.06, clear_glass(name + "_glass"), chamfer=0.02)
    sheet.rotation_euler = (math.radians(90), 0, 0); sheet.parent = root
    satin = principled(name + "_bars", base=(0.7, 0.71, 0.74), metal=1.0, rough=0.26)
    acc_m, acc_e = emitter(name + "_accent", ICE, 0.0)
    bars = [(-0.08, 0.32, 0.4, 0.05, acc_m)] + [(0.0, y, 0.52 - (0.12 if i % 3 == 2 else 0), 0.022, satin) for i, y in enumerate((0.18, 0.1, 0.02, -0.06, -0.14, -0.22, -0.3))]
    for i, (x, y, w, h, m) in enumerate(bars):
        o = slab(name + "_bar%d" % i, w, h, 0.012, h / 2.2, m, chamfer=0.004)
        o.rotation_euler = (math.radians(90), 0, 0); o.location = (x - (0.52 - w) / 2 if m is satin else x, 0, y); o.parent = root
    return root, acc_e


# ---------------------------------------------------------------------------------------------------- studio
def studio(target=(0, 0, 0), cam_dir=(0, -1, 0), floor_z=-0.78):
    """The strip kit, placed relative to the camera direction (az = the camera's azimuth around the target)."""
    t = Vector(target); az = math.atan2(cam_dir[0], -cam_dir[1])          # 0 = camera on -Y

    def at(a_deg, r, z):
        a = az + math.radians(a_deg); return (t.x + r * math.sin(a), t.y - r * math.cos(a), z)
    S = {}
    zs = floor_z + 0.25 + 1.6                                              # every strip ends above the floor
    S["sideL"] = strip("sideL", 0.22, 3.2, at(180 + 52, 3.2, zs), (t.x, t.y, 0.2), 9.0)
    S["sideR"] = strip("sideR", 0.22, 3.2, at(180 - 52, 3.2, zs), (t.x, t.y, 0.2), 9.0)
    S["far"] = strip("far", 6.0, 0.16, at(180, 5.0, 1.5), (t.x, t.y, 0.0), 5.0)
    S["top"] = strip("top", 2.2, 2.2, (t.x, t.y, 3.2), (t.x, t.y, 0), 1.1, col=COOL)
    S["front"] = strip("front", 1.6, 0.9, at(18, 4.2, 1.6), (t.x, t.y, 0.0), 0.5)
    S["accent"] = strip("accent", 0.5, 1.4, at(-75, 2.6, floor_z + 1.1), (t.x, t.y, 0.0), 0.0, col=ICE)
    sw, swe = strip("sweep", 0.3, 3.2, at(180, 3.0, zs), (t.x, t.y, 0.2), 14.0); S["sweep"] = (sw, swe); S["zs"] = zs
    # floor: black gloss with the caustics; a far backdrop with a dark-grey radial so glass edges separate from the black
    fm = floor_material()
    bpy.ops.mesh.primitive_plane_add(size=60, location=(t.x, t.y, floor_z)); fl = bpy.context.object; fl.name = "floor"; fl.data.materials.append(fm)
    # the dark-grey radial sweep lives in the world and only camera rays see it (glass reflects pure black); the floor fades into it
    wn = bpy.context.scene.world.node_tree; bg = wn.nodes["Background"]
    tc = wn.nodes.new("ShaderNodeTexCoord"); mp = wn.nodes.new("ShaderNodeMapping"); mp.inputs["Location"].default_value = (-0.5, -0.64, 0)
    mp.inputs["Scale"].default_value = (1.0, 0.62, 1); wn.links.new(tc.outputs["Window"], mp.inputs[0])
    g = wn.nodes.new("ShaderNodeTexGradient"); g.gradient_type = "SPHERICAL"; wn.links.new(mp.outputs[0], g.inputs[0])
    pw = wn.nodes.new("ShaderNodeMath"); pw.operation = "POWER"; pw.inputs[1].default_value = 1.6; wn.links.new(g.outputs[0], pw.inputs[0])
    lp = wn.nodes.new("ShaderNodeLightPath"); mul = wn.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"
    wn.links.new(pw.outputs[0], mul.inputs[0]); wn.links.new(lp.outputs["Is Camera Ray"], mul.inputs[1])
    k = wn.nodes.new("ShaderNodeMath"); k.operation = "MULTIPLY"; k.inputs[1].default_value = SWEEP_GREY; wn.links.new(mul.outputs[0], k.inputs[0])
    bg.inputs["Color"].default_value = (1, 1, 1, 1); wn.links.new(k.outputs[0], bg.inputs["Strength"])
    S["floor"] = fl; S["az"] = az; S["target"] = t
    return S


def sweep_keys(S, pairs, r=3.0, z=None):
    """Move the sweep strip on its arc behind the object: pairs of (frame, degrees off straight-behind)."""
    sw = S["sweep"][0]; t = S["target"]; z = S["zs"] if z is None else z
    for f, deg in pairs:
        a = S["az"] + math.radians(180 + deg)
        sw.location = (t.x + r * math.sin(a), t.y - r * math.cos(a), z); sw.keyframe_insert("location", frame=f)
        d = Vector((t.x, t.y, 0.2)) - sw.location; sw.rotation_euler = d.to_track_quat("Z", "Y").to_euler(); sw.keyframe_insert("rotation_euler", frame=f)
    set_interp(sw, "SINE", "EASE_IN_OUT")


def node_val(m, name):
    return m.node_tree.nodes[name].outputs[0]


def camera(pairs, lens=85, focus=None, fstop=None):
    """pairs: (frame, location, target). The camera always drifts (eased in and out)."""
    cd = bpy.data.cameras.new("cam"); cd.lens = lens; cd.sensor_fit = "VERTICAL"; cd.sensor_height = 36; cd.clip_start = 0.05
    cam = new_obj("cam", cd); bpy.context.scene.camera = cam
    tgt = new_obj("cam_target", None)
    c = cam.constraints.new("TRACK_TO"); c.target = tgt; c.track_axis = "TRACK_NEGATIVE_Z"; c.up_axis = "UP_Y"
    for f, loc, look in pairs:
        cam.location = loc; cam.keyframe_insert("location", frame=f); tgt.location = look; tgt.keyframe_insert("location", frame=f)
    set_interp(cam, "SINE", "EASE_IN_OUT"); set_interp(tgt, "SINE", "EASE_IN_OUT")
    if fstop:
        cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop
        if isinstance(focus, list):
            for f, dist in focus: cd.dof.focus_distance = dist; cd.dof.keyframe_insert("focus_distance", frame=f)
        else:
            cd.dof.focus_distance = focus
    return cam


def orbit(dist, az_deg, el_deg, t=(0, 0, 0)):
    a, e = math.radians(az_deg), math.radians(el_deg)
    return (t[0] + dist * math.cos(e) * math.sin(a), t[1] - dist * math.cos(e) * math.cos(a), t[2] + dist * math.sin(e))


# ---------------------------------------------------------------------------------------------------- shots
def comet(gm, pairs1, pairs2=None, power=None):
    nkeys(gm.node_tree.nodes["head1"].outputs[0], pairs1)
    if pairs2: nkeys(gm.node_tree.nodes["head2"].outputs[0], pairs2)
    if power: nkeys(gm.node_tree.nodes["power"].outputs[0], power)
    linear(gm.node_tree)


def linear(idblock):
    ad = idblock.animation_data
    if ad and ad.action:
        for fc in fcurves(ad.action):
            for kp in fc.keyframe_points: kp.interpolation = "LINEAR"


def shot_title():
    # contour before content: the tile is dark; the sweep travels behind it and draws its outline; a slow push from a low 3/4
    root, P = tile(); root.location = (0, 0, 0); root.rotation_euler = (math.radians(90), 0, math.radians(-24))
    S = studio(cam_dir=(0.35, -1, 0))
    for k in ("sideL", "sideR"): nkeys(S[k][1].inputs["Strength"], [(1, 0.0), (22, 0.0), (39, 7.0)])
    nkeys(S["far"][1].inputs["Strength"], [(1, 0.0), (26, 0.0), (39, 4.0)])
    nkeys(S["top"][1].inputs["Strength"], [(1, 0.0), (30, 0.0), (39, 1.2)])
    nkeys(S["front"][1].inputs["Strength"], [(1, 0.0)])
    sweep_keys(S, [(1, -75), (34, 70)])
    camera([(1, orbit(5.6, 22, 4), (0, 0, 0.05)), (39, orbit(5.0, 14, 6), (0, 0, 0.05))], lens=85, focus=5.2, fstop=8)


def shot_picture():
    # a line-up on a diagonal: person, document, device; each lights from inside on its word
    pr, pe = person("person"); pr.location = (-0.55, -0.5, -0.66); pr.scale = (0.78,) * 3
    dr, de = document("doc"); dr.location = (0.02, 0.15, -0.08); dr.rotation_euler = (0, 0, math.radians(-14)); dr.scale = (0.8,) * 3
    root, P = tile(); root.location = (0.5, 0.8, 0.0); root.rotation_euler = (math.radians(90), 0, math.radians(-26)); root.scale = (0.62,) * 3
    S = studio(target=(0, 0.15, 0), cam_dir=(0.2, -1, 0))
    nkeys(pe.inputs["Strength"], [(1, 0.0), (3, 0.0), (11, 0.7)])
    nkeys(de.inputs["Strength"], [(1, 0.0), (10, 0.0), (16, 7.0), (52, 5.0)])
    gm = P["guide"].active_material
    comet(gm, [(1, -5), (20, -5), (21, 0.0), (52, 1.6)], power=[(1, 0), (20, 0), (22, 14), (52, 10)])
    nkeys(node_val(P["screen"].active_material, "screen"), [(1, 0.0), (22, 0.0), (32, 0.6)])
    sweep_keys(S, [(1, -55), (52, 40)])
    nkeys(S["accent"][1].inputs["Strength"], [(1, 0), (20, 0), (24, 3.0), (52, 1.0)])
    camera([(1, orbit(7.9, -14, 11, (0, 0.15, 0)), (0.0, 0.15, 0.0)), (52, orbit(7.5, 6, 9, (0, 0.15, 0)), (0.0, 0.15, 0.0))], lens=85, focus=7.7, fstop=11)


def shot_input(frames):
    # straight on, a macro push through the front glass; the screen shows the real frame; rack focus from the glass to the screen
    root, P = tile(frames=frames); root.rotation_euler = (math.radians(90), 0, math.radians(-8))
    S = studio(cam_dir=(0.1, -1, 0))
    nkeys(node_val(P["screen"].active_material, "screen"), [(1, 0.0), (6, 1.25), (45, 1.25)])
    gm = P["guide"].active_material
    comet(gm, [(1, 0.15), (45, 1.05)], [(1, 0.65), (45, 1.55)], power=[(1, 6), (45, 6)])
    sweep_keys(S, [(1, 60), (45, -50)])
    nkeys(S["front"][1].inputs["Strength"], [(1, 0.0)])
    nkeys(S["top"][1].inputs["Strength"], [(1, 1.0)])
    camera([(1, orbit(4.6, 9, 3), (0, 0, 0.0)), (45, orbit(3.8, 4, 2), (0, 0, 0.0))], lens=70,
           focus=[(1, 4.5), (14, 4.3), (30, 3.85), (45, 3.76)], fstop=4.0)


def shot_number(value):
    # a declaration: the number itself in thick clear glass, straight on with a slight push; the sweep makes a moving spectrum
    cu = bpy.data.curves.new("num", "FONT"); cu.body = str(value); cu.align_x = "CENTER"; cu.align_y = "CENTER"
    fp = os.path.expanduser("~/Library/Fonts/Inter-ExtraBold.otf")
    if os.path.exists(fp): cu.font = bpy.data.fonts.load(fp)
    cu.size = 0.92; cu.extrude = 0.11; cu.bevel_depth = 0.022; cu.bevel_resolution = 5; cu.space_character = 1.04
    o = new_obj("num", cu); o.data.materials.append(clear_glass("num_glass", spread=1.4)); o.rotation_euler = (math.radians(90), 0, math.radians(-10))
    o.location = (0, 0, 0.0)
    # a light guide line behind the digits: the counter running
    gm = guide_material("rail")
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.008, major_segments=200, minor_segments=12, location=(0, 0.45, 0.0), rotation=(math.radians(90), 0, 0))
    rail = bpy.context.object; rail.scale = (1.0, 0.42, 1.0); rail.data.materials.append(gm)
    comet(gm, [(1, 0.25), (52, 1.45)], [(1, 0.75), (52, 1.95)], power=[(1, 0), (6, 10), (52, 10)])
    S = studio(cam_dir=(0.18, -1, 0), floor_z=-1.05)
    sweep_keys(S, [(1, -70), (40, 55)])
    nkeys(S["front"][1].inputs["Strength"], [(1, 0.25)])
    fl = S["floor"].active_material
    nkeys(node_val(fl, "lensR"), [(1, 1.2)]); nkeys(node_val(fl, "lensI"), [(1, 0.0), (8, 0.0), (20, 0.5)])
    camera([(1, orbit(6.6, 11, 4), (0, 0, 0.05)), (52, orbit(6.1, 6, 3), (0, 0, 0.05))], lens=85, focus=6.3, fstop=11)


def shot_line():
    # side macro orbit: material contrast at the seam while light travels round the guide, one comet per spoken word
    root, P = tile(); root.rotation_euler = (math.radians(90), 0, math.radians(-14))
    S = studio(cam_dir=(0.45, -1, 0.3))
    nkeys(node_val(P["screen"].active_material, "screen"), [(1, 0.15)])
    gm = P["guide"].active_material
    comet(gm, [(1, 0.0), (41, 2.2)], [(1, 0.5), (41, 2.7)], power=[(1, 8), (41, 14)])
    sweep_keys(S, [(1, 50), (41, -40)])
    nkeys(S["accent"][1].inputs["Strength"], [(1, 1.0), (41, 2.5)])
    fl = S["floor"].active_material; nkeys(node_val(fl, "lensI"), [(1, 0.35)])
    camera([(1, orbit(2.5, 30, 24), (-0.12, 0, 0.1)), (41, orbit(2.25, 20, 17), (-0.1, 0, 0.08))], lens=85, focus=[(1, 2.42), (41, 2.18)], fstop=2.8)


def shot_carry():
    # exploded view on an axis about 40 degrees to the view, orbiting: a long ease-out apart, a short hover, a very short snap shut
    root, P = tile(); root.rotation_euler = (math.radians(90), 0, math.radians(-42))
    S = studio(cam_dir=(0.5, -1, 0))
    explode(P, [(1, 0.0), (24, 1.0)]);
    for p in P.values(): set_interp(p, "QUART", "EASE_OUT")
    explode(P, [(31, 0.94), (37, 0.0)])
    for p in P.values():
        if p.animation_data and p.animation_data.action:
            for fc in fcurves(p.animation_data.action):
                for kp in fc.keyframe_points:
                    if kp.co[0] >= 31: kp.interpolation = "CUBIC"; kp.easing = "EASE_IN"
                    elif kp.co[0] >= 24: kp.interpolation = "SINE"; kp.easing = "EASE_IN_OUT"
    nkeys(node_val(P["screen"].active_material, "screen"), [(1, 0.5), (37, 0.5), (39, 1.4), (41, 0.6)])
    gm = P["guide"].active_material
    comet(gm, [(1, 0.1), (41, 1.4)], power=[(1, 6), (36, 6), (37, 26), (41, 12)])
    fl = S["floor"].active_material
    nkeys(node_val(fl, "lensI"), [(1, 0.25)]); nkeys(node_val(fl, "ringR"), [(1, 0.2), (37, 0.2), (41, 0.95)]); nkeys(node_val(fl, "ringI"), [(1, 0.0), (37, 0.0), (38, 2.4), (41, 1.6)])
    linear(fl.node_tree)
    sweep_keys(S, [(1, -40), (41, 30)])
    camera([(1, orbit(5.2, 18, 18), (0, 0, 0.0)), (41, orbit(5.4, 34, 14), (0, 0, 0.0))], lens=70, focus=5.3, fstop=16)


def shot_end():
    # a slow pull back into negative space: the tile small and low, its caustic rings spreading on the floor, emission cooling down
    root, P = tile(); root.location = (0, 0, -0.25); root.rotation_euler = (math.radians(90), 0, math.radians(-20))
    S = studio(target=(0, 0, -0.25), cam_dir=(0.3, -1, 0))
    nkeys(node_val(P["screen"].active_material, "screen"), [(1, 0.6), (54, 0.15)])
    gm = P["guide"].active_material
    comet(gm, [(1, 0.3), (54, 1.6)], power=[(1, 12), (54, 3)])
    fl = S["floor"].active_material
    nkeys(node_val(fl, "lensI"), [(1, 0.5), (54, 0.25)]); nkeys(node_val(fl, "ringR"), [(1, 0.95), (54, 3.4)]); nkeys(node_val(fl, "ringI"), [(1, 1.6), (54, 0.0)])
    linear(fl.node_tree)
    sweep_keys(S, [(1, 30), (54, -30)])
    camera([(1, orbit(5.6, 20, 12, (0, 0, -0.25)), (0, 0, 0.35)), (54, orbit(9.6, 12, 14, (0, 0, -0.25)), (0, 0, 0.95))], lens=85, focus=7.4, fstop=11)


def link_strips():
    """Light linking: the strips light (and show in) everything but the floor. A tall strip's mirror image on a gloss floor is a white
    column running from the object toward the camera; without it the floor only carries the objects' reflections and the caustics."""
    strips = [o for o in bpy.data.objects if o.type == "MESH" and not o.visible_camera]
    rec = bpy.data.collections.new("receivers")
    for o in bpy.data.objects:
        if o.type in ("MESH", "FONT", "CURVE") and o.visible_camera and o.name != "floor": rec.objects.link(o)
    for o in strips: o.light_linking.receiver_collection = rec


# ---------------------------------------------------------------------------------------------------- main
def clip_frames():
    """The input shot's display: the scene clip's frames from clipss for 1.5 s, cropped square around the face (ffmpeg, cached)."""
    if "clip" not in OPT:
        sys.exit("glass_scene.py: the input shot needs clip=<path to your footage>")
    clip = os.path.expanduser(OPT["clip"])
    d = os.path.join(OUT, "_clip"); os.makedirs(d, exist_ok=True)
    if len([f for f in os.listdir(d) if f.endswith(".png")]) < N:
        crop = OPT.get("crop", "640:640:220:1215")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", OPT.get("clipss", "4.0"), "-i", clip, "-frames:v", str(N),
                        "-vf", "crop=%s,scale=720:720" % crop, os.path.join(d, "%04d.png")], check=True)
    return sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith(".png"))


def main():
    sc = setup()
    if SHOT == "title": shot_title()
    elif SHOT == "picture": shot_picture()
    elif SHOT == "input": shot_input(clip_frames())
    elif SHOT == "number": shot_number(OPT.get("number", "338"))
    elif SHOT == "line": shot_line()
    elif SHOT == "carry": shot_carry()
    elif SHOT == "end": shot_end()
    link_strips()
    for nm in OPT.get("off", "").split(","):                                # debugging: off=sweep,sideL hides those strips
        if nm and nm in bpy.data.objects: bpy.data.objects[nm].hide_render = True
    os.makedirs(OUT, exist_ok=True)
    frames = list(range(1, N + 1))
    if "frames" in OPT:
        a, b = OPT["frames"].split("-"); frames = list(range(int(a), int(b) + 1))
    if PREVIEW:
        frames = sorted(set([1, max(1, N // 3), max(1, 2 * N // 3), N] + ([int(f) for f in OPT["at"].split(",")] if "at" in OPT else [])))
    for f in frames:
        p = os.path.join(OUT, ("preview_" if PREVIEW else "") + "%04d.png" % f)
        if os.path.exists(p) and os.path.getsize(p) > 0 and not PREVIEW: continue
        sc.frame_set(f); sc.render.filepath = p; bpy.ops.render.render(write_still=True)
        print("FRAME", SHOT, f, flush=True)


main()
