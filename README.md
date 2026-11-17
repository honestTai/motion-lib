# motion-lib

**简体中文** · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md)

**HTML → 视频的声明式动效库。** 在元素上写一行 `data-fx="动效名@秒数"`，就能做出知识口播、科技解说这类视频里常见的动效，再用 [HyperFrames](https://hyperframes.heygen.com) 逐帧渲染成 MP4。

[![motion-lib 宣传片](promo/cover.jpg)](promo/motion-lib-promo.mp4)

> 上面的宣传片就是用这个库写的，源码在 [`promo/index.html`](promo/index.html)。

<!-- STATS:START -->
| | 数量 |
|---|---|
| 动效 | **76** 种（入场 24 · 退场 7 · 强调 24 · 数据 6 · 镜头 7 · 角色 5 · 组件 3） |
| 转场 | **10** 种 |
| 组件生成器 | **9** 个（`bars` `wave` `steps` `chapters` `ring` `wall` `dust` `line` `pixels`） |
| 皮肤 | **3** 套（白紫科技 · 黑金电影 · 像素复古） |
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
├── fx.css           基础样式、组件样式、三套皮肤
├── fonts/           优设标题黑、得意黑、Fusion Pixel 像素字体（许可见 fonts/README.md）
├── vendor/          GSAP 3.15（本地一份）
├── new-project.sh   把库装进一个视频项目（也用来更新）
├── chrome-tall.sh   渲染用 Chrome 包装（防止成片底部字幕被截掉）
├── gen-readme.mjs   从 fx.js 自动生成本文的数量表和动效目录（node gen-readme.mjs）
├── demo/            演示页：6 个场景，三套皮肤都用到
├── promo/           宣传片源码 + 成片
└── examples/        三套皮肤各一条完整示例片 + 合集
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

三套皮肤各做了一条完整示例（纯动效、无配音），源码就在对应目录里，可以直接改着用：

| 皮肤 | 示例 | 源码 |
|---|---|---|
| 白紫科技 `theme-violet` | [![violet](examples/violet/cover.jpg)](examples/violet/violet.mp4) | [`examples/violet/index.html`](examples/violet/index.html) |
| 黑金电影 `theme-gold` | [![gold](examples/gold/cover.jpg)](examples/gold/gold.mp4) | [`examples/gold/index.html`](examples/gold/index.html) |
| 像素复古 `theme-pixel` | [![pixel](examples/pixel/cover.jpg)](examples/pixel/pixel.mp4) | [`examples/pixel/index.html`](examples/pixel/index.html) |

三条合在一起：[`examples/showreel.mp4`](examples/showreel.mp4)。

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

`pop: true` 时每句字幕会轻轻上浮出现；默认是硬切，口播视频一般就是硬切。

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

## 三套皮肤

在根元素上换一个 class，整片换风格：

| class | 风格 | 底色 | 标题字 | 强调色 | 适合 |
|---|---|---|---|---|---|
| `theme-violet` | 白紫科技 | 白 `#fdfdfd` / 深 `#171719`（场景加 `dark` / `light` 切换） | 优设标题黑 | 紫 `#8453e8` / 浅紫 `#d5befe` | AI 工具、效率、工作流讲解 |
| `theme-gold` | 黑金电影 | 深蓝黑 `#080a0f` + 模糊实拍 + 暗角 | 金色渐变斜体 | 金 `#e4b256`，红 `#ff5b56` 只给下跌 | 财经、行业分析、榜单 |
| `theme-pixel` | 像素复古 | 米色网点纸 `#efe9dc` | Fusion Pixel 像素字 | 绿 `#9fe07a` · 红 · 黄 | 动漫主持人、轻松科普 |

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

## 许可

- 代码：[MIT](LICENSE)。
- GSAP：使用 GreenSock 的 [Standard License](https://gsap.com/standard-license)（免费，含商用）。
- 字体：见 [fonts/README.md](fonts/README.md)。

<!-- CATALOG:START -->
## 动效目录（76 种动效 + 10 种转场）

> 这一节由 `node gen-readme.mjs` 从 `fx.js` 自动生成，不要手改。
> 所有动效都支持通用参数 `dur`（时长）、`ease`（缓动）、`stagger`（错峰）；下表只列各自特有的参数。

### 入场（24）

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

### 退场（7）

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

### 强调（24）

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

### 镜头（7）

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

### 角色（5）

给立绘 / 小人用：换姿势、口型、点头、跳、走。

| 名字 | 作用 / 参数 |
|---|---|
| `pose` | 立绘换姿势：.host 里放多张 [data-pose] 图，硬切到 name 指定的那张（口播视频的立绘一般就是硬切）；bounce=1 加挤压回弹 |
| `lipsync` | 口型：在容器里多张 [data-mouth] 图之间每 frames 帧硬切一次（一般 2~4 帧），说完回到第一张。参数 dur、frames、seed |
| `talk` | 说话时的小幅上下点动。参数 dur=说多久、rate=每秒几下 |
| `hop` | 原地跳一下（惊讶、高兴）。参数 h=高度、n=次数 |
| `walk` | 走过去：水平移动 + 一步一颠。参数 x=位移 或 to=#目标、steps=步数；像素角色加 ease=steps(8) |

### 组件（3）

配合 `data-make` 生成的组件使用。

| 名字 | 作用 / 参数 |
|---|---|
| `step` | 步骤导航切换：配 data-make="steps"，把第 i 个胶囊点亮（从 1 数），其余熄灭 |
| `chapter` | 章节进度条：配 data-make="chapters"，高亮块滑到第 i 章（从 1 数） |
| `check` | 清单打勾：配 .fx-check 组件，勾画出来、文字变实 |

### 转场（10）

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
<!-- CATALOG:END -->
