"""Build the six offline hardware assets in Blender. All design dimensions are in glTF space."""

from pathlib import Path
from math import cos, sin, pi, tau
import json
import struct
import bpy
from mathutils import Vector


OUT = Path(__file__).resolve().parent
PALETTE = {
    'GoldPin': ('eab308', .92, .22), 'PCBMat': ('102a24', .15, .42),
    'DieMat': ('0f172a', .86, .12), 'AluSilver': ('cbd5e1', .84, .25),
    'TitaniumMat': ('d4d8e0', .78, .26), 'LabelMat': ('d4d8e0', .78, .26),
    'ChassisAlu': ('d2d6de', .82, .26), 'KeyMat': ('1e222b', .04, .48),
    'TrackpadMat': ('c6cbd4', .58, .22), 'BezelMat': ('0b0d12', .15, .14),
    'Socket': ('181b22', .2, .35), 'ScreenMat': ('171e28', .12, .28),
    'SmokePC': ('334155', 0, .25), 'ClearPC': ('cbd5e1', 0, .18),
    'StemOrange': ('ea580c', .04, .32), 'KeycapPBT': ('f8fafc', 0, .36),
    'RackMetal': ('1e2430', .78, .32), 'LedMat': ('22c55e', .08, .22),
    'CrystalGlass': ('e0f2fe', .05, .06), 'CoreGem': ('f97316', .3, .15),
    'CircuitEdge': ('506759', .42, .38), 'PilotLight': ('ffe4ac', .4, .24),
}


def material(name):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    hexcolor, metal, rough = PALETTE[name]
    rgb = [int(hexcolor[pos:pos+2], 16) / 255 for pos in (0, 2, 4)]
    color = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb] + [1]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = color
    mat.use_backface_culling = True
    shader = mat.node_tree.nodes.get('Principled BSDF').inputs
    for prop, val in [('Base Color', color), ('Metallic', metal), ('Roughness', rough)]:
        shader[prop].default_value = val
    if name in ('ClearPC', 'SmokePC', 'CrystalGlass'):
        shader['Transmission Weight'].default_value = {'ClearPC': .63, 'SmokePC': .35, 'CrystalGlass': .94}[name]
        shader['IOR'].default_value = 1.52
    if name in ('LedMat', 'CoreGem', 'PilotLight'):
        shader['Emission Color'].default_value = color
        shader['Emission Strength'].default_value = 1.0 if name == 'CoreGem' else 2.0
    if name in ('TitaniumMat', 'LabelMat'):
        next(socket for socket in shader if socket.name.startswith('Anisotrop') and 'Rotation' not in socket.name).default_value = .32
    return mat


def blender(point):
    return point[0], -point[2], point[1]


def node(name, data=None, parent=None, pos=(0, 0, 0)):
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = blender(pos)
    return obj


def mesh(name, points, faces, mat, parent=None, pos=(0, 0, 0), smooth=True):
    data = bpy.data.meshes.new(name)
    data.from_pydata([blender(point) for point in points], [], faces)
    data.update()
    data.materials.append(material(mat))
    if smooth:
        for poly in data.polygons:
            poly.use_smooth = True
        data.set_sharp_from_angle(angle=pi * .31)
    return node(name, data, parent, pos)


def mapped(horizontal, vertical, depth, axis):
    return {'top': (horizontal, depth, -vertical), 'front': (horizontal, vertical, depth),
            'side': (-depth, vertical, horizontal)}[axis]


def circle(radius, samples, phase=0):
    return [(radius * cos(phase + tau * idx / samples), radius * sin(phase + tau * idx / samples))
            for idx in range(samples)]


def outline(width, height, radius, samples):
    result = []
    for corner, (sx, sy) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
        for idx in range(samples + 1):
            angle = (corner + idx / samples) * pi / 2
            result.append((sx * (width / 2 - radius) + radius * cos(angle),
                           sy * (height / 2 - radius) + radius * sin(angle)))
    return result


