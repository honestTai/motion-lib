"""Original procedural CC0 models. Run in Blender's background Python interpreter."""

from math import atan2, cos, sin, tau, pi, sqrt
from pathlib import Path
from random import Random
import json
import struct
import bpy
from mathutils import Vector


OUT = Path(__file__).resolve().parent
ZERO = (0, 0, 0)


def blender(point):
    return (point[0], -point[2], point[1])


def linear(channel):
    value = int(channel, 16) / 255
    return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4


def finish(name, color, metal, rough, glow=0, glass=0):
    rgba = tuple(linear(color[idx:idx+2]) for idx in (0, 2, 4)) + (1,)
    material = bpy.data.materials.new(name)
    material.diffuse_color = rgba
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF').inputs
    for prop, value in [('Base Color', rgba), ('Metallic', metal), ('Roughness', rough),
                        ('Emission Color', rgba), ('Emission Strength', glow),
                        ('Transmission Weight', glass), ('IOR', 1.46)]:
        shader[prop].default_value = value
    material.use_backface_culling = True
    return material


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = 'Narrative'
    repeats.clear()
    global slate, steel, edge, gold, ink, cyan, amber, display
    slate = finish('Ceramic graphite', '253446', .68, .32)
    steel = finish('Satin titanium', '738697', .82, .31)
    edge = finish('Diamond-cut aluminum', 'c8d8df', .87, .21)
    gold = finish('Pale brass', 'd8aa62', .84, .25)
    ink = finish('Carbon gasket', '0b1722', .24, .43)
    cyan = finish('Ion phosphor', '55e1fa', .22, .23, 2.0)
    amber = finish('Amber telltale', 'ffb745', .32, .24, 1.55)
    display = finish('ScreenMat', '182b39', .12, .36)


class Form:
    """One articulated part; coordinates and dimensions use the runtime's Y-up basis."""
    def __init__(self):
        self.points, self.faces, self.styles = [], [], []
        self.normals = []

    def vertex(self, point):
        self.points.append(tuple(point))
        return len(self.points) - 1

    def face(self, indices, material, normals=None):
        self.faces.append(tuple(indices))
        self.styles.append(material)
        self.normals.append(normals)

    def object(self, name, pos=ZERO, parent=None, repeat=1, axis='y'):
        if repeat>1:
            repeats[name]=(repeat,axis)
            sector_angle=tau/repeat
            keep=[]
            for idx,face in enumerate(self.faces):
                center=sum((Vector(self.points[pt]) for pt in face),Vector(ZERO))/len(face)
                bearing=atan2(center.y if axis=='z' else -center.z,center.x)
                if (bearing+.117)%tau < sector_angle:
                    keep.append(idx)
            self.faces=[self.faces[idx] for idx in keep]
            self.styles=[self.styles[idx] for idx in keep]
            self.normals=[self.normals[idx] for idx in keep]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata([blender(point) for point in self.points], [], self.faces)
        mesh.update()
        materials = list(dict.fromkeys(self.styles))
        for material in materials:
            mesh.materials.append(material)
        custom = []
        for poly, style, normals in zip(mesh.polygons, self.styles, self.normals):
            poly.material_index = materials.index(style)
            if normals:
                poly.use_smooth = True
                custom.extend(blender(normal) for normal in normals)
            else:
                custom.extend([tuple(poly.normal)] * len(poly.vertices))
        if any(self.normals):
            mesh.normals_split_custom_set(custom)
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        obj.parent = parent
        obj.location = blender(pos)
        return obj


def lathe(form, profile, materials, count=32, center=ZERO, front=False, phase=0, smooth=True):
    """Closed section. Trace the outer wall bottom-to-top, then return down the bore."""
    def orient(point):
        return (point[0], -point[2], point[1]) if front else point
    angles = [phase + tau * idx / count for idx in range(count)]
    rings = []
    for radius, height in profile:
        ring = []
        for angle in angles if radius else [0]:
            delta = orient((radius*cos(angle), height, -radius*sin(angle)))
            ring.append(form.vertex([a+b for a, b in zip(center, delta)]))
        rings.append(ring)
    for level, (radius, height) in enumerate(profile):
        upper = (level + 1) % len(profile)
        dr, dh = profile[upper][0] - radius, profile[upper][1] - height
        if not (radius or profile[upper][0]):
            continue
        for idx, angle in enumerate(angles):
            after = (idx+1) % count
            corners = [(level, idx), (level, after), (upper, after), (upper, idx)]
            indices, normals = [], []
            for row, col in corners:
                ring = rings[row]
                point = ring[col % len(ring)]
                if point in indices:
                    continue
                indices.append(point)
                normal = orient(Vector((dh*cos(angles[col]), -dr, -dh*sin(angles[col]))).normalized())
                normals.append(normal)
            form.face(indices, materials[level % len(materials)], normals if smooth else None)


