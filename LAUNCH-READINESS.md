# One More Rip — Launch readiness findings

**Date:** 14 October 2026  
**Targets:** `https://www.onemorerip.cards` + API `https://api-production-6622e.up.railway.app`  
**Launch lock:** Purchases locked until **31 October 2026** (`PURCHASES_LOCKED_UNTIL_LAUNCH`)

## How we tested

- Live production crawl (pages, forms with **invalid** inputs only, currency spam, overlays)
- Controlled API probes (validation, rate limits, oversell qty, concurrent product GETs)
- Code audits: API attack surface, frontend resilience, checkout/stock races

**Intentionally not done (to avoid harming live ops):** flooding real contact/restoration emails, completing paid checkouts, DDoS / take-down attempts.

**Live health snapshot at test time (before sanitization):**

```json
{"status":"ok","stripe":"mock","database":"postgres","storage":"s3","email":"resend","google":"enabled"}
```

Public `/api/health` now returns only `{"status":"ok"}`. Mode details are at `/api/health/details` (admin auth).

---

## Verdict

The storefront **stays up** under light–moderate poking. Forms, CORS, prelaunch purchase lock, and most validation look solid.

**Phase A is done in code + Stripe/DNS ops.** Remaining before unlock: **deploy** the local fixes, keep API at **1 replica** (or add Redis for H1), then run a stock race test on prod/staging.

---

## Critical

| # | Finding | Status | Evidence | Impact | Fix |
|---|---------|--------|----------|--------|-----|
| C1 | **Stripe is mock in production** | ✅ **Done** (2026-10-14) | Health details `"stripe":"live"`. Keys on Railway API + publishable on web. | — | Keep webhook events + signing secret in sync; Test vs Live keys consistent until launch. |
| C2 | **Stock never reserved or decremented** | ✅ **Fixed in code** (deploy needed) | Checkout `reserveStock` atomically; release on cancel / expire / refund. | Was: oversell. | Shipped: `reserveStock` / `releaseStock` + `cancelOrderAndReleaseStock`. |
| C3 | **Apex domain broken** | ✅ **Done** (2026-10-14) | Route53 apex → www redirect; `www` on Railway. | — | Keep apex redirect + www custom domain healthy. |
| C4 | **Silent prod fallbacks if env missing** | ✅ **Fixed in code** (deploy needed) | `assertProductionEnv()` — requires DB, strong JWT, Stripe **or** `ALLOW_MOCK_PAYMENTS`, webhook secret when Stripe on, Resend. | Was: silent mock/memory. | Production boot fails closed. |

> **Deploy note:** Push C2+C4 (+ Phase B below). With live Stripe already on Railway, `assertProductionEnv` should pass. Confirm public health is `{status:ok}` and details still show `stripe:live` after deploy.

---

## High

| # | Finding | Status | Evidence | Impact | Fix |
|---|---------|--------|----------|--------|-----|
| H1 | **Rate limiter is in-memory per process** | ⏳ Ops | `MemoryRateLimiter` in `packages/rate-limit`. MCP account ≠ shop Railway workspace — confirm **1 replica** in the shop project dashboard. | Limits multiply across replicas. | Redis/Upstash **or** pin API to **1 replica**. |
| H2 | **Client IP from first `X-Forwarded-For` spoofable** | ✅ Fixed in code | `clientIp()` prefers `x-real-ip` / CF, else **rightmost** XFF hop. | Was: bypass RL. | Deploy with H3/H4. |
| H3 | **Checkout has no rate limit** | ✅ Fixed in code | `rateLimit(..., 'checkout')` — 10 / 15 min. | Was: spam sessions. | Deploy. |
| H4 | **Want-list / reviews lack rate limits** | ✅ Fixed in code | Presets `wantList` / `reviews` — 10 / hour. | Was: mail/review spam. | Deploy. |
| H5 | **No inventory hold between checkout and pay** | ✅ Fixed with C2 | Soft-reserve at session create; release on cancel/expire/refund. | — | Deploy C2. |
| H6 | **`GET /api/health` discloses modes** | ✅ Fixed in code | Public `{ status: "ok" }`; `/health/details` admin-only. | Was: mock/misconfig leak. | Deploy. |
| H7 | **Missing security headers** | ✅ Partial (API) | API: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. | WWW still needs HSTS/CSP via Railway/CDN. | Add HSTS/CSP on web edge. |
| H8 | **Eager JS ships all routes including admin** | ✅ Fixed in code | Admin / legal / account / services lazy-loaded via `React.lazy`. | — | Deploy web. |
| H9 | **Home hero video cost** | ✅ Fixed in code | Reduced-motion → poster; play only when in view; `preload="none"`. | — | Deploy web. |
| H10 | **Full catalog loaded then filtered in memory** | Open | Prisma `findMany()` then page/sort. | Latency as catalog grows. | SQL `WHERE`/`ORDER BY`/`LIMIT`. |