def loft(name, rings, mat, parent=None, pos=(0, 0, 0), axis='top', hollow=False, smooth=True):
    count = len(rings[0][0])
    points = [mapped(horizontal, vertical, depth, axis) for path, depth in rings for horizontal, vertical in path]
    faces = []
    for level in range(len(rings) if hollow else len(rings)-1):
        lower, upper = level * count, ((level+1) % len(rings)) * count
        for idx in range(count):
            after = (idx + 1) % count
            faces.append((lower+idx, lower+after, upper+after, upper+idx))
    if not hollow:
        faces.extend([tuple(reversed(range(count))), tuple(range(len(points)-count, len(points)))])
    return mesh(name, points, faces, mat, parent, pos, smooth)


def rect(name, sections, mat, parent=None, pos=(0, 0, 0), axis='top', hollow=False, samples=3):
    return loft(name, [(outline(width, height, radius, samples), depth) for width, height, radius, depth in sections],
                mat, parent, pos, axis, hollow)


def block(name, width, height, thick, radius, bevel, mat, parent=None, pos=(0, 0, 0), axis='top', samples=3):
    return rect(name, [(width-2*inset, height-2*inset, max(radius-inset, .0001), depth)
                       for inset, depth in ((bevel, -thick/2), (0, -thick/2+bevel),
                                             (0, thick/2-bevel), (bevel, thick/2))],
                mat, parent, pos, axis, samples=samples)


def turned(name, profile, mat, parent=None, pos=(0, 0, 0), axis='top', samples=32, hollow=True):
    return loft(name, [(circle(radius, samples), depth) for radius, depth in profile],
                mat, parent, pos, axis, hollow)


def copies(source, placements, stem=None):
    for idx, pos in enumerate(placements):
        node(f'{stem or source.name}_{idx+2:02}', source.data, source.parent, pos)


def screen(parent, width, height, pos, axis='top', name='ScreenSurface', mat='ScreenMat'):
    corners = [(0, 0), (1, 0), (1, 1), (0, 1)]
    obj = mesh(name, [mapped((right-.5)*width, (up-.5)*height, 0, axis) for right, up in corners],
               [(0, 1, 2, 3)], mat, parent, pos, False)
    uv = obj.data.uv_layers.new(name='PrintUV')
    for loop in obj.data.loops:
        right, up = corners[loop.vertex_index]
        uv.data[loop.index].uv = (right, 1-up)


def subtract(target, cutter):
    bpy.context.view_layer.objects.active = target
    mod = target.modifiers.new('Machined pocket', 'BOOLEAN')
    mod.operation, mod.solver, mod.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    target.data.set_sharp_from_angle(angle=.75)


