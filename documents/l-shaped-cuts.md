Plan: L-Shaped Cut with Rectilinear Polygon Play Area                                                                                                                              │
│                                                                                                                                                                                    │
│ Context                                                                                                                                                                            │
│                                                                                                                                                                                    │
│ The previous nibble mechanic (parallel-to-edge instant split) worked but kept the play area as a simple rectangle. The new design changes Phase 2: instead of an instant parallel  │
│ cut, the scissors turns 90° toward the closest boundary and continues cutting until it reaches that boundary. This creates an L-shaped cut that removes a rectangular corner,      │
│ turning the play area into a rectilinear polygon that grows geometrically complex with each cut.                                                                                   │
│                                                                                                                                                                                    │
│ User decisions:                                                                                                                                                                    │
│ - Turn direction: automatic toward closest polygon boundary                                                                                                                        │
│ - Geometry: full polygon — play area becomes an arbitrary rectilinear polygon                                                                                                      │
│ - Collision: full cut fails if ball touches any part of the L-shaped line (both segments)                                                                                          │
│                                                                                                                                                                                    │
│ Mechanic Design                                                                                                                                                                    │
│                                                                                                                                                                                    │
│ Two-Phase L-Cut:                                                                                                                                                                   │
│                                                                                                                                                                                    │
│ 1. Phase 1 (Inward Travel): Scissors moves perpendicular from edge into the polygon. Cut line (segment 1) extends behind it. Ball collision checked each frame against segment 1.  │
│ 2. Phase 2 (Turn & Travel): On second space/double-tap, scissors turns 90° toward closest polygon boundary and continues at same speed. Ball collision checked against both        │
│ segments. Cut succeeds when scissors reaches the boundary.                                                                                                                         │
│                                                                                                                                                                                    │
│ L-Cut Geometry Example:                                                                                                                                                            │
│                                                                                                                                                                                    │
│ Scissors at x=200 on top edge, cuts down 200px, turns left:                                                                                                                        │
│   A(200,40) → B(200,240) → C(40,240)                                                                                                                                               │
│                                                                                                                                                                                    │
│   Removes corner rectangle: (40,40)-(200,240)                                                                                                                                      │
│   Remaining: 6-vertex L-shape polygon                                                                                                                                              │
│                                                                                                                                                                                    │
│ Key Behaviors:                                                                                                                                                                     │
│                                                                                                                                                                                    │
│ - Phase 2 direction: raycast from turn point in both perpendicular directions, pick closer boundary                                                                                │
│ - If Phase 1 reaches opposite boundary without player action → auto-trigger Phase 2                                                                                                │
│ - After successful cut: scissors repositions to turn point B on a new edge                                                                                                         │
│ - Discarded piece: the rectangular corner between the L-cut path and polygon boundary                                                                                              │
│ - Preview line: shows predicted L-path during Phase 1                                                                                                                              │
│                                                                                                                                                                                    │
│ Architecture Change: Rectangle → Polygon                                                                                                                                           │
│                                                                                                                                                                                    │
│ The play area changes from { x, y, width, height } to { vertices: [{x,y}, ...] } (clockwise order, all edges axis-aligned).                                                        │
│                                                                                                                                                                                    │
│ Files to Create/Modify                                                                                                                                                             │
│                                                                                                                                                                                    │
│ 1. NEW js/polygon.js — Core polygon data structure                                                                                                                                 │
│                                                                                                                                                                                    │
│ All polygon operations in one module:                                                                                                                                              │
│                                                                                                                                                                                    │
│ ┌────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┐                                                                                                                                                                               │
│ │              Function              │                                                                    Purpose                                                                  │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ createPolygonFromRect(rect)        │ Convert {x,y,w,h} to {vertices:[...]} (4 vertices CW)                                                                                       │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ getEdges(poly)                     │ Returns [{x1,y1,x2,y2}, ...] from consecutive vertex pairs                                                                                  │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ polygonArea(poly)                  │ Shoelace formula                                                                                                                            │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ pointInPolygon(px, py, poly)       │ Ray-casting (horizontal ray, count vertical edge crossings)                                                                                 │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ boundingBox(poly)                  │ {x,y,width,height} from min/max vertices                                                                                                    │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ randomPointInPolygon(poly,         │ Rejection sampling in bbox, accept if inside + padding from edges                                                                           │
│    │                                                                                                                                                                               │
│ │ padding)                           │                                                                                                                                             │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ raycastToEdge(px, py, direction,   │ Distance to nearest polygon edge in given direction ('up'/'down'/'left'/'right'). Scan axis-aligned edges. Used for Phase 2 direction.      │
│    │                                                                                                                                                                               │
│ │ poly)                              │                                                                                                                                             │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ nibblePolygon(poly, A, B, C)       │ Critical operation. Remove rectangular corner defined by L-cut A→B→C. Algorithm: find edges containing A and C, replace the "short arc" of  │
│    │                                                                                                                                                                               │
│ │                                    │ vertices between them with A→B→C, clean up collinear vertices.                                                                              │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ findEdgeAtPoint(poly, px, py)      │ Returns edge index containing the point                                                                                                     │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ edgeLength(poly, i)                │ Length of edge i                                                                                                                            │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ edgeDirection(poly, i)             │ Returns inward-perpendicular direction for edge i (CW winding)                                                                              │
│    │                                                                                                                                                                               │
│ ├────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┤                                                                                                                                                                               │
│ │ pointOnEdge(poly, edgeIndex, t)    │ Returns {x,y} at distance t along edge                                                                                                      │
│    │                                                                                                                                                                               │
│ └────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ───┘                                                                                                                                                                               │
│                                                                                                                                                                                    │
│ Nibble algorithm detail:                                                                                                                                                           │
│ 1. Find edgeA containing point A, edgeC containing point C                                                                                                                         │
│ 2. Insert A and C as vertices (splitting their respective edges)                                                                                                                   │
│ 3. Walk CW from C to A — these are the "nibbled" vertices (the short arc through the corner)                                                                                       │
│ 4. Replace that arc with C → B → A (two new edges)                                                                                                                                 │
│ 5. Remove any collinear vertices (3 consecutive vertices on same line)                                                                                                             │
│                                                                                                                                                                                    │
│ 2. js/scissors.js — Polygon-based movement + L-cut state                                                                                                                           │
│                                                                                                                                                                                    │
│ New scissors state:                                                                                                                                                                │
│ {                                                                                                                                                                                  │
│   edgeIndex: 0,           // polygon edge index                                                                                                                                    │
│   pos: 0,                 // distance along edge from start vertex                                                                                                                 │
│   cutting: false,                                                                                                                                                                  │
│   cutPhase: 0,            // 0=none, 1=inward, 2=turning                                                                                                                           │
│   cutStart: null,         // {x,y} point A on boundary                                                                                                                             │
│   cutCurrent: null,       // {x,y} moving tip                                                                                                                                      │
│   cutTurn: null,          // {x,y} point B (set at Phase 2 start)                                                                                                                  │
│   cutTarget: null,        // {x,y} point C on boundary (computed at Phase 2 start)                                                                                                 │
│   cutDirection: null,     // 'up'|'down'|'left'|'right' — Phase 1 direction                                                                                                        │
│   cutTurnDirection: null, // 'up'|'down'|'left'|'right' — Phase 2 direction                                                                                                        │
│ }                                                                                                                                                                                  │
│                                                                                                                                                                                    │
│ Key changes:                                                                                                                                                                       │
│ - createScissors(poly) — init with edgeIndex: 0, pos: edgeLength/2                                                                                                                 │
│ - updateScissorsMovement(scissors, poly, dt, config) — keyboard movement using edge axis/sign instead of hardcoded edge names. Corner wrapping via edgeIndex ± 1 mod n.            │
│ - updateScissorsMovementTouch(scissors, poly, config, dx, dy) — same perimeter logic, edge direction sign from polygon                                                             │
│ - initiateCut(scissors, poly) — set cutPhase=1, compute cutDirection from edgeDirection(poly, edgeIndex)                                                                           │
│ - updateScissorsCut(scissors, poly, dt, config) — Phase 1: move in cutDirection. Phase 2: move in cutTurnDirection toward cutTarget.                                               │
│ - NEW triggerPhase2(scissors, poly) — record cutTurn, raycast both perpendicular directions, pick closer, set cutTarget                                                            │
│ - checkCutComplete(scissors) — Phase 2 only: check if cutCurrent reached cutTarget                                                                                                 │
│ - isAtCorner(scissors, poly) — pos <= 0 || pos >= edgeLength                                                                                                                       │
│ - getScissorsScreenPosition(scissors, poly) — compute from vertex + pos along edge                                                                                                 │
│ - repositionScissorsAfterCut(scissors, poly) — place at turn point B on new edge                                                                                                   │
│ - getPreviewLine(scissors, poly) — during Phase 1: predicted L-path; during Phase 2: actual L from A→B→target                                                                      │
│                                                                                                                                                                                    │
│ Movement helpers:                                                                                                                                                                  │
│ edgeMovementAxis(poly, edgeIndex)  // returns {axis:'x'|'y', sign:+1|-1}                                                                                                           │
│                                                                                                                                                                                    │
│ 3. js/ball.js — Polygon edge bouncing                                                                                                                                              │
│                                                                                                                                                                                    │
│ - createBall(poly, config) — use randomPointInPolygon(poly, padding)                                                                                                               │
│ - updateBall(ball, poly, dt) — iterate all polygon edges:                                                                                                                          │
│   - Horizontal edge: check ball.y ± radius vs edge.y, within edge x-range                                                                                                          │
│   - Vertical edge: check ball.x ± radius vs edge.x, within edge y-range                                                                                                            │
│   - Use CW winding normal to determine "inside" direction for bounce                                                                                                               │
│ - isBallInPolygon(ball, poly) — use pointInPolygon(ball.x, ball.y, poly)                                                                                                           │
│                                                                                                                                                                                    │
│ 4. js/collision.js — L-shaped cut line collision                                                                                                                                   │
│                                                                                                                                                                                    │
│ - Rename ballIntersectsCutLine → ballIntersectsLCut(ball, scissors)                                                                                                                │
│ - Check two segments: cutStart→cutTurn (or cutCurrent if Phase 1) + cutTurn→cutCurrent (Phase 2 only)                                                                              │
│ - pointToSegmentDistance unchanged                                                                                                                                                 │
│                                                                                                                                                                                    │
│ 5. js/renderer.js — Polygon rendering                                                                                                                                              │
│                                                                                                                                                                                    │
│ - Replace drawRectangle(ctx, rect) → drawPolygon(ctx, poly) — ctx.beginPath(), moveTo/lineTo through vertices, closePath, fill+stroke                                              │
│ - drawCutLine(ctx, scissors) — draw L-shape: cutStart→cutTurn→cutCurrent (two segments if Phase 2)                                                                                 │
│ - drawPreviewLine(ctx, scissors, poly) — faint L-shaped preview                                                                                                                    │
│ - drawScissors(ctx, scissors, poly) — triangle direction from edgeDirection instead of switch on edge name                                                                         │
│ - Import getPreviewLine and getScissorsScreenPosition from scissors.js (already done), edgeDirection from polygon.js                                                               │
│                                                                                                                                                                                    │
│ 6. js/main.js — Wire polygon + two-phase flow                                                                                                                                      │
│                                                                                                                                                                                    │
│ - Replace let rect → let poly, init via createPolygonFromRect(createInitialRectangle(...))                                                                                         │
│ - All function calls: pass poly instead of rect                                                                                                                                    │
│ - CUTTING state logic:                                                                                                                                                             │
│ Phase 1: updateScissorsCut → check collision →                                                                                                                                     │
│   if (space/tap && canComplete) → triggerPhase2                                                                                                                                    │
│   if (reached opposite boundary) → auto-triggerPhase2                                                                                                                              │
│ Phase 2: updateScissorsCut → check collision →                                                                                                                                     │
│   if (checkCutComplete) → completeCut                                                                                                                                              │
│ - completeCut(): call nibblePolygon(poly, A, B, C), use polygonArea for score                                                                                                      │
│ - checkCutCollision(): use ballIntersectsLCut                                                                                                                                      │
│ - Double-tap: Phase 1 → trigger Phase 2 on second tap; initiate cut on first tap from RUNNING                                                                                      │
│ - Score: polygonArea(poly) / gameState.originalArea * 100                                                                                                                          │
│                                                                                                                                                                                    │
│ 7. js/rectangle.js — Slim down                                                                                                                                                     │
│                                                                                                                                                                                    │
│ - Keep createInitialRectangle (centering + originalArea)                                                                                                                           │
│ - Remove splitRectangle                                                                                                                                                            │
│                                                                                                                                                                                    │
│ 8. js/config.js — Already has minCutDepth: 20 (no changes needed)                                                                                                                  │
│                                                                                                                                                                                    │
│ Implementation Order                                                                                                                                                               │
│                                                                                                                                                                                    │
│ 1. js/polygon.js — new module, no deps on existing code                                                                                                                            │
│ 2. js/scissors.js — refactor to polygon-based position + L-cut state machine                                                                                                       │
│ 3. js/ball.js — polygon edge bouncing                                                                                                                                              │
│ 4. js/collision.js — L-shaped cut collision                                                                                                                                        │
│ 5. js/renderer.js — polygon drawing + L-cut rendering                                                                                                                              │
│ 6. js/main.js — integrate everything                                                                                                                                               │
│ 7. js/rectangle.js — cleanup                                                                                                                                                       │
│                                                                                                                                                                                    │
│ Verification                                                                                                                                                                       │
│                                                                                                                                                                                    │
│ 1. Open index.html in browser, press Start                                                                                                                                         │
│ 2. Initial state: rectangle renders as polygon (visually identical to before)                                                                                                      │
│ 3. Phase 1: Space to start cut → scissors moves inward, red dashed line extends, preview shows predicted L-path                                                                    │
│ 4. Phase 2: Space again → scissors turns 90° toward closest edge, continues cutting, both segments visible                                                                         │
│ 5. Cut completes: scissors reaches boundary → corner removed, polygon becomes L-shape, new ball spawns, score updates                                                              │
│ 6. Scissors on L-shape: verify scissors moves correctly along all 6 edges of L-shaped polygon, wraps around corners                                                                │
│ 7. Balls bounce: verify balls bounce off all edges of the L-shape correctly, including the inner edges                                                                             │
│ 8. Multiple cuts: make 3-4 cuts, verify polygon grows more complex, area shrinks, score approaches win threshold                                                                   │
│ 9. Cut failure: start a cut, let ball hit the L-shaped cut line → verify entire cut fails                                                                                          │
│ 10. Mobile: double-tap to start (Phase 1), double-tap to turn (Phase 2), auto-completes when reaching boundary                                                                     │
│ 11. Auto Phase 2: let Phase 1 reach opposite boundary without pressing space → verify it auto-triggers Phase 2                                                                     │
│ 12. Win condition: cut enough area to drop below threshold → WIN screen 