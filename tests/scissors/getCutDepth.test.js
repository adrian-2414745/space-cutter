import { describe, it, expect } from 'vitest';
import { testPoly } from '../fixtures.js';
import { getCutDepth } from '../../js/scissors.js';

describe('getCutDepth', () => {
  it('1: cutStart is null — returns 0', () => {
    const scissors = { cutStart: null, cutCurrent: { x: 300, y: 50 } };
    expect(getCutDepth(scissors, testPoly)).toBe(0);
  });

  it('2: cutCurrent is null — returns 0', () => {
    const scissors = { cutStart: { x: 300, y: 0 }, cutCurrent: null };
    expect(getCutDepth(scissors, testPoly)).toBe(0);
  });

  it('3: both null — returns 0', () => {
    const scissors = { cutStart: null, cutCurrent: null };
    expect(getCutDepth(scissors, testPoly)).toBe(0);
  });

  it('4: same position — returns 0', () => {
    const scissors = { cutStart: { x: 150, y: 75 }, cutCurrent: { x: 150, y: 75 } };
    expect(getCutDepth(scissors, testPoly)).toBe(0);
  });

  it('5: straight vertical movement — returns 50', () => {
    const scissors = { cutStart: { x: 300, y: 0 }, cutCurrent: { x: 300, y: 50 } };
    expect(getCutDepth(scissors, testPoly)).toBe(50);
  });

  it('6: straight horizontal movement — returns 60', () => {
    const scissors = { cutStart: { x: 100, y: 200 }, cutCurrent: { x: 160, y: 200 } };
    expect(getCutDepth(scissors, testPoly)).toBe(60);
  });

  it('7: diagonal movement — returns hypot (3-4-5)', () => {
    const scissors = { cutStart: { x: 0, y: 0 }, cutCurrent: { x: 3, y: 4 } };
    expect(getCutDepth(scissors, testPoly)).toBeCloseTo(5, 5);
  });
});
