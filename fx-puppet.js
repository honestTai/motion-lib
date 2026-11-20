/*!
 * FX 立绘木偶模块 v1.6  ——  motion-lib 的可选扩展：让一张静态立绘「活」起来
 *
 * 只需要每个姿势 3 张图（闭嘴 / 半张 / 张大），不用分层、不用骨骼：
 *   · 眨眼      把眼睛区域纵向压扁成一条线（给出两只眼睛的位置即可），间隔随机、偶尔连眨两下
 *   · 呼吸      胸口轻微起伏，头跟着浮动
 *   · 头部摆动  以脖子为轴缓慢左右晃；说话时跟着音量点头、摆头
 *   · 对口型    按口型序列切换三张嘴
 *   · 倾身      整个人朝某一侧微微倾斜（听对方说话）
 *   · 点头      听的人应和、说的人强调
 *   · 情绪符号  头顶弹出手绘风符号（问号、感叹号、汗、怒、闪光、灯泡、爱心、闪电、省略号），不用 emoji
 *
 * 声明式用法：
 *   <div class="abs" style="left:120px;bottom:0;width:520px;height:520px"
 *        data-make="puppet" data-src="assets/chars/host_explain" data-eyes="296,232,50,50/382,232,48,50" data-neck="335,320"
 *        data-fx="pup-talk@0.4(dur=3.2) pup-emote@2(kind=idea) pup-nod@4.5"></div>
 *   data-src 是不带后缀的路径，库会去读 <src>_m0.png / _m1.png / _m2.png；坐标都按原图像素写。
 *   有闭眼图时写 data-lid="1"（读 <src>_blink.png），眨眼时在眼睛的位置换成闭眼图，适合精细的画风。
 *
 * 脚本用法（多姿势、自己排时间）：
 *   var p = FX.puppet(el, { size: 600, poses: { explain: { src: 'chars/host_explain', eyes: [[296,232,50,50],[382,232,48,50]], neck: [335,320] } } });
 *   p.pose(0, 'explain'); p.speak(1.2, 4.8, mouthTrack); p.nod(6); p.lean(5, -2); p.emote(tl, 7, 'sweat', 9);   // 在 FX.build() 之前或它的 extra 里调用
 *
 * 画面是「时间的纯函数」：任意跳帧、重复渲染结果都相同。用 2D 画布逐条绘制，不依赖 WebGL。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-puppet：请先加载 fx.js');

  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var PAD = 0.12;       // 画布比立绘四周多出的留白（头晃出去不会被切掉）
  var STRIP = 4;        // 每条的高度（原图像素）

  /* ── 情绪符号：手绘风矢量图，各台机器渲染一致 ── */
  var INK = '#161514';
  var EMOTES = {
    question: '<path d="M32 40c0-13 10-22 24-22s24 9 24 21c0 10-6 15-13 20-5 4-7 6-7 12" fill="none" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/><path d="M32 40c0-13 10-22 24-22s24 9 24 21c0 10-6 15-13 20-5 4-7 6-7 12" fill="none" stroke="#ffd43b" stroke-width="6" stroke-linecap="round"/><circle cx="59" cy="92" r="9" fill="#ffd43b" stroke="' + INK + '" stroke-width="4"/>',
    exclaim: '<path d="M46 14h20l-4 52H50z" fill="#ff5247" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><circle cx="56" cy="88" r="10" fill="#ff5247" stroke="' + INK + '" stroke-width="5"/>',
    sweat: '<path d="M56 12c16 24 26 38 26 54a26 26 0 0 1-52 0c0-16 10-30 26-54z" fill="#7fd1ff" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><path d="M44 66c0 8 5 13 11 14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    anger: '<g fill="none" stroke="' + INK + '" stroke-width="15" stroke-linecap="round"><path d="M24 44c14 0 20-6 20-20M88 44c-14 0-20-6-20-20M24 68c14 0 20 6 20 20M88 68c-14 0-20 6-20 20"/></g><g fill="none" stroke="#ff5247" stroke-width="8" stroke-linecap="round"><path d="M24 44c14 0 20-6 20-20M88 44c-14 0-20-6-20-20M24 68c14 0 20 6 20 20M88 68c-14 0-20 6-20 20"/></g>',
    sparkle: '<path d="M52 8c4 26 12 34 38 40-26 6-34 14-38 40-4-26-12-34-38-40 26-6 34-14 38-40z" fill="#ffd43b" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><path d="M90 70c2 10 5 13 15 15-10 2-13 5-15 15-2-10-5-13-15-15 10-2 13-5 15-15z" fill="#fff" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>',
    idea: '<path d="M56 14a28 28 0 0 0-17 50c4 4 6 8 6 13h22c0-5 2-9 6-13a28 28 0 0 0-17-50z" fill="#ffd43b" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><rect x="44" y="80" width="24" height="16" rx="5" fill="#e8eeff" stroke="' + INK + '" stroke-width="5"/><g stroke="' + INK + '" stroke-width="5" stroke-linecap="round"><path d="M10 40h10M92 40h10M22 12l7 8M90 12l-7 8"/></g>',
    heart: '<path d="M56 96C22 72 12 54 12 40a22 22 0 0 1 44-6 22 22 0 0 1 44 6c0 14-10 32-44 56z" fill="#ff6b8b" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><path d="M28 36c2-7 7-10 13-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    zap: '<path d="M64 8 24 62h26l-8 42 44-58H58z" fill="#ffd43b" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>',
    dots: '<rect x="8" y="30" width="96" height="52" rx="26" fill="#fffdf7" stroke="' + INK + '" stroke-width="5"/><circle cx="34" cy="56" r="8" fill="' + INK + '"/><circle cx="56" cy="56" r="8" fill="' + INK + '"/><circle cx="78" cy="56" r="8" fill="' + INK + '"/>'
  };
  // 旧写法里用的 emoji → 符号名
  var ALIAS = { '❓': 'question', '?': 'question', '？': 'question', '❗': 'exclaim', '!': 'exclaim', '！': 'exclaim', '💦': 'sweat', '😅': 'sweat', '💢': 'anger', '😡': 'anger',
                '✨': 'sparkle', '🌟': 'sparkle', '💡': 'idea', '❤️': 'heart', '❤': 'heart', '😍': 'heart', '⚡': 'zap', '🔥': 'zap', '…': 'dots', '💬': 'dots', '🤔': 'question', '😱': 'exclaim', '🚨': 'exclaim' };
  FX.emoteSVG = function (kind) {
    kind = ALIAS[kind] || kind;
    return EMOTES[kind] ? '<svg viewBox="0 0 112 112" width="100%" height="100%">' + EMOTES[kind] + '</svg>' : null;
  };

  /* ── 木偶 ── */
  FX.puppet = function (host, opt) {
    opt = opt || {};
    var SZ = num(opt.size, 600), pad = Math.round(SZ * PAD), CW = SZ + pad * 2, CH = SZ + pad;
    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    canvas.width = CW; canvas.height = CH;
    canvas.className = 'fx-puppet-canvas';
    canvas.style.cssText = 'position:absolute;left:' + (-PAD * 100) + '%;top:' + (-PAD * 100) + '%;width:' + (100 + PAD * 200) + '%;height:' + (100 + PAD * 100) + '%;pointer-events:none';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(canvas);
    var buf = document.createElement('canvas'), bx = buf.getContext('2d');
    buf.width = buf.height = SZ;

    var rnd = FX.rand(num(opt.seed, 1)), phase = rnd() * 10, P = {}, lastT = 0, total = 0;
    var poseKeys = [], talks = [], nods = [], leans = [], forced = [], blinks = null, alive = opt.alive === undefined ? 1 : num(opt.alive, 1);
    var self = { el: host, canvas: canvas };

    function redraw() { draw(lastT); }
    self.addPose = function (name, def) {
      var p = { name: name, eyes: def.eyes || [], neck: def.neck || [SZ / 2, SZ * 0.55], imgs: [] };
      for (var i = 0; i < 3; i++) {
        var im = new Image();
        im.onload = redraw;
        im.src = def.frames ? def.frames[i] : def.src + '_m' + i + '.png';
        p.imgs.push(im);
      }
      if (def.lid) {                                   // 闭眼图（<src>_blink.png，或直接给路径）：眨眼时换这张，比把眼睛压扁更适合精细的画风
        p.lid = new Image();
        p.lid.onload = redraw;
        p.lid.src = typeof def.lid === 'string' ? def.lid : def.src + '_blink.png';
      }
      P[name] = p;
      if (!poseKeys.length) poseKeys.push({ t: -1, name: name });
      return self;
    };
    Object.keys(opt.poses || {}).forEach(function (k) { self.addPose(k, opt.poses[k]); });

    /** 从 t 秒起换成某个姿势（换的瞬间会自动眨一下眼，盖住跳变） */
    self.pose = function (t, name) { if (P[name]) { poseKeys.push({ t: t, name: name }); poseKeys.sort(function (a, b) { return a.t - b.t; }); blinks = null; } return self; };
    /** t 秒时脸的中心（原图像素）：两眼中点；闭眼姿势没有眼睛数据时用脖子上方估 */
    self.faceAt = function (t) { var p = poseAt(t), e = p.eyes; return e && e.length > 1 ? [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2 + 14] : [p.neck[0], p.neck[1] - SZ * 0.16]; };
    /** 某个时间段里有没有排过换姿势（给上层编排用） */
    self.hasPose = function (t0, t1) { return poseKeys.some(function (k) { return k.t >= t0 && k.t < t1; }); };
    /** t0–t1 说话。track = { fps, frames:'0120…' }（全片时间轴上的口型序列）；不给就按音节节奏自己生成 */
    self.speak = function (t0, t1, track) { talks.push({ t0: t0, t1: t1, track: track && track.frames ? track : null }); return self; };
    /** 在 t 秒眨一下眼（平时会自己随机眨，这个用来卡点） */
    self.blink = function (t) { forced.push(t); blinks = null; return self; };
    /** 点一下头。amp 幅度（默认 1） */
    self.nod = function (t, amp) { nods.push({ t: t, a: num(amp, 1) }); return self; };
    /** 整个人倾斜到 deg 度（正数向右），dur 秒到位 */
    self.lean = function (t, deg, dur) { leans.push({ t: t, deg: deg, dur: num(dur, 0.5) }); leans.sort(function (a, b) { return a.t - b.t; }); return self; };
    /** 头顶弹出情绪符号。kind 见上面的 EMOTES；endT 之前自动收起 */
    self.emote = function (tl, t, kind, endT) {
      var svg = FX.emoteSVG(kind), el = document.createElement('div');
      el.className = 'fx-puppet-emote' + (svg ? '' : ' text');
      if (svg) el.innerHTML = svg; else el.textContent = kind;
      host.appendChild(el);
      endT = endT === undefined ? t + 1.6 : endT;
      tl.set(el, { visibility: 'visible' }, t);
      tl.fromTo(el, { opacity: 0, scale: 0.3, y: 20, rotation: -14 }, { opacity: 1, scale: 1, y: 0, rotation: 0, duration: 0.26, ease: 'back.out(2.6)' }, t);
      tl.to(el, { y: -10, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.floor((endT - t - 0.5) / 0.5)) }, t + 0.26);
      tl.to(el, { opacity: 0, scale: 0.6, duration: 0.16, ease: 'power2.in' }, Math.max(t + 0.4, endT - 0.2));
      tl.set(el, { visibility: 'hidden' }, endT);
      return self;
    };
    /** 接到时间线上。FX.build() 收尾时会自动调用，不用自己调 */
    self.attach = function (tl, dur) {
      total = dur;
      tl.to({ v: 0 }, { v: 1, duration: dur, ease: 'none', onUpdate: function () { draw(tl.time()); } }, 0);
      draw(0);
      return self;
    };

    function poseAt(t) { var n = poseKeys[0].name; for (var i = 0; i < poseKeys.length; i++) { if (poseKeys[i].t <= t) n = poseKeys[i].name; else break; } return P[n]; }
    function talkAt(t) { for (var i = 0; i < talks.length; i++) if (t >= talks[i].t0 && t < talks[i].t1) return talks[i]; return null; }
    function mouthAt(t) {
      var k = talkAt(t);
      if (!k || t > k.t1 - 0.03) return 0;
      if (k.track) return parseInt(k.track.frames.charAt(Math.floor(t * k.track.fps)), 10) || 0;
      var s = Math.floor((t - k.t0) * 9), r = FX.rand(s * 31 + 7)();          // 没有口型序列：每秒约 9 个音节
      return r < 0.22 ? 0 : r < 0.62 ? 1 : 2;
    }
    function energy(t) { var e = 0; for (var i = -2; i <= 2; i++) e += mouthAt(t + i * 0.06); return e / 10; }
    function buildBlinks() {
      blinks = [];
      var r = FX.rand(num(opt.seed, 1) * 13 + 5), t = 0.8 + r() * 2;
      while (t < total + 1) { blinks.push(t); if (r() < 0.18) blinks.push(t + 0.3); t += 2.3 + r() * 3.4; }
      poseKeys.forEach(function (k) { if (k.t > 0) blinks.push(k.t - 0.06); });
      forced.forEach(function (t) { blinks.push(t); });
      blinks.sort(function (a, b) { return a - b; });
    }
    function blinkAt(t) {
      if (!blinks) buildBlinks();
      var k = 0;
      for (var i = 0; i < blinks.length; i++) {
        var d = t - blinks[i];
        if (d < 0) break;
        if (d < 0.26) k = Math.max(k, d < 0.07 ? d / 0.07 : d < 0.12 ? 1 : 1 - (d - 0.12) / 0.14);
      }
      return k * k * (3 - 2 * k);
    }
    function nodAt(t) { var v = 0; nods.forEach(function (n) { var d = t - n.t; if (d > 0 && d < 0.42) v += n.a * Math.sin(Math.PI * d / 0.42) * (1 - d / 0.84); }); return v; }
    function leanAt(t) {
      var v = 0;
      for (var i = 0; i < leans.length; i++) { var L = leans[i]; if (t < L.t) break; var p = clamp((t - L.t) / L.dur, 0, 1); p = p * p * (3 - 2 * p); v = lerp(v, L.deg, p); }
      return v;
    }

    function drawFace(p, mouth, blink) {
      var im = p.imgs[mouth] && p.imgs[mouth].complete && p.imgs[mouth].naturalWidth ? p.imgs[mouth] : p.imgs[0];
      bx.clearRect(0, 0, SZ, SZ);
      if (!im || !im.complete || !im.naturalWidth) return false;
      var k = SZ / im.naturalWidth;
      bx.drawImage(im, 0, 0, SZ, SZ);
      if (p.lid && p.lid.complete && p.lid.naturalWidth && p.eyes.length) {
        // 闭眼图除了眼睛和张嘴前的原图一样，只在眼睛的椭圆里叠上去，嘴型不受影响。
        // 像动画里那样直接切换（半透明叠化会出现两层眼睛的重影），闭眼约 0.14 秒
        if (blink > 0.55) {
          bx.save();
          bx.beginPath();
          p.eyes.forEach(function (e) { bx.moveTo(e[0] + e[2] * 0.78, e[1]); bx.ellipse(e[0], e[1], e[2] * 0.78, e[3] * 0.78, 0, 0, Math.PI * 2); });
          bx.clip();
          bx.drawImage(p.lid, 0, 0, SZ, SZ);
          bx.restore();
        }
        return true;
      }
      if (blink > 0.01) p.eyes.forEach(function (e) {
        // 眼睛纵向压成一条线：上方的皮肤往下拉（竖着的刘海拉长后看不出来），眼睛本身压扁，下方略微上提
        var cx = e[0], cy = e[1], w = e[2], h = e[3], mx = w * 0.16, my = h * 0.16;
        var x0 = cx - w / 2 - mx, x1 = cx + w / 2 + mx, y0 = cy - h / 2 - my, y1 = cy + h / 2 + my, e0 = cy - h / 2, e1 = cy + h / 2;
        var yc = cy + h * 0.3, thin = h * 0.05, cols = 16, cw = (x1 - x0) / cols;
        for (var c = 0; c < cols; c++) {
          var u = (c + 0.5) / cols, kj = blink * smooth(0, 0.2, u) * smooth(1, 0.8, u);
          var a = lerp(e0, yc - thin, kj), b = lerp(e1, yc + thin, kj), sx = x0 + c * cw;
          bx.clearRect(sx, y0, cw, y1 - y0);
          bx.drawImage(im, sx / k, y0 / k, cw / k, (e0 - y0) / k, sx, y0, cw, a - y0 + 0.6);
          bx.drawImage(im, sx / k, e0 / k, cw / k, (e1 - e0) / k, sx, a, cw, b - a + 0.6);
          bx.drawImage(im, sx / k, e1 / k, cw / k, (y1 - e1) / k, sx, b, cw, y1 - b);
        }
        if (blink > 0.72) {                       // 快闭上时补一道干净的睫毛线
          bx.save();
          bx.globalAlpha = (blink - 0.72) / 0.28;
          bx.strokeStyle = e[4] || '#2b1b1e'; bx.lineWidth = Math.max(3, h * 0.085); bx.lineCap = 'round';
          bx.beginPath(); bx.moveTo(cx - w * 0.46, yc - h * 0.04); bx.quadraticCurveTo(cx, yc + h * 0.13, cx + w * 0.46, yc - h * 0.04); bx.stroke();
          bx.restore();
        }
      });
      return true;
    }

    function draw(t) {
      lastT = t;
      var p = poseAt(t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, CW, CH);
      if (!p || !drawFace(p, mouthAt(t), blinkAt(t))) return;
      var e = energy(t), nod = nodAt(t), tt = t + phase;
      var breath = Math.sin(tt * 1.9) * alive;                                                     // 约 3.3 秒一次呼吸
      var sway = (Math.sin(tt * 0.83) * 0.9 + Math.sin(tt * 1.37 + 1.7) * 0.5) * alive;            // 头的慢晃，单位：度
      var talkTilt = e * Math.sin(tt * 5.1) * 2.1 + e * Math.sin(tt * 2.3 + 0.6) * 1.2;            // 说话时跟着音量摆头
      var headDeg = sway + talkTilt, headDy = -e * 5 + nod * 9 - breath * 1.4, squash = 1 - nod * 0.018 + e * 0.008;
      var lean = leanAt(t) + Math.sin(tt * 0.6 + 2) * 0.35 * alive, nx = p.neck[0], ny = p.neck[1];
      var bc = Math.cos(lean * Math.PI / 180), bs = Math.sin(lean * Math.PI / 180), ox = SZ / 2, oy = SZ;   // 倾身：绕立绘底边中点转
      for (var y = 0; y < SZ; y += STRIP) {
        var ym = y + STRIP / 2, wh = smooth(ny + 34, ny - 70, ym);                                 // 1 = 头，0 = 身体
        var wb = smooth(SZ, ny + 20, ym);                                                          // 0 = 底边钉住，1 = 肩膀以上
        var a = headDeg * wh * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        var chest = Math.exp(-Math.pow((ym - (ny + 90)) / 80, 2));                                  // 胸口那一段
        var sx = 1 + breath * 0.012 * chest, dy = -breath * 2.6 * wb + headDy * wh;
        var sy = wh > 0.5 ? squash : 1;
        // 这一条：先横向呼吸缩放（绕中线），再绕脖子转，再整体倾身
        // 点 (x, y) → 头部旋转： R(a)·[(x-nx)*sx', (y-ny)*sy] + (nx, ny + dy)
        var m11 = c * sx, m12 = s * sx, m21 = -s * sy, m22 = c * sy;
        var tx = nx - (m11 * nx + m21 * ny) + (1 - sx) * (ox - nx) * c, ty = ny + dy - (m12 * nx + m22 * ny) + (1 - sx) * (ox - nx) * s;
        // 再乘倾身矩阵 B：绕 (ox, oy) 转 lean
        var A = bc * m11 - bs * m12, B = bs * m11 + bc * m12, C = bc * m21 - bs * m22, D = bs * m21 + bc * m22;
        var E = bc * (tx - ox) - bs * (ty - oy) + ox + pad, F = bs * (tx - ox) + bc * (ty - oy) + oy + pad;
        ctx.setTransform(A, B, C, D, E, F);
        ctx.drawImage(buf, 0, y, SZ, STRIP + 2, 0, y, SZ, STRIP + 2);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    self.draw = draw;
    ALL.push(self);
    return self;
  };
  var ALL = [];
  (FX.afterBuild = FX.afterBuild || []).push(function (tl, total) {
    ALL.forEach(function (p) { if (p.compileMoves) p.compileMoves(tl); p.attach(tl, total); });
  });

  /* ── 演员：会「跟着内容走」的木偶 ──
   * 演员住在常驻层里，不属于任何一个分镜。画面里讲到哪个元素，就在那个元素上写 call，演员会从原地蹲下、
   * 在那个元素旁边重新冒出来（半身立绘最自然的走位方式）：
   *   at=top    从元素上沿探出来（像站在卡片后面），align 控制靠左还是靠右
   *   at=left / right   站到元素的左边 / 右边（脚踩画面底边）
   *   at=below  站到元素正下方
   * 没有元素可去时回到自己的 home。 */
  FX.cast = {};
  var BASE = 520;
  function stageEl() { return document.querySelector('[data-composition-id]'); }
  FX.actor = function (name, opt) {
    opt = opt || {};
    var st = stageEl(), layer = opt.layer || st.querySelector('.fx-cast');
    if (!layer) { layer = document.createElement('div'); layer.className = 'fx-cast'; st.appendChild(layer); }
    var slot = opt.el || document.createElement('div'), inner = document.createElement('div');
    slot.classList.add('fx-actor'); slot.setAttribute('data-actor', name);
    inner.className = 'fx-actor-in';
    slot.appendChild(inner);
    if (!slot.parentNode) layer.appendChild(slot);
    var A = FX.puppet(inner, opt);
    A.name = name; A.slot = slot; A.inner = inner;
    A.home = opt.home || { x: 60, bottom: 0, size: 420 };
    g.gsap.set(inner, { yPercent: 108 });
    var moves = [];
    /** t 秒去到某个位置：{ x: 左边缘, bottom: 离画面底边多高, size: 显示尺寸, flip: 是否水平翻转 }。可以按任意顺序调用，最后统一按时间排 */
    A.go = function (t, spot) { moves.push({ t: t, spot: spot }); return A; };
    /** t 秒蹲下离开画面 */
    A.hide = function (t) { moves.push({ t: t, spot: null }); return A; };
    /** 脸部特写：t 秒硬切到「脸占满画面」，dur 秒后硬切回原来的位置 */
    A.closeup = function (t, dur, size) {
      var st = stageEl(), f = A.faceAt(t), k = size / 600;
      moves.push({ t: t, cut: true, spot: { x: st.offsetWidth / 2 - f[0] * k, bottom: st.offsetHeight * 0.54 - (600 - f[1]) * k, size: size } });
      moves.push({ t: t + dur, cut: true, restore: true });
      return A;
    };
    /** 某个时间段里有没有排过走位（给上层编排用：这段时间有人工指定就不要自动安排） */
    A.hasMove = function (t0, t1) { return moves.some(function (m) { return !m.cut && m.t >= t0 - 0.001 && m.t < t1; }); };
    A.compileMoves = function (tl) {
      moves.sort(function (a, b) { return a.t - b.t; });
      // 世界画布里镜头要走了，演员先蹲下（他不跟着画布移动，留在原地会悬在半空）；下一个机位里位置没变的不用蹲
      if (FX.world && FX.world.on && FX.world.on()) {
        var auto = [];
        FX.scenes.filter(function (s) { return !s.el.classList.contains('overlay'); }).forEach(function (s, i) {
          if (!i) return;
          var before = null, after = null;
          moves.forEach(function (m) { if (m.t < s.t - 0.5) before = m; else if (!after && m.t < s.t + 0.6) after = m; });
          if (!before || !before.spot) return;
          var a = before.spot, b = after && after.spot;
          if (b && Math.abs(a.x - b.x) < 2 && Math.abs(a.bottom - b.bottom) < 2 && Math.abs(a.size - b.size) < 2) return;
          auto.push({ t: s.t - 0.5, spot: null });
        });
        moves = moves.concat(auto).sort(function (a, b) { return a.t - b.t; });
      }
      var shown = false, cur = null, saved = null;
      var place = function (sp, t) { tl.set(slot, { x: sp.x, y: -sp.bottom, scale: sp.size / BASE, '--fx-actor-k': BASE / sp.size }, t); tl.set(A.canvas, { scaleX: sp.flip ? -1 : 1 }, t); };
      moves.forEach(function (m) {
        var sp = m.spot;
        if (m.cut) {                                   // 特写：硬切到指定位置，不做蹲下 / 冒出
          if (m.restore) { if (!saved) return; if (saved.shown) { place(saved.cur, m.t); tl.set(inner, { yPercent: 0 }, m.t); } else tl.set(inner, { yPercent: 108 }, m.t); shown = saved.shown; cur = saved.cur; saved = null; return; }
          saved = { shown: shown, cur: cur };
          place(sp, m.t); tl.set(inner, { yPercent: 0 }, m.t);
          return;
        }
        if (saved) { saved = { shown: !!sp, cur: sp }; return; }      // 特写还没结束：这次走位只记下来，特写结束时直接落到位
        if (!sp) { if (shown) tl.to(inner, { yPercent: 108, duration: 0.2, ease: 'power2.in' }, m.t); shown = false; cur = null; return; }
        if (shown && cur && Math.abs(cur.x - sp.x) < 2 && Math.abs(cur.bottom - sp.bottom) < 2 && Math.abs(cur.size - sp.size) < 2 && !!cur.flip === !!sp.flip) return;
        if (shown && cur && !!cur.flip === !!sp.flip && Math.abs(cur.x - sp.x) < 260 && Math.abs(cur.bottom - sp.bottom) < 120) {   // 就在附近：滑过去，不蹲下
          tl.to(slot, { x: sp.x, y: -sp.bottom, scale: sp.size / BASE, '--fx-actor-k': BASE / sp.size, duration: 0.32, ease: 'power2.inOut' }, m.t);
          cur = sp; return;
        }
        if (shown) tl.to(inner, { yPercent: 108, duration: 0.16, ease: 'power2.in' }, Math.max(0, m.t - 0.16));
        place(sp, m.t);                                 // --fx-actor-k：给名牌这类「不想跟着缩小」的东西做反向缩放
        tl.fromTo(inner, { yPercent: 108 }, { yPercent: 0, duration: 0.36, ease: 'back.out(1.5)', immediateRender: false }, m.t);
        A.nod(m.t + 0.3, 0.7);
        shown = true; cur = sp;
      });
    };
    FX.cast[name] = A;
    return A;
  };
  /** 元素旁边的站位。r 是 FX.rect(元素) */
  FX.spotNear = function (r, at, size, o) {
    o = o || {};
    var st = stageEl(), SW = st.offsetWidth, SH = st.offsetHeight, x, bottom = 0;
    if (at === 'left') x = r.x - size * 0.8;
    else if (at === 'right') x = r.x + r.w - size * 0.2;
    else if (at === 'below') x = r.cx - size / 2;
    else { x = r.x + r.w * num(o.align, 0.82) - size / 2; bottom = SH - r.y - 4; }       // top：下沿贴着元素上沿
    x = clamp(x + num(o.dx, 0), -size * 0.12, SW - size * 0.88);
    return { x: x, bottom: Math.max(0, bottom + num(o.dy, 0)), size: size, flip: o.flip === '1' || o.flip === 1 || o.flip === true };
  };
  /** 从元素上沿探出来时别挡住标题：先试着换到元素的另一头，不行就缩小，再不行改站到旁边 */
  FX.spotClear = function (r, size, o, sceneEl) {
    o = o || {};
    var avoid = [];
    if (sceneEl) Array.prototype.forEach.call(sceneEl.querySelectorAll('.fx-head > *, .t-title, .t-hero, [data-keep-clear]'), function (el) { var b = FX.rect(el); if (b && b.w > 2) avoid.push(b); });
    var hit = function (sp) {
      var x0 = sp.x + sp.size * 0.16, x1 = sp.x + sp.size * 0.84, y1 = stageEl().offsetHeight - sp.bottom, y0 = y1 - sp.size * 0.95;
      return avoid.some(function (b) { return x0 < b.x + b.w + 16 && x1 > b.x - 16 && y0 < b.y + b.h + 10 && y1 > b.y; });
    };
    var tries = o.align !== undefined ? [num(o.align, 0.82)] : [0.82, 0.94, 0.5, 0.18, 0.06], sz, i, sp;
    for (sz = size; sz >= 280; sz -= 30) for (i = 0; i < tries.length; i++) { sp = FX.spotNear(r, 'top', sz, Object.assign({}, o, { align: tries[i] })); if (!hit(sp)) return sp; }
    return FX.spotNear(r, r.cx < stageEl().offsetWidth / 2 ? 'right' : 'left', Math.max(size, 380), o);
  };
  function who(c, name) { var A = FX.cast[c.o.who]; if (!A) console.warn('FX：' + name + ' 找不到演员 who=' + c.o.who + '（先用 data-make="actor" 或 FX.actor() 定义）'); return A; }
  FX.register('call', '角色', '把演员叫到这个元素旁边（讲到它时用）：演员在原地蹲下，从这个元素旁边重新冒出来。写在被讲的元素上；写在 <section> 上是回到演员自己的 home。参数 who（演员名）、at=top|left|right|below（默认 top：从元素上沿探出来）、size（默认 top 340 / 其他 420）、align（at=top 时靠左还是靠右，0–1，默认 0.82）、dx、dy、flip=1（水平翻转，让他面向内容）、pose（同时换姿势）', function (c) {
    var A = who(c, 'call'); if (!A) return;
    var at = c.o.at || 'top', home = c.el.classList.contains('scene') || at === 'home';
    var spot = home ? { x: A.home.x, bottom: A.home.bottom || 0, size: num(c.o.size, A.home.size), flip: String(c.o.flip) === '1' }
             : at === 'top' ? FX.spotClear(FX.rect(c.el), num(c.o.size, 340), c.o, c.scene && c.scene.el) : FX.spotNear(FX.rect(c.el), at, num(c.o.size, 420), c.o);
    A.go(c.t, spot);
    if (c.o.pose) A.pose(c.t, c.o.pose);
  });
  var closeBg = null;
  FX.register('closeup', '角色', '脸部特写（反应镜头）：硬切到这个演员的大脸，背景换成放射线底色，停一下再硬切回去。用现有的半身立绘就能做，不需要新素材。写在 <section> 的 data-fx 里。参数 who（演员名）、dur（停多久，默认 1.1）、pose（特写时的姿势 / 表情）、kind（同时弹出的情绪符号）、color（底色，默认橙色；可写 red / blue / green / purple）、size（放大到多大，默认 1300）', function (c) {
    var A = who(c, 'closeup'); if (!A) return;
    var st = stageEl(), d = num(c.o.dur, 1.1), PAL = { red: ['#ffd0c8', '#ff6b5e', '#c9372c'], blue: ['#d6ecff', '#5aa9ff', '#2a6fd6'], green: ['#d9ffe9', '#3ddc84', '#1c9a58'], purple: ['#ecdcff', '#a57bff', '#6a3fd0'], orange: ['#ffe9a8', '#ffb238', '#e2791c'] };
    if (!closeBg || !closeBg.parentNode) { closeBg = document.createElement('div'); closeBg.className = 'fx-closeup-bg'; st.appendChild(closeBg); }
    var pal = PAL[c.o.color || 'orange'] || [c.o.color, c.o.color, c.o.color];
    if (c.o.pose) A.pose(c.t, c.o.pose);
    A.closeup(c.t, d, num(c.o.size, 1300));
    c.tl.set(closeBg, { visibility: 'visible', '--c2': pal[0], '--c': pal[1], '--c3': pal[2] }, c.t);
    c.tl.fromTo(closeBg, { scale: 1.25, rotation: -3 }, { scale: 1.08, rotation: 3, duration: d, ease: 'none', immediateRender: false }, c.t);
    c.tl.set(closeBg, { visibility: 'hidden' }, c.t + d);
    Object.keys(FX.cast).forEach(function (k) { var B = FX.cast[k]; if (B === A) return; c.tl.set(B.slot, { visibility: 'hidden' }, c.t); c.tl.set(B.slot, { visibility: 'inherit' }, c.t + d); });   // 特写时别的演员先让开
    c.tl.set(A.slot, { attr: { 'data-closeup': '1' } }, c.t);        // 样式里据此藏起名牌、取消压暗
    c.tl.set(A.slot, { attr: { 'data-closeup': '0' } }, c.t + d);
    c.tl.fromTo(A.inner, { scale: 1.12 }, { scale: 1, duration: 0.22, ease: 'back.out(2.5)', immediateRender: false }, c.t);
    if (c.o.kind) A.emote(c.tl, c.t + 0.12, c.o.kind, c.t + d);
  });
  FX.register('dismiss', '角色', '让演员蹲下离开画面（要把整块画面让给内容时用）。参数 who', function (c) { var A = who(c, 'dismiss'); if (A) A.hide(c.t); });

  /** 声明一个演员：<div data-make="actor" data-name="host" data-src="…" data-eyes="…" data-neck="…" data-home="60,0,420"></div>，放在常驻层里 */
  FX.make.actor = function (el) {
    var eyes = String(attr(el, 'eyes', '')).split('/').filter(Boolean).map(function (s) { return s.split(',').map(Number); });
    var neck = String(attr(el, 'neck', '')).split(',').map(Number), home = String(attr(el, 'home', '60,0,420')).split(',').map(Number), src = attr(el, 'src', ''), poses = {};
    var names = String(attr(el, 'poses', '')).split('/').filter(Boolean);       // data-poses="wave/point/think"：每个姿势读 <src>_<姿势>_m0.png…，眼睛和脖子位置共用
    (names.length ? names : ['base']).forEach(function (n) {
      var p = { src: names.length ? src + '_' + n : src, eyes: eyes, lid: attr(el, 'lid', '') === '1' };
      if (neck.length === 2 && !isNaN(neck[0])) p.neck = neck;
      poses[n] = p;
    });
    el.__puppet = FX.actor(attr(el, 'name', 'host'), { el: el, size: num(attr(el, 'size'), 600), seed: num(attr(el, 'seed'), Object.keys(FX.cast).length + 1),
      poses: poses, home: { x: home[0], bottom: home[1] || 0, size: home[2] || 420 } });
  };

  /* ── 声明式：data-make="puppet" ── */
  var LIST = [];
  FX.make.puppet = function (el) {
    var eyes = String(attr(el, 'eyes', '')).split('/').filter(Boolean).map(function (s) { return s.split(',').map(Number); });
    var neck = String(attr(el, 'neck', '')).split(',').map(Number), pose = { src: attr(el, 'src', ''), eyes: eyes, lid: attr(el, 'lid', '') === '1' };
    if (neck.length === 2 && !isNaN(neck[0])) pose.neck = neck;
    el.classList.add('fx-puppet');
    el.__puppet = FX.puppet(el, { size: num(attr(el, 'size'), 600), seed: num(attr(el, 'seed'), LIST.length + 1), poses: { base: pose } });
    LIST.push(el);
  };
  function pup(c, name) {
    var p = c.o.who ? FX.cast[c.o.who] : c.el.__puppet;
    if (!p) { console.warn('FX：' + name + ' 要写在 data-make="puppet" / "actor" 的元素上，或用 who=演员名 指定'); return null; }
    return p;
  }
  var CAT = '角色';
  FX.register('pup-talk', CAT, '立绘说话：按口型序列换嘴，头跟着音量轻轻摆动。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 dur（说多久，默认到分镜结束）；口型序列取 FX.mouthTrack = { fps, frames }（由配音工具生成），没有就按音节节奏自动生成', function (c) {
    var p = pup(c, 'pup-talk'); if (!p) return;
    var track = FX.mouthTrack || null;
    p.speak(c.t, c.t + num(c.o.dur, c.sceneDur - 0.1), c.o.auto ? null : track);
  });
  FX.register('pup-pose', CAT, '立绘换姿势（硬切，换的瞬间自动眨眼并轻轻弹一下）。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 pose（姿势名）、pop=0（不要弹）', function (c) {
    var p = pup(c, 'pup-pose'); if (!p) return;
    p.pose(c.t, c.o.pose || c.o.name);
    if (String(c.o.pop) !== '0') c.tl.fromTo(p.inner || p.canvas, { scale: 0.955 }, { scale: 1, duration: 0.2, ease: 'back.out(3)', immediateRender: false }, c.t);
  });
  FX.register('pup-nod', CAT, '立绘点一下头（听的人应和、说的人强调）。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 amp（幅度，默认 1）', function (c) { var p = pup(c, 'pup-nod'); if (p) p.nod(c.t, num(c.o.amp, 1)); });
  FX.register('pup-lean', CAT, '立绘整个人朝一侧倾斜（听对方说话时朝对方倾）。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 deg（度数，正数向右，0 = 回正）、dur', function (c) { var p = pup(c, 'pup-lean'); if (p) p.lean(c.t, num(c.o.deg, 2), num(c.o.dur, 0.5)); });
  FX.register('pup-emote', CAT, '立绘头顶弹出手绘情绪符号。写在 data-make="puppet" 上，或用 who=演员名 指定演员。参数 kind=question|exclaim|sweat|anger|sparkle|idea|heart|zap|dots、hold（停留秒数，默认 1.6）', function (c) {
    var p = pup(c, 'pup-emote'); if (p) p.emote(c.tl, c.t, c.o.kind || 'exclaim', c.t + num(c.o.hold, 1.6));
  });
  FX.register('pup-idle', CAT, '只让立绘活着（眨眼、呼吸、头部慢晃），不说话。写在 data-make="puppet" 上；用了 pup-talk / pup-nod / pup-lean / pup-emote 中任何一个就不需要再写它', function (c) { pup(c, 'pup-idle'); });
})(typeof window !== 'undefined' ? window : this);
