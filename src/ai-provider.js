/* ============================================================
   ai-provider.js  ->  LifeOS.AI
   Provider-agnostic coach layer. The app only ever calls
   AI.chat()/morningBrief()/eveningReview(); the brain is swappable:
     - LocalRuleProvider  (offline, private, DEFAULT)
     - RemoteProvider     (template for Claude/OpenAI/Gemini; opt-in)
   chat() returns { text, actions? } so the coach can adjust the
   plan (navigate/suggest) rather than judge.
   ============================================================ */
(function (NS) {
  'use strict';

  function lowestScore(scores) {
    if (!scores) return null;
    const e = [['hydration', scores.hydration], ['nutrition', scores.nutrition], ['movement', scores.movement], ['recovery', scores.recovery]].filter(x => x[1]);
    e.sort((a, b) => a[1].value - b[1].value);
    return e[0] ? { key: e[0][0], v: e[0][1].value } : null;
  }
  const NUDGE = {
    hydration: 'sip a glass now and keep one in sight — small sips, no chugging.',
    nutrition: 'lock in your protein at the next meal; that is the lever that matters.',
    movement: 'even 10 minutes on the elliptical counts — start, and momentum follows.',
    recovery: 'protect tonight’s sleep: screens down early, room cool. Recovery is where you grow.'
  };

  /* intent → supportive, plan-aware reply (+ optional actions) */
  const INTENTS = [
    { re: /tired|exhausted|no energy|drained|knackered/, r: (c) => ({
      text: `Honour it — tiredness is information, not weakness. Today, do the 10-minute version: a gentle Zone-2 walk or a short elliptical spin, hydrate well, and get to bed early. ${c.fasting ? 'On a fast day especially, keep it light. ' : ''}Rest is part of the plan.`,
      actions: [{ label: 'Open Move (easy option)', tab: 'move' }] }) },
    { re: /pizza|cheat|ate too much|overate|binge|junk|takeaway|mcdonald|kfc|chocolate|dessert/, r: () => ({
      text: 'One meal never breaks your progress — guilt does. Nothing to undo: no skipping meals, no punishing workout. Just return to your next planned meal, get your protein and water in, and take a 10-minute walk. Onward.',
      actions: [{ label: 'See my next meal', tab: 'meals' }] }) },
    { re: /skin|oily|greasy|breakout|acne|pimple|spot/, r: () => ({
      text: 'Don’t over-strip — harsh scrubbing rebounds into more oil. Stick to your gentle cleanse, niacinamide, and never skip SPF in the morning. Consistency beats intensity here.',
      actions: [{ label: 'Open my skincare', tab: 'care' }] }) },
    { re: /missed|skipped|didn.?t (work ?out|train|exercise)|no gym/, r: () => ({
      text: 'No spiral. Missing once is data, not identity — the rule is simply never miss twice. Your next session is the one that counts; even a short one keeps the chain alive.',
      actions: [{ label: 'Open today’s workout', tab: 'move' }] }) },
    { re: /stress|anxious|overwhelm|panic|tense/, r: () => ({
      text: 'Pause. Try a physiological sigh: two inhales through the nose, one long exhale through the mouth, five rounds (Huberman). Salah is a built-in reset too. You don’t have to carry it all at once — "Allah does not burden a soul beyond what it can bear."' }) },
    { re: /sad|down|depress|demotivat|unmotivat|giving up|give up|hopeless|worthless/, r: (c) => ({
      text: `Motivation comes and goes — that’s exactly why we built systems, so you don’t rely on it. You’re ${c.streak} day${c.streak === 1 ? '' : 's'} in and Level ${c.level && c.level.level ? c.level.level : 1}; that’s real. Do one small thing now — a glass of water, five minutes of movement. Identity is built one vote at a time.` }) },
    { re: /craving|hungry|sugar|snack|want to eat/, r: () => ({
      text: 'First, water and 10 minutes — cravings often fade. If you’re truly hungry, reach for protein (eggs, yogurt, chana) rather than sugar; it satisfies and steadies you. A little dark chocolate or fruit is a fine planned treat.',
      actions: [{ label: 'Snack ideas', tab: 'meals' }] }) },
    { re: /sore|ache|pain|hurts|injur|stiff/, r: () => ({
      text: 'Soreness is normal 24–48h after training — move gently, hydrate, get protein and sleep. But sharp or joint pain is a stop sign: rest it and see a professional if it persists. Never train through sharp pain.' }) },
    { re: /can.?t sleep|insomnia|awake|sleepless/, r: () => ({
      text: 'Tonight: dim lights and screens off 30–60 min before bed, keep the room cool, and no caffeine after midday going forward (Walker). If your mind races, try slow breathing or dhikr. Consistent sleep/wake times matter more than any single night.' }) },
    { re: /sick|ill|unwell|flu|cold|fever|nause|vomit/, r: () => ({
      text: 'Rest, fluids, and don’t push training while you’re unwell — recovery is the priority. Sip water with a little salt and lemon if plain water is hard. If symptoms are severe or persistent, please see a doctor.' }) },
    { re: /water|thirsty|dehydrat|drink/, r: () => ({
      text: 'Sip small amounts every 15–20 minutes rather than forcing big glasses — that’s what stops the nausea. A pinch of salt + lemon or an electrolyte sachet helps it go down and absorb. Water-rich foods count too.',
      actions: [{ label: 'Hydration plan', tab: 'care' }] }) },
    { re: /thank|great|awesome|smashed|crushed|did it|feeling good|proud/, r: () => ({
      text: 'That’s the man you’re becoming — showing up. Bank the win, notice how it feels, and let it fuel tomorrow. Alhamdulillah.' }) }
  ];

  const LocalRuleProvider = {
    id: 'local', label: 'Local coach (offline)', remote: false,
    async chat(message, ctx = {}) {
      const m = String(message || '').toLowerCase();
      const hit = INTENTS.find(i => i.re.test(m));
      if (hit) return Object.assign({ meta: { provider: 'local' } }, hit.r(ctx));
      const low = lowestScore(ctx.scores);
      const tail = low && low.v < 70 ? ` If you want one focus: your ${low.key} — ${NUDGE[low.key]}` : '';
      return { text: `I hear you.${tail} Tell me what’s going on — what you ate, how you feel, a slip — and I’ll give you the next step, no judgement.`, meta: { provider: 'local' } };
    },
    async morningBrief(ctx = {}) {
      const name = (ctx.profile && ctx.profile.name) || 'friend';
      const low = lowestScore(ctx.scores);
      const q = (NS.Quotes && NS.Quotes.ofDay()) || null;
      let line = `Assalamu alaikum, ${name}. `;
      if (ctx.fasting) line += 'Today is a fast — steady suhoor, gentle iftar. ';
      if (ctx.mission && ctx.mission.title) line += `Focus: ${ctx.mission.title}. `;
      line += (low && low.v < 70) ? `Your ${low.key} needs attention — ${NUDGE[low.key]}` : 'You’re on track — protect the streak.';
      return { text: line.trim(), quote: q, meta: { provider: 'local' } };
    },
    async eveningReview(ctx = {}) {
      const s = ctx.scores || {}; const h = s.health ? s.health.value : 0;
      let text = h >= 70 ? 'Strong day — this is what consistency looks like. ' : h >= 45 ? 'A solid effort. Tomorrow, win one more ring. ' : 'Every day logged is a vote for the man you’re becoming. Reset and go again. ';
      if (ctx.log && !ctx.log.skinPM) text += 'Before bed: your PM skincare, then screens down. ';
      return { text: text.trim(), quote: (NS.Quotes && NS.Quotes.ofDay()) || null, meta: { provider: 'local' } };
    }
  };

  function makeRemoteProvider({ id, label, endpoint, buildRequest, parseResponse }) {
    return {
      id, label, remote: true,
      async chat(message, context = {}) {
        if (!NS.Store || !NS.Store.get('consent.aiRemote', false)) throw new Error('Remote AI is off. Enable it in settings to use ' + label + '.');
        const res = await fetch(endpoint, buildRequest(message, context));
        if (!res.ok) throw new Error('AI request failed: ' + res.status);
        return parseResponse(await res.json());
      }
    };
  }

  const providers = {}; let currentId = 'local';
  const AI = {
    register(p) { providers[p.id] = p; return p; },
    use(id) { if (providers[id]) currentId = id; return currentId; },
    current() { return providers[currentId]; },
    get providerId() { return currentId; },
    list() { return Object.values(providers).map(p => ({ id: p.id, label: p.label, remote: p.remote })); },
    async chat(message, context) { return this.current().chat(message, context); },
    async morningBrief(context) { const p = this.current(); return p.morningBrief ? p.morningBrief(context) : p.chat('morning brief', context); },
    async eveningReview(context) { const p = this.current(); return p.eveningReview ? p.eveningReview(context) : p.chat('evening review', context); },
    makeRemoteProvider
  };
  AI.register(LocalRuleProvider); AI.use('local');
  NS.AI = AI;
})(window.LifeOS = window.LifeOS || {});
