# motion-lib

**简体中文** · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md)

**HTML → 视频的声明式动效库。** 在元素上写一行 `data-fx="动效名@秒数"`，就能做出知识口播、科技解说这类视频里常见的动效，再用 [HyperFrames](https://hyperframes.heygen.com) 逐帧渲染成 MP4。

> **v1.2 新增**：可选粒子模块 `fx-particles.js`（8 个粒子动效：星空、星云、旋涡、黑洞、能量球、爆炸、粒子聚字、粒子流）+ 第 5 套皮肤 `theme-space`（深空粒子）。
>
> **v1.1 新增**：40 种动效 + 4 个转场（`paper-slide` `tear` `glitch-cut` `open`）+ 5 个组件生成器（`circle-text` `retro-grid` `papercut` `hills` `torn`）；2 个新分类「文字」「剪纸」；第 4 套皮肤 `theme-paper`（剪纸拼贴）。灵感来自 animate.css、Magic UI、React Bits，见文末「致谢」。

[![motion-lib 宣传片](promo/cover.jpg)](promo/motion-lib-promo.mp4)

> 上面的宣传片就是用这个库写的，源码在 [`promo/index.html`](promo/index.html)。

<!-- STATS:START -->
| | 数量 |
|---|---|
| 动效 | **124** 种（入场 26 · 退场 9 · 强调 37 · 文字 9 · 数据 6 · 镜头 11 · 角色 5 · 剪纸 10 · 粒子 8 · 组件 3） |
| 转场 | **14** 种 |
| 组件生成器 | **15** 个（`bars` `wave` `steps` `chapters` `ring` `wall` `dust` `line` `pixels` `circle-text` `retro-grid` `papercut` `hills` `torn` `space`） |
| 皮肤 | **5** 套（白紫科技 · 黑金电影 · 像素复古 · 剪纸拼贴 · 深空粒子） |
<!-- STATS:END -->

## 为什么要用它

用 HTML 做视频，难的不是排版，是动效：

- **渲染器是「跳到第 N 帧 → 截图」**。CSS animation、`setTimeout`、`Math.random` 都不受它控制，渲出来要么不动，要么每次不一样。
- 手写 GSAP 时间线，一条一分钟的片子就要算几百个时间点。

motion-lib 把所有动效都排进**一条暂停的 GSAP 时间线**，你只需要声明「哪个元素、什么动效、第几秒」：

```html
<h1 data-fx="blur-rise-in@0.2">做热点最难的是什么？</h1>
<b  data-fx="count@0.6 marker@1.6">7,000</b>
<ul data-fx="each:pop-in@1(stagger=0.1)"> <li>芯片</li><li>算力</li><li>大模型</li> </ul>
```

- **逐帧可 seek**：任意跳到哪一帧，画面都和顺序播放时一致，每次渲染结果相同。
- **随机也可复现**：需要随机效果的地方（粒子、乱码、波形）一律用带种子的 `FX.rand(seed)`。
- **不依赖网络**：GSAP 和字体都打包在仓库里。
- **零构建**：一个 `fx.js`、一个 `fx.css`，不需要 npm / 打包工具。

## 目录

```
motion-lib/
├── fx.js            动效库本体：动效、转场、组件生成器、字幕、预览播放器
├── fx.css           基础样式、组件样式、五套皮肤
├── fx-particles.js  可选的粒子模块（宇宙、旋涡、黑洞、爆炸、粒子聚字）
├── fonts/           优设标题黑、得意黑、Fusion Pixel 像素字体、站酷快乐体（许可见 fonts/README.md）
├── vendor/          GSAP 3.15（本地一份）
├── new-project.sh   把库装进一个视频项目（也用来更新）
├── chrome-tall.sh   渲染用 Chrome 包装（防止成片底部字幕被截掉）
├── gen-readme.mjs   从 fx.js 自动生成本文的数量表和动效目录（node gen-readme.mjs）
├── demo/            演示页：6 个场景，三套皮肤都用到
├── promo/           宣传片源码 + 成片
└── examples/        五套皮肤各一条完整示例片 + 合集
```

## 环境要求

- Node.js 18+（用 `npx hyperframes`）
- FFmpeg
- Google Chrome（macOS 默认位置；其他位置设环境变量 `REAL_CHROME`）
- 第一次跑 `npx hyperframes` 会自动下载 CLI

## 快速开始

**1. 建项目**

```bash
mkdir my-video
./new-project.sh my-video        # 把 fx.js / fx.css / 字体 / GSAP 拷到 my-video/lib/
```

> HyperFrames 只能读项目目录里的文件，所以库是**拷进**项目，而不是用 `../` 引用。库更新后，在同一个项目上再跑一次这条命令即可。
> 仓库里的 `demo/` 和 `promo/` 也一样，第一次打开前先跑 `./new-project.sh demo`、`./new-project.sh promo`。

**2. 写 `my-video/index.html`**

```html
<!doctype html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="lib/fx.css">
  <script src="lib/vendor/gsap.min.js"></script>
  <script src="lib/fx.js"></script>
</head>
<body>
<div id="root" class="theme-violet" data-composition-id="main" data-width="1920" data-height="1080">

  <section class="scene dark center" data-d="3.5">
    <h1 class="t-title" data-fx="mask-rise@0.2">全自动剪辑 <span class="accent">Skill</span></h1>
    <p class="t-body" data-fx="rise-in@0.6 marker@1.4">看完这期，你也可以</p>
  </section>

  <section class="scene light" data-d="4" data-in="blur-cross">
    <div class="abs" style="left:200px;top:300px;width:1200px;height:400px"
         data-make="bars" data-values="3,8,21,40,26,12" data-hi="4"
         data-fx="each:grow-y@0.3(stagger=0.05)"></div>
  </section>

</div>
<script>
  FX.subtitles([[0.2, 3.4, '看完这期，你也可以'], [3.5, 7.4, '播放集中在{开播后}几小时']], { style: 'pill' });
  FX.build();
</script>
</body>
</html>
```

> 要用粒子动效时，在 `fx.js` 后面多加一行：`<script src="lib/fx-particles.js"></script>`（`new-project.sh` 已经把它拷进 `lib/` 了）。


**3. 预览、截帧、出片**

```bash
cd my-video
open "index.html?play"                       # 浏览器预览：空格播放，←/→ 逐帧，↑/↓ 跳场景
npx hyperframes snapshot --at 1,3,5          # 截几帧检查
HYPERFRAMES_BROWSER_PATH="$PWD/lib/chrome-tall.sh" \
  npx hyperframes render -o out.mp4 --experimental-fast-capture=false
```

> 出片时一定要带 `chrome-tall.sh`。本机完整版 Chrome 无头渲染时，可视高度比窗口矮约 90px，成片底部（字幕）会被截掉。这个脚本会把窗口加高。

## 示例片

五套皮肤各做了一条完整示例（纯动效、无配音），源码就在对应目录里，可以直接改着用：

| 皮肤 | 示例 | 源码 |
|---|---|---|
| 白紫科技 `theme-violet` | [![violet](examples/violet/cover.jpg)](examples/violet/violet.mp4) | [`examples/violet/index.html`](examples/violet/index.html) |
| 黑金电影 `theme-gold` | [![gold](examples/gold/cover.jpg)](examples/gold/gold.mp4) | [`examples/gold/index.html`](examples/gold/index.html) |
| 像素复古 `theme-pixel` | [![pixel](examples/pixel/cover.jpg)](examples/pixel/pixel.mp4) | [`examples/pixel/index.html`](examples/pixel/index.html) |
| 剪纸拼贴 `theme-paper` | [![paper](examples/paper/cover.jpg)](examples/paper/paper.mp4) | [`examples/paper/index.html`](examples/paper/index.html) |
| 深空粒子 `theme-space` | [![space](examples/space/cover.jpg)](examples/space/space.mp4) | [`examples/space/index.html`](examples/space/index.html) |

五条合在一起：[`examples/showreel.mp4`](examples/showreel.mp4)。

## 写法

### 场景 `<section class="scene">`

一个场景就是一个镜头。场景之间按顺序首尾相接。

| 写法 | 含义 |
|---|---|
| `data-d="4"` | 时长 4 秒 |
| `data-t="12.5"` | 指定开始时间（不写就紧接上一个场景） |
| `data-in="blur-cross(dur=0.5)"` | 用什么转场进入这个场景，见「转场」 |
| `class="scene dark"` / `"scene light"` | 单个场景切深色 / 浅色底 |
| `class="scene overlay"` | 叠加层：不占顺序，和其他场景同时显示（角标、常驻进度条） |

根元素必须带 `data-composition-id="main"`、`data-width`、`data-height`，总时长会自动算出来。

### 动效 `data-fx="[目标:]名字@时间(参数)"`

一个元素可以写多个动效，用空格隔开：`data-fx="rise-in@0.2 pulse@1.5 fade-out@-0.3"`。

| 部分 | 写法 | 含义 |
|---|---|---|
| 时间 | `@1.2` | 场景开始后 1.2 秒 |
| | `@+0.3` | 比同一元素上的前一个动效晚 0.3 秒 |
| | `@-0.4` | 场景结束前 0.4 秒（做退场） |
| 目标 | （不写） | 元素本身 |
| | `each:` | 每个子元素，自动错峰（卡片组、清单、柱子） |
| | `chars:` / `words:` / `lines:` | 拆成单字 / 词 / 行（按 `<br>`）再做动效 |
| 参数 | `dur=0.8` | 时长（秒） |
| | `ease=spring` | 缓动，见下表 |
| | `stagger=0.1` | 错峰间隔（配合 `each:` / `chars:`） |
| | `order=center` | 错峰顺序：`start` `end` `center` `edges` |
| | 其他 | 各动效自己的参数，见「动效目录」 |

**缓动别名**

| 别名 | 等于 | 手感 |
|---|---|---|
| `out`（默认） | `power3.out` | 急起缓停，最通用 |
| `soft` | `power2.out` | 柔和 |
| `snap` | `expo.out` | 极快冲到位，再慢慢停稳 |
| `sharp` | `power4.out` | 比 out 更利落 |
| `inout` | `power3.inOut` | 两头慢中间快，镜头运动用 |
| `in` | `power2.in` | 越来越快，退场用 |
| `spring` | `back.out(1.7)` | 轻微过冲回弹 |
| `bounce` | `back.out(2.8)` | 明显过冲 |
| `elastic` | `elastic.out(1,0.55)` | 弹簧 |
| `drop` | `bounce.out` | 落地弹跳 |
| `linear` | `none` | 匀速 |
| `pixel` | `steps(5)` | 阶梯式（像素风） |

也可以直接写 GSAP 原名，如 `ease=power4.out`、`ease=steps(8)`、`ease=elastic.out(1,0.5)`。

### 组件生成器 `data-make="名字"`

重复的 DOM 交给库生成，再配对应的动效：

| 名字 | 属性 | 配合的动效 | 用途 |
|---|---|---|---|
| `bars` | `data-values` `data-labels` `data-hi="2,3"` `data-max` | `each:grow-y` | 柱状图 / 直方图 |
| `line` | `data-values` `data-w` `data-h` `data-smooth` | `draw` | 折线 / 曲线 |
| `ring` | `data-size` `data-stroke` `data-dash` | `ring(to=0.7)` | 圆环进度、倒计时 |
| `wave` | `data-n` `data-seed` | `each:grow-y`、`wave-live` | 音频波形 |
| `steps` | `data-labels="选题,写稿,配音"` | `step(i=2)` | 步骤导航胶囊 |
| `chapters` | `data-labels` | `chapter(i=3)` | 顶部章节进度条 |
| `pixels` | `data-text="SKILL?"` `data-size` `data-colors` | `each:pixel-in(order=random)` | 5×7 点阵方块字 |
| `wall` | `data-cols` `data-rows` `data-seed` | `drift` | 背景卡片墙 |
| `dust` | `data-n` `data-seed` | `drift`、`float` | 漂浮粒子 |
| `circle-text` | `data-text` `data-r`（半径） | `spin`（让文字环转起来） | 环形文字、徽章、印章 |
| `retro-grid` | `data-cell`（格子大小）`data-color` `data-angle`（倾角） | `bg-scroll`（让网格往前流动） | 复古透视网格背景 |
| `papercut` | `data-size` `data-fold`（几折：6 / 8 / 12）`data-shape`（`flower` `circle` `square`）`data-color` `data-seed` | `pop-in`、`spin`、`jitter` | 对称剪纸窗花，每个 seed 图案都不同 |
| `hills` | `data-layers`（层数）`data-colors`（从后到前的颜色）`data-seed` | `layer-rise`、`parallax` | 层叠纸山；每层是一个子元素 |
| `torn` | `data-edges`（`top,right,bottom,left`，默认 `top,bottom`）`data-depth` `data-teeth` `data-seed` | `stick-on`、`rise-in` | 把元素的边剪成毛边纸条；`clip-path` 会裁掉阴影，要投影请在外面套一层 `fx-torn-shadow` |
| `space` | `data-fx` 里写粒子动效（需加载 `fx-particles.js`） | `nebula` `starfield` `vortex` `blackhole` `form-text` 等「粒子」类 | 画布容器：一块画布，每个粒子动效是一层 |

### 字幕

```js
FX.subtitles([
  [开始秒, 结束秒, '文字，{花括号}里的词变强调色'],
  …
], { style: 'pill', pop: false });
```

| `style` | 样子 | 搭配皮肤 |
|---|---|---|
| `pill` | 黑色圆角胶囊 + 白字 | 白紫科技 |
| `bar` | 半透明黑条 | 像素复古 |
| `plain` | 白字 + 描影，无底 | 黑金电影 |
| `paper` | 米色毛边纸条 + 深色字 | 剪纸拼贴 |

`pop: true` 时每句字幕会轻轻上浮出现；默认是硬切，口播视频一般就是硬切。

### 粒子（fx-particles.js）

可选模块，画布（Canvas 2D）粒子：星空、星云、旋涡、黑洞、能量球、爆炸、粒子聚字、粒子流。在 `fx.js` 之后加载，再写：

```html
<script src="lib/fx-particles.js"></script>

<div class="layer" data-make="space"
     data-fx="nebula@0 starfield@0(speed=0.15) vortex@1 form-text@4(text=HELLO)"></div>
<h1 class="t-hero" data-fx="rise-in@0.6">HELLO, SPACE</h1>
```

- 一个 `data-make="space"` 就是一块画布；写在它上面的每个粒子动效是一层，按书写顺序**从下往上**叠（上例：星云在最底，聚字在最上）。上面的标题是普通 DOM 元素，叠在画布之上。
- 通用参数：`dur`（这一层持续多久，默认到场景结束）、`fade` / `out`（淡入淡出秒数）、`x` / `y`（中心位置百分比）、`seed`。
- 颜色列表用 `/` 分隔，例如 `colors=#6fd3ff/#ff8a4d`。
- `form-text` 里要分清三个时间：`dur` 是整层时长，`conv` 是聚拢用多久，`start` 是先飘多久。它用皮肤的标题字体取样，中英文都行。
- 画布是普通元素，可以照常加别的动效，比如 `to@3(scale=1.3)` 做推近。
- 和主库一样逐帧可复现：每一帧都是时间的纯函数，随机带种子。注意这是用 2D 画布**模拟**透视，不是真 3D（WebGL）。

### 手写补充

库里没有的动效，直接写 GSAP。用 `at('场景id', 场景内秒数)` 换算绝对时间：

```js
FX.build({
  extra(tl, at) {
    tl.to('#logo', { rotation: 360, duration: 1 }, at('s3', 0.5));
  }
});
```

也可以注册成新动效，之后就能在 `data-fx` 里用：

```js
FX.register('spin-in', '入场', '旋转入场', c => {
  c.tl.from(c.els, { rotation: -180, opacity: 0, duration: +(c.o.dur || 0.6) }, c.t);
});
```

**三条硬规则**：不用 CSS animation / transition；不用 `setTimeout` / `requestAnimationFrame`；要随机就用 `FX.rand(种子)`，不用 `Math.random`。

## 五套皮肤

在根元素上换一个 class，整片换风格：

| class | 风格 | 底色 | 标题字 | 强调色 | 适合 |
|---|---|---|---|---|---|
| `theme-violet` | 白紫科技 | 白 `#fdfdfd` / 深 `#171719`（场景加 `dark` / `light` 切换） | 优设标题黑 | 紫 `#8453e8` / 浅紫 `#d5befe` | AI 工具、效率、工作流讲解 |
| `theme-gold` | 黑金电影 | 深蓝黑 `#080a0f` + 模糊实拍 + 暗角 | 金色渐变斜体 | 金 `#e4b256`，红 `#ff5b56` 只给下跌 | 财经、行业分析、榜单 |
| `theme-pixel` | 像素复古 | 米色网点纸 `#efe9dc` | Fusion Pixel 像素字 | 绿 `#9fe07a` · 红 · 黄 | 动漫主持人、轻松科普 |
| `theme-paper` | 剪纸拼贴 | 米色纸底 `#efe6d6` + 纯 CSS 纸纹 | 站酷快乐体 ZCOOL KuaiLe | 剪纸红 `#c8322b` · 青 `#2f6b6e` · 芥黄 `#e3a83b` | 文化、节气、生活方式、儿童科普、手作感品牌 |
| `theme-space` | 深空粒子 | 深蓝底 `#061226`（径向渐变） | 默认标题字，自带青色发光（也可单独用 `.t-glow`） | 青 `#6fd3ff` · 橙 `#ff8a4d` | 科技、科普、宇宙、发布会片头、概念片；字幕配 `{style:'plain'}`；另有 `.scene.space-bg` |

所有颜色、字体、圆角、字幕尺寸都是 `fx.css` 顶部的 CSS 变量（`--fx-bg` `--fx-accent` `--fx-font-title` …），改变量就能做自己的皮肤。

**常用样式类**

| 类型 | 类名 |
|---|---|
| 文字 | `t-hero` `t-title` `t-h2` `t-h3` `t-body` `t-small` `t-en`（英文小副标）`t-num`（大数字）`t-mono` `t-pixel` `accent` `muted` `unit` |
| 布局 | `layer`（整屏图层）`abs` `center` `row` `col` |
| 卡片 | `card` `shot`（截图卡）`glass`（玻璃卡）`qcard`（问号占位卡）`stat`（大数字报） |
| 标签 | `pill` `note`（截图上的黑色标注）`tag` `speed`（×3.5 加速角标）`ptag`（像素标签） |
| 组件 | `fx-window`（mac 窗口，加 `.pixel` 变像素窗口）`fx-chat`（聊天气泡）`fx-check`（清单打勾）`fx-cursor`（鼠标光标）`pbar`（像素能量条）`fx-hbar`（横向条形） |
| 背景 | `bg-footage`（模糊实拍）`vignette`（暗角） |
| 角色 | `host`（立绘容器，里面放多张 `[data-pose]` 图，配 `pose` / `lipsync`） |
| 剪纸 | `paper`（纸片，可加 `.red` `.teal` `.mustard` `.ink` `.tilt-l` `.tilt-r`）`paper-tag`（毛边标签）`tape`（胶带）`fx-torn-shadow`（给毛边元素补投影的外壳）`scene.paper-bg`（任意皮肤下给场景铺纸纹底）；新变量 `--fx-font-round`（圆体字） |

## 常见问题

**截图正常，成片底部却少了一截、字幕没了？**
渲染没带 `chrome-tall.sh`，见「快速开始」第 3 步。

**某个动效没出现？**
先看名字有没有拼错。写错的名字不会中断渲染，只会在控制台打印 `FX：没有这个动效`，用 `npx hyperframes validate` 或浏览器控制台能看到。另外检查时间是否超过了场景时长。

**中文变成方块，或者字体不对？**
正文用的是系统苹方。非 macOS 机器请安装 Noto Sans SC，并在 `--fx-font-body` 里加上它。

**`npx hyperframes lint` 报 `missing_timeline_registry` / `font_family_without_font_face`？**
这是静态检查的误报：时间线由 `fx.js` 在运行时注册，字体在 `fx.css` 里通过 `@import` 声明。以 `snapshot` 截出来的画面为准。

**渐变字拆字后不见了？**
用 `background-clip:text` 做的渐变字（如黑金皮肤的金字），配 `chars:`、`type`、`roll` 这类拆字动效时会消失。要逐字动画的那段文字改用纯色（如 `color:#e4b256`）。

**想和配音对齐？**
用配音的时间戳填每个场景的 `data-t` / `data-d` 和 `FX.subtitles` 的时间即可。动效时间都是相对场景开头的，不用改。

**粒子没出来？**
检查是否加载了 `lib/fx-particles.js`（在 `fx.js` 之后），以及粒子动效是否写在 `data-make="space"` 的元素上；写在别的元素上不会有任何画面。

## 许可

- 代码：[MIT](LICENSE)；第三方组件说明见 [NOTICE](NOTICE)。
- GSAP：使用 GreenSock 的 [Standard License](https://gsap.com/standard-license)（免费，含商用）。
- 字体：见 [fonts/README.md](fonts/README.md)。

## 致谢 / Credits

v1.1 的新动效和皮肤受到下面这些开源项目的启发：

- [animate.css](https://github.com/animate-css/animate.css)（MIT）
- [Magic UI](https://github.com/magicuidesign/magicui)（MIT）
- [React Bits](https://github.com/DavidHDev/react-bits)（MIT + Commons Clause）

这些项目是 CSS 动画或 React 组件，渲染器无法逐帧控制。本库按「逐帧可 seek、结果可复现」的需求重新实现了相应的效果：只借用了它们的创意和效果名称（说明里括号中的原名），**没有复制它们的代码**。

<!-- CATALOG:START -->
## 动效目录（124 种动效 + 14 种转场）

> 这一节由 `node gen-readme.mjs` 从 `fx.js` 自动生成，不要手改。
> 所有动效都支持通用参数 `dur`（时长）、`ease`（缓动）、`stagger`（错峰）；下表只列各自特有的参数。

### 入场（26）

元素出现的方式。默认从「入场前」状态回到元素本来的样子，所以元素自己写的 CSS 位置、旋转都会保留。

| 名字 | 作用 / 参数 |
|---|---|
| `fade-in` | 纯淡入，最克制；用于字幕、次要说明 |
| `rise-in` | 从下方上滑 + 淡入，最通用的入场。参数 dist=位移像素 |
| `drop-in` | 从上方落下 + 淡入，用于标签、角标 |
| `slide-in` | 从一侧滑入。参数 dir=left/right/up/down（朝哪个方向运动）、dist |
| `blur-in` | 由模糊到清晰，原地显现；用于大标题、截图卡片 |
| `blur-rise-in` | 模糊 + 上滑 + 淡入，电影感标题的标准入场 |
| `scale-in` | 从略小放大到位，卡片 / 图片的标准入场。参数 from=起始缩放 |
| `pop-in` | 弹出：从小放大并过冲回弹，用于标注胶囊、图标、勾叉 |
| `zoom-settle` | 从放大的模糊状态收回到位（镜头「对上焦」的感觉），用于开场大字 |
| `wipe-in` | 遮罩擦除显现。参数 dir=right/left/up/down（擦除推进方向） |
| `mask-rise` | 文字从一条看不见的基线下面升上来（遮罩上滑），标题感最强 |
| `flip-in` | 沿水平轴翻转立起（3D），用于卡片翻牌、问号卡揭晓 |
| `tilt-in` | 带透视的倾斜飞入（3D 卡片从侧面转正），用于界面截图 |
| `stamp-in` | 盖章：从很大砸下来，落定时抖一下；用于结论、印章、勾叉 |
| `drop-bounce` | 从画面上方掉下来，落地弹两下；用于物件堆叠、像素方块 |
| `swing-in` | 像挂牌一样从上沿甩下来摆正 |
| `focus-in` | 字间距从很宽收拢 + 模糊变清晰，英文小标题 / 副标题常用 |
| `grow-x` | 沿横向从 0 长出来（条形图、分隔线、进度条）。参数 origin=left/center/right |
| `grow-y` | 沿纵向从 0 长出来（柱状图）。参数 origin=bottom/top |
| `fan-in` | 一叠卡片从中心摊开到各自位置（配 each: 使用），卡片最终位置和角度照 CSS 写 |
| `type` | 打字机：逐字敲出。参数 cps=每秒字数、caret=1 显示光标 |
| `draw` | 描线：SVG 线条沿路径画出来（连线、箭头、圈注、折线图） |
| `pixel-in` | 像素风入场：分 4~5 档跳着出现（不是平滑的），配 each: 可做方块拼字 |
| `scramble` | 乱码解码：每个字先闪随机字符（灰），从左到右逐个锁定成正确的字（白）。参数 dur、chars=乱码字符池 |
| `light-speed-in` | 光速入场：带着斜切从一侧高速冲进来，冲过头再回正（animate.css lightSpeedIn）。参数 dir=left/right（往哪边运动）、dist |
| `jack-in` | 弹簧盒：从底部一点点弹出来，左右晃两下站稳（animate.css jackInTheBox） |

### 退场（9）

元素离开的方式。一般写成 `@-0.4`（场景结束前 0.4 秒）。

| 名字 | 作用 / 参数 |
|---|---|
| `fade-out` | 淡出 |
| `rise-out` | 向上滑走 + 淡出 |
| `drop-out` | 向下滑走 + 淡出 |
| `blur-out` | 变模糊 + 淡出（退到背景里去） |
| `scale-out` | 缩小 + 淡出。参数 to=结束缩放（>1 则是放大着消失） |
| `slide-out` | 向一侧滑出。参数 dir |
| `wipe-out` | 遮罩擦除消失 |
| `hinge` | 铰链掉落：左上角像钉了一颗钉子，晃两下后掉出画面（animate.css hinge）。参数 dist |
| `fall-out` | 文字掉落：每个字带着旋转往下掉出画面（FallingText），一般配 chars: 用。参数 dist、seed |

### 强调（37）

元素已经在画面上，念到它时做一下强调；也包括移动、变色、内容切换。

| 名字 | 作用 / 参数 |
|---|---|
| `pulse` | 放大一下再回去（念到这个词的时候敲一下）。参数 to=峰值缩放 |
| `shake` | 左右抖动（否定、报错、警告） |
| `nod` | 上下轻跳一下（角色点头、图标弹跳） |
| `blink` | 闪烁几下（光标、警示）。参数 n=次数 |
| `color` | 文字 / 背景变色。参数 to=颜色、bg=背景色 |
| `marker` | 荧光笔：一道色块从左到右刷过文字底部。参数 color、h=色块高度% |
| `underline` | 下划线从左长到右。参数 color、w=粗细像素 |
| `strike` | 删除线划过（旧方案作废） |
| `box` | 高亮框：沿元素外沿画出一圈描边（截图上圈重点）。参数 color、pad、w、r |
| `glow` | 发光呼吸：光晕亮起再回落。参数 color、n=次数 |
| `sheen` | 扫光：一道高光斜着扫过卡片 / 按钮 |
| `ping` | 涟漪：从元素中心扩散出一圈（点击反馈、提示位置） |
| `dim` | 压暗（退到次要地位）。参数 to=不透明度 |
| `undim` | 恢复亮度 |
| `spot` | 聚光：配 each: 使用，第 i 个子元素保持明亮并略微放大，其余压暗。参数 i（从 1 数） |
| `float` | 持续上下漂浮（待机感）。参数 amp=幅度、period=一个来回的秒数、dur=持续多久 |
| `spin` | 旋转。参数 deg=总角度、dur |
| `move` | 把元素移动到另一个元素的位置（光标移向按钮、标签飞入卡片）。参数 to=#目标 或 x、y |
| `click` | 点击：按下缩一下 + 涟漪（配 .fx-cursor 光标组件） |
| `swap` | 原地切换内容：自己淡出，目标元素淡入。参数 to=#目标 |
| `squash` | 卡片挤压-弹开：横向先压窄再弹回（约 3 帧压 + 4 帧弹），常和换内容一起用。参数 to=最窄比例 |
| `cycle` | 子元素轮播硬切：一次只显示一个，每 every 秒换下一个（缩略图里画面一直在换）。参数 every、loop=1 循环、stop=停在第几张 |
| `text` | 文字硬切成新内容（时钟跳变、标签换字）。参数 v=新文字 |
| `to` | 万能补间：直接写 GSAP 属性。例 to@2(x=120,scale=1.2,opacity=0.5,dur=0.6,ease=inout) |
| `tada` | 欢呼：先缩一下，再放大着左右摇摆（animate.css tada） |
| `jello` | 果冻：斜切着来回晃，幅度越来越小（animate.css jello） |
| `rubber-band` | 橡皮筋：横向拉长、纵向压扁，来回弹几下（animate.css rubberBand） |
| `heartbeat` | 心跳：连续两下放大（animate.css heartBeat） |
| `head-shake` | 摇头：带一点 3D 转动的左右摇（否定、不对）（animate.css headShake） |
| `wobble` | 摇晃：边平移边歪着来回晃（animate.css wobble） |
| `border-beam` | 边框流光：一小段光沿着元素边框绕圈跑（BorderBeam / StarBorder）。参数 color、w=粗细、len=光带占周长比例、n=绕几圈、dur=每圈秒数、keep=1 跑完不消失 |
| `spotlight` | 聚光灯：画面压暗，只留一个圆形亮区罩住目标；同一场景里再调一次，光圈会移到新目标（Spotlight）。写在要照的元素上，或 to=#id。参数 r=半径、dim=暗度 0~1、off=1 关灯 |
| `confetti` | 撒彩纸：从元素中心炸开一把彩纸，抛起再落下（Confetti / ClickSpark）。参数 n、colors=色1/色2/色3、power=力度、seed |
| `sparkle` | 闪烁星点：元素四周随机冒出小星星，一闪一闪（SparklesText）。参数 n、color、dur、seed |
| `orbit` | 环绕：把容器的子元素均匀摆在一个圆上，绕中心转，子元素始终保持正立（OrbitingCircles）。写在容器上。参数 r=半径、turns=圈数、dur、reverse=1 反转 |
| `beam` | 连接光束：在两个元素之间画一条弧线，一团光沿线流过去（AnimatedBeam，适合画「A 把数据传给 B」）。写在起点元素上，to=#终点。参数 curve=弯曲度、color、n=流几次、dur |
| `flip-swap` | 翻面换内容：元素绕竖轴翻过去，背面换成第二个子元素再翻回来（翻牌、揭晓答案）。元素里放两个子元素：第一个是正面，第二个是背面。参数 axis=y/x |

### 文字（9）

专门给文字用的：流光、故障、换词、删掉重打、翻牌、描边、残影。

| 名字 | 作用 / 参数 |
|---|---|
| `shimmer` | 流光字：一道高光从左到右扫过文字（ShinyText）。参数 color=高光色、n=扫几次、gap=两次间隔 |
| `glitch` | 故障字：红蓝错位 + 抖动 + 斜切，闪一小段后恢复（GlitchText）。参数 amp=错位像素、dur、seed。注意会把元素 x 归零，元素本身要移动时套一层外壳 |
| `rotate-words` | 词语轮换：同一位置的词向上翻走、下一个词翻上来（WordRotate）。参数 words=乙/丙/丁（用 / 分隔，元素原文是第一个）、every=每个词停留秒数 |
| `morph` | 模糊变形换词：旧词变虚散开，新词从模糊中聚拢（MorphingText）。参数 words=乙/丙、every |
| `retype` | 删掉重打：把现有文字从后往前一个个删掉，再敲出新文字（TextType）。参数 v=新文字、cps=每秒打几个字、del=每秒删几个字 |
| `true-focus` | 逐词聚焦：一次只让一个词清晰，其余变虚，取景框跳到这个词上（TrueFocus）。中文用 / 分词（如 AI/不会/替代/你），英文按空格。参数 every、blur、color |
| `split-flap` | 翻牌机：每个字先快速翻过一串随机字符，再从左到右依次停在正确的字上（SplitFlap，机场航班牌）。入场用。参数 dur、stagger、chars=字符池 |
| `stroke-in` | 描边字：先沿一个方向画出空心描边，再把颜色灌满（StrokeText）。参数 w=描边粗细、color=描边色、hold=空心停留秒数 |
| `echo` | 残影入场：几层半透明的拷贝拖在后面一起滑入，到位后残影散掉（EchoText）。参数 n=残影层数、dist、dir |

### 数据（6）

数字、进度、图表类。数字类动效会自动保留小数位和千分位。

| 名字 | 作用 / 参数 |
|---|---|
| `count` | 数字滚动。元素里写最终数字，或用 to= 指定；from= 起始值。自动保留小数位和千分位 |
| `roll` | 数字逐位竖向翻滚：每一位是一条 0~9 的竖带，带模糊滚动后从左到右依次停靠（黑金款的 $7,000）。参数 dur、stagger、spins=多转几圈 |
| `clock` | 时钟拨动：from=23:28 拨到 to=01:23（会自动跨天） |
| `fill` | 进度条填充：把元素宽度（或 dir=y 时高度）从 from% 补到 to% |
| `ring` | 圆环进度：配 data-make="ring"。参数 from、to（0~1） |
| `wave-live` | 波形跳动：配 data-make="wave"，每根条按种子随机起伏。参数 dur、seed |

### 镜头（11）

作用在一整个容器上：推近、平移、3D 倾斜、震动。

| 名字 | 作用 / 参数 |
|---|---|
| `push` | 缓慢推近（Ken Burns）：整个容器在一段时间里匀速放大一点点。参数 from、to、dur |
| `pan` | 缓慢平移。参数 x、y（总位移像素）、dur |
| `zoom-to` | 推到局部：把容器放大并平移，让目标区域占满画面。参数 to=#目标 或 x,y,w,h（容器内像素）、fill=占画面比例 |
| `zoom-reset` | 从局部拉回全景 |
| `tilt` | 3D 倾斜摆放并缓慢转动（悬浮的界面卡片）。参数 rx、ry 起始角度，rx2、ry2 结束角度 |
| `drift` | 背景缓慢漂移（模糊卡片墙、粒子层）。参数 x、y、rot、dur |
| `cam-shake` | 镜头震动（重击、报错） |
| `meteors` | 流星雨：一根根斜着划过的光线（Meteors），写在铺满的背景层上。参数 n、angle=方向角度（默认 135 = 往左下）、color、dur、seed |
| `marquee` | 跑马灯：一排内容无限循环地横向滚动（Marquee / LogoLoop）。写在一行的容器上，子元素会自动复制补满。参数 speed=每秒像素、reverse=1 反向 |
| `bg-scroll` | 背景图案滚动：让 background（网格、纹理、条纹）按速度持续平移，配 retro-grid 组件用。参数 x、y=每秒像素 |
| `parallax` | 视差：容器里的各层按前后顺序以不同速度平移（后面的层动得少、前面的层动得多），配 hills 层叠纸山用。写在容器上。参数 x、y=最前层的总位移、dur |

### 角色（5）

给立绘 / 小人用：换姿势、口型、点头、跳、走。

| 名字 | 作用 / 参数 |
|---|---|
| `pose` | 立绘换姿势：.host 里放多张 [data-pose] 图，硬切到 name 指定的那张（口播视频的立绘一般就是硬切）；bounce=1 加挤压回弹 |
| `lipsync` | 口型：在容器里多张 [data-mouth] 图之间每 frames 帧硬切一次（一般 2~4 帧），说完回到第一张。参数 dur、frames、seed |
| `talk` | 说话时的小幅上下点动。参数 dur=说多久、rate=每秒几下 |
| `hop` | 原地跳一下（惊讶、高兴）。参数 h=高度、n=次数 |
| `walk` | 走过去：水平移动 + 一步一颠。参数 x=位移 或 to=#目标、steps=步数；像素角色加 ease=steps(8) |

### 剪纸（10）

剪纸 / 纸艺拼贴风：展开、剪开、撕开、贴上、逐层升起，以及每秒 12 格的定格手工感。和 `theme-paper` 皮肤最配，但任何皮肤都能用。

| 名字 | 作用 / 参数 |
|---|---|
| `paper-unfold` | 纸张展开：像对折的纸从折痕处翻开摊平，带一点回弹。参数 dir=down/up/left/right（往哪边展开） |
| `cut-in` | 剪刀剪开：沿一条锯齿边一刀一刀地把元素「剪」出来，逐格推进有剪纸感。参数 dir=right/left/down/up、teeth=锯齿数、jag=锯齿深度（%）、snips=剪几刀 |
| `peel-in` | 卷角揭开：像贴纸从一个角翘起的状态落回原位按平。参数 corner=tl/tr/bl/br（从哪个角） |
| `layer-rise` | 逐层升起：容器里的纸层从后往前依次从下方升起，越靠前升得越晚、越远（层叠纸山、纸片舞台）。写在容器上。参数 dist、stagger |
| `stick-on` | 贴纸拍上：从镜头前方带着大投影拍到纸面上，落定时投影收紧（贴标签、贴照片）。参数 from=起始缩放、rot=起始歪斜角度 |
| `stop-in` | 定格入场：以每秒 12 格的定格动画节奏跳进来，每一格带一点随机歪斜（手工动画感）。参数 dist、steps=跳几格、fps、seed |
| `jitter` | 定格抖动：以每秒 12 格不停地微微歪动、挪动，像手工逐格拍出来的（boiling）。建议加在外层容器上，免得和入场动效抢位置。参数 amp=角度、px=位移、fps、dur |
| `lift` | 纸片抬起：往上浮起一点、投影变大变淡，像被手指捏起来；down=1 放回去。参数 dist |
| `flutter` | 飘动：像纸片被风吹了一下，左右摆几下慢慢停住。参数 deg、n=摆几下、origin |
| `sway` | 悬挂摇摆：挂着的东西（灯笼、吊牌、窗花）持续缓慢地左右摆。参数 deg、period=一个来回秒数、dur |

### 粒子（8）

画布粒子，需要额外加载 `fx-particles.js`。写在 `data-make="space"` 的画布容器上，每个动效是画布里的一层，按书写顺序从下往上叠。通用参数：`dur`（这一层持续多久）、`fade` / `out`（淡入淡出秒数）、`x` / `y`（中心位置百分比）、`seed`。

| 名字 | 作用 / 参数 |
|---|---|
| `starfield` | 星空：星星从远处朝镜头飞来（speed=0 时是静止闪烁的星空）。参数 n、speed、streak=拖尾长度（给 1 以上就是跃迁光束）、size、colors=色1/色2 |
| `nebula` | 星云：几大团柔和的彩色光雾缓慢漂移，垫在最底层当背景。参数 n=光团数、colors、alpha=浓度 |
| `vortex` | 粒子旋涡：粒子沿螺旋臂从中心涌向镜头，带发光的流线（时空隧道）。参数 arms=旋臂数、n、speed、twist=拧几圈、spin=整体旋转速度、r=外圈半径、colors（按旋臂交替）、lines=0 关掉流线 |
| `blackhole` | 黑洞：黑色圆盘 + 发光光环 + 倾斜的吸积盘，粒子内圈转得快、外圈转得慢，前半圈会从黑洞前面掠过。参数 r=黑洞半径、tilt=吸积盘压扁程度、rot=倾斜角度、n、speed、c1=内圈色、c2=外圈色 |
| `orb` | 能量球：由三角碎片拼成的发光球体，缓慢自转、内核发光；可以从散落的碎片聚拢成球，也可以炸开。参数 r=半径、detail=细分（1=80 片，2=320 片）、gap=碎片间隙、spin、in=聚拢秒数、explode=第几秒炸开、c1=亮面色、c2=暗面色、edge=描边色、core=内核色 |
| `burst` | 爆炸：一团粒子和三角碎片从中心炸开，带白闪和冲击波光环，越飞越慢最后消散。参数 n、power=力度、shards=碎片占比 0~1、life=持续秒数、colors、ring=0 关掉冲击波、flash=0 关掉白闪 |
| `form-text` | 粒子聚字：散落翻滚的小方块从四面八方飞来，拼成一行字（中英文都行）。参数 text=文字、size=字号、font、weight、color、n=最多多少粒、start=先飘多久、conv=聚拢秒数、glow=0 关掉字的光晕、spacing=字间距像素 |
| `stream` | 粒子流：一条条带拖尾的光点沿着起伏的流线横向穿过画面（数据流、信号）。参数 n、speed、amp=起伏幅度、waves=横向有几个波、tail=拖尾长度、colors、reverse=1 反向 |

### 组件（3）

配合 `data-make` 生成的组件使用。

| 名字 | 作用 / 参数 |
|---|---|
| `step` | 步骤导航切换：配 data-make="steps"，把第 i 个胶囊点亮（从 1 数），其余熄灭 |
| `chapter` | 章节进度条：配 data-make="chapters"，高亮块滑到第 i 章（从 1 数） |
| `check` | 清单打勾：配 .fx-check 组件，勾画出来、文字变实 |

### 转场（14）

写在**后一个**场景上：`<section class="scene" data-in="blur-cross(dur=0.5)">`。

| 名字 | 作用 / 参数 |
|---|---|
| `cut` | 硬切（默认）。最常用，节奏最快 |
| `fade` | 交叉淡化 |
| `blur-cross` | 模糊交叉：前一镜变模糊淡出，后一镜由模糊变清晰 |
| `zoom-through` | 缩放穿越：前一镜放大冲出画面，后一镜从小处放大到位 |
| `push` | 推移：新场景把旧场景顶出去。参数 dir=left/right/up/down |
| `wipe` | 擦除：新场景沿一个方向盖上来。参数 dir |
| `iris` | 圆形扩散：新场景从一个点扩成满屏。参数 x、y（百分比） |
| `flash` | 闪白（或任意色）切换：重点句、章节开头。参数 color |
| `dip` | 黑场过渡：先暗下去再亮起来（换话题）。参数 color |
| `pixelate` | 像素溶解：方块按随机顺序盖满画面再散开（像素风换场景）。参数 cols、color |
| `paper-slide` | 抽纸：新的一页纸从一侧滑进来盖住旧页，边缘带投影，旧页稍微压暗。参数 dir=left/right/up/down |
| `tear` | 撕纸：新画面沿一条参差的撕裂边从一侧露出来（剪纸风换场景）。参数 dir=right/left/down/up、jag、teeth |
| `glitch-cut` | 故障闪切：新画面带红蓝错位闪几下再稳定下来（科技感切换） |
| `open` | 开门：新画面从中间一条缝向两边拉开。参数 dir=x（左右拉开）/y（上下拉开） |
<!-- CATALOG:END -->
