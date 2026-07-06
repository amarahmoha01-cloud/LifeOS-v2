/* modules/faith.js — a Life module: prayers, Qur'an, dhikr. Self-registers. */
(function (NS) {
  'use strict';
  const M = NS.Modules, U = NS.Utils, esc = U.esc;
  const PRAYERS = [['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];
  const DUAS = [
    { a: 'رَبِّ زِدْنِي عِلْمًا', t: 'My Lord, increase me in knowledge.', s: 'Qur’an 20:114' },
    { a: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', t: 'Allah is sufficient for us, and He is the best disposer of affairs.', s: 'Qur’an 3:173' },
    { a: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً', t: 'Our Lord, give us good in this world and the next.', s: 'Qur’an 2:201' },
    { a: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ', t: 'O Allah, help me to remember You, thank You, and worship You well.', s: 'Abu Dawud' }
  ];
  function quranStreak(days) {
    let c = 0; for (let i = 0; i < 400; i++) { if (days[U.isoDaysAgo(i)]) c++; else if (i > 0) break; } return c;
  }

  M.register({
    id: 'faith', label: 'Faith', icon: '🕌', color: 'var(--violet)', status: 'live', summary: 'Prayers · Qur’an · dhikr',
    render(api) {
      const today = U.todayKey();
      const pr = api.store.get('p_' + today, {}) || {};
      const done = PRAYERS.filter(p => pr[p[0]]).length;
      const q = api.store.get('quran', { pages: 0, days: {} });
      const streak = quranStreak(q.days || {});
      const dhikr = api.store.get('d_' + today, 0) || 0;
      const dua = DUAS[new Date().getDate() % DUAS.length];
      return '<div class="card"><h2>Today’s prayers</h2><p class="sub">' + done + ' of 5 prayed</p>'
        + '<div class="prayer-row">' + PRAYERS.map(p => '<button class="pray ' + (pr[p[0]] ? 'on' : '') + '" data-action="mod-act" data-do="pray" data-p="' + p[0] + '">' + p[1] + '</button>').join('') + '</div></div>'
        + '<div class="card"><h2>Qur’an</h2>'
        + '<div class="target-grid" style="grid-template-columns:1fr 1fr"><div class="tgt"><b>' + (q.pages || 0) + '</b><span>pages read</span></div><div class="tgt"><b>' + streak + '</b><span>day streak 🔥</span></div></div>'
        + '<button class="btn btn-primary" data-action="mod-act" data-do="quran" style="width:100%;margin-top:12px">＋ Log a page read today</button></div>'
        + '<div class="card"><h2>Dhikr</h2><div class="water-read" style="text-align:center;margin-bottom:12px"><b style="font-size:34px">' + dhikr + '</b><span> today</span></div>'
        + '<button class="btn btn-ghost" data-action="mod-act" data-do="dhikr" style="width:100%">Tasbih +33 (SubhanAllah)</button></div>'
        + '<div class="quote" style="margin-top:4px"><div class="arabic">' + esc(dua.a) + '</div><q style="margin:0 10px">' + esc(dua.t) + '</q><span class="src">' + esc(dua.s) + '</span></div>';
    },
    onAction(act, el, api) {
      const today = U.todayKey();
      if (act === 'pray') { const p = Object.assign({}, api.store.get('p_' + today, {})); p[el.dataset.p] = !p[el.dataset.p]; api.store.set('p_' + today, p); }
      else if (act === 'quran') { const q = api.store.get('quran', { pages: 0, days: {} }); q.pages = (q.pages || 0) + 1; q.days = q.days || {}; q.days[today] = (q.days[today] || 0) + 1; api.store.set('quran', q); }
      else if (act === 'dhikr') { api.store.set('d_' + today, (api.store.get('d_' + today, 0) || 0) + 33); }
      api.refresh();
    }
  });
})(window.LifeOS = window.LifeOS || {});
