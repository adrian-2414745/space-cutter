# Space Cutter — Game Design Document

## 1. Overview

**Title:** Space Cutter
**Platform:** Web browser (desktop & mobile)
**Genre:** Arcade / Puzzle
**Players:** Single-player

The player starts with a large rectangular playing field containing bouncing balls. Using a scissors tool that moves along the polygon's perimeter, the player makes L-shaped cuts that remove rectangular corners, or straight cuts that split the polygon and discard the smaller half. Each cut transforms the play area into an increasingly complex rectilinear polygon. Ball count is governed by a density formula that increases crowding as the field shrinks, creating escalating difficulty. The goal is to reduce the polygon to under 15% of its original area before a countdown timer expires.

---

## 2. Game Objects

### 2.1 Playing Field (Rectilinear Polygon)
- Starts as a rectangle; becomes an arbitrary rectilinear polygon (all edges axis-aligned) after cuts.

### 2.2 Bouncing Balls
- Move continuously inside the polygon at a constant speed.
- Reflect off all polygon edges using elastic reflection.
- Balls pass through each other — no ball-to-ball collision.
- Ball radius is configurable.

### 2.3 Scissors (Player-Controlled)
- Positioned on the perimeter of the polygon.
- Moves along the perimeter and initiates cuts to remove area from the polygon.

---

## 3. Controls

### Desktop
| Input | Action |
|-------|--------|
| Right Arrow | Move scissors clockwise along the perimeter |
| Left Arrow | Move scissors counter-clockwise along the perimeter |
| Spacebar (1st press) | Initiate cut — begin Phase 1 (inward travel) |
| Spacebar (2nd press) | Trigger Phase 2 (turn 90° toward nearest boundary) |
| P | Pause / unpause the game |

### Mobile
| Input | Action |
|-------|--------|
| Swipe Right | Move scissors clockwise along the perimeter |
| Swipe Left | Move scissors counter-clockwise along the perimeter |
| Double-Tap (1st) | Initiate cut — begin Phase 1 (inward travel) |
| Double-Tap (2nd) | Trigger Phase 2 (turn 90° toward nearest boundary) |

---

## 4. Core Mechanics

### 4.1 Scissors Movement
- **Perimeter Constraint:** The scissors is constrained to the boundary of the polygon, automatically wrapping around corners during movement.
- **The Intent vs. Input Problem:** In a game where 100% precision matters for area maximization, requiring a player to manually align the scissors to a 1-pixel corner is frustrating ("fiddly"). Corner snapping aligns the software to the player's likely intent.
- **Directional Snapping (The "Magnet vs. Sticky" Rule):** 
  - To be rewarding without being a "trap," snapping must be **directional**.
  - **The Magnet:** When moving *toward* a corner, the scissors will "snap" exactly to the corner position if it comes within the `cornerSnapDistance`. This makes finding the corner feel smooth and effortless.
  - **Avoiding the Stickiness:** If the player is at a corner and pushes *away* from it, the snap is ignored. This ensures the corner doesn't feel "magnetic" or "sticky" when trying to leave, allowing for high-precision cuts just a few pixels away from a vertex.
- **State Lock:** The scissors cannot move while a cut is in progress.

### 4.2 Cutting (L-Cut or Straight Cut)
1. **Phase 1 (Inward Travel):**
   - The scissors leaves its perimeter position and moves perpendicular to its current edge, heading inward.
   - A visible dashed line is drawn behind the scissors as it travels.
   - A faint preview line shows the predicted cut path.

2. **Phase 2 (Turn & Travel) — triggered by player input:**
   - Once the cut has reached minimum depth, the player can trigger Phase 2.
   - The scissors turns 90° toward the closest polygon boundary.
   - The scissors continues at the same speed toward the target boundary.
   - **Success:** The scissors reaches the boundary. The rectangular corner enclosed by the L-cut path and the polygon boundary is removed.

3. **Straight Cut — triggered automatically:**
   - If the player does not trigger Phase 2 and Phase 1 reaches the opposite boundary, a straight-line cut occurs. The polygon is split in two and the smaller half is discarded.

4. **Failure:** If any ball intersects the cut line while the cut is in progress, the cut is cancelled. The line disappears and the scissors resets to its starting position.

5. A new cut can be initiated immediately after a successful or failed cut — no cooldown.

### 4.3 Polygon Update After Cut

**L-Cut:** The rectangular corner defined by three points is removed — start point (A, where the cut began on the perimeter), turn point (B, where direction changed), and end point (C, where the scissors reached the boundary). The scissors repositions to the turn point on the new edge.

**Straight Cut:** The polygon is split along the cut line. The smaller sub-polygon is discarded (random choice if equal). The scissors repositions to the exit point on the remaining polygon.

### 4.4 Ball Reconciliation
After every successful cut and at game start, ball count is reconciled to a density-based target:

