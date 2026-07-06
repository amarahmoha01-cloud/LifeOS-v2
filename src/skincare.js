/* ============================================================
   skincare.js  ->  LifeOS.Skincare
   Personalized AM/PM routine from skin_type + concerns + budget +
   age. Evidence-based (retinoid, SPF, niacinamide, BHA, vit C).
   Pure & DOM-free. Not medical advice.
   ============================================================ */
(function (NS) {
  'use strict';

  function has(arr, v) { return (arr || []).includes(v); }
  function prod(budget, drug, mid) { return budget === 'invest' && mid ? mid : drug; }

  function routine(profile) {
    const p = profile || {};
    const type = p.skin_type || 'combo';
    const c = p.skin_concerns || [];
    const budget = p.budget || 'moderate';
    const age = parseInt(p.age, 10) || 30;
    const oily = type === 'oily' || type === 'combo';
    const dry = type === 'dry' || type === 'combo';

    const moisturizer = oily && !dry
      ? 'Lightweight gel moisturiser (niacinamide)'
      : dry ? 'Ceramide cream (more on cheeks, less on T-zone)'
        : 'Light moisturiser';

    const am = [];
    am.push({ step: 'Cleanse', ing: oily ? 'Low-pH gel cleanser' : 'Gentle hydrating cleanser',
      prod: prod(budget, 'CeraVe / La Roche-Posay', 'La Roche-Posay Effaclar'),
      why: 'Removes overnight oil without stripping — over-cleansing makes oily skin oilier.' });
    if (has(c, 'dark_spots') || has(c, 'dullness') || has(c, 'aging')) {
      am.push({ step: 'Vitamin C serum', ing: '10–15% L-ascorbic acid',
        prod: prod(budget, 'La Roche-Posay Pure Vitamin C10', 'SkinCeuticals CE Ferulic'),
        why: 'Antioxidant — brightens, fades the dark spots/dullness you flagged, protects vs pollution.' });
    } else {
      am.push({ step: 'Niacinamide serum (optional)', ing: '5–10% niacinamide',
        prod: prod(budget, 'The Ordinary Niacinamide', 'Paula’s Choice 10% Niacinamide'),
        why: 'Regulates oil and evens tone — ideal for your skin type.' });
    }
    am.push({ step: 'Moisturise', ing: moisturizer,
      prod: prod(budget, 'CeraVe gel/cream', 'La Roche-Posay Effaclar Mat'), why: 'Hydrates without heaviness.' });
    am.push({ step: 'Sunscreen SPF 50 ⭐', ing: 'Broad-spectrum, matte finish',
      prod: prod(budget, 'La Roche-Posay Anthelios / Beauty of Joseon', 'La Roche-Posay UVMune 400'),
      why: 'THE non-negotiable step — ~80% of visible ageing is sun. Every morning.' });

    const pm = [];
    pm.push({ step: 'Cleanse', ing: 'Double cleanse if you wore SPF',
      prod: prod(budget, 'Any gentle cleanser', 'Balm + gel duo'), why: 'Clear the day so actives absorb.' });
    const wantRetinoid = age >= 28 || has(c, 'aging') || has(c, 'pores') || has(c, 'acne') || has(c, 'oiliness');
    if (wantRetinoid) {
      pm.push({ step: 'Retinoid (start 2×/week)', ing: has(c, 'acne') ? 'Adapalene 0.1%' : 'Retinal 0.05%',
        prod: prod(budget, 'Differin / The INKEY List', 'La Roche-Posay Retinol B3'),
        why: 'The single most-proven ingredient for pores, oil, texture and ageing. Go slow; buffer with moisturiser.' });
    }
    if (has(c, 'redness')) {
      pm.push({ step: 'Azelaic acid (alt nights)', ing: '10% azelaic acid',
        prod: prod(budget, 'The Ordinary Azelaic 10%', 'Paula’s Choice Azelaic Booster'),
        why: 'Calms the redness you flagged and evens tone.' });
    }
    pm.push({ step: 'Moisturise', ing: 'Ceramide cream',
      prod: prod(budget, 'CeraVe Moisturising Cream', 'La Roche-Posay Toleriane'),
      why: 'Repairs the barrier and offsets any retinoid dryness.' });
    if (oily || has(c, 'acne') || has(c, 'pores')) {
      pm.push({ step: '2×/week: BHA (never same night as retinoid)', ing: '2% salicylic acid',
        prod: prod(budget, 'CeraVe SA / The Ordinary', 'Paula’s Choice 2% BHA'),
        why: 'Unclogs oily pores and smooths texture.' });
    }

    const rules = [
      'Introduce ONE new active at a time; give skin 2–3 weeks.',
      'Never stack acids + retinoid the same night.',
      'SPF every morning is 80% of the results — don’t skip it.'
    ];
    const inside = 'Skin is also built inside-out: omega-3 (barrier), vitamin C (collagen), zinc (repair), 7–9h sleep, and low refined sugar (less glycation). Your nutrition & supplement plans already cover these.';
    return { type, am, pm, rules, inside };
  }
  NS.Skincare = { routine };
})(window.LifeOS = window.LifeOS || {});
