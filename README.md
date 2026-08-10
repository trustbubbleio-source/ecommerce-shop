# One More Rip — Pokémon TCG Storefront

A production-ready, mobile-first e-commerce app for selling Pokémon TCG booster
boxes, Elite Trainer Boxes, packs and single cards. Dark theme with a purple
accent, Stripe checkout, guest + account auth, and a fully tested codebase.

> Built as a **pnpm monorepo**: a Vite + React storefront, a Hono API, and two
> shared packages (a design system and a typed domain core).

---

## ✨ Features

- **Landing page** with a hero, category tiles, featured products and new arrivals.
- **Shop** with sorting, filtering (category, series, availability), live search,
  shareable URL state, and a mobile filter drawer.
- **Product pages** with branded artwork, ratings, stock status and related items.
- **Cart** as a slide-in drawer _and_ a full page, persisted to `localStorage`,
  with a free-shipping progress nudge.
- **Checkout** via **Stripe Checkout** with **guest or signed-in** flows. Prices
  are always re-priced server-side from the catalogue (never trust the client).
- **Authentication** — register / login (JWT), account page with order history.
- **Contact** page with a validated form.
- **Design system** — accessible, reusable components (Button, Dialog, Sheet,
  Toast, Field, etc.) shared across the app.
- **100%-minded test coverage** — 231 tests across unit, component and integration
  layers (Vitest + Testing Library).

---

## 🧱 Monorepo layout

```
akknerds/
├─ apps/
│  ├─ web/        Vite + React 19 storefront (Tailwind, React Router, TanStack Query, Zustand)
│  └─ api/        Hono API (JWT auth, Stripe, in-memory repositories)
├─ packages/
│  ├─ shared/     Domain types, zod schemas, catalogue, pricing & query logic
│  └─ ui/         Shared design system (Tailwind preset + React components)
├─ turbo.json     Task orchestration
└─ pnpm-workspace.yaml
```

**Why this split?** `packages/shared` is the single source of truth for product
types, validation and pricing — imported by _both_ the API and the web app, so the
contract can never drift. `packages/ui` keeps the look-and-feel consistent and
testable in isolation.

---

## 🚀 Getting started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (`npm i -g pnpm`)

### Install & run

```bash
pnpm install
pnpm dev
```

This starts:

- **API** → http://localhost:4000
- **Web** → http://localhost:5173

That's it — the app runs **end-to-end with zero configuration**. Payments run in
**mock mode** (orders settle immediately), so you can place a test order without
any Stripe keys.

### Enabling real Stripe payments

Copy `.env.example` to `.env` at the repo root and fill in your keys:

```bash
cp .env.example .env
```

```ini
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

The API auto-detects a real `sk_` key and switches from mock mode to live Stripe
Checkout. For webhooks during development:

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

---

## 🧪 Testing

```bash
pnpm test              # run every test suite
pnpm test:coverage     # with coverage reports
pnpm typecheck         # type-check all packages
pnpm build             # production build of api + web
```

| Package           | Tests   | Statements | Branches |
| ----------------- | ------- | ---------- | -------- |
| `packages/shared` | 55      | 100%       | 98%      |
| `packages/ui`     | 39      | 100%       | 97%      |
| `apps/api`        | 60      | 97%        | 94%      |
| `apps/web`        | 77      | 98%        | 94%      |
| **Total**         | **231** |            |          |

---

## 🔌 API overview

Base URL: `/api`

| Method | Path                  | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| GET    | `/health`             | Health + payment mode                       |
| GET    | `/products`           | List with filter/sort/search query params   |
| GET    | `/products/meta`      | Categories, series and price range          |
| GET    | `/products/:idOrSlug` | Single product                              |
| POST   | `/auth/register`      | Create account → `{ token, user }`          |
| POST   | `/auth/login`         | Sign in → `{ token, user }`                 |
| GET    | `/auth/me`            | Current user _(auth required)_              |
| POST   | `/checkout`           | Create order + Stripe session               |
| GET    | `/orders/:id`         | Order by capability id (guest confirmation) |
| GET    | `/orders`             | Your orders _(auth required)_               |
| POST   | `/contact`            | Contact form submission                     |
| POST   | `/webhooks/stripe`    | Stripe webhook (marks orders paid)          |

---

## 🎨 Design

- **Dark theme** with a **purple** accent, driven by HSL CSS variables in
  `packages/ui/src/styles.css` and surfaced through a shared Tailwind preset.
- **Mobile-first**: every layout is designed for small screens first, with
  native-feeling drawers/sheets and large tap targets.
- **Performance**: route vendor code is split into cacheable chunks; the catalogue
  is cached client-side via TanStack Query.

---

## 🛠️ Tech stack

**Web:** Vite 6 · React 19 · TypeScript · Tailwind CSS 3 · React Router 7 ·
TanStack Query 5 · Zustand 5 · Radix UI primitives · lucide-react

**API:** Hono 4 · zod · jose (JWT) · bcryptjs · Stripe · nanoid

**Tooling:** pnpm workspaces · Turborepo · Vitest · Testing Library · Prettier

---

## 📦 Production notes

The repositories (`apps/api/src/repositories`) are in-memory and isolated per app
instance, which keeps the demo zero-dependency and the tests hermetic. To deploy
for real, swap those classes for a database-backed implementation (e.g. Prisma +
Postgres) — the routes and the rest of the app are untouched because everything
goes through the repository + `@akknerds/shared` contracts.

> Pokémon and all related names are trademarks of Nintendo / Game Freak.
> This project is a demonstration storefront.
