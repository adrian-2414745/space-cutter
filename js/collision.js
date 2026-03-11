export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const ex = px - x1;
    const ey = py - y1;
    return Math.sqrt(ex * ex + ey * ey);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const ex = px - closestX;
  const ey = py - closestY;
  return Math.sqrt(ex * ex + ey * ey);
}

export function ballIntersectsLCut(ball, scissors) {
  if (!scissors.cutting || !scissors.cutStart || !scissors.cutCurrent) return false;

  if (scissors.cutPhase === 1) {
    // Phase 1: single segment from cutStart to cutCurrent
    const dist = pointToSegmentDistance(
      ball.x, ball.y,
      scissors.cutStart.x, scissors.cutStart.y,
      scissors.cutCurrent.x, scissors.cutCurrent.y
    );
    return dist < ball.radius;
  }

  if (scissors.cutPhase === 2) {
    // Phase 2: two segments — cutStart→cutTurn and cutTurn→cutCurrent
    const dist1 = pointToSegmentDistance(
      ball.x, ball.y,
      scissors.cutStart.x, scissors.cutStart.y,
      scissors.cutTurn.x, scissors.cutTurn.y
    );
    if (dist1 < ball.radius) return true;

    const dist2 = pointToSegmentDistance(
      ball.x, ball.y,
      scissors.cutTurn.x, scissors.cutTurn.y,
      scissors.cutCurrent.x, scissors.cutCurrent.y
    );
    return dist2 < ball.radius;
  }

  return false;
}
