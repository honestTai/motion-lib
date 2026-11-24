# motion-lib 全量动效与转场目录（282 种动效 + 24 种转场）

> [← 返回主文档 README.md](../README.md)
> 本文件由 `node scripts/gen-readme.mjs` 从 `src/` 自动生成，请勿手改。
> 所有动效均支持通用参数 `dur`（时长）、`ease`（缓动）、`stagger`（错峰）；下表仅列各动效特有参数。

## 组件生成器一览（76 个 `data-make`）

`bars` · `wave` · `steps` · `chapters` · `ring` · `wall` · `dust` · `line` · `pixels` · `circle-text` · `retro-grid` · `papercut` · `hills` · `torn` · `switches` · `space` · `stage3d` · `tunnel` · `helix` · `flipboard` · `fan` · `slices` · `road` · `bignum` · `segments` · `actor` · `puppet` · `backdrop` · `device` · `menu` · `mini` · `house` · `letterbox` · `chat` · `terminal` · `code` · `agent` · `surround` · `hub` · `shape` · `phone3d` · `card3d` · `box3d` · `layers3d` · `deck3d` · `wall3d` · `flap3d` · `letterdeck` · `sleeve3d` · `carousel3d` · `slabs3d` · `coins3d` · `timeline3d` · `paperstack` · `callouts3d` · `youarehere` · `calgrid3d` · `ctabar` · `steplist3d` · `blueprint3d` · `gallery3d` · `corridor3d` · `stepchain3d` · `monolith3d` · `chip3d` · `laptop3d` · `keycap3d` · `rack3d` · `prism3d` · `gyro3d` · `iceberg3d` · `domino3d` · `scale3d` · `funnel3d` · `vault3d` · `pyramid3d`

---

## 入场（26）

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

## 退场（10）

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
| `scatter-out` | 四散弹飞：元素向四周带着旋转与抛物线重力炸飞清场（适合一键清理、破除误区）。参数 power=力度、dur、seed |

## 强调（41）

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
| `circuit` | 直角电路连接：在两个元素之间画横平竖直的折线电路并传输发光脉冲包（适合架构图、MCP 协议流）。写在起点上，to=#终点。参数 mid=折弯比例、packets=脉冲数、color、dur |
| `overload` | 过载红温警报：元素高频急促抖动 + 红光闪烁（适合上下文爆满、算力过载、报错）。参数 amp=幅度、color、dur、seed |
| `scan` | 激光扫描线：一道发光扫描带扫过窗口或卡片（适合代码读取、文档检索、图表诊断）。参数 dir=down/right、color、n=次数、dur |
| `callout` | 折线引线批注：从元素边缘拉出折线引线并弹出文字标签（适合图表峰值、重点数据旁注）。参数 text=文字、dx、dy、color |

## 文字（9）

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

## 数据（7）

数字、进度、图表类。数字类动效会自动保留小数位和千分位。

| 名字 | 作用 / 参数 |
|---|---|
| `count` | 数字滚动。元素里写最终数字，或用 to= 指定；from= 起始值。自动保留小数位和千分位 |
| `roll` | 数字逐位竖向翻滚：每一位是一条 0~9 的竖带，带模糊滚动后从左到右依次停靠（黑金款的 $7,000）。参数 dur、stagger、spins=多转几圈 |
| `clock` | 时钟拨动：from=23:28 拨到 to=01:23（会自动跨天） |
| `fill` | 进度条填充：把元素宽度（或 dir=y 时高度）从 from% 补到 to% |
| `ring` | 圆环进度：配 data-make="ring"。参数 from、to（0~1） |
| `wave-live` | 波形跳动：配 data-make="wave"，每根条按种子随机起伏。参数 dur、seed |
| `reorder` | 榜单换名次：一列（或一行）子元素按新顺序滑到各自的新位置，上升的那个略微放大、带一点高光。写在列表容器上。参数 order（新顺序，写原来的序号，用 / 隔开，如 3/1/2）、dur（默认 0.8） |

## 镜头（14）

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
| `cam` | 一镜到底里，房间内的镜头运动：平移、推近、虚化背景。写在分镜上。参数 x / y（画面像素，正数往右 / 往下看）、z（推近倍数，1 是原位）、blur（背景虚化像素）、to=#元素（对准它，pull=0.5 走一半）、reset=1 回正、dur |
| `shot` | 一镜到底里，分镜中途换机位：镜头推进某个房间，或拉回楼外全景。写在分镜上。参数 room=房间号/all、dur |
| `push-into` | 推进画里：元素先以相框大小出现，镜头推进去直到它铺满全屏，停住，再拉出来。写在分镜里一张绝对定位的图上（left/top/width/height）。参数 dur（从开始推到拉完的总秒数）、in / out（推、拉各用多久）、cast=keep（角色不让开）、stay=1（拉出来后相框留着） |

## 角色（25）

给立绘 / 小人用：换姿势、口型、点头、跳、走。

