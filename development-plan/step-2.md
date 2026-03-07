# Step 2: Timer, Pause, Game Over

**Goal:** Countdown timer runs during gameplay. P key pauses/unpauses. Timer expiry triggers GAME_OVER. These are critical game states that are easy to verify early.

**Files created:** `js/input.js`
**Files modified:** `js/state.js`, `js/renderer.js`, `js/main.js`, `js/ui.js`, `js/config.js`

## Tasks

2.1. **Create `js/input.js`**
   - Listen for `keydown` / `keyup` events
   - Track pressed state for arrow keys (Up, Down, Left, Right), Spacebar, P
   - Export `isKeyDown(key)` and `consumeKeyPress(key)` (for one-shot actions like Spacebar and P)

2.2. **Add timer to `js/state.js`**
   - `gameState.timeRemaining` — initialized from `config.timerDuration`

2.3. **Update `js/main.js` — timer tick**
   - `updateTimer(dt)`: decrement `gameState.timeRemaining` by `dt` when RUNNING or CUTTING
   - `checkTimerExpiry()`: if `timeRemaining <= 0`, set state to GAME_OVER

2.4. **Update `js/renderer.js`**
   - `drawTimer(ctx, timeRemaining, rect)` — display countdown (MM:SS format) above the rectangle alongside score
   - `drawGameOverMessage(ctx, score)` — overlay "GAME OVER" and final score

2.5. **Implement pause in `js/main.js`**
   - On P key press (consumed): toggle between RUNNING and PAUSED (or CUTTING and PAUSED, remembering previous state)
   - When PAUSED: no updates run, render shows "PAUSED" overlay

2.6. **Update `js/renderer.js`**
   - `drawPausedOverlay(ctx)` — semi-transparent overlay with "PAUSED" text

2.7. **Update `js/ui.js`**
   - Start button: if IDLE, set state to RUNNING and start timer
   - Reset button: works from GAME_OVER and PAUSED states, resets timer

2.8. **Add config panel field**
   - Timer Duration in seconds (number input, default 180)

2.9. **Update `js/config.js`**
   - Add default: `timerDuration: 180`

## Tester verification
- Click Start. Timer counts down from 3:00 (or configured value). Score shows "100%" and timer both visible above the rectangle.
- Press P — game pauses (timer stops, "PAUSED" overlay). Press P again — resumes.
- Let timer run to 0 — "GAME OVER" message with final score. Game stops updating.
- Reset returns to IDLE with timer reset and score back to 100%.
- Config: change timer duration — new value takes effect after reset.
