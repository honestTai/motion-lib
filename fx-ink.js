/* fx-ink.js — 手绘批注（可选模块，加载在 fx.js 之后）
 *
 * 像拿马克笔在画面上圈、划、标：线条有一点抖（每次画都不完全一样），按笔顺描出来，
 * 画好以后每秒换 10 次姿势轻轻「沸腾」，一看就是手画的。写在要批注的元素上：
 *
 *   <div class="fx-sign" data-fx="ink-circle@1.2(label=看这里)">…</div>      圈起来，旁边写一句
 *   <div data-fx="ink-underline@2(kind=squiggle)">…</div>                      波浪线（strike 划掉、bracket 左括号、double 双线）
 *   <div data-fx="ink-box@3(label=重点)">…</div>                               手画方框
 *   <div data-fx="ink-arrow@4(to=#price)">…</div>                              从这里画一支箭头指到 #price
 *   <p data-fx="ink-mark@5(word=二十倍,style=highlight,note=实测)">…</p>       Vox 式批注：给句子里的一个词上马克笔，再拉一根线写注释
 *
 * 通用参数：color（墨水颜色，默认皮肤的强调色）、w（线宽）、dur（画多久）、boil=calm|lively|off（沸腾程度）。
 *
 * 线条的抖动、沸腾和笔画节奏参考了 HyperFrames 组件库（Apache-2.0）的 hw-* 手绘家族，代码是按本库的写法重新写的。
 */
