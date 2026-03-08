# Step 6 — Dynamic Visual Sizing + Polish

## What the Tester Verifies

On mobile:
- **Scissors indicator** is visibly larger — ~5% of rectangle width (e.g., ~20px on a 400px rect vs. hardcoded 16px on desktop)
- **Balls** are visibly larger — same 5% of rectangle width
- **Cut line** is thicker (2× desktop) — easier to see during a cut
- **Config panel** does not show Rectangle Width, Rectangle Height, or Ball Radius fields
- **"?" button** opens a help overlay with game description and mobile controls explanation
- **Help overlay** dismisses via Close button or tapping outside

On desktop: all visuals are pixel-identical to before — scissors size 16, original ball radii, original cut line width.

---

## Files Changed

### `js/renderer.js`

1. **`drawScissors`** — add optional `size` parameter (default preserves desktop behavior):
   ```js
   // Before:
   function drawScissors(ctx, scissors, rect) {
     const size = 16;
     ...
   }

   // After:
   function drawScissors(ctx, scissors, rect, size = 16) {
     // remove the const size = 16 line; use the parameter directly
     ...
   }
   ```

2. **`drawCutLine`** — add optional `lineWidth` parameter:
   ```js
   // Before:
   function drawCutLine(ctx, scissors) {
     ctx.lineWidth = 2;
     ...
   }

   // After:
   function drawCutLine(ctx, scissors, lineWidth = 2) {
     ctx.lineWidth = lineWidth;
     ...
   }
   ```

   *(No change to `drawBalls` — it already uses `ball.radius` directly. Ball radius is set at creation time in Step 3/ball creation, so this is already correct.)*

### `js/main.js`

1. Add a helper to produce a mobile-adjusted config for ball creation:
   ```js
   function getMobileBallConfig() {
     if (!isMobile || !mobileSizing) return config;
     return { ...config, ballRadius: mobileSizing.ballRadius };
   }
   ```

2. Replace all `createBall(rect, config)` calls with `createBall(rect, getMobileBallConfig())`. There are two call sites:
   - Initial ball creation at game start (inside the reset/init logic)
   - Ball spawning after each successful cut

3. In the `render()` function, compute mobile-specific draw parameters and pass them:
   ```js
   function render() {
     const scissorsSize = (isMobile && mobileSizing) ? mobileSizing.scissorsSize : 16;
     const cutLineWidth = isMobile ? 4 : 2;

     clearCanvas(ctx, canvas);
     drawRectangle(ctx, rect);
     drawBalls(ctx, gameState.balls);
     drawScissors(ctx, scissors, rect, scissorsSize);
     if (gameState.state === CUTTING) {
       drawCutLine(ctx, scissors, cutLineWidth);
     }
     // ... rest of render ...
   }
   ```

### Verification of Step 2 wiring (`js/ui.js`)

Confirm the help panel open/close handlers from Step 2 are wired correctly:
- `#btn-help` click → remove `.hidden` from `#help-panel`
- `#btn-close-help` click → add `.hidden` to `#help-panel`
- Click outside the panel → add `.hidden`
- `#btn-help` hidden on desktop via `if (!isMobile) btnHelp.style.display = 'none'`

If any of these were left as placeholders in Step 2, complete them now.

---

## Key Details

- **`mobileSizing` must be set before `createBall` is first called.** The order in `main.js` is: `resizeCanvas()` → `applyMobileSizing()` → game objects initialized (balls created). As long as this order is preserved (established in Step 3), `getMobileBallConfig()` returns the correct radius.
- **Ball radius lock:** `mobileSizing.ballRadius` is computed from the original `config.rectWidth` before any cuts shrink the rectangle. `getMobileBallConfig()` returns this value for every `createBall` call throughout the session — so balls spawned after cuts have the same radius as the initial balls. This matches the spec ("locked at game start, does not change as the rectangle shrinks").
- **`getMobileBallConfig()` shallow-copies config** per call. Cost is negligible (called only a handful of times — initial balls + one per cut).
- **Cut line width `4`** is 2× the desktop `2` — middle of the "2-3x" range specified. Adjust to `5` or `6` if it looks thin on a real device test.
- **Scissors size formula:** `Math.round(rectWidth * 0.05)` — on a 360px canvas with `MOBILE_CANVAS_PADDING = 16`, `rectWidth = 360 - 32 = 328`, so `scissorsSize ≈ 16px`. On wider devices (e.g., 414px canvas, `rectWidth = 382`), `scissorsSize ≈ 19px`. The dynamic sizing benefit is most visible on the range 320px–500px rect widths.
- **Default desktop scissors size is `16`** (hardcoded in `renderer.js`). On mobile the computed value may be similar on small screens — this is correct behavior; the spec says "5% of original rectangle width" which happens to be close to the desktop hardcoded value for typical rectangle sizes.

---

## Final End-to-End Test Checklist

After Step 6, perform a full smoke test on mobile:

- [ ] Page loads in portrait, full-screen, no horizontal scroll
- [ ] HUD shows Area %, Timer, Score in compact row
- [ ] Timer starts at 240s
- [ ] Canvas fills space between HUD and buttons
- [ ] Swipe moves scissors 1:1
- [ ] Swipe past corner wraps to adjacent edge
- [ ] Dead zone: short taps/micro-touches don't move scissors
- [ ] Double-tap fires cut from a non-corner position
- [ ] Double-tap at corner does nothing
- [ ] Cut completes, smaller piece removed, new ball spawns
- [ ] Ball collision during cut: cut fails, scissors resets
- [ ] Win condition triggers WIN screen
- [ ] Timer expiry triggers GAME_OVER screen
- [ ] Reset returns to IDLE, timer resets to 240s
- [ ] Config panel opens in single-column, hides rect/ball-radius fields
- [ ] "?" opens help overlay with correct content
- [ ] Help overlay dismisses via Close and via tap-outside
- [ ] Desktop: all above desktop behaviors unchanged (keyboard controls, original sizing, 180s timer)
