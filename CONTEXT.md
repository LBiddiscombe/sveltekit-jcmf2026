# JCMF Remake

A web-based remake of the 1980s ZX Spectrum game "Jack Charlton's Match Fishing" — a match fishing simulation combining patience, skill, and the joy of landing a fish.

## Language

**Venue**:
A location with one or more fishing lakes. Each venue has an `image` for display on the venue picker.
_Avoid_: Location, site

**Lake**:
A body of water within a venue, containing multiple pegs. Each lake defines which species inhabit it, their relative abundance, and the fish population per peg.

**FishPerPeg**:
The number of fish generated at each peg when a session or match starts. Every occupied peg receives this many fish independently — no splitting occurs regardless of how many pegs are occupied or how many anglers are fishing. A session peg and a match peg each get the same number.
_Avoid_: Lake fish count, total population

**LakeSpecies**:
A species name and its abundance frequency within a specific lake.

**Frequency**:
A relative abundance weight (higher = more common) assigned to each species per-lake. Used when generating fish populations.
_Avoid_: Global abundance, population density

**Peg**:
A fishing spot around a lake accommodating zero or one angler. Each peg has a single set of environmental features.

**EnvironmentalFeatures**:
A set of five water condition ratings (flow, clarity, substrate, vegetation, shelter) on a 0–1 scale, describing a peg's character.
_Avoid_: Characteristics, water properties

**EnvironmentalTolerances**:
Per-species min/max ranges for any subset of environmental dimensions. If a peg's feature value falls outside a species' tolerance for that dimension, the species is excluded entirely from that peg (hard gate). Dimensions without a tolerance defined are never dealbreakers.

**Species**:
A type of fish (e.g. Carp, Roach, Tench). Each species has a record weight, preferred strata, environmental preferences, and size classifications. Abundance is defined per-lake via LakeSpecies.

**FishClassification**:
A size tier within a species with an `id` (`small`, `medium`, `specimen`, `monster`), a `label` (display name, blank for medium), a `maxOz` weight cap, and a list of preferred baits. The medium tier has a blank label so it reads naturally in catch messages.
_Avoid_: SpeciesClass

**Fish**:
A single instance of a fish of a given species and classification with a specific weight.

**Bait**:
A substance used on a hook to attract and catch fish.

**Tackle**:
The equipment an angler uses to fish — rod, reel, line, and hook. Each piece has a deterrence value.

**Deterrence**:
A numeric property on each tackle component. Higher values increase the maximum possible bite wait time but enable reeling larger fish. Each component's deterrence contributes independently to the total sum used in the BiteTime formula.

**DebugMode**:
A developer-only mode gated by the `jcmf-debug` localStorage key. When active, a "debug" button appears on the Game page (desktop only) that pauses the game loop and opens the DebugPanel sidebar.
_Avoid_: Dev mode, cheat mode, testing mode

**DebugForceFish**:
A DebugPanel action that overrides the current fish during the `waiting` phase. Bypasses most filters to allow testing of mismatch scenarios.
_Avoid_: Force bite, manual catch

**Rod**:
A rod type (Leger, Float, Pole) with constraints defining what tackle and tactics can be paired with it: allowed cast distances, allowed water strata, max line breaking strain, and whether it requires a reel. These constraints drive the UI in the tackle modal and quick-change HUD.

**RodMultiplier**:
A per-rod numeric property controlling mechanical advantage in the ReelingMinigame. Higher values reduce tension for a given pull force (easier reeling). Pole: 0.33 (hardest), Float: 0.67 (balanced), Leger: 1.0 (easiest).

**Session**:
A solo fishing outing — unlimited time, no bots, no competition.
_Avoid_: Practice, free play

**Solo Match**:
A competitive fishing session with a time limit and bots filling every other peg. The timer starts when the game page mounts — tackle selection counts against match time.
_Avoid_: Multiplayer, Party

**WinCondition**:
A strategy defining how a caught fish scores points and how per-fish scores are aggregated into a rank value. Concrete implementations: total weight (sum), biggest fish (max), fish count (count), points (sum of 2^tierIndex per qualifying fish: small=1, medium=2, specimen=4, monster=8).

