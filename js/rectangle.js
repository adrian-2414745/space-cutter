import { gameState } from './state.js';

export function createInitialRectangle(config, canvasWidth, canvasHeight) {
  const rect = {
    x: (canvasWidth - config.rectWidth) / 2,
    y: (canvasHeight - config.rectHeight) / 2,
    width: config.rectWidth,
    height: config.rectHeight,
  };
  gameState.originalArea = rect.width * rect.height;
  return rect;
}

export function splitRectangle(rect, cutEdge, cutPos) {
  let pieceA, pieceB;

  if (cutEdge === 'top' || cutEdge === 'bottom') {
    // Vertical cut: split into left and right
    pieceA = { x: rect.x, y: rect.y, width: cutPos, height: rect.height };
    pieceB = { x: rect.x + cutPos, y: rect.y, width: rect.width - cutPos, height: rect.height };
  } else {
    // Horizontal cut: split into top and bottom
    pieceA = { x: rect.x, y: rect.y, width: rect.width, height: cutPos };
    pieceB = { x: rect.x, y: rect.y + cutPos, width: rect.width, height: rect.height - cutPos };
  }

  const areaA = pieceA.width * pieceA.height;
  const areaB = pieceB.width * pieceB.height;

  // Keep the larger piece (tiebreaker: keep left/top = pieceA)
  return areaA >= areaB ? pieceA : pieceB;
}
