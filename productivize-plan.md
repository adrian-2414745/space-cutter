# Productivize Plan

Goal: make the game production-ready and expandable — clean architecture, full test coverage, no tech debt blockers — before adding new features.

---

## 1. Architecture & Code Quality

### 1.1 Extract constants
- Move magic numbers and string literals (dash patterns, colors, sizes, thresholds) from renderer.js, touch.js, collision.js into config.js or a new `constants.js`
- Removes scattered hardcoded values that break when copied to new contexts

### 1.2 Refactor state transitions out of main.js
- main.js currently mixes game loop, state transitions, and orchestration
- Extract a `transitions.js` module with explicit `transitionTo(state)` + guards
- main.js becomes a thin loop: update physics → handle input → render → check transitions
- Makes state machine testable and extensible (adding new states won't require touching the loop)

### 1.3 Fix scoring for non-rectangular polygons
- `scoring.js` line 4 has TODO: `idealCuts` assumes rectangle — wrong for arbitrary rectilinear shapes
- Replace with area-based estimate or remove idealCuts multiplier until a correct algorithm is designed
- Document chosen approach in game-design-document.md

### 1.4 Consolidate cut completion paths
- main.js has two separate handlers: `completeCut` and `completeStraightCut`, with shared bookkeeping duplicated
- Extract a single `finalizeCut(result)` that handles score update, ball reconcile, scissors reposition, state reset

### 1.5 Validate ball physics reflection
- Confirm the CW inward normal `(-dy, dx)` produces correct reflections for all edge orientations
- Write failing tests if bugs found, then fix

---

## 2. Test Coverage

### 2.1 scoring.js — unit tests
- Test each multiplier (time, efficiency, penalty) in isolation
- Test boundary conditions: 0 cuts, all cuts failed, max time remaining

### 2.2 state machine — unit tests
- Valid transitions: IDLE→RUNNING, RUNNING→CUTTING, CUTTING→RUNNING, etc.
- Invalid/guard rejections
- State data (score, timer) preserved or reset correctly on each transition

### 2.3 collision.js — edge cases
- Ball exactly on cut line (tolerance boundary)
- Phase 2 turn point collision
- Ball moving parallel to cut segment

### 2.4 renderer.js — smoke tests
- Use an `OffscreenCanvas` or mock context to confirm draw calls are made without throwing
- Not pixel-perfect — just assert no exceptions and correct API call counts for key paths

### 2.5 input.js / touch.js — unit tests
- Key down/up tracking
- Swipe delta accumulation
- Double-tap detection (within/outside time window and distance threshold)

### 2.6 Integration test: full cut sequence
- Set up polygon + scissors in RUNNING state
- Drive through Phase 1 → Phase 2 → completion
- Assert: polygon area reduced, score updated, balls reconciled, scissors repositioned

---

## 3. Developer Experience

### 3.1 ESLint configuration
- Add ESLint with a minimal flat config (no-unused-vars, no-undef, consistent returns)
- Add `npm run lint` script
- Prevents class of bugs caught only at runtime in the browser

### 3.2 CI via GitHub Actions
- Single workflow: install → lint → test on push/PR to main
- Keeps the main branch green without manual effort

### 3.3 Local dev server
- Add `npm run dev` using `vite --config vite.config.js` or simply `npx serve .`
- Opens the game at localhost instead of requiring file:// which blocks ES modules in some browsers

### 3.4 README
- Short project description, how to run, how to test, link to design docs
- Entry point for new contributors

---

## 4. Observability & Debug

### 4.1 Debug overlay (dev-only)
- Optional canvas overlay (toggled by `D` key or `?debug=1` URL param) showing:
  - Ball velocity vectors
  - Polygon vertex indices
  - Current state + frame time
- Gated behind a flag so it ships zero cost in production

### 4.2 Error boundaries in game loop
- Wrap the `requestAnimationFrame` callback in try/catch
- On error: log to console, transition to GAME_OVER with an error message, stop loop
- Prevents silent infinite loops when geometry goes bad

---

## Suggested Order

1. Fix scoring TODO (1.3) — correctness bug, low effort
2. Consolidate cut completion (1.4) — reduces duplication before adding new cut types
3. Extract constants (1.1) — low risk, improves all subsequent work
4. Scoring tests (2.1) — validates the fix from step 1
5. Integration test (2.6) — baseline before refactoring state
6. Refactor state transitions (1.2) — safe with integration test in place
7. State machine tests (2.2) — lock in the refactor
8. Input/touch tests (2.5) — coverage gap
9. Renderer smoke tests (2.4) — lowest priority, most effort for least return
10. ESLint + CI (3.1, 3.2) — automation that pays off immediately
11. Dev server + README (3.3, 3.4) — polish
12. Debug overlay + error boundary (4.1, 4.2) — operational readiness
