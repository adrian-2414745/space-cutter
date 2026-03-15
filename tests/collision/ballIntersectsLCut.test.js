import { describe, it, expect } from 'vitest';
import { ballIntersectsLCut } from '../../js/collision.js';

function makeBall(x, y, radius = 10) {
  return { x, y, radius };
}

function makeScissors(overrides = {}) {
  return {
    cutting: true,
    cutStart:   { x: 0,   y: 0 },
    cutCurrent: { x: 100, y: 0 },
    cutTurn:    null,
    cutPhase:   1,
    ...overrides,
  };
}

// Phase 2 L-shaped scissors fixture: horizontal seg (0,0)→(100,0) then vertical (100,0)→(100,100)
const sc2 = makeScissors({
  cutPhase:   2,
  cutStart:   { x: 0,   y: 0   },
  cutTurn:    { x: 100, y: 0   },
  cutCurrent: { x: 100, y: 100 },
});

describe('ballIntersectsLCut — guard conditions', () => {
  it('1: cutting=false → false (ball on segment, but cutting=false)', () => {
    const sc = makeScissors({ cutting: false });
    expect(ballIntersectsLCut(makeBall(50, 0), sc)).toBe(false);
  });

  it('2: cutStart=null → false', () => {
    const sc = makeScissors({ cutStart: null });
    expect(ballIntersectsLCut(makeBall(50, 0), sc)).toBe(false);
  });

  it('3: cutCurrent=null → false', () => {
    const sc = makeScissors({ cutCurrent: null });
    expect(ballIntersectsLCut(makeBall(50, 0), sc)).toBe(false);
  });

  it('4: cutPhase=0 → false (cutting=true but phase not 1 or 2)', () => {
    const sc = makeScissors({ cutPhase: 0 });
    expect(ballIntersectsLCut(makeBall(50, 0), sc)).toBe(false);
  });

  it('5: cutPhase=3 → false', () => {
    const sc = makeScissors({ cutPhase: 3 });
    expect(ballIntersectsLCut(makeBall(50, 0), sc)).toBe(false);
  });
});

describe('ballIntersectsLCut — phase 1 (single segment)', () => {
  it('6: ball center exactly on segment → true', () => {
    // ball at (50,0) r=10, segment (0,0)→(100,0), dist=0 < 10
    const sc = makeScissors();
    expect(ballIntersectsLCut(makeBall(50, 0), sc)).toBe(true);
  });

  it('7: ball close to segment, within radius → true', () => {
    // ball at (50,9) r=10, dist=9 < 10
    const sc = makeScissors();
    expect(ballIntersectsLCut(makeBall(50, 9), sc)).toBe(true);
  });

  it('8: ball at exact radius distance → false (strict <)', () => {
    // ball at (50,10) r=10, dist=10 NOT < 10
    const sc = makeScissors();
    expect(ballIntersectsLCut(makeBall(50, 10), sc)).toBe(false);
  });

  it('9: ball far from segment → false', () => {
    // ball at (50,50) r=10, dist=50
    const sc = makeScissors();
    expect(ballIntersectsLCut(makeBall(50, 50), sc)).toBe(false);
  });

  it('10: ball beyond endpoint, clamped dist inside radius → true', () => {
    // ball at (107,0) r=10; foot clamped to (100,0); dist=7 < 10
    const sc = makeScissors();
    expect(ballIntersectsLCut(makeBall(107, 0), sc)).toBe(true);
  });

  it('11: ball beyond endpoint, clamped dist outside radius → false', () => {
    // ball at (115,0) r=10; foot clamped to (100,0); dist=15
    const sc = makeScissors();
    expect(ballIntersectsLCut(makeBall(115, 0), sc)).toBe(false);
  });

  it('12: zero-length segment, ball inside radius → true', () => {
    // cutStart=cutCurrent={x:50,y:50}; ball at (56,50) r=10; dist=6
    const sc = makeScissors({
      cutStart:   { x: 50, y: 50 },
      cutCurrent: { x: 50, y: 50 },
    });
    expect(ballIntersectsLCut(makeBall(56, 50), sc)).toBe(true);
  });

  it('13: zero-length segment, ball outside radius → false', () => {
    // cutStart=cutCurrent={x:50,y:50}; ball at (70,50) r=10; dist=20
    const sc = makeScissors({
      cutStart:   { x: 50, y: 50 },
      cutCurrent: { x: 50, y: 50 },
    });
    expect(ballIntersectsLCut(makeBall(70, 50), sc)).toBe(false);
  });
});

describe('ballIntersectsLCut — phase 2 (L-shaped cut)', () => {
  it('14: ball on first segment → true', () => {
    // ball at (50,5) r=10; dist to seg1 (0,0)→(100,0) = 5 < 10
    expect(ballIntersectsLCut(makeBall(50, 5), sc2)).toBe(true);
  });

  it('15: ball on second segment → true', () => {
    // ball at (95,50) r=10; dist to seg2 (100,0)→(100,100) = 5 < 10
    expect(ballIntersectsLCut(makeBall(95, 50), sc2)).toBe(true);
  });

  it('16: ball at turn point → true', () => {
    // ball at (100,0) r=10; dist to seg1 = 0 < 10
    expect(ballIntersectsLCut(makeBall(100, 0), sc2)).toBe(true);
  });

  it('17: ball near clamped end of seg1, inside radius → true', () => {
    // ball at (105,0) r=10; foot clamped to (100,0); dist=5 < 10
    expect(ballIntersectsLCut(makeBall(105, 0), sc2)).toBe(true);
  });

  it('18: ball far from both segments → false', () => {
    // ball at (200,200) r=10; far from both segs
    expect(ballIntersectsLCut(makeBall(200, 200), sc2)).toBe(false);
  });

  it('19: ball at exact radius from first segment → false (strict <)', () => {
    // ball at (50,10) r=10; dist to seg1=10 NOT < 10; also far from seg2
    expect(ballIntersectsLCut(makeBall(50, 10), sc2)).toBe(false);
  });

  it('20: ball at exact radius from second segment → false (strict <)', () => {
    // ball at (110,50) r=10; dist to seg2=10 NOT < 10; also far from seg1
    expect(ballIntersectsLCut(makeBall(110, 50), sc2)).toBe(false);
  });

  it('21: ball just inside radius of second segment only → true', () => {
    // ball at (109,50) r=10; dist to seg2=9 < 10
    expect(ballIntersectsLCut(makeBall(109, 50), sc2)).toBe(true);
  });
});
