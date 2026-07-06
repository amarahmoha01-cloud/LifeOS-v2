# LifeOS v2 — Personal Life Operating System

A private, offline-first health OS. **All 10 phases complete.** The full product (onboarding → timeline), a hardened self-verifying architecture, and a Life-module platform (Faith, Finance + extensible domains).

## Run it
Double-click `index.html`. No install, no build, no server, no internet.
Everything you enter is stored locally in your browser (`localStorage`), on this device only.

> Best in Chrome, Edge, or Safari. Your data persists between visits automatically.

## The first principle
The app assumes **nothing**. No nutrition, workouts, supplements, skincare, or targets appear
until onboarding is complete. Only then does the engine generate your personalized plan.

## Architecture (why it's many small files)
Built as a real software project with strict separation of concerns, so it can grow to 10+ modules
and later migrate to **React Native** + a **FastAPI** backend without a rewrite.

```
index.html            App shell — declares module load order, single #app mount
assets/
  tokens.css          Design system primitives (colors, type, spacing, motion)
  styles.css          Reset, layout, presentational components
src/
  utils.js   → Utils        Pure helpers (dom, dates, math, validation, image compress, pub/sub)
  store.js   → Store        DATA layer: versioned document, migrations, dot-path get/set, pub/sub.
                            Persistence sits behind a swappable `backend` → drop in FastAPI/AsyncStorage later.
  state.js   → State        In-memory app state + router + pub/sub (ephemeral "where am I")
  engine.js  → Engine       BUSINESS LOGIC: personalized calories/macros/hydration/sleep. Pure & DOM-free.
  ai-provider.js → AI       Provider-agnostic coach interface. LocalRuleProvider now (offline, private);
                            drop-in template for Claude/OpenAI/Gemini/local LLM later (opt-in only).
  schema.js  → Schema       The onboarding interview as DATA (13 sections). UI renders whatever is here.
  components.js → UI        Reusable, presentational field renderers (one per field type)
  onboarding.js → Onboarding  Phase-1 flow controller (autosave, resume, conditional fields, validation)
  app.js     → App          Bootstrap + router + first-principle gate + home surfaces
  data/meals.js → Meals     Meal template library (data): cuisines, allergens, macros
  nutrition.js → Nutrition  Meal-plan generator (portion-scaled, allergy/diet/fasting aware) + timing
  supplements.js → Supplements  Evidence-scored personal stack (bloods/meds/goal/budget aware)
  hydration.js → Hydration  Water strategy for water-aversion
  training.js → Training    Exercise progression from goal/activity/injuries/equipment
```

**Global namespace pattern.** Each file attaches to `window.LifeOS` via an IIFE so it runs from
`file://` with zero build step. Converting each to an ES module (`export`) for React Native / a
bundler is a mechanical one-line change per file — the module boundaries are already correct.

## Data model (localStorage key `lifeos.doc`)
Versioned document with forward-safe migrations:
`profile` · `onboarding` · `consent` · `targets` · `settings` · and reserved `days` · `progress` · `game` · `coach` for later phases.

## Privacy
- No account, no network calls, no analytics.
- Progress photos are compressed and stored locally as data URLs; never uploaded.
- Remote AI is **off** by default (`consent.aiRemote = false`) and gated behind explicit opt-in.

## Health engine (evidence base)
- BMR: Mifflin–St Jeor · TDEE: activity-adjusted
- Protein 1.6–2.2 g/kg (Norton, Schoenfeld, ISSN) · deficit capped & floored (no crash dieting)
- Hydration ~30–35 ml/kg + activity · Sleep 8h target
All outputs are **estimates**, recalculated whenever the profile changes. Not medical advice.

## Roadmap
- ✅ **Phase 1** — Intelligent onboarding + architecture foundation *(this build)*
- ✅ **Phase 2** — Health engine expansion: meal plans, supplement stacks, hydration & training generated from profile
- ✅ **Phase 3** — Adaptive Today dashboard: mission, health/recovery/hydration/nutrition scores, daily logging, skincare engine, coach, prayer rhythm
- ✅ **Phase 4** — Progress Intelligence: measurements + body-fat, offline trend charts, weekly/monthly summaries, photo timeline
- ✅ **Phase 5** — Habit & Discipline Engine: XP, levels + titles, daily/weekly/monthly streaks, achievements, milestones, weekly challenge
- ✅ **Phase 6** — AI Coach: time-aware briefing, evening review, persisted free-text chat with intents + suggested actions, non-judgemental — via the provider-agnostic layer
- ✅ **Phase 7** — Knowledge Center: 36 expandable evidence cards (why / evidence level / guideline support / takeaway), category filters, strong-vs-emerging grouping
- ✅ **Phase 8** — Health Timeline: adherence-based projections at 30d/90d/6mo/1yr/5yr across body, strength, skin, energy, nails & discipline, flagged as estimates
- ✅ **Phase 9** — Architecture hardening: `Core` module registry + runtime health-check, in-app System view, and ARCHITECTURE.md with the RN + FastAPI migration map
- ✅ **Phase 10** — Life modules: a plugin registry + Life hub; Faith & Finance live, Learning/Family/Travel registered — new domains plug in with zero changes to health code

*v1 (`../LifeOS.html`) remains untouched as a fallback.*
