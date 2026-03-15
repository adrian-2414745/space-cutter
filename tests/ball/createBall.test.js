import { describe, it, expect } from 'vitest';
import { testPoly } from '../fixtures.js';
import { createBall } from '../../js/ball.js';
import { pointInPolygon } from '../../js/polygon.js';

const config = { ballRadius: 10, ballSpeed: 200 };

describe('createBall', () => {
    it('1: returns required properties — x, y, vx, vy, radius', () => {
        const ball = createBall(testPoly, config);
        expect(ball).toHaveProperty('x');
        expect(ball).toHaveProperty('y');
        expect(ball).toHaveProperty('vx');
        expect(ball).toHaveProperty('vy');
        expect(ball).toHaveProperty('radius');
    });

    it('2: radius matches config.ballRadius', () => {
        const ball = createBall(testPoly, config);
        expect(ball.radius).toBe(config.ballRadius);
    });

    it('3: speed magnitude matches config.ballSpeed', () => {
        const ball = createBall(testPoly, config);
        expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(config.ballSpeed, 5);
    });

    it('4: ball center is inside polygon', () => {
        const ball = createBall(testPoly, config);
        expect(pointInPolygon(ball.x, ball.y, testPoly)).toBe(true);
    });

    it('5: ball center respects margin — at least ballRadius*2 from every edge', () => {
        // testPoly is 600x400; margin = ballRadius*2 = 20 means valid range x:[20,580], y:[20,380]
        const margin = config.ballRadius * 2;
        for (let i = 0; i < 20; i++) {
            const ball = createBall(testPoly, config);
            expect(ball.x).toBeGreaterThanOrEqual(margin);
            expect(ball.x).toBeLessThanOrEqual(600 - margin);
            expect(ball.y).toBeGreaterThanOrEqual(margin);
            expect(ball.y).toBeLessThanOrEqual(400 - margin);
        }
    });

    it('6: multiple calls produce varied positions', () => {
        const positions = new Set();
        for (let i = 0; i < 20; i++) {
            const ball = createBall(testPoly, config);
            positions.add(`${ball.x},${ball.y}`);
        }
        expect(positions.size).toBeGreaterThanOrEqual(2);
    });

    it('7: multiple calls produce varied velocity directions', () => {
        const directions = new Set();
        for (let i = 0; i < 20; i++) {
            const ball = createBall(testPoly, config);
            // Quantize to ~1-degree bins to detect variation
            const angle = Math.round(Math.atan2(ball.vy, ball.vx) * 180 / Math.PI);
            directions.add(angle);
        }
        expect(directions.size).toBeGreaterThanOrEqual(2);
    });
});
