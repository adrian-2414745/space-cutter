# Step 6: Bouncing Balls

**Goal:** Balls bounce inside the rectangle. Balls start moving when the game is RUNNING. On cut, balls inside the discarded piece are removed.

**Files created:** `js/ball.js`
**Files modified:** `js/renderer.js`, `js/main.js`, `js/state.js`, `js/config.js`, `js/ui.js`

## Tasks

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

## Tester verification
- Start game. Ball(s) bounce inside the rectangle, reflecting off walls. Timer counts down simultaneously.
- Press P — balls freeze. Press P again — balls resume.
- Make a cut — balls in the discarded piece disappear. Remaining balls continue bouncing in the new rectangle.
- Config: change ball speed, radius, initial count — behavior updates on reset.
