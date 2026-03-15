import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, getEdges } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('getEdges', () => {
    it('returns 4 edges with correct coordinates for a rect', () => {
        const edges = getEdges(testPoly);
        expect(edges).toHaveLength(4);
        expect(edges[0]).toEqual({ x1: 0, y1: 0, x2: 600, y2: 0 });     // top
        expect(edges[1]).toEqual({ x1: 600, y1: 0, x2: 600, y2: 400 }); // right
        expect(edges[2]).toEqual({ x1: 600, y1: 400, x2: 0, y2: 400 }); // bottom
        expect(edges[3]).toEqual({ x1: 0, y1: 400, x2: 0, y2: 0 });     // left
    });

    it('last edge wraps from final vertex back to first vertex', () => {
        const edges = getEdges(testPoly);
        const last = edges[edges.length - 1];
        expect(last.x2).toEqual(testPoly.vertices[0].x);
        expect(last.y2).toEqual(testPoly.vertices[0].y);
    });

    it('triangle returns 3 edges with last wrapping to first vertex', () => {
        const tri = { vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }] };
        const edges = getEdges(tri);
        expect(edges).toHaveLength(3);
        expect(edges[2]).toEqual({ x1: 0, y1: 100, x2: 0, y2: 0 });
    });
});