def band(form, radius, bore, low, high, material, count=32, center=ZERO, front=False):
    lathe(form, [(radius, low), (radius, high), (bore, high), (bore, low)],
          [material], count, center, front)


def plate(form, outline, depth, center, bevel, material, bevel_mat=None, slope=0):
    """Extrude a CCW front silhouette with a narrow, plane-cut highlight at each lip."""
    half = depth / 2
    inset = []
    for idx, point in enumerate(outline):
        here = Vector(point)
        before = (here-Vector(outline[idx-1])).normalized()
        after = (Vector(outline[(idx+1) % len(outline)])-here).normalized()
        inward = Vector((-before.y-after.y, before.x+after.x)) / (1+before.dot(after))
        inset.append(tuple(here + inward*bevel))
    rings = []
    for shape, height in [(inset, -half), (outline, -half+bevel),
                          (outline, half-bevel), (inset, half)]:
        rings.append([form.vertex((center[0]+px, center[1]+py, center[2]+height+slope*py))
                      for px, py in shape])
    form.face(reversed(rings[0]), material)
    for idx, (lower, upper) in enumerate(zip(rings, rings[1:])):
        for col in range(len(lower)):
            other = (col+1) % len(lower)
            form.face([lower[col], lower[other], upper[other], upper[col]],
                      material if idx == 1 else bevel_mat or material)
    form.face(rings[-1], material)


def clipped(width, height, cut):
    right, top = width/2, height/2
    return [(-right+cut, -top), (right-cut, -top), (right, -top+cut),
            (right, top-cut), (right-cut, top), (-right+cut, top),
            (-right, top-cut), (-right, -top+cut)]


def panel(form, center, width, height, depth, cut, bevel, material, trim=None, slope=0):
    plate(form, clipped(width, height, cut), depth, center, bevel, material, trim, slope)


def strut(form, start, end, radius, material, sides=6, end_radius=None):
    delta = (Vector(end) - Vector(start)).normalized()
    base = Vector((0, 0, 1)) if abs(delta.z) < .9 else Vector((0, 1, 0))
    axis = delta.cross(base).normalized()
    ortho = delta.cross(axis)
    rings = []
    for point, size in [(start, radius), (end, end_radius if end_radius is not None else radius)]:
        rings.append([form.vertex(Vector(point) + size*(axis*cos(tau*idx/sides)+ortho*sin(tau*idx/sides)))
                      for idx in range(sides)])
    form.face(reversed(rings[0]), material)
    for idx in range(sides):
        other = (idx+1) % sides
        form.face([rings[0][idx], rings[0][other], rings[1][other], rings[1][idx]], material)
    form.face(rings[1], material)


def sector(form, inside, outside, angle, spread, height, depth, material, front=False, segments=1):
    rings = []
    for level in (height, height+depth):
        ring = []
        for idx in range(segments+1):
            theta = angle+spread*(idx/segments-.5)
            ring.append([form.vertex((rad*cos(theta), rad*sin(theta), level) if front else
                                     (rad*cos(theta), level, -rad*sin(theta))) for rad in (inside, outside)])
        rings.append(ring)
    bottom, top = rings
    for idx in range(segments):
        other = idx+1
        form.face([*top[idx], *reversed(top[other])], material)
        form.face([*bottom[other], *reversed(bottom[idx])], material)
        for col in (0, 1):
            quad = [bottom[idx][col], bottom[other][col], top[other][col], top[idx][col]]
            form.face(quad if col else reversed(quad), material)
    form.face([*bottom[0], *reversed(top[0])], material)
    form.face([*top[-1], *reversed(bottom[-1])], material)


def screen(name, parent, center, width, height, slope=0):
    shape = Form()
    for px, py in [(-1,-1), (1,-1), (1,1), (-1,1)]:
        shape.vertex((px*width/2, py*height/2, slope*py*height/2))
    shape.face(range(4), display)
    obj = shape.object(name, center, parent)
    layer = obj.data.uv_layers.new(name='Canvas')
    for loop, corner in enumerate([(0,1), (1,1), (1,0), (0,0)]):
        layer.uv[loop].vector = corner
    return obj


