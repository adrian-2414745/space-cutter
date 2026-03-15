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
    const result = cancelCut(scissors);
    expect(result.cutting).toBe(false);
  });

  it('2: sets cutPhase to 0', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutPhase).toBe(0);
  });

  it('3: sets cutStart to null', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutStart).toBeNull();
  });

  it('4: sets cutCurrent to null', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutCurrent).toBeNull();
  });

  it('5: sets cutTurn to null', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutTurn).toBeNull();
  });

  it('6: sets cutTarget to null', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutTarget).toBeNull();
  });

  it('7: sets cutDirection to null', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutDirection).toBeNull();
  });

  it('8: sets cutTurnDirection to null', () => {
    const scissors = makeActiveScissors();
    const result = cancelCut(scissors);
    expect(result.cutTurnDirection).toBeNull();
  });

  it('9: calling cancelCut on already-idle scissors is safe (no errors, all still null/false/0)', () => {
    const scissors = {
      edgeIndex: 0, pos: 300,
      cutting: false, cutPhase: 0,
      cutStart: null, cutCurrent: null,
      cutTurn: null, cutTarget: null,
      cutDirection: null, cutTurnDirection: null,
    };
    let result;
    expect(() => { result = cancelCut(scissors); }).not.toThrow();
    expect(result.cutting).toBe(false);
    expect(result.cutPhase).toBe(0);
    expect(result.cutStart).toBeNull();
    expect(result.cutCurrent).toBeNull();
    expect(result.cutTurn).toBeNull();
    expect(result.cutTarget).toBeNull();
    expect(result.cutDirection).toBeNull();
    expect(result.cutTurnDirection).toBeNull();
  });

  it('10: does not mutate input scissors', () => {
    const scissors = makeActiveScissors();
    const originalCutting = scissors.cutting;
    const originalCutPhase = scissors.cutPhase;
    cancelCut(scissors);
    expect(scissors.cutting).toBe(originalCutting);
    expect(scissors.cutPhase).toBe(originalCutPhase);
  });
});
