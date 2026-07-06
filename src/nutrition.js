/* ============================================================
   nutrition.js  →  LifeOS.Nutrition
   Pure meal-plan generator. Reads Meals.TEMPLATES + a profile +
   engine targets and returns a portion-scaled day / week plan
   that respects cuisine, halal & dietary needs, allergies,
   dislikes and the fasting structure. Also derives meal timing.
   No DOM, no storage — fully testable and portable.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils;
  const TEMPLATES = () => NS.Meals.TEMPLATES;

  const CUISINE_MAP = { mauritian: ['mauritian', 'indian'], indian: ['indian', 'mauritian'],
    mediterranean: ['mediterranean'], simple: ['simple'], mix: null };

  const DIST_NORMAL = [['breakfast', 0.25], ['lunch', 0.32], ['snack', 0.13], ['dinner', 0.30]];
  const DIST_FAST = [['suhoor', 0.30], ['iftar', 0.45], ['post', 0.25]];
  const POOL_OF = { suhoor: 'breakfast', iftar: 'dinner', post: 'snack' };
  const LABEL_OF = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner',
    suhoor: 'Suhoor (pre-dawn)', iftar: 'Iftar (break fast)', post: 'Post-Iftar' };

  /* ---- dietary/allergy filter ---- */
  function makeKeep(profile) {
    const reqs = profile.dietary_reqs || [];
    const alg = profile.allergies || [];
    const veg = reqs.includes('vegetarian');
    const pesc = reqs.includes('pescatarian');
    const dairyFree = reqs.includes('dairy_free') || alg.includes('lactose');
    const avoid = String(profile.foods_avoid || '').toLowerCase()
      .split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 2);

    return function keep(t) {
      const g = t.tags;
      if (veg && (g.meat || g.fish)) return false;
      if (pesc && g.meat) return false;
      if (dairyFree && g.dairy) return false;
      if (alg.includes('gluten') && g.gluten) return false;
      if (alg.includes('nuts') && g.nuts) return false;
      if (alg.includes('shellfish') && g.shellfish) return false;
      if (alg.includes('eggs') && g.egg) return false;
      if (alg.includes('soy') && g.soy) return false;
      if (avoid.length) {
        const hay = (t.name + ' ' + t.items.join(' ')).toLowerCase();
        if (avoid.some(w => hay.includes(w))) return false;
      }
      return true;
    };
  }

  function cuisineMatch(profile, t) {
    const cu = profile.diet_style;
    if (!cu || cu === 'mix') return true;
    const want = CUISINE_MAP[cu];
    if (!want) return true;
    return t.cuisines.some(c => want.includes(c));
  }

  /* pick a template for a slot, with graceful fallback that never
     violates allergies/diet (only relaxes cuisine, then relaxes nothing else) */
  function pick(slot, profile, seed) {
    const keep = makeKeep(profile);
    const pool = TEMPLATES().filter(t => t.slot === (POOL_OF[slot] || slot));
    const safe = pool.filter(keep);
    if (!safe.length) return pool[seed % pool.length] || null; // extreme case: nothing safe
    const lowCarbPref = (profile.dietary_reqs || []).includes('low_carb') && (slot === 'dinner' || slot === 'iftar');
    let list = safe.filter(t => cuisineMatch(profile, t));
    if (!list.length) list = safe;
    if (lowCarbPref) { const lc = list.filter(t => t.tags.lowcarb); if (lc.length) list = lc; }
    // bias toward protein-dense options so daily protein lands on target
    list = list.slice().sort((a, b) => (b.p / b.kcal) - (a.p / a.kcal));
    list = list.slice(0, Math.min(list.length, Math.max(2, Math.ceil(list.length / 2))));
    return list[seed % list.length];
  }

  function scale(t, slotKcal) {
    const factor = U.clamp(slotKcal / t.kcal, 0.6, 1.7);
    return {
      id: t.id, name: t.name, emoji: t.emoji, items: t.items.slice(), why: t.why,
      kcal: U.round(t.kcal * factor, 5),
      p: Math.round(t.p * factor), c: Math.round(t.c * factor), f: Math.round(t.f * factor),
      portion: factor > 1.15 ? 'larger portion' : factor < 0.85 ? 'smaller portion' : 'standard portion'
    };
  }

  function buildDay(profile, targets, opts = {}) {
    const fasting = !!opts.fasting;
    const seed = opts.seed || 0;
    const dist = fasting ? DIST_FAST : DIST_NORMAL;
    const cals = targets.calories || 2000;
    const meals = dist.map(([slot, frac], i) => {
      const t = pick(slot, profile, seed + i);
      const m = t ? scale(t, cals * frac) : { name: '—', kcal: 0, p: 0, c: 0, f: 0, items: [], emoji: '🍽️' };
      m.slot = slot; m.label = LABEL_OF[slot];
      return m;
    });
    const totals = meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }),
      { kcal: 0, p: 0, c: 0, f: 0 });
    const tg = targets.macros || { protein_g: 0, carbs_g: 0, fat_g: 0 };
    return { fasting, meals, totals,
      target: { kcal: cals, p: tg.protein_g, c: tg.carbs_g, f: tg.fat_g },
      hitProtein: Math.abs(totals.p - tg.protein_g) <= 20 };
  }

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function weekPlan(profile, targets) {
    const pref = profile.fasting_pref || 'sunnah';
    const fastDays = (pref === 'sunnah' || pref === 'both') ? ['Mon', 'Thu'] : [];
    return DAYS.map((d, i) => Object.assign({ day: d },
      buildDay(profile, targets, { fasting: fastDays.includes(d), seed: i })));
  }

  /* ---- meal timing, prayer- and fasting-aware ---- */
  function timing(profile, fasting) {
    const pref = profile.fasting_pref || 'sunnah';
    if (fasting) {
      return [
        { time: 'Pre-Fajr', label: 'Suhoor', note: 'Slow carbs + protein + water. Don’t skip.' },
        { time: 'Midday', label: 'Fast continues', note: 'Stay busy; light activity only.' },
        { time: 'Maghrib', label: 'Iftar', note: 'Break with dates + water, then your meal.' },
        { time: 'After Isha', label: 'Post-Iftar', note: 'Protein-focused; herbal tea; hydrate.' }
      ];
    }
    if (pref === '168') {
      return [
        { time: '~12:00', label: 'First meal', note: 'Open your 8-hour window.' },
        { time: '~15:30', label: 'Snack', note: 'Pre-workout if training.' },
        { time: '~19:30', label: 'Last meal', note: 'Close the window by 20:00.' }
      ];
    }
    return [
      { time: 'After Fajr / waking', label: 'Breakfast', note: 'Sunlight first; delay caffeine ~90 min.' },
      { time: 'Dhuhr / midday', label: 'Lunch', note: 'Highest-protein meal; 10-min walk after.' },
      { time: 'Asr / afternoon', label: 'Snack', note: 'Pre-workout fuel.' },
      { time: 'Maghrib / evening', label: 'Dinner', note: 'Finish ≥3h before bed.' }
    ];
  }

  const Nutrition = {
    buildDay, weekPlan, timing,
    /* convenience bundle used by the UI */
    plan(profile, targets) {
      const today = NS.Utils.isFastingDay() &&
        ['sunnah', 'both'].includes(profile.fasting_pref || 'sunnah');
      return {
        today: buildDay(profile, targets, { fasting: today, seed: new Date().getDay() }),
        week: weekPlan(profile, targets),
        timing: timing(profile, today),
        prepTip: 'Batch on Sunday & Wednesday: grill protein, boil eggs, cook dal + rice, wash & chop veg. Assembly beats willpower.'
      };
    }
  };

  NS.Nutrition = Nutrition;
})(window.LifeOS = window.LifeOS || {});
