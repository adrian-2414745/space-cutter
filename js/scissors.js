import { edgeLength, edgeDirection, pointOnEdge, raycastToEdge, findEdgeAtPoint } from './polygon.js';

// ---------------------------------------------------------------------------
// Direction helpers
// ---------------------------------------------------------------------------

const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
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
  const cutDirection = edgeDirection(poly, scissors.edgeIndex);
  const screenPos = getScissorsScreenPosition(scissors, poly);
  return {
    ...scissors,
    cutting: true,
    cutPhase: 1,
    cutDirection,
    cutStart: { x: screenPos.x, y: screenPos.y },
    cutCurrent: { x: screenPos.x, y: screenPos.y },
    cutTurn: null,
    cutTarget: null,
    cutTurnDirection: null,
  };
}

// ---------------------------------------------------------------------------
// 4. updateScissorsCut
// ---------------------------------------------------------------------------

export function updateScissorsCut(scissors, poly, dt, config) {
  const speed = config.scissorsCutSpeed * dt;

  if (scissors.cutPhase === 1) {
    const v = DIR_VECTORS[scissors.cutDirection];
    return {
      ...scissors,
      cutCurrent: {
        x: scissors.cutCurrent.x + v.x * speed,
        y: scissors.cutCurrent.y + v.y * speed,
      },
    };
  } else if (scissors.cutPhase === 2) {
    const v = DIR_VECTORS[scissors.cutTurnDirection];
    const target = scissors.cutTarget;
    const dx = target.x - scissors.cutCurrent.x;
    const dy = target.y - scissors.cutCurrent.y;
    const remaining = Math.hypot(dx, dy);

    if (remaining <= speed) {
      return {
        ...scissors,
        cutCurrent: { x: target.x, y: target.y },
      };
    } else {
      return {
        ...scissors,
        cutCurrent: {
          x: scissors.cutCurrent.x + v.x * speed,
          y: scissors.cutCurrent.y + v.y * speed,
        },
      };
    }
  }

  return scissors;
}

// ---------------------------------------------------------------------------
// 5. triggerPhase2
// ---------------------------------------------------------------------------

export function triggerPhase2(scissors, poly) {
  const cutTurn = { x: scissors.cutCurrent.x, y: scissors.cutCurrent.y };

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

  if (!bestDir) return scissors; // shouldn't happen in well-formed polygon

  return {
    ...scissors,
    cutTurn,
    cutTurnDirection: bestDir,
    cutTarget: bestPoint,
    cutPhase: 2,
  };
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
  return {
    ...scissors,
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
  let newEdgeIndex, newPos;

  if (pt) {
    const edgeIdx = findEdgeAtPoint(poly, pt.x, pt.y);
    if (edgeIdx !== -1) {
      newEdgeIndex = edgeIdx;
      const verts = poly.vertices;
      const a = verts[edgeIdx];
      newPos = Math.hypot(pt.x - a.x, pt.y - a.y);
    } else {
      newEdgeIndex = 0;
      newPos = edgeLength(poly, 0) / 2;
    }
  } else {
    newEdgeIndex = 0;
    newPos = edgeLength(poly, 0) / 2;
  }

  // Reset cut state via cancelCut, then apply new position
  const cancelled = cancelCut(scissors);
  return {
    ...cancelled,
    edgeIndex: newEdgeIndex,
    pos: newPos,
  };
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

export function updateScissorsMovement(scissors, poly, dt, config, input) {
  const speed = config.scissorsBorderSpeed * dt;
  const len = edgeLength(poly, scissors.edgeIndex);
  const n = poly.vertices.length;

  // Right = CW (increasing pos), Left = CCW (decreasing pos)
  // input = { left: bool, right: bool }
  let delta = 0;
  if (input.right) delta += speed;
  if (input.left) delta -= speed;

  if (delta === 0) return scissors;

  let newPos = scissors.pos + delta;
  let newEdgeIndex = scissors.edgeIndex;

  // Corner wrapping
  if (newPos < 0) {
    const prevIndex = (newEdgeIndex - 1 + n) % n;
    newEdgeIndex = prevIndex;
    newPos = edgeLength(poly, prevIndex) + newPos; // newPos is negative, so this subtracts
    // Clamp in case overflow was large
    newPos = Math.max(0, newPos);
    return { ...scissors, edgeIndex: newEdgeIndex, pos: newPos };
  }

  if (newPos > len) {
    const overflow = newPos - len;
    const nextIndex = (newEdgeIndex + 1) % n;
    newEdgeIndex = nextIndex;
    newPos = overflow;
    // Clamp in case overflow was large
    newPos = Math.min(newPos, edgeLength(poly, nextIndex));
    return { ...scissors, edgeIndex: newEdgeIndex, pos: newPos };
  }

  // Corner snapping: snap when within cornerSnapDistance and moving toward corner
  if (delta < 0 && newPos < config.cornerSnapDistance) {
    newPos = 0;
  } else if (delta > 0 && newPos > len - config.cornerSnapDistance) {
    newPos = len;
  }

  return { ...scissors, edgeIndex: newEdgeIndex, pos: newPos };
}

// ---------------------------------------------------------------------------
// 14. updateScissorsMovementTouch
// ---------------------------------------------------------------------------

export function updateScissorsMovementTouch(scissors, poly, config, dx) {
  const n = poly.vertices.length;
  const len = edgeLength(poly, scissors.edgeIndex);

  // Swipe right = CW (positive dx), swipe left = CCW (negative dx)
  const perimeterDelta = dx * config.touchSensitivity;

  if (Math.abs(perimeterDelta) < 0.01) return scissors;

  let newPos = scissors.pos + perimeterDelta;
  let newEdgeIndex = scissors.edgeIndex;

  // Corner wrapping
  if (newPos > len) {
    const nextIndex = (newEdgeIndex + 1) % n;
    newEdgeIndex = nextIndex;
    newPos = 0;
  } else if (newPos < 0) {
    const prevIndex = (newEdgeIndex - 1 + n) % n;
    newEdgeIndex = prevIndex;
    newPos = edgeLength(poly, prevIndex);
  }

  // Corner snapping
  const newLen = edgeLength(poly, newEdgeIndex);
  if (perimeterDelta < 0 && newPos < config.cornerSnapDistance) {
    newPos = 0;
  } else if (perimeterDelta > 0 && newPos > newLen - config.cornerSnapDistance) {
    newPos = newLen;
  }

  return { ...scissors, edgeIndex: newEdgeIndex, pos: newPos };
}
