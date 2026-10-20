/* 快乐掌握物理 —— 主逻辑：闯关 / 大乱斗 / 公式抢答 / 单位连连看 / 错题本 / 公式卡 */
(function () {
  'use strict';
  const { CHAPTERS, GRADES, FORMULAS, UNITS, FACTS } = window.PHY;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const CH = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));
  const FACT_G = ['8a', '8a', '8a', '8a', '8a', '8b', '8b', '9', '9', '9', '9', '9', '9', '8a', '8a'];
  FACTS.forEach((f, i) => (f.g = FACT_G[i] || 'all'));

  /* ---------- 存储 ---------- */
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const settings = Object.assign({ time: 60, scope: 'all' }, store.get('wl_settings', {}));
  const best = store.get('wl_best', {});            // rush / match / blitz / lv:<id>
  const stars = store.get('wl_stars', {});          // chapterId -> 0..3
  let wrongBook = store.get('wl_wrong', {});        // qid -> {n, t, q}
  const stat = Object.assign({ done: 0, right: 0, streak: 0, last: '' }, store.get('wl_stat', {}));
  const saveWrong = () => store.set('wl_wrong', wrongBook);
  const snap = q => ({ t: q.t, tag: q.tag, q: q.q, opts: q.opts, ans: q.ans, unit: q.unit, ex: q.ex, hint: q.hint, id: q.id, ch: q.ch });
  function addWrong(q) { const w = wrongBook[q.id] || { n: 0 }; w.n++; w.t = Date.now(); w.q = snap(q); wrongBook[q.id] = w; saveWrong(); }
  function delWrong(id) { if (wrongBook[id]) { delete wrongBook[id]; saveWrong(); } }
  const dayStr = d => { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };
  function record(ok) {
    stat.done++; if (ok) stat.right++;
    const today = dayStr(Date.now()), yest = dayStr(Date.now() - 864e5);
    if (stat.last !== today) { stat.streak = stat.last === yest ? stat.streak + 1 : 1; stat.last = today; }
    store.set('wl_stat', stat);
  }
  /* 今日复习记录（切西瓜复习游戏的题源）：wl_today = {d, f:{公式id:次数}, c:{章节id:次数}, k:{常数id:次数}}；wl_freq 为累计次数 */
  function track(kind, id) {
    if (!id) return;
    const d = dayStr(Date.now());
    let t = store.get('wl_today', null); if (!t || t.d !== d) t = { d, f: {}, c: {}, k: {} };
    t[kind][id] = (t[kind][id] || 0) + 1; store.set('wl_today', t);
    const fq = store.get('wl_freq', { f: {}, c: {}, k: {} }); fq[kind] = fq[kind] || {}; fq[kind][id] = (fq[kind][id] || 0) + 1; store.set('wl_freq', fq);
  }
  function trackQ(q) {
    if (!q || !q.id) return;
    const m = /^d[bt]-([A-Za-z]+)-/.exec(q.id);
    if (m) return track('f', m[1]);
    if (/^fact-/.test(q.id)) return track('k', q.id);
    if (CH[q.ch]) track('c', q.ch);
  }
  const inScope = g => settings.scope === 'all' || g === settings.scope;

  let toastTimer;
  function toast(msg, ms = 2200) {
    const t = $('#toast'); t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ---------- 屏幕切换 ---------- */
  let current = null, view = 'home', viewArg = null;
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    $('#btnHome').hidden = id === 'scrHome';
    const el = document.getElementById(id);
    $('#hud').hidden = !(el && el.dataset.hud);
    window.scrollTo(0, 0);
  }
  function stopAll() { if (current) { current.stop(); current = null; } $('#countdown').hidden = true; }
  function setBrand(t) { $('#brand').textContent = t; }

  /* ---------- HUD & 计时 ---------- */
  const hud = {
    score: 0, combo: 0, maxCombo: 0,
    reset() { this.score = 0; this.combo = 0; this.maxCombo = 0; this.draw(); },
    add(base) { this.score += base + Math.min(this.combo, 10) * 2; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); this.draw(true); },
    miss() { this.combo = 0; this.draw(); },
    draw(hot) {
      $('#hudScore').textContent = this.score;
      const c = $('#hudCombo'); c.textContent = this.combo ? '×' + this.combo : '0';
      c.classList.remove('hot'); if (hot && this.combo >= 3) { void c.offsetWidth; c.classList.add('hot'); }
    },
  };
  function Timer(seconds, onEnd) {
    let end = 0, total = seconds * 1000, iv = null, lastSec = null;
    const draw = () => {
      const left = Math.max(0, end - performance.now());
      const sec = Math.ceil(left / 1000);
      $('#hudTime').textContent = sec;
      $('#timebarFill').style.width = (left / total * 100) + '%';
      $('#timebarFill').style.backgroundPosition = (100 - left / total * 100) + '% 0';
      $('.hud .timer').classList.toggle('low', sec <= 10);
      if (sec !== lastSec && sec <= 5 && sec > 0) SFX.tick();
      lastSec = sec;
      if (left <= 0) { this.stop(); onEnd(); }
    };
    this.start = () => { end = performance.now() + seconds * 1000; draw(); iv = setInterval(draw, 100); };
    this.stop = () => { clearInterval(iv); iv = null; };
    this.bonus = s => { end += s * 1000; total = Math.max(total, end - performance.now()); draw(); };
    this.preview = () => { $('#hudTimeK').textContent = '时间'; $('#hudTime').textContent = seconds; $('#timebarFill').style.width = '100%'; $('.hud .timer').classList.remove('low'); };
  }
  function progress(i, n) {
    $('#hudTimeK').textContent = '进度';
    $('#hudTime').textContent = Math.min(i + 1, n) + '/' + n;
    $('#timebarFill').style.width = ((n - i) / n * 100) + '%';
    $('#timebarFill').style.backgroundPosition = '0 0';
    $('.hud .timer').classList.remove('low');
  }
  function countdown(cb) {
    const el = $('#countdown'); el.hidden = false;
    const seq = ['3', '2', '1', 'GO!']; let i = 0;
    const step = () => {
      if (!current) { el.hidden = true; return; }
      if (i >= seq.length) { el.hidden = true; cb(); return; }
      el.innerHTML = `<span>${seq[i]}</span>`;
      i === 3 ? SFX.go() : SFX.tick();
      i++; setTimeout(step, i === 4 ? 350 : 450);
    };
    step();
  }

  /* ---------- 结算 ---------- */
  function finish({ title, key, stats: st, misses, starN, again, next }) {
    SFX.end();
    const old = best[key] || 0, rec = hud.score > old;
    if (rec) { best[key] = hud.score; store.set('wl_best', best); }
    $('#mTitle').textContent = title;
    const ms = $('#mStars');
    ms.hidden = starN == null;
    if (starN != null) ms.innerHTML = [0, 1, 2].map(i => `<span class="${i < starN ? 'on' : ''}" style="animation-delay:${i * .18}s">★</span>`).join('');
    $('#mRecord').hidden = !rec || hud.score === 0;
    $('#mStats').innerHTML = [['得分', hud.score], ['最佳', Math.max(old, hud.score)], ['最高连击', hud.maxCombo], ...st]
      .map(([k, v]) => `<div class="m-stat"><b>${v}</b><span>${k}</span></div>`).join('');
    $('#mMiss').innerHTML = misses && misses.length
      ? '<h4>❌ 本局答错（已收进错题本）</h4>' + misses.map(q => `<div class="mrow lab-mrow"><span>${q.q}</span><b>${answerText(q)}</b></div>`).join('')
      : '<p style="text-align:center">🎉 一个都没错，太强了！</p>';
    $('#btnNextLv').hidden = !next;
    $('#btnNextLv').onclick = () => { $('#modal').hidden = true; next && next(); };
    $('#btnAgain').onclick = () => { $('#modal').hidden = true; again(); };
    $('#modal').hidden = false;
  }
  const answerText = q => q.t === 'c' ? q.opts[0] : q.t === 'tf' ? (q.ans ? '✔ 正确' : '✘ 错误') : q.ans + ' ' + q.unit;

  /* =========================================================
   * 答题引擎：level 闯关 / blitz 大乱斗 / rush 公式抢答 / practice 错题练习
   * ========================================================= */
  function genRush() {
    const fs = FORMULAS.filter(f => inScope(f.g));
    const us = UNITS.filter(u => inScope(u.g));
    const facts = FACTS.filter(f => inScope(f.g));
    const r = Math.random();
    const others = (f, key) => shuffle(FORMULAS.filter(o => o.id !== f.id && !(f.excl || []).includes(o.id) && o[key] !== f[key])).map(o => o[key]);
    if (r < 0.32 && fs.length) {
      const f = rand(fs);
      return { t: 'c', id: 'rf-' + f.id, ch: 'rush', tag: '🧮 公式', q: `「${f.name}」的公式是？`, opts: [f.f, ...others(f, 'f').slice(0, 3)], ex: `${f.name}：<b>${f.f}</b>${f.unit ? '，结果单位 ' + f.unit : ''}` };
    }
    if (r < 0.55 && fs.length) {
      const f = rand(fs);
      return { t: 'c', id: 'rn-' + f.id, ch: 'rush', tag: '🧮 公式', q: `公式 <span class="fx">${f.f}</span> 是？`, opts: [f.name, ...others(f, 'name').slice(0, 3)], ex: `<b>${f.f}</b> 是${f.name}的公式。` };
    }
    if (r < 0.8 && us.length) {
      const u = rand(us);
      const wrong = shuffle(UNITS.filter(o => o.u !== u.u)).slice(0, 3).map(o => o.u);
      return { t: 'c', id: 'ru-' + u.q, ch: 'rush', tag: '📏 单位', q: `「${u.q}」的国际单位（或常用单位）是？`, opts: [u.u, ...wrong], ex: `${u.q}的单位是 <b>${u.u}</b>。` };
    }
    const f = rand(facts.length ? facts : FACTS);
    return Object.assign({ tag: '🔢 常数与换算' }, f);
  }


  /* ---------- 公式记忆：挖空 / 变形 ---------- */
  function genDrill(kind) {
    const pool = FORMULAS.filter(f => inScope(f.g));
    const use = pool.length ? pool : FORMULAS;
    // 决定题型
    let type = kind;
    if (kind === 'mix') {
      const canB = use.some(f => f.blanks && f.blanks.length);
      const canT = use.some(f => f.alts && f.alts.length);
      type = canB && canT ? (Math.random() < 0.55 ? 'blank' : 'transform') : canB ? 'blank' : 'transform';
    }
    if (type === 'blank') {
      const withB = use.filter(f => f.blanks && f.blanks.length);
      const f = rand(withB.length ? withB : FORMULAS.filter(x => x.blanks && x.blanks.length));
      const b = rand(f.blanks);
      const opts = shuffle(b.opts.slice());
      // ensure ans in opts
      if (!opts.includes(b.ans)) opts[0] = b.ans;
      return {
        t: 'c', id: 'db-' + f.id + '-' + b.show, ch: 'drill', tag: '✏️ 公式挖空',
        q: `「${f.name}」把 □ 补上：<div class="fx-blank">${b.show.replace('□', '<span class="blank">____</span>')}</div>`,
        opts: [b.ans, ...opts.filter(o => o !== b.ans)].slice(0, 4),
        ex: `完整公式是 <b>${f.f}</b>${f.unit ? '，单位 ' + f.unit : ''}。挖空处是 <b>${b.ans}</b>。`,
        hint: `这是「${f.name}」的公式，想想每个字母代表什么。`,
      };
    }
    // transform
    const withA = use.filter(f => f.alts && f.alts.length);
    const f = rand(withA.length ? withA : FORMULAS.filter(x => x.alts && x.alts.length));
    const r = Math.random();
    if (r < 0.4) {
      // 给出原式，选变形
      const right = rand(f.alts);
      const wrong = shuffle(FORMULAS.filter(o => o.id !== f.id).flatMap(o => [o.f, ...(o.alts || [])])).filter(x => x !== right).slice(0, 3);
      return {
        t: 'c', id: 'dt-' + f.id + '-alt', ch: 'drill', tag: '🔄 公式变形',
        q: `已知 <span class="fx">${f.f}</span>，变形后正确的是？`,
        opts: [right, ...wrong].slice(0, 4),
        ex: `由 ${f.f} 变形可得 <b>${f.alts.join('、')}</b>。`,
        hint: `「${f.name}」：把要求的量单独放等号左边。`,
      };
    }
    if (r < 0.7) {
      // 给出变形，认原式名
      const alt = rand(f.alts);
      const wrong = shuffle(FORMULAS.filter(o => o.id !== f.id && !(f.excl || []).includes(o.id)).map(o => o.name)).slice(0, 3);
      return {
        t: 'c', id: 'dt-' + f.id + '-name', ch: 'drill', tag: '🔄 公式变形',
        q: `公式 <span class="fx">${alt}</span> 是由哪个公式变形来的？`,
        opts: [f.name, ...wrong],
        ex: `<b>${alt}</b> 由「${f.name}」${f.f} 变形得到。`,
        hint: `看看式子里有哪些物理量，对应哪个公式。`,
      };
    }
    // 情景：要求某个量用哪个式子
    const target = rand([{ ask: '求质量 m', form: f.alts.find(a => a.trim().startsWith('m')) || f.alts[0] },
      { ask: '把结果量单独放左边', form: f.alts[0] }]);
    // 更稳妥的情景题：直接问“求 XX 时用哪一个”
    const label = f.alts[0];
    const askMap = {
      v: '已知路程和时间，求速度',
      rho: '已知质量和体积，求密度',
      G: '已知质量，求重力',
      p: '已知压力和受力面积，求压强',
      W: '已知力和距离，求功',
      P: '已知功和时间，求功率',
      I: '已知电压和电阻，求电流',
      Pe: '已知电压和电流，求电功率',
      Q: '已知比热容、质量和温度变化，求吸热',
      We: '已知电压、电流和时间，求电功',
    };
    const ask = askMap[f.id] || `使用「${f.name}」时`;
    // 若有对应变形求某个量
    let right = f.f;
    let qtext = `${ask}，应选用？`;
    if (f.id === 'rho' && Math.random() < 0.5) { right = 'm = ρ V'; qtext = '已知密度和体积，求质量，应选用？'; }
    if (f.id === 'v' && Math.random() < 0.5) { right = 's = v t'; qtext = '已知速度和时间，求路程，应选用？'; }
    if (f.id === 'I' && Math.random() < 0.5) { right = 'R = U / I'; qtext = '已知电压和电流，求电阻，应选用？'; }
    if (f.id === 'G' && Math.random() < 0.5) { right = 'm = G / g'; qtext = '已知重力，求质量，应选用？'; }
    if (f.id === 'p' && Math.random() < 0.5) { right = 'S = F / p'; qtext = '已知压力和压强，求受力面积，应选用？'; }
    if (f.id === 'P' && Math.random() < 0.5) { right = 'W = P t'; qtext = '已知功率和时间，求功，应选用？'; }
    if (f.id === 'Pe' && Math.random() < 0.5) { right = 'P = U² / R'; qtext = '已知电压和电阻，求电功率，应选用？'; }
    const wrong = shuffle(FORMULAS.filter(o => o.id !== f.id).map(o => o.f)).slice(0, 3);
    return {
      t: 'c', id: 'dt-' + f.id + '-use', ch: 'drill', tag: '🔄 公式变形',
      q: qtext,
      opts: [right, ...wrong],
      ex: `选用 <b>${right}</b>。原式「${f.name}」：${f.f}${f.alts && f.alts.length ? '；变形：' + f.alts.join('、') : ''}。`,
      hint: `把题目要求的物理量单独放在等号左边。`,
    };
  }

  function QuizGame(opts) {
    this.opts = opts;
    const mode = opts.mode;
    const timed = mode === 'blitz' || mode === 'rush' || mode === 'drill' || mode === 'drill-blank' || mode === 'drill-transform' || mode === 'drill-mix';
    let list = [], i = 0, cur = null, running = false, busy = true, right = 0, wrong = 0, numStr = '';
    const misses = [];
    let timer = null;
    if (mode === 'level') { const ch = CH[opts.ch]; list = ch.qs.slice(0, Math.min(8, ch.qs.length)); /* 由易到难，不打乱 */ }
    else if (mode === 'practice') { list = shuffle(Object.values(wrongBook).map(w => w.q)); }
    else if (mode === 'blitz') { list = shuffle(CHAPTERS.filter(c => inScope(c.grade)).flatMap(c => c.qs)); }
    if (timed) timer = new Timer(settings.time, () => end());
    const n = list.length;

    function render() {
      if (mode === 'rush') { let q; do { q = genRush(); } while (cur && q.id === cur.id); cur = q; }
      else if (mode === 'drill' || mode === 'drill-blank' || mode === 'drill-transform' || mode === 'drill-mix') {
        const kind = mode === 'drill-blank' ? 'blank' : mode === 'drill-transform' ? 'transform' : mode === 'drill-mix' ? 'mix' : (opts.drill || 'mix');
        let q; do { q = genDrill(kind); } while (cur && q.id === cur.id); cur = q;
      }
      else { if (i >= list.length) { if (mode === 'blitz') { list = shuffle(list); i = 0; } else return end(); } cur = list[i]; }
      if (!timed) progress(i, n);
      const ch = CH[cur.ch];
      $('#qTag').innerHTML = (cur.tag || (ch ? `${ch.emoji} 第${ch.no}章 ${ch.name}` : '🔢 常数与换算')) + `<span class="qt-type">${{ c: '单选', tf: '判断', n: '计算' }[cur.t]}</span>`;
      $('#qText').innerHTML = cur.q;
      $('#qCard').classList.remove('in'); void $('#qCard').offsetWidth; $('#qCard').classList.add('in');
      $('#qNote').innerHTML = ''; $('#qNext').hidden = true;
      const hb = $('#btnHint'), hx = $('#hintBox');
      if (hb) {
        const has = !!(cur.hint && String(cur.hint).trim());
        hb.hidden = !has; hx.hidden = true; hx.textContent = '';
        hb.onclick = () => { if (hx.hidden) { hx.hidden = false; hx.innerHTML = '💡 ' + cur.hint; SFX.tap(); hb.textContent = '💡 已显示提示'; } };
        hb.textContent = '💡 提示';
      }
      const box = $('#qOpts'); box.innerHTML = '';
      $('#numWrap').hidden = cur.t !== 'n';
      if (cur.t === 'n') {
        numStr = ''; drawNum(); $('#numUnit').textContent = cur.unit;
        $$('#numpad .key').forEach(k => (k.disabled = false));
      } else {
        const items = cur.t === 'tf'
          ? [{ html: '✔ 正确', ok: cur.ans === true, v: true }, { html: '✘ 错误', ok: cur.ans === false, v: false }]
          : shuffle(cur.opts.map((o, k) => ({ html: o, ok: k === 0 })));
        box.classList.toggle('tf', cur.t === 'tf');
        items.forEach(o => {
          const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = o.html; b._o = o;
          b.addEventListener('click', () => pick(b));
          box.appendChild(b);
        });
      }
      busy = false;
    }
    function drawNum() { const v = $('#numVal'); v.textContent = numStr || '?'; v.classList.toggle('empty', !numStr); v.classList.remove('ok', 'bad'); }
    function pick(b) {
      if (!running || busy) return;
      SFX.unlock(); busy = true;
      $$('#qOpts .opt').forEach(o => { o.disabled = true; if (o._o.ok) o.classList.add('right'); });
      if (!b._o.ok) b.classList.add('wrongpick');
      judge(b._o.ok);
    }
    function submitNum() {
      if (!running || busy || !numStr || numStr === '.') return;
      SFX.unlock(); busy = true;
      const v = parseFloat(numStr), ok = Math.abs(v - cur.ans) <= 1e-6 * Math.max(1, Math.abs(cur.ans));
      $('#numVal').classList.add(ok ? 'ok' : 'bad');
      $$('#numpad .key').forEach(k => (k.disabled = true));
      judge(ok);
    }
    function key(k) {
      if (!running || busy || cur.t !== 'n') return;
      SFX.tap();
      if (k === 'del') numStr = numStr.slice(0, -1);
      else if (k === 'clr') numStr = '';
      else if (k === 'ok') return submitNum();
      else if (k === '.') { if (!numStr.includes('.')) numStr = (numStr || '0') + '.'; }
      else if (numStr.length < 9) numStr = numStr === '0' ? k : numStr + k;
      drawNum();
    }
    this.onKey = e => {
      if (!cur) return;
      if (!busy && cur.t === 'n') {
        if (/^[0-9]$/.test(e.key)) key(e.key); else if (e.key === '.') key('.'); else if (e.key === 'Backspace') key('del'); else if (e.key === 'Enter') key('ok');
      } else if (!busy && /^[1-4]$/.test(e.key)) { const b = $$('#qOpts .opt')[+e.key - 1]; if (b) pick(b); }
      else if (busy && (e.key === 'Enter' || e.key === ' ') && !$('#qNext').hidden) $('#qNext').click();
    };
    function judge(ok) {
      record(ok); trackQ(cur);
      const corr = cur.t === 'c' ? '' : cur.t === 'tf' ? '' : `正确答案：<b>${cur.ans} ${cur.unit}</b>　`;
      if (ok) {
        right++; hud.add(timed ? 10 : 10); SFX.ding(hud.combo);
        if (mode === 'practice') delWrong(cur.id);
        $('#qNote').innerHTML = `<b class="okc">✔ 正确！</b>${mode === 'practice' ? '（已移出错题本）' : ''}<div class="ex-block">📖 解析：${cur.ex}</div>`;
      } else {
        wrong++; hud.miss(); SFX.wrong(); addWrong(cur); misses.push(cur);
        $('#qCard').classList.add('shake'); setTimeout(() => $('#qCard').classList.remove('shake'), 400);
        $('#qNote').innerHTML = `<b class="badc">✘ 答错了</b>　${corr}<div class="ex-block">📖 解析：${cur.ex}</div>`;
      }
      i++;
      if (timed && ok) setTimeout(() => { if (running) render(); }, 750);
      else { $('#qNext').hidden = false; }
    }
    $('#qNext').onclick = () => { if (!running) return; SFX.tap(); if (!timed && i >= n) end(); else render(); };
    const self = this;
    function end() {
      if (!running) return;
      running = false; if (timer) timer.stop();
      const total = right + wrong, acc = total ? Math.round(right / total * 100) : 0;
      const st = [['答对', right], ['答错', wrong], ['正确率', total ? acc + '%' : '-']];
      if (mode === 'level') {
        const ch = CH[opts.ch];
        const sN = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 50 ? 1 : 0;
        const had = stars[ch.id] || 0;
        if (sN > had) { stars[ch.id] = sN; store.set('wl_stars', stars); }
        const nx = CHAPTERS[ch.no];
        finish({ title: sN ? `🎉 第${ch.no}章 闯关成功！` : '💪 差一点，再来一次！', key: 'lv:' + ch.id, stats: st, misses, starN: sN,
          again: () => startQuiz({ mode: 'level', ch: ch.id }), next: nx ? () => openChapter(nx.id) : null });
      } else if (mode === 'practice') {
        finish({ title: '📒 错题练习完成', key: 'practice', stats: st, misses, again: () => Object.keys(wrongBook).length ? startQuiz({ mode: 'practice' }) : openWrong() });
      } else {
        const againMode = mode;
        const againOpts = mode.startsWith('drill') ? { mode, drill: opts.drill } : { mode };
        finish({ title: '⏰ 时间到！', key: mode.startsWith('drill') ? 'drill' : mode, stats: st, misses, again: () => startQuiz(againOpts) });
      }
    }
    this.start = () => {
      hud.reset();
      $('#qText').innerHTML = ''; $('#qTag').innerHTML = ''; $('#qOpts').innerHTML = ''; $('#qNote').innerHTML = ''; $('#qNext').hidden = true; $('#numWrap').hidden = true;
      if (timed) { timer.preview(); countdown(() => { running = true; timer.start(); render(); }); }
      else { running = true; render(); }
    };
    this.stop = () => { running = false; if (timer) timer.stop(); };
    this.key = key;
    this.debug = () => ({ running, busy, mode, i, n, cur });
  }
  // 数字键盘
  (function buildPad() {
    const keys = [['7'], ['8'], ['9'], ['del', '⌫'], ['4'], ['5'], ['6'], ['clr', 'C'], ['1'], ['2'], ['3'], ['.', '.'], ['0', '0', 'w2'], ['ok', '✔ 提交', 'w2 go']];
    $('#numpad').innerHTML = keys.map(([k, l, c]) => `<button class="key ${c || ''}" data-k="${k}">${l || k}</button>`).join('');
    $('#numpad').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b && current && current.key) current.key(b.dataset.k); });
  })();

  /* =========================================================
   * 单位连连看
   * ========================================================= */
  function MatchGame() {
    let running = false, sel = null, right = 0, wrong = 0, boards = 0;
    const timer = new Timer(settings.time, () => end());
    let pool = UNITS.filter(u => inScope(u.g)); if (pool.length < 6) pool = UNITS;
    function deal() {
      const pairs = shuffle(pool).slice(0, 6);
      const tiles = shuffle(pairs.flatMap((p, k) => [{ id: p.q, kind: 'q', txt: p.q }, { id: p.q, kind: 'u', txt: p.u }]));
      const g = $('#matchGrid'); g.innerHTML = '';
      tiles.forEach(t => {
        const b = document.createElement('button');
        b.className = 'mtile ' + (t.kind === 'q' ? 'nm' : 'sym') + (t.txt.length > 5 ? ' long' : '');
        b.dataset.id = t.id; b.dataset.kind = t.kind; b.textContent = t.txt;
        b.addEventListener('click', () => tap(b));
        g.appendChild(b);
      });
      sel = null;
    }
    function tap(b) {
      if (!running || b.classList.contains('gone')) return;
      SFX.unlock();
      if (!sel) { sel = b; b.classList.add('sel'); SFX.tap(); return; }
      if (sel === b) { b.classList.remove('sel'); sel = null; return; }
      if (sel.dataset.kind === b.dataset.kind) { sel.classList.remove('sel'); sel = b; b.classList.add('sel'); SFX.tap(); return; }
      const a = sel; sel = null; a.classList.remove('sel');
      if (a.dataset.id === b.dataset.id) {
        right++; record(true); hud.add(10); SFX.ding(hud.combo);
        a.classList.add('gone'); b.classList.add('gone');
        if (!$$('.mtile:not(.gone)').length) { boards++; timer.bonus(5); SFX.clear(); toast('🎉 清空一版！+5 秒'); setTimeout(() => running && deal(), 400); }
      } else {
        wrong++; record(false); hud.miss(); SFX.wrong();
        [a, b].forEach(x => { x.classList.add('no'); setTimeout(() => x.classList.remove('no'), 450); });
      }
    }
    function end() {
      if (!running) return; running = false; timer.stop();
      finish({ title: '⏰ 时间到！', key: 'match', stats: [['配对', right], ['配错', wrong], ['清空', boards + ' 版']], misses: [], again: () => startGame('match') });
      $('#mMiss').innerHTML = '';
    }
    this.start = () => { hud.reset(); timer.preview(); $('#matchGrid').innerHTML = ''; countdown(() => { running = true; timer.start(); deal(); }); };
    this.stop = () => { running = false; timer.stop(); };
    this.debug = () => ({ running });
  }

  /* =========================================================
   * 章节地图 & 章节详情
   * ========================================================= */
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  function renderMap() {
    $('#mapList').innerHTML = GRADES.map(g => `
      <h3 class="sec-h">${g.name}</h3>
      <div class="map-grid">${CHAPTERS.filter(c => c.grade === g.id).map(c => {
        const s = stars[c.id] || 0;
        return `<button class="map-tile${s === 3 ? ' full' : s ? ' some' : ''}" data-ch="${c.id}"><span class="mt-no">${c.no}</span><span class="mt-emoji">${c.emoji}</span><span class="mt-name">${c.name}</span><span class="mt-stars">${starStr(s)}</span></button>`;
      }).join('')}</div>`).join('');
  }
  function openChapter(id) {
    stopAll(); $('#modal').hidden = true;
    const c = CH[id]; view = 'chapter'; viewArg = id; track('c', id);
    setBrand(`${c.emoji} ${c.name}`);
    $('#chEmoji').textContent = c.emoji;
    $('#chNo').textContent = `第 ${c.no} 章 · ${GRADES.find(g => g.id === c.grade).name} · ${c.qs.length} 道题`;
    $('#chName').textContent = c.name;
    const s = stars[c.id] || 0;
    $('#chStars').innerHTML = `<span class="st">${starStr(s)}</span> ${best['lv:' + c.id] ? '最佳 ' + best['lv:' + c.id] + ' 分' : '还没闯过'}`;
    $('#chPoints').innerHTML = c.points.map((p, k) => `<div class="kp"><span class="kp-n">${k + 1}</span><div>${p}</div></div>`).join('');
    $('#chFormH').hidden = !c.formulas.length;
    $('#chForms').innerHTML = c.formulas.map(fcard).join('');
    $('#btnChSim').hidden = !c.sim;
    $('#btnChSim').onclick = () => window.WL.openSim(c.sim, 'chapter:' + c.id);
    show('scrChapter');
  }
  const fcard = f => `<div class="fcard"><div class="fc-n">${f.n}</div><div class="fc-f">${f.f}</div>${f.u ? `<div class="fc-u">${f.u}</div>` : ''}</div>`;
  $('#mapList').addEventListener('click', e => { const t = e.target.closest('[data-ch]'); if (t) { SFX.tap(); openChapter(t.dataset.ch); } });
  $('#btnChStart').addEventListener('click', () => startQuiz({ mode: 'level', ch: viewArg }));

  /* ---------- 错题本 / 公式卡 ---------- */
  function renderWrong() {
    const ids = Object.keys(wrongBook).sort((a, b) => wrongBook[b].t - wrongBook[a].t);
    $('#wbSub').textContent = ids.length ? `共 ${ids.length} 题` : '';
    $('#btnWbPractice').hidden = !ids.length;
    $('#wbList').innerHTML = ids.length ? ids.map(id => {
      const w = wrongBook[id], q = w.q, ch = CH[q.ch];
      return `<div class="wb-lab"><span class="wb-kind">${ch ? ch.name : q.ch === 'rush' ? '公式抢答' : '常数换算'}</span><div class="wb-q">${q.q}</div><div class="wb-a">✔ ${answerText(q)}</div><div class="wb-ex">${q.ex}</div><span class="wb-cnt">错 ${w.n} 次</span></div>`;
    }).join('') : '<div class="wb-empty">错题本空空如也～<br>去闯关或玩限时小游戏吧！</div>';
  }
  function openWrong() { stopAll(); $('#modal').hidden = true; view = 'wrong'; renderWrong(); setBrand('📒 错题本'); show('scrWrong'); }
  function renderCards() {
    $('#cardsList').innerHTML = GRADES.map(g => `<h3 class="sec-h">${g.name}</h3>` + CHAPTERS.filter(c => c.grade === g.id && c.formulas.length).map(c =>
      `<div class="cards-ch"><div class="cc-h">${c.emoji} ${c.name}</div><div class="fc-list">${c.formulas.map(fcard).join('')}</div></div>`).join('')).join('')
      + `<h3 class="sec-h">🔢 常用常数 & 换算</h3><div class="fc-list">${FACTS.map(f => `<div class="fcard sm"><div class="fc-n">${f.q.replace(/[=是为约]+$/, '')}</div><div class="fc-f">${f.opts[0]}</div></div>`).join('')}</div>`
      + `<h3 class="sec-h">📏 物理量与单位</h3><div class="unit-grid">${UNITS.map(u => `<div class="uchip"><span>${u.q}</span><b>${u.u}</b></div>`).join('')}</div><div style="height:24px"></div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-drill]');
    if (!b) return;
    SFX.tap();
    startQuiz({ mode: 'drill-' + b.dataset.drill });
  });

  /* ---------- 首页 ---------- */
  function refreshMenu() {
    $$('#segTime button').forEach(b => b.classList.toggle('on', +b.dataset.v === settings.time));
    $$('#segScope button').forEach(b => b.classList.toggle('on', b.dataset.v === settings.scope));
    ['rush', 'match', 'blitz', 'drill'].forEach(k => { const el = $(`[data-best="${k}"]`); if (el) el.textContent = best[k] ? '最佳 ' + best[k] : ''; });
    const total = Object.values(stars).reduce((a, b) => a + b, 0);
    $('#mapBest').textContent = total ? `⭐ ${total}/${CHAPTERS.length * 3}` : '';
    $('#stStars').textContent = total;
    const today = dayStr(Date.now()), yest = dayStr(Date.now() - 864e5);
    $('#stStreak').textContent = (stat.last === today || stat.last === yest) ? stat.streak : 0;
    $('#stDone').textContent = stat.done;
    $('#stAcc').textContent = stat.done ? Math.round(stat.right / stat.done * 100) + '%' : '-';
    const n = Object.keys(wrongBook).length;
    $('#wbCount').textContent = n ? n + ' 题' : '';
    if (window.WL && window.WL.sliceSummary) $('#sliceBest').innerHTML = window.WL.sliceSummary();
    if (window.WL && window.WL.labSummary) $('#labBest').textContent = window.WL.labSummary();
  }
  function goHome() { stopAll(); view = 'home'; $('#modal').hidden = true; refreshMenu(); setBrand('⚛️ 快乐掌握物理'); show('scrHome'); }

  /* ---------- 启动 ---------- */
  function startQuiz(opts) {
    stopAll(); $('#modal').hidden = true; SFX.unlock();
    if (opts.mode === 'practice' && !Object.keys(wrongBook).length) { toast('错题本是空的 🎉'); return openWrong(); }
    view = opts.mode === 'level' ? 'level' : opts.mode === 'practice' ? 'practice' : opts.mode.startsWith('drill') ? 'drill' : 'game';
    if (opts.mode === 'level') viewArg = opts.ch;
    const titles = { rush: '⚡ 公式抢答', blitz: '⏱️ 限时大乱斗', practice: '📒 错题练习',
      drill: '🧠 公式记忆', 'drill-blank': '✏️ 公式挖空', 'drill-transform': '🔄 公式变形', 'drill-mix': '🎲 混合练习' };
    setBrand(opts.mode === 'level' ? `${CH[opts.ch].emoji} 第${CH[opts.ch].no}章 闯关` : (titles[opts.mode] || '练习'));
    show('scrQuiz');
    current = new QuizGame(opts); window.WL.game = current; current.start();
  }
  function startGame(name) {
    stopAll(); $('#modal').hidden = true; SFX.unlock();
    if (name === 'map') { view = 'map'; renderMap(); setBrand('🗺️ 章节闯关'); return show('scrMap'); }
    if (name === 'wrongbook') return openWrong();
    if (name === 'cards') { view = 'cards'; renderCards(); setBrand('📜 公式卡片'); return show('scrCards'); }
    if (name === 'lab') return window.WL.openLab();
    if (name === 'slice') return window.WL.openSlice();
    if (name === 'rush' || name === 'blitz') return startQuiz({ mode: name });
    if (name === 'drill-blank' || name === 'drill-transform' || name === 'drill-mix') return startQuiz({ mode: name });
    if (name === 'match') { view = 'game'; setBrand('🔗 单位连连看'); show('scrMatch'); current = new MatchGame(); window.WL.game = current; current.start(); }
  }
  function back() {
    $('#modal').hidden = true;
    if (view === 'chapter') return startGame('map');
    if (view === 'level') return openChapter(viewArg);
    if (view === 'practice') return openWrong();
    if (view === 'drill') return startGame('cards');
    if (view === 'sim') return window.WL.simBack();
    goHome();
  }

  $('#menu').addEventListener('click', e => { const t = e.target.closest('[data-game]'); if (t) startGame(t.dataset.game); });
  $('#segTime').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; settings.time = +b.dataset.v; store.set('wl_settings', settings); SFX.tap(); refreshMenu(); });
  $('#segScope').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; settings.scope = b.dataset.v; store.set('wl_settings', settings); SFX.tap(); refreshMenu(); });
  $('#btnHome').addEventListener('click', back);
  $('#btnToHome').addEventListener('click', back);
  $('#btnToWrong').addEventListener('click', openWrong);
  $('#btnWbPractice').addEventListener('click', () => startQuiz({ mode: 'practice' }));
  $('#btnWbClear').addEventListener('click', () => { if (confirm('确定清空错题本吗？')) { wrongBook = {}; saveWrong(); renderWrong(); } });
  const muteBtn = $('#btnMute');
  const drawMute = () => (muteBtn.textContent = SFX.muted ? '🔇' : '🔊');
  muteBtn.addEventListener('click', () => { SFX.toggle(); drawMute(); SFX.tap(); });
  document.addEventListener('keydown', e => { if (current && current.onKey && $('#modal').hidden) current.onKey(e); });

  window.WL = {
    data: window.PHY, startGame, startQuiz, openChapter, goHome,
    core: { $, $$, rand, shuffle, store, toast, show, setBrand, stopAll, record, refreshMenu, addWrong, dayStr, track, CH, setView(v) { view = v; } },
  };
  drawMute();
  refreshMenu();
})();
