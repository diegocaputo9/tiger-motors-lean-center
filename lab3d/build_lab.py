"""Tiger Motors lab: builds the whole 3D model in Blender from layout.json and exports lab.glb.

Run inside Blender (Scripting tab, or through the Blender MCP):
    exec(compile(open(PATH).read(), PATH, 'exec'), {'__file__': PATH})

Everything is rebuilt from scratch each run inside the "TigerLab" collection, so the model can keep
improving: change layout.json or a builder below, run again, and the web page picks up the new lab.glb.
Object names are the contract with the web page (st01..st15, andon_st01_r/y/g, num_st01, poster_st01_a,
screen_*, board_*, asrs_crane, asrs_carriage, cnc1..cnc5, plc_cabinet, walls_outer, ceiling ...):
keep the names when replacing geometry (for example with a LiDAR scan) and the scenarios keep working.
"""
import bpy, bmesh, json, math, os, random
from mathutils import Matrix, Euler, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
L = json.load(open(os.path.join(HERE, 'layout.json')))
random.seed(7)

# ---------------------------------------------------------------- collection
COL = bpy.data.collections.get('TigerLab')
if COL:
    for o in list(COL.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    COL = bpy.data.collections.new('TigerLab'); bpy.context.scene.collection.children.link(COL)
for m in [m for m in bpy.data.meshes if m.users == 0]:
    bpy.data.meshes.remove(m)

# ---------------------------------------------------------------- materials
def hexrgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    return [x/12.92 if x <= 0.04045 else ((x+0.055)/1.055)**2.4 for x in c] + [1]

MAT = {}
def mat(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=1.0, alpha=1.0):
    m = bpy.data.materials.get('TL_'+name) or bpy.data.materials.new('TL_'+name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = hexrgb(color)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Alpha'].default_value = alpha
    if emit:
        b.inputs['Emission Color'].default_value = hexrgb(emit)
        b.inputs['Emission Strength'].default_value = emit_strength
    else:
        b.inputs['Emission Strength'].default_value = 0.0
    if alpha < 1:
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
        try: m.blend_method = 'BLEND'
        except Exception: pass
    m.use_backface_culling = alpha >= 1
    MAT[name] = m
    return m

mat('floor', '#C9CDD0', 0.16);            mat('floor_tape', '#E3B117', 0.45)
mat('wall', '#5E6368', 0.92);             mat('wall_light', '#C5C9CC', 0.9)
mat('ceiling', '#1B1D20', 0.95);          mat('light_panel', '#FFFFFF', 0.4, emit='#F4F7FF', emit_strength=6)
mat('bench', '#EFEFEA', 0.42);            mat('alu', '#C9CDD2', 0.32, 1.0)
mat('galv', '#B4BAC1', 0.42, 0.85);       mat('steel', '#8B9299', 0.5, 0.7)
mat('bin_black', '#16171A', 0.5);         mat('bin_white', '#E9E9E4', 0.5)
mat('bin_red', '#C4161C', 0.45);          mat('bin_blue', '#2E6FC2', 0.45)
mat('part_red', '#D11F25', 0.35);         mat('part_white', '#F2F2EE', 0.35)
mat('part_black', '#222326', 0.35);       mat('part_blue', '#5FA9E6', 0.35)
mat('tray_red', '#D42A2A', 0.4);          mat('tray_green', '#1E9B55', 0.4)
mat('rubber', '#121314', 0.96);           mat('paper', '#F7F7F4', 0.8)
mat('blue', '#1E4A9C', 0.4, 0.3);         mat('belt', '#CDB98C', 0.7)
mat('roller', '#B9BEC4', 0.4, 0.8);       mat('roller_red', '#B3262B', 0.5)
mat('wood', '#C9A066', 0.5);              mat('wood_dark', '#8A4B2C', 0.55)
mat('pegboard', '#EFC31B', 0.6);          mat('cage', '#E6BE19', 0.5, 0.2, alpha=0.38)
mat('plastic_black', '#1B1C1F', 0.6);     mat('cnc', '#E4E6E8', 0.4, 0.1)
mat('cnc_dark', '#2B2F35', 0.35, 0.3);    mat('glass', '#A9C7DA', 0.05, 0.0, alpha=0.22)
mat('screen', '#0A0E14', 0.2, emit='#0D1A2B', emit_strength=1.0)
mat('board', '#F4F5F3', 0.35);            mat('sign', '#FBFBF8', 0.6)
mat('lamp_r', '#5A1414', 0.3, emit='#FF2A1F', emit_strength=0.0)
mat('lamp_y', '#5A4A10', 0.3, emit='#FFC21F', emit_strength=0.0)
mat('lamp_g', '#0F4A26', 0.3, emit='#22E06A', emit_strength=3.0)
mat('tool_red', '#C82420', 0.5);          mat('tool_dark', '#2A2C30', 0.5, 0.5)
mat('cone', '#F0531C', 0.6);              mat('cabinet', '#9AA1A8', 0.45, 0.6)
mat('door', '#9A6A3E', 0.55)

# ---------------------------------------------------------------- mesh helpers
def rot(rx=0, ry=0, rz=0): return Euler((rx, ry, rz)).to_matrix().to_4x4()
OPS = {'-y': 0.0, '+x': math.pi/2, '+y': math.pi, '-x': -math.pi/2}   # station rotation so local -Y faces the operator
def frame(pos, op): return Matrix.Translation((pos[0], pos[1], pos[2] if len(pos) > 2 else 0)) @ rot(rz=OPS[op])

class G:
    """Many boxes/cylinders collected into one mesh object (one draw call per material)."""
    def __init__(s, name): s.name = name; s.bm = bmesh.new(); s.mats = []; s.bm.loops.layers.uv.new('UVMap')
    def mi(s, m):
        if m not in s.mats: s.mats.append(m)
        return s.mats.index(m)
    def _paint(s, verts, m):
        i = s.mi(m)
        for f in {f for v in verts for f in v.link_faces}: f.material_index = i
    def box(s, c, size, m, rx=0, ry=0, rz=0, M=None):
        T = Matrix.Translation(c) @ rot(rx, ry, rz) @ Matrix.Diagonal((size[0], size[1], size[2], 1))
        if M is not None: T = M @ T
        s._paint(bmesh.ops.create_cube(s.bm, size=1, matrix=T, calc_uvs=True)['verts'], m)
    def cyl(s, c, r, h, m, rx=0, ry=0, rz=0, seg=14, M=None):
        T = Matrix.Translation(c) @ rot(rx, ry, rz)
        if M is not None: T = M @ T
        s._paint(bmesh.ops.create_cone(s.bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=h, matrix=T, calc_uvs=True)['verts'], m)
    def done(s, M=None, bevel=0.0):
        me = bpy.data.meshes.new(s.name); s.bm.normal_update(); s.bm.to_mesh(me); s.bm.free()
        for m in s.mats: me.materials.append(MAT[m])
        o = bpy.data.objects.new(s.name, me); COL.objects.link(o)
        if M is not None: o.matrix_world = M
        if bevel:
            b = o.modifiers.new('Bevel', 'BEVEL'); b.width = bevel; b.segments = 1; b.limit_method = 'ANGLE'; b.angle_limit = math.radians(40)
        return o

def quad(name, M, w, h, m):
    """A flat panel with 0..1 UVs, facing local -Y. The web page paints these (numbers, posters, screens, boards)."""
    me = bpy.data.meshes.new(name); bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new(p) for p in ((-w/2, 0, -h/2), (w/2, 0, -h/2), (w/2, 0, h/2), (-w/2, 0, h/2))]
    f = bm.faces.new(vs)
    for lp, t in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): lp[uv].uv = t
    bm.normal_update(); bm.to_mesh(me); bm.free(); me.materials.append(MAT[m])
    o = bpy.data.objects.new(name, me); COL.objects.link(o); o.matrix_world = M
    return o

