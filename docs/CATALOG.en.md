# Effect catalog (282 effects + 24 transitions)

> [← README.en.md](../README.en.md)
> This section is generated from `src/` by `node scripts/gen-readme.mjs`. Do not edit it by hand.
> All effects accept the common parameters `dur` (duration), `ease` (easing) and `stagger`; the tables below list only each effect's own parameters.

## `data-make` (76)

`bars` · `wave` · `steps` · `chapters` · `ring` · `wall` · `dust` · `line` · `pixels` · `circle-text` · `retro-grid` · `papercut` · `hills` · `torn` · `switches` · `space` · `stage3d` · `tunnel` · `helix` · `flipboard` · `fan` · `slices` · `road` · `bignum` · `segments` · `actor` · `puppet` · `backdrop` · `device` · `menu` · `mini` · `house` · `letterbox` · `chat` · `terminal` · `code` · `agent` · `surround` · `hub` · `shape` · `phone3d` · `card3d` · `box3d` · `layers3d` · `deck3d` · `wall3d` · `flap3d` · `letterdeck` · `sleeve3d` · `carousel3d` · `slabs3d` · `coins3d` · `timeline3d` · `paperstack` · `callouts3d` · `youarehere` · `calgrid3d` · `ctabar` · `steplist3d` · `blueprint3d` · `gallery3d` · `corridor3d` · `stepchain3d` · `monolith3d` · `chip3d` · `laptop3d` · `keycap3d` · `rack3d` · `prism3d` · `gyro3d` · `iceberg3d` · `domino3d` · `scale3d` · `funnel3d` · `vault3d` · `pyramid3d`

---

## Enter (26)

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

## Exit (10)

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
| `scatter-out` | Scatter burst exit: elements fly outward in all directions with rotation and parabolic gravity (great for clearing clutter or busting myths). Params: power=force, dur, seed |

## Emphasis (41)

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
| `circuit` | Orthogonal circuit link: draws a Manhattan right-angled trace between two elements and sends glowing data packets along it (architecture diagrams, protocol flows). Put it on the start element, to=#end. Params: mid=bend ratio, packets=pulse count, color, dur |
| `overload` | Overload alarm: rapid jitter + flashing red warning glow (context overflow, system overload, errors). Params: amp, color, dur, seed |
| `scan` | Laser scanline: a glowing scanner band sweeps across a window or card (code reading, document retrieval, chart diagnostics). Params: dir=down/right, color, n=count, dur |
| `callout` | Leader-line callout: pulls an angled leader line from an element's edge and pops a text label (chart peaks, key data notes). Params: text, dx, dy, color |

## Text (9)

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

## Data (7)

Numbers, progress and charts. Number effects automatically keep decimal places and thousands separators.

| Name | What it does / parameters |
|---|---|
| `count` | Number counter. Put the final number in the element, or set it with to=; from=starting value. Automatically keeps decimal places and thousands separators |
| `roll` | Digit-by-digit vertical roll: each digit is a 0-9 vertical strip that scrolls with blur and then stops from left to right (the $7,000 in the black-gold theme). Params: dur, stagger, spins=extra full turns |
| `clock` | Clock dial-in: from=23:28 to to=01:23 (crosses midnight automatically) |
| `fill` | Progress bar fill: grows the element's width (or height with dir=y) from from% to to% |
| `ring` | Ring progress: use with data-make="ring". Params: from, to (0-1) |
| `wave-live` | Waveform jumping: use with data-make="wave"; each bar fluctuates randomly from a seed. Params: dur, seed |
| `reorder` | A ranking changes: the children of a column (or row) slide to their new places; the one that climbs grows slightly. Put it on the list container. Params: order (the new order as original positions separated by /, e.g. 3/1/2), dur (default 0.8) |

## Camera (14)

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
| `cam` | In a one-take film, a camera move inside a room: pan, push in, soften the background. Put it on the scene. Params: x / y (screen pixels; positive looks right / down), z (push-in factor, 1 is neutral), blur (background blur in pixels), to=#element (aim at it; pull=0.5 goes halfway), reset=1 to return to neutral, dur |
| `shot` | In a one-take film, change the camera position mid-scene: push into a room, or pull back to the wide shot outside the building. Put it on the scene. Params: room=number/all, dur |
| `push-into` | Push into a picture: the element first appears as a framed photo, the camera pushes in until it fills the screen, holds, then pulls back out. Put it on an absolutely positioned image inside the scene (left/top/width/height). Params: dur (total seconds from the push to the end of the pull), in / out (seconds for the push and the pull), cast=keep (characters stay), stay=1 (the frame remains after pulling out) |

## Character (25)

For stand-up portraits and little characters: switch poses, lip sync, nod, hop, walk.

