# LifeOS — Architecture

LifeOS is a private, offline-first health OS built as a layered, modular front-end with **strict separation of concerns**. Every module is a self-contained IIFE that attaches one namespaced object to `window.LifeOS` and exposes a single public API. There is no build step: it runs from `file://` by double-clicking `index.html`, yet every boundary is drawn so it ports cleanly to **React Native** (view layer) and a **FastAPI** backend (storage/sync).

A runtime **registry + health-check** (`LifeOS.Core`) declares the public API surface of every module and verifies it on demand (see the in-app **You → System** screen). If a module fails to load or its API drifts, the check flags it before it reaches the user.

## Layers (dependencies point downward only)

```
  UI / Bootstrap      app.js · dashboard.js · onboarding.js · components.js(UI) · charts.js
        │
  AI / Coach          ai-provider.js(AI) · coach.js
        │
  Business / Engines  engine · nutrition · supplements · hydration · training ·
        │             scoring · skincare · progress · game · timeline · log
        │
  State               state.js
        │
  Data / Storage      store.js · schema.js · data/meals · data/quotes · data/knowledge
        │
  Utilities           utils.js   (pure, depends on nothing)
```

Rule: a module may only use modules **below** it. UI never holds business logic; engines never touch the DOM; storage is the only thing that persists.

## Modules & public contracts

| Module | Layer | Responsibility | Key public API |
|---|---|---|---|
| `Utils` | Utilities | Pure helpers: dom, dates, math, validation, image compression, pub/sub factory | `esc, clamp, todayKey, emitter, getPath, setPath, compressImage` |
| `Store` | Data · Storage | The one persisted document; versioned schema, migrations, dot-path get/set, pub/sub. Backend is swappable. | `load, get, set, patch, reset, subscribe, setBackend, flush` |
| `State` | State | Ephemeral app state + router + pub/sub | `go, refresh, subscribe` |
| `Engine` | Business · Health | BMR/TDEE/deficit/macros/hydration/sleep from a profile | `computeTargets, bmr, tdee, bmi, headline` |
| `Meals` | Data | Halal meal-template library (macros + allergen tags) | `TEMPLATES` |
| `Nutrition` | Business · Health | Portion-scaled meal-plan generator + timing | `buildDay, weekPlan, timing, plan` |
| `Supplements` | Business · Health | Evidence-scored personal stack | `recommend` |
| `Hydration` | Business · Health | Water strategy (aversion-aware) | `strategy` |
| `Training` | Business · Health | Progression from goal/equipment/injuries | `program` |
| `Quotes` | Data | Motivation (books + Qur'an/hadith) | `ALL, ofDay, random` |
| `Scoring` | Business · Health | Health/recovery/hydration/nutrition/movement scores | `all, health, recovery, hydration, nutrition, movement` |
| `Skincare` | Business · Health | AM/PM routine from skin type/concerns/budget | `routine` |
| `Log` | Business · Data | Per-day logging over `Store.days` + streak | `day, get, set, addWater, toggleMeal, toggle, streak` |
| `Charts` | UI · Viz | Offline SVG line/bar/sparkline (no CDN) | `line, bars, spark` |
| `Progress` | Business · Analytics | Measurements, body-fat (Navy), series, weekly/monthly summaries, photo timeline | `measurements, addMeasurement, navyBodyFat, summary, weightSeries, scoreSeries, photoTimeline` |
| `Game` | Business · Gamification | XP, levels, streaks, achievements, milestones | `totalXP, levelFor, dailyStreak, weeklyStreak, monthlyStreak, achievements, milestones, isActive` |
| `AI` | AI · Provider | Provider-agnostic coach interface (local now, remote-ready) | `chat, morningBrief, eveningReview, register, use, current, makeRemoteProvider` |
| `Coach` | Business · AI | Assembles context, keeps the thread, orchestrates AI | `context, thread, pushMsg, send, briefing, clear` |
| `Knowledge` | Data | Evidence base (why/level/guideline/takeaway) | `ENTRIES, categories` |
| `Timeline` | Business · Analytics | Adherence-based 30d→5yr projections | `project, HORIZONS` |
| `Schema` | Data | Onboarding interview as data (13 sections) | `SECTIONS, REQUIRED` |
| `UI` | UI · Components | Reusable presentational field renderers | `field, progress, dots, sectionHead` |
| `Onboarding` | UI · Flow | Onboarding controller (autosave, resume, validation) | `mount, render, finalize` |
| `Dashboard` | UI · View | The adaptive Today screen | `html, afterMount, ctx` |
| `App` | UI · Bootstrap | Router, nav shell, all screens, event delegation | `boot, renderRoute, shellHTML` |
| `Core` | Meta | Module registry + health-check + storage stats | `check, storage, MODULES, layers` |

## The three seams that make it portable

1. **Storage seam — `Store.setBackend()`.** All persistence goes through a `{read, write, clear}` backend. Today it's `localStorage`; swap in a FastAPI adapter (or React Native `AsyncStorage`) without touching any other file. The document is versioned (`__version`) with a forward-safe `migrate()`.
2. **AI seam — `AI.register()/use()` + `makeRemoteProvider()`.** The app only calls `AI.chat/morningBrief/eveningReview`. The local rule-based provider answers today; a Claude/OpenAI/Gemini provider drops in behind the same interface, gated by `consent.aiRemote`.
3. **View seam — pure logic vs. rendering.** Every engine is DOM-free and returns plain data/strings; only the UI layer (`app.js`, `dashboard.js`, `onboarding.js`, `components.js`) touches the DOM.

## Migration → React Native

- **Keep as-is (pure, portable):** `Utils` (minus the DOM/canvas helpers), `Engine, Nutrition, Supplements, Hydration, Training, Scoring, Skincare, Progress, Game, Timeline, Coach`, and all `data/*` + `Schema`. Convert each IIFE to an ES module: replace `(function(NS){…})(window.LifeOS)` with `export const X = …`.
- **Reimplement per-platform:** the UI layer. `app.js`/`dashboard.js`/`onboarding.js` HTML-string views become RN components; `components.js` field renderers become RN inputs; `Charts` SVG strings become `react-native-svg`.
- **Swap the backend:** `Store.setBackend(AsyncStorageBackend)`. `Utils.compressImage` → `expo-image-manipulator`.
- **State/router:** `State` maps to a small store (Zustand/Context) + React Navigation.

## Migration → FastAPI backend (optional sync)

- Add a `RemoteBackend` implementing `{read, write}` that GET/PUTs the JSON document to `/api/doc` for the signed-in user; register via `Store.setBackend`. Keep localStorage as an offline cache and reconcile on `flush()`.
- The document shape is already a clean aggregate; each top-level key (`profile, days, progress, game, coach, targets`) can become a table/collection later without changing the client contract.
- Remote AI: implement `makeRemoteProvider({endpoint, buildRequest, parseResponse})` pointing at a FastAPI `/api/coach` route that proxies the LLM (keeps keys server-side).

## Adding a module (and Phase 10 life modules)

New capability = a new IIFE that attaches `LifeOS.X`, plus one entry in `Core.MODULES`. Because onboarding, knowledge and meals are **data-driven**, whole domains (Finance, Learning, Faith, Family, Travel) are added as: a data schema + a pure engine + a view + a nav entry — with **zero changes** to the health modules. That is the Phase 10 extension path.

## Privacy & data

No account, no network, no analytics. The entire state lives in one `localStorage` document on the device. Progress photos are compressed to data URLs locally and never uploaded. Remote AI is off by default.

*Estimates throughout are educational, not medical advice.*
