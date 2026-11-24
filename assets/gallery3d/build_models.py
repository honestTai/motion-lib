"""Original MIT gallery assets. Run with Blender --background --python-exit-code 1 --python build_models.py."""

import math
from pathlib import Path

import bpy


OUT = Path(__file__).resolve().parent
COPYRIGHT = "Copyright (c) 2026 motion-lib contributors; MIT License"


def material(name, hex_color, roughness, metallic=0.0):
    def linear(channel):
        value = int(channel, 16) / 255
        return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

    color = tuple(linear(hex_color[start:start + 2]) for start in (0, 2, 4)) + (1,)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat


def mesh_object(name, points, faces, mat, parent=None, smooth=True):
    """Author in final glTF XYZ; inverse Y-up conversion keeps every node transform identity."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(right, -front, up) for right, up, front in points], [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    mesh.materials.append(mat)
    if smooth:
        for polygon in mesh.polygons:
            polygon.use_smooth = True
        mesh.set_sharp_from_angle(angle=math.radians(46))
        modifier = obj.modifiers.new("Weighted bevel normals", 'WEIGHTED_NORMAL')
        modifier.mode = 'CORNER_ANGLE'
        modifier.keep_sharp = True
    return obj


def outline(width, height, radius, depth, segments, offset):
    points = []
    for corner, (sign_x, sign_y) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
        center_x = offset + sign_x * (width / 2 - radius)
        center_y = sign_y * (height / 2 - radius)
        for sample in range(segments + 1):
            angle = (corner + sample / segments) * math.pi / 2
            points.append((center_x + radius * math.cos(angle),
                           center_y + radius * math.sin(angle), depth))
    return points


def loft(name, layers, mat, segments, parent=None, hollow=False, offset=0):
    """Join CCW cross sections back-to-front, then cap the ends or close an annular solid."""
    rings = [outline(*layer, segments, offset) for layer in layers]
    count = len(rings[0])
    faces = []
    for level in range(len(rings) if hollow else len(rings) - 1):
        lower, upper = level * count, ((level + 1) % len(rings)) * count
        for index in range(count):
            after = (index + 1) % count
            faces.append((lower + index, lower + after, upper + after, upper + index))
    if not hollow:
        faces += [tuple(reversed(range(count))), tuple(range((len(rings) - 1) * count, len(rings) * count))]
    return mesh_object(name, [point for ring in rings for point in ring], faces, mat, parent)


def inset_layer(width, height, radius, inset, depth):
    return width - 2 * inset, height - 2 * inset, radius - inset, depth


def edge_layers(width, height, radius, back, front, bevel, steps=3):
    layers = []
    for top in (False, True):
        for sample in range(steps + 1):
            angle = (sample if top else steps - sample) / steps * math.pi / 2
            inset = bevel * (1 - math.cos(angle))
            depth = front - bevel + bevel * math.sin(angle) if top else back + bevel - bevel * math.sin(angle)
            layers.append(inset_layer(width, height, radius, inset, depth))
    return layers


def screen(parent, width, height, depth):
    corners = ((0, 0), (1, 0), (1, 1), (0, 1))
    points = [((right - 0.5) * width, (up - 0.5) * height, depth) for right, up in corners]
    obj = mesh_object("ScreenSurface", points, [(0, 1, 2, 3)],
                      material("ScreenMat", "ffffff", 0.45), parent, smooth=False)
    uv = obj.data.uv_layers.new(name="CanvasUV")
    for loop in obj.data.loops:
        right, up = corners[loop.vertex_index]
        uv.data[loop.index].uv = (right, 1 - up)
    return obj


def frame():
    outer = edge_layers(3.20, 2.00, 0.046, -0.055, 0.055, 0.010)
    rim = loft("FrameRim", outer + [
        (3.126, 1.926, 0.024, 0.055), (3.096, 1.896, 0.009, 0.040),
        (3.096, 1.896, 0.009, -0.055),
    ], material("FrameRim", "d8dce3", 0.32, 0.28), 5, hollow=True)
    loft("FrameBack", edge_layers(3.10, 1.90, 0.014, -0.054, -0.034, 0.004, 2),
         material("FrameBack", "cfd4dc", 0.55), 4, rim)
    loft("FrameMat", [
        (3.10, 1.90, 0.013, -0.0345), (3.10, 1.90, 0.013, 0.0395),
        (2.992, 1.792, 0.007, 0.0395), (2.9816, 1.7816, 0.0018, 0.0343),
    ], material("FrameMat", "fbf9f4", 0.72, 0.02), 4, rim)
    screen(rim, 2.98, 1.78, 0.035)


def step():
    body = loft("SlabBody", edge_layers(2.10, 2.72, 0.10, -0.060, 0.060, 0.021),
                material("SlabBody", "ffffff", 0.36, 0.04), 7)
    body.data.materials.append(material("SlabEdge", "f4f3f0", 0.40, 0.04))
    for polygon in body.data.polygons:
        if abs(polygon.normal.y) < 0.01:
            polygon.material_index = 1
    screen(body, 1.98, 2.60, 0.062)
    loft("AccentStrip", edge_layers(0.024, 2.27, 0.0119, 0.059, 0.072, 0.004),
         material("AccentMat", "ea580c", 0.35), 4, body, offset=-1.009)


def monolith():
    shell = loft("MonolithShell", [
        (6.70, 2.76, 0.110, -0.130), (6.784, 2.844, 0.152, -0.099),
        (6.80, 2.86, 0.160, -0.085), (6.80, 2.86, 0.160, 0.071),
        (6.792, 2.852, 0.156, 0.082), (6.708, 2.768, 0.114, 0.124),
        (6.674, 2.734, 0.097, 0.124), (6.636, 2.696, 0.078, 0.105),
        (6.636, 2.696, 0.078, 0.096),
    ], material("MonolithShell", "d5dae2", 0.34, 0.22), 7)
    loft("MonolithCore", edge_layers(6.630, 2.690, 0.077, 0.095, 0.130, 0.012),
         material("MonolithCore", "fcfbf8", 0.38), 7, shell)
    screen(shell, 6.36, 2.46, 0.132)


def scrub():
    body = loft("ScrubBody", edge_layers(3.10, 0.22, 0.109, -0.045, 0.045, 0.026) + [
        (3.006, 0.152, 0.075, 0.045), (2.992, 0.138, 0.068, 0.038),
        (2.992, 0.138, 0.068, 0.035),
    ], material("ScrubBody", "ffffff", 0.35), 8)
    loft("TrackGroove", [(2.991, 0.137, 0.068, 0.0345), (2.991, 0.137, 0.068, 0.036)],
         material("TrackGroove", "e2e6ee", 0.53), 8, body)
    screen(body, 2.90, 0.10, 0.048)


for filename, build in (("gallery-frame", frame), ("step-slab", step),
                        ("monolith-slab", monolith), ("scrub-bar", scrub)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    result = bpy.ops.export_scene.gltf(
        filepath=str(OUT / f"{filename}.glb"), export_format='GLB', export_yup=True,
        export_apply=True, export_normals=True, export_texcoords=True,
        export_animations=False, export_copyright=COPYRIGHT,
    )
    if result != {'FINISHED'}:
        raise RuntimeError(f"Export failed for {filename}: {result}")
