import { describe, it, expect } from 'vitest';
import { getScissorsScreenPosition } from '../../js/scissors.js';
import { testPoly } from '../fixtures.js';

// testPoly is a 600x400 rectangle with vertices:
//   [0] (0,0)   [1] (600,0)   [2] (600,400)   [3] (0,400)
// Edges:
//   Edge 0: top    (0,0)→(600,0),   length=600
//   Edge 1: right  (600,0)→(600,400), length=400
//   Edge 2: bottom (600,400)→(0,400), length=600
//   Edge 3: left   (0,400)→(0,0),   length=400

describe('getScissorsScreenPosition', () => {
    it('1: edge 0, pos=0 — returns (0,0)', () => {
        const scissors = { edgeIndex: 0, pos: 0 };
        const result = getScissorsScreenPosition(scissors, testPoly);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(0);
    });

    it('2: edge 0, pos=600 — returns (600,0)', () => {
        const scissors = { edgeIndex: 0, pos: 600 };
        const result = getScissorsScreenPosition(scissors, testPoly);
        expect(result.x).toBeCloseTo(600);
        expect(result.y).toBeCloseTo(0);
    });

    it('3: edge 0, pos=300 — returns (300,0)', () => {
        const scissors = { edgeIndex: 0, pos: 300 };
        const result = getScissorsScreenPosition(scissors, testPoly);
        expect(result.x).toBeCloseTo(300);
        expect(result.y).toBeCloseTo(0);
    });

    it('4: edge 1, pos=200 — returns (600,200)', () => {
        const scissors = { edgeIndex: 1, pos: 200 };
        const result = getScissorsScreenPosition(scissors, testPoly);
        expect(result.x).toBeCloseTo(600);
        expect(result.y).toBeCloseTo(200);
    });

    it('5: edge 2, pos=100 — returns (500,400)', () => {
        // Bottom edge goes (600,400)→(0,400); 100 units from (600,400) is (500,400)
        const scissors = { edgeIndex: 2, pos: 100 };
        const result = getScissorsScreenPosition(scissors, testPoly);
        expect(result.x).toBeCloseTo(500);
        expect(result.y).toBeCloseTo(400);
    });

    it('6: edge 3, pos=100 — returns (0,300)', () => {
        // Left edge goes (0,400)→(0,0); 100 units from (0,400) is (0,300)
        const scissors = { edgeIndex: 3, pos: 100 };
        const result = getScissorsScreenPosition(scissors, testPoly);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(300);
    });
});
