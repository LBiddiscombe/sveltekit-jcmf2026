# JCMF Remake

A web-based remake of the 1980s ZX Spectrum game "Jack Charlton's Match Fishing" — a match fishing simulation combining patience, skill, and the joy of landing a fish.

## Language

**Venue**:
A location with one or more fishing lakes. Each venue has an `image` (filename in `$lib/assets/images/venues/`) for display on the venue picker.
_Avoid_: Location, site

**Lake**:
A body of water within a venue, containing multiple pegs. Each lake defines which species inhabit it and their relative abundance (`frequency`).

**LakeSpecies**:
A species name and its abundance frequency within a specific lake, defined on the lake's `species` array.

**Frequency**:
A relative abundance weight (higher = more common) assigned to each species per-lake. Used when generating fish populations — species with higher frequency produce more individual fish in that lake.
_Avoid_: Global abundance, population density

**Peg**:
A fishing spot around a lake accommodating zero or one angler. Each peg has a single set of environmental features (no zone subdivision in the initial build).

**EnvironmentalFeatures**:
A set of five water condition ratings (flow, clarity, substrate, vegetation, shelter) on a 0–1 scale, describing a peg's character.
_Avoid_: Characteristics, water properties

**EnvironmentalTolerances**:
Per-species min/max ranges for any subset of environmental dimensions. If a peg's feature value falls outside a species' tolerance for that dimension, the species is **excluded entirely** from that peg (hard gate). Dimensions without a tolerance defined are never dealbreakers — the continuous match scoring handles relative desirability.

**Species**:
A type of fish (e.g. Carp, Roach, Tench). Each species has a record weight, preferred strata, preferred environmental features, and size classifications. Abundance is defined per-lake via `LakeSpecies.frequency`.

**FishClassification**:
A size tier within a species with an `id` (`small`, `medium`, `specimen`, `monster`), a `label` (display name, blank for medium), a `maxOz` weight cap, and a list of preferred baits. The `id` is the canonical reference; the `label` may be species-specific (e.g. "Skimmer" for Bream small tier, "Jack" for Pike small tier). The medium tier deliberately has a blank label so it reads naturally in catch messages: "Small Carp", "Carp", "Specimen Carp", "Monster Carp".
_Avoid_: SpeciesClass

**Fish**:
A single instance of a fish of a given species and classification with a specific weight.

**Bait**:
A substance used on a hook to attract and catch fish.

**Tackle**:
The equipment an angler uses to fish — rod, reel, line, and hook. Each piece has a **deterrence** (`deter`) value: heavier/stronger tackle puts fish off (longer bite times) but can handle bigger fish during the reel.

**Deterrence**:
A numeric property on each tackle component. Higher values increase the maximum possible bite wait time (fish are more cautious around heavy tackle) but enable reeling larger fish. Each component's deterrence contributes independently to the total sum used in the BiteTime formula. Scaled by ×50,000 — a total deterrence of 1.4 adds up to 70s to the wait ceiling.

**RodMultiplier**:
A per-rod numeric property controlling mechanical advantage in the **ReelingMinigame**. Higher values reduce tension for a given pull force (easier reeling). Leger: 1.5 (easiest), Float: 1.0 (balanced), Pole: 0.5 (hardest). The tension formula is `(pull × fishPull × stamina × weight) / (tackleStrength × rodMultiplier)`.

**Session**:
A solo fishing outing — unlimited time, no bots, no competition. Pure fishing. Flows through Prep (player picks a peg manually, no time/bot options) → Game → Results.
_Avoid_: Practice, free play

**Solo Match**:
A competitive fishing session with a time limit and bots filling every other peg. Winner is determined by total catch weight. The timer starts when the game page mounts — tackle selection (the `changing` phase) counts against match time. Bots receive a skill-based tackle setup delay (3–10s range, same formula as BotStrikeDelay). Flows through Prep (player sets time, peg draw) → Start Match (timer begins) → Game (tackle modal, timer ticks throughout) → Results.
_Avoid_: Multiplayer, Party

**Multiplayer**:
A competitive fishing session with a time limit played by human opponents over the network, using PartyKit for realtime coordination. No bots. Up to 8 players (matching the number of pegs). A player hosts a room and shares a join code; others join by entering the code. The host picks the time limit before room creation. Players are auto-assigned to free pegs on join; each player sees their own peg in focus with full description in the lobby, while other joined players appear below. The host starts the game from the lobby (which doubles as the draw screen). Flows through Host Setup (time limit) / Join (enter code) → Lobby (code displayed, players join, assign pegs) → Game (synchronised via PartyKit) → Results (shared leaderboard).

