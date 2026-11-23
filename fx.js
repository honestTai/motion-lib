/*!
 * FX 动效库 v2.3  ——  给「HTML → 视频」用的声明式动效库
 * 依赖：GSAP 3（vendor/gsap.min.js）。渲染器：HyperFrames，或任何逐帧 seek 时间线的工具。
 *
 * 用法一句话：在元素上写 data-fx="动效名@秒数(参数)"，最后调用 FX.build()。
 *
 *   <div class="scene" data-t="0" data-d="4">
 *     <h1 data-fx="blur-rise-in@0.2">标题</h1>
 *     <b  data-fx="count@0.6(to=7000) marker@2.0">0</b>
 *     <ul data-fx="each:rise-in@1.0(stagger=0.08)"> <li>…</li><li>…</li> </ul>
 *   </div>
 *   <script> FX.build(); </script>
 *
 * 为什么所有动效都挂在一条暂停的时间线上：渲染器是「跳到第 N 帧 → 截图」，
 * CSS animation / setTimeout / Math.random 不受它控制，渲出来要么不动要么每次不一样。
 */
(function (g) {
  'use strict';
  var gsap = g.gsap;
  if (!gsap) { throw new Error('FX：请先加载 gsap.min.js'); }

  var FX = (g.FX = { version: '1.3.0', fx: {}, trans: {}, make: {}, catalog: [] });

  /* ───────────────────────────── 工具 ───────────────────────────── */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /** 可复现的随机数：同一个 seed 永远得到同一串数（渲染时禁用 Math.random） */
  FX.rand = function (seed) {
    var a = (seed || 1) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** 缓动别名：写 ease=out / spring / snap … 也可以直接写 GSAP 原名（power4.out、steps(5)） */
  var EASES = (FX.eases = {
    out: 'power3.out',        // 急起缓停（默认入场）
    soft: 'power2.out',       // 柔和
    snap: 'expo.out',         // 极快冲到位，再慢慢停稳
    sharp: 'power4.out',
    inout: 'power3.inOut',    // 两头慢中间快（镜头运动、位移）
    in: 'power2.in',          // 越来越快（退场）
    spring: 'back.out(1.7)',  // 轻微过冲回弹
    bounce: 'back.out(2.8)',  // 明显过冲
    elastic: 'elastic.out(1,0.55)',
    drop: 'bounce.out',       // 落地弹跳
    linear: 'none',
    pixel: 'steps(5)'         // 阶梯式（像素风的「掉帧感」）
  });
  var EZ = function (e, d) { return EASES[e] || e || EASES[d] || d || 'power3.out'; };

  /* ───────────────────── data-fx 语法解析 ─────────────────────
   *  "each:rise-in@0.4(stagger=0.08,dist=60) marker@1.8 fade-out@-0.4"
   *   └目标修饰┘└动效名┘└时间┘└────参数────┘
   *  时间： @1.2  距离所在场景开头 1.2 秒
   *         @+0.3 比同场景里上一个动效晚 0.3 秒
   *         @-0.4 场景结束前 0.4 秒
   *  目标修饰： each: 作用到每个子元素   chars: 拆成单字   words: 拆成词   lines: 按 <br> 拆行
   */
  function tokenize(str) {
    var out = [], cur = '', depth = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if ((ch === ' ' || ch === ';' || ch === '\n' || ch === '\t') && depth === 0) {
        if (cur) out.push(cur);
        cur = '';
      } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }
  function splitTop(str, sep) {
    var out = [], cur = '', depth = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }
  function parseOpts(s) {
    var o = {};
    if (!s) return o;
    splitTop(s, ',').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i < 0) { o[kv.trim()] = true; return; }
      var k = kv.slice(0, i).trim(), v = kv.slice(i + 1).trim();
      o[k] = v !== '' && !isNaN(+v) ? +v : v;
    });
    return o;
  }
  function parseFx(str) {
    return tokenize(str || '').map(function (tok) {
      var m = /^(?:(each|chars|words|lines):)?([a-zA-Z0-9-]+)(?:@([+-]?[\d.]+))?(?:\((.*)\))?$/.exec(tok);
      if (!m) { console.warn('FX：看不懂这段 data-fx →', tok); return null; }
      return { mod: m[1] || '', name: m[2], time: m[3], opts: parseOpts(m[4]) };
    }).filter(Boolean);
  }
  FX.parse = parseFx;

  /* ───────────────────────── 文字拆分 ───────────────────────── */

  function splitChars(el) {
    if (el.__fxChars) return el.__fxChars;
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function (c) {
            if (c === '\n') { frag.appendChild(document.createElement('br')); return; }
            var s = document.createElement('span');
            s.className = 'fx-ch';
            s.textContent = c === ' ' ? ' ' : c;
            frag.appendChild(s);
            out.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
    el.__fxChars = out;
    return out;
  }
  function splitWords(el) {
    if (el.__fxWords) return el.__fxWords;
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) { if (n.nodeType === 1 && n.tagName !== 'BR') out.push(n); return; }
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span');
        s.className = 'fx-ch';
        s.textContent = w;
        frag.appendChild(s);
        out.push(s);
      });
      el.replaceChild(frag, n);
    });
    el.__fxWords = out;
    return out;
  }
  function splitLines(el) {
    if (el.__fxLines) return el.__fxLines;
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) { return '<span class="fx-line"><span class="fx-line-in">' + p + '</span></span>'; }).join('');
    el.__fxLines = $$('.fx-line-in', el);
    return el.__fxLines;
  }
  FX.split = { chars: splitChars, words: splitWords, lines: splitLines };

  /* ───────────────────────── 位置测量 ─────────────────────────
   * 动效一挂上，元素就处在「入场前」的偏移状态，量出来的位置是错的。
   * 所以 build 第一步先把所有元素的自然位置量好存起来，之后都从这里取。 */
  var RECT = new WeakMap(), STAGE = null, STAGE_SCALE = 1;
  function measure(el) {
    var s = STAGE.getBoundingClientRect(), r = el.getBoundingClientRect(), k = STAGE_SCALE;
    return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k,
             cx: (r.left - s.left + r.width / 2) / k, cy: (r.top - s.top + r.height / 2) / k };
  }
  FX.rect = function (el) {
    if (typeof el === 'string') el = $(el);
    if (!el) return null;
    if (!RECT.has(el)) RECT.set(el, measure(el));
    return RECT.get(el);
  };

  /* ───────────────────────── 注册动效 ─────────────────────────
   * fn(c)：c.tl 时间线  c.els 目标元素数组  c.el 写 data-fx 的那个元素
   *        c.t 绝对秒数  c.o 参数  c.scene 所在场景 */
  function def(name, cat, desc, fn, extra) {
    FX.fx[name] = fn;
    FX.catalog.push(Object.assign({ name: name, cat: cat, desc: desc }, extra || {}));
  }
  FX.register = def;

  function stag(c, d) {
    if (c.els.length < 2) return 0;
    var each = num(c.o.stagger, d);
    var from = c.o.order || 'start';           // start | end | center | edges
    return from === 'start' ? each : { each: each, from: from };
  }
  /** 入场通用：从 from 状态回到元素本来的样子（所以元素自己的 CSS transform 会被保留） */
  function enter(c, from, d) {
    d = d || {};
    var o = c.o, v = {}, blur = 0;
    Object.keys(from).forEach(function (k) { if (k === 'blur') blur = from[k]; else v[k] = from[k]; });
    v.duration = num(o.dur, d.dur || 0.6);
    v.ease = EZ(o.ease, d.ease || 'out');
    v.stagger = stag(c, d.stagger === undefined ? 0.07 : d.stagger);
    c.tl.from(c.els, v, c.t);
    if (blur) {
      c.tl.fromTo(c.els, { filter: 'blur(' + blur + 'px)' },
        { filter: 'blur(0px)', duration: v.duration * 0.85, ease: 'power2.out', stagger: v.stagger }, c.t);
    }
  }
  /** 退场 / 强调通用：从当前状态到 to 状态 */
  function leave(c, to, d) {
    d = d || {};
    var o = c.o, v = Object.assign({}, to);
    v.duration = num(o.dur, d.dur || 0.4);
    v.ease = EZ(o.ease, d.ease || 'in');
    v.stagger = stag(c, d.stagger === undefined ? 0.04 : d.stagger);
    c.tl.to(c.els, v, c.t);
  }
  var rel = function (n) { return (n >= 0 ? '+=' : '-=') + Math.abs(n); };
  var DIR = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] };  // 「向上滑入」= 从下方来

  /* ═════════════════════════ 1. 入场 ═════════════════════════ */

  def('fade-in', '入场', '纯淡入，最克制；用于字幕、次要说明', function (c) {
    enter(c, { opacity: 0 }, { dur: 0.4, ease: 'soft' });
  });
  def('rise-in', '入场', '从下方上滑 + 淡入，最通用的入场。参数 dist=位移像素', function (c) {
    enter(c, { opacity: 0, y: rel(num(c.o.dist, 40)) }, { dur: 0.6 });
  });
  def('drop-in', '入场', '从上方落下 + 淡入，用于标签、角标', function (c) {
    enter(c, { opacity: 0, y: rel(-num(c.o.dist, 40)) }, { dur: 0.6 });
  });
  def('slide-in', '入场', '从一侧滑入。参数 dir=left|right|up|down（朝哪个方向运动）、dist', function (c) {
    var d = DIR[c.o.dir || 'left'] || DIR.left, n = num(c.o.dist, 120);
    enter(c, { opacity: 0, x: rel(d[0] * n), y: rel(d[1] * n) }, { dur: 0.7, ease: 'snap' });
  });
  def('blur-in', '入场', '由模糊到清晰，原地显现；用于大标题、截图卡片', function (c) {
    enter(c, { opacity: 0, blur: num(c.o.blur, 18) }, { dur: 0.7, ease: 'soft' });
  });
  def('blur-rise-in', '入场', '模糊 + 上滑 + 淡入，电影感标题的标准入场', function (c) {
    enter(c, { opacity: 0, y: rel(num(c.o.dist, 36)), blur: num(c.o.blur, 16) }, { dur: 0.8 });
  });
  def('scale-in', '入场', '从略小放大到位，卡片 / 图片的标准入场。参数 from=起始缩放', function (c) {
    enter(c, { opacity: 0, scale: num(c.o.from, 0.88) }, { dur: 0.6 });
  });
  def('pop-in', '入场', '弹出：从小放大并过冲回弹，用于标注胶囊、图标、勾叉', function (c) {
    enter(c, { opacity: 0, scale: num(c.o.from, 0.5) }, { dur: 0.5, ease: 'spring' });
  });
  def('zoom-settle', '入场', '从放大的模糊状态收回到位（镜头「对上焦」的感觉），用于开场大字', function (c) {
    enter(c, { opacity: 0, scale: num(c.o.from, 1.28), blur: num(c.o.blur, 14) }, { dur: 0.9, ease: 'snap' });
  });
  def('wipe-in', '入场', '遮罩擦除显现。参数 dir=right|left|up|down（擦除推进方向）', function (c) {
    var dir = c.o.dir || 'right';
    var from = { right: 'inset(0% 100% 0% 0%)', left: 'inset(0% 0% 0% 100%)', down: 'inset(0% 0% 100% 0%)', up: 'inset(100% 0% 0% 0%)' }[dir];
    c.tl.fromTo(c.els, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: num(c.o.dur, 0.7),
      ease: EZ(c.o.ease, 'inout'), stagger: stag(c, 0.08) }, c.t);
  });
  def('mask-rise', '入场', '文字从一条看不见的基线下面升上来（遮罩上滑），标题感最强', function (c) {
    var inner = c.els.map(function (el) {
      if (el.classList.contains('fx-line-in')) return el;
      if (!el.__fxMask) {
        el.innerHTML = '<span class="fx-line"><span class="fx-line-in">' + el.innerHTML + '</span></span>';
        el.__fxMask = $('.fx-line-in', el);
      }
      return el.__fxMask;
    });
    c.tl.from(inner, { yPercent: 115, duration: num(c.o.dur, 0.8), ease: EZ(c.o.ease, 'snap'), stagger: stag(c, 0.09) }, c.t);
  });
  def('flip-in', '入场', '沿水平轴翻转立起（3D），用于卡片翻牌、问号卡揭晓', function (c) {
    gsap.set(c.els, { transformPerspective: 900, transformOrigin: c.o.origin || '50% 100%' });
    enter(c, { opacity: 0, rotationX: num(c.o.deg, -75) }, { dur: 0.7, ease: 'spring' });
  });
  def('tilt-in', '入场', '带透视的倾斜飞入（3D 卡片从侧面转正），用于界面截图', function (c) {
    gsap.set(c.els, { transformPerspective: 1400 });
    enter(c, { opacity: 0, rotationY: num(c.o.ry, 38), rotationX: num(c.o.rx, 8), x: rel(num(c.o.dist, 160)), scale: 0.9 }, { dur: 0.9, ease: 'snap' });
  });
  def('stamp-in', '入场', '盖章：从很大砸下来，落定时抖一下；用于结论、印章、勾叉', function (c) {
    var d = num(c.o.dur, 0.32);
    c.tl.from(c.els, { opacity: 0, scale: num(c.o.from, 2.6), duration: d, ease: 'power4.in', stagger: stag(c, 0.1) }, c.t);
    c.tl.to(c.els, { keyframes: [{ x: '-=7', duration: 0.04 }, { x: '+=13', duration: 0.05 }, { x: '-=9', duration: 0.05 }, { x: '+=3', duration: 0.06 }],
      ease: 'none', stagger: stag(c, 0.1) }, c.t + d);
  });
  def('drop-bounce', '入场', '从画面上方掉下来，落地弹两下；用于物件堆叠、像素方块', function (c) {
    enter(c, { y: rel(-num(c.o.dist, 420)), opacity: 0 }, { dur: 0.8, ease: 'drop', stagger: 0.09 });
  });
  def('swing-in', '入场', '像挂牌一样从上沿甩下来摆正', function (c) {
    gsap.set(c.els, { transformOrigin: '50% 0%' });
    enter(c, { opacity: 0, rotation: num(c.o.deg, -28) }, { dur: 1.0, ease: 'elastic' });
  });
  def('focus-in', '入场', '字间距从很宽收拢 + 模糊变清晰，英文小标题 / 副标题常用', function (c) {
    enter(c, { opacity: 0, letterSpacing: c.o.from || '0.6em', blur: 8 }, { dur: 0.9, ease: 'snap' });
  });
  def('grow-x', '入场', '沿横向从 0 长出来（条形图、分隔线、进度条）。参数 origin=left|center|right', function (c) {
    gsap.set(c.els, { transformOrigin: (c.o.origin || 'left') + ' center' });
    enter(c, { scaleX: 0 }, { dur: 0.8, ease: 'snap', stagger: 0.06 });
  });
  def('grow-y', '入场', '沿纵向从 0 长出来（柱状图）。参数 origin=bottom|top', function (c) {
    gsap.set(c.els, { transformOrigin: 'center ' + (c.o.origin || 'bottom') });
    enter(c, { scaleY: 0 }, { dur: 0.8, ease: 'snap', stagger: 0.025 });
  });
  def('fan-in', '入场', '一叠卡片从中心摊开到各自位置（配 each: 使用），卡片最终位置和角度照 CSS 写', function (c) {
    var box = FX.rect(c.el);
    c.els.forEach(function (el, i) {
      var r = FX.rect(el);
      c.tl.from(el, { x: rel(box.cx - r.cx), y: rel(box.cy - r.cy + 30), rotation: 0, scale: 0.72, opacity: 0,
        duration: num(c.o.dur, 0.8), ease: EZ(c.o.ease, 'snap') }, c.t + i * num(c.o.stagger, 0.05));
    });
  });
  def('type', '入场', '打字机：逐字敲出。参数 cps=每秒字数、caret=1 显示光标', function (c) {
    c.els.forEach(function (el) {
      var chars = splitChars(el), n = chars.length, p = { i: 0 }, caret = null;
      if (c.o.caret) { caret = document.createElement('span'); caret.className = 'fx-caret'; el.appendChild(caret); }
      var paint = function () {
        var k = Math.round(p.i);
        chars.forEach(function (s, i) { s.style.visibility = i < k ? 'visible' : 'hidden'; });
        if (caret) {                                   // 光标跟着最后一个已敲出的字走
          var ref = k < n ? chars[k] : null;
          if (ref && caret.nextSibling !== ref) ref.parentNode.insertBefore(caret, ref);
          else if (!ref && el.lastChild !== caret) el.appendChild(caret);
          caret.style.visibility = k === 0 && !c.o.caretStart ? 'hidden' : 'visible';
        }
      };
      paint();
      var dur = num(c.o.dur, n / num(c.o.cps, 18));
      c.tl.to(p, { i: n, duration: dur, ease: 'none', onUpdate: paint }, c.t);
    });
  });
  def('draw', '入场', '描线：SVG 线条沿路径画出来（连线、箭头、圈注、折线图）', function (c) {
    var shapes = [];
    c.els.forEach(function (el) {
      if (el.tagName.toLowerCase() === 'svg') shapes = shapes.concat($$('path,line,polyline,rect,circle,ellipse', el).filter(function (s) { return !s.hasAttribute('data-nodraw'); }));
      else shapes.push(el);
    });
    shapes.forEach(function (s, i) {
      var len = s.getTotalLength ? s.getTotalLength() : 1000;
      c.tl.fromTo(s, { strokeDasharray: len + ' ' + len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: num(c.o.dur, 0.9), ease: EZ(c.o.ease, 'inout') }, c.t + i * num(c.o.stagger, 0.12));
    });
  });
  def('pixel-in', '入场', '像素风入场：分 4~5 档跳着出现（不是平滑的），配 each: 可做方块拼字', function (c) {
    var els = c.els;
    if (c.o.order === 'random') {            // 用种子打乱，保证每次渲染顺序一样
      var r = FX.rand(num(c.o.seed, 7));
      els = els.map(function (e) { return [r(), e]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
    }
    c.tl.from(els, { opacity: 0, scale: num(c.o.from, 0.2), y: rel(num(c.o.dist, 0)), duration: num(c.o.dur, 0.3),
      ease: c.o.ease ? EZ(c.o.ease) : 'steps(4)', stagger: els.length > 1 ? num(c.o.stagger, 0.02) : 0 }, c.t);
  });

  /* ═════════════════════════ 2. 退场 ═════════════════════════ */

  def('fade-out', '退场', '淡出', function (c) { leave(c, { opacity: 0 }, { dur: 0.3, ease: 'soft' }); });
  def('rise-out', '退场', '向上滑走 + 淡出', function (c) { leave(c, { opacity: 0, y: rel(-num(c.o.dist, 40)) }); });
  def('drop-out', '退场', '向下滑走 + 淡出', function (c) { leave(c, { opacity: 0, y: rel(num(c.o.dist, 40)) }); });
  def('blur-out', '退场', '变模糊 + 淡出（退到背景里去）', function (c) {
    leave(c, { opacity: 0, filter: 'blur(' + num(c.o.blur, 16) + 'px)' }, { dur: 0.4 });
  });
  def('scale-out', '退场', '缩小 + 淡出。参数 to=结束缩放（>1 则是放大着消失）', function (c) { leave(c, { opacity: 0, scale: num(c.o.to, 0.85) }); });
  def('slide-out', '退场', '向一侧滑出。参数 dir', function (c) {
    var d = DIR[c.o.dir || 'left'] || DIR.left, n = num(c.o.dist, 160);
    leave(c, { opacity: 0, x: rel(-d[0] * n), y: rel(-d[1] * n) }, { dur: 0.45 });
  });
  def('wipe-out', '退场', '遮罩擦除消失', function (c) {
    var to = { right: 'inset(0% 0% 0% 100%)', left: 'inset(0% 100% 0% 0%)', down: 'inset(100% 0% 0% 0%)', up: 'inset(0% 0% 100% 0%)' }[c.o.dir || 'right'];
    c.tl.fromTo(c.els, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: to, duration: num(c.o.dur, 0.5), ease: EZ(c.o.ease, 'inout'), immediateRender: false }, c.t);
  });

  /* ═════════════════════════ 3. 强调 ═════════════════════════ */

  def('pulse', '强调', '放大一下再回去（念到这个词的时候敲一下）。参数 to=峰值缩放', function (c) {
    c.tl.to(c.els, { scale: num(c.o.to, 1.1), duration: num(c.o.dur, 0.16), ease: 'power2.out', yoyo: true, repeat: 1, stagger: stag(c, 0.05) }, c.t);
  });
  def('shake', '强调', '左右抖动（否定、报错、警告）', function (c) {
    var a = num(c.o.amp, 10);
    c.tl.to(c.els, { keyframes: [{ x: rel(-a) }, { x: rel(2 * a) }, { x: rel(-1.6 * a) }, { x: rel(a) }, { x: rel(-0.4 * a) }],
      duration: num(c.o.dur, 0.4), ease: 'none' }, c.t);
  });
  def('nod', '强调', '上下轻跳一下（角色点头、图标弹跳）', function (c) {
    c.tl.to(c.els, { y: rel(-num(c.o.amp, 18)), duration: num(c.o.dur, 0.16), ease: 'power2.out', yoyo: true, repeat: 1, stagger: stag(c, 0.05) }, c.t);
  });
  def('blink', '强调', '闪烁几下（光标、警示）。参数 n=次数', function (c) {
    c.tl.to(c.els, { opacity: 0.15, duration: num(c.o.dur, 0.12), ease: 'steps(1)', yoyo: true, repeat: num(c.o.n, 3) * 2 - 1 }, c.t);
  });
  def('color', '强调', '文字 / 背景变色。参数 to=颜色、bg=背景色', function (c) {
    var v = { duration: num(c.o.dur, 0.3), ease: 'power1.out', stagger: stag(c, 0.04) };
    if (c.o.to) v.color = c.o.to;
    if (c.o.bg) v.backgroundColor = c.o.bg;
    c.tl.to(c.els, v, c.t);
  });
  def('marker', '强调', '荧光笔：一道色块从左到右刷过文字底部。参数 color、h=色块高度%', function (c) {
    var col = c.o.color || 'var(--fx-marker)', h = num(c.o.h, 42);
    c.els.forEach(function (el) {
      el.style.backgroundImage = 'linear-gradient(' + col + ',' + col + ')';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = '0 ' + num(c.o.pos, 88) + '%';
      c.tl.fromTo(el, { backgroundSize: '0% ' + h + '%' }, { backgroundSize: '100% ' + h + '%', duration: num(c.o.dur, 0.5), ease: EZ(c.o.ease, 'inout') }, c.t);
    });
  });
  def('underline', '强调', '下划线从左长到右。参数 color、w=粗细像素', function (c) {
    var col = c.o.color || 'var(--fx-accent)', w = num(c.o.w, 6);
    c.els.forEach(function (el) {
      el.style.backgroundImage = 'linear-gradient(' + col + ',' + col + ')';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = '0 100%';
      el.style.paddingBottom = el.style.paddingBottom || '0.12em';
      c.tl.fromTo(el, { backgroundSize: '0% ' + w + 'px' }, { backgroundSize: '100% ' + w + 'px', duration: num(c.o.dur, 0.5), ease: EZ(c.o.ease, 'inout') }, c.t);
    });
  });
  def('strike', '强调', '删除线划过（旧方案作废）', function (c) {
    var col = c.o.color || 'currentColor', w = num(c.o.w, 5);
    c.els.forEach(function (el) {
      el.style.backgroundImage = 'linear-gradient(' + col + ',' + col + ')';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = '0 55%';
      c.tl.fromTo(el, { backgroundSize: '0% ' + w + 'px' }, { backgroundSize: '100% ' + w + 'px', duration: num(c.o.dur, 0.35), ease: 'power2.inOut' }, c.t);
      if (c.o.dim !== 0) c.tl.to(el, { opacity: num(c.o.dim, 0.45), duration: 0.3 }, c.t + 0.15);
    });
  });
  def('box', '强调', '高亮框：沿元素外沿画出一圈描边（截图上圈重点）。参数 color、pad、w、r', function (c) {
    c.els.forEach(function (el) {
      var pad = num(c.o.pad, 10), w = num(c.o.w, 5), r = num(c.o.r, 12);
      var W = el.offsetWidth + pad * 2, H = el.offsetHeight + pad * 2;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'fx-box');
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.style.cssText = 'position:absolute;left:' + -pad + 'px;top:' + -pad + 'px;overflow:visible;pointer-events:none;z-index:5';
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', w / 2); rect.setAttribute('y', w / 2);
      rect.setAttribute('width', W - w); rect.setAttribute('height', H - w);
      rect.setAttribute('rx', r); rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', c.o.color || 'var(--fx-accent)'); rect.setAttribute('stroke-width', w);
      svg.appendChild(rect); el.appendChild(svg);
      var len = 2 * (W - w + H - w);
      if (c.o.mode === 'pop') {
        c.tl.fromTo(svg, { opacity: 0, scale: 1.12, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: num(c.o.dur, 0.35), ease: 'back.out(2)' }, c.t);
      } else {
        c.tl.fromTo(rect, { strokeDasharray: len + ' ' + len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: num(c.o.dur, 0.6), ease: 'power2.inOut' }, c.t);
      }
      if (c.o.hold) c.tl.to(svg, { opacity: 0, duration: 0.25 }, c.t + num(c.o.hold, 1.5));
    });
  });
  def('glow', '强调', '发光呼吸：光晕亮起再回落。参数 color、n=次数', function (c) {
    var col = c.o.color || 'var(--fx-accent)', s = num(c.o.size, 40);
    c.tl.to(c.els, { boxShadow: '0 0 ' + s + 'px ' + col, duration: num(c.o.dur, 0.5), ease: 'sine.inOut', yoyo: true, repeat: num(c.o.n, 1) * 2 - 1 }, c.t);
  });
  def('sheen', '强调', '扫光：一道高光斜着扫过卡片 / 按钮', function (c) {
    c.els.forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';
      var s = document.createElement('i');
      s.className = 'fx-sheen';
      el.appendChild(s);
      c.tl.fromTo(s, { xPercent: -160 }, { xPercent: 260, duration: num(c.o.dur, 0.9), ease: 'power2.inOut' }, c.t);
    });
  });
  def('ping', '强调', '涟漪：从元素中心扩散出一圈（点击反馈、提示位置）', function (c) {
    c.els.forEach(function (el) {
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      var n = num(c.o.n, 1);
      for (var i = 0; i < n; i++) {
        var s = document.createElement('i');
        s.className = 'fx-ping';
        if (c.o.color) s.style.borderColor = c.o.color;
        el.appendChild(s);
        c.tl.fromTo(s, { scale: 0.3, opacity: 0.9 }, { scale: num(c.o.to, 2.6), opacity: 0, duration: num(c.o.dur, 0.7), ease: 'power2.out' }, c.t + i * 0.22);
      }
    });
  });
  def('dim', '强调', '压暗（退到次要地位）。参数 to=不透明度', function (c) {
    c.tl.to(c.els, { opacity: num(c.o.to, 0.28), duration: num(c.o.dur, 0.35), ease: 'power1.out', stagger: stag(c, 0.03) }, c.t);
  });
  def('undim', '强调', '恢复亮度', function (c) {
    c.tl.to(c.els, { opacity: num(c.o.to, 1), duration: num(c.o.dur, 0.35), ease: 'power1.out', stagger: stag(c, 0.03) }, c.t);
  });
  def('spot', '强调', '聚光：配 each: 使用，第 i 个子元素保持明亮并略微放大，其余压暗。参数 i（从 1 数）', function (c) {
    var i = num(c.o.i, 1) - 1, d = num(c.o.dur, 0.35);
    c.els.forEach(function (el, k) {
      c.tl.to(el, { opacity: k === i ? 1 : num(c.o.dimTo, 0.3), scale: k === i ? num(c.o.scale, 1.04) : 1, duration: d, ease: 'power2.out' }, c.t);
    });
  });
  def('float', '强调', '持续上下漂浮（待机感）。参数 amp=幅度、period=一个来回的秒数、dur=持续多久', function (c) {
    var period = num(c.o.period, 3), dur = num(c.o.dur, c.sceneDur || 6);
    c.els.forEach(function (el, i) {
      c.tl.to(el, { y: rel(-num(c.o.amp, 10)), duration: period / 2, ease: 'sine.inOut', yoyo: true,
        repeat: Math.max(1, Math.round(dur / (period / 2)) - 1) }, c.t + i * num(c.o.stagger, 0.3));
    });
  });
  def('spin', '强调', '旋转。参数 deg=总角度、dur', function (c) {
    c.tl.to(c.els, { rotation: rel(num(c.o.deg, 360)), duration: num(c.o.dur, 1.2), ease: EZ(c.o.ease, 'linear') }, c.t);
  });
  def('move', '强调', '把元素移动到另一个元素的位置（光标移向按钮、标签飞入卡片）。参数 to=#目标 或 x、y', function (c) {
    c.els.forEach(function (el) {
      var v = { duration: num(c.o.dur, 0.7), ease: EZ(c.o.ease, 'inout') };
      if (c.o.to) {
        var a = FX.rect(el), b = FX.rect($(c.o.to));
        if (!b) { console.warn('FX move：找不到目标', c.o.to); return; }
        v.x = rel(b.cx - a.cx + num(c.o.dx, 0)); v.y = rel(b.cy - a.cy + num(c.o.dy, 0));
        if (c.o.fit) { v.scaleX = b.w / a.w; v.scaleY = b.h / a.h; }
      } else { v.x = rel(num(c.o.x, 0)); v.y = rel(num(c.o.y, 0)); }
      if (c.o.scale !== undefined) v.scale = num(c.o.scale, 1);
      if (c.o.rot !== undefined) v.rotation = num(c.o.rot, 0);
      c.tl.to(el, v, c.t);
    });
  });
  def('click', '强调', '点击：按下缩一下 + 涟漪（配 .fx-cursor 光标组件）', function (c) {
    c.tl.to(c.els, { scale: 0.8, duration: 0.08, ease: 'power2.in', yoyo: true, repeat: 1 }, c.t);
    FX.fx.ping(Object.assign({}, c, { o: Object.assign({ to: 3.2, dur: 0.5 }, c.o), t: c.t + 0.06 }));
  });
  def('swap', '强调', '原地切换内容：自己淡出，目标元素淡入。参数 to=#目标', function (c) {
    var to = $(c.o.to), d = num(c.o.dur, 0.25);
    c.tl.to(c.els, { opacity: 0, duration: d, ease: 'power1.in' }, c.t);
    if (to) c.tl.fromTo(to, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.out' }, c.t + d * 0.6);
  });
  def('scramble', '入场', '乱码解码：每个字先闪随机字符（灰），从左到右逐个锁定成正确的字（白）。参数 dur、chars=乱码字符池', function (c) {
    var pool = Array.from(c.o.chars || '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感见明问力理尔点文几定本公特做外孩相西果走将月十实向声车全信重三机工物气每并别真打太新比才便夫再书部水像眼等体却加电主界门利海受听表德少克代员许稜先口由死安写性马光白或住难望教命花结乐色更拉东神记处让母父应直字场平报友关放至张认接告入笑内英军候民岁往何度山觉路带万男边风解叫任金快原吃妈变通师立象数四失满战远格士音轻目条呢');
    var r = FX.rand(num(c.o.seed, 17));
    c.els.forEach(function (el) {
      var chars = splitChars(el), finals = chars.map(function (s) { return s.textContent; }), n = chars.length, p = { v: 0 };
      var dur = num(c.o.dur, 0.7), lockCol = c.o.color || '', dimCol = c.o.dim || '#666';
      var noise = chars.map(function () { var a = []; for (var k = 0; k < 8; k++) a.push(pool[Math.floor(r() * pool.length)]); return a; });
      var paint = function () {
        var locked = p.v * n, tick = Math.floor(p.v * dur * 30 / 2);            // 乱码每 2 帧换一次
        chars.forEach(function (s, i) {
          if (i < locked) { s.textContent = finals[i]; s.style.color = lockCol; }
          else { s.textContent = /\s/.test(finals[i]) ? finals[i] : noise[i][(tick + i) % 8]; s.style.color = dimCol; }
        });
      };
      paint();
      c.tl.to(p, { v: 1, duration: dur, ease: 'none', onUpdate: paint }, c.t);
    });
  });
  def('squash', '强调', '卡片挤压-弹开：横向先压窄再弹回（约 3 帧压 + 4 帧弹），常和换内容一起用。参数 to=最窄比例', function (c) {
    gsap.set(c.els, { transformOrigin: c.o.origin || '50% 50%' });
    c.tl.to(c.els, { keyframes: [{ scaleX: num(c.o.to, 0.83), duration: 0.1, ease: 'sine.inOut' }, { scaleX: 0.95, duration: 0.17, ease: 'none' }, { scaleX: 1, duration: 0.13, ease: 'expo.out' }] }, c.t);
  });
  def('cycle', '强调', '子元素轮播硬切：一次只显示一个，每 every 秒换下一个（缩略图里画面一直在换）。参数 every、loop=1 循环、stop=停在第几张', function (c) {
    var kids = Array.prototype.slice.call(c.el.children), every = num(c.o.every, 0.5), end = c.t + num(c.o.dur, c.sceneDur || 3);
    var stopAt = c.o.stop ? num(c.o.stop, 1) - 1 : -1, k = 0;
    for (var t = c.t; t < end - 0.001; t += every, k++) {
      var idx = c.o.loop === 0 ? Math.min(k, kids.length - 1) : k % kids.length;
      if (stopAt >= 0 && k >= kids.length) idx = stopAt;
      kids.forEach(function (x, i) { c.tl.set(x, { visibility: i === idx ? 'visible' : 'hidden' }, t); });
      if (stopAt >= 0 && k >= kids.length) break;
    }
  });
  def('text', '强调', '文字硬切成新内容（时钟跳变、标签换字）。参数 v=新文字', function (c) {
    // 同一元素可能跳很多次：统一用一条贯穿全片的补间按当前时间查表，前后乱跳也不会错
    c.els.forEach(function (el) {
      if (!el.__fxTexts) {
        var states = el.__fxTexts = [[-1, el.innerHTML]], tl = c.tl;
        var paint = function () {
          var now = tl.time(), html = states[0][1];
          states.forEach(function (s) { if (s[0] <= now + 1e-4) html = s[1]; });
          if (el.innerHTML !== html) el.innerHTML = html;
        };
        tl.to({ v: 0 }, { v: 1, duration: c.total, ease: 'none', onUpdate: paint }, 0);
      }
      el.__fxTexts.push([c.t, String(c.o.v)]);
      el.__fxTexts.sort(function (a, b) { return a[0] - b[0]; });
    });
  });
  def('to', '强调', '万能补间：直接写 GSAP 属性。例 to@2(x=120,scale=1.2,opacity=0.5,dur=0.6,ease=inout)', function (c) {
    var v = {}, skip = { dur: 1, ease: 1, stagger: 1, order: 1 };
    Object.keys(c.o).forEach(function (k) { if (!skip[k]) v[k] = c.o[k]; });
    v.duration = num(c.o.dur, 0.5); v.ease = EZ(c.o.ease, 'inout'); v.stagger = stag(c, 0.05);
    c.tl.to(c.els, v, c.t);
  });

  /* ═════════════════════════ 4. 数据 ═════════════════════════ */

  function fmt(v, dec, comma) {
    var s = v.toFixed(dec);
    if (comma) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); }
    return s;
  }
  def('count', '数据', '数字滚动。元素里写最终数字，或用 to= 指定；from= 起始值。自动保留小数位和千分位', function (c) {
    c.els.forEach(function (el) {
      var raw = String(c.o.to !== undefined ? c.o.to : el.textContent).trim();
      var m = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/.exec(raw);
      if (!m) return;
      var end = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') >= 0;
      var p = { v: num(c.o.from, 0) };
      var paint = function () { el.textContent = m[1] + fmt(p.v, dec, comma) + m[3]; };
      paint();
      c.tl.to(p, { v: end, duration: num(c.o.dur, 1.2), ease: EZ(c.o.ease, 'sharp'), onUpdate: paint }, c.t);
    });
  });
  def('roll', '数据', '数字逐位竖向翻滚：每一位是一条 0~9 的竖带，带模糊滚动后从左到右依次停靠（黑金款的 $7,000）。参数 dur、stagger、spins=多转几圈', function (c) {
    c.els.forEach(function (el) {
      var txt = el.textContent, spins = num(c.o.spins, 1), k = 0, cols = [];
      el.textContent = '';
      el.style.display = 'inline-flex';
      Array.from(txt).forEach(function (ch) {
        if (!/\d/.test(ch)) { var s = document.createElement('span'); s.textContent = ch; el.appendChild(s); return; }
        var box = document.createElement('span'), strip = document.createElement('span'), seq = '';
        box.style.cssText = 'display:inline-block;height:1em;line-height:1;overflow:hidden;vertical-align:top';
        strip.style.cssText = 'display:flex;flex-direction:column';
        for (var i = 0; i <= 10 * (spins + 1) + (+ch); i++) seq += '<span style="height:1em">' + (i % 10) + '</span>';
        strip.innerHTML = seq; box.appendChild(strip); el.appendChild(box);
        cols.push([strip, 10 * (spins + 1) + (+ch), k++]);
      });
      el.style.lineHeight = '1';
      var d = num(c.o.dur, 0.9), st = num(c.o.stagger, 0.1);
      cols.forEach(function (p) {
        var t = c.t + p[2] * st;
        c.tl.fromTo(p[0], { yPercent: 0 }, { yPercent: -100 * p[1] / (p[1] + 1), duration: d, ease: EZ(c.o.ease, 'expo.out') }, t);
        c.tl.fromTo(p[0], { filter: 'blur(6px)' }, { filter: 'blur(0px)', duration: d * 0.8, ease: 'power2.out' }, t);
      });
    });
  });
  def('clock', '数据', '时钟拨动：from=23:28 拨到 to=01:23（会自动跨天）', function (c) {
    var toMin = function (s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1]); };
    c.els.forEach(function (el) {
      var a = toMin(c.o.from || el.textContent), b = toMin(c.o.to || el.textContent);
      if (b < a) b += 1440;
      var p = { v: a };
      var paint = function () {
        var m = Math.round(p.v) % 1440, h = Math.floor(m / 60), mm = m % 60;
        el.textContent = (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
      };
      paint();
      c.tl.to(p, { v: b, duration: num(c.o.dur, 1.2), ease: EZ(c.o.ease, 'inout'), onUpdate: paint }, c.t);
    });
  });
  def('fill', '数据', '进度条填充：把元素宽度（或 dir=y 时高度）从 from% 补到 to%', function (c) {
    var prop = c.o.dir === 'y' ? 'height' : 'width';
    var a = {}, b = { duration: num(c.o.dur, 1), ease: EZ(c.o.ease, 'inout') };
    a[prop] = num(c.o.from, 0) + '%'; b[prop] = num(c.o.to, 100) + '%';
    c.tl.fromTo(c.els, a, b, c.t);
  });
  def('ring', '数据', '圆环进度：配 data-make="ring"。参数 from、to（0~1）', function (c) {
    c.els.forEach(function (el) {
      var fg = $('.fx-ring-fg', el) || el, len = fg.getTotalLength();
      c.tl.fromTo(fg, { strokeDasharray: len + ' ' + len, strokeDashoffset: len * (1 - num(c.o.from, 0)) },
        { strokeDashoffset: len * (1 - num(c.o.to, 1)), duration: num(c.o.dur, 1.2), ease: EZ(c.o.ease, 'inout') }, c.t);
    });
  });
  def('wave-live', '数据', '波形跳动：配 data-make="wave"，每根条按种子随机起伏。参数 dur、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 11)), dur = num(c.o.dur, c.sceneDur || 3), beat = num(c.o.beat, 0.14);
    var n = Math.max(2, Math.floor(dur / beat));
    $$('.fx-wave-bar', c.el).forEach(function (bar) {
      var kf = [];
      for (var i = 0; i < n; i++) kf.push({ scaleY: 0.25 + r() * 0.95, duration: beat, ease: 'sine.inOut' });
      kf.push({ scaleY: 1, duration: beat });
      c.tl.to(bar, { keyframes: kf }, c.t);
    });
  });

  /* ═════════════════════ 5. 镜头（作用在容器上） ═════════════════════ */

  def('push', '镜头', '缓慢推近（Ken Burns）：整个容器在一段时间里匀速放大一点点。参数 from、to、dur', function (c) {
    var dur = num(c.o.dur, c.sceneDur || 5);
    c.tl.fromTo(c.els, { scale: num(c.o.from, 1) }, { scale: num(c.o.to, 1.06), duration: dur, ease: EZ(c.o.ease, 'linear'), immediateRender: false }, c.t);
  });
  def('pan', '镜头', '缓慢平移。参数 x、y（总位移像素）、dur', function (c) {
    var dur = num(c.o.dur, c.sceneDur || 5);
    c.tl.to(c.els, { x: rel(num(c.o.x, -60)), y: rel(num(c.o.y, 0)), duration: dur, ease: EZ(c.o.ease, 'linear') }, c.t);
  });
  def('zoom-to', '镜头', '推到局部：把容器放大并平移，让目标区域占满画面。参数 to=#目标 或 x,y,w,h（容器内像素）、fill=占画面比例', function (c) {
    c.els.forEach(function (el) {
      var box = FX.rect(el), r;
      if (c.o.to) { var t = FX.rect($(c.o.to, el) || $(c.o.to)); r = { x: t.x - box.x, y: t.y - box.y, w: t.w, h: t.h }; }
      else r = { x: num(c.o.x, 0), y: num(c.o.y, 0), w: num(c.o.w, box.w / 2), h: num(c.o.h, box.h / 2) };
      var s = num(c.o.scale, Math.min(box.w / r.w, box.h / r.h) * num(c.o.fill, 0.8));
      var dx = -(r.x + r.w / 2 - box.w / 2) * s, dy = -(r.y + r.h / 2 - box.h / 2) * s;
      gsap.set(el, { transformOrigin: '50% 50%' });
      c.tl.to(el, { scale: s, x: dx + num(c.o.dx, 0), y: dy + num(c.o.dy, 0), duration: num(c.o.dur, 0.9), ease: EZ(c.o.ease, 'inout') }, c.t);
    });
  });
  def('zoom-reset', '镜头', '从局部拉回全景', function (c) {
    c.tl.to(c.els, { scale: 1, x: 0, y: 0, duration: num(c.o.dur, 0.8), ease: EZ(c.o.ease, 'inout') }, c.t);
  });
  def('tilt', '镜头', '3D 倾斜摆放并缓慢转动（悬浮的界面卡片）。参数 rx、ry 起始角度，rx2、ry2 结束角度', function (c) {
    var dur = num(c.o.dur, c.sceneDur || 5);
    gsap.set(c.els, { transformPerspective: num(c.o.persp, 1600) });
    c.tl.fromTo(c.els, { rotationX: num(c.o.rx, 10), rotationY: num(c.o.ry, -18) },
      { rotationX: num(c.o.rx2, 6), rotationY: num(c.o.ry2, -10), duration: dur, ease: EZ(c.o.ease, 'linear'), immediateRender: true }, c.t);
  });
  def('drift', '镜头', '背景缓慢漂移（模糊卡片墙、粒子层）。参数 x、y、rot、dur', function (c) {
    var dur = num(c.o.dur, c.sceneDur || 6);
    c.tl.fromTo(c.els, { x: 0, y: 0 }, { x: num(c.o.x, -80), y: num(c.o.y, -40), rotation: rel(num(c.o.rot, 0)), duration: dur, ease: 'none', immediateRender: false }, c.t);
  });
  def('cam-shake', '镜头', '镜头震动（重击、报错）', function (c) {
    var a = num(c.o.amp, 14), kf = [], r = FX.rand(num(c.o.seed, 3));
    for (var i = 0; i < 7; i++) { var k = 1 - i / 7; kf.push({ x: (r() * 2 - 1) * a * k, y: (r() * 2 - 1) * a * k, duration: 0.045 }); }
    kf.push({ x: 0, y: 0, duration: 0.05 });
    c.tl.to(c.els, { keyframes: kf, ease: 'none' }, c.t);
  });

  /* ═════════════════════ 6. 角色（立绘 / 像素小人） ═════════════════════ */

  def('pose', '角色', '立绘换姿势：.host 里放多张 [data-pose] 图，硬切到 name 指定的那张（口播视频的立绘一般就是硬切）；bounce=1 加挤压回弹', function (c) {
    c.els.forEach(function (host) {
      var poses = $$('[data-pose]', host), want = String(c.o.name);
      poses.forEach(function (p) { c.tl.set(p, { visibility: p.getAttribute('data-pose') === want ? 'visible' : 'hidden' }, c.t); });
      if (c.o.bounce) {
        gsap.set(host, { transformOrigin: '50% 100%' });
        c.tl.fromTo(host, { scaleY: 0.955, scaleX: 1.02 }, { scaleY: 1, scaleX: 1, duration: num(c.o.dur, 0.28), ease: 'back.out(3)', immediateRender: false }, c.t);
      }
    });
  });
  def('lipsync', '角色', '口型：在容器里多张 [data-mouth] 图之间每 frames 帧硬切一次（一般 2~4 帧），说完回到第一张。参数 dur、frames、seed', function (c) {
    var dur = num(c.o.dur, c.sceneDur || 2), step = num(c.o.frames, 3) / 30, r = FX.rand(num(c.o.seed, 13));
    c.els.forEach(function (box) {
      var m = $$('[data-mouth]', box);
      if (m.length < 2) return;
      m.forEach(function (x, i) { gsap.set(x, { visibility: i === 0 ? 'visible' : 'hidden' }); });   // 说话前停在第一帧（闭嘴）
      var show = function (k, t) { m.forEach(function (x, i) { c.tl.set(x, { visibility: i === k ? 'visible' : 'hidden' }, t); }); };
      var last = 0;
      for (var t = 0; t < dur; t += step) { var k = 1 + Math.floor(r() * (m.length - 1)); if (k === last) k = 0; show(k, c.t + t); last = k; }
      show(0, c.t + dur);
    });
  });
  def('talk', '角色', '说话时的小幅上下点动。参数 dur=说多久、rate=每秒几下', function (c) {
    var dur = num(c.o.dur, c.sceneDur || 2), rate = num(c.o.rate, 3.2), n = Math.max(1, Math.round(dur * rate));
    c.tl.to(c.els, { y: rel(-num(c.o.amp, 6)), duration: 0.5 / rate, ease: 'sine.inOut', yoyo: true, repeat: n * 2 - 1 }, c.t);
  });
  def('hop', '角色', '原地跳一下（惊讶、高兴）。参数 h=高度、n=次数', function (c) {
    var h = num(c.o.h, 40);
    gsap.set(c.els, { transformOrigin: '50% 100%' });
    c.tl.to(c.els, { keyframes: [{ scaleY: 0.9, scaleX: 1.06, duration: 0.07 }, { y: rel(-h), scaleY: 1.05, scaleX: 0.97, duration: 0.16, ease: 'power2.out' },
      { y: rel(h), scaleY: 1, scaleX: 1, duration: 0.16, ease: 'power2.in' }, { scaleY: 0.94, scaleX: 1.04, duration: 0.05 }, { scaleY: 1, scaleX: 1, duration: 0.1 }],
      repeat: num(c.o.n, 1) - 1 }, c.t);
  });
  def('walk', '角色', '走过去：水平移动 + 一步一颠。参数 x=位移 或 to=#目标、steps=步数；像素角色加 ease=steps(8)', function (c) {
    c.els.forEach(function (el) {
      var dx = num(c.o.x, 200);
      if (c.o.to) { var a = FX.rect(el), b = FX.rect($(c.o.to)); dx = b.cx - a.cx + num(c.o.dx, 0); }
      var dur = num(c.o.dur, Math.abs(dx) / 260), steps = num(c.o.steps, Math.max(2, Math.round(dur * 4)));
      c.tl.to(el, { x: rel(dx), duration: dur, ease: EZ(c.o.ease, 'linear') }, c.t);
      c.tl.to(el, { y: rel(-num(c.o.bob, 10)), duration: dur / steps / 2, ease: 'sine.out', yoyo: true, repeat: steps * 2 - 1 }, c.t);
    });
  });

  /* ═════════════════════ 7. 组件专用 ═════════════════════ */

  def('step', '组件', '步骤导航切换：配 data-make="steps"，把第 i 个胶囊点亮（从 1 数），其余熄灭', function (c) {
    var items = $$('.fx-step', c.el), i = num(c.o.i, 1) - 1, d = num(c.o.dur, 0.3);
    items.forEach(function (it, k) {
      c.tl.to($('.fx-step-on', it), { opacity: k === i ? 1 : 0, duration: d, ease: 'power1.out' }, c.t);
      if (c.o.done) c.tl.to(it, { opacity: k < i ? 0.45 : 1, duration: d }, c.t);
    });
  });
  def('chapter', '组件', '章节进度条：配 data-make="chapters"，高亮块滑到第 i 章（从 1 数）', function (c) {
    var segs = $$('.fx-chap', c.el), hi = $('.fx-chap-hi', c.el), i = clamp(num(c.o.i, 1) - 1, 0, segs.length - 1);
    var box = FX.rect(c.el), r = FX.rect(segs[i]);
    c.tl.to(hi, { x: r.x - box.x, width: r.w, duration: num(c.o.dur, 0.5), ease: EZ(c.o.ease, 'inout') }, c.t);
  });
  def('check', '组件', '清单打勾：配 .fx-check 组件，勾画出来、文字变实', function (c) {
    c.els.forEach(function (el, i) {
      var t = c.t + i * num(c.o.stagger, 0.35), mark = $('.fx-check-mark', el);
      if (mark) c.tl.fromTo(mark, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.6)' }, t);
      c.tl.to(el, { opacity: 1, duration: 0.25 }, t);
    });
  });

  /* ═════════════════════════ 转场 ═════════════════════════
   * 写在「后一个场景」上：data-in="blur-cross(dur=0.5)"。
   * fn(tl, t, prev, next, o) 返回这次转场需要前一个场景多留多久（秒）。 */
  def('reorder', '数据', '榜单换名次：一列（或一行）子元素按新顺序滑到各自的新位置，上升的那个略微放大、带一点高光。写在列表容器上。参数 order（新顺序，写原来的序号，用 / 隔开，如 3/1/2）、dur（默认 0.8）', function (c) {
    var kids = Array.prototype.slice.call(c.el.children), order = String(c.o.order || '').split(/[\/,]/).map(function (x) { return parseInt(x, 10) - 1; }).filter(function (k) { return k >= 0 && k < kids.length; });
    if (order.length !== kids.length) { console.warn('FX：reorder 的 order 要把 ' + kids.length + ' 个子元素的新顺序都写上，例如 order=3/1/2'); return; }
    var slots = kids.map(function (k) { return { x: k.offsetLeft, y: k.offsetTop }; }), d = num(c.o.dur, 0.8);
    order.forEach(function (from, to) {
      var k = kids[from], dx = slots[to].x - slots[from].x, dy = slots[to].y - slots[from].y; if (!dx && !dy) return;
      var up = to < from;
      c.tl.to(k, { x: '+=' + dx, y: '+=' + dy, duration: d, ease: 'power3.inOut', zIndex: up ? 3 : 1 }, c.t + (up ? 0 : 0.04));
      if (up) c.tl.fromTo(k, { scale: 1 }, { scale: 1.06, duration: d / 2, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, c.t);
    });
    c.o.dur = d;
  });

  function defT(name, desc, fn) { FX.trans[name] = fn; FX.catalog.push({ name: name, cat: '转场', desc: desc }); }

  defT('cut', '硬切（默认）。最常用，节奏最快', function () { return 0; });
  defT('fade', '交叉淡化', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.4);
    tl.fromTo(next, { opacity: 0 }, { opacity: 1, duration: d, ease: 'power1.inOut' }, t);
    return d;
  });
  defT('blur-cross', '模糊交叉：前一镜变模糊淡出，后一镜由模糊变清晰', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.5), b = num(o.blur, 24);
    if (prev) tl.to(prev, { filter: 'blur(' + b + 'px)', opacity: 0, scale: 1.04, duration: d, ease: 'power2.in' }, t);
    tl.fromTo(next, { filter: 'blur(' + b + 'px)', opacity: 0, scale: 0.97 }, { filter: 'blur(0px)', opacity: 1, scale: 1, duration: d, ease: 'power2.out' }, t + d * 0.35);
    return d * 1.35;
  });
  defT('zoom-through', '缩放穿越：前一镜放大冲出画面，后一镜从小处放大到位', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.6);
    if (prev) tl.to(prev, { scale: num(o.out, 1.6), opacity: 0, filter: 'blur(12px)', duration: d * 0.6, ease: 'power2.in' }, t);
    tl.fromTo(next, { scale: num(o.from, 0.7), opacity: 0 }, { scale: 1, opacity: 1, duration: d * 0.7, ease: 'expo.out' }, t + d * 0.3);
    return d;
  });
  defT('push', '推移：新场景把旧场景顶出去。参数 dir=left|right|up|down', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.6), dir = o.dir || 'left', ax = dir === 'left' || dir === 'right' ? 'xPercent' : 'yPercent';
    var sign = dir === 'left' || dir === 'up' ? 1 : -1, a = {}, b = {}, p = {};
    a[ax] = 100 * sign; b[ax] = 0; b.duration = d; b.ease = EZ(o.ease, 'inout');
    p[ax] = -100 * sign; p.duration = d; p.ease = b.ease;
    if (prev) tl.to(prev, p, t);
    tl.fromTo(next, a, b, t);
    return d;
  });
  defT('wipe', '擦除：新场景沿一个方向盖上来。参数 dir', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.55);
    var from = { right: 'inset(0% 100% 0% 0%)', left: 'inset(0% 0% 0% 100%)', down: 'inset(0% 0% 100% 0%)', up: 'inset(100% 0% 0% 0%)' }[o.dir || 'right'];
    tl.fromTo(next, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: d, ease: EZ(o.ease, 'inout') }, t);
    return d;
  });
  defT('iris', '圆形扩散：新场景从一个点扩成满屏。参数 x、y（百分比）', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.7), at = num(o.x, 50) + '% ' + num(o.y, 50) + '%';
    tl.fromTo(next, { clipPath: 'circle(0% at ' + at + ')' }, { clipPath: 'circle(150% at ' + at + ')', duration: d, ease: EZ(o.ease, 'inout') }, t);
    return d;
  });
  defT('flash', '闪白（或任意色）切换：重点句、章节开头。参数 color', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.36), f = overlay(o.color || '#fff');
    tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: d * 0.3, ease: 'power2.in' }, t - d * 0.3);
    tl.to(f, { opacity: 0, duration: d * 0.7, ease: 'power2.out' }, t);
    return 0;
  });
  defT('dip', '黑场过渡：先暗下去再亮起来（换话题）。参数 color', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.6), f = overlay(o.color || '#000');
    tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: d / 2, ease: 'power1.in' }, t - d / 2);
    tl.to(f, { opacity: 0, duration: d / 2, ease: 'power1.out' }, t);
    return 0;
  });
  defT('pixelate', '像素溶解：方块按随机顺序盖满画面再散开（像素风换场景）。参数 cols、color', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.75), cols = num(o.cols, 16), W = STAGE.offsetWidth, H = STAGE.offsetHeight;
    var size = Math.ceil(W / cols), rows = Math.ceil(H / size), wrap = document.createElement('div'), r = FX.rand(num(o.seed, 5));
    wrap.className = 'fx-overlay';
    wrap.style.cssText += ';opacity:1;background:none';
    var cells = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var c = document.createElement('i');
      c.style.cssText = 'position:absolute;left:' + x * size + 'px;top:' + y * size + 'px;width:' + (size + 1) + 'px;height:' + (size + 1) + 'px;background:' + (o.color || '#111') + ';visibility:hidden';
      wrap.appendChild(c); cells.push([r(), c]);
    }
    STAGE.appendChild(wrap);
    cells.sort(function (a, b) { return a[0] - b[0]; });
    var half = d / 2;
    cells.forEach(function (p, i) {
      var k = i / cells.length;
      tl.set(p[1], { visibility: 'visible' }, t - half + k * half * 0.9);
      tl.set(p[1], { visibility: 'hidden' }, t + 0.04 + k * half * 0.9);
    });
    return 0;
  });
  function overlay(color) {
    var f = document.createElement('div');
    f.className = 'fx-overlay';
    f.style.background = color;
    STAGE.appendChild(f);
    return f;
  }

  /* ═════════════════════ 组件生成器（data-make） ═════════════════════
   * 把重复的 DOM 交给库来生成：<div data-make="bars" data-values="3,8,21,40"></div> */

  var list = function (el, k) { return (el.getAttribute('data-' + k) || '').split(/[,|]/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; }); };

  /** 柱状图 / 直方图：data-values、可选 data-labels、data-hi="高亮第几根(从1数，可多个)" */
  FX.make.bars = function (el) {
    var vals = list(el, 'values').map(Number), labels = list(el, 'labels'), hi = list(el, 'hi').map(Number);
    var max = num(el.getAttribute('data-max'), Math.max.apply(null, vals));
    el.classList.add('fx-bars');
    el.innerHTML = vals.map(function (v, i) {
      return '<div class="fx-bar-col"><div class="fx-bar' + (hi.indexOf(i + 1) >= 0 ? ' is-hi' : '') + '" style="height:' + (v / max * 100).toFixed(2) + '%"></div>' +
        (labels[i] ? '<span class="fx-bar-label">' + labels[i] + '</span>' : '') + '</div>';
    }).join('');
  };
  /** 波形：data-n 根数、data-seed 种子 */
  FX.make.wave = function (el) {
    var n = num(el.getAttribute('data-n'), 64), r = FX.rand(num(el.getAttribute('data-seed'), 9)), h = '';
    el.classList.add('fx-wave');
    for (var i = 0; i < n; i++) {
      var env = 0.35 + 0.65 * Math.abs(Math.sin(i / n * Math.PI * 3.1 + 0.6));       // 包络，让波形有起伏而不是纯噪声
      h += '<i class="fx-wave-bar" style="height:' + clamp((0.15 + r() * 0.85) * env * 100, 6, 100).toFixed(1) + '%"></i>';
    }
    el.innerHTML = h;
  };
  /** 步骤导航胶囊：data-labels="选题,找素材,写稿" */
  FX.make.steps = function (el) {
    el.classList.add('fx-steps');
    el.innerHTML = list(el, 'labels').map(function (t, i) {
      var n = (i + 1 < 10 ? '0' : '') + (i + 1);
      return '<div class="fx-step"><span class="fx-step-n">' + n + '</span>' + t + '<div class="fx-step-on"><span class="fx-step-n">' + n + '</span>' + t + '</div></div>';
    }).join('');
  };
  /** 顶部章节进度条：data-labels="开场,误区一,误区二,总结" */
  FX.make.chapters = function (el) {
    el.classList.add('fx-chapters');
    el.innerHTML = '<div class="fx-chap-hi"></div>' + list(el, 'labels').map(function (t) { return '<div class="fx-chap">' + t + '</div>'; }).join('');
  };
  /** 圆环：data-size、data-stroke */
  FX.make.ring = function (el) {
    var s = num(el.getAttribute('data-size'), 240), w = num(el.getAttribute('data-stroke'), 14), r = (s - w) / 2;
    var dash = el.getAttribute('data-dash');
    el.classList.add('fx-ring');
    el.style.width = el.style.height = s + 'px';
    el.insertAdjacentHTML('afterbegin', '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">' +
      '<circle class="fx-ring-bg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>' +
      '<circle class="fx-ring-fg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke-width="' + w + '" stroke-linecap="round" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/></svg>');
  };
  /** 背景卡片墙：data-cols、data-rows、data-seed。配 drift 动效做缓慢漂移 */
  FX.make.wall = function (el) {
    var cols = num(el.getAttribute('data-cols'), 8), rows = num(el.getAttribute('data-rows'), 5), r = FX.rand(num(el.getAttribute('data-seed'), 21)), h = '';
    el.classList.add('fx-wall');
    el.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    for (var i = 0; i < cols * rows; i++) {
      var a = r(), b = r();
      h += '<i class="fx-wall-card" style="--a:' + a.toFixed(3) + ';--b:' + b.toFixed(3) + '"><b style="width:' + (30 + a * 50).toFixed(0) + '%"></b><b style="width:' + (20 + b * 60).toFixed(0) + '%"></b></i>';
    }
    el.innerHTML = h;
  };
  /** 粒子：data-n、data-seed。配 float 动效 */
  FX.make.dust = function (el) {
    var n = num(el.getAttribute('data-n'), 40), r = FX.rand(num(el.getAttribute('data-seed'), 33)), h = '';
    el.classList.add('fx-dust');
    for (var i = 0; i < n; i++) {
      var s = 2 + r() * 5;
      h += '<i style="left:' + (r() * 100).toFixed(2) + '%;top:' + (r() * 100).toFixed(2) + '%;width:' + s.toFixed(1) + 'px;height:' + s.toFixed(1) + 'px;opacity:' + (0.15 + r() * 0.6).toFixed(2) + '"></i>';
    }
    el.innerHTML = h;
  };
  /** 折线：data-values → 一条 SVG 折线，配 draw 动效。data-smooth="1" 变成曲线 */
  FX.make.line = function (el) {
    var v = list(el, 'values').map(Number), W = num(el.getAttribute('data-w'), el.clientWidth || 800), H = num(el.getAttribute('data-h'), el.clientHeight || 300);
    var max = num(el.getAttribute('data-max'), Math.max.apply(null, v)), min = num(el.getAttribute('data-min'), Math.min.apply(null, v.concat([0])));
    var pts = v.map(function (y, i) { return [i / (v.length - 1) * W, H - (y - min) / (max - min || 1) * H]; });
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      if (el.getAttribute('data-smooth')) { var mx = (pts[i - 1][0] + pts[i][0]) / 2; d += ' C' + mx.toFixed(1) + ' ' + pts[i - 1][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' ' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1); }
      else d += ' L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
    }
    el.classList.add('fx-line-chart');
    el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="overflow:visible"><path d="' + d + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };
  /** 像素方块字：data-text="SKILL?"，用 5×7 点阵拼出来，每个方块是一个 <i>，配 each:pixel-in 组装 */
  var FONT57 = {
    A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01111 10000 10000 10000 10000 10000 01111',
    D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01111 10000 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '11111 00100 00100 00100 00100 00100 11111',
    J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
    P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
    V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 11011 10001', X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110', 2: '01110 10001 00001 00010 00100 01000 11111',
    3: '11110 00001 00001 01110 00001 00001 11110', 4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000', 8: '01110 10001 10001 01110 10001 10001 01110',
    9: '01110 10001 10001 01111 00001 00010 01100', '?': '01110 10001 00001 00010 00100 00000 00100', '!': '00100 00100 00100 00100 00100 00000 00100',
    '+': '00000 00100 00100 11111 00100 00100 00000', '-': '00000 00000 00000 11111 00000 00000 00000', '.': '00000 00000 00000 00000 00000 00000 00100',
    ':': '00000 00100 00000 00000 00000 00100 00000', '%': '11001 11010 00010 00100 01000 01011 10011', ' ': '00000 00000 00000 00000 00000 00000 00000'
  };
  FX.make.pixels = function (el) {
    var text = (el.getAttribute('data-text') || '').toUpperCase(), s = num(el.getAttribute('data-size'), 22), gap = num(el.getAttribute('data-gap'), 2);
    var cols = list(el, 'colors'), r = FX.rand(num(el.getAttribute('data-seed'), 4)), h = '', x0 = 0;
    Array.from(text).forEach(function (ch) {
      var g = (FONT57[ch] || FONT57['?']).split(' ');
      for (var y = 0; y < 7; y++) for (var x = 0; x < 5; x++) {
        if (g[y][x] !== '1') continue;
        var col = cols.length ? cols[Math.floor(r() * cols.length)] : '';
        h += '<i style="left:' + (x0 + x) * (s + gap) + 'px;top:' + y * (s + gap) + 'px;width:' + s + 'px;height:' + s + 'px;' + (col ? 'background:' + col : '') + '"></i>';
      }
      x0 += ch === ' ' ? 3 : 6;
    });
    el.classList.add('fx-pixels');
    el.style.width = (x0 - 1) * (s + gap) + 'px';
    el.style.height = 7 * (s + gap) + 'px';
    el.innerHTML = h;
  };

  /* ═══════════════════ v1.1 新增：文字 · 强调 · 镜头 · 剪纸 ═══════════════════
   * 灵感来自 animate.css、Magic UI、React Bits 等开源动效库，
   * 全部按「逐帧可 seek、结果可复现」重新实现：不用 CSS 动画，随机数一律带种子。 */

  var NS = 'http://www.w3.org/2000/svg';
  var slashList = function (s) { return String(s || '').split('/').map(function (x) { return x.trim(); }).filter(Boolean); };
  var relPos = function (el) { if (getComputedStyle(el).position === 'static') el.style.position = 'relative'; };
  var hostOf = function (c) { return (c.scene && c.scene.el) || STAGE; };          // 叠加物挂在所在场景里，跟着场景显隐
  var svgEl = function (tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; };
  /** 关键帧里的 rotation / x / y / skew 用相对值，不破坏元素自己 CSS 里的旋转和位置 */
  var ADD = { rotation: 1, rotationX: 1, rotationY: 1, x: 1, y: 1, xPercent: 1, yPercent: 1, skewX: 1, skewY: 1 };
  function keyframesRel(frames, dur, ease) {
    var cur = {}, last = 0, out = [];
    frames.forEach(function (f) {
      var v = { duration: Math.max(0.001, (f[0] - last) / 100 * dur), ease: ease || 'sine.inOut' };
      Object.keys(f[1]).forEach(function (k) {
        if (ADD[k]) { var to = f[1][k], from = cur[k] || 0; v[k] = rel(to - from); cur[k] = to; } else v[k] = f[1][k];
      });
      out.push(v); last = f[0];
    });
    return out;
  }

  /* ── 文字 ── */

  def('shimmer', '文字', '流光字：一道高光从左到右扫过文字（ShinyText）。参数 color=高光色、n=扫几次、gap=两次间隔', function (c) {
    c.els.forEach(function (el) {
      var base = getComputedStyle(el).color, hi = c.o.color || '#ffffff', d = num(c.o.dur, 1.2), n = num(c.o.n, 1);
      el.style.backgroundImage = 'linear-gradient(110deg,' + base + ' 0%,' + base + ' 40%,' + hi + ' 50%,' + base + ' 60%,' + base + ' 100%)';
      el.style.backgroundSize = '250% 100%';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = '100% 0';
      el.style.webkitBackgroundClip = 'text'; el.style.backgroundClip = 'text';
      el.style.color = 'transparent';
      for (var i = 0; i < n; i++) {
        c.tl.fromTo(el, { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: d, ease: EZ(c.o.ease, 'inout'), immediateRender: false }, c.t + i * (d + num(c.o.gap, 0.4)));
      }
    });
  });

  def('glitch', '文字', '故障字：红蓝错位 + 抖动 + 斜切，闪一小段后恢复（GlitchText）。参数 amp=错位像素、dur、seed。注意会把元素 x 归零，元素本身要移动时套一层外壳', function (c) {
    var r = FX.rand(num(c.o.seed, 21)), a = num(c.o.amp, 8), d = num(c.o.dur, 0.6), step = 2 / 30;
    c.els.forEach(function (el) {
      for (var t = 0; t < d; t += step) {
        var on = r() > 0.25, dx = (r() * 2 - 1) * a;
        c.tl.set(el, on ? { x: dx * 0.6, skewX: (r() * 2 - 1) * a * 0.8, textShadow: dx.toFixed(1) + 'px 0 #ff2a6d,' + (-dx).toFixed(1) + 'px 0 #05d9e8' }
                       : { x: 0, skewX: 0, textShadow: 'none' }, c.t + t);
      }
      c.tl.set(el, { x: 0, skewX: 0, textShadow: 'none' }, c.t + d);
    });
  });

  function wordStack(el, list, clip) {
    el.innerHTML = '';
    el.style.display = 'inline-grid';
    el.style.verticalAlign = 'bottom';
    if (clip) el.style.overflow = 'hidden';
    return list.map(function (w) {
      var s = document.createElement('span');
      s.textContent = w; s.style.gridArea = '1 / 1'; s.style.whiteSpace = 'nowrap'; s.style.display = 'block';
      el.appendChild(s); return s;
    });
  }
  def('rotate-words', '文字', '词语轮换：同一位置的词向上翻走、下一个词翻上来（WordRotate）。参数 words=乙/丙/丁（用 / 分隔，元素原文是第一个）、every=每个词停留秒数', function (c) {
    c.els.forEach(function (el) {
      var sp = wordStack(el, [el.textContent.trim()].concat(slashList(c.o.words)), true), every = num(c.o.every, 1.2), d = num(c.o.dur, 0.4);
      sp.forEach(function (s, i) { gsap.set(s, { yPercent: i ? 100 : 0, opacity: i ? 0 : 1 }); });
      for (var i = 1; i < sp.length; i++) {
        var t = c.t + (i - 1) * every;
        c.tl.to(sp[i - 1], { yPercent: -100, opacity: 0, duration: d, ease: 'power3.in' }, t);
        c.tl.fromTo(sp[i], { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: d, ease: 'power3.out', immediateRender: false }, t + d * 0.4);
      }
    });
  });
  def('morph', '文字', '模糊变形换词：旧词变虚散开，新词从模糊中聚拢（MorphingText）。参数 words=乙/丙、every', function (c) {
    c.els.forEach(function (el) {
      var sp = wordStack(el, [el.textContent.trim()].concat(slashList(c.o.words)), false), every = num(c.o.every, 1.4), d = num(c.o.dur, 0.5);
      sp.forEach(function (s, i) { if (i) gsap.set(s, { opacity: 0 }); });
      for (var i = 1; i < sp.length; i++) {
        var t = c.t + (i - 1) * every;
        c.tl.to(sp[i - 1], { opacity: 0, filter: 'blur(12px)', scale: 0.94, duration: d, ease: 'power2.in' }, t);
        c.tl.fromTo(sp[i], { opacity: 0, filter: 'blur(12px)', scale: 1.08 }, { opacity: 1, filter: 'blur(0px)', scale: 1, duration: d, ease: 'power2.out', immediateRender: false }, t + d * 0.5);
      }
    });
  });

  def('retype', '文字', '删掉重打：把现有文字从后往前一个个删掉，再敲出新文字（TextType）。参数 v=新文字、cps=每秒打几个字、del=每秒删几个字', function (c) {
    c.els.forEach(function (el) {
      var A = splitChars(el), cps = num(c.o.cps, 16), del = num(c.o.del, cps * 1.8);
      var B = Array.from(String(c.o.v || '')).map(function (ch) {
        var s = document.createElement('span'); s.className = 'fx-ch'; s.textContent = ch === ' ' ? ' ' : ch; s.style.display = 'none'; el.appendChild(s); return s;
      });
      var nA = A.length, nB = B.length, tDel = nA / del, total = tDel + 0.15 + nB / cps, p = { k: 0 };
      var paint = function () {
        var gone = Math.min(nA, Math.floor(p.k * del)), typed = Math.max(0, Math.floor((p.k - tDel - 0.15) * cps));
        A.forEach(function (s, i) { s.style.display = i < nA - gone ? '' : 'none'; });
        B.forEach(function (s, i) { s.style.display = i < typed ? '' : 'none'; });
      };
      c.tl.to(p, { k: total, duration: total, ease: 'none', onUpdate: paint }, c.t);
    });
  });

  def('true-focus', '文字', '逐词聚焦：一次只让一个词清晰，其余变虚，取景框跳到这个词上（TrueFocus）。中文用 / 分词（如 AI/不会/替代/你），英文按空格。参数 every、blur、color', function (c) {
    c.els.forEach(function (el) {
      var ws;
      if (el.textContent.indexOf('/') >= 0) {
        el.innerHTML = el.textContent.split('/').map(function (w) { return '<span class="fx-ch">' + w.trim() + '</span>'; }).join('<span class="fx-gap"> </span>');
        ws = $$('.fx-ch', el);
      } else ws = splitWords(el);
      relPos(el);
      var box = document.createElement('i'); box.className = 'fx-focus-box';
      if (c.o.color) box.style.setProperty('--c', c.o.color);
      el.appendChild(box);
      var every = num(c.o.every, 0.8), b = num(c.o.blur, 5), d = num(c.o.dur, 0.3), pad = num(c.o.pad, 10);
      ws.forEach(function (w, k) {
        var t = c.t + k * every;
        ws.forEach(function (x, j) { c.tl.to(x, { filter: 'blur(' + (j === k ? 0 : b) + 'px)', opacity: j === k ? 1 : 0.4, duration: d, ease: 'power2.out' }, t); });
        var v = { left: w.offsetLeft - pad, top: w.offsetTop - pad, width: w.offsetWidth + pad * 2, height: w.offsetHeight + pad * 2, duration: k ? d : 0.001, ease: 'power3.out' };
        if (!k) c.tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: d }, t);
        c.tl.to(box, v, t);
      });
      if (c.o.end !== 0) {
        var te = c.t + ws.length * every;
        c.tl.to(ws, { filter: 'blur(0px)', opacity: 1, duration: d }, te);
        c.tl.to(box, { opacity: 0, duration: d }, te);
      }
    });
  });

  def('split-flap', '文字', '翻牌机：每个字先快速翻过一串随机字符，再从左到右依次停在正确的字上（SplitFlap，机场航班牌）。入场用。参数 dur、stagger、chars=字符池', function (c) {
    var pool = Array.from(c.o.chars || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), r = FX.rand(num(c.o.seed, 8));
    c.els.forEach(function (el) {
      var cs = splitChars(el), fin = cs.map(function (s) { return s.textContent; }), d = num(c.o.dur, 0.6), st = num(c.o.stagger, 0.08);
      var total = d + st * cs.length, p = { v: 0 };
      cs.forEach(function (s) { s.classList.add('fx-flap'); });
      var noise = cs.map(function () { var a = []; for (var k = 0; k < 40; k++) a.push(pool[Math.floor(r() * pool.length)]); return a; });
      var paint = function () {
        cs.forEach(function (s, i) {
          s.textContent = p.v >= d + st * i || /\s/.test(fin[i]) ? fin[i] : noise[i][Math.floor(p.v * 15 + i) % 40];
        });
      };
      paint();
      c.tl.to(p, { v: total, duration: total, ease: 'none', onUpdate: paint }, c.t);
    });
  });

  def('stroke-in', '文字', '描边字：先沿一个方向画出空心描边，再把颜色灌满（StrokeText）。参数 w=描边粗细、color=描边色、hold=空心停留秒数', function (c) {
    c.els.forEach(function (el) {
      var col = getComputedStyle(el).color, w = num(c.o.w, 2), d = num(c.o.dur, 0.6);
      el.style.webkitTextStroke = w + 'px ' + (c.o.color || col);
      c.tl.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: d, ease: 'power2.inOut' }, c.t);
      c.tl.fromTo(el, { color: 'rgba(0,0,0,0)' }, { color: col, duration: d * 0.8, ease: 'power1.out' }, c.t + d + num(c.o.hold, 0.3));
    });
  });

  def('echo', '文字', '残影入场：几层半透明的拷贝拖在后面一起滑入，到位后残影散掉（EchoText）。参数 n=残影层数、dist、dir', function (c) {
    c.els.forEach(function (el) {
      relPos(el);
      var n = num(c.o.n, 3), dist = num(c.o.dist, 140), dd = DIR[c.o.dir || 'right'] || DIR.right, d = num(c.o.dur, 0.7), html = el.innerHTML;
      c.tl.from(el, { x: rel(dd[0] * dist), y: rel(dd[1] * dist), opacity: 0, duration: d, ease: 'expo.out' }, c.t);
      for (var k = 1; k <= n; k++) {
        var g = document.createElement('span'); g.className = 'fx-echo'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = html; el.appendChild(g);
        c.tl.fromTo(g, { x: dd[0] * dist * 0.4 * k, y: dd[1] * dist * 0.4 * k, opacity: 0.5 / k }, { x: 0, y: 0, opacity: 0, duration: d + 0.15 * k, ease: 'expo.out' }, c.t);
      }
    });
  });

  /* ── 入场 / 退场（animate.css 的经典款） ── */

  def('light-speed-in', '入场', '光速入场：带着斜切从一侧高速冲进来，冲过头再回正（animate.css lightSpeedIn）。参数 dir=left|right（往哪边运动）、dist', function (c) {
    var dd = (DIR[c.o.dir || 'left'] || DIR.left)[0] || 1, dist = num(c.o.dist, 700), d = num(c.o.dur, 0.6);
    c.tl.from(c.els, { x: rel(dd * dist), opacity: 0, duration: d * 0.6, ease: 'power3.out', stagger: stag(c, 0.08) }, c.t);
    gsap.set(c.els, { skewX: -30 * dd });
    c.tl.to(c.els, { keyframes: [{ skewX: -30 * dd, duration: d * 0.55 }, { skewX: 18 * dd, duration: d * 0.18 }, { skewX: -6 * dd, duration: d * 0.14 }, { skewX: 0, duration: d * 0.13 }], ease: 'sine.out', stagger: stag(c, 0.08) }, c.t);
  });
  def('jack-in', '入场', '弹簧盒：从底部一点点弹出来，左右晃两下站稳（animate.css jackInTheBox）', function (c) {
    var d = num(c.o.dur, 0.8);
    gsap.set(c.els, { transformOrigin: '50% 100%' });
    c.tl.from(c.els, { scale: 0.1, opacity: 0, duration: d * 0.6, ease: 'back.out(1.6)', stagger: stag(c, 0.1) }, c.t);
    gsap.set(c.els, { rotation: '+=30' });
    c.tl.to(c.els, { keyframes: keyframesRel([[50, { rotation: -40 }], [70, { rotation: -27 }], [100, { rotation: -30 }]], d), stagger: stag(c, 0.1) }, c.t);
  });
  def('hinge', '退场', '铰链掉落：左上角像钉了一颗钉子，晃两下后掉出画面（animate.css hinge）。参数 dist', function (c) {
    var d = num(c.o.dur, 1.8), dist = num(c.o.dist, 800);
    gsap.set(c.els, { transformOrigin: '0% 0%' });
    c.tl.to(c.els, { keyframes: keyframesRel([[25, { rotation: 80 }], [50, { rotation: 60 }], [75, { rotation: 80 }], [100, { rotation: 60 }]], d * 0.8, 'power1.inOut'), stagger: stag(c, 0.1) }, c.t);
    c.tl.to(c.els, { y: rel(dist), opacity: 0, duration: d * 0.2, ease: 'power2.in', stagger: stag(c, 0.1) }, c.t + d * 0.8);
  });
  def('fall-out', '退场', '文字掉落：每个字带着旋转往下掉出画面（FallingText），一般配 chars: 用。参数 dist、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 5)), dist = num(c.o.dist, 700), d = num(c.o.dur, 0.9);
    c.els.map(function (e) { return [r(), e]; }).sort(function (a, b) { return a[0] - b[0]; }).forEach(function (p, i) {
      c.tl.to(p[1], { y: rel(dist + r() * 200), x: rel((r() * 2 - 1) * 80), rotation: rel((r() * 2 - 1) * 90), opacity: 0, duration: d, ease: 'power2.in' }, c.t + i * num(c.o.stagger, 0.04));
    });
  });

  /* ── 强调：animate.css 的「吸引注意」系列 ── */

  function seeker(name, desc, frames, dur, origin) {
    def(name, '强调', desc, function (c) {
      if (origin) gsap.set(c.els, { transformOrigin: origin });
      c.tl.to(c.els, { keyframes: keyframesRel(frames, num(c.o.dur, dur)), stagger: stag(c, 0.08) }, c.t);
    });
  }
  seeker('tada', '欢呼：先缩一下，再放大着左右摇摆（animate.css tada）',
    [[10, { scale: 0.9, rotation: -3 }], [20, { scale: 0.9, rotation: -3 }], [30, { scale: 1.1, rotation: 3 }], [40, { rotation: -3 }], [50, { rotation: 3 }], [60, { rotation: -3 }], [70, { rotation: 3 }], [80, { rotation: -3 }], [90, { rotation: 3 }], [100, { scale: 1, rotation: 0 }]], 1);
  seeker('jello', '果冻：斜切着来回晃，幅度越来越小（animate.css jello）',
    [[22, { skewX: -12.5, skewY: -12.5 }], [33, { skewX: 6.25, skewY: 6.25 }], [44, { skewX: -3.1, skewY: -3.1 }], [55, { skewX: 1.56, skewY: 1.56 }], [66, { skewX: -0.78, skewY: -0.78 }], [77, { skewX: 0.39, skewY: 0.39 }], [100, { skewX: 0, skewY: 0 }]], 0.9);
  seeker('rubber-band', '橡皮筋：横向拉长、纵向压扁，来回弹几下（animate.css rubberBand）',
    [[30, { scaleX: 1.25, scaleY: 0.75 }], [40, { scaleX: 0.75, scaleY: 1.25 }], [50, { scaleX: 1.15, scaleY: 0.85 }], [65, { scaleX: 0.95, scaleY: 1.05 }], [75, { scaleX: 1.05, scaleY: 0.95 }], [100, { scaleX: 1, scaleY: 1 }]], 1);
  seeker('heartbeat', '心跳：连续两下放大（animate.css heartBeat）',
    [[14, { scale: 1.3 }], [28, { scale: 1 }], [42, { scale: 1.3 }], [70, { scale: 1 }], [100, { scale: 1 }]], 1.3);
  seeker('head-shake', '摇头：带一点 3D 转动的左右摇（否定、不对）（animate.css headShake）',
    [[6.5, { x: -6, rotationY: -9 }], [18.5, { x: 5, rotationY: 7 }], [31.5, { x: -3, rotationY: -5 }], [43.5, { x: 2, rotationY: 3 }], [50, { x: 0, rotationY: 0 }], [100, { x: 0 }]], 1);
  seeker('wobble', '摇晃：边平移边歪着来回晃（animate.css wobble）',
    [[15, { xPercent: -25, rotation: -5 }], [30, { xPercent: 20, rotation: 3 }], [45, { xPercent: -15, rotation: -3 }], [60, { xPercent: 10, rotation: 2 }], [75, { xPercent: -5, rotation: -1 }], [100, { xPercent: 0, rotation: 0 }]], 1);

  /* ── 强调：Magic UI / React Bits 系列 ── */

  def('border-beam', '强调', '边框流光：一小段光沿着元素边框绕圈跑（BorderBeam / StarBorder）。参数 color、w=粗细、len=光带占周长比例、n=绕几圈、dur=每圈秒数、keep=1 跑完不消失', function (c) {
    c.els.forEach(function (el) {
      relPos(el);
      var w = num(c.o.w, 3), rr = num(c.o.r, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12), W = el.offsetWidth, H = el.offsetHeight;
      var svg = svgEl('svg', { width: W, height: H, 'class': 'fx-beam-border' }), rect = svgEl('rect', { x: w / 2, y: w / 2, width: W - w, height: H - w, rx: rr, fill: 'none', 'stroke-width': w, 'stroke-linecap': 'round' });
      rect.style.stroke = c.o.color || 'var(--fx-accent)';
      svg.style.color = c.o.color || 'var(--fx-accent)';
      svg.appendChild(rect); el.appendChild(svg);
      var per = 2 * (W - w + H - w) - (8 - 2 * Math.PI) * Math.min(rr, (W - w) / 2, (H - w) / 2), seg = per * num(c.o.len, 0.18);
      rect.setAttribute('stroke-dasharray', seg.toFixed(1) + ' ' + (per - seg).toFixed(1));
      var n = num(c.o.n, 2), d = num(c.o.dur, 1.6);
      gsap.set(svg, { opacity: 0 });
      c.tl.to(svg, { opacity: 1, duration: 0.2 }, c.t);
      c.tl.fromTo(rect, { strokeDashoffset: 0 }, { strokeDashoffset: -per * n, duration: d * n, ease: 'none' }, c.t);
      if (!c.o.keep) c.tl.to(svg, { opacity: 0, duration: 0.3 }, c.t + d * n - 0.3);
    });
  });

  def('spotlight', '强调', '聚光灯：画面压暗，只留一个圆形亮区罩住目标；同一场景里再调一次，光圈会移到新目标（Spotlight）。写在要照的元素上，或 to=#id。参数 r=半径、dim=暗度 0~1、off=1 关灯', function (c) {
    var sc = hostOf(c), ov = sc.__fxSpot, d = num(c.o.dur, 0.5);
    if (!ov) { ov = document.createElement('div'); ov.className = 'fx-spot'; sc.appendChild(ov); sc.__fxSpot = ov; gsap.set(ov, { opacity: 0 }); }
    if (c.o.dim) ov.style.setProperty('--a', c.o.dim);
    if (c.o.off) { c.tl.to(ov, { opacity: 0, duration: d, ease: 'power1.out' }, c.t); return; }
    var tg = c.o.to ? $(c.o.to) : c.el, R = FX.rect(tg);
    if (!R) { console.warn('FX spotlight：找不到目标', c.o.to); return; }
    var rad = num(c.o.r, Math.max(R.w, R.h) * 0.62 + 30);
    if (!ov.__init) { ov.__init = 1; ov.style.setProperty('--x', R.cx + 'px'); ov.style.setProperty('--y', R.cy + 'px'); ov.style.setProperty('--r', rad + 'px'); }
    c.tl.to(ov, { '--x': R.cx + 'px', '--y': R.cy + 'px', '--r': rad + 'px', opacity: 1, duration: d, ease: 'power3.inOut' }, c.t);
  });

  def('confetti', '强调', '撒彩纸：从元素中心炸开一把彩纸，抛起再落下（Confetti / ClickSpark）。参数 n、colors=色1/色2/色3、power=力度、seed', function (c) {
    var sc = hostOf(c), r = FX.rand(num(c.o.seed, 12)), cols = slashList(c.o.colors);
    if (!cols.length) cols = ['#ff5b56', '#ffd34d', '#4fc3f7', '#8453e8', '#3fbf5a', '#ff8fab'];
    c.els.forEach(function (el) {
      var R = FX.rect(el), n = num(c.o.n, 60), pw = num(c.o.power, 1), d = num(c.o.dur, 1.6), wrap = document.createElement('div');
      wrap.className = 'fx-confetti'; sc.appendChild(wrap);
      for (var i = 0; i < n; i++) {
        var p = document.createElement('i'), ang = -Math.PI / 2 + (r() * 2 - 1) * 1.15, sp = (380 + r() * 460) * pw, w = 8 + r() * 10, tp = d * (0.3 + r() * 0.1);
        p.style.cssText = 'left:' + R.cx.toFixed(1) + 'px;top:' + R.cy.toFixed(1) + 'px;width:' + w.toFixed(1) + 'px;height:' + (w * 0.45).toFixed(1) + 'px;background:' + cols[i % cols.length];
        wrap.appendChild(p);
        gsap.set(p, { opacity: 0 });
        var vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
        c.tl.set(p, { opacity: 1, x: 0, y: 0 }, c.t);
        c.tl.to(p, { x: vx * 0.9, duration: d, ease: 'power1.out' }, c.t);
        c.tl.to(p, { keyframes: [{ y: vy * 0.55, duration: tp, ease: 'power2.out' }, { y: vy * 0.55 + (650 + r() * 250) * pw, duration: d - tp, ease: 'power2.in' }] }, c.t);
        c.tl.to(p, { rotation: (r() * 2 - 1) * 720, rotationX: r() * 720, duration: d, ease: 'none' }, c.t);
        c.tl.to(p, { opacity: 0, duration: 0.3 }, c.t + d - 0.3);
      }
    });
  });

  def('sparkle', '强调', '闪烁星点：元素四周随机冒出小星星，一闪一闪（SparklesText）。参数 n、color、dur、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 18));
    c.els.forEach(function (el) {
      relPos(el);
      var n = num(c.o.n, 10), d = num(c.o.dur, 2);
      for (var i = 0; i < n; i++) {
        var s = document.createElement('i'), size = 12 + r() * 16;
        s.className = 'fx-star';
        s.style.cssText = 'left:' + (-8 + r() * 108).toFixed(1) + '%;top:' + (-25 + r() * 140).toFixed(1) + '%;--s:' + size.toFixed(0) + 'px' + (c.o.color ? ';--c:' + c.o.color : '');
        el.appendChild(s);
        gsap.set(s, { scale: 0, rotation: 0 });
        var t = c.t + r() * Math.max(0.1, d - 0.6);
        c.tl.to(s, { keyframes: [{ scale: 1, rotation: 45, duration: 0.25, ease: 'back.out(3)' }, { scale: 0, rotation: 90, duration: 0.35, ease: 'power2.in' }] }, t);
      }
    });
  });

  def('orbit', '强调', '环绕：把容器的子元素均匀摆在一个圆上，绕中心转，子元素始终保持正立（OrbitingCircles）。写在容器上。参数 r=半径、turns=圈数、dur、reverse=1 反转', function (c) {
    var kids = Array.prototype.slice.call(c.el.children), n = kids.length, rad = num(c.o.r, 180), turns = num(c.o.turns, 1) * (c.o.reverse ? -1 : 1), d = num(c.o.dur, c.sceneDur || 6);
    relPos(c.el);
    kids.forEach(function (k, i) {
      var arm = document.createElement('div'); arm.className = 'fx-orbit-arm';
      c.el.insertBefore(arm, k); arm.appendChild(k);
      k.style.position = 'absolute'; k.style.left = '0'; k.style.top = '0';
      var a0 = i / n * 360;
      gsap.set(arm, { rotation: a0 });
      gsap.set(k, { x: rad, rotation: -a0, xPercent: -50, yPercent: -50 });
      c.tl.to(arm, { rotation: rel(360 * turns), duration: d, ease: 'none' }, c.t);
      c.tl.to(k, { rotation: rel(-360 * turns), duration: d, ease: 'none' }, c.t);
    });
  });

  def('beam', '强调', '连接光束：在两个元素之间画一条弧线，一团光沿线流过去（AnimatedBeam，适合画「A 把数据传给 B」）。写在起点元素上，to=#终点。参数 curve=弯曲度、color、n=流几次、dur', function (c) {
    var sc = hostOf(c), b = FX.rect($(c.o.to)), a = FX.rect(c.el);
    if (!b) { console.warn('FX beam：找不到终点', c.o.to); return; }
    var mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2, dx = b.cx - a.cx, dy = b.cy - a.cy, L0 = Math.hypot(dx, dy) || 1, cv = num(c.o.curve, 0.25);
    var qx = mx - dy / L0 * L0 * cv, qy = my + dx / L0 * L0 * cv, dpath = 'M' + a.cx.toFixed(1) + ' ' + a.cy.toFixed(1) + ' Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' + b.cx.toFixed(1) + ' ' + b.cy.toFixed(1);
    var svg = svgEl('svg', { 'class': 'fx-beam' }), base = svgEl('path', { d: dpath, fill: 'none', 'stroke-width': 3, 'stroke-linecap': 'round' }), glow = svgEl('path', { d: dpath, fill: 'none', 'stroke-width': 6, 'stroke-linecap': 'round' });
    var col = c.o.color || 'var(--fx-accent)';
    base.style.stroke = col; base.style.opacity = 0.25; glow.style.stroke = col; svg.style.color = col;
    svg.appendChild(base); svg.appendChild(glow); sc.appendChild(svg);
    var L = base.getTotalLength(), seg = L * 0.22, n = num(c.o.n, 2), d = num(c.o.dur, 1.1), gap = num(c.o.gap, 0.2);
    glow.setAttribute('stroke-dasharray', seg.toFixed(1) + ' ' + (L + seg).toFixed(1));
    c.tl.fromTo(base, { strokeDasharray: L + ' ' + L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, c.t);
    gsap.set(glow, { strokeDashoffset: seg });
    for (var k = 0; k < n; k++) c.tl.fromTo(glow, { strokeDashoffset: seg }, { strokeDashoffset: -L, duration: d, ease: 'power1.inOut', immediateRender: false }, c.t + 0.3 + k * (d + gap));
  });

  def('flip-swap', '强调', '翻面换内容：元素绕竖轴翻过去，背面换成第二个子元素再翻回来（翻牌、揭晓答案）。元素里放两个子元素：第一个是正面，第二个是背面。参数 axis=y|x', function (c) {
    c.els.forEach(function (el) {
      var kids = Array.prototype.slice.call(el.children).filter(function (k) { return !/(^|\s)fx-/.test(k.getAttribute('class') || ''); });
      if (kids.length < 2) { console.warn('FX flip-swap：需要两个子元素（正面、背面）', el); return; }
      var d = num(c.o.dur, 0.6), ax = c.o.axis === 'x' ? 'rotationX' : 'rotationY', a = {}, b = {}, e = {};
      gsap.set(el, { transformPerspective: 1000 });
      gsap.set(kids[1], { display: 'none' });
      a[ax] = rel(90); a.duration = d / 2; a.ease = 'power2.in';
      c.tl.to(el, a, c.t);
      c.tl.set(kids[0], { display: 'none' }, c.t + d / 2);
      c.tl.set(kids[1], { display: '' }, c.t + d / 2);
      b[ax] = rel(-180); b.duration = 0.001;
      c.tl.to(el, b, c.t + d / 2);
      e[ax] = rel(90); e.duration = d / 2; e.ease = 'power2.out';
      c.tl.to(el, e, c.t + d / 2 + 0.001);
    });
  });

  /* ── 镜头 / 背景 ── */

  def('meteors', '镜头', '流星雨：一根根斜着划过的光线（Meteors），写在铺满的背景层上。参数 n、angle=方向角度（默认 135 = 往左下）、color、dur、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 31)), n = num(c.o.n, 18), d = num(c.o.dur, c.sceneDur || 5), ang = num(c.o.angle, 135), rad = ang * Math.PI / 180;
    var ux = Math.cos(rad), uy = Math.sin(rad), el = c.el;
    relPos(el); el.style.overflow = 'hidden';
    var W = el.offsetWidth || 1920, H = el.offsetHeight || 1080;
    for (var i = 0; i < n; i++) {
      var m = document.createElement('i'), len = 120 + r() * 160, travel = 700 + r() * 600, life = 0.9 + r() * 0.8;
      m.className = 'fx-meteor';
      m.style.cssText = 'left:' + (W * (0.15 + r() * 1.0)).toFixed(0) + 'px;top:' + (-H * 0.2 + r() * H * 0.6).toFixed(0) + 'px;width:' + len.toFixed(0) + 'px' + (c.o.color ? ';--c:' + c.o.color : '');
      el.appendChild(m);
      gsap.set(m, { rotation: ang, opacity: 0 });
      var t = c.t + r() * Math.max(0.1, d - life);
      c.tl.fromTo(m, { x: 0, y: 0 }, { x: ux * travel, y: uy * travel, duration: life, ease: 'none', immediateRender: false }, t);
      c.tl.to(m, { keyframes: [{ opacity: 1, duration: life * 0.15 }, { opacity: 1, duration: life * 0.6 }, { opacity: 0, duration: life * 0.25 }] }, t);
    }
  });

  def('marquee', '镜头', '跑马灯：一排内容无限循环地横向滚动（Marquee / LogoLoop）。写在一行的容器上，子元素会自动复制补满。参数 speed=每秒像素、reverse=1 反向', function (c) {
    var el = c.el, d = num(c.o.dur, c.sceneDur || 6), sp = num(c.o.speed, 120) * (c.o.reverse ? -1 : 1);
    el.style.overflow = 'hidden';
    var track = document.createElement('div'); track.className = 'fx-marquee';
    while (el.firstChild) track.appendChild(el.firstChild);
    el.appendChild(track);
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0, unit = track.scrollWidth + gap, orig = Array.prototype.slice.call(track.children);
    var copies = Math.ceil((el.offsetWidth || 1920) / Math.max(unit, 1)) + 1;
    for (var k = 0; k < copies; k++) orig.forEach(function (n) { var cl = n.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); track.appendChild(cl); });
    c.tl.fromTo(track, { x: 0 }, { x: -sp * d, duration: d, ease: 'none', modifiers: { x: gsap.utils.unitize(function (x) { return gsap.utils.wrap(-unit, 0, parseFloat(x)); }) } }, c.t);
  });

  def('bg-scroll', '镜头', '背景图案滚动：让 background（网格、纹理、条纹）按速度持续平移，配 retro-grid 组件用。参数 x、y=每秒像素', function (c) {
    var d = num(c.o.dur, c.sceneDur || 5);
    c.els.forEach(function (el) {
      var t = el.querySelector('.fx-grid-plane') || el;
      c.tl.fromTo(t, { backgroundPosition: '0px 0px' }, { backgroundPosition: (num(c.o.x, 0) * d).toFixed(1) + 'px ' + (num(c.o.y, 60) * d).toFixed(1) + 'px', duration: d, ease: 'none' }, c.t);
    });
  });

  def('parallax', '镜头', '视差：容器里的各层按前后顺序以不同速度平移（后面的层动得少、前面的层动得多），配 hills 层叠纸山用。写在容器上。参数 x、y=最前层的总位移、dur', function (c) {
    var kids = Array.prototype.slice.call(c.el.children), n = kids.length, d = num(c.o.dur, c.sceneDur || 5);
    kids.forEach(function (k, i) {
      var f = (i + 1) / n;
      c.tl.to(k, { x: rel(num(c.o.x, -120) * f), y: rel(num(c.o.y, 0) * f), duration: d, ease: EZ(c.o.ease, 'linear') }, c.t);
    });
  });

  /* ── 剪纸 ── */

  /** 锯齿边多边形：p=0 全部藏起，p=1 全部露出；dir 是露出的推进方向 */
  function edgePoly(p, dir, jag, teeth, rnd) {
    if (p >= 1) return 'none';
    var e = p * (100 + jag * 2) - jag, pts = [], k;
    var side = dir === 'right' || dir === 'left';
    for (k = 0; k <= teeth; k++) {
      var along = k / teeth * 100, off = e + (k % 2 ? rnd[k] * jag : -rnd[k] * jag * 0.3);
      if (side) pts.push([dir === 'right' ? off : 100 - off, along]);
      else pts.push([along, dir === 'down' ? off : 100 - off]);
    }
    if (dir === 'right') pts = [[-1, -1]].concat(pts).concat([[-1, 101]]);
    else if (dir === 'left') pts = [[101, -1]].concat(pts).concat([[101, 101]]);
    else if (dir === 'down') pts = [[-1, -1]].concat(pts).concat([[101, -1]]);
    else pts = [[-1, 101]].concat(pts).concat([[101, 101]]);
    return 'polygon(' + pts.map(function (q) { return q[0].toFixed(2) + '% ' + q[1].toFixed(2) + '%'; }).join(',') + ')';
  }
  FX.edgePoly = edgePoly;

  def('paper-unfold', '剪纸', '纸张展开：像对折的纸从折痕处翻开摊平，带一点回弹。参数 dir=down|up|left|right（往哪边展开）', function (c) {
    var o = { down: ['50% 0%', 'rotationX', -95], up: ['50% 100%', 'rotationX', 95], right: ['0% 50%', 'rotationY', 95], left: ['100% 50%', 'rotationY', -95] }[c.o.dir || 'down'] || ['50% 0%', 'rotationX', -95];
    gsap.set(c.els, { transformOrigin: o[0], transformPerspective: num(c.o.persp, 1200) });
    var from = { opacity: 0 }; from[o[1]] = o[2];
    enter(c, from, { dur: 0.8, ease: 'back.out(1.3)', stagger: 0.12 });
  });

  def('cut-in', '剪纸', '剪刀剪开：沿一条锯齿边一刀一刀地把元素「剪」出来，逐格推进有剪纸感。参数 dir=right|left|down|up、teeth=锯齿数、jag=锯齿深度（%）、snips=剪几刀', function (c) {
    var r = FX.rand(num(c.o.seed, 9)), dir = c.o.dir || 'right', teeth = num(c.o.teeth, 18), jag = num(c.o.jag, 6), d = num(c.o.dur, 0.9), snips = num(c.o.snips, 9);
    c.els.forEach(function (el) {
      var rnd = []; for (var k = 0; k <= teeth; k++) rnd.push(0.5 + r() * 0.5);
      var p = { v: 0 }, paint = function () { el.style.clipPath = edgePoly(p.v, dir, jag, teeth, rnd); };
      paint();
      c.tl.to(p, { v: 1, duration: d, ease: c.o.ease ? EZ(c.o.ease) : 'steps(' + snips + ')', onUpdate: paint }, c.t);
    });
  });

  def('peel-in', '剪纸', '卷角揭开：像贴纸从一个角翘起的状态落回原位按平。参数 corner=tl|tr|bl|br（从哪个角）', function (c) {
    var m = { tl: ['0% 0%', 1, 1], tr: ['100% 0%', -1, 1], bl: ['0% 100%', 1, -1], br: ['100% 100%', -1, -1] }[c.o.corner || 'tl'] || ['0% 0%', 1, 1];
    gsap.set(c.els, { transformOrigin: m[0], transformPerspective: 900 });
    enter(c, { opacity: 0, rotationY: -70 * m[1], rotationX: 30 * m[2], rotation: rel(-8 * m[1]) }, { dur: 0.75, ease: 'back.out(1.4)', stagger: 0.12 });
  });

  def('layer-rise', '剪纸', '逐层升起：容器里的纸层从后往前依次从下方升起，越靠前升得越晚、越远（层叠纸山、纸片舞台）。写在容器上。参数 dist、stagger', function (c) {
    var kids = Array.prototype.slice.call(c.el.children), dist = num(c.o.dist, 180), st = num(c.o.stagger, 0.15), d = num(c.o.dur, 0.8);
    kids.forEach(function (k, i) { c.tl.from(k, { y: rel(dist + i * 60), duration: d + i * 0.08, ease: EZ(c.o.ease, 'back.out(1.2)') }, c.t + i * st); });
  });

  def('stick-on', '剪纸', '贴纸拍上：从镜头前方带着大投影拍到纸面上，落定时投影收紧（贴标签、贴照片）。参数 from=起始缩放、rot=起始歪斜角度', function (c) {
    enter(c, { opacity: 0, scale: num(c.o.from, 1.35), rotation: rel(num(c.o.rot, -10)), boxShadow: '0px 40px 50px rgba(40,25,10,0.35)' }, { dur: 0.42, ease: 'back.out(2.2)', stagger: 0.1 });
  });

  def('stop-in', '剪纸', '定格入场：以每秒 12 格的定格动画节奏跳进来，每一格带一点随机歪斜（手工动画感）。参数 dist、steps=跳几格、fps、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 4)), fps = num(c.o.fps, 12), n = num(c.o.steps, 6), dist = num(c.o.dist, 80);
    c.els.forEach(function (el, j) {
      var t0 = c.t + j * num(c.o.stagger, 0.12);
      gsap.set(el, { opacity: 0 });
      for (var k = 0; k <= n; k++) {
        var f = k / n, last = k === n;
        c.tl.set(el, { opacity: k ? 1 : 0, y: last ? 0 : dist * (1 - f) * (1 - f), rotation: last ? 0 : (r() * 2 - 1) * 5, scale: last ? 1 : 0.85 + 0.15 * f }, t0 + k / fps);
      }
    });
  });

  def('jitter', '剪纸', '定格抖动：以每秒 12 格不停地微微歪动、挪动，像手工逐格拍出来的（boiling）。建议加在外层容器上，免得和入场动效抢位置。参数 amp=角度、px=位移、fps、dur', function (c) {
    var r = FX.rand(num(c.o.seed, 6)), fps = num(c.o.fps, 12), d = num(c.o.dur, c.sceneDur || 3), a = num(c.o.amp, 1.2), px = num(c.o.px, 1.5);
    c.els.forEach(function (el) {
      for (var t = 0; t < d; t += 1 / fps) c.tl.set(el, { rotation: (r() * 2 - 1) * a, x: (r() * 2 - 1) * px, y: (r() * 2 - 1) * px }, c.t + t);
      c.tl.set(el, { rotation: 0, x: 0, y: 0 }, c.t + d);
    });
  });

  def('lift', '剪纸', '纸片抬起：往上浮起一点、投影变大变淡，像被手指捏起来；down=1 放回去。参数 dist', function (c) {
    var dist = num(c.o.dist, 14), d = num(c.o.dur, 0.4);
    c.tl.to(c.els, c.o.down
      ? { y: rel(dist), scale: 1, boxShadow: '0px 8px 14px rgba(60,40,20,0.22)', duration: d, ease: 'power2.in', stagger: stag(c, 0.06) }
      : { y: rel(-dist), scale: 1.03, boxShadow: '0px 28px 36px rgba(60,40,20,0.26)', duration: d, ease: 'power2.out', stagger: stag(c, 0.06) }, c.t);
  });

  def('flutter', '剪纸', '飘动：像纸片被风吹了一下，左右摆几下慢慢停住。参数 deg、n=摆几下、origin', function (c) {
    var deg = num(c.o.deg, 8), n = num(c.o.n, 4), d = num(c.o.dur, 1.4), fr = [];
    for (var i = 0; i < n; i++) fr.push([(i + 1) / (n + 1) * 100, { rotation: deg * (1 - i / n) * (i % 2 ? -1 : 1) }]);
    fr.push([100, { rotation: 0 }]);
    gsap.set(c.els, { transformOrigin: c.o.origin || '50% 0%' });
    c.tl.to(c.els, { keyframes: keyframesRel(fr, d), stagger: stag(c, 0.1) }, c.t);
  });

  def('sway', '剪纸', '悬挂摇摆：挂着的东西（灯笼、吊牌、窗花）持续缓慢地左右摆。参数 deg、period=一个来回秒数、dur', function (c) {
    var deg = num(c.o.deg, 4), period = num(c.o.period, 2.4), d = num(c.o.dur, c.sceneDur || 5);
    gsap.set(c.els, { transformOrigin: c.o.origin || '50% 0%' });
    c.els.forEach(function (el, i) {
      c.tl.fromTo(el, { rotation: -deg }, { rotation: deg, duration: period / 2, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.round(d / (period / 2))) - 1 }, c.t + i * 0.25);
    });
  });

  /* ── 转场 ── */

  defT('paper-slide', '抽纸：新的一页纸从一侧滑进来盖住旧页，边缘带投影，旧页稍微压暗。参数 dir=left|right|up|down', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.6), dir = o.dir || 'left', ax = dir === 'left' || dir === 'right' ? 'xPercent' : 'yPercent', s = dir === 'left' || dir === 'up' ? 1 : -1;
    var a = { boxShadow: '0px 0px 60px rgba(30,20,10,0.45)' }, b = { boxShadow: '0px 0px 0px rgba(30,20,10,0)', duration: d, ease: EZ(o.ease, 'power3.inOut') };
    a[ax] = 100 * s; b[ax] = 0;
    tl.fromTo(next, a, b, t);
    if (prev) tl.to(prev, { filter: 'brightness(0.75)', scale: 0.97, duration: d, ease: 'power2.inOut' }, t);
    return d;
  });
  defT('tear', '撕纸：新画面沿一条参差的撕裂边从一侧露出来（剪纸风换场景）。参数 dir=right|left|down|up、jag、teeth', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.7), r = FX.rand(num(o.seed, 14)), teeth = num(o.teeth, 28), jag = num(o.jag, 5), dir = o.dir || 'right', rnd = [];
    for (var k = 0; k <= teeth; k++) rnd.push(0.3 + r() * 0.7);
    var p = { v: 0 }, paint = function () { next.style.clipPath = edgePoly(p.v, dir, jag, teeth, rnd); };
    tl.to(p, { v: 1, duration: d, ease: EZ(o.ease, 'power2.inOut'), onUpdate: paint }, t);
    return d;
  });
  defT('glitch-cut', '故障闪切：新画面带红蓝错位闪几下再稳定下来（科技感切换）', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.24), fr = [[0, 40, 1], [0.04, 0, 0], [0.08, -24, 1], [0.12, 0, 0], [0.16, 12, 1], [d, 0, 1]];
    fr.forEach(function (f) {
      tl.set(next, { x: f[1], opacity: f[2], filter: f[1] ? 'drop-shadow(' + (f[1] * 0.3).toFixed(1) + 'px 0px 0px #ff2a6d) drop-shadow(' + (-f[1] * 0.3).toFixed(1) + 'px 0px 0px #05d9e8)' : 'none' }, t + f[0]);
    });
    return d;
  });
  defT('open', '开门：新画面从中间一条缝向两边拉开。参数 dir=x（左右拉开）|y（上下拉开）', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.6), y = o.dir === 'y';
    tl.fromTo(next, { clipPath: y ? 'inset(50% 0% 50% 0%)' : 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: d, ease: EZ(o.ease, 'power3.inOut') }, t);
    return d;
  });

  /* ── v1.4 新增转场（6 种）与文案驱动动效 ── */

  defT('shatter', '碎裂崩塌：画面裂成 3D 碎片翻转坠落，露出下一幕（适合崩溃、破局、反转）。参数 cols、colors=色1/色2、dur、seed', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.85), cols = num(o.cols, 10), W = STAGE.offsetWidth || 1920, H = STAGE.offsetHeight || 1080;
    var size = Math.ceil(W / cols), rows = Math.ceil(H / size), r = FX.rand(num(o.seed, 19));
    var pal = slashList(o.colors);
    if (!pal.length) { var cs = getComputedStyle(STAGE), v = function (k, d) { return (cs.getPropertyValue(k) || '').trim() || d; };   // 默认跟着皮肤走，不再是固定的红黄蓝
      pal = [v('--fx-ink', '#1d1b19'), v('--fx-accent', '#d8432b'), v('--fx-accent-2', '#ffcf3f'), v('--fx-card', '#fbf6ea'), v('--fx-accent', '#2f7de1')]; }
    var wrap = document.createElement('div');
    wrap.className = 'fx-overlay';
    wrap.style.cssText += ';opacity:1;background:none;perspective:900px;overflow:hidden;visibility:hidden';
    var shards = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var s = document.createElement('i'), col = pal[Math.floor(r() * pal.length)];
      s.style.cssText = 'position:absolute;left:' + x * size + 'px;top:' + y * size + 'px;width:' + (size + 2) + 'px;height:' + (size + 2) +
        'px;background:' + col + ';border:2px solid rgba(0,0,0,.45);box-sizing:border-box;visibility:hidden;backface-visibility:visible';
      wrap.appendChild(s);
      shards.push({ el: s, k: r(), cx: (x + 0.5) / cols - 0.5, cy: (y + 0.5) / rows - 0.5 });
    }
    STAGE.appendChild(wrap);
    var pre = 0.14;
    tl.set(wrap, { visibility: 'visible' }, Math.max(0, t - pre));
    shards.sort(function (a, b) { return a.k - b.k; }).forEach(function (sh, i) {
      var appear = Math.max(0, t - pre) + (i / shards.length) * (pre * 0.85);
      tl.set(sh.el, { visibility: 'visible', opacity: 1, x: 0, y: 0, scale: 1, rotation: 0, rotationX: 0, rotationY: 0 }, appear);
      var vx = sh.cx * (420 + r() * 380) + (r() - 0.5) * 160;
      var vy = sh.cy * 260 + 520 + r() * 420;
      var dur = d * (0.65 + r() * 0.35);
      tl.to(sh.el, {
        x: vx, y: vy, rotation: (r() - 0.5) * 260, rotationX: (r() - 0.5) * 520, rotationY: (r() - 0.5) * 520,
        scale: 0.25, opacity: 0, duration: dur, ease: 'power2.in'
      }, t + (i / shards.length) * 0.08);
    });
    tl.set(wrap, { visibility: 'hidden' }, t + d + 0.1);
    return 0;
  });

  defT('diagonal-split', '斜切拉开：一道发光刀光斜劈画面，向两侧凌厉拉开露出新场景（动漫分镜感）。参数 angle=斜度、color、dur', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.65), s = num(o.angle, 18), col = o.color || 'var(--fx-accent)';
    var p = { v: 0 };
    var svg = svgEl('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'class': 'fx-overlay' });
    svg.style.cssText += ';opacity:1;background:none;visibility:hidden';
    var l1 = svgEl('line', { 'stroke-width': '0.9', stroke: col }), l2 = svgEl('line', { 'stroke-width': '0.9', stroke: col });
    svg.appendChild(l1); svg.appendChild(l2); STAGE.appendChild(svg);
    var paint = function () {
      if (p.v >= 0.999) { next.style.clipPath = 'none'; return; }
      var w = p.v * (70 + Math.abs(s));
      var a1 = 50 + s - w, a2 = 50 + s + w, b1 = 50 - s - w, b2 = 50 - s + w;
      next.style.clipPath = 'polygon(' + a1.toFixed(2) + '% 0%,' + a2.toFixed(2) + '% 0%,' + b2.toFixed(2) + '% 100%,' + b1.toFixed(2) + '% 100%)';
      l1.setAttribute('x1', a1.toFixed(2)); l1.setAttribute('y1', '0'); l1.setAttribute('x2', b1.toFixed(2)); l1.setAttribute('y2', '100');
      l2.setAttribute('x1', a2.toFixed(2)); l2.setAttribute('y1', '0'); l2.setAttribute('x2', b2.toFixed(2)); l2.setAttribute('y2', '100');
    };
    tl.set(svg, { visibility: 'visible', opacity: 1 }, t);
    tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: EZ(o.ease, 'expo.inOut'), onUpdate: paint }, t);
    tl.to(svg, { opacity: 0, duration: 0.18 }, t + d * 0.78);
    tl.set(svg, { visibility: 'hidden' }, t + d + 0.02);
    return d;
  });

  defT('blinds', '百叶窗翻转：新画面切成多根条带，按波浪顺序逐条翻开盖住旧画面。参数 n=条数、dir=x|y、dur', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.7), n = Math.max(2, num(o.n, 10)), vert = (o.dir || 'x') !== 'y', span = 0.45, p = { v: 0 };
    var paint = function () {
      if (p.v >= 0.999) { next.style.clipPath = 'none'; return; }
      var pts = [];
      for (var i = 0; i < n; i++) {
        var u = clamp((p.v * (1 + span) - (i / n) * span), 0, 1);
        u = u * u * (3 - 2 * u);
        var a = (i / n) * 100, b = ((i + u) / n) * 100 + (u > 0 ? 0.08 : 0);
        if (vert) pts.push(a.toFixed(2) + '% 0%,' + a.toFixed(2) + '% 100%,' + b.toFixed(2) + '% 100%,' + b.toFixed(2) + '% 0%');
        else pts.push('0% ' + a.toFixed(2) + '%,100% ' + a.toFixed(2) + '%,100% ' + b.toFixed(2) + '%,0% ' + b.toFixed(2) + '%');
      }
      next.style.clipPath = 'polygon(' + pts.join(',') + ')';
    };
    tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: 'none', onUpdate: paint }, t);
    return d;
  });

  defT('crt-off', '老电视换台：旧画面压扁成高亮扫描线收缩，随即闪开新画面（复古极客感）。参数 color、dur', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.65), h1 = d * 0.45, h2 = d * 0.55, col = o.color || '#ffffff';
    STAGE.style.backgroundColor = STAGE.style.backgroundColor || '#09090d';
    var line = document.createElement('div');
    line.className = 'fx-overlay';
    line.style.cssText += ';background:none;opacity:1;visibility:hidden;display:grid;place-items:center';
    var beam = document.createElement('i');
    beam.style.cssText = 'width:100%;height:8px;background:' + col + ';box-shadow:0 0 28px ' + col + ',0 0 60px var(--fx-accent)';
    line.appendChild(beam); STAGE.appendChild(line);
    if (prev) {
      tl.to(prev, { scaleY: 0.008, scaleX: 1.06, filter: 'brightness(3.2)', duration: h1, ease: 'power3.in' }, Math.max(0, t - h1));
      tl.set(prev, { scaleY: 1, scaleX: 1, filter: 'none' }, t + 0.02);
    }
    tl.set(line, { visibility: 'visible' }, Math.max(0, t - 0.06));
    tl.fromTo(beam, { scaleX: 1, scaleY: 1.6, opacity: 1 }, { scaleX: 0.02, scaleY: 3, opacity: 0, duration: 0.18, ease: 'power2.out' }, Math.max(0, t - 0.04));
    tl.set(line, { visibility: 'hidden' }, t + 0.16);
    tl.fromTo(next, { scaleY: 0.012, filter: 'brightness(2.6)' }, { scaleY: 1, filter: 'brightness(1)', duration: h2, ease: 'expo.out' }, t);
    return 0;
  });

  defT('portal-spin', '旋涡穿越：旧画面旋转吸入中心，新画面从旋转模糊中甩出定格。参数 deg=旋转角度、dur', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.7), deg = num(o.deg, 72);
    if (prev) tl.to(prev, { scale: 0.12, rotation: deg, opacity: 0, filter: 'blur(12px)', duration: d * 0.62, ease: 'power3.in' }, t);
    tl.fromTo(next, { scale: 1.45, rotation: -deg * 0.55, opacity: 0, filter: 'blur(14px)' },
      { scale: 1, rotation: 0, opacity: 1, filter: 'blur(0px)', duration: d * 0.72, ease: 'expo.out' }, t + d * 0.28);
    return d;
  });

  defT('halftone', '漫画网点波纹：圆点阵列沿对角线放大铺满再收缩揭开新画面（二次元/像素风绝配）。参数 cols、color、dur', function (tl, t, prev, next, o) {
    var d = num(o.dur, 0.8), cols = num(o.cols, 20), W = STAGE.offsetWidth || 1920, H = STAGE.offsetHeight || 1080;
    var cell = W / cols, rows = Math.ceil(H / cell), col = o.color || '#1d1b19';
    var wrap = document.createElement('div'), cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    wrap.className = 'fx-overlay';
    wrap.style.cssText += ';opacity:1;background:none;visibility:hidden';
    wrap.appendChild(cv); STAGE.appendChild(wrap);
    var ctx = cv.getContext('2d'), p = { v: 0 };
    var paint = function () {
      ctx.clearRect(0, 0, W, H);
      if (p.v <= 0.002 || p.v >= 0.998) return;
      ctx.fillStyle = col;
      var grow = p.v <= 0.5, u = grow ? p.v * 2 : (p.v - 0.5) * 2;
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var w = (x / cols + y / rows) * 0.5;
        var k = grow ? clamp((u * 1.55 - w * 0.55), 0, 1) : 1 - clamp((u * 1.55 - w * 0.55), 0, 1);
        if (k <= 0.01) continue;
        ctx.beginPath();
        ctx.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.78 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    tl.set(wrap, { visibility: 'visible' }, Math.max(0, t - d / 2));
    tl.fromTo(p, { v: 0 }, { v: 1, duration: d, ease: 'none', onUpdate: paint }, Math.max(0, t - d / 2));
    tl.set(wrap, { visibility: 'hidden' }, t + d / 2 + 0.02);
    return 0;
  });

  def('scatter-out', '退场', '四散弹飞：元素向四周带着旋转与抛物线重力炸飞清场（适合一键清理、破除误区）。参数 power=力度、dur、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 23)), pw = num(c.o.power, 1), d = num(c.o.dur, 0.75);
    var box = FX.rect(c.el);
    c.els.forEach(function (el, i) {
      var R = FX.rect(el), ang = c.els.length > 1 && box ? Math.atan2(R.cy - box.cy, R.cx - box.cx) + (r() - 0.5) * 0.6 : (r() * Math.PI * 2);
      var dx = Math.cos(ang) * (420 + r() * 380) * pw, up = -(120 + r() * 180) * pw, down = (580 + r() * 340) * pw;
      var t0 = c.t + i * num(c.o.stagger, 0.025);
      c.tl.to(el, { x: rel(dx), rotation: rel((r() - 0.5) * 240), duration: d, ease: 'power1.out' }, t0);
      c.tl.to(el, { keyframes: [{ y: rel(up), duration: d * 0.32, ease: 'power2.out' }, { y: rel(down), opacity: 0, duration: d * 0.68, ease: 'power2.in' }] }, t0);
    });
  });

  def('circuit', '强调', '直角电路连接：在两个元素之间画横平竖直的折线电路并传输发光脉冲包（适合架构图、MCP 协议流）。写在起点上，to=#终点。参数 mid=折弯比例、packets=脉冲数、color、dur', function (c) {
    var sc = hostOf(c), b = FX.rect($(c.o.to)), a = FX.rect(c.el);
    if (!b) { console.warn('FX circuit：找不到终点', c.o.to); return; }
    var horiz = Math.abs(b.cx - a.cx) >= Math.abs(b.cy - a.cy);
    var ax = horiz ? (b.cx >= a.cx ? a.x + a.w : a.x) : a.cx;
    var ay = horiz ? a.cy : (b.cy >= a.cy ? a.y + a.h : a.y);
    var bx = horiz ? (b.cx >= a.cx ? b.x : b.x + b.w) : b.cx;
    var by = horiz ? b.cy : (b.cy >= a.cy ? b.y : b.y + b.h);
    var mid = num(c.o.mid, 0.5), dpath;
    if (horiz) { var mx = ax + (bx - ax) * mid; dpath = 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' L' + mx.toFixed(1) + ' ' + ay.toFixed(1) + ' L' + mx.toFixed(1) + ' ' + by.toFixed(1) + ' L' + bx.toFixed(1) + ' ' + by.toFixed(1); }
    else { var my = ay + (by - ay) * mid; dpath = 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' L' + ax.toFixed(1) + ' ' + my.toFixed(1) + ' L' + bx.toFixed(1) + ' ' + my.toFixed(1) + ' L' + bx.toFixed(1) + ' ' + by.toFixed(1); }
    var col = c.o.color || 'var(--fx-accent)';
    var svg = svgEl('svg', { 'class': 'fx-circuit' });
    var wire = svgEl('path', { d: dpath, fill: 'none', stroke: col, 'stroke-width': num(c.o.w, 4), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    wire.style.opacity = '0.38';
    var pulse = svgEl('path', { d: dpath, fill: 'none', stroke: col, 'stroke-width': num(c.o.w, 4) + 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    pulse.style.filter = 'drop-shadow(0 0 8px ' + col + ')';
    var dotA = svgEl('circle', { cx: ax.toFixed(1), cy: ay.toFixed(1), r: 6, fill: col });
    var dotB = svgEl('circle', { cx: bx.toFixed(1), cy: by.toFixed(1), r: 6, fill: col });
    svg.appendChild(wire); svg.appendChild(pulse); svg.appendChild(dotA); svg.appendChild(dotB); sc.appendChild(svg);
    var L = wire.getTotalLength() || 200, seg = Math.max(18, L * 0.16), pk = num(c.o.packets, 3), d = num(c.o.dur, 0.9);
    pulse.setAttribute('stroke-dasharray', seg.toFixed(1) + ' ' + (L + seg * 2).toFixed(1));
    gsap.set([dotA, dotB], { scale: 0, transformOrigin: '50% 50%' });
    c.tl.to(dotA, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, c.t);
    c.tl.fromTo(wire, { strokeDasharray: L + ' ' + L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, c.t);
    c.tl.to(dotB, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, c.t + 0.35);
    gsap.set(pulse, { strokeDashoffset: seg });
    for (var k = 0; k < pk; k++) {
      c.tl.fromTo(pulse, { strokeDashoffset: seg }, { strokeDashoffset: -L, duration: d, ease: 'none', immediateRender: false }, c.t + 0.25 + k * (d * 0.72));
    }
  });

  def('overload', '强调', '过载红温警报：元素高频急促抖动 + 红光闪烁（适合上下文爆满、算力过载、报错）。参数 amp=幅度、color、dur、seed', function (c) {
    var r = FX.rand(num(c.o.seed, 31)), a = num(c.o.amp, 8), d = num(c.o.dur, 0.9), col = c.o.color || '#ff4d4f', step = 1 / 20;
    c.els.forEach(function (el) {
      var origShadow = el.style.boxShadow || '';
      for (var t = 0; t < d; t += step) {
        var hi = Math.floor(t / step) % 3 === 0;
        c.tl.set(el, {
          x: rel((r() * 2 - 1) * a), y: rel((r() * 2 - 1) * a * 0.6),
          boxShadow: hi ? '0 0 0 5px ' + col + ', 0 0 36px ' + col : origShadow
        }, c.t + t);
        c.tl.set(el, { x: 0, y: 0 }, c.t + t + step * 0.9);
      }
      c.tl.set(el, { x: 0, y: 0, boxShadow: origShadow }, c.t + d);
    });
  });

  def('scan', '强调', '激光扫描线：一道发光扫描带扫过窗口或卡片（适合代码读取、文档检索、图表诊断）。参数 dir=down|right、color、n=次数、dur', function (c) {
    var col = c.o.color || 'var(--fx-accent)', dir = c.o.dir || 'down', d = num(c.o.dur, 1.0), n = num(c.o.n, 1);
    c.els.forEach(function (el) {
      relPos(el);
      el.style.overflow = 'hidden';
      var bar = document.createElement('i');
      bar.className = 'fx-scan-bar';
      if (dir === 'right') {
        bar.style.cssText = 'top:0;bottom:0;left:0;width:90px;background:linear-gradient(90deg,transparent,' + col + ');border-right:4px solid #fff;opacity:0';
        el.appendChild(bar);
        for (var k = 0; k < n; k++) {
          var t0 = c.t + k * (d + 0.15);
          c.tl.fromTo(bar, { left: '-90px', opacity: 0.75 }, { left: '100%', opacity: 0.75, duration: d, ease: 'power1.inOut', immediateRender: false }, t0);
          c.tl.set(bar, { opacity: 0 }, t0 + d);
        }
      } else {
        bar.style.cssText = 'left:0;right:0;top:0;height:80px;background:linear-gradient(180deg,transparent,' + col + ');border-bottom:4px solid #fff;opacity:0';
        el.appendChild(bar);
        for (var m = 0; m < n; m++) {
          var tm = c.t + m * (d + 0.15);
          c.tl.fromTo(bar, { top: '-80px', opacity: 0.72 }, { top: '100%', opacity: 0.72, duration: d, ease: 'power1.inOut', immediateRender: false }, tm);
          c.tl.set(bar, { opacity: 0 }, tm + d);
        }
      }
    });
  });

  def('callout', '强调', '折线引线批注：从元素边缘拉出折线引线并弹出文字标签（适合图表峰值、重点数据旁注）。参数 text=文字、dx、dy、color', function (c) {
    var sc = hostOf(c), col = c.o.color || '#d8432b', dx = num(c.o.dx, 110), dy = num(c.o.dy, -68), txt = String(c.o.text || '重点');
    c.els.forEach(function (el) {
      var R = FX.rect(el);
      if (!R) return;
      var sx = dx >= 0 ? R.x + R.w - 6 : R.x + 6, sy = dy <= 0 ? R.y + 8 : R.y + R.h - 8;
      var kx = sx + dx * 0.55, ky = sy + dy, ex = sx + dx;
      var svg = svgEl('svg', { 'class': 'fx-callout' });
      var dot = svgEl('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: col });
      var path = svgEl('path', { d: 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' L' + kx.toFixed(1) + ' ' + ky.toFixed(1) + ' L' + ex.toFixed(1) + ' ' + ky.toFixed(1),
        fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      svg.appendChild(path); svg.appendChild(dot); sc.appendChild(svg);
      var tag = document.createElement('div');
      tag.className = 'fx-callout-tag';
      tag.style.background = col;
      tag.style.left = (dx >= 0 ? ex + 6 : ex - 6) + 'px';
      tag.style.top = (ky - 22) + 'px';
      if (dx < 0) tag.style.transform = 'translateX(-100%)';
      tag.textContent = txt;
      sc.appendChild(tag);
      var L = path.getTotalLength() || 140;
      gsap.set(dot, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(tag, { opacity: 0, scale: 0.7 });
      c.tl.to(dot, { scale: 1, duration: 0.18, ease: 'back.out(2)' }, c.t);
      c.tl.fromTo(path, { strokeDasharray: L + ' ' + L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, c.t + 0.06);
      c.tl.to(tag, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2)' }, c.t + 0.28);
    });
  });

  def('toggle', '组件', '拨动开关：配 data-make="switches"，把第 i 个开关（支持 2/3/5 批量）拨到开(on=1)或关(on=0)。参数 i、on=0|1、stagger', function (c) {
    var rows = $$('.fx-switch', c.el), idxs = slashList(c.o.i || 1).map(function (x) { return clamp(+x - 1, 0, rows.length - 1); });
    var on = num(c.o.on, 0) ? 1 : 0, st = num(c.o.stagger, 0.14), d = num(c.o.dur, 0.28);
    var onCol = c.el.getAttribute('data-on-color') || '#3fbf5a', offCol = c.el.getAttribute('data-off-color') || '#9ca3af';
    idxs.forEach(function (idx, k) {
      var row = rows[idx];
      if (!row) return;
      var track = $('.fx-sw-track', row), knob = $('.fx-sw-knob', row), t0 = c.t + k * st;
      var travel = (track.offsetWidth || 74) - (knob.offsetWidth || 28) - 10;
      c.tl.to(knob, { x: on ? Math.max(28, travel) : 0, duration: d, ease: 'back.out(2)' }, t0);
      c.tl.to(track, { backgroundColor: on ? onCol : offCol, duration: d * 0.8 }, t0);
      if (c.o.dim !== 0) c.tl.to(row, { opacity: on ? 1 : 0.52, duration: d }, t0);
    });
  });

  /* ── 组件生成器 ── */

  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };

  /** 环形文字：data-text、data-r=半径，配 spin 让它转起来 */
  FX.make['circle-text'] = function (el) {
    var ch = Array.from(attr(el, 'text', '')), n = ch.length || 1, r = num(attr(el, 'r'), 140);
    el.classList.add('fx-circle-text');
    el.style.width = el.style.height = r * 2 + 'px';
    el.innerHTML = ch.map(function (c, i) { return '<span style="transform:translate(-50%,-50%) rotate(' + (i / n * 360).toFixed(2) + 'deg) translateY(' + -r + 'px)">' + c + '</span>'; }).join('');
  };

  /** 复古透视网格：data-cell=格子大小、data-color、data-angle=倾角，配 bg-scroll 让网格往前流动 */
  FX.make['retro-grid'] = function (el) {
    el.classList.add('fx-retro');
    el.innerHTML = '<div class="fx-grid-plane" style="background-size:' + num(attr(el, 'cell'), 80) + 'px ' + num(attr(el, 'cell'), 80) + 'px;--c:' + attr(el, 'color', 'rgba(255,255,255,.35)') + ';transform:rotateX(' + num(attr(el, 'angle'), 65) + 'deg)"></div>';
  };

  /** 剪纸窗花：对称剪纸图案，每个 data-seed 都不一样。data-size、data-fold=几折（6/8/12）、data-shape=flower|circle|square、data-color */
  var pcId = 0;
  FX.make.papercut = function (el) {
    var size = num(attr(el, 'size'), 320), fold = num(attr(el, 'fold'), 8), r = FX.rand(num(attr(el, 'seed'), 1)), color = attr(el, 'color', 'var(--fx-accent)');
    var shape = attr(el, 'shape', 'flower'), R = size / 2, id = 'fxpc' + ++pcId, wedge = 360 / fold, base, holes = '', k;
    if (shape === 'circle') base = '<circle r="' + (R * 0.97).toFixed(1) + '"/>';
    else if (shape === 'square') base = '<rect x="' + (-R * 0.9) + '" y="' + (-R * 0.9) + '" width="' + R * 1.8 + '" height="' + R * 1.8 + '" rx="' + (R * 0.06).toFixed(1) + '"/>';
    else {
      base = '<circle r="' + (R * 0.8).toFixed(1) + '"/>';
      for (k = 0; k < fold * 2; k++) { var a = k / (fold * 2) * Math.PI * 2; base += '<circle cx="' + (Math.cos(a) * R * 0.8).toFixed(1) + '" cy="' + (Math.sin(a) * R * 0.8).toFixed(1) + '" r="' + (R * Math.PI * 0.8 / (fold * 2) * 1.05).toFixed(1) + '"/>'; }
    }
    // 在一个扇区里随机放几种镂空形状，再左右镜像、绕圆心复制 fold 份
    var motifs = [0.2, 0.36, 0.52, 0.68].map(function (rr) { return { kind: Math.floor(r() * 4), rad: rr * R, s: R * (0.045 + r() * 0.05), ang: wedge / 2 * (r() > 0.5 ? 1 : 0.45) }; });
    var shapeAt = function (m, angDeg) {
      var a = angDeg * Math.PI / 180, x = (Math.cos(a) * m.rad).toFixed(1), y = (Math.sin(a) * m.rad).toFixed(1), s = m.s, rot = angDeg.toFixed(1);
      if (m.kind === 0) return '<circle cx="' + x + '" cy="' + y + '" r="' + s.toFixed(1) + '"/>';
      if (m.kind === 1) return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (s * 1.7).toFixed(1) + '" ry="' + (s * 0.6).toFixed(1) + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';
      if (m.kind === 2) return '<rect x="' + (x - s) + '" y="' + (y - s) + '" width="' + (s * 2).toFixed(1) + '" height="' + (s * 2).toFixed(1) + '" transform="rotate(' + (+rot + 45) + ' ' + x + ' ' + y + ')"/>';
      return '<path d="M' + x + ' ' + (y - s * 1.5).toFixed(1) + ' Q' + (+x + s * 1.3).toFixed(1) + ' ' + y + ' ' + x + ' ' + (+y + s * 1.5).toFixed(1) + ' Q' + (x - s * 0.4).toFixed(1) + ' ' + y + ' ' + x + ' ' + (y - s * 1.5).toFixed(1) + 'Z" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';
    };
    for (k = 0; k < fold; k++) motifs.forEach(function (m) { holes += shapeAt(m, k * wedge + m.ang) + shapeAt(m, k * wedge - m.ang); });
    holes += '<circle r="' + (R * 0.07).toFixed(1) + '"/>';
    for (k = 0; k < fold * 2; k++) { var b = k / (fold * 2) * Math.PI * 2; holes += '<circle cx="' + (Math.cos(b) * R * 0.12).toFixed(1) + '" cy="' + (Math.sin(b) * R * 0.12).toFixed(1) + '" r="' + (R * 0.018).toFixed(1) + '"/>'; }
    el.classList.add('fx-papercut');
    el.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="' + -R + ' ' + -R + ' ' + size + ' ' + size + '"><defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="' + -R + '" y="' + -R + '" width="' + size + '" height="' + size + '"><rect x="' + -R + '" y="' + -R + '" width="' + size + '" height="' + size + '" fill="#fff"/><g fill="#000">' + holes + '</g></mask></defs><g style="fill:' + color + '" mask="url(#' + id + ')">' + base + '</g></svg>';
  };

  /** 层叠纸山：data-layers=层数、data-colors=从后到前的颜色、data-seed。每层是一个子元素，配 layer-rise / parallax */
  FX.make.hills = function (el) {
    var n = num(attr(el, 'layers'), 4), cols = list(el, 'colors'), r = FX.rand(num(attr(el, 'seed'), 2)), W = 2000, H = 600, h = '';
    if (!cols.length) cols = ['#b9d3c6', '#87b3a2', '#4f8a7b', '#2c5f55', '#1d4740'];
    el.classList.add('fx-hills');
    for (var i = 0; i < n; i++) {
      var y0 = H * (0.18 + i * (0.62 / n)), amp = H * (0.12 - i * 0.015), f1 = 1 + r() * 2, f2 = 3 + r() * 3, ph1 = r() * 6.28, ph2 = r() * 6.28, d = 'M0 ' + H;
      for (var x = 0; x <= W; x += 40) d += ' L' + x + ' ' + (y0 - amp * (0.65 * Math.sin(x / W * Math.PI * f1 + ph1) + 0.35 * Math.sin(x / W * Math.PI * f2 + ph2))).toFixed(1);
      d += ' L' + W + ' ' + H + 'Z';
      h += '<svg class="fx-hill" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + d + '" style="fill:' + cols[Math.min(i, cols.length - 1)] + '"/></svg>';
    }
    el.innerHTML = h;
  };

  /** 毛边纸条：把元素的边剪成参差的撕纸边。data-edges=top,right,bottom,left（默认 top,bottom）、data-depth、data-teeth、data-seed。
   *  clip-path 会裁掉阴影，要投影就在外面套一层 class="fx-torn-shadow" */
  FX.make.torn = function (el) {
    var edges = attr(el, 'edges', 'top,bottom'), r = FX.rand(num(attr(el, 'seed'), 3)), dp = num(attr(el, 'depth'), 6), n = num(attr(el, 'teeth'), 24), pts = [], i;
    var has = function (s) { return edges.indexOf(s) >= 0; };
    for (i = 0; i <= n; i++) pts.push([i / n * 100, has('top') ? r() * dp : 0]);
    for (i = 1; i <= n; i++) pts.push([100 - (has('right') ? r() * dp * 0.5 : 0), i / n * 100]);
    for (i = n - 1; i >= 0; i--) pts.push([i / n * 100, 100 - (has('bottom') ? r() * dp : 0)]);
    for (i = n - 1; i >= 1; i--) pts.push([has('left') ? r() * dp * 0.5 : 0, i / n * 100]);
    el.style.clipPath = 'polygon(' + pts.map(function (q) { return q[0].toFixed(2) + '% ' + q[1].toFixed(2) + '%'; }).join(',') + ')';
  };

  /** 开关列表：data-labels="项1,项2,项3"、data-on="1,3"（或 all），配 toggle 动效拨动开关 */
  FX.make.switches = function (el) {
    var labels = list(el, 'labels'), rawOn = attr(el, 'on', 'all'), onSet = {};
    if (rawOn === 'all') labels.forEach(function (_, i) { onSet[i + 1] = 1; });
    else list(el, 'on').forEach(function (v) { onSet[+v] = 1; });
    var onCol = attr(el, 'on-color', '#3fbf5a'), offCol = attr(el, 'off-color', '#9ca3af');
    el.classList.add('fx-switches');
    el.innerHTML = labels.map(function (lb, i) {
      var isOn = !!onSet[i + 1];
      return '<div class="fx-switch" style="opacity:' + (isOn ? 1 : 0.52) + '"><span>' + lb + '</span>' +
        '<span class="fx-sw-track" style="background:' + (isOn ? onCol : offCol) + '">' +
        '<i class="fx-sw-knob" style="transform:translateX(' + (isOn ? 36 : 0) + 'px)"></i></span></div>';
    }).join('');
  };

  /* ═════════════════════════ 字幕 ═════════════════════════
   * FX.subtitles([[开始秒, 结束秒, '文字'], …])，写在 FX.build() 之前。
   * 文字里用 {花括号} 包住的词会套上强调色。样式由容器的 data-style 决定：plain | pill | bar */
  var SUBS = null;
  FX.subtitles = function (cues, opt) { SUBS = { cues: cues, opt: opt || {} }; };

  /* ═════════════════════════ 构建 ═════════════════════════ */

  var HOOKS = [];
  /** 手写补充动效：FX.scene('#s3', function (tl, t0, scene) { tl.to(…, t0 + 1.2) }) */
  FX.scene = function (sel, fn) { HOOKS.push([sel, fn]); };

  var FRAME = [];
  FX.build = function (opt) {
    opt = opt || {};
    STAGE = $(opt.stage || '[data-composition-id]');
    if (!STAGE) throw new Error('FX：找不到舞台元素（需要 data-composition-id）');
    var id = STAGE.getAttribute('data-composition-id');
    var tl = gsap.timeline({ paused: true });
    STAGE_SCALE = 1;

    // 0. 生成组件
    $$('[data-make]', STAGE).forEach(function (el) {
      var k = el.getAttribute('data-make');
      if (FX.make[k]) FX.make[k](el); else console.warn('FX：没有这个组件生成器 →', k);
    });

    // 1. 场景时间：data-t 开始、data-d 时长；不写 data-t 就接在上一个场景后面
    var scenes = $$('.scene', STAGE), cursor = 0, map = {};
    var S = scenes.map(function (el, i) {
      var t = el.hasAttribute('data-t') ? num(el.getAttribute('data-t'), cursor) : cursor;
      var d = num(el.getAttribute('data-d'), 3);
      cursor = el.classList.contains('overlay') ? cursor : t + d;
      var s = { el: el, t: t, d: d, end: t + d, i: i, hold: 0 };
      if (el.id) map[el.id] = s;
      return s;
    });
    FX.scenes = S; FX.sceneMap = map;
    var total = num(STAGE.getAttribute('data-duration'), 0);
    var endMax = S.reduce(function (m, s) { return Math.max(m, s.end); }, 0);
    if (!total) { total = endMax; STAGE.setAttribute('data-duration', total.toFixed(3)); }
    FX.duration = total;

    // 2. 字幕 DOM（先生成，后面一起量位置）
    var subWrap = null;
    if (SUBS) {
      subWrap = $('.fx-subs', STAGE);
      if (!subWrap) { subWrap = document.createElement('div'); subWrap.className = 'fx-subs'; STAGE.appendChild(subWrap); }
      if (SUBS.opt.style) subWrap.setAttribute('data-style', SUBS.opt.style);
      SUBS.cues.forEach(function (cue) {
        var d = document.createElement('div');
        d.className = 'fx-sub';
        d.innerHTML = '<span>' + String(cue[2]).replace(/\{(.+?)\}/g, '<em>$1</em>') + '</span>';
        subWrap.appendChild(d);
        cue.el = d;
      });
    }

    // 3. 先量位置（此时还没有任何动效改过元素）
    $$('[data-fx], [id], .fx-chap, .fx-step', STAGE).forEach(function (el) { RECT.set(el, measure(el)); });
    $$('[data-fx*="each:"]', STAGE).forEach(function (el) { Array.prototype.forEach.call(el.children, function (k) { RECT.set(k, measure(k)); }); });

    // 每一次动效 / 转场调用都记一笔（名字、时间、元素、参数），音效层（fx-sound.js）靠它排声音
    FX.calls = [];
    // 4. 场景显隐 + 转场
    var seq = S.filter(function (s) { return !s.el.classList.contains('overlay'); });
    // 根元素写了 data-world 且加载了 fx-world.js：分镜变成画布上的机位，换分镜交给相机
    var worldOn = !!(FX.world && FX.world.setup && FX.world.setup({ stage: STAGE, seq: seq, tl: tl, total: total, parseFx: parseFx }));
    if (!worldOn && STAGE.hasAttribute('data-world')) console.warn('FX：写了 data-world 但没有加载 fx-world.js');
    if (worldOn) seq.forEach(function (s, k) { if (!k) return; var sp = parseFx(s.el.getAttribute('data-in') || '')[0]; FX.calls.push({ name: sp ? sp.name : 'cam-to', t: s.t, trans: true, o: sp ? sp.opts : {} }); });
    if (!worldOn) seq.forEach(function (s, k) {
      var spec = parseFx(s.el.getAttribute('data-in') || '')[0];
      if (spec && FX.trans[spec.name]) {
        var prev = k > 0 ? seq[k - 1] : null;
        var hold = FX.trans[spec.name](tl, s.t, prev ? prev.el : null, s.el, spec.opts) || 0;
        if (prev) prev.hold = Math.max(prev.hold, hold);
        FX.calls.push({ name: spec.name, t: s.t, trans: true, o: spec.opts });
      } else if (spec) console.warn('FX：没有这个转场 →', spec.name);
    });
    S.forEach(function (s) {
      if (worldOn && seq.indexOf(s) >= 0) return;
      tl.set(s.el, { visibility: 'visible' }, s.t);
      if (s.end + s.hold < total - 0.001) tl.set(s.el, { visibility: 'hidden' }, s.end + s.hold);
    });

    // 5. 元素动效
    function apply(el, s) {
      var base = s ? s.t : 0, dur = s ? s.d : total, last = base;
      parseFx(el.getAttribute('data-fx')).forEach(function (f) {
        var fn = FX.fx[f.name];
        if (!fn) { console.warn('FX：没有这个动效 →', f.name, el); return; }
        var t;
        if (f.time === undefined) t = base;
        else if (f.time[0] === '+') t = last + parseFloat(f.time);
        else if (f.time[0] === '-') t = base + dur + parseFloat(f.time);
        else t = base + parseFloat(f.time);
        last = t;
        var els = f.mod === 'each' ? Array.prototype.slice.call(el.children).filter(function (k) { return !/^fx-(box|ping|sheen|overlay|scan)/.test(k.className && k.className.baseVal !== undefined ? k.className.baseVal : k.className); })
                : f.mod === 'chars' ? splitChars(el) : f.mod === 'words' ? splitWords(el) : f.mod === 'lines' ? splitLines(el) : [el];
        if (f.mod === 'chars' && f.opts.stagger === undefined) f.opts.stagger = 0.03;
        FX.calls.push({ name: f.name, t: t, el: el, n: els.length, mod: f.mod, o: f.opts });
        fn({ tl: tl, el: el, els: els, t: t, o: f.opts, scene: s, sceneDur: s ? Math.max(0.1, base + dur - t) : total - t, total: total });
      });
    }
    $$('[data-fx]', STAGE).forEach(function (el) {
      var sc = el.closest('.scene');
      apply(el, sc ? S[scenes.indexOf(sc)] : null);
    });

    // 6. 字幕显隐
    if (SUBS) {
      SUBS.cues.forEach(function (cue) {
        tl.set(cue.el, { visibility: 'visible' }, cue[0]);
        tl.set(cue.el, { visibility: 'hidden' }, cue[1]);
        if (SUBS.opt.pop) tl.fromTo(cue.el, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.12, ease: 'power2.out' }, cue[0]);
      });
    }

    // 7. 手写补充
    HOOKS.forEach(function (h) {
      $$(h[0], STAGE).forEach(function (el) { var s = S[scenes.indexOf(el)]; h[1](tl, s ? s.t : 0, el, s); });
    });
    if (opt.extra) opt.extra(tl, function (sceneId, local) { return (map[sceneId] ? map[sceneId].t : 0) + (local || 0); });

    // 扩展模块的收尾：有些东西要等全片的指令都收集完才能排（比如演员的走位）
    // 每渲染完一帧（所有补间都更新之后）要跑的收尾函数：扩展模块里「按秒数重画」的东西挂在这里，跳帧渲染时拿到的才是这一帧的值
    FRAME.length = 0;
    FX.onFrame = function (fn) { FRAME.push(fn); };
    (FX.afterBuild || []).forEach(function (fn) { fn(tl, total); });
    tl.eventCallback('onUpdate', function () { for (var i = 0; i < FRAME.length; i++) FRAME[i](tl); });

    // 把时间线补到总时长，渲染器才知道片子有多长
    tl.set({}, {}, total);

    window.__timelines = window.__timelines || {};
    window.__timelines[id] = tl;
    tl.seek(0);
    if (worldOn) FX.world.render(0);
    FX.timeline = tl;

    if (/[?&#]play\b/.test(location.search + location.hash)) player(tl, total);
    if (/[?&#]lint\b/.test(location.search + location.hash)) { FX.lint(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { FX.lint(); }); }
    return tl;
  };

  /** 场景内的秒数 → 全片绝对秒数 */
  /** 卡点：把时刻 t 挪到最近的拍子上（页面加载了 bgm.mjs 生成的 beats.js 时才生效）。
   *  win：最多挪多少秒；lo / hi：挪完不能早于 / 晚于；down=true 时优先落在每小节第一拍（重拍）上。没有合适的拍子就原样返回 t。
   *  根元素写 data-beats="off" 可以整片关掉。 */
  FX.snapBeat = function (t, win, lo, hi, down) {
    var B = g.FX_BEATS, st = document.querySelector('[data-composition-id]');
    if (!B || !B.beats || (st && st.getAttribute('data-beats') === 'off')) return t;
    lo = lo === undefined ? -1e9 : lo; hi = hi === undefined ? 1e9 : hi;
    var pick = function (list, w) { var best = null; (list || []).forEach(function (b) { if (b >= lo && b <= hi && Math.abs(b - t) <= w && (best === null || Math.abs(b - t) < Math.abs(best - t))) best = b; }); return best; };
    var b = (down ? pick(B.downbeats, win * 1.5) : null); if (b === null) b = pick(B.beats, win);
    return b === null ? t : b;
  };

  FX.at = function (sceneId, local) { var s = FX.sceneMap[sceneId]; return (s ? s.t : 0) + (local || 0); };

  /* ═════════════════════ 自检（网址加 ?lint，或手动调 FX.lint()） ═════════════════════
   * 逐个分镜跳到「到位帧」（开始后约 0.8 秒）和「后段帧」（82% 处），用真实排版结果检查：
   *   字太小、空屏、文字出画、文字互相压住、被字幕压住、用了 emoji、有没有真素材。
   * 结果同时写进 <script id="fx-lint" type="application/json">，给命令行工具读。只做检查，不参与渲染。 */
  FX.lint = function (opt) {
    opt = opt || {};
    var tl = FX.timeline, SW = STAGE.offsetWidth, SH = STAGE.offsetHeight;
    var minFont = num(opt.minFont, 32), minCover = num(opt.minCover, 0.1), subTop = SH - num(opt.subBand, 170), GX = 64, GY = 36;
    var SKIP = '.fx-subs, script, style, [data-lint="off"], .t-en, .fx-segments-count, .fx-bignum-txt em, .fx-skel, .fx-coord-bar, .fx-card3d-meta, .fx-box3d-lip, .fx-layers3d-txt small, .fx-stamp small, .fx-float-pill i, .fx-letter-card .no, .fx-letter-card .suit, .fx-yah-pin b, .fx-cal-back, .fx-cal-front';   // 纯装饰的小字不查
    var DEEP = '.fx-tunnel, .fx-road, .fx-helix, .fx-flipboard, .fx-wall3d, .fx-deck3d, .fx-box3d, .fx-phone3d, .fx-carousel3d, .fx-slabs3d, .fx-timeline3d';   // 3D 组件里远处的东西本来就小，只查离镜头最近的
    var EMOJI = /[\u{1F000}-\u{1FAFF}\u{2705}\u{274C}\u{2728}\u{2753}\u{2757}\u{26A1}\u{2B50}\u{2764}]/u;
    var seq = FX.scenes.filter(function (s) { return !s.el.classList.contains('overlay'); });
    var overlays = FX.scenes.filter(function (s) { return s.el.classList.contains('overlay'); });
    function opacityOf(el) { var o = 1; for (var e = el; e && e !== STAGE.parentNode; e = e.parentElement) { o *= parseFloat(getComputedStyle(e).opacity); if (o < 0.02) return 0; } return o; }
    function box(r) { var s = STAGE.getBoundingClientRect(), k = s.width / SW || 1; return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k }; }
    function onStage(b) { return b.w > 1 && b.h > 1 && b.x < SW && b.y < SH && b.x + b.w > 0 && b.y + b.h > 0; }
    function scan(root, grid, out) {
      var range = document.createRange(), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), node;
      while ((node = walker.nextNode())) {
        var txt = node.nodeValue.replace(/\s+/g, ' ').trim(), p = node.parentElement;
        if (!txt || !p || p.closest(SKIP)) continue;
        var cs = getComputedStyle(p);
        if (cs.visibility === 'hidden' || opacityOf(p) < 0.3) continue;
        range.selectNodeContents(node);
        var b = box(range.getBoundingClientRect());
        if (/block|flex|grid/.test(cs.display)) {      // 行高压得很紧的大字，字形框会比它所在的块高一截：按块的范围算，免得误报「文字重叠」
          var pr = box(p.getBoundingClientRect()), y0 = Math.max(b.y, pr.y), y1 = Math.min(b.y + b.h, pr.y + pr.h);
          if (y1 > y0) { b.y = y0; b.h = y1 - y0; }
        }
        if (!onStage(b)) continue;
        var scale = p.offsetHeight ? p.getBoundingClientRect().height / (STAGE.getBoundingClientRect().width / SW || 1) / p.offsetHeight : 1;
        if (p.closest(DEEP) && (scale < 0.8 || opacityOf(p) < 0.9)) { if (grid) mark(grid, b); continue; }
        out.texts.push({ el: p, full: txt, text: txt.slice(0, 24), size: Math.round(parseFloat(cs.fontSize) * (scale > 0.2 && scale < 6 ? scale : 1)), b: b, emoji: EMOJI.test(txt) });
        if (grid) mark(grid, b);
      }
      Array.prototype.forEach.call(root.querySelectorAll('img, video, canvas, svg'), function (el) {
        if (getComputedStyle(el).visibility === 'hidden' || opacityOf(el) < 0.3) return;
        var b = box(el.getBoundingClientRect());
        if (!onStage(b)) return;
        var cw = Math.min(SW, b.x + b.w) - Math.max(0, b.x), ch = Math.min(SH, b.y + b.h) - Math.max(0, b.y);
        if (cw * ch > SW * SH * 0.7 && el.tagName !== 'IMG' && el.tagName !== 'VIDEO' && !el.closest('[data-lint="content"]')) return;   // 铺满全屏的画布 / 矢量图默认当背景，不算内容；它就是主视觉时给容器写 data-lint="content"
        if (grid) mark(grid, b);
        if (el.tagName === 'IMG' || el.tagName === 'VIDEO') { out.media = (out.media || 0) + cw * ch; if (out.media > SW * SH * 0.06) out.asset = true; }
      });
      if (grid) Array.prototype.forEach.call(root.querySelectorAll('*'), function (el) {
        var cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        if (el.classList.contains('fx-backdrop')) { var br = /brightness\(([\d.]+)\)/.exec(cs.filter || ''); if (br && +br[1] < 0.75) out.dim = true; return; }
        // 实心大面板：不透明的色块（不是图片、不在设备屏里）盖住了一大片画面
        var am = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor || ''), ap = am ? am[1].split(',') : null, alpha = ap ? (ap.length > 3 ? parseFloat(ap[3]) : 1) : 0;
        if (alpha >= 0.5 && !el.closest('.fx-device, .fx-cutaway, .fx-photo, .fx-subs') && opacityOf(el) > 0.5) {
          var pb = box(el.getBoundingClientRect()), pw = Math.min(SW, pb.x + pb.w) - Math.max(0, pb.x), ph = Math.min(SH, pb.y + pb.h) - Math.max(0, pb.y);
          if (pw > 0 && ph > 0) out.panel = Math.max(out.panel || 0, pw * ph / (SW * SH));
        }
        if (el.classList.contains('fx-road')) { var rb = box(el.getBoundingClientRect()); mark(grid, { x: rb.x + rb.w * 0.3, y: rb.y, w: rb.w * 0.4, h: rb.h }); return; }   // 路面是透视变形的，按中间那一条算
        var bg = cs.backgroundColor, painted = cs.backgroundImage !== 'none' || (bg && bg !== 'transparent' && !/,\s*0\)$/.test(bg)) || parseFloat(cs.borderTopWidth) > 0;
        if (!painted || opacityOf(el) < 0.3) return;
        var b = box(el.getBoundingClientRect());
        if (!onStage(b)) return;
        var cw = Math.min(SW, b.x + b.w) - Math.max(0, b.x), ch = Math.min(SH, b.y + b.h) - Math.max(0, b.y);   // 只算落在画面里的那部分
        if (cw * ch < SW * SH * 0.7) mark(grid, b);
      });
    }
    function mark(grid, b) {
      var x0 = Math.max(0, Math.floor(b.x / SW * GX)), x1 = Math.min(GX, Math.ceil((b.x + b.w) / SW * GX)), y0 = Math.max(0, Math.floor(b.y / SH * GY)), y1 = Math.min(GY, Math.ceil((b.y + b.h) / SH * GY));
      for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) grid[y * GX + x] = 1;
    }
    function cover(grid) { var n = 0; for (var i = 0; i < grid.length; i++) n += grid[i]; return n / grid.length; }
    function sample(s, t) {
      tl.time(t, false);
      var grid = new Uint8Array(GX * GY), own = { texts: [], asset: false }, over = { texts: [], asset: false };
      scan(s.el, grid, own);
      overlays.forEach(function (o) { if (t >= o.t && t <= o.end) scan(o.el, null, over); });
      var cv = cover(grid);
      if (s.el.querySelector('.fx-backdrop') || (FX.oner && FX.oner.on())) { cv = Math.max(cv, 0.3); own.asset = true; }   // 一镜到底：房间在常驻的世界层里，每一镜背后都有
      // 这一屏有多少字（字幕和常驻层不算；英文和数字两个算一个字）
      own.chars = own.texts.reduce(function (n, x) { var t = x.full || x.text; return n + (t.match(/[\u2E80-\u9FFF\uF900-\uFAFF]/g) || []).length + Math.ceil((t.match(/[A-Za-z0-9$%.]/g) || []).length / 2); }, 0);   // 舞台剧：场景背景本身就是画面内容
      return { cover: cv, own: own, over: over };
    }
    var LBel = STAGE.querySelector('.fx-letterbox'), LB = LBel ? num(getComputedStyle(LBel).getPropertyValue('--bar'), 0) : 0;
    var report = { stage: [SW, SH], duration: FX.duration, world: !!(FX.world && FX.world.on && FX.world.on()), scenes: [], overlay: [], errors: 0, warnings: 0 };
    var overSeen = [];   // 常驻层（章节条、主持人名牌）的问题全片只报一次
    var addOver = function (level, type, msg) { var m = msg.replace(/\d+px（/, 'px（'); if (overSeen.indexOf(type + m) < 0) { overSeen.push(type + m); report.overlay.push({ level: level, type: type, msg: msg }); report[level === 'error' ? 'errors' : 'warnings']++; } };
    seq.forEach(function (s, i) {
      var id = s.el.getAttribute('data-scene') || s.el.id || ('#' + (i + 1)), issues = [], seen = [];
      var add = function (level, type, msg) { var key = type + msg; if (seen.indexOf(key) < 0) { seen.push(key); issues.push({ level: level, type: type, msg: msg }); report[level === 'error' ? 'errors' : 'warnings']++; } };
      var tA = s.t + Math.min(0.8, s.d * 0.3), tB = s.t + s.d * 0.82;
      var near = function (t) { return (!(FX.world && FX.world.zoomAt) || !report.world || FX.world.zoomAt(t) > 0.92) && !(FX.oner && FX.oner.busy && FX.oner.on() && FX.oner.busy(t)); };   // 镜头拉远看全景的时刻不查
      for (var k = 0; k < 8 && !near(tA); k++) tA += s.d * 0.08;
      for (k = 0; k < 8 && !near(tB); k++) tB -= s.d * 0.08;
      if (!near(tA) || !near(tB) || tB < tA) { report.scenes.push({ id: id, t: +s.t.toFixed(2), d: +s.d.toFixed(2), skipped: '镜头一直在全景', issues: [] }); return; }
      var A = sample(s, tA), B = sample(s, tB);
      if (A.cover < minCover) add('error', 'empty', '到位时画面是空的：开始后 ' + (tA - s.t).toFixed(1) + ' 秒只铺了 ' + Math.round(A.cover * 100) + '% 的画面。主素材从 @0 就要在画面里，口播时间点只用来触发强调（wake / zoom-here / marker）');
      if (B.cover < minCover * 1.2) add('error', 'sparse', '画面太空：后段也只铺了 ' + Math.round(B.cover * 100) + '% 的画面，把重点放大或加素材');
      else if (B.cover < minCover * 1.8) add('warn', 'sparse', '画面偏空：后段只铺了 ' + Math.round(B.cover * 100) + '% 的画面，重点可以再大一些');
      var stage = STAGE.getAttribute('data-mode') === 'stage', maxChars = num(opt.maxChars, stage ? 30 : 56);
      if (B.own.chars > maxChars * 1.5) add('error', 'wordy', '字太多：这一屏有 ' + B.own.chars + ' 个字（上限 ' + maxChars + '）。观众在听口播，画面上只留关键词和数字；其余的删掉，或拆成两个分镜');
      else if (B.own.chars > maxChars) add('warn', 'wordy', '字偏多：这一屏有 ' + B.own.chars + ' 个字（建议不超过 ' + maxChars + '），只留关键词和数字');
      if (stage && B.own.panel > 0.26) add('error', 'big-panel', '一块实心面板盖住了 ' + Math.round(B.own.panel * 100) + '% 的画面，场景被挡住了，看起来就是幻灯片。把信息拆成场景里的小道具（.fx-sign 牌子 / .fx-bubble 气泡 / .fx-score 大数字），或者放进设备屏（device）里');
      if (stage && B.own.dim && !s.el.querySelector('.fx-device.window')) add('error', 'dim-stage', '场景背景被压暗了。只有弹出信息窗口（device window）的那两三秒可以压暗，其余时间场景要亮着');
      // 阅读时间：文字入场后离分镜结束太近，观众来不及读。标准比纯字幕片宽（这里的字有口播在念）：0.8 秒 + 每 7 个字 1 秒
      (FX.calls || []).forEach(function (c) {
        if (c.trans || !c.el || !/-in$|^(type|draw|scramble|drop-bounce|grow-x|grow-y)$/.test(c.name) || c.el.closest('.scene') !== s.el || c.el.querySelector('img,canvas,video,svg')) return;
        // 聊天窗、终端、代码、图解这类容器是一条条显出来的（各自有 msg / run / diff / hub-node），容器本身的入场不按整段字数算
        if (!c.o.__readText && c.el.matches && c.el.matches('.fx-chat, .fx-term, .fx-code, .fx-surround, .fx-hub')) return;
        var txt = (c.o.__readText || c.el.textContent || '').replace(/\s+/g, '');
        var n = (txt.match(/[⺀-鿿豈-﫿]/g) || []).length + Math.ceil((txt.match(/[A-Za-z0-9$%.]/g) || []).length / 2);
        if (n < 2) return;
        var stag = typeof c.o.stagger === 'number' ? c.o.stagger : 0.08, left = s.end - (c.t + (c.n > 1 ? (c.n - 1) * stag : 0) + 0.3), need = 0.8 + n / 7;
        if (left < need * 0.5) add('error', 'read-time', '来不及读：「' + txt.slice(0, 14) + '」入场后只停 ' + Math.max(0, left).toFixed(1) + ' 秒就换镜头了（' + n + ' 个字至少要 ' + need.toFixed(1) + ' 秒）。把入场提前，或挪到下一个分镜');
        else if (left < need) add('warn', 'read-time', '读得有点赶：「' + txt.slice(0, 14) + '」入场后只停 ' + left.toFixed(1) + ' 秒（建议 ' + need.toFixed(1) + ' 秒以上）');
      });
      [A, B].forEach(function (S) {
        [[S.own.texts, add], [S.over.texts, addOver]].forEach(function (pair) {
          pair[0].forEach(function (x) {
            if (S === B && x.size < minFont) pair[1]('error', 'small-text', '字太小 ' + x.size + 'px（下限 ' + minFont + 'px）：「' + x.text + '」');
            var lb = pair[1] === add ? LB : 0;      // 有电影黑边时，分镜自己的字不能进黑边（常驻层的章节条、字幕本来就放在黑边里）
            if (S === B && (x.b.x < -12 || x.b.y < lb - 12 || x.b.x + x.b.w > SW + 12 || x.b.y + x.b.h > SH - lb + 12)) pair[1]('error', 'clipped', (lb && x.b.x >= -12 && x.b.x + x.b.w <= SW + 12 ? '文字进了黑边：「' : '文字出画：「') + x.text + '」');
            if (x.emoji) pair[1]('warn', 'emoji', '用了 emoji：「' + x.text + '」。各台机器渲染不一致，尽量换成图片、图标或文字');
          });
        });
        S.own.texts.forEach(function (x) { if (SUBS && x.b.y + x.b.h > subTop + 14 && x.b.y < SH - 20) add('warn', 'under-subs', '会被字幕压住（主内容不要低于 y=' + subTop + '）：「' + x.text + '」'); });
        if (S === B) {
          var isBoundedBox = function (el) {
            if (!el || el === STAGE || el === s.el || el.classList.contains('scene') || el.classList.contains('layer')) return false;
            if (el.matches('span,b,i,em,svg,path,img,canvas,.fx-surround,.fx-hub,[data-lint="overflow-ok"]') || el.closest('.fx-phone3d,.fx-card3d,.fx-box3d,.fx-layers3d,.fx-deck3d,.fx-wall3d,.fx-letterdeck,.fx-sleeve3d,.fx-carousel3d,.fx-slabs3d,.fx-coins3d,.fx-timeline3d,.fx-paperstack,.fx-callouts3d,.fx-youarehere,.fx-calgrid3d,.fx-ctabar,.fx-steplist3d,.fx-blueprint3d')) return false;
            var cs = getComputedStyle(el), bw = parseFloat(cs.borderTopWidth) > 0.5 || parseFloat(cs.borderLeftWidth) > 0.5;
            var bg = cs.backgroundColor, hasBg = (cs.backgroundImage && cs.backgroundImage !== 'none') || (bg && bg !== 'transparent' && !/,\s*0\)$/.test(bg));
            if (!bw && !hasBg) return false;
            var rb = box(el.getBoundingClientRect());
            return rb.w > 40 && rb.h > 28 && rb.w * rb.h < SW * SH * 0.85;
          };
          S.own.texts.forEach(function (x) {
            var anc = x.el;
            while (anc && anc !== s.el && !isBoundedBox(anc)) anc = anc.parentElement;
            if (!anc || anc === s.el || anc.closest('.fx-surround, .fx-hub')) return;
            var ab = box(anc.getBoundingClientRect());
            if (x.b.x < ab.x - 4 || x.b.x + x.b.w > ab.x + ab.w + 4 || x.b.y < ab.y - 6 || x.b.y + x.b.h > ab.y + ab.h + 6) {
              add('error', 'box-overflow', '元素超出框外：「' + x.text + '」超出了父容器边界');
            }
          });
          var fxDecos = s.el.querySelectorAll('.fx-sweep, .fx-sheen, .fx-leak');
          Array.prototype.forEach.call(fxDecos, function (d) { d.style.display = 'none'; });
          Array.prototype.forEach.call(s.el.querySelectorAll('*'), function (el) {
            if (!isBoundedBox(el) || el.closest('.fx-surround, .fx-hub, .fx-sweep, .fx-sheen, .fx-leak, .pbar')) return;
            var cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none' || opacityOf(el) < 0.3) return;
            if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 4) {
              add('error', 'box-overflow', '内容超出框宽：「' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20) + '」（内容宽 ' + el.scrollWidth + 'px > 容器宽 ' + el.clientWidth + 'px）');
            }
            if (el.clientHeight > 0 && cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 6) {
              add('error', 'box-overflow', '内容超出框高被截断：「' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20) + '」（内容高 ' + el.scrollHeight + 'px > 容器高 ' + el.clientHeight + 'px）');
            }
          });
          Array.prototype.forEach.call(fxDecos, function (d) { d.style.display = ''; });
        }
        var T = S.own.texts;
        for (var a = 0; a < T.length; a++) for (var b = a + 1; b < T.length; b++) {
          var p = T[a], q = T[b];
          if (p.el === q.el || p.el.contains(q.el) || q.el.contains(p.el) || p.el.parentNode === q.el.parentNode && /fx-ch|fx-word/.test(p.el.className + q.el.className)) continue;
          var ix = Math.min(p.b.x + p.b.w, q.b.x + q.b.w) - Math.max(p.b.x, q.b.x), iy = Math.min(p.b.y + p.b.h, q.b.y + q.b.h) - Math.max(p.b.y, q.b.y);
          if (ix > 4 && iy > 4 && ix * iy > 0.35 * Math.min(p.b.w * p.b.h, q.b.w * q.b.h)) add('warn', 'overlap', '两段文字叠在一起：「' + p.text + '」和「' + q.text + '」');
        }
      });
      report.scenes.push({ id: id, t: +s.t.toFixed(2), d: +s.d.toFixed(2), chars: B.own.chars, panel: +(B.own.panel || 0).toFixed(2), coverAtArrival: +A.cover.toFixed(3), coverLate: +B.cover.toFixed(3), asset: A.own.asset || B.own.asset, issues: issues });
    });
    report.assetScenes = report.scenes.filter(function (x) { return x.asset; }).length;
    report.checked = report.scenes.filter(function (x) { return !x.skipped; }).length;
    tl.time(0, false);
    if (FX.world && FX.world.render) FX.world.render(0);
    var tag = document.getElementById('fx-lint') || document.head.appendChild(Object.assign(document.createElement('script'), { id: 'fx-lint', type: 'application/json' }));
    tag.textContent = JSON.stringify(report).replace(/</g, '\\u003c');
    return report;
  };

  /* ═════════════════════ 预览播放器（网址加 ?play） ═════════════════════
   * 只给人预览用，不参与渲染。空格 播放/暂停，←/→ 逐帧，↑/↓ 跳场景。 */
  function player(tl, total) {
    var W = num(STAGE.getAttribute('data-width'), 1920), H = num(STAGE.getAttribute('data-height'), 1080);
    var bar = document.createElement('div');
    bar.id = 'fx-player';
    bar.innerHTML = '<button data-a="play">▶</button><input type="range" min="0" max="' + total + '" step="0.001" value="0"><span class="t">0.00</span><span class="s"></span>';
    document.body.appendChild(bar);
    document.documentElement.classList.add('fx-playing');
    var range = $('input', bar), tEl = $('.t', bar), sEl = $('.s', bar), btn = $('button', bar);
    var media = $$('audio,video', STAGE);
    function fit() {
      var k = Math.min(innerWidth / W, (innerHeight - 56) / H);
      STAGE_SCALE = k;
      STAGE.style.transformOrigin = '0 0';
      STAGE.style.transform = 'translate(' + (innerWidth - W * k) / 2 + 'px,0) scale(' + k + ')';
    }
    function syncMedia(play) {
      var t = tl.time();
      media.forEach(function (m) {
        var st = num(m.getAttribute('data-start'), 0), local = t - st;
        if (local < 0 || local > (m.duration || 1e9)) { m.pause(); return; }
        if (Math.abs(m.currentTime - local) > 0.25) m.currentTime = local;
        if (play) { var p = m.play(); if (p && p.catch) p.catch(function () {}); } else m.pause();
      });
    }
    function paint() {
      var t = tl.time();
      range.value = t;
      tEl.textContent = t.toFixed(2) + ' / ' + total.toFixed(2) + 's';
      var cur = FX.scenes.filter(function (s) { return !s.el.classList.contains('overlay') && t >= s.t && t < s.end; })[0];
      sEl.textContent = cur ? '#' + (cur.el.id || cur.i) + '  +' + (t - cur.t).toFixed(2) + 's' : '';
    }
    FX.onFrame(paint);
    tl.eventCallback('onComplete', function () { btn.textContent = '▶'; syncMedia(false); });
    function toggle() {
      if (tl.paused() || tl.progress() === 1) { if (tl.progress() === 1) tl.seek(0); tl.play(); btn.textContent = '❚❚'; syncMedia(true); }
      else { tl.pause(); btn.textContent = '▶'; syncMedia(false); }
    }
    function go(t) { tl.pause(); btn.textContent = '▶'; tl.seek(clamp(t, 0, total), false); syncMedia(false); paint(); }
    btn.onclick = toggle;
    range.oninput = function () { go(+range.value); };
    addEventListener('keydown', function (e) {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight') go(tl.time() + (e.shiftKey ? 1 : 1 / 30));
      if (e.code === 'ArrowLeft') go(tl.time() - (e.shiftKey ? 1 : 1 / 30));
      if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        var seq = FX.scenes.filter(function (s) { return !s.el.classList.contains('overlay'); }), t = tl.time(), k = 0;
        seq.forEach(function (s, i) { if (t >= s.t - 0.001) k = i; });
        go(seq[clamp(k + (e.code === 'ArrowDown' ? 1 : (t - seq[k].t > 0.3 ? 0 : -1)), 0, seq.length - 1)].t);
      }
    });
    addEventListener('resize', fit);
    fit();
    var q = /[?&]t=([\d.]+)/.exec(location.search);
    go(q ? +q[1] : 0);
  }
})(window);
