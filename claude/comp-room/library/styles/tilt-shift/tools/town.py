# Tilt-shift miniature: a sunny harbour town seen from high up through a tilted lens, the whole shared scene as one Blender world.
# usage:
#   Blender -b --factory-startup --python town.py -- <scene.json> <out_dir> [frames=a-b] [still=f,f,...] [res=WxH] [samples=N]
# Writes <out_dir>/frames/NNNN.png (RGBA: the billboard's screen is a holdout, so After Effects pins the real clip and the neon sign
# under it) and <out_dir>/track.json (per frame, in pixels: the screen's four corners and its blur, the sharp band's centre and
# half height, the world clock and the playback speed).
# The town is photoreal-ish boxes (walls, windows, shutters, roofs, clutter merged into a few meshes), the lens is a physical depth of
# field focused on the subject of each shot with an aperture solved per frame for a band of a chosen width. The world runs in
# time-lapse: everything that moves reads the world clock tw(t), which steps at 10 Hz (3 frames at 30 fps) at x12, and runs smooth
# at x1 in the end beat. The camera never steps.
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
SAMPLES = int(OPT.get("samples", "48"))
random.seed(11)

def tf(f): return (f - 1) / FPS
def sm(u): u = max(0.0, min(1.0, u)); return u * u * (3 - 2 * u)
def lerp(a, b, u): return a + (b - a) * u
def word_t(text, after=0.0):
    for w in WORDS:
        if w["s"] >= after - 1e-6 and w["text"].lower().strip(".,") == text.lower(): return w["s"]
    return after

# ---------------- the clock: x12 time-lapse stepping at 10 Hz, x1 smooth in the end ----------------
SPEED, STEP = 12.0, 3.0 / FPS
def tw(t):
    if t < tE: return SPEED * math.floor(t / STEP + 1e-6) * STEP
    return SPEED * math.floor(tE / STEP + 1e-6) * STEP + (t - tE)

# ---------------- palette ----------------
def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)
WALLS = ["#F6F1E6", "#F4EBDD", "#F7E3C9", "#EFD7B8", "#F3CDB3", "#E9E2D2", "#F8F4EC", "#F2DCA8", "#DDE6E6", "#F1C9A5"]
ACCENT_WALLS = ["#E8A24A", "#D96C4F", "#5FA8C8", "#E5C25B"]
SHUTTERS = ["#1F5FA8", "#2C7FB8", "#1E8C7E", "#2E5E9E", "#3A9C6E"]
CARS = ["#F2F2EE", "#D9DADB", "#2B2F36", "#E3B23C", "#3B78C2", "#C9CED4", "#5A6E7F", "#E9E4D8", "#7FA6C8", "#2F6B4F"]
PEOPLE = ["#E8423A", "#F2C53D", "#2D7DD2", "#F28AB2", "#FFFFFF", "#3BB273", "#F57A21", "#7B5EA7", "#1B1B1E", "#F4A259"]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = RES; sc.render.resolution_percentage = 100
sc.render.fps = FPS; sc.render.film_transparent = True
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"; sc.render.image_settings.color_depth = "8"
sc.eevee.taa_render_samples = SAMPLES
sc.eevee.use_shadows = True; sc.eevee.shadow_ray_count = 2; sc.eevee.shadow_step_count = 8; sc.eevee.shadow_resolution_scale = 1.0
sc.eevee.use_fast_gi = True; sc.eevee.fast_gi_distance = 6.0
try: sc.eevee.fast_gi_method = "GLOBAL_ILLUMINATION"
except Exception: pass
sc.eevee.use_raytracing = True
sc.eevee.bokeh_max_size = 46.0 * RES[0] / 1080.0; sc.eevee.use_bokeh_jittered = True; sc.eevee.bokeh_overblur = 4.0; sc.eevee.bokeh_threshold = 3.0
for vt in ("Khronos PBR Neutral", "AgX", "Standard"):
    try: sc.view_settings.view_transform = vt; break
    except Exception: pass
sc.view_settings.look = "None"; sc.view_settings.exposure = 0.15

# ---------------- materials ----------------
def node_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]
def nnew(t, kind, **kw):
    n = t.nodes.new(kind)
    for k, v in kw.items(): setattr(n, k, v)
    return n
