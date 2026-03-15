# Architecture for Testability

## Principles

Game code is notoriously hard to test. A real-time loop, user input, rendering, audio, physics, and mutable state all conspire to create a tangled ball of dependencies that resists isolated verification. The principles below describe how to structure a game so that its logic — the part that actually matters — can be tested cheaply, quickly, and deterministically.

### Logic and platform are separate worlds

Every game has two layers: the logic that computes what happens, and the platform that makes it visible and interactive. Logic is math, rules, and state transitions. 
Platform is the screen, the speaker, the keyboard, the touch surface. These two layers must not know about each other directly. 
Logic modules should never import or reference anything that only exists inside a browser, a game engine, or an operating system. 
If a function cannot run in a plain scripting environment with no display, no input devices, and no filesystem, it belongs in the platform layer, not the logic layer.

### Functions take data in and return data out

A testable function receives everything it needs through its arguments and communicates its results through its return value. 
It does not reach into global variables, query hardware, or mutate objects that were not handed to it.
When a function needs information that comes from the outside world — which keys are pressed, how much time has passed, where the mouse is — that information should arrive as ordinary data: 
a simple object, a number, a boolean. The caller is responsible for gathering that data from whatever platform it lives on. The function itself has no opinion about where the data came from.

### State is explicit and owned, not ambient

Game state — the player's position, the score, the level layout, the list of active enemies — should be a concrete object that gets passed around,
not a set of module-level variables that anyone can read or write. When state is ambient, tests interfere with each other because one test's mutations leak into the next.
When state is an explicit object, each test can create a fresh one, run the function, and inspect the result without worrying about cleanup.

### The game loop is a thin orchestrator

The main loop — the function that runs every frame — should do very little thinking of its own.
Its job is to gather input, call the logic functions that compute the next state, and then hand that state to the renderer. 
If the loop itself contains decision-making, branching, or computation, that work is trapped in a place that is hard to invoke from a test. 
The loop should be a short, boring sequence of calls: read input, update world, draw world.

### Updates and rendering never intermingle

Computing the next state and drawing the current state are two completely separate operations. 
When rendering calls appear inside update logic, you cannot test the update without providing a working graphics context. Keep them in separate phases: 
first compute everything, then draw everything. This also makes it trivial to run the update step in a test — just call it and inspect the resulting state, without ever needing a canvas or screen.

### Randomness and time are inputs, not discoveries

Games need randomness for spawning, variation, and unpredictability. They need time deltas for smooth animation and physics. 
But if a function internally calls the system clock or the random number generator, its output becomes unpredictable and tests become flaky or impossible to write. 
Instead, treat the random seed or random function and the elapsed time as parameters. In production the caller provides the real clock and the real random generator. 
In tests the caller provides fixed values, making every run perfectly reproducible.

### Side effects happen at the boundary, not in the interior

Sounds, network messages, file writes, analytics events — these are all side effects. They should happen at the outermost layer of the game, not buried inside logic functions. 
A function that computes whether the player scored a point should return that fact as data. A separate piece of code at the boundary decides to play the "ding" sound and send the score to the server.
This keeps the scoring logic testable and the side effects easy to find and control.

### Each module has one reason to be hard to test

If a module is difficult to test, there should be exactly one clear reason: it talks to the platform. 
If a module is hard to test for multiple reasons — it uses the keyboard and manages game rules and calls the renderer — it is doing too much. Decompose it until each piece is either pure logic (easy to test) or a thin platform adapter (tested manually or through integration tests, but not a source of logic bugs).

---

## Current State

All game logic modules are now fully unit-testable (pure, no browser deps):

- `polygon.js` — 13 functions, zero imports, pure geometry.
- `collision.js` — takes ball + scissors objects, returns bool.
- `scoring.js` — pure calculation, takes numbers, returns number.
- `ball.js` — only imports from `polygon.js`. (`createBall` uses `Math.random` internally — acceptable for now.)
- `scissors.js` — fully pure after `isKeyDown` was removed; takes `input: { left, right }` as a parameter.
- `game.js` — extracted from `main.js`; 4 pure functions taking explicit args, returning values.

`main.js` is the sole platform-coupled module: it owns the game loop, wires input/rendering, and holds mutable state. All computation is delegated to the modules above.

---

## Core Principle: Logic Must Not Import Platform

A module is testable if and only if it can be imported in a Node.js/vitest environment without error. The moment a module imports something that touches `document`, `window`, `canvas`, or `requestAnimationFrame`, it becomes untestable without a DOM mock.

The rule: **game logic modules must not import from platform modules** (`input.js`, `touch.js`, `renderer.js`, `mobile.js`).

Platform modules are fine to exist — they're the bridge between browser APIs and game logic. But the bridge must be one-directional: platform modules call logic modules, never the reverse.

No current violations.

---

## What Not to Change

- `polygon.js` — already a model of good design. No changes needed.
- `collision.js`, `scoring.js` — already pure.
- The rendering pipeline — `renderer.js` is a platform module, coupling to other modules from within it is acceptable.
- `state.js` constants — fine as-is.
- `ball.js` — `createBall` uses `Math.random` internally; acceptable for now. If deterministic testing of spawn position becomes needed, pass a `rng` function as a parameter.

---

## Fixes Applied

**`scissors.js` (2026-03-15):** Removed `import { isKeyDown }`. Added `input: { left, right }` parameter to `updateScissorsMovement`. `main.js` builds that object from `isKeyDown` and passes it in. `scissors.js` is now fully unit-testable.

**`game.js` (2026-03-15):** Extracted `reconcileBalls`, `completeCut` → `applyCompletedCut`, `completeStraightCut` → `applyStraightCut`, and `checkCutCollision` out of `main.js` as pure exported functions. `main.js` delegates to these and handles state mutations and rendering. `drawTimer` and `drawLiveScore` moved from `update()` into `render()`.
