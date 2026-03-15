import { describe, it, expect } from 'vitest';
import { testPoly, LShapedPoly } from '../fixtures.js';
import { isBallInPolygon } from '../../js/ball.js';

// testPoly: 600x400 rectangle (0,0)-(600,0)-(600,400)-(0,400)
// LShapedPoly: vertices (0,0),(600,0),(600,200),(300,200),(300,400),(0,400)
//   Missing corner: x=300..600, y=200..400

describe('isBallInPolygon', () => {
    it('26: center inside polygon → true (testPoly)', () => {
        const ball = { x: 300, y: 200, vx: 0, vy: 0, radius: 10 };
        expect(isBallInPolygon(ball, testPoly)).toBe(true);
    });

    it('27: center outside polygon → false (testPoly)', () => {
        const ball = { x: 700, y: 200, vx: 0, vy: 0, radius: 10 };
        expect(isBallInPolygon(ball, testPoly)).toBe(false);
    });

    it('28: concave cutout is exterior — ball in missing corner of LShapedPoly returns false', () => {
        // Missing corner is at x=450, y=300 (inside bbox but outside L-shape)
        const ball = { x: 450, y: 300, vx: 0, vy: 0, radius: 10 };
        expect(isBallInPolygon(ball, LShapedPoly)).toBe(false);
    });

    it('29: uses ball.x / ball.y only — large-radius ball with center outside returns false', () => {
        // Center is outside testPoly; large radius shouldn't make it count as inside
        const ball = { x: 700, y: 200, vx: 0, vy: 0, radius: 500 };
        expect(isBallInPolygon(ball, testPoly)).toBe(false);
    });
});
