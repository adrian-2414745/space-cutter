import { describe, it, expect } from 'vitest';
import { checkCutComplete } from '../../js/scissors.js';

function makeScissors(cutPhase, cutCurrent, cutTarget) {
  return { cutPhase, cutCurrent, cutTarget };
}

describe('checkCutComplete', () => {
  it('1: phase 2, cutCurrent exactly at cutTarget — returns true', () => {
    const scissors = makeScissors(2, { x: 300, y: 400 }, { x: 300, y: 400 });
    expect(checkCutComplete(scissors)).toBe(true);
  });

  it('2: phase 2, cutCurrent within 0.5 of cutTarget — returns true', () => {
    const scissors = makeScissors(2, { x: 300.5, y: 400 }, { x: 300, y: 400 });
    // distance = 0.5, which is < 1
    expect(checkCutComplete(scissors)).toBe(true);
  });

  it('3: phase 2, cutCurrent exactly 1 unit away — returns false (strict < 1)', () => {
    const scissors = makeScissors(2, { x: 301, y: 400 }, { x: 300, y: 400 });
    // distance = 1.0 exactly, not < 1
    expect(checkCutComplete(scissors)).toBe(false);
  });

  it('4: phase 2, cutCurrent far from cutTarget — returns false', () => {
    const scissors = makeScissors(2, { x: 100, y: 400 }, { x: 300, y: 400 });
    // distance = 200
    expect(checkCutComplete(scissors)).toBe(false);
  });

  it('5: phase 1, positions coincide — returns false', () => {
    const scissors = makeScissors(1, { x: 300, y: 400 }, { x: 300, y: 400 });
    expect(checkCutComplete(scissors)).toBe(false);
  });

  it('6: phase 0 — returns false', () => {
    const scissors = makeScissors(0, { x: 300, y: 400 }, { x: 300, y: 400 });
    expect(checkCutComplete(scissors)).toBe(false);
  });
});
