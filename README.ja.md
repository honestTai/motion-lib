<div align="center">

<img src="docs/hero-banner.svg" width="100%" alt="motion-lib — HTML → 動画のための宣言型モーションライブラリ" />

<br />

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · **日本語**

[![License: MIT](https://img.shields.io/badge/License-MIT-8453e8?style=flat-square)](LICENSE)
[![Effects](https://img.shields.io/badge/Effects-153-6fd3ff?style=flat-square)](#エフェクトカタログエフェクト-153-種--トランジション-20-種)
[![Transitions](https://img.shields.io/badge/Transitions-20-e4b256?style=flat-square)](#トランジション-20)
[![3D & VRM](https://img.shields.io/badge/3D_&_VRM-three.js_+_IK-68e6b2?style=flat-square)](#1-本物の-3d-アニメ-vrm-プレゼンターfx-vrmjs)
[![Zero Build](https://img.shields.io/badge/Build-Zero_Bundler-2ea043?style=flat-square)](#クイックスタート)
[![Sponsor: HRouter](https://img.shields.io/badge/Sponsor-HRouter.net-a8ff57?style=flat-square&labelColor=0b1a13)](https://hrouter.net/)

[クイックスタート](#-クイックスタート) · [テーマギャラリー](#-テーマ--3d-ギャラリー) · [AI 動画自動化](#-ai-による動画自動生成ワークフロー) · [基本構文](#-基本構文) · [2D IK & 3D VRM](#-高度なビジュアル--キャラクターモジュール) · [エフェクト一覧](#エフェクトカタログエフェクト-153-種--トランジション-20-種)

</div>

---

<!-- HROUTER SPONSOR BANNER -->
<div align="center">
  <a href="https://hrouter.net/" target="_blank" rel="noopener">
    <img src="docs/hrouter-en.svg" width="100%" alt="HRouter — One API Key for Claude, GPT, Gemini & Grok" />
  </a>
</div>

> ⚡ **公式コンピュートパートナー [HRouter](https://hrouter.net/)**：**1 つの API キーで Claude / GPT / Gemini / Grok に直結**。従量課金・即時チャージ反映・リクエスト単位の利用明細に対応し、**[Claude Code](https://hrouter.net/docs/claude-code/)**・**[Codex](https://hrouter.net/docs/codex/)**・**[Gemini CLI](https://hrouter.net/docs/gemini-cli/)** から `motion-lib` の動画 HTML を一括自動生成できます！ 👉 **[公式サイト hrouter.net](https://hrouter.net/)** · **[モデルと料金](https://hrouter.net/models/)** · **[導入ガイド](https://hrouter.net/docs/index/)**

---

## 🎬 ライブプレビュー

**HTML → 動画のための宣言型モーションライブラリです。** 通常の DOM 要素に `data-fx="エフェクト名@秒数"` と 1 行書くだけで、解説動画・テック動画・データ可視化・宇宙パーティクル・本物の 3D VRM アニメプレゼンターを構築し、[HyperFrames](https://hyperframes.heygen.com) で 1080p / 60fps MP4 へ決定論的にレンダリングできます。

<div align="center">
  <a href="promo/motion-lib-promo.mp4">
    <img src="docs/promo-preview.gif" width="100%" alt="motion-lib プロモーション動画プレビュー" />
  </a>
  <p>
    <sub>▲ 実機レンダリングプレビュー（フル HD 動画 <a href="promo/motion-lib-promo.mp4"><code>promo/motion-lib-promo.mp4</code></a> · ソース <a href="promo/index.html"><code>promo/index.html</code></a> · 6 本まとめ <a href="examples/showreel.mp4"><code>examples/showreel.mp4</code></a>）</sub>
  </p>
</div>

<!-- STATS:START -->
| | 数 |
|---|---|
| エフェクト | **217** 種（入場 26 · 退場 10 · 強調 41 · テキスト 9 · データ 7 · カメラ 14 · キャラクター 25 · 切り紙 10 · パーティクル 8 · 3D 12 · 空間 21 · ステージ 10 · 手描き 5 · チャットとコード 8 · 図解 3 · 図形 3 · サウンド 1 · コンポーネント 4） |
| トランジション | **23** 種 |
| コンポーネントジェネレーター | **40** 個（`bars` `wave` `steps` `chapters` `ring` `wall` `dust` `line` `pixels` `circle-text` `retro-grid` `papercut` `hills` `torn` `switches` `space` `stage3d` `tunnel` `helix` `flipboard` `fan` `slices` `road` `bignum` `segments` `actor` `puppet` `backdrop` `device` `menu` `mini` `house` `letterbox` `chat` `terminal` `code` `agent` `surround` `hub` `shape`） |
| スキン | **6** テーマ（ホワイトバイオレット · ブラックゴールド · レトロピクセル · 切り絵コラージュ · ディープスペース · スタジオ） |
<!-- STATS:END -->

<details open>
<summary><b>✨ アップデートハイライト（v1.4：3D VRM アバター + 2D ラバーホース IK + 新エフェクト・トランジション 12 種）</b></summary>
<br />

- **v2.3 の新機能**：まばたきに目を閉じた画像を使えます。各ポーズに `<src>_blink.png` を用意して `data-lid="1"`（スクリプトでは `lid: true`）と書くと、まばたきの瞬間に目の部分だけその画像に切り替わります。描き込みの多い厚塗りの立ち絵に向いています。
- **v2.2 の新機能（立体感）**：背景の `data-depth`（室内は奥の壁、屋外は地平線、または深度画像）で WebGL の奥行き視差。ワンカット映像の引きの画では建物が 3/4 アングルに回り、小道具はカメラの方へ少し向き、キャラクターがいちばん手前の層になります。
- **v2.1 の新機能**：`fx-shape.js`（図形の変形・パスに沿った移動・弾む揺れ、GSAP の無料プラグインを同梱）、ランキングの入れ替え `reorder`、BGM のビート同期 `FX.snapBeat`、黒金スキンの映画風ステージ小道具。
- **v2.0 の新機能（AI 動画のパーツ）**：`fx-ink.js`（手描き注釈）、`fx-chat.js`（チャット・プロンプト入力・ターミナル・コード差分・エージェントのカーソル）、`fx-diagram.js`（包囲・情報過多・放射図）、背景のピクセル化と光（HyperFrames のコンポーネント集を参考）。
- **v1.9 / v1.8 の新機能**：ワンカット映像 `fx-oner.js`、効果音レイヤー `fx-sound.js`、背景の空気感（光・天候・被写界深度）。
- **v1.5 の新機能（空間カメラ）**：オプションモジュール [`fx-world.js`](fx-world.js)。ルート要素に `data-world` を書くだけで、すべてのシーンが 1 枚の大きなキャンバスに並び、**シーンの切り替えはカメラの移動**になります（ページめくりではありません）。新エフェクト 21 種（その場拡大、背景ぼかし、フォーカス送り、カード配り、スケルトン表示、奥行きトンネル、らせん円筒、3D フリップボード、持ち上げて道を空ける、スライス切り替え、道を歩くなど）、新コンポーネント 7 種、6 つ目のテーマ `theme-studio`、ページ自己チェック `FX.lint()`（URL に `?lint` を付けると、小さすぎる文字、カメラ到着時の空画面、はみ出した文字を検出）を追加。
- **v1.4 の新機能**：
  - **本物の 3D VRM アニメアバターモジュール [`fx-vrm.js`](fx-vrm.js)**：`@pixiv/three-vrm`（MIT）ベース。解析的 2 ボーン 3D IK（`FX.ik3d`）、自動モデルリターゲティング、6 節脊椎ウェーブ、自動鎖骨連動、13 種のプレゼンポーズ、5 母音リップシンク（`aa/ih/ou/ee/oh`）、MToon トゥーン描画、2× スーパーサンプリング、連続 60Hz `SpringBone` 髪・スカート物理を搭載。pixiv 公式 **CC0 1.0 パブリックドメイン**モデル `assets/shino.vrm`・`assets/vita.vrm` を同梱。
  - **2D ソフトボーン＆ラバーホースモジュール [`fx-rig.js`](fx-rig.js)**：2 ボーン IK `FX.ik2` + 継ぎ目のない連続ベジェ袖 `FX.hose` + 任意の SVG キャラ対応 `[data-bone]` / `[data-follow]`。
  - **12 種の新エフェクト＆トランジション**：トランジション 6 種（`shatter` `diagonal-split` `blinds` `crt-off` `portal-spin` `halftone`）+ エフェクト 6 種（`circuit` `overload` `scan` `callout` `scatter-out` `toggle`）+ `switches` コンポーネント。
- **v1.3 / v1.2 / v1.1**：WebGL 3D モジュール [`fx-3d.js`](fx-3d.js)、Canvas 2D パーティクル [`fx-particles.js`](fx-particles.js)、`theme-space` および `theme-paper`。

</details>

---

## 💡 なぜ `motion-lib` なのか（仕組み）

<div align="center">
  <img src="docs/pipeline.svg" width="100%" alt="motion-lib deterministic rendering pipeline" />
</div>

ヘッドレス動画レンダラーは「フレーム `N` へシーク → スクリーンショット」を繰り返します。`motion-lib` はすべての DOM・パーティクル・3D カメラ・VRM 物理を**一時停止した 1 本の GSAP タイムライン**に統合し、シード付き乱数 `FX.rand(seed)` と純粋時間関数で完全な再現性を保証します。

---

## 🎨 テーマ ＆ 3D ギャラリー

<table>
  <tr>
    <td width="33%" align="center">
      <a href="examples/violet/violet.mp4"><img src="examples/violet/cover.jpg" width="100%" alt="theme-violet" /></a><br />
      <b>白紫テック</b> <code>theme-violet</code><br />
      <sub><a href="examples/violet/violet.mp4">▶ MP4 を再生</a> · <a href="examples/violet/index.html">ソース</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/gold/gold.mp4"><img src="examples/gold/cover.jpg" width="100%" alt="theme-gold" /></a><br />
      <b>黒金シネマ</b> <code>theme-gold</code><br />
      <sub><a href="examples/gold/gold.mp4">▶ MP4 を再生</a> · <a href="examples/gold/index.html">ソース</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/pixel/pixel.mp4"><img src="examples/pixel/cover.jpg" width="100%" alt="theme-pixel" /></a><br />
      <b>レトロピクセル</b> <code>theme-pixel</code><br />
      <sub><a href="examples/pixel/pixel.mp4">▶ MP4 を再生</a> · <a href="examples/pixel/index.html">ソース</a></sub>
    </td>
  </tr>
  <tr>
    <td width="33%" align="center">
      <a href="examples/paper/paper.mp4"><img src="examples/paper/cover.jpg" width="100%" alt="theme-paper" /></a><br />
      <b>切り紙コラージュ</b> <code>theme-paper</code><br />
      <sub><a href="examples/paper/paper.mp4">▶ MP4 を再生</a> · <a href="examples/paper/index.html">ソース</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/space/space.mp4"><img src="examples/space/cover.jpg" width="100%" alt="theme-space" /></a><br />
      <b>深宇宙パーティクル</b> <code>theme-space</code><br />
      <sub><a href="examples/space/space.mp4">▶ MP4 を再生</a> · <a href="examples/space/index.html">ソース</a></sub>
    </td>
    <td width="33%" align="center">
      <a href="examples/three/three.mp4"><img src="examples/three/cover.jpg" width="100%" alt="fx-3d.js" /></a><br />
      <b>本物の 3D シーン</b> <code>fx-3d.js</code><br />
      <sub><a href="examples/three/three.mp4">▶ MP4 を再生</a> · <a href="examples/three/index.html">ソース</a></sub>
    </td>
  </tr>
</table>

---

## 🚀 クイックスタート

**動作環境**：Node.js 18+、FFmpeg、Google Chrome（標準以外の場所は環境変数 `REAL_CHROME`）。

```bash
mkdir my-video && ./new-project.sh my-video
cd my-video
open "index.html?play"                       # スペースで再生、←/→ でコマ送り、↑/↓ でシーン移動
npx hyperframes snapshot --at 1,3,5
HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" \
  npx hyperframes render -o out.mp4 --experimental-fast-capture=false
```

---

## 🤖 AI による動画自動生成ワークフロー

**[HRouter (hrouter.net)](https://hrouter.net/)** の単一 API キーで **Claude Code / Codex / Gemini CLI** を接続すれば、台本から `data-fx` 付き HTML と MP4 を一括生成できます：

```bash
export ANTHROPIC_BASE_URL="https://hrouter.net"
export ANTHROPIC_AUTH_TOKEN="sk-your-hrouter-key"
claude "motion-lib/README.ja.md と fx-vrm.js を参考に script.md から 60fps 動画 index.html を作成し MP4 をレンダリングして"
```

---

## 📐 基本構文

- **シーン `<section class="scene">`**：`data-d="4"`（秒数）、`data-t="12.5"`（開始秒）、`data-in="blur-cross(dur=0.5)"`（トランジション）、`class="scene overlay"`（常駐オーバーレイ）。
- **エフェクト `data-fx="[ターゲット:]名前@時間(パラメーター)"`**：`@1.2` / `@+0.3` / `@-0.4`、`each:` / `chars:` / `words:` / `lines:`、`dur`・`ease`・`stagger`・`order` に対応。
- **17 個のコンポーネントジェネレーター `data-make`**：`bars`、`line`、`ring`、`wave`、`steps`、`chapters`、`switches`、`pixels`、`wall`、`dust`、`circle-text`、`retro-grid`、`papercut`、`hills`、`torn`、`space`、`stage3d`。

---

## 🌟 高度なビジュアル ＆ キャラクターモジュール

### 0. ワールドキャンバスとカメラ（`fx-world.js`、v1.5 の新機能）

シーンを全画面ページとして順番に表示するだけの映像は、スライドのように見えます。`fx-world.js` を読み込み、ルート要素に `data-world` を書くと、すべてのシーンが **1 枚の大きなキャンバス上のカメラ位置**になります。シーンが切り替わるとカメラが次の位置へ斜めに移動し（少し引いてから寄る、0.8 秒）、止まっている間もゆっくり寄り続けます。既存のシーンの書き方は変わりません。

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

| 書く場所 | 書き方 | 役割 |
|---|---|---|
| ルート要素 | `data-world="snake\|row\|depth"` | カメラ位置を蛇行 / 一列 / 奥行き方向に並べる（カメラが奥へ飛ぶ） |
| ルート要素 | `data-cols` `data-wall` `data-tilt` `data-travel` `data-drift` | 1 行の数、背景の文字ウォール、傾き、移動時間、停止中の寄りの速さ |
| シーン | `data-in="cam-jump"` | この切り替えだけハードカット（既定の `cam-to` は書かなくてよい） |
| 要素 | `cam-look@t` / `cam-home@t` / `cam-wide@t` | 要素に寄る / 戻る / キャンバス全体まで引く |
| 要素 | `wake` `zoom-here` `push-back` `depth` `rack-focus` `bg-tint` | 先に置いて後から点灯、その場拡大、背景ぼかし、深度レイヤー、フォーカス送り、背景色の切り替え |
| 画像セット | `deal-in` `skeleton` `drop-gather` · `tunnel`+`fly` · `helix`+`helix-spin` · `flipboard`+`flip-to` · `fan`+`pick` · `slices`+`slice-to` · `road`+`road-walk` | 登場・配置・切り替え・手順の 9 つの見せ方 |

完全なサンプル：[`examples/world/`](examples/world/index.html)（[▶ MP4](examples/world/world.mp4)）。

**ページ自己チェック**：ブラウザで `index.html?lint` を開く（またはコンソールで `FX.lint()` を呼ぶ）と、各シーンを「カメラ到着時」と「後半」の 2 つの時点にシークし、実際のレイアウトから報告します：32px 未満の文字、到着時に空の画面、はみ出した文字や重なった文字、字幕帯に隠れる文字、実素材の有無。結果は `<script id="fx-lint">` にも書き込まれ、コマンドラインツールから読めます。

### 0.5 立ち絵パペットと、内容についていくアクター（`fx-puppet.js`、v1.6 の新機能）

1 ポーズにつき画像 3 枚（口を閉じる / 半開き / 大きく開く）だけで、レイヤー分けもボーンも不要です。立ち絵が**まばたき・呼吸・頭の揺れ・口パク・うなずき・体の傾き**をし、頭上に手描き風の感情マークを出せます（絵文字は使わないので、どの環境でも同じ見た目）。まばたきは目の領域を縦に 1 本の線までつぶして計算するので、両目の位置を教えるだけです。

アクターは常駐オーバーレイで一度だけ宣言します。**説明している要素に `call` を書く**と、アクターはその場でしゃがみ、その要素の横から顔を出します。キャラクターが隅に固定されず、内容についていきます。画面全体を内容に譲るときは `dismiss` を使います。

```html
<script src="lib/fx-puppet.js"></script>

<section class="scene" data-d="7.4" data-fx="pup-talk@0.3(who=bot,dur=6.8)">
  <div class="shot" data-fx="call@0.2(who=bot)"><img src="a.jpg"></div>              <!-- この画像の上端から顔を出す -->
  <div class="shot" data-fx="call@2.6(who=bot) pup-emote@3(who=bot,kind=idea)"><img src="b.jpg"></div>
</section>
<section class="scene overlay" data-t="0" data-d="19">
  <div data-make="actor" data-name="bot" data-src="assets/bot" data-eyes="238,236,64,76/362,236,64,76" data-neck="300,400" data-home="80,0,460"></div>
</section>
```

`data-src` は拡張子なしのパス（ライブラリが `_m0.png` / `_m1.png` / `_m2.png` を読みます）、`data-eyes` は両目の「中心 x, 中心 y, 幅, 高さ」、`data-neck` は首の位置で、単位はすべて元画像のピクセルです。複数ポーズや音声タイムラインに合わせた編成にはスクリプト API `FX.actor()` / `FX.puppet()` を使います（`fx-puppet.js` の冒頭を参照）。完全なサンプル：[`examples/puppet/`](examples/puppet/index.html)（[▶ MP4](examples/puppet/puppet.mp4)）。サンプルの小さなロボットはリポジトリ同梱のオリジナル素材です（`assets/puppet/`）。

### 0.6 ステージ劇：プレゼンター + 場面 + ピクチャー・イン・ピクチャー（`fx-stage.js`、v1.7 の新機能）

もう 1 つのよくある形式です：**半身のプレゼンターが手前に常駐し、背景は場面が次々と変わり、情報はピクチャー・イン・ピクチャーで出し、ときどき全画面のイラストを差し込む**。シーンはハードカット、場面転換はモザイク、プレゼンターは 1 文ごとにポーズを変えるので、2–3 秒ごとに必ず画面が変化します。`data-world` なしで使います。

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

| パーツ | 書き方 | 役割 |
|---|---|---|
| 背景 | `data-make="backdrop"` | `data-src` で画像を使う。なければ `data-kind="field\|room\|city\|night"` でピクセル調の場面をプログラムで描く（素材不要） |
| シーンの空気感 | `data-grade` `data-focus` `data-lights` `data-weather`（backdrop に書く） | カラーグレーディング + ビネット、ティルトシフトのぼかし、呼吸する光源、天候パーティクル。背景が一枚の止め絵ではなくなる |
| 場面転換 | `data-in="mosaic"` | 紙色のブロックが覆って外れる。プレゼンターは隠れない |
| デバイス画面 | `data-make="device"` + `screen-to` / `dive` | ノート PC / スマホ / ウィンドウの中にコンテンツ。画面内ハードカット。画面に飛び込んで全画面にする |
| 連番フレーム | `frames@0(fps=20)` | 一連の静止画を動画として再生（画面録画） |
| イラスト差し込み | `cutaway@t(dur=1.8)` | 全画面の絵がハードカットで入り、ゆっくり寄り、ハードカットで戻る |
| 選択パネル | `data-make="menu"` + `choose` | ハイライトが項目へ移動してチェックが付く |
| ミニキャラ | `data-make="mini"` + `mini-walk` / `mini-pose` | 全身のミニキャラが 2 フレームで歩き、動作を切り替える |
| ポーズ変更 | `pup-pose@t(who=bot,pose=point)` | ハードカット。切り替えの瞬間に自動でまばたき |

完全なサンプル：[`examples/stage/`](examples/stage/index.html)（[▶ MP4](examples/stage/stage.mp4)）。サンプルの小さなロボット（半身 4 ポーズ、全身ミニ、イラスト 1 枚）はリポジトリ同梱のオリジナル素材で、ソースは `assets/puppet/src/` にあります。

### 0.7 サウンドレイヤー：すべてのエフェクトに音が付く（`fx-sound.js`、v1.8 で追加）

絵が良くても、音がなければ無声映画のままです。`fx-sound.js` を読み込むと、**各エフェクトが発火する瞬間に効果音が自動で付きます**。タイミングを書く必要も、素材を探す必要もありません。音はすべてコードで合成します。

```html
<script src="lib/fx-sound.js"></script>

<div data-fx="pop-in@1.2">…</div>                 <!-- 既定で「ポン」 -->
<div data-fx="drop-bounce@2(sfx=ding)">…</div>    <!-- 別の音に変える -->
<div data-fx="rise-in@3(sfx=none)">…</div>        <!-- 今回は鳴らさない -->
<div data-fx="sfx@4.5(kind=chime)"></div>         <!-- 画面に動きがない場所に音だけ置く -->
```

```bash
node lib/sfx.mjs my-video                  # → my-video/audio/sfx.wav（映像と同じ長さの効果音トラック）
node sfx.mjs --audition out/               # パレットごとに試聴ファイルを書き出す
```

| 項目 | 説明 |
|---|---|
| 27 種類の音 | `pop` `tick` `click` `swish` `whoosh` `thump` `snap` `hit` `ding` `chime` `blip` `rise` `fall` `buzz` `sparkle` `zap` `glitch` `paper` `flap` `card` `rumble` `swellup` `shimmer` `type` `roll` `step` `dots` |
| 4 つのパレット | `soft` クリーンな UI 音（既定）· `pixel` 矩形波とノイズチャンネルの 8-bit ゲーム機の音（`theme-pixel` で自動）· `cinema` 低めで空間感あり（`theme-gold` / `theme-space`）· `paper` 紙と木（`theme-paper`）。ルート要素に `data-sound="pixel"` で指定、`data-sound="off"` で全体を無音に |
| 自動処理 | 時間差で入る要素は音高が一段ずつ上がる。同じ音の繰り返しは音高を入れ替える。詰まりすぎた音は間引く。要素の左右位置に合わせてパンを振る |
| プレビュー | URL に `?play` を付けて再生 |
| ミックス | トラックのピークは約 −13 dB。そのままナレーションの下に敷けます：`ffmpeg -i voice.wav -i audio/sfx.wav -filter_complex "amix=inputs=2:normalize=0" mix.wav` |

### 0.9 AI 動画のパーツ：手描き注釈・AI チャット・コード・図解（v2.0 で追加）

AI を扱う動画で何度も出てくる画面を、本物のソフトと同じ間合いで動くパーツにしました。追加モジュールは `fx-ink.js`（手描き注釈）、`fx-chat.js`（チャット・プロンプト入力・ターミナル・コード・エージェントのカーソル）、`fx-diagram.js`（包囲・情報過多・放射図）。背景のピクセル化（`data-dither` + `dither-in`）と光（`light-sweep` `light-leak`）は `fx-stage.js` に入っています。間合いの数値は [HyperFrames のコンポーネント集](https://github.com/heygen-com/hyperframes)（Apache-2.0）を参考にし、コードは本ライブラリの宣言的な書き方で書き直しています。

完全なサンプル：[`examples/kit/`](examples/kit/index.html)（[▶ MP4](examples/kit/kit.mp4)）。

### 0.10 GSAP の無料プラグイン・ビート同期（v2.1 で追加）

`fx-shape.js`：図形の変形（`shape-morph`）、パスに沿った移動（`path-move`）、弾む揺れ（`wiggle`）。`vendor/gsap-plugins/` の GSAP プラグイン（現在は商用も無料）を先に読み込みます。ランキングの入れ替え `reorder` は本体に入っています。`window.FX_BEATS`（ビート表）を読み込むと、ワンカット映像の部屋移動と写真への寄りが自動で拍に合います。`theme-gold` ではステージの小道具が映画風の見た目になります。

### 1. 本物の 3D アニメ VRM プレゼンター（`fx-vrm.js`）

<div align="center">
  <img src="docs/vrm-preview.gif" width="88%" alt="fx-vrm.js 3D VRM キャラクター + circuit + switches プレビュー" />
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

### 2. 2D ラバーホース IK（`fx-rig.js`）・3D シーン（`fx-3d.js`）・2D パーティクル（`fx-particles.js`）

- **`fx-rig.js`**：2 ボーン IK `FX.ik2` と連続ベジェ袖 `FX.hose`（`rig-idle`、`rig-pose`、`rig-talk`、`rig-nod`、`rig-wave`）。
- **`fx-3d.js`**：`data-alpha="1"`（透過オーバーレイ＋自動 2× スーパーサンプリング）、`data-light="anime"`、`data-bloom`、`cam3d` / `orbit3d`。
- **`fx-particles.js`**：`data-make="space"` キャンバス上に `nebula`、`starfield`、`vortex`、`blackhole`、`form-text` などを積層。

---

## 📜 ライセンス ＆ クレジット

- **コアコード（`fx*.js`、`fx.css`）**：[MIT License](LICENSE)（サードパーティ表記は [NOTICE](NOTICE)）。
- **3D ＆ VRM ランタイム**：[three.js](https://github.com/mrdoob/three.js)（MIT）および [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)（MIT）。
- **同梱 3D サンプルアバター（`assets/shino.vrm`、`assets/vita.vrm`）**：pixiv Inc. により **CC0 1.0 パブリックドメイン**で公開（[assets/README.md](assets/README.md)）。
- **スポンサー**：**[HRouter (hrouter.net)](https://hrouter.net/)** — Claude / GPT / Gemini / Grok を 1 つの API キーで利用できる AI モデルルーター。

---

<!-- CATALOG:START -->
## エフェクトカタログ（エフェクト 217 種 + トランジション 23 種）

> このセクションは `node gen-readme.mjs` が `fx.js` から自動生成します。手で編集しないでください。
> すべてのエフェクトで共通パラメーター `dur`（長さ）、`ease`（イージング）、`stagger`（時間差）が使えます。下の表には各エフェクト固有のパラメーターのみを載せています。

### 入場 (26)

要素が現れる方法です。デフォルトでは「入場前」の状態から要素本来の見た目に戻るため、要素自身に書いた CSS の位置や回転はそのまま保たれます。

| 名前 | 動作 / パラメーター |
|---|---|
| `fade-in` | 単純なフェードイン。最も控えめで、字幕や補足説明に使います |
| `rise-in` | 下からスライドアップ + フェードイン。最も汎用的な入場です。パラメーター：dist=移動量（px） |
| `drop-in` | 上から落ちる + フェードイン。タグやバッジに使います |
| `slide-in` | 片側からスライドイン。パラメーター：dir=left/right/up/down（動く向き）、dist |
| `blur-in` | ぼかしからくっきりへ、その場で現れます。大見出しやスクリーンショットカードに使います |
| `blur-rise-in` | ぼかし + スライドアップ + フェードイン。シネマ調タイトルの標準的な入場です |
| `scale-in` | 少し小さい状態から拡大して定位置へ。カードや画像の標準的な入場です。パラメーター：from=開始スケール |
| `pop-in` | ポップ：小さい状態から拡大し、オーバーシュートして弾みます。吹き出しピル、アイコン、チェック・バツに使います |
| `zoom-settle` | 拡大してぼけた状態から定位置に収まります（レンズのピントが合う感じ）。オープニングの大文字に使います |
| `wipe-in` | マスクのワイプで現れます。パラメーター：dir=right/left/up/down（ワイプが進む向き） |
| `mask-rise` | 見えない基線の下から文字がせり上がります（マスクのスライドアップ）。最もタイトルらしい見え方です |
| `flip-in` | 水平軸を中心に立ち上がるように反転（3D）。カードのめくりや、はてなカードの種明かしに使います |
| `tilt-in` | パースのついた傾きで飛び込みます（3D カードが横から正面に回る）。UI のスクリーンショットに使います |
| `stamp-in` | スタンプ：大きなサイズから叩きつけ、着地時に揺れます。結論、印鑑、チェック・バツに使います |
| `drop-bounce` | 画面上から落ち、着地で 2 回弾みます。物の積み重ねやピクセルブロックに使います |
| `swing-in` | 吊り看板のように上端から振り下りて、まっすぐに収まります |
| `focus-in` | 字間が大きく広い状態から狭まり、ぼけた状態からくっきりします。英語の小見出しや副題によく使います |
| `grow-x` | 横方向に 0 から伸びます（棒グラフ、区切り線、プログレスバー）。パラメーター：origin=left/center/right |
| `grow-y` | 縦方向に 0 から伸びます（縦棒グラフ）。パラメーター：origin=bottom/top |
| `fan-in` | 重なったカードが中心からそれぞれの位置へ扇状に広がります（each: と併用）。最終的な位置と角度は CSS の記述どおりになります |
| `type` | タイプライター：1 文字ずつ打ち出します。パラメーター：cps=1 秒あたりの文字数、caret=1 でカーソル表示 |
| `draw` | 線描き：SVG の線がパスに沿って描かれます（接続線、矢印、囲み、折れ線グラフ） |
| `pixel-in` | ピクセル風の入場：4〜5 段階でとびとびに現れます（滑らかではありません）。each: と併用するとブロックで文字を組めます |
| `scramble` | 文字化けデコード：各文字がまずランダムな文字（グレー）で点滅し、左から順に正しい文字（白）に確定します。パラメーター：dur、chars=ランダム文字のプール |
| `light-speed-in` | 光速入場：斜めに変形しながら片側から猛スピードで飛び込み、行き過ぎてから元に戻ります（animate.css lightSpeedIn）。パラメーター：dir=left/right（動く向き）、dist |
| `jack-in` | びっくり箱：下から少しずつ飛び出し、左右に2回揺れて落ち着きます（animate.css jackInTheBox） |

### 退場 (10)

要素が去る方法です。通常は `@-0.4`（シーン終了の 0.4 秒前）と書きます。

| 名前 | 動作 / パラメーター |
|---|---|
| `fade-out` | フェードアウト |
| `rise-out` | 上へスライドして去る + フェードアウト |
| `drop-out` | 下へスライドして去る + フェードアウト |
| `blur-out` | ぼかし + フェードアウト（背景に退きます） |
| `scale-out` | 縮小 + フェードアウト。パラメーター：to=終了スケール（1 より大きいと拡大しながら消えます） |
| `slide-out` | 片側へスライドアウト。パラメーター：dir |
| `wipe-out` | マスクのワイプで消えます |
| `hinge` | ちょうつがい落下：左上に釘を打ったように2回揺れてから、画面の外へ落ちます（animate.css hinge）。パラメーター：dist |
| `fall-out` | 文字落下：1文字ずつ回転しながら画面の下へ落ちていきます（FallingText）。通常は chars: と組み合わせます。パラメーター：dist、seed |
| `scatter-out` | 四散バースト退場：要素が回転と放物線重力を伴って四方へ弾け飛びます（一括整理や誤解の打破に最適）。パラメーター：power=勢い、dur、seed |

### 強調 (41)

すでに画面にある要素に対して、ナレーションがその言葉に触れたタイミングで強調します。移動・色変更・内容の切り替えも含みます。

| 名前 | 動作 / パラメーター |
|---|---|
| `pulse` | 一度拡大して元に戻ります（その言葉に触れたときにトンと叩く）。パラメーター：to=ピークのスケール |
| `shake` | 左右に揺れます（否定、エラー、警告） |
| `nod` | 上下に軽く跳ねます（キャラクターのうなずき、アイコンの弾み） |
| `blink` | 数回点滅します（カーソル、警告）。パラメーター：n=回数 |
| `color` | 文字 / 背景の色を変えます。パラメーター：to=色、bg=背景色 |
| `marker` | 蛍光ペン：色のブロックが文字の下部を左から右へなぞります。パラメーター：color、h=ブロックの高さ（%） |
| `underline` | 下線が左から右へ伸びます。パラメーター：color、w=太さ（px） |
| `strike` | 取り消し線が走ります（古い案は無効） |
| `box` | ハイライト枠：要素の外周に枠線を描きます（スクリーンショット上の要点を囲む）。パラメーター：color、pad、w、r |
| `glow` | 発光の呼吸：光彩が点いてから戻ります。パラメーター：color、n=回数 |
| `sheen` | 光の走り：ハイライトがカード / ボタンの上を斜めに走ります |
| `ping` | 波紋：要素の中心から輪が広がります（クリックのフィードバック、位置の指示） |
| `dim` | 暗くする（脇役に退ける）。パラメーター：to=不透明度 |
| `undim` | 明るさを戻します |
| `spot` | スポットライト：each: と併用します。i 番目の子要素は明るいまま少し拡大し、残りは暗くなります。パラメーター：i（1 始まり） |
| `float` | 上下にふわふわ漂い続けます（待機感）。パラメーター：amp=振幅、period=1 往復の秒数、dur=持続時間 |
| `spin` | 回転。パラメーター：deg=合計角度、dur |
| `move` | 要素を別の要素の位置へ移動します（カーソルがボタンへ、タグがカードへ飛び込む）。パラメーター：to=#ターゲット、または x、y |
| `click` | クリック：押し込みで少し縮む + 波紋（.fx-cursor コンポーネントと併用） |
| `swap` | その場で内容を切り替え：自分はフェードアウトし、ターゲット要素がフェードインします。パラメーター：to=#ターゲット |
| `squash` | カードの潰れ → 弾け：横方向にいったん狭まってから戻ります（約 3 フレームで潰れ、4 フレームで弾む）。内容の切り替えとよく併用します。パラメーター：to=最も狭いときの比率 |
| `cycle` | 子要素のハードカット切り替え：一度に 1 つだけ表示し、every 秒ごとに次へ切り替えます（サムネイルの絵が変わり続ける）。パラメーター：every、loop=1 でループ、stop=何枚目で止めるか |
| `text` | 文字を新しい内容へハードカットで切り替えます（時計の表示変化、ラベルの書き換え）。パラメーター：v=新しい文字 |
| `to` | 万能トゥイーン：GSAP のプロパティを直接書けます。例：to@2(x=120,scale=1.2,opacity=0.5,dur=0.6,ease=inout) |
| `tada` | ターダ：いったん縮んでから、拡大しつつ左右に揺れます（animate.css tada） |
| `jello` | ゼリー：斜めに変形しながら左右に揺れ、振れ幅がだんだん小さくなります（animate.css jello） |
| `rubber-band` | ゴムバンド：横に伸びて縦につぶれ、何度か弾みます（animate.css rubberBand） |
| `heartbeat` | ハートビート：続けて2回拡大します（animate.css heartBeat） |
| `head-shake` | 首振り：少し3D回転を伴う左右の振り（否定・違うの表現）（animate.css headShake） |
| `wobble` | ぐらぐら：平行移動しながら傾いて左右に揺れます（animate.css wobble） |
| `border-beam` | 枠線ビーム：短い光の帯が要素の枠線に沿ってぐるりと走ります（BorderBeam / StarBorder）。パラメーター：color、w=太さ、len=光の帯が外周に占める割合、n=周回数、dur=1周の秒数、keep=1 で走り終えても消さない |
| `spotlight` | スポットライト：画面を暗くし、ターゲットだけを円形の明るい領域で照らします。同じシーンでもう一度指定すると、光の輪が新しいターゲットへ移ります（Spotlight）。照らしたい要素に書くか、to=#id を指定します。パラメーター：r=半径、dim=暗さ 0~1、off=1 で消灯 |
| `confetti` | 紙吹雪：要素の中心から紙吹雪をぱっと散らし、舞い上がってから落ちます（Confetti / ClickSpark）。パラメーター：n、colors=色1/色2/色3、power=勢い、seed |
| `sparkle` | きらめき：要素のまわりにランダムに小さな星が現れ、ちかちか光ります（SparklesText）。パラメーター：n、color、dur、seed |
| `orbit` | 周回：コンテナの子要素を円周上に等間隔に並べて中心のまわりを回します。子要素は常に正立のままです（OrbitingCircles）。コンテナに書きます。パラメーター：r=半径、turns=周回数、dur、reverse=1 で逆回り |
| `beam` | 接続ビーム：2つの要素の間に弧を描き、光の玉が線に沿って流れます（AnimatedBeam、「A が B にデータを渡す」の表現に最適）。始点の要素に書き、to=#終点 を指定します。パラメーター：curve=曲がり具合、color、n=流す回数、dur |
| `flip-swap` | 裏返して入れ替え：要素が縦軸まわりに裏返り、裏面に2つ目の子要素が現れ、また裏返って戻ります（カードめくり、答えの発表）。要素の中に子要素を2つ置き、1つ目が表、2つ目が裏です。パラメーター：axis=y/x |
| `circuit` | 直角回路リンク：2 つの要素を直角の配線で結び、光るデータパルスを流します（構成図、プロトコル通信）。始点に書き、to=#終点。パラメーター：mid=折れ位置、packets=パルス数、color、dur |
| `overload` | 過負荷アラーム：高速ジッターと赤い警告発光（コンテキスト溢れ、エラー演出）。パラメーター：amp、color、dur、seed |
| `scan` | レーザースキャン：光るスキャン帯がウィンドウやカードを走査します（コード解析、文書検索）。パラメーター：dir=down/right、color、n=回数、dur |
| `callout` | 引き出し線注釈：要素の端から折れ線を引き出し、ラベルをポップ表示します（グラフのピーク注釈）。パラメーター：text、dx、dy、color |

### テキスト (9)

文字専用：流光、グリッチ、単語の入れ替え、消して打ち直し、パタパタ表示板、輪郭線、残像。

| 名前 | 動作 / パラメーター |
|---|---|
| `shimmer` | 流光テキスト：ハイライトが文字の上を左から右へ走ります（ShinyText）。パラメーター：color=ハイライト色、n=走らせる回数、gap=1回ごとの間隔 |
| `glitch` | グリッチ文字：赤青のズレ + 震え + 斜め変形を短時間走らせてから元に戻ります（GlitchText）。パラメーター：amp=ズレのピクセル数、dur、seed。要素の x を 0 に戻すため、要素自体を動かしたいときは外側にラッパーを1枚かぶせてください |
| `rotate-words` | 単語ローテーション：同じ位置で単語が上へめくれて消え、次の単語がめくれて入ってきます（WordRotate）。パラメーター：words=B/C/D（/ 区切り。要素の元の文字が1つ目）、every=各単語の表示秒数 |
| `morph` | モーフィング切り替え：古い単語がぼやけて散り、新しい単語がぼやけの中から集まってきます（MorphingText）。パラメーター：words=B/C、every |
| `retype` | 消して打ち直し：今ある文字を後ろから1文字ずつ消し、そのあと新しい文字を打ち込みます（TextType）。パラメーター：v=新しい文字、cps=1秒あたりの入力文字数、del=1秒あたりの削除文字数 |
| `true-focus` | 単語ごとのフォーカス：一度に1単語だけをくっきり見せ、残りはぼかし、フォーカス枠がその単語へ移ります（TrueFocus）。中国語は / で区切り（例：AI/不会/替代/你）、英語はスペース区切り。パラメーター：every、blur、color |
| `split-flap` | パタパタ表示板：各文字がランダムな文字をいくつか素早くめくったあと、左から順に正しい文字で止まります（SplitFlap、空港の発着案内板）。入場用です。パラメーター：dur、stagger、chars=文字プール |
| `stroke-in` | 輪郭文字：まず一方向へ中空の輪郭線を描き、そのあと色で塗りつぶします（StrokeText）。パラメーター：w=線の太さ、color=線の色、hold=中空のまま止める秒数 |
| `echo` | 残像入場：半透明のコピーが何枚か後ろに尾を引きながら一緒に滑り込み、定位置に着くと残像が消えます（EchoText）。パラメーター：n=残像の枚数、dist、dir |

### データ (7)

数字・進捗・グラフ系です。数字系のエフェクトは小数桁と千単位の区切りを自動で保持します。

| 名前 | 動作 / パラメーター |
|---|---|
| `count` | 数字のカウント。要素内に最終的な数字を書くか、to= で指定します。from=開始値。小数桁と千単位の区切りを自動で保持します |
| `roll` | 桁ごとの縦ロール：各桁が 0〜9 の縦帯になり、ぼかしつつ回転したあと左から順に止まります（黒金テーマの $7,000）。パラメーター：dur、stagger、spins=余分に回す周数 |
| `clock` | 時計のダイヤル：from=23:28 から to=01:23 まで進めます（日付をまたぐ場合も自動対応） |
| `fill` | プログレスバーの塗りつぶし：要素の幅（dir=y のときは高さ）を from% から to% まで伸ばします |
| `ring` | リング進捗：data-make="ring" と併用します。パラメーター：from、to（0〜1） |
| `wave-live` | 波形の跳ね：data-make="wave" と併用します。各バーがシード値に従ってランダムに上下します。パラメーター：dur、seed |
| `reorder` | ランキングの入れ替え：列（または行）の子要素が新しい順位の位置へ滑り、上がった要素は少し大きくなる。リストの親要素に書く。パラメータ：order（元の番号を / 区切りで新しい順に、例 3/1/2）、dur（既定 0.8） |

### カメラ (14)

コンテナ全体に作用します。ズームイン、パン、3D 傾き、シェイク。

| 名前 | 動作 / パラメーター |
|---|---|
| `push` | ゆっくりズームイン（Ken Burns）：コンテナ全体が一定の速さで少しずつ拡大します。パラメーター：from、to、dur |
| `pan` | ゆっくりパン。パラメーター：x、y（総移動量 px）、dur |
| `zoom-to` | 部分へズーム：コンテナを拡大・移動して、対象領域を画面いっぱいにします。パラメーター：to=#ターゲット、または x,y,w,h（コンテナ内の px）、fill=画面に占める割合 |
| `zoom-reset` | 部分から全景へ引き戻します |
| `tilt` | 3D の傾きで配置し、ゆっくり回します（浮かぶ UI カード）。パラメーター：rx、ry=開始角度、rx2、ry2=終了角度 |
| `drift` | 背景のゆっくりしたドリフト（ぼかしたカードの壁、パーティクル層）。パラメーター：x、y、rot、dur |
| `cam-shake` | カメラの揺れ（強い衝撃、エラー） |
| `meteors` | 流星群：斜めに走る光の筋です（Meteors）。全面に敷いた背景レイヤーに書きます。パラメーター：n、angle=向きの角度（既定 135 = 左下へ）、color、dur、seed |
| `marquee` | マーキー：1行分の内容が横へ無限ループでスクロールします（Marquee / LogoLoop）。1行のコンテナに書くと、子要素が自動で複製されて幅を埋めます。パラメーター：speed=1秒あたりのピクセル数、reverse=1 で逆方向 |
| `bg-scroll` | 背景パターンのスクロール：background（グリッド、テクスチャ、ストライプ）を一定の速さで平行移動させ続けます。retro-grid コンポーネントと組み合わせます。パラメーター：x、y=1秒あたりのピクセル数 |
| `parallax` | 視差：コンテナ内の各レイヤーが前後の順に違う速さで平行移動します（奥ほど動きが小さく、手前ほど大きい）。hills の重なった紙の山と組み合わせます。コンテナに書きます。パラメーター：x、y=最前面レイヤーの総移動量、dur |
| `cam` | ワンカット映像で、部屋の中のカメラの動き：パン、プッシュイン、背景ぼかし。シーンに書く。パラメータ：x / y（画面ピクセル。正の値で右 / 下を見る）、z（寄りの倍率。1 が基準）、blur（背景ぼかしのピクセル数）、to=#要素（その要素に向ける。pull=0.5 で半分まで）、reset=1 で基準に戻す、dur |
| `shot` | ワンカット映像で、シーンの途中でカメラ位置を変える：部屋に寄る、または建物の外の引きの画に戻る。シーンに書く。パラメータ：room=番号/all、dur |
| `push-into` | 写真の中へ寄る：要素がまず額縁サイズで現れ、カメラが寄って全画面になり、止まってから引き戻す。シーン内の絶対配置の画像（left/top/width/height）に書く。パラメータ：dur（寄り始めから引き終わりまでの秒数）、in / out（寄りと引きの秒数）、cast=keep（キャラクターを残す）、stay=1（引いた後も額縁を残す） |

### キャラクター (25)

立ち絵・キャラクター用です。ポーズ切り替え、口パク、うなずき、ジャンプ、歩行。

| 名前 | 動作 / パラメーター |
|---|---|
| `pose` | 立ち絵のポーズ切り替え：.host の中に複数の [data-pose] 画像を置き、name で指定したものへハードカットします（トーク動画の立ち絵は通常ハードカット）。bounce=1 で潰れ → 弾みを追加します |
| `lipsync` | 口パク：コンテナ内の複数の [data-mouth] 画像を frames フレームごと（通常 2〜4）にハードカットで切り替え、終わると 1 枚目に戻ります。パラメーター：dur、frames、seed |
| `talk` | 話している間の小さな上下の揺れ。パラメーター：dur=話す長さ、rate=1 秒あたりの回数 |
| `hop` | その場で跳ねます（驚き、喜び）。パラメーター：h=高さ、n=回数 |
| `walk` | 歩いて移動：水平移動 + 一歩ごとの弾み。パラメーター：x=移動量、または to=#ターゲット、steps=歩数。ピクセルキャラクターには ease=steps(8) を追加します |
| `rig-idle` | ソフトリグ待機呼吸：任意の SVG キャラクターに自然な呼吸、髪の揺れ、シード制御の瞬きを与えます。パラメーター：dur、seed |
| `rig-pose` | ソフトリグ姿勢遷移：プリセット名または IK 手座標(lx,ly,rx,ry)へ滑らかに遷移し、継ぎ目のない連続ベジェ袖を自動描画します。パラメーター：pose、lx/ly/rx/ry、look、face、emote、dur |
| `rig-talk` | 多母音リップシンク：[data-viseme] の口形を自然に切り替え、話し終わると元の表情の口に戻ります。パラメーター：dur、frames、nod=1、seed |
| `rig-nod` | ソフトうなずき・首振り：首のピボットを動かし、髪やアホ毛のバネ追従を自動発生させます。パラメーター：shake=1（首振り）、n、amp、dur |
| `rig-wave` | ソフト手振り：指定した腕(arm=R/L)の IK 目標を弧を描くように往復させ、袖全体を滑らかに揺らします。パラメーター：arm=R/L、n、amp、dur |
| `vrm3d` | 3D VRM アニメアバター：標準 .vrm モデルを stage3d に読み込みます（MToon トゥーン描画 + 54 ボーン + 5 母音リップシンク + 決定論的 SpringBone 髪揺れ物理）。パラメーター：src、ry、x/y/z、s、breathe/blink/sway/spring |
| `vrm-pose` | 3D VRM ポーズ・表情切替：13 種の全身ポーズ（idle/wave/explain/point/point-up/think/shock/clasp/reject/shrug/proud/cheer/bow）、表情（neutral/happy/relaxed/angry/sad/surprised）、視線（look=cam/right/left/up/down、ry）を滑らかに遷移します |
| `vrm-talk` | 3D VRM 5 母音リップシンク：aa/ih/ou/ee/oh のブレンドシェイプと会話時の自然な頭の動きを駆動します。パラメーター：dur、rate、amp、seed |
| `vrm-nod` | 3D VRM うなずき・首振り・首傾げ：現在のポーズの上に 3D の頭部アクションを重ねます。パラメーター：kind=nod/shake/tilt、n、amp、dur |
| `vrm-move` | 3D VRM 移動・ポップ登場：3D キャラクターの位置を移動（下からのポップ登場や横移動など）します。パラメーター：x/y/z、fromY、dur、ease |
| `vrm-anim` | 3D VRM モーション再生：標準 .vrma (VRM Animation) ファイルをタイムライン上で決定論的に再生します。パラメーター：src、dur |
| `call` | アクターをこの要素のそばへ呼ぶ（その要素を説明するときに使う）：アクターはその場でしゃがみ、この要素の横から顔を出す。説明される要素に書く。`<section>` に書くとアクターは自分のホームに戻る。パラメータ：who（アクター名）、at=top/left/right/below（既定 top：要素の上端から顔を出す）、size（top は既定 340、それ以外は 420）、align（at=top のときの左右位置。0–1）、dx、dy、flip=1（左右反転して内容のほうを向かせる）、pose（同時にポーズを変える） |
| `closeup` | 顔のクローズアップ（リアクションショット）：このアクターの大きな顔へハードカットし、放射線の背景で少し止めてからハードカットで戻る。既存の半身スプライトだけで作れ、新しい素材は不要。`<section>` の `data-fx` に書く。パラメータ：who（アクター名）、dur（止める時間。既定 1.1）、pose（クローズアップ中のポーズ / 表情）、kind（同時に出す感情マーク）、color（背景色。既定は orange。red / blue / green / purple も可）、size（拡大サイズ。既定 1300） |
| `dismiss` | アクターをしゃがませて画面から退場させる（画面全体を内容に譲るとき）。パラメータ：who |
| `pup-talk` | 立ち絵が話す：口パクのトラックに合わせて 3 枚の口を切り替え、音量に合わせて頭を軽く揺らす。`data-make="puppet"` に書くか、`who=名前` でアクターを指定。パラメータ：dur（話す長さ。既定はシーンの終わりまで）。トラックは `FX.mouthTrack = { fps, frames }`（音声ツールが生成）から取り、なければ自動生成 |
| `pup-pose` | 立ち絵のポーズ変更（ハードカット。切り替えの瞬間に自動でまばたきし、少し弾む）。`data-make="puppet"` に書くか、`who=名前` でアクターを指定。パラメータ：pose、pop=0（弾ませない） |
| `pup-nod` | 立ち絵が 1 回うなずく（聞き手の相づち、話し手の強調）。`data-make="puppet"` に書くか、`who=名前` で指定。パラメータ：amp（既定 1） |
| `pup-lean` | 立ち絵が体ごと片側へ傾く（話している相手のほうへ）。`data-make="puppet"` に書くか、`who=名前` で指定。パラメータ：deg（正の値で右へ、0 でまっすぐに戻る）、dur |
| `pup-emote` | 立ち絵の頭上に手描き風の感情マークを出す。`data-make="puppet"` に書くか、`who=名前` で指定。パラメータ：kind=question/exclaim/sweat/anger/sparkle/idea/heart/zap/dots、hold（表示秒数。既定 1.6） |
| `pup-idle` | 立ち絵を生かしておくだけ（まばたき、呼吸、ゆっくりした頭の揺れ）。話さない。`data-make="puppet"` に書く。pup-talk / pup-nod / pup-lean / pup-emote のどれかを使っていれば不要 |

### 切り紙 (10)

切り紙・ペーパークラフト風のコラージュ：広げる、切り開く、破る、貼る、レイヤーを順に持ち上げるなどに加え、毎秒12コマのコマ撮りの手作り感も出せます。`theme-paper` スキンと最も相性がよいですが、どのスキンでも使えます。

| 名前 | 動作 / パラメーター |
|---|---|
| `paper-unfold` | 紙の展開：二つ折りの紙が折り目から開いて平らに広がります。少しだけ弾み戻ります。パラメーター：dir=down/up/left/right（広がる向き） |
| `cut-in` | ハサミで切り出し：ギザギザの縁に沿って1回ずつ「切って」要素を出していきます。コマ送りで進むので切り紙らしさが出ます。パラメーター：dir=right/left/down/up、teeth=ギザギザの数、jag=ギザギザの深さ（%）、snips=切る回数 |
| `peel-in` | 角めくり戻し：角が浮いたシールが元の位置に落ちて押さえつけられます。パラメーター：corner=tl/tr/bl/br（どの角か） |
| `layer-rise` | レイヤー順に上昇：コンテナ内の紙のレイヤーが奥から手前へ順に下から上がってきます。手前ほど遅く、遠くから上がります（重なる紙の山、紙の舞台）。コンテナに書きます。パラメーター：dist、stagger |
| `stick-on` | シールをぺたっ：カメラの手前から大きな影を伴って紙面に貼りつき、定位置で影が引き締まります（ラベルや写真を貼る表現）。パラメーター：from=開始時の拡大率、rot=開始時の傾き角 |
| `stop-in` | コマ撮り入場：毎秒12コマのコマ撮りのリズムで跳び込み、各コマに少しランダムな傾きが付きます（手作りアニメの質感）。パラメーター：dist、steps=跳ぶ回数、fps、seed |
| `jitter` | コマ撮りの震え：毎秒12コマで絶えずわずかに傾いたり動いたりし、手作業でコマ撮りしたような質感になります（boiling）。入場系の動効と位置を奪い合わないよう、外側のコンテナに付けるのがおすすめです。パラメーター：amp=角度、px=移動量、fps、dur |
| `lift` | 紙を持ち上げる：少し上に浮き、影が大きく薄くなって、指でつまみ上げたように見えます。down=1 で元に戻します。パラメーター：dist |
| `flutter` | ひらひら：風に吹かれた紙のように左右に何度か揺れ、ゆっくり静止します。パラメーター：deg、n=揺れる回数、origin |
| `sway` | 吊り下げ揺れ：吊るしたもの（ランタン、下げ札、窓飾り）がゆっくり左右に揺れ続けます。パラメーター：deg、period=1往復の秒数、dur |

### パーティクル (8)

キャンバス（Canvas 2D）のパーティクルです。別ファイル `fx-particles.js` の読み込みが必要です。`data-make="space"` のキャンバスコンテナに書き、各エフェクトはキャンバスの 1 レイヤーとして、書いた順に下から上へ重なります。共通パラメーター：`dur`（このレイヤーの長さ）、`fade` / `out`（フェードイン・アウトの秒数）、`x` / `y`（中心位置のパーセント）、`seed`。

| 名前 | 動作 / パラメーター |
|---|---|
| `starfield` | 星空：星が遠くからカメラに向かって飛んできます（speed=0 なら静止してまたたく星空）。パラメーター：n、speed、streak=尾の長さ（1 以上でワープ光線になります）、size、colors=色1/色2 |
| `nebula` | 星雲：やわらかな色つきの光の霧が大きな塊になってゆっくり漂います。最下層の背景に敷きます。パラメーター：n=光の塊の数、colors、alpha=濃さ |
| `vortex` | パーティクルの渦：パーティクルが螺旋の腕に沿って中心からカメラへ湧き出し、光る流線を伴います（時空トンネル）。パラメーター：arms=腕の数、n、speed、twist=ねじれの回数、spin=全体の回転速度、r=外周の半径、colors（腕ごとに交互）、lines=0 で流線を消す |
| `blackhole` | ブラックホール：黒い円盤 + 光るリング + 傾いた降着円盤。内側ほど速く外側ほどゆっくり回り、手前側の半周はブラックホールの前を通過します。パラメーター：r=ブラックホールの半径、tilt=降着円盤のつぶれ具合、rot=傾き角度、n、speed、c1=内側の色、c2=外側の色 |
| `orb` | エネルギーボール：三角形の破片でできた光る球体で、ゆっくり自転し、核が光ります。散らばった破片が集まって球になることも、弾け飛ぶこともできます。パラメーター：r=半径、detail=分割数（1=80 枚、2=320 枚）、gap=破片の隙間、spin、in=集まる秒数、explode=何秒目に弾けるか、c1=明るい面の色、c2=暗い面の色、edge=輪郭の色、core=核の色 |
| `burst` | 爆発：パーティクルと三角形の破片が中心から弾け飛び、白いフラッシュと衝撃波のリングを伴い、だんだん減速して消えていきます。パラメーター：n、power=勢い、shards=破片の割合 0~1、life=持続秒数、colors、ring=0 で衝撃波を消す、flash=0 でフラッシュを消す |
| `form-text` | パーティクル文字：回転しながら散らばった小さな四角が四方から飛んできて、1 行の文字（中国語・英語どちらも可）を組み上げます。パラメーター：text=文字、size=文字サイズ、font、weight、color、n=最大粒数、start=最初に漂う長さ、conv=集まる秒数、glow=0 で文字のにじみを消す、spacing=字間（px） |
| `stream` | パーティクルの流れ：尾を引く光の点が、うねる流線に沿って画面を横切ります（データの流れ、信号）。パラメーター：n、speed、amp=うねりの幅、waves=横方向の波の数、tail=尾の長さ、colors、reverse=1 で逆向き |

### 3D (12)

本物の 3D シーン（three.js）です。別ファイル `vendor/three-fx.min.js` と `fx-3d.js` の読み込みが必要です。`data-make="stage3d"` のステージに書きます。シーンにオブジェクトを置くエフェクトと、カメラを動かすエフェクト（`cam3d`、`orbit3d`）があります。オブジェクト共通のパラメーター：`dur`（存在する長さ）、`fade` / `out`（フェードイン・アウトの秒数）、`px` / `py` / `pz`（配置位置）、`s`（全体のスケール）、`seed`。

| 名前 | 動作 / パラメーター |
|---|---|
| `stars3d` | 3D 星空：たくさんの星が空間に散らばり、カメラが動くと遠近の奥行きが出ます。パラメーター：n、r=分布の半径、size、colors |
| `galaxy3d` | 渦巻銀河：数万個のパーティクルが渦巻の腕を作って中心のまわりを回ります。内側ほど速く外側ほどゆっくりです。パラメーター：n、arms=腕の数、r=半径、inner=中心の空き半径、spin=回転速度、twist=腕の曲がり具合、colors（腕ごとに交互）、size、bright |
| `orb3d` | 立体エネルギーボール：本物の照明を受ける金属の三角形の破片でできた球で、核が光ります。散らばった破片が集まって球になることも、弾け飛ぶこともできます。パラメーター：r=半径、detail=分割数（1=80 枚、2=320 枚）、gap=破片の隙間、spin、in=集まる秒数、explode=何秒目に弾けるか、power=弾ける力、color=破片の色、emissive=自発光の色、core=核の色 |
| `tunnel3d` | パーティクルトンネル：パーティクルと光のリングがトンネル状に並び、カメラに向かって押し寄せます（カメラをトンネルの中に置いて奥を向けます）。パラメーター：n、r=トンネルの半径、len=長さ、speed、twist=螺旋の度合い、rings=リングの数（0 でなし）、colors |
| `waves3d` | 波のドットグリッド：ドットでできた広い地面が水面のようにうねります。パラメーター：nx / nz=ドット数、w / d=幅と奥行き、amp=波の高さ、freq=波の密度、speed、c1=低い所の色、c2=高い所の色 |
| `globe3d` | ドットの地球：ドットでできた球体がゆっくり自転し、表面の 2 点の間を光の弧が飛びます（グローバルネットワーク、データ接続）。パラメーター：r=半径、n=ドット数、arcs=光の弧の数、spin、color=ドットの色、arc=光の弧の色 |
| `blackhole3d` | 立体ブラックホール：黒い球体 + 常にカメラを向く光のリング + パーティクルの降着円盤で、カメラがまわりを回れます。パラメーター：r=ブラックホールの半径、n、disk=降着円盤の外側の半径（r の倍数）、speed、c1=内側の色、c2=外側の色 |
| `burst3d` | 立体爆発：数万個のパーティクルが中心から四方八方へ弾け、飛ぶほど遅くなり、強い閃光が一度入ります。パラメーター：n、power=強さ、life=続く秒数、colors |
| `text3d` | 立体パーティクル文字：空間のパーティクルが四方八方から集まり、厚みのある 1 行の文字になります。カメラでまわりを回って見せられます（日本語・英語どちらも使えます）。パラメーター：text、w=シーン内での文字の幅、depth=厚みの層数、start=最初に漂う秒数、conv=集まる秒数、color、n=最大パーティクル数、font、weight、scatter=散らばる半径 |
| `city3d` | 都市：大通りの両側にビルが並び、窓が光り、ビルに輪郭線が入り、道路をヘッドライトが流れ、突き当たりに夕日を置くこともできます。cam3d と組み合わせてカメラで通りを飛びます。通りは -z 方向に伸びます。パラメーター：rows=奥行き方向の列数、cols=片側のビルの数、road=道幅、lit=明かりのついた窓の割合、colors=窓の色、wall=壁の色、edge=輪郭線の色（edge=0 で輪郭なし）、sun=夕日の色（sun=0 でなし）、traffic=0 で車の流れを消す |
| `cam3d` | カメラ移動：今の位置から新しい位置へ飛びながら、視線も新しい目標へ向けます。パラメーター：x / y / z=飛んでいく先、lx / ly / lz=見る先、fov=画角、dur、ease（dur=0 ならその場で切り替え）。書かなかったパラメーターは変わりません |
| `orbit3d` | 周回カメラ：カメラが目標のまわりを回ります。同時に近づいたり上昇したりもできます。パラメーター：turn=回る角度（負の値で逆回り）、from=開始角度（省略すると今の位置から）、r=終了時の目標からの距離、h=終了時の高さ、lx / ly / lz=回る中心、dur、ease |

### 空間 (21)

ワールドキャンバス・カメラ・画像セットの動き。追加で `fx-world.js` を読み込みます。ルート要素に `data-world` を書くと、すべてのシーンが 1 枚の大きなキャンバス上のカメラ位置になり、シーンの切り替えはカメラの移動になります。カメラ系エフェクトは `data-world` が必要ですが、フォーカス系と画像セット系はどのページでも使えます。

| 名前 | 動作 / パラメーター |
|---|---|
| `cam-look` | カメラ位置の中の 1 つの要素にカメラを寄せる（ナレーションがそこに触れたときに使う）。終わったら `cam-home` で戻す。パラメータ：to（セレクタ。省略時は自分自身）、fit（画面に占める割合。既定 0.6）、max（最大拡大率。既定 1.4）、dur |
| `cam-home` | カメラを現在のカメラ位置の全景に戻す（`cam-look` の後に使う）。パラメータ：dur |
| `cam-wide` | カメラを引いてキャンバス全体を見せる（冒頭の俯瞰、最後の振り返り）。`cam-wide@0` と書くと全体俯瞰から始まり、`cam-home` で寄っていく。パラメータ：dur |
| `wake` | 先に置いて後から語る：要素は最初から画面にあるが暗く、言及されたときに点灯する。パラメータ：dim（点灯前の明るさ。既定 0.3）、solid=1（半透明にせず暗く・無彩色にする。カードが背景を透かさない。ステージモードでは自動で有効） |
| `zoom-here` | その場で拡大：グループの中から 1 つを選び、元の位置でそのまま拡大し、残りは 30% まで薄くして後ろへ下げる。パラメータ：s（倍率。既定 2.4）、hold（何秒後に自動で戻すか。省略時は戻さない）、dim |
| `push-back` | 背景ぼかし：新しい内容が現れるとき、元のレイヤー全体を後ろへ押す（94% に縮小、4px ぼかし、55% まで暗く）。パラメータ：s、blur、dim、dur |
| `bring-front` | `push-back` で後ろに下げたレイヤーを手前に戻す |
| `depth` | 被写界深度レイヤー：子要素に `data-depth="near/mid/far"` を書くと、フォーカスから遠いほどぼける（0 / 4 / 8px）。レイヤーごとに視差でゆっくり動く。パラメータ：focus（ピントを合わせる層。既定 mid）、shift（視差の量。既定 40）、blur |
| `rack-focus` | フォーカス送り：ピントの合う層を別の層に移す（`depth` と併用）。パラメータ：to=near/mid/far、dur |
| `bg-tint` | 背景色の切り替え：画像が変わるとき、背景全体をその画像の主色に変え、切り替わったことを一目で伝える。パラメータ：color（`reset` で元の色に戻す）、dur（既定 0.5）、to（色を変える要素。既定はキャンバス全体） |
| `skeleton` | スケルトン表示：複雑な画面をまず灰色のスケルトンで出し、読む順に 1 ブロックずつ実際の内容で埋める。コンテナに書き、子要素が各ブロックになる。パラメータ：gap（ブロック間隔。既定 0.15）、hold（スケルトンを見せておく時間。既定 0.5） |
| `deal-in` | カード配り：画像を同時に出さず、1 枚ずつ弧を描いて所定の位置へ飛ばす。`each:` と併用。パラメータ：stagger（既定 0.1）、from=left/right、dur |
| `drop-gather` | 落として集める：画像の山が上から落ち、扇形に集まり、話す数枚だけ残して残りは画面外へ落ちる。コンテナに書く。残す子要素に `data-keep` を付ける（付けなければ先頭の keep 枚）。パラメータ：keep（既定 3） |
| `fly` | 奥行きトンネル：カメラが奥へ飛び続け、通過した 1 枚は拡大してぼけ、次の 1 枚が奥からフェードインする。`data-make="tunnel"` に書く。パラメータ：to（何枚目まで飛ぶか。1 から数える）、each（1 枚あたりの秒数。既定 0.7） |
| `helix-spin` | らせん円筒：カメラが画像の円筒の周りを回る。最初は速く、次第に遅く、その後は一定速度でゆっくり回る。`data-make="helix"` に書く。パラメータ：turn（速く回る角度。既定 300）、dur（速く回る時間。既定 2.4）、slow（その後の毎秒の角度。既定 10） |
| `flip-to` | 3D フリップボード：パネルが 1 枚ずつ上へ送られ、横軸を中心に大きく回転する。正面を向いた 1 枚はフルカラー、残りは 30% まで暗くなる。`data-make="flipboard"` に書く。パラメータ：i（何枚目へ。1 から数える）、dur |
| `pick` | 持ち上げて道を空ける：扇形に並んだ画像のうち、話題の 1 枚が持ち上がって拡大し、左右が脇へよける。ほかの画像も見えたまま。`data-make="fan"` に書く。パラメータ：i（何枚目。1 から数える。0 = すべて戻す）、s（既定 1.3）、gap（よける距離。既定 90）、lift（既定 70） |
| `slice-to` | スライス切り替え：新しい画像を数本の帯に切り、下から 1 本ずつ伸ばす。番号ラベルも同時にめくれる。`data-make="slices"` に書く。パラメータ：i（何枚目へ。1 から数える。省略時は次の 1 枚）、stagger（既定 0.07）、dur |
| `road-walk` | 画面の中へ歩く：カメラが地面すれすれに道を奥へ進み、到達したステップが点灯する。`data-make="road"` に書く。パラメータ：i（何ステップ目まで。1 から数える）、dur |
| `bignum` | チャプターカードの登場：大きな数字が先に降り、タイトルが続いてスライドする。`data-make="bignum"` に書く。パラメータ：dock（何秒後に左上の小さなラベルへ縮むか。省略時は縮まない） |
| `segment` | 進行ラインを i 番目の区間まで進める（1 から数える）。`data-make="segments"` に書き、通常は常駐オーバーレイ層に置く |

### ステージ (10)

「手前にプレゼンター、後ろに場面、情報はピクチャー・イン・ピクチャー」という解説アニメ向けの舞台パーツ。追加で `fx-stage.js` を読み込みます。場面の背景（`backdrop`）、画面つきデバイス（`device`）、全画面イラストの差し込み、選択パネル（`menu`）、全身のミニキャラ（`mini`）。`data-world` なしで使います：シーンはハードカット、背景を変えるときは `data-in="mosaic"`。

| 名前 | 動作 / パラメーター |
|---|---|
| `dither-in` | 画面が 2 色のピクセルノイズからくっきりへ解像する（古いゲーム機の起動、信号がつながる瞬間）。data-make="backdrop" に書く。data-dither があればピクセル画で、なければ元の画像で止まる。パラメータ：dur（既定 1.6） |
| `light-sweep` | 柔らかい斜めの光が一度だけ画面を横切る（結論、製品、ランキングが出る瞬間の高級感）。シーン、背景、任意の要素に書く。パラメータ：dur（既定 1.6）、angle（光の角度、既定 115）、color、strength（0〜1、既定 0.5） |
| `light-leak` | フィルムの光漏れ：暖かい光が片側から差し込んで引いていく（回想、転換、感情の山場）。シーンか背景に書く。パラメータ：dur（既定 4）、tone=warm/cool、strength（0〜1、既定 0.9） |
| `cutaway` | イラスト差し込み：全画面の絵がハードカットで入り、ごくゆっくり寄り、時間が来たらハードカットで戻る。その間アクターを覆い、字幕とチャプターバーは残る。シーン内の `<img>` に書く。パラメータ：dur（表示時間。1.2–2.5 秒）、zoom（既定 1.07）、x / y（同時に動かす割合）、under=1（アクターの下に置く：プレゼンターが絵の上で話し続ける。全画面の録画向き） |
| `screen-to` | 画面内カット：デバイス画面の中身を i 番目へハードカットする（1 から数える。省略時は次）。ごく軽いフラッシュ付き。`data-make="device"` に書く |
| `dive` | 画面に飛び込む：デバイスがカメラに向かって拡大し、その画面がフレーム全体を埋める（次のシーンの背景に同じ絵を使うと、画面の中へ入ったように見える）。`data-make="device"` に書き、通常はシーンの最後 0.5 秒に置く。パラメータ：dur（既定 0.5） |
| `frames` | 連番フレーム再生：一連の静止画を動画として再生する（ゲーム画面、操作の録画）。フレーム単位で確定的。要素に `data-frames="dir/f_%03d.jpg" data-n="枚数"` を書く。パラメータ：fps（既定 15）、dur（既定はシーンの終わりまで。ループ） |
| `choose` | 選択する：選択パネルのハイライトが i 番目へ移動し、チェックが付く。`data-make="menu"` に書く。パラメータ：i（1 から数える。`2/4/1/3` と書くと連続で素早く選ぶ）、every（連続選択の間隔。既定 0.28 秒） |
| `mini-walk` | ミニキャラが歩く：2 枚の歩行フレームを交互に出しながら横移動し、着いたら立ち止まる。`data-make="mini"` に書く。パラメータ：x（距離。負の値で左へ）または to=#ターゲット、dur、step（1 歩の秒数。既定 0.16） |
| `mini-pose` | ミニキャラの動作を切り替える（手を挙げる、喜ぶ、座るなど）。軽い伸縮付き。`data-make="mini"` に書く。パラメータ：name（`data-poses` に書いた動作名）、hold（何秒後に立ちポーズへ戻るか。省略時は保持） |

### 手描き (5)

手描きの注釈。`fx-ink.js` を追加で読み込みます。線は少し揺れ、書き順どおりに描かれ、描き終わると毎秒 10 回ポーズを変えて「ボイル」します。注釈したい要素に書きます。共通パラメータ：`color`（既定はスキンのアクセント色）、`w`（線幅）、`dur`、`boil=calm|lively|off`。

| 名前 | 動作 / パラメーター |
|---|---|
| `ink-circle` | 要素を手描きの丸で囲む（左上から描き始め、少し描きすぎて終わる）。横にひとこと書ける。パラメータ：label（横に書く文字）、at=right/left/top/bottom（文字の位置）、pad（要素よりどれだけ大きく、既定 18）、color、w、dur |
| `ink-underline` | 手描きの線：波線の下線、取り消し線、左括弧。パラメータ：kind=squiggle/double/strike/bracket、color、w、dur |
| `ink-box` | 要素を手描きの四角で囲み、左上にラベルを付けられる。パラメータ：label、pad（既定 14）、color、w、dur |
| `ink-arrow` | この要素から別の要素へ手描きの矢印を描く。パラメータ：to=#対象（または dx / dy でピクセル指定）、tx / ty（対象のどの位置を指すか、0〜1。省略すると対象の枠で起点にいちばん近い点）、curve=straight/gentle/swoop、side=1/-1（曲がる向き）、gap（両端の余白）、color、w、dur |
| `ink-mark` | Vox 風の注釈：文中の一語にマーカーを引き、同時に細い線を伸ばして短い注記を出す。パラメータ：word（印を付ける語。省略すると要素全体）、style=highlight/circle/underline/scribble、note（注記。省略すると印だけ）、color、dur |

### チャットとコード (8)

AI の動画でよく出てくる画面。`fx-chat.js` を追加で読み込みます：チャット画面（`data-make="chat"`）、プロンプト入力、ターミナル（`data-make="terminal"`）、コード（`data-make="code"`）、エージェントのカーソル（`data-make="agent"`）。本物のソフトと同じ間合いで動きます。

| 名前 | 動作 / パラメーター |
|---|---|
| `msg` | チャットのメッセージが 1 件、送り手の角から 0.12 秒で現れる。data-make="chat" に書く。パラメータ：i（何件目、1 から） |
| `typing` | 「入力中…」の吹き出し：i 件目の位置に 3 つの点が現れ、dur 秒後に消える（ふつうは同じ件の msg / stream-in が続く）。data-make="chat" に書く。パラメータ：i、dur（既定 1.2） |
| `stream-in` | AI の回答がトークンの間合いでかたまりごとに現れ、新しい文字は灰色から 0.27 秒で本来の色になる。data-make="chat"（i 件目）または任意のテキストに書く。パラメータ：i、speed（既定 1） |
| `prompt` | 人が打つように入力欄に打ち込む：1〜3 文字ずつ、不揃いな間で。打っている間はキャレットが点滅し、打ち終わると点灯したまま。文字だけの要素に書く（class="fx-prompt" で入力欄の見た目）。パラメータ：fix（先に打ち間違える語。消して打ち直す）、glyph（行頭の記号、既定 ›、none で非表示）、speed |
| `run` | ターミナルでコマンドを実行：打ち込み、一拍おいて、出力を 1 行ずつ表示し、最後に新しいプロンプト。data-make="terminal" に書く。パラメータ：every（出力行の間隔、既定 0.22 秒）、speed（入力速度） |
| `diff` | コードの変更：削除行は赤くなって畳まれ、追加行は緑で開く。data-make="code" に書く（行頭「- 」が削除、「+ 」が追加） |
| `code-focus` | コードの 1 行をハイライトの帯がなぞり、他の行は暗くなる。data-make="code" に書く。パラメータ：i（最終的に表示される行番号、1 から。0 ですべて戻す） |
| `agent-go` | エージェントのカーソル：名札にこれからすることを打ち出し、カーソルが対象へ移動して波紋付きでクリックする。data-make="agent" に書き、続けて何度でも書ける。パラメータ：to=#対象（省略でその場）、say（名札の文字）、click=0（クリックしない）、done=1（完了のチェック） |

### 図解 (3)

関係図。`fx-diagram.js` を追加で読み込みます：包囲（`data-make="surround"`）と中心から放射（`data-make="hub"`）。中心は動かず、周りだけが動きます。

| 名前 | 動作 / パラメーター |
|---|---|
| `surround-in` | 中心が落ち着いたあと、周りのチップが 1 つずつ集まる。close=1 ならそのあと一斉に内側へ寄り、周囲が暗くなる。data-make="surround" に書く。パラメータ：gap（チップの間隔、既定 0.3 秒）、close=1 |
| `overwhelm` | 大量のチップが四方から加速しながら押し寄せ、動かない中心の周りに詰まる（情報過多、やることが多すぎる）。data-make="surround" に書く（ラベルは data-chips を繰り返し使う）。パラメータ：n（8〜24、既定 16）、intensity（0.5〜2：大きいほど近く速く）、dur（押し寄せる時間、既定 2.2） |
| `hub-node` | 放射図の i 番目のノード：中心から線が伸び、ノードが点灯する。data-make="hub" に書き、ナレーションがそのノードに来たら 1 つずつ。パラメータ：i（1 から） |

### 図形 (3)

図形の変形、パスに沿った移動、弾むような揺れ。`fx-shape.js` と `vendor/gsap-plugins/` の GSAP プラグイン（MorphSVG・MotionPath・CustomEase・CustomWiggle、現在は商用も無料）を読み込みます。内蔵図形 12 種（`data-make="shape"`）：check cross circle square triangle star heart bolt arrow-up arrow-down play bulb。

| 名前 | 動作 / パラメーター |
|---|---|
| `shape-morph` | 図形がなめらかに別の図形へ変わる（✗ が ✓ に、円が星に…）。色も同時に変えられる。data-make="shape" か、<path> を 1 つ持つ svg に書く。パラメータ：to（内蔵図形名、または別のパスの #id）、color、dur（既定 0.6）。MorphSVGPlugin が必要 |
| `path-move` | SVG のパスに沿って動き、向きもパスに合わせて回る（紙飛行機、データパケット、配送ルート）。動かす要素に書く。パラメータ：path=#パスの id（必須）、dur（既定 1.6）、rotate=0（向きを変えない）、draw=1（パスも同時に描く）、from / to（パスのどの区間か、0〜1）。MotionPathPlugin が必要 |
| `wiggle` | 弾むように揺れて止まる（名指しされた、つっこまれた、エラーのとき）。パラメータ：n（揺れの回数、既定 6）、amp（角度、既定 8）、dur（既定 0.8）、prop=rotation/x。CustomEase + CustomWiggle が必要 |

### サウンド (1)

効果音レイヤー。`fx-sound.js` を追加で読み込みます。読み込むと**すべてのエフェクトに音が付きます**（ポップインは「ポン」、着地は「ドン」、スライドは「シュッ」、トランジションは「フワッ」、タイピングは「カタカタ」…）。音はすべてコードで合成し、音声ファイルは使いません。どのエフェクトも `sfx=音の名前` で別の音に、`sfx=none` で無音にできます。下のエフェクトは、画面に動きがない場所に音だけを置くためのものです。プレビューでは URL に `?play` を付けると聞こえます。書き出しは `node lib/sfx.mjs <プロジェクト>` で効果音トラックを生成します。

| 名前 | 動作 / パラメーター |
|---|---|
| `sfx` | 効果音を単独で鳴らす（画面に動きがなくても鳴る）。パラメータ：kind=pop/tick/click/swish/whoosh/thump/snap/hit/ding/chime/blip/rise/fall/buzz/sparkle/zap/glitch/paper/flap/card/rumble/swellup/shimmer/type/roll/step/dots、vol（音量の倍率）、pitch（音高の倍率）、dur（持続する音の秒数） |

### コンポーネント (4)

`data-make` で生成したコンポーネントと組み合わせて使います。

| 名前 | 動作 / パラメーター |
|---|---|
| `step` | ステップナビの切り替え：data-make="steps" と併用します。i 番目のピル（1 始まり）を点灯し、残りを消します |
| `chapter` | チャプター進捗バー：data-make="chapters" と併用します。ハイライトブロックが第 i チャプター（1 始まり）へスライドします |
| `check` | チェックリストのチェック：.fx-check コンポーネントと併用します。チェックマークが描かれ、文字がくっきりします |
| `toggle` | スイッチ切り替え：data-make="switches" と組み合わせ、i 番目（2/3/5 の一括指定可）を ON(on=1) / OFF(on=0) に切り替えます。パラメーター：i、on=0/1、stagger |

### トランジション (23)

**後ろ側の**シーンに書きます：`<section class="scene" data-in="blur-cross(dur=0.5)">`。

| 名前 | 動作 / パラメーター |
|---|---|
| `cut` | ハードカット（デフォルト）。最もよく使われ、テンポが最も速くなります |
| `fade` | クロスフェード |
| `blur-cross` | ぼかしクロス：前のショットがぼけてフェードアウトし、次のショットがぼけた状態からくっきりします |
| `zoom-through` | ズームスルー：前のショットが拡大して画面外へ飛び出し、次のショットが小さい状態から拡大して収まります |
| `push` | プッシュ：新しいシーンが古いシーンを押し出します。パラメーター：dir=left/right/up/down |
| `wipe` | ワイプ：新しいシーンが一方向から覆いかぶさります。パラメーター：dir |
| `iris` | アイリス：新しいシーンが一点から全画面へ広がります。パラメーター：x、y（パーセント） |
| `flash` | 白（または任意の色）へのフラッシュ切り替え：重要な一文やチャプターの冒頭に使います。パラメーター：color |
| `dip` | ブラックアウト：いったん暗くなってから明るくなります（話題の切り替え）。パラメーター：color |
| `pixelate` | ピクセル溶解：ブロックがランダムな順で画面を覆い、その後散ります（ピクセル風のシーン切り替え）。パラメーター：cols、color |
| `paper-slide` | 紙の引き出し：新しい紙が片側から滑り込んで古い紙に重なり、縁に影が付き、古い紙は少し暗くなります。パラメーター：dir=left/right/up/down |
| `tear` | 紙を破る：新しい画面がギザギザの破れ目に沿って片側から現れます（切り紙風のシーン切り替え）。パラメーター：dir=right/left/down/up、jag、teeth |
| `glitch-cut` | グリッチカット：新しい画面が赤青のズレを伴って数回ちらつき、そのあと安定します（テック感のある切り替え） |
| `open` | 扉が開く：新しい画面が中央の細い隙間から左右（または上下）へ開きます。パラメーター：dir=x（左右に開く）/y（上下に開く） |
| `shatter` | 3D シャッター崩壊：画面が 3D の破片に割れて回転落下し、次のシーンが現れます。パラメーター：cols、colors=色1/色2、dur、seed |
| `diagonal-split` | 斜めスラッシュ分割：光る斜線が画面を切り裂き、左右に開いて次のシーンを現します。パラメーター：angle、color、dur |
| `blinds` | ブラインド反転：新しいシーンを短冊状に分割し、波のように順番に開きます。パラメーター：n=本数、dir=x/y、dur |
| `crt-off` | レトロ CRT 切替：前の画面を明るい走査線に収束させてから次の画面を閃光とともに開きます。パラメーター：color、dur |
| `portal-spin` | 渦巻きスピン：前の画面が回転しながら中心へ吸い込まれ、新しい画面が回転ブラーから定まります。パラメーター：deg、dur |
| `halftone` | コミック網点ウェーブ：ドット配列が対角線状に拡大して画面を覆い、収縮して次のシーンを現します。パラメーター：cols、color、dur |
| `cam-to` | ワールドキャンバス専用（既定）：カメラが次のカメラ位置へ斜めに移動する。少し引いてから寄り、ゆっくり→速く→ゆっくり。パラメータ：dur（0.6–0.9）、arc（途中で余分に振る角度。既定 8）、pull（引きの量。既定 0.07） |
| `cam-jump` | ワールドキャンバス専用：カメラが次のカメラ位置へ直接飛ぶ（ハードカット）。大きな章の切り替えにだけ使う |
| `mosaic` | モザイク場面転換：紙色のブロックがおおよそ上から順にランダムに画面を覆い、ランダムに外れて新しい場面を見せる。ブロックはアクターと常駐レイヤーの下にあるので、プレゼンターは隠れない（章や背景の切り替えに使う）。パラメータ：cols（1 行のブロック数。既定 24）、color、dur、seed |
<!-- CATALOG:END -->
