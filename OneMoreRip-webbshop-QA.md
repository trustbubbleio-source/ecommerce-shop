# One More Rip – QA och implementationsunderlag

**Testunderlag från 21 november 2026** · www.onemorerip.cards  
**Status:** Implementerat i kod (21 november 2026). Omtest på fysisk mobil återstår.

Sex ärenden från manuell genomgång av webbshoppen. Prioriteringen är ett förslag utifrån kundpåverkan. Mobilmodell, operativsystem och webbläsare per observation är ännu okända. Anteckna dem vid omtest på respektive mobil.

## OMR-001 · Produktbilder och köpknappar linjerar ojämnt

**Omfattning:** Produktlistan på mobil och desktop. **Föreslagen prioritet:** Medel.  
**Status:** Fixad i `ProductCard` — kortet är `h-full`, bildytan har fast `aspect-[5/7]`, betygsraden reserverar alltid samma höjd, och Add to cart ligger i `mt-auto`.

**Återskapa:** Öppna Buy och jämför ett löskort utan betyg med en produkt som visar recensionsstjärnor på samma rad.

**Observerat:** Betygsraden tar plats på den ena produkten. På löskortet försvinner motsvarande utrymme och Add to cart hamnar på en annan höjd. Även bildernas placering upplevs som ojämn.

**Acceptanskriterier**

- [ ] Bildytornas överkanter linjerar inom varje rad och bilderna behåller sina proportioner.
- [ ] Add to cart ligger längst ner på samma höjd för båda produkterna. Kontrollera även med en titel som bryts över två rader.
- [ ] Verifiera samma blandning av produkter på mobil och desktop.

## OMR-002 · Sökfältet på Buy zoomar in hela sidan

**Omfattning:** Mobil. **Föreslagen prioritet:** Hög, eftersom förstoringen kvarstår när kunden ska bläddra bland resultaten.  
**Status:** Fixad via gemensam `Input`-stil (`text-base md:text-sm`) så iOS inte auto-zoomar. Manuell pinch-zoom är oförändrad (`viewport` utan `maximum-scale`).

**Återskapa:** Öppna Buy vid normal zoom, tryck i Search, skriv ett produktnamn och genomför sökningen.

**Observerat:** Sidan zoomar in när tangentbordet öppnas och förblir inzoomad efter sökningen.

**Acceptanskriterier**

- [ ] Tangentbordet öppnas och sökfältet går att använda vid den zoomnivå kunden redan har valt.
- [ ] Resultaten visas vid samma zoomnivå när sökningen skickas och tangentbordet stängs.
- [ ] Kunden kan fortfarande zooma manuellt med två fingrar.

## OMR-003 · Sökfältet i toppmenyn utlöser samma zoom

**Omfattning:** Mobil. **Föreslagen prioritet:** Hög, eftersom detta också påverkar webbshoppens gemensamma sökingång.  
**Status:** Samma gemensamma `Input`-fix som OMR-002 (header-sök använder samma komponent).

**Återskapa:** Öppna sökningen i toppmenyn, tryck i fältet, skriv ett sökord och genomför sökningen. Upprepa och stäng söket utan att skicka.

**Observerat:** Samma automatiska inzoomning och kvarstående förstoring rapporteras här som på Buy.

**Acceptanskriterier**

- [ ] Sidan behåller kundens zoomnivå när fältet får fokus, när resultaten visas och när söket stängs.
- [ ] Manuell zoom med två fingrar fungerar även efter att söket har stängts.

Undersök om sökfälten delar komponent eller stilmall. Om en gemensam ändring löser båda ärendena ska båda sökvägarna ändå testas på varje mobil.

## OMR-004 · Byt knapptext till Category på Buy

**Omfattning:** Mobilvyn av Buy. **Föreslagen prioritet:** Låg.  
**Status:** Fixad — mobilknappen heter **Category** (`aria-label`: Open category filters). Sheet-titeln är kvar som Filters eftersom panelen innehåller fler filter än kategori.

**Nuläge före fix:** Öppna Buy på mobilen. Knappen för att välja kategori hette **Filters**.

**Acceptanskriterier**

- [ ] Knappens synliga text är exakt **Category**.
- [ ] Tryck på knappen, välj en kategori och kontrollera att produktlistan visar det valda urvalet.

## OMR-005 · Ersätt Klarna med Google Pay i sidfoten

**Omfattning:** Sidfoten på mobil och desktop. **Föreslagen prioritet:** Medel, eftersom ikonen ger kunden fel besked om betalalternativen.  
**Status:** Fixad i `PaymentMethods` — Klarna borttaget, Google Pay tillagt med tillgänglig etikett.

**Nuläge före fix:** Scrolla till sidfoten. Klarna visades bland betalmetoderna trots att One More Rip inte erbjuder Klarna.

**Acceptanskriterier**

- [ ] Google Pay visas på den plats där Klarna visas i dag. Kontrollera att även eventuell tillgänglig etikett avser Google Pay.
- [ ] Klarna är borttaget från sidfotens betalmetoder. Google Pay linjerar med övriga ikoner på båda skärmstorlekarna.

## OMR-006 · Bevara beskrivningens formatering från admin till produktsidan

**Omfattning:** Add product, redigering och produktdetaljsidan. **Föreslagen prioritet:** Medel.  
**Status:** Fixad på produktsidan med `whitespace-pre-line` så sparade radbrytningar och stycken syns. Admin-textarea och API behåller radbrytningar (zod `.trim()` tar bara ytterkanter). Befintliga produkter som redan sparats utan radbrytningar behöver uppdateras manuellt i admin om texten ska styckas om.

**Observerat:** Beskrivningen ser hopslagen ut på produktsidan. Det återstår att kontrollera om ordmellanrum, radbrytningar eller stycken försvinner och i vilket steg det sker.

**Återskapa:** Ange följande text i Add product för en testprodukt. Spara, öppna produkten igen i admin och jämför sedan med kundvyn.

```text
Japanskt Pokémon-boosterpaket.
Språk: japanska.

Förpackningen innehåller ett boosterpaket.
```

**Acceptanskriterier**

- [ ] Orden har kvar sina mellanrum. Språkuppgiften börjar på en egen rad och sista meningen bildar ett separat stycke.
- [ ] Upprepa efter redigering. Innehåll och formatering motsvarar den senast sparade beskrivningen.
- [ ] Kontrollera även en befintlig berörd produkt. Om formatering redan har gått förlorad i lagrad text, dokumentera vilken beskrivning som behöver korrigeras.

## Omtest

Fyll i enhetsuppgifterna och markera varje relevant ruta med Godkänd eller Underkänd. Vid underkänt, ange produkt eller sida samt vilket acceptanskriterium som föll.

| Testmiljö | Modell, OS och webbläsare | 001 | 002 | 003 | 004 | 005 | 006 |
|---|---|---|---|---|---|---|---|
| Mobil 1 | | | | | | | |
| Mobil 2 | | | | | | | |
| Desktop | | | Ej aktuellt | Ej aktuellt | Ej aktuellt | | |
