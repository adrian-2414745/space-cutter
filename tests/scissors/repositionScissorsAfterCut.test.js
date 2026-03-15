import { describe, it, expect } from 'vitest';
import { repositionScissorsAfterCut } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

// testPoly = 600x400 CW rectangle
// Edge 0: top    (0,0)→(600,0),   length=600
// Edge 1: right  (600,0)→(600,400), length=400
// Edge 2: bottom (600,400)→(0,400), length=600
// Edge 3: left   (0,400)→(0,0),   length=400

function makeScissors(overrides = {}) {
  return {
    edgeIndex: 0, pos: 300,
    cutting: true, cutPhase: 2,
    cutStart: { x: 300, y: 0 }, cutCurrent: { x: 300, y: 200 },
    cutTurn: null, cutTarget: null, cutDirection: 'down', cutTurnDirection: null,
    ...overrides,
  };
}

describe('repositionScissorsAfterCut — targetPoint on edges', () => {
  it('1: targetPoint on top edge at x=100 — edgeIndex=0, pos=100', () => {
    const scissors = makeScissors();
    const result = repositionScissorsAfterCut(scissors, testPoly, { x: 100, y: 0 });
    expect(result.edgeIndex).toBe(0);
    expect(result.pos).toBeCloseTo(100, 5);
  });

  it('2: targetPoint on right edge at y=200 — edgeIndex=1, pos=200', () => {
    // Right edge: (600,0)→(600,400); dist from (600,0) to (600,200) = 200
    const scissors = makeScissors();
    const result = repositionScissorsAfterCut(scissors, testPoly, { x: 600, y: 200 });
    expect(result.edgeIndex).toBe(1);
    expect(result.pos).toBeCloseTo(200, 5);
  });

  it('3: targetPoint on bottom edge at x=500 — edgeIndex=2, pos=100', () => {
    // Bottom edge: (600,400)→(0,400); dist from (600,400) to (500,400) = 100
    const scissors = makeScissors();
    const result = repositionScissorsAfterCut(scissors, testPoly, { x: 500, y: 400 });
    expect(result.edgeIndex).toBe(2);
    expect(result.pos).toBeCloseTo(100, 5);
  });

  it('4: targetPoint interior (not on any edge) — falls back to edgeIndex=0, pos=300', () => {
    const scissors = makeScissors();
    const result = repositionScissorsAfterCut(scissors, testPoly, { x: 300, y: 200 });
    expect(result.edgeIndex).toBe(0);
    expect(result.pos).toBeCloseTo(300, 5);
  });
});

describe('repositionScissorsAfterCut — fallback via cutTurn', () => {
  it('5: no targetPoint, cutTurn on left edge at (0,100) — edgeIndex=3, pos=300', () => {
    // Left edge: (0,400)→(0,0); dist from (0,400) to (0,100) = 300
    const scissors = makeScissors({ cutTurn: { x: 0, y: 100 } });
    const result = repositionScissorsAfterCut(scissors, testPoly, null);
    expect(result.edgeIndex).toBe(3);
    expect(result.pos).toBeCloseTo(300, 5);
  });

  it('6: no targetPoint, no cutTurn — falls back to edgeIndex=0, pos=300', () => {
    const scissors = makeScissors({ cutTurn: null });
    const result = repositionScissorsAfterCut(scissors, testPoly, null);
    expect(result.edgeIndex).toBe(0);
    expect(result.pos).toBeCloseTo(300, 5);
  });
});

describe('repositionScissorsAfterCut — cut state reset', () => {
  it('7: cut state is fully reset after repositioning', () => {
    const scissors = makeScissors({
      cutting: true,
      cutPhase: 2,
      cutStart: { x: 300, y: 0 },
      cutCurrent: { x: 300, y: 200 },
      cutTurn: { x: 300, y: 200 },
      cutTarget: { x: 0, y: 200 },
      cutDirection: 'down',
      cutTurnDirection: 'left',
    });
    const result = repositionScissorsAfterCut(scissors, testPoly, { x: 100, y: 0 });
    expect(result.cutting).toBe(false);
    expect(result.cutPhase).toBe(0);
    expect(result.cutStart).toBeNull();
    expect(result.cutCurrent).toBeNull();
    expect(result.cutTurn).toBeNull();
    expect(result.cutTarget).toBeNull();
  });
});

describe('repositionScissorsAfterCut — does not mutate input', () => {
  it('8: does not mutate input scissors', () => {
    const scissors = makeScissors({
      cutting: true,
      cutPhase: 2,
      cutTurn: { x: 300, y: 200 },
    });
    const origCutting = scissors.cutting;
    const origCutPhase = scissors.cutPhase;
    const origEdgeIndex = scissors.edgeIndex;
    repositionScissorsAfterCut(scissors, testPoly, { x: 100, y: 0 });
    expect(scissors.cutting).toBe(origCutting);
    expect(scissors.cutPhase).toBe(origCutPhase);
    expect(scissors.edgeIndex).toBe(origEdgeIndex);
  });
});