---

## Medium

| # | Finding | Status | Evidence | Impact | Fix |
|---|---------|--------|----------|--------|-----|
| M1 | **Discount vs Stripe amount mismatch** | ✅ Fixed in code | `orderDiscountCents` → one-time Stripe coupon on session. | Was: overcharge with profile discount. | Deploy. |
| M2 | **Webhook paid-email race** | ✅ Fixed in code | `markPaidBySession` atomic pending→paid; emails only on transition. | — | Deploy API. |
| M3 | **Guest order GET is a capability URL** | ✅ Fixed in code | Account-linked orders require owning auth; guests only for `userId`-less orders. | Was: leaked `ord_*` on owned orders. | Deploy. |
| M4 | **Overlays block UI** | Open | Cookie + 10% popup stacking. | Click friction. | One overlay at a time. |
| M5 | **Shop/home treat API failure as empty catalogue** | Open | No `isError` branch. | Outages look like no stock. | Error + retry CTA. |
| M6 | **Fake / synthetic ratings on some products** | Open | e.g. rating/reviewCount from seed. | Marketing/legal risk. | Zero out or hide stars. |
| M7 | **Encoding corruption in product names** | Open | `PokAcmon` etc. | Unprofessional. | Fix DB charset / re-save. |
| M8 | **`shippingAddress` optional on API** | ✅ Fixed in code | `checkoutInputSchema` requires `addressSchema`. | Was: API bypass. | Deploy. |
| M9 | **Register email enumeration** | Open | Verified email → 409. | Account discovery. | Uniform response. |
| M10 | **Uploads buffer full body before size check** | ✅ Fixed in code | Content-Length reject + `File.size` before `arrayBuffer` on sell/restoration/admin. | Was: memory spike. | Deploy. |
| M11 | **Free-shipping copy ignores SEK** | Open | Trust strip “Free over €75”. | Confusing for SEK. | Currency-aware copy. |
| M12 | **“Buy now” while purchases locked** | Open | Category cards. | Misleading CTA. | “Browse” until launch. |
| M13 | **Grading Submission is a stub** | Open | `/services/grading-submission`. | Dead-end. | Hide until ready. |
| M14 | **Shop loading mojibake** | Open | `Loadingâ€¦`. | Looks broken. | Fix UTF-8 string. |

---

## Low

| # | Finding | Evidence | Impact | Fix |
|---|---------|----------|--------|-----|
| L1 | Footer “Profiles” vs header “Socials” | Both → `/socials`. | Mild inconsistency. | Align labels. |
| L2 | Copy polish | Space before period in hero; `Båstad , Sweden`; restoration “monday–friday”. | Polish. | Trim / capitalize. |
| L3 | Auth pages lack unique title / page `h1` | Shared document title; login/register use `h3`. | SEO / a11y. | Per-route `<title>` + `h1`. |
| L4 | Sticky header can intercept form clicks after scroll | ~64px sticky header over submit. | Occasional miss-clicks. | `scroll-margin-top` on form controls. |
| L5 | Contact success still allows another submit | Form remains; button only gated by `isPending`. | Accidental doubles (API RL mitigates). | Hide/disable form after success. |
| L6 | Cart UI can show stale price/stock | Zustand snapshots; API re-prices at checkout. | Confusing UI totals (payment still correct). | Revalidate cart before checkout summary. |
| L7 | Weak password policy | Min 8 chars, no complexity. | Stuffing risk. | Stronger rules for admin; optional breach check. |
| L8 | JWT 7d, no server-side revocation | Logout is client-only. | Stolen token until expiry. | Shorter TTL / version claim / revoke on password reset. |
| L9 | Admin image upload trusts client Content-Type | Sell/restoration use magic bytes; admin path does not. | Weaker if admin JWT stolen. | Reuse magic-byte detection. |
| L10 | Rate-limiter Map never GC’s idle keys | In-memory Map grows with unique IPs. | Memory creep (esp. with spoofed IPs). | TTL eviction or Redis TTLs. |

