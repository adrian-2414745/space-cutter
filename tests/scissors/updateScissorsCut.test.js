import { describe, it, expect } from 'vitest';
import { updateScissorsCut } from '../../js/scissors.js';

const config = { scissorsCutSpeed: 150 };

function makeScissors(overrides = {}) {
    return {
        cutting: true,
        cutPhase: 1,
        cutDirection: 'down',
        cutTurnDirection: null,
        cutCurrent: { x: 300, y: 0 },
        cutStart: { x: 300, y: 0 },
        cutTurn: null,
        cutTarget: null,
        ...overrides,
    };
}

describe('updateScissorsCut — phase 1', () => {
    it('1: phase 1, moves cutCurrent in "down" direction — y increases by speed*dt (150*0.1=15)', () => {
        const scissors = makeScissors({ cutPhase: 1, cutDirection: 'down', cutCurrent: { x: 300, y: 0 } });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.y).toBeCloseTo(15, 10);
        expect(scissors.cutCurrent.x).toBeCloseTo(300, 10);
    });

    it('2: phase 1, "up" direction decreases y — y goes from 200 to 185', () => {
        const scissors = makeScissors({ cutPhase: 1, cutDirection: 'up', cutCurrent: { x: 300, y: 200 } });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.y).toBeCloseTo(185, 10);
        expect(scissors.cutCurrent.x).toBeCloseTo(300, 10);
    });

    it('3: phase 1, "right" direction increases x — x goes from 100 to 115', () => {
        const scissors = makeScissors({ cutPhase: 1, cutDirection: 'right', cutCurrent: { x: 100, y: 200 } });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.x).toBeCloseTo(115, 10);
        expect(scissors.cutCurrent.y).toBeCloseTo(200, 10);
    });

    it('4: phase 1, "left" direction decreases x — x goes from 300 to 285', () => {
        const scissors = makeScissors({ cutPhase: 1, cutDirection: 'left', cutCurrent: { x: 300, y: 200 } });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.x).toBeCloseTo(285, 10);
        expect(scissors.cutCurrent.y).toBeCloseTo(200, 10);
    });

    it('5: phase 1, dt=0 produces no movement — cutCurrent unchanged', () => {
        const scissors = makeScissors({ cutPhase: 1, cutDirection: 'down', cutCurrent: { x: 300, y: 100 } });
        updateScissorsCut(scissors, null, 0, config);
        expect(scissors.cutCurrent.x).toBe(300);
        expect(scissors.cutCurrent.y).toBe(100);
    });
});

describe('updateScissorsCut — phase 2', () => {
    it('6: phase 2, moves toward target in turnDirection — x increases by 15', () => {
        const scissors = makeScissors({
            cutPhase: 2,
            cutTurnDirection: 'right',
            cutCurrent: { x: 100, y: 200 },
            cutTarget: { x: 300, y: 200 },
        });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.x).toBeCloseTo(115, 10);
        expect(scissors.cutCurrent.y).toBeCloseTo(200, 10);
    });

    it('7: phase 2, clamps to target when remaining <= speed (remaining=5, speed=15)', () => {
        const scissors = makeScissors({
            cutPhase: 2,
            cutTurnDirection: 'right',
            cutCurrent: { x: 295, y: 200 },
            cutTarget: { x: 300, y: 200 },
        });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.x).toBe(300);
        expect(scissors.cutCurrent.y).toBe(200);
    });

    it('8: phase 2, does not overshoot target — cutCurrent matches cutTarget exactly after clamp', () => {
        const scissors = makeScissors({
            cutPhase: 2,
            cutTurnDirection: 'right',
            cutCurrent: { x: 295, y: 200 },
            cutTarget: { x: 300, y: 200 },
        });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.x).toBe(scissors.cutTarget.x);
        expect(scissors.cutCurrent.y).toBe(scissors.cutTarget.y);
    });
});

describe('updateScissorsCut — phase 0', () => {
    it('9: phase 0, no movement occurs — cutCurrent unchanged', () => {
        const scissors = makeScissors({
            cutPhase: 0,
            cutDirection: 'down',
            cutCurrent: { x: 300, y: 100 },
        });
        updateScissorsCut(scissors, null, 0.1, config);
        expect(scissors.cutCurrent.x).toBe(300);
        expect(scissors.cutCurrent.y).toBe(100);
    });
});
