/* ============================================================
   supplements.js  →  LifeOS.Supplements
   Rule-based, evidence-scored personalization. Given a profile it
   returns a ranked stack: each item has dose, timing, an evidence
   level (strong | moderate | emerging), a rationale tied to THE
   USER'S data, and cautions (allergies, medications). Budget-aware.
   Pure & DOM-free. NOT medical advice — flags clinical checks.
   ============================================================ */
(function (NS) {
  'use strict';

  const EV = { strong: 3, moderate: 2, emerging: 1 };

  function recommend(profile) {
    const p = profile || {};
    const alg = p.allergies || [];
    const reqs = p.dietary_reqs || [];
    const conds = p.conditions || [];
    const skin = p.skin_concerns || [];
    const digest = p.digestion || [];
    const goal = p.goal || 'lose_fat';
    const budget = p.budget || 'moderate';
    const meds = String(p.medications || '').toLowerCase();
    const onBloodThinner = /warfarin|apixaban|rivaroxaban|clopidogrel|heparin|blood thinner|anticoag/.test(meds);
    const veg = reqs.includes('vegetarian') || reqs.includes('pescatarian');
    const stack = [];
    const add = (o) => stack.push(o);

    /* ---------- Foundation ---------- */
    // Vitamin D
    const vitD = parseFloat(p.vitamin_d);
    if (Number.isFinite(vitD) && vitD < 30) {
      add({ name: 'Vitamin D3 + K2', emoji: '☀️', dose: '4000 IU D3 + 100µg K2', timing: 'Morning, with fat',
        evidence: 'strong', why: `Your blood level (${vitD} ng/mL) is below the 40–60 target — correcting it supports immunity, mood, bone and testosterone.`,
        caution: 'Retest in ~3 months.' });
    } else {
      add({ name: 'Vitamin D3 + K2', emoji: '☀️', dose: '2000–4000 IU D3 + 100µg K2', timing: 'Morning, with fat',
        evidence: Number.isFinite(vitD) ? 'moderate' : 'moderate',
        why: Number.isFinite(vitD) ? `Your level (${vitD}) is adequate — a maintenance dose keeps it there.` : 'Most people are low, especially with limited sun. Foundational for immunity, mood and hormones (Attia).',
        caution: 'Ideally test your level to dial in the dose.' });
    }

    // Omega-3 (allergy + med aware)
    if (alg.includes('shellfish') || /fish allerg/.test(meds) || alg.includes('fish')) {
      add({ name: 'Omega-3 (algae)', emoji: '🌊', dose: '~1g EPA/DHA (algal)', timing: 'With a meal',
        evidence: 'strong', why: 'You flagged a fish/shellfish allergy, so an algae-based omega-3 gives the same heart, brain and skin-barrier benefits safely.',
        caution: onBloodThinner ? 'You noted a blood thinner — clear omega-3 with your doctor first.' : null });
    } else {
      add({ name: 'Omega-3 (EPA/DHA)', emoji: '🐟', dose: '~2g combined EPA+DHA', timing: 'With a meal',
        evidence: 'strong', why: 'Heart, brain, joints and skin-barrier / anti-inflammation — prioritised by both Attia and Patrick.',
        caution: onBloodThinner ? 'You noted a blood thinner — clear high-dose omega-3 with your doctor.' : 'Skip if you eat oily fish 3–4×/week.' });
    }

    // Creatine (if training-oriented)
    if (['lose_fat', 'recomp', 'gain_muscle'].includes(goal) && (p.activity && p.activity !== 'sedentary')) {
      add({ name: 'Creatine monohydrate', emoji: '💪', dose: '5g daily', timing: 'Any time, every day',
        evidence: 'strong', why: 'The most-researched supplement there is — protects muscle in a deficit and sharpens cognition. Take it even on rest days.',
        caution: null });
    }

    // Magnesium (sleep/stress/constipation)
    const poorSleep = parseFloat(p.sleep_quality) <= 2 || parseFloat(p.sleep_hours) < 6.5;
    const stressed = parseFloat(p.stress) >= 4;
    if (poorSleep || stressed || digest.includes('constipation')) {
      add({ name: 'Magnesium glycinate', emoji: '🌙', dose: '200–400mg', timing: 'Evening',
        evidence: 'moderate', why: `Chosen because you flagged ${[poorSleep ? 'less-than-ideal sleep' : null, stressed ? 'higher stress' : null, digest.includes('constipation') ? 'constipation' : null].filter(Boolean).join(' / ')}. Aids sleep, recovery and regularity.`,
        caution: null });
    }

    /* ---------- Targeted ---------- */
    // Zinc for skin/nail
    if (p.toenail_fungus || skin.includes('acne') || skin.includes('oiliness')) {
      add({ name: 'Zinc (+ copper)', emoji: '🛡️', dose: '15–25mg zinc', timing: 'With food',
        evidence: 'moderate', why: `Supports skin repair and nail integrity — relevant to your ${[p.toenail_fungus ? 'nail issue' : null, (skin.includes('acne') || skin.includes('oiliness')) ? 'oily/acne-prone skin' : null].filter(Boolean).join(' and ')}.`,
        caution: 'Don’t megadose long-term; pair with a little copper.' });
    }

    // Protein powder (convenience / veg)
    if (budget !== 'lean' || veg) {
      const lactose = alg.includes('lactose') || reqs.includes('dairy_free');
      add({ name: lactose ? 'Protein (plant or isolate)' : 'Whey / protein powder', emoji: '🥤',
        dose: '1–2 scoops as needed', timing: 'Post-workout or to fill a gap',
        evidence: 'moderate', why: `A simple tool to reach your protein target${veg ? ' on a plant-forward diet' : ''} without extra cooking.`,
        caution: lactose ? 'You flagged dairy/lactose — use a plant blend or whey isolate.' : null });
    }

    // Gut support
    if (digest.some(d => ['bloating', 'ibs', 'sensitive'].includes(d))) {
      add({ name: 'Probiotic + soluble fibre', emoji: '🦠', dose: 'Daily probiotic; 5g psyllium', timing: 'Fibre with water',
        evidence: 'emerging', why: 'You flagged digestive issues — a probiotic plus gentle fibre can calm bloating and improve regularity.',
        caution: 'Introduce fibre slowly with plenty of fluid.' });
    }

    // Skin actives (oral, secondary to topical)
    if (budget === 'invest' && (skin.includes('aging') || skin.includes('dark_spots') || skin.includes('dullness'))) {
      add({ name: 'Vitamin C (+ collagen)', emoji: '✨', dose: 'C 500mg; collagen 10g', timing: 'Morning',
        evidence: 'emerging', why: 'Supports collagen synthesis for the skin concerns you listed — a bonus alongside your topical routine (which does most of the work).',
        caution: 'Topical vitamin C + SPF matter more than oral.' });
    }

    // B12 for vegetarians/vegans
    if (veg) {
      add({ name: 'Vitamin B12', emoji: '🧬', dose: '250–500µg', timing: 'Morning',
        evidence: 'strong', why: 'Plant-forward diets run low on B12 — important for energy and nerves.',
        caution: null });
    }

    // Iron ONLY if ferritin low — and flag doctor
    const fer = parseFloat(p.ferritin);
    if (Number.isFinite(fer) && fer < 30) {
      add({ name: 'Iron — see your doctor', emoji: '🩸', dose: 'Only if advised', timing: 'Per doctor',
        evidence: 'moderate', why: `Your ferritin (${fer}) looks low, which can cause fatigue and hair thinning.`,
        caution: 'Do NOT self-prescribe iron — get it confirmed and dosed by a clinician.' });
    }

    /* ---------- Budget gating ---------- */
    let list = stack;
    if (budget === 'lean') {
      const core = ['Vitamin D3 + K2', 'Omega-3 (EPA/DHA)', 'Omega-3 (algae)', 'Creatine monohydrate', 'Magnesium glycinate'];
      list = stack.filter(s => core.includes(s.name) || /doctor/.test(s.name));
    }

    // sort by evidence strength, keep clinical flags visible
    list.sort((a, b) => (EV[b.evidence] || 0) - (EV[a.evidence] || 0));

    const globalCaution = p.takes_meds
      ? 'You take regular medication — run this whole list past your pharmacist or doctor for interactions before starting.'
      : null;

    return { items: list, budget, globalCaution };
  }

  NS.Supplements = { recommend, EV };
})(window.LifeOS = window.LifeOS || {});
