<div align="center">

<img src="docs/hero-banner.svg" width="100%" alt="motion-lib — HTML → 影片的宣告式動效庫" />

<br />

[简体中文](README.md) · **繁體中文** · [English](README.en.md) · [日本語](README.ja.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-8453e8?style=flat-square)](LICENSE)
[![Effects](https://img.shields.io/badge/Effects-153-6fd3ff?style=flat-square)](#動效目錄153-種動效--20-種轉場)
[![Transitions](https://img.shields.io/badge/Transitions-20-e4b256?style=flat-square)](#轉場-20)
[![3D & VRM](https://img.shields.io/badge/3D_&_VRM-three.js_+_IK-68e6b2?style=flat-square)](#1-真-3d-二次元口播角色fx-vrmjs)
[![Zero Build](https://img.shields.io/badge/Build-Zero_Bundler-2ea043?style=flat-square)](#快速開始)
[![Sponsor: HRouter](https://img.shields.io/badge/Sponsor-HRouter.net-a8ff57?style=flat-square&labelColor=0b1a13)](https://hrouter.net/)

[快速開始](#-快速開始) · [主題畫廊](#-主題與-3d-範例畫廊) · [AI 批次出片](#-ai-批次產生影片工作流) · [核心寫法](#-核心寫法) · [2D 軟骨骼 & 3D VRM](#-進階視覺與角色模組) · [動效全目錄](#動效目錄153-種動效--20-種轉場)

</div>

---

<!-- HROUTER SPONSOR BANNER -->
<div align="center">
  <a href="https://hrouter.net/" target="_blank" rel="noopener">
    <img src="docs/hrouter-zh.svg" width="100%" alt="HRouter — 一把 API Key 接 Claude / GPT / Gemini / Grok" />
  </a>
</div>

> ⚡ **官方算力合作夥伴 [HRouter](https://hrouter.net/)**：**一把 API Key 直連 Claude / GPT / Gemini / Grok**。無需分別訂閱昂貴月費，餘額即時到帳、消費逐筆可查、用多少付多少。原生相容 **[Claude Code](https://hrouter.net/docs/claude-code/)**、**[Codex](https://hrouter.net/docs/codex/)**、**[Gemini CLI](https://hrouter.net/docs/gemini-cli/)** 與生圖生影片 API —— 讓大模型一句話直接寫出 `data-fx` 分鏡，全自動批次出片！👉 **[官網 hrouter.net](https://hrouter.net/)** · **[模型與即時價格](https://hrouter.net/models/)** · **[快速接入教學](https://hrouter.net/docs/index/)**

---

## 🎬 實機效果預覽

**HTML → 影片的宣告式動效庫。** 在一般 DOM 元素上寫一行 `data-fx="動效名@秒數"`，就能做出知識口播、科技解說、數據榜單、深空粒子與真 3D 二次元角色影片，再用 [HyperFrames](https://hyperframes.heygen.com) 逐格決定性渲染成 1080p / 60fps MP4。

<div align="center">
  <a href="promo/motion-lib-promo.mp4">
    <img src="docs/promo-preview.gif" width="100%" alt="motion-lib 實機宣傳片動效預覽" />
  </a>
  <p>
    <sub>▲ 實機渲染預覽（點擊觀看完整高畫質宣傳片 <a href="promo/motion-lib-promo.mp4"><code>promo/motion-lib-promo.mp4</code></a> · 原始碼 <a href="promo/index.html"><code>promo/index.html</code></a> · 六片合輯 <a href="examples/showreel.mp4"><code>examples/showreel.mp4</code></a>）</sub>
  </p>
</div>

<!-- STATS:START -->
| | 數量 |
|---|---|
| 動效 | **190** 種（入場 26 · 退場 10 · 強調 41 · 文字 9 · 資料 6 · 鏡頭 11 · 角色 25 · 剪紙 10 · 粒子 8 · 3D 12 · 空間 21 · 舞台 7 · 元件 4） |
| 轉場 | **23** 種 |
| 元件產生器 | **31** 個（`bars` `wave` `steps` `chapters` `ring` `wall` `dust` `line` `pixels` `circle-text` `retro-grid` `papercut` `hills` `torn` `switches` `space` `stage3d` `tunnel` `helix` `flipboard` `fan` `slices` `road` `bignum` `segments` `actor` `puppet` `backdrop` `device` `menu` `mini`） |
| 外觀主題 | **6** 套（白紫科技 · 黑金電影 · 像素復古 · 剪紙拼貼 · 深空粒子 · 演播室） |
<!-- STATS:END -->

<details open>
<summary><b>✨ 版本更新亮點（v1.4 全新升級：真 3D VRM 口播角色 + 2D 軟管骨骼 IK + 12 種新特效/轉場）</b></summary>
<br />

- **v1.5 新增（空間鏡頭）**：可選模組 [`fx-world.js`](fx-world.js)——根元素寫一個 `data-world`，所有分鏡就擺到同一塊大畫布上，**換分鏡 = 鏡頭斜著推過去**，不再一頁頁翻。附帶 21 個新動效（原位放大、背景虛化、景深移焦、發牌入場、骨架填充、縱深穿梭、環筒螺旋、三維翻轉、放大讓位、切片換圖、走進畫面……）、7 個新元件、第 6 套皮膚 `theme-studio`，以及頁面自檢 `FX.lint()`（網址加 `?lint`：字太小、鏡頭到位時空屏、文字出畫都能查出來）。
- **v1.4 新增（3D 角色 & 2D 軟骨骼 & 科技轉場）**：
  - **真 3D 二次元角色模組 [`fx-vrm.js`](fx-vrm.js)**：基於 `@pixiv/three-vrm`（MIT），內建解析式雙骨 3D IK 求解器 `FX.ik3d`、跨模型身高/臂展自動重導向、6 節脊柱相位波、鎖骨自動連動、13 套口播姿態、C¹ 五元音口型同步（`aa/ih/ou/ee/oh`）、MToon 賽璐璐描邊、2× 超採樣抗鋸齒與連續 60Hz `SpringBone` 頭髮/裙擺物理；內附兩套 Pixiv 官方 **CC0 公共領域**模型 `assets/shino.vrm` 與 `assets/vita.vrm`。
  - **2D 柔性骨骼與連續軟袖管模組 [`fx-rig.js`](fx-rig.js)**：通用雙骨 IK `FX.ik2` + RubberHose 連續貝茲無接縫軟蒙皮 `FX.hose` + 宣告式 `[data-bone]` / `[data-follow]` / `[data-hose]`，適用於任意自訂 SVG 角色。
  - **12 種新特效與轉場**：新增 6 種轉場（`shatter` `diagonal-split` `blinds` `crt-off` `portal-spin` `halftone`）+ 6 種動效（`circuit` `overload` `scan` `callout` `scatter-out` `toggle`）+ `switches` 開關元件。
- **v1.3 新增**：WebGL 真 3D 場景模組 [`fx-3d.js`](fx-3d.js)（12 個 3D 動效、Bloom 輝光與可程式化攝影機 `cam3d` / `orbit3d`）。
- **v1.2 新增**：Canvas 2D 粒子模組 [`fx-particles.js`](fx-particles.js) + 第 5 套外觀主題 `theme-space`（深空粒子）。
- **v1.1 新增**：40 種動效 + 4 個轉場 + 5 個元件產生器 + 「文字」「剪紙」分類 + `theme-paper`（剪紙拼貼）。

</details>

---

## 💡 為什麼要用它（架構原理）

<div align="center">
  <img src="docs/pipeline.svg" width="100%" alt="motion-lib 決定性渲染流水線" />
</div>

無頭渲染器的運作方式是**「跳到第 N 格 → 截圖」**——原生 CSS `animation`、`setTimeout`、`Math.random()` 不受影格時鐘控制。`motion-lib` 將所有 DOM、Canvas 粒子、WebGL 3D 攝影機與 VRM 骨骼物理統一排進**唯一一條暫停的 GSAP 主時間軸**：

```html
<h1 data-fx="blur-rise-in@0.2">做熱點最難的是什麼？</h1>
<b  data-fx="count@0.6 marker@1.6">7,000</b>
<ul data-fx="each:pop-in@1(stagger=0.1)"> <li>晶片</li><li>算力</li><li>大模型</li> </ul>
```

- 🎯 **任意影格精準可 Seek**：跳到任何一格，畫面與依序播放完全一致，多核心平行渲染零閃爍。
- 🎲 **帶種子可重現隨機**：粒子、亂碼、波形與眨眼一律使用 `FX.rand(seed)`。
- 📦 **100% 離線自包含 & 零建置**：GSAP、three.js、three-vrm、字型與 CC0 模型皆內建於儲存庫中，無需 npm 打包。

---

## 🎨 主題與 3D 範例畫廊

<table>
  <tr>
    <td width="33%" align="center">
      <a href="examples/violet/violet.mp4"><img src="examples/violet/cover.jpg" width="100%" alt="theme-violet" /></a><br />
      <b>白紫科技</b> <code>theme-violet</code><br />
      <sub><a href="examples/violet/violet.mp4">▶ 觀看成片</a> · <a href="examples/violet/index.html">查看原始碼</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/gold/gold.mp4"><img src="examples/gold/cover.jpg" width="100%" alt="theme-gold" /></a><br />
      <b>黑金電影</b> <code>theme-gold</code><br />
      <sub><a href="examples/gold/gold.mp4">▶ 觀看成片</a> · <a href="examples/gold/index.html">查看原始碼</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/pixel/pixel.mp4"><img src="examples/pixel/cover.jpg" width="100%" alt="theme-pixel" /></a><br />
      <b>像素復古</b> <code>theme-pixel</code><br />
      <sub><a href="examples/pixel/pixel.mp4">▶ 觀看成片</a> · <a href="examples/pixel/index.html">查看原始碼</a></sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <a href="examples/paper/paper.mp4"><img src="examples/paper/cover.jpg" width="100%" alt="theme-paper" /></a><br />
      <b>剪紙拼貼</b> <code>theme-paper</code><br />
      <sub><a href="examples/paper/paper.mp4">▶ 觀看成片</a> · <a href="examples/paper/index.html">查看原始碼</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/space/space.mp4"><img src="examples/space/cover.jpg" width="100%" alt="theme-space" /></a><br />
      <b>深空粒子</b> <code>theme-space</code><br />
      <sub><a href="examples/space/space.mp4">▶ 觀看成片</a> · <a href="examples/space/index.html">查看原始碼</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/three/three.mp4"><img src="examples/three/cover.jpg" width="100%" alt="fx-3d.js" /></a><br />
      <b>真 3D 場景</b> <code>fx-3d.js</code><br />
      <sub><a href="examples/three/three.mp4">▶ 觀看成片</a> · <a href="examples/three/index.html">查看原始碼</a></sub>
    </td>
  </tr>
</table>

---

## 🚀 快速開始

**環境需求**：Node.js 18+、FFmpeg、Google Chrome（非預設路徑可設 `REAL_CHROME`）。

```bash
# 1. 建立專案並安裝執行庫至 my-video/lib/
mkdir my-video && ./new-project.sh my-video

# 2. 預覽、抽格檢查與輸出 1080p MP4
cd my-video
open "index.html?play"                       # 空白鍵播放，←/→ 逐格，↑/↓ 跳場景
npx hyperframes snapshot --at 1,3,5
HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" \
  npx hyperframes render -o out.mp4 --experimental-fast-capture=false
```

---

## 🤖 AI 批次產生影片工作流

推薦搭配 **[HRouter (hrouter.net)](https://hrouter.net/)** 一把 API Key 接入 **Claude Code / Codex / Gemini CLI**，按量計費驅動自動化產片：

```bash
export ANTHROPIC_BASE_URL="https://hrouter.net"
export ANTHROPIC_AUTH_TOKEN="sk-你的-HRouter-Key"
claude "參考 motion-lib/README.zh-TW.md 與 fx-vrm.js，把 script.md 改寫成 60fps 口播影片 index.html 並渲染 MP4"
```

---

## 📐 核心寫法

- **場景 `<section class="scene">`**：`data-d="4"`（時長）、`data-t="12.5"`（起始秒）、`data-in="blur-cross(dur=0.5)"`（轉場）、`class="scene overlay"`（常駐疊加層）。
- **動效 `data-fx="[目標:]名稱@時間(參數)"`**：支援 `@1.2` / `@+0.3` / `@-0.4`，目標支援 `each:` / `chars:` / `words:` / `lines:`，參數支援 `dur`、`ease`（`out` `soft` `snap` `sharp` `inout` `in` `spring` `bounce` `elastic` `drop` `linear` `pixel`）、`stagger`、`order`。
- **17 個元件產生器 `data-make`**：`bars`、`line`、`ring`、`wave`、`steps`、`chapters`、`switches`（搭配 `toggle(i=1/2,on=1)`）、`pixels`、`wall`、`dust`、`circle-text`、`retro-grid`、`papercut`、`hills`、`torn`、`space`、`stage3d`。
- **字幕 `FX.subtitles([[起, 迄, '文字與{重點詞}']], { style: 'pill' | 'bar' | 'plain' | 'paper' })`**。

---

## 🌟 進階視覺與角色模組

### 0. 世界畫布與相機（`fx-world.js`，v1.5 新增）

「一個分鏡一頁、輪流顯示」的片子看起來像翻簡報。載入 `fx-world.js` 並在根元素寫上 `data-world` 之後，所有分鏡變成**同一塊大畫布上的機位**：換分鏡時鏡頭斜著推過去（先往後拉一點再推進，0.8 秒），停留時也在緩慢往前推。分鏡原來的寫法完全不用改。

```html
<script src="lib/fx.js"></script>
<script src="lib/fx-world.js"></script>

<div id="root" class="theme-studio" data-composition-id="main" data-width="1920" data-height="1080"
     data-world="snake" data-cols="4" data-wall="MOTION">
  <section class="scene center" data-d="4.6" data-fx="cam-wide@0 cam-home@1.5">…</section>
  <section class="scene" data-d="5.2">
    <div class="abs" style="left:160px;top:260px;width:1600px;height:560px" data-make="fan"
         data-fx="pick@0.8(i=2) pick@2.1(i=3)">
      <img src="a.jpg" width="330" height="450"> <img src="b.jpg" width="330" height="450"> <img src="c.jpg" width="330" height="450">
    </div>
  </section>
</div>
```

| 寫在哪 | 寫法 | 作用 |
|---|---|---|
| 根元素 | `data-world="snake\|row\|depth"` | 機位蛇形排開 / 一字排開 / 沿縱深排開（鏡頭往裡穿） |
| 根元素 | `data-cols` `data-wall` `data-tilt` `data-travel` `data-drift` | 每行幾個機位、背景字牆、機位傾角、換機位用時、停留時的推進速度 |
| 分鏡 | `data-in="cam-jump"` | 這一次硬切（預設是 `cam-to` 運鏡，不用寫） |
| 元素 | `cam-look@t` / `cam-home@t` / `cam-wide@t` | 鏡頭推到某個元素 / 拉回 / 拉遠看整塊畫布 |
| 元素 | `wake` `zoom-here` `push-back` `depth` `rack-focus` `bg-tint` | 先擺後講、原位放大、背景虛化、景深分層、移焦、背景換色 |
| 圖片組 | `deal-in` `skeleton` `drop-gather` · `tunnel`+`fly` · `helix`+`helix-spin` · `flipboard`+`flip-to` · `fan`+`pick` · `slices`+`slice-to` · `road`+`road-walk` | 出場 / 排布 / 切換 / 流程的 9 種做法 |

完整範例：[`examples/world/`](examples/world/index.html)（[▶ 成片](examples/world/world.mp4)）。

**頁面自檢**：瀏覽器開啟 `index.html?lint`（或在主控台呼叫 `FX.lint()`），函式庫會逐個分鏡跳到「鏡頭到位」和「後段」兩個時刻，按真實排版報告：字小於 32px、到位時畫面是空的、文字出畫或互相壓住、被字幕壓住、有沒有真素材。結果同時寫進 `<script id="fx-lint">`，方便命令列工具讀取。

### 0.5 立繪木偶與演員走位（`fx-puppet.js`，v1.6 新增）

每個姿勢只要 3 張圖（閉嘴 / 半張 / 張大），不用分層、不用骨骼，立繪就能**眨眼、呼吸、擺頭、對口型、點頭、傾身**，頭頂還能彈出手繪情緒符號（不用 emoji，各台機器渲染一致）。眨眼是把眼睛區域縱向壓成一條線算出來的，只需要告訴它兩隻眼睛在哪。

演員宣告一次放在常駐層裡；**講到畫面裡的哪個元素，就在那個元素上寫 `call`**，演員會在原地蹲下、從那個元素旁邊重新冒出來——角色跟著內容走，而不是釘在角落。要把整塊畫面讓給內容時寫 `dismiss`。

```html
<script src="lib/fx-puppet.js"></script>

<section class="scene" data-d="7.4" data-fx="pup-talk@0.3(who=bot,dur=6.8)">
  <div class="shot" data-fx="call@0.2(who=bot)"><img src="a.jpg"></div>              <!-- 從這張圖上沿探出來 -->
  <div class="shot" data-fx="call@2.6(who=bot) pup-emote@3(who=bot,kind=idea)"><img src="b.jpg"></div>
</section>
<section class="scene overlay" data-t="0" data-d="19">
  <div data-make="actor" data-name="bot" data-src="assets/bot" data-eyes="238,236,64,76/362,236,64,76" data-neck="300,400" data-home="80,0,460"></div>
</section>
```

`data-src` 是不帶副檔名的路徑（函式庫會讀 `_m0.png` / `_m1.png` / `_m2.png`），`data-eyes` 是兩隻眼睛的「中心 x, 中心 y, 寬, 高」，`data-neck` 是脖子位置，單位都是原圖像素。多姿勢、按配音時間軸編排用腳本介面 `FX.actor()` / `FX.puppet()`（見 `fx-puppet.js` 檔頭）。完整範例：[`examples/puppet/`](examples/puppet/index.html)（[▶ 成片](examples/puppet/puppet.mp4)），範例裡的小機器人是倉庫原創素材（`assets/puppet/`）。

### 0.6 舞台劇：主持人 + 場景 + 畫中畫（`fx-stage.js`，v1.7 新增）

另一種常見的片型：**主持人半身立繪常駐前景，背景是一個個場景，資訊用畫中畫給，隔一會兒切一張全螢幕插畫**。分鏡之間硬切，換場景用馬賽克，主持人每句話換一次姿勢，所以畫面每 2–3 秒必有變化。不寫 `data-world` 時使用。

```html
<script src="lib/fx-puppet.js"></script>
<script src="lib/fx-stage.js"></script>

<div id="root" class="theme-pixel" data-composition-id="main" data-width="1920" data-height="1080" data-mode="stage">
  <section class="scene" data-d="6.4" data-fx="call@0(who=bot) pup-talk@0.3(who=bot,dur=5.4) pup-pose@3(who=bot,pose=point)">
    <div class="abs" style="left:700px;top:230px;width:960px;height:620px" data-make="device" data-kind="laptop"
         data-fx="screen-to@1.6 screen-to@3.0 dive@5.9">
      <img src="a.jpg"><img src="b.jpg"><div data-make="backdrop" data-kind="field"></div>
    </div>
  </section>
  <section class="scene" data-d="7.2" data-fx="pup-pose@1.6(who=bot,pose=think)">
    <div data-make="backdrop" data-kind="field"></div>
    <div class="abs" style="left:1940px;top:508px;width:200px;height:250px" data-make="mini" data-src="lib/assets/puppet/mini" data-fx="mini-walk@0.3(x=-700)"></div>
    <img src="lib/assets/puppet/cut_desk.svg" data-fx="cutaway@3.4(dur=1.9)">
  </section>
  <section class="scene" data-d="7" data-in="mosaic"> … </section>
  <section class="scene overlay" data-t="0" data-d="20.6">
    <div data-make="actor" data-name="bot" data-src="lib/assets/puppet/bot" data-poses="wave/point/think/cheer"
         data-eyes="238,236,64,76/362,236,64,76" data-neck="300,400" data-home="-10,0,640"></div>
  </section>
</div>
```

| 零件 | 寫法 | 作用 |
|---|---|---|
| 場景背景 | `data-make="backdrop"` | `data-src` 用圖片；不寫就按 `data-kind="field\|room\|city\|night"` 程式畫一張像素場景，不需要素材 |
| 換場 | `data-in="mosaic"` | 紙色方塊蓋滿再揭開，主持人不會被蓋住 |
| 設備螢幕 | `data-make="device"` + `screen-to` / `dive` | 筆電 / 手機 / 視窗裡放內容；螢幕內硬切；鑽進螢幕鋪滿全螢幕 |
| 序列幀 | `frames@0(fps=20)` | 把一串截圖當影片播（實機錄屏） |
| 插畫特寫 | `cutaway@t(dur=1.8)` | 全螢幕插畫硬切進來、慢推、硬切回去 |
| 選擇面板 | `data-make="menu"` + `choose` | 高亮條跳到某一項並打勾 |
| 小演員 | `data-make="mini"` + `mini-walk` / `mini-pose` | 全身小人兩幀步態走過去、換動作 |
| 主持人換姿勢 | `pup-pose@t(who=bot,pose=point)` | 硬切，換的瞬間自動眨眼 |

完整範例：[`examples/stage/`](examples/stage/index.html)（[▶ 成片](examples/stage/stage.mp4)）。範例裡的小機器人（4 個半身姿勢、全身小人、一張插畫）是倉庫原創素材，原始檔在 `assets/puppet/src/`。

### 1. 真 3D 二次元口播角色（`fx-vrm.js`）

<div align="center">
  <img src="docs/vrm-preview.gif" width="88%" alt="fx-vrm.js 真 3D VRM 角色與 circuit / switches 實機渲染展示" />
</div>

```html
<script src="lib/vendor/gsap.min.js"></script>
<script src="lib/vendor/three-fx.min.js"></script>
<script src="lib/vendor/three-vrm.min.js"></script>
<script src="lib/fx.js"></script>
<script src="lib/fx-3d.js"></script>
<script src="lib/fx-vrm.js"></script>

<section class="scene overlay" data-t="0" data-d="30">
  <div class="abs" style="left:20px;bottom:0;width:580px;height:900px;pointer-events:none"
       data-make="stage3d" data-alpha="1" data-light="anime"
       data-fov="26" data-cam="0,1.34,2.85" data-look="0,1.30,0"
       data-fx="vrm3d@0(src=shino,headscale=1.18,ry=12)
                vrm-pose@0(pose=wave,expr=happy,dur=0.45)
                vrm-pose@4.0(pose=explain,expr=relaxed,look=right,emote=sparkle)
                vrm-talk@0.3(dur=12.0,rate=7.5)"></div>
</section>
```

### 2. 2D 柔性骨骼（`fx-rig.js`）、真 3D 場景（`fx-3d.js`）與 2D 粒子（`fx-particles.js`）

- **`fx-rig.js`**：提供雙骨 IK `FX.ik2` 與連續貝茲軟管袖 `FX.hose`，搭配 `rig-idle`、`rig-pose`、`rig-talk`、`rig-nod`、`rig-wave`。
- **`fx-3d.js`**：支援 `data-alpha="1"`（透明背景 + 自動 2× 超採樣）、`data-light="anime"`、`data-bloom`、純函數攝影機 `cam3d` / `orbit3d`。
- **`fx-particles.js`**：在 `data-make="space"` 畫布上疊加 `nebula`、`starfield`、`vortex`、`blackhole`、`form-text` 等粒子層。

---

## 📜 開源授權與致謝

- **核心程式碼（`fx*.js`、`fx.css`）**：[MIT License](LICENSE)，第三方聲明見 [NOTICE](NOTICE)。
- **3D 與 VRM 執行期**：[three.js](https://github.com/mrdoob/three.js)（MIT）與 [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)（MIT）。
- **內建 3D 範例模型（`assets/shino.vrm`、`assets/vita.vrm`）**：由 pixiv Inc. 以 **CC0 1.0 公共領域貢獻**釋出（見 [assets/README.md](assets/README.md)）。
- **感謝算力夥伴 [HRouter (hrouter.net)](https://hrouter.net/)** 提供 Claude / GPT / Gemini / Grok 一站式 AI 程式開發與自動化影片生成支援。

---

<!-- CATALOG:START -->
## 動效目錄（190 種動效 + 23 種轉場）

> 本節由 `node gen-readme.mjs` 從 `fx.js` 自動產生，請勿手動修改。
> 所有動效都支援通用參數 `dur`（時長）、`ease`（緩動）、`stagger`（錯峰）；下表只列出各自特有的參數。

### 入場 (26)

元素出現的方式。預設會從「入場前」的狀態回到元素原本的樣子，所以元素自己寫的 CSS 位置、旋轉都會保留。

| 名稱 | 作用 / 參數 |
|---|---|
| `fade-in` | 純淡入，最為克制；用於字幕、次要說明 |
| `rise-in` | 從下方上滑 + 淡入，最通用的入場。參數 dist=位移像素 |
| `drop-in` | 從上方落下 + 淡入，用於標籤、角標 |
| `slide-in` | 從一側滑入。參數 dir=left/right/up/down（朝哪個方向運動）、dist |
| `blur-in` | 由模糊到清晰，原地顯現；用於大標題、截圖卡片 |
| `blur-rise-in` | 模糊 + 上滑 + 淡入，電影感標題的標準入場 |
| `scale-in` | 從略小放大到定位，卡片 / 圖片的標準入場。參數 from=起始縮放 |
| `pop-in` | 彈出：從小放大並過衝回彈，用於標註膠囊、圖示、勾叉 |
| `zoom-settle` | 從放大的模糊狀態收回到定位（鏡頭「對上焦」的感覺），用於開場大字 |
| `wipe-in` | 遮罩擦除顯現。參數 dir=right/left/up/down（擦除推進方向） |
| `mask-rise` | 文字從一條看不見的基線下方升上來（遮罩上滑），標題感最強 |
| `flip-in` | 沿水平軸翻轉立起（3D），用於卡片翻牌、問號卡揭曉 |
| `tilt-in` | 帶透視的傾斜飛入（3D 卡片從側面轉正），用於介面截圖 |
| `stamp-in` | 蓋章：從很大砸下來，落定時抖一下；用於結論、印章、勾叉 |
| `drop-bounce` | 從畫面上方掉下來，落地彈兩下；用於物件堆疊、像素方塊 |
| `swing-in` | 像掛牌一樣從上緣甩下來擺正 |
| `focus-in` | 字距從很寬收攏 + 模糊變清晰，英文小標題 / 副標題常用 |
| `grow-x` | 沿橫向從 0 長出來（長條圖、分隔線、進度條）。參數 origin=left/center/right |
| `grow-y` | 沿縱向從 0 長出來（柱狀圖）。參數 origin=bottom/top |
| `fan-in` | 一疊卡片從中心攤開到各自的位置（搭配 each: 使用），卡片最終位置和角度依 CSS 所寫 |
| `type` | 打字機：逐字敲出。參數 cps=每秒字數、caret=1 顯示游標 |
| `draw` | 描線：SVG 線條沿路徑畫出來（連線、箭頭、圈註、折線圖） |
| `pixel-in` | 像素風入場：分 4~5 檔跳著出現（不是平滑的），搭配 each: 可做方塊拼字 |
| `scramble` | 亂碼解碼：每個字先閃隨機字元（灰），從左到右逐個鎖定成正確的字（白）。參數 dur、chars=亂碼字元池 |
| `light-speed-in` | 光速入場：帶著斜切從一側高速衝進來，衝過頭再回正（animate.css lightSpeedIn）。參數 dir=left/right（往哪邊運動）、dist |
| `jack-in` | 彈簧盒：從底部一點一點彈出來，左右晃兩下站穩（animate.css jackInTheBox） |

### 退場 (10)

元素離開的方式。通常寫成 `@-0.4`（場景結束前 0.4 秒）。

| 名稱 | 作用 / 參數 |
|---|---|
| `fade-out` | 淡出 |
| `rise-out` | 向上滑走 + 淡出 |
| `drop-out` | 向下滑走 + 淡出 |
| `blur-out` | 變模糊 + 淡出（退到背景裡去） |
| `scale-out` | 縮小 + 淡出。參數 to=結束縮放（>1 則是放大著消失） |
| `slide-out` | 向一側滑出。參數 dir |
| `wipe-out` | 遮罩擦除消失 |
| `hinge` | 鉸鏈掉落：左上角像釘了一根釘子，晃兩下後掉出畫面（animate.css hinge）。參數 dist |
| `fall-out` | 文字掉落：每個字帶著旋轉往下掉出畫面（FallingText），一般搭配 chars: 使用。參數 dist、seed |
| `scatter-out` | 四散彈飛：元素向四周帶著旋轉與拋物線重力炸飛清場（適合一鍵清理、破除誤區）。參數 power=力道、dur、seed |

### 強調 (41)

元素已經在畫面上，唸到它時做一下強調；也包括移動、變色、內容切換。

| 名稱 | 作用 / 參數 |
|---|---|
| `pulse` | 放大一下再回去（唸到這個詞的時候敲一下）。參數 to=峰值縮放 |
| `shake` | 左右抖動（否定、報錯、警告） |
| `nod` | 上下輕跳一下（角色點頭、圖示彈跳） |
| `blink` | 閃爍幾下（游標、警示）。參數 n=次數 |
| `color` | 文字 / 背景變色。參數 to=顏色、bg=背景色 |
| `marker` | 螢光筆：一道色塊從左到右刷過文字底部。參數 color、h=色塊高度% |
| `underline` | 底線從左長到右。參數 color、w=粗細像素 |
| `strike` | 刪除線劃過（舊方案作廢） |
| `box` | 醒目框：沿元素外緣畫出一圈描邊（在截圖上圈出重點）。參數 color、pad、w、r |
| `glow` | 發光呼吸：光暈亮起再回落。參數 color、n=次數 |
| `sheen` | 掃光：一道高光斜著掃過卡片 / 按鈕 |
| `ping` | 漣漪：從元素中心擴散出一圈（點擊回饋、提示位置） |
| `dim` | 壓暗（退到次要地位）。參數 to=不透明度 |
| `undim` | 恢復亮度 |
| `spot` | 聚光：搭配 each: 使用，第 i 個子元素保持明亮並略微放大，其餘壓暗。參數 i（從 1 數起） |
| `float` | 持續上下漂浮（待機感）。參數 amp=幅度、period=一個來回的秒數、dur=持續多久 |
| `spin` | 旋轉。參數 deg=總角度、dur |
| `move` | 把元素移動到另一個元素的位置（游標移向按鈕、標籤飛入卡片）。參數 to=#目標 或 x、y |
| `click` | 點擊：按下縮一下 + 漣漪（搭配 .fx-cursor 游標元件） |
| `swap` | 原地切換內容：自己淡出，目標元素淡入。參數 to=#目標 |
| `squash` | 卡片擠壓-彈開：橫向先壓窄再彈回（約 3 格壓 + 4 格彈），常和換內容一起用。參數 to=最窄比例 |
| `cycle` | 子元素輪播硬切：一次只顯示一個，每 every 秒換下一個（縮圖裡畫面一直在換）。參數 every、loop=1 循環、stop=停在第幾張 |
| `text` | 文字硬切成新內容（時鐘跳變、標籤換字）。參數 v=新文字 |
| `to` | 萬能補間：直接寫 GSAP 屬性。例 to@2(x=120,scale=1.2,opacity=0.5,dur=0.6,ease=inout) |
| `tada` | 歡呼：先縮一下，再放大著左右搖擺（animate.css tada） |
| `jello` | 果凍：斜切著來回晃，幅度越來越小（animate.css jello） |
| `rubber-band` | 橡皮筋：橫向拉長、縱向壓扁，來回彈幾下（animate.css rubberBand） |
| `heartbeat` | 心跳：連續兩下放大（animate.css heartBeat） |
| `head-shake` | 搖頭：帶一點 3D 轉動的左右搖（否定、不對）（animate.css headShake） |
| `wobble` | 搖晃：邊平移邊歪著來回晃（animate.css wobble） |
| `border-beam` | 邊框流光：一小段光沿著元素邊框繞圈跑（BorderBeam / StarBorder）。參數 color、w=粗細、len=光帶佔周長比例、n=繞幾圈、dur=每圈秒數、keep=1 跑完不消失 |
| `spotlight` | 聚光燈：畫面壓暗，只留一個圓形亮區罩住目標；同一場景裡再呼叫一次，光圈會移到新目標（Spotlight）。寫在要照的元素上，或 to=#id。參數 r=半徑、dim=暗度 0~1、off=1 關燈 |
| `confetti` | 撒彩紙：從元素中心炸開一把彩紙，拋起再落下（Confetti / ClickSpark）。參數 n、colors=色1/色2/色3、power=力道、seed |
| `sparkle` | 閃爍星點：元素四周隨機冒出小星星，一閃一閃（SparklesText）。參數 n、color、dur、seed |
| `orbit` | 環繞：把容器的子元素均勻擺在一個圓上，繞中心轉，子元素始終保持正立（OrbitingCircles）。寫在容器上。參數 r=半徑、turns=圈數、dur、reverse=1 反轉 |
| `beam` | 連接光束：在兩個元素之間畫一條弧線，一團光沿線流過去（AnimatedBeam，適合畫「A 把資料傳給 B」）。寫在起點元素上，to=#終點。參數 curve=彎曲度、color、n=流幾次、dur |
| `flip-swap` | 翻面換內容：元素繞垂直軸翻過去，背面換成第二個子元素再翻回來（翻牌、揭曉答案）。元素裡放兩個子元素：第一個是正面，第二個是背面。參數 axis=y/x |
| `circuit` | 直角電路連接：在兩個元素之間畫橫平豎直的折線電路並傳輸發光脈衝包（適合架構圖、協定資料流）。寫在起點上，to=#終點。參數 mid=折彎比例、packets=脈衝數、color、dur |
| `overload` | 過載紅溫警報：元素高頻急促抖動 + 紅光閃爍（適合上下文爆滿、算力過載、報錯）。參數 amp=幅度、color、dur、seed |
| `scan` | 雷射掃描線：一道發光掃描帶掃過視窗或卡片（適合程式碼讀取、文件檢索、圖表診斷）。參數 dir=down/right、color、n=次數、dur |
| `callout` | 折線引線批註：從元素邊緣拉出折線引線並彈出文字標籤（適合圖表峰值、重點數據旁註）。參數 text=文字、dx、dy、color |

### 文字 (9)

專門給文字用的：流光、故障、換詞、刪掉重打、翻牌、描邊、殘影。

| 名稱 | 作用 / 參數 |
|---|---|
| `shimmer` | 流光字：一道高光從左到右掃過文字（ShinyText）。參數 color=高光色、n=掃幾次、gap=兩次間隔 |
| `glitch` | 故障字：紅藍錯位 + 抖動 + 斜切，閃一小段後恢復（GlitchText）。參數 amp=錯位像素、dur、seed。注意會把元素 x 歸零，元素本身要移動時請外加一層外殼 |
| `rotate-words` | 詞語輪換：同一位置的詞向上翻走，下一個詞翻上來（WordRotate）。參數 words=乙/丙/丁（用 / 分隔，元素原文是第一個）、every=每個詞停留秒數 |
| `morph` | 模糊變形換詞：舊詞變虛散開，新詞從模糊中聚攏（MorphingText）。參數 words=乙/丙、every |
| `retype` | 刪掉重打：把現有文字從後往前一個個刪掉，再敲出新文字（TextType）。參數 v=新文字、cps=每秒打幾個字、del=每秒刪幾個字 |
| `true-focus` | 逐詞聚焦：一次只讓一個詞清晰，其餘變虛，取景框跳到這個詞上（TrueFocus）。中文用 / 分詞（如 AI/不會/取代/你），英文按空格。參數 every、blur、color |
| `split-flap` | 翻牌機：每個字先快速翻過一串隨機字元，再從左到右依序停在正確的字上（SplitFlap，機場航班看板）。入場用。參數 dur、stagger、chars=字元池 |
| `stroke-in` | 描邊字：先沿一個方向畫出空心描邊，再把顏色灌滿（StrokeText）。參數 w=描邊粗細、color=描邊色、hold=空心停留秒數 |
| `echo` | 殘影入場：幾層半透明的拷貝拖在後面一起滑入，到位後殘影散掉（EchoText）。參數 n=殘影層數、dist、dir |

### 資料 (6)

數字、進度、圖表類。數字類動效會自動保留小數位數與千分位。

| 名稱 | 作用 / 參數 |
|---|---|
| `count` | 數字滾動。元素裡寫最終數字，或用 to= 指定；from= 起始值。自動保留小數位數與千分位 |
| `roll` | 數字逐位垂直翻滾：每一位是一條 0~9 的垂直帶，帶模糊滾動後從左到右依次停靠（黑金款的 $7,000）。參數 dur、stagger、spins=多轉幾圈 |
| `clock` | 時鐘撥動：from=23:28 撥到 to=01:23（會自動跨日） |
| `fill` | 進度條填充：把元素寬度（或 dir=y 時的高度）從 from% 補到 to% |
| `ring` | 圓環進度：搭配 data-make="ring"。參數 from、to（0~1） |
| `wave-live` | 波形跳動：搭配 data-make="wave"，每根長條依種子隨機起伏。參數 dur、seed |

### 鏡頭 (11)

作用在整個容器上：推近、平移、3D 傾斜、震動。

| 名稱 | 作用 / 參數 |
|---|---|
| `push` | 緩慢推近（Ken Burns）：整個容器在一段時間內等速放大一點點。參數 from、to、dur |
| `pan` | 緩慢平移。參數 x、y（總位移像素）、dur |
| `zoom-to` | 推到局部：把容器放大並平移，讓目標區域佔滿畫面。參數 to=#目標 或 x,y,w,h（容器內像素）、fill=佔畫面比例 |
| `zoom-reset` | 從局部拉回全景 |
| `tilt` | 3D 傾斜擺放並緩慢轉動（懸浮的介面卡片）。參數 rx、ry 起始角度，rx2、ry2 結束角度 |
| `drift` | 背景緩慢漂移（模糊卡片牆、粒子層）。參數 x、y、rot、dur |
| `cam-shake` | 鏡頭震動（重擊、報錯） |
| `meteors` | 流星雨：一根根斜著劃過的光線（Meteors），寫在鋪滿的背景層上。參數 n、angle=方向角度（預設 135 = 往左下）、color、dur、seed |
| `marquee` | 跑馬燈：一排內容無限循環地橫向捲動（Marquee / LogoLoop）。寫在單行的容器上，子元素會自動複製補滿。參數 speed=每秒像素、reverse=1 反向 |
| `bg-scroll` | 背景圖案捲動：讓 background（網格、紋理、條紋）依速度持續平移，搭配 retro-grid 元件使用。參數 x、y=每秒像素 |
| `parallax` | 視差：容器裡的各層依前後順序以不同速度平移（後面的層動得少、前面的層動得多），搭配 hills 層疊紙山使用。寫在容器上。參數 x、y=最前層的總位移、dur |

### 角色 (25)

給立繪 / 小人使用：換姿勢、口型、點頭、跳、走。

| 名稱 | 作用 / 參數 |
|---|---|
| `pose` | 立繪換姿勢：.host 裡放多張 [data-pose] 圖，硬切到 name 指定的那張（口播影片的立繪通常就是硬切）；bounce=1 加擠壓回彈 |
| `lipsync` | 口型：在容器裡多張 [data-mouth] 圖之間每 frames 格硬切一次（通常 2~4 格），說完回到第一張。參數 dur、frames、seed |
| `talk` | 說話時的小幅上下點動。參數 dur=說多久、rate=每秒幾下 |
| `hop` | 原地跳一下（驚訝、高興）。參數 h=高度、n=次數 |
| `walk` | 走過去：水平移動 + 一步一顛。參數 x=位移 或 to=#目標、steps=步數；像素角色加 ease=steps(8) |
| `rig-idle` | 柔性待機呼吸：驅動任意綁定角色的自然胸腔呼吸、髮絲微擺與依種子隨機眨眼。參數 dur、seed |
| `rig-pose` | 柔性切換姿態：依預設名或手部 IK 座標(lx,ly,rx,ry)平滑過渡，連續貝茲袖管自動彎曲無接縫。參數 pose、lx/ly/rx/ry、look、face、emote、dur |
| `rig-talk` | 多口型語音同步：依種子在多套 [data-viseme] 口型間自然切換並附帶微點頭，說完自動回到目前表情嘴。參數 dur、frames、nod=1、seed |
| `rig-nod` | 柔性點頭/搖頭：驅動頸部樞軸並自動觸發髮絲呆毛次級彈簧擺動。參數 shake=1（搖頭）、n、amp、dur |
| `rig-wave` | 柔性揮手：在指定軟肢體(arm=R/L)的手部 IK 目標上疊加圓弧往復揮動，整條袖管自然連動。參數 arm=R/L、n、amp、dur |
| `vrm3d` | 載入真 3D 二次元 VRM 角色（MToon 賽璐璐著色 + 54 骨骼 + 五元音口型 + 決定性頭髮物理），寫在 stage3d 上。參數 src=模型路徑、ry=朝向角度、x/y/z、s=縮放、breathe/blink/sway/spring |
| `vrm-pose` | 切換 3D VRM 角色姿態、臉部表情與視線：pose=idle/wave/explain/point/point-up/think/shock/clasp/reject/shrug/proud/cheer/bow，expr=neutral/happy/relaxed/angry/sad/surprised，look=cam/right/left/up/down，ry=轉身角度 |
| `vrm-talk` | 驅動 3D VRM 角色五元音口型（aa/ih/ou/ee/oh）與說話頭部微節奏：dur=說話秒數、rate=音節速率、amp=張嘴幅度、seed |
| `vrm-nod` | 為 3D VRM 角色疊加點頭、搖頭或歪頭動作：kind=nod/shake/tilt、n=次數、amp=幅度、dur |
| `vrm-move` | 移動 3D VRM 角色位置（如從畫面底部彈出登場或橫向讓位）：x/y/z、fromY=起始高度、dur、ease |
| `vrm-anim` | 播放標準 .vrma (VRM Animation) 3D 動作捕捉片段，仍維持逐幀時間軸可跳轉：src=檔案路徑、dur |
| `call` | 把演員叫到這個元素旁邊（講到它時用）：演員在原地蹲下，從這個元素旁邊重新冒出來。寫在被講的元素上；寫在 `<section>` 上是回到演員自己的 home。參數 who（演員名）、at=top/left/right/below（預設 top：從元素上沿探出來）、size（預設 top 340 / 其他 420）、align（at=top 時靠左還是靠右，0–1）、dx、dy、flip=1（水平翻轉，讓他面向內容）、pose（同時換姿勢） |
| `closeup` | 臉部特寫（反應鏡頭）：硬切到這個演員的大臉，背景換成放射線底色，停一下再硬切回去。用現有的半身立繪就能做，不需要新素材。寫在 `<section>` 的 `data-fx` 裡。參數 who（演員名）、dur（停多久，預設 1.1）、pose（特寫時的姿勢 / 表情）、kind（同時彈出的情緒符號）、color（底色，預設橙色；可寫 red / blue / green / purple）、size（放大到多大，預設 1300） |
| `dismiss` | 讓演員蹲下離開畫面（要把整塊畫面讓給內容時用）。參數 who |
| `pup-talk` | 立繪說話：按口型序列換嘴，頭跟著音量輕輕擺動。寫在 `data-make="puppet"` 上，或用 `who=演員名` 指定演員。參數 dur（說多久，預設到分鏡結束）；口型序列取 `FX.mouthTrack = { fps, frames }`（由配音工具產生），沒有就按音節節奏自動產生 |
| `pup-pose` | 立繪換姿勢（硬切，換的瞬間自動眨眼並輕輕彈一下）。寫在 `data-make="puppet"` 上，或用 `who=演員名` 指定演員。參數 pose（姿勢名）、pop=0（不要彈） |
| `pup-nod` | 立繪點一下頭（聽的人應和、說的人強調）。寫在 `data-make="puppet"` 上，或用 `who=演員名` 指定。參數 amp（幅度，預設 1） |
| `pup-lean` | 立繪整個人朝一側傾斜（聽對方說話時朝對方傾）。寫在 `data-make="puppet"` 上，或用 `who=演員名` 指定。參數 deg（度數，正數向右，0 = 回正）、dur |
| `pup-emote` | 立繪頭頂彈出手繪情緒符號。寫在 `data-make="puppet"` 上，或用 `who=演員名` 指定。參數 kind=question/exclaim/sweat/anger/sparkle/idea/heart/zap/dots、hold（停留秒數，預設 1.6） |
| `pup-idle` | 只讓立繪活著（眨眼、呼吸、頭部慢晃），不說話。寫在 `data-make="puppet"` 上；用了 pup-talk / pup-nod / pup-lean / pup-emote 中任何一個就不需要再寫它 |

### 剪紙 (10)

剪紙 / 紙藝拼貼風：展開、剪開、撕開、貼上、逐層升起，以及每秒 12 格的定格手作感。和 `theme-paper` 外觀主題最搭，但任何外觀主題都能用。

| 名稱 | 作用 / 參數 |
|---|---|
| `paper-unfold` | 紙張展開：像對摺的紙從摺痕處翻開攤平，帶一點回彈。參數 dir=down/up/left/right（往哪邊展開） |
| `cut-in` | 剪刀剪開：沿一條鋸齒邊一刀一刀地把元素「剪」出來，逐格推進有剪紙感。參數 dir=right/left/down/up、teeth=鋸齒數、jag=鋸齒深度（%）、snips=剪幾刀 |
| `peel-in` | 捲角揭開：像貼紙從一個角翹起的狀態落回原位按平。參數 corner=tl/tr/bl/br（從哪個角） |
| `layer-rise` | 逐層升起：容器裡的紙層從後往前依序從下方升起，越靠前升得越晚、越遠（層疊紙山、紙片舞台）。寫在容器上。參數 dist、stagger |
| `stick-on` | 貼紙拍上：從鏡頭前方帶著大投影拍到紙面上，落定時投影收緊（貼標籤、貼照片）。參數 from=起始縮放、rot=起始歪斜角度 |
| `stop-in` | 定格入場：以每秒 12 格的定格動畫節奏跳進來，每一格帶一點隨機歪斜（手工動畫感）。參數 dist、steps=跳幾格、fps、seed |
| `jitter` | 定格抖動：以每秒 12 格不停地微微歪動、挪動，像手工逐格拍出來的（boiling）。建議加在外層容器上，免得和入場動效搶位置。參數 amp=角度、px=位移、fps、dur |
| `lift` | 紙片抬起：往上浮起一點、投影變大變淡，像被手指捏起來；down=1 放回去。參數 dist |
| `flutter` | 飄動：像紙片被風吹了一下，左右擺幾下慢慢停住。參數 deg、n=擺幾下、origin |
| `sway` | 懸掛搖擺：掛著的東西（燈籠、吊牌、窗花）持續緩慢地左右擺。參數 deg、period=一個來回秒數、dur |

### 粒子 (8)

畫布（Canvas 2D）粒子，需要額外載入 `fx-particles.js`。寫在 `data-make="space"` 的畫布容器上，每個動效是畫布裡的一層，依書寫順序由下往上疊。通用參數：`dur`（這一層持續多久）、`fade` / `out`（淡入淡出秒數）、`x` / `y`（中心位置百分比）、`seed`。

| 名稱 | 作用 / 參數 |
|---|---|
| `starfield` | 星空：星星從遠處朝鏡頭飛來（speed=0 時是靜止閃爍的星空）。參數 n、speed、streak=拖尾長度（給 1 以上就是躍遷光束）、size、colors=色1/色2 |
| `nebula` | 星雲：幾大團柔和的彩色光霧緩慢漂移，墊在最底層當背景。參數 n=光團數、colors、alpha=濃度 |
| `vortex` | 粒子漩渦：粒子沿螺旋臂從中心湧向鏡頭，帶發光的流線（時空隧道）。參數 arms=旋臂數、n、speed、twist=扭幾圈、spin=整體旋轉速度、r=外圈半徑、colors（依旋臂交替）、lines=0 關掉流線 |
| `blackhole` | 黑洞：黑色圓盤 + 發光光環 + 傾斜的吸積盤，粒子內圈轉得快、外圈轉得慢，前半圈會從黑洞前面掠過。參數 r=黑洞半徑、tilt=吸積盤壓扁程度、rot=傾斜角度、n、speed、c1=內圈色、c2=外圈色 |
| `orb` | 能量球：由三角碎片拼成的發光球體，緩慢自轉、內核發光；可以從散落的碎片聚攏成球，也可以炸開。參數 r=半徑、detail=細分（1=80 片，2=320 片）、gap=碎片間隙、spin、in=聚攏秒數、explode=第幾秒炸開、c1=亮面色、c2=暗面色、edge=描邊色、core=內核色 |
| `burst` | 爆炸：一團粒子和三角碎片從中心炸開，帶白閃和衝擊波光環，越飛越慢最後消散。參數 n、power=力道、shards=碎片占比 0~1、life=持續秒數、colors、ring=0 關掉衝擊波、flash=0 關掉白閃 |
| `form-text` | 粒子聚字：散落翻滾的小方塊從四面八方飛來，拼成一行字（中英文都行）。參數 text=文字、size=字級、font、weight、color、n=最多多少粒、start=先飄多久、conv=聚攏秒數、glow=0 關掉字的光暈、spacing=字距像素 |
| `stream` | 粒子流：一條條帶拖尾的光點沿著起伏的流線橫向穿過畫面（資料流、訊號）。參數 n、speed、amp=起伏幅度、waves=橫向有幾個波、tail=拖尾長度、colors、reverse=1 反向 |

### 3D (12)

真 3D 場景（three.js），需要額外載入 `vendor/three-fx.min.js` 和 `fx-3d.js`。寫在 `data-make="stage3d"` 的舞台上：一類動效往舞台裡放東西，一類移動攝影機（`cam3d`、`orbit3d`）。物件的通用參數：`dur`（存在多久）、`fade` / `out`（淡入淡出秒數）、`px` / `py` / `pz`（擺放位置）、`s`（整體縮放）、`seed`。

| 名稱 | 作用 / 參數 |
|---|---|
| `stars3d` | 3D 星空：一大團星星散布在空間裡，鏡頭移動時有遠近層次。參數 n、r=分布半徑、size、colors |
| `galaxy3d` | 漩渦星系：幾萬個粒子排成旋臂繞中心轉，內圈快外圈慢。參數 n、arms=旋臂數、r=半徑、inner=中心留空半徑、spin=轉速、twist=旋臂彎曲程度、colors（依旋臂交替）、size、bright |
| `orb3d` | 立體能量球：帶真實光照的金屬三角碎片拼成的球，內核發光；可以從散落的碎片聚攏成球，也可以炸開。參數 r=半徑、detail=細分（1=80 片，2=320 片）、gap=碎片間隙、spin、in=聚攏秒數、explode=第幾秒炸開、power=炸開力道、color=碎片色、emissive=自發光色、core=內核色 |
| `tunnel3d` | 粒子隧道：粒子和光環排成一條隧道朝鏡頭湧來（把攝影機放在隧道裡朝裡看）。參數 n、r=隧道半徑、len=長度、speed、twist=螺旋程度、rings=光環數（0 不要）、colors |
| `waves3d` | 波浪點陣：一大片點組成的地面像水面一樣起伏。參數 nx / nz=點數、w / d=寬和深、amp=浪高、freq=浪的密度、speed、c1=低處色、c2=高處色 |
| `globe3d` | 點陣球：由點組成的球體緩慢自轉，表面有光弧在兩點之間飛過（全球網路、資料連線）。參數 r=半徑、n=點數、arcs=光弧數、spin、color=點的顏色、arc=光弧顏色 |
| `blackhole3d` | 立體黑洞：黑色球體 + 始終朝向鏡頭的光環 + 粒子吸積盤，鏡頭可以繞著它轉。參數 r=黑洞半徑、n、disk=吸積盤外半徑（r 的倍數）、speed、c1=內圈色、c2=外圈色 |
| `burst3d` | 立體爆炸：幾萬個粒子從中心朝四面八方炸開，越飛越慢，帶一次強閃光。參數 n、power=力道、life=持續秒數、colors |
| `text3d` | 立體粒子字：空間裡的粒子從四面八方聚成一行有厚度的字，鏡頭可以繞著看（中英文都行）。參數 text、w=字在場景裡的寬度、depth=厚度層數、start=先飄多久、conv=聚攏秒數、color、n=最多多少粒、font、weight、scatter=散開半徑 |
| `city3d` | 城市：一條大街兩旁的樓群，窗戶發光、樓體有描邊、路上有車燈流動，盡頭可以放一輪落日。搭配 cam3d 讓鏡頭沿街飛行。街道沿 -z 方向延伸。參數 rows=縱深幾排、cols=每側幾列、road=路寬、lit=亮窗比例、colors=窗戶顏色、wall=牆面色、edge=描邊色（edge=0 不描邊）、sun=落日顏色（sun=0 不要）、traffic=0 關掉車流 |
| `cam3d` | 移動攝影機：從目前位置飛到新位置，同時把視線轉向新目標。參數 x / y / z=飛到哪、lx / ly / lz=看向哪、fov=視角、dur、ease（dur=0 就是直接切過去）。沒寫的參數維持不變 |
| `orbit3d` | 環繞鏡頭：攝影機繞著目標轉圈，可以同時拉近 / 升高。參數 turn=轉多少度（負數反向）、from=起始角度（不寫就從目前位置開始）、r=結束時離目標多遠、h=結束時的高度、lx / ly / lz=繞著哪裡轉、dur、ease |

### 空間 (21)

世界畫布、相機與圖片組動效，需要額外載入 `fx-world.js`。在根元素寫上 `data-world`，所有分鏡就變成同一塊大畫布上的機位，換分鏡 = 鏡頭走過去。鏡頭類動效需要 `data-world`；焦點類和圖片組類在任何頁面都能用。

| 名稱 | 作用 / 參數 |
|---|---|
| `cam-look` | 鏡頭推到機位裡的某個元素上（念到它時用），講完用 `cam-home` 拉回。參數 to（選擇器，不寫就是自己）、fit（推到它佔畫面多大，預設 0.6）、max（最多放大幾倍，預設 1.4）、dur |
| `cam-home` | 鏡頭回到本機位的全景（`cam-look` 之後用）。參數 dur |
| `cam-wide` | 鏡頭拉遠看到整塊畫布（開場總覽、結尾回顧）。寫成 `cam-wide@0` 時全片從總覽開始，再用 `cam-home` 推進去。參數 dur |
| `wake` | 先擺後講：元素從一開始就在畫面裡但是暗的，念到它時點亮。參數 dim（沒點亮時的亮度，預設 0.3）、solid=1（不用半透明而是壓暗去色，卡片不會透出背景；舞台劇模式下自動開啟） |
| `zoom-here` | 原位放大：從一組內容裡挑出重點，在原來的位置直接放大，其餘淡到 30% 往後退。參數 s（倍數，預設 2.4）、hold（幾秒後自動收回，不寫就不收）、dim |
| `push-back` | 背景虛化：新內容出現時，把原來那層整體往後推（縮到 94%、變虛 4px、變暗到 55%）。參數 s、blur、dim、dur |
| `bring-front` | 把 `push-back` 推到後面的那層拉回來 |
| `depth` | 景深分層：子元素寫 `data-depth="near/mid/far"`，離焦點越遠越虛（0 / 4 / 8px），並按層做視差漂移。參數 focus（焦點在哪層，預設 mid）、shift（視差幅度，預設 40）、blur |
| `rack-focus` | 移焦：把清晰的那一層換成另一層（搭配 `depth` 用）。參數 to=near/mid/far、dur |
| `bg-tint` | 背景換色：換圖時把背景整塊換成這張圖的主色，觀眾一眼知道換了。參數 color（寫 `reset` 換回原色）、dur（預設 0.5）、to（要換色的元素，預設整塊畫布） |
| `skeleton` | 骨架填充：複雜介面先出灰色骨架塊，再按閱讀順序一塊塊填進真實內容。寫在容器上，子元素就是一塊塊內容。參數 gap（每塊間隔，預設 0.15）、hold（骨架先停多久，預設 0.5） |
| `deal-in` | 發牌入場：一組圖不同時出現，一張接一張沿弧線飛到各自位置。搭配 `each:` 用。參數 stagger（預設 0.1）、from=left/right（從哪邊發）、dur |
| `drop-gather` | 落下收攏：一堆圖從上方落下，收攏成扇形，只留要講的幾張，其餘掉出畫面。寫在容器上；要留的子元素加 `data-keep`（不加就留前 keep 張）。參數 keep（預設 3） |
| `fly` | 縱深穿梭：鏡頭連續往裡飛，穿過的那件放大變虛，下一件從深處淡入。寫在 `data-make="tunnel"` 上。參數 to（飛到第幾件，從 1 數）、each（每件用時，預設 0.7） |
| `helix-spin` | 環筒螺旋：相機繞著圓筒轉，先快後慢轉開，再勻速慢轉。寫在 `data-make="helix"` 上。參數 turn（快轉多少度，預設 300）、dur（快轉用時，預設 2.4）、slow（之後每秒慢轉幾度，預設 10） |
| `flip-to` | 三維翻轉：展板一塊接一塊往上滾，每塊繞橫軸大角度翻轉，轉到正面完整顯色，其餘壓暗到 30%。寫在 `data-make="flipboard"` 上。參數 i（翻到第幾塊，從 1 數）、dur |
| `pick` | 放大讓位：扇形裡講到誰，誰就抬起放大，左右往兩邊讓開，其他圖都還看得見。寫在 `data-make="fan"` 上。參數 i（第幾張，從 1 數；0 = 全部放回）、s（預設 1.3）、gap（讓開多遠，預設 90）、lift（抬多高，預設 70） |
| `slice-to` | 切片換圖：新圖切成幾條，一條條從下面長上來，編號同步翻牌。寫在 `data-make="slices"` 上。參數 i（換到第幾張，從 1 數；不寫就是下一張）、stagger（預設 0.07）、dur |
| `road-walk` | 走進畫面：鏡頭貼著地面沿路往裡走，走到哪一步哪一步亮。寫在 `data-make="road"` 上。參數 i（走到第幾步，從 1 數）、dur |
| `bignum` | 章節卡入場：大數字先落下，標題跟著滑出。寫在 `data-make="bignum"` 上。參數 dock（幾秒後縮成左上角小標籤，不寫就不縮） |
| `segment` | 進度線走到第 i 段（從 1 數）。寫在 `data-make="segments"` 上，一般放在常駐疊加層裡 |

### 舞台 (7)

「主持人在前、場景在後、資訊用畫中畫給」這種動畫科普片的舞台零件，需要額外載入 `fx-stage.js`。場景背景（`backdrop`）、帶螢幕的設備（`device`）、全螢幕插畫特寫、選擇面板（`menu`）、全身小演員（`mini`）。不寫 `data-world` 時使用：分鏡之間硬切，換場景背景時用 `data-in="mosaic"`。

| 名稱 | 作用 / 參數 |
|---|---|
| `cutaway` | 插畫特寫：一張全螢幕插畫硬切進來，很慢地推近，到時間硬切回去；期間蓋住演員，字幕和章節條還在。寫在 `<img>` 上（放在所在分鏡裡即可）。參數 dur（停多久，1.2–2.5 秒）、zoom（推到多大，預設 1.07）、x / y（同時平移百分比）、under=1（放在演員下面：主持人繼續站在畫面上講，適合全螢幕錄屏） |
| `screen-to` | 螢幕內切換：設備螢幕裡的內容硬切到第 i 個（從 1 數；不寫就是下一個），帶一下很輕的閃白。寫在 `data-make="device"` 上 |
| `dive` | 鑽進螢幕：設備朝鏡頭放大，直到它的螢幕鋪滿全螢幕（下一個分鏡用同一張畫面當背景，就像走進了螢幕裡）。寫在 `data-make="device"` 上，一般放在分鏡最後 0.5 秒。參數 dur（預設 0.5） |
| `frames` | 序列幀播放：把一串截圖當影片播（實機錄屏、操作示範），逐幀確定。元素上寫 `data-frames="目錄/f_%03d.jpg" data-n="幀數"`。參數 fps（預設 15）、dur（播多久，預設到分鏡結束；播完從頭循環） |
| `choose` | 選一項：選擇面板的高亮條跳到第 i 項並打勾。寫在 `data-make="menu"` 上。參數 i（從 1 數；寫成 `2/4/1/3` 就是連著快速選好幾次）、every（連選時每次間隔，預設 0.28 秒） |
| `mini-walk` | 小演員走過去：兩幀步態交替 + 水平移動，走到後站定。寫在 `data-make="mini"` 上。參數 x（走多遠，負數向左）或 to=#目標（走到它旁邊）、dur、step（每步多久，預設 0.16 秒） |
| `mini-pose` | 小演員換動作（舉手、歡呼、坐下…），帶一下擠壓回彈。寫在 `data-make="mini"` 上。參數 name（動作名，對應 `data-poses` 裡的名字）、hold（幾秒後自動回到站立，不寫就一直保持） |

### 元件 (4)

搭配 `data-make` 產生的元件使用。

| 名稱 | 作用 / 參數 |
|---|---|
| `step` | 步驟導覽切換：搭配 data-make="steps"，把第 i 個膠囊點亮（從 1 數起），其餘熄滅 |
| `chapter` | 章節進度條：搭配 data-make="chapters"，醒目區塊滑到第 i 章（從 1 數起） |
| `check` | 清單打勾：搭配 .fx-check 元件，勾畫出來、文字變實 |
| `toggle` | 撥動開關：搭配 data-make="switches"，把第 i 個開關（支援 2/3/5 批次）撥到開(on=1)或關(on=0)。參數 i、on=0/1、stagger |

### 轉場 (23)

寫在**後一個**場景上：`<section class="scene" data-in="blur-cross(dur=0.5)">`。

| 名稱 | 作用 / 參數 |
|---|---|
| `cut` | 硬切（預設）。最常用，節奏最快 |
| `fade` | 交叉淡化 |
| `blur-cross` | 模糊交叉：前一鏡變模糊淡出，後一鏡由模糊變清晰 |
| `zoom-through` | 縮放穿越：前一鏡放大衝出畫面，後一鏡從小處放大到定位 |
| `push` | 推移：新場景把舊場景頂出去。參數 dir=left/right/up/down |
| `wipe` | 擦除：新場景沿一個方向蓋上來。參數 dir |
| `iris` | 圓形擴散：新場景從一個點擴成滿版。參數 x、y（百分比） |
| `flash` | 閃白（或任意色）切換：重點句、章節開頭。參數 color |
| `dip` | 黑場過渡：先暗下去再亮起來（換話題）。參數 color |
| `pixelate` | 像素溶解：方塊依隨機順序蓋滿畫面再散開（像素風換場景）。參數 cols、color |
| `paper-slide` | 抽紙：新的一頁紙從一側滑進來蓋住舊頁，邊緣帶投影，舊頁稍微壓暗。參數 dir=left/right/up/down |
| `tear` | 撕紙：新畫面沿一條參差的撕裂邊從一側露出來（剪紙風換場景）。參數 dir=right/left/down/up、jag、teeth |
| `glitch-cut` | 故障閃切：新畫面帶紅藍錯位閃幾下再穩定下來（科技感切換） |
| `open` | 開門：新畫面從中間一條縫向兩邊拉開。參數 dir=x（左右拉開）/y（上下拉開） |
| `shatter` | 碎裂崩塌：畫面裂成 3D 碎片翻轉墜落，露出下一幕（適合崩潰、破局、反轉）。參數 cols、colors=色1/色2、dur、seed |
| `diagonal-split` | 斜切拉開：一道發光刀光斜劈畫面，向兩側凌厲拉開露出新場景（動漫分鏡感）。參數 angle=斜度、color、dur |
| `blinds` | 百葉窗翻轉：新畫面切成多根條帶，依波浪順序逐條翻開蓋住舊畫面。參數 n=條數、dir=x/y、dur |
| `crt-off` | 老電視換台：舊畫面壓扁成高亮掃描線收縮，隨即閃開新畫面（復古極客感）。參數 color、dur |
| `portal-spin` | 漩渦穿越：舊畫面旋轉吸入中心，新畫面從旋轉模糊中甩出定格。參數 deg=旋轉角度、dur |
| `halftone` | 漫畫網點波紋：圓點陣列沿對角線放大鋪滿再收縮揭開新畫面（二次元/像素風絕配）。參數 cols、color、dur |
| `cam-to` | 世界畫布專用（預設）：鏡頭斜著推到下一個機位，先往後拉一點再推進，先慢再快再慢。參數 dur（0.6–0.9）、arc（路上多繞幾度，預設 8）、pull（回拉幅度，預設 0.07） |
| `cam-jump` | 世界畫布專用：鏡頭直接跳到下一個機位（硬切），只在換大章節時用 |
| `mosaic` | 馬賽克換場：紙色方塊從上往下隨機蓋滿，再隨機揭開新場景；方塊在演員和常駐層下面，主持人不會被蓋住（換章節、換場景背景時用）。參數 cols（一行幾塊，預設 24）、color、dur、seed |
<!-- CATALOG:END -->
