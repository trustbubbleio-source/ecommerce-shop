# Swish i butik — buildplan

Mål: erbjuda **Swish via Stripe** i den fysiska butiken, så att betalning, kvitto och dagskassa landar i samma Stripe-konto som kortköp.

Status: planerad (ingen Swish-kod ännu).

**Förarbete klart:** storefront/till/admin-listor defaultar till **SEK-visning** (katalog lagras fortfarande i EUR). Se `DEFAULT_DISPLAY_CURRENCY` i `packages/shared/src/currency.ts`.

## Beslut

| Fråga        | Val                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Betalväg     | **Stripe Swish** (inte privat Swish-nummer `073…`)                                                                              |
| Varför       | Alla intäkter syns i Stripe → enklare dagskassa / avslutad dag / refunds / kvitto                                               |
| Pris         | **1% + 3,00 kr** per lyckad Swish-betalning ([Stripe SE pricing](https://stripe.com/en-se/pricing/local-payment-methods#swish)) |
| Valuta       | **SEK endast** (Stripe Swish kräver `sek`)                                                                                      |
| Terminal     | **Nej** — Swish stöds inte som Terminal/Tap-to-Pay. Kunden skannar QR / öppnar Swish-appen                                      |
| Kort i butik | Oförändrat tills vidare (Stripe Dashboard-app / manuell korttagning). Swish blir ett **extra** val i till-flödet                |

Stripe är merchant of record: kunden ser Stripe som mottagare, ert företagsnamn i Swish **Meddelande**-fältet. Pengarna går till Stripe-saldo → payout till Swedbank. Ditt vanliga Swish-nummer används **inte**.

## Nuläge

| Del             | Idag                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Till-UI         | `apps/web/src/pages/admin/instore-sell.tsx` — “Sold in store?” → lager ner direkt                                            |
| API             | `POST /api/admin/products/:id/sell-in-store` — skapar `fulfilled` / `in_store`-order **utan** Stripe-session                 |
| Online checkout | `PaymentService.createCheckout` — hosted Checkout, **inga** `payment_method_types` (dynamic PMs), `invoice_creation.enabled` |
| Valuta          | Katalog lagras i **EUR**; **default-visning/checkout = SEK** (`DEFAULT_DISPLAY_CURRENCY`). EUR kvar som växel.               |
| Webhooks        | `checkout.session.completed` → `markPaidBySession` + kvitto/invoice-URL                                                      |

Problem: butiksförsäljning syns i er orderlista men **inte** som Stripe-betalning → ingen gemensam dagskassa för Swish/kort.

## Målflöde (butik)

```
Admin skannar produkt-QR
        ↓
Till-skärm: produkt + SEK-pris
        ↓
Välj betalning:  [ Kort (som idag) ]  [ Swish (Stripe) ]
        ↓ Swish
API skapar pending in_store-order (SEK) + reserverar lager
        ↓
Stripe Checkout Session (mode=payment, currency=sek)
        ↓
Admin visar session-URL / QR på telefonen
        ↓
Kund skannar med Swish-appen → BankID → betalar (≤ 3 min)
        ↓
Webhook checkout.session.completed
        ↓
Order → paid/fulfilled, invoice/receipt URL sparas, mejl om e-post finns
```

Om kunden avbryter / session går ut: `checkout.session.expired` → cancel + `releaseStock` (samma mönster som online).

## Stripe Dashboard (gör före kod-deploy)

1. Live-konto → [Payment methods](https://dashboard.stripe.com/settings/payment_methods) → aktivera **Swish**.
2. Acceptera [Swish terms](https://stripe.com/legal/swish) (factoring / merchant of record).
3. [Customer emails](https://dashboard.stripe.com/settings/emails) → slå på kvitton för lyckade betalningar.
4. Verifiera att payout går till rätt Swedbank-konto.
5. Testa i test mode först (Swish har test-approve/decline-sida).

Kontrollera också MCC / restricted categories om Swish inte går att aktivera (TCG-butik är normalt OK; “Gift/Card/Novelty” kan vara _restricted_).

## Arkitektur (kod)

### Princip

Återanvänd **Checkout Sessions + webhooks** — samma mönster som online. Undvik `payment_method_types: ['swish']` i API-anrop; låt dynamic payment methods styra. Sessionen är i **SEK**, så Swish blir relevant.

För butik: begränsa gärna till Swish-fokuserad upplevelse via Dashboard **payment method configuration** (t.ex. config “In-store Swish”) och `payment_method_configurations` på sessionen — **inte** hårdkodad `payment_method_types`.

### Föreslagna ändringar

#### 1. Shared

- Utöka `sellInStoreInputSchema` (eller ny schema) med:
  - `paymentMethod: 'card_manual' | 'swish'` (default `card_manual` = dagens beteende)
  - valfri `customerEmail` (för Stripe-kvitto)
- Prissättning: butiks-Swish **alltid SEK** via `convertFromEur(product.price, 'sek')` (samma `EUR_TO_SEK` som webb).

#### 2. API — `PaymentService`

- Ny metod t.ex. `createInstoreSwishCheckout(order)`:
  - `mode: 'payment'`
  - `line_items` i `sek`
  - `success_url` / `cancel_url` → admin till-sidor (t.ex. `/admin/instore/:slug/paid?order_id=…` respektive cancel)
  - `metadata`: `orderId`, `channel: in_store`
  - `payment_intent_data.metadata` samma
  - `invoice_creation.enabled: true`
  - valfritt `customer_email`
  - valfritt `payment_method_options.swish.reference` = order-id (1–35 tecken, a-z0-9-)
  - valfritt `payment_method_configurations` = in-store-config id från env
  - **ingen** `payment_method_types`

#### 3. API — admin route

Dela `sell-in-store` i två spår:

| `paymentMethod` | Beteende                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `card_manual`   | Som idag: reserve stock, `fulfilled` / `in_store`, ingen Stripe-session                                                                                |
| `swish`         | reserve stock, skapa order `pending` + `channel: in_store`, `createInstoreSwishCheckout`, `attachSession`, returnera `{ order, product, checkoutUrl }` |

Viktigt: vid Swish ska **inte** order bli `fulfilled` innan webhook. Antingen:

- `pending` → webhook sätter `paid` och ni sätter `fulfillmentStep: delivered` / `fulfilled` i samma handler för `channel === 'in_store'`, **eller**
- ny statusväg som redan finns — spegla online men hoppa shipping.

Rekommendation: `pending` tills webhook, sedan `fulfilled` + `fulfillmentStep: 'delivered'` för `in_store`.

#### 4. Webhooks

Utöka `checkout.session.completed`-hanteraren:

- Om order.channel === `in_store` → markera `fulfilled` (inte bara `paid`) och skippa shippingspecifik logik.
- Behåll invoice/receipt-upplösning och ev. e-post.
- `checkout.session.expired` fungerar redan för pending + release stock — verifiera att in_store-ordrar går samma väg.

#### 5. Web — till-UI

På `AdminInstoreSellPage`:

1. Visa pris i **SEK** (och gärna EUR som sekundär rad).
2. Efter “Yes” / direkt: två knappar:
   - **Kort** → nuvarande `adminSellInStore` (card_manual)
   - **Swish** → anropa API med `paymentMethod: 'swish'`, öppna `checkoutUrl` (ny flik eller samma) / visa QR
3. Polling eller “Jag har betalat”-vy som refetchar orderstatus tills `fulfilled`/`paid` (webhook är source of truth; knappen är bara UX).
4. Vid timeout/cancel: visa “Betalning avbruten — lager återställt” om order cancelled.

Enkel v1: `window.location.assign(checkoutUrl)` på adminens telefon. Stripe Checkout desktop visar Swish-QR som kunden skannar. Det räcker för butik.

#### 6. Env

```bash
# valfritt — egen payment method configuration i Dashboard
STRIPE_INSTORE_PAYMENT_METHOD_CONFIG=pmc_...
CHECKOUT_INSTORE_SUCCESS_URL=https://.../admin/instore/paid
CHECKOUT_INSTORE_CANCEL_URL=https://.../admin/instore/cancel
```

### API-klient

- Utöka `api.adminSellInStore` (eller ny `adminStartInstoreSwish`) så web får `checkoutUrl`.

## Faser

### Fas 0 — Konto (0 kod)

- [ ] Aktivera Swish i live + test Dashboard
- [ ] Acceptera villkor
- [ ] Slå på automatiska kvitton
- [ ] Bekräfta SEK som presentment där det behövs

### Fas 1 — Backend Swish till-session

- [ ] Schema + SEK-prissättning för in_store Swish
- [ ] `createInstoreSwishCheckout`
- [ ] Dela `sell-in-store` (card_manual vs swish)
- [ ] Webhook: in_store → fulfilled efter betald
- [ ] Tester: hermetiska API-tester med fake Stripe (samma DI-mönster)

### Fas 2 — Till-UI

- [ ] Val Kort / Swish
- [ ] Redirect till Checkout / visa länk
- [ ] Success/cancel-vyer för admin
- [ ] Visa SEK-pris tydligt

### Fas 3 — Drift & dagskassa

- [ ] Dokumentera: Stripe Dashboard → Payments, filtrera dagens datum = dagskassa
- [ ] (Senare, valfritt) Admin-sida “Dagens försäljning” som listar dagens Stripe-kopplade ordrar
- [ ] Utbilda i butik: Swish = QR på telefonen, 3 minuters fönster

### Utanför scope (medvetet)

- Koppla privat Swish-nummer till Stripe
- Stripe Terminal för Swish
- Ersätta manuell korttagning i Stripe-appen (kan komma senare)
- Swish på **webbcheckout** (nästan gratis vinst senare: aktivera samma PM + SEK-checkout — egen liten uppgift)

## Tester

| Case                                | Förväntat                                                       |
| ----------------------------------- | --------------------------------------------------------------- |
| Swish sell happy path (mock Stripe) | pending order + session id; webhook → fulfilled, stock reserved |
| Expire / cancel                     | stock released, order cancelled                                 |
| card_manual oförändrad              | fulfilled direkt, ingen session                                 |
| Otillräckligt lager                 | 409, ingen session                                              |
| Inactive product                    | 409                                                             |
| Belopp                              | SEK öre = `convertFromEur(eurCents, 'sek')`                     |
| UI                                  | Swish-knapp synlig; Kort-väg oförändrad                         |

## Risker & fallgropar

1. **Lager före betalning** — måste vara reservation + release vid expire (som online), inte fulfilled direkt.
2. **EUR vs SEK** — visa alltid vad kunden ska swisha i kronor.
3. **Dubbel försäljning** — admin får inte trycka “Kort/Swish” två gånger för samma fysiska vara utan att förstå stock.
4. **3 minuters timeout** — Swish kräver snabb BankID; ha tydlig UI.
5. **Avgift** — 1% + 3 kr; acceptera som kostnad för gemensam kassa.
6. **Kvittot** — Stripe-kvitto kräver e-post (samla i till-UI eller skicka manuellt från Dashboard).

## Referenser

- [Swish overview](https://docs.stripe.com/payments/swish)
- [Accept Swish (Checkout)](https://docs.stripe.com/payments/swish/accept-a-payment?payment-ui=checkout)
- [Receipts](https://docs.stripe.com/receipts)
- [Dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods)
- Intern research: `buildplan.md` (rå Stripe-docs-paste; denna fil är den verkställande planen)

## Klart när

1. Admin kan välja **Swish** på till-sidan för en produkt i lager.
2. Kund betalar via Swish-QR (Stripe Checkout).
3. Order blir fulfilled först efter lyckad betalning.
4. Betalningen syns i Stripe Dashboard samma dag som kortköp.
5. Kvitto/invoice-URL finns på ordern (och mejl om e-post angavs).
6. Avbruten/utgången session återställer lager.

---

**Nästa steg efter godkänd plan:** implementera Fas 1 + 2 i ordning (backend först, sedan till-UI).
