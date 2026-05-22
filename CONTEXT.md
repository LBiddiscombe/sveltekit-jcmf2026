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
An NPC angler controlled by the game, with a skill level (1–10) that influences tackle choices, strike timing, and landing success. Bots are defined in reference data (`src/lib/data/bots.ts`) with a name and fixed skill. Bots are available in Match mode only.

**Angler State / AnglerPhase**:
A phase in the fishing loop: cast, wait, bite, strike, reel, net, catch, finished. Changes to tackle/bait are done out-of-band (angler drops out of the loop and returns to cast when done), not as a distinct phase.

**Draw**:
The match-only phase where anglers are randomly assigned to pegs. The player's peg is revealed first (with a brief delay), then bot pegs appear. All anglers (player + bots) are fully populated in `gameState.anglers` before the Tackle page.

**TackleSelection**:
The current rod, reel, line, hook, bait, strata, and cast strength chosen by an angler. Each component has an independent deterrence value affecting fish behaviour.

**TacklePreset**:
A predefined tackle configuration (rod, reel, line, hook, bait, strata, cast strength), optionally targeting a specific species (via `targetSpecies`). Used at draw time to assign bots their starting tackle. Species-specific presets are selected via a skill-weighted random roll against the peg's likely species composition. General-purpose presets (Tiddler Basher, Light, Medium, Heavy, Predator) serve as fallback. The preset's strata and cast strength are overridden at runtime by **tactical override** logic (Leger → Bottom, Pole → Short, otherwise random valid options) to add variety between bots using the same preset.

**CaughtFish**:
A fish that has been landed by an angler, recording its species and weight in ounces.

**GamePhase**:
The high-level stage of a game: prep (setup), draw (match-only peg assignment on the /prep/draw page), fishing (the game loop), results (post-session summary).

**GameState**:
A reactive singleton (`src/lib/game/state.svelte.ts`) holding the current game's full state — mode, venue, lake, player peg, time, anglers (player + bots), and tackle selections. Created on the lake welcome page, progressively populated through prep, and active through game → results. Exported as `gameState` and imported by any route that needs it. Designed to be replaced by a synchronised state object when multiplayer is added.
Prep selection state is sourced from `gameState` (mode, venue, lake, peg, match time) rather than being transported in URL query params between prep routes; URLs are used for navigation only, except `returnTo` when changing tackle mid-game.

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
A single-angler state machine (`cast → wait → bite → strike → reel → net → catch`) driving the core fishing mechanic. On cast, selects a candidate fish from the peg population by matching bait compatibility, strata, cast strength, and bait weight range (**BaitRangeGate**). Bite timing is governed by the **BiteTime** formula (species caution + size tier + tackle deterrence). After the bite triggers, a **BiteWindow** countdown runs; if it expires, the loop emits `biteExpired` and transitions to `lost`. The `strike()` action applies the **HookRangeCheck** (hard gate, applies to all anglers), then either the player clicks directly (no skill roll) or the bot's skill roll determines success. Accepts player actions (strike, reel, recast, net) and time ticks. Emits events (bite, biteExpired, hookBroken, fishCaught, fishLost). Bot AI drives the same seam with automatic decisions. Exposes `updateTackle()` so the loop's tackle can be refreshed mid-game when the player changes equipment.

**Prep Navigation module** (`src/lib/game/prep-flow.ts`):
A shallow module centralising prep step URL strings so routes don't hardcode paths. Kept minimal until multiplayer reframes the navigation model entirely.

## Resolved ambiguities

- "Zone" (3×3 grid per peg) was discussed but deferred — per-peg features only for initial build
- "Characteristic" → **EnvironmentalFeatures** (the term used in code)
- "SpeciesClass" → **FishClassification** (the term used in code)
- "Hard limit" / "dealbreaker" → **EnvironmentalTolerances** — per-species min/max ranges that gate species presence at a peg (exclude entirely), separate from the continuous match scoring that governs relative abundance
