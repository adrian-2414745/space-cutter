import { describe, it, expect } from 'vitest';
import { splitPolygon, polygonArea, boundingBox } from '../../js/polygon.js';
import { testPoly, LShapedPoly } from '../fixtures.js';

describe('splitPolygon', () => {
    it('horizontal cut keeps the larger sub-polygon', () => {
        const A = { x: 0, y: 100 };
        const C = { x: 600, y: 100 };

        const result = splitPolygon(testPoly, A, C);

        expect(polygonArea(result)).toEqual(180000);
        expect(result.vertices).toHaveLength(4);
        expect(result.vertices[0]).toEqual({ x: 600, y: 100 });
        expect(result.vertices[1]).toEqual({ x: 600, y: 400 });
        expect(result.vertices[2]).toEqual({ x: 0, y: 400 });
        expect(result.vertices[3]).toEqual({ x: 0, y: 100 });
    });

    it('vertical cut keeps the larger sub-polygon', () => {
        const A = { x: 200, y: 0 };
        const C = { x: 200, y: 400 };

        const result = splitPolygon(testPoly, A, C);

        const bb = boundingBox(result);
        expect(polygonArea(result)).toEqual(160000);
        expect(bb.width).toBeCloseTo(400);
        expect(bb.height).toBeCloseTo(400);
        expect(result.vertices).toHaveLength(4);
        expect(result.vertices[0]).toEqual({ x: 200, y: 0 });
        expect(result.vertices[1]).toEqual({ x: 600, y: 0 });
        expect(result.vertices[2]).toEqual({ x: 600, y: 400 });
        expect(result.vertices[3]).toEqual({ x: 200, y: 400 });
    });

    it('L-poly: horizontal cut along reflex edge keeps upper rectangle (area=120000, 4 vertices)', () => {
        const A = { x: 0, y: 200 };
        const C = { x: 600, y: 200 };

        const result = splitPolygon(LShapedPoly, A, C);

        expect(polygonArea(result)).toEqual(120000);
        expect(result.vertices).toHaveLength(4);
        expect(result.vertices[0]).toEqual({ x: 0, y: 200 });
        expect(result.vertices[1]).toEqual({ x: 0, y: 0 });
        expect(result.vertices[2]).toEqual({ x: 600, y: 0 });
        expect(result.vertices[3]).toEqual({ x: 600, y: 200 });
    });

    it('L-poly: vertical cut at x=300 keeps left rectangle (area=120000, 4 vertices)', () => {
        const A = { x: 300, y: 0 };
        const C = { x: 300, y: 400 };

        const result = splitPolygon(LShapedPoly, A, C);

        expect(polygonArea(result)).toEqual(120000);
        expect(result.vertices).toHaveLength(4);
        expect(result.vertices[0]).toEqual({ x: 300, y: 400 });
        expect(result.vertices[1]).toEqual({ x: 0, y: 400 });
        expect(result.vertices[2]).toEqual({ x: 0, y: 0 });
        expect(result.vertices[3]).toEqual({ x: 300, y: 0 });
    });

    it('4a: equal-area horizontal cut of testPoly at y=200 returns a polygon with area 120000', () => {
        const A = { x: 0, y: 200 };
        const C = { x: 600, y: 200 };

        const result = splitPolygon(testPoly, A, C);

        expect(polygonArea(result)).toEqual(120000);
    });

    it('4b: A and C on same edge returns original polygon unchanged', () => {
        const A = { x: 100, y: 0 };
        const C = { x: 400, y: 0 };

        const result = splitPolygon(testPoly, A, C);

        expect(result).toBe(testPoly);
    });

    it('4c: A not on any edge (interior point) returns original polygon unchanged', () => {
        const A = { x: 300, y: 200 };
        const C = { x: 600, y: 200 };

        const result = splitPolygon(testPoly, A, C);

        expect(result).toBe(testPoly);
    });

    it('4d: horizontal cut of L-shaped poly at y=100 returns lower L-strip with area 120000 and 6 vertices', () => {
        const A = { x: 0, y: 100 };
        const C = { x: 600, y: 100 };

        const result = splitPolygon(LShapedPoly, A, C);

        expect(polygonArea(result)).toEqual(120000);
        expect(result.vertices).toHaveLength(6);
    });
});
