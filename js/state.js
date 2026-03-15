export const IDLE = 'IDLE';
export const RUNNING = 'RUNNING';
export const PAUSED = 'PAUSED';
export const CUTTING = 'CUTTING';
export const GAME_OVER = 'GAME_OVER';
export const WIN = 'WIN';

export const gameState = {
  state: IDLE,
  previousState: null,
  score: 100,
  originalArea: 0,
  timeRemaining: 180,
  balls: [],
  successfulCuts: 0,
  failedCuts: 0,
  finalScore: null,
};

export function setState(newState) {
  gameState.state = newState;
}

export function resetState(timerDuration) {
  gameState.state = IDLE;
  gameState.score = 100;
  gameState.timeRemaining = timerDuration;
  gameState.successfulCuts = 0;
  gameState.failedCuts = 0;
  gameState.finalScore = null;
}
