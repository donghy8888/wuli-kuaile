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

  const SIMS = [light, lens, lever, buoy, ohm];
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
      return `<div class="sc-row step"><div class="sc-l">${c.label}</div><div class="stepper"><button data-st="${c.key}" data-d="-1">−</button><b data-out="${c.key}"></b><button data-st="${c.key}" data-d="1">＋</button></div></div>`;
    }).join('');
  }
  function syncCtrls() {
    cur.ctrls.forEach(c => {
      const out = $(`[data-out="${c.key}"]`, $('#simCtrl')); if (out) out.textContent = c.fmt(st[c.key]);
      const r = $(`input[data-k="${c.key}"]`); if (r && +r.value !== st[c.key]) r.value = st[c.key];
      $$(`[data-seg="${c.key}"] button`).forEach(b => b.classList.toggle('on', String(st[c.key]) === b.dataset.v));
    });
  }
  function change(key, v) { if (st[key] === v) return; st[key] = v; armed = true; update(); }
  $('#simCtrl').addEventListener('input', e => { const r = e.target.closest('input[data-k]'); if (r) change(r.dataset.k, +r.value); });
  $('#simCtrl').addEventListener('click', e => {
    const sb = e.target.closest('.seg button');
    if (sb) { SFX.tap(); const key = sb.parentNode.dataset.seg, c = cur.ctrls.find(x => x.key === key); const v = c.opts.find(o => String(o[0]) === sb.dataset.v)[0]; return change(key, v); }
    const pb = e.target.closest('[data-st]');
    if (pb) { SFX.tap(); const c = cur.ctrls.find(x => x.key === pb.dataset.st); change(c.key, clamp(st[c.key] + +pb.dataset.d, c.min, c.max)); }
  });
  function update() {
    syncCtrls();
    $('#simStage').innerHTML = cur.draw(st);
    $('#simRead').innerHTML = cur.read(st).map(([k, v, c]) => `<div class="sr ${c}"><span>${k}</span><b>${v}</b></div>`).join('');
    $('#simTips').innerHTML = '💡 ' + cur.tip(st);
    drawTask();
    if (armed && !celebrating && ti < cur.tasks.length && cur.tasks[ti].check(st, cur)) complete();
  }
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