| 名字 | 作用 / 参数 |
|---|---|
| `pose` | 立绘换姿势：.host 里放多张 [data-pose] 图，硬切到 name 指定的那张（口播视频的立绘一般就是硬切）；bounce=1 加挤压回弹 |
| `lipsync` | 口型：在容器里多张 [data-mouth] 图之间每 frames 帧硬切一次（一般 2~4 帧），说完回到第一张。参数 dur、frames、seed |
| `talk` | 说话时的小幅上下点动。参数 dur=说多久、rate=每秒几下 |
| `hop` | 原地跳一下（惊讶、高兴）。参数 h=高度、n=次数 |
| `walk` | 走过去：水平移动 + 一步一颠。参数 x=位移 或 to=#目标、steps=步数；像素角色加 ease=steps(8) |
| `rig-idle` | 柔性待机呼吸：驱动任意绑定角色的自然胸腔呼吸、发丝微摆与按种子随机眨眼。参数 dur、seed |
| `rig-pose` | 柔性切换姿态：按预设名或手部 IK 坐标(lx,ly,rx,ry)平滑过渡，连续贝塞尔袖管自动弯曲无接缝。参数 pose、lx/ly/rx/ry、look、face、emote、dur |
| `rig-talk` | 多口型语音同步：按种子在多套 [data-viseme] 口型间自然切换并附带微点头，说完自动回到当前表情嘴。参数 dur、frames、nod=1、seed |
| `rig-nod` | 柔性点头/摇头：驱动颈部枢轴并自动触发发丝呆毛次级弹簧摆动。参数 shake=1（摇头）、n、amp、dur |
| `rig-wave` | 柔性挥手：在指定软肢体(arm=R/L)的手部 IK 目标上叠加圆弧往复挥动，整条袖管自然连动。参数 arm=R/L、n、amp、dur |
| `vrm3d` | 加载真 3D 二次元 VRM 角色（FX.ik3d 双骨逆解 + 6 节脊柱波 + 五元音口型 + 腮红漫符 + 头发物理），写在 stage3d 上。参数 src=shino/vita/路径、headscale=Q版头身比(默认1.20)、ry、x/y/z、breathe/blink/sway/spring |
| `vrm-pose` | 切换 3D VRM 角色 IK 姿态、表情、视线与漫符：pose=idle/wave/explain/point/point-up/think/shock/clasp/reject/shrug/proud/cheer/bow（也支持 lx/ly/lz/rx/ry/rz 自定义手腕 3D IK 坐标），expr=neutral/happy/relaxed/angry/sad/surprised，emote=sweat/question/idea/anger/sparkle/excl，look=cam/right/left/up/down |
| `vrm-talk` | 驱动 3D VRM 角色五元音口型（aa/ih/ou/ee/oh）并联动口播音节手势节拍：dur=说话秒数、rate=音节速率、amp=张嘴幅度、seed |
| `vrm-nod` | 给 3D VRM 角色叠加点头、摇头或歪头动作：kind=nod/shake/tilt、n=次数、amp=幅度、dur |
| `vrm-move` | 移动 3D VRM 角色位置（如从画面底部轻快弹出登场或横向小步让位）：x/y/z、fromY=起始高度、dur、ease |
| `vrm-anim` | 播放标准 .vrma (VRM Animation) 3D 动作捕捉片段并自动叠加口型与眨眼：src=文件路径、dur |
| `call` | 把演员叫到这个元素旁边（讲到它时用）：演员在原地蹲下，从这个元素旁边重新冒出来。写在被讲的元素上；写在 <section> 上是回到演员自己的 home。参数 who（演员名）、at=top/left/right/below（默认 top：从元素上沿探出来）、size（默认 top 340 / 其他 420）、align（at=top 时靠左还是靠右，0–1，默认 0.82）、dx、dy、flip=1（水平翻转，让他面向内容）、pose（同时换姿势） |
| `closeup` | 脸部特写（反应镜头）：硬切到这个演员的大脸，背景换成放射线底色，停一下再硬切回去。用现有的半身立绘就能做，不需要新素材。写在 <section> 的 data-fx 里。参数 who（演员名）、dur（停多久，默认 1.1）、pose（特写时的姿势 / 表情）、kind（同时弹出的情绪符号）、color（底色，默认橙色；可写 red / blue / green / purple）、size（放大到多大，默认 1300） |
| `dismiss` | 让演员蹲下离开画面（要把整块画面让给内容时用）。参数 who |
| `pup-talk` | 立绘说话：按口型序列换嘴，头跟着音量轻轻摆动。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 dur（说多久，默认到分镜结束）；口型序列取 FX.mouthTrack = { fps, frames }（由配音工具生成），没有就按音节节奏自动生成 |
| `pup-pose` | 立绘换姿势（硬切，换的瞬间自动眨眼并轻轻弹一下）。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 pose（姿势名）、pop=0（不要弹） |
| `pup-nod` | 立绘点一下头（听的人应和、说的人强调）。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 amp（幅度，默认 1） |
| `pup-lean` | 立绘整个人朝一侧倾斜（听对方说话时朝对方倾）。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 deg（度数，正数向右，0 = 回正）、dur |
| `pup-emote` | 立绘头顶弹出手绘情绪符号。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 kind=question/exclaim/sweat/anger/sparkle/idea/heart/zap/dots、hold（停留秒数，默认 1.6） |
| `pup-idle` | 只让立绘活着（眨眼、呼吸、头部慢晃），不说话。写在 data-make="puppet" 上；用了 pup-talk / pup-nod / pup-lean / pup-emote 中任何一个就不需要再写它 |

## 剪纸（10）

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

## 粒子（8）

画布粒子，需要额外加载 `fx-particles.js`。写在 `data-make="space"` 的画布容器上，每个动效是画布里的一层，按书写顺序从下往上叠。通用参数：`dur`、`fade` / `out`、`x` / `y`、`seed`。

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

## 3D（37）

真 3D 场景、工业硬件拆解与口播黄金叙事连招（three.js），加载 `vendor/three-fx.min.js` 后配合 `fx-3d.js`（深空星系/隧道/城市舞台 `stage3d`）、`fx-showcase3d.js`（五层芯片 `chip3d`、笔记本 `laptop3d`、机械轴 `keycap3d`、机柜 `rack3d`、色散棱镜 `prism3d`、万向陀螺 `gyro3d`）或 `fx-narrative3d.js`（冰山深潜 `iceberg3d`、骨牌护盾 `domino3d`、双盘天平 `scale3d`、提纯漏斗 `funnel3d`、装甲金库 `vault3d`、认知金字塔 `pyramid3d`）。

