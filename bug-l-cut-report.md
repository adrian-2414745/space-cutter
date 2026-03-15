/# Bug Report: L-cut over previously cut corner keeps wrong piece

## Description

When the player makes an L-cut that removes a corner of the polygon, and then makes a second L-cut that overlaps or is adjacent to that same already-cut corner, the game keeps the smaller piece and discards the larger one. The result is that the main playing field is thrown away and replaced by the tiny L-shaped offcut.

## Steps to reproduce

1. Start a game with the default 600x600 rectangle.
2. Make an L-cut that removes a rectangular corner (e.g. the top-right corner). This succeeds normally.
3. Make a second L-cut whose cut path crosses into the region near the previously cut corner — specifically, the cut start and cut target land on edges created by the first cut.
4. Observe that after the second cut completes, the polygon snaps to the small cut-off piece instead of the large remaining field.

## Expected behaviour

After any successful L-cut, the larger of the two resulting pieces should be kept as the playing field, and the smaller piece should be discarded. This should hold regardless of how many prior cuts have been made or how complex the polygon shape is.

## Actual behaviour

The smaller piece is kept and the larger piece is discarded, effectively destroying most of the playing field in a single cut.

## Suggested test parameters for `nibblePolygon`

Starting from a 600x600 rectangle at origin (0, 0):

**First cut** — remove top-right corner:
- A = (400, 0) — on top edge
- B = (400, 200) — interior turn point
- C = (600, 200) — on right edge

This produces a 6-vertex L-shaped polygon.

**Second cut** — cut near the same corner on the resulting polygon:
- A = (350, 0) — on top edge
- B = (350, 250) — interior turn point
- C = (600, 250) — on the interior horizontal edge created by the first cut

After the second cut, the returned polygon should be the large piece (most of the original area), not the small rectangle/L-shape that was cut off.
