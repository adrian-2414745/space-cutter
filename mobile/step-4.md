# Step 4 — Touch Swipe Controls (Scissors Movement)

## What the Tester Verifies

On mobile, start a game and place a finger on the canvas:
- **1:1 tracking:** Dragging finger left/right/up/down moves scissors in real time along the border
- **Dead zone:** Micro-touches and taps do not cause scissors to jump
- **Corner traversal:** Drag scissors into a corner and keep dragging in the same direction — scissors wraps to the adjacent edge without lifting the finger
- **Diagonal swipe at corner:** The dominant axis (larger of |dx|, |dy|) determines which edge scissors continues on
- **Swipe blocked during cut:** Once a cut is in progress, swiping does nothing until the cut completes
- **Desktop unchanged:** Keyboard arrow keys still move scissors normally

---

## Files Changed

### `js/touch.js` *(new file)*

```js
// Touch state
let activeId        = null;   // identifier of the tracked touch
let touchLastX      = 0;
let touchLastY      = 0;
let pendingDeltaX   = 0;
let pendingDeltaY   = 0;

// Double-tap state (used in Step 5)
let lastTapTime     = 0;
let lastTapX        = 0;
let lastTapY        = 0;
let onDoubleTap     = null;

export function setDoubleTapCallback(cb) {
  onDoubleTap = cb;
}

export function initTouch(canvas) {
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
  canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
}

function onTouchStart(e) {
  e.preventDefault();
  if (activeId !== null) return;         // only track one finger for movement
  const t = e.changedTouches[0];
  activeId    = t.identifier;
  touchLastX  = t.clientX;
  touchLastY  = t.clientY;
  pendingDeltaX = 0;
  pendingDeltaY = 0;
}

function onTouchMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== activeId) continue;
    pendingDeltaX += t.clientX - touchLastX;
    pendingDeltaY += t.clientY - touchLastY;
    touchLastX = t.clientX;
    touchLastY = t.clientY;
    break;
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === activeId) {
      activeId = null;
      // Double-tap detection (Step 5 fills this in)
      handleTapEnd(t);
      break;
    }
  }
}

function handleTapEnd(touch) {
  // Placeholder — fully implemented in Step 5
  const now  = performance.now();
  const dx   = touch.clientX - lastTapX;
  const dy   = touch.clientY - lastTapY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (now - lastTapTime < 300 && dist < 30) {
    onDoubleTap?.();
    lastTapTime = 0;
  } else {
    lastTapTime = now;
    lastTapX    = touch.clientX;
    lastTapY    = touch.clientY;
  }
}

/**
 * Called once per frame from main.js game loop.
 * Returns accumulated touch delta since last call, then resets.
 */
export function consumeTouchDelta() {
  const d = { x: pendingDeltaX, y: pendingDeltaY };
  pendingDeltaX = 0;
  pendingDeltaY = 0;
  return d;
}
```

### `js/scissors.js`

Add `updateScissorsMovementTouch` alongside the existing `updateScissorsMovement`. Reuse the existing `CORNER_TRANSITIONS` table and edge-length helpers already in the file.

