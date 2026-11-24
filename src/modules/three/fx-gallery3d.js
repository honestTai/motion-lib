/*!
 * FX 暖白无影展厅 3D 模块 v1.0 (fx-gallery3d.js)
 * SPDX-License-Identifier: MIT
 *
 * 复刻并通用化「暖白无影展厅 · 五连拍真 3D 片头组合」（配 .theme-white3d.gallery 皮肤）：
 *   第 1 拍 corridor-fly    ：3D 倒角画框长廊高速穿梭 + 前景大光圈柔焦虚化 + 地面跟随投影 → 定焦中央英雄画框
 *   第 2 拍 hero-split3d    ：英雄画框右移侧旋，剥离半透明玻璃背板与 8 锚点 CAD 选区线框，滑出 3D 进度轨并浮现左题
 *   第 3 拍 step-track3d    ：5 张 3D 竖版白瓷厚卡横向滑轨跟拍，底部生长三维朱橙悬链跳线与领跑圆球串联各卡
 *   第 4 拍 step-overview3d ：摄影机平滑拉远全景同框陈列全部步骤竖卡与完整底部跳线链
 *   第 5 拍 monolith-rise3d ：五卡上移归档 + 橙色树状引线与胶囊签 + 3D 双层倒角白瓷巨碑翻起立定并生长横线
 *
 * 既可在单个 data-make="gallery3d" 舞台上一镜到底串联全部五拍，也可通过
 * data-make="corridor3d" / "stepchain3d" / "monolith3d" 在任意普通分镜里单独调用其中一拍。
 *
 * 依赖顺序：
 *   <script src="lib/vendor/gsap.min.js"></script>
 *   <script src="lib/vendor/three-fx.min.js"></script>
 *   <script src="lib/vendor/three-vrm.min.js"></script>          <!-- 提供 GLTFLoader -->
 *   <script src="lib/assets/gallery3d/models-b64.js"></script>  <!-- 可选：离线零延迟真 GLB 包（file:// 自检友好） -->
 *   <script src="lib/fx.js"></script>
 *   <script src="lib/fx-gallery3d.js"></script>
 */
