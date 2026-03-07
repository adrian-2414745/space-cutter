# Space Cutter — Incremental Development Plan

Based on the [Game Design Document v2](game-design-document.md) and [TDD Option A](tdd-option-a.md) (Vanilla Canvas + ES Modules).

Each step is independently testable. Config panel parameters are introduced alongside the features they control.

---

## Step 1: Project Scaffold, Static Rectangle, Start/Reset, Game State

**Goal:** Skeleton app renders a rectangle on a canvas. Start and Reset buttons drive a basic state machine. Game loop runs only when RUNNING.

**Files created:** `index.html`, `css/style.css`, `js/main.js`, `js/config.js`, `js/state.js`, `js/rectangle.js`, `js/renderer.js`, `js/ui.js`

### Tasks

1.1. **Create `index.html`**
   - Canvas element (centered)
   - Score/timer placeholder area above the canvas
   - Control buttons below the canvas: Start, Reset, Config
   - Hidden config panel `<div>` with a SAVE button
   - `<script type="module" src="js/main.js">`

1.2. **Create `css/style.css`**
   - Center the canvas and UI controls
   - Style Start/Reset/Config buttons
   - Style the hidden config panel (toggle visibility via class)

1.3. **Create `js/config.js`**
   - Export a `config` object with defaults: `rectWidth`, `rectHeight`
   - Export `loadConfigFromPanel()` and `applyConfigToPanel()` functions (read/write DOM inputs)

1.4. **Create `js/state.js`**
   - Export state constants: `IDLE`, `RUNNING`, `PAUSED`, `CUTTING`, `GAME_OVER`, `WIN`
   - Export a `gameState` object holding: `state` (initially IDLE), `score` (100), `originalArea`, `timeRemaining`
   - Export `setState(newState)` helper

1.5. **Create `js/rectangle.js`**
   - Export a `Rectangle` class or factory: `{ x, y, width, height }`
   - `createInitialRectangle(config)` — returns a rectangle centered on the canvas
   - Store `originalArea` in gameState on creation

1.6. **Create `js/renderer.js`**
   - `clearCanvas(ctx)`
   - `drawRectangle(ctx, rect)` — stroke/fill the playing field
   - `drawScore(ctx, score, rect)` — render percentage text above the rectangle

1.7. **Create `js/ui.js`**
   - Wire Start button: set state to RUNNING
   - Wire Reset button: set state to IDLE, recreate rectangle, reset score to 100%
   - Wire Config button: toggle config panel visibility (only when IDLE)
   - Wire SAVE button: call `loadConfigFromPanel()`, hide panel, recreate rectangle with new size

1.8. **Create `js/main.js`**
   - Import all modules
   - Initialize: create rectangle, apply config to panel, set up UI handlers
   - Game loop via `requestAnimationFrame`: compute `dt`, call update/render
   - Update runs only when state is RUNNING or CUTTING
   - Render runs every frame (draw rectangle + score regardless of state)

1.9. **Add config panel fields for this step**
   - Rectangle Width, Rectangle Height (number inputs in the config panel)

### Tester verification
- Open `index.html` in browser. A rectangle is drawn on the canvas. Score shows "100%" above it.
- Click Start — state changes (no visible difference yet beyond enabling future updates).
- Click Reset — rectangle redraws at original size, score resets.
- Click Config — panel appears. Change rectangle size, click SAVE — rectangle redraws with new dimensions.

---

## Step 2: Timer, Pause, Game Over

**Goal:** Countdown timer runs during gameplay. P key pauses/unpauses. Timer expiry triggers GAME_OVER. These are critical game states that are easy to verify early.

**Files created:** `js/input.js`
**Files modified:** `js/state.js`, `js/renderer.js`, `js/main.js`, `js/ui.js`, `js/config.js`

### Tasks

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

### Tester verification
- Click Start. Timer counts down from 3:00 (or configured value). Score shows "100%" and timer both visible above the rectangle.
- Press P — game pauses (timer stops, "PAUSED" overlay). Press P again — resumes.
- Let timer run to 0 — "GAME OVER" message with final score. Game stops updating.
- Reset returns to IDLE with timer reset and score back to 100%.
- Config: change timer duration — new value takes effect after reset.

---

## Step 3: Scissors on Border

**Goal:** A scissors marker appears on the rectangle's edge and moves with arrow keys. Corner snapping and stopping work correctly. Scissors only moves when RUNNING.

**Files created:** `js/scissors.js`
**Files modified:** `js/renderer.js`, `js/main.js`, `js/ui.js`, `js/config.js`

### Tasks

3.1. **Create `js/scissors.js`**
   - Scissors state: `{ edge, pos, cutting, cutStart, cutCurrent }`
   - `createScissors(rect)` — place scissors at a default position (e.g., top edge, center)
   - `updateScissorsMovement(scissors, rect, dt, config)`:
     - Read arrow key state from `input.js`
     - Move `pos` along current edge based on `config.scissorsBorderSpeed * dt`
     - When pos reaches 0 or edge length, snap to corner and stop
     - To continue past a corner, player must press the key for the adjacent edge
   - Corner snap: if pos is within `config.cornerSnapDistance` of a corner, snap to exact corner

