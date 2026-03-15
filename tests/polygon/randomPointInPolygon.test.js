import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, randomPointInPolygon, pointInPolygon } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

const LShapedPoly = { vertices: [
    { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
    { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
]};

describe('randomPointInPolygon', () => {
    it('1a. returns a point inside the polygon across 20 samples (no padding)', () => {
        for (let i = 0; i < 20; i++) {
            const pt = randomPointInPolygon(testPoly, 0);
            expect(pointInPolygon(pt.x, pt.y, testPoly)).toBe(true);
        }
    });

    it('1a. returns a point inside the L-shaped polygon across 20 samples (no padding)', () => {
        for (let i = 0; i < 20; i++) {
            const pt = randomPointInPolygon(LShapedPoly, 0);
            expect(pointInPolygon(pt.x, pt.y, LShapedPoly)).toBe(true);
        }
    });

    it('1b. falls back to bbox center when padding is impossibly large', () => {
        const smallPoly = createPolygonFromRect({ x: 50, y: 75, width: 100, height: 100 });
        const pt = randomPointInPolygon(smallPoly, 10000);
        expect(pt.x).toBeCloseTo(50 + 100 / 2);
        expect(pt.y).toBeCloseTo(75 + 100 / 2);
    });
});
