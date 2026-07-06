/* ============================================================
   timeline.js  ->  LifeOS.Timeline
   Adherence-based projections at 30d / 90d / 6mo / 1yr / 5yr.
   Weight is projected from the calorie deficit (≈7700 kcal/kg),
   scaled by how consistently the user actually logs, and floored
   at their target. Milestones across body, strength, skin, energy,
   nails and discipline. ESTIMATES only — clearly flagged. Pure.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils, Store = NS.Store;
  const KCAL_PER_KG = 7700;

  const HORIZONS = [
    { id: '30d', label: '30 days', weeks: 4.3 },
    { id: '90d', label: '90 days', weeks: 13 },
    { id: '6mo', label: '6 months', weeks: 26 },
    { id: '1yr', label: '1 year', weeks: 52 },
    { id: '5yr', label: '5 years', weeks: 260 }
  ];

  function adherence() {
    let active = 0;
    for (let i = 0; i < 30; i++) {
      const d = Store.get('days.' + U.isoDaysAgo(i));
      if (NS.Game ? NS.Game.isActive(d) : (d && (d.water > 0 || d.workout))) active++;
    }
    const ratio = active / 30;
    return { active, ratio, lowData: active < 5, pct: Math.round(ratio * 100) };
  }

  /* milestones per horizon (body item is injected separately, from the weight math) */
  const MS = {
    '30d': {
      Strength: 'Neural gains — lifts feel easier; the first strength jump (beginner effect).',
      Skin: 'Smoother, more hydrated skin as SPF and your routine settle in.',
      Energy: 'Steadier energy and better mornings from sleep + protein.',
      Discipline: 'The habit loop is forming — showing up feels less like a decision.'
    },
    '90d': {
      Strength: 'Visible tone and noticeably stronger lifts; muscle is holding through the deficit.',
      Skin: 'Fewer breakouts, brighter tone as the retinoid does its work.',
      Energy: 'Stable all-day energy; fewer afternoon crashes.',
      Discipline: 'Habits running mostly on autopilot; the streak is a source of pride.'
    },
    '6mo': {
      Strength: 'Clear muscle definition; meaningful strength gains on every lift.',
      Skin: 'Smaller-looking pores, more even tone, a real glow-up.',
      Energy: 'Consistently good sleep and mood; stress handled better.',
      Discipline: 'This is your normal now — health is part of your identity.'
    },
    '1yr': {
      Strength: 'A visibly stronger, more muscular physique; a different body composition.',
      Skin: 'Protected, resilient, younger-looking skin — the SPF compounding pays off.',
      Energy: 'High baseline energy and vitality; robust health markers.',
      Discipline: 'A year of consistency — you are, unmistakably, a disciplined person.'
    },
    '5yr': {
      Strength: 'Muscle preserved for the long game — the organ of longevity, protected.',
      Skin: 'Years of daily SPF = markedly less photoageing than your peers.',
      Energy: 'Sustained metabolic health; lower lifetime disease risk.',
      Discipline: 'Discipline isn’t something you do — it’s who you are. A legacy of showing up.'
    }
  };
  const NAIL = {
    '30d': 'Treatment underway; keep feet dry. Nails grow slowly — patience.',
    '90d': 'Clear, healthy nail visible at the base — fungus-free growth begins.',
    '6mo': 'Roughly half the nail grown out clear.',
    '1yr': 'Nail likely fully grown out and clear if treatment held (relapse is possible).',
    '5yr': 'Healthy nail maintained with good foot hygiene.'
  };

  function project(profile, targets) {
    profile = profile || {}; targets = targets || {};
    const adh = adherence();
    // rate factor: real adherence when we have data, aspirational when we don't
    const factor = adh.lowData ? 0.85 : U.clamp(0.45 + adh.ratio * 0.65, 0.4, 1.1);
    const goal = profile.goal || 'lose_fat';
    const sw = U.num(profile.weight_kg);
    const curW = (NS.Progress && NS.Progress.latest() && NS.Progress.latest().weight) || sw;
    const tw = U.num(profile.target_weight_kg) || (goal === 'lose_fat' ? Math.round(sw * 0.9) : sw);
    const deficit = targets.deficit || 0;
    const losing = (goal === 'lose_fat' || goal === 'recomp') && deficit > 0 && curW > tw;
    const weeklyLoss = losing ? (deficit * 7 / KCAL_PER_KG) : 0;
    const fungus = !!profile.toenail_fungus;

    const horizons = HORIZONS.map(h => {
      let weight = null, wd = null, bodyText;
      if (losing) {
        const loss = weeklyLoss * h.weeks * factor;
        weight = Math.max(tw, Math.round((curW - loss) * 10) / 10);
        wd = Math.round((weight - curW) * 10) / 10;
        bodyText = (weight <= tw + 0.3)
          ? 'At ~your target — now maintain and recomp: keep losing fat where it lingers, build muscle.'
          : 'On track: ~' + Math.abs(wd) + 'kg down, waist visibly smaller (belly fat goes last but it goes).';
      } else if (goal === 'gain_muscle') {
        weight = Math.round((curW + 0.1 * h.weeks * factor) * 10) / 10;
        wd = Math.round((weight - curW) * 10) / 10;
        bodyText = 'Lean mass up ~' + wd + 'kg — fuller, stronger, denser.';
      } else {
        bodyText = 'Leaner, healthier and more energetic while holding a stable weight.';
      }
      const m = MS[h.id];
      const items = [{ domain: 'Body', emoji: '🔥', text: bodyText },
        { domain: 'Strength', emoji: '💪', text: m.Strength },
        { domain: 'Skin', emoji: '✨', text: m.Skin },
        { domain: 'Energy', emoji: '⚡', text: m.Energy },
        { domain: 'Discipline', emoji: '🧠', text: m.Discipline }];
      if (fungus) items.push({ domain: 'Nail', emoji: '🦶', text: NAIL[h.id] });
      return { id: h.id, label: h.label, weeks: h.weeks, weight, weightDelta: wd, items };
    });

    return {
      adherence: adh, factor, curW, targetW: tw, goal, losing, horizons,
      note: 'These are estimates — they assume you keep showing up. Real pace depends on consistency, sleep, stress and genetics. Log your days to sharpen them.'
    };
  }

  NS.Timeline = { project, HORIZONS };
})(window.LifeOS = window.LifeOS || {});
