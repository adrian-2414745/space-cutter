import { describe, it, expect } from 'vitest';
import { updateScissorsMovement } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

const config = { scissorsBorderSpeed: 200, cornerSnapDistance: 5 };

function makeScissors(edgeIndex, pos) {
  return {
    edgeIndex, pos, cutting: false, cutPhase: 0,
    cutStart: null, cutCurrent: null, cutTurn: null,
    cutTarget: null, cutDirection: null, cutTurnDirection: null,
  };
}

describe('updateScissorsMovement', () => {

  it('1: no input (left=false, right=false) — scissors do not move', () => {
    const sc = makeScissors(0, 100);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: false, right: false });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(100);
  });

  it('2: right input — pos increases by speed*dt (200*0.1=20)', () => {
    const sc = makeScissors(0, 100);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: false, right: true });
    expect(sc.pos).toBe(120);
    expect(sc.edgeIndex).toBe(0);
  });

  it('3: left input — pos decreases by speed*dt (200*0.1=20)', () => {
    const sc = makeScissors(0, 100);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: true, right: false });
    expect(sc.pos).toBe(80);
    expect(sc.edgeIndex).toBe(0);
  });

  it('4: both inputs — net delta is 0, scissors do not move', () => {
    const sc = makeScissors(0, 100);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: true, right: true });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(100);
  });

  it('5: right input causes edge wrap — moves from edge 0 to edge 1', () => {
    // pos=595, speed=20, new pos=615 > 600 (edge 0 len). overflow=15 → edge 1, pos=15
    const sc = makeScissors(0, 595);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: false, right: true });
    expect(sc.edgeIndex).toBe(1);
    expect(sc.pos).toBe(15);
  });

  it('6: left input causes edge wrap — moves from edge 1 to edge 0', () => {
    // edgeIndex=1, pos=5, speed=20, new pos=5-20=-15.
    // prev edge is 0, len=600. pos = 600 + (-15) = 585.
    const sc = makeScissors(1, 5);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: true, right: false });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(585);
  });

  it('7: wrap overflow clamped to next edge\'s length (large overshoot rightward)', () => {
    // edgeIndex=0, pos=500, dt=10, speed=2000, new pos=2500 > 600.
    // overflow = 2500 - 600 = 1900. next edge (1) len=400. pos clamped to 400.
    const sc = makeScissors(0, 500);
    updateScissorsMovement(sc, testPoly, 10, config, { left: false, right: true });
    expect(sc.edgeIndex).toBe(1);
    expect(sc.pos).toBe(400);
  });

  it('8: wrapped pos clamped to 0 if still negative (large leftward overshoot)', () => {
    // edgeIndex=1, pos=5, dt=10, speed=2000, new pos=5-2000=-1995.
    // prev edge is 0, len=600. raw pos = 600 + (-1995) = -1395 < 0 → clamped to 0.
    const sc = makeScissors(1, 5);
    updateScissorsMovement(sc, testPoly, 10, config, { left: true, right: false });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(0);
  });

  it('9: right snap — within cornerSnapDistance of edge end, moving right → snap to len', () => {
    // edgeIndex=0, pos=596. Edge 0 len=600. cornerSnapDistance=5. 596 > 600-5=595.
    // Use dt=0.001 so speed=0.2: pos becomes 596.2, which is still <= 600 (no wrap),
    // but > 595 (in snap zone), so snap fires → pos set to 600.
    const sc = makeScissors(0, 596);
    updateScissorsMovement(sc, testPoly, 0.001, config, { left: false, right: true });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(600);
  });

  it('10: left snap — within cornerSnapDistance of edge start, moving left → snap to 0', () => {
    // edgeIndex=0, pos=3. cornerSnapDistance=5. 3 < 5.
    // Use dt=0.001 so speed=0.2: pos becomes 2.8, which is >= 0 (no wrap),
    // but < 5 (in snap zone), so snap fires → pos set to 0.
    const sc = makeScissors(0, 3);
    updateScissorsMovement(sc, testPoly, 0.001, config, { left: true, right: false });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(0);
  });

  it('11: snap only fires when moving toward corner (not away)', () => {
    // edgeIndex=0, pos=3, but moving RIGHT (away from 0 corner).
    // No snap to 0. pos advances normally: 3 + 20 = 23.
    const sc = makeScissors(0, 3);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: false, right: true });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(23);
  });

  it('12: dt=0 — no movement even with right input', () => {
    const sc = makeScissors(0, 100);
    updateScissorsMovement(sc, testPoly, 0, config, { left: false, right: true });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(100);
  });

  it('13: wraps correctly from edge 3 back to edge 0', () => {
    // edgeIndex=3, pos=395, dt=0.1, speed=20, new pos=415 > 400 (edge 3 len).
    // overflow = 415 - 400 = 15. next edge: (3+1)%4 = 0. pos=15.
    const sc = makeScissors(3, 395);
    updateScissorsMovement(sc, testPoly, 0.1, config, { left: false, right: true });
    expect(sc.edgeIndex).toBe(0);
    expect(sc.pos).toBe(15);
  });

});
