# Test Plan: polygon.js

Target file: `tests/polygon.test.js`
Module under test: `js/polygon.js`

## Existing Coverage

| Function | Tests |
|---|---|
| `createPolygonFromRect` | 1 (basic 600x400 rect) |
| `polygonArea` | 3 (600x400 rect, L-shape, degenerate) |
| `splitPolygon` | 2 (horizontal cut, vertical cut) |
| `getEdges` | 3 (edge coords, last-to-first wrap, triangle) |
| `boundingBox` | 3 (origin rect, offset rect, L-shape) |
| `edgeLength` | 3 (horizontal, vertical, last index) |
| `pointOnEdge` | 4 (t=0, t=full, t=mid, zero-length edge) |
| `pointInPolygon` | 5 (center, just outside, far outside, L inside, L notch) |
| `raycastToEdge` | 6 (down, up, right, left, distance, out-of-span null) |
| `edgeDirection` | 4 (all 4 edges of CW rect) |

## Functions to Test

### 1. `randomPointInPolygon(poly, padding)`
- **1a.** Returned point is inside the polygon (run several times)
- **1b.** With large padding on small poly, falls back to bbox center

### 2. `findEdgeAtPoint(poly, px, py)`
- **4a.** Point on top edge (horizontal) returns edge index 0
- **4b.** Point on right edge (vertical) returns edge index 1
- **4c.** Point on bottom edge returns edge index 2
- **4d.** Point on left edge returns edge index 3
- **4e.** Point at a vertex returns one of the adjacent edges
- **4f.** Point not on any edge returns -1

### 3. `nibblePolygon(poly, A, B, C)`
- **3a.** Nibble top-left corner: area reduced by corner rect area
- **3b.** Nibble bottom-right corner: correct area and vertex count
- **3c.** Result has no collinear vertices
- **3d.** A or C not on any edge: returns original polygon unchanged

### 4. `splitPolygon(poly, A, C)` (additional)
- **4a.** Equal-area split (midpoint cut) returns either half (area check only)
- **4b.** A and C on the same edge: returns original polygon unchanged
- **4c.** A or C not on any edge: returns original polygon unchanged
- **4d.** Split an L-shaped polygon and verify area of result

## Test Utilities

Use the shared `testPoly` (600x400 rect at origin) and/or `LShapedPoly` already defined in the test file. Create additional fixtures as needed
```

## Priority

1. **High:** `findEdgeAtPoint`, `nibblePolygon`, `splitPolygon` — core gameplay logic, most complex
