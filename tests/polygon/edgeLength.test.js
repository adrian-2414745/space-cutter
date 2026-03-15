import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, edgeLength } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('edgeLength', () => {
    it('top edge (index 0) of 600x400 rect returns 600', () => {
        expect(edgeLength(testPoly, 0)).toEqual(600);
    });

    it('right edge (index 1) returns 400', () => {
        expect(edgeLength(testPoly, 1)).toEqual(400);
    });

    it('last edge (index 3) returns 400 and wraps correctly', () => {
        expect(edgeLength(testPoly, 3)).toEqual(400);
    });
});
