 Refactor to Pure Functions with Top-Down State Flow

 Context

 The game currently uses a mutable shared gameState singleton plus module-level variables (poly, scissors) that are mutated in-place by various functions. This makes the data flow hard to follow and difficult to test. 
  The goal is to make update() a pure function: update(gameState, dt, input, config) → newGameState, where all sub-functions also return new values instead of mutating.

 New GameState Shape

 Merge poly and scissors (currently module-level vars in main.js) into gameState. Rename state → phase to avoid gameState.state confusion:

 {
   phase: 'IDLE',          // was gameState.state
   previousPhase: null,    // was gameState.previousState
   score: 100,
   originalArea: 0,
   timeRemaining: 180,
   balls: [],
   successfulCuts: 0,
   failedCuts: 0,
   finalScore: null,
   poly: { vertices: [...] },
   scissors: { edgeIndex, pos, cutting, cutPhase, cutStart, cutCurrent, cutTurn, cutTarget, cutDirection, cutTurnDirection },
 }

 config stays separate (read-only configuration, passed as argument).

 Implementation Steps

 Each step keeps the game working and tests passing before moving to the next.


 Step 2: Scissors functions → return new scissors (scissors.js)

 Convert each in order (simplest first):

 1. cancelCut → return { ...scissors, cutting: false, cutPhase: 0, cutStart: null, ... }
 2. initiateCut → return { ...scissors, cutting: true, cutPhase: 1, cutDirection: ..., cutStart: ..., cutCurrent: ... }
 3. updateScissorsCut → return { ...scissors, cutCurrent: { x: newX, y: newY } }
 4. triggerPhase2 → return { ...scissors, cutTurn: ..., cutTurnDirection: ..., cutTarget: ..., cutPhase: 2 }
 5. updateScissorsMovement → return { ...scissors, edgeIndex: ..., pos: ... } (or scissors unchanged on delta=0)
 6. updateScissorsMovementTouch → same pattern
 7. repositionScissorsAfterCut → calls cancelCut internally, return spread result with new edgeIndex/pos

 For each: update call site in main.js (scissors = fn(scissors, ...)), update tests.

 Step 3: Move poly and scissors into gameState (state.js, main.js)

 - Remove let poly, scissors module-level vars from main.js
 - Add poly and scissors to gameState object
 - resetGameWorld sets them on gameState
 - Update all references in update() and render(): poly → gameState.poly, scissors → gameState.scissors
 - Rename gameState.state → gameState.phase and gameState.previousState → gameState.previousPhase throughout

 Step 4: state.js → factory module

 - Remove mutable singleton gameState, setState(), resetState()
 - Add createGameState(config, poly, scissors) → returns fresh state object
 - main.js holds state in let currentState = createGameState(...)
 - Keep phase constants exported as before

 Step 5: update() → pure function (main.js)

 - Change signature: update(gameState, dt, input, config) → newGameState
 - Replace all gameState.x = y mutations with building a return object
 - Inline completeCut() and completeStraightCut() logic (or extract as pure helpers returning { poly, scissors, score, phase, ... })
 - Remove drawScore() call from within update logic (it belongs in render)
 - Game loop becomes: currentState = update(currentState, dt, input, config)

 Step 6: render() → takes gameState param (main.js)

 - Change signature: render(gameState, ctx, canvas, config)
 - Game loop: render(currentState, ctx, canvas, config)
 - All data comes from gameState param, no module imports needed

 Step 7: Decouple ui.js from state singleton

 - Change initUI(resetCallback) → initUI(resetCallback, getState, setPhase)
   - getState: returns current gameState (closure in main.js)
   - setPhase: callback to transition phase (e.g., IDLE → RUNNING)
 - handleStart uses getState().phase === IDLE then calls setPhase(RUNNING)
 - handleReset uses getState() to read score/timer for display
 - handleConfig uses getState().phase to check IDLE
 - Remove import { gameState, setState } from './state.js' from ui.js

 Step 8: Update getWorld() and initGameWorld() exports

 - getWorld() → reads from currentState instead of module vars
 - initGameWorld() → returns a new gameState instead of mutating module vars (or update currentState)

 Files to Modify

 ┌──────────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
 │           File           │                                     Changes                                     │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ js/ball.js               │ updateBall returns new ball                                                     │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ js/scissors.js           │ All 7 mutating functions return new scissors                                    │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ js/state.js              │ Remove singleton + mutators, add createGameState factory                        │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ js/main.js               │ Restructure update/render, hold state in let, remove module-level poly/scissors │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ js/ui.js                 │ Use callbacks instead of importing gameState                                    │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ tests/ball/*.test.js     │ Assert on return values                                                         │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ tests/scissors/*.test.js │ Assert on return values                                                         │
 ├──────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
 │ tests/game/*.test.js     │ Minor updates for new signatures                                                │
 └──────────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

 Existing Pure Functions to Keep As-Is

 These are already pure and need no changes:
 - game.js: reconcileBalls, applyCompletedCut, applyStraightCut, checkCutCollision
 - scissors.js: checkCutComplete, getCutDepth, canCompleteCut, getPreviewLine, getScissorsScreenPosition, isAtCorner, createScissors
 - polygon.js: all functions
 - scoring.js: calculateScore
 - collision.js: all functions

 Verification

 1. npm test — all existing tests pass after each step
 2. Open index.html in browser — game plays identically (start, move scissors, cut, balls bounce, timer, win/lose)
 3. After Step 5, add tests/game/update.test.js to test top-level state transitions as pure function