#!/usr/bin/env node
// 从 fx.js 里读出全部动效 / 转场 / 组件生成器，重新生成 README.md / README.en.md / README.ja.md 里的数量表和动效目录。
// 用法：node gen-readme.mjs   （加了新动效后跑一次）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const win = { gsap: {} };
new Function("window", fs.readFileSync(path.join(here, "fx.js"), "utf8"))(win);
// 可选的粒子模块也算进目录（它需要一点浏览器环境，这里给个最小替身）
{
  const fake = () => ({ getContext: () => new Proxy({}, { get: () => () => ({ data: [0, 0, 0, 0], addColorStop() {} }) }), width: 0, height: 0 });
  new Function("window", "document", fs.readFileSync(path.join(here, "fx-particles.js"), "utf8"))(win, { createElement: fake });
  new Function("window", "document", fs.readFileSync(path.join(here, "fx-3d.js"), "utf8"))(win, { createElement: fake });
  new Function("window", "document", fs.readFileSync(path.join(here, "fx-rig.js"), "utf8"))(win, { createElement: fake });
  new Function("window", "document", fs.readFileSync(path.join(here, "fx-vrm.js"), "utf8"))(win, { createElement: fake });
}
const { catalog, make } = win.FX;

const ORDER = ["入场", "退场", "强调", "文字", "数据", "镜头", "角色", "剪纸", "粒子", "3D", "组件", "转场"];
const WHAT = {
  入场: "元素出现的方式。默认从「入场前」状态回到元素本来的样子，所以元素自己写的 CSS 位置、旋转都会保留。",
  退场: "元素离开的方式。一般写成 `@-0.4`（场景结束前 0.4 秒）。",
  强调: "元素已经在画面上，念到它时做一下强调；也包括移动、变色、内容切换。",
  数据: "数字、进度、图表类。数字类动效会自动保留小数位和千分位。",
  文字: "专门给文字用的：流光、故障、换词、删掉重打、翻牌、描边、残影。",
  镜头: "作用在一整个容器上：推近、平移、3D 倾斜、震动。",
  角色: "给立绘 / 小人用：换姿势、口型、点头、跳、走。",
  剪纸: "剪纸 / 纸艺拼贴风：展开、剪开、撕开、贴上、逐层升起，以及每秒 12 格的定格手工感。和 `theme-paper` 皮肤最配，但任何皮肤都能用。",
  粒子: "画布粒子，需要额外加载 `fx-particles.js`。写在 `data-make=\"space\"` 的画布容器上，每个动效是画布里的一层，按书写顺序从下往上叠。通用参数：`dur`（这一层持续多久）、`fade` / `out`（淡入淡出秒数）、`x` / `y`（中心位置百分比）、`seed`。",
  "3D": "真 3D 场景（three.js），需要额外加载 `vendor/three-fx.min.js` 和 `fx-3d.js`。写在 `data-make=\"stage3d\"` 的舞台上：一类动效往舞台里放东西，一类移动摄像机（`cam3d`、`orbit3d`）。物体的通用参数：`dur`（存在多久）、`fade` / `out`（淡入淡出秒数）、`px` / `py` / `pz`（摆放位置）、`s`（整体缩放）、`seed`。",
  组件: "配合 `data-make` 生成的组件使用。",
  转场: "写在**后一个**场景上：`<section class=\"scene\" data-in=\"blur-cross(dur=0.5)\">`。",
};
const groups = Object.fromEntries(ORDER.map((k) => [k, catalog.filter((c) => c.cat === k)]));
const nTrans = groups["转场"].length;
const nFx = catalog.length - nTrans;
const makers = Object.keys(make);
const esc = (s) => s.replace(/\|/g, "/");
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k]);

