/* ============================================================
   charts.js  ->  LifeOS.Charts
   Dependency-free, offline SVG/HTML chart generators. Themeable
   via CSS custom properties passed as colours. Pure functions
   returning markup strings.
   ============================================================ */
(function (NS) {
  'use strict';

  function nums(values) { return values.map(v => (v && typeof v === 'object') ? v.v : v); }

  const Charts = {
    /* line/area trend from an array of numbers (or {v,date}); nulls are skipped */
    line(values, opts = {}) {
      const w = opts.w || 320, h = opts.h || 120;
      const pad = { t: 12, r: 10, b: 12, l: 10 };
      const raw = nums(values);
      const pts0 = raw.map((v, i) => ({ v, i })).filter(p => p.v != null && isFinite(p.v));
      if (pts0.length < 2) return '<div class="chart-empty">Log at least two entries to see a trend.</div>';
      const vs = pts0.map(p => p.v);
      const min = Math.min(...vs), max = Math.max(...vs), span = (max - min) || 1;
      const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
      const n = raw.length;
      const XY = pts0.map(p => {
        const x = pad.l + (n === 1 ? iw / 2 : (p.i / (n - 1)) * iw);
        const y = pad.t + ih - ((p.v - min) / span) * ih;
        return [x, y];
      });
      const poly = XY.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const area = pad.l + ',' + (pad.t + ih) + ' ' + poly + ' ' + (pad.l + iw) + ',' + (pad.t + ih);
      const last = XY[XY.length - 1];
      const color = opts.color || 'var(--teal)';
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="chartsvg" preserveAspectRatio="none">' +
        '<polygon points="' + area + '" fill="' + color + '" opacity="0.10"/>' +
        '<polyline points="' + poly + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5" fill="' + color + '"/></svg>';
    },

    /* tiny inline sparkline */
    spark(values, opts = {}) {
      const w = opts.w || 84, h = opts.h || 26, color = opts.color || 'var(--cyan)';
      const vs = nums(values).filter(v => v != null && isFinite(v));
      if (vs.length < 2) return '<span class="spark-empty">—</span>';
      const min = Math.min(...vs), max = Math.max(...vs), span = (max - min) || 1;
      const poly = vs.map((v, i) => (2 + i / (vs.length - 1) * (w - 4)).toFixed(1) + ',' + (2 + (h - 4) - ((v - min) / span) * (h - 4)).toFixed(1)).join(' ');
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="sparksvg"><polyline points="' + poly + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    },

    /* horizontal bars: items [{label, value, disp?, color?}] */
    bars(items, opts = {}) {
      const max = opts.max || Math.max(1, ...items.map(i => i.value));
      return '<div class="barset">' + items.map(it =>
        '<div class="barrow"><span class="barlbl">' + (it.label) + '</span>' +
        '<div class="bartrack"><i style="width:' + Math.round(Math.max(0, Math.min(1, it.value / max)) * 100) + '%;background:' + (it.color || 'var(--teal)') + '"></i></div>' +
        '<b>' + (it.disp != null ? it.disp : it.value) + '</b></div>').join('') + '</div>';
    }
  };
  NS.Charts = Charts;
})(window.LifeOS = window.LifeOS || {});
