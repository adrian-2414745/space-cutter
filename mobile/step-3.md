# Step 3 — Canvas Auto-Sizing + Mobile Config Defaults

## What the Tester Verifies

On mobile:
- Canvas fills all available space between the HUD and the button row
- Starting a game: the rectangle and balls render at the correct scale for the screen
- Default timer is **240s** (was 180s)
- Default ball speed is **120** (was 150)
- Config panel shows correct mobile defaults when opened

On desktop: canvas size is completely unchanged (same `Math.max(600, ...)` behavior).

---

## Files Changed

### `js/config.js`

1. Import `isMobile`:
   ```js
   import { isMobile } from './mobile.js';
   ```

2. Add mobile defaults and branch the initial config:
   ```js
   const MOBILE_DEFAULTS = {
     ...DEFAULTS,
     timerDuration: 240,
     ballSpeed:     120,
     // cornerSnapDistance is overridden dynamically in main.js after canvas sizing
   };

   export const config = isMobile ? { ...MOBILE_DEFAULTS } : { ...DEFAULTS };
   ```

3. In `loadConfigFromPanel()` — guard the rect dimension reads so mobile-computed values are never overwritten by the hidden inputs:
   ```js
   if (!isMobile) {
     config.rectWidth  = Math.max(600, parseInt(inputs.rectWidth.value)  || 600);
     config.rectHeight = Math.max(400, parseInt(inputs.rectHeight.value) || 400);
   }
   ```

4. In `resetConfigToDefaults()` — reset to `MOBILE_DEFAULTS` on mobile:
   ```js
   const defaults = isMobile ? MOBILE_DEFAULTS : DEFAULTS;
   Object.assign(config, defaults);
   applyConfigToPanel();
   ```

### `js/main.js`

1. Add a mobile canvas padding constant alongside the existing one:
   ```js
   const CANVAS_PADDING        = 40;  // existing — desktop
   const MOBILE_CANVAS_PADDING = 16;  // new — mobile interior padding
   ```

2. Modify `resizeCanvas()` to branch on `isMobile`:
   ```js
   function resizeCanvas() {
     if (isMobile) {
       const hud      = document.getElementById('hud');
       const controls = document.getElementById('controls');
       const hudH     = hud.getBoundingClientRect().height  || 44;
       const ctrlH    = controls.getBoundingClientRect().height || 52;
       const gaps     = 16; // breathing room between sections

       canvas.width  = window.innerWidth;
       canvas.height = Math.max(200, window.innerHeight - hudH - ctrlH - gaps);

       // Keep config in sync so createInitialRectangle works unchanged
       config.rectWidth  = canvas.width  - MOBILE_CANVAS_PADDING * 2;
       config.rectHeight = canvas.height - MOBILE_CANVAS_PADDING * 2;
     } else {
       canvas.width  = Math.max(600, config.rectWidth  + CANVAS_PADDING * 2);
       canvas.height = Math.max(400, config.rectHeight + CANVAS_PADDING * 2);
     }
   }
   ```

3. Add a module-scope variable for mobile sizing and compute it after `resizeCanvas()` is called. Create a helper to apply it at (re)start:
   ```js
   import { isMobile, computeMobileSizing } from './mobile.js';

   let mobileSizing = null;

   function applyMobileSizing() {
     if (!isMobile) return;
     mobileSizing = computeMobileSizing(config.rectWidth);
     config.cornerSnapDistance = mobileSizing.cornerSnapPx;
   }
   ```

4. Call `applyMobileSizing()` in two places:
   - Right after the initial `resizeCanvas()` call at startup
   - Inside the `onReset` callback (which is called after Save Config and after Reset button), right after `resizeCanvas()` is called there

---

## Key Details

- `resizeCanvas()` **mutates** `config.rectWidth/Height` on mobile. This means `createInitialRectangle(config, canvas.width, canvas.height)` still works unchanged — it reads the updated config values.
- `window.innerHeight` on iOS is measured with the browser address bar visible. When the bar collapses, `innerHeight` increases. Since canvas is sized once at load (per spec), the initial sizing uses the conservative height. This is the intended behavior.
- `getBoundingClientRect()` is called after DOM layout is complete (module scripts run after parse), so heights are non-zero. The fallback values (`44`, `52`) are safety guards for edge cases.
- **No `window.resize` listener added on mobile.** Canvas size is locked for the session.
- `cornerSnapDistance` is set to `2% of rectWidth` (e.g., ~7px on a 360px rect). This is dynamic relative sizing as specified — replaces the hardcoded 8px desktop default.
