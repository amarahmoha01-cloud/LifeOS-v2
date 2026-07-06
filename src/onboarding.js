/* ============================================================
   onboarding.js  →  LifeOS.Onboarding
   Flow controller. Autosaves every answer, supports resume,
   conditional fields, validation, and the final generate step.

   MOBILE UX: selecting an option updates the value IN PLACE with
   zero scrolling and no full re-render. Only moving between
   sections scrolls to the top. This eliminates the scroll-jump.
   ============================================================ */
(function (NS) {
  'use strict';
  const { Utils: U, Store, State, Engine, Schema, UI } = NS;

  const Onboarding = {
    root: null,
    wired: false,

    mount(root) {
      this.root = root;
      this.wire();
      this.render();
    },

    wire() {
      if (this.wired) return;
      this.wired = true;
      this.root.addEventListener('click', e => this.onClick(e));
      this.root.addEventListener('input', e => this.onInput(e));
      this.root.addEventListener('change', e => this.onChange(e));
    },

    profile() { return Store.get('profile', {}); },
    idx() { return Store.get('onboarding.sectionIndex', 0); },
    section() { return Schema.SECTIONS[this.idx()]; },
    visibleFields(sec) {
      const p = this.profile();
      return sec.fields.filter(f => !f.when || f.when(p));
    },
    /* signature of which fields are visible — to detect conditional reveals */
    _visIds() { return this.visibleFields(this.section()).map(f => f.id).join(','); },

    /* ---------------- full section render (navigation only) ---------------- */
    render() {
      if (State.route !== 'onboarding') return;
      const sec = this.section();
      const i = this.idx();
      const total = Schema.SECTIONS.length;
      const furthest = Store.get('onboarding.furthest', 0);
      const p = this.profile();
      const pct = Math.round((i / (total - 1)) * 100);
      const isLast = i === total - 1;
      const hasRequired = this.visibleFields(sec).some(f => f.required);
      const fieldsHTML = this.visibleFields(sec).map(f => UI.field(f, p[f.id])).join('');

      this.root.innerHTML = `
      <div class="ob">
        <div class="ob-top">
          <div class="ob-logo">L</div>
          <div class="meta"><b>LifeOS setup</b><span>Step ${i + 1} of ${total} · ${U.esc(sec.kicker || '')}</span></div>
          ${!hasRequired && !isLast ? `<button class="ob-skip" data-action="skip">Skip</button>` : ''}
        </div>
        ${UI.progress(pct)}
        ${UI.dots(total, i, furthest)}
        <div class="ob-body">
          ${UI.sectionHead(sec)}
          <div class="ob-fields" id="ob-fields">${fieldsHTML}</div>
          <div class="err-line" data-err></div>
        </div>
        <div class="ob-nav">
          ${i > 0 ? `<button class="btn btn-ghost" data-action="back">Back</button>` : ''}
          ${isLast
            ? `<button class="btn btn-primary" data-action="generate">Generate my plan →</button>`
            : `<button class="btn btn-primary" data-action="next">Continue</button>`}
        </div>
      </div>`;
      // section change → top, instantly (snappy, native). No smooth scroll.
      window.scrollTo(0, 0);
    },

    /* ---------------- in-place field re-render (conditional reveals) ---------------- */
    renderFields() {
      const box = this.root.querySelector('#ob-fields');
      if (!box) return this.render();
      const y = window.scrollY;                 // preserve exact scroll position
      const p = this.profile();
      box.innerHTML = this.visibleFields(this.section()).map(f => UI.field(f, p[f.id])).join('');
      window.scrollTo(0, y);
    },

    /* ---------------- events ---------------- */
    onClick(e) {
      if (State.route !== 'onboarding') return;
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const a = t.dataset.action;

      if (a === 'next') return this.next();
      if (a === 'back') return this.back();
      if (a === 'skip') return this.advance();
      if (a === 'generate') return this.finalize();

      if (a === 'segment') {
        const before = this._visIds();
        this.setField(t.dataset.field, t.dataset.value);
        const seg = t.closest('.seg');
        if (seg) seg.querySelectorAll('.seg-opt').forEach(o => o.classList.toggle('on', o === t));
        if (this._visIds() !== before) this.renderFields();   // only if a field appears/hides
        this.clearError();
        return;
      }
      if (a === 'chip') {
        const before = this._visIds();
        this.toggleChip(t.dataset.field, t.dataset.value);
        const arr = Store.get('profile.' + t.dataset.field, []) || [];
        const box = t.closest('.chips');
        if (box) box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', arr.indexOf(c.dataset.value) >= 0));
        if (this._visIds() !== before) this.renderFields();
        this.clearError();
        return;
      }
      if (a === 'toggle') {
        const cur = Store.get('profile.' + t.dataset.field, false);
        this.setField(t.dataset.field, !cur);
        t.classList.toggle('on', !cur);
        this.renderFields();                                   // toggles gate conditional fields
        return;
      }
      if (a === 'photo-rm') {
        const photos = Object.assign({}, Store.get('profile.photos', {}));
        delete photos[t.dataset.slot];
        this.setField('photos', photos);
        this.renderFields();
        return;
      }
    },

    onInput(e) {
      if (State.route !== 'onboarding') return;
      const el = e.target;
      if (el.dataset.action === 'scale') {
        const lbl = this.root.querySelector(`[data-scaleval="${el.dataset.field}"]`);
        if (lbl) lbl.textContent = el.value;
        this.setField(el.dataset.field, U.num(el.value));
        return;
      }
      if (el.dataset.field && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        this.setField(el.dataset.field, el.value);            // live save, no re-render (keeps focus + scroll)
        this.clearError();
      }
    },

    async onChange(e) {
      if (State.route !== 'onboarding') return;
      const el = e.target;
      if (el.tagName === 'SELECT' && el.dataset.field) {
        this.setField(el.dataset.field, el.value);
        this.renderFields();
        return;
      }
      if (el.dataset.action === 'photo' && el.files && el.files[0]) {
        try {
          const dataUrl = await U.compressImage(el.files[0]);
          const photos = Object.assign({}, Store.get('profile.photos', {}));
          photos[el.dataset.slot] = dataUrl;
          this.setField('photos', photos);
          this.renderFields();
        } catch (err) { /* ignore */ }
      }
    },

    /* ---------------- helpers ---------------- */
    setField(id, val) { Store.set('profile.' + id, val); },

    toggleChip(id, val) {
      let arr = Store.get('profile.' + id, []);
      arr = Array.isArray(arr) ? arr.slice() : [];
      if (val === 'none') {
        arr = arr.includes('none') ? [] : ['none'];
      } else {
        arr = arr.filter(x => x !== 'none');
        arr.includes(val) ? (arr = arr.filter(x => x !== val)) : arr.push(val);
      }
      this.setField(id, arr);
    },

    validate() {
      const sec = this.section();
      for (const f of this.visibleFields(sec)) {
        if (f.required && U.isEmpty(Store.get('profile.' + f.id))) return f.label || 'This field';
      }
      return null;
    },

    showError(msg) { const e = this.root.querySelector('[data-err]'); if (e) e.textContent = msg; },
    clearError() { const e = this.root.querySelector('[data-err]'); if (e && e.textContent) e.textContent = ''; },

    next() {
      const missing = this.validate();
      if (missing) { this.showError(`Please complete: ${missing}`); return; }
      this.advance();
    },

    advance() {
      const i = this.idx();
      const total = Schema.SECTIONS.length;
      const ni = Math.min(i + 1, total - 1);
      Store.patch({
        'onboarding.sectionIndex': ni,
        'onboarding.furthest': Math.max(Store.get('onboarding.furthest', 0), ni),
        'onboarding.startedAt': Store.get('onboarding.startedAt') || new Date().toISOString()
      }, { immediate: true });
      this.render();
    },

    back() {
      const ni = Math.max(0, this.idx() - 1);
      Store.set('onboarding.sectionIndex', ni, { immediate: true });
      this.render();
    },

    finalize() {
      const missing = Schema.REQUIRED.filter(id => U.isEmpty(Store.get('profile.' + id)));
      if (missing.length) {
        const secIdx = Schema.SECTIONS.findIndex(s => s.fields.some(f => missing.includes(f.id)));
        Store.set('onboarding.sectionIndex', Math.max(0, secIdx), { immediate: true });
        this.render();
        this.showError('A few essentials are still needed — I’ve taken you back to them.');
        return;
      }
      const profile = Store.get('profile', {});
      const targets = Engine.computeTargets(profile);
      Store.patch({
        'targets': targets,
        'onboarding.completed': true,
        'onboarding.completedAt': new Date().toISOString(),
        'settings.name': profile.name || ''
      }, { immediate: true });
      State.go('home');
    }
  };

  NS.Onboarding = Onboarding;
})(window.LifeOS = window.LifeOS || {});
