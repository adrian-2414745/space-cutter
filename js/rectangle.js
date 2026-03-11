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