def attr_mat(name, rough=0.8, spec=0.3, grime=True, noise=0.12):
    # base colour from the mesh colour attribute "col", darkened toward the ground (grime) and broken up by world-space noise
    m, t, b = node_mat(name); b.inputs["Roughness"].default_value = rough; b.inputs["Specular IOR Level"].default_value = spec
    at = nnew(t, "ShaderNodeAttribute", attribute_name="col")
    out = at.outputs["Color"]
    if noise:
        nz = nnew(t, "ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.35; nz.inputs["Detail"].default_value = 6
        geo = nnew(t, "ShaderNodeNewGeometry"); t.links.new(geo.outputs["Position"], nz.inputs["Vector"])
        mr = nnew(t, "ShaderNodeMapRange"); mr.inputs["To Min"].default_value = 1 - noise; mr.inputs["To Max"].default_value = 1.0
        t.links.new(nz.outputs["Fac"], mr.inputs["Value"])
        mx = nnew(t, "ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY"); mx.inputs["Factor"].default_value = 1.0
        cmb = nnew(t, "ShaderNodeCombineColor"); [t.links.new(mr.outputs[0], cmb.inputs[i]) for i in range(3)]
        t.links.new(out, mx.inputs[6]); t.links.new(cmb.outputs[0], mx.inputs[7]); out = mx.outputs[2]
    if grime:
        geo2 = nnew(t, "ShaderNodeNewGeometry"); sp = nnew(t, "ShaderNodeSeparateXYZ"); t.links.new(geo2.outputs["Position"], sp.inputs[0])
        g = nnew(t, "ShaderNodeMapRange", interpolation_type="SMOOTHSTEP"); g.inputs["From Min"].default_value = 0.0; g.inputs["From Max"].default_value = 5.0
        g.inputs["To Min"].default_value = 0.72; g.inputs["To Max"].default_value = 1.0; t.links.new(sp.outputs[2], g.inputs["Value"])
        cmb2 = nnew(t, "ShaderNodeCombineColor"); [t.links.new(g.outputs[0], cmb2.inputs[i]) for i in range(3)]
        mx2 = nnew(t, "ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY"); mx2.inputs["Factor"].default_value = 1.0
        t.links.new(out, mx2.inputs[6]); t.links.new(cmb2.outputs[0], mx2.inputs[7]); out = mx2.outputs[2]
    t.links.new(out, b.inputs["Base Color"]); return m
def flat_mat(name, hexc, rough=0.5, metal=0.0, spec=0.5, emit=None, emit_str=0.0):
    m, t, b = node_mat(name); b.inputs["Base Color"].default_value = (*lin(hexc), 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal; b.inputs["Specular IOR Level"].default_value = spec
    if emit: b.inputs["Emission Color"].default_value = (*lin(emit), 1); b.inputs["Emission Strength"].default_value = emit_str
    return m
def objcol_mat(name, rough=0.35, coat=0.6):
    # car paint and people: base colour from the object colour, glossy coat
    m, t, b = node_mat(name); oi = nnew(t, "ShaderNodeObjectInfo"); t.links.new(oi.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough; b.inputs["Coat Weight"].default_value = coat; b.inputs["Coat Roughness"].default_value = 0.12; return m

M_WALL = attr_mat("walls", rough=0.85)
M_ROOF = attr_mat("roofs", rough=0.7, grime=False, noise=0.2)
M_GROUND = attr_mat("ground", rough=0.9, grime=False, noise=0.18)
M_GREEN = attr_mat("greens", rough=0.75, grime=False, noise=0.3)
M_GLASS = flat_mat("glass", "#2A3540", rough=0.08, spec=0.9)
M_SHUT = attr_mat("shutters", rough=0.5, grime=False, noise=0.08)
M_PAINT = flat_mat("paint", "#F4F2EA", rough=0.6)
M_DARK = flat_mat("darkmetal", "#2B2A2E", rough=0.45, metal=0.6)
M_CAR = objcol_mat("carpaint"); M_PEOPLE = objcol_mat("people", rough=0.45, coat=0.2)
M_BOARD = flat_mat("board", "#4A2E1F", rough=0.6)
M_HOLD = bpy.data.materials.new("holdout"); M_HOLD.use_nodes = True
ht = M_HOLD.node_tree; [ht.nodes.remove(n) for n in list(ht.nodes) if n.type != "OUTPUT_MATERIAL"]
ht.links.new(ht.nodes.new("ShaderNodeHoldout").outputs[0], ht.nodes["Material Output"].inputs["Surface"])
M_BRAKE = flat_mat("brake", "#FF2A1A", rough=0.3, emit="#FF2A1A", emit_str=3.0)
M_SCREEN = flat_mat("boothscreen", "#9FE7FF", rough=0.2, emit="#9FE7FF", emit_str=2.5)

# water: turquoise near the quay, cobalt further out, a glossy surface with a fine ripple bump
M_WATER, wt, wb = node_mat("water"); wb.inputs["Roughness"].default_value = 0.12; wb.inputs["Specular IOR Level"].default_value = 0.7
wg = nnew(wt, "ShaderNodeNewGeometry"); wsp = nnew(wt, "ShaderNodeSeparateXYZ"); wt.links.new(wg.outputs["Position"], wsp.inputs[0])
wmr = nnew(wt, "ShaderNodeMapRange", interpolation_type="SMOOTHSTEP"); wmr.inputs["From Min"].default_value = -24; wmr.inputs["From Max"].default_value = -70
wt.links.new(wsp.outputs[1], wmr.inputs["Value"])
wmx = nnew(wt, "ShaderNodeMix", data_type="RGBA"); wt.links.new(wmr.outputs[0], wmx.inputs["Factor"])
wmx.inputs[6].default_value = (*lin("#2FC4C0"), 1); wmx.inputs[7].default_value = (*lin("#1B6FA8"), 1); wt.links.new(wmx.outputs[2], wb.inputs["Base Color"])
wn = nnew(wt, "ShaderNodeTexNoise"); wn.inputs["Scale"].default_value = 1.6; wn.inputs["Detail"].default_value = 4
WN_W = wn; wn.noise_dimensions = "4D"
wbump = nnew(wt, "ShaderNodeBump"); wbump.inputs["Strength"].default_value = 0.18; wt.links.new(wn.outputs["Fac"], wbump.inputs["Height"]); wt.links.new(wbump.outputs[0], wb.inputs["Normal"])

# ---------------- mesh builders: many boxes in one mesh, colour per face corner ----------------
class Batch:
    def __init__(self, name, mat):
        self.bm = bmesh.new(); self.col = self.bm.loops.layers.float_color.new("col"); self.name = name; self.mat = mat
    def _faces(self, vs, faces, c):
        bv = [self.bm.verts.new(v) for v in vs]
        for f in faces:
            try: fa = self.bm.faces.new([bv[i] for i in f])
            except ValueError: continue
            fa.smooth = False
            for l in fa.loops: l[self.col] = (*c, 1.0)
    def box(self, c, s, hexc, rz=0.0, mul=1.0):
        col = tuple(x * mul for x in (lin(hexc) if isinstance(hexc, str) else hexc))
        hx, hy, hz = s[0] / 2, s[1] / 2, s[2] / 2; R = Matrix.Rotation(rz, 3, "Z")
        vs = [Vector(c) + R @ Vector((x, y, z)) for z in (-hz, hz) for y in (-hy, hy) for x in (-hx, hx)]
        self._faces(vs, [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)], col)
    def prism(self, c, s, hexc, rz=0.0):          # a gable roof along local x: s = (length, depth, ridge height)
        col = lin(hexc); hx, hy, h = s[0] / 2, s[1] / 2, s[2]; R = Matrix.Rotation(rz, 3, "Z")
        vs = [Vector(c) + R @ Vector(p) for p in ((-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (-hx, 0, h), (hx, 0, h))]
        self._faces(vs, [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)], col)
    def cyl(self, c, r, h, hexc, n=10):
        col = lin(hexc); vs = []
        for z in (0, h):
            for i in range(n): a = 2 * math.pi * i / n; vs.append(Vector((c[0] + r * math.cos(a), c[1] + r * math.sin(a), c[2] + z)))
        faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)] + [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
        self._faces(vs, faces, col)
    def blob(self, c, r, hexc, sub=1, squash=1.0):
        col = lin(hexc); tmp = bmesh.new(); bmesh.ops.create_icosphere(tmp, subdivisions=sub, radius=r)
        vs = [Vector((c[0] + v.co.x * (1 + random.uniform(-.12, .12)), c[1] + v.co.y * (1 + random.uniform(-.12, .12)), c[2] + v.co.z * squash)) for v in tmp.verts]
        faces = [tuple(v.index for v in f.verts) for f in tmp.faces]; tmp.free(); self._faces(vs, faces, col)
    def done(self, shadow=True):
        me = bpy.data.meshes.new(self.name); self.bm.to_mesh(me); self.bm.free()
        ob = bpy.data.objects.new(self.name, me); sc.collection.objects.link(ob); me.materials.append(self.mat); ob.visible_shadow = shadow; return ob

walls = Batch("walls", M_WALL); roofs = Batch("roofs", M_ROOF); glass = Batch("glass", M_GLASS); shut = Batch("shutters", M_SHUT)
ground = Batch("ground", M_GROUND); greens = Batch("greens", M_GREEN); paint = Batch("paint", M_PAINT)

# ---------------- layout ----------------
# The sea is y < -22 (the camera looks north from over it). A stone quay, the harbour road (two lanes, y -17..-11), a promenade,
# then the town: blocks on a grid with streets between them, a plaza at the centre, the billboard on a roof north-east of it.
QUAY_Y, ROAD_Y0, ROAD_Y1 = -22.0, -17.0, -11.0
PLAZA = (0.0, 6.6, 24.0, 26.0)               # cx, cy, w, h (it fills the two skipped blocks between the streets)
BILL = Vector((18.0, 32.1, 16.0))             # the billboard's building (a whole block, x, y); z, its roof height, is set below
STREET = 8.0
ground.box((0, 140, -0.05), (420, 330, 0.1), "#B9B2A6")                          # town floor
ground.box((0, (QUAY_Y + ROAD_Y0) / 2, 0.06), (260, ROAD_Y0 - QUAY_Y, 0.12), "#D9D2C4")   # promenade on the quay
ground.box((0, (ROAD_Y0 + ROAD_Y1) / 2, 0.03), (260, ROAD_Y1 - ROAD_Y0, 0.06), "#3A3E45")  # the harbour road
ground.box((0, QUAY_Y - 0.6, -0.6), (260, 1.2, 1.4), "#C8BFAE")                 # quay wall
for x in range(-128, 130, 6): paint.box((x, (ROAD_Y0 + ROAD_Y1) / 2, 0.07), (3.0, 0.18, 0.02), "#FFFFFF")
for y in (ROAD_Y0 + 0.3, ROAD_Y1 - 0.3): paint.box((0, y, 0.07), (260, 0.14, 0.02), "#FFFFFF")
for i in range(8): paint.box((-3 + i * 0.9 - 3, (ROAD_Y0 + ROAD_Y1) / 2, 0.075), (0.5, ROAD_Y1 - ROAD_Y0 - 0.8, 0.02), "#FFFFFF")  # zebra
# bollards and benches on the promenade, palms and lamp posts
for x in range(-120, 121, 8):
    ground.cyl((x, QUAY_Y + 0.6, 0.1), 0.18, 0.5, "#3A3A3E", n=6)
for x in range(-116, 121, 16):
    ground.cyl((x, QUAY_Y + 3.0, 0.1), 0.14, 3.0, "#5B4A3A", n=6); greens.blob((x, QUAY_Y + 3.0, 3.4), 1.3, "#3FAE4A", sub=1, squash=0.55)

pl_cx, pl_cy, pl_w, pl_h = PLAZA
ground.box((pl_cx, pl_cy, 0.05), (pl_w, pl_h, 0.1), "#B9A385")
for i in range(-3, 4):                       # paving joints
    paint.box((pl_cx + i * 4.2, pl_cy, 0.105), (0.08, pl_h - 1, 0.01), "#A08C70")
# plaza trees at the corners
for dx, dy in ((1, -1),):
    tx, ty = pl_cx + dx * (pl_w / 2 - 2.2), pl_cy + dy * (pl_h / 2 - 2.2)
    ground.cyl((tx, ty, 0.1), 0.25, 2.4, "#6B5440", n=6); greens.blob((tx, ty, 3.4), 2.1, "#46B54E", sub=2, squash=0.8)

# building helpers -----------------------------------------------------------
FLOOR = 3.1
def facade(x0, y0, x1, y1, z0, floors, normal, shutter, bay=2.6):
    # windows on one wall: a dark recessed pane with a pair of open shutters; ground floor doors and an awning now and then
    L = math.hypot(x1 - x0, y1 - y0); n = max(1, int(L / bay)); ux, uy = (x1 - x0) / L, (y1 - y0) / L; nx, ny = normal
    rz = math.atan2(uy, ux)
    for fl in range(floors):
        zc = z0 + fl * FLOOR + 1.7
        for i in range(n):
            s = (i + 0.5) / n; cx, cy = x0 + (x1 - x0) * s + nx * 0.03, y0 + (y1 - y0) * s + ny * 0.03
            if fl == 0 and random.random() < 0.3:
                glass.box((cx, cy, z0 + 1.15), (1.3, 0.12, 2.2), "#2A3540", rz=rz)
                if random.random() < 0.5:
                    shut.box((cx + nx * 0.7, cy + ny * 0.7, z0 + 2.55), (2.1, 1.4, 0.12), random.choice(["#D9452E", "#1F5FA8", "#F2C53D", "#2E8B57", "#FFFFFF"]), rz=rz)
                continue
            if random.random() < 0.08: continue
            glass.box((cx, cy, zc), (0.9, 0.1, 1.3), "#2A3540", rz=rz)
            if random.random() < 0.75:
                for sd in (-1, 1):
                    shut.box((cx + ux * sd * 0.72 + nx * 0.05, cy + uy * sd * 0.72 + ny * 0.05, zc), (0.42, 0.06, 1.35), shutter, rz=rz)
            if fl > 0 and random.random() < 0.18:     # a small balcony
                walls.box((cx + nx * 0.45, cy + ny * 0.45, zc - 0.75), (1.4, 0.9, 0.12), "#EDE6DA", rz=rz)
def building(cx, cy, w, d, floors, roof=None, wall=None, shutter=None, clutter=True):
    h = floors * FLOOR + 0.4; wall = wall or random.choice(WALLS); shutter = shutter or random.choice(SHUTTERS)
    walls.box((cx, cy, h / 2), (w, d, h), wall)
    x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2
    facade(x0, y0, x1, y0, 0, floors, (0, -1), shutter)        # south, toward the camera
    facade(x1, y0, x1, y1, 0, floors, (1, 0), shutter)
    facade(x0, y1, x0, y0, 0, floors, (-1, 0), shutter)
    facade(x1, y1, x0, y1, 0, floors, (0, 1), shutter)
    if roof is None: roof = "gable" if random.random() < 0.55 else "flat"
    if roof == "gable":
        along_x = w >= d
        roofs.prism((cx, cy, h), (w + 0.6, d + 0.6, min(w, d) * 0.32) if along_x else (d + 0.6, w + 0.6, min(w, d) * 0.32),
                    random.choice(["#C8643C", "#B9573A", "#D47448", "#BF5E3B"]), rz=0 if along_x else math.pi / 2)
    else:
        walls.box((cx, cy, h + 0.25), (w, d, 0.5), wall, mul=0.96)                     # parapet
        roofs.box((cx, cy, h + 0.42), (w - 0.6, d - 0.6, 0.1), random.choice(["#D8D1C4", "#CFC7B8", "#B9C1BF"]))
        if clutter:
            for _ in range(random.randint(1, 4)):
                rx, ry = cx + random.uniform(-w / 2 + 1.2, w / 2 - 1.2), cy + random.uniform(-d / 2 + 1.2, d / 2 - 1.2)
                k = random.random()
                if k < 0.4: walls.box((rx, ry, h + 0.85), (1.2, 0.9, 0.8), "#E4E4E0")
                elif k < 0.65: roofs.cyl((rx, ry, h + 0.47), 0.6, 1.4, "#3F7FB0", n=10)        # water tank
                elif k < 0.85: greens.blob((rx, ry, h + 0.9), 0.7, "#4DBB55", sub=1, squash=0.7)  # potted tree
                else: walls.box((rx, ry, h + 1.3), (1.5, 1.5, 1.7), wall)                       # stair house
    return h

# the blocks: a grid north of the road, skipping the plaza; each block holds a few attached buildings of different heights
random.seed(23)
BUILT = []
for bx in range(-9, 10):
    for by in range(0, 11):
        x0 = bx * 18.0 - 9 + STREET / 2; y0 = -7.0 + by * 17.0; bw, bd = 18.0 - STREET, 17.0 - STREET * 0.85
        cx, cy = x0 + bw / 2, y0 + bd / 2
        if abs(cx - pl_cx) < pl_w / 2 + 3 and abs(cy - pl_cy) < pl_h / 2 + 3: continue
        # two to three buildings side by side along x
        parts = random.choice([[1.0], [0.5, 0.5], [0.4, 0.6], [0.35, 0.3, 0.35]]); xx = x0
        for p in parts:
            w = bw * p; fl = random.choice([2, 3, 3, 4, 4, 5]); bcx = xx + w / 2
            if abs(cx - BILL.x) < 1 and abs(cy - BILL.y) < 1:
                if p is parts[0]: BILL.z = building(cx, cy, bw, bd, 4, roof="flat", wall="#F4EBDD", clutter=False) + 0.5
                h = BILL.z
            else: h = building(bcx, cy, w, bd, fl, wall=random.choice(ACCENT_WALLS) if random.random() < 0.12 else None)
            BUILT.append((bcx, cy, w, bd, h)); xx += w
    # street trees along the north-south streets
for bx in range(-9, 11):
    sx = bx * 18.0 - 9
    for by in range(0, 11):
        if random.random() < 0.6: greens.blob((sx + random.choice((-3.1, 3.1)), -3 + by * 17.0, 2.4), 1.5, "#3FA84A", sub=1, squash=0.8)

for bt in (walls, roofs, glass, shut, paint, greens): bt.done()
ground.done(shadow=False)
wat = Batch("water", M_WATER); wat.box((0, QUAY_Y - 80, -0.3), (400, 160, 0.4), "#FFFFFF"); wat.done(shadow=False)

# the billboard on its roof: a dark board on two legs, its face a holdout (After Effects pins the clip or the neon sign under it)
SCR_W, SCR_H = 14.0, 14.0 * 675 / 948
BILL_TILT = math.radians(12)                  # leaned back so the face looks up at the camera
bill = bpy.data.objects.new("billboard", None); sc.collection.objects.link(bill)
bill.location = (BILL.x, BILL.y, BILL.z + 3.2); bill.rotation_euler = (-BILL_TILT, 0, 0)
def child_box(name, mat, loc, size, parent):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); ob.scale = size; ob.location = loc; ob.parent = parent; me.materials.append(mat); sc.collection.objects.link(ob); return ob
child_box("bill_board", M_BOARD, (0, 0.18, SCR_H / 2), (SCR_W + 0.9, 0.3, SCR_H + 0.9), bill)
face_me = bpy.data.meshes.new("bill_face"); bm = bmesh.new()
fv = [bm.verts.new(v) for v in ((-SCR_W / 2, 0, 0), (SCR_W / 2, 0, 0), (SCR_W / 2, 0, SCR_H), (-SCR_W / 2, 0, SCR_H))]; bm.faces.new(fv); bm.to_mesh(face_me); bm.free()
face = bpy.data.objects.new("bill_face", face_me); face.parent = bill; face_me.materials.append(M_HOLD); sc.collection.objects.link(face)
for sx in (-SCR_W / 3, SCR_W / 3):
    leg = child_box("bill_leg", M_DARK, (sx, 0.5, -1.6), (0.35, 0.35, 3.6), bill)
