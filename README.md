# JCMF Remake

## Background

Jack Charltons Match Fishing, published by Alligata Software Ltd created by Elliot Gay & F. David Thorpe (graphics), was a game on 8-bit computers back in the 1980s, I remember playing this for hours with my brother, sat hovering over the ZX Spectrum keyboard waiting for our peg to flash and fighting to get to our number key!

This JCMF Remake is an ode to those times.

## Description

A simple, but authentic match fishing experience combining patience, skill and joy of landing a fish. It can be played alone, or as multiplayer.

This is an outline of the game screens

- Splash screen
- Main menu
  - Go Fishing (single player)
  - Host match (multiplayer)
  - Join match (multiplayer)
  - Fishing Journal (sessions, matches, fish PBs)
  - Settings
- For solo play
  - Pick a venue
  - Pick a lake
  - Pick a peg
  - Set rules (set a time, or unlimited, optionally add bots)
  - Go fishing (see below)
  - See results, leave
- Go fishing
  - Choose tackle & bait
  - Enter the main fishing loop
    - Cast
    - Wait for a bite
    - Strike to hook
    - Reel
    - Net fish
    - Optionally change tackle
  - See results
  - Leave lake
- Bots
  - Have a skill level
  - Skill determines things like tackle choice, change tackle time, strike/reel/land success
  - First names only, male and female, based on known anglers Jack (Charlton), John (Wilson), Matt (Hayes), Mick (Brown), Paul (Whitehouse), Bob (Mortimer), Ashley (Rae), Emma (Pickering), Becky (Keogh), Sarah (Taylor)

## Deployment

### Vercel (SvelteKit app)

Configured via `@sveltejs/adapter-vercel`.

1. Push the repo to GitHub
2. Run:
   ```bash
   npx vercel link          # link to your Vercel account
   npx vercel --prod        # first deploy
   ```
3. Or go to [vercel.com/new](https://vercel.com/new), import the GitHub repo — framework auto-detects SvelteKit.

After linking, every `git push` to `main` triggers a production deploy automatically.

### PartyKit (multiplayer server)

Multiplayer requires a PartyKit Cloud server alongside the Vite app. Deploy once after first push:

```bash
npx partykit deploy
```

Then set the PartyKit host as an env var on Vercel:

```
PUBLIC_PARTYKIT_HOST=jcmf-multiplayer.<your-username>.partykit.dev
```

Set this via the Vercel dashboard (Project → Settings → Environment Variables) or the CLI:

```bash
npx vercel env add PUBLIC_PARTYKIT_HOST
```

Run `npx partykit deploy` again whenever `src/party/server.ts` changes.

### Offline / PWA

The service worker is built into `src/service-worker.ts` using SvelteKit's built-in support. It precaches all app assets and provides offline navigation via cached root page. The PWA manifest is at `static/manifest.json`. Service workers require HTTPS — Vercel provides this automatically.
