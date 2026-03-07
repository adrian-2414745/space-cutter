# Step 4: Cutting Mechanic

**Goal:** Pressing Spacebar initiates a cut. Scissors travels perpendicular towards the opposite edge, leaving behind a visible line (the cut line).
On completion (reaching the other edge), the rectangle splits along the cut line and the smaller rectangle is discarded. The scissors is now in the corner of the new rectangle.

**Files modified:** `js/scissors.js`, `js/state.js`, `js/rectangle.js`, `js/renderer.js`, `js/main.js`, `js/config.js`

## Tasks

4.1. **Update `js/config.js` — add `scissorsCutSpeed`**
   - Add `scissorsCutSpeed: 300` to `DEFAULTS`
   - Add to `applyConfigToPanel`, `resetConfigToDefaults`, `loadConfigFromPanel` (clamp min 50)

4.2. **Update `index.html` — add config panel field**
   - Add Scissors Cut Speed number input (`id="cfg-cut-speed"`, min 50) in config panel

4.3. **Extend `js/scissors.js` — cut initiation**
   - On `consumeKeyPress(' ')` when `state === RUNNING` and scissors is NOT at a corner:
     - Set `scissors.cutting = true`
     - Record `scissors.cutStart` = current screen position via `getScissorsScreenPosition`
     - Set `scissors.cutCurrent` = copy of `cutStart`
     - Store `scissors.cutEdge = scissors.edge` (starting edge, needed for split logic)
     - Store `scissors.cutPos = scissors.pos` (offset along edge, needed for split logic)
     - Set state to `CUTTING`
   - Cut direction derived from edge: top/bottom = vertical, left/right = horizontal

4.4. **Extend `js/scissors.js` — cut travel**
   - New function: `updateScissorsCut(scissors, rect, dt, config)`
   - Advance `cutCurrent` toward opposite edge at `config.scissorsCutSpeed * dt`:
     - From top: `cutCurrent.y += speed` (target: `rect.y + rect.height`)
     - From bottom: `cutCurrent.y -= speed` (target: `rect.y`)
     - From left: `cutCurrent.x += speed` (target: `rect.x + rect.width`)
     - From right: `cutCurrent.x -= speed` (target: `rect.x`)
   - Clamp so it doesn't overshoot the target edge

4.5. **Extend `js/scissors.js` — cut completion check**
   - New function: `checkCutComplete(scissors, rect)` returns boolean
   - Returns true when `cutCurrent` has reached the opposite edge

4.6. **Extend `js/rectangle.js` — `splitRectangle(rect, cutEdge, cutPos)`**
   - Vertical cut (top/bottom edge): split at `rect.x + cutPos` into left and right pieces
   - Horizontal cut (left/right edge): split at `rect.y + cutPos` into top and bottom pieces
   - Return the larger piece (tiebreaker: keep left/top)

4.7. **Update `js/main.js` — integrate cutting into game loop**
   - Guard `updateScissorsMovement` to only run when `state === RUNNING` (not CUTTING)
   - When RUNNING: check spacebar via `consumeKeyPress`, call cut initiation
   - When CUTTING: call `updateScissorsCut`, then `checkCutComplete`
   - On cut complete:
     1. Call `splitRectangle(rect, scissors.cutEdge, scissors.cutPos)` to get new rect
     2. Replace current rectangle with the new rect
     3. Update `gameState.score = (newArea / originalArea) * 100`
     4. Reposition scissors: set `edge` to opposite of `cutEdge`, calculate `pos` (0 or edge length = corner of new rect)
     5. Reset: `cutting=false`, `cutStart=null`, `cutCurrent=null`, `cutEdge=null`, `cutPos=null`
     6. Set state back to `RUNNING`

4.8. **Update `js/renderer.js` — draw cut line**
   - New function: `drawCutLine(ctx, scissors)`
   - Draw dashed line from `cutStart` to `cutCurrent` when `scissors.cutting === true`
   - Style: `setLineDash([8, 4])`, distinct color (e.g. red/yellow), 2-3px width
   - Call in render after `drawRectangle`, before `drawScissors`

## Tester verification
- Start game, move scissors to an edge (not corner), press Spacebar.
- Scissors travels across the rectangle leaving a dashed line. Timer continues counting during the cut.
- On reaching the other side, the rectangle splits. The smaller piece disappears. Score updates (drops below 100%).
- Scissors is now on the corner of the remaining rectangle.
- Cannot cut from a corner.
- Pause works during a cut (freezes cut progress, resumes correctly).
