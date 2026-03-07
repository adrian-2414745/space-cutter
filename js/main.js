import { config } from './config.js';
import { gameState, setState, RUNNING, CUTTING, PAUSED, GAME_OVER, WIN } from './state.js';
import { createInitialRectangle, splitRectangle } from './rectangle.js';
import { clearCanvas, drawRectangle, drawScore, drawTimer, drawPausedOverlay, drawGameOverMessage, drawWinMessage, drawScissors, drawCutLine, drawBalls } from './renderer.js';
import { initUI } from './ui.js';
import { applyConfigToPanel } from './config.js';
import { initInput, consumeKeyPress } from './input.js';
import { createScissors, updateScissorsMovement, isAtCorner, initiateCut, updateScissorsCut, checkCutComplete, repositionScissorsAfterCut } from './scissors.js';
import { createBall, updateBall, isBallInRect } from './ball.js';

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
for (let i = 0; i < config.initialBallCount; i++) {
  gameState.balls.push(createBall(rect, config));
}

applyConfigToPanel();
initInput();
initUI(() => {
  resizeCanvas();
  rect = createInitialRectangle(config, canvas.width, canvas.height);
  scissors = createScissors(rect);
  gameState.balls = [];
  for (let i = 0; i < config.initialBallCount; i++) {
    gameState.balls.push(createBall(rect, config));
  }
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

  for (const ball of gameState.balls) {
    updateBall(ball, rect, dt);
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
      gameState.balls = gameState.balls.filter(b => isBallInRect(b, rect));
      gameState.balls.push(createBall(rect, config));
      gameState.score = Math.round((rect.width * rect.height) / gameState.originalArea * 10000) / 100;
      drawScore(gameState.score);
      if (gameState.score < config.winThreshold) {
        setState(WIN);
        return;
      }
      setState(RUNNING);
    }
  }
}

function render() {
  clearCanvas(ctx, canvas);
  drawRectangle(ctx, rect);
  drawBalls(ctx, gameState.balls);
  drawCutLine(ctx, scissors);
  drawScissors(ctx, scissors, rect);

  if (gameState.state === PAUSED) {
    drawPausedOverlay(ctx, canvas);
  } else if (gameState.state === GAME_OVER) {
    drawGameOverMessage(ctx, canvas, gameState.score);
  } else if (gameState.state === WIN) {
    drawWinMessage(ctx, canvas, gameState.score);
  }
}

requestAnimationFrame(gameLoop);
