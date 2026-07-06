/* ============================================================
   hydration.js  →  LifeOS.Hydration
   Personalized water strategy — built especially for people who
   struggle to drink plain water (nausea with volume, forgetting,
   taste). Pure & DOM-free.
   ============================================================ */
(function (NS) {
  'use strict';

  function strategy(profile, targets) {
    const p = profile || {};
    const t = targets || {};
    const glasses = t.water_glasses || 10;
    const ml = t.water_ml || 2500;
    const notes = String(p.hydration_notes || '').toLowerCase();
    const struggles = !!p.hydration_problem;
    const typical = p.typical_water || 'some';

    const tips = [];
    if (struggles && /nause|sick|vomit|too much|large|bloat/.test(notes) || struggles) {
      tips.push({ icon: '🥄', title: 'Sip, never chug', text: 'Small mouthfuls every 15–20 minutes. Big volumes distend the stomach and trigger nausea — sipping avoids it entirely.' });
    }
    if (struggles && /taste|boring|plain|hate|don.t like/.test(notes) || struggles) {
      tips.push({ icon: '🧂', title: 'Electrolytes + flavour', text: 'A pinch of salt + squeeze of lemon, or an electrolyte sachet. Improves absorption and makes it far easier to drink. Coconut water counts.' });
    }
    if (/forget|busy|remember/.test(notes)) {
      tips.push({ icon: '⏰', title: 'Anchor to cues', text: 'Drink at each prayer and before every meal. Keep a bottle in sight — out of sight, out of mind.' });
    }
    tips.push({ icon: '🥒', title: 'Eat your water', text: 'Cucumber, watermelon, tomato, yogurt, soups and broths, herbal tea and milk. Food supplies 20–30% of your fluid — it all counts.' });
    tips.push({ icon: '🌡️', title: 'Room temperature', text: 'Cold water hits a sensitive stomach harder. Room-temp or warm goes down more easily.' });

    let ramp = null;
    if (typical === 'low') {
      ramp = 'Start at 4–5 glasses/day this week, then add one glass each week until you reach your target. Don’t jump straight to the full amount.';
    }

    return {
      glasses, ml, struggles, ramp,
      headline: struggles
        ? 'Your target, reached gently — no forcing big glasses.'
        : 'Steady hydration across the day.',
      tips
    };
  }

  NS.Hydration = { strategy };
})(window.LifeOS = window.LifeOS || {});
