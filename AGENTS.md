# AI Agent Instructions for SvelteKit JCMF2026

## Quick Start Commands

```bash
npm run dev              # Start dev server (add -- --open to auto-open browser)
npm run build           # Production build
npm run test            # Run all tests (unit + E2E)
npm run test:unit      # Vitest unit tests only
npm run test:e2e       # Playwright E2E tests only
npm run check          # TypeScript & Svelte type checking
npm run lint           # ESLint + Prettier validation
npm run format         # Auto-format with Prettier
```

## Project Structure

```
src/
  routes/              # SvelteKit file-based routing (+page.svelte, +layout.svelte)
  lib/                 # Reusable components & utilities (alias: $lib)
  app.html             # Root HTML template
```

## Tech Stack

- **Framework**: SvelteKit 2.57 + Svelte 5.55 (runes mode enforced)
- **Build**: Vite 8.0.7
- **Language**: TypeScript 6.0.2 (strict mode)
- **Styling**: Tailwind CSS 4.2.2
- **Testing**: Vitest (dual: client + server) + Playwright E2E
- **Deployment**: Vercel adapter pre-configured

## Key Conventions

### Svelte 5 Runes (Mandatory)

Use `$state`, `$derived`, `$effect`, `$props` etc. Legacy `export let`, `$:`, and `on:click` are rejected in runes mode.

### Import Aliases

Use `$lib/` for importing from `src/lib/`:

```typescript
import { someUtil } from '$lib/path/to/file';
```

## Testing Setup (Dual Vitest Configuration)

File extensions determine which environment runs. This is configured in `vite.config.ts`:

- **`.svelte.spec.ts`** — Browser (Playwright Chromium), for Svelte component tests
- **`.spec.ts` / `.test.ts`** — Node, for utility/logic tests
- **`.e2e.ts`** — Production build (co-located in routes), for E2E tests

Examples: [src/lib/vitest-examples/](src/lib/vitest-examples/)

## Code Quality

- **TypeScript**: Strict mode enforced; use `npm run check` to validate
- **Formatting**: Prettier configured; run `npm run format` before committing
- **Linting**: ESLint flat config; respects `.gitignore`
- **Type Definitions**: Global types in [src/app.d.ts](src/app.d.ts)

## Files to Study

- [svelte.config.js](svelte.config.js) — Runes mode, Vercel adapter
- [vite.config.ts](vite.config.ts) — Dual Vitest projects, Tailwind integration
- [src/lib/vitest-examples/](src/lib/vitest-examples/) — Unit & component test patterns
- [src/routes/demo/playwright/page.svelte.e2e.ts](src/routes/demo/playwright/page.svelte.e2e.ts) — E2E test pattern

## Common Development Patterns

### Creating a Route

1. Add a file/directory under `src/routes/`
2. Export `+page.svelte` or `+layout.svelte`
3. Use SvelteKit's built-in loader functions (`+page.server.ts`) if needed

### Creating a Reusable Component

1. Place in `src/lib/` (e.g., `src/lib/components/Button.svelte`)
2. Import via `$lib/components/Button.svelte`
3. Add component tests as `Button.svelte.spec.ts`

## Required Skills (Always Load)

Whenever creating, editing, or reviewing any `.svelte`, `.svelte.ts`, or `.svelte.js` file, the agent **MUST** load these skills first:

1. `skill({ name: "svelte-code-writer" })` — CLI tools for Svelte 5 docs lookup, autofix, and validation
2. `skill({ name: "svelte-core-bestpractices" })` — Guidelines for Svelte 5 runes mode, reactivity, events, styling

This applies regardless of which skill (prototype, grill-with-docs, etc.) triggered the work. Run `svelte-autofixer` via the code-writer skill before finalizing any Svelte component.

## Documentation

- [README.md](README.md) — Project setup details
- [SvelteKit Docs](https://kit.svelte.dev/) — Official framework documentation
- [Vite Docs](https://vitejs.dev/) — Build tool configuration
