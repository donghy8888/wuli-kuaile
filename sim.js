/* 快乐掌握物理 · 🔬 物理实验室：可交互模拟 + 小任务 */
(function () {
  'use strict';
  const W = window.WL, C = W.core, { $, $$, store, toast } = C;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const f1 = x => (Math.round(x * 10) / 10).toString();
  const f2 = x => (Math.round(x * 100) / 100).toFixed(2);
  const arrowDefs = `<defs>
    <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>
    <marker id="ahR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e8505b"/></marker>
    <marker id="ahO" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#ff9f1a"/></marker>
    <marker id="ahB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2f7cf6"/></marker>
    <marker id="ahG" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#00a37a"/></marker>
  </defs>`;
  const ray = (x1, y1, x2, y2, col, mk, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="2.6" stroke-linecap="round" ${mk ? `marker-end="url(#${mk})"` : ''} ${extra}/>`;
  const txt = (x, y, s, cls = '', anchor = 'middle') => `<text x="${x}" y="${y}" class="st ${cls}" text-anchor="${anchor}">${s}</text>`;

  /* =========================================================
   * 1. 光的反射与折射
   * ========================================================= */
  const MED = { water: { n: 1.33, name: '水', fill: '#bfe3ff' }, glass: { n: 1.5, name: '玻璃', fill: '#cdeee3' } };
  const light = {
    id: 'light', emoji: '🌈', name: '光的反射与折射', ch: 'light', cls: 't1',
    desc: '调入射角，看反射角、折射角怎么变',
    init: () => ({ i: 30, med: 'water' }),
    ctrls: [
      { type: 'range', key: 'i', label: '入射角 i', min: 0, max: 80, step: 1, fmt: v => v + '°' },
      { type: 'seg', key: 'med', label: '下方介质', opts: [['water', '💧 水'], ['glass', '🔷 玻璃']] },
    ],
    calc(s) { const n = MED[s.med].n; const r = Math.asin(Math.sin(s.i * D2R) / n) * R2D; return { r }; },
    draw(s) {
      const { r } = this.calc(s), O = [150, 112], L = 108, i = s.i * D2R, rr = r * D2R, R = 30;
      const P = [O[0] - L * Math.sin(i), O[1] - L * Math.cos(i)];
      const Rf = [O[0] + L * Math.sin(i), O[1] - L * Math.cos(i)];
      const Rr = [O[0] + L * Math.sin(rr), O[1] + L * Math.cos(rr)];
      const arc = (a, up, right, col) => {
        if (a < 1) return '';
        const sy = up ? -1 : 1, ex = O[0] + (right ? 1 : -1) * R * Math.sin(a * D2R), ey = O[1] + sy * R * Math.cos(a * D2R);
        const sweep = up ? (right ? 1 : 0) : (right ? 0 : 1);
        return `<path d="M${O[0]},${O[1] + sy * R} A${R},${R} 0 0 ${sweep} ${ex.toFixed(1)},${ey.toFixed(1)}" fill="none" stroke="${col}" stroke-width="2"/>`;
      };
      const lab = (a, up, right, s2, col) => { const m = (a / 2) * D2R, d = R + 13; return a < 1 ? '' : `<text x="${O[0] + (right ? 1 : -1) * d * Math.sin(m)}" y="${O[1] + (up ? -1 : 1) * d * Math.cos(m) + 4}" class="st b" fill="${col}" text-anchor="middle">${s2}</text>`; };
      return `<svg viewBox="0 0 300 228" class="sim-svg">${arrowDefs}
        <rect x="0" y="0" width="300" height="112" fill="#f3f9ff"/>
        <rect x="0" y="112" width="300" height="116" fill="${MED[s.med].fill}"/>
        ${txt(8, 18, '空气', 'm', 'start')}${txt(8, 220, MED[s.med].name, 'm', 'start')}
        <line x1="0" y1="112" x2="300" y2="112" stroke="#5b6b8c" stroke-width="2"/>
        <line x1="150" y1="6" x2="150" y2="222" stroke="#7a7f9a" stroke-width="1.5" stroke-dasharray="6 5"/>
        ${txt(158, 16, '法线', 'm', 'start')}
        ${ray(P[0], P[1], O[0], O[1], '#e8505b', 'ahR')}
        ${ray(O[0], O[1], Rf[0], Rf[1], '#ff9f1a', 'ahO')}
        ${ray(O[0], O[1], Rr[0], Rr[1], '#2f7cf6', 'ahB')}
        ${arc(s.i, true, false, '#e8505b')}${arc(s.i, true, true, '#ff9f1a')}${arc(r, false, true, '#2f7cf6')}
        ${lab(s.i, true, false, 'i', '#e8505b')}${lab(s.i, true, true, "i'", '#ff9f1a')}${lab(r, false, true, 'r', '#2f7cf6')}
        <circle cx="150" cy="112" r="3.5" fill="#2d3047"/>
        ${txt(P[0] + (s.i > 50 ? 6 : -4), P[1] + (s.i > 50 ? -6 : 14), '入射光线', 'r', s.i > 50 ? 'start' : 'end')}
        ${txt(Rf[0] + (s.i > 50 ? -6 : 4), Rf[1] + (s.i > 50 ? -6 : 14), '反射光线', 'o', s.i > 50 ? 'end' : 'start')}
        ${txt(Math.min(Rr[0] + 6, 292), Rr[1] - 4, '折射光线', 'bl', Rr[0] > 230 ? 'end' : 'start')}
      </svg>`;
    },
    read(s) {
      const { r } = this.calc(s);
      return [['入射角 i', s.i + '°', 'r'], ['反射角 i′', s.i + '°', 'o'], ['折射角 r', f1(r) + '°', 'bl']];
    },
    tip(s) {
      const { r } = this.calc(s);
      if (s.i === 0) return '光<b>垂直</b>射入时，传播方向不改变（入射角、反射角、折射角都是 0°）。';
      return `反射角 = 入射角 = ${s.i}°；光从空气斜射入${MED[s.med].name}，折射角 ${f1(r)}° <b>小于</b>入射角。入射角增大，折射角也增大。`;
    },
    tasks: [
      { t: '让反射光线与入射光线<b>互相垂直</b>', hint: '两条光线的夹角 = 入射角 + 反射角 = 2i', check: s => s.i === 45 },
      { t: '让光<b>垂直</b>射入水面，观察折射光线', hint: '垂直入射时，入射角是多少度？', check: s => s.i === 0 && s.med === 'water' },
      { t: '换成<b>玻璃</b>，让折射角约为 <b>30°</b>（±1°）', hint: '折射角比入射角小，所以入射角要大于 30°', check: (s, me) => s.med === 'glass' && Math.abs(me.calc(s).r - 30) <= 1 },
    ],
  };

  /* =========================================================
   * 2. 凸透镜成像规律
   * ========================================================= */
  const lensImg = u => {
    const f = 10;
    if (u === f) return { none: true, kind: '不成像', use: '光线平行射出（可获得平行光）' };
    const v = u * f / (u - f), m = Math.abs(v / u);
    if (v < 0) return { v, m, real: false, kind: '正立、放大的虚像', use: '🔍 放大镜' };
    const size = u > 2 * f ? '缩小' : u === 2 * f ? '等大' : '放大';
    const use = u > 2 * f ? '📷 照相机' : u === 2 * f ? '📏 测焦距（u = v = 2f）' : '📽️ 投影仪';
    return { v, m, real: true, size, kind: `倒立、${size}的实像`, use };
  };
  const lens = {
    id: 'lens', emoji: '🔍', name: '凸透镜成像', ch: 'lens', cls: 't3',
    desc: '移动蜡烛，看像的倒正、大小、虚实（f = 10 cm）',
    init: () => ({ u: 15 }),
    ctrls: [{ type: 'range', key: 'u', label: '物距 u', min: 4, max: 45, step: 1, fmt: v => v + ' cm' }],
    draw(s) {
      const k = 3.4, X = 170, Y = 104, h = 30, f = 10, u = s.u;
      const x0 = X - u * k, ty = Y - h, im = lensImg(u);
      let rays = '', img = '', note = '';
      const ext = (x1, y1, x2, y2, toX) => { const t = (toX - x1) / (x2 - x1); return [toX, y1 + (y2 - y1) * t]; };
      if (im.none) {
        const e1 = ext(X, ty, X + f * k, Y, 340);
        rays = ray(x0, ty, X, ty, '#ff9f1a') + ray(X, ty, e1[0], e1[1], '#ff9f1a') + ray(x0, ty, 340, Y + (Y - ty) * (340 - X) / (X - x0) , '#00a37a');
        note = txt(255, 30, '折射光平行，不成像', 'm');
      } else {
        const xi = X + im.v * k, hi = h * im.m, yi = im.real ? Y + hi : Y - hi;
        if (im.real) {
          const e1 = ext(X, ty, xi, yi, 340), e2 = ext(x0, ty, xi, yi, 340);
          rays = ray(x0, ty, X, ty, '#ff9f1a') + ray(X, ty, e1[0], e1[1], '#ff9f1a') + ray(x0, ty, e2[0], e2[1], '#00a37a');
          if (xi < 336) img = `<line x1="${xi}" y1="${Y}" x2="${xi}" y2="${yi}" stroke="#e8505b" stroke-width="4" marker-end="url(#ahR)"/>` + txt(xi, Math.min(yi + 16, 196), '像', 'r');
          else note = txt(334, 30, '像在很远处 →', 'r', 'end');
        } else {
          const e1 = ext(X, ty, X + f * k, Y, 340), e2 = ext(x0, ty, X, Y, 340);
          rays = ray(x0, ty, X, ty, '#ff9f1a') + ray(X, ty, e1[0], e1[1], '#ff9f1a') + ray(x0, ty, e2[0], e2[1], '#00a37a')
            + `<line x1="${X}" y1="${ty}" x2="${xi}" y2="${yi}" stroke="#ff9f1a" stroke-width="1.6" stroke-dasharray="4 4"/>`
            + `<line x1="${x0}" y1="${ty}" x2="${xi}" y2="${yi}" stroke="#00a37a" stroke-width="1.6" stroke-dasharray="4 4"/>`;
          if (xi > 2) img = `<line x1="${xi}" y1="${Y}" x2="${xi}" y2="${yi}" stroke="#e8505b" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#ahR)"/>` + txt(xi, Math.max(yi - 6, 12), '虚像', 'r');
          else note = txt(8, 30, '← 虚像在很远处', 'r', 'start');
        }
      }
      const mark = (x, l) => `<line x1="${x}" y1="${Y - 4}" x2="${x}" y2="${Y + 4}" stroke="#2d3047" stroke-width="2"/>` + txt(x, Y + 17, l, 'm');
      return `<svg viewBox="0 0 340 200" class="sim-svg">${arrowDefs}
        <rect width="340" height="200" fill="#fbfdff"/>
        <line x1="0" y1="${Y}" x2="340" y2="${Y}" stroke="#9aa3bf" stroke-width="1.5"/>
        ${mark(X - 2 * f * k, '2F')}${mark(X - f * k, 'F')}${mark(X + f * k, 'F')}${mark(X + 2 * f * k, '2F')}
        <ellipse cx="${X}" cy="${Y}" rx="9" ry="70" fill="rgba(120,190,255,.35)" stroke="#2f7cf6" stroke-width="2"/>
        ${txt(X, 196, '凸透镜', 'bl')}
        ${rays}
        <line x1="${x0}" y1="${Y}" x2="${x0}" y2="${ty}" stroke="#2d3047" stroke-width="4" marker-end="url(#ah)"/>
        <text x="${x0}" y="${ty - 8}" text-anchor="middle" font-size="16">🕯️</text>
        ${img}${note}
      </svg>`;
    },
    read(s) {
      const im = lensImg(s.u);
      return [['物距 u', s.u + ' cm', ''], ['像距 v', im.none ? '—' : im.real ? f1(im.v) + ' cm' : '同侧 ' + f1(-im.v) + ' cm', 'r'], ['像', im.kind, 'bl']];
    },
    tip(s) {
      const im = lensImg(s.u);
      const zone = s.u > 20 ? 'u > 2f' : s.u === 20 ? 'u = 2f' : s.u > 10 ? 'f < u < 2f' : s.u === 10 ? 'u = f' : 'u < f';
      return `<b>${zone}</b>：${im.kind}　应用：${im.use}。<br><small>口诀：一倍焦距分虚实，二倍焦距分大小；成实像时物近像远像变大。</small>`;
    },
    tasks: [
      { t: '像<b>照相机</b>那样：调出倒立、<b>缩小</b>的实像', hint: '物体要放在二倍焦距（20 cm）以外', check: s => s.u > 20 },
      { t: '像<b>投影仪</b>那样：调出倒立、<b>放大</b>的实像', hint: '物距在一倍和二倍焦距之间', check: s => s.u > 10 && s.u < 20 },
      { t: '调出倒立、<b>等大</b>的实像', hint: '此时 u = v = 2f', check: s => s.u === 20 },
      { t: '像<b>放大镜</b>那样：调出正立、放大的<b>虚像</b>', hint: '物体放在一倍焦距以内', check: s => s.u < 10 },
    ],
  };

  /* =========================================================
   * 3. 杠杆平衡
   * ========================================================= */
  const HOOK = 0.5;
  const lever = {
    id: 'lever', emoji: '⚖️', name: '杠杆平衡', ch: 'machine', cls: 't2',
    desc: '挂钩码让杠杆水平平衡：F₁L₁ = F₂L₂',
    init: () => ({ lc: 2, lp: 3, rc: 1, rp: 1 }),
    ctrls: [
      { type: 'step', key: 'rc', label: '右侧钩码个数', min: 1, max: 6, fmt: v => v + ' 个' },
      { type: 'step', key: 'rp', label: '右侧挂在第几格', min: 1, max: 5, fmt: v => '第 ' + v + ' 格' },
    ],
    draw(s) {
      const cx = 160, cy = 78, g = 27, tl = s.lc * s.lp, tr = s.rc * s.rp;
      const deg = clamp((tr - tl) * 2.2, -14, 14), a = deg * D2R;
      const pt = d => [cx + d * g * Math.cos(a), cy + d * g * Math.sin(a)];
      const beamEnd1 = pt(-5.6), beamEnd2 = pt(5.6);
      let ticks = '';
      for (let d = -5; d <= 5; d++) { if (!d) continue; const [x, y] = pt(d); ticks += `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" stroke="#8a6d3b"/>` + `<text x="${x}" y="${y - 7}" class="st m" text-anchor="middle">${Math.abs(d)}</text>`; }
      const stack = (d, n, col) => {
        const [x, y] = pt(d); let s2 = `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 16}" stroke="#555" stroke-width="1.5"/>`;
        for (let k = 0; k < n; k++) s2 += `<rect x="${x - 9}" y="${y + 16 + k * 15}" width="18" height="13" rx="3" fill="${col}" stroke="#555"/>`;
        return s2;
      };
      const bal = tl === tr;
      return `<svg viewBox="0 0 320 200" class="sim-svg">
        <rect width="320" height="200" fill="#fffdf6"/>
        <path d="M${cx - 18},190 L${cx},${cy + 4} L${cx + 18},190 Z" fill="#c9b68f" stroke="#8a6d3b" stroke-width="2"/>
        <line x1="${beamEnd1[0]}" y1="${beamEnd1[1]}" x2="${beamEnd2[0]}" y2="${beamEnd2[1]}" stroke="#d9a75f" stroke-width="10" stroke-linecap="round"/>
        ${ticks}
        <circle cx="${cx}" cy="${cy}" r="5" fill="#2d3047"/>
        ${stack(-s.lp, s.lc, '#7b8cff')}${stack(s.rp, s.rc, '#ff9f43')}
        ${txt(cx, 22, bal ? '⚖️ 水平平衡！' : tl > tr ? '⬅ 左边下沉' : '右边下沉 ➡', bal ? 'ok b' : 'r b')}
      </svg>`;
    },
    read(s) {
      const L = (s.lc * HOOK) * s.lp, R = (s.rc * HOOK) * s.rp;
      return [['左 F₁×L₁', `${f1(s.lc * HOOK)}N×${s.lp}格=${f1(L)}`, 'bl'], ['右 F₂×L₂', `${f1(s.rc * HOOK)}N×${s.rp}格=${f1(R)}`, 'o'], ['结果', L === R ? '✅ 相等' : L > R ? '左 > 右' : '左 < 右', L === R ? 'ok' : 'r']];
    },
    tip: () => '每个钩码重 0.5 N。杠杆平衡条件：<b>动力 × 动力臂 = 阻力 × 阻力臂</b>（F₁L₁ = F₂L₂）。',
    tasks: [
      { t: '左边 2 个钩码挂在第 3 格，在右边挂钩码，让杠杆<b>水平平衡</b>', hint: '2 × 3 = 右边个数 × 格数', setup: s => Object.assign(s, { lc: 2, lp: 3, rc: 1, rp: 1 }), check: s => s.lc * s.lp === s.rc * s.rp },
      { t: '左边 4 个钩码挂在第 2 格，右边只用 <b>2 个</b>钩码让它平衡', hint: '4 × 2 = 2 × ?', setup: s => Object.assign(s, { lc: 4, lp: 2, rc: 1, rp: 1 }), check: s => s.rc === 2 && s.lc * s.lp === s.rc * s.rp },
      { t: '左边 3 个钩码在第 4 格，右边挂在 <b>第 2 格</b>，需要几个钩码？', hint: '3 × 4 = ? × 2', setup: s => Object.assign(s, { lc: 3, lp: 4, rc: 1, rp: 1 }), check: s => s.rp === 2 && s.lc * s.lp === s.rc * s.rp },
    ],
  };

  /* =========================================================
   * 4. 浮力与浮沉
   * ========================================================= */
  const LIQ = { alc: { r: 8, name: '酒精', fill: '#f4f0d0' }, water: { r: 10, name: '水', fill: '#bfe3ff' }, salt: { r: 12, name: '盐水', fill: '#c8d8f0' } };
  const buoyCalc = s => {
    const ro = s.rho / 10, rl = LIQ[s.liq].r / 10, G = ro;           // V = 100 cm³，g = 10 N/kg → G = ρ(g/cm³) N
    if (s.rho < LIQ[s.liq].r) return { ro, rl, G, F: G, Vp: 100 * ro / rl, state: '漂浮', N: 0 };
    if (s.rho === LIQ[s.liq].r) return { ro, rl, G, F: G, Vp: 100, state: '悬浮', N: 0 };
    return { ro, rl, G, F: rl, Vp: 100, state: '下沉（沉底）', N: G - rl };
  };
  const buoy = {
    id: 'buoy', emoji: '🚢', name: '浮力与浮沉', ch: 'buoy', cls: 't6',
    desc: '改变物块密度和液体，看漂浮、悬浮、下沉',
    init: () => ({ rho: 5, liq: 'water' }),
    ctrls: [
      { type: 'range', key: 'rho', label: '物块密度 ρ物', min: 1, max: 30, step: 1, fmt: v => (v / 10).toFixed(1) + ' g/cm³' },
      { type: 'seg', key: 'liq', label: '液体', opts: [['alc', '酒精 0.8'], ['water', '水 1.0'], ['salt', '盐水 1.2']] },
    ],
    draw(s) {
      const c = buoyCalc(s), top = 78, bot = 200, side = 52;
      let y;
      if (c.state === '漂浮') y = top - side + side * c.ro / c.rl;
      else if (c.state === '悬浮') y = 118;
      else y = bot - side - 2;
      const x = 150 - side / 2, mid = y + side / 2;
      const shade = Math.round(clamp(230 - s.rho * 6, 60, 230));
      const col = `rgb(${shade + 20},${Math.round(shade * .8)},${Math.round(shade * .55)})`;
      const lenG = clamp(30 + c.G * 14, 30, 80), lenF = c.F ? clamp(30 + c.F * 14, 30, 80) : 0;
      return `<svg viewBox="0 0 300 214" class="sim-svg">${arrowDefs}
        <rect width="300" height="214" fill="#fbfdff"/>
        <rect x="62" y="${top}" width="176" height="${bot - top}" fill="${LIQ[s.liq].fill}"/>
        <path d="M60,30 L60,202 L240,202 L240,30" fill="none" stroke="#7a8bb0" stroke-width="3"/>
        <line x1="62" y1="${top}" x2="238" y2="${top}" stroke="#5b8cc9" stroke-width="1.5" stroke-dasharray="5 4"/>
        ${txt(232, top + 16, LIQ[s.liq].name, 'm', 'end')}
        <rect x="${x}" y="${y}" width="${side}" height="${side}" rx="4" fill="${col}" stroke="#5a4630" stroke-width="2"/>
        <line x1="${150 + 6}" y1="${mid}" x2="${150 + 6}" y2="${mid + lenG}" stroke="#e8505b" stroke-width="3" marker-end="url(#ahR)"/>
        ${txt(150 + 12, mid + lenG - 2, 'G = ' + f2(c.G) + ' N', 'r b', 'start')}
        ${c.F ? `<line x1="${150 - 6}" y1="${mid}" x2="${150 - 6}" y2="${mid - lenF}" stroke="#00a37a" stroke-width="3" marker-end="url(#ahG)"/>${txt(150 - 12, mid - lenF + 10, 'F浮 = ' + f2(c.F) + ' N', 'ok b', 'end')}` : ''}
        ${txt(150, 20, c.state === '漂浮' ? '🛟 漂浮：F浮 = G' : c.state === '悬浮' ? '🫧 悬浮：F浮 = G' : '⬇ 沉底：F浮 < G', c.state === '下沉（沉底）' ? 'r b' : 'ok b')}
      </svg>`;
    },
    read(s) {
      const c = buoyCalc(s);
      return [['重力 G', f2(c.G) + ' N', 'r'], ['浮力 F浮', f2(c.F) + ' N', 'ok'], ['V排', Math.round(c.Vp) + ' cm³', 'bl']];
    },
    tip(s) {
      const c = buoyCalc(s);
      return `物块体积 100 cm³。ρ物 ${c.ro.toFixed(1)} ${c.ro < c.rl ? '<' : c.ro === c.rl ? '=' : '>'} ρ液 ${c.rl.toFixed(1)} → <b>${c.state}</b>。F浮 = ρ液gV排 = ${c.rl.toFixed(1)}×10³ kg/m³ × 10 N/kg × ${Math.round(c.Vp)}×10⁻⁶ m³ = ${f2(c.F)} N${c.N ? `，容器底支持力 ${f2(c.N)} N` : ''}。`;
    },
    tasks: [
      { t: '让物块在<b>水</b>中<b>悬浮</b>', hint: '悬浮时 ρ物 = ρ液', check: s => s.liq === 'water' && s.rho === 10 },
      { t: '在<b>盐水</b>中让物块漂浮，并且<b>一半</b>露出液面', hint: 'V排 / V物 = ρ物 / ρ液 = 1/2', check: s => s.liq === 'salt' && s.rho === 6 },
      { t: '让物块在<b>酒精</b>中沉底，看看浮力是多少', hint: 'ρ物 > 0.8 g/cm³ 就会下沉', check: s => s.liq === 'alc' && s.rho > 8 },
    ],
  };

  /* =========================================================
   * 5. 欧姆定律电路
   * ========================================================= */
  const ohmCalc = s => { const I = s.U / (s.R + s.P); return { I, UR: I * s.R, UP: I * s.P }; };
  const ohm = {
    id: 'ohm', emoji: '⚡', name: '欧姆定律电路', ch: 'ohm', cls: 't4',
    desc: '调电源、电阻和滑动变阻器，读电流表、电压表',
    init: () => ({ U: 3, R: 10, P: 10 }),
    ctrls: [
      { type: 'seg', key: 'U', label: '电源电压', opts: [[1.5, '1.5 V'], [3, '3 V'], [4.5, '4.5 V'], [6, '6 V']] },
      { type: 'seg', key: 'R', label: '定值电阻 R', opts: [[5, '5 Ω'], [10, '10 Ω'], [15, '15 Ω'], [20, '20 Ω']] },
      { type: 'range', key: 'P', label: '变阻器接入 R滑', min: 0, max: 20, step: 1, fmt: v => v + ' Ω' },
    ],
    draw(s) {
      const c = ohmCalc(s), dur = clamp(0.5 / c.I, 0.35, 8).toFixed(2), cells = Math.round(s.U / 1.5);
      const sx = 220 - s.P / 20 * 100;  // 滑片位置：接入的是滑片右边那段电阻丝
      let bat = '';
      for (let k = 0; k < cells; k++) { const y = 82 + k * 12; bat += `<line x1="26" y1="${y}" x2="54" y2="${y}" stroke="#2d3047" stroke-width="2.5"/><line x1="33" y1="${y + 5}" x2="47" y2="${y + 5}" stroke="#2d3047" stroke-width="5"/>`; }
      const by2 = 82 + cells * 12;
      return `<svg viewBox="0 0 340 214" class="sim-svg">${arrowDefs}
        <rect width="340" height="214" fill="#fbfdff"/>
        <g fill="none" stroke="#2d3047" stroke-width="2.5">
          <path d="M40,82 L40,36 L142,36"/><path d="M178,36 L280,36 L280,74"/><path d="M280,138 L280,176 L220,176"/><path d="M110,150 L110,176 L40,176 L40,${by2}"/>
          <path d="M280,56 L318,56 L318,88"/><path d="M318,124 L318,158 L280,158"/>
        </g>
        <path d="M40,82 L40,36 L280,36 L280,176 L220,176 M${sx},164 L${sx},150 L110,150 L110,176 L40,176 L40,${by2}" fill="none" stroke="#ffb400" stroke-width="3.5" stroke-dasharray="3 13" class="flow" style="animation-duration:${dur}s" stroke-linecap="round" opacity=".9"/>
        ${bat}
        ${txt(14, 96, '+', 'r b')}${txt(62, by2 + 2, '电源', 'm', 'start')}
        <circle cx="160" cy="36" r="17" fill="#fff" stroke="#2d3047" stroke-width="2.5"/>${txt(160, 42, 'A', 'b big')}
        <rect x="270" y="74" width="20" height="64" fill="#fff" stroke="#2d3047" stroke-width="2.5"/>${txt(258, 110, 'R', 'b', 'end')}
        <circle cx="318" cy="106" r="17" fill="#fff" stroke="#2d3047" stroke-width="2.5"/>${txt(318, 112, 'V', 'b big')}
        <rect x="120" y="168" width="100" height="16" fill="#fff" stroke="#2d3047" stroke-width="2.5"/>
        <path d="M120,176 ${Array.from({ length: 10 }, (_, k) => `L${125 + k * 10},170 L${130 + k * 10},182`).join(' ')} L220,176" fill="none" stroke="#b07a3c" stroke-width="1.4"/>
        <path d="M110,150 L${sx},150 L${sx},164" fill="none" stroke="#2f7cf6" stroke-width="2.5" marker-end="url(#ahB)"/>
        <rect x="${sx - 5}" y="${144}" width="10" height="8" rx="2" fill="#2f7cf6"/>
        ${txt(170, 204, '滑动变阻器（滑片右边一段接入）', 'm')}
        <path d="M70,36 L100,36" stroke="#e8505b" stroke-width="2" marker-end="url(#ahR)"/>${txt(86, 28, 'I', 'r b')}
      </svg>`;
    },
    read(s) {
      const c = ohmCalc(s);
      return [['电流表 I', f2(c.I) + ' A', 'r'], ['电压表 U_R', f2(c.UR) + ' V', 'bl'], ['变阻器 U滑', f2(c.UP) + ' V', 'o']];
    },
    tip(s) {
      const c = ohmCalc(s);
      return `串联：I = U / (R + R滑) = ${s.U} V ÷ (${s.R} Ω + ${s.P} Ω) = <b>${f2(c.I)} A</b>；U_R = IR = ${f2(c.UR)} V。<br><small>黄点表示电流方向（电源外部从正极流向负极），流得越快电流越大。</small>`;
    },
    tasks: [
      { t: '电源 <b>3 V</b>、R = <b>10 Ω</b>，调变阻器让电流表示数为 <b>0.20 A</b>', hint: '总电阻 R总 = U / I = 15 Ω', check: s => s.U === 3 && s.R === 10 && s.P === 5 },
      { t: '电源 <b>6 V</b>，让电压表（R 两端）示数为 <b>3.00 V</b>', hint: '串联分压：U_R : U滑 = R : R滑', check: s => s.U === 6 && s.P === s.R },
      { t: '让电流表示数达到最大值 <b>1.20 A</b>', hint: '电压最大、总电阻最小', check: s => s.U === 6 && s.R === 5 && s.P === 0 },
    ],
  };


  /* =========================================================
   * 6. 放大镜（单凸透镜 → 引出显微镜）
   * ========================================================= */
  const magImg = (u, f) => {
    if (u === f) return { none: true, kind: '不成像', m: 0, v: 0, real: false };
    const v = u * f / (u - f), m = Math.abs(v / u);
    if (v < 0) return { v, m, real: false, kind: '正立、放大的虚像', size: '放大' };
    const size = u > 2 * f ? '缩小' : u === 2 * f ? '等大' : '放大';
    return { v, m, real: true, size, kind: `倒立、${size}的实像` };
  };
  const magnifier = {
    id: 'magnifier', emoji: '🔎', name: '放大镜', ch: 'lens', cls: 't9',
    desc: '动手调物距：一倍焦距内成正立放大虚像；再看看为什么还要显微镜',
    init: () => ({ f: 10, u: 6, mode: 'single' }),
    ctrls: [
      { type: 'tray', key: 'f', label: '① 选一块凸透镜当放大镜', opts: [[8, 'f=8 cm', '短一点，放大倍数大'], [10, 'f=10 cm', '常用焦距'], [15, 'f=15 cm', '长一点，视野更宽']] },
      { type: 'range', key: 'u', label: '② 拖动物体（物距 u）', min: 3, max: 30, step: 1, fmt: v => v + ' cm' },
      { type: 'seg', key: 'mode', label: '③ 探究模式', opts: [['single', '🔎 单透镜'], ['compare', '🔬 对比显微镜']] },
    ],
    draw(s) {
      const f = s.f, u = s.u, k = 4.2, X = 168, Y = 100, h = 28;
      const im = magImg(u, f), x0 = X - u * k, ty = Y - h;
      const mark = (x, l) => `<line x1="${x}" y1="${Y - 4}" x2="${x}" y2="${Y + 4}" stroke="#2d3047" stroke-width="2"/>` + txt(x, Y + 16, l, 'm');
      let rays = '', img = '', note = '';
      const ext = (x1, y1, x2, y2, toX) => { const t = (toX - x1) / (x2 - x1); return [toX, y1 + (y2 - y1) * t]; };
      if (im.none) {
        const e1 = ext(X, ty, X + f * k, Y, 340);
        rays = ray(x0, ty, X, ty, '#ff9f1a') + ray(X, ty, e1[0], e1[1], '#ff9f1a') + ray(x0, ty, 340, Y + (Y - ty) * (340 - X) / (X - x0), '#00a37a');
        note = txt(250, 28, '折射光平行，不成像', 'm');
      } else if (!im.real) {
        const xi = X + im.v * k, yi = Y - h * im.m;
        const e1 = ext(X, ty, X + f * k, Y, 340), e2 = ext(x0, ty, X, Y, 340);
        rays = ray(x0, ty, X, ty, '#ff9f1a') + ray(X, ty, e1[0], e1[1], '#ff9f1a') + ray(x0, ty, e2[0], e2[1], '#00a37a')
          + `<line x1="${X}" y1="${ty}" x2="${xi}" y2="${yi}" stroke="#ff9f1a" stroke-width="1.5" stroke-dasharray="4 4"/>`
          + `<line x1="${x0}" y1="${ty}" x2="${xi}" y2="${yi}" stroke="#00a37a" stroke-width="1.5" stroke-dasharray="4 4"/>`;
        if (xi > 8) img = `<line x1="${xi}" y1="${Y}" x2="${xi}" y2="${yi}" stroke="#e8505b" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#ahR)"/>` + txt(xi, Math.max(yi - 6, 14), '虚像', 'r');
      } else {
        const xi = X + im.v * k, yi = Y + h * im.m;
        const e1 = ext(X, ty, xi, yi, 340), e2 = ext(x0, ty, xi, yi, 340);
        rays = ray(x0, ty, X, ty, '#ff9f1a') + ray(X, ty, e1[0], e1[1], '#ff9f1a') + ray(x0, ty, e2[0], e2[1], '#00a37a');
        if (xi < 330) img = `<line x1="${xi}" y1="${Y}" x2="${xi}" y2="${yi}" stroke="#e8505b" stroke-width="3.5" marker-end="url(#ahR)"/>` + txt(xi, Math.min(yi + 14, 190), '实像', 'r');
        else note = txt(330, 28, '像在很远处 →', 'r', 'end');
      }
      const sharp = !im.none && !im.real && u < f;
      const preview = s.mode === 'single'
        ? `<g transform="translate(248,8)">
            <rect width="86" height="86" rx="43" fill="#1a2030" stroke="#445" stroke-width="3"/>
            <circle cx="43" cy="43" r="36" fill="#0d1520"/>
            ${sharp
              ? `<text x="43" y="38" text-anchor="middle" font-size="${18 + Math.min(im.m, 3) * 6}">🐜</text>
                 <text x="43" y="62" text-anchor="middle" fill="#9fef9f" font-size="10" font-weight="800">清晰 ×${f1(im.m)}</text>`
              : `<text x="43" y="40" text-anchor="middle" font-size="14" opacity=".35" filter="url(#blur)">🐜</text>
                 <text x="43" y="62" text-anchor="middle" fill="#ef9f9f" font-size="10" font-weight="800">${im.none ? '不成像' : im.real ? '成实像' : '调进 f 内'}</text>`}
            ${txt(43, 98, '透过透镜看', 'm')}
          </g>`
        : '';
      const compare = s.mode === 'compare' ? `
        <g transform="translate(8,8)">
          <rect width="324" height="54" rx="10" fill="#fff7dd" stroke="#e6d39a"/>
          <text x="16" y="22" class="st b" text-anchor="start">🔎 放大镜：1 片凸透镜，u&lt;f → 正立放大虚像（倍数有限）</text>
          <text x="16" y="42" class="st b" text-anchor="start">🔬 显微镜：物镜先成倒立放大实像，目镜再当放大镜 → 总倍数 ≈ 物镜×目镜</text>
        </g>` : '';
      return `<svg viewBox="0 0 340 210" class="sim-svg" style="touch-action:none">${arrowDefs}
        <defs><filter id="blur"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
        <rect width="340" height="210" fill="#fbfdff"/>
        <line x1="0" y1="${Y}" x2="340" y2="${Y}" stroke="#9aa3bf" stroke-width="1.5"/>
        ${mark(X - 2 * f * k, '2F')}${mark(X - f * k, 'F')}${mark(X + f * k, 'F')}${mark(X + 2 * f * k, '2F')}
        <ellipse cx="${X}" cy="${Y}" rx="10" ry="72" fill="rgba(120,190,255,.4)" stroke="#2f7cf6" stroke-width="2.5"/>
        ${txt(X, 198, '凸透镜 f=' + f, 'bl')}
        ${rays}
        <g data-drag="u" data-map="left" data-px="${k}" data-lensx="${X}" style="cursor:grab">
          <line x1="${x0}" y1="${Y}" x2="${x0}" y2="${ty}" stroke="#2d3047" stroke-width="4" marker-end="url(#ah)"/>
          <text x="${x0}" y="${ty - 8}" text-anchor="middle" font-size="18">🐜</text>
          <circle cx="${x0}" cy="${Y}" r="10" fill="transparent"/>
        </g>
        ${img}${note}${preview}${compare}
        ${txt(170, 16, s.mode === 'compare' ? '放大镜 vs 显微镜' : (sharp ? '✅ 正立放大虚像（放大镜原理）' : '把物体拖进一倍焦距以内'), sharp ? 'ok b' : 'm')}
      </svg>`;
    },
    read(s) {
      const im = magImg(s.u, s.f);
      return [['物距 u', s.u + ' cm', ''], ['焦距 f', s.f + ' cm', 'bl'], ['像', im.kind, im.real === false && !im.none ? 'ok' : 'r']];
    },
    tip(s) {
      const im = magImg(s.u, s.f);
      if (s.mode === 'compare') return '放大镜只有一级放大；观察细胞、细菌等更小的物体，需要<b>两级放大</b>——物镜先成放大实像，目镜再把这幅实像放大，这就是显微镜。去做「🔬 显微镜」实验动手组装吧！';
      if (im.none) return `u = f = ${s.f} cm：折射光平行射出，不成像。再往里挪一点就成虚像啦。`;
      if (!im.real) return `<b>u &lt; f</b>：成<b>正立、放大的虚像</b>（虚线是光线反向延长线）。放大倍数约 ×${f1(im.m)}。这就是放大镜！虚像不能用光屏接收。`;
      return `<b>u &gt; f</b>：成倒立实像（${im.size}）。放大镜要用时，物体必须放在<b>焦点以内</b>。`;
    },
    tasks: [
      { t: '选一块透镜，把蚂蚁拖到<b>一倍焦距以内</b>，看到正立放大虚像', hint: '物距 u 要小于焦距 f；虚像用虚线表示', check: s => s.u < s.f },
      { t: '换成 <b>f = 8 cm</b> 的透镜，再把物体放在焦点内，体会倍数更大', hint: '焦距越短，同样物距下放大倍数通常更大', check: s => s.f === 8 && s.u < 8 },
      { t: '把物体拖到 <b>f 以外</b>，观察变成倒立实像（放大镜失效）', hint: 'u > f 就不再是放大镜工作状态', check: s => s.u > s.f },
      { t: '切换到「对比显微镜」，读懂两级放大的区别', hint: '点一下探究模式里的 🔬 对比显微镜', check: s => s.mode === 'compare' },
    ],
  };

  /* =========================================================
   * 7. 显微镜（动手组装）
   * ========================================================= */
  const microCalc = s => {
    const fo = s.fo, fe = s.fe, u = s.u, L = s.L;
    if (!fo || !fe) return { ready: false };
    if (u <= fo) return { ready: true, stage: 'obj-fail', fo, fe, u, reason: '标本太近：u ≤ f物，物镜成虚像，显微镜不这样用' };
    const v1 = u * fo / (u - fo);
    const m1 = Math.abs(v1 / u);
    const ue = L - v1;
    const labelMo = fo <= 5 ? 20 : fo <= 8 ? 10 : 5;
    const labelMe = fe <= 10 ? 10 : fe <= 15 ? 5 : 20;
    let stage, mEye = 0, v2 = 0, total = 0, sharp = false;
    if (ue <= 0.2) stage = 'too-short';
    else if (ue < fe - 0.05) {
      v2 = ue * fe / (ue - fe);
      mEye = Math.abs(v2 / ue);
      total = m1 * mEye;
      stage = 'ok';
      sharp = ue >= fe * 0.4 && ue <= fe * 0.85;
    } else if (Math.abs(ue - fe) <= 0.25) stage = 'eye-f';
    else {
      stage = 'eye-real';
      v2 = ue * fe / (ue - fe);
      mEye = Math.abs(v2 / ue);
      total = m1 * mEye;
    }
    return { ready: true, stage, fo, fe, u, v1, m1, ue, v2, mEye, total, sharp, L, labelMo, labelMe,
      labelTotal: labelMo * labelMe, objOk: u > fo && u < 2 * fo };
  };
  const microscope = {
    id: 'microscope', emoji: '🔬', name: '显微镜', ch: 'lens', cls: 't10',
    desc: '从托盘选物镜、目镜，装到光具座上，调物距和镜筒看清标本',
    init: () => ({ fo: 0, fe: 0, u: 7.5, L: 22 }),
    ctrls: [
      { type: 'tray', key: 'fo', label: '① 选物镜（短焦距、高倍）', opts: [[0, '⬜ 未选', ''], [5, '物镜 f=5·20×', '焦距短，放大倍数大'], [8, '物镜 f=8·10×', '常用低倍物镜'], [15, '物镜 f=15·5×', '焦距偏长，不太适合']] },
      { type: 'tray', key: 'fe', label: '② 选目镜（比物镜稍长）', opts: [[0, '⬜ 未选', ''], [10, '目镜 f=10·10×', '常用'], [15, '目镜 f=15·5×', '稍长'], [5, '目镜 f=5', '与物镜一样短，不典型']] },
      { type: 'range', key: 'u', label: '③ 拖动标本（物距 u）', min: 3, max: 18, step: 0.1, fmt: v => f1(v) + ' cm' },
      { type: 'range', key: 'L', label: '④ 调节镜筒长度 L', min: 12, max: 36, step: 0.5, fmt: v => f1(v) + ' cm' },
      { type: 'note', html: '👆 也可在图上左右拖动标本🐜；物镜短、目镜稍长；标本放在 f～2f，镜筒调到清晰' },
    ],
    draw(s) {
      const c = microCalc(s), Y = 110, k = 5.2, Xo = 100;
      const Xe = s.fo && s.fe ? Xo + Math.min(s.L, 30) * k * 0.55 : Xo + 110;
      let lenses = '', rays = '', mid = '', final = '', trayHint = '';
      if (!s.fo || !s.fe) trayHint = txt(170, 36, '先从下方托盘选出物镜和目镜，装到光具座上', 'm');
      const tube = s.fo && s.fe ? `<rect x="${Xo + 8}" y="${Y - 28}" width="${Math.max(Xe - Xo - 16, 8)}" height="56" rx="6" fill="rgba(80,100,140,.12)" stroke="#7a8bb0" stroke-width="2" stroke-dasharray="4 3"/>` : '';
      if (s.fo) {
        lenses += `<ellipse cx="${Xo}" cy="${Y}" rx="7" ry="48" fill="rgba(80,170,255,.45)" stroke="#1f6fd6" stroke-width="2.5"/>` + txt(Xo, Y + 62, '物镜', 'bl') + txt(Xo, Y + 74, 'f=' + s.fo, 'm');
        lenses += `<line x1="${Xo - s.fo * k}" y1="${Y - 3}" x2="${Xo - s.fo * k}" y2="${Y + 3}" stroke="#2d3047"/>` + txt(Xo - s.fo * k, Y + 14, 'F', 'm');
        lenses += `<line x1="${Xo + s.fo * k}" y1="${Y - 3}" x2="${Xo + s.fo * k}" y2="${Y + 3}" stroke="#2d3047"/>`;
      } else {
        lenses += `<ellipse cx="${Xo}" cy="${Y}" rx="7" ry="48" fill="rgba(180,180,180,.2)" stroke="#aaa" stroke-width="2" stroke-dasharray="4 3"/>` + txt(Xo, Y + 62, '物镜座', 'm');
      }
      if (s.fe) {
        lenses += `<ellipse cx="${Xe}" cy="${Y}" rx="7" ry="40" fill="rgba(120,210,160,.45)" stroke="#00a37a" stroke-width="2.5"/>` + txt(Xe, Y + 56, '目镜', 'ok') + txt(Xe, Y + 68, 'f=' + s.fe, 'm');
        lenses += `<line x1="${Xe - s.fe * k * 0.45}" y1="${Y - 3}" x2="${Xe - s.fe * k * 0.45}" y2="${Y + 3}" stroke="#2d3047"/>` + txt(Xe - s.fe * k * 0.45, Y + 14, "F'", 'm');
      } else {
        lenses += `<ellipse cx="${Xo + 110}" cy="${Y}" rx="7" ry="40" fill="rgba(180,180,180,.2)" stroke="#aaa" stroke-width="2" stroke-dasharray="4 3"/>` + txt(Xo + 110, Y + 56, '目镜座', 'm');
      }
      const xObj = s.fo ? Xo - s.u * k : 36;
      const specimen = `<g data-drag="u" data-map="left" data-px="${k}" data-lensx="${Xo}" style="cursor:grab">
        <line x1="${xObj}" y1="${Y}" x2="${xObj}" y2="${Y - 22}" stroke="#2d3047" stroke-width="3" marker-end="url(#ah)"/>
        <text x="${xObj}" y="${Y - 28}" text-anchor="middle" font-size="16">🐜</text>
        <circle cx="${xObj}" cy="${Y}" r="12" fill="transparent"/>
      </g>`;
      if (c.ready && c.stage !== 'obj-fail' && s.fo && s.fe) {
        const xi = Xo + Math.min(c.v1, 22) * k * 0.85, hi = Math.min(22 * c.m1, 48), yi = Y + hi;
        rays = ray(xObj, Y - 22, Xo, Y - 22, '#ff9f1a') + ray(Xo, Y - 22, xi, yi, '#ff9f1a')
          + ray(xObj, Y - 22, Xo, Y, '#00a37a') + ray(Xo, Y, xi, yi, '#00a37a');
        mid = `<line x1="${xi}" y1="${Y}" x2="${xi}" y2="${yi}" stroke="#e8505b" stroke-width="3" marker-end="url(#ahR)"/>` + txt(xi, yi + 12, '中间实像', 'r');
        if (c.stage === 'ok') {
          const xv = Math.max(20, Xe - 55), yv = Y - Math.min(20 + c.mEye * 6, 50);
          final = `<line x1="${Xe}" y1="${yi}" x2="${xv}" y2="${yv}" stroke="#e8505b" stroke-width="1.6" stroke-dasharray="4 3"/>`
            + `<line x1="${xv}" y1="${Y}" x2="${xv}" y2="${yv}" stroke="#e8505b" stroke-width="2.5" stroke-dasharray="5 4" marker-end="url(#ahR)"/>`
            + txt(xv, yv - 6, '虚像(倒立)', 'r');
        }
      }
      const eyeView = (() => {
        const x = 268, y = 8; let body;
        if (!s.fo || !s.fe) body = `<text x="43" y="48" text-anchor="middle" fill="#889" font-size="11">先装透镜</text>`;
        else if (c.stage === 'obj-fail') body = `<text x="43" y="40" text-anchor="middle" font-size="12" opacity=".3">🐜</text><text x="43" y="62" text-anchor="middle" fill="#ef9f9f" font-size="9">标本太近</text>`;
        else if (c.stage === 'too-short') body = `<text x="43" y="48" text-anchor="middle" fill="#ef9f9f" font-size="10">镜筒太短</text>`;
        else if (c.stage === 'eye-f' || c.stage === 'eye-real') body = `<text x="43" y="40" text-anchor="middle" font-size="13" opacity=".25" filter="url(#blur)">🐜</text><text x="43" y="62" text-anchor="middle" fill="#efbf6f" font-size="9">调镜筒</text>`;
        else if (c.stage === 'ok' && c.sharp) body = `<text x="43" y="36" text-anchor="middle" font-size="22" transform="rotate(180 43 32)">🐜</text><text x="43" y="64" text-anchor="middle" fill="#9fef9f" font-size="10" font-weight="800">清晰 · 倒立</text>`;
        else if (c.stage === 'ok') body = `<text x="43" y="36" text-anchor="middle" font-size="16" opacity=".55" transform="rotate(180 43 32)" filter="url(#blur)">🐜</text><text x="43" y="64" text-anchor="middle" fill="#efbf6f" font-size="9">接近清晰</text>`;
        else body = `<text x="43" y="48" text-anchor="middle" fill="#889" font-size="11">—</text>`;
        return `<g transform="translate(${x},${y})"><rect width="86" height="86" rx="43" fill="#1a2030" stroke="#445" stroke-width="3"/><circle cx="43" cy="43" r="36" fill="#0d1520"/>${body}<text x="43" y="98" class="st m" text-anchor="middle">目镜视野</text></g>`;
      })();
      const status = !s.fo || !s.fe ? '动手组装：选出物镜 + 目镜'
        : c.stage === 'ok' && c.sharp ? `✅ 看清了！总放大约 ×${c.labelTotal}（${c.labelMo}×${c.labelMe}）`
        : c.stage === 'ok' ? '继续微调物距 / 镜筒，让视野清晰'
        : c.stage === 'obj-fail' ? c.reason
        : c.stage === 'too-short' ? '拉长镜筒，让中间实像落在目镜焦点以内'
        : '调节中…';
      return `<svg viewBox="0 0 360 210" class="sim-svg" style="touch-action:none">${arrowDefs}
        <defs><filter id="blur"><feGaussianBlur stdDeviation="2.4"/></filter></defs>
        <rect width="360" height="210" fill="#f7fbff"/>
        <line x1="10" y1="${Y}" x2="250" y2="${Y}" stroke="#9aa3bf" stroke-width="2"/>
        ${txt(20, Y + 70, '光具座', 'm', 'start')}
        ${tube}${lenses}${rays}${mid}${final}${specimen}${eyeView}
        ${txt(130, 16, status, c.sharp ? 'ok b' : 'm')}${trayHint}
      </svg>`;
    },
    read(s) {
      const c = microCalc(s);
      if (!c.ready) return [['物镜', '未选', 'r'], ['目镜', '未选', 'r'], ['状态', '组装中', '']];
      return [
        ['中间像', c.stage === 'obj-fail' ? '—' : `v₁=${f1(c.v1)} cm`, 'r'],
        ['目镜物距', c.ue != null ? f1(c.ue) + ' cm' : '—', 'bl'],
        ['总放大', c.stage === 'ok' ? `≈${c.labelMo}×${c.labelMe}=${c.labelTotal}` : '—', c.sharp ? 'ok' : ''],
      ];
    },
    tip(s) {
      const c = microCalc(s);
      if (!s.fo || !s.fe) return '显微镜要两片凸透镜：靠近标本的叫<b>物镜</b>（焦距短），靠近眼睛的叫<b>目镜</b>。先从托盘点选，装到光具座上。';
      if (c.stage === 'obj-fail') return '标本应放在物镜的 <b>f～2f 之间</b>，才能成倒立、放大的实像（中间像）。';
      if (c.stage === 'too-short') return `中间实像在物镜右侧 v₁≈${f1(c.v1)} cm，但镜筒 L=${f1(s.L)} cm 太短。把镜筒<b>拉长</b>到大约 ${f1(c.v1 + s.fe * 0.6)} cm。`;
      if (c.stage === 'ok') return `物镜成<b>倒立放大实像</b>，落在目镜焦点以内；目镜当放大镜。对人眼来说，最终像相对标本是<b>倒立</b>的。总放大倍数 ≈ 物镜倍数 × 目镜倍数 = ${c.labelMo}×${c.labelMe}=<b>${c.labelTotal}</b>。`;
      return '让中间实像落在目镜的一倍焦距以内，目镜才能当放大镜用。试试缩短一点镜筒。';
    },
    tasks: [
      { t: '从托盘选出合适的<b>物镜</b>（短焦距）和<b>目镜</b>（稍长）', hint: '物镜选 f=5 或 8；目镜选 f=10 或 15（比物镜长）', check: s => s.fo > 0 && s.fo <= 8 && s.fe > 0 && s.fe >= 10 && s.fe > s.fo },
      { t: '把标本调到物镜的 <b>f～2f</b> 之间，形成倒立放大中间实像', hint: '物距大于 f物、小于 2f物', check: s => { const c = microCalc(s); return c.ready && c.objOk; } },
      { t: '调节镜筒长度，让中间像落在目镜焦点以内，目镜视野<b>清晰</b>', hint: '镜筒大约 = v₁ + 0.6×f目；看目镜视野变清晰', check: s => { const c = microCalc(s); return c.stage === 'ok' && c.sharp; } },
      { t: '读出总放大倍数 = 物镜倍数 × 目镜倍数', hint: '看读数区的「总放大」', check: s => { const c = microCalc(s); return c.stage === 'ok' && c.sharp && c.labelTotal >= 50; } },
    ],
  };

  /* =========================================================
   * 8. 望远镜（开普勒式）
   * ========================================================= */
  const teleCalc = s => {
    const fo = s.fo, fe = s.fe, L = s.L;
    if (!fo || !fe) return { ready: false };
    const ideal = fo + fe;
    const focus = Math.abs(L - ideal) <= 0.6;
    const near = Math.abs(L - ideal) <= 1.5;
    const M = fo / fe; // 视角放大率
    let stage = 'defocus';
    if (L < ideal - 1.5) stage = 'short';
    else if (L > ideal + 1.5) stage = 'long';
    else if (focus) stage = 'ok';
    else stage = 'near';
    return { ready: true, ideal, focus, near, M, stage, fo, fe, L };
  };
  const telescope = {
    id: 'telescope', emoji: '🔭', name: '望远镜', ch: 'lens', cls: 't11',
    desc: '选长焦距物镜 + 短焦距目镜，调镜筒 ≈ f物+f目，看视角变大',
    init: () => ({ fo: 0, fe: 0, L: 20, target: 'moon' }),
    ctrls: [
      { type: 'tray', key: 'fo', label: '① 选物镜（要长焦距）', opts: [[0, '⬜ 未选', ''], [16, '物镜 f=16 cm', '长焦距，视角放大大'], [20, '物镜 f=20 cm', '更长'], [5, '物镜 f=5 cm', '太短，像显微镜物镜']] },
      { type: 'tray', key: 'fe', label: '② 选目镜（要短焦距）', opts: [[0, '⬜ 未选', ''], [2, '目镜 f=2 cm', '短，放大率大'], [4, '目镜 f=4 cm', '常用'], [10, '目镜 f=10 cm', '太长，放大率小']] },
      { type: 'range', key: 'L', label: '③ 调节镜筒长度 L', min: 8, max: 36, step: 0.5, fmt: v => f1(v) + ' cm' },
      { type: 'seg', key: 'target', label: '④ 观察目标', opts: [['moon', '🌙 月亮'], ['tower', '🗼 塔'], ['bird', '🐦 鸟']] },
      { type: 'note', html: '开普勒望远镜：镜筒长 ≈ f物 + f目；成倒立像；视角放大率 ≈ f物 / f目。对比显微镜：显微镜看近处微小物体，望远镜看远处大物体。' },
    ],
    draw(s) {
      const c = teleCalc(s), Y = 108, k = 4.2;
      const Xo = 70, Xe = s.fo && s.fe ? Xo + s.L * k * 0.7 : Xo + 100;
      const icons = { moon: '🌙', tower: '🗼', bird: '🐦' };
      const tip = icons[s.target] || '🌙';
      let lenses = '', rays = '', preview = '';
      // distant object rays (parallel)
      const parallel = `
        ${ray(8, Y - 28, Xo, Y - 22, '#ff9f1a')}
        ${ray(8, Y - 8, Xo, Y - 8, '#ff9f1a')}
        ${ray(8, Y + 12, Xo, Y + 6, '#00a37a')}
        ${txt(18, Y - 36, '来自远处的近平行光', 'm', 'start')}
        <text x="22" y="${Y + 40}" font-size="22">${tip}</text>`;
      if (s.fo) {
        lenses += `<ellipse cx="${Xo}" cy="${Y}" rx="9" ry="52" fill="rgba(80,170,255,.45)" stroke="#1f6fd6" stroke-width="2.5"/>`
          + txt(Xo, Y + 66, '物镜', 'bl') + txt(Xo, Y + 78, 'f=' + s.fo, 'm');
        lenses += `<line x1="${Xo + s.fo * k * 0.55}" y1="${Y - 3}" x2="${Xo + s.fo * k * 0.55}" y2="${Y + 3}" stroke="#2d3047"/>`
          + txt(Xo + s.fo * k * 0.55, Y + 14, 'F', 'm');
      } else {
        lenses += `<ellipse cx="${Xo}" cy="${Y}" rx="9" ry="52" fill="rgba(180,180,180,.2)" stroke="#aaa" stroke-dasharray="4 3" stroke-width="2"/>` + txt(Xo, Y + 66, '物镜座', 'm');
      }
      if (s.fe) {
        lenses += `<ellipse cx="${Xe}" cy="${Y}" rx="6" ry="36" fill="rgba(120,210,160,.45)" stroke="#00a37a" stroke-width="2.5"/>`
          + txt(Xe, Y + 52, '目镜', 'ok') + txt(Xe, Y + 64, 'f=' + s.fe, 'm');
      } else {
        lenses += `<ellipse cx="${Xo + 100}" cy="${Y}" rx="6" ry="36" fill="rgba(180,180,180,.2)" stroke="#aaa" stroke-dasharray="4 3" stroke-width="2"/>` + txt(Xo + 100, Y + 52, '目镜座', 'm');
      }
      const tube = s.fo && s.fe ? `<rect x="${Xo + 10}" y="${Y - 30}" width="${Math.max(Xe - Xo - 20, 10)}" height="60" rx="8" fill="rgba(80,100,140,.12)" stroke="#7a8bb0" stroke-width="2"/>`
        + `<g data-drag="L" data-map="abs" data-px="${k * 0.7}" style="cursor:ew-resize"><rect x="${Xe - 14}" y="${Y - 34}" width="18" height="68" rx="4" fill="rgba(47,124,246,.25)" stroke="#2f7cf6"/></g>` : '';
      if (c.ready && c.stage === 'ok') {
        // intermediate image near Fo
        const xi = Xo + s.fo * k * 0.55;
        rays = ray(Xo, Y - 22, xi, Y + 18, '#ff9f1a') + ray(Xo, Y + 6, xi, Y + 18, '#00a37a')
          + `<line x1="${xi}" y1="${Y}" x2="${xi}" y2="${Y + 18}" stroke="#e8505b" stroke-width="2.5" marker-end="url(#ahR)"/>`
          + txt(xi, Y + 30, '倒立缩小实像', 'r')
          + ray(xi, Y + 18, Xe, Y - 10, '#ff9f1a') + ray(xi, Y + 18, Xe, Y + 10, '#00a37a');
      } else if (c.ready) {
        const xi = Xo + s.fo * k * 0.55;
        rays = ray(Xo, Y - 22, xi, Y + 14, '#ff9f1a') + `<circle cx="${xi}" cy="${Y + 14}" r="3" fill="#e8505b"/>`;
      }
      const mag = c.ready ? c.M : 1;
      const eye = (() => {
        const blur = !c.ready || c.stage !== 'ok';
        const size = 12 + (c.ready && c.stage === 'ok' ? Math.min(mag, 8) * 3 : 0);
        return `<g transform="translate(268,10)">
          <rect width="86" height="86" rx="43" fill="#1a2030" stroke="#445" stroke-width="3"/>
          <circle cx="43" cy="43" r="36" fill="#0d1520"/>
          <text x="43" y="40" text-anchor="middle" font-size="${size}" ${blur ? 'opacity=".35" filter="url(#blur)"' : ''} transform="rotate(180 43 36)">${tip}</text>
          <text x="43" y="64" text-anchor="middle" fill="${c.stage === 'ok' ? '#9fef9f' : '#efbf6f'}" font-size="10" font-weight="800">${!c.ready ? '先装透镜' : c.stage === 'ok' ? `清晰 · 视角×${f1(mag)}` : c.stage === 'short' ? '镜筒太短' : c.stage === 'long' ? '镜筒太长' : '接近对焦'}</text>
          <text x="43" y="98" class="st m" text-anchor="middle">目镜视野</text>
        </g>`;
      })();
      const naked = `<g transform="translate(268,118)">
        <rect width="86" height="50" rx="10" fill="#fff" stroke="#cfd6ea"/>
        <text x="43" y="28" text-anchor="middle" font-size="14">${tip}</text>
        <text x="43" y="44" text-anchor="middle" class="st m">裸眼视角（小）</text>
      </g>`;
      const status = !c.ready ? '动手组装：选长焦距物镜 + 短焦距目镜'
        : c.stage === 'ok' ? `✅ 对焦成功！L≈f物+f目=${f1(c.ideal)} cm，视角放大 ≈ ${f1(c.M)} 倍`
        : `目标镜筒长 ≈ ${f1(c.ideal)} cm（现在 ${f1(s.L)} cm）`;
      return `<svg viewBox="0 0 360 210" class="sim-svg" style="touch-action:none">${arrowDefs}
        <defs><filter id="blur"><feGaussianBlur stdDeviation="2.4"/></filter></defs>
        <rect width="360" height="210" fill="#f7fbff"/>
        <line x1="8" y1="${Y}" x2="250" y2="${Y}" stroke="#9aa3bf" stroke-width="2"/>
        ${parallel}${tube}${lenses}${rays}${eye}${naked}
        ${txt(140, 16, status, c.stage === 'ok' ? 'ok b' : 'm')}
      </svg>`;
    },
    read(s) {
      const c = teleCalc(s);
      if (!c.ready) return [['物镜', '未选', 'r'], ['目镜', '未选', 'r'], ['状态', '组装中', '']];
      return [
        ['理想筒长', f1(c.ideal) + ' cm', 'bl'],
        ['当前 L', f1(s.L) + ' cm', c.focus ? 'ok' : ''],
        ['视角放大', `≈ f物/f目 = ${f1(c.M)}`, c.focus ? 'ok' : ''],
      ];
    },
    tip(s) {
      const c = teleCalc(s);
      if (!c.ready) return '开普勒望远镜：物镜焦距<b>长</b>，目镜焦距<b>短</b>。远处物体的像成在物镜焦点附近（倒立缩小实像），目镜再把它放大，<b>视角变大</b>，看起来更近。';
      if (c.stage === 'ok') return `镜筒长 L ≈ f物 + f目 = ${s.fo}+${s.fe}=<b>${f1(c.ideal)} cm</b>。视角放大率 ≈ f物/f目 = <b>${f1(c.M)}</b>。最终像是倒立的。和显微镜比：显微镜物镜焦距短、看近处；望远镜物镜焦距长、看远处。`;
      return `把镜筒调到约 <b>${f1(c.ideal)} cm</b>（f物+f目）。太短或太长，目镜视野都会模糊。`;
    },
    tasks: [
      { t: '选出<b>长焦距物镜</b>（≥16 cm）和<b>短焦距目镜</b>（≤4 cm）', hint: '望远镜和显微镜刚好相反：物镜要长、目镜要短', check: s => s.fo >= 16 && s.fe > 0 && s.fe <= 4 },
      { t: '调节镜筒长度，使 L ≈ f物 + f目，目镜视野<b>清晰</b>', hint: '看读数区的「理想筒长」', check: (s) => teleCalc(s).focus },
      { t: '换一个观察目标，体会视角被放大', hint: '切换月亮 / 塔 / 鸟，对焦后视野里目标明显变大', check: (s) => teleCalc(s).focus && s.target !== 'moon' },
      { t: '说出望远镜与显微镜的关键区别（读提示）', hint: '物镜焦距：望远要长、显微要短；一个看远、一个看近', check: (s) => teleCalc(s).focus && s.fo >= 16 && s.fe <= 4 },
    ],
  };


  const SIMS = [light, lens, lever, buoy, ohm, magnifier, microscope, telescope];
  const BY = Object.fromEntries(SIMS.map(s => [s.id, s]));
  let prog = store.get('wl_sim', {});   // id -> 已完成任务数组 [true,...]
  const doneN = id => (prog[id] || []).filter(Boolean).length;
  const totalTasks = SIMS.reduce((a, s) => a + s.tasks.length, 0);

  /* ---------- 菜单 ---------- */
  function openLab() {
    C.stopAll(); C.setView('lab'); C.setBrand('🔬 物理实验室');
    $('#labMenu').innerHTML = SIMS.map(s => {
      const d = doneN(s.id), n = s.tasks.length;
      return `<button class="game-tile ${s.cls}" data-sim="${s.id}"><div class="gt-emoji">${s.emoji}</div><div class="gt-body"><div class="gt-name">${s.name}</div><div class="gt-desc">${s.desc}</div></div><div class="gt-best">${d === n ? '🏅 ' : ''}${d}/${n}</div></button>`;
    }).join('');
    C.show('scrLab');
  }
  $('#labMenu').addEventListener('click', e => { const t = e.target.closest('[data-sim]'); if (t) { SFX.tap(); openSim(t.dataset.sim, 'lab'); } });

  /* ---------- 模拟页 ---------- */
  let cur = null, st = null, from = 'lab', ti = 0, armed = false, celebrating = false;
  function openSim(id, src) {
    C.stopAll(); $('#modal').hidden = true;
    cur = BY[id]; from = src || 'lab'; st = cur.init(); armed = false; celebrating = false;
    if (cur.ch && C.track) C.track('c', cur.ch);
    C.setView('sim'); C.setBrand(cur.emoji + ' ' + cur.name);
    ti = firstTodo();
    if (ti < cur.tasks.length && cur.tasks[ti].setup) cur.tasks[ti].setup(st);
    buildCtrls(); update(); C.show('scrSim');
  }
  const firstTodo = () => { const p = prog[cur.id] || []; let i = 0; while (i < cur.tasks.length && p[i]) i++; return i; };
  function buildCtrls() {
    $('#simCtrl').innerHTML = cur.ctrls.map(c => {
      if (c.type === 'range') return `<div class="sc-row"><div class="sc-l">${c.label}<b data-out="${c.key}"></b></div><input type="range" data-k="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}"></div>`;
      if (c.type === 'seg') return `<div class="sc-row"><div class="sc-l">${c.label}</div><div class="seg" data-seg="${c.key}">${c.opts.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join('')}</div></div>`;
      if (c.type === 'tray') return `<div class="sc-row tray-row"><div class="sc-l">${c.label}</div><div class="tray" data-tray="${c.key}">${c.opts.map(([v, l, tip]) => `<button class="tray-chip" data-v="${v}" title="${tip || ''}">${l}</button>`).join('')}</div></div>`;
      if (c.type === 'note') return `<div class="sc-note">${c.html}</div>`;
      return `<div class="sc-row step"><div class="sc-l">${c.label}</div><div class="stepper"><button data-st="${c.key}" data-d="-1">−</button><b data-out="${c.key}"></b><button data-st="${c.key}" data-d="1">＋</button></div></div>`;
    }).join('');
  }
  function syncCtrls() {
    cur.ctrls.forEach(c => {
      if (c.type === 'note') return;
      const out = $(`[data-out="${c.key}"]`, $('#simCtrl')); if (out) out.textContent = c.fmt(st[c.key]);
      const r = $(`input[data-k="${c.key}"]`); if (r && +r.value !== st[c.key]) r.value = st[c.key];
      $$(`[data-seg="${c.key}"] button`).forEach(b => b.classList.toggle('on', String(st[c.key]) === b.dataset.v));
      $$(`[data-tray="${c.key}"] .tray-chip`).forEach(b => b.classList.toggle('on', String(st[c.key]) === b.dataset.v));
    });
  }
  function change(key, v) { if (st[key] === v) return; st[key] = v; armed = true; update(); }
  $('#simCtrl').addEventListener('input', e => { const r = e.target.closest('input[data-k]'); if (r) change(r.dataset.k, +r.value); });
  $('#simCtrl').addEventListener('click', e => {
    const sb = e.target.closest('.seg button');
    if (sb) { SFX.tap(); const key = sb.parentNode.dataset.seg, c = cur.ctrls.find(x => x.key === key); const v = c.opts.find(o => String(o[0]) === sb.dataset.v)[0]; return change(key, v); }
    const tb = e.target.closest('.tray-chip');
    if (tb) { SFX.flip(); const key = tb.parentNode.dataset.tray, c = cur.ctrls.find(x => x.key === key); const raw = c.opts.find(o => String(o[0]) === tb.dataset.v)[0]; return change(key, typeof raw === 'number' ? raw : raw); }
    const pb = e.target.closest('[data-st]');
    if (pb) { SFX.tap(); const c = cur.ctrls.find(x => x.key === pb.dataset.st); change(c.key, clamp(st[c.key] + +pb.dataset.d, c.min, c.max)); }
  });
  let drag = null;
  (function bindStageDrag() {
    const stage = $('#simStage');
    const svgPos = e => {
      const svg = stage.querySelector('svg'); if (!svg) return null;
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      return { x: (e.clientX - r.left) / r.width * vb.width, y: (e.clientY - r.top) / r.height * vb.height, svg };
    };
    stage.addEventListener('pointerdown', e => {
      const h = e.target.closest('[data-drag]'); if (!h || !cur) return;
      const key = h.dataset.drag, c = cur.ctrls.find(x => x.key === key && x.type === 'range'); if (!c) return;
      drag = { key, c, map: h.dataset.map || '', px: +(h.dataset.px || 1), lensx: +(h.dataset.lensx || 0) };
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); SFX.tap();
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = svgPos(e); if (!p) return;
      const step = drag.c.step || 1;
      let v;
      if (drag.map === 'left') v = (drag.lensx - p.x) / drag.px;
      else if (drag.map === 'abs') v = p.x / drag.px;
      else v = p.x / drag.px;
      v = clamp(Math.round(v / step) * step, drag.c.min, drag.c.max);
      // Avoid full redraw thrash: patch state + soft update when value changes
      if (st[drag.key] !== v) { st[drag.key] = v; armed = true; softUpdate(); }
      e.preventDefault();
    });
    const up = () => { drag = null; };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  })();
  function softUpdate() {
    syncCtrls();
    $('#simStage').innerHTML = cur.draw(st);
    $('#simRead').innerHTML = cur.read(st).map(([k, v, c]) => `<div class="sr ${c}"><span>${k}</span><b>${v}</b></div>`).join('');
    $('#simTips').innerHTML = '💡 ' + cur.tip(st);
    drawTask();
    if (armed && !celebrating && ti < cur.tasks.length && cur.tasks[ti].check(st, cur)) complete();
  }
  function update() { softUpdate(); }
  function drawTask(justDone) {
    const n = cur.tasks.length, p = prog[cur.id] || [];
    const dots = cur.tasks.map((_, k) => `<span class="td${p[k] ? ' on' : ''}${k === ti && !justDone ? ' cur' : ''}"></span>`).join('');
    let body;
    if (justDone) body = `<div class="tk-t okc">✅ 任务完成！${justDone}</div>`;
    else if (ti >= n) body = `<div class="tk-t">🏅 全部任务完成！可以自由探究，或 <button class="btn mini" id="simReset">重做任务</button></div>`;
    else body = `<div class="tk-t">🎯 任务 ${ti + 1}/${n}：${cur.tasks[ti].t}</div><details class="tk-h"><summary>💭 提示</summary>${cur.tasks[ti].hint}</details>`;
    $('#simTask').innerHTML = `<div class="tk-dots">${dots}</div>${body}`;
    const rs = $('#simReset'); if (rs) rs.onclick = () => { prog[cur.id] = []; store.set('wl_sim', prog); ti = 0; armed = false; if (cur.tasks[0].setup) { cur.tasks[0].setup(st); } update(); };
  }
  function complete() {
    celebrating = true;
    const p = prog[cur.id] || []; p[ti] = true; prog[cur.id] = p; store.set('wl_sim', prog);
    C.record(true);
    SFX.clear();
    const all = doneN(cur.id) === cur.tasks.length;
    drawTask(all ? '这个实验的徽章到手 🏅' : '');
    $('#simTask').classList.remove('pop'); void $('#simTask').offsetWidth; $('#simTask').classList.add('pop');
    toast(all ? '🏅 实验全部完成！' : '✅ 任务完成！');
    setTimeout(() => {
      if (!cur) return;
      celebrating = false; armed = false;
      ti = firstTodo();
      if (ti < cur.tasks.length && cur.tasks[ti].setup) cur.tasks[ti].setup(st);
      update();
    }, 1400);
  }
  function simBack() { const f = from; cur = null; if (f.startsWith('chapter:')) W.openChapter(f.slice(8)); else openLab(); }

  W.openLab = openLab; W.openSim = openSim; W.simBack = simBack;
  W.labSummary = () => { const d = SIMS.reduce((a, s) => a + doneN(s.id), 0); return d ? `🏅 ${d}/${totalTasks}` : ''; };
  W.sim = { SIMS, debug: () => ({ id: cur && cur.id, st, ti, celebrating, armed }), set: change };
  C.refreshMenu();
})();