def small(name, M, size, m):
    g = G(name); g.box((0, 0, 0), size, m); return g.done(M)

BIN_MIX = ['bin_black']*6 + ['bin_white']*2 + ['bin_red']
PART_MIX = ['part_red']*4 + ['part_black']*2 + ['part_white']*2 + ['part_blue']
def bins(g, y, z, tilt, width, n, depth=0.30, M=None):
    """A row of parts bins sitting on a tilted shelf whose centre is (0, y, z)."""
    R = rot(rx=tilt); w = width/n
    for i in range(n):
        if random.random() < 0.08: continue
        x = -width/2 + w*(i+0.5); b = random.choice(BIN_MIX)
        c = Vector((x, y, z)) + (R @ Vector((0, 0, 0.066))).to_3d()
        g.box(c, (w*0.9, depth, 0.11), b, rx=tilt, M=M)
        if random.random() < 0.8:
            c2 = Vector((x, y, z)) + (R @ Vector((0, 0.01, 0.118))).to_3d()
            g.box(c2, (w*0.74, depth*0.8, 0.02), random.choice(PART_MIX), rx=tilt, M=M)

def andon(key, M, x, y, z, big=False):
    """Three separate lamps (red on top) so the web page can switch each one."""
    s = 0.085 if big else 0.06; h = 0.085 if big else 0.07
    for i, c in enumerate(('g', 'y', 'r')):
        small('andon_%s_%s' % (key, c), M @ Matrix.Translation((x, y, z + i*(h+0.012))), (s, s, h), 'lamp_'+c)

def station_panels(key, M, y, z, spread=0.38):
    quad('poster_%s_a' % key, M @ Matrix.Translation((-spread, y, z)), 0.60, 0.42, 'sign')
    quad('poster_%s_b' % key, M @ Matrix.Translation((spread, y, z)), 0.60, 0.42, 'sign')
    quad('num_%s' % key, M @ Matrix.Translation((0, y-0.012, z+0.12)), 0.20, 0.27, 'sign')