| 名字 | 作用 / 参数 |
|---|---|
| `stars3d` | 3D 星空：一大团星星散布在空间里，镜头移动时有远近层次。参数 n、r=分布半径、size、colors |
| `galaxy3d` | 旋涡星系：几万个粒子排成旋臂绕中心转，内圈快外圈慢。参数 n、arms=旋臂数、r=半径、inner=中心留空半径、spin=转速、twist=旋臂弯曲程度、colors（按旋臂交替）、size、bright |
| `orb3d` | 立体能量球：带真实光照的金属三角碎片拼成的球，内核发光；可以从散落的碎片聚拢成球，也可以炸开。参数 r=半径、detail=细分（1=80 片，2=320 片）、gap=碎片间隙、spin、in=聚拢秒数、explode=第几秒炸开、power=炸开力度、color=碎片色、emissive=自发光色、core=内核色 |
| `tunnel3d` | 粒子隧道：粒子和光环排成一条隧道朝镜头涌来（把摄像机放在隧道里朝里看）。参数 n、r=隧道半径、len=长度、speed、twist=螺旋程度、rings=光环数（0 不要）、colors |
| `waves3d` | 波浪点阵：一大片点组成的地面像水面一样起伏。参数 nx / nz=点数、w / d=宽和深、amp=浪高、freq=浪的密度、speed、c1=低处色、c2=高处色 |
| `globe3d` | 点阵球：由点组成的球体缓慢自转，表面有光弧在两点之间飞过（全球网络、数据连接）。参数 r=半径、n=点数、arcs=光弧数、spin、color=点的颜色、arc=光弧颜色 |
| `blackhole3d` | 立体黑洞：黑色球体 + 始终朝向镜头的光环 + 粒子吸积盘，镜头可以绕着它转。参数 r=黑洞半径、n、disk=吸积盘外半径（r 的倍数）、speed、c1=内圈色、c2=外圈色 |
| `burst3d` | 立体爆炸：几万个粒子从中心朝四面八方炸开，越飞越慢，带一次强闪光。参数 n、power=力度、life=持续秒数、colors |
| `text3d` | 立体粒子字：空间里的粒子从四面八方聚成一行有厚度的字，镜头可以绕着看（中英文都行）。参数 text、w=字在场景里的宽度、depth=厚度层数、start=先飘多久、conv=聚拢秒数、color、n=最多多少粒、font、weight、scatter=散开半径 |
| `city3d` | 城市：一条大街两旁的楼群，窗户发光、楼体有描边、路上有车灯流动，尽头可以放一轮落日。配 cam3d 让镜头沿街飞行。街道沿 -z 方向延伸。参数 rows=纵深几排、cols=每侧几列、road=路宽、lit=亮窗比例、colors=窗户颜色、wall=墙面色、edge=描边色（edge=0 不描边）、sun=落日颜色（sun=0 不要）、traffic=0 关掉车流 |
| `cam3d` | 移动摄像机：从当前位置飞到新位置，同时把视线转向新目标。参数 x / y / z=飞到哪、lx / ly / lz=看向哪、fov=视角、dur、ease（dur=0 就是直接切过去）。没写的参数保持不变 |
| `orbit3d` | 环绕镜头：摄像机绕着目标转圈，可以同时拉近 / 升高。参数 turn=转多少度（负数反向）、from=起始角度（不写就从当前位置开始）、r=结束时离目标多远、h=结束时的高度、lx / ly / lz=绕着哪里转、dur、ease |
| `chip-explode` | 苹果发布会风 3D 芯片五层爆炸拆解：写在 data-make="chip3d" 上，镀金 BGA 触点、纤维基板、发光神经网络晶圆、CNC 铝合金环与拉丝钛盖沿轴向磁悬浮逐层拉开，并自动弹出三维锚点引线标签。参数 dur（默认 1.4）、spread（默认 1）、spin（旋转度数，默认 18） |
| `chip-assemble` | 3D 芯片算力脉冲合拢：写在 data-make="chip3d" 上，硅晶核心爆发流光脉冲后五层精密封装磁吸归位闭合。参数 dur（默认 1.1） |
| `laptop-open` | 3D 超薄铝金属笔记本转轴开盖点亮：写在 data-make="laptop3d" 上，绕真实后转轴缓缓掀开顶盖至 102°，高清屏幕亮起并将环境光投射到 65 颗实体键帽上。参数 dur（默认 1.5）、open（0..1，默认 1）、turn（机身旋转度数，默认 22） |
| `laptop-close` | 3D 笔记本合盖归位：写在 data-make="laptop3d" 上，顶盖绕转轴平滑合拢。参数 dur（默认 1.1） |
| `key-press3d` | 客制化机械轴微距清脆敲击：写在 data-make="keycap3d" 上，球面键帽与十字轴心下压、镀金三维螺旋弹簧真实物理压缩，触发底部导光冲击波后快速回弹（多键联排时自动错峰连敲）。参数 dur（默认 0.55）、stagger（默认 0.14） |
| `key-explode3d` | 机械轴五层微距纵向拆解：写在 data-make="keycap3d" 上，将球面键帽、冰透上盖、暖橙十字轴心、镀金螺旋弹簧与烟熏底壳在空中等距悬停分解。参数 dur（默认 1.3）、spread（默认 1） |
| `rack-boot3d` | AI 算力机柜逐层点火与光纤流：写在 data-make="rack3d" 上，4 台服务器刀片自下而上依次点亮 OLED 负载屏与状态灯，两侧光纤涌入能量脉冲。参数 dur（默认 1.5） |
| `blade-slide3d` | 服务器热插拔刀片抽出特写：写在 data-make="rack3d" 上，将第 i 号服务器刀片（1..4；i=0 全部推回）沿机柜导轨平滑向前抽出展示。参数 i（默认 2）、dist（默认 0.92）、dur（默认 0.9） |
| `prism-split3d` | 光学水晶三棱镜激光色散分束：写在 data-make="prism3d" 上，入射白光击中悬浮水晶棱镜点亮八面体晶核，并在右侧折射展开为多路彩色光谱束与路由标签。参数 dur（默认 1.6） |
| `gyro-spin3d` | 三轴万向陀螺中枢差速运转：写在 data-make="gyro3d" 上，外刻度环、中轴承环、镀金内环与中心晶核沿正交三轴无死锁旋转，卫星节点环绕运行。参数 dur（默认 4.0）、speed（默认 1） |
| `gyro-lock3d` | 万向环同心归零磁吸锁定：写在 data-make="gyro3d" 上，三道高速运转的金属万向环瞬间归零对齐并向外扩散能量冲击环。参数 dur（默认 0.95） |
| `showcase-orbit` | 3D 硬件展台长焦环绕推镜：配合 chip3d / laptop3d / keycap3d / rack3d / prism3d / gyro3d 平滑切换俯仰角、水平转角与推进倍率。参数 rx、ry、zoom（默认 1.18）、dur（默认 1.5） |
| `ice-tip3d` | 冰山模型第 1 拍·海面表象特写：写在 data-make="iceberg3d" 上，平视贴近波光折射海平面，仅展示水面上方 10% 洁白冰尖与表象引线（data-tip）。参数 dur（默认 1.2） |
| `ice-dive3d` | 冰山模型第 2 拍·穿水深潜真相：写在 data-make="iceberg3d" 上，镜头俯冲穿透海平面潜入深海，点亮水下 90% 三层庞大晶脉巨体并依次展开深层逻辑引线（data-depths）。参数 dur（默认 1.8） |
| `domino-fall3d` | 多米诺连锁第 1 拍·骨牌雪崩跟拍：写在 data-make="domino3d" 上，多块印有因果词的 3D 倒角骨牌（data-tiles）逐块撞击倾倒，摄影机沿弧线实时跟拍倒塌波前。参数 dur（默认 1.8） |
| `domino-shield3d` | 多米诺连锁第 2 拍·护盾砸落截停：写在 data-make="domino3d" 上，重型发光金属护盾闸门从天而降插入骨牌间隙，硬生生弹停连锁崩塌，守护最后一块核心骨牌（data-shield）。参数 dur（默认 1.1） |
| `scale-drop3d` | 双盘天平第 1 拍·重锤先发压盘：写在 data-make="scale3d" 上，传统沉重暗铁巨块砸入左盘（data-left），双吊盘保持真实重力铅垂摆动、表盘指针大幅左偏。参数 dur（默认 1.2） |
| `scale-flip3d` | 双盘天平第 2 拍·金核四两拨千斤反杀：写在 data-make="scale3d" 上，高能发光晶核落入右盘（data-right）迸发冲击光环，瞬间压倒左盘巨块完成逆转反超。参数 dur（默认 1.4） |
| `funnel-pour3d` | 提纯漏斗第 1 拍·万千噪点涡流吸入：写在 data-make="funnel3d" 上，俯拍多色原始碎块呈三维龙卷涡流高速旋入三层反向涡轮滤环。参数 dur（默认 1.5） |
| `funnel-distill3d` | 提纯漏斗第 2 拍·层层过滤凝结金核：写在 data-make="funnel3d" 上，镜头顺漏斗下移，海量噪点逐层淘汰归零，底部凝结悬停唯一高纯度黄金核心并弹出三阶转化引线（data-stages）。参数 dur（默认 1.6） |
| `vault-unlock3d` | 重型金库第 1 拍·双棘轮咬合破译：写在 data-make="vault3d" 上，特写装甲门中央内外双层金属密码轮反向高速旋转对齐，六道铬合金锁舌缩回、状态灯变绿。参数 dur（默认 1.3） |
| `vault-open3d` | 重型金库第 2 拍·重门洞开揭秘底牌：写在 data-make="vault3d" 上，超厚装甲门绕左侧铰链推开 98°，金色体积光倾泻而出，镜头直推门内浮现核心公式石碑（data-secret）。参数 dur（默认 1.6） |
| `pyramid-build3d` | 认知金字塔第 1 拍·三阶磁吸筑基：写在 data-make="pyramid3d" 上，镜头自低向高跟拍 L1–L3 三层阶梯方台逐级落定并点亮正面段位铭牌（data-tiers）。参数 dur（默认 1.6） |
| `pyramid-crown3d` | 认知金字塔第 2 拍·塔尖晶冠加冕俯瞰：写在 data-make="pyramid3d" 上，高透水晶顶冠降临塔尖迸发金光，镜头拉远环绕定格四层全局段位引线。参数 dur（默认 1.5） |
| `narrative-cam3d` | 口播 3D 叙事展台自定义推拉环绕运镜：配合 iceberg3d / domino3d / scale3d / funnel3d / vault3d / pyramid3d 叠加俯仰角 rx、水平角 ry、推进倍率 zoom 与视点高度 lookY。参数 dur（默认 1.4） |

