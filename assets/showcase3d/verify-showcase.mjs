import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const local = name => new URL(name, import.meta.url);
const specs = [
  ['chip', 'chip-soc', ['BasePins', 'SubstratePCB', 'SiliconDie', 'ThermalFrame', 'HeatspreaderLid'],
    [['SiliconDie', 'ScreenSurface', 'top', 1.66, 1.66], ['HeatspreaderLid', 'LidLabelSurface', 'top', 2.10, 2.10]]],
  ['laptop', 'macbook-pro', ['BaseDeck', 'LidPivot'], [['LidPivot', 'ScreenSurface', 'front', 3.96, 2.48]]],
  ['keycap', 'mech-key', ['BottomHousing', 'CoilSpring', 'CrossStem', 'TopHousing', 'SculptedKeycap'],
    [['SculptedKeycap', 'ScreenSurface', 'top', 1.18, 1.18]]],
  ['rack', 'server-rack', ['RackFrame', ...[1, 2, 3, 4].map(idx => `Blade_${idx}`)],
    [1, 2, 3, 4].map(idx => [`Blade_${idx}`, `ScreenSurface_${idx}`, 'front', 1.10, .32])],
  ['prism', 'optic-prism', ['PedestalRing', 'CrystalPrism', 'InnerCore'], []],
  ['gyro', 'gimbal-core', ['OuterRing'], []],
];
const checkOnly = process.argv.includes('--check');
const packed = {}, files = new Map(), stats = [];
const near = (actual, target, epsilon = .00002) =>
  assert.ok(Math.abs(actual - target) <= epsilon, `expected ${target} ±${epsilon}, got ${actual}`);
function header(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.toString('ascii', 16, 20), 'JSON');
  const end = 20 + bytes.readUInt32LE(12);
  assert.equal(end % 4, 0);
  assert.equal(bytes.toString('ascii', end+4, end+8), 'BIN\0');
  assert.equal(bytes.readUInt32LE(end), bytes.length-end-8);
  assert.equal(bytes.length % 4, 0);
  const doc = JSON.parse(bytes.toString('utf8', 20, end));
  assert.equal(doc.asset.version, '2.0');
  assert.equal(doc.buffers.length, 1);
  assert.equal(doc.buffers[0].byteLength, bytes.length-end-8);
  assert.ok(!doc.buffers[0].uri && !doc.images?.length, 'not self-contained');
  for (const view of doc.bufferViews) {
    assert.equal(view.buffer, 0);
    assert.ok((view.byteOffset ?? 0) + view.byteLength <= doc.buffers[0].byteLength);
  }
  assert.equal(new Set(doc.nodes.map(node => node.name)).size, doc.nodes.length);
  return doc;
}
for (const [key, stem] of specs) {
  const bytes = readFileSync(local(`${stem}.glb`));
  assert.ok(bytes.length >= 25_000 && bytes.length <= 80_000, `${stem}: ${bytes.length} bytes`);
  files.set(key, header(bytes));
  packed[key] = bytes.toString('base64');
}
const total = [...files.keys()].reduce((sum, key) => sum + Buffer.byteLength(packed[key], 'base64'), 0);
assert.ok(total <= 380_000, `verification ceiling: ${total}`);
assert.ok(total <= 360_000, `production budget: ${total}`);
const artifact = local('models-b64.js');
const bundle = `window.FX_SHOWCASE3D_GLB = ${JSON.stringify(packed, null, 2)};\n`;
const ctx = createContext({ console, TextDecoder, TextEncoder, URL, Blob, performance,
  ArrayBuffer, Uint8Array, AbortController, setTimeout, clearTimeout,
  fetch: () => { throw Error('Offline test attempted a fetch'); } });