# ---------------------------------------------------------------- stations 1-10: white benches
def bench_station(n, d):
    key = 'st%02d' % n; M = frame(d['pos'], d['op']); g = G(key); T = 0.26
    g.box((0, 0, 0.92), (1.52, 0.76, 0.035), 'bench')
    for x in (-0.62, 0.62):
        g.box((x, 0.06, 0.47), (0.07, 0.09, 0.88), 'bench'); g.box((x, 0, 0.025), (0.08, 0.70, 0.05), 'bench')
    g.box((0, 0.06, 0.78), (1.24, 0.05, 0.08), 'bench')
    for x in (-0.74, 0.74): g.box((x, 0.33, 1.56), (0.045, 0.045, 1.25), 'alu')
    g.box((0, 0.33, 2.17), (1.525, 0.045, 0.045), 'alu'); g.box((0, 0.33, 1.83), (1.48, 0.03, 0.03), 'alu')
    for z in (1.17, 1.45):
        g.box((0, 0.22, z), (1.44, 0.36, 0.012), 'galv', rx=T)
        g.box((0, 0.045, z-0.03), (1.44, 0.012, 0.035), 'galv', rx=T)          # front lip
        bins(g, 0.22, z, T, 1.40, 8)
    g.box((0.50, -0.18, 0.947), (0.34, 0.20, 0.02), 'tray_red'); g.box((0.56, 0.04, 0.947), (0.22, 0.16, 0.02), 'tray_green')
    g.box((-0.45, -0.17, 0.939), (0.30, 0.22, 0.003), 'paper'); g.box((0.18, -0.2, 0.939), (0.26, 0.2, 0.003), 'paper')
    g.box((-0.79, 0.30, 1.30), (0.05, 0.06, 0.16), 'plastic_black')            # barcode scanner on the upright
    g.box((0, -0.74, 0.012), (0.80, 0.55, 0.024), 'rubber')                    # anti-fatigue mat
    g.done(M, bevel=0.004)
    andon(key, M, -0.74, 0.33, 2.235)
    station_panels(key, M, 0.295, 1.99)

# ---------------------------------------------------------------- cell 3: conveyor + stations 11-15
def conveyor():
    c = L['conveyor']; x0, x1 = c['x']; y = c['y']; Lg = x1-x0; cx = (x0+x1)/2; g = G('conveyor')
    g.box((cx, y, 0.72), (Lg, 0.50, 0.26), 'bench'); g.box((cx, y, c['belt_z']-0.012), (Lg-0.06, 0.40, 0.02), 'belt')
    for s in (-1, 1): g.box((cx, y+s*0.235, 0.845), (Lg, 0.035, 0.10), 'bench')
    for i in range(int(Lg/1.6)+1):
        x = x0 + 0.25 + i*(Lg-0.5)/int(Lg/1.6)
        for s in (-1, 1): g.box((x, y+s*0.19, 0.3), (0.06, 0.06, 0.6), 'steel')
        g.box((x, y, 0.03), (0.08, 0.62, 0.05), 'steel')
    for x in (x0+0.02, x1-0.02): g.cyl((x, y, c['belt_z']-0.03), 0.045, 0.40, 'plastic_black', rx=math.pi/2)
    g.done(bevel=0.004)

def line_station(n, d):
    key = 'st%02d' % n; M = frame(d['pos'], d['op']); g = G(key); T = 0.20
    for x in (-0.82, 0.82):
        g.box((x, 0.62, 1.22), (0.06, 0.07, 2.44), 'blue'); g.box((x, 1.42, 0.9), (0.06, 0.07, 1.8), 'blue')
        g.box((x, 1.02, 0.05), (0.06, 0.9, 0.06), 'blue')
    for z in (1.10, 1.46):
        g.box((0, 1.0, z), (1.62, 0.78, 0.025), 'roller', rx=T)
        for k in range(9): g.box((-0.72+k*0.18, 1.0, z+0.016), (0.05, 0.76, 0.006), 'roller_red', rx=T)
        g.box((0, 0.63, z-0.06), (1.62, 0.02, 0.05), 'galv', rx=T)
        Rv = (rot(rx=T) @ Vector((0, -0.2, 0))).to_3d()
        bins(g, 1.0+Rv.y, z+Rv.z, T, 1.56, 9, depth=0.32)
    g.box((0, 0.60, 2.10), (1.70, 0.04, 0.04), 'blue')
    g.box((0.86, 0.50, 1.55), (0.05, 0.06, 0.16), 'plastic_black')
    g.box((-0.82, 0.60, 2.60), (0.10, 0.10, 0.34), 'blue')                     # traffic-light housing
    g.box((0, -0.80, 0.012), (0.92, 0.60, 0.024), 'rubber')
    g.done(M, bevel=0.004)
    andon(key, M, -0.82, 0.545, 2.50, big=True)
    station_panels(key, M, 0.565, 1.86, spread=0.42)

# ---------------------------------------------------------------- supermarkets, heijunka, SMED, carts, racks
def table(g, M, w=1.4, d=0.7):
    g.box((0, 0, 0.92), (w, d, 0.035), 'bench', M=M)                         # same height as the station benches
    for x in (-w/2+0.12, w/2-0.12):
        g.box((x, 0, 0.45), (0.07, 0.09, 0.88), 'bench', M=M); g.box((x, 0, 0.025), (0.08, d-0.06, 0.05), 'bench', M=M)

