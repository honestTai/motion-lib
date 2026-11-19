/* fx-shape.js — 形状变形、沿路径运动、摇摆（可选模块，用到 GSAP 的几个免费插件）
 *
 * GSAP 的 MorphSVG / MotionPath / CustomEase / CustomWiggle 现在免费（含商用），本库在 vendor/gsap-plugins/ 里带了和核心同版本（3.15.0）的文件。
 * 用之前先加载它们，再加载本模块：
 *
 *   <script src="lib/vendor/gsap-plugins/MorphSVGPlugin.min.js"></script>
 *   <script src="lib/vendor/gsap-plugins/MotionPathPlugin.min.js"></script>
 *   <script src="lib/vendor/gsap-plugins/CustomEase.min.js"></script>
 *   <script src="lib/vendor/gsap-plugins/CustomWiggle.min.js"></script>
 *   <script src="lib/fx-shape.js"></script>
 *
 *   <div data-make="shape" data-shape="cross" data-color="#ff5a52" style="width:220px;height:220px"></div>
 *     shape-morph@t(to=check,color=#3ddc84)    ✗ 平滑变成 ✓（还有 circle square triangle star heart bolt arrow-up arrow-down play bulb）
 *   <svg …><path id="route" d="…"/></svg>  <img data-fx="path-move@t(path=#route,dur=2)">   沿一条路径飞过去，车头跟着路转
 *   wiggle@t(n=6)                            有弹性的摇摆（比 shake 柔和，像被点名时晃一下）
 *
 * 形状都是本库自己画的（24×24 网格）。GSAP 插件遵循 GreenSock Standard License（https://gsap.com/standard-license），见 NOTICE。
 */
