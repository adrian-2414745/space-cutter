# Test Plan: game.js

All four exported functions from `js/game.js` are covered below.

## Shared Fixtures

```js
import { testPoly } from '../fixtures.js';
// testPoly = createPolygonFromRect({ x: 0, y: 0, width: 600, height: 400 })
// area = 240000

const originalArea = 240000;

const baseConfig = {
  ballRadius: 10,
  ballSpeed: 200,
  ballDensityPx2: 30000,   // 1 ball per 30 000 px² → target = 8 balls on full testPoly
  densityRampK: 2,
  minBalls: 1,
  winThreshold: 15,        // score < 15 → won
};

function makeBall(x, y, radius = 10) {
  return { x, y, vx: 100, vy: 100, radius };
}

function makeScissors(overrides = {}) {
  return {
    cutting: true,
    cutPhase: 2,
    cutStart:   { x: 100, y: 0   },
    cutTurn:    { x: 100, y: 100 },
    cutTarget:  { x: 0,   y: 100 },
    cutCurrent: { x: 0,   y: 100 },
    cutDirection: 'down',
    ...overrides,
  };
}
```

---

## 1. `reconcileBalls(poly, balls, config, originalArea)`

### What it does
- Filters out balls whose centers are outside `poly`.
- Computes a density-ramped ball target count.
- Spawns extra `createBall` instances if the count is below target, or randomly trims if above.

### Test scenarios

**1: returns empty array when balls list is empty and target is 0**
- Setup: `poly = testPoly`, `balls = []`, `config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 0 }`, `originalArea = 240000`
- effectiveDensity is huge → target = `max(0, floor(240000 / huge)) = 0`
- Expected: returns `[]` (length 0)

**2: spawns balls to reach minBalls when area is too small for density target**
- Setup: `poly = testPoly`, `balls = []`, `config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 3 }`, `originalArea = 240000`
- target = max(3, 0) = 3
- Expected: result has length 3; all balls have x, y, vx, vy, radius properties

**3: filters out a ball whose center is outside poly**
- Setup: `poly = testPoly`, `balls = [makeBall(700, 200)]` (x=700 outside 0–600), `config = baseConfig`, `originalArea = 240000`
- The out-of-bounds ball is filtered; new balls are spawned to meet density target
- Expected: none of the returned balls has `x === 700`

**4: keeps all balls that are inside poly**
- Setup: `poly = testPoly`, `balls = [makeBall(300, 200)]`, `config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 1 }`, `originalArea = 240000`
- target = max(1, 0) = 1; ball at (300,200) is inside; no filtering, no spawning
- Expected: result has length 1 and `result[0].x === 300`

**5: trims excess balls down to target count**
- Setup: `poly = testPoly`, `balls = [makeBall(100,100), makeBall(200,100), makeBall(300,100), makeBall(400,100), makeBall(500,100)]` (5 balls), `config = { ...baseConfig, ballDensityPx2: 1e9, minBalls: 2 }`, `originalArea = 240000`
- target = max(2, 0) = 2; delta = 2 - 5 = -3
- Expected: result has length 2

**6: density ramp increases effective ball count as area shrinks**
- Setup: full-area run vs half-area run; use a tiny poly (area = 12000, i.e. 5% of original) with `config = baseConfig` (`densityRampK = 2`), `originalArea = 240000`
- At 5% area: areaPercent = 5, progressFactor = 1 + 2*(1 - 0.05) = 2.9; effectiveDensity = 30000/2.9 ≈ 10345; target = max(1, floor(12000/10345)) = max(1,1) = 1
- At 100% area: areaPercent = 100, progressFactor = 1; effectiveDensity = 30000; target = max(1, floor(240000/30000)) = 8
- Expected: reconcileBalls on full testPoly with 0 balls returns an array of length 8

**7: originalArea = 0 does not crash; falls back to areaPercent = 100**
- Setup: `poly = testPoly`, `balls = []`, `config = { ...baseConfig, minBalls: 1, ballDensityPx2: 1e9 }`, `originalArea = 0`
- areaPercent formula: `originalArea > 0 ? ... : 100` → areaPercent = 100 → progressFactor = 1
- Expected: returns array (does not throw), length >= 1

**8: all balls in list are inside poly; none trimmed; count equals target exactly**
- Setup: produce exactly `target` balls manually, all at safe interior positions; pass them in
- delta = 0 → neither branch executes
- Expected: returned array has same length as input and contains the same ball objects (identity preserved for kept balls)

**9: returned balls all have centers inside poly**
- Setup: `poly = testPoly`, `balls = []`, `config = baseConfig`, `originalArea = 240000`
- Newly spawned balls come from `createBall` which uses `randomPointInPolygon`
- Expected: every ball `b` in result satisfies `pointInPolygon(b.x, b.y, testPoly) === true`