def floor_label(name, c, u, w, h):
    """A label lying on the floor at c, read by someone looking along u (unit vector on the floor)."""
    ux, uy = u
    M = Matrix(((uy, 0, ux, c[0]), (-ux, 0, uy, c[1]), (0, -1, 0, 0.004), (0, 0, 0, 1)))
    return quad(name, M, w, h, 'sign')

def supermarket(k, d):
    """A table the same depth as a bench, flush against the end of its station; the label is on the floor at the free end."""
    M = frame(d['pos'], d['op']); w, dp = d['size']; g = G('sm%s' % k); table(g, None, w, dp)
    g.box((0, 0, 0.9475), (w-0.14, dp-0.14, 0.02), 'plastic_black')            # the tray the sub-assemblies sit on
    g.done(M, bevel=0.004)
    sp = L['stations'][d['next_to']]['pos']; ux, uy = sp[0]-d['pos'][0], sp[1]-d['pos'][1]; n = math.hypot(ux, uy); ux, uy = ux/n, uy/n
    floor_label('label_sm%s' % k, (d['pos'][0]-ux*(w/2+0.22), d['pos'][1]-uy*(w/2+0.22)), (ux, uy), 0.72, 0.13)

def smed_table():
    """Small table flush against the end of station 5 that holds the SMED die."""
    d = L['smed']; M = frame(d['pos'], d['op']); w, dp = d['size']; g = G('smed_table'); table(g, None, w, dp); g.done(M, bevel=0.004)
    small('smed_fixture', M @ Matrix.Translation((0, 0, 0.99)), (0.42, 0.30, 0.10), 'bin_blue')
    small('smed_plate', M @ Matrix.Translation((0, 0, 0.943)), (0.52, 0.40, 0.012), 'steel')

def heijunka():
    p = L['heijunka']['pos']; M = Matrix.Translation((p[0], p[1], 0)) @ rot(rz=OPS[L['heijunka'].get('op', '-y')]); g = G('heijunka')
    g.box((0, 0, 0.03), (0.5, 0.4, 0.06), 'steel'); g.box((0, 0, 0.7), (0.06, 0.06, 1.3), 'steel')
    g.box((0, 0, 1.45), (0.74, 0.10, 0.40), 'bench')
    for i in range(8): g.box((-0.35+i*0.1, -0.052, 1.45), (0.006, 0.012, 0.36), 'steel')
    for z in (1.33, 1.45, 1.57): g.box((0, -0.052, z), (0.72, 0.012, 0.006), 'steel')
    g.done(M, bevel=0.003)
    quad('label_heijunka', M @ Matrix.Translation((0, -0.056, 1.70)), 0.6, 0.09, 'sign')

def cart(name, pos, rz=0.0, color='plastic_black'):
    g = G(name)
    for z in (0.22, 0.80): g.box((0, 0, z), (1.0, 0.6, 0.10), color)
    for x in (-0.46, 0.46):
        for y in (-0.26, 0.26): g.box((x, y, 0.5), (0.05, 0.05, 0.6), color); g.cyl((x, y, 0.06), 0.06, 0.04, 'rubber', ry=math.pi/2)
    g.box((0.52, 0, 0.92), (0.03, 0.56, 0.03), color)
    return g.done(Matrix.Translation((pos[0], pos[1], 0)) @ rot(rz=rz), bevel=0.004)

def flow_rack(i, d):
    M = frame(d['pos'], d['op']); g = G('rawstock%d' % i)
    for x in (-0.75, 0.75):
        for y in (-0.35, 0.35): g.box((x, y, 0.95), (0.05, 0.05, 1.9), 'blue')
        g.box((x, 0, 0.06), (0.05, 0.8, 0.05), 'blue')
    for z in (0.45, 0.85, 1.25, 1.62):
        g.box((0, 0, z), (1.5, 0.74, 0.02), 'galv', rx=0.16); bins(g, 0, z, 0.16, 1.44, 7, depth=0.5)
    g.done(M, bevel=0.004)

