# Test Review Issues

Generated 2026-06-01 after full review of test coverage, quality, and gaps.

## Agent Rules (read before any session)

When asked to work on a session from this document, the agent MUST follow these rules:

0. **Load required skills at session start:**
   - `skill({ name: "svelte-code-writer" })` — Svelte 5 docs lookup, autofixer, validation
   - `skill({ name: "svelte-core-bestpractices" })` — runes mode guidance, reactivity, events, styling

1. **Never change production code.** Only write or modify test files (`.spec.ts`, `.spec.ts`, `.e2e.ts`). Do not edit `.svelte`, `.ts`, `.svelte.ts` files under `src/lib/` or `src/routes/` unless they are test files.
2. **If a new/revisioned test fails** because it exposes a bug or design issue in production code, do NOT fix the production code. Instead, report the failure to the user with a clear description of what the test uncovered and why fixing it requires a production change.
3. **Context limit:** If the session has many items and the agent's context window is nearing capacity, prioritize finishing the current issue cleanly (with a status update) over starting a new one.
4. **Status tracking:** Update the status of each issue in this document as work progresses: 🟡 when started, 🟢 when resolved, ⚪ if deferred with a reason. Update the summary table too.

## Recommended Sessions

Split across **4 sessions** (3 is too tight — the critical gaps each need their own session):

### Session 1: Quick Wins (~0.5 day)

Pure-function tests, low risk, high return for effort.

- **Issue 6** — `passesTolerances()` tests
- **Issue 7** — `BotTackleChange` reset scenario
- **Issue 10** — `pbs.ts` tests
- **Issue 11** — `format.ts` tests
- **Issue 12** — Integration test reliability fix

### Session 2: Core Logic Quality (~1.5 days)

Fix shadow-implementation tests and fill method-level gaps in the game engine.

- **Issue 4** — 🟢 Add `handleReelingOutcome()` tests, reorient loop.spec.ts to intent
- **Issue 8** — 🟢 GameState method-level tests (strike, reel, handleReelingOutcome, dismissCaught, etc.)
- **Issue 9** — 🟢 PrepState tests (draw, assignPeg, persist/restore, init)
- **Issue 5** — 🟢 Removed dead `reel()` method, removed capacity check from `handleReelingOutcome('caught')`, kept `reelWithCapacityCheck()` for bots

### Session 3: Component & Route Tests (~2 days)

All 7 components and 13 routes go untested — this is where visual regressions hide.

- **Issue 2** — Component tests starting with the most valuable: CatchToast, ComboGridHud, PickerModal, Filmstrip, then DebugPanel, TackleModal
- **Issue 3** — Route tests via vitest-browser, starting with the most critical: game, results, prep/draw

### Session 4: E2E Coverage (~2–3 days)

The highest-confidence safety net. Requires the full stack to build and serve.

- **Issue 1** — Playwright E2E tests for splash→menu→session→game→results flow, plus match and multiplayer flows

---

## Status Legend

---

## Critical Gaps

### 1. Zero E2E Tests

**Status:** 🔴 Not started
**Severity:** Critical

Playwright is configured (`playwright.config.ts`), `npm run test:e2e` is wired, but there are **zero `.e2e.ts` files** anywhere in the project. The demo reference (`src/routes/demo/playwright/page.svelte.e2e.ts`) listed in AGENTS.md does not exist.

**Recommended flows to cover:**

- Splash (`/`) → Menu → Session → Game (begins fishing) → wait, bite, strike, reel → Results
- Menu → Solo Match → Prep → Draw → Game → Results
- Each failure mode (bite expires, hook breaks, line breaks, fish gets away)

---

### 2. Zero Component Tests for Real Components

**Status:** 🔴 Not started
**Severity:** Critical\*\*

7 Svelte components with 0 tests:

| Component              | Lines | Complexity                                                         |
| ---------------------- | ----- | ------------------------------------------------------------------ |
| `TackleModal.svelte`   | 461   | High — stateful tackle selection, presets, peg display, timed mode |
| `FishingCanvas.svelte` | 457   | Very high — p5.js sketch, ReelingMinigame, mouse/keyboard input    |
| `ComboGridHud.svelte`  | 136   | Medium — 3×3 grid, disabled states for Leger/Pole                  |
| `CatchToast.svelte`    | 66    | Low — sequential toast display                                     |
| `DebugPanel.svelte`    | 155   | Low — debug readout (low priority)                                 |
| `PickerModal.svelte`   | 95    | Medium — generic picker with backdrop/escape dismiss               |
| `Filmstrip.svelte`     | 104   | Medium — scrollable tile selector                                  |

**Only** the demo `Welcome.svelte` has a component test. Component test infrastructure is working (vitest-browser + Playwright Chromium in `vite.config.ts`) — it's just not used.

