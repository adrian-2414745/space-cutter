import { describe, it, expect } from 'vitest';
import { testPoly } from '../fixtures.js';
import { reconcileBalls } from '../../js/game.js';
import { pointInPolygon, createPolygonFromRect } from '../../js/polygon.js';

const baseConfig = {
    ballRadius: 10,
    ballSpeed: 200,
    ballDensityPx2: 30000,
    densityRampK: 2,
    minBalls: 1,
    winThreshold: 15,
};

function makeBall(x, y, radius = 10) {
    return { x, y, vx: 100, vy: 100, radius };
}

describe('reconcileBalls', () => {
    it('1: returns empty array when balls list is empty and target is 0', () => {
        const config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 0 };
        const result = reconcileBalls(testPoly, [], config, 240000);
        expect(result.length).toBe(0);
    });

    it('2: spawns balls to reach minBalls when area is too small for density target', () => {
        const config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 3 };
        const result = reconcileBalls(testPoly, [], config, 240000);
        expect(result.length).toBe(3);
        for (const ball of result) {
            expect(ball).toHaveProperty('x');
            expect(ball).toHaveProperty('y');
            expect(ball).toHaveProperty('vx');
            expect(ball).toHaveProperty('vy');
            expect(ball).toHaveProperty('radius');
        }
    });

    it('3: filters out a ball whose center is outside poly', () => {
        const balls = [makeBall(700, 200)];
        const result = reconcileBalls(testPoly, balls, baseConfig, 240000);
        expect(result.every(b => b.x !== 700)).toBe(true);
    });

    it('4: keeps all balls that are inside poly and fills to target', () => {
        const config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 1 };
        const balls = [makeBall(300, 200)];
        // target = max(1, floor(240000 / 1e9)) = max(1, 0) = 1; delta = 0
        const result = reconcileBalls(testPoly, balls, config, 240000);
        expect(result.length).toBe(1);
        expect(result[0].x).toBe(300);
    });

    it('5: trims excess balls down to target count', () => {
        const config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 2 };
        const balls = [
            makeBall(100, 100),
            makeBall(200, 100),
            makeBall(300, 100),
            makeBall(400, 100),
            makeBall(500, 100),
        ];
        const result = reconcileBalls(testPoly, balls, config, 240000);
        expect(result.length).toBe(2);
    });

    it('6: full density target calculation — 8 balls at full area', () => {
        // testPoly = 600x400 = 240000; areaPercent=100, progressFactor=1+2*0=1, effectiveDensity=30000
        // target = max(1, floor(240000/30000)) = max(1, 8) = 8
        const result = reconcileBalls(testPoly, [], baseConfig, 240000);
        expect(result.length).toBe(8);
    });

    it('7: originalArea = 0 does not crash; falls back to areaPercent = 100', () => {
        const config = { ...baseConfig, minBalls: 1, ballDensityPx2: 1e9 };
        let result;
        expect(() => {
            result = reconcileBalls(testPoly, [], config, 0);
        }).not.toThrow();
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('8: delta=0 path — returned array has same length as input and preserves ball objects', () => {
        // ballDensityPx2=1e9, minBalls=2 → target=2; provide exactly 2 balls inside poly
        const config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 2 };
        const ball1 = makeBall(200, 200);
        const ball2 = makeBall(400, 200);
        const balls = [ball1, ball2];
        const result = reconcileBalls(testPoly, balls, config, 240000);
        expect(result.length).toBe(2);
        expect(result).toContain(ball1);
        expect(result).toContain(ball2);
    });

    it('9: returned balls all have centers inside poly', () => {
        const result = reconcileBalls(testPoly, [], baseConfig, 240000);
        for (const ball of result) {
            expect(pointInPolygon(ball.x, ball.y, testPoly)).toBe(true);
        }
    });

    it('10: density-ramp at 50% area — should produce 8 balls', () => {
        // poly = 600x200 = area 120000 (half of 240000)
        // areaPercent=50, progressFactor=1+2*0.5=2, effectiveDensity=30000/2=15000
        // target = max(0, floor(120000/15000)) = max(0, 8) = 8
        const halfPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 200 });
        const config = { ...baseConfig, densityRampK: 2, ballDensityPx2: 30000, minBalls: 0 };
        const result = reconcileBalls(halfPoly, [], config, 240000);
        expect(result.length).toBe(8);
    });
});