# ---------------------------------------------------------------- AS/RS
def asrs():
    a = L['asrs']; H = a['height']; lv = a['levels']; nb = a['bays']
    for tag in ('a', 'b'):
        r = a['rack_'+tag]; x = r['x']; y0, y1 = r['y']; g = G('asrs_rack_'+tag); bw = (y1-y0)/nb
        for i in range(nb+1):
            y = y0 + i*bw
            for dx in (-0.42, 0.42): g.box((x+dx, y, H/2), (0.06, 0.06, H), 'steel')
            g.box((x, y, H-0.03), (0.9, 0.05, 0.05), 'steel')
        for k in range(lv):
            z = 0.28 + k*(H-0.45)/lv
            for dx in (-0.42, 0.42): g.box((x+dx, (y0+y1)/2, z), (0.04, y1-y0, 0.05), 'steel')
            for i in range(nb):
                if random.random() < 0.12: continue
                yc = y0 + (i+0.5)*bw
                g.box((x, yc, z+0.135), (0.78, bw*0.82, 0.22), 'bin_black')
                g.box((x-0.395 if tag == 'b' else x+0.395, yc, z+0.14), (0.004, bw*0.5, 0.07), 'paper')   # tote label, facing the aisle
        for i in (1, 5):                                                       # cross bracing on the outside face
            yc = y0 + (i+1)*bw; ox = x-0.45 if tag == 'a' else x+0.45
            for s in (-1, 1): g.box((ox, yc, H/2), (0.02, 0.03, math.hypot(2*bw, H-0.4)), 'steel', rx=s*math.atan2(2*bw, H-0.4))
        g.done(bevel=0.003)
    ra, rb = a['rack_a'], a['rack_b']; y0, y1 = ra['y']
    g = G('asrs_cage')                                                         # yellow mesh guarding, see-through
    g.box((ra['x']-0.62, (y0+y1)/2, 1.25), (0.03, y1-y0+0.5, 2.5), 'cage')
    g.box(((ra['x']+rb['x'])/2, y0-0.25, 1.25), (rb['x']-ra['x']+1.26, 0.03, 2.5), 'cage')
    g.done()
    g = G('asrs_cage_frame')
    for y in (y0-0.25, (y0+y1)/2, y1+0.25): g.box((ra['x']-0.62, y, 1.25), (0.05, 0.05, 2.5), 'pegboard')
    for xx in (ra['x']-0.62, a['aisle_x'], rb['x']+0.62): g.box((xx, y0-0.25, 1.25), (0.05, 0.05, 2.5), 'pegboard')
    g.box((ra['x']-0.62, (y0+y1)/2, 2.5), (0.05, y1-y0+0.5, 0.05), 'pegboard')
    g.box(((ra['x']+rb['x'])/2, y0-0.25, 2.5), (rb['x']-ra['x']+1.26, 0.05, 0.05), 'pegboard')
    for s in (-0.35, 0.35): g.box((a['aisle_x']+s, (y0+y1)/2, 0.03), (0.06, y1-y0+0.3, 0.05), 'steel')    # crane rails
    g.done()
    # the stacker crane: mast runs north-south in the aisle, carriage runs up and down the mast (the web page animates both)
    g = G('asrs_crane'); g.box((0, 0, 0.12), (0.9, 0.7, 0.16), 'pegboard')
    for s in (-0.22, 0.22): g.box((0, s, H/2), (0.10, 0.08, H-0.2), 'steel')
    g.box((0, 0, H-0.12), (0.5, 0.6, 0.10), 'pegboard')
    crane = g.done(Matrix.Translation((a['aisle_x'], y0+1.2, 0)), bevel=0.004)
    g = G('asrs_carriage'); g.box((0, 0, 0), (0.95, 0.34, 0.08), 'plastic_black'); g.box((0, 0, 0.14), (0.7, 0.3, 0.2), 'bin_black')
    car = g.done(bevel=0.004); car.parent = crane; car.location = (0, 0, 1.2)
    # operator station (HMI) in a black cabinet
    M = frame(a['hmi'], a.get('hmi_op', '-y')); g = G('asrs_hmi')        # flat against the cage, screen facing the CNC room
    g.box((0, 0, 0.45), (0.62, 0.55, 0.9), 'plastic_black'); g.box((0, -0.05, 0.92), (0.50, 0.20, 0.025), 'tool_dark')
    g.box((0, 0.18, 1.02), (0.06, 0.06, 0.25), 'plastic_black'); g.box((0, 0.2, 1.30), (0.66, 0.04, 0.42), 'plastic_black')
    g.done(M, bevel=0.004)
    quad('screen_asrs_hmi', M @ Matrix.Translation((0, 0.178, 1.30)), 0.60, 0.36, 'screen')

# ---------------------------------------------------------------- tool area
def tool_area():
    t = L['tool_area']; x = t['pegboard']['x']; y0, y1 = t['pegboard']['y']; yc = (y0+y1)/2; g = G('tool_area')
    g.box((x, yc, 1.75), (0.03, y1-y0, 1.1), 'pegboard')
    for i in range(22):                                                        # tools on the board
        yy = y0 + 0.15 + random.random()*(y1-y0-0.3); zz = 1.3 + random.random()*0.9
        h = 0.12 + random.random()*0.28
        g.box((x-0.03, yy, zz), (0.025, 0.03+random.random()*0.05, h), random.choice(['tool_dark', 'tool_dark', 'tool_red', 'blue', 'blue']))
    for k in range(5): g.box((x-0.07, y0+0.5+k*0.22, 1.42), (0.10, 0.18, 0.10), 'blue')
    bx, by = t['bench']
    g.box((bx, by, 0.90), (0.76, 2.2, 0.05), 'wood')
    for s in (-0.95, 0.95): g.box((bx, by+s, 0.44), (0.60, 0.06, 0.86), 'bench')
    g.box((bx+0.08, by+0.6, 0.45), (0.56, 0.8, 0.80), 'wood_dark')
    g.box((bx, by-0.6, 0.955), (0.34, 0.5, 0.06), 'rubber'); g.box((bx-0.1, by+0.1, 0.965), (0.2, 0.3, 0.10), 'bin_black')
    g.box((bx+0.18, by+0.85, 1.05), (0.26, 0.40, 0.25), 'tool_dark')
    g.done(bevel=0.004)
    quad('label_toolarea', Matrix.Translation((x-0.02, yc, 2.48)) @ rot(rz=OPS['-x']), 1.2, 0.16, 'sign')

