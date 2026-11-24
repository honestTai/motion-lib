/*!
 * FX 3D 模块 v1.3  ——  motion-lib 的可选扩展：真 3D 场景（three.js）
 * 需要先加载 vendor/three-fx.min.js 和 fx.js：
 *
 *   <script src="lib/vendor/three-fx.min.js"></script>
 *   <script src="lib/fx.js"></script>
 *   <script src="lib/fx-3d.js"></script>
 *
 *   <div class="layer" data-make="stage3d" data-bloom="0.8"
 *        data-fx="stars3d@0 galaxy3d@0 orb3d@0(in=1.5) orbit3d@0(r=30,h=12,turn=120,dur=6)"></div>
 *
 * 一个 data-make="stage3d" 是一个 3D 舞台（一块 WebGL 画布 + 一台摄像机）。
 * 写在它上面的动效分两种：往舞台里放东西的（galaxy3d、orb3d、city3d …），和移动摄像机的（cam3d、orbit3d）。
 *
 * 和主库一样逐帧可复现：粒子位置在显卡里由「属性 + 时间」直接算出，摄像机位置是时间的纯函数，随机数带种子。
 */
(function (g) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-3d：请先加载 fx.js');

  var TAU = Math.PI * 2, T = null;
  var num = function (v, d) { return v === undefined || v === null || v === '' || isNaN(+v) ? d : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var colors = function (s, d) { var a = String(s || '').split('/').map(function (x) { return x.trim(); }).filter(Boolean); return a.length ? a : d; };
  var csv = function (s, d) { var a = String(s || '').split(',').map(Number); return a.length === 3 && !a.some(isNaN) ? a : d; };
  var easeFn = function (name, d) { return g.gsap.parseEase(FX.eases[name] || name || FX.eases[d] || d || 'power2.inOut'); };
  function need() { T = g.THREE; if (!T) throw new Error('fx-3d：请先加载 vendor/three-fx.min.js'); return T; }

  /* ───────────────────────── 舞台 ─────────────────────────
   * 属性：data-bloom=辉光强度（0 关闭）、data-threshold=多亮才发光、data-radius=辉光扩散、data-bg=背景色、
   *       data-fog=雾的浓度（0.003 左右，远处变淡）、data-fov=视角、data-cam="x,y,z" 摄像机初始位置、data-look="x,y,z" 初始看向哪里、data-light=0 关掉默认灯光 */
  FX.make.stage3d = function (el) {
    if (el.__s3) return;
    need();
    var W = el.offsetWidth || 1920, H = el.offsetHeight || 1080, at = function (k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
    var isAlpha = at('alpha') === '1', bg = new T.Color(at('bg', '#02060f'));
    var dpr = clamp(num(at('dpr'), isAlpha ? 2 : 1), 1, 3);
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: isAlpha, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    if (isAlpha) renderer.setClearColor(0x000000, 0); else renderer.setClearColor(bg, 1);
    el.classList.add('fx-3d');
    el.insertBefore(renderer.domElement, el.firstChild);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(num(at('fov'), 50), W / H, 0.1, 4000);
    if (!isAlpha) scene.background = bg;                                // 用场景背景而不是清屏色：开辉光时清屏色会被多转一次亮度，背景发灰
    if (!isAlpha && num(at('fog'), 0) > 0) scene.fog = new T.FogExp2(bg, num(at('fog'), 0));
    if (at('light') === 'anime') {
      scene.add(new T.AmbientLight(0xfff7f0, 0.82));
      var aKey = new T.DirectionalLight(0xfffdf9, 2.50); aKey.position.set(1.2, 1.9, 2.8); scene.add(aKey);
      var aRim = new T.DirectionalLight(0xdbeafe, 0.62); aRim.position.set(-1.8, 1.8, -2.2); scene.add(aRim);
      var aTop = new T.DirectionalLight(0xfff0f5, 0.42); aTop.position.set(0.2, 2.8, -1.2); scene.add(aTop);
    } else if (at('light') !== '0') {
      scene.add(new T.AmbientLight(0x3a4a70, 1.6));
      var key = new T.DirectionalLight(0xcfe2ff, 2); key.position.set(-6, 10, 8); scene.add(key);
    }
    var bloom = num(at('bloom'), isAlpha ? 0 : 0.8), composer = null;
    if (bloom > 0) {
      composer = new T.EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
      composer.addPass(new T.RenderPass(scene, cam));
      composer.addPass(new T.UnrealBloomPass(new T.Vector2(W, H), bloom, num(at('radius'), 0.6), num(at('threshold'), 0.3)));
      composer.addPass(new T.OutputPass());
    }
    var c0 = csv(at('cam'), [0, 4, 16]), l0 = csv(at('look'), [0, 0, 0]);
    el.__s3 = { el: el, W: W, H: H, alpha: isAlpha, renderer: renderer, scene: scene, cam: cam, composer: composer, objs: [], cams: [], mats: [], blank: true,
      cam0: { x: c0[0], y: c0[1], z: c0[2], lx: l0[0], ly: l0[1], lz: l0[2], fov: cam.fov } };
  };

  /* 摄像机：按时间排好的一串「镜头段」，每一段从上一段结束的位置出发。任何时刻的位置都能直接算出来 */
  function camAt(s3, t) {
    var i, seg, cur;
    if (!s3.sorted) {
      s3.cams.sort(function (a, b) { return a.t0 - b.t0; });
      cur = s3.cam0;
      for (i = 0; i < s3.cams.length; i++) { seg = s3.cams[i]; seg.from = cur; seg.prep(cur); cur = seg.at(seg.t0 + seg.dur); }
      s3.sorted = true;
    }
    cur = s3.cam0;
    for (i = 0; i < s3.cams.length; i++) { seg = s3.cams[i]; if (t < seg.t0) break; cur = seg.at(Math.min(t, seg.t0 + seg.dur)); }
    return cur;
  }
  function render(s3, t) {
    var any = false, i, O, lt, A;
    for (i = 0; i < s3.objs.length; i++) {
      O = s3.objs[i]; lt = t - O.t0;
      var on = lt >= 0 && lt <= O.dur;
      O.root.visible = on;
      if (!on) continue;
      any = true;
      A = Math.min(1, O.fi > 0 ? lt / O.fi : 1) * Math.min(1, O.fo > 0 ? (O.dur - lt) / O.fo : 1);
      O.update(lt, A, t);
    }
    if (!any) { if (!s3.blank) { s3.renderer.clear(); s3.blank = true; } return; }
    s3.blank = false;
    var c = camAt(s3, t), cam = s3.cam;
    cam.position.set(c.x, c.y, c.z); cam.lookAt(c.lx, c.ly, c.lz);
    if (cam.fov !== c.fov) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    var px = s3.H / (2 * Math.tan(cam.fov * Math.PI / 360));
    for (i = 0; i < s3.mats.length; i++) s3.mats[i].uniforms.uPx.value = px;
    for (i = 0; i < s3.objs.length; i++) if (s3.objs[i].root.visible && s3.objs[i].late) s3.objs[i].late(cam);
    if (s3.composer) s3.composer.render(); else s3.renderer.render(s3.scene, cam);
  }
  function stage(c) {
    if (!c.el.__s3) FX.make.stage3d(c.el);
    var s3 = c.el.__s3;
    if (!s3.driver) {
      s3.driver = true;
      var tl = c.tl;
      s3.redraw = function () { render(s3, tl.time()); };
      tl.to({ v: 0 }, { v: 1, duration: c.total, ease: 'none', onUpdate: s3.redraw }, 0);
    }
    return s3;
  }
  /** 往舞台里放一个东西。init(s3, o) 返回 { root, update(本层已过秒数, 不透明度), late(cam) }
   *  通用参数：dur=存在多久（默认到场景结束）、fade / out=淡入淡出秒数、px / py / pz=摆放位置、s=整体缩放、seed */
  function obj(c, init, d) {
    d = d || {};
    var s3 = stage(c), o = c.o, O = { t0: c.t, dur: num(o.dur, c.sceneDur + 1.5), fi: num(o.fade, d.fade === undefined ? 0.5 : d.fade), fo: num(o.out, d.out === undefined ? 0.4 : d.out) };
    var r = init(s3, o, O);
    O.root = r.root; O.update = r.update; O.late = r.late;
    O.root.position.set(num(o.px, 0), num(o.py, 0), num(o.pz, 0));
    if (o.s !== undefined) O.root.scale.setScalar(num(o.s, 1));
    O.root.visible = false;
    s3.scene.add(O.root); s3.objs.push(O);
    s3.redraw();
  }
  var def = function (name, desc, fn) { FX.register(name, '3D', desc, fn); };
  FX._stage3d = { stage: stage, obj: obj, easeFn: easeFn, need: need };

  /* ── 显卡粒子：每个粒子的位置由一小段着色器代码 P() 根据属性和时间算出 ── */
  var V_HEAD = 'uniform float uTime; uniform float uPx; uniform float uSize; attribute vec3 col; attribute float sz; varying vec3 vCol; varying float vA;\n';
  var V_MAIN = '\nvoid main(){ vec3 p = vec3(0.0); vec3 c = col; float a = 1.0; P(p, c, a); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, sz * uSize * uPx / -mv.z); vCol = c; vA = a; }';
  var FRAG = 'uniform float uAlpha; uniform float uBright; varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * uAlpha * vA; gl_FragColor = vec4(vCol * a * uBright, a); }';
  var FRAG_SOLID = 'uniform float uAlpha; uniform float uBright; varying vec3 vCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.36, d) * uAlpha * vA; gl_FragColor = vec4(vCol * uBright, a); }';
  function points(s3, n, attrs, body, uni, size, bright, solid) {
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    Object.keys(attrs).forEach(function (k) { geo.setAttribute(k, new T.BufferAttribute(attrs[k], attrs[k].length / n)); });
    var u = Object.assign({ uTime: { value: 0 }, uAlpha: { value: 1 }, uBright: { value: bright }, uSize: { value: size }, uPx: { value: 1000 } }, uni || {});
    var m = new T.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: solid ? T.NormalBlending : T.AdditiveBlending, vertexShader: V_HEAD + body + V_MAIN, fragmentShader: solid ? FRAG_SOLID : FRAG });
    s3.mats.push(m);
    var pts = new T.Points(geo, m); pts.frustumCulled = false;
    return pts;
  }
  function colArr(n, fn) { var a = new Float32Array(n * 3), c = new T.Color(); for (var i = 0; i < n; i++) { fn(i, c); a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } return a; }
  function f32(n, fn) { var a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = fn(i); return a; }

  /* ═════════════════════════ 场景物体 ═════════════════════════ */

  def('stars3d', '3D 星空：一大团星星散布在空间里，镜头移动时有远近层次。参数 n、r=分布半径、size、colors', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 1)), n = num(o.n, 5000), R = num(o.r, 220), cols = colors(o.colors, ['#ffffff', '#bfe6ff', '#ffd9b0']).map(function (x) { return new T.Color(x); });
      var pos = new Float32Array(n * 3), i;
      for (i = 0; i < n; i++) { var u = r() * 2 - 1, ph = r() * TAU, q = Math.sqrt(1 - u * u), d = R * (0.25 + 0.75 * Math.cbrt(r())); pos[i * 3] = q * Math.cos(ph) * d; pos[i * 3 + 1] = u * d; pos[i * 3 + 2] = q * Math.sin(ph) * d; }
      var pts = points(s3, n, { src: pos, ph: f32(n, function () { return r() * TAU; }), sz: f32(n, function () { return 0.5 + r() * 1.5; }), col: colArr(n, function (i, c) { c.copy(cols[Math.floor(r() * cols.length)]); }) },
        'attribute vec3 src; attribute float ph; void P(out vec3 p, inout vec3 c, inout float a){ p = src; a = 0.7 + 0.3 * sin(uTime * 1.7 + ph); }', null, num(o.size, 0.5), num(o.bright, 0.8));
      return { root: pts, update: function (lt, A) { pts.material.uniforms.uTime.value = lt; pts.material.uniforms.uAlpha.value = A; } };
    });
  });

  def('galaxy3d', '旋涡星系：几万个粒子排成旋臂绕中心转，内圈快外圈慢。参数 n、arms=旋臂数、r=半径、inner=中心留空半径、spin=转速、twist=旋臂弯曲程度、colors（按旋臂交替）、size、bright', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 2)), n = num(o.n, 60000), arms = num(o.arms, 4), R = num(o.r, 26), inner = num(o.inner, 4), tw = num(o.twist, 0.32);
      var cols = colors(o.colors, ['#6fd3ff', '#ff8a4d']).map(function (x) { return new T.Color(x); }), white = new T.Color('#ffffff');
      var a0 = new Float32Array(n), rad = new Float32Array(n), hgt = new Float32Array(n), arm = new Uint8Array(n), i;
      for (i = 0; i < n; i++) { arm[i] = Math.floor(r() * arms); var d = inner + Math.pow(r(), 1.4) * (R - inner); rad[i] = d; a0[i] = arm[i] / arms * TAU + d * tw + (r() - 0.5) * (0.5 + 2.2 / d); hgt[i] = (r() - 0.5) * (0.4 + 2.2 * Math.exp(-d / 5)); }
      var pts = points(s3, n, { a0: a0, rad: rad, hgt: hgt, sz: f32(n, function () { return 0.5 + r() * 1.6; }), col: colArr(n, function (i, c) { c.copy(cols[arm[i] % cols.length]).lerp(white, Math.exp(-rad[i] / 6) * 0.5 + r() * 0.15); }) },
        'attribute float a0; attribute float rad; attribute float hgt; uniform float uSpin; void P(out vec3 p, inout vec3 c, inout float a){ float an = a0 + uTime * uSpin / pow(rad, 0.9); p = vec3(cos(an) * rad, hgt, sin(an) * rad); }',
        { uSpin: { value: num(o.spin, 1.6) } }, num(o.size, 0.045), num(o.bright, 0.5));
      return { root: pts, update: function (lt, A) { pts.material.uniforms.uTime.value = lt; pts.material.uniforms.uAlpha.value = A; } };
    });
  });

  def('orb3d', '立体能量球：带真实光照的金属三角碎片拼成的球，内核发光；可以从散落的碎片聚拢成球，也可以炸开。参数 r=半径、detail=细分（1=80 片，2=320 片）、gap=碎片间隙、spin、in=聚拢秒数、explode=第几秒炸开、power=炸开力度、color=碎片色、emissive=自发光色、core=内核色', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 3)), R = num(o.r, 2.2), gap = num(o.gap, 0.84), spin = num(o.spin, 0.5), tin = num(o['in'], 0), tex = o.explode === undefined ? -1 : num(o.explode, 3), power = num(o.power, 1);
      var base = new T.IcosahedronGeometry(R, clamp(num(o.detail, 1), 0, 3)); if (base.index) base = base.toNonIndexed();
      var bp = base.attributes.position.array, nf = bp.length / 9, F = [], f, k;
      for (f = 0; f < nf; f++) {
        var cx = 0, cy = 0, cz = 0; for (k = 0; k < 3; k++) { cx += bp[f * 9 + k * 3]; cy += bp[f * 9 + k * 3 + 1]; cz += bp[f * 9 + k * 3 + 2]; } cx /= 3; cy /= 3; cz /= 3;
        var l = Math.hypot(cx, cy, cz), ax = new T.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize(), d = [];
        for (k = 0; k < 3; k++) d.push(new T.Vector3((bp[f * 9 + k * 3] - cx) * gap, (bp[f * 9 + k * 3 + 1] - cy) * gap, (bp[f * 9 + k * 3 + 2] - cz) * gap));
        F.push({ c: new T.Vector3(cx, cy, cz), n: new T.Vector3(cx / l, cy / l, cz / l), d: d, ax: ax, w: (r() - 0.5) * 9, vel: 0.5 + r() * 1.5, dl: r() * 0.3 });
      }
      var geo = new T.BufferGeometry(), pos = new Float32Array(nf * 9); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      var mat = new T.MeshStandardMaterial({ color: new T.Color(o.color || '#ffd9a8'), metalness: 0.55, roughness: 0.35, flatShading: true, side: T.DoubleSide, emissive: new T.Color(o.emissive || '#7a2a08'), emissiveIntensity: 0.5, transparent: true });
      var mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false;
      var coreMat = new T.MeshBasicMaterial({ color: new T.Color(o.core || '#ffc070'), transparent: true }), core = new T.Mesh(new T.SphereGeometry(R * 0.5, 32, 16), coreMat);
      var light = new T.PointLight(new T.Color(o.core || '#ffa040'), 60, R * 14);
      var root = new T.Group(), spinner = new T.Group(); spinner.add(mesh); root.add(spinner); root.add(core); root.add(light);
      var v = new T.Vector3();
      return { root: root, update: function (lt, A) {
        var te = tex >= 0 ? lt - tex : -1, asm = tin > 0 ? 1 - (1 - Math.pow(1 - clamp(lt / tin, 0, 1), 3)) : 0, fade = 1;
        for (var f = 0; f < nf; f++) {
          var q = F[f], off = 0, tum = 0;
          if (asm > 0) { off = q.vel * 3.2 * R * asm; tum = q.w * asm * 1.4; }
          if (te > 0) { off = q.vel * 2.8 * R * power * (1 - Math.exp(-2.4 * Math.max(0, te - q.dl * 0.15))); tum = q.w * te; }
          for (var k = 0; k < 3; k++) {
            v.copy(q.d[k]); if (tum) v.applyAxisAngle(q.ax, tum);
            pos[f * 9 + k * 3] = q.c.x + q.n.x * off + v.x; pos[f * 9 + k * 3 + 1] = q.c.y + q.n.y * off + v.y; pos[f * 9 + k * 3 + 2] = q.c.z + q.n.z * off + v.z;
          }
        }
        if (te > 0) fade = clamp(1.7 - te * 0.7, 0, 1);
        geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
        spinner.rotation.set(0.35, lt * spin, 0);
        var boom = te > 0 ? Math.exp(-te * 2.4) : 0, pulse = 1 + 0.05 * Math.sin(lt * 3.1);
        mat.opacity = A * fade * clamp(1.25 - asm, 0, 1); coreMat.opacity = A * (te > 0 ? clamp(1.4 - te, 0, 1) : 1 - asm * 0.7);
        core.scale.setScalar(pulse * (1 + boom * 1.1)); light.intensity = 60 * (1 + boom * 4) * A * (1 - asm * 0.7);
      } };
    });
  });

  def('tunnel3d', '粒子隧道：粒子和光环排成一条隧道朝镜头涌来（把摄像机放在隧道里朝里看）。参数 n、r=隧道半径、len=长度、speed、twist=螺旋程度、rings=光环数（0 不要）、colors', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 4)), n = num(o.n, 30000), R = num(o.r, 9), L = num(o.len, 260), cols = colors(o.colors, ['#6fd3ff', '#ff8a4d', '#ffffff']).map(function (x) { return new T.Color(x); });
      var root = new T.Group(), rings = [], nr = num(o.rings, 14), speed = num(o.speed, 40), i;
      var pts = points(s3, n, { a0: f32(n, function () { return r() * TAU; }), rr: f32(n, function () { return R * (0.85 + r() * 0.5); }), z0: f32(n, function () { return r() * L; }), sz: f32(n, function () { return 0.5 + r() * 1.6; }),
        col: colArr(n, function (i, c) { c.copy(cols[Math.floor(r() * cols.length)]); }) },
        'attribute float a0; attribute float rr; attribute float z0; uniform float uLen; uniform float uSpeed; uniform float uTwist; void P(out vec3 p, inout vec3 c, inout float a){ float z = mod(z0 + uTime * uSpeed, uLen); float an = a0 + z * uTwist; p = vec3(cos(an) * rr, sin(an) * rr, z - uLen); a = smoothstep(0.0, uLen * 0.25, z); }',
        { uLen: { value: L }, uSpeed: { value: speed }, uTwist: { value: num(o.twist, 0.02) } }, num(o.size, 0.16), num(o.bright, 0.6));
      root.add(pts);
      var circle = []; for (i = 0; i <= 96; i++) circle.push(new T.Vector3(Math.cos(i / 96 * TAU) * R * 0.8, Math.sin(i / 96 * TAU) * R * 0.8, 0));
      var cg = new T.BufferGeometry().setFromPoints(circle);
      for (i = 0; i < nr; i++) { var ln = new T.Line(cg, new T.LineBasicMaterial({ color: cols[i % cols.length], transparent: true, blending: T.AdditiveBlending, depthWrite: false })); ln.userData.z0 = i / nr * L; rings.push(ln); root.add(ln); }
      return { root: root, update: function (lt, A) {
        pts.material.uniforms.uTime.value = lt; pts.material.uniforms.uAlpha.value = A;
        for (var i = 0; i < rings.length; i++) { var z = (rings[i].userData.z0 + lt * speed) % L; rings[i].position.z = z - L; rings[i].material.opacity = A * 0.8 * clamp(z / (L * 0.25), 0, 1); rings[i].rotation.z = z * 0.01; }
      } };
    });
  });

  def('waves3d', '波浪点阵：一大片点组成的地面像水面一样起伏。参数 nx / nz=点数、w / d=宽和深、amp=浪高、freq=浪的密度、speed、c1=低处色、c2=高处色', function (c) {
    obj(c, function (s3, o) {
      var nx = num(o.nx, 180), nz = num(o.nz, 140), n = nx * nz, w = num(o.w, 120), d = num(o.d, 100), src = new Float32Array(n * 3), i = 0;
      for (var z = 0; z < nz; z++) for (var x = 0; x < nx; x++) { src[i * 3] = (x / (nx - 1) - 0.5) * w; src[i * 3 + 2] = (z / (nz - 1) - 0.5) * d; i++; }
      var pts = points(s3, n, { src: src, sz: f32(n, function () { return 1; }), col: colArr(n, function (i, c) { c.set('#ffffff'); }) },
        'attribute vec3 src; uniform float uAmp; uniform float uFreq; uniform float uSpd; uniform vec3 uC1; uniform vec3 uC2; void P(out vec3 p, inout vec3 c, inout float a){ float h = sin(src.x * uFreq + uTime * uSpd) * 0.5 + cos(src.z * uFreq * 0.8 + uTime * uSpd * 0.7) * 0.5 + sin((src.x + src.z) * uFreq * 0.4 + uTime * uSpd * 0.5) * 0.4; p = vec3(src.x, h * uAmp, src.z); c = mix(uC1, uC2, clamp(h * 0.5 + 0.5, 0.0, 1.0)); }',
        { uAmp: { value: num(o.amp, 2.2) }, uFreq: { value: num(o.freq, 0.16) }, uSpd: { value: num(o.speed, 1) }, uC1: { value: new T.Color(o.c1 || '#1f6fd1') }, uC2: { value: new T.Color(o.c2 || '#9fe8ff') } }, num(o.size, 0.22), num(o.bright, 0.7));
      return { root: pts, update: function (lt, A) { pts.material.uniforms.uTime.value = lt; pts.material.uniforms.uAlpha.value = A; } };
    });
  });

  def('globe3d', '点阵球：由点组成的球体缓慢自转，表面有光弧在两点之间飞过（全球网络、数据连接）。参数 r=半径、n=点数、arcs=光弧数、spin、color=点的颜色、arc=光弧颜色', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 5)), R = num(o.r, 6), n = num(o.n, 9000), na = num(o.arcs, 22), src = new Float32Array(n * 3), i, root = new T.Group(), spin = num(o.spin, 0.25), arcs = [];
      var onSphere = function (k, m) { var y = 1 - 2 * (k + 0.5) / m, q = Math.sqrt(1 - y * y), ph = k * Math.PI * (3 - Math.sqrt(5)); return new T.Vector3(Math.cos(ph) * q, y, Math.sin(ph) * q); };
      for (i = 0; i < n; i++) { var p = onSphere(i, n); src[i * 3] = p.x * R; src[i * 3 + 1] = p.y * R; src[i * 3 + 2] = p.z * R; }
      var col = new T.Color(o.color || '#6fd3ff');
      var pts = points(s3, n, { src: src, sz: f32(n, function () { return 0.6 + r() * 0.9; }), col: colArr(n, function (i, c) { c.copy(col); }) }, 'attribute vec3 src; void P(out vec3 p, inout vec3 c, inout float a){ p = src; }', null, num(o.size, 0.1), num(o.bright, 1.5));
      root.add(pts);
      root.add(new T.Mesh(new T.SphereGeometry(R * 0.985, 48, 24), new T.MeshBasicMaterial({ color: 0x030a18 })));       // 挡住背面的点
      for (i = 0; i < na; i++) {
        var a = onSphere(Math.floor(r() * n), n), b = onSphere(Math.floor(r() * n), n), mid = a.clone().add(b).normalize().multiplyScalar(1 + a.distanceTo(b) * 0.35), P3 = [];
        for (var k = 0; k <= 48; k++) { var t = k / 48, q = a.clone().multiplyScalar((1 - t) * (1 - t)).add(mid.clone().multiplyScalar(2 * t * (1 - t))).add(b.clone().multiplyScalar(t * t)); P3.push(q.multiplyScalar(R)); }
        var ln = new T.Line(new T.BufferGeometry().setFromPoints(P3), new T.LineBasicMaterial({ color: new T.Color(o.arc || '#ffb060'), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
        ln.userData = { ph: r() * 2, sp: 0.35 + r() * 0.35 }; arcs.push(ln); root.add(ln);
      }
      return { root: root, update: function (lt, A) {
        pts.material.uniforms.uAlpha.value = A; root.rotation.y = lt * spin;
        for (var i = 0; i < arcs.length; i++) { var h = (arcs[i].userData.ph + lt * arcs[i].userData.sp) % 2, s = Math.floor(clamp(h - 0.45, 0, 1) * 48), e = Math.ceil(clamp(h, 0, 1) * 48); arcs[i].geometry.setDrawRange(s, Math.max(0, e - s + 1)); arcs[i].material.opacity = A; }
      } };
    });
  });

  def('blackhole3d', '立体黑洞：黑色球体 + 始终朝向镜头的光环 + 粒子吸积盘，镜头可以绕着它转。参数 r=黑洞半径、n、disk=吸积盘外半径（r 的倍数）、speed、c1=内圈色、c2=外圈色', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 6)), R = num(o.r, 2.4), n = num(o.n, 50000), disk = num(o.disk, 5.5), c1 = new T.Color(o.c1 || '#fff0c4'), c2 = new T.Color(o.c2 || '#ff7a2f'), rad = new Float32Array(n), root = new T.Group(), i;
      for (i = 0; i < n; i++) rad[i] = R * (1.35 + Math.pow(r(), 1.5) * (disk - 1.35));
      var pts = points(s3, n, { a0: f32(n, function () { return r() * TAU; }), rad: rad, hgt: f32(n, function (i) { return (r() - 0.5) * 0.12 * rad[i] / R; }), sz: f32(n, function () { return 0.5 + r() * 1.5; }),
        col: colArr(n, function (i, c) { c.copy(c1).lerp(c2, clamp((rad[i] / R - 1.35) / (disk - 1.35) * 1.4, 0, 1)); }) },
        'attribute float a0; attribute float rad; attribute float hgt; uniform float uSpd; uniform float uR; void P(out vec3 p, inout vec3 c, inout float a){ float an = a0 + uTime * uSpd * pow(uR * 1.35 / rad, 1.5); p = vec3(cos(an) * rad, hgt, sin(an) * rad); }',
        { uSpd: { value: num(o.speed, 1.6) }, uR: { value: R } }, num(o.size, 0.05), num(o.bright, 0.4));
      root.add(pts);
      root.add(new T.Mesh(new T.SphereGeometry(R, 48, 24), new T.MeshBasicMaterial({ color: 0x000000 })));
      var ring = new T.Mesh(new T.RingGeometry(R * 1.01, R * 1.07, 96), new T.MeshBasicMaterial({ color: c1, transparent: true, side: T.DoubleSide, depthWrite: false })); root.add(ring);
      return { root: root, update: function (lt, A) { pts.material.uniforms.uTime.value = lt; pts.material.uniforms.uAlpha.value = A; ring.material.opacity = A; },
        late: function (cam) { ring.quaternion.copy(cam.quaternion); } };
    }, { fade: 0.8 });
  });

  def('burst3d', '立体爆炸：几万个粒子从中心朝四面八方炸开，越飞越慢，带一次强闪光。参数 n、power=力度、life=持续秒数、colors', function (c) {
    obj(c, function (s3, o, O) {
      var r = FX.rand(num(o.seed, 7)), n = num(o.n, 30000), life = num(o.life, 2.8), cols = colors(o.colors, ['#ffd08a', '#ff8a4d', '#ffffff', '#6fd3ff']).map(function (x) { return new T.Color(x); }), dir = new Float32Array(n * 3), i, root = new T.Group();
      if (o.dur === undefined) O.dur = Math.min(O.dur, life + 0.2);
      for (i = 0; i < n; i++) { var u = r() * 2 - 1, ph = r() * TAU, q = Math.sqrt(1 - u * u), v = 0.2 + r() * r() * 1.4; dir[i * 3] = q * Math.cos(ph) * v; dir[i * 3 + 1] = u * v; dir[i * 3 + 2] = q * Math.sin(ph) * v; }
      var pts = points(s3, n, { dir: dir, sz: f32(n, function () { return 0.5 + r() * 1.6; }), col: colArr(n, function (i, c) { c.copy(cols[Math.floor(r() * cols.length)]); }) },
        'attribute vec3 dir; uniform float uPow; void P(out vec3 p, inout vec3 c, inout float a){ p = dir * uPow * (1.0 - exp(-1.7 * uTime)) / 1.7; }', { uPow: { value: num(o.power, 1) * 45 } }, num(o.size, 0.08), num(o.bright, 0.35));
      var flash = new T.Mesh(new T.SphereGeometry(1, 48, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      root.add(pts); root.add(flash);
      return { root: root, update: function (lt, A) { pts.material.uniforms.uTime.value = lt; pts.material.uniforms.uAlpha.value = A * clamp((1 - lt / life) * 2.2, 0, 1); flash.scale.setScalar(1 + lt * 9); flash.material.opacity = A * Math.exp(-lt * 12); } };
    }, { fade: 0, out: 0.3 });
  });

  def('text3d', '立体粒子字：空间里的粒子从四面八方聚成一行有厚度的字，镜头可以绕着看（中英文都行）。参数 text、w=字在场景里的宽度、depth=厚度层数、start=先飘多久、conv=聚拢秒数、color、n=最多多少粒、font、weight、scatter=散开半径', function (c) {
    var font = c.o.font || getComputedStyle(c.el).getPropertyValue('--fx-font-title').trim() || 'sans-serif';
    obj(c, function (s3, o) {
      var text = String(o.text === undefined ? 'HELLO' : o.text), ww = num(o.w, 22), layers = num(o.depth, 4), max = num(o.n, 40000), start = num(o.start, 0.5), conv = num(o.conv, 2.4), spec = (o.weight || 400) + ' 240px ' + font;
      var col = new T.Color(o.color || '#ffffff'), cv = document.createElement('canvas'); cv.width = 4096; cv.height = 420;
      var cx = cv.getContext('2d', { willReadFrequently: true }), root = new T.Group(), pts = null;
      var build = function () {
        var r = FX.rand(num(o.seed, 8)), W = cv.width, H = cv.height;
        cx.clearRect(0, 0, W, H); cx.font = spec; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#fff'; cx.fillText(text, W / 2, H / 2);
        var px = cx.getImageData(0, 0, W, H).data, gs = 4, P2, x, y, minx, maxx;
        for (var pass = 0; pass < 6; pass++) {
          P2 = []; minx = W; maxx = 0;
          for (y = gs >> 1; y < H; y += gs) for (x = gs >> 1; x < W; x += gs) if (px[(y * W + x) * 4 + 3] > 110) { P2.push([x, y]); if (x < minx) minx = x; if (x > maxx) maxx = x; }
          if (P2.length * layers <= max) break;
          gs = Math.ceil(gs * Math.sqrt(P2.length * layers / max) + 0.01);
        }
        var k = ww / Math.max(1, maxx - minx), mx = (minx + maxx) / 2, n = P2.length * layers, tgt = new Float32Array(n * 3), src = new Float32Array(n * 3), dl = new Float32Array(n), sz = new Float32Array(n), ca = new Float32Array(n * 3), S = num(o.scatter, ww * 1.6), i = 0;
        for (var l = layers - 1; l >= 0; l--) for (var j = 0; j < P2.length; j++) {            // 先放后层、最后放正面，正面画在最上面
          tgt[i * 3] = (P2[j][0] - mx) * k; tgt[i * 3 + 1] = -(P2[j][1] - H / 2) * k; tgt[i * 3 + 2] = -l * gs * k;
          var u = r() * 2 - 1, ph = r() * TAU, q = Math.sqrt(1 - u * u), d = S * (0.4 + r() * 0.9);
          src[i * 3] = q * Math.cos(ph) * d; src[i * 3 + 1] = u * d * 0.7; src[i * 3 + 2] = q * Math.sin(ph) * d;
          dl[i] = r(); sz[i] = 1; var sh = l === 0 ? 1 : 0.5 - l * 0.07; ca[i * 3] = col.r * sh; ca[i * 3 + 1] = col.g * sh; ca[i * 3 + 2] = col.b * sh; i++;
        }
        if (pts) { root.remove(pts); pts.geometry.dispose(); s3.mats.splice(s3.mats.indexOf(pts.material), 1); pts.material.dispose(); }
        pts = points(s3, n, { tgt: tgt, src: src, dl: dl, sz: sz, col: ca },
          'attribute vec3 tgt; attribute vec3 src; attribute float dl; uniform float uP; void P(out vec3 p, inout vec3 c, inout float a){ float e = clamp((uP * 1.45 - dl * 0.45), 0.0, 1.0); e = e * e * (3.0 - 2.0 * e); vec3 s = src; float an = (1.0 - e) * 2.2; s.xz = mat2(cos(an), -sin(an), sin(an), cos(an)) * s.xz; s.y += sin(uTime * 0.6 + dl * 6.28) * 0.6; p = mix(s, tgt, e); a = mix(0.55, 1.0, e); }',
          { uP: { value: 0 } }, num(o.size, gs * k * 1.2), num(o.bright, 0.42), true);
        root.add(pts);
      };
      build();
      if (document.fonts && document.fonts.load) document.fonts.load(spec, text).then(function () { build(); s3.redraw(); }, function () {});
      return { root: root, update: function (lt, A) { var u = pts.material.uniforms; u.uTime.value = lt; u.uAlpha.value = A; u.uP.value = clamp((lt - start) / conv, 0, 1); } };
    });
  });

  def('city3d', '城市：一条大街两旁的楼群，窗户发光、楼体有描边、路上有车灯流动，尽头可以放一轮落日。配 cam3d 让镜头沿街飞行。街道沿 -z 方向延伸。参数 rows=纵深几排、cols=每侧几列、road=路宽、lit=亮窗比例、colors=窗户颜色、wall=墙面色、edge=描边色（edge=0 不描边）、sun=落日颜色（sun=0 不要）、traffic=0 关掉车流', function (c) {
    obj(c, function (s3, o) {
      var r = FX.rand(num(o.seed, 9)), rows = num(o.rows, 26), cols = num(o.cols, 4), road = num(o.road, 18), cell = num(o.cell, 3.2), pitch = cell * 6, L = rows * pitch, root = new T.Group(), i, j;
      var cv = document.createElement('canvas'); cv.width = cv.height = 256;
      var x2 = cv.getContext('2d'), wc = colors(o.colors, ['#ffd9a0', '#9fd8ff', '#ffb070']), lit = num(o.lit, 0.38);
      x2.fillStyle = '#000'; x2.fillRect(0, 0, 256, 256);
      for (j = 0; j < 16; j++) for (i = 0; i < 16; i++) if (r() < lit) { x2.globalAlpha = 0.4 + r() * 0.6; x2.fillStyle = wc[Math.floor(r() * wc.length)]; x2.fillRect(i * 16 + 3, j * 16 + 4, 10, 8); }
      var em = new T.CanvasTexture(cv); em.wrapS = em.wrapT = T.RepeatWrapping; em.colorSpace = T.SRGBColorSpace; em.anisotropy = 8;
      var sp = [], sn = [], su = [], si = [], tp = [], ti = [], ep = [], tex = cell * 16;
      var quad = function (ax, az, bx, bz, h, nx, nz, len, u0, v0) {
        var b = sp.length / 3;
        sp.push(ax, 0, az, bx, 0, bz, bx, h, bz, ax, h, az); sn.push(nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz);
        su.push(u0, v0, u0 + len / tex, v0, u0 + len / tex, v0 + h / tex, u0, v0 + h / tex); si.push(b, b + 1, b + 2, b, b + 2, b + 3);
      };
      var box = function (cx, cz, w, h, d) {
        var u0 = Math.floor(r() * 16) / 16, v0 = Math.floor(r() * 16) / 16, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, b = tp.length / 3;
        quad(x1, z1, x1, z0, h, 1, 0, d, u0, v0); quad(x0, z0, x0, z1, h, -1, 0, d, u0, v0); quad(x0, z1, x1, z1, h, 0, 1, w, u0, v0); quad(x1, z0, x0, z0, h, 0, -1, w, u0, v0);
        tp.push(x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1); ti.push(b, b + 2, b + 1, b, b + 3, b + 2);
        ep.push(x0, 0, z0, x0, h, z0, x1, 0, z0, x1, h, z0, x1, 0, z1, x1, h, z1, x0, 0, z1, x0, h, z1, x0, h, z0, x1, h, z0, x1, h, z0, x1, h, z1, x1, h, z1, x0, h, z1, x0, h, z1, x0, h, z0);
      };
      for (var side = -1; side <= 1; side += 2) for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) {
        var w = (2 + Math.floor(r() * 3)) * cell, d = (2 + Math.floor(r() * 3)) * cell, h = (3 + Math.floor(Math.pow(r(), 2.2) * 26) + (i > 0 ? 3 : 0)) * cell;
        box(side * (road / 2 + pitch * 0.5 + i * pitch + (r() - 0.5) * cell), -j * pitch - pitch * 0.5 + (r() - 0.5) * cell, w, h, d);
      }
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); sg.setAttribute('normal', new T.Float32BufferAttribute(sn, 3)); sg.setAttribute('uv', new T.Float32BufferAttribute(su, 2)); sg.setIndex(si);
      root.add(new T.Mesh(sg, new T.MeshStandardMaterial({ color: new T.Color(o.wall || '#101a2e'), roughness: 0.75, metalness: 0.25, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: num(o.glow, 0.95), side: T.DoubleSide })));
      var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(tp, 3)); tg.setIndex(ti); tg.computeVertexNormals();
      root.add(new T.Mesh(tg, new T.MeshStandardMaterial({ color: 0x0b1222, roughness: 0.9, side: T.DoubleSide })));
      if (o.edge !== 0) { var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.Float32BufferAttribute(ep, 3)); root.add(new T.LineSegments(eg, new T.LineBasicMaterial({ color: new T.Color(o.edge || '#7fd0ff'), transparent: true, opacity: 0.55 }))); }
      var ground = new T.Mesh(new T.PlaneGeometry(road + cols * pitch * 2 + 400, L + 600), new T.MeshStandardMaterial({ color: 0x070b14, roughness: 0.55, metalness: 0.4 }));
      ground.rotation.x = -Math.PI / 2; ground.position.z = -L / 2; root.add(ground);
      var lane = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0.05, 40), new T.Vector3(0, 0.05, -L - 200)]), new T.LineDashedMaterial({ color: 0xffe0a8, dashSize: 3, gapSize: 5, transparent: true, opacity: 0.8 }));
      lane.computeLineDistances(); root.add(lane);
      var cars = null;
      if (o.traffic !== 0) {
        var nc = 260;
        cars = points(s3, nc, { lane: f32(nc, function (i) { return (i % 2 ? 1 : -1) * (road * 0.18 + (r() > 0.5 ? road * 0.16 : 0)); }), z0: f32(nc, function () { return r() * (L + 200); }), v: f32(nc, function () { return 26 + r() * 30; }), sz: f32(nc, function () { return 1; }),
          col: colArr(nc, function (i, c) { c.set(i % 2 ? '#ff4030' : '#fff2d0'); }) },
          'attribute float lane; attribute float z0; attribute float v; uniform float uLen; void P(out vec3 p, inout vec3 c, inout float a){ float z = mod(z0 + uTime * v, uLen); p = vec3(lane, 0.5, lane > 0.0 ? 40.0 - z : 40.0 - uLen + z); }', { uLen: { value: L + 200 } }, 0.9, 1.4);
        root.add(cars);
      }
      if (o.sun !== 0) { var sun = new T.Mesh(new T.CircleGeometry(L * 0.16, 64), new T.MeshBasicMaterial({ color: new T.Color(o.sun || '#ffb060'), fog: false })); sun.position.set(0, L * 0.1, -L - 180); root.add(sun); }
      return { root: root, update: function (lt, A) { if (cars) { cars.material.uniforms.uTime.value = lt; cars.material.uniforms.uAlpha.value = A; } } };
    }, { fade: 0, out: 0 });
  });

  /* ═════════════════════════ 摄像机 ═════════════════════════ */

  def('cam3d', '移动摄像机：从当前位置飞到新位置，同时把视线转向新目标。参数 x / y / z=飞到哪、lx / ly / lz=看向哪、fov=视角、dur、ease（dur=0 就是直接切过去）。没写的参数保持不变', function (c) {
    var s3 = stage(c), o = c.o, e = easeFn(o.ease, 'inout');
    var seg = { t0: c.t, dur: num(o.dur, 2), prep: function () {}, at: function (t) {
      var f = seg.from, p = seg.dur > 0 ? e(clamp((t - seg.t0) / seg.dur, 0, 1)) : 1, out = {};
      ['x', 'y', 'z', 'lx', 'ly', 'lz', 'fov'].forEach(function (k) { out[k] = lerp(f[k], num(o[k], f[k]), p); });
      return out;
    } };
    s3.cams.push(seg); s3.sorted = false;
  });

  def('orbit3d', '环绕镜头：摄像机绕着目标转圈，可以同时拉近 / 升高。参数 turn=转多少度（负数反向）、from=起始角度（不写就从当前位置开始）、r=结束时离目标多远、h=结束时的高度、lx / ly / lz=绕着哪里转、dur、ease', function (c) {
    var s3 = stage(c), o = c.o, e = easeFn(o.ease, 'linear'), P = {};
    var seg = { t0: c.t, dur: num(o.dur, c.sceneDur || 6),
      prep: function (f) {
        P.lx = num(o.lx, f.lx); P.ly = num(o.ly, f.ly); P.lz = num(o.lz, f.lz);
        var dx = f.x - P.lx, dz = f.z - P.lz;
        P.a0 = o.from !== undefined ? num(o.from, 0) * Math.PI / 180 : Math.atan2(dz, dx);
        P.r0 = o.r0 !== undefined ? num(o.r0, 10) : Math.hypot(dx, dz) || 0.001; P.h0 = o.h0 !== undefined ? num(o.h0, 0) : f.y - P.ly;
        P.a1 = P.a0 + num(o.turn, 90) * Math.PI / 180; P.r1 = num(o.r, P.r0); P.h1 = num(o.h, P.h0); P.fov = f.fov;
      },
      at: function (t) {
        var p = seg.dur > 0 ? e(clamp((t - seg.t0) / seg.dur, 0, 1)) : 1, a = lerp(P.a0, P.a1, p), rr = lerp(P.r0, P.r1, p);
        return { x: P.lx + Math.cos(a) * rr, y: P.ly + lerp(P.h0, P.h1, p), z: P.lz + Math.sin(a) * rr, lx: P.lx, ly: P.ly, lz: P.lz, fov: P.fov };
      } };
    s3.cams.push(seg); s3.sorted = false;
  });
})(window);
