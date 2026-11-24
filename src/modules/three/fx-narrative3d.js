/*!
 * FX 口播黄金叙事 3D 结构动效组合模块 v1.0 (fx-narrative3d.js)
 * SPDX-License-Identifier: MIT
 *
 * 专为口播讲解视频（科技科普、商业拆解、认知升级、效率工具、职场干货）打造的 6 套高留存「真 3D 叙事结构组合」。
 * 借鉴影视飓风硬核三维逻辑包装、Vox 空间视觉隐喻与 Apple 发布会柔光棚质感，
 * 基于 assets/narrative3d/ 下 6 套多关节可动 Blender .glb 模型 + 多拍连续镜头编排：
 *
 *   6 个口播叙事组件生成器（data-make）：
 *     1. iceberg3d —— 3D 冰山表象与深潜组合（水上 10% 洁白冰尖 → 镜头穿水深潜揭露水下 90% 三层发光巨体）
 *     2. domino3d  —— 3D 弧形骨牌连锁与护盾截停组合（多块倒角骨牌逐块倾倒跟拍 → 重型金属护盾从天而降硬核截停）
 *     3. scale3d   —— 3D 双盘天平四两拨千斤反杀组合（传统重锤砸下左倾 → 高能晶核落入右盘瞬间逆转反超）
 *     4. funnel3d  —— 3D 三层涡流漏斗残酷提纯组合（海量原始碎块龙卷吸入三道滤环 → 底部凝结唯一纯金结论核）
 *     5. vault3d   —— 3D 重型装甲金库破译开门组合（双层密码棘轮反向咬合解锁 → 厚重铰链门洞开推镜揭晓核心底牌）
 *     6. pyramid3d —— 3D 四阶悬浮金字塔登顶加冕组合（三层基座逐级磁吸筑基 → 塔尖晶冠降临点亮全景俯瞰）
 *
 *   13 个声明式 3D 连招特效（data-fx，分类：3D）：
 *     ice-tip3d · ice-dive3d · domino-fall3d · domino-shield3d ·
 *     scale-drop3d · scale-flip3d · funnel-pour3d · funnel-distill3d ·
 *     vault-unlock3d · vault-open3d · pyramid-build3d · pyramid-crown3d · narrative-cam3d
 */
