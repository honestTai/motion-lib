#!/usr/bin/env node
// 从 src/ 里读出全部动效 / 转场 / 组件生成器：
// 1. 更新 README.md / README.zh-TW.md / README.en.md / README.ja.md 里的数量统计表（<!-- STATS:START/END -->）与徽章数字
// 2. 生成独立全量动效速查手册 docs/CATALOG.md（及 zh-TW / en / ja 多语言版），避免主 README 冗长膨胀
// 用法：node scripts/gen-readme.mjs   （加了新动效后跑一次）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const win = { gsap: {} };
new Function("window", fs.readFileSync(path.join(here, "src/core/fx.js"), "utf8"))(win);
{
  const fake = () => ({ getContext: () => new Proxy({}, { get: () => () => ({ data: [0, 0, 0, 0], addColorStop() {} }) }), width: 0, height: 0 });
  const modules = [
    "src/modules/three/fx-particles.js",
    "src/modules/three/fx-3d.js",
    "src/modules/character/fx-rig.js",
    "src/modules/character/fx-vrm.js",
    "src/modules/spatial/fx-world.js",
    "src/modules/character/fx-puppet.js",
    "src/modules/spatial/fx-stage.js",
    "src/modules/spatial/fx-oner.js",
    "src/modules/kit/fx-ink.js",
    "src/modules/kit/fx-chat.js",
    "src/modules/kit/fx-diagram.js",
    "src/modules/kit/fx-shape.js",
    "src/modules/three/fx-desk3d.js",
    "src/modules/three/fx-gallery3d.js",
    "src/modules/three/fx-showcase3d.js",
    "src/modules/three/fx-narrative3d.js",
  ];
  for (const rel of modules) {
    new Function("window", "document", fs.readFileSync(path.join(here, rel), "utf8"))(win, { createElement: fake });
  }
  new Function("window", "document", fs.readFileSync(path.join(here, "src/modules/audio/fx-sound.js"), "utf8"))(win, undefined);
}
const { catalog, make } = win.FX;