def crystal(form, levels, count, palette, seed, jag=.09, center=ZERO):
    """Unequal fracture planes triangulated between offset, irregular cut rings."""
    rng = Random(seed)
    rings = []
    for row, (height, radius) in enumerate(levels):
        ring = []
        for idx in range(count if radius else 1):
            angle = tau*(idx+.23*(row%2)+rng.uniform(-.09,.09))/count
            size = radius*(1-rng.random()*jag)
            lift = rng.uniform(-jag, jag) if 0 < row < len(levels)-1 and radius else 0
            ring.append(form.vertex((center[0]+size*cos(angle), center[1]+height+lift,
                                     center[2]-size*sin(angle))))
        rings.append(ring)
    for lower, upper in zip(rings, rings[1:]):
        for idx in range(count):
            other = (idx+1) % count
            corners = [lower[idx%len(lower)], lower[other%len(lower)], upper[other%len(upper)], upper[idx%len(upper)]]
            quad = list(dict.fromkeys(corners))
            for tri in ([quad] if len(quad)==3 else [quad[:3], [quad[0],quad[2],quad[3]]]):
                form.face(tri, rng.choice(palette))
    for ring, reverse in [(rings[0], True), (rings[-1], False)]:
        if len(ring)>1:
            form.face(reversed(ring) if reverse else ring, palette[0])
    return rings


def iceberg():
    white = finish('Firn porcelain', 'f1f5f9', .09, .22)
    frost = finish('Polar blue ice', 'c6e5f4', .12, .24)
    snow = Form()
    crystal(snow, [(0,.97),(.25,.79),(.55,.52),(1.28,0)], 11, [white,white,frost], 30,
            center=(.02,0,0))
    crystal(snow, [(0,.44),(.30,.34),(.83,0)], 7, [frost,white], 27, center=(-.51,0,.04))
    snow.object('SurfaceTip')
    water = finish('Pelagic glass', '38bdf8', .03, .08, glass=.82)
    shape = Form()
    band(shape, 2.32, 0, -.015, .015, water, 64)
    disk = shape.object('WaterDisk',repeat=4)
    shape = Form()
    lathe(shape, [(2.44,-.033),(2.46,-.015),(2.46,.010),(2.44,.028),(2.327,.028),
                  (2.315,.016),(2.315,-.02)], [steel,slate,edge,steel,gold,ink,slate], 64)
    bezel = shape.object('WaterRing', parent=disk,repeat=4)
    shape = Form()
    for idx in range(24):
        sector(shape, 2.337 if idx%3==0 else 2.37, 2.426, tau*idx/24,
               .014 if idx%3==0 else .009, .028, .004, amber if idx%6==0 else ink)
    shape.object('DegreeScale', parent=bezel,repeat=4)
    for idx, (pos, levels, color, tint) in enumerate([
            (-.52,[(-.44,1.12),(-.20,1.17),(.21,1.04),(.49,.91)],'0284c7','329fc6'),
            (-1.44,[(-.46,1.09),(-.21,1.40),(.16,1.46),(.48,1.12)],'0369a1','147d9f'),
            (-2.32,[(-.46,.35),(-.28,.68),(.04,.92),(.42,1.13)],'1e3a8a','244c7b')],1):
        body = finish('Glacial stratum '+str(idx),color,.15,.18 if idx==1 else .20,
                      glass=.28 if idx==3 else .08)
        vein = finish('Fracture shadow '+str(idx),tint,.16,.25)
        shape = Form()
        rings = crystal(shape, levels, 13, [body,body,body,vein], 75+idx)
        tier = shape.object('DeepTier_'+str(idx),(0,pos,0))
        if idx == 2:
            seams = Form()
            for col in [1,4,8,10]:
                for row in range(3):
                    start = shape.points[rings[row][col]]
                    col = (col + (row%2))%13
                    end = shape.points[rings[row+1][col]]
                    strut(seams, start, end, .008, cyan, 4)
            seams.object('Cryoclines', parent=tier)
        if idx == 3:
            jewel = Form()
            crystal(jewel,[(-.32,0),(-.09,.31),(.08,.34),(.32,0)],7,[cyan,cyan,amber],2,.025)
            jewel.object('AbyssCore',parent=tier)


