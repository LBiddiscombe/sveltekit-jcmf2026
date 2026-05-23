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
A size tier within a species (e.g. Small, Specimen, Monster) with a max weight and list of preferred baits.
_Avoid_: SpeciesClass

**Fish**:
A single instance of a fish of a given species and classification with a specific weight.

**Bait**:
A substance used on a hook to attract and catch fish.

**Tackle**:
The equipment an angler uses to fish — rod, reel, line, and hook. Each piece has a **deterrence** (`deter`) value: heavier/stronger tackle puts fish off (longer bite times) but can handle bigger fish during the reel.

**Deterrence**:
A numeric property on each tackle component. Higher values increase the maximum possible bite wait time (fish are more cautious around heavy tackle) but enable reeling larger fish. Each component's deterrence contributes independently to the total sum used in the BiteTime formula. Scaled by ×50,000 — a total deterrence of 1.4 adds up to 70s to the wait ceiling.

**Session**:
A solo fishing outing — unlimited time, no bots, no competition. Pure fishing. Flows through Prep (player picks a peg manually, no time/bot options) → Game → Results.
_Avoid_: Practice, free play

**Match**:
A competitive fishing session with a time limit and bots filling every other peg. Winner is determined by total catch weight. Flows through Prep (player sets time, peg is randomly assigned alongside bots) → Game → Results.

**Angler**:
A person playing the game (human player or bot).

**AnglerBot**:
An NPC angler controlled by the game, with a skill level (1–10) that influences tackle choices (via skill-weighted species roll at draw and mid-match tackle changes) and strike/reel timing. Bots are defined in reference data (`src/lib/data/bots.ts`) with a name and fixed skill. Bots are available in Match mode only. Bot skill does NOT affect a separate strike accuracy roll — the HookRangeCheck alone determines strike outcome; skill only affects how quickly the bot reacts.

**Angler State / AnglerPhase**:
A phase in the fishing loop: cast, wait, bite, strike, reel, landing, catch, finished. `netting` was removed from the original spec. The `reeling` phase now includes a **ReelDuration** countdown, after which a **LandingWindow** opens. The player must click during the landing window to attempt landing; clicking during `reeling` (too early) loses the fish. Players experience the full timed reel; bots skip the landing window and auto-reel instantly after their BotReelDelay elapses. Changes to tackle/bait are done out-of-band (angler drops out of the loop and returns to cast when done), not as a distinct phase.

**ReelDuration**:
The milliseconds a player must wait through the `reeling` phase before the landing window opens. Computed linearly from the ratio of fish weight to line max capacity: `3000 + min(1, fishWeightOz / line.maxOz) × 7000`, clamped to 3,000–10,000ms. A light fish on a strong line (low ratio) reels in ~3s; a fish near the line's limit (ratio near 1) takes ~10s.

**LandingWindow**:
A timed sub-phase after the reel timer completes. The player must click during this window to attempt landing the fish. Duration scales inversely with the line/fish ratio: `2000 − min(1, fishWeightOz / line.maxOz) × 1000`, clamped to 1,000–2,000ms. Bigger fish (closer to line max) give a shorter window (~1s, demanding precise timing); smaller fish give a more forgiving ~2s.

**FishGotAway**:
An event emitted when the player clicks or presses Space during the active `reeling` phase (before the landing window opens). The impatient action spooks the fish, transitioning to `lost` with the message "Fish got away!".

**LineBroke**:
An event emitted when the player clicks within the `LandingWindow` but the fish exceeds the line's `maxOz` capacity (failing the capacity check — `fish.weightOz > line.maxOz && rng ≥ 0.3`). The line snaps, transitioning to `lost` with the message "Line broke!".

**TooMuchSlack**:
An event emitted when the `LandingWindow` expires without the player clicking. The fish shakes the hook with the line gone slack, transitioning to `lost` with the message "Too much slack line!".

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
A reactive singleton (`src/lib/game/state.svelte.ts`) managing the fishing session runtime: phase (`idle` → `fishing` → `results`), peg fish populations, player and bot `FishingLoop` instances, reactive sync fields for the player's phase/timers/events, match countdown, the `anglers` array (received from PrepState at `beginFishing()`), and a `catchAudit` array (chronological log of every landed fish with timing). Exported as `gameState` and imported by the game page (phases, events, loops) and results page (catch/leaderboard data). Designed to be replaced by a synchronised state object when multiplayer is added.
Prep selection state is sourced from **PrepState** (mode, venue, lake, peg, time) rather than being transported in URL query params between prep routes; URLs are used for navigation only, except `returnTo` when changing tackle mid-game.

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
2. **Menu** — main menu with "Go Fishing" (Session) and "Host Match" options
3. **Prep** (nested):
   - **Session**: lake (welcome) → rules (pick peg) → tackle → game
   - **Match**: lake (welcome) → rules (pick time preset) → draw → tackle → game