**Angler**:
A person playing the game (human player or bot).

**AnglerBot**:
An NPC angler controlled by the game, with a skill level (1–10) that influences tackle choices (via skill-weighted species roll at draw and mid-match tackle changes) and strike/reel timing. Bots are defined in reference data (`src/lib/data/bots.ts`) with a name and fixed skill. Bots are available in Match mode only. Bot skill does NOT affect a separate strike accuracy roll — the HookRangeCheck alone determines strike outcome; skill only affects how quickly the bot reacts.

**Angler State / AnglerPhase**:
A phase in the fishing loop: changing, idle, wait, bite, strike, reel, landing, catch, lost, finished. `netting` was removed from the original spec. `changing` is the tackle-selection phase — the match clock runs but the loop does not fish. All anglers (player and bots) start a timed match in `changing`; bots auto-advance after a skill-based delay (same formula as BotStrikeDelay, ~3–10s), while the player advances via the tackle modal. Mid-game tackle changes transition back to `changing` via `resetCast()` (losing the current fish). For human anglers, `reeling` activates a **ReelingMinigame** in the FishingCanvas — the player must control rod angle and tension to bring the fish to the bank; landing phase is bypassed entirely. For bots, `reeling` uses a **ReelDuration** countdown followed by an instant capacity check after **BotReelDelay** elapses (no landing window). The human reeling phase replaces the old timed-reel + landing-window model.

**ReelDuration**:
The milliseconds a bot must wait through the `reeling` phase before it auto-reels. Computed linearly from the ratio of fish weight to line max capacity: `3000 + min(1, fishWeightOz / line.maxOz) × 7000`, clamped to 3,000–10,000ms. A light fish on a strong line (low ratio) reels in ~3s; a fish near the line's limit (ratio near 1) takes ~10s. For human anglers, the reel timing is governed by the **ReelingMinigame** instead — the ReelDuration value is computed but not used directly; the minigame resolves via player skill rather than a timer.

**LandingWindow**:
A timed sub-phase after the reel timer completes, used only by **angler bots**. Bots auto-reel instantly after their **BotReelDelay** — the landing window value is computed (`2000 − min(1, fishWeightOz / line.maxOz) × 1000`, clamped to 1,000–2,000ms) but not used as a timed window. For human anglers, landing is handled by the **ReelingMinigame** — the fish is caught when it reaches the bank, and the `landing` phase is not entered.

**FishGotAway**:
An event emitted when the reeling action fails for the player — triggered when the **ReelingMinigame** resolves as `lost` (over-tension held >500ms). The fish escapes, transitioning to `lost` with the message "Fish got away!". For bots, emitted via `reelWithCapacityCheck()` on failure (same message). The old behaviour (clicking before landing window) no longer applies — the minigame replaces the passive timed click.

**LineBroke**:
An event emitted when the landing capacity check fails — the fish exceeds the line's `maxOz` capacity and the luck roll fails (`fish.weightOz > line.maxOz && rng ≥ 0.3`). The line snaps, transitioning to `lost` with the message "Line broke!". This happens at the end of a successful **ReelingMinigame** (for humans, landing window replaced by minigame resolution) or after the **BotReelDelay** elapses (for bots, via `reelWithCapacityCheck()`).

**TooMuchSlack**:
An event emitted when the `LandingWindow` expires without the fish being reeled. Only reachable if the `landing` phase is somehow entered (defensive edge case — the normal human flow resolves via the **ReelingMinigame** before entering `landing`). Bots pass through `landing` instantly (no delay), so this event should not occur in normal operation. The fish shakes the hook with the line gone slack, transitioning to `lost` with the message "Too much slack line!".

**ReelingMinigame**:
An active p5.js-based minigame (`FishingCanvas.svelte`) that replaces the passive timed reel for human anglers. When the player enters the `reeling` phase, the canvas renders a rod, line, and fish. The player controls rod angle via mouse X position; holding the mouse button applies pull tension. The fish has stamina, weight, and a pull-pattern cycle that alternates between pulling (player must resist) and resting. A tension gauge (green→red) shows current strain. The fish is caught when it reaches the bank (80% of canvas height). The fish is lost if **tension ≥ 1.0 for 500ms** (over-tension), emitting `fishGotAway`. When the minigame resolves as `caught`, the **LineBroke** capacity check runs; if the line holds, the fish is landed and `fishCaught` is emitted. Hook range check is bypassed during the minigame (already passed at strike time). The rod's **RodMultiplier** stat affects tension (higher = easier); the tackle's **castStrength** determines the fish's starting Y position (Short: 60% of canvas → close to bank, Medium: 40%, Long: 20% → far from bank).