**SpeciesGroup**:
A named grouping of fish species sharing a filter criterion used in competitive matches (silverfish, predators, carps, bottom-dwellers). Each group defines its member species, suitable fallback tackle presets for bot selection, and optional tactical preferences (e.g., forced strata).
_Avoid_: Filter category, species type

**SpeciesFilter**:
A predicate determining whether a caught fish counts toward an angler's score. Variants: all (no filter) or a SpeciesGroup. Rejected fish are excluded from scorecard calculations but remain in the angler's catch for display.

**WeighInEarly**:
A Solo Match action that submits the player's current catch early while bots continue at accelerated speed. Once the match timer expires, the game transitions to Results. Disabled during the `reeling` phase.

**Multiplayer**:
A competitive fishing session with a time limit played by human opponents over the network. No bots. Up to 8 players. A player hosts a room and shares a join code; others join by entering the code.

**Angler**:
A person playing the game (human player or bot).

**PlayerAvatar**:
A visual representation chosen by a human player from the available bot images. In Solo Match, selecting an avatar also reserves that bot character so it cannot be drawn as an opponent.
_Avoid_: Bot image, player image

**AnglerBot**:
An NPC angler controlled by the game, with a skill level (1–10) that influences tackle choices and strike/reel timing. Bots are available in Match mode only. Skill affects how quickly the bot reacts — not strike accuracy.

**WinConditionPicker**:
The UI control on the prep/rules page for selecting a win condition. Options: Total Weight, Fish Count, Biggest Fish, Points. Defaults to Weight.

**SpeciesFilterPicker**:
The UI control on the prep/rules & multiplayer/host pages for selecting a species filter. Dropdown options: All, Silver Fish, Predators, Carps, Bottom Dwellers. Defaults to All.

**SelectMenu**:
A reusable UI component for selecting one option from a short list. Rendered as a single button that expands to a drop-down panel on click.

**AnglerScore**:
The active score for an angler in a competitive match, computed by the WinCondition for qualifying fish only. The label varies by win condition. Runs alongside `totalWeightOz` (all fish, unfiltered) for reference.

**Angler State / AnglerPhase**:
A phase in the fishing loop: changing, idle, wait, bite, strike, reel, landing, catch, lost, finished. `changing` is the tackle-selection phase — the match clock runs but the loop does not fish. Mid-game tackle changes transition back to `changing`. For humans, `reeling` activates the ReelingMinigame; for bots, `reeling` uses a timed countdown.

**ReelDuration**:
The time a bot must wait through `reeling` before it auto-reels (3,000–10,000ms). For humans, the ReelingMinigame governs reel timing instead.

**LandingWindow**:
A sub-phase used only by bots. Bots auto-reel instantly after their delay. For humans, landing is handled by the ReelingMinigame — `landing` is not entered.

**FishGotAway**:
A loss event in the ReelingMinigame triggered when the fish escapes or the player fails to reel.

**LineBroke**:
A loss event when the line snaps from excessive tension. In the ReelingMinigame, triggered by OverTension. For bots, triggered by a capacity check failure.

**TooMuchSlack**:
A defensive loss event when the landing window expires. Should not occur in normal operation.

**ReelingMinigame**:
An active p5.js-based minigame that replaces the passive timed reel for human anglers. Three resolutions: `caught` (fish reaches the bank), `lineBroke` (OverTension), or `fishGotAway` (fish escapes). On `caught`, the fish is landed directly.

**OverTension**:
A loss condition in the ReelingMinigame — when tension reaches 1.0 for a continuous period, the line snaps.

**BotStrikeDelay**:
The delay before a bot auto-strikes after a bite. Skill 10 → ~3s, skill 1 → ~10s. If the BiteWindow expires first, the bot misses.

**BotReelDelay**:
The delay before a bot auto-reels after a successful strike. Same formula as BotStrikeDelay.

**BotTackleChange**:
If a bot experiences two consecutive blank-cast cycles, it re-picks tackle for its peg mid-match. Resets when the bot lands or loses a non-blank interaction.

**Draw**:
The match-only phase where anglers are randomly assigned to pegs.

**TackleSelection**:
The current rod, reel, line, hook, bait, strata, and cast strength chosen by an angler.

**TacklePreset**:
A predefined tackle configuration, optionally targeting a specific species. Used at draw time to assign bots their starting tackle.

