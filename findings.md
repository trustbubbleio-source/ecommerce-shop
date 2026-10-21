# Next up — pre-launch list

Previous checkout / admin / notification findings are done (country dropdown, cart after Stripe cancel, success-page email copy, One More Rip From name, hide pending orders, admin products search, carrier below threshold, order notification bell). DB migration for notifications is applied; deploy when Railway is stable.

---

## Must do before public launch

1. Flip `PURCHASES_LOCKED_UNTIL_LAUNCH` on launch day (and update any “opens Oct 31” copy if needed).

2. ~~Checkout: Terms + Returns acceptance checkbox~~ **Done**

3. ~~Newsletter consent + unsubscribe~~ **Done** (run DB migrations: zero seed ratings + newsletter unsubscribe token)

4. ~~Product ratings: zero seed stars / hide empty ratings~~ **Done** (apply rating zeroing migration on prod)

5. Ops smoke-test once (not code): Stripe live + webhook, Resend DNS, support/`returns@` inboxes, cancel → refund path, one real paid order end-to-end.

---

## High complaint risk (fix / clarify soon)

6. ~~PDP returns copy vs sealed/opened~~ **Done**

7. ~~Dispatch email when handed to carrier~~ **Done**

8. Age 18+ checkbox at checkout — **skipped** (covered by Terms acceptance; no separate checkbox)

---

## Nice to have (not launch blockers)

9. ~~SEO: `robots.txt`, sitemap, per-page titles / Open Graph~~ **Done**

10. ~~Analytics only after real cookie consent categories~~ **Done** (set `VITE_PLAUSIBLE_DOMAIN` when ready)

11. ~~Dedicated Imprint / company page~~ **Done** (`/imprint`)

12. ~~EU standard withdrawal form PDF~~ **Done** (`/eu-withdrawal-form.pdf`, linked from Returns)

---

## Launch-day reminder

- Deploy API + web after Railway is healthy.
- Unlock purchases.
- Watch first orders: stock, emails (store + Stripe), fulfillment notifications.
- Optional: set `VITE_PLAUSIBLE_DOMAIN=www.onemorerip.cards` on the web service once Plausible is configured.