# ---------------------------------------------------------------- War Eagle Inc. (CNC cell)
def war_eagle():
    w = L['wareagle']
    for k, p in w['cnc'].items():
        face = '-x' if p[0] > 25 else ('+y' if p[1] < -4 else '+x')
        M = frame(p, face); g = G('cnc%s' % k)
        g.box((0, 0, 0.95), (1.5, 1.1, 1.9), 'cnc'); g.box((0, 0, 0.06), (1.56, 1.16, 0.12), 'cnc_dark')
        g.box((-0.1, -0.555, 1.15), (0.85, 0.02, 0.8), 'cnc_dark'); g.box((-0.1, -0.566, 1.15), (0.7, 0.01, 0.62), 'glass')
        g.box((0.58, -0.6, 1.25), (0.26, 0.10, 0.42), 'cnc_dark'); g.box((0, 0, 1.93), (1.2, 0.8, 0.06), 'cnc_dark')
        g.done(M, bevel=0.01)
        quad('screen_cnc%s' % k, M @ Matrix.Translation((0.58, -0.652, 1.31)), 0.20, 0.15, 'screen')
        small('light_cnc%s' % k, M @ Matrix.Translation((0.55, 0.3, 2.02)), (0.07, 0.07, 0.12), 'lamp_g')
        quad('num_cnc%s' % k, M @ Matrix.Translation((-0.45, -0.556, 1.72)), 0.42, 0.16, 'sign')
    p = w['printer']; g = G('printer3d'); table(g, None, 1.0, 0.7)
    g.box((0, 0, 1.2), (0.5, 0.5, 0.56), 'cnc_dark'); g.box((0, -0.255, 1.2), (0.4, 0.01, 0.44), 'glass')
    g.done(frame(p, '-x'), bevel=0.006)
    quad('label_wareagle', Matrix.Translation((22.9, -0.07, 2.75)) @ rot(rz=math.pi), 2.6, 0.34, 'sign')

# ---------------------------------------------------------------- PLC / computer lab
def plc_lab():
    P = L['plc']
    for i, d in enumerate(P['desks']):
        M = frame(d, '+x'); g = G('plc_desk%d' % i); table(g, None, 1.3, 0.7)
        g.box((0, 0.18, 1.14), (0.56, 0.04, 0.34), 'plastic_black'); g.box((0, 0.18, 0.95), (0.18, 0.14, 0.06), 'plastic_black')
        g.box((0, -0.12, 0.925), (0.40, 0.13, 0.02), 'tool_dark'); g.box((0.5, 0.1, 0.25), (0.18, 0.40, 0.42), 'plastic_black')
        g.done(M, bevel=0.004)
        quad('screen_plc%d' % i, M @ Matrix.Translation((0, 0.158, 1.14)), 0.52, 0.30, 'screen')
    cx, cy = P['cabinet']; M = Matrix.Translation((cx, cy, 0)); g = G('plc_cabinet')
    g.box((0, 0, 1.45), (0.9, 0.28, 1.3), 'cabinet'); g.box((0, -0.145, 1.45), (0.82, 0.01, 1.22), 'steel')
    g.box((0.33, -0.155, 1.45), (0.03, 0.02, 0.16), 'plastic_black')
    for i in range(4): g.box((-0.25+i*0.16, 0, 0.5), (0.03, 0.03, 0.6), 'plastic_black')          # conduits to the floor
    g.done(M, bevel=0.006)
    quad('screen_plc_panel', M @ Matrix.Translation((-0.12, -0.152, 1.72)), 0.36, 0.24, 'screen')
    small('light_plc', M @ Matrix.Translation((0.30, -0.16, 1.92)), (0.06, 0.03, 0.06), 'lamp_g')
    quad('label_plc', M @ Matrix.Translation((0, -0.152, 2.2)), 0.8, 0.12, 'sign')
    g = G('plc_rack'); g.box((0, 0, 0.9), (0.6, 0.6, 1.8), 'plastic_black')
    for k in range(7): g.box((0, -0.305, 0.4+k*0.2), (0.5, 0.01, 0.07), 'tool_dark')
    g.done(Matrix.Translation((cx+1.1, cy-0.25, 0)), bevel=0.006)