**OverTension**:
A loss condition in the **ReelingMinigame** — when the angler's tension value reaches or exceeds 1.0 for a continuous 500ms, the line gives (or the fish escapes), and the minigame resolves as `lost`. Players must balance pull force against the fish's resistance to avoid over-tension while still making progress reeling the fish toward the bank.

**BotStrikeDelay**:
The delay before a bot auto-strikes after a bite triggers. Computed as `rng × maxDelayMs` where `maxDelayMs = 10_000 - (skill - 1) × 7_000 / 9`. Skill 10 → ~3s max, skill 1 → ~10s max. If the natural BiteWindow expires before the delay, the bot misses the bite.

**BotReelDelay**:
The delay before a bot auto-reels after a strike succeeds. Same formula as BotStrikeDelay, but applied during the `reeling` phase instead of `bite`. Skill 10 → ~3s max, skill 1 → ~10s max.

**BotTackleChange**:
If a bot experiences two consecutive blank-cast cycles (30s patience + redistribution + still no fish), it calls `pickBotTackle()` again for its peg and updates its tackle mid-match. The counter resets whenever the bot lands or loses a non-blank interaction.

**Draw**:
The match-only phase where anglers are randomly assigned to pegs. The player's peg is revealed first (with a brief delay), then bot pegs appear. All anglers (player + bots) are fully populated in `gameState.anglers` before the Tackle page.

**TackleSelection**:
The current rod, reel, line, hook, bait, strata, and cast strength chosen by an angler. Each component has an independent deterrence value affecting fish behaviour.

**TacklePreset**:
A predefined tackle configuration (rod, reel, line, hook, bait, strata, cast strength), optionally targeting a specific species (via `targetSpecies`). Used at draw time to assign bots their starting tackle. Species-specific presets are selected via a skill-weighted random roll against the peg's likely species composition. General-purpose presets (Tiddler Basher, Light, Medium, Heavy, Predator) serve as fallback. The preset's strata and cast strength are overridden at runtime by **tactical override** logic (Leger → Bottom, Pole → Short, otherwise random valid options) to add variety between bots using the same preset.

**CaughtFish**:
A fish that has been landed by an angler, recording its species and weight in ounces.

**CatchAudit**:
An ordered log of every fish landed during a session or match, recording the time (ms from session/match start), the angler who caught it, and the fish details (species, classification, weight). Distinct from `AnglerState.catch` (per-angler, display-oriented) — the audit is a single chronological sequence enabling timeline analysis, catch-rate charts, and post-match replay.

**GamePhase**:
The high-level stage of a game: prep (setup), draw (match-only peg assignment on the /prep/draw page), fishing (the game loop), results (post-session summary).

**PrepState**:
A reactive singleton (`src/lib/game/prep-state.svelte.ts`) holding the fishing-trip selection state: mode (session/match), venue name, lake name, chosen peg, time limit, and the initial anglers array (player + bots after draw). Responsible for the draw logic. Populated through the prep routes (lake → rules → draw → tackle). Exported as `prepState` and imported by all prep routes and the game/results pages for display (venue name, lake name, mode). The `anglers` array is handed off to **GameState** at `beginFishing()` — after that point, GameState owns and mutates anglers.

**GameState**:
A reactive singleton (`src/lib/game/state.svelte.ts`) managing the fishing session runtime: phase (`idle` → `fishing` → `results`), peg fish populations, player and bot `FishingLoop` instances, reactive sync fields for the player's phase/timers/events, match countdown, the `anglers` array (received from PrepState at `beginFishing()`), and a `catchAudit` array (chronological log of every landed fish with timing). All loops start in `changing` phase — tackle selection is an in-game modal on the game page, not a separate route. The match clock (`timeRemainingSeconds`) decrements continuously via `tick()`, including during `changing`. Exported as `gameState` and imported by the game page (phases, events, loops) and results page (catch/leaderboard data). Designed to be replaced by a synchronised state object when multiplayer is added.
Prep selection state is sourced from **PrepState** (mode, venue, lake, peg, time) rather than being transported in URL query params between prep routes; URLs are used for navigation only.

## Relationships

- A **Venue** has one or more **Lakes**
- A **Lake** has multiple **LakeSpecies** entries (each with a name and frequency)
- A **Lake** has multiple **Pegs**
- A **Peg** has one set of **EnvironmentalFeatures**
- A **Species** has multiple **FishClassifications** (size tiers)
- A **Fish** is of one **Species** and one **FishClassification**
- An **Angler** (or **AnglerBot**) occupies a **Peg** during a session

