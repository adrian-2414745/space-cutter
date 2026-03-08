import { isKeyDown } from './input.js';

export function createScissors(rect) {
  return {
    edge: 'top',
    pos: rect.width / 2,
    cutting: false,
    cutStart: null,
    cutCurrent: null,
    cutEdge: null,
    cutPos: null,
  };
}

export function isAtCorner(scissors, rect) {
  return getCorner(scissors, rect) !== null;
}

export function initiateCut(scissors, rect) {
  scissors.cutting = true;
  const screenPos = getScissorsScreenPosition(scissors, rect);
  scissors.cutStart = { x: screenPos.x, y: screenPos.y };
  scissors.cutCurrent = { x: screenPos.x, y: screenPos.y };
  scissors.cutEdge = scissors.edge;
  scissors.cutPos = scissors.pos;
}

export function updateScissorsCut(scissors, rect, dt, config) {
  const speed = config.scissorsCutSpeed * dt;
  switch (scissors.cutEdge) {
    case 'top':
      scissors.cutCurrent.y = Math.min(scissors.cutCurrent.y + speed, rect.y + rect.height);
      break;
    case 'bottom':
      scissors.cutCurrent.y = Math.max(scissors.cutCurrent.y - speed, rect.y);
      break;
    case 'left':
      scissors.cutCurrent.x = Math.min(scissors.cutCurrent.x + speed, rect.x + rect.width);
      break;
    case 'right':
      scissors.cutCurrent.x = Math.max(scissors.cutCurrent.x - speed, rect.x);
      break;
  }
}

export function checkCutComplete(scissors, rect) {
  switch (scissors.cutEdge) {
    case 'top':    return scissors.cutCurrent.y >= rect.y + rect.height;
    case 'bottom': return scissors.cutCurrent.y <= rect.y;
    case 'left':   return scissors.cutCurrent.x >= rect.x + rect.width;
    case 'right':  return scissors.cutCurrent.x <= rect.x;
  }
  return false;
}

const OPPOSITE_EDGE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export function cancelCut(scissors) {
  scissors.cutting = false;
  scissors.cutStart = null;
  scissors.cutCurrent = null;
  scissors.cutEdge = null;
  scissors.cutPos = null;
}

export function repositionScissorsAfterCut(scissors, newRect) {
  const oppositeEdge = OPPOSITE_EDGE[scissors.cutEdge];
  scissors.edge = oppositeEdge;

  // The cut endpoint is at a corner of the new rectangle.
  // Determine pos based on which piece was kept.
  const edgeLen = getEdgeLength(scissors, newRect);
  const cutScreenPos = (scissors.cutEdge === 'top' || scissors.cutEdge === 'bottom')
    ? scissors.cutStart.x
    : scissors.cutStart.y;

  const rectStart = (scissors.cutEdge === 'top' || scissors.cutEdge === 'bottom')
    ? newRect.x
    : newRect.y;

  // If the new rect starts at the same position as the original, the cut is at the far end
  // If the new rect starts at the cut position, the cut is at pos 0
  if (Math.abs(rectStart - cutScreenPos) < 1) {
    scissors.pos = 0;
  } else {
    scissors.pos = edgeLen;
  }

  scissors.cutting = false;
  scissors.cutStart = null;
  scissors.cutCurrent = null;
  scissors.cutEdge = null;
  scissors.cutPos = null;
}

export function getScissorsScreenPosition(scissors, rect) {
  switch (scissors.edge) {
    case 'top':    return { x: rect.x + scissors.pos, y: rect.y };
    case 'bottom': return { x: rect.x + scissors.pos, y: rect.y + rect.height };
    case 'left':   return { x: rect.x, y: rect.y + scissors.pos };
    case 'right':  return { x: rect.x + rect.width, y: rect.y + scissors.pos };
  }
}

function getEdgeLength(scissors, rect) {
  return (scissors.edge === 'top' || scissors.edge === 'bottom') ? rect.width : rect.height;
}

function getCorner(scissors, rect) {
  const edgeLen = getEdgeLength(scissors, rect);
  if (scissors.pos !== 0 && scissors.pos !== edgeLen) return null;

  const atStart = scissors.pos === 0;
  switch (scissors.edge) {
    case 'top':    return atStart ? 'top-left' : 'top-right';
    case 'bottom': return atStart ? 'bottom-left' : 'bottom-right';
    case 'left':   return atStart ? 'top-left' : 'bottom-left';
    case 'right':  return atStart ? 'top-right' : 'bottom-right';
  }
}

const CORNER_TRANSITIONS = {
  'top-left': [
    { from: 'top',    key: 'ArrowDown',  to: 'left',   pos: 0 },
    { from: 'left',   key: 'ArrowRight', to: 'top',    pos: 0 },
  ],
  'top-right': [
    { from: 'top',    key: 'ArrowDown',  to: 'right',  pos: 0 },
    { from: 'right',  key: 'ArrowLeft',  to: 'top',    pos: 'max' },
  ],
  'bottom-left': [
    { from: 'bottom', key: 'ArrowUp',    to: 'left',   pos: 'max' },
    { from: 'left',   key: 'ArrowRight', to: 'bottom', pos: 0 },
  ],
  'bottom-right': [
    { from: 'bottom', key: 'ArrowUp',    to: 'right',  pos: 'max' },
    { from: 'right',  key: 'ArrowLeft',  to: 'bottom', pos: 'max' },
  ],
};

