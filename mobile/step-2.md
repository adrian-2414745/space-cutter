# Step 2 — Mobile Layout + CSS

## What the Tester Verifies

On mobile (portrait): page no longer shows horizontal scroll or a floating desktop panel. Instead:
- HUD is a compact single row at the top
- Canvas area is below the HUD (still desktop-sized in JS — canvas sizing is Step 3)
- Buttons row at the bottom includes a new "?" button
- `#game-description` (keyboard instructions) is hidden
- Config panel opens as a single-column scrollable panel

On desktop: nothing changes.

Bonus check: `env(safe-area-inset-*)` is respected — no content behind notch/dynamic island on iOS.

---

## Files Changed

### `index.html`

1. **Update viewport meta tag** — add `viewport-fit=cover` (required for safe-area CSS variables):
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
   ```

2. **Add `?` help button** to `#controls` (after the existing buttons):
   ```html
   <button id="btn-help">?</button>
   ```

3. **Add help overlay panel** (after `#config-panel`):
   ```html
   <div id="help-panel" class="hidden">
     <h2>How to Play</h2>
     <p><strong>Goal:</strong> Slice the rectangle down to under 15% of its original size before the timer runs out.</p>
     <p><strong>Move scissors:</strong> Swipe on the canvas — scissors follow your finger 1:1 along the border.</p>
     <p><strong>Cut:</strong> Double-tap the canvas to initiate a cut from the scissors' current position.</p>
     <p><strong>Avoid balls:</strong> If a ball touches the cut line, the cut fails and scissors reset.</p>
     <p><strong>Scoring:</strong> Each successful cut scores points. Smaller slices = more points.</p>
     <button id="btn-close-help">Close</button>
   </div>
   ```

4. **Add `mobile-hidden` class** to config `<label>` elements for: rect-width, rect-height, ball-radius:
   ```html
   <label class="mobile-hidden">Rectangle Width ...
   <label class="mobile-hidden">Rectangle Height ...
   <label class="mobile-hidden">Ball Radius ...
   ```

### `css/style.css`

Add a `@media (max-width: 767px)` block at the end of the file:

```css
@media (max-width: 767px) {
  body {
    align-items: stretch;
    padding:
      env(safe-area-inset-top)
      env(safe-area-inset-right)
      env(safe-area-inset-bottom)
      env(safe-area-inset-left);
    min-height: 100dvh;
    overflow: hidden;
  }

  #game-container {
    border: none;
    border-radius: 0;
    padding: 0;
    gap: 0;
    width: 100%;
    flex: 1;
  }

  #hud {
    font-size: 16px;
    gap: 16px;
    padding: 8px 12px;
  }

  #game-description {
    display: none;
  }

  #controls button {
    padding: 10px 14px;
    font-size: 14px;
  }

  /* Single-column scrollable config panel */
  #config-panel {
    grid-template-columns: 1fr;
    max-height: 80vh;
    overflow-y: auto;
    width: min(90vw, 400px);
  }

  /* Hide auto-computed params on mobile */
  .mobile-hidden {
    display: none;
  }

  /* Prevent browser scroll/zoom on canvas touch */
  #game-canvas {
    touch-action: none;
  }

  /* Help overlay — same style as config panel */
  #help-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #2a2a4a;
    border: 2px solid #555;
    border-radius: 8px;
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 100;
    width: min(90vw, 400px);
    color: #eee;
    font-size: 15px;
    line-height: 1.5;
  }

  #help-panel h2 {
    margin-top: 0;
  }

  #help-panel.hidden {
    display: none;
  }
}
```

### `js/ui.js`

Wire up the help panel:

```js
import { isMobile } from './mobile.js';

// Inside initUI():
const btnHelp      = document.getElementById('btn-help');
const helpPanel    = document.getElementById('help-panel');
const btnCloseHelp = document.getElementById('btn-close-help');

// Hide help button on desktop
if (!isMobile) btnHelp.style.display = 'none';

btnHelp.addEventListener('click', () => {
  helpPanel.classList.remove('hidden');
});

btnCloseHelp.addEventListener('click', () => {
  helpPanel.classList.add('hidden');
});

// Dismiss by tapping outside the panel
document.addEventListener('click', (e) => {
  if (!helpPanel.classList.contains('hidden') && !helpPanel.contains(e.target) && e.target !== btnHelp) {
    helpPanel.classList.add('hidden');
  }
});
```

---

## Key Details

- `viewport-fit=cover` is **required** for `env(safe-area-inset-*)` to return non-zero values on iOS. Without it, safe-area vars always return `0px`.
- `100dvh` (dynamic viewport height) accounts for collapsing browser chrome on mobile. `100vh` is the full height including chrome and causes layout issues on some mobile browsers.
- Do NOT set `width` or `height` CSS properties on `#game-canvas` — canvas visual size must come from its `width`/`height` HTML attributes set by JS only. CSS sizing causes blurry canvas rendering.
- The `#help-panel` uses `display: none` via `.hidden` class — same pattern as `#config-panel`.
