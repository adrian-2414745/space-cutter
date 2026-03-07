import { isKeyDown } from './input.js';

export function createScissors(rect) {
  return {
    edge: 'top',
    pos: rect.width / 2,
    cutting: false,
    cutStart: null,
    cutCurrent: null
  };
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
    { key: 'ArrowLeft',  edge: 'left',  pos: 0 },
    { key: 'ArrowUp',    edge: 'top',   posStart: true },
  ],
  'top-right': [
    { key: 'ArrowRight', edge: 'right', pos: 0 },
    { key: 'ArrowUp',    edge: 'top',   posEnd: true },
  ],
  'bottom-left': [
    { key: 'ArrowLeft',  edge: 'left',  posEnd: true },
    { key: 'ArrowDown',  edge: 'bottom', posStart: true },
  ],
  'bottom-right': [
    { key: 'ArrowRight', edge: 'right', posEnd: true },
    { key: 'ArrowDown',  edge: 'bottom', posEnd: true },
  ],
};

function tryCornerTransition(scissors, rect) {
  const corner = getCorner(scissors, rect);
  console.log("corner: " + corner)
  if (!corner) return false;

  const transitions = CORNER_TRANSITIONS[corner];
  console.log("transitions: " + transitions)
  for (const t of transitions) {
    if (isKeyDown(t.key) && t.edge !== scissors.edge) {
      scissors.edge = t.edge;
      const edgeLen = getEdgeLength(scissors, rect);
      if (t.pos !== undefined) {
        scissors.pos = t.pos;
      } else if (t.posStart) {
        scissors.pos = 0;
      } else if (t.posEnd) {
        scissors.pos = edgeLen;
      }
      return true;
    }
  }
  return false;
}

export function updateScissorsMovement(scissors, rect, dt, config) {
  const speed = config.scissorsBorderSpeed * dt;
  const edgeLen = getEdgeLength(scissors, rect);

  // At a corner, check for edge transition first
  if ((scissors.pos === 0 || scissors.pos === edgeLen)) {
    if (tryCornerTransition(scissors, rect)) return;
  }

  // Movement along current edge
  let delta = 0;
  if (scissors.edge === 'top' || scissors.edge === 'bottom') {
    if (isKeyDown('ArrowLeft'))  delta -= speed;
    if (isKeyDown('ArrowRight')) delta += speed;
  } else {
    if (isKeyDown('ArrowUp'))   delta -= speed;
    if (isKeyDown('ArrowDown')) delta += speed;
  }

  if (delta === 0) return;

  scissors.pos = Math.max(0, Math.min(edgeLen, scissors.pos + delta));

  // Corner snapping
  if (scissors.pos < config.cornerSnapDistance) {
    scissors.pos = 0;
  } else if (scissors.pos > edgeLen - config.cornerSnapDistance) {
    scissors.pos = edgeLen;
  }
}
