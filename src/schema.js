/* ============================================================
   schema.js  →  LifeOS.Schema
   The onboarding interview as DATA. The UI renders whatever is
   here, so adding/removing a question never touches render code.
   (This is also how Phase 10 modules — Finance, Faith… — will
   plug in: just more schemas.)

   Field types: info | text | number | textarea | select |
                chips (multi) | segment (single big cards) |
                scale (slider) | toggle | photos
   Optional keys: required, help, placeholder, unit, min, max,
                  step, options, when(profile), captions
   ============================================================ */
(function (NS) {
  'use strict';

  const SECTIONS = [
    /* 1 — Welcome ------------------------------------------------ */
    {
      id: 'welcome', kicker: 'Welcome', emoji: '🌙',
      title: 'Let’s build your LifeOS',
      subtitle: 'I’ll interview you like an elite health coach — body, medical history, lifestyle, skin, goals. Nothing is recommended until I understand you. Takes ~7 minutes, and it saves as you go so you can pause anytime.',
      fields: [
        { id: 'name', type: 'text', label: 'What should I call you?', placeholder: 'First name', required: true },
        { id: '_consent', type: 'info', variant: 'consent',
          html: '<b>Your data never leaves this device.</b> Everything you enter is stored locally in your browser. No account, no server, no tracking. You can export or wipe it anytime.' }
      ]
    },

    /* 2 — Body ---------------------------------------------------- */
    {
      id: 'body', kicker: 'About you', emoji: '📏',
      title: 'The basics',
      subtitle: 'These four numbers let me calculate your energy needs accurately (Mifflin–St Jeor).',
      fields: [
        { id: 'age', type: 'number', label: 'Age', unit: 'years', min: 14, max: 100, required: true },
        { id: 'sex', type: 'segment', label: 'Biological sex', required: true, help: 'Used only for metabolic math (BMR differs by sex).',
          options: [
            { value: 'male', label: 'Male', em: '♂' },
            { value: 'female', label: 'Female', em: '♀' },
            { value: 'other', label: 'Prefer not', em: '•' }
          ] },
        { id: 'height_cm', type: 'number', label: 'Height', unit: 'cm', min: 120, max: 230, required: true },
        { id: 'weight_kg', type: 'number', label: 'Current weight', unit: 'kg', min: 35, max: 250, step: 0.1, required: true },
        { id: 'waist_cm', type: 'number', label: 'Waist circumference', unit: 'cm', min: 50, max: 200,
          help: 'Optional but powerful — waist tracks belly (visceral) fat better than weight.' },
        { id: 'activity', type: 'segment', label: 'Daily activity level', required: true, cols: 1,
          options: [
            { value: 'sedentary', label: 'Sedentary', em: '🪑', desc: 'Desk job, little movement' },
            { value: 'light', label: 'Lightly active', em: '🚶', desc: 'Some walking / 1–2 workouts/wk' },
            { value: 'moderate', label: 'Moderately active', em: '🏃', desc: 'Training 3–4×/week' },
            { value: 'active', label: 'Very active', em: '💪', desc: 'Hard training 5–6×/week' },
            { value: 'athlete', label: 'Athlete', em: '🔥', desc: 'Twice-daily / physical job' }
          ] }
      ]
    },

    /* 3 — Goals & motivation ------------------------------------- */
    {
      id: 'goals', kicker: 'Direction', emoji: '🎯',
      title: 'What are we aiming for?',
      subtitle: 'Your goal sets the calorie strategy. Your “why” is what we’ll return to on hard days.',
      fields: [
        { id: 'goal', type: 'segment', label: 'Primary goal', required: true, cols: 1,
          options: [
            { value: 'lose_fat', label: 'Lose fat', em: '🔥', desc: 'Especially belly fat, keep muscle' },
            { value: 'recomp', label: 'Recomposition', em: '⚖️', desc: 'Lose fat + build muscle together' },
            { value: 'gain_muscle', label: 'Build muscle', em: '💪', desc: 'Lean surplus, get stronger' },
            { value: 'maintain', label: 'Maintain & feel great', em: '🌿', desc: 'Hold weight, improve health' }
          ] },
        { id: 'target_weight_kg', type: 'number', label: 'Target weight (optional)', unit: 'kg', min: 35, max: 250, step: 0.1 },
        { id: 'timeline', type: 'segment', label: 'Timeline', cols: 3,
          options: [
            { value: 'gentle', label: 'Gentle', em: '🐢', desc: '6–12 mo' },
            { value: 'steady', label: 'Steady', em: '🚶', desc: '3–6 mo' },
            { value: 'focused', label: 'Focused', em: '⚡', desc: '8–12 wk' }
          ] },
        { id: 'motivation', type: 'textarea', label: 'Your deeper why',
          placeholder: 'e.g. To honour the body Allah entrusted to me, keep up with my family, feel confident and disciplined…',
          help: 'Be honest and specific. We’ll resurface this when motivation dips.' },
        { id: 'fasting_pref', type: 'segment', label: 'Fasting approach', cols: 2,
          options: [
            { value: 'sunnah', label: 'Sunnah Mon/Thu', em: '🌙', desc: 'Faith + fat loss' },
            { value: '168', label: 'Daily 16:8', em: '⏰', desc: 'Time-restricted' },
            { value: 'both', label: 'Both', em: '✨', desc: 'Fastest, needs discipline' },
            { value: 'none', label: 'No fasting', em: '🍽️', desc: 'Deficit only' }
          ] },
        { id: 'budget', type: 'segment', label: 'Monthly budget for food/supps/skincare', cols: 3,
          options: [
            { value: 'lean', label: 'Lean', em: '💷', desc: 'Keep it cheap' },
            { value: 'moderate', label: 'Moderate', em: '💳', desc: 'Sensible spend' },
            { value: 'invest', label: 'Invest', em: '💎', desc: 'Best results' }
          ] }
      ]
    },

    /* 4 — Medical ------------------------------------------------ */
    {
      id: 'medical', kicker: 'Medical history', emoji: '🩺',
      title: 'Your health background',
      subtitle: 'This keeps every recommendation safe. All optional — share what you’re comfortable with. Stored only on your device.',
      fields: [
        { id: 'conditions', type: 'chips', label: 'Any diagnosed conditions?', multi: true,
          options: [
            { value: 'none', label: 'None', em: '✅' },
            { value: 'prediabetes', label: 'Pre-diabetes' }, { value: 'diabetes', label: 'Diabetes' },
            { value: 'hypertension', label: 'High blood pressure' }, { value: 'high_chol', label: 'High cholesterol' },
            { value: 'thyroid', label: 'Thyroid' }, { value: 'fatty_liver', label: 'Fatty liver' },
            { value: 'ibs', label: 'IBS/gut' }, { value: 'reflux', label: 'Acid reflux' },
            { value: 'asthma', label: 'Asthma' }, { value: 'joint', label: 'Joint issues' },
            { value: 'mental', label: 'Anxiety/depression' }
          ] },
        { id: 'conditions_other', type: 'text', label: 'Anything else?', placeholder: 'Other conditions…' },
        { id: 'injuries', type: 'textarea', label: 'Injuries or physical limitations',
          placeholder: 'e.g. lower-back sensitivity, old knee injury, shoulder…',
          help: 'So workouts avoid what hurts you.' }
      ]
    },

    /* 5 — Medications, supplements, allergies -------------------- */
    {
      id: 'meds', kicker: 'Medications', emoji: '💊',
      title: 'Medications & allergies',
      subtitle: 'Some supplements and foods interact with medications — this lets me flag conflicts.',
      fields: [
        { id: 'takes_meds', type: 'toggle', label: 'Do you take any regular medications?', offLabel: 'No', onLabel: 'Yes' },
        { id: 'medications', type: 'textarea', label: 'Which medications?', placeholder: 'Name + dose if you know it…',
          when: p => p.takes_meds === true },
        { id: 'supplements_current', type: 'textarea', label: 'Supplements you already take',
          placeholder: 'e.g. vitamin D, whey, multivitamin…' },
        { id: 'allergies', type: 'chips', label: 'Allergies / intolerances', multi: true,
          options: [
            { value: 'none', label: 'None', em: '✅' }, { value: 'lactose', label: 'Lactose' },
            { value: 'gluten', label: 'Gluten' }, { value: 'nuts', label: 'Nuts' },
            { value: 'shellfish', label: 'Shellfish' }, { value: 'eggs', label: 'Eggs' },
            { value: 'soy', label: 'Soy' }
          ] },
        { id: 'allergies_other', type: 'text', label: 'Other allergies', placeholder: 'Anything else to avoid…' }
      ]
    },

    /* 6 — Bloods & family --------------------------------------- */
    {
      id: 'bloods', kicker: 'Biomarkers', emoji: '🧬',
      title: 'Blood tests & family history',
      subtitle: 'Optional — but if you have recent bloodwork, it sharpens supplement and nutrition advice. Skip anything you don’t know.',
      fields: [
        { id: 'blood_glucose', type: 'number', label: 'Fasting glucose', unit: 'mg/dL', min: 40, max: 400 },
        { id: 'hba1c', type: 'number', label: 'HbA1c', unit: '%', min: 3, max: 15, step: 0.1 },
        { id: 'vitamin_d', type: 'number', label: 'Vitamin D', unit: 'ng/mL', min: 5, max: 120 },
        { id: 'cholesterol_total', type: 'number', label: 'Total cholesterol', unit: 'mg/dL', min: 80, max: 400 },
        { id: 'triglycerides', type: 'number', label: 'Triglycerides', unit: 'mg/dL', min: 30, max: 800 },
        { id: 'ferritin', type: 'number', label: 'Ferritin (iron store)', unit: 'ng/mL', min: 3, max: 1000 },
        { id: 'family_history', type: 'chips', label: 'Family history', multi: true,
          options: [
            { value: 'none', label: 'None notable', em: '✅' }, { value: 'diabetes', label: 'Diabetes' },
            { value: 'heart', label: 'Heart disease' }, { value: 'obesity', label: 'Obesity' },
            { value: 'cancer', label: 'Cancer' }, { value: 'hypertension', label: 'High BP' }
          ] }
      ]
    },

    /* 7 — Digestion & diet -------------------------------------- */
    {
      id: 'diet', kicker: 'Food', emoji: '🍽️',
      title: 'Digestion & food preferences',
      subtitle: 'So meals fit your gut, your faith, and your taste — the plan you’ll actually stick to.',
      fields: [
        { id: 'digestion', type: 'chips', label: 'Any digestive issues?', multi: true,
          options: [
            { value: 'none', label: 'All good', em: '✅' }, { value: 'bloating', label: 'Bloating' },
            { value: 'constipation', label: 'Constipation' }, { value: 'reflux', label: 'Reflux' },
            { value: 'sensitive', label: 'Sensitive stomach' }
          ] },
        { id: 'dietary_reqs', type: 'chips', label: 'Dietary requirements', multi: true,
          options: [
            { value: 'halal', label: 'Halal', em: '🕌' }, { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'pescatarian', label: 'Pescatarian' }, { value: 'dairy_free', label: 'Dairy-free' },
            { value: 'low_carb', label: 'Low-carb' }
          ] },
        { id: 'diet_style', type: 'segment', label: 'Cuisine you enjoy most', cols: 2,
          options: [
            { value: 'mauritian', label: 'Mauritian/Indian', em: '🍛', desc: 'Curries, dal, spice' },
            { value: 'mediterranean', label: 'Mediterranean', em: '🫒', desc: 'Fish, olive oil' },
            { value: 'simple', label: 'Simple & repetitive', em: '🔁', desc: 'Same meals, easy' },
            { value: 'mix', label: 'Variety', em: '🌍', desc: 'Mix it up' }
          ] },
        { id: 'foods_love', type: 'text', label: 'Foods you love', placeholder: 'Keep these in the plan…' },
        { id: 'foods_avoid', type: 'text', label: 'Foods you dislike / avoid', placeholder: 'Keep these out…' },
        { id: 'past_diets', type: 'chips', label: 'Diets you’ve tried before', multi: true,
          options: [
            { value: 'none', label: 'None' }, { value: 'keto', label: 'Keto' },
            { value: 'if', label: 'Fasting' }, { value: 'lowcal', label: 'Calorie counting' },
            { value: 'nosugar', label: 'No sugar' }, { value: 'slimming', label: 'Slimming clubs' }
          ] }
      ]
    },

    /* 8 — Lifestyle --------------------------------------------- */
    {
      id: 'lifestyle', kicker: 'Rhythm', emoji: '🌗',
      title: 'Sleep, stress & routine',
      subtitle: 'Sleep and stress drive belly-fat hormones as much as food does (Walker, Attia).',
      fields: [
        { id: 'work_schedule', type: 'segment', label: 'Work pattern', cols: 3,
          options: [
            { value: 'day', label: 'Daytime', em: '☀️' },
            { value: 'shifts', label: 'Shifts', em: '🔄' },
            { value: 'flexible', label: 'Flexible', em: '🏠' }
          ] },
        { id: 'sleep_hours', type: 'scale', label: 'Average sleep', min: 4, max: 10, step: 0.5, unit: 'h', default: 7,
          captions: ['4h', '10h'] },
        { id: 'sleep_quality', type: 'scale', label: 'Sleep quality', min: 1, max: 5, step: 1, default: 3,
          captions: ['Poor', 'Excellent'] },
        { id: 'stress', type: 'scale', label: 'Typical stress level', min: 1, max: 5, step: 1, default: 3,
          captions: ['Calm', 'Very stressed'] },
        { id: 'caffeine', type: 'segment', label: 'Caffeine / day', cols: 3,
          options: [
            { value: 'none', label: 'None', em: '🚫' }, { value: 'moderate', label: '1–2', em: '☕' },
            { value: 'high', label: '3+', em: '⚡' }
          ] },
        { id: 'smoking', type: 'segment', label: 'Smoking / vaping', cols: 3,
          options: [
            { value: 'no', label: 'No', em: '✅' }, { value: 'sometimes', label: 'Sometimes', em: '🌫️' },
            { value: 'yes', label: 'Daily', em: '🚬' }
          ] },
        { id: 'alcohol', type: 'segment', label: 'Alcohol', cols: 3,
          options: [
            { value: 'none', label: 'None', em: '🚫' }, { value: 'rare', label: 'Rare', em: '🥂' },
            { value: 'regular', label: 'Regular', em: '🍺' }
          ] }
      ]
    },

    /* 9 — Hydration --------------------------------------------- */
    {
      id: 'hydration', kicker: 'Water', emoji: '💧',
      title: 'Hydration',
      subtitle: 'Struggling to drink plain water is common. Tell me the truth and I’ll build a strategy that won’t make you nauseous.',
      fields: [
        { id: 'hydration_problem', type: 'toggle', label: 'Do you struggle to drink plain water?', offLabel: 'No', onLabel: 'Yes' },
        { id: 'hydration_notes', type: 'textarea', label: 'What happens?',
          placeholder: 'e.g. large amounts make me feel sick / I forget / I don’t like the taste…',
          when: p => p.hydration_problem === true },
        { id: 'typical_water', type: 'segment', label: 'Honestly, how much water now?', cols: 3,
          options: [
            { value: 'low', label: 'Barely any', em: '🏜️' }, { value: 'some', label: 'A few glasses', em: '🥛' },
            { value: 'good', label: 'Fairly hydrated', em: '💧' }
          ] }
      ]
    },

    /* 10 — Training ---------------------------------------------- */
    {
      id: 'training', kicker: 'Movement', emoji: '🏋️',
      title: 'How you train',
      subtitle: 'So workouts fit your kit, experience and schedule — and progress you safely.',
      fields: [
        { id: 'equipment', type: 'chips', label: 'What do you have access to?', multi: true,
          options: [
            { value: 'bodyweight', label: 'Bodyweight only', em: '🤸' },
            { value: 'elliptical', label: 'Elliptical', em: '🌀' },
            { value: 'dumbbells', label: 'Dumbbells', em: '🏋️' },
            { value: 'bands', label: 'Resistance bands', em: '➰' },
            { value: 'gym', label: 'Full gym', em: '🏟️' }
          ] },
        { id: 'experience', type: 'segment', label: 'Training experience', cols: 3,
          options: [
            { value: 'beginner', label: 'Beginner', em: '🌱' },
            { value: 'intermediate', label: 'Intermediate', em: '💪' },
            { value: 'advanced', label: 'Advanced', em: '🔥' }
          ] },
        { id: 'training_days', type: 'segment', label: 'Days per week you can train', cols: 4,
          options: [
            { value: '2', label: '2', em: '2️⃣' }, { value: '3', label: '3', em: '3️⃣' },
            { value: '4', label: '4', em: '4️⃣' }, { value: '5', label: '5+', em: '5️⃣' }
          ] }
      ]
    },

    /* 11 — Skin, hair, nails ------------------------------------ */
    {
      id: 'appearance', kicker: 'Skin • Hair • Nails', emoji: '✨',
      title: 'Skin, hair & nails',
      subtitle: 'So the skincare and supplement plan targets exactly your concerns.',
      fields: [
        { id: 'skin_type', type: 'segment', label: 'Your skin type', cols: 2,
          options: [
            { value: 'oily', label: 'Oily', em: '💧', desc: 'Shiny, larger pores' },
            { value: 'dry', label: 'Dry', em: '🍂', desc: 'Tight, flaky' },
            { value: 'combo', label: 'Combination', em: '🌗', desc: 'Oily T-zone, dry cheeks' },
            { value: 'normal', label: 'Normal', em: '🌿', desc: 'Balanced' }
          ] },
        { id: 'skin_concerns', type: 'chips', label: 'Skin concerns', multi: true,
          options: [
            { value: 'oiliness', label: 'Oiliness/shine' }, { value: 'acne', label: 'Acne/breakouts' },
            { value: 'pores', label: 'Large pores' }, { value: 'dark_spots', label: 'Dark spots' },
            { value: 'dullness', label: 'Dullness' }, { value: 'aging', label: 'Fine lines' },
            { value: 'redness', label: 'Redness' }, { value: 'dry_patches', label: 'Dry patches' }
          ] },
        { id: 'hair_concerns', type: 'chips', label: 'Hair concerns', multi: true,
          options: [
            { value: 'none', label: 'None', em: '✅' }, { value: 'thinning', label: 'Thinning' },
            { value: 'dandruff', label: 'Dandruff' }, { value: 'dryness', label: 'Dryness' }
          ] },
        { id: 'toenail_fungus', type: 'toggle', label: 'Toenail fungus / damaged nail?', offLabel: 'No', onLabel: 'Yes' },
        { id: 'toenail_notes', type: 'textarea', label: 'Tell me about the nail',
          placeholder: 'Which toe, how long, thickness, nail-bed damage, any treatment tried…',
          when: p => p.toenail_fungus === true }
      ]
    },

    /* 12 — Progress photos -------------------------------------- */
    {
      id: 'photos', kicker: 'Baseline', emoji: '📸',
      title: 'Progress photos (optional)',
      subtitle: 'The most honest progress tracker. Stored only on your device, never uploaded. Same lighting each time works best.',
      fields: [
        { id: 'photos', type: 'photos', label: 'Add a baseline set',
          slots: [{ key: 'front', label: 'Front' }, { key: 'side', label: 'Side' }, { key: 'back', label: 'Back' }] }
      ]
    },

    /* 13 — Review ------------------------------------------------ */
    {
      id: 'review', kicker: 'Almost there', emoji: '🚀',
      title: 'Generate my plan',
      subtitle: 'I’ll calculate your calories, macros, hydration and sleep targets from everything you told me. You can edit any answer later.',
      fields: [
        { id: '_review', type: 'info',
          html: '<span class="lead">What happens next</span>Your personalized targets are computed instantly and privately. The full adaptive dashboard, meal plans, workouts, skincare and coach then unlock across the coming updates — each built on <b>your</b> data, never assumptions.' }
      ]
    }
  ];

  // Fields that must be answered before we can generate targets.
  const REQUIRED = ['name', 'age', 'sex', 'height_cm', 'weight_kg', 'activity', 'goal'];

  NS.Schema = { SECTIONS, REQUIRED };
})(window.LifeOS = window.LifeOS || {});
