import { describe, it, expect } from 'vitest';
import { testPoly, LShapedPoly } from '../fixtures.js';
import { updateBall } from '../../js/ball.js';

// testPoly: 600x400 CW rectangle (0,0)-(600,0)-(600,400)-(0,400)
// Top edge y=0 (insideBelow=true), Bottom edge y=400 (insideBelow=false)
// Left edge x=0 (insideRight=true), Right edge x=600 (insideRight=false)

// Helper to create a simple ball object
function makeBall(x, y, vx, vy, radius = 10) {
    return { x, y, vx, vy, radius };
}

describe('updateBall — dt / movement', () => {
    it('8: dt=0 → no movement — x, y unchanged', () => {
        const ball = makeBall(300, 200, 100, 150);
        updateBall(ball, testPoly, 0);
        expect(ball.x).toBe(300);
        expect(ball.y).toBe(200);
    });

    it('9: movement scales with dt — travels vx*dt and vy*dt when far from walls', () => {
        // Place ball well away from all edges (center of 600x400 poly)
        const ball = makeBall(300, 200, 50, 75, 10);
        const dt = 0.1;
        updateBall(ball, testPoly, dt);
        expect(ball.x).toBeCloseTo(300 + 50 * dt, 5);
        expect(ball.y).toBeCloseTo(200 + 75 * dt, 5);
    });
});

describe('updateBall — horizontal edge collisions', () => {
    it('10: top edge — ball too high (insideBelow=true) — clamped and vy set positive', () => {
        // Top edge y=0, insideBelow=true → limit = 0 + radius = 10
        // Ball at y=5 (< limit=10) should be clamped to y=10 and vy=|vy|
        const ball = makeBall(300, 5, 0, -50, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.y).toBe(10);
        expect(ball.vy).toBeGreaterThan(0);
    });

    it('11: top edge — ball already inside — not disturbed', () => {
        // Ball at y=100, well below top edge y=0, should not be affected
        const ball = makeBall(300, 100, 0, -50, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.y).toBe(100);
        expect(ball.vy).toBe(-50);
    });

    it('12: bottom edge — ball too low (insideBelow=false) — clamped and vy set negative', () => {
        // Bottom edge y=400, insideBelow=false → limit = 400 - radius = 390
        // Ball at y=395 (> limit=390) should be clamped to y=390 and vy=-|vy|
        const ball = makeBall(300, 395, 0, 50, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.y).toBe(390);
        expect(ball.vy).toBeLessThan(0);
    });

    it('13: bottom edge — ball already inside — not disturbed', () => {
        // Ball at y=300, well above bottom edge y=400
        const ball = makeBall(300, 300, 0, 50, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.y).toBe(300);
        expect(ball.vy).toBe(50);
    });

    it('14: horizontal edge — ball outside x range — not corrected even if y violates limit', () => {
        // Top edge goes from x=0 to x=600; ball at x=700 is outside that range
        // Ball y=5 would normally trigger top-edge correction, but x is out of range
        const ball = makeBall(700, 5, 0, -50, 10);
        const originalY = ball.y;
        const originalVy = ball.vy;
        updateBall(ball, testPoly, 0);
        // x=700 is outside testPoly edges, so no horizontal edge applies
        expect(ball.y).toBe(originalY);
        expect(ball.vy).toBe(originalVy);
    });
});