---

## What held up well (live + code)

| Area | Result |
|------|--------|
| Contact / newsletter validation | Client + API reject empty/invalid (400 + field alerts) |
| Contact rate limit | 429 after burst; `Retry-After` returned |
| Login rate limit | 429 after ~20 attempts / 15 min window |
| Prelaunch purchase lock | UI disabled add-to-cart; API checkout **403** for non-admin |
| Client price tampering | Schema has no price field; server re-prices via `priceCartAsync` |
| Oversell qty 99999 | Rejected (400) — clamp works; reserve added in C2 |
| Admin routes | 401 without auth |
| CORS | Locked to `https://www.onemorerip.cards` |
| Page latency | Most pages ~80–300ms; home ~800ms cold |
| Concurrent products ×25 | All HTTP 200 (slower under load, not down) |
| XSS in contact name field | Treated as text; blocked by other field validation |
| Favorites (logged out) | Toast: sign in to save |
| Legal / Vault-style pages | Contact, shipping, returns, terms, privacy, cookies, FAQ linked from footer |
| Sell / restoration uploads | Magic-byte MIME + size caps; early Content-Length (M10) |
| Email HTML | User fields escaped |
| Stripe webhook signature | Verified when Stripe enabled |

---

## Suggested fix order (work together from here)

### Phase A — Must before unlocking purchases
1. [x] C1 — Real Stripe + webhook on **Railway**
2. [x] C2 + H5 — Stock reserve + release — **code done, deploy**
3. [x] C3 — Apex DNS (`onemorerip.cards` → www)
4. [x] C4 — Fail-fast production boot — **code done, deploy**
5. [x] M1 — Discount amounts match Stripe charge — **code done, deploy**

### Phase B — Abuse & scale
6. [~] H1 + H2 — H2 done; **H1: pin 1 API replica in shop Railway project**
7. [x] H3 + H4 — Rate-limit checkout, want-list, reviews
8. [x] H6 — Sanitize public health
9. [~] H7 — API headers done; **WWW HSTS/CSP still open**
10. [x] M3 — Tighten order GET ACL
11. [x] M8 — Require shipping address on API
12. [x] M10 — Early upload size rejection

### Phase C — UX / polish before / around launch day
13. [x] H8 + H9 — Code splitting + hero video / reduced-motion — **deploy**
14. [ ] H10 — Paginate products in SQL
15. [x] M2 — Webhook paid-email idempotency — **deploy**; still open: M4–M7, M9, M11–M14
16. [ ] Low items as time allows

### Phase D — Hard load test (prefer staging / local)
17. [ ] Concurrent checkout race with stock=1 (prove C2 fixed) — **after deploy**
18. [ ] Burst contact/auth/checkout rate limits across “many users”
19. [ ] Shop under parallel catalogue load

---

## Next actions (ops)

1. **Commit + push + Railway deploy** of local API fixes (stock, fail-fast, discounts, RL, health, headers, address, order ACL, uploads).
2. **Confirm** Railway API service is **1 replica** until Redis (H1).
3. After deploy: `GET /api/health` → `{status:ok}`; admin `GET /api/health/details` → `stripe:live`.
4. Optional: HSTS on www via Railway / hosting headers.
5. Do **not** flip `PURCHASES_LOCKED_UNTIL_LAUNCH` until Phase A verified on production + stock race test.

---

## Notes for our review

- Prelaunch lock **buys time** for Phase C, but forms/auth/uploads are already public (now better rate-limited / size-gated).
- Prefer verifying on staging (or local with Postgres) before production if possible.

---

## Changelog

| Date | Note |
|------|------|
| 2026-10-14 | Initial findings from production probes + code audits. |
| 2026-10-14 | C2 stock reserve/release + C4 `assertProductionEnv` implemented in repo. |
| 2026-10-14 | C1 Stripe live on Railway; C3 apex→www done. Phase B: H2–H7(partial), M1, M3, M8, M10 coded. |
| 2026-10-15 | Pushed Phase A/B API harden (`dc9e511`). Phase C: H8 lazy routes, H9 hero video, M2 webhook idempotency. |
