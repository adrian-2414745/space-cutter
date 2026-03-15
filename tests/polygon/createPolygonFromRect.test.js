import { describe, it, expect } from 'vitest';
import { createPolygonFromRect } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('createPolygonFromRect', () => {
    it('produces four CW vertices for a 600x400 rect at origin', () => {
        expect(testPoly.vertices).toHaveLength(4);
        expect(testPoly.vertices[0]).toEqual({ x: 0, y: 0 });
        expect(testPoly.vertices[1]).toEqual({ x: 600, y: 0 });
        expect(testPoly.vertices[2]).toEqual({ x: 600, y: 400 });
        expect(testPoly.vertices[3]).toEqual({ x: 0, y: 400 });
    });
});
