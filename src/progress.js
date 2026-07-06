/* ============================================================
   progress.js  ->  LifeOS.Progress
   Analytics layer: measurements (weight/waist/neck + body-fat),
   score/weight series for charts, weekly & monthly summaries with
   deltas, and the progress-photo timeline. Reads Store + Scoring.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils, Store = NS.Store;
  const log10 = (x) => Math.log(x) / Math.LN10;

  /* US Navy body-fat estimate (metric) */
  function navyBodyFat(profile, m) {
    const h = U.num(profile.height_cm), sex = profile.sex || 'male';
    const waist = U.num(m.waist), neck = U.num(m.neck), hip = U.num(m.hip);
    if (!h || !waist || !neck) return null;
    let bf;
    if (sex === 'female') {
      if (!hip) return null;
      bf = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(h)) - 450;
    } else {
      if (waist - neck <= 0) return null;
      bf = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(h)) - 450;
    }
    if (!isFinite(bf) || bf <= 0) return null;
    return Math.round(U.clamp(bf, 3, 60) * 10) / 10;
  }

  function measurements() {
    return Store.get('progress.measurements', []).slice().sort((a, b) => a.date < b.date ? -1 : 1);
  }
  function addMeasurement(profile, entry) {
    const m = Object.assign({}, entry);
    m.date = U.todayKey();
    m.bodyFat = navyBodyFat(profile, m);
    const arr = Store.get('progress.measurements', []).filter(x => x.date !== m.date);
    arr.push(m);
    Store.set('progress.measurements', arr, { immediate: true });
    return m;
  }
  function latest() { const a = measurements(); return a[a.length - 1] || null; }
  function baseline(profile) {
    return { date: 'start', weight: U.num(profile.weight_kg), waist: U.num(profile.waist_cm) || null };
  }
  function delta(profile, field) {
    const a = measurements(); if (!a.length) return null;
    const startVal = field === 'weight' ? U.num(profile.weight_kg) : (field === 'waist' ? U.num(profile.waist_cm) : null);
    const lastVal = U.num(a[a.length - 1][field]);
    if (!lastVal) return null;
    const base = startVal || U.num(a[0][field]);
    if (!base) return null;
    return Math.round((lastVal - base) * 10) / 10;
  }

  /* series for charts */
  function weightSeries(profile) {
    const s = measurements().map(m => ({ date: m.date, v: U.num(m.weight) })).filter(p => p.v);
    const base = U.num(profile.weight_kg);
    if (base && (!s.length || s[0].v !== base)) s.unshift({ date: 'start', v: base });
    return s;
  }
  function fieldSeries(field) {
    return measurements().map(m => ({ date: m.date, v: m[field] != null ? U.num(m[field]) : null })).filter(p => p.v != null);
  }

  function trainTypeOn(profile, dateKey) {
    const g = new Date(dateKey).getDay(); const idx = g === 0 ? 6 : g - 1;
    const prog = NS.Training.program(profile);
    return (prog.week[idx] || {}).type;
  }
  function dayHealth(profile, targets, dateKey) {
    const d = Store.get('days.' + dateKey); if (!d) return null;
    const isRest = trainTypeOn(profile, dateKey) === 'rest';
    return NS.Scoring.all(profile, targets, Object.assign({ meals: {}, water: 0 }, d), isRest).health.value;
  }
  function scoreSeries(profile, targets, nDays) {
    const out = [];
    for (let i = nDays - 1; i >= 0; i--) { const k = U.isoDaysAgo(i); out.push({ date: k, v: dayHealth(profile, targets, k) }); }
    return out;
  }

  /* aggregate a window of `days` starting `offset*days` days ago */
  function aggregate(profile, targets, days, offset) {
    let logged = 0, workouts = 0, health = 0, hyd = 0, nutr = 0, sleepSum = 0, sleepN = 0;
    for (let i = offset * days; i < (offset + 1) * days; i++) {
      const k = U.isoDaysAgo(i); const d = Store.get('days.' + k);
      if (!d) continue;
      logged++;
      if (d.workout) workouts++;
      const isRest = trainTypeOn(profile, k) === 'rest';
      const sc = NS.Scoring.all(profile, targets, Object.assign({ meals: {}, water: 0 }, d), isRest);
      health += sc.health.value; hyd += (d.water || 0);
      nutr += (Object.values(d.meals || {}).filter(Boolean).length / 4) * 100;
      if (d.sleepH != null) { sleepSum += d.sleepH; sleepN++; }
    }
    const avg = (x) => logged ? Math.round(x / logged) : 0;
    return { logged, workouts, avgHealth: avg(health), avgWater: logged ? Math.round(hyd / logged * 10) / 10 : 0,
      adherence: avg(nutr), avgSleep: sleepN ? Math.round(sleepSum / sleepN * 10) / 10 : null };
  }
  function summary(profile, targets, range) {
    const days = range === 'month' ? 30 : 7;
    const cur = aggregate(profile, targets, days, 0);
    const prev = aggregate(profile, targets, days, 1);
    const d = (a, b) => a - b;
    return { range, days, cur, prev,
      delta: { avgHealth: d(cur.avgHealth, prev.avgHealth), workouts: d(cur.workouts, prev.workouts),
        adherence: d(cur.adherence, prev.adherence), avgWater: Math.round((cur.avgWater - prev.avgWater) * 10) / 10 } };
  }

  /* photo timeline: baseline (onboarding) + dated sets */
  function addPhotos(dateKey, slot, dataUrl) {
    const arr = Store.get('progress.photos', []).slice();
    let entry = arr.find(e => e.date === dateKey);
    if (!entry) { entry = { date: dateKey }; arr.push(entry); }
    entry[slot] = dataUrl;
    Store.set('progress.photos', arr, { immediate: true });
  }
  function photoTimeline(profile) {
    const out = [];
    const base = profile.photos || {};
    if (base.front || base.side || base.back) out.push(Object.assign({ date: 'Baseline', baseline: true }, base));
    Store.get('progress.photos', []).slice().sort((a, b) => a.date < b.date ? 1 : -1).forEach(e => out.push(e));
    return out;
  }

  NS.Progress = { navyBodyFat, measurements, addMeasurement, latest, baseline, delta,
    weightSeries, fieldSeries, scoreSeries, summary, aggregate, addPhotos, photoTimeline };
})(window.LifeOS = window.LifeOS || {});
