# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Space Cutter** is a single-player arcade/puzzle browser game. The player removes off areas from the polygon playing field using L-shaped cuts or straight cuts while avoiding bouncing balls. Each cut shrinks the field. The goal is to reduce the polygon to under 15% of its original area before a countdown timer expires.

## Tech Stack & Architecture

- **Vanilla JavaScript (ES modules)** — no frameworks, no build tools, no dependencies
- **HTML5 Canvas** for all rendering
- Single-page app: `index.html` loads modules via `<script type="module">`
- To run: open `index.html` in a browser (or use any static file server)

## Testing

- **Framework:** [Vitest](https://vitest.dev/) — `npm test` (single run) or `npm run test:watch` (watch mode) or Single test: `npx vitest run -t "test-name"`
- **Test files:** `tests/**/*.test.js`
- Tests target pure functions in game modules; no browser/canvas environment needed
- Each module under a folder, each function under tests in its own test file.


## Design Documents

- `game-design-document.md` — Complete game design (mechanics, controls, scoring, UI layout, configurable parameters)
- `architecture.md` — High level technical design (architecture, data structures, algorithms, game loop)
- `game-ui.png` and `before-after-cut-scissor-position.png` — Visual references