## 立体（40）

白底立体影棚、白格牌桌与暖白无影展厅动效，加载 `fx-desk3d.js`（配 `theme-white3d` / `theme-white3d desk`）或 `fx-gallery3d.js`（配 `theme-white3d gallery` + Three.js 真 3D 倒角 `.glb` 模型）。姿态与台面接触投影随空间高度实时联动。

| 名字 | 作用 / 参数 |
|---|---|
| `pose-3d` | 立体姿态推演：把 phone3d / card3d / box3d 或普通卡片推到指定 3D 倾角与高度，台面投影随高度拉远扩散。参数 ry / rx / rz（角度）、z（抬升高度 px）、s（缩放）、x / y、dur |
| `flip-3d` | 真 3D 腾空翻面：把 card3d（或带 .front / .back 的双面徽章）跃起抬高 Z 轴、空中翻转 180° 后落回白底桌面，翻到 90° 时投影拉远变柔、落地收紧。参数 lift（默认 110）、dur（默认 0.72） |
| `deal-arc` | 厚牌堆弧形发牌：写在 data-make="deck3d" 上，牌从厚牌堆顶上一张接一张沿 3D 马蹄弧或扇形滑到位。参数 dur（默认 1.15） |
| `deck-gather` | 散牌交错收拢归堆：写在 data-make="deck3d" 上，把铺开的弧形/马蹄牌阵重新收拢叠回一整摞整齐的厚牌砖。参数 dur（默认 0.85） |
| `letter-shuffle` | 单字扑克牌阵洗牌变色：写在 data-make="letterdeck" 上，各张字牌轻弹排齐，花括号标的重点字牌腾空翻转染红并微倾。参数 dur（默认 0.55） |
| `sleeve-draw` | 牌盒开口滑出厚牌：写在 data-make="sleeve3d" 上，外层立体黑盒向左滑让，内部整摞厚牌向右抽出并扇开首张。参数 dur（默认 0.9） |
| `grid-hero` | 多宫格牌阵越级放大：从一排或九宫格卡片里把第 i 张（从 1 数；i=0 收回）沿 Z 轴高高托起居中放大，其余卡片退后柔化托底。参数 i、s（默认 1.65）、dur |
| `carousel-next` | 台面拍立得连切轮播：写在 data-make="carousel3d" 上，主展卡左滑退场、右侧倾斜预告卡扶正入主位，底部手牌同步微动。参数 i（切到第几张，从 1 数）或 steps（连切几张）、dur |
| `card-storm` | 3D 卡片螺旋风暴：容器内多张卡片在三维空间沿螺旋轨道高速飞舞，前景卡片带景深虚化掠过镜头（适合「信息爆炸 / 海量素材」）。参数 dur（默认 2.6）、r（半径，默认 320） |
| `box-drop` | 立体盒重力落桌：六面体 box3d 从高处带微倾砸落白底桌面，落地微弹稳住、接触投影压实。配 each: 可错峰落下。参数 drop（默认 220）、dur（默认 0.68） |
| `slab-shatter` | 3D 厚石碑多米诺撞碎：写在 data-make="slabs3d" 上，厚板依次向右侧多米诺倾倒撞击，随后炸裂成数十块 3D 厚碎片飞散。参数 dur（默认 1.35） |
| `coin-drop` | 3D 立体筹码/金币抛洒弹跳：写在 data-make="coins3d" 上，带圆边厚度的金币从空中翻滚落下弹跳，接触影同步收紧。参数 dur（默认 0.78） |
| `polaroid-eject` | 拍立得相纸吐出 + 进度条读满：card3d 相纸从上方卡槽滑出微倾落位，底部进度条同步推进到 100%。参数 dur（默认 0.9） |
| `layer-explode` | 三维爆炸展开：写在 data-make="layers3d" 上，原本压合的多层透视平板沿垂直轴拉开间距，四角虚线辅助线与左侧水平引线同步生长。参数 dur（默认 0.9） |
| `layer-focus` | 分层点亮聚焦：写在 data-make="layers3d" 上，抬高并点亮第 i 层（从底往上 1..N；i=0 全部恢复），其余层柔和退让。参数 i、dur |
| `board-lay` | 面板后仰变 3D 时间轴：写在 data-make="timeline3d" 上，正对镜头的面板向后仰倒 56° 铺成桌面轨道，内部视频卡片同步立起并滑过红色剪辑指针。参数 dur（默认 1.2） |
| `stack-print` | 白纸复印叠厚 + 衰减条联动：写在 data-make="paperstack" 上，一张张白纸连续飞入叠高，底部新鲜感/注意力进度条同步跌落到 to%。参数 to（默认 62）、dur（默认 1.4） |
| `lock-callouts` | 四角取景框锁定 + 多分支引线展开：写在 data-make="callouts3d" 上，橙色取景角标收缩锁死主体，左侧多条水平引线与卖点词依次打出。参数 dur（默认 0.7） |
| `pin-move` | 全片路标游标推进：写在 data-make="youarehere" 上，红色 YOU ARE HERE 游标从 from 滑到 to（0–1 百分比小数），经过的分段色块同步点亮。参数 from、to、dur |
| `wall-pull` | 立体卡片墙拉远/推进：写在 data-make="wall3d" 上，从单张正对特写平滑拉远并倾斜俯视整面 3D 悬浮卡片墙（dir=in 则反向推进）。参数 dur（默认 1.25）、zoom（默认 2.3） |
| `rig-focus` | 多样机立体移焦：写在放了多台样机/多栏盲测的容器上，讲到第 i 件（1..N；i=0 恢复同台全景）时它朝镜头转正并前推放大，其余侧转退后。参数 i、s（默认 1.06）、dur |
| `phone-split` | 真机居中特写分身双栏：容器内第 1 件（3D 手机）先在画面中央侧转大特写，到点后横移归位并展开旁边的横屏副卡。参数 dur（默认 0.78） |
| `screen-pop` | 屏幕内局部切片剥离放大：把手机或截图旁的取证行（.fx-pop-slice 或 to=#选择器）沿 Z 轴剥离浮出屏幕外放大，带深层悬空投影。参数 to、s（默认 1.18）、dur |
| `phone-wave` | 多色竖屏真机阵列波浪排开：写在放了一排 phone3d 的容器上，多台手机像多米诺波浪一样依次立起转角陈列。参数 dur（默认 0.65）、stagger（默认 0.08） |
| `float-pop` | 白底悬浮弹出：评语胶囊（.fx-float-pill）或打分卡（.fx-score-card）从贴地微缩状态沿 Z 轴弹起悬浮，撑开柔和影棚空气阴影。参数 dur（默认 0.46） |
| `flap-to` | 机械翻牌跳字：写在 data-make="flap3d" 上，把每位翻牌格机械折页翻到 to（千分位逗号在参数里可写下划线如 10_000+）指定的新文本。参数 to、dur（默认 0.36）、stagger（默认 0.06） |
| `cal-flip` | 30 天日历翻牌矩阵 + 数字狂飙：写在 data-make="calgrid3d" 上，全部小蓝牌按天依次翻成红头黑底日历格，顶部指标同步从 0 滚到 to。参数 to（默认 18862）、dur（默认 1.6） |
| `bubble-pop3d` | 手机聊天气泡破框悬浮弹出：多条对话气泡（.fx-pop-bub）从倾斜的手机屏幕里逐层跃出到半空 Z 轴，带独立深投影。配 each: 可逐条蹦出。参数 dur（默认 0.5） |
| `cta-click` | 白底交互胶囊光标点击 + 爆彩带：写在 data-make="ctabar" 上，鼠标飞入按下按钮（点赞变已关注 / 点击发送）并炸出庆祝彩片。参数 dur（默认 0.9） |
| `desk-invert` | 白格桌面 ⇄ 暗黑金格反相：在讲反面痛点（如资本垄断）时把白格桌面瞬间切换为深色暗金网格，mode=reset 恢复白格桌面。参数 mode=dark/reset |
| `step-focus` | 白底步进流水线移焦：写在 data-make="steplist3d" 上，推进并高浮起点亮第 i 步（1..N；i=0 全亮汇总），已完成步骤打勾、未开始步骤柔和退让。参数 i、dur（默认 0.42） |
| `blueprint-scan` | 抄作业蓝图卡取景框锁定：写在 data-make="blueprint3d" 上，四角裁切角标从外向内卡位锁死，内部步骤条目依次点亮。参数 dur（默认 0.65） |
| `check-fix` | 质检报错当场翻转自修：把报错状态行（.fx-check-row.is-bad）沿 X 轴立体翻转成绿勾通过状态（.is-good），同步更新文案。参数 badge（默认 ✓ 已修复）、after（修复后说明）、dur（默认 0.52） |
| `pop-3d` | 白底立体弹射跳出：卡片、组件或 3D 样机从桌面深处带俯仰倾角「唰」一下弹射跃起到位（支持 each: 错峰连续跳出），带回弹落定与接触影联动。参数 dur（默认 0.44）、stagger（默认 0.14）、fromY（默认 64） |
| `corridor-fly` | 3D 暖白展厅画框长廊穿梭定焦：二十余幅真 3D 倒角画框高低错落悬浮于无影展厅，摄像机沿纵深高速穿过近景大光圈虚化画廊并平稳落定在中央英雄画框上。参数 dur（默认 3.8） |
| `hero-split3d` | 英雄画框侧旋剥离玻璃层与选区框：中央 3D 画框右移侧倾，背后展开双层磨砂玻璃背板与 8 锚点 CAD 选区线框，下方浮出 3D 胶囊进度轨并同步揭示左侧大标题。参数 dur（默认 1.7） |
| `step-track3d` | 3D 竖版白瓷步骤卡滑轨跟拍与跳线传导：摄影机沿横向滑轨逐张推过 3D 竖版白瓷厚卡，每张卡侧旋立定的同时底部生长三维朱橙悬链弧线与发光领跑圆球。参数 dur（默认 3.8） |
| `step-overview3d` | 3D 步骤竖卡阵列拉远全景陈列：摄影机平滑拉远居中，将全部 3D 白瓷步骤竖卡、底部完整朱橙跳线链与地面接触阴影同框尽收眼底，并浮现左上眉题。参数 dur（默认 1.4） |
| `monolith-rise3d` | 五卡上移树状汇总与 3D 倒角白瓷巨碑翻起：步骤卡收拢至顶排并分叉出橙色树状引线与胶囊标签，前景厚重双层倒角白瓷巨碑从地面平躺有力翻起立定、生长底线并展开底部分支签。参数 dur（默认 3.6） |
| `gallery-cam3d` | 展厅 3D 摄像机自定义推拉摇移：在任意时刻微调 gallery3d 展厅机位。参数 x、y、z、lx、ly、fov、dur（默认 1.2） |

