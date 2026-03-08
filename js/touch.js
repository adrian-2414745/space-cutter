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
  const d = { x: pendingDeltaX, y: pendingDeltaY };
  pendingDeltaX = 0;
  pendingDeltaY = 0;
  return d;
}
