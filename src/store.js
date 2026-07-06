/* ============================================================
   store.js  →  LifeOS.Store
   The data layer. Owns the single persisted document, its schema
   version, migrations, and a dot-path get/set API with pub/sub.

   The physical backend sits behind `backend` (read/write strings),
   so localStorage can be swapped for AsyncStorage (React Native) or
   a FastAPI sync adapter later WITHOUT touching the rest of the app.
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils;

  const STORAGE_KEY = 'lifeos.doc';
  const SCHEMA_VERSION = 2;

  /* ---- Pluggable persistence backend (localStorage by default) ---- */
  const localBackend = {
    read() { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } },
    write(str) { try { localStorage.setItem(STORAGE_KEY, str); return true; } catch (e) { return false; } },
    clear() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }
  };
  let backend = localBackend;

  /* ---- The empty document shape (single source of truth) ---- */
  function freshDoc() {
    const now = new Date().toISOString();
    return {
      __version: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      // Phase 1
      profile: {},                                   // raw onboarding answers, keyed by field id
      onboarding: { completed: false, sectionIndex: 0, furthest: 0, startedAt: null, completedAt: null },
      consent: { localOnly: true, aiRemote: false }, // remote AI opt-in (off by default)
      targets: {},                                   // computed by Engine on completion
      settings: { units: 'metric', theme: 'dark', name: '' },
      // Reserved for later phases (declared now so migrations stay simple)
      days: {},        // Phase 3 — daily logs
      progress: {},    // Phase 4 — measurements & photos series
      game: { xp: 0, level: 1, streaks: {} }, // Phase 5
      coach: { threads: [] } // Phase 6
    };
  }

  /* ---- Migrations: map any older doc up to current version ---- */
  const migrations = {
    // Example for the future:
    // 3(doc){ doc.newField = default; return doc; }
  };
  function migrate(doc) {
    if (!doc || typeof doc !== 'object') return freshDoc();
    let v = doc.__version || 1;
    while (v < SCHEMA_VERSION) {
      v++;
      if (migrations[v]) doc = migrations[v](doc);
      doc.__version = v;
    }
    // Ensure any newly-added top-level keys exist (forward-safe merge)
    const base = freshDoc();
    for (const k in base) if (!(k in doc)) doc[k] = base[k];
    return doc;
  }

  let doc = null;
  const bus = U.emitter();
  let saveTimer = null;

  function load() {
    const raw = backend.read();
    if (!raw) { doc = freshDoc(); return doc; }
    try { doc = migrate(JSON.parse(raw)); }
    catch (e) { console.warn('Store: corrupt doc, resetting', e); doc = freshDoc(); }
    return doc;
  }
  function ensure() { if (!doc) load(); return doc; }

  function persist() {
    doc.updatedAt = new Date().toISOString();
    const ok = backend.write(JSON.stringify(doc));
    if (!ok) bus.emit({ type: 'quota-error' });
    return ok;
  }
  /** Debounced save so rapid edits (typing) don't thrash storage. */
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 180);
  }

  const Store = {
    /* lifecycle */
    load, migrate, freshDoc,
    get doc() { return ensure(); },

    /* backend swap point (FastAPI/AsyncStorage later) */
    setBackend(b) { backend = b; },
    SCHEMA_VERSION,

    /* read */
    get(path, def) { return U.getPath(ensure(), path, def); },
    all() { return ensure(); },

    /* write (dot-path). Persists (debounced) and notifies subscribers. */
    set(path, val, opts = {}) {
      doc = U.setPath(ensure(), path, val);
      if (opts.immediate) persist(); else scheduleSave();
      bus.emit({ type: 'set', path, val });
      return val;
    },
    /** Shallow-merge an object of {path: val}. */
    patch(map, opts = {}) {
      for (const p in map) doc = U.setPath(doc, p, map[p]);
      if (opts.immediate) persist(); else scheduleSave();
      bus.emit({ type: 'patch', map });
    },

    /* flush any pending debounced write immediately */
    flush() { clearTimeout(saveTimer); persist(); },

    /* reset everything (used by "restart onboarding") */
    reset() { doc = freshDoc(); persist(); bus.emit({ type: 'reset' }); },

    /* subscribe to changes */
    subscribe(fn) { return bus.subscribe(fn); }
  };

  NS.Store = Store;
})(window.LifeOS = window.LifeOS || {});
