import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, raycastToEdge } from '../../js/polygon.js';

const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

const LShapedPoly = { vertices: [
    { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
    { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
]};

describe('raycastToEdge', () => {
    it('4a: ray down from (300,200) hits bottom edge at y=400', () => {
        const result = raycastToEdge(300, 200, 'down', testPoly);
        expect(result).not.toBeNull();
        expect(result.point).toEqual({ x: 300, y: 400 });
        expect(result.distance).toEqual(200);
    });

    it('4b: ray up from (300,200) hits top edge at y=0', () => {
        const result = raycastToEdge(300, 200, 'up', testPoly);
        expect(result).not.toBeNull();
        expect(result.point).toEqual({ x: 300, y: 0 });
        expect(result.distance).toEqual(200);
    });

    it('4c: ray right from (300,200) hits right edge at x=600', () => {
        const result = raycastToEdge(300, 200, 'right', testPoly);
        expect(result).not.toBeNull();
        expect(result.point).toEqual({ x: 600, y: 200 });
        expect(result.distance).toEqual(300);
    });

    it('4d: ray left from (300,200) hits left edge at x=0', () => {
        const result = raycastToEdge(300, 200, 'left', testPoly);
        expect(result).not.toBeNull();
        expect(result.point).toEqual({ x: 0, y: 200 });
        expect(result.distance).toEqual(300);
    });

    it('4e: distance is correct — ray down from (300,200) returns distance 200', () => {
        const result = raycastToEdge(300, 200, 'down', testPoly);
        expect(result.distance).toEqual(200);
    });

    it('4f: ray down from point outside horizontal span (px=700) returns null', () => {
        const result = raycastToEdge(700, 200, 'down', testPoly);
        expect(result).toBeNull();
    });

    it('4g: L-shape — ray right from (300,250): right wall only spans y:0-200, notch edge at x=300 is origin, returns null', () => {
        const result = raycastToEdge(300, 250, 'right', LShapedPoly);
        expect(result).toBeNull();
    });

    it('4h: L-shape — ray left from (400,100): hits left edge at x=0, distance 400', () => {
        const result = raycastToEdge(400, 100, 'left', LShapedPoly);
        expect(result).not.toBeNull();
        expect(result.distance).toEqual(400);
        expect(result.point).toEqual({ x: 0, y: 100 });
    });

    it('4i: L-shape — ray down from (400,100): hits horizontal notch edge at y=200, distance 100', () => {
        const result = raycastToEdge(400, 100, 'down', LShapedPoly);
        expect(result).not.toBeNull();
        expect(result.distance).toEqual(100);
        expect(result.point).toEqual({ x: 400, y: 200 });
    });
});
