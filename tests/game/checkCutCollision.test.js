import { describe, it, expect } from 'vitest';
import { checkCutCollision } from '../../js/game.js';

function makeBall(x, y, radius = 10) {
  return { x, y, vx: 100, vy: 100, radius };
}

function makeScissors(overrides = {}) {
  return {
    cutting: true, cutPhase: 2,
    cutStart: { x: 100, y: 0 }, cutTurn: { x: 100, y: 100 }, cutTarget: { x: 0, y: 100 },
    cutCurrent: { x: 0, y: 100 }, cutDirection: 'down',
    ...overrides,
  };
}

describe('checkCutCollision', () => {
  it('1: returns false for empty balls array', () => {
    expect(checkCutCollision([], makeScissors())).toBe(false);
  });

  it('2: returns false when no ball is near the cut line', () => {
    // Ball at (300,300) is far from both segments (100,0)→(100,100) and (100,100)→(0,100)
    const balls = [makeBall(300, 300)];
    expect(checkCutCollision(balls, makeScissors())).toBe(false);
  });

  it('3: returns true when one ball intersects the cut line (phase 2)', () => {
    // Ball center (100,5) is ON segment (100,0)→(100,100), distance=0 < radius=10
    const scissors = makeScissors();
    const balls = [makeBall(100, 5)];
    expect(checkCutCollision(balls, scissors)).toBe(true);
  });

  it('4: returns true when the first ball of several intersects (short-circuit)', () => {
    const balls = [makeBall(100, 5), makeBall(400, 300), makeBall(500, 200)];
    expect(checkCutCollision(balls, makeScissors())).toBe(true);
  });

  it('5: returns true when only the last ball of several intersects', () => {
    const balls = [makeBall(400, 300), makeBall(500, 200), makeBall(100, 5)];
    expect(checkCutCollision(balls, makeScissors())).toBe(true);
  });

  it('6: returns false when scissors.cutting is false, even if a ball is on the line', () => {
    const scissors = makeScissors({ cutting: false });
    const balls = [makeBall(100, 5)];
    expect(checkCutCollision(balls, scissors)).toBe(false);
  });

  it('7: returns false when all balls are outside radius of cut', () => {
    const balls = [makeBall(300, 300), makeBall(400, 350), makeBall(500, 250)];
    expect(checkCutCollision(balls, makeScissors())).toBe(false);
  });

  it('8: handles phase-1 scissors (single segment) — ball within radius → true', () => {
    // Segment (0,0)→(300,0); ball at (150,5), distance=5 < radius=10
    const scissors = makeScissors({
      cutPhase: 1,
      cutStart: { x: 0, y: 0 },
      cutTurn: null,
      cutCurrent: { x: 300, y: 0 },
      cutTarget: null,
    });
    const balls = [makeBall(150, 5)];
    expect(checkCutCollision(balls, scissors)).toBe(true);
  });

  it('9: returns false for phase-1 scissors when ball is far from the single segment', () => {
    // Segment (0,0)→(300,0); ball at (150,50), distance=50 > radius=10
    const scissors = makeScissors({
      cutPhase: 1,
      cutStart: { x: 0, y: 0 },
      cutTurn: null,
      cutCurrent: { x: 300, y: 0 },
      cutTarget: null,
    });
    const balls = [makeBall(150, 50)];
    expect(checkCutCollision(balls, scissors)).toBe(false);
  });
});