(function (g) {
  'use strict';
  var FX = g.FX; if (!FX || !FX.register) return;
  var doc = g.document;
  var num = function (v, d) { v = parseFloat(v); return isFinite(v) ? v : d; };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var def = FX.register, CAT = '形状';
  var gs = function () { return g.gsap; };
  var plugins = ['MorphSVGPlugin', 'MotionPathPlugin', 'CustomEase', 'CustomWiggle'].filter(function (k) { return g[k]; });
  if (g.gsap && plugins.length) g.gsap.registerPlugin.apply(g.gsap, plugins.map(function (k) { return g[k]; }));
  var need = function (k, name) { if (!g[k]) { console.warn('FX：' + name + ' 需要先加载 lib/vendor/gsap-plugins/' + k + '.min.js'); return false; } return true; };

  /** 内置形状：24×24 网格里的实心图形，都画成「一整块」，变形时才会平滑 */
  var SHAPES = {
    check: 'M3.2 12.6 L6 9.8 L9.6 13.4 L18 5 L20.8 7.8 L9.6 19 Z',
    cross: 'M5.6 3.4 L12 9.8 L18.4 3.4 L20.6 5.6 L14.2 12 L20.6 18.4 L18.4 20.6 L12 14.2 L5.6 20.6 L3.4 18.4 L9.8 12 L3.4 5.6 Z',
    circle: 'M12 3 C17 3 21 7 21 12 C21 17 17 21 12 21 C7 21 3 17 3 12 C3 7 7 3 12 3 Z',
    square: 'M6 3.5 L18 3.5 C19.4 3.5 20.5 4.6 20.5 6 L20.5 18 C20.5 19.4 19.4 20.5 18 20.5 L6 20.5 C4.6 20.5 3.5 19.4 3.5 18 L3.5 6 C3.5 4.6 4.6 3.5 6 3.5 Z',
    triangle: 'M12 3.2 L21.4 19.8 L2.6 19.8 Z',
    star: 'M12 2.6 L14.7 8.8 L21.4 9.4 L16.3 13.8 L17.9 20.4 L12 16.9 L6.1 20.4 L7.7 13.8 L2.6 9.4 L9.3 8.8 Z',
    heart: 'M12 20.6 C8 17.6 2.8 13.9 2.8 9 C2.8 6.1 5 4 7.6 4 C9.4 4 11 5 12 6.6 C13 5 14.6 4 16.4 4 C19 4 21.2 6.1 21.2 9 C21.2 13.9 16 17.6 12 20.6 Z',
    bolt: 'M13.6 2.4 L4.8 13.6 L10.8 13.6 L9.6 21.6 L19.2 9.8 L13 9.8 Z',
    'arrow-up': 'M12 2.8 L20.4 11.4 L15 11.4 L15 21 L9 21 L9 11.4 L3.6 11.4 Z',
    'arrow-down': 'M12 21.2 L3.6 12.6 L9 12.6 L9 3 L15 3 L15 12.6 L20.4 12.6 Z',
    play: 'M6.5 3.6 L20 12 L6.5 20.4 Z',
    bulb: 'M12 2.6 C16.2 2.6 19 5.6 19 9.4 C19 12 17.6 13.6 16.2 15 L16.2 17.6 L7.8 17.6 L7.8 15 C6.4 13.6 5 12 5 9.4 C5 5.6 7.8 2.6 12 2.6 Z M8.6 18.8 L15.4 18.8 L15.4 20.2 C15.4 20.9 14.8 21.4 14.2 21.4 L9.8 21.4 C9.2 21.4 8.6 20.9 8.6 20.2 Z'
  };
  FX.shapes = SHAPES;
  var WIGGLES = {};

  FX.make.shape = function (el) {
    el.classList.add('fx-shape');
    var name = attr(el, 'shape', 'circle'), d = SHAPES[name] || name;
    el.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="' + d + '"/></svg>';
    var p = el.querySelector('path'); p.style.fill = attr(el, 'color', 'var(--fx-accent)');
  };
  def('shape-morph', CAT, '图形平滑变成另一个图形（✗ 变 ✓、圆变星……），可同时换颜色。写在 data-make="shape" 上，或任何含一个 <path> 的 svg 上。参数 to（内置形状名：check cross circle square triangle star heart bolt arrow-up arrow-down play bulb，或 #另一个路径的 id）、color、dur（默认 0.6）。需要 MorphSVGPlugin', function (c) {
    if (!need('MorphSVGPlugin', 'shape-morph')) return;
    var p = c.el.tagName.toLowerCase() === 'path' ? c.el : c.el.querySelector('path'); if (!p) return;
    var to = String(c.o.to || 'check'), shape = SHAPES[to] || to, vars = { morphSVG: { shape: shape, type: 'rotational' }, duration: num(c.o.dur, 0.6), ease: c.o.ease || 'power3.inOut' };
    if (c.o.color) vars.fill = c.o.color;
    c.tl.to(p, vars, c.t);
    c.tl.fromTo(c.el, { scale: 1 }, { scale: 1.12, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, c.t + num(c.o.dur, 0.6) * 0.7);
  });
  def('path-move', CAT, '沿一条 SVG 路径运动，朝向跟着路径转（纸飞机、数据包、快递路线）。写在要动的元素上。参数 path=#路径的 id（必填）、dur（默认 1.6）、rotate=0（不转向）、draw=1（同时把路径画出来）、from / to（走路径的哪一段，0–1）。需要 MotionPathPlugin', function (c) {
    if (!need('MotionPathPlugin', 'path-move') || !c.o.path) return;
    var path = doc.querySelector(String(c.o.path)); if (!path) { console.warn('FX：path-move 找不到路径 ' + c.o.path); return; }
    var d = num(c.o.dur, 1.6);
    var mp = function (end) { return { path: path, align: path, alignOrigin: [0.5, 0.5], autoRotate: String(c.o.rotate) !== '0', start: num(c.o.from, 0), end: end }; };
    gs().set(c.el, { motionPath: mp(num(c.o.from, 0)) });          // 开始前先停在路径起点
    c.tl.to(c.el, { motionPath: mp(num(c.o.to, 1)), duration: d, ease: c.o.ease || 'power1.inOut', immediateRender: false }, c.t);
    if (String(c.o.draw) === '1' && path.getTotalLength) {
      var L = path.getTotalLength(); path.style.strokeDasharray = L + ' ' + (L + 4); path.style.strokeDashoffset = L;
      c.tl.fromTo(path, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: d, ease: c.o.ease || 'power1.inOut', immediateRender: false }, c.t);
    }
    c.o.dur = d;
  });
  def('wiggle', CAT, '有弹性的摇摆：左右晃几下慢慢停住（被点名、被吐槽、出错时晃一下）。参数 n（晃几下，默认 6）、amp（角度，默认 8）、dur（默认 0.8）、prop=rotation|x。需要 CustomEase + CustomWiggle', function (c) {
    if (!need('CustomWiggle', 'wiggle') || !g.CustomWiggle.create) return;
    var n = Math.max(2, Math.round(num(c.o.n, 6))), key = 'fxw' + n, prop = c.o.prop === 'x' ? 'x' : 'rotation';
    if (!WIGGLES[key]) { g.CustomWiggle.create(key, { wiggles: n, type: 'easeOut' }); WIGGLES[key] = 1; }   // easeOut 是确定的；random 类型每次加载都不一样，不能用
    var v = {}; v[prop] = num(c.o.amp, prop === 'x' ? 14 : 8); v.duration = num(c.o.dur, 0.8); v.ease = key; v.immediateRender = false;
    var from = {}; from[prop] = 0;
    c.tl.fromTo(c.els, from, v, c.t);
  });
})(typeof window !== 'undefined' ? window : globalThis);
