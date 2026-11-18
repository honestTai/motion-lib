# motion-lib

[简体中文](README.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · **日本語**

**HTML → 動画のための宣言型モーションライブラリです。** 要素に `data-fx="エフェクト名@秒数"` と 1 行書くだけで、トーク系の解説動画やテック解説動画でよく見るモーションが作れます。あとは [HyperFrames](https://hyperframes.heygen.com) でフレームごとに MP4 へレンダリングします。

> **v1.5 の新機能**：オプションの真 3D アニメアバターモジュール `fx-vrm.js`（`@pixiv/three-vrm` MIT ベース：標準 `.vrm` モデルや `.vrma` モーションを読み込み、MToon トゥーン輪郭描画、解析的 2 ボーン 3D IK `FX.ik3d`、6 節脊椎ウェーブ、自動鎖骨連動、13 種の全身プレゼンポーズ、5 母音リップシンク `aa/ih/ou/ee/oh`、2× スーパーサンプリング、決定論的 60Hz `SpringBone` 髪・スカート物理を搭載。CC0 パブリックドメインのサンプルモデル `assets/shino.vrm`・`assets/vita.vrm` を同梱）。
>
> **v1.4 の新機能**：オプションの 2D ソフトボーン＆ラバーホースモジュール `fx-rig.js`（2 ボーン IK `FX.ik2` + 継ぎ目のない連続ベジェ袖 `FX.hose` + 任意の SVG キャラ向け `[data-bone]` / `[data-follow]`）+ トランジション 6 種（`shatter` `diagonal-split` `blinds` `crt-off` `portal-spin` `halftone`）+ エフェクト 6 種（`circuit` `overload` `scan` `callout` `scatter-out` `toggle`）+ `switches` コンポーネント。
>
> **v1.3 の新機能**：オプションの 3D モジュール `fx-3d.js`（本物の 3D シーン：銀河、エネルギーボール、トンネル、ブラックホール、都市の飛行、ドットの地球、立体パーティクル文字など 12 種のエフェクト。グロー効果とプログラムできるカメラ付き）。
>
> **v1.2 の新機能**：オプションのパーティクルモジュール `fx-particles.js`（パーティクルエフェクト 8 種：星空、星雲、渦、ブラックホール、エネルギーボール、爆発、パーティクル文字、パーティクルの流れ）と、5 つ目のスキン `theme-space`（深宇宙パーティクル）。
>
> **v1.1 の新機能**：エフェクト 40 種 + トランジション 4 種（`paper-slide` `tear` `glitch-cut` `open`）+ コンポーネントジェネレーター 5 個（`circle-text` `retro-grid` `papercut` `hills` `torn`）、新カテゴリー 2 つ（テキスト・切り紙）、4 つ目のスキン `theme-paper`（切り紙コラージュ）。animate.css、Magic UI、React Bits にインスピレーションを受けています。末尾の「クレジット」をご覧ください。

[![motion-lib プロモーション動画](promo/cover.jpg)](promo/motion-lib-promo.mp4)

> 上のプロモーション動画は、このライブラリで作られています。ソースは [`promo/index.html`](promo/index.html) です。

<!-- STATS:START -->
| | 数 |
|---|---|
| エフェクト | **153** 種（入場 26 · 退場 10 · 強調 41 · テキスト 9 · データ 6 · カメラ 11 · キャラクター 16 · 切り紙 10 · パーティクル 8 · 3D 12 · コンポーネント 4） |
| トランジション | **20** 種 |
| コンポーネントジェネレーター | **17** 個（`bars` `wave` `steps` `chapters` `ring` `wall` `dust` `line` `pixels` `circle-text` `retro-grid` `papercut` `hills` `torn` `switches` `space` `stage3d`） |
| スキン | **5** 種（白紫テック · 黒金シネマ · レトロピクセル · 切り紙コラージュ · 深宇宙パーティクル） |
<!-- STATS:END -->

## なぜ使うのか

HTML で動画を作るとき、難しいのはレイアウトではなくモーションです。

- **レンダラーは「N フレーム目へシーク → スクリーンショット」という方式です。** CSS アニメーション、`setTimeout`、`Math.random` はレンダラーの制御外のため、出力が動かなかったり、実行のたびに変わったりします。
- GSAP のタイムラインを手書きすると、1 分の動画でも数百個の時間点を計算する必要があります。

motion-lib はすべてのエフェクトを**一時停止状態の 1 本の GSAP タイムライン**に並べます。書くのは「どの要素に、どのエフェクトを、何秒目に」だけです。

```html
<h1 data-fx="blur-rise-in@0.2">トレンド作りで一番難しいことは？</h1>
<b  data-fx="count@0.6 marker@1.6">7,000</b>
<ul data-fx="each:pop-in@1(stagger=0.1)"> <li>チップ</li><li>計算資源</li><li>大規模モデル</li> </ul>
```

- **フレーム単位でシーク可能**：どのフレームへ飛んでも、順次再生したときと同じ映像になり、レンダリング結果は毎回同じです。
- **ランダムも再現可能**：ランダムな表現（パーティクル、文字化け、波形）には、必ずシード付きの `FX.rand(seed)` を使います。
- **ネットワーク不要**：GSAP とフォントはリポジトリ内に同梱されています。
- **ビルド不要**：`fx.js` と `fx.css` が 1 つずつあるだけで、npm もバンドラーも要りません。

## ディレクトリ構成

```
motion-lib/
├── fx.js            ライブラリ本体：エフェクト、トランジション、コンポーネントジェネレーター、字幕、プレビュープレーヤー
├── fx.css           基本スタイル、コンポーネントのスタイル、5 つのスキン
├── fx-particles.js  オプションのパーティクルモジュール（宇宙、渦、ブラックホール、爆発、パーティクル文字）
├── fx-3d.js         オプションの 3D モジュール（本物の 3D シーン、グロー、プログラムできるカメラ。three.js が必要）
├── fx-rig.js        オプションの 2D ソフトボーン＆連続ベジェスキンモジュール（任意のカスタム SVG キャラ対応）
├── fx-vrm.js        オプションの 3D VRM アニメアバターモジュール（FX.ik3d、MToon トゥーン、5 母音口形、髪揺れ物理）
├── assets/          CC0 1.0 パブリックドメインの 3D VRM サンプルモデル（shino.vrm、vita.vrm）
├── fonts/           YouSheBiaoTiHei、Smiley Sans、Fusion Pixel、ZCOOL KuaiLe（ライセンスは fonts/README.md）
├── vendor/          GSAP 3.15、three.js r187（three-fx.min.js）、@pixiv/three-vrm 3.5（three-vrm.min.js）
├── new-project.sh   ライブラリを動画プロジェクトに組み込む（更新にも使う）
├── chrome-tall.sh   レンダリング用の Chrome ラッパー（下部の字幕が切れるのを防ぐ）
├── gen-readme.mjs   このファイルの数量表とエフェクトカタログを自動生成（node gen-readme.mjs）
├── demo/            デモページ：6 シーン、3 つのスキンすべてを使用
├── promo/           プロモーション動画のソース + 完成動画
└── examples/        5 つのスキンごとに 1 本ずつの完全なサンプル + 本物の 3D のサンプル + まとめ動画
```

## 動作環境

- Node.js 18 以上（`npx hyperframes` を使用）
- FFmpeg
- Google Chrome（macOS のデフォルトの場所。それ以外の場所にある場合は環境変数 `REAL_CHROME` を設定）
- 初回の `npx hyperframes` 実行時に CLI が自動でダウンロードされます

## クイックスタート

**1. プロジェクトを作る**

```bash
mkdir my-video
./new-project.sh my-video        # fx.js / fx.css / フォント / GSAP を my-video/lib/ にコピー
```

> HyperFrames はプロジェクトディレクトリ内のファイルしか読めないため、ライブラリは `../` で参照するのではなく、プロジェクトに**コピー**します。ライブラリが更新されたら、同じプロジェクトでこのコマンドをもう一度実行してください。
> このリポジトリの `demo/` と `promo/` も同様で、初めて開く前に `./new-project.sh demo`、`./new-project.sh promo` を実行してください。

**2. `my-video/index.html` を書く**

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="lib/fx.css">
  <script src="lib/vendor/gsap.min.js"></script>
  <script src="lib/fx.js"></script>
</head>
<body>
<div id="root" class="theme-violet" data-composition-id="main" data-width="1920" data-height="1080">

  <section class="scene dark center" data-d="3.5">
    <h1 class="t-title" data-fx="mask-rise@0.2">全自動編集 <span class="accent">Skill</span></h1>
    <p class="t-body" data-fx="rise-in@0.6 marker@1.4">この動画を見れば、あなたにもできます</p>
  </section>

  <section class="scene light" data-d="4" data-in="blur-cross">
    <div class="abs" style="left:200px;top:300px;width:1200px;height:400px"
         data-make="bars" data-values="3,8,21,40,26,12" data-hi="4"
         data-fx="each:grow-y@0.3(stagger=0.05)"></div>
  </section>

</div>
<script>
  FX.subtitles([[0.2, 3.4, 'この動画を見れば、あなたにもできます'], [3.5, 7.4, '再生は{公開後}数時間に集中します']], { style: 'pill' });
  FX.build();
</script>
</body>
</html>
```

> パーティクルエフェクトを使うときは、`fx.js` の後ろに 1 行追加します：`<script src="lib/fx-particles.js"></script>`（`new-project.sh` が `lib/` にコピー済みです）。
>
> 3D エフェクトを使うときは、`fx.js` の前後にスクリプトを 1 つずつ追加します。下の「3D シーン」の節を参照してください（`new-project.sh` が `fx-3d.js` と `vendor/three-fx.min.js` を `lib/` にコピー済みです）。


**3. プレビュー、フレームの書き出し、レンダリング**

```bash
cd my-video
open "index.html?play"                       # ブラウザでプレビュー：スペースで再生、←/→ で 1 フレームずつ、↑/↓ でシーン間ジャンプ
npx hyperframes snapshot --at 1,3,5          # 数フレームを書き出して確認
HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" \
  npx hyperframes render -o out.mp4 --experimental-fast-capture=false
```

> レンダリング時は必ず `chrome-tall.sh` を指定してください。この環境のフル版 Chrome をヘッドレスで動かすと、表示可能な高さがウィンドウより約 90px 低くなり、動画の下部（字幕）が切れてしまいます。このスクリプトはウィンドウを高くします。

## サンプル動画

5 つのスキンそれぞれに、完全なサンプルを 1 本ずつ用意しています（モーションのみ、ナレーションなし）。ソースは対応するディレクトリにあり、そのまま改造して使えます。

| スキン | サンプル | ソース |
|---|---|---|
| 白紫テック `theme-violet` | [![violet](examples/violet/cover.jpg)](examples/violet/violet.mp4) | [`examples/violet/index.html`](examples/violet/index.html) |
| 黒金シネマ `theme-gold` | [![gold](examples/gold/cover.jpg)](examples/gold/gold.mp4) | [`examples/gold/index.html`](examples/gold/index.html) |
| レトロピクセル `theme-pixel` | [![pixel](examples/pixel/cover.jpg)](examples/pixel/pixel.mp4) | [`examples/pixel/index.html`](examples/pixel/index.html) |
| 切り紙コラージュ `theme-paper` | [![paper](examples/paper/cover.jpg)](examples/paper/paper.mp4) | [`examples/paper/index.html`](examples/paper/index.html) |
| 深宇宙パーティクル `theme-space` | [![space](examples/space/cover.jpg)](examples/space/space.mp4) | [`examples/space/index.html`](examples/space/index.html) |
| 本物の 3D シーン `fx-3d.js` | [![three](examples/three/cover.jpg)](examples/three/three.mp4) | [`examples/three/index.html`](examples/three/index.html) |

6 本をまとめたもの：[`examples/showreel.mp4`](examples/showreel.mp4)。

## 書き方

### シーン `<section class="scene">`

1 つのシーンは 1 つのショットです。シーンは順番に前後がつながります。

| 書き方 | 意味 |
|---|---|
| `data-d="4"` | 長さ 4 秒 |
| `data-t="12.5"` | 開始時刻を指定（省略すると直前のシーンに続く） |
| `data-in="blur-cross(dur=0.5)"` | このシーンへ入るときのトランジション。「トランジション」を参照 |
| `class="scene dark"` / `"scene light"` | 単一のシーンだけ暗い / 明るい背景に切り替え |
| `class="scene overlay"` | オーバーレイ：順序の時間を占有せず、他のシーンと同時に表示（コーナーバッジ、常駐のプログレスバーなど） |

ルート要素には `data-composition-id="main"`、`data-width`、`data-height` が必要です。総再生時間は自動で計算されます。

### エフェクト `data-fx="[ターゲット:]名前@時間(パラメーター)"`

1 つの要素に複数のエフェクトを、スペース区切りで書けます：`data-fx="rise-in@0.2 pulse@1.5 fade-out@-0.3"`。

| 項目 | 書き方 | 意味 |
|---|---|---|
| 時間 | `@1.2` | シーン開始から 1.2 秒後 |
| | `@+0.3` | 同じ要素の直前のエフェクトより 0.3 秒後 |
| | `@-0.4` | シーン終了の 0.4 秒前（退場用） |
| ターゲット | （省略） | 要素自身 |
| | `each:` | 各子要素に、自動で時間差をつけて適用（カード群、リスト、棒グラフ） |
| | `chars:` / `words:` / `lines:` | 1 文字 / 単語 / 行（`<br>` 区切り）に分割してから適用 |
| パラメーター | `dur=0.8` | 長さ（秒） |
| | `ease=spring` | イージング。下の表を参照 |
| | `stagger=0.1` | 時間差の間隔（`each:` / `chars:` と併用） |
| | `order=center` | 時間差の順序：`start` `end` `center` `edges` |
| | その他 | 各エフェクト固有のパラメーター。「エフェクトカタログ」を参照 |

**イージングのエイリアス**

| エイリアス | 実体 | 手触り |
|---|---|---|
| `out`（デフォルト） | `power3.out` | 素早く始まり、ゆっくり止まる。最も汎用的 |
| `soft` | `power2.out` | やわらかい |
| `snap` | `expo.out` | 一気に定位置へ飛び込み、そのあとゆっくり落ち着く |
| `sharp` | `power4.out` | out よりキレがある |
| `inout` | `power3.inOut` | 両端がゆっくりで中間が速い。カメラワーク用 |
| `in` | `power2.in` | だんだん速くなる。退場用 |
| `spring` | `back.out(1.7)` | わずかにオーバーシュートして戻る |
| `bounce` | `back.out(2.8)` | はっきりとオーバーシュートする |
| `elastic` | `elastic.out(1,0.55)` | バネ |
| `drop` | `bounce.out` | 着地で弾む |
| `linear` | `none` | 等速 |
| `pixel` | `steps(5)` | 階段状（ピクセル風） |

GSAP の元の名前を直接書くこともできます。例：`ease=power4.out`、`ease=steps(8)`、`ease=elastic.out(1,0.5)`。

### コンポーネントジェネレーター `data-make="名前"`

繰り返しの多い DOM はライブラリに生成させ、対応するエフェクトと組み合わせます。

| 名前 | 属性 | 組み合わせるエフェクト | 用途 |
|---|---|---|---|
| `bars` | `data-values` `data-labels` `data-hi="2,3"` `data-max` | `each:grow-y` | 棒グラフ / ヒストグラム |
| `line` | `data-values` `data-w` `data-h` `data-smooth` | `draw` | 折れ線 / 曲線 |
| `ring` | `data-size` `data-stroke` `data-dash` | `ring(to=0.7)` | リング進捗、カウントダウン |
| `wave` | `data-n` `data-seed` | `each:grow-y`、`wave-live` | 音声波形 |
| `steps` | `data-labels="企画,原稿,ナレーション"` | `step(i=2)` | ステップナビのピル |
| `chapters` | `data-labels` | `chapter(i=3)` | 上部のチャプター進捗バー |
| `pixels` | `data-text="SKILL?"` `data-size` `data-colors` | `each:pixel-in(order=random)` | 5×7 ドットマトリクスのブロック文字 |
| `wall` | `data-cols` `data-rows` `data-seed` | `drift` | 背景のカードの壁 |
| `dust` | `data-n` `data-seed` | `drift`、`float` | 漂うパーティクル |
| `circle-text` | `data-text` `data-r`（半径） | `spin`（文字の輪を回す） | 円形テキスト、バッジ、スタンプ |
| `retro-grid` | `data-cell`（マスの大きさ）`data-color` `data-angle`（傾き） | `bg-scroll`（グリッドを手前へ流す） | レトロな遠近グリッドの背景 |
| `papercut` | `data-size` `data-fold`（折り数：6 / 8 / 12）`data-shape`（`flower` `circle` `square`）`data-color` `data-seed` | `pop-in`、`spin`、`jitter` | 左右対称の切り紙（窓花）。seed ごとに違う模様になります |
| `hills` | `data-layers`（層の数）`data-colors`（奥から手前への色）`data-seed` | `layer-rise`、`parallax` | 重なる紙の山。各層が子要素になります |
| `torn` | `data-edges`（`top,right,bottom,left`、既定は `top,bottom`）`data-depth` `data-teeth` `data-seed` | `stick-on`、`rise-in` | 要素の縁をギザギザの破れ紙にします。`clip-path` は影も切り取るため、影が必要なら外側を `fx-torn-shadow` で包みます |
| `space` | `data-fx` にパーティクルエフェクトを書きます（`fx-particles.js` が必要） | `nebula` `starfield` `vortex` `blackhole` `form-text` などの「パーティクル」系 | キャンバスコンテナ：1 枚のキャンバスで、各パーティクルエフェクトが 1 レイヤー |
| `stage3d` | `data-bloom`（グローの強さ。0 で無効）`data-threshold` `data-radius` `data-bg` `data-fog` `data-fov` `data-cam` `data-look` `data-light` | `stars3d` `galaxy3d` `orb3d` `cam3d` `orbit3d` などの「3D」系 | 3D ステージ：1 枚の WebGL キャンバスと 1 台のカメラ（`three-fx.min.js` と `fx-3d.js` が必要） |

### 字幕

```js
FX.subtitles([
  [開始秒, 終了秒, 'テキスト。{波括弧}の中の語はアクセントカラーになります'],
  …
], { style: 'pill', pop: false });
```

| `style` | 見た目 | 組み合わせるスキン |
|---|---|---|
| `pill` | 黒い角丸のピル + 白文字 | 白紫テック |
| `bar` | 半透明の黒いバー | レトロピクセル |
| `plain` | 白文字 + 影、背景なし | 黒金シネマ |
| `paper` | ベージュの破れ紙の帯 + 濃い色の文字 | 切り紙コラージュ |

`pop: true` にすると、各字幕がふわっと浮かびながら現れます。デフォルトはハードカットで、トーク動画では通常ハードカットを使います。

### パーティクル（fx-particles.js）

キャンバス（Canvas 2D）のパーティクルを使えるオプションモジュールです：星空、星雲、渦、ブラックホール、エネルギーボール、爆発、パーティクル文字、パーティクルの流れ。`fx.js` の後に読み込み、次のように書きます。

```html
<script src="lib/fx-particles.js"></script>

<div class="layer" data-make="space"
     data-fx="nebula@0 starfield@0(speed=0.15) vortex@1 form-text@4(text=HELLO)"></div>
<h1 class="t-hero" data-fx="rise-in@0.6">HELLO, SPACE</h1>
```

- `data-make="space"` 1 つが 1 枚のキャンバスです。その上に書いた各パーティクルエフェクトが 1 レイヤーになり、書いた順に**下から上へ**重なります（上の例では星雲が最下層、文字が最上層）。上の見出しは通常の DOM 要素で、キャンバスの上に重なります。
- 共通パラメーター：`dur`（このレイヤーの長さ。デフォルトはシーン終了まで）、`fade` / `out`（フェードイン・アウトの秒数）、`x` / `y`（中心位置のパーセント）、`seed`。
- 色のリストは `/` で区切ります。例：`colors=#6fd3ff/#ff8a4d`。
- `form-text` には 3 つの時間があります。`dur` はレイヤー全体の長さ、`conv` は集まるのにかかる時間、`start` は最初に漂う時間です。スキンのタイトルフォントから形を取るので、中国語・英語のどちらも使えます。
- キャンバスは通常の要素なので、他のエフェクトもそのまま付けられます。たとえば `to@3(scale=1.3)` でゆっくり寄れます。
- 本体と同じく、フレームごとに再現できます。どのフレームも時間の純粋関数で、乱数にはシードが付きます。なお、遠近は 2D キャンバスで**擬似的に**表現しており、本物の 3D（WebGL）ではありません。本物の 3D が必要な場合は、次の `fx-3d.js` を使ってください。

### 3D シーン（fx-3d.js）

本物の 3D シーン（three.js / WebGL）を使えるオプションモジュールです：3D 星空、渦巻銀河、立体エネルギーボール、パーティクルトンネル、波のドットグリッド、ドットの地球、立体ブラックホール、立体爆発、立体パーティクル文字、都市、それにカメラ用のエフェクトが 2 つあります。**スクリプトは必ずこの順番で読み込んでください。**

```html
<script src="lib/vendor/gsap.min.js"></script>
<script src="lib/vendor/three-fx.min.js"></script>
<script src="lib/fx.js"></script>
<script src="lib/fx-3d.js"></script>

<div class="layer" data-make="stage3d" data-bloom="0.8"
     data-fx="stars3d@0 galaxy3d@0 orb3d@0(in=1.5) orbit3d@0(turn=120,r=13,h=5,dur=6)"></div>
<h1 class="t-hero" data-fx="rise-in@0.6">HELLO, 3D</h1>
```

- `data-make="stage3d"` 1 つが 1 つの 3D ステージ（1 枚の WebGL キャンバスと 1 台のカメラ）です。上の見出しは通常の DOM 要素で、映像の上にそのまま重なります。
- ステージに書くエフェクトは 2 種類あります。**ステージにものを置くもの**（`stars3d` `galaxy3d` `orb3d` `tunnel3d` `waves3d` `globe3d` `blackhole3d` `burst3d` `text3d` `city3d`）と、**カメラを動かすもの**（`cam3d` `orbit3d`）です。パラメーターはエフェクトカタログの「3D」の節にあります。
- `fx-particles.js` との違い：パーティクルモジュールは 2D キャンバスで遠近を**擬似的に**表現するため軽く、他のライブラリも不要です。3D モジュールは本物のカメラ、本物の照明、グローを備え、パーティクルの数を 1〜2 桁多くできますが、three.js（`vendor/three-fx.min.js`、753 KB）に依存します。
- 3D シーンは通常 `theme-space` と組み合わせます。専用のスキンはありません。

**ステージの属性**

| 属性 | 意味 |
|---|---|
| `data-bloom` | グローの強さ。`0` で無効 |
| `data-threshold` | どのくらい明るい部分から光らせるか |
| `data-radius` | グローの広がり |
| `data-bg` | 背景色 |
| `data-fog` | 霧の濃さ（0.003 前後。遠くが薄くなります） |
| `data-fov` | カメラの画角 |
| `data-cam="x,y,z"` | カメラの初期位置 |
| `data-look="x,y,z"` | カメラが最初に向く先 |
| `data-light="0"` | デフォルトの照明を切る |

**カメラ**：カメラは時間の純粋関数です。`cam3d` は今の位置から新しい位置（`x` `y` `z`）へ飛びながら、視線を新しい目標（`lx` `ly` `lz`）へ向けます。`orbit3d` は目標のまわりを回ります（`turn` は回る角度、`r` は終了時の距離、`h` は終了時の高さ）。書かなかったパラメーターは変わりません。**同じ時間帯で `cam3d` と `orbit3d` を重ねないでください。** カメラがどこへ向かうのか決まらなくなります。

**オブジェクト共通のパラメーター**：`dur`（存在する長さ）、`fade` / `out`（フェードイン・アウトの秒数）、`px` / `py` / `pz`（配置位置）、`s`（全体のスケール）、`seed`。

**注意事項**

- グローは、とても明るい文字をにじませます。`text3d` を使うときは `data-bloom` を 0.35〜0.5 に下げてください。
- `stage3d` 1 つが WebGL コンテキスト 1 つです。1 本の動画では 7 つ以内にすることをおすすめします。
- フレームごとに再現できます。パーティクルの位置は GPU 上で「属性 + 時間」から計算されるため、同じフレームを 2 回レンダリングしてもバイト単位で一致します。
- レンダリングには WebGL が必要です。GPU アクセラレーションがあれば速く（5 秒の動画で約 16 秒）、ない環境ではソフトウェアレンダリングに切り替わり、ずっと遅くなります。
- 3D の完成動画はビットレートが高いので、アップロード前に ffmpeg で圧縮することをおすすめします：`ffmpeg -i in.mp4 -c:v libx264 -crf 24 out.mp4`

### 手書きでの補足

ライブラリにないエフェクトは、GSAP を直接書きます。`at('シーンid', シーン内の秒数)` で絶対時間に換算できます。

```js
FX.build({
  extra(tl, at) {
    tl.to('#logo', { rotation: 360, duration: 1 }, at('s3', 0.5));
  }
});
```

新しいエフェクトとして登録すれば、以降は `data-fx` の中で使えます。

```js
FX.register('spin-in', '入场', '回転して入場', c => {
  c.tl.from(c.els, { rotation: -180, opacity: 0, duration: +(c.o.dur || 0.6) }, c.t);
});
```

> 第 2 引数はカタログで使うカテゴリーのキーです（`入场` 入場、`退场` 退場、`强调` 強調、`数据` データ、`文字` テキスト、`镜头` カメラ、`角色` キャラクター、`剪纸` 切り紙、`组件` コンポーネント、`转场` トランジション）。この中国語のキーはそのまま使ってください。

**3 つの絶対ルール**：CSS の animation / transition は使わない。`setTimeout` / `requestAnimationFrame` は使わない。ランダムが必要なときは `FX.rand(シード)` を使い、`Math.random` は使わない。

## 5 つのスキン

ルート要素の class を 1 つ変えるだけで、動画全体のスタイルが変わります。

| class | スタイル | 背景色 | タイトルフォント | アクセントカラー | 向いている用途 |
|---|---|---|---|---|---|
| `theme-violet` | 白紫テック | 白 `#fdfdfd` / 暗 `#171719`（シーンに `dark` / `light` を付けて切り替え） | YouSheBiaoTiHei | 紫 `#8453e8` / 薄紫 `#d5befe` | AI ツール、効率化、ワークフロー解説 |
| `theme-gold` | 黒金シネマ | 濃い青黒 `#080a0f` + ぼかした実写 + ビネット | 金のグラデーション斜体 | 金 `#e4b256`、赤 `#ff5b56` は下落にのみ使用 | 経済、業界分析、ランキング |
| `theme-pixel` | レトロピクセル | ベージュのドット紙 `#efe9dc` | Fusion Pixel ピクセルフォント | 緑 `#9fe07a` · 赤 · 黄 | アニメ風ホスト、気軽な解説 |
| `theme-paper` | 切り紙コラージュ | ベージュの紙 `#efe6d6` + 純 CSS の紙の質感 | ZCOOL KuaiLe（站酷快乐体） | 切り紙の赤 `#c8322b` · 青緑 `#2f6b6e` · からし色 `#e3a83b` | 文化、二十四節気、ライフスタイル、子ども向け科学、手作り感のあるブランド |
| `theme-space` | 深宇宙パーティクル | 濃紺 `#061226`（放射グラデーション） | 標準のタイトルフォント。シアンの発光つき（`.t-glow` 単体でも使えます） | シアン `#6fd3ff` · オレンジ `#ff8a4d` | テック、科学解説、宇宙、発表会のオープニング、コンセプト映像。字幕は `{style:'plain'}` と組み合わせます。`.scene.space-bg` もあります |

色、フォント、角丸、字幕サイズはすべて `fx.css` の冒頭にある CSS 変数（`--fx-bg` `--fx-accent` `--fx-font-title` …）です。変数を変えれば独自のスキンを作れます。

**よく使うスタイルクラス**

| 種類 | クラス名 |
|---|---|
| 文字 | `t-hero` `t-title` `t-h2` `t-h3` `t-body` `t-small` `t-en`（英語の小さな副題）`t-num`（大きな数字）`t-mono` `t-pixel` `accent` `muted` `unit` |
| レイアウト | `layer`（全画面レイヤー）`abs` `center` `row` `col` |
| カード | `card` `shot`（スクリーンショットカード）`glass`（ガラスカード）`qcard`（はてなマークのプレースホルダーカード）`stat`（大きな数字のカード） |
| ラベル | `pill` `note`（スクリーンショット上の黒い注釈）`tag` `speed`（×3.5 の早送りバッジ）`ptag`（ピクセルタグ） |
| コンポーネント | `fx-window`（mac ウィンドウ。`.pixel` を付けるとピクセルウィンドウ）`fx-chat`（チャットの吹き出し）`fx-check`（チェックリスト）`fx-cursor`（マウスカーソル）`pbar`（ピクセルのエネルギーバー）`fx-hbar`（横棒） |
| 背景 | `bg-footage`（ぼかした実写）`vignette`（ビネット） |
| キャラクター | `host`（立ち絵のコンテナ。中に複数の `[data-pose]` 画像を置き、`pose` / `lipsync` と併用） |
| 切り紙 | `paper`（紙片。`.red` `.teal` `.mustard` `.ink` `.tilt-l` `.tilt-r` を追加可）`paper-tag`（破れ縁のラベル）`tape`（テープ）`fx-torn-shadow`（破れ縁の要素に影を付けるラッパー）`scene.paper-bg`（どのスキンでもシーンに紙の質感の背景を敷く）。新しい変数 `--fx-font-round`（丸ゴシック系フォント） |

## よくある質問

**スクリーンショットは正常なのに、完成動画の下部が切れて字幕が消えています。**
レンダリング時に `chrome-tall.sh` を指定していません。「クイックスタート」のステップ 3 を参照してください。

**あるエフェクトが表示されません。**
まず名前のスペルミスを確認してください。名前が間違っていてもレンダリングは中断されず、コンソールに `FX：没有这个动效`（そのようなエフェクトはありません）と出力されるだけです。`npx hyperframes validate` かブラウザのコンソールで確認できます。また、時間がシーンの長さを超えていないかも確認してください。

**中国語が豆腐（四角）になる、またはフォントが違います。**
本文には、システムの PingFang SC を使っています。macOS 以外の環境では Noto Sans SC をインストールし、`--fx-font-body` に追加してください。

**`npx hyperframes lint` が `missing_timeline_registry` / `font_family_without_font_face` を報告します。**
静的チェックの誤検知です。タイムラインは実行時に `fx.js` が登録し、フォントは `fx.css` の `@import` で宣言されています。`snapshot` で書き出した映像を基準にしてください。

**グラデーション文字を分割すると消えてしまいます。**
`background-clip:text` で作ったグラデーション文字（黒金スキンの金色の文字など）は、`chars:`・`type`・`roll` のような文字分割系エフェクトと組み合わせると消えます。1 文字ずつ動かす部分は単色（例：`color:#e4b256`）にしてください。

**ナレーションと合わせたいのですが。**
ナレーションのタイムスタンプを使って、各シーンの `data-t` / `data-d` と `FX.subtitles` の時間を設定してください。エフェクトの時間はすべてシーンの冒頭からの相対値なので、変更は不要です。

**パーティクルが表示されません。**
`lib/fx-particles.js` が（`fx.js` の後に）読み込まれているか、パーティクルエフェクトが `data-make="space"` の要素に書かれているかを確認してください。それ以外の要素に書いても何も描画されません。

**3D の映像が真っ黒です / 表示されません。**
次の 3 点を確認してください。スクリプトが `gsap` → `three-fx.min.js` → `fx.js` → `fx-3d.js` の順に読み込まれていること、3D エフェクトが `data-make="stage3d"` の要素に書かれていること、レンダリングするマシンが WebGL に対応していること。

## ライセンス

- コード：[MIT](LICENSE)。サードパーティについては [NOTICE](NOTICE) を参照してください。
- GSAP：GreenSock の [Standard License](https://gsap.com/standard-license) のもとで使用しています（商用利用を含め無料）。
- フォント：[fonts/README.md](fonts/README.md) を参照してください。
- three.js：[MIT](https://github.com/mrdoob/three.js)（`vendor/three-fx.min.js` に r187 とポストプロセスのモジュールをまとめて収録しています。ライセンスは [vendor/three-LICENSE.txt](vendor/three-LICENSE.txt)）。

## クレジット

v1.1 の新しいエフェクトとスキンは、次のオープンソースプロジェクトにインスピレーションを受けています。

- [animate.css](https://github.com/animate-css/animate.css)（MIT）
- [Magic UI](https://github.com/magicuidesign/magicui)（MIT）
- [React Bits](https://github.com/DavidHDev/react-bits)（MIT + Commons Clause）

これらは CSS アニメーションや React コンポーネントで、フレーム単位でレンダリングする仕組みからは制御できません。motion-lib は、シークでき結果が再現できるタイムラインのために対応するエフェクトを作り直しました。借りたのはアイデアとエフェクト名（カタログの括弧内の元の名前）だけで、**コードは一切コピーしていません**。

3D モジュールは [three.js](https://github.com/mrdoob/three.js)（MIT）をもとにしています。

<!-- CATALOG:START -->
## エフェクトカタログ（エフェクト 153 種 + トランジション 20 種）

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

### データ (6)

数字・進捗・グラフ系です。数字系のエフェクトは小数桁と千単位の区切りを自動で保持します。

| 名前 | 動作 / パラメーター |
|---|---|
| `count` | 数字のカウント。要素内に最終的な数字を書くか、to= で指定します。from=開始値。小数桁と千単位の区切りを自動で保持します |
| `roll` | 桁ごとの縦ロール：各桁が 0〜9 の縦帯になり、ぼかしつつ回転したあと左から順に止まります（黒金テーマの $7,000）。パラメーター：dur、stagger、spins=余分に回す周数 |
| `clock` | 時計のダイヤル：from=23:28 から to=01:23 まで進めます（日付をまたぐ場合も自動対応） |
| `fill` | プログレスバーの塗りつぶし：要素の幅（dir=y のときは高さ）を from% から to% まで伸ばします |
| `ring` | リング進捗：data-make="ring" と併用します。パラメーター：from、to（0〜1） |
| `wave-live` | 波形の跳ね：data-make="wave" と併用します。各バーがシード値に従ってランダムに上下します。パラメーター：dur、seed |

### カメラ (11)

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

### キャラクター (16)

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

### コンポーネント (4)

`data-make` で生成したコンポーネントと組み合わせて使います。

| 名前 | 動作 / パラメーター |
|---|---|
| `step` | ステップナビの切り替え：data-make="steps" と併用します。i 番目のピル（1 始まり）を点灯し、残りを消します |
| `chapter` | チャプター進捗バー：data-make="chapters" と併用します。ハイライトブロックが第 i チャプター（1 始まり）へスライドします |
| `check` | チェックリストのチェック：.fx-check コンポーネントと併用します。チェックマークが描かれ、文字がくっきりします |
| `toggle` | スイッチ切り替え：data-make="switches" と組み合わせ、i 番目（2/3/5 の一括指定可）を ON(on=1) / OFF(on=0) に切り替えます。パラメーター：i、on=0/1、stagger |

### トランジション (20)

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
<!-- CATALOG:END -->
