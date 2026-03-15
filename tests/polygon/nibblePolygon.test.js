import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, nibblePolygon, polygonArea } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('nibblePolygon', () => {
    it('3a: nibble top-left corner of testPoly: area reduces by 10000 and result has 6 vertices', () => {
        const A = { x: 100, y: 0 };
        const B = { x: 100, y: 100 };
        const C = { x: 0, y: 100 };

        const result = nibblePolygon(testPoly, A, B, C);

        expect(polygonArea(result)).toEqual(230000);
        expect(result.vertices).toHaveLength(6);
    });

    it('3b: nibble bottom-right corner of testPoly: area reduces by 10000 and result has 6 vertices', () => {
        const A = { x: 500, y: 400 };
        const B = { x: 500, y: 300 };
        const C = { x: 600, y: 300 };

        const result = nibblePolygon(testPoly, A, B, C);

        expect(polygonArea(result)).toEqual(230000);
        expect(result.vertices).toHaveLength(6);
    });

    it('3c: result of top-left nibble has no collinear consecutive vertices', () => {
        const A = { x: 100, y: 0 };
        const B = { x: 100, y: 100 };
        const C = { x: 0, y: 100 };

        const result = nibblePolygon(testPoly, A, B, C);
        const verts = result.vertices;
        const n = verts.length;

        for (let i = 0; i < n; i++) {
            const prev = verts[(i - 1 + n) % n];
            const curr = verts[i];
            const next = verts[(i + 1) % n];
            const collinearX = prev.x === curr.x && curr.x === next.x;
            const collinearY = prev.y === curr.y && curr.y === next.y;
            expect(collinearX || collinearY).toBe(false);
        }
    });

    it('3d: A not on any edge returns original polygon unchanged', () => {
        const A = { x: 300, y: 200 };
        const B = { x: 100, y: 100 };
        const C = { x: 0, y: 100 };

        const result = nibblePolygon(testPoly, A, B, C);

        expect(result).toBe(testPoly);
    });
});
