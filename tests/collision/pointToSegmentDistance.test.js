import { describe, it, expect } from 'vitest';
import { pointToSegmentDistance } from '../../js/collision.js';

describe('pointToSegmentDistance', () => {
  // --- Degenerate (zero-length) segment ---

  it('1: zero-length segment — returns Euclidean distance to endpoint (3-4-5 triangle)', () => {
    expect(pointToSegmentDistance(3, 4, 0, 0, 0, 0)).toBe(5);
  });

  it('2: zero-length segment — point coincident with endpoint returns 0', () => {
    expect(pointToSegmentDistance(7, 2, 7, 2, 7, 2)).toBe(0);
  });

  // --- Perpendicular foot inside segment ---

  it('3: horizontal segment — point above midpoint, foot at (5,0), distance 3', () => {
    expect(pointToSegmentDistance(5, 3, 0, 0, 10, 0)).toBe(3);
  });

  it('4: vertical segment — point to the right of midpoint, foot at (0,5), distance 4', () => {
    expect(pointToSegmentDistance(4, 5, 0, 0, 0, 10)).toBe(4);
  });

  it('5: point ON the segment — distance 0', () => {
    expect(pointToSegmentDistance(5, 0, 0, 0, 10, 0)).toBe(0);
  });

  // --- Clamped to endpoints (t outside [0,1]) ---

  it('6: point beyond x2,y2 endpoint — foot clamped to (10,0), distance 5', () => {
    expect(pointToSegmentDistance(15, 0, 0, 0, 10, 0)).toBe(5);
  });

  it('7: point behind x1,y1 endpoint — foot clamped to (0,0), distance 5', () => {
    expect(pointToSegmentDistance(-3, 4, 0, 0, 10, 0)).toBe(5);
  });

  it('8: projection lands exactly on start endpoint (t=0) — distance 5', () => {
    expect(pointToSegmentDistance(0, 5, 0, 0, 10, 0)).toBe(5);
  });

  it('9: projection lands exactly on end endpoint (t=1) — distance 5', () => {
    expect(pointToSegmentDistance(10, 5, 0, 0, 10, 0)).toBe(5);
  });

  // --- Floating point / precision ---

  it('10: non-axis-aligned segment — foot at (3,0), distance 3', () => {
    expect(pointToSegmentDistance(0, 0, 3, 0, 3, 4)).toBeCloseTo(3, 10);
  });

  it('11: result is always non-negative for several signed-offset inputs', () => {
    const cases = [
      [0, 0, 0, 0, 0, 0],
      [-5, -5, 0, 0, 10, 0],
      [5, -3, 0, 0, 10, 0],
      [-3, -4, 0, 0, 0, 0],
      [100, 100, 50, 50, 75, 75],
    ];
    for (const [px, py, x1, y1, x2, y2] of cases) {
      expect(pointToSegmentDistance(px, py, x1, y1, x2, y2)).toBeGreaterThanOrEqual(0);
    }
  });
});
