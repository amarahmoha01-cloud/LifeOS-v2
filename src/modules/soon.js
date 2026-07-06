/* modules/soon.js — registered-but-upcoming Life modules. Proves the roster
   handles live + planned domains identically. Self-register. */
(function (NS) {
  'use strict';
  const M = NS.Modules, esc = NS.Utils.esc;
  const SOON = [
    { id: 'learning', label: 'Learning', icon: '📚', color: 'var(--cyan)', summary: 'Courses · reading · skills', plans: ['Track courses & books', 'Reading streak & notes', 'Skill goals with milestones'] },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧', color: 'var(--rose)', summary: 'Events · gifts · memories', plans: ['Birthdays & occasions', 'Gift ideas & reminders', 'Shared memories timeline'] },
    { id: 'travel', label: 'Travel', icon: '✈️', color: 'var(--teal)', summary: 'Trips · packing · budgets', plans: ['Trip planner & itinerary', 'Packing checklists', 'Travel budget tracker'] }
  ];
  SOON.forEach(s => M.register({
    id: s.id, label: s.label, icon: s.icon, color: s.color, status: 'soon', summary: s.summary,
    render() {
      return '<div class="card" style="text-align:center;padding:30px 18px"><div style="font-size:44px">' + s.icon + '</div>'
        + '<h2 style="margin:10px 0 4px">' + esc(s.label) + ' — coming soon</h2><p class="sub" style="margin:0 auto;max-width:38ch">This domain plugs into LifeOS with zero changes to your health data. Planned:</p></div>'
        + '<div class="card">' + s.plans.map(p => '<div class="wtip"><div class="i">✨</div><div><p style="margin:0;color:var(--txt-dim);font-size:13px">' + esc(p) + '</p></div></div>').join('') + '</div>';
    },
    onAction() {}
  }));
})(window.LifeOS = window.LifeOS || {});
