import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, findEdgeAtPoint } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('findEdgeAtPoint', () => {
    it('4a: point on top edge (x=300, y=0) returns edge index 0', () => {
        expect(findEdgeAtPoint(testPoly, 300, 0)).toEqual(0);
    });

    it('4b: point on right edge (x=600, y=200) returns edge index 1', () => {
        expect(findEdgeAtPoint(testPoly, 600, 200)).toEqual(1);
    });

    it('4c: point on bottom edge (x=300, y=400) returns edge index 2', () => {
        expect(findEdgeAtPoint(testPoly, 300, 400)).toEqual(2);
    });

    it('4d: point on left edge (x=0, y=200) returns edge index 3', () => {
        expect(findEdgeAtPoint(testPoly, 0, 200)).toEqual(3);
    });

    it('4e: point at top-left vertex (x=0, y=0) returns an adjacent edge index (0 or 3)', () => {
        const result = findEdgeAtPoint(testPoly, 0, 0);
        expect([0, 3]).toContain(result);
    });

    it('4f: point not on any edge (x=300, y=200) returns -1', () => {
        expect(findEdgeAtPoint(testPoly, 300, 200)).toEqual(-1);
    });
});