# ---------------------------------------------------------------- the building
def building():
    R = L['rooms']; H = L['ceiling']; t = 0.12
    hx0, hx1 = R['hall']['x']; hy0, hy1 = R['hall']['y']; bx0, bx1 = R['bay']['x']; by0 = R['bay']['y'][0]
    wx1 = R['wareagle']['x'][1]; px0 = R['plc']['x'][0]; py0 = R['plc']['y'][0]
    g = G('floor')
    for (x0, x1, y0, y1) in ((px0, hx1, hy0, hy1), (bx0, wx1, by0, hy0), (px0, hx0, py0, hy1)):
        if (x0, y0) == (px0, hy0): x0 = hx0
        g.box(((x0+x1)/2, (y0+y1)/2, -0.05), (x1-x0, y1-y0, 0.1), 'floor')
    g.done()
    def wall(g, x0, y0, x1, y1, z0=0, z1=None, m='wall'):
        z1 = H if z1 is None else z1
        g.box(((x0+x1)/2, (y0+y1)/2, (z0+z1)/2), (abs(x1-x0)+t, abs(y1-y0)+t, z1-z0), m)
    g = G('walls_outer')
    wall(g, px0, hy1, hx1, hy1); wall(g, hx1, by0, hx1, hy1); wall(g, bx0, by0, hx1, by0)
    wall(g, bx0, by0, bx0, hy0); wall(g, hx0, hy0, bx0, hy0); wall(g, hx0, hy0, hx0, py0)
    wall(g, px0, py0, hx0, py0); wall(g, px0, py0, px0, hy1)
    for x in (3.2, 6.6):                                                       # office doors on the south wall of the hall
        g.box((x, hy0+0.07, 1.05), (0.95, 0.04, 2.1), 'door'); g.box((x+0.36, hy0+0.1, 1.05), (0.03, 0.04, 0.12), 'steel')
    dx = L['west_path']['door_x']                                             # door on the cubby wall, at the end of the taped path
    g.box((dx, hy1-0.07, 1.05), (0.95, 0.04, 2.1), 'door'); g.box((dx+0.36, hy1-0.1, 1.05), (0.03, 0.04, 0.12), 'steel')
    g.done()
    g = G('walls_inner')
    wall(g, bx1, by0, bx1, hy0, m='wall_light')                               # tool area / War Eagle
    d0, d1 = L['wareagle']['door']
    wall(g, bx1, hy0, d0, hy0, 0, 1.1); wall(g, d1, hy0, hx1, hy0, 0, 1.1)     # War Eagle front: low wall, glass above
    wall(g, bx1, hy0, hx1, hy0, 2.5, 2.62, 'steel')
    p0, p1 = L['plc']['door']
    wall(g, hx0, py0, hx0, p0, 0, 1.1); wall(g, hx0, p1, hx0, hy1, 0, 1.1)     # PLC lab front: low wall, glass above
    wall(g, hx0, py0, hx0, hy1, 2.5, 2.62, 'steel')
    for yy in (py0, p0, p1, hy1): g.box((hx0, yy, 1.25), (0.08, 0.08, 2.5), 'steel')
    for xx in (bx1, d0, d1, 23.5, hx1): g.box((xx, hy0, 1.25), (0.08, 0.08, 2.5), 'steel')
    g.done()
    g = G('glass_partitions')
    g.box(((bx1+d0)/2, hy0, 1.8), (d0-bx1, 0.02, 1.4), 'glass'); g.box(((d1+hx1)/2, hy0, 1.8), (hx1-d1, 0.02, 1.4), 'glass')
    g.box((hx0, (py0+p0)/2, 1.8), (0.02, p0-py0, 1.4), 'glass'); g.box((hx0, (p1+hy1)/2, 1.8), (0.02, hy1-p1, 1.4), 'glass')
    g.done()
    g = G('ceiling')
    for (x0, x1, y0, y1) in ((px0, hx1, hy0, hy1), (bx0, wx1, by0, hy0)):
        g.box(((x0+x1)/2, (y0+y1)/2, H+0.05), (x1-x0, y1-y0, 0.1), 'ceiling')
    for y in (1.6, 4.2, 6.6): g.cyl(((hx0+hx1)/2, y, H-0.35), 0.22, hx1-hx0, 'steel', ry=math.pi/2, seg=12)     # exposed ducts
    g.done()
    g = G('ceiling_lights')
    xs = [1.5+i*3.0 for i in range(9)]
    for x in xs:
        for y in (1.2, 3.7, 6.3): g.box((x, y, H-0.62), (1.25, 0.32, 0.06), 'light_panel'); g.box((x, y, H-0.3), (0.02, 0.02, 0.6), 'steel')
    for x in (12.5, 15.0, 17.3, 20.5, 23.5, 26.0):
        for y in (-1.6, -3.9): g.box((x, y, H-0.62), (1.25, 0.32, 0.06), 'light_panel'); g.box((x, y, H-0.3), (0.02, 0.02, 0.6), 'steel')
    for y in (3.6, 6.2): g.box((-1.8, y, H-0.62), (1.25, 0.32, 0.06), 'light_panel')
    g.done()
    # yellow floor tape: aisles around the cells, as in the photos
    g = G('floor_tape'); w = 0.06
    def tape(x0, y0, x1, y1): g.box(((x0+x1)/2, (y0+y1)/2, 0.002), (abs(x1-x0)+w, abs(y1-y0)+w, 0.003), 'floor_tape')
    q0, q1 = L['west_path']['x']
    tape(q0, 0.55, 10.6, 0.55); tape(q1, 1.25, 10.6, 1.25)                     # walkway in front of the conveyor ...
    tape(q0, 0.55, q0, hy1-0.12); tape(q1, 1.25, q1, hy1-0.12)                 # ... turning north past finished goods to the door on the cubby wall
    tape(10.9, 2.3, 16.5, 2.3); tape(10.9, 7.3, 16.5, 7.3); tape(10.9, 2.3, 10.9, 7.3); tape(16.5, 2.3, 16.5, 7.3)   # cell 1
    tape(11.2, -0.5, 16.3, -0.5); tape(11.2, -5.1, 16.3, -5.1); tape(16.3, -5.1, 16.3, -0.5)                       # cell 2
    tape(17.6, 0.7, 17.6, 7.3); tape(18.4, 0.7, 18.4, 7.3)                     # north-south aisle to the AS/RS
    tape(19.2, 1.1, 22.4, 1.1); tape(22.2, 1.6, 22.2, 7.4)
    g.done()
    # wall furniture: cubby cabinets behind cell 3 (photos), TV screens, boards
    g = G('cubbies')
    for i in range(6):
        x = 2.45 + i*1.55; g.box((x, hy1-0.26, 1.0), (1.5, 0.4, 2.0), 'wood_dark')
        for r in range(4):
            for c in range(4): g.box((x-0.56+c*0.375, hy1-0.47, 0.3+r*0.47), (0.33, 0.02, 0.42), 'cnc_dark')
    g.done(bevel=0.004)
    for k, s in L['screens'].items():
        M = frame(s['pos'], s['op']); w_, h_ = s['size']; g = G('tv_'+k)
        g.box((0, 0.035, 0), (w_+0.06, 0.05, h_+0.06), 'plastic_black'); g.box((0, 0.06, (H-s['pos'][2])/2), (0.05, 0.05, H-s['pos'][2]), 'steel')
        g.done(M)
        quad('screen_'+k, M @ Matrix.Translation((0, 0.006, 0)), w_, h_, 'screen')
    for k, s in L['boards'].items():
        M = frame(s['pos'], s['op']); w_, h_ = s['size']; g = G('boardframe_'+k)
        g.box((0, 0.012, 0), (w_+0.05, 0.02, h_+0.05), 'alu'); g.box((0, -0.02, -h_/2-0.03), (w_, 0.06, 0.02), 'alu'); g.done(M)
        quad('board_'+k, M, w_, h_, 'board')
    # a couple of safety cones by the AS/RS, as in the photos
    g = G('cones')
    for (x, y) in ((22.0, 3.0), (22.0, 6.9)):
        g.box((x, y, 0.015), (0.3, 0.3, 0.03), 'cone'); T = Matrix.Translation((x, y, 0.3))
        bmv = bmesh.ops.create_cone(g.bm, cap_ends=True, segments=14, radius1=0.12, radius2=0.03, depth=0.55, matrix=T)['verts']; g._paint(bmv, 'cone')
    g.done()

