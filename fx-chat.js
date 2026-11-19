/* fx-chat.js — AI 对话、终端、代码、Agent 光标（可选模块，加载在 fx.js 之后）
 *
 * 讲 AI 的片子里最常出现的几种画面，都按真实软件的节奏来动：
 *
 *   聊天窗  <div data-make="chat" data-title="Claude">
 *             <p data-from="me">帮我写个周报</p>
 *             <p data-from="ai" data-av="C">好的，先列三件事……</p>
 *           </div>
 *           msg@t(i=1)          第 1 条消息弹出来（从发送者那一角长出来）
 *           typing@t(i=2,dur=1) 第 2 条消息出来之前，先在它的位置显示「正在输入…」
 *           stream-in@t(i=2)    第 2 条消息按 AI 吐字的节奏一段一段冒出来（新字先是灰的，再变黑）
 *   输入框  <div class="fx-prompt" data-fx="prompt@1(fix=周包)">帮我写个周报</div>   像真人一样一两个字一顿地打出来；fix 是先打错的词，删掉再改对
 *   终端    <div data-make="terminal"><p data-cmd>npm run build</p><p>✓ 编译完成</p></div>   run@t：敲命令、回车、一行行输出
 *   代码    <div data-make="code" data-title="app.py"><pre>…</pre></div>   行首写「+ 」「- 」的是要加 / 要删的行
 *           diff@t         删掉的行变红收起，新加的行变绿展开
 *           code-focus@t(i=3)   第 3 行亮起一条高光，其余行压暗；i=0 恢复
 *   Agent   <div data-make="agent" data-name="Claude Code" style="left:..;top:.."></div>
 *           agent-go@t(to=#按钮,say=打开设置)   名牌上打出要做的事，光标移过去点一下
 *
 * 节奏数值（消息 0.12 秒从 0.75 倍长出、正在输入 0.10 秒弹出、AI 吐字的间隔表、新字 0.27 秒变黑、
 * 真人打字一次 1–3 个字、代码删行 0.55 秒 / 加行 0.6 秒）参考了 HyperFrames 组件库（Apache-2.0）的
 * chat-message / typing-indicator / streaming-text / typed-prompt / code-terminal-run / code-diff / agent-cursor，代码是重新写的。
 */
