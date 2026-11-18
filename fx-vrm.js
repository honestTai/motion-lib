/*!
 * FX VRM 3D 角色模块 v1.5  ——  motion-lib 的可选扩展：真 3D 二次元柔性骨骼角色（基于 @pixiv/three-vrm，MIT）
 * SPDX-License-Identifier: MIT
 * 需要按顺序加载：
 *
 *   <script src="lib/vendor/gsap.min.js"></script>
 *   <script src="lib/vendor/three-fx.min.js"></script>
 *   <script src="lib/vendor/three-vrm.min.js"></script>
 *   <script src="lib/fx.js"></script>
 *   <script src="lib/fx-3d.js"></script>
 *   <script src="lib/fx-vrm.js"></script>
 *
 * 核心亮点（针对口播角色高灵动度专门设计的 7 层 3D 骨骼解算器）：
 *   1. 解析式 3D 双骨逆运动学 FX.ik3d（余弦定理 + 极向量手肘朝向 + 正交基四元数 + 前臂旋前/旋后扭转，零万向节死锁）。
 *   2. 自动锁骨联动（Auto-Clavicle）+ 6 节脊柱相位波（hips → spine → chest → upperChest → neck → head）+ 骨盆重心反平衡（Contrapposto）。
 *   3. 迪士尼重叠动作跟随（Overlapping Action）：眼球先行 → 头部引导 → 躯干重心下蹲预备（Anticipation）→ 手臂外弧绕行（防穿模）→ 手腕与五指弹性跟随。
 *   4. 告别静态木偶定格：内置说话音节手势节拍（Speech Beat）、8 字呼吸微漂移、五指波浪微舒展、真实 3D 眼球微扫视（Saccade）。
 *   5. 3D 头部跟随腮红贴片与 2.5D 漫符气泡（emote=sweat|question|idea|anger|sparkle|heart）+ 可选二头身/Q版头身比微调（headscale=1.22）。
 *   6. 100% 逐帧确定性：自动挂载 window.__hf.buildReady，SpringBone 头发/裙摆物理从 (t - 0.45s) 定步长推演，多进程并发渲染零接缝。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-vrm：请先加载 fx.js');

  var DEG = Math.PI / 180, TAU = Math.PI * 2;
  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth01 = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var smoother01 = function (x) { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  var def = function (name, desc, fn) { FX.register(name, '角色', desc, fn); };

  /* 微弹性缓冲（极柔和 C1 连续收尾，避免急停反弹抖动） */
  function softSettle(u, s) {
    u = clamp(u, 0, 1);
    if (u <= 0 || u >= 1) return u;
    s = s === undefined ? 1.08 : s;
    var t = u - 1;
    return t * t * ((s + 1) * t + s) + 1;
  }

  var BUF_CACHE = {};
  var EMOTE_TEX_CACHE = {};
  var BLUSH_TEX = null;
  var READY_SEQ = 0;

  var MODEL_SHORTCUTS = {
    shino: 'lib/assets/shino.vrm',
    vita: 'lib/assets/vita.vrm'
  };

  function holdRender(promise) {
    var hf = g.__hf = g.__hf || {};
    hf.buildReady = hf.buildReady || {};
    hf.buildReady['fx-vrm-' + (++READY_SEQ)] = promise;
  }

  function fetchBuffer(url) {
    if (!BUF_CACHE[url]) {
      BUF_CACHE[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error('fx-vrm：无法加载模型 ' + url + ' (' + r.status + ')');
        return r.arrayBuffer();
      });
    }
    return BUF_CACHE[url];
  }

  function needVRM() {
    if (!FX._stage3d) throw new Error('fx-vrm：请先加载 fx-3d.js');
    var T = FX._stage3d.need();
    var V = g.THREE_VRM;
    if (!V || !V.GLTFLoader || !V.VRMLoaderPlugin) throw new Error('fx-vrm：请先加载 vendor/three-vrm.min.js');
    return { T: T, V: V };
  }

  /* ═══════════════════════ 公开 3D 解析双骨 IK：FX.ik3d ═══════════════════════
   * 输入 VRM 1.0 角色空间下的肩关节位置 A、目标手腕位置 W、手肘极向量 pole、上臂长 L1、前臂长 L2、
   * side ('left'|'right') 与前臂轴向旋前/旋后角 twistDeg，直接解出无万向节死锁的世界旋转四元数 qUpper、qLower。 */
  FX.ik3d = function (A, W, pole, L1, L2, side, twistDeg, T) {
    T = T || g.THREE;
    var s = side === 'left' ? 1 : -1;
    var dx = W[0] - A[0], dy = W[1] - A[1], dz = W[2] - A[2];
    var rawD = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-5;
    var minD = Math.abs(L1 - L2) + 0.018, maxD = (L1 + L2) * 0.982;
    var D = clamp(rawD, minD, maxD);
    var ux = dx / rawD, uy = dy / rawD, uz = dz / rawD;

    // 极向量投影到垂直于 u 的平面，决定手肘往哪个方向自然弯曲
    var pd = pole[0] * ux + pole[1] * uy + pole[2] * uz;
    var px = pole[0] - ux * pd, py = pole[1] - uy * pd, pz = pole[2] - uz * pd;
    var pl = Math.sqrt(px * px + py * py + pz * pz);
    if (pl < 1e-5) { px = 0; py = -1; pz = -0.2; pl = Math.sqrt(1.04); }
    var nx = px / pl, ny = py / pl, nz = pz / pl;

    // 余弦定理求肩关节张角 alpha
    var ca = clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1);
    var sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    var ex = A[0] + L1 * (ux * ca + nx * sa);
    var ey = A[1] + L1 * (uy * ca + ny * sa);
    var ez = A[2] + L1 * (uz * ca + nz * sa);
    var wx = A[0] + D * ux, wy = A[1] + D * uy, wz = A[2] + D * uz;

    var v1 = new T.Vector3(ex - A[0], ey - A[1], ez - A[2]).normalize();
    var v2 = new T.Vector3(wx - ex, wy - ey, wz - ez).normalize();
    var b = new T.Vector3().crossVectors(v1, v2);
    if (b.lengthSq() < 1e-7) b.set(0, -s, 0); else b.normalize();

    var x1 = v1.clone().multiplyScalar(s);
    var y1 = b.clone().multiplyScalar(-s);
    var z1 = new T.Vector3().crossVectors(x1, y1).normalize();
    var m1 = new T.Matrix4().makeBasis(x1, y1, z1);
    var qUpper = new T.Quaternion().setFromRotationMatrix(m1);

    var x2 = v2.clone().multiplyScalar(s);
    var y2 = y1.clone();
    var z2 = new T.Vector3().crossVectors(x2, y2).normalize();
    var m2 = new T.Matrix4().makeBasis(x2, y2, z2);
    var qLower = new T.Quaternion().setFromRotationMatrix(m2);

    if (twistDeg) {
      var qTw = new T.Quaternion().setFromAxisAngle(v2, twistDeg * s * DEG);
      qLower.premultiply(qTw);
    }
    return { qUpper: qUpper, qLower: qLower, elbow: [ex, ey, ez], wrist: [wx, wy, wz] };
  };

  /* ── 程序化生成二次元腮红贴图与漫符气泡贴图（零外部图片依赖，纯内存 CanvasTexture） ── */
  function getBlushTexture(T) {
    if (BLUSH_TEX) return BLUSH_TEX;
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 64;
    var ctx = cv.getContext('2d');
    var grd = ctx.createRadialGradient(64, 32, 4, 64, 32, 54);
    grd.addColorStop(0, 'rgba(255, 105, 135, 0.62)');
    grd.addColorStop(0.55, 'rgba(255, 120, 145, 0.28)');
    grd.addColorStop(1, 'rgba(255, 120, 145, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 64);
    ctx.strokeStyle = 'rgba(255, 90, 120, 0.42)';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    for (var i = 0; i < 3; i++) {
      var x0 = 40 + i * 18;
      ctx.beginPath(); ctx.moveTo(x0, 42); ctx.lineTo(x0 + 9, 22); ctx.stroke();
    }
    BLUSH_TEX = new T.CanvasTexture(cv);
    BLUSH_TEX.colorSpace = T.SRGBColorSpace;
    return BLUSH_TEX;
  }

  function getEmoteTexture(T, kind) {
    if (EMOTE_TEX_CACHE[kind]) return EMOTE_TEX_CACHE[kind];
    var cv = document.createElement('canvas');
    cv.width = 160; cv.height = 160;
    var ctx = cv.getContext('2d');
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    if (kind === 'sweat') {
      // 经典二次元大汗滴
      ctx.beginPath();
      ctx.moveTo(80, 22);
      ctx.bezierCurveTo(116, 68, 122, 102, 112, 122);
      ctx.bezierCurveTo(102, 142, 58, 142, 48, 122);
      ctx.bezierCurveTo(38, 102, 44, 68, 80, 22);
      ctx.fillStyle = '#7dd3fc'; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = '#1e293b'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(66, 98, 7, 16, -0.2, 0, TAU);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    } else if (kind === 'anger') {
      // 二次元井字青筋 💢
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 14;
      var drawVein = function (w, col) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(42, 66); ctx.quadraticCurveTo(68, 68, 66, 40);
        ctx.moveTo(94, 40); ctx.quadraticCurveTo(92, 68, 118, 66);
        ctx.moveTo(118, 94); ctx.quadraticCurveTo(92, 92, 94, 120);
        ctx.moveTo(66, 120); ctx.quadraticCurveTo(68, 92, 42, 94);
        ctx.stroke();
      };
      drawVein(16, '#1e293b'); drawVein(9, '#ef4444');
    } else if (kind === 'idea') {
      // 灵光一闪小灯泡 💡
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 7;
      for (var a = -2; a <= 2; a++) {
        var ang = -Math.PI / 2 + a * 0.48;
        ctx.beginPath();
        ctx.moveTo(80 + Math.cos(ang) * 52, 78 + Math.sin(ang) * 52);
        ctx.lineTo(80 + Math.cos(ang) * 68, 78 + Math.sin(ang) * 68);
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(80, 74, 34, Math.PI * 0.78, Math.PI * 0.22, false);
      ctx.lineTo(94, 118); ctx.lineTo(66, 118); ctx.closePath();
      ctx.fillStyle = '#fde047'; ctx.fill();
      ctx.lineWidth = 7; ctx.strokeStyle = '#1e293b'; ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(68, 118, 24, 14);
      ctx.strokeRect(68, 118, 24, 14);
    } else if (kind === 'question') {
      // 圆润漫画问号 ❓
      ctx.font = '900 116px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 15; ctx.strokeStyle = '#1e293b'; ctx.strokeText('?', 80, 86);
      ctx.fillStyle = '#fbbf24'; ctx.fillText('?', 80, 86);
    } else if (kind === 'excl') {
      ctx.font = '900 118px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 15; ctx.strokeStyle = '#1e293b'; ctx.strokeText('!', 80, 86);
      ctx.fillStyle = '#f87171'; ctx.fillText('!', 80, 86);
    } else {
      // 四芒闪烁星星 ✨
      var star = function (cx, cy, r, col) {
        ctx.beginPath();
        for (var k = 0; k < 8; k++) {
          var rad = k % 2 === 0 ? r : r * 0.32, th = k * Math.PI / 4;
          var x = cx + Math.cos(th) * rad, y = cy + Math.sin(th) * rad;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = col; ctx.lineWidth = 6; ctx.strokeStyle = '#1e293b';
        ctx.stroke(); ctx.fill();
      };
      star(68, 72, 42, '#fde047');
      star(118, 44, 22, '#fffbeb');
      star(114, 112, 18, '#7dd3fc');
    }

    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    EMOTE_TEX_CACHE[kind] = tex;
    return tex;
  }

  /* ═══════════════════ 13 套 3D IK 柔性全身口播姿态库 ═══════════════════
   * 坐标约定（VRM 1.0 角色局部空间，身高已归一化到眼高 1.48m，肩高 ~1.30m，胸口 ~1.18m，腰 ~0.95m）：
   *   +X = 角色左侧（即观众画面右侧，朝向右侧 UI 窗口！）
   *   -X = 角色右侧（即观众画面左侧）
   *   +Y = 向上，+Z = 朝向观众镜头前方
   *   L / R: [手腕x, 手腕y, 手腕z]
   *   poleL / poleR: 手肘倾向向量
   *   twistL / twistR: 前臂翻转角（负值翻掌朝上，0~15 掌心朝前/朝内）
   *   handL / handR: 手腕局部微屈 [rx, ry, rz]
   *   curlL / curlR: 五指弯曲度（0 伸展，72 握拳），pointL / pointR: 食指单独伸直 */
  var POSES = {
    idle: {
      torso: [1.5, 0, 0], head: [1, 0, 0], hipX: 0, hipY: 0,
      L: [0.19, 0.93, 0.08], R: [-0.19, 0.93, 0.08],
      poleL: [0.35, -0.7, -0.7], poleR: [-0.35, -0.7, -0.7],
      twistL: 0, twistR: 0, handL: [0, 0, -6], handR: [0, 0, 6],
      curlL: 22, curlR: 22, style: 'idle', blush: 0.12
    },
    wave: {
      torso: [1, -4, 2.5], head: [2, 3, -6], hipX: -0.018, hipY: 0.008,
      L: [0.29, 1.38, 0.17], R: [-0.20, 0.94, 0.09],
      poleL: [0.45, -1.0, -0.2], poleR: [-0.35, -0.7, -0.7],
      twistL: 12, twistR: 0, handL: [-8, 0, 8], handR: [0, 0, 8],
      curlL: 6, curlR: 22, spreadL: 5, style: 'wave', blush: 0.35
    },
    explain: {
      torso: [2, -6, 2], head: [2, 5, -4], hipX: -0.015, hipY: 0,
      L: [0.36, 1.22, 0.23], R: [-0.18, 1.00, 0.14],
      poleL: [0.32, -1.0, -0.35], poleR: [-0.35, -0.8, -0.6],
      twistL: -68, twistR: -20, handL: [-8, 6, 8], handR: [0, 0, 8],
      curlL: 10, curlR: 24, spreadL: 3, style: 'explain', blush: 0.18
    },
    shrug: {
      torso: [-1, 0, 0], head: [2, 0, 7], hipX: 0, hipY: -0.008,
      L: [0.34, 1.21, 0.20], R: [-0.34, 1.21, 0.20],
      poleL: [0.28, -1.0, -0.35], poleR: [-0.28, -1.0, -0.35],
      twistL: -72, twistR: -72, handL: [-10, 0, 10], handR: [-10, 0, -10],
      curlL: 8, curlR: 8, spreadL: 4, spreadR: 4, style: 'shrug', blush: 0.22
    },
    point: {
      torso: [1.5, -7, 2.5], head: [1, 6, -4], hipX: -0.02, hipY: 0.006,
      L: [0.40, 1.27, 0.21], R: [-0.18, 0.98, 0.13],
      poleL: [0.32, -1.0, -0.3], poleR: [-0.35, -0.8, -0.6],
      twistL: 8, twistR: 0, handL: [0, 0, 6], handR: [0, 0, 8],
      curlL: 68, pointL: 1, curlR: 24, style: 'point', blush: 0.15
    },
    'point-up': {
      torso: [-1.5, -4, 2], head: [-3, 3, -5], hipX: -0.015, hipY: 0.01,
      L: [0.27, 1.47, 0.18], R: [-0.19, 0.96, 0.11],
      poleL: [0.42, -1.0, -0.15], poleR: [-0.35, -0.8, -0.6],
      twistL: 10, twistR: 0, handL: [0, 0, 4], handR: [0, 0, 8],
      curlL: 70, pointL: 1, curlR: 24, style: 'point-up', blush: 0.22
    },
    think: {
      torso: [3, 3, -2], head: [5, -3, -8], hipX: 0.018, hipY: 0,
      L: [0.06, 1.09, 0.20], R: [-0.085, 1.295, 0.205],
      poleL: [0.35, -1.0, -0.1], poleR: [-0.38, -1.0, 0.05],
      twistL: -35, twistR: 15, handL: [0, 8, -8], handR: [4, -6, -10],
      curlL: 30, curlR: 60, pointR: 1, style: 'think', blush: 0.18
    },
    shock: {
      torso: [-3.5, 0, 0], head: [-2, 0, 3], hipX: 0, hipY: -0.014,
      L: [0.22, 1.36, 0.20], R: [-0.22, 1.36, 0.20],
      poleL: [0.42, -1.0, -0.15], poleR: [-0.42, -1.0, -0.15],
      twistL: 14, twistR: 14, handL: [-10, 8, -6], handR: [-10, -8, 6],
      curlL: 5, curlR: 5, spreadL: 6, spreadR: 6, style: 'shock', blush: 0.48
    },
    clasp: {
      torso: [2, 0, -1.5], head: [3, 0, 6], hipX: 0.012, hipY: 0.01,
      L: [0.055, 1.19, 0.22], R: [-0.055, 1.19, 0.22],
      poleL: [0.38, -1.0, -0.15], poleR: [-0.38, -1.0, -0.15],
      twistL: 18, twistR: 18, handL: [8, 14, -10], handR: [8, -14, 10],
      curlL: 42, curlR: 42, style: 'clasp', blush: 0.52
    },
    reject: {
      torso: [-1, 0, 0], head: [3, 0, -4], hipX: 0, hipY: -0.006,
      L: [-0.05, 1.22, 0.23], R: [0.05, 1.22, 0.25],
      poleL: [0.42, -1.0, -0.1], poleR: [-0.42, -1.0, -0.1],
      twistL: 16, twistR: 16, handL: [0, 0, 0], handR: [0, 0, 0],
      curlL: 8, curlR: 8, spreadL: 3, spreadR: 3, style: 'reject', blush: 0.25
    },
    proud: {
      torso: [-3.5, 4, -2], head: [2, -3, 5], hipX: 0.02, hipY: 0.008,
      L: [0.19, 0.99, 0.06], R: [-0.19, 0.99, 0.06],
      poleL: [0.55, -0.4, -0.65], poleR: [-0.55, -0.4, -0.65],
      twistL: 25, twistR: 25, handL: [0, -12, -18], handR: [0, 12, 18],
      curlL: 52, curlR: 52, style: 'proud', blush: 0.32
    },
    cheer: {
      torso: [-3, 0, 0], head: [-2, 0, 5], hipX: 0, hipY: 0.016,
      L: [0.26, 1.46, 0.16], R: [-0.26, 1.46, 0.16],
      poleL: [0.48, -1.0, -0.15], poleR: [-0.48, -1.0, -0.15],
      twistL: 18, twistR: 18, handL: [0, 0, 0], handR: [0, 0, 0],
      curlL: 74, curlR: 74, style: 'cheer', blush: 0.55
    },
    bow: {
      torso: [18, 0, 0], head: [10, 0, 0], hipX: 0, hipY: -0.015,
      L: [0.12, 0.98, 0.16], R: [-0.12, 0.98, 0.16],
      poleL: [0.35, -0.8, -0.5], poleR: [-0.35, -0.8, -0.5],
      twistL: 10, twistR: 10, handL: [0, 0, -8], handR: [0, 0, 8],
      curlL: 24, curlR: 24, style: 'bow', blush: 0.30
    }
  };

  var EXPR_ALIAS = {
    neutral: 'neutral',
    happy: 'happy', joy: 'happy', laugh: 'happy',
    relaxed: 'relaxed', smile: 'relaxed', fun: 'relaxed', calm: 'relaxed',
    angry: 'angry', mad: 'angry',
    sad: 'sad', sorrow: 'sad', worry: 'sad',
    surprised: 'surprised', shock: 'surprised'
  };
  var EMOTIONS = ['happy', 'relaxed', 'angry', 'sad', 'surprised'];
  var LOOK_PRESETS = {
    cam: [0, 0],
    right: [15, 1],
    left: [-15, 1],
    up: [0, 11],
    down: [0, -10],
    'up-right': [13, 9]
  };

  function ensureState(el) {
    if (!el.__vrmCtl) {
      el.__vrmCtl = {
        poses: [], talks: [], nods: [], moves: [], emotes: [], anims: [],
        vrm: null, isVRM0: false, restPos: {}, L1: 0.219, L2: 0.214,
        shOrigin: [0, 1.30, 0], armScale: 1, padZ: 0,
        baseX: 0, baseY: 0, baseZ: 0, baseRY: 0,
        headScale: 1.20,
        breathe: 1, blink: 1, sway: 1, spring: 1,
        seed: 11, lookX: 0, lookY: 0,
        blushMeshes: [], emoteHolder: null, emoteSprites: {}
      };
    }
    return el.__vrmCtl;
  }

  function resolveExprName(em, name) {
    if (!em || !name || name === 'neutral') return null;
    var canon = EXPR_ALIAS[name] || name;
    if (em.getExpression && em.getExpression(canon)) return canon;
    var cap = canon.charAt(0).toUpperCase() + canon.slice(1);
    if (em.getExpression && em.getExpression(cap)) return cap;
    return canon;
  }

  function lerp3(a, b, u) {
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  }

  /* 手臂过渡防穿模外弧插值：双手大幅移动时自动向镜头前方 +Z 划出柔和圆弧 */
  function arcHand(a, b, u) {
    var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var arc = Math.sin(clamp(u, 0, 1) * Math.PI) * Math.min(0.11, dist * 0.28);
    return [
      lerp(a[0], b[0], u),
      lerp(a[1], b[1], u) + arc * 0.32,
      lerp(a[2], b[2], u) + arc
    ];
  }

  function writeQuat(hum, is0, boneName, q) {
    var node = hum.getNormalizedBoneNode(boneName);
    if (!node) return;
    if (is0) node.quaternion.set(-q.x, q.y, -q.z, q.w);
    else node.quaternion.copy(q);
  }

  function setEulerBone(hum, is0, boneName, rx, ry, rz, eTmp, qTmp) {
    var node = hum.getNormalizedBoneNode(boneName);
    if (!node) return null;
    eTmp.set(rx * DEG, ry * DEG, rz * DEG, 'ZYX');
    qTmp.setFromEuler(eTmp);
    if (is0) node.quaternion.set(-qTmp.x, qTmp.y, -qTmp.z, qTmp.w);
    else node.quaternion.copy(qTmp);
    return qTmp.clone();
  }

  /* 五指波浪微动驱动：每根手指有独立相位微舒展，告别僵硬连指手套感 */
  function applyFingers(hum, is0, side, curl, indexOpen, spread, t, phaseOff, eTmp, qTmp) {
    var s = side === 'left' ? -1 : 1;
    var breatheCurl = Math.sin(t * 2.6 + phaseOff) * 3.2;
    var baseC = (curl + breatheCurl) * s;
    var idxC = (indexOpen ? 5 + Math.sin(t * 3.8 + phaseOff) * 2.5 : curl + breatheCurl * 0.8) * s;

    var thumbRatio = clamp(curl / 70, 0.08, 1.05);
    setEulerBone(hum, is0, side + 'ThumbMetacarpal', 0, -18 * s * thumbRatio, 12 * s * thumbRatio, eTmp, qTmp);
    setEulerBone(hum, is0, side + 'ThumbProximal', 0, -22 * s * thumbRatio, 18 * s * thumbRatio, eTmp, qTmp);
    setEulerBone(hum, is0, side + 'ThumbDistal', 0, -14 * s * thumbRatio, 14 * s * thumbRatio, eTmp, qTmp);

    setEulerBone(hum, is0, side + 'IndexProximal', 0, (spread || 0) * -0.9 * s, idxC * 0.85, eTmp, qTmp);
    setEulerBone(hum, is0, side + 'IndexIntermediate', 0, 0, idxC * 1.05, eTmp, qTmp);
    setEulerBone(hum, is0, side + 'IndexDistal', 0, 0, idxC * 0.75, eTmp, qTmp);

    var rest = ['Middle', 'Ring', 'Little'];
    for (var i = 0; i < 3; i++) {
      var wave = Math.sin(t * 2.9 + phaseOff + (i + 1) * 0.55) * (curl < 45 ? 4.2 : 1.8) * s;
      var ci = baseC * (1 + i * 0.07) + wave;
      var sp = spread ? (i - 0.3) * spread * s : 0;
      setEulerBone(hum, is0, side + rest[i] + 'Proximal', 0, sp, ci * 0.88, eTmp, qTmp);
      setEulerBone(hum, is0, side + rest[i] + 'Intermediate', 0, 0, ci * 1.08, eTmp, qTmp);
      setEulerBone(hum, is0, side + rest[i] + 'Distal', 0, 0, ci * 0.78, eTmp, qTmp);
    }
  }

  /* ═══════════════════ 核心纯函数解算器：evalCharacterAt(t) ═══════════════════ */
  function evalCharacterAt(T, ctl, t, eTmp, qTmp, applyVisuals) {
    var i, seg;
    if (!ctl.sorted) {
      ctl.poses.sort(function (a, b) { return a.t0 - b.t0; });
      ctl.moves.sort(function (a, b) { return a.t0 - b.t0; });
      ctl.sorted = true;
    }

    // 1. 解析姿态段 + 重叠动作跟随参数（眼睛/头领先 → 躯干 → 手臂过冲 → 手腕手指跟随）
    var curP = POSES.idle, prevP = POSES.idle;
    var uRaw = 1, segElapsed = 10;
    var curExpr = 'neutral', prevExpr = 'neutral', exprAlpha = 1;
    var curRY = ctl.baseRY, prevRY = ctl.baseRY, ryAlpha = 1;
    var curLook = [ctl.lookX, ctl.lookY], prevLook = [ctl.lookX, ctl.lookY], lookAlpha = 1;

    for (i = 0; i < ctl.poses.length; i++) {
      seg = ctl.poses[i];
      if (t < seg.t0) break;
      var dtSeg = t - seg.t0;
      var u = seg.dur > 0 ? clamp(dtSeg / seg.dur, 0, 1) : 1;
      if (seg.pose) {
        if (u < 1) { prevP = curP; curP = seg.pose; uRaw = u; segElapsed = dtSeg; }
        else { prevP = curP = seg.pose; uRaw = 1; segElapsed = dtSeg; }
      }
      if (seg.expr) {
        var ue = smooth01(u);
        if (u < 1) { prevExpr = curExpr; curExpr = seg.expr; exprAlpha = ue; }
        else { prevExpr = curExpr = seg.expr; exprAlpha = 1; }
      }
      if (seg.ry !== null) {
        var blendedRY = lerp(prevRY, curRY, ryAlpha);
        var ur = smooth01(u);
        if (u < 1) { prevRY = blendedRY; curRY = seg.ry; ryAlpha = ur; }
        else { prevRY = curRY = seg.ry; ryAlpha = 1; }
      }
      if (seg.look) {
        var bLook = [lerp(prevLook[0], curLook[0], lookAlpha), lerp(prevLook[1], curLook[1], lookAlpha)];
        var ul = smooth01(clamp(u * 1.35, 0, 1)); // 视线率先到位
        if (u < 1) { prevLook = bLook; curLook = seg.look; lookAlpha = ul; }
        else { prevLook = curLook = seg.look; lookAlpha = 1; }
      }
    }

    var uHead = softSettle(clamp(uRaw * 1.22, 0, 1), 0.95);
    var uTorso = smoother01(clamp((uRaw - 0.03) / 0.90, 0, 1));
    var uArm = softSettle(clamp((uRaw - 0.06) / 0.94, 0, 1), 1.06);
    var uWrist = softSettle(clamp((uRaw - 0.12) / 0.88, 0, 1), 1.15);
    // 换动作瞬间的柔和重心微蹲预备（C2 平滑正弦平方，无折角加速度突变）
    var sinPi = uRaw < 1 ? Math.sin(uRaw * Math.PI) : 0;
    var antDip = -sinPi * sinPi * 0.015;

    var finalRY = lerp(prevRY, curRY, ryAlpha);
    var lx = lerp(prevLook[0], curLook[0], lookAlpha);
    var ly = lerp(prevLook[1], curLook[1], lookAlpha);

    // 2. 舞台位移段
    var px = ctl.baseX, py = ctl.baseY, pz = ctl.baseZ;
    for (i = 0; i < ctl.moves.length; i++) {
      var mv = ctl.moves[i];
      if (t < mv.t0) break;
      var mu = mv.dur > 0 ? clamp((t - mv.t0) / mv.dur, 0, 1) : 1;
      var me = mv.ease(mu);
      if (mv.fromY !== null && i === 0 && t - mv.t0 <= mv.dur) {
        py = lerp(mv.fromY, mv.toY, me);
      } else {
        if (mv.toX !== null) px = lerp(px, mv.toX, me);
        if (mv.toY !== null) py = lerp(py, mv.toY, me);
        if (mv.toZ !== null) pz = lerp(pz, mv.toZ, me);
      }
    }

    // 3. 说话五元音（C1 连续余弦包络无折角）与低频柔和手势包络（彻底隔离 8Hz 音节抖动）
    var vowels = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
    var talkEnv = 0;
    for (i = 0; i < ctl.talks.length; i++) {
      var tk = ctl.talks[i];
      if (t >= tk.t0 && t <= tk.t0 + tk.dur) {
        var lt = t - tk.t0;
        var sEnv = smoother01(lt / 0.28) * smoother01((tk.dur - lt) / 0.28);
        talkEnv = Math.max(talkEnv, sEnv);
        var mEnv = smooth01(lt / 0.10) * smooth01((tk.dur - lt) / 0.12);
        var syl = lt * tk.rate;
        var idx = Math.floor(syl), frac = syl - idx;
        var h = Math.sin((idx + 1) * 12.9898 + tk.seed * 78.233) * 43758.5453;
        h = h - Math.floor(h);
        if (h > 0.14) {
          // 升余弦 (1 - cos(2πf))/2 在首尾斜率均为 0，60fps 下嘴唇开合丝滑无跳变
          var open = (0.5 - 0.5 * Math.cos(frac * TAU)) * (0.62 + 0.34 * ((h * 7) % 1)) * tk.amp * mEnv;
          var vPick = Math.floor(((h * 97) % 1) * 5);
          var vKey = ['aa', 'oh', 'ee', 'ih', 'ou'][vPick];
          vowels[vKey] = clamp(open, 0, 0.88);
          if (vKey === 'aa') vowels.oh = Math.max(vowels.oh, open * 0.24);
          if (vKey === 'ee') vowels.ih = Math.max(vowels.ih, open * 0.26);
        }
      }
    }

    // 4. 点头/摇头/歪头脉冲
    var nodX = 0, nodY = 0, nodZ = 0;
    for (i = 0; i < ctl.nods.length; i++) {
      var nd = ctl.nods[i];
      if (t >= nd.t0 && t <= nd.t0 + nd.dur) {
        var nu = (t - nd.t0) / nd.dur;
        var nEnv = Math.sin(nu * Math.PI);
        var osc = Math.sin(nu * Math.PI * 2 * nd.n) * nEnv * nd.amp;
        if (nd.kind === 'shake') nodY += osc * 12;
        else if (nd.kind === 'tilt') nodZ += Math.sin(nu * Math.PI) * 11 * nd.amp;
        else nodX += Math.abs(Math.sin(nu * Math.PI * nd.n)) * 12 * nEnv * nd.amp;
      }
    }

    // 5. 插值当前 IK 目标并注入持续生命感动态（告别静态定格！）
    var WL = arcHand(prevP.L, curP.L, uArm);
    var WR = arcHand(prevP.R, curP.R, uArm);
    var poleL = lerp3(prevP.poleL, curP.poleL, smooth01(uRaw));
    var poleR = lerp3(prevP.poleR, curP.poleR, smooth01(uRaw));
    var twistL = lerp(prevP.twistL, curP.twistL, uWrist);
    var twistR = lerp(prevP.twistR, curP.twistR, uWrist);
    var handL = lerp3(prevP.handL, curP.handL, uWrist);
    var handR = lerp3(prevP.handR, curP.handR, uWrist);
    var style = curP.style;

    // 低频柔和口播手势韵律（1.8Hz 丝滑呼吸感，绝不产生高频抖动）
    var talkBeat = talkEnv * Math.sin(t * 3.4 + ctl.seed);
    var talkSub = talkEnv * Math.cos(t * 2.2 + ctl.seed * 1.3);
    var floatL = Math.sin(t * 1.65 + ctl.seed) * 0.009;
    var floatR = Math.cos(t * 1.50 + ctl.seed * 1.4) * 0.009;
    WL[1] += floatL; WR[1] += floatR;
    WL[0] += Math.cos(t * 1.25 + ctl.seed) * 0.006;
    WR[0] += Math.sin(t * 1.35 + ctl.seed) * 0.006;

    var extraBounceY = 0;
    if (style === 'wave') {
      var wOsc = Math.sin(t * 7.6);
      WL[0] += wOsc * 0.052;
      WL[1] += (0.5 - 0.5 * Math.cos(t * 15.2)) * 0.014;
      handL[2] += wOsc * 15;
      extraBounceY += (0.5 - 0.5 * Math.cos(t * 7.6)) * 0.007;
    } else if (style === 'point') {
      var tap = (0.3 + 0.7 * talkEnv) * Math.sin(t * 3.6);
      WL[0] += tap * 0.018;
      WL[1] += tap * 0.010;
      handL[2] += tap * 4.5;
    } else if (style === 'point-up') {
      var upBeat = Math.sin(t * 3.4) * (0.35 + 0.65 * talkEnv);
      WL[1] += upBeat * 0.018;
    } else if (style === 'explain' || style === 'shrug') {
      WL[1] += talkBeat * 0.020;
      WL[2] += (0.5 + 0.5 * talkBeat) * 0.014 * talkEnv;
      WL[0] += talkSub * 0.014;
      twistL += talkBeat * 8;
      if (style === 'shrug') {
        WR[1] += talkBeat * 0.018;
        WR[0] -= talkSub * 0.013;
        twistR += talkBeat * 8;
      }
    } else if (style === 'think') {
      var chinTap = 0.5 - 0.5 * Math.cos(t * 3.2);
      WR[0] -= chinTap * 0.007;
      WR[1] += Math.sin(t * 1.9) * 0.006;
    } else if (style === 'shock') {
      var shockBreath = Math.exp(-segElapsed * 1.8) * Math.sin(t * 11.0) * 0.009 + Math.sin(t * 3.8) * 0.005;
      WL[1] += shockBreath; WR[1] += shockBreath;
    } else if (style === 'clasp') {
      var joySway = Math.sin(t * 3.2);
      WL[0] += joySway * 0.012; WR[0] += joySway * 0.012;
      WL[1] += (0.5 - 0.5 * Math.cos(t * 6.4)) * 0.010;
      WR[1] += (0.5 - 0.5 * Math.cos(t * 6.4)) * 0.010;
      extraBounceY += (0.5 - 0.5 * Math.cos(t * 6.4)) * 0.008;
    } else if (style === 'cheer') {
      var pump = Math.sin(t * 5.6);
      WL[1] += pump * 0.030; WR[1] -= pump * 0.030;
      extraBounceY += (0.5 - 0.5 * Math.cos(t * 5.6)) * 0.010;
    } else if (style === 'reject') {
      var noOsc = Math.sin(t * 4.2) * (0.35 + 0.65 * talkEnv);
      WL[0] -= noOsc * 0.011; WR[0] += noOsc * 0.011;
    }

    // 6. 骨盆重心（Contrapposto）+ 腿部反平衡 + 6 节脊柱相位波
    var vrm = ctl.vrm, hum = vrm.humanoid, is0 = ctl.isVRM0, rp = ctl.restPos;
    var swSlow = ctl.sway * Math.sin(t * 1.35 + ctl.seed * 0.7);
    var swSub = ctl.sway * Math.cos(t * 0.82 + ctl.seed * 1.7);
    var brWave0 = ctl.breathe * Math.sin(t * 2.25 + ctl.seed);
    var brWave1 = ctl.breathe * Math.sin(t * 2.25 + ctl.seed - 0.45);
    var brWave2 = ctl.breathe * Math.sin(t * 2.25 + ctl.seed - 0.90);

    var hipShiftX = lerp(prevP.hipX, curP.hipX, uTorso) + swSlow * 0.022;
    var hipShiftY = lerp(prevP.hipY, curP.hipY, uTorso) + antDip + extraBounceY + (brWave0 * 0.5 + 0.5) * 0.005;
    var hipsNode = hum.getNormalizedBoneNode('hips');
    if (hipsNode && rp.hips) {
      var hx = rp.hips[0] + hipShiftX;
      var hy = rp.hips[1] + hipShiftY;
      var hz = rp.hips[2];
      hipsNode.position.set(is0 ? -hx : hx, hy, is0 ? -hz : hz);
    }

    var hipTiltZ = swSlow * 3.4 + hipShiftX * 45;
    var hipTurnY = swSub * 3.0;
    var kneeFlex = Math.max(0, -hipShiftY * 420); // 下蹲时膝盖自然微屈缓冲
    var qHips = setEulerBone(hum, is0, 'hips', kneeFlex * 0.15, hipTurnY, hipTiltZ, eTmp, qTmp) || new T.Quaternion();
    setEulerBone(hum, is0, 'leftUpperLeg', -kneeFlex * 0.55, 0, -hipTiltZ * 0.85 - 2, eTmp, qTmp);
    setEulerBone(hum, is0, 'rightUpperLeg', -kneeFlex * 0.55, 0, -hipTiltZ * 0.85 + 2, eTmp, qTmp);
    setEulerBone(hum, is0, 'leftLowerLeg', kneeFlex * 1.05, 0, 0, eTmp, qTmp);
    setEulerBone(hum, is0, 'rightLowerLeg', kneeFlex * 1.05, 0, 0, eTmp, qTmp);

    // 手臂向外伸展时，胸腔自动微倾微转跟随（Auto-Torso Reach Coupling）
    var reachTurnY = clamp((WR[0] + WL[0]) * -18, -8, 8);
    var reachLeanZ = clamp((WL[0] + WR[0]) * -8, -4, 4);
    var torsoRot = lerp3(prevP.torso, curP.torso, uTorso);

    var qSpine = setEulerBone(hum, is0, 'spine',
      torsoRot[0] * 0.35 - brWave0 * 1.1,
      torsoRot[1] * 0.35 + reachTurnY * 0.35,
      torsoRot[2] * 0.35 - hipTiltZ * 0.55 + reachLeanZ * 0.4, eTmp, qTmp) || new T.Quaternion();

    var qChest = setEulerBone(hum, is0, 'chest',
      torsoRot[0] * 0.38 - brWave1 * 1.5,
      torsoRot[1] * 0.38 + reachTurnY * 0.40 + swSub * 1.8,
      torsoRot[2] * 0.38 - hipTiltZ * 0.35 + swSlow * 1.6, eTmp, qTmp) || new T.Quaternion();

    var hasUpperChest = !!hum.getNormalizedBoneNode('upperChest');
    var qUpperChest = hasUpperChest ? setEulerBone(hum, is0, 'upperChest',
      torsoRot[0] * 0.27 - brWave2 * 1.2,
      torsoRot[1] * 0.27 + reachTurnY * 0.25,
      torsoRot[2] * 0.27 + reachLeanZ * 0.4, eTmp, qTmp) : new T.Quaternion();

    // 7. 自动锁骨联动（Auto-Clavicle）+ 正向累积求精确肩关节坐标 A_L / A_R + FX.ik3d 逆解双臂
    var clavLiftL = clamp((WL[1] - 1.10) * 36, -4, 17) + brWave2 * 1.5;
    var clavFwdL = clamp((WL[2] - 0.10) * -38 + Math.max(0, -WL[0] + 0.05) * -28, -16, 5);
    var clavLiftR = clamp((WR[1] - 1.10) * -36, -17, 4) - brWave2 * 1.5;
    var clavFwdR = clamp((WR[2] - 0.10) * 38 + Math.max(0, WR[0] + 0.05) * 28, -5, 16);

    // 将标准姿态库手腕目标自适应映射到当前模型的真实肩中心坐标与臂长比例（兼容任意 Blender/VRoid 原点偏移与体型）
    var as = ctl.armScale || 1, so = ctl.shOrigin;
    var mapWL = [so[0] + WL[0] * as, so[1] + (WL[1] - 1.30) * as, so[2] + WL[2] * as + ctl.padZ];
    var mapWR = [so[0] + WR[0] * as, so[1] + (WR[1] - 1.30) * as, so[2] + WR[2] * as + ctl.padZ];

    var qClavL = setEulerBone(hum, is0, 'leftShoulder', 0, clavFwdL, clavLiftL, eTmp, qTmp) || new T.Quaternion();
    var qClavR = setEulerBone(hum, is0, 'rightShoulder', 0, clavFwdR, clavLiftR, eTmp, qTmp) || new T.Quaternion();

    // 在纯 VRM 1.0 空间沿骨骼树正算 UpperArm 的精确世界位置与父级旋转（不受 VRM0 翻转干扰）
    var pCur = new T.Vector3(rp.hips[0] + hipShiftX, rp.hips[1] + hipShiftY, rp.hips[2]);
    var qChain = qHips.clone();
    var stepBone = function (p, qAcc, name, qLocal) {
      var off = rp[name];
      if (off) p.add(new T.Vector3(off[0], off[1], off[2]).applyQuaternion(qAcc));
      if (qLocal) qAcc.multiply(qLocal);
    };
    stepBone(pCur, qChain, 'spine', qSpine);
    stepBone(pCur, qChain, 'chest', qChest);
    if (hasUpperChest) stepBone(pCur, qChain, 'upperChest', qUpperChest);

    // 左臂 IK（角色左侧 +X = 画面右侧）
    var pShoulderL = pCur.clone(), qShWorldL = qChain.clone();
    stepBone(pShoulderL, qShWorldL, 'leftShoulder', qClavL);
    stepBone(pShoulderL, qShWorldL, 'leftUpperArm', null);
    var ikL = FX.ik3d([pShoulderL.x, pShoulderL.y, pShoulderL.z], mapWL, poleL, ctl.L1, ctl.L2, 'left', twistL, T);
    var qUaLocalL = qShWorldL.clone().invert().multiply(ikL.qUpper);
    var qLaLocalL = ikL.qUpper.clone().invert().multiply(ikL.qLower);
    writeQuat(hum, is0, 'leftUpperArm', qUaLocalL);
    writeQuat(hum, is0, 'leftLowerArm', qLaLocalL);
    setEulerBone(hum, is0, 'leftHand', handL[0], handL[1], handL[2] + talkBeat * 5, eTmp, qTmp);

    // 右臂 IK（角色右侧 -X = 画面左侧）
    var pShoulderR = pCur.clone(), qShWorldR = qChain.clone();
    stepBone(pShoulderR, qShWorldR, 'rightShoulder', qClavR);
    stepBone(pShoulderR, qShWorldR, 'rightUpperArm', null);
    var ikR = FX.ik3d([pShoulderR.x, pShoulderR.y, pShoulderR.z], mapWR, poleR, ctl.L1, ctl.L2, 'right', twistR, T);
    var qUaLocalR = qShWorldR.clone().invert().multiply(ikR.qUpper);
    var qLaLocalR = ikR.qUpper.clone().invert().multiply(ikR.qLower);
    writeQuat(hum, is0, 'rightUpperArm', qUaLocalR);
    writeQuat(hum, is0, 'rightLowerArm', qLaLocalR);
    setEulerBone(hum, is0, 'rightHand', handR[0], handR[1], handR[2] - talkBeat * 4, eTmp, qTmp);

    // 8. 30 关节五指柔性波浪弯曲
    var curlL = lerp(prevP.curlL, curP.curlL, uWrist);
    var curlR = lerp(prevP.curlR, curP.curlR, uWrist);
    var ptL = (curP.pointL ? uWrist : 0) + (prevP.pointL ? 1 - uWrist : 0) > 0.5;
    var ptR = (curP.pointR ? uWrist : 0) + (prevP.pointR ? 1 - uWrist : 0) > 0.5;
    var spL = lerp(prevP.spreadL || 0, curP.spreadL || 0, uWrist);
    var spR = lerp(prevP.spreadR || 0, curP.spreadR || 0, uWrist);
    applyFingers(hum, is0, 'left', curlL, ptL, spL, t, 0.0, eTmp, qTmp);
    applyFingers(hum, is0, 'right', curlR, ptR, spR, t, 1.7, eTmp, qTmp);

    // 9. 颈部与头部（低频柔和口播韵律 + 视线平滑补偿，无高频点头抖动）
    var headRot = lerp3(prevP.head, curP.head, uHead);
    var talkNodX = talkEnv * 2.0 * Math.sin(t * 3.6 + ctl.seed);
    var talkTiltZ = talkEnv * 1.6 * Math.cos(t * 2.5 + ctl.seed);
    setEulerBone(hum, is0, 'neck',
      headRot[0] * 0.35 + brWave2 * 0.7 + nodX * 0.35,
      headRot[1] * 0.35 - lx * 0.22 + nodY * 0.35,
      headRot[2] * 0.35 - swSlow * 1.4 + nodZ * 0.35, eTmp, qTmp);
    setEulerBone(hum, is0, 'head',
      headRot[0] * 0.65 - ly * 0.28 + nodX * 0.65 + talkNodX,
      headRot[1] * 0.65 - lx * 0.38 + swSub * 2.2 + nodY * 0.65 - reachTurnY * 0.45,
      headRot[2] * 0.65 + swSlow * 2.0 + nodZ * 0.65 + talkTiltZ, eTmp, qTmp);

    // 10. 真实 3D 眼球平滑微扫视（平滑插值过渡，消除跳帧感）
    var sacPhase = (t + ctl.seed * 0.31) * 0.65;
    var sacIdx = Math.floor(sacPhase);
    var sacBlend = smooth01((sacPhase - sacIdx) / 0.12);
    var sacH0 = Math.sin(sacIdx * 43.17 + ctl.seed * 9.1) * 43758.5453; sacH0 -= Math.floor(sacH0);
    var sacH1 = Math.sin((sacIdx + 1) * 43.17 + ctl.seed * 9.1) * 43758.5453; sacH1 -= Math.floor(sacH1);
    var sacH = lerp(sacH0, sacH1, sacBlend);
    var sacYaw = (sacH - 0.5) * 2.8;
    var sacPitch = (((sacH * 13) % 1) - 0.5) * 1.5;
    var eyeYaw = clamp(-lx * 0.36 + sacYaw, -9, 9);
    var eyePitch = clamp(-ly * 0.32 + sacPitch, -6, 6);
    if (is0) {
      setEulerBone(hum, is0, 'leftEye', eyePitch, eyeYaw, 0, eTmp, qTmp);
      setEulerBone(hum, is0, 'rightEye', eyePitch, eyeYaw, 0, eTmp, qTmp);
    }
    ctl.curGazeYaw = -eyeYaw; // 正值朝画面右 (+X)
    ctl.curGazePitch = -eyePitch;

    // 11. 角色整体舞台坐标与转身
    ctl.pivot.position.set(px, py, pz);
    ctl.pivot.rotation.set(0, finalRY * DEG, 0);

    if (!applyVisuals) return;

    // 12. 面部表情 + 眨眼防穿模 + 五元音口型 + 3D 腮红浓度 + 3D 漫符气泡显隐
    var em = vrm.expressionManager;
    var happyWeight = 0;
    if (em) {
      for (i = 0; i < EMOTIONS.length; i++) {
        var ek = resolveExprName(em, EMOTIONS[i]);
        if (ek) em.setValue(ek, 0);
      }
      var prevKey = resolveExprName(em, prevExpr);
      var curKey = resolveExprName(em, curExpr);
      if (prevKey && exprAlpha < 0.999) em.setValue(prevKey, (1 - exprAlpha) * 0.92);
      if (curKey) em.setValue(curKey, (prevKey === curKey ? 1 : exprAlpha) * 0.92);

      happyWeight = (curKey === 'happy' ? exprAlpha : 0) + (prevKey === 'happy' && curKey !== 'happy' ? 1 - exprAlpha : 0);
      var blinkVal = 0;
      if (ctl.blink > 0 && happyWeight < 0.35) {
        var period = 3.4;
        var cyc = Math.floor((t + ctl.seed * 0.37) / period);
        var jitter = (Math.sin(cyc * 91.7 + ctl.seed * 17.3) * 43758.5453) % 1;
        if (jitter < 0) jitter += 1;
        var bt = (t + ctl.seed * 0.37) - cyc * period - jitter * 1.3;
        if (bt >= 0 && bt <= 0.14) {
          var bu = bt / 0.14;
          blinkVal = (bu < 0.38 ? bu / 0.38 : 1 - (bu - 0.38) / 0.62) * (1 - happyWeight * 2.5);
        }
      }
      em.setValue('blink', clamp(blinkVal, 0, 1));

      var mouthScale = happyWeight > 0.5 ? 0.62 : 1.0;
      em.setValue('aa', vowels.aa * mouthScale);
      em.setValue('ih', vowels.ih * mouthScale);
      em.setValue('ou', vowels.ou * mouthScale);
      em.setValue('ee', vowels.ee * mouthScale);
      em.setValue('oh', vowels.oh * mouthScale);

      if (!is0) {
        var gy = ctl.curGazeYaw || 0, gp = ctl.curGazePitch || 0;
        em.setValue('lookRight', gy > 0 ? clamp(gy / 10, 0, 0.85) : 0);
        em.setValue('lookLeft', gy < 0 ? clamp(-gy / 10, 0, 0.85) : 0);
        em.setValue('lookUp', gp > 0 ? clamp(gp / 8, 0, 0.75) : 0);
        em.setValue('lookDown', gp < 0 ? clamp(-gp / 8, 0, 0.75) : 0);
      }
    }

    // 腮红随情绪柔和呼吸变化
    var blushAmt = lerp(prevP.blush || 0.15, curP.blush || 0.15, exprAlpha) + happyWeight * 0.25;
    ctl.curBlush = clamp(blushAmt, 0, 0.85);

    // 记录当前活跃漫符，在 updateMatrixWorld 之后精确锚定到 3D 头骨世界位置
    ctl.curEmote = null;
    for (i = 0; i < ctl.emotes.length; i++) {
      var ev = ctl.emotes[i];
      if (t >= ev.t0 && t <= ev.t0 + ev.dur) {
        ctl.curEmote = { kind: ev.kind, elap: t - ev.t0, dur: ev.dur };
      }
    }
  }

  /* 在 vrm.scene.updateMatrixWorld(true) 之后，把腮红与漫符对齐到真实的 3D 眼球/头部空间坐标 */
  function syncHeadOverlays(T, ctl) {
    var vrm = ctl.vrm;
    if (!vrm || !ctl.overlayGroup) return;
    var rawHead = vrm.humanoid.getRawBoneNode('head');
    var le = vrm.humanoid.getRawBoneNode('leftEye');
    var re = vrm.humanoid.getRawBoneNode('rightEye');
    if (!rawHead) return;

    // 从归一化的 head 骨骼读取纯正的 VRM 1.0 头部朝向（不受原始骨骼轴向差异影响）
    var normHead = vrm.humanoid.getNormalizedBoneNode('head');
    var qHead = new T.Quaternion();
    if (normHead) {
      normHead.updateWorldMatrix(true, false);
      normHead.getWorldQuaternion(qHead);
      if (ctl.isVRM0) {
        // rotateVRM0 翻转了场景 Y 180°，把归一化朝向同步到场景世界空间
        qHead.set(-qHead.x, qHead.y, -qHead.z, qHead.w);
      }
    }
    var headUp = new T.Vector3(0, 1, 0).applyQuaternion(qHead);
    var headFwd = new T.Vector3(0, 0, 1).applyQuaternion(qHead);
    var headRight = new T.Vector3(1, 0, 0).applyQuaternion(qHead); // 画面右侧 (+X)

    var pHead = new T.Vector3();
    rawHead.getWorldPosition(pHead);
    ctl.pivot.worldToLocal(pHead);

    // 腮红：精确落在左右眼球下方微向外侧的脸颊表面
    if (le && re && ctl.blushMeshes.length === 2) {
      var pL = new T.Vector3(), pR = new T.Vector3();
      le.getWorldPosition(pL); ctl.pivot.worldToLocal(pL);
      re.getWorldPosition(pR); ctl.pivot.worldToLocal(pR);
      var hs = ctl.headScale;
      var placeBlush = function (mesh, pEye, outSign) {
        mesh.position.copy(pEye)
          .addScaledVector(headUp, -0.026 * hs)
          .addScaledVector(headRight, outSign * 0.014 * hs)
          .addScaledVector(headFwd, 0.036 * hs);
        mesh.quaternion.copy(qHead);
        mesh.scale.setScalar(hs);
        mesh.material.opacity = ctl.curBlush || 0;
      };
      // 注意画面右侧 (+X) 对应 pL 或 pR 中 x 较大的那颗眼球
      if (pL.x >= pR.x) {
        placeBlush(ctl.blushMeshes[0], pL, 1);
        placeBlush(ctl.blushMeshes[1], pR, -1);
      } else {
        placeBlush(ctl.blushMeshes[0], pR, 1);
        placeBlush(ctl.blushMeshes[1], pL, -1);
      }
    }

    // 漫符气泡：浮在头部画面右上方（太阳穴外侧），随头部摆动自然跳动
    for (var k in ctl.emoteSprites) ctl.emoteSprites[k].visible = false;
    if (ctl.curEmote) {
      var ce = ctl.curEmote;
      var sp = ctl.emoteSprites[ce.kind];
      if (!sp) {
        var sm = new T.SpriteMaterial({ map: getEmoteTexture(T, ce.kind), transparent: true, depthTest: false });
        sp = new T.Sprite(sm);
        sp.renderOrder = 25;
        ctl.overlayGroup.add(sp);
        ctl.emoteSprites[ce.kind] = sp;
      }
      var popIn = softSettle(clamp(ce.elap / 0.25, 0, 1), 1.6);
      var popOut = clamp((ce.dur - ce.elap) / 0.20, 0, 1);
      var sc = 0.14 * ctl.headScale * popIn * popOut * (1 + 0.08 * Math.sin(ce.elap * 7.5));
      sp.visible = sc > 0.002;
      sp.scale.set(sc, sc, 1);
      sp.position.copy(pHead)
        .addScaledVector(headRight, 0.145 * ctl.headScale)
        .addScaledVector(headUp, (0.165 + Math.sin(ce.elap * 5.5) * 0.012) * ctl.headScale)
        .addScaledVector(headFwd, 0.05);
      sp.material.opacity = popOut;
    }
  }

  /* ───────────────────────── 1. 加载与常驻 3D 角色：vrm3d ───────────────────────── */
  def('vrm3d', '加载真 3D 二次元 VRM 角色（FX.ik3d 双骨逆解 + 6 节脊柱波 + 五元音口型 + 腮红漫符 + 头发物理），写在 stage3d 上。参数 src=shino|vita|路径、headscale=Q版头身比(默认1.20)、ry、x/y/z、breathe/blink/sway/spring', function (c) {
    var env = needVRM(), T = env.T, V = env.V, o = c.o;
    var rawSrc = o.src || 'shino';
    var src = MODEL_SHORTCUTS[rawSrc] || rawSrc;
    var ctl = ensureState(c.el);
    ctl.baseX = num(o.x, 0);
    ctl.baseY = num(o.y, 0);
    ctl.baseZ = num(o.z, 0);
    ctl.baseRY = num(o.ry, 0);
    ctl.headScale = num(o.headscale, 1.20);
    ctl.padZ = num(o.padz, 0);
    ctl.breathe = num(o.breathe, 1);
    ctl.blink = num(o.blink, 1);
    ctl.sway = num(o.sway, 1);
    ctl.spring = num(o.spring, 1);
    ctl.seed = num(o.seed, 11);
    ctl.lookX = num(o.lookx, 0);
    ctl.lookY = num(o.looky, 0);

    var eTmp = new T.Euler(), qTmp = new T.Quaternion();

    FX._stage3d.obj(c, function (s3) {
      // 默认套用灵巧紧凑型角落主持人构图（半身+百褶裙摆入镜，占屏高约 42%，不喧宾夺主）
      if (s3.alpha && !c.el.hasAttribute('data-cam')) {
        s3.cam0 = { x: 0.48, y: 1.46, z: 3.12, lx: 0.48, ly: 1.44, lz: 0, fov: num(c.el.getAttribute('data-fov'), 26) };
      }
      if (s3.alpha && !c.el.hasAttribute('data-light')) {
        var oldLights = s3.scene.children.filter(function (ch) { return ch.isLight; });
        oldLights.forEach(function (l) { s3.scene.remove(l); });
        s3.scene.add(new T.AmbientLight(0xfff7f0, 0.78));
        var aKey = new T.DirectionalLight(0xfffdf9, 2.55); aKey.position.set(1.2, 1.9, 2.8); s3.scene.add(aKey);
        var aRim = new T.DirectionalLight(0xdbeafe, 0.55); aRim.position.set(-1.8, 1.6, -2.2); s3.scene.add(aRim);
      }

      var root = new T.Group();
      var pivot = new T.Group();
      root.add(pivot);
      ctl.pivot = pivot;

      var loader = new V.GLTFLoader();
      loader.register(function (parser) { return new V.VRMLoaderPlugin(parser); });
      if (V.VRMAnimationLoaderPlugin) {
        loader.register(function (parser) { return new V.VRMAnimationLoaderPlugin(parser); });
      }

      var baseUrl = src.indexOf('/') >= 0 ? src.slice(0, src.lastIndexOf('/') + 1) : './';
      var ready = fetchBuffer(src).then(function (buf) {
        return new Promise(function (resolve, reject) {
          loader.parse(buf.slice(0), baseUrl, resolve, reject);
        });
      }).then(function (gltf) {
        var vrm = gltf.userData.vrm;
        if (!vrm) throw new Error('fx-vrm：文件不包含 VRM 扩展数据 → ' + src);
        if (V.VRMUtils) {
          if (V.VRMUtils.removeUnnecessaryVertices) V.VRMUtils.removeUnnecessaryVertices(gltf.scene);
          if (V.VRMUtils.combineSkeletons) V.VRMUtils.combineSkeletons(gltf.scene);
          V.VRMUtils.rotateVRM0(vrm);
        }
        var maxAniso = Math.min(8, s3.renderer.capabilities.getMaxAnisotropy ? s3.renderer.capabilities.getMaxAnisotropy() : 4);
        vrm.scene.traverse(function (obj) {
          if (!obj.isMesh) return;
          obj.frustumCulled = false;
          var mats = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
          mats.forEach(function (m) {
            if (!m) return;
            // 小尺寸角落渲染时适度收敛 MToon 描边粗细，让五官与发丝线条更纤细精致
            if (m.outlineWidthFactor !== undefined && ctl.headScale > 1.05) {
              m.outlineWidthFactor *= 0.76;
            }
            ['map', 'shadeMultiplyTexture', 'normalMap', 'emissiveMap', 'matcapTexture'].forEach(function (tk) {
              if (m[tk] && m[tk].isTexture) {
                m[tk].anisotropy = maxAniso;
                m[tk].needsUpdate = true;
              }
            });
          });
        });

        var is0 = !!(vrm.meta && vrm.meta.metaVersion === '0');
        ctl.vrm = vrm;
        ctl.isVRM0 = is0;

        // 归一化眼高至 1.48m，并自动消除导出原点在 X/Z 上的偏移（保证转身围绕角色自身脊柱旋转）
        if (o.autofit !== 0 && o.autofit !== '0') {
          vrm.scene.updateMatrixWorld(true);
          var eyeNode = vrm.humanoid.getRawBoneNode('leftEye') || vrm.humanoid.getRawBoneNode('head');
          var headRaw = vrm.humanoid.getRawBoneNode('head');
          if (eyeNode) {
            var wp = new T.Vector3();
            eyeNode.getWorldPosition(wp);
            if (wp.y > 0.3) vrm.scene.scale.setScalar((1.48 / wp.y) * num(o.fit, 1));
          }
          vrm.scene.updateMatrixWorld(true);
          if (headRaw) {
            var hp = new T.Vector3();
            headRaw.getWorldPosition(hp);
            vrm.scene.position.x -= hp.x;
            vrm.scene.position.z -= hp.z;
          }
        }

        // 记录所有归一化骨骼在 VRM 1.0 空间下的静止局部偏移、真实肩中心与臂长比例
        var boneKeys = ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head',
          'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
          'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand'];
        boneKeys.forEach(function (bk) {
          var bn = vrm.humanoid.getNormalizedBoneNode(bk);
          if (bn) ctl.restPos[bk] = [is0 ? -bn.position.x : bn.position.x, bn.position.y, is0 ? -bn.position.z : bn.position.z];
        });
        if (ctl.restPos.leftLowerArm) ctl.L1 = Math.hypot(ctl.restPos.leftLowerArm[0], ctl.restPos.leftLowerArm[1], ctl.restPos.leftLowerArm[2]) || 0.219;
        if (ctl.restPos.leftHand) ctl.L2 = Math.hypot(ctl.restPos.leftHand[0], ctl.restPos.leftHand[1], ctl.restPos.leftHand[2]) || 0.214;
        ctl.armScale = clamp((ctl.L1 + ctl.L2) / 0.433, 0.65, 1.35);

        var sx = 0, sy = 0, sz = 0;
        ['hips', 'spine', 'chest', 'upperChest'].forEach(function (bk) {
          if (ctl.restPos[bk]) { sx += ctl.restPos[bk][0]; sy += ctl.restPos[bk][1]; sz += ctl.restPos[bk][2]; }
        });
        if (ctl.restPos.leftShoulder && ctl.restPos.leftUpperArm) {
          sy += (ctl.restPos.leftShoulder[1] + ctl.restPos.leftUpperArm[1]);
          sz += (ctl.restPos.leftShoulder[2] + ctl.restPos.leftUpperArm[2]);
        }
        ctl.shOrigin = [sx, sy, sz];

        // 精致 2.5D 口播头身比微调（让小尺寸角落主持人的五官、眼神与口型更圆润清晰）
        var rawHead = vrm.humanoid.getRawBoneNode('head');
        if (rawHead && ctl.headScale !== 1) rawHead.scale.setScalar(ctl.headScale);

        var overlayGroup = new T.Group();
        ctl.overlayGroup = overlayGroup;
        var bGeo = new T.PlaneGeometry(0.056, 0.028);
        for (var bi = 0; bi < 2; bi++) {
          var bMat = new T.MeshBasicMaterial({ map: getBlushTexture(T), transparent: true, opacity: 0.22, depthWrite: false, depthTest: false });
          var bm = new T.Mesh(bGeo, bMat);
          bm.renderOrder = 18;
          overlayGroup.add(bm);
          ctl.blushMeshes.push(bm);
        }

        pivot.add(vrm.scene);
        pivot.add(overlayGroup);

        // 加载外部 .vrma 动作捕捉文件（若声明）
        return Promise.all(ctl.anims.map(function (an) {
          return fetchBuffer(an.src).then(function (ab) {
            return new Promise(function (res, rej) { loader.parse(ab.slice(0), './', res, rej); });
          }).then(function (agltf) {
            var vrmAnim = (agltf.userData.vrmAnimations && agltf.userData.vrmAnimations[0]) || agltf.userData.vrmAnimation;
            if (vrmAnim && V.createVRMAnimationClip) {
              an.clip = V.createVRMAnimationClip(vrmAnim, vrm);
              an.mixer = new T.AnimationMixer(vrm.scene);
              an.action = an.mixer.clipAction(an.clip);
              an.action.play();
            }
          });
        })).then(function () {
          s3.renderer.compile(s3.scene, s3.cam);
          s3.redraw();
        });
      });

      holdRender(ready);

      return {
        root: root,
        update: function (lt, A, absT) {
          if (!ctl.vrm) return;
          var t = absT !== undefined ? absT : lt;
          var vrm = ctl.vrm;

          var activeAnim = null;
          for (var i = 0; i < ctl.anims.length; i++) {
            var an = ctl.anims[i];
            if (an.mixer && t >= an.t0 && t <= an.t0 + an.dur) activeAnim = an;
          }

          var stepPose = function (tau, visuals) {
            evalCharacterAt(T, ctl, tau, eTmp, qTmp, visuals);
            if (activeAnim) activeAnim.mixer.setTime((tau - activeAnim.t0) % (activeAnim.clip.duration || 1));
            vrm.humanoid.update();
            if (visuals && vrm.expressionManager) vrm.expressionManager.update();
            if (vrm.nodeConstraintManager) vrm.nodeConstraintManager.update();
          };

          if (ctl.spring > 0 && vrm.springBoneManager) {
            var step = 1 / 60;
            // 顺序推进快路径：相邻帧（如 60fps 连续截帧）绝不重置物理骨骼，彻底杜绝滑动窗口重置带来的发丝微颤！
            if (ctl.lastSimT !== undefined && t > ctl.lastSimT && (t - ctl.lastSimT) <= 0.065) {
              var dt = t - ctl.lastSimT;
              var nSub = Math.max(1, Math.ceil(dt / step));
              var subDt = dt / nSub;
              for (var sIdx = 1; sIdx <= nSub; sIdx++) {
                var tSub = ctl.lastSimT + subDt * sIdx;
                var isFinal = sIdx === nSub;
                stepPose(tSub, isFinal);
                vrm.scene.updateMatrixWorld(true);
                vrm.springBoneManager.update(subDt);
              }
              ctl.lastSimT = t;
              syncHeadOverlays(T, ctl);
            } else {
              // 跨区间跳帧（如多进程 Worker 切块起点或拖动进度条）：从 1.2s 前的 1/60s 网格锚点长预热收敛（残差 < 0.2%），之后切入连续积分
              var tAnchor = Math.max(0, Math.floor((t - 1.2) * 60) / 60);
              stepPose(tAnchor, false);
              vrm.scene.updateMatrixWorld(true);
              vrm.springBoneManager.reset();

              for (var tau = tAnchor + step; tau < t - 1e-5; tau += step) {
                stepPose(tau, false);
                vrm.scene.updateMatrixWorld(true);
                vrm.springBoneManager.update(step);
              }
              var rem = t - (tau - step);
              stepPose(t, true);
              vrm.scene.updateMatrixWorld(true);
              if (rem > 1e-5) vrm.springBoneManager.update(rem);
              ctl.lastSimT = t;
              syncHeadOverlays(T, ctl);
            }
          } else {
            stepPose(t, true);
            vrm.scene.updateMatrixWorld(true);
            syncHeadOverlays(T, ctl);
          }
        }
      };
    }, { fade: num(o.fade, 0), out: num(o.out, 0) });
  });

  /* ───────────────────────── 2. 切换 3D IK 姿态、表情与漫符：vrm-pose ───────────────────────── */
  def('vrm-pose', '切换 3D VRM 角色 IK 姿态、表情、视线与漫符：pose=idle|wave|explain|point|point-up|think|shock|clasp|reject|shrug|proud|cheer|bow（也支持 lx/ly/lz/rx/ry/rz 自定义手腕 3D IK 坐标），expr=neutral|happy|relaxed|angry|sad|surprised，emote=sweat|question|idea|anger|sparkle|excl，look=cam|right|left|up|down', function (c) {
    needVRM();
    var o = c.o, ctl = ensureState(c.el);
    var basePose = o.pose ? (POSES[String(o.pose)] || POSES.idle) : null;
    if (o.lx !== undefined || o.ly !== undefined || o.lz !== undefined || o.rx !== undefined || o.ry_ik !== undefined || o.rz !== undefined) {
      var ref = basePose || POSES.idle, cp = {}, k;
      for (k in ref) cp[k] = ref[k];
      cp.L = [num(o.lx, ref.L[0]), num(o.ly, ref.L[1]), num(o.lz, ref.L[2])];
      cp.R = [num(o.rx, ref.R[0]), num(o.ry_ik, ref.R[1]), num(o.rz, ref.R[2])];
      basePose = cp;
    }
    var lookVec = null;
    if (o.look !== undefined) {
      lookVec = LOOK_PRESETS[o.look] || [num(o.lookx, 0), num(o.looky, 0)];
    } else if (o.lookx !== undefined || o.looky !== undefined) {
      lookVec = [num(o.lookx, 0), num(o.looky, 0)];
    }
    ctl.poses.push({
      t0: c.t,
      dur: num(o.dur, 0.46),
      pose: basePose,
      expr: o.expr ? String(o.expr) : null,
      ry: o.ry !== undefined ? num(o.ry, 0) : null,
      look: lookVec
    });
    if (o.emote) {
      ctl.emotes.push({ t0: c.t + 0.08, dur: num(o.edur, 2.4), kind: String(o.emote) });
    }
    ctl.sorted = false;
  });

  /* ───────────────────────── 3. 五元音口型与手势节拍同步：vrm-talk ───────────────────────── */
  def('vrm-talk', '驱动 3D VRM 角色五元音口型（aa/ih/ou/ee/oh）并联动口播音节手势节拍：dur=说话秒数、rate=音节速率、amp=张嘴幅度、seed', function (c) {
    var o = c.o, ctl = ensureState(c.el);
    ctl.talks.push({
      t0: c.t,
      dur: num(o.dur, 2.5),
      rate: num(o.rate, 6.4),
      amp: num(o.amp, 0.85),
      seed: num(o.seed, Math.round(c.t * 13) + 5)
    });
  });

  /* ───────────────────────── 4. 头部动作叠加：vrm-nod ───────────────────────── */
  def('vrm-nod', '给 3D VRM 角色叠加点头、摇头或歪头动作：kind=nod|shake|tilt、n=次数、amp=幅度、dur', function (c) {
    var o = c.o, ctl = ensureState(c.el);
    ctl.nods.push({
      t0: c.t,
      dur: num(o.dur, 0.65),
      kind: o.kind || 'nod',
      n: num(o.n, 2),
      amp: num(o.amp, 1)
    });
  });

  /* ───────────────────────── 5. 角色升降与小步走位：vrm-move ───────────────────────── */
  def('vrm-move', '移动 3D VRM 角色位置（如从画面底部轻快弹出登场或横向小步让位）：x/y/z、fromY=起始高度、dur、ease', function (c) {
    needVRM();
    var o = c.o, ctl = ensureState(c.el);
    ctl.moves.push({
      t0: c.t,
      dur: num(o.dur, 0.50),
      ease: FX._stage3d.easeFn(o.ease, o.fromY !== undefined ? 'back.out(1.5)' : 'power2.inOut'),
      fromY: o.fromY !== undefined ? num(o.fromY, -0.8) : null,
      toX: o.x !== undefined ? num(o.x, 0) : null,
      toY: o.y !== undefined ? num(o.y, 0) : null,
      toZ: o.z !== undefined ? num(o.z, 0) : null
    });
    ctl.sorted = false;
  });

  /* ───────────────────────── 6. 外部动作捕捉文件：vrm-anim ───────────────────────── */
  def('vrm-anim', '播放标准 .vrma (VRM Animation) 3D 动作捕捉片段并自动叠加口型与眨眼：src=文件路径、dur', function (c) {
    var o = c.o, ctl = ensureState(c.el);
    if (!o.src) return;
    ctl.anims.push({
      t0: c.t,
      dur: num(o.dur, c.sceneDur),
      src: String(o.src),
      mixer: null,
      clip: null,
      action: null
    });
  });

  FX._vrmPoses = POSES;
})(window);
