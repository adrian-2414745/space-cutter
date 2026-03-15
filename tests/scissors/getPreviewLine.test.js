import { describe, it, expect } from 'vitest';
import { createScissors, initiateCut, getPreviewLine } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

// testPoly: 600x400 rectangle
// Edge 0: top (0,0)→(600,0), edgeDirection='down', length=600
// createScissors(testPoly) places scissors at edge 0, pos=300 → screen pos {x:300, y:0}

describe('getPreviewLine — not cutting', () => {
  it('1: not cutting (scissors.cutting=false) — returns null', () => {
    const scissors = createScissors(testPoly);
    // cutting is false by default
    expect(scissors.cutting).toBe(false);
    const result = getPreviewLine(scissors, testPoly);
    expect(result).toBeNull();
  });

  it('2: phase 0 while cutting=true — returns null', () => {
    const scissors = { ...createScissors(testPoly), cutting: true, cutPhase: 0 };
    const result = getPreviewLine(scissors, testPoly);
    expect(result).toBeNull();
  });
});

describe('getPreviewLine — phase 1', () => {
  it('3: phase 1 — returns an array of 4 points', () => {
    const scissors = initiateCut(createScissors(testPoly), testPoly);
    const result = getPreviewLine(scissors, testPoly);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4);
  });

  it('4: phase 1 — first point is cutStart', () => {
    const scissors = initiateCut(createScissors(testPoly), testPoly);
    const result = getPreviewLine(scissors, testPoly);
    expect(result[0].x).toBeCloseTo(scissors.cutStart.x, 5);
    expect(result[0].y).toBeCloseTo(scissors.cutStart.y, 5);
  });

  it('5: phase 1 — second point is cutCurrent', () => {
    const scissors = initiateCut(createScissors(testPoly), testPoly);
    const result = getPreviewLine(scissors, testPoly);
    expect(result[1].x).toBeCloseTo(scissors.cutCurrent.x, 5);
    expect(result[1].y).toBeCloseTo(scissors.cutCurrent.y, 5);
  });

  it('6: phase 1 — at edge 0 midpoint (x=300), cutting down: projected turn hits bottom wall at y=400', () => {
    // createScissors sets pos=300, screen pos={x:300,y:0}
    // cutCurrent={x:300,y:0}, raycast down → hits bottom edge y=400 → projectedTurn={x:300,y:400}
    const scissors = initiateCut(createScissors(testPoly), testPoly);
    // cutStart and cutCurrent should both be {x:300, y:0} (no movement yet)
    expect(scissors.cutStart.x).toBeCloseTo(300, 5);
    expect(scissors.cutStart.y).toBeCloseTo(0, 5);
    const result = getPreviewLine(scissors, testPoly);
    // Third point is projectedTurn: bottom wall hit from (300,0) going down
    expect(result[2].x).toBeCloseTo(300, 5);
    expect(result[2].y).toBeCloseTo(400, 5);
  });

  it('7: phase 1 — at x=100, cutting down: projected target goes to left wall (fourth point x=0)', () => {
    // Manually set up scissors at edge 0, pos=100
    const base = { ...createScissors(testPoly), pos: 100 };
    const scissors = initiateCut(base, testPoly);
    // cutStart=cutCurrent={x:100, y:0}
    expect(scissors.cutStart.x).toBeCloseTo(100, 5);
    expect(scissors.cutStart.y).toBeCloseTo(0, 5);
    // projectedTurn: raycast down from (100,0) → hits bottom at y=400 → {x:100, y:400}
    // From (100,400): perps=['left','right'], left dist=100, right dist=500 → picks left → {x:0, y:400}
    const result = getPreviewLine(scissors, testPoly);
    expect(result[3].x).toBeCloseTo(0, 5);
  });
});

describe('getPreviewLine — phase 2', () => {
  it('8: phase 2 — returns an array of 3 points', () => {
    const scissors = {
      ...createScissors(testPoly),
      cutting: true,
      cutPhase: 2,
      cutStart: { x: 300, y: 0 },
      cutTurn: { x: 300, y: 200 },
      cutCurrent: { x: 0, y: 200 },
    };
    const result = getPreviewLine(scissors, testPoly);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('9: phase 2 — points are [cutStart, cutTurn, cutCurrent]', () => {
    const scissors = {
      ...createScissors(testPoly),
      cutting: true,
      cutPhase: 2,
      cutStart: { x: 300, y: 0 },
      cutTurn: { x: 300, y: 200 },
      cutCurrent: { x: 0, y: 200 },
    };
    const result = getPreviewLine(scissors, testPoly);
    // First point === cutStart
    expect(result[0].x).toBeCloseTo(scissors.cutStart.x, 5);
    expect(result[0].y).toBeCloseTo(scissors.cutStart.y, 5);
    // Second point === cutTurn
    expect(result[1].x).toBeCloseTo(scissors.cutTurn.x, 5);
    expect(result[1].y).toBeCloseTo(scissors.cutTurn.y, 5);
    // Third point === cutCurrent
    expect(result[2].x).toBeCloseTo(scissors.cutCurrent.x, 5);
    expect(result[2].y).toBeCloseTo(scissors.cutCurrent.y, 5);
  });
});