## Routes (initial build)

1. **Splash** (`/`) — branding/intro screen with full-bleed background image, Ken Burns animation, and a "Start" button
2. **Menu** — home screen with a hero image of the lake (venue/lake name overlaid top-centre) and three mode cards (Session / Solo Match / Multiplayer Match). A floating ⓘ icon top-right links to the About page. Selecting a mode initialises PrepState and navigates to the appropriate flow.
3. **Prep** (nested):
   - **Session**: rules (pick peg) → game (tackle modal)
   - **Solo Match**: rules (pick time preset) → draw → Start Match (timer begins) → game (tackle modal, timer ticks)
   - **Lake** (`/prep/lake`): standalone entry point (initialises venue/lake selection if entered directly; not reached from the menu)
4. **Multiplayer**:
   - **Landing** (`/multiplayer`): presents two cards — Host a Match / Join a Match
   - **Host** (`/multiplayer/host`): player enters name, picks time limit → match created with join code
   - **Join** (`/multiplayer/join`): player enters name + match code → connects to match
   - **Lobby** (`/multiplayer/lobby`): shows match code (host), player list with peg assignments (own peg in focus with description, others listed below), Start button (host only). Host clicks Start → timer begins for all → all navigate to game page (tackle modal).
5. **Game** — the fishing loop and tackle selection (full-screen modal when the player is in `changing` phase). During a Solo Match or Multiplayer game, the game clock runs throughout tackle selection (time decrements even while the modal is open).
6. **Results** — post-session/match summary. Sessions show a personal catch list (species, weight, count). Solo Matches show a leaderboard (player + bots). Multiplayer shows a leaderboard of human players sourced from server broadcasts.

## Data

**Venues**: Single venue ("JCs") with one lake ("Match Lake") for the initial build.

**Weight unit**: Ounces (oz), matching the original game's imperial system.

**HookRangeCheck**:
A strike-time gate: if the fish's weight falls outside the hook's `minOz`–`maxOz` range, the strike fails automatically (bypassing the skill roll). The player receives a flavoured message: "Hook smashed by big fish!" if the fish exceeds the hook's maxOz.

**BaitRangeGate**:
A cast-time filter: fish whose weight falls outside the bait's `minOz`–`maxOz` range will not be selected as bite candidates. The player sees a blank cast ("Nothing biting yet...") rather than a failed strike.

**LineShyGate**:
A cast-time lower-bound filter: fish whose weight falls below the line's `minOz` will not be selected as bite candidates (the line is too thick/visible for small fish to approach). No upper-bound gate at cast — the line's maxOz remains a reel-phase capacity check only. Line minOz values are steepened on heavier lines so 8lb+ gear gates out silver-fish tiers, and 12lb+ gear gates toward medium fish of larger species, helping players target larger fish without catching constant small fish.

**HookRangeCheck**:
A strike-time gate: if the fish's weight falls outside the hook's `minOz`–`maxOz` range, the strike fails. Hook minOz values follow a similar steepened progression as lines — size 10 and below increasingly filter toward medium-plus fish, while size 2 effectively targets specimen-grade fish of the larger species.

## Not in initial scope

- **Fishing Journal** (session history, match history, fish PBs)
- **Settings screen**

These follow-on features are acknowledged in the README but excluded from the first buildable release.

## Fish Generation

Fish are **pre-spawned** when a session starts — a population of Fish instances distributed across the lake's pegs. As fish are caught, stocks deplete, forcing the angler to adapt tactics. Generate-on-bite is acknowledged as a potential MVP shortcut but not the target.

**FishMatchScore**:
A 0–1 score computed from the average absolute difference between a species' environmental preferences and a peg's features. Used **only** to weight species abundance during population generation — it does NOT influence bite timing. Higher score means more fish of that species settle at that peg, but once a fish exists, bite time is independent of this score.

**SpeciesCaution**:
A per-species value (in milliseconds) representing how long the fish's maximum possible wait for a bite can be. Ranges from 2,000 (Dace — bold, fast-biting) to 12,000 (Carp — cautious, slow-biting). Used within the bite-time bracket formula.

**SizeMax**:
A per-tier value (in milliseconds) representing how much longer larger fish can take to bite. Four tiers: 2,000 (smallest), 5,000 (medium), 60,000 (specimen), 120,000 (monster). The upper tiers dominate the bracket ceiling so that big fish require genuine patience, while a fortuitous low random roll keeps quick catches possible. Stored as `tierIndex` on each `FishData` instance for fast lookup.