(function (g, doc) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-narrative3d：请先加载 fx.js');

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
  var dampedSpring = function (u) {
    u = clamp(u, 0, 1);
    if (u <= 0 || u >= 1) return u;
    return 1 - Math.exp(-6.2 * u) * Math.cos(10.5 * u);
  };

  function d() { return doc || g.document; }
  function mk(tag, cls) { var e = d().createElement(tag); if (cls) e.className = cls; return e; }
  function attr(el, k, defVal) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? defVal : v; }
  function splitItems(s) {
    var raw = String(s || '');
    return (raw.indexOf('|') >= 0 ? raw.split('|') : raw.split(',')).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function parseTilt(s, defArr) {
    if (!s) return defArr.slice();
    var p = String(s).split(',').map(Number);
    return [num(p[0], defArr[0]), num(p[1], defArr[1]), num(p[2], defArr[2])];
  }

  function holdRender(promise) {
    if (!promise || typeof promise.then !== 'function') return;
    var hf = g.__hf = g.__hf || {};
    hf.buildReady = hf.buildReady || {};
    hf.buildReady['fx-narrative3d-' + (++READY_SEQ)] = promise;
  }

  /* ═════════════════════ 离线/在线双模 GLB 加载与柔光棚 HDR 反射 ═════════════════════ */

  var MODEL_FILES = {
    iceberg: 'iceberg.glb',
    domino: 'domino-arc.glb',
    scale: 'balance-scale.glb',
    funnel: 'vortex-funnel.glb',
    vault: 'cyber-vault.glb',
    pyramid: 'tier-pyramid.glb'
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

  function resolveNarrativeBase() {
    if (!d() || !d().querySelectorAll) return 'lib/assets/narrative3d/';
    var scripts = d().querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src') || '';
      var m = /^(.*\/)fx-narrative3d\.js(?:\?.*)?$/.exec(s);
      if (m) return m[1] + 'assets/narrative3d/';
    }
    return 'lib/assets/narrative3d/';
  }

  function ensureNarrativeGLBs() {
    if (GLB_PROMISE) return GLB_PROMISE;
    var T = g.THREE, V = g.THREE_VRM;
    var LoaderCls = (T && T.GLTFLoader) || (V && V.GLTFLoader);
    if (!LoaderCls) {
      GLB_PROMISE = Promise.resolve(false);
      return GLB_PROMISE;
    }
    var loader = new LoaderCls();
    var bank = g.FX_NARRATIVE3D_GLB || null;
    var base = resolveNarrativeBase();
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

  function buildNarrativeEnvMap(T, renderer, isLightTheme) {
    var cv = mk('canvas'); cv.width = 1024; cv.height = 512;
    var ctx = cv.getContext('2d');

    var bg = ctx.createLinearGradient(0, 0, 0, 512);
    if (isLightTheme) {
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.48, '#f1f5f9');
      bg.addColorStop(1, '#cbd5e1');
    } else {
      bg.addColorStop(0, '#1e293b');
      bg.addColorStop(0.45, '#0f172a');
      bg.addColorStop(1, '#020617');
    }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 512);

    var topSoft = ctx.createRadialGradient(512, 68, 20, 512, 68, 350);
    topSoft.addColorStop(0, 'rgba(255,255,255,1)');
    topSoft.addColorStop(0.5, 'rgba(226,232,240,0.72)');
    topSoft.addColorStop(1, 'rgba(226,232,240,0)');
    ctx.fillStyle = topSoft; ctx.fillRect(80, 6, 864, 180);

    var coolStrip = ctx.createLinearGradient(100, 0, 260, 0);
    coolStrip.addColorStop(0, 'rgba(56,189,248,0)');
    coolStrip.addColorStop(0.5, 'rgba(186,230,253,0.92)');
    coolStrip.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.fillStyle = coolStrip; ctx.fillRect(100, 75, 160, 330);

    var goldStrip = ctx.createLinearGradient(760, 0, 920, 0);
    goldStrip.addColorStop(0, 'rgba(251,191,36,0)');
    goldStrip.addColorStop(0.5, 'rgba(254,243,199,0.90)');
    goldStrip.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = goldStrip; ctx.fillRect(760, 85, 160, 320);

    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillRect(410, 188, 204, 14);

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

  /* ═════════════════════ 高清程序化铭牌 / 骨牌 / 秘籍晶碑贴图工坊 ═════════════════════ */

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

  /* 骨牌正面贴图（DominoUnit > ScreenSurface, 0.76 x 1.30） */
  function makeDominoFaceTexture(T, idx, titleStr, isHero, accentHex) {
    var W = 512, H = 880;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    if (isHero) {
      bg.addColorStop(0, '#062c24');
      bg.addColorStop(1, '#09191f');
    } else {
      bg.addColorStop(0, '#131b2e');
      bg.addColorStop(1, '#0b101d');
    }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    var borderCol = isHero ? '#34d399' : (accentHex || '#f97316');
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 8;
    roundRect(ctx, 20, 20, W - 40, H - 40, 32);
    ctx.stroke();

    // 顶部大序号胶囊
    ctx.fillStyle = borderCol;
    roundRect(ctx, 56, 64, 152, 70, 35);
    ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.font = '900 42px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0' + (idx + 1), 132, 100);

    // 纵向/分行大字标题
    ctx.fillStyle = '#f8fafc';
    var clean = String(titleStr || ('节点 ' + (idx + 1)));
    if (clean.length <= 4) {
      ctx.font = '900 94px "Inter", sans-serif';
      for (var c0 = 0; c0 < clean.length; c0++) {
        ctx.fillText(clean[c0], W / 2, 260 + c0 * 124);
      }
    } else {
      var mid = Math.ceil(clean.length / 2);
      ctx.font = '900 76px "Inter", sans-serif';
      ctx.fillText(clean.slice(0, mid), W / 2, 395);
      ctx.fillText(clean.slice(mid), W / 2, 505);
    }

    // 底部装饰刻度条
    ctx.fillStyle = isHero ? 'rgba(52,211,153,0.35)' : 'rgba(249,115,22,0.28)';
    roundRect(ctx, 64, H - 104, W - 128, 22, 11);
    ctx.fill();

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* 天平砝码与晶核铭牌贴图 */
  function makeScaleBadgeTexture(T, textStr, bgHex, borderHex) {
    var W = 512, H = 240;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = bgHex; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = borderHex; ctx.lineWidth = 8;
    roundRect(ctx, 12, 12, W - 24, H - 24, 24); ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 68px "Inter", "JetBrains Mono", sans-serif';
    ctx.fillText(String(textStr || '').slice(0, 8), W / 2, H / 2 + 4);

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* 金库内部秘籍石碑贴图（RelicTablet > ScreenSurface, 1.36 x 0.76） */
  function makeVaultRelicTexture(T, secretRaw, badgeStr, accentHex) {
    var W = 1280, H = 720;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0d1526');
    bg.addColorStop(0.5, '#111c33');
    bg.addColorStop(1, '#090e1a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    var ac = accentHex || '#fbbf24';
    ctx.strokeStyle = ac; ctx.lineWidth = 8;
    roundRect(ctx, 28, 28, W - 56, H - 56, 36); ctx.stroke();

    ctx.strokeStyle = 'rgba(251,191,36,0.24)'; ctx.lineWidth = 2;
    roundRect(ctx, 50, 50, W - 100, H - 100, 24); ctx.stroke();

    var parts = String(secretRaw || '爆款底层公式|黄金 3 秒 × 情绪钩子 × 结构留存').split('|');

    // 顶栏 CORE SECRET 胶囊
    ctx.fillStyle = ac;
    roundRect(ctx, W / 2 - 220, 86, 440, 58, 29); ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 30px "JetBrains Mono", monospace';
    ctx.fillText(badgeStr || 'CORE FORMULA · 核心底牌', W / 2, 116);

    // 主结论大字
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 108px "Inter", sans-serif';
    ctx.fillText(parts[0] || '核心铁律', W / 2, 336);

    if (parts[1]) {
      ctx.fillStyle = ac;
      ctx.font = '800 54px "Inter", "JetBrains Mono", sans-serif';
      ctx.fillText(parts[1], W / 2, 492);
    }

    // 底部发光装饰细线
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, W / 2 - 260, 602, 520, 8, 4); ctx.fill();

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* 金字塔阶梯正面铭牌贴图（PyramidTier_1..3 > ScreenSurface_1..3） */
  function makePyramidStepTexture(T, stepIdx, labelStr, accentHex, active) {
    var W = 960, H = 220;
    var cv = mk('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    ctx.fillStyle = active ? '#0f172a' : '#090d16';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = active ? (accentHex || '#fbbf24') : '#334155';
    ctx.lineWidth = 7;
    roundRect(ctx, 10, 10, W - 20, H - 20, 22);
    ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = active ? '#f8fafc' : '#94a3b8';
    ctx.font = '900 68px "Inter", "JetBrains Mono", sans-serif';
    ctx.fillText(labelStr || ('LEVEL 0' + stepIdx), W / 2, H / 2 + 4);

    var tex = new T.CanvasTexture(cv);
    if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  var SOFT_SHADOW_TEX = null;
  function makeContactShadow(T, radius, baseOpacity) {
    if (!SOFT_SHADOW_TEX) {
      var cv = mk('canvas'); cv.width = 256; cv.height = 256;
      var ctx = cv.getContext('2d');
      var g0 = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
      g0.addColorStop(0, 'rgba(2, 6, 23, 0.58)');
      g0.addColorStop(0.5, 'rgba(2, 6, 23, 0.22)');
      g0.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = g0; ctx.fillRect(0, 0, 256, 256);
      SOFT_SHADOW_TEX = new T.CanvasTexture(cv);
    }
    var mat = new T.MeshBasicMaterial({ map: SOFT_SHADOW_TEX, transparent: true, opacity: baseOpacity || 0.44, depthWrite: false });
    var mesh = new T.Mesh(new T.PlaneGeometry(radius * 2, radius * 2), mat);
    mesh.rotation.x = -Math.PI / 2;
    return { mesh: mesh, mat: mat };
  }

  function makeShockRing(T, rIn, rOut, colorHex) {
    var geo = new T.RingGeometry(rIn, rOut, 64);
    geo.rotateX(-Math.PI / 2);
    var mat = new T.MeshBasicMaterial({ color: new T.Color(colorHex), transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
    var mesh = new T.Mesh(geo, mat);
    mesh.visible = false;
    return { mesh: mesh, mat: mat };
  }

  /* ═════════════════════ 展台初始化与 6 大口播叙事实体装配 ═════════════════════ */

  function isLightSkin(el) {
    var st = d().querySelector('[data-composition-id]');
    var cls = ((el && el.className) || '') + ' ' + ((st && st.className) || '');
    return /theme-(white3d|violet|paper)/.test(cls) && !/\.dark\b|\bdark\b/.test(el.parentElement ? el.parentElement.className : '');
  }

  function initNarrative(el, kind) {
    if (el.__nr3d) return el.__nr3d;
    var T = g.THREE;
    if (!T) throw new Error('fx-narrative3d：请先加载 vendor/three-fx.min.js');
    ensureNarrativeGLBs();

    var W = el.offsetWidth || 1920, H = el.offsetHeight || 1080;
    var lightMode = isLightSkin(el);
    var defAccents = {
      iceberg: '#38bdf8',
      domino: '#f97316',
      scale: '#fbbf24',
      funnel: '#a78bfa',
      vault: '#34d399',
      pyramid: '#fbbf24'
    };
    var accent = attr(el, 'accent', defAccents[kind] || '#38bdf8');

    Array.prototype.slice.call(el.children || []).forEach(function (ch) {
      ch.style.display = 'none';
      ch.setAttribute('data-lint', 'off');
    });

    el.classList.add('fx-showcase3d', 'fx-narrative3d');
    el.setAttribute('data-lint', 'content');

    var dpr = clamp(num(attr(el, 'dpr'), 1.5), 1, 2);
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    if (T.SRGBColorSpace) renderer.outputColorSpace = T.SRGBColorSpace;
    if (T.ACESFilmicToneMapping) {
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = lightMode ? 1.06 : 1.20;
    }
    renderer.setClearColor(0x000000, 0);
    el.insertBefore(renderer.domElement, el.firstChild);

    // 三维锚点投影引线胶囊叠加层
    var overlay = mk('div', 'fx-sc3d-overlay');
    overlay.setAttribute('data-lint', 'off');
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = d().createElementNS ? d().createElementNS(svgNS, 'svg') : mk('svg');
    svg.setAttribute('class', 'fx-sc3d-svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    overlay.appendChild(svg);
    el.appendChild(overlay);

    var scene = new T.Scene();
    scene.environment = buildNarrativeEnvMap(T, renderer, lightMode);

    var cam = new T.PerspectiveCamera(num(attr(el, 'fov'), 32), W / H, 0.1, 120);

    scene.add(new T.HemisphereLight(0xffffff, lightMode ? 0xcbd5e1 : 0x0f172a, lightMode ? 1.15 : 0.88));
    var keyLight = new T.DirectionalLight(0xfffdf8, lightMode ? 1.45 : 2.15);
    keyLight.position.set(-4.8, 7.8, 6.8);
    scene.add(keyLight);

    var rimCool = new T.DirectionalLight(0x7dd3fc, lightMode ? 0.55 : 1.40);
    rimCool.position.set(5.8, 3.4, -4.5);
    scene.add(rimCool);

    var rimWarm = new T.DirectionalLight(0xfcd34d, lightMode ? 0.45 : 0.95);
    rimWarm.position.set(-5.2, -2.2, -3.5);
    scene.add(rimWarm);

    var stageRoot = new T.Group();
    scene.add(stageRoot);

    var defaultTilts = {
      iceberg: [10, -18, 0],
      domino: [20, -24, 0],
      scale: [10, -12, 0],
      funnel: [24, -18, 0],
      vault: [6, -14, 0],
      pyramid: [18, -24, 0]
    };
    var defaultDists = { iceberg: 10.6, domino: 10.6, scale: 10.8, funnel: 10.8, vault: 8.8, pyramid: 11.6 };
    var tilt0 = parseTilt(attr(el, 'tilt', ''), defaultTilts[kind] || [16, -20, 0]);

    var S = {
      el: el, T: T, W: W, H: H, kind: kind, lightMode: lightMode, accent: accent,
      renderer: renderer, scene: scene, cam: cam, stageRoot: stageRoot,
      overlay: overlay, svg: svg, callouts: [],
      baseRx: tilt0[0] * DEG, baseRy: tilt0[1] * DEG, baseRz: tilt0[2] * DEG,
      camDist: num(attr(el, 'dist'), defaultDists[kind] || 10.4),
      lookY: num(attr(el, 'look-y'), 0.0),
      parts: {}, mounted: false, cues: [], cams: [],
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
        var col = item.color || accent;
        var lineEl = d().createElementNS(svgNS, 'polyline');
        lineEl.setAttribute('fill', 'none');
        lineEl.setAttribute('stroke', col);
        lineEl.setAttribute('stroke-width', '2.2');
        lineEl.setAttribute('stroke-linecap', 'round');
        svg.appendChild(lineEl);

        var dotEl = d().createElementNS(svgNS, 'circle');
        dotEl.setAttribute('r', '5');
        dotEl.setAttribute('fill', col);
        svg.appendChild(dotEl);

        var tagEl = mk('div', 'fx-sc3d-tag' + (lightMode ? ' is-light' : ''));
        tagEl.style.setProperty('--sc-dot', col);
        tagEl.innerHTML = '<i></i>' + item.label;
        tagEl.style.opacity = '0';
        tagEl.style.transform = 'translateY(-50%)';
        overlay.appendChild(tagEl);

        S.callouts.push({
          group: item.group || 'all',
          target: item.target,
          offset: item.offset || new T.Vector3(0, 0, 0),
          side: item.side || 1,
          dynamicSide: !!item.dynamicSide,
          dy: item.dy || 0,
          alpha: 0,
          lineEl: lineEl, dotEl: dotEl, tagEl: tagEl
        });
      });
    }

    function mountGLB() {
      if (S.mounted || !GLB_CACHE[kind]) return;
      S.mounted = true;
      while (stageRoot.children.length) stageRoot.remove(stageRoot.children[0]);

      /* ── 1. iceberg3d（水上 10% 冰尖 vs 水下 90% 深海巨体） ── */
      if (kind === 'iceberg') {
        var iceRoot = GLB_CACHE.iceberg.clone(true);
        iceRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        stageRoot.add(iceRoot);

        var tip = iceRoot.getObjectByName('SurfaceTip');
        var water = iceRoot.getObjectByName('WaterDisk');
        var d1 = iceRoot.getObjectByName('DeepTier_1');
        var d2 = iceRoot.getObjectByName('DeepTier_2');
        var d3 = iceRoot.getObjectByName('DeepTier_3');
        var abyssCore = iceRoot.getObjectByName('AbyssCore');

        if (water) {
          water.traverse(function (n) {
            if (n.isMesh && /^WaterDisk/.test(n.name) && T.MeshPhysicalMaterial) {
              n.material = new T.MeshPhysicalMaterial({
                color: new T.Color('#38bdf8'),
                roughness: 0.08, metalness: 0.05,
                transmission: 0.84, thickness: 0.5, ior: 1.33,
                transparent: true, opacity: 0.78
              });
            }
          });
        }

        var abyssLight = new T.PointLight(new T.Color(accent), 0, 6.5);
        abyssLight.position.set(0, -1.55, 0.8);
        iceRoot.add(abyssLight);

        var sonar = makeShockRing(T, 1.05, 1.22, '#38bdf8');
        sonar.mesh.position.y = 0.04;
        iceRoot.add(sonar.mesh);

        var tipLbl = attr(el, 'tip', '表面现象 · 仅占 10%');
        var depthLbls = splitItems(attr(el, 'depths', '隐性算力与工程调度|私有行业数据护城河|自动化工作流闭环 · 90%'));
        var cItems = [];
        if (tip && tipLbl !== 'off') {
          cItems.push({ group: 'tip', target: tip, label: tipLbl, side: 1, color: '#f8fafc', offset: new T.Vector3(0.58, 0.68, 0) });
        }
        [d1, d2, d3].forEach(function (dn, idx) {
          if (dn && depthLbls[idx]) {
            cItems.push({
              group: 'deep-' + idx,
              target: dn,
              label: depthLbls[idx],
              side: idx % 2 === 0 ? -1 : 1,
              color: idx === 2 ? '#fbbf24' : '#38bdf8',
              offset: new T.Vector3(idx % 2 === 0 ? -1.08 : 1.08, 0, 0)
            });
          }
        });
        addCalloutUI(cItems);

        S.parts = {
          root: iceRoot, tip: tip, water: water,
          deeps: [d1, d2, d3],
          deepY0: [d1 ? d1.position.y : -0.52, d2 ? d2.position.y : -1.44, d3 ? d3.position.y : -2.32],
          abyssCore: abyssCore, abyssLight: abyssLight, sonar: sonar
        };

      /* ── 2. domino3d（弧形多米诺骨牌雪崩 + 重装护盾截停） ── */
      } else if (kind === 'domino') {
        var srcDom = GLB_CACHE.domino;
        var unitProto = srcDom.getObjectByName('DominoUnit');
        var shieldProto = srcDom.getObjectByName('ShieldGate');

        var tileLabels = splitItems(attr(el, 'tiles', '选题自嗨|完播暴跌|推荐断崖|流量归零|长效资产'));
        var nT = Math.max(3, tileLabels.length);
        var tiles = [];

        // 沿左后向右前方的黄金宽银幕微弧排布，让每块骨牌横向拉开、正面可读且前倾撞击下一块
        var stepDist = 1.28;
        var pts = [{ x: 0, z: 0, yaw: 1.02 }];
        for (var i = 1; i < nT; i++) {
          var prev = pts[i - 1];
          var yaw = lerp(1.02, 0.68, i / Math.max(1, nT - 1));
          pts.push({
            x: prev.x + Math.sin(prev.yaw) * stepDist,
            z: prev.z + Math.cos(prev.yaw) * stepDist,
            yaw: yaw
          });
        }
        var cx = (pts[0].x + pts[nT - 1].x) * 0.5;
        var cz = (pts[0].z + pts[nT - 1].z) * 0.5;

        pts.forEach(function (pt, idx) {
          var isLast = idx === nT - 1;
          var slot = new T.Group();
          slot.position.set(pt.x - cx, -0.95, pt.z - cz);
          slot.rotation.y = pt.yaw;
          stageRoot.add(slot);

          var uClone = unitProto.clone(true);
          uClone.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
          uClone.position.set(0, 0, 0);
          slot.add(uClone);

          var scr = uClone.getObjectByName('ScreenSurface');
          if (scr) {
            scr.material = new T.MeshBasicMaterial({
              map: makeDominoFaceTexture(T, idx, tileLabels[idx], isLast, accent),
              toneMapped: false
            });
          }
          var topBar = uClone.getObjectByName('TopBar');
          if (topBar && topBar.material) {
            topBar.material.emissive = new T.Color(isLast ? '#34d399' : accent);
            topBar.material.emissiveIntensity = 0.35;
          }

          var shdT = makeContactShadow(T, 0.78, lightMode ? 0.22 : 0.40);
          shdT.mesh.position.set(pt.x - cx, -0.96, pt.z - cz);
          stageRoot.add(shdT.mesh);

          tiles.push({ slot: slot, mesh: uClone, topBar: topBar, x: pt.x - cx, z: pt.z - cz, yaw: pt.yaw });
        });

        // 护盾闸门插在倒数第 2 块与最后 1 块之间
        var shieldGroup = new T.Group();
        var aTile = tiles[nT - 2], bTile = tiles[nT - 1];
        shieldGroup.position.set(lerp(aTile.x, bTile.x, 0.56), -0.95, lerp(aTile.z, bTile.z, 0.56));
        shieldGroup.rotation.y = lerp(aTile.yaw, bTile.yaw, 0.5);
        stageRoot.add(shieldGroup);

        var shieldMesh = shieldProto.clone(true);
        shieldMesh.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        shieldMesh.visible = false;
        shieldGroup.add(shieldMesh);

        var shieldRing = makeShockRing(T, 0.85, 1.12, '#38bdf8');
        shieldRing.mesh.position.set(shieldGroup.position.x, -0.93, shieldGroup.position.z);
        stageRoot.add(shieldRing.mesh);

        var shieldLbl = attr(el, 'shield', '关键风控防线 · 截停崩塌');
        if (shieldLbl !== 'off') {
          addCalloutUI([
            { group: 'shield', target: shieldMesh, label: shieldLbl, side: -1, color: '#38bdf8', offset: new T.Vector3(-0.65, 1.65, 0) },
            { group: 'hero', target: bTile.mesh, label: tileLabels[nT - 1] + ' · 毫发无损', side: 1, color: '#34d399', offset: new T.Vector3(0.42, 1.35, 0) }
          ]);
        }

        S.parts = { tiles: tiles, shieldGroup: shieldGroup, shieldMesh: shieldMesh, shieldRing: shieldRing };

      /* ── 3. scale3d（双盘精密天平：传统重锤 vs 四两拨千斤反杀） ── */
      } else if (kind === 'scale') {
        var scRoot = GLB_CACHE.scale.clone(true);
        scRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        scRoot.position.y = -0.08;
        stageRoot.add(scRoot);

        var beam = scRoot.getObjectByName('BeamArm');
        var needle = scRoot.getObjectByName('DialNeedle');
        var lPan = scRoot.getObjectByName('LeftPanPivot');
        var rPan = scRoot.getObjectByName('RightPanPivot');
        var lWeight = scRoot.getObjectByName('LeftWeight');
        var rCore = scRoot.getObjectByName('RightCore');
        var lSurf = scRoot.getObjectByName('LeftSurface');
        var rSurf = scRoot.getObjectByName('RightSurface');

        var leftSpec = attr(el, 'left', '堆人力苦肝|低效内耗').split('|');
        var rightSpec = attr(el, 'right', 'AI 杠杆系统|10× 降维反杀').split('|');

        if (lSurf) lSurf.material = new T.MeshBasicMaterial({ map: makeScaleBadgeTexture(T, leftSpec[0], '#1e1b2e', '#f43f5e'), toneMapped: false });
        if (rSurf) rSurf.material = new T.MeshBasicMaterial({ map: makeScaleBadgeTexture(T, rightSpec[0], '#1e1b12', '#fbbf24'), toneMapped: false });

        var coreGlow = new T.PointLight(new T.Color(accent), 0, 5.2);
        if (rCore) rCore.add(coreGlow);

        var flipRing = makeShockRing(T, 0.65, 0.88, accent);
        if (rPan) { flipRing.mesh.position.set(0, -0.45, 0); rPan.add(flipRing.mesh); }

        var shdS = makeContactShadow(T, 2.3, lightMode ? 0.26 : 0.48);
        shdS.mesh.position.y = -1.92;
        scene.add(shdS.mesh);

        addCalloutUI([
          { group: 'left', target: lWeight || lPan, label: leftSpec.join(' · '), side: -1, color: '#fb7185', offset: new T.Vector3(-0.45, 0.25, 0) },
          { group: 'right', target: rCore || rPan, label: rightSpec.join(' · '), side: 1, color: accent, offset: new T.Vector3(0.45, 0.25, 0) }
        ]);

        S.parts = {
          root: scRoot, beam: beam, needle: needle, lPan: lPan, rPan: rPan,
          lWeight: lWeight, rCore: rCore,
          lY0: lWeight ? lWeight.position.y : -1.02,
          rY0: rCore ? rCore.position.y : -1.04,
          coreGlow: coreGlow, flipRing: flipRing
        };

      /* ── 4. funnel3d（三层涡流过滤漏斗 + 纯金结论结晶） ── */
      } else if (kind === 'funnel') {
        var fnRoot = GLB_CACHE.funnel.clone(true);
        fnRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        stageRoot.add(fnRoot);

        var f1 = fnRoot.getObjectByName('FunnelTier_1');
        var f2 = fnRoot.getObjectByName('FunnelTier_2');
        var f3 = fnRoot.getObjectByName('FunnelTier_3');
        var baseC = fnRoot.getObjectByName('CollectorBase');
        var gCore = fnRoot.getObjectByName('GoldenCore');
        var shardProto = fnRoot.getObjectByName('RawShard');
        if (shardProto) shardProto.visible = false;

        if (f2) {
          f2.traverse(function (n) {
            if (n.isMesh && /^FunnelTier_2_1/.test(n.name) && T.MeshPhysicalMaterial) {
              n.material = new T.MeshPhysicalMaterial({
                color: new T.Color('#60a5fa'), roughness: 0.1, metalness: 0.05,
                transmission: 0.78, thickness: 0.6, transparent: true, opacity: 0.82
              });
            }
          });
        }

        // 确定性生成 30 颗多色原始噪点碎块，形成三维龙卷涡流
        var shardGroup = new T.Group();
        fnRoot.add(shardGroup);
        var shardColors = ['#64748b', '#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];
        var shards = [];
        for (var si = 0; si < 30; si++) {
          var sMesh = shardProto ? shardProto.clone(true) : new T.Mesh(new T.OctahedronGeometry(0.12, 0));
          sMesh.visible = true;
          var sCol = shardColors[si % shardColors.length];
          sMesh.traverse(function (n) {
            if (n.isMesh) {
              n.material = new T.MeshStandardMaterial({
                color: new T.Color(sCol), roughness: 0.25, metalness: 0.45,
                emissive: new T.Color(sCol), emissiveIntensity: 0.22
              });
            }
          });
          shardGroup.add(sMesh);
          // surviveTier: 0=第一层淘汰, 1=第二层淘汰, 2=直达第三层提纯
          var survive = si % 5 === 0 ? 2 : (si % 2 === 0 ? 1 : 0);
          shards.push({
            mesh: sMesh,
            phase: (si * 2.39996) % TAU,
            offset: (si / 30),
            survive: survive
          });
        }

        var goldLight = new T.PointLight(new T.Color('#fbbf24'), 0, 5.5);
        goldLight.position.set(0, -1.25, 0.5);
        fnRoot.add(goldLight);

        var distillRing = makeShockRing(T, 0.55, 0.78, '#fbbf24');
        distillRing.mesh.position.y = -1.52;
        fnRoot.add(distillRing.mesh);

        var shdF = makeContactShadow(T, 2.0, lightMode ? 0.25 : 0.48);
        shdF.mesh.position.y = -2.06;
        scene.add(shdF.mesh);

        var stgLbls = splitItems(attr(el, 'stages', '10,000 条公域原始噪点|300 个高潜痛点样本|1 颗高复利黄金结论'));
        var f1Anchor = new T.Object3D(); f1Anchor.position.set(-1.96, 1.18, 0); fnRoot.add(f1Anchor);
        var f2Anchor = new T.Object3D(); f2Anchor.position.set(1.34, 0.36, 0); fnRoot.add(f2Anchor);
        addCalloutUI([
          { group: 'pour', target: f1Anchor, label: stgLbls[0] || '海量原始输入', side: -1, color: '#38bdf8' },
          { group: 'pour', target: f2Anchor, label: stgLbls[1] || '多层交叉过滤', side: 1, color: '#a78bfa' },
          { group: 'distill', target: gCore, label: stgLbls[2] || '唯一纯金核心', side: 1, color: '#fbbf24', offset: new T.Vector3(0.42, -0.05, 0) }
        ]);

        S.parts = {
          root: fnRoot, f1: f1, f2: f2, f3: f3, base: baseC,
          core: gCore, coreY0: gCore ? gCore.position.y : -1.16,
          shards: shards, goldLight: goldLight, distillRing: distillRing
        };

      /* ── 5. vault3d（重型机械金库棘轮破译 + 厚门洞开核心底牌） ── */
      } else if (kind === 'vault') {
        var vRoot = GLB_CACHE.vault.clone(true);
        vRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        stageRoot.add(vRoot);

        var doorPivot = vRoot.getObjectByName('DoorPivot');
        var outerW = vRoot.getObjectByName('OuterWheel');
        var innerW = vRoot.getObjectByName('InnerWheel');
        var bolts = vRoot.getObjectByName('LockBolts');
        var frameLeds = vRoot.getObjectByName('FrameLeds');
        var relic = vRoot.getObjectByName('RelicTablet');
        var relicSurf = relic ? relic.getObjectByName('ScreenSurface') : null;

        if (relicSurf) {
          relicSurf.material = new T.MeshBasicMaterial({
            map: makeVaultRelicTexture(T, attr(el, 'secret', '爆款底层公式|黄金 3 秒 × 情绪反差 × 结构留存'), attr(el, 'badge', 'CORE SECRET · 核心底牌'), '#fbbf24'),
            toneMapped: false
          });
        }

        var vaultGlow = new T.PointLight(new T.Color('#fbbf24'), 0, 7.5);
        vaultGlow.position.set(0, 0.2, -0.25);
        vRoot.add(vaultGlow);

        var shdV = makeContactShadow(T, 2.5, lightMode ? 0.28 : 0.52);
        shdV.mesh.position.y = -2.05;
        scene.add(shdV.mesh);

        var vNote = attr(el, 'callout', '');
        if (vNote) {
          addCalloutUI([{ group: 'open', target: relic, label: vNote, side: 1, color: '#fbbf24', offset: new T.Vector3(0.85, 0.45, 0) }]);
        }

        S.parts = {
          root: vRoot, doorPivot: doorPivot, outerW: outerW, innerW: innerW,
          bolts: bolts, frameLeds: frameLeds, relic: relic,
          relicZ0: relic ? relic.position.z : -0.58, vaultGlow: vaultGlow,
          colGreen: new T.Color('#34d399'), colAmber: new T.Color('#f59e0b')
        };

      /* ── 6. pyramid3d（四阶悬浮金字塔逐级筑基 + 塔尖晶冠加冕） ── */
      } else if (kind === 'pyramid') {
        var pyRoot = GLB_CACHE.pyramid.clone(true);
        pyRoot.traverse(function (n) { if (n.isMesh && n.material) n.material = n.material.clone(); });
        pyRoot.position.y = -0.10;
        stageRoot.add(pyRoot);

        var tierRaw = splitItems(attr(el, 'tiers', 'L1 · 低维体力重复|L2 · 单点工具提效|L3 · 自动流水线编排|TOP · 全局系统壁垒'));
        var tiers = [1, 2, 3].map(function (ti, idx) {
          var tNode = pyRoot.getObjectByName('PyramidTier_' + ti);
          var sNode = pyRoot.getObjectByName('ScreenSurface_' + ti);
          var rNode = pyRoot.getObjectByName('TierRim_' + ti);
          var lbl = tierRaw[idx] || ('LEVEL 0' + ti);
          var texIdle = makePyramidStepTexture(T, ti, lbl, accent, false);
          var texHot = makePyramidStepTexture(T, ti, lbl, accent, true);
          var sMat = new T.MeshBasicMaterial({ map: texIdle, toneMapped: false });
          if (sNode) sNode.material = sMat;
          return { node: tNode, rim: rNode, sMat: sMat, texIdle: texIdle, texHot: texHot, y0: tNode ? tNode.position.y : 0, hot: false, label: lbl };
        });

        var crown = pyRoot.getObjectByName('ApexCrown');
        var apexCore = pyRoot.getObjectByName('ApexCore');
        if (crown) {
          crown.traverse(function (n) {
            if (n.isMesh && /^ApexCrown_1/.test(n.name) && T.MeshPhysicalMaterial) {
              n.material = new T.MeshPhysicalMaterial({
                color: new T.Color('#fde68a'), roughness: 0.06, metalness: 0.08,
                transmission: 0.86, thickness: 1.2, ior: 1.62, transparent: true, opacity: 0.95
              });
            }
          });
        }

        var crownLight = new T.PointLight(new T.Color(accent), 0, 6.0);
        crownLight.position.set(0, 1.35, 0.3);
        pyRoot.add(crownLight);

        var crownRing = makeShockRing(T, 0.72, 0.95, accent);
        crownRing.mesh.position.y = 0.62;
        pyRoot.add(crownRing.mesh);

        var shdP = makeContactShadow(T, 2.5, lightMode ? 0.26 : 0.48);
        shdP.mesh.position.y = -1.75;
        scene.add(shdP.mesh);

        addCalloutUI([
          { group: 'tier-0', target: tiers[0].node, label: tierRaw[0] || 'L1 基础层', side: -1, color: '#94a3b8', offset: new T.Vector3(-1.62, 0, 0) },
          { group: 'tier-1', target: tiers[1].node, label: tierRaw[1] || 'L2 进阶层', side: 1, color: '#38bdf8', offset: new T.Vector3(1.22, 0, 0) },
          { group: 'tier-2', target: tiers[2].node, label: tierRaw[2] || 'L3 系统层', side: -1, color: '#a78bfa', offset: new T.Vector3(-1.05, 0.08, 0.48) },
          { group: 'crown', target: crown, label: tierRaw[3] || 'TOP 顶层生态', side: 1, color: accent, offset: new T.Vector3(0.52, 0.18, 0) }
        ]);

        S.parts = {
          root: pyRoot, tiers: tiers, crown: crown, apexCore: apexCore,
          crownY0: crown ? crown.position.y : 1.14, crownLight: crownLight, crownRing: crownRing
        };
      }

      renderNarrative(S, S.lastLt || 0);
    }

    if (GLB_CACHE[kind]) mountGLB();
    else GLB_WAITERS.push(mountGLB);

    el.__nr3d = S;
    renderNarrative(S, 0);
    return S;
  }

  /* ═════════════════════ 防重叠/防裁切三维引线投影器 ═════════════════════ */

  function syncCallouts(S, groupAlphas) {
    if (!S.callouts.length) return;
    var T = S.T, v = new T.Vector3();
    var buckets = { '-1': [], '1': [] };

    S.callouts.forEach(function (c0) {
      var a = clamp(groupAlphas[c0.group] !== undefined ? groupAlphas[c0.group] : (groupAlphas.all || 0), 0, 1);
      c0.alpha = a;
      if (a <= 0.01 || !c0.target) {
        c0.tagEl.style.opacity = '0';
        c0.lineEl.style.opacity = '0';
        c0.dotEl.style.opacity = '0';
        return;
      }
      c0.target.updateWorldMatrix(true, false);
      v.copy(c0.offset).applyMatrix4(c0.target.matrixWorld);
      v.project(S.cam);

      c0.sx = (v.x * 0.5 + 0.5) * S.W;
      c0.sy = (-v.y * 0.5 + 0.5) * S.H;
      c0.useSide = c0.dynamicSide ? (c0.sx >= S.W * 0.5 ? 1 : -1) : c0.side;
      c0.wantY = clamp(c0.sy + c0.dy, 188, S.H - 206);
      buckets[String(c0.useSide)].push(c0);
    });

    // 同侧胶囊自动防重叠排斥（间距 >= 58px）
    ['-1', '1'].forEach(function (k) {
      var list = buckets[k];
      if (!list.length) return;
      list.sort(function (a, b) { return a.wantY - b.wantY; });
      for (var i = 1; i < list.length; i++) {
        if (list[i].wantY - list[i - 1].wantY < 58) list[i].wantY = list[i - 1].wantY + 58;
      }
      if (list[list.length - 1].wantY > S.H - 204) {
        list[list.length - 1].wantY = S.H - 204;
        for (var j = list.length - 2; j >= 0; j--) {
          if (list[j + 1].wantY - list[j].wantY < 58) list[j].wantY = Math.max(184, list[j + 1].wantY - 58);
        }
      }

      list.forEach(function (c0) {
        var a = c0.alpha, side = c0.useSide, sx = c0.sx, sy = c0.sy, ey = c0.wantY;
        var tw = Math.max(168, c0.tagEl.offsetWidth || 268);
        var endX = side > 0
          ? clamp(sx + 128, 160, S.W - tw - 96)
          : clamp(sx - 128, tw + 96, S.W - 160);
        var elbowX = lerp(sx, endX, 0.48);

        c0.dotEl.setAttribute('cx', sx.toFixed(1));
        c0.dotEl.setAttribute('cy', sy.toFixed(1));
        c0.dotEl.style.opacity = a.toFixed(3);

        c0.lineEl.setAttribute('points', sx.toFixed(1) + ',' + sy.toFixed(1) + ' ' + elbowX.toFixed(1) + ',' + ey.toFixed(1) + ' ' + endX.toFixed(1) + ',' + ey.toFixed(1));
        c0.lineEl.style.opacity = (a * 0.86).toFixed(3);

        c0.tagEl.style.opacity = a.toFixed(3);
        if (side > 0) {
          c0.tagEl.style.left = (endX + 12).toFixed(1) + 'px';
          c0.tagEl.style.right = 'auto';
        } else {
          c0.tagEl.style.left = 'auto';
          c0.tagEl.style.right = (S.W - endX + 12).toFixed(1) + 'px';
        }
        c0.tagEl.style.top = ey.toFixed(1) + 'px';
      });
    });
  }

  /* ═════════════════════ 纯函数逐帧确定性连招解算器 renderNarrative(S, lt) ═════════════════════ */

  function renderNarrative(S, lt) {
    S.lastLt = lt;
    if (!S.mounted) {
      S.renderer.render(S.scene, S.cam);
      return;
    }

    var T = S.T;
    var rx = S.baseRx, ry = S.baseRy + lt * 0.035, rz = S.baseRz;
    var camX = 0, camY = 0.15 + S.lookY, dist = S.camDist;
    var lookX = 0, lookY = S.lookY, lookZ = 0;
    var P = S.parts;
    var alphas = {};

    /* ── 1. iceberg3d 连招：水上冰尖 -> 穿水深潜三层巨体 ── */
    if (S.kind === 'iceberg' && P.tip) {
      var uTip = 0, uDive = 0, hasTip = false;
      S.cues.forEach(function (q) {
        if (q.type === 'ice-tip3d') {
          hasTip = true;
          if (lt >= q.t0) uTip = Math.max(uTip, clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1));
        } else if (q.type === 'ice-dive3d' && lt >= q.t0) {
          uDive = Math.max(uDive, clamp((lt - q.t0) / Math.max(0.05, q.dur), 0, 1));
        }
      });
      if (!hasTip) uTip = 1;

      var eDive = smoother01(uDive);
      // 第 1 拍聚焦海平面上方洁白冰尖；第 2 拍俯冲穿入深海拉远展现水下 90% 巨体
      dist = lerp(6.35, S.camDist, eDive);
      camY = lerp(0.76, -0.58 + S.lookY, eDive);
      lookY = lerp(0.50, -0.96 + S.lookY, eDive);
      rx = lerp(7 * DEG, 12 * DEG, eDive);
      ry += eDive * 28 * DEG;

      var bob = Math.sin(lt * 1.7) * 0.03;
      P.tip.position.y = bob;
      if (P.water) P.water.rotation.y = lt * 0.08;

      P.deeps.forEach(function (dn, idx) {
        if (!dn) return;
        var localU = smooth01((uDive - idx * 0.16) / 0.55);
        dn.position.y = P.deepY0[idx] + bob * 0.5 - (1 - localU) * 0.18;
        alphas['deep-' + idx] = smooth01((uDive - (0.28 + idx * 0.16)) / 0.28);
      });
      alphas.tip = smooth01(uTip * 1.8) * (1 - smooth01((uDive - 0.15) / 0.35) * 0.25);

      P.abyssLight.intensity = eDive * 3.8;
      if (uDive > 0.04 && uDive < 0.92) {
        P.sonar.mesh.visible = true;
        P.sonar.mesh.scale.setScalar(0.8 + uDive * 1.45);
        P.sonar.mat.opacity = (1 - uDive) * 0.78;
      } else {
        P.sonar.mesh.visible = false;
      }
    }

    /* ── 2. domino3d 连招：弧形骨牌连锁跟拍 -> 重型护盾从天而降截停 ── */
    else if (S.kind === 'domino' && P.tiles) {
      var nT = P.tiles.length;
      var fallCue = null, shieldCue = null;
      S.cues.forEach(function (q) {
        if (q.type === 'domino-fall3d') fallCue = q;
        else if (q.type === 'domino-shield3d') shieldCue = q;
      });

      var uFall = fallCue && lt >= fallCue.t0 ? clamp((lt - fallCue.t0) / Math.max(0.1, fallCue.dur), 0, 1) : 0;
      var uShield = shieldCue && lt >= shieldCue.t0 ? clamp((lt - shieldCue.t0) / Math.max(0.1, shieldCue.dur), 0, 1) : 0;
      var hasShield = !!shieldCue;
      var fallCount = hasShield ? (nT - 1) : nT;

      var waveIdx = uFall * fallCount;
      P.tiles.forEach(function (tlObj, idx) {
        var ang = 0;
        if (hasShield && idx === nT - 1) {
          // 最后一块核心资产骨牌被护盾稳稳保住！
          ang = 0;
          if (tlObj.topBar && tlObj.topBar.material) {
            tlObj.topBar.material.emissiveIntensity = 0.45 + smooth01(uShield * 1.5) * 2.4;
          }
        } else {
          var localF = clamp(waveIdx - idx, 0, 1.35);
          var targetAng = (hasShield && idx === nT - 2) ? 0.50 : (idx === nT - 1 ? 1.42 : 1.06);
          ang = smooth01(Math.min(1, localF)) * targetAng;
          if (hasShield && idx === nT - 2 && uShield > 0.25) {
            // 撞上护盾后微微回弹定格
            var recoil = smooth01((uShield - 0.25) / 0.45);
            ang = lerp(ang, 0.42, recoil);
          }
          if (tlObj.topBar && tlObj.topBar.material && localF > 0.05) {
            tlObj.topBar.material.emissiveIntensity = 1.8;
          }
        }
        tlObj.mesh.rotation.x = ang;
      });

      // 摄影机沿骨牌倒塌波前实时平滑跟拍
      var focusIdx = clamp(waveIdx * 0.85, 0, nT - 1);
      var i0 = Math.floor(focusIdx), i1 = Math.min(nT - 1, i0 + 1), fr = focusIdx - i0;
      var fx = lerp(P.tiles[i0].x, P.tiles[i1].x, fr) * 0.42;
      camX = fx;
      lookX = fx * 0.85;
      lookY = -0.05 + S.lookY;

      if (hasShield && lt >= shieldCue.t0) {
        P.shieldMesh.visible = true;
        var dropE = outBack(clamp(uShield * 1.6, 0, 1), 1.08);
        P.shieldMesh.position.y = lerp(3.6, 0, dropE);
        if (uShield > 0.12 && uShield < 0.96) {
          P.shieldRing.mesh.visible = true;
          P.shieldRing.mesh.scale.setScalar(0.75 + uShield * 1.5);
          P.shieldRing.mat.opacity = (1 - uShield) * 0.85;
        } else {
          P.shieldRing.mesh.visible = false;
        }
        alphas.shield = smooth01((uShield - 0.30) / 0.35);
        alphas.hero = smooth01((uShield - 0.45) / 0.35);
      } else {
        P.shieldMesh.visible = false;
        P.shieldRing.mesh.visible = false;
      }
    }

    /* ── 3. scale3d 连招：左盘重锤压制 -> 右盘高能晶核四两拨千斤反超 ── */
    else if (S.kind === 'scale' && P.beam) {
      var uDrop = 0, uFlip = 0, hasDrop = false, hasFlip = false;
      S.cues.forEach(function (q) {
        if (q.type === 'scale-drop3d' && lt >= q.t0) {
          hasDrop = true;
          uDrop = Math.max(uDrop, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        } else if (q.type === 'scale-flip3d' && lt >= q.t0) {
          hasFlip = true;
          uFlip = Math.max(uFlip, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        }
      });

      var beamAng = 0;
      if (P.lWeight) {
        var lFall = hasDrop ? easeOutExpo(clamp(uDrop * 2.4, 0, 1)) : 1;
        P.lWeight.position.y = lerp(P.lY0 + 1.85, P.lY0, lFall);
      }
      if (hasDrop) {
        var tiltL = dampedSpring(clamp((uDrop - 0.16) / 0.84, 0, 1));
        beamAng = 0.29 * tiltL;
        alphas.left = smooth01((uDrop - 0.24) / 0.35);
      }

      if (P.rCore) {
        P.rCore.visible = hasFlip;
        if (hasFlip) {
          var rFall = easeOutExpo(clamp(uFlip * 2.5, 0, 1));
          P.rCore.position.y = lerp(P.rY0 + 2.05, P.rY0, rFall);
          var tiltR = dampedSpring(clamp((uFlip - 0.16) / 0.84, 0, 1));
          beamAng = lerp(beamAng, -0.34, tiltR);
          P.coreGlow.intensity = smooth01(uFlip * 2.0) * 3.6;
          alphas.right = smooth01((uFlip - 0.28) / 0.35);
          ry += smoother01(uFlip) * 16 * DEG;
          dist = lerp(dist, S.camDist * 0.93, smoother01(uFlip));

          if (uFlip > 0.14 && uFlip < 0.95) {
            P.flipRing.mesh.visible = true;
            P.flipRing.mesh.scale.setScalar(0.75 + uFlip * 1.45);
            P.flipRing.mat.opacity = (1 - uFlip) * 0.88;
          } else {
            P.flipRing.mesh.visible = false;
          }
        } else {
          P.flipRing.mesh.visible = false;
        }
      }

      P.beam.rotation.z = beamAng;
      if (P.lPan) P.lPan.rotation.z = -beamAng;
      if (P.rPan) P.rPan.rotation.z = -beamAng;
      if (P.needle) P.needle.rotation.z = beamAng * 2.25;
    }

    /* ── 4. funnel3d 连招：海量碎块龙卷涡流过滤 -> 底部纯金核心凝结 ── */
    else if (S.kind === 'funnel' && P.f1) {
      var uPour = 0, uDist = 0, hasPour = false;
      S.cues.forEach(function (q) {
        if (q.type === 'funnel-pour3d') {
          hasPour = true;
          if (lt >= q.t0) uPour = Math.max(uPour, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        } else if (q.type === 'funnel-distill3d' && lt >= q.t0) {
          uDist = Math.max(uDist, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        }
      });
      if (!hasPour) uPour = 1;

      var eDist = smoother01(uDist);
      rx = lerp(26 * DEG, 15 * DEG, eDist);
      lookY = lerp(0.24 + S.lookY, -0.22 + S.lookY, eDist);
      camY = lerp(0.52 + S.lookY, -0.04 + S.lookY, eDist);

      if (P.f1) P.f1.rotation.y = lt * 0.85;
      if (P.f2) P.f2.rotation.y = -lt * 1.15;
      if (P.f3) P.f3.rotation.y = lt * 0.55;

      // 涡流粒子沿漏斗内壁螺旋下坠并在对应层级被过滤消散
      var streamFade = 1 - smooth01((uDist - 0.35) / 0.55);
      P.shards.forEach(function (sh) {
        var maxDepth = sh.survive === 0 ? 0.36 : (sh.survive === 1 ? 0.68 : 0.98);
        var prog = ((uPour * 1.35 + uDist * 0.65 + sh.offset) % 1) * maxDepth;
        var vis = uPour > 0.02 && streamFade > 0.04;
        sh.mesh.visible = vis;
        if (!vis) return;
        var yPos = lerp(2.15, -0.78, prog);
        var rad = lerp(1.75, 0.22, Math.pow(prog, 0.82));
        var ang = sh.phase + lt * 4.2 + prog * 9.5;
        sh.mesh.position.set(Math.cos(ang) * rad, yPos, Math.sin(ang) * rad);
        sh.mesh.rotation.set(lt * 3 + sh.phase, lt * 2, 0);
        var sc = (1 - smooth01((prog - maxDepth * 0.82) / (maxDepth * 0.18))) * streamFade;
        sh.mesh.scale.setScalar(Math.max(0.001, sc));
      });

      if (P.core) {
        var cAppear = outBack(clamp(uDist * 1.5, 0, 1), 1.18);
        P.core.visible = uDist > 0.02;
        P.core.position.y = lerp(-0.62, P.coreY0 - 0.12, cAppear) + Math.sin(lt * 2.4) * 0.04;
        P.core.rotation.y = lt * 1.5;
        P.core.scale.setScalar(Math.max(0.001, cAppear));
      }
      P.goldLight.intensity = eDist * 4.2;

      if (uDist > 0.08 && uDist < 0.95) {
        P.distillRing.mesh.visible = true;
        P.distillRing.mesh.scale.setScalar(0.75 + uDist * 1.55);
        P.distillRing.mat.opacity = (1 - uDist) * 0.85;
      } else {
        P.distillRing.mesh.visible = false;
      }

      alphas.pour = smooth01(uPour * 2.0) * (1 - eDist * 0.15);
      alphas.distill = smooth01((uDist - 0.28) / 0.35);
    }

    /* ── 5. vault3d 连招：双层棘轮咬合破译 -> 厚重铰链门洞开推镜夺宝 ── */
    else if (S.kind === 'vault' && P.doorPivot) {
      var uUnlock = 0, uOpen = 0;
      S.cues.forEach(function (q) {
        if (q.type === 'vault-unlock3d' && lt >= q.t0) {
          uUnlock = Math.max(uUnlock, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        } else if (q.type === 'vault-open3d' && lt >= q.t0) {
          uOpen = Math.max(uOpen, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        }
      });

      var eUnlock = smoother01(uUnlock);
      var eOpen = smoother01(uOpen);

      if (P.outerW) P.outerW.rotation.z = eUnlock * 6.28;
      if (P.innerW) P.innerW.rotation.z = -eUnlock * 9.42;
      if (P.bolts) {
        var retract = smooth01((uUnlock - 0.68) / 0.30);
        var bScale = lerp(1, 0.86, retract);
        P.bolts.scale.set(bScale, bScale, 1);
      }
      if (P.frameLeds) {
        var unlocked = uUnlock > 0.82 || uOpen > 0.05;
        P.frameLeds.traverse(function (n) {
          if (n.isMesh && n.material) {
            n.material.emissive = unlocked ? P.colGreen : P.colAmber;
            n.material.emissiveIntensity = unlocked ? 1.8 : 0.7;
          }
        });
      }

      // 装甲大门绕左侧铰链 [-1.38, 0, 0.12] 向外推开 98°，镜头同步推进门框聚焦秘籍晶碑！
      P.doorPivot.rotation.y = -eOpen * 1.72;
      P.vaultGlow.intensity = smooth01(uOpen * 1.8) * 4.5;

      if (P.relic) {
        P.relic.position.z = lerp(P.relicZ0, 0.22, outBack(uOpen, 1.06));
        P.relic.position.y = Math.sin(lt * 2.0) * 0.03 * eOpen;
      }

      dist = lerp(S.camDist, S.camDist * 0.82, eOpen);
      ry = lerp(S.baseRy, 2 * DEG, eOpen);
      rx = lerp(S.baseRx, 3 * DEG, eOpen);
      alphas.open = smooth01((uOpen - 0.45) / 0.35);
    }

    /* ── 6. pyramid3d 连招：三层基座逐级筑基 -> 塔尖晶冠降临全景加冕 ── */
    else if (S.kind === 'pyramid' && P.tiers) {
      var uBuild = 0, uCrown = 0, hasBuild = false;
      S.cues.forEach(function (q) {
        if (q.type === 'pyramid-build3d') {
          hasBuild = true;
          if (lt >= q.t0) uBuild = Math.max(uBuild, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        } else if (q.type === 'pyramid-crown3d' && lt >= q.t0) {
          uCrown = Math.max(uCrown, clamp((lt - q.t0) / Math.max(0.08, q.dur), 0, 1));
        }
      });
      if (!hasBuild) uBuild = 1;

      var eCrown = smoother01(uCrown);
      rx = lerp(11 * DEG, 21 * DEG, eCrown);
      ry += eCrown * (-16 * DEG);
      lookY = lerp(-0.32 + S.lookY, 0.04 + S.lookY, eCrown);
      dist = lerp(S.camDist * 0.90, S.camDist, eCrown);

      P.tiers.forEach(function (tr, idx) {
        if (!tr.node) return;
        var tu = outBack(clamp((uBuild - idx * 0.24) / 0.52, 0, 1), 1.08);
        tr.node.position.y = lerp(tr.y0 - 0.85, tr.y0, tu);
        tr.node.scale.setScalar(Math.max(0.001, smooth01((uBuild - idx * 0.22) / 0.32)));
        var lit = uBuild > idx * 0.25 + 0.18;
        if (lit !== tr.hot) {
          tr.hot = lit;
          tr.sMat.map = lit ? tr.texHot : tr.texIdle;
          tr.sMat.needsUpdate = true;
        }
        alphas['tier-' + idx] = smooth01((uBuild - (idx * 0.24 + 0.22)) / 0.28);
      });

      if (P.crown) {
        P.crown.visible = uCrown > 0.02;
        var cDrop = outBack(clamp(uCrown * 1.45, 0, 1), 1.12);
        P.crown.position.y = lerp(P.crownY0 + 1.35, P.crownY0, cDrop) + Math.sin(lt * 2.1) * 0.04 * eCrown;
        P.crown.rotation.y = lt * 0.65;
        if (P.apexCore) P.apexCore.rotation.y = -lt * 1.8;
      }
      P.crownLight.intensity = eCrown * 4.2;

      if (uCrown > 0.10 && uCrown < 0.94) {
        P.crownRing.mesh.visible = true;
        P.crownRing.mesh.scale.setScalar(0.8 + uCrown * 1.65);
        P.crownRing.mat.opacity = (1 - uCrown) * 0.86;
      } else {
        P.crownRing.mesh.visible = false;
      }
      alphas.crown = smooth01((uCrown - 0.32) / 0.35);
    }

    /* ── 叠加通用 narrative-cam3d 运镜 ── */
    S.cams.forEach(function (cm) {
      if (lt >= cm.t0) {
        var uc = smoother01(clamp((lt - cm.t0) / Math.max(0.05, cm.dur), 0, 1));
        if (cm.rx !== undefined) rx = lerp(rx, cm.rx * DEG, uc);
        if (cm.ry !== undefined) ry = lerp(ry, cm.ry * DEG, uc);
        if (cm.zoom !== undefined) dist = lerp(dist, dist / Math.max(0.3, cm.zoom), uc);
        if (cm.lookY !== undefined) lookY = lerp(lookY, cm.lookY, uc);
      }
    });

    S.stageRoot.rotation.set(rx, ry, rz);
    S.cam.position.set(camX, camY, dist);
    S.cam.lookAt(lookX, lookY, lookZ);

    S.scene.updateMatrixWorld(true);
    syncCallouts(S, alphas);
    S.renderer.render(S.scene, S.cam);
  }

  function bindNarrative(c, defaultKind) {
    var S = c.el.__nr3d || initNarrative(c.el, defaultKind);
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
        renderNarrative(S, clamp(gt - s0, 0, span));
      };
      tl.to({ u: 0 }, { u: 1, duration: Math.max(0.1, span), ease: 'none', onUpdate: tick }, s0);
    }
    return S;
  }

  /* ═════════════════════ 注册 6 个口播叙事组件生成器（FX.make） ═════════════════════ */

  FX.make.iceberg3d = function (el) { if (g.THREE) initNarrative(el, 'iceberg'); };
  FX.make.domino3d  = function (el) { if (g.THREE) initNarrative(el, 'domino'); };
  FX.make.scale3d   = function (el) { if (g.THREE) initNarrative(el, 'scale'); };
  FX.make.funnel3d  = function (el) { if (g.THREE) initNarrative(el, 'funnel'); };
  FX.make.vault3d   = function (el) { if (g.THREE) initNarrative(el, 'vault'); };
  FX.make.pyramid3d = function (el) { if (g.THREE) initNarrative(el, 'pyramid'); };

  /* ═════════════════════ 注册 13 个声明式口播 3D 连招特效（FX.register） ═════════════════════ */

  var def = function (name, desc, fn) { FX.register(name, CAT, desc, fn); };

  def('ice-tip3d', '冰山模型第 1 拍·海面表象特写：写在 data-make="iceberg3d" 上，平视贴近波光折射海平面，仅展示水面上方 10% 洁白冰尖与表象引线（data-tip）。参数 dur（默认 1.2）', function (c) {
    var S = bindNarrative(c, 'iceberg');
    S.cues.push({ type: 'ice-tip3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.2) });
    renderNarrative(S, 0);
  });

  def('ice-dive3d', '冰山模型第 2 拍·穿水深潜真相：写在 data-make="iceberg3d" 上，镜头俯冲穿透海平面潜入深海，点亮水下 90% 三层庞大晶脉巨体并依次展开深层逻辑引线（data-depths）。参数 dur（默认 1.8）', function (c) {
    var S = bindNarrative(c, 'iceberg');
    S.cues.push({ type: 'ice-dive3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.8) });
    renderNarrative(S, 0);
  });

  def('domino-fall3d', '多米诺连锁第 1 拍·骨牌雪崩跟拍：写在 data-make="domino3d" 上，多块印有因果词的 3D 倒角骨牌（data-tiles）逐块撞击倾倒，摄影机沿弧线实时跟拍倒塌波前。参数 dur（默认 1.8）', function (c) {
    var S = bindNarrative(c, 'domino');
    S.cues.push({ type: 'domino-fall3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.8) });
    renderNarrative(S, 0);
  });

  def('domino-shield3d', '多米诺连锁第 2 拍·护盾砸落截停：写在 data-make="domino3d" 上，重型发光金属护盾闸门从天而降插入骨牌间隙，硬生生弹停连锁崩塌，守护最后一块核心骨牌（data-shield）。参数 dur（默认 1.1）', function (c) {
    var S = bindNarrative(c, 'domino');
    S.cues.push({ type: 'domino-shield3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.1) });
    renderNarrative(S, 0);
  });

  def('scale-drop3d', '双盘天平第 1 拍·重锤先发压盘：写在 data-make="scale3d" 上，传统沉重暗铁巨块砸入左盘（data-left），双吊盘保持真实重力铅垂摆动、表盘指针大幅左偏。参数 dur（默认 1.2）', function (c) {
    var S = bindNarrative(c, 'scale');
    S.cues.push({ type: 'scale-drop3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.2) });
    renderNarrative(S, 0);
  });

  def('scale-flip3d', '双盘天平第 2 拍·金核四两拨千斤反杀：写在 data-make="scale3d" 上，高能发光晶核落入右盘（data-right）迸发冲击光环，瞬间压倒左盘巨块完成逆转反超。参数 dur（默认 1.4）', function (c) {
    var S = bindNarrative(c, 'scale');
    S.cues.push({ type: 'scale-flip3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.4) });
    renderNarrative(S, 0);
  });

  def('funnel-pour3d', '提纯漏斗第 1 拍·万千噪点涡流吸入：写在 data-make="funnel3d" 上，俯拍多色原始碎块呈三维龙卷涡流高速旋入三层反向涡轮滤环。参数 dur（默认 1.5）', function (c) {
    var S = bindNarrative(c, 'funnel');
    S.cues.push({ type: 'funnel-pour3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.5) });
    renderNarrative(S, 0);
  });

  def('funnel-distill3d', '提纯漏斗第 2 拍·层层过滤凝结金核：写在 data-make="funnel3d" 上，镜头顺漏斗下移，海量噪点逐层淘汰归零，底部凝结悬停唯一高纯度黄金核心并弹出三阶转化引线（data-stages）。参数 dur（默认 1.6）', function (c) {
    var S = bindNarrative(c, 'funnel');
    S.cues.push({ type: 'funnel-distill3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.6) });
    renderNarrative(S, 0);
  });

  def('vault-unlock3d', '重型金库第 1 拍·双棘轮咬合破译：写在 data-make="vault3d" 上，特写装甲门中央内外双层金属密码轮反向高速旋转对齐，六道铬合金锁舌缩回、状态灯变绿。参数 dur（默认 1.3）', function (c) {
    var S = bindNarrative(c, 'vault');
    S.cues.push({ type: 'vault-unlock3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.3) });
    renderNarrative(S, 0);
  });

  def('vault-open3d', '重型金库第 2 拍·重门洞开揭秘底牌：写在 data-make="vault3d" 上，超厚装甲门绕左侧铰链推开 98°，金色体积光倾泻而出，镜头直推门内浮现核心公式石碑（data-secret）。参数 dur（默认 1.6）', function (c) {
    var S = bindNarrative(c, 'vault');
    S.cues.push({ type: 'vault-open3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.6) });
    renderNarrative(S, 0);
  });

  def('pyramid-build3d', '认知金字塔第 1 拍·三阶磁吸筑基：写在 data-make="pyramid3d" 上，镜头自低向高跟拍 L1–L3 三层阶梯方台逐级落定并点亮正面段位铭牌（data-tiers）。参数 dur（默认 1.6）', function (c) {
    var S = bindNarrative(c, 'pyramid');
    S.cues.push({ type: 'pyramid-build3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.6) });
    renderNarrative(S, 0);
  });

  def('pyramid-crown3d', '认知金字塔第 2 拍·塔尖晶冠加冕俯瞰：写在 data-make="pyramid3d" 上，高透水晶顶冠降临塔尖迸发金光，镜头拉远环绕定格四层全局段位引线。参数 dur（默认 1.5）', function (c) {
    var S = bindNarrative(c, 'pyramid');
    S.cues.push({ type: 'pyramid-crown3d', t0: c.t - S.sceneStart, dur: num(c.o.dur, 1.5) });
    renderNarrative(S, 0);
  });

  def('narrative-cam3d', '口播 3D 叙事展台自定义推拉环绕运镜：配合 iceberg3d / domino3d / scale3d / funnel3d / vault3d / pyramid3d 叠加俯仰角 rx、水平角 ry、推进倍率 zoom 与视点高度 lookY。参数 dur（默认 1.4）', function (c) {
    var S = bindNarrative(c, 'iceberg');
    S.cams.push({
      t0: c.t - S.sceneStart,
      dur: num(c.o.dur, 1.4),
      rx: c.o.rx !== undefined ? +c.o.rx : undefined,
      ry: c.o.ry !== undefined ? +c.o.ry : undefined,
      zoom: c.o.zoom !== undefined ? +c.o.zoom : undefined,
      lookY: c.o.lookY !== undefined ? +c.o.lookY : undefined
    });
    renderNarrative(S, 0);
  });

})(typeof window !== 'undefined' ? window : globalThis, typeof document !== 'undefined' ? document : undefined);
