# Step 3: Scissors on Border

**Goal:** A scissors marker appears on the rectangle's edge and moves with arrow keys. Corner snapping and stopping work correctly. Scissors only moves when RUNNING.

**Files created:** `js/scissors.js`
**Files modified:** `js/renderer.js`, `js/main.js`, `js/ui.js`, `js/config.js`

## Tasks

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

## Tester verification
- Start the game. Scissors appears on the top edge of the rectangle. Timer is counting down.
- Arrow keys move the scissors along the border. It stops at corners and requires the correct key to continue to the next edge.
- Scissors does not move when game is IDLE or PAUSED.
- Press P — scissors freezes along with everything else. Press P again — movement resumes.
- Config: change border speed and corner snap distance — behavior updates accordingly.
