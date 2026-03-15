import { describe, it, expect } from 'vitest';
import { cancelCut } from '../../js/scissors.js';

function makeActiveScissors() {
  return {
    edgeIndex: 0, pos: 100,
    cutting: true, cutPhase: 2,
    cutStart: {x:300,y:0}, cutCurrent: {x:300,y:200},
    cutTurn: {x:300,y:150}, cutTarget: {x:0,y:150},
    cutDirection: 'down', cutTurnDirection: 'left',
  };
}

describe('cancelCut', () => {
  it('1: sets cutting to false', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutting).toBe(false);
  });

  it('2: sets cutPhase to 0', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutPhase).toBe(0);
  });

  it('3: sets cutStart to null', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutStart).toBeNull();
  });

  it('4: sets cutCurrent to null', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutCurrent).toBeNull();
  });

  it('5: sets cutTurn to null', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutTurn).toBeNull();
  });

  it('6: sets cutTarget to null', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutTarget).toBeNull();
  });

  it('7: sets cutDirection to null', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutDirection).toBeNull();
  });

  it('8: sets cutTurnDirection to null', () => {
    const scissors = makeActiveScissors();
    cancelCut(scissors);
    expect(scissors.cutTurnDirection).toBeNull();
  });

  it('9: calling cancelCut on already-idle scissors is safe (no errors, all still null/false/0)', () => {
    const scissors = {
      edgeIndex: 0, pos: 300,
      cutting: false, cutPhase: 0,
      cutStart: null, cutCurrent: null,
      cutTurn: null, cutTarget: null,
      cutDirection: null, cutTurnDirection: null,
    };
    expect(() => cancelCut(scissors)).not.toThrow();
    expect(scissors.cutting).toBe(false);
    expect(scissors.cutPhase).toBe(0);
    expect(scissors.cutStart).toBeNull();
    expect(scissors.cutCurrent).toBeNull();
    expect(scissors.cutTurn).toBeNull();
    expect(scissors.cutTarget).toBeNull();
    expect(scissors.cutDirection).toBeNull();
    expect(scissors.cutTurnDirection).toBeNull();
  });
});
