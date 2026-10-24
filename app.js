/* Read Steps: app logic (vanilla JS, no build step) */
'use strict';
(function () {
  const { LEVELS, STORIES, KEYWORDS, INTERESTS, AGES, GOALS, DIAG_SENTENCES, DIAG_PASSAGES } = window.RS;
  const TYPES = [
    { id: 'phonics', label: 'Phonics', icon: '🔤' },
    { id: 'sight', label: 'Tricky words', icon: '👀' },
    { id: 'story', label: 'Story', icon: '📖' },
    { id: 'quiz', label: 'Story quiz', icon: '🧠' }
  ];
  const app = document.getElementById('app');
  const topbar = document.getElementById('topbar');
  const nav = document.getElementById('nav');
  const live = document.getElementById('live');
  const KEY = 'readsteps.v1';
  const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');

  /* ---------- utils ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = a => [...new Set(a)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const pw = s => { const [w, e] = s.split('|'); return { w, e: e || '' }; };
  const wordsOf = L => LEVELS[L].words.map(pw);
  const announce = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); };
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const starsHtml = n => [1, 2, 3].map(i => `<span class="${i <= n ? '' : 'off'}">⭐</span>`).join('');
  /* Pip the reading owl (inline SVG). mood: happy | cheer | think */
  function mascot(mood = 'happy', cls = '') {
    const cheer = mood === 'cheer', think = mood === 'think';
    const eyes = cheer
      ? '<path d="M37 57q8-9 16 0M67 57q8-9 16 0" fill="none" stroke="#0a3352" stroke-width="4.5" stroke-linecap="round"/>'
      : `<g class="eyes"><circle cx="45" cy="56" r="13" fill="#fff"/><circle cx="75" cy="56" r="13" fill="#fff"/>
         <circle cx="${think ? 49 : 46}" cy="${think ? 52 : 57}" r="6.5" fill="#0a3352"/><circle cx="${think ? 79 : 76}" cy="${think ? 52 : 57}" r="6.5" fill="#0a3352"/>
         <circle cx="${think ? 51 : 48}" cy="${think ? 50 : 55}" r="2.2" fill="#fff"/><circle cx="${think ? 81 : 78}" cy="${think ? 50 : 55}" r="2.2" fill="#fff"/></g>`;
    const wingL = cheer ? 'M28 66q-18-14-14-34q14 10 18 30z' : 'M26 64q-10 14-4 32q12-6 12-26z';
    const wingR = cheer ? 'M92 66q18-14 14-34q-14 10-18 30z' : 'M94 64q10 14 4 32q-12-6-12-26z';
    return `<svg class="mascot ${mood} ${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g class="bob">
      <ellipse cx="60" cy="114" rx="30" ry="4" fill="#000" opacity=".08"/>
      <path d="M34 34 30 14 48 28zM86 34 90 14 72 28z" fill="#4aa6ec"/>
      <path class="wing-l" d="${wingL}" fill="#4aa6ec"/><path class="wing-r" d="${wingR}" fill="#4aa6ec"/>
      <ellipse cx="60" cy="66" rx="38" ry="42" fill="#7cc6fe"/>
      <ellipse cx="60" cy="82" rx="25" ry="23" fill="#e4f3ff"/>
      <path d="M52 86q8 4 16 0M50 94q10 4 20 0" fill="none" stroke="#b9dcf7" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="33" cy="70" rx="6" ry="4" fill="#ff9ec7" opacity=".7"/><ellipse cx="87" cy="70" rx="6" ry="4" fill="#ff9ec7" opacity=".7"/>
      ${eyes}
      <path d="M54 66h12l-6 8z" fill="#ffb02e" stroke="#e5911a" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M48 106h8M64 106h8" stroke="#ffb02e" stroke-width="5" stroke-linecap="round"/>
      ${cheer ? '' : `<g transform="translate(60 95)"><path d="M-22-8q11-5 22 1q11-6 22-1v16q-11-5-22 1q-11-6-22-1z" fill="#ff8a65"/>
        <path d="M-19-6q9-3 19 2v13q-10-5-19-2zM19-6q-9-3-19 2v13q10-5 19-2z" fill="#fff"/><path d="M0-4v13" stroke="#e5683f" stroke-width="1.5"/></g>`}
      ${think ? '<circle cx="100" cy="30" r="5" fill="#ffc93c"/><circle cx="108" cy="16" r="3" fill="#ffc93c"/>' : ''}
    </g></svg>`;
  }
  let shownXp = null;
  function countUp(el, to, ms = 900) {
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = '+' + to; return; }
    const t0 = performance.now() + 600;
    const step = t => { const k = clamp((t - t0) / ms, 0, 1); el.textContent = '+' + Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    el.textContent = '+0'; requestAnimationFrame(step);
  }
  function xpFloat(n, from) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const el = document.createElement('div'); el.className = 'xp-float'; el.textContent = `+${n} XP`;
    el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = r.top + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
  }

  /* ---------- state ---------- */
  function fresh() {
    return { v: 1, profile: null, level: null, unlocked: 0, lessons: {}, xp: 0, streak: { n: 0, last: null },
      today: { day: null, n: 0 }, hist: [], diag: [], read: {}, pathStory: {}, sinceCheck: 0,
      settings: { rate: 0.85, voice: '', font: 'lexend', theme: 'light', size: 1.6, mute: false } };
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) { const f = fresh(); return Object.assign(f, s, { settings: Object.assign(f.settings, s.settings) }); } } catch (e) { /* ignore */ }
    return fresh();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ } }
  function applySettings() {
    const r = document.documentElement;
    r.dataset.font = S.settings.font;
    if (S.settings.theme === 'auto') delete r.dataset.theme; else r.dataset.theme = S.settings.theme;
    r.style.setProperty('--read-size', S.settings.size + 'rem');
  }

  /* ---------- speech synthesis ---------- */
  const synth = window.speechSynthesis || null;
  let voices = [];
  function loadVoices() { voices = synth ? synth.getVoices().filter(v => /^en/i.test(v.lang)) : []; }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
  function pickVoice() {
    if (S.settings.voice) { const v = voices.find(x => x.voiceURI === S.settings.voice); if (v) return v; }
    for (const p of ['en-AU', 'en-GB', 'en-US', 'en']) {
      const v = voices.find(x => x.lang.replace('_', '-').startsWith(p) && /natural|online|google|samantha|karen/i.test(x.name)) ||
        voices.find(x => x.lang.replace('_', '-').startsWith(p));
      if (v) return v;
    }
    return null;
  }
  function speak(text, o = {}) {
    if (!synth) { if (o.onend) setTimeout(o.onend, 0); return null; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-AU';
    u.rate = o.rate || S.settings.rate; u.pitch = 1.05;
    if (o.onboundary) u.onboundary = o.onboundary;
    let ended = false;
    u.onend = u.onerror = () => { if (!ended) { ended = true; if (o.onend) o.onend(); } };
    synth.speak(u);
    return u;
  }
  function stopAudio() { if (synth) synth.cancel(); if (rec) { try { rec.abort(); } catch (e) { /* */ } rec = null; } }

  /* ---------- sound effects ---------- */
  let actx;
  function tone(ok) {
    if (S.settings.mute) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.connect(g); g.connect(actx.destination); o.type = ok ? 'triangle' : 'sine';
      if (ok) { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(990, t + 0.1); } else { o.frequency.setValueAtTime(260, t); o.frequency.linearRampToValueAtTime(200, t + 0.25); }
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.start(t); o.stop(t + 0.35);
    } catch (e) { /* audio unavailable */ }
  }
  function burst(chars = ['⭐', '🎉', '✨', '🌟']) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const b = document.getElementById('burst');
    const colors = ['#7cc6fe', '#ffc93c', '#ff8a65', '#4fd19b', '#b39bff', '#ff9ec7'];
    const w = Math.min(innerWidth, 700);
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('i');
      if (i < 14) el.textContent = rand(chars);
      else { el.className = 'cf' + (Math.random() < 0.4 ? ' round' : ''); el.style.background = rand(colors); }
      el.style.left = '50%'; el.style.top = '42%';
      const a = Math.random() * Math.PI * 2, d = 0.25 + Math.random() * 0.45;
      el.style.setProperty('--dx', (Math.cos(a) * w * d) + 'px');
      el.style.setProperty('--dy', (Math.sin(a) * innerHeight * d * 0.7 + 80) + 'px');
      el.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      el.style.animationDelay = (Math.random() * 0.15) + 's';
      b.appendChild(el); setTimeout(() => el.remove(), 1900);
    }
  }

  /* ---------- rendering ---------- */
  let currentTab = null;
  function render(html, { focusMode = false, tab = null } = {}) {
    stopAudio();
    app.innerHTML = html;
    currentTab = tab;
    document.body.classList.toggle('focus-mode', focusMode);
    const showChrome = !!S.profile && S.level !== null && !focusMode;
    topbar.hidden = !showChrome; nav.hidden = !showChrome;
    if (showChrome) drawTopbar();
    nav.querySelectorAll('button').forEach(b => { if (b.dataset.nav === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    window.scrollTo(0, 0);
    const h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  function streakNow() {
    const y = dayStr(new Date(Date.now() - 864e5));
    return (S.streak.last === dayStr() || S.streak.last === y) ? S.streak.n : 0;
  }
  function drawTopbar() {
    const gained = shownXp !== null && S.xp > shownXp;
    topbar.innerHTML = `<span class="brand">${mascot('happy')}<span class="txt">Read Steps</span></span>
      <span class="stats">
        <span class="chip streak" title="Day streak"><span aria-hidden="true">🔥</span>${streakNow()}<span class="sr-only"> day streak</span></span>
        <span class="chip xp${gained ? ' bump' : ''}" title="Experience points"><span aria-hidden="true">💎</span>${S.xp}<span class="sr-only"> XP</span></span>
        <span class="chip lvl" title="Current level">${S.level === 0 ? 'Pre' : 'L' + S.level}<span class="sr-only"> current level</span></span>
      </span>`;
    shownXp = S.xp;
  }
  nav.addEventListener('click', e => {
    const b = e.target.closest('button[data-nav]'); if (!b) return;
    ({ home: viewHome, library: viewLibrary, me: viewMe })[b.dataset.nav]();
  });
  const on = (sel, ev, fn) => app.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn));

  /* ---------- onboarding ---------- */
  const OB = { name: '', age: null, interests: [], goals: [], minutes: 10 };
  function dots(i) { return `<div class="steps-dots" aria-hidden="true">${[0, 1, 2, 3].map(k => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`; }
  function obWelcome() {
    render(`<div class="hero welcome"><div class="logo">${mascot('happy', 'lg')}</div>
      <h1>Welcome to Read Steps</h1>
      <p class="muted">Learn to read one small step at a time, with games, stories and stars.</p></div>
      <div class="card">
        <label class="lbl" for="nm">What should we call you? <span class="muted">(optional)</span></label>
        <input id="nm" class="text-input" autocomplete="off" maxlength="24" value="${esc(OB.name)}" placeholder="Your first name">
        <p class="muted" style="margin-top:12px">A grown-up can help with setup. Everything is saved on this device only.</p>
        <button class="btn primary block" id="go">Let's go!</button>
      </div>`, { focusMode: true });
    document.getElementById('go').onclick = () => { OB.name = document.getElementById('nm').value.trim(); speak('Hi! Let\'s get started.'); obAge(); };
  }
  function obAge() {
    render(`${dots(0)}<h1>How old is the reader?</h1>
      <div class="choice-grid" role="radiogroup" aria-label="Age group">${AGES.map(a => `<button class="choice" role="radio" aria-checked="${OB.age === a.id}" data-id="${a.id}"><span class="e" aria-hidden="true">${a.e}</span>${esc(a.label)}<small>${esc(a.sub)}</small></button>`).join('')}</div>
      <div class="row"><button class="btn" id="back">Back</button><button class="btn primary" id="next" ${OB.age ? '' : 'disabled'}>Next</button></div>`, { focusMode: true });
    on('.choice', 'click', e => { OB.age = e.currentTarget.dataset.id; obAge(); app.querySelector(`[data-id="${OB.age}"]`).focus(); });
    document.getElementById('back').onclick = obWelcome;
    document.getElementById('next').onclick = () => OB.age && obInterests();
  }
  function obInterests() {
    render(`${dots(1)}<h1>What do you love?</h1><p class="muted">Pick as many as you like. We'll find stories about them.</p>
      <div class="choice-grid">${INTERESTS.map(i => `<button class="choice" aria-pressed="${OB.interests.includes(i.id)}" data-id="${i.id}"><span class="e" aria-hidden="true">${i.e}</span>${esc(i.label)}</button>`).join('')}</div>
      <div class="row"><button class="btn" id="back">Back</button><button class="btn primary" id="next" ${OB.interests.length ? '' : 'disabled'}>Next</button></div>`, { focusMode: true });
    on('.choice', 'click', e => {
      const id = e.currentTarget.dataset.id;
      OB.interests = OB.interests.includes(id) ? OB.interests.filter(x => x !== id) : OB.interests.concat(id);
      e.currentTarget.setAttribute('aria-pressed', OB.interests.includes(id));
      document.getElementById('next').disabled = !OB.interests.length;
    });
    document.getElementById('back').onclick = obAge;
    document.getElementById('next').onclick = () => OB.interests.length && obGoals();
  }
  function obGoals() {
    render(`${dots(2)}<h1>What are your goals?</h1>
      <div class="choice-grid">${GOALS.map(g => `<button class="choice" aria-pressed="${OB.goals.includes(g.id)}" data-id="${g.id}"><span class="e" aria-hidden="true">${g.e}</span>${esc(g.label)}</button>`).join('')}</div>
      <h2>Daily practice</h2>
      <div class="seg" role="group" aria-label="Minutes per day">${[5, 10, 15, 20].map(m => `<button data-min="${m}" aria-pressed="${OB.minutes === m}">${m} min</button>`).join('')}</div>
      <div class="row" style="margin-top:20px"><button class="btn" id="back">Back</button><button class="btn primary" id="next">Next</button></div>`, { focusMode: true });
    on('.choice', 'click', e => {
      const id = e.currentTarget.dataset.id;
      OB.goals = OB.goals.includes(id) ? OB.goals.filter(x => x !== id) : OB.goals.concat(id);
      e.currentTarget.setAttribute('aria-pressed', OB.goals.includes(id));
    });
    on('[data-min]', 'click', e => { OB.minutes = +e.currentTarget.dataset.min; app.querySelectorAll('[data-min]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.min === OB.minutes)); });
    document.getElementById('back').onclick = obInterests;
    document.getElementById('next').onclick = obReady;
  }
  function obReady() {
    S.profile = { name: OB.name, age: OB.age, interests: OB.interests, goals: OB.goals.length ? OB.goals : ['own'], minutes: OB.minutes, created: Date.now() };
    save(); obPlacementIntro();
  }
  function obPlacementIntro() {
    const nm = S.profile.name;
    render(`${dots(3)}<div class="hero"><div class="buddy center-b">${mascot('think', 'md')}<p class="speech">Ready for a quick reading game? 🧭</p></div>
      <h1>Let's find your first step${nm ? ', ' + esc(nm) : ''}!</h1>
      <p>Answer a few quick questions. They get easier or harder as you go, so it's fine to say "I'm not sure".</p>
      <p class="muted">Turn your sound on. Tap 🔊 to hear things again.</p></div>
      <div class="stack"><button class="btn primary block" id="start">Start the placement game</button>
      <button class="btn ghost" id="skip">Skip it and start from the very beginning</button></div>`, { focusMode: true });
    document.getElementById('start').onclick = () => startDiag({});
    document.getElementById('skip').onclick = () => { setPlacement(0, 'skipped'); viewHome(); };
  }

  /* ---------- item generators ---------- */
  function variants(w) {
    const out = new Set(), lw = w.toLowerCase();
    for (let i = 0; i < lw.length; i++) if ('aeiou'.includes(lw[i])) for (const v of 'aeiou') if (v !== lw[i]) out.add(lw.slice(0, i) + v + lw.slice(i + 1));
    const sw = { b: 'd', d: 'b', p: 'b', m: 'n', n: 'm', t: 'f', s: 'z', h: 'n', c: 'k', g: 'j', l: 't', r: 'n', f: 't', w: 'v', k: 'c', j: 'g' };
    if (sw[lw[0]]) out.add(sw[lw[0]] + lw.slice(1));
    const e = lw.length - 1; if (sw[lw[e]]) out.add(lw.slice(0, e) + sw[lw[e]]);
    out.delete(lw); return shuffle([...out]);
  }
  function wordOpts(w, pool) {
    const others = shuffle(pool.filter(x => x.toLowerCase() !== w.toLowerCase()));
    const v = variants(w);
    const ds = uniq([v[0], others[0], others[1], ...v.slice(1), ...others.slice(2)].filter(Boolean)).filter(x => x.toLowerCase() !== w.toLowerCase()).slice(0, 3);
    return shuffle([w, ...ds]).map(t => ({ text: t, correct: t === w }));
  }
  function letterOpts(l) {
    const ds = shuffle(ALPHA.filter(x => x !== l)).slice(0, 3);
    return shuffle([l, ...ds]).map(t => ({ text: t, correct: t === l }));
  }
  const itLetter = () => { const l = rand(ALPHA); return { key: 'L' + l, skill: 'Letter recognition', prompt: 'Listen, then tap the letter you hear.', say: `The letter ${l.toUpperCase()}.`, options: letterOpts(l), optClass: 'letters' }; };
  const itFirst = letters => { const l = rand(letters.filter(x => KEYWORDS[x])); const [word, e] = KEYWORDS[l]; return { key: 'F' + l, skill: 'Phonics: first sounds', prompt: `What sound does “${word}” start with? Tap the letter.`, say: word, big: e, options: letterOpts(l), optClass: 'letters', answerSay: `${word} starts with ${l.toUpperCase()}` }; };
  const itPic = (o, pool) => ({ key: 'P' + o.w, skill: 'Decoding', prompt: 'Read the words. Which one matches the picture?', big: o.e, options: wordOpts(o.w, pool), answerSay: o.w });
  const itHear = (w, pool, skill = 'Decoding') => ({ key: 'H' + w, skill, prompt: 'Listen, then tap the word you hear.', say: w, options: wordOpts(w, pool), answerSay: w });
  const itBuild = o => ({ key: 'B' + o.w, type: 'build', skill: 'Phonics: build a word', prompt: 'Build the word you hear.', say: o.w, big: o.e, word: o.w, answerSay: o.w });
  const itSentence = s => ({ key: 'S' + s.s, skill: 'Sentence reading', prompt: 'Read the sentence. Which picture matches?', bigHtml: `<p class="sentence">${esc(s.s)}</p>`, optClass: 'pics',
    options: shuffle(s.opts.map(([t, label, c]) => ({ text: t, label, correct: !!c }))), answerSay: s.s });
  const itPassage = p => ({ key: 'Q' + p.q, skill: 'Comprehension', prompt: p.q, bigHtml: `<p class="passage">${esc(p.p)}</p>`, optClass: 'wide',
    options: shuffle(p.a.map((t, i) => ({ text: t, correct: i === 0 }))) });

  /* ---------- diagnostic (adaptive staircase) ---------- */
  function genDiag(d) {
    if (d <= 0) return itLetter();
    if (d === 1) return itFirst(ALPHA);
    if (d === 2) { const ws = wordsOf(1).concat(wordsOf(2)); const pool = ws.map(o => o.w); return Math.random() < 0.5 ? itPic(rand(ws.filter(o => o.e)), pool) : itHear(rand(ws).w, pool); }
    if (d === 3) {
      if (Math.random() < 0.45) { const sw = LEVELS[2].sight.concat(LEVELS[3].sight); return itHear(rand(sw), sw.concat(LEVELS[4].sight), 'Sight words'); }
      const ws = wordsOf(3); return itPic(rand(ws.filter(o => o.e)), ws.map(o => o.w));
    }
    if (d <= 6) {
      const r = Math.random(), ws = wordsOf(d);
      if (r < 0.4) return itSentence(rand(DIAG_SENTENCES.filter(s => s.tier === d)));
      if (r < 0.75) return itPic(rand(ws.filter(o => o.e)), ws.map(o => o.w));
      const sw = LEVELS[d].sight; return itHear(rand(sw), sw.concat(LEVELS[d - 1].sight), 'Sight words');
    }
    return itPassage(rand(DIAG_PASSAGES.filter(p => p.tier === d)));
  }
  function startDiag({ start, max = 12, recheck = false }) {
    const age = AGES.find(a => a.id === (S.profile && S.profile.age)) || AGES[1];
    const D = { d: start !== undefined ? start : age.start, n: 0, max, log: [], used: new Set(), wrongRun: 0, recheck };
    nextDiag(D);
  }
  function nextDiag(D) {
    if (D.n >= D.max || (D.n >= 5 && D.wrongRun >= 3 && D.d === 0)) return finishDiag(D);
    let item; for (let t = 0; t < 15; t++) { item = genDiag(D.d); if (!D.used.has(item.key)) break; }
    D.used.add(item.key);
    const header = `<div class="lesson-top"><button class="icon-btn" data-act="close" aria-label="Leave the placement game">✕</button>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${D.max}" aria-valuenow="${D.n}"><span style="width:${D.n / D.max * 100}%"></span></div><span class="pg">${D.n + 1}/${D.max}</span></div>`;
    showItem(item, { mode: 'diag', header,
      onClose: () => { if (confirm('Stop the placement game? Your answers so far will be used.')) finishDiag(D); },
      onDone: correct => {
        D.log.push({ d: D.d, correct, skill: item.skill }); D.n++;
        if (correct) { D.wrongRun = 0; D.d = Math.min(10, D.d + 1); } else { D.wrongRun++; D.d = Math.max(0, D.d - 1); }
        nextDiag(D);
      } });
  }
  function estimate(log) {
    if (!log.length) return 0;
    const use = log.length > 6 ? log.slice(-6) : log;
    let lvl = Math.round(mean(use.map(x => x.correct ? x.d : x.d - 1)));
    if (!log.some(x => x.correct)) lvl = 0;
    return clamp(lvl, 0, 10);
  }
  function setPlacement(lvl, mode) {
    S.level = lvl; S.unlocked = Math.max(S.unlocked || 0, lvl);
    S.diag.push({ date: Date.now(), level: lvl, mode }); S.sinceCheck = 0; S.hist = []; save();
  }
  function finishDiag(D) {
    const prev = S.level;
    const lvl = estimate(D.log);
    setPlacement(lvl, D.recheck ? 'recheck' : 'placement');
    const L = LEVELS[lvl];
    const bySkill = {};
    D.log.forEach(x => { const k = x.skill.replace(/:.*/, ''); bySkill[k] = bySkill[k] || [0, 0]; bySkill[k][1]++; if (x.correct) bySkill[k][0]++; });
    let headline = `You're starting at ${L.name}!`;
    if (D.recheck && prev !== null) headline = lvl > prev ? `Level up! You moved to ${L.name}.` : lvl < prev ? `Let's practise ${L.name} skills for a while.` : `You're right where you should be: ${L.name}.`;
    render(`<div class="center">
      <div class="result-hero">${mascot('cheer', 'md')}<div class="level-badge" aria-hidden="true"><div><b>${lvl === 0 ? 'Pre' : lvl}</b><small>${lvl === 0 ? 'reader' : 'level'}</small></div></div></div>
      <h1>${esc(headline)}</h1>
      <p><b>${esc(L.skill)}</b></p>
      <p class="muted">${esc(L.phase)} · ${esc(L.band)}</p></div>
      <div class="card"><h2>What we checked</h2>
      <ul class="skill-list">${Object.entries(bySkill).map(([k, [c, t]]) => `<li><span>${esc(k)}</span><b>${c}/${t}</b></li>`).join('')}</ul>
      <p class="muted">Your level keeps adjusting as you practise, so don't worry if it feels too easy or too hard at first.</p>
      <button class="btn primary block" id="go">See my reading path</button></div>`, { focusMode: true });
    burst();
    speak(headline);
    document.getElementById('go').onclick = viewHome;
  }

  /* ---------- question screen ---------- */
  function showItem(item, ctx) {
    const isBuild = item.type === 'build';
    let body;
    if (isBuild) {
      const extra = shuffle(ALPHA.filter(l => !item.word.includes(l))).slice(0, 2);
      item.tiles = item.tiles || shuffle(item.word.split('').concat(extra));
      body = `<div class="slots" aria-label="Your word">${item.word.split('').map(() => '<span class="slot"></span>').join('')}</div>
        <div class="tiles">${item.tiles.map((t, i) => `<button class="tile" data-t="${i}" aria-label="letter ${t}">${esc(t)}</button>`).join('')}</div>
        <div class="row" style="margin-top:14px;justify-content:center"><button class="btn small" data-act="undo">↩ Undo</button></div>`;
    } else {
      body = `<div class="options ${item.optClass || ''}">${item.options.map((o, i) => `<button class="opt" data-i="${i}"${o.label ? ` aria-label="${esc(o.label)}"` : ''}>${esc(o.text)}</button>`).join('')}</div>`;
    }
    render(`${ctx.header}<section class="qcard">
      <p class="skill-tag">${esc(item.skill)}</p>
      <div class="prompt-row"><h1 class="prompt">${esc(item.prompt)}</h1>${item.say ? '<button class="icon-btn" data-act="say" aria-label="Hear it again">🔊</button>' : ''}</div>
      ${item.big ? `<div class="big-emoji">${esc(item.big)}</div>` : ''}${item.bigHtml || ''}${item.peek || ''}
      ${body}
      <div class="q-foot">${ctx.mode === 'diag' ? '<button class="btn ghost" data-act="skip">I\'m not sure</button>' : ''}</div>
      <div class="feedback" id="fb"></div></section>`, { focusMode: true });

    const sayIt = () => item.say && speak(item.say);
    on('[data-act="say"]', 'click', sayIt);
    on('[data-act="close"]', 'click', ctx.onClose);
    if (item.say) setTimeout(sayIt, 250);
    let answered = false;
    const finish = (correct, chosenEl) => {
      if (answered) return; answered = true;
      app.querySelectorAll('.opt, .tile, [data-act="skip"], [data-act="undo"]').forEach(b => { b.disabled = true; });
      if (ctx.mode === 'diag') {
        if (chosenEl) chosenEl.classList.add('picked');
        setTimeout(() => ctx.onDone(correct), 450);
        return;
      }
      tone(correct);
      const right = isBuild ? item.word : item.options.find(o => o.correct).text;
      if (!isBuild) app.querySelectorAll('.opt').forEach((b, i) => { if (item.options[i].correct) b.classList.add('correct'); });
      if (chosenEl && !correct) chosenEl.classList.add('wrong');
      const fb = document.getElementById('fb');
      const praise = rand(['Great job!', 'Brilliant!', 'You got it!', 'Super reading!', 'Awesome!']);
      fb.className = 'feedback show ' + (correct ? 'ok' : 'no');
      const rightLabel = (item.options && item.options.find(o => o.correct).label) || right;
      fb.innerHTML = `<span class="msg">${mascot(correct ? 'cheer' : 'think')}<span>${correct ? praise : 'Nearly! The answer is: ' + esc(rightLabel)}</span></span><button class="btn ${correct ? 'good' : 'primary'}" id="cont">Continue</button>`;
      announce(correct ? praise : 'Nearly. The answer is ' + rightLabel);
      if (item.answerSay) setTimeout(() => speak(correct ? item.answerSay : item.answerSay), 350);
      const c = document.getElementById('cont'); c.focus(); c.onclick = () => ctx.onDone(correct);
    };
    on('.opt', 'click', e => { const i = +e.currentTarget.dataset.i; finish(item.options[i].correct, e.currentTarget); });
    on('[data-act="skip"]', 'click', () => finish(false, null));
    if (isBuild) {
      const built = [];
      const slots = app.querySelectorAll('.slot');
      const draw = () => slots.forEach((s, i) => { s.textContent = built[i] !== undefined ? item.tiles[built[i]] : ''; s.classList.toggle('filled', built[i] !== undefined); });
      on('.tile', 'click', e => {
        const t = +e.currentTarget.dataset.t; built.push(t); e.currentTarget.disabled = true; speak(item.tiles[t]); draw();
        if (built.length === item.word.length) finish(built.map(i => item.tiles[i]).join('') === item.word, null);
      });
      on('[data-act="undo"]', 'click', () => { const t = built.pop(); if (t !== undefined) app.querySelector(`.tile[data-t="${t}"]`).disabled = false; draw(); });
    }
  }

  /* ---------- lessons ---------- */
  const lid = (L, t) => `${L}-${t}`;
  function storyFor(L) {
    const id = S.pathStory[L];
    const found = id && STORIES.find(s => s.id === id);
    if (found) return found;
    const cands = STORIES.filter(s => s.level === L);
    const ints = (S.profile && S.profile.interests) || [];
    const pref = cands.filter(s => ints.includes(s.interest) && !S.read[s.id]).concat(cands.filter(s => ints.includes(s.interest)), cands.filter(s => !S.read[s.id]), cands);
    const st = pref[0];
    S.pathStory[L] = st.id; save();
    return st;
  }
  function phonicsItems(L) {
    const lv = LEVELS[L], ws = shuffle(wordsOf(L)), pool = ws.map(o => o.w), items = [];
    if (L <= 1) { const letters = lv.graphemes.filter(g => g.length === 1); items.push(itFirst(letters), itFirst(letters)); }
    ws.slice(0, L <= 1 ? 6 : 8).forEach((o, i) => {
      const kind = i % 3;
      if (kind === 0 && o.e) items.push(itPic(o, pool));
      else if (kind === 1 && o.w.length <= 6 && L <= 7) items.push(itBuild(o));
      else items.push(itHear(o.w, pool, 'Phonics'));
    });
    return items.map(it => Object.assign(it, { skill: it.skill.startsWith('Decoding') ? 'Phonics' : it.skill }));
  }
  function sentencesWith(word, maxLevel) {
    const re = new RegExp(`(^|[^A-Za-z’'])(${word})([^A-Za-z’']|$)`, word === 'I' ? '' : 'i');
    const out = [];
    STORIES.filter(s => s.level <= maxLevel + 1).forEach(s => s.pages.forEach(p => p.split(/(?<=[.!?”"])\s+/).forEach(sent => { if (re.test(sent) && sent.split(' ').length >= 3 && sent.split(' ').length <= 16) out.push(sent); })));
    return { re, list: uniq(out) };
  }
  function sightItems(L) {
    const sw = LEVELS[L].sight, pool = uniq(sw.concat(LEVELS[Math.max(0, L - 1)].sight, LEVELS[Math.min(10, L + 1)].sight));
    const items = shuffle(sw).slice(0, 4).map(w => itHear(w, pool, 'Tricky words'));
    shuffle(sw).forEach(w => {
      if (items.length >= 7) return;
      const { re, list } = sentencesWith(w, L);
      if (!list.length) return;
      const sent = rand(list), m = sent.match(re);
      const idx = m.index + m[1].length, actual = m[2];
      items.push({ key: 'G' + w, skill: 'Tricky words', prompt: 'Which word fits the gap?', answerSay: sent,
        bigHtml: `<p class="sentence">${esc(sent.slice(0, idx))}<span class="gap" aria-label="gap"> </span>${esc(sent.slice(idx + actual.length))}</p>`,
        options: wordOpts(actual, pool.map(p => /^[A-Z]/.test(actual) && p !== 'I' ? p[0].toUpperCase() + p.slice(1) : p)) });
    });
    while (items.length < 6) items.push(itHear(rand(sw), pool, 'Tricky words'));
    return items;
  }
  function quizItems(story) {
    const peek = `<details class="peek"><summary>📖 Peek at the story</summary><div class="passage">${story.pages.map(esc).join(' ')}</div></details>`;
    const items = story.q.map(([q, ...a]) => Object.assign(itPassage({ p: '', q, a }), { bigHtml: '', peek, skill: 'Comprehension' }));
    const words = uniq(story.pages.join(' ').split(/\s+/).map(w => w.replace(/[^A-Za-z’'-]/g, '')).filter(w => w.length >= 4)).sort((a, b) => b.length - a.length);
    const vocab = shuffle(words.slice(0, 8)).slice(0, 2);
    vocab.forEach(w => items.push(itHear(w, words, 'Story words')));
    return items;
  }
  function lessonState(L, t) {
    const r = S.lessons[lid(L, t)];
    if (r && r.stars) return 'done';
    if (L > S.unlocked) return 'locked';
    if (L < S.level) return 'open';
    const idx = TYPES.findIndex(x => x.id === t);
    if (idx === 0) return 'open';
    const prev = S.lessons[lid(L, TYPES[idx - 1].id)];
    return prev && prev.stars ? 'open' : 'locked';
  }
  function nextLesson() {
    for (const t of TYPES) if (lessonState(S.level, t.id) === 'open') return { L: S.level, t: t.id };
    for (let L = 0; L <= S.unlocked; L++) for (const t of TYPES) if (lessonState(L, t.id) === 'open') return { L, t: t.id };
    return null;
  }
  function startLesson(L, t) {
    const lv = LEVELS[L];
    if (t === 'story') return viewReader(storyFor(L), { onFinish: r => completeLesson(L, 'story', r.stars, null), onClose: viewHome });
    if (t === 'quiz') return runLesson(quizItems(storyFor(L)), (c, n) => completeLesson(L, 'quiz', null, [c, n]));
    if (t === 'phonics') {
      const cards = lv.graphemes.map(g => {
        const core = g.replace(/[-_e]$/, '').replace(/^-/, '').replace('_', '');
        const ex = lv.words.map(pw).find(o => o.w.includes(g.replace(/-/g, ''))) || lv.words.map(pw).find(o => o.w.includes(core)) || pw(lv.words[0]);
        const k = g.replace(/-/g, '');
        const at = ex.w.indexOf(k);
        const exHtml = at >= 0 && !g.includes('_') ? `${esc(ex.w.slice(0, at))}<b>${esc(k)}</b>${esc(ex.w.slice(at + k.length))}` : esc(ex.w);
        return { g, ex, exHtml };
      });
      return intro(`${lv.skill}`, 'Tap each card to hear a word with that sound. Then start the practice!',
        cards.map((c, i) => `<button class="intro-card" data-i="${i}"><span class="g">${esc(c.g)}</span><span class="ex">${c.ex.e ? c.ex.e + ' ' : ''}${c.exHtml}</span></button>`).join(''),
        i => speak(cards[i].ex.w), () => runLesson(phonicsItems(L), (c, n) => completeLesson(L, 'phonics', null, [c, n])));
    }
    if (t === 'sight') {
      return intro('Tricky words', 'These words are tricky to sound out, so we learn them by heart. Tap each one, say it out loud, then start.',
        lv.sight.map((w, i) => `<button class="intro-card" data-i="${i}"><span class="g">${esc(w)}</span></button>`).join(''),
        i => speak(lv.sight[i]), () => runLesson(sightItems(L), (c, n) => completeLesson(L, 'sight', null, [c, n])));
    }
  }
  function intro(title, text, cardsHtml, onCard, onStart) {
    render(`<div class="lesson-top"><button class="icon-btn" data-act="close" aria-label="Close lesson">✕</button><div class="bar"><span style="width:0"></span></div></div>
      <h1>${esc(title)}</h1><p>${esc(text)}</p>
      <div class="intro-grid">${cardsHtml}</div>
      <button class="btn primary block" id="start">Start practice</button>`, { focusMode: true });
    on('.intro-card', 'click', e => { e.currentTarget.classList.add('heard'); onCard(+e.currentTarget.dataset.i); });
    on('[data-act="close"]', 'click', viewHome);
    document.getElementById('start').onclick = onStart;
  }
  function runLesson(items, onFinish) {
    const queue = items.slice(); const total = items.length; let firstTry = 0, doneCount = 0;
    const step = () => {
      if (!queue.length) return onFinish(firstTry, total);
      const item = queue.shift();
      const prog = doneCount / (doneCount + queue.length + 1);
      const header = `<div class="lesson-top"><button class="icon-btn" data-act="close" aria-label="Close lesson">✕</button>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(prog * 100)}"><span style="width:${prog * 100}%"></span></div></div>`;
      showItem(item, { mode: 'lesson', header,
        onClose: () => { if (confirm('Leave this lesson? Progress in this lesson will be lost.')) viewHome(); },
        onDone: correct => {
          doneCount++;
          if (!item._retry) { if (correct) firstTry++; else queue.push(Object.assign({}, item, { _retry: true, tiles: null, options: item.options && shuffle(item.options) })); }
          S.hist.push(correct ? 1 : 0); if (S.hist.length > 60) S.hist = S.hist.slice(-60);
          step();
        } });
    };
    step();
  }
  function bumpActivity() {
    const t = dayStr();
    if (S.today.day !== t) S.today = { day: t, n: 0 };
    S.today.n++;
    if (S.streak.last !== t) { S.streak.n = S.streak.last === dayStr(new Date(Date.now() - 864e5)) ? S.streak.n + 1 : 1; S.streak.last = t; }
  }
  const goalPerDay = () => Math.max(1, Math.round(((S.profile && S.profile.minutes) || 10) / 5));
  function completeLesson(L, t, starsGiven, score) {
    let stars = starsGiven, acc = 1, xp;
    if (score) { acc = score[1] ? score[0] / score[1] : 1; stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1; xp = score[0] * 10 + stars * 5; } else xp = 20 + stars * 5;
    const key = lid(L, t), prev = S.lessons[key] || {};
    S.lessons[key] = { stars: Math.max(prev.stars || 0, stars), plays: (prev.plays || 0) + 1, last: Date.now() };
    const wasGoal = S.today.day === dayStr() && S.today.n >= goalPerDay();
    S.xp += xp; bumpActivity(); S.sinceCheck++;
    const msgs = adapt(L);
    if (!wasGoal && S.today.n >= goalPerDay()) msgs.unshift({ kind: 'up', text: `🎯 Daily goal reached! Your streak is ${S.streak.n} day${S.streak.n === 1 ? '' : 's'}.` });
    save();
    const nxt = nextLesson();
    render(`<div class="center" style="padding-top:12px">
      <div class="buddy center-b">${mascot(stars >= 2 ? 'cheer' : 'happy', 'md')}</div>
      <div class="big-stars" aria-label="${stars} out of 3 stars">${starsHtml(stars)}</div>
      <h1>${stars === 3 ? 'Amazing!' : stars === 2 ? 'Great work!' : 'Good try!'}</h1>
      <p>${TYPES.find(x => x.id === t).icon} ${TYPES.find(x => x.id === t).label} · ${esc(LEVELS[L].name)}</p>
      <div class="statgrid"><div class="stat pop xp-stat"><b id="xpn">+${xp}</b><small>XP</small></div><div class="stat pop"><b>${score ? Math.round(acc * 100) + '%' : '✓'}</b><small>${score ? 'first try' : 'finished'}</small></div><div class="stat pop"><b>🔥 ${S.streak.n}</b><small>streak</small></div></div>
      ${msgs.map(m => `<div class="msg-card ${m.kind}">${esc(m.text)}${m.kind === 'check' ? '<br><button class="btn small primary" id="chk" style="margin-top:8px">Take a level check</button>' : ''}</div>`).join('')}
      <div class="stack" style="margin-top:16px">
      ${nxt ? `<button class="btn primary block" id="next">Next: ${TYPES.find(x => x.id === nxt.t).icon} ${TYPES.find(x => x.id === nxt.t).label}</button>` : ''}
      ${stars < 3 && t !== 'story' ? '<button class="btn block" id="again">Try again for 3 stars</button>' : ''}
      <button class="btn block" id="home">Back to my path</button></div></div>`, { focusMode: true });
    if (stars >= 2) burst();
    countUp(document.getElementById('xpn'), xp);
    setTimeout(() => xpFloat(xp, document.getElementById('xpn')), 700);
    speak(stars === 3 ? 'Amazing! Three stars!' : stars === 2 ? 'Great work!' : 'Good try! Keep going.');
    const b = id => document.getElementById(id);
    if (b('next')) b('next').onclick = () => startLesson(nxt.L, nxt.t);
    if (b('again')) b('again').onclick = () => startLesson(L, t);
    if (b('chk')) b('chk').onclick = () => startDiag({ start: S.level, max: 8, recheck: true });
    b('home').onclick = viewHome;
  }
  /* Re-assessment: adapt level from rolling performance */
  function adapt(L) {
    const msgs = [];
    const done = TYPES.every(t => (S.lessons[lid(L, t.id)] || {}).stars);
    if (done && L === S.level && L < 10) {
      const avg = mean(TYPES.map(t => S.lessons[lid(L, t.id)].stars));
      if (avg >= 2) {
        S.level = L + 1; S.unlocked = Math.max(S.unlocked, L + 1); S.hist = [];
        msgs.push({ kind: 'up', text: `🚀 Level up! You unlocked ${LEVELS[L + 1].name}: ${LEVELS[L + 1].skill}.` });
      } else msgs.push({ kind: 'info', text: 'Replay a lesson to lift your average to 2 stars and unlock the next level.' });
    }
    const h = S.hist;
    if (h.length >= 12 && mean(h.slice(-12)) < 0.5 && S.level > 0 && L === S.level) {
      S.level -= 1; S.hist = [];
      TYPES.forEach(t => { delete S.lessons[lid(S.level, t.id)]; });
      delete S.pathStory[S.level];
      msgs.push({ kind: 'down', text: `Let's strengthen ${LEVELS[S.level].name} skills (${LEVELS[S.level].skill}) with fresh lessons. Your other levels stay unlocked.` });
    } else if (h.length >= 20 && mean(h.slice(-20)) >= 0.95 && S.level < 10 && !msgs.some(m => m.kind === 'up')) {
      msgs.push({ kind: 'check', text: '⚡ You\'re flying! A quick level check could let you skip ahead.' });
    }
    return msgs;
  }

  /* ---------- home / learning path ---------- */
  function viewHome() {
    const nxt = nextLesson();
    const goal = goalPerDay(), todayN = S.today.day === dayStr() ? S.today.n : 0;
    const pct = Math.min(100, Math.round(todayN / goal * 100));
    const name = S.profile && S.profile.name;
    let levelsHtml = '', gi = 0;
    for (let L = 0; L <= 10; L++) {
      const lv = LEVELS[L];
      const locked = L > S.unlocked;
      const cls = locked ? 'locked' : L < S.level ? 'past' : '';
      levelsHtml += `<section class="level-sec" id="lvl-${L}" data-u="${L % 6}" aria-labelledby="lh-${L}">
        <div class="level-head ${cls}"><span class="num" aria-hidden="true">${locked ? '🔒' : L === 0 ? 'P' : L}</span>
        <div><b id="lh-${L}">${esc(lv.name)}${L === S.level ? ' · you are here' : ''}</b><small>${esc(lv.skill)}</small><small>${esc(lv.phase)} · ${esc(lv.band)}</small></div></div>`;
      if (!locked) {
        const st = storyFor(L);
        levelsHtml += `<div class="path">${TYPES.map(t => {
          const state = lessonState(L, t.id), rec = S.lessons[lid(L, t.id)] || {};
          const isCur = nxt && nxt.L === L && nxt.t === t.id;
          const label = t.id === 'story' ? `${t.label}: ${st.title}` : t.id === 'quiz' ? `Quiz: ${st.title}` : t.label;
          const x = Math.round(Math.sin(gi++ * 1.1) * 72);
          return `<div class="node-wrap" style="--x:${x}px">${isCur ? '<span class="start-tip" aria-hidden="true">START</span>' : ''}<button class="node ${state} ${isCur ? 'current' : ''}" data-l="${L}" data-t="${t.id}" ${state === 'locked' ? 'aria-disabled="true"' : ''}
            aria-label="${esc(label)}, ${state === 'done' ? rec.stars + ' stars' : state === 'locked' ? 'locked' : 'ready'}">${state === 'locked' ? '🔒' : t.icon}</button>
            <span class="node-label">${esc(label)}</span>${state === 'done' ? `<span class="stars" aria-hidden="true">${starsHtml(rec.stars)}</span>` : ''}</div>`;
        }).join('')}</div>`;
      }
      levelsHtml += '</section>';
      if (locked && L > S.unlocked + 1) { levelsHtml += `<p class="muted center more-levels">${10 - L} more level${10 - L === 1 ? '' : 's'} to discover after this.</p>`; break; }
    }
    render(`<div class="home-hi">${mascot(pct >= 100 ? 'cheer' : 'happy', 'sm')}<h1>${name ? 'Hi ' + esc(name) + '!' : 'Your reading path'} <span aria-hidden="true">👋</span></h1></div>
      <div class="card today">
        <div class="ring" style="--p:${pct}" role="img" aria-label="Daily goal: ${todayN} of ${goal} lessons"><span>${todayN}/${goal}</span></div>
        <div class="today-main"><b>${pct >= 100 ? 'Daily goal done! 🎉' : 'Today\'s goal'}</b><p class="muted" style="margin:0 0 8px">${goal} lesson${goal > 1 ? 's' : ''} a day (${S.profile.minutes} min)</p>
        ${nxt ? `<button class="btn primary" id="cont">▶ Continue: ${TYPES.find(x => x.id === nxt.t).label}</button>` : '<p>Every unlocked lesson is done. Read from the Library or take a level check!</p>'}</div>
      </div>
      ${S.sinceCheck >= 12 ? '<div class="banner"><span>🧭 It\'s been a while. Check your level?</span><button class="btn small primary" id="recheck">Level check</button></div>' : ''}
      ${levelsHtml}`, { tab: 'home' });
    if (document.getElementById('cont')) document.getElementById('cont').onclick = () => startLesson(nxt.L, nxt.t);
    if (document.getElementById('recheck')) document.getElementById('recheck').onclick = () => startDiag({ start: S.level, max: 8, recheck: true });
    on('.node', 'click', e => {
      const b = e.currentTarget;
      if (b.getAttribute('aria-disabled') === 'true') { announce('Finish the lesson before this one to unlock it.'); tone(false); return; }
      startLesson(+b.dataset.l, b.dataset.t);
    });
    drawPathLines();
    const cur = app.querySelector('.node.current');
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  }

  /* winding trail behind the path nodes */
  function drawPathLines() {
    app.querySelectorAll('.path').forEach(path => {
      const old = path.querySelector('.path-line'); if (old) old.remove();
      const box = path.getBoundingClientRect();
      const pts = [...path.querySelectorAll('.node')].map(n => { const r = n.getBoundingClientRect(); return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, done: n.classList.contains('done') }; });
      if (pts.length < 2) return;
      let segs = '';
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2;
        segs += `<path class="trail${a.done ? ' done' : ''}" d="M${a.x} ${a.y}C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}"/>`;
      }
      path.insertAdjacentHTML('afterbegin', `<svg class="path-line" aria-hidden="true" focusable="false">${segs}</svg>`);
    });
  }
  let rzT; window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(drawPathLines, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawPathLines);

  /* ---------- reader: tap-to-hear, read-along, read-aloud ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let rec = null;
  const norm = w => w.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9-]/g, '');
  const CANON = { two: 'to', too: 'to', there: 'their', theyre: 'their', four: 'for', hear: 'here', mister: 'mr', missus: 'mrs', ok: 'okay',
    '1': 'one', '2': 'to', '3': 'three', '4': 'for', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '16': 'sixteen', '90': 'ninety', '400': 'fourhundred', '40': 'forty' };
  const canon = w => CANON[w] || w;
  function lev(a, b) {
    const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 3;
    let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[n];
  }
  function similar(t, h) {
    t = canon(t.replace(/-/g, '')); h = canon(h.replace(/-/g, ''));
    if (!t) return true;
    if (t === h) return true;
    if (t.length >= 4 && lev(t, h) <= 1) return true;
    return t.length >= 7 && lev(t, h) <= 2;
  }
  function align(target, heard) {
    const m = target.map(() => false); let j = 0;
    for (let i = 0; i < target.length; i++) {
      if (!target[i]) { m[i] = true; continue; }
      for (let k = j; k < Math.min(heard.length, j + 4); k++) {
        if (similar(target[i], heard[k])) { m[i] = true; j = k + 1; break; }
        if (k + 1 < heard.length && similar(target[i], heard[k] + heard[k + 1])) { m[i] = true; j = k + 2; break; }
      }
    }
    return m;
  }
  function recLang() { const l = navigator.language || 'en-AU'; return /^en/i.test(l) ? l : 'en-AU'; }

  function viewReader(story, { onFinish, onClose }) {
    let page = 0; const best = {}; let selfRead = false; let along = false;
    const draw = () => {
      const tokens = story.pages[page].split(/\s+/).filter(Boolean);
      const last = page === story.pages.length - 1;
      render(`<div class="lesson-top"><button class="icon-btn" data-act="close" aria-label="Close story">✕</button>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${story.pages.length}" aria-valuenow="${page + 1}"><span style="width:${(page + 1) / story.pages.length * 100}%"></span></div><span class="pg">${page + 1}/${story.pages.length}</span></div>
        <article class="card reader">
          <h1 class="story-title"><span aria-hidden="true">${story.emoji}</span> ${esc(story.title)}</h1>
          <p class="story-text" id="st">${tokens.map((t, i) => `<button class="w" data-i="${i}">${esc(t)}</button>`).join(' ')}</p>
          <p class="hint" id="hint" aria-live="polite">Tap any word to hear it.</p>
          ${last ? `<label class="selfcheck"><input type="checkbox" id="self" ${selfRead ? 'checked' : ''}> I read this story out loud by myself</label>` : ''}
        </article>
        <div class="reader-ctrl">
          <button class="btn" data-act="along" aria-pressed="false">🔊 Read to me</button>
          <button class="btn" data-act="mic" ${SR ? '' : 'aria-disabled="true"'}>🎤 I'll read</button>
          <button class="btn" data-act="prev" ${page === 0 ? 'disabled' : ''}>◀ Back</button>
          <button class="btn primary" data-act="next">${last ? 'Finish ✓' : 'Next ▶'}</button>
        </div>`, { focusMode: true });
      const spans = [...app.querySelectorAll('.w')];
      const hint = t => { document.getElementById('hint').textContent = t; };
      const words = tokens.map(t => t.replace(/^[“"‘'(]+|[”"’'),.!?;:]+$/g, ''));
      on('.w', 'click', e => { const i = +e.currentTarget.dataset.i; speak(words[i] || tokens[i], { rate: Math.max(0.6, S.settings.rate - 0.1) }); });
      on('[data-act="close"]', 'click', onClose);
      on('[data-act="prev"]', 'click', () => { page--; draw(); });
      on('[data-act="next"]', 'click', () => {
        if (!last) { page++; draw(); return; }
        const accs = Object.values(best);
        const micGood = accs.length && mean(accs) >= 0.8;
        const stars = 2 + ((micGood || selfRead) ? 1 : 0);
        S.read[story.id] = { stars: Math.max(stars, (S.read[story.id] || {}).stars || 0), acc: accs.length ? Math.round(mean(accs) * 100) : null, date: Date.now() };
        save(); onFinish({ stars });
      });
      const self = document.getElementById('self'); if (self) self.onchange = () => { selfRead = self.checked; };

      // Read-along highlight
      const offsets = []; { let pos = 0; const text = story.pages[page]; tokens.forEach(t => { const at = text.indexOf(t, pos); offsets.push(at); pos = at + t.length; }); }
      const alongBtn = app.querySelector('[data-act="along"]');
      let timer = null;
      const hl = i => spans.forEach((s, j) => s.classList.toggle('hl', j === i));
      const stopAlong = () => { along = false; clearInterval(timer); hl(-1); alongBtn.setAttribute('aria-pressed', 'false'); alongBtn.textContent = '🔊 Read to me'; };
      alongBtn.onclick = () => {
        if (along) { stopAudio(); stopAlong(); return; }
        along = true; alongBtn.setAttribute('aria-pressed', 'true'); alongBtn.textContent = '⏹ Stop';
        let gotBoundary = false; const rate = Math.max(0.6, S.settings.rate - 0.05);
        speak(story.pages[page], { rate,
          onboundary: e => {
            if (e.name && e.name !== 'word') return;
            gotBoundary = true; clearInterval(timer);
            let idx = 0; for (let k = 0; k < offsets.length; k++) if (offsets[k] <= e.charIndex) idx = k;
            hl(idx);
          },
          onend: stopAlong });
        setTimeout(() => {
          if (!along || gotBoundary) return;
          let i = 0; hl(0);
          timer = setInterval(() => { i++; if (i >= spans.length) { clearInterval(timer); return; } hl(i); }, 60000 / (165 * rate));
        }, 600);
        if (!synth) { hint('Speech is not available in this browser.'); stopAlong(); }
      };

      // Read aloud with speech recognition
      const micBtn = app.querySelector('[data-act="mic"]');
      micBtn.onclick = () => {
        if (!SR) { hint('Read-aloud checking is not supported in this browser (try Chrome, Edge or Safari). You can use "Read to me", then tick "I read it myself" on the last page.'); return; }
        if (rec) { rec.stop(); return; }
        stopAudio(); if (along) stopAlong();
        const target = words.map(norm);
        let matched = target.map(() => false), err = null;
        spans.forEach(s => s.classList.remove('heard', 'missed'));
        const r = new SR(); rec = r;
        r.lang = recLang(); r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
        r.onresult = e => {
          let txt = ''; for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript + ' ';
          matched = align(target, txt.toLowerCase().split(/[\s-]+/).map(norm).filter(Boolean));
          spans.forEach((s, i) => s.classList.toggle('heard', matched[i]));
          if (matched.every(Boolean)) r.stop();
        };
        r.onerror = e => { err = e.error; };
        r.onend = () => {
          if (rec === r) rec = null;
          micBtn.textContent = '🎤 I\'ll read'; micBtn.classList.remove('listening');
          if (err === 'not-allowed' || err === 'service-not-allowed') { hint('The microphone is blocked. Allow it in your browser settings, or tick "I read it myself" on the last page.'); return; }
          if (err === 'network') { hint('Speech checking needs an internet connection in this browser. Try "Read to me" instead.'); return; }
          if (err === 'aborted') return;
          const n = matched.filter(Boolean).length;
          if (!n) { hint('I didn\'t hear any words. Tap 🎤 and read a bit louder.'); return; }
          spans.forEach((s, i) => { if (!matched[i]) s.classList.add('missed'); });
          const acc = n / target.length; best[page] = Math.max(best[page] || 0, acc);
          tone(acc >= 0.8);
          if (acc === 1) { S.xp += 5; save(); burst(['⭐', '🌟']); }
          hint(acc === 1 ? `You read all ${n} words! Perfect! (+5 XP) 🌟` : `You read ${n} of ${target.length} words. Tap the orange words to hear them, then try again!`);
        };
        try { r.start(); } catch (e) { hint('Could not start the microphone.'); rec = null; return; }
        micBtn.textContent = '⏹ Done'; micBtn.classList.add('listening');
        hint('Listening… read the words out loud. Tap Done when you finish.');
        setTimeout(() => { if (rec === r) r.stop(); }, 10000 + tokens.length * 900);
      };
    };
    draw();
  }

  /* ---------- library ---------- */
  let libFilter = { scope: 'level', interest: 'all' };
  function viewLibrary() {
    const list = STORIES.filter(s => (libFilter.scope === 'all' || Math.abs(s.level - S.level) <= 1) && (libFilter.interest === 'all' || s.interest === libFilter.interest))
      .sort((a, b) => Math.abs(a.level - S.level) - Math.abs(b.level - S.level) || a.level - b.level);
    const chip = (k, v, label) => `<button class="chip" data-k="${k}" data-v="${v}" aria-pressed="${libFilter[k] === v}">${label}</button>`;
    render(`<h1>Library</h1><p class="muted">Original stories picked for your level and interests.</p>
      <div class="filters" role="group" aria-label="Level">${chip('scope', 'level', 'Near my level')}${chip('scope', 'all', 'All levels')}</div>
      <div class="filters" role="group" aria-label="Topic">${chip('interest', 'all', 'All topics')}${INTERESTS.map(i => chip('interest', i.id, i.e + ' ' + i.label)).join('')}</div>
      <div class="book-grid">${list.map(s => {
        const r = S.read[s.id];
        const tag = s.level > S.level ? 'Challenge' : s.level < S.level ? 'Easy read' : 'Just right';
        return `<button class="book" data-id="${s.id}"><span class="cover" aria-hidden="true">${s.emoji}</span><b>${esc(s.title)}</b>
          <small>${esc(LEVELS[s.level].name)} · ${tag}</small>${r ? `<span class="stars" aria-label="${r.stars} stars">${starsHtml(r.stars)}</span>` : ''}</button>`;
      }).join('') || '<p>No stories match. Try "All levels".</p>'}</div>`, { tab: 'library' });
    on('.filters .chip', 'click', e => { libFilter[e.currentTarget.dataset.k] = e.currentTarget.dataset.v; viewLibrary(); });
    on('.book', 'click', e => {
      const s = STORIES.find(x => x.id === e.currentTarget.dataset.id);
      viewReader(s, { onClose: viewLibrary, onFinish: ({ stars }) => {
        S.xp += 15; bumpActivity(); save();
        render(`<div class="center" style="padding-top:12px"><div class="buddy center-b">${mascot('cheer', 'md')}</div><div class="big-stars" aria-label="${stars} out of 3 stars">${starsHtml(stars)}</div><h1>You finished “${esc(s.title)}”!</h1>
          <div class="statgrid" style="grid-template-columns:1fr;max-width:200px;margin:16px auto"><div class="stat pop xp-stat"><b id="xpn">+15</b><small>XP</small></div></div><div class="stack"><button class="btn primary block" id="q">🧠 Take the quiz</button><button class="btn block" id="lib">Back to Library</button></div></div>`, { focusMode: true });
        burst(); countUp(document.getElementById('xpn'), 15);
        document.getElementById('lib').onclick = viewLibrary;
        document.getElementById('q').onclick = () => runLesson(quizItems(s), (c, n) => {
          const xp = c * 10; S.xp += xp; save();
          render(`<div class="center" style="padding-top:12px"><div class="buddy center-b">${mascot('cheer', 'md')}</div><h1>Quiz done!</h1><p>${c} of ${n} right first time</p><div class="statgrid" style="grid-template-columns:1fr;max-width:200px;margin:16px auto"><div class="stat pop xp-stat"><b id="xpn">+${xp}</b><small>XP</small></div></div><button class="btn primary block" id="lib">Back to Library</button></div>`, { focusMode: true });
          if (c / n >= 0.7) burst(); countUp(document.getElementById('xpn'), xp);
          document.getElementById('lib').onclick = viewLibrary;
        });
      } });
    });
  }

  /* ---------- me / settings ---------- */
  function viewMe() {
    const p = S.profile;
    const totalStars = Object.values(S.lessons).reduce((a, r) => a + (r.stars || 0), 0);
    const voiceOpts = voices.map(v => `<option value="${esc(v.voiceURI)}" ${S.settings.voice === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
    const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button data-set="${k}" data-v="${v}" aria-pressed="${String(S.settings[k]) === String(v)}">${l}</button>`).join('')}</div>`;
    render(`<h1>${p.name ? esc(p.name) + '’s' : 'My'} progress</h1>
      <div class="statgrid"><div class="stat"><b>💎 ${S.xp}</b><small>XP</small></div><div class="stat"><b>⭐ ${totalStars}</b><small>stars</small></div><div class="stat"><b>🔥 ${streakNow()}</b><small>day streak</small></div></div>
      <div class="card"><h2>Level</h2><p><b>${esc(LEVELS[S.level].name)}</b>: ${esc(LEVELS[S.level].skill)}<br><span class="muted">${esc(LEVELS[S.level].phase)} · ${esc(LEVELS[S.level].band)} · ${Object.keys(S.read).length} stor${Object.keys(S.read).length === 1 ? "y" : "ies"} read</span></p>
      <p class="muted">Level history: ${S.diag.map(d => `${new Date(d.date).toLocaleDateString()} → ${d.level === 0 ? 'Pre' : 'L' + d.level}`).join(', ') || 'none yet'}</p>
      <button class="btn primary block" id="recheck">🧭 Check my level again</button></div>
      <div class="card" style="margin-top:16px"><h2>My interests</h2>
      <div class="filters" style="flex-wrap:wrap">${INTERESTS.map(i => `<button class="chip" data-int="${i.id}" aria-pressed="${p.interests.includes(i.id)}">${i.e} ${i.label}</button>`).join('')}</div></div>
      <div class="card" style="margin-top:16px"><h2>Settings</h2>
        <div class="setting"><label for="rate">Speaking speed</label><input type="range" id="rate" min="0.6" max="1.2" step="0.05" value="${S.settings.rate}"></div>
        <div class="setting"><label for="voice">Voice</label><select id="voice"><option value="">Automatic</option>${voiceOpts}</select><button class="btn small" id="test">🔊 Test</button></div>
        <div class="setting"><span>Font</span>${seg('font', [['lexend', 'Lexend'], ['atkinson', 'Atkinson']])}</div>
        <div class="setting"><span>Story text size</span>${seg('size', [[1.3, 'A'], [1.6, 'A+'], [2, 'A++']])}</div>
        <div class="setting"><span>Theme</span>${seg('theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']])}</div>
        <div class="setting"><span>Sound effects</span>${seg('mute', [[false, 'On'], [true, 'Off']])}</div>
        <div class="setting"><span>Daily goal</span><div class="seg" role="group">${[5, 10, 15, 20].map(m => `<button data-min="${m}" aria-pressed="${p.minutes === m}">${m}m</button>`).join('')}</div></div>
        <div class="setting"><span>Read-aloud checking</span><span class="muted">${SR ? 'Available ✅' : 'Not supported in this browser'}</span></div>
      </div>
      <button class="btn ghost block" id="reset" style="margin-top:16px">Reset all progress</button>`, { tab: 'me' });
    document.getElementById('recheck').onclick = () => startDiag({ start: S.level, max: 8, recheck: true });
    document.getElementById('rate').oninput = e => { S.settings.rate = +e.target.value; save(); };
    document.getElementById('rate').onchange = () => speak('This is how fast I will talk.');
    document.getElementById('voice').onchange = e => { S.settings.voice = e.target.value; save(); speak('Hello! Let\'s read together.'); };
    document.getElementById('test').onclick = () => speak('Hello! Let\'s read together.');
    on('[data-set]', 'click', e => {
      const k = e.currentTarget.dataset.set; let v = e.currentTarget.dataset.v;
      if (k === 'size') v = +v; if (k === 'mute') v = v === 'true';
      S.settings[k] = v; save(); applySettings(); viewMe();
    });
    on('[data-int]', 'click', e => {
      const id = e.currentTarget.dataset.int; let ints = p.interests;
      ints = ints.includes(id) ? ints.filter(x => x !== id) : ints.concat(id);
      if (!ints.length) return; p.interests = ints;
      Object.keys(S.pathStory).forEach(L => { if (!S.lessons[lid(L, 'story')]) delete S.pathStory[L]; });
      save(); viewMe();
    });
    on('[data-min]', 'click', e => { p.minutes = +e.currentTarget.dataset.min; save(); viewMe(); });
    document.getElementById('reset').onclick = () => { if (confirm('Reset all progress and start again? This cannot be undone.')) { S = fresh(); save(); applySettings(); obWelcome(); } };
  }

  /* ---------- boot ---------- */
  applySettings();
  if (!S.profile) obWelcome();
  else if (S.level === null) obPlacementIntro();
  else viewHome();
  window.ReadSteps = { state: () => S, estimate, align };
})();
