import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const local = name => new URL(name, import.meta.url);
const specs = [
  ['iceberg', 'iceberg', ['SurfaceTip', 'WaterDisk', 'DeepTier_1', 'DeepTier_2', 'DeepTier_3']],
  ['domino', 'domino-arc', ['DominoUnit', 'ShieldGate']],
  ['scale', 'balance-scale', ['PillarBase', 'DialNeedle', 'BeamArm']],
  ['funnel', 'vortex-funnel', ['FunnelTier_1', 'FunnelTier_2', 'FunnelTier_3', 'CollectorBase', 'GoldenCore', 'RawShard']],
  ['vault', 'cyber-vault', ['VaultFrame', 'DoorPivot', 'RelicTablet']],
  ['pyramid', 'tier-pyramid', ['PyramidTier_1', 'PyramidTier_2', 'PyramidTier_3', 'ApexCrown']],
];

const checkOnly = process.argv.includes('--check');
const packed = {}, stats = [];
const near = (actual, target, eps = 0.02) =>
  assert.ok(Math.abs(actual - target) <= eps, `expected ${target} ±${eps}, got ${actual}`);

for (const [key, stem] of specs) {
  const bytes = readFileSync(local(`${stem}.glb`));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.ok(bytes.length >= 25_000 && bytes.length <= 120_000, `${stem}: ${bytes.length} bytes`);
  packed[key] = bytes.toString('base64');
}

const total = Object.values(packed).reduce((s, b64) => s + Buffer.byteLength(b64, 'base64'), 0);
assert.ok(total <= 480_000, `total budget exceeded: ${total}`);

const artifact = local('models-b64.js');
const bundle = `window.FX_NARRATIVE3D_GLB = ${JSON.stringify(packed, null, 2)};\n`;
if (!checkOnly) writeFileSync(artifact, bundle);

const ctx = createContext({
  console, TextDecoder, TextEncoder, URL, Blob, performance,
  ArrayBuffer, Uint8Array, AbortController, setTimeout, clearTimeout,
  fetch: () => { throw new Error('Offline test attempted a fetch'); },
});
ctx.window = ctx.self = ctx;
for (const file of ['three-fx.min.js', 'three-vrm.min.js']) {
  runInContext(readFileSync(local(`../../vendor/${file}`), 'utf8'), ctx, { filename: file });
}
runInContext(readFileSync(artifact, 'utf8'), ctx);

const THREE = ctx.THREE;
const loader = new THREE.GLTFLoader();

for (const [key, stem, roots] of specs) {
  const bytes = Buffer.from(ctx.FX_NARRATIVE3D_GLB[key], 'base64');
  assert.ok(bytes.equals(readFileSync(local(`${stem}.glb`))));
  const { scene } = await loader.parseAsync(Uint8Array.from(bytes).buffer, '');
  scene.updateMatrixWorld(true);
  assert.deepEqual(Array.from(scene.children, c => c.name).sort(), roots.toSorted());

  if (key === 'domino') {
    const u = scene.getObjectByName('DominoUnit');
    near(u.position.y, 0, 0.01);
    assert.ok(u.getObjectByName('ScreenSurface'));
    assert.ok(scene.getObjectByName('ShieldCore'));
  } else if (key === 'scale') {
    const beam = scene.getObjectByName('BeamArm');
    near(beam.position.y, 0.96, 0.02);
    assert.ok(beam.getObjectByName('LeftPanPivot'));
    assert.ok(beam.getObjectByName('RightPanPivot'));
    assert.ok(beam.getObjectByName('LeftSurface'));
    assert.ok(beam.getObjectByName('RightSurface'));
  } else if (key === 'vault') {
    const dp = scene.getObjectByName('DoorPivot');
    near(dp.position.x, -1.38, 0.02);
    assert.ok(dp.getObjectByName('OuterWheel'));
    assert.ok(dp.getObjectByName('InnerWheel'));
    assert.ok(scene.getObjectByName('RelicTablet').getObjectByName('ScreenSurface'));
  } else if (key === 'pyramid') {
    for (const i of [1, 2, 3]) assert.ok(scene.getObjectByName(`ScreenSurface_${i}`));
    assert.ok(scene.getObjectByName('ApexCore'));
  }

  let tris = 0;
  scene.traverse(n => { if (n.isMesh && n.geometry?.index) tris += n.geometry.index.count / 3; });
  stats.push({ file: `${stem}.glb`, bytes: bytes.length, triangles: tris });
}

console.table(stats);
console.log(`PASS: ${total} bytes; 6/6 narrative GLBs parsed offline and verified.`);
