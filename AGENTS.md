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

All components must use Svelte 5 runes syntax. The project enforces runes mode in `svelte.config.js`.

```svelte
<!-- ✅ Correct -->
<script>
  let count = $state(0);
</script>

<!-- ❌ Avoid -->
<script>
  let count = 0;
  $: console.log(count);
</script>
```

### Testing File Naming

- **Unit tests**: `filename.spec.ts` or `filename.test.ts` (runs in Node)
- **Component tests**: `filename.svelte.spec.ts` (runs in browser via Playwright)
- **E2E tests**: `filename.e2e.ts` (co-locate in routes; runs against production build)

### Import Aliases

Use `$lib/` for importing from `src/lib/`:

```typescript
import { someUtil } from '$lib/path/to/file';
```

## Testing Setup (Dual Vitest Configuration)

The project uses two separate Vitest environments configured in `vite.config.ts`:

1. **Client/Component Tests** (`.svelte.spec.ts`)
   - Browser environment via Playwright Chromium
   - For Svelte component testing
   - Example: [src/lib/vitest-examples/Welcome.svelte.spec.ts](src/lib/vitest-examples/Welcome.svelte.spec.ts)

2. **Server/Unit Tests** (`.spec.ts`, `.test.ts` - non-Svelte files)
   - Node environment
   - For utility/logic functions
   - Example: [src/lib/vitest-examples/greet.spec.ts](src/lib/vitest-examples/greet.spec.ts)

**Important**: E2E tests require a production build. Playwright will run `npm run build && npm run preview` to test the built app.

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

### Testing Components

- **Vitest browser mode** for Svelte components: `*.svelte.spec.ts`
- Import component and mount with test utilities from `vitest-browser-svelte`
- Run with `npm run test:unit`

## Documentation

- [README.md](README.md) — Project setup details
- [SvelteKit Docs](https://kit.svelte.dev/) — Official framework documentation
- [Vite Docs](https://vitejs.dev/) — Build tool configuration

## Notes for Agents

- **Runes are mandatory** — Never suggest pre-Svelte 5 syntax
- **Strict TypeScript** — Add explicit types, avoid `any`
- **Test naming matters** — File extension determines which Vitest environment runs
- **E2E tests are slow** — They rebuild and run against production; keep to critical user flows
- **Prettier auto-format** — Code style is enforced; use `npm run format`
