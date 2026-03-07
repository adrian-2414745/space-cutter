# Step 5: Scoring & Win Condition

**Goal:** Score display is refined and updates after each cut. Reaching the win threshold triggers a WIN state.

**Files modified:** `js/state.js`, `js/renderer.js`, `js/main.js`, `js/ui.js`, `js/config.js`

## Tasks

5.1. **Update score display**
   - `drawScore()` already exists — ensure it displays current `gameState.score` formatted to two decimal place (e.g., "87.31%")

5.2. **Implement win check in `js/main.js`**
   - `checkWinCondition()`: if `gameState.score < config.winThreshold`, set state to WIN
   - When WIN: stop updates, display win message on canvas

5.3. **Update `js/renderer.js`**
   - `drawWinMessage(ctx)` — overlay "YOU WIN!" text on the canvas

5.4. **Update `js/ui.js`**
   - Reset button works from WIN state (returns to IDLE)

5.5. **Add config panel field**
   - Win Threshold % (number input, default 5)

5.6. **Update `js/config.js`**
   - Add default: `winThreshold: 5`

## Tester verification
- Make several cuts. Score drops after each cut. Display updates correctly.
- Keep cutting until score drops below 5% — "YOU WIN!" message appears. Timer stops. Game stops.
- Reset returns to initial state.