for i in range(7): child_box("bill_lamp", M_DARK, (-SCR_W / 2 + 1 + i * (SCR_W - 2) / 6, -0.9, SCR_H + 0.55), (0.25, 1.1, 0.18), bill)
child_box("bill_walk", M_DARK, (0, -0.6, -0.1), (SCR_W + 0.6, 1.2, 0.12), bill)

# the picture beat's three pieces on the plaza, placed on a diagonal so the band racks from one to the next:
# a person (the yellow raincoat), a news kiosk papered with white sheets (the document), a phone booth with a lit screen (the device)
P_PERSON = Vector((pl_cx - 8.0, pl_cy - 7.5, 0.1)); P_KIOSK = Vector((pl_cx + 0.5, pl_cy - 1.5, 0.1)); P_BOOTH = Vector((pl_cx + 9.0, pl_cy + 5.5, 0.1))
kiosk = Batch("kiosk", M_WALL)
kiosk.box((P_KIOSK.x, P_KIOSK.y, 1.4), (2.6, 2.6, 2.8), "#2E6B4F"); kiosk.box((P_KIOSK.x, P_KIOSK.y, 2.95), (3.4, 3.4, 0.3), "#24543E")
kiosk.cyl((P_KIOSK.x, P_KIOSK.y, 3.1), 0.9, 0.7, "#2E6B4F", n=12)
for k, (dx, dy, rz) in enumerate(((0, -1.32, 0), (1.32, 0, math.pi / 2), (-1.32, 0, math.pi / 2))):
    for j in range(2):
        kiosk.box((P_KIOSK.x + dx + (0.55 * (j - 0.5) * 2 if rz == 0 else 0), P_KIOSK.y + dy + (0.55 * (j - 0.5) * 2 if rz != 0 else 0), 1.55), (0.9, 0.04, 1.25), "#FBFAF5", rz=rz)
        for ln in range(4):
            kiosk.box((P_KIOSK.x + dx * 1.02 + (0.55 * (j - 0.5) * 2 if rz == 0 else 0), P_KIOSK.y + dy * 1.02 + (0.55 * (j - 0.5) * 2 if rz != 0 else 0), 1.95 - ln * 0.25),
                      (0.7 if ln else 0.75, 0.05, 0.07 if ln else 0.13), "#E23D2E" if ln == 0 else "#7D8590", rz=rz)