describe('updateBall — vertical edge collisions', () => {
    it('15: left edge — ball too far left (insideRight=true) — clamped and vx set positive', () => {
        // Left edge x=0, insideRight=true → limit = 0 + radius = 10
        // Ball at x=5 (< limit=10) should be clamped to x=10 and vx=|vx|
        const ball = makeBall(5, 200, -50, 0, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.x).toBe(10);
        expect(ball.vx).toBeGreaterThan(0);
    });

    it('16: left edge — ball already inside — not disturbed', () => {
        // Ball at x=100, well to the right of left edge x=0
        const ball = makeBall(100, 200, -50, 0, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.x).toBe(100);
        expect(ball.vx).toBe(-50);
    });

    it('17: right edge — ball too far right (insideRight=false) — clamped and vx set negative', () => {
        // Right edge x=600, insideRight=false → limit = 600 - radius = 590
        // Ball at x=595 (> limit=590) should be clamped to x=590 and vx=-|vx|
        const ball = makeBall(595, 200, 50, 0, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.x).toBe(590);
        expect(ball.vx).toBeLessThan(0);
    });

    it('18: right edge — ball already inside — not disturbed', () => {
        // Ball at x=400, well to the left of right edge x=600
        const ball = makeBall(400, 200, 50, 0, 10);
        updateBall(ball, testPoly, 0);
        expect(ball.x).toBe(400);
        expect(ball.vx).toBe(50);
    });

    it('19: vertical edge — ball outside y range — not corrected even if x violates limit', () => {
        // LShapedPoly has a vertical edge at x=300 spanning y=200 to y=400.
        // Ball at y=100 is outside that edge's y range [200,400].
        // Ball at x=295 would violate the x=300 edge limit (300+radius=310 > 295),
        // but since y=100 is outside [200,400], that edge should NOT correct it.
        // We use a small polygon that only has one relevant vertical edge.
        const partialPoly = {
            vertices: [
                { x: 0, y: 0 },
                { x: 600, y: 0 },
                { x: 600, y: 400 },
                { x: 300, y: 400 },
                { x: 300, y: 200 },
                { x: 0, y: 200 }
            ]
        };
        // The vertical edge at x=300 goes from (300,400) to (300,200), covering y=[200,400].
        // Ball at y=100 is outside that range. x=295 would normally hit limit=310 for insideRight=true.
        // But y=100 is outside [200,400], so no correction should happen from that edge.
        // Note: left edge x=0 covers y=[0,200]; ball.y=100 is in that range, but ball.x=295 >> 0+10=10, so no correction.
        const ball = makeBall(295, 100, -50, 0, 10);
        const originalX = ball.x;
        const originalVx = ball.vx;
        updateBall(ball, partialPoly, 0);
        expect(ball.x).toBe(originalX);
        expect(ball.vx).toBe(originalVx);
    });
});

describe('updateBall — velocity direction after bounce', () => {
    it('20: horizontal bounce preserves |vy| — Math.abs(ball.vy) unchanged after top bounce', () => {
        const ball = makeBall(300, 5, 30, -80, 10);
        const absVyBefore = Math.abs(ball.vy);
        updateBall(ball, testPoly, 0);
        expect(Math.abs(ball.vy)).toBeCloseTo(absVyBefore, 10);
    });

    it('21: vertical bounce preserves |vx| — Math.abs(ball.vx) unchanged after left bounce', () => {
        const ball = makeBall(5, 200, -60, 40, 10);
        const absVxBefore = Math.abs(ball.vx);
        updateBall(ball, testPoly, 0);
        expect(Math.abs(ball.vx)).toBeCloseTo(absVxBefore, 10);
    });

    it('22: vx unchanged during horizontal bounce — only vy is affected', () => {
        const ball = makeBall(300, 5, 30, -80, 10);
        const vxBefore = ball.vx;
        updateBall(ball, testPoly, 0);
        expect(ball.vx).toBe(vxBefore);
    });

    it('23: vy unchanged during vertical bounce — only vx is affected', () => {
        const ball = makeBall(5, 200, -60, 40, 10);
        const vyBefore = ball.vy;
        updateBall(ball, testPoly, 0);
        expect(ball.vy).toBe(vyBefore);
    });
});

describe('updateBall — corner / tolerance cases', () => {
    it('24: ball exactly at radius distance from edge — no correction applied', () => {
        // Top edge y=0, limit = 0 + radius = 10; ball.y === 10 should NOT trigger clamp
        const ball = makeBall(300, 10, 0, -50, 10);
        const originalY = ball.y;
        const originalVy = ball.vy;
        updateBall(ball, testPoly, 0);
        // y == limit means ball.y < limit is false (strict less-than), so no clamp
        expect(ball.y).toBe(originalY);
        expect(ball.vy).toBe(originalVy);
    });

    it('25: near-axis-aligned edge (within EDGE_TOL=1) treated as horizontal', () => {
        // Create a custom polygon with a nearly-horizontal top edge (y1=0, y2=0.5)
        // Rectangle: (0,0)-(600,0.5)-(600,400)-(0,400) — top edge is nearly horizontal
        const nearHorizPoly = {
            vertices: [
                { x: 0, y: 0 },
                { x: 600, y: 0.5 },
                { x: 600, y: 400 },
                { x: 0, y: 400 }
            ]
        };
        // Top edge: from (0,0) to (600,0.5), |y1-y2|=0.5 < EDGE_TOL=1 → treated as horizontal
        // insideBelow should be true (CW winding), edgeY = (0+0.5)/2 = 0.25
        // limit = 0.25 + radius(10) = 10.25
        // Ball at y=5 (< 10.25) should be clamped
        const ball = makeBall(300, 5, 0, -50, 10);
        updateBall(ball, nearHorizPoly, 0);
        expect(ball.y).toBeCloseTo(10.25, 5);
        expect(ball.vy).toBeGreaterThan(0);
    });
});
