/* ============================================================
   app.js  ->  LifeOS.App
   Bootstrap + router + FIRST-PRINCIPLE gate. After onboarding,
   an Apple-Health-style shell with a bottom nav:
     Today (adaptive dashboard) · Meals · Move · Care · You
   ============================================================ */
(function (NS) {
  'use strict';
  const { Utils: U, Store, State, Engine, Onboarding } = NS;
  const esc = U.esc;
  const li = (arr) => arr.map((i) => '<li>' + esc(i) + '</li>').join('');
  const mInput = (id, label, unit) => '<div class="mi"><label>' + label + '</label><div class="inp-row"><input class="inp" id="' + id + '" type="number" inputmode="decimal" placeholder="\u2014">' + (unit ? '<div class="inp-unit">' + unit + '</div>' : '') + '</div></div>';
  const cbubble = (m) => {
    if (m.role === 'user') return '<div class="cb user">' + esc(m.text) + '</div>';
    const acts = (m.actions && m.actions.length) ? '<div class="cb-acts">' + m.actions.map(a => '<button class="cb-act" data-action="coach-act"' + (a.tab ? ' data-tab="' + a.tab + '"' : '') + '>' + esc(a.label) + '</button>').join('') + '</div>' : '';
    return '<div class="cb coach">' + esc(m.text) + acts + '</div>';
  };

  const NAV = [
    { id: 'today', label: 'Today', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    { id: 'meals', label: 'Meals', icon: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M20 3c-2 0-3 2-3 5s1 4 3 4v9"/>' },
    { id: 'move', label: 'Move', icon: '<path d="M6 12h4l2-5 3 9 2-4h1"/>' },
    { id: 'care', label: 'Care', icon: '<path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>' },
    { id: 'progress', label: 'Progress', icon: '<path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"/>' },
    { id: 'you', label: 'You', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' }
  ];

  const App = {
    _tab: 'today',
    _mealFast: null,
    _careTab: 'skin',
    _sumRange: 'week',
    _coachOpen: false,
    _kcat: 'all',
    _mod: null,

    boot() {
      Store.load();
      State.subscribe(() => this.renderRoute());
      this.wire();
      State.go(Store.get('onboarding.completed', false) ? 'home' : 'onboarding');
    },

    renderRoute(keepScroll) {
      const app = document.getElementById('app');
      if (!app) return;
      if (State.route === 'onboarding') { Onboarding.mount(app); return; }
      if (State.route !== 'home') return;
      const y = window.scrollY;
      app.innerHTML = this.shellHTML();
      if (keepScroll) window.scrollTo(0, y); else window.scrollTo({ top: 0 });
      if (this._tab === 'today' && NS.Dashboard) NS.Dashboard.afterMount();
      if (this._coachOpen) { this.fillBrief(); const sc = document.getElementById('coachScroll'); if (sc) sc.scrollTop = sc.scrollHeight; }
    },

    wire() {
      const app = document.getElementById('app');
      app.addEventListener('click', e => {
        if (State.route !== 'home') return;
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const a = el.dataset.action, L = NS.Log;
        // navigation
        if (a === 'nav' || a === 'go') { this._tab = el.dataset.tab; this.renderRoute(); return; }
        if (a === 'care-sub') { this._careTab = el.dataset.sub; this.renderRoute(); return; }
        if (a === 'meal-mode') { this._mealFast = el.dataset.mode === 'fast'; this.renderRoute(); return; }
        if (a === 'summary-range') { this._sumRange = el.dataset.range; this.renderRoute(); return; }
        if (a === 'save-measure') { this.saveMeasure(); return; }
        if (a === 'coach-open') { this._coachOpen = true; this.renderRoute(); const ci = document.getElementById('coachInput'); if (ci) ci.focus(); return; }
        if (a === 'coach-close') { this._coachOpen = false; this.renderRoute(); return; }
        if (a === 'coach-clear') { NS.Coach.clear(); this.renderRoute(true); return; }
        if (a === 'coach-chip') { this.coachSend(el.dataset.text); return; }
        if (a === 'coach-send') { const inp = document.getElementById('coachInput'); this.coachSend(inp ? inp.value : ''); return; }
        if (a === 'coach-act') { this._coachOpen = false; if (el.dataset.tab) this._tab = el.dataset.tab; this.renderRoute(); return; }
        if (a === 'know') { this._kcat = el.dataset.cat || 'all'; this._tab = 'knowledge'; this.renderRoute(); return; }
        if (a === 'open-mod') { this._mod = el.dataset.mod; this._tab = 'module'; this.renderRoute(); return; }
        if (a === 'mod-act') { const mm = NS.Modules.get(this._mod); if (mm && mm.onAction) mm.onAction(el.dataset.do, el, this._modApi()); return; }
        // profile actions
        if (a === 'edit') { Store.set('onboarding.sectionIndex', 0, { immediate: true }); State.go('onboarding'); return; }
        if (a === 'recalc') { Store.set('targets', Engine.computeTargets(Store.get('profile', {})), { immediate: true }); this.renderRoute(); return; }
        if (a === 'restart') { if (confirm('Start completely fresh? This erases all your data on this device.')) { Store.reset(); this._tab = 'today'; State.go('onboarding'); } return; }
        // ---- daily logging (keep scroll position) ----
        let logged = true;
        if (a === 'water-plus') L.addWater(1);
        else if (a === 'water-minus') L.addWater(-1);
        else if (a === 'log-meal') L.toggleMeal(el.dataset.slot);
        else if (a === 'log-toggle') L.toggle(el.dataset.field);
        else if (a === 'log-habit') { const h = Object.assign({}, L.get('habits', {})); h[el.dataset.h] = !h[el.dataset.h]; L.set('habits', h); }
        else if (a === 'sleep-plus' || a === 'sleep-minus') {
          const base = L.get('sleepH', null); const cur = base == null ? U.num(Store.get('profile.sleep_hours', 7)) : base;
          L.set('sleepH', U.clamp(cur + (a === 'sleep-plus' ? 0.5 : -0.5), 0, 12));
        } else if (a === 'set-mood') L.set('mood', U.num(el.dataset.v));
        else logged = false;
        if (logged) this.renderRoute(true);
      });
      app.addEventListener('change', async e => {
        if (State.route !== 'home') return;
        const el = e.target;
        if (el.dataset.action === 'add-photo' && el.files && el.files[0]) {
          try { const url = await U.compressImage(el.files[0]); NS.Progress.addPhotos(U.todayKey(), el.dataset.slot, url); this.renderRoute(true); } catch (err) {}
        }
      });
      app.addEventListener('keydown', e => {
        if (State.route === 'home' && e.key === 'Enter' && e.target && e.target.id === 'coachInput') { e.preventDefault(); this.coachSend(e.target.value); }
      });
    },

    saveMeasure() {
      const p = Store.get('profile', {});
      const g = (id) => { const el = document.getElementById(id); return el && el.value !== '' ? U.num(el.value) : null; };
      const entry = { weight: g('m_weight'), waist: g('m_waist'), neck: g('m_neck'), hip: g('m_hip'), skin: g('m_skin'), nail: g('m_nail') };
      if (!entry.weight && !entry.waist && !entry.neck && !entry.skin && !entry.nail) return;
      NS.Progress.addMeasurement(p, entry);
      this.renderRoute(true);
    },

    shellHTML() {
      const p = Store.get('profile', {});
      const t = Store.get('targets', {});
      if (t.incomplete || !t.calories) {
        return '<div class="wrap"><div class="card"><h2>Let’s finish setup</h2><p class="sub">A couple of essentials are missing.</p><button class="btn btn-primary" data-action="edit">Complete onboarding</button></div></div>';
      }
      const tab = this._tab;
      const body = ({
        today: () => NS.Dashboard.html(),
        meals: () => this.titled('Meals', 'Portion-scaled to your targets', this.mealsHTML(p, t)),
        move: () => this.titled('Move', NS.Training.program(p).headline, this.trainingHTML(p)),
        care: () => this.careHTML(p, t),
        progress: () => this.progressHTML(p, t),
        you: () => this.youHTML(p, t),
        knowledge: () => this.knowledgeHTML(),
        timeline: () => this.timelineHTML(),
        diag: () => this.diagHTML(),
        life: () => this.lifeHTML(),
        module: () => this.moduleHTML()
      }[tab] || (() => NS.Dashboard.html()))();

      const nav = '<nav class="bottomnav"><div class="bn-inner">' + NAV.map(n =>
        '<button class="bn ' + (n.id === tab ? 'on' : '') + '" data-action="nav" data-tab="' + n.id + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + n.icon + '</svg><span>' + n.label + '</span></button>').join('') + '</div></nav>';
      return body + nav + (this._coachOpen ? this.coachHTML() : this.fabHTML());
    },

    titled(title, sub, inner) {
      return '<div class="wrap"><div class="page-top"><h1>' + esc(title) + '</h1><p>' + esc(sub || '') + '</p></div>' + inner + '</div>';
    },

    /* ---------------- CARE (skin / supplements / water) ---------------- */
    careHTML(p, t) {
      const sub = this._careTab || 'skin';
      const subs = [['skin', 'Skincare'], ['supps', 'Supplements'], ['water', 'Water']];
      const inner = sub === 'supps' ? this.suppsHTML(p) : sub === 'water' ? this.waterHTML(p, t) : this.skincareHTML(p);
      return '<div class="wrap"><div class="page-top"><h1>Care</h1><p>Skin, supplements & hydration — tuned to you</p></div>'
        + '<div class="pills">' + subs.map(s => '<button class="pill ' + (s[0] === sub ? 'on' : '') + '" data-action="care-sub" data-sub="' + s[0] + '">' + s[1] + '</button>').join('') + '</div>'
        + inner + '</div>';
    },

    skincareHTML(p) {
      const r = NS.Skincare.routine(p);
      const step = (s, i, pm) => '<div class="step"><div class="num ' + (pm ? 'pm' : '') + '">' + (i + 1) + '</div><div class="c"><b>' + esc(s.step) + '</b><div class="ing">' + esc(s.ing) + '</div><p>' + esc(s.why) + '</p><span class="prod">🛍 ' + esc(s.prod) + '</span></div></div>';
      return '<div class="pills"><button class="pill sm" data-action="know" data-cat="Skin">\ud83d\udcda The evidence</button></div>' + '<div class="note tip">Built for your <b>' + esc(r.type) + '</b> skin' + (p.skin_concerns && p.skin_concerns.length ? ' · targeting ' + esc(p.skin_concerns.join(', ')) : '') + '. Introduce one active at a time.</div>'
        + '<div class="card"><h2>☀️ Morning</h2>' + r.am.map((s, i) => step(s, i, false)).join('') + '</div>'
        + '<div class="card"><h2>🌙 Evening</h2>' + r.pm.map((s, i) => step(s, i, true)).join('') + '</div>'
        + '<div class="card"><h2>The rules that matter</h2>' + r.rules.map(x => '<div class="wtip"><div class="i">✅</div><div><p style="margin:0;color:var(--txt-dim);font-size:12.5px;line-height:1.5">' + esc(x) + '</p></div></div>').join('') + '</div>'
        + '<div class="note tip">' + esc(r.inside) + '</div>';
    },

    /* ---------------- YOU (profile / body / settings) ---------------- */
    youHTML(p, t) {
      const m = t.macros;
      const medFlag = (p.takes_meds || p.toenail_fungus)
        ? '<div class="note med"><b>Medical note:</b> you flagged ' + [p.takes_meds ? 'regular medication' : null, p.toenail_fungus ? 'a toenail/nail-bed issue' : null].filter(Boolean).join(' and ') + '. Confirm anything clinical with your doctor.</div>' : '';
      const ROAD = [['🧠', 'AI Coach', 'Phase 6'], ['📚', 'Knowledge & Timeline', 'Phase 7–8']];
      return '<div class="wrap"><div class="page-top"><h1>' + esc(p.name || 'You') + '</h1><p>' + esc(Engine.headline(t)) + '</p></div>'
        + this.disciplineHTML(p, t)
        + '<div class="card know-cta" data-action="go" data-tab="timeline" style="cursor:pointer"><div style="display:flex;align-items:center;gap:13px"><span style="font-size:26px">\U0001F52E</span><div><b style="font-size:15px">Health Timeline</b><div class="sub" style="margin:2px 0 0">Where consistency takes you: 30 days \u2192 5 years</div></div><span style="margin-left:auto;color:var(--teal);font-weight:700">Open \u2192</span></div></div>'
        + '<div class="card know-cta" data-action="know" data-cat="all" style="cursor:pointer"><div style="display:flex;align-items:center;gap:13px"><span style="font-size:26px">\ud83d\udcda</span><div><b style="font-size:15px">Knowledge Center</b><div class="sub" style="margin:2px 0 0">The evidence behind every recommendation</div></div><span style="margin-left:auto;color:var(--teal);font-weight:700">Open \u2192</span></div></div>'
        + '<div class="card" data-action="nav" data-tab="life" style="cursor:pointer"><div style="display:flex;align-items:center;gap:13px"><span style="font-size:26px">\U0001F30D</span><div><b style="font-size:15px">Your Life</b><div class="sub" style="margin:2px 0 0">All your domains \u2014 everything, in one place</div></div><span style="margin-left:auto;color:var(--teal);font-weight:700">Open \u2192</span></div></div>'
        + '<div class="card" data-action="nav" data-tab="diag" style="cursor:pointer"><div style="display:flex;align-items:center;gap:13px"><span style="font-size:26px">\u2699\ufe0f</span><div><b style="font-size:15px">System &amp; Architecture</b><div class="sub" style="margin:2px 0 0">Module health \u00b7 privacy \u00b7 migration-ready</div></div><span style="margin-left:auto;color:var(--teal);font-weight:700">Open \u2192</span></div></div>'
        + '<div class="card"><h2>Daily targets</h2><div class="target-grid">'
        + '<div class="tgt kcal"><b>' + t.calories + '</b><span>kcal</span></div><div class="tgt p"><b>' + m.protein_g + 'g</b><span>protein</span></div>'
        + '<div class="tgt c"><b>' + m.carbs_g + 'g</b><span>carbs</span></div><div class="tgt f"><b>' + m.fat_g + 'g</b><span>fat</span></div></div></div>'
        + '<div class="card"><h2>Your body</h2>'
        + '<div class="stat-row"><div class="ic">🔥</div><div class="t"><b>Maintenance (TDEE)</b><small>What you burn</small></div><div class="v">' + t.tdee + '<small>kcal</small></div></div>'
        + '<div class="stat-row"><div class="ic">🎯</div><div class="t"><b>Daily deficit</b><small>' + esc(t.goal.replace('_', ' ')) + '</small></div><div class="v">' + (t.deficit ? '−' + t.deficit : '0') + '<small>kcal</small></div></div>'
        + '<div class="stat-row"><div class="ic">⚖️</div><div class="t"><b>BMI</b><small>' + esc(t.bmiBand) + ' range</small></div><div class="v">' + t.bmi + '</div></div>'
        + '<div class="stat-row"><div class="ic">😴</div><div class="t"><b>Sleep goal</b><small>Recovery & fat loss</small></div><div class="v">' + t.sleep_hours + '<small>h</small></div></div></div>'
        + medFlag
        + '<div class="card"><h2>Coming next 🔓</h2><div class="lock-grid">' + ROAD.map(r => '<div class="lock-cell locked"><span class="badge">' + r[2] + '</span><span class="em">' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div></div>'
        + '<div class="actions"><button class="btn btn-ghost" data-action="edit">Edit answers</button><button class="btn btn-ghost" data-action="recalc">Recalculate</button></div>'
        + '<div class="foot">LifeOS · Phase 3 · v2.0<br>Estimates, not medical advice. 100% private to this device.<br><button class="linklike" data-action="restart">Start fresh</button></div></div>';
    },

    /* ---------------- PROGRESS (Phase 4 analytics) ---------------- */
    progressHTML(p, t) {
      const P = NS.Progress, C = NS.Charts;
      const last = P.latest();
      const curW = last && last.weight ? last.weight : U.num(p.weight_kg);
      const curWaist = last && last.waist ? last.waist : (U.num(p.waist_cm) || null);
      const bf = last && last.bodyFat != null ? last.bodyFat : null;
      const wD = P.delta(p, 'weight'), waistD = P.delta(p, 'waist');
      const range = this._sumRange || 'week';
      const sum = P.summary(p, t, range), cur = sum.cur;
      const isF = p.sex === 'female';
      const nailS = P.fieldSeries('nail'), skinS = P.fieldSeries('skin');
      const delta = (v, unit, downGood) => v == null ? '' : '<span class="delta ' + (v === 0 ? 'flat' : ((downGood ? v < 0 : v > 0) ? 'good' : 'bad')) + '">' + (v > 0 ? '+' : '') + v + unit + '</span>';

      const snap = '<div class="card"><h2>Snapshot</h2><div class="target-grid">'
        + '<div class="tgt"><b>' + (curW || '—') + '<small>kg</small></b><span>weight ' + delta(wD, 'kg', true) + '</span></div>'
        + '<div class="tgt"><b>' + (curWaist || '—') + '<small>cm</small></b><span>waist ' + delta(waistD, 'cm', true) + '</span></div>'
        + '<div class="tgt"><b>' + (bf != null ? bf : '—') + '<small>%</small></b><span>body fat</span></div>'
        + '<div class="tgt"><b>' + t.bmi + '</b><span>BMI</span></div></div>'
        + (bf == null ? '<div class="note tip">Add <b>waist + neck</b> below to estimate body fat (US Navy method).</div>' : '') + '</div>';

      const form = '<div class="card"><h2>Log measurement</h2><p class="sub">Weekly is plenty · same time of day, relaxed posture.</p>'
        + '<div class="measure-grid">' + mInput('m_weight', 'Weight', 'kg') + mInput('m_waist', 'Waist', 'cm') + mInput('m_neck', 'Neck', 'cm')
        + (isF ? mInput('m_hip', 'Hip', 'cm') : '') + mInput('m_skin', 'Skin 1–5', '') + mInput('m_nail', 'Nail 1–5', '') + '</div>'
        + '<button class="btn btn-primary" data-action="save-measure" style="width:100%;margin-top:6px">Save measurement</button></div>';

      const wSeries = P.weightSeries(p), sSeries = P.scoreSeries(p, t, 14);
      const trend = '<div class="card"><h2>Weight trend</h2>' + C.line(wSeries, { color: 'var(--teal)' })
        + (wSeries.length >= 2 ? '<div class="chart-meta"><span>start ' + wSeries[0].v + 'kg</span><span>' + wSeries[wSeries.length - 1].v + 'kg now</span></div>' : '') + '</div>'
        + '<div class="card"><h2>Health score · 14 days</h2>' + C.line(sSeries, { color: 'var(--cyan)' }) + '</div>';

      const summ = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0">' + (range === 'week' ? 'This week' : 'This month') + '</h2>'
        + '<div class="pills" style="margin:0"><button class="pill sm ' + (range === 'week' ? 'on' : '') + '" data-action="summary-range" data-range="week">Week</button><button class="pill sm ' + (range === 'month' ? 'on' : '') + '" data-action="summary-range" data-range="month">Month</button></div></div>'
        + '<div class="target-grid" style="margin-top:14px">'
        + '<div class="tgt"><b>' + cur.avgHealth + '</b><span>avg health ' + delta(sum.delta.avgHealth, '', false) + '</span></div>'
        + '<div class="tgt"><b>' + cur.workouts + '</b><span>workouts ' + delta(sum.delta.workouts, '', false) + '</span></div>'
        + '<div class="tgt"><b>' + cur.adherence + '%</b><span>nutrition ' + delta(sum.delta.adherence, '', false) + '</span></div>'
        + '<div class="tgt"><b>' + (cur.avgSleep != null ? cur.avgSleep : '—') + '<small>h</small></b><span>avg sleep</span></div></div>'
        + '<div style="margin-top:14px">' + C.bars([
            { label: 'Workouts', value: cur.workouts, max: sum.days, disp: cur.workouts + '/' + sum.days, color: 'var(--green)' },
            { label: 'Nutrition', value: cur.adherence, max: 100, disp: cur.adherence + '%', color: 'var(--gold)' },
            { label: 'Hydration', value: cur.avgWater, max: (t.water_glasses || 10), disp: cur.avgWater + ' gl', color: 'var(--cyan)' }
          ]) + '</div>'
        + (cur.logged === 0 ? '<div class="note tip">Log your days on the Today tab — summaries fill in here automatically.</div>' : '') + '</div>';

      const recov = (nailS.length >= 2 || skinS.length >= 2) ? '<div class="card"><h2>Recovery trackers</h2>'
        + (nailS.length >= 2 ? '<div class="row-line"><div class="rl-t">🦶 Toenail recovery</div>' + C.spark(nailS, { color: 'var(--teal)' }) + '</div>' : '')
        + (skinS.length >= 2 ? '<div class="row-line"><div class="rl-t">✨ Skin condition</div>' + C.spark(skinS, { color: 'var(--violet)' }) + '</div>' : '') + '</div>' : '';

      const tl = P.photoTimeline(p);
      const photos = '<div class="card"><h2>Progress photos</h2><p class="sub">Private to this device · same lighting each time.</p>'
        + '<div class="photo-grid">' + ['front', 'side', 'back'].map(k => '<label class="photo-cell"><div class="ph"><span class="em">＋</span>' + k + '</div><input type="file" accept="image/*" data-action="add-photo" data-slot="' + k + '"></label>').join('') + '</div>'
        + (tl.length ? '<div class="timeline">' + tl.map(e => '<div class="tl-entry"><div class="tl-date">' + esc(e.date) + '</div><div class="tl-thumbs">' + ['front', 'side', 'back'].map(k => e[k] ? '<img src="' + e[k] + '" alt="' + esc(k) + '">' : '<div class="tl-blank">' + k + '</div>').join('') + '</div></div>').join('') + '</div>' : '') + '</div>';

      return '<div class="wrap"><div class="page-top"><h1>Progress</h1><p>Your trends, measured — not guessed</p></div>'
        + snap + form + trend + summ + recov + photos + '</div>';
    },

    /* ---------------- DISCIPLINE (Phase 5 gamification) ---------------- */
    disciplineHTML(p, t) {
      const G = NS.Game;
      const xp = G.totalXP(), lv = G.levelFor(xp);
      const pct = Math.round(lv.intoLevel / lv.need * 100);
      const ach = G.achievements(p), unlocked = ach.filter(a => a.unlocked).length;
      const ms = G.milestones(p, t);
      const trio = [['🔥', G.dailyStreak(), 'day streak'], ['📅', G.weeklyStreak(), 'week streak'], ['🗓️', G.monthlyStreak(), 'month streak']];
      return '<div class="card lvlcard"><div class="lvl-top"><div class="lvl-big">' + lv.level + '</div><div><b>' + esc(lv.title) + '</b><div class="lvl-xp">' + xp + ' XP total · ' + lv.intoLevel + '/' + lv.need + ' to Level ' + (lv.level + 1) + '</div></div></div><div class="xpbar"><i style="width:' + pct + '%"></i></div></div>'
        + '<div class="streak-trio">' + trio.map(x => '<div class="strk"><div class="se">' + x[0] + '</div><b>' + x[1] + '</b><span>' + x[2] + '</span></div>').join('') + '</div>'
        + '<div class="card"><h2>Weekly challenge 🎯</h2><p style="margin:0;color:var(--txt-dim);font-size:13.5px;line-height:1.5">' + esc(G.weeklyChallenge()) + '</p><p class="sub" style="margin:8px 0 0">Reward consistency, not perfection — small reps, repeated.</p></div>'
        + '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Achievements</h2><span style="color:var(--mut);font-size:12.5px">' + unlocked + '/' + ach.length + ' unlocked</span></div>'
        + '<div class="ach-grid">' + ach.map(a => '<div class="ach ' + (a.unlocked ? 'on' : '') + '"><div class="ach-em">' + a.emoji + '</div><b>' + esc(a.name) + '</b><small>' + esc(a.desc) + '</small></div>').join('') + '</div></div>'
        + '<div class="card"><h2>Milestones</h2>' + ms.map(m => '<div class="ms"><div class="ms-h"><span>' + esc(m.label) + '</span><b>' + m.cur + '/' + m.max + (m.unit || '') + '</b></div><div class="xpbar"><i style="width:' + Math.round(Math.min(1, m.cur / m.max) * 100) + '%"></i></div></div>').join('') + '</div>';
    },

    /* ---------------- MEALS (Phase 2) ---------------- */
    mealsHTML(p, t) {
      const N = NS.Nutrition, plan = N.plan(p, t);
      const fast = this._mealFast == null ? plan.today.fasting : this._mealFast;
      const day = N.buildDay(p, t, { fasting: fast, seed: new Date().getDay() });
      const timing = N.timing(p, fast);
      const meal = (mm) => '<div class="mcard"><div class="mh"><span class="em">' + mm.emoji + '</span><span class="nm">' + esc(mm.name) + '<small>' + esc(mm.label) + ' · ' + esc(mm.portion) + '</small></span><span class="kc">' + mm.kcal + ' kcal</span></div><div class="macro-line"><span class="mchip p">' + mm.p + 'g P</span><span class="mchip c">' + mm.c + 'g C</span><span class="mchip f">' + mm.f + 'g F</span></div><ul>' + li(mm.items) + '</ul><div class="why">' + esc(mm.why || '') + '</div></div>';
      return '<div class="pills"><button class="pill sm ' + (!fast ? 'on' : '') + '" data-action="meal-mode" data-mode="normal">Normal day</button><button class="pill sm ' + (fast ? 'on' : '') + '" data-action="meal-mode" data-mode="fast">🌙 Fasting day</button></div>'
        + '<div class="card"><h2>' + (fast ? 'Fasting-day plan' : 'Today’s meals') + '</h2><p class="sub">' + esc(p.diet_style || 'mixed') + ' style' + ((p.dietary_reqs || []).includes('halal') ? ' · halal' : '') + '</p>' + day.meals.map(meal).join('')
        + '<div class="totals"><div class="totbox"><b>' + day.totals.kcal + '</b><span>kcal</span><small>target ' + day.target.kcal + '</small></div><div class="totbox"><b>' + day.totals.p + 'g</b><span>protein</span><small>target ' + day.target.p + 'g</small></div><div class="totbox"><b>' + day.totals.c + 'g</b><span>carbs</span><small>target ' + day.target.c + 'g</small></div><div class="totbox"><b>' + day.totals.f + 'g</b><span>fat</span><small>target ' + day.target.f + 'g</small></div></div>'
        + (day.hitProtein ? '<div class="note tip">✅ Protein on target — keeps muscle while you lose fat.</div>' : '<div class="caution warn">Nudge portions on your protein source to close the gap.</div>') + '</div>'
        + '<div class="card"><h2>Meal timing</h2><p class="sub">' + (fast ? 'Sunnah fasting rhythm' : 'Prayer-anchored day') + '</p>' + timing.map(x => '<div class="tline"><div class="tm">' + esc(x.time) + '</div><div class="lb">' + esc(x.label) + '<small>' + esc(x.note) + '</small></div></div>').join('') + '</div>'
        + '<div class="note tip"><b>Prep once, win all week:</b> ' + esc(plan.prepTip) + '</div>';
    },

    suppsHTML(p) {
      const s = NS.Supplements.recommend(p);
      return '<div class="card"><h2>Your supplement stack</h2><p class="sub">Evidence-scored · ' + esc(s.budget) + ' budget</p>'
        + s.items.map(it => '<div class="mcard"><div class="mh"><span class="em">' + it.emoji + '</span><span class="nm">' + esc(it.name) + '<small>' + esc(it.dose) + ' · ' + esc(it.timing) + '</small></span><span class="ev ' + it.evidence + '">' + it.evidence + '</span></div><div class="why">' + esc(it.why) + '</div>' + (it.caution ? '<div class="caution">' + esc(it.caution) + '</div>' : '') + '</div>').join('')
        + (s.globalCaution ? '<div class="caution">' + esc(s.globalCaution) + '</div>' : '') + '</div>'
        + '<div class="note tip">Evidence: <b>strong</b> = well-established · <b>moderate</b> = good support · <b>emerging</b> = promising.</div>';
    },

    trainingHTML(p) {
      const tr = NS.Training.program(p);
      return '<div class="card"><h2>Your week</h2>' + tr.week.map(w => '<div class="sched"><div class="d">' + w.day + '</div><div class="f">' + esc(w.focus) + '</div><div class="badge2 ' + w.type + '">' + w.type + '</div></div>').join('') + '</div>'
        + '<div class="card"><h2>Strength progression</h2><div class="stat-row"><div class="ic">🏋️</div><div class="t"><b>' + esc(tr.strength.style) + '</b><small>' + esc(tr.strength.frequency) + ' · reps ' + esc(tr.strength.repRange) + '</small></div></div><p style="font-size:13px;color:var(--txt-dim);line-height:1.6;margin:12px 0 0">' + esc(tr.strength.progression) + '</p><div class="note tip">' + esc(tr.strength.principle) + '</div></div>'
        + '<div class="card"><h2>Cardio</h2><div class="stat-row"><div class="ic">🌀</div><div class="t"><b>Zone 2</b><small>' + esc(tr.cardio.zone2) + '</small></div></div><div class="stat-row"><div class="ic">⚡</div><div class="t"><b>HIIT</b><small>' + esc(tr.cardio.hiit) + '</small></div></div><div class="note tip">' + esc(tr.cardio.note) + '</div></div>'
        + '<div class="card"><h2>Safety & form</h2>' + tr.notes.map(n => '<div class="wtip"><div class="i">✅</div><div><p style="margin:0;color:var(--txt-dim);font-size:12.5px;line-height:1.5">' + esc(n) + '</p></div></div>').join('') + '</div>';
    },

    waterHTML(p, t) {
      const h = NS.Hydration.strategy(p, t);
      return '<div class="card"><h2>Hydration strategy 💧</h2><p class="sub">' + esc(h.headline) + '</p><div class="totals" style="grid-template-columns:1fr 1fr"><div class="totbox"><b>' + h.glasses + '</b><span>glasses / day</span></div><div class="totbox"><b>' + U.litres(h.ml) + '</b><span>total fluid</span></div></div>'
        + (h.ramp ? '<div class="note tip"><b>Ease in:</b> ' + esc(h.ramp) + '</div>' : '')
        + h.tips.map(tp => '<div class="wtip"><div class="i">' + tp.icon + '</div><div><b>' + esc(tp.title) + '</b><p>' + esc(tp.text) + '</p></div></div>').join('') + '</div>';
    },

    /* ---------------- COACH (Phase 6) ---------------- */
    fabHTML() { return '<button class="fab" data-action="coach-open" aria-label="Talk to your coach">\ud83e\udde0</button>'; },
    coachSend(text) {
      if (!text || !text.trim()) return;
      NS.Coach.pushMsg('user', text.trim());
      this.renderRoute(true);
      NS.AI.chat(text.trim(), NS.Coach.context()).then(r => {
        NS.Coach.pushMsg('coach', r.text, r.actions ? { actions: r.actions } : null);
        this.renderRoute(true);
      }).catch(() => {});
    },
    fillBrief() {
      NS.Coach.briefing().then(b => {
        const el = document.getElementById('coachBrief');
        if (el) el.innerHTML = '<div class="brief-k">' + (b.kind === 'evening' ? 'EVENING REVIEW' : 'MORNING BRIEFING') + '</div>' + esc(b.text) + (b.quote ? '<div class="brief-q">\u201c' + esc(b.quote.q) + '\u201d \u2014 ' + esc(b.quote.by) + '</div>' : '');
      }).catch(() => {});
    },
    coachHTML() {
      const thread = NS.Coach.thread();
      const chips = ['I ate pizza', 'I\u2019m tired', 'I missed my workout', 'My skin feels oily', 'I feel stressed', 'I\u2019m losing motivation'];
      const msgs = thread.length ? thread.map(cbubble).join('') : '<div class="coach-hello">Salaam \u2014 I\u2019m your coach. Tell me anything: how you feel, what you ate, a slip-up. No judgement, just the next step. \ud83e\udd32</div>';
      return '<div class="coach-screen">'
        + '<div class="coach-bar"><button class="coach-x" data-action="coach-close">\u2715</button><b>Your Coach</b><button class="coach-clr" data-action="coach-clear">Clear</button></div>'
        + '<div class="coach-scroll" id="coachScroll"><div class="coach-brief" id="coachBrief">\u2026</div><div class="coach-thread">' + msgs + '</div></div>'
        + '<div class="coach-chips">' + chips.map(c => '<button class="cchip" data-action="coach-chip" data-text="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>'
        + '<div class="coach-input"><input id="coachInput" placeholder="Tell your coach\u2026" autocomplete="off"><button class="coach-go" data-action="coach-send" aria-label="Send">\u27a4</button></div>'
        + '</div>';
    },

    /* ---------------- KNOWLEDGE CENTER (Phase 7) ---------------- */
    knowledgeHTML() {
      const K = NS.Knowledge; const cat = this._kcat || 'all';
      const cats = ['all'].concat(K.categories());
      const list = K.ENTRIES.filter(e => cat === 'all' || e.cat === cat);
      const strong = list.filter(e => e.evidence === 'strong');
      const other = list.filter(e => e.evidence !== 'strong');
      const card = (e) => '<details class="kcard"><summary><span class="kc-em">' + e.emoji + '</span><span class="kc-t">' + esc(e.title) + '</span><span class="ev ' + e.evidence + '">' + e.evidence + '</span></summary><div class="kc-body"><div class="kc-row"><b>Why it works</b><p>' + esc(e.why) + '</p></div><div class="kc-row"><b>Guideline support</b><p>' + esc(e.guideline) + '</p></div><div class="kc-row"><b>Practical takeaway</b><p>' + esc(e.takeaway) + '</p></div></div></details>';
      const group = (title, arr) => arr.length ? '<div class="k-group"><h2>' + title + '</h2>' + arr.map(card).join('') + '</div>' : '';
      return '<div class="wrap"><div class="page-top" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h1>Knowledge</h1><p>Every recommendation, with its evidence</p></div><button class="mini-cta" data-action="nav" data-tab="you">Done</button></div>'
        + '<div class="pills">' + cats.map(c => '<button class="pill sm ' + (c === cat ? 'on' : '') + '" data-action="know" data-cat="' + c + '">' + (c === 'all' ? 'All' : esc(c)) + '</button>').join('') + '</div>'
        + '<div class="note tip">Evidence: <b>strong</b> = well-established / guideline-backed \u00b7 <b>moderate</b> = good support \u00b7 <b>emerging</b> = promising but early. Educational only, not medical advice.</div>'
        + group('Strong &amp; established', strong) + group('Moderate &amp; emerging', other) + '</div>';
    },

    /* ---------------- HEALTH TIMELINE (Phase 8) ---------------- */
    timelineHTML() {
      const tl = NS.Timeline.project(Store.get('profile', {}), Store.get('targets', {}));
      const adh = tl.adherence;
      const wbadge = (h) => h.weight != null ? '<span class="tl-weight">' + h.weight + 'kg' + (h.weightDelta ? ' <small>' + (h.weightDelta > 0 ? '+' : '') + h.weightDelta + '</small>' : '') + '</span>' : '';
      const node = (h) => '<div class="tl-node"><div class="tl-dot"></div><div class="tl-card"><div class="tl-h"><b>' + esc(h.label) + '</b>' + wbadge(h) + '</div>'
        + h.items.map(it => '<div class="tl-item"><span class="tl-em">' + it.emoji + '</span><div><b>' + esc(it.domain) + '</b><p>' + esc(it.text) + '</p></div></div>').join('') + '</div></div>';
      const adhLine = adh.lowData
        ? 'Not enough logged days yet — this shows what\u2019s possible <b>if you stay consistent</b>. Log daily and it recalibrates to your real pace.'
        : 'Based on your consistency: <b>' + adh.pct + '%</b> of the last 30 days logged (' + adh.active + '/30). Push that up and the timeline accelerates.';
      return '<div class="wrap"><div class="page-top" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h1>Health Timeline</h1><p>Where consistency takes you</p></div><button class="mini-cta" data-action="nav" data-tab="you">Done</button></div>'
        + '<div class="note tip">' + adhLine + '</div>'
        + '<div class="timeline-track">' + tl.horizons.map(node).join('') + '</div>'
        + '<div class="note med">' + esc(tl.note) + '</div></div>';
    },

    /* ---------------- SYSTEM / DIAGNOSTICS (Phase 9) ---------------- */
    diagHTML() {
      const C = NS.Core, r = C.check(), st = C.storage();
      const byLayer = {}; r.modules.forEach(m => { (byLayer[m.layer] = byLayer[m.layer] || []).push(m); });
      const row = (m) => '<div class="diag-row"><span class="dot ' + (m.ok ? 'on' : 'off') + '"></span><b>LifeOS.' + m.name + '</b>' + (m.ok ? '<span class="diag-ok">ok</span>' : '<span class="diag-bad">' + esc(m.missing.join(', ')) + '</span>') + '</div>';
      const groups = C.layers().filter(l => byLayer[l]).map(l => '<div class="card"><h2>' + esc(l) + '</h2>' + byLayer[l].map(row).join('') + '</div>').join('');
      return '<div class="wrap"><div class="page-top" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h1>System</h1><p>Architecture &amp; module health</p></div><button class="mini-cta" data-action="nav" data-tab="you">Done</button></div>'
        + '<div class="card"><div class="diag-hero"><div class="diag-big ' + (r.ok ? 'ok' : 'bad') + '">' + r.passed + '/' + r.total + '</div><div><b style="font-size:16px">Modules healthy</b><div class="sub" style="margin:2px 0 0">LifeOS v' + r.version + ' \u00b7 ' + (r.ok ? 'all systems go' : 'issues found') + '</div></div></div></div>'
        + (st ? '<div class="card"><h2>Storage</h2><div class="stat-row"><div class="ic">\ud83d\udddc\ufe0f</div><div class="t"><b>Schema version</b><small>versioned + migration-safe</small></div><div class="v">v' + st.schema + '</div></div><div class="stat-row"><div class="ic">\ud83d\udce6</div><div class="t"><b>Local data</b><small>on this device only</small></div><div class="v">' + (st.bytes / 1024).toFixed(1) + '<small>KB</small></div></div><div class="stat-row"><div class="ic">\ud83d\udcc5</div><div class="t"><b>Days logged</b></div><div class="v">' + st.days + '</div></div><div class="stat-row"><div class="ic">\ud83d\udccf</div><div class="t"><b>Measurements</b></div><div class="v">' + st.measurements + '</div></div></div>' : '')
        + groups
        + '<div class="note tip">Every module is a self-contained IIFE on <b>window.LifeOS</b> exposing one public API. Swapping storage (\u2192 FastAPI) or the view layer (\u2192 React Native) touches only that layer. Full map in <b>ARCHITECTURE.md</b>.</div></div>';
    },

    /* ---------------- LIFE HUB + MODULE HOST (Phase 10) ---------------- */
    _modApi() { return { store: NS.Modules.store(this._mod), refresh: () => this.renderRoute(true), U: U }; },
    lifeHTML() {
      const mods = NS.Modules.all();
      const card = (m) => '<div class="life-card" data-action="' + (m ? 'open-mod' : 'go') + '" ' + (m ? 'data-mod="' + m.id + '"' : 'data-tab="today"') + ' style="cursor:pointer;--mc:' + (m ? m.color : 'var(--teal)') + '"><div class="life-ic">' + (m ? m.icon : '\u2764\ufe0f') + '</div><b>' + (m ? esc(m.label) : 'Health') + '</b><small>' + (m ? esc(m.summary) : 'Your full health OS') + '</small>' + (m && m.status === 'soon' ? '<span class="life-badge">soon</span>' : '<span class="life-badge live">active</span>') + '</div>';
      return '<div class="wrap"><div class="page-top"><h1>Your Life</h1><p>One operating system for every domain</p></div>'
        + '<div class="life-grid">' + card(null) + mods.map(card).join('') + '</div>'
        + '<div class="note tip">This is the LifeOS platform: each domain is a self-contained module. New ones plug in with <b>zero changes</b> to your health data \u2014 see ARCHITECTURE.md.</div></div>';
    },
    moduleHTML() {
      const m = NS.Modules.get(this._mod);
      if (!m) { this._tab = 'life'; return this.lifeHTML(); }
      return '<div class="wrap"><div class="page-top" style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h1>' + m.icon + ' ' + esc(m.label) + '</h1><p>' + esc(m.summary) + '</p></div><button class="mini-cta" data-action="nav" data-tab="life">Done</button></div>'
        + m.render(this._modApi()) + '</div>';
    }
  };

  NS.App = App;
  if (typeof document !== 'undefined' && document.getElementById('app') && !window.__LIFEOS_TEST__) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.boot());
    else App.boot();
  }
})(window.LifeOS = window.LifeOS || {});