kiosk_ob = kiosk.done()
booth = Batch("booth", M_WALL)
booth.box((P_BOOTH.x, P_BOOTH.y, 1.45), (1.4, 1.4, 2.9), "#2C64B8"); booth.box((P_BOOTH.x, P_BOOTH.y, 3.0), (1.6, 1.6, 0.25), "#1F4C93")
booth_ob = booth.done()
scr = child_box("booth_screen", M_SCREEN, (P_BOOTH.x, P_BOOTH.y - 0.72, 1.75), (0.85, 0.06, 1.1), None)

# ---------------- moving things: cars, the hero van, boats, people, clouds ----------------
def make_car(name, hexc, L=4.2, W=1.8, H=1.3, van=False):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    def bx(c, s, mi):
        g = bmesh.ops.create_cube(bm, size=1.0)
        for v in g["verts"]: v.co = Vector((v.co.x * s[0] + c[0], v.co.y * s[1] + c[1], v.co.z * s[2] + c[2]))
        for f in {f for v in g["verts"] for f in v.link_faces}: f.material_index = mi
    if van:
        bx((0, 0, 0.95), (L, W, 1.6), 0); bx((L * 0.36, 0, 1.25), (L * 0.2, W * 1.01, 0.62), 1); bx((-L / 2 - 0.01, 0, 0.75), (0.04, W * 0.8, 0.2), 2)
    else:
        bx((0, 0, 0.55), (L, W, 0.6), 0); bx((-0.15, 0, 1.05), (L * 0.55, W * 0.9, 0.5), 1); bx((-L / 2 - 0.01, 0, 0.62), (0.04, W * 0.8, 0.14), 2)
    for wx in (-L * 0.32, L * 0.32):
        for wy in (-W / 2, W / 2): bx((wx, wy, 0.33), (0.62, 0.22, 0.62), 3)
    bm.to_mesh(me); bm.free()
    for m in (M_CAR, M_GLASS, M_BRAKE, M_DARK): me.materials.append(m)
    ob = bpy.data.objects.new(name, me); ob.color = (*lin(hexc), 1); sc.collection.objects.link(ob); return ob

