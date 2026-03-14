import { isKeyDown } from './input.js';
import { edgeLength, edgeDirection, pointOnEdge, raycastToEdge, getEdges, findEdgeAtPoint } from './polygon.js';

// ---------------------------------------------------------------------------
// Helper: determine movement axis and sign for a polygon edge
// ---------------------------------------------------------------------------

function edgeMovementAxis(poly, edgeIndex) {
  const verts = poly.vertices;
  const a = verts[edgeIndex];
  const b = verts[(edgeIndex + 1) % verts.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { axis: 'x', sign: dx > 0 ? 1 : -1 };
  } else {
    return { axis: 'y', sign: dy > 0 ? 1 : -1 };
  }
}

// ---------------------------------------------------------------------------
// Direction helpers
// ---------------------------------------------------------------------------

const DIR_VECTORS = {
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 },
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
};

function perpendiculars(dir) {
  if (dir === 'up' || dir === 'down') return ['left', 'right'];
  return ['up', 'down'];
}

// ---------------------------------------------------------------------------
// 1. createScissors
// ---------------------------------------------------------------------------

export function createScissors(poly) {
  return {
    edgeIndex: 0,
    pos: edgeLength(poly, 0) / 2,
    cutting: false,
    cutPhase: 0,
    cutStart: null,
    cutCurrent: null,
    cutTurn: null,
    cutTarget: null,
    cutDirection: null,
    cutTurnDirection: null,
  };
}

// ---------------------------------------------------------------------------
// 2. isAtCorner
// ---------------------------------------------------------------------------

export function isAtCorner(scissors, poly) {
  const len = edgeLength(poly, scissors.edgeIndex);
  return scissors.pos <= 0 || scissors.pos >= len;
}

// ---------------------------------------------------------------------------
// 3. initiateCut
// ---------------------------------------------------------------------------

export function initiateCut(scissors, poly) {
  scissors.cutting = true;
  scissors.cutPhase = 1;
  scissors.cutDirection = edgeDirection(poly, scissors.edgeIndex);
  const screenPos = getScissorsScreenPosition(scissors, poly);
  scissors.cutStart = { x: screenPos.x, y: screenPos.y };
  scissors.cutCurrent = { x: screenPos.x, y: screenPos.y };
  scissors.cutTurn = null;
  scissors.cutTarget = null;
  scissors.cutTurnDirection = null;
}

// ---------------------------------------------------------------------------
// 4. updateScissorsCut
// ---------------------------------------------------------------------------

export function updateScissorsCut(scissors, poly, dt, config) {
  const speed = config.scissorsCutSpeed * dt;

  if (scissors.cutPhase === 1) {
    const v = DIR_VECTORS[scissors.cutDirection];
    scissors.cutCurrent.x += v.x * speed;
    scissors.cutCurrent.y += v.y * speed;
  } else if (scissors.cutPhase === 2) {
    const v = DIR_VECTORS[scissors.cutTurnDirection];
    const target = scissors.cutTarget;
    const dx = target.x - scissors.cutCurrent.x;
    const dy = target.y - scissors.cutCurrent.y;
    const remaining = Math.hypot(dx, dy);

    if (remaining <= speed) {
      // Clamp to target
      scissors.cutCurrent.x = target.x;
      scissors.cutCurrent.y = target.y;
    } else {
      scissors.cutCurrent.x += v.x * speed;
      scissors.cutCurrent.y += v.y * speed;
    }
  }
}

// ---------------------------------------------------------------------------
// 5. triggerPhase2 (NEW)
// ---------------------------------------------------------------------------

export function triggerPhase2(scissors, poly) {
  scissors.cutTurn = { x: scissors.cutCurrent.x, y: scissors.cutCurrent.y };

  const perps = perpendiculars(scissors.cutDirection);
  let bestDir = null;
  let bestDist = Infinity;
  let bestPoint = null;

  for (const dir of perps) {
    const hit = raycastToEdge(scissors.cutCurrent.x, scissors.cutCurrent.y, dir, poly);
    if (hit && hit.distance < bestDist) {
      bestDist = hit.distance;
      bestDir = dir;
      bestPoint = hit.point;
    }
  }

  if (!bestDir) return; // shouldn't happen in well-formed polygon

  scissors.cutTurnDirection = bestDir;
  scissors.cutTarget = bestPoint;
  scissors.cutPhase = 2;
}