def chip():
    pins = node('BasePins', pos=(0, -.21, 0))
    sites = [(col*.34, 0, row*.34) for row in range(-4, 5) for col in range(-4, 5)]
    pin = turned('BGA_A1', [(.064, 0), (.094, .019), (.101, .038), (.099, .055), (.078, .082)],
                 'GoldPin', pins, sites[0], samples=12, hollow=False)
    copies(pin, sites[1:], 'BGA')
    board = block('SubstratePCB', 3.2, 3.2, .10, .115, .012, 'PCBMat', pos=(0, -.078, 0), samples=5)
    for idx, side in enumerate((3.12, 3.065)):
        rect(f'GuardTrace_{idx+1}', [(side, side, .12, .05), (side, side, .12, .0525),
                                     (side-.014, side-.014, .113, .0525), (side-.014, side-.014, .113, .05)],
             'GoldPin', board, hollow=True)
    for idx, depth in enumerate((-.025, -.012)):
        rect(f'Laminate_{idx+1}', [(3.201, 3.201, .115, depth), (3.201, 3.201, .115, depth+.004)],
             'CircuitEdge', board)
    sites = [(sx*(1.42-.115*idx), .066, sz*1.484) for sx in (-1, 1) for sz in (-1, 1) for idx in range(3)]
    cap = block('SMD_Termination', .085, .055, .028, .009, .004, 'GoldPin', board, sites[0], samples=1)
    copies(cap, sites[1:])
    sites = [(px, py+.002, pz) for px, py, pz in sites]
    resistor = block('SMD_Ceramic', .048, .057, .03, .007, .003, 'Socket', board, sites[0], samples=1)
    copies(resistor, sites[1:])
    die = block('SiliconDie', 1.76, 1.76, .08, .055, .012, 'DieMat', pos=(0, .012, 0))
    screen(die, 1.66, 1.66, (0, .0402, 0))
    frame = rect('ThermalFrame', [(2.934, 2.934, .14, -.035), (2.96, 2.96, .15, -.022),
                                 (2.96, 2.96, .15, .023), (2.936, 2.936, .138, .035),
                                 (1.946, 1.946, .078, .035), (1.92, 1.92, .065, .022),
                                 (1.92, 1.92, .065, -.035)], 'AluSilver', pos=(0, .065, 0), hollow=True)
    for sx in (-1, 1):
        for sz in (-1, 1):
            hole = turned('Tool', [(.064, -.06), (.064, .02), (.082, .035), (.082, .06)], 'AluSilver',
                          frame, (sx*1.27, 0, sz*1.27), samples=16, hollow=False)
            subtract(frame, hole)
            turned(f'Standoff_{sx}_{sz}', [(.125, -.093), (.125, -.035), (.067, -.035), (.067, -.093)],
                   'AluSilver', frame, (sx*1.27, 0, sz*1.27), samples=12)
    lid = rect('HeatspreaderLid', [(2.83, 2.83, .18, -.055), (2.86, 2.86, .19, -.04),
                                   (2.86, 2.86, .19, -.011), (2.835, 2.835, .18, 0),
                                   (2.64, 2.64, .24, 0), (2.56, 2.56, .225, .043),
                                   (2.52, 2.52, .21, .055)], 'TitaniumMat', pos=(0, .155, 0), samples=5)
    screen(lid, 2.1, 2.1, (0, .0552, 0), name='LidLabelSurface', mat='LabelMat')


def laptop():
    deck = block('BaseDeck', 4.2, 2.8, .10, .16, .016, 'ChassisAlu', samples=7)
    for vert in deck.data.vertices:
        if vert.co.z < 0:
            vert.co.z += .019 * (.5 - vert.co.y / 2.8)
    for width, height, depth, radius, front in [(3.42, 1.21, .021, .074, -.495), (1.64, .78, .035, .075, .738)]:
        subtract(deck, block('PocketTool', width, height, .12, radius, .006, 'Socket',
                             pos=(0, depth+.06, front), samples=5))
    tool = turned('ThumbScoop', [(.48, .009), (.52, .023), (.54, .065)], 'Socket',
                  pos=(0, 0, 1.51), samples=48, hollow=False)
    tool.scale.y = .37
    subtract(deck, tool)
    block('KeyboardWell', 3.407, 1.197, .009, .07, .002, 'Socket', deck, (0, .025, -.495))
    positions = [(col*.255, .029, -.495+row*.228) for row in range(-2, 3) for col in range(-6, 7)]
    key = rect('Key_01', [(.229, .198, .03, 0), (.235, .204, .033, .005), (.224, .193, .031, .017),
                          (.208, .177, .028, .021), (.16, .134, .023, .0188)],
               'KeyMat', deck, positions[0], samples=2)
    copies(key, positions[1:], 'Key')
    block('Trackpad', 1.626, .766, .011, .068, .003, 'TrackpadMat', deck, (0, .0425, .738), samples=5)
    for sign in (-1, 1):
        for idx, (front, span) in enumerate(((-.91, .205), (-.59, .205), (-.27, .30))):
            subtract(deck, block('PortTool', span, .039, .10, .017, .004, 'Socket',
                                 pos=(sign*2.09, .004, front), axis='side'))
            block(f'PortLiner_{sign}_{idx}', span-.008, .034, .008, .014, .002, 'Socket', deck,
                  (sign*2.049, .004, front), 'side', 2)
    pivot = node('LidPivot', pos=(0, .055, -1.36))
    block('LidShell', 4.2, 2.76, .055, .155, .012, 'ChassisAlu', pivot, (0, 1.38, -.024), 'front', 6)
    block('DisplayBezel', 4.15, 2.70, .007, .136, .002, 'BezelMat', pivot, (0, 1.38, .0006), 'front', 5)
    screen(pivot, 3.96, 2.48, (0, 1.392, .0043), 'front')
    block('CameraNotch', .32, .078, .007, .024, .002, 'BezelMat', pivot, (0, 2.626, .007), 'front')
    turned('FaceTimeLens', [(.015, 0), (.018, .002), (.012, .004)], 'DieMat', pivot,
           (0, 2.618, .0105), 'front', 16, False)
    for sign in (-1, 1):
        turned(f'HingeClutch_{sign}', [(.041, -.25), (.044, -.245), (.044, .245), (.041, .25)],
               'Socket', deck, (sign*1.33, .055, -1.36), 'side', 20, False)