ROAD_LEN = 220.0
cars = []
for i in range(26):
    lane = i % 2; y = ROAD_Y0 + 1.5 if lane == 0 else ROAD_Y1 - 1.5
    dirn = 1 if lane == 0 else -1; spd = random.uniform(4.0, 6.5)
    cars.append({"ob": make_car("car%d" % i, random.choice(CARS)), "x0": random.uniform(-110, 110), "y": y, "dir": dirn, "spd": spd, "road": "quay"})
# cross streets (north-south) at x = -45 and x = 45: a few cars each way
for i in range(10):
    sx = (-45 if i < 5 else 45) + (1.6 if i % 2 == 0 else -1.6)
    dirn = 1 if i % 2 == 0 else -1
    cars.append({"ob": make_car("xcar%d" % i, random.choice(CARS)), "x0": random.uniform(-10, 90), "y": sx, "dir": dirn, "spd": random.uniform(3.5, 5.5), "road": "cross"})
VAN = make_car("hero_van", "#E5261F", L=4.8, W=2.0, H=1.9, van=True)

def car_place(c, t):
    w = tw(t)
    if c["road"] == "quay":
        x = (c["x0"] + c["dir"] * c["spd"] * w + ROAD_LEN / 2) % ROAD_LEN - ROAD_LEN / 2
        if abs(c["y"] - VAN.location.y) < 1.0:     # same lane as the hero van: queue behind or ahead of it, never through it
            dx = x - VAN.location.x
            if abs(dx) < 6.5: x = VAN.location.x + (6.5 if dx >= 0 else -6.5)
        c["ob"].location = (x, c["y"], 0.06); c["ob"].rotation_euler = (0, 0, 0 if c["dir"] > 0 else math.pi)
    else:
        y = (c["x0"] + c["dir"] * c["spd"] * w + 20) % 110 - 20 + ROAD_Y1
        c["ob"].location = (c["y"], y, 0.06); c["ob"].rotation_euler = (0, 0, math.pi / 2 if c["dir"] > 0 else -math.pi / 2)

# the hero van: art-directed through the beats (it obeys the stepped clock like everything else, but its path is fitted to the beats)
VAN_LANE = ROAD_Y0 + 1.6
def van_pose(t):
    if t < tP:     # title: driving along the quay under the billboard
        s = (t - tT) / (tP - tT); return Vector((lerp(-6, 16, s), VAN_LANE, 0.06)), 0
    if t < tI:     # picture: parked at the plaza's south edge
        return Vector((pl_cx - 4.0, ROAD_Y1 - 1.2, 0.06)), 0
    if t < tL:     # input, number: parked
        return Vector((pl_cx - 4.0, ROAD_Y1 - 1.2, 0.06)), 0
    if t < tC:     # line: pulls out and drives east along the quay, followed by the band
        s = (t - tL) / (tC - tL); return Vector((lerp(pl_cx - 4.0, pl_cx + 30.0, s ** 1.2), lerp(ROAD_Y1 - 1.2, VAN_LANE, sm(s * 3)), 0.06)), 0
    if t < tE:     # carry: on toward the billboard's street
        s = (t - tC) / (tE - tC); return Vector((lerp(pl_cx + 30.0, pl_cx + 48.0, s), VAN_LANE, 0.06)), 0
    s = (t - tE); return Vector((pl_cx + 48.0 + 1.2 * s, VAN_LANE, 0.06)), 0       # end: real time, it barely creeps
