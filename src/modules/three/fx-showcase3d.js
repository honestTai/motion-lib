/*!
 * FX 工业级 3D 硬件拆解与动力学展台模块 v1.0 (fx-showcase3d.js)
 * SPDX-License-Identifier: MIT
 *
 * 借鉴 Apple 发布会硬表面爆炸拆解、Spline 微距机械交互与高奢光学折射设计，
 * 基于 assets/showcase3d/ 下 6 套多部件可动 Blender .glb 工业模型 + 程序化 HDR 柔光棚反射（PMREM）：
 *
 *   6 个组件生成器（data-make）：
 *     1. chip3d   —— 苹果发布会风 5 层可拆解 AI 算力芯片（镀金 BGA 球阵 + PCB + 发光晶圆 + CNC 铝框 + 拉丝钛盖）
 *     2. laptop3d —— 极简阳极氧化铝 3D 超薄笔记本（真实物理转轴开合 + 65 键细节 + 动态屏幕背光投射）
 *     3. keycap3d —— 客制化机械轴微距特写 / 快捷键联排（烟熏底壳 + 真三维镀金螺旋弹簧 + 十字轴心 + 球面键帽）
 *     4. rack3d   —— 数据中心 4 刀片可热插拔抽拉服务器机柜（独立状态灯条 + 铭牌屏 + 两侧光纤脉冲管）
 *     5. prism3d  —— 光学折射水晶三棱镜与多路光谱分束台（高透射 CrystalPrism + 悬浮八面体晶核 + 分束光柱）
 *     6. gyro3d   —— 三轴精密万向陀螺 AI 调度中枢仪（正交嵌套三环差速旋转 + 环绕卫星节点）
 *
 *   12 个声明式 3D 特效（data-fx，分类：3D）：
 *     chip-explode · chip-assemble · laptop-open · laptop-close ·
 *     key-press3d · key-explode3d · rack-boot3d · blade-slide3d ·
 *     prism-split3d · gyro-spin3d · gyro-lock3d · showcase-orbit
 *
 *   依赖顺序：
 *     <script src="lib/vendor/gsap.min.js"></script>
 *     <script src="lib/vendor/three-fx.min.js"></script>
 *     <script src="lib/vendor/three-vrm.min.js"></script>
 *     <script src="lib/assets/showcase3d/models-b64.js"></script> <!-- 可选：离线零延迟 GLB 包 -->
 *     <script src="lib/fx.js"></script>
 *     <script src="lib/fx-showcase3d.js"></script>
 */
