/*!
 * FX 空间镜头模块 v1.5  ——  motion-lib 的可选扩展：世界画布 + 相机 + 图片组动效
 *
 * 解决「一幕一页像 PPT」的问题：所有分镜摆在同一块大画布上，换分镜 = 镜头走过去。
 *
 *   <script src="lib/fx.js"></script>
 *   <script src="lib/fx-world.js"></script>
 *
 *   <div id="root" class="theme-studio" data-composition-id="main" data-width="1920" data-height="1080"
 *        data-world="snake" data-wall="MOTION">
 *     <section class="scene" data-d="6.2"> … </section>          ← 第 1 个机位
 *     <section class="scene" data-d="5.4"> … </section>          ← 第 2 个机位，镜头自动斜向推过去
 *   </div>
 *
 * 只要根元素写了 data-world，分镜就不再是「叠在一起轮流显示的页」，而是画布上的机位：
 *   data-world   snake（默认，蛇形 3 列）| row（一字排开）| depth（沿纵深排开，镜头往里穿）
 *   data-cols    snake 每行几个机位（默认 3）
 *   data-wall    背景字墙的文字（品牌名）；不写就没有字墙
 *   data-tilt    机位自身倾角上限 "左右,上下"（默认 "8,4"；写 "0" 全部摆正）
 *   data-travel  换机位用时（默认 0.8 秒）
 *   data-drift   停留时每秒往前推多少（默认 0.5，单位 %）
 * 分镜上可以单独写 data-pos="列,行,深"、data-tilt="左右,上下"、data-in="cam-to(dur=0.9,arc=10)" 或 data-in="cam-jump"。
 *
 * 和主库一样：镜头是「时间的纯函数」，任意跳帧、重复渲染结果都相同。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-world：请先加载 fx.js');

  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rad = function (d) { return d * Math.PI / 180; };
  var rel = function (n) { return (n >= 0 ? '+=' : '-=') + Math.abs(n); };
  var inOut = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var kidsOf = function (el) { return Array.prototype.slice.call(el.children); };
  var mk = function (tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var stageEl = function () { return $('[data-composition-id]'); };
  var gs = function () { return g.gsap; };
  var relPos = function (el) { if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; };
  var def = FX.register;
  var CAT = '空间';

  /* ═════════════════════════ 世界与相机 ═════════════════════════ */

  var W = null;   // 当前页面的世界；没写 data-world 时为 null

  function stationPose(st) { return { x: st.x, y: st.y, z: st.z, ry: st.a * W.view, rx: st.b * W.view, zoom: 1 }; }
  function widePose() {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    W.st.forEach(function (s) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); });
    var bw = x1 - x0 + W.w * 1.08, bh = y1 - y0 + W.h * 1.08;
    if (W.mode === 'depth') return { x: (x0 + x1) / 2 + W.w * 0.55, y: (y0 + y1) / 2 - W.h * 0.3, z: z1 + W.dz * 0.9, ry: 24, rx: -8, zoom: 0.62 };
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: 0, ry: 5, rx: 3, zoom: Math.min(W.w / bw, W.h / bh) * 0.84 };
  }
  function elementPose(el, fit, max) {
    var st = stationOf(el), r = FX.rect(el);
    if (!st || !r) return null;
    var dx = r.cx - W.w / 2, dy = r.cy - W.h / 2, a = rad(st.a), b = rad(st.b);
    var y1 = dy * Math.cos(b), z1 = dy * Math.sin(b);
    return { x: st.x + dx * Math.cos(a) + z1 * Math.sin(a), y: st.y + y1, z: st.z - dx * Math.sin(a) + z1 * Math.cos(a),
             ry: st.a * W.view, rx: st.b * W.view, zoom: clamp(Math.min(W.w * fit / Math.max(1, r.w), W.h * fit / Math.max(1, r.h)), 1, max) };
  }
  function stationOf(el) {
    var sc = el.closest ? el.closest('.scene') : null;
    for (var i = 0; W && i < W.st.length; i++) if (W.st[i].el === sc) return W.st[i];
    return null;
  }

  function setup(ctx) {
    var stage = ctx.stage, mode = stage.getAttribute('data-world');
    W = null;
    if (mode === null || !ctx.seq.length) return false;
    mode = mode || 'snake';
    var SW = stage.offsetWidth, SH = stage.offsetHeight;
    // 机位一旦摆进 3D 空间，量出来的位置就不对了：先把所有元素的自然位置量好
    ctx.seq.forEach(function (s) { Array.prototype.forEach.call(s.el.querySelectorAll('*'), function (el) { FX.rect(el); }); });

    var view = mk('div', 'fx-world-view'), bg = mk('div', 'fx-world-bg'), world = mk('div', 'fx-world'), gridEl = null;
    stage.insertBefore(view, ctx.seq[0].el);
    view.appendChild(bg); view.appendChild(world);
    if (stage.classList.contains('desk') || stage.hasAttribute('data-grid')) {
      gridEl = mk('div', 'fx-world-grid');
      bg.appendChild(gridEl);
    }
    var wall = stage.getAttribute('data-wall');
    if (wall) {
      var h = '';
      for (var r = 0; r < 9; r++) { h += '<p' + (r % 2 ? ' class="odd"' : '') + '>'; for (var k = 0; k < 9; k++) h += '<span>' + wall + '</span>'; h += '</p>'; }
      var wallEl = mk('div', 'fx-world-wall');
      wallEl.innerHTML = h;
      bg.appendChild(wallEl);
    }

    var gap = num(attr(stage, 'gap'), 1.16), cols = Math.max(1, num(attr(stage, 'cols'), 3));
    var tilt = String(attr(stage, 'tilt', '8,4')).split(',').map(Number), rnd = FX.rand(num(attr(stage, 'seed'), 7));
    var cls = stage.className || '', white3d = /theme-white3d/.test(cls);
    var lightBg = white3d || /theme-(paper|pixel)/.test(cls) || (/theme-violet/.test(cls) && !/is-dark/.test(cls));
    W = { mode: mode, w: SW, h: SH, el: world, bg: bg, wall: bg.querySelector('.fx-world-wall'), grid: gridEl, light: lightBg, white3d: white3d,
          px: SW * gap, py: SH * gap, dz: num(attr(stage, 'depth'), 1500),
          view: num(attr(stage, 'view'), 1), travel: num(attr(stage, 'travel'), 0.8), drift: num(attr(stage, 'drift'), 0.5) / 100,
          moves: [], dirty: true, cache: [], total: ctx.total, start: null };
    W.st = ctx.seq.map(function (s, i) {
      var p;
      if (mode === 'row') p = [i, 0, 0];
      else if (mode === 'depth') p = [(i % 2 ? 1 : -1) * 0.2, ((i % 3) - 1) * 0.07, -i];
      else { var row = Math.floor(i / cols), c = i % cols; p = [row % 2 ? cols - 1 - c : c, row, 0]; }
      var cp = s.el.getAttribute('data-pos');
      if (cp) { p = cp.split(',').map(Number); while (p.length < 3) p.push(0); }
      var a = (i % 2 ? -1 : 1) * (0.55 + 0.45 * rnd()) * (tilt[0] || 0), b = (rnd() < 0.5 ? -1 : 1) * (0.5 + 0.5 * rnd()) * (tilt[1] || 0);
      var ct = s.el.getAttribute('data-tilt');
      if (ct !== null) { var q = ct.split(',').map(Number); a = q[0] || 0; b = q[1] || 0; }
      var has3d = white3d || !!s.el.querySelector('.fx-phone3d,.fx-card3d,.fx-box3d,.fx-wall3d,.fx-layers3d,.fx-deck3d,.fx-coins3d,.fx-sleeve3d');
      var st = { s: s, el: s.el, i: i, x: p[0] * W.px, y: p[1] * W.py, z: (p[2] || 0) * W.dz, a: a, b: b, has3d: has3d };
      world.appendChild(s.el);
      s.el.classList.add('fx-station');
      s.el.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,' + st.z.toFixed(1) + 'px) rotateY(' + a.toFixed(2) + 'deg) rotateX(' + b.toFixed(2) + 'deg)';
      return st;
    });
    W.start = { pose: stationPose(W.st[0]), st: 0 };

    // 每个分镜一次运镜：在分镜开始后 lead 秒到位，所以是踩着上一句的尾巴出发
    W.st.forEach(function (st, i) {
      if (!i) return;
      var spec = ctx.parseFx(st.el.getAttribute('data-in') || '')[0] || { name: 'cam-to', opts: {} };
      var o = spec.opts || {}, wipe = spec.name === 'card-wipe', jump = spec.name === 'cam-jump' || wipe;
      if (spec.name !== 'cam-to' && !jump) console.warn('FX：世界画布里换分镜只用 cam-to / cam-jump / card-wipe，已把', spec.name, '换成 cam-to');
      if (wipe && FX.trans['card-wipe']) FX.trans['card-wipe'](ctx.tl, st.s.t, null, st.el, o);
      var dur = jump ? 0.001 : num(o.dur, W.travel), lead = jump ? 0 : Math.min(0.25, dur * 0.3), prev = W.st[i - 1];
      var side = st.x !== prev.x ? (st.x > prev.x ? 1 : -1) : (i % 2 ? 1 : -1);
      W.moves.push({ t0: st.s.t + lead - dur, t1: st.s.t + lead, to: stationPose(st), st: i, arc: jump ? 0 : num(o.arc, 8) * side, pull: jump ? 0 : num(o.pull, 0.07) });
    });

    ctx.tl.to({ v: 0 }, { v: 1, duration: ctx.total, ease: 'none', onUpdate: function () { render(ctx.tl.time()); } }, 0);
    return true;
  }

  function addMove(m) { if (!W) return; W.moves.push(m); W.dirty = true; }

  function compile() {
    W.moves.sort(function (a, b) { return a.t0 - b.t0; });
    W.moves.forEach(function (m, i) {
      var prev = i ? W.moves[i - 1] : null;
      m.fromSt = prev ? prev.st : W.start.st;
      m.from = poseAt(m.t0, i);
    });
    W.dirty = false;
  }
  function drifted(p, dt, sign) {
    return { x: p.x, y: p.y, z: p.z, rx: p.rx, ry: p.ry + sign * 0.4 * Math.min(1, dt / 8), zoom: p.zoom * (1 + Math.min(dt * W.drift, 0.04)) };
  }
  /** 时间 → 相机姿态（只看前 n 次运镜）。同时带出 a、b 两个机位和它们之间的进度，用来算虚化 */
  function poseAt(time, n) {
    var m = null, k = -1;
    for (var i = 0; i < n; i++) { if (W.moves[i].t0 <= time) { m = W.moves[i]; k = i; } else break; }
    var out;
    if (!m) { out = drifted(W.start.pose, Math.max(0, time), 1); out.a = out.b = W.start.st; out.p = 1; return out; }
    if (time < m.t1) {
      var p = (time - m.t0) / (m.t1 - m.t0), e = inOut(p), bump = Math.sin(Math.PI * p), A = m.from, B = m.to;
      out = { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), z: lerp(A.z, B.z, e), rx: lerp(A.rx, B.rx, e), ry: lerp(A.ry, B.ry, e) + m.arc * bump,
              zoom: lerp(A.zoom, B.zoom, e) * (1 - m.pull * bump) };
      out.a = m.fromSt; out.b = m.st; out.p = e;
      return out;
    }
    out = drifted(m.to, time - m.t1, k % 2 ? -1 : 1);
    out.a = out.b = m.st; out.p = 1;
    return out;
  }

  function render(time) {
    if (!W) return;
    if (W.dirty) compile();
    var c = poseAt(time, W.moves.length), depth = W.mode === 'depth';
    W.el.style.transform = 'scale3d(' + c.zoom.toFixed(5) + ',' + c.zoom.toFixed(5) + ',' + c.zoom.toFixed(5) + ') rotateX(' + (-c.rx).toFixed(3) + 'deg) rotateY(' + (-c.ry).toFixed(3) + 'deg) translate3d(' +
      (-c.x).toFixed(2) + 'px,' + (-c.y).toFixed(2) + 'px,' + (-c.z).toFixed(2) + 'px)';
    if (W.wall) W.wall.style.transform = 'translate3d(' + (-c.x * 0.05 - time * 5).toFixed(2) + 'px,' + (-c.y * 0.05).toFixed(2) + 'px,0) scale(' + (1 + (c.zoom - 1) * 0.15).toFixed(4) + ')';
    if (W.grid) W.grid.style.transform = 'translate3d(' + Math.round(-((c.x * 0.22) % 240)) + 'px,' + Math.round(-((c.y * 0.22) % 240)) + 'px,0)';
    var halfW = W.w / c.zoom / 2 + W.w * 0.8, halfH = W.h / c.zoom / 2 + W.h * 0.8;
    W.st.forEach(function (st, i) {
      // f：这个机位有多「在焦点上」。1 = 清晰，0 = 远处的背景
      // 注意：CSS 规范规定父元素一旦设了 opacity < 1 或 filter != none，子级 preserve-3d 会瞬间坍缩为平面导致 1 帧屏闪；
      // 因此含有真 3D 样机的机位在常规平面推镜时不挂父级 filter / 半透明（机位间距 1.16 倍画幅互不重叠，靠视锥剪裁显隐）。
      var fa = c.a < 0 ? 1 : (i === c.a ? 1 : 0), fb = c.b < 0 ? 1 : (i === c.b ? 1 : 0), f = lerp(fa, fb, c.p);
      var rz = st.z - c.z, vis, op = 1, keep3d = st.has3d && !depth && c.a >= 0 && c.b >= 0;
      if (depth && c.b >= 0 && c.a >= 0) {
        // 纵深：前面的机位隐约可见，穿过去的放大变虚后消失
        vis = rz > -W.dz * 3.2 && rz < W.dz * 0.55;
        var amb = rz > 0 ? clamp(1 - rz / (W.dz * 0.5), 0, 1) : clamp(0.16 + rz / (W.dz * 22), 0.04, 0.16);
        op = Math.max(f, amb * (1 - f) + f);
        if (rz > 1) op = Math.min(op, clamp(1 - rz / (W.dz * 0.5), 0, 1));
      } else {
        vis = Math.abs(st.x - c.x) < halfW && Math.abs(st.y - c.y) < halfH;
        if (W.light && !keep3d && f < 0.995) op = lerp(0.26, 1, f);
      }
      var effF = keep3d ? 1 : f;
      var key = !vis ? 'h' : (effF > 0.995 ? '1' : effF.toFixed(3)) + '|' + op.toFixed(3);
      if (W.cache[i] === key) return;
      W.cache[i] = key;
      if (!vis) { st.el.style.visibility = 'hidden'; return; }
      st.el.style.visibility = 'visible';
      st.el.style.opacity = op > 0.995 ? '' : op.toFixed(3);
      st.el.style.filter = effF > 0.995 ? '' : (W.light ? 'blur(' + ((1 - effF) * (depth ? 9 : 6)).toFixed(2) + 'px)'
        : 'blur(' + ((1 - effF) * (depth ? 9 : 5)).toFixed(2) + 'px) brightness(' + (1 - (1 - effF) * 0.4).toFixed(3) + ')');
    });
  }

  FX.world = { setup: setup, render: render, addMove: addMove, on: function () { return !!W; },
               zoomAt: function (t) { if (!W) return 1; if (W.dirty) compile(); return poseAt(t, W.moves.length).zoom; } };

  // 没写 data-world 的页面也能用这两个名字，退化成普通转场
  FX.trans['cam-to'] = function (tl, t, prev, next, o) { return FX.trans['blur-cross'](tl, t, prev, next, { dur: num(o.dur, 0.5) }); };
  FX.trans['cam-jump'] = function () { return 0; };
  FX.catalog.push({ name: 'cam-to', cat: '转场', desc: '世界画布专用（默认）：镜头斜着推到下一个机位，先往后拉一点再推进，先慢再快再慢。参数 dur（0.6–0.9）、arc（路上多绕几度，默认 8）、pull（回拉幅度，默认 0.07）' });
  FX.catalog.push({ name: 'cam-jump', cat: '转场', desc: '世界画布专用：镜头直接跳到下一个机位（硬切），只在换大章节时用' });

  function needWorld(name) { if (!W) console.warn('FX：' + name + ' 需要根元素写 data-world'); return !W; }

  def('cam-look', CAT, '镜头推到机位里的某个元素上（念到它时用），讲完用 cam-home 拉回。参数 to（选择器，不写就是自己）、fit（推到它占画面多大，默认 0.6）、max（最多放大几倍，默认 1.4）、dur', function (c) {
    if (needWorld('cam-look')) return;
    var el = c.o.to ? $(c.o.to) : c.el, pose = el && elementPose(el, num(c.o.fit, 0.6), num(c.o.max, 1.4)), st = el && stationOf(el);
    if (!pose) return;
    var d = num(c.o.dur, 0.7);
    addMove({ t0: c.t, t1: c.t + d, to: pose, st: st.i, arc: num(c.o.arc, 3) * (pose.x >= st.x ? 1 : -1), pull: num(c.o.pull, 0.03) });
  });
  def('cam-home', CAT, '镜头回到本机位的全景（cam-look 之后用）。参数 dur', function (c) {
    if (needWorld('cam-home')) return;
    var st = c.scene && stationOf(c.scene.el); if (!st) return;
    var d = num(c.o.dur, 0.7);
    addMove({ t0: c.t, t1: c.t + d, to: stationPose(st), st: st.i, arc: num(c.o.arc, -3), pull: num(c.o.pull, 0.03) });
  });
  def('cam-wide', CAT, '镜头拉远看到整块画布（开场总览、结尾回顾）。写成 cam-wide@0 时全片从总览开始，再用 cam-home 推进去。参数 dur', function (c) {
    if (needWorld('cam-wide')) return;
    var pose = widePose();
    if (c.t <= 0.001) { W.start = { pose: pose, st: -1 }; W.dirty = true; return; }
    var d = num(c.o.dur, 1.1);
    addMove({ t0: c.t, t1: c.t + d, to: pose, st: -1, arc: num(c.o.arc, 5), pull: 0 });
  });

  /* ═════════════════════════ 焦点：把视线引到一处 ═════════════════════════ */

  def('wake', CAT, '先摆后讲：元素从一开始就在画面里但是暗的，念到它时点亮。参数 dim（没点亮时的亮度，默认 0.3）、solid=1（不用半透明而是压暗去色，卡片不会透出背景；舞台剧模式下自动开启）', function (c) {
    var dim = num(c.o.dim, 0.3), d = num(c.o.dur, 0.35), sg = num(c.o.stagger, 0.12), st = stageEl();
    // 压在图片背景上时（舞台剧，或 solid=1）不能用半透明：卡片会透出背景。改成压暗 + 去色，卡片保持不透明
    var solid = String(c.o.solid) === '1' || (st && st.getAttribute('data-mode') === 'stage' && String(c.o.solid) !== '0');
    c.els.forEach(function (el, i) {
      var t = c.t + i * sg;
      if (solid) c.tl.fromTo(el, { filter: 'brightness(' + (0.35 + dim * 0.5) + ') saturate(0.15)' }, { filter: 'brightness(1) saturate(1)', duration: d, ease: 'power2.out' }, t);
      else c.tl.fromTo(el, { opacity: dim, filter: 'saturate(0.15)' }, { opacity: 1, filter: 'saturate(1)', duration: d, ease: 'power2.out' }, t);
      c.tl.to(el, { scale: rel(0.05), duration: d * 0.45, ease: 'power2.out', yoyo: true, repeat: 1 }, t);
    });
  });
  def('zoom-here', CAT, '原位放大：从一组内容里挑出重点，在原来的位置直接放大，其余淡到 30% 往后退。参数 s（倍数，默认 2.4）、hold（几秒后自动收回，不写就不收）、dim', function (c) {
    var el = c.el, r = FX.rect(el), st = stageEl(), SW = st.offsetWidth, SH = st.offsetHeight, o = c.o;
    var s = Math.min(num(o.s, 2.4), SW * 0.82 / Math.max(1, r.w), SH * 0.6 / Math.max(1, r.h)), d = num(o.dur, 0.6), pull = num(o.pull, 0.8);
    var dx = (SW / 2 - r.cx) * pull, dy = (SH * 0.52 - r.cy) * pull, dim = num(o.dim, 0.3);
    var others = kidsOf(el.parentNode).filter(function (k) { return k !== el; });
    relPos(el);
    c.tl.set(el, { zIndex: 60 }, c.t);
    c.tl.to(el, { x: rel(dx), y: rel(dy), scale: s, duration: d, ease: 'power3.inOut' }, c.t);
    if (others.length) c.tl.to(others, { opacity: dim, scale: 0.96, filter: 'blur(2px)', duration: d, ease: 'power2.out' }, c.t);
    if (o.hold !== undefined) {
      var t2 = c.t + d + num(o.hold, 2);
      c.tl.to(el, { x: rel(-dx), y: rel(-dy), scale: 1, duration: d, ease: 'power3.inOut' }, t2);
      if (others.length) c.tl.to(others, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: d, ease: 'power2.out' }, t2);
      c.tl.set(el, { zIndex: 'auto' }, t2 + d);
    }
  });
  def('push-back', CAT, '背景虚化：新内容出现时，把原来那层整体往后推（缩到 94%、变虚 4px、变暗到 55%）。参数 s、blur、dim、dur', function (c) {
    c.tl.to(c.els, { scale: num(c.o.s, 0.94), filter: 'blur(' + num(c.o.blur, 4) + 'px) brightness(' + num(c.o.dim, 0.55) + ')', duration: num(c.o.dur, 0.5), ease: 'power2.out' }, c.t);
  });
  def('bring-front', CAT, '把 push-back 推到后面的那层拉回来', function (c) {
    c.tl.to(c.els, { scale: 1, filter: 'blur(0px) brightness(1)', duration: num(c.o.dur, 0.5), ease: 'power2.out' }, c.t);
  });

  var LAYER = { near: 0, mid: 1, far: 2 };
  function depthKids(el) { return kidsOf(el).filter(function (k) { return k.hasAttribute('data-depth'); }); }
  def('depth', CAT, '景深分层：子元素写 data-depth="near|mid|far"，离焦点越远越虚（0 / 4 / 8px），并按层做视差漂移。参数 focus（焦点在哪层，默认 mid）、shift（视差幅度，默认 40）、blur', function (c) {
    var f = LAYER[c.o.focus || 'mid'], bl = num(c.o.blur, 4), shift = num(c.o.shift, 40), d = num(c.o.dur, c.sceneDur);
    c.el.__focus = f;
    depthKids(c.el).forEach(function (k) {
      var L = LAYER[k.getAttribute('data-depth')] || 0, par = [1.6, 1, 0.45][L];
      gs().set(k, { filter: 'blur(' + Math.abs(L - f) * bl + 'px)' });
      c.tl.fromTo(k, { x: rel(shift * par * 0.5) }, { x: rel(-shift * par), duration: d, ease: 'sine.inOut' }, c.t);
    });
  });
  def('rack-focus', CAT, '移焦：把清晰的那一层换成另一层（配合 depth 用）。参数 to=near|mid|far、dur', function (c) {
    var f = LAYER[c.o.to || 'near'], bl = num(c.o.blur, 4);
    depthKids(c.el).forEach(function (k) {
      var L = LAYER[k.getAttribute('data-depth')] || 0;
      c.tl.to(k, { filter: 'blur(' + Math.abs(L - f) * bl + 'px)', duration: num(c.o.dur, 0.6), ease: 'power2.inOut' }, c.t);
    });
  });

  var TINT = typeof WeakMap === 'function' ? new WeakMap() : null;
  def('bg-tint', CAT, '背景换色：换图时把背景整块换成这张图的主色，观众一眼知道换了。参数 color（写 reset 换回原色）、dur（默认 0.5）、to（要换色的元素，默认整块画布）', function (c) {
    var t = c.o.to ? $(c.o.to) : (W ? W.bg : (c.scene ? c.scene.el : stageEl()));
    if (!t) return;
    if (!TINT.has(t)) TINT.set(t, getComputedStyle(t).backgroundColor);
    var col = c.o.color === 'reset' || !c.o.color ? TINT.get(t) : c.o.color;
    c.tl.to(t, { backgroundColor: col, duration: num(c.o.dur, 0.5), ease: 'power2.inOut' }, c.t);
  });

  /* ═════════════════════════ 图片组：出场 ═════════════════════════ */

  def('skeleton', CAT, '骨架填充：复杂界面先出灰色骨架块，再按阅读顺序一块块填进真实内容。写在容器上，子元素就是一块块内容。参数 gap（每块间隔，默认 0.15）、hold（骨架先停多久，默认 0.5）', function (c) {
    var host = c.scene ? c.scene.el : c.el.parentNode, gap = num(c.o.gap, 0.15), hold = num(c.o.hold, 0.5);
    kidsOf(c.el).forEach(function (k, i) {
      var r = FX.rect(k), ph = mk('i', 'fx-skel'), tk = c.t + hold + i * gap;
      ph.style.cssText = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px;border-radius:' + (getComputedStyle(k).borderRadius || '12px');
      host.appendChild(ph);
      c.tl.fromTo(ph, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, c.t + i * 0.03);
      c.tl.to(ph, { opacity: 0, duration: 0.22, ease: 'power1.in' }, tk);
      c.tl.fromTo(k, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' }, tk);
    });
  });
  def('deal-in', CAT, '发牌入场：一组图不同时出现，一张接一张沿弧线飞到各自位置。配 each: 用。参数 stagger（默认 0.1）、from=left|right（从哪边发）、dur', function (c) {
    var st = stageEl(), SW = st.offsetWidth, SH = st.offsetHeight, d = num(c.o.dur, 0.6), sg = num(c.o.stagger, 0.1), right = c.o.from === 'right';
    c.els.forEach(function (el, i) {
      var r = FX.rect(el), t = c.t + i * sg, dx = right ? SW - r.x + 160 : -(r.x + r.w + 160), dy = SH - r.y + 120;
      c.tl.from(el, { x: rel(dx * 0.75), duration: d, ease: 'power1.out' }, t);
      c.tl.from(el, { y: rel(dy), duration: d, ease: 'expo.out' }, t);
      c.tl.from(el, { rotation: rel(right ? 32 : -32), scale: 0.5, duration: d, ease: 'power3.out' }, t);
      c.tl.from(el, { opacity: 0, duration: 0.1, ease: 'none' }, t);
    });
  });
  def('drop-gather', CAT, '落下收拢：一堆图从上方落下，收拢成扇形，只留要讲的几张，其余掉出画面。写在容器上；要留的子元素加 data-keep（不加就留前 keep 张）。参数 keep（默认 3）', function (c) {
    var el = c.el, kids = kidsOf(el), n = kids.length, r = FX.rand(num(c.o.seed, 11)), keepN = num(c.o.keep, 3), mid = (n - 1) / 2, G = gs();
    var marked = kids.filter(function (k) { return k.hasAttribute('data-keep'); });
    var keep = marked.length ? marked : kids.slice(0, keepN), km = (keep.length - 1) / 2;
    var w = kids[0] ? kids[0].offsetWidth || 300 : 300, step = Math.min(w * 0.42, (el.offsetWidth || 1400) * 0.8 / Math.max(1, n));
    relPos(el);
    kids.forEach(function (k, i) {
      k.style.position = 'absolute'; k.style.left = '50%'; k.style.top = '50%';
      var px = (r() - 0.5) * step * n * 0.8, py = (r() - 0.5) * 90, pr = (r() - 0.5) * 50, t = c.t + i * 0.035;
      G.set(k, { xPercent: -50, yPercent: -50, zIndex: 10 + i });
      c.tl.fromTo(k, { x: px * 0.6, y: -1100 - r() * 300, rotation: pr * 2, opacity: 1 }, { x: px, y: py, rotation: pr, duration: 0.6, ease: 'bounce.out' }, t);
      c.tl.to(k, { x: (i - mid) * step, y: Math.pow(i - mid, 2) * 5, rotation: (i - mid) * 4, duration: 0.5, ease: 'power3.inOut' }, c.t + 0.95);
      var j = keep.indexOf(k);
      if (j < 0) c.tl.to(k, { y: 1200, rotation: rel((r() - 0.5) * 80), opacity: 0, duration: 0.55, ease: 'power2.in' }, c.t + 1.75 + r() * 0.15);
      else c.tl.to(k, { x: (j - km) * w * 0.86, y: Math.abs(j - km) * 14, rotation: (j - km) * 5, scale: 1.12, duration: 0.55, ease: 'power3.out' }, c.t + 1.85);
    });
  });

  /* ═════════════════════════ 图片组：排布（图不动，相机动） ═════════════════════════ */

  /** 纵深通道：子元素沿纵深一件件排开、左右交替。data-gap 每件隔多远（默认 1100）、data-off 左右偏多少（默认 150） */
  FX.make.tunnel = function (el) {
    var kids = kidsOf(el), gap = num(attr(el, 'gap'), 1100), off = num(attr(el, 'off'), 150), z = mk('div', 'fx-tunnel-z');
    el.classList.add('fx-tunnel');
    kids.forEach(function (k, i) {
      k.classList.add('fx-tunnel-item', i % 2 ? 'r' : 'l');
      k.__tz = -i * gap; k.__tx = (i % 2 ? 1 : -1) * off;
      z.appendChild(k);
    });
    el.appendChild(z);
    el.__tunnel = { z: z, kids: kids, gap: gap, cur: 0 };
    paintTunnel(el, 0);
  };
  function paintTunnel(el, pos) {
    var T = el.__tunnel;
    T.kids.forEach(function (k) {
      var rz = k.__tz + pos, vis = rz < T.gap * 0.62 && rz > -T.gap * 3.4;
      if (!vis) { k.style.visibility = 'hidden'; return; }
      k.style.visibility = 'visible';
      k.style.transform = 'translate(-50%,-50%) translate3d(' + k.__tx + 'px,0,' + rz.toFixed(1) + 'px)';
      k.style.opacity = (rz > 0 ? clamp(1 - rz / (T.gap * 0.55), 0, 1) : clamp(1 + (rz + T.gap * 0.9) / (T.gap * 2.2), 0, 1)).toFixed(3);
      k.style.filter = rz > 4 ? 'blur(' + (rz / T.gap * 22).toFixed(1) + 'px)' : (rz < -T.gap * 1.2 ? 'blur(' + ((-rz / T.gap - 1.2) * 3).toFixed(1) + 'px)' : '');
    });
  }
  def('fly', CAT, '纵深穿梭：镜头连续往里飞，穿过的那件放大变虚，下一件从深处淡入。写在 data-make="tunnel" 上。参数 to（飞到第几件，从 1 数）、each（每件用时，默认 0.7）', function (c) {
    var T = c.el.__tunnel; if (!T) { console.warn('FX：fly 要写在 data-make="tunnel" 的元素上'); return; }
    var to = clamp(num(c.o.to, T.kids.length) - 1, 0, T.kids.length - 1), each = num(c.o.each, 0.7), from = T.cur, step = to >= from ? 1 : -1, t = c.t;
    for (var i = from; i !== to; i += step) {
      (function (a, b, at) {
        var p = { v: a * T.gap };
        c.tl.to(p, { v: b * T.gap, duration: each, ease: 'power1.inOut', onUpdate: function () { paintTunnel(c.el, p.v); } }, at);
      })(i, i + step, t);
      t += each;
    }
    T.cur = to;
  });

  /** 环筒：子元素围着中心排成圆筒，一层层往上盘。data-per 每层几张（默认 7）、data-r 半径（默认 620）、data-rise 每层升多高（默认 300） */
  FX.make.helix = function (el) {
    var kids = kidsOf(el), per = num(attr(el, 'per'), 7), R = num(attr(el, 'r'), 620), rise = num(attr(el, 'rise'), 300), spin = mk('div', 'fx-helix-spin');
    el.classList.add('fx-helix');
    kids.forEach(function (k, i) { k.classList.add('fx-helix-item'); k.__ang = i * 360 / per; k.__y = -i * rise / per + rise * 0.55; spin.appendChild(k); });
    el.appendChild(spin);
    el.__helix = { spin: spin, kids: kids, R: R, rise: rise, per: per, rot: 0 };
    paintHelix(el, 0);
  };
  function paintHelix(el, rot) {
    var H = el.__helix, lift = rot / 360 * H.rise;
    H.spin.style.transform = 'translateZ(' + (-H.R) + 'px) translateY(' + lift.toFixed(1) + 'px)';
    H.kids.forEach(function (k) {
      var a = k.__ang - rot, face = Math.cos(rad(a));     // 1 = 正对镜头，-1 = 在筒的背面
      var y = k.__y, sy = y + lift;
      if (Math.abs(sy) > H.rise * 1.9) { k.style.visibility = 'hidden'; return; }
      k.style.visibility = 'visible';
      k.style.transform = 'translate(-50%,-50%) translateY(' + y.toFixed(1) + 'px) rotateY(' + a.toFixed(2) + 'deg) translateZ(' + H.R + 'px)';
      // 只留朝向镜头的半圈：正对的最亮，转到侧面变暗，转到背面淡出（不然前后两排图叠在一起很乱）
      var front = clamp((face + 0.12) / 0.4, 0, 1);
      if (front <= 0) { k.style.visibility = 'hidden'; return; }
      k.style.filter = face > 0.985 ? '' : 'brightness(' + (0.4 + 0.6 * clamp((face - 0.1) / 0.85, 0, 1)).toFixed(3) + ')';
      k.style.opacity = (front * clamp(1.5 - Math.abs(sy) / (H.rise * 1.2), 0, 1)).toFixed(3);
    });
  }
  def('helix-spin', CAT, '环筒螺旋：相机绕着圆筒转，先快后慢转开，再匀速慢转。写在 data-make="helix" 上。参数 turn（快转多少度，默认 300）、dur（快转用时，默认 2.4）、slow（之后每秒慢转几度，默认 10）', function (c) {
    var H = c.el.__helix; if (!H) { console.warn('FX：helix-spin 要写在 data-make="helix" 的元素上'); return; }
    var from = H.rot, turn = num(c.o.turn, 300), d = num(c.o.dur, 2.4), slow = num(c.o.slow, 10), rest = Math.max(0, c.sceneDur - d);
    var p = { v: from };
    c.tl.to(p, { v: from + turn, duration: d, ease: 'power3.out', onUpdate: function () { paintHelix(c.el, p.v); } }, c.t);
    if (slow && rest > 0.05) {
      var q = { v: from + turn };
      c.tl.to(q, { v: from + turn + slow * rest, duration: rest, ease: 'none', onUpdate: function () { paintHelix(c.el, q.v); } }, c.t + d);
      H.rot = from + turn + slow * rest;
    } else H.rot = from + turn;
  });

  /** 翻转展板：子元素是一块块展板，上下叠成一摞，一次只有一块正对镜头 */
  FX.make.flipboard = function (el) {
    var kids = kidsOf(el);
    el.classList.add('fx-flipboard');
    kids.forEach(function (k) { k.classList.add('fx-flip-panel'); });
    el.__flip = { kids: kids, cur: 0 };
    paintFlip(el, 0);
  };
  function paintFlip(el, p) {
    el.__flip.kids.forEach(function (k, i) {
      var d = i - p, ad = Math.abs(d);
      if (ad > 1.7) { k.style.visibility = 'hidden'; return; }
      k.style.visibility = 'visible';
      k.style.transform = 'translateY(' + (d * 64).toFixed(2) + '%) rotateX(' + (-clamp(d, -1.25, 1.25) * 74).toFixed(2) + 'deg)';
      k.style.filter = ad < 0.02 ? '' : 'brightness(' + (1 - 0.7 * Math.min(1, ad)).toFixed(3) + ')';
      k.style.zIndex = String(100 - Math.round(ad * 10));
    });
  }
  def('flip-to', CAT, '三维翻转：展板一块接一块往上滚，每块绕横轴大角度翻转，转到正面完整显色，其余压暗到 30%。写在 data-make="flipboard" 上。参数 i（翻到第几块，从 1 数）、dur', function (c) {
    var F = c.el.__flip; if (!F) { console.warn('FX：flip-to 要写在 data-make="flipboard" 的元素上'); return; }
    var from = F.cur, to = clamp(num(c.o.i, from + 2) - 1, 0, F.kids.length - 1), p = { v: from };
    c.tl.to(p, { v: to, duration: num(c.o.dur, 0.7) * Math.max(1, Math.abs(to - from) * 0.7), ease: 'power2.inOut', onUpdate: function () { paintFlip(c.el, p.v); } }, c.t);
    F.cur = to;
  });

  /* ═════════════════════════ 图片组：切换（相机不动，图自己换） ═════════════════════════ */

  /** 扇形一排：子元素摆成扇形。data-step 间距、data-deg 每张转几度（默认 6）、data-arc 两边下沉多少（默认 10） */
  FX.make.fan = function (el) {
    var kids = kidsOf(el), n = kids.length, mid = (n - 1) / 2, w = kids[0] ? kids[0].offsetWidth || 260 : 260;
    var step = num(attr(el, 'step'), Math.min(w * 0.78, (el.offsetWidth || 1500) * 0.86 / Math.max(1, n))), deg = num(attr(el, 'deg'), 6), arc = num(attr(el, 'arc'), 10);
    el.classList.add('fx-fan');
    el.__fan = kids.map(function (k, i) {
      var d = i - mid, b = { x: d * step, y: d * d * arc, r: d * deg };
      k.style.position = 'absolute'; k.style.left = '50%'; k.style.top = '50%';
      gs().set(k, { xPercent: -50, yPercent: -50, x: b.x, y: b.y, rotation: b.r, zIndex: 10 + i });
      return b;
    });
  };
  def('pick', CAT, '放大让位：扇形里讲到谁，谁就抬起放大，左右往两边让开，其他图都还看得见。写在 data-make="fan" 上。参数 i（第几张，从 1 数；0 = 全部放回）、s（默认 1.3）、gap（让开多远，默认 90）、lift（抬多高，默认 70）', function (c) {
    var base = c.el.__fan; if (!base) { console.warn('FX：pick 要写在 data-make="fan" 的元素上'); return; }
    var sel = num(c.o.i, 1) - 1, s = num(c.o.s, 1.3), gap = num(c.o.gap, 90), lift = num(c.o.lift, 70), d = num(c.o.dur, 0.45);
    kidsOf(c.el).forEach(function (k, j) {
      var b = base[j]; if (!b) return;
      var to = sel < 0 ? { x: b.x, y: b.y, rotation: b.r, scale: 1 }
             : j === sel ? { x: b.x, y: b.y - lift, rotation: 0, scale: s }
             : { x: b.x + (j < sel ? -gap : gap), y: b.y, rotation: b.r, scale: 1 };
      to.duration = d; to.ease = 'power3.out';
      c.tl.to(k, to, c.t);
      c.tl.set(k, { zIndex: j === sel ? 60 : 10 + j }, c.t);
    });
  });

  /** 切片图组：子元素是一串 <img>，一次显示一张。data-n 切几条（默认 5） */
  FX.make.slices = function (el) {
    var imgs = kidsOf(el).filter(function (k) { return k.tagName === 'IMG'; }), n = num(attr(el, 'n'), 5), w = el.offsetWidth || 960, h = el.offsetHeight || 540;
    el.classList.add('fx-slices');
    var layers = imgs.map(function (img, i) {
      var layer = mk('div', 'fx-slices-layer'), strips = [];
      for (var k = 0; k < n; k++) {
        var s = mk('div', 'fx-slices-strip'), im = mk('img');
        s.style.cssText = 'left:' + (k * 100 / n) + '%;width:' + (100 / n + 0.06) + '%';
        im.src = img.getAttribute('src'); im.alt = '';
        im.style.cssText = 'left:' + (-k * w / n) + 'px;width:' + w + 'px;height:' + h + 'px';
        s.appendChild(im); layer.appendChild(s); strips.push(s);
        if (i) s.style.clipPath = 'inset(100% 0% 0% 0%)';
      }
      var cap = img.getAttribute('alt');
      if (cap) { var lb = mk('div', 'fx-slices-cap'); lb.innerHTML = '<b>' + (i < 9 ? '0' : '') + (i + 1) + '</b>' + cap; if (i) lb.style.opacity = '0'; layer.appendChild(lb); layer.__cap = lb; }
      layer.style.zIndex = String(i ? 1 : 2);
      layer.__strips = strips;
      el.appendChild(layer);
      img.style.display = 'none';
      return layer;
    });
    el.__slices = { layers: layers, cur: 0, z: 2 };
  };
  def('slice-to', CAT, '切片换图：新图切成几条，一条条从下面长上来，编号同步翻牌。写在 data-make="slices" 上。参数 i（换到第几张，从 1 数；不写就是下一张）、stagger（默认 0.07）、dur', function (c) {
    var S = c.el.__slices; if (!S) { console.warn('FX：slice-to 要写在 data-make="slices" 的元素上'); return; }
    var to = c.o.i === undefined ? (S.cur + 1) % S.layers.length : clamp(num(c.o.i, 1) - 1, 0, S.layers.length - 1), L = S.layers[to], prev = S.layers[S.cur];
    if (to === S.cur) return;
    c.tl.set(L, { zIndex: ++S.z }, c.t);
    c.tl.fromTo(L.__strips, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: num(c.o.dur, 0.42), ease: 'power3.out', stagger: num(c.o.stagger, 0.07) }, c.t);
    if (L.__cap) c.tl.fromTo(L.__cap, { opacity: 0, rotationX: -90 }, { opacity: 1, rotationX: 0, duration: 0.3, ease: 'back.out(2)' }, c.t + 0.12);
    if (prev.__cap) c.tl.to(prev.__cap, { opacity: 0, duration: 0.12 }, c.t);
    S.cur = to;
  });

  /* ═════════════════════════ 流程：走进画面 ═════════════════════════ */

  /** 一条路：子元素是路上的一个个路牌（流程的每一步）。data-step 每步隔多远（默认 520） */
  FX.make.road = function (el) {
    var kids = kidsOf(el), step = num(attr(el, 'step'), 520), back = step * 3, tilt = mk('div', 'fx-road-tilt'), floor = mk('div', 'fx-road-floor');
    el.classList.add('fx-road');
    floor.style.height = (back + step * (kids.length + 1.5)) + 'px';   // 路面往镜头身后多铺一段，往前走时脚下不会露底
    floor.style.bottom = -back + 'px';
    floor.appendChild(mk('div', 'fx-road-surface'));
    kids.forEach(function (k, i) {
      var post = mk('div', 'fx-road-post' + (i % 2 ? ' r' : ' l')), up = mk('div', 'fx-road-up');
      post.style.bottom = (back + step * (i + 0.9)) + 'px';
      k.classList.add('fx-road-sign');
      up.appendChild(k); post.appendChild(up); floor.appendChild(post);
    });
    tilt.appendChild(floor); el.appendChild(tilt);
    el.__road = { floor: floor, kids: kids, step: step, cur: -1 };
    gs().set(floor, { y: -step * 0.9 });
    gs().set(kids, { opacity: 0.38 });
  };
  def('road-walk', CAT, '走进画面：镜头贴着地面沿路往里走，走到哪一步哪一步亮。写在 data-make="road" 上。参数 i（走到第几步，从 1 数）、dur', function (c) {
    var R = c.el.__road; if (!R) { console.warn('FX：road-walk 要写在 data-make="road" 的元素上'); return; }
    var to = clamp(num(c.o.i, R.cur + 2) - 1, 0, R.kids.length - 1), d = num(c.o.dur, 0.9);
    c.tl.to(R.floor, { y: R.step * (to + 0.12), duration: d, ease: 'power2.inOut' }, c.t);
    R.kids.forEach(function (k, i) {
      c.tl.to(k, { opacity: i === to ? 1 : (i < to ? 0.22 : 0.38), duration: d * 0.6, ease: 'power1.out' }, c.t + d * 0.4);
      if (i === to) c.tl.fromTo(k, { scale: 1 }, { scale: 1.08, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 }, c.t + d * 0.75);
    });
    R.cur = to;
  });

  /* ═════════════════════════ 包装：章节数字、进度线 ═════════════════════════ */

  /** 章节大数字卡：data-no="01" data-title="世界画布" data-en="WORLD CANVAS" data-tag="第 1 招" */
  FX.make.bignum = function (el) {
    el.classList.add('fx-bignum');
    el.innerHTML = '<b class="fx-bignum-no">' + attr(el, 'no', '01') + '</b><div class="fx-bignum-txt">' +
      (attr(el, 'tag', '') ? '<small>' + attr(el, 'tag') + '</small>' : '') + '<strong>' + attr(el, 'title', '') + '</strong>' +
      (attr(el, 'en', '') ? '<em>' + attr(el, 'en') + '</em>' : '') + '</div>';
  };
  def('bignum', CAT, '章节卡入场：大数字先落下，标题跟着滑出。写在 data-make="bignum" 上。参数 dock（几秒后缩成左上角小标签，不写就不缩）', function (c) {
    var no = $('.fx-bignum-no', c.el), txt = $('.fx-bignum-txt', c.el);
    if (!no) { console.warn('FX：bignum 要写在 data-make="bignum" 的元素上'); return; }
    c.tl.from(no, { y: rel(70), opacity: 0, filter: 'blur(14px)', duration: 0.5, ease: 'power3.out' }, c.t);
    c.tl.from(kidsOf(txt), { x: rel(-40), opacity: 0, duration: 0.45, ease: 'power3.out', stagger: 0.07 }, c.t + 0.14);
    if (c.o.dock !== undefined) {
      var r = FX.rect(c.el), s = num(c.o.s, 0.34), tx = num(c.o.x, 64), ty = num(c.o.y, 92);
      c.tl.to(c.el, { x: rel(tx - r.x), y: rel(ty - r.y), scale: s, transformOrigin: '0% 0%', duration: 0.6, ease: 'power3.inOut' }, c.t + num(c.o.dock, 1.4));
    }
  });

  /** 分段进度线：data-n 共几段。配 segment 动效 */
  FX.make.segments = function (el) {
    var n = num(attr(el, 'n'), 6), h = '';
    el.classList.add('fx-segments');
    for (var i = 0; i < n; i++) h += '<i><b></b></i>';
    h += '<span class="fx-segments-count">';
    for (var k = 0; k <= n; k++) h += '<u>' + (k < 10 ? '0' : '') + k + ' / ' + (n < 10 ? '0' : '') + n + '</u>';
    el.innerHTML = h + '</span>';
    el.__seg = { n: n, cur: 0 };
  };
  def('segment', CAT, '进度线走到第 i 段（从 1 数）。写在 data-make="segments" 上，一般放在常驻叠加层里', function (c) {
    var S = c.el.__seg; if (!S) { console.warn('FX：segment 要写在 data-make="segments" 的元素上'); return; }
    var i = clamp(num(c.o.i, S.cur + 1), 0, S.n), bars = kidsOf(c.el).filter(function (k) { return k.tagName === 'I'; }), counts = c.el.querySelectorAll('u');
    bars.forEach(function (b, k) {
      var fill = b.firstChild;
      if (k < i - 1) c.tl.to(fill, { scaleX: 1, opacity: 0.45, duration: 0.25 }, c.t);
      else if (k === i - 1) c.tl.fromTo(fill, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: num(c.o.dur, 0.5), ease: 'power2.out' }, c.t);
      else c.tl.to(fill, { scaleX: 0, duration: 0.2 }, c.t);
    });
    Array.prototype.forEach.call(counts, function (u, k) { c.tl.set(u, { visibility: k === i ? 'visible' : 'hidden' }, c.t); });
    S.cur = i;
  });
})(typeof window !== 'undefined' ? window : this);
