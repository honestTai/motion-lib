/*!
 * FX 舞台剧模块 v1.8  ——  motion-lib 的可选扩展：场景舞台 + 画中画 + 小演员
 *
 * 「主持人常驻前景，背景是一个个场景，信息用画中画给，隔一会儿切一张全屏插画」这种动画科普片的全套零件：
 *
 *   场景背景   data-make="backdrop"   一张图（data-src），或程序画的像素场景（data-kind="field|room|city|night"）
 *   换场       data-in="mosaic"       纸色方块盖满再揭开；演员和常驻层在方块上面，不会被盖住
 *   插画特写   cutaway@t(dur=1.8)     全屏插画硬切进来、慢推、硬切回去；期间盖住演员，字幕和章节条还在
 *   设备屏     data-make="device"     笔记本 / 手机 / 窗口里放内容：screen-to 屏内硬切，dive 钻进屏幕铺满全屏
 *   序列帧     frames@t(fps=15)       把一串截图当视频播（实机录屏），逐帧确定
 *   选择面板   data-make="menu"       选择题面板：choose 让高亮条跳到某一项并打勾
 *   小演员     data-make="mini"       全身小人：mini-walk 两帧步态走过去，mini-pose 换动作
 *
 * 主持人（半身立绘）用 fx-puppet.js 的 actor；这个模块不依赖它，但一般一起用。
 * 和主库一样：所有画面都是「时间的纯函数」，任意跳帧、重复渲染结果相同。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-stage：请先加载 fx.js');

  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var rel = function (n) { return (n >= 0 ? '+=' : '-=') + Math.abs(n); };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var mk = function (tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; };
  var kidsOf = function (el) { return Array.prototype.slice.call(el.children); };
  var stageEl = function () { return document.querySelector('[data-composition-id]'); };
  var def = FX.register, CAT = '舞台';

  /* ═════════════════════════ 场景背景 ═════════════════════════
   * 程序画的像素场景：在 320×180 的小画布上画，再按最近邻放大，所以是干净的像素风，不需要任何图片素材。 */
  var KINDS = {
    field: function (R, r, W, H) {
      ['#7cc4f5', '#8ecff8', '#a2daf9', '#b8e5fb', '#cdeffc', '#e0f6fd'].forEach(function (c, i) { R(0, i * 19, W, 20, c); });
      for (var i = 0; i < 6; i++) { var cx = r() * W, cy = 8 + r() * 46, cw = 18 + r() * 26; R(cx, cy, cw, 6, '#ffffff'); R(cx + 4, cy - 4, cw - 10, 5, '#ffffff'); R(cx + 2, cy + 5, cw - 6, 2, '#e6f3fb'); }
      for (i = 0; i < 9; i++) R(i * 40 - 10 + r() * 14, 98 - r() * 10, 46, 24, i % 2 ? '#9fd69a' : '#aedfa6');
      for (i = 0; i < 7; i++) { var tx = 14 + i * 46 + r() * 18, th = 16 + r() * 12, s = 0.8 + r() * 0.5; R(tx + 8 * s, 114 - th, 4 * s, th, '#7a5a3a'); R(tx, 100 - th - 8 * s, 20 * s, 18 * s, '#4c9b4c'); R(tx + 2, 100 - th - 8 * s, 8 * s, 5 * s, '#66b866'); R(tx + 10 * s, 108 - th, 8 * s, 5 * s, '#3f8a42'); }
      R(0, 114, W, 10, '#63b84e'); R(0, 114, W, 2, '#7ccc62'); R(0, 124, W, 2, '#4a9a3a'); R(0, 126, W, H - 126, '#8a5a34');
      for (i = 0; i < 90; i++) R(r() * W, 128 + r() * (H - 130), 3 + r() * 4, 2, r() < 0.5 ? '#7a4c2a' : '#9b6a40');
    },
    room: function (R, r, W, H) {
      R(0, 0, W, 104, '#f4e3ba'); R(0, 0, W, 6, '#e6cf9c'); R(0, 86, W, 18, '#cf9658'); R(0, 86, W, 2, '#b67c42');
      for (var i = 0; i < 16; i++) R(i * 22, 88, 1, 16, '#b67c42');
      R(36, 22, 132, 58, '#7a4c2a'); R(40, 26, 124, 50, '#2f5d50'); R(40, 26, 124, 3, '#3b7163'); R(36, 80, 132, 4, '#9c6a3c'); R(60, 40, 44, 2, '#cfe3da'); R(60, 48, 70, 2, '#b9d3c8'); R(60, 56, 30, 2, '#cfe3da');
      R(204, 16, 92, 62, '#8a5a34'); R(208, 20, 84, 54, '#bfe8ff'); R(208, 46, 84, 28, '#d7f2ff'); R(248, 20, 4, 54, '#8a5a34'); R(208, 45, 84, 3, '#8a5a34'); R(214, 28, 22, 6, '#ffffff'); R(262, 34, 18, 5, '#ffffff');
      R(180, 28, 14, 14, '#fff8e6'); R(186, 30, 1, 6, '#5a4630'); R(186, 35, 4, 1, '#5a4630');
      R(0, 104, W, H - 104, '#b9743c'); R(0, 104, W, 3, '#d08c4e');
      for (i = 0; i < 7; i++) { R(0, 114 + i * 11, W, 1, '#9c5f2f'); for (var k = 0; k < 6; k++) R((k * 60 + (i % 2) * 30 + r() * 8) % W, 115 + i * 11, 1, 10, '#9c5f2f'); }
      R(0, 104, 70, H, 'rgba(255,240,200,0.10)');
    },
    city: function (R, r, W, H) {
      ['#8fd0fa', '#a6dbfb', '#bfe6fc', '#d6f0fd', '#e9f8fe'].forEach(function (c, i) { R(0, i * 20, W, 21, c); });
      for (var i = 0; i < 5; i++) { var cx = r() * W, cy = 6 + r() * 30; R(cx, cy, 30, 6, '#ffffff'); R(cx + 6, cy - 4, 16, 5, '#ffffff'); }
      var cols = ['#c97b5a', '#d9a066', '#8fa3b8', '#b5654a', '#e3c08a', '#7f93a8'], x = -6;
      while (x < W) { var bw = 26 + r() * 22, bh = 44 + r() * 52, c = cols[Math.floor(r() * cols.length)]; R(x, 122 - bh, bw, bh, c); R(x, 122 - bh, bw, 3, 'rgba(255,255,255,0.25)'); R(x + bw - 3, 122 - bh, 3, bh, 'rgba(0,0,0,0.12)');
        for (var wy = 122 - bh + 8; wy < 112; wy += 11) for (var wx = x + 4; wx < x + bw - 7; wx += 8) R(wx, wy, 4, 6, r() < 0.3 ? '#fff3c4' : '#5e7389'); x += bw + 1; }
      for (i = 0; i < 6; i++) { var tx = 20 + i * 56 + r() * 10; R(tx + 4, 110, 3, 12, '#6b4a2e'); R(tx - 2, 100, 15, 12, '#4c9b4c'); R(tx, 100, 6, 4, '#66b866'); }
      R(0, 122, W, 8, '#cfc7b8'); R(0, 122, W, 1, '#e3dccf'); R(0, 130, W, H - 130, '#5a5f6b'); R(0, 130, W, 2, '#484c57');
      for (i = 0; i < 9; i++) R(i * 40 + 6, 152, 22, 3, '#f2f2f2');
    },
    night: function (R, r, W, H) {
      ['#0e1736', '#131f45', '#182854', '#1e3163', '#243a6b'].forEach(function (c, i) { R(0, i * 24, W, 25, c); });
      for (var i = 0; i < 60; i++) R(r() * W, r() * 90, 1, 1, r() < 0.3 ? '#fff6cf' : '#9fb4e6');
      R(250, 18, 14, 14, '#fff3c4'); R(254, 16, 6, 18, '#fff3c4'); R(248, 22, 18, 6, '#fff3c4');
      var x = -4;
      while (x < W) { var bw = 22 + r() * 26, bh = 36 + r() * 60; R(x, 126 - bh, bw, bh, '#0b1228'); for (var wy = 126 - bh + 6; wy < 118; wy += 9) for (var wx = x + 3; wx < x + bw - 5; wx += 7) if (r() < 0.42) R(wx, wy, 3, 5, r() < 0.8 ? '#ffd36b' : '#8fd6ff'); x += bw + 2; }
      R(0, 126, W, H - 126, '#1a2444'); R(0, 126, W, 2, '#2a3760');
      for (i = 0; i < 8; i++) R(i * 44 + 8, 146 + (i % 2) * 10, 30, 2, '#243055');
    }
  };
  /** 场景背景：data-src="图片" 用图片；不写就按 data-kind 程序画（field 草地 / room 教室 / city 街道 / night 夜景），data-seed 换一个随机样子 */
  FX.make.backdrop = function (el) {
    el.classList.add('fx-backdrop');
    var src = attr(el, 'src', '');
    if (src) { el.style.backgroundImage = 'url("' + src + '")'; atmos(el, src); return; }
    var W = 320, H = 180, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d'), r = FX.rand(num(attr(el, 'seed'), 3));
    var R = function (x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    (KINDS[attr(el, 'kind', 'field')] || KINDS.field)(R, r, W, H);
    el.appendChild(cv);
    atmos(el, attr(el, 'focus', '') ? cv.toDataURL() : '');
  };

  /* ═════════════════════════ 场景氛围：让一张静止的背景「活」起来 ═════════════════════════
   * 写在 data-make="backdrop" 上，四样可以单独用，也可以叠着用：
   *   data-grade="warm|cool|night|dusk|neon|plain"   调色 + 暗角（plain 只有暗角）
   *   data-focus="tilt"                              移轴景深：上下两条虚、中间实（像素图 + 景深 = HD-2D 的味道）；写数字是模糊的像素数
   *   data-lights="x,y,颜色,半径; x,y,颜色,半径,slow"  光源：一团会呼吸的光，坐标按画面像素；末尾加 slow 是屏幕 / 窗户那种慢慢起伏的光
   *   data-weather="dust|rain|snow|fireflies|embers|stars|rays"   空气里的东西，可以写多个（空格隔开）
   * 全部按时间线的秒数计算，倒放、跳帧、分片渲染结果都一样；连续几个分镜用同一张背景时，光和粒子是连着的。
   * 光源「呼吸」和「后期加景深」的做法参考了 Lemo-Opuscar（MIT）的 HD-2D 风格说明。 */
  var ATMOS = [];
  function atmos(el, img) {
    var grade = attr(el, 'grade', ''), focus = attr(el, 'focus', ''), lights = attr(el, 'lights', ''), weather = attr(el, 'weather', '');
    if (!grade && !focus && !lights && !weather) return;
    var st = stageEl(), W = num(st && st.getAttribute('data-width'), 1920), H = num(st && st.getAttribute('data-height'), 1080);
    var pixel = !!(st && /theme-pixel/.test(st.className + ' ' + document.body.className));
    var it = { el: el, lights: [], rays: [], layers: [], seed: num(attr(el, 'seed'), 3) }, r = FX.rand(it.seed * 131 + 7);
    var pos = function (x, y) { return 'left:' + ((x / W + 0.03) / 1.06 * 100).toFixed(3) + '%;top:' + ((y / H + 0.03) / 1.06 * 100).toFixed(3) + '%;'; };
    if (focus && img) ['top', 'bottom'].forEach(function (side) {
      var b = mk('div', 'fx-bd-blur ' + side); b.style.backgroundImage = 'url("' + img + '")';
      if (!isNaN(+focus)) b.style.setProperty('--blur', +focus + 'px');
      el.appendChild(b);
    });
    var kinds = weather.split(/[\s,;]+/).filter(Boolean);
    if (kinds.indexOf('rays') >= 0) for (var k = 0; k < 4; k++) {
      var ray = mk('div', 'fx-bd-ray'); ray.style.cssText = 'left:' + (12 + k * 21 + r() * 8).toFixed(1) + '%;width:' + Math.round(110 + r() * 150) + 'px';
      el.appendChild(ray); it.rays.push({ el: ray, a: 0.5 + r() * 0.5, f: 0.11 + r() * 0.12, ph: r() * 6.28 });
    }
    kinds.filter(function (k) { return WEATHER[k]; }).forEach(function (kind) {
      var cv = mk('canvas', 'fx-bd-weather' + (pixel ? ' px' : ''));
      cv.width = pixel ? 384 : 960; cv.height = pixel ? 216 : 540;
      el.appendChild(cv);
      it.layers.push({ cv: cv, ctx: cv.getContext('2d'), draw: WEATHER[kind], parts: seedParts(FX.rand(it.seed * 977 + kind.length * 13), 160), u: pixel ? 1 : 2.5 });
    });
    lights.split(';').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (spec) {
      var a = spec.split(',').map(function (x) { return x.trim(); }), R = num(a[3], 220), L = mk('div', 'fx-bd-light');
      L.style.cssText = pos(num(a[0], W / 2), num(a[1], H / 2)) + 'width:' + R * 2 + 'px;height:' + R * 2 + 'px;margin:' + -R + 'px 0 0 ' + -R + 'px;background:radial-gradient(circle closest-side,' + (a[2] || '#ffd9a0') + ' 0%,transparent 100%)';
      el.appendChild(L); it.lights.push({ el: L, slow: a[4] === 'slow', p1: r() * 6.28, p2: r() * 6.28, p3: r() * 6.28 });
    });
    if (grade) { var g = mk('div', 'fx-bd-grade'); g.setAttribute('data-grade', grade); el.appendChild(g); }
    ATMOS.push(it);
  }
  function seedParts(r, n) { var a = []; for (var i = 0; i < n; i++) a.push({ x: r(), y: r(), v: r(), s: r(), ph: r() * 6.28, ph2: r() * 6.28 }); return a; }
  var wrap = function (v, m) { return ((v % m) + m) % m; };
  /* 每种天气：(ctx, 宽, 高, 秒, 粒子表, 单位像素)。位置只由秒数决定，不记上一帧的状态。 */
  var WEATHER = {
    dust: function (c, W, H, t, P, u) {
      for (var i = 0; i < 46; i++) { var p = P[i], x = wrap(p.x * W + (4 + p.v * 7) * u * t + 9 * u * Math.sin(t * 0.4 + p.ph), W), y = wrap(p.y * H - (2 + p.v * 5) * u * t, H), a = 0.16 + 0.36 * (0.5 + 0.5 * Math.sin(t * (0.7 + p.s) + p.ph2)), z = (p.s > 0.7 ? 2 : 1) * u;
        c.fillStyle = 'rgba(255,244,214,' + a.toFixed(3) + ')'; c.fillRect(Math.round(x), Math.round(y), z, z); }
    },
    rain: function (c, W, H, t, P, u) {
      c.fillStyle = 'rgba(205,224,255,0.42)';
      for (var i = 0; i < 150; i++) { var p = P[i], sp = (300 + p.v * 150) * u, y = wrap(p.y * H + sp * t, H + 20 * u) - 10 * u, x = wrap(p.x * W * 1.3 - (y + p.y * H) * 0.26, W * 1.3) - W * 0.15, len = Math.round((5 + p.s * 6) * u);
        for (var k = 0; k < len; k += u) c.fillRect(Math.round(x - k * 0.26), Math.round(y + k), u, u); }
    },
    snow: function (c, W, H, t, P, u) {
      for (var i = 0; i < 90; i++) { var p = P[i], y = wrap(p.y * H + (12 + p.v * 22) * u * t, H), x = wrap(p.x * W + 7 * u * Math.sin(t * (0.5 + p.s * 0.6) + p.ph), W), z = (p.s > 0.75 ? 2 : 1) * u;
        c.fillStyle = 'rgba(255,255,255,' + (0.55 + p.s * 0.4).toFixed(2) + ')'; c.fillRect(Math.round(x), Math.round(y), z, z); }
    },
    fireflies: function (c, W, H, t, P, u) {
      for (var i = 0; i < 16; i++) { var p = P[i], x = p.x * W + 24 * u * Math.sin(t * 0.31 + p.ph) + 8 * u * Math.sin(t * 0.83 + p.ph2), y = (0.35 + p.y * 0.6) * H + 14 * u * Math.sin(t * 0.27 + p.ph2) + 5 * u * Math.sin(t * 0.9 + p.ph), a = Math.pow(Math.max(0, Math.sin(t * (0.9 + p.s) + p.ph)), 2);
        if (a < 0.03) continue; x = Math.round(x); y = Math.round(y);
        c.fillStyle = 'rgba(190,255,120,' + (a * 0.28).toFixed(3) + ')'; c.fillRect(x - u, y - u, 3 * u, 3 * u);
        c.fillStyle = 'rgba(236,255,170,' + a.toFixed(3) + ')'; c.fillRect(x, y, u, u); }
    },
    embers: function (c, W, H, t, P, u) {
      for (var i = 0; i < 36; i++) { var p = P[i], h = wrap(p.y * H + (16 + p.v * 30) * u * t, H), y = H - h, x = wrap(p.x * W + 10 * u * Math.sin(t * (0.8 + p.s) + p.ph) + 3 * u * t, W), a = Math.max(0, 1 - h / (H * 0.85)) * (0.6 + 0.4 * Math.sin(t * 5 + p.ph2));
        c.fillStyle = 'rgba(255,' + Math.round(150 + p.s * 70) + ',70,' + Math.max(0, a).toFixed(3) + ')'; c.fillRect(Math.round(x), Math.round(y), u, u); }
    },
    stars: function (c, W, H, t, P, u) {
      for (var i = 0; i < 70; i++) { var p = P[i], a = 0.25 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(t * (0.6 + p.s * 1.6) + p.ph), 2), z = (p.v > 0.86 ? 2 : 1) * u;
        c.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; c.fillRect(Math.round(p.x * W), Math.round(p.y * H * 0.55), z, z); }
    }
  };
  // 每一帧按时间线的秒数重画（只画当前看得见的那个分镜的背景）
  (FX.afterBuild = FX.afterBuild || []).push(function (tl, total) {
    if (!ATMOS.length) return;
    ATMOS.forEach(function (it) { var sc = it.el.closest('.scene'); it.scene = (FX.scenes || []).filter(function (s) { return s.el === sc; })[0]; });
    var paint = function () {
      var t = tl.time();
      ATMOS.forEach(function (it) {
        var s = it.scene; if (s && (t < s.t - 0.7 || t > s.end + (s.hold || 0) + 0.7)) return;
        it.lights.forEach(function (L) {
          var lv = L.slow ? 0.86 + 0.14 * Math.sin(t * 1.5 + L.p1) : 0.8 + 0.11 * Math.sin(t * 8.2 + L.p1) + 0.06 * Math.sin(t * 23.3 + L.p2) + 0.03 * Math.sin(t * 44.7 + L.p3);
          L.el.style.opacity = (0.62 * lv).toFixed(3); L.el.style.transform = 'scale(' + (0.9 + 0.12 * lv).toFixed(3) + ')';
        });
        it.rays.forEach(function (R) { R.el.style.opacity = (R.a * (0.55 + 0.45 * Math.sin(t * R.f * 6.28 + R.ph))).toFixed(3); });
        it.layers.forEach(function (Y) { Y.ctx.clearRect(0, 0, Y.cv.width, Y.cv.height); Y.draw(Y.ctx, Y.cv.width, Y.cv.height, t, Y.parts, Y.u); });
      });
    };
    tl.to({ v: 0 }, { v: 1, duration: total, ease: 'none', onUpdate: paint }, 0);
    paint();
  });

  // 背景自己会动：换到一个新场景时先「落位」（从略大收回来，切镜有了落点），之后一直极慢地往前推；
  // 连续几个分镜用同一张背景时当成同一个场景，不重新落位——观众感觉是同一个地方在继续。
  // 背景上自己写了 data-fx 的不管。
  (FX.afterBuild = FX.afterBuild || []).push(function (tl) {
    var run = null, n = 0;
    (FX.scenes || []).filter(function (s) { return !s.el.classList.contains('overlay'); }).forEach(function (s) {
      var bg = s.el.querySelector('.fx-backdrop');
      if (!bg) { run = null; return; }
      var key = attr(bg, 'src', '') || attr(bg, 'kind', 'field') + '#' + attr(bg, 'seed', '3');
      if (!run || run.key !== key) { run = { key: key, t0: s.t, dir: n++ % 2 ? 1 : -1 }; }
      if (bg.hasAttribute('data-fx')) return;
      var rate = 0.005, sc = function (t) { return Math.min(1.14, 1.01 + rate * (t - run.t0)); }, dx = function (t) { return run.dir * Math.min(26, 3 * (t - run.t0)); };
      if (s.t === run.t0) {
        tl.fromTo(bg, { scale: 1.1, x: 0 }, { scale: sc(s.t + 0.5), x: dx(s.t + 0.5), duration: 0.5, ease: 'expo.out', immediateRender: false }, s.t);
        tl.to(bg, { scale: sc(s.end), x: dx(s.end), duration: Math.max(0.1, s.d - 0.5), ease: 'none' }, s.t + 0.5);
      } else tl.fromTo(bg, { scale: sc(s.t), x: dx(s.t) }, { scale: sc(s.end), x: dx(s.end), duration: s.d, ease: 'none', immediateRender: false }, s.t);
    });
  });

  // 记分牌（.fx-score）的底板跟着里面第一个数字一起出现：数字还没来的那几秒不留一块空板子
  (FX.afterBuild = FX.afterBuild || []).push(function (tl) {
    Array.prototype.forEach.call(document.querySelectorAll('.fx-score'), function (el) {
      if (el.hasAttribute('data-fx')) return;
      var first = Infinity, sc = el.closest('.scene'), s = (FX.scenes || []).filter(function (x) { return x.el === sc; })[0];
      (FX.calls || []).forEach(function (c) { if (c.el && c.el !== el && el.contains(c.el)) first = Math.min(first, c.t); });
      if (!s || !isFinite(first) || first - s.t < 0.15) return;
      tl.set(el, { opacity: 0 }, 0);
      tl.to(el, { opacity: 1, duration: 0.1, ease: 'none' }, first - 0.02);
    });
  });

  /* ═════════════════════════ 换场：马赛克 ═════════════════════════ */
  FX.trans.mosaic = function (tl, t, prev, next, o) {
    var st = stageEl(), W = st.offsetWidth, H = st.offsetHeight, cols = num(o.cols, 24), size = Math.ceil(W / cols), rows = Math.ceil(H / size);
    var d = num(o.dur, 0.66), half = d / 2, r = FX.rand(num(o.seed, 9)), wrap = mk('div', 'fx-mosaic');
    var color = o.color || getComputedStyle(st).getPropertyValue('--fx-bg').trim() || '#efe9dc', cells = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var c = mk('i');
      c.style.cssText = 'left:' + x * size + 'px;top:' + y * size + 'px;width:' + (size + 1) + 'px;height:' + (size + 1) + 'px;background:' + color;
      wrap.appendChild(c);
      cells.push({ el: c, a: r() * 0.7 + y / rows * 0.3, b: r() });      // 盖的时候大致从上往下，揭的时候完全随机
    }
    st.insertBefore(wrap, st.querySelector('.scene.overlay'));           // 放在普通分镜之上、常驻层之下：演员不会被盖住
    cells.forEach(function (k) {
      tl.set(k.el, { visibility: 'visible' }, t - half + k.a * half * 0.92);
      tl.set(k.el, { visibility: 'hidden' }, t + 0.04 + k.b * half * 0.92);
    });
    return 0;
  };
  FX.catalog.push({ name: 'mosaic', cat: '转场', desc: '马赛克换场：纸色方块从上往下随机盖满，再随机揭开新场景；方块在演员和常驻层下面，主持人不会被盖住（换章节、换场景背景时用）。参数 cols（一行几块，默认 24）、color、dur、seed' });

  /* ═════════════════════════ 插画特写 ═════════════════════════ */
  var cutLayer = null, cutUnder = null;
  def('cutaway', CAT, '插画特写：一张全屏插画硬切进来，很慢地推近，到时间硬切回去；期间盖住演员，字幕和章节条还在。写在 <img> 上（放在所在分镜里即可）。参数 dur（停多久，1.2–2.5 秒）、zoom（推到多大，默认 1.07）、x / y（同时平移百分比）、under=1（放在演员下面：主持人继续站在画面上讲，适合全屏录屏）', function (c) {
    var st = stageEl();
    if (!cutLayer || !cutLayer.parentNode) { cutLayer = mk('div', 'fx-cutaways'); st.appendChild(cutLayer); cutUnder = mk('div', 'fx-cutaways under'); st.appendChild(cutUnder); }
    var d = num(c.o.dur, 1.8), layer = String(c.o.under) === '1' ? cutUnder : cutLayer;      // 参数里的数字会被解析成数值，所以转成字符串再比
    c.els.forEach(function (el) {
      el.classList.add('fx-cutaway');
      layer.appendChild(el);
      c.tl.set(el, { visibility: 'visible' }, c.t);
      c.tl.fromTo(el, { scale: num(c.o.from, 1), xPercent: 0, yPercent: 0 }, { scale: num(c.o.zoom, 1.07), xPercent: num(c.o.x, 0), yPercent: num(c.o.y, 0), duration: d, ease: 'none', immediateRender: false }, c.t);
      c.tl.set(el, { visibility: 'hidden' }, c.t + d);
    });
  });

  /* ═════════════════════════ 设备屏（画中画） ═════════════════════════ */
  /** 设备：子元素是屏幕里的一张张内容（图片、序列帧、任意 HTML），一次显示一个。
   *  data-kind="laptop|phone|window"、data-tilt="左右,上下"（3D 倾角，笔记本默认 -16,6）、data-title（window 的标题栏文字） */
  FX.make.device = function (el) {
    var kind = attr(el, 'kind', 'laptop'), items = kidsOf(el), tilt = String(attr(el, 'tilt', kind === 'laptop' ? '-16,6' : '0,0')).split(',').map(Number);
    var body = mk('div', 'fx-device-body'), screen = mk('div', 'fx-device-screen');
    el.classList.add('fx-device', kind);
    items.forEach(function (k, i) { k.classList.add('fx-device-item'); if (i) k.style.visibility = 'hidden'; screen.appendChild(k); });
    if (kind === 'window') { var bar = mk('div', 'fx-device-bar'); bar.textContent = attr(el, 'title', ''); body.appendChild(bar); }
    body.appendChild(screen);
    if (kind === 'laptop') body.appendChild(mk('div', 'fx-device-deck'));
    el.appendChild(body);
    g.gsap.set(body, { rotationY: tilt[0] || 0, rotationX: tilt[1] || 0, transformPerspective: 1800 });
    el.__device = { body: body, screen: screen, items: items, cur: 0 };
  };
  function dev(c, name) { var D = c.el.__device; if (!D) console.warn('FX：' + name + ' 要写在 data-make="device" 的元素上'); return D; }
  def('screen-to', CAT, '屏内切换：设备屏幕里的内容硬切到第 i 个（从 1 数；不写就是下一个），带一下很轻的闪白。写在 data-make="device" 上', function (c) {
    var D = dev(c, 'screen-to'); if (!D) return;
    var to = c.o.i === undefined ? (D.cur + 1) % D.items.length : clamp(num(c.o.i, 1) - 1, 0, D.items.length - 1);
    if (to === D.cur) return;
    c.tl.set(D.items[D.cur], { visibility: 'hidden' }, c.t);
    c.tl.set(D.items[to], { visibility: 'inherit' }, c.t);   // 用 inherit 不用 visible：分镜隐藏后它要跟着隐藏
    c.tl.fromTo(D.screen, { filter: 'brightness(1.7)' }, { filter: 'brightness(1)', duration: 0.2, ease: 'power1.out', immediateRender: false }, c.t);
    D.cur = to;
  });
  def('dive', CAT, '钻进屏幕：设备朝镜头放大，直到它的屏幕铺满全屏（下一个分镜用同一张画面当背景，就像走进了屏幕里）。写在 data-make="device" 上，一般放在分镜最后 0.5 秒。参数 dur（默认 0.5）', function (c) {
    var D = dev(c, 'dive'); if (!D) return;
    var st = stageEl(), SW = st.offsetWidth, SH = st.offsetHeight, r = FX.rect(D.screen), e = FX.rect(c.el), d = num(c.o.dur, 0.5);
    var S = Math.max(SW / r.w, SH / r.h) * 1.06, dx = SW / 2 - (e.cx + (r.cx - e.cx) * S), dy = SH / 2 - (e.cy + (r.cy - e.cy) * S);
    c.tl.set(c.el, { zIndex: 60 }, c.t);
    c.tl.to(c.el, { x: rel(dx), y: rel(dy), scale: S, duration: d, ease: 'power3.in' }, c.t);
    c.tl.to(D.body, { rotationY: 0, rotationX: 0, duration: d * 0.8, ease: 'power2.in' }, c.t);
  });

  def('frames', CAT, '序列帧播放：把一串截图当视频播（实机录屏、操作演示），逐帧确定。元素上写 data-frames="目录/f_%03d.jpg" data-n="帧数"。参数 fps（默认 15）、dur（播多久，默认到分镜结束；播完从头循环）', function (c) {
    c.els.forEach(function (el) {
      var pat = attr(el, 'frames', ''), n = num(attr(el, 'n'), 0);
      if (!pat || !n) { console.warn('FX：frames 需要 data-frames 和 data-n', el); return; }
      if (!el.__frames) {
        el.__frames = []; el.classList.add('fx-frames');
        for (var i = 1; i <= n; i++) {
          var im = mk('img');
          im.src = pat.replace(/%0?(\d*)d/, function (_, w) { var s = String(i); while (s.length < (+w || 1)) s = '0' + s; return s; });
          im.alt = ''; if (i > 1) im.style.visibility = 'hidden';
          el.appendChild(im); el.__frames.push(im);
        }
      }
      var F = el.__frames, fps = num(c.o.fps, 15), d = num(c.o.dur, c.sceneDur), p = { v: 0 }, last = 0;
      c.tl.to(p, { v: d * fps, duration: d, ease: 'none', onUpdate: function () { var k = Math.floor(p.v) % F.length; if (k !== last) { F[last].style.visibility = 'hidden'; F[k].style.visibility = 'inherit'; last = k; } } }, c.t);
    });
  });

  /* ═════════════════════════ 选择面板 ═════════════════════════ */
  /** 选择题面板：data-title="选择题" data-items="后撤/冲上去/挖方块/不动" */
  FX.make.menu = function (el) {
    var items = String(attr(el, 'items', '')).split('/').map(function (s) { return s.trim(); }).filter(Boolean), title = attr(el, 'title', '');
    el.classList.add('fx-menu');
    el.innerHTML = (title ? '<b class="fx-menu-title">' + title + '</b>' : '') + items.map(function (s, i) { return '<span class="fx-menu-item"><i>' + String.fromCharCode(65 + i) + '</i>' + s + '<u></u></span>'; }).join('');
    el.__menu = el.querySelectorAll('.fx-menu-item');
  };
  def('choose', CAT, '选一项：选择面板的高亮条跳到第 i 项并打勾。写在 data-make="menu" 上。参数 i（从 1 数；写成 2/4/1/3 就是连着快速选好几次）、every（连选时每次间隔，默认 0.28 秒）', function (c) {
    var M = c.el.__menu; if (!M) { console.warn('FX：choose 要写在 data-make="menu" 的元素上'); return; }
    var seq = String(c.o.i === undefined ? '1' : c.o.i).split('/').map(Number), every = num(c.o.every, 0.28);
    seq.forEach(function (i, k) {
      Array.prototype.forEach.call(M, function (it, j) { c.tl.set(it, { attr: { class: 'fx-menu-item' + (j === i - 1 ? ' on' : '') } }, c.t + k * every); });
    });
  });

  /* ═════════════════════════ 小演员 ═════════════════════════ */
  /** 全身小人：data-src="assets/mini/bot"（库会读 <src>_idle.png），data-poses="walk1/walk2/cheer" 列出还有哪些动作图（<src>_<名字>.png），data-tag 头顶名牌。
   *  只有一张站立图也能用：没有 walk1 / walk2 时，走路用「一步一颠」代替 */
  FX.make.mini = function (el) {
    var src = attr(el, 'src', ''), poses = ['idle'].concat(String(attr(el, 'poses', '')).split('/').filter(function (p) { return p && p !== 'idle'; })), f = {};
    el.classList.add('fx-mini');
    poses.forEach(function (p) { var im = mk('img'); im.src = src + '_' + p + '.png'; im.alt = ''; if (p !== 'idle') im.style.visibility = 'hidden'; el.appendChild(im); f[p] = im; });
    var tag = attr(el, 'tag', '');
    if (tag) { var b = mk('b', 'fx-mini-tag'); b.textContent = tag; el.appendChild(b); }
    el.__mini = f;
  };
  function show(tl, f, name, t) { if (!f[name]) name = 'idle'; Object.keys(f).forEach(function (k) { tl.set(f[k], { visibility: k === name ? 'inherit' : 'hidden' }, t); }); }
  def('mini-walk', CAT, '小演员走过去：两帧步态交替 + 水平移动，走到后站定。写在 data-make="mini" 上。参数 x（走多远，负数向左）或 to=#目标（走到它旁边）、dur、step（每步多久，默认 0.16 秒）', function (c) {
    var f = c.el.__mini; if (!f) { console.warn('FX：mini-walk 要写在 data-make="mini" 的元素上'); return; }
    var dx = num(c.o.x, 300);
    if (c.o.to) { var a = FX.rect(c.el), b = FX.rect(c.o.to); if (b) dx = b.cx - a.cx + num(c.o.dx, 0); }
    var d = num(c.o.dur, Math.max(0.3, Math.abs(dx) / 340)), n = Math.max(2, Math.round(d / num(c.o.step, 0.16)));
    c.tl.to(c.el, { x: rel(dx), duration: d, ease: 'none' }, c.t);
    if (f.walk1 && f.walk2) { for (var i = 0; i < n; i++) show(c.tl, f, i % 2 ? 'walk2' : 'walk1', c.t + i * d / n); show(c.tl, f, 'idle', c.t + d); }
    else c.tl.to(c.el, { y: rel(-14), rotation: dx < 0 ? -4 : 4, duration: d / n / 2, ease: 'sine.out', yoyo: true, repeat: n * 2 - 1 }, c.t);      // 没有步态图：一步一颠
  });
  def('mini-pose', CAT, '小演员换动作（举手、欢呼、坐下…），带一下挤压回弹。写在 data-make="mini" 上。参数 name（动作名，对应 data-poses 里的名字）、hold（几秒后自动回到站立，不写就一直保持）', function (c) {
    var f = c.el.__mini; if (!f) { console.warn('FX：mini-pose 要写在 data-make="mini" 的元素上'); return; }
    show(c.tl, f, c.o.name || 'idle', c.t);
    c.tl.fromTo(c.el, { scaleY: 0.9 }, { scaleY: 1, duration: 0.22, ease: 'back.out(3)', immediateRender: false }, c.t);
    if (c.o.hold !== undefined) show(c.tl, f, 'idle', c.t + num(c.o.hold, 1));
  });
})(typeof window !== 'undefined' ? window : this);