(function (g, doc) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-showcase3d：请先加载 fx.js');

  var TAU = Math.PI * 2, DEG = Math.PI / 180;
  var CAT = '3D';
  var READY_SEQ = 0;

  var num = function (v, d0) { return v === undefined || v === null || v === '' || isNaN(+v) ? d0 : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var smooth01 = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var smoother01 = function (x) { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
  var easeOutExpo = function (x) { x = clamp(x, 0, 1); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
  var outBack = function (u, s) {
    u = clamp(u, 0, 1); if (u <= 0 || u >= 1) return u;
    s = s === undefined ? 1.25 : s;
    var t = u - 1;
    return t * t * ((s + 1) * t + s) + 1;
  };

  function d() { return doc || g.document; }
  function mk(tag, cls) { var e = d().createElement(tag); if (cls) e.className = cls; return e; }
  function attr(el, k, defVal) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? defVal : v; }
  function parseTilt(s, defArr) {
    if (!s) return defArr.slice();
    var p = String(s).split(',').map(Number);
    return [num(p[0], defArr[0]), num(p[1], defArr[1]), num(p[2], defArr[2])];
  }

  function holdRender(promise) {
    if (!promise || typeof promise.then !== 'function') return;
    var hf = g.__hf = g.__hf || {};
    hf.buildReady = hf.buildReady || {};
    hf.buildReady['fx-showcase3d-' + (++READY_SEQ)] = promise;
  }

  /* ═════════════════════ GLB 资产加载与程序化 HDR 柔光棚反射 ═════════════════════ */

  var MODEL_FILES = {
    chip: 'chip-soc.glb',
    laptop: 'macbook-pro.glb',
    keycap: 'mech-key.glb',
    rack: 'server-rack.glb',
    prism: 'optic-prism.glb',
    gyro: 'gimbal-core.glb'
  };
  var GLB_CACHE = {};
  var GLB_PROMISE = null;
  var GLB_WAITERS = [];

  function b64ToBuffer(b64) {
    var bin = g.atob ? g.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    var len = bin.length, bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  function resolveShowcaseBase() {
    if (!d() || !d().querySelectorAll) return 'lib/assets/showcase3d/';
    var scripts = d().querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src') || '';
      var m = /^(.*\/)fx-showcase3d\.js(?:\?.*)?$/.exec(s);
      if (m) return m[1] + 'assets/showcase3d/';
    }
    return 'lib/assets/showcase3d/';
  }

  function ensureShowcaseGLBs() {
    if (GLB_PROMISE) return GLB_PROMISE;
    var T = g.THREE, V = g.THREE_VRM;
    var LoaderCls = (T && T.GLTFLoader) || (V && V.GLTFLoader);
    if (!LoaderCls) {
      GLB_PROMISE = Promise.resolve(false);
      return GLB_PROMISE;
    }
    var loader = new LoaderCls();
    var bank = g.FX_SHOWCASE3D_GLB || null;
    var base = resolveShowcaseBase();
    var isFile = g.location && g.location.protocol === 'file:';

    var parseOne = function (key, buf) {
      return new Promise(function (resolve) {
        loader.parse(buf, '', function (gltf) {
          GLB_CACHE[key] = gltf.scene;
          resolve(true);
        }, function () { resolve(false); });
      });
    };

    var jobs = Object.keys(MODEL_FILES).map(function (key) {
      if (bank && bank[key]) {
        try { return parseOne(key, b64ToBuffer(bank[key])); } catch (e) { return Promise.resolve(false); }
      }
      if (isFile || typeof g.fetch !== 'function') return Promise.resolve(false);
      return g.fetch(base + MODEL_FILES[key])
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) { return buf ? parseOne(key, buf) : false; })
        .catch(function () { return false; });
    });

    GLB_PROMISE = Promise.all(jobs).then(function () {
      var list = GLB_WAITERS.splice(0);
      list.forEach(function (fn) { try { fn(); } catch (e) {} });
      return true;
    });
    holdRender(GLB_PROMISE);
    return GLB_PROMISE;
  }

  /* 程序化生成 Apple 发布会级柔光棚 HDR 等距柱状环境贴图（让钛金属、镀金针脚与水晶棱镜折射出细腻高光带） */
  function buildStudioEnvMap(T, renderer, isLightTheme) {
    var cv = mk('canvas'); cv.width = 1024; cv.height = 512;
    var ctx = cv.getContext('2d');

    var bg = ctx.createLinearGradient(0, 0, 0, 512);
    if (isLightTheme) {
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.45, '#f1f5f9');
      bg.addColorStop(0.55, '#cbd5e1');
      bg.addColorStop(1, '#e2e8f0');
    } else {
      bg.addColorStop(0, '#1e293b');
      bg.addColorStop(0.42, '#0f172a');
      bg.addColorStop(0.52, '#020617');
      bg.addColorStop(1, '#0b1120');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 512);

    // 顶部大型主柔光箱（Key Softbox）
    var topBox = ctx.createRadialGradient(512, 72, 18, 512, 72, 340);
    topBox.addColorStop(0, 'rgba(255,255,255,1)');
    topBox.addColorStop(0.45, 'rgba(241,245,249,0.72)');
    topBox.addColorStop(1, 'rgba(241,245,249,0)');
    ctx.fillStyle = topBox;
    ctx.fillRect(90, 8, 844, 175);

    // 左侧冰蓝轮廓灯条（Cool Cyan Rim Strip）
    var leftRim = ctx.createLinearGradient(110, 0, 250, 0);
    leftRim.addColorStop(0, 'rgba(56,189,248,0)');
    leftRim.addColorStop(0.5, 'rgba(186,230,253,0.92)');
    leftRim.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = leftRim;
    ctx.fillRect(110, 80, 140, 320);

    // 右侧暖珀金轮廓灯条（Warm Amber Rim Strip）
    var rightRim = ctx.createLinearGradient(760, 0, 910, 0);
    rightRim.addColorStop(0, 'rgba(251,146,60,0)');
    rightRim.addColorStop(0.5, 'rgba(254,215,170,0.88)');
    rightRim.addColorStop(1, 'rgba(251,146,60,0)');
    ctx.fillStyle = rightRim;
    ctx.fillRect(760, 95, 150, 300);

    // 正前方锐利高光细灯带（给棱镜斜切边与笔记本倒角勾勒银白亮边）
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(420, 186, 184, 14);

    var eqTex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) eqTex.colorSpace = T.SRGBColorSpace;
    eqTex.mapping = T.EquirectangularReflectionMapping;

    if (T.PMREMGenerator) {
      var pmrem = new T.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      var rt = pmrem.fromEquirectangular(eqTex);
      eqTex.dispose();
      pmrem.dispose();
      return rt.texture;
    }
    return eqTex;
  }

  /* ═════════════════════ 高清程序化屏幕 / 晶圆 / 键帽贴图工坊 ═════════════════════ */

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* 1A. 芯片散热顶盖镭雕贴图（LidLabelSurface） */
  function makeChipLidTexture(T, labelStr) {
    var cv = mk('canvas'); cv.width = 1024; cv.height = 1024;
    var ctx = cv.getContext('2d');
    var parts = String(labelStr || 'M5 ULTRA|NEURAL SOC').split('|');

    // 拉丝钛银金属渐变底纹
    var grd = ctx.createLinearGradient(0, 0, 1024, 1024);
    grd.addColorStop(0, '#dfe3ea');
    grd.addColorStop(0.5, '#eef1f6');
    grd.addColorStop(1, '#c8ced9');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1024, 1024);

    // 细微金属拉丝纹理
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    for (var y = 0; y < 1024; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(51,65,85,0.22)';
    ctx.lineWidth = 5;
    roundRect(ctx, 56, 56, 912, 912, 72);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = '900 132px "SF Pro Display", "Inter", "Helvetica Neue", sans-serif';
    ctx.fillText(parts[0] || 'AI CORE', 512, 505);

    if (parts[1]) {
      ctx.fillStyle = '#475569';
      ctx.font = '700 46px "JetBrains Mono", "SF Pro Display", monospace';
      ctx.fillText(parts[1], 512, 605);
    }

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* 1B. 芯片内部硅晶圆动态发光电路阵列贴图（SiliconDie > ScreenSurface） */
  function createSiliconDiePainter(T, accentHex, nCores) {
    var cv = mk('canvas'); cv.width = 1024; cv.height = 1024;
    var ctx = cv.getContext('2d');
    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    var grid = Math.max(2, Math.round(Math.sqrt(num(nCores, 16))));
    var lastKey = '';

    return {
      tex: tex,
      update: function (pulse, lt) {
        var p = clamp(pulse, 0, 1), wave = (lt * 2.2) % 1;
        var key = p.toFixed(2) + '|' + wave.toFixed(2);
        if (key === lastKey) return;
        lastKey = key;

        ctx.fillStyle = '#070b14';
        ctx.fillRect(0, 0, 1024, 1024);

        var pad = 92, span = 1024 - pad * 2, cell = span / grid;
        // 总线发光走线
        ctx.strokeStyle = accentHex || '#38bdf8';
        ctx.globalAlpha = 0.28 + 0.55 * p;
        ctx.lineWidth = 4;
        for (var i = 0; i <= grid; i++) {
          var pos = pad + i * cell;
          ctx.beginPath(); ctx.moveTo(pad * 0.4, pos); ctx.lineTo(1024 - pad * 0.4, pos); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pos, pad * 0.4); ctx.lineTo(pos, 1024 - pad * 0.4); ctx.stroke();
        }

        // NPU / GPU 计算核矩阵
        for (var r = 0; r < grid; r++) {
          for (var c0 = 0; c0 < grid; c0++) {
            var dist = Math.hypot(r - (grid - 1) / 2, c0 - (grid - 1) / 2) / (grid * 0.72);
            var hot = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin((wave - dist) * TAU), 2) * (0.3 + 0.7 * p);
            var x = pad + c0 * cell + 12, y = pad + r * cell + 12, w = cell - 24;
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#0f172a';
            roundRect(ctx, x, y, w, w, 12); ctx.fill();
            ctx.globalAlpha = hot;
            ctx.fillStyle = (r + c0) % 3 === 0 ? '#a855f7' : (accentHex || '#38bdf8');
            roundRect(ctx, x + 10, y + 10, w - 20, w - 20, 8); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        tex.needsUpdate = true;
      }
    };
  }

  /* 2. 笔记本高清屏幕贴图（支持自定义 <img> 或内置暗色 AI 编程 IDE 界面） */
  function createLaptopScreenTexture(T, titleStr, imgEl, accentHex) {
    var W = 1584, H = 992;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;

    function paint() {
      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        var iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
        var sc = Math.max(W / iw, H / ih);
        ctx.drawImage(imgEl, (W - iw * sc) / 2, (H - ih * sc) / 2, iw * sc, ih * sc);
        tex.needsUpdate = true;
        return;
      }

      // 默认高颜值 macOS AI Agent IDE 窗口
      var bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#0b1120'); bg.addColorStop(1, '#111827');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // 顶栏红黄绿圆点 + 标题
      ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, W, 68);
      [['#ef4444', 42], ['#f59e0b', 76], ['#22c55e', 110]].forEach(function (d0) {
        ctx.fillStyle = d0[0]; ctx.beginPath(); ctx.arc(d0[1], 34, 10, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = '#94a3b8'; ctx.font = '600 26px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(titleStr || 'motion-lib · AI 3D Studio Pipeline', W / 2, 43);

      // 左栏代码区 + 右栏实时状态面版
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, 44, 104, 960, 840, 22); ctx.fill();
      ctx.strokeStyle = 'rgba(148,163,184,0.18)'; ctx.lineWidth = 2; ctx.stroke();

      var codeLines = [
        ['#38bdf8', '$ acpx --model gpt-6.2-astra codex exec'],
        ['#94a3b8', '  ✓ chip-soc.glb       81 BGA pins · 5 layers'],
        ['#94a3b8', '  ✓ macbook-pro.glb    hinged lid · 65 keys'],
        ['#94a3b8', '  ✓ mech-key.glb       helical coil spring'],
        ['#22c55e', '  ✓ PMREM softbox reflections active'],
        ['#f8fafc', ''],
        ['#c084fc', '<div data-make="laptop3d"'],
        ['#fb923c', '     data-fx="laptop-open@0(dur=1.5)">'],
        ['#c084fc', '</div>']
      ];
      ctx.font = '600 34px "JetBrains Mono", monospace';
      codeLines.forEach(function (ln, idx) {
        ctx.fillStyle = ln[0];
        ctx.fillText(ln[1], 88, 186 + idx * 74);
      });

      // 右栏算力仪表卡
      ctx.fillStyle = '#131c31';
      roundRect(ctx, 1040, 104, 500, 400, 22); ctx.fill(); ctx.stroke();
      ctx.fillStyle = accentHex || '#38bdf8';
      ctx.font = '900 108px "SF Pro Display", sans-serif';
      ctx.fillText('60 FPS', 1090, 268);
      ctx.fillStyle = '#cbd5e1'; ctx.font = '700 34px "PingFang SC", sans-serif';
      ctx.fillText('逐帧确定性硬件光追级渲染', 1090, 342);
      ctx.fillStyle = accentHex || '#38bdf8';
      roundRect(ctx, 1090, 396, 390, 18, 9); ctx.fill();

      ctx.fillStyle = '#131c31';
      roundRect(ctx, 1040, 536, 500, 408, 22); ctx.fill(); ctx.stroke();
      for (var b = 0; b < 12; b++) {
        var bh = 90 + Math.abs(Math.sin(b * 0.85)) * 210;
        ctx.fillStyle = b > 8 ? (accentHex || '#38bdf8') : '#334155';
        roundRect(ctx, 1088 + b * 34, 884 - bh, 22, bh, 8); ctx.fill();
      }
      tex.needsUpdate = true;
    }

    paint();
    if (imgEl && !imgEl.complete) {
      holdRender(new Promise(function (resolve) {
        var done = function () { paint(); resolve(); };
        imgEl.addEventListener('load', done, { once: true });
        imgEl.addEventListener('error', done, { once: true });
      }));
    }
    return tex;
  }

  /* 3. 球面键帽顶面字符贴图（SculptedKeycap > ScreenSurface） */
  function makeKeycapTopTexture(T, label, subLabel, accentHex) {
    var cv = mk('canvas'); cv.width = 512; cv.height = 512;
    var ctx = cv.getContext('2d');
    var grd = ctx.createRadialGradient(256, 256, 20, 256, 256, 280);
    grd.addColorStop(0, '#f1f5f9');
    grd.addColorStop(1, '#fcfcfd');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    var len = String(label || '⌘').length;
    var fSize = len <= 1 ? 210 : len <= 3 ? 136 : 96;
    ctx.font = '900 ' + fSize + 'px "SF Pro Display", "JetBrains Mono", "PingFang SC", sans-serif';
    ctx.fillText(label || '⌘', 256, subLabel ? 228 : 262);

    if (subLabel) {
      ctx.fillStyle = accentHex || '#ea580c';
      ctx.font = '800 44px "JetBrains Mono", sans-serif';
      ctx.fillText(subLabel, 256, 368);
    }

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* 4. 服务器刀片前面板 OLED 铭牌贴图（Blade_i > ScreenSurface_i） */
  function makeBladeLabelTexture(T, label, accentHex, active) {
    var cv = mk('canvas'); cv.width = 512; cv.height = 148;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 148);
    ctx.strokeStyle = active ? (accentHex || '#22c55e') : '#334155';
    ctx.lineWidth = 4;
    roundRect(ctx, 6, 6, 500, 136, 16);
    ctx.stroke();

    ctx.fillStyle = active ? '#f8fafc' : '#94a3b8';
    ctx.font = '800 36px "JetBrains Mono", "PingFang SC", monospace';
    ctx.fillText(label, 28, 66);

    // 算力负载小格条
    for (var i = 0; i < 14; i++) {
      ctx.fillStyle = i < (active ? 12 : 5) ? (accentHex || '#22c55e') : '#1e293b';
      roundRect(ctx, 28 + i * 32, 92, 22, 24, 5);
      ctx.fill();
    }

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* 通用柔和接触圆影 */
  var SOFT_SHADOW_TEX = null;
  function makeContactShadow(T, radius, baseOpacity) {
    if (!SOFT_SHADOW_TEX) {
      var cv = mk('canvas'); cv.width = 256; cv.height = 256;
      var ctx = cv.getContext('2d');
      var g0 = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
      g0.addColorStop(0, 'rgba(2, 6, 23, 0.58)');
      g0.addColorStop(0.5, 'rgba(2, 6, 23, 0.22)');
      g0.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = g0;
      ctx.fillRect(0, 0, 256, 256);
      SOFT_SHADOW_TEX = new T.CanvasTexture(cv);
    }
    var mat = new T.MeshBasicMaterial({ map: SOFT_SHADOW_TEX, transparent: true, opacity: baseOpacity || 0.42, depthWrite: false });
    var mesh = new T.Mesh(new T.PlaneGeometry(radius * 2, radius * 2), mat);
    mesh.rotation.x = -Math.PI / 2;
    return { mesh: mesh, mat: mat };
  }

  /* ═════════════════════ 展台初始化与 6 大工业级实体装配 ═════════════════════ */

  function isLightSkin(el) {
    var st = d().querySelector('[data-composition-id]');
    var cls = ((el && el.className) || '') + ' ' + ((st && st.className) || '');
    return /theme-(white3d|violet|paper)/.test(cls) && !/\.dark\b|\bdark\b/.test(el.parentElement ? el.parentElement.className : '');
  }

  function initShowcase(el, kind) {
    if (el.__sc3d) return el.__sc3d;
    var T = g.THREE;
    if (!T) throw new Error('fx-showcase3d：请先加载 vendor/three-fx.min.js');
    ensureShowcaseGLBs();

    var W = el.offsetWidth || 1920, H = el.offsetHeight || 1080;
    var lightMode = isLightSkin(el);
    var accent = attr(el, 'accent', kind === 'rack' ? '#22c55e' : kind === 'keycap' ? '#ea580c' : '#38bdf8');

    var userImg = el.querySelector ? el.querySelector('img') : null;
    if (!userImg && attr(el, 'src', '')) { userImg = mk('img'); userImg.src = attr(el, 'src'); }
    Array.prototype.slice.call(el.children || []).forEach(function (ch) {
      ch.style.display = 'none';
      ch.setAttribute('data-lint', 'off');
    });

    el.classList.add('fx-showcase3d');
    el.setAttribute('data-lint', 'content');

    var dpr = clamp(num(attr(el, 'dpr'), 1.5), 1, 2);
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    if (T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
    if (T.ACESFilmicToneMapping) {
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = lightMode ? 1.06 : 1.18;
    }
    renderer.setClearColor(0x000000, 0);
    el.insertBefore(renderer.domElement, el.firstChild);

    // 3D 锚点投影引线叠加层（Apple 发布会风极简圆点引线 + 毛玻璃胶囊）
    var overlay = mk('div', 'fx-sc3d-overlay');
    overlay.setAttribute('data-lint', 'off');
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = d().createElementNS ? d().createElementNS(svgNS, 'svg') : mk('svg');
    svg.setAttribute('class', 'fx-sc3d-svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    overlay.appendChild(svg);
    el.appendChild(overlay);

    var scene = new T.Scene();
    scene.environment = buildStudioEnvMap(T, renderer, lightMode);

    // 长焦低畸变苹果发布会摄影机（默认 32° FOV ≈ 85mm 人像微距电影头）
    var cam = new T.PerspectiveCamera(num(attr(el, 'fov'), 32), W / H, 0.1, 120);

    scene.add(new T.HemisphereLight(0xffffff, lightMode ? 0xcbd5e1 : 0x0f172a, lightMode ? 1.15 : 0.85));
    var keyLight = new T.DirectionalLight(0xfffdf8, lightMode ? 1.45 : 2.10);
    keyLight.position.set(-4.5, 7.5, 6.5);
    scene.add(keyLight);

    var cyanRim = new T.DirectionalLight(0x7dd3fc, lightMode ? 0.55 : 1.35);
    cyanRim.position.set(5.5, 3.2, -4.5);
    scene.add(cyanRim);

    var warmRim = new T.DirectionalLight(0xfdba74, lightMode ? 0.45 : 0.95);
    warmRim.position.set(-5.2, -2.0, -3.5);
    scene.add(warmRim);

    var stageRoot = new T.Group();
    scene.add(stageRoot);

    var defaultTilts = {
      chip: [28, -36, 0],
      laptop: [16, -24, 0],
      keycap: [24, -32, 0],
      rack: [14, -28, 0],
      prism: [14, -18, 0],
      gyro: [16, -22, 0]
    };
    var defaultDists = { chip: 10.2, laptop: 10.6, keycap: 8.2, rack: 11.4, prism: 9.2, gyro: 10.2 };
    var tilt0 = parseTilt(attr(el, 'tilt', ''), defaultTilts[kind] || [20, -28, 0]);

    var S = {
      el: el, T: T, W: W, H: H, kind: kind, lightMode: lightMode, accent: accent,
      userImg: userImg, renderer: renderer, scene: scene, cam: cam, stageRoot: stageRoot,
      overlay: overlay, svg: svg, callouts: [],
      baseRx: tilt0[0] * DEG, baseRy: tilt0[1] * DEG, baseRz: tilt0[2] * DEG,
      camDist: num(attr(el, 'dist'), defaultDists[kind] || 9.8),
      lookY: num(attr(el, 'look-y'), 0.02),
      parts: {}, mounted: false, cues: [], orbits: [],
      driver: false, sceneStart: 0, sceneDur: 5, lastLt: 0
    };

    function addCalloutUI(items) {
      S.callouts.forEach(function (c0) {
        if (c0.tagEl.parentNode) c0.tagEl.parentNode.removeChild(c0.tagEl);
        if (c0.lineEl.parentNode) c0.lineEl.parentNode.removeChild(c0.lineEl);
        if (c0.dotEl.parentNode) c0.dotEl.parentNode.removeChild(c0.dotEl);
      });
      S.callouts = [];
      if (!d().createElementNS) return;

      items.forEach(function (item) {
        var lineEl = d().createElementNS(svgNS, 'polyline');
        lineEl.setAttribute('fill', 'none');
        lineEl.setAttribute('stroke', item.color || accent);
        lineEl.setAttribute('stroke-width', '2.2');
        lineEl.setAttribute('stroke-linecap', 'round');
        svg.appendChild(lineEl);

        var dotEl = d().createElementNS(svgNS, 'circle');
        dotEl.setAttribute('r', '5');
        dotEl.setAttribute('fill', item.color || accent);
        svg.appendChild(dotEl);

        var tagEl = mk('div', 'fx-sc3d-tag' + (lightMode ? ' is-light' : ''));
        tagEl.style.setProperty('--sc-dot', item.color || accent);
        tagEl.innerHTML = '<i></i>' + item.label;
        tagEl.style.opacity = '0';
        tagEl.style.transform = 'translateY(-50%)';
        overlay.appendChild(tagEl);

        S.callouts.push({
          target: item.target, offset: item.offset || new T.Vector3(0, 0, 0),
          side: item.side || 1, dynamicSide: !!item.dynamicSide, dy: item.dy || 0,
          lineEl: lineEl, dotEl: dotEl, tagEl: tagEl
        });
      });
    }

    function mountGLB() {
      if (S.mounted || !GLB_CACHE[kind]) return;
      S.mounted = true;
      while (stageRoot.children.length) stageRoot.remove(stageRoot.children[0]);

      if (kind === 'chip') {
        var chipRoot = GLB_CACHE.chip.clone(true);
        chipRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        stageRoot.add(chipRoot);

        var layerNames = ['BasePins', 'SubstratePCB', 'SiliconDie', 'ThermalFrame', 'HeatspreaderLid'];
        var layers = layerNames.map(function (nm) {
          var node = chipRoot.getObjectByName(nm);
          return { name: nm, node: node, y0: node ? node.position.y : 0 };
        });

        var lidSurf = chipRoot.getObjectByName('LidLabelSurface');
        if (lidSurf) {
          lidSurf.material = new T.MeshStandardMaterial({
            map: makeChipLidTexture(T, attr(el, 'label', 'M5 ULTRA|16-CORE NEURAL ENGINE')),
            metalness: 0.55, roughness: 0.28
          });
        }
        var diePainter = createSiliconDiePainter(T, accent, attr(el, 'cores', 16));
        var dieSurf = chipRoot.getObjectByName('ScreenSurface');
        if (dieSurf) {
          dieSurf.material = new T.MeshBasicMaterial({ map: diePainter.tex, toneMapped: false });
        }
        var dieGlow = new T.PointLight(new T.Color(accent), 0, 4.5);
        dieGlow.position.set(0, 0.2, 0);
        chipRoot.add(dieGlow);

        var shd = makeContactShadow(T, 2.35, lightMode ? 0.26 : 0.48);
        shd.mesh.position.y = -1.35;
        scene.add(shd.mesh);

        var callRaw = attr(el, 'callouts', '镀金 BGA 触点阵列,多层高速纤维基板,神经网络硅晶核心,CNC 铝合金加固环,拉丝钛金属散热盖');
        if (callRaw !== 'off') {
          var lbs = callRaw.split(',').map(function (s) { return s.trim(); });
          var items = [];
          layers.forEach(function (ly, idx) {
            if (lbs[idx] && ly.node) {
              var xSpan = idx === 2 ? 0.72 : 1.15;
              items.push({
                target: ly.node,
                label: lbs[idx],
                side: idx % 2 === 0 ? 1 : -1,
                offset: new T.Vector3((idx % 2 === 0 ? xSpan : -xSpan), 0, 0)
              });
            }
          });
          addCalloutUI(items);
        }
        S.parts = { root: chipRoot, layers: layers, diePainter: diePainter, dieGlow: dieGlow, shadow: shd };

      } else if (kind === 'laptop') {
        var macRoot = GLB_CACHE.laptop.clone(true);
        macRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        macRoot.position.y = -0.85;
        stageRoot.add(macRoot);

        var lidPivot = macRoot.getObjectByName('LidPivot');
        var scrSurf = macRoot.getObjectByName('ScreenSurface');
        var scrTex = createLaptopScreenTexture(T, attr(el, 'title', ''), userImg, accent);
        var scrMat = new T.MeshBasicMaterial({ map: scrTex, color: 0xffffff, transparent: true, opacity: 1, toneMapped: false });
        if (scrSurf) scrSurf.material = scrMat;

        var screenBounce = new T.PointLight(new T.Color(accent), 0, 4.2);
        screenBounce.position.set(0, 0.55, 0.25);
        macRoot.add(screenBounce);

        var shdL = makeContactShadow(T, 2.9, lightMode ? 0.28 : 0.52);
        shdL.mesh.position.y = -0.96;
        scene.add(shdL.mesh);

        S.parts = { root: macRoot, lid: lidPivot, scrMat: scrMat, screenBounce: screenBounce, shadow: shdL, initOpen: num(attr(el, 'open'), 0) };

      } else if (kind === 'keycap') {
        var keysRaw = attr(el, 'keys', attr(el, 'label', '⌘'));
        var keyLabels = keysRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var subRaw = attr(el, 'subs', '').split(',').map(function (s) { return s.trim(); });
        var nKeys = keyLabels.length;
        var spacing = 2.15;
        var units = [];

        keyLabels.forEach(function (kl, idx) {
          var kClone = GLB_CACHE.keycap.clone(true);
          kClone.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
          var xOff = (-((nKeys - 1) * spacing) / 2) + idx * spacing;
          kClone.position.set(xOff, -0.78, 0);
          stageRoot.add(kClone);

          var kSurf = kClone.getObjectByName('ScreenSurface');
          if (kSurf) {
            kSurf.material = new T.MeshStandardMaterial({
              map: makeKeycapTopTexture(T, kl, subRaw[idx] || '', accent),
              roughness: 0.34, metalness: 0.04
            });
          }

          var bot = kClone.getObjectByName('BottomHousing');
          var spr = kClone.getObjectByName('CoilSpring');
          var stm = kClone.getObjectByName('CrossStem');
          var topH = kClone.getObjectByName('TopHousing');
          var cap = kClone.getObjectByName('SculptedKeycap');
          var led = kClone.getObjectByName('RGBLed');
          if (led && led.material) {
            led.material.emissive = new T.Color(accent);
            led.material.emissiveIntensity = 0.4;
          }

          // 按键底部触发脉冲光环
          var ringGeo = new T.RingGeometry(0.85, 1.05, 48);
          ringGeo.rotateX(-Math.PI / 2);
          var ringMat = new T.MeshBasicMaterial({ color: new T.Color(accent), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
          var ringMesh = new T.Mesh(ringGeo, ringMat);
          ringMesh.position.set(xOff, -0.76, 0);
          stageRoot.add(ringMesh);

          units.push({
            root: kClone, xOff: xOff,
            bot: bot, spr: spr, stm: stm, top: topH, cap: cap, led: led,
            y0: {
              bot: bot ? bot.position.y : 0,
              spr: spr ? spr.position.y : 0,
              stm: stm ? stm.position.y : 0,
              top: topH ? topH.position.y : 0,
              cap: cap ? cap.position.y : 0
            },
            ringMesh: ringMesh, ringMat: ringMat
          });
        });

        if (nKeys > 1 && !el.hasAttribute('data-dist')) S.camDist = 8.2 + (nKeys - 1) * 1.85;
        var shdK = makeContactShadow(T, 1.65 * nKeys, lightMode ? 0.25 : 0.46);
        shdK.mesh.position.y = -0.85;
        scene.add(shdK.mesh);

        S.parts = { units: units, shadow: shdK };

      } else if (kind === 'rack') {
        var rackRoot = GLB_CACHE.rack.clone(true);
        rackRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        stageRoot.add(rackRoot);

        var bladeLabels = attr(el, 'blades', 'NODE 01 · GEMINI,NODE 02 · CLAUDE,NODE 03 · GPT-6.2,NODE 04 · HROUTER').split(',').map(function (s) { return s.trim(); });
        var blades = [1, 2, 3, 4].map(function (bi, idx) {
          var bNode = rackRoot.getObjectByName('Blade_' + bi);
          var lNode = rackRoot.getObjectByName('Led_' + bi);
          var sNode = rackRoot.getObjectByName('ScreenSurface_' + bi);
          var lbl = bladeLabels[idx] || ('BLADE 0' + bi);
          var texIdle = makeBladeLabelTexture(T, lbl, accent, false);
          var texHot = makeBladeLabelTexture(T, lbl, accent, true);
          var sMat = new T.MeshBasicMaterial({ map: texIdle, toneMapped: false });
          if (sNode) sNode.material = sMat;
          if (lNode && lNode.material) {
            lNode.material = lNode.material.clone();
            lNode.material.emissive = new T.Color(accent);
            lNode.material.emissiveIntensity = 0.2;
          }
          return {
            idx: bi, node: bNode, led: lNode, sMat: sMat,
            texIdle: texIdle, texHot: texHot,
            z0: bNode ? bNode.position.z : 0, hot: false
          };
        });

        // 机柜两侧发光光纤数据流弧线
        var fibers = [-1, 1].map(function (side) {
          var curve = new T.CatmullRomCurve3([
            new T.Vector3(side * 2.8, -1.8, -0.8),
            new T.Vector3(side * 1.9, -0.9, 0.5),
            new T.Vector3(side * 1.52, 0.4, 1.05),
            new T.Vector3(side * 1.48, 1.35, 1.15)
          ]);
          var fGeo = new T.TubeGeometry(curve, 64, 0.026, 8, false);
          var fMat = new T.MeshBasicMaterial({ color: new T.Color(accent), transparent: true, opacity: 0.85 });
          var fMesh = new T.Mesh(fGeo, fMat);
          fGeo.setDrawRange(0, 0);
          rackRoot.add(fMesh);
          return { geo: fGeo, mat: fMat, mesh: fMesh, total: fGeo.index ? fGeo.index.count : 3072 };
        });

        var shdR = makeContactShadow(T, 2.4, lightMode ? 0.28 : 0.52);
        shdR.mesh.position.y = -1.96;
        scene.add(shdR.mesh);

        S.parts = { root: rackRoot, blades: blades, fibers: fibers, shadow: shdR };

      } else if (kind === 'prism') {
        var prismRoot = GLB_CACHE.prism.clone(true);
        prismRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        prismRoot.position.y = -0.15;
        stageRoot.add(prismRoot);

        var crystal = prismRoot.getObjectByName('CrystalPrism');
        var core = prismRoot.getObjectByName('InnerCore');
        var ped = prismRoot.getObjectByName('PedestalRing');

        if (crystal && T.MeshPhysicalMaterial) {
          crystal.material = new T.MeshPhysicalMaterial({
            color: new T.Color('#e0f2fe'),
            metalness: 0.04,
            roughness: 0.05,
            transmission: 0.92,
            thickness: 1.6,
            ior: 1.58,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            transparent: true,
            opacity: 0.96
          });
        }
        if (core && core.material) {
          core.material.emissive = new T.Color('#f97316');
          core.material.emissiveIntensity = 0.35;
        }

        // 入射白光激光束 + 右侧折射多路彩色色散光谱束
        var beamGroup = new T.Group();
        scene.add(beamGroup);

        var inCurve = new T.LineCurve3(new T.Vector3(-5.8, -0.35, 0), new T.Vector3(-0.52, 0.15, 0));
        var inGeo = new T.TubeGeometry(inCurve, 32, 0.042, 12, false);
        var inMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
        var inMesh = new T.Mesh(inGeo, inMat);
        inGeo.setDrawRange(0, 0);
        beamGroup.add(inMesh);

        var outLabels = attr(el, 'out-labels', 'Gemini · 策划文案,Claude · 前端排版,GPT-6.2 · 3D 建模').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var palette = ['#38bdf8', '#a855f7', '#f97316', '#22c55e', '#f43f5e'];
        var outBeams = outLabels.map(function (lbl, idx) {
          var nB = outLabels.length;
          var spreadY = nB > 1 ? lerp(1.25, -1.05, idx / (nB - 1)) : 0.1;
          var col = palette[idx % palette.length];
          var oCurve = new T.CatmullRomCurve3([
            new T.Vector3(0.48, 0.16, 0),
            new T.Vector3(2.2, lerp(0.16, spreadY, 0.52), 0.12 * (idx - 1)),
            new T.Vector3(4.35, spreadY, 0.18 * (idx - 1))
          ]);
          var oGeo = new T.TubeGeometry(oCurve, 48, 0.036, 10, false);
          var oMat = new T.MeshBasicMaterial({ color: new T.Color(col), transparent: true, opacity: 0.92 });
          var oMesh = new T.Mesh(oGeo, oMat);
          oGeo.setDrawRange(0, 0);
          beamGroup.add(oMesh);

          var anchor = new T.Object3D();
          anchor.position.set(1.95, lerp(0.16, spreadY, 0.56), 0.12 * (idx - 1));
          beamGroup.add(anchor);
          return { geo: oGeo, mat: oMat, mesh: oMesh, total: oGeo.index ? oGeo.index.count : 2880, anchor: anchor, label: lbl, color: col };
        });

        var callItems = outBeams.map(function (ob) {
          return { target: ob.anchor, label: ob.label, side: 1, color: ob.color };
        });
        var inLabel = attr(el, 'in-label', '');
        if (inLabel) {
          var inAnchor = new T.Object3D();
          inAnchor.position.set(-1.95, -0.05, 0);
          beamGroup.add(inAnchor);
          callItems.unshift({ target: inAnchor, label: inLabel, side: -1, color: '#f8fafc' });
        }
        addCalloutUI(callItems);

        var shdP = makeContactShadow(T, 2.1, lightMode ? 0.24 : 0.45);
        shdP.mesh.position.y = -1.62;
        scene.add(shdP.mesh);

        S.parts = {
          root: prismRoot, crystal: crystal, core: core, ped: ped,
          inBeam: { geo: inGeo, mesh: inMesh, total: inGeo.index ? inGeo.index.count : 2304 },
          outBeams: outBeams, shadow: shdP
        };

      } else if (kind === 'gyro') {
        var gyroRoot = GLB_CACHE.gyro.clone(true);
        gyroRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        stageRoot.add(gyroRoot);

        var outer = gyroRoot.getObjectByName('OuterRing');
        var mid = gyroRoot.getObjectByName('MidRing');
        var inner = gyroRoot.getObjectByName('InnerRing');
        var coreP = gyroRoot.getObjectByName('CorePoly');

        var coreLight = new T.PointLight(new T.Color(accent), 2.4, 6.0);
        gyroRoot.add(coreLight);

        // 环绕卫星能量节点
        var satGroup = new T.Group();
        stageRoot.add(satGroup);
        var nodeNames = attr(el, 'nodes', 'Planner,Coder,Modeler').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var sats = nodeNames.map(function (nm, idx) {
          var sMesh = new T.Mesh(
            new T.OctahedronGeometry(0.14, 0),
            new T.MeshStandardMaterial({ color: new T.Color(accent), emissive: new T.Color(accent), emissiveIntensity: 0.55, roughness: 0.2 })
          );
          satGroup.add(sMesh);
          return { mesh: sMesh, label: nm, ph: (idx / Math.max(1, nodeNames.length)) * TAU };
        });

        if (attr(el, 'show-nodes', '1') !== '0') {
          addCalloutUI(sats.map(function (st, idx) {
            return { target: st.mesh, label: st.label, side: idx % 2 === 0 ? 1 : -1, dynamicSide: true, color: accent };
          }));
        }

        // 锁定瞬间冲击光环
        var pulseGeo = new T.RingGeometry(1.75, 1.92, 64);
        var pulseMat = new T.MeshBasicMaterial({ color: new T.Color(accent), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
        var pulseRing = new T.Mesh(pulseGeo, pulseMat);
        stageRoot.add(pulseRing);

        var shdG = makeContactShadow(T, 2.2, lightMode ? 0.22 : 0.42);
        shdG.mesh.position.y = -2.05;
        scene.add(shdG.mesh);

        S.parts = {
          root: gyroRoot, outer: outer, mid: mid, inner: inner, core: coreP,
          coreLight: coreLight, sats: sats, pulseRing: pulseRing, pulseMat: pulseMat, shadow: shdG
        };
      }

      renderShowcase(S, S.lastLt || 0);
    }

    if (GLB_CACHE[kind]) mountGLB();
    else GLB_WAITERS.push(mountGLB);

    el.__sc3d = S;
    renderShowcase(S, 0);
    return S;
  }

  /* ═════════════════════ 纯函数逐帧确定性解算器 renderShowcase(S, lt) ═════════════════════ */

  function updateCallouts(S, alpha) {
    if (!S.callouts.length) return;
    var a = clamp(alpha, 0, 1);
    var T = S.T, v = new T.Vector3();
    S.callouts.forEach(function (c0, idx) {
      if (a <= 0.01 || !c0.target) {
        c0.tagEl.style.opacity = '0';
        c0.lineEl.style.opacity = '0';
        c0.dotEl.style.opacity = '0';
        return;
      }
      c0.target.updateWorldMatrix(true, false);
      v.copy(c0.offset).applyMatrix4(c0.target.matrixWorld);
      v.project(S.cam);

      var sx = (v.x * 0.5 + 0.5) * S.W;
      var sy = (-v.y * 0.5 + 0.5) * S.H;
      var side = c0.dynamicSide ? (sx >= S.W * 0.5 ? 1 : -1) : c0.side;
      var tw = Math.max(156, c0.tagEl.offsetWidth || 248);
      var elbowY = clamp(sy + (c0.dy || ((idx - (S.callouts.length - 1) / 2) * 12)), 184, S.H - 204);
      var endX = side > 0
        ? clamp(sx + 132, 160, S.W - tw - 96)
        : clamp(sx - 132, tw + 96, S.W - 160);
      var elbowX = lerp(sx, endX, 0.48);

      c0.dotEl.setAttribute('cx', sx.toFixed(1));
      c0.dotEl.setAttribute('cy', sy.toFixed(1));
      c0.dotEl.style.opacity = a.toFixed(3);

      c0.lineEl.setAttribute('points', sx.toFixed(1) + ',' + sy.toFixed(1) + ' ' + elbowX.toFixed(1) + ',' + elbowY.toFixed(1) + ' ' + endX.toFixed(1) + ',' + elbowY.toFixed(1));
      c0.lineEl.style.opacity = (a * 0.85).toFixed(3);

      c0.tagEl.style.opacity = a.toFixed(3);
      if (side > 0) {
        c0.tagEl.style.left = (endX + 12).toFixed(1) + 'px';
        c0.tagEl.style.right = 'auto';
      } else {
        c0.tagEl.style.left = 'auto';
        c0.tagEl.style.right = (S.W - endX + 12).toFixed(1) + 'px';
      }
      c0.tagEl.style.top = elbowY.toFixed(1) + 'px';
    });
  }

  function renderShowcase(S, lt) {
    S.lastLt = lt;
    if (!S.mounted) {
      S.renderer.render(S.scene, S.cam);
      return;
    }

    // 1. 计算基础姿态与 showcase-orbit 运镜叠加
    var rx = S.baseRx, ry = S.baseRy + lt * 0.045, rz = S.baseRz, dist = S.camDist;
    S.orbits.forEach(function (ob) {
      if (lt >= ob.t0) {
        var uo = smoother01(clamp((lt - ob.t0) / Math.max(0.05, ob.dur), 0, 1));
        if (ob.rx !== undefined) rx = lerp(rx, ob.rx * DEG, uo);
        if (ob.ry !== undefined) ry = lerp(ry, ob.ry * DEG, uo);
        if (ob.zoom !== undefined) dist = lerp(dist, S.camDist / Math.max(0.3, ob.zoom), uo);
      }
    });

    S.stageRoot.rotation.set(rx, ry, rz);
    S.cam.position.set(0, 0.14 + S.lookY, dist);
    S.cam.lookAt(0, S.lookY, 0);

    var P = S.parts;

    /* ── 1. chip3d ── */
    if (S.kind === 'chip' && P.layers) {
      var spreadAmt = 0, pulseAmt = 0.25, extraSpin = 0;
      S.cues.forEach(function (q) {
        if (lt < q.t0) return;
        var u = clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1);
        if (q.type === 'chip-explode') {
          var e = outBack(u, 1.12);
          spreadAmt = lerp(spreadAmt, q.spread, e);
          pulseAmt = Math.max(pulseAmt, smooth01(u * 1.4));
          extraSpin += smoother01(u) * q.spin * DEG;
        } else if (q.type === 'chip-assemble') {
          var ea = smoother01(u);
          spreadAmt = lerp(spreadAmt, 0, ea);
          pulseAmt = Math.max(pulseAmt, Math.sin(Math.PI * u));
        }
      });

      S.stageRoot.rotation.y += extraSpin;
      var offsets = [-1.08, -0.52, 0.08, 0.68, 1.32];
      P.layers.forEach(function (ly, idx) {
        if (!ly.node) return;
        ly.node.position.y = ly.y0 + offsets[idx] * spreadAmt;
      });
      P.diePainter.update(pulseAmt, lt);
      P.dieGlow.intensity = 2.6 * pulseAmt;
      S.scene.updateMatrixWorld(true);
      updateCallouts(S, smooth01((spreadAmt - 0.35) / 0.45));
    }

    /* ── 2. laptop3d ── */
    else if (S.kind === 'laptop' && P.lid) {
      var openFrac = P.initOpen, turnRad = 0;
      S.cues.forEach(function (q) {
        if (lt < q.t0) return;
        var u = clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1);
        if (q.type === 'laptop-open') {
          openFrac = lerp(openFrac, q.openTo, smoother01(u));
          turnRad += smoother01(u) * q.turn * DEG;
        } else if (q.type === 'laptop-close') {
          openFrac = lerp(openFrac, 0, smoother01(u));
        }
      });
      S.stageRoot.rotation.y += turnRad;
      // LidPivot.rotation.x = +Math.PI/2 为完全闭合盖平，-0.21 为展开约 102°
      P.lid.rotation.x = lerp(Math.PI / 2, -0.21, openFrac);
      var scrLit = smooth01((openFrac - 0.22) / 0.42);
      P.scrMat.opacity = scrLit;
      P.screenBounce.intensity = scrLit * 1.85;
    }

    /* ── 3. keycap3d ── */
    else if (S.kind === 'keycap' && P.units) {
      var explodeAmt = 0;
      S.cues.forEach(function (q) {
        if (q.type === 'key-explode3d' && lt >= q.t0) {
          var ue = outBack(clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1), 1.15);
          explodeAmt = lerp(explodeAmt, q.spread, ue);
        }
      });

      P.units.forEach(function (uObj, idx) {
        var pressDepth = 0, ringU = 0;
        S.cues.forEach(function (q) {
          if (q.type !== 'key-press3d') return;
          var tLocal = lt - (q.t0 + idx * q.stagger);
          if (tLocal < 0 || tLocal > q.dur * 1.4) return;
          var up = clamp(tLocal / q.dur, 0, 1);
          // 快按慢回弹物理曲线
          var stroke = up < 0.28 ? smoother01(up / 0.28) : 1 - easeOutExpo((up - 0.28) / 0.72);
          pressDepth = Math.max(pressDepth, stroke);
          ringU = Math.max(ringU, up);
        });

        var y0 = uObj.y0;
        var ex = explodeAmt;
        var travel = pressDepth * 0.34 * (1 - clamp(ex, 0, 1));

        if (uObj.bot) uObj.bot.position.y = y0.bot - 0.88 * ex;
        if (uObj.spr) {
          uObj.spr.position.y = y0.spr - 0.44 * ex;
          uObj.spr.scale.y = lerp(1 - pressDepth * 0.44, 1.08, clamp(ex, 0, 1));
        }
        if (uObj.stm) uObj.stm.position.y = y0.stm + 0.08 * ex - travel;
        if (uObj.top) uObj.top.position.y = y0.top + 0.58 * ex;
        if (uObj.cap) uObj.cap.position.y = y0.cap + 1.18 * ex - travel;

        if (uObj.led && uObj.led.material) {
          uObj.led.material.emissiveIntensity = 0.45 + pressDepth * 2.8 + ex * 0.8;
        }
        if (ringU > 0.02 && ringU < 0.99) {
          uObj.ringMesh.visible = true;
          uObj.ringMesh.scale.setScalar(0.85 + ringU * 1.15);
          uObj.ringMat.opacity = (1 - ringU) * 0.85;
        } else {
          uObj.ringMesh.visible = false;
        }
      });
    }

    /* ── 4. rack3d ── */
    else if (S.kind === 'rack' && P.blades) {
      var bootProg = 0;
      var slideTargets = [0, 0, 0, 0];

      S.cues.forEach(function (q) {
        if (lt < q.t0) return;
        var u = clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1);
        if (q.type === 'rack-boot3d') {
          bootProg = Math.max(bootProg, u);
        } else if (q.type === 'blade-slide3d') {
          var es = outBack(u, 1.08);
          if (q.bladeIdx === 0) {
            for (var k = 0; k < 4; k++) slideTargets[k] = lerp(slideTargets[k], 0, smoother01(u));
          } else if (q.bladeIdx >= 1 && q.bladeIdx <= 4) {
            slideTargets[q.bladeIdx - 1] = lerp(slideTargets[q.bladeIdx - 1], q.dist, es);
          }
        }
      });

      P.blades.forEach(function (bl, idx) {
        if (!bl.node) return;
        bl.node.position.z = bl.z0 + slideTargets[idx];
        var lit = bootProg > (3 - idx) * 0.22 || slideTargets[idx] > 0.15;
        if (lit !== bl.hot) {
          bl.hot = lit;
          bl.sMat.map = lit ? bl.texHot : bl.texIdle;
          bl.sMat.needsUpdate = true;
        }
        if (bl.led && bl.led.material) {
          bl.led.material.emissiveIntensity = lit ? (1.2 + slideTargets[idx] * 1.6 + 0.35 * Math.sin(lt * 6 + idx)) : 0.15;
        }
      });

      P.fibers.forEach(function (fb) {
        var fp = smooth01(bootProg * 1.25);
        fb.mesh.visible = fp > 0.01;
        fb.geo.setDrawRange(0, Math.floor((fb.total / 6) * fp) * 6);
      });
    }

    /* ── 5. prism3d ── */
    else if (S.kind === 'prism' && P.crystal) {
      var splitU = 0;
      S.cues.forEach(function (q) {
        if (q.type === 'prism-split3d' && lt >= q.t0) {
          splitU = Math.max(splitU, clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1));
        }
      });

      var hover = Math.sin(lt * 1.6) * 0.08;
      P.crystal.position.y = hover;
      P.crystal.rotation.y = Math.sin(lt * 0.7) * 0.14;
      if (P.core) {
        P.core.position.y = hover;
        P.core.rotation.y = lt * 1.4;
        P.core.rotation.x = lt * 0.9;
        if (P.core.material) P.core.material.emissiveIntensity = 0.35 + splitU * 2.2;
      }

      var inP = smooth01(splitU / 0.36);
      P.inBeam.mesh.visible = inP > 0.01;
      P.inBeam.geo.setDrawRange(0, Math.floor((P.inBeam.total / 6) * inP) * 6);

      var outP = easeOutExpo(clamp((splitU - 0.30) / 0.55, 0, 1));
      P.outBeams.forEach(function (ob) {
        ob.mesh.visible = outP > 0.01;
        ob.geo.setDrawRange(0, Math.floor((ob.total / 6) * outP) * 6);
      });

      S.scene.updateMatrixWorld(true);
      updateCallouts(S, smooth01((splitU - 0.52) / 0.35));
    }

    /* ── 6. gyro3d ── */
    else if (S.kind === 'gyro' && P.outer) {
      var spinMult = 0.25, lockAmt = 0, lockRing = 0;
      S.cues.forEach(function (q) {
        if (lt < q.t0) return;
        var u = clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1);
        if (q.type === 'gyro-spin3d') {
          spinMult = Math.max(spinMult, q.speed);
        } else if (q.type === 'gyro-lock3d') {
          lockAmt = Math.max(lockAmt, smoother01(u));
          lockRing = Math.max(lockRing, u);
        }
      });

      var freeZ = lt * 0.95 * spinMult;
      var freeY = lt * 1.45 * spinMult;
      var freeX = lt * 2.15 * spinMult;

      P.outer.rotation.z = lerp(freeZ, 0, lockAmt);
      if (P.mid) P.mid.rotation.y = lerp(freeY, 0, lockAmt);
      if (P.inner) P.inner.rotation.x = lerp(freeX, 0, lockAmt);
      if (P.core) {
        P.core.rotation.y = lt * 1.2;
        P.core.rotation.z = lt * 0.8;
      }

      P.sats.forEach(function (st, idx) {
        var ang = lt * (0.85 + idx * 0.15) + st.ph;
        var radR = 2.25;
        st.mesh.position.set(Math.cos(ang) * radR, Math.sin(ang * 1.3) * 0.65, Math.sin(ang) * radR * 0.55);
        st.mesh.rotation.y = lt * 2;
      });

      if (lockRing > 0.02 && lockRing < 0.99) {
        P.pulseRing.visible = true;
        P.pulseRing.scale.setScalar(0.85 + lockRing * 0.85);
        P.pulseMat.opacity = (1 - lockRing) * 0.9;
      } else {
        P.pulseRing.visible = false;
      }

      S.scene.updateMatrixWorld(true);
      updateCallouts(S, P.sats.length ? 0.92 : 0);
    }

    S.renderer.render(S.scene, S.cam);
  }

  function bindShowcase(c, defaultKind) {
    var S = c.el.__sc3d || initShowcase(c.el, defaultKind);
    var s0 = c.scene ? c.scene.t : 0;
    var sDur = c.scene ? c.scene.d : (c.sceneDur || c.total);
    var hold = c.scene ? Math.max(0.8, c.scene.hold || 0) : 0;
    var span = Math.min(c.total - s0, sDur + hold);
    S.sceneStart = s0;
    S.sceneDur = sDur;
    if (!S.driver) {
      S.driver = true;
      var tl = c.tl;
      var tick = function () {
        var gt = tl.time();
        if (gt < s0 - 0.15 || gt > s0 + span + 0.25) return;
        renderShowcase(S, clamp(gt - s0, 0, span));
      };
      tl.to({ u: 0 }, { u: 1, duration: Math.max(0.1, span), ease: 'none', onUpdate: tick }, s0);
    }
    return S;
  }

  /* ═════════════════════ 注册 6 个组件生成器（FX.make） ═════════════════════ */

  FX.make.chip3d = function (el) { if (g.THREE) initShowcase(el, 'chip'); };
  FX.make.laptop3d = function (el) { if (g.THREE) initShowcase(el, 'laptop'); };
  FX.make.keycap3d = function (el) { if (g.THREE) initShowcase(el, 'keycap'); };
  FX.make.rack3d = function (el) { if (g.THREE) initShowcase(el, 'rack'); };
  FX.make.prism3d = function (el) { if (g.THREE) initShowcase(el, 'prism'); };
  FX.make.gyro3d = function (el) { if (g.THREE) initShowcase(el, 'gyro'); };

  /* ═════════════════════ 注册 12 个声明式工业级 3D 特效（FX.register） ═════════════════════ */

  var def = function (name, desc, fn) { FX.register(name, CAT, desc, fn); };

  def('chip-explode', '苹果发布会风 3D 芯片五层爆炸拆解：写在 data-make="chip3d" 上，镀金 BGA 触点、纤维基板、发光神经网络晶圆、CNC 铝合金环与拉丝钛盖沿轴向磁悬浮逐层拉开，并自动弹出三维锚点引线标签。参数 dur（默认 1.4）、spread（默认 1）、spin（旋转度数，默认 18）', function (c) {
    var S = bindShowcase(c, 'chip');
    S.cues.push({ type: 'chip-explode', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.4), spread: num(c.o.spread, 1), spin: num(c.o.spin, 18) });
    renderShowcase(S, 0);
  });

  def('chip-assemble', '3D 芯片算力脉冲合拢：写在 data-make="chip3d" 上，硅晶核心爆发流光脉冲后五层精密封装磁吸归位闭合。参数 dur（默认 1.1）', function (c) {
    var S = bindShowcase(c, 'chip');
    S.cues.push({ type: 'chip-assemble', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.1) });
    renderShowcase(S, 0);
  });

  def('laptop-open', '3D 超薄铝金属笔记本转轴开盖点亮：写在 data-make="laptop3d" 上，绕真实后转轴缓缓掀开顶盖至 102°，高清屏幕亮起并将环境光投射到 65 颗实体键帽上。参数 dur（默认 1.5）、open（0..1，默认 1）、turn（机身旋转度数，默认 22）', function (c) {
    var S = bindShowcase(c, 'laptop');
    S.cues.push({ type: 'laptop-open', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.5), openTo: num(c.o.open, 1), turn: num(c.o.turn, 22) });
    renderShowcase(S, 0);
  });

  def('laptop-close', '3D 笔记本合盖归位：写在 data-make="laptop3d" 上，顶盖绕转轴平滑合拢。参数 dur（默认 1.1）', function (c) {
    var S = bindShowcase(c, 'laptop');
    S.cues.push({ type: 'laptop-close', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.1) });
    renderShowcase(S, 0);
  });

  def('key-press3d', '客制化机械轴微距清脆敲击：写在 data-make="keycap3d" 上，球面键帽与十字轴心下压、镀金三维螺旋弹簧真实物理压缩，触发底部导光冲击波后快速回弹（多键联排时自动错峰连敲）。参数 dur（默认 0.55）、stagger（默认 0.14）', function (c) {
    var S = bindShowcase(c, 'keycap');
    S.cues.push({ type: 'key-press3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 0.55), stagger: num(c.o.stagger, 0.14) });
    renderShowcase(S, 0);
  });

  def('key-explode3d', '机械轴五层微距纵向拆解：写在 data-make="keycap3d" 上，将球面键帽、冰透上盖、暖橙十字轴心、镀金螺旋弹簧与烟熏底壳在空中等距悬停分解。参数 dur（默认 1.3）、spread（默认 1）', function (c) {
    var S = bindShowcase(c, 'keycap');
    S.cues.push({ type: 'key-explode3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.3), spread: num(c.o.spread, 1) });
    renderShowcase(S, 0);
  });

  def('rack-boot3d', 'AI 算力机柜逐层点火与光纤流：写在 data-make="rack3d" 上，4 台服务器刀片自下而上依次点亮 OLED 负载屏与状态灯，两侧光纤涌入能量脉冲。参数 dur（默认 1.5）', function (c) {
    var S = bindShowcase(c, 'rack');
    S.cues.push({ type: 'rack-boot3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.5) });
    renderShowcase(S, 0);
  });

  def('blade-slide3d', '服务器热插拔刀片抽出特写：写在 data-make="rack3d" 上，将第 i 号服务器刀片（1..4；i=0 全部推回）沿机柜导轨平滑向前抽出展示。参数 i（默认 2）、dist（默认 0.92）、dur（默认 0.9）', function (c) {
    var S = bindShowcase(c, 'rack');
    S.cues.push({ type: 'blade-slide3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 0.9), bladeIdx: num(c.o.i, 2), dist: num(c.o.dist, 0.92) });
    renderShowcase(S, 0);
  });

  def('prism-split3d', '光学水晶三棱镜激光色散分束：写在 data-make="prism3d" 上，入射白光击中悬浮水晶棱镜点亮八面体晶核，并在右侧折射展开为多路彩色光谱束与路由标签。参数 dur（默认 1.6）', function (c) {
    var S = bindShowcase(c, 'prism');
    S.cues.push({ type: 'prism-split3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.6) });
    renderShowcase(S, 0);
  });

  def('gyro-spin3d', '三轴万向陀螺中枢差速运转：写在 data-make="gyro3d" 上，外刻度环、中轴承环、镀金内环与中心晶核沿正交三轴无死锁旋转，卫星节点环绕运行。参数 dur（默认 4.0）、speed（默认 1）', function (c) {
    var S = bindShowcase(c, 'gyro');
    S.cues.push({ type: 'gyro-spin3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 4.0), speed: num(c.o.speed, 1) });
    renderShowcase(S, 0);
  });

  def('gyro-lock3d', '万向环同心归零磁吸锁定：写在 data-make="gyro3d" 上，三道高速运转的金属万向环瞬间归零对齐并向外扩散能量冲击环。参数 dur（默认 0.95）', function (c) {
    var S = bindShowcase(c, 'gyro');
    S.cues.push({ type: 'gyro-lock3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 0.95) });
    renderShowcase(S, 0);
  });

  def('showcase-orbit', '3D 硬件展台长焦环绕推镜：配合 chip3d / laptop3d / keycap3d / rack3d / prism3d / gyro3d 平滑切换俯仰角、水平转角与推进倍率。参数 rx、ry、zoom（默认 1.18）、dur（默认 1.5）', function (c) {
    var S = bindShowcase(c, 'chip');
    S.orbits.push({
      t0: c.t - S.sceneStart,
      dur: num(c.o.dur, 1.5),
      rx: c.o.rx !== undefined ? +c.o.rx : undefined,
      ry: c.o.ry !== undefined ? +c.o.ry : undefined,
      zoom: c.o.zoom !== undefined ? +c.o.zoom : undefined
    });
    renderShowcase(S, 0);
  });

})(typeof window !== 'undefined' ? window : globalThis, typeof document !== 'undefined' ? document : undefined);
