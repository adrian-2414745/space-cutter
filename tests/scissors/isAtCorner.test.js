import { describe, it, expect } from 'vitest';
import { testPoly } from '../fixtures.js';
import { isAtCorner } from '../../js/scissors.js';

describe('isAtCorner', () => {
  it('1: pos=0 returns true', () => {
    const scissors = { edgeIndex: 0, pos: 0 };
    expect(isAtCorner(scissors, testPoly)).toBe(true);
  });

  it('2: pos=edgeLength (600 for edge 0) returns true', () => {
    const scissors = { edgeIndex: 0, pos: 600 };
    expect(isAtCorner(scissors, testPoly)).toBe(true);
  });

  it('3: pos > edgeLength (601) returns true', () => {
    const scissors = { edgeIndex: 0, pos: 601 };
    expect(isAtCorner(scissors, testPoly)).toBe(true);
  });

  it('4: pos < 0 (-1) returns true', () => {
    const scissors = { edgeIndex: 0, pos: -1 };
    expect(isAtCorner(scissors, testPoly)).toBe(true);
  });

  it('5: pos at midpoint (300) returns false', () => {
    const scissors = { edgeIndex: 0, pos: 300 };
    expect(isAtCorner(scissors, testPoly)).toBe(false);
  });

  it('6: pos near-but-not-at corner (1) returns false', () => {
    const scissors = { edgeIndex: 0, pos: 1 };
    expect(isAtCorner(scissors, testPoly)).toBe(false);
  });

  it('7: pos = edgeLength-1 (599) returns false', () => {
    const scissors = { edgeIndex: 0, pos: 599 };
    expect(isAtCorner(scissors, testPoly)).toBe(false);
  });

  it('8: works on edge 1 (length 400): pos=400 returns true', () => {
    const scissors = { edgeIndex: 1, pos: 400 };
    expect(isAtCorner(scissors, testPoly)).toBe(true);
  });
});
