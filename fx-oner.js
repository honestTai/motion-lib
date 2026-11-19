/* fx-oner.js — 一镜到底（可选模块，加载在 fx.js、fx-stage.js 之后，fx-sound.js 之前）
 *
 * 整条片子像一个不剪的长镜头：所有场景是同一栋楼里的房间（剖面图，像娃娃屋），
 * 摄影机从楼外推进第一个房间，之后横移穿墙、下降穿楼板走到下一间，最后拉回楼外。全程没有一次硬切。
 *
 *   <div id="root" data-mode="stage" …>
 *     <!-- 1. 世界：放在最前面的一个常驻层，里面是一栋「楼」，每个 backdrop 是一个房间 -->
 *     <section class="scene overlay" data-t="0" data-d="全片秒数">
 *       <div data-make="house">
 *         <div data-make="backdrop" data-src="a.jpg" data-cell="0,0"></div>     <!-- 房间 1：第 0 列第 0 层 -->
 *         <div data-make="backdrop" data-src="b.jpg" data-cell="1,0"></div>     <!-- 房间 2：在它右边 → 横移穿墙 -->
 *         <div data-make="backdrop" data-src="c.jpg" data-cell="1,1"></div>     <!-- 房间 3：在它楼下 → 下降穿楼板 -->
 *       </div>
 *     </section>
 *     <!-- 2. 分镜：写 class="scene clear"（透明，看得到后面的世界），用 data-room 说这一镜在哪个房间 -->
 *     <section class="scene clear" data-d="7" data-room="all"> …只放道具… </section>     <!-- all = 楼外全景 -->
 *     <section class="scene clear" data-d="6" data-room="1" data-fx="cam@2.3(y=-40,z=1.1)"> … </section>
 *     <section class="scene clear" data-d="6"> … </section>                               <!-- 不写 = 还在上一个房间 -->
 *     <section class="scene clear" data-d="7" data-room="2"> … </section>                 <!-- 换房间：镜头自己走过去 -->
 *   </div>
 *
 * 镜头怎么动：
 *   换房间        不用写。data-room 变了，镜头在分镜交界处自己走：全景→房间是推进，同层是横移穿墙，上下层是升降穿楼板。
 *                 分镜上可以写 data-move="1.2"（这次走多久）、data-lead="0.3"（提前多久出发，默认走到一半时正好换分镜）。
 *   cam@t(...)    房间里的小运动：x / y 平移（画面像素，正数 = 往右 / 往下看），z 推近倍数，blur 背景虚化的像素数；
 *                 或者 to=#元素 对准某个元素（pull=0.5 走一半）。写在分镜的 data-fx 上，数值是绝对值，reset=1 回正。
 *   shot@t(room=) 分镜中途换机位（比如片尾 room=all 拉回全景）。
 *   push-into@t   推进画里：一张照片先以相框大小出现，镜头推进去直到它铺满全屏，停一会儿再拉出来。代替「全屏插画硬切」。
 * 镜头一直在轻微地呼吸（很慢的推近 + 手持的微晃），不用写。道具比房间离镜头近，镜头一动它们动得更多，这就是景深。
 * 跟着镜头走的常驻元素（比如角色层）加 data-oner-follow，或者元素 id 是 ip-stage：换房间时它们从一侧出画、从另一侧入画。
 *
 * 「全片一个镜头、转场在媒介内部完成」的导演思路参考了 Lemo-Opuscar（MIT）的 DIRECTOR.md，代码是重新写的。
 */
