# Architecture Review — Deepening Opportunities (2026-05-28)

## Candidate 1: FishingLoop — mixed player/bot state machine

**Files:** `src/lib/game/loop.ts`

**Problem:** The `FishingLoop` class (513 lines) bakes the player and bot state machines into a single class, gated by an `isBot` constructor flag. Every method (`tick()`, `strike()`, `reel()`, `enterChanging()`) branches on `isBot`. The interface is complex because a caller must understand both paths. The `tick()` method alone is ~150 lines with deeply nested `if/else` trees.

**Solution:** Extract a separate decision adapter. The FishingLoop becomes a clean phase-machine. Player decisions come from user input; bot decisions come from skill-based timers. A `DecisionStrategy` interface sits at the seam.

**Benefits:** Locality for bot-specific bugs (missed strike windows, tackle change counters). Tests for the player path no longer need `isBot=true` variants. The bot path gets a seam where alternative AI strategies (different difficulty curves, event-driven bots for multiplayer) slot in without touching the state machine.

---

## Candidate 2: GameState/PrepState — split responsibility for the same lifecycle

**Files:** `src/lib/game/prep-state.svelte.ts`, `src/lib/game/state.svelte.ts`

**Problem:** Two reactive singletons split the fishing lifecycle across a handoff boundary. `PrepState` owns `anglers` through prep; `GameState` takes ownership at `beginFishing()`. Both define `AnglerState`. The game page and results page must import both. No single module owns the full lifecycle.

**Solution:** Merge into a single Session module that owns the full lifecycle: prep setup → draw → fishing runtime → results. Prep flow sets fields on it directly; no handoff, no duplicate `AnglerState`.

**Benefits:** Eliminates the handoff seam. Single import for routes. Tests write against one module instead of two.

---

## Candidate 3: SpeciesCaution — behaviour data split across modules

**Files:** `src/lib/game/loop.ts` (lines 189-203), `src/lib/data/species.ts`

**Problem:** Species caution values are hardcoded on `FishingLoop`, duplicating species data already in `species.ts`. Adding a new species requires editing two files.

**Solution:** Add `cautionMs` to the `Species` type in `types.ts` and populate it in `species.ts`.

**Benefits:** Locality — all species behavioural data in one place. Single-file change for new species.

---

## Candidate 4: Duplicated weight formatting

**Files:** `src/routes/game/+page.svelte`, `src/routes/results/+page.svelte`, `src/lib/components/DebugPanel.svelte`

**Problem:** `formatWeight()` defined identically in 3+ places and passed as a prop to Leaderboard.

**Solution:** Move to `$lib/utils/format.ts`.

**Benefits:** Trivial — one definition, one test, importable everywhere.

---

## Candidate 5: tackle-utils depends on population — domain crossing

**Files:** `src/lib/game/tackle-utils.ts`, `src/lib/game/population.ts`

**Problem:** `tackle-utils.ts` imports `passesTolerances`, `fishMatchScore`, `weightedSelectIndex` from `population.ts`. Tackle selection and fish population are conceptually separate domains.

**Solution:** Extract shared pure functions (`fishMatchScore`, `passesTolerances`, `weightedSelectIndex`) to `$lib/game/scoring.ts` or pass them as dependencies.

**Benefits:** Clearer domain boundaries. Each module can be tested and deleted independently.
