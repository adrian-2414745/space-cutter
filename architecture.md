# Space Cutter — Architecture

## Overview

Space Cutter is a single-player arcade/puzzle browser game built with vanilla JavaScript ES modules and HTML5 Canvas. No frameworks, no build tools, no dependencies. Open `index.html` in any browser to play.

The player uses a scissors tool to make cuts that modify a polygon playing field while avoiding bouncing balls. Each cut spawns a new ball. Win by reducing the polygon to under 15% of its original area before the timer expires.

There are two cut types:
- **L-cut** (player-triggered): scissors move perpendicular inward (Phase 1), then player presses Space / double-tap to pivot 90° toward the nearest edge (Phase 2). Nibbles a rectangular corner off the polygon.
- **Straight cut** (auto-triggered): if the player does nothing during Phase 1 and the scissors reach the opposite boundary, the polygon is bisected. The larger half is kept.

---

## File Structure

```
index.html              — Canvas, HUD, control buttons, config & help panels
css/style.css           — Dark-theme layout, responsive mobile support
js/
  main.js               — Game loop, state transitions, cut orchestration
  state.js              — State machine (IDLE, RUNNING, PAUSED, CUTTING, GAME_OVER, WIN)
  polygon.js            — Polygon geometry: area, containment, raycasting, nibbling
  scissors.js           — Perimeter movement, L-cut phases, preview line
  ball.js               — Ball creation, movement, polygon-edge bouncing
  collision.js          — Ball vs L-cut line intersection (both segments)
  scoring.js            — Score formula (area%, time bonus, efficiency, penalties)
  config.js             — Default parameters, config panel load/save
  input.js              — Keyboard listener (arrows, space, P)
  touch.js              — Touch/swipe input, double-tap detection
  renderer.js           — All Canvas draw calls (polygon, scissors, balls, overlays)
  ui.js                 — Button handlers, config/help panel toggles
  rectangle.js          — Initial rectangle creation (centered on canvas)
  mobile.js             — Mobile detection, proportional sizing
```

---

## State Machine

```
IDLE → RUNNING ↔ PAUSED
RUNNING → CUTTING → RUNNING  (cut succeeds or fails)
RUNNING / CUTTING → GAME_OVER (timer expires)
RUNNING / CUTTING → WIN       (area < threshold)
any → IDLE                     (reset)
```

- Game loop updates only run in RUNNING or CUTTING states.
- Rendering runs every frame regardless of state.
- Config panel is only editable in IDLE.

---

## Modules — Data Structures, Algorithms, Dependencies

- **polygon.js**
  - Data: `{ vertices: [{x,y}, ...] }` — CW winding, axis-aligned edges
  - Algorithms: shoelace area, ray-casting containment, raycastToEdge (axis-aligned ray to nearest edge)
  - `insertSplitPoints(verts, edgeAIdx, edgeCIdx, A, C)` — private helper; inserts A and C into vertex array at their edge positions (shared by nibblePolygon and splitPolygon)
  - `nibblePolygon(poly, A, B, C)` — removes the short arc from C to A and replaces it with B, nibbling a rectangular corner
  - `splitPolygon(poly, A, C)` — bisects polygon with a straight line A→C; builds two sub-polygons by walking CW from A→C and C→A; returns the larger (random on tie within 1 sq px)
  - No dependencies

- **scissors.js**
  - Data: `{ edgeIndex, pos, cutting, cutPhase, cutStart, cutCurrent, cutTurn, cutTarget, cutDirection, cutTurnDirection }`
  - Algorithms: perimeter movement with corner wrapping/snapping, L-cut phase machine (initiate → phase 1 inward → phase 2 turn → complete), preview line generation
  - `repositionScissorsAfterCut(scissors, poly, targetPoint?)` — places scissors on new polygon at `targetPoint` (straight cut) or `cutTurn` (L-cut)
  - Depends on: polygon.js

- **ball.js**
  - Data: `{ x, y, vx, vy, radius }`
  - Algorithms: CW inward normal bounce `(-dy, dx)` per edge, rejection-sampling spawn
  - Depends on: polygon.js

- **collision.js**
  - Algorithms: point-to-segment distance, ballIntersectsLCut checks both L-segments against ball radius
  - No dependencies

- **state.js**
  - Data: `{ state, score, originalArea, timeRemaining, balls[], successfulCuts, failedCuts, finalScore }`
  - No dependencies

- **scoring.js**
  - Algorithms: score = (100 - area%) × 10 × time multiplier × efficiency multiplier − fail penalty
  - No dependencies

- **config.js** — default parameters, config panel load/save, mobile overrides
- **input.js** — keyboard state (arrows, space, P), polled per frame
- **touch.js** — swipe delta accumulation, double-tap detection (300ms, <30px)
- **renderer.js** — all Canvas 2D draw calls; depends on polygon.js, scissors.js
- **ui.js** — button handlers, config/help panel toggles
- **rectangle.js** — creates initial centered rectangle
- **mobile.js** — `isMobile` flag, proportional sizing (scissors, ball, snap = 5%, 5%, 2% of width)
- **main.js** — orchestrates all modules, owns the game loop
  - `completeCut()` — finalises an L-cut: calls `nibblePolygon`, repositions scissors to turn point B
  - `completeStraightCut()` — finalises a straight cut: raycasts from `cutStart` for exact exit point, calls `splitPolygon`, repositions scissors to exit point
  - Phase 1 boundary check: player Space/double-tap → L-cut (`triggerPhase2`); scissors reach opposite boundary autonomously → straight cut (`completeStraightCut`)
