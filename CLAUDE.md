# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Space Cutter** is a single-player arcade/puzzle browser game. The player slices a rectangle with scissors while avoiding bouncing balls. Each cut shrinks the playing field and spawns a new ball. The goal is to reduce the rectangle to under 5% of its original area before a countdown timer expires.

## Tech Stack & Architecture

- **Vanilla JavaScript (ES modules)** — no frameworks, no build tools, no dependencies
- **HTML5 Canvas** for all rendering
- Single-page app: `index.html` loads modules via `<script type="module">`
- To run: open `index.html` in a browser (or use any static file server)

## File Structure

```
index.html              — Canvas, UI buttons, config panel
css/style.css           — Layout, buttons, config panel styling
js/
  main.js               — Entry point, game loop (requestAnimationFrame, dt-based)
  config.js             — Default parameters, load/save from config panel
  state.js              — Game state machine: IDLE, RUNNING, PAUSED, CUTTING, GAME_OVER, WIN
  rectangle.js          — Rectangle data (position, size, area, split logic)
  ball.js               — Ball data (position, velocity, radius, move, wall reflection)
  scissors.js           — Scissors (edge position, border movement, corner snapping, cut state)
  collision.js          — Line-circle intersection (ball vs cut line)
  renderer.js           — All Canvas draw calls
  input.js              — Keyboard listener (arrow keys, spacebar, P key)
  ui.js                 — Start/Reset/Config button handlers, config panel toggle
```

## Game State Machine

States: `IDLE → RUNNING ↔ PAUSED`, `RUNNING ↔ CUTTING`, `RUNNING/CUTTING → GAME_OVER`, `RUNNING/CUTTING → WIN`

- Game loop updates only run when `RUNNING` or `CUTTING`
- Rendering runs every frame regardless of state
- Config panel is only editable when `IDLE`

## Key Data Structures

- **Rectangle:** `{ x, y, width, height }` — `originalArea` stored separately for score calc
- **Ball:** `{ x, y, vx, vy, radius }` — reflects off walls by flipping vx/vy
- **Scissors:** `{ edge: 'top'|'bottom'|'left'|'right', pos: number, cutting: boolean, cutStart: {x,y}, cutCurrent: {x,y} }`

## Core Mechanics to Preserve

- Cuts are strictly horizontal or vertical, perpendicular to the scissors' current edge
- Scissors cannot cut from a corner — must be on an edge
- Cut collision checks the **entire visible line segment** each frame, not just the scissors tip
- On cut failure (ball touches line), scissors resets to its starting position
- On cut success, the smaller piece is discarded; scissors repositions to a corner of the remaining rectangle
- Balls pass through each other (no ball-to-ball collision)
- Corner snapping: scissors snaps to exact corner when within `cornerSnapDistance` pixels

## Development Plan

The project follows an 8-step incremental plan in `development-plan/`. Each step is independently testable:

1. Scaffold, static rectangle, Start/Reset, game state
2. Timer, pause, game over
3. Scissors on border
4. Cutting mechanic
5. Scoring & win condition
6. Bouncing balls
7. Cut-line collision & ball spawning
8. UI polish & animations

Detailed task breakdowns are in `development-plan/step-{1-8}.md`.
Development progress is tracked in `development-plan/progress.md`, update it after each step

## Design Documents

- `game-design-document.md` — Complete game design (mechanics, controls, scoring, UI layout, configurable parameters)
- `tdd-option-a.md` — Technical design (architecture, data structures, algorithms, game loop)
- `game-ui.png` and `before-after-cut-scissor-position.png` — Visual references
