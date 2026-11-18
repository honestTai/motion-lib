# motion-lib

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · **English** · [日本語](README.ja.md)

**A declarative motion library for HTML → video.** Write one line, `data-fx="effect-name@seconds"`, on an element to get the motion you see in talking-head explainers and tech videos, then render it frame by frame to MP4 with [HyperFrames](https://hyperframes.heygen.com).

> **New in v1.3**: the optional 3D module `fx-3d.js` (real 3D scenes: galaxy, energy orb, tunnel, black hole, city fly-through, dot globe, 3D particle text and more, 12 effects in all, with bloom and a programmable camera).
>
> **New in v1.2**: the optional particle module `fx-particles.js` (8 particle effects: starfield, nebula, vortex, black hole, energy orb, explosion, particle text, particle stream) + a 5th theme, `theme-space` (deep-space particles).
>
> **New in v1.1**: 40 effects + 4 transitions (`paper-slide` `tear` `glitch-cut` `open`) + 5 component generators (`circle-text` `retro-grid` `papercut` `hills` `torn`); 2 new categories, Text and Papercut; a 4th theme, `theme-paper` (papercut collage). Inspired by animate.css, Magic UI and React Bits; see Credits at the bottom.

[![motion-lib promo](promo/cover.jpg)](promo/motion-lib-promo.mp4)

> The promo above was made with this library. Source: [`promo/index.html`](promo/index.html).

<!-- STATS:START -->
| | Count |
|---|---|
| Effects | **136** (Enter 26 · Exit 9 · Emphasis 37 · Text 9 · Data 6 · Camera 11 · Character 5 · Papercut 10 · Particles 8 · 3D 12 · Components 3) |
| Transitions | **14** |
| Component generators | **16** (`bars` `wave` `steps` `chapters` `ring` `wall` `dust` `line` `pixels` `circle-text` `retro-grid` `papercut` `hills` `torn` `space` `stage3d`) |
| Skins | **5** themes (violet tech · black-gold cinema · retro pixel · papercut collage · deep-space particles) |
<!-- STATS:END -->

## Why use it

Making video with HTML, layout is not the hard part. Motion is:

- **The renderer works by "seek to frame N, take a screenshot".** CSS animations, `setTimeout` and `Math.random` are outside its control, so the output either doesn't move or differs on every run.
- Hand-writing GSAP timelines means calculating hundreds of time points for a one-minute video.

motion-lib schedules every effect onto **one paused GSAP timeline**. You only declare "which element, which effect, at which second":

```html
<h1 data-fx="blur-rise-in@0.2">What is the hardest part of chasing trends?</h1>
<b  data-fx="count@0.6 marker@1.6">7,000</b>
<ul data-fx="each:pop-in@1(stagger=0.1)"> <li>Chips</li><li>Compute</li><li>LLMs</li> </ul>
```

- **Frame-accurate seeking**: jump to any frame and the picture is identical to sequential playback, so every render gives the same result.
- **Reproducible randomness**: anything random (particles, scrambled text, waveforms) uses the seeded `FX.rand(seed)`.
- **No network needed**: GSAP and the fonts are bundled in the repo.
- **Zero build**: one `fx.js`, one `fx.css`. No npm or bundler.

## Layout

```
motion-lib/
├── fx.js            the library: effects, transitions, component generators, subtitles, preview player
├── fx.css           base styles, component styles, five themes
├── fx-particles.js  optional particle module (space, vortex, black hole, explosion, particle text)
├── fx-3d.js         optional 3D module (real 3D scenes, bloom, programmable camera; needs three.js)
├── fonts/           YouSheBiaoTiHei, Smiley Sans, Fusion Pixel, ZCOOL KuaiLe (licenses in fonts/README.md)
├── vendor/          GSAP 3.15 and three.js r187 with bloom post-processing (three-fx.min.js); local copies
├── new-project.sh   install the library into a video project (also used to update)
├── chrome-tall.sh   Chrome wrapper for rendering (keeps the bottom subtitles from being cut off)
├── gen-readme.mjs   generates the count table and effect catalog in this file (node gen-readme.mjs)
├── demo/            demo page: 6 scenes using the first three themes
├── promo/           promo source + final video
└── examples/        one full example per theme (five in all) + a real-3D example + a showreel
```

## Requirements

- Node.js 18+ (uses `npx hyperframes`)
- FFmpeg
- Google Chrome (default macOS location; set the `REAL_CHROME` environment variable for other locations)
- The first `npx hyperframes` run downloads the CLI automatically

## Quick start

**1. Create a project**

```bash
mkdir my-video
./new-project.sh my-video        # copies fx.js / fx.css / fonts / GSAP into my-video/lib/
```

> HyperFrames can only read files inside the project directory, so the library is **copied into** the project rather than referenced via `../`. After the library is updated, run the same command again on the same project.
> The same goes for `demo/` and `promo/` in this repo: run `./new-project.sh demo` and `./new-project.sh promo` before opening them for the first time.

**2. Write `my-video/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="lib/fx.css">
  <script src="lib/vendor/gsap.min.js"></script>
  <script src="lib/fx.js"></script>
</head>
<body>
<div id="root" class="theme-violet" data-composition-id="main" data-width="1920" data-height="1080">

  <section class="scene dark center" data-d="3.5">
    <h1 class="t-title" data-fx="mask-rise@0.2">Fully automated editing <span class="accent">Skill</span></h1>
    <p class="t-body" data-fx="rise-in@0.6 marker@1.4">Watch this, and you can too</p>
  </section>

  <section class="scene light" data-d="4" data-in="blur-cross">
    <div class="abs" style="left:200px;top:300px;width:1200px;height:400px"
         data-make="bars" data-values="3,8,21,40,26,12" data-hi="4"
         data-fx="each:grow-y@0.3(stagger=0.05)"></div>
  </section>

</div>
<script>
  FX.subtitles([[0.2, 3.4, 'Watch this, and you can too'], [3.5, 7.4, 'Views peak in the {first few hours} after going live']], { style: 'pill' });
  FX.build();
</script>
</body>
</html>
```

> For particle effects, add one more line after `fx.js`: `<script src="lib/fx-particles.js"></script>` (`new-project.sh` already copies it into `lib/`).
>
> For 3D effects, add one script before and one after `fx.js`; see the "3D scenes" section below (`new-project.sh` already copies `fx-3d.js` and `vendor/three-fx.min.js` into `lib/`).


**3. Preview, snapshot, render**

```bash
cd my-video
open "index.html?play"                       # browser preview: Space to play, ←/→ frame by frame, ↑/↓ jump between scenes
npx hyperframes snapshot --at 1,3,5          # grab a few frames to check
HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" \
  npx hyperframes render -o out.mp4 --experimental-fast-capture=false
```

> Always render with `chrome-tall.sh`. With the full Chrome on this machine in headless mode, the visible height is about 90px shorter than the window, so the bottom of the video (subtitles) gets cut off. The script makes the window taller.

## Examples

Each of the five themes has a full example (motion only, no voice-over). The source is in the matching directory, ready to adapt:

| Theme | Example | Source |
|---|---|---|
| Violet tech `theme-violet` | [![violet](examples/violet/cover.jpg)](examples/violet/violet.mp4) | [`examples/violet/index.html`](examples/violet/index.html) |
| Black-gold cinema `theme-gold` | [![gold](examples/gold/cover.jpg)](examples/gold/gold.mp4) | [`examples/gold/index.html`](examples/gold/index.html) |
| Retro pixel `theme-pixel` | [![pixel](examples/pixel/cover.jpg)](examples/pixel/pixel.mp4) | [`examples/pixel/index.html`](examples/pixel/index.html) |
| Papercut collage `theme-paper` | [![paper](examples/paper/cover.jpg)](examples/paper/paper.mp4) | [`examples/paper/index.html`](examples/paper/index.html) |
| Deep-space particles `theme-space` | [![space](examples/space/cover.jpg)](examples/space/space.mp4) | [`examples/space/index.html`](examples/space/index.html) |
| Real 3D scene `fx-3d.js` | [![three](examples/three/cover.jpg)](examples/three/three.mp4) | [`examples/three/index.html`](examples/three/index.html) |

All six combined: [`examples/showreel.mp4`](examples/showreel.mp4).

## Syntax

### Scenes `<section class="scene">`

A scene is a shot. Scenes are chained end to end in order.

| Syntax | Meaning |
|---|---|
| `data-d="4"` | Duration of 4 seconds |
| `data-t="12.5"` | Explicit start time (if omitted, it follows the previous scene) |
| `data-in="blur-cross(dur=0.5)"` | The transition into this scene; see "Transitions" |
| `class="scene dark"` / `"scene light"` | Switch a single scene to a dark / light background |
| `class="scene overlay"` | Overlay layer: takes no sequence time and shows alongside other scenes (corner badges, persistent progress bars) |

The root element must have `data-composition-id="main"`, `data-width` and `data-height`. The total duration is computed automatically.

### Effects `data-fx="[target:]name@time(params)"`

An element can have several effects, separated by spaces: `data-fx="rise-in@0.2 pulse@1.5 fade-out@-0.3"`.

| Part | Syntax | Meaning |
|---|---|---|
| Time | `@1.2` | 1.2 seconds after the scene starts |
| | `@+0.3` | 0.3 seconds after the previous effect on the same element |
| | `@-0.4` | 0.4 seconds before the scene ends (for exits) |
| Target | (omitted) | The element itself |
| | `each:` | Every child element, automatically staggered (card groups, lists, bars) |
| | `chars:` / `words:` / `lines:` | Split into characters / words / lines (by `<br>`) and animate each |
| Params | `dur=0.8` | Duration in seconds |
| | `ease=spring` | Easing; see the table below |
| | `stagger=0.1` | Stagger interval (with `each:` / `chars:`) |
| | `order=center` | Stagger order: `start` `end` `center` `edges` |
| | others | Each effect's own parameters; see the "Effect catalog" |

**Easing aliases**

| Alias | Equals | Feel |
|---|---|---|
| `out` (default) | `power3.out` | Fast start, soft stop; the most general-purpose |
| `soft` | `power2.out` | Gentle |
| `snap` | `expo.out` | Shoots into place, then settles slowly |
| `sharp` | `power4.out` | Crisper than out |
| `inout` | `power3.inOut` | Slow at both ends, fast in the middle; for camera moves |
| `in` | `power2.in` | Keeps accelerating; for exits |
| `spring` | `back.out(1.7)` | Slight overshoot and settle |
| `bounce` | `back.out(2.8)` | Pronounced overshoot |
| `elastic` | `elastic.out(1,0.55)` | Spring |
| `drop` | `bounce.out` | Bounces on landing |
| `linear` | `none` | Constant speed |
| `pixel` | `steps(5)` | Stepped (pixel style) |

You can also write GSAP's own names directly, e.g. `ease=power4.out`, `ease=steps(8)`, `ease=elastic.out(1,0.5)`.

### Component generators `data-make="name"`

Let the library generate repetitive DOM, then pair it with the matching effect:

| Name | Attributes | Pairs with | Use |
|---|---|---|---|
| `bars` | `data-values` `data-labels` `data-hi="2,3"` `data-max` | `each:grow-y` | Bar chart / histogram |
| `line` | `data-values` `data-w` `data-h` `data-smooth` | `draw` | Line / curve |
| `ring` | `data-size` `data-stroke` `data-dash` | `ring(to=0.7)` | Ring progress, countdown |
| `wave` | `data-n` `data-seed` | `each:grow-y`, `wave-live` | Audio waveform |
| `steps` | `data-labels="Topic,Script,Voice"` | `step(i=2)` | Step navigation pills |
| `chapters` | `data-labels` | `chapter(i=3)` | Top chapter progress bar |
| `pixels` | `data-text="SKILL?"` `data-size` `data-colors` | `each:pixel-in(order=random)` | 5×7 dot-matrix block lettering |
| `wall` | `data-cols` `data-rows` `data-seed` | `drift` | Background card wall |
| `dust` | `data-n` `data-seed` | `drift`, `float` | Floating particles |
| `circle-text` | `data-text` `data-r` (radius) | `spin` (rotate the ring of text) | Circular text, badges, stamps |
| `retro-grid` | `data-cell` (cell size) `data-color` `data-angle` (tilt) | `bg-scroll` (make the grid flow toward the viewer) | Retro perspective-grid background |
| `papercut` | `data-size` `data-fold` (number of folds: 6 / 8 / 12) `data-shape` (`flower` `circle` `square`) `data-color` `data-seed` | `pop-in`, `spin`, `jitter` | Symmetric paper-cut window flowers; every seed gives a different pattern |
| `hills` | `data-layers` (number of layers) `data-colors` (colors from back to front) `data-seed` | `layer-rise`, `parallax` | Layered paper hills; each layer is a child element |
| `torn` | `data-edges` (`top,right,bottom,left`, default `top,bottom`) `data-depth` `data-teeth` `data-seed` | `stick-on`, `rise-in` | Cuts an element's edges into a ragged torn-paper strip; `clip-path` clips shadows, so wrap it in `fx-torn-shadow` if you want one |
| `space` | particle effects go in `data-fx` (needs `fx-particles.js`) | `nebula` `starfield` `vortex` `blackhole` `form-text` and other Particles effects | A canvas container: one canvas, each particle effect is a layer |
| `stage3d` | `data-bloom` (bloom strength, 0 turns it off) `data-threshold` `data-radius` `data-bg` `data-fog` `data-fov` `data-cam` `data-look` `data-light` | `stars3d` `galaxy3d` `orb3d` `cam3d` `orbit3d` and other 3D effects | A 3D stage: one WebGL canvas and one camera (needs `three-fx.min.js` and `fx-3d.js`) |

### Subtitles

```js
FX.subtitles([
  [startSeconds, endSeconds, 'Text; words in {braces} take the accent color'],
  …
], { style: 'pill', pop: false });
```

| `style` | Look | Pairs with theme |
|---|---|---|
| `pill` | Black rounded pill + white text | Violet tech |
| `bar` | Semi-transparent black bar | Retro pixel |
| `plain` | White text + shadow, no background | Black-gold cinema |
| `paper` | Beige torn-paper strip + dark text | Papercut collage |

With `pop: true` each subtitle floats up gently as it appears; the default is a hard cut, which is what talking-head videos usually use.

### Particles (fx-particles.js)

An optional module with canvas (Canvas 2D) particles: starfield, nebula, vortex, black hole, energy orb, explosion, particle text and particle stream. Load it after `fx.js`, then write:

```html
<script src="lib/fx-particles.js"></script>

<div class="layer" data-make="space"
     data-fx="nebula@0 starfield@0(speed=0.15) vortex@1 form-text@4(text=HELLO)"></div>
<h1 class="t-hero" data-fx="rise-in@0.6">HELLO, SPACE</h1>
```

- One `data-make="space"` is one canvas; every particle effect written on it is a layer, stacked **bottom to top** in the order written (above: the nebula is at the bottom, the text on top). The heading is a normal DOM element sitting over the canvas.
- Common parameters: `dur` (how long this layer lasts, default until the scene ends), `fade` / `out` (fade in / out seconds), `x` / `y` (center position in percent), `seed`.
- Color lists are separated with `/`, e.g. `colors=#6fd3ff/#ff8a4d`.
- `form-text` has three different times: `dur` is the length of the whole layer, `conv` is how long the gathering takes, and `start` is how long the particles drift first. It samples the theme's title font, so Chinese and English both work.
- The canvas is a normal element, so you can add other effects to it as usual, e.g. `to@3(scale=1.3)` for a push-in.
- Like the rest of the library it is frame-exact: every frame is a pure function of time, and randomness is seeded. Note that perspective is **simulated** on a 2D canvas; it is not real 3D (WebGL); for real 3D use `fx-3d.js`, described below.

### 3D scenes (fx-3d.js)

An optional module for real 3D scenes (three.js / WebGL): 3D starfield, spiral galaxy, 3D energy orb, particle tunnel, wave grid, dot globe, 3D black hole, 3D explosion, 3D particle text and a city, plus two camera effects. **Load the scripts in exactly this order:**

```html
<script src="lib/vendor/gsap.min.js"></script>
<script src="lib/vendor/three-fx.min.js"></script>
<script src="lib/fx.js"></script>
<script src="lib/fx-3d.js"></script>

<div class="layer" data-make="stage3d" data-bloom="0.8"
     data-fx="stars3d@0 galaxy3d@0 orb3d@0(in=1.5) orbit3d@0(turn=120,r=13,h=5,dur=6)"></div>
<h1 class="t-hero" data-fx="rise-in@0.6">HELLO, 3D</h1>
```

- One `data-make="stage3d"` is one 3D stage (one WebGL canvas and one camera). The heading above is a normal DOM element laid directly over the picture.
- The effects you write on a stage come in two kinds: those that **put things into the stage** (`stars3d` `galaxy3d` `orb3d` `tunnel3d` `waves3d` `globe3d` `blackhole3d` `burst3d` `text3d` `city3d`) and those that **move the camera** (`cam3d` `orbit3d`). Their parameters are in the 3D section of the effect catalog.
- How it differs from `fx-particles.js`: the particle module **simulates** perspective on a 2D canvas, is lightweight and needs nothing else; the 3D module has a real camera, real lighting and bloom and can handle one to two orders of magnitude more particles, but depends on three.js (`vendor/three-fx.min.js`, 753 KB).
- 3D scenes usually go with `theme-space`; there is no dedicated theme.

**Stage attributes**

| Attribute | Meaning |
|---|---|
| `data-bloom` | Bloom strength; `0` turns it off |
| `data-threshold` | How bright something must be to glow |
| `data-radius` | How far the bloom spreads |
| `data-bg` | Background color |
| `data-fog` | Fog density (around 0.003; distant things fade out) |
| `data-fov` | Camera field of view |
| `data-cam="x,y,z"` | Initial camera position |
| `data-look="x,y,z"` | Where the camera initially looks |
| `data-light="0"` | Turns off the default lighting |

**Camera**: the camera is a pure function of time. `cam3d` flies from the current position to a new one (`x` `y` `z`) while turning the view toward a new target (`lx` `ly` `lz`); `orbit3d` circles a target (`turn` is how many degrees, `r` the distance at the end, `h` the height at the end). Parameters you leave out stay unchanged. **Do not overlap `cam3d` and `orbit3d` in the same time span**, or it is unclear where the camera should go.

**Common object parameters**: `dur` (how long it exists), `fade` / `out` (fade in / out seconds), `px` / `py` / `pz` (placement), `s` (overall scale), `seed`.

**Notes**

- Bloom smears very bright text: when you use `text3d`, lower `data-bloom` to 0.35 to 0.5.
- Each `stage3d` is a WebGL context, so keep it to 7 or fewer per video.
- Frame-exact: particle positions are computed on the GPU from "attributes + time", and the same frame rendered twice is byte-for-byte identical.
- Rendering needs WebGL. With GPU acceleration it is fast (a 5-second clip renders in about 16 seconds); a machine without it falls back to software rendering, which is much slower.
- 3D output has a high bitrate; compress it with ffmpeg before uploading: `ffmpeg -i in.mp4 -c:v libx264 -crf 24 out.mp4`.

### Hand-written extras

For effects the library doesn't have, write GSAP directly. Use `at('sceneId', secondsInScene)` to convert to absolute time:

```js
FX.build({
  extra(tl, at) {
    tl.to('#logo', { rotation: 360, duration: 1 }, at('s3', 0.5));
  }
});
```

You can also register it as a new effect, usable from `data-fx` afterwards:

```js
FX.register('spin-in', '入场', 'Spin in', c => {
  c.tl.from(c.els, { rotation: -180, opacity: 0, duration: +(c.o.dur || 0.6) }, c.t);
});
```

> The second argument is the category key used by the catalog (`入场` Enter, `退场` Exit, `强调` Emphasis, `数据` Data, `文字` Text, `镜头` Camera, `角色` Character, `剪纸` Papercut, `组件` Components, `转场` Transitions). Keep these Chinese keys as-is.

**Three hard rules**: no CSS animation / transition; no `setTimeout` / `requestAnimationFrame`; for randomness use `FX.rand(seed)`, never `Math.random`.

## Five themes

Change one class on the root element to restyle the whole video:

| class | Style | Background | Title font | Accent | Good for |
|---|---|---|---|---|---|
| `theme-violet` | Violet tech | White `#fdfdfd` / dark `#171719` (switch per scene with `dark` / `light`) | YouSheBiaoTiHei | Violet `#8453e8` / light violet `#d5befe` | AI tools, productivity, workflow explainers |
| `theme-gold` | Black-gold cinema | Deep blue-black `#080a0f` + blurred footage + vignette | Gold gradient italic | Gold `#e4b256`; red `#ff5b56` only for declines | Finance, industry analysis, rankings |
| `theme-pixel` | Retro pixel | Beige halftone paper `#efe9dc` | Fusion Pixel font | Green `#9fe07a` · red · yellow | Anime hosts, light-hearted explainers |
| `theme-paper` | Papercut collage | Beige paper `#efe6d6` + pure-CSS paper grain | ZCOOL KuaiLe | Paper red `#c8322b` · teal `#2f6b6e` · mustard `#e3a83b` | Culture, solar terms, lifestyle, kids' science, handmade-feel brands |
| `theme-space` | Deep-space particles | Deep blue `#061226` (radial gradient) | Default title font, with a built-in cyan glow (also usable alone as `.t-glow`) | Cyan `#6fd3ff` · orange `#ff8a4d` | Tech, science explainers, space, launch-event openers, concept films; pair subtitles with `{style:'plain'}`; there is also `.scene.space-bg` |

All colors, fonts, corner radii and subtitle sizes are CSS variables at the top of `fx.css` (`--fx-bg` `--fx-accent` `--fx-font-title` …). Change the variables to build your own theme.

**Common style classes**

| Type | Class names |
|---|---|
| Text | `t-hero` `t-title` `t-h2` `t-h3` `t-body` `t-small` `t-en` (small English subtitle) `t-num` (big number) `t-mono` `t-pixel` `accent` `muted` `unit` |
| Layout | `layer` (full-screen layer) `abs` `center` `row` `col` |
| Cards | `card` `shot` (screenshot card) `glass` (glass card) `qcard` (question-mark placeholder card) `stat` (big-number card) |
| Labels | `pill` `note` (black annotation on a screenshot) `tag` `speed` (×3.5 fast-forward badge) `ptag` (pixel tag) |
| Components | `fx-window` (mac window; add `.pixel` for a pixel window) `fx-chat` (chat bubble) `fx-check` (checklist tick) `fx-cursor` (mouse cursor) `pbar` (pixel energy bar) `fx-hbar` (horizontal bar) |
| Background | `bg-footage` (blurred footage) `vignette` |
| Character | `host` (portrait container holding several `[data-pose]` images, used with `pose` / `lipsync`) |
| Papercut | `paper` (paper sheet; add `.red` `.teal` `.mustard` `.ink` `.tilt-l` `.tilt-r`) `paper-tag` (ragged-edge label) `tape` (masking tape) `fx-torn-shadow` (wrapper that adds a shadow to torn-edge elements) `scene.paper-bg` (paper-grain background for a scene under any theme); new variable `--fx-font-round` (rounded font) |

## FAQ

**Screenshots look fine, but the final video is missing the bottom strip and the subtitles?**
You rendered without `chrome-tall.sh`. See step 3 of "Quick start".

**An effect doesn't show up?**
First check the name for typos. A wrong name doesn't abort the render; it only prints `FX：没有这个动效` ("no such effect") to the console, visible with `npx hyperframes validate` or the browser console. Also check that the time doesn't exceed the scene duration.

**Chinese text turns into boxes, or the font is wrong?**
Body text uses the system PingFang SC. On non-macOS machines, install Noto Sans SC and add it to `--fx-font-body`.

**`npx hyperframes lint` reports `missing_timeline_registry` / `font_family_without_font_face`?**
These are false positives from the static check: the timeline is registered by `fx.js` at runtime, and the fonts are declared via `@import` in `fx.css`. Trust the frames produced by `snapshot`.

**Gradient text disappears after splitting?**
Gradient text made with `background-clip:text` (such as the gold text in the gold theme) vanishes when combined with splitting effects like `chars:`, `type` or `roll`. Give the text you animate per character a solid colour instead (e.g. `color:#e4b256`).

**Want to sync with a voice-over?**
Use the voice-over timestamps to fill each scene's `data-t` / `data-d` and the times in `FX.subtitles`. Effect times are all relative to the start of the scene, so they don't need to change.

**Particles not showing up?**
Check that `lib/fx-particles.js` is loaded (after `fx.js`), and that the particle effects are written on an element with `data-make="space"`; on any other element they draw nothing.

**The 3D picture is black / not showing up?**
Check three things: the scripts load in the order `gsap` → `three-fx.min.js` → `fx.js` → `fx-3d.js`; the 3D effects are written on an element with `data-make="stage3d"`; and the machine doing the rendering supports WebGL.

## License

- Code: [MIT](LICENSE). Third-party notes: [NOTICE](NOTICE).
- GSAP: used under GreenSock's [Standard License](https://gsap.com/standard-license) (free, including commercial use).
- Fonts: see [fonts/README.md](fonts/README.md).
- three.js: [MIT](https://github.com/mrdoob/three.js) (`vendor/three-fx.min.js` bundles r187 and the post-processing modules; license in [vendor/three-LICENSE.txt](vendor/three-LICENSE.txt)).

## Credits

The new effects and theme in v1.1 were inspired by these open-source projects:

- [animate.css](https://github.com/animate-css/animate.css) (MIT)
- [Magic UI](https://github.com/magicuidesign/magicui) (MIT)
- [React Bits](https://github.com/DavidHDev/react-bits) (MIT + Commons Clause)

Those projects are CSS animations or React components, which a frame-by-frame renderer cannot drive. motion-lib re-implements the corresponding effects for a seekable, reproducible timeline. We borrowed only the ideas and effect names (the original names in parentheses in the catalog) and **did not copy any of their code**.

The 3D module is built on [three.js](https://github.com/mrdoob/three.js) (MIT).

<!-- CATALOG:START -->
## Effect catalog (136 effects + 14 transitions)

> This section is generated from `fx.js` by `node gen-readme.mjs`. Do not edit it by hand.
> All effects accept the common parameters `dur` (duration), `ease` (easing) and `stagger`; the tables below list only each effect's own parameters.

### Enter (26)

How elements appear. By default they animate from a "pre-entry" state back to the element's own look, so any CSS position or rotation you set on the element is preserved.

| Name | What it does / parameters |
|---|---|
| `fade-in` | Plain fade-in, the most restrained; for subtitles and secondary notes |
| `rise-in` | Slide up from below + fade in, the most versatile entrance. Param: dist=offset in px |
| `drop-in` | Drop in from above + fade in; for tags and badges |
| `slide-in` | Slide in from one side. Params: dir=left/right/up/down (direction of motion), dist |
| `blur-in` | Blur to sharp, appearing in place; for big titles and screenshot cards |
| `blur-rise-in` | Blur + slide up + fade in, the standard cinematic title entrance |
| `scale-in` | Scale up from slightly smaller into place, the standard entrance for cards and images. Param: from=starting scale |
| `pop-in` | Pop: scale up from small with an overshoot bounce; for callout pills, icons, checks and crosses |
| `zoom-settle` | Settle from an enlarged, blurred state (like a lens snapping into focus); for opening headlines |
| `wipe-in` | Reveal with a mask wipe. Param: dir=right/left/up/down (direction the wipe advances) |
| `mask-rise` | Text rises from beneath an invisible baseline (mask slide-up); the strongest title feel |
| `flip-in` | Flip upright around the horizontal axis (3D); for card flips and revealing question cards |
| `tilt-in` | Fly in tilted with perspective (a 3D card turning to face front from the side); for UI screenshots |
| `stamp-in` | Stamp: slams down from very large and shakes when it lands; for conclusions, seals, checks and crosses |
| `drop-bounce` | Falls from above the frame and bounces twice on landing; for stacking objects and pixel blocks |
| `swing-in` | Swings down from the top edge like a hanging sign and settles |
| `focus-in` | Letter-spacing tightens from very wide + blur to sharp; common for small English titles and subtitles |
| `grow-x` | Grow from 0 along the horizontal axis (bars, dividers, progress bars). Param: origin=left/center/right |
| `grow-y` | Grow from 0 along the vertical axis (bar charts). Param: origin=bottom/top |
| `fan-in` | A stack of cards fans out from the center to their own positions (use with each:); final positions and angles follow your CSS |
| `type` | Typewriter: types out character by character. Params: cps=characters per second, caret=1 to show the cursor |
| `draw` | Line drawing: an SVG stroke is drawn along its path (connectors, arrows, circled callouts, line charts) |
| `pixel-in` | Pixel-style entrance: appears in 4-5 discrete steps (not smooth); with each: it can assemble block lettering |
| `scramble` | Scramble decode: each character first flickers through random glyphs (gray), then locks into the correct character (white) from left to right. Params: dur, chars=pool of scramble characters |
| `light-speed-in` | Light-speed entrance: rushes in from one side with a skew, overshoots, then straightens (animate.css lightSpeedIn). Params: dir=left/right (direction of motion), dist |
| `jack-in` | Jack-in-the-box: pops up gradually from the bottom, wobbles left and right twice and settles (animate.css jackInTheBox) |

### Exit (9)

How elements leave. Usually written as `@-0.4` (0.4 s before the scene ends).

| Name | What it does / parameters |
|---|---|
| `fade-out` | Fade out |
| `rise-out` | Slide up and away + fade out |
| `drop-out` | Slide down and away + fade out |
| `blur-out` | Blur + fade out (recedes into the background) |
| `scale-out` | Shrink + fade out. Param: to=ending scale (>1 means it grows as it disappears) |
| `slide-out` | Slide out to one side. Param: dir |
| `wipe-out` | Disappear with a mask wipe |
| `hinge` | Hinge drop: pinned at the top-left corner, it swings twice, then falls out of frame (animate.css hinge). Param: dist |
| `fall-out` | Falling text: each character tumbles down out of frame with some rotation (FallingText); usually used with chars:. Params: dist, seed |

### Emphasis (37)

For elements already on screen: emphasize them when the narration reaches them. Also covers movement, color changes and content swaps.

| Name | What it does / parameters |
|---|---|
| `pulse` | Scale up briefly and back (a tap when the narration hits this word). Param: to=peak scale |
| `shake` | Shake left and right (negation, errors, warnings) |
| `nod` | A small up-and-down hop (character nod, icon bounce) |
| `blink` | Blink a few times (cursor, warnings). Param: n=count |
| `color` | Change text / background color. Params: to=color, bg=background color |
| `marker` | Highlighter: a color block sweeps left to right across the bottom of the text. Params: color, h=block height in % |
| `underline` | Underline grows from left to right. Params: color, w=thickness in px |
| `strike` | A strikethrough sweeps across (the old plan is void) |
| `box` | Highlight box: draws an outline around the element (circle the key point on a screenshot). Params: color, pad, w, r |
| `glow` | Glow breathing: the halo lights up then fades. Params: color, n=count |
| `sheen` | Shine sweep: a highlight sweeps diagonally across a card / button |
| `ping` | Ripple: a ring expands from the element's center (click feedback, marking a location) |
| `dim` | Dim (demote to secondary). Param: to=opacity |
| `undim` | Restore brightness |
| `spot` | Spotlight: use with each:; the i-th child stays bright and slightly enlarged while the rest are dimmed. Param: i (1-based) |
| `float` | Continuous up-and-down floating (idle feel). Params: amp=amplitude, period=seconds per cycle, dur=how long it lasts |
| `spin` | Rotate. Params: deg=total angle, dur |
| `move` | Move the element to another element's position (cursor moves to a button, a tag flies into a card). Params: to=#target or x, y |
| `click` | Click: press-down shrink + ripple (use with the .fx-cursor component) |
| `swap` | Swap content in place: fades itself out and fades the target element in. Param: to=#target |
| `squash` | Card squash-and-spring: narrows horizontally then springs back (about 3 frames squash + 4 frames spring), often used together with a content swap. Param: to=narrowest ratio |
| `cycle` | Hard-cut carousel over children: one visible at a time, switching to the next every `every` seconds (a thumbnail whose picture keeps changing). Params: every, loop=1 to loop, stop=which item to stop on |
| `text` | Hard-cut text to new content (clock ticks, label changes). Param: v=new text |
| `to` | Universal tween: write GSAP properties directly. Example: to@2(x=120,scale=1.2,opacity=0.5,dur=0.6,ease=inout) |
| `tada` | Tada: shrinks slightly, then scales up and sways left and right (animate.css tada) |
| `jello` | Jello: skews back and forth with decreasing amplitude (animate.css jello) |
| `rubber-band` | Rubber band: stretches horizontally, squashes vertically, and bounces a few times (animate.css rubberBand) |
| `heartbeat` | Heartbeat: two quick scale-ups in a row (animate.css heartBeat) |
| `head-shake` | Head shake: a left-right shake with a bit of 3D rotation (for "no" or "wrong") (animate.css headShake) |
| `wobble` | Wobble: translates while tilting back and forth (animate.css wobble) |
| `border-beam` | Border beam: a short streak of light runs around the element's border (BorderBeam / StarBorder). Params: color, w=thickness, len=beam length as a fraction of the perimeter, n=laps, dur=seconds per lap, keep=1 to stay visible after finishing |
| `spotlight` | Spotlight: dims the screen and leaves one circular bright area over the target; calling it again in the same scene moves the spot to the new target (Spotlight). Put it on the element to light, or use to=#id. Params: r=radius, dim=darkness 0~1, off=1 to turn it off |
| `confetti` | Confetti: bursts a handful of confetti from the element's center, tossed up and falling back down (Confetti / ClickSpark). Params: n, colors=c1/c2/c3, power, seed |
| `sparkle` | Sparkle: little stars pop up at random around the element and twinkle (SparklesText). Params: n, color, dur, seed |
| `orbit` | Orbit: spreads the container's children evenly on a circle and rotates them around the center while keeping each child upright (OrbitingCircles). Put it on the container. Params: r=radius, turns=number of turns, dur, reverse=1 to reverse |
| `beam` | Connecting beam: draws an arc between two elements and a glow flows along it (AnimatedBeam, good for "A sends data to B"). Put it on the start element, to=#end. Params: curve=curvature, color, n=number of flows, dur |
| `flip-swap` | Flip and swap: the element flips around its vertical axis, the back shows the second child, then flips back (flip cards, reveal an answer). Put two children inside: the first is the front, the second is the back. Param: axis=y/x |

### Text (9)

Made for text: shimmer, glitch, word swap, delete-and-retype, split-flap, stroke, echo.

| Name | What it does / parameters |
|---|---|
| `shimmer` | Shimmer text: a highlight sweeps across the text from left to right (ShinyText). Params: color=highlight color, n=number of sweeps, gap=pause between sweeps |
| `glitch` | Glitch text: red/blue split + jitter + skew for a short burst, then settles (GlitchText). Params: amp=split in px, dur, seed. Note: it zeroes the element's x, so wrap the element in a shell if it needs to move itself |
| `rotate-words` | Word rotate: the word flips up and away, the next one flips in at the same spot (WordRotate). Params: words=B/C/D (separated by /, the element's original text is the first), every=seconds each word stays |
| `morph` | Morphing words: the old word blurs and disperses, the new one condenses out of the blur (MorphingText). Params: words=B/C, every |
| `retype` | Delete and retype: erases the existing text character by character from the end, then types the new text (TextType). Params: v=new text, cps=characters typed per second, del=characters deleted per second |
| `true-focus` | Word-by-word focus: only one word is sharp at a time, the rest blur, and a focus frame jumps to the active word (TrueFocus). For Chinese separate words with / (e.g. AI/won't/replace/you); English splits on spaces. Params: every, blur, color |
| `split-flap` | Split-flap board: each character flips through random glyphs, then settles on the right one from left to right (SplitFlap, airport departure board). Use as an entrance. Params: dur, stagger, chars=glyph pool |
| `stroke-in` | Stroke text: draws a hollow outline in one direction first, then fills in the color (StrokeText). Params: w=stroke width, color=stroke color, hold=seconds to stay hollow |
| `echo` | Echo entrance: several translucent copies trail behind and slide in together, then fade away once in place (EchoText). Params: n=number of echo layers, dist, dir |

### Data (6)

Numbers, progress and charts. Number effects automatically keep decimal places and thousands separators.

| Name | What it does / parameters |
|---|---|
| `count` | Number counter. Put the final number in the element, or set it with to=; from=starting value. Automatically keeps decimal places and thousands separators |
| `roll` | Digit-by-digit vertical roll: each digit is a 0-9 vertical strip that scrolls with blur and then stops from left to right (the $7,000 in the black-gold theme). Params: dur, stagger, spins=extra full turns |
| `clock` | Clock dial-in: from=23:28 to to=01:23 (crosses midnight automatically) |
| `fill` | Progress bar fill: grows the element's width (or height with dir=y) from from% to to% |
| `ring` | Ring progress: use with data-make="ring". Params: from, to (0-1) |
| `wave-live` | Waveform jumping: use with data-make="wave"; each bar fluctuates randomly from a seed. Params: dur, seed |

### Camera (11)

Applied to a whole container: push in, pan, 3D tilt, shake.

| Name | What it does / parameters |
|---|---|
| `push` | Slow push-in (Ken Burns): the whole container scales up slightly at constant speed over time. Params: from, to, dur |
| `pan` | Slow pan. Params: x, y (total displacement in px), dur |
| `zoom-to` | Zoom to a region: scales and pans the container so the target area fills the frame. Params: to=#target or x,y,w,h (px inside the container), fill=fraction of the frame |
| `zoom-reset` | Pull back from a close-up to the full view |
| `tilt` | Place at a 3D tilt and slowly rotate (a floating UI card). Params: rx, ry start angles; rx2, ry2 end angles |
| `drift` | Slow background drift (blurred card wall, particle layer). Params: x, y, rot, dur |
| `cam-shake` | Camera shake (heavy hit, error) |
| `meteors` | Meteor shower: streaks of light slanting across the screen (Meteors); put it on a full-bleed background layer. Params: n, angle=direction in degrees (default 135 = toward bottom-left), color, dur, seed |
| `marquee` | Marquee: a row of content scrolls horizontally in an endless loop (Marquee / LogoLoop). Put it on a single-row container; children are duplicated automatically to fill the width. Params: speed=px per second, reverse=1 to reverse |
| `bg-scroll` | Background pattern scroll: keeps the background (grid, texture, stripes) translating at a set speed; use it with the retro-grid component. Params: x, y=px per second |
| `parallax` | Parallax: layers inside the container translate at different speeds by order (back layers move less, front layers more); use it with the hills layered paper hills. Put it on the container. Params: x, y=total displacement of the front layer, dur |

### Character (5)

For stand-up portraits and little characters: switch poses, lip sync, nod, hop, walk.

| Name | What it does / parameters |
|---|---|
| `pose` | Switch character pose: put several [data-pose] images in a .host and hard-cut to the one named by name (talking-head portraits are normally hard cuts); bounce=1 adds a squash-and-spring |
| `lipsync` | Lip sync: hard-cuts between several [data-mouth] images in the container every `frames` frames (usually 2-4), returning to the first when done. Params: dur, frames, seed |
| `talk` | Small up-and-down bobbing while talking. Params: dur=how long it talks, rate=bobs per second |
| `hop` | Hop in place (surprise, joy). Params: h=height, n=count |
| `walk` | Walk over: horizontal movement + a bounce per step. Params: x=displacement or to=#target, steps=number of steps; for pixel characters add ease=steps(8) |

### Papercut (10)

Papercut / paper-craft collage style: unfold, cut open, tear, stick on, layers rising one by one, plus a handmade stop-motion feel at 12 fps. Pairs best with the `theme-paper` skin, but works with any skin.

| Name | What it does / parameters |
|---|---|
| `paper-unfold` | Paper unfold: like folded paper opening flat from the crease, with a bit of rebound. Param: dir=down/up/left/right (direction of unfolding) |
| `cut-in` | Scissor cut: "cuts" the element out snip by snip along a zigzag edge, advancing frame by frame for a papercut feel. Params: dir=right/left/down/up, teeth=number of teeth, jag=tooth depth (%), snips=number of cuts |
| `peel-in` | Corner peel: a sticker lifted at one corner settles back and is pressed flat. Param: corner=tl/tr/bl/br (which corner) |
| `layer-rise` | Layer rise: paper layers in the container rise from below one after another, back to front; the nearer the layer, the later and farther it rises (layered paper hills, paper stage). Put it on the container. Params: dist, stagger |
| `stick-on` | Sticker slap: slaps onto the paper from in front of the camera with a big shadow that tightens on landing (labels, photos). Params: from=starting scale, rot=starting tilt angle |
| `stop-in` | Stop-motion entrance: jumps in at the pace of 12 fps stop-motion, each frame with a random bit of tilt (handmade animation feel). Params: dist, steps=number of jumps, fps, seed |
| `jitter` | Stop-motion jitter: keeps tilting and shifting slightly at 12 fps, as if shot frame by frame by hand (boiling). Best added to an outer container so it does not fight an entrance effect for position. Params: amp=angle, px=offset, fps, dur |
| `lift` | Paper lift: floats up slightly while the shadow grows larger and fainter, as if pinched up by a finger; down=1 puts it back. Param: dist |
| `flutter` | Flutter: like a paper caught by a gust, it swings side to side a few times and slowly settles. Params: deg, n=number of swings, origin |
| `sway` | Hanging sway: hanging things (lanterns, tags, window flowers) keep swaying slowly left and right. Params: deg, period=seconds per swing, dur |

### Particles (8)

Canvas particles; requires loading the extra `fx-particles.js`. Write them on a canvas container made with `data-make="space"`: each effect is one layer of the canvas, stacked from bottom to top in the order written. Common parameters: `dur` (how long this layer lasts), `fade` / `out` (fade in / out seconds), `x` / `y` (center position in percent), `seed`.

| Name | What it does / parameters |
|---|---|
| `starfield` | Starfield: stars fly toward the camera from far away (with speed=0 it is a static twinkling sky). Params: n, speed, streak=trail length (1 or more makes a warp-speed beam), size, colors=color1/color2 |
| `nebula` | Nebula: a few large soft clouds of colored haze drift slowly; use it as the bottom-most background. Params: n=number of clouds, colors, alpha=density |
| `vortex` | Particle vortex: particles surge from the center toward the camera along spiral arms, with glowing streamlines (a space-time tunnel). Params: arms=number of arms, n, speed, twist=number of turns, spin=overall rotation speed, r=outer radius, colors (alternate per arm), lines=0 turns streamlines off |
| `blackhole` | Black hole: black disc + glowing halo + tilted accretion disk; particles orbit faster on the inner ring and slower on the outer one, and the near half passes in front of the hole. Params: r=hole radius, tilt=how flattened the disk is, rot=tilt angle, n, speed, c1=inner color, c2=outer color |
| `orb` | Energy orb: a glowing sphere built from triangular shards, slowly spinning with a bright core; it can gather from scattered shards into a sphere, or blow apart. Params: r=radius, detail=subdivision (1=80 shards, 2=320 shards), gap=gap between shards, spin, in=gather seconds, explode=second at which it blows apart, c1=lit-face color, c2=dark-face color, edge=outline color, core=core color |
| `burst` | Explosion: a cloud of particles and triangular shards blows out from the center with a white flash and a shockwave ring, slowing down until it fades away. Params: n, power=force, shards=share of shards 0~1, life=duration in seconds, colors, ring=0 turns the shockwave off, flash=0 turns the flash off |
| `form-text` | Particle text: tumbling little squares fly in from all sides and assemble a line of text (Chinese or English). Params: text, size=font size, font, weight, color, n=max particle count, start=how long they drift first, conv=gather seconds, glow=0 turns the text halo off, spacing=letter spacing in px |
| `stream` | Particle stream: trailing points of light flow sideways across the frame along wavy streamlines (data flow, signals). Params: n, speed, amp=wave amplitude, waves=number of waves across, tail=trail length, colors, reverse=1 reverses direction |

### 3D (12)

Real 3D scenes (three.js); requires loading the extra `vendor/three-fx.min.js` and `fx-3d.js`. Write them on a stage made with `data-make="stage3d"`: some effects put objects into the stage, others move the camera (`cam3d`, `orbit3d`). Common parameters for objects: `dur` (how long it exists), `fade` / `out` (fade in / out seconds), `px` / `py` / `pz` (placement), `s` (overall scale), `seed`.

| Name | What it does / parameters |
|---|---|
| `stars3d` | 3D starfield: a large cloud of stars scattered through space, with depth layers as the camera moves. Params: n, r=spread radius, size, colors |
| `galaxy3d` | Spiral galaxy: tens of thousands of particles arranged in spiral arms rotating around the center, faster inside and slower outside. Params: n, arms=number of arms, r=radius, inner=empty radius at the center, spin=rotation speed, twist=how much the arms curve, colors (alternate per arm), size, bright |
| `orb3d` | 3D energy orb: a sphere built from metallic triangular shards with real lighting and a glowing core; the shards can gather from scattered pieces into a sphere, or blow apart. Params: r=radius, detail=subdivision (1=80 shards, 2=320 shards), gap=gap between shards, spin, in=seconds to gather, explode=at which second to blow apart, power=blast strength, color=shard color, emissive=self-glow color, core=core color |
| `tunnel3d` | Particle tunnel: particles and light rings line up in a tunnel rushing toward the camera (put the camera inside the tunnel looking down it). Params: n, r=tunnel radius, len=length, speed, twist=how much it spirals, rings=number of rings (0 for none), colors |
| `waves3d` | Wave grid: a large ground of dots that undulates like water. Params: nx / nz=number of dots, w / d=width and depth, amp=wave height, freq=wave density, speed, c1=color at the troughs, c2=color at the crests |
| `globe3d` | Dot globe: a sphere made of dots that rotates slowly, with arcs of light flying between pairs of points on its surface (global network, data links). Params: r=radius, n=number of dots, arcs=number of arcs, spin, color=dot color, arc=arc color |
| `blackhole3d` | 3D black hole: a black sphere + a light ring that always faces the camera + a particle accretion disk; the camera can orbit around it. Params: r=black hole radius, n, disk=outer radius of the disk (multiple of r), speed, c1=inner color, c2=outer color |
| `burst3d` | 3D explosion: tens of thousands of particles blast outward in every direction, slowing as they fly, with one strong flash. Params: n, power=strength, life=duration in seconds, colors |
| `text3d` | 3D particle text: particles in space converge from all directions into a line of text with thickness, and the camera can circle it (Chinese and English both work). Params: text, w=text width in the scene, depth=number of thickness layers, start=how long they drift first, conv=seconds to converge, color, n=max particle count, font, weight, scatter=scatter radius |
| `city3d` | City: a street lined with buildings on both sides, lit windows, outlined walls, headlights flowing along the road, and an optional setting sun at the far end. Pair it with cam3d to fly down the street. The street runs along -z. Params: rows=how many rows deep, cols=how many columns per side, road=road width, lit=fraction of lit windows, colors=window colors, wall=wall color, edge=outline color (edge=0 for no outline), sun=sun color (sun=0 for none), traffic=0 turns off the traffic |
| `cam3d` | Move the camera: fly from the current position to a new one while turning the view toward a new target. Params: x / y / z=where to fly to, lx / ly / lz=where to look, fov=field of view, dur, ease (dur=0 cuts straight there). Any parameter you omit stays unchanged |
| `orbit3d` | Orbit camera: the camera circles a target, optionally moving in or rising at the same time. Params: turn=degrees to turn (negative goes the other way), from=start angle (omit to start from the current position), r=distance from the target at the end, h=height at the end, lx / ly / lz=what to circle around, dur, ease |

### Components (3)

Used together with components generated by `data-make`.

| Name | What it does / parameters |
|---|---|
| `step` | Step navigation switch: use with data-make="steps"; lights up the i-th pill (1-based) and turns the rest off |
| `chapter` | Chapter progress bar: use with data-make="chapters"; the highlight block slides to chapter i (1-based) |
| `check` | Checklist tick: use with the .fx-check component; the check mark is drawn and the text turns solid |

### Transitions (14)

Written on the **later** scene: `<section class="scene" data-in="blur-cross(dur=0.5)">`.

| Name | What it does / parameters |
|---|---|
| `cut` | Hard cut (default). The most common and fastest-paced |
| `fade` | Cross-fade |
| `blur-cross` | Blur cross: the previous shot blurs and fades out while the next goes from blurred to sharp |
| `zoom-through` | Zoom through: the previous shot scales up and rushes out of frame while the next scales up from small into place |
| `push` | Push: the new scene pushes the old one out. Param: dir=left/right/up/down |
| `wipe` | Wipe: the new scene covers the old one along a direction. Param: dir |
| `iris` | Iris: the new scene expands from a point to full screen. Params: x, y (percent) |
| `flash` | Flash to white (or any color): for key sentences and chapter openings. Param: color |
| `dip` | Dip to black: fades to dark then back up (change of topic). Param: color |
| `pixelate` | Pixel dissolve: blocks cover the screen in random order and then disperse (scene change for the pixel style). Params: cols, color |
| `paper-slide` | Paper pull: a new sheet slides in from one side over the old one, with a shadow along the edge and the old sheet slightly darkened. Param: dir=left/right/up/down |
| `tear` | Paper tear: the new scene is revealed from one side along a jagged torn edge (papercut-style scene change). Params: dir=right/left/down/up, jag, teeth |
| `glitch-cut` | Glitch cut: the new scene flickers a few times with a red/blue split, then stabilizes (tech-style cut) |
| `open` | Doors open: the new scene opens outward from a slit in the middle. Param: dir=x (opens left/right)/y (opens up/down) |
<!-- CATALOG:END -->