// ---------------------------------------------------------------------------
// 6. checkCutComplete
// ---------------------------------------------------------------------------

export function checkCutComplete(scissors) {
  if (scissors.cutPhase !== 2) return false;
  const dx = scissors.cutCurrent.x - scissors.cutTarget.x;
  const dy = scissors.cutCurrent.y - scissors.cutTarget.y;
  return Math.hypot(dx, dy) < 1;
}

// ---------------------------------------------------------------------------
// 7. cancelCut
// ---------------------------------------------------------------------------

export function cancelCut(scissors) {
  scissors.cutting = false;
  scissors.cutPhase = 0;
  scissors.cutStart = null;
  scissors.cutCurrent = null;
  scissors.cutTurn = null;
  scissors.cutTarget = null;
  scissors.cutDirection = null;
  scissors.cutTurnDirection = null;
}

// ---------------------------------------------------------------------------
// 8. getCutDepth
// ---------------------------------------------------------------------------

export function getCutDepth(scissors, poly) {
  if (!scissors.cutStart || !scissors.cutCurrent) return 0;
  return Math.hypot(
    scissors.cutCurrent.x - scissors.cutStart.x,
    scissors.cutCurrent.y - scissors.cutStart.y
  );
}

// ---------------------------------------------------------------------------
// 9. canCompleteCut
// ---------------------------------------------------------------------------

export function canCompleteCut(scissors, poly, config) {
  return scissors.cutPhase === 1 && getCutDepth(scissors, poly) >= config.minCutDepth;
}

// ---------------------------------------------------------------------------
// 10. getPreviewLine
// ---------------------------------------------------------------------------

export function getPreviewLine(scissors, poly) {
  if (!scissors.cutting) return null;

  if (scissors.cutPhase === 1) {
    // Predict the L-path:
    // 1) From cutCurrent, raycast in cutDirection to find opposite boundary
    const projectedHit = raycastToEdge(
      scissors.cutCurrent.x, scissors.cutCurrent.y,
      scissors.cutDirection, poly
    );
    const projectedTurn = projectedHit
      ? projectedHit.point
      : { x: scissors.cutCurrent.x, y: scissors.cutCurrent.y };

    // 2) From that projected turn, raycast both perpendiculars, pick closer
    const perps = perpendiculars(scissors.cutDirection);
    let bestPoint = null;
    let bestDist = Infinity;

    for (const dir of perps) {
      const hit = raycastToEdge(projectedTurn.x, projectedTurn.y, dir, poly);
      if (hit && hit.distance < bestDist) {
        bestDist = hit.distance;
        bestPoint = hit.point;
      }
    }

    const projectedTarget = bestPoint || { x: projectedTurn.x, y: projectedTurn.y };

    return [
      { x: scissors.cutStart.x, y: scissors.cutStart.y },
      { x: scissors.cutCurrent.x, y: scissors.cutCurrent.y },
      { x: projectedTurn.x, y: projectedTurn.y },
      { x: projectedTarget.x, y: projectedTarget.y },
    ];
  }

  if (scissors.cutPhase === 2) {
    return [
      { x: scissors.cutStart.x, y: scissors.cutStart.y },
      { x: scissors.cutTurn.x, y: scissors.cutTurn.y },
      { x: scissors.cutCurrent.x, y: scissors.cutCurrent.y },
    ];
  }

  return null;
}

// ---------------------------------------------------------------------------
// 11. repositionScissorsAfterCut
// ---------------------------------------------------------------------------

export function repositionScissorsAfterCut(scissors, poly, targetPoint) {
  // Use provided targetPoint, or fall back to cutTurn (L-cut default)
  const pt = targetPoint || scissors.cutTurn;
  if (pt) {
    const edgeIdx = findEdgeAtPoint(poly, pt.x, pt.y);
    if (edgeIdx !== -1) {
      scissors.edgeIndex = edgeIdx;
      const verts = poly.vertices;
      const a = verts[edgeIdx];
      scissors.pos = Math.hypot(pt.x - a.x, pt.y - a.y);
    } else {
      scissors.edgeIndex = 0;
      scissors.pos = edgeLength(poly, 0) / 2;
    }
  } else {
    scissors.edgeIndex = 0;
    scissors.pos = edgeLength(poly, 0) / 2;
  }

  // Reset cut state
  cancelCut(scissors);
}

