/* ============================================================
   modules/registry.js  ->  LifeOS.Modules
   The Phase-10 extension platform. A life domain (Faith, Finance,
   Learning…) is a self-contained IIFE that calls Modules.register()
   with { id, label, icon, render(api), onAction(do, el, api) }.
   The app renders whatever is registered and delegates all actions
   back to the module — so the health app needs ZERO changes to add
   a new domain. Each module gets a namespaced store slice.
   ============================================================ */
(function (NS) {
  'use strict';
  const Store = NS.Store;
  const REG = [];

  function register(mod) {
    if (mod && mod.id && !REG.find(m => m.id === mod.id)) REG.push(mod);
    return mod;
  }
  function all() { return REG.slice(); }
  function get(id) { return REG.find(m => m.id === id) || null; }

  /* a per-module store slice under `modules.<id>` — isolation from health data */
  function store(id) {
    const base = 'modules.' + id;
    return {
      get(field, def) { const v = Store.get(field ? base + '.' + field : base, def); return v === undefined ? def : v; },
      set(field, val) { Store.set(base + '.' + field, val, { immediate: true }); return val; },
      all() { return Store.get(base, {}); }
    };
  }

  NS.Modules = { register, all, get, store };
})(window.LifeOS = window.LifeOS || {});