def van_place(t):
    # stepped like the world (before the end), smooth after
    ts = t if t >= tE else math.floor(t / STEP + 1e-6) * STEP
    p, rz = van_pose(ts); VAN.location = p; VAN.rotation_euler = (0, 0, rz)

boats = []
for i in range(9):
    me = bpy.data.meshes.new("boat%d" % i); bm = bmesh.new(); L = random.uniform(5, 9); W = L * 0.36
    g = bmesh.ops.create_cube(bm, size=1.0)
    for v in g["verts"]: v.co = Vector((v.co.x * L * (0.8 if v.co.z < 0 else 1.0), v.co.y * W * (0.7 if v.co.z < 0 else 1.0), v.co.z * 0.9 + 0.2))
    g2 = bmesh.ops.create_cube(bm, size=1.0)
    for v in g2["verts"]: v.co = Vector((v.co.x * L * 0.35 - L * 0.1, v.co.y * W * 0.7, v.co.z * 0.8 + 1.05))
    for f in {f for v in g2["verts"] for f in v.link_faces}: f.material_index = 1
    bm.to_mesh(me); bm.free(); me.materials.append(M_CAR); me.materials.append(M_PAINT)
    ob = bpy.data.objects.new("boat%d" % i, me); ob.color = (*lin(random.choice(["#FFFFFF", "#1F5FA8", "#E8423A", "#F2C53D", "#2E8B57", "#FFFFFF"])), 1)
    sc.collection.objects.link(ob)
    boats.append({"ob": ob, "x0": random.uniform(-70, 70), "y": random.uniform(-62, -30), "spd": random.uniform(-1.2, 1.2), "rz": random.uniform(-0.3, 0.3), "ph": random.uniform(0, 6)})
def boat_place(b, t):
    w = tw(t); x = (b["x0"] + b["spd"] * w + 90) % 180 - 90
    b["ob"].location = (x, b["y"], 0.05 * math.sin(w * 0.8 + b["ph"])); b["ob"].rotation_euler = (0.02 * math.sin(w + b["ph"]), 0, b["rz"] + (0 if b["spd"] >= 0 else math.pi))

# people: little colour capsules (model-railway figures, a third larger than life so they read), walking in the plaza and the promenade
PSCALE = 1.3
def person_mesh(name):
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.26, radius2=0.22, depth=1.1, matrix=Matrix.Translation((0, 0, 0.55)))
    hd = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.17, matrix=Matrix.Translation((0, 0, 1.36)))
    for v in hd["verts"]:
        for f in v.link_faces: f.material_index = 1
    bm.to_mesh(me); bm.free(); me.materials.append(M_PEOPLE); me.materials.append(flat_mat("skin_" + name, "#E7B793", rough=0.6)); return me
PMESH = person_mesh("person")
people = []
def add_walkers(n, area, seed):
    rnd = random.Random(seed); x0, y0, x1, y1 = area
    for i in range(n):
        ob = bpy.data.objects.new("walker", PMESH); ob.color = (*lin(rnd.choice(PEOPLE)), 1); ob.scale = (PSCALE,) * 3; sc.collection.objects.link(ob)
        a = rnd.uniform(0, 2 * math.pi); s = rnd.uniform(0.8, 1.5)
        people.append({"ob": ob, "p0": Vector((rnd.uniform(x0, x1), rnd.uniform(y0, y1), 0.1)), "v": Vector((math.cos(a) * s, math.sin(a) * s, 0)), "box": area,
                       "pause": rnd.random() < 0.3})
add_walkers(30, (pl_cx - pl_w / 2 + 1, pl_cy - pl_h / 2 + 1, pl_cx + pl_w / 2 - 1, pl_cy + pl_h / 2 - 1), 3)
add_walkers(40, (-90, QUAY_Y + 1.2, 90, ROAD_Y0 - 0.6), 4)
add_walkers(26, (-90, ROAD_Y1 + 0.8, 90, ROAD_Y1 + 3.2), 5)
def bounce(v, lo, hi):
    span = hi - lo; v = (v - lo) % (2 * span); return lo + (v if v < span else 2 * span - v)
def walker_place(p, t):
    w = tw(t) * (0.15 if p["pause"] else 1.0); x0, y0, x1, y1 = p["box"]; q = p["p0"] + p["v"] * w
    p["ob"].location = (bounce(q.x, x0, x1), bounce(q.y, y0, y1), 0.1)
    # keep the picture's three pieces clear: a walker never stands on the kiosk or the booth
    for c, r in ((P_KIOSK, 2.4), (P_BOOTH, 2.0), (HERO.location, 3.0)):
        d = Vector(p["ob"].location) - c; d.z = 0
        if d.length < r: p["ob"].location = c + d.normalized() * r + Vector((0, 0, 0.1))

# the hero person: the yellow raincoat, a third larger again, standing at P_PERSON and stepping a few paces in the picture beat
HERO = bpy.data.objects.new("hero_person", PMESH.copy()); HERO.data.materials[0] = M_PEOPLE; HERO.color = (*lin("#FFC21A"), 1)
HERO.scale = (PSCALE * 1.25,) * 3; sc.collection.objects.link(HERO)
# a red umbrella over the hero, so the one person that matters is the one saturated thing in the band
um = bpy.data.meshes.new("umbrella"); bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=1.05, radius2=0.05, depth=0.38, matrix=Matrix.Translation((0, 0, 2.05)))
bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.03, radius2=0.03, depth=0.9, matrix=Matrix.Translation((0, 0, 1.55)))
bm.to_mesh(um); bm.free(); um.materials.append(flat_mat("umbrella", "#E8261F", rough=0.4))
UMB = bpy.data.objects.new("umbrella", um); UMB.parent = HERO; sc.collection.objects.link(UMB)
def hero_place(t):
    ts = t if t >= tE else math.floor(t / STEP + 1e-6) * STEP
    s = max(0.0, min(1.0, (ts - tP) / (tI - tP))); HERO.location = P_PERSON + Vector((1.6 * s, 0.9 * s, 0)); HERO.rotation_euler = (0, 0, 0.5)

