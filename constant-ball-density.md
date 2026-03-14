# Brainstorm: Constant Ball Density

## The Core Idea

Instead of "add a ball per cut," the system maintains a target ball count derived from the current polygon area. As the player cuts, the field shrinks, and the system continuously reconciles the live ball count against the target.

---

## How Density Works

Density is defined in **square pixels** — one ball per N px² of current polygon area. This ensures the visual crowding (balls per visible space) is consistent across desktop and mobile regardless of canvas size or the configurable rectangle size.

Formula: `targetBalls = max(2, floor(currentAreaPx² / ballDensityPx²))`

Default: **72,000 px² per ball** — gives ~5 balls on a 600×600 desktop field, ~2 balls on a 400×400 mobile field.

Example table at default density (600×600 start):

| Area Remaining | Area (px²) | Target Ball Count |
|---|---|---|
| 100% | 360,000 | 5 |
| 80% | 288,000 | 4 |
| 60% | 216,000 | 3 |
| 40% | 144,000 | 2 |
| 20% | 72,000 | 2 (minimum) |

The target ball count is recalculated after every cut.

---

## Ball Reconciliation After Each Cut

After every successful cut, the system:
1. Recalculates the target ball count from the new area in px².
2. If live count < target: spawn the difference immediately inside the new polygon.
3. If live count > target: delete the excess immediately (balls chosen at random).

This is a clean, simple reconciliation — no special handling for whether a ball was physically inside the removed piece. Every cut snaps the live count to the target.

---

## When Do Balls Spawn or Get Deleted?

- A cut that removes a large chunk of area → target may drop → balls are deleted, or fewer/no new balls spawn.
- A cut that removes a small sliver → target stays the same → one ball may be added to hold density.
- Aggressive cuts are less punishing: big cuts reduce the target and may cost zero new balls.
- Timid nibbles keep density stable.

---

## Difficulty Progression

With density as the driver, difficulty still increases, just differently:

1. **Spatial compression** — same ball count in half the space means balls cross cut lines roughly twice as often. Collision probability per cut stays roughly proportional to density, so difficulty scales smoothly.
2. **Polygon complexity** — the jagged rectilinear shape creates smaller pockets, corners, and dead-ends. More edges = more reflection angles = less predictable ball paths. This gets harder even at the same ball count.
3. **The density knob** — `ballDensityPx2` directly controls baseline difficulty. Lower value = more balls = harder. Example presets (for 600×600 desktop):
   - Easy: 90,000 px² per ball (~4 balls at start)
   - Medium: 72,000 px² per ball (~5 balls at start, default)
   - Hard: 45,000 px² per ball (~8 balls at start)

---

## What About Ball Speed?

Ball speed is a cleanly orthogonal dial:
- **Density** controls how crowded the field is.
- **Speed** controls how reactive the player needs to be.

A future enhancement could ramp speed as area shrinks — early game is spacious and slow, late game is tight and fast.

---

## Decisions

| Question | Decision |
|---|---|
| Density unit | px² (square pixels) — consistent visual crowding across screen sizes |
| Default density | 72,000 px² per ball (~5 balls on 600×600 desktop, ~2 on 400×400 mobile) |
| Minimum ball count | Always at least 2 balls |
| Ball removal | After each cut, delete excess balls immediately regardless of where they are physically |
| Fractional balls | Use `floor` — e.g., 2.4 → 2 balls |