3.2. **Update `js/renderer.js`**
   - `drawScissors(ctx, scissors, rect)` — draw a small marker/triangle at the scissors' screen position on the rectangle border

3.3. **Update `js/main.js`**
   - Import scissors module
   - Initialize scissors on game start/reset
   - In update loop (when RUNNING): call `updateScissorsMovement()`
   - In render: call `drawScissors()`

3.4. **Update `js/ui.js`**
   - Reset button also resets scissors to default position

3.5. **Add config panel fields**
   - Scissors Border Speed (number input)
   - Corner Snap Distance (number input)

3.6. **Update `js/config.js`**
   - Add defaults: `scissorsBorderSpeed`, `cornerSnapDistance`

### Tester verification
- Start the game. Scissors appears on the top edge of the rectangle. Timer is counting down.
- Arrow keys move the scissors along the border. It stops at corners and requires the correct key to continue to the next edge.
- Scissors does not move when game is IDLE or PAUSED.
- Press P — scissors freezes along with everything else. Press P again — movement resumes.
- Config: change border speed and corner snap distance — behavior updates accordingly.

---

## Step 4: Cutting Mechanic

**Goal:** Spacebar initiates a cut. Scissors travels perpendicular to the opposite edge, leaving a visible line. 
On completion, the rectangle splits and the scissors repositions is left in the new rectangles corner.

**Files modified:** `js/scissors.js`, `js/state.js`, `js/rectangle.js`, `js/renderer.js`, `js/main.js`, `js/config.js`

### Tasks

4.1. **Extend `js/scissors.js` — cut initiation**
   - On Spacebar press (consumed via `consumeKeyPress`):
     - Only if state is RUNNING and scissors is not at a corner
     - Set `cutting = true`, record `cutStart` (current position), set state to CUTTING
     - Determine cut direction: perpendicular to current edge

4.2. **Extend `js/scissors.js` — cut travel**
   - `updateScissorsCut(scissors, rect, dt, config)`:
     - Move `cutCurrent` toward opposite edge at `config.scissorsCutSpeed * dt`
     - Scissors cannot be moved along border during a cut (arrow keys ignored)

4.3. **Extend `js/scissors.js` — cut completion**
   - Detect when `cutCurrent` reaches the opposite edge
   - Call rectangle split logic
   - Reposition scissors on the corner of the remaining rectangle at the previous cut endpoint
   - Set `cutting = false`, set state back to RUNNING

4.4. **Extend `js/rectangle.js` — split logic**
   - `splitRectangle(rect, cutStart, cutEnd)`:
     - Determine horizontal or vertical cut
     - Compute two sub-rectangles
     - Return the larger piece (discard the smaller)
   - Update `gameState.score` after split: `(newArea / originalArea) * 100`

4.5. **Update `js/renderer.js`**
   - `drawCutLine(ctx, scissors)` — draw a dashed/colored line from `cutStart` to `cutCurrent` during CUTTING state

4.6. **Update `js/main.js`**
   - In update loop: when CUTTING, call `updateScissorsCut()` and `checkCutComplete()`
   - On cut complete: replace rectangle with the larger piece

4.7. **Add config panel field**
   - Scissors Cut Speed (number input)

4.8. **Update `js/config.js`**
   - Add default: `scissorsCutSpeed`

### Tester verification
- Start game, move scissors to an edge (not corner), press Spacebar.
- Scissors travels across the rectangle leaving a dashed line. Timer continues counting during the cut.
- On reaching the other side, the rectangle splits. The smaller piece disappears. Score updates (drops below 100%).
- Scissors is now on the border of the remaining (larger) piece. Can cut again immediately.
- Cannot cut from a corner.
- Pause works during a cut (freezes cut progress, resumes correctly).

---

## Step 5: Scoring & Win Condition

**Goal:** Score display is refined and updates after each cut. Reaching the win threshold triggers a WIN state.

**Files modified:** `js/state.js`, `js/renderer.js`, `js/main.js`, `js/ui.js`, `js/config.js`

### Tasks

5.1. **Update score display**
   - `drawScore()` already exists — ensure it displays current `gameState.score` formatted to one decimal place (e.g., "87.3%")

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

### Tester verification
- Make several cuts. Score drops after each cut. Display updates correctly.
- Keep cutting until score drops below 5% — "YOU WIN!" message appears. Timer stops. Game stops.
- Reset returns to initial state.

---

## Step 6: Bouncing Balls

**Goal:** Balls bounce inside the rectangle. Balls start moving when the game is RUNNING. On cut, balls inside the discarded piece are removed.

**Files created:** `js/ball.js`
**Files modified:** `js/renderer.js`, `js/main.js`, `js/state.js`, `js/config.js`, `js/ui.js`

### Tasks

6.1. **Create `js/ball.js`**
   - Ball data: `{ x, y, vx, vy, radius }`
   - `createBall(rect, config)` — spawn at random position inside rectangle (away from edges), random direction, speed from config
   - `updateBall(ball, rect, dt)` — move ball by velocity * dt, reflect off rectangle walls (flip vx or vy on contact)
   - `isBallInRect(ball, rect)` — check if ball center is inside a given rectangle

