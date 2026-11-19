#!/usr/bin/env node
// 给一条片子生成音效轨：用本机 Chrome 打开页面，读出每个动效的触发时间，按对照表合成声音，写成一条和画面等长的 WAV。
//
//   node sfx.mjs <工程目录或 index.html> [--out audio/sfx.wav] [--palette soft|pixel|cinema|paper] [--gain 1] [--json]
//   node sfx.mjs --audition <输出目录>      每套音色导出一条「所有声音挨个响一遍」的试听文件
//
// 页面要加载 lib/fx-sound.js（它负责把动效换算成音效清单）。生成的 sfx.wav 垫在配音下面混音即可，比如：
//   ffmpeg -i voice.wav -i audio/sfx.wav -filter_complex "amix=inputs=2:normalize=0" mix.wav
// 不依赖任何 npm 包；需要本机装有 Chrome（或用环境变量 REAL_CHROME 指定路径）。
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
const die = (m) => { console.error("✗ " + m); process.exit(1); };

function loadSound(dir) {
  const file = [dir && path.join(dir, "lib", "fx-sound.js"), dir && path.join(dir, "fx-sound.js"), path.join(here, "fx-sound.js")].find((f) => f && fs.existsSync(f));
  if (!file) die("找不到 fx-sound.js");
  const win = {};
  new Function("window", fs.readFileSync(file, "utf8").replace("typeof window !== 'undefined' ? window : globalThis", "window"))(win);
  return win.FX.sound;
}
function stats(ch) {
  let peak = 0, sum = 0;
  for (let i = 0; i < ch.L.length; i++) { const a = Math.max(Math.abs(ch.L[i]), Math.abs(ch.R[i])); if (a > peak) peak = a; sum += ch.L[i] * ch.L[i] + ch.R[i] * ch.R[i]; }
  const db = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : "-inf");
  return { peak: db(peak), rms: db(Math.sqrt(sum / (ch.L.length * 2))) };
}

if (flag("--audition")) {
  const out = path.resolve(opt("--audition", "sfx-audition")), S = loadSound(null);
  fs.mkdirSync(out, { recursive: true });
  for (const pal of Object.keys(S.palettes)) {
    const cues = S.kinds.map((kind, i) => ({ t: 0.3 + i * 1.6, kind, dur: 0.8, seed: i }));
    fs.writeFileSync(path.join(out, `audition-${pal}.wav`), S.wav(S.render(cues, 0.3 + S.kinds.length * 1.6, pal)));
  }
  console.log(`✓ ${out}/audition-<音色>.wav（每 1.6 秒一个，顺序：${S.kinds.join(" ")}）`);
  process.exit(0);
}

const target = args.find((a) => !a.startsWith("--") && a !== opt("--out") && a !== opt("--palette") && a !== opt("--gain"));
if (!target) die("用法：node sfx.mjs <工程目录或 index.html> [--out audio/sfx.wav] [--palette soft|pixel|cinema|paper] [--gain 1] [--json]");
const page = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, "index.html") : path.resolve(target);
if (!fs.existsSync(page)) die("没有这个页面：" + page);
const dir = path.dirname(page);
const chrome = [process.env.REAL_CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe")].find((f) => f && fs.existsSync(f));
if (!chrome) die("没找到本机 Chrome：装一个，或用环境变量 REAL_CHROME 指定路径");

const open = (gl) => spawnSync(chrome, ["--headless=new", gl, "--hide-scrollbars", "--window-size=1920,1400", "--allow-file-access-from-files", "--virtual-time-budget=10000", "--dump-dom", pathToFileURL(page).href + "?cues"], { maxBuffer: 256 * 1024 * 1024 });
const find = (r) => String(r.stdout || "").match(/<script id="fx-cues"[^>]*>([\s\S]*?)<\/script>/);
const m = find(open("--enable-unsafe-swiftshader")) || find(open("--disable-gpu"));
if (!m) die("页面没有给出音效清单：确认 index.html 在 fx.js 之后加载了 lib/fx-sound.js，并且 lib/ 里的 fx.js 是新版（重新同步一次 lib/）");
const data = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
const S = loadSound(dir), palette = opt("--palette", data.palette), g = parseFloat(opt("--gain", "1")) || 1;
const outFile = path.resolve(dir, opt("--out", "audio/sfx.wav"));

if (palette === "off" || !data.cues.length) {
  if (flag("--json")) console.log(JSON.stringify({ file: null, cues: 0, palette }));
  else console.log(palette === "off" ? "· 这条片子关掉了音效（data-sound=\"off\"）" : "! 没有任何会出声的动效，没有生成音效轨");
  process.exit(0);
}
const cues = data.cues.map((c) => ({ ...c, gain: (c.gain ?? 1) * g }));
const ch = S.render(cues, data.total, palette), st = stats(ch);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, S.wav(ch));
const by = {}; for (const c of cues) by[c.kind] = (by[c.kind] || 0) + 1;
// 找出最长的一段没有任何音效的时间，方便判断是不是有地方太干
let gap = 0, gapAt = 0, last = 0; for (const c of [...cues, { t: data.total }]) { if (c.t - last > gap) { gap = c.t - last; gapAt = last; } last = c.t; }
const summary = { file: path.relative(process.cwd(), outFile), palette, cues: cues.length, perMinute: Math.round(cues.length / data.total * 60), peakDb: +st.peak, rmsDb: +st.rms, longestGap: +gap.toFixed(1), gapAt: +gapAt.toFixed(1), kinds: by, total: data.total };
if (flag("--json")) console.log(JSON.stringify(summary));
else {
  console.log(`✓ ${summary.file}  ${data.total.toFixed(1)}s  音色 ${palette}  共 ${cues.length} 个音效（每分钟 ${summary.perMinute} 个）  峰值 ${st.peak} dB`);
  console.log("  " + Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join("  "));
  if (gap > 8) console.log(`! ${gapAt.toFixed(1)}s 起有 ${gap.toFixed(1)} 秒没有任何音效：这一段画面上是不是也没有动作？`);
}