def spring():
    turns, steps, sides, wire, radius, height = 6.5, 130, 7, .027, .285, .80
    points, faces = [], []
    for idx in range(steps+1):
        angle = turns*tau*idx/steps
        radial = Vector((cos(angle), 0, sin(angle)))
        tangent = Vector((-radius*sin(angle), height/(turns*tau), radius*cos(angle))).normalized()
        cross = tangent.cross(radial)
        center = radius*radial + Vector((0, wire + height*idx/steps, 0))
        for side in range(sides):
            phase = tau*side/sides
            points.append(center + wire*(radial*cos(phase) + cross*sin(phase)))
    bottom = min(point.y for point in points)
    for point in points:
        point.y -= bottom
    for idx in range(steps):
        for side in range(sides):
            start, after = idx*sides + side, idx*sides + (side+1)%sides
            faces.append((start, after, after+sides, start+sides))
    faces += [tuple(reversed(range(sides))), tuple(range(steps*sides, (steps+1)*sides))]
    return mesh('CoilSpring', points, faces, 'GoldPin', pos=(0, -.86, 0))


def keycap():
    bottom = rect('BottomHousing', [(1.77, 1.77, .14, 0), (1.85, 1.85, .16, .055),
                                    (1.85, 1.85, .16, .27), (1.77, 1.77, .14, .33),
                                    (1.74, 1.74, .13, .455), (1.54, 1.54, .095, .455), (1.48, 1.48, .085, .16)],
                  'SmokePC', pos=(0, -1.075, 0))
    turned('SpringSeat', [(.34, 0), (.34, .075), (.313, .086), (.307, .037), (.24, .037),
                          (.22, .085), (.20, .085), (.20, 0)], 'SmokePC', bottom, (0, .177, 0), samples=20)
    for idx, sign in enumerate((-1, 1)):
        leaf = [(-.38, 0), (.32, 0), (.36, .055), (.22, .48), (.09, .57), (.08, .535),
                (.18, .451), (.30, .047), (-.38, .045)]
        loft(f'ContactLeaf_{idx+1}', [(leaf, -.052), (leaf, .052)], 'GoldPin', bottom,
             (sign*.25, .16, sign*.49), 'front', smooth=False)
    spring()
    stem = block('CrossStem', .89, .79, .18, .095, .033, 'StemOrange', pos=(0, .035, 0))
    arm, reach = .092, .286
    cross = [(arm, arm), (arm, reach), (-arm, reach), (-arm, arm), (-reach, arm), (-reach, -arm),
             (-arm, -arm), (-arm, -reach), (arm, -reach), (arm, -arm), (reach, -arm), (reach, arm)]
    loft('MXCross', [([(px*scale, py*scale) for px, py in cross], depth)
                     for scale, depth in [(1, .082), (1, .415), (.925, .442)]], 'StemOrange', stem,
         smooth=False)
    for sign in (-1, 1):
        block(f'SliderRail_{sign}', .088, .66, .36, .03, .018, 'StemOrange', stem, (sign*.411, .10, 0))
    top = rect('TopHousing', [(1.79, 1.79, .16, 0), (1.83, 1.83, .16, .035),
                              (1.81, 1.81, .15, .12), (1.57, 1.57, .13, .46),
                              (1.52, 1.52, .12, .48), (1.045, 1.02, .07, .48),
                              (1.02, 1.0, .06, .456), (1.02, 1.0, .06, 0)],
               'ClearPC', pos=(0, -.62, 0), hollow=True)
    for sx in (-1, 1):
        for sz in (-1, 1):
            rect(f'SnapHook_{sx}_{sz}', [(.18, .095, .016, -.19), (.18, .145, .018, -.14),
                                         (.18, .10, .018, -.12), (.18, .10, .018, .06)],
                 'ClearPC', top, (sx*.66, 0, sz*.802), samples=1)
    block('LightPipe', .49, .15, .19, .055, .021, 'ClearPC', top, (0, .18, .857), 'front')
    PALETTE['LedMat'] = ('38bdf8', .08, .22)
    block('RGBLed', .31, .084, .08, .036, .012, 'LedMat', top, (0, .18, .926), 'front')
    cap = rect('SculptedKeycap', [(1.49, 1.49, .13, .014), (1.73, 1.73, .16, .014),
                                  (1.80, 1.80, .17, .05), (1.79, 1.79, .17, .13),
                                  (1.57, 1.57, .17, .68), (1.525, 1.525, .16, .72),
                                  (1.478, 1.478, .15, .725), (1.414, 1.414, .13, .71),
                                  (1.32, 1.32, .075, .69), (1.207, 1.207, .012, .68)],
               'KeycapPBT', pos=(0, .35, 0), samples=4)
    subtract(cap, rect('SkirtTool', [(1.51, 1.51, .13, -.04), (1.51, 1.51, .13, .06),
                                     (1.32, 1.32, .11, .545)], 'KeycapPBT', cap))
    rect('StemSocket', [(.67, .67, .13, .071), (.67, .67, .13, .55), (.605, .605, .04, .55),
                        (.605, .605, .04, .071)], 'KeycapPBT', cap, hollow=True)
    PALETTE['ScreenMat'] = PALETTE['KeycapPBT']
    screen(cap, 1.18, 1.18, (0, .6802, 0))


