export const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

/**
 * Compute mobile-specific visual sizing, locked at game-start.
 * @param {number} rectWidth - the original rectangle width in canvas pixels
 * @returns {{ scissorsSize: number, ballRadius: number, cornerSnapPx: number }}
 */
export function computeMobileSizing(rectWidth) {
  return {
    scissorsSize: Math.round(rectWidth * 0.05),
    ballRadius:   Math.round(rectWidth * 0.05),
    cornerSnapPx: Math.round(rectWidth * 0.02),
  };
}