```js
const DEAD_ZONE = 8; // px — minimum swipe magnitude to register movement

/**
 * Move scissors based on a touch swipe delta (called once per frame).
 * Handles corner traversal and the 8px dead zone.
 */
export function updateScissorsMovementTouch(scissors, rect, config, dx, dy) {
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < DEAD_ZONE) return;

  const edgeLen = getEdgeLength(scissors.edge, rect); // reuse existing helper

  // At a corner: determine which adjacent edge to transition to
  const atStart = scissors.pos <= 0;
  const atEnd   = scissors.pos >= edgeLen;

  if (atStart || atEnd) {
    // Dominant axis decides the transition direction
    const dominantKey = getDominantKey(scissors.edge, atEnd, dx, dy);
    if (dominantKey) {
      const transition = CORNER_TRANSITIONS.find(
        t => t.from === scissors.edge && t.key === dominantKey
      );
      if (transition) {
        scissors.edge = transition.to;
        scissors.pos  = transition.pos === 'max' ? getEdgeLength(transition.to, rect) : 0;
        // Re-derive delta for the new edge axis and continue
        const newDelta = getEdgeDelta(scissors.edge, dx, dy);
        applyDelta(scissors, rect, config, newDelta);
        return;
      }
    }
    return; // no valid transition (e.g. swipe back along same edge)
  }

  // Normal case: apply delta along current edge axis
  const delta = getEdgeDelta(scissors.edge, dx, dy);
  applyDelta(scissors, rect, config, delta);
}

/** Map edge + corner position + swipe dx/dy to the matching arrow key string */
function getDominantKey(edge, atEnd, dx, dy) {
  // For each edge, two axes matter; pick the dominant one and map to a key
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  if (edge === 'top' || edge === 'bottom') {
    // Moving along x-axis; at corner the perpendicular (y) triggers a transition
    if (!horizontal) return dy > 0 ? 'ArrowDown' : 'ArrowUp';
    // Continuing along same edge (no transition needed, but we're at pos=0/end)
    return dx > 0 ? 'ArrowRight' : 'ArrowLeft';
  } else { // left or right edge
    if (horizontal) return dx > 0 ? 'ArrowRight' : 'ArrowLeft';
    return dy > 0 ? 'ArrowDown' : 'ArrowUp';
  }
}

/** Extract the scalar movement delta for the current edge's axis */
function getEdgeDelta(edge, dx, dy) {
  if (edge === 'top' || edge === 'bottom') return dx;
  return dy;
}

/** Apply scalar delta to scissors.pos with clamping and corner snap */
function applyDelta(scissors, rect, config, delta) {
  const edgeLen = getEdgeLength(scissors.edge, rect);
  scissors.pos  = Math.max(0, Math.min(edgeLen, scissors.pos + delta));

  // Corner snap (same logic as keyboard version)
  if (scissors.pos < config.cornerSnapDistance && delta < 0) {
    scissors.pos = 0;
  } else if (scissors.pos > edgeLen - config.cornerSnapDistance && delta > 0) {
    scissors.pos = edgeLen;
  }
}
```

> **Note:** `getEdgeLength` and `CORNER_TRANSITIONS` already exist in `scissors.js` — no duplication needed. Check their exact names before implementing.

### `js/main.js`

```js
import { initTouch, consumeTouchDelta, setDoubleTapCallback } from './touch.js';
import { updateScissorsMovement, updateScissorsMovementTouch, /* existing imports */ } from './scissors.js';

// After initInput():
if (isMobile) {
  initTouch(canvas);
}

// In update(), replace the scissors movement section:
if (isMobile) {
  if (gameState.state === RUNNING) {
    const { x: dx, y: dy } = consumeTouchDelta();
    updateScissorsMovementTouch(scissors, rect, config, dx, dy);
  } else {
    consumeTouchDelta(); // drain to prevent accumulated delta from applying after state change
  }
} else {
  updateScissorsMovement(scissors, rect, dt, config);
}
```

---

## Key Details

- **`{ passive: false }` + `e.preventDefault()`** — mandatory to block browser scroll/zoom on canvas touch. Omitting either causes the page to scroll when the user swipes.
- **`touch-action: none`** on `#game-canvas` (added in Step 2 CSS) reinforces this at the CSS level.
- **Touch identifier tracking** — `activeId` stores the `touch.identifier` from `touchstart`. Subsequent `touchmove`/`touchend` events only update state when the matching identifier is found in `e.changedTouches`. This prevents jumps when a second finger is added or when the first finger lifts before the second.
- **Delta accumulation** — `touchmove` fires faster than 60fps on some devices. Accumulating into `pendingDeltaX/Y` and consuming once per frame produces smooth, frame-rate-independent movement.
- **Drain when not RUNNING** — `consumeTouchDelta()` must be called even when movement is blocked (CUTTING state). Otherwise deltas accumulate and scissors teleports when the cut ends.
- **Corner traversal** — The swipe does not need to stop at a corner; the `getDominantKey` + `CORNER_TRANSITIONS` logic transitions the scissors to the adjacent edge within the same frame's delta. For very fast swipes spanning multiple edges in one frame, only one transition fires per frame (additional wrapping is not needed per spec).
