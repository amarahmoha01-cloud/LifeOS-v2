/* ============================================================
   engine.js  →  LifeOS.Engine
   Business logic: turns a raw profile into personalized targets.
   PURE and DOM-free → unit-testable and portable (RN / FastAPI).

   Evidence base:
     • BMR: Mifflin–St Jeor (most accurate predictive equation)
     • Protein: 1.6–2.2 g/kg for recomposition/fat loss (Norton, Schoenfeld, ISSN)
     • Deficit: capped, floored — never crash-diet a healthy BMI
     • Hydration: ~30–35 ml/kg baseline, adjusted for activity
   All numbers are ESTIMATES and recalculated whenever the profile changes.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils;

  const ACTIVITY = {
    sedentary: { f: 1.20, label: 'Sedentary' },
    light:     { f: 1.375, label: 'Lightly active' },
    moderate:  { f: 1.55, label: 'Moderately active' },
    active:    { f: 1.725, label: 'Very active' },
    athlete:   { f: 1.90, label: 'Athlete' }
  };

  const Engine = {
    ACTIVITY,

    /* ---- Mifflin–St Jeor BMR ---- */
    bmr({ kg, cm, age, sex }) {
      const s = sex === 'female' ? -161 : sex === 'male' ? 5 : -78; // 'other' → midpoint
      return 10 * kg + 6.25 * cm - 5 * age + s;
    },

    tdee(p) {
      const mult = (ACTIVITY[p.activity] || ACTIVITY.light).f;
      return this.bmr(p) * mult;
    },

    bmi({ kg, cm }) {
      const m = cm / 100;
      return kg / (m * m);
    },
    bmiBand(bmi) {
      return bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy' : bmi < 30 ? 'overweight' : 'obese';
    },

    /* ---- Master calculation ---- */
    computeTargets(profile) {
      const kg = U.num(profile.weight_kg);
      const cm = U.num(profile.height_cm);
      const age = U.num(profile.age);
      const sex = profile.sex || 'male';
      if (!kg || !cm || !age) return { incomplete: true };

      const p = { kg, cm, age, sex, activity: profile.activity || 'light' };
      const bmr = Math.round(this.bmr(p));
      const tdee = Math.round(this.tdee(p));
      const bmi = this.bmi(p);
      const band = this.bmiBand(bmi);
      const goal = profile.goal || 'lose_fat';

      // --- Calorie target by goal, with safety guards ---
      let target, deficit = 0, rationale;
      if (goal === 'maintain') {
        target = tdee; rationale = 'Maintenance — hold steady while habits build.';
      } else if (goal === 'gain_muscle') {
        target = Math.round(tdee * 1.10); rationale = 'Lean gain — small surplus to build muscle.';
      } else if (goal === 'recomp') {
        target = Math.round(tdee * 0.92); rationale = 'Body recomposition — slight deficit + high protein.';
      } else { // lose_fat
        // 20% deficit, capped at 600 kcal, floored so we never go below a safe intake
        const raw = Math.min(tdee * 0.20, 600);
        const floor = Math.max(Math.round(bmr * 1.10), sex === 'female' ? 1200 : 1400);
        target = Math.max(Math.round(tdee - raw), floor);
        deficit = tdee - target;
        rationale = band === 'healthy'
          ? 'Gentle deficit — you are a healthy weight, so we recomp: lose fat, keep muscle.'
          : 'Sustainable deficit — steady fat loss without crashing.';
      }

      // --- Macros ---
      const proteinPerKg = (goal === 'lose_fat' || goal === 'recomp' || goal === 'gain_muscle') ? 2.0 : 1.8;
      const protein_g = Math.round(kg * proteinPerKg);
      const fat_g = Math.round(kg * 0.9);
      const proteinKcal = protein_g * 4;
      const fatKcal = fat_g * 9;
      const carbs_g = Math.max(50, Math.round((target - proteinKcal - fatKcal) / 4));

      // --- Hydration (with the user's water-aversion in mind) ---
      const activeBump = ['active', 'athlete', 'moderate'].includes(p.activity) ? 500 : 250;
      let water_ml = U.round(35 * kg + activeBump, 100);
      water_ml = U.clamp(water_ml, 1800, 4000);

      // --- Sleep & steps ---
      const sleep_hours = 8;
      const steps = goal === 'lose_fat' ? 9000 : 8000;

      // --- Fasting alignment (Sunnah Mon/Thu) ---
      const fasting = profile.fasting_pref || 'sunnah';

      return {
        incomplete: false,
        computedAt: new Date().toISOString(),
        bmr, tdee, bmi: Math.round(bmi * 10) / 10, bmiBand: band,
        activityLabel: (ACTIVITY[p.activity] || ACTIVITY.light).label,
        goal, rationale, deficit,
        calories: target,
        macros: { protein_g, carbs_g, fat_g,
          split: {
            protein: Math.round(proteinKcal / target * 100),
            carbs: Math.round(carbs_g * 4 / target * 100),
            fat: Math.round(fatKcal / target * 100)
          }
        },
        water_ml, water_glasses: Math.round(water_ml / 250),
        sleep_hours, steps, fasting,
        proteinPerKg
      };
    },

    /* Human-readable summary line for the coach/home. */
    headline(t) {
      if (!t || t.incomplete) return 'Complete onboarding to generate your plan.';
      return `${t.calories} kcal · ${t.macros.protein_g}g protein · ${t.water_glasses} glasses water`;
    }
  };

  NS.Engine = Engine;
})(window.LifeOS = window.LifeOS || {});
