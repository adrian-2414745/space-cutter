# Step 4: Cutting Mechanic

**Goal:** Spacebar initiates a cut. Scissors travels perpendicular to the opposite edge, leaving a visible line.
On completion, the rectangle splits and the scissors repositions is left in the new rectangles corner.

**Files modified:** `js/scissors.js`, `js/state.js`, `js/rectangle.js`, `js/renderer.js`, `js/main.js`, `js/config.js`

## Tasks

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

## Tester verification
- Start game, move scissors to an edge (not corner), press Spacebar.
- Scissors travels across the rectangle leaving a dashed line. Timer continues counting during the cut.
- On reaching the other side, the rectangle splits. The smaller piece disappears. Score updates (drops below 100%).
- Scissors is now on the border of the remaining (larger) piece. Can cut again immediately.
- Cannot cut from a corner.
- Pause works during a cut (freezes cut progress, resumes correctly).