(function (g) {
  'use strict';
  var FX = g.FX; if (!FX || !FX.register) return;
  var num = function (v, d) { v = parseFloat(v); return isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, p) { return a + (b - a) * p; };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var mk = function (tag, cls) { var e = g.document.createElement(tag); if (cls) e.className = cls; return e; };
  var stageEl = function () { return g.document.querySelector('[data-composition-id]'); };
  var ease = function (u) { u = clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u); };          // 慢起慢停
  var def = FX.register, CAT = '镜头';
  var O = FX.oner = { followMax: 120, house: null, moves: [], plunges: [], runs: [], roomScale: 1.035, on: function () { return !!O.house; } };

  /* ═════════════════════════ 楼：把几个 backdrop 摆成一栋楼的剖面 ═════════════════════════ */
  FX.make.house = function (el) {
    var st = stageEl(), W = num(st.getAttribute('data-width'), 1920), H = num(st.getAttribute('data-height'), 1080);
    var GX = num(attr(el, 'gap-x'), 520), GY = num(attr(el, 'gap-y'), 420), PAD = 150, MX = 1500, MT = 1700, MB = 1000;   // 墙厚、楼板厚、外墙厚；楼外留给天空和地面的空
    var kids = Array.prototype.filter.call(el.children, function (k) { return k.getAttribute('data-make') === 'backdrop'; });
    var cells = kids.map(function (k, i) { var c = String(attr(k, 'cell', i + ',0')).split(','); return { c: num(c[0], i), r: num(c[1], 0) }; });
    var cols = 1 + Math.max.apply(null, cells.map(function (c) { return c.c; })), rows = 1 + Math.max.apply(null, cells.map(function (c) { return c.r; }));
    var bodyW = cols * W + (cols - 1) * GX + PAD * 2, bodyH = rows * H + (rows - 1) * GY + PAD * 2, HW = bodyW + MX * 2, HH = bodyH + MT + MB;
    el.classList.add('fx-house'); el.style.width = HW + 'px'; el.style.height = HH + 'px';
    // 夜空：低分辨率画一次再放大，星星是整块的像素
    // 像素皮肤：天空按 1/12 分辨率画、星星是整块像素；其他皮肤：1/3 分辨率、圆形的星星、月亮带光晕
    var pixel = /theme-pixel/.test(st.className + ' ' + g.document.body.className), Q = pixel ? 12 : 3;
    var sky = mk('canvas', 'fx-house-sky' + (pixel ? ' px' : '')), SW = Math.round(HW / Q), SH = Math.round((MT + bodyH) / Q), x = sky.getContext('2d'), r = FX.rand(num(attr(el, 'seed'), 11)), i;
    sky.width = SW; sky.height = SH; sky.style.height = (MT + bodyH) + 'px';
    var grd = x.createLinearGradient(0, 0, 0, SH); grd.addColorStop(0, '#070a1c'); grd.addColorStop(0.55, '#171a44'); grd.addColorStop(1, '#3d2c5c');
    x.fillStyle = grd; x.fillRect(0, 0, SW, SH);
    if (pixel) {
      for (i = 0; i < 260; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.7).toFixed(2) + ')'; var q = r() > 0.9 ? 2 : 1; x.fillRect(Math.floor(r() * SW), Math.floor(r() * SH * 0.8), q, q); }
      x.fillStyle = '#fff3c9'; var mx0 = Math.round(SW * 0.76), my0 = Math.round(SH * 0.3);
      for (var yy = -7; yy <= 7; yy++) for (var xx = -7; xx <= 7; xx++) if (xx * xx + yy * yy <= 49 && (xx - 3) * (xx - 3) + (yy + 2) * (yy + 2) > 36) x.fillRect(mx0 + xx, my0 + yy, 1, 1);
    } else {
      for (i = 0; i < 900; i++) { var sr = r() > 0.94 ? 1.6 : 0.5 + r() * 0.7; x.fillStyle = 'rgba(255,248,230,' + (0.15 + r() * 0.75).toFixed(2) + ')'; x.beginPath(); x.arc(r() * SW, r() * SH * 0.8, sr, 0, 6.283); x.fill(); }
      var mx = SW * 0.76, my = SH * 0.3, mr = SH * 0.05, gl = x.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 6);
      gl.addColorStop(0, 'rgba(255,236,190,.35)'); gl.addColorStop(1, 'rgba(255,236,190,0)'); x.fillStyle = gl; x.fillRect(mx - mr * 6, my - mr * 6, mr * 12, mr * 12);
      x.fillStyle = '#fff4d6'; x.beginPath(); x.arc(mx, my, mr, 0, 6.283); x.fill();
    }
    var ground = mk('div', 'fx-house-ground'); ground.style.cssText = 'left:0;top:' + (MT + bodyH) + 'px;width:' + HW + 'px;height:' + MB + 'px';
    var roof = mk('div', 'fx-house-roof'); roof.style.cssText = 'left:' + (MX - 170) + 'px;top:' + (MT - 330) + 'px;width:' + (bodyW + 340) + 'px;height:340px';
    var body = mk('div', 'fx-house-body'); body.style.cssText = 'left:' + MX + 'px;top:' + MT + 'px;width:' + bodyW + 'px;height:' + bodyH + 'px';
    el.appendChild(sky); el.appendChild(ground); el.appendChild(roof); el.appendChild(body);
    body.style.transformOrigin = '50% 55%'; body.style.transformStyle = 'preserve-3d';
    var rooms = kids.map(function (k, n) {
      var c = cells[n], room = mk('div', 'fx-room'), lx = PAD + c.c * (W + GX), ly = PAD + c.r * (H + GY);
      room.style.cssText = 'left:' + lx + 'px;top:' + ly + 'px;width:' + W + 'px;height:' + H + 'px';
      body.appendChild(room); room.appendChild(k);
      var rim = mk('div', 'fx-room-rim'); room.appendChild(rim);
      if (k.__depth3d) k.__depth3d.ext = true;      // 景深视差由镜头驱动
      return { el: room, bd: k, x: MX + lx + W / 2, y: MT + ly + H / 2 };
    });
    var ws = Math.min(W * 0.93 / (bodyW + 340), H * 0.64 / (bodyH + 330));
    O.house = { el: el, W: W, H: H, rooms: rooms, body: body, view: el.closest('.scene') || el.parentNode,
                wide: { cx: MX + bodyW / 2, cy: MT - 330 + H * 0.315 / ws, s: ws } };      // 全景：整栋楼（连屋顶）放在画面偏下，上面留出夜空
    O.house.view.classList.add('fx-oner-view');
    st.classList.add('fx-oner-on');      // 角色会跟着镜头前后错动，名牌这类贴边的东西要往里收（见 fx.css）
    // 常驻层里的演员（data-make="actor"）自动成为跟随层：换房间时跟着镜头滑出 / 滑入。已经放在 #ip-stage 或 data-oner-follow 里的不管
    Array.prototype.forEach.call(st.querySelectorAll('.scene.overlay [data-make="actor"]'), function (a) {
      if (a.closest('#ip-stage, [data-oner-follow]')) return;
      var w = a.parentNode.querySelector(':scope > .fx-oner-cast');
      if (!w) { w = mk('div', 'fx-oner-cast'); w.setAttribute('data-oner-follow', ''); a.parentNode.insertBefore(w, a); }
      w.appendChild(a);
    });
    // 分镜里的每样东西各包一层：镜头的位移 / 缩放加在包装层上，不和元素自己的动效（它们也在改 transform）打架
    Array.prototype.forEach.call(st.querySelectorAll('.scene:not(.overlay)'), function (sc) {
      var props = mk('div', 'fx-oner-props');
      Array.prototype.slice.call(sc.children).forEach(function (k) {
        var lay = mk('div', 'fx-oner-layer' + (k.classList.contains('fx-fg') ? ' fx-fg' : ''));
        if (k.hasAttribute('data-depth')) lay.setAttribute('data-depth', k.getAttribute('data-depth'));
        lay.appendChild(k); props.appendChild(lay);
      });
      sc.appendChild(props);
    });
  };

  /** 黑边（电影画幅）：<div data-make="letterbox" data-h="96"></div>，放在常驻层里 */
  FX.make.letterbox = function (el) {
    el.classList.add('fx-letterbox'); el.style.setProperty('--bar', num(attr(el, 'h'), 96) + 'px');
    el.appendChild(mk('i', 'top')); el.appendChild(mk('i', 'bottom'));
  };

  /* ═════════════════════════ 机位表：哪一镜在哪个房间，什么时候走 ═════════════════════════ */
  function poseOf(shot) {
    var h = O.house;
    if (shot === 'all') return { cx: h.wide.cx, cy: h.wide.cy, s: h.wide.s };
    var r = h.rooms[clamp((shot | 0) - 1, 0, h.rooms.length - 1)];
    return { cx: r.x, cy: r.y, s: O.roomScale };
  }
  // 两个机位之间怎么过渡：推近时以终点为锚、拉远时以起点为锚，目标始终沿直线移到画面中心
  function blend(a, b, p) {
    var s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), p)), k;
    if (b.s >= a.s) { k = (1 - p) * a.s / s; return { cx: b.cx - (b.cx - a.cx) * k, cy: b.cy - (b.cy - a.cy) * k, s: s }; }
    k = p * b.s / s; return { cx: a.cx - (a.cx - b.cx) * k, cy: a.cy - (a.cy - b.cy) * k, s: s };
  }
  function plan() {
    if (O.planned || !O.house) return; O.planned = true;
    var seq = (FX.scenes || []).filter(function (s) { return !s.el.classList.contains('overlay'); }), shot = null, run = null;
    seq.forEach(function (s, k) {
      var a = s.el.getAttribute('data-room'), sh = a === null ? (shot === null ? 'all' : shot) : a === 'all' ? 'all' : parseInt(a, 10);
      if (k === 0 || sh !== shot) {
        run = { shot: sh, t0: s.t, t1: s.end, L: { x: 0, y: 0, z: 1, blur: 0 }, wide: sh === 'all' }; O.runs.push(run);
        if (k > 0) {
          var from = poseOf(shot), to = poseOf(sh), dx = to.cx - from.cx, dy = to.cy - from.cy;
          var kind = from.s !== to.s ? 'zoom' : Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
          var d = num(attr(s.el, 'move'), kind === 'zoom' ? 1.7 : kind === 'x' ? 1.15 : 1.3), lead = Math.min(d, num(attr(s.el, 'lead'), kind === 'zoom' ? d * 0.72 : d / 2));
          // 卡点：镜头到位的那一刻落在拍子上（换章节的大换场优先落在重拍上）；到位不能早于分镜交界后 0.15 秒，出发不能早于交界前整段运动时间
          var land = FX.snapBeat && !s.el.hasAttribute('data-lead') ? FX.snapBeat(s.t - lead + d, 0.4, s.t + 0.15, s.t + d - 0.15, kind !== 'zoom') : s.t - lead + d;
          lead = Math.max(0.15, Math.min(d - 0.15, s.t + d - land));
          O.moves.push({ t0: s.t - lead, t1: s.t - lead + d, tb: s.t, from: from, to: to, kind: kind, dir: kind === 'x' ? (dx > 0 ? 1 : -1) : kind === 'y' ? (dy > 0 ? 1 : -1) : 0, prev: seq[k - 1], next: s, pb: ease(lead / d) });
        }
        shot = sh;
      }
      s.__run = run; run.t1 = s.end;
    });
  }

  def('cam', CAT, '一镜到底里，房间内的镜头运动：平移、推近、虚化背景。写在分镜上。参数 x / y（画面像素，正数往右 / 往下看）、z（推近倍数，1 是原位）、blur（背景虚化像素）、to=#元素（对准它，pull=0.5 走一半）、reset=1 回正、dur', function (c) {
    plan(); var s = c.scene, o = c.o; if (!s || !s.__run) { console.warn('FX：cam 要写在分镜（section.scene）的 data-fx 上，并且页面里要有 data-make="house"'); return; }
    var to = {}, h = O.house;
    if (o.to) { var r = FX.rect(String(o.to)), pull = num(o.pull, 0.5); if (r) { to.x = (r.cx - h.W / 2) * pull; to.y = (r.cy - h.H / 2) * pull; } }
    ['x', 'y', 'z', 'blur'].forEach(function (k) { if (o[k] !== undefined) to[k] = num(o[k], k === 'z' ? 1 : 0); });
    if (o.reset !== undefined) to = { x: 0, y: 0, z: 1, blur: 0 };
    to.duration = num(o.dur, 0.9); to.ease = o.ease || 'power2.inOut';
    c.tl.to(s.__run.L, to, c.t);
  });
  def('shot', CAT, '一镜到底里，分镜中途换机位：镜头推进某个房间，或拉回楼外全景。写在分镜上。参数 room=房间号|all、dur', function (c) {
    plan(); var s = c.scene; if (!s || !s.__run) return;
    var run = s.__run, to = c.o.room === 'all' || c.o.room === undefined ? 'all' : parseInt(c.o.room, 10), d = num(c.o.dur, 1.7);
    O.moves.push({ t0: c.t, t1: c.t + d, tb: c.t + d / 2, from: poseOf(run.cur === undefined ? run.shot : run.cur), to: poseOf(to), kind: 'zoom', dir: 0, mid: true, pb: 0.5 });
    run.cur = to;
  });
  def('push-into', CAT, '推进画里：元素先以相框大小出现，镜头推进去直到它铺满全屏，停住，再拉出来。写在分镜里一张绝对定位的图上（left/top/width/height）。参数 dur（从开始推到拉完的总秒数）、in / out（推、拉各用多久）、cast=keep（角色不让开）、stay=1（拉出来后相框留着）', function (c) {
    plan(); var el = c.el, h = O.house, o = c.o; if (!h) return;
    // 先定成绝对定位再量（按作者写的 left/top/width/height），量出来的才是它平时在画面里的位置
    el.classList.add('fx-photo'); el.style.position = 'absolute';
    var r = { w: el.offsetWidth, h: el.offsetHeight, cx: el.offsetLeft + el.offsetWidth / 2, cy: el.offsetTop + el.offsetHeight / 2 };
    var Z = Math.max(h.W / r.w, h.H / r.h) * num(o.fill, 1.05), d = num(o.dur, 2), tin = num(o['in'], 0.55), tout = num(o.out, 0.45);
    // 按铺满时的尺寸排版、平时自己缩小：推进去以后看到的是原始清晰度，不是放大的糊图
    el.style.left = (r.cx - r.w * Z / 2) + 'px'; el.style.top = (r.cy - r.h * Z / 2) + 'px';
    el.style.width = r.w * Z + 'px'; el.style.height = r.h * Z + 'px'; el.style.setProperty('--z', Z.toFixed(3)); el.__onerBase = 1 / Z;
    // 卡点：照片铺满全屏的那一刻落在拍子上（最多挪 0.2 秒）
    var T0 = c.t; if (FX.snapBeat) T0 = FX.snapBeat(c.t + tin, 0.2) - tin;
    O.plunges.push({ t: T0, a: T0 + tin, b: T0 + d - tout, e: T0 + d, x: r.cx, y: r.cy, Z: Z, keep: String(o.cast) === 'keep' });
    FX.calls.push({ name: 'cam-to', t: T0 + d - tout, trans: true, o: { vol: 0.7 } });
    c.tl.set(el, { opacity: 0 }, 0);
    c.tl.fromTo(el, { opacity: 0, scale: 0.72 }, { opacity: 1, scale: 1, duration: 0.24, ease: 'back.out(1.7)', immediateRender: false }, Math.max(0, T0 - 0.3));
    if (String(o.stay) !== '1') c.tl.to(el, { opacity: 0, scale: 0.8, duration: 0.16, ease: 'power2.in' }, T0 + d + 0.04);
  });

  /* ═════════════════════════ 每一帧：按时间线的秒数摆好世界、道具和跟随层 ═════════════════════════ */
  function poseAt(t) {
    var ms = O.moves, p = poseOf(O.runs[0].shot), i, m;
    for (i = 0; i < ms.length; i++) {
      m = ms[i];
      if (t >= m.t1) p = m.to;
      else if (t > m.t0) { var e = ease((t - m.t0) / (m.t1 - m.t0)); return { pose: blend(m.from, m.to, e), move: m, p: e }; }
      else break;
    }
    return { pose: p, p: 0 };
  }
  /** 这一刻镜头是不是正在换机位 / 推进画里（自检挑帧时避开这些时刻：道具正在飞出画，量出来没有意义） */
  O.busy = function (t) {
    return O.moves.some(function (m) { return t > m.t0 - 0.05 && t < m.t1 + 0.05; }) || O.plunges.some(function (q) { return t > q.t - 0.35 && t < q.e + 0.25; });
  };
  function runAt(t) { var r = O.runs[0]; O.runs.forEach(function (x) { if (t >= x.t0) r = x; }); return r; }
  function drift(run, t) { var age = Math.max(0, t - run.t0); return run.wide ? 1 + Math.min(0.14, 0.013 * age) : 1 + Math.min(0.05, 0.0045 * age); }

  (FX.afterBuild = FX.afterBuild || []).push(function (tl, total) {
    if (!O.house) return;
    plan(); O.moves.sort(function (a, b) { return a.t0 - b.t0; });
    // 换机位的声音交给音效层（它排在本模块后面加载）
    O.moves.forEach(function (m) { FX.calls.push({ name: 'cam-to', t: m.t0 + (m.t1 - m.t0) * 0.18, trans: true, o: { dur: m.t1 - m.t0 } }); });
    var h = O.house, W = h.W, H = h.H, Cx = W / 2, Cy = H / 2, st = stageEl(), doc = g.document;
    var seq = (FX.scenes || []).filter(function (s) { return !s.el.classList.contains('overlay'); });
    seq.forEach(function (s) {
      s.__props = s.el.querySelector('.fx-oner-props');
      s.__layers = s.__props ? Array.prototype.map.call(s.__props.children, function (lay) {
        var k = lay.firstElementChild || lay, cx = k.offsetLeft + k.offsetWidth / 2, cy = k.offsetTop + k.offsetHeight / 2;
        lay.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px';
        if (k.__onerBase) lay.style.zIndex = 5;
        return { el: lay, d: num(lay.getAttribute('data-depth'), lay.classList.contains('fx-fg') ? 2 : 1.15), cx: cx, cy: cy, base: k.__onerBase || 1 };
      }) : [];
    });
    var followers = Array.prototype.slice.call(doc.querySelectorAll('#ip-stage, [data-oner-follow]'));
    // 方向性运动模糊：横移 / 升降最快的那几帧，沿运动方向拉一下
    var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="fx-oner-mb" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0"/></filter>';
    st.appendChild(svg); var fe = svg.querySelector('feGaussianBlur');
    // 贴着镜头扫过去的一截墙 / 楼板：比房间近得多，过得更快，穿墙的感觉主要靠它
    var pillar = mk('div', 'fx-oner-pillar'); h.view.appendChild(pillar);

    var paint = function () {
      var t = tl.time(), pa = poseAt(t), P = pa.pose, m = pa.move, p = pa.p, run = runAt(t), L = run.L, Lx = L.x, Ly = L.y, Lz = L.z, Lb = L.blur, dr = drift(run, t), wideK = run.wide ? 1 : 0;
      var boundary = m && !m.mid;
      if (boundary) {
        var A0 = m.prev.__run, B0 = m.next.__run;
        Lx = lerp(A0.L.x, B0.L.x, p); Ly = lerp(A0.L.y, B0.L.y, p); Lz = lerp(A0.L.z, B0.L.z, p); Lb = lerp(A0.L.blur, B0.L.blur, p);
        dr = lerp(drift(A0, t), drift(B0, t), p); wideK = lerp(A0.wide ? 1 : 0, B0.wide ? 1 : 0, p);
      } else if (m) wideK = P.s < 0.6 ? 1 : 0;
      var sw = 1 - wideK * 0.7, swx = (4 * Math.sin(t * 0.83) + 2.5 * Math.sin(t * 1.9 + 1.3)) * sw, swy = (2.5 * Math.sin(t * 1.07 + 0.6) + 1.5 * Math.sin(t * 2.3)) * sw;
      // 推进画里
      var k = 0, pl = null;
      O.plunges.forEach(function (q) { var v = t <= q.t || t >= q.e ? 0 : t < q.a ? ease((t - q.t) / (q.a - q.t)) : t < q.b ? 1 : 1 - ease((t - q.b) / (q.e - q.b)); if (v > k) { k = v; pl = q; } });
      var sg = pl ? Math.exp(Math.log(pl.Z) * k) : 1, Ax = pl ? lerp(Cx, pl.x, k) : Cx, Ay = pl ? lerp(Cy, pl.y, k) : Cy;
      // 推进画里的时候，房间里的小运动（平移、推近、呼吸、微晃）先收回正位：照片才会正好铺满，不会偏一截
      if (k > 0) { var kk = 1 - k; Lx *= kk; Ly *= kk; Lz = 1 + (Lz - 1) * kk; Lb *= kk; swx *= kk; swy *= kk; dr = 1 + (dr - 1) * kk; }
      // 世界
      var s0 = P.s * Lz * dr, cx = P.cx + (Lx + swx) / s0 + (Ax - Cx) / s0, cy = P.cy + (Ly + swy) / s0 + (Ay - Cy) / s0, s = s0 * sg;
      h.el.style.transform = 'translate(' + (Cx - cx * s).toFixed(2) + 'px,' + (Cy - cy * s).toFixed(2) + 'px) scale(' + s.toFixed(5) + ')';
      h.rooms.forEach(function (r) { r.bd.style.transform = 'translate(' + clamp((cx - r.x) * 0.16, -46, 46).toFixed(1) + 'px,' + clamp((cy - r.y) * 0.16, -26, 26).toFixed(1) + 'px)'; });
      // 景深视差：每个房间按「镜头中心离房间中心多远、推得多近」重画（只画看得见的房间）
      var refS = O.roomScale;
      h.rooms.forEach(function (r) {
        var D = r.bd.__depth3d; if (!D) return;
        var sxp = Cx + (r.x - cx) * s, syp = Cy + (r.y - cy) * s;
        if (Math.abs(sxp - Cx) > W * (0.5 + 0.55 * s) || Math.abs(syp - Cy) > H * (0.5 + 0.55 * s)) return;
        D.set(clamp((cx - r.x) / W, -0.7, 0.7), clamp((cy - r.y) / H, -0.7, 0.7), clamp(s / refS - 1, -0.5, 0.6));
      });
      // 楼外全景时整栋楼转成一个 3/4 视角并慢慢转回来（房间嵌在墙里，转起来前后错开）；推进房间时转正
      var wk = wideK, ry = wk * (-11 + 4 * Math.sin(t * 0.22)), rx = wk * (4 + 1.2 * Math.sin(t * 0.17 + 1));
      h.body.style.transform = wk > 0.001 ? 'perspective(2600px) rotateY(' + ry.toFixed(3) + 'deg) rotateX(' + rx.toFixed(3) + 'deg)' : '';
      // 运动模糊的强度：这一帧世界在屏幕上跑多快
      var std = 0, horiz = true;
      if (boundary && m.kind !== 'zoom') {
        var e1 = ease((t + 0.008 - m.t0) / (m.t1 - m.t0)), e0 = ease((t - 0.008 - m.t0) / (m.t1 - m.t0)), dist = m.kind === 'x' ? Math.abs(m.to.cx - m.from.cx) : Math.abs(m.to.cy - m.from.cy);
        std = Math.min(30, (e1 - e0) / 0.016 * dist * P.s / 340); horiz = m.kind === 'x';
      }
      var mb = std > 0.4 ? ' url(#fx-oner-mb)' : '';
      if (mb) fe.setAttribute('stdDeviation', horiz ? std.toFixed(1) + ' 0' : '0 ' + std.toFixed(1));
      h.view.style.filter = ((Lb > 0.05 ? 'blur(' + Lb.toFixed(1) + 'px)' : '') + mb) || 'none';
      if (boundary && m.kind !== 'zoom') {
        var u = m.dir > 0 ? p : 1 - p;
        var gr = 'rgba(8,6,12,0),#0a0810 22%,#130f19 50%,#0a0810 78%,rgba(8,6,12,0))';
        pillar.style.cssText = m.kind === 'x' ? 'display:block;background:linear-gradient(90deg,' + gr + ';top:-4%;height:108%;width:' + Math.round(W * 0.42) + 'px;left:' + lerp(W * 1.25, -W * 0.7, u).toFixed(0) + 'px'
          : 'display:block;background:linear-gradient(180deg,' + gr + ';left:-4%;width:108%;height:' + Math.round(H * 0.5) + 'px;top:' + lerp(H * 1.3, -H * 0.85, u).toFixed(0) + 'px';
      } else pillar.style.display = 'none';
      // 分镜里的道具：比世界近，跟着镜头动得更多；换房间时整体滑出 / 滑入
      seq.forEach(function (sc) {
        if (t < sc.t - 0.02 || t > sc.end + (sc.hold || 0) + 0.02) return;
        var tx = 0, ty = 0, fade = 1, zs = 1;
        if (boundary) {
          if (m.kind === 'zoom') {
            if (sc === m.prev) { var q1 = clamp((t - m.t0) / Math.max(0.01, m.tb - m.t0), 0, 1); fade = 1 - q1 * q1; zs = 1 + 0.45 * q1 * q1; }
          } else {
            var K = m.kind === 'x' ? 4000 : 2400, off = sc === m.prev ? -m.dir * p * K : sc === m.next ? m.dir * (1 - p) * K : 0;
            if (m.kind === 'x') tx = off; else ty = off;
          }
        }
        var ps = sc.__props; if (!ps) return;
        ps.style.transform = 'translate(' + ((Cx - Ax) * sg).toFixed(2) + 'px,' + ((Cy - Ay) * sg).toFixed(2) + 'px) scale(' + (sg * zs).toFixed(5) + ')';
        ps.style.opacity = fade < 0.999 ? fade.toFixed(3) : '';
        ps.style.filter = mb ? 'url(#fx-oner-mb)' : '';
        var zl0 = Lz * (wideK > 0.5 ? 1 : dr);
        (sc.__layers || []).forEach(function (Y) {
          var zl = 1 + (zl0 - 1) * Y.d * 0.4;      // 道具是要读的字：平移时比房间动得多（近），推近时只跟着放大一小部分，不会被推出画
          // 道具像立在空间里的一块板：镜头往哪边看，它就朝那边微微转过来（透视转角）
          var tyr = clamp(-(Lx + swx) / W * 22 - tx / W * 10, -9, 9), txr = clamp((Ly + swy) / H * 14 + ty / H * 6, -6, 6);
          Y.el.style.transform = 'translate(' + ((Y.cx - Cx) * (zl - 1) - (Lx + swx) * Y.d * zl + tx * Y.d / 1.15).toFixed(2) + 'px,' + ((Y.cy - Cy) * (zl - 1) - (Ly + swy) * Y.d * zl + ty * Y.d / 1.15).toFixed(2) + 'px) scale(' + (zl * Y.base).toFixed(5) + ') perspective(1600px) rotateY(' + tyr.toFixed(2) + 'deg) rotateX(' + txr.toFixed(2) + 'deg)';
        });
      });
      // 跟随层（角色）：换房间时从一侧出画、另一侧入画；镜头推进画里时往下让开
      var fx = 0, fy = 0;
      if (boundary && m.kind !== 'zoom') { var o2 = (t < m.tb ? -p : 1 - p) * m.dir * (m.kind === 'x' ? 4600 : 2600); if (m.kind === 'x') fx = o2; else fy = o2; }
      if (pl && !pl.keep) fy += k * 940;
      // 角色在最前面：镜头平移时比道具、房间移得都多（不再像贴在屏幕上）
      var kk2 = pl ? 1 - k : 1; fx += clamp(-(Lx + swx) * 1.3, -O.followMax, O.followMax) * kk2; fy += clamp(-(Ly + swy) * 0.7, -60, 60) * kk2;
      var fz = 1;      // 不跟着放大：角色在画面两侧，整体放大会把两边的人推出画
      followers.forEach(function (f) { f.style.translate = fx.toFixed(1) + 'px ' + fy.toFixed(1) + 'px'; f.style.scale = Math.abs(fz - 1) < 1e-4 ? '' : fz.toFixed(4); f.style.transformOrigin = '50% 100%'; f.style.filter = mb ? 'url(#fx-oner-mb)' : ''; });
    };
    if (FX.onFrame) FX.onFrame(paint); else tl.to({ v: 0 }, { v: 1, duration: total, ease: 'none', onUpdate: paint }, 0);
    O.paint = paint; paint();
  });
})(typeof window !== 'undefined' ? window : globalThis);