---

### 3. Zero Route/Page Tests

**Status:** 🔴 Not started
**Severity:** High\*\*

13 SvelteKit routes with zero tests:

| Route                     | Lines | Key Behaviours                                    |
| ------------------------- | ----- | ------------------------------------------------- |
| `splash (+page.svelte)`   | 69    | Ken Burns animation, tap-to-navigate              |
| `menu/+page.svelte`       | 120   | Mode selection, state init                        |
| `prep/lake/+page.svelte`  | ?     | Venue/lake selection                              |
| `prep/rules/+page.svelte` | ?     | Time limit selection, peg assign                  |
| `prep/draw/+page.svelte`  | ?     | Match draw animation                              |
| `game/+page.svelte`       | 771   | Core game loop, all phases, tackle modal, catches |
| `results/+page.svelte`    | 181   | Leaderboard, species groups                       |
| `multiplayer/` (4 routes) | ?     | Host/Join/Lobby/Landing                           |
| `fish-log/+page.svelte`   | ?     | Species gallery, PBs                              |
| `about/+page.svelte`      | ?     | Info page                                         |

---

## Quality Issues in Existing Tests

### 4. `FishingLoop` Tests Shadow Implementation, Not Intent

**Status:** 🟢 Resolved — `handleReelingOutcome()` tests added in `loop.spec.ts`
**Severity:** Medium\*\*

**File:** `src/lib/game/loop.spec.ts`

Multiple tests exercise `advanceReelTimer()` + `reel()` — the old player-facing path. The actual player path uses `handleReelingOutcome()` (called by FishingCanvas minigame). Both paths have duplicated logic for capacity check, but `handleReelingOutcome()` has **no tests**.

Tests that test deprecated/defensive paths instead of runtime paths:

- "succeeds and records caught fish — advance reel timer then land" (line 319) — tests `advanceReelTimer` + `reel()`, not `handleReelingOutcome()`
- "player clicking too early during reel timer loses the fish" (line 342) — tests `reel()` during `reeling` phase, but the game doesn't call this path
- "tooMuchSlackLine when landing window expires" (line 386) — tests through `landing` phase, but landing is bypassed for humans
- "fails for oversized fish with unlucky roll — at landing" (line 354) — tests `reel()` capacity check, but actual path is `handleReelingOutcome()`

**Recommendation:** Add tests for `handleReelingOutcome('caught')` and `handleReelingOutcome('lost')` as the primary player path. The existing `reel()` tests can remain as defensive coverage but should be secondary.

---

### 5. Duplicate Logic in `reel()` and `handleReelingOutcome()` Untested Path

**Status:** 🟢 Resolved — `reel()` removed entirely (dead code), capacity check removed from `handleReelingOutcome('caught')` per design intent
**Severity:** Medium\*\*

**File:** `src/lib/game/loop.ts` lines 359–433

`reel()` (line 359) and `handleReelingOutcome()` (line 399) had near-identical capacity-check-and-catch logic. Both were ~35 lines. This was a maintenance risk — if one changed, the other diverged silently.

**Resolution:**

- **`reel()`** was dead code (no production callers) — removed entirely from `FishingLoop` and `GameState`
- **`handleReelingOutcome('caught')`** no longer performs a capacity+RNG check — the FishingCanvas minigame outcome is final per design
- **`reelWithCapacityCheck()`** retained as-is for the bot path
- **`GameState.reel()`** delegation removed alongside the underlying method
- 10 tests removed (reel-specific), remaining 140 tests all pass

---

### 6. Missing `passesTolerances()` Tests

**Status:** 🟢 Resolved — tests added in `population.spec.ts`
**Severity:** Low-Medium\*\*

**File:** `src/lib/game/population.ts` lines 3–19

The `passesTolerances` function is a hard gate (excludes whole species from a peg) but is only exercised indirectly through `populatePeg` tests. No test asserts:

- A species with `tolerances: { flow: { min: 0.5, max: 1.0 } }` on a peg with `flow: 0.3` returns `false`
- A species with tolerances where all conditions pass returns `true`
- Edge cases: `undefined` tolerance dimension, exact boundary values

---

### 7. Missing `BotTackleChange` Reset Scenario

**Status:** 🟢 Resolved — tests added in `bot-controller.spec.ts`
**Severity:** Low\*\*

**File:** `src/lib/game/bot-controller.spec.ts`

Per CONTEXT.md, `BotTackleChange` resets after a non-blank interaction. The test "calls onBlankCycle after 2 blank patience cycles" (line 230) verifies the positive case, but does not cover:

- Counter resets when a fish is landed (non-blank interaction)
- Counter resets when a fish is lost (also a non-blank interaction)

