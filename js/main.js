import { config } from './config.js';
import { gameState, setState, RUNNING, CUTTING, PAUSED, GAME_OVER } from './state.js';
import { createInitialRectangle, splitRectangle } from './rectangle.js';
import { clearCanvas, drawRectangle, drawScore, drawTimer, drawPausedOverlay, drawGameOverMessage, drawScissors, drawCutLine } from './renderer.js';
import { initUI } from './ui.js';
import { applyConfigToPanel } from './config.js';
import { initInput, consumeKeyPress } from './input.js';
import { createScissors, updateScissorsMovement, isAtCorner, initiateCut, updateScissorsCut, checkCutComplete, repositionScissorsAfterCut } from './scissors.js';

const CANVAS_PADDING = 40;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = Math.max(600, config.rectWidth + CANVAS_PADDING * 2);
  canvas.height = Math.max(400, config.rectHeight + CANVAS_PADDING * 2);
}

resizeCanvas();
let rect = createInitialRectangle(config, canvas.width, canvas.height);
let scissors = createScissors(rect);
gameState.timeRemaining = config.timerDuration;

applyConfigToPanel();
initInput();
initUI(() => {
  resizeCanvas();
  rect = createInitialRectangle(config, canvas.width, canvas.height);
  scissors = createScissors(rect);
});

drawScore(gameState.score);
drawTimer(gameState.timeRemaining);

let lastTime = performance.now();

function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (consumeKeyPress('p') || consumeKeyPress('P')) {
    if (gameState.state === RUNNING || gameState.state === CUTTING) {
      gameState.previousState = gameState.state;
      setState(PAUSED);
    } else if (gameState.state === PAUSED) {
      setState(gameState.previousState || RUNNING);
      gameState.previousState = null;
    }
  }

  if (gameState.state === RUNNING || gameState.state === CUTTING) {
    update(dt);
  }

  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  gameState.timeRemaining = Math.max(0, gameState.timeRemaining - dt);
  drawTimer(gameState.timeRemaining);

  if (gameState.timeRemaining <= 0) {
    setState(GAME_OVER);
    return;
  }

  if (gameState.state === RUNNING) {
    updateScissorsMovement(scissors, rect, dt, config);

    if (consumeKeyPress(' ') && !isAtCorner(scissors, rect)) {
      initiateCut(scissors, rect);
      setState(CUTTING);
    }
  } else if (gameState.state === CUTTING) {
    updateScissorsCut(scissors, rect, dt, config);

    if (checkCutComplete(scissors, rect)) {
      const newRect = splitRectangle(rect, scissors.cutEdge, scissors.cutPos);
      repositionScissorsAfterCut(scissors, newRect);
      rect = newRect;
      gameState.score = Math.round((rect.width * rect.height) / gameState.originalArea * 1000) / 10;
      drawScore(gameState.score);
      setState(RUNNING);
    }
  }
}

function render() {
  clearCanvas(ctx, canvas);
  drawRectangle(ctx, rect);
  drawCutLine(ctx, scissors);
  drawScissors(ctx, scissors, rect);

  if (gameState.state === PAUSED) {
    drawPausedOverlay(ctx, canvas);
  } else if (gameState.state === GAME_OVER) {
    drawGameOverMessage(ctx, canvas, gameState.score);
  }
}

requestAnimationFrame(gameLoop);