def domino():
    shape = Form()
    obsidian = finish('Obsidian-slate', '111827', .35, .26)
    panel(shape,(0,.91,-.006),.92,1.82,.228,.069,.024,obsidian,slate)
    for sign in (-1,1):
        panel(shape,(sign*.434,.91,0),.038,1.56,.23,.014,.006,gold)
        for height in [.29,.34,1.48,1.53]:
            panel(shape,(sign*.434,height,.114),.034,.015,.008,.004,.002,ink)
    panel(shape,(0,.94,.106),.813,1.36,.022,.037,.004,ink,steel)
    for idx in range(5):
        panel(shape,((idx-2)*.065,.154,.109),.042,.017,.014,.006,.003,
              cyan if idx==2 else gold)
    unit = shape.object('DominoUnit')
    screen('ScreenSurface',unit,(0,.94,.126),.76,1.30)
    bar = Form()
    panel(bar,ZERO,.59,.043,.016,.016,.004,cyan)
    bar.object('TopBar',(0,1.72,.109),unit)
    shape = Form()
    for sign in [-1,1]:
        outline = [(.47,0),(.68,0),(.68,1.87),(.43,2.18),(.34,2.18),(.34,2.02),(.48,1.80)]
        outline = [(sign*px,py) for px,py in outline]
        plate(shape,outline if sign==1 else outline[::-1],.20,ZERO,.025,steel,edge)
        for idx in range(5):
            height=.26+idx*.31
            stripe=[(.504,height),(.648,height+.077),(.648,height+.127),(.504,height+.05)]
            stripe=[(sign*px,py) for px,py in stripe]
            plate(shape,stripe if sign==1 else stripe[::-1],.012,(0,0,.093),.003,gold)
    panel(shape,(0,2.085,0),.81,.19,.17,.05,.018,slate,gold)
    panel(shape,(0,.088,0),1.14,.176,.18,.046,.018,slate,steel)
    shield = shape.object('ShieldGate')
    energy=finish('Field glass','38bdf8',.08,.16,.40,.72)
    shape=Form()
    panel(shape,(0,1.085,0),1.01,1.96,.062,.18,.020,energy,cyan)
    for idx in range(3):
        height=1.05+idx*.14
        plate(shape,[(-.17,height+.08),(0,height),(.17,height+.08),(.17,height+.104),
                     (0,height+.031),(-.17,height+.104)],.008,(0,0,.032),.002,cyan)
    shape.object('ShieldCore',parent=shield)


def balance():
    shape=Form()
    lathe(shape,[(.80,-1.85),(.85,-1.80),(.85,-1.73),(.78,-1.69),(.76,-1.65),
                 (.68,-1.62),(.63,-1.50),(.57,-1.45),(0,-1.45),(0,-1.85)],
          [steel,slate,gold,ink,edge,slate,steel,slate,ink,ink],32)
    lathe(shape,[(.34,-1.46),(.34,-1.35),(.23,-1.28),(.19,.66),(.27,.74),(.22,.96),(0,.96),(0,-1.46)],
          [gold,steel,slate,steel,gold,slate,ink,ink],20)
    for idx in range(12):
        angle=tau*idx/12
        strut(shape,(.225*cos(angle),-1.29,.225*sin(angle)),(.183*cos(angle),.68,.183*sin(angle)),
              .023,steel,5,.015)
    pillar=shape.object('PillarBase',repeat=4)
    dial=(0,.96,.20)
    shape=Form()
    lathe(shape,[(.67,-.145),(.72,-.105),(.72,.036),(.693,.063),(.649,.063),
                 (.639,.048),(0,.048),(0,-.145)], [steel,slate,gold,steel,edge,ink,ink,ink],40,front=True)
    shape.object('DialHousing',dial,pillar,repeat=4,axis='z')
    graduations=Form()
    for idx in range(25):
        theta=pi*(.13+.74*idx/24)
        corners=[]
        for radius,angle in [(.544 if idx%4==0 else .575,theta-.009),(.608,theta-.009),
                             (.608,theta+.009),(.544 if idx%4==0 else .575,theta+.009)]:
            corners.append(graduations.vertex((radius*cos(angle),radius*sin(angle),.051)))
        graduations.face(corners,gold if idx%4==0 else edge)
    graduations.object('DialGraduations',dial,pillar)
    shape=Form()
    plate(shape,[(-.038,-.084),(.038,-.084),(.021,.38),(0,.566),(-.021,.38)],.021,ZERO,.004,gold)
    band(shape,.052,0,.013,.027,amber,12,front=True)
    shape.object('DialNeedle',(0,.96,.28))
    shape=Form()
    for sign in [-1,1]:
        for rail in (0,1):
            strut(shape,(sign*.11,.105 if rail else -.18,0),
                  (sign*1.84,-.01 if rail else -.092,0),.055 if rail else .042,steel,6)
        for idx in range(6):
            left=.17+idx*.26
            strut(shape,(sign*left,-.175+.048*left,0),(sign*(left+.24),.104-.060*(left+.24),0),
                  .023,gold,4)
        band(shape,.090,.041,-.07,.07,gold,16,(sign*1.84,-.04,0),True)
    band(shape,.17,0,-.16,.11,steel,24,front=True)
    beam=shape.object('BeamArm',(0,.96,0))
    for sign,side in [(-1,'Left'),(1,'Right')]:
        shape=Form()
        for depth in (-1,1):
            strut(shape,(0,-.015,depth*.055),(depth*.448,-.48,depth*.11),.026,gold,6)
            strut(shape,(depth*.448,-.48,depth*.11),(depth*.47,-1.32,depth*.11),.024,edge,6)
        lathe(shape,[(.35,-1.45),(.505,-1.37),(.51,-1.33),(.495,-1.305),
                     (.46,-1.32),(.345,-1.367),(0,-1.367),(0,-1.45)],
              [slate,gold,edge,gold,steel,slate,ink,ink],24)
        pan=shape.object(side+'PanPivot',(sign*1.84,-.04,0),beam)
        shape=Form()
        if sign<0:
            crimson=finish('Oxide crimson','a63546',.62,.29)
            panel(shape,ZERO,.86,.68,.68,.095,.045,crimson,steel)
            panel(shape,(0,0,.338),.711,.387,.018,.033,.004,ink,gold)
            weight=shape.object('LeftWeight',(0,-1.02,0),pan)
            screen('LeftSurface',weight,(0,0,.357),.65,.31)
        else:
            crystal(shape,[(-.31,0),(-.12,.32),(.04,.35),(.35,0)],7,[gold,gold,amber,cyan],8,.027)
            band(shape,.41,.385,-.037,-.014,gold,28,front=True)
            panel(shape,(0,-.075,.307),.59,.26,.052,.052,.009,slate,gold)
            core=shape.object('RightCore',(0,-1.04,0),pan)
            screen('RightSurface',core,(0,-.075,.343),.46,.162)


