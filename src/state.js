/* ============================================================
   state.js  →  LifeOS.State
   Ephemeral (in-memory) application state + a tiny router.
   Persisted data lives in Store; State only holds "where am I
   and what's on screen right now". Views subscribe and re-render.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils;

  const bus = U.emitter();
  const state = {
    route: 'boot',      // 'onboarding' | 'home' | (future: 'coach','progress',...)
    params: {},
    toast: null
  };

  const State = {
    get() { return state; },
    get route() { return state.route; },

    /** Navigate. Re-renders via subscribers. */
    go(route, params = {}) {
      state.route = route;
      state.params = params;
      if (typeof location !== 'undefined') { try { location.hash = route; } catch (e) {} }
      bus.emit({ type: 'route', route, params });
    },

    /** Force a re-render without changing route. */
    refresh() { bus.emit({ type: 'refresh', route: state.route }); },

    toast(msg, kind = 'info') {
      state.toast = { msg, kind, at: Date.now() };
      bus.emit({ type: 'toast', toast: state.toast });
    },

    subscribe(fn) { return bus.subscribe(fn); }
  };

  NS.State = State;
})(window.LifeOS = window.LifeOS || {});
