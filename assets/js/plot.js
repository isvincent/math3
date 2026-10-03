/* ==========================================================
   LP 繪圖引擎：坐標平面、直線、半平面、可行解區域、頂點與最佳解
   限制式格式 {a, b, c, op}  代表  a·x + b·y (op) c ， op ∈ <=, >=, <, >, =
   ========================================================== */
(function (global) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let uid = 0;

  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* 轉為 a x + b y <= c 的形式 */
  function norm(c) {
    const op = c.op || '<=';
    if (op === '>=' || op === '>') return { a: -c.a, b: -c.b, c: -c.c, strict: op === '>' };
    return { a: c.a, b: c.b, c: c.c, strict: op === '<' };
  }

  function clipPoly(poly, h) {
    const out = [];
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const P = poly[i], Q = poly[(i + 1) % n];
      const fp = h.a * P.x + h.b * P.y - h.c, fq = h.a * Q.x + h.b * Q.y - h.c;
      const inP = fp <= 1e-9, inQ = fq <= 1e-9;
      if (inQ) {
        if (!inP) { const t = fp / (fp - fq); out.push({ x: P.x + t * (Q.x - P.x), y: P.y + t * (Q.y - P.y) }); }
        out.push(Q);
      } else if (inP) {
        const t = fp / (fp - fq); out.push({ x: P.x + t * (Q.x - P.x), y: P.y + t * (Q.y - P.y) });
      }
    }
    return out;
  }

  function region(cons, v) {
    let poly = [{ x: v.xmin, y: v.ymin }, { x: v.xmax, y: v.ymin }, { x: v.xmax, y: v.ymax }, { x: v.xmin, y: v.ymax }];
    for (const c of cons) { poly = clipPoly(poly, norm(c)); if (!poly.length) break; }
    return poly;
  }

  function satisfies(c, p) {
    const v = c.a * p.x + c.b * p.y, tol = 1e-7 * (1 + Math.abs(c.c));
    switch (c.op || '<=') {
      case '<=': return v <= c.c + tol;
      case '>=': return v >= c.c - tol;
      case '<': return v < c.c - 1e-9;
      case '>': return v > c.c + 1e-9;
      default: return Math.abs(v - c.c) <= tol;
    }
  }
  const feasible = (cons, p) => cons.every(c => satisfies(c, p));

  function intersect(c1, c2) {
    const D = c1.a * c2.b - c2.a * c1.b;
    if (Math.abs(D) < 1e-12) return null;
    return { x: (c1.c * c2.b - c2.c * c1.b) / D, y: (c1.a * c2.c - c2.a * c1.c) / D };
  }

  function vertices(cons) {
    const pts = [];
    for (let i = 0; i < cons.length; i++) for (let j = i + 1; j < cons.length; j++) {
      const p = intersect(cons[i], cons[j]);
      if (p && feasible(cons, p) && !pts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 1e-6)) pts.push(p);
    }
    if (pts.length > 2) {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      pts.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx));
    }
    return pts;
  }

  /* 求解：obj = {p, q, r}  目標 p x + q y + r ；goal = 'max' | 'min' */
  function solve(cons, obj, goal) {
    const f = pt => obj.p * pt.x + obj.q * pt.y + (obj.r || 0);
    const big = region(cons, { xmin: -1e6, xmax: 1e6, ymin: -1e6, ymax: 1e6 });
    const verts = vertices(cons);
    if (!big.length) return { status: 'empty', verts: [], vals: [] };
    const vals = verts.map(f);
    const bigVals = big.map(f);
    const bigBest = goal === 'max' ? Math.max(...bigVals) : Math.min(...bigVals);
    if (!verts.length) return { status: 'unbounded', verts, vals };
    const best = goal === 'max' ? Math.max(...vals) : Math.min(...vals);
    const tol = 1e-6 * Math.max(1, Math.abs(best));
    const unb = goal === 'max' ? bigBest > best + tol * 10 : bigBest < best - tol * 10;
    const opt = verts.filter((p, i) => Math.abs(vals[i] - best) <= tol);
    return { status: unb ? 'unbounded' : 'ok', verts, vals, best, opt, f };
  }

  function niceStep(range, target) {
    const raw = range / (target || 10);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  function fmt(x, d) {
    if (Math.abs(x) < 1e-9) x = 0;
    const r = Math.round(x);
    if (Math.abs(x - r) < 1e-9) return String(r);
    // 嘗試以分數表示（分母 ≤ 12）
    for (let q = 2; q <= 12; q++) {
      const pp = Math.round(x * q);
      if (Math.abs(x * q - pp) < 1e-7) return (pp < 0 ? '−' : '') + Math.abs(pp) + '/' + q;
    }
    return String(+x.toFixed(d == null ? 2 : d)).replace('-', '−');
  }

  class Plot {
    constructor(svg, opt) {
      this.svg = svg;
      opt = opt || {};
      this.W = opt.W || 520; this.H = opt.H || 520; this.pad = opt.pad || 30;
      svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
      svg.classList.add('plot');
      this.v = Object.assign({ xmin: -6, xmax: 6, ymin: -6, ymax: 6 }, opt.view || {});
      this.reset();
    }
    setView(v) { this.v = Object.assign({}, v); }
    X(x) { return this.pad + (x - this.v.xmin) / (this.v.xmax - this.v.xmin) * (this.W - 2 * this.pad); }
    Y(y) { return this.H - this.pad - (y - this.v.ymin) / (this.v.ymax - this.v.ymin) * (this.H - 2 * this.pad); }
    fromClient(evt) {
      const pt = this.svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      const p = pt.matrixTransform(this.svg.getScreenCTM().inverse());
      return {
        x: this.v.xmin + (p.x - this.pad) / (this.W - 2 * this.pad) * (this.v.xmax - this.v.xmin),
        y: this.v.ymin + (this.H - this.pad - p.y) / (this.H - 2 * this.pad) * (this.v.ymax - this.v.ymin)
      };
    }
    reset() {
      while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
      const id = 'clip' + (++uid);
      const defs = mk('defs', null, this.svg);
      const cp = mk('clipPath', { id }, defs);
      mk('rect', { x: this.pad, y: this.pad, width: this.W - 2 * this.pad, height: this.H - 2 * this.pad }, cp);
      const mid = 'arr' + uid;
      const m = mk('marker', { id: mid, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      mk('path', { d: 'M0,0 L10,5 L0,10 z', style: 'fill:var(--axis)' }, m);
      this.arrowId = mid;
      this.gGrid = mk('g', null, this.svg);
      this.gRegion = mk('g', { 'clip-path': `url(#${id})` }, this.svg);
      this.gLines = mk('g', { 'clip-path': `url(#${id})` }, this.svg);
      this.gAxes = mk('g', null, this.svg);
      this.gTop = mk('g', null, this.svg);
      this.gLabels = mk('g', null, this.svg);
      return this;
    }
    grid(step) {
      const v = this.v;
      const sx = step || niceStep(v.xmax - v.xmin), sy = step || niceStep(v.ymax - v.ymin);
      for (let x = Math.ceil(v.xmin / sx) * sx; x <= v.xmax + 1e-9; x += sx)
        mk('line', { class: 'gridl', x1: this.X(x), x2: this.X(x), y1: this.Y(v.ymin), y2: this.Y(v.ymax) }, this.gGrid);
      for (let y = Math.ceil(v.ymin / sy) * sy; y <= v.ymax + 1e-9; y += sy)
        mk('line', { class: 'gridl', y1: this.Y(y), y2: this.Y(y), x1: this.X(v.xmin), x2: this.X(v.xmax) }, this.gGrid);
      this._sx = sx; this._sy = sy;
      return this;
    }
    axes(opt) {
      opt = opt || {};
      const v = this.v;
      const y0 = Math.min(Math.max(0, v.ymin), v.ymax), x0 = Math.min(Math.max(0, v.xmin), v.xmax);
      mk('line', { class: 'axis', x1: this.X(v.xmin), x2: this.X(v.xmax) + 12, y1: this.Y(y0), y2: this.Y(y0), 'marker-end': `url(#${this.arrowId})` }, this.gAxes);
      mk('line', { class: 'axis', x1: this.X(x0), x2: this.X(x0), y1: this.Y(v.ymin), y2: this.Y(v.ymax) - 12, 'marker-end': `url(#${this.arrowId})` }, this.gAxes);
      this.text(null, null, 'x', { px: this.X(v.xmax) + 4, py: this.Y(y0) - 8, size: 18 });
      this.text(null, null, 'y', { px: this.X(x0) + 8, py: this.Y(v.ymax) - 2, size: 18 });
      if (v.xmin <= 0 && v.xmax >= 0 && v.ymin <= 0 && v.ymax >= 0) this.text(null, null, 'O', { px: this.X(0) - 15, py: this.Y(0) + 17, size: 16 });
      if (opt.ticks !== false) {
        const sx = opt.tx || this._sx || niceStep(v.xmax - v.xmin), sy = opt.ty || this._sy || niceStep(v.ymax - v.ymin);
        const every = opt.every || 2;
        let i = 0;
        for (let x = Math.ceil(v.xmin / sx) * sx; x <= v.xmax - sx * 0.5; x += sx) {
          if (Math.abs(x) > 1e-9 && (Math.round(x / sx) % every === 0)) {
            mk('text', { class: 'tick', x: this.X(x), y: this.Y(y0) + 16, 'text-anchor': 'middle' }, this.gAxes).textContent = fmt(x);
          }
          i++;
        }
        for (let y = Math.ceil(v.ymin / sy) * sy; y <= v.ymax - sy * 0.5; y += sy) {
          if (Math.abs(y) > 1e-9 && (Math.round(y / sy) % every === 0)) {
            mk('text', { class: 'tick', x: this.X(x0) - 6, y: this.Y(y) + 5, 'text-anchor': 'end' }, this.gAxes).textContent = fmt(y);
          }
        }
      }
      return this;
    }
    base(opt) { return this.reset().grid(opt && opt.step).axes(opt); }
    poly(pts, style) {
      style = style || {};
      if (!pts || pts.length < 2) return null;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + this.X(p.x).toFixed(2) + ',' + this.Y(p.y).toFixed(2)).join(' ') + (style.open ? '' : ' Z');
      return mk('path', { d, style: `fill:${style.fill || 'var(--region)'};stroke:${style.stroke || 'none'};stroke-width:${style.sw || 2};${style.dash ? 'stroke-dasharray:' + style.dash : ''}`, class: style.cls }, style.layer === 'top' ? this.gTop : this.gRegion);
    }
    halfplane(c, style) { return this.poly(region([c], this.v), style); }
    feasible(cons, style) { return this.poly(region(cons, this.v), style); }
    lineSeg(a, b, c) {
      const v = this.v, pts = [];
      if (Math.abs(b) > 1e-12) for (const x of [v.xmin, v.xmax]) { const y = (c - a * x) / b; if (y >= v.ymin - 1e-9 && y <= v.ymax + 1e-9) pts.push({ x, y }); }
      if (Math.abs(a) > 1e-12) for (const y of [v.ymin, v.ymax]) { const x = (c - b * y) / a; if (x >= v.xmin - 1e-9 && x <= v.xmax + 1e-9) pts.push({ x, y }); }
      let best = null, bd = -1;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d > bd) { bd = d; best = [pts[i], pts[j]]; }
      }
      return best;
    }
    line(c, style) {
      style = style || {};
      const seg = this.lineSeg(c.a, c.b, c.c);
      if (!seg) return null;
      const dash = style.dash != null ? style.dash : ((c.op === '<' || c.op === '>') ? '9 7' : '');
      const el = mk('line', {
        x1: this.X(seg[0].x), y1: this.Y(seg[0].y), x2: this.X(seg[1].x), y2: this.Y(seg[1].y),
        style: `stroke:${style.color || 'var(--blue)'};stroke-width:${style.w || 2.6};stroke-linecap:round;${dash ? 'stroke-dasharray:' + dash : ''};opacity:${style.opacity == null ? 1 : style.opacity}`
      }, this.gLines);
      if (style.label) {
        const [p, q] = seg[0].y > seg[1].y || (seg[0].y === seg[1].y && seg[0].x > seg[1].x) ? [seg[1], seg[0]] : [seg[0], seg[1]];
        const t = style.at == null ? 0.86 : style.at;
        const lx = this.X(p.x + (q.x - p.x) * t), ly = this.Y(p.y + (q.y - p.y) * t);
        this.text(null, null, style.label, { px: Math.min(this.W - 6, Math.max(6, lx + (style.dx || 6))), py: Math.max(16, ly + (style.dy || -6)), color: style.color, size: style.size || 15, anchor: lx > this.W * 0.72 ? 'end' : 'start', weight: 700 });
      }
      return el;
    }
    segment(p, q, style) {
      style = style || {};
      return mk('line', { x1: this.X(p.x), y1: this.Y(p.y), x2: this.X(q.x), y2: this.Y(q.y), style: `stroke:${style.color || 'var(--ink)'};stroke-width:${style.w || 3};stroke-linecap:round;${style.dash ? 'stroke-dasharray:' + style.dash : ''}` }, style.layer === 'lines' ? this.gLines : this.gTop);
    }
    arrow(p, q, style) {
      style = style || {};
      const id = 'ar' + (++uid);
      const m = mk('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, this.svg.querySelector('defs'));
      mk('path', { d: 'M0,0 L10,5 L0,10 z', style: `fill:${style.color || 'var(--orange)'}` }, m);
      return mk('line', { x1: this.X(p.x), y1: this.Y(p.y), x2: this.X(q.x), y2: this.Y(q.y), 'marker-end': `url(#${id})`, style: `stroke:${style.color || 'var(--orange)'};stroke-width:${style.w || 3.5};stroke-linecap:round` }, this.gTop);
    }
    point(x, y, style) {
      style = style || {};
      const g = mk('g', { class: style.cls }, this.gTop);
      if (style.halo) mk('circle', { cx: this.X(x), cy: this.Y(y), r: (style.r || 6) + 8, style: `fill:${style.color || 'var(--red)'};opacity:.25` }, g);
      mk('circle', { cx: this.X(x), cy: this.Y(y), r: style.r || 6, style: `fill:${style.hollow ? 'var(--card)' : (style.color || 'var(--red)')};stroke:${style.stroke || style.color || 'var(--card)'};stroke-width:${style.hollow ? 2.5 : 2}` }, g);
      if (style.label) this.text(null, null, style.label, { px: this.X(x) + (style.dx == null ? 9 : style.dx), py: this.Y(y) + (style.dy == null ? -9 : style.dy), color: style.lcolor || style.color, size: style.size || 15, anchor: style.anchor, weight: 700 });
      return g;
    }
    text(x, y, s, style) {
      style = style || {};
      const t = mk('text', {
        x: style.px != null ? style.px : this.X(x), y: style.py != null ? style.py : this.Y(y),
        'text-anchor': style.anchor || 'start',
        style: `font-size:${style.size || 15}px;${style.color ? 'fill:' + style.color + ';' : ''}${style.weight ? 'font-weight:' + style.weight + ';' : ''}${style.italic === false ? '' : 'font-style:italic;'}`
      }, this.gLabels);
      t.textContent = s;
      return t;
    }
    lattice(cons, style) {
      style = style || {};
      const v = this.v; let n = 0;
      for (let x = Math.ceil(v.xmin); x <= v.xmax; x++) for (let y = Math.ceil(v.ymin); y <= v.ymax; y++) {
        if (feasible(cons, { x, y })) { n++; mk('circle', { cx: this.X(x), cy: this.Y(y), r: style.r || 3.6, style: `fill:${style.color || 'var(--orange)'}` }, this.gTop); }
      }
      return n;
    }
  }

  /* 方程式文字：a x + b y op c */
  function eqText(c, opSym) {
    const t = (k, v, first) => {
      if (Math.abs(k) < 1e-12) return '';
      const s = k < 0 ? '−' : (first ? '' : '+');
      const ak = Math.abs(k);
      const num = Math.abs(ak - 1) < 1e-12 ? '' : fmt(ak);
      return (first ? s : ' ' + s + ' ') + num + v;
    };
    let lhs = t(c.a, 'x', true);
    lhs += t(c.b, 'y', !lhs);
    if (!lhs) lhs = '0';
    const OP = { '<=': '≤', '>=': '≥', '<': '＜', '>': '＞', '=': '＝' };
    return lhs.trim() + ' ' + (opSym || OP[c.op || '='] || '＝') + ' ' + fmt(c.c);
  }

  global.LP = { Plot, region, vertices, solve, feasible, satisfies, intersect, norm, niceStep, fmt, eqText };
})(window);
