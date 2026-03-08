// Touch state
let activeId        = null;   // identifier of the tracked touch
let touchLastX      = 0;
let touchLastY      = 0;
let pendingDeltaX   = 0;
let pendingDeltaY   = 0;

// Velocity tracking for frame coasting
let touchVelocityX  = 0;     // px/ms, exponential moving average
let lastMoveTime    = 0;

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
  touchVelocityX = 0;
  lastMoveTime = performance.now();
}

function onTouchMove(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier !== activeId) continue;
    const dx = t.clientX - touchLastX;
    pendingDeltaX += dx;
    pendingDeltaY += t.clientY - touchLastY;
    touchLastX = t.clientX;
    touchLastY = t.clientY;

    // Update velocity EMA (px/ms)
    const now = performance.now();
    const elapsed = now - lastMoveTime;
    if (elapsed > 0) {
      const instantV = dx / elapsed;
      touchVelocityX = instantV * 0.6 + touchVelocityX * 0.4;
    }
    lastMoveTime = now;
    break;
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === activeId) {
      activeId = null;
      touchVelocityX = 0;
      handleTapEnd(t);
      break;
    }
  }
}

function handleTapEnd(touch) {
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
  const d = { x: pendingDeltaX, y: pendingDeltaY, vx: touchVelocityX, touching: activeId !== null };
  pendingDeltaX = 0;
  pendingDeltaY = 0;
  return d;
}
