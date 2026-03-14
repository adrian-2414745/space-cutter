# Space Cutter — Game Design Document v3

## 1. Overview

**Title:** Space Cutter
**Platform:** Web browser (front-end only, desktop & mobile)
**Genre:** Arcade / Puzzle
**Players:** 1 (single-player)
**Core Loop:** The player shrinks a polygon playing field using L-shaped cuts (corner nibbles) or straight cuts (full splits) while avoiding bouncing balls. Each successful cut shrinks the field and adds a new ball, increasing difficulty over time.

---

## 2. Game Concept

The player starts with a large 2D rectangle containing two bouncing balls. Using a scissors tool that moves along the polygon's perimeter, the player makes L-shaped cuts that remove rectangular corners, or straight cuts that split the polygon in two and discard the smaller half. Each cut transforms the play area into an increasingly complex rectilinear polygon. The goal is to cut away enough area to reduce the polygon to under 15% of its original size before a countdown timer expires.

---

## 3. Game Objects

### 3.1 Playing Field (Rectilinear Polygon)
- The primary playing area.
- Starts as a rectangle but becomes an arbitrary rectilinear polygon (all edges axis-aligned) after cuts.
- Represented internally as a list of vertices in clockwise order.
- After each successful L-cut, the rectangular corner defined by the cut path is removed. - After a straight cut, the polygon is split in two and the smaller half is discarded.
- Any balls inside the removed portion are also removed.

### 3.2 Bouncing Balls
- Continuously move inside the polygon at a constant speed.
- Reflect off all polygon edges (elastic reflection using edge normals).
- Balls pass through each other — no ball-to-ball collision.
- Start count: 2 balls at the beginning of the game.
- One additional ball is spawned instantly inside the remaining polygon after each successful cut.
- Balls inside the removed corner are removed when that piece disappears.
- Ball radius is a configurable parameter.

### 3.3 Scissors (Player-Controlled)
- Positioned on the perimeter of the polygon.
- Moves clockwise or counter-clockwise along the perimeter, automatically wrapping around corners.
- When a cut is initiated:
  - **Phase 1:** Moves perpendicular from the current edge inward into the polygon.
  - **Phase 2:** Turns 90° toward the nearest polygon boundary and continues cutting until it reaches that boundary.
- Leaves a visible cut line in its wake.

---

## 4. Controls

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

## 5. Core Mechanics

### 5.1 Scissors Movement
- The scissors travels along the perimeter of the current polygon.
- **Left Arrow / Swipe Left** moves counter-clockwise; **Right Arrow / Swipe Right** moves clockwise.
- When the scissors reaches a corner, it **automatically wraps** onto the next edge and continues moving.
- **Corner snapping:** When the scissors is within a few pixels of a corner, it snaps to the exact corner position.
- The scissors cannot move while a cut is in progress.
- The scissors **cannot initiate a cut from a corner** — it must be on an edge (not at a corner point) to cut.

### 5.2 Cutting (L-Cut or Straight Cut)
1. **Phase 1 (Inward Travel):**
   - Player presses Spacebar (or double-taps on mobile) to begin a cut.
   - The scissors leaves its perimeter position and moves perpendicular to its current edge, heading inward into the polygon.
   - A visible dashed line is drawn behind the scissors as it travels.
   - A faint preview line shows the predicted L-shaped cut path (both segments).
   - Ball collision is checked against the Phase 1 segment each frame.

2. **Phase 2 (Turn & Travel) — triggered by player input:**
   - Player presses Spacebar again (or double-taps) once the cut has reached minimum depth.
   - The scissors turns 90° toward the **closest polygon boundary** (determined by raycasting in both perpendicular directions and picking the shorter distance).
   - The scissors continues at the same speed toward the target boundary.
   - Ball collision is checked against **both segments** of the L-shaped cut line each frame.
   - **Success:** The scissors reaches the target boundary. The rectangular corner enclosed by the L-cut path and the polygon boundary is removed. The polygon is updated and the scissors repositions to the turn point on the new edge.

3. **Straight Cut — triggered automatically when Phase 1 reaches the opposite boundary:**
   - If the player does not trigger Phase 2 and Phase 1 travels all the way across the polygon to the opposite boundary, a straight-line cut occurs instead of an L-cut.

4. **Failure:** If any bouncing ball intersects the cut line while the cut is in progress (L-cut or straight cut), the entire cut is cancelled. The line disappears and the scissors resets to its starting position on the perimeter.

5. A new cut can be initiated immediately after a successful or failed cut — there is no cooldown.

### 5.3 Cutting Direction
- **Phase 1:** Perpendicular to the scissors' current edge, directed inward (determined by the clockwise winding normal of the polygon).
- **Phase 2:** 90° from Phase 1 direction, toward the closest polygon boundary. The direction is chosen automatically.

