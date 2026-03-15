import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, pointInPolygon } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

const lPoly = { vertices: [
    { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
    { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
]};

describe('pointInPolygon', () => {
    it('2a: center of rect {x:300, y:200} returns true', () => {
        expect(pointInPolygon(300, 200, testPoly)).toBe(true);
    });

    it('2b: point just outside rect {x:601, y:200} returns false', () => {
        expect(pointInPolygon(601, 200, testPoly)).toBe(false);
    });

    it('2c: point far outside {x:9999, y:9999} returns false', () => {
        expect(pointInPolygon(9999, 9999, testPoly)).toBe(false);
    });

    it('2d: point inside filled area of L-shaped poly {x:100, y:300} returns true', () => {
        expect(pointInPolygon(100, 300, lPoly)).toBe(true);
    });

    it('2e: point in notch of L (inside bbox but outside poly) {x:500, y:300} returns false', () => {
        expect(pointInPolygon(500, 300, lPoly)).toBe(false);
    });
});
