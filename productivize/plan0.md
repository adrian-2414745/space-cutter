  ---
Current State

What's good:
- polygon.js, collision.js, scoring.js, and ball.js are already pure functions — no globals, no DOM. You could write unit tests for them today with zero code changes.
- scissors.js is reasonably clean data-in/data-out.
- renderer.js is properly separated from game logic.

What blocks productization:

┌────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
│                            Problem                             │                      Impact                       │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ No package.json, no test runner                                │ Can't write any tests                             │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ mobile.js evaluates window.ontouchstart at import time         │ Crashes in Node.js — blocks every test            │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ main.js self-executes on import                                │ Game starts the moment you import it — untestable │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ config.js calls document.getElementById directly               │ DOM coupled                                       │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ rectangle.js mutates gameState as a side-effect                │ Hidden coupling                                   │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤

├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Known bug in nibblePolygon (documented in bug-l-cut-report.md) │ Unresolved regression                             │
└────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘

  ---
Recommended Approach

Phase 1
4. Fix mobile.js — wrap detection in a function or lazy-evaluate it
5. Wrap main.js startup in an init() — no more self-execution
6. Move DOM read/write out of config.js (pure config object stays, DOM functions move to ui.js)
7. Fix rectangle.js side-effect — caller assigns gameState.originalArea

Phase 2 — Production readiness
9. Remove console.log debug output in main.js:26
10. Audit scoring formula drift (GDD says ballDensityPx2 default is 33,000; code uses 50,000)
11. Consider a simple bundler (Vite) for cache-busting, minification, and proper prod/dev separation

  ---
My Recommendation


Phases 1 and 2 are real architectural changes — worth doing, but each carries some risk to the working game. I'd do them incrementally with test coverage expanding alongside.
