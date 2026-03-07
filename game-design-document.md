# Space Cutter — Game Design Document v2

## 1. Overview

**Title:** Space Cutter
**Platform:** Web browser (front-end only)
**Genre:** Arcade / Puzzle
**Players:** 1 (single-player)
**Core Loop:** The player slices a rectangle while avoiding bouncing balls. Each successful cut shrinks the playing field and adds a new ball, increasing difficulty over time.

---

## 2. Game Concept

The player starts with a large 2D rectangle containing one bouncing ball. Using a scissors tool that moves along the rectangle's border, the player cuts straight lines across the rectangle. Each cut splits the rectangle in two — the smaller piece is discarded and the game continues with the larger piece. The goal is to cut away as much area as possible before a countdown timer expires, or to achieve an instant win by reducing the rectangle to under 5% of its original size.

---

## 3. Game Objects

### 3.1 Rectangle (Playing Field)
- The primary playing area.
- Starts at a fixed initial size (the "original rectangle").
- After each successful cut, the rectangle is replaced by the larger of the two resulting pieces.
- The smaller piece disappears along with any balls inside it.

### 3.2 Bouncing Balls
- Continuously move inside the rectangle at a constant speed.
- Reflect off the rectangle's inner walls (elastic reflection, angle of incidence = angle of reflection).
- Balls pass through each other — no ball-to-ball collision.
- Start count: 1 ball at the beginning of the game.
- One additional ball is spawned instantly inside the remaining rectangle after each successful cut.
- Balls inside the discarded (smaller) piece are removed when that piece disappears.
- Ball radius is a configurable parameter.

### 3.3 Scissors (Player-Controlled)
- Positioned on the border/edge of the rectangle.
- Moves along the border in response to player input.
- When a cut is initiated, the scissors travels in a straight line perpendicular from its current edge position to the opposite side of the rectangle.
- Leaves a visible cut line in its wake as it moves.

---

## 4. Controls

| Input | Action |
|-------|--------|
| Arrow Keys (Up / Down / Left / Right) | Move scissors along the rectangle border |
| Spacebar | Initiate a cut |
| P | Pause / unpause the game |

---

## 5. Core Mechanics

### 5.1 Scissors Movement
- The scissors can only travel along the perimeter of the current rectangle.
- When the scissors reaches a corner, it **stops**. The player must press the arrow key for the adjacent edge direction to continue moving along the next edge.
- **Corner snapping:** When the scissors is within a few pixels of a corner, it snaps to the exact corner position. This makes it easy for the player to switch direction without pixel-precise positioning.
- The scissors cannot move while a cut is in progress.
- The scissors **cannot initiate a cut from a corner** — it must be on an edge (not at a corner point) to cut.

### 5.2 Cutting
1. Player presses Spacebar to begin a cut.
2. The scissors leaves its border position and moves in a straight line toward the opposite edge at a defined speed (not instant).
3. A visible line is drawn behind the scissors as it travels.
4. **Success:** If the scissors reaches the opposite edge without any ball touching the cut line, the rectangle is split. The smaller piece (and any balls within it) is removed. The scissors remains at its new position on the border of the remaining rectangle.
5. **Failure:** If any bouncing ball intersects the cut line at any point along its length while the scissors is still in transit, the cut is cancelled. The line disappears and the scissors resets to its starting position on the border.
6. A new cut can be initiated immediately after a successful or failed cut — there is no cooldown.

### 5.3 Cutting Direction
- Cuts are strictly horizontal or vertical — no diagonal cuts.
- The scissors cuts perpendicular to the edge it currently sits on:
  - From the top or bottom edge: cuts vertically.
  - From the left or right edge: cuts horizontally.

### 5.4 Rectangle Splitting
- When a cut completes, the rectangle is divided into two sub-rectangles along the cut line.
- The sub-rectangle with the **smaller area** is discarded.
- If both sub-rectangles are equal in area, either may be discarded (implementation choice).

### 5.5 Ball Spawning
- After each successful cut, one new ball is added **instantly** inside the remaining rectangle.
- The new ball spawns at a random position inside the rectangle, away from the border and the scissors.
- The new ball is assigned a random direction and the same base speed as existing balls.

### 5.6 Cut Line Collision
- A collision is detected whenever **any ball touches the cut line at any point** along its drawn length — not just near the scissors.
- The full visible line from the starting edge to the scissors' current position is checked for collision on every frame.

---

## 6. Scoring

- **Score unit:** Percentage (%).
- **Initial score:** 100% — representing the full original rectangle.
- **After each cut:** Score is recalculated as:
  `score = (current rectangle area / original rectangle area) * 100`
- The score is displayed above the rectangle.
- Lower score = better performance (more area cut away).

---

## 7. Win & Loss Conditions

### 7.1 Instant Win
- If the score drops **below 5%**, the player wins immediately regardless of remaining time.

### 7.2 Time Expiry
- When the timer reaches 0, the game ends.
- The scissors can no longer be moved or used.
- The final score is displayed.

---

## 8. Timer & Pause

- A configurable countdown timer (default: **3 minutes**).
- The timer does **not** start automatically — the player must press the **Start** button.
- **Pause:** Pressing **P** pauses the timer and all game activity. Pressing **P** again resumes.
- When the timer reaches 0, the game ends.

---

## 9. UI Layout

### 9.1 Game Area
- The rectangle is displayed centrally on screen.
- The current score (percentage) is displayed **above** the rectangle.
- The timer is displayed in a visible location (above the rectangle).

### 9.2 Controls Panel (Below the Rectangle)
| Button | Behavior |
|--------|----------|
| **Start** | Starts (or resumes) the countdown timer. Game begins. |
| **Reset** | Resets the game to its initial state (original rectangle, 1 ball, score at 100%). Timer resets but remains **paused** — requires pressing Start to begin again. |

---

## 10. Difficulty Progression

Difficulty increases naturally through two compounding factors:
1. **More balls** — each successful cut adds a ball, making future cuts riskier.
2. **Smaller rectangle** — a smaller playing field means balls cross the cut line more frequently and the scissors has less room to find safe cut positions.

Ball speed remains **constant** throughout the game but is configurable before starting.

---

## 11. Visual Guidelines

- **Scissors:** A recognizable scissors icon/sprite positioned on the rectangle edge, oriented to indicate cut direction.
- **Cut line:** A distinct, contrasting line (e.g., dashed or colored) drawn behind the scissors during a cut.
- **Balls:** Simple color-filled circles.
- **Rectangle removal:** Brief fade animation when the smaller piece is discarded.
- **Styling:** Clean, minimal arcade aesthetic.

---

## 12. Configurable Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Timer duration | 180 seconds | Total game time |
| Initial ball count | 1 | Balls present at game start |
| Ball speed | TBD | Base movement speed of balls (constant throughout game) |
| Ball radius | TBD | Size of the bouncing balls |
| Scissors border speed | TBD | Speed of scissors moving along the border |
| Scissors cut speed | TBD | Speed of scissors during a cut |
| Rectangle initial size | TBD | Width and height of the starting rectangle |
| Win threshold | 5% | Score below which the player wins instantly |
| Corner snap distance | TBD (few pixels) | Distance from corner at which scissors snaps to it |

The configurable parameters will be accessible by pressing a "Config" button. This will open the configuration panel with all the values that can be edited. The configuration panel has only one button "SAVE" to close and save the parameters.
