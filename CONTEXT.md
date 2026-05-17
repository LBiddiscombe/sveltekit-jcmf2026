# JCMF Remake

A web-based remake of the 1980s ZX Spectrum game "Jack Charlton's Match Fishing" — a match fishing simulation combining patience, skill, and the joy of landing a fish.

## Language

**Venue**:
A location with one or more fishing lakes. Each venue has an `image` (filename in `$lib/assets/images/venues/`) for display on the venue picker.
_Avoid_: Location, site

**Lake**:
A body of water within a venue, containing multiple pegs.

**Peg**:
A fishing spot around a lake accommodating zero or one angler. Each peg has a single set of environmental features (no zone subdivision in the initial build).

**EnvironmentalFeatures**:
A set of five water condition ratings (flow, clarity, substrate, vegetation, shelter) on a 0–1 scale, describing a peg's character.
_Avoid_: Characteristics, water properties

**Species**:
A type of fish (e.g. Carp, Roach, Tench). Each species has a record weight, frequency weight, preferred strata, preferred environmental features, and size classifications.

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
A person playing the game.

**AnglerBot**:
An NPC angler controlled by the game, with a defined skill level that influences tackle choices, strike timing, and landing success. Each bot has a name and a skill level — no additional personality or flavor in the initial build. Bots are available in Match mode only.

**Angler State**:
A phase in the fishing loop: Cast, Wait, Bite, Strike, Reel, Net, Catch, Finished.

## Relationships

- A **Venue** has one or more **Lakes**
- A **Lake** has multiple **Pegs**
- A **Peg** has one set of **EnvironmentalFeatures**
- A **Species** has multiple **FishClassifications** (size tiers)
- A **Fish** is of one **Species** and one **FishClassification**
- An **Angler** (or **AnglerBot**) occupies a **Peg** during a session

## Routes (initial build)

```
/       → splash (branding/intro screen)
/menu
/prep/venue
/prep/lake
/prep/rules       → Session: pick a peg | Match: set time limit (minutes)
/prep/tackle      → shared: used in Prep flow AND reachable from /game (change tackle)
/game
/results
```

The root route `/` serves as the splash screen with a full-bleed background image and Ken Burns pan/zoom animation. The prep route `/prep/rules` renders different content based on mode (Session picks a peg; Match sets minutes). `/prep/tackle` is navigable from both the prep flow and mid-game for tackle changes.

1. **Splash** (`/`) — branding/intro screen with full-bleed background image, Ken Burns animation, and a "Start" button
2. **Menu** — main menu with "Go Fishing" (Session) and "Host Match" options
3. **Prep** (nested) — venue → lake → rules → tackle
4. **Game** — the fishing loop. During a Match, the game clock runs and bot anglers fish autonomously alongside the player. "Change Tackle" navigates to `/prep/tackle` and back.
5. **Results** — post-session/match summary. Sessions show a personal catch list (species, weight, count). Matches show a leaderboard ranked by total catch weight.

## Data

**Venues**: Single venue ("JCs") with one lake ("Match Lake") for the initial build. "Carp Lake" exists in code as test/dummy data.

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