## 空间（21）

世界画布、相机和图片组动效，需要额外加载 `fx-world.js`。根元素写上 `data-world`，所有分镜就变成同一块大画布上的机位，换分镜 = 镜头走过去。

| 名字 | 作用 / 参数 |
|---|---|
| `cam-look` | 镜头推到机位里的某个元素上（念到它时用），讲完用 cam-home 拉回。参数 to（选择器，不写就是自己）、fit（推到它占画面多大，默认 0.6）、max（最多放大几倍，默认 1.4）、dur |
| `cam-home` | 镜头回到本机位的全景（cam-look 之后用）。参数 dur |
| `cam-wide` | 镜头拉远看到整块画布（开场总览、结尾回顾）。写成 cam-wide@0 时全片从总览开始，再用 cam-home 推进去。参数 dur |
| `wake` | 先摆后讲：元素从一开始就在画面里但是暗的，念到它时点亮。参数 dim（没点亮时的亮度，默认 0.3）、solid=1（不用半透明而是压暗去色，卡片不会透出背景；舞台剧模式下自动开启） |
| `zoom-here` | 原位放大：从一组内容里挑出重点，在原来的位置直接放大，其余淡到 30% 往后退。参数 s（倍数，默认 2.4）、hold（几秒后自动收回，不写就不收）、dim |
| `push-back` | 背景虚化：新内容出现时，把原来那层整体往后推（缩到 94%、变虚 4px、变暗到 55%）。参数 s、blur、dim、dur |
| `bring-front` | 把 push-back 推到后面的那层拉回来 |
| `depth` | 景深分层：子元素写 data-depth="near/mid/far"，离焦点越远越虚（0 / 4 / 8px），并按层做视差漂移。参数 focus（焦点在哪层，默认 mid）、shift（视差幅度，默认 40）、blur |
| `rack-focus` | 移焦：把清晰的那一层换成另一层（配合 depth 用）。参数 to=near/mid/far、dur |
| `bg-tint` | 背景换色：换图时把背景整块换成这张图的主色，观众一眼知道换了。参数 color（写 reset 换回原色）、dur（默认 0.5）、to（要换色的元素，默认整块画布） |
| `skeleton` | 骨架填充：复杂界面先出灰色骨架块，再按阅读顺序一块块填进真实内容。写在容器上，子元素就是一块块内容。参数 gap（每块间隔，默认 0.15）、hold（骨架先停多久，默认 0.5） |
| `deal-in` | 发牌入场：一组图不同时出现，一张接一张沿弧线飞到各自位置。配 each: 用。参数 stagger（默认 0.1）、from=left/right（从哪边发）、dur |
| `drop-gather` | 落下收拢：一堆图从上方落下，收拢成扇形，只留要讲的几张，其余掉出画面。写在容器上；要留的子元素加 data-keep（不加就留前 keep 张）。参数 keep（默认 3） |
| `fly` | 纵深穿梭：镜头连续往里飞，穿过的那件放大变虚，下一件从深处淡入。写在 data-make="tunnel" 上。参数 to（飞到第几件，从 1 数）、each（每件用时，默认 0.7） |
| `helix-spin` | 环筒螺旋：相机绕着圆筒转，先快后慢转开，再匀速慢转。写在 data-make="helix" 上。参数 turn（快转多少度，默认 300）、dur（快转用时，默认 2.4）、slow（之后每秒慢转几度，默认 10） |
| `flip-to` | 三维翻转：展板一块接一块往上滚，每块绕横轴大角度翻转，转到正面完整显色，其余压暗到 30%。写在 data-make="flipboard" 上。参数 i（翻到第几块，从 1 数）、dur |
| `pick` | 放大让位：扇形里讲到谁，谁就抬起放大，左右往两边让开，其他图都还看得见。写在 data-make="fan" 上。参数 i（第几张，从 1 数；0 = 全部放回）、s（默认 1.3）、gap（让开多远，默认 90）、lift（抬多高，默认 70） |
| `slice-to` | 切片换图：新图切成几条，一条条从下面长上来，编号同步翻牌。写在 data-make="slices" 上。参数 i（换到第几张，从 1 数；不写就是下一张）、stagger（默认 0.07）、dur |
| `road-walk` | 走进画面：镜头贴着地面沿路往里走，走到哪一步哪一步亮。写在 data-make="road" 上。参数 i（走到第几步，从 1 数）、dur |
| `bignum` | 章节卡入场：大数字先落下，标题跟着滑出。写在 data-make="bignum" 上。参数 dock（几秒后缩成左上角小标签，不写就不缩） |
| `segment` | 进度线走到第 i 段（从 1 数）。写在 data-make="segments" 上，一般放在常驻叠加层里 |

