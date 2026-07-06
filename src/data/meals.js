/* ============================================================
   data/meals.js  →  LifeOS.Meals
   Meal template library (DATA only). Each template carries
   approximate macros for a standard serving and allergen/diet
   tags so the generator can filter and portion-scale them.
   Macros are per standard serving; the generator scales them.
   All templates are halal by construction (no pork/alcohol).
   ============================================================ */
(function (NS) {
  'use strict';

  // tag flags default false; only list what's present
  const T = (o) => Object.assign({ veg: false, fish: false, meat: false, dairy: false, egg: false, nuts: false, gluten: false, soy: false, shellfish: false, lowcarb: false }, o);

  const TEMPLATES = [
    /* ---------------- BREAKFAST (also used for suhoor) ---------------- */
    { id: 'b_eggs_avo', name: 'Eggs, avocado & sourdough', emoji: '🍳', slot: 'breakfast',
      cuisines: ['mediterranean', 'mix', 'simple'], kcal: 430, p: 26, c: 28, f: 24,
      items: ['3 eggs (scrambled in olive oil)', '½ avocado', '1 slice sourdough', 'Tomato & cucumber'],
      tags: T({ egg: true, gluten: true }), why: 'High-protein start blunts cravings all day (Huberman).' },
    { id: 'b_greek_berry', name: 'Greek yogurt, berries & oats', emoji: '🥣', slot: 'breakfast',
      cuisines: ['mediterranean', 'simple', 'mix'], kcal: 400, p: 30, c: 45, f: 10,
      items: ['200g Greek yogurt', '40g oats', 'Mixed berries', 'Chia + cinnamon'],
      tags: T({ dairy: true, gluten: true }), why: 'Protein + slow carbs + polyphenols for gut and skin (Patrick).' },
    { id: 'b_masala_omelette', name: 'Masala omelette & roti', emoji: '🍳', slot: 'breakfast',
      cuisines: ['mauritian', 'indian', 'mix'], kcal: 420, p: 24, c: 34, f: 20,
      items: ['3-egg masala omelette (onion, chilli, coriander)', '1 wholemeal roti', 'Side of tomato'],
      tags: T({ egg: true, gluten: true }), why: 'Familiar spice, protein-forward, keeps you full.' },
    { id: 'b_oats_pb', name: 'Overnight oats & peanut butter', emoji: '🥜', slot: 'breakfast',
      cuisines: ['simple', 'mix'], kcal: 450, p: 20, c: 50, f: 18,
      items: ['50g oats', '1 tbsp peanut butter', 'Banana', 'Milk or soy milk'],
      tags: T({ nuts: true, dairy: true, gluten: true }), why: 'Slow-release carbs; ideal pre-dawn suhoor fuel.' },
    { id: 'b_tofu_scramble', name: 'Tofu scramble & greens', emoji: '🌱', slot: 'breakfast',
      cuisines: ['mediterranean', 'mix', 'simple'], kcal: 380, p: 24, c: 26, f: 18,
      items: ['200g firm tofu, turmeric & spinach', '1 slice rye', 'Cherry tomatoes'],
      tags: T({ soy: true, gluten: true, veg: true }), why: 'Plant-based, high protein, dairy- and egg-free.' },

    /* ---------------- LUNCH ---------------- */
    { id: 'l_chicken_rice', name: 'Grilled chicken, basmati & salad', emoji: '🍗', slot: 'lunch',
      cuisines: ['mauritian', 'indian', 'simple', 'mix'], kcal: 560, p: 45, c: 55, f: 16,
      items: ['170g grilled chicken (masala or lemon-herb)', '¾ cup basmati', 'Big salad + olive oil & lemon'],
      tags: T({}), why: '~45g protein maximises muscle protein synthesis (Norton).' },
    { id: 'l_fish_couscous', name: 'Baked fish & couscous', emoji: '🐟', slot: 'lunch',
      cuisines: ['mediterranean', 'mix'], kcal: 540, p: 42, c: 50, f: 16,
      items: ['180g white fish', 'Couscous with herbs', 'Roasted peppers & courgette'],
      tags: T({ fish: true, gluten: true }), why: 'Lean protein + Mediterranean veg; light and satiating.' },
    { id: 'l_dal_veg', name: 'Lentil dal, rice & vegetables', emoji: '🍛', slot: 'lunch',
      cuisines: ['mauritian', 'indian', 'mix'], kcal: 520, p: 24, c: 72, f: 12,
      items: ['1.5 cups lentil dal', '¾ cup basmati', 'Sautéed greens', 'Yogurt/raita'],
      tags: T({ dairy: true, veg: true }), why: 'Plant protein + fibre; great on a lean budget.' },
    { id: 'l_turkey_wrap', name: 'Turkey & hummus wrap', emoji: '🌯', slot: 'lunch',
      cuisines: ['simple', 'mix', 'mediterranean'], kcal: 500, p: 38, c: 46, f: 16,
      items: ['150g turkey', 'Wholemeal wrap', 'Hummus, salad, pickles'],
      tags: T({ gluten: true }), why: 'Fast, portable, protein-dense — easy adherence.' },
    { id: 'l_beef_salad', name: 'Lean beef & quinoa bowl', emoji: '🥩', slot: 'lunch',
      cuisines: ['mix', 'mediterranean'], kcal: 560, p: 44, c: 44, f: 20,
      items: ['150g lean beef (halal)', 'Quinoa', 'Roast veg, rocket, olive oil'],
      tags: T({ meat: true }), why: 'Iron + creatine-rich red meat; keeps you strong in a deficit.' },

    /* ---------------- DINNER (also used for iftar) ---------------- */
    { id: 'd_salmon_veg', name: 'Salmon & roasted vegetables', emoji: '🐟', slot: 'dinner',
      cuisines: ['mediterranean', 'mix'], kcal: 520, p: 40, c: 26, f: 28,
      items: ['150g salmon', 'Roasted courgette, peppers, spinach', 'Small sweet potato'],
      tags: T({ fish: true, lowcarb: true }), why: 'Omega-3 for heart, brain & skin; finishes the day light (Attia).' },
    { id: 'd_chicken_curry', name: 'Chicken curry & cauliflower rice', emoji: '🍛', slot: 'dinner',
      cuisines: ['mauritian', 'indian', 'mix'], kcal: 480, p: 42, c: 22, f: 24,
      items: ['170g chicken curry (tomato, spice)', 'Cauliflower rice', 'Cucumber salad'],
      tags: T({ lowcarb: true }), why: 'Low-carb evening, high protein, full flavour.' },
    { id: 'd_fish_veg', name: 'Grilled white fish & greens', emoji: '🍽️', slot: 'dinner',
      cuisines: ['mediterranean', 'simple', 'mix'], kcal: 440, p: 40, c: 20, f: 22,
      items: ['180g white fish', 'Green beans, broccoli', 'Olive oil & lemon'],
      tags: T({ fish: true, lowcarb: true }), why: 'Light, lean, easy to digest before sleep.' },
    { id: 'd_paneer_sabzi', name: 'Paneer & vegetable sabzi', emoji: '🧀', slot: 'dinner',
      cuisines: ['indian', 'mauritian', 'mix'], kcal: 500, p: 28, c: 28, f: 30,
      items: ['150g paneer', 'Mixed vegetable sabzi', 'Small portion rice or roti'],
      tags: T({ dairy: true, veg: true }), why: 'Vegetarian protein; satisfying and spiced.' },
    { id: 'd_lentil_soup', name: 'Lentil & vegetable soup + bread', emoji: '🍲', slot: 'dinner',
      cuisines: ['mediterranean', 'mix', 'simple'], kcal: 420, p: 24, c: 54, f: 10,
      items: ['Hearty lentil & veg soup', '1 slice wholegrain bread', 'Side salad'],
      tags: T({ gluten: true, veg: true }), why: 'Gentle rehydrating iftar opener after a fast.' },
    { id: 'd_tofu_stirfry', name: 'Tofu & vegetable stir-fry', emoji: '🥦', slot: 'dinner',
      cuisines: ['mix', 'simple'], kcal: 460, p: 26, c: 40, f: 20,
      items: ['200g tofu', 'Mixed stir-fry veg', 'Tamari, ginger, garlic', 'Small rice'],
      tags: T({ soy: true, veg: true }), why: 'Plant-based, dairy-free, quick and lean.' },

    /* ---------------- SNACK (also post-iftar) ---------------- */
    { id: 's_yogurt_nuts', name: 'Greek yogurt & walnuts', emoji: '🥜', slot: 'snack',
      cuisines: ['mediterranean', 'simple', 'mix'], kcal: 210, p: 18, c: 12, f: 11,
      items: ['150g Greek yogurt', 'Handful walnuts', 'Drizzle honey'],
      tags: T({ dairy: true, nuts: true }), why: 'Protein + omega-3 nuts for skin and satiety.' },
    { id: 's_apple_egg', name: 'Apple & boiled eggs', emoji: '🍎', slot: 'snack',
      cuisines: ['simple', 'mix'], kcal: 200, p: 13, c: 20, f: 8,
      items: ['1 apple', '2 boiled eggs'],
      tags: T({ egg: true }), why: 'Whole-food, portable, dairy-free protein.' },
    { id: 's_chana', name: 'Roasted chana (chickpeas)', emoji: '🫘', slot: 'snack',
      cuisines: ['mauritian', 'indian', 'mix'], kcal: 190, p: 11, c: 28, f: 5,
      items: ['Roasted spiced chickpeas', 'Lemon & chilli'],
      tags: T({ veg: true }), why: 'Fibre + plant protein; crunchy craving-killer.' },
    { id: 's_shake', name: 'Protein shake & banana', emoji: '🥤', slot: 'snack',
      cuisines: ['simple', 'mix'], kcal: 240, p: 28, c: 26, f: 3,
      items: ['1 scoop whey/plant protein', 'Banana', 'Water or milk'],
      tags: T({ dairy: true }), why: 'Easy way to close a protein gap post-workout.' },
    { id: 's_dates_nuts', name: 'Dates & almonds', emoji: '🌴', slot: 'snack',
      cuisines: ['mix', 'mediterranean', 'mauritian'], kcal: 200, p: 6, c: 30, f: 9,
      items: ['2–3 dates', 'Handful almonds'],
      tags: T({ nuts: true, veg: true }), why: 'Sunnah-friendly quick energy to break a fast.' },

    /* ---- added: protein-dense Mauritian/Indian options (variety) ---- */
    { id: 'b_egg_curry', name: 'Egg curry & roti', emoji: '🍳', slot: 'breakfast',
      cuisines: ['mauritian', 'indian', 'mix'], kcal: 440, p: 26, c: 36, f: 20,
      items: ['2-egg curry (tomato, onion, spice)', '1 wholemeal roti', 'Coriander & chilli'],
      tags: T({ egg: true, gluten: true }), why: 'Protein-forward, familiar Mauritian flavour to start the day.' },
    { id: 'b_smoked_fish', name: 'Smoked fish, tomato & bread', emoji: '🐟', slot: 'breakfast',
      cuisines: ['mauritian', 'mix'], kcal: 400, p: 30, c: 26, f: 16,
      items: ['Smoked marlin / fish', 'Tomato & onion', '1 slice wholegrain bread'],
      tags: T({ fish: true, gluten: true }), why: 'Lean high-protein, island-style breakfast.' },
    { id: 'l_tandoori', name: 'Tandoori chicken & rice', emoji: '🍗', slot: 'lunch',
      cuisines: ['indian', 'mauritian', 'mix'], kcal: 580, p: 48, c: 52, f: 16,
      items: ['180g tandoori chicken', '¾ cup basmati', 'Kachumber salad'],
      tags: T({}), why: 'High protein, big flavour, low added fat.' },
    { id: 'l_fish_vindaye', name: 'Fish vindaye & rice', emoji: '🐟', slot: 'lunch',
      cuisines: ['mauritian', 'mix'], kcal: 540, p: 40, c: 54, f: 14,
      items: ['Mauritian fish vindaye (mustard, turmeric)', '¾ cup basmati', 'Green salad'],
      tags: T({ fish: true }), why: 'A Mauritian classic — lean fish, bright spice.' },
    { id: 'd_chicken_tikka', name: 'Chicken tikka & salad', emoji: '🍗', slot: 'dinner',
      cuisines: ['indian', 'mauritian', 'mix'], kcal: 460, p: 44, c: 16, f: 24,
      items: ['180g chicken tikka', 'Large salad', 'Mint yogurt'],
      tags: T({ dairy: true, lowcarb: true }), why: 'Low-carb, very high protein evening plate.' },
    { id: 'd_keema_peas', name: 'Lean keema & peas', emoji: '🍛', slot: 'dinner',
      cuisines: ['indian', 'mauritian', 'mix'], kcal: 500, p: 40, c: 28, f: 26,
      items: ['Lean minced beef keema (halal)', 'Peas & tomato', 'Small rice or roti'],
      tags: T({ meat: true }), why: 'Iron + protein-rich, deeply satisfying.' },
    { id: 's_masala_eggs', name: 'Masala boiled eggs', emoji: '🥚', slot: 'snack',
      cuisines: ['mauritian', 'indian', 'mix'], kcal: 160, p: 13, c: 2, f: 11,
      items: ['2 boiled eggs', 'Chilli, salt & lemon'],
      tags: T({ egg: true, lowcarb: true }), why: 'Portable protein, zero prep.' }
  ];

  NS.Meals = { TEMPLATES };
})(window.LifeOS = window.LifeOS || {});
