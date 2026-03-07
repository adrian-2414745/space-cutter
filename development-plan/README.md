# Space Cutter — Incremental Development Plan

Based on the [Game Design Document v2](../game-design-document.md) and [TDD Option A](../tdd-option-a.md) (Vanilla Canvas + ES Modules).

Each step is independently testable. Config panel parameters are introduced alongside the features they control.

## Steps

1. [Project Scaffold, Static Rectangle, Start/Reset, Game State](step-1.md)
2. [Timer, Pause, Game Over](step-2.md)
3. [Scissors on Border](step-3.md)
4. [Cutting Mechanic](step-4.md)
5. [Scoring & Win Condition](step-5.md)
6. [Bouncing Balls](step-6.md)
7. [Cut-Line Collision & Ball Spawning](step-7.md)
8. [UI Polish & Animations](step-8.md)

## Summary

| Step | Feature                           | Config Params Added                                        |
|------|-----------------------------------|------------------------------------------------------------|
| 1    | Scaffold, rectangle, state        | Rectangle Width, Rectangle Height                          |
| 2    | Timer, pause, game over           | Timer Duration                                             |
| 3    | Scissors on border                | Scissors Border Speed, Corner Snap Distance                |
| 4    | Cutting mechanic                  | Scissors Cut Speed                                         |
| 5    | Scoring & win condition           | Win Threshold                                              |
| 6    | Bouncing balls                    | Ball Speed, Ball Radius, Initial Ball Count                |
| 7    | Cut-line collision & ball spawn   | (none — uses existing params)                              |
| 8    | UI polish & animations            | (none — visual only)                                       |