## 舞台（10）

「主持人在前、场景在后、信息用画中画给」的舞台零件，需要额外加载 `fx-stage.js`。

| 名字 | 作用 / 参数 |
|---|---|
| `dither-in` | 画面从双色像素噪点一路变清楚（像老游戏机开机、信号接通）。写在 data-make="backdrop" 上；有 data-dither 时停在像素画，没有时停在原图。参数 dur（默认 1.6） |
| `light-sweep` | 一道柔和的斜光从画面上扫过一次（贵气、高级感；用在结论、产品、榜单出现的那一刻）。写在分镜、背景或任何元素上。参数 dur（默认 1.6）、angle（光带角度，默认 115）、color、strength（0–1，默认 0.5） |
| `light-leak` | 胶片漏光：暖色的光斑从画面一侧漫进来又退掉（回忆、转折、情绪高点）。写在分镜或背景上。参数 dur（默认 4）、tone=warm/cool、strength（0–1，默认 0.9） |
| `cutaway` | 插画特写：一张全屏插画硬切进来，很慢地推近，到时间硬切回去；期间盖住演员，字幕和章节条还在。写在 <img> 上（放在所在分镜里即可）。参数 dur（停多久，1.2–2.5 秒）、zoom（推到多大，默认 1.07）、x / y（同时平移百分比）、under=1（放在演员下面：主持人继续站在画面上讲，适合全屏录屏） |
| `screen-to` | 屏内切换：设备屏幕里的内容硬切到第 i 个（从 1 数；不写就是下一个），带一下很轻的闪白。写在 data-make="device" 上 |
| `dive` | 钻进屏幕：设备朝镜头放大，直到它的屏幕铺满全屏（下一个分镜用同一张画面当背景，就像走进了屏幕里）。写在 data-make="device" 上，一般放在分镜最后 0.5 秒。参数 dur（默认 0.5） |
| `frames` | 序列帧播放：把一串截图当视频播（实机录屏、操作演示），逐帧确定。元素上写 data-frames="目录/f_%03d.jpg" data-n="帧数"。参数 fps（默认 15）、dur（播多久，默认到分镜结束；播完从头循环） |
| `choose` | 选一项：选择面板的高亮条跳到第 i 项并打勾。写在 data-make="menu" 上。参数 i（从 1 数；写成 2/4/1/3 就是连着快速选好几次）、every（连选时每次间隔，默认 0.28 秒） |
| `mini-walk` | 小演员走过去：两帧步态交替 + 水平移动，走到后站定。写在 data-make="mini" 上。参数 x（走多远，负数向左）或 to=#目标（走到它旁边）、dur、step（每步多久，默认 0.16 秒） |
| `mini-pose` | 小演员换动作（举手、欢呼、坐下…），带一下挤压回弹。写在 data-make="mini" 上。参数 name（动作名，对应 data-poses 里的名字）、hold（几秒后自动回到站立，不写就一直保持） |