### 5.4 Polygon Nibbling (L-Cut)
- When an L-cut completes, the rectangular corner defined by the three cut points (A → B → C) is removed from the polygon.
  - **A:** Start point on the perimeter (where the cut began).
  - **B:** Turn point (where the scissors changed direction).
  - **C:** End point on the perimeter (where the scissors reached a boundary).
- The polygon gains new vertices at A, B, and C (collinear vertices are cleaned up).
- After multiple cuts the polygon becomes an increasingly complex rectilinear shape.

### 5.4a Polygon Splitting (Straight Cut)
- When a straight cut completes, the polygon is split into two sub-polygons along the cut line.
- The **smaller** sub-polygon is discarded. If both halves have equal area, one is chosen at random.
- Any balls inside the discarded sub-polygon are removed.
- The scissors repositions to the exit point (where Phase 1 reached the opposite boundary) on the remaining polygon's perimeter.
- One new ball spawns inside the remaining polygon
- Cut-line collision rules still apply during the straight cut.

### 5.5 Ball Spawning
- After each successful cut, one new ball is added **instantly** inside the remaining polygon.
- The new ball spawns at a random position inside the polygon, with padding from all edges.
- The new ball is assigned a random direction and the same base speed as existing balls.

### 5.6 Cut Line Collision
- A collision is detected whenever **any ball touches the cut line at any point** along its drawn length.
- During Phase 1: the single segment from A to the scissors' current position is checked.
- During Phase 2: both segments (A → B and B → current position) are checked.
- The full visible L-path is checked for collision on every frame.

---

## 6. Scoring

- **Score unit:** Percentage (%).
- **Initial score:** 100% — representing the full original area.
- **After each cut:** Score is recalculated as:
  `score = (current polygon area / original polygon area) * 100`
- The score is displayed above the playing field.
- Lower score = better performance (more area cut away).

---

## 7. Win & Loss Conditions

### 7.1 Instant Win
- If the score drops **below 15%**, the player wins immediately regardless of remaining time.

### 7.2 Time Expiry
- When the timer reaches 0, the game ends.
- The scissors can no longer be moved or used.
- The final score is displayed.

---

## 8. Timer & Pause

- A configurable countdown timer (default: **3 minutes**, 4 minutes on mobile).
- The timer does **not** start automatically — the player must press the **Start** button.
- **Pause:** Pressing **P** pauses the timer and all game activity. Pressing **P** again resumes. (Desktop only.)
- When the timer reaches 0, the game ends.

---

## 9. UI Layout

### 9.1 Game Area
- The polygon is displayed centrally on screen.
- The current score (area percentage) is displayed above the playing field.
- The timer is displayed in a visible location (above the playing field).
- A live numeric score is also displayed.

### 9.2 Controls Panel (Below the Playing Field)
| Button | Behavior |
|--------|----------|
| **Start** | Starts the countdown timer. Game begins. |
| **Reset** | Resets the game to its initial state (original rectangle, 2 balls, score at 100%). Timer resets but remains paused. |
| **Config** | Opens configuration panel (only available before starting). |
| **Help** | Opens help panel with controls reference (mobile only). |

---

## 10. Difficulty Progression

Difficulty increases naturally through two compounding factors:
1. **More balls** — each successful cut adds a ball, making future cuts riskier.
2. **Smaller & more complex polygon** — a smaller, more irregular playing field means balls cross the cut line more frequently and the scissors has less room to find safe cut positions.

Ball speed remains **constant** throughout the game but is configurable before starting.

---

## 11. Visual Guidelines

- **Scissors:** A yellow triangle on the polygon edge, oriented to point inward (indicating cut direction).
- **Cut line:** A red dashed line drawn behind the scissors during a cut (both segments of the L visible).
- **Preview line:** A faint red dashed line showing the predicted L-shaped cut path during Phase 1.
- **Balls:** Simple color-filled circles (orange-red).
- **Polygon:** Dark blue fill with cyan border.
- **Styling:** Clean, minimal arcade aesthetic.

---

## 12. Configurable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Timer duration | 180s (240s mobile) | Total game time |
| Initial ball count | 2 | Balls present at game start |
| Ball speed | 150 (120 mobile) | Base movement speed of balls |
| Ball radius | 6 | Size of the bouncing balls |
| Scissors border speed | 250 | Speed of scissors moving along the perimeter |
| Scissors cut speed | 300 | Speed of scissors during a cut |
| Rectangle initial size | 600 x 600 | Width and height of the starting rectangle |
| Win threshold | 15% | Score below which the player wins instantly |
| Corner snap distance | 8 | Distance from corner at which scissors snaps to it |
| Min cut depth | 20 | Minimum Phase 1 depth before Phase 2 can be triggered |
| Touch sensitivity | 2.5 (mobile) | Multiplier for swipe-to-movement mapping |
| Fail penalty | Low | Score penalty for failed cuts (none/low/moderate/heavy) |

The configurable parameters are accessible by pressing the "Config" button (only when game is idle). The configuration panel has SAVE and RESET buttons.
