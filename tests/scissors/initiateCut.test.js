import { describe, it, expect, beforeEach } from 'vitest';
import { createScissors, initiateCut } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

describe('initiateCut', () => {
  let scissors;

  beforeEach(() => {
    scissors = createScissors(testPoly); // edgeIndex: 0, pos: 300
  });

  it('1: sets cutting to true', () => {
    const result = initiateCut(scissors, testPoly);
    expect(result.cutting).toBe(true);
  });

  it('2: sets cutPhase to 1', () => {
    const result = initiateCut(scissors, testPoly);
    expect(result.cutPhase).toBe(1);
  });

  it('3: sets cutDirection to "down" for edge 0 (top edge going right, inward is "down")', () => {
    const result = initiateCut(scissors, testPoly);
    expect(result.cutDirection).toBe('down');
  });

  it('4: sets cutDirection to "left" for edge 1 (right edge, inward is "left")', () => {
    const edge1Scissors = {
      edgeIndex: 1,
      pos: 200,
      cutting: false,
      cutPhase: 0,
      cutStart: null,
      cutCurrent: null,
      cutTurn: null,
      cutTarget: null,
      cutDirection: null,
      cutTurnDirection: null,
    };
    const result = initiateCut(edge1Scissors, testPoly);
    expect(result.cutDirection).toBe('left');
  });

  it('5: sets cutStart to current screen position ({x:300, y:0} for edge 0 pos 300)', () => {
    const result = initiateCut(scissors, testPoly);
    expect(result.cutStart).toEqual({ x: 300, y: 0 });
  });

  it('6: sets cutCurrent equal to cutStart at initiation', () => {
    const result = initiateCut(scissors, testPoly);
    expect(result.cutCurrent).toEqual(result.cutStart);
  });

  it('7: cutTurn, cutTarget, cutTurnDirection are null after initiation', () => {
    const result = initiateCut(scissors, testPoly);
    expect(result.cutTurn).toBeNull();
    expect(result.cutTarget).toBeNull();
    expect(result.cutTurnDirection).toBeNull();
  });

  it('8: screen position correct at edge 0 quarter-point (pos=150 → {x:150, y:0})', () => {
    scissors.pos = 150;
    const result = initiateCut(scissors, testPoly);
    expect(result.cutStart).toEqual({ x: 150, y: 0 });
  });

  it('9: does not mutate input scissors', () => {
    const originalCutting = scissors.cutting;
    const originalCutPhase = scissors.cutPhase;
    initiateCut(scissors, testPoly);
    expect(scissors.cutting).toBe(originalCutting);
    expect(scissors.cutPhase).toBe(originalCutPhase);
    expect(scissors.cutStart).toBeNull();
    expect(scissors.cutCurrent).toBeNull();
  });
});
