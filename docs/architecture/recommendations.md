# Architecture Review — Deepening Candidates

Generated 3 June 2026. Based on the skill `improve-codebase-architecture`.

## Candidate 1 (Strong): Extract environment-matching seam from `population.ts`

**Files:** `src/lib/game/population.ts`, `src/lib/game/tackle-utils.ts`

**Problem:** `tackle-utils.ts` imports `passesTolerances`, `fishMatchScore`, and `weightedSelectIndex` from the population module — a fish-generation module leaking its internal scoring functions across a seam for an unrelated use case (bot tackle selection).

**Solution:** Extract the three scoring functions into a new `env-utils.ts` module under `src/lib/game/`. Both `population.ts` and `tackle-utils.ts` import from the new seam. No behavioural change.

**Wins:** Locality (env-matching in one place), leverage (one scoring interface, two callers), test surface shrinks in `population.spec.ts`.

---

## Candidate 2 (Strong): Unify duplicated `CaughtFish` type

**Files:** `src/lib/game/loop.ts:4-9`, `src/lib/game/prep-state.svelte.ts:14-19`, `src/lib/game/state.svelte.ts` (manual copy), `src/routes/game/CatchCard.svelte`, `src/lib/components/DebugPanel.svelte`

**Problem:** Identical `CaughtFish` interface defined in two places (`loop.ts` and `prep-state.svelte.ts`). `state.svelte.ts` must manually copy fields between them. Adding a field to one definition without updating the other causes silent breakage.

**Solution:** Define `CaughtFish` once in `src/lib/data/types.ts`. Import it everywhere. Remove the two duplicate definitions.

**Wins:** Locality (type change in one place), leverage (5 consumers from 1 definition).

---

## Candidate 3 (Strong): Extract `MatchTimer` from `GameState`

**Files:** `src/lib/game/state.svelte.ts` (441 lines)

**Problem:** `GameState` bundles four responsibilities: time management (match countdown, weigh-in-early fast-forward), loop orchestration, bot orchestration, and catch audit / reactive state. Cannot test timer logic without instantiating loops and bots.

**Solution:** Extract a `MatchTimer` module under `src/lib/game/match-timer.ts` owning `timeRemainingSeconds`, `timeExpired`, `weighInEarlyActive`, tick deduction logic, and `weighInEarly()`. `GameState` imports it and delegates time operations. GameState's `tick()` calls `matchTimer.tick()` then does orchestration based on the updated state.

**Wins:** Locality (time bugs in one module), leverage (test timer logic in isolation), interface shrinks.

---

## Candidate 4 (Worth exploring): Decompose `game/+page.svelte`

**Files:** `src/routes/game/+page.svelte` (760 lines), `src/routes/game/game-page.svelte.spec.ts` (3 smoke assertions)

**Problem:** Largest component in the project. Handles image loading (5 globs), multiplayer setup, event handling, 3+ overlay states, catch rendering, PB/confetti, debug mode, keyboard input, lifecycle. No locality.

**Solution:** Extract overlay states (CaughtOverlay, LostOverlay, WeighInEarlyOverlay) into separate components. Extract image preloading into a utility. Extract confetti/PB into a utility.

**Wins:** Locality (each concern in its own component), leverage (test each overlay in isolation).

**Caveat:** Page test coverage (3 assertions) is the thinnest of any major file. Decomposition alone doesn't fix coverage, but smaller components are easier to cover.

---

## Candidate 5 (Worth exploring): Eliminate global ID counter from `population.ts`

**Files:** `src/lib/game/population.ts:3` (`let nextId = 0`), `:57` (`resetIds()`)

**Problem:** Module-level mutable state (`let nextId = 0`) creates ordering dependencies. Callers must call `resetIds()` before each population generation. Tests call it in `beforeEach` or risk overlapping IDs. ID sequence is not deterministic.

**Solution:** Make IDs deterministic from input data (e.g. species-index based), or accept a counter parameter, or use UUIDs. Remove `resetIds()` entirely.

**Wins:** Locality (no hidden global state), leverage (callers never need to know about resetIds), test surface (tests are idempotent without beforeEach setup).

---

## Top Recommendation

Start with **Candidate 3 — MatchTimer extraction**. GameState is the most-coupled module in the project (9 importers, 18 public methods, 4 responsibilities). Extracting time management gives an independently testable module and shrinks GameState's surface before multiplayer lands. It also creates a clear seam for multiplayer time sync — a real second adapter.