**10: density ramp formula — progressFactor clamps the effective density correctly**
- Setup: call reconcileBalls with a polygon of area exactly 120000 (50% of originalArea 240000), `config = { ...baseConfig, densityRampK: 2, ballDensityPx2: 30000, minBalls: 0 }`, `balls = []`, `originalArea = 240000`
- areaPercent = 50; progressFactor = 1 + 2*(0.5) = 2; effectiveDensity = 15000; target = floor(120000/15000) = 8
- Expected: result has length 8

---

## 2. `applyCompletedCut(poly, scissors, originalArea, config)`

### What it does
- Calls `nibblePolygon(poly, cutStart, cutTurn, cutTarget)` to get the smaller polygon.
- Computes `score = round(newArea / originalArea * 10000) / 100` (percentage, 2 d.p.).
- Returns `{ newPoly, score, won: score < config.winThreshold }`.

### Test scenarios

The reference nibble: cutting the top-left 100×100 corner off testPoly (A=(100,0), B=(100,100), C=(0,100)).
- newArea = 240000 - 10000 = 230000
- score = round(230000/240000 * 10000)/100 = round(9583.33)/100 = 9583/100 = 95.83

**1: returns newPoly with area smaller than original after a valid corner cut**
- Setup: `poly = testPoly`, scissors with `cutStart={x:100,y:0}`, `cutTurn={x:100,y:100}`, `cutTarget={x:0,y:100}`, `originalArea = 240000`, `config = baseConfig`
- Expected: `result.newPoly` has area 230000; `result.score === 95.83`

**2: won is false when score is above winThreshold**
- Setup: same corner cut as above; `config.winThreshold = 15`; score = 95.83 > 15
- Expected: `result.won === false`

**3: won is true when score drops below winThreshold**
- Setup: use a tiny poly where `nibblePolygon` returns a tiny remainder; construct scissors that cut away ~90% of testPoly
- Simpler approach: pass a small polygon directly. Use a 40×40 poly (area 1600) as `poly`, cut a 30×40 slab (area 1200) off it leaving area 400. score = round(400/240000 * 10000)/100 = round(16.67)/100 = 0.17 < 15
- Expected: `result.won === true`

**4: score is rounded to exactly 2 decimal places**
- Setup: top-left 100×100 cut of testPoly, `originalArea = 240000`
- 230000/240000 = 0.958333... × 10000 = 9583.33, rounded = 9583, /100 = 95.83
- Expected: `result.score === 95.83` (not 95.8333...)

**5: newPoly is not the same reference as the input poly**
- Setup: any valid cut on testPoly
- Expected: `result.newPoly !== poly` (nibblePolygon returns a new object)

**6: invalid cut (cutStart not on an edge) returns the original polygon unchanged**
- Setup: scissors with `cutStart = {x:300, y:200}` (interior point, not on any edge)
- `nibblePolygon` returns `poly` unchanged; area stays 240000; score = 100.00
- Expected: `result.newPoly === poly`, `result.score === 100`, `result.won === false`

**7: won is false when score equals winThreshold exactly (strict < check)**
- Setup: engineer a cut such that score = exactly 15.00; `config.winThreshold = 15`
- score < 15 is false when score === 15
- Expected: `result.won === false`

**8: bottom-right corner cut produces symmetric result**
- Setup: scissors with `cutStart={x:500,y:400}`, `cutTurn={x:500,y:300}`, `cutTarget={x:600,y:300}`, `originalArea = 240000`
- Same 100×100 corner removed; newArea = 230000; score = 95.83
- Expected: `result.score === 95.83`, `result.won === false`

---

## 3. `applyStraightCut(poly, scissors, originalArea, config)`

### What it does
- Calls `raycastToEdge(cutStart.x, cutStart.y, cutDirection, poly)` to find the far wall.
- If a hit is found, `exitPoint = hit.point`; otherwise falls back to `cutCurrent`.
- Calls `splitPolygon(poly, cutStart, exitPoint)` → larger half.
- Returns `{ newPoly, score, won, exitPoint }`.

### Reference geometry on testPoly (600×400):
- A straight 'right' cut from `cutStart={x:0, y:200}` (left edge midpoint) hits the right edge at `exitPoint={x:600, y:200}`.
- splitPolygon splits the rect in half; each half has area 120000.
- The function keeps the larger (or equal) piece — area = 120000.
- score = round(120000/240000 * 10000)/100 = round(5000)/100 = 50.00

**1: returns exitPoint at the opposite wall for a horizontal cut across testPoly**
- Setup: `poly = testPoly`, scissors `cutStart={x:0,y:200}`, `cutDirection='right'`, `originalArea = 240000`, `config = baseConfig`
- Expected: `result.exitPoint` equals `{x:600, y:200}`

**2: returns score = 50.00 for a cut that bisects testPoly**
- Setup: same as test 1
- Expected: `result.score === 50`

**3: won is false when score is above winThreshold**
- Setup: same bisecting cut; `config.winThreshold = 15`
- Expected: `result.won === false`