ctx.window = ctx.self = ctx;
for (const file of ['three-fx.min.js', 'three-vrm.min.js']) {
  runInContext(readFileSync(local(`../../vendor/${file}`), 'utf8'), ctx, { filename: file });
}
runInContext(checkOnly ? readFileSync(artifact, 'utf8') : bundle, ctx);
assert.deepEqual(Object.keys(ctx.FX_SHOWCASE3D_GLB).sort(), Object.keys(packed).sort());
const three = ctx.THREE;
assert.equal(three.GLTFLoader, ctx.THREE_VRM.GLTFLoader);
const loader = new three.GLTFLoader();
const vector = () => new three.Vector3();
const box = obj => new three.Box3().setFromObject(obj, true);
function surface(obj, parentName, axis, width, height) {
  assert.equal(obj.parent.name, parentName);
  assert.ok(obj.isMesh && !obj.isInstancedMesh);
  assert.equal(obj.material.name, obj.name === 'LidLabelSurface' ? 'LabelMat' : 'ScreenMat');
  const geometry = obj.geometry, {position, normal, uv} = geometry.attributes;
  assert.equal(position.count, 4);
  assert.equal(uv.count, 4);
  assert.equal(geometry.index.count, 6);
  const normalAxis = axis === 'top' ? 'y' : 'z';
  const points = Array.from({length: 4}, (_, idx) => obj.localToWorld(vector().fromBufferAttribute(position, idx)));
  const right = points.map(point => point.x);
  const up = points.map(point => axis === 'top' ? -point.z : point.y);
  near(Math.max(...right)-Math.min(...right), width);
  near(Math.max(...up)-Math.min(...up), height);
  const unique = new Set();
  for (let idx = 0; idx < 4; idx++) {
    const u = uv.getX(idx), v = uv.getY(idx);
    near(u, (right[idx]-Math.min(...right))/width);
    near(v, (up[idx]-Math.min(...up))/height);
    near(u, Math.round(u));
    near(v, Math.round(v));
    unique.add(`${Math.round(u)},${Math.round(v)}`);
    near(points[idx][normalAxis], points[0][normalAxis]);
    near(vector().fromBufferAttribute(normal, idx).transformDirection(obj.matrixWorld)[normalAxis], 1);
  }
  assert.equal(unique.size, 4);
  const indices = Array.from(geometry.index.array);
  assert.equal(new Set(indices).size, 4);
  const shared = indices.slice(0, 3).filter(id => indices.slice(3).includes(id));
  assert.equal(shared.length, 2);
  near(points[shared[0]].distanceToSquared(points[shared[1]]), width*width+height*height);
  for (const start of [0, 3]) {
    const [first, second, third] = indices.slice(start, start+3).map(idx => points[idx]);
    near(vector().subVectors(second, first).cross(vector().subVectors(third, first))[normalAxis], width*height);
  }
}
function dimensions(obj, expected, tolerances) {
  box(obj).getSize(vector()).toArray().forEach((size, axis) => near(size, expected[axis], tolerances[axis]));
}
function mechanics(key, scene) {
  const get = name => assertFound(scene, name);
  if (key === 'chip') {
    dimensions(scene, [3.2, .42, 3.2], [.003, .002, .003]);
    const layers = specs[0][2].map(name => get(name).position.y);
    assert.deepEqual(layers, layers.toSorted((first, second) => first-second));
    const pins = get('BGAContacts');
    assert.ok(pins.isInstancedMesh);
    assert.equal(pins.count, 81);
    const grid = new Set();
    for (let idx = 0; idx < pins.count; idx++) {
      const matrix = new three.Matrix4();
      pins.getMatrixAt(idx, matrix);
      const pos = vector().setFromMatrixPosition(matrix);
      const col = Math.round(pos.x/.34), row = Math.round(pos.z/.34);
      assert.ok(Math.abs(col) <= 4 && Math.abs(row) <= 4);
      near(pos.x, col*.34); near(pos.z, row*.34); near(pos.y, 0);
      grid.add(`${col},${row}`);
    }
    assert.equal(grid.size, 81);
  } else if (key === 'laptop') {
    assert.equal(get('LidShell').parent.name, 'LidPivot');
    assert.equal(get('Key_01').count, 65);
    const lid = get('LidPivot'), panel = get('ScreenSurface');
    lid.position.toArray().forEach((value, idx) => near(value, [0, .055, -1.36][idx]));
    near(lid.rotation.x, 0);
    lid.rotation.x = Math.PI/2;
    scene.updateMatrixWorld(true);
    near(vector().set(0, 0, 1).transformDirection(panel.matrixWorld).y, -1);
    dimensions(scene, [4.20, .16, 2.80], [.002, .009, .01]);
    lid.rotation.x = -.18;
    scene.updateMatrixWorld(true);
    near(vector().set(0, 0, 1).transformDirection(panel.matrixWorld).y, Math.sin(.18));
    lid.rotation.x = 0;
  } else if (key === 'keycap') {
    dimensions(scene, [1.85, 2.15, 1.85], [.003, .003, .07]);
    assert.equal(get('RGBLed').parent.name, 'TopHousing');
    const spring = get('CoilSpring'), before = box(spring);
    spring.geometry.computeBoundingBox();
    near(spring.geometry.boundingBox.min.y, 0);
    spring.scale.y = .55;
    const after = box(spring);
    near(after.min.y, before.min.y);
    near(after.max.y-after.min.y, .55*(before.max.y-before.min.y));
    spring.scale.y = 1;
  } else if (key === 'rack') {
    dimensions(scene, [2.90, 3.80, 2.40], [.003, .003, .006]);
    for (let idx = 1; idx <= 4; idx++) {
      const blade = get(`Blade_${idx}`), led = get(`Led_${idx}`);
      assert.equal(led.parent, blade);
      const center = box(blade).getCenter(vector());
      near(center.distanceTo(blade.position), 0, .0001);
      if (idx > 1) assert.ok(blade.position.y < get(`Blade_${idx-1}`).position.y);
      const start = led.getWorldPosition(vector()), frame = box(get('RackFrame'));
      blade.position.z += .8;
      near(led.getWorldPosition(vector()).z, start.z+.8);
      near(box(get('RackFrame')).max.z, frame.max.z);
      blade.position.z -= .8;
    }
  } else if (key === 'gyro') {
    for (const [name, parent, short] of [['OuterRing', null, 'z'], ['MidRing', 'OuterRing', 'x'], ['InnerRing', 'MidRing', 'y'], ['CorePoly', 'InnerRing', null]]) {
      const part = get(name);
      assert.equal(part.parent, parent ? get(parent) : scene);
      near(part.getWorldPosition(vector()).length(), 0);
      if (short) {
        part.geometry.computeBoundingBox();
        const size = part.geometry.boundingBox.getSize(vector());
        assert.ok(size[short] < .3 && Math.max(...size.toArray()) > 2);
      }
    }
    const outer = get('OuterRing');
    outer.rotation.z = .4;
    get('MidRing').rotation.y = .6;
    near(get('CorePoly').getWorldPosition(vector()).length(), 0);
    outer.rotation.z = get('MidRing').rotation.y = 0;
    near(box(scene).getSize(vector()).x, 3.4, .06);
  } else {
    near(box(scene).getSize(vector()).y, 2.8);
    near(get('CrystalPrism').material.transmission, .94);
    near(get('InnerCore').position.distanceTo(get('CrystalPrism').position), 0);
  }
}
function assertFound(scene, name) {
  const part = scene.getObjectByName(name);
  assert.ok(part, `missing ${name}`);
  return part;
}
for (const [key, stem, roots, surfaces] of specs) {
  const bytes = Buffer.from(ctx.FX_SHOWCASE3D_GLB[key], 'base64');
  assert.ok(bytes.equals(readFileSync(local(`${stem}.glb`))), `${key}: stale bundle`);
  const doc = files.get(key);
  const {scene} = await loader.parseAsync(Uint8Array.from(bytes).buffer, '');
  scene.updateMatrixWorld(true);
  assert.deepEqual(Array.from(scene.children, child => child.name).sort(), roots.toSorted());
  assert.deepEqual(doc.nodes.filter(part => /^(ScreenSurface|LidLabelSurface)/.test(part.name)).map(part => part.name).sort(),
    surfaces.map(spec => spec[1]).sort());
  for (const [parent, name, axis, width, height] of surfaces)
    surface(assertFound(scene, name), parent, axis, width, height);
  mechanics(key, scene);
  const geometries = new Set();
  let vertices = 0, triangles = 0, drawnTriangles = 0;
  scene.traverse(part => {
    if (!part.isMesh) return;
    const geometry = part.geometry, {position, normal} = geometry.attributes;
    drawnTriangles += geometry.index.count/3 * (part.isInstancedMesh ? part.count : 1);
    if (geometries.has(geometry)) return;
    geometries.add(geometry);
    assert.equal(position.count, normal.count);
    assert.equal(geometry.index.count % 3, 0);
    for (const idx of geometry.index.array) assert.ok(idx < position.count);
    for (let idx = 0; idx < position.count; idx++)
      near(vector().fromBufferAttribute(normal, idx).length(), 1, .014);
    vertices += position.count;
    triangles += geometry.index.count/3;
  });
  stats.push({file: `${stem}.glb`, bytes: bytes.length, vertices, triangles, drawnTriangles});
  console.log(`\n${stem}.glb`);
  function tree(index, depth) {
    const part = doc.nodes[index], attr = part.extensions?.EXT_mesh_gpu_instancing?.attributes.TRANSLATION;
    console.log(`${'  '.repeat(depth)}└ ${part.name}${attr == null ? '' : ` ×${doc.accessors[attr].count}`}`);
    for (const child of part.children ?? []) tree(child, depth+1);
  }
  for (const index of doc.scenes[doc.scene].nodes) tree(index, 0);
}
if (!checkOnly) writeFileSync(artifact, bundle);
console.table(stats);
console.log(`PASS: ${total} bytes; 6/6 parsed offline; 8 print surfaces; all joint tests passed.`);