def funnel():
    glass=finish('Cobalt filter glass','449ed2',.035,.13,glass=.80)
    for idx,(height,lower,outer) in enumerate([(1.18,1.42,2.02),(.36,.84,1.34),(-.46,.30,.76)],1):
        shape=Form()
        low, high=-.36,.38 if idx==1 else .36
        if idx==2:
            lathe(shape,[(lower,low),(outer,high),(outer-.045,high),(lower-.036,low)],
                  [glass,edge,glass,steel],40)
            for col in range(8):
                angle=tau*col/8
                strut(shape,(lower*cos(angle),low,lower*sin(angle)),
                      (outer*cos(angle),high-.035,outer*sin(angle)),.026,edge)
        else:
            lathe(shape,[(lower,low),(lower+.025,low+.065),(outer-.08,high-.19),
                         (outer,high-.12),(outer,high-.03),(outer-.033,high),
                         (outer-.145,high),(outer-.17,high-.05),(lower-.105,low+.04),
                         (lower-.095,low)],
                  [gold,slate if idx==1 else steel,steel,slate,edge,steel,gold,slate,steel,ink],40)
        if idx==1:
            for col in range(16):
                angle=tau*col/16
                blade=[]
                for offset,radius,elevation in [(0,1.833,.303),(.11,1.79,.25),(.245,1.33,-.235),
                                                (.19,1.22,-.28),(.075,1.46,.035)]:
                    theta=angle+offset
                    blade.append((radius*cos(theta),elevation,-radius*sin(theta)))
                upper=[shape.vertex(point) for point in blade]
                lower_blade=[shape.vertex((px,py-.028,pz)) for px,py,pz in blade]
                for face in [(0,1,2),(0,2,4),(2,3,4)]:
                    shape.face([upper[key] for key in face],steel)
                    shape.face([lower_blade[key] for key in reversed(face)],slate)
                for key in range(5):
                    after=(key+1)%5
                    shape.face([upper[after],upper[key],lower_blade[key],lower_blade[after]],gold)
        if idx==3:
            for col in range(12):
                angle=tau*col/12
                strut(shape,(.34*cos(angle),-.28,.34*sin(angle)),
                      (.66*cos(angle),.19,.66*sin(angle)),.025,gold,5)
        tier=shape.object('FunnelTier_'+str(idx),(0,height,0),repeat=4)
        rim=Form()
        radius=outer-(.103 if idx!=2 else .018)
        band(rim,radius,radius-.023,high-.011,high+.001,cyan if idx<3 else amber,48)
        rim.object('RimGlow_'+str(idx),parent=tier,repeat=4)
    shape=Form()
    lathe(shape,[(1.13,-.26),(1.21,-.21),(1.21,-.12),(1.30,-.075),(1.36,.145),
                 (1.34,.214),(1.28,.24),(1.21,.215),(.98,.065),(.48,-.04),
                 (.40,-.055),(0,-.055),(0,-.26)],[steel,ink,gold,slate,steel,edge,gold,slate,steel,gold,ink,ink,ink],40)
    base=shape.object('CollectorBase',(0,-1.78,0),repeat=4)
    shape=Form()
    band(shape,.39,.31,-.051,-.038,amber,32)
    band(shape,.255,0,-.052,-.048,cyan,24)
    shape.object('BaseWell',parent=base,repeat=4)
    shape=Form()
    jewel=finish('Heliodor','ffc35c',.73,.17,.34)
    crystal(shape,[(-.33,0),(-.115,.315),(.085,.34),(.22,.24),(.33,0)],9,[jewel,jewel,gold,amber],16,.022)
    shape.object('GoldenCore',(0,-1.16,0))
    shape=Form()
    lathe(shape,[(.018,-.13),(.12,-.01),(.123,.01),(.018,.13),(0,.13),(0,-.13)],
          [steel,gold,edge,cyan,ink,ink],4,phase=pi/4,smooth=False)
    shape.object('RawShard')


