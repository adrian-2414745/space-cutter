# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Space Cutter** is a single-player arcade/puzzle browser game. The player nibbles rectangular corners off a polygon playing field using L-shaped cuts while avoiding bouncing balls. Each cut shrinks the field and spawns a new ball. The goal is to reduce the polygon to under 15% of its original area before a countdown timer expires.

## Tech Stack & Architecture

- **Vanilla JavaScript (ES modules)** — no frameworks, no build tools, no dependencies
- **HTML5 Canvas** for all rendering
- Single-page app: `index.html` loads modules via `<script type="module">`
- To run: open `index.html` in a browser (or use any static file server)

## Core Mechanics to Preserve

- **Two-phase L-shaped cuts:** Phase 1 moves perpendicular inward from current edge; Phase 2 turns 90° toward nearest polygon boundary. Both phases are axis-aligned.
- Scissors moves CW/CCW along polygon perimeter (Right/Left arrows or swipe) with automatic corner wrapping
- Scissors cannot cut from a corner — must be on an edge
- Cut collision checks **both segments** of the L-shaped cut line each frame, not just the scissors tip
- On cut failure (ball touches either segment), scissors resets to its starting position
- On cut success, the rectangular corner enclosed by the L-path is removed (nibbled); scissors repositions to the turn point on the new edge
- After each cut, one new ball spawns inside the remaining polygon
- Balls reflect off all polygon edges using CW inward normals; balls pass through each other
- Corner snapping: scissors snaps to exact corner when within `cornerSnapDistance` pixels

## Testing

- **Framework:** [Vitest](https://vitest.dev/) — `npm test` (single run) or `npm run test:watch` (watch mode)
- **Test files:** `tests/**/*.test.js`
- Tests target pure functions in game modules; no browser/canvas environment needed
- `polygon.js` is a pure leaf module (no imports) — prefer it for unit tests
- `ball.js` imports from `polygon.js` — both resolve fine under vitest's ES module support
- development environment: Windows 11

## Design Documents

- `game-design-document.md` — Complete game design (mechanics, controls, scoring, UI layout, configurable parameters)
- `architecture.md` — High level technical design (architecture, data structures, algorithms, game loop)
- `game-ui.png` and `before-after-cut-scissor-position.png` — Visual references


# Build commands

## Tests

Quick: `npm test`
Single test: `npx vitest run -t "test-name"`
