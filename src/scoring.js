/* ============================================================
   scoring.js  ->  LifeOS.Scoring
   Turns today's log + profile into Apple-Health-style scores.
   Pure. Each score 0-100 with a label + colour band.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils;
  const clamp = (n) => U.clamp(Math.round(n), 0, 100);

  function band(v) {
    return v >= 90 ? { label: 'Elite', color: 'var(--teal)' }
      : v >= 70 ? { label: 'Strong', color: 'var(--green)' }
      : v >= 45 ? { label: 'Building', color: 'var(--gold)' }
      : { label: 'Low', color: 'var(--rose)' };
  }
  function mk(v) { const b = band(v); return { value: clamp(v), label: b.label, color: b.color }; }

  const Scoring = {
    hydration(log, targets) {
      const goal = (targets && targets.water_glasses) || 10;
      return mk(((log.water || 0) / goal) * 100);
    },
    nutrition(log) {
      const done = Object.values(log.meals || {}).filter(Boolean).length;
      return mk((done / 4) * 100);
    },
    movement(log, isRestDay) {
      if (isRestDay) return mk(log.workout ? 100 : 80); // rest still counts toward recovery
      return mk(log.workout ? 100 : 0);
    },
    recovery(log, profile) {
      const sleepH = log.sleepH != null ? log.sleepH : U.num(profile.sleep_hours, 7);
      const mood = log.mood != null ? log.mood : 3;
      const stress = log.stress != null ? log.stress : U.num(profile.stress, 3);
      const sleepScore = U.clamp((sleepH / 8) * 100, 0, 100);
      const moodScore = (mood / 5) * 100;
      const stressScore = ((6 - stress) / 5) * 100;
      return mk(sleepScore * 0.5 + moodScore * 0.25 + stressScore * 0.25);
    },
    /* overall health = weighted blend */
    health(parts) {
      return mk(parts.nutrition.value * 0.3 + parts.hydration.value * 0.25 +
        parts.movement.value * 0.25 + parts.recovery.value * 0.2);
    },
    all(profile, targets, log, isRestDay) {
      const hydration = this.hydration(log, targets);
      const nutrition = this.nutrition(log);
      const movement = this.movement(log, isRestDay);
      const recovery = this.recovery(log, profile);
      const health = this.health({ hydration, nutrition, movement, recovery });
      return { health, recovery, hydration, nutrition, movement };
    }
  };
  NS.Scoring = Scoring;
})(window.LifeOS = window.LifeOS || {});