def vault():
    shape=Form()
    lathe(shape,[(1.98,-.33),(2.02,-.27),(2.02,-.115),(1.98,-.065),
                 (1.54,-.065),(1.50,-.032),(1.39,-.032),(1.34,-.08),(1.34,-.33)],
          [steel,slate,edge,slate,steel,slate,gold,ink,slate],32,front=True,smooth=False)
    for idx,(px,py,pz) in enumerate(shape.points):
        radius=sqrt(px*px+py*py)
        if radius>1.9:
            ratio=radius/max(abs(px),abs(py),(.5*sqrt(2))*(abs(px)+abs(py))*.89)
            shape.points[idx]=(px*ratio,py*ratio,pz)
    frame=shape.object('VaultFrame',repeat=4,axis='z')
    shape=Form()
    for height in (-.85,.85):
        panel(shape,(-1.535,height,-.035),.42,.34,.155,.06,.027,steel)
        band(shape,.117,0,-.16,.16,steel,16,(-1.38,height,.12))
        band(shape,.121,0,-.106,-.078,gold,16,(-1.38,height,.12))
    shape.object('HingeMounts',parent=frame)
    shape=Form()
    for idx in range(8):
        angle=tau*(idx+.5)/8
        sector(shape,1.655,1.758,angle,.211,-.064,.015,ink,True,3)
        sector(shape,1.687,1.72,angle,.166,-.049,.008,cyan,True,3)
    shape.object('FrameLeds',parent=frame,repeat=8,axis='z')
    shape=Form()
    lathe(shape,[(1.49,-1.25),(1.49,-.05),(1.355,-.05),(1.355,-1.12),
                 (1.27,-1.18),(0,-1.18),(0,-1.25)],
          [slate,steel,ink,steel,slate,ink,slate],32,front=True)
    for depth in [-1.0,-.73,-.46]:
        lathe(shape,[(1.36,depth),(1.309,depth+.014),(1.309,depth+.045),(1.36,depth+.061)],
              [steel,slate,steel,ink],24,front=True)
    shape.object('VaultChamber',parent=frame,repeat=4,axis='z')
    pivot=bpy.data.objects.new('DoorPivot',None)
    bpy.context.collection.objects.link(pivot)
    pivot.location=blender((-1.38,0,.12))
    shape=Form()
    lathe(shape,[(1.25,-.13),(1.31,-.084),(1.31,.073),(1.274,.119),(1.18,.13),
                 (1.144,.115),(1.09,.105),(1.073,.116),(.53,.116),(.49,.124),
                 (0,.124),(0,-.13)],[steel,slate,steel,edge,gold,ink,edge,slate,gold,steel,ink,ink],40,front=True)
    for idx in range(12):
        angle=tau*(idx+.5)/12
        band(shape,.042,0,.121,.137,steel,6,(1.211*cos(angle),1.211*sin(angle),0),True)
    shape.object('DoorBody',(1.38,0,0),pivot,repeat=4,axis='z')
    for height in [-.85,.85]:
        knuckle=Form()
        band(knuckle,.105,0,-.18,.18,gold,16)
        panel(knuckle,(.21,0,-.027),.45,.15,.125,.032,.016,steel)
        knuckle.object('MovingHinge'+('Upper' if height>0 else 'Lower'),(0,height+(.355 if height<0 else -.355),0),pivot)
    shape=Form()
    for idx in range(6):
        angle=tau*idx/6
        def radial(radius,depth):
            return (radius*cos(angle),radius*sin(angle),depth)
        strut(shape,radial(.75,.122),radial(1.28,.122),.056,edge,10)
        strut(shape,radial(.90,.122),radial(1.00,.122),.078,gold,10)
    shape.object('LockBolts',(1.38,0,0),pivot,repeat=6,axis='z')
    shape=Form()
    lathe(shape,[(.735,-.025),(.767,.006),(.767,.061),(.732,.09),(.646,.09),
                 (.617,.061),(.617,.015),(.65,-.025)],[steel,slate,steel,gold,edge,slate,steel,ink],36,front=True)
    for idx in range(6):
        angle=tau*idx/6
        strut(shape,(.17*cos(angle-.22),.17*sin(angle-.22),.01),
              (.667*cos(angle),.667*sin(angle),.033),.048,steel,6,.067)
    shape.object('OuterWheel',(1.38,0,.16),pivot,repeat=6,axis='z')
    shape=Form()
    lathe(shape,[(.295,-.06),(.327,-.04),(.327,.032),(.292,.063),(.242,.063),
                 (.22,.047),(0,.047),(0,-.06)],[steel,ink,steel,gold,edge,slate,ink,ink],32,front=True)
    for idx in range(16):
        sector(shape,.26,.299,tau*idx/16,.065,.061,.008,amber if idx%4==0 else ink,True)
    shape.object('InnerWheel',(1.38,0,.23),pivot,repeat=4,axis='z')
    shape=Form()
    panel(shape,ZERO,1.62,1.04,.14,.11,.034,slate,gold)
    panel(shape,(0,0,.066),1.489,.899,.026,.061,.009,ink,edge)
    tablet=shape.object('RelicTablet',(0,0,-.58))
    screen('ScreenSurface',tablet,(0,0,.089),1.36,.76)
    shape=Form()
    band(shape,1.004,.986,-.13,-.11,gold,48,front=True)
    shape.object('RelicHalo',parent=tablet,repeat=4,axis='z')