**4: won is true when cut leaves less than winThreshold percent of area**
- Setup: `poly` = a small poly constructed so the retained half is < 15% of `originalArea`; e.g. poly of area 20000, straight cut leaves 10000; `originalArea = 240000`; score = round(10000/240000*10000)/100 = round(416.67)/100 = 4.17 < 15
- Expected: `result.won === true`

**5: falls back to cutCurrent when raycast returns null (no hit in that direction)**
- Setup: `poly = testPoly`, scissors `cutStart={x:300,y:200}`, `cutDirection='up'` — the top edge is at y=0 so a 'up' ray from y=200 hits it normally; but use `cutDirection='down'` from `cutStart={x:700,y:200}` (outside poly, no edge below within poly span) OR use a direction the ray cannot reach. Simpler: override so `raycastToEdge` finds no hit by placing cutStart outside the polygon and direction away.
- Actually, use `cutStart={x:300, y:200}` `cutDirection='right'` but replace `poly` with one that has no vertical right edge above y=200 to force null — this is complex. Simpler: pass a mock scissors where `cutDirection` is not a standard direction (e.g. `'diagonal'`) — `raycastToEdge` returns null for unknown directions.
- Expected: `result.exitPoint` equals `scissors.cutCurrent`

**6: newPoly is the larger of the two halves**
- Setup: `poly = testPoly`, vertical cut from `{x:100,y:0}` downward ('down') to `{x:100,y:400}` (left 25% vs right 75%)
- splitPolygon keeps larger half (area = 180000, 75%)
- Expected: `polygonArea(result.newPoly)` equals 180000; `result.score === 75`

**7: score is rounded to 2 decimal places**
- Setup: `poly = testPoly`, vertical cut at x=100 down direction; area retained = 180000; score = 75.00 exactly
- Expected: `result.score === 75`

**8: a 'down' cut from top edge midpoint reaches bottom edge**
- Setup: `poly = testPoly`, scissors `cutStart={x:300,y:0}`, `cutDirection='down'`, `originalArea = 240000`
- Raycast hits bottom edge at `{x:300, y:400}`
- Expected: `result.exitPoint` deep-equals `{x:300, y:400}`

**9: returns all four fields in the result object**
- Setup: any valid cut
- Expected: result has properties `newPoly`, `score`, `won`, `exitPoint`

---

## 4. `checkCutCollision(balls, scissors)`

### What it does
- Iterates over `balls`; for each calls `ballIntersectsLCut(ball, scissors)`.
- Returns `true` as soon as one ball intersects; returns `false` if none do.

### Test scenarios

**1: returns false for empty balls array**
- Setup: `balls = []`, `scissors = makeScissors()`
- Expected: `false`

**2: returns false when no ball is near the cut line**
- Setup: `balls = [makeBall(300, 300)]` (far from cut), scissors with segment (100,0)→(100,100)→(0,100)
- Ball at (300,300) is far from both segments (distance > 10)
- Expected: `false`

**3: returns true when one ball intersects the cut line**
- Setup: `balls = [makeBall(100, 5)]` — distance to segment (100,0)→(100,100) is 0, radius 10 → intersects
- scissors `cutPhase=2`, `cutStart={x:100,y:0}`, `cutTurn={x:100,y:100}`, `cutTarget={x:0,y:100}`, `cutCurrent={x:0,y:100}`
- Expected: `true`

**4: returns true when the first ball of several intersects**
- Setup: `balls = [makeBall(100, 5), makeBall(400, 300), makeBall(500, 200)]`
- Only first ball intersects; function short-circuits
- Expected: `true`

**5: returns true when only the last ball of several intersects**
- Setup: `balls = [makeBall(400,300), makeBall(500,200), makeBall(100,5)]`
- Only the last ball is near the cut
- Expected: `true`

**6: returns false when scissors.cutting is false, even if a ball is on the line**
- Setup: `balls = [makeBall(100,5)]`, `scissors = makeScissors({ cutting: false })`
- `ballIntersectsLCut` returns false when `cutting=false`
- Expected: `false`

**7: returns false when all balls are outside radius of cut**
- Setup: three balls at (300,300), (400,350), (500,250); scissors cuts along top-left corner (100,0)→(100,100)→(0,100)
- All balls are far from both segments
- Expected: `false`

**8: handles a phase-1 scissors (single segment)**
- Setup: `scissors = makeScissors({ cutPhase:1, cutStart:{x:0,y:0}, cutTurn:null, cutCurrent:{x:300,y:0} })`, `balls = [makeBall(150, 5)]`
- Ball at (150,5) is within radius 10 of segment (0,0)→(300,0)
- Expected: `true`

**9: returns false for a phase-1 scissors when ball is far from the single segment**
- Setup: same phase-1 scissors as above but `balls = [makeBall(150, 50)]`
- Distance from (150,50) to segment (0,0)→(300,0) is 50 > 10
- Expected: `false`