// ---------------------------------------------------------------------------
// 12. getScissorsScreenPosition
// ---------------------------------------------------------------------------

export function getScissorsScreenPosition(scissors, poly) {
  return pointOnEdge(poly, scissors.edgeIndex, scissors.pos);
}

// ---------------------------------------------------------------------------
// 13. updateScissorsMovement (keyboard)
// ---------------------------------------------------------------------------

export function updateScissorsMovement(scissors, poly, dt, config) {
  const speed = config.scissorsBorderSpeed * dt;
  const len = edgeLength(poly, scissors.edgeIndex);
  const n = poly.vertices.length;
  const { axis, sign } = edgeMovementAxis(poly, scissors.edgeIndex);

  // Determine delta from arrow keys
  let delta = 0;
  if (axis === 'x') {
    // Horizontal edge: ArrowRight = positive x, ArrowLeft = negative x
    if (isKeyDown('ArrowRight')) delta += sign * speed;
    if (isKeyDown('ArrowLeft'))  delta -= sign * speed;
  } else {
    // Vertical edge: ArrowDown = positive y, ArrowUp = negative y
    if (isKeyDown('ArrowDown')) delta += sign * speed;
    if (isKeyDown('ArrowUp'))   delta -= sign * speed;
  }

  if (delta === 0) return;

  scissors.pos += delta;

  // Corner wrapping
  if (scissors.pos < 0) {
    const prevIndex = (scissors.edgeIndex - 1 + n) % n;
    scissors.edgeIndex = prevIndex;
    scissors.pos = edgeLength(poly, prevIndex) + scissors.pos; // pos is negative, so this subtracts
    // Clamp in case overflow was large
    scissors.pos = Math.max(0, scissors.pos);
    return;
  }

  if (scissors.pos > len) {
    const overflow = scissors.pos - len;
    const nextIndex = (scissors.edgeIndex + 1) % n;
    scissors.edgeIndex = nextIndex;
    scissors.pos = overflow;
    // Clamp in case overflow was large
    scissors.pos = Math.min(scissors.pos, edgeLength(poly, nextIndex));
    return;
  }

  // Corner snapping: snap when within cornerSnapDistance and moving toward corner
  if (delta < 0 && scissors.pos < config.cornerSnapDistance) {
    scissors.pos = 0;
  } else if (delta > 0 && scissors.pos > len - config.cornerSnapDistance) {
    scissors.pos = len;
  }
}

// ---------------------------------------------------------------------------
// 14. updateScissorsMovementTouch
// ---------------------------------------------------------------------------

export function updateScissorsMovementTouch(scissors, poly, config, dx, dy) {
  const n = poly.vertices.length;
  const { axis, sign } = edgeMovementAxis(poly, scissors.edgeIndex);
  const len = edgeLength(poly, scissors.edgeIndex);

  // Map swipe component along edge axis, applying edge direction sign
  const raw = axis === 'x' ? dx : dy;
  const perimeterDelta = raw * sign * config.touchSensitivity;

  if (Math.abs(perimeterDelta) < 0.01) return;

  scissors.pos += perimeterDelta;

  // Corner wrapping
  if (scissors.pos > len) {
    const nextIndex = (scissors.edgeIndex + 1) % n;
    scissors.edgeIndex = nextIndex;
    scissors.pos = 0;
  } else if (scissors.pos < 0) {
    const prevIndex = (scissors.edgeIndex - 1 + n) % n;
    scissors.edgeIndex = prevIndex;
    scissors.pos = edgeLength(poly, prevIndex);
  }

  // Corner snapping
  const newLen = edgeLength(poly, scissors.edgeIndex);
  if (perimeterDelta < 0 && scissors.pos < config.cornerSnapDistance) {
    scissors.pos = 0;
  } else if (perimeterDelta > 0 && scissors.pos > newLen - config.cornerSnapDistance) {
    scissors.pos = newLen;
  }
}
