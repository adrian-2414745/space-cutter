# Step 7: Cut-Line Collision & Ball Spawning

**Goal:** Balls collide with the cut line, causing cut failure.

**Files created:** `js/collision.js`
**Files modified:** `js/scissors.js`, `js/main.js`

## Tasks

7.1. **Create `js/collision.js`**
   - `pointToSegmentDistance(px, py, x1, y1, x2, y2)` — standard perpendicular distance from point to line segment
   - `ballIntersectsCutLine(ball, cutStart, cutCurrent)` — returns true if distance < ball.radius

7.2. **Update `js/main.js` — collision check**
   - `checkCutCollision()`: each frame during CUTTING, test all balls against the cut line segment
   - If any ball intersects: cancel cut (reset scissors to starting position, set `cutting = false`, state back to RUNNING)

7.3. **Gameplay integration**
   - Verify the full loop: cut attempt can now fail (ball hits line) or succeed (smaller rectangle is discarded, new ball spawns)

## Tester verification
- Start game with a ball bouncing. Initiate a cut.
- If a ball crosses the cut line during the cut, the cut is cancelled — line disappears, scissors returns to starting position.
- If the cut succeeds, a new ball appears in the remaining rectangle. Ball count increases with each successful cut.
- Game is now fully playable: start, cut, avoid balls, win or time out.
