# Ball Density — Design Spec

## Overview

Ball count is governed by a constant density formula rather than a fixed "add one ball per cut" rule. After every successful cut the system reconciles the live ball count to a target derived from the current polygon area.

---

## Formula

```
targetBalls = max(MIN_BALLS, floor(currentAreaPx² / BALL_DENSITY_PX2))
```

| Parameter | Value |
|---|---|
| `BALL_DENSITY_PX2` | 72,000 px² per ball (configurable) |
| `MIN_BALLS` | 2 |

---

## Reconciliation (runs after every successful cut)

1. Compute `targetBalls` from the new polygon area.
2. If `liveBalls < targetBalls` — spawn the difference at random positions inside the new polygon.
3. If `liveBalls > targetBalls` — immediately delete the excess, chosen at random.

No special logic for whether a ball was physically inside the removed piece. The live count always snaps to target after a cut.

---

## Cross-Platform Behaviour

Using px² (not percentage) ensures visual crowding is consistent regardless of canvas size.

---

## Difficulty Tuning via `BALL_DENSITY_PX2`

default:  72,000

This is the primary difficulty knob exposed in the config panel.