(function (g) {
  'use strict';
  var FX = g.FX; if (!FX || !FX.register) return;
  var doc = g.document;
  var NS = 'http://www.w3.org/2000/svg';
  var num = function (v, d) { v = parseFloat(v); return isFinite(v) ? v : d; };
  var mk = function (tag, cls) { var e = doc.createElement(tag); if (cls) e.className = cls; return e; };
  var svgEl = function (tag, attrs) { var e = doc.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; };
  var r1 = function (v) { return (Math.round(v * 10) / 10).toString(); };
  var def = FX.register, CAT = '手绘';

  /** 伪随机：同一个 (n, seed) 永远得到同一个 -1…1 之间的数 */
  function hash(n, seed) { var x = Math.sin(n * 127.1 + (seed || 1) * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
  var seedOf = function (c, k) { return num(c.o.seed, (Math.round(c.t * 1000) + (k || 0)) % 97 + 3); };
  var INK = function (c) { return c.o.color || 'var(--fx-ink-color, var(--fx-accent))'; };

  /* ───────────── 共用：一块贴在元素上的画布、描线、沸腾 ───────────── */
  var BOIL = [];
  var BOILS = { off: null, calm: { amp: 1.3, rot: 0.4 }, lively: { amp: 2.4, rot: 0.9 } };
  function ensurePositioned(el) { if (g.getComputedStyle(el).position === 'static') el.style.position = 'relative'; }
  /** 在 host 里放一块画布：左上角在 (x, y)，大小 w × h（都是 host 内的像素） */
  function board(host, x, y, w, h, c, extraCls) {
    ensurePositioned(host);
    var wrap = mk('div', 'fx-ink' + (extraCls ? ' ' + extraCls : ''));
    wrap.style.cssText = 'left:' + r1(x) + 'px;top:' + r1(y) + 'px;width:' + r1(w) + 'px;height:' + r1(h) + 'px';
    var svg = svgEl('svg', { viewBox: '0 0 ' + r1(w) + ' ' + r1(h), width: r1(w), height: r1(h) });
    wrap.appendChild(svg); host.appendChild(wrap);
    var b = BOILS[c.o.boil || 'calm']; if (b === undefined) b = BOILS.calm;
    if (b) BOIL.push({ el: wrap, amp: b.amp, rot: b.rot, seed: seedOf(c, 7), t0: c.t });
    return { wrap: wrap, svg: svg };
  }
  function stroke(svg, d, c, extra) {
    var p = svgEl('path', { d: d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    p.style.stroke = (extra && extra.color) || INK(c);
    p.style.strokeWidth = (extra && extra.width) || num(c.o.w, 6);
    if (extra && extra.opacity) p.style.opacity = extra.opacity;
    svg.appendChild(p);
    return p;
  }
  /** 按笔顺描出来：用路径真实长度做虚线，从全藏到全露 */
  function drawOn(tl, p, t, d, ease) {
    var L = Math.ceil(p.getTotalLength()) + 2;
    p.style.strokeDasharray = L + ' ' + (L + 4);
    p.style.strokeDashoffset = L;
    tl.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: d, ease: ease || 'power2.inOut', immediateRender: false }, t);
  }
  function label(host, text, c, cls) {
    var s = mk('span', 'fx-ink-label' + (cls ? ' ' + cls : '')); s.textContent = text;
    if (c.o.color) s.style.color = c.o.color;
    host.appendChild(s); return s;
  }
  function pop(tl, el, t) {
    tl.set(el, { visibility: 'hidden' }, 0);
    tl.set(el, { visibility: 'inherit' }, t);
    tl.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(2.2)', immediateRender: false }, t);
  }

  /* ───────────── 形状 ───────────── */
  /** 抖动的椭圆：从左上方起笔，多画 15% 圈，收笔不和起笔重合（手画圈都这样） */
  function wobbleEllipse(cx, cy, rx, ry, seed, pct, over) {
    var N = 16, M = Math.round(N * (1 + (over === undefined ? 0.15 : over))), a0 = -2.25, pts = [];
    for (var i = 0; i <= M; i++) {
      var a = a0 + (i / N) * Math.PI * 2, wr = (1 + hash(i % N * 13 + 5, seed) * (pct / 100)) * (1 + 0.035 * i / N);
      pts.push([cx + Math.cos(a) * rx * wr, cy + Math.sin(a) * ry * wr]);
    }
    var d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
    for (var j = 1; j < pts.length - 1; j++) d += ' Q' + r1(pts[j][0]) + ' ' + r1(pts[j][1]) + ' ' + r1((pts[j][0] + pts[j + 1][0]) / 2) + ' ' + r1((pts[j][1] + pts[j + 1][1]) / 2);
    return d;
  }
  function wobbleRect(x0, y0, w, h, r, seed, amp) {
    var o = function (n) { return hash(n, seed) * amp; }, X = function (v, n) { return r1(x0 + v + o(n)); }, Y = function (v, n) { return r1(y0 + v + o(n)); };
    return 'M ' + X(r, 1) + ' ' + Y(0, 2) + ' L ' + X(w / 2, 3) + ' ' + Y(0, 4) + ' L ' + X(w - r, 5) + ' ' + Y(0, 6) +
      ' Q ' + X(w, 7) + ' ' + Y(0, 8) + ' ' + X(w, 9) + ' ' + Y(r, 10) + ' L ' + X(w, 11) + ' ' + Y(h / 2, 12) + ' L ' + X(w, 13) + ' ' + Y(h - r, 14) +
      ' Q ' + X(w, 15) + ' ' + Y(h, 16) + ' ' + X(w - r, 17) + ' ' + Y(h, 18) + ' L ' + X(w / 2, 19) + ' ' + Y(h, 20) + ' L ' + X(r, 21) + ' ' + Y(h, 22) +
      ' Q ' + X(0, 23) + ' ' + Y(h, 24) + ' ' + X(0, 25) + ' ' + Y(h - r, 26) + ' L ' + X(0, 27) + ' ' + Y(h / 2, 28) + ' L ' + X(0, 29) + ' ' + Y(r, 30) +
      ' Q ' + X(0, 31) + ' ' + Y(0, 32) + ' ' + X(r + 6, 33) + ' ' + Y(-1, 34);
  }
  /** 波浪线 / 划掉 / 左括号，(w × h) 的框里 */
  function markPath(w, h, kind, seed) {
    var wob = function (n, range) { return hash(n, seed) * (range === undefined ? 5 : range); }, mid = h / 2, d, i;
    if (kind === 'bracket') return 'M ' + r1(w * 0.9 + wob(1, 3)) + ' ' + r1(2 + wob(2, 3)) + ' Q ' + r1(wob(3, 4)) + ' ' + r1(2 + wob(4)) + ' ' + r1(4 + wob(5, 3)) + ' ' + r1(h * 0.5 + wob(6)) +
      ' Q ' + r1(wob(7, 4)) + ' ' + r1(h - 2 + wob(8)) + ' ' + r1(w * 0.9 + wob(9, 3)) + ' ' + r1(h - 2 + wob(10, 3));
    if (kind === 'strike') return 'M ' + r1(2 + wob(1, 3)) + ' ' + r1(mid + wob(2)) + ' L ' + r1(w - 4 + wob(3, 3)) + ' ' + r1(mid - 3 + wob(4)) +
      ' M ' + r1(w - 10 + wob(5, 4)) + ' ' + r1(mid + 7 + wob(6)) + ' L ' + r1(8 + wob(7, 4)) + ' ' + r1(mid + 3 + wob(8));
    if (kind === 'scribble') { d = 'M ' + r1(wob(1, 4)) + ' ' + r1(h * 0.7); for (i = 1; i <= 7; i++) d += ' L ' + r1(w * i / 7 + wob(i * 3, 6)) + ' ' + r1((i % 2 ? h * 0.25 : h * 0.75) + wob(i * 3 + 1, 5)); return d; }
    var segs = Math.max(4, Math.round(w / 95));
    d = 'M 2 ' + r1(mid + wob(0, 4));
    for (i = 1; i <= segs; i++) {
      var x = (w / segs) * i;
      d += ' Q ' + r1(x - w / segs / 2 + wob(i * 4 + 1, 9)) + ' ' + r1(mid + (i % 2 ? -1 : 1) * (h * 0.26 + wob(i * 4 + 2, 3))) + ' ' + r1(x) + ' ' + r1(mid + wob(i * 4 + 3, 4));
    }
    return d;
  }

  /* ───────────── 效果 ───────────── */
  def('ink-circle', CAT, '手画一个圈把元素圈起来（起笔在左上，多画一点收尾），可以在旁边写一句。参数 label（旁边的字）、at=right|left|top|bottom（字写在哪边）、pad（圈比元素大多少，默认 18）、color、w、dur', function (c) {
    var el = c.el, o = c.o, pad = num(o.pad, 18), w = el.offsetWidth, h = el.offsetHeight, W = w + pad * 2, H = h + pad * 2, d = num(o.dur, 0.7);
    var B = board(el, -pad, -pad, W, H, c);
    var p = stroke(B.svg, wobbleEllipse(W / 2, H / 2, W / 2 - 6, H / 2 - 6, seedOf(c), 3), c);
    drawOn(c.tl, p, c.t, d);
    if (o.label) {
      var s = label(B.wrap, String(o.label), c, 'at-' + (o.at || 'right'));
      pop(c.tl, s, c.t + d * 0.75);
    }
  });
  def('ink-underline', CAT, '手画的线：波浪下划线、划掉、左括号。参数 kind=squiggle|double|strike|bracket、color、w、dur', function (c) {
    var el = c.el, o = c.o, kind = o.kind || 'squiggle', w = el.offsetWidth, h = el.offsetHeight, d = num(o.dur, 0.55), B, p;
    if (kind === 'strike') { B = board(el, -6, 0, w + 12, h, c); p = stroke(B.svg, markPath(w + 12, h, 'strike', seedOf(c)), c); }
    else if (kind === 'bracket') { B = board(el, -46, -4, 40, h + 8, c); p = stroke(B.svg, markPath(40, h + 8, 'bracket', seedOf(c)), c); }
    else {
      var H = Math.max(26, Math.round(h * 0.32));
      B = board(el, -4, h - H * 0.45, w + 8, H * (kind === 'double' ? 1.8 : 1), c);
      p = stroke(B.svg, markPath(w + 8, H, 'underline', seedOf(c)), c);
      if (kind === 'double') { var q = stroke(B.svg, markPath(w + 8, H, 'underline', seedOf(c, 11)), c); q.setAttribute('transform', 'translate(0 ' + r1(H * 0.6) + ')'); drawOn(c.tl, q, c.t + d * 0.7, d * 0.8); }
    }
    drawOn(c.tl, p, c.t, d);
  });
  def('ink-box', CAT, '手画方框框住元素，可以在左上角贴一个标签。参数 label、pad（默认 14）、color、w、dur', function (c) {
    var el = c.el, o = c.o, pad = num(o.pad, 14), W = el.offsetWidth + pad * 2, H = el.offsetHeight + pad * 2, d = num(o.dur, 0.8);
    var B = board(el, -pad, -pad, W, H, c);
    var p = stroke(B.svg, wobbleRect(5, 5, W - 10, H - 10, Math.min(22, H / 4), seedOf(c), 3.5), c);
    drawOn(c.tl, p, c.t, d);
    if (o.label) pop(c.tl, label(B.wrap, String(o.label), c, 'tab'), c.t + d * 0.6);
  });
  def('ink-arrow', CAT, '从这个元素画一支手绘箭头指向另一个元素。参数 to=#目标（或 dx / dy 直接给偏移像素）、tx / ty（指向目标里的哪个位置，0–1；不写就指向目标边框上离起点最近的点）、curve=straight|gentle|swoop、side=1|-1（往哪边弯）、gap（离两头留多少空）、color、w、dur', function (c) {
    var el = c.el, o = c.o, host = el.offsetParent || el.parentNode, A = FX.rect(el), P = FX.rect(host), Bt = o.to ? FX.rect(String(o.to)) : null;
    if (!A || !P) return;
    // tx / ty：指向目标里的哪个位置（0–1，默认正中）。目标后面会变形（比如代码删了行）时，指向它上半部分更稳
    var tx = Bt ? Bt.x + Bt.w * num(o.tx, 0.5) : A.cx + num(o.dx, 300), ty = Bt ? Bt.y + Bt.h * num(o.ty, 0.5) : A.cy + num(o.dy, 0);
    // 两头各从元素的边框外面起笔 / 收笔
    var edge = function (R, px, py) {
      if (!R) return [px, py];
      var dx = px - R.cx, dy = py - R.cy, k = Math.min(Math.abs(dx) > 1e-3 ? (R.w / 2) / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-3 ? (R.h / 2) / Math.abs(dy) : 1e9);
      return [R.cx + dx * k, R.cy + dy * k];
    };
    // 收笔：从目标里的那个点 (tx, ty) 朝起点方向走，走出目标边框的地方
    var exit = function (R, px, py, qx, qy) {
      if (!R) return [px, py];
      var dx = qx - px, dy = qy - py, ts = [];
      if (Math.abs(dx) > 1e-6) ts.push(((dx > 0 ? R.x + R.w : R.x) - px) / dx);
      if (Math.abs(dy) > 1e-6) ts.push(((dy > 0 ? R.y + R.h : R.y) - py) / dy);
      var k = Math.max(0, Math.min.apply(null, ts.length ? ts : [0]));
      return [px + dx * k, py + dy * k];
    };
    // 没写 tx / ty：指向目标边框上离起点最近的那个点（最自然的指法）
    if (Bt && o.tx === undefined && o.ty === undefined) { tx = Math.max(Bt.x, Math.min(Bt.x + Bt.w, A.cx)); ty = Math.max(Bt.y, Math.min(Bt.y + Bt.h, A.cy)); }
    var p0 = edge(A, tx, ty), p1 = exit(Bt, tx, ty, A.cx, A.cy), gap = num(o.gap, 16), L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, ux = (p1[0] - p0[0]) / L, uy = (p1[1] - p0[1]) / L;
    p0 = [p0[0] + ux * gap, p0[1] + uy * gap]; p1 = [p1[0] - ux * gap * 1.2, p1[1] - uy * gap * 1.2]; L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    var seed = seedOf(c), bend = { straight: 0.05, gentle: 0.22, swoop: 0.42 }[o.curve || 'gentle'] || 0.22, side = num(o.side, uy > 0.3 ? 1 : -1), nx = -uy * side, ny = ux * side;
    var c1 = [p0[0] + ux * L * 0.33 + nx * L * bend + hash(5, seed) * 8, p0[1] + uy * L * 0.33 + ny * L * bend + hash(6, seed) * 8];
    var c2 = [p0[0] + ux * L * 0.7 + nx * L * bend * 0.8 + hash(7, seed) * 8, p0[1] + uy * L * 0.7 + ny * L * bend * 0.8 + hash(8, seed) * 8];
    var m = 50, x0 = Math.min(p0[0], p1[0], c1[0], c2[0]) - m, y0 = Math.min(p0[1], p1[1], c1[1], c2[1]) - m, x1 = Math.max(p0[0], p1[0], c1[0], c2[0]) + m, y1 = Math.max(p0[1], p1[1], c1[1], c2[1]) + m;
    var B = board(host, x0 - P.x, y0 - P.y, x1 - x0, y1 - y0, c), loc = function (q) { return r1(q[0] - x0) + ' ' + r1(q[1] - y0); };
    var shaft = stroke(B.svg, 'M ' + loc(p0) + ' C ' + loc(c1) + ', ' + loc(c2) + ', ' + loc(p1), c);
    var ang = Math.atan2(p1[1] - c2[1], p1[0] - c2[0]), hl = num(o.head, 30) + hash(9, seed) * 5;
    var head = function (da) { var a = ang + Math.PI + da; return 'M ' + loc(p1) + ' l ' + r1(Math.cos(a) * hl) + ' ' + r1(Math.sin(a) * hl); };
    var h1 = stroke(B.svg, head(0.5), c), h2 = stroke(B.svg, head(-0.5), c), d = num(o.dur, 0.6);
    drawOn(c.tl, shaft, c.t, d, 'power2.in');
    drawOn(c.tl, h1, c.t + d, 0.12, 'power1.out');
    drawOn(c.tl, h2, c.t + d + 0.08, 0.12, 'power1.out');
  });
  def('ink-mark', CAT, 'Vox 式批注：给句子里的一个词上马克笔，同时拉一根细线到一行注释。参数 word（要标的词，不写就标整个元素）、style=highlight|circle|underline|scribble、note（注释文字，不写就只画记号）、color、dur', function (c) {
    var el = c.el, o = c.o, word = o.word ? String(o.word) : '', span = null, style = o.style || 'highlight', d = num(o.dur, 0.6);
    if (word) {
      var walk = doc.createTreeWalker(el, 4, null), node;
      while ((node = walk.nextNode())) {
        var k = node.nodeValue.indexOf(word); if (k < 0) continue;
        var after = node.splitText(k); after.splitText(word.length);
        span = mk('span', 'fx-ink-word'); after.parentNode.insertBefore(span, after); span.appendChild(after);
        break;
      }
      if (!span) console.warn('FX：ink-mark 在这段文字里没找到「' + word + '」');
    }
    if (!span) { span = el; span.classList.add('fx-ink-word'); }
    var w = span.offsetWidth, h = span.offsetHeight, seed = seedOf(c), B, p;
    if (style === 'circle') { B = board(span, -16, -12, w + 32, h + 24, c); p = stroke(B.svg, wobbleEllipse((w + 32) / 2, (h + 24) / 2, (w + 32) / 2 - 5, (h + 24) / 2 - 5, seed, 3), c); }
    else if (style === 'underline') { var H = Math.max(24, h * 0.3); B = board(span, -4, h - H * 0.4, w + 8, H, c); p = stroke(B.svg, markPath(w + 8, H, 'underline', seed), c); }
    else if (style === 'scribble') { B = board(span, -4, h * 0.1, w + 8, h * 0.8, c); p = stroke(B.svg, markPath(w + 8, h * 0.8, 'scribble', seed), c, { opacity: 0.8 }); }
    else {
      B = board(span, -8, 0, w + 16, h, c, 'under');
      p = stroke(B.svg, 'M 2 ' + r1(h * 0.6 + hash(1, seed) * 3) + ' C ' + r1(w * 0.3) + ' ' + r1(h * 0.55 + hash(2, seed) * 4) + ', ' + r1(w * 0.7) + ' ' + r1(h * 0.5 + hash(3, seed) * 4) + ', ' + r1(w + 14) + ' ' + r1(h * 0.46 + hash(4, seed) * 3), c,
        { width: Math.round(h * 0.62), color: o.color || 'var(--fx-marker)' });
      p.setAttribute('stroke-linecap', 'butt');
    }
    drawOn(c.tl, p, c.t, d);
    c.tl.fromTo(span, { scale: 1 }, { scale: 1.06, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, c.t + d * 0.85);
    if (o.note) {
      // 细线从记号上方往右上拉出去，末端是一行注释
      var lx = w * 0.62, ly = -6, ex = w * 0.62 + num(o.nx, 90), ey = -num(o.ny, 78);
      var C = board(span, Math.min(lx, ex) - 20, ey - 20, Math.abs(ex - lx) + 40, ly - ey + 40, c);
      var ox = Math.min(lx, ex) - 20, oy = ey - 20;
      var line = stroke(C.svg, 'M ' + r1(lx - ox) + ' ' + r1(ly - oy) + ' Q ' + r1(lx - ox + hash(12, seed) * 6) + ' ' + r1((ly + ey) / 2 - oy) + ' ' + r1(ex - ox) + ' ' + r1(ey - oy), c, { width: 3.5 });
      drawOn(c.tl, line, c.t + 0.36, 0.45, 'power2.out');
      var s = label(span, String(o.note), c, 'note');
      s.style.left = r1(ex + 10) + 'px'; s.style.top = r1(ey - 24) + 'px';
      c.tl.set(s, { visibility: 'hidden' }, 0); c.tl.set(s, { visibility: 'inherit' }, c.t + 0.66);
      c.tl.fromTo(s, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, c.t + 0.66);
    }
  });

  /* 沸腾：画好的线每 0.1 秒换一次姿势（位置和角度的极小偏移），全部由时间线的秒数算出来，可以任意跳帧 */
  (FX.afterBuild = FX.afterBuild || []).push(function (tl) {
    if (!BOIL.length) return;
    var paint = function () {
      var t = tl.time(), step = Math.floor(t * 10);
      for (var i = 0; i < BOIL.length; i++) {
        var b = BOIL[i]; if (t < b.t0) continue;
        b.el.style.translate = r1(hash(step * 3 + i * 97, b.seed) * b.amp) + 'px ' + r1(hash(step * 3 + 1 + i * 97, b.seed) * b.amp) + 'px';
        b.el.style.rotate = (hash(step * 3 + 2 + i * 97, b.seed) * b.rot).toFixed(2) + 'deg';
      }
    };
    if (FX.onFrame) FX.onFrame(paint); paint();
  });
})(typeof window !== 'undefined' ? window : globalThis);