# cloud shadows: flattened blobs high above the town, invisible to the camera, drifting across in the stepped clock
CLOUD_M = flat_mat("cloud", "#FFFFFF")
clouds = []
for i in range(6):
    me = bpy.data.meshes.new("cloud%d" % i); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new("cloud%d" % i, me); me.materials.append(CLOUD_M); sc.collection.objects.link(ob)
    ob.scale = (random.uniform(14, 24), random.uniform(9, 16), 2.0); ob.visible_camera = False; ob.visible_glossy = False; ob.visible_diffuse = False
    clouds.append({"ob": ob, "x0": random.uniform(-160, 160), "y": random.uniform(-40, 90)})
def cloud_place(c, t, sun_dir):
    w = tw(t); x = (c["x0"] + 2.2 * w + 200) % 400 - 200
    # placed along the sun ray so the shadow lands at (x, y) on the ground
    h = 160.0; c["ob"].location = Vector((x, c["y"], 0)) + sun_dir * (h / max(0.2, sun_dir.z))

# digits painted on the plaza for the number beat (the paint appears digit by digit, a crew's work in time-lapse)
DIGITS = []
fnt = None
for fp in (OPT.get("font"), "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"):
    if fp and os.path.exists(fp):
        try: fnt = bpy.data.fonts.load(fp); break
        except Exception: pass
num_str = str(B["number"]["value"])
DIG_H = 7.0
for i, ch in enumerate(num_str):
    cu = bpy.data.curves.new("digit%d" % i, "FONT"); cu.body = ch; cu.size = DIG_H; cu.align_x = "CENTER"; cu.align_y = "CENTER"; cu.extrude = 0.01
    if fnt: cu.font = fnt
    ob = bpy.data.objects.new("digit%d" % i, cu); sc.collection.objects.link(ob); cu.materials.append(flat_mat("digitpaint%d" % i, "#FFFFFF" if i != 1 else "#FFD23A", rough=0.7))
    ob.location = (pl_cx + (i - (len(num_str) - 1) / 2) * DIG_H * 0.66, pl_cy + 5.0, 0.115); DIGITS.append(ob)
t_num_word = word_t(num_str, tN - 0.1)
DIG_T = [t_num_word + 0.12 + i * 0.2 for i in range(len(num_str))]
def digits_place(t):
    for i, ob in enumerate(DIGITS):
        on = t >= DIG_T[i]; ob.scale = (1, 1, 1) if on else (0, 0, 0)

# ---------------- light and sky ----------------
world = bpy.data.worlds.new("sky"); sc.world = world; world.use_nodes = True
wnt = world.node_tree; bg = wnt.nodes["Background"]; skyg = wnt.nodes.new("ShaderNodeTexGradient"); tc = wnt.nodes.new("ShaderNodeTexCoord")
sep = wnt.nodes.new("ShaderNodeSeparateXYZ"); wnt.links.new(tc.outputs["Generated"], sep.inputs[0])
zmap = wnt.nodes.new("ShaderNodeMapRange"); zmap.inputs["From Min"].default_value = -1; zmap.inputs["From Max"].default_value = 1; wnt.links.new(sep.outputs[2], zmap.inputs["Value"])
ramp = wnt.nodes.new("ShaderNodeValToRGB"); wnt.links.new(zmap.outputs[0], ramp.inputs[0])
ramp.color_ramp.elements[0].position = 0.5; ramp.color_ramp.elements[0].color = (*lin("#F4E2C6"), 1)   # warm ground bounce
ramp.color_ramp.elements[1].position = 0.62; ramp.color_ramp.elements[1].color = (*lin("#7FB8F0"), 1)
wnt.links.new(ramp.outputs[0], bg.inputs["Color"]); bg.inputs["Strength"].default_value = 0.85
sun_d = bpy.data.lights.new("sun", "SUN"); sun_d.angle = math.radians(1.2); sun_d.energy = 4.2
sun = bpy.data.objects.new("sun", sun_d); sc.collection.objects.link(sun)

# ---------------- the camera: a vocabulary of high shots, the band on the subject ----------------
cam_d = bpy.data.cameras.new("cam"); cam_d.sensor_fit = "VERTICAL"; cam_d.sensor_height = 24.0; cam_d.lens = 48.0
cam_d.clip_start = 2.0; cam_d.clip_end = 2000; cam_d.dof.use_dof = True; cam_d.dof.aperture_blades = 0
cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
VFOV = 2 * math.atan(cam_d.sensor_height / 2 / cam_d.lens)

BILL_C = Vector((BILL.x, BILL.y - 0.5, BILL.z + 3.2 + SCR_H / 2))
def shot(t):
    """target, azimuth (deg, camera position around the target, 270 = south), pitch (deg below horizontal), distance, focus point,
    band (CoC in pixels at a quarter frame above and below the focus: larger is a narrower band), sun azimuth, sun elevation"""
    if t < tP:          # title: high oblique wide over the harbour, a very slow slide; band on the billboard
        u = sm(t / tP); tgt = BILL_C + Vector((lerp(-2, 1, u), -7, -6)); return tgt, lerp(262, 266, u), 45, lerp(102, 94, u), BILL_C, 26, 235, 52
    if t < tI:          # picture: closer on the plaza; the band racks person -> kiosk -> booth on the words
        u = sm((t - tP) / (tI - tP)); tgt = Vector((pl_cx + lerp(-2.5, 3.0, u), pl_cy - 3.0, 1.0))
        r1, r2 = word_t("build", tP) - 0.12, word_t("picture", tP) - 0.12
        a = sm((t - r1) / 0.28); b = sm((t - r2) / 0.28)
        f = P_PERSON.lerp(P_KIOSK, a).lerp(P_BOOTH, b) + Vector((0, 0, 1.3))
        return tgt, lerp(244, 250, u), 46, lerp(74, 68, u), f, 24, 220, 50
    if t < tN:          # input: the billboard close, a slow push
        u = sm((t - tI) / (tN - tI)); return BILL_C + Vector((0, 0, -0.4)), 270, 36, lerp(44, 40, u), BILL_C, 20, 240, 46
    if t < tL:          # number: nearly top-down over the painted digits, slowly rotating
        u = (t - tN) / (tL - tN); return Vector((pl_cx, pl_cy + 4.0, 0)), 270 + lerp(-6, 4, u), 74, lerp(62, 58, u), Vector((pl_cx, pl_cy + 5.0, 0)), 16, 230, 56
    if t < tC:          # line: lateral track along the quay, the band on the red van
        vp, _ = van_pose(t)
        return vp + Vector((0, 4.0, 0)), 268, 52, 70, vp + Vector((0, 0, 1.0)), 26, 250, 40
    # carry + end: one take. Start on the billboard close (the clip still on it), rise logarithmically and swing wide while the
    # screen turns into the neon sign; the end holds high, the world drops to real time, the light goes golden
    u = sm((t - tC) / (tE - tC + 0.35)); e = max(0.0, t - tE) / (DUR - tE)
    dist = 40 * math.exp(math.log(96 / 40.0) * u) + 4 * e
    return BILL_C + Vector((0, lerp(0, -6, u), lerp(-0.4, -4, u))), lerp(270, 258, u) - 2 * e, lerp(36, 46, u), dist, BILL_C, lerp(20, 26, u), lerp(240, 225, u), lerp(46, 28, sm((t - tC) / (DUR - tC)))

