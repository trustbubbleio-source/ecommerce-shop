# CLAUDE.md

Guidance for working in this repository.

## What this is

`One More Rip` — a mobile-first Pokémon TCG e-commerce app. pnpm monorepo with a Vite

- React storefront (`apps/web`), a Hono API (`apps/api`), a shared domain package
  (`packages/shared`) and a shared design system (`packages/ui`).

## Commands

```bash
pnpm install
pnpm dev                 # api on :4000, web on :5173 (runs with no config; mock payments)
pnpm test                # all tests (Vitest)
pnpm test:coverage       # with coverage thresholds
pnpm typecheck           # tsc --noEmit across packages
pnpm build               # production build (api via tsup, web via vite)

# scope to one package
pnpm --filter @akknerds/web test
pnpm --filter @akknerds/api dev
```

## Architecture rules

- **`packages/shared` is the contract.** Product types, zod schemas, the product
  catalogue, pricing and filter/sort logic live here and are imported by BOTH the
  API and the web app. Change domain shapes here, not in app code.
- **Money is integer cents** everywhere. Format only at the edge with `formatPrice`.
- **Never trust client prices.** `POST /api/checkout` re-prices the cart from the
  catalogue via `priceCart()` and clamps quantities to stock.
- **API dependency injection:** `createApp(overrides)` builds a fresh app with
  in-memory repositories — this is what makes the API tests hermetic. Repositories
  live in `apps/api/src/repositories` and are the single place to swap for a DB.
- **Payments:** `PaymentService` runs in **mock mode** when no real `sk_` key is
  set (returns a local success URL and settles orders synchronously). A real key
  switches to Stripe Checkout + webhook settlement. Tests inject a fake Stripe
  client.
- **Web state:** server data → TanStack Query (`src/hooks`); cart + auth →
  Zustand stores (`src/store`, persisted to localStorage). The auth store syncs
  its token into the API client via `setAuthToken`.
- **UI consistency:** build on `@akknerds/ui` primitives. The dark/purple theme is
  HSL CSS variables in `packages/ui/src/styles.css` + the Tailwind preset.

## Testing conventions

- Vitest + Testing Library. Web has two render helpers in `src/test/utils.tsx`:
  `renderWithProviders` (isolated component, MemoryRouter) and `renderApp`
  (full router via `createMemoryRouter`, used for page/integration tests).
- Mock the API by spying on the `api` object (`vi.spyOn(api, 'listProducts')`),
  not by mocking the whole module — keeps `ApiError`/`setAuthToken` real.
- When asserting by accessible name/text, beware collisions: the header has a
  "Sign in" link and a "Search" button; `ProductArt` renders the category label,
  so don't name test products after a category.

## Gotchas

- pnpm 10 blocks postinstall scripts by default; `esbuild` is allow-listed via
  `pnpm.onlyBuiltDependencies` in the root `package.json`.
- Packages import `@akknerds/*` from **source** (`exports` → `./src/index.ts`), so
  there is no build step for the shared packages. The API production build
  (`tsup`) bundles them via `noExternal`.
- If you add a direct dependency to a package, add it to that package's
  `package.json` (pnpm is strict — transitive deps won't resolve), then reinstall.
