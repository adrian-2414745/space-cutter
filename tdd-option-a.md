# Technical Design Document — Option A: Vanilla Canvas + ES Modules

## Architecture

Single-page app using **HTML5 Canvas** for rendering and **vanilla JavaScript (ES modules)** for logic. No frameworks, no build tools — just a static `index.html` that loads modules via `<script type="module">`.

## File Structure

```
index.html              — Canvas element, UI buttons, config panel
css/
  style.css             — Layout, buttons, config panel styling
js/
  main.js               — Entry point, game loop (requestAnimationFrame)
  config.js             — Default parameters, load/save from config panel
  state.js              — Game state machine (IDLE, RUNNING, PAUSED, CUTTING, GAME_OVER, WIN)
  rectangle.js          — Rectangle class (position, size, area, split logic)
  ball.js               — Ball class (position, velocity, radius, move, reflect)
  scissors.js           — Scissors class (edge position, border movement, corner snapping, cut state)
  collision.js          — Line-circle intersection (ball vs cut line)
  renderer.js           — All Canvas draw calstarls (rectangle, balls, scissors, cut line, score, timer)
  input.js              — Keyboard listener, arrow key state, spacebar, P key
  ui.js                 — Start/Reset/Config button handlers, config panel open/save
```

## Game Loop

```
function tick(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (state === RUNNING || state === CUTTING) {
    updateTimer(dt);
    updateBalls(dt);
    updateScissors(dt);     // border movement or cut movement
    checkCutCollision();    // ball vs cut line
    checkCutComplete();     // scissors reached opposite edge?
    checkWinCondition();    // score < 5%?
    checkTimerExpiry();     // timer <= 0?
  }

  render();                 // clear canvas, draw everything
  requestAnimationFrame(tick);
}
```

Fixed-timestep not needed — `dt`-based updates are sufficient for this game's simplicity.

## Key Data Structures

**Rectangle:** `{ x, y, width, height }` — the current playing field. `originalArea` stored separately for score calculation.

**Ball:** `{ x, y, vx, vy, radius }` — position and velocity. Reflection flips `vx` or `vy` on wall contact.

**Scissors:** `{ edge: 'top'|'bottom'|'left'|'right', pos: number, cutting: boolean, cutStart: {x,y}, cutCurrent: {x,y} }` — `pos` is the offset along the current edge (0 to edge length). During a cut, `cutStart` and `cutCurrent` define the line segment.

## Core Algorithms

### Border Movement
Scissors stores which edge it's on and an offset along that edge. Arrow keys increment/decrement the offset. When offset reaches 0 or edge length, snap to corner and stop.

### Cut Line Collision
Each frame during a cut, test every ball against the line segment `(cutStart, cutCurrent)`:
- Compute perpendicular distance from ball center to line segment.
- If distance < ball radius, cut fails.

Standard point-to-segment distance formula — no external library needed.

### Rectangle Split
When cut completes from, say, the top edge at offset `pos` cutting vertically:
- Left piece: `{ x, y, width: pos, height }`, Right piece: `{ x + pos, y, width: width - pos, height }`
- Keep the piece with larger area. Reassign balls by checking which piece contains each ball's center.

## Rendering

All drawing via `CanvasRenderingContext2D`:
- `fillRect` / `strokeRect` for the rectangle
- `arc` for balls
- `moveTo` / `lineTo` for cut line (dashed stroke via `setLineDash`)
- Scissors: small icon drawn at position using `drawImage` or simple geometric shapes
- Score/timer: `fillText` above the rectangle

## Config Panel

A hidden `<div>` toggled by the Config button. Contains `<input type="number">` fields for each parameter. "SAVE" button reads values into `config.js` state and hides the panel. Config only editable when game is IDLE (not running).

## Pros
- Zero dependencies, instant load, no build step
- Easy to deploy (any static file server, or just open `index.html`)
- Full control over rendering and game loop
- Small codebase (~500-800 lines total)

## Cons
- Manual Canvas drawing for everything (no sprite management)
- No built-in physics helpers — all collision math written by hand
- Scaling/responsive canvas requires manual handling
