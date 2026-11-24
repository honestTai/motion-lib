/*!
 * FX 粒子模块 v1.2  ——  motion-lib 的可选扩展：画布粒子（宇宙、旋涡、黑洞、爆炸、粒子聚字）
 * 用法：在 fx.js 之后加载本文件，然后
 *
 *   <div class="layer" data-make="space"
 *        data-fx="nebula@0 starfield@0(speed=0.15) vortex@1 form-text@4(text=HELLO)"></div>
 *
 * 一个 data-make="space" 就是一块画布；写在它上面的每个粒子动效是画布里的一层，按书写顺序从下往上叠。
 * 画布本身是普通元素，可以照常叠加别的动效（例如 to@3(scale=1.3) 做推近）。
 *
 * 和主库一样：每一帧都是「时间的纯函数」——不累积状态、随机数带种子，所以任意跳帧、重复渲染结果都相同。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-particles：请先加载 fx.js');

  var TAU = Math.PI * 2;
  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mod = function (a, n) { return ((a % n) + n) % n; };
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
  var easeInOut = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var colors = function (s, d) { var a = String(s || '').split('/').map(function (x) { return x.trim(); }).filter(Boolean); return a.length ? a : d; };

  /* ── 颜色与发光贴图 ── */
  var probe = document.createElement('canvas'); probe.width = probe.height = 1;
  var pctx = probe.getContext('2d', { willReadFrequently: true }), RGB = {};
  function rgb(c) {
    if (RGB[c]) return RGB[c];
    pctx.clearRect(0, 0, 1, 1); pctx.fillStyle = '#000'; pctx.fillStyle = c; pctx.fillRect(0, 0, 1, 1);
    var d = pctx.getImageData(0, 0, 1, 1).data;
    return (RGB[c] = [d[0], d[1], d[2]]);
  }
  function mix(a, b, t) {
    var A = rgb(a), B = rgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  /** 一颗发光圆点的贴图；kind：dot 带白色亮芯，soft 是大片柔光（星云、光晕） */
  var SPR = {};
  function sprite(color, kind) {
    var k = color + '|' + (kind || 'dot');
    if (SPR[k]) return SPR[k];
    var s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
    var x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (kind === 'soft') { gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
    else { gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.75)'); gr.addColorStop(0.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); }
    x.fillStyle = gr; x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, s, s);
    if (kind !== 'soft') {
      x.globalCompositeOperation = 'lighter';
      var core = x.createRadialGradient(32, 32, 0, 32, 32, 12);
      core.addColorStop(0, 'rgba(255,255,255,.95)'); core.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = core; x.fillRect(0, 0, s, s);
    }
    return (SPR[k] = cv);
  }
  function glow(ctx, spr, x, y, r, a) {
    if (a <= 0.003 || r <= 0.05) return;
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  }

  /* ── 画布与图层 ── */

  /** 画布容器：data-make="space"。一般加 class="layer" 铺满场景 */
  FX.make.space = function (el) {
    if (el.__space) return;
    var st = el.closest('[data-composition-id]');
    var W = el.offsetWidth || num(st && st.getAttribute('data-width'), 1920), H = el.offsetHeight || num(st && st.getAttribute('data-height'), 1080);
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    el.classList.add('fx-space');
    el.insertBefore(cv, el.firstChild);
    el.__space = { el: el, cv: cv, ctx: cv.getContext('2d'), W: W, H: H, layers: [], blank: true };
  };
  function render(sp, t) {
    var ctx = sp.ctx, any = false, i, L, lt, A;
    for (i = 0; i < sp.layers.length; i++) { L = sp.layers[i]; if (t >= L.t0 && t <= L.t0 + L.dur) { any = true; break; } }
    if (!any) { if (!sp.blank) { ctx.clearRect(0, 0, sp.W, sp.H); sp.blank = true; } return; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, sp.W, sp.H);
    sp.blank = false;
    for (i = 0; i < sp.layers.length; i++) {
      L = sp.layers[i]; lt = t - L.t0;
      if (lt < 0 || lt > L.dur) continue;
      A = Math.min(1, L.fi > 0 ? lt / L.fi : 1) * Math.min(1, L.fo > 0 ? (L.dur - lt) / L.fo : 1);
      if (A <= 0) continue;
      ctx.save();
      L.draw(ctx, lt, A);
      ctx.restore();
    }
  }
  /** 注册一层。init(sp, o, L) 返回 draw(ctx, 本层已过秒数, 整层不透明度)
   *  通用参数：dur=这一层持续多久（默认到场景结束）、fade=淡入秒数、out=淡出秒数、x / y=中心位置（百分比）、seed */
  function layer(c, init, d) {
    d = d || {};
    if (!c.el.__space) FX.make.space(c.el);
    var sp = c.el.__space, o = c.o;
    if (!sp.driver) {
      sp.driver = true;
      var tl = c.tl;
      sp.redraw = function () { render(sp, tl.time()); };
      tl.to({ v: 0 }, { v: 1, duration: c.total, ease: 'none', onUpdate: sp.redraw }, 0);
    }
    var L = { t0: c.t, dur: num(o.dur, c.sceneDur + 1.5), fi: num(o.fade, d.fade === undefined ? 0.5 : d.fade), fo: num(o.out, d.out === undefined ? 0.4 : d.out) };
    L.draw = init(sp, o, L);
    sp.layers.push(L);
    sp.redraw();
  }
  var def = function (name, desc, fn) { FX.register(name, '粒子', desc, fn); };
  var center = function (sp, o) { return [sp.W * num(o.x, 50) / 100, sp.H * num(o.y, 50) / 100]; };

  /* ═════════════════════════ 粒子动效 ═════════════════════════ */

  def('starfield', '星空：星星从远处朝镜头飞来（speed=0 时是静止闪烁的星空）。参数 n、speed、streak=拖尾长度（给 1 以上就是跃迁光束）、size、colors=色1/色2', function (c) {
    layer(c, function (sp, o) {
      var r = FX.rand(num(o.seed, 1)), n = num(o.n, 600), cols = colors(o.colors, ['#ffffff', '#bfe6ff', '#ffd9b0']);
      var speed = num(o.speed, 0.12), streak = num(o.streak, 0), size = num(o.size, 1), S = [], i;
      for (i = 0; i < n; i++) { var col = cols[Math.floor(r() * cols.length)]; S.push({ x: r() * 2 - 1, y: r() * 2 - 1, z: r(), col: col, spr: sprite(col), ph: r() * TAU, s: 0.5 + r() * 1.5, tw: 1 + r() * 3 }); }
      return function (ctx, lt, A) {
        var W = sp.W, H = sp.H, cc = center(sp, o), cx = cc[0], cy = cc[1];
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (var i = 0; i < n; i++) {
          var p = S[i], tw = 0.65 + 0.35 * Math.sin(lt * p.tw + p.ph);
          if (!speed) { glow(ctx, p.spr, cx + p.x * W * 0.55, cy + p.y * H * 0.55, size * p.s * 2.2, A * tw * (0.35 + 0.65 * p.z)); continue; }
          var z = mod(p.z - speed * lt, 1), zz = 0.05 + z * 0.95, sx = cx + p.x * W * 0.5 / zz, sy = cy + p.y * W * 0.5 / zz;
          if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
          var a = A * Math.min(1, (1 - z) * 5) * Math.min(1, z * 12), rad = size * p.s * (0.8 + 2.6 * (1 - z));
          if (streak > 0) {
            var z2 = zz + streak * 0.06 * (1.2 - z), ex = cx + p.x * W * 0.5 / z2, ey = cy + p.y * W * 0.5 / z2;
            ctx.globalAlpha = a * 0.7; ctx.strokeStyle = p.col; ctx.lineWidth = Math.max(0.6, rad * 0.55);
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(sx, sy); ctx.stroke();
          }
          glow(ctx, p.spr, sx, sy, rad * 2, a * tw);
        }
      };
    });
  });

  def('nebula', '星云：几大团柔和的彩色光雾缓慢漂移，垫在最底层当背景。参数 n=光团数、colors、alpha=浓度', function (c) {
    layer(c, function (sp, o) {
      var r = FX.rand(num(o.seed, 2)), n = num(o.n, 14), cols = colors(o.colors, ['#1f6fb5', '#2aa6c9', '#123a7a', '#3b6fd1']), al = num(o.alpha, 1), B = [], i;
      for (i = 0; i < n; i++) B.push({ x: r(), y: r(), rad: 0.16 + r() * 0.3, spr: sprite(cols[i % cols.length], 'soft'), a: 0.1 + r() * 0.16, ph: r() * TAU, sp: 0.4 + r() });
      return function (ctx, lt, A) {
        var W = sp.W, H = sp.H;
        ctx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < n; i++) {
          var b = B[i];
          glow(ctx, b.spr, b.x * W + Math.sin(lt * 0.12 * b.sp + b.ph) * 70, b.y * H + Math.cos(lt * 0.1 * b.sp + b.ph) * 50, b.rad * W * (1 + 0.06 * Math.sin(lt * 0.3 + b.ph)), A * b.a * al);
        }
      };
    }, { fade: 0.8 });
  });

  def('vortex', '粒子旋涡：粒子沿螺旋臂从中心涌向镜头，带发光的流线（时空隧道）。参数 arms=旋臂数、n、speed、twist=拧几圈、spin=整体旋转速度、r=外圈半径、colors（按旋臂交替）、lines=0 关掉流线', function (c) {
    layer(c, function (sp, o) {
      var r = FX.rand(num(o.seed, 3)), m = num(o.arms, 12), n = num(o.n, 2600), cols = colors(o.colors, ['#6fd3ff', '#ff8a4d']);
      var speed = num(o.speed, 0.2), twist = num(o.twist, 1.25), spin = num(o.spin, 0.3), size = num(o.size, 1), P = [], ST = [], i;
      for (i = 0; i < n; i++) { var arm = Math.floor(r() * m); P.push({ arm: arm, u: r(), j: (r() - 0.5) * 0.34, rj: 0.9 + r() * 0.22, s: 0.5 + r() * 1.2, spr: sprite(cols[arm % cols.length]) }); }
      if (o.lines !== 0) for (i = 0; i < m * 3; i++) ST.push({ arm: i % m, u: r(), len: 0.16 + r() * 0.14, col: cols[(i % m) % cols.length], v: 1.3 + r() * 0.8 });
      return function (ctx, lt, A) {
        var W = sp.W, H = sp.H, cc = center(sp, o), cx = cc[0], cy = cc[1], R = num(o.r, Math.hypot(W, H) * 0.62), i;
        var pos = function (arm, d, j, rj) {
          var rad = R * Math.pow(d, 1.3) * rj, th = arm / m * TAU + twist * TAU * Math.pow(1 - d, 1.4) + spin * lt + j * (0.25 + d * 0.5);
          return [cx + Math.cos(th) * rad, cy + Math.sin(th) * rad * 0.82];
        };
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        var SEG = 28;                                                   // 每条流线分 28 小段，弯得圆滑
        for (i = 0; i < ST.length; i++) {                               // 流线：沿旋臂滑动的一小段亮线，头亮尾细
          var s = ST[i], hd = mod(s.u + speed * s.v * lt, 1.2), prev = null;
          for (var k = 0; k <= SEG; k++) {
            var d = hd - s.len * (1 - k / SEG);
            if (d <= 0.02 || d >= 1) { prev = null; continue; }
            var q = pos(s.arm, d, 0, 1);
            if (prev) {
              ctx.globalAlpha = A * (k / SEG) * 0.75 * Math.min(1, (1 - d) * 6);
              ctx.strokeStyle = s.col; ctx.lineWidth = (1.2 + 12 * d * d) * (0.3 + 0.7 * k / SEG) * size;
              ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
            }
            prev = q;
          }
          if (prev) glow(ctx, sprite('#ffffff'), prev[0], prev[1], (2 + 14 * hd * hd) * size, A * 0.9 * Math.min(1, (1 - hd) * 6));
        }
        for (i = 0; i < n; i++) {
          var p = P[i], dd = mod(p.u + speed * lt, 1), xy = pos(p.arm, dd, p.j, p.rj);
          glow(ctx, p.spr, xy[0], xy[1], (2.2 + 11 * dd * dd) * p.s * size, A * Math.min(1, dd * 14) * Math.min(1, (1 - dd) * 5));
        }
        glow(ctx, sprite(cols[0], 'soft'), cx, cy, R * 0.3, A * 0.75);
        glow(ctx, sprite('#ffffff', 'soft'), cx, cy, R * 0.07, A * 0.8);
      };
    });
  });

  def('blackhole', '黑洞：黑色圆盘 + 发光光环 + 倾斜的吸积盘，粒子内圈转得快、外圈转得慢，前半圈会从黑洞前面掠过。参数 r=黑洞半径、tilt=吸积盘压扁程度、rot=倾斜角度、n、speed、c1=内圈色、c2=外圈色', function (c) {
    layer(c, function (sp, o) {
      var r = FX.rand(num(o.seed, 4)), R = num(o.r, 150), tilt = num(o.tilt, 0.26), rot = num(o.rot, -10) * Math.PI / 180, n = num(o.n, 1800);
      var c1 = o.c1 || '#fff0c4', c2 = o.c2 || '#ff7a2f', speed = num(o.speed, 1), P = [], RG = [], i;
      for (i = 0; i < n; i++) { var k = Math.pow(r(), 1.5), a = R * (1.28 + 3.3 * k); P.push({ a: a, th: r() * TAU, w: speed * 1.6 * Math.pow(R * 1.28 / a, 1.5), col: mix(c1, c2, Math.min(1, k * 1.3)), al: 0.45 + r() * 0.55, lw: 1 + r() * 2.4, len: 0.04 + r() * 0.09 }); }
      for (i = 0; i < 16; i++) RG.push({ a: R * (1.35 + i * 0.2 + r() * 0.08), al: 0.1 + r() * 0.2, col: mix(c1, c2, i / 16) });
      var halo = sprite(c2, 'soft');
      return function (ctx, lt, A) {
        var cc = center(sp, o), i, p, th;
        ctx.translate(cc[0], cc[1]); ctx.rotate(rot); ctx.lineCap = 'round';
        var half = function (front) {
          ctx.globalCompositeOperation = 'lighter';
          for (i = 0; i < RG.length; i++) {                              // 细环
            ctx.globalAlpha = A * RG[i].al; ctx.strokeStyle = RG[i].col; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.ellipse(0, 0, RG[i].a, RG[i].a * tilt, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
          }
          for (i = 0; i < n; i++) {
            p = P[i]; th = p.th + p.w * lt;
            if ((Math.sin(th) >= 0) !== front) continue;
            ctx.globalAlpha = A * p.al; ctx.strokeStyle = p.col; ctx.lineWidth = p.lw;
            ctx.beginPath(); ctx.moveTo(Math.cos(th - p.len) * p.a, Math.sin(th - p.len) * p.a * tilt); ctx.lineTo(Math.cos(th) * p.a, Math.sin(th) * p.a * tilt); ctx.stroke();
          }
        };
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, halo, 0, 0, R * 3.4, A * 0.7);
        half(false);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = A; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';                        // 光子环 + 上方被引力弯过来的光弧
        ctx.shadowColor = c2; ctx.shadowBlur = R * 0.3; ctx.strokeStyle = c1;
        ctx.globalAlpha = A * 0.95; ctx.lineWidth = R * 0.045; ctx.beginPath(); ctx.arc(0, 0, R * 1.035, 0, TAU); ctx.stroke();
        ctx.globalAlpha = A * 0.5; ctx.lineWidth = R * 0.03; ctx.strokeStyle = c2; ctx.beginPath(); ctx.ellipse(0, -R * 0.05, R * 1.3, R * 1.17, 0, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke();
        ctx.shadowBlur = 0;
        half(true);
      };
    }, { fade: 0.8 });
  });

  /* 正二十面体细分成的球面碎片 */
  function icosphere(detail) {
    var t = (1 + Math.sqrt(5)) / 2, nm = function (v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    var V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nm);
    var F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    var T = F.map(function (f) { return [V[f[0]], V[f[1]], V[f[2]]]; }), mid = function (a, b) { return nm([a[0] + b[0], a[1] + b[1], a[2] + b[2]]); };
    for (var d = 0; d < detail; d++) {
      var N = [];
      T.forEach(function (q) { var ab = mid(q[0], q[1]), bc = mid(q[1], q[2]), ca = mid(q[2], q[0]); N.push([q[0], ab, ca], [q[1], bc, ab], [q[2], ca, bc], [ab, bc, ca]); });
      T = N;
    }
    return T;
  }
  function rotAxis(v, ax, ang) {                                         // 绕任意轴旋转（罗德里格斯公式）
    var cs = Math.cos(ang), sn = Math.sin(ang), d = (v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]) * (1 - cs);
    return [v[0] * cs + (ax[1] * v[2] - ax[2] * v[1]) * sn + ax[0] * d, v[1] * cs + (ax[2] * v[0] - ax[0] * v[2]) * sn + ax[1] * d, v[2] * cs + (ax[0] * v[1] - ax[1] * v[0]) * sn + ax[2] * d];
  }

  def('orb', '能量球：由三角碎片拼成的发光球体，缓慢自转、内核发光；可以从散落的碎片聚拢成球，也可以炸开。参数 r=半径、detail=细分（1=80 片，2=320 片）、gap=碎片间隙、spin、in=聚拢秒数、explode=第几秒炸开、c1=亮面色、c2=暗面色、edge=描边色、core=内核色', function (c) {
    layer(c, function (sp, o) {
      var r = FX.rand(num(o.seed, 5)), R = num(o.r, 260), gap = num(o.gap, 0.84), spin = num(o.spin, 0.45), pitch = num(o.tilt, 0.38);
      var c1 = o.c1 || '#ffe9c2', c2 = o.c2 || '#8a2f14', edge = o.edge || '#ffc56b', core = sprite(o.core || '#ffb347'), halo = sprite(o.core || '#ff7a2f', 'soft');
      var tin = num(o['in'], 0), tex = o.explode === undefined ? -1 : num(o.explode, 3), power = num(o.power, 1);
      var faces = icosphere(clamp(num(o.detail, 1), 0, 3)).map(function (q) {
        var cn = [(q[0][0] + q[1][0] + q[2][0]) / 3, (q[0][1] + q[1][1] + q[2][1]) / 3, (q[0][2] + q[1][2] + q[2][2]) / 3], l = Math.hypot(cn[0], cn[1], cn[2]);
        var ax = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1], al = Math.hypot(ax[0], ax[1], ax[2]) || 1;
        return { c: cn, n: [cn[0] / l, cn[1] / l, cn[2] / l], d: q.map(function (v) { return [(v[0] - cn[0]) * gap, (v[1] - cn[1]) * gap, (v[2] - cn[2]) * gap]; }),
          ax: [ax[0] / al, ax[1] / al, ax[2] / al], w: (r() - 0.5) * 9, vel: 0.5 + r() * 1.5, dl: r() * 0.3 };
      });
      var LX = -0.42, LY = 0.52, LZ = 0.74, cp = Math.cos(pitch), spt = Math.sin(pitch), out = [];
      return function (ctx, lt, A) {
        var cc = center(sp, o), cx = cc[0], cy = cc[1], yaw = spin * lt, cyw = Math.cos(yaw), syw = Math.sin(yaw), D = R * 4.2, i, k;
        var te = tex >= 0 ? lt - tex : -1, asm = tin > 0 ? 1 - easeOut(clamp(lt / tin, 0, 1)) : 0;
        var world = function (v) {                                       // 先绕 Y 轴自转，再绕 X 轴前倾
          var x = v[0] * cyw + v[2] * syw, z = -v[0] * syw + v[2] * cyw, y = v[1] * cp - z * spt;
          return [x, y, v[1] * spt + z * cp];
        };
        out.length = 0;
        for (i = 0; i < faces.length; i++) {
          var f = faces[i], off = 0, tum = 0, fa = 1;
          if (asm > 0) { off = f.vel * 3.2 * asm; tum = f.w * asm * 1.4; fa = clamp(1.25 - asm, 0, 1); }
          if (te > 0) { var q = 1 - Math.exp(-2.4 * Math.max(0, te - f.dl * 0.15)); off = f.vel * 2.6 * power * q; tum = f.w * te; fa = clamp(1.6 - te * 0.75, 0, 1); }
          if (fa <= 0) continue;
          var cw = world([f.c[0] + f.n[0] * off, f.c[1] + f.n[1] * off, f.c[2] + f.n[2] * off]), pts = [];
          for (k = 0; k < 3; k++) {
            var dv = tum ? rotAxis(f.d[k], f.ax, tum) : f.d[k], w = world([f.c[0] + f.n[0] * off + dv[0], f.c[1] + f.n[1] * off + dv[1], f.c[2] + f.n[2] * off + dv[2]]);
            var s = D / (D - Math.min(w[2] * R, D * 0.62)); pts.push(cx + w[0] * R * s, cy - w[1] * R * s);
          }
          var nw = world(tum ? rotAxis(f.n, f.ax, tum) : f.n);
          out.push({ z: cw[2], p: pts, lam: clamp(nw[0] * LX + nw[1] * LY + nw[2] * LZ, 0, 1), front: nw[2] > 0, a: fa * clamp(2.2 - cw[2] * 0.75, 0, 1) });   // 飞到镜头跟前的碎片淡掉，免得糊住画面
        }
        out.sort(function (a, b) { return a.z - b.z; });
        var paint = function (back) {
          for (i = 0; i < out.length; i++) {
            var q = out[i];
            if ((q.z < 0) !== back) continue;
            ctx.beginPath(); ctx.moveTo(q.p[0], q.p[1]); ctx.lineTo(q.p[2], q.p[3]); ctx.lineTo(q.p[4], q.p[5]); ctx.closePath();
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = A * q.a * (q.front ? 0.92 : 0.4);
            ctx.fillStyle = mix(c2, c1, q.front ? 0.15 + q.lam * 0.85 : 0.1); ctx.fill();
            ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = A * q.a * (q.front ? 0.85 : 0.45);
            ctx.strokeStyle = edge; ctx.lineWidth = 1.6; ctx.stroke();
          }
        };
        var boom = te > 0 ? Math.exp(-te * 2.6) : 0, pulse = 1 + 0.05 * Math.sin(lt * 3.1);
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, halo, cx, cy, R * (2.1 + boom * 2.5), A * (0.4 + boom * 0.5) * (1 - asm));
        paint(true);
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, core, cx, cy, R * (0.95 * pulse + boom * 2.2), A * (0.85 + boom * 0.15) * (1 - asm * 0.8));
        paint(false);
      };
    });
  });

  def('burst', '爆炸：一团粒子和三角碎片从中心炸开，带白闪和冲击波光环，越飞越慢最后消散。参数 n、power=力度、shards=碎片占比 0~1、life=持续秒数、colors、ring=0 关掉冲击波、flash=0 关掉白闪', function (c) {
    layer(c, function (sp, o, L) {
      var r = FX.rand(num(o.seed, 6)), n = num(o.n, 800), power = num(o.power, 1), sh = num(o.shards, 0.25), life = num(o.life, 2.6), drag = num(o.drag, 1.7);
      var cols = colors(o.colors, ['#ffd08a', '#ff8a4d', '#ffffff', '#6fd3ff']), P = [], i;
      if (o.dur === undefined) L.dur = Math.min(L.dur, life + 0.2);
      for (i = 0; i < n; i++) {
        var u = r() * 2 - 1, ph = r() * TAU, q = Math.sqrt(1 - u * u), col = cols[Math.floor(r() * cols.length)];
        P.push({ dx: q * Math.cos(ph), dy: q * Math.sin(ph), dz: u, v: (0.25 + r() * r() * 1.3) * power, tri: r() < sh, s: 0.6 + r() * 1.6, col: col, spr: sprite(col), a0: r() * TAU, w: (r() - 0.5) * 12, w2: 2 + r() * 6, lf: 0.6 + r() * 0.4 });
      }
      return function (ctx, lt, A) {
        var W = sp.W, cc = center(sp, o), cx = cc[0], cy = cc[1], i, p;
        ctx.globalCompositeOperation = 'lighter';
        if (o.flash !== 0) glow(ctx, sprite('#ffffff', 'soft'), cx, cy, W * 0.55 * Math.min(1, lt / 0.1), A * Math.exp(-lt * 6));
        if (o.ring !== 0 && lt < 1.3) {
          var rp = lt / 1.3;
          ctx.globalAlpha = A * (1 - rp) * 0.8; ctx.strokeStyle = cols[0]; ctx.lineWidth = 2 + 10 * (1 - rp); ctx.shadowColor = cols[0]; ctx.shadowBlur = 30;
          ctx.beginPath(); ctx.arc(cx, cy, W * 0.5 * power * easeOut(rp), 0, TAU); ctx.stroke(); ctx.shadowBlur = 0;
        }
        for (i = 0; i < n; i++) {
          p = P[i];
          var dist = p.v * (1 - Math.exp(-drag * lt)) / drag * W * 0.85, z = p.dz * dist, s = 1 / Math.max(0.35, 1 - z / (W * 1.3));
          var x = cx + p.dx * dist * s, y = cy + p.dy * dist * s, a = A * clamp((1 - lt / (life * p.lf)) * 2.2, 0, 1);
          if (a <= 0) continue;
          if (!p.tri) { glow(ctx, p.spr, x, y, (2 + 3.5 * p.s) * s, a); continue; }
          var ang = p.a0 + p.w * lt, sz = (7 + 9 * p.s) * s, fy = Math.cos(p.w2 * lt + p.a0);     // fy：碎片翻面时被压扁
          ctx.globalAlpha = a * 0.9; ctx.fillStyle = p.col;
          ctx.beginPath();
          for (var k = 0; k < 3; k++) { var t = ang + k * TAU / 3, px = Math.cos(t) * sz, py = Math.sin(t) * sz * fy; if (k) ctx.lineTo(x + px, y + py); else ctx.moveTo(x + px, y + py); }
          ctx.closePath(); ctx.fill();
        }
      };
    }, { fade: 0, out: 0.3 });
  });

  def('form-text', '粒子聚字：散落翻滚的小方块从四面八方飞来，拼成一行字（中英文都行）。参数 text=文字、size=字号、font、weight、color、n=最多多少粒、start=先飘多久、conv=聚拢秒数、glow=0 关掉字的光晕、spacing=字间距像素', function (c) {
    var font = c.o.font || getComputedStyle(c.el).getPropertyValue('--fx-font-title').trim() || 'sans-serif';
    layer(c, function (sp, o) {
      var W = sp.W, H = sp.H, text = String(o.text === undefined ? 'HELLO' : o.text), size = num(o.size, 260), n = num(o.n, 2600), color = o.color || '#ffffff';
      var start = num(o.start, 0.6), conv = num(o.conv, 2.4), spec = (o.weight || 400) + ' ' + size + 'px ' + font;
      var off = document.createElement('canvas'); off.width = W; off.height = H;
      var ox = off.getContext('2d', { willReadFrequently: true }), data = null;
      var sample = function () {
        var r = FX.rand(num(o.seed, 7)), cc = center(sp, o);
        ox.clearRect(0, 0, W, H); ox.font = spec; ox.textAlign = 'center'; ox.textBaseline = 'middle'; ox.fillStyle = color;
        if (o.spacing !== undefined && 'letterSpacing' in ox) ox.letterSpacing = num(o.spacing, 0) + 'px';
        ox.fillText(text, cc[0], cc[1]);
        var px = ox.getImageData(0, 0, W, H).data, gsz = Math.max(4, Math.round(size / 44)), pts, x, y;
        for (var pass = 0; pass < 6; pass++) {                           // 调整采样格子，让粒子数不超过 n
          pts = [];
          for (y = gsz >> 1; y < H; y += gsz) for (x = gsz >> 1; x < W; x += gsz) if (px[(y * W + x) * 4 + 3] > 110) pts.push([x, y]);
          if (pts.length <= n) break;
          gsz = Math.ceil(gsz * Math.sqrt(pts.length / n) + 0.01);
        }
        var P = pts.map(function (q) {
          return { tx: q[0], ty: q[1], sx: (r() * 1.5 - 0.25) * W, sy: (r() * 1.5 - 0.25) * H, z: 0.6 + Math.pow(r(), 3) * 3.6, rot: r() * TAU, w: (r() - 0.5) * 7, dl: r(), da: r() * TAU, sw: (r() - 0.5) * 2, k: r() };
        }).sort(function (a, b) { return a.k - b.k; });
        data = { P: P, g: gsz };
      };
      sample();
      if (document.fonts && document.fonts.load) {                       // 字体是异步加载的：加载完重新取样，保证字形正确
        document.fonts.load(spec, text).then(function () { sample(); sp.redraw(); }, function () {});
      }
      return function (ctx, lt, A) {
        var P = data.P, gsz = data.g, i, formed = clamp((lt - start - conv) / 0.5, 0, 1);
        if (o.glow !== 0 && formed > 0 && ctx.filter !== undefined) {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = A * formed * 0.55; ctx.filter = 'blur(' + Math.round(size / 14) + 'px)';
          ctx.drawImage(off, 0, 0); ctx.filter = 'none';
        }
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = color;
        for (i = 0; i < P.length; i++) {
          var p = P[i], e = easeInOut(clamp((lt - start - p.dl * conv * 0.45) / (conv * 0.55), 0, 1));
          if (e >= 1) { ctx.globalAlpha = A; ctx.fillRect(p.tx - gsz * 0.46, p.ty - gsz * 0.46, gsz * 0.92, gsz * 0.92); continue; }
          var bx = p.sx + Math.cos(p.da) * 26 * lt, by = p.sy + Math.sin(p.da) * 26 * lt, arc = Math.sin(e * Math.PI) * 160 * p.sw;
          var dx = p.tx - bx, dy = p.ty - by, dl = Math.hypot(dx, dy) || 1, x = lerp(bx, p.tx, e) - dy / dl * arc, y = lerp(by, p.ty, e) + dx / dl * arc;
          var s = lerp(gsz * p.z, gsz * 0.92, e), rt = (p.rot + p.w * lt) * (1 - e);
          ctx.globalAlpha = A * lerp(p.z > 2 ? 0.6 : 0.9, 1, e);
          ctx.setTransform(Math.cos(rt), Math.sin(rt), -Math.sin(rt), Math.cos(rt), x, y);
          ctx.fillRect(-s * 0.7, -s * 0.36, s * 1.4, s * 0.72 + s * 0.2 * e);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      };
    }, { fade: 0.4 });
  });

  def('stream', '粒子流：一条条带拖尾的光点沿着起伏的流线横向穿过画面（数据流、信号）。参数 n、speed、amp=起伏幅度、waves=横向有几个波、tail=拖尾长度、colors、reverse=1 反向', function (c) {
    layer(c, function (sp, o) {
      var r = FX.rand(num(o.seed, 8)), n = num(o.n, 260), cols = colors(o.colors, ['#6fd3ff', '#ffffff', '#ff8a4d']), speed = num(o.speed, 1), amp = num(o.amp, 70), tail = num(o.tail, 140), waves = num(o.waves, 1.2), P = [], i;
      for (i = 0; i < n; i++) { var col = cols[Math.floor(r() * cols.length)]; P.push({ x: r(), y: r(), v: 0.04 + r() * 0.1, s: 0.5 + r() * 1.3, col: col, spr: sprite(col) }); }
      return function (ctx, lt, A) {
        var W = sp.W, H = sp.H, dir = o.reverse ? -1 : 1;
        ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (var i = 0; i < n; i++) {
          var p = P[i], u = mod(p.x + dir * p.v * speed * lt, 1), x = u * (W + 300) - 150, yy = function (xx) { return p.y * H + Math.sin(xx / W * waves * TAU + p.y * 2.4 + lt * 0.4) * amp; };
          var y = yy(x), x2 = x - dir * tail * p.s, a = A * Math.min(1, u * 8) * Math.min(1, (1 - u) * 8);
          ctx.globalAlpha = a * 0.45; ctx.strokeStyle = p.col; ctx.lineWidth = 1.2 * p.s;
          ctx.beginPath(); ctx.moveTo(x2, yy(x2)); ctx.lineTo(x, y); ctx.stroke();
          glow(ctx, p.spr, x, y, 3.5 * p.s, a);
        }
      };
    });
  });
})(window);