4. **Game** — the fishing loop. During a Match, the game clock runs and bot anglers fish autonomously alongside the player. "Change Tackle" navigates to `/prep/tackle` and back.
5. **Results** — post-session/match summary. Sessions show a personal catch list (species, weight, count). Matches show a leaderboard ranked by total catch weight.

## Data

**Venues**: Single venue ("JCs") with one lake ("Match Lake") for the initial build.

**Weight unit**: Ounces (oz), matching the original game's imperial system.

**HookRangeCheck**:
A strike-time gate: if the fish's weight falls outside the hook's `minOz`–`maxOz` range, the strike fails automatically (bypassing the skill roll). The player receives a flavoured message: "Hook smashed by big fish!" if the fish exceeds the hook's maxOz.

**BaitRangeGate**:
A cast-time filter: fish whose weight falls outside the bait's `minOz`–`maxOz` range will not be selected as bite candidates. The player sees a blank cast ("Nothing biting yet...") rather than a failed strike.

**LineShyGate**:
A cast-time lower-bound filter: fish whose weight falls below the line's `minOz` will not be selected as bite candidates (the line is too thick/visible for small fish to approach). No upper-bound gate at cast — the line's maxOz remains a reel-phase capacity check only.

## Not in initial scope

- **Multiplayer** (host/join match with human opponents)
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
A per-tier value (in milliseconds) representing how much longer larger fish can take to bite. Four tiers: 2,000 (smallest), 5,000 (medium), 10,000 (large/specimen), 16,000 (monster). Stored as `tierIndex` on each `FishData` instance for fast lookup.

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
A single-angler state machine (`cast → wait → bite → strike → reel → landing → catch`) driving the core fishing mechanic. The `netting` phase was removed as a simplification in an earlier iteration — the original instant-reel was later replaced with a timed reel. On cast, selects a candidate fish from the peg population by matching bait compatibility, strata, cast strength, and bait weight range (**BaitRangeGate**). Bite timing is governed by the **BiteTime** formula (species caution + size tier + tackle deterrence). After the bite triggers, a **BiteWindow** countdown runs; if it expires, the loop emits `biteExpired` and transitions to `lost`. The `strike()` action applies the **HookRangeCheck** (hard gate, applies to all anglers); players click directly (no skill roll), bots use `strike()` immediately after their **BotStrikeDelay** elapses. Bot strike has no separate accuracy roll — skill only affects the timing. After a successful strike, the loop enters `reeling` and a **ReelDuration** countdown begins (3–10s based on line/fish ratio). When that expires, a **LandingWindow** opens (1–2s, shorter for harder fish). Players must click during the landing window; the old capacity check fires at this point. Clicking during the active reel (too early) emits `fishGotAway`. Missing the landing window emits `tooMuchSlackLine`. Failing the capacity check at landing emits `lineBroke`. Bots skip the landing window — they auto-reel instantly after their **BotReelDelay** elapses, using the original capacity check. Accepts player actions (strike, reel, recast) and time ticks. Emits events (bite, biteExpired, hookBroken, fishCaught, fishLost, fishGotAway, lineBroke, tooMuchSlackLine). Bot AI drives the same seam with automatic decisions (BotStrikeDelay, BotReelDelay, BotTackleChange). Exposes `updateTackle()` so the loop's tackle can be refreshed mid-game when the player or bot changes equipment.

**Prep Navigation module** (`src/lib/game/prep-flow.ts`):
A shallow module centralising prep step URL strings so routes don't hardcode paths. Kept minimal until multiplayer reframes the navigation model entirely.

## Resolved ambiguities

- "Zone" (3×3 grid per peg) was discussed but deferred — per-peg features only for initial build
- "Characteristic" → **EnvironmentalFeatures** (the term used in code)
- "SpeciesClass" → **FishClassification** (the term used in code)
- "Hard limit" / "dealbreaker" → **EnvironmentalTolerances** — per-species min/max ranges that gate species presence at a peg (exclude entirely), separate from the continuous match scoring that governs relative abundance
