import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, boundingBox } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('boundingBox', () => {
    it('rect at origin returns matching bbox', () => {
        expect(boundingBox(testPoly)).toEqual({ x: 0, y: 0, width: 600, height: 400 });
    });

    it('offset rect returns correct x, y, width, height', () => {
        const poly = createPolygonFromRect({ x: 50, y: 75, width: 200, height: 100 });
        expect(boundingBox(poly)).toEqual({ x: 50, y: 75, width: 200, height: 100 });
    });

    it('L-shaped polygon bbox encloses all vertices', () => {
        const lPoly = { vertices: [
            { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
            { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
        ]};
        expect(boundingBox(lPoly)).toEqual({ x: 0, y: 0, width: 600, height: 400 });
    });
});
