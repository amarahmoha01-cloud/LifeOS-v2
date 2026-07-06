/* ============================================================
   coach.js  ->  LifeOS.Coach
   Orchestrates the AI Coach: assembles context from every engine,
   keeps the persisted conversation thread, and exposes send() and a
   time-aware briefing. UI-agnostic (app.js renders it).
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils, Store = NS.Store;

  function context() {
    const profile = Store.get('profile', {}), targets = Store.get('targets', {});
    const log = NS.Log ? NS.Log.day(0) : {};
    const dow = new Date().getDay(); const idx = dow === 0 ? 6 : dow - 1;
    const isRest = NS.Training ? (NS.Training.program(profile).week[idx] || {}).type === 'rest' : false;
    const scores = NS.Scoring ? NS.Scoring.all(profile, targets, log, isRest) : null;
    const fasting = U.isFastingDay() && ['sunnah', 'both'].includes(profile.fasting_pref || 'sunnah');
    const level = NS.Game ? NS.Game.levelFor(NS.Game.totalXP()) : { level: 1 };
    const streak = NS.Game ? NS.Game.dailyStreak() : 0;
    let mission = null;
    try { mission = NS.Dashboard ? NS.Dashboard.ctx().mission : null; } catch (e) {}
    return { profile, targets, log, scores, fasting, level, streak, mission };
  }

  function thread() { return Store.get('coach.threads', []); }
  function pushMsg(role, text, extra) {
    const t = thread().slice();
    t.push(Object.assign({ role, text, ts: Date.now() }, extra || {}));
    if (t.length > 100) t.splice(0, t.length - 100);
    Store.set('coach.threads', t, { immediate: true });
    return t;
  }
  async function send(text) {
    if (!text || !text.trim()) return null;
    pushMsg('user', text.trim());
    const r = await NS.AI.chat(text.trim(), context());
    pushMsg('coach', r.text, r.actions ? { actions: r.actions } : null);
    return r;
  }
  async function briefing() {
    const c = context(); const h = new Date().getHours();
    const evening = h >= 17 || h < 4;
    const r = evening ? await NS.AI.eveningReview(c) : await NS.AI.morningBrief(c);
    return { text: r.text, quote: r.quote || null, kind: evening ? 'evening' : 'morning' };
  }
  function clear() { Store.set('coach.threads', [], { immediate: true }); }

  NS.Coach = { context, thread, pushMsg, send, briefing, clear };
})(window.LifeOS = window.LifeOS || {});
