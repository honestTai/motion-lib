/* fx-sound.js — 音效层（可选模块，加载在 fx.js 之后）
 *
 * 画面上每个看得见的动作都配一个声音：弹出「啵」、落地「咚」、划入「唰」、转场「哗」、打字「哒哒」。
 * 声音全部用代码合成（不带任何音频文件），按动效的触发时间自动排好，不用手写时间。
 *
 *   <script src="lib/fx-sound.js"></script>          加载后就生效：每个动效按下面的对照表自带声音
 *   data-fx="pop-in@1.2(sfx=ding)"                   换一个声音
 *   data-fx="pop-in@1.2(sfx=none)"                   这一次不出声
 *   data-fx="sfx@3.4(kind=chime,vol=0.8)"            画面没有动作，单独放一个声音
 *   <div id="root" data-sound="pixel">               指定音色：soft（默认）| pixel（8-bit 游戏机）| cinema（低沉）| paper（纸和木头）
 *   <div id="root" data-sound="off">                 整片不要音效
 *   <div data-sfx="off">…</div>                      这一块里的动效都不出声
 *
 * 预览：网址加 ?play，点播放就能听到。
 * 出片：node lib/sfx.mjs <工程目录>  →  audio/sfx.wav（一条和画面等长的音效轨，混到配音下面）。
 *
 * 做法参考了 Lemo-Opuscar（MIT）「每个看得见的动作都有声音、音效用代码合成并对准事件时间」的思路，代码是重新写的。
 */
