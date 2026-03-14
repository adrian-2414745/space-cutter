# Design Change: Constant Ball Density

**Source spec:** `constant-ball-density-final.md`

---

## Summary

Replace the fixed "add 1 ball per cut" rule with a density-based reconciliation system. Ball count at all times is derived from the current polygon area. This applies at game start and after every successful cut (L-cut and straight cut).

---

## Formula

```
targetBalls = max(MIN_BALLS, floor(currentAreaPx² / BALL_DENSITY_PX2))
```

Both parameters are configurable and stored in `config`:

| Parameter | Default | Config field |
|---|---|---|
| `BALL_DENSITY_PX2` | 72,000 | `cfg-ball-density` |
| `MIN_BALLS` | 2 | `cfg-min-balls` |

---

## Reconciliation Logic

Runs after every successful cut (L-cut and straight cut), and at game start.

```
1. Filter gameState.balls to those still inside the new polygon   ← containment filter (keep)
2. Compute targetBalls = max(MIN_BALLS, floor(newArea / BALL_DENSITY_PX2))
3. delta = targetBalls - liveBalls
4. if delta > 0 → spawn `delta` new balls at random positions inside new polygon
5. if delta < 0 → remove abs(delta) balls chosen at random from live list
6. if delta = 0 → no change
```

Step 1 (containment filter) is kept for physical correctness — balls that ended up in the removed section are gone. The density reconciliation in steps 2–6 then snaps the surviving count to the target.

---

## Affected Files

### `js/config.js`

- Remove: `initialBallCount` from `DEFAULTS` and `MOBILE_DEFAULTS`
- Add: `ballDensityPx2: 72000` and `minBalls: 2` to both `DEFAULTS` and `MOBILE_DEFAULTS`
- In `applyConfigToPanel()`: remove `cfg-ball-count` set; add `cfg-ball-density` and `cfg-min-balls` sets
- In `loadConfigFromPanel()`: remove `initialBallCount` read; add reads for `cfg-ball-density` (min 1000) and `cfg-min-balls` (min 1)
- In `resetConfigToDefaults()`: no structural change needed — inherits from `DEFAULTS`

### `js/main.js`

**New helper function** — `reconcileBalls(poly)`:
```js
function reconcileBalls(poly) {
  const area = polygonArea(poly);
  gameState.balls = gameState.balls.filter(b => isBallInPolygon(b, poly));
  const target = Math.max(config.minBalls, Math.floor(area / config.ballDensityPx2));
  const delta = target - gameState.balls.length;
  if (delta > 0) {
    for (let i = 0; i < delta; i++) {
      gameState.balls.push(createBall(poly, config));
    }
  } else if (delta < 0) {
    // shuffle-and-trim to pick randomly
    for (let i = gameState.balls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameState.balls[i], gameState.balls[j]] = [gameState.balls[j], gameState.balls[i]];
    }
    gameState.balls.length = target;
  }
}
```

**Game init** (top-level and inside `initUI` reset callback):
- Remove: `for (let i = 0; i < config.initialBallCount; i++) { gameState.balls.push(...) }`
- Replace with: `reconcileBalls(poly)` — uses the initial polygon area to seed the ball count

**`completeCut()`**:
- Remove: `gameState.balls = gameState.balls.filter(b => isBallInPolygon(b, poly))` and `gameState.balls.push(createBall(poly, config))`
- Replace with: `reconcileBalls(newPoly)` (call after `poly = newPoly`)

**`completeStraightCut()`**:
- Same substitution as `completeCut()` — remove filter+push, replace with `reconcileBalls(newPoly)` (call after `poly = newPoly`)

### `index.html`

- Remove: `<label>Initial Ball Count <input id="cfg-ball-count" ...></label>`
- Add two new labels in the same config-panel section:
  ```html
  <label>
    <span>Ball Density (px² per ball)</span>
    <input type="number" id="cfg-ball-density" min="1000" max="500000" step="1000">
  </label>
  <label>
    <span>Min Balls</span>
    <input type="number" id="cfg-min-balls" min="1" max="20">
  </label>
  ```

---

## What Does NOT Change

- `isBallInPolygon` containment filter — kept, runs before reconciliation
- `createBall` — unchanged, still used to spawn new balls
- Ball physics (`updateBall`) — unchanged
- Scoring logic — unchanged
- Cut mechanics — unchanged

---

## Possible Edge Cases

| Scenario | Behaviour |
|---|---|
| Very small polygon (area < `BALL_DENSITY_PX2 * MIN_BALLS`) | `MIN_BALLS` floor prevents ball count from dropping below minimum |
| `randomPointInPolygon` fails (polygon too small to place ball) | Already handled by rejection-sampling in `ball.js`; no change needed |
| `target = 0` (impossible given `MIN_BALLS ≥ 1`) | Guarded by `Math.max(MIN_BALLS, ...)` |
| Straight cut removes large chunk, many balls outside | Containment filter removes them; reconciliation may add some back |