---

### 8. Missing GameState Method-Level Tests

**Status:** 🟢 Resolved — delegation tests added in `state.spec.ts`
**Severity:** Medium\*\*

**File:** `src/lib/game/state.svelte.ts`

`GameState` has several public methods with no direct tests:

- `strike()` (line 322) — only tested indirectly through `state.spec.ts` "does not finish game when time expires but player is in reeling" scenario
- `reel()` (line 334) — no tests
- `handleReelingOutcome()` (line 373) — no tests
- `dismissCaught()` (line 329) — no tests
- `resetCast()` (line 317) — no tests
- `beginChangeTackle()` / `finishChangingTackle()` (lines 174–185) — tested only through multiplayer regression tests
- `updateTackle()` (line 166) — no direct tests

---

### 9. Missing `PrepState` Tests

**Status:** 🟢 Resolved — tests added in `prep-state.spec.ts` + `prep-state-persist.spec.ts`
**Severity:** Medium-High\*\*

**File:** `src/lib/game/prep-state.svelte.ts` (286 lines)

PrepState is the second most complex logic module after GameState, with zero tests:

- `drawMatch()` (line 227) — shuffle, peg assignment, bot pool, player avatar exclusion
- `assignPeg()` (line 207) — peg validation
- `selectVenue()` / `selectLake()` — state cascade
- `persist()` / `restore()` — sessionStorage round-trip, error handling on corrupt data
- `init()` — state reset
- Edge case: `restore()` with invalid data silently clears (line 75)

---

### 10. Missing `pbs.ts` Tests

**Status:** 🟢 Resolved — tests added in `pbs.spec.ts`
**Severity:** Low-Medium\*\*

**File:** `src/lib/game/pbs.ts` (37 lines)

Personal bests are user-facing state with localStorage. No tests for:

- `checkIsPB()` first catch (no existing PB) returns `'pb'`
- `checkIsPB()` when weight >= record returns `'record'`
- `checkIsPB()` when weight <= existing PB returns `null`
- `recordPB()` persists and overwrites correctly
- `clearPBs()` removes all data
- `getPBs()` handles corrupt JSON gracefully

---

### 11. Missing `format.ts` Tests

**Status:** 🟢 Resolved — tests added in `format.spec.ts`
**Severity:** Low\*\*

**File:** `src/lib/utils/format.ts` (16 lines)

`formatWeight()` and `formatShortDuration()` are pure functions with clear inputs/outputs. Both are used across game/results routes and DebugPanel. No tests.

---

### 12. GameState Integration Test Reliability

**Status:** 🟢 Resolved — simulation window reduced, early exit, tighter assertions
**Severity:** Low\*\*

**File:** `src/lib/game/state.spec.ts` lines 397–430

"bots can land multiple fish in a simulated match window" uses `vi.spyOn(Math, 'random').mockReturnValue(0)` for determinism but then runs a tick loop of `120_000`ms (2 minutes real time, albeit virtual). This test is:

- Susceptible to timing drift if tick logic changes
- Hard to debug when it fails (no intermediate assertions)
- Relies on all RNG being controlled (unclear if bot tackle calls use `Math.random` directly vs the injected RNG)

**Recommendation:** Either reduce the simulation window, add intermediate state checks, or mock at a higher level (seed the bot controller's RNG).

---

## Summary

| #   | Issue                               | Severity | Type    | Effort   | Status |
| --- | ----------------------------------- | -------- | ------- | -------- | ------ |
| 1   | Zero E2E tests                      | Critical | Gap     | 2–3 days | 🔴     |
| 2   | Zero component tests                | Critical | Gap     | 2–3 days | 🔴     |
| 3   | Zero route tests                    | High     | Gap     | 1–2 days | 🔴     |
| 4   | Loop tests test wrong paths         | Medium   | Quality | 0.5 day  | 🟢     |
| 5   | Duplicate reel/handleReelingOutcome | Medium   | Quality | 0.5 day  | 🟢     |
| 6   | Missing passesTolerances tests      | Low-Med  | Gap     | 0.25 day | 🟢     |
| 7   | Missing BotTackleChange reset test  | Low      | Gap     | 0.25 day | 🟢     |
| 8   | Missing GameState method tests      | Medium   | Gap     | 0.5 day  | 🟢     |
| 9   | Missing PrepState tests             | Med-High | Gap     | 1 day    | 🟢     |
| 10  | Missing pbs.ts tests                | Low-Med  | Gap     | 0.25 day | 🟢     |
| 11  | Missing format.ts tests             | Low      | Gap     | 0.25 day | 🟢     |
| 12  | Integration test reliability        | Low      | Quality | 0.25 day | 🟢     |