(function (root) {
  'use strict';
  var FX = root.FX = root.FX || {};
  var SR = 48000, TAU = Math.PI * 2;

  /* ───────────────────────── 合成用的小工具 ───────────────────────── */
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function N(d) { return Math.max(1, Math.round(d * SR)); }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }

  /** 振荡器：f0 可以是数字（配合 f1 做指数滑音）或函数 u(0–1)→Hz；wave = sin | sq | tri | saw */
  function tone(d, f0, f1, wave, duty) {
    var n = N(d), y = new Float32Array(n), ph = 0, fn = typeof f0 === 'function', r = fn ? 1 : (f1 || f0) / f0;
    for (var i = 0; i < n; i++) {
      var f = fn ? f0(i / n) : f0 * Math.pow(r, i / n);
      ph += f / SR; var p = ph - Math.floor(ph);
      y[i] = wave === 'sq' ? (p < (duty || 0.5) ? 1 : -1) - (2 * (duty || 0.5) - 1) : wave === 'tri' ? 4 * Math.abs(p - 0.5) - 1 : wave === 'saw' ? 2 * p - 1 : Math.sin(TAU * p);
    }
    return y;
  }
  /** 白噪声；hold > 1 时每 hold 个采样才换一次值（老游戏机的噪声通道） */
  function noise(d, rnd, hold) {
    var n = N(d), y = new Float32Array(n), v = 0; hold = hold || 1;
    for (var i = 0; i < n; i++) { if (i % hold === 0) v = rnd() * 2 - 1; y[i] = v; }
    return y;
  }
  /** 包络：a 秒线性起音，之后按 tau 指数衰减；结尾 3 毫秒收到 0，避免爆音 */
  function env(x, a, tau) {
    var n = x.length, tail = Math.min(n, 144), an = Math.max(1, a * SR);
    for (var i = 0; i < n; i++) {
      var g = Math.min(1, i / an) * (tau ? Math.exp(-(i / SR) / tau) : 1);
      if (i > n - tail) g *= (n - i) / tail;
      x[i] *= g;
    }
    return x;
  }
  /** 正弦窗（两头收、中间鼓），pow 越大越尖 */
  function swell(x, pow) { var n = x.length; for (var i = 0; i < n; i++) x[i] *= Math.pow(Math.sin(Math.PI * i / n), pow || 2); return x; }
  /** 双二阶滤波器：type = lp | hp | bp；f 是数字或函数 u(0–1)→Hz（扫频） */
  function filt(x, type, f, q) {
    var n = x.length, y = new Float32Array(n), x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0 = 0, b1 = 0, b2 = 0, a1 = 0, a2 = 0, fn = typeof f === 'function';
    for (var i = 0; i < n; i++) {
      if (i % 32 === 0 && (fn || i === 0)) {
        var fc = Math.min(SR * 0.45, Math.max(20, fn ? f(i / n) : f)), w = TAU * fc / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * (q || 0.707)), a0 = 1 + al;
        if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
        else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; }
        else { b0 = al; b1 = 0; b2 = -al; }
        b0 /= a0; b1 /= a0; b2 /= a0; a1 = -2 * cs / a0; a2 = (1 - al) / a0;
      }
      var v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  }
  function gain(x, g) { for (var i = 0; i < x.length; i++) x[i] *= g; return x; }
  function norm(x, peak) { var m = 0, i; for (i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i])); if (m > 0) gain(x, (peak || 1) / m); return x; }
  /** 把几段声音按各自的起点叠在一起：layers = [[buf, 秒, 音量], …] */
  function mix(layers) {
    var n = 0; layers.forEach(function (l) { n = Math.max(n, Math.round((l[1] || 0) * SR) + l[0].length); });
    var y = new Float32Array(n);
    layers.forEach(function (l) { var s = Math.round((l[1] || 0) * SR), g = l[2] === undefined ? 1 : l[2], b = l[0]; for (var i = 0; i < b.length; i++) y[s + i] += b[i] * g; });
    return y;
  }
  /** 降位深 + 降采样：老游戏机的颗粒感 */
  function crush(x, bits, hold) {
    var q = Math.pow(2, bits - 1), v = 0;
    for (var i = 0; i < x.length; i++) { if (i % hold === 0) v = Math.round(x[i] * q) / q; x[i] = v; }
    return x;
  }
  /** 很短的空间感：三个衰减的回声 */
  function room(x, size, amt) {
    var taps = [0.031, 0.047, 0.071], y = new Float32Array(x.length + N(0.09 * size + 0.02));
    y.set(x);
    taps.forEach(function (d, k) { var s = N(d * size), g = amt * Math.pow(0.6, k); for (var i = 0; i < x.length; i++) y[i + s] += x[i] * g; });
    return y;
  }

  /* ───────────────────────── 声音：soft（默认，干净的界面音） ─────────────────────────
   * 每个函数收 (p, rnd)：p.pitch 音高倍数，p.dur 时长（只有持续类的声音用），返回单声道 Float32Array。 */
  var SOFT = {
    pop: function (p) { return norm(mix([[env(tone(0.12, 430 * p.pitch, 920 * p.pitch), 0.002, 0.034)], [env(filt(noise(0.02, p.rnd), 'hp', 3000), 0.0005, 0.003), 0, 0.25]])); },
    tick: function (p) { return norm(mix([[env(filt(noise(0.03, p.rnd), 'hp', 2600), 0.0005, 0.0035)], [env(tone(0.03, 2300 * p.pitch), 0.0005, 0.006), 0, 0.5]])); },
    click: function (p) { return norm(mix([[env(filt(noise(0.05, p.rnd), 'hp', 2400), 0.0005, 0.002)], [env(tone(0.05, 1750 * p.pitch), 0.0005, 0.011), 0, 0.6], [env(tone(0.05, 3100 * p.pitch), 0.0005, 0.007), 0, 0.35], [env(tone(0.05, 210), 0.0005, 0.012), 0, 0.4]])); },
    swish: function (p) { var d = 0.24; return norm(swell(filt(noise(d, p.rnd), 'bp', function (u) { return (700 + 2900 * u) * p.pitch; }, 1.4), 1.6)); },
    whoosh: function (p) { var d = Math.max(0.3, Math.min(0.9, p.dur || 0.5)); return norm(swell(mix([[filt(noise(d, p.rnd), 'bp', function (u) { return (380 + 2300 * Math.sin(Math.PI * u)) * p.pitch; }, 1.1)], [filt(noise(d, p.rnd), 'lp', function (u) { return 240 + 500 * Math.sin(Math.PI * u); }), 0, 0.5]]), 2)); },
    thump: function (p) { var d = 0.3; return norm(mix([[env(tone(d, 118 * p.pitch, 52 * p.pitch), 0.002, 0.075)], [env(filt(noise(0.08, p.rnd), 'lp', 420), 0.001, 0.02), 0, 0.5]])); },
    snap: function (p) { return norm(mix([[env(tone(0.2, 150 * p.pitch, 62 * p.pitch), 0.001, 0.05)], [env(filt(noise(0.09, p.rnd), 'bp', 1900, 0.9), 0.0005, 0.016), 0, 0.55]])); },
    hit: function (p) { return norm(room(mix([[env(tone(0.42, 96 * p.pitch, 40 * p.pitch), 0.001, 0.11)], [env(filt(noise(0.2, p.rnd), 'lp', 2600), 0.0005, 0.03), 0, 0.7], [env(filt(noise(0.03, p.rnd), 'hp', 4000), 0.0005, 0.004), 0, 0.4]]), 1, 0.22)); },
    ding: function (p) { var d = 0.95, f = 1318.5 * p.pitch; return norm(mix([[env(tone(d, f), 0.002, 0.34)], [env(tone(d, f * 2), 0.002, 0.2), 0, 0.42], [env(tone(d, f * 3), 0.002, 0.11), 0, 0.2], [env(tone(d, f * 1.5), 0.002, 0.28), 0, 0.16]])); },
    chime: function (p) { var a = SOFT.ding({ pitch: p.pitch, rnd: p.rnd }), b = SOFT.ding({ pitch: p.pitch * 1.335, rnd: p.rnd }); return norm(mix([[a, 0, 0.8], [b, 0.1, 1]])); },
    blip: function (p) { return norm(env(tone(0.08, 880 * p.pitch, 0, 'tri'), 0.002, 0.026)); },
    rise: function (p) { return norm(env(tone(0.16, 560 * p.pitch, 1180 * p.pitch, 'tri'), 0.004, 0.07)); },
    fall: function (p) { return norm(env(tone(0.26, 940 * p.pitch, 330 * p.pitch, 'tri'), 0.004, 0.11)); },
    buzz: function (p) { var d = 0.24, x = filt(tone(d, 104 * p.pitch, 0, 'saw'), 'lp', 1100), n = x.length; for (var i = 0; i < n; i++) x[i] *= 0.6 + 0.4 * Math.sin(TAU * 31 * i / SR); return norm(env(x, 0.004, 0.14)); },
    sparkle: function (p) { var L = [], k; for (k = 0; k < 6; k++) L.push([env(tone(0.22, (2300 + p.rnd() * 3200) * p.pitch), 0.001, 0.05), k * 0.055 + p.rnd() * 0.02, 0.5 + p.rnd() * 0.5]); return norm(mix(L)); },
    zap: function (p) { return norm(env(mix([[filt(tone(0.2, 2300 * p.pitch, 170 * p.pitch, 'saw'), 'lp', 5200)], [filt(noise(0.2, p.rnd), 'hp', 3000), 0, 0.22]]), 0.001, 0.07)); },
    glitch: function (p) { var L = [], t = 0, k; for (k = 0; k < 8; k++) { var d = 0.018 + p.rnd() * 0.03; L.push([env(k % 3 === 2 ? filt(noise(d, p.rnd, 4), 'hp', 1500) : filt(tone(d, (220 + p.rnd() * 1700) * p.pitch, 0, 'sq'), 'lp', 6000), 0.0005, 0), t, 0.5 + p.rnd() * 0.5]); t += d + p.rnd() * 0.012; } return norm(mix(L)); },
    paper: function (p) { var d = 0.26, x = filt(noise(d, p.rnd), 'bp', function (u) { return 2200 + 2600 * u; }, 0.8), n = x.length; for (var i = 0; i < n; i++) x[i] *= 0.55 + 0.45 * Math.sin(TAU * 47 * i / SR + 1); return norm(swell(x, 1.3)); },
    flap: function (p) { var a = env(filt(noise(0.06, p.rnd), 'lp', 1800), 0.001, 0.012); return norm(mix([[a], [a, 0.07, 0.75]])); },
    card: function (p) { return norm(mix([[swell(filt(noise(0.09, p.rnd), 'bp', 3200 * p.pitch, 1.2), 1.5)], [env(filt(noise(0.03, p.rnd), 'hp', 2000), 0.0005, 0.004), 0.07, 0.8]])); },
    rumble: function (p) { var d = Math.max(0.25, Math.min(0.8, p.dur || 0.4)), x = filt(noise(d, p.rnd), 'lp', 190), n = x.length; for (var i = 0; i < n; i++) x[i] *= 0.6 + 0.4 * Math.sin(TAU * 17 * i / SR); return norm(swell(mix([[x], [tone(d, 58, 44), 0, 0.6]]), 0.8)); },
    swellup: function (p) { var d = Math.max(0.4, Math.min(1.2, p.dur || 0.7)), x = mix([[filt(noise(d, p.rnd), 'bp', function (u) { return 500 + 3200 * u * u; }, 1.6)], [tone(d, 220 * p.pitch, 440 * p.pitch), 0, 0.35]]), n = x.length; for (var i = 0; i < n; i++) x[i] *= Math.pow(i / n, 2) * Math.min(1, (n - i) / 900); return norm(x); },
    shimmer: function (p) { var d = 0.6, L = [[tone(d, 2637 * p.pitch), 0, 0.5], [tone(d, 3951 * p.pitch), 0, 0.3], [tone(d, 5274 * p.pitch), 0, 0.2]]; return norm(swell(mix(L), 1.2)); },
    /* 持续类：按 dur 铺一串 */
    type: function (p) { return run(p, 21, function (k) { return [SOFT.tick({ pitch: p.pitch * (0.9 + p.rnd() * 0.25), rnd: p.rnd }), 0.55 + p.rnd() * 0.45]; }, 1.4); },
    roll: function (p) { var d = Math.max(0.25, Math.min(1.6, p.dur || 0.8)), q = run({ dur: d, rnd: p.rnd }, 17, function (k, u) { return [SOFT.blip({ pitch: p.pitch * (0.9 + 0.55 * u), rnd: p.rnd }), 0.45 + 0.3 * u]; }, 1.6); return norm(mix([[q, 0, 0.7], [SOFT.blip({ pitch: p.pitch * 2, rnd: p.rnd }), d, 1]])); },
    step: function (p) { return run(p, 5.6, function (k) { return [env(filt(noise(0.05, p.rnd), 'lp', 900 + (k % 2) * 300), 0.0005, 0.012), 0.8 + p.rnd() * 0.2]; }, 2.2); },
    dots: function (p) { var b = SOFT.blip({ pitch: p.pitch * 0.75, rnd: p.rnd }); return norm(mix([[b, 0], [b, 0.16], [b, 0.32]])); }
  };
  /** 一串重复的小声音：rate 次/秒，铺满 p.dur（封顶 cap 秒） */
  function run(p, rate, make, cap) {
    var d = Math.max(0.12, Math.min(cap, p.dur || 0.6)), L = [], n = Math.max(2, Math.round(d * rate));
    for (var k = 0; k < n; k++) { var u = k / (n - 1), s = make(k, u); L.push([s[0], u * d + (k ? (p.rnd() - 0.5) * 0.012 : 0) + 0.006, s[1]]); }
    return norm(mix(L));
  }

  /* ───────────────────────── 声音：pixel（方波、三角波、噪声通道，最后降位深） ───────────────────────── */
  function chip(x) { return crush(filt(x, 'lp', 9000), 6, 3); }
  /** 阶梯滑音：老游戏机没有平滑滑音，音高是一格一格跳的 */
  function stair(f0, f1, steps) { return function (u) { var k = Math.min(steps - 1, Math.floor(u * steps)); return f0 * Math.pow(f1 / f0, k / (steps - 1)); }; }
  var PIXEL = {
    pop: function (p) { return chip(norm(env(tone(0.085, stair(523 * p.pitch, 1047 * p.pitch, 4), 0, 'sq', 0.5), 0.001, 0.05))); },
    tick: function (p) { return chip(norm(env(tone(0.02, 1760 * p.pitch, 0, 'sq', 0.25), 0.0005, 0.012))); },
    click: function (p) { return chip(norm(env(tone(0.045, stair(1319 * p.pitch, 1760 * p.pitch, 2), 0, 'sq', 0.25), 0.0005, 0.03))); },
    swish: function (p) { var d = 0.15; return chip(norm(swell(mix([[noise(d * 0.5, p.rnd, 9)], [noise(d * 0.5, p.rnd, 5), d * 0.5]]), 1.2))); },
    whoosh: function (p) { var d = Math.max(0.24, Math.min(0.6, p.dur || 0.34)), L = [], k; for (k = 0; k < 6; k++) L.push([noise(d / 6, p.rnd, 14 - k * 2), k * d / 6]); return chip(norm(swell(mix(L), 1.4))); },
    thump: function (p) { return chip(norm(mix([[env(tone(0.2, stair(165 * p.pitch, 55 * p.pitch, 6), 0, 'tri'), 0.001, 0.08)], [env(noise(0.05, p.rnd, 26), 0.0005, 0.016), 0, 0.5]]))); },
    snap: function (p) { return chip(norm(mix([[env(tone(0.14, stair(220 * p.pitch, 82 * p.pitch, 4), 0, 'tri'), 0.001, 0.05)], [env(noise(0.05, p.rnd, 10), 0.0005, 0.014), 0, 0.6]]))); },
    hit: function (p) { return chip(norm(mix([[env(noise(0.16, p.rnd, 12), 0.0005, 0.05)], [env(tone(0.28, stair(131 * p.pitch, 41 * p.pitch, 7), 0, 'sq', 0.5), 0.001, 0.1), 0, 0.8]]))); },
    ding: function (p) { return chip(norm(mix([[env(tone(0.07, 988 * p.pitch, 0, 'sq', 0.5), 0.001, 0)], [env(tone(0.36, 1319 * p.pitch, 0, 'sq', 0.5), 0.001, 0.13), 0.07]]))); },
    chime: function (p) { var L = [], k, f = [1047, 1319, 1568, 2093]; for (k = 0; k < 4; k++) L.push([env(tone(k === 3 ? 0.3 : 0.07, f[k] * p.pitch, 0, 'sq', 0.25), 0.001, k === 3 ? 0.11 : 0), k * 0.065]); return chip(norm(mix(L))); },
    blip: function (p) { return chip(norm(env(tone(0.05, 880 * p.pitch, 0, 'sq', 0.25), 0.0005, 0.03))); },
    rise: function (p) { return chip(norm(env(tone(0.15, stair(659 * p.pitch, 1319 * p.pitch, 4), 0, 'sq', 0.25), 0.001, 0.1))); },
    fall: function (p) { return chip(norm(env(tone(0.24, stair(880 * p.pitch, 330 * p.pitch, 6), 0, 'sq', 0.25), 0.001, 0.14))); },
    buzz: function (p) { return chip(norm(env(tone(0.2, 98 * p.pitch, 0, 'sq', 0.125), 0.001, 0.16))); },
    sparkle: function (p) { var L = [], k, f = [2093, 2637, 3136, 2637, 3520, 4186]; for (k = 0; k < 6; k++) L.push([env(tone(0.05, f[k] * p.pitch, 0, 'tri'), 0.0005, 0.03), k * 0.05]); return chip(norm(mix(L))); },
    zap: function (p) { return chip(norm(env(tone(0.17, stair(1865 * p.pitch, 117 * p.pitch, 12), 0, 'sq', 0.5), 0.0005, 0.09))); },
    glitch: function (p) { var L = [], t = 0, k; for (k = 0; k < 9; k++) { var d = 0.02 + p.rnd() * 0.022; L.push([k % 3 === 1 ? noise(d, p.rnd, 6 + Math.floor(p.rnd() * 18)) : tone(d, 110 * Math.pow(2, Math.floor(p.rnd() * 30) / 6) * p.pitch, 0, 'sq', 0.5), t, 0.6 + p.rnd() * 0.4]); t += d; } return chip(norm(env(mix(L), 0.0005, 0))); },
    paper: function (p) { return PIXEL.swish(p); },
    flap: function (p) { var a = env(noise(0.04, p.rnd, 14), 0.0005, 0.012); return chip(norm(mix([[a], [a, 0.07, 0.75]]))); },
    card: function (p) { return chip(norm(mix([[env(noise(0.05, p.rnd, 7), 0.0005, 0.02)], [env(tone(0.02, 1568 * p.pitch, 0, 'sq', 0.25), 0.0005, 0.01), 0.05, 0.7]]))); },
    rumble: function (p) { var d = Math.max(0.2, Math.min(0.7, p.dur || 0.36)); return chip(norm(swell(noise(d, p.rnd, 40), 0.8))); },
    swellup: function (p) { var d = Math.max(0.35, Math.min(1, p.dur || 0.55)), x = tone(d, stair(220 * p.pitch, 880 * p.pitch, 9), 0, 'tri'), n = x.length; for (var i = 0; i < n; i++) x[i] *= Math.pow(i / n, 1.5) * Math.min(1, (n - i) / 600); return chip(norm(x)); },
    shimmer: function (p) { return PIXEL.sparkle(p); },
    type: function (p) { return run(p, 19, function () { return [PIXEL.tick({ pitch: p.pitch * 0.89, rnd: p.rnd }), 0.7 + p.rnd() * 0.3]; }, 1.4); },
    roll: function (p) { var d = Math.max(0.25, Math.min(1.6, p.dur || 0.8)), q = run({ dur: d, rnd: p.rnd }, 16, function (k, u) { return [PIXEL.blip({ pitch: p.pitch * Math.pow(2, Math.round(u * 9) / 12), rnd: p.rnd }), 0.6]; }, 1.6); return norm(mix([[q, 0, 0.7], [PIXEL.ding({ pitch: p.pitch, rnd: p.rnd }), d, 1]])); },
    step: function (p) { return run(p, 5.6, function (k) { return [chip(env(noise(0.035, p.rnd, k % 2 ? 30 : 22), 0.0005, 0.012)), 0.9]; }, 2.2); },
    dots: function (p) { var b = PIXEL.blip({ pitch: p.pitch * 0.75, rnd: p.rnd }); return norm(mix([[b, 0], [b, 0.16], [b, 0.32]])); }
  };

  /* cinema：soft 降一点音高、加空间感；paper：弹出换成敲木头，划入换成纸声 */
  function variant(base, change) { var o = {}; Object.keys(base).forEach(function (k) { o[k] = change(k, base[k]); }); return o; }
  var CINEMA = variant(SOFT, function (k, fn) { return function (p) { var q = { pitch: p.pitch * (/^(thump|hit|snap|rumble|whoosh)$/.test(k) ? 0.78 : 0.9), dur: p.dur, rnd: p.rnd }; return /^(type|step|tick|roll|dots)$/.test(k) ? fn(q) : norm(room(fn(q), 1.5, 0.3)); }; });
  var PAPER = variant(SOFT, function (k, fn) {
    if (k === 'swish' || k === 'whoosh') return function (p) { return SOFT.paper(p); };
    if (k === 'pop' || k === 'click') return function (p) { return norm(mix([[env(filt(noise(0.06, p.rnd), 'bp', 1300 * p.pitch, 2.4), 0.0005, 0.012)], [env(tone(0.07, 420 * p.pitch), 0.0005, 0.02), 0, 0.6]])); };
    return fn;
  });
  var PALETTES = { soft: SOFT, pixel: PIXEL, cinema: CINEMA, paper: PAPER };

  /* 每种声音放多响（满刻度的几分之几）。音效是垫在人声下面的，整体偏轻。 */
  var LEVEL = { pop: 0.2, tick: 0.1, click: 0.16, swish: 0.13, whoosh: 0.2, thump: 0.26, snap: 0.22, hit: 0.3, ding: 0.14, chime: 0.14, blip: 0.12, rise: 0.14, fall: 0.14, buzz: 0.12, sparkle: 0.1, zap: 0.14, glitch: 0.15, paper: 0.14, flap: 0.14, card: 0.12, rumble: 0.2, swellup: 0.16, shimmer: 0.07, type: 0.085, roll: 0.1, step: 0.12, dots: 0.1 };
  /* 方波比正弦波听起来响得多，pixel 音色整体再压一点 */
  var PALETTE_GAIN = { soft: 1, pixel: 0.62, cinema: 1, paper: 1 };

  /* ───────────────────────── 动效 → 声音 对照表 ───────────────────────── */
  function table(o) { var m = {}; Object.keys(o).forEach(function (kind) { o[kind].split(' ').forEach(function (name) { m[name] = kind; }); }); return m; }
  var MAP = table({
    pop: 'pop-in scale-in pixel-in jack-in stick-on stop-in ping callout check toggle bring-front tada float-pop layer-focus screen-pop bubble-pop3d pop-3d',
    thump: 'drop-bounce stamp-in fall-out drop-gather bignum squash box-drop coin-drop',
    swish: 'drop-in rise-in slide-in blur-rise-in wipe-in mask-rise flip-in tilt-in swing-in grow-x grow-y fan-in light-speed-in rise-out drop-out slide-out wipe-out scale-out hinge scatter-out swap flip-swap rotate-words morph stroke-in peel-in layer-rise cut-in paper-unfold lift pick slice-to helix-spin zoom-settle surround-in shape-morph reorder pose-3d rig-focus layer-explode grid-hero polaroid-eject phone-split phone-wave pin-move desk-invert',
    whoosh: 'zoom-to cam-look cam-wide zoom-here fly cutaway dive push-into path-move wall-pull card-storm board-lay',
    tick: 'marker underline strike box border-beam scan circuit beam screen-to road-walk code-focus lock-callouts stack-print',
    click: 'click agent-go blueprint-scan',
    ding: 'check-fix',
    type: 'type retype scramble stream-in prompt run',
    roll: 'count roll clock cal-flip',
    rumble: 'shake cam-shake head-shake wobble overload overwhelm wiggle',
    snap: 'closeup',
    hit: 'slab-shatter',
    shimmer: 'glow sheen spot spotlight light-sweep',
    sparkle: 'confetti sparkle burst burst3d cta-click',
    glitch: 'glitch dither-in',
    blip: 'choose pulse heartbeat step-focus',
    step: 'walk mini-walk',
    card: 'deal-in msg diff flip-3d deal-arc deck-gather letter-shuffle sleeve-draw carousel-next',
    flap: 'flip-to split-flap flap-to',
    swellup: 'fill ring light-leak',
    paper: 'ink-circle ink-underline ink-box ink-arrow ink-mark',
    dots: 'typing',
    rise: 'hub-node'
  });
  var TRANS = { 'blur-cross': 'swish', 'zoom-through': 'whoosh', push: 'whoosh', wipe: 'swish', iris: 'swish', flash: 'hit', pixelate: 'glitch', 'paper-slide': 'paper', tear: 'paper', 'glitch-cut': 'glitch', open: 'swish', shatter: 'glitch', 'diagonal-split': 'swish', blinds: 'flap', 'crt-off': 'zap', 'portal-spin': 'whoosh', halftone: 'swish', 'cam-to': 'whoosh', 'cam-jump': 'swish', mosaic: 'glitch', 'card-wipe': 'whoosh' };
  var EMOTE = { question: 'rise', exclaim: 'snap', sweat: 'fall', anger: 'buzz', sparkle: 'sparkle', idea: 'ding', heart: 'chime', zap: 'zap', dots: 'dots' };
  /* 声音该落在动作的哪一刻（秒）：落地类的「咚」要等东西掉下来，转场的「哗」要早一点起 */
  var LAG = { 'drop-gather': 0.22, bignum: 0.12, cutaway: -0.06, dive: -0.04 };
  /* 落点跟着动效自己的时长走：[时长的几分之几, 默认时长]。掉落弹跳在 36% 处第一次着地，盖章在结束那一刻砸到位 */
  var LAND = { 'drop-bounce': [0.36, 0.8], 'stamp-in': [1, 0.32] };
  /* 持续类：声音铺多长，默认取动效自己的 dur */
  var LONG = { type: 1, roll: 1, step: 1, rumble: 1, swellup: 1, whoosh: 1 };
  var VARY = { pop: 1, thump: 1, snap: 1, swish: 1, tick: 1, blip: 1, card: 1 };

  function stageEl() { return root.document && (root.document.querySelector('[data-composition-id]') || root.document.getElementById('root')); }
  function paletteName() {
    var st = stageEl(); if (!st) return 'soft';
    var a = st.getAttribute('data-sound'); if (a) return a;
    var cls = (st.className || '') + ' ' + (root.document.body ? root.document.body.className : '');
    return /theme-pixel/.test(cls) ? 'pixel' : /theme-(gold|space)/.test(cls) ? 'cinema' : /theme-paper/.test(cls) ? 'paper' : 'soft';
  }
  function panOf(el) {
    try {
      var r = el && FX.rect ? FX.rect(el) : null; if (!r || !isFinite(r.x)) return 0;
      var st = stageEl(), W = num(st && st.getAttribute('data-width'), 1920), x = (r.x + (r.w || 0) / 2) / W - 0.5;
      return Math.max(-0.55, Math.min(0.55, x * 1.2));
    } catch (e) { return 0; }
  }

  /** 把 FX.build 记下的每一次动效调用（FX.calls）换算成音效清单 */
  function cues(total) {
    var out = [], pal = paletteName(), seen = {};
    if (pal === 'off' || pal === 'none') return { total: total, palette: 'off', cues: [] };
    (FX.calls || []).forEach(function (c, idx) {
      var o = c.o || {}, kind;
      if (o.sfx !== undefined) kind = String(o.sfx);
      else if (c.el && c.el.closest && c.el.closest('[data-sfx="off"]')) return;
      else kind = c.trans ? TRANS[c.name] : c.name === 'sfx' ? String(o.kind || 'ding') : c.name === 'pup-emote' ? EMOTE[o.kind || 'exclaim'] : MAP[c.name];
      if (!kind || kind === 'none' || kind === 'off' || kind === '0' || !SOFT[kind]) return;
      var t = c.t + (LAG[c.name] || 0) + (LAND[c.name] ? LAND[c.name][0] * num(o.dur, LAND[c.name][1]) : 0) + (c.trans ? -0.05 : 0), vol = num(o.vol, 1), pitch = num(o.pitch, 1), pan = panOf(c.el);
      // 同一种声音反复出现时，音高在三档之间轮换（差一个全音），听起来不机械
      if (o.pitch === undefined && VARY[kind]) { seen[kind] = (seen[kind] || 0) + 1; pitch *= [1, 1.122, 0.891][seen[kind] % 3]; }
      var n = o.__n || c.n || 1, st = typeof o.__st === 'number' ? o.__st : typeof o.stagger === 'number' ? o.stagger : 0.08, dur = typeof o.dur === 'number' ? o.dur : undefined;
      if (c.mod === 'chars' && n > 3 && !LONG[kind]) { out.push({ t: t, kind: 'type', dur: Math.min(1.4, n * st), gain: vol, pitch: pitch, pan: pan, seed: idx }); return; }
      if (n > 1 && !LONG[kind]) {
        for (var i = 0; i < Math.min(n, 6); i++) out.push({ t: t + i * st, kind: kind, gain: vol * (1 - i * 0.07), pitch: pitch * Math.pow(2, i * 2 / 12), pan: pan, seed: idx * 31 + i });
        return;
      }
      out.push({ t: t, kind: kind, dur: LONG[kind] ? dur : undefined, gain: vol, pitch: pitch, pan: pan, seed: idx });
      if (o.__click !== undefined) out.push({ t: o.__click, kind: 'click', gain: vol, pitch: 1, pan: pan, seed: idx + 7 });
    });
    out = out.filter(function (c) { return c.t > -0.1 && c.t < total; }).sort(function (a, b) { return a.t - b.t; });
    // 太密就删：同一种声音 80 毫秒内只留第一个；任意 0.12 秒里最多留 3 个
    var keep = [];
    out.forEach(function (c) {
      var near = keep.filter(function (k) { return c.t - k.t < 0.12; });
      if (near.some(function (k) { return k.kind === c.kind && c.t - k.t < 0.08; }) || near.length >= 3) return;
      c.t = Math.max(0, Math.round(c.t * 1000) / 1000); keep.push(c);
    });
    return { total: total, palette: PALETTES[pal] ? pal : 'soft', cues: keep };
  }

  /** 合成整条音效轨：返回 { L, R }（Float32Array，48kHz） */
  function render(list, total, palette) {
    var P = PALETTES[palette] || SOFT, pg = PALETTE_GAIN[palette] || 1, n = N(total + 0.5), L = new Float32Array(n), R = new Float32Array(n), cache = {};
    list.forEach(function (c) {
      var key = [c.kind, c.pitch || 1, c.dur || 0, c.seed || 0].join('|'), b = cache[key];
      if (!b) b = cache[key] = (P[c.kind] || SOFT[c.kind])({ pitch: c.pitch || 1, dur: c.dur, rnd: mulberry((c.seed || 0) * 7919 + 13) });
      var s = Math.round(c.t * SR), g = (LEVEL[c.kind] || 0.12) * pg * (c.gain === undefined ? 1 : c.gain), a = ((c.pan || 0) + 1) * Math.PI / 4, gl = Math.cos(a) * 1.414 * g, gr = Math.sin(a) * 1.414 * g;
      for (var i = 0; i < b.length && s + i < n; i++) { L[s + i] += b[i] * gl; R[s + i] += b[i] * gr; }
    });
    for (var i = 0; i < n; i++) { L[i] = Math.tanh(L[i] * 1.2) / 1.2; R[i] = Math.tanh(R[i] * 1.2) / 1.2; }
    return { L: L, R: R };
  }
  /** 16 位立体声 WAV（Uint8Array） */
  function wav(ch) {
    var n = ch.L.length, u = new Uint8Array(44 + n * 4), v = new DataView(u.buffer), w = function (o, s) { for (var i = 0; i < s.length; i++) u[o + i] = s.charCodeAt(i); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
    for (var i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, ch.L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, ch.R[i])) * 32767, true); }
    return u;
  }

  FX.sound = { SR: SR, palettes: PALETTES, map: MAP, trans: TRANS, emote: EMOTE, level: LEVEL, kinds: Object.keys(SOFT), cues: cues, render: render, wav: wav };

  /* ───────────────────────── 浏览器里：登记 sfx 动效、?cues 导出、?play 预览出声 ───────────────────────── */
  if (FX.register) FX.register('sfx', '声音', '单独放一个音效（画面上没有动作也能响）。参数 kind=' + Object.keys(SOFT).join('|') + '、vol（音量倍数）、pitch（音高倍数）、dur（持续类声音的秒数）', function () {});
  if (!root.document || !FX.register) return;

  FX.afterBuild = FX.afterBuild || [];
  FX.afterBuild.push(function (tl, total) {
    var q = root.location ? root.location.search + root.location.hash : '', data = cues(total);
    FX.sound.last = data;
    if (/[?&#]cues\b/.test(q)) {
      var s = root.document.getElementById('fx-cues') || root.document.createElement('script');
      s.id = 'fx-cues'; s.type = 'application/json'; s.textContent = JSON.stringify(data); root.document.body.appendChild(s);
    }
    if (!/[?&#]play\b/.test(q) || !data.cues.length || !root.gsap) return;
    // 预览：第一次点击或按键后才允许出声（浏览器的规定），之后跟着时间线走
    var AC = root.AudioContext || root.webkitAudioContext, ctx = null, buf = null, src = null, at = 0, t0 = 0;
    function stop() { if (src) { try { src.stop(); } catch (e) {} src = null; } }
    function start(t) {
      stop(); if (!ctx || !buf || t >= buf.duration) return;
      src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start(0, Math.max(0, t)); at = ctx.currentTime; t0 = t;
    }
    function unlock() {
      if (ctx || !AC) return;
      ctx = new AC({ sampleRate: SR }); var ch = render(data.cues, total, data.palette);
      buf = ctx.createBuffer(2, ch.L.length, SR); buf.getChannelData(0).set(ch.L); buf.getChannelData(1).set(ch.R);
    }
    root.addEventListener('pointerdown', unlock, true); root.addEventListener('keydown', unlock, true);
    root.gsap.ticker.add(function () {
      if (!ctx) return;
      var playing = !tl.paused() && tl.progress() < 1, t = tl.time();
      if (!playing) { stop(); return; }
      if (!src || Math.abs(t0 + (ctx.currentTime - at) - t) > 0.12) start(t);
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
