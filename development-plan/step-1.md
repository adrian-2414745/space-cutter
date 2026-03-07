im# Step 1: Project Scaffold, Static Rectangle, Start/Reset, Game State

**Goal:** Skeleton app renders a rectangle on a canvas. Start and Reset buttons drive a basic state machine. Game loop runs only when RUNNING.

**Files created:** `index.html`, `css/style.css`, `js/main.js`, `js/config.js`, `js/state.js`, `js/rectangle.js`, `js/renderer.js`, `js/ui.js`

## Tasks

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

## Tester verification
- Open `index.html` in browser. A rectangle is drawn on the canvas. Score shows "100%" above it.
- Click Start — state changes (no visible difference yet beyond enabling future updates).
- Click Reset — rectangle redraws at original size, score resets.
- Click Config — panel appears. Change rectangle size, click SAVE — rectangle redraws with new dimensions.
