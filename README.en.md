<div align="center">

<img src="docs/hero-banner.svg" width="100%" alt="motion-lib — Declarative HTML-to-Video Motion Library" />

<br />

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · **English** · [日本語](README.ja.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-8453e8?style=flat-square)](LICENSE)
[![Effects](https://img.shields.io/badge/Effects-282-6fd3ff?style=flat-square)](docs/CATALOG.en.md)
[![Transitions](https://img.shields.io/badge/Transitions-24-e4b256?style=flat-square)](docs/CATALOG.en.md)
[![3D & VRM](https://img.shields.io/badge/3D_&_VRM-three.js_+_GLB-68e6b2?style=flat-square)](examples/gallery3d/index.html)
[![Zero Build](https://img.shields.io/badge/Build-Zero_Bundler-2ea043?style=flat-square)](#-quick-start)
[![Sponsor: HRouter](https://img.shields.io/badge/Sponsor-HRouter.net-a8ff57?style=flat-square&labelColor=0b1a13)](https://hrouter.net/)

[Showcase](#-showcase-gallery) · [Structure](#-repository-structure) · [Quick Start](#-quick-start) · [Syntax & Modules](#-core-syntax--modules) · [Full Catalog](docs/CATALOG.en.md)

</div>

---

<div align="center">
  <a href="https://hrouter.net/" target="_blank" rel="noopener">
    <img src="docs/hrouter-en.svg" width="100%" alt="HRouter — One API Key for Claude, GPT, Gemini & Grok" />
  </a>
</div>

> ⚡ **Official Compute Partner — [HRouter](https://hrouter.net/)**: **One API Key for Claude, GPT, Gemini & Grok**, natively compatible with [Claude Code](https://hrouter.net/docs/claude-code/), [Codex](https://hrouter.net/docs/codex/), [Gemini CLI](https://hrouter.net/docs/gemini-cli/), and [DeepSeek](https://hrouter.net/docs/deepseek/) for automated HTML-to-MP4 pipelines.

---

## 🎬 Overview

**A declarative HTML → video motion library.** Add `data-fx="effect@seconds"` to ordinary DOM elements to orchestrate typography, Canvas particles, Three.js 3D beveled studio rigs, and VRM avatars on a single frame-deterministic GSAP timeline — rendered at 1080p / 60fps MP4 with [HyperFrames](https://hyperframes.heygen.com).

<div align="center">
  <a href="promo/motion-lib-promo.mp4">
    <img src="docs/promo-preview.gif" width="100%" alt="motion-lib promo preview" />
  </a>
  <sub>▲ Full promo <a href="promo/motion-lib-promo.mp4"><code>promo/motion-lib-promo.mp4</code></a> · Showreel <a href="examples/showreel.mp4"><code>examples/showreel.mp4</code></a></sub>
</div>

<br />

<!-- STATS:START -->
| | Count |
|---|---|
| Effects | **282** (Enter 26 · Exit 10 · Emphasis 41 · Text 9 · Data 7 · Camera 14 · Character 25 · Papercut 10 · Particles 8 · 3D 37 · White 3D 40 · Space 21 · Stage 10 · Hand-drawn 5 · Chat & code 8 · Diagrams 3 · Shapes 3 · Sound 1 · Components 4) · [Full catalog →](docs/CATALOG.en.md) |
| Transitions | **24** |
| Component generators | **76** |
| Skins | **7** themes (violet tech · black-gold cinema · retro pixel · papercut collage · deep-space particles · studio · white 3D) |
<!-- STATS:END -->

---

## 🎨 Showcase Gallery

<table>
  <tr>
    <td width="33%" align="center">
      <a href="examples/gallery3d/gallery3d.mp4"><img src="examples/gallery3d/cover.jpg" width="100%" alt="gallery3d" /></a><br />
      <b>Warm 3D Gallery</b> <code>fx-gallery3d.js</code><br />
      <sub><a href="examples/gallery3d/gallery3d.mp4">▶ MP4</a> · <a href="examples/gallery3d/index.html">Source</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/narrative3d/narrative3d.mp4"><img src="examples/narrative3d/cover.jpg" width="100%" alt="narrative3d" /></a><br />
      <b>Voiceover 3D Combos</b> <code>fx-narrative3d.js</code><br />
      <sub><a href="examples/narrative3d/narrative3d.mp4">▶ MP4</a> · <a href="examples/narrative3d/index.html">Source</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/showcase3d/showcase3d.mp4"><img src="examples/showcase3d/cover.jpg" width="100%" alt="showcase3d" /></a><br />
      <b>Hardware 3D Showcase</b> <code>fx-showcase3d.js</code><br />
      <sub><a href="examples/showcase3d/showcase3d.mp4">▶ MP4</a> · <a href="examples/showcase3d/index.html">Source</a></sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <a href="examples/white3d/white3d.mp4"><img src="examples/white3d/cover.jpg" width="100%" alt="white3d" /></a><br />
      <b>White 3D Desk</b> <code>fx-desk3d.js</code><br />
      <sub><a href="examples/white3d/white3d.mp4">▶ MP4</a> · <a href="examples/white3d/index.html">Source</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/world/world.mp4"><img src="examples/world/cover.jpg" width="100%" alt="world" /></a><br />
      <b>World Canvas</b> <code>fx-world.js</code><br />
      <sub><a href="examples/world/world.mp4">▶ MP4</a> · <a href="examples/world/index.html">Source</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/stage/stage.mp4"><img src="examples/stage/cover.jpg" width="100%" alt="stage" /></a><br />
      <b>Stage Play PiP</b> <code>fx-stage.js</code><br />
      <sub><a href="examples/stage/stage.mp4">▶ MP4</a> · <a href="examples/stage/index.html">Source</a></sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <a href="examples/three/three.mp4"><img src="examples/three/cover.jpg" width="100%" alt="three" /></a><br />
      <b>WebGL 3D Stage</b> <code>fx-3d.js</code><br />
      <sub><a href="examples/three/three.mp4">▶ MP4</a> · <a href="examples/three/index.html">Source</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/kit/kit.mp4"><img src="examples/kit/cover.jpg" width="100%" alt="kit" /></a><br />
      <b>AI Explainer Kit</b> <code>kit/*</code><br />
      <sub><a href="examples/kit/kit.mp4">▶ MP4</a> · <a href="examples/kit/index.html">Source</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/violet/violet.mp4"><img src="examples/violet/cover.jpg" width="100%" alt="violet" /></a><br />
      <b>White & Violet</b> <code>theme-violet</code><br />
      <sub><a href="examples/violet/violet.mp4">▶ MP4</a> · <a href="examples/violet/index.html">Source</a></sub>
    </td>
  </tr>
</table>

---

## 📂 Repository Structure

```text
motion-lib/
├── src/
│   ├── core/               # Core timeline scheduler fx.js + typography & 7 themes fx.css
│   └── modules/            # Optional extension modules grouped into 5 domains
│       ├── spatial/        # Spatial & stage cameras: fx-world.js · fx-stage.js · fx-oner.js
│       ├── three/          # 3D & tactile studios: fx-3d.js · fx-desk3d.js · fx-gallery3d.js · fx-showcase3d.js · fx-narrative3d.js · fx-particles.js
│       ├── character/      # Avatars & IK rigs: fx-puppet.js · fx-rig.js · fx-vrm.js
│       ├── kit/            # Explainer UI kit: fx-chat.js · fx-diagram.js · fx-ink.js · fx-shape.js
│       └── audio/          # Procedural SFX engine: fx-sound.js
├── scripts/                # CLI utilities: new-project.sh · sfx.mjs · chrome-tall.sh · gen-readme.mjs
├── assets/ · fonts/ · vendor/  # Offline 3D meshes (VRM / GLB), commercial-free fonts & vendor libs
├── examples/ · demo/ · promo/  # Complete runnable example films
└── docs/                   # Architecture assets & full effect reference docs/CATALOG.en.md
```

---

## 🚀 Quick Start

Requires **Node.js 18+**, **FFmpeg**, and **Google Chrome**.

```bash
# 1. Create a project and sync the runtime into my-video/lib/
mkdir my-video && ./scripts/new-project.sh my-video

# 2. Preview, synthesize frame-accurate SFX, and render 1080p 60fps MP4
cd my-video
open "index.html?play"                                    # Space to play/pause, ←/→ frame step
open "index.html?lint"                                    # Layout & font-size self-check
node lib/sfx.mjs .                                        # Generates audio/sfx.wav
HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" \
  npx hyperframes render -o out.mp4 --fps 60 --experimental-fast-capture=false
```

Minimal `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="lib/fx.css">
  <script src="lib/vendor/gsap.min.js"></script>
  <script src="lib/fx.js"></script>
  <script src="lib/fx-world.js"></script>
  <script src="lib/fx-sound.js"></script>
</head>
<body>
<div id="root" class="theme-studio" data-composition-id="main" data-width="1920" data-height="1080" data-fps="60" data-world="snake">
  <section class="scene center" data-d="4.0" data-fx="cam-wide@0 cam-home@0.9">
    <h1 class="t-title" data-fx="mask-rise@0.2">Declarative <span class="accent">HTML → Video</span></h1>
  </section>
</div>
<script>
  FX.subtitles([[0.2, 3.8, 'One attribute drives {deterministic} motion']], { style: 'studio' });
  FX.build();
</script>
</body>
</html>
```

---

## 📐 Core Syntax & Modules

- **Timing & Targets**: `data-fx="[each:|chars:|words:|lines:]name@seconds(dur=0.8,ease=spring,stagger=0.08)"` (`@1.2` from scene start, `@+0.3` relative offset, `@-0.4` before scene end).
- **7 Built-in Themes**: Set `theme-studio`, `theme-white3d` (with optional `desk` or `gallery`), `theme-violet`, `theme-gold`, `theme-paper`, `theme-pixel`, or `theme-space` on `#root`.
- **Optional Modules** (all flattened into `lib/` by `new-project.sh`):

| Domain | Scripts (load after `lib/fx.js`) | Purpose |
|---|---|---|
| **Spatial & Camera** | `fx-world.js` · `fx-stage.js` · `fx-oner.js` | World canvas camera travel, presenter stage PiP, uncut one-take building camera |
| **3D & Studios** | `fx-3d.js` · `fx-desk3d.js` · `fx-gallery3d.js` · `fx-showcase3d.js` · `fx-narrative3d.js` · `fx-particles.js` | Warm 3D gallery, voiceover 3D story combos (iceberg/domino/scale/funnel/vault/pyramid), hardware exploded views, grid desk |
| **Characters & IK** | `fx-puppet.js` · `fx-rig.js` · `fx-vrm.js` | 2D puppet lip-sync, RubberHose 2-bone IK, 3D VRM avatars (`vendor/three-vrm.min.js`) |
| **Explainer Kit** | `fx-chat.js` · `fx-diagram.js` · `fx-ink.js` · `fx-shape.js` | Chat/terminal/diff UI, diagrams, hand-drawn boiling ink, SVG morphs |
| **Procedural Audio** | `fx-sound.js` (load last) | 27 code-synthesized sound effects auto-aligned to motion cues |

👉 **Browse all effects, transitions & parameters in [docs/CATALOG.en.md](docs/CATALOG.en.md)**

---

## 📜 License

Code licensed under the **[MIT License](LICENSE)**. Third-party libraries, CC0 3D avatars, and font terms are documented in [NOTICE](NOTICE), [assets/README.md](assets/README.md), and [fonts/README.md](fonts/README.md).
