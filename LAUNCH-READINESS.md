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
| H1 | **Rate limiter is in-memory per process** | ✅ Ops (2026-10-15) | API + web scaled to **1 replica** (EU West) via Railway CLI. | — | Add Redis/Upstash before scaling past 1. |
| H2 | **Client IP from first `X-Forwarded-For` spoofable** | ✅ Fixed in code | `clientIp()` prefers `x-real-ip` / CF, else **rightmost** XFF hop. | Was: bypass RL. | Deploy with H3/H4. |
| H3 | **Checkout has no rate limit** | ✅ Fixed in code | `rateLimit(..., 'checkout')` — 10 / 15 min. | Was: spam sessions. | Deploy. |
| H4 | **Want-list / reviews lack rate limits** | ✅ Fixed in code | Presets `wantList` / `reviews` — 10 / hour. | Was: mail/review spam. | Deploy. |
| H5 | **No inventory hold between checkout and pay** | ✅ Fixed with C2 | Soft-reserve at session create; release on cancel/expire/refund. | — | Deploy C2. |
| H6 | **`GET /api/health` discloses modes** | ✅ Fixed in code | Public `{ status: "ok" }`; `/health/details` admin-only. | Was: mock/misconfig leak. | Deploy. |
| H7 | **Missing security headers** | ✅ Fixed | API headers + web `server.mjs` HSTS/CSP/COOP. | Was: www lacked HSTS/CSP. | Deploy web (Node static server). |
| H8 | **Eager JS ships all routes including admin** | ✅ Fixed in code | Admin / legal / account / services lazy-loaded via `React.lazy`. | — | Deploy web. |
| H9 | **Home hero video cost** | ⏪ Reverted | Autoplay loop restored (in-view/poster change hid video on prod). | — | Revisit reduced-motion later without breaking autoplay. |
| H10 | **Full catalog loaded then filtered in memory** | ✅ Fixed in code | Prisma `listPage` uses WHERE/ORDER/LIMIT; search via SQL ILIKE; list indexes added. | — | Deploy (migration runs on API preDeploy). |

---

## Medium

| # | Finding | Status | Evidence | Impact | Fix |
|---|---------|--------|----------|--------|-----|
| M1 | **Discount vs Stripe amount mismatch** | ✅ Fixed in code | `orderDiscountCents` → one-time Stripe coupon on session. | Was: overcharge with profile discount. | Deploy. |
| M2 | **Webhook paid-email race** | ✅ Fixed in code | `markPaidBySession` atomic pending→paid; emails only on transition. | — | Deploy API. |
| M3 | **Guest order GET is a capability URL** | ✅ Fixed in code | Account-linked orders require owning auth; guests only for `userId`-less orders. | Was: leaked `ord_*` on owned orders. | Deploy. |
| M4 | **Overlays block UI** | ✅ Fixed | Signup prompt waits for cookie ack. | Was: stacked overlays. | Deploy web. |
| M5 | **Shop/home treat API failure as empty catalogue** | ✅ Fixed | `ProductGrid` error + retry on shop/home. | Was: outages looked like no stock. | Deploy web. |
| M6 | **Fake / synthetic ratings on some products** | Open | e.g. rating/reviewCount from seed. | Marketing/legal risk. | Zero out or hide stars. |
| M7 | **Encoding corruption in product names** | ✅ Verified + guarded | Prod DB scan: 0 corrupted rows. `repairMojibakeText` on product map. | Was: `PokAcmon`/mojibake risk. | Deploy API. |
| M8 | **`shippingAddress` optional on API** | ✅ Fixed in code | `checkoutInputSchema` requires `addressSchema`. | Was: API bypass. | Deploy. |
| M9 | **Register email enumeration** | ✅ Fixed | Verified email now returns same 201 as new signup. | Was: 409 revealed accounts. | Deploy API. |
| M10 | **Uploads buffer full body before size check** | ✅ Fixed in code | Content-Length reject + `File.size` before `arrayBuffer` on sell/restoration/admin. | Was: memory spike. | Deploy. |
| M11 | **Free-shipping copy ignores SEK** | ✅ Fixed | Home trust strip + product-detail bullet use `formatMoney(FREE_SHIPPING_THRESHOLD)`. | Was: hardcoded €75 / $75. | Deploy web. |
| M12 | **“Buy now” while purchases locked** | ✅ Fixed | Category CTAs show “Browse” during prelaunch. | Was: misleading Buy now. | Deploy web. |
| M13 | **Grading Submission is a stub** | Open | `/services/grading-submission`. | Dead-end. | Hide until ready. |
| M14 | **Shop loading mojibake** | ✅ Fixed | Shop now uses `Loading…`. | Was: `Loadingâ€¦`. | Deploy web. |

---

## Low

