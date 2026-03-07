import { config } from './config.js';
import { gameState, RUNNING, CUTTING } from './state.js';
import { createInitialRectangle } from './rectangle.js';
import { clearCanvas, drawRectangle, drawScore, drawTimer } from './renderer.js';
import { initUI } from './ui.js';
import { applyConfigToPanel } from './config.js';

const CANVAS_PADDING = 40;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = Math.max(600, config.rectWidth + CANVAS_PADDING * 2);
  canvas.height = Math.max(400, config.rectHeight + CANVAS_PADDING * 2);
}

resizeCanvas();
let rect = createInitialRectangle(config, canvas.width, canvas.height);
gameState.timeRemaining = config.timerDuration;

applyConfigToPanel();
initUI(() => {
  resizeCanvas();
  rect = createInitialRectangle(config, canvas.width, canvas.height);
});

drawScore(gameState.score);
drawTimer(gameState.timeRemaining);

let lastTime = performance.now();

function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (gameState.state === RUNNING || gameState.state === CUTTING) {
    update(dt);
  }

  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Future: timer, ball movement, cutting logic
}

function render() {
  clearCanvas(ctx, canvas);
  drawRectangle(ctx, rect);
}

requestAnimationFrame(gameLoop);
