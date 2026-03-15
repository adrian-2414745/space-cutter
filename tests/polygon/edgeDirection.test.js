import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, edgeDirection } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

describe('edgeDirection', () => {
    it('6a: edge 0 (top, TL→TR) inward normal points down', () => {
        expect(edgeDirection(testPoly, 0)).toEqual('down');
    });

    it('6b: edge 1 (right, TR→BR) inward normal points left', () => {
        expect(edgeDirection(testPoly, 1)).toEqual('left');
    });

    it('6c: edge 2 (bottom, BR→BL) inward normal points up', () => {
        expect(edgeDirection(testPoly, 2)).toEqual('up');
    });

    it('6d: edge 3 (left, BL→TL) inward normal points right', () => {
        expect(edgeDirection(testPoly, 3)).toEqual('right');
    });
});
