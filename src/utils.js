/* ============================================================
   utils.js  →  LifeOS.Utils
   Pure, dependency-free helpers. No DOM state, no side effects
   beyond the DOM helpers. Portable to React Native (drop the
   dom helpers, keep the rest).
   ============================================================ */
(function (NS) {
  'use strict';

  const Utils = {
    /* ---------- DOM ---------- */
    qs: (sel, root = document) => root.querySelector(sel),
    qsa: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    /** Create an element from an HTML string (first node). */
    el(html) {
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      return t.content.firstElementChild;
    },
    /** Escape untrusted text before injecting into HTML. */
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
    },

    /* ---------- Math ---------- */
    clamp: (n, lo, hi) => Math.min(hi, Math.max(lo, n)),
    round: (n, step = 1) => Math.round(n / step) * step,
    num(v, def = 0) { const n = parseFloat(v); return Number.isFinite(n) ? n : def; },

    /* ---------- Dates ---------- */
    todayKey() { return new Date().toISOString().slice(0, 10); },
    isoDaysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); },
    prettyDate(d = new Date()) {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    },
    /** Sunnah fasting days: Monday (1) and Thursday (4). */
    isFastingDay(d = new Date()) { const g = d.getDay(); return g === 1 || g === 4; },
    greeting(d = new Date()) {
      const h = d.getHours();
      return h < 5 ? 'Peace be upon you' : h < 12 ? 'Good morning'
        : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Assalamu alaikum';
    },

    /* ---------- Ids ---------- */
    uid() {
      return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    /* ---------- Object path get/set (immutable-ish) ---------- */
    getPath(obj, path, def) {
      const parts = Array.isArray(path) ? path : String(path).split('.');
      let cur = obj;
      for (const p of parts) {
        if (cur == null || typeof cur !== 'object') return def;
        cur = cur[p];
      }
      return cur === undefined ? def : cur;
    },
    setPath(obj, path, val) {
      const parts = Array.isArray(path) ? path : String(path).split('.');
      const out = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);
      let cur = out;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        const next = cur[k];
        cur[k] = (next && typeof next === 'object') ? (Array.isArray(next) ? next.slice() : Object.assign({}, next)) : {};
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = val;
      return out;
    },

    /* ---------- Validation ---------- */
    isEmpty(v) {
      return v == null || v === '' || (Array.isArray(v) && v.length === 0);
    },

    /* ---------- Formatting ---------- */
    kg(v) { return Utils.num(v).toFixed(v % 1 ? 1 : 0) + ' kg'; },
    litres(ml) { return (ml / 1000).toFixed(1) + ' L'; },

    /* ---------- Tiny pub/sub factory (reused by Store & State) ---------- */
    emitter() {
      const subs = new Set();
      return {
        subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
        emit(payload) { subs.forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); }
      };
    },

    /* ---------- Image compression (for progress photos) ---------- */
    compressImage(file, maxDim = 720, quality = 0.62) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', quality));
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  NS.Utils = Utils;
})(window.LifeOS = window.LifeOS || {});
