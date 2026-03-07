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
};

export function setState(newState) {
  gameState.state = newState;
}
