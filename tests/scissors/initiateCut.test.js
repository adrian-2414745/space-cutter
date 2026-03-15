import { describe, it, expect, beforeEach } from 'vitest';
import { createScissors, initiateCut } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

describe('initiateCut', () => {
  let scissors;

  beforeEach(() => {
    scissors = createScissors(testPoly); // edgeIndex: 0, pos: 300
  });

  it('1: sets cutting to true', () => {
    initiateCut(scissors, testPoly);
    expect(scissors.cutting).toBe(true);
  });

  it('2: sets cutPhase to 1', () => {
    initiateCut(scissors, testPoly);
    expect(scissors.cutPhase).toBe(1);
  });

  it('3: sets cutDirection to "down" for edge 0 (top edge going right, inward is "down")', () => {
    initiateCut(scissors, testPoly);
    expect(scissors.cutDirection).toBe('down');
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
    initiateCut(edge1Scissors, testPoly);
    expect(edge1Scissors.cutDirection).toBe('left');
  });

  it('5: sets cutStart to current screen position ({x:300, y:0} for edge 0 pos 300)', () => {
    initiateCut(scissors, testPoly);
    expect(scissors.cutStart).toEqual({ x: 300, y: 0 });
  });

  it('6: sets cutCurrent equal to cutStart at initiation', () => {
    initiateCut(scissors, testPoly);
    expect(scissors.cutCurrent).toEqual(scissors.cutStart);
  });

  it('7: cutTurn, cutTarget, cutTurnDirection are null after initiation', () => {
    initiateCut(scissors, testPoly);
    expect(scissors.cutTurn).toBeNull();
    expect(scissors.cutTarget).toBeNull();
    expect(scissors.cutTurnDirection).toBeNull();
  });

  it('8: screen position correct at edge 0 quarter-point (pos=150 → {x:150, y:0})', () => {
    scissors.pos = 150;
    initiateCut(scissors, testPoly);
    expect(scissors.cutStart).toEqual({ x: 150, y: 0 });
  });
});