1. Balls inside the removed portion are discarded.
2. A target count is computed from the current area and a density formula. A progressive ramp factor (K) causes effective density to tighten as the polygon shrinks, so ball crowding increases over the course of a game.
3. If live balls are below the target, new balls spawn at random positions inside the polygon with random direction and the base speed.
4. If live balls exceed the target, excess balls are removed at random.

### 4.5 Cut Line Collision
- A collision occurs when any ball touches the cut line at any point along its drawn length.
- During Phase 1: the single segment from A to the scissors' current position is checked.
- During Phase 2: both segments (A→B and B→current position) are checked.
- The full visible path is checked every frame.

---

## 5. Scoring

The score is calculated using a multiplicative formula:

**Score = max(0, round(Base × Time Multiplier × Efficiency Multiplier − Penalty))**

### 5.1 Base Score
- `Base = (100 − areaPercent) × 10`
- The more area removed, the higher the base score (max 1000 at 0% remaining).

### 5.2 Time Multiplier
- If the player **won**: `1 + (timeRemaining / totalTime)` — ranges from 1.0 (no time left) to 2.0 (instant win).
- If the player **lost** (time expired): fixed at 1.0 (no time bonus).

### 5.3 Efficiency Multiplier
- `1 + (idealCuts / successfulCuts)` where `idealCuts = ceil(log₂(100 / winThreshold))`.
- Rewards fewer cuts — the closer the player is to the theoretical minimum number of cuts, the higher the multiplier.
- If `successfulCuts` is 0, the multiplier is 1.0.

### 5.4 Failed Cut Penalty
- `Penalty = failedCuts × penaltyValue`
- Penalty values per difficulty level: none = 0, low = 15, moderate = 35, heavy = 60.
- Subtracted after the multipliers are applied.

---

## 6. Win & Loss Conditions

### 6.1 Instant Win
- Area drops below 15% → the player wins immediately.

### 6.2 Time Expiry
- Timer reaches 0 → the game ends. The scissors can no longer be used. The final score is displayed.

---

## 7. Timer & Pause

- Configurable countdown timer (default: 3 minutes, 4 minutes on mobile).
- The timer does not start automatically — the player must press **Start**.
- **Pause (desktop only):** P pauses/resumes the timer and all game activity.

---

## 8. UI Layout

### 8.1 Game Area
- The polygon is displayed centrally on screen.
- Score (area percentage) and timer are displayed above the playing field.

### 8.2 Controls Panel (Below the Playing Field)
| Button | Behavior |
|--------|----------|
| **Start** | Starts the countdown timer. Game begins. |
| **Reset** | Resets to initial state (original rectangle, starting balls, score at 100%). Timer resets but remains paused. |
| **Config** | Opens configuration panel (only available before starting). |
| **Help** | Opens help panel with controls reference (mobile only). |

---

## 9. Difficulty Progression

Difficulty increases through three compounding factors:
1. **Progressive ball density** — the ramp factor (K) causes ball crowding to increase as the polygon shrinks. At K=2 and 15% remaining, crowding is ~2.7× tighter than at start.
2. **Smaller & more complex polygon** — less room for safe cuts, more frequent ball–cut-line intersections.
3. **Constant ball speed** — same speed in a tighter space means more frequent collisions.

---

## 10. Visual Guidelines

- **Scissors:** Yellow triangle on the polygon edge, oriented inward.
- **Cut line:** Red dashed line drawn behind the scissors during a cut.
- **Preview line:** Faint red dashed line showing predicted cut path during Phase 1.
- **Balls:** Orange-red filled circles.
- **Polygon:** Dark blue fill with cyan border.
- **Styling:** Clean, minimal arcade aesthetic.

---

## 11. Configurable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Timer duration | 180s (240s mobile) | Total game time |
| Ball density | 33,000 px² per ball | Base area per ball (before ramp) |
| Min balls | 2 | Ball count floor |
| Density ramp (K) | 2 | Progressive crowding factor |
| Ball speed | 150 (120 mobile) | Ball movement speed |
| Ball radius | 6 | Ball size |
| Scissors border speed | 400 | Perimeter movement speed |
| Scissors cut speed | 300 | Speed during a cut |
| Rectangle initial size | 600 × 600 | Starting rectangle dimensions |
| Win threshold | 15% | Score below which the player wins |
| Corner snap distance | 8 | Snap-to-corner radius |
| Min cut depth | 20 | Minimum Phase 1 depth before Phase 2 |
| Touch sensitivity | 2.5 (mobile) | Swipe-to-movement multiplier |
| Fail penalty | Low | Penalty for failed cuts (none/low/moderate/heavy) |

Configurable parameters are accessible via the **Config** button (only when game is idle). The panel has **Save** and **Reset** buttons.