**BiteTime**:
The calculated milliseconds before a bite triggers, computed as:

```
biteTime = (2000 + rng₁ × 5000) + rng₂ × (deterMax + speciesMax + sizeMax)
```

Where:

- The **base** (2000–7000ms) is pure randomness
- **deterMax** = total deterrence (sum of rod + reel + line + hook) × 50,000 — heavier tackle increases the max possible wait
- **speciesMax** = the species' inherent caution cap
- **sizeMax** = the fish's size-tier cap
  The three bracket factors sum to a ceiling: the actual extra wait is a random roll from 0 up to that ceiling. A Carp on max tackle can wait up to ~1m45s, while a Dace on light tackle typically waits 2–11s.

**BiteWindow**:
The time window the player has to press the strike button after a bite triggers, before the fish rejects the bait. Calculated as a fraction of the pre-bite wait time, clamped between 1,000ms and 5,000ms:

```
biteWindowMs = max(1000, min(5000, biteTime * 0.3))
```

A fish that took 60s to bite gives a ~5s window; a bold Dace biting in 3s gives a ~1s window. The player must call `strike()` before this timer expires or the fish is lost.

Allows the player to step away briefly during the wait phase without penalty — the penalty only applies once they know a bite has occurred and fail to react in time.

**FishPopulation module** (`src/lib/game/population.ts`):
A pure function module responsible for generating per-peg fish arrays. Takes a lake, peg, species lookup, and count; returns `FishData[]` weighted by:

- LakeSpecies.frequency (relative abundance per species)
- Species.preferences × **fishMatchScore** against Peg.features (which species settle at which peg)
- **Species.tolerances**: hard exclusion gate — if a peg's feature falls outside a species' defined tolerance range, the species gets zero weight for that peg (never appears)
- Size tier distribution (weighted toward smaller classifications)
- Seam: injectable RNG for deterministic testing.

**FishingLoop module** (`src/lib/game/loop.ts`):
A single-angler state machine (`changing → idle → wait → bite → strike → reel → landing → catch`) driving the core fishing mechanic. All loops start in `changing` phase: bots auto-advance via a skill-based timer (~3–10s), then pick tackle (`onBlankCycle` callback) and auto-cast. The player advances from `changing` to `idle` via the tackle modal. On cast, selects a candidate fish from the peg population by matching bait compatibility, strata, cast strength, and bait weight range (**BaitRangeGate**). Bite timing is governed by the **BiteTime** formula (species caution + size tier + tackle deterrence). After the bite triggers, a **BiteWindow** countdown runs; if it expires, the loop emits `biteExpired` and transitions to `lost`. The `strike()` action applies the **HookRangeCheck** (hard gate, applies to all anglers); players click directly (no skill roll), bots use `strike()` immediately after their **BotStrikeDelay** elapses. Bot strike has no separate accuracy roll — skill only affects the timing. After a successful strike, the loop enters `reeling` and sets the **ReelDuration** value. For human anglers, the game page detects the `reeling` phase and activates the **ReelingMinigame** (`FishingCanvas.svelte`) — the player actively reels via mouse controls. The minigame resolves as `caught` or `lost`; on resolution, `handleReelingOutcome(result)` dispatches the appropriate event (`fishGotAway` on loss, capacity check on catch → `lineBroke` or `fishCaught`). The loop's `landing` phase is bypassed for humans. Bots skip the minigame — after their **BotReelDelay** elapses they call `reelWithCapacityCheck()` which runs the capacity check immediately (no landing window). Accepts player actions (strike, reel, recast) and time ticks. Emits events (bite, biteExpired, hookBroken, fishCaught, fishLost, fishGotAway, lineBroke, tooMuchSlackLine). Bot AI drives the same seam with automatic decisions (BotStrikeDelay, BotReelDelay, BotTackleChange). Exposes `updateTackle()` and `enterChanging()` so the loop's tackle can be refreshed mid-game when the player or bot changes equipment.

**Prep Navigation module** (`src/lib/game/prep-flow.ts`):
A shallow module centralising prep step URL strings so routes don't hardcode paths. Kept minimal until multiplayer reframes the navigation model entirely.

## Resolved ambiguities

- "Zone" (3×3 grid per peg) was discussed but deferred — per-peg features only for initial build
- "Characteristic" → **EnvironmentalFeatures** (the term used in code)
- "SpeciesClass" → **FishClassification** (the term used in code)
- "Hard limit" / "dealbreaker" → **EnvironmentalTolerances** — per-species min/max ranges that gate species presence at a peg (exclude entirely), separate from the continuous match scoring that governs relative abundance
