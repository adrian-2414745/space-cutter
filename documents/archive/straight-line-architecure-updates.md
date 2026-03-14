# Architecture Updates — Straight Cut

## Overview

Straight cuts are a new cut type triggered when Phase 1 of a cut reaches the opposite polygon boundary without player intervention. Rather than auto-pivoting into an L-shaped Phase 2, the cut travels straight through and splits the polygon in two. The player keeps the larger half.

## Cut Flow Comparison

| | L-cut | Straight cut |
|---|---|---|
| **Trigger** | Player presses Space / double-tap | Phase 1 reaches opposite boundary automatically |
| **Path** | A → B (perpendicular inward) → C (90° turn to nearest edge) | A → C (straight through) |
| **Polygon op** | `nibblePolygon(poly, A, B, C)` — removes a rectangular corner | `splitPolygon(poly, A, C)` — bisects polygon |
| **Result** | Original polygon minus the nibbled corner | Larger of the two resulting halves |
| **Scissors** | Repositioned to B (the turn point) | Repositioned to C (the exit point) |

## New / Modified Functions

### `js/polygon.js`

#### `insertSplitPoints(verts, edgeAIdx, edgeCIdx, A, C)` — private helper
Inserts points A and C into the vertex array at their respective edge positions, returning an augmented array. Handles:
- Normal case: inserts in reverse index order to avoid index shifting
- Same-edge case: inserts farther point first so closer point ends up at lower index
- Vertex-coincidence check: skips insertion if point already matches an edge endpoint

Previously this logic was inline in `nibblePolygon`. Now shared by both `nibblePolygon` and `splitPolygon`.

#### `splitPolygon(poly, A, C)` — new export
Splits the polygon with a straight line from A to C.

**Algorithm:**
1. Find edge indices for A and C via `findEdgeAtPoint`
2. Guard: return `poly` unchanged if either is -1 or both are on the same edge
3. Call `insertSplitPoints` to get augmented vertex list
4. Find indices of A and C in augmented list
5. Walk CW from A to C → sub-polygon 1 (closed by implicit edge C→A)
6. Walk CW from C to A → sub-polygon 2 (closed by implicit edge A→C)
7. `removeCollinear` on both
8. Compare areas with `polygonArea`; return larger. If equal within 1 sq px, pick randomly.

**Arguments:**
- `poly` — current polygon
- `A` — cut start point (on original boundary edge, where scissors began cutting)
- `C` — cut exit point (on opposite boundary edge, from raycast)

### `js/scissors.js`

#### `repositionScissorsAfterCut(scissors, poly, targetPoint?)` — modified
Added optional third argument `targetPoint`. When provided, scissors is placed at that point on the new polygon. When omitted, falls back to `scissors.cutTurn` (existing L-cut behaviour — no change to callers that don't pass it).

### `js/main.js`

#### `completeStraightCut()` — new
Mirrors `completeCut()` for the straight-cut path:
1. Raycasts from `scissors.cutStart` (not `cutCurrent`) in `scissors.cutDirection` to get the exact boundary exit point
2. Calls `splitPolygon`
3. Calls `repositionScissorsAfterCut` with the exit point as `targetPoint`
4. Filters balls, spawns one new ball, updates score, checks win condition

Using `cutStart` for the raycast ensures the exit point is the exact perpendicular intersection on the opposite edge, regardless of any sub-pixel drift in `cutCurrent`.

#### Phase 1 boundary detection — modified
Previously: `nearBoundary || playerTriggered` both called `triggerPhase2`.

Now:
```
if (playerTriggered)  → triggerPhase2   (L-cut)
else if (nearBoundary) → completeStraightCut  (straight cut)
```

Player intent is checked first so that a late Space press still produces an L-cut even if the scissors happen to be near the boundary.

## Data Flow — Straight Cut

```
Phase 1 moving...
  cutCurrent approaches opposite boundary
  nearBoundary = true (raycast distance < 2)
  → completeStraightCut()
      exitPoint = raycastToEdge(cutStart, cutDirection, poly).point
      newPoly   = splitPolygon(poly, cutStart, exitPoint)
      repositionScissorsAfterCut(scissors, newPoly, exitPoint)
      poly = newPoly
      filter balls to those inside newPoly
      spawn 1 new ball
      update score / check win
      setState(RUNNING)
```

## Edge Cases

- **`edgeAIdx === edgeCIdx`**: Cut starts and exits on same edge (degenerate — can't split). `splitPolygon` returns `poly` unchanged.
- **Exit point not found by raycast**: Falls back to `scissors.cutCurrent` as the exit point.
- **Equal-area split**: Random selection (50/50) so neither half is always favoured.
- **Balls in discarded half**: Filtered out by `isBallInPolygon` after split, same as L-cuts.
- **Collinear vertices**: Both sub-polygons are cleaned with `removeCollinear` to maintain the invariant that no three consecutive vertices are collinear.
