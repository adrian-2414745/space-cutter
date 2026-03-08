# Step 1 — Mobile Detection Plumbing

## What the Tester Verifies

Open the game on a mobile device. Open the browser console — verify `isMobile: true` is logged. On desktop, verify `isMobile: false`. No visible change to the game; no regressions on desktop or mobile.

---

## Files Changed

### `js/mobile.js` *(new file)*

Create this file as the single source of truth for mobile detection and sizing utilities.

```js
export const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/**
 * Compute mobile-specific visual sizing, locked at game-start.
 * @param {number} rectWidth - the original rectangle width in canvas pixels
 * @returns {{ scissorsSize: number, ballRadius: number, cornerSnapPx: number }}
 */
export function computeMobileSizing(rectWidth) {
  return {
    scissorsSize: Math.round(rectWidth * 0.05),
    ballRadius:   Math.round(rectWidth * 0.05),
    cornerSnapPx: Math.round(rectWidth * 0.02),
  };
}
```

### `js/main.js`

Add the import and a console log at the top:

```js
import { isMobile, computeMobileSizing } from './mobile.js';
// ...existing imports...

console.log('isMobile:', isMobile);
```

No other changes yet.

---

## Key Details

- `isMobile` is evaluated once at module parse time. `window` is available at that point.
- Do NOT use `userAgent` sniffing — the touch-capability check is the spec requirement.
- `computeMobileSizing` is defined here but not called yet; it will be called in Step 3 after `resizeCanvas()` sets the mobile canvas dimensions.
- `mobile.js` has zero DOM dependencies — safe to import from any module without ordering concerns.