function tryCornerTransition(scissors, rect) {
  const corner = getCorner(scissors, rect);
  if (!corner) return false;

  const options = CORNER_TRANSITIONS[corner];

  for (const transition of options) {
    // Check if we are on the edge that allows this specific transition
    if (scissors.edge === transition.from && isKeyDown(transition.key)) {

      scissors.edge = transition.to;
      const edgeLen = getEdgeLength(scissors, rect);

      // Set the new position
      if (transition.pos === 'max') {
        scissors.pos = edgeLen;
      } else {
        scissors.pos = transition.pos;
      }

      // NUDGE: Move 1 pixel onto the new edge so we don't
      // immediately trigger another transition check.
      if (scissors.pos === 0) {
        scissors.pos = 1;
      } else {
        scissors.pos = edgeLen - 1;
      }

      console.log(`Turned corner ${corner} onto ${scissors.edge} edge`);
      return true;
    }
  }
  return false;
}

const DEAD_ZONE = 6; // px — minimum swipe magnitude to register movement

/**
 * Move scissors based on a touch swipe delta (called once per frame).
 * Handles corner traversal and the 8px dead zone.
 */
export function updateScissorsMovementTouch(scissors, rect, config, dx, dy) {
  // Use the edge-relevant component for dead zone, not total magnitude.
  // Diagonal swipes still move scissors by their horizontal/vertical component.
  const delta = getEdgeDelta(scissors.edge, dx, dy);
  if (Math.abs(delta) < DEAD_ZONE) {
    // Even if the edge-axis component is too small, check if we're at a corner
    // and the perpendicular component is large enough to trigger a transition.
    const edgeLen = getEdgeLength(scissors, rect);
    const atStart = scissors.pos <= 0;
    const atEnd   = scissors.pos >= edgeLen;
    if ((atStart || atEnd) && Math.sqrt(dx * dx + dy * dy) >= DEAD_ZONE) {
      const corner = getCorner(scissors, rect);
      if (corner) {
        const dominantKey = getDominantKey(scissors.edge, dx, dy);
        const options = CORNER_TRANSITIONS[corner];
        const transition = options.find(
          t => t.from === scissors.edge && t.key === dominantKey
        );
        if (transition) {
          scissors.edge = transition.to;
          const newEdgeLen = getEdgeLength(scissors, rect);
          scissors.pos = transition.pos === 'max' ? newEdgeLen : 0;
          const newDelta = getEdgeDelta(scissors.edge, dx, dy);
          applyTouchDelta(scissors, rect, config, newDelta);
        }
      }
    }
    return;
  }

  const edgeLen = getEdgeLength(scissors, rect);
  const atStart = scissors.pos <= 0;
  const atEnd   = scissors.pos >= edgeLen;

  if (atStart || atEnd) {
    const corner = getCorner(scissors, rect);
    if (corner) {
      const dominantKey = getDominantKey(scissors.edge, dx, dy);
      const options = CORNER_TRANSITIONS[corner];
      const transition = options.find(
        t => t.from === scissors.edge && t.key === dominantKey
      );
      if (transition) {
        scissors.edge = transition.to;
        const newEdgeLen = getEdgeLength(scissors, rect);
        scissors.pos = transition.pos === 'max' ? newEdgeLen : 0;
        const newDelta = getEdgeDelta(scissors.edge, dx, dy);
        applyTouchDelta(scissors, rect, config, newDelta);
        return;
      }
    }
    return;
  }

  applyTouchDelta(scissors, rect, config, delta);
}

/** Map edge + swipe dx/dy to the matching arrow key string (dominant axis) */
function getDominantKey(edge, dx, dy) {
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  if (edge === 'top' || edge === 'bottom') {
    if (!horizontal) return dy > 0 ? 'ArrowDown' : 'ArrowUp';
    return dx > 0 ? 'ArrowRight' : 'ArrowLeft';
  } else {
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
function applyTouchDelta(scissors, rect, config, delta) {
  const edgeLen = getEdgeLength(scissors, rect);
  scissors.pos = Math.max(0, Math.min(edgeLen, scissors.pos + delta));

  if (scissors.pos < config.cornerSnapDistance && delta < 0) {
    scissors.pos = 0;
  } else if (scissors.pos > edgeLen - config.cornerSnapDistance && delta > 0) {
    scissors.pos = edgeLen;
  }
}

export function updateScissorsMovement(scissors, rect, dt, config) {
  const speed = config.scissorsBorderSpeed * dt;
  const edgeLen = getEdgeLength(scissors, rect);

  // 1. Check for manual corner turns first
  if (scissors.pos <= 0 || scissors.pos >= edgeLen) {
    if (tryCornerTransition(scissors, rect)) return;
  }

  // 2. Standard movement (Parallel to the current edge)
  let delta = 0;
  if (scissors.edge === 'top' || scissors.edge === 'bottom') {
    if (isKeyDown('ArrowLeft'))  delta -= speed;
    if (isKeyDown('ArrowRight')) delta += speed;
  } else {
    if (isKeyDown('ArrowUp'))   delta -= speed;
    if (isKeyDown('ArrowDown')) delta += speed;
  }

  if (delta === 0) return;

  // Apply movement with clamping
  scissors.pos = Math.max(0, Math.min(edgeLen, scissors.pos + delta));

  // 3. Magnetic Snapping
  // Only snap if we are moving TOWARD the corner
  if (scissors.pos < config.cornerSnapDistance && delta < 0) {
    scissors.pos = 0;
  } else if (scissors.pos > edgeLen - config.cornerSnapDistance && delta > 0) {
    scissors.pos = edgeLen;
  }
}
