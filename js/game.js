import { polygonArea, nibblePolygon, splitPolygon, raycastToEdge } from './polygon.js';
import { createBall, isBallInPolygon } from './ball.js';
import { ballIntersectsLCut } from './collision.js';

/**
 * Given a polygon and current ball list, filter out balls that left the polygon
 * and spawn/remove balls to match the density target. Returns a new balls array.
 */
export function reconcileBalls(poly, balls, config, originalArea) {
  const area = polygonArea(poly);
  let newBalls = balls.filter(b => isBallInPolygon(b, poly));
  const areaPercent = originalArea > 0 ? (area / originalArea) * 100 : 100;
  const progressFactor = 1 + config.densityRampK * (1 - areaPercent / 100);
  const effectiveDensity = config.ballDensityPx2 / progressFactor;
  const target = Math.max(config.minBalls, Math.floor(area / effectiveDensity));
  const delta = target - newBalls.length;
  if (delta > 0) {
    for (let i = 0; i < delta; i++) {
      newBalls.push(createBall(poly, config));
    }
  } else if (delta < 0) {
    const arr = [...newBalls];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    arr.length = target;
    newBalls = arr;
  }
  return newBalls;
}

/**
 * Compute the result of an L-cut completing. Returns { newPoly, score, won }.
 * Does not mutate any state.
 */
export function applyCompletedCut(poly, scissors, originalArea, config) {
  const newPoly = nibblePolygon(poly, scissors.cutStart, scissors.cutTurn, scissors.cutTarget);
  const score = Math.round(polygonArea(newPoly) / originalArea * 10000) / 100;
  return { newPoly, score, won: score < config.winThreshold };
}

/**
 * Compute the result of a straight-through cut completing. Returns { newPoly, score, won, exitPoint }.
 * Does not mutate any state.
 */
export function applyStraightCut(poly, scissors, originalArea, config) {
  const hit = raycastToEdge(
    scissors.cutStart.x, scissors.cutStart.y,
    scissors.cutDirection, poly
  );
  const exitPoint = hit ? hit.point : { x: scissors.cutCurrent.x, y: scissors.cutCurrent.y };
  const newPoly = splitPolygon(poly, scissors.cutStart, exitPoint);
  const score = Math.round(polygonArea(newPoly) / originalArea * 10000) / 100;
  return { newPoly, score, won: score < config.winThreshold, exitPoint };
}

/**
 * Returns true if any ball intersects the current cut line. Pure — no mutations.
 */
export function checkCutCollision(balls, scissors) {
  for (const ball of balls) {
    if (ballIntersectsLCut(ball, scissors)) return true;
  }
  return false;
}
