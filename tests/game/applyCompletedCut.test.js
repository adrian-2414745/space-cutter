import { describe, it, expect } from 'vitest';
import { applyCompletedCut } from '../../js/game.js';
import { createPolygonFromRect, polygonArea } from '../../js/polygon.js';
import { testPoly } from '../fixtures.js';

const baseConfig = { winThreshold: 15 };

function makeScissors(cutStart, cutTurn, cutTarget) {
    return {
        cutting: true,
        cutPhase: 2,
        cutStart,
        cutTurn,
        cutTarget,
        cutCurrent: cutTarget,
        cutDirection: 'down',
        cutTurnDirection: null
    };
}

describe('applyCompletedCut', () => {
    it('1: returns newPoly with area smaller than original after a valid corner cut', () => {
        const scissors = makeScissors(
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);

        expect(polygonArea(result.newPoly)).toEqual(230000);
        expect(result.score).toBe(95.83);
    });

    it('2: won is false when score is above winThreshold', () => {
        const scissors = makeScissors(
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);

        expect(result.won).toBe(false);
    });

    it('3: won is true when score drops below winThreshold', () => {
        // 40x40 polygon, area = 1600
        const smallPoly = createPolygonFromRect({ x: 0, y: 0, width: 40, height: 40 });
        // Cut away top-left 10x40 slab: nibblePolygon keeps larger piece (30x40=1200)
        const scissors = makeScissors(
            { x: 10, y: 0 },
            { x: 10, y: 40 },
            { x: 0, y: 40 }
        );
        // score = round(1200/240000*10000)/100 = round(50)/100 = 0.50 < 15 → won=true
        const result = applyCompletedCut(smallPoly, scissors, 240000, baseConfig);

        expect(result.won).toBe(true);
    });

    it('4: score is rounded to exactly 2 decimal places', () => {
        const scissors = makeScissors(
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);

        // 230000/240000*10000 = 9583.333... → round → 9583 → /100 = 95.83
        expect(result.score).toBe(95.83);
        expect(result.score).not.toBe(95.8333333);
    });

    it('5: newPoly is not the same object reference as the input poly', () => {
        const scissors = makeScissors(
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);

        expect(result.newPoly).not.toBe(testPoly);
    });

    it('6: invalid cut (cutStart not on any edge) returns original polygon unchanged', () => {
        // Interior point — nibblePolygon returns original poly unchanged
        const scissors = makeScissors(
            { x: 300, y: 200 },
            { x: 300, y: 100 },
            { x: 200, y: 100 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);

        expect(result.newPoly).toBe(testPoly);
        expect(result.score).toBe(100);
        expect(result.won).toBe(false);
    });

    it('7: won is false when score equals winThreshold exactly (strict < check)', () => {
        const scissors = makeScissors(
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);
        // result.score === 95.83; set winThreshold to 95.83 → score is NOT less than threshold
        const configAtThreshold = { winThreshold: result.score };
        const result2 = applyCompletedCut(testPoly, scissors, 240000, configAtThreshold);

        expect(result2.score).toBe(95.83);
        expect(result2.won).toBe(false);
    });

    it('8: bottom-right corner cut produces symmetric result', () => {
        // cutStart on bottom edge, cutTurn interior, cutTarget on right edge
        const scissors = makeScissors(
            { x: 500, y: 400 },
            { x: 500, y: 300 },
            { x: 600, y: 300 }
        );
        const result = applyCompletedCut(testPoly, scissors, 240000, baseConfig);

        expect(result.score).toBe(95.83);
        expect(result.won).toBe(false);
    });
});
