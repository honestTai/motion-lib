import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const specs = [
  ['frame', 'gallery-frame', [3.20, 2.00, 0.11], [2.98, 1.78, 0.035], ['FrameRim', 'FrameMat', 'FrameBack']],
  ['step', 'step-slab', [2.10, 2.72, 0.12], [1.98, 2.60, 0.062], ['SlabBody', 'AccentMat']],
  ['monolith', 'monolith-slab', [6.80, 2.86, 0.26], [6.36, 2.46, 0.132], ['MonolithShell', 'MonolithCore']],
  ['scrub', 'scrub-bar', [3.10, 0.22, 0.09], [2.90, 0.10, 0.048], ['ScrubBody', 'TrackGroove']],
];
const local = (name) => new URL(name, import.meta.url);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`);
const packed = {};
const rows = [];
let total = 0;

for (const [key, stem, [width, height, thickness], [sw, sh, depth], materials] of specs) {
  const file = `${stem}.glb`;
  const bytes = readFileSync(local(file));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', file);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.toString('ascii', 16, 20), 'JSON');
  const binHeader = 20 + bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString('utf8', 20, binHeader));
  assert.equal(bytes.toString('ascii', binHeader + 4, binHeader + 8), 'BIN\0');
  const binary = bytes.subarray(binHeader + 8);
  assert.equal(binary.length, bytes.readUInt32LE(binHeader));
  assert.equal(gltf.buffers.length, 1);
  assert.ok(!gltf.buffers[0].uri && !gltf.images?.length);
  const values = (index) => {
    const acc = gltf.accessors[index];
    const view = gltf.bufferViews[acc.bufferView];
    const [size, read] = { 5123: [2, 'readUInt16LE'], 5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'] }[acc.componentType];
    const channels = { SCALAR: 1, VEC2: 2, VEC3: 3 }[acc.type];
    const start = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    return Array.from({ length: acc.count }, (_, row) => Array.from({ length: channels }, (_, column) =>
      binary[read](start + row * (view.byteStride ?? size * channels) + column * size)));
  };

  const sceneRoots = gltf.scenes[gltf.scene].nodes;
  assert.equal(sceneRoots.length, 1);
  const root = gltf.nodes[sceneRoots[0]];
  const screenIndex = gltf.nodes.findIndex(node => node.name === 'ScreenSurface');
  assert.ok(root.children.includes(screenIndex));
  if (key === 'step') assert.ok(root.children.some(index => gltf.nodes[index].name === 'AccentStrip'));
  const usedMaterials = new Set();
  let vertices = 0, triangles = 0;
  const bodyPoints = [];
  for (const node of gltf.nodes) {
    assert.ok(!node.matrix && !node.translation && !node.rotation && !node.scale);
    for (const primitive of gltf.meshes[node.mesh].primitives) {
      assert.equal(primitive.mode ?? 4, 4);
      const positions = values(primitive.attributes.POSITION);
      const normals = values(primitive.attributes.NORMAL);
      const indices = values(primitive.indices).flat();
      const materialName = gltf.materials[primitive.material].name;
      usedMaterials.add(materialName);
      assert.ok(indices.every(index => index < positions.length));
      assert.equal(indices.length % 3, 0);
      normals.forEach(normal => close(Math.hypot(...normal), 1));
      vertices += positions.length;
      triangles += indices.length / 3;
      if (node === root || node.name === 'MonolithCore') bodyPoints.push(...positions);
      if (node.name !== 'ScreenSurface') continue;
      assert.equal(materialName, 'ScreenMat');
      assert.equal(positions.length, 4);
      assert.equal(new Set(indices).size, 4);
      assert.equal(indices.length, 6);
      const uvs = values(primitive.attributes.TEXCOORD_0);
      for (const [id, [right, up, front]] of positions.entries()) {
        close(front, depth);
        close(Math.abs(right), sw / 2);
        close(Math.abs(up), sh / 2);
        close(uvs[id][0], right > 0 ? 1 : 0);
        close(uvs[id][1], up > 0 ? 1 : 0);
        close(normals[id][2], 1);
      }
      for (let start = 0; start < 6; start += 3) {
        const [first, second, third] = indices.slice(start, start + 3).map(index => positions[index]);
        close((second[0] - first[0]) * (third[1] - first[1]) -
              (second[1] - first[1]) * (third[0] - first[0]), sw * sh);
      }
    }
  }
  for (const name of [...materials, 'ScreenMat']) assert.ok(usedMaterials.has(name), `${file}: ${name}`);
  for (const [axis, extent] of [width, height, thickness].entries()) {
    const coords = bodyPoints.map(point => point[axis]);
    close(Math.min(...coords), -extent / 2);
    close(Math.max(...coords), extent / 2);
  }
  packed[key] = bytes.toString('base64');
  total += bytes.length;
  rows.push({ file, bytes: bytes.length, vertices, triangles, nodes: gltf.nodes.map(node => node.name).join(', ') });
}
assert.ok(total <= 120_000, `GLB budget exceeded: ${total}`);
const bundle = local('models-b64.js');
if (process.argv.includes('--write')) {
  writeFileSync(bundle, `/*! MIT · motion-lib contributors · generated by verify-models.mjs */\n(function () {\n  window.FX_GALLERY3D_GLB = ${JSON.stringify(packed, null, 2)};\n})();\n`);
}
const context = { window: {} };
runInNewContext(readFileSync(bundle, 'utf8'), context);
assert.deepEqual(Object.keys(context.window.FX_GALLERY3D_GLB).sort(), Object.keys(packed).sort());
for (const [key, stem] of specs) {
  assert.deepEqual(Buffer.from(context.window.FX_GALLERY3D_GLB[key], 'base64'), readFileSync(local(`${stem}.glb`)));
}
console.table(rows);
console.log(`Verified ${total} GLB bytes and byte-identical offline bundle.`);