**CaughtFish**:
A fish that has been landed by an angler, recording its species and weight. Shown in a CaughtOverlay regardless of whether it qualifies under the active SpeciesFilter — but PB badges fire without confetti for non-qualifying fish.

**CatchAudit**:
An ordered chronological log of every fish landed during a session or match. Enables timeline analysis and post-match replay.

**GamePhase**:
The high-level stage of a game: prep (setup), draw (match-only peg assignment), fishing (the game loop), results (post-session summary).

**MatchRules**:
The configuration for a competitive match: time limit, win condition, and species filter.

**Scorecard**:
A module that records a caught fish for an angler. Non-qualifying fish (rejected by SpeciesFilter) are entirely excluded — they are not added to the catch list, total weight, score, or biggest-fish tracking. The Scorecard returns `{ qualifies }` so callers can decide whether to broadcast the catch or suppress UI toasts.

**PrepState**:
A reactive singleton holding the fishing-trip selection state (mode, venue, lake, peg, time, anglers). Responsible for draw logic. Populated through the prep routes.

**GameState**:
A reactive singleton managing the fishing session runtime: phases, peg populations, player and bot loop instances, match countdown, anglers array, and catch audit. The match clock decrements continuously, including during `changing`.

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
5. **Game** — the fishing loop and tackle selection (full-screen modal when the player is in `changing` phase). During a Solo Match or Multiplayer game, the game clock runs throughout tackle selection.
6. **Results** — post-game summary. **Session** shows a personal species breakdown (count, total weight, biggest fish per species). **Competitive** modes (Solo Match and Multiplayer) show a ranked leaderboard (podium + rest list).
7. **FishLog** (`/fish-log`) — a read-only gallery of all species with PB weight and scaled fish image per species. Accessed via a button on the Menu page.

## Data

**Venues**: Single venue ("JCs") with one lake ("Match Lake") for the initial build.

**Weight unit**: Ounces (oz).

**HookRangeCheck**:
A strike-time gate: if the fish's weight falls outside the hook's min–max range, the strike fails automatically.

**BaitRangeGate**:
A cast-time filter: fish outside the bait's weight range will not be selected as bite candidates.

**LineShyGate**:
A cast-time lower-bound filter: fish below the line's minimum weight will not be selected as bite candidates. The line's max capacity is a reel-phase check only.

**PersonalBest (PB)**:
The heaviest fish ever caught of a given species, stored per-species in localStorage. Tracked globally.
_Avoid_: Per-session best, per-classification best

**RecordFish**:
A caught fish whose weight meets or exceeds the species' record weight. Shown as a [RECORD] badge. Always also a personal best.
_Avoid_: World record, species record

**FishLog**:
A read-only page listing every species with fish image scaled by PB tier.
_Avoid_: Journal, fishing diary, fish book

## Fish Generation

Fish are pre-spawned when a session starts — a population distributed across the lake's pegs. Stocks deplete as fish are caught.

**FishMatchScore**:
A 0–1 score computed from the difference between a species' preferences and a peg's features. Used to weight species abundance during population generation — does not influence bite timing.

**SpeciesCaution**:
A per-species value for the maximum possible bite wait. Ranges from 2,000ms (bold) to 12,000ms (cautious).

**SizeMax**:
A per-tier value for how much longer larger fish can take to bite. Small: 2,000ms, medium: 5,000ms, specimen: 60,000ms, monster: 120,000ms.

**BiteTime**:
The milliseconds before a bite triggers. Composed of a random base plus contributions from tackle deterrence, species caution, and fish size tier.

**BiteWindow**:
The time window to strike after a bite triggers, clamped between 1,000ms and 5,000ms.

**FishPullPattern**:
A binary array per species defining the pulling cycle in the ReelingMinigame — `1` = fish pulls, `0` = fish rests. Each species has a unique pattern so players can identify species by feel during the reel.

## Resolved ambiguities

- "Zone" (3×3 grid per peg) was discussed but deferred — per-peg features only for initial build
- "Characteristic" → **EnvironmentalFeatures** (the term used in code)
- "SpeciesClass" → **FishClassification** (the term used in code)
- "Hard limit" / "dealbreaker" → **EnvironmentalTolerances** — per-species min/max ranges that gate species presence at a peg (exclude entirely), separate from the continuous match scoring that governs relative abundance