// ---- 中文（原样输出）----
function zh() {
  const breakdown = ORDER.filter((k) => k !== "转场").map((k) => `${k} ${groups[k].length}`).join(" · ");
  const stats = `| | 数量 |
|---|---|
| 动效 | **${nFx}** 种（${breakdown}） |
| 转场 | **${nTrans}** 种 |
| 组件生成器 | **${makers.length}** 个（${makers.map((k) => "`" + k + "`").join(" ")}） |
| 皮肤 | **5** 套（白紫科技 · 黑金电影 · 像素复古 · 剪纸拼贴 · 深空粒子） |`;
  let cat = `## 动效目录（${nFx} 种动效 + ${nTrans} 种转场）

> 这一节由 \`node gen-readme.mjs\` 从 \`fx.js\` 自动生成，不要手改。
> 所有动效都支持通用参数 \`dur\`（时长）、\`ease\`（缓动）、\`stagger\`（错峰）；下表只列各自特有的参数。

`;
  for (const k of ORDER) {
    cat += `### ${k}（${groups[k].length}）\n\n${WHAT[k]}\n\n| 名字 | 作用 / 参数 |\n|---|---|\n`;
    for (const c of groups[k]) cat += `| \`${c.name}\` | ${esc(c.desc)} |\n`;
    cat += "\n";
  }
  return { stats, cat, breakdown };
}

// ---- 其他语言：文字取自 i18n/catalog.<lang>.json，缺翻译回退中文并告警 ----
const missing = {};
function other(lang) {
  const J = JSON.parse(fs.readFileSync(path.join(here, "i18n", `catalog.${lang}.json`), "utf8"));
  const S = J.stats, C = J.catalog;
  const title = (k) => J.categories?.[k]?.title ?? k;
  const intro = (k) => J.categories?.[k]?.intro ?? WHAT[k];
  const breakdown = ORDER.filter((k) => k !== "转场").map((k) => `${title(k)} ${groups[k].length}`).join(" · ");
  const stats = `| | ${S.colName} |
|---|---|
| ${S.fx} | ${fill(S.fxLine, { n: nFx, breakdown })} |
| ${S.transitions} | ${fill(S.transLine, { n: nTrans })} |
| ${S.makers} | ${fill(S.makersLine, { n: makers.length, list: makers.map((k) => "`" + k + "`").join(" ") })} |
| ${S.skins} | ${S.skinsLine} |`;
  let cat = `## ${fill(C.heading, { nFx, nTrans })}

> ${C.note1}
> ${C.note2}

`;
  for (const k of ORDER) {
    cat += `### ${title(k)} (${groups[k].length})\n\n${intro(k)}\n\n| ${C.colName} | ${C.colDesc} |\n|---|---|\n`;
    for (const c of groups[k]) {
      const t = J.effects?.[`${k}/${c.name}`] ?? J.effects?.[c.name];
      if (!t) (missing[lang] ??= []).push(c.name);
      cat += `| \`${c.name}\` | ${esc(t ?? c.desc)} |\n`;
    }
    cat += "\n";
  }
  return { stats, cat, breakdown };
}

const targets = [["zh", "README.md"], ["zh-TW", "README.zh-TW.md"], ["en", "README.en.md"], ["ja", "README.ja.md"]];
for (const [lang, name] of targets) {
  const { stats, cat, breakdown } = lang === "zh" ? zh() : other(lang);
  const file = path.join(here, name);
  if (!fs.existsSync(file)) { console.warn(`! 跳过 ${name}：文件不存在`); continue; }
  let md = fs.readFileSync(file, "utf8");
  const put = (tag, body) => {
    const re = new RegExp(`(<!-- ${tag}:START -->)[\\s\\S]*?(<!-- ${tag}:END -->)`);
    if (!re.test(md)) throw new Error(`${name} 里缺少 <!-- ${tag}:START/END --> 标记`);
    md = md.replace(re, `$1\n${body.trim()}\n$2`);
  };
  put("STATS", stats);
  put("CATALOG", cat);
  fs.writeFileSync(file, md);
  console.log(`✓ ${name} 已更新：${nFx} 种动效（${breakdown}）+ ${nTrans} 种转场 + ${makers.length} 个组件生成器`);
}
for (const [lang, list] of Object.entries(missing)) console.warn(`! ${lang} 缺少 ${list.length} 条翻译，已回退中文：${list.join(", ")}`);
