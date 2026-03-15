import { describe, it, expect } from 'vitest';
import { testPoly } from '../fixtures.js';
import { triggerPhase2 } from '../../js/scissors.js';

// testPoly: 600x400 CW rectangle (0,0)-(600,0)-(600,400)-(0,400)
// Edge 0: top    (0,0)→(600,0),   edgeDirection='down', length=600
// Edge 1: right  (600,0)→(600,400), edgeDirection='left',  length=400
// Edge 2: bottom (600,400)→(0,400), edgeDirection='up',   length=600
// Edge 3: left   (0,400)→(0,0),    edgeDirection='right', length=400

function makeScissors(x, y, cutDirection) {
  return {
    edgeIndex: 0,
    pos: 0,
    cutting: true,
    cutPhase: 1,
    cutStart: { x: 300, y: 0 },
    cutCurrent: { x, y },
    cutTurn: null,
    cutTarget: null,
    cutDirection,
    cutTurnDirection: null,
  };
}

describe('triggerPhase2 — cutTurn and cutPhase', () => {
  it('1: sets cutTurn to current cutCurrent position', () => {
    const scissors = makeScissors(300, 100, 'down');
    const result = triggerPhase2(scissors, testPoly);
    expect(result.cutTurn).toEqual({ x: 300, y: 100 });
  });

  it('2: sets cutPhase to 2', () => {
    const scissors = makeScissors(300, 100, 'down');
    const result = triggerPhase2(scissors, testPoly);
    expect(result.cutPhase).toBe(2);
  });
});

describe('triggerPhase2 — direction and target selection (cutDirection=down)', () => {
  it('3: at x=100, y=100, cutDirection=down — picks left (dist=100 vs right dist=500)', () => {
    const scissors = makeScissors(100, 100, 'down');
    const result = triggerPhase2(scissors, testPoly);
    expect(result.cutTurnDirection).toBe('left');
    expect(result.cutTarget).toEqual({ x: 0, y: 100 });
  });

  it('4: at x=500, y=100, cutDirection=down — picks right (dist=100 vs left dist=500)', () => {
    const scissors = makeScissors(500, 100, 'down');
    const result = triggerPhase2(scissors, testPoly);
    expect(result.cutTurnDirection).toBe('right');
    expect(result.cutTarget).toEqual({ x: 600, y: 100 });
  });
});

describe('triggerPhase2 — direction and target selection (cutDirection=right)', () => {
  it('5: at x=200, y=100, cutDirection=right — picks up (dist=100 vs down dist=300)', () => {
    const scissors = makeScissors(200, 100, 'right');
    const result = triggerPhase2(scissors, testPoly);
    expect(result.cutTurnDirection).toBe('up');
    expect(result.cutTarget).toEqual({ x: 200, y: 0 });
  });

  it('6: at x=200, y=300, cutDirection=right — picks down (dist=100 vs up dist=300)', () => {
    const scissors = makeScissors(200, 300, 'right');
    const result = triggerPhase2(scissors, testPoly);
    expect(result.cutTurnDirection).toBe('down');
    expect(result.cutTarget).toEqual({ x: 200, y: 400 });
  });
});

describe('triggerPhase2 — cutTurnDirection is a valid perpendicular', () => {
  it('7: for cutDirection=down, result is left or right (not down)', () => {
    const scissors = makeScissors(300, 100, 'down');
    const result = triggerPhase2(scissors, testPoly);
    expect(['left', 'right']).toContain(result.cutTurnDirection);
    expect(result.cutTurnDirection).not.toBe('down');
    expect(result.cutTurnDirection).not.toBe('up');
  });
});

describe('triggerPhase2 — does not mutate input', () => {
  it('8: does not mutate input scissors', () => {
    const scissors = makeScissors(300, 100, 'down');
    const origCutPhase = scissors.cutPhase;
    const origCutTurn = scissors.cutTurn;
    const origCutTurnDirection = scissors.cutTurnDirection;
    triggerPhase2(scissors, testPoly);
    expect(scissors.cutPhase).toBe(origCutPhase);
    expect(scissors.cutTurn).toBe(origCutTurn);
    expect(scissors.cutTurnDirection).toBe(origCutTurnDirection);
  });
});
