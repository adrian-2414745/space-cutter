# Mobile UX Specification — Space Cutter

## Overview

Adapt the desktop Space Cutter game for mobile browsers. The game must feel native to touch input, not like a ported desktop game. All changes are additive — the desktop experience remains unchanged.

---

## 1. Mobile Detection

Detect mobile using touch-capability check (`'ontouchstart' in window` or `navigator.maxTouchPoints > 0`). On hybrid devices (tablets with keyboards), use **touch controls only** — keyboard input is disabled.

---

## 2. Control Scheme

### Scissors Movement — Swipe

- **Input method:** Swipe on the **canvas area only** to move scissors along the rectangle perimeter.
- **Mapping:** 1:1 positional — swipe 50px on screen = scissors moves 50px along the edge. Direction of the swipe maps to the direction of movement along the current edge.
- **Dead zone:** 8px minimum swipe distance before movement registers, to prevent accidental input from taps.
- **Corner traversal:** When scissors reaches a corner during a swipe, it wraps to the adjacent edge and continues following the swipe direction. The user does not need to lift and re-swipe.
- **Multi-finger handling:** If a swipe is active (finger down) and a double-tap fires from a second finger, the swipe remains active — both gestures coexist.
- **Swipe during cut:** Swipe input is **ignored** while a cut is in progress. This preserves the same behavior as desktop (scissors movement is locked during a cut).
- **Corner swipe ambiguity:** If scissors is at a corner and the user swipes diagonally, the **dominant axis** (axis with the larger delta) determines which edge the scissors moves along.

### Cut — Double-Tap

- **Trigger:** Double-tap anywhere on the canvas to initiate a cut (replaces spacebar).
- **Timing window:** 300ms max interval between taps (standard mobile double-tap).
- **Distance threshold:** The second tap must land within **30px** of the first tap to count as a double-tap. This prevents swipe-lift-tap sequences from triggering accidental cuts.
- **Cut-in-progress:** Once a cut starts, it auto-completes (same as desktop). No cancel mechanism.
- **Guard:** Double-tap is ignored if scissors is at a corner (same rule as desktop — cannot cut from a corner).

### No Pause

There is no pause functionality on mobile. The game runs until win, game over, or reset.

### No Virtual Joystick

The swipe control scheme is sufficient. No on-screen joystick or d-pad.

---

## 3. Screen Layout — Portrait Only

The game is **strict portrait only**. Use CSS `orientation: portrait` media queries and/or the Screen Orientation API to enforce portrait mode. No landscape layout is provided — if the user rotates to landscape, the game remains in portrait layout.

### Layout Stack (top to bottom)

```
┌─────────────────────────┐
│  Safe area (top inset)  │
├─────────────────────────┤
│  HUD: Area % | Timer |  │
│        Score             │  ← compact, single row
├─────────────────────────┤
│                         │
│                         │
│      Game Canvas        │  ← fills remaining space
│    (auto-sized)         │
│                         │
│                         │
├─────────────────────────┤
│  Buttons: Start | Reset │
│    | Config | ?         │  ← single row
├─────────────────────────┤
│  Safe area (bot inset)  │
└─────────────────────────┘
```

### Canvas Auto-Sizing

- On mobile, the `rectWidth` and `rectHeight` config parameters are **ignored**.
- Canvas width = screen width minus horizontal safe-area insets and minimal padding.
- Canvas height = remaining vertical space after HUD (top) and button row (bottom), minus vertical safe-area insets.
- The canvas aspect ratio varies by device — no fixed ratio is enforced.
- The playing rectangle fills the canvas with standard canvas padding.
- The config panel **hides** the Rectangle Width and Rectangle Height fields on mobile.
- **No re-layout:** Canvas size is computed once at game start (or page load). Browser resizes mid-game (address bar hide/show, keyboard popup) do **not** trigger re-layout. This keeps the UI simple and avoids gameplay disruption.

### Safe Areas

Respect `env(safe-area-inset-*)` CSS variables. The HUD, canvas, and button row must all remain within the safe area (no content behind notches, dynamic islands, or rounded corners).

### HUD

- Stays at the **top** of the screen, above the canvas.
- Compact sizing — smaller font than desktop but still readable (16-18px).
- Same three metrics: Area %, Timer, Score.

---

## 4. Dynamic Element Sizing

On mobile, visual elements scale relative to the canvas to remain visible and tappable on all screen sizes.

### Scissors Indicator

- Size = **5% of the original rectangle width at game start** (instead of fixed 8px). This value is locked for the entire game session — it does not change as the rectangle shrinks from cuts.
- The scissors size config parameter is **hidden** on mobile.

### Ball Radius

- Radius = **5% of the original rectangle width at game start** (instead of fixed 6px). Same as scissors — locked at game start, does not change as the rectangle shrinks.
- The ball radius config parameter is **hidden** on mobile.

### Cut Line

- Line width scales proportionally (2-3x desktop thickness) for visibility.

---

## 5. UI Panels

### Config Panel

- On mobile, renders as a **single-column scrollable panel** instead of the desktop 3-column grid.
- **Hidden parameters on mobile:** Rectangle Width, Rectangle Height, Scissors Size, Ball Radius (these are auto-computed).
- Remains only editable in IDLE state.

### Game Description / Help — "?" Button

- The game description text (currently below buttons on desktop) is **hidden on mobile**.
- A new **"?" button** is added to the bottom button row.
- Tapping "?" opens an **overlay panel** (similar in style to the config panel) showing the game description and mobile controls explanation.
- The overlay can be dismissed by tapping outside it or a close button.

### Bottom Buttons

All existing buttons remain: **Start | Reset | Config | ?** (new).

---

## 6. Mobile Default Configuration

Mobile uses a **separate set of default values** tuned for touch controls, which are inherently slower and less precise than keyboard.

| Parameter         | Desktop Default | Mobile Default | Rationale                          |
|-------------------|----------------|----------------|------------------------------------|
| Timer Duration    | 180s           | 240s           | More time to compensate for swipe  |
| Ball Speed        | 150            | 120            | Slower to allow reaction time      |
| Corner Snap Dist  | 8px            | 2% of rect width | Relative to rectangle, scales with screen |
| Scissors Speed    | 250            | 250            | Same — 1:1 swipe controls speed   |
| Cut Speed         | 300            | 300            | Same — auto-animation unchanged    |
| Win Threshold     | 15%            | 15%            | Same                               |
| Initial Balls     | 2              | 2              | Same                               |
| Fail Penalty      | low            | low            | Same                               |

These defaults load automatically on mobile. The user can still adjust them via the config panel.

### Config Persistence

**No persistence.** Config values are not saved to localStorage or any backend. All settings reset to defaults on page reload. Config only survives for the current browser session (tab lifetime).

---

## 7. Minimum Supported Screen

- Minimum width: **360px logical pixels** (CSS pixels) — covers most modern phones.
- Devices narrower than 360px are not officially supported.
- No specific handling for unsupported screens (game will render but may be cramped).

---

## 8. What Does NOT Change on Mobile

- Game state machine (IDLE, RUNNING, CUTTING, GAME_OVER, WIN, PAUSED - keep PAUSE as it wont affect behavior since there is no pause on mobile)
- Cut mechanics (perpendicular to edge, collision detection, split logic).
- Ball physics (reflection, pass-through, spawning).
- Scoring formula.
- Renderer (same Canvas draw calls, just scaled elements).
- No haptic feedback.
- No touch-point visual indicators.
- No mobile-specific animations or screen effects.

---
