/*!
 * FX 白底立体全系模块 v2.5 (fx-desk3d.js)  ——  纯白无影棚 & 白格立体牌桌（18 组件 · 30 动效 · 1 专属转场）
 *
 * 完整覆盖「白格牌桌拟物立体风」与「纯白影棚 3D 硬件样机风」六大类全部动效：
 *   一、牌桌与卡牌物理：letterdeck / sleeve3d / card3d / deck3d / carousel3d · flip-3d / deal-arc / deck-gather / letter-shuffle / sleeve-draw / grid-hero / carousel-next / card-storm
 *   二、六面体盒与碰撞：box3d / slabs3d / coins3d · box-drop / slab-shatter / coin-drop / polaroid-eject
 *   三、三维架构与图解：layers3d / wall3d / timeline3d / paperstack / callouts3d / youarehere · layer-explode / layer-focus / board-lay / stack-print / lock-callouts / pin-move / wall-pull
 *   四、纯白影棚真机群：phone3d · pose-3d / rig-focus / phone-split / screen-pop / phone-wave
 *   五、白底拟物交互UI：flap3d / calgrid3d / ctabar · float-pop / flap-to / cal-flip / bubble-pop3d / cta-click
 *   六、空间光影与转场：desk-invert · 转场 card-wipe（3D 巨卡贴脸擦镜）
 */