## 手绘（5）

手绘批注，需要额外加载 `fx-ink.js`。线条带一点抖、按笔顺描出来，画好后每秒换 10 次姿势轻轻「沸腾」。

| 名字 | 作用 / 参数 |
|---|---|
| `ink-circle` | 手画一个圈把元素圈起来（起笔在左上，多画一点收尾），可以在旁边写一句。参数 label（旁边的字）、at=right/left/top/bottom（字写在哪边）、pad（圈比元素大多少，默认 18）、color、w、dur |
| `ink-underline` | 手画的线：波浪下划线、划掉、左括号。参数 kind=squiggle/double/strike/bracket、color、w、dur |
| `ink-box` | 手画方框框住元素，可以在左上角贴一个标签。参数 label、pad（默认 14）、color、w、dur |
| `ink-arrow` | 从这个元素画一支手绘箭头指向另一个元素。参数 to=#目标（或 dx / dy 直接给偏移像素）、tx / ty（指向目标里的哪个位置，0–1；不写就指向目标边框上离起点最近的点）、curve=straight/gentle/swoop、side=1/-1（往哪边弯）、gap（离两头留多少空）、color、w、dur |
| `ink-mark` | Vox 式批注：给句子里的一个词上马克笔，同时拉一根细线到一行注释。参数 word（要标的词，不写就标整个元素）、style=highlight/circle/underline/scribble、note（注释文字，不写就只画记号）、color、dur |

## 对话（8）

AI 对话、输入框打字、终端、代码 diff、Agent 光标，需要额外加载 `fx-chat.js`。

| 名字 | 作用 / 参数 |
|---|---|
| `msg` | 聊天窗里的一条消息弹出来：0.12 秒从发送者那一角长出来。写在 data-make="chat" 上。参数 i（第几条，从 1 数） |
| `typing` | 「正在输入…」气泡：在第 i 条消息的位置弹出三个点，dur 秒后消失（通常紧接着 msg / stream-in 同一条）。写在 data-make="chat" 上。参数 i、dur（默认 1.2） |
| `stream-in` | AI 的回答按吐字节奏一段一段冒出来，新字先是灰的、0.27 秒后变成正常颜色。写在 data-make="chat" 上（第 i 条消息），也可以直接写在任何一段文字上。参数 i、speed（倍速，默认 1） |
| `prompt` | 输入框里像真人一样打字：一次出 1–3 个字、长短不一的停顿，光标打字时闪、打完常亮。写在一个只有文字的元素上（配 class="fx-prompt" 就是一个输入框）。参数 fix（先打错的词，删掉再改对）、glyph（行首的提示符，默认 ›，写 none 去掉）、speed |
| `run` | 终端跑一条命令：敲命令、停一拍、输出一行行打印出来，最后出现新的提示符。写在 data-make="terminal" 上。参数 every（输出行间隔，默认 0.22 秒）、speed（打字倍速） |
| `diff` | 代码改动：要删的行先变红再收起，要加的行变绿展开。写在 data-make="code" 上（行首「- 」是删、「+ 」是加） |
| `code-focus` | 代码里某一行亮起一条高光扫过，其余行压暗。写在 data-make="code" 上。参数 i（第几行，按最终显示的行数从 1 数；0 = 全部恢复） |
| `agent-go` | Agent 光标：名牌上打出它要做的事，光标移到目标上点一下（带一圈波纹）。写在 data-make="agent" 上，可以连写多次。参数 to=#目标（不写就原地）、say（名牌上的字）、click=0（不点）、done=1（打一个勾表示做完） |