const ORDER = ["入场", "退场", "强调", "文字", "数据", "镜头", "角色", "剪纸", "粒子", "3D", "立体", "空间", "舞台", "手绘", "对话", "图解", "形状", "声音", "组件", "转场"];
const WHAT = {
  入场: "元素出现的方式。默认从「入场前」状态回到元素本来的样子，所以元素自己写的 CSS 位置、旋转都会保留。",
  退场: "元素离开的方式。一般写成 `@-0.4`（场景结束前 0.4 秒）。",
  强调: "元素已经在画面上，念到它时做一下强调；也包括移动、变色、内容切换。",
  数据: "数字、进度、图表类。数字类动效会自动保留小数位和千分位。",
  文字: "专门给文字用的：流光、故障、换词、删掉重打、翻牌、描边、残影。",
  镜头: "作用在一整个容器上：推近、平移、3D 倾斜、震动。",
  角色: "给立绘 / 小人用：换姿势、口型、点头、跳、走。",
  剪纸: "剪纸 / 纸艺拼贴风：展开、剪开、撕开、贴上、逐层升起，以及每秒 12 格的定格手工感。和 `theme-paper` 皮肤最配，但任何皮肤都能用。",
  粒子: "画布粒子，需要额外加载 `fx-particles.js`。写在 `data-make=\"space\"` 的画布容器上，每个动效是画布里的一层，按书写顺序从下往上叠。通用参数：`dur`、`fade` / `out`、`x` / `y`、`seed`。",
  "3D": "真 3D 场景、工业硬件拆解与口播黄金叙事连招（three.js），加载 `vendor/three-fx.min.js` 后配合 `fx-3d.js`（深空星系/隧道/城市舞台 `stage3d`）、`fx-showcase3d.js`（五层芯片 `chip3d`、笔记本 `laptop3d`、机械轴 `keycap3d`、机柜 `rack3d`、色散棱镜 `prism3d`、万向陀螺 `gyro3d`）或 `fx-narrative3d.js`（冰山深潜 `iceberg3d`、骨牌护盾 `domino3d`、双盘天平 `scale3d`、提纯漏斗 `funnel3d`、装甲金库 `vault3d`、认知金字塔 `pyramid3d`）。",
  立体: "白底立体影棚、白格牌桌与暖白无影展厅动效，加载 `fx-desk3d.js`（配 `theme-white3d` / `theme-white3d desk`）或 `fx-gallery3d.js`（配 `theme-white3d gallery` + Three.js 真 3D 倒角 `.glb` 模型）。姿态与台面接触投影随空间高度实时联动。",
  空间: "世界画布、相机和图片组动效，需要额外加载 `fx-world.js`。根元素写上 `data-world`，所有分镜就变成同一块大画布上的机位，换分镜 = 镜头走过去。",
  舞台: "「主持人在前、场景在后、信息用画中画给」的舞台零件，需要额外加载 `fx-stage.js`。",
  手绘: "手绘批注，需要额外加载 `fx-ink.js`。线条带一点抖、按笔顺描出来，画好后每秒换 10 次姿势轻轻「沸腾」。",
  对话: "AI 对话、输入框打字、终端、代码 diff、Agent 光标，需要额外加载 `fx-chat.js`。",
  图解: "关系图（包围 `surround` 与中心辐射 `hub`），需要额外加载 `fx-diagram.js`。",
  形状: "图形变形、沿路径运动、弹性摇摆，需要额外加载 `fx-shape.js` 和 `vendor/gsap-plugins/` 里的 GSAP 免费插件。",
  声音: "音效层，需要额外加载 `fx-sound.js`。加载后每个动效自带代码合成音效；出片用 `node scripts/sfx.mjs <工程目录>` 生成音效轨。",
  组件: "配合 `data-make` 生成的组件使用。",
  转场: "写在**后一个**场景上：`<section class=\"scene\" data-in=\"blur-cross(dur=0.5)\">`。",
};
const groups = Object.fromEntries(ORDER.map((k) => [k, catalog.filter((c) => c.cat === k)]));
const nTrans = groups["转场"].length;
const nFx = catalog.length - nTrans;
const makers = Object.keys(make);
const esc = (s) => s.replace(/\|/g, "/");
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k]);

function zh() {
  const breakdown = ORDER.filter((k) => k !== "转场").map((k) => `${k} ${groups[k].length}`).join(" · ");
  const stats = `| | 数量 |
|---|---|
| 动效 | **${nFx}** 种（${breakdown}）· [查看全量目录 →](docs/CATALOG.md) |
| 转场 | **${nTrans}** 种 |
| 组件生成器 | **${makers.length}** 个 |
| 皮肤 | **7** 套（白紫科技 · 黑金电影 · 像素复古 · 剪纸拼贴 · 深空粒子 · 演播室 · 白底立体/展厅） |`;
  let cat = `# motion-lib 全量动效与转场目录（${nFx} 种动效 + ${nTrans} 种转场）

> [← 返回主文档 README.md](../README.md)
> 本文件由 \`node scripts/gen-readme.mjs\` 从 \`src/\` 自动生成，请勿手改。
> 所有动效均支持通用参数 \`dur\`（时长）、\`ease\`（缓动）、\`stagger\`（错峰）；下表仅列各动效特有参数。

## 组件生成器一览（${makers.length} 个 \`data-make\`）

${makers.map((k) => "`" + k + "`").join(" · ")}

---

`;
  for (const k of ORDER) {
    cat += `## ${k}（${groups[k].length}）\n\n${WHAT[k]}\n\n| 名字 | 作用 / 参数 |\n|---|---|\n`;
    for (const c of groups[k]) cat += `| \`${c.name}\` | ${esc(c.desc)} |\n`;
    cat += "\n";
  }
  return { stats, cat, breakdown };
}

