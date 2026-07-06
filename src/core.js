/* ============================================================
   core.js  ->  LifeOS.Core
   Architecture registry + runtime health-check. Declares the
   public API surface every module must expose, and verifies it at
   runtime — catching load-order bugs or API drift before they
   reach the user. Also reports storage stats. Load LAST (before
   app.js) so all modules are present when check() runs.
   ============================================================ */
(function (NS) {
  'use strict';
  const VERSION = '2.0.0';

  /* The contract: layer, and the public exports each module guarantees.
     Adding a module or changing its API means updating this manifest —
     the health-check then enforces it. */
  const MODULES = [
    { name: 'Utils', layer: 'Utilities', exports: ['esc', 'clamp', 'todayKey', 'emitter', 'getPath', 'setPath', 'compressImage'] },
    { name: 'Store', layer: 'Data · Storage', exports: ['load', 'get', 'set', 'patch', 'reset', 'subscribe', 'setBackend', 'flush'] },
    { name: 'State', layer: 'State', exports: ['go', 'refresh', 'subscribe'] },
    { name: 'Engine', layer: 'Business · Health', exports: ['computeTargets', 'bmr', 'tdee', 'bmi', 'headline'] },
    { name: 'Meals', layer: 'Data', exports: ['TEMPLATES'] },
    { name: 'Nutrition', layer: 'Business · Health', exports: ['buildDay', 'weekPlan', 'timing', 'plan'] },
    { name: 'Supplements', layer: 'Business · Health', exports: ['recommend'] },
    { name: 'Hydration', layer: 'Business · Health', exports: ['strategy'] },
    { name: 'Training', layer: 'Business · Health', exports: ['program'] },
    { name: 'Quotes', layer: 'Data', exports: ['ALL', 'ofDay', 'random'] },
    { name: 'Scoring', layer: 'Business · Health', exports: ['all', 'health', 'recovery', 'hydration', 'nutrition', 'movement'] },
    { name: 'Skincare', layer: 'Business · Health', exports: ['routine'] },
    { name: 'Log', layer: 'Business · Data', exports: ['day', 'get', 'set', 'addWater', 'toggleMeal', 'toggle', 'streak'] },
    { name: 'Charts', layer: 'UI · Visualization', exports: ['line', 'bars', 'spark'] },
    { name: 'Progress', layer: 'Business · Analytics', exports: ['measurements', 'addMeasurement', 'navyBodyFat', 'summary', 'weightSeries', 'scoreSeries', 'photoTimeline'] },
    { name: 'Game', layer: 'Business · Gamification', exports: ['totalXP', 'dayXP', 'levelFor', 'dailyStreak', 'weeklyStreak', 'monthlyStreak', 'achievements', 'milestones', 'isActive'] },
    { name: 'AI', layer: 'AI · Provider', exports: ['chat', 'morningBrief', 'eveningReview', 'register', 'use', 'current', 'makeRemoteProvider'] },
    { name: 'Coach', layer: 'Business · AI', exports: ['context', 'thread', 'pushMsg', 'send', 'briefing', 'clear'] },
    { name: 'Knowledge', layer: 'Data', exports: ['ENTRIES', 'categories'] },
    { name: 'Timeline', layer: 'Business · Analytics', exports: ['project', 'HORIZONS'] },
    { name: 'Schema', layer: 'Data', exports: ['SECTIONS', 'REQUIRED'] },
    { name: 'UI', layer: 'UI · Components', exports: ['field', 'progress', 'dots', 'sectionHead'] },
    { name: 'Onboarding', layer: 'UI · Flow', exports: ['mount', 'render', 'finalize'] },
    { name: 'Dashboard', layer: 'UI · View', exports: ['html', 'afterMount', 'ctx'] },
    { name: 'App', layer: 'UI · Bootstrap', exports: ['boot', 'renderRoute', 'shellHTML'] },
    { name: 'Modules', layer: 'Platform · Extensions', exports: ['register', 'all', 'get', 'store'] },
    { name: 'Gestures', layer: 'UI · Interaction', exports: ['init'] }
  ];

  function check() {
    const modules = MODULES.map(m => {
      const mod = NS[m.name];
      if (!mod) return { name: m.name, layer: m.layer, ok: false, missing: ['(module not loaded)'] };
      const missing = m.exports.filter(ex => mod[ex] === undefined);
      return { name: m.name, layer: m.layer, ok: missing.length === 0, missing };
    });
    const passed = modules.filter(m => m.ok).length;
    return { version: VERSION, total: modules.length, passed, ok: passed === modules.length, modules };
  }

  function storage() {
    const S = NS.Store; if (!S) return null;
    let bytes = 0; try { bytes = JSON.stringify(S.doc).length; } catch (e) {}
    const doc = S.doc || {};
    return {
      schema: S.SCHEMA_VERSION,
      bytes,
      days: Object.keys(doc.days || {}).length,
      measurements: ((doc.progress || {}).measurements || []).length,
      onboarded: !!((doc.onboarding || {}).completed)
    };
  }

  /* layers in display order */
  function layers() {
    const seen = []; MODULES.forEach(m => { if (!seen.includes(m.layer)) seen.push(m.layer); }); return seen;
  }

  NS.version = VERSION;
  NS.Core = { VERSION, MODULES, check, storage, layers };
})(window.LifeOS = window.LifeOS || {});