(function (g) {
  'use strict';
  var FX = g.FX; if (!FX || !FX.register) return;
  var doc = g.document;
  var num = function (v, d) { v = parseFloat(v); return isFinite(v) ? v : d; };
  var attr = function (el, k, d) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? d : v; };
  var mk = function (tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  var def = FX.register, CAT = '对话';
  var FRAMES = [];                 // 需要按秒数逐帧改文字的东西（打字、终端、Agent 名牌）
  var onFrame = function (fn) { FRAMES.push(fn); };
  var CJK = /[⺀-鿿豈-﫿＀-￯]/;

  /** 固定种子的随机数：同一段文字每次排出来的打字节奏都一样 */
  function lcg(seed) { var s = (seed >>> 0) || 0x7f4a7c15; return function () { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
  /** 打字表：[{t, x}]，t 是绝对秒数，x 是那一刻已经打出来的文字。中文一次出 1–3 个字（输入法上屏），英文一次 1–3 个字母 */
  function typeRows(text, t0, opt) {
    opt = opt || {};
    var rnd = lcg(opt.seed || 0x7f4a7c15), rows = [{ t: -1e9, x: '' }], t = t0, acc = '', speed = opt.speed || 1;
    var words = text.split(/(\s+)/).filter(function (w) { return w.length; });
    var chunks = function (w) { var out = [], i = 0; while (i < w.length) { var n = 1 + Math.floor(rnd() * 3); out.push(w.slice(i, i + n)); i += n; } return out; };
    var gap = function (ch) { return (CJK.test(ch) ? 0.07 + ch.length * 0.045 + rnd() * 0.08 : ch.length * (0.05 + rnd() * 0.04)) / speed; };
    var typeWord = function (w) { chunks(w).forEach(function (ch) { t += gap(ch); acc += ch; rows.push({ t: t, x: acc }); }); };
    words.forEach(function (w, k) {
      if (/^\s+$/.test(w)) { acc += w; t += (0.1 + rnd() * 0.1) / speed; return; }
      var last = k === words.length - 1 || words.slice(k + 1).every(function (x) { return /^\s+$/.test(x); });
      if (last && opt.fix) {
        typeWord(String(opt.fix)); t += 0.4;
        for (var b = 1; b <= String(opt.fix).length; b++) { t += 0.055; rows.push({ t: t, x: acc.slice(0, acc.length - b) }); }
        acc = acc.slice(0, acc.length - String(opt.fix).length); t += 0.22;
      }
      typeWord(w);
    });
    rows.end = t;
    return rows;
  }
  var textAt = function (rows, t) { for (var i = rows.length - 1; i >= 0; i--) if (t >= rows[i].t - 0.001) return rows[i].x; return ''; };
  /** 光标闪烁：打字期间跑整数个周期，打完一直亮 */
  function caretOn(t, a, b) { if (t < a || t >= b) return true; var cyc = Math.max(1, Math.round((b - a) / 0.9)); return Math.sin((t - a) / (b - a) * Math.PI * 2 * cyc) >= 0; }
  function showAt(tl, el, t) { tl.set(el, { visibility: 'hidden' }, 0); tl.set(el, { visibility: 'inherit' }, t); }

  /* ═════════════════════════ 聊天窗 ═════════════════════════ */
  FX.make.chat = function (el) {
    el.classList.add('fx-chat');
    var msgs = Array.prototype.filter.call(el.children, function (k) { return k.hasAttribute('data-from'); });
    var head = attr(el, 'title', '');
    var list = mk('div', 'fx-chat-list');
    msgs.forEach(function (p) {
      var me = p.getAttribute('data-from') === 'me', row = mk('div', 'fx-msg ' + (me ? 'me' : 'ai'));
      var av = mk('span', 'av'); av.textContent = attr(p, 'av', me ? '我' : 'AI'); av.setAttribute('data-lint', 'off');   // 头像、标题栏、行号是界面装饰，自检不算字数
      var bub = mk('div', 'bub'); bub.innerHTML = p.innerHTML;
      row.appendChild(av); row.appendChild(bub); list.appendChild(row); p.remove();
    });
    el.innerHTML = '';
    if (head) { var hd = mk('div', 'fx-chat-head', '<i></i><span>' + head + '</span>'); hd.setAttribute('data-lint', 'off'); el.appendChild(hd); }
    el.appendChild(list);
  };
  function rowOf(c) {
    var rows = c.el.querySelectorAll('.fx-msg'), i = num(c.o.i, 1);
    var r = rows[i - 1]; if (!r) console.warn('FX：' + c.el.className + ' 里没有第 ' + i + ' 条消息'); return r;
  }
  var HIDDEN = new WeakSet();
  function hideRows(c) { Array.prototype.forEach.call(c.el.querySelectorAll('.fx-msg'), function (r) { if (!HIDDEN.has(r)) { HIDDEN.add(r); c.tl.set(r, { visibility: 'hidden' }, 0); } }); }
  function arrive(c, r, t) {
    hideRows(c);
    c.tl.set(r, { visibility: 'inherit' }, t);
    c.tl.fromTo(r, { opacity: 0.6, scale: 0.75, transformOrigin: r.classList.contains('me') ? '100% 100%' : '0% 100%' },
      { opacity: 1, scale: 1, duration: 0.12, ease: 'power2.out', immediateRender: false }, t);
  }
  def('msg', CAT, '聊天窗里的一条消息弹出来：0.12 秒从发送者那一角长出来。写在 data-make="chat" 上。参数 i（第几条，从 1 数）', function (c) {
    var r = rowOf(c); if (r) arrive(c, r, c.t);
  });
  def('typing', CAT, '「正在输入…」气泡：在第 i 条消息的位置弹出三个点，dur 秒后消失（通常紧接着 msg / stream-in 同一条）。写在 data-make="chat" 上。参数 i、dur（默认 1.2）', function (c) {
    var r = rowOf(c); if (!r) return;
    hideRows(c);
    var dur = num(c.o.dur, 1.2), ty = mk('div', 'fx-msg ai fx-typing');
    ty.innerHTML = '<span class="av" data-lint="off">' + (r.querySelector('.av') || {}).textContent + '</span><div class="bub"><i></i><i></i><i></i></div>';
    ty.style.top = r.offsetTop + 'px'; ty.style.left = r.offsetLeft + 'px';
    r.parentNode.appendChild(ty);
    showAt(c.tl, ty, c.t); c.tl.set(ty, { visibility: 'hidden' }, c.t + dur);
    c.tl.fromTo(ty, { scale: 0.6, opacity: 0.4, transformOrigin: '0% 100%' }, { scale: 1, opacity: 1, duration: 0.1, ease: 'power2.out', immediateRender: false }, c.t);
    Array.prototype.forEach.call(ty.querySelectorAll('i'), function (dot, k) {
      var reps = Math.max(1, Math.floor((dur - 0.15 - k * 0.14) / 0.28) - 1);
      c.tl.fromTo(dot, { y: 0 }, { y: -7, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: reps | 1, immediateRender: false }, c.t + 0.1 + k * 0.14);
    });
    c.o.dur = dur;
  });
  // AI 吐字的间隔表（秒；0 = 和上一段同时到）。不是打字机那种匀速，而是两三段一起蹦出来、停一下、再来几段
  var GAPS = [0.167, 0.1, 0, 0.367, 0, 0.167, 0.133, 0.1, 0.1, 0.133, 0.167, 0.133, 0, 0.233, 0.167, 0.1, 0, 0.133, 0.133, 0.1, 0.167, 0.133, 0.1, 0.133, 0.167, 0.1, 0.133, 0.1, 0.133];
  def('stream-in', CAT, 'AI 的回答按吐字节奏一段一段冒出来，新字先是灰的、0.27 秒后变成正常颜色。写在 data-make="chat" 上（第 i 条消息），也可以直接写在任何一段文字上。参数 i、speed（倍速，默认 1）', function (c) {
    var r = c.el.classList.contains('fx-chat') ? rowOf(c) : null, box = r ? r.querySelector('.bub') : c.el, speed = num(c.o.speed, 1);
    if (!box) return;
    if (r) arrive(c, r, c.t);
    // 把文字切成一段段「token」：英文按词，中文 1–3 个字一段
    var rnd = lcg(Math.round(c.t * 997) + 13), toks = [], walk = doc.createTreeWalker(box, 4, null), nodes = [], n;
    while ((n = walk.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var s = node.nodeValue, frag = doc.createDocumentFragment(), parts = s.match(/[A-Za-z0-9$%.,'’\-]+\s*|\s+|[^\sA-Za-z0-9]/g) || [], buf = '';
      var flush = function () { if (!buf) return; var w = mk('span', 'fx-tok'); w.textContent = buf; frag.appendChild(w); toks.push(w); buf = ''; };
      var want = 1 + Math.floor(rnd() * 3);
      parts.forEach(function (p) {
        if (/^\s+$/.test(p)) { buf += p; return; }
        if (CJK.test(p)) { buf += p; if (buf.replace(/\s/g, '').length >= want) { flush(); want = 1 + Math.floor(rnd() * 3); } }
        else { flush(); buf = p; flush(); }
      });
      flush(); node.parentNode.replaceChild(frag, node);
    });
    // 新字的灰和正常颜色：从样式里读实际颜色（GSAP 不能直接在 CSS 变量之间渐变）
    var cs = g.getComputedStyle(box), ink = cs.color, fresh = (cs.getPropertyValue('--fx-fresh') || '').trim() || '#8a8a92';
    var t = c.t + (r ? 0.15 : 0);
    toks.forEach(function (w, k) {
      if (k > 0) t += GAPS[k % GAPS.length] / speed;
      c.tl.set(w, { opacity: 0 }, 0);
      c.tl.set(w, { opacity: 1 }, t);
      c.tl.fromTo(w, { color: fresh }, { color: ink, duration: 0.2667, ease: 'none', immediateRender: false }, t);
    });
    c.o.dur = t - c.t + 0.27; c.o.__readText = box.textContent;
  });

  /* ═════════════════════════ 输入框打字 ═════════════════════════ */
  def('prompt', CAT, '输入框里像真人一样打字：一次出 1–3 个字、长短不一的停顿，光标打字时闪、打完常亮。写在一个只有文字的元素上（配 class="fx-prompt" 就是一个输入框）。参数 fix（先打错的词，删掉再改对）、glyph（行首的提示符，默认 ›，写 none 去掉）、speed', function (c) {
    var el = c.el, text = (el.textContent || '').trim(), glyph = c.o.glyph === undefined ? '›' : String(c.o.glyph);
    el.innerHTML = (glyph && glyph !== 'none' ? '<span class="g">' + glyph + '</span>' : '') + '<span class="tx"></span><span class="fx-caret"></span>';
    var tx = el.querySelector('.tx'), caret = el.querySelector('.fx-caret');
    var rows = typeRows(text, c.t, { fix: c.o.fix, speed: num(c.o.speed, 1), seed: Math.round(c.t * 1000) + text.length });
    // 打字期间元素按最终宽度占位，不会一边打一边变宽
    tx.textContent = text; el.style.minWidth = el.offsetWidth + 'px'; tx.textContent = '';
    onFrame(function (t) { tx.textContent = textAt(rows, t); caret.style.opacity = caretOn(t, c.t, rows.end) ? 1 : 0; });
    c.o.dur = rows.end - c.t;
  });

  /* ═════════════════════════ 终端 ═════════════════════════ */
  FX.make.terminal = function (el) {
    el.classList.add('fx-term');
    var lines = Array.prototype.slice.call(el.children), title = attr(el, 'title', 'terminal');
    var body = mk('div', 'fx-term-body');
    lines.forEach(function (p) {
      var cmd = p.hasAttribute('data-cmd'), ln = mk('div', 'fx-term-line' + (cmd ? ' cmd' : ''));
      ln.innerHTML = cmd ? '<span class="g">$</span><span class="tx"></span><span class="fx-caret"></span>' : p.innerHTML;
      if (cmd) ln.setAttribute('data-text', p.textContent.trim());
      body.appendChild(ln);
    });
    var tail = mk('div', 'fx-term-line cmd tail', '<span class="g">$</span><span class="fx-caret"></span>');
    body.appendChild(tail);
    el.innerHTML = '<div class="fx-term-bar" data-lint="off"><i></i><i></i><i></i><span>' + title + '</span></div>';
    el.appendChild(body);
  };
  def('run', CAT, '终端跑一条命令：敲命令、停一拍、输出一行行打印出来，最后出现新的提示符。写在 data-make="terminal" 上。参数 every（输出行间隔，默认 0.22 秒）、speed（打字倍速）', function (c) {
    var el = c.el, cmds = el.querySelectorAll('.fx-term-line.cmd:not(.tail)'), outs = el.querySelectorAll('.fx-term-line:not(.cmd)'), tail = el.querySelector('.tail'), t = c.t;
    Array.prototype.forEach.call(outs, function (o) { c.tl.set(o, { visibility: 'hidden' }, 0); });
    c.tl.set(tail, { visibility: 'hidden' }, 0);
    Array.prototype.forEach.call(cmds, function (ln) {
      var tx = ln.querySelector('.tx'), caret = ln.querySelector('.fx-caret'), rows = typeRows(ln.getAttribute('data-text') || '', t, { speed: num(c.o.speed, 1.6), seed: 99 });
      var a = t, b = rows.end;
      onFrame(function (tt) { tx.textContent = textAt(rows, tt); caret.style.opacity = tt >= b + 0.3 ? 0 : caretOn(tt, a, b) ? 1 : 0; });
      t = rows.end + 0.35;
    });
    var every = num(c.o.every, 0.22);
    Array.prototype.forEach.call(outs, function (o, k) { c.tl.set(o, { visibility: 'inherit' }, t + k * every); });
    c.tl.set(tail, { visibility: 'inherit' }, t + outs.length * every + 0.15);
    c.o.dur = t + outs.length * every - c.t;
  });

  /* ═════════════════════════ 代码 ═════════════════════════ */
  var KW = /\b(def|return|if|else|elif|for|while|in|import|from|class|function|const|let|var|async|await|new|try|catch|except|with|as|and|or|not|True|False|None|null|true|false|this|self|lambda|yield|export|default)\b/g;
  function tint(s) {
    var esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), out = '', re = /(#.*$|\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)/g, last = 0, m;
    var kw = function (x) { return x.replace(KW, '<span class="k">$1</span>'); };
    while ((m = re.exec(esc))) { out += kw(esc.slice(last, m.index)) + '<span class="' + (m[1] ? 'c' : m[2] ? 's' : 'n') + '">' + m[0] + '</span>'; last = re.lastIndex; }
    return out + kw(esc.slice(last));
  }
  FX.make.code = function (el) {
    el.classList.add('fx-code');
    var pre = el.querySelector('pre'), src = (pre ? pre.textContent : el.textContent).replace(/^\n+|\s+$/g, ''), title = attr(el, 'title', '');
    var body = mk('div', 'fx-code-body'), n = 0;
    src.split('\n').forEach(function (line) {
      var op = /^\+ /.test(line) ? 'add' : /^- /.test(line) ? 'del' : '', text = op ? line.slice(2) : line, ln = mk('div', 'fx-code-line' + (op ? ' ' + op : ''));
      if (op !== 'add') n++;
      ln.innerHTML = '<span class="no" data-lint="off">' + (op === 'add' ? '+' : n) + '</span><span class="src">' + (tint(text) || ' ') + '</span>';
      body.appendChild(ln);
    });
    el.innerHTML = title ? '<div class="fx-code-bar" data-lint="off"><span>' + title + '</span></div>' : '';
    el.appendChild(body);
  };
  def('diff', CAT, '代码改动：要删的行先变红再收起，要加的行变绿展开。写在 data-make="code" 上（行首「- 」是删、「+ 」是加）', function (c) {
    var del = c.el.querySelectorAll('.fx-code-line.del'), add = c.el.querySelectorAll('.fx-code-line.add'), t = c.t;
    var H = (c.el.querySelector('.fx-code-line:not(.add)') || {}).offsetHeight || 48;
    Array.prototype.forEach.call(add, function (ln) { ln.style.height = '0px'; ln.style.opacity = 0; });
    Array.prototype.forEach.call(del, function (ln, k) {
      c.tl.fromTo(ln, { backgroundColor: 'rgba(248,81,73,0)' }, { backgroundColor: 'rgba(248,81,73,.22)', duration: 0.2, immediateRender: false }, t);
      c.tl.fromTo(ln, { height: H, opacity: 1 }, { height: 0, opacity: 0, duration: 0.55, ease: 'power2.inOut', immediateRender: false }, t + 0.45 + k * 0.08);
    });
    var ta = t + (del.length ? 0.45 + 0.55 + (del.length - 1) * 0.08 + 0.15 : 0.1);
    Array.prototype.forEach.call(add, function (ln, k) {
      c.tl.fromTo(ln, { height: 0, opacity: 0 }, { height: H, opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false }, ta + k * 0.12);
    });
    c.o.dur = ta + add.length * 0.12 + 0.6 - t;
  });
  def('code-focus', CAT, '代码里某一行亮起一条高光扫过，其余行压暗。写在 data-make="code" 上。参数 i（第几行，按最终显示的行数从 1 数；0 = 全部恢复）', function (c) {
    var lines = Array.prototype.filter.call(c.el.querySelectorAll('.fx-code-line'), function (l) { return !l.classList.contains('del'); }), i = num(c.o.i, 1);
    lines.forEach(function (ln, k) {
      var on = i === 0 || k === i - 1;
      c.tl.to(ln, { opacity: on ? 1 : 0.32, duration: 0.3, ease: 'power2.out' }, c.t);
      if (i > 0 && k === i - 1) {
        var band = ln.querySelector('.fx-code-band') || ln.appendChild(mk('span', 'fx-code-band'));
        c.tl.fromTo(band, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.4, ease: 'power2.out', immediateRender: false }, c.t);
      }
    });
    if (i === 0) Array.prototype.forEach.call(c.el.querySelectorAll('.fx-code-band'), function (b) { c.tl.to(b, { opacity: 0, duration: 0.3 }, c.t); });
  });

  /* ═════════════════════════ Agent 光标 ═════════════════════════ */
  FX.make.agent = function (el) {
    el.classList.add('fx-agent');
    el.innerHTML = '<svg class="ptr" viewBox="0 0 40 52" width="40" height="52"><path d="M3 3 L3 42 L13 33 L20 49 L27 46 L20 30 L34 30 Z" /></svg>' +
      '<span class="ring"></span><span class="tag"><b>' + attr(el, 'name', 'Agent') + '</b><span class="say"></span></span>';
    el.__steps = [];
  };
  def('agent-go', CAT, 'Agent 光标：名牌上打出它要做的事，光标移到目标上点一下（带一圈波纹）。写在 data-make="agent" 上，可以连写多次。参数 to=#目标（不写就原地）、say（名牌上的字）、click=0（不点）、done=1（打一个勾表示做完）', function (c) {
    var el = c.el, o = c.o, steps = el.__steps; if (!steps) return;
    var t = c.t, say = o.say ? String(o.say) : '', base = FX.rect(el), tg = o.to ? FX.rect(String(o.to)) : null;
    steps.push({ t: t, say: (String(o.done) === '1' ? '✓ ' : '') + say });
    var tMove = t + (say ? 0.35 : 0);
    if (tg && base) c.tl.to(el, { x: tg.cx - base.x, y: tg.cy - base.y, duration: 0.5, ease: 'power2.inOut' }, tMove);
    if (tg && String(o.click) !== '0') {
      var tc = tMove + 0.7, ptr = el.querySelector('.ptr'), ring = el.querySelector('.ring');
      c.tl.fromTo(ptr, { scale: 1 }, { scale: 0.84, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '0% 0%', immediateRender: false }, tc);
      c.tl.fromTo(ring, { scale: 0.2, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, tc);
      c.o.__click = tc;
    }
    if (steps.length === 1) {
      var sayEl = el.querySelector('.say');
      onFrame(function (tt) {
        var cur = null; for (var k = 0; k < steps.length; k++) if (tt >= steps[k].t) cur = steps[k];
        if (!cur) { sayEl.textContent = ''; return; }
        var n = Math.min(cur.say.length, Math.floor((tt - cur.t) / 0.35 * cur.say.length + 0.0001));
        sayEl.textContent = cur.say.slice(0, n);
      });
    }
  });

  /* 每一帧按秒数重写文字（打字、终端、名牌）：跳到哪一秒，文字就是那一秒该有的样子 */
  (FX.afterBuild = FX.afterBuild || []).push(function (tl) {
    if (!FRAMES.length) return;
    var paint = function () { var t = tl.time(); for (var i = 0; i < FRAMES.length; i++) FRAMES[i](t); };
    if (FX.onFrame) FX.onFrame(paint); paint();
  });
})(typeof window !== 'undefined' ? window : globalThis);
