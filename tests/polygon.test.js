import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, splitPolygon, polygonArea, boundingBox, getEdges, edgeLength, pointOnEdge, pointInPolygon, raycastToEdge, edgeDirection } from '../js/polygon.js';


const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });


describe('polygon', () => {
    describe('createPolygonFromRect', () => {
        it('produces four CW vertices for a 600x400 rect at origin', () => {
           
            expect(testPoly.vertices).toHaveLength(4);
            expect(testPoly.vertices[0]).toEqual({ x: 0, y: 0 });
            expect(testPoly.vertices[1]).toEqual({ x: 600, y: 0 });
            expect(testPoly.vertices[2]).toEqual({ x: 600, y: 400 });
            expect(testPoly.vertices[3]).toEqual({ x: 0, y: 400 });
        });
    });

    describe('polygonArea', () => {
        it('returns 240000 for a 600x400 rect', () => {
            expect(polygonArea(testPoly)).toEqual(240000);
        });
    });

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

    describe('pointInPolygon', () => {
        const lPoly = { vertices: [
            { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
            { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
        ]};

        it('2a: center of rect {x:300, y:200} returns true', () => {
            expect(pointInPolygon(300, 200, testPoly)).toBe(true);
        });

        it('2b: point just outside rect {x:601, y:200} returns false', () => {
            expect(pointInPolygon(601, 200, testPoly)).toBe(false);
        });

        it('2c: point far outside {x:9999, y:9999} returns false', () => {
            expect(pointInPolygon(9999, 9999, testPoly)).toBe(false);
        });

        it('2d: point inside filled area of L-shaped poly {x:100, y:300} returns true', () => {
            expect(pointInPolygon(100, 300, lPoly)).toBe(true);
        });

        it('2e: point in notch of L (inside bbox but outside poly) {x:500, y:300} returns false', () => {
            expect(pointInPolygon(500, 300, lPoly)).toBe(false);
        });
    });

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
    });

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
    });
});