# One More Rip --- Kiosk Mode

## 1. Target hardware and display

Setting Value

---

Display Beetronics 32TS7M, 32-inch touchscreen (assumed model)
Native resolution (landscape) 1920 × 1080
Target resolution (portrait) 1080 × 1920
Aspect ratio 9:16
Windows display orientation Portrait
Windows display scaling 100%
Browser zoom 100%
Target device pixel ratio 1
Input Touchscreen
Approximate enclosure dimensions 44 × 74.5 cm (width × height)

Confirm the exact display model and native resolution in Windows before deployment. At 125% scaling, the effective fullscreen CSS viewport is approximately 864 × 1536 px.

## 2. Architecture

- Dedicated route: `/kiosk` on `https://www.onemorerip.cards`.
- Separate kiosk layout and navigation from the regular storefront.
- Reuse existing product APIs, inventory and pricing data.
- MVP is read-only: browsing, searching and viewing product details. No checkout or login.
- Do not expose administrative functionality or customer information.
- Optimize for 1080 × 1920 CSS pixels without hardcoding the entire layout to that size.

## 3. UI design tokens

Component Recommended size

---

Header 100--120 px
Search field 70--80 px
Buttons 64--80 px
Main headings 40--48 px
Subheadings 28--32 px
Body text 22--26 px
Product name 24--28 px
Product price 28--32 px
Page padding 24--32 px
Grid gap 24 px
Product grid 3 columns at target viewport

These are initial design recommendations, not fixed requirements. Validate readability and reachability on the physical screen. Avoid hover-only interactions and place frequently used controls within comfortable reach.

## 4. CSS layout baseline

```css
.kiosk-layout {
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.kiosk-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px;
}

.kiosk-product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

@media (max-width: 800px) {
  .kiosk-product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

Include the standard viewport meta tag and preserve accessibility. Avoid horizontal overflow. Keep scrolling within the intended content area.

## 5. MVP functional requirements

- [ ] Dedicated kiosk homepage and navigation.
- [ ] Large product images and consistent product-card alignment.
- [ ] Touch-friendly search and on-screen keyboard support.
- [ ] Filters by Pokémon, set and product category.
- [ ] Current prices and inventory status using existing backend data.
- [ ] Product detail view with a clear back/home action.
- [ ] Return to homepage after 60 seconds of inactivity (configurable); clear search and filters.
- [ ] Fullscreen presentation without browser address bar.
- [ ] Loading, empty-result and network-error states.
- [ ] No customer login, checkout or admin access in the kiosk UI.

## 6. Chrome DevTools test profile

Setting Value

---

Device name One More Rip Kiosk
Width 1080
Height 1920
Device pixel ratio 1
Device type Desktop (touch)

Also test at 864 × 1536 to accommodate alternative Windows scaling. Device emulation does not replace physical touchscreen testing.

## 7. Deployment and acceptance checklist

- [ ] Set Windows to portrait orientation and native resolution.
- [ ] Set Windows scaling and browser zoom to 100%.
- [ ] Verify touch coordinates align with the rotated display.
- [ ] Configure browser/OS kiosk mode to launch `/kiosk` in fullscreen.
- [ ] Verify customers cannot access the desktop or other applications through the kiosk; fullscreen alone is not a security boundary.
- [ ] Test scrolling, tapping, keyboard input and inactivity reset.
- [ ] Verify prices and inventory against the storefront.
- [ ] Test network interruption and recovery.
- [ ] Confirm the actual viewport using `window.innerWidth`, `window.innerHeight` and `window.devicePixelRatio`.

## 8. Assumptions and implementation decisions

The display model is assumed to be 32TS7M based on prior project context. Three columns, a 60-second inactivity timeout, the responsive breakpoint and the `/kiosk` route are proposed defaults. Adjust after testing on the physical display. No existing project source code has been inspected or modified.
