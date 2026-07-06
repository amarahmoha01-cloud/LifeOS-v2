/* ============================================================
   log.js  ->  LifeOS.Log
   Per-day logging on top of Store.days[date]. Everything the
   dashboard records (water, meals, workout, skincare, supps,
   sleep, mood, energy, habits) lives here, plus a streak.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils, Store = NS.Store;

  function blank() {
    return { water: 0, meals: {}, workout: false, skinAM: false, skinPM: false,
      supps: false, sleepH: null, mood: null, energy: null, stress: null, challenge: false, habits: {} };
  }
  function key(offset = 0) { return offset ? U.isoDaysAgo(offset) : U.todayKey(); }

  const Log = {
    day(offset = 0) {
      const k = key(offset);
      const d = Store.get('days.' + k);
      return d ? Object.assign(blank(), d) : blank();
    },
    get(field, def) { const v = Store.get('days.' + key() + '.' + field); return v === undefined ? def : v; },
    set(field, val) { Store.set('days.' + key() + '.' + field, val, { immediate: true }); return val; },

    addWater(delta) { const n = Math.max(0, (this.get('water', 0) || 0) + delta); return this.set('water', n); },
    setWater(n) { return this.set('water', Math.max(0, n)); },
    toggleMeal(slot) { const m = Object.assign({}, this.get('meals', {})); m[slot] = !m[slot]; return this.set('meals', m); },
    toggle(field) { return this.set(field, !this.get(field, false)); },

    mealsDone() { const m = this.get('meals', {}); return Object.values(m).filter(Boolean).length; },

    /* any meaningful activity logged that day */
    active(offset) {
      const d = this.day(offset);
      return (d.water > 0) || d.workout || d.skinAM || d.skinPM || d.supps ||
        Object.values(d.meals || {}).some(Boolean);
    },
    streak() {
      let c = 0;
      for (let i = 0; i < 400; i++) {
        if (this.active(i)) c++;
        else if (i > 0) break;       // today may be empty-in-progress
        else if (i === 0) continue;
      }
      return c;
    }
  };
  NS.Log = Log;
})(window.LifeOS = window.LifeOS || {});
