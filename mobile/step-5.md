/# Step 5 — Double-Tap to Cut

## What the Tester Verifies

On mobile:
- **Double-tap fires cut:** Tap twice rapidly on the canvas → cut initiates from scissors' current position
- **Timing guard:** Tap once, wait >300ms, tap again → no cut
- **Distance guard:** Tap twice rapidly but >30px apart → no cut
- **Corner guard:** Position scissors at a corner, double-tap → no cut fires
- **In-cut guard:** During a cut animation, double-tap → ignored
- **Triple-tap protection:** Three rapid taps → only one cut, not two

On desktop:
- Spacebar still triggers cut as before
- P key still pauses as before

---

## Files Changed

### `js/touch.js`

The `handleTapEnd` placeholder from Step 4 already contains the double-tap detection logic. No changes needed to the detection itself — it was implemented ahead of time. Verify:

```js
function handleTapEnd(touch) {
  const now  = performance.now();
  const dx   = touch.clientX - lastTapX;
  const dy   = touch.clientY - lastTapY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (now - lastTapTime < 300 && dist < 30) {
    onDoubleTap?.();      // fire callback
    lastTapTime = 0;      // reset: prevents triple-tap from triggering twice
  } else {
    lastTapTime = now;
    lastTapX    = touch.clientX;
    lastTapY    = touch.clientY;
  }
}
```

`setDoubleTapCallback` and `onDoubleTap` are already exported/defined in Step 4.

### `js/main.js`

1. Import `setDoubleTapCallback` (already imported in Step 4 if written ahead of time, otherwise add it):
   ```js
   import { initTouch, consumeTouchDelta, setDoubleTapCallback } from './touch.js';
   ```

2. Register the double-tap callback after `initTouch(canvas)`:
   ```js
   if (isMobile) {
     initTouch(canvas);
     setDoubleTapCallback(() => {
       if (gameState.state === RUNNING && !isAtCorner(scissors, rect)) {
         initiateCut(scissors, rect);
         setState(CUTTING);
       }
     });
   }
   ```

3. Guard keyboard-only controls with `!isMobile` (they are harmless on mobile since the keys never fire, but this is cleaner and future-proof):
   ```js
   // Cut trigger
   if (!isMobile && consumeKeyPress(' ') && !isAtCorner(scissors, rect)) {
     initiateCut(scissors, rect);
     setState(CUTTING);
   }

   // Pause toggle (no pause on mobile per spec)
   if (!isMobile && (consumeKeyPress('p') || consumeKeyPress('P'))) {
     if (gameState.state === RUNNING) setState(PAUSED);
     else if (gameState.state === PAUSED) setState(RUNNING);
   }
   ```

---

## Key Details

- **`e.changedTouches[0]`** is used for tap position (not `e.touches[0]`). At `touchend`, `e.touches` contains fingers still touching; `e.changedTouches` contains the finger that just lifted. Using the wrong one gives wrong coordinates.
- **`lastTapTime = 0` after a double-tap** ensures a third rapid tap cannot pair with the second tap to trigger a second cut (triple-tap protection).
- **Callback closure captures live references.** `scissors` and `rect` are `let` variables in `main.js` module scope that get reassigned after each successful cut (`rect = splitRectangle(...)`). The callback reads them at call time, not at registration time — so the closure always sees the current values. This is correct JS closure behavior.
- **Corner guard uses `isAtCorner(scissors, rect)`** — the same guard used for the spacebar cut. No new logic needed.
- **State guard `gameState.state === RUNNING`** in the callback means double-tap during CUTTING, GAME_OVER, WIN, IDLE, or PAUSED states is silently ignored.
- The `consumeKeyPress(' ')` path is guarded with `!isMobile`. On mobile, `consumeKeyPress` would never return true anyway (no keyboard events), but the guard prevents subtle issues on hybrid tablet+keyboard devices (which the spec says should use touch controls only).