(function (g, doc) {
  'use strict';
  var FX = g.FX;
  if (!FX) throw new Error('fx-desk3d：请先加载 fx.js');

  var num = function (v, d0) { return v === undefined || v === null || v === '' || isNaN(+v) ? d0 : +v; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rad = function (deg) { return deg * Math.PI / 180; };
  var d = function () { return doc || g.document; };
  var $ = function (s, r) { return (r || d()).querySelector(s); };
  var mk = function (tag, cls) { var e = d().createElement(tag); if (cls) e.className = cls; return e; };
  var kidsOf = function (el) { return Array.prototype.slice.call(el.children); };
  var attr = function (el, k, defVal) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? defVal : v; };
  var stageEl = function () { return $('[data-composition-id]'); };
  var parseTilt = function (s, defArr) {
    if (!s) return defArr.slice();
    var p = String(s).split(',').map(Number);
    return [num(p[0], defArr[0]), num(p[1], defArr[1]), num(p[2], defArr[2])];
  };
  var fmtComma = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var localT = function (c) { return c.t - (c.scene ? c.scene.t : 0); };
  var has3dRig = function (el) {
    return !!(el && (el.__d3d || (el.querySelector && el.querySelector('.fx-phone3d,.fx-card3d,.fx-box3d,.fx-wall3d,.fx-layers3d,.fx-deck3d,.fx-coins3d,.fx-sleeve3d'))));
  };
  var def = FX.register;
  var CAT = '立体';

  /* ───────────────────── 通用 3D 姿态与台面投影解算 ───────────────────── */

  function paintRig(obj) {
    if (!obj || !obj.rig) return;
    var s = obj.state;
    obj.rig.style.transform =
      'translate3d(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px,' + s.z.toFixed(1) + 'px) ' +
      'rotateX(' + s.rx.toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg) rotateZ(' + s.rz.toFixed(2) + 'deg) ' +
      'scale3d(' + s.sc.toFixed(4) + ',' + s.sc.toFixed(4) + ',' + s.sc.toFixed(4) + ')';
    if (obj.shadow) {
      var lift = Math.max(0, s.z);
      var sx = 16 + lift * 0.24 - s.ry * 0.65;
      var sy = 28 + lift * 0.44 + s.rx * 0.55;
      var blur = 24 + lift * 0.22;
      var alpha = clamp(0.24 / (1 + lift * 0.0055), 0.06, 0.3);
      var ssc = clamp(0.96 - lift * 0.0006, 0.78, 1.02);
      obj.shadow.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,-42px) scale(' + ssc.toFixed(3) + ')';
      obj.shadow.style.filter = 'blur(' + blur.toFixed(1) + 'px)';
      obj.shadow.style.background = 'rgba(15,23,42,' + alpha.toFixed(3) + ')';
    }
    if (obj.front && obj.back) {
      var frontUp = Math.cos(rad(s.ry)) * Math.cos(rad(s.rx)) >= 0;
      obj.front.style.visibility = frontUp ? '' : 'hidden';
      obj.back.style.visibility = frontUp ? 'hidden' : '';
    }
  }

  function shadeHex(hex, amt) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return hex;
    var n = parseInt(m[1], 16);
    var r = clamp(((n >> 16) & 255) + amt, 0, 255);
    var g0 = clamp(((n >> 8) & 255) + amt, 0, 255);
    var b = clamp((n & 255) + amt, 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g0 << 8) + b).toString(16).slice(1);
  }

  /* ═════════════════════ 18 个白底立体组件生成器（data-make） ═════════════════════ */

  /* 1. phone3d：真厚度圆角金属中框 3D 竖屏手机 */
  FX.make.phone3d = function (el) {
    var kids = kidsOf(el), tilt = parseTilt(attr(el, 'tilt', ''), [-16, 5, 0]);
    var thick = clamp(num(attr(el, 'thick'), 32), 8, 52), slices = Math.max(5, Math.round(thick / 2.8));
    el.classList.add('fx-phone3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var rig = mk('div', 'fx-phone3d-rig'), shadow = mk('div', 'fx-3d-shadow');
    shadow.style.borderRadius = '54px';
    rig.appendChild(shadow);
    for (var i = slices; i >= 1; i--) {
      var sl = mk('div', 'fx-phone3d-slice');
      sl.style.transform = 'translateZ(' + (-i * (thick / slices)).toFixed(2) + 'px)';
      rig.appendChild(sl);
    }
    var face = mk('div', 'fx-phone3d-face'), screen = mk('div', 'fx-phone3d-screen');
    kids.forEach(function (k) { screen.appendChild(k); });
    if (attr(el, 'island', '1') !== '0') screen.appendChild(mk('div', 'fx-phone3d-island'));
    if (attr(el, 'glare', '1') !== '0') screen.appendChild(mk('div', 'fx-phone3d-glare'));
    face.appendChild(screen);
    rig.appendChild(face);
    el.appendChild(rig);
    el.__d3d = {
      kind: 'phone3d', rig: rig, shadow: shadow, screen: screen,
      base: { x: 0, y: 0, z: 0, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: 1 },
      state: { x: 0, y: 0, z: 0, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: 1 }
    };
    paintRig(el.__d3d);
  };

  /* 2. card3d：双面纸叠厚边扑克 / 拍立得展卡 */
  FX.make.card3d = function (el) {
    var kids = kidsOf(el), facedown = attr(el, 'facedown', '0') === '1';
    var tilt = parseTilt(attr(el, 'tilt', ''), [facedown ? 180 : 0, 0, 0]);
    if (facedown && !el.hasAttribute('data-tilt')) tilt[0] = 180;
    el.classList.add('fx-card3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var rig = mk('div', 'fx-card3d-rig'), shadow = mk('div', 'fx-3d-shadow');
    shadow.style.borderRadius = '24px';
    rig.appendChild(shadow);
    for (var k = 1; k <= 4; k++) {
      var edge = mk('div', 'fx-card3d-edge');
      edge.style.transform = 'translateZ(' + (-k * 2.2).toFixed(1) + 'px)';
      rig.appendChild(edge);
    }
    var front = mk('div', 'fx-card3d-front'), pol = attr(el, 'polaroid', ''), progFill = null;
    if (pol) {
      var parts = pol.split('|'), wrap = mk('div', 'fx-polaroid'), view = mk('div', 'fx-polaroid-view'), foot = mk('div', 'fx-polaroid-foot');
      kids.forEach(function (ch) { view.appendChild(ch); });
      foot.innerHTML = (parts[0] ? '<b>' + parts[0] + '</b>' : '') +
        (parts[1] ? '<strong>' + parts[1] + '</strong>' : '') +
        (parts[2] ? '<span>· ' + parts[2] + '</span>' : '');
      wrap.appendChild(view); wrap.appendChild(foot);
      if (attr(el, 'progress', '') !== '') {
        var pb = mk('div', 'fx-polaroid-prog'); progFill = mk('i'); pb.appendChild(progFill); wrap.appendChild(pb);
      }
      front.appendChild(wrap);
    } else {
      kids.forEach(function (ch) { front.appendChild(ch); });
    }
    var back = mk('div', 'fx-card3d-back'), backColor = attr(el, 'back-color', '');
    if (backColor) back.style.setProperty('--card-back', backColor);
    var emblem = attr(el, 'back', 'A'), brand = attr(el, 'brand', 'MOTION · OPEN');
    back.innerHTML = '<div class="fx-card3d-back-in">' +
      '<span class="fx-card3d-meta" data-lint="off">' + brand + '</span>' +
      '<div class="fx-card3d-emblem"><b data-lint="off">' + emblem + '</b></div>' +
      '<span class="fx-card3d-meta" data-lint="off">3D DECK · SERIES</span></div>';
    rig.appendChild(back);
    rig.appendChild(front);
    el.appendChild(rig);
    el.__d3d = {
      kind: 'card3d', rig: rig, shadow: shadow, front: front, back: back, prog: progFill,
      base: { x: 0, y: 0, z: 0, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: 1 },
      state: { x: 0, y: 0, z: 0, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: 1 }
    };
    paintRig(el.__d3d);
  };

  /* 3. box3d：真六面体立体包装盒 */
  FX.make.box3d = function (el) {
    var kids = kidsOf(el), dep = clamp(num(attr(el, 'depth'), 46), 14, 120);
    var tilt = parseTilt(attr(el, 'tilt', ''), [-8, 38, -4]);
    var col = attr(el, 'color', '#2563eb'), lightBox = /^#(f|e|d|fff)/i.test(col) || col === 'white';
    el.classList.add('fx-box3d');
    el.setAttribute('data-lint', 'overflow-ok');
    el.style.setProperty('--box-bg', col);
    el.style.setProperty('--box-front', lightBox ? '#d5dae3' : shadeHex(col, -28));
    el.style.setProperty('--box-side', lightBox ? '#bcc3d0' : shadeHex(col, -48));
    el.style.setProperty('--box-ink', lightBox ? '#0f1117' : '#ffffff');

    var rig = mk('div', 'fx-box3d-rig'), shadow = mk('div', 'fx-3d-shadow');
    shadow.style.borderRadius = '14px';
    shadow.style.transform = 'translate3d(18px,36px,' + (-dep - 8) + 'px)';
    rig.appendChild(shadow);

    var top = mk('div', 'fx-box3d-top');
    top.style.transform = 'translateZ(0px)';
    kids.forEach(function (ch) { top.appendChild(ch); });

    var lip = mk('div', 'fx-box3d-lip');
    lip.setAttribute('data-lint', 'off');
    lip.style.height = dep + 'px'; lip.style.top = '100%'; lip.style.transform = 'rotateX(-90deg)';
    lip.textContent = attr(el, 'side', '');

    var wallR = mk('div', 'fx-box3d-wall-r');
    wallR.style.width = dep + 'px'; wallR.style.left = '100%'; wallR.style.transform = 'rotateY(90deg)';

    var wallL = mk('div', 'fx-box3d-wall-l');
    wallL.style.width = dep + 'px'; wallL.style.left = '0'; wallL.style.transform = 'rotateY(90deg)';

    rig.appendChild(wallL); rig.appendChild(wallR); rig.appendChild(lip); rig.appendChild(top);
    el.appendChild(rig);
    el.__d3d = {
      kind: 'box3d', rig: rig, shadow: shadow, depth: dep,
      base: { x: 0, y: 0, z: dep * 0.5, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: 1 },
      state: { x: 0, y: 0, z: dep * 0.5, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: 1 }
    };
    paintRig(el.__d3d);
  };

  /* 4. layers3d：三维爆炸分层架构台 */
  FX.make.layers3d = function (el) {
    var raw = kidsOf(el), n = raw.length, gap = num(attr(el, 'gap'), 118), startSpread = num(attr(el, 'spread'), 1);
    el.classList.add('fx-layers3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var stage = mk('div', 'fx-layers3d-stage'), calls = mk('div', 'fx-layers3d-callouts');
    var svgNS = 'http://www.w3.org/2000/svg', svg = d().createElementNS ? d().createElementNS(svgNS, 'svg') : mk('svg');
    svg.setAttribute('class', 'fx-layers3d-guide');
    svg.setAttribute('viewBox', '0 0 760 660');
    var guides = [];
    if (d().createElementNS) {
      [[155, 470], [605, 470], [215, 290], [545, 290]].forEach(function (pt) {
        var ln = d().createElementNS(svgNS, 'line');
        ln.setAttribute('x1', pt[0]); ln.setAttribute('y1', pt[1]);
        ln.setAttribute('x2', pt[0]); ln.setAttribute('y2', pt[1] - (n - 1) * gap);
        ln.setAttribute('stroke', 'rgba(37,99,235,0.34)');
        ln.setAttribute('stroke-width', '2.5');
        ln.setAttribute('stroke-dasharray', '8 8');
        svg.appendChild(ln);
        guides.push({ el: ln, y0: pt[1] });
      });
    }
    stage.appendChild(svg);

    var plates = [], rows = [];
    raw.forEach(function (k, i) {
      var col = attr(k, 'color', i === 0 ? '#2563eb' : i === 1 ? '#ef4444' : '#0f1117');
      var topCard = attr(k, 'top', '') === 'card';
      var p = mk('div', 'fx-layers3d-plate' + (i === 0 ? ' solid' : '') + (topCard ? ' card-top' : ''));
      p.style.setProperty('--layer-c', col);
      p.style.zIndex = String(10 + i);
      while (k.firstChild) p.appendChild(k.firstChild);
      var tagTxt = attr(k, 'tag', '');
      if (tagTxt && !topCard) { var tg = mk('span', 'fx-layers3d-tag'); tg.textContent = tagTxt; p.appendChild(tg); }
      stage.appendChild(p);
      plates.push({ el: p, i: i, topCard: topCard, col: col, lift: 0 });

      var row = mk('div', 'fx-layers3d-row');
      row.style.setProperty('--layer-c', col);
      row.innerHTML = '<div class="fx-layers3d-txt"><strong>' + attr(k, 'label', '第 ' + (i + 1) + ' 层') + '</strong>' +
        (attr(k, 'sub', '') ? '<small data-lint="off">' + attr(k, 'sub') + '</small>' : '') + '</div>' +
        '<div class="fx-layers3d-line"></div>';
      rows.push(row);
      if (k.parentNode === el) el.removeChild(k);
    });
    for (var r = rows.length - 1; r >= 0; r--) calls.appendChild(rows[r]);
    el.appendChild(calls); el.appendChild(stage);
    el.__layers = { plates: plates, rows: rows, guides: guides, gap: gap, spread: startSpread };
    paintLayers(el, startSpread);
  };

  function paintLayers(el, spread) {
    var L = el.__layers; if (!L) return;
    L.spread = spread;
    var step = lerp(18, L.gap, spread);
    L.plates.forEach(function (p, i) {
      var y = -i * step - (p.lift || 0);
      if (p.topCard) p.el.style.transform = 'translate3d(0,' + (y - 34).toFixed(1) + 'px,' + (i * 24 + 20).toFixed(1) + 'px) rotateX(12deg) rotateY(-8deg) scale(0.76)';
      else p.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) rotateX(54deg) rotateZ(-14deg)';
    });
    L.guides.forEach(function (g0) {
      g0.el.setAttribute('y2', (g0.y0 - (L.plates.length - 1) * step).toFixed(1));
      g0.el.style.opacity = clamp(spread, 0, 1).toFixed(2);
    });
  }

  /* 5. deck3d：桌面厚牌堆与弧道 */
  FX.make.deck3d = function (el) {
    var existing = kidsOf(el), n = existing.length || num(attr(el, 'count'), 10);
    var layout = attr(el, 'layout', 'horseshoe'), emblem = attr(el, 'emblem', 'A'), col = attr(el, 'color', '');
    var dealt = attr(el, 'dealt', '1') !== '0';
    el.classList.add('fx-deck3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var plane = mk('div', 'fx-deck3d-plane');
    plane.style.transform = 'rotateX(' + num(attr(el, 'rx'), 40) + 'deg) rotateZ(' + num(attr(el, 'rz'), -6) + 'deg)';
    var cards = [];
    for (var i = 0; i < n; i++) {
      var c = mk('div', 'fx-deck3d-card');
      if (col) c.style.setProperty('--deck-c', col);
      if (existing[i]) { c.innerHTML = ''; c.appendChild(existing[i]); }
      else c.innerHTML = '<div class="fx-deck3d-card-in"><span data-lint="off">' + emblem + '</span></div>';
      plane.appendChild(c);
      var t = n > 1 ? i / (n - 1) : 0.5, tx, ty, rot;
      if (layout === 'arc') {
        var ang = (t - 0.5) * 86; tx = Math.sin(rad(ang)) * 390; ty = (1 - Math.cos(rad(ang))) * 240 - 30; rot = ang * 0.75;
      } else {
        var a2 = lerp(-125, 115, t); tx = -Math.cos(rad(a2)) * 280 + 40; ty = Math.sin(rad(a2)) * 240; rot = a2 + 90;
      }
      cards.push({ el: c, sx: 60, sy: -150 - i * 3.2, sz: i * 2.5, srot: -8, tx: tx, ty: ty, tz: i * 1.5, trot: rot });
    }
    el.appendChild(plane);
    el.__deck = { cards: cards, dealt: dealt ? 1 : 0 };
    paintDeck(el, dealt ? 1 : 0);
  };

  function paintDeck(el, p) {
    var D = el.__deck; if (!D) return;
    D.cards.forEach(function (c, i) {
      var n = D.cards.length, start = i / Math.max(1, n) * 0.55, local = clamp((p - start) / 0.45, 0, 1);
      var e = 1 - Math.pow(1 - local, 3);
      var x = lerp(c.sx, c.tx, e), y = lerp(c.sy, c.ty, e), z = lerp(c.sz, c.tz, e) + Math.sin(Math.PI * local) * 36;
      var r = lerp(c.srot, c.trot, e);
      c.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateZ(' + r.toFixed(1) + 'deg)';
      c.el.style.zIndex = String(10 + i);
    });
  }

  /* 6. wall3d：白底 3D 倾斜悬浮卡片矩阵 */
  FX.make.wall3d = function (el) {
    var kids = kidsOf(el), cols = Math.max(2, num(attr(el, 'cols'), 4));
    var cw = num(attr(el, 'w'), 440), ch = num(attr(el, 'h'), 250), gap = num(attr(el, 'gap'), 28);
    var tilt = parseTilt(attr(el, 'tilt', ''), [-14, 22, -8]);
    el.classList.add('fx-wall3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var rig = mk('div', 'fx-wall3d-rig');
    var rows = Math.ceil(kids.length / cols);
    var totalW = cols * cw + (cols - 1) * gap, totalH = rows * ch + (rows - 1) * gap;
    rig.style.gridTemplateColumns = 'repeat(' + cols + ',' + cw + 'px)';
    rig.style.gap = gap + 'px';
    rig.style.width = totalW + 'px';
    rig.style.marginLeft = (-totalW / 2) + 'px';
    rig.style.marginTop = (-totalH / 2) + 'px';
    kids.forEach(function (k, i) {
      k.classList.add('fx-wall3d-item');
      k.style.width = cw + 'px'; k.style.height = ch + 'px';
      k.style.transform = 'translateZ(' + (((i % 3) - 1) * 18) + 'px)';
      rig.appendChild(k);
    });
    el.appendChild(rig);
    el.__wall3d = {
      rig: rig, kids: kids, cols: cols, rows: rows,
      pose: { x: 0, y: 0, z: 0, ry: tilt[0], rx: tilt[1], rz: tilt[2], sc: num(attr(el, 'scale'), 0.96) }
    };
    paintWall3d(el, el.__wall3d.pose);
  };

  function paintWall3d(el, p) {
    var W3 = el.__wall3d; if (!W3) return;
    W3.rig.style.transform =
      'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,' + p.z.toFixed(1) + 'px) ' +
      'rotateX(' + p.rx.toFixed(2) + 'deg) rotateY(' + p.ry.toFixed(2) + 'deg) rotateZ(' + p.rz.toFixed(2) + 'deg) ' +
      'scale3d(' + p.sc.toFixed(4) + ',' + p.sc.toFixed(4) + ',' + p.sc.toFixed(4) + ')';
  }

  /* 7. flap3d：立体机械翻牌计数器 */
  FX.make.flap3d = function (el) {
    var val = attr(el, 'value', el.textContent.trim() || '1,000+');
    el.classList.add('fx-flap3d');
    el.innerHTML = '';
    el.__flap = { slots: [], cur: val };
    renderFlapSlots(el, val);
  };

  function renderFlapSlots(el, str) {
    var F = el.__flap; if (!F) return;
    el.innerHTML = ''; F.slots = [];
    Array.from(String(str)).forEach(function (ch) {
      if (ch === ',' || ch === '.' || ch === '+' || ch === '%') {
        var sep = mk('span', 'fx-flap3d-sep' + (ch === ',' ? ' comma' : ''));
        sep.textContent = ch; el.appendChild(sep);
        F.slots.push({ el: sep, sep: true, ch: ch });
      } else {
        var tile = mk('span', 'fx-flap3d-tile');
        tile.textContent = ch; el.appendChild(tile);
        F.slots.push({ el: tile, sep: false, ch: ch });
      }
    });
  }

  /* 8. letterdeck：单字扑克牌阵排标题（data-text="知识讲解类博主|要迎来{大洗牌}了"） */
  FX.make.letterdeck = function (el) {
    var raw = attr(el, 'text', el.textContent.trim() || '知识讲解|大洗牌');
    el.classList.add('fx-letterdeck');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var idx = 0, cards = [];
    raw.split('|').forEach(function (line) {
      var row = mk('div', 'fx-letterdeck-row'), hot = false;
      Array.from(line.trim()).forEach(function (ch) {
        if (ch === '{') { hot = true; return; }
        if (ch === '}') { hot = false; return; }
        idx++;
        var card = mk('div', 'fx-letter-card' + (hot ? ' req-hot' : ''));
        card.innerHTML = '<i class="no" data-lint="off">' + (idx < 10 ? '0' : '') + idx + '</i>' +
          '<i class="suit" data-lint="off">♦</i><span>' + ch + '</span>';
        row.appendChild(card);
        cards.push({ el: card, hot: hot, idx: idx });
      });
      el.appendChild(row);
    });
    el.__letters = cards;
  };

  /* 9. sleeve3d：牌盒套开口吐出整摞厚牌 */
  FX.make.sleeve3d = function (el) {
    var no = attr(el, 'no', '01'), title = attr(el, 'title', '第一批'), sub = attr(el, 'sub', '口播模板');
    var emblem = attr(el, 'emblem', 'M'), col = attr(el, 'color', '#181920');
    el.classList.add('fx-sleeve3d');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var deck = mk('div', 'fx-sleeve3d-deck');
    deck.style.setProperty('--sleeve-c', col);
    var sheets = [];
    for (var i = 0; i < 6; i++) {
      var s = mk('div', 'fx-sleeve3d-sheet');
      s.style.transform = 'translate3d(' + (i * 2) + 'px,' + (-i * 3) + 'px,' + (i * 3) + 'px)';
      s.innerHTML = '<div class="fx-sleeve3d-sheet-in"><span data-lint="off">' + emblem + '</span></div>';
      deck.appendChild(s);
      sheets.push(s);
    }
    var box = mk('div', 'fx-sleeve3d-box');
    box.innerHTML = '<b>' + no + '</b><div><strong>' + title + '</strong><span>' + sub + '</span></div>';
    el.appendChild(deck); el.appendChild(box);
    el.__sleeve = { box: box, deck: deck, sheets: sheets };
  };

  /* 10. carousel3d：底部扇形手牌托底 + 台面拍立得连切轮播 */
  FX.make.carousel3d = function (el) {
    var imgs = kidsOf(el), handN = num(attr(el, 'hand'), 6);
    el.classList.add('fx-carousel3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var stage = mk('div', 'fx-carousel3d-stage'), cards = [];
    imgs.forEach(function (im, i) {
      var c = mk('div', 'fx-carousel3d-card'), view = mk('div', 'fx-carousel3d-view'), foot = mk('div', 'fx-carousel3d-foot');
      var no = (i < 9 ? '0' : '') + (i + 1), tt = attr(im, 'title', im.getAttribute('alt') || '模板 ' + no), sub = attr(im, 'sub', '知识讲解');
      view.appendChild(im);
      foot.innerHTML = '<b>' + no + '</b><strong>' + tt + '</strong><span>· ' + sub + '</span>';
      c.appendChild(view); c.appendChild(foot); stage.appendChild(c);
      cards.push(c);
    });
    el.appendChild(stage);
    var hand = null, minis = [];
    if (handN > 0) {
      hand = mk('div', 'fx-carousel3d-hand');
      var mid = (handN - 1) / 2;
      for (var k = 0; k < handN; k++) {
        var mn = mk('div', 'fx-carousel3d-mini');
        var d0 = k - mid;
        mn.style.transform = 'translateX(' + (d0 * 64).toFixed(1) + 'px) translateY(' + (Math.abs(d0) * 10).toFixed(1) + 'px) rotate(' + (d0 * 8).toFixed(1) + 'deg)';
        mn.innerHTML = '<i></i>';
        hand.appendChild(mn);
        minis.push({ el: mn, d: d0 });
      }
      el.appendChild(hand);
    }
    el.__carousel = { cards: cards, minis: minis, cur: 0 };
    paintCarousel(el, 0);
  };

  function paintCarousel(el, pos) {
    var C = el.__carousel; if (!C) return;
    C.cards.forEach(function (c, i) {
      var rel = i - pos;
      if (rel < -1.2 || rel > 2.1) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      var x, y, sc, rz, ry, op;
      if (rel <= 0) {
        var u = clamp(-rel, 0, 1.2);
        x = lerp(0, -1180, u); y = lerp(0, 40, u); sc = lerp(1, 0.86, u); rz = lerp(-1.6, -12, u); ry = lerp(3, 24, u); op = clamp(1 - u * 0.9, 0, 1);
      } else if (rel <= 1) {
        x = lerp(0, 960, rel); y = lerp(0, 88, rel); sc = lerp(1, 0.52, rel); rz = lerp(-1.6, 3.8, rel); ry = lerp(3, -12, rel); op = 1;
      } else {
        var v = rel - 1;
        x = lerp(960, 1480, v); y = 88; sc = lerp(0.52, 0.38, v); rz = 6; ry = -16; op = clamp(1 - v, 0, 1);
      }
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotateY(' + ry.toFixed(1) + 'deg) rotateZ(' + rz.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      c.style.opacity = op.toFixed(3);
      c.style.zIndex = String(50 - Math.round(Math.abs(rel) * 10));
    });
    C.minis.forEach(function (m, k) {
      var wave = Math.sin(pos * 2.6 + k * 0.7) * 8;
      m.el.style.transform = 'translateX(' + (m.d * 64).toFixed(1) + 'px) translateY(' + (Math.abs(m.d) * 10 - Math.max(0, wave)).toFixed(1) + 'px) rotate(' + (m.d * 8 + wave * 0.25).toFixed(1) + 'deg)';
    });
  }

  /* 11. slabs3d：3D 厚石碑多米诺阵列（data-labels="资本,MCN,流量"） */
  FX.make.slabs3d = function (el) {
    var labels = attr(el, 'labels', '资本,MCN,流量').split(','), rnd = FX.rand(num(attr(el, 'seed'), 19));
    el.classList.add('fx-slabs3d');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var clips = [
      'polygon(0 0, 56% 0, 44% 52%, 0 46%)',
      'polygon(56% 0, 100% 0, 100% 48%, 44% 52%)',
      'polygon(0 46%, 44% 52%, 52% 100%, 0 100%)',
      'polygon(44% 52%, 100% 48%, 100% 100%, 52% 100%)'
    ];
    var slabs = labels.map(function (lb, i) {
      var s = mk('div', 'fx-slab3d'), body = mk('div', 'fx-slab3d-body');
      s.style.left = (70 + i * 355) + 'px';
      s.style.transform = 'rotateY(-16deg) rotateX(8deg) rotateZ(' + (-4 + i * 3) + 'deg)';
      body.textContent = lb.trim();
      s.appendChild(body);
      var shards = clips.map(function (cp) {
        var sh = mk('div', 'fx-slab3d-shard');
        sh.style.clipPath = cp;
        s.appendChild(sh);
        return {
          el: sh,
          dx: (rnd() - 0.35) * 520, dy: (rnd() - 0.55) * 420, dz: 60 + rnd() * 260,
          rx: (rnd() - 0.5) * 260, ry: (rnd() - 0.5) * 260, rz: (rnd() - 0.5) * 220
        };
      });
      el.appendChild(s);
      return { el: s, body: body, shards: shards, baseRz: -4 + i * 3 };
    });
    el.__slabs = slabs;
  };

  /* 12. coins3d：3D 立体筹码 / 金币组 */
  FX.make.coins3d = function (el) {
    var n = clamp(num(attr(el, 'count'), 5), 1, 12), sym = attr(el, 'symbol', '$'), rnd = FX.rand(num(attr(el, 'seed'), 23));
    el.classList.add('fx-coins3d');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var coins = [];
    for (var i = 0; i < n; i++) {
      var tx = 60 + (i % 3) * 130 + (rnd() - 0.5) * 34;
      var ty = 130 + Math.floor(i / 3) * 125 + (rnd() - 0.5) * 26;
      var sh = mk('div', 'fx-coin3d-shadow');
      sh.style.left = (tx + 8) + 'px'; sh.style.top = (ty + 98) + 'px';
      var c = mk('div', 'fx-coin3d');
      c.style.left = tx + 'px'; c.style.top = ty + 'px';
      for (var r = 1; r <= 4; r++) {
        var rim = mk('div', 'fx-coin3d-rim');
        rim.style.transform = 'translateZ(' + (r * 1.8).toFixed(1) + 'px)';
        c.appendChild(rim);
      }
      var face = mk('div', 'fx-coin3d-face');
      face.innerHTML = '<span data-lint="off">' + sym + '</span>';
      c.appendChild(face);
      el.appendChild(sh); el.appendChild(c);
      coins.push({ el: c, sh: sh, rx: 22 + (rnd() - 0.5) * 16, ry: (rnd() - 0.5) * 28, rz: (rnd() - 0.5) * 24 });
    }
    el.__coins = coins;
  };

  /* 13. timeline3d：立面面板后仰躺倒变 3D 剪辑时间轴轨道 */
  FX.make.timeline3d = function (el) {
    var imgs = kidsOf(el), title = attr(el, 'title', '技术支撑'), sub = attr(el, 'sub', 'AI 自动剪辑时间轴');
    el.classList.add('fx-timeline3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var board = mk('div', 'fx-timeline3d-board'), head = mk('div', 'fx-timeline3d-head');
    head.innerHTML = '<strong>' + title + '</strong><span>' + sub + '</span>';
    var ruler = mk('div', 'fx-timeline3d-ruler'), clipsWrap = mk('div', 'fx-timeline3d-clips');
    var clips = imgs.map(function (im) {
      var cl = mk('div', 'fx-timeline3d-clip'); cl.appendChild(im); clipsWrap.appendChild(cl); return cl;
    });
    var pin = mk('div', 'fx-timeline3d-head-pin');
    pin.innerHTML = '<span class="fx-timeline3d-badge">' + attr(el, 'badge', 'AI 剪辑中') + '</span>';
    board.appendChild(head); board.appendChild(ruler); board.appendChild(clipsWrap); board.appendChild(pin);
    el.appendChild(board);
    el.__tl3d = { board: board, clips: clips, pin: pin };
  };

  /* 14. paperstack：白纸复印叠厚 + 衰减进度条 */
  FX.make.paperstack = function (el) {
    var n = clamp(num(attr(el, 'sheets'), 8), 2, 16), label = attr(el, 'label', '新鲜感'), startVal = num(attr(el, 'from'), 100);
    var rnd = FX.rand(num(attr(el, 'seed'), 31));
    el.classList.add('fx-paperstack');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var pile = mk('div', 'fx-paperstack-pile'), sheets = [];
    for (var i = 0; i < n; i++) {
      var sh = mk('div', 'fx-paper-sheet');
      var rot = (rnd() - 0.5) * 18, dx = (rnd() - 0.5) * 28, dy = -i * 5;
      sh.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg)';
      sh.innerHTML = '<b' + (i < n - 1 ? ' data-lint="off"' : '') + '>' + attr(el, 'sheet-tag', 'AI 生成') + '</b>';
      if (i > 0) sh.style.opacity = '0';
      pile.appendChild(sh);
      sheets.push({ el: sh, dx: dx, dy: dy, rot: rot });
    }
    var meter = mk('div', 'fx-paperstack-meter'), bar = mk('div', 'fx-paperstack-bar'), fill = mk('div', 'fx-paperstack-fill'), val = mk('span', 'fx-paperstack-val');
    val.textContent = startVal + '%';
    bar.appendChild(fill);
    meter.innerHTML = '<strong>' + label + '</strong>';
    meter.appendChild(bar); meter.appendChild(val);
    el.appendChild(pile); el.appendChild(meter);
    el.__pstack = { sheets: sheets, fill: fill, val: val, from: startVal };
  };

  /* 15. callouts3d：四角取景框锁定 + 多分支水平引线组 */
  FX.make.callouts3d = function (el) {
    var kids = kidsOf(el), items = attr(el, 'items', '你本人,你的面孔,你的声音').split(',');
    el.classList.add('fx-callouts3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var list = mk('div', 'fx-callouts3d-list'), rows = [];
    items.forEach(function (it) {
      var r = mk('div', 'fx-callouts3d-item');
      r.innerHTML = '<strong>' + it.trim() + '</strong><div class="fx-callouts3d-line"></div>';
      list.appendChild(r); rows.push(r);
    });
    var box = mk('div', 'fx-callouts3d-box'), corners = mk('div', 'fx-callouts3d-corners');
    kids.forEach(function (k) { box.appendChild(k); });
    box.appendChild(corners);
    el.appendChild(list); el.appendChild(box);
    el.__call3d = { rows: rows, corners: corners, box: box };
  };

  /* 16. youarehere：全片分段路标游标卡 */
  FX.make.youarehere = function (el) {
    var segsN = clamp(num(attr(el, 'segments'), 5), 2, 10), cur = clamp(num(attr(el, 'at'), 0.72), 0.05, 0.96);
    var title = attr(el, 'title', '当前进度'), tc = attr(el, 'time', '02:48 / 03:20');
    el.classList.add('fx-youarehere');
    el.setAttribute('data-lint', 'overflow-ok');
    var top = mk('div', 'fx-yah-top');
    top.innerHTML = '<strong>' + title + '</strong><span>' + tc + '</span>';
    var track = mk('div', 'fx-yah-track'), segs = [];
    for (var i = 0; i < segsN; i++) {
      var sg = mk('div', 'fx-yah-seg' + ((i + 0.5) / segsN <= cur ? ' on' : ''));
      track.appendChild(sg); segs.push(sg);
    }
    var pin = mk('div', 'fx-yah-pin');
    pin.style.left = (cur * 100).toFixed(1) + '%';
    pin.innerHTML = '<b data-lint="off">YOU ARE HERE</b>';
    track.appendChild(pin);
    el.innerHTML = ''; el.appendChild(top); el.appendChild(track);
    el.__yah = { pin: pin, segs: segs, at: cur };
  };

  /* 17. calgrid3d：30 天日历翻牌矩阵 + 顶部联动计数器 */
  FX.make.calgrid3d = function (el) {
    var days = clamp(num(attr(el, 'days'), 30), 6, 36), label = attr(el, 'label', '单平台粉丝');
    var fromVal = num(attr(el, 'from'), 0);
    el.classList.add('fx-calgrid3d');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var kpi = mk('div', 'fx-calgrid3d-kpi'), numEl = mk('b');
    numEl.textContent = fmtComma(fromVal);
    kpi.innerHTML = '<span>' + label + '</span>';
    kpi.appendChild(numEl);
    var grid = mk('div', 'fx-calgrid3d-cells'), cells = [];
    for (var i = 1; i <= days; i++) {
      var cell = mk('div', 'fx-cal-cell'), back = mk('div', 'fx-cal-back'), front = mk('div', 'fx-cal-front');
      back.innerHTML = '<span data-lint="off">A</span>';
      front.innerHTML = '<span data-lint="off">' + (i < 10 ? '0' : '') + i + '</span>';
      cell.appendChild(back); cell.appendChild(front); grid.appendChild(cell);
      cells.push({ el: cell, front: front, back: back });
    }
    el.appendChild(kpi); el.appendChild(grid);
    el.__cal = { cells: cells, numEl: numEl, from: fromVal };
  };

  /* 18. ctabar：白底高浮起交互胶囊（send | follow） */
  FX.make.ctabar = function (el) {
    var kind = attr(el, 'kind', 'send'), text = attr(el, 'text', kind === 'follow' ? '新模板代码均已上传' : 'Fred');
    el.classList.add('fx-ctabar');
    el.setAttribute('data-lint', 'overflow-ok');
    el.innerHTML = '';
    var txt = mk('div', 'fx-ctabar-txt');
    txt.innerHTML = (kind === 'send' ? '<small>评论区</small>' : '') + text;
    var btn = mk('div', 'fx-ctabar-btn' + (kind === 'follow' ? ' like' : ''));
    btn.textContent = kind === 'follow' ? attr(el, 'btn', '点赞关注') : attr(el, 'btn', '发送');
    var cur = mk('div', 'fx-cursor');
    cur.style.left = '92%'; cur.style.top = '135%'; cur.style.opacity = '0';
    el.appendChild(txt); el.appendChild(btn); el.appendChild(cur);
    el.__cta = { btn: btn, cur: cur, kind: kind, before: btn.textContent, after: attr(el, 'after', kind === 'follow' ? '✓ 已关注' : '已发送 ✓') };
  };

  /* 19. steplist3d：纯白影棚步进聚焦流水线（FredTalk 流程拆解款） */
  function paintSteps3d(el, activeIdx) {
    var S = el.__steps; if (!S) return;
    S.rows.forEach(function (r, idx) {
      var k = idx + 1, isAct = activeIdx === k, isDone = activeIdx > k, allOn = activeIdx === 0;
      r.el.classList.toggle('is-active', isAct);
      r.el.classList.toggle('is-done', isDone);
      r.el.classList.toggle('is-dim', !allOn && activeIdx > 0 && k > activeIdx);
      r.no.textContent = isDone ? '✓' : (k < 10 ? '0' + k : '' + k);
      r.el.style.transform = isAct ? 'translate3d(18px,0,34px) scale(1.03)' : 'translate3d(0,0,0) scale(1)';
    });
  }
  FX.make.steplist3d = function (el) {
    var raw = kidsOf(el), initAct = num(attr(el, 'active'), 1);
    el.classList.add('fx-steplist3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var rows = raw.map(function (ch, idx) {
      var title = attr(ch, 'title', ch.textContent.trim() || ('步骤 ' + (idx + 1)));
      var sub = attr(ch, 'sub', '');
      var row = mk('div', 'fx-steplist3d-row'), no = mk('b', 'fx-steplist3d-no'), txt = mk('div', 'fx-steplist3d-txt');
      txt.innerHTML = '<strong>' + title + '</strong>' + (sub ? '<span>' + sub + '</span>' : '');
      row.appendChild(no); row.appendChild(txt);
      return { el: row, no: no, title: title };
    });
    el.innerHTML = '';
    rows.forEach(function (r) { el.appendChild(r.el); });
    el.__steps = { rows: rows, cur: initAct, plan: initAct };
    paintSteps3d(el, initAct);
  };

  /* 20. blueprint3d：四角取景裁切线「截图这一页」抄作业蓝图卡（阿杜片尾利他交付款） */
  FX.make.blueprint3d = function (el) {
    var raw = kidsOf(el);
    var badge = attr(el, 'badge', '建议截图保存'), title = attr(el, 'title', '截图这一页，交给你的 AI 助手');
    var repo = attr(el, 'repo', '');
    el.classList.add('fx-blueprint3d');
    el.setAttribute('data-lint', 'overflow-ok');
    var corners = mk('div', 'fx-blueprint3d-corners'), card = mk('div', 'fx-blueprint3d-card');
    var head = mk('div', 'fx-blueprint3d-head');
    head.innerHTML = '<strong>' + title + '</strong><span class="fx-blueprint3d-badge"><i></i>' + badge + '</span>';
    card.appendChild(head);
    if (repo) {
      var repoBox = mk('div', 'fx-blueprint3d-repo');
      repoBox.textContent = repo;
      card.appendChild(repoBox);
    }
    var list = mk('div', 'fx-blueprint3d-list'), stepEls = [];
    raw.forEach(function (ch, idx) {
      var st = attr(ch, 'step', (idx + 1 < 10 ? '0' : '') + (idx + 1));
      var hd = attr(ch, 'head', ch.textContent.trim());
      var ds = attr(ch, 'desc', '');
      var item = mk('div', 'fx-blueprint3d-item');
      item.innerHTML = '<b>' + st + '</b><div class="fx-blueprint3d-itxt"><strong>' + hd + '</strong>' + (ds ? '<span>' + ds + '</span>' : '') + '</div>';
      list.appendChild(item);
      stepEls.push(item);
    });
    card.appendChild(list);
    el.innerHTML = '';
    el.appendChild(corners);
    el.appendChild(card);
    el.__bp = { corners: corners, card: card, rows: stepEls };
  };

  /* ═════════════════════════ 30 个白底立体声明式动效（data-fx） ═════════════════════════ */

  /* 1. pose-3d */
  def('pose-3d', CAT, '立体姿态推演：把 phone3d / card3d / box3d 或普通卡片推到指定 3D 倾角与高度，台面投影随高度拉远扩散。参数 ry / rx / rz（角度）、z（抬升高度 px）、s（缩放）、x / y、dur', function (c) {
    var dur = num(c.o.dur, 0.75), ease = c.o.ease || 'power3.inOut';
    c.els.forEach(function (el) {
      var obj = el.__d3d;
      if (obj) {
        var cur = obj.plan || obj.base;
        var A = { x: cur.x, y: cur.y, z: cur.z, ry: cur.ry, rx: cur.rx, rz: cur.rz, sc: cur.sc };
        var B = {
          x: num(c.o.x, A.x), y: num(c.o.y, A.y), z: num(c.o.z, A.z),
          ry: num(c.o.ry, A.ry), rx: num(c.o.rx, A.rx), rz: num(c.o.rz, A.rz), sc: num(c.o.s, A.sc)
        };
        var p = { u: 0 }, first = !obj.plan;
        obj.plan = B;
        c.tl.fromTo(p, { u: 0 }, {
          u: 1, duration: dur, ease: ease, immediateRender: first && localT(c) <= 0.05,
          onUpdate: function () {
            var u = p.u;
            obj.state = {
              x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), z: lerp(A.z, B.z, u),
              ry: lerp(A.ry, B.ry, u), rx: lerp(A.rx, B.rx, u), rz: lerp(A.rz, B.rz, u), sc: lerp(A.sc, B.sc, u)
            };
            paintRig(obj);
          }
        }, c.t);
      } else {
        c.tl.to(el, {
          x: num(c.o.x, 0), y: num(c.o.y, 0), z: num(c.o.z, 0),
          rotationY: num(c.o.ry, 0), rotationX: num(c.o.rx, 0), rotationZ: num(c.o.rz, 0),
          scale: num(c.o.s, 1), transformPerspective: 1600, duration: dur, ease: ease
        }, c.t);
      }
    });
  });

  /* 2. flip-3d */
  def('flip-3d', CAT, '真 3D 腾空翻面：把 card3d（或带 .front / .back 的双面徽章）跃起抬高 Z 轴、空中翻转 180° 后落回白底桌面，翻到 90° 时投影拉远变柔、落地收紧。参数 lift（默认 110）、dur（默认 0.72）', function (c) {
    var dur = num(c.o.dur, 0.72), lift = num(c.o.lift, 110), sg = num(c.o.stagger, 0.12);
    c.els.forEach(function (el, idx) {
      var t0 = c.t + idx * sg, obj = el.__d3d;
      if (obj) {
        var cur = obj.plan || obj.base;
        var r0 = cur.ry, r1 = r0 + 180, z0 = cur.z, rx0 = cur.rx;
        obj.plan = { x: cur.x, y: cur.y, z: z0, ry: r1, rx: rx0, rz: cur.rz, sc: cur.sc };
        var p = { u: 0 };
        c.tl.fromTo(p, { u: 0 }, {
          u: 1, duration: dur, ease: 'power2.inOut', immediateRender: false,
          onUpdate: function () {
            var u = p.u, arc = Math.sin(Math.PI * u);
            obj.state.ry = lerp(r0, r1, u);
            obj.state.z = z0 + arc * lift;
            obj.state.rx = rx0 - arc * 10;
            paintRig(obj);
          }
        }, t0);
      } else {
        var front = el.querySelector('.front'), back = el.querySelector('.back'), p2 = { u: 0 };
        if (back) back.style.display = 'none';
        c.tl.fromTo(p2, { u: 0 }, {
          u: 1, duration: dur, ease: 'power2.inOut', immediateRender: false,
          onUpdate: function () {
            var u = p2.u, ang = u < 0.5 ? u * 180 : (u - 1) * 180, sc = 1 + 0.16 * Math.sin(Math.PI * u);
            if (front && back) { front.style.display = u < 0.5 ? '' : 'none'; back.style.display = u < 0.5 ? 'none' : ''; }
            el.style.transform = 'perspective(1000px) rotateY(' + ang.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
          }
        }, t0);
      }
    });
  });

  /* 3. deal-arc */
  def('deal-arc', CAT, '厚牌堆弧形发牌：写在 data-make="deck3d" 上，牌从厚牌堆顶上一张接一张沿 3D 马蹄弧或扇形滑到位。参数 dur（默认 1.15）', function (c) {
    var D = c.el.__deck; if (!D) { console.warn('FX：deal-arc 要写在 data-make="deck3d" 上'); return; }
    var p = { v: 0 };
    paintDeck(c.el, 0);
    c.tl.fromTo(p, { v: 0 }, { v: 1, duration: num(c.o.dur, 1.15), ease: 'power2.out', onUpdate: function () { paintDeck(c.el, p.v); } }, c.t);
  });

  /* 4. deck-gather */
  def('deck-gather', CAT, '散牌交错收拢归堆：写在 data-make="deck3d" 上，把铺开的弧形/马蹄牌阵重新收拢叠回一整摞整齐的厚牌砖。参数 dur（默认 0.85）', function (c) {
    var D = c.el.__deck; if (!D) { console.warn('FX：deck-gather 要写在 data-make="deck3d" 上'); return; }
    var p = { v: 1 };
    c.tl.fromTo(p, { v: 1 }, { v: 0, duration: num(c.o.dur, 0.85), ease: 'power3.inOut', immediateRender: false, onUpdate: function () { paintDeck(c.el, p.v); } }, c.t);
  });

  /* 5. letter-shuffle */
  def('letter-shuffle', CAT, '单字扑克牌阵洗牌变色：写在 data-make="letterdeck" 上，各张字牌轻弹排齐，花括号标的重点字牌腾空翻转染红并微倾。参数 dur（默认 0.55）', function (c) {
    var L = c.el.__letters; if (!L) { console.warn('FX：letter-shuffle 要写在 data-make="letterdeck" 上'); return; }
    var dur = num(c.o.dur, 0.55), kHot = 0;
    L.forEach(function (item) {
      if (!item.hot) return;
      var t0 = c.t + kHot * 0.09, tiltZ = (kHot % 2 ? 3.5 : -3.5), p = { u: 0 };
      kHot++;
      c.tl.fromTo(p, { u: 0 }, {
        u: 1, duration: dur, ease: 'back.out(1.9)', immediateRender: false,
        onUpdate: function () {
          var u = p.u, arc = Math.sin(Math.PI * u);
          if (u >= 0.45) item.el.classList.add('is-hot'); else item.el.classList.remove('is-hot');
          item.el.style.transform = 'translate3d(0,' + (-arc * 28).toFixed(1) + 'px,' + (arc * 48).toFixed(1) + 'px) rotateY(' + (arc * 36).toFixed(1) + 'deg) rotateZ(' + (u * tiltZ).toFixed(1) + 'deg) scale(' + (1 + 0.06 * u).toFixed(3) + ')';
        }
      }, t0);
    });
  });

  /* 6. sleeve-draw */
  def('sleeve-draw', CAT, '牌盒开口滑出厚牌：写在 data-make="sleeve3d" 上，外层立体黑盒向左滑让，内部整摞厚牌向右抽出并扇开首张。参数 dur（默认 0.9）', function (c) {
    var S = c.el.__sleeve; if (!S) { console.warn('FX：sleeve-draw 要写在 data-make="sleeve3d" 上'); return; }
    var dur = num(c.o.dur, 0.9), p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power3.out', immediateRender: false,
      onUpdate: function () {
        var u = p.u;
        S.box.style.transform = 'translate3d(' + (-u * 96).toFixed(1) + 'px,0,12px) rotateZ(' + (-u * 4).toFixed(1) + 'deg)';
        S.deck.style.transform = 'translate3d(' + (u * 175).toFixed(1) + 'px,' + (-u * 14).toFixed(1) + 'px,0) rotateZ(' + (u * 7).toFixed(1) + 'deg)';
        var top = S.sheets[S.sheets.length - 1];
        if (top) top.style.transform = 'translate3d(' + (10 + u * 44).toFixed(1) + 'px,' + (-15 - u * 18).toFixed(1) + 'px,24px) rotateZ(' + (u * 9).toFixed(1) + 'deg)';
      }
    }, c.t);
  });

  /* 7. grid-hero */
  def('grid-hero', CAT, '多宫格牌阵越级放大：从一排或九宫格卡片里把第 i 张（从 1 数；i=0 收回）沿 Z 轴高高托起居中放大，其余卡片退后柔化托底。参数 i、s（默认 1.65）、dur', function (c) {
    var kids = kidsOf(c.el), sel = num(c.o.i, 1) - 1, s = num(c.o.s, 1.65), dur = num(c.o.dur, 0.65);
    var pRect = c.el.getBoundingClientRect();
    kids.forEach(function (k, idx) {
      var active = sel >= 0 && idx === sel;
      var r = k.getBoundingClientRect();
      var dx = active && pRect.width ? (pRect.left + pRect.width / 2) - (r.left + r.width / 2) : 0;
      var dy = active && pRect.height ? (pRect.top + pRect.height / 2) - (r.top + r.height / 2) : 0;
      c.tl.set(k, { zIndex: active ? 40 : 5 + idx }, c.t);
      c.tl.to(k, {
        x: sel < 0 ? 0 : dx, y: sel < 0 ? 0 : dy, z: sel < 0 ? 0 : (active ? 110 : -45),
        scale: sel < 0 ? 1 : (active ? s : 0.96),
        rotationZ: sel < 0 ? 0 : (active ? -2 : (idx % 2 ? 3 : -3)),
        opacity: sel < 0 ? 1 : (active ? 1 : 0.72),
        transformPerspective: 1500, duration: dur, ease: 'power3.inOut'
      }, c.t);
    });
  });

  /* 8. carousel-next */
  def('carousel-next', CAT, '台面拍立得连切轮播：写在 data-make="carousel3d" 上，主展卡左滑退场、右侧倾斜预告卡扶正入主位，底部手牌同步微动。参数 i（切到第几张，从 1 数）或 steps（连切几张）、dur', function (c) {
    var C = c.el.__carousel; if (!C) { console.warn('FX：carousel-next 要写在 data-make="carousel3d" 上'); return; }
    var from = C.plan !== undefined ? C.plan : C.cur;
    var to = c.o.i !== undefined ? clamp(num(c.o.i, 1) - 1, 0, C.cards.length - 1) : clamp(from + num(c.o.steps, 1), 0, C.cards.length - 1);
    C.plan = to;
    var p = { v: from }, dur = num(c.o.dur, 0.65 * Math.max(1, Math.abs(to - from) * 0.75));
    c.tl.fromTo(p, { v: from }, {
      v: to, duration: dur, ease: 'power2.inOut', immediateRender: false,
      onUpdate: function () { paintCarousel(c.el, p.v); }
    }, c.t);
  });

  /* 9. card-storm */
  def('card-storm', CAT, '3D 卡片螺旋风暴：容器内多张卡片在三维空间沿螺旋轨道高速飞舞，前景卡片带景深虚化掠过镜头（适合「信息爆炸 / 海量素材」）。参数 dur（默认 2.6）、r（半径，默认 320）', function (c) {
    var kids = kidsOf(c.el), n = kids.length, R = num(c.o.r, 320), dur = num(c.o.dur, 2.6), rnd = FX.rand(num(c.o.seed, 41));
    c.el.style.perspective = '1200px';
    var orbits = kids.map(function (k, i) {
      k.style.position = 'absolute'; k.style.left = '50%'; k.style.top = '50%';
      return { el: k, a0: i / Math.max(1, n) * Math.PI * 2, y0: (rnd() - 0.5) * 420, spd: 1.8 + rnd() * 1.4, rx: (rnd() - 0.5) * 55, rz: (rnd() - 0.5) * 40 };
    });
    var p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power1.inOut', immediateRender: localT(c) <= 0.05,
      onUpdate: function () {
        var u = p.u;
        orbits.forEach(function (o) {
          var ang = o.a0 + u * Math.PI * o.spd;
          var x = Math.cos(ang) * R, z = Math.sin(ang) * R, y = o.y0 - (u - 0.5) * 140;
          var near = z > 130 ? (z - 130) / 190 : 0;
          o.el.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateX(' + (o.rx + u * 90).toFixed(1) + 'deg) rotateY(' + (ang * 45).toFixed(1) + 'deg) rotateZ(' + o.rz.toFixed(1) + 'deg)';
          o.el.style.filter = near > 0.05 ? 'blur(' + (near * 7).toFixed(1) + 'px)' : '';
          o.el.style.zIndex = String(Math.round(50 + z * 0.1));
        });
      }
    }, c.t);
  });

  /* 10. box-drop */
  def('box-drop', CAT, '立体盒重力落桌：六面体 box3d 从高处带微倾砸落白底桌面，落地微弹稳住、接触投影压实。配 each: 可错峰落下。参数 drop（默认 220）、dur（默认 0.68）', function (c) {
    var drop = num(c.o.drop, 220), dur = num(c.o.dur, 0.68), sg = num(c.o.stagger, 0.16);
    c.els.forEach(function (el, idx) {
      var t0 = c.t + idx * sg, obj = el.__d3d;
      if (obj) {
        var b = obj.plan || obj.base, p = { u: 0 };
        var applyDrop = function (u) {
          if (u <= 0.001) { obj.state.sc = 0; paintRig(obj); return; }
          obj.state.z = b.z + (1 - u) * drop;
          obj.state.y = b.y + (1 - u) * -120;
          obj.state.rx = b.rx + (1 - u) * 14;
          obj.state.ry = b.ry - (1 - u) * 12;
          obj.state.sc = b.sc * clamp(u * 3.8, 0, 1);
          paintRig(obj);
        };
        applyDrop(0);
        c.tl.fromTo(p, { u: 0 }, {
          u: 1, duration: dur, ease: 'back.out(1.45)', immediateRender: true,
          onUpdate: function () { applyDrop(p.u); }
        }, t0);
      } else {
        c.tl.fromTo(el,
          { y: -drop, autoAlpha: 0, scale: 1.08 },
          { y: 0, autoAlpha: 1, scale: 1, duration: dur, ease: 'back.out(1.5)', immediateRender: true },
          t0);
      }
    });
  });

  /* 11. slab-shatter */
  def('slab-shatter', CAT, '3D 厚石碑多米诺撞碎：写在 data-make="slabs3d" 上，厚板依次向右侧多米诺倾倒撞击，随后炸裂成数十块 3D 厚碎片飞散。参数 dur（默认 1.35）', function (c) {
    var S = c.el.__slabs; if (!S) { console.warn('FX：slab-shatter 要写在 data-make="slabs3d" 上'); return; }
    var dur = num(c.o.dur, 1.35), p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power2.inOut', immediateRender: false,
      onUpdate: function () {
        var u = p.u;
        S.forEach(function (sl, i) {
          var hitAt = 0.12 * i, fall = clamp((u - hitAt) / 0.36, 0, 1), boom = clamp((u - 0.48 - i * 0.06) / 0.46, 0, 1);
          sl.el.style.transform = 'rotateY(-16deg) rotateX(' + (8 + fall * 28).toFixed(1) + 'deg) rotateZ(' + (sl.baseRz + fall * 26).toFixed(1) + 'deg)';
          sl.body.style.visibility = boom > 0.02 ? 'hidden' : 'visible';
          sl.shards.forEach(function (sh) {
            if (boom <= 0.02) { sh.el.style.visibility = 'hidden'; return; }
            sh.el.style.visibility = 'visible';
            var e = 1 - Math.pow(1 - boom, 2.4);
            sh.el.style.transform = 'translate3d(' + (sh.dx * e).toFixed(1) + 'px,' + (sh.dy * e + boom * boom * 160).toFixed(1) + 'px,' + (sh.dz * e).toFixed(1) + 'px) rotateX(' + (sh.rx * e).toFixed(1) + 'deg) rotateY(' + (sh.ry * e).toFixed(1) + 'deg) rotateZ(' + (sh.rz * e).toFixed(1) + 'deg)';
            sh.el.style.opacity = clamp(1 - boom * 0.85, 0.08, 1).toFixed(2);
          });
        });
      }
    }, c.t);
  });

  /* 12. coin-drop */
  def('coin-drop', CAT, '3D 立体筹码/金币抛洒弹跳：写在 data-make="coins3d" 上，带圆边厚度的金币从空中翻滚落下弹跳，接触影同步收紧。参数 dur（默认 0.78）', function (c) {
    var C = c.el.__coins; if (!C) { console.warn('FX：coin-drop 要写在 data-make="coins3d" 上'); return; }
    var dur = num(c.o.dur, 0.78);
    C.forEach(function (cn, i) {
      var t0 = c.t + i * 0.09, p = { u: 0 };
      var applyCoin = function (u) {
        if (u <= 0.001) { cn.el.style.transform = 'scale3d(0,0,0)'; cn.sh.style.opacity = '0'; return; }
        var h = (1 - u) * 320, sc = clamp(u * 4, 0, 1);
        cn.el.style.transform = 'translate3d(0,' + (-h).toFixed(1) + 'px,' + (h * 0.4).toFixed(1) + 'px) rotateX(' + (cn.rx + (1 - u) * 360).toFixed(1) + 'deg) rotateY(' + (cn.ry + (1 - u) * 180).toFixed(1) + 'deg) rotateZ(' + cn.rz.toFixed(1) + 'deg) scale3d(' + sc.toFixed(3) + ',' + sc.toFixed(3) + ',' + sc.toFixed(3) + ')';
        cn.sh.style.transform = 'scale(' + lerp(0.45, 1, u).toFixed(3) + ')';
        cn.sh.style.opacity = lerp(0.05, 0.24, u).toFixed(3);
      };
      applyCoin(0);
      c.tl.fromTo(p, { u: 0 }, {
        u: 1, duration: dur, ease: 'bounce.out', immediateRender: true,
        onUpdate: function () { applyCoin(p.u); }
      }, t0);
    });
  });

  /* 13. polaroid-eject */
  def('polaroid-eject', CAT, '拍立得相纸吐出 + 进度条读满：card3d 相纸从上方卡槽滑出微倾落位，底部进度条同步推进到 100%。参数 dur（默认 0.9）', function (c) {
    var dur = num(c.o.dur, 0.9), atStart = localT(c) <= 0.05;
    c.els.forEach(function (el, i) {
      var t0 = c.t + i * 0.14, obj = el.__d3d, rzEnd = num(c.o.rz, obj ? obj.base.rz : -3);
      if (obj) {
        var b = obj.plan || obj.base, p = { u: 0 };
        obj.plan = { x: b.x, y: b.y, z: b.z, ry: b.ry, rx: b.rx, rz: rzEnd, sc: b.sc };
        var applyEject = function (u) {
          if (!atStart && u <= 0.001) { obj.state.sc = 0; paintRig(obj); return; }
          obj.state.y = lerp(b.y - (atStart ? 110 : 180), b.y, u);
          obj.state.rz = lerp(rzEnd - 6, rzEnd, u);
          obj.state.sc = atStart ? b.sc : b.sc * clamp(u * 3.6, 0, 1);
          paintRig(obj);
        };
        applyEject(0);
        c.tl.fromTo(p, { u: 0 }, {
          u: 1, duration: dur * 0.65, ease: 'power3.out', immediateRender: true,
          onUpdate: function () { applyEject(p.u); }
        }, t0);
      } else {
        c.tl.fromTo(el, { y: -180, autoAlpha: 0, rotationZ: -8 }, { y: 0, autoAlpha: 1, rotationZ: rzEnd, duration: dur * 0.65, ease: 'power3.out', immediateRender: true }, t0);
      }
      if (obj && obj.prog) {
        c.tl.fromTo(obj.prog, { width: '4%' }, { width: '100%', duration: dur, ease: 'power2.out', immediateRender: true }, t0 + 0.15);
      }
    });
  });

  /* 14. layer-explode */
  def('layer-explode', CAT, '三维爆炸展开：写在 data-make="layers3d" 上，原本压合的多层透视平板沿垂直轴拉开间距，四角虚线辅助线与左侧水平引线同步生长。参数 dur（默认 0.9）', function (c) {
    var L = c.el.__layers; if (!L) { console.warn('FX：layer-explode 要写在 data-make="layers3d" 上'); return; }
    var dur = num(c.o.dur, 0.9), p = { v: 0.12 };
    paintLayers(c.el, 0.12);
    c.tl.fromTo(p, { v: 0.12 }, { v: 1, duration: dur, ease: 'power3.out', onUpdate: function () { paintLayers(c.el, p.v); } }, c.t);
    L.rows.forEach(function (row, k) {
      var line = row.querySelector('.fx-layers3d-line'), txt = row.querySelector('.fx-layers3d-txt');
      if (line) c.tl.from(line, { scaleX: 0, duration: 0.45, ease: 'power3.out' }, c.t + 0.18 + k * 0.12);
      if (txt) c.tl.from(txt, { x: -24, opacity: 0, duration: 0.42, ease: 'power2.out' }, c.t + 0.24 + k * 0.12);
    });
  });

  /* 15. layer-focus */
  def('layer-focus', CAT, '分层点亮聚焦：写在 data-make="layers3d" 上，抬高并点亮第 i 层（从底往上 1..N；i=0 全部恢复），其余层柔和退让。参数 i、dur', function (c) {
    var L = c.el.__layers; if (!L) { console.warn('FX：layer-focus 要写在 data-make="layers3d" 上'); return; }
    var target = num(c.o.i, 1) - 1, dur = num(c.o.dur, 0.48), n = L.plates.length;
    L.plates.forEach(function (pl, idx) {
      var active = target < 0 || idx === target;
      var fromLift = pl.planLift !== undefined ? pl.planLift : 0;
      var toLift = target >= 0 && idx === target ? 18 : 0;
      pl.planLift = toLift;
      var pr = { u: 0 };
      c.tl.fromTo(pr, { u: 0 }, {
        u: 1, duration: dur, ease: 'power2.out', immediateRender: false,
        onUpdate: function () { pl.lift = lerp(fromLift, toLift, pr.u); paintLayers(c.el, L.spread); }
      }, c.t);
      c.tl.to(pl.el, { opacity: active ? 1 : 0.34, duration: dur, ease: 'power2.out' }, c.t);
      var row = L.rows[n - 1 - idx];
      if (row) c.tl.to(row, { opacity: active ? 1 : 0.32, x: target >= 0 && idx === target ? 10 : 0, duration: dur, ease: 'power2.out' }, c.t);
    });
  });

  /* 16. board-lay */
  def('board-lay', CAT, '面板后仰变 3D 时间轴：写在 data-make="timeline3d" 上，正对镜头的面板向后仰倒 56° 铺成桌面轨道，内部视频卡片同步立起并滑过红色剪辑指针。参数 dur（默认 1.2）', function (c) {
    var T = c.el.__tl3d; if (!T) { console.warn('FX：board-lay 要写在 data-make="timeline3d" 上'); return; }
    var dur = num(c.o.dur, 1.2), p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power3.inOut', immediateRender: false,
      onUpdate: function () {
        var u = p.u, ang = u * 56;
        T.board.style.transform = 'rotateX(' + ang.toFixed(1) + 'deg) rotateZ(' + (-u * 4).toFixed(1) + 'deg)';
        T.clips.forEach(function (cl, i) {
          cl.style.transform = 'rotateX(' + (-ang * 0.92).toFixed(1) + 'deg) translateZ(' + (u * (12 + i * 8)).toFixed(1) + 'px)';
        });
        T.pin.style.transform = 'translateX(' + (u * 540).toFixed(1) + 'px) rotateX(' + (-ang * 0.92).toFixed(1) + 'deg)';
      }
    }, c.t);
  });

  /* 17. stack-print */
  def('stack-print', CAT, '白纸复印叠厚 + 衰减条联动：写在 data-make="paperstack" 上，一张张白纸连续飞入叠高，底部新鲜感/注意力进度条同步跌落到 to%。参数 to（默认 62）、dur（默认 1.4）', function (c) {
    var P = c.el.__pstack; if (!P) { console.warn('FX：stack-print 要写在 data-make="paperstack" 上'); return; }
    var dur = num(c.o.dur, 1.4), toVal = num(c.o.to, 62), n = P.sheets.length, p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power2.out', immediateRender: false,
      onUpdate: function () {
        var u = p.u, shown = Math.max(1, Math.round(u * n));
        P.sheets.forEach(function (sh, i) {
          if (i === 0) return;
          var local = clamp((u * n - i) * 1.6, 0, 1);
          sh.el.style.opacity = local.toFixed(2);
          sh.el.style.transform = 'translate3d(' + sh.dx.toFixed(1) + 'px,' + (sh.dy - (1 - local) * 70).toFixed(1) + 'px,0) rotate(' + sh.rot.toFixed(1) + 'deg)';
        });
        var curV = lerp(P.from, toVal, u);
        P.fill.style.transform = 'scaleX(' + clamp(curV / 100, 0, 1).toFixed(3) + ')';
        P.val.textContent = Math.round(curV) + '%';
        if (shown > n * 0.5) P.fill.style.background = '#f59e0b';
      }
    }, c.t);
  });

  /* 18. lock-callouts */
  def('lock-callouts', CAT, '四角取景框锁定 + 多分支引线展开：写在 data-make="callouts3d" 上，橙色取景角标收缩锁死主体，左侧多条水平引线与卖点词依次打出。参数 dur（默认 0.7）', function (c) {
    var C = c.el.__call3d; if (!C) { console.warn('FX：lock-callouts 要写在 data-make="callouts3d" 上'); return; }
    c.tl.fromTo(C.corners, { scale: 1.24, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.36, ease: 'back.out(2)' }, c.t);
    C.rows.forEach(function (r, i) {
      var ln = r.querySelector('.fx-callouts3d-line'), st = r.querySelector('strong'), t0 = c.t + 0.16 + i * 0.14;
      if (ln) c.tl.from(ln, { scaleX: 0, duration: 0.36, ease: 'power3.out' }, t0);
      if (st) c.tl.from(st, { x: -20, opacity: 0, duration: 0.34, ease: 'power2.out' }, t0 + 0.08);
    });
  });

  /* 19. pin-move */
  def('pin-move', CAT, '全片路标游标推进：写在 data-make="youarehere" 上，红色 YOU ARE HERE 游标从 from 滑到 to（0–1 百分比小数），经过的分段色块同步点亮。参数 from、to、dur', function (c) {
    var Y = c.el.__yah; if (!Y) { console.warn('FX：pin-move 要写在 data-make="youarehere" 上'); return; }
    var a = num(c.o.from, 0.25), b = num(c.o.to, Y.at), p = { v: a };
    c.tl.fromTo(p, { v: a }, {
      v: b, duration: num(c.o.dur, 0.9), ease: 'power3.out', immediateRender: localT(c) <= 0.05,
      onUpdate: function () {
        Y.pin.style.left = (p.v * 100).toFixed(1) + '%';
        Y.segs.forEach(function (sg, i) {
          if ((i + 0.4) / Y.segs.length <= p.v) sg.classList.add('on'); else sg.classList.remove('on');
        });
      }
    }, c.t);
  });

  /* 20. wall-pull */
  def('wall-pull', CAT, '立体卡片墙拉远/推进：写在 data-make="wall3d" 上，从单张正对特写平滑拉远并倾斜俯视整面 3D 悬浮卡片墙（dir=in 则反向推进）。参数 dur（默认 1.25）、zoom（默认 2.3）', function (c) {
    var W3 = c.el.__wall3d; if (!W3) { console.warn('FX：wall-pull 要写在 data-make="wall3d" 上'); return; }
    var into = c.o.dir === 'in', dur = num(c.o.dur, 1.25), zm = num(c.o.zoom, 2.3), B = W3.pose;
    var close = { x: 0, y: 0, z: 40, ry: 0, rx: 0, rz: 0, sc: zm };
    var A = into ? B : close, T = into ? close : B;
    var pr = { x: A.x, y: A.y, z: A.z, ry: A.ry, rx: A.rx, rz: A.rz, sc: A.sc };
    if (localT(c) <= 0.05) paintWall3d(c.el, A);
    c.tl.fromTo(pr, { x: A.x, y: A.y, z: A.z, ry: A.ry, rx: A.rx, rz: A.rz, sc: A.sc }, {
      x: T.x, y: T.y, z: T.z, ry: T.ry, rx: T.rx, rz: T.rz, sc: T.sc,
      duration: dur, ease: 'power3.inOut', immediateRender: localT(c) <= 0.05,
      onUpdate: function () { paintWall3d(c.el, pr); }
    }, c.t);
    var rest = Math.max(0, c.sceneDur - (c.t - (c.scene ? c.scene.t : 0)) - dur);
    if (!into && rest > 0.2) {
      var dr = { u: 0 };
      c.tl.to(dr, {
        u: 1, duration: rest, ease: 'none',
        onUpdate: function () {
          paintWall3d(c.el, { x: T.x - dr.u * 38, y: T.y - dr.u * 18, z: T.z, ry: T.ry + dr.u * 2.2, rx: T.rx, rz: T.rz, sc: T.sc * (1 + dr.u * 0.04) });
        }
      }, c.t + dur);
    }
  });

  /* 21. rig-focus */
  def('rig-focus', CAT, '多样机立体移焦：写在放了多台样机/多栏盲测的容器上，讲到第 i 件（1..N；i=0 恢复同台全景）时它朝镜头转正并前推放大，其余侧转退后。参数 i、s（默认 1.06）、dur', function (c) {
    var kids = kidsOf(c.el), sel = num(c.o.i, 1) - 1, dur = num(c.o.dur, 0.6), boost = num(c.o.s, 1.06);
    kids.forEach(function (k, idx) {
      var d3 = k.__d3d, active = sel < 0 || idx === sel;
      if (d3) {
        var b = d3.base, cur = d3.plan || b;
        var A = { ry: cur.ry, z: cur.z, sc: cur.sc };
        var focusRy = Math.abs(b.ry) > 8 ? b.ry * 0.68 : (b.ry || -10);
        var B = {
          ry: sel < 0 ? b.ry : (idx === sel ? focusRy : (idx < sel ? 22 : -22)),
          z: sel < 0 ? b.z : (idx === sel ? b.z + 64 : b.z - 36),
          sc: sel < 0 ? b.sc : (idx === sel ? boost : 0.94)
        };
        d3.plan = { x: cur.x, y: cur.y, z: B.z, ry: B.ry, rx: cur.rx, rz: cur.rz, sc: B.sc };
        var pr = { u: 0 };
        c.tl.fromTo(pr, { u: 0 }, {
          u: 1, duration: dur, ease: 'power3.inOut', immediateRender: false,
          onUpdate: function () { d3.state.ry = lerp(A.ry, B.ry, pr.u); d3.state.z = lerp(A.z, B.z, pr.u); d3.state.sc = lerp(A.sc, B.sc, pr.u); paintRig(d3); }
        }, c.t);
      } else if (has3dRig(k)) {
        // 容器内含真 3D 样机时绝不设父级 opacity < 1 或 filter，避免浏览器把 preserve-3d 瞬间压平屏闪
        var dir3 = idx < sel ? 12 : -12;
        c.tl.to(k, {
          scale: sel < 0 ? 1 : (active ? boost : 0.94), rotationY: sel < 0 ? 0 : (active ? 0 : dir3),
          z: sel < 0 ? 0 : (active ? 38 : -34), y: sel < 0 ? 0 : (active ? -6 : 6),
          transformPerspective: 1600, duration: dur, ease: 'power3.inOut'
        }, c.t);
      } else {
        var dir = idx < sel ? 14 : -14;
        c.tl.to(k, {
          scale: sel < 0 ? 1 : (active ? boost : 0.95), rotationY: sel < 0 ? 0 : (active ? 0 : dir),
          z: sel < 0 ? 0 : (active ? 40 : -36), opacity: active ? 1 : 0.82,
          transformPerspective: 1600, duration: dur, ease: 'power3.inOut'
        }, c.t);
      }
    });
  });

  /* 22. phone-split */
  def('phone-split', CAT, '真机居中特写分身双栏：容器内第 1 件（3D 手机）先在画面中央侧转大特写，到点后横移归位并展开旁边的横屏副卡。参数 dur（默认 0.78）', function (c) {
    var kids = kidsOf(c.el); if (kids.length < 2) return;
    var phone = kids[0], mate = kids[1], dur = num(c.o.dur, 0.78), shift = num(c.o.shift, 380);
    c.tl.fromTo(phone, { x: shift, scale: 1.12 }, { x: 0, scale: 1, duration: dur, ease: 'power3.inOut', immediateRender: true }, c.t);
    if (has3dRig(mate)) {
      c.tl.fromTo(mate, { x: -90, scale: 0 }, { x: 0, scale: 1, duration: dur * 0.85, ease: 'back.out(1.6)', immediateRender: true }, c.t + 0.12);
    } else {
      c.tl.fromTo(mate, { x: -90, autoAlpha: 0, scale: 0.92 }, { x: 0, autoAlpha: 1, scale: 1, duration: dur * 0.85, ease: 'power3.out', immediateRender: true }, c.t + 0.12);
    }
  });

  /* 23. screen-pop */
  def('screen-pop', CAT, '屏幕内局部切片剥离放大：把手机或截图旁的取证行（.fx-pop-slice 或 to=#选择器）沿 Z 轴剥离浮出屏幕外放大，带深层悬空投影。参数 to、s（默认 1.18）、dur', function (c) {
    var target = c.o.to ? $(c.o.to) : (c.el.querySelector('.fx-pop-slice') || c.el);
    if (!target) return;
    c.tl.fromTo(target,
      { autoAlpha: 0, scale: 0.72, y: 34, z: -20, rotationX: 18, transformPerspective: 1200 },
      { autoAlpha: 1, scale: num(c.o.s, 1.12), y: 0, z: 90, rotationX: 0, transformPerspective: 1200, duration: num(c.o.dur, 0.55), ease: 'back.out(1.8)', immediateRender: true },
      c.t);
  });

  /* 24. phone-wave */
  def('phone-wave', CAT, '多色竖屏真机阵列波浪排开：写在放了一排 phone3d 的容器上，多台手机像多米诺波浪一样依次立起转角陈列。参数 dur（默认 0.65）、stagger（默认 0.08）', function (c) {
    var kids = kidsOf(c.el), dur = num(c.o.dur, 0.65), sg = num(c.o.stagger, 0.08), atStart = localT(c) <= 0.05;
    kids.forEach(function (k, i) {
      var t0 = c.t + i * sg, d3 = k.__d3d;
      if (d3) {
        var b = d3.base, p = { u: 0 };
        var applyWave = function (u) {
          if (!atStart && u <= 0.001) { d3.state.sc = 0; paintRig(d3); return; }
          d3.state.y = (1 - u) * (atStart ? 96 : 140);
          d3.state.ry = b.ry + (1 - u) * -32;
          d3.state.rx = b.rx + (1 - u) * 16;
          d3.state.sc = atStart ? b.sc : b.sc * clamp(u * 3.5, 0, 1);
          paintRig(d3);
        };
        applyWave(0);
        c.tl.fromTo(p, { u: 0 }, {
          u: 1, duration: dur, ease: 'back.out(1.6)', immediateRender: true,
          onUpdate: function () { applyWave(p.u); }
        }, t0);
      } else {
        c.tl.fromTo(k,
          { y: 120, rotationY: -32, autoAlpha: 0 },
          { y: 0, rotationY: 0, autoAlpha: 1, duration: dur, ease: 'back.out(1.6)', immediateRender: true },
          t0);
      }
    });
  });

  /* 25. float-pop */
  def('float-pop', CAT, '白底悬浮弹出：评语胶囊（.fx-float-pill）或打分卡（.fx-score-card）从贴地微缩状态沿 Z 轴弹起悬浮，撑开柔和影棚空气阴影。参数 dur（默认 0.46）', function (c) {
    var dur = num(c.o.dur, 0.46), sg = num(c.o.stagger, 0.12);
    c.els.forEach(function (el, i) {
      c.tl.from(el, { y: 26, scale: 0.78, opacity: 0, rotationX: -18, transformPerspective: 1000, duration: dur, ease: 'back.out(1.9)' }, c.t + i * sg);
    });
  });

  /* 26. flap-to */
  def('flap-to', CAT, '机械翻牌跳字：写在 data-make="flap3d" 上，把每位翻牌格机械折页翻到 to（千分位逗号在参数里可写下划线如 10_000+）指定的新文本。参数 to、dur（默认 0.36）、stagger（默认 0.06）', function (c) {
    var F = c.el.__flap; if (!F) { console.warn('FX：flap-to 要写在 data-make="flap3d" 上'); return; }
    var rawTo = c.o.to !== undefined ? String(c.o.to).replace(/_/g, ',') : attr(c.el, 'to', F.cur);
    var nextStr = String(rawTo), oldStr = F.plan || F.cur;
    var dur = num(c.o.dur, 0.36), sg = num(c.o.stagger, 0.06);
    if (nextStr.length > F.slots.length) {
      renderFlapSlots(c.el, F.cur.padStart(nextStr.length, ' '));
      oldStr = oldStr.padStart(nextStr.length, ' ');
    }
    var oldChars = Array.from(oldStr.padStart(F.slots.length, ' '));
    var newChars = Array.from(nextStr.padStart(F.slots.length, ' '));
    F.slots.forEach(function (slot, i) {
      var chA = oldChars[i] || ' ', chB = newChars[i] || ' ';
      if (chA === chB) return;
      var t0 = c.t + i * sg, p = { u: 0 };
      c.tl.fromTo(p, { u: 0 }, {
        u: 1, duration: dur, ease: 'power2.inOut', immediateRender: false,
        onUpdate: function () {
          var u = p.u;
          slot.el.textContent = u < 0.5 ? chA : chB;
          var ang = u < 0.5 ? -u * 176 : (1 - u) * 176;
          var sy = 1 - 0.16 * Math.sin(Math.PI * u);
          slot.el.style.transform = 'perspective(900px) rotateX(' + ang.toFixed(1) + 'deg) scaleY(' + sy.toFixed(3) + ')';
        }
      }, t0);
    });
    F.plan = nextStr;
  });

  /* 27. cal-flip */
  def('cal-flip', CAT, '30 天日历翻牌矩阵 + 数字狂飙：写在 data-make="calgrid3d" 上，全部小蓝牌按天依次翻成红头黑底日历格，顶部指标同步从 0 滚到 to。参数 to（默认 18862）、dur（默认 1.6）', function (c) {
    var G = c.el.__cal; if (!G) { console.warn('FX：cal-flip 要写在 data-make="calgrid3d" 上'); return; }
    var toVal = num(String(c.o.to !== undefined ? c.o.to : attr(c.el, 'to', '18862')).replace(/_/g, ''), 18862);
    var dur = num(c.o.dur, 1.6), n = G.cells.length, p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power2.inOut', immediateRender: false,
      onUpdate: function () {
        var u = p.u;
        G.numEl.textContent = fmtComma(lerp(G.from, toVal, u));
        G.cells.forEach(function (cell, i) {
          var st = (i / n) * 0.78, loc = clamp((u - st) / 0.22, 0, 1);
          var ang = loc * 180;
          cell.front.style.visibility = loc >= 0.5 ? 'visible' : 'hidden';
          cell.back.style.visibility = loc >= 0.5 ? 'hidden' : 'visible';
          cell.el.style.transform = 'rotateY(' + (loc < 0.5 ? ang : ang - 180).toFixed(1) + 'deg)';
        });
      }
    }, c.t);
  });

  /* 28. bubble-pop3d */
  def('bubble-pop3d', CAT, '手机聊天气泡破框悬浮弹出：多条对话气泡（.fx-pop-bub）从倾斜的手机屏幕里逐层跃出到半空 Z 轴，带独立深投影。配 each: 可逐条蹦出。参数 dur（默认 0.5）', function (c) {
    var dur = num(c.o.dur, 0.5), sg = num(c.o.stagger, 0.22);
    c.els.forEach(function (el, i) {
      var zTarget = 50 + i * 35;
      c.tl.fromTo(el,
        { opacity: 0, scale: 0.62, x: -70, y: 24, z: -10, rotationY: -18, transformPerspective: 1200 },
        { opacity: 1, scale: 1, x: 0, y: 0, z: zTarget, rotationY: -4, transformPerspective: 1200, duration: dur, ease: 'back.out(1.85)', immediateRender: true },
        c.t + i * sg);
    });
  });

  /* 29. cta-click */
  def('cta-click', CAT, '白底交互胶囊光标点击 + 爆彩带：写在 data-make="ctabar" 上，鼠标飞入按下按钮（点赞变已关注 / 点击发送）并炸出庆祝彩片。参数 dur（默认 0.9）', function (c) {
    var B = c.el.__cta; if (!B) { console.warn('FX：cta-click 要写在 data-make="ctabar" 上'); return; }
    var dur = num(c.o.dur, 0.9), rnd = FX.rand(num(c.o.seed, 53));
    var colors = ['#ef4444', '#2563eb', '#f59e0b', '#10b981', '#8b5cf6'];
    var conf = mk('div', 'fx-confetti'), dots = [];
    for (var i = 0; i < 16; i++) {
      var sp = mk('i');
      sp.style.left = '80%'; sp.style.top = '50%'; sp.style.width = '12px'; sp.style.height = '8px';
      sp.style.background = colors[i % colors.length]; sp.style.opacity = '0';
      conf.appendChild(sp);
      var a = rnd() * Math.PI * 2, dist = 70 + rnd() * 140;
      dots.push({ el: sp, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist - 24, rot: (rnd() - 0.5) * 320 });
    }
    c.el.appendChild(conf);
    var p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'none', immediateRender: false,
      onUpdate: function () {
        var u = p.u;
        var move = clamp(u / 0.42, 0, 1), eMove = 1 - Math.pow(1 - move, 3);
        B.cur.style.opacity = u < 0.03 ? '0' : (u > 0.92 ? ((1 - u) / 0.08).toFixed(2) : '1');
        B.cur.style.left = lerp(96, 80, eMove).toFixed(1) + '%';
        B.cur.style.top = lerp(145, 52, eMove).toFixed(1) + '%';
        var press = u > 0.42 && u < 0.58 ? Math.sin((u - 0.42) / 0.16 * Math.PI) : 0;
        B.btn.style.transform = 'scale(' + (1 - press * 0.12).toFixed(3) + ')';
        if (u >= 0.5) { B.btn.textContent = B.after; B.btn.classList.add('done'); }
        else { B.btn.textContent = B.before; B.btn.classList.remove('done'); }
        var boom = clamp((u - 0.5) / 0.5, 0, 1);
        dots.forEach(function (dt) {
          if (boom <= 0) { dt.el.style.opacity = '0'; return; }
          var eb = 1 - Math.pow(1 - boom, 2.2);
          dt.el.style.opacity = clamp(1 - boom * 1.05, 0, 1).toFixed(2);
          dt.el.style.transform = 'translate(' + (dt.dx * eb).toFixed(1) + 'px,' + (dt.dy * eb + boom * boom * 45).toFixed(1) + 'px) rotate(' + (dt.rot * eb).toFixed(1) + 'deg)';
        });
      }
    }, c.t);
    c.o.__click = c.t + dur * 0.46;
  });

  /* 30. desk-invert */
  def('desk-invert', CAT, '白格桌面 ⇄ 暗黑金格反相：在讲反面痛点（如资本垄断）时把白格桌面瞬间切换为深色暗金网格，mode=reset 恢复白格桌面。参数 mode=dark|reset', function (c) {
    var st = stageEl(), worldBg = st && st.querySelector('.fx-world-bg');
    var target = worldBg || (c.scene ? c.scene.el : st);
    if (!target) return;
    var toDark = c.o.mode !== 'reset' && c.o.mode !== 'light', p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: num(c.o.dur, 0.35), ease: 'power2.inOut', immediateRender: false,
      onUpdate: function () {
        var darkNow = p.u >= 0.5 ? toDark : !toDark;
        if (darkNow) { target.classList.add('is-inverted'); if (st) st.classList.add('is-inverted-stage'); }
        else { target.classList.remove('is-inverted'); if (st) st.classList.remove('is-inverted-stage'); }
      }
    }, c.t);
  });

  /* 31. step-focus */
  def('step-focus', CAT, '白底步进流水线移焦：写在 data-make="steplist3d" 上，推进并高浮起点亮第 i 步（1..N；i=0 全亮汇总），已完成步骤打勾、未开始步骤柔和退让。参数 i、dur（默认 0.42）', function (c) {
    var S = c.el.__steps; if (!S) { console.warn('FX：step-focus 要写在 data-make="steplist3d" 上'); return; }
    var toIdx = clamp(num(c.o.i, 1), 0, S.rows.length), fromIdx = S.plan !== undefined ? S.plan : S.cur;
    S.plan = toIdx;
    var p = { u: 0 };
    c.tl.fromTo(p, { u: 0 }, {
      u: 1, duration: num(c.o.dur, 0.42), ease: 'power2.out', immediateRender: false,
      onUpdate: function () { paintSteps3d(c.el, p.u >= 0.35 ? toIdx : fromIdx); }
    }, c.t);
  });

  /* 32. blueprint-scan */
  def('blueprint-scan', CAT, '抄作业蓝图卡取景框锁定：写在 data-make="blueprint3d" 上，四角裁切角标从外向内卡位锁死，内部步骤条目依次点亮。参数 dur（默认 0.65）', function (c) {
    var B = c.el.__bp; if (!B) { console.warn('FX：blueprint-scan 要写在 data-make="blueprint3d" 上'); return; }
    var dur = num(c.o.dur, 0.65);
    c.tl.fromTo(B.corners, { scale: 1.07, opacity: 0 }, { scale: 1, opacity: 1, duration: dur * 0.65, ease: 'back.out(2.1)', immediateRender: true }, c.t);
    B.rows.forEach(function (r, idx) {
      c.tl.fromTo(r, { x: 18, opacity: 0.35 }, { x: 0, opacity: 1, duration: 0.38, ease: 'power2.out', immediateRender: true }, c.t + 0.14 + idx * 0.14);
    });
  });

  /* 33. check-fix */
  def('check-fix', CAT, '质检报错当场翻转自修：把报错状态行（.fx-check-row.is-bad）沿 X 轴立体翻转成绿勾通过状态（.is-good），同步更新文案。参数 badge（默认 ✓ 已修复）、after（修复后说明）、dur（默认 0.52）', function (c) {
    var dur = num(c.o.dur, 0.52), sg = num(c.o.stagger, 0.16);
    c.els.forEach(function (el, idx) {
      var bEl = el.querySelector('.badge'), mEl = el.querySelector('.msg');
      var b0 = bEl ? bEl.textContent : '', m0 = mEl ? mEl.textContent : '';
      var b1 = c.o.badge || '✓ 已修复', m1 = c.o.after || m0;
      var p = { u: 0 };
      c.tl.fromTo(p, { u: 0 }, {
        u: 1, duration: dur, ease: 'back.out(1.7)', immediateRender: false,
        onUpdate: function () {
          var u = p.u, fixed = u >= 0.48;
          var ang = u < 0.48 ? (u / 0.48) * 88 : -(1 - (u - 0.48) / 0.52) * 88;
          el.classList.toggle('is-bad', !fixed);
          el.classList.toggle('is-good', fixed);
          if (bEl) bEl.textContent = fixed ? b1 : b0;
          if (mEl && c.o.after) mEl.textContent = fixed ? m1 : m0;
          el.style.transform = 'perspective(1100px) rotateX(' + ang.toFixed(1) + 'deg) scale(' + (1 + 0.04 * Math.sin(Math.PI * u)).toFixed(3) + ')';
        }
      }, c.t + idx * sg);
    });
  });

  /* 34. pop-3d */
  def('pop-3d', CAT, '白底立体弹射跳出：卡片、组件或 3D 样机从桌面深处带俯仰倾角「唰」一下弹射跃起到位（支持 each: 错峰连续跳出），带回弹落定与接触影联动。参数 dur（默认 0.44）、stagger（默认 0.14）、fromY（默认 64）', function (c) {
    var dur = num(c.o.dur, 0.44), sg = num(c.o.stagger, 0.14), fy = num(c.o.fromY, 64);
    c.els.forEach(function (el, idx) {
      var t0 = c.t + idx * sg, obj = el.__d3d, dir = idx % 2 ? -1 : 1;
      if (obj) {
        var b = obj.plan || obj.base, p = { u: 0 };
        var applyPop = function (u) {
          if (u <= 0.001) { obj.state.sc = 0; paintRig(obj); return; }
          obj.state.y = lerp(b.y + fy, b.y, u);
          obj.state.z = lerp(b.z - 110, b.z, u);
          obj.state.rx = lerp(b.rx - 22, b.rx, u);
          obj.state.ry = lerp(b.ry + dir * 14, b.ry, u);
          obj.state.sc = b.sc * u;
          paintRig(obj);
        };
        applyPop(0);
        c.tl.fromTo(p, { u: 0 }, {
          u: 1, duration: dur, ease: 'back.out(1.9)', immediateRender: true,
          onUpdate: function () { applyPop(p.u); }
        }, t0);
      } else if (has3dRig(el)) {
        c.tl.fromTo(el,
          { y: fy, scale: 0, rotationX: -20, rotationY: dir * 10, transformPerspective: 1300 },
          { y: 0, scale: 1, rotationX: 0, rotationY: 0, transformPerspective: 1300, duration: dur, ease: 'back.out(1.9)', immediateRender: true },
          t0);
      } else {
        c.tl.fromTo(el,
          { autoAlpha: 0, y: fy, z: -120, scale: 0.56, rotationX: -26, rotationY: dir * 11, transformPerspective: 1300 },
          { autoAlpha: 1, y: 0, z: 0, scale: 1, rotationX: 0, rotationY: 0, transformPerspective: 1300, duration: dur, ease: 'back.out(2.1)', immediateRender: true },
          t0);
      }
    });
  });

  /* ═════════════════════ 专属转场：card-wipe（3D 巨卡贴脸擦镜转场） ═════════════════════ */

  FX.trans['card-wipe'] = function (tl, t, prev, next, o) {
    o = o || {};
    var dur = num(o.dur, 0.78), st = stageEl();
    if (!st) return 0;
    var wrap = mk('div', 'fx-card-wipe'), body = mk('div', 'fx-card-wipe-body'), inn = mk('div', 'fx-card-wipe-in');
    if (o.color) inn.style.setProperty('--wipe-c', o.color);
    inn.innerHTML = '<span data-lint="off">' + (o.emblem || 'A') + '</span>';
    body.appendChild(inn); wrap.appendChild(body);
    wrap.style.visibility = 'hidden';
    st.appendChild(wrap);

    var tStart = Math.max(0, t - dur * 0.48);
    if (prev && next) {
      tl.set(next, { visibility: 'hidden' }, t);
      tl.set(next, { visibility: 'visible' }, tStart + dur * 0.5);
      tl.set(prev, { visibility: 'hidden' }, tStart + dur * 0.5);
    }
    var p = { u: 0 };
    tl.fromTo(p, { u: 0 }, {
      u: 1, duration: dur, ease: 'power2.inOut', immediateRender: false,
      onUpdate: function () {
        var u = p.u;
        if (u <= 0.005 || u >= 0.995) { wrap.style.visibility = 'hidden'; return; }
        wrap.style.visibility = 'visible';
        var x = lerp(1750, -1750, u), y = lerp(-180, 160, u);
        var ry = lerp(-58, 58, u), rz = lerp(18, -16, u);
        var sc = 1.25 + 1.05 * Math.sin(Math.PI * u);
        body.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,260px) rotateY(' + ry.toFixed(1) + 'deg) rotateZ(' + rz.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      }
    }, tStart);
    return dur * 0.55;
  };
  FX.catalog.push({
    name: 'card-wipe', cat: '转场',
    desc: '3D 巨卡贴脸擦镜转场（普通模式与世界画布通用）：一张超大双面厚边扑克从镜头极近处翻滚掠过遮满全屏，移开时无缝带出下一幕。参数 dur（默认 0.78）、emblem（牌背字母，默认 A）、color'
  });

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : undefined);
