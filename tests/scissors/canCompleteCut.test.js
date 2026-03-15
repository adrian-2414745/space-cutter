import { describe, it, expect } from 'vitest';
import { canCompleteCut } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

const config = { minCutDepth: 20 };

function makeScissors(overrides) {
  return {
    edgeIndex: 0, pos: 300,
    cutting: true,
    cutPhase: 1,
    cutStart: { x: 300, y: 0 },
    cutCurrent: { x: 300, y: 25 },
    cutTurn: null, cutTarget: null, cutDirection: 'down', cutTurnDirection: null,
    ...overrides,
  };
}

describe('canCompleteCut', () => {
  it('1: phase 1, depth > minCutDepth — returns true', () => {
    const scissors = makeScissors(); // cutCurrent y=25, depth=25 > 20
    expect(canCompleteCut(scissors, testPoly, config)).toBe(true);
  });

  it('2: phase 1, depth exactly equals minCutDepth — returns true', () => {
    const scissors = makeScissors({ cutCurrent: { x: 300, y: 20 } }); // depth=20
    expect(canCompleteCut(scissors, testPoly, config)).toBe(true);
  });

  it('3: phase 1, depth < minCutDepth — returns false', () => {
    const scissors = makeScissors({ cutCurrent: { x: 300, y: 10 } }); // depth=10 < 20
    expect(canCompleteCut(scissors, testPoly, config)).toBe(false);
  });

  it('4: phase 2, depth >= minCutDepth — returns false (wrong phase)', () => {
    const scissors = makeScissors({ cutPhase: 2 }); // depth=25 but phase is 2
    expect(canCompleteCut(scissors, testPoly, config)).toBe(false);
  });

  it('5: phase 0 — returns false', () => {
    const scissors = makeScissors({ cutPhase: 0 });
    expect(canCompleteCut(scissors, testPoly, config)).toBe(false);
  });

  it('6: cutStart null, phase 1 — returns false (depth=0)', () => {
    const scissors = makeScissors({ cutStart: null }); // getCutDepth returns 0
    expect(canCompleteCut(scissors, testPoly, config)).toBe(false);
  });
});
