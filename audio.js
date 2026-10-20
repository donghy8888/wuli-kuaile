/* WebAudio 合成音效，无需音频文件
   iPad Safari 修复：每次点击（捕获阶段）检查 AudioContext —— suspended / interrupted 就 resume()；
   状态显示 running 但时钟冻结（currentTime 不走）就关掉重建；支持时设 navigator.audioSession.type='playback'；
   每个音效节点播完立即 disconnect，并限制同时发声数，防止 WebKit 节点堆积导致静音。 */
window.SFX = (function () {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, out = null, active = 0, gen = 0, lastCT = -1, lastWall = 0, needRebuild = false, noiseCache = {};
  let muted = localStorage.getItem('wl_muted') === '1';
  const stats = { built: 0, resumed: 0, recreated: 0, capped: 0 };
  const MAXV = 28;
  function setSession() { try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) {} }
  function build() {
    if (!AC) return null;
    try {
      setSession();
      ctx = new AC(); gen++; stats.built++; active = 0; lastCT = -1; noiseCache = {};
      out = ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : ctx.createGain();
      out.connect(ctx.destination);
      const me = ctx; ctx.onstatechange = () => { if (ctx === me && ctx.state === 'closed') needRebuild = true; };
    } catch (e) { ctx = null; out = null; }
    return ctx;
  }
  function resumeNow() { try { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed' && ctx.resume) { stats.resumed++; const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } } catch (e) {} }
  function recreate() {
    const old = ctx; ctx = null; out = null; stats.recreated++;
    try { if (old && old.state !== 'closed' && old.close) { const p = old.close(); if (p && p.catch) p.catch(() => {}); } } catch (e) {}
    build(); resumeNow(); prime();
  }
  function prime() { /* 手势里放 1 个采样的静音，保持 iOS 音频通路 */
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.onended = () => { try { s.disconnect(); } catch (e) {} }; s.start(0); } catch (e) {}
  }
  /* 每次点击调用 */
  function unlock() {
    if (!AC) return;
    setSession();
    if (!ctx || ctx.state === 'closed' || needRebuild) { needRebuild = false; if (ctx) recreate(); else { build(); resumeNow(); prime(); } return check(); }
    const wall = performance.now();
    if (ctx.state === 'running' && lastCT >= 0 && wall - lastWall > 250 && ctx.currentTime === lastCT) { recreate(); return check(); } /* 冻结的时钟 */
    if (ctx.state !== 'running') resumeNow(); /* suspended / interrupted */
    prime(); check();
    lastCT = ctx.currentTime; lastWall = wall;
  }
  let checkT = 0;
  function check() { clearTimeout(checkT); const g = gen; checkT = setTimeout(() => { if (!ctx || g !== gen) return; if (ctx.state !== 'running') needRebuild = true; lastCT = ctx.currentTime; lastWall = performance.now(); }, 300); }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));
  const mark = () => { if (ctx && ctx.state !== 'running') needRebuild = ctx.state === 'closed'; lastCT = -1; };
  document.addEventListener('visibilitychange', mark); window.addEventListener('pageshow', e => { mark(); if (e && e.persisted && ctx) needRebuild = true; }); window.addEventListener('focus', mark);
  function ac() {
    if (!ctx) build();
    if (ctx && ctx.state !== 'running') resumeNow();
    return ctx && ctx.state !== 'closed' ? ctx : null;
  }
  function track(src, nodes) { active++; src.onended = () => { active = Math.max(0, active - 1); nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); }; }
  function tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0) {
    if (muted) return;
    const c = ac(); if (!c) return;
    if (active >= MAXV) { stats.capped++; return; }
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); track(o, [o, g]);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.3, filterFreq = 1200, delay = 0, endFreq = 100, band = false) {
    if (muted) return;
    const c = ac(); if (!c) return;
    if (active >= MAXV) { stats.capped++; return; }
    const t = c.currentTime + delay, key = dur.toFixed(2);
    let buf = noiseCache[key];
    if (!buf) {
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      noiseCache[key] = buf;
    }
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = band ? 'bandpass' : 'lowpass';
    f.frequency.setValueAtTime(filterFreq, t);
    f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t);
    src.connect(f); f.connect(g); g.connect(out); track(src, [src, f, g]);
    src.start(t); src.stop(t + dur + 0.02);
  }
  return {
    unlock,
    info() { return { state: ctx ? ctx.state : 'none', active, gen, stats, session: navigator.audioSession ? navigator.audioSession.type : null }; },
    /* 切西瓜 */
    slice() { noise(0.16, 0.22, 700, 0, 3200, true); },
    chime(o) { const b = 1046 * (0.97 + Math.random() * 0.06); tone(b, 0.3, 'sine', 0.16); tone(b * 1.26, 0.45, 'sine', 0.13, null, 0.075); if (o && o.bonus) [0, 1, 2].forEach(i => tone(2093 * Math.pow(1.12, i), 0.2, 'sine', 0.06, null, 0.2 + i * 0.05)); },
    splat() { noise(0.18, 0.3, 1800, 0, 200); tone(240, 0.14, 'sine', 0.14, 90); },
    soft() { tone(196, 0.24, 'sine', 0.2, 165); },
    levelup() { [0, 2, 4, 5, 7, 9, 11, 12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.22, 'triangle', 0.1, null, i * 0.055)); },
    fanfare(o) { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.4, 'triangle', 0.13, null, i * 0.085)); [1046, 1318, 1568].forEach(f => tone(f, 1.0, 'sine', 0.07, null, 0.5)); },
    get muted() { return muted; },
    toggle() { muted = !muted; localStorage.setItem('wl_muted', muted ? '1' : '0'); return muted; },
    shoot() { noise(0.12, 0.35, 6000, 0, 800); tone(900, 0.12, 'square', 0.08, 120); },
    boom(combo = 0) {
      noise(0.5, 0.5, 2500, 0.08, 60);
      tone(110, 0.4, 'sine', 0.35, 40, 0.08);
      const base = 520 * Math.pow(1.06, Math.min(combo, 12));
      tone(base, 0.12, 'triangle', 0.12, null, 0.12);
      tone(base * 1.5, 0.15, 'triangle', 0.1, null, 0.2);
    },
    wrong() { tone(200, 0.25, 'sawtooth', 0.12, 110); tone(150, 0.3, 'square', 0.06, 90, 0.08); },
    flip() { tone(700, 0.06, 'sine', 0.08, 1100); },
    tap() { tone(600, 0.04, 'sine', 0.06); },
    ding(combo = 0) { const b = 660 * Math.pow(1.06, Math.min(combo, 12)); tone(b, 0.15, 'triangle', 0.15); tone(b * 1.26, 0.2, 'triangle', 0.12, null, 0.08); },
    tick() { tone(1000, 0.05, 'square', 0.05); },
    go() { tone(880, 0.25, 'triangle', 0.18); },
    end() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.15, null, i * 0.12)); },
    bubble() { for (let i = 0; i < 6; i++) tone(300 + Math.random() * 500, 0.06, 'sine', 0.07, 900 + Math.random() * 600, i * 0.09); },
    whoosh() { noise(0.35, 0.25, 3000, 0, 300); tone(300, 0.3, 'triangle', 0.08, 700); },
    fizz() { noise(0.4, 0.18, 8000, 0, 2000); },
    pop() { noise(0.08, 0.4, 4000, 0, 400); tone(500, 0.1, 'sine', 0.12, 150); },
    clear() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.15, 'triangle', 0.12, null, i * 0.07)); },
  };
})();