6.2. **Add balls array to `js/state.js`**
   - `gameState.balls = []`

6.3. **Update `js/main.js`**
   - On game start: create `config.initialBallCount` balls
   - In update loop (when RUNNING or CUTTING): update all balls
   - On successful cut (from Step 4): filter balls — keep only those inside the remaining rectangle
   - Balls freeze when PAUSED

6.4. **Update `js/renderer.js`**
   - `drawBalls(ctx, balls)` — draw each ball as a filled circle

6.5. **Update `js/ui.js`**
   - Reset: clear and recreate balls

6.6. **Add config panel fields**
   - Ball Speed (number input)
   - Ball Radius (number input)
   - Initial Ball Count (number input, default 1)

6.7. **Update `js/config.js`**
   - Add defaults: `ballSpeed`, `ballRadius`, `initialBallCount: 1`

### Tester verification
- Start game. Ball(s) bounce inside the rectangle, reflecting off walls. Timer counts down simultaneously.
- Press P — balls freeze. Press P again — balls resume.
- Make a cut — balls in the discarded piece disappear. Remaining balls continue bouncing in the new rectangle.
- Config: change ball speed, radius, initial count — behavior updates on reset.

---

## Step 7: Cut-Line Collision & Ball Spawning

**Goal:** Balls collide with the cut line, causing cut failure. Successful cuts spawn a new ball. Full gameplay is now functional.

**Files created:** `js/collision.js`
**Files modified:** `js/scissors.js`, `js/main.js`, `js/ball.js`, `js/state.js`

### Tasks

7.1. **Create `js/collision.js`**
   - `pointToSegmentDistance(px, py, x1, y1, x2, y2)` — standard perpendicular distance from point to line segment
   - `ballIntersectsCutLine(ball, cutStart, cutCurrent)` — returns true if distance < ball.radius

7.2. **Update `js/main.js` — collision check**
   - `checkCutCollision()`: each frame during CUTTING, test all balls against the cut line segment
   - If any ball intersects: cancel cut (reset scissors to starting position, set `cutting = false`, state back to RUNNING)

7.3. **Update `js/main.js` — ball spawning on successful cut**
   - After a successful split, call `createBall()` to add one new ball inside the remaining rectangle
   - Ensure new ball spawns away from scissors and rectangle edges

7.4. **Gameplay integration**
   - Verify the full loop: cut attempt can now fail (ball hits line) or succeed (rectangle splits, new ball spawns, difficulty increases)

### Tester verification
- Start game with a ball bouncing. Initiate a cut.
- If a ball crosses the cut line during the cut, the cut is cancelled — line disappears, scissors returns to starting position.
- If the cut succeeds, a new ball appears in the remaining rectangle. Ball count increases with each successful cut.
- Game is now fully playable: start, cut, avoid balls, win or time out.

---

## Step 8: UI Polish & Animations

**Goal:** Visual refinements — discard animation, scissors icon, cut line styling, overall arcade aesthetic.

**Files modified:** `js/renderer.js`, `css/style.css`, `js/main.js`

### Tasks

8.1. **Discard animation**
   - On successful cut, briefly render the discarded piece fading out (reduce alpha over ~0.3s) before removing it
   - Store discarded piece temporarily in gameState for animation

8.2. **Scissors icon**
   - Replace the simple marker with a recognizable scissors shape (drawn with canvas paths or a small sprite)
   - Orient the scissors icon to indicate cut direction (perpendicular to current edge)

8.3. **Cut line styling**
   - Use `setLineDash()` for a dashed line effect
   - Distinct color (e.g., red or bright contrast) for visibility

8.4. **Visual polish**
   - Clean arcade-style color palette
   - Styled score and timer text (font, size, alignment)
   - Button hover/active states in CSS
   - Canvas border or background styling

8.5. **Game state overlays**
   - Polish WIN, GAME_OVER, and PAUSED overlays (centered text, semi-transparent background)

### Tester verification
- Game looks polished and visually clear.
- Discarded pieces fade out smoothly.
- Scissors icon clearly shows which direction it will cut.
- Cut line is dashed and easy to see.
- All overlays (pause, win, game over) are clean and readable.
- Overall aesthetic feels like a clean arcade game.

---

## Summary

| Step | Feature                           | Config Params Added                                        |
|------|-----------------------------------|------------------------------------------------------------|
| 1    | Scaffold, rectangle, state        | Rectangle Width, Rectangle Height                          |
| 2    | Timer, pause, game over           | Timer Duration                                             |
| 3    | Scissors on border                | Scissors Border Speed, Corner Snap Distance                |
| 4    | Cutting mechanic                  | Scissors Cut Speed                                         |
| 5    | Scoring & win condition           | Win Threshold                                              |
| 6    | Bouncing balls                    | Ball Speed, Ball Radius, Initial Ball Count                |
| 7    | Cut-line collision & ball spawn   | (none — uses existing params)                              |
| 8    | UI polish & animations            | (none — visual only)                                       |
