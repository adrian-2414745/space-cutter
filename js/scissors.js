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

const CW_EDGE_SIGN = { top: 1, right: 1, bottom: -1, left: -1 };

const CW_NEXT = {
  top:    { edge: 'right',  pos: 0     },
  right:  { edge: 'bottom', pos: 'max' },
  bottom: { edge: 'left',   pos: 'max' },
  left:   { edge: 'top',    pos: 0     },
};

const CCW_NEXT = {
  top:    { edge: 'left',   pos: 0     },
  right:  { edge: 'top',    pos: 'max' },
  bottom: { edge: 'right',  pos: 'max' },
  left:   { edge: 'bottom', pos: 0     },
};

/**
 * Move scissors around the perimeter based on horizontal swipe delta.
 * Swipe RIGHT → clockwise, swipe LEFT → counter-clockwise.
 * Corners are traversed automatically within the same frame.
 */
export function updateScissorsMovementTouch(scissors, rect, config, dx, dy) {
  if (Math.abs(dx) < DEAD_ZONE) return;

  const perimeterDelta = dx * config.touchSensitivity;
  const sign = CW_EDGE_SIGN[scissors.edge];
  const edgeLen = getEdgeLength(scissors, rect);

  scissors.pos += perimeterDelta * sign;

  if (scissors.pos > edgeLen) {
    const next = sign > 0 ? CW_NEXT[scissors.edge] : CCW_NEXT[scissors.edge];
    scissors.edge = next.edge;
    scissors.pos  = next.pos === 'max' ? getEdgeLength(scissors, rect) : 0;
  } else if (scissors.pos < 0) {
    const next = sign > 0 ? CCW_NEXT[scissors.edge] : CW_NEXT[scissors.edge];
    scissors.edge = next.edge;
    scissors.pos  = next.pos === 'max' ? getEdgeLength(scissors, rect) : 0;
  }

  // Corner snap
  const newEdgeLen = getEdgeLength(scissors, rect);
  const posDelta = perimeterDelta * sign;
  if (posDelta < 0 && scissors.pos < config.cornerSnapDistance) scissors.pos = 0;
  else if (posDelta > 0 && scissors.pos > newEdgeLen - config.cornerSnapDistance) scissors.pos = newEdgeLen;
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