| # | Finding | Status | Evidence | Impact | Fix |
|---|---------|--------|----------|--------|-----|
| L1 | Footer “Profiles” vs header “Socials” | ✅ Fixed | `SOCIALS_NAV` label → `Socials`. | Mild inconsistency. | Deploy web. |
| L2 | Copy polish | ✅ Fixed | Hero period in gradient span; socials spacing; restoration keeps `supportHours` casing. | Polish. | Deploy web. |
| L3 | Auth pages lack unique title / page `h1` | ✅ Fixed | `usePageTitle` + `<h1>` on login/register/forgot/reset. | SEO / a11y. | Deploy web. |
| L4 | Sticky header can intercept form clicks after scroll | ✅ Fixed | Global `scroll-margin-top: 5.5rem` on form controls. | Occasional miss-clicks. | Deploy web. |
| L5 | Contact success still allows another submit | ✅ Fixed | Form replaced by success + optional “Write again”. | Accidental doubles. | Deploy web. |
| L6 | Cart UI can show stale price/stock | ✅ Fixed | `reconcile` + `useReconcileCart` on cart/checkout. | Confusing UI totals. | Deploy web. |
| L7 | Weak password policy | ✅ Fixed | Shared `passwordSchema`: 8+ with letter + digit. | Stuffing risk. | Deploy API+web. |
| L8 | JWT 7d, no server-side revocation | Open (post-launch) | Logout is client-only. | Stolen token until expiry. | Shorter TTL / version claim / revoke on password reset. |
| L9 | Admin image upload trusts client Content-Type | ✅ Fixed | `StorageService` uses `detectProductImageMime` magic bytes. | Weaker if admin JWT stolen. | Deploy API. |
| L10 | Rate-limiter Map never GC’s idle keys | ✅ Fixed | Opportunistic idle-key GC every 64 checks. | Memory creep. | Deploy API. |

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
6. [x] H1 + H2 — H2 done; API+web pinned to **1 replica**
7. [x] H3 + H4 — Rate-limit checkout, want-list, reviews
8. [x] H6 — Sanitize public health
9. [x] H7 — API + www HSTS/CSP via web `server.mjs`
10. [x] M3 — Tighten order GET ACL
11. [x] M8 — Require shipping address on API
12. [x] M10 — Early upload size rejection

### Phase C — UX / polish before / around launch day
13. [x] H8 + H9 — Code splitting + hero video / reduced-motion
14. [x] H10 — Paginate products in SQL — **deploy**
15. [x] M2 — Webhook paid-email idempotency; still open: **M6, M13** (deferred by choice)
15b. [x] M5 + M7 + M14 — catalogue error/retry, encoding guard, loading ellipsis
15c. [x] M4 + M11 + M12 — overlay stacking, currency free-shipping copy, Browse CTA
15d. [x] M9 register enumeration + H7 www HSTS/CSP
16. [ ] Low items as time allows

### Phase D — Hard load test (prefer staging / local)
17. [x] Concurrent checkout race with stock=1 — covered by API `checkout.test` reserve race
18. [x] Burst contact/auth/checkout rate limits — **local 2026-10-19** (see below)
19. [x] Shop under parallel catalogue load — **local + mild prod 2026-10-19**

#### Phase D results (2026-10-19)

Script: `scripts/phase-d-burst.mjs` · raw JSON: `scripts/results/phase-d-burst-*.json`

| Probe | Target | Result | Latency |
|-------|--------|--------|---------|
| Contact POST ×8 (limit 5/15m) | local `:4000` | **429** after 5 (bodies were 502 — local email/Resend not live; RL still counted) | p95 ~556ms |
| Login POST ×25 (limit 20/15m) | local | 20×401 then **429** | p95 ~1.4s |
| Checkout POST ×14 (limit 10/15m) | local | 10×400 then **429** | p95 ~23ms |
| Products GET ×40 @ concurrency 20 | local | **40/40 200** | p95 ~1.2s |
| Products GET ×25 @ concurrency 10 | **prod** | **25/25 200** | p95 **429ms** |
| Products `/meta` ×10 | **prod** | **10/10 200** | p95 **165ms** |

**Verdict:** Rate limits fire as designed. Prod catalogue stays healthy under mild parallel load. No code change required from this run.

**Not done on prod (intentional):** contact/auth/checkout bursts (would spam mail / Stripe / lockouts).

#### Browser prod smoke (2026-10-19)

Live crawl of `https://www.onemorerip.cards` + guest checkout API probe.

| Check | Result |
|-------|--------|
| Home (Browse CTA, SEK free-shipping strip) | OK |
| Shop catalogue (147 products, add disabled) | OK |
| Category filter `?category=booster-box` | OK (7 products) |
| Search dialog (“Charizard” → SEK result) | OK |
| Product detail + purchase lock CTA | OK |
| Empty cart | OK |
| Contact form (chat hidden) | OK |
| Login (chat hidden) | OK |
| Web HSTS + CSP headers | OK |
| Guest `POST /api/checkout` | **403** `Purchases open October 31, 2026.` |

**Polish leftovers from smoke:** fixed in code (product `$75` → `formatMoney`; footer copyright template string). Redeploy web to verify on prod.

**Not done:** admin signed-in smoke checkout (needs credentials).

---

## Next actions (ops)

1. Do **not** flip `PURCHASES_LOCKED_UNTIL_LAUNCH` until you’re happy with remaining polish + a quick smoke checkout as admin.
2. Keep API at **1 replica** until Redis (H1).

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
| 2026-10-15 | H1: API+web → 1 replica. H10: SQL product list/paging + indexes. Phase D stock race covered in unit tests. |
| 2026-10-16 | M5 catalogue error+retry; M14 shop Loading…; M7 prod encoding scan clean + repairMojibakeText guard. |
| 2026-10-16 | M4 cookie→signup overlay gate; M11 currency free-shipping strip; M12 Browse CTA while locked. |
| 2026-10-16 | M9 uniform register response; H7 www Node static server with HSTS/CSP. |
| 2026-10-19 | Phase D: local RL bursts OK; mild prod shop load 25/25 + meta 10/10. |
| 2026-10-19 | Browser prod smoke: shop/search/lock/headers OK; leftover product `$75` copy + footer spacing. |
| 2026-10-19 | Fixed product free-shipping currency copy + footer copyright whitespace. |
| 2026-10-19 | Fixed L1–L7, L9–L10 (skip L8 JWT revoke until post-launch). |
