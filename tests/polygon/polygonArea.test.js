import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, polygonArea } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

const LShapedPoly = { vertices: [
    { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
    { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
]};

describe('polygonArea', () => {
    it('returns 240000 for a 600x400 rect', () => {
        expect(polygonArea(testPoly)).toEqual(240000);
    });

    it('1a: L-shaped polygon (6 CW vertices) returns 180000', () => {
        expect(polygonArea(LShapedPoly)).toEqual(180000);
    });

    it('1b: single-vertex degenerate polygon returns 0', () => {
        const singlePoly = { vertices: [{ x: 100, y: 200 }] };
        expect(polygonArea(singlePoly)).toEqual(0);
    });
});
