import { describe, it, expect } from 'vitest';
import { createPolygonFromRect, splitPolygon, polygonArea, boundingBox, getEdges, edgeLength, pointOnEdge, pointInPolygon, raycastToEdge, edgeDirection, findEdgeAtPoint, nibblePolygon } from '../js/polygon.js';


const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

const LShapedPoly = { vertices: [
        { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
        { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
    ]};

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

        it('1a: L-shaped polygon (6 CW vertices) returns 180000', () => {
            expect(polygonArea(LShapedPoly)).toEqual(180000);
        });

        it('1b: single-vertex degenerate polygon returns 0', () => {
            const singlePoly = { vertices: [{ x: 100, y: 200 }] };
            expect(polygonArea(singlePoly)).toEqual(0);
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

        it('L-poly: horizontal cut along reflex edge keeps upper rectangle (area=120000, 4 vertices)', () => {
            // Cut from A={0,200} on left edge to C={600,200} on right edge.
            // Splits into upper rect (600x200=120000) and lower-left rect (300x200=60000).
            // Upper rect is larger and is returned.
            const A = { x: 0, y: 200 };
            const C = { x: 600, y: 200 };

            const result = splitPolygon(LShapedPoly, A, C);

            expect(polygonArea(result)).toEqual(120000);
            expect(result.vertices).toHaveLength(4);
            expect(result.vertices[0]).toEqual({ x: 0, y: 200 });
            expect(result.vertices[1]).toEqual({ x: 0, y: 0 });
            expect(result.vertices[2]).toEqual({ x: 600, y: 0 });
            expect(result.vertices[3]).toEqual({ x: 600, y: 200 });
        });

        it('L-poly: vertical cut at x=300 keeps left rectangle (area=120000, 4 vertices)', () => {
            // Cut from A={300,0} on top edge to C={300,400} on notch vertical edge end.
            // Splits into right rect (300x200=60000) and left rect (300x400=120000).
            // Left rect is larger and is returned.
            const A = { x: 300, y: 0 };
            const C = { x: 300, y: 400 };

            const result = splitPolygon(LShapedPoly, A, C);

            expect(polygonArea(result)).toEqual(120000);
            expect(result.vertices).toHaveLength(4);
            expect(result.vertices[0]).toEqual({ x: 300, y: 400 });
            expect(result.vertices[1]).toEqual({ x: 0, y: 400 });
            expect(result.vertices[2]).toEqual({ x: 0, y: 0 });
            expect(result.vertices[3]).toEqual({ x: 300, y: 0 });
        });
    });

    describe('splitPolygon (additional)', () => {
        it('4a: equal-area horizontal cut of testPoly at y=200 returns a polygon with area 120000', () => {
            // Each half = 120000; when areas are equal (within 1) either half may be returned.
            const A = { x: 0, y: 200 };
            const C = { x: 600, y: 200 };

            const result = splitPolygon(testPoly, A, C);

            expect(polygonArea(result)).toEqual(120000);
        });

        it('4b: A and C on same edge returns original polygon unchanged', () => {
            // Both on top edge — same-edge cut is a no-op.
            const A = { x: 100, y: 0 };
            const C = { x: 400, y: 0 };

            const result = splitPolygon(testPoly, A, C);

            expect(result).toBe(testPoly);
        });

        it('4c: A not on any edge (interior point) returns original polygon unchanged', () => {
            // A is interior, C is on right edge — invalid split.
            const A = { x: 300, y: 200 };
            const C = { x: 600, y: 200 };

            const result = splitPolygon(testPoly, A, C);

            expect(result).toBe(testPoly);
        });

        it('4d: horizontal cut of L-shaped poly at y=100 returns lower L-strip with area 120000 and 6 vertices', () => {
            // A={0,100} on left edge (edge 5: {0,400}→{0,0}), C={600,100} on right edge (edge 1: {600,0}→{600,200}).
            // Upper part: 600×100 = 60000.
            // Lower part: L-shape minus top strip = 180000 − 60000 = 120000 → returned as larger half.
            const A = { x: 0, y: 100 };
            const C = { x: 600, y: 100 };

            const result = splitPolygon(LShapedPoly, A, C);

            expect(polygonArea(result)).toEqual(120000);
            expect(result.vertices).toHaveLength(6);
        });
    });

    describe('nibblePolygon', () => {
        it('3a: nibble top-left corner of testPoly: area reduces by 10000 and result has 6 vertices', () => {
            // A on top edge, B is the turn point, C on left edge
            // Nibbles a 100x100 corner from TL
            const A = { x: 100, y: 0 };
            const B = { x: 100, y: 100 };
            const C = { x: 0, y: 100 };

            const result = nibblePolygon(testPoly, A, B, C);

            expect(polygonArea(result)).toEqual(230000); // 240000 - 10000
            expect(result.vertices).toHaveLength(6);
        });

        it('3b: nibble bottom-right corner of testPoly: area reduces by 10000 and result has 6 vertices', () => {
            // A on bottom edge, B is the turn point, C on right edge
            // Nibbles a 100x100 corner from BR
            const A = { x: 500, y: 400 };
            const B = { x: 500, y: 300 };
            const C = { x: 600, y: 300 };

            const result = nibblePolygon(testPoly, A, B, C);

            expect(polygonArea(result)).toEqual(230000); // 240000 - 10000
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
            // A is an interior point, not on any edge
            const A = { x: 300, y: 200 };
            const B = { x: 100, y: 100 };
            const C = { x: 0, y: 100 };

            const result = nibblePolygon(testPoly, A, B, C);

            expect(result).toBe(testPoly); // same reference — unchanged
        });
    });
});