| Name | What it does / parameters |
|---|---|
| `pose` | Switch character pose: put several [data-pose] images in a .host and hard-cut to the one named by name (talking-head portraits are normally hard cuts); bounce=1 adds a squash-and-spring |
| `lipsync` | Lip sync: hard-cuts between several [data-mouth] images in the container every `frames` frames (usually 2-4), returning to the first when done. Params: dur, frames, seed |
| `talk` | Small up-and-down bobbing while talking. Params: dur=how long it talks, rate=bobs per second |
| `hop` | Hop in place (surprise, joy). Params: h=height, n=count |
| `walk` | Walk over: horizontal movement + a bounce per step. Params: x=displacement or to=#target, steps=number of steps; for pixel characters add ease=steps(8) |
| `rig-idle` | Soft rig breathing: drives natural chest breathing, subtle hair sway, and seeded blinking on any bound SVG character. Params: dur, seed |
| `rig-pose` | Soft rig pose: smoothly transitions to a named pose or IK hand targets (lx, ly, rx, ry) with seamless continuous Bezier sleeves. Params: pose, lx/ly/rx/ry, look, face, emote, dur |
| `rig-talk` | Multi-viseme lip-sync: cycles naturally through [data-viseme] mouth shapes with subtle head rhythm, returning to the resting mouth when done. Params: dur, frames, nod=1, seed |
| `rig-nod` | Soft nod / head-shake: drives neck pivot and triggers spring follow-through on hair and accessories. Params: shake=1 (head-shake), n, amp, dur |
| `rig-wave` | Soft arm wave: arcs the IK hand target back and forth on a soft limb (arm=R/L) so the entire sleeve sways fluidly. Params: arm=R/L, n, amp, dur |
| `vrm3d` | 3D VRM anime avatar: loads any standard .vrm model onto a stage3d (MToon cel-shading + 54 humanoid bones + 5-vowel lip-sync + deterministic SpringBone hair physics). Params: src, ry, x/y/z, s, breathe/blink/sway/spring |
| `vrm-pose` | 3D VRM pose & expression: smoothly blends across 13 full-body anime presenter poses (idle, wave, explain, point, point-up, think, shock, clasp, reject, shrug, proud, cheer, bow), facial expressions (neutral, happy, relaxed, angry, sad, surprised), and eye gaze (look=cam/right/left/up/down, ry) |
| `vrm-talk` | 3D VRM 5-vowel lip-sync: drives aa/ih/ou/ee/oh morph targets with seeded syllable pauses and subtle speech head rhythm. Params: dur, rate, amp, seed |
| `vrm-nod` | 3D VRM head nod/shake/tilt: layers an additive 3D head/neck impulse on top of the active pose. Params: kind=nod/shake/tilt, n, amp, dur |
| `vrm-move` | 3D VRM stage move: translates or pops the 3D avatar root (e.g. pop-in from bottom or side step). Params: x/y/z, fromY, dur, ease |
| `vrm-anim` | 3D VRM mocap clip: plays standard .vrma (VRM Animation) motion-capture files deterministically on the timeline. Params: src, dur |
| `call` | Calls an actor over to this element (use it when the element is being discussed): the actor ducks where it is and pops up next to this element. Put it on the element being discussed; on a `<section>` it sends the actor back to its home. Params: who (actor name), at=top/left/right/below (default top: peeks over the element's top edge), size (default 340 for top, 420 otherwise), align (left-right position for at=top, 0–1), dx, dy, flip=1 (mirror so it faces the content), pose (switch pose at the same time) |
| `closeup` | Face close-up (reaction shot): hard-cuts to this actor's face, large, on a radial-burst background, holds, then hard-cuts back. Works with the existing bust sprites, no new art needed. Put it in the `data-fx` of the `<section>`. Params: who (actor name), dur (hold, default 1.1), pose (pose / expression during the close-up), kind (emotion mark to pop at the same time), color (background, default orange; also red / blue / green / purple), size (zoom size, default 1300) |
| `dismiss` | Makes an actor duck out of frame (when the whole frame should go to the content). Param: who |
| `pup-talk` | Sprite talks: swaps the three mouth frames from a mouth track while the head sways with the volume. Put it on `data-make="puppet"`, or target an actor with `who=name`. Params: dur (how long, defaults to the end of the scene); the track comes from `FX.mouthTrack = { fps, frames }` (produced by your voice tool), otherwise it is generated |
| `pup-pose` | Sprite pose change (hard cut, with an automatic blink and a tiny bounce at the swap). Put it on `data-make="puppet"`, or target an actor with `who=name`. Params: pose, pop=0 (no bounce) |
| `pup-nod` | Sprite nods once (a listener agreeing, a speaker stressing a point). Put it on `data-make="puppet"`, or use `who=name`. Param: amp (default 1) |
| `pup-lean` | Sprite leans its whole body to one side (toward the person speaking). Put it on `data-make="puppet"`, or use `who=name`. Params: deg (positive leans right, 0 returns upright), dur |
| `pup-emote` | A hand-drawn emotion mark pops up above the sprite's head. Put it on `data-make="puppet"`, or use `who=name`. Params: kind=question/exclaim/sweat/anger/sparkle/idea/heart/zap/dots, hold (seconds, default 1.6) |
| `pup-idle` | Just keeps the sprite alive (blinking, breathing, slow head sway) without talking. Put it on `data-make="puppet"`; not needed if any of pup-talk / pup-nod / pup-lean / pup-emote is used |

## Papercut (10)

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

## Particles (8)

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

## 3D (37)

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
| `chip-explode` | Apple-keynote 5-layer 3D chip explosion: separates `chip3d` BGA gold pins, PCB substrate, glowing neural silicon die, CNC aluminum frame and brushed titanium IHS vertically with 3D leader callouts. Params: dur (default 1.4), spread (default 1), spin (default 18) |
| `chip-assemble` | 3D chip compute pulse & magnetic snap-back: pulses the silicon die cores on `chip3d` and snaps all 5 layers back together. Param: dur (default 1.1) |
| `laptop-open` | 3D unibody laptop hinge lid reveal: opens `laptop3d` smoothly around its rear hinge to 102°, igniting the screen and casting glow onto the 65 sculpted keys. Params: dur (default 1.5), open (default 1), turn (default 22) |
| `laptop-close` | 3D laptop lid close: smoothly closes `laptop3d` around its physical hinge. Param: dur (default 1.1) |
| `key-press3d` | Macro mechanical switch tactile keystroke: depresses `keycap3d` spherical keycap & cross stem, physically compresses the 3D golden helical coil spring, flashes RGB shockwave and rebounds (staggers multi-key chords). Params: dur (default 0.55), stagger (default 0.14) |
| `key-explode3d` | Macro mechanical switch 5-layer exploded view: separates keycap, frosted top housing, MX stem, golden coil spring and smoked bottom housing on `keycap3d`. Params: dur (default 1.3), spread (default 1) |
| `rack-boot3d` | AI server rack sequential power-up & fiber streams: boots all 4 server blades bottom-to-top on `rack3d` while streaming glowing fiber-optic data tubes. Param: dur (default 1.5) |
| `blade-slide3d` | Server blade hot-swap drawer slide-out: slides server blade `i` (1..4; 0 retracts all) forward out of `rack3d` along its rails and illuminates its status LED. Params: i (default 2), dist (default 0.92), dur (default 0.9) |
| `prism-split3d` | Optical crystal prism laser dispersion: fires an input beam into `prism3d`, ignites the octahedral core, and refracts multi-color dispersion beams & route badges out the right face. Param: dur (default 1.6) |
| `gyro-spin3d` | 3-axis gimbal AI core differential rotation: spins outer graduated ring, mid trunnion ring, golden inner ring and central core on orthogonal axes with orbiting satellite nodes on `gyro3d`. Params: dur (default 4.0), speed (default 1) |
| `gyro-lock3d` | Gimbal rings coplanar magnetic lock & shockwave: snaps all three spinning rings of `gyro3d` into alignment with an expanding energy ring. Param: dur (default 0.95) |
| `showcase-orbit` | Telephoto 3D hardware orbit & zoom: smoothly transitions pitch, yaw and zoom on any `fx-showcase3d` hardware rig. Params: rx, ry, zoom (default 1.18), dur (default 1.5) |
| `ice-tip3d` | Iceberg combo beat 1 — 10% surface tip: frames the sparkling ocean waterline and white glacial tip on `data-make="iceberg3d"` with its surface callout (`data-tip`). Param: dur (default 1.2) |
| `ice-dive3d` | Iceberg combo beat 2 — plunge beneath the waterline: dives the camera underwater on `iceberg3d`, illuminating the massive 3-tier 90% submerged ice mass and revealing deep truth callouts (`data-depths`). Param: dur (default 1.8) |
| `domino-fall3d` | Domino combo beat 1 — chain-reaction tracking shot: topples labeled 3D beveled domino monoliths (`data-tiles`) sequentially along an arc while tracking the collapse wave on `domino3d`. Param: dur (default 1.8) |
| `domino-shield3d` | Domino combo beat 2 — heavy interceptor shield slam: drops an armored glowing barrier gate into the gap on `domino3d`, halting the cascade and saving the final core tile (`data-shield`). Param: dur (default 1.1) |
| `scale-drop3d` | Balance scale beat 1 — heavy block slam: drops the dark iron weight onto the left pan (`data-left`) of `scale3d` with true plumb suspension kinematics and gauge deflection. Param: dur (default 1.2) |
| `scale-flip3d` | Balance scale beat 2 — high-leverage golden core reversal: drops a radiant power core into the right pan (`data-right`) of `scale3d`, unleashing a shockwave and hoisting the heavy left block effortlessly. Param: dur (default 1.4) |
| `funnel-pour3d` | Filtration funnel beat 1 — 3D vortex intake: swirls multi-color raw noise shards into 3 counter-rotating filter rings on `funnel3d`. Param: dur (default 1.5) |
| `funnel-distill3d` | Filtration funnel beat 2 — pure golden core crystallization: glides down `funnel3d` as noise is filtered away, condensing a single glowing golden core above the collector dish (`data-stages`). Param: dur (default 1.6) |
| `vault-unlock3d` | Armored vault beat 1 — dual ratchet wheel decryption: counter-rotates outer and inner combination gears on `vault3d`, retracts 6 chrome locking bolts and turns perimeter LEDs green. Param: dur (default 1.3) |
| `vault-open3d` | Armored vault beat 2 — heavy hinge swing & core formula reveal: swings the thick vault door open 98° around its left hinge on `vault3d` while pushing into the glowing inner tablet (`data-secret`). Param: dur (default 1.6) |
| `pyramid-build3d` | Tiered pyramid beat 1 — 3-step magnetic foundation build: tracks upward on `pyramid3d` as L1–L3 beveled steps lock in and illuminate their front tier plates (`data-tiers`). Param: dur (default 1.6) |
| `pyramid-crown3d` | Tiered pyramid beat 2 — crystal apex coronation & overview: lowers the transmissive golden apex crown onto `pyramid3d` with a shockwave and pulls back to reveal all 4 tier callouts. Param: dur (default 1.5) |
| `narrative-cam3d` | Custom 3D narrative camera move: layers pitch `rx`, yaw `ry`, `zoom` and `lookY` onto any `fx-narrative3d` combo stage. Param: dur (default 1.4) |

## White 3D (40)

Tactile 3D white-studio & grid-desk motion, loaded from `fx-desk3d.js` (paired with `theme-white3d` or `theme-white3d desk`). Provides extruded 3D phones (`phone3d`), thick double-sided cards (`card3d`), 6-face boxes (`box3d`), exploded isometric layer stacks (`layers3d`), curved card decks (`deck3d`), tilted floating card walls (`wall3d`) and mechanical split-flap counters (`flap3d`), with floor shadows linked to Z-height.

| Name | What it does / parameters |
|---|---|
| `pose-3d` | 3D pose transition: moves a `phone3d`, `card3d`, `box3d` or card to target 3D angles and Z-height while shifting and diffusing its floor shadow. Params: ry / rx / rz, z, s, x / y, dur |
| `flip-3d` | Mid-air 3D flip: lifts a `card3d` (or `.front`/`.back` badge) in Z, flips 180° in air with dynamic shadow spread, and lands back on the white desk. Params: lift (default 110), dur (default 0.72) |
| `deal-arc` | Curved deck deal: deals thick cards from a stacked pile out along a 3D horseshoe or fan arc on `data-make="deck3d"`. Param: dur (default 1.1) |
| `deck-gather` | Gather deck back into a stack: sweeps spread/curved cards on `data-make="deck3d"` back into a neat thick deck brick. Param: dur (default 0.85) |
| `letter-shuffle` | Poker letter-tile shuffle: bounces `data-make="letterdeck"` tiles and flips `{highlighted}` character cards red with a playful tilt. Param: dur (default 0.55) |
| `sleeve-draw` | Draw thick deck from slipcase: slides the 3D outer box of `data-make="sleeve3d"` aside while drawing out the inner stack of cards. Param: dur (default 0.9) |
| `grid-hero` | Grid card Z-promotion: elevates card i (1..N; 0 restores) from a grid into center-stage foreground while softening surrounding cards. Params: i, s (default 1.65), dur |
| `carousel-next` | Tabletop Polaroid carousel: advances `data-make="carousel3d"` to card i (or `steps` ahead) while rippling the bottom poker hand. Params: i, steps, dur |
| `card-storm` | 3D card vortex storm: swirls child cards along a 3D spiral with foreground depth-of-field blur (great for information overload). Params: dur (default 2.6), r (default 320) |
| `box-drop` | 3D box gravity drop: drops a 6-face `box3d` onto the white surface with settle bounce and contact shadow compression. Params: drop (default 220), dur (default 0.68) |
| `slab-shatter` | 3D monolith domino & shatter: topples `data-make="slabs3d"` thick slabs into one another and blasts them into tumbling 3D shards. Param: dur (default 1.35) |
| `coin-drop` | 3D coin / chip toss & bounce: drops thick metallic `data-make="coins3d"` with 3D spin and tightening floor shadows. Param: dur (default 0.78) |
| `polaroid-eject` | Polaroid slot eject + progress bar: slides a `card3d` Polaroid out from above and fills its bottom progress bar to 100%. Param: dur (default 0.9) |
| `layer-explode` | Exploded 3D stack: separates compressed plates vertically on `data-make="layers3d"` while drawing dashed corner guides and horizontal callout lines. Param: dur (default 0.9) |
| `layer-focus` | Focus layer i: lifts and highlights layer i (1..N from bottom; 0 restores all) on `data-make="layers3d"` while dimming other layers cleanly. Params: i, dur |
| `board-lay` | Tilt board into 3D timeline: lays `data-make="timeline3d"` back 56° onto the desk while popping clip cards upright and sweeping the playhead. Param: dur (default 1.2) |
| `stack-print` | Paper stack print + decay bar: stacks printed sheets onto `data-make="paperstack"` while draining the freshness meter to `to%`. Params: to (default 62), dur (default 1.4) |
| `lock-callouts` | Viewfinder lock + multi-leader callouts: snaps 4 corner brackets onto `data-make="callouts3d"` and draws horizontal leader lines. Param: dur (default 0.7) |
| `pin-move` | Timeline pin advance: slides the red `YOU ARE HERE` pin across `data-make="youarehere"` from `from` to `to` (0–1). Params: from, to, dur |
| `wall-pull` | 3D card wall pull-back / push-in: pulls back from a flat close-up on the center card to a tilted 3D floating card matrix on `data-make="wall3d"` (`dir=in` pushes in). Params: dur (default 1.25), zoom (default 2.3) |
| `rig-focus` | Multi-mockup 3D focus shift: rotates item i (1..N; 0 restores ensemble) toward the camera and steps it forward in Z while angling siblings back. Params: i, s (default 1.06), dur |
| `phone-split` | Hero phone center-to-split: starts with the 3D phone centered large, then glides it aside to reveal its companion card. Param: dur (default 0.78) |
| `screen-pop` | On-screen slice pop-out: peels a highlighted row (`.fx-pop-slice` or `to=#id`) out of a device screen along +Z with deep shadow. Params: to, s (default 1.12), dur |
| `phone-wave` | 3D phone wave lineup: ripples a row of `phone3d` mockups upright in a staggered 3D domino wave. Params: dur (default 0.65), stagger (default 0.08) |
| `float-pop` | White-studio Z-pop: pops floating pills (`.fx-float-pill`) or score cards (`.fx-score-card`) forward in Z with soft studio elevation shadow. Param: dur (default 0.46) |
| `flap-to` | Mechanical split-flap advance: flips tiles on `data-make="flap3d"` to `to` (or `data-to`; write `_` for commas inside params, e.g. `10_000+`). Params: to, dur (default 0.36), stagger (default 0.06) |
| `cal-flip` | 30-day calendar card flip + counter surge: flips all tiles of `data-make="calgrid3d"` while rolling the top KPI counter to `to`. Params: to (default 18862), dur (default 1.6) |
| `bubble-pop3d` | 3D off-screen chat bubble pop: launches `.fx-pop-bub` bubbles out of a tilted phone screen into layered Z-space. Param: dur (default 0.5) |
| `cta-click` | White-pill cursor click + confetti: flies cursor onto `data-make="ctabar"`, clicks button to completed state and bursts confetti. Param: dur (default 0.9) |
| `desk-invert` | White desk ⇄ dark gold grid invert: flips the desk surface to dark charcoal-gold grid (`mode=reset` restores white desk). Param: mode=dark/reset |
| `step-focus` | White-studio step pipeline focus: advances `data-make="steplist3d"` to step i (1..N; 0 lights all), marking earlier steps done and dimming later ones. Params: i, dur (default 0.42) |
| `blueprint-scan` | Takeaway blueprint crop-mark lock: snaps 4 corner viewfinder brackets onto `data-make="blueprint3d"` and illuminates step rows sequentially. Param: dur (default 0.65) |
| `check-fix` | Lint error auto-fix flip: flips a `.fx-check-row.is-bad` row around X into `.is-good` passed state and updates its message. Params: badge, after, dur (default 0.52) |
| `pop-3d` | 3D spring pop-out: launches cards or `phone3d`/`card3d` mockups forward out of Z-depth onto the white studio desk with tactile overshoot (supports `each:` stagger). Params: dur (default 0.44), stagger (default 0.14), fromY |
| `corridor-fly` | 3D gallery corridor fly-through & focus lock: flies the camera down a corridor of floating beveled 3D gallery frames with near-lens bokeh and floor contact shadows, settling on the center hero frame. Param: dur (default 3.8) |
| `hero-split3d` | Hero frame 3D tilt + glass backing & CAD wireframe peel: shifts and tilts the hero frame right, peeling out frosted glass plates, an 8-handle CAD selection wireframe and a 3D scrub bar while revealing the left title. Param: dur (default 1.7) |
| `step-track3d` | 3D porcelain step-slab dolly track + hopping orange Bezier arc: tracks laterally across vertical 3D step slabs (`step-slab.glb`) while drawing 3D vermilion U-arcs led by a glowing sphere. Param: dur (default 3.8) |
| `step-overview3d` | 3D step-slab wide overview pull-back: pulls the camera back to frame all 3D vertical step slabs, complete orange Bezier connector chain and studio floor shadows together. Param: dur (default 1.4) |
| `monolith-rise3d` | 5-card tree convergence + 3D chamfered monolith flip-up: lifts step cards to the top row, sprouts orange S-curve tree branches & 3D tag pills, and flips up a massive beveled ceramic monolith block (`monolith-slab.glb`). Param: dur (default 3.6) |
| `gallery-cam3d` | Custom 3D gallery camera move: smoothly adjusts `gallery3d` camera position, look-at target or FOV at any timestamp. Params: x, y, z, lx, ly, fov, dur (default 1.2) |

## Space (21)

World canvas, camera and image-set moves; requires loading the extra `fx-world.js`. Put `data-world` on the root element and every scene becomes a station on one big canvas: changing scenes means the camera travels there. Camera effects need `data-world`; the focus and image-set effects work on any page.

| Name | What it does / parameters |
|---|---|
| `cam-look` | Camera pushes in on one element inside the station (use it when the voice-over reaches that element); follow with `cam-home` to pull back. Params: to (selector, defaults to the element itself), fit (how much of the frame it should fill, default 0.6), max (maximum zoom, default 1.4), dur |
| `cam-home` | Camera returns to the full view of the current station (use after `cam-look`). Param: dur |
| `cam-wide` | Camera pulls out to show the whole canvas (opening overview, closing recap). Written as `cam-wide@0` the film starts on the overview; push in with `cam-home`. Param: dur |
| `wake` | Place first, talk later: the element is on screen from the start but dimmed, and lights up when mentioned. Params: dim (brightness before it lights up, default 0.3), solid=1 (darken and desaturate instead of fading, so a card never shows the backdrop through it; on automatically in stage mode) |
| `zoom-here` | In-place zoom: pick one item out of a group and enlarge it where it sits while the rest fade to 30% and step back. Params: s (scale, default 2.4), hold (seconds before it returns automatically; omit to keep it), dim |
| `push-back` | Background blur: when new content arrives, push the previous layer back as a whole (scale to 94%, blur 4px, darken to 55%). Params: s, blur, dim, dur |
| `bring-front` | Bring back a layer that `push-back` pushed away |
| `depth` | Depth layers: children carry `data-depth="near/mid/far"`; the farther from focus the blurrier (0 / 4 / 8px), with per-layer parallax drift. Params: focus (which layer is sharp, default mid), shift (parallax amount, default 40), blur |
| `rack-focus` | Rack focus: move the sharp layer to another one (used with `depth`). Params: to=near/mid/far, dur |
| `bg-tint` | Background colour swap: when the image changes, the whole background changes to its dominant colour so viewers see the switch at a glance. Params: color (`reset` restores the original), dur (default 0.5), to (element to tint, defaults to the whole canvas) |
| `skeleton` | Skeleton fill: a complex interface first appears as grey skeleton blocks, then real content fills in block by block in reading order. Put it on the container; its children are the blocks. Params: gap (delay between blocks, default 0.15), hold (how long the skeleton stays first, default 0.5) |
| `deal-in` | Deal-in: a set of images does not appear at once; they fly in one after another along an arc to their places. Use with `each:`. Params: stagger (default 0.1), from=left/right, dur |
| `drop-gather` | Drop and gather: a pile of images drops from above, gathers into a fan, keeps only the few to be discussed and lets the rest fall away. Put it on the container; add `data-keep` to children to keep (otherwise the first `keep` are kept). Param: keep (default 3) |
| `fly` | Depth tunnel: the camera flies continuously inward; the item it passes scales up and blurs, the next fades in from the depth. Put it on `data-make="tunnel"`. Params: to (fly to which item, counted from 1), each (seconds per item, default 0.7) |
| `helix-spin` | Helix: the camera orbits a cylinder of images, fast then slow, then keeps turning slowly. Put it on `data-make="helix"`. Params: turn (degrees of the fast turn, default 300), dur (fast-turn time, default 2.4), slow (degrees per second afterwards, default 10) |
| `flip-to` | 3D flip board: panels roll upward one after another, each flipping around the horizontal axis; the one facing the camera shows in full colour, the rest dim to 30%. Put it on `data-make="flipboard"`. Params: i (flip to which panel, counted from 1), dur |
| `pick` | Lift and make way: in a fan of images, the one being discussed lifts and enlarges while its neighbours slide aside; all others stay visible. Put it on `data-make="fan"`. Params: i (which one, counted from 1; 0 = put all back), s (default 1.3), gap (how far the others move, default 90), lift (default 70) |
| `slice-to` | Slice swap: the new image is cut into strips that grow up from the bottom one by one, with the number label flipping in sync. Put it on `data-make="slices"`. Params: i (which image, counted from 1; omit for the next one), stagger (default 0.07), dur |
| `road-walk` | Walk into the picture: the camera moves along a road close to the ground; each step lights up as it is reached. Put it on `data-make="road"`. Params: i (walk to which step, counted from 1), dur |
| `bignum` | Chapter card entrance: the big number drops in, the title slides out after it. Put it on `data-make="bignum"`. Param: dock (seconds before it shrinks into a small top-left label; omit to keep it) |
| `segment` | Progress line advances to segment i (counted from 1). Put it on `data-make="segments"`, usually in a persistent overlay layer |

## Stage (10)

Stage-play parts for "presenter in front, scene behind, information as picture-in-picture" explainers; requires loading the extra `fx-stage.js`. Scene backdrops (`backdrop`), devices with on-screen content (`device`), full-screen illustration inserts, a choice panel (`menu`) and small full-body actors (`mini`). Use it without `data-world`: scenes hard-cut, and `data-in="mosaic"` changes the backdrop.

| Name | What it does / parameters |
|---|---|
| `dither-in` | The picture resolves from two-tone pixel noise to clear (like an old console booting or a signal locking on). Put it on a data-make="backdrop"; with data-dither it ends as pixel art, otherwise on the original picture. Params: dur (default 1.6) |
| `light-sweep` | A soft diagonal light sweeps across once (a premium touch for a conclusion, a product or a ranking). Put it on a scene, a backdrop or any element. Params: dur (default 1.6), angle (band angle, default 115), color, strength (0–1, default 0.5) |
| `light-leak` | A film light leak: warm light washes in from one side and fades (memories, turns, emotional peaks). Put it on a scene or a backdrop. Params: dur (default 4), tone=warm/cool, strength (0–1, default 0.9) |
| `cutaway` | Illustration insert: a full-screen picture cuts in hard, pushes in very slowly, then cuts back out; it covers the actors while subtitles and the chapter bar stay. Put it on an `<img>` inside the scene. Params: dur (hold, 1.2–2.5 s), zoom (default 1.07), x / y (pan in percent), under=1 (sit below the actors so the presenter keeps talking over it; good for full-screen screen recordings) |
| `screen-to` | On-screen cut: the content inside a device screen hard-cuts to item i (counted from 1; omit for the next one) with a faint flash. Put it on `data-make="device"` |
| `dive` | Dive into the screen: the device zooms toward the camera until its screen fills the frame (give the next scene the same picture as its backdrop and it feels like walking into the screen). Put it on `data-make="device"`, usually in the last 0.5 s of the scene. Param: dur (default 0.5) |
| `frames` | Frame-sequence playback: plays a series of stills as video (gameplay, screen recordings), frame-accurate. Put `data-frames="dir/f_%03d.jpg" data-n="count"` on the element. Params: fps (default 15), dur (defaults to the end of the scene; loops) |
| `choose` | Pick an option: the highlight bar of a choice panel jumps to item i and ticks it. Put it on `data-make="menu"`. Params: i (counted from 1; `2/4/1/3` makes several quick picks in a row), every (interval between quick picks, default 0.28 s) |
| `mini-walk` | A mini actor walks over: two alternating walk frames plus horizontal movement, then stands still. Put it on `data-make="mini"`. Params: x (distance, negative goes left) or to=#target, dur, step (seconds per step, default 0.16) |
| `mini-pose` | A mini actor switches action (raise hand, cheer, sit…) with a small squash-and-bounce. Put it on `data-make="mini"`. Params: name (an action listed in `data-poses`), hold (seconds before returning to idle; omit to keep it) |

## Hand-drawn (5)

Hand-drawn annotation, loaded from `fx-ink.js`. Lines wobble a little, draw on in stroke order, and once drawn they "boil" (re-pose ten times a second). Put them on the element you annotate; shared params `color` (defaults to the skin accent), `w` (line width), `dur`, `boil=calm|lively|off`.

| Name | What it does / parameters |
|---|---|
| `ink-circle` | Hand-draw a loop around the element (pen starts at the upper left and overshoots a little), with an optional note beside it. Params: label (the note), at=right/left/top/bottom (where the note goes), pad (how much larger than the element, default 18), color, w, dur |
| `ink-underline` | Hand-drawn lines: squiggly underline, strike-through, left bracket. Params: kind=squiggle/double/strike/bracket, color, w, dur |
| `ink-box` | Hand-draw a box around the element, with an optional tab label at the top left. Params: label, pad (default 14), color, w, dur |
| `ink-arrow` | Draw a hand-drawn arrow from this element to another. Params: to=#target (or dx / dy offsets in pixels), tx / ty (which point inside the target, 0–1; omit to point at the nearest point on the target's edge), curve=straight/gentle/swoop, side=1/-1 (which way it bends), gap (space left at both ends), color, w, dur |
| `ink-mark` | Vox-style annotation: a marker stroke on one word of a sentence while a thin line draws out to a short note. Params: word (the word to mark; omit to mark the whole element), style=highlight/circle/underline/scribble, note (the note; omit for the mark alone), color, dur |

## Chat & code (8)

The screens that keep appearing in AI videos, loaded from `fx-chat.js`: a chat window (`data-make="chat"`), a typed prompt, a terminal (`data-make="terminal"`), code (`data-make="code"`) and an agent cursor (`data-make="agent"`). They move like the real software: messages grow from the sender's corner, AI answers arrive in bursts, people type in uneven chunks.

| Name | What it does / parameters |
|---|---|
| `msg` | One chat message arrives, growing from the sender's corner in 0.12 s. Put it on data-make="chat". Params: i (which message, counted from 1) |
| `typing` | The "typing…" bubble: three dots pop in where message i will appear and leave after dur seconds (usually followed by msg / stream-in for the same message). Put it on data-make="chat". Params: i, dur (default 1.2) |
| `stream-in` | An AI answer arrives in bursts the way streamed tokens do; fresh text lands grey and inks to full colour over 0.27 s. Put it on data-make="chat" (message i) or on any block of text. Params: i, speed (default 1) |
| `prompt` | Type into a prompt like a person: one to three characters at a time with uneven pauses; the caret blinks while typing and stays on after. Put it on an element that holds only text (add class="fx-prompt" for an input box). Params: fix (a mistyped word, typed first, deleted and corrected), glyph (leading glyph, default ›, none to hide), speed |
| `run` | Run a command in a terminal: type it, pause a beat, print the output line by line, then show a fresh prompt. Put it on data-make="terminal". Params: every (seconds between output lines, default 0.22), speed (typing speed) |
| `diff` | A code change: lines to remove turn red and collapse, lines to add turn green and expand. Put it on data-make="code" (lines starting with "- " are removed, "+ " added) |
| `code-focus` | A highlight band sweeps across one line of code and the other lines dim. Put it on data-make="code". Params: i (line number as finally shown, from 1; 0 restores all) |
| `agent-go` | Agent cursor: the name tag types out what the agent is about to do, then the cursor moves to the target and clicks with a ripple. Put it on data-make="agent"; write it several times in a row. Params: to=#target (omit to stay), say (text on the tag), click=0 (no click), done=1 (a check mark for a finished step) |

## Diagrams (3)

Relationship diagrams, loaded from `fx-diagram.js`: surround (`data-make="surround"`) and hub-and-spoke (`data-make="hub"`). The center never moves; only what surrounds it does.

| Name | What it does / parameters |
|---|---|
| `surround-in` | The center settles, then the chips around it arrive one by one; with close=1 they then close in together while the edges darken. Put it on data-make="surround". Params: gap (seconds between chips, default 0.3), close=1 |
| `overwhelm` | A crowd of chips rushes in from every side, faster and faster, and crowds the still center (overload, too much at once). Put it on data-make="surround" (labels cycle through data-chips). Params: n (8–24, default 16), intensity (0.5–2: higher packs tighter and faster), dur (how long the rush takes, default 2.2) |
| `hub-node` | Node i of a hub diagram: its connector draws out from the center and the node pops on. Put it on data-make="hub", one per node as the narration reaches it. Params: i (from 1) |

## Shapes (3)

Shape morphing, motion along a path and springy wiggles, loaded from `fx-shape.js` plus the matching GSAP plugins in `vendor/gsap-plugins/` (MorphSVG, MotionPath, CustomEase, CustomWiggle, now free for commercial use). Twelve built-in shapes (`data-make="shape"`): check cross circle square triangle star heart bolt arrow-up arrow-down play bulb.

| Name | What it does / parameters |
|---|---|
| `shape-morph` | A shape smoothly turns into another (✗ into ✓, a circle into a star…), optionally changing colour. Put it on data-make="shape" or on any svg holding one <path>. Params: to (a built-in shape: check cross circle square triangle star heart bolt arrow-up arrow-down play bulb, or #id of another path), color, dur (default 0.6). Needs MorphSVGPlugin |
| `path-move` | Move along an SVG path, turning to follow it (a paper plane, a data packet, a delivery route). Put it on the moving element. Params: path=#path id (required), dur (default 1.6), rotate=0 (no turning), draw=1 (draw the path as it goes), from / to (which part of the path, 0–1). Needs MotionPathPlugin |
| `wiggle` | A springy wiggle that settles (when something is called out, mocked or goes wrong). Params: n (how many swings, default 6), amp (degrees, default 8), dur (default 0.8), prop=rotation/x. Needs CustomEase + CustomWiggle |

## Sound (1)

The sound layer, loaded from `fx-sound.js`. Once loaded, **every effect carries its own sound** (a pop for pop-ins, a thump for landings, a swish for slides, a whoosh for transitions, ticks for typing…), all synthesised in code with no audio files. Any effect takes `sfx=name` to use another sound or `sfx=none` to stay silent. The effect below places a sound where nothing moves on screen. Add `?play` to the URL to hear it in the preview; `node lib/sfx.mjs <project>` writes the effects track for the final film.

| Name | What it does / parameters |
|---|---|
| `sfx` | Play one sound effect on its own (it sounds even when nothing moves on screen). Params: kind=pop/tick/click/swish/whoosh/thump/snap/hit/ding/chime/blip/rise/fall/buzz/sparkle/zap/glitch/paper/flap/card/rumble/swellup/shimmer/type/roll/step/dots, vol (volume multiplier), pitch (pitch multiplier), dur (seconds, for sustained sounds) |

## Components (4)

Used together with components generated by `data-make`.

| Name | What it does / parameters |
|---|---|
| `step` | Step navigation switch: use with data-make="steps"; lights up the i-th pill (1-based) and turns the rest off |
| `chapter` | Chapter progress bar: use with data-make="chapters"; the highlight block slides to chapter i (1-based) |
| `check` | Checklist tick: use with the .fx-check component; the check mark is drawn and the text turns solid |
| `toggle` | Flip switches: pair with data-make="switches" to flip switch i (supports 2/3/5 batch) ON (on=1) or OFF (on=0). Params: i, on=0/1, stagger |

## Transitions (24)

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
| `shatter` | 3D shatter: fractures the frame into 3D shards that tumble and fall away to reveal the next scene. Params: cols, colors=c1/c2, dur, seed |
| `diagonal-split` | Diagonal slash split: a glowing diagonal slash cuts the frame and pulls apart to reveal the next scene. Params: angle, color, dur |
| `blinds` | Venetian blinds: slices the incoming scene into slats that flip open in a wave over the previous scene. Params: n=slats, dir=x/y, dur |
| `crt-off` | Retro CRT switch: collapses the outgoing scene into a bright horizontal scanline before flashing open the next scene. Params: color, dur |
| `portal-spin` | Vortex spin: twists the outgoing scene into the center while untwisting the incoming scene into focus. Params: deg, dur |
| `halftone` | Comic halftone wave: a grid of dots expands diagonally to cover the screen and shrinks away to unveil the next scene. Params: cols, color, dur |
| `cam-to` | World canvas only (default): the camera travels diagonally to the next station, pulling back slightly first, slow-fast-slow. Params: dur (0.6–0.9), arc (extra degrees swung on the way, default 8), pull (pull-back amount, default 0.07) |
| `cam-jump` | World canvas only: the camera jumps straight to the next station (hard cut); only for major chapter changes |
| `mosaic` | Mosaic scene change: paper-coloured blocks cover the frame roughly top to bottom in random order, then uncover the new scene at random; the blocks sit below the actors and persistent overlays, so the presenter is never covered (use for chapter or backdrop changes). Params: cols (blocks per row, default 24), color, dur, seed |
| `card-wipe` | 3D giant poker-card lens wipe (works in both normal scenes and `data-world`): sweeps an oversized double-sided 3D card right across the camera to reveal the next scene. Params: dur (default 0.78), emblem (default A), color |

