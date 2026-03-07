# Step 8: UI Polish & Animations

**Goal:** Visual refinements — discard animation, scissors icon, cut line styling, overall arcade aesthetic.

**Files modified:** `js/renderer.js`, `css/style.css`, `js/main.js`

## Tasks

8.1. **Discard animation**
   - On successful cut, briefly render the discarded piece fading out (reduce alpha over ~0.3s) before removing it
   - Store discarded piece temporarily in gameState for animation

8.2. **Scissors icon**
   - Replace the simple marker with a recognizable scissors shape (drawn with canvas paths or a small sprite)
   - Orient the scissors icon to indicate cut direction (perpendicular to current edge)

8.3. **Cut line styling**
   - Use `setLineDash()` for a dashed line effect
   - Distinct color (e.g., red or bright contrast) for visibility

8.4. **Visual polish**
   - Clean arcade-style color palette
   - Styled score and timer text (font, size, alignment)
   - Button hover/active states in CSS
   - Canvas border or background styling

8.5. **Game state overlays**
   - Polish WIN, GAME_OVER, and PAUSED overlays (centered text, semi-transparent background)

## Tester verification
- Game looks polished and visually clear.
- Discarded pieces fade out smoothly.
- Scissors icon clearly shows which direction it will cut.
- Cut line is dashed and easy to see.
- All overlays (pause, win, game over) are clean and readable.
- Overall aesthetic feels like a clean arcade game.