def terrace(shape, profile, materials):
    rings=[]
    for width,height in profile:
        outline=clipped(width,width,width*.095)
        rings.append([shape.vertex((px,height,-py)) for px,py in outline])
    shape.face(reversed(rings[0]),materials[0])
    for idx,(low,high) in enumerate(zip(rings,rings[1:])):
        for side in range(8):
            after=(side+1)%8
            shape.face([low[side],low[after],high[after],high[side]],materials[idx%len(materials)])
    shape.face(rings[-1],materials[-1])


def pyramid():
    for idx,(height,width,half,label_w,label_h) in enumerate([
            (-1.24,3.42,.36,2.10,.44),(-.50,2.54,.34,1.64,.42),(.22,1.70,.34,1.18,.40)],1):
        shape=Form()
        terrace(shape,[(width-.12,-half),(width,-half+.049),(width,-half+.093),
                       (width-.043,-half+.12),(width-.053,-half+.156),
                       (width-.205,half-.085),(width-.182,half-.067),
                       (width-.182,half-.026),(width-.248,half)],
                [steel,slate,gold,ink,slate,steel,ink,edge,steel])
        slope=-.152/2/(2*half-.241)
        zface=(width-.053)/2+slope*(half-.156)
        cy=.018
        cz=zface+slope*cy
        panel(shape,(0,cy,cz+.012),label_w+.12,label_h+.071,.031,.037,.009,ink,gold,slope)
        for sign in (-1,1):
            if idx==3:
                continue
            for col in range(3):
                px=sign*(label_w/2+.126+col*.061)
                panel(shape,(px,cy,cz+.012),.026,.142-.026*col,.020,.009,.003,steel,None,slope)
        body=shape.object('PyramidTier_'+str(idx),(0,height,0))
        screen('ScreenSurface_'+str(idx),body,(0,cy,cz+.0375),label_w,label_h,slope)
        rim=Form()
        terrace(rim,[(width-.036,-half+.113),(width-.036,-half+.132)],
                [cyan if idx!=2 else amber])
        rim.object('TierRim_'+str(idx),parent=body)
    shape=Form()
    glass=finish('Citrine optical glass','ffd486',.04,.097,glass=.88)
    vertices=[(-.52,-.50,.52),(.52,-.50,.52),(.52,-.50,-.52),(-.52,-.50,-.52)]
    top=(0,.56,0)
    for point in vertices+[top]:
        shape.vertex(point)
    shape.face([3,2,1,0],glass)
    for idx in range(4):
        other=(idx+1)%4
        shape.face([idx,other,4],glass)
        strut(shape,vertices[idx],vertices[other],.019,gold,6)
        strut(shape,vertices[idx],top,.018,gold,5,.005)
    crown=shape.object('ApexCrown',(0,1.14,0))
    shape=Form()
    crystal(shape,[(-.36,0),(-.19,.22),(-.09,.218),(.205,0)],8,[amber,gold,amber],9,.013)
    shape.object('ApexCore',parent=crown)


