/* fx-diagram.js — 图解：包围、压力、中心辐射（可选模块，加载在 fx.js 之后）
 *
 *   <div data-make="surround" data-center="你" data-chips="文档,工单,群消息,日报,会议,表格"
 *        style="left:460px;top:200px;width:1000px;height:600px"></div>
 *     surround-in@t(close=1)   中心先落定，标签一个个围上来；close=1 再一起往里收、四周压暗（被包围了）
 *     overwhelm@t(n=16)        一大堆标签从四面八方加速涌进来，挤在中心周围（信息过载、事情太多）
 *
 *   <div data-make="hub" data-center="Claude" data-nodes="写代码,读文档,做表格,画图" style="…"></div>
 *     hub-node@t(i=1)          第 1 个节点：连线从中心画出去，节点亮起来（念到哪个点哪个）
 *
 * 中心永远不动，动的是周围的东西。环形排布、入场节奏、涌入的加速度曲线参考了 HyperFrames 组件库（Apache-2.0）的
 * radial-surround / overwhelm-surround / constellation-hub，代码是重新写的。
 */
(function (g) {
  'use strict';
  var FX = g.FX; if (!FX || !FX.register) return;
  var doc = g.document;
  var num = function (v, d) { v = parseFloat(v); return isFinite(v) ? v : d; };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var mk = function (tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  var list = function (s) { return String(s || '').split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var def = FX.register, CAT = '图解';
  function showAt(tl, el, t) { tl.set(el, { visibility: 'hidden' }, 0); tl.set(el, { visibility: 'inherit' }, t); }
  function box(el) { return { W: el.offsetWidth || 1000, H: el.offsetHeight || 600 }; }
  // 用 xPercent / yPercent 居中（不用 CSS 的 translate）：后面的位移、缩放动效不会把居中冲掉
  var center = function (e) { if (g.gsap) g.gsap.set(e, { xPercent: -50, yPercent: -50 }); return e; };

  /* ═════════════════════════ 包围 ═════════════════════════ */
  FX.make.surround = function (el) {
    el.classList.add('fx-surround');
    var chips = list(attr(el, 'chips', '')).slice(0, 12), n = chips.length;
    el.innerHTML = '';
    el.appendChild(mk('div', 'fx-sur-dim'));
    el.appendChild(center(mk('div', 'fx-sur-center', attr(el, 'center', ''))));
    chips.forEach(function (label, i) {
      var a = -Math.PI / 2 + Math.PI * 2 * i / n, ch = mk('div', 'fx-chip', label);
      ch.style.left = (50 + Math.cos(a) * 40).toFixed(2) + '%'; ch.style.top = (50 + Math.sin(a) * 38).toFixed(2) + '%';
      ch.__a = a; el.appendChild(center(ch));
    });
  };
  def('surround-in', CAT, '中心先落定，周围的标签一个个围上来；close=1 时再一起往里收、四周压暗。写在 data-make="surround" 上。参数 gap（标签之间隔几秒，默认 0.3）、close=1', function (c) {
    var el = c.el, mid = el.querySelector('.fx-sur-center'), chips = el.querySelectorAll('.fx-chip:not(.pile)'), gap = num(c.o.gap, 0.3), t = c.t;
    el.__surIn = true;
    if (mid) { c.tl.set(mid, { opacity: 0 }, 0); c.tl.fromTo(mid, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, t); }
    Array.prototype.forEach.call(chips, function (ch, i) {
      var at = t + 0.35 + i * gap;
      showAt(c.tl, ch, at);
      c.tl.fromTo(ch, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out', immediateRender: false }, at);
    });
    var end = t + 0.35 + (chips.length - 1) * gap + 0.5;
    if (String(c.o.close) === '1') {
      Array.prototype.forEach.call(chips, function (ch) {
        c.tl.to(ch, { left: (50 + Math.cos(ch.__a) * 29).toFixed(2) + '%', top: (50 + Math.sin(ch.__a) * 27).toFixed(2) + '%', duration: 0.9, ease: 'power2.inOut' }, end + 0.2);
      });
      c.tl.to(el.querySelector('.fx-sur-dim'), { opacity: 1, duration: 0.9, ease: 'power2.inOut' }, end + 0.2);
      end += 1.1;
    }
    c.o.__n = chips.length; c.o.__st = gap; c.o.dur = end - t;
  });
  def('overwhelm', CAT, '一大堆标签从四面八方加速涌进来，挤在不动的中心周围（信息过载、事情太多）。写在 data-make="surround" 上（标签文字从 data-chips 里循环取）。参数 n（个数，8–24，默认 16）、intensity（压力，0.5–2，越大挤得越近越快）、dur（涌入用多久，默认 2.2）', function (c) {
    var el = c.el, labels = list(attr(el, 'pile', '') || attr(el, 'chips', '')) , n = Math.round(Math.max(8, Math.min(24, num(c.o.n, 16)))), inten = Math.max(0.5, Math.min(2, num(c.o.intensity, 1)));
    if (!labels.length) labels = ['消息', '待办', '会议', '邮件'];
    var B = box(el), IN = num(c.o.dur, 2.2), travel = Math.min(IN, 0.54 / Math.sqrt(inten)), span = Math.max(0, IN - travel), power = 1.7 + inten * 0.45, pressure = (inten - 0.5) / 1.5;
    // 只写了 overwhelm 没写 surround-in 时，data-chips 那一圈固定标签不出现，只用来给涌进来的标签取名字
    if (!el.__surIn) Array.prototype.forEach.call(el.querySelectorAll('.fx-chip:not(.pile)'), function (ch) { c.tl.set(ch, { visibility: 'hidden' }, 0); });
    var mid = el.querySelector('.fx-sur-center');
    if (mid) { c.tl.set(mid, { opacity: 0 }, 0); c.tl.fromTo(mid, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out', immediateRender: false }, c.t); }
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + Math.PI * 2 * i / n, dx = Math.cos(a), dy = Math.sin(a), edge = 0.64 / Math.max(Math.abs(dx), Math.abs(dy));
      var band = ((i * 5) % 7) / 6, rx = (27 + band * 9 - pressure * (12 + band * 6)) / 100, ry = (25 + band * 10 - pressure * (11 + band * 6)) / 100;
      var at = c.t + span * (1 - Math.pow(1 - i / (n - 1), power)), rot = ((i * 29) % 17) - 8;
      var ch = mk('div', 'fx-chip pile', labels[i % labels.length]); ch.setAttribute('data-lint', 'off');   // 涌进来的这一堆就是「多到读不完」，自检不算字数
       ch.style.left = '50%'; ch.style.top = '50%'; el.appendChild(center(ch));
      showAt(c.tl, ch, at);
      c.tl.fromTo(ch, { x: dx * edge * B.W, y: dy * edge * B.H, xPercent: -50, yPercent: -50, scale: 0.94, opacity: 0, rotation: rot * 1.8 },
        { x: dx * rx * B.W, y: dy * ry * B.H, scale: 1, opacity: 1, rotation: rot, duration: travel, ease: 'power2.out', immediateRender: false }, at);
    }
    c.o.dur = IN;
  });

  /* ═════════════════════════ 中心辐射 ═════════════════════════ */
  FX.make.hub = function (el) {
    el.classList.add('fx-hub');
    var nodes = list(attr(el, 'nodes', '')), n = nodes.length, B = box(el);
    el.innerHTML = '';
    var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + B.W + ' ' + B.H); svg.setAttribute('width', B.W); svg.setAttribute('height', B.H); svg.setAttribute('class', 'fx-hub-lines');
    el.appendChild(svg);
    el.appendChild(center(mk('div', 'fx-hub-center', attr(el, 'center', ''))));
    nodes.forEach(function (label, i) {
      var a = -Math.PI / 2 + Math.PI * 2 * i / n, x = 50 + Math.cos(a) * 38, y = 50 + Math.sin(a) * 39;
      var nd = mk('div', 'fx-hub-node', label); nd.style.left = x.toFixed(2) + '%'; nd.style.top = y.toFixed(2) + '%'; el.appendChild(center(nd));
      var ln = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', B.W / 2); ln.setAttribute('y1', B.H / 2); ln.setAttribute('x2', (x / 100 * B.W).toFixed(1)); ln.setAttribute('y2', (y / 100 * B.H).toFixed(1));
      svg.appendChild(ln);
    });
  };
  def('hub-node', CAT, '中心辐射图的第 i 个节点：连线从中心画出去，节点弹亮。写在 data-make="hub" 上，念到哪个写哪个。参数 i（从 1 数）', function (c) {
    var el = c.el, i = num(c.o.i, 1), nd = el.querySelectorAll('.fx-hub-node')[i - 1], ln = el.querySelectorAll('.fx-hub-lines line')[i - 1];
    if (!nd || !ln) { console.warn('FX：hub-node 没有第 ' + i + ' 个节点'); return; }
    var L = Math.hypot(ln.getAttribute('x2') - ln.getAttribute('x1'), ln.getAttribute('y2') - ln.getAttribute('y1'));
    ln.style.strokeDasharray = L; ln.style.strokeDashoffset = L;
    c.tl.fromTo(ln, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, c.t);
    showAt(c.tl, nd, c.t + 0.3);
    c.tl.fromTo(nd, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1.055, duration: 0.3, ease: 'power3.out', immediateRender: false }, c.t + 0.3);
    c.tl.to(nd, { scale: 1, duration: 0.2, ease: 'power2.out' }, c.t + 0.6);
  });
})(typeof window !== 'undefined' ? window : globalThis);