def rack():
    PALETTE['ScreenMat'] = ('171e28', .12, .28)
    frame = node('RackFrame')
    for sign in (-1, 1):
        block(f'Armor_{sign}', 2.90, 2.40, .19, .16, .046, 'RackMetal', frame, (0, sign*1.805, 0))
        for front in (-1.03, 1.03):
            block(f'Upright_{sign}_{front}', .165, .19, 3.43, .035, .017, 'RackMetal', frame, (sign*1.351, 0, front))
        block(f'CableRail_{sign}', .045, .09, 3.33, .019, .008, 'AluSilver', frame, (sign*1.344, 0, 1.138))
        sites = [(sign*1.366, -.165*idx, 0) for idx in range(-10, 11)]
        fin = rect(f'SideLouver_{sign}', [(.084, 1.97, .027, -.031), (.084, 1.97, .027, -.004),
                                          (.046, 1.94, .014, .032)], 'RackMetal', frame, sites[0], samples=1)
        copies(fin, sites[1:])
    PALETTE['LedMat'] = ('22c55e', .08, .22)
    blade = block('Blade_1', 2.53, 2.23, .777, .073, .032, 'RackMetal', pos=(0, 1.2585, -.01))
    block('IntakeFascia', 2.51, .736, .055, .071, .013, 'Socket', blade, (0, 0, 1.111), 'front')
    block('IDSurround', 1.155, .368, .022, .041, .008, 'RackMetal', blade, (-.489, -.018, 1.145), 'front')
    screen(blade, 1.10, .32, (-.489, -.018, 1.1562), 'front', 'ScreenSurface_1')
    for sign in (-1, 1):
        rect(f'PullEar_{sign}', [(.128, .562, .046, -.065), (.134, .562, .048, -.045),
                                 (.134, .54, .048, .052), (.119, .523, .044, .065),
                                 (.063, .418, .029, .065), (.054, .409, .025, .053),
                                 (.054, .409, .025, -.065)], 'AluSilver', blade,
             (sign*1.153, 0, 1.144), 'front', True)
    sites = [(.561, idx*.072, 1.145) for idx in range(-4, 5)]
    slat = block('IntakeVane', .864, .027, .037, .011, .004, 'RackMetal', blade, sites[0], 'front', 2)
    copies(slat, sites[1:])
    for sign in (-1, 1):
        sites = [(-.937+.117*idx, sign*.259, 1.142) for idx in range(9)]
        rib = block(f'Punch_{sign}', .086, .018, .009, .006, .003, 'RackMetal', blade, sites[0], 'front', 1)
        copies(rib, sites[1:])
    block('Led_1', .035, .218, .018, .016, .004, 'LedMat', blade, (1.043, .11, 1.142), 'front')
    for vert in blade.data.vertices:
        vert.co.y += .047
    for part in blade.children:
        part.location.y += .047
    blade.location.y -= .047
    for idx in range(2, 5):
        clone = node(f'Blade_{idx}', blade.data, pos=(0, 1.2585-(idx-1)*.839, .037))
        for part in blade.children:
            name = part.name.replace('_1', f'_{idx}') if part.name in ('Led_1', 'ScreenSurface_1') else f'{part.name}_B{idx}'
            dup = node(name, part.data, clone)
            dup.location = part.location


