/* 🍉 切西瓜复习游戏：题源 = 今天复习/练习过的公式卡、章节知识点、常数（wl_today），不足 4 个用近期高频补足。
   引擎在 slice.js（WLSlice），这里负责出题、积分（每多玩一局 +10%，最多 2 倍）、勋章「切瓜大师」、错题收进错题本。 */
(function () {
  'use strict';
  const { FORMULAS, CHAPTERS, FACTS } = window.PHY;
  const K = window.WL.core, { store, shuffle, rand, toast } = K;
  const FM = Object.fromEntries(FORMULAS.map(f => [f.id, f]));
  const CH = K.CH;
  const MN = {
    v: '路程除以时间，“走多远 ÷ 用多久”', rho: '“质量除以体积”，同体积越重越“密”', G: '重力 = 质量 × g（g≈9.8 N/kg，常取 10）',
    p: '压力 ÷ 受力面积，面积越小压强越大（针尖、刀刃）', pl: '液体压强只看 ρ 和深度 h，“越深越大”', fa: '浮力 = 排开液体的重力，“排多少、浮多少”',
    fw: '空气中称一次、水中称一次，“差值就是浮力”', W: '力 × 沿力方向移动的距离，“有力有距离才做功”', P: '做功快慢：功 ÷ 时间',
    lev: '动力 × 动力臂 = 阻力 × 阻力臂，“臂长力就小”', eta: '有用功占总功的比例，永远小于 100%', Q: '比热容 × 质量 × 温度变化，“c m 德尔塔 t”',
    Qq: '燃料放热 = 质量 × 热值', I: '“电流等于电压除以电阻”——欧姆定律', Rs: '串联电阻“首尾相连，直接相加”',
    We: '电功 = 电压 × 电流 × 时间，“UIt”', Pe: '电功率 = 电压 × 电流，“P 等于 UI”', Qj: '电热 = 电流平方 × 电阻 × 时间，“I 方 R t”',
  };
  const DEF = ['v', 'rho', 'G', 'p', 'I', 'W', 'P', 'fa', 'Pe'];
  const BOX = '<span class="sl-qbox">?</span>';
  const strip = h => String(h).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const norm = h => strip(h).replace(/\s+/g, '');
  const uniq = (ans, list) => { const seen = new Set([norm(ans)]), out = []; list.forEach(x => { const k = norm(x); if (k && !seen.has(k)) { seen.add(k); out.push(x); } }); return out; };
  const today = () => K.dayStr(Date.now());
  const fx = s => `<span class="sl-f">${s}</span>`;

  function revF(f) {
    return `<div class="sl-bt">📐 ${f.name}</div><div class="sl-bf">${f.f}</div>` + (f.alts && f.alts.length ? `<div class="sl-bs">变形：${f.alts.join('　')}</div>` : '')
      + `<div class="sl-bs">💡 ${MN[f.id] || ''}${f.unit ? '　· 单位 ' + f.unit : ''}</div>`;
  }
  function fItem(f) {
    const types = ['name', 'name'];
    if (f.blanks && f.blanks.length) types.push('blank', 'blank');
    if (f.alts && f.alts.length) types.push('alt');
    if (f.unit) types.push('unit');
    const ty = rand(types), lab = `📐 ${f.name} · 切出方框里的内容`;
    let prompt, answer, opts;
    if (ty === 'name') {
      prompt = `<div class="sl-name">${f.name}</div><div class="sl-fx">${BOX}</div>`; answer = f.f;
      opts = uniq(answer, shuffle(FORMULAS.filter(o => o.id !== f.id && !(f.excl || []).includes(o.id))).map(o => o.f));
    } else if (ty === 'blank') {
      const b = rand(f.blanks); prompt = `<div class="sl-fx">${b.show.replace('□', BOX)}</div>`; answer = b.ans; opts = uniq(answer, shuffle(b.opts));
    } else if (ty === 'alt') {
      const a = rand(f.alts), i = a.indexOf('='), lhs = a.slice(0, i).trim(); answer = a.slice(i + 1).trim();
      prompt = `<div class="sl-sub">由 ${fx(f.f)} 变形</div><div class="sl-fx">${lhs} = ${BOX}</div>`;
      const pool = FORMULAS.flatMap(o => [o.f, ...(o.alts || [])]).map(x => x.slice(x.indexOf('=') + 1).trim());
      opts = uniq(answer, shuffle(pool));
    } else {
      prompt = `<div class="sl-name">${f.name}</div><div class="sl-fx">${f.f.split('=')[0].trim()} 的单位：${BOX}</div>`; answer = f.unit;
      opts = uniq(answer, shuffle(FORMULAS.map(o => o.unit).filter(Boolean)));
    }
    opts = opts.slice(0, 4);
    return { key: 'f:' + f.id + ':' + ty, label: lab, prompt, answer: fx(answer), opts: opts.map(fx), reveal: revF(f),
      wq: { t: 'c', id: 'slice-' + f.id + '-' + ty, ch: 'rush', q: '🍉 ' + strip(prompt.replace(BOX, '____')), opts: [answer, ...opts.slice(0, 3)], ex: `${f.name}：${f.f}。${MN[f.id] || ''}`, hint: '' } };
  }
  function qItem(q, label, title) {
    return { key: 'q:' + q.id, label: label + ' · 切出方框里的内容', prompt: `<div class="sl-qt">${q.q} ${BOX}</div>`, answer: q.opts[0], opts: q.opts.slice(1),
      reveal: `<div class="sl-bt">${title}</div><div class="sl-bf sm">${q.q.replace(/[？?]$/, '')} <u>${q.opts[0]}</u></div><div class="sl-bs">💡 ${q.ex}</div>`, wq: q };
  }
  const okQ = q => q.t === 'c' && q.opts && q.opts.length >= 3 && q.opts.every(o => strip(o).length <= 18) && !/下列|哪个|哪些|正确的是|错误的是/.test(q.q) && strip(q.q).length <= 40;
  function cItem(c) {
    const fs = c.formulas.map(x => FORMULAS.find(f => f.f === x.f || f.name === x.n)).filter(Boolean);
    const qs = c.qs.filter(okQ);
    if (fs.length && (Math.random() < 0.45 || !qs.length)) return fItem(rand(fs));
    if (!qs.length) return null;
    return qItem(rand(qs), `${c.emoji} ${c.name}`, `${c.emoji} ${c.name}`);
  }
  function kItem(id) { const q = FACTS.find(x => x.id === id); return q ? qItem(q, '🔢 常数换算', '🔢 常数 & 换算') : null; }
  function mk(s) { return s.k === 'f' ? (FM[s.id] ? fItem(FM[s.id]) : null) : s.k === 'c' ? (CH[s.id] ? cItem(CH[s.id]) : null) : kItem(s.id); }

  /* 题源：今天复习过的 → 不足 4 个用近期高频补足 */
  function pool() {
    const t = store.get('wl_today', null), src = [], has = new Set();
    const add = (k, id) => { const key = k + ':' + id; if (has.has(key)) return; has.add(key); src.push({ k, id }); };
    if (t && t.d === today()) ['f', 'c', 'k'].forEach(k => Object.entries(t[k] || {}).sort((a, b) => b[1] - a[1]).forEach(([id]) => add(k, id)));
    const nToday = src.length;
    if (src.length < 4) {
      const fq = store.get('wl_freq', { f: {}, c: {}, k: {} }), all = [];
      ['f', 'c', 'k'].forEach(k => Object.entries(fq[k] || {}).forEach(([id, n]) => all.push([k, id, n])));
      all.sort((a, b) => b[2] - a[2]).forEach(([k, id]) => { if (src.length < 6) add(k, id); });
      DEF.forEach(id => { if (src.length < 6) add('f', id); });
    }
    return { src, nToday };
  }
  function build() {
    const { src, nToday } = pool(), items = [];
    let order = shuffle(src), g = 0, last = '';
    while (items.length < 10 && g++ < 200) {
      const s = order[g % order.length]; if (g % order.length === 0) order = shuffle(src);
      const it = mk(s); if (!it || it.opts.length < 2 || it.key === last) continue;
      last = it.key; items.push(it);
    }
    return { items, nToday };
  }

  /* 积分 */
  const S = () => Object.assign({ best: 0, perfect: 0, total: 0, days: {} }, store.get('wl_slice', {}));
  const bonusOf = plays => Math.min(2, 1 + 0.1 * plays);
  function onEnd(res) {
    const s = S(), d = today(), day = s.days[d] || { plays: 0, pts: 0 };
    const bonus = bonusOf(day.plays), pts = Math.round(res.correct * 10 * bonus);
    day.plays++; day.pts += pts; s.days[d] = day; s.total += pts;
    Object.keys(s.days).sort().slice(0, -14).forEach(k => delete s.days[k]);
    const newBest = res.score > s.best; if (newBest) s.best = res.score;
    const perfect = res.rounds >= 10 && res.correct === res.rounds && !res.wrong;
    if (perfect) s.perfect++;
    store.set('wl_slice', s); K.refreshMenu();
    const acc = res.correct / Math.max(1, res.rounds);
    const stars = res.rounds < 10 ? (acc >= 0.7 ? 1 : 0) : acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    const title = perfect ? '🏅 切瓜大师！全部切对' : res.lives <= 0 ? '💔 心用完啦，再来一局！' : stars >= 2 ? '🍉 切得漂亮！' : '💪 继续加油！';
    return { stars, title, best: s.best, newBest, nextBonus: bonusOf(day.plays).toFixed(1),
      pointsHtml: `🎁 获得积分 <b>+${pts}</b>（切对 ${res.correct} 个 × 10${bonus > 1 ? ' × 奖励' + bonus.toFixed(1) : ''}）· 累计 ${s.total}`
        + (perfect ? `<div class="sl-medal">🏅 获得勋章「切瓜大师」${s.perfect > 1 ? ' ×' + s.perfect : ''}</div>` : '') };
  }
  function openSlice() {
    K.stopAll(); const m = document.getElementById('modal'); if (m) m.hidden = true; SFX.unlock(); K.setView('home');
    const { items, nToday } = build();
    if (!items.length) { toast('题目准备失败，先去公式卡片练一练吧'); return; }
    if (nToday < 4) toast(nToday ? `🍉 今天复习了 ${nToday} 项，补充了几张高频卡片` : '🍉 今天还没复习，先用高频卡片来一局');
    WLSlice.start({ items, rounds: 10, sfx: (k, o) => { if (SFX[k]) SFX[k](o); },
      onWeak: it => { if (it.wq) K.addWrong(it.wq); }, onEnd, onReplay: openSlice, onQuit: () => window.WL.goHome() });
  }
  function sliceSummary() {
    refreshDesc();
    const s = S(), d = s.days[today()];
    return (s.best ? '最高 ' + s.best : '') + (s.perfect ? ' 🏅' : '') + (d && d.plays ? `<br><small>下一局×${bonusOf(d.plays).toFixed(1)}</small>` : '');
  }
  function refreshDesc() {
    const el = document.getElementById('sliceDesc'); if (!el) return;
    const t = store.get('wl_today', null), n = t && t.d === today() ? ['f', 'c', 'k'].reduce((a, k) => a + Object.keys(t[k] || {}).length, 0) : 0;
    el.innerHTML = (n ? `今天复习过 <b>${n}</b> 项 · ` : '') + '复习过的公式和知识点变成西瓜，切出正确答案！';
  }
  Object.assign(window.WL, { openSlice, sliceSummary, slicePool: pool, sliceBuild: build });
  const rm = K.refreshMenu;
  K.refreshMenu = function () { rm(); refreshDesc(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshDesc(); });
  rm(); refreshDesc();
})();
