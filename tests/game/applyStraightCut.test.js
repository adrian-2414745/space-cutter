import { describe, it, expect } from 'vitest';
import { applyStraightCut } from '../../js/game.js';
import { createPolygonFromRect, polygonArea } from '../../js/polygon.js';
import { testPoly } from '../fixtures.js';

const baseConfig = { winThreshold: 15 };

function makeScissors(cutStart, cutDirection, cutCurrent = null) {
    return {
        cutting: true,
        cutPhase: 1,
        cutStart,
        cutDirection,
        cutCurrent: cutCurrent || cutStart,
        cutTurn: null,
        cutTarget: null,
    };
}

describe('applyStraightCut', () => {
    it('1: exitPoint is at the opposite wall for a horizontal right cut', () => {
        const scissors = makeScissors({ x: 0, y: 200 }, 'right', { x: 10, y: 200 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(result.exitPoint).toEqual({ x: 600, y: 200 });
    });

    it('2: score = 50 for a bisecting horizontal cut', () => {
        const scissors = makeScissors({ x: 0, y: 200 }, 'right', { x: 10, y: 200 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(result.score).toBe(50);
    });

    it('3: won is false when score > winThreshold', () => {
        const scissors = makeScissors({ x: 0, y: 200 }, 'right', { x: 10, y: 200 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        // score = 50, winThreshold = 15 → won should be false
        expect(result.won).toBe(false);
    });

    it('4: won is true when retained half < winThreshold percent of originalArea', () => {
        // Small poly: 20×10 = area 200; half = 100; score = round(100/240000*10000)/100 = 0.04 < 15
        const smallPoly = createPolygonFromRect({ x: 0, y: 0, width: 20, height: 10 });
        const scissors = makeScissors({ x: 0, y: 5 }, 'right', { x: 1, y: 5 });
        const result = applyStraightCut(smallPoly, scissors, 240000, baseConfig);
        expect(result.won).toBe(true);
    });

    it('5: falls back to cutCurrent when raycast direction yields no hit', () => {
        // 'diagonal' is unknown direction → raycastToEdge returns null → fallback to cutCurrent
        const scissors = makeScissors({ x: 100, y: 200 }, 'diagonal', { x: 150, y: 200 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(result.exitPoint).toEqual({ x: 150, y: 200 });
    });

    it('6: newPoly is the larger of the two halves — asymmetric vertical cut at x=150', () => {
        // Vertical cut at x=150 going down: left=150×400=60000, right=450×400=180000 → keeps right
        const scissors = makeScissors({ x: 150, y: 0 }, 'down', { x: 150, y: 1 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(polygonArea(result.newPoly)).toBeCloseTo(180000);
    });

    it('7: score is rounded to 2 decimal places — asymmetric vertical cut at x=150', () => {
        // 180000 / 240000 * 10000 = 7500 → round(7500) / 100 = 75
        const scissors = makeScissors({ x: 150, y: 0 }, 'down', { x: 150, y: 1 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(result.score).toBe(75);
    });

    it('8: down cut from top midpoint reaches bottom edge', () => {
        const scissors = makeScissors({ x: 300, y: 0 }, 'down', { x: 300, y: 1 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(result.exitPoint).toEqual({ x: 300, y: 400 });
    });

    it('9: result object has all four fields', () => {
        const scissors = makeScissors({ x: 0, y: 200 }, 'right', { x: 10, y: 200 });
        const result = applyStraightCut(testPoly, scissors, 240000, baseConfig);
        expect(result).toHaveProperty('newPoly');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('won');
        expect(result).toHaveProperty('exitPoint');
    });
});