def ground_hit(origin, d):
    if d.z >= -1e-4: return None
    s = -origin.z / d.z; return origin + d * s

def place(t):
    tgt, az, pitch, dist, focus, band_px, saz, sel = shot(t)
    a, e = math.radians(az), math.radians(pitch)
    back = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))     # from target toward the camera
    cam.location = tgt + back * dist
    rotq = (-back).to_track_quat("-Z", "Y"); cam.rotation_euler = rotq.to_euler()
    # focus on the subject; solve the aperture so a point a quarter frame above the focus is band_px blurred (the band's width)
    fwd = -back; S = max(3.0, (focus - cam.location).dot(fwd)); cam_d.dof.focus_distance = S
    up = rotq @ Vector((0, 1, 0)); right = rotq @ Vector((1, 0, 0))
    # the depth of the ground seen a quarter frame higher on screen than the focus: rotate the view ray by vfov/4 about the camera's right
    to_f = (focus - cam.location).normalized(); ray = Matrix.Rotation(VFOV * 0.25, 3, right) @ to_f
    hit = ground_hit(cam.location, ray); D = (hit - cam.location).dot(fwd) if hit else S * 1.6
    D = max(D, S * 1.05); f_mm = cam_d.lens
    coc_mm = band_px / RES[1] * cam_d.sensor_height
    # CoC = A * f / (S - f) * |D - S| / D  ->  A = coc * D * (S - f) / (f * |D - S|);  N = f / A
    S_mm, D_mm = S * 1000, D * 1000
    Ap = coc_mm * D_mm * (S_mm - f_mm) / (f_mm * abs(D_mm - S_mm)); cam_d.dof.aperture_fstop = max(0.01, f_mm / Ap)
    # sun: cheated per shot (front-lights the facades the camera sees), warmer as it lowers
    sa, se = math.radians(saz), math.radians(sel)
    sun_dir = Vector((math.cos(se) * math.cos(sa), math.cos(se) * math.sin(sa), math.sin(se)))
    sun.rotation_euler = (-sun_dir).to_track_quat("-Z", "Y").to_euler()
    warm = sm((48 - sel) / 22.0); c0, c1 = lin("#FFF4E2"), lin("#FFC98A")
    sun_d.color = tuple(lerp(c0[k], c1[k], warm) for k in range(3)); sun_d.energy = lerp(4.4, 3.6, warm)
    return sun_dir, focus, band_px, S, Ap

def coc_px(S, Ap, D):
    f = cam_d.lens; S_mm, D_mm = S * 1000, D * 1000
    return Ap * f / (S_mm - f) * abs(D_mm - S_mm) / D_mm / cam_d.sensor_height * RES[1]

os.makedirs(OUT, exist_ok=True)
W_, H_ = RES
def px(co):
    v = world_to_camera_view(sc, cam, co); return [round(v.x * W_, 2), round((1 - v.y) * H_, 2)]
corners = [Vector((-SCR_W / 2, 0, SCR_H)), Vector((SCR_W / 2, 0, SCR_H)), Vector((-SCR_W / 2, 0, 0)), Vector((SCR_W / 2, 0, 0))]   # TL, TR, BL, BR

def set_world(t):
    sun_dir, focus, band_px, S, Ap = place(t)
    van_place(t); hero_place(t); digits_place(t)
    for c in cars: car_place(c, t)
    for b in boats: boat_place(b, t)
    for p in people: walker_place(p, t)
    for c in clouds: cloud_place(c, t, sun_dir)
    WN_W.inputs["W"].default_value = tw(t) * 0.05
    return focus, band_px, S, Ap

line_words = [w["s"] for w in WORDS if tL - 0.01 <= w["s"] < tC - 0.01]
track = {"fps": FPS, "w": W_, "h": H_, "frames": NF, "screen": [], "screenBlur": [], "band": [], "clock": [], "speed": [], "van": [],
         "cuts": [tP, tI, tN, tL, tC], "lineWords": line_words, "digits": DIG_T, "stepFrames": int(round(STEP * FPS)), "timelapse": SPEED}
for f in range(1, NF + 1):
    t_ = tf(f); focus, band_px, S, Ap = set_world(t_); bpy.context.view_layer.update()
    mw = face.matrix_world; track["screen"].append([px(mw @ c) for c in corners])
    track["screenBlur"].append(round(coc_px(S, Ap, max(1.0, (mw @ Vector((0, 0, SCR_H / 2)) - cam.location).dot((cam.matrix_world.to_quaternion() @ Vector((0, 0, -1)))))), 2))
    fy = px(focus)[1]; track["band"].append([round(fy, 1), round(H_ * 0.25 * 12.0 / max(4.0, band_px), 1)])
    track["clock"].append(round(tw(t_), 3)); track["speed"].append(1 if t_ >= tE else int(SPEED))
    track["van"].append(px(VAN.location + Vector((0, 0, 1.0))))
json.dump(track, open(os.path.join(OUT, "track.json"), "w"))
print("TRACK DONE", NF, "frames")

frames_dir = os.path.join(OUT, "frames"); os.makedirs(frames_dir, exist_ok=True)
if "still" in OPT: frames = [int(x) for x in OPT["still"].split(",")]
elif "frames" in OPT: a_, b_ = OPT["frames"].split("-"); frames = list(range(int(a_), int(b_) + 1))
else: frames = list(range(1, NF + 1))
for f in frames:
    p = os.path.join(frames_dir, "%04d.png" % f)
    if "still" not in OPT and os.path.exists(p) and os.path.getsize(p) > 5000: continue
    set_world(tf(f)); sc.frame_set(f); sc.render.filepath = p; bpy.ops.render.render(write_still=True)
print("PLATE DONE", len(frames))