const missing = {};
function other(lang, catRelLink, backReadme) {
  const J = JSON.parse(fs.readFileSync(path.join(here, "i18n", `catalog.${lang}.json`), "utf8"));
  const S = J.stats, C = J.catalog;
  const title = (k) => J.categories?.[k]?.title ?? k;
  const intro = (k) => J.categories?.[k]?.intro ?? WHAT[k];
  const breakdown = ORDER.filter((k) => k !== "转场").map((k) => `${title(k)} ${groups[k].length}`).join(" · ");
  const fullLabel = lang === "en" ? "Full catalog →" : lang === "ja" ? "全カタログ →" : "查看全量目錄 →";
  const stats = `| | ${S.colName} |
|---|---|
| ${S.fx} | ${fill(S.fxLine, { n: nFx, breakdown })} · [${fullLabel}](${catRelLink}) |
| ${S.transitions} | ${fill(S.transLine, { n: nTrans })} |
| ${S.makers} | **${makers.length}** |
| ${S.skins} | ${S.skinsLine} |`;
  let cat = `# ${fill(C.heading, { nFx, nTrans })}

> [← ${backReadme}](../${backReadme})
> ${C.note1}
> ${C.note2}

## \`data-make\` (${makers.length})

${makers.map((k) => "`" + k + "`").join(" · ")}

---

`;
  for (const k of ORDER) {
    cat += `## ${title(k)} (${groups[k].length})\n\n${intro(k)}\n\n| ${C.colName} | ${C.colDesc} |\n|---|---|\n`;
    for (const c of groups[k]) {
      const t = J.effects?.[`${k}/${c.name}`] ?? J.effects?.[c.name];
      if (!t) (missing[lang] ??= []).push(c.name);
      cat += `| \`${c.name}\` | ${esc(t ?? c.desc)} |\n`;
    }
    cat += "\n";
  }
  return { stats, cat, breakdown };
}

fs.mkdirSync(path.join(here, "docs"), { recursive: true });
const targets = [
  ["zh", "README.md", "docs/CATALOG.md"],
  ["zh-TW", "README.zh-TW.md", "docs/CATALOG.zh-TW.md"],
  ["en", "README.en.md", "docs/CATALOG.en.md"],
  ["ja", "README.ja.md", "docs/CATALOG.ja.md"],
];

for (const [lang, readmeName, catRel] of targets) {
  const { stats, cat, breakdown } = lang === "zh" ? zh() : other(lang, catRel, readmeName);
  fs.writeFileSync(path.join(here, catRel), cat);

  const readmeFile = path.join(here, readmeName);
  if (!fs.existsSync(readmeFile)) continue;
  let md = fs.readFileSync(readmeFile, "utf8");
  const reStats = /(<!-- STATS:START -->)[\s\S]*?(<!-- STATS:END -->)/;
  if (!reStats.test(md)) throw new Error(`${readmeName} 缺少 <!-- STATS:START/END --> 标记`);
  md = md.replace(reStats, `$1\n${stats.trim()}\n$2`);
  md = md.replace(/Effects-\d+-/g, `Effects-${nFx}-`).replace(/Transitions-\d+-/g, `Transitions-${nTrans}-`);
  if (/<!-- CATALOG:START -->/.test(md)) {
    md = md.replace(/<!-- CATALOG:START -->[\s\S]*?<!-- CATALOG:END -->/, `<!-- CATALOG moved to ${catRel} -->`);
  }
  fs.writeFileSync(readmeFile, md);
  console.log(`✓ ${readmeName} + ${catRel} 已更新：${nFx} 种动效 + ${nTrans} 种转场 + ${makers.length} 个组件生成器`);
}
for (const [lang, list] of Object.entries(missing)) console.warn(`! ${lang} 缺少 ${list.length} 条翻译，已回退中文：${list.join(", ")}`);
