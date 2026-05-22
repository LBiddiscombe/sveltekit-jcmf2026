# Timed Reel Mechanic with Landing Window

The original reel was an instant capacity check (single click → caught/lost). We replaced it with a timed process where the player waits through a **ReelDuration** countdown (3–10s, proportional to fish vs line weight), then a **LandingWindow** opens (1–2s) for the player to click and attempt landing.

This changes the core feel from instant gratification to tension-and-release: the player earns the catch by waiting through the reel, then must time their landing click. Three distinct failure modes replace a single RNG gate.

## Considered Options

1. **Continuous gauge fill-up** — click when gauge is full (precision timing). Rejected: too similar to a QTE, harder to explain.

2. **Hold-to-reel** — hold button through the timer (release = fail). Rejected: fatiguing on mobile, less dramatic than the click-to-land payoff.

3. **Minigame bypass for bots** — bots skip the timer entirely. Chosen over making bots also wait: bots already have their own reeling tension via BotReelDelay, and the landing click is inherently a player-facing interaction.

## Consequences

- The `reeling` phase is now time-gated for players (bots still work instantly after BotReelDelay). A `'landing'` phase was added to the FishingPhase type.
- Capacity check moved from immediate `reel()` to the landing window click. Strike always transitions to reeling if the hook range check passes.
- New events (`fishGotAway`, `lineBroke`, `tooMuchSlackLine`) require UI message mappings in the game page.
- The radial gradient overlay and pulsing outlines add visual feedback that didn't exist in the instant-click model.