(function (g, doc) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-gallery3d：请先加载 fx.js');

  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  var FLOOR_Y = -2.04;
  var CAT = '立体';
  var READY_SEQ = 0;

  var num = function (v, d0) { return v === undefined || v === null || v === '' || isNaN(+v) ? d0 : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth01 = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var smoother01 = function (x) { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  var outBack = function (u, s) {
    u = clamp(u, 0, 1); if (u <= 0 || u >= 1) return u;
    s = s === undefined ? 1.28 : s;
    var t = u - 1;
    return t * t * ((s + 1) * t + s) + 1;
  };
  var easeOutCubic = function (u) { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 3); };
  var easeInOutCubic = function (u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };

  function d() { return doc || g.document; }
  function mk(tag, cls) { var e = d().createElement(tag); if (cls) e.className = cls; return e; }
  function attr(el, k, defVal) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? defVal : v; }
  function kidsOf(el) { return Array.prototype.slice.call(el.children || []); }

  function holdRender(promise) {
    if (!promise || typeof promise.then !== 'function') return;
    var hf = g.__hf = g.__hf || {};
    hf.buildReady = hf.buildReady || {};
    hf.buildReady['fx-gallery3d-' + (++READY_SEQ)] = promise;
  }

  /* ═════════════════════ GLB 模板加载与程序化高精回退 ═════════════════════ */

  var GLB_SPECS = {
    frame: { file: 'gallery-frame.glb', w: 3.20, h: 2.00, t: 0.11, sw: 2.98, sh: 1.78, sz: 0.036 },
    step: { file: 'step-slab.glb', w: 2.10, h: 2.72, t: 0.12, sw: 1.98, sh: 2.60, sz: 0.063 },
    monolith: { file: 'monolith-slab.glb', w: 6.80, h: 2.86, t: 0.26, sw: 6.36, sh: 2.46, sz: 0.133 },
    scrub: { file: 'scrub-bar.glb', w: 3.10, h: 0.22, t: 0.09, sw: 2.90, sh: 0.10, sz: 0.049 }
  };
  var GLB_TEMPLATES = {};
  var GLB_PROMISE = null;
  var GLB_LISTENERS = [];

  function b64ToBuffer(b64) {
    var bin = g.atob ? g.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    var len = bin.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function resolveAssetBase() {
    if (!d() || !d().querySelectorAll) return 'lib/assets/gallery3d/';
    var scripts = d().querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src') || '';
      var m = /^(.*\/)fx-gallery3d\.js(?:\?.*)?$/.exec(s);
      if (m) return m[1] + 'assets/gallery3d/';
    }
    return 'lib/assets/gallery3d/';
  }

  function ensureGLBTemplates(T) {
    if (GLB_PROMISE) return GLB_PROMISE;
    var V = g.THREE_VRM;
    if (!V || !V.GLTFLoader) {
      GLB_PROMISE = Promise.resolve(false);
      return GLB_PROMISE;
    }
    var loader = new V.GLTFLoader();
    var bank = g.FX_GALLERY3D_GLB || null;
    var base = resolveAssetBase();
    var isFileProto = g.location && g.location.protocol === 'file:';

    var parseBuf = function (key, buf) {
      return new Promise(function (resolve) {
        loader.parse(buf, '', function (gltf) {
          GLB_TEMPLATES[key] = gltf.scene;
          resolve(true);
        }, function () { resolve(false); });
      });
    };

    var tasks = Object.keys(GLB_SPECS).map(function (key) {
      if (bank && bank[key]) {
        try { return parseBuf(key, b64ToBuffer(bank[key])); } catch (e) { return Promise.resolve(false); }
      }
      if (isFileProto || typeof g.fetch !== 'function') return Promise.resolve(false);
      return g.fetch(base + GLB_SPECS[key].file)
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) { return buf ? parseBuf(key, buf) : false; })
        .catch(function () { return false; });
    });

    GLB_PROMISE = Promise.all(tasks).then(function () {
      var cbs = GLB_LISTENERS.splice(0);
      cbs.forEach(function (fn) { try { fn(); } catch (e) {} });
      return true;
    });
    holdRender(GLB_PROMISE);
    return GLB_PROMISE;
  }

  function makeRoundedRectShape(T, w, h, r) {
    var s = new T.Shape();
    var x = -w / 2, y = -h / 2;
    r = Math.min(r, w * 0.45, h * 0.45);
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function buildProceduralModel(T, kind, accentHex) {
    var spec = GLB_SPECS[kind];
    var group = new T.Group();
    var r = kind === 'monolith' ? 0.14 : kind === 'step' ? 0.09 : kind === 'scrub' ? 0.09 : 0.03;
    var shape = makeRoundedRectShape(T, spec.w - 0.04, spec.h - 0.04, r);
    var geo = new T.ExtrudeGeometry(shape, {
      depth: spec.t * 0.76,
      bevelEnabled: true,
      bevelThickness: spec.t * 0.12,
      bevelSize: 0.02,
      bevelSegments: 3
    });
    geo.translate(0, 0, -spec.t * 0.38);
    var bodyCol = kind === 'monolith' ? '#d6dbe3' : kind === 'frame' ? '#dcdfe6' : '#fcfbf9';
    var bodyMat = new T.MeshStandardMaterial({
      color: new T.Color(bodyCol),
      roughness: kind === 'step' ? 0.36 : 0.32,
      metalness: kind === 'step' ? 0.04 : 0.20,
      transparent: true,
      opacity: 1
    });
    var bodyMesh = new T.Mesh(geo, bodyMat);
    bodyMesh.name = 'FallbackBody';
    group.add(bodyMesh);

    if (kind === 'monolith') {
      var coreShape = makeRoundedRectShape(T, spec.sw + 0.10, spec.sh + 0.10, 0.10);
      var coreGeo = new T.ExtrudeGeometry(coreShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
      coreGeo.translate(0, 0, spec.sz - 0.045);
      var coreMat = new T.MeshStandardMaterial({ color: new T.Color('#fcfbf8'), roughness: 0.38, metalness: 0.03, transparent: true, opacity: 1 });
      group.add(new T.Mesh(coreGeo, coreMat));
    }
    if (kind === 'step') {
      var stripGeo = new T.BoxGeometry(0.032, spec.sh * 0.56, 0.018);
      var stripMat = new T.MeshStandardMaterial({ color: new T.Color(accentHex || '#ea580c'), roughness: 0.35, metalness: 0.05, transparent: true, opacity: 1 });
      var strip = new T.Mesh(stripGeo, stripMat);
      strip.name = 'AccentStrip';
      strip.position.set(-spec.sw * 0.435, spec.sh * 0.04, spec.sz + 0.008);
      group.add(strip);
    }

    var scrGeo = new T.PlaneGeometry(spec.sw, spec.sh);
    var scrMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    var scr = new T.Mesh(scrGeo, scrMat);
    scr.name = 'ScreenSurface';
    scr.position.set(0, 0, spec.sz);
    group.add(scr);
    return group;
  }

  function instantiateRigModel(T, kind, screenTex, accentHex) {
    var holder = new T.Group();
    var mats = [];
    var screenMat = new T.MeshBasicMaterial({
      map: screenTex || null,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      toneMapped: false
    });

    function mount(sourceRoot, isGLB) {
      while (holder.children.length) holder.remove(holder.children[0]);
      mats.length = 0;
      var root = isGLB ? sourceRoot.clone(true) : sourceRoot;
      root.traverse(function (node) {
        if (!node.isMesh) return;
        if (node.name === 'ScreenSurface') {
          node.material = screenMat;
          mats.push(screenMat);
        } else if (node.material) {
          var m = node.material.clone();
          m.transparent = true;
          if (node.name === 'AccentStrip' && accentHex) m.color = new T.Color(accentHex);
          node.material = m;
          mats.push(m);
        }
      });
      holder.add(root);
    }

    if (GLB_TEMPLATES[kind]) {
      mount(GLB_TEMPLATES[kind], true);
    } else {
      mount(buildProceduralModel(T, kind, accentHex), false);
      GLB_LISTENERS.push(function () {
        if (GLB_TEMPLATES[kind]) mount(GLB_TEMPLATES[kind], true);
      });
    }

    return {
      group: holder,
      screenMat: screenMat,
      setOpacity: function (alpha) {
        var a = clamp(alpha, 0, 1);
        holder.visible = a > 0.004;
        for (var i = 0; i < mats.length; i++) {
          mats[i].opacity = a;
          mats[i].depthWrite = a > 0.88;
        }
      },
      setTexture: function (tex) {
        screenMat.map = tex;
        screenMat.needsUpdate = true;
      }
    };
  }

  /* ═════════════════════ CanvasTexture 纹理绘制工坊 ═════════════════════ */

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  var SHADOW_TEX = null;
  function getShadowTexture(T) {
    if (SHADOW_TEX) return SHADOW_TEX;
    var cv = mk('canvas'); cv.width = 256; cv.height = 256;
    var ctx = cv.getContext('2d');
    var g0 = ctx.createRadialGradient(128, 128, 10, 128, 128, 122);
    g0.addColorStop(0, 'rgba(30, 35, 48, 0.42)');
    g0.addColorStop(0.45, 'rgba(30, 35, 48, 0.20)');
    g0.addColorStop(0.78, 'rgba(30, 35, 48, 0.05)');
    g0.addColorStop(1, 'rgba(30, 35, 48, 0)');
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, 256, 256);
    SHADOW_TEX = new T.CanvasTexture(cv);
    return SHADOW_TEX;
  }

  function makeFloorShadow(T, w, d0) {
    var geo = new T.PlaneGeometry(w, d0);
    geo.rotateX(-Math.PI / 2);
    var mat = new T.MeshBasicMaterial({
      map: getShadowTexture(T),
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    var mesh = new T.Mesh(geo, mat);
    mesh.position.y = FLOOR_Y + 0.005;
    return {
      mesh: mesh,
      sync: function (wx, wy, wz, baseAlpha, visAlpha) {
        if (visAlpha <= 0.005) { mesh.visible = false; return; }
        mesh.visible = true;
        var lift = Math.max(0, wy - FLOOR_Y);
        var spread = 1 + lift * 0.14;
        mesh.position.set(wx + 0.08, FLOOR_Y + 0.005, wz - 0.10);
        mesh.scale.set(spread, 1, spread * 0.92);
        mat.opacity = clamp((baseAlpha / (1 + lift * 0.28)) * visAlpha, 0, 0.52);
      }
    };
  }

  var GLOW_TEX = null;
  function getGlowTexture(T, hex) {
    if (GLOW_TEX) return GLOW_TEX;
    var cv = mk('canvas'); cv.width = 128; cv.height = 128;
    var ctx = cv.getContext('2d');
    var grd = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grd.addColorStop(0, hex || 'rgba(234, 88, 12, 0.85)');
    grd.addColorStop(0.45, 'rgba(234, 88, 12, 0.28)');
    grd.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    GLOW_TEX = new T.CanvasTexture(cv);
    return GLOW_TEX;
  }

  function drawHouseIcon(ctx, cx, cy, s, strokeCol, accentCol) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = strokeCol || '#64748b';
    ctx.lineWidth = 3.2 * s;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -34 * s);
    ctx.lineTo(38 * s, -4 * s);
    ctx.lineTo(30 * s, -4 * s);
    ctx.lineTo(30 * s, 30 * s);
    ctx.lineTo(-30 * s, 30 * s);
    ctx.lineTo(-30 * s, -4 * s);
    ctx.lineTo(-38 * s, -4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accentCol || '#fed7aa';
    ctx.fillRect(-10 * s, 6 * s, 20 * s, 24 * s);
    ctx.strokeRect(-10 * s, 6 * s, 20 * s, 24 * s);
    ctx.restore();
  }

  /* 画廊走廊画框贴图（支持真图片或高审美分镜线框插画 + 可选大光圈模糊版） */
  function createGalleryCardTextures(T, variant, imgEl, accent) {
    var W = 960, H = 574;
    var sharpCv = mk('canvas'); sharpCv.width = W; sharpCv.height = H;
    var ctx = sharpCv.getContext('2d');

    function paintBase() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fcfaf4';
      ctx.fillRect(0, 0, W, H);

      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        var iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
        var pad = 18, tw = W - pad * 2, th = H - pad * 2;
        var sc = Math.max(tw / iw, th / ih);
        var dw = iw * sc, dh = ih * sc;
        ctx.save();
        roundRectPath(ctx, pad, pad, tw, th, 10);
        ctx.clip();
        ctx.drawImage(imgEl, pad + (tw - dw) / 2, pad + (th - dh) / 2, dw, dh);
        ctx.restore();
      } else {
        var mode = variant % 5;
        if (mode === 0) {
          // 暖色工作室阳光窗景插画卡（英雄默认主视觉风格）
          var sky = ctx.createLinearGradient(0, 0, 0, H);
          sky.addColorStop(0, '#fdf6e7');
          sky.addColorStop(0.62, '#f5e6cb');
          sky.addColorStop(1, '#e6d2b2');
          ctx.fillStyle = sky;
          ctx.fillRect(18, 18, W - 36, H - 36);
          // 阳光窗格
          ctx.fillStyle = 'rgba(255,255,255,0.78)';
          roundRectPath(ctx, 360, 48, 380, 220, 10); ctx.fill();
          ctx.strokeStyle = '#c8a97e'; ctx.lineWidth = 6;
          ctx.strokeRect(360, 48, 380, 220);
          ctx.beginPath(); ctx.moveTo(550, 48); ctx.lineTo(550, 268); ctx.moveTo(360, 158); ctx.lineTo(740, 158); ctx.stroke();
          // 绿植叶影与桌面蓝盒
          ctx.fillStyle = '#84a98c';
          ctx.beginPath(); ctx.arc(410, 96, 36, 0, TAU); ctx.arc(706, 88, 30, 0, TAU); ctx.fill();
          ctx.fillStyle = '#d4a373';
          roundRectPath(ctx, 590, 300, 310, 34, 8); ctx.fill();
          ctx.fillRect(630, 334, 24, 180); ctx.fillRect(830, 334, 24, 180);
          // 立体蓝色收纳箱 + 暖橘主角剪影
          ctx.fillStyle = '#6482ad';
          roundRectPath(ctx, 430, 336, 170, 118, 10); ctx.fill();
          ctx.fillStyle = '#7fa1c3';
          roundRectPath(ctx, 424, 322, 182, 28, 6); ctx.fill();
          ctx.fillStyle = '#d98a3c';
          ctx.beginPath(); ctx.ellipse(356, 378, 72, 64, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(364, 310, 48, 0, TAU); ctx.fill();
          // 墙面海报「规则」
          ctx.fillStyle = '#fffdf9';
          roundRectPath(ctx, 130, 74, 148, 196, 8); ctx.fill();
          ctx.strokeStyle = '#d6c7b2'; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#334155'; ctx.font = '800 28px "PingFang SC", sans-serif';
          ctx.fillText('SOP', 174, 122);
          ctx.fillStyle = accent; ctx.fillRect(156, 142, 96, 6);
          ctx.fillStyle = '#94a3b8'; ctx.fillRect(156, 166, 84, 6); ctx.fillRect(156, 186, 72, 6);
        } else if (mode === 1) {
          // 双栏建筑/分镜线框工作台
          ctx.fillStyle = '#f8f9fb';
          ctx.fillRect(24, 24, W - 48, H - 48);
          ctx.fillStyle = '#ffffff';
          roundRectPath(ctx, 64, 68, 380, 340, 16); ctx.fill();
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.stroke();
          roundRectPath(ctx, 504, 68, 392, 340, 16); ctx.fill(); ctx.stroke();
          drawHouseIcon(ctx, 254, 236, 1.85, '#64748b', '#fed7aa');
          drawHouseIcon(ctx, 636, 236, 1.2, '#64748b', '#dbeafe');
          drawHouseIcon(ctx, 776, 236, 1.2, '#64748b', '#fed7aa');
          ctx.strokeStyle = accent; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(330, 210); ctx.quadraticCurveTo(470, 120, 575, 205); ctx.stroke();
          ctx.fillStyle = '#475569'; ctx.fillRect(72, 452, 160, 16);
          ctx.fillStyle = '#cbd5e1'; ctx.fillRect(72, 482, 260, 12);
        } else if (mode === 2) {
          // 命令行终端分镜板
          ctx.fillStyle = '#fcfbf7';
          ctx.fillRect(20, 20, W - 40, H - 40);
          ctx.fillStyle = '#475b74';
          roundRectPath(ctx, 110, 92, 740, 300, 22); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.font = '800 56px monospace';
          ctx.fillText('>_', 168, 224);
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          roundRectPath(ctx, 168, 276, 280, 14, 7); ctx.fill();
          roundRectPath(ctx, 472, 276, 140, 14, 7); ctx.fill();
          ctx.fillStyle = '#e2e8f0'; roundRectPath(ctx, 340, 434, 78, 34, 8); ctx.fill();
          ctx.fillStyle = accent; roundRectPath(ctx, 440, 434, 78, 34, 8); ctx.fill();
          ctx.fillStyle = '#e2e8f0'; roundRectPath(ctx, 540, 434, 78, 34, 8); ctx.fill();
        } else if (mode === 3) {
          // 声波频谱与时间轴卡
          ctx.fillStyle = '#fcfbf8';
          ctx.fillRect(20, 20, W - 40, H - 40);
          var bars = 33, bx0 = 160, gap = 20;
          for (var i = 0; i < bars; i++) {
            var u = Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2);
            var bh = (1 - u * u) * 190 * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7))) + 18;
            ctx.fillStyle = i % 3 === 0 ? accent : '#5b7290';
            roundRectPath(ctx, bx0 + i * gap, 260 - bh / 2, 9, bh, 4.5);
            ctx.fill();
          }
          ctx.fillStyle = '#cbd5e1'; ctx.fillRect(160, 420, 640, 6);
          ctx.fillStyle = accent; ctx.fillRect(160, 420, 390, 6);
          ctx.beginPath(); ctx.arc(550, 423, 12, 0, TAU); ctx.fill();
        } else {
          // 节点工作流卡片
          ctx.fillStyle = '#faf8f2';
          ctx.fillRect(20, 20, W - 40, H - 40);
          for (var c0 = 0; c0 < 3; c0++) {
            ctx.fillStyle = '#ffffff';
            roundRectPath(ctx, 92 + c0 * 272, 130, 228, 290, 16); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = accent; ctx.fillRect(114 + c0 * 272, 162, 6, 110);
            ctx.fillStyle = '#334155'; ctx.fillRect(138 + c0 * 272, 336, 120, 16);
            ctx.fillStyle = '#94a3b8'; ctx.fillRect(138 + c0 * 272, 366, 84, 12);
          }
        }
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 3;
      ctx.strokeRect(18, 18, W - 36, H - 36);
    }

    paintBase();
    var sharpTex = new T.CanvasTexture(sharpCv);
    sharpTex.colorSpace = T.SRGBColorSpace;

    var blurCv = mk('canvas'); blurCv.width = 320; blurCv.height = 192;
    var bctx = blurCv.getContext('2d');
    var blurTex = new T.CanvasTexture(blurCv);
    blurTex.colorSpace = T.SRGBColorSpace;

    function syncBlur() {
      bctx.clearRect(0, 0, 320, 192);
      try { bctx.filter = 'blur(13px)'; } catch (e) {}
      bctx.drawImage(sharpCv, 0, 0, 320, 192);
      bctx.filter = 'none';
      bctx.fillStyle = 'rgba(250, 246, 236, 0.28)';
      bctx.fillRect(0, 0, 320, 192);
      blurTex.needsUpdate = true;
    }
    syncBlur();

    if (imgEl && !imgEl.complete) {
      var p = new Promise(function (resolve) {
        var done = function () { paintBase(); sharpTex.needsUpdate = true; syncBlur(); resolve(); };
        imgEl.addEventListener('load', done, { once: true });
        imgEl.addEventListener('error', done, { once: true });
      });
      holdRender(p);
    }

    return { sharp: sharpTex, blur: blurTex };
  }

  /* 5 张竖版白瓷步骤卡贴图（792 x 1040 高清排版） */
  function createStepSlabTexture(T, item, accent) {
    var W = 792, H = 1040;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;

    function paint() {
      ctx.fillStyle = '#fcfbf9';
      ctx.fillRect(0, 0, W, H);

      // 左上角编号（左侧朱橙竖条已由 step-slab.glb 的真 3D 凸起 AccentStrip 提供，避免双线重叠）
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 44px "SF Pro Display", "Helvetica Neue", monospace';
      ctx.fillText(item.no || '01', 74, 98);

      // 中央图标 / 图像区
      var gx = 96, gy = 210, gw = 628, gh = 450;
      if (item.img && item.img.complete && item.img.naturalWidth > 0) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 10;
        roundRectPath(ctx, gx + 14, gy + 16, gw - 28, gh - 56, 14);
        ctx.fill();
        ctx.restore();

        ctx.save();
        roundRectPath(ctx, gx + 22, gy + 24, gw - 44, gh - 72, 10);
        ctx.clip();
        var iw = item.img.naturalWidth, ih = item.img.naturalHeight;
        var sc = Math.max((gw - 44) / iw, (gh - 72) / ih);
        var dw = iw * sc, dh = ih * sc;
        ctx.drawImage(item.img, gx + 22 + (gw - 44 - dw) / 2, gy + 24 + (gh - 72 - dh) / 2, dw, dh);
        ctx.restore();

        if (item.icon === 'animation') {
          ctx.strokeStyle = accent; ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(gx + 54, gy + gh - 6);
          ctx.bezierCurveTo(gx + 210, gy + gh + 36, gx + 370, gy + gh - 54, gx + gw - 54, gy + gh - 4);
          ctx.stroke();
          ctx.fillStyle = accent;
          ctx.beginPath(); ctx.arc(gx + gw - 54, gy + gh - 4, 11, 0, TAU); ctx.fill();
        }
      } else if (item.icon === 'terminal') {
        ctx.fillStyle = '#51637a';
        roundRectPath(ctx, gx + 8, gy + 26, gw - 16, 306, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 66px monospace';
        ctx.fillText('>_', gx + 62, gy + 164);
        ctx.fillStyle = 'rgba(255,255,255,0.68)';
        roundRectPath(ctx, gx + 62, gy + 228, 250, 14, 7); ctx.fill();
        roundRectPath(ctx, gx + 334, gy + 228, 120, 14, 7); ctx.fill();
        // 三枚底部小胶囊块
        var px0 = gx + 166;
        ['#e2e8f0', accent, '#e2e8f0'].forEach(function (c0, k) {
          ctx.fillStyle = c0;
          roundRectPath(ctx, px0 + k * 102, gy + 368, 82, 38, 10);
          ctx.fill();
        });
      } else if (item.icon === 'design') {
        // CAD 选区框 + 锚点 + 房屋流程图
        var bx = gx + 18, by = gy + 26, bw = gw - 36, bh = 328;
        ctx.fillStyle = '#fdfaf2';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#475b74'; ctx.lineWidth = 4;
        ctx.strokeRect(bx, by, bw, bh);
        [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]].forEach(function (pt) {
          ctx.fillStyle = '#475b74';
          ctx.fillRect(pt[0] - 8, pt[1] - 8, 16, 16);
        });
        ctx.fillStyle = accent;
        roundRectPath(ctx, bx + bw - 9, by + bh * 0.36, 18, 26, 5); ctx.fill();
        drawHouseIcon(ctx, bx + 150, by + 180, 1.45, '#64748b', '#fed7aa');
        drawHouseIcon(ctx, bx + 368, by + 186, 0.95, '#64748b', '#dbeafe');
        drawHouseIcon(ctx, bx + 478, by + 186, 0.95, '#64748b', '#fed7aa');
        ctx.strokeStyle = accent; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(bx + 210, by + 152); ctx.quadraticCurveTo(bx + 292, by + 98, bx + 356, by + 150); ctx.stroke();
        ctx.fillStyle = '#475b74'; roundRectPath(ctx, bx + 16, by + bh + 34, 240, 12, 6); ctx.fill();
        ctx.fillStyle = '#e2e8f0'; roundRectPath(ctx, bx + 16, by + bh + 58, 340, 10, 5); ctx.fill();
      } else if (item.icon === 'audio') {
        var nBars = 29, startX = gx + 36, stepX = 19.2, midY = gy + 195;
        for (var i = 0; i < nBars; i++) {
          var dCenter = Math.abs(i - (nBars - 1) / 2) / ((nBars - 1) / 2);
          var hBar = (1 - dCenter * dCenter) * 196 * (0.52 + 0.48 * Math.abs(Math.cos(i * 1.35))) + 18;
          ctx.fillStyle = i % 3 === 1 ? accent : '#5b7290';
          roundRectPath(ctx, startX + i * stepX, midY - hBar / 2, 8.5, hBar, 4.2);
          ctx.fill();
        }
        ctx.fillStyle = '#cbd5e1'; roundRectPath(ctx, gx + 36, gy + 360, gw - 72, 6, 3); ctx.fill();
        ctx.fillStyle = accent; roundRectPath(ctx, gx + 36, gy + 360, (gw - 72) * 0.56, 6, 3); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 36 + (gw - 72) * 0.56, gy + 363, 11, 0, TAU); ctx.fill();
      } else {
        // 默认封面/插画缩略预览
        var grad = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
        grad.addColorStop(0, '#fde68a'); grad.addColorStop(1, '#fed7aa');
        ctx.fillStyle = grad;
        roundRectPath(ctx, gx + 18, gy + 24, gw - 36, gh - 64, 18); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.stroke();
        ctx.save();
        ctx.translate(gx + gw / 2, gy + (gh - 40) / 2);
        ctx.rotate(-0.14);
        ctx.fillStyle = '#ffffff';
        roundRectPath(ctx, -210, -44, 420, 88, 16); ctx.fill();
        ctx.fillStyle = '#1e293b'; ctx.font = '900 42px "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(item.title || 'COVER', 0, 15);
        ctx.restore();
      }

      // 底部主标题 + 英文副标
      ctx.textAlign = 'left';
      ctx.fillStyle = '#262b38';
      ctx.font = '800 68px "PingFang SC", "HarmonyOS Sans SC", sans-serif';
      ctx.fillText(item.title || '步骤', 74, 858);

      ctx.fillStyle = '#8b92a1';
      ctx.font = '700 28px "SF Pro Display", "Helvetica Neue", monospace';
      ctx.fillText(item.sub || 'STEP', 76, 914);

      tex.needsUpdate = true;
    }

    paint();
    if (item.img && !item.img.complete) {
      var p = new Promise(function (resolve) {
        var done = function () { paint(); resolve(); };
        item.img.addEventListener('load', done, { once: true });
        item.img.addEventListener('error', done, { once: true });
      });
      holdRender(p);
    }
    return tex;
  }

  /* 3D 进度轨动态纹理 */
  function createScrubBarPainter(T, accent) {
    var cv = mk('canvas'); cv.width = 1024; cv.height = 72;
    var ctx = cv.getContext('2d');
    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    var lastP = -1;
    return {
      tex: tex,
      update: function (prog) {
        var p = clamp(prog, 0, 1);
        if (Math.abs(p - lastP) < 0.003) return;
        lastP = p;
        ctx.fillStyle = '#fcfbf8';
        ctx.fillRect(0, 0, 1024, 72);
        ctx.fillStyle = '#e2e6ee';
        roundRectPath(ctx, 28, 26, 968, 20, 10);
        ctx.fill();
        var fw = Math.max(20, 968 * p);
        ctx.fillStyle = accent;
        roundRectPath(ctx, 28, 26, fw, 20, 10);
        ctx.fill();
        tex.needsUpdate = true;
      }
    };
  }

  /* 3D 巨型白瓷碑动态纹理（含平滑生长的朱橙底线） */
  function createMonolithPainter(T, cfg, accent) {
    var W = 1908, H = 738;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    var lastKey = '';

    return {
      tex: tex,
      update: function (textAlpha, lineProg) {
        var ta = clamp(textAlpha, 0, 1), lp = clamp(lineProg, 0, 1);
        var key = ta.toFixed(3) + '|' + lp.toFixed(3);
        if (key === lastKey) return;
        lastKey = key;

        ctx.fillStyle = '#fdfcf9';
        ctx.fillRect(0, 0, W, H);

        if (ta > 0.01) {
          ctx.save();
          ctx.globalAlpha = ta;
          var x0 = 118;

          // Kicker (e.g. GitHub)
          ctx.fillStyle = '#5a6578';
          ctx.font = '700 54px "SF Pro Display", "PingFang SC", sans-serif';
          ctx.fillText(cfg.kicker || 'GitHub', x0, 152);

          // Main Title (e.g. Table-VideoSOP)
          ctx.fillStyle = '#232733';
          ctx.font = '800 124px "SF Pro Display", "PingFang SC", sans-serif';
          ctx.fillText(cfg.title || 'motion-lib', x0, 304);

          // Subtitle / Slug
          ctx.fillStyle = '#687082';
          ctx.font = '500 44px "SF Pro Display", "PingFang SC", sans-serif';
          ctx.fillText(cfg.sub || 'honestTai / motion-lib', x0, 386);

          // Bottom Slogan
          ctx.fillStyle = '#373d4b';
          ctx.font = '600 62px "PingFang SC", "HarmonyOS Sans SC", sans-serif';
          ctx.fillText(cfg.line || '从想法，到成片。', x0, 566);
          ctx.restore();
        }

        if (lp > 0.005) {
          ctx.fillStyle = accent;
          roundRectPath(ctx, 118, 616, Math.max(12, 1080 * lp), 9, 4.5);
          ctx.fill();
        }
        tex.needsUpdate = true;
      }
    };
  }

  /* 3D 立体圆角胶囊标签（SOP / 规则 / 经验 / 使用方法 / 提示词） */
  function createTagPill3D(T, text, accent, widthWorld, heightWorld) {
    var w = widthWorld || 1.72, h = heightWorld || 0.46;
    var group = new T.Group();
    var shape = makeRoundedRectShape(T, w, h, 0.09);
    var geo = new T.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 });
    geo.translate(0, 0, -0.028);
    var bodyMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.02, transparent: true, opacity: 1 });
    group.add(new T.Mesh(geo, bodyMat));

    var cv = mk('canvas'); cv.width = 512; cv.height = 140;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 140);
    ctx.fillStyle = accent; roundRectPath(ctx, 34, 28, 8, 84, 4); ctx.fill();
    ctx.fillStyle = '#4b5565';
    ctx.font = '700 54px "PingFang SC", "HarmonyOS Sans SC", sans-serif';
    ctx.fillText(text, 66, 89);

    var tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace;
    var faceMat = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, toneMapped: false });
    var face = new T.Mesh(new T.PlaneGeometry(w * 0.96, h * 0.92), faceMat);
    face.position.z = 0.041;
    group.add(face);

    return {
      group: group,
      setOpacity: function (a) {
        a = clamp(a, 0, 1);
        group.visible = a > 0.004;
        bodyMat.opacity = a; faceMat.opacity = a;
        bodyMat.depthWrite = a > 0.88; faceMat.depthWrite = a > 0.88;
      }
    };
  }

  /* 3D 橙色圆管曲线构造器（支持按 0..1 进度动态生长） */
  function createTubeArc(T, points, radius, hex) {
    var curve = new T.CatmullRomCurve3(points);
    var tubularSegments = 72, radialSegments = 10;
    var geo = new T.TubeGeometry(curve, tubularSegments, radius || 0.024, radialSegments, false);
    var totalIndices = geo.index ? geo.index.count : tubularSegments * radialSegments * 6;
    var mat = new T.MeshStandardMaterial({
      color: new T.Color(hex || '#ea580c'),
      emissive: new T.Color(hex || '#ea580c'),
      emissiveIntensity: 0.22,
      roughness: 0.32,
      metalness: 0.08,
      transparent: true,
      opacity: 1
    });
    var mesh = new T.Mesh(geo, mat);
    geo.setDrawRange(0, 0);
    return {
      curve: curve,
      mesh: mesh,
      mat: mat,
      total: totalIndices,
      setProgress: function (prog, alpha) {
        var p = clamp(prog, 0, 1), a = alpha === undefined ? 1 : clamp(alpha, 0, 1);
        if (p <= 0.002 || a <= 0.004) { mesh.visible = false; return; }
        mesh.visible = true;
        var count = Math.floor((totalIndices / 6) * p) * 6;
        geo.setDrawRange(0, Math.max(6, count));
        mat.opacity = a;
      }
    };
  }

  /* CAD 8 锚点三维选区线框（第 2 拍英雄框侧旋剥离的标志性细节） */
  function createCADWireframe(T, w, h) {
    var group = new T.Group();
    var pts = [
      new T.Vector3(-w / 2, -h / 2, 0), new T.Vector3(w / 2, -h / 2, 0),
      new T.Vector3(w / 2, -h / 2, 0), new T.Vector3(w / 2, h / 2, 0),
      new T.Vector3(w / 2, h / 2, 0), new T.Vector3(-w / 2, h / 2, 0),
      new T.Vector3(-w / 2, h / 2, 0), new T.Vector3(-w / 2, -h / 2, 0)
    ];
    var lineGeo = new T.BufferGeometry().setFromPoints(pts);
    var lineMat = new T.LineBasicMaterial({ color: 0x525b6c, transparent: true, opacity: 0.85 });
    group.add(new T.LineSegments(lineGeo, lineMat));

    var handleMat = new T.MeshBasicMaterial({ color: 0x525b6c, transparent: true, opacity: 0.9 });
    var hGeo = new T.BoxGeometry(0.055, 0.055, 0.02);
    var anchors = [
      [-w / 2, -h / 2], [0, -h / 2], [w / 2, -h / 2],
      [w / 2, 0], [w / 2, h / 2], [0, h / 2],
      [-w / 2, h / 2], [-w / 2, 0]
    ];
    anchors.forEach(function (a) {
      var m = new T.Mesh(hGeo, handleMat);
      m.position.set(a[0], a[1], 0);
      group.add(m);
    });

    return {
      group: group,
      setOpacity: function (a) {
        a = clamp(a, 0, 1);
        group.visible = a > 0.005;
        lineMat.opacity = a * 0.82;
        handleMat.opacity = a * 0.92;
      }
    };
  }

  /* ═════════════════════ 核心展厅舞台构造器 ═════════════════════ */

  function initGalleryStage(el, presetMode) {
    if (el.__g3d) return el.__g3d;
    var T = g.THREE;
    if (!T) throw new Error('fx-gallery3d：请先加载 vendor/three-fx.min.js');
    ensureGLBTemplates(T);

    var W = el.offsetWidth || 1920, H = el.offsetHeight || 1080;
    var accent = attr(el, 'accent', '#ea580c');
    var mode = presetMode || attr(el, 'mode', 'combo');
    var seed = num(attr(el, 'seed'), 505);

    // 解析子元素：图片素材与步骤卡片
    var rawKids = kidsOf(el);
    var imgs = [];
    var stepDefs = [];
    var heroSrc = attr(el, 'hero', '');

    rawKids.forEach(function (ch) {
      if (ch.tagName === 'IMG') {
        imgs.push(ch);
      } else if (ch.classList.contains('step-item') || ch.hasAttribute('data-no') || ch.hasAttribute('data-title')) {
        var subImg = ch.querySelector ? ch.querySelector('img') : null;
        var srcAttr = attr(ch, 'src', '');
        if (!subImg && srcAttr) { subImg = mk('img'); subImg.src = srcAttr; }
        if (subImg) imgs.push(subImg);
        stepDefs.push({
          no: attr(ch, 'no', String(stepDefs.length + 1).padStart(2, '0')),
          title: attr(ch, 'title', (ch.textContent || '').trim() || ('步骤 ' + (stepDefs.length + 1))),
          sub: attr(ch, 'sub', 'STEP ' + (stepDefs.length + 1)),
          icon: attr(ch, 'icon', ''),
          img: subImg
        });
      }
      ch.style.display = 'none';
      ch.setAttribute('data-lint', 'off');
    });

    var heroImg = null;
    if (heroSrc) { heroImg = mk('img'); heroImg.src = heroSrc; }
    else if (imgs.length) heroImg = imgs[0];

    var defaultIcons = ['terminal', 'design', 'animation', 'audio', 'cover'];
    var defaultTitles = [
      ['01', '工具选择', 'TOOLS'],
      ['02', '画面设计', 'DESIGN'],
      ['03', '动画制作', 'ANIMATION'],
      ['04', '声音', 'AUDIO'],
      ['05', '封面', 'COVER']
    ];
    if (!stepDefs.length) {
      defaultTitles.forEach(function (d0, idx) {
        stepDefs.push({
          no: d0[0], title: d0[1], sub: d0[2],
          icon: defaultIcons[idx],
          img: idx === 2 && heroImg ? heroImg : (imgs[idx] || null)
        });
      });
    } else {
      stepDefs.forEach(function (sd, idx) {
        if (!sd.icon) sd.icon = defaultIcons[idx % defaultIcons.length];
      });
    }

    el.classList.add('fx-gallery3d');
    el.setAttribute('data-lint', 'content');

    // WebGL 渲染器
    var dpr = clamp(num(attr(el, 'dpr'), 1.5), 1, 2);
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    if (T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
    if (T.ACESFilmicToneMapping) {
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
    }
    renderer.setClearColor(0x000000, 0);
    el.insertBefore(renderer.domElement, el.firstChild);

    // 顶部展厅栏眉 HUD + 左侧英雄标题 + 章节眉题 DOM 层
    var hudStr = attr(el, 'brand', '');
    if (hudStr !== 'off') {
      var parts = (hudStr || 'STUDIO GALLERY|FROM IDEA TO FRAME').split('|');
      var epTxt = attr(el, 'ep', 'EPISODE 05');
      var hud = mk('div', 'fx-gallery-hud');
      hud.setAttribute('data-lint', 'off');
      hud.innerHTML = '<div class="fx-gallery-hud-l"><b>' + (parts[0] || '') + '</b>' +
        (parts[1] ? '<span>' + parts[1] + '</span>' : '') + '</div>' +
        '<div class="fx-gallery-hud-r">' + epTxt + '</div>';
      el.appendChild(hud);
    }

    var heroCopy = mk('div', 'fx-gallery-hero-copy');
    var hKick = attr(el, 'kicker', attr(el, 'ep', 'EPISODE 05'));
    var hTitleRaw = attr(el, 'title', '我是怎么用|AI 做视频的.');
    var hLines = hTitleRaw.split('|').map(function (ln) {
      return ln.replace(/([.。!！])$/, '<em>$1</em>');
    }).join('<br>');
    heroCopy.innerHTML = '<span class="kicker" data-lint="off">' + hKick + '</span>' +
      '<h2>' + hLines + '</h2><div class="rule"></div>';
    heroCopy.style.opacity = '0';
    heroCopy.style.visibility = 'hidden';
    el.appendChild(heroCopy);

    var flowHead = mk('div', 'fx-gallery-sec-head');
    var fParts = attr(el, 'flow-title', '完整的制作流程.|FROM IDEA TO FRAME').split('|');
    flowHead.innerHTML = '<h3>' + (fParts[0] || '').replace(/([.。])$/, '<em>$1</em>') + '</h3>' +
      (fParts[1] ? '<span data-lint="off">' + fParts[1] + '</span>' : '');
    flowHead.style.opacity = '0';
    flowHead.style.visibility = 'hidden';
    el.appendChild(flowHead);

    var openHead = mk('div', 'fx-gallery-sec-head');
    var oParts = attr(el, 'open-title', '开源了。|OPEN SOURCE').split('|');
    openHead.innerHTML = '<h3>' + (oParts[0] || '').replace(/([.。])$/, '<em>$1</em>') + '</h3>' +
      (oParts[1] ? '<span data-lint="off">' + oParts[1] + '</span>' : '');
    openHead.style.opacity = '0';
    openHead.style.visibility = 'hidden';
    el.appendChild(openHead);

    // Three.js 场景与暖白无影棚灯光
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(44, W / H, 0.1, 160);

    scene.add(new T.HemisphereLight(0xfffdf9, 0xd8dbe2, 1.48));
    var keyLight = new T.DirectionalLight(0xfffcf5, 1.35);
    keyLight.position.set(-3.8, 7.2, 8.4);
    scene.add(keyLight);
    var rimLight = new T.DirectionalLight(0xeef3ff, 0.62);
    rimLight.position.set(5.6, 3.4, 4.2);
    scene.add(rimLight);
    var bounceLight = new T.DirectionalLight(0xfff4e8, 0.36);
    bounceLight.position.set(0, -4.0, 5.5);
    scene.add(bounceLight);

    var rand = FX.rand(seed);

    /* ── 0. 远景常驻柔焦画廊背景层（提供全程三维视差与空气景深） ── */
    var bokehGroup = new T.Group();
    scene.add(bokehGroup);
    var texPool = [];
    for (var ti = 0; ti < 6; ti++) {
      texPool.push(createGalleryCardTextures(T, ti, imgs[ti % Math.max(1, imgs.length)] || null, accent));
    }
    var heroTexPair = createGalleryCardTextures(T, 0, heroImg, accent);

    var bokehSpots = [
      [-6.8, 1.5, -7.8, 0.95], [-3.4, 1.9, -9.2, 0.86], [0.4, 2.0, -9.8, 0.82],
      [4.1, 1.6, -8.8, 0.90], [7.4, 1.1, -7.4, 0.98], [-5.2, 0.2, -8.4, 0.85],
      [5.8, 0.1, -8.2, 0.88], [9.8, 1.3, -8.6, 0.92]
    ];
    var bokehMeshes = bokehSpots.map(function (sp, idx) {
      var mat = new T.MeshBasicMaterial({
        map: texPool[idx % texPool.length].blur,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        toneMapped: false
      });
      var m = new T.Mesh(new T.PlaneGeometry(3.1 * sp[3], 1.88 * sp[3]), mat);
      m.position.set(sp[0], sp[1], sp[2]);
      bokehGroup.add(m);
      return { mesh: m, mat: mat, baseY: sp[1], ph: idx * 1.1 };
    });

    /* ── 1. 走廊画框组 + 中央英雄画框 + 分层玻璃背板 + CAD 线框 + 3D 进度轨 ── */
    var corridorGroup = new T.Group();
    scene.add(corridorGroup);

    var nCorridor = clamp(num(attr(el, 'corridor-count'), 20), 8, 28);
    var corridorFrames = [];
    for (var ci = 0; ci < nCorridor; ci++) {
      var side = ci % 2 === 0 ? -1 : 1;
      var tier = ci % 3;
      var zPos = 1.6 + (ci / (nCorridor - 1)) * 11.4;
      var xPos = side * (2.35 + (tier === 1 ? 1.35 : tier === 2 ? 0.55 : 2.15) + (rand() - 0.5) * 0.45);
      var yPos = tier === 0 ? -0.58 + rand() * 0.35 : tier === 1 ? 0.65 + rand() * 0.55 : 1.78 + rand() * 0.45;
      if (ci % 5 === 4) { xPos = (rand() - 0.5) * 2.6; yPos = 1.95 + rand() * 0.45; }
      var pair = texPool[(ci + 1) % texPool.length];
      var rig = instantiateRigModel(T, 'frame', pair.sharp, accent);
      var sc0 = 0.72 + rand() * 0.32;
      rig.group.position.set(xPos, yPos, zPos);
      rig.group.scale.setScalar(sc0);
      rig.group.rotation.y = -side * (0.04 + rand() * 0.08);
      corridorGroup.add(rig.group);
      var shd = makeFloorShadow(T, 2.9 * sc0, 0.9 * sc0);
      corridorGroup.add(shd.mesh);
      corridorFrames.push({
        rig: rig, pair: pair, shadow: shd,
        x0: xPos, y0: yPos, z0: zPos, sc0: sc0, ry0: rig.group.rotation.y, blurred: false
      });
    }

    // 中央英雄画框总成
    var heroRig = instantiateRigModel(T, 'frame', heroTexPair.sharp, accent);
    var heroShadow = makeFloorShadow(T, 3.3, 1.05);
    scene.add(heroRig.group);
    scene.add(heroShadow.mesh);

    // 侧旋剥离的半透明磨砂玻璃背板（2 层）+ 8 锚点 CAD 选区框 + 3D 进度轨
    var heroExtras = new T.Group();
    scene.add(heroExtras);
    var glassPlates = [0, 1].map(function (gi) {
      var gm = new T.MeshPhysicalMaterial ? new T.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.25, metalness: 0.05, transparent: true, opacity: 0, depthWrite: false
      }) : new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      var gp = new T.Mesh(new T.BoxGeometry(3.16, 1.96, 0.03), gm);
      heroExtras.add(gp);
      return { mesh: gp, mat: gm, idx: gi + 1 };
    });
    var cadBox = createCADWireframe(T, 2.96, 1.78);
    heroExtras.add(cadBox.group);

    var scrubPainter = createScrubBarPainter(T, accent);
    var scrubRig = instantiateRigModel(T, 'scrub', scrubPainter.tex, accent);
    var scrubShadow = makeFloorShadow(T, 3.0, 0.55);
    scene.add(scrubRig.group);
    scene.add(scrubShadow.mesh);

    /* ── 2. 5 张 3D 竖版白瓷步骤卡 + 底部三维朱橙跳线与发光领跑球 ── */
    var stepsGroup = new T.Group();
    scene.add(stepsGroup);
    var nSteps = stepDefs.length;
    var stepSpacing = 2.46;
    var stepStartX = -((nSteps - 1) * stepSpacing) / 2;

    var stepCards = stepDefs.map(function (sd, idx) {
      var tex = createStepSlabTexture(T, sd, accent);
      var rig = instantiateRigModel(T, 'step', tex, accent);
      var shd = makeFloorShadow(T, 2.25, 0.92);
      stepsGroup.add(rig.group);
      stepsGroup.add(shd.mesh);
      return {
        rig: rig, shadow: shd, idx: idx,
        baseX: stepStartX + idx * stepSpacing,
        topX: (-((nSteps - 1) * 1.02) / 2) + idx * 1.02
      };
    });

    // 相邻步骤卡底部的三维橙色悬链跳线 + 领跑发光圆球
    var stepArcs = [];
    for (var ai = 0; ai < nSteps - 1; ai++) {
      var xA = stepStartX + ai * stepSpacing;
      var xB = stepStartX + (ai + 1) * stepSpacing;
      var yBot = -1.32;
      var ptsArc = [
        new T.Vector3(xA + 0.06, yBot, 0.06),
        new T.Vector3(lerp(xA, xB, 0.28), yBot - 0.34, 0.16),
        new T.Vector3(lerp(xA, xB, 0.72), yBot - 0.34, 0.16),
        new T.Vector3(xB - 0.06, yBot, 0.06)
      ];
      var arcObj = createTubeArc(T, ptsArc, 0.024, accent);
      stepsGroup.add(arcObj.mesh);
      stepArcs.push(arcObj);
    }

    var orbGroup = new T.Group();
    var orbMesh = new T.Mesh(
      new T.SphereGeometry(0.078, 24, 16),
      new T.MeshStandardMaterial({ color: new T.Color(accent), emissive: new T.Color(accent), emissiveIntensity: 0.42, roughness: 0.25 })
    );
    var orbHalo = new T.Sprite(new T.SpriteMaterial({ map: getGlowTexture(T, accent), transparent: true, opacity: 0.7, depthWrite: false }));
    orbHalo.scale.set(0.42, 0.42, 1);
    orbGroup.add(orbMesh);
    orbGroup.add(orbHalo);
    orbGroup.visible = false;
    stepsGroup.add(orbGroup);

    /* ── 3. 第 5 拍：树状引线 + 顶部/底部胶囊签 + 3D 巨型白瓷碑 ── */
    var monolithStage = new T.Group();
    scene.add(monolithStage);

    var topTagsRaw = attr(el, 'tags', 'SOP,规则,经验').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var botTagsRaw = attr(el, 'sub-tags', '使用方法,提示词').split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    var topPills = topTagsRaw.map(function (label, idx) {
      var pill = createTagPill3D(T, label, accent, 1.54, 0.36);
      var tx = (-((topTagsRaw.length - 1) * 2.16) / 2) + idx * 2.16;
      pill.group.position.set(tx, 1.18, 0.05);
      monolithStage.add(pill.group);
      return { pill: pill, x: tx, y: 1.18 };
    });

    var botPills = botTagsRaw.map(function (label, idx) {
      var pill = createTagPill3D(T, label, accent, 1.58, 0.35);
      var bx = (-((botTagsRaw.length - 1) * 2.40) / 2) + idx * 2.40;
      pill.group.position.set(bx, -2.02, 0.10);
      monolithStage.add(pill.group);
      return { pill: pill, x: bx, y: -2.02 };
    });

    // 上层缩小后的 5 卡底弧 + 汇入 3 枚胶囊签的橙色树状引线 + 汇入巨碑的引线
    var upperMiniArcs = [];
    for (var mi = 0; mi < nSteps - 1; mi++) {
      var mxA = (-((nSteps - 1) * 1.02) / 2) + mi * 1.02;
      var mxB = (-((nSteps - 1) * 1.02) / 2) + (mi + 1) * 1.02;
      var mArc = createTubeArc(T, [
        new T.Vector3(mxA, 1.68, 0.02),
        new T.Vector3(lerp(mxA, mxB, 0.5), 1.52, 0.04),
        new T.Vector3(mxB, 1.68, 0.02)
      ], 0.014, accent);
      monolithStage.add(mArc.mesh);
      upperMiniArcs.push(mArc);
    }

    var treeMidArcs = topPills.map(function (tp) {
      var a1 = createTubeArc(T, [
        new T.Vector3(tp.x * 0.80, 1.56, 0.03),
        new T.Vector3(tp.x * 0.92, 1.46, 0.04),
        new T.Vector3(tp.x, 1.37, 0.05)
      ], 0.015, accent);
      var a2 = createTubeArc(T, [
        new T.Vector3(tp.x, 0.99, 0.05),
        new T.Vector3(tp.x * 0.88, 0.85, 0.06),
        new T.Vector3(tp.x * 0.72, 0.72, 0.07)
      ], 0.016, accent);
      monolithStage.add(a1.mesh);
      monolithStage.add(a2.mesh);
      return { up: a1, down: a2 };
    });

    var treeBotArcs = botPills.map(function (bp) {
      var ab = createTubeArc(T, [
        new T.Vector3(bp.x * 0.76, -1.62, 0.08),
        new T.Vector3(bp.x * 0.90, -1.73, 0.09),
        new T.Vector3(bp.x + 0.08, -1.84, 0.10)
      ], 0.015, accent);
      monolithStage.add(ab.mesh);
      return ab;
    });

    var monoPainter = createMonolithPainter(T, {
      kicker: attr(el, 'repo-kicker', 'GitHub'),
      title: attr(el, 'repo-title', 'Table-VideoSOP'),
      sub: attr(el, 'repo-sub', 'duoduoler-ops / Table-VideoSOP'),
      line: attr(el, 'repo-line', '从想法，到成片。')
    }, accent);
    var monoRig = instantiateRigModel(T, 'monolith', monoPainter.tex, accent);
    var monoShadow = makeFloorShadow(T, 6.9, 1.55);
    monolithStage.add(monoRig.group);
    monolithStage.add(monoShadow.mesh);

    var G = {
      el: el, T: T, W: W, H: H, mode: mode, accent: accent,
      renderer: renderer, scene: scene, cam: cam,
      heroCopy: heroCopy, flowHead: flowHead, openHead: openHead,
      bokehMeshes: bokehMeshes,
      corridorGroup: corridorGroup, corridorFrames: corridorFrames,
      heroRig: heroRig, heroTexPair: heroTexPair, heroShadow: heroShadow,
      heroExtras: heroExtras, glassPlates: glassPlates, cadBox: cadBox,
      scrubRig: scrubRig, scrubPainter: scrubPainter, scrubShadow: scrubShadow,
      stepsGroup: stepsGroup, stepCards: stepCards, stepArcs: stepArcs,
      orbGroup: orbGroup, stepSpacing: stepSpacing, stepStartX: stepStartX,
      monolithStage: monolithStage, topPills: topPills, botPills: botPills,
      upperMiniArcs: upperMiniArcs, treeMidArcs: treeMidArcs, treeBotArcs: treeBotArcs,
      monoRig: monoRig, monoPainter: monoPainter, monoShadow: monoShadow,
      beats: {}, cams: [], driver: false, sceneStart: 0, sceneDur: 5
    };

    GLB_LISTENERS.push(function () { renderGallery(G, G.lastLt || 0); });
    el.__g3d = G;
    renderGallery(G, 0);
    return G;
  }

  /* ═════════════════════ 纯函数逐帧解算器 renderGallery(G, lt) ═════════════════════ */

  function setDomOverlay(el, alpha, dx, dy) {
    var a = clamp(alpha, 0, 1);
    if (a <= 0.01) {
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      return;
    }
    el.style.visibility = 'visible';
    el.style.opacity = a.toFixed(3);
    el.style.transform = 'translate3d(' + (dx || 0).toFixed(1) + 'px,' + (dy || 0).toFixed(1) + 'px,0)';
  }

  function renderGallery(G, lt) {
    G.lastLt = lt;
    var B = G.beats;

    // 读取各拍进度（允许单拍独立使用，也允许五连拍无缝衔接）
    var bFly = B.fly;
    var bHero = B.hero;
    var bTrack = B.track;
    var bOver = B.overview;
    var bMono = B.monolith;

    // 预设模式默认补齐对应主拍，保证空 data-fx 时也有饱满初始画面
    if (!bFly && !bHero && !bTrack && !bOver && !bMono) {
      if (G.mode === 'steps') bTrack = { t0: 0, dur: G.sceneDur };
      else if (G.mode === 'monolith') bMono = { t0: 0, dur: G.sceneDur };
      else bFly = { t0: 0, dur: G.sceneDur };
    }

    var uFly = bFly ? clamp((lt - bFly.t0) / Math.max(0.05, bFly.dur), 0, 1) : (G.mode === 'steps' || G.mode === 'monolith' ? 1 : 0);
    var uHero = bHero ? clamp((lt - bHero.t0) / Math.max(0.05, bHero.dur), 0, 1) : 0;
    var uTrack = bTrack ? clamp((lt - bTrack.t0) / Math.max(0.05, bTrack.dur), 0, 1) : (G.mode === 'monolith' ? 1 : 0);
    var uOver = bOver ? clamp((lt - bOver.t0) / Math.max(0.05, bOver.dur), 0, 1) : 0;
    var uMono = bMono ? clamp((lt - bMono.t0) / Math.max(0.05, bMono.dur), 0, 1) : 0;

    var hasIntroPhase = Boolean(bFly || bHero);
    var activeSteps = (bTrack && lt >= bTrack.t0 - 0.15) || (bOver && lt >= bOver.t0 - 0.15) || (bMono && lt >= bMono.t0 - 0.15) || G.mode === 'steps' || G.mode === 'monolith';
    var stepFadeIn = !activeSteps ? 0 : (!hasIntroPhase ? 1 : (bTrack ? smooth01((lt - (bTrack.t0 - 0.15)) / 0.45) : 1));
    var heroExit = !hasIntroPhase ? 1 : (bTrack ? smooth01((lt - (bTrack.t0 - 0.15)) / 0.55) : (bMono && lt >= bMono.t0 - 0.15 ? smooth01((lt - (bMono.t0 - 0.15)) / 0.45) : 0));

    /* ── 1. 摄影机轨迹合成 ── */
    var camX = 0, camY = 0.08, camZ = 5.2, lookX = 0, lookY = 0.06, lookZ = 0, fov = 42;

    if (bFly || (!activeSteps && !bHero)) {
      var eFly = easeInOutCubic(uFly);
      camZ = lerp(13.8, 5.15, eFly);
      camY = lerp(0.18, 0.06, eFly);
      lookY = lerp(0.24, 0.05, eFly);
      fov = lerp(50, 41, eFly);
    }

    if (bHero && lt >= bHero.t0) {
      var eH = smoother01(clamp(uHero * 1.35, 0, 1));
      camX = lerp(camX, 0.32, eH);
      camZ = lerp(camZ, 5.55, eH);
      lookX = lerp(lookX, 0.25, eH);
      fov = lerp(fov, 40, eH);
    }

    if (activeSteps) {
      var nS = G.stepCards.length;
      var trackSpan = Math.max(0, (nS - 1) * G.stepSpacing);
      var xFirst = G.stepStartX + 0.85;
      var xLast = G.stepStartX + trackSpan - 0.85;
      var eTr = smoother01(uTrack);
      var trackCamX = nS > 2 ? lerp(xFirst, xLast, eTr) : 0;
      var trackCamZ = 5.42;

      camX = lerp(camX, trackCamX, stepFadeIn);
      camY = lerp(camY, 0.04, stepFadeIn);
      camZ = lerp(camZ, trackCamZ, stepFadeIn);
      lookX = lerp(lookX, trackCamX - 0.12, stepFadeIn);
      lookY = lerp(lookY, -0.02, stepFadeIn);
      fov = lerp(fov, 40, stepFadeIn);
    }

    if (bOver && lt >= bOver.t0) {
      var eOv = smoother01(clamp(uOver * 1.3, 0, 1));
      camX = lerp(camX, 0, eOv);
      camY = lerp(camY, 0.16, eOv);
      camZ = lerp(camZ, 11.65, eOv);
      lookX = lerp(lookX, 0, eOv);
      lookY = lerp(lookY, -0.04, eOv);
      fov = lerp(fov, 38, eOv);
    }

    if (bMono && lt >= bMono.t0) {
      var eMo = smoother01(clamp(uMono * 1.4, 0, 1));
      camX = lerp(camX, 0, eMo);
      camY = lerp(camY, 0.24, eMo);
      camZ = lerp(camZ, 9.35, eMo);
      lookX = lerp(lookX, 0, eMo);
      lookY = lerp(lookY, 0.10, eMo);
      fov = lerp(fov, 39, eMo);
    }

    // 自定义镜头覆盖段（gallery-cam3d）
    for (var ci = 0; ci < G.cams.length; ci++) {
      var seg = G.cams[ci];
      if (lt >= seg.t0) {
        var uc = smoother01(clamp((lt - seg.t0) / Math.max(0.05, seg.dur), 0, 1));
        if (seg.x !== undefined) camX = lerp(camX, seg.x, uc);
        if (seg.y !== undefined) camY = lerp(camY, seg.y, uc);
        if (seg.z !== undefined) camZ = lerp(camZ, seg.z, uc);
        if (seg.lx !== undefined) lookX = lerp(lookX, seg.lx, uc);
        if (seg.ly !== undefined) lookY = lerp(lookY, seg.ly, uc);
        if (seg.fov !== undefined) fov = lerp(fov, seg.fov, uc);
      }
    }

    G.cam.position.set(camX, camY, camZ);
    G.cam.lookAt(lookX, lookY, lookZ);
    if (Math.abs(G.cam.fov - fov) > 0.01) {
      G.cam.fov = fov;
      G.cam.updateProjectionMatrix();
    }

    /* ── 2. 远景常驻柔焦画廊微漂移 ── */
    G.bokehMeshes.forEach(function (bm) {
      bm.mesh.position.y = bm.baseY + Math.sin(lt * 0.55 + bm.ph) * 0.06;
      bm.mat.opacity = 0.24 + 0.06 * (1 - heroExit);
    });

    /* ── 3. 第 1 & 2 拍：画廊长廊穿梭 + 英雄框侧旋分层 ── */
    var corrVis = (1 - heroExit) * (bHero && lt >= bHero.t0 ? lerp(1, 0.16, smooth01(uHero * 1.8)) : 1);
    G.corridorGroup.visible = corrVis > 0.01;
    if (G.corridorGroup.visible) {
      G.corridorFrames.forEach(function (cf, idx) {
        var dz = camZ - cf.z0;
        var nearFade = smooth01((dz - 0.65) / 1.55);
        var shouldBlur = dz < 3.6 || dz > 9.4 || (bHero && lt > bHero.t0 + 0.12);
        if (shouldBlur !== cf.blurred) {
          cf.blurred = shouldBlur;
          cf.rig.setTexture(shouldBlur ? cf.pair.blur : cf.pair.sharp);
        }
        var fy = cf.y0 + Math.sin(lt * 0.9 + idx * 0.7) * 0.04;
        cf.rig.group.position.set(cf.x0, fy, cf.z0);
        var op = corrVis * nearFade;
        cf.rig.setOpacity(op);
        cf.shadow.sync(cf.x0, fy, cf.z0, 0.22, op * (cf.y0 < 1.1 ? 1 : 0.45));
      });
    }

    var heroVis = 1 - heroExit;
    if (heroVis > 0.005) {
      var splitU = bHero ? outBack(clamp(uHero * 1.45, 0, 1), 1.15) : 0;
      var hx = lerp(0, 1.58, splitU) + heroExit * 2.2;
      var hy = lerp(0.06, 0.14, splitU);
      var hz = lerp(0, 0.08, splitU) - heroExit * 1.4;
      var hry = lerp(0, -14.5 * DEG, splitU);
      var hrx = lerp(0, 3.2 * DEG, splitU);
      var hsc = lerp(0.92, 1.0, smooth01(uFly * 1.25)) * lerp(1.0, 0.94, splitU);

      G.heroRig.group.position.set(hx, hy, hz);
      G.heroRig.group.rotation.set(hrx, hry, 0);
      G.heroRig.group.scale.setScalar(hsc);
      G.heroRig.setOpacity(heroVis);
      G.heroShadow.sync(hx, hy - 0.95, hz, 0.34, heroVis);

      // 分层玻璃背板 + CAD 8 锚点选区框 + 3D 进度轨
      var exAlpha = heroVis * smooth01((uHero - 0.08) / 0.38);
      G.heroExtras.visible = exAlpha > 0.005;
      if (G.heroExtras.visible) {
        G.heroExtras.position.set(hx, hy, hz);
        G.heroExtras.rotation.set(hrx, hry, 0);
        G.glassPlates.forEach(function (gp) {
          var k = gp.idx;
          gp.mesh.position.set(k * 0.24 * splitU, -k * 0.04 * splitU, -k * 0.22 * splitU);
          gp.mat.opacity = exAlpha * (0.34 - k * 0.09);
        });
        G.cadBox.group.position.set(0.56 * splitU, -0.02, 0.12 * splitU);
        G.cadBox.setOpacity(exAlpha);
      }

      var scrubIn = heroVis * smooth01((uHero - 0.14) / 0.36);
      G.scrubRig.group.position.set(hx - 0.06, hy - 1.24 - (1 - scrubIn) * 0.22, hz + 0.16);
      G.scrubRig.group.rotation.set(hrx * 0.6, hry * 0.85, 0);
      G.scrubRig.setOpacity(scrubIn);
      G.scrubPainter.update(clamp((uHero - 0.18) / 0.72, 0, 0.76));
      G.scrubShadow.sync(hx - 0.06, FLOOR_Y + 0.35, hz + 0.16, 0.22, scrubIn);

      // 左侧大标题 DOM
      var copyAlpha = heroVis * smooth01((uHero - 0.06) / 0.36);
      setDomOverlay(G.heroCopy, copyAlpha, 0, (1 - copyAlpha) * 24);
      var ruleEl = G.heroCopy.querySelector('.rule');
      if (ruleEl) ruleEl.style.transform = 'scaleX(' + clamp((uHero - 0.18) / 0.48, 0, 1).toFixed(3) + ')';
    } else {
      G.heroRig.setOpacity(0);
      G.heroShadow.sync(0, 0, 0, 0, 0);
      G.heroExtras.visible = false;
      G.scrubRig.setOpacity(0);
      G.scrubShadow.sync(0, 0, 0, 0, 0);
      setDomOverlay(G.heroCopy, 0, 0, 0);
    }

    /* ── 4. 第 3 & 4 & 5 拍：5 张 3D 竖版白瓷卡 + 橙色跳线传导 + 上移归档 ── */
    G.stepsGroup.visible = stepFadeIn > 0.005;
    if (G.stepsGroup.visible) {
      var monoLift = bMono && lt >= bMono.t0 ? smoother01(clamp(uMono * 1.65, 0, 1)) : (G.mode === 'monolith' ? 1 : 0);
      var nCards = G.stepCards.length;

      G.stepCards.forEach(function (sc, idx) {
        var revealStart = nCards > 1 ? (idx / nCards) * 0.68 : 0;
        var cardProg = G.mode === 'monolith' ? 1 : clamp((uTrack - revealStart) / 0.28, 0, 1);
        var eCard = outBack(cardProg, 1.2);

        var sx = lerp(sc.baseX, sc.topX, monoLift);
        var sy = lerp(0.08 - (1 - eCard) * 0.32, 2.16, monoLift);
        var sz = lerp(-(1 - eCard) * 0.55, 0, monoLift);
        var sScale = lerp(1.0, 0.34, monoLift);
        var sRy = lerp((1 - eCard) * 26 * DEG - 3.5 * DEG, 0, monoLift);
        var sRx = lerp((1 - eCard) * 8 * DEG + 1.5 * DEG, 0, monoLift);
        var cAlpha = stepFadeIn * smooth01(cardProg * 1.6);

        sc.rig.group.position.set(sx, sy, sz);
        sc.rig.group.rotation.set(sRx, sRy, 0);
        sc.rig.group.scale.setScalar(sScale);
        sc.rig.setOpacity(cAlpha);
        sc.shadow.sync(sx, sy - 1.15 * sScale, sz, 0.28 * (1 - monoLift * 0.85), cAlpha * (1 - monoLift));
      });

      // 底部橙色跳线与领跑发光球
      var nArcs = G.stepArcs.length;
      var arcFadeOut = 1 - smooth01(monoLift * 2.2);
      var orbActive = false;
      for (var ai = 0; ai < nArcs; ai++) {
        var aStart = (ai + 0.18) / Math.max(1, nArcs + 0.25);
        var aDur = 0.78 / Math.max(1, nArcs + 0.25);
        var ap = G.mode === 'monolith' ? 1 : easeOutCubic(clamp((uTrack - aStart) / aDur, 0, 1));
        G.stepArcs[ai].setProgress(ap, stepFadeIn * arcFadeOut);
        if (ap > 0.02 && ap < 0.995 && arcFadeOut > 0.2) {
          var tip = G.stepArcs[ai].curve.getPointAt(ap);
          G.orbGroup.position.copy(tip);
          orbActive = true;
        }
      }
      if (!orbActive && uTrack > 0.05 && uTrack < 0.99 && nArcs > 0 && arcFadeOut > 0.2 && G.mode !== 'monolith') {
        var lastIdx = clamp(Math.floor(uTrack * nArcs), 0, nArcs - 1);
        var lastP = clamp((uTrack - ((lastIdx + 0.18) / (nArcs + 0.25))) / (0.78 / (nArcs + 0.25)), 0, 1);
        G.orbGroup.position.copy(G.stepArcs[lastIdx].curve.getPointAt(easeOutCubic(lastP)));
        orbActive = lastP > 0.01;
      }
      G.orbGroup.visible = orbActive;
    }

    // 第 4 拍「完整的制作流程.」左上眉题
    var flowHeadAlpha = 0;
    if (bOver && lt >= bOver.t0) {
      flowHeadAlpha = smooth01(uOver * 2.4) * (bMono && lt >= bMono.t0 ? 1 - smooth01(uMono * 3.0) : 1);
    }
    setDomOverlay(G.flowHead, flowHeadAlpha, 0, (1 - flowHeadAlpha) * 16);

    /* ── 5. 第 5 拍：树状胶囊分支 + 3D 双层倒角白瓷巨碑翻起 ── */
    var monoActive = (bMono && lt >= bMono.t0) || G.mode === 'monolith';
    G.monolithStage.visible = monoActive;
    if (monoActive) {
      var mU = G.mode === 'monolith' && !bMono ? 1 : uMono;

      // 顶部迷你连接弧 + 3 枚胶囊签（SOP / 规则 / 经验）
      var miniArcU = easeOutCubic(clamp((mU - 0.06) / 0.24, 0, 1));
      G.upperMiniArcs.forEach(function (ma) { ma.setProgress(miniArcU, smooth01(mU * 3)); });

      G.topPills.forEach(function (tp, idx) {
        var pu = outBack(clamp((mU - 0.10 - idx * 0.06) / 0.24, 0, 1), 1.35);
        tp.pill.group.position.set(tp.x, tp.y - (1 - pu) * 0.18, 0.08);
        tp.pill.group.scale.setScalar(0.84 + 0.16 * pu);
        tp.pill.setOpacity(smooth01((mU - 0.08 - idx * 0.06) / 0.18));
      });

      G.treeMidArcs.forEach(function (tm, idx) {
        var u1 = easeOutCubic(clamp((mU - 0.14 - idx * 0.05) / 0.20, 0, 1));
        var u2 = easeOutCubic(clamp((mU - 0.26 - idx * 0.05) / 0.22, 0, 1));
        tm.up.setProgress(u1, 1);
        tm.down.setProgress(u2, 1);
      });

      // 3D 巨型白瓷碑从平躺 (-76°) 有力翻起至微倾立姿 (+3.0°, -3.8°)
      var slabIn = clamp((mU - 0.22) / 0.42, 0, 1);
      var eSlab = outBack(slabIn, 1.12);
      var mAlpha = smooth01((mU - 0.20) / 0.16);
      var mY = lerp(-1.26, -0.45, eSlab);
      var mZ = lerp(0.42, 0.06, eSlab);
      var mRx = lerp(-76 * DEG, 3.0 * DEG, eSlab);
      var mRy = lerp(0, -3.8 * DEG, eSlab);

      G.monoRig.group.position.set(0.08, mY, mZ);
      G.monoRig.group.rotation.set(mRx, mRy, 0);
      G.monoRig.group.scale.setScalar(0.82);
      G.monoRig.setOpacity(mAlpha);

      var textAlpha = smooth01((mU - 0.42) / 0.22);
      var lineProg = easeOutCubic(clamp((mU - 0.50) / 0.28, 0, 1));
      G.monoPainter.update(textAlpha, lineProg);
      G.monoShadow.sync(0.08, FLOOR_Y + 0.18 + (1 - eSlab) * 0.2, mZ, 0.38, mAlpha);

      // 底部两枚分支胶囊（使用方法 / 提示词）
      G.botPills.forEach(function (bp, idx) {
        var bu = outBack(clamp((mU - 0.64 - idx * 0.07) / 0.22, 0, 1), 1.3);
        bp.pill.group.position.set(bp.x + 0.08, bp.y + (1 - bu) * 0.12, 0.10);
        bp.pill.group.scale.setScalar(0.85 + 0.15 * bu);
        bp.pill.setOpacity(smooth01((mU - 0.62 - idx * 0.07) / 0.16));
      });
      G.treeBotArcs.forEach(function (ba, idx) {
        var bau = easeOutCubic(clamp((mU - 0.60 - idx * 0.07) / 0.18, 0, 1));
        ba.setProgress(bau, 1);
      });

      var openAlpha = smooth01((mU - 0.34) / 0.24);
      setDomOverlay(G.openHead, openAlpha, 0, (1 - openAlpha) * 16);
    } else {
      setDomOverlay(G.openHead, 0, 0, 0);
    }

    G.renderer.render(G.scene, G.cam);
  }

  /* 挂载到主时间线驱动器 */
  function bindStageDriver(c, presetMode) {
    var G = initGalleryStage(c.el, presetMode);
    var s0 = c.scene ? c.scene.t : 0;
    var sDur = c.sceneDur || (c.scene ? c.scene.d : c.total);
    G.sceneStart = s0;
    G.sceneDur = sDur;
    if (!G.driver) {
      G.driver = true;
      var tl = c.tl;
      var tick = function () {
        var gt = tl.time();
        if (gt < s0 - 0.05 || gt > s0 + sDur + 0.5) return;
        renderGallery(G, clamp(gt - s0, 0, sDur));
      };
      tl.to({ u: 0 }, { u: 1, duration: sDur, ease: 'none', onUpdate: tick }, s0);
    }
    return G;
  }

  /* ═════════════════════ 注册 4 个组件生成器（FX.make） ═════════════════════ */

  FX.make.gallery3d = function (el) { if (g.THREE) initGalleryStage(el, 'combo'); };
  FX.make.corridor3d = function (el) { if (g.THREE) initGalleryStage(el, 'corridor'); };
  FX.make.stepchain3d = function (el) { if (g.THREE) initGalleryStage(el, 'steps'); };
  FX.make.monolith3d = function (el) { if (g.THREE) initGalleryStage(el, 'monolith'); };

  /* ═════════════════════ 注册 6 个声明式展厅 3D 动效（FX.register） ═════════════════════ */

  var def = function (name, desc, fn) { FX.register(name, CAT, desc, fn); };

  def('corridor-fly', '3D 暖白展厅画框长廊穿梭定焦：二十余幅真 3D 倒角画框高低错落悬浮于无影展厅，摄像机沿纵深高速穿过近景大光圈虚化画廊并平稳落定在中央英雄画框上。参数 dur（默认 3.8）', function (c) {
    var G = bindStageDriver(c, 'corridor');
    var lt0 = c.t - G.sceneStart;
    G.beats.fly = { t0: lt0, dur: num(c.o.dur, Math.min(3.8, G.sceneDur)) };
    renderGallery(G, 0);
  });

  def('hero-split3d', '英雄画框侧旋剥离玻璃层与选区框：中央 3D 画框右移侧倾，背后展开双层磨砂玻璃背板与 8 锚点 CAD 选区线框，下方浮出 3D 胶囊进度轨并同步揭示左侧大标题。参数 dur（默认 1.7）', function (c) {
    var G = bindStageDriver(c, 'combo');
    var lt0 = c.t - G.sceneStart;
    G.beats.hero = { t0: lt0, dur: num(c.o.dur, 1.7) };
    renderGallery(G, 0);
  });

  def('step-track3d', '3D 竖版白瓷步骤卡滑轨跟拍与跳线传导：摄影机沿横向滑轨逐张推过 3D 竖版白瓷厚卡，每张卡侧旋立定的同时底部生长三维朱橙悬链弧线与发光领跑圆球。参数 dur（默认 3.8）', function (c) {
    var G = bindStageDriver(c, 'steps');
    var lt0 = c.t - G.sceneStart;
    G.beats.track = { t0: lt0, dur: num(c.o.dur, 3.8) };
    renderGallery(G, 0);
  });

  def('step-overview3d', '3D 步骤竖卡阵列拉远全景陈列：摄影机平滑拉远居中，将全部 3D 白瓷步骤竖卡、底部完整朱橙跳线链与地面接触阴影同框尽收眼底，并浮现左上眉题。参数 dur（默认 1.4）', function (c) {
    var G = bindStageDriver(c, 'steps');
    var lt0 = c.t - G.sceneStart;
    G.beats.overview = { t0: lt0, dur: num(c.o.dur, 1.4) };
    renderGallery(G, 0);
  });

  def('monolith-rise3d', '五卡上移树状汇总与 3D 倒角白瓷巨碑翻起：步骤卡收拢至顶排并分叉出橙色树状引线与胶囊标签，前景厚重双层倒角白瓷巨碑从地面平躺有力翻起立定、生长底线并展开底部分支签。参数 dur（默认 3.6）', function (c) {
    var G = bindStageDriver(c, 'monolith');
    var lt0 = c.t - G.sceneStart;
    G.beats.monolith = { t0: lt0, dur: num(c.o.dur, 3.6) };
    renderGallery(G, 0);
  });

  def('gallery-cam3d', '展厅 3D 摄像机自定义推拉摇移：在任意时刻微调 gallery3d 展厅机位。参数 x、y、z、lx、ly、fov、dur（默认 1.2）', function (c) {
    var G = bindStageDriver(c, 'combo');
    var lt0 = c.t - G.sceneStart;
    G.cams.push({
      t0: lt0, dur: num(c.o.dur, 1.2),
      x: c.o.x !== undefined ? +c.o.x : undefined,
      y: c.o.y !== undefined ? +c.o.y : undefined,
      z: c.o.z !== undefined ? +c.o.z : undefined,
      lx: c.o.lx !== undefined ? +c.o.lx : undefined,
      ly: c.o.ly !== undefined ? +c.o.ly : undefined,
      fov: c.o.fov !== undefined ? +c.o.fov : undefined
    });
    G.cams.sort(function (a, b) { return a.t0 - b.t0; });
    renderGallery(G, 0);
  });

})(typeof window !== 'undefined' ? window : globalThis, typeof document !== 'undefined' ? document : undefined);
