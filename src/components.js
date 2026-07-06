/* ============================================================
   components.js  →  LifeOS.UI
   Pure presentational render helpers. Given a field definition
   and a value, return an HTML string. No state is touched here;
   the controller wires events via delegation (data-action).
   ============================================================ */
(function (NS) {
  'use strict';
  const U = NS.Utils;
  const esc = U.esc;

  /* ---- individual field renderers, keyed by type ---- */
  const renderers = {
    info(f) {
      if (f.variant === 'consent') {
        return `<div class="consent"><span class="lock">🔒</span><p>${f.html}</p></div>`;
      }
      return `<div class="ob-info">${f.html}</div>`;
    },

    text(f, v) {
      return baseField(f, `
        <div class="inp-row">
          <input class="inp" type="text" inputmode="text" data-field="${f.id}"
                 placeholder="${esc(f.placeholder || '')}" value="${esc(v || '')}">
          ${f.unit ? `<div class="inp-unit">${esc(f.unit)}</div>` : ''}
        </div>`);
    },

    number(f, v) {
      return baseField(f, `
        <div class="inp-row">
          <input class="inp" type="number" inputmode="decimal" data-field="${f.id}"
                 ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''}
                 ${f.step != null ? `step="${f.step}"` : ''}
                 placeholder="${esc(f.placeholder || '')}" value="${v != null && v !== '' ? esc(v) : ''}">
          ${f.unit ? `<div class="inp-unit">${esc(f.unit)}</div>` : ''}
        </div>`);
    },

    textarea(f, v) {
      return baseField(f, `<textarea class="inp" data-field="${f.id}"
        placeholder="${esc(f.placeholder || '')}">${esc(v || '')}</textarea>`);
    },

    select(f, v) {
      const opts = (f.options || []).map(o =>
        `<option value="${esc(o.value)}" ${v === o.value ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
      return baseField(f, `<select class="inp" data-field="${f.id}">
        <option value="">Choose…</option>${opts}</select>`);
    },

    segment(f, v) {
      const cols = f.cols || Math.min(f.options.length, 3);
      const opts = f.options.map(o => `
        <button type="button" class="seg-opt ${v === o.value ? 'on' : ''}"
                data-action="segment" data-field="${f.id}" data-value="${esc(o.value)}">
          ${o.em ? `<span class="em">${o.em}</span>` : ''}
          <b>${esc(o.label)}</b>${o.desc ? `<small>${esc(o.desc)}</small>` : ''}
        </button>`).join('');
      return baseField(f, `<div class="seg cols-${cols}">${opts}</div>`);
    },

    chips(f, v) {
      const arr = Array.isArray(v) ? v : [];
      const opts = f.options.map(o => `
        <button type="button" class="chip ${arr.includes(o.value) ? 'on' : ''}"
                data-action="chip" data-field="${f.id}" data-value="${esc(o.value)}">
          ${o.em ? `<span class="em">${o.em}</span>` : ''}${esc(o.label)}
        </button>`).join('');
      return baseField(f, `<div class="chips">${opts}</div>`);
    },

    scale(f, v) {
      const val = (v == null || v === '') ? (f.default != null ? f.default : f.min) : v;
      const caps = f.captions || [String(f.min), String(f.max)];
      return baseField(f, `
        <div class="scale">
          <div class="scale-val"><span data-scaleval="${f.id}">${esc(val)}</span>${f.unit ? `<small>${esc(f.unit)}</small>` : ''}</div>
          <input type="range" data-action="scale" data-field="${f.id}"
                 min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${esc(val)}">
          <div class="scale-cap"><span>${esc(caps[0])}</span><span>${esc(caps[1])}</span></div>
        </div>`);
    },

    toggle(f, v) {
      const on = v === true;
      return `<div class="field">
        <div class="toggle-row">
          <div class="t"><b>${esc(f.label)}</b>${f.help ? `<small>${esc(f.help)}</small>` : ''}</div>
          <button type="button" class="switch ${on ? 'on' : ''}" data-action="toggle" data-field="${f.id}"
                  aria-pressed="${on}"></button>
        </div>
      </div>`;
    },

    photos(f, v) {
      const store = v || {};
      const cells = f.slots.map(s => {
        const img = store[s.key];
        return `<label class="photo-cell">
          ${img
            ? `<img src="${img}" alt="${esc(s.label)}"><button type="button" class="rm" data-action="photo-rm" data-slot="${s.key}">✕</button>`
            : `<div class="ph"><span class="em">＋</span>${esc(s.label)}</div>`}
          <input type="file" accept="image/*" data-action="photo" data-slot="${s.key}">
        </label>`;
      }).join('');
      return baseField(f, `<div class="photo-grid">${cells}</div>`);
    }
  };

  function baseField(f, inner) {
    return `<div class="field">
      ${f.label ? `<label class="field-label">${esc(f.label)}${f.required ? '<span class="req-star">*</span>'
        : '<span class="opt">optional</span>'}</label>` : ''}
      ${f.help ? `<p class="field-help">${esc(f.help)}</p>` : ''}
      ${inner}
    </div>`;
  }

  const UI = {
    /** Render one field to HTML for a given value. */
    field(f, value) {
      const r = renderers[f.type];
      return r ? r(f, value) : '';
    },

    /** Section chrome (progress + dots + heading). */
    progress(pct) { return `<div class="ob-progress"><i style="width:${pct}%"></i></div>`; },
    dots(total, current, furthest) {
      let out = '<div class="ob-dots">';
      for (let i = 0; i < total; i++) {
        const cls = i === current ? 'now' : i <= furthest ? 'done' : '';
        out += `<span class="ob-dot ${cls}"></span>`;
      }
      return out + '</div>';
    },
    sectionHead(sec) {
      return `<div>
        ${sec.emoji ? `<span class="ob-emoji">${sec.emoji}</span>` : ''}
        <div class="ob-kicker">${esc(sec.kicker || '')}</div>
        <h1 class="ob-title">${esc(sec.title)}</h1>
        ${sec.subtitle ? `<p class="ob-sub">${esc(sec.subtitle)}</p>` : ''}
      </div>`;
    }
  };

  NS.UI = UI;
})(window.LifeOS = window.LifeOS || {});
