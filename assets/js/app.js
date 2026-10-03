/* ==========================================================
   線性規劃互動學習網 — 主程式
   ========================================================== */
(function () {
  'use strict';
  const { T, PRESETS, SCENES, LESSONS, ITEMS, QUIZ, UI } = window.DATA;
  const { Plot, fmt, eqText } = window.LP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const COLORS = ['var(--blue)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--pink)', 'var(--teal)', 'var(--red)'];

  /* ======================= 儲存 ======================= */
  const NSKEY = 'lp3.';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(NSKEY + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(NSKEY + k, JSON.stringify(v)); } catch (e) { /* 儲存不可用時仍可使用 */ } },
    del(k) { try { localStorage.removeItem(NSKEY + k); } catch (e) { } }
  };
  const DEF_SET = { sound: true, device: 'auto', layout: 'auto', lang: 'zh', font: 'normal', theme: 'system' };
  const S = Object.assign({}, DEF_SET);
  (function () {
    const s = store.get('settings', {});
    if (s && typeof s === 'object') for (const k in DEF_SET) if (typeof s[k] === typeof DEF_SET[k]) S[k] = s[k];
  })();
  const saveSettings = () => store.set('settings', S);

  function freshRec() {
    return { first: Date.now(), visits: 0, name: '', lessons: {}, labs: {}, items: {}, practice: { total: 0, correct: 0, best: 0, byType: {} }, quizzes: [], log: [] };
  }
  let R = (function () {
    const r = store.get('records', null), f = freshRec();
    if (!r || typeof r !== 'object') return f;
    for (const k in f) if (r[k] == null || typeof r[k] !== typeof f[k] || Array.isArray(f[k]) !== Array.isArray(r[k])) r[k] = f[k];
    for (const k in f.practice) if (typeof r.practice[k] !== typeof f.practice[k]) r.practice[k] = f.practice[k];
    return r;
  })();
  const saveRec = () => { store.set('records', R); updateProgress(); };

  function log(type, msg, extra) {
    const m = typeof msg === 'string' ? { zh: msg, en: msg } : msg;
    R.log.unshift(Object.assign({ t: Date.now(), type, zh: m.zh, en: m.en }, extra || {}));
    if (R.log.length > 400) R.log.length = 400;
    saveRec();
  }

  /* ======================= 語言 ======================= */
  const tr = o => (o && typeof o === 'object' && ('zh' in o)) ? (o[S.lang] || o.zh) : o;
  const ui = k => (UI[S.lang] && UI[S.lang][k]) || UI.zh[k] || k;
  const L = (zh, en) => S.lang === 'en' ? en : zh;

  function md(s) {
    s = tr(s);
    return String(s).replace(/\$([^$]+)\$/g, (m, inner) => {
      let t = inner.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
      t = t.replace(/\\frac\s*(\w)(\w)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
      t = t.replace(/\\sqrt\{?(\w)\}?/g, '√$1');
      t = t.replace(/\\overleftrightarrow\{(\w+)\}/g, '<span style="text-decoration:overline">$1</span>');
      t = t.replace(/\\\{/g, '{');
      t = t.replace(/([A-Za-z])_(\w)/g, '$1<sub>$2</sub>');
      return '<span class="m">' + t + '</span>';
    });
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ======================= 音效 ======================= */
  let AC = null;
  function ac() {
    if (!AC) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; AC = new A(); }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d, type, vol, delay) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + d + 0.05);
  }
  const SFX = {
    click() { tone(700, 0.07, 'triangle', 0.07); },
    tick() { tone(1100, 0.03, 'square', 0.025); },
    ok() { tone(523, 0.12, 'sine', 0.16); tone(659, 0.12, 'sine', 0.16, 0.09); tone(784, 0.2, 'sine', 0.16, 0.18); },
    bad() { tone(240, 0.16, 'sawtooth', 0.06); tone(180, 0.24, 'sawtooth', 0.06, 0.12); },
    win() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.14, i * 0.11)); },
    pop() { tone(880, 0.08, 'sine', 0.12); tone(1320, 0.1, 'sine', 0.08, 0.05); },
    whoosh() { tone(300, 0.25, 'sine', 0.05); tone(600, 0.2, 'sine', 0.04, 0.08); }
  };
  let lastTick = 0;
  function sfx(n) {
    if (!S.sound) return;
    if (n === 'tick') { const now = performance.now(); if (now - lastTick < 70) return; lastTick = now; }
    try { SFX[n](); } catch (e) { }
  }

  /* ======================= 小工具 ======================= */
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cs = ['#3b6cff', '#ec4899', '#facc15', '#16a34a', '#f97316', '#8b5cf6'];
    for (let i = 0; i < 70; i++) {
      const d = document.createElement('div'); d.className = 'confetti';
      d.style.left = Math.random() * 100 + 'vw'; d.style.background = cs[i % cs.length];
      d.style.animationDuration = (1.8 + Math.random() * 1.8) + 's'; d.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(d); setTimeout(() => d.remove(), 4200);
    }
  }
  function parseNum(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
      .replace(/[－−–—]/g, '-').replace(/／/g, '/').replace(/．/g, '.').replace(/[,，\s元]/g, '');
    if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(s)) { const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; }
    if (/^-?\d*\.?\d+$/.test(s)) return Number(s);
    return NaN;
  }
  const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function svgEl(cls) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); if (cls) s.setAttribute('class', cls); s.setAttribute('role', 'img'); return s; }
  const isAxisCon = c => (c.c === 0 && ((c.a === 1 && c.b === 0) || (c.a === 0 && c.b === 1)) && c.op === '>=');
  const pt = p => `(${fmt(p.x)}, ${fmt(p.y)})`;

  /* ======================= 圖形 ======================= */
  function presetFig(P, key, opt) {
    opt = opt || {};
    const pr = PRESETS[key];
    P.setView(pr.view); P.base();
    P.feasible(pr.cons, { fill: opt.fill || 'var(--region)' });
    pr.cons.forEach((c, i) => { if (!isAxisCon(c)) P.line(c, { color: COLORS[i % COLORS.length], label: eqText(c, '='), at: 0.8 - 0.12 * (i % 3) }); });
    const s = LP.solve(pr.cons, pr.obj, pr.goal);
    if (pr.lattice) P.lattice(pr.cons, { r: 5 });
    if (opt.obj && s.status === 'ok') {
      const c = { a: pr.obj.p, b: pr.obj.q, c: s.best - (pr.obj.r || 0) };
      P.line(c, { color: 'var(--orange)', dash: '8 6', w: 2.4 });
    }
    s.verts.forEach(v => {
      const isOpt = opt.opt !== false && s.status === 'ok' && s.opt.some(o => Math.hypot(o.x - v.x, o.y - v.y) < 1e-6);
      P.point(v.x, v.y, { color: isOpt ? 'var(--red)' : 'var(--ink)', r: isOpt ? 7 : 5, halo: isOpt, label: opt.labels === false ? null : pt(v), size: 13 });
    });
    return s;
  }
  const FIGS = {
    f1base(P) { P.setView({ xmin: -5, xmax: 6, ymin: -5, ymax: 5 }); P.base(); P.line({ a: 1, b: -1, c: 0 }, { color: 'var(--blue)', label: 'L₀：x−y=0' }); },
    f1(P) {
      P.setView({ xmin: -3, xmax: 6, ymin: -4, ymax: 5 }); P.base();
      ['L₀', 'L₁', 'L₂', 'L₃'].forEach((n, i) => P.line({ a: 1, b: -1, c: i }, { color: COLORS[i], label: `${n}：x−y=${i}`, at: 0.92 - i * 0.07 }));
      [1, 2, 3].forEach(i => P.point(i, 0, { color: COLORS[i], r: 4 }));
    },
    try1(P) {
      P.setView({ xmin: -6, xmax: 4, ymin: -4, ymax: 6 }); P.base();
      P.line({ a: 1, b: -1, c: 0 }, { color: 'var(--blue)', label: 'L₀：x−y=0', at: 0.92 });
      ['L₄', 'L₅', 'L₆'].forEach((n, i) => P.line({ a: 1, b: -1, c: -(i + 1) }, { color: COLORS[i + 1], label: `${n}：x−y=−${i + 1}`, at: 0.7 - i * 0.12 }));
      [1, 2, 3].forEach(i => P.point(-i, 0, { color: COLORS[i], r: 4 }));
    },
    f5(P) {
      P.setView({ xmin: -1, xmax: 8, ymin: -1, ymax: 8 }); P.base();
      [[1, 'L₁'], [2, 'L₂'], [3, 'L₃'], [6, 'Lₙ']].forEach(([n, l], i) => P.line({ a: 1, b: 1, c: n }, { color: COLORS[i], label: `${l}：x+y−${n === 6 ? 'n' : n}=0`, at: 0.08, dx: 4 }));
    },
    f6(P) {
      P.setView({ xmin: -1, xmax: 5, ymin: -1, ymax: 7 }); P.base({ step: 1 });
      [2, 4, 6].forEach((c, i) => { P.line({ a: 2, b: 1, c }, { color: COLORS[i], label: `L${'₁₂₃'[i]}：2x+y=${c}`, at: 0.5 + i * 0.1 }); P.point(c / 2, 0, { color: COLORS[i], r: 5, label: `(${c / 2}, 0)`, dy: 18, size: 12 }); P.point(0, c, { color: COLORS[i], r: 4 }); });
    },
    f7a(P) { P.setView({ xmin: -3, xmax: 5, ymin: -3, ymax: 5 }); P.base({ step: 1 }); P.line({ a: 1, b: 1, c: 2 }, { label: 'L：x+y=2', at: 0.2 }); },
    f7b(P) { P.setView({ xmin: -3, xmax: 5, ymin: -3, ymax: 5 }); P.base({ step: 1 }); P.halfplane({ a: 1, b: 1, c: 2, op: '>' }); P.line({ a: 1, b: 1, c: 2, op: '>' }, { label: 'L', at: 0.2 }); P.text(2.4, 2.4, 'E₁', { size: 20, weight: 800, color: 'var(--blue)' }); },
    f7c(P) { P.setView({ xmin: -3, xmax: 5, ymin: -3, ymax: 5 }); P.base({ step: 1 }); P.halfplane({ a: 1, b: 1, c: 2, op: '<' }, { fill: 'var(--region2)' }); P.line({ a: 1, b: 1, c: 2, op: '<' }, { label: 'L', at: 0.2, color: 'var(--pink)' }); P.text(-1.8, -1.6, 'E₂', { size: 20, weight: 800, color: 'var(--pink)' }); },
    f8a(P) { P.setView({ xmin: -3, xmax: 5, ymin: -3, ymax: 5 }); P.base({ step: 1 }); P.halfplane({ a: 1, b: 1, c: 2, op: '>=' }); P.line({ a: 1, b: 1, c: 2 }, { label: 'x+y≥2', at: 0.2 }); },
    f8b(P) { P.setView({ xmin: -3, xmax: 5, ymin: -3, ymax: 5 }); P.base({ step: 1 }); P.halfplane({ a: 1, b: 1, c: 2, op: '<=' }, { fill: 'var(--region2)' }); P.line({ a: 1, b: 1, c: 2 }, { label: 'x+y≤2', at: 0.2, color: 'var(--pink)' }); },
    f8c(P) { P.setView({ xmin: -3, xmax: 5, ymin: -3, ymax: 5 }); P.base({ step: 1 }); P.halfplane({ a: 1, b: 1, c: 2, op: '<' }, { fill: 'var(--region2)' }); P.line({ a: 1, b: 1, c: 2, op: '<' }, { label: 'x+y＜2', at: 0.2, color: 'var(--pink)' }); },
    f11(P) {
      P.setView({ xmin: -6, xmax: 5, ymin: -4, ymax: 5 }); P.base({ step: 1 });
      const c1 = { a: 1, b: -2, c: -2, op: '<=' }, c2 = { a: 1, b: 1, c: -2, op: '>' };
      P.feasible([c1, c2], { fill: 'rgba(225,29,72,.28)' });
      P.line(c1, { color: 'var(--blue)', label: 'L₁：x−2y+2=0', at: 0.85 }); P.line(c2, { color: 'var(--green)', label: 'L₂：x+y+2=0', at: 0.12 });
    },
    try3(P) {
      P.setView({ xmin: -3, xmax: 6, ymin: -4, ymax: 5 }); P.base({ step: 1 });
      const c1 = { a: 2, b: -1, c: 2, op: '<=' }, c2 = { a: 1, b: 3, c: 3, op: '>' };
      P.feasible([c1, c2], { fill: 'rgba(225,29,72,.28)' });
      P.line(c1, { color: 'var(--blue)', label: '2x−y−2=0', at: 0.9 }); P.line(c2, { color: 'var(--green)', label: 'x+3y−3=0', at: 0.1 });
    },
    f14(P) {
      const s = presetFig(P, 'text', { labels: false, opt: false });
      [['A', -2, 4, -14, -10], ['B', 10 / 3, 4 / 3, 10, 18], ['C', 6, 4, 6, -10]].forEach(([n, x, y, dx, dy]) => P.text(x, y, `${n}${pt({ x, y })}`, { px: P.X(x) + dx, py: P.Y(y) + dy, size: 13, weight: 700, anchor: n === 'A' ? 'start' : 'start' }));
      return s;
    },
    f16(P) { presetFig(P, 'ex4', { obj: true }); P.line({ a: 1, b: 3, c: 0 }, { color: 'var(--orange)', dash: '4 6', w: 2 }); },
    f20(P) { presetFig(P, 'ex5', { obj: true }); },
    f21(P) { presetFig(P, 'ex6', { obj: true }); },
    t4(P) { presetFig(P, 't4', { obj: true }); },
    t5(P) { presetFig(P, 't5', { obj: true }); },
    t6(P) { presetFig(P, 't6', { obj: true }); },
    h5(P) { presetFig(P, 'h5', { opt: false, labels: false }); },
    h8(P) { presetFig(P, 'h8', { obj: true }); },
    h9(P) { presetFig(P, 'h9', { obj: true }); },
    h10(P) { presetFig(P, 'h10', { obj: true }); },
    intro(P) { presetFig(P, 'intro', { obj: true }); },
    hw1(P) {
      P.setView({ xmin: -3, xmax: 7, ymin: -3, ymax: 7 }); P.base({ step: 1 });
      const c1 = { a: 3, b: 2, c: 12, op: '<=' }, c2 = { a: 1, b: 1, c: 2, op: '>' };
      P.feasible([c1, c2], { fill: 'rgba(225,29,72,.28)' });
      P.line(c1, { color: 'var(--blue)', label: '3x+2y−12=0', at: 0.12 }); P.line(c2, { color: 'var(--green)', label: 'x+y−2=0', at: 0.15 });
    },
    hw2(P) {
      P.setView({ xmin: -1, xmax: 8, ymin: -2, ymax: 5 }); P.base({ step: 1 });
      const c1 = { a: 2, b: 3, c: 12, op: '<=' }, c2 = { a: 1, b: -3, c: -3, op: '>' };
      P.feasible([c1, c2], { fill: 'rgba(236,72,153,.32)' });
      P.line(c1, { color: 'var(--red)' }); P.line(c2, { color: 'var(--orange)' });
      [[3, 2], [6, 0], [0, 1]].forEach(([x, y]) => P.point(x, y, { hollow: true, color: 'var(--ink)', r: 5, label: `(${x}, ${y})`, size: 13 }));
    },
    hw4(P) {
      P.setView({ xmin: -0.5, xmax: 5, ymin: -0.5, ymax: 5 }); P.base({ step: 1 });
      P.line({ a: 1, b: -2, c: 0 }, { color: 'var(--blue)', label: 'L：x−2y=0', at: 0.6 });
      [['A', 1, 2.6], ['B', 1, 4.2], ['C', 2.6, 4.2], ['D', 2.6, 2.6]].forEach(([n, x, y]) => P.point(x, y, { color: 'var(--orange)', label: n, size: 16 }));
    },
    hw6(P) {
      P.setView({ xmin: -4, xmax: 4, ymin: -3, ymax: 4 }); P.base({ step: 1, ticks: false });
      [[-4.5, 'L₁', 'var(--blue)'], [-1, 'L₂', 'var(--green)'], [5, 'L₃', 'var(--orange)']].forEach(([c, n, col]) => P.line({ a: -3, b: 1, c }, { color: col, label: n, at: 0.95 }));
    },
    hw7(P) {
      const s = 2, h = Math.sqrt(3);
      const V = [['A', -1, 0], ['B', 1, 0], ['C', 2, h], ['D', 1, 2 * h], ['E', -1, 2 * h], ['F', -2, h]];
      P.setView({ xmin: -3, xmax: 3.5, ymin: -1, ymax: 4.3 }); P.base({ step: 1, ticks: false });
      P.poly(V.map(v => ({ x: v[1], y: v[2] })), { fill: 'rgba(13,148,136,.12)', stroke: 'var(--teal)', sw: 3 });
      V.forEach(([n, x, y]) => P.point(x, y, { color: 'var(--teal)', r: 4, label: n, dx: x < 0 ? -18 : 8, dy: y > 1 ? -8 : 18, size: 16 }));
      void s;
    }
  };
  function drawFig(id, wrapper, opt) {
    const svg = svgEl(); wrapper.appendChild(svg);
    const P = new Plot(svg, Object.assign({ W: 420, H: 400 }, opt || {}));
    try { FIGS[id](P); } catch (e) { console.error('fig', id, e); }
    return P;
  }

  /* ======================= 設定 ======================= */
  function effDevice() {
    if (S.device !== 'auto') return S.device;
    const w = window.innerWidth;
    return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  }
  function effOrient() {
    if (S.layout !== 'auto') return S.layout;
    return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  }
  function applySettings() {
    const h = document.documentElement;
    h.dataset.theme = S.theme === 'system' ? '' : S.theme;
    if (S.theme === 'system') h.removeAttribute('data-theme');
    h.dataset.font = S.font;
    h.dataset.eff = effDevice();
    h.dataset.forced = S.device !== 'auto' ? '1' : '0';
    h.dataset.orient = effOrient();
    h.lang = S.lang === 'en' ? 'en' : 'zh-Hant-TW';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(h).getPropertyValue('--bg').trim() || '#f4f7ff';
    renderSettings();
  }
  const SETS = [
    { k: 'full', label: 'set_full', icon: '🖥️', opts: [['on', 'on'], ['off', 'off']] },
    { k: 'sound', label: 'set_sound', icon: '🔊', opts: [[true, 'on'], [false, 'off']] },
    { k: 'device', label: 'set_device', icon: '📱', opts: [['auto', 'auto'], ['mobile', 'mobile'], ['tablet', 'tablet'], ['desktop', 'desktop']] },
    { k: 'layout', label: 'set_layout', icon: '🔄', opts: [['auto', 'auto'], ['portrait', 'portrait'], ['landscape', 'landscape']] },
    { k: 'lang', label: 'set_lang', icon: '🌐', opts: [['zh', null, '繁體中文'], ['en', null, 'English']] },
    { k: 'font', label: 'set_font', icon: '🔠', opts: [['small', 'small'], ['normal', 'normal'], ['large', 'large']] },
    { k: 'theme', label: 'set_theme', icon: '🎨', opts: [['system', 'system'], ['light', 'light'], ['dark', 'dark']] }
  ];
  function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function setFull(on) {
    const d = document.documentElement;
    try {
      if (on && !isFull()) { const f = d.requestFullscreen || d.webkitRequestFullscreen; if (f) { const p = f.call(d); if (p && p.catch) p.catch(() => toast(L('此裝置不支援全螢幕', 'Fullscreen not supported'))); } else toast(L('此裝置不支援全螢幕', 'Fullscreen not supported')); }
      if (!on && isFull()) { const f = document.exitFullscreen || document.webkitExitFullscreen; if (f) f.call(document); }
    } catch (e) { toast(L('此裝置不支援全螢幕', 'Fullscreen not supported')); }
  }
  function renderSettings() {
    const box = $('#setBody'); if (!box) return;
    box.innerHTML = SETS.map(s => `<div class="setrow"><b>${s.icon} ${ui(s.label)}</b><div class="seg" role="group" aria-label="${ui(s.label)}">` +
      s.opts.map(([v, lk, lit]) => {
        const cur = s.k === 'full' ? (isFull() ? 'on' : 'off') : S[s.k];
        return `<button type="button" data-k="${s.k}" data-v="${v}" aria-pressed="${cur === v}">${lit || ui(lk)}</button>`;
      }).join('') + '</div></div>').join('') +
      `<p class="lead" style="font-size:.9rem">${L('設定會自動儲存在此瀏覽器。', 'Settings are saved in this browser.')}</p>`;
    $('#setTitle').textContent = ui('settings');
  }
  function onSetting(k, raw) {
    sfx('click');
    if (k === 'full') { setFull(raw === 'on'); setTimeout(renderSettings, 300); return; }
    const v = raw === 'true' ? true : raw === 'false' ? false : raw;
    const langChanged = k === 'lang' && S.lang !== v;
    S[k] = v; saveSettings(); applySettings();
    if (langChanged) renderAll();
    if (k === 'device' || k === 'layout') setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  /* ======================= 導覽 ======================= */
  const PAGES = ['home', 'learn', 'lab', 'examples', 'advanced', 'practice', 'quiz', 'record'];
  const NAVKEY = { home: 'nav_home', learn: 'nav_learn', lab: 'nav_lab', examples: 'nav_ex', advanced: 'nav_adv', practice: 'nav_prac', quiz: 'nav_quiz', record: 'nav_rec' };
  const seen = {};
  function go(page, silent) {
    if (!PAGES.includes(page)) page = 'home';
    $$('.page').forEach(p => p.classList.toggle('active', p.id === page));
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.page === page));
    const btn = $(`.tabs button[data-page="${page}"]`); if (btn && btn.scrollIntoView) btn.scrollIntoView({ inline: 'center', block: 'nearest' });
    if (!silent) { sfx('whoosh'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (location.hash !== '#' + page) history.replaceState(null, '', '#' + page);
    if (!seen[page]) { seen[page] = 1; log('nav', T('進入頁面：' + navName(page, 'zh'), 'Opened: ' + navName(page, 'en'))); }
    if (page === 'record') renderRecord();
  }
  const navName = (p, lang) => (UI[lang][NAVKEY[p]] || p).replace(/^\S+\s/, '');
  function renderNav() {
    $('#tabs').innerHTML = PAGES.map(p => `<button type="button" role="tab" data-page="${p}" aria-selected="false">${ui(NAVKEY[p])}</button>`).join('');
    const cur = (location.hash || '#home').slice(1);
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.page === cur));
  }

  /* ======================= 進度 ======================= */
  function progress() {
    const lessons = LESSONS.filter(l => R.lessons[l.id]).length / LESSONS.length;
    const labs = Math.min(Object.keys(R.labs).length, 5) / 5;
    const items = ITEMS.filter(i => R.items[i.id] && R.items[i.id].done).length / ITEMS.length;
    const prac = Math.min(R.practice.correct / 20, 1);
    const quiz = R.quizzes.length ? Math.max(...R.quizzes.map(q => q.score)) / 100 : 0;
    return Math.round(lessons * 25 + labs * 15 + items * 25 + prac * 15 + quiz * 20);
  }
  function updateProgress() {
    const p = progress();
    const c = $('#ringArc'); if (c) c.style.strokeDashoffset = String(125.6 * (1 - p / 100));
    const b = $('#ringTxt'); if (b) b.textContent = p + '%';
    const steps = $$('#pathSteps .step');
    if (steps.length) {
      const st = [LESSONS.filter(l => R.lessons[l.id]).length >= 3, Object.keys(R.labs).length >= 2, ITEMS.filter(i => R.items[i.id] && R.items[i.id].done).length >= 6, Object.keys(R.labs).length >= 4 || ITEMS.filter(i => i.kind === 'hw' && R.items[i.id] && R.items[i.id].done).length >= 3, R.practice.correct >= 10, R.quizzes.some(q => q.score >= 80)];
      steps.forEach((s, i) => s.classList.toggle('done', !!st[i]));
    }
  }

  /* ======================= 首頁（學習指引） ======================= */
  function renderHome() {
    const goals = [T('理解平行直線系：斜率相等、只改常數項的直線，並能判斷平移後的方程式與截距變化。', 'Understand families of parallel lines: same slope, different constant; predict translations and intercepts.'),
      T('能畫出二元一次不等式與聯立不等式的圖形（實線／虛線、代點判斷半平面）。', 'Graph linear inequalities and systems (solid/dashed, test points).'),
      T('理解可行解、可行解區域、目標函數、最佳解的意義。', 'Know feasible solution, feasible region, objective function, optimal solution.'),
      T('會用平行線法與頂點法解線性規劃問題，並能將生活情境列式求解。', 'Solve LP problems by the parallel-line and vertex methods, including word problems.')];
    const path = [T('📘 閱讀課程內容（章首～4 節），完成每節的隨堂小測', '📘 Read the lessons and pass each quick check'),
      T('🧪 操作互動實驗室：平行直線系、半平面', '🧪 Explore the parallel-line and half-plane labs'),
      T('📝 研讀例題 1–6，完成隨堂練習 1–6', '📝 Study Examples 1–6 and Practice 1–6'),
      T('🚀 完成習題 1–10、操作線性規劃實驗室與情境模擬', '🚀 Do Exercises 1–10, LP Lab and scenario simulator'),
      T('🔁 練習區反覆演練，答對 10 題以上', '🔁 Practice until you get 10+ correct'),
      T('🏆 參加測驗，達 80 分即通過！', '🏆 Take the quiz — 80 to pass!')];
    $('#home').innerHTML = `
<section class="hero">
  <span class="floaty" style="left:4%;top:8%">📐</span><span class="floaty" style="right:6%;top:6%;animation-delay:-2s">✏️</span><span class="floaty" style="left:44%;bottom:6%;animation-delay:-4s">📈</span>
  <div>
    <h2>${ui('title')}</h2>
    <p>${L('在限制條件下，找出「最好」的答案！', 'Find the best answer under constraints!')}</p>
    <div class="chips"><span>📏 ${L('平行直線系', 'Parallel lines')}</span><span>🌗 ${L('二元一次不等式', 'Linear inequalities')}</span><span>🎯 ${L('線性規劃', 'Linear programming')}</span></div>
    <div class="row" style="margin-top:14px"><button class="btn y" data-go="learn">🚀 ${L('開始學習', 'Start learning')}</button><button class="btn ghost" style="color:#fff;border-color:rgba(255,255,255,.6);background:rgba(255,255,255,.12)" data-go="lab">🧪 ${L('直接玩實驗室', 'Jump to labs')}</button></div>
  </div>
  <div>${heroSVG()}</div>
</section>
<h2 class="sec"><span class="emo">🧭</span>${L('學習指引', 'Study guide')}</h2>
<div class="grid g2">
  <div class="card"><h3>🎯 ${L('學習目標', 'Learning goals')}</h3><ol>${goals.map(g => `<li>${tr(g)}</li>`).join('')}</ol></div>
  <div class="card"><h3>🧰 ${L('先備知識', 'Prerequisites')}</h3><ul>
    <li>${L('直線的斜率與方程式（第一冊）', 'Slope and equation of a line')}</li>
    <li>${L('二元一次聯立方程式的解法（求交點）', 'Solving 2×2 linear systems (intersections)')}</li>
    <li>${L('不等式的基本性質（乘以負數要變號）', 'Inequality rules (flip when multiplying by a negative)')}</li></ul>
    <h3>⏱️ ${L('建議學習時間', 'Suggested time')}</h3><p>${L('約 4 節課（每節 50 分鐘）：觀念 2 節、應用 1 節、練習與測驗 1 節。', 'About four 50-minute periods: concepts 2, applications 1, practice & quiz 1.')}</p></div>
</div>
<div class="card"><h3>🗺️ ${L('學習路徑（完成後自動打勾）', 'Learning path (auto-checked)')}</h3><div class="steps" id="pathSteps">${path.map(p => `<div class="step">${tr(p)}</div>`).join('')}</div></div>
<div class="grid g4">
  ${[['📘', 'learn', T('課程內容', 'Lessons'), T('教材重點＋動態圖形＋小測', 'Key ideas + figures + checks')], ['🧪', 'lab', T('互動實驗室', 'Labs'), T('5 個可操作的視覺化元件', '5 hands-on visual tools')], ['📝', 'examples', T('範例與習題', 'Examples'), T('例題 6、隨堂 6、習題 10', '6 examples, 6 practice, 10 exercises')], ['🚀', 'advanced', T('進階延伸', 'Advanced'), T('整數解、無界、多重最佳解', 'Integers, unbounded, multiple optima')], ['🔁', 'practice', T('練習', 'Practice'), T('無限題目隨機產生', 'Unlimited random questions')], ['🏆', 'quiz', T('測驗', 'Quiz'), T('10 題隨機，80 分通過', '10 random questions')], ['📊', 'record', T('學習歷程', 'Records'), T('紀錄與下載', 'Track & download')], ['⚙️', '#settings', T('顯示設定', 'Settings'), T('全螢幕、音效、字體、色系…', 'Fullscreen, sound, fonts…')]]
      .map(([i, p, t, d]) => `<button class="card" style="text-align:left;cursor:pointer;margin:0" data-go="${p}"><div style="font-size:2rem">${i}</div><b>${tr(t)}</b><div class="lead" style="font-size:.9rem">${tr(d)}</div></button>`).join('')}
</div>
<div class="card soft row" style="justify-content:space-between">
  <div><h3 style="margin:0">📄 ${L('原始教材', 'Original textbook')}</h3><p class="lead" style="margin:4px 0 0">${L('第 1 章 線性規劃（PDF，約 8 MB，18 頁）', 'Chapter 1 Linear Programming (PDF, ~8 MB, 18 pages)')}</p></div>
  <a class="btn o" href="assets/pdf/linear-programming.pdf" download="linear-programming.pdf" data-pdf>⬇️ ${ui('pdf')}</a>
</div>`;
    updateProgress();
  }
  function heroSVG() {
    return `<svg viewBox="0 0 320 260" aria-hidden="true">
  <defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#ffe680" stop-opacity=".9"/></linearGradient></defs>
  <g stroke="rgba(255,255,255,.25)">${Array.from({ length: 9 }, (_, i) => `<line x1="${30 + i * 32}" y1="10" x2="${30 + i * 32}" y2="240"/><line x1="20" y1="${16 + i * 28}" x2="300" y2="${16 + i * 28}"/>`).join('')}</g>
  <line x1="30" y1="230" x2="305" y2="230" stroke="#fff" stroke-width="3"/><line x1="40" y1="245" x2="40" y2="8" stroke="#fff" stroke-width="3"/>
  <polygon points="40,230 200,230 230,140 150,70 40,100" fill="url(#hg)" opacity=".85"/>
  <g stroke="#fff" stroke-width="2"><line x1="40" y1="100" x2="150" y2="70"/><line x1="150" y1="70" x2="230" y2="140"/><line x1="230" y1="140" x2="200" y2="230"/></g>
  <g><line x1="-20" y1="230" x2="160" y2="20" stroke="#ff3d7f" stroke-width="4" stroke-dasharray="10 6">
    <animateTransform attributeName="transform" type="translate" values="-60 0; 110 0; -60 0" dur="6s" repeatCount="indefinite"/></line></g>
  <circle cx="230" cy="140" r="9" fill="#ff3d7f"><animate attributeName="r" values="6;12;6" dur="1.5s" repeatCount="indefinite"/></circle>
  <text x="240" y="132" fill="#fff" font-size="18" font-weight="800">MAX!</text>
  <text x="150" y="250" fill="#fff" font-size="14" font-style="italic">x</text><text x="22" y="20" fill="#fff" font-size="14" font-style="italic">y</text>
</svg>`;
  }

  /* ======================= 課程內容 ======================= */
  let curLesson = 'l0';
  function renderLessons() {
    const el = $('#learn');
    el.innerHTML = `<h2 class="sec"><span class="emo">📘</span>${L('課程內容', 'Lessons')}</h2>
<p class="lead">${L('依序閱讀，每節最後有「⚡ 隨堂小測」。讀完按「✅ 我讀完了」會記錄到學習歷程。', 'Read in order; each lesson ends with a quick check. Press “I finished reading” to record progress.')}</p>
<div class="subtabs" role="tablist" id="lessonTabs">${LESSONS.map(l => `<button type="button" role="tab" data-lesson="${l.id}" aria-selected="${l.id === curLesson}">${l.icon} ${tr(l.title)} ${R.lessons[l.id] ? '<span class="ok">✔</span>' : ''}</button>`).join('')}</div>
<div id="lessonBody"></div>`;
    showLesson(curLesson);
  }
  function showLesson(id) {
    curLesson = id;
    const l = LESSONS.find(x => x.id === id) || LESSONS[0];
    $$('#lessonTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.lesson === l.id));
    const body = $('#lessonBody');
    const ck = l.check;
    body.innerHTML = `<article class="card">
<h3 style="font-size:1.4rem;margin-top:0">${l.icon} ${tr(l.title)}</h3>
${md(l.html)}
<div class="figs"></div>
<div class="card soft"><h3 style="margin-top:0">${ui('quick')}</h3><p>${esc(tr(ck.q))}</p><div class="opts" id="lqOpts"></div><div class="fb" id="lqFb"></div></div>
<div class="row" style="justify-content:space-between"><button class="btn g" id="lessonDone">${R.lessons[l.id] ? '✔ ' + ui('read_ok') : ui('done_read')}</button>
<span class="row">${prevNext(l.id)}</span></div></article>`;
    const figs = $('.figs', body);
    (l.figs || []).forEach(f => { const fg = document.createElement('figure'); fg.className = 'fig'; figs.appendChild(fg); drawFig(f.id, fg); const cap = document.createElement('figcaption'); cap.textContent = tr(f.cap); fg.appendChild(cap); });
    const sw = $('.lessonSweep', body); if (sw) buildLessonSweep(sw);
    const opts = $('#lqOpts', body);
    const order = shuffle(ck.opts.map((o, i) => i));
    order.forEach(i => {
      const b = document.createElement('button'); b.className = 'opt'; b.type = 'button'; b.textContent = tr(ck.opts[i]);
      b.onclick = () => {
        const ok = i === ck.a;
        $$('.opt', opts).forEach(x => x.disabled = true);
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) opts.children[order.indexOf(ck.a)].classList.add('right');
        const fb = $('#lqFb', body); fb.className = 'fb show ' + (ok ? 'ok' : 'no');
        fb.innerHTML = `<b>${ok ? '🎉 ' + ui('correct') : '🤔 ' + ui('wrong')}</b> ${esc(tr(ck.why))} <button class="btn ghost" style="min-height:38px;padding:4px 12px" id="lqRetry">↻</button>`;
        $('#lqRetry', body).onclick = () => showLesson(l.id);
        sfx(ok ? 'ok' : 'bad');
        log('lesson-check', T(`小測〈${l.title.zh}〉${ok ? '答對' : '答錯'}`, `Quick check “${l.title.en}”: ${ok ? 'correct' : 'wrong'}`));
      };
      opts.appendChild(b);
    });
    $('#lessonDone', body).onclick = () => {
      if (!R.lessons[l.id]) { R.lessons[l.id] = Date.now(); log('lesson', T(`完成閱讀〈${l.title.zh}〉`, `Finished reading “${l.title.en}”`)); sfx('win'); toast(L('已記錄！繼續加油 💪', 'Recorded! Keep going 💪')); }
      renderLessons();
    };
    $$('[data-lesson-go]', body).forEach(b => b.onclick = () => { sfx('click'); showLesson(b.dataset.lessonGo); window.scrollTo({ top: $('#learn').offsetTop - 60, behavior: 'smooth' }); });
  }
  function prevNext(id) {
    const i = LESSONS.findIndex(l => l.id === id); let h = '';
    if (i > 0) h += `<button class="btn ghost" data-lesson-go="${LESSONS[i - 1].id}">← ${L('上一節', 'Prev')}</button>`;
    if (i < LESSONS.length - 1) h += `<button class="btn" data-lesson-go="${LESSONS[i + 1].id}">${L('下一節', 'Next')} →</button>`;
    else h += `<button class="btn o" data-go="lab">🧪 ${L('前往實驗室', 'Go to labs')}</button>`;
    return h;
  }
  function buildLessonSweep(box) {
    box.innerHTML = `<div class="lab"><div class="plotbox"></div><div class="ctrl"><label>k <input type="range" min="-2" max="14" step="0.1" value="7" id="lsK"><output id="lsKo">7</output></label><div class="readout" id="lsR"></div></div></div>`;
    const svg = svgEl(); $('.plotbox', box).appendChild(svg);
    const P = new Plot(svg, { W: 460, H: 380 });
    const pr = PRESETS.text;
    const draw = k => {
      P.setView(pr.view); P.base({ step: 1 });
      P.feasible(pr.cons);
      pr.cons.forEach((c, i) => P.line(c, { color: COLORS[i], label: eqText(c, '='), at: 0.85 - i * 0.15 }));
      P.line({ a: 1, b: 1, c: k }, { color: 'var(--orange)', w: 3.5, dash: '10 6', label: `x+y=${fmt(k, 1)}`, at: 0.1 });
      [['A', -2, 4], ['B', 10 / 3, 4 / 3], ['C', 6, 4]].forEach(([n, x, y]) => P.point(x, y, { color: (n === 'C' && k >= 9.95) || (n === 'A' && k <= 2.05) ? 'var(--red)' : 'var(--ink)', label: n, halo: (n === 'C' && Math.abs(k - 10) < 0.06) || (n === 'A' && Math.abs(k - 2) < 0.06) }));
      const hit = k >= 2 - 1e-9 && k <= 10 + 1e-9;
      $('#lsR', box).innerHTML = hit
        ? `<span class="good">✔ ${L('直線通過可行解區域', 'The line meets the region')}</span>：${L('其上的可行解都使', 'feasible points on it give')} <span class="m">x+y = ${fmt(k, 1)}</span>` + (Math.abs(k - 10) < 0.06 ? `<br>🎯 <b>${L('最大值 10（在 C(6, 4)）', 'Maximum 10 at C(6, 4)')}</b>` : Math.abs(k - 2) < 0.06 ? `<br>🎯 <b>${L('最小值 2（在 A(−2, 4)）', 'Minimum 2 at A(−2, 4)')}</b>` : '')
        : `<span class="badc">✘ ${L('直線沒有通過可行解區域', 'The line misses the region')}</span>（${k > 10 ? L('k＞10', 'k>10') : L('k＜2', 'k<2')}）`;
    };
    const inp = $('#lsK', box);
    inp.oninput = () => { const k = Math.round(+inp.value * 10) / 10; $('#lsKo', box).textContent = k; draw(k); sfx('tick'); };
    draw(7);
  }

  /* ======================= 實驗室 ======================= */
  const LABS = [
    { id: 'par', icon: '📏', t: T('平行直線系', 'Parallel family') },
    { id: 'half', icon: '🌗', t: T('半平面偵探', 'Half-plane detective') },
    { id: 'lp', icon: '🎯', t: T('線性規劃實驗室', 'LP Lab') },
    { id: 'dir', icon: '🧭', t: T('目標函數方向盤', 'Objective compass') },
    { id: 'sim', icon: '🏭', t: T('生產規劃模擬器', 'Production simulator') }
  ];
  let curLab = 'par';
  function labUsed(id) {
    if (!R.labs[id]) { R.labs[id] = { n: 0, first: Date.now() }; const lb = LABS.find(l => l.id === id); log('lab', T(`使用實驗室〈${lb.t.zh}〉`, `Used lab “${lb.t.en}”`)); }
    R.labs[id].n++; if (R.labs[id].n % 10 === 1) saveRec();
  }
  function renderLabs() {
    $('#lab').innerHTML = `<h2 class="sec"><span class="emo">🧪</span>${L('互動實驗室', 'Interactive labs')}</h2>
<p class="lead">${L('拖動滑桿、點擊或拖曳圖形上的點，親手「看見」線性規劃的數學原理。', 'Drag sliders and points to see the mathematics of linear programming.')}</p>
<div class="subtabs" id="labTabs">${LABS.map(l => `<button type="button" data-lab="${l.id}" aria-selected="${l.id === curLab}">${l.icon} ${tr(l.t)}</button>`).join('')}</div>
<div id="labBody" class="card"></div>`;
    showLab(curLab);
  }
  function showLab(id) {
    curLab = id;
    $$('#labTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.lab === id));
    const box = $('#labBody'); box.innerHTML = '';
    ({ par: labPar, half: labHalf, lp: labLP, dir: labDir, sim: labSim })[id](box);
  }

  /* ---- Lab 1：平行直線系 ---- */
  const LP1 = { a: 1, b: 1, c: 2, play: null };
  function labPar(box) {
    box.innerHTML = `<h3 style="margin-top:0">📏 ${L('平行直線系：只改常數項，直線會怎麼動？', 'Change only the constant — how does the line move?')}</h3>
<div class="lab"><div class="plotbox"></div><div class="ctrl">
<label>a <input type="range" id="p_a" min="-4" max="4" step="1" value="${LP1.a}"><output id="p_ao"></output></label>
<label>b <input type="range" id="p_b" min="-4" max="4" step="1" value="${LP1.b}"><output id="p_bo"></output></label>
<label>${L('常數 c', 'constant c')} <input type="range" id="p_c" min="-10" max="10" step="1" value="${LP1.c}"><output id="p_co"></output></label>
<div class="readout" id="p_r"></div>
<div class="row"><button class="btn" id="p_play">▶ ${L('平移動畫', 'Animate')}</button><button class="btn ghost" id="p_reset">↺ ${L('重設', 'Reset')}</button></div>
<div class="aid" data-label="💡 ${L('觀察重點', 'Look for')}">${L('固定 a、b 只改 c：所有直線都平行（灰色線）；c 改變時截距跟著改變。改 a 或 b 則斜率改變，換成另一個平行直線系。', 'Fix a, b and vary c: all lines (grey) are parallel and the intercepts change. Changing a or b changes the slope — a different family.')}</div>
</div></div>`;
    const svg = svgEl(); $('.plotbox', box).appendChild(svg);
    const P = new Plot(svg, { W: 480, H: 480, view: { xmin: -8, xmax: 8, ymin: -8, ymax: 8 } });
    const draw = () => {
      if (LP1.a === 0 && LP1.b === 0) LP1.b = 1;
      const { a, b, c } = LP1;
      P.base({ step: 1, every: 2 });
      for (let k = -10; k <= 10; k += 2) if (k !== c) P.line({ a, b, c: k }, { color: 'var(--ink2)', w: 1.2, opacity: 0.35 });
      P.line({ a, b, c: 0 }, { color: 'var(--purple)', w: 2, dash: '6 6', label: 'L₀：' + eqText({ a, b, c: 0 }), at: 0.95 });
      P.line({ a, b, c }, { color: 'var(--orange)', w: 4, label: eqText({ a, b, c }), at: 0.75 });
      let xi = '—', yi = '—';
      if (a !== 0) { xi = fmt(c / a); if (Math.abs(c / a) <= 8) P.point(c / a, 0, { color: 'var(--blue)', label: `(${xi}, 0)`, dy: 18, size: 13 }); }
      if (b !== 0) { yi = fmt(c / b); if (Math.abs(c / b) <= 8) P.point(0, c / b, { color: 'var(--green)', label: `(0, ${yi})`, size: 13 }); }
      const slope = b === 0 ? L('不存在（鉛直線）', 'undefined (vertical)') : fmt(-a / b);
      $('#p_ao').textContent = a; $('#p_bo').textContent = b; $('#p_co').textContent = c;
      $('#p_a').value = a; $('#p_b').value = b; $('#p_c').value = c;
      $('#p_r').innerHTML = `<div class="big m">${eqText({ a, b, c })}</div>${L('斜率', 'Slope')} <b>${slope}</b>　｜　${L('x 截距', 'x-int')} <b>${xi}</b>　｜　${L('y 截距', 'y-int')} <b>${yi}</b>
      <br><small>${L('與 L₀ 比較：常數項由 0 變為 ', 'Compared with L₀: constant 0 → ')}${c}${b !== 0 ? L('，直線向' + (c / b > 0 ? '上' : c / b < 0 ? '下' : '') + '平移 ' + fmt(Math.abs(c / b)) + ' 單位', ', shifted ' + (c / b > 0 ? 'up' : 'down') + ' by ' + fmt(Math.abs(c / b))) : ''}${a !== 0 ? L('（相當於向' + (c / a > 0 ? '右' : c / a < 0 ? '左' : '') + '平移 ' + fmt(Math.abs(c / a)) + ' 單位）', ' (= ' + (c / a > 0 ? 'right' : 'left') + ' by ' + fmt(Math.abs(c / a)) + ')') : ''}</small>`;
    };
    ['a', 'b', 'c'].forEach(k => $('#p_' + k).oninput = e => { LP1[k] = +e.target.value; draw(); sfx('tick'); labUsed('par'); });
    $('#p_play').onclick = () => {
      if (LP1.play) { clearInterval(LP1.play); LP1.play = null; $('#p_play').textContent = '▶ ' + L('平移動畫', 'Animate'); return; }
      let dir = 1; LP1.c = -10; labUsed('par');
      $('#p_play').textContent = '⏸ ' + L('暫停', 'Pause');
      LP1.play = setInterval(() => { if (!document.body.contains(box) || curLab !== 'par') { clearInterval(LP1.play); LP1.play = null; return; } LP1.c += dir; if (LP1.c >= 10 || LP1.c <= -10) dir = -dir; draw(); sfx('tick'); }, 260);
    };
    $('#p_reset').onclick = () => { Object.assign(LP1, { a: 1, b: 1, c: 2 }); draw(); sfx('click'); };
    draw();
  }

  /* ---- Lab 2：半平面 ---- */
  const LH = { a: 1, b: 1, c: 2, op: '<', P: { x: 3, y: -1 }, hide: false, tries: 0 };
  function labHalf(box) {
    box.innerHTML = `<h3 style="margin-top:0">🌗 ${L('半平面偵探：拖曳點 P，判斷它在不在圖形上', 'Drag P: is it in the graph?')}</h3>
<div class="lab"><div class="plotbox"></div><div class="ctrl">
<div class="row"><select id="h_op" aria-label="op"><option value="<">＜</option><option value="<=">≤</option><option value=">">＞</option><option value=">=">≥</option></select>
<label class="chip"><input type="checkbox" id="h_hide"> ${L('隱藏著色（先自己猜）', 'Hide shading (guess first)')}</label></div>
<label>a <input type="range" id="h_a" min="-4" max="4" step="1"><output id="h_ao"></output></label>
<label>b <input type="range" id="h_b" min="-4" max="4" step="1"><output id="h_bo"></output></label>
<label>c <input type="range" id="h_c" min="-8" max="8" step="1"><output id="h_co"></output></label>
<div class="readout" id="h_r"></div>
<div class="row"><button class="btn g" id="h_o">🎯 ${L('原點測試', 'Origin test')}</button><button class="btn ghost" id="h_rand">🎲 ${L('隨機點', 'Random point')}</button></div>
<p class="lead" style="font-size:.92rem">👆 ${L('在圖上點擊或拖曳即可移動 P（每 0.5 單位對齊）。', 'Tap or drag on the graph to move P (snaps to 0.5).')}</p>
</div></div>`;
    const svg = svgEl(); $('.plotbox', box).appendChild(svg);
    const P = new Plot(svg, { W: 480, H: 480, view: { xmin: -6, xmax: 6, ymin: -6, ymax: 6 } });
    const draw = () => {
      if (LH.a === 0 && LH.b === 0) LH.b = 1;
      const con = { a: LH.a, b: LH.b, c: LH.c, op: LH.op };
      P.base({ step: 1 });
      if (!LH.hide) P.halfplane(con, { fill: 'var(--region)' });
      P.line(con, { color: 'var(--blue)', w: 3, label: eqText({ a: LH.a, b: LH.b, c: LH.c }), at: 0.9 });
      const v = LH.a * LH.P.x + LH.b * LH.P.y, ok = LP.satisfies(con, LH.P);
      P.point(LH.P.x, LH.P.y, { color: ok ? 'var(--green)' : 'var(--red)', r: 9, halo: true, label: `P${pt(LH.P)}`, size: 14 });
      const OPS = { '<': '＜', '<=': '≤', '>': '＞', '>=': '≥' };
      ['a', 'b', 'c'].forEach(k => { $('#h_' + k).value = LH[k]; $('#h_' + k + 'o').textContent = LH[k]; });
      $('#h_op').value = LH.op; $('#h_hide').checked = LH.hide;
      const through0 = LH.c === 0;
      $('#h_r').innerHTML = `<div class="big m">${eqText({ a: LH.a, b: LH.b, c: LH.c }, OPS[LH.op])}</div>
${L('界線', 'Boundary')}：<b>${LH.op.length === 2 ? L('實線（含等號）', 'solid (includes =)') : L('虛線（不含等號）', 'dashed (strict)')}</b><br>
${L('代入 P', 'Substitute P')}：<span class="m">${fmt(LH.a)}·(${fmt(LH.P.x)}) + ${fmt(LH.b)}·(${fmt(LH.P.y)}) = ${fmt(v)}</span>，<span class="m">${fmt(v)} ${OPS[LH.op]} ${LH.c}</span>
<br><span class="${ok ? 'good' : 'badc'}" style="font-size:1.1rem">${ok ? '✔ ' + L('成立 → P 在圖形上', 'true → P is in the graph') : '✘ ' + L('不成立 → P 不在圖形上', 'false → P is not in the graph')}</span>
${through0 ? `<br><small>⚠️ ${L('此直線通過原點，請改用 (1, 0) 或 (0, 1) 測試。', 'The line passes through the origin — test (1,0) or (0,1) instead.')}</small>` : ''}`;
    };
    ['a', 'b', 'c'].forEach(k => $('#h_' + k).oninput = e => { LH[k] = +e.target.value; draw(); sfx('tick'); labUsed('half'); });
    $('#h_op').onchange = e => { LH.op = e.target.value; draw(); sfx('click'); labUsed('half'); };
    $('#h_hide').onchange = e => { LH.hide = e.target.checked; draw(); sfx('click'); };
    $('#h_o').onclick = () => { LH.P = LH.c === 0 ? (LH.a !== 0 ? { x: 1, y: 0 } : { x: 0, y: 1 }) : { x: 0, y: 0 }; draw(); sfx('pop'); labUsed('half'); };
    $('#h_rand').onclick = () => { LH.P = { x: rnd(-10, 10) / 2, y: rnd(-10, 10) / 2 }; draw(); sfx('pop'); labUsed('half'); };
    let drag = false;
    const move = e => { const p = P.fromClient(e); const nx = Math.max(-6, Math.min(6, Math.round(p.x * 2) / 2)), ny = Math.max(-6, Math.min(6, Math.round(p.y * 2) / 2)); if (nx !== LH.P.x || ny !== LH.P.y) { LH.P = { x: nx, y: ny }; draw(); sfx('tick'); } };
    svg.addEventListener('pointerdown', e => { drag = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { } move(e); labUsed('half'); });
    svg.addEventListener('pointermove', e => { if (drag) move(e); });
    svg.addEventListener('pointerup', () => { drag = false; });
    svg.addEventListener('pointercancel', () => { drag = false; });
    draw();
  }

  /* ---- Lab 3：線性規劃實驗室 ---- */
  const LPS = { key: 'text', cons: null, on: null, obj: null, goal: 'max', k: null, lattice: false, grad: true, anim: null };
  function loadPreset(key) {
    const pr = PRESETS[key]; LPS.key = key;
    LPS.cons = pr.cons.map(c => Object.assign({}, c)); LPS.on = LPS.cons.map(() => true);
    LPS.obj = Object.assign({ r: 0 }, pr.obj); LPS.goal = pr.goal; LPS.view = Object.assign({}, pr.view);
    LPS.lattice = !!pr.lattice; LPS.k = null;
  }
  function openInLab(key) { loadPreset(key); curLab = 'lp'; go('lab'); renderLabs(); }
  function labLP(box) {
    if (!LPS.cons) loadPreset('text');
    const OPS = { '<=': '≤', '>=': '≥', '<': '＜', '>': '＞' };
    box.innerHTML = `<h3 style="margin-top:0">🎯 ${L('線性規劃實驗室：平行線法 × 頂點法', 'LP Lab: parallel-line × vertex method')}</h3>
<div class="row" style="margin-bottom:10px"><label for="lp_pre"><b>📂 ${L('題目', 'Problem')}</b></label>
<select id="lp_pre" style="flex:1;min-width:220px">${Object.keys(PRESETS).map(k => `<option value="${k}" ${k === LPS.key ? 'selected' : ''}>${esc(tr(PRESETS[k].name))}</option>`).join('')}<option value="custom" ${LPS.key === 'custom' ? 'selected' : ''}>✏️ ${L('自訂題目', 'Custom')}</option></select></div>
<div class="lab"><div class="plotbox"></div><div class="ctrl">
<div><b>① ${L('限制條件', 'Constraints')}</b> <small class="lead">${esc(tr((PRESETS[LPS.key] || {}).vars || ''))}</small><div class="chips" id="lp_cons" style="margin-top:6px"></div>
<details style="margin-top:8px"><summary style="cursor:pointer;font-weight:700">➕ ${L('新增限制式', 'Add constraint')}</summary>
<div class="row" style="margin-top:6px"><input type="number" id="lp_na" value="1" style="width:4.2em" aria-label="a">x +<input type="number" id="lp_nb" value="1" style="width:4.2em" aria-label="b">y
<select id="lp_nop">${Object.keys(OPS).map(o => `<option value="${o}">${OPS[o]}</option>`).join('')}</select><input type="number" id="lp_nc" value="4" style="width:5em" aria-label="c"><button class="btn" id="lp_add">${L('加入', 'Add')}</button></div></details></div>
<div><b>② ${L('目標函數', 'Objective')}</b><div class="row" style="margin-top:6px">P = <input type="number" id="lp_p" step="any" style="width:5.5em" aria-label="p">x + <input type="number" id="lp_q" step="any" style="width:5.5em" aria-label="q">y
<select id="lp_goal"><option value="max">${L('求最大值', 'maximize')}</option><option value="min">${L('求最小值', 'minimize')}</option></select></div></div>
<div><b>③ ${L('平行線法：移動 P = k', 'Parallel-line: move P = k')}</b><label style="grid-template-columns:2em 1fr 6em">k <input type="range" id="lp_k"><output id="lp_ko"></output></label></div>
<div class="row"><button class="btn o" id="lp_anim">▶ ${L('平行線法動畫', 'Sweep animation')}</button><button class="btn g" id="lp_vtx">🔺 ${L('頂點法', 'Vertex method')}</button>
<label class="chip"><input type="checkbox" id="lp_lat"> ${L('整數點', 'Lattice')}</label><label class="chip"><input type="checkbox" id="lp_grad"> ${L('增加方向', 'Direction')}</label></div>
<div class="readout" id="lp_r"></div>
<div class="tablewrap" id="lp_tab"></div>
</div></div>`;
    const svg = svgEl(); $('.plotbox', box).appendChild(svg);
    const P = new Plot(svg, { W: 500, H: 500 });
    const active = () => LPS.cons.filter((c, i) => LPS.on[i]);
    const f = p => LPS.obj.p * p.x + LPS.obj.q * p.y + (LPS.obj.r || 0);
    let sol = null, kr = [0, 1], hiRows = null;
    function compute() {
      sol = LP.solve(active(), LPS.obj, LPS.goal);
      const v = LPS.view;
      const corners = [{ x: v.xmin, y: v.ymin }, { x: v.xmax, y: v.ymin }, { x: v.xmin, y: v.ymax }, { x: v.xmax, y: v.ymax }].map(f);
      kr = [Math.min(...corners), Math.max(...corners)];
      const kin = $('#lp_k', box); kin.min = kr[0]; kin.max = kr[1]; kin.step = (kr[1] - kr[0]) / 500 || 0.01;
      if (LPS.k == null || LPS.k < kr[0] || LPS.k > kr[1]) LPS.k = LPS.goal === 'max' ? kr[0] + (kr[1] - kr[0]) * 0.3 : kr[0] + (kr[1] - kr[0]) * 0.7;
      kin.value = LPS.k;
    }
    function lineSegInRegion(k) {
      const c = { a: LPS.obj.p, b: LPS.obj.q, c: k - (LPS.obj.r || 0) };
      const poly = LP.region(active().concat([Object.assign({ op: '<=' }, c), Object.assign({ op: '>=' }, c)]), LPS.view);
      if (!poly.length) return null;
      const dir = { x: -c.b, y: c.a };
      const ts = poly.map(p => p.x * dir.x + p.y * dir.y);
      const i0 = ts.indexOf(Math.min(...ts)), i1 = ts.indexOf(Math.max(...ts));
      return [poly[i0], poly[i1]];
    }
    function draw() {
      P.setView(LPS.view); P.base();
      const act = active();
      if (LP.region(act, LPS.view).length) P.feasible(act);
      LPS.cons.forEach((c, i) => { if (LPS.on[i] && !isAxisCon(c)) P.line(c, { color: COLORS[i % COLORS.length], label: eqText(c, '='), at: 0.86 - 0.14 * (i % 4), size: 13 }); });
      if (LPS.lattice) LPS.latN = P.lattice(act, { r: 3.5 });
      const k = LPS.k;
      const oc = { a: LPS.obj.p, b: LPS.obj.q, c: k - (LPS.obj.r || 0) };
      if (LPS.obj.p || LPS.obj.q) {
        P.line(oc, { color: 'var(--orange)', w: 3, dash: '10 7', label: `P = ${fmt(k, 1)}`, at: 0.12 });
        const seg = lineSegInRegion(k);
        if (seg) P.segment(seg[0], seg[1], { color: 'var(--red)', w: 6 });
      }
      if (LPS.grad && (LPS.obj.p || LPS.obj.q) && sol.verts.length) {
        const cx = sol.verts.reduce((s, p) => s + p.x, 0) / sol.verts.length, cy = sol.verts.reduce((s, p) => s + p.y, 0) / sol.verts.length;
        const sx = (LPS.view.xmax - LPS.view.xmin) / 440, sy = (LPS.view.ymax - LPS.view.ymin) / 440;
        const gx = LPS.obj.p / sx, gy = LPS.obj.q / sy, n = Math.hypot(gx, gy) || 1;
        P.arrow({ x: cx, y: cy }, { x: cx + gx / n * 60 * sx, y: cy + gy / n * 60 * sy }, { color: 'var(--purple)' });
      }
      sol.verts.forEach((v, i) => {
        const isOpt = hiRows ? hiRows.includes(i) : (sol.status === 'ok' && Math.abs(sol.vals[i] - sol.best) < 1e-6 * Math.max(1, Math.abs(sol.best)) && reached());
        P.point(v.x, v.y, { color: isOpt ? 'var(--red)' : 'var(--ink)', r: isOpt ? 8 : 5, halo: isOpt, label: pt(v), size: 13 });
      });
      $('#lp_ko', box).textContent = fmt(k, 2);
      readout();
    }
    function reached() { return sol.status === 'ok' && Math.abs(LPS.k - sol.best) <= (kr[1] - kr[0]) / 250; }
    function readout() {
      const act = active(), seg = lineSegInRegion(LPS.k);
      let h = `<div><b>${L('目前', 'Now')}</b> <span class="m">P = ${fmt(LPS.k, 2)}</span>：${seg ? `<span class="good">${L('直線通過可行解區域', 'meets the region')}</span>` : `<span class="badc">${L('直線不通過可行解區域', 'misses the region')}</span>`}</div>`;
      if (LPS.lattice) h += `<div>🔸 ${L('區域內整數點', 'Lattice points shown')}：<b>${LPS.latN || 0}</b></div>`;
      if (sol.status === 'empty') h += `<div class="badc">⚠️ ${L('沒有可行解（限制條件互相矛盾）', 'No feasible solution')}</div>`;
      else if (sol.status === 'unbounded') h += `<div>♾️ ${L('可行解區域在目標增加方向上無界：', 'Unbounded in the improving direction: ')}<b>${LPS.goal === 'max' ? L('沒有最大值', 'no maximum') : L('沒有最小值', 'no minimum')}</b></div>`;
      else if (reached()) h += `<div class="big">🎯 ${LPS.goal === 'max' ? L('最大值', 'Max') : L('最小值', 'Min')} = <span class="good">${fmt(sol.best, 2)}</span>${sol.opt.length > 1 ? L('（多重最佳解：整段邊界都是）', ' (multiple optima along an edge)') : L('，最佳解 ', ' at ') + pt(sol.opt[0])}</div>`;
      else h += `<div class="lead">${L('提示：往紫色箭頭方向移動 P = k 會使值變大。', 'Hint: moving along the purple arrow increases P.')}</div>`;
      $('#lp_r', box).innerHTML = h;
      const tab = $('#lp_tab', box);
      if (sol.verts.length && act.length) {
        const mx = Math.max(...sol.vals), mn = Math.min(...sol.vals);
        tab.innerHTML = `<table class="t"><tr><th>${L('頂點', 'Vertex')}</th><th>P = ${esc(objText())}</th></tr>` +
          sol.verts.map((v, i) => `<tr class="${hiRows && hiRows.includes(i) ? (LPS.goal === 'max' ? 'hi' : 'lo') : ''}"><td class="m">${pt(v)}</td><td>${fmt(sol.vals[i], 2)}${sol.vals[i] === mx ? ' ⬆' : ''}${sol.vals[i] === mn ? ' ⬇' : ''}</td></tr>`).join('') + '</table>';
      } else tab.innerHTML = '';
    }
    const objText = () => eqText({ a: LPS.obj.p, b: LPS.obj.q, c: 0 }).replace(/ ＝ 0$/, '') + (LPS.obj.r ? ' + ' + fmt(LPS.obj.r) : '');
    function renderCons() {
      const OPS2 = { '<=': '≤', '>=': '≥', '<': '＜', '>': '＞' };
      $('#lp_cons', box).innerHTML = LPS.cons.map((c, i) => `<span class="chip"><input type="checkbox" data-i="${i}" ${LPS.on[i] ? 'checked' : ''} aria-label="toggle"><span class="sw" style="background:${COLORS[i % COLORS.length]}"></span><span class="m">${eqText(c, OPS2[c.op])}</span><button data-del="${i}" aria-label="delete" title="${L('刪除', 'Delete')}">✕</button></span>`).join('');
      $$('#lp_cons input', box).forEach(inp => inp.onchange = () => { LPS.on[+inp.dataset.i] = inp.checked; hiRows = null; compute(); draw(); sfx('click'); labUsed('lp'); });
      $$('#lp_cons [data-del]', box).forEach(b => b.onclick = () => { const i = +b.dataset.del; LPS.cons.splice(i, 1); LPS.on.splice(i, 1); LPS.key = 'custom'; $('#lp_pre', box).value = 'custom'; hiRows = null; renderCons(); compute(); draw(); sfx('pop'); });
    }
    function syncInputs() { $('#lp_p', box).value = LPS.obj.p; $('#lp_q', box).value = LPS.obj.q; $('#lp_goal', box).value = LPS.goal; $('#lp_lat', box).checked = LPS.lattice; $('#lp_grad', box).checked = LPS.grad; }
    $('#lp_pre', box).onchange = e => {
      const v = e.target.value; stopAnim();
      if (v === 'custom') { LPS.key = 'custom'; LPS.cons = [{ a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }]; LPS.on = [true, true]; LPS.obj = { p: 1, q: 1, r: 0 }; LPS.view = { xmin: -2, xmax: 10, ymin: -2, ymax: 10 }; LPS.k = null; }
      else loadPreset(v);
      hiRows = null; labUsed('lp'); sfx('whoosh'); labLP(box);
    };
    $('#lp_add', box).onclick = () => {
      const a = parseNum($('#lp_na', box).value), b = parseNum($('#lp_nb', box).value), c = parseNum($('#lp_nc', box).value), op = $('#lp_nop', box).value;
      if (!isFinite(a) || !isFinite(b) || !isFinite(c) || (a === 0 && b === 0)) { toast(L('請輸入有效的係數', 'Please enter valid coefficients')); sfx('bad'); return; }
      LPS.cons.push({ a, b, c, op }); LPS.on.push(true); LPS.key = 'custom'; $('#lp_pre', box).value = 'custom';
      if (LPS.cons.length === 3 && LPS.view.xmax === 10) {
        const vs = LP.vertices(LPS.cons); if (vs.length) { const mx = Math.max(...vs.map(v => Math.max(Math.abs(v.x), Math.abs(v.y)))); const m = Math.max(6, Math.ceil(mx * 1.25)); LPS.view = { xmin: -m * 0.15, xmax: m, ymin: -m * 0.15, ymax: m }; }
      }
      hiRows = null; renderCons(); compute(); draw(); sfx('pop'); labUsed('lp');
      log('lab', T('自訂限制式 ' + eqText({ a, b, c }, ({ '<=': '≤', '>=': '≥', '<': '＜', '>': '＞' })[op]), 'Added constraint'));
    };
    ['p', 'q'].forEach(k => $('#lp_' + k, box).oninput = e => { const v = parseNum(e.target.value); if (isFinite(v)) { LPS.obj[k] = v; LPS.k = null; hiRows = null; compute(); draw(); labUsed('lp'); } });
    $('#lp_goal', box).onchange = e => { LPS.goal = e.target.value; hiRows = null; compute(); draw(); sfx('click'); };
    $('#lp_k', box).oninput = e => { stopAnim(); LPS.k = +e.target.value; hiRows = null; draw(); sfx('tick'); labUsed('lp'); if (reached()) sfx('ok'); };
    $('#lp_lat', box).onchange = e => { LPS.lattice = e.target.checked; draw(); sfx('click'); };
    $('#lp_grad', box).onchange = e => { LPS.grad = e.target.checked; draw(); sfx('click'); };
    function stopAnim() { if (LPS.anim) { cancelAnimationFrame(LPS.anim); LPS.anim = null; } }
    $('#lp_anim', box).onclick = () => {
      stopAnim(); hiRows = null; labUsed('lp');
      if (sol.status === 'empty') { toast(L('沒有可行解', 'No feasible solution')); return; }
      const start = LPS.goal === 'max' ? kr[0] : kr[1];
      const end = sol.status === 'ok' ? sol.best : (LPS.goal === 'max' ? kr[1] : kr[0]);
      const t0 = performance.now(), dur = 2600;
      const step = now => {
        const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        LPS.k = start + (end - start) * e; $('#lp_k', box).value = LPS.k; draw(); sfx('tick');
        if (t < 1 && document.body.contains(box)) LPS.anim = requestAnimationFrame(step);
        else { LPS.anim = null; if (sol.status === 'ok') { sfx('win'); log('lab', T(`平行線法求得 ${LPS.goal === 'max' ? '最大值' : '最小值'} ${fmt(sol.best, 2)}（${tr(PRESETS[LPS.key] ? PRESETS[LPS.key].name : T('自訂', 'custom'))}）`, `Sweep found ${LPS.goal} ${fmt(sol.best, 2)}`)); } else sfx('bad'); }
      };
      LPS.anim = requestAnimationFrame(step);
    };
    $('#lp_vtx', box).onclick = () => {
      stopAnim(); labUsed('lp');
      if (!sol.verts.length) { toast(L('沒有頂點可代入', 'No vertices')); return; }
      let i = 0; hiRows = [];
      const iv = setInterval(() => {
        if (!document.body.contains(box)) { clearInterval(iv); return; }
        if (i < sol.verts.length) { hiRows = [i]; draw(); sfx('pop'); i++; }
        else {
          clearInterval(iv);
          if (sol.status === 'ok') { hiRows = sol.verts.map((v, j) => j).filter(j => Math.abs(sol.vals[j] - sol.best) < 1e-6 * Math.max(1, Math.abs(sol.best))); LPS.k = sol.best; $('#lp_k', box).value = LPS.k; draw(); sfx('win'); }
          else { hiRows = null; draw(); toast(L('區域無界：頂點法前要先確認極值存在！', 'Unbounded: check that the optimum exists first!')); sfx('bad'); }
        }
      }, 650);
    };
    syncInputs(); renderCons(); compute(); draw();
  }

  /* ---- Lab 4：目標函數方向盤 ---- */
  const LD = { key: 'ex4', th: 45, play: null };
  function labDir(box) {
    const keys = ['ex4', 'text', 't5', 'h10', 'ex5'];
    box.innerHTML = `<h3 style="margin-top:0">🧭 ${L('目標函數方向盤：方向一變，最佳頂點就跟著換！', 'Rotate the objective — watch the optimal vertex change!')}</h3>
<div class="lab"><div class="plotbox"></div><div class="ctrl">
<select id="d_pre">${keys.map(k => `<option value="${k}" ${k === LD.key ? 'selected' : ''}>${esc(tr(PRESETS[k].name))}</option>`).join('')}</select>
<label>${L('方向角 θ', 'Angle θ')} <input type="range" id="d_th" min="0" max="359" step="1" value="${LD.th}"><output id="d_tho"></output></label>
<div class="readout" id="d_r"></div>
<div class="row"><button class="btn" id="d_play">▶ ${L('自動旋轉', 'Auto rotate')}</button></div>
<div class="aid" data-label="💡 ${L('觀察重點', 'Look for')}">${L('目標函數 P = px + qy 的值沿紫色箭頭 (p, q) 方向增加。等值線（橘色）與箭頭垂直。當等值線與某條邊界平行時，整段邊都是最佳解（多重最佳解）。', 'P = px + qy increases along the purple arrow (p, q); level lines (orange) are perpendicular to it. When a level line is parallel to an edge, the whole edge is optimal.')}</div>
</div></div>`;
    const svg = svgEl(); $('.plotbox', box).appendChild(svg);
    const P = new Plot(svg, { W: 480, H: 480 });
    const draw = () => {
      const pr = PRESETS[LD.key];
      const th = LD.th * Math.PI / 180;
      let p = Math.round(Math.cos(th) * 100) / 100, q = Math.round(Math.sin(th) * 100) / 100;
      P.setView(pr.view); P.base();
      P.feasible(pr.cons);
      pr.cons.forEach((c, i) => { if (!isAxisCon(c)) P.line(c, { color: COLORS[i % COLORS.length], w: 2, label: eqText(c, '='), at: 0.85 - 0.15 * (i % 3), size: 12 }); });
      const mx = LP.solve(pr.cons, { p, q }, 'max'), mn = LP.solve(pr.cons, { p, q }, 'min');
      const vs = LP.vertices(pr.cons);
      const cx = vs.reduce((s, v) => s + v.x, 0) / vs.length, cy = vs.reduce((s, v) => s + v.y, 0) / vs.length;
      const sx = (pr.view.xmax - pr.view.xmin) / 440, sy = (pr.view.ymax - pr.view.ymin) / 440;
      // 方向以螢幕座標計算，讓箭頭角度與 θ 一致
      const ux = Math.cos(th), uy = Math.sin(th);
      p = Math.round(ux / sx * 1000) / 1000; q = Math.round(uy / sy * 1000) / 1000;
      const mx2 = LP.solve(pr.cons, { p, q }, 'max'), mn2 = LP.solve(pr.cons, { p, q }, 'min');
      void mx; void mn;
      if (mx2.status === 'ok') P.line({ a: p, b: q, c: mx2.best }, { color: 'var(--orange)', w: 3, dash: '9 6' });
      if (mn2.status === 'ok') P.line({ a: p, b: q, c: mn2.best }, { color: 'var(--blue)', w: 2.5, dash: '4 6' });
      P.arrow({ x: cx, y: cy }, { x: cx + ux * 70 * sx, y: cy + uy * 70 * sy }, { color: 'var(--purple)', w: 4 });
      vs.forEach(v => {
        const isMax = mx2.status === 'ok' && mx2.opt.some(o => Math.hypot(o.x - v.x, o.y - v.y) < 1e-6);
        const isMin = mn2.status === 'ok' && mn2.opt.some(o => Math.hypot(o.x - v.x, o.y - v.y) < 1e-6);
        P.point(v.x, v.y, { color: isMax ? 'var(--red)' : isMin ? 'var(--blue)' : 'var(--ink)', r: isMax || isMin ? 8 : 5, halo: isMax || isMin, label: pt(v), size: 12 });
      });
      // 以實際座標顯示的係數（取兩位小數）
      const pd = Math.round(p * sx * 100) / 100, qd = Math.round(q * sy * 100) / 100;
      $('#d_tho', box).textContent = LD.th + '°';
      const show = s => s.status === 'ok' ? (s.opt.length > 1 ? L('整段邊 ', 'edge ') + s.opt.map(pt).join('—') : pt(s.opt[0])) : L('不存在（無界）', 'none (unbounded)');
      $('#d_r', box).innerHTML = `<div class="m big">P ∝ ${fmt(pd, 2)}x ${qd >= 0 ? '+' : '−'} ${fmt(Math.abs(qd), 2)}y</div>
🔴 ${L('最大值發生在', 'Max at')}：<b>${show(mx2)}</b><br>🔵 ${L('最小值發生在', 'Min at')}：<b>${show(mn2)}</b>`;
    };
    $('#d_pre', box).onchange = e => { LD.key = e.target.value; draw(); sfx('whoosh'); labUsed('dir'); };
    $('#d_th', box).oninput = e => { LD.th = +e.target.value; draw(); sfx('tick'); labUsed('dir'); };
    $('#d_play', box).onclick = () => {
      if (LD.play) { clearInterval(LD.play); LD.play = null; $('#d_play', box).textContent = '▶ ' + L('自動旋轉', 'Auto rotate'); return; }
      labUsed('dir'); $('#d_play', box).textContent = '⏸ ' + L('暫停', 'Pause');
      LD.play = setInterval(() => { if (!document.body.contains(box) || curLab !== 'dir') { clearInterval(LD.play); LD.play = null; return; } LD.th = (LD.th + 2) % 360; $('#d_th', box).value = LD.th; draw(); }, 60);
    };
    draw();
  }

  /* ---- Lab 5：生產規劃模擬器 ---- */
  const LSIM = { id: 't5', x: 0, y: 0, best: null, tries: 0 };
  function labSim(box) {
    const sc = SCENES.find(s => s.id === LSIM.id) || SCENES[0];
    box.innerHTML = `<h3 style="margin-top:0">🏭 ${L('生產規劃模擬器：你能找到最佳方案嗎？', 'Can you find the best plan?')}</h3>
<div class="subtabs">${SCENES.map(s => `<button type="button" data-sc="${s.id}" aria-selected="${s.id === sc.id}">${esc(tr(s.title))}</button>`).join('')}</div>
<p>${esc(tr(sc.story))}</p>
<div class="lab"><div class="plotbox"></div><div class="ctrl">
<label>${esc(tr(sc.x))} <input type="range" id="s_x" min="0" max="${sc.xmax}" step="${sc.step}"><output id="s_xo"></output></label>
<label>${esc(tr(sc.y))} <input type="range" id="s_y" min="0" max="${sc.ymax}" step="${sc.step}"><output id="s_yo"></output></label>
<div id="s_res"></div>
<div class="readout" id="s_r"></div>
<div class="row"><button class="btn g" id="s_sub">📌 ${L('提交這個方案', 'Submit plan')}</button><button class="btn ghost" id="s_ans">💡 ${L('看最佳解', 'Show optimum')}</button></div>
<p class="lead" style="font-size:.9rem">👆 ${L('也可以直接在圖上點擊或拖曳選擇 (x, y)。', 'You can also tap/drag on the graph.')}</p>
</div></div>`;
    const svg = svgEl(); $('.plotbox', box).appendChild(svg);
    const P = new Plot(svg, { W: 480, H: 480 });
    const pr = PRESETS[sc.preset];
    const cons = sc.res.map(r => ({ a: r.a, b: r.b, c: r.c, op: r.op })).concat([{ a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }]);
    const sol = LP.solve(cons, sc.obj, sc.goal);
    let showAns = false;
    const draw = () => {
      P.setView(pr.view); P.base();
      P.feasible(cons);
      sc.res.forEach((r, i) => P.line(r, { color: COLORS[i], label: eqText(r, '='), at: 0.8 - 0.15 * i, size: 13 }));
      const val = sc.obj.p * LSIM.x + sc.obj.q * LSIM.y;
      P.line({ a: sc.obj.p, b: sc.obj.q, c: val }, { color: 'var(--orange)', dash: '8 6', w: 2 });
      if (showAns && sol.status === 'ok') sol.opt.forEach(o => P.point(o.x, o.y, { color: 'var(--red)', r: 8, halo: true, label: '★ ' + pt(o), size: 13 }));
      const ok = LP.feasible(cons, LSIM);
      P.point(LSIM.x, LSIM.y, { color: ok ? 'var(--green)' : 'var(--red)', r: 9, halo: true, label: pt(LSIM), size: 13 });
      $('#s_x', box).value = LSIM.x; $('#s_y', box).value = LSIM.y; $('#s_xo', box).textContent = fmt(LSIM.x); $('#s_yo', box).textContent = fmt(LSIM.y);
      $('#s_res', box).innerHTML = sc.res.map(r => {
        const used = r.a * LSIM.x + r.b * LSIM.y, sat = LP.satisfies(r, LSIM);
        const pct = Math.min(100, used / r.c * 100);
        return `<div class="res"><div class="lbl"><span>${esc(tr(r.n))}</span><span>${fmt(used, 1)} ${r.op === '<=' ? '≤' : '≥'} ${r.c} ${sat ? '✅' : '❌'}</span></div><div class="bar ${sat ? '' : 'over'}"><i style="width:${pct}%"></i></div></div>`;
      }).join('');
      $('#s_r', box).innerHTML = `${esc(tr(sc.unit))}：<span class="big">${fmt(val, 2)}</span> ${ok ? '<span class="good">✔ ' + L('可行', 'feasible') + '</span>' : '<span class="badc">✘ ' + L('不可行（違反限制）', 'infeasible') + '</span>'}` +
        (LSIM.best != null ? `<br>🏅 ${L('你的最佳紀錄', 'Your best')}：<b>${fmt(LSIM.best, 2)}</b>` : '') +
        (showAns && sol.status === 'ok' ? `<br>★ ${L('理論最佳', 'Optimum')}：<b>${fmt(sol.best, 2)}</b>` : '');
    };
    $$('[data-sc]', box).forEach(b => b.onclick = () => { LSIM.id = b.dataset.sc; LSIM.x = 0; LSIM.y = 0; LSIM.best = null; sfx('whoosh'); labSim(box); });
    $('#s_x', box).oninput = e => { LSIM.x = +e.target.value; draw(); sfx('tick'); labUsed('sim'); };
    $('#s_y', box).oninput = e => { LSIM.y = +e.target.value; draw(); sfx('tick'); labUsed('sim'); };
    let drag = false;
    const move = e => { const p = P.fromClient(e); const st = sc.step; LSIM.x = Math.max(0, Math.min(sc.xmax, Math.round(p.x / st) * st)); LSIM.y = Math.max(0, Math.min(sc.ymax, Math.round(p.y / st) * st)); draw(); sfx('tick'); };
    svg.addEventListener('pointerdown', e => { drag = true; try { svg.setPointerCapture(e.pointerId); } catch (er) { } move(e); labUsed('sim'); });
    svg.addEventListener('pointermove', e => { if (drag) move(e); });
    svg.addEventListener('pointerup', () => { drag = false; });
    $('#s_sub', box).onclick = () => {
      if (!LP.feasible(cons, LSIM)) { sfx('bad'); toast(L('這個方案違反限制條件！', 'This plan violates a constraint!')); return; }
      const val = sc.obj.p * LSIM.x + sc.obj.q * LSIM.y;
      if (LSIM.best == null || (sc.goal === 'max' ? val > LSIM.best : val < LSIM.best)) LSIM.best = val;
      const gap = sol.status === 'ok' ? Math.abs(val - sol.best) / Math.max(1, Math.abs(sol.best)) : 1;
      if (gap < 1e-6) { sfx('win'); confetti(); toast(L('🎉 完美！你找到最佳解了！', '🎉 Perfect! Optimal plan!')); }
      else { sfx('ok'); toast(L(`差距約 ${(gap * 100).toFixed(1)}%，再試試頂點！`, `${(gap * 100).toFixed(1)}% away — try a vertex!`)); }
      log('sim', T(`模擬器〈${sc.title.zh}〉提交 ${pt(LSIM)}，值 ${fmt(val, 2)}${gap < 1e-6 ? '（最佳解！）' : ''}`, `Simulator ${sc.id}: ${pt(LSIM)} → ${fmt(val, 2)}`));
      draw();
    };
    $('#s_ans', box).onclick = () => { showAns = !showAns; draw(); sfx('pop'); };
    draw();
  }

  /* ======================= 範例與習題 ======================= */
  let itemFilter = 'all';
  function renderItems() {
    const el = $('#examples');
    const cnt = k => ITEMS.filter(i => k === 'all' || i.kind === k).length;
    el.innerHTML = `<h2 class="sec"><span class="emo">📝</span>${L('原教材範例、隨堂練習與習題', 'Textbook examples, practice & exercises')}</h2>
<p class="lead">${L('例題附教材解答；隨堂練習與習題附「參考解答（教學補充）」。建議先自己作答，再一步步打開解答。', 'Examples include the textbook solutions; practice and exercises include reference solutions (teaching aids). Try first, then reveal step by step.')}</p>
<div class="subtabs" id="itemTabs">${['all', 'ex', 'try', 'hw'].map(k => `<button type="button" data-f="${k}" aria-selected="${k === itemFilter}">${k === 'all' ? ui('all') : ui('kind_' + k)} (${cnt(k)})</button>`).join('')}</div>
<div id="itemList"></div>`;
    const list = $('#itemList');
    ITEMS.filter(i => itemFilter === 'all' || i.kind === itemFilter).forEach(it => list.appendChild(itemCard(it)));
    $$('#itemTabs button').forEach(b => b.onclick = () => { itemFilter = b.dataset.f; sfx('click'); renderItems(); });
  }
  function itemCard(it) {
    const card = document.createElement('article');
    const rec = R.items[it.id];
    card.className = `qcard ${it.kind}${rec && rec.done ? ' done' : ''}`;
    const kindName = ui('kind_' + it.kind);
    card.innerHTML = `<header><span class="pill ${it.kind === 'ex' ? '' : it.kind === 'try' ? 'g' : 'o'}">${kindName} ${it.no}</span><h3>${esc(tr(it.tag))}${it.level ? ` <small class="pill v">${esc(tr(it.level))}</small>` : ''}</h3>${rec && rec.done ? '<span title="done">✅</span>' : ''}</header>
<div class="body"><div class="q">${md(it.q)}</div><div class="qfig"></div><div class="chk"></div>
<div class="sol"><p><b>${it.kind === 'ex' ? '📗 ' + ui('src_tag') : '📙 ' + ui('aid_tag')}</b></p>${it.steps.map((s, i) => `<div class="solstep" data-i="${i}">${md(s)}</div>`).join('')}<div class="solfig qfig"></div></div>
<div class="row"><button class="btn ghost b-next">${ui('show_sol')}</button><button class="btn ghost b-all">${ui('all_sol')}</button>${it.lab ? `<button class="btn o b-lab">${ui('open_lab')}</button>` : ''}<button class="btn g b-done">${rec && rec.done ? '✔ ' + ui('marked') : ui('mark_done')}</button></div></div>`;
    if (it.qfig) drawFig(it.qfig, $('.qfig', card));
    let shown = 0, figDrawn = false;
    const reveal = n => {
      const steps = $$('.solstep', card);
      shown = Math.min(steps.length, n);
      steps.forEach((s, i) => s.classList.toggle('show', i < shown));
      if (shown > 0 && it.fig && !figDrawn && it.fig !== it.qfig) { figDrawn = true; drawFig(it.fig, $('.solfig', card)); }
      $('.b-next', card).disabled = shown >= steps.length;
      $('.b-all', card).textContent = shown >= steps.length ? ui('hide_sol') : ui('all_sol');
    };
    $('.b-next', card).onclick = () => { reveal(shown + 1); sfx('pop'); if (shown === 1) log('item-view', T(`查看〈${kindName}${it.no}〉解答`, `Viewed solution ${it.id}`)); };
    $('.b-all', card).onclick = () => { const n = $$('.solstep', card).length; reveal(shown >= n ? 0 : n); sfx('click'); };
    if (it.lab) $('.b-lab', card).onclick = () => { sfx('click'); openInLab(it.lab); };
    $('.b-done', card).onclick = () => { markItem(it, null); sfx('win'); renderItemsKeep(); };
    if (it.check) buildCheck(it, $('.chk', card));
    return card;
  }
  function renderItemsKeep() { const y = window.scrollY; renderItems(); window.scrollTo(0, y); }
  function markItem(it, correct) {
    const prev = R.items[it.id] || {};
    R.items[it.id] = { done: true, correct: correct == null ? prev.correct : (prev.correct || correct), t: Date.now(), tries: (prev.tries || 0) + (correct == null ? 0 : 1) };
    log('item', T(`${correct == null ? '標記完成' : correct ? '答對' : '作答'}〈${UI.zh['kind_' + it.kind]}${it.no}〉`, `${correct == null ? 'Marked done' : correct ? 'Correct' : 'Answered'}: ${it.id}`));
  }
  function buildCheck(it, box) {
    const ck = it.check;
    if (ck.type === 'num') {
      box.innerHTML = `<div class="card soft" style="margin:8px 0"><b>✍️ ${L('作答', 'Your answer')}</b><div class="row" style="margin-top:6px">${ck.inputs.map((inp, i) => `<label class="row" style="gap:6px">${esc(tr(inp.label))} <input class="ans" type="text" inputmode="decimal" data-i="${i}" aria-label="${esc(tr(inp.label))}"></label>`).join('')}<button class="btn b-chk">${ui('check')}</button></div><div class="fb"></div></div>`;
      $('.b-chk', box).onclick = () => {
        const res = ck.inputs.map((inp, i) => near(parseNum($(`input[data-i="${i}"]`, box).value), inp.ans));
        const ok = res.every(Boolean);
        $$('input.ans', box).forEach((e, i) => e.style.borderColor = res[i] ? 'var(--green)' : 'var(--red)');
        const fb = $('.fb', box); fb.className = 'fb show ' + (ok ? 'ok' : 'no');
        fb.innerHTML = ok ? `🎉 <b>${ui('correct')}</b>` : `🤔 <b>${ui('wrong')}</b> ${L('可以打開「看下一步」取得提示。', 'Open “Next step” for a hint.')}`;
        if (!ok) { box.firstElementChild.classList.remove('shake'); void box.offsetWidth; box.firstElementChild.classList.add('shake'); }
        sfx(ok ? 'ok' : 'bad'); markItem(it, ok);
        if (ok) { const c = box.closest('.qcard'); c.classList.add('done'); $('.b-done', c).textContent = '✔ ' + ui('marked'); }
      };
    } else {
      box.innerHTML = `<div class="card soft" style="margin:8px 0"><b>✍️ ${L('選出答案', 'Choose')}</b><div class="opts">${ck.opts.map((o, i) => `<button type="button" class="opt" data-i="${i}">${esc(tr(o))}</button>`).join('')}</div><div class="fb"></div></div>`;
      $$('.opt', box).forEach(b => b.onclick = () => {
        const i = +b.dataset.i, ok = i === ck.a;
        $$('.opt', box).forEach(x => x.classList.remove('right', 'wrong'));
        b.classList.add(ok ? 'right' : 'wrong');
        const fb = $('.fb', box); fb.className = 'fb show ' + (ok ? 'ok' : 'no');
        fb.innerHTML = ok ? `🎉 <b>${ui('correct')}</b>` : `🤔 <b>${ui('wrong')}</b>`;
        sfx(ok ? 'ok' : 'bad'); markItem(it, ok);
        if (ok) { const c = box.closest('.qcard'); c.classList.add('done'); $('.b-done', c).textContent = '✔ ' + ui('marked'); }
      });
    }
  }

  /* ======================= 進階延伸 ======================= */
  function renderAdvanced() {
    const el = $('#advanced');
    el.innerHTML = `<h2 class="sec"><span class="emo">🚀</span>${L('進階與延伸學習', 'Advanced & extension')}</h2>
<p class="lead">${L('本頁內容為「教學補充」，用來加深理解，並非教材原文。', 'This page is a teaching supplement beyond the textbook.')}</p>
<div class="grid g2">
<div class="card"><h3>🏫 ${L('A1 章首問題：學期成績最多幾分？', 'A1 Chapter opener solved')}</h3>
<p>${md(L('限制 $0≤x≤100$，$0≤y≤100$，$x+y≤150$，目標函數 $P=0.3x+0.7y$。', 'Constraints $0≤x≤100$, $0≤y≤100$, $x+y≤150$; objective $P=0.3x+0.7y$.'))}</p>
<div class="tablewrap"><table class="t"><tr><th>${L('頂點', 'Vertex')}</th><td>(0,0)</td><td>(100,0)</td><td>(100,50)</td><td>(50,100)</td><td>(0,100)</td></tr><tr><th>P</th><td>0</td><td>30</td><td>65</td><td class="good">85</td><td>70</td></tr></table></div>
<p>${L('學期成績最多 <b>85 分</b>（平時 50 分、段考 100 分）。啟示：段考占比高，把分數放在段考最划算！', 'Maximum <b>85</b> at (50, 100): the heavier-weighted exam score should be as high as possible.')}</p>
<div class="qfig" data-fig="intro"></div><button class="btn o" data-open="intro">${ui('open_lab')}</button></div>

<div class="card"><h3>🔢 ${L('A2 整數最佳解 ≠ 四捨五入', 'A2 Integer optimum ≠ rounding')}</h3>
<p>${md(L('例題 5 的最佳解 $(\\frac{40}{7}, \\frac{90}{7})≈(5.71, 12.86)$。如果原料只能整公噸購買呢？', 'Example 5’s optimum is $(\\frac{40}{7}, \\frac{90}{7})≈(5.71, 12.86)$. What if only whole tons can be bought?'))}</p>
<ul><li>${md(L('四捨五入得 $(6, 13)$：$5·6+4·13=82>80$ ❌ 不可行！', 'Rounding gives $(6, 13)$: $5·6+4·13=82>80$ ❌ infeasible!'))}</li>
<li>${md(L('逐一檢查附近整數點：$(6,12)→294$、$(5,13)→281$、$(7,9)→283$、$(4,15)→280$。', 'Check nearby lattice points: $(6,12)→294$, $(5,13)→281$, $(7,9)→283$, $(4,15)→280$.'))}</li>
<li>${md(L('整數最佳解為 $(6, 12)$，精油 294 公斤。', 'Integer optimum $(6, 12)$: 294 kg.'))}</li></ul>
<div class="aid" data-label="💡">${L('整數規劃要在可行解區域內的「整數點」中找最佳者，不能直接把小數解四捨五入。可在實驗室勾選「整數點」觀察。', 'Search among lattice points inside the region; never just round. Tick “Lattice” in the LP Lab.')}</div></div>

<div class="card"><h3>♾️ ${L('A3 無界區域：極值一定存在嗎？', 'A3 Unbounded regions')}</h3>
<p>${md(L('例題 6 的可行解區域 $x+2y≥8$，$2x+y≥10$，$x,y≥0$ 向右上方無限延伸。', 'In Example 6 the region extends forever up-right.'))}</p>
<ul><li>${L('求成本<b>最小值</b>：平行線往左下移動會在 (4, 2) 停住 → 存在。', '<b>Minimum</b> cost: the line stops at (4, 2) → exists.')}</li>
<li>${L('若求<b>最大值</b>：直線可以一直往右上移動 → <b>不存在</b>。', '<b>Maximum</b>: the line can move forever → <b>does not exist</b>.')}</li></ul>
<div class="aid" data-label="💡">${L('區域無界時，頂點法算出的「最大」頂點值可能是錯的！先用平行線法確認極值存在。', 'With unbounded regions, the vertex method alone can be wrong — check existence first.')}</div>
<button class="btn o" data-open="ex6">${ui('open_lab')}</button></div>

<div class="card"><h3>🟰 ${L('A4 多重最佳解', 'A4 Multiple optimal solutions')}</h3>
<p>${md(L('當目標函數的等值線<b>平行於某一條邊界</b>，且這條邊正好是最佳位置時，整段邊上每一點都是最佳解。', 'If level lines are <b>parallel to an edge</b> that is optimal, every point on that edge is optimal.'))}</p>
<ul><li>${md(L('例題 4 區域上求 $2x+y$ 最大值：$(3,0)$ 與 $(2,2)$ 都得 6 → 線段上都是最佳解。', 'On Example 4’s region, $2x+y$: $(3,0)$ and $(2,2)$ both give 6.'))}</li>
<li>${md(L('習題 9 就是利用這個性質求出 $k=−\\frac{1}{2}$。', 'Exercise 9 uses this to get $k=−\\frac{1}{2}$.'))}</li></ul>
<button class="btn o" data-open="h9">${ui('open_lab')}</button></div>

<div class="card"><h3>📐 ${L('A5 斜率比較法：一眼看出最佳頂點', 'A5 Slope comparison')}</h3>
<p>${md(L('以例題 4 區域求 $P=px+qy$ 的最大值（$p,q>0$）。兩條斜邊斜率分別為 $−\\frac{1}{2}$（$x+2y=6$）與 $−2$（$2x+y=6$），目標函數斜率為 $−\\frac{p}{q}$：', 'Example 4 region, maximise $P=px+qy$ ($p,q>0$). Edge slopes: $−\\frac12$ and $−2$; objective slope $−\\frac pq$:'))}</p>
<div class="tablewrap"><table class="t"><tr><th>${L('條件', 'Condition')}</th><th>${L('最佳頂點', 'Optimal vertex')}</th></tr>
<tr><td>${md('$\\frac{p}{q}<\\frac{1}{2}$')}</td><td>C(0, 3)</td></tr><tr><td>${md('$\\frac{p}{q}=\\frac{1}{2}$')}</td><td>${L('線段 BC', 'edge BC')}</td></tr>
<tr><td>${md('$\\frac{1}{2}<\\frac{p}{q}<2$')}</td><td>B(2, 2)</td></tr><tr><td>${md('$\\frac{p}{q}=2$')}</td><td>${L('線段 AB', 'edge AB')}</td></tr><tr><td>${md('$\\frac{p}{q}>2$')}</td><td>A(3, 0)</td></tr></table></div>
<button class="btn" data-lab="dir">🧭 ${L('用方向盤驗證', 'Verify with the compass')}</button></div>

<div class="card"><h3>🌍 ${L('A6 從兩個變數到成千上萬個變數', 'A6 From 2 variables to thousands')}</h3>
<p>${L('真實世界的線性規劃常有成千上萬個變數，無法畫圖。1947 年丹齊格（George Dantzig）提出「單形法」：沿著可行區域的頂點一路往更好的頂點走——其實就是「頂點法」的高維版本！', 'Real LPs can have thousands of variables. In 1947 George Dantzig introduced the simplex method, which walks from vertex to better vertex — a high-dimensional vertex method!')}</p>
<p>${L('教材提到的坎拓羅維奇於 1975 年獲諾貝爾經濟學獎（與庫普曼斯共同獲得），表彰資源最適分配理論；李安鐵夫於 1973 年以投入產出分析獲諾貝爾經濟學獎。', 'Kantorovich shared the 1975 Nobel Prize in Economics (with Koopmans) for optimal resource allocation; Leontief received the 1973 prize for input–output analysis.')}</p>
<div class="chips">${['🚚 ' + L('物流路線', 'Logistics'), '✈️ ' + L('航班排班', 'Crew scheduling'), '🥗 ' + L('營養配方', 'Diet mixes'), '🏭 ' + L('生產排程', 'Production'), '📦 ' + L('庫存管理', 'Inventory'), '⚡ ' + L('電力調度', 'Power dispatch')].map(s => `<span class="chip" style="padding-right:12px">${s}</span>`).join('')}</div></div>
</div>
<h2 class="sec"><span class="emo">🧗</span>${L('延伸挑戰題', 'Challenge problems')}</h2>
<div id="advCh"></div>`;
    $$('[data-fig]', el).forEach(d => drawFig(d.dataset.fig, d));
    $$('[data-open]', el).forEach(b => b.onclick = () => { sfx('click'); openInLab(b.dataset.open); });
    $$('[data-lab]', el).forEach(b => b.onclick = () => { sfx('click'); curLab = b.dataset.lab; go('lab'); renderLabs(); });
    const CH = [
      { q: T('在 $x≥0$，$y≥0$，$x+y≤4$，$x+3y≤6$ 的可行解區域中，求 $3x+2y$ 的最大值。', 'On $x≥0$, $y≥0$, $x+y≤4$, $x+3y≤6$, maximise $3x+2y$.'), ans: 12,
        sol: T('頂點 $(0,0)$、$(4,0)$、$(3,1)$、$(0,2)$，代入得 0、12、11、4 → 最大值 12。', 'Vertices give 0, 12, 11, 4 → 12.') },
      { q: T('午餐有甲、乙兩種餐點：甲每份 20 元，含鈣 2 單位、鐵 1 單位；乙每份 30 元，含鈣 1 單位、鐵 3 單位。每天至少需鈣 8 單位、鐵 9 單位，最少要花多少元？', 'Meal A ($20): 2 calcium, 1 iron; meal B ($30): 1 calcium, 3 iron. Need ≥8 calcium and ≥9 iron. Minimum cost?'), ans: 120,
        sol: T('$2x+y≥8$，$x+3y≥9$，$x,y≥0$；頂點 $(0,8)→240$、$(3,2)→120$、$(9,0)→180$ → 最少 120 元。', 'Vertices: 240, 120, 180 → $120.') },
      { q: T('在例題 4 的可行解區域中，若目標函數 $ax+y$ 的最大值<b>只</b>發生在 $B(2, 2)$，求 $a$ 的範圍。請輸入 $a$ 的下界。', 'On Example 4’s region, $ax+y$ is maximised <b>only</b> at $B(2,2)$. Enter the lower bound of $a$.'), ans: 0.5,
        sol: T('需 $2a+2>3$（勝過 C）且 $2a+2>3a$（勝過 A）→ $\\frac{1}{2}<a<2$，下界為 $\\frac{1}{2}$。', 'Need $2a+2>3$ and $2a+2>3a$ → $\\frac12<a<2$.') }
    ];
    const box = $('#advCh');
    CH.forEach((c, i) => {
      const d = document.createElement('div'); d.className = 'qcard hw';
      d.innerHTML = `<header><span class="pill p">${L('挑戰', 'Challenge')} ${i + 1}</span><h3>⭐ ${'★'.repeat(i + 1)}</h3></header><div class="body"><p>${md(c.q)}</p>
<div class="row"><input class="ans" type="text" inputmode="decimal" aria-label="answer"><button class="btn b-c">${ui('check')}</button><button class="btn ghost b-s">${ui('all_sol')}</button></div><div class="fb"></div><div class="solstep">${md(c.sol)}</div></div>`;
      $('.b-c', d).onclick = () => { const ok = near(parseNum($('input', d).value), c.ans); const fb = $('.fb', d); fb.className = 'fb show ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? '🎉 ' + ui('correct') : '🤔 ' + ui('wrong'); sfx(ok ? 'win' : 'bad'); log('challenge', T(`挑戰題 ${i + 1} ${ok ? '答對' : '答錯'}`, `Challenge ${i + 1}: ${ok ? 'correct' : 'wrong'}`)); };
      $('.b-s', d).onclick = () => { $('.solstep', d).classList.toggle('show'); sfx('pop'); };
      box.appendChild(d);
    });
  }

  /* ======================= 練習（隨機產生） ======================= */
  const PTYPES = [
    { id: 'shift', icon: '↔️', t: T('直線平移', 'Line translation') },
    { id: 'intercept', icon: '📍', t: T('截距', 'Intercepts') },
    { id: 'half', icon: '🌗', t: T('點與半平面', 'Point vs half-plane') },
    { id: 'inter', icon: '✖️', t: T('求頂點（交點）', 'Find a vertex') },
    { id: 'vertex', icon: '🔺', t: T('頂點法求極值', 'Vertex method') },
    { id: 'model', icon: '🧾', t: T('情境列式', 'Modelling') }
  ];
  const PR = { type: 'mix', cur: null, answered: false, streak: 0 };
  const nz = (a, b) => { let v = 0; while (v === 0) v = rnd(a, b); return v; };
  function genQ(type) {
    if (type === 'mix') type = pick(PTYPES).id;
    const q = { type };
    if (type === 'shift') {
      const a = nz(-3, 3), b = nz(-3, 3), c = rnd(-6, 6), d = pick(['R', 'L', 'U', 'D']), h = rnd(1, 4);
      const nc = d === 'R' ? c + a * h : d === 'L' ? c - a * h : d === 'U' ? c + b * h : c - b * h;
      const dn = { R: T('向右', 'right'), L: T('向左', 'left'), U: T('向上', 'up'), D: T('向下', 'down') }[d];
      q.text = T(`直線 $${eqText({ a, b, c })}$ ${dn.zh}平移 ${h} 單位後，方程式為 $${eqText({ a, b, c: 0 }).replace(/ ＝ 0$/, '')} ＝ □$，求 □。`, `Shift $${eqText({ a, b, c })}$ ${dn.en} by ${h}. The result is $${eqText({ a, b, c: 0 }).replace(/ ＝ 0$/, '')} ＝ □$. Find □.`);
      q.inputs = [{ label: '□ =', ans: nc }];
      const rep = d === 'R' ? `x−${h}` : d === 'L' ? `x+${h}` : d === 'U' ? `y−${h}` : `y+${h}`;
      q.hint = T(`${dn.zh}平移：以 ${rep} 代替 ${d === 'R' || d === 'L' ? 'x' : 'y'}。`, `Replace ${d === 'R' || d === 'L' ? 'x' : 'y'} by ${rep}.`);
      q.why = T(`代換後展開得常數項 ${c} ${d === 'R' ? '+' : d === 'L' ? '−' : d === 'U' ? '+' : '−'} ${d === 'R' || d === 'L' ? `(${a})×${h}` : `(${b})×${h}`} = ${nc}。`, `Constant becomes ${nc}.`);
    } else if (type === 'intercept') {
      const a = nz(-4, 4), b = nz(-4, 4), axis = pick(['x', 'y']);
      const v = nz(-5, 5), c = axis === 'x' ? a * v : b * v;
      q.text = T(`求直線 $${eqText({ a, b, c })}$ 的 ${axis} 截距。`, `Find the ${axis}-intercept of $${eqText({ a, b, c })}$.`);
      q.inputs = [{ label: axis + L(' 截距 =', '-int ='), ans: v }];
      q.hint = T(`令 ${axis === 'x' ? 'y' : 'x'}=0。`, `Set ${axis === 'x' ? 'y' : 'x'}=0.`);
      q.why = T(`令 ${axis === 'x' ? 'y' : 'x'}=0：${axis === 'x' ? a : b}${axis}=${c}，${axis}=${v}。`, `${axis}=${v}.`);
    } else if (type === 'half') {
      const a = nz(-3, 3), b = nz(-3, 3), c = rnd(-5, 5), op = pick(['<', '<=', '>', '>=']), P = { x: rnd(-4, 4), y: rnd(-4, 4) };
      const OPS = { '<': '＜', '<=': '≤', '>': '＞', '>=': '≥' };
      const v = a * P.x + b * P.y, ok = LP.satisfies({ a, b, c, op }, P);
      q.text = T(`點 $P${pt(P)}$ 是否在不等式 $${eqText({ a, b, c }, OPS[op])}$ 的圖形上？`, `Is $P${pt(P)}$ in the graph of $${eqText({ a, b, c }, OPS[op])}$?`);
      q.opts = [T('是，在圖形上', 'Yes'), T('否，不在圖形上', 'No')]; q.a = ok ? 0 : 1;
      q.hint = T('把 P 的坐標代入左式，再和右邊比較。注意有沒有等號！', 'Substitute P and compare — mind the equality!');
      q.why = T(`代入：${a}·(${P.x}) + ${b}·(${P.y}) = ${v}，${v} ${OPS[op]} ${c} ${ok ? '成立' : '不成立'}。`, `${v} ${OPS[op]} ${c} is ${ok ? 'true' : 'false'}.`);
      q.fig = P2 => { P2.setView({ xmin: -6, xmax: 6, ymin: -6, ymax: 6 }); P2.base({ step: 1 }); P2.halfplane({ a, b, c, op }); P2.line({ a, b, c, op }, { label: eqText({ a, b, c }, OPS[op]), at: 0.9 }); P2.point(P.x, P.y, { color: ok ? 'var(--green)' : 'var(--red)', r: 8, halo: true, label: 'P' }); };
    } else if (type === 'inter') {
      let a1, b1, a2, b2;
      do { a1 = nz(-4, 4); b1 = nz(-4, 4); a2 = nz(-4, 4); b2 = nz(-4, 4); } while (a1 * b2 - a2 * b1 === 0);
      const x0 = rnd(-4, 6), y0 = rnd(-4, 6);
      const c1 = { a: a1, b: b1, c: a1 * x0 + b1 * y0 }, c2 = { a: a2, b: b2, c: a2 * x0 + b2 * y0 };
      q.text = T(`可行解區域的一個頂點是 $${eqText(c1)}$ 與 $${eqText(c2)}$ 的交點，求此頂點坐標。`, `A vertex is the intersection of $${eqText(c1)}$ and $${eqText(c2)}$. Find it.`);
      q.inputs = [{ label: 'x =', ans: x0 }, { label: 'y =', ans: y0 }];
      q.hint = T('用加減消去法或代入消去法解聯立方程式。', 'Solve the 2×2 system by elimination or substitution.');
      q.why = T(`解得 (x, y) = (${x0}, ${y0})。`, `(x, y) = (${x0}, ${y0}).`);
    } else if (type === 'vertex') {
      let V;
      for (let t = 0; t < 100; t++) {
        const m = rnd(3, 8), n = rnd(3, 8), p = rnd(1, m), qq = rnd(1, n);
        V = [{ x: 0, y: 0 }, { x: m, y: 0 }, { x: p, y: qq }, { x: 0, y: n }];
        const cr = (o, a2, b2) => (a2.x - o.x) * (b2.y - o.y) - (a2.y - o.y) * (b2.x - o.x);
        if (V.every((v, i) => cr(v, V[(i + 1) % 4], V[(i + 2) % 4]) > 0)) break;
      }
      const sx = rnd(0, 3), sy = rnd(0, 3); V = V.map(v => ({ x: v.x + sx, y: v.y + sy }));
      const p = nz(-3, 6), qq = nz(-3, 6), goal = pick(['max', 'min']);
      const vals = V.map(v => p * v.x + qq * v.y), best = goal === 'max' ? Math.max(...vals) : Math.min(...vals);
      q.text = T(`可行解區域為頂點 ${V.map(pt).join('、')} 所圍成的四邊形（含邊界），求目標函數 $${eqText({ a: p, b: qq, c: 0 }).replace(/ ＝ 0$/, '')}$ 的${goal === 'max' ? '最大值' : '最小值'}。`, `The region is the quadrilateral with vertices ${V.map(pt).join(', ')}. Find the ${goal} of $${eqText({ a: p, b: qq, c: 0 }).replace(/ ＝ 0$/, '')}$.`);
      q.inputs = [{ label: goal === 'max' ? L('最大值 =', 'Max =') : L('最小值 =', 'Min ='), ans: best }];
      q.hint = T('頂點法：把每個頂點代入目標函數比較大小。', 'Vertex method: evaluate at every vertex.');
      q.why = T(`代入各頂點：${V.map((v, i) => pt(v) + '→' + vals[i]).join('，')}。`, V.map((v, i) => pt(v) + '→' + vals[i]).join(', '));
      q.fig = P2 => { const mx = Math.max(...V.map(v => Math.max(v.x, v.y))) + 1; P2.setView({ xmin: -1, xmax: mx, ymin: -1, ymax: mx }); P2.base({ step: 1 }); P2.poly(V, { stroke: 'var(--blue)' }); V.forEach(v => P2.point(v.x, v.y, { color: 'var(--ink)', label: pt(v), size: 12 })); };
      q.figFirst = true;
    } else {
      const tpl = pick([
        { s: T('工廠生產甲、乙兩種產品 x、y 件。甲每件需工時 A 小時，乙每件需 B 小時，總工時<b>不超過</b> H 小時。', 'Products x, y need A and B hours each; total hours <b>at most</b> H.'), op: '≤' },
        { s: T('營養師要求每天從兩種食物 x、y 份中，得到蛋白質<b>至少</b> H 單位；每份分別含 A、B 單位。', 'Two foods x, y servings with A and B units of protein; need <b>at least</b> H.'), op: '≥' },
        { s: T('購買 x 枝原子筆（每枝 A 元）和 y 本筆記本（每本 B 元），預算<b>不超過</b> H 元。', 'x pens at $A and y notebooks at $B; budget <b>at most</b> H.'), op: '≤' },
        { s: T('貨車載運 x 箱蘋果（每箱 A 公斤）與 y 箱梨子（每箱 B 公斤），總重<b>至少</b>要 H 公斤才出車。', 'x boxes of A kg and y boxes of B kg; need <b>at least</b> H kg.'), op: '≥' }]);
      const A = rnd(2, 9), B = rnd(2, 9), H = rnd(4, 20) * 10;
      const rep = s => s.replace('A', A).replace('B', B).replace('H', H);
      const right = `${A}x+${B}y${tpl.op}${H}`;
      const wrongs = [`${B}x+${A}y${tpl.op}${H}`, `${A}x+${B}y${tpl.op === '≤' ? '≥' : '≤'}${H}`, `${A}x+${B}y${tpl.op === '≤' ? '＜' : '＞'}${H}`];
      if (A === B) wrongs[0] = `${A}x+${B + 1}y${tpl.op}${H}`;
      q.text = T(rep(tpl.s.zh) + ' 下列哪個限制式正確？', rep(tpl.s.en) + ' Which constraint is correct?');
      const opts = shuffle([right].concat(wrongs));
      q.opts = opts; q.a = opts.indexOf(right);
      q.hint = T('「不超過」→ ≤；「至少」→ ≥；注意每個變數對應的係數。', '“at most” → ≤, “at least” → ≥.');
      q.why = T(`正確式子為 ${right}。`, `Correct: ${right}.`);
    }
    return q;
  }
  function renderPractice() {
    const el = $('#practice');
    const p = R.practice;
    el.innerHTML = `<h2 class="sec"><span class="emo">🔁</span>${L('練習區：無限題目，反覆演練', 'Practice: unlimited random questions')}</h2>
<div class="stats" id="prStats"></div>
<div class="subtabs" id="prTypes"><button type="button" data-t="mix" aria-selected="${PR.type === 'mix'}">🎲 ${L('綜合', 'Mixed')}</button>${PTYPES.map(t => `<button type="button" data-t="${t.id}" aria-selected="${PR.type === t.id}">${t.icon} ${tr(t.t)}</button>`).join('')}</div>
<div class="card" id="prCard"></div>`;
    void p;
    $$('#prTypes button').forEach(b => b.onclick = () => { PR.type = b.dataset.t; PR.cur = null; sfx('click'); renderPractice(); });
    prStats();
    if (!PR.cur) { PR.cur = genQ(PR.type); PR.answered = false; }
    showPQ();
  }
  function prStats() {
    const p = R.practice;
    $('#prStats').innerHTML = [[p.total, L('作答題數', 'Answered')], [p.correct, L('答對題數', 'Correct')], [p.total ? Math.round(p.correct / p.total * 100) + '%' : '—', L('正確率', 'Accuracy')], [PR.streak, L('目前連對', 'Streak')], [p.best, L('最佳連對', 'Best streak')]]
      .map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  function showPQ() {
    const q = PR.cur, card = $('#prCard');
    const ty = PTYPES.find(t => t.id === q.type);
    card.innerHTML = `<div class="row" style="justify-content:space-between"><span class="pill t">${ty.icon} ${tr(ty.t)}</span><span class="stars">${'⭐'.repeat(Math.min(5, PR.streak))}</span></div>
<p style="font-size:1.12rem">${md(q.text)}</p><div class="qfig pfig"></div>
${q.inputs ? `<div class="row">${q.inputs.map((inp, i) => `<label class="row" style="gap:6px">${esc(tr(inp.label))}<input class="ans" type="text" inputmode="decimal" data-i="${i}" aria-label="${esc(tr(inp.label))}"></label>`).join('')}</div>` : `<div class="opts">${q.opts.map((o, i) => `<button type="button" class="opt" data-i="${i}">${md(tr(o))}</button>`).join('')}</div>`}
<div class="row" style="margin-top:10px"><button class="btn" id="prChk">${ui('check')}</button><button class="btn ghost" id="prHint">💡 ${L('提示', 'Hint')}</button><button class="btn y" id="prNext">${ui('next')}</button></div>
<div class="fb" id="prFb"></div>`;
    if (q.fig && q.figFirst) drawFigFn(q.fig, $('.pfig', card));
    let sel = null;
    $$('.opt', card).forEach(b => b.onclick = () => { if (PR.answered) return; $$('.opt', card).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; sfx('click'); });
    $$('input.ans', card).forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('#prChk').click(); }));
    $('#prHint').onclick = () => { const fb = $('#prFb'); fb.className = 'fb show'; fb.style.background = 'var(--card2)'; fb.innerHTML = '💡 ' + md(q.hint); sfx('pop'); };
    $('#prNext').onclick = () => { PR.cur = genQ(PR.type); PR.answered = false; sfx('whoosh'); showPQ(); };
    $('#prChk').onclick = () => {
      let ok;
      if (q.inputs) {
        const vals = q.inputs.map((inp, i) => parseNum($(`input[data-i="${i}"]`, card).value));
        if (vals.some(v => !isFinite(v))) { toast(L('請輸入數字（可用分數，如 3/2）', 'Enter numbers (fractions like 3/2 ok)')); return; }
        const res = q.inputs.map((inp, i) => near(vals[i], inp.ans)); ok = res.every(Boolean);
        $$('input.ans', card).forEach((e, i) => e.style.borderColor = res[i] ? 'var(--green)' : 'var(--red)');
      } else {
        if (sel == null) { toast(L('請先選擇一個選項', 'Choose an option first')); return; }
        ok = sel === q.a; $$('.opt', card).forEach((b, i) => { b.classList.toggle('right', i === q.a); b.classList.toggle('wrong', i === sel && !ok); });
      }
      const fb = $('#prFb'); fb.style.background = ''; fb.className = 'fb show ' + (ok ? 'ok' : 'no');
      const ansTxt = q.inputs ? q.inputs.map(i => tr(i.label) + ' ' + fmt(i.ans)).join('，') : md(tr(q.opts[q.a]));
      fb.innerHTML = `<b>${ok ? '🎉 ' + ui('correct') : '🤔 ' + ui('wrong') + ' ' + ui('answer') + '：' + ansTxt}</b><br>${md(q.why)}`;
      if (q.fig && !q.figFirst && !$('.pfig svg', card)) drawFigFn(q.fig, $('.pfig', card));
      if (!PR.answered) {
        PR.answered = true;
        const p = R.practice; p.total++; if (ok) p.correct++;
        p.byType[q.type] = p.byType[q.type] || { n: 0, c: 0 }; p.byType[q.type].n++; if (ok) p.byType[q.type].c++;
        PR.streak = ok ? PR.streak + 1 : 0; if (PR.streak > p.best) p.best = PR.streak;
        log('practice', T(`練習〈${tr(T(ty.t.zh, ty.t.zh))}〉${ok ? '答對' : '答錯'}`, `Practice ${q.type}: ${ok ? 'correct' : 'wrong'}`), { ok });
        prStats();
        if (ok && PR.streak > 0 && PR.streak % 5 === 0) { sfx('win'); confetti(); toast(L(`🔥 連對 ${PR.streak} 題！`, `🔥 ${PR.streak} in a row!`)); }
        else sfx(ok ? 'ok' : 'bad');
      } else sfx(ok ? 'ok' : 'bad');
      if (!ok) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
    };
  }
  function drawFigFn(fn, wrap) { const svg = svgEl(); wrap.appendChild(svg); const P = new Plot(svg, { W: 400, H: 400 }); fn(P); }

  /* ======================= 測驗 ======================= */
  const QZ = { state: 'intro', qs: [], ans: [], i: 0, t0: 0, timer: null };
  function renderQuiz() {
    const el = $('#quiz');
    clearInterval(QZ.timer);
    if (QZ.state === 'intro') {
      const best = R.quizzes.length ? Math.max(...R.quizzes.map(q => q.score)) : null;
      el.innerHTML = `<h2 class="sec"><span class="emo">🏆</span>${L('單元測驗', 'Unit quiz')}</h2>
<div class="card" style="text-align:center"><div style="font-size:4rem;animation:bob 2.6s infinite">📝</div>
<h3>${L('從題庫隨機抽出 10 題', '10 random questions from the bank')}（${L('題庫共', 'bank:')} ${QUIZ.length} ${L('題', '')}）</h3>
<p>${L('每題 10 分，滿分 100；<b>80 分</b>以上通過。全部作答後交卷，會顯示詳解。', 'Each 10 points; <b>80</b> to pass. Explanations shown after submitting.')}</p>
${best != null ? `<p>🏅 ${L('目前最高分', 'Best so far')}：<b>${best}</b>（${R.quizzes.length} ${L('次', 'attempts')}）</p>` : ''}
<button class="btn o" id="qzStart" style="font-size:1.15rem">🚀 ${ui('start')}</button></div>`;
      $('#qzStart').onclick = startQuiz;
    } else if (QZ.state === 'run') showQQ();
    else showQResult();
  }
  function startQuiz() {
    QZ.qs = shuffle(QUIZ.map((q, i) => i)).slice(0, 10).map(i => {
      const q = QUIZ[i];
      if (q.opts) { const ord = shuffle(q.opts.map((o, k) => k)); return { src: i, q: q.q, opts: ord.map(k => q.opts[k]), a: ord.indexOf(q.a), why: q.why }; }
      return { src: i, q: q.q, num: q.num, why: q.why };
    });
    QZ.ans = QZ.qs.map(() => null); QZ.i = 0; QZ.state = 'run'; QZ.t0 = Date.now();
    sfx('whoosh'); log('quiz-start', T('開始測驗', 'Quiz started')); renderQuiz();
  }
  function showQQ() {
    const el = $('#quiz'), q = QZ.qs[QZ.i], n = QZ.qs.length;
    el.innerHTML = `<h2 class="sec"><span class="emo">🏆</span>${L('單元測驗', 'Unit quiz')}</h2>
<div class="card"><div class="row" style="justify-content:space-between"><b>${L('第', 'Q')} ${QZ.i + 1} / ${n} ${L('題', '')}</b><span>⏱️ <span id="qzT">0:00</span></span></div>
<div class="qprog" style="margin:8px 0 14px"><i style="width:${(QZ.i) / n * 100}%"></i></div>
<p style="font-size:1.15rem">${esc(tr(q.q))}</p>
${q.opts ? `<div class="opts">${q.opts.map((o, i) => `<button type="button" class="opt ${QZ.ans[QZ.i] === i ? 'sel' : ''}" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(tr(o))}</button>`).join('')}</div>`
        : `<div class="row"><input class="ans" type="text" inputmode="decimal" id="qzNum" value="${QZ.ans[QZ.i] != null ? esc(QZ.ans[QZ.i]) : ''}" aria-label="answer"><small class="lead">${L('可輸入整數、小數或分數（如 −1/2）', 'Integer, decimal or fraction (e.g. −1/2)')}</small></div>`}
<div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn ghost" id="qzPrev" ${QZ.i === 0 ? 'disabled' : ''}>← ${L('上一題', 'Prev')}</button>
${QZ.i < n - 1 ? `<button class="btn" id="qzNext">${ui('next')}</button>` : `<button class="btn o" id="qzSubmit">📮 ${L('交卷', 'Submit')}</button>`}</div></div>`;
    const tick = () => { const s = Math.floor((Date.now() - QZ.t0) / 1000), t = $('#qzT'); if (t) t.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    tick(); clearInterval(QZ.timer); QZ.timer = setInterval(tick, 1000);
    $$('.opt', el).forEach(b => b.onclick = () => { QZ.ans[QZ.i] = +b.dataset.i; $$('.opt', el).forEach(x => x.classList.toggle('sel', x === b)); sfx('click'); });
    const saveNum = () => { const inp = $('#qzNum'); if (inp) QZ.ans[QZ.i] = inp.value.trim() === '' ? null : inp.value; };
    if ($('#qzNum')) $('#qzNum').addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('#qzNext') || $('#qzSubmit'); b.click(); } });
    $('#qzPrev').onclick = () => { saveNum(); QZ.i--; sfx('click'); showQQ(); };
    if ($('#qzNext')) $('#qzNext').onclick = () => { saveNum(); QZ.i++; sfx('click'); showQQ(); };
    if ($('#qzSubmit')) $('#qzSubmit').onclick = () => {
      saveNum();
      const blank = QZ.ans.filter(a => a == null).length;
      if (blank && !confirm(L(`還有 ${blank} 題未作答，確定交卷？`, `${blank} unanswered. Submit anyway?`))) return;
      finishQuiz();
    };
  }
  function finishQuiz() {
    clearInterval(QZ.timer);
    let c = 0;
    QZ.res = QZ.qs.map((q, i) => { const a = QZ.ans[i]; const ok = q.opts ? a === q.a : (a != null && near(parseNum(a), q.num)); if (ok) c++; return ok; });
    const score = Math.round(c / QZ.qs.length * 100), secs = Math.round((Date.now() - QZ.t0) / 1000);
    QZ.score = score; QZ.secs = secs;
    R.quizzes.push({ t: Date.now(), score, correct: c, n: QZ.qs.length, secs, wrong: QZ.qs.filter((q, i) => !QZ.res[i]).map(q => q.src) });
    log('quiz', T(`完成測驗：${score} 分（${c}/${QZ.qs.length}，${secs} 秒）`, `Quiz: ${score} (${c}/${QZ.qs.length}, ${secs}s)`), { score });
    QZ.state = 'done'; sfx(score >= 80 ? 'win' : 'bad'); if (score >= 80) confetti();
    renderQuiz();
  }
  function showQResult() {
    const el = $('#quiz'), s = QZ.score;
    const stars = s >= 100 ? 3 : s >= 80 ? 2 : s >= 60 ? 1 : 0;
    el.innerHTML = `<h2 class="sec"><span class="emo">🏆</span>${L('測驗結果', 'Result')}</h2>
<div class="card" style="text-align:center"><div style="font-size:3.6rem;font-weight:900;background:linear-gradient(90deg,var(--blue),var(--pink));-webkit-background-clip:text;background-clip:text;color:transparent">${s}</div>
<div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
<p>${s >= 80 ? L('🎉 恭喜通過！你已經掌握線性規劃的核心概念。', '🎉 Passed! You have mastered the core ideas.') : L('💪 還差一點！看看詳解，到練習區再演練後重測。', '💪 Almost! Review the explanations and practise, then retry.')}</p>
<p class="lead">${L('答對', 'Correct')} ${QZ.res.filter(Boolean).length}/${QZ.qs.length}　⏱️ ${Math.floor(QZ.secs / 60)}:${String(QZ.secs % 60).padStart(2, '0')}</p>
<div class="row" style="justify-content:center"><button class="btn o" id="qzAgain">🔄 ${ui('retry')}</button><button class="btn ghost" data-go="practice">🔁 ${L('去練習', 'Practice')}</button><button class="btn ghost" data-go="record">📊 ${L('看學習歷程', 'Records')}</button></div></div>
<h3>📖 ${L('答案檢討', 'Review')}</h3>
${QZ.qs.map((q, i) => {
      const a = QZ.ans[i], ok = QZ.res[i];
      const yours = a == null ? L('（未作答）', '(blank)') : q.opts ? tr(q.opts[a]) : a;
      const right = q.opts ? tr(q.opts[q.a]) : fmt(q.num);
      return `<div class="card" style="border-left:6px solid ${ok ? 'var(--green)' : 'var(--red)'}"><b>${i + 1}. ${ok ? '✅' : '❌'}</b> ${esc(tr(q.q))}<br>${L('你的答案', 'Yours')}：<b>${esc(yours)}</b>　${ok ? '' : `${ui('answer')}：<b class="good">${esc(right)}</b>`}<br><small>💡 ${esc(tr(q.why))}</small></div>`;
    }).join('')}`;
    $('#qzAgain').onclick = () => { QZ.state = 'intro'; startQuiz(); };
  }

  /* ======================= 學習歷程 ======================= */
  function renderRecord() {
    const el = $('#record');
    const p = R.practice, qz = R.quizzes;
    const best = qz.length ? Math.max(...qz.map(q => q.score)) : 0;
    const itemsDone = ITEMS.filter(i => R.items[i.id] && R.items[i.id].done).length;
    const d = t => new Date(t).toLocaleString(S.lang === 'en' ? 'en' : 'zh-TW', { hour12: false });
    el.innerHTML = `<h2 class="sec"><span class="emo">📊</span>${L('學習歷程紀錄', 'Learning records')}</h2>
<p class="lead">${L('紀錄只儲存在這台裝置的瀏覽器中，可下載後繳交給老師。', 'Records stay in this browser; download them to hand in.')}</p>
<div class="card row"><label for="recName"><b>👤 ${L('姓名／座號（選填）', 'Name / ID (optional)')}</b></label><input type="text" id="recName" value="${esc(R.name || '')}" style="flex:1;min-width:180px" maxlength="40"></div>
<div class="stats">
${[[progress() + '%', L('整體進度', 'Overall')], [`${LESSONS.filter(l => R.lessons[l.id]).length}/${LESSONS.length}`, L('課程閱讀', 'Lessons')], [`${Object.keys(R.labs).length}/5`, L('實驗室使用', 'Labs used')], [`${itemsDone}/${ITEMS.length}`, L('範例習題完成', 'Items done')],
        [p.total, L('練習題數', 'Practice')], [p.total ? Math.round(p.correct / p.total * 100) + '%' : '—', L('練習正確率', 'Accuracy')], [qz.length, L('測驗次數', 'Quizzes')], [qz.length ? best : '—', L('測驗最高分', 'Best score')]]
        .map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}
</div>
<div class="grid g2">
<div class="card"><h3>📈 ${L('測驗成績趨勢', 'Quiz scores')}</h3><div id="recChart">${qz.length ? '' : `<p class="lead">${L('尚無測驗紀錄', 'No quizzes yet')}</p>`}</div></div>
<div class="card"><h3>🔁 ${L('練習分類表現', 'Practice by type')}</h3><div class="tablewrap"><table class="t"><tr><th>${L('題型', 'Type')}</th><th>${L('題數', 'n')}</th><th>${L('正確率', 'Acc.')}</th></tr>
${PTYPES.map(t => { const b = p.byType[t.id]; return `<tr><td style="text-align:left">${t.icon} ${tr(t.t)}</td><td>${b ? b.n : 0}</td><td>${b && b.n ? Math.round(b.c / b.n * 100) + '%' : '—'}</td></tr>`; }).join('')}</table></div></div>
</div>
<div class="card"><h3>🗒️ ${L('學習日誌（最新在前）', 'Activity log (newest first)')}</h3>
<p class="lead">${L('首次使用', 'First use')}：${d(R.first)}　｜　${L('開啟次數', 'Visits')}：${R.visits}</p>
<ul class="log">${R.log.slice(0, 120).map(e => `<li><time>${d(e.t)}</time>${esc(S.lang === 'en' ? e.en : e.zh)}</li>`).join('') || `<li>${L('尚無紀錄', 'Nothing yet')}</li>`}</ul></div>
<div class="card row"><button class="btn" id="dlTxt">📄 ${L('下載學習報告 (.txt)', 'Download report (.txt)')}</button><button class="btn g" id="dlCsv">📊 ${L('下載日誌 (.csv)', 'Download log (.csv)')}</button><button class="btn ghost" id="dlJson">🧾 ${L('下載完整資料 (.json)', 'Download data (.json)')}</button>
<a class="btn o" href="assets/pdf/linear-programming.pdf" download="linear-programming.pdf" data-pdf>⬇️ ${ui('pdf')}</a><button class="btn ghost" id="recReset" style="color:var(--red)">🗑️ ${L('清除紀錄', 'Reset records')}</button></div>`;
    if (qz.length) chart($('#recChart'), qz.slice(-12));
    $('#recName').onchange = e => { R.name = e.target.value.slice(0, 40); saveRec(); toast(L('已儲存', 'Saved')); };
    $('#dlTxt').onclick = () => download(`linear-programming-report_${stamp()}.txt`, reportText(), 'text/plain');
    $('#dlCsv').onclick = () => download(`linear-programming-log_${stamp()}.csv`, '\uFEFF' + [['time', 'type', 'event_zh', 'event_en']].concat(R.log.map(e => [new Date(e.t).toISOString(), e.type, e.zh, e.en])).map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv');
    $('#dlJson').onclick = () => download(`linear-programming-records_${stamp()}.json`, JSON.stringify(R, null, 2), 'application/json');
    $('#recReset').onclick = () => {
      if (!confirm(L('確定要清除所有學習紀錄嗎？此動作無法復原。', 'Clear all records? This cannot be undone.'))) return;
      R = freshRec(); R.visits = 1; store.set('records', R); sfx('whoosh'); toast(L('已清除', 'Cleared')); renderAll(); go('record', true);
    };
  }
  function chart(box, qz) {
    const W = 460, H = 220, pad = 34, bw = (W - pad * 2) / qz.length;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="quiz scores">
<line x1="${pad}" y1="${H - pad}" x2="${W - 10}" y2="${H - pad}" class="axis"/>
<line x1="${pad}" y1="${H - pad - (H - 2 * pad) * 0.8}" x2="${W - 10}" y2="${H - pad - (H - 2 * pad) * 0.8}" style="stroke:var(--green);stroke-dasharray:6 5"/>
<text x="${W - 12}" y="${H - pad - (H - 2 * pad) * 0.8 - 6}" text-anchor="end" style="font-size:12px;fill:var(--green)">80</text>
${qz.map((q, i) => { const h = (H - 2 * pad) * q.score / 100, x = pad + i * bw + bw * 0.18; return `<rect x="${x}" y="${H - pad - h}" width="${bw * 0.64}" height="${h}" rx="6" style="fill:${q.score >= 80 ? 'var(--green)' : 'var(--orange)'}"/><text x="${x + bw * 0.32}" y="${H - pad - h - 5}" text-anchor="middle" style="font-size:13px;font-weight:700">${q.score}</text><text x="${x + bw * 0.32}" y="${H - pad + 16}" text-anchor="middle" class="tick">#${i + 1}</text>`; }).join('')}
</svg>`;
  }
  const stamp = () => { const d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '_' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0'); };
  function download(name, text, type) {
    try {
      const blob = new Blob([text], { type: type + ';charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      sfx('pop'); log('download', T('下載 ' + name, 'Downloaded ' + name));
    } catch (e) { toast(L('下載失敗', 'Download failed')); }
  }
  function reportText() {
    const p = R.practice, qz = R.quizzes, d = t => new Date(t).toLocaleString('zh-TW', { hour12: false });
    const lines = ['線性規劃 互動學習網 — 學習報告', '='.repeat(30), `姓名／座號：${R.name || '（未填）'}`, `產生時間：${d(Date.now())}`, `首次使用：${d(R.first)}　開啟次數：${R.visits}`, `整體進度：${progress()}%`, '',
      '【課程閱讀】', ...LESSONS.map(l => `  ${R.lessons[l.id] ? '☑' : '☐'} ${l.title.zh}${R.lessons[l.id] ? '（' + d(R.lessons[l.id]) + '）' : ''}`), '',
      '【互動實驗室】', ...LABS.map(l => `  ${R.labs[l.id] ? '☑' : '☐'} ${l.t.zh}${R.labs[l.id] ? `（操作 ${R.labs[l.id].n} 次）` : ''}`), '',
      '【範例與習題】', ...ITEMS.map(i => `  ${R.items[i.id] && R.items[i.id].done ? '☑' : '☐'} ${UI.zh['kind_' + i.kind]} ${i.no}（${i.tag.zh}）${R.items[i.id] && R.items[i.id].correct ? ' ✔答對' : ''}`), '',
      '【練習】', `  作答 ${p.total} 題，答對 ${p.correct} 題，正確率 ${p.total ? Math.round(p.correct / p.total * 100) : 0}%，最佳連對 ${p.best}`,
      ...PTYPES.map(t => { const b = p.byType[t.id]; return `  - ${t.t.zh}：${b ? b.n : 0} 題，正確率 ${b && b.n ? Math.round(b.c / b.n * 100) : 0}%`; }), '',
      '【測驗】', ...(qz.length ? qz.map((q, i) => `  第 ${i + 1} 次 ${d(q.t)}：${q.score} 分（${q.correct}/${q.n}，${q.secs} 秒）`) : ['  尚無紀錄']), '',
      '【學習日誌（最近 60 筆）】', ...R.log.slice(0, 60).map(e => `  ${d(e.t)}  ${e.zh}`)];
    return lines.join('\r\n');
  }

  /* ======================= 全部重繪 ======================= */
  function renderStatic() {
    $$('[data-i18n]').forEach(e => e.textContent = ui(e.dataset.i18n));
    document.title = S.lang === 'en' ? 'Linear Programming | Interactive Learning' : '線性規劃｜互動學習網';
  }
  function renderAll() {
    renderStatic(); renderNav(); renderHome(); renderLessons(); renderLabs(); renderItems(); renderAdvanced(); renderPractice(); renderQuiz(); renderRecord(); renderSettings();
    go((location.hash || '#home').slice(1), true);
  }

  /* ======================= 初始化 ======================= */
  function init() {
    R.visits++; if (!R.first) R.first = Date.now();
    applySettings(); renderAll();
    const tb = $('.topbar'), setTop = () => document.documentElement.style.setProperty('--topH', tb.offsetHeight + 'px');
    setTop(); if (window.ResizeObserver) new ResizeObserver(setTop).observe(tb); else window.addEventListener('resize', setTop);
    log('visit', T(`開啟學習網（第 ${R.visits} 次）`, `Opened the site (visit ${R.visits})`));
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-go]');
      if (t) { const p = t.dataset.go; if (p === '#settings') openSettings(true); else go(p); return; }
      const tab = e.target.closest('.tabs button'); if (tab) { go(tab.dataset.page); return; }
      const lt = e.target.closest('#lessonTabs button'); if (lt) { sfx('click'); showLesson(lt.dataset.lesson); return; }
      const lb = e.target.closest('#labTabs button'); if (lb) { sfx('click'); showLab(lb.dataset.lab); return; }
      const sb = e.target.closest('#setBody button'); if (sb) { onSetting(sb.dataset.k, sb.dataset.v); return; }
      const pdf = e.target.closest('[data-pdf]'); if (pdf) { sfx('pop'); log('download', T('下載原始教材 PDF', 'Downloaded textbook PDF')); }
    });
    $('#btnSet').onclick = () => openSettings(true);
    $('#setClose').onclick = () => openSettings(false);
    $('#scrim').onclick = () => openSettings(false);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') openSettings(false); });
    window.addEventListener('hashchange', () => go(location.hash.slice(1), true));
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const h = document.documentElement; h.dataset.eff = effDevice(); h.dataset.orient = effOrient(); }, 120); });
    document.addEventListener('fullscreenchange', renderSettings); document.addEventListener('webkitfullscreenchange', renderSettings);
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', applySettings);
      const mo = window.matchMedia('(orientation: portrait)'); if (mo.addEventListener) mo.addEventListener('change', applySettings);
    }
  }
  function openSettings(open) {
    $('#panel').classList.toggle('open', open); $('#scrim').classList.toggle('open', open);
    $('#panel').setAttribute('aria-hidden', !open);
    if (open) { sfx('pop'); renderSettings(); setTimeout(() => $('#setClose').focus(), 50); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