## 图解（3）

关系图（包围 `surround` 与中心辐射 `hub`），需要额外加载 `fx-diagram.js`。

| 名字 | 作用 / 参数 |
|---|---|
| `surround-in` | 中心先落定，周围的标签一个个围上来；close=1 时再一起往里收、四周压暗。写在 data-make="surround" 上。参数 gap（标签之间隔几秒，默认 0.3）、close=1 |
| `overwhelm` | 一大堆标签从四面八方加速涌进来，挤在不动的中心周围（信息过载、事情太多）。写在 data-make="surround" 上（标签文字从 data-chips 里循环取）。参数 n（个数，8–24，默认 16）、intensity（压力，0.5–2，越大挤得越近越快）、dur（涌入用多久，默认 2.2） |
| `hub-node` | 中心辐射图的第 i 个节点：连线从中心画出去，节点弹亮。写在 data-make="hub" 上，念到哪个写哪个。参数 i（从 1 数） |

## 形状（3）

图形变形、沿路径运动、弹性摇摆，需要额外加载 `fx-shape.js` 和 `vendor/gsap-plugins/` 里的 GSAP 免费插件。

| 名字 | 作用 / 参数 |
|---|---|
| `shape-morph` | 图形平滑变成另一个图形（✗ 变 ✓、圆变星……），可同时换颜色。写在 data-make="shape" 上，或任何含一个 <path> 的 svg 上。参数 to（内置形状名：check cross circle square triangle star heart bolt arrow-up arrow-down play bulb，或 #另一个路径的 id）、color、dur（默认 0.6）。需要 MorphSVGPlugin |
| `path-move` | 沿一条 SVG 路径运动，朝向跟着路径转（纸飞机、数据包、快递路线）。写在要动的元素上。参数 path=#路径的 id（必填）、dur（默认 1.6）、rotate=0（不转向）、draw=1（同时把路径画出来）、from / to（走路径的哪一段，0–1）。需要 MotionPathPlugin |
| `wiggle` | 有弹性的摇摆：左右晃几下慢慢停住（被点名、被吐槽、出错时晃一下）。参数 n（晃几下，默认 6）、amp（角度，默认 8）、dur（默认 0.8）、prop=rotation/x。需要 CustomEase + CustomWiggle |

## 声音（1）

音效层，需要额外加载 `fx-sound.js`。加载后每个动效自带代码合成音效；出片用 `node scripts/sfx.mjs <工程目录>` 生成音效轨。

| 名字 | 作用 / 参数 |
|---|---|
| `sfx` | 单独放一个音效（画面上没有动作也能响）。参数 kind=pop/tick/click/swish/whoosh/thump/snap/hit/ding/chime/blip/rise/fall/buzz/sparkle/zap/glitch/paper/flap/card/rumble/swellup/shimmer/type/roll/step/dots、vol（音量倍数）、pitch（音高倍数）、dur（持续类声音的秒数） |

## 组件（4）

配合 `data-make` 生成的组件使用。

| 名字 | 作用 / 参数 |
|---|---|
| `step` | 步骤导航切换：配 data-make="steps"，把第 i 个胶囊点亮（从 1 数），其余熄灭 |
| `chapter` | 章节进度条：配 data-make="chapters"，高亮块滑到第 i 章（从 1 数） |
| `check` | 清单打勾：配 .fx-check 组件，勾画出来、文字变实 |
| `toggle` | 拨动开关：配 data-make="switches"，把第 i 个开关（支持 2/3/5 批量）拨到开(on=1)或关(on=0)。参数 i、on=0/1、stagger |

## 转场（24）

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
| `shatter` | 碎裂崩塌：画面裂成 3D 碎片翻转坠落，露出下一幕（适合崩溃、破局、反转）。参数 cols、colors=色1/色2、dur、seed |
| `diagonal-split` | 斜切拉开：一道发光刀光斜劈画面，向两侧凌厉拉开露出新场景（动漫分镜感）。参数 angle=斜度、color、dur |
| `blinds` | 百叶窗翻转：新画面切成多根条带，按波浪顺序逐条翻开盖住旧画面。参数 n=条数、dir=x/y、dur |
| `crt-off` | 老电视换台：旧画面压扁成高亮扫描线收缩，随即闪开新画面（复古极客感）。参数 color、dur |
| `portal-spin` | 旋涡穿越：旧画面旋转吸入中心，新画面从旋转模糊中甩出定格。参数 deg=旋转角度、dur |
| `halftone` | 漫画网点波纹：圆点阵列沿对角线放大铺满再收缩揭开新画面（二次元/像素风绝配）。参数 cols、color、dur |
| `cam-to` | 世界画布专用（默认）：镜头斜着推到下一个机位，先往后拉一点再推进，先慢再快再慢。参数 dur（0.6–0.9）、arc（路上多绕几度，默认 8）、pull（回拉幅度，默认 0.07） |
| `cam-jump` | 世界画布专用：镜头直接跳到下一个机位（硬切），只在换大章节时用 |
| `mosaic` | 马赛克换场：纸色方块从上往下随机盖满，再随机揭开新场景；方块在演员和常驻层下面，主持人不会被盖住（换章节、换场景背景时用）。参数 cols（一行几块，默认 24）、color、dur、seed |
| `card-wipe` | 3D 巨卡贴脸擦镜转场（普通模式与世界画布通用）：一张超大双面厚边扑克从镜头极近处翻滚掠过遮满全屏，移开时无缝带出下一幕。参数 dur（默认 0.78）、emblem（牌背字母，默认 A）、color |

