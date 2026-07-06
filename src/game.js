/* ============================================================
   game.js  ->  LifeOS.Game
   The Habit & Discipline Engine. XP, levels, streaks, achievements
   and milestones — all derived deterministically from logged
   history (so totals are always consistent, never double-counted).
   Rewards consistency over perfection. Pure; reads Store + Progress.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils, Store = NS.Store;

  const XP = { water: 2, meal: 5, workout: 20, skinAM: 5, skinPM: 5, supps: 5, prayer: 3, sleep: 5, challenge: 10, measure: 15 };
  const TITLES = ['Novice', 'Starter', 'Disciplined', 'Consistent', 'Committed', 'Determined', 'Relentless', 'Unbreakable', 'Elite', 'Legend'];

  function isActive(d) {
    return !!d && ((d.water > 0) || d.workout || d.skinAM || d.skinPM || d.supps ||
      Object.values(d.meals || {}).some(Boolean) || Object.values(d.habits || {}).some(Boolean));
  }
  function dayXP(d) {
    if (!d) return 0;
    let x = 0;
    x += Math.min(d.water || 0, 12) * XP.water;
    x += Object.values(d.meals || {}).filter(Boolean).length * XP.meal;
    if (d.workout) x += XP.workout;
    if (d.skinAM) x += XP.skinAM;
    if (d.skinPM) x += XP.skinPM;
    if (d.supps) x += XP.supps;
    x += Object.values(d.habits || {}).filter(Boolean).length * XP.prayer;
    if (d.sleepH != null) x += XP.sleep;
    if (d.challenge) x += XP.challenge;
    return x;
  }
  function totalXP() {
    const days = Store.get('days', {});
    let x = 0;
    for (const k in days) x += dayXP(days[k]);
    x += (Store.get('progress.measurements', []).length) * XP.measure;
    return x;
  }
  function levelFor(xp) {
    let lvl = 1, need = 100, acc = 0;
    while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.35); }
    return { level: lvl, title: TITLES[Math.min(lvl - 1, TITLES.length - 1)],
      intoLevel: xp - acc, need, floor: acc, next: acc + need, xp };
  }

  const dayAt = (o) => Store.get('days.' + U.isoDaysAgo(o));
  function dailyStreak() { let c = 0; for (let i = 0; i < 400; i++) { if (isActive(dayAt(i))) c++; else if (i > 0) break; } return c; }
  function weekActive(w) { let n = 0; for (let i = w * 7; i < (w + 1) * 7; i++) if (isActive(dayAt(i))) n++; return n; }
  function weeklyStreak(thresh = 4) { let c = 0; for (let w = 0; w < 100; w++) { if (weekActive(w) >= thresh) c++; else if (w > 0) break; } return c; }
  function monthActive(m) { let n = 0; for (let i = m * 30; i < (m + 1) * 30; i++) if (isActive(dayAt(i))) n++; return n; }
  function monthlyStreak(thresh = 16) { let c = 0; for (let m = 0; m < 36; m++) { if (monthActive(m) >= thresh) c++; else if (m > 0) break; } return c; }

  function stats(profile) {
    const days = Store.get('days', {});
    const goal = Store.get('targets.water_glasses', 10);
    let logged = 0, workouts = 0, hitWaterGoal = false, fullMeals = false, allPrayers = false;
    for (const k in days) {
      const d = days[k]; if (!isActive(d)) continue;
      logged++;
      if (d.workout) workouts++;
      if ((d.water || 0) >= goal) hitWaterGoal = true;
      if (Object.values(d.meals || {}).filter(Boolean).length >= 4) fullMeals = true;
      if (Object.values(d.habits || {}).filter(Boolean).length >= 5) allPrayers = true;
    }
    const xp = totalXP();
    return { logged, workouts, hitWaterGoal, fullMeals, allPrayers,
      dailyStreak: dailyStreak(), xp, level: levelFor(xp).level,
      measurements: Store.get('progress.measurements', []).length,
      weightDown: (NS.Progress ? (NS.Progress.delta(profile, 'weight') || 0) : 0) };
  }

  const ACH = [
    { id: 'first', emoji: '🌱', name: 'First Step', desc: 'Log your first day', check: s => s.logged >= 1 },
    { id: 'hydrated', emoji: '💧', name: 'Hydrated', desc: 'Hit your water goal', check: s => s.hitWaterGoal },
    { id: 'protein', emoji: '🍗', name: 'Protein Pro', desc: 'Log all meals in a day', check: s => s.fullMeals },
    { id: 'prayer', emoji: '🕌', name: 'Prayer Warrior', desc: 'All 5 prayers in a day', check: s => s.allPrayers },
    { id: 'week', emoji: '🔥', name: 'Iron Will', desc: '7-day streak', check: s => s.dailyStreak >= 7 },
    { id: 'fortnight', emoji: '⚡', name: 'Fortnight', desc: '14-day streak', check: s => s.dailyStreak >= 14 },
    { id: 'month', emoji: '🏆', name: 'Month Strong', desc: '30-day streak', check: s => s.dailyStreak >= 30 },
    { id: 'gym', emoji: '💪', name: 'Mover', desc: '10 workouts logged', check: s => s.workouts >= 10 },
    { id: 'measured', emoji: '📏', name: 'Measured', desc: 'Log a measurement', check: s => s.measurements >= 1 },
    { id: 'kilo', emoji: '📉', name: 'Down a Kilo', desc: 'Lose 1kg from baseline', check: s => s.weightDown <= -1 },
    { id: 'lvl5', emoji: '⭐', name: 'Level 5', desc: 'Reach level 5', check: s => s.level >= 5 },
    { id: 'fifty', emoji: '👑', name: 'Half Century', desc: '50 days logged', check: s => s.logged >= 50 }
  ];
  function achievements(profile) { const s = stats(profile); return ACH.map(a => ({ id: a.id, emoji: a.emoji, name: a.name, desc: a.desc, unlocked: !!a.check(s) })); }

  function milestones(profile, targets) {
    const s = stats(profile);
    const out = [
      { label: '30-day streak', cur: Math.min(s.dailyStreak, 30), max: 30 },
      { label: 'Reach level 5', cur: Math.min(s.level, 5), max: 5 },
      { label: '50 days logged', cur: Math.min(s.logged, 50), max: 50 }
    ];
    const tw = U.num(profile.target_weight_kg), sw = U.num(profile.weight_kg);
    if (tw && sw && NS.Progress) {
      const last = NS.Progress.latest();
      const cw = last && last.weight ? last.weight : sw;
      const total = Math.abs(sw - tw) || 1;
      const done = U.clamp(Math.abs(sw - cw), 0, total);
      out.push({ label: 'Reach target weight', cur: Math.round(done * 10) / 10, max: Math.round(total * 10) / 10, unit: 'kg' });
    }
    return out;
  }

  const WEEKLY = ['Train 4 times this week', 'Hit your water goal 5 days', 'No refined sugar for 5 days', 'Sleep 7h+ every night', 'Log every single day', 'Protein target every day'];
  function weeklyChallenge() { return WEEKLY[Math.floor(Date.now() / 6048e5) % WEEKLY.length]; }

  NS.Game = { XP, dayXP, totalXP, levelFor, isActive, dailyStreak, weeklyStreak, monthlyStreak, stats, achievements, milestones, weeklyChallenge };
})(window.LifeOS = window.LifeOS || {});
