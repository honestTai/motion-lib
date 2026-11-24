/*!
 * FX 柔性骨骼与软蒙皮模块 v1.4
 * SPDX-License-Identifier: MIT
 * motion-lib 的通用 2D 角色绑定扩展：无硬编码立绘，适用于任意用户自定义 SVG 角色。
 *
 * 核心原语（消除传统分段关节的「木偶拼接感」）：
 *   1. 双骨解析逆运动学 FX.ik2 + 连续贝塞尔软管蒙皮 FX.hose（RubberHose 原理）：
 *      只需给定肩膀坐标与手部目标点，自动解算柔和肘部弧线，生成一整条连续无接缝的圆润袖管/手臂路径。
 *   2. 声明式骨骼 [data-bone] 与次级弹簧跟随 [data-follow]：
 *      任意头发、耳朵、呆毛、飘带挂上 data-follow="head"，头部转动时自动产生阻尼弹簧滞后摆动。
 *   3. 视线遮罩追踪 [data-gaze]、自然眨眼 [data-lid]、多口型同步 [data-viseme] 与表情气泡 [data-emote]。
 *   4. 纯时间函数求值：每一帧完全由时间 t 决定，支持任意随机跳帧与多进程并发渲染。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-rig：请先加载 fx.js');

  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var pair = function (s, d) {
    if (!s) return d;
    var a = String(s).split(',').map(Number);
    return a.length >= 2 && !isNaN(a[0]) && !isNaN(a[1]) ? a : d;
  };

  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function softBack(t, s) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    s = s === undefined ? 1.25 : s;
    var u = t - 1;
    return u * u * ((s + 1) * u + s) + 1;
  }

  /* ───────────────────── 1. 通用几何：2D 逆运动学 + 连续圆润软蒙皮 ───────────────────── */

  /** 双骨解析 IK：给定起点 A(ax,ay)、终点 B(bx,by) 与两段长度 l1, l2，返回肘部坐标与实际终点。
   *  bend='auto'（或 0）时自动选择符合重力自然下垂与外展弧度的肘部解，任意移动手部都不会出现反关节折弯。 */
  FX.ik2 = function (ax, ay, bx, by, l1, l2, bend) {
    var dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-4;
    var maxReach = (l1 + l2) * 0.95, minReach = Math.abs(l1 - l2) + 10;
    if (d > maxReach) { dx *= maxReach / d; dy *= maxReach / d; bx = ax + dx; by = ay + dy; d = maxReach; }
    var dc = clamp(d, minReach, maxReach);
    var cosA = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1);
    var base = Math.atan2(dy, dx), off = Math.acos(cosA);
    var a1 = base + off, a2 = base - off;
    var e1x = ax + Math.cos(a1) * l1, e1y = ay + Math.sin(a1) * l1;
    var e2x = ax + Math.cos(a2) * l1, e2y = ay + Math.sin(a2) * l1;
    if (bend === 'auto' || bend === 0 || bend === undefined) {
      var outSign = ax >= 0 ? 1 : -1;
      var s1 = e1y + outSign * e1x * 0.32, s2 = e2y + outSign * e2x * 0.32;
      return s1 >= s2 ? { ex: e1x, ey: e1y, bx: bx, by: by } : { ex: e2x, ey: e2y, bx: bx, by: by };
    }
    return bend < 0 ? { ex: e2x, ey: e2y, bx: bx, by: by } : { ex: e1x, ey: e1y, bx: bx, by: by };
  };

  /** Catmull-Rom 点列转平滑三次贝塞尔 SVG 路径段 */
  function catmullToBezier(pts) {
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /** 连续圆润袖管/软肢体生成器（RubberHose 原理）：
   *  将 A(肩) → E(肘) → B(腕) 拟合成光滑二次中轴曲线，向两侧按半径 r0..r1 偏移并叠加衣物垂坠感 drape，
   *  输出完全无折角、无关节接缝的闭合圆润 SVG 路径 d 及手腕切线角 deg。 */
  FX.hose = function (ax, ay, ex, ey, bx, by, r0, r1, drape) {
    // 二次贝塞尔控制点 C，使曲线在 t=0.5 处柔和掠过肘部 (0.82 权重避免尖锐折弯)
    var mx = (ax + bx) * 0.5, my = (ay + by) * 0.5;
    var exSoft = lerp(mx, ex, 0.85), eySoft = lerp(my, ey, 0.85);
    var cx = 2 * exSoft - mx, cy = 2 * eySoft - my;
    var steps = 10, leftPts = [], rightPts = [], i;
    drape = num(drape, 0);

    for (i = 0; i <= steps; i++) {
      var t = i / steps, inv = 1 - t;
      var px = inv * inv * ax + 2 * inv * t * cx + t * t * bx;
      var py = inv * inv * ay + 2 * inv * t * cy + t * t * by;
      var tx = 2 * inv * (cx - ax) + 2 * t * (bx - cx);
      var ty = 2 * inv * (cy - ay) + 2 * t * (by - cy);
      var tl = Math.hypot(tx, ty) || 1;
      var nx = -ty / tl, ny = tx / tl;
      // 中段微鼓 + 宽松袖口自然重力垂坠，呈现手绘圆润感
      var swell = Math.sin(t * Math.PI) * drape * 0.35;
      var rCur = lerp(r0, r1, smooth(t)) + swell;
      var sagY = Math.sin(t * Math.PI * 0.92) * drape;
      leftPts.push([px + nx * rCur, py + ny * rCur + (ny > 0 ? sagY : sagY * 0.25)]);
      rightPts.push([px - nx * rCur, py - ny * rCur + (ny < 0 ? sagY : sagY * 0.25)]);
    }

    rightPts.reverse();
    var endTx = 2 * (bx - cx), endTy = 2 * (by - cy), endL = Math.hypot(endTx, endTy) || 1;
    var ux = endTx / endL, uy = endTy / endL;
    var pL = leftPts[leftPts.length - 1], pR = rightPts[0];
    var pR0 = rightPts[rightPts.length - 1], pL0 = leftPts[0];

    // 闭合袖管：外沿平滑曲线 → 圆润袖口端弧 → 内沿平滑曲线 → 圆润肩根封口
    var d = catmullToBezier(leftPts) +
      ' C' + (pL[0] + ux * r1 * 0.55).toFixed(1) + ' ' + (pL[1] + uy * r1 * 0.55).toFixed(1) + ' ' +
             (pR[0] + ux * r1 * 0.55).toFixed(1) + ' ' + (pR[1] + uy * r1 * 0.55).toFixed(1) + ' ' +
             pR[0].toFixed(1) + ' ' + pR[1].toFixed(1) +
      catmullToBezier(rightPts).replace(/^M[^C]+/, '') +
      ' C' + (pR0[0] - ux * r0 * 0.3).toFixed(1) + ' ' + (pR0[1] - uy * r0 * 0.3).toFixed(1) + ' ' +
             (pL0[0] - ux * r0 * 0.3).toFixed(1) + ' ' + (pL0[1] - uy * r0 * 0.3).toFixed(1) + ' ' +
             pL0[0].toFixed(1) + ' ' + pL0[1].toFixed(1) + 'Z';

    return { d: d, wx: bx, wy: by, deg: Math.atan2(endTy, endTx) * 180 / Math.PI - 90 };
  };

  /* ───────────────────── 2. 姿态与表情注册表（开放扩展 API） ───────────────────── */

  var POSES = (FX.rigPoses = {});
  var FACES = (FX.rigFaces = {
    smile:   { eye: 'normal', mouth: 'smile',   browLY: 0,  browLR: 0,   browRY: 0,  browRR: 0,   pupil: 1,    blush: 0.65 },
    happy:   { eye: 'normal', mouth: 'happy',   browLY: -3, browLR: -3,  browRY: -3, browRR: 3,   pupil: 1.03, blush: 0.78 },
    joy:     { eye: 'happy',  mouth: 'happy',   browLY: -4, browLR: -4,  browRY: -4, browRR: 4,   pupil: 1,    blush: 0.85 },
    wink:    { eye: 'wink',   mouth: 'happy',   browLY: -3, browLR: -3,  browRY: 2,  browRR: -3,  pupil: 1,    blush: 0.8  },
    worry:   { eye: 'normal', mouth: 'worry',   browLY: -2, browLR: -11, browRY: -2, browRR: 11,  pupil: 0.97, blush: 0.7  },
    shock:   { eye: 'normal', mouth: 'shock',   browLY: -7, browLR: -9,  browRY: -7, browRR: 9,   pupil: 0.8,  blush: 0.82 },
    serious: { eye: 'normal', mouth: 'serious', browLY: 3,  browLR: 10,  browRY: 3,  browRR: -10, pupil: 0.96, blush: 0.45 },
    smug:    { eye: 'wink',   mouth: 'smug',    browLY: -4, browLR: -5,  browRY: 2,  browRR: 6,   pupil: 1,    blush: 0.72 }
  });
  var GAZE = { viewer: [0, 0], right: [6.5, -1], left: [-6.5, -1], up: [3, -5.5], down: [1.5, 4.5] };

  /** 注册自定义角色姿态（传入腰头角度、手部 IK 坐标、手型、表情等） */
  FX.rigPose = function (name, spec) { POSES[name] = spec; };
  FX.rigFace = function (name, spec) { FACES[name] = Object.assign({}, FACES.smile, spec); };

  /* ───────────────────── 3. 扫描并绑定任意 DOM/SVG 角色结构 ───────────────────── */

  function bindRig(el) {
    if (el.__rig) return el.__rig;
    if (FX.make.rig && !el.children.length && el.getAttribute('data-make') === 'rig') FX.make.rig(el);
    var qa = function (s) { return Array.prototype.slice.call(el.querySelectorAll(s)); };

    var bones = {};
    qa('[data-bone]').forEach(function (node) {
      var k = node.getAttribute('data-bone'), pv = pair(node.getAttribute('data-pivot'), [0, 0]);
      bones[k] = { el: node, px: pv[0], py: pv[1] };
    });

    var follows = qa('[data-follow]').map(function (node) {
      var pv = pair(node.getAttribute('data-pivot'), [0, 0]);
      return {
        el: node,
        target: node.getAttribute('data-follow'),
        px: pv[0], py: pv[1],
        amp: num(node.getAttribute('data-amp'), 0.65),
        idleAmp: num(node.getAttribute('data-idle-amp'), 2.2),
        phase: num(node.getAttribute('data-phase'), 0)
      };
    });

    var hoses = {};
    qa('[data-hose]').forEach(function (node) {
      var name = node.getAttribute('data-hose');
      var sh = pair(node.getAttribute('data-shoulder'), [0, 0]);
      var hd = pair(node.getAttribute('data-hand'), [sh[0], sh[1] + 150]);
      var ln = pair(node.getAttribute('data-len'), [90, 86]);
      var rd = pair(node.getAttribute('data-r'), [24, 18]);
      hoses[name] = {
        name: name,
        el: node,
        fills: qa('[data-hose-fill="' + name + '"]'),
        wrist: el.querySelector('[data-wrist="' + name + '"]'),
        hands: qa('[data-wrist="' + name + '"] [data-hand]'),
        sx: sh[0], sy: sh[1], hx0: hd[0], hy0: hd[1],
        l1: ln[0], l2: ln[1], r0: rd[0], r1: rd[1],
        bend: (!node.getAttribute('data-bend') || node.getAttribute('data-bend') === 'auto') ? 'auto' : num(node.getAttribute('data-bend'), 0),
        drape: num(node.getAttribute('data-drape'), 8)
      };
    });

    // 默认初始姿态由角色自身的初始坐标推导，完全解耦
    var initSpec = { torsoX: 0, torsoY: 0, torsoR: 0, headX: 0, headY: 0, headR: 0, face: 'smile', look: 'viewer', emote: 'none', hands: {}, handShapes: {} };
    Object.keys(hoses).forEach(function (k) {
      initSpec.hands[k] = [hoses[k].hx0, hoses[k].hy0];
      initSpec.handShapes[k] = 'open';
    });
    if (POSES.idle) initSpec = mergeSpec(initSpec, POSES.idle);

    el.__rig = {
      el: el,
      bones: bones,
      follows: follows,
      hoses: hoses,
      gazeL: el.querySelector('[data-gaze="L"]'),
      gazeR: el.querySelector('[data-gaze="R"]'),
      lids: qa('[data-lid]'),
      blush: el.querySelector('[data-blush]'),
      eyeOpen: qa('[data-eye-part="open"]'),
      eyeHappy: qa('[data-eye-part="happy"]'),
      restMouths: qa('[data-mouth-rest]'),
      visemes: qa('[data-viseme]'),
      emotes: qa('[data-emote]'),
      emoteWrap: el.querySelector('[data-emote-wrap]'),
      initSpec: initSpec,
      poses: [{ t: -1, dur: 0.001, spec: initSpec }],
      talks: [],
      nods: [],
      waves: [],
      idleSpans: [],
      blinks: [],
      mounted: false
    };
    return el.__rig;
  }

  function mergeSpec(base, patch) {
    var out = Object.assign({}, base, patch);
    out.hands = Object.assign({}, base.hands || {});
    out.handShapes = Object.assign({}, base.handShapes || {});
    if (patch.hands) Object.keys(patch.hands).forEach(function (k) { out.hands[k] = patch.hands[k].slice(); });
    if (patch.lx !== undefined && out.hands.L) out.hands.L = [patch.lx, patch.ly !== undefined ? patch.ly : out.hands.L[1]];
    if (patch.rx !== undefined && out.hands.R) out.hands.R = [patch.rx, patch.ry !== undefined ? patch.ry : out.hands.R[1]];
    if (patch.handShapes) Object.assign(out.handShapes, patch.handShapes);
    if (patch.handL) out.handShapes.L = patch.handL;
    if (patch.handR) out.handShapes.R = patch.handR;
    return out;
  }

  function setPivotTransform(b, x, y, rot, sx, sy) {
    if (!b || !b.el) return;
    var s = (sx !== undefined && sy !== undefined) ? ' scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')' : '';
    if (b.px || b.py) {
      b.el.setAttribute('transform', 'translate(' + (b.px + x).toFixed(2) + ',' + (b.py + y).toFixed(2) + ') rotate(' + rot.toFixed(2) + ')' + s + ' translate(' + (-b.px).toFixed(2) + ',' + (-b.py).toFixed(2) + ')');
    } else {
      b.el.setAttribute('transform', 'translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ') rotate(' + rot.toFixed(2) + ')' + s);
    }
  }

  /* ───────────────────── 4. 纯时间函数采样渲染管线 ───────────────────── */

  function mountDriver(rig, tl, total) {
    if (rig.mounted) return;
    rig.mounted = true;

    var paint = function () {
      var now = tl.time();
      rig.poses.sort(function (a, b) { return a.t - b.t; });
      var idx = 0;
      for (var i = 0; i < rig.poses.length; i++) { if (rig.poses[i].t <= now + 1e-4) idx = i; else break; }
      var cur = rig.poses[idx], prevSpec = idx > 0 ? rig.poses[idx - 1].spec : cur.spec, curSpec = cur.spec;
      var dt = Math.max(0, now - Math.max(0, cur.t)), dur = Math.max(0.01, cur.dur);
      var u = idx === 0 ? 1 : clamp(dt / dur, 0, 1);

      var uBody = softBack(u, 1.15);
      var uHead = softBack(clamp((u - 0.04) / 0.96, 0, 1), 1.25);
      var uLimb = softBack(clamp((u - 0.06) / 0.94, 0, 1), 1.35);
      var uFace = smooth(clamp(u * 1.35, 0, 1));

      var torsoX = lerp(num(prevSpec.torsoX, 0), num(curSpec.torsoX, 0), uBody);
      var torsoY = lerp(num(prevSpec.torsoY, 0), num(curSpec.torsoY, 0), uBody);
      var torsoR = lerp(num(prevSpec.torsoR, 0), num(curSpec.torsoR, 0), uBody);
      var headX = lerp(num(prevSpec.headX, 0), num(curSpec.headX, 0), uHead);
      var headY = lerp(num(prevSpec.headY, 0), num(curSpec.headY, 0), uHead);
      var headR = lerp(num(prevSpec.headR, 0), num(curSpec.headR, 0), uHead);

      // 呼吸与眨眼
      var breathY = 0, breathSY = 1, breathSX = 1, idlePh = 0, idleOn = false, blink = 0;
      for (var s = 0; s < rig.idleSpans.length; s++) {
        var sp = rig.idleSpans[s];
        if (now >= sp.t0 && now <= sp.t1) {
          idleOn = true;
          idlePh = (now - sp.t0) * 2.2;
          breathY = Math.sin(idlePh) * -3.0;
          breathSY = 1 + Math.sin(idlePh) * 0.008;
          breathSX = 1 - Math.sin(idlePh) * 0.004;
          break;
        }
      }
      for (var b = 0; b < rig.blinks.length; b++) {
        var bt = now - rig.blinks[b];
        if (bt >= 0 && bt <= 0.16) { blink = bt < 0.07 ? bt / 0.07 : 1 - (bt - 0.07) / 0.09; break; }
      }

      // 头部点头/摇头叠加
      var nodR = 0, nodY = 0;
      rig.nods.forEach(function (nd) {
        if (now >= nd.t0 && now <= nd.t1) {
          var p = (now - nd.t0) / (nd.t1 - nd.t0);
          if (nd.shake) nodR += Math.sin(p * Math.PI * nd.n * 2) * nd.amp * (1 - p * 0.4);
          else { var sn = Math.abs(Math.sin(p * Math.PI * nd.n)); nodY += sn * nd.amp * 0.55; nodR += sn * nd.amp * 0.45; }
        }
      });

      // 口型与说话微律动
      var viseme = 0;
      for (var k = 0; k < rig.talks.length; k++) {
        var tk = rig.talks[k];
        if (now >= tk.t0 && now < tk.t1) {
          viseme = tk.seq[Math.floor((now - tk.t0) / tk.step) % tk.seq.length];
          if (tk.nod) nodY += Math.abs(Math.sin((now - tk.t0) * 9.0)) * 2.0;
          break;
        }
      }

      setPivotTransform(rig.bones.breath, 0, breathY, 0, breathSX, breathSY);
      setPivotTransform(rig.bones.torso, torsoX, torsoY, torsoR);
      setPivotTransform(rig.bones.head, headX, headY + nodY, headR + nodR);

      // 次级弹簧物理跟随（发丝、侧鬓、呆毛、耳饰）
      var dAngle = (num(curSpec.headR, 0) - num(prevSpec.headR, 0)) + (num(curSpec.torsoR, 0) - num(prevSpec.torsoR, 0));
      var impulse = idx === 0 ? 0 : (dt < dur ? Math.sin(u * Math.PI * 2) * (1 - u * 0.55) : Math.exp(-(dt - dur) * 5.5) * Math.sin((dt - dur) * 11) * 0.32);
      rig.follows.forEach(function (fl) {
        var idleSway = idleOn ? Math.sin(idlePh - 0.7 + fl.phase) * fl.idleAmp : 0;
        var dynSway = clamp(-dAngle * fl.amp, -14, 14) * impulse - nodR * fl.amp * 0.55;
        setPivotTransform({ el: fl.el, px: fl.px, py: fl.py }, 0, 0, idleSway + dynSway);
      });

      // 连续贝塞尔软管肢体求值（IK + 无缝袖管 + 挥手叠加）
      Object.keys(rig.hoses).forEach(function (name) {
        var h = rig.hoses[name];
        var pA = (prevSpec.hands && prevSpec.hands[name]) || [h.hx0, h.hy0];
        var pB = (curSpec.hands && curSpec.hands[name]) || [h.hx0, h.hy0];
        // 手部移动略带自然外弧轨迹，避免机械直线穿插躯干
        var arcLift = Math.sin(clamp(u, 0, 1) * Math.PI) * -14 * (Math.hypot(pB[0] - pA[0], pB[1] - pA[1]) / 120);
        var hx = lerp(pA[0], pB[0], uLimb);
        var hy = lerp(pA[1], pB[1], uLimb) + arcLift;

        rig.waves.forEach(function (wv) {
          if (wv.arm === name && now >= wv.t0 && now <= wv.t1) {
            var wp = (now - wv.t0) / (wv.t1 - wv.t0);
            hx += Math.sin(wp * Math.PI * wv.n * 2) * wv.amp;
            hy += Math.abs(Math.cos(wp * Math.PI * wv.n * 2)) * -8;
          }
        });

        var ik = FX.ik2(h.sx, h.sy, hx, hy, h.l1, h.l2, h.bend);
        var geo = FX.hose(h.sx, h.sy, ik.ex, ik.ey, ik.bx, ik.by, h.r0, h.r1, h.drape);
        h.el.setAttribute('d', geo.d);
        h.fills.forEach(function (f) { f.setAttribute('d', geo.d); });
        if (h.wrist) h.wrist.setAttribute('transform', 'translate(' + geo.wx.toFixed(1) + ',' + geo.wy.toFixed(1) + ') rotate(' + geo.deg.toFixed(1) + ')');
        var wantShape = u >= 0.35 ? (curSpec.handShapes && curSpec.handShapes[name]) || 'open' : (prevSpec.handShapes && prevSpec.handShapes[name]) || 'open';
        h.hands.forEach(function (nd) { nd.style.display = nd.getAttribute('data-hand') === wantShape ? '' : 'none'; });
      });

      // 面部五官与视线
      var fA = FACES[prevSpec.face || 'smile'] || FACES.smile, fB = FACES[curSpec.face || 'smile'] || FACES.smile;
      setPivotTransform(rig.bones.browL, 0, lerp(fA.browLY, fB.browLY, uFace), lerp(fA.browLR, fB.browLR, uFace));
      setPivotTransform(rig.bones.browR, 0, lerp(fA.browRY, fB.browRY, uFace), lerp(fA.browRR, fB.browRR, uFace));

      var gA = GAZE[prevSpec.look || 'viewer'] || GAZE.viewer, gB = GAZE[curSpec.look || 'viewer'] || GAZE.viewer;
      var gx = lerp(gA[0], gB[0], uFace), gy = lerp(gA[1], gB[1], uFace), ps = lerp(fA.pupil, fB.pupil, uFace);
      if (rig.gazeL) rig.gazeL.setAttribute('transform', 'translate(' + gx.toFixed(2) + ',' + gy.toFixed(2) + ') scale(' + ps.toFixed(3) + ')');
      if (rig.gazeR) rig.gazeR.setAttribute('transform', 'translate(' + (rig.gazeR.hasAttribute('data-mirror') ? -gx : gx).toFixed(2) + ',' + gy.toFixed(2) + ') scale(' + ps.toFixed(3) + ')');

      rig.lids.forEach(function (lid) {
        var travel = num(lid.getAttribute('data-lid'), 48);
        lid.setAttribute('transform', 'translate(0,' + (blink * travel).toFixed(2) + ')');
      });
      if (rig.blush) rig.blush.setAttribute('opacity', lerp(fA.blush, fB.blush, uFace).toFixed(2));

      var eyeMode = u >= 0.35 ? fB.eye : fA.eye;
      if (rig.eyeOpen.length && rig.eyeHappy.length) {
        if (eyeMode === 'happy') {
          rig.eyeOpen.forEach(function (e) { e.style.display = 'none'; });
          rig.eyeHappy.forEach(function (e) { e.style.display = ''; });
        } else if (eyeMode === 'wink' && rig.eyeOpen.length >= 2 && rig.eyeHappy.length >= 2) {
          rig.eyeOpen[0].style.display = ''; rig.eyeHappy[0].style.display = 'none';
          rig.eyeOpen[1].style.display = 'none'; rig.eyeHappy[1].style.display = '';
        } else {
          rig.eyeOpen.forEach(function (e) { e.style.display = ''; });
          rig.eyeHappy.forEach(function (e) { e.style.display = 'none'; });
        }
      }

      var restM = u >= 0.35 ? fB.mouth : fA.mouth;
      rig.restMouths.forEach(function (m) { m.style.display = (!viseme && m.getAttribute('data-mouth-rest') === restM) ? '' : 'none'; });
      rig.visemes.forEach(function (v) { v.style.display = (viseme && +v.getAttribute('data-viseme') === viseme) ? '' : 'none'; });

      var em = curSpec.emote || 'none';
      rig.emotes.forEach(function (node) { node.style.display = (em !== 'none' && node.getAttribute('data-emote') === em) ? '' : 'none'; });
      if (rig.emoteWrap && em !== 'none') {
        var pop = softBack(clamp(dt / 0.3, 0, 1), 2.1);
        rig.emoteWrap.setAttribute('transform', 'translate(0,' + (Math.sin(now * 5) * 3.5).toFixed(1) + ') scale(' + pop.toFixed(3) + ')');
      }
    };

    tl.to({ v: 0 }, { v: 1, duration: Math.max(0.1, total), ease: 'none', onUpdate: paint }, 0);
    paint();
  }

  function ensure(c, el) {
    var rig = bindRig(el);
    mountDriver(rig, c.tl, c.total);
    return rig;
  }

  /* ───────────────────── 5. 注册声明式角色动效 ───────────────────── */

  FX.register('rig-idle', '角色', '柔性待机呼吸：驱动任意绑定角色的自然胸腔呼吸、发丝微摆与按种子随机眨眼。参数 dur、seed', function (c) {
    c.els.forEach(function (el) {
      var rig = ensure(c, el), d = num(c.o.dur, c.sceneDur || c.total), r = FX.rand(num(c.o.seed, 17));
      rig.idleSpans.push({ t0: c.t, t1: c.t + d });
      var t = c.t + 1.0 + r() * 1.6;
      while (t < c.t + d - 0.2) {
        rig.blinks.push(t);
        if (r() < 0.2) rig.blinks.push(t + 0.24);
        t += 2.3 + r() * 2.4;
      }
    });
  });

  FX.register('rig-pose', '角色', '柔性切换姿态：按预设名或手部 IK 坐标(lx,ly,rx,ry)平滑过渡，连续贝塞尔袖管自动弯曲无接缝。参数 pose、lx/ly/rx/ry、look、face、emote、dur', function (c) {
    c.els.forEach(function (el) {
      var rig = ensure(c, el);
      var prev = rig.poses[rig.poses.length - 1].spec;
      var preset = c.o.pose && POSES[c.o.pose] ? POSES[c.o.pose] : {};
      var next = mergeSpec(prev, preset);
      next = mergeSpec(next, c.o);
      if (!c.o.emote && !preset.emote) next.emote = 'none';
      rig.poses.push({ t: c.t, dur: num(c.o.dur, 0.45), spec: next });
    });
  });

  FX.register('rig-talk', '角色', '多口型语音同步：按种子在多套 [data-viseme] 口型间自然切换并附带微点头，说完自动回到当前表情嘴。参数 dur、frames、nod=1、seed', function (c) {
    c.els.forEach(function (el) {
      var rig = ensure(c, el), d = num(c.o.dur, c.sceneDur || 2.5), step = num(c.o.frames, 3) / 30;
      var nVis = Math.max(1, rig.visemes.length), r = FX.rand(num(c.o.seed, 29)), count = Math.max(2, Math.ceil(d / step)), seq = [], last = 0;
      for (var i = 0; i < count; i++) {
        var v = i % 5 === 4 ? 0 : (1 + Math.floor(r() * nVis));
        if (v === last) v = (v + 1) % (nVis + 1);
        seq.push(v); last = v;
      }
      rig.talks.push({ t0: c.t, t1: c.t + d, step: step, seq: seq, nod: c.o.nod !== 0 });
    });
  });

  FX.register('rig-nod', '角色', '柔性点头/摇头：驱动颈部枢轴并自动触发发丝呆毛次级弹簧摆动。参数 shake=1（摇头）、n、amp、dur', function (c) {
    c.els.forEach(function (el) {
      var rig = ensure(c, el), d = num(c.o.dur, 0.55);
      rig.nods.push({ t0: c.t, t1: c.t + d, n: num(c.o.n, 2), amp: num(c.o.amp, 8), shake: !!c.o.shake });
    });
  });

  FX.register('rig-wave', '角色', '柔性挥手：在指定软肢体(arm=R|L)的手部 IK 目标上叠加圆弧往复挥动，整条袖管自然连动。参数 arm=R|L、n、amp、dur', function (c) {
    c.els.forEach(function (el) {
      var rig = ensure(c, el), d = num(c.o.dur, 1.4);
      rig.waves.push({ t0: c.t, t1: c.t + d, arm: c.o.arm || 'R', n: num(c.o.n, 3), amp: num(c.o.amp, 24) });
    });
  });
})(window);