# ---------------------------------------------------------------- build everything
building()
for n, d in L['stations'].items():
    (line_station if d['cell'] == 3 else bench_station)(int(n), d)
conveyor()
for k, d in L['supermarkets'].items(): supermarket(k, d)
heijunka()
g = G('fg_table'); table(g, None, 1.0, 0.8); g.box((0, 0, 0.95), (0.8, 0.6, 0.03), 'tray_green'); g.done(frame(L['finished_goods']['pos'], '-y'), bevel=0.004)
quad('label_fg', frame(L['finished_goods']['pos'], '-y') @ Matrix.Translation((0, -0.8, 0.004)) @ rot(rx=-math.pi/2), 0.9, 0.16, 'sign')
smed_table()
cart('cart1', (18.9, 2.0), rz=1.2); cart('cart2', (17.1, 6.7), rz=0.05)        # kept well clear of the CNC room
for i, d in enumerate(L['raw_stock']): flow_rack(i+1, d)
asrs(); tool_area(); war_eagle(); plc_lab()

# hide Blender's default objects so they never end up in the export
for n in ('Cube', 'Light', 'Camera'):
    o = bpy.data.objects.get(n)
    if o and COL not in o.users_collection: o.hide_viewport = True; o.hide_render = True

tris = 0
dg = bpy.context.evaluated_depsgraph_get()
for o in COL.objects:
    if o.type == 'MESH':
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); tris += len(me.loop_triangles); o.evaluated_get(dg).to_mesh_clear()
print('TigerLab built:', len(COL.objects), 'objects,', tris, 'triangles')


def export_glb(path):
    """Write the TigerLab collection to a .glb for the web page (Y-up, modifiers applied, no cameras or lights)."""
    for o in bpy.context.view_layer.objects: o.select_set(False)
    hidden = [o for o in COL.objects if o.hide_viewport]
    for o in hidden: o.hide_viewport = False
    for o in COL.objects: o.select_set(True)
    bpy.context.view_layer.objects.active = COL.objects[0]
    import logging; logging.disable(logging.CRITICAL)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_cameras=False, export_lights=False, export_animations=False)
    logging.disable(logging.NOTSET)
    for o in hidden: o.hide_viewport = True
    print('exported', path, round(os.path.getsize(path)/1e6, 2), 'MB')

if globals().get('EXPORT_TO'): export_glb(EXPORT_TO)
if globals().get('SAVE_BLEND'): bpy.ops.wm.save_as_mainfile(filepath=SAVE_BLEND); print('saved', SAVE_BLEND)
