/* ============================================================
   training.js  →  LifeOS.Training
   Exercise progression engine. From goal, activity, injuries and
   available equipment it derives a weekly structure, a strength
   progression rule, and cardio zones. Pure & DOM-free.
   ============================================================ */
(function (NS) {
  'use strict';

  function has(arr, v) { return (arr || []).includes(v); }

  function program(profile) {
    const p = profile || {};
    const goal = p.goal || 'lose_fat';
    const equip = p.equipment && p.equipment.length ? p.equipment : ['bodyweight'];
    const exp = p.experience || 'beginner';
    const days = parseInt(p.training_days, 10) || (p.activity === 'sedentary' ? 3 : 4);
    const inj = String(p.injuries || '').toLowerCase();

    const hasElliptical = has(equip, 'elliptical');
    const hasWeights = has(equip, 'dumbbells') || has(equip, 'gym') || has(equip, 'bands');
    const cardioTool = hasElliptical ? 'elliptical' : 'brisk walk / incline';

    /* ---- cardio prescription by goal ---- */
    const cardio = goal === 'gain_muscle'
      ? { zone2: '2×/week · 25–30 min', hiit: 'optional 1×/week', tool: cardioTool,
          note: 'Keep cardio light so it doesn’t eat recovery.' }
      : { zone2: `3–4×/week · 35–45 min on the ${cardioTool}`, hiit: '1×/week · Norwegian 4×4 (4 min hard : 3 min easy ×4)', tool: cardioTool,
          note: 'Zone 2 builds the fat-burning base; one weekly HIIT lifts VO₂max (Attia).' };

    /* ---- strength progression ---- */
    const repRange = goal === 'gain_muscle' ? '6–10' : goal === 'lose_fat' || goal === 'recomp' ? '8–15' : '10–15';
    const strength = {
      style: hasWeights ? 'Full-body with weights' : 'Full-body bodyweight',
      frequency: days >= 4 ? '2–3×/week' : '2×/week',
      repRange,
      progression: exp === 'advanced'
        ? 'Double progression: add reps to the top of the range, then add load and drop back down.'
        : 'Add 1–2 reps each session; once you hit the top of the range for all sets, add load or slow the tempo (Schoenfeld).',
      principle: 'Progressive overload beats novelty — the same lifts, a little more each week, is what changes your body.'
    };

    /* ---- weekly schedule ---- */
    const strengthDays = days >= 5 ? ['Tue', 'Thu', 'Sat'] : days >= 4 ? ['Tue', 'Fri'] : ['Tue', 'Fri'];
    const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => {
      if (strengthDays.includes(d)) return { day: d, type: 'strength', focus: strength.style };
      if (d === 'Sun') return { day: d, type: 'rest', focus: 'Rest / walk / meal prep' };
      if (d === 'Mon' || d === 'Thu') return { day: d, type: 'cardio', focus: `Zone 2 on ${cardioTool}` + ((p.fasting_pref === 'sunnah' || p.fasting_pref === 'both') ? ' (fasting day)' : '') };
      if (d === 'Wed') return { day: d, type: 'hiit', focus: goal === 'gain_muscle' ? 'Optional light cardio' : `HIIT on ${cardioTool}` };
      return { day: d, type: 'cardio', focus: `Zone 2 + core` };
    });

    /* ---- injury modifications ---- */
    const notes = [];
    if (/knee/.test(inj)) notes.push('Knee-friendly: box/chair squats to a higher target, avoid deep lunges, keep the elliptical (low-impact).');
    if (/back|lumbar|spine/.test(inj)) notes.push('Back-friendly: hip-hinge with care, brace your core, swap heavy bent-over rows for supported/chest-supported versions.');
    if (/shoulder/.test(inj)) notes.push('Shoulder-friendly: neutral-grip pressing, avoid deep dips, stop any move that pinches.');
    notes.push('Warm up 5 minutes; leave 1–2 reps “in the tank”; never train through sharp pain.');

    return { goal, equipment: equip, daysPerWeek: days, cardio, strength, week, notes,
      headline: `${strength.style} ${strength.frequency} + ${cardio.zone2}` };
  }

  NS.Training = { program };
})(window.LifeOS = window.LifeOS || {});
