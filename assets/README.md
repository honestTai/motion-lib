# Built-in 3D VRM Sample Assets

Both sample avatars are officially released by **pixiv Inc.** under **CC0 1.0 Universal (Public Domain Dedication)** (`extensions.VRM.meta.licenseName = "CC0"`, `commercialUssageName = "Allow"`), and are automatically copied into `<project>/lib/assets/` by `new-project.sh`:

- **`shino.vrm`** (`src=shino` or `src=lib/assets/shino.vrm`) — Long dark-blue hair anime presenter (`Sendagaya Shino`), 54 humanoid bones, MToon cel-shading + outlines, 15 facial morph expressions, 17 SpringBone hair/skirt chains.
- **`vita.vrm`** (`src=vita` or `src=lib/assets/vita.vrm`) — Short fluffy silver-bob AI/tech presenter (`Vita`), 54 humanoid bones, MToon cel-shading + outlines, 15 facial morph expressions, SpringBone hair physics.

You can also export any custom character from [VRoid Studio](https://vroid.com/en/studio) or download CC0 models from [Open Source Avatars](https://www.opensourceavatars.com/) as `.vrm` and pass `src=your-model.vrm` to `vrm3d`.

# Built-in Warm Gallery 3D Studio Meshes (`gallery3d/`)

All four architectural studio `.glb` meshes in `gallery3d/` (`gallery-frame.glb`, `step-slab.glb`, `monolith-slab.glb`, `scrub-bar.glb`, 86 KB total) and their offline Base64 bundle `models-b64.js` are original parametric geometry generated via `build_models.py` (Blender) and verified by `verify-models.mjs`, licensed under the repository **MIT License**.

# Built-in Industrial 3D Hardware & Kinetic Meshes (`showcase3d/`)

All six articulated multi-part `.glb` models in `showcase3d/` (`chip-soc.glb`, `macbook-pro.glb`, `mech-key.glb`, `server-rack.glb`, `optic-prism.glb`, `gimbal-core.glb`, 336 KB total) and their offline bundle `models-b64.js` are original parametric Blender geometry generated via `build_showcase_models.py` and verified by `verify-showcase.mjs`, licensed under the repository **MIT License**.

# Built-in Voiceover Narrative 3D Story Meshes (`narrative3d/`)

All six articulated storytelling `.glb` rigs in `narrative3d/` (`iceberg.glb`, `domino-arc.glb`, `balance-scale.glb`, `vortex-funnel.glb`, `cyber-vault.glb`, `tier-pyramid.glb`, 402 KB total) and their offline bundle `models-b64.js` are original parametric Blender geometry generated via `build-narrative-glb.py` and verified by `verify-narrative.mjs`, licensed under the repository **MIT License**.
