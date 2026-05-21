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
A numeric property on each tackle component. Higher values increase bite wait times (fish are more cautious) but enable reeling larger fish. Each component's deterrence contributes independently.

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
The current rod, reel, line, hook, and bait chosen by an angler. Each component has an independent deterrence value affecting fish behaviour.

**CaughtFish**:
A fish that has been landed by an angler, recording its species and weight in ounces.

**GamePhase**:
The high-level stage of a game: prep (setup), draw (match-only peg assignment on the /prep/draw page), fishing (the game loop), results (post-session summary).

**GameState**:
A reactive singleton (`src/lib/game/state.svelte.ts`) holding the current game's full state — mode, venue, lake, player peg, time, anglers (player + bots), and tackle selections. Created at venue selection, progressively populated through prep, and active through game → results. Exported as `gameState` and imported by any route that needs it. Designed to be replaced by a synchronised state object when multiplayer is added.
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
   - **Session**: venue → lake → rules (pick peg) → tackle → game
   - **Match**: venue → lake → rules (pick time preset) → draw → tackle → game
4. **Game** — the fishing loop. During a Match, the game clock runs and bot anglers fish autonomously alongside the player. "Change Tackle" navigates to `/prep/tackle` and back.
5. **Results** — post-session/match summary. Sessions show a personal catch list (species, weight, count). Matches show a leaderboard ranked by total catch weight.

## Data

**Venues**: Single venue ("JCs") with one lake ("Match Lake") for the initial build.

**Weight unit**: Ounces (oz), matching the original game's imperial system.

## Not in initial scope

- **Multiplayer** (host/join match with human opponents)
- **Fishing Journal** (session history, match history, fish PBs)
- **Settings screen**

These follow-on features are acknowledged in the README but excluded from the first buildable release.

## Fish Generation

Fish are **pre-spawned** when a session starts — a population of Fish instances distributed across the lake's pegs. As fish are caught, stocks deplete, forcing the angler to adapt tactics. Generate-on-bite is acknowledged as a potential MVP shortcut but not the target.

## Resolved ambiguities

- "Zone" (3×3 grid per peg) was discussed but deferred — per-peg features only for initial build
- "Characteristic" → **EnvironmentalFeatures** (the term used in code)
- "SpeciesClass" → **FishClassification** (the term used in code)
