import { describe, it, expect } from 'vitest';
import { testPoly } from '../fixtures.js';
import { createScissors } from '../../js/scissors.js';
import { createPolygonFromRect } from '../../js/polygon.js';

describe('createScissors', () => {
    it('1: returns object with all required properties', () => {
        const scissors = createScissors(testPoly);
        expect(scissors).toHaveProperty('edgeIndex');
        expect(scissors).toHaveProperty('pos');
        expect(scissors).toHaveProperty('cutting');
        expect(scissors).toHaveProperty('cutPhase');
        expect(scissors).toHaveProperty('cutStart');
        expect(scissors).toHaveProperty('cutCurrent');
        expect(scissors).toHaveProperty('cutTurn');
        expect(scissors).toHaveProperty('cutTarget');
        expect(scissors).toHaveProperty('cutDirection');
        expect(scissors).toHaveProperty('cutTurnDirection');
    });

    it('2: edgeIndex is 0', () => {
        const scissors = createScissors(testPoly);
        expect(scissors.edgeIndex).toBe(0);
    });

    it('3: pos is half of edge 0 length (300 for testPoly 600x400)', () => {
        const scissors = createScissors(testPoly);
        expect(scissors.pos).toBe(300);
    });

    it('4: pos is half of edge 0 for a different polygon (100x50 → pos=50)', () => {
        const smallPoly = createPolygonFromRect({ x: 0, y: 0, width: 100, height: 50 });
        const scissors = createScissors(smallPoly);
        expect(scissors.pos).toBe(50);
    });

    it('5: cutting is false, cutPhase is 0', () => {
        const scissors = createScissors(testPoly);
        expect(scissors.cutting).toBe(false);
        expect(scissors.cutPhase).toBe(0);
    });

    it('6: all cut-state fields are null', () => {
        const scissors = createScissors(testPoly);
        expect(scissors.cutStart).toBeNull();
        expect(scissors.cutCurrent).toBeNull();
        expect(scissors.cutTurn).toBeNull();
        expect(scissors.cutTarget).toBeNull();
        expect(scissors.cutDirection).toBeNull();
        expect(scissors.cutTurnDirection).toBeNull();
    });
});
