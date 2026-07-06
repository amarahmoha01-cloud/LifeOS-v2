/* modules/finance.js — a Life module: budget, expenses, savings goal. Self-registers. */
(function (NS) {
  'use strict';
  const M = NS.Modules, U = NS.Utils, esc = U.esc;
  const CATS = ['Food', 'Bills', 'Transport', 'Health', 'Fun', 'Other'];
  const month = () => U.todayKey().slice(0, 7);
  const sum = (arr) => arr.reduce((a, e) => a + U.num(e.amt), 0);

  M.register({
    id: 'finance', label: 'Finance', icon: '💷', color: 'var(--gold)', status: 'live', summary: 'Budget · savings goal',
    render(api) {
      const income = api.store.get('income', 0) || 0;
      const goal = api.store.get('goal', 0) || 0;
      const exp = api.store.get('exp_' + month(), []) || [];
      const spent = sum(exp);
      const left = income - spent;
      const rate = income > 0 ? Math.round(left / income * 100) : 0;
      const saved = Math.max(0, left);
      const goalPct = goal > 0 ? Math.round(Math.min(1, saved / goal) * 100) : 0;
      return '<div class="card"><h2>This month</h2>'
        + '<div class="target-grid"><div class="tgt"><b>' + income + '</b><span>income</span></div><div class="tgt"><b>' + spent + '</b><span>spent</span></div><div class="tgt"><b>' + left + '</b><span>left</span></div><div class="tgt"><b>' + rate + '%</b><span>savings rate</span></div></div></div>'
        + '<div class="card"><h2>Monthly income</h2><div class="inp-row"><input class="inp" id="fin_income" type="number" inputmode="decimal" placeholder="e.g. 2500" value="' + (income || '') + '"><button class="btn btn-ghost" data-action="mod-act" data-do="income">Set</button></div></div>'
        + '<div class="card"><h2>Add expense</h2><div class="inp-row"><select class="inp" id="fin_cat">' + CATS.map(c => '<option>' + c + '</option>').join('') + '</select><input class="inp" id="fin_amt" type="number" inputmode="decimal" placeholder="amount"></div><button class="btn btn-primary" data-action="mod-act" data-do="expense" style="width:100%;margin-top:10px">Add</button>'
        + (exp.length ? '<div style="margin-top:12px">' + exp.slice(-8).reverse().map(e => '<div class="stat-row"><div class="t"><b>' + esc(e.cat) + '</b></div><div class="v">' + U.num(e.amt) + '</div></div>').join('') + '</div><button class="reset" data-action="mod-act" data-do="clear">Clear month</button>' : '') + '</div>'
        + '<div class="card"><h2>Savings goal</h2><div class="inp-row"><input class="inp" id="fin_goal" type="number" inputmode="decimal" placeholder="goal amount" value="' + (goal || '') + '"><button class="btn btn-ghost" data-action="mod-act" data-do="goal">Set</button></div>'
        + (goal > 0 ? '<div class="xpbar" style="margin-top:12px"><i style="width:' + goalPct + '%;background:var(--grad-gold)"></i></div><p class="sub" style="margin-top:8px">' + saved + ' / ' + goal + ' saved (' + goalPct + '%)</p>' : '') + '</div>';
    },
    onAction(act, el, api) {
      const g = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
      if (act === 'income') api.store.set('income', U.num(g('fin_income')));
      else if (act === 'goal') api.store.set('goal', U.num(g('fin_goal')));
      else if (act === 'expense') { const amt = U.num(g('fin_amt')); if (amt > 0) { const key = 'exp_' + month(); const arr = (api.store.get(key, []) || []).slice(); arr.push({ cat: g('fin_cat') || 'Other', amt, ts: Date.now() }); api.store.set(key, arr); } }
      else if (act === 'clear') api.store.set('exp_' + month(), []);
      api.refresh();
    }
  });
})(window.LifeOS = window.LifeOS || {});
