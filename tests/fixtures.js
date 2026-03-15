import { createPolygonFromRect } from '../js/polygon.js';

export const testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 });

export const LShapedPoly = { vertices: [
    { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 200 },
    { x: 300, y: 200 }, { x: 300, y: 400 }, { x: 0, y: 400 }
]};
