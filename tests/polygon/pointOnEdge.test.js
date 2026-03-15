import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, pointOnEdge } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('pointOnEdge', () => {
    it('t=0 returns start vertex of edge', () => {
        expect(pointOnEdge(testPoly, 0, 0)).toEqual({ x: 0, y: 0 });
    });

    it('t=600 returns end vertex of edge', () => {
        expect(pointOnEdge(testPoly, 0, 600)).toEqual({ x: 600, y: 0 });
    });

    it('t=300 returns midpoint of top edge', () => {
        expect(pointOnEdge(testPoly, 0, 300)).toEqual({ x: 300, y: 0 });
    });

    it('zero-length edge returns the vertex position', () => {
        const degenPoly = { vertices: [
            { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }
        ]};
        expect(pointOnEdge(degenPoly, 0, 0)).toEqual({ x: 0, y: 0 });
    });
});
