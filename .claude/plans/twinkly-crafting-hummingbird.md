# Progressive Density: Area-Based areaPerBall Scaling

## Context
With constant `areaPerBall`, ball count drops too fast as area shrinks (4→2→1→1), making the endgame too easy. We need `areaPerBall` to decrease as area shrinks so density progressively increases. The decrease should be based on remaining area ratio (not cut count) so many small cuts don't over-penalize.

## Formula
```
areaRatio = currentArea / originalArea
effectiveAreaPerBall = areaPerBall * areaRatio ^ densityRampPower
targetBalls = max(1, round(currentArea / effectiveAreaPerBall))
```

Simplifies to: `targetBalls = max(1, round(currentArea^(1-power) * originalArea^power / areaPerBall))`

## New Config Param

**Add `densityRampPower`:**
- Desktop default: `0.8`
- Mobile default: `0.8`
- Range: 0.0 – 2.0 (step 0.1)
- 0 = constant density (balls drop with area)
- 1 = constant ball count
- `>1` = ball count increases as area shrinks

## Files to Modify

### `js/config.js`
- Add `densityRampPower: 0.8` to DEFAULTS and MOBILE_DEFAULTS
- Add `applyConfigToPanel`: `cfg-density-ramp-power` element
- Add `loadConfigFromPanel`: parse and clamp (min 0, max 2.0)
- Also update `areaPerBall` default from `90000` to `120000` (desktop) to start with 3 balls instead of 4

### `js/main.js` — 3 locations
**Init (line ~54):** Replace current `initBallCount` calc:
```javascript
const initBallCount = Math.max(1, Math.round((rect.width * rect.height) / config.areaPerBall));
```
No change needed here — at game start, areaRatio=1, so `areaRatio^power = 1` and formula gives same result.

**Reset callback (line ~75):** Same — no change needed at reset.

**Post-cut (line ~169):** Replace the targetBalls calculation:
```javascript
const currentArea = rect.width * rect.height;
const areaRatio = currentArea / gameState.originalArea;
const effectiveAreaPerBall = config.areaPerBall * Math.pow(areaRatio, config.densityRampPower);
const targetBalls = Math.max(1, Math.round(currentArea / effectiveAreaPerBall));
adjustBallCount(gameState.balls, targetBalls, rect, config);
```

### `index.html`
Add config input after "Area Per Ball":
```html
<label>
  <span>Density Ramp Power</span>
  <input type="number" id="cfg-density-ramp-power" min="0" max="2" step="0.1">
</label>
```

## Expected Behavior (areaPerBall=120000, power=0.8)

| Area % | Balls | Speed (base 150, +15/cut) |
|--------|-------|---------------------------|
| 100%   | 3     | 150                       |
| 50%    | 3     | 165                       |
| 25%    | 2     | 180                       |
| 12%    | 2     | 195                       |

Gentle start (3 balls, base speed), progressively harder via speed ramp, ball count stays substantial throughout.

## Verification
1. Start game → verify 3 balls (not 4) with updated areaPerBall=120000
2. Make a cut to ~50% → verify still 3 balls, speed increased
3. Make a cut to ~25% → verify 2 balls, speed increased again
4. Change densityRampPower to 0 in config → verify balls drop fast (old behavior)
5. Change densityRampPower to 1 → verify ball count stays constant at 3
6. Test on mobile