def prism():
    base = turned('PedestalRing', [(1.07, 0), (1.14, .045), (1.16, .068), (1.16, .147), (1.14, .177),
                                  (1.10, .19), (.69, .19), (.665, .16), (.665, .036), (.70, 0)],
                  'AluSilver', pos=(0, -1.4, 0), samples=56)
    turned('Isolator', [(.91, .187), (.91, .244), (.73, .244), (.73, .187)], 'RackMetal', base, samples=48)
    turned('FloatingCrown', [(1.025, .236), (1.073, .265), (1.073, .307), (1.034, .338),
                             (.786, .338), (.76, .313), (.76, .236)], 'GoldPin', base, samples=56)
    turned('GuideLight', [(.815, .337), (.813, .342), (.798, .342), (.796, .337)], 'PilotLight', base, samples=64)
    tri = circle(.96, 3, pi/2)
    def cut_triangle(radius_scale, trim):
        return [((px*(1-trim)+tri[other][0]*trim)*radius_scale, (py*(1-trim)+tri[other][1]*trim)*radius_scale)
                for idx, (px, py) in enumerate(tri) for other in ((idx-1)%3, (idx+1)%3)]
    loft('CrystalPrism', [(cut_triangle(.936, .013), -1.19), (cut_triangle(1, .025), -1.148),
                          (cut_triangle(1, .025), 1.148), (cut_triangle(.936, .013), 1.19)],
         'CrystalGlass', pos=(0, .21, 0), smooth=False)
    points = [(0, .68, 0), (.376, .21, 0), (0, .21, .376), (-.376, .21, 0), (0, .21, -.376), (0, -.26, 0)]
    faces = [(0, 1+(idx+1)%4, 1+idx) for idx in range(4)] + [(5, 1+idx, 1+(idx+1)%4) for idx in range(4)]
    mesh('InnerCore', [(px, py-.21, pz) for px, py, pz in points], faces, 'CoreGem', pos=(0, .21, 0), smooth=False)


