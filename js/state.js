export const IDLE = 'IDLE';
export const RUNNING = 'RUNNING';
export const PAUSED = 'PAUSED';
export const CUTTING = 'CUTTING';
export const GAME_OVER = 'GAME_OVER';
export const WIN = 'WIN';

function createInitialRectangle(config, canvasWidth, canvasHeight) {
  return {
    x: (canvasWidth - config.rectWidth) / 2,
    y: (canvasHeight - config.rectHeight) / 2,
    width: config.rectWidth,
    height: config.rectHeight,
  };
}

export function createGameState(config, canvas) {
  const rect = canvas ? createInitialRectangle(config, canvas.width, canvas.height) : null;
  return {
    phase: IDLE,
    previousPhase: null,
    score: 100,
    originalArea: 0,
    timeRemaining: config.timerDuration,
    balls: [],
    successfulCuts: 0,
    failedCuts: 0,
    finalScore: null,
    scissors: null,
    poly: null,
    rect,
  };
}
