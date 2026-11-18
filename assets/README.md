# Built-in 3D VRM Sample Assets

Both sample avatars are officially released by **pixiv Inc.** under **CC0 1.0 Universal (Public Domain Dedication)** (`extensions.VRM.meta.licenseName = "CC0"`, `commercialUssageName = "Allow"`), and are automatically copied into `<project>/lib/assets/` by `new-project.sh`:

- **`shino.vrm`** (`src=shino` or `src=lib/assets/shino.vrm`) — Long dark-blue hair anime presenter (`Sendagaya Shino`), 54 humanoid bones, MToon cel-shading + outlines, 15 facial morph expressions, 17 SpringBone hair/skirt chains.
- **`vita.vrm`** (`src=vita` or `src=lib/assets/vita.vrm`) — Short fluffy silver-bob AI/tech presenter (`Vita`), 54 humanoid bones, MToon cel-shading + outlines, 15 facial morph expressions, SpringBone hair physics.

You can also export any custom character from [VRoid Studio](https://vroid.com/en/studio) or download CC0 models from [Open Source Avatars](https://www.opensourceavatars.com/) as `.vrm` and pass `src=your-model.vrm` to `vrm3d`.