def gyro():
    outer = turned('OuterRing', [(1.634, -.133), (1.669, -.108), (1.675, -.083), (1.675, .092),
                                (1.645, .127), (1.484, .127), (1.45, .092), (1.45, -.094), (1.486, -.133)],
                   'AluSilver', axis='front', samples=64)
    for idx in range(12):
        angle = idx*tau/12
        pos = (1.581*sin(angle), 1.581*cos(angle), .126)
        if idx == 0:
            tick = block('Index_00', .066, .229, .043, .018, .009, 'RackMetal', outer, pos, 'front', 2)
        else:
            marker = node(f'Index_{idx:02}', tick.data, outer, pos)
            marker.rotation_euler.y = angle
    mid = turned('MidRing', [(1.359, -.086), (1.395, -.057), (1.395, .057), (1.359, .086),
                             (1.226, .086), (1.203, .059), (1.203, -.059), (1.226, -.086)],
                 'RackMetal', outer, axis='side', samples=56)
    for sign in (-1, 1):
        turned(f'Trunnion_{sign}', [(.099, -.102), (.125, -.08), (.125, .08), (.099, .102)],
               'AluSilver', mid, (0, sign*1.416, 0), samples=20, hollow=False)
    inner = turned('InnerRing', [(1.095, -.061), (1.118, -.039), (1.118, .039), (1.095, .061),
                                (.994, .061), (.97, .039), (.97, -.039), (.994, -.061)],
                   'GoldPin', mid, samples=48)
    for sign in (-1, 1):
        turned(f'RotorJournal_{sign}', [(.071, -.07), (.087, -.057), (.087, .057), (.071, .07)],
               'GoldPin', inner, (0, 0, sign*1.16), 'front', 16, False)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=.74)
    source = bpy.context.object
    points, faces, slots = [], [], []
    for poly in source.data.polygons:
        verts = [source.data.vertices[idx].co.copy() for idx in poly.vertices]
        center = sum(verts, Vector())/3
        for scale, lift in [(1, 0), (.91, .026), (.74, .026), (.695, .009)]:
            for vert in verts:
                game = center+(vert-center)*scale+poly.normal*lift
                points.append((game.x, game.z, -game.y))
        start = len(points)-12
        for level in range(3):
            for idx in range(3):
                near, far = start+level*3, start+(level+1)*3
                faces.append((near+idx, near+(idx+1)%3, far+(idx+1)%3, far+idx))
                slots.append(0)
        faces.append((start+9, start+10, start+11))
        slots.append(1)
    bpy.data.objects.remove(source, do_unlink=True)
    core = mesh('CorePoly', points, faces, 'DieMat', inner, smooth=False)
    core.data.materials.append(material('CoreGem'))
    for poly, slot in zip(core.data.polygons, slots):
        poly.material_index = slot


