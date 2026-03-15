import { describe, it, expect } from 'vitest';
import { updateScissorsMovementTouch } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

// testPoly: 600x400 CW rectangle
// Edge 0: top edge    (0,0)→(600,0),   length = 600
// Edge 1: right edge  (600,0)→(600,400), length = 400
// Edge 2: bottom edge (600,400)→(0,400), length = 600
// Edge 3: left edge   (0,400)→(0,0),   length = 400

const config = { cornerSnapDistance: 5, touchSensitivity: 1.0 };

function makeScissors(edgeIndex, pos) {
  return {
    edgeIndex,
    pos,
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

describe('updateScissorsMovementTouch — basic movement', () => {
  it('1: positive dx — pos increases', () => {
    const scissors = makeScissors(0, 100);
    updateScissorsMovementTouch(scissors, testPoly, config, 50);
    expect(scissors.pos).toBe(150);
    expect(scissors.edgeIndex).toBe(0);
  });

  it('2: negative dx — pos decreases', () => {
    const scissors = makeScissors(0, 100);
    updateScissorsMovementTouch(scissors, testPoly, config, -30);
    expect(scissors.pos).toBe(70);
    expect(scissors.edgeIndex).toBe(0);
  });

  it('3: touchSensitivity scales movement', () => {
    const scissors = makeScissors(0, 100);
    const cfg = { cornerSnapDistance: 5, touchSensitivity: 2.0 };
    updateScissorsMovementTouch(scissors, testPoly, cfg, 10);
    expect(scissors.pos).toBe(120);
    expect(scissors.edgeIndex).toBe(0);
  });
});

describe('updateScissorsMovementTouch — dead zone', () => {
  it('4: |dx * sensitivity| < 0.01 — no movement', () => {
    const scissors = makeScissors(0, 100);
    updateScissorsMovementTouch(scissors, testPoly, config, 0.005);
    expect(scissors.pos).toBe(100);
    expect(scissors.edgeIndex).toBe(0);
  });

  it('5: dx=0 — no movement', () => {
    const scissors = makeScissors(0, 100);
    updateScissorsMovementTouch(scissors, testPoly, config, 0);
    expect(scissors.pos).toBe(100);
    expect(scissors.edgeIndex).toBe(0);
  });
});

describe('updateScissorsMovementTouch — edge wrapping', () => {
  it('6: positive dx wraps to next edge — pos set to 0 (not carry-over)', () => {
    // pos=590, dx=20 → pos=610 > 600: wrap to edge 1 with pos=0
    const scissors = makeScissors(0, 590);
    updateScissorsMovementTouch(scissors, testPoly, config, 20);
    expect(scissors.edgeIndex).toBe(1);
    expect(scissors.pos).toBe(0);
  });

  it('7: negative dx wraps to previous edge — pos set to prevEdge length', () => {
    // edgeIndex=1, pos=5, dx=-20 → pos=-15 < 0: wrap to edge 0 with pos=600
    const scissors = makeScissors(1, 5);
    updateScissorsMovementTouch(scissors, testPoly, config, -20);
    expect(scissors.edgeIndex).toBe(0);
    expect(scissors.pos).toBe(600);
  });

  it('10: wraps from edge 3 to edge 0 with positive dx', () => {
    // edgeIndex=3, pos=395, dx=10 → pos=405 > 400: wrap to edge 0 with pos=0
    const scissors = makeScissors(3, 395);
    updateScissorsMovementTouch(scissors, testPoly, config, 10);
    expect(scissors.edgeIndex).toBe(0);
    expect(scissors.pos).toBe(0);
  });
});

describe('updateScissorsMovementTouch — corner snapping', () => {
  it('8: snap to end corner, positive delta, pos near edge end', () => {
    // pos=596, dx=1 → pos=597 > 600-5=595: snap to 600
    const scissors = makeScissors(0, 596);
    updateScissorsMovementTouch(scissors, testPoly, config, 1);
    expect(scissors.edgeIndex).toBe(0);
    expect(scissors.pos).toBe(600);
  });

  it('9: snap to start corner, negative delta, pos near 0', () => {
    // pos=4, dx=-1 → pos=3 < 5: snap to 0
    const scissors = makeScissors(0, 4);
    updateScissorsMovementTouch(scissors, testPoly, config, -1);
    expect(scissors.edgeIndex).toBe(0);
    expect(scissors.pos).toBe(0);
  });
});