repeats={}


def compact(path):
    """Pack smooth normals as SNORM8; retain float positions, UVs and all joint transforms."""
    raw=path.read_bytes()
    end=20+struct.unpack_from('<I',raw,12)[0]
    doc=json.loads(raw[20:end])
    binary=raw[end+8:]
    views=doc['bufferViews']
    chunks=[binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']] for view in views]
    normals={prim['attributes']['NORMAL'] for mesh in doc['meshes'] for prim in mesh['primitives']}
    for idx,accessor in enumerate(doc['accessors']):
        view=accessor['bufferView']
        if idx in normals:
            assert accessor['componentType']==5126 and len(chunks[view])==accessor['count']*12
            chunks[view]=b''.join(struct.pack('<3bx',*(round(max(-1,min(1,num))*127) for num in values))
                                  for values in struct.iter_unpack('<3f',chunks[view]))
            accessor.update(componentType=5120,normalized=True)
            views[view]['byteStride']=4
        elif accessor['type']=='SCALAR' and accessor['componentType']==5123:
            values=[entry[0] for entry in struct.iter_unpack('<H',chunks[view])]
            if max(values)<=255:
                chunks[view]=bytes(values)
                accessor['componentType']=5121
    for key in ['extensionsUsed','extensionsRequired']:
        doc.setdefault(key,[]).append('KHR_mesh_quantization')
        if repeats:
            doc[key].append('EXT_mesh_gpu_instancing')
    rotations={}
    for node in doc['nodes']:
        if node['name'] not in repeats:
            continue
        key=repeats[node['name']]
        if key not in rotations:
            count,axis=key
            quaternions=[]
            for idx in range(count):
                angle=pi*idx/count
                quaternions.append((0,sin(angle) if axis=='y' else 0,sin(angle) if axis=='z' else 0,cos(angle)))
            rotations[key]=len(doc['accessors'])
            doc['accessors'].append(dict(bufferView=len(views),componentType=5126,count=count,type='VEC4'))
            views.append(dict(buffer=0))
            chunks.append(b''.join(struct.pack('<4f',*quat) for quat in quaternions))
        node.setdefault('extensions',{})['EXT_mesh_gpu_instancing']={'attributes':{'ROTATION':rotations[key]}}
    doc['asset']['copyright']='Original procedural geometry and materials dedicated to the public domain under CC0-1.0.'
    output=bytearray()
    for view,chunk in zip(views,chunks):
        view.update(byteOffset=len(output),byteLength=len(chunk))
        output.extend(chunk)
        output.extend(b'\0'*(-len(output)%4))
    doc['buffers'][0]['byteLength']=len(output)
    header=json.dumps(doc,separators=(',',':')).encode()
    header+=b' '*(-len(header)%4)
    path.write_bytes(struct.pack('<4sIIII',b'glTF',2,28+len(header)+len(output),len(header),0x4e4f534a)
                     +header+struct.pack('<I4s',len(output),b'BIN\0')+output)


for filename,build in [('iceberg',iceberg),('domino-arc',domino),('balance-scale',balance),
                       ('vortex-funnel',funnel),('cyber-vault',vault),('tier-pyramid',pyramid)]:
    reset()
    build()
    path=OUT/(filename+'.glb')
    status=bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,
                                     export_apply=False,export_animations=False,export_cameras=False,
                                     export_lights=False,export_extras=False)
    assert status=={'FINISHED'}
    compact(path)
    print(f'{filename}: {path.stat().st_size:,} bytes')