def pack(path):
    """Keep float32 positions and application pivots; batch only repeated static leaf details."""
    raw = path.read_bytes()
    json_end = 20 + struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:json_end])
    old = raw[json_end+8:]
    views, accs, nodes = doc['bufferViews'], doc['accessors'], doc['nodes']
    blocks = [old[v.get('byteOffset', 0):v.get('byteOffset', 0)+v['byteLength']] for v in views]

    def extension(name, required):
        for key in (['extensionsUsed', 'extensionsRequired'] if required else ['extensionsUsed']):
            if name not in doc.setdefault(key, []):
                doc[key].append(name)

    for acc in accs:
        view_id = acc['bufferView']
        src = blocks[view_id]
        if acc['type'] == 'SCALAR' and acc['componentType'] == 5123 and max(struct.unpack(f'<{len(src)//2}H', src)) <= 255:
            blocks[view_id] = src[::2]
            acc['componentType'] = 5121
    normals = {prim['attributes']['NORMAL'] for obj in doc['meshes'] for prim in obj['primitives']}
    for index in normals:
        acc = accs[index]
        view_id = acc['bufferView']
        src = blocks[view_id]
        blocks[view_id] = b''.join(struct.pack('<3bx', *(round(max(-1, min(1, v))*127) for v in normal))
                                   for normal in struct.iter_unpack('<3f', src))
        acc.update(componentType=5120, normalized=True)
        views[view_id]['byteStride'] = 4
    extension('KHR_mesh_quantization', True)

    removed = set()
    for parent in nodes:
        by_mesh = {}
        for index in parent.get('children', []):
            child = nodes[index]
            if set(child) <= {'name', 'mesh', 'translation'} and 'mesh' in child:
                by_mesh.setdefault(child['mesh'], []).append(index)
        for indices in by_mesh.values():
            if len(indices) < 5:
                continue
            offsets = [nodes[idx].get('translation', [0, 0, 0]) for idx in indices]
            blocks.append(b''.join(struct.pack('<3f', *coords) for coords in offsets))
            accs.append(dict(bufferView=len(views), componentType=5126, count=len(indices), type='VEC3',
                             min=list(map(min, zip(*offsets))), max=list(map(max, zip(*offsets)))))
            views.append(dict(buffer=0, target=34962))
            batch = nodes[indices[0]]
            if parent['name'] == 'BasePins':
                batch['name'] = 'BGAContacts'
            batch.pop('translation', None)
            batch['extensions'] = {'EXT_mesh_gpu_instancing': {'attributes': {'TRANSLATION': len(accs)-1}}}
            removed.update(indices[1:])
            extension('EXT_mesh_gpu_instancing', True)
    kept = [idx for idx in range(len(nodes)) if idx not in removed]
    lookup = {old_idx: idx for idx, old_idx in enumerate(kept)}
    for obj in nodes:
        if 'children' in obj:
            obj['children'] = [lookup[idx] for idx in obj['children'] if idx not in removed]
    doc['nodes'] = [nodes[idx] for idx in kept]
    for scene in doc['scenes']:
        scene['nodes'] = [lookup[idx] for idx in scene['nodes']]
        if path.stem == 'chip-soc':
            scene['nodes'].sort(key=lambda idx: doc['nodes'][idx]['translation'][1])
    binary, offsets = bytearray(), {}
    for view, data in zip(views, blocks):
        if data not in offsets:
            offsets[data] = len(binary)
            binary.extend(data)
            binary.extend(bytes(-len(binary) % 4))
        view.update(byteOffset=offsets[data], byteLength=len(data))
    doc['buffers'][0]['byteLength'] = len(binary)
    header = json.dumps(doc, separators=(',', ':')).encode()
    header += b' ' * (-len(header) % 4)
    path.write_bytes(struct.pack('<4sIIII', b'glTF', 2, 28+len(header)+len(binary), len(header), 0x4e4f534a)
                     + header + struct.pack('<I4s', len(binary), b'BIN\0') + binary)


for stem, build in [('chip-soc', chip), ('macbook-pro', laptop), ('mech-key', keycap),
                    ('server-rack', rack), ('optic-prism', prism), ('gimbal-core', gyro)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    result = bpy.ops.export_scene.gltf(filepath=str(OUT / f'{stem}.glb'), export_format='GLB',
                                       export_yup=True, export_animations=False, export_texcoords=True,
                                       export_normals=True, export_cameras=False, export_lights=False)
    if result != {'FINISHED'}:
        raise RuntimeError(f'{stem}: {result}')
    pack(OUT / f'{stem}.glb')
