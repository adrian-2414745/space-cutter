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
│ scissors.js calls isKeyDown() internally                       │ Can't test movement with synthetic input          │
├────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ Known bug in nibblePolygon (documented in bug-l-cut-report.md) │ Unresolved regression                             │
└────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘

  ---
Recommended Approach

Phase 1 — Unlock testing (minimal invasive changes)
1. Add package.json + Vitest (supports ES modules natively, no build config needed)
2. Fix mobile.js — wrap detection in a function or lazy-evaluate it
3. Write tests for the already-pure modules: polygon.js, collision.js, scoring.js
4. Write the nibblePolygon regression test from bug-l-cut-report.md (coordinates already specified), then fix the bug

Phase 2 — Decouple for testability
5. Wrap main.js startup in an init() — no more self-execution
6. Move DOM read/write out of config.js (pure config object stays, DOM functions move to ui.js)
7. Fix rectangle.js side-effect — caller assigns gameState.originalArea
8. Pass input direction as parameter into scissors.js movement functions (already done for touch, needs to match keyboard path)

Phase 3 — Production readiness
9. Remove console.log debug output in main.js:26
10. Audit scoring formula drift (GDD says ballDensityPx2 default is 33,000; code uses 50,000)
11. Consider a simple bundler (Vite) for cache-busting, minification, and proper prod/dev separation

  ---
My Recommendation

Start with Phase 1 only. The pure modules give you a lot of coverage immediately with very little refactoring risk. The nibblePolygon bug fix has a test case already written in
prose — converting that to code first means you have a regression guard before touching the geometry.

Phases 2 and 3 are real architectural changes — worth doing, but each carries some risk to the working game. I'd do them incrementally with test coverage expanding alongside.

Want to start? I'd suggest: add Vitest → write polygon/collision/scoring tests → write the nibblePolygon regression test → fix the bug. That's a clean first session with
concrete value.