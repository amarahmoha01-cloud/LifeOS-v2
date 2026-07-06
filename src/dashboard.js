/* ============================================================
   dashboard.js  ->  LifeOS.Dashboard
   The adaptive "Today" screen. Assembles the day from every
   engine (Scoring, Training, Nutrition, Skincare, Supplements,
   Hydration, AI, Quotes) + the day's log, and renders quick-log
   controls. Pure-ish: builds HTML strings; logging mutates Log.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils, esc = U.esc;

  function ctx() {
    const profile = NS.Store.get('profile', {});
    const targets = NS.Store.get('targets', {});
    const log = NS.Log.day(0);
    const dow = new Date().getDay();               // 0 Sun .. 6 Sat
    const idx = dow === 0 ? 6 : dow - 1;           // Mon=0
    const program = NS.Training.program(profile);
    const todayTrain = program.week[idx] || { type: 'cardio', focus: 'Movement' };
    const isRestDay = todayTrain.type === 'rest';
    const fasting = U.isFastingDay() && ['sunnah', 'both'].includes(profile.fasting_pref || 'sunnah');
    const scores = NS.Scoring.all(profile, targets, log, isRestDay);
    const mission = buildMission({ profile, log, scores, fasting, todayTrain });
    return { profile, targets, log, scores, mission, fasting, todayTrain, isRestDay, dowIdx: idx };
  }

  function buildMission(c) {
    const done = c.log;
    if (c.fasting && !done.meals.suhoor) return { title: 'Fasting day — steady suhoor, gentle iftar', why: 'Sunnah fast: a natural twice-weekly deficit. Protein + water at suhoor.', cta: 'meals' };
    if (c.todayTrain.type === 'strength' && !done.workout) return { title: 'Strength day — progressive overload', why: 'Muscle is the organ of longevity. Add a rep or slow the tempo vs last week.', cta: 'move' };
    if (c.todayTrain.type === 'hiit' && !done.workout) return { title: 'HIIT — 4×4 on the elliptical', why: 'One weekly hard session lifts VO₂max, a top predictor of lifespan (Attia).', cta: 'move' };
    if (c.todayTrain.type === 'cardio' && !done.workout) return { title: 'Zone 2 — easy 35–45 min', why: 'Conversational pace builds your fat-burning base. Put on a show.', cta: 'move' };
    if (c.scores.hydration.value < 50) return { title: 'Close your hydration ring', why: 'Sip small amounts through the day — it compounds.', cta: 'care' };
    if (c.scores.nutrition.value < 75) return { title: 'Hit your protein & meals', why: 'Protein first keeps muscle while you lose fat.', cta: 'meals' };
    return { title: 'Consistency day — protect the streak', why: 'Nothing dramatic. Log your rings, sleep early. Small, repeated, forever.', cta: 'today' };
  }

  /* ---- small view helpers ---- */
  function ring(pct, color, size) {
    const r = size / 2 - 9, C = 2 * Math.PI * r, off = C * (1 - U.clamp(pct, 0, 100) / 100);
    const cx = size / 2;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">
      <circle cx="${cx}" cy="${cx}" r="${r}" stroke="rgba(255,255,255,.08)" stroke-width="9" fill="none"/>
      <circle cx="${cx}" cy="${cx}" r="${r}" stroke="${color}" stroke-width="9" fill="none" stroke-linecap="round"
        stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="transition:stroke-dashoffset .8s var(--ease-out)"/></svg>`;
  }
  function subBar(name, s) {
    return `<div class="scorebar"><div class="sbh"><span>${name}</span><b style="color:${s.color}">${s.value}</b></div>
      <div class="sbtrack"><i style="width:${s.value}%;background:${s.color}"></i></div></div>`;
  }
  function logBtn(field, on, labelOn, labelOff, emoji) {
    return `<button class="logbtn ${on ? 'on' : ''}" data-action="log-toggle" data-field="${field}">
      <span class="lb-em">${emoji}</span><span>${on ? labelOn : labelOff}</span></button>`;
  }

  const Dashboard = {
    ctx,
    html() {
      const c = ctx();
      const s = c.scores;
      const name = esc(c.profile.name || 'friend');
      const greet = U.greeting();
      const q = NS.Quotes.ofDay();
      const streak = NS.Log.streak();
      const gl = NS.Game.levelFor(NS.Game.totalXP());
      const xpPct = Math.round(gl.intoLevel / gl.need * 100);
      const wGoal = c.targets.water_glasses || 10;
      const meals = c.log.meals || {};
      const mealSlots = c.fasting ? [['suhoor', 'Suhoor'], ['iftar', 'Iftar'], ['post', 'Post-Iftar']] : [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['snack', 'Snack'], ['dinner', 'Dinner']];
      const supps = NS.Supplements.recommend(c.profile);
      const prayers = [['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];
      const habits = c.log.habits || {};

      return `<div class="wrap">
        <div class="day-head">
          <div><div class="dh-greet">${greet}, ${name}</div>
            <div class="dh-date">${esc(U.prettyDate())}${c.fasting ? ' · 🌙 Fast day' : ''}</div></div>
          <div class="head-badges">
            <div class="lvl-chip" data-action="go" data-tab="you">L${gl.level}<span>${esc(gl.title)}</span></div>
            <div class="streak-chip">🔥 ${streak}<span>day${streak === 1 ? '' : 's'}</span></div>
          </div>
        </div>
        <div class="xpstrip"><div class="xpstrip-h"><span>Level ${gl.level} · ${esc(gl.title)}</span><span>${gl.intoLevel}/${gl.need} XP</span></div><div class="xpbar"><i style="width:${xpPct}%"></i></div></div>

        <div class="card mission" data-action="go" data-tab="${c.mission.cta}">
          <div class="mission-k">TODAY’S MISSION</div>
          <h2>${esc(c.mission.title)}</h2>
          <p>${esc(c.mission.why)}</p>
        </div>

        <div class="card">
          <div class="score-hero">
            <div class="ring-wrap">${ring(s.health.value, s.health.color, 132)}
              <div class="ring-mid"><b>${s.health.value}</b><span>Health</span></div></div>
            <div class="score-subs">
              ${subBar('Recovery', s.recovery)}${subBar('Hydration', s.hydration)}
              ${subBar('Nutrition', s.nutrition)}${subBar('Movement', s.movement)}
            </div>
          </div>
        </div>

        <div class="card coach" data-action="coach-open" style="cursor:pointer">
          <div class="coach-head"><span class="coach-av">🧠</span><b>Your coach</b></div>
          <p id="coachLine" class="coach-line">…</p>
          <div class="coach-quote">“${esc(q.q)}”<span>— ${esc(q.by)}, ${esc(q.src)}</span></div>
        </div>

        <div class="card">
          <h2>Quick log</h2><p class="sub">Tap to record today. Everything saves instantly.</p>
          <div class="water-log">
            <button class="wbtn" data-action="water-minus">−</button>
            <div class="water-read"><b>${c.log.water || 0}</b><span>/ ${wGoal} glasses · ${U.litres((c.log.water || 0) * 250)}</span></div>
            <button class="wbtn plus" data-action="water-plus">＋</button>
          </div>
          <div class="log-grid">
            ${logBtn('workout', c.log.workout, 'Workout done', c.isRestDay ? 'Rest day' : 'Log workout', '🏃')}
            ${logBtn('supps', c.log.supps, 'Supps taken', 'Supplements', '💊')}
            ${logBtn('skinAM', c.log.skinAM, 'AM skin ✓', 'AM skincare', '☀️')}
            ${logBtn('skinPM', c.log.skinPM, 'PM skin ✓', 'PM skincare', '🌙')}
          </div>
          <div class="meal-log">
            ${mealSlots.map(([k, lbl]) => `<button class="mealtog ${meals[k] ? 'on' : ''}" data-action="log-meal" data-slot="${k}">${meals[k] ? '✓ ' : ''}${lbl}</button>`).join('')}
          </div>
        </div>

        <div class="card">
          <h2>Recovery check-in</h2><p class="sub">Last night’s sleep and how you feel — drives your recovery score.</p>
          <div class="rc-row"><span>Sleep</span>
            <div class="stepper"><button class="wbtn" data-action="sleep-minus">−</button>
              <b>${c.log.sleepH != null ? c.log.sleepH : '—'}<small>h</small></b>
              <button class="wbtn plus" data-action="sleep-plus">＋</button></div></div>
          <div class="rc-row"><span>Mood</span><div class="dots">${[1, 2, 3, 4, 5].map(n => `<button class="dot ${c.log.mood >= n ? 'on' : ''}" data-action="set-mood" data-v="${n}"></button>`).join('')}</div></div>
        </div>

        <div class="card">
          <h2>Today’s workout</h2>
          <div class="row-line"><span class="rl-badge ${c.todayTrain.type}">${c.todayTrain.type}</span><div class="rl-t">${esc(c.todayTrain.focus)}</div>
            <button class="mini-cta" data-action="go" data-tab="move">Open →</button></div>
        </div>

        <div class="card">
          <h2>Skincare</h2>
          <div class="row-line"><span class="rl-badge cardio">AM</span><div class="rl-t">Cleanse → serum → moisturise → SPF</div></div>
          <div class="row-line"><span class="rl-badge hiit">PM</span><div class="rl-t">Cleanse → retinoid* → moisturise</div>
            <button class="mini-cta" data-action="go" data-tab="care">Full →</button></div>
        </div>

        <div class="card">
          <h2>Prayer rhythm</h2><p class="sub">Your five natural anchors — tap as you pray.</p>
          <div class="prayer-row">${prayers.map(([k, lbl]) => `<button class="pray ${habits[k] ? 'on' : ''}" data-action="log-habit" data-h="${k}">${lbl}</button>`).join('')}</div>
        </div>

        <div class="card challenge ${c.log.challenge ? 'done' : ''}" data-action="log-toggle" data-field="challenge">
          <div class="ch-em">${c.log.challenge ? '✅' : '🎯'}</div>
          <div><b>Daily challenge</b><p>${esc(challengeOfDay())}</p></div>
        </div>

        <div class="foot">LifeOS · Phase 3 · adaptive dashboard<br>Tap a card’s action to dive in. Everything is private to this device.</div>
      </div>`;
    },

    /* async fill for the coach line (honours the provider interface) */
    afterMount() {
      const c = ctx();
      NS.AI.morningBrief({ profile: c.profile, targets: c.targets, scores: c.scores, mission: c.mission, fasting: c.fasting })
        .then(r => { const el = document.getElementById('coachLine'); if (el && r && r.text) el.textContent = r.text; })
        .catch(() => {});
    }
  };

  const CHALLENGES = [
    'Add one extra glass of water before noon.',
    'Take a 10-minute walk after your biggest meal.',
    'Lights out 30 minutes earlier tonight.',
    'Protein with every meal today — no exceptions.',
    'Ten minutes of sunlight within an hour of waking.',
    'No screens for the last 30 minutes before bed.',
    'Swap one refined-carb snack for a whole-food one.'
  ];
  function challengeOfDay() { return CHALLENGES[new Date().getDate() % CHALLENGES.length]; }

  NS.Dashboard = Dashboard;
})(window.LifeOS = window.LifeOS || {});
