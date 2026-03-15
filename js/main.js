import { isMobile, computeMobileSizing } from './mobile.js';
import { initTouch, consumeTouchDelta, setDoubleTapCallback } from './touch.js';
import { config } from './config.js';
import { gameState, setState, RUNNING, CUTTING, PAUSED, GAME_OVER, WIN } from './state.js';
import { createInitialRectangle } from './rectangle.js';
import { createPolygonFromRect, polygonArea, raycastToEdge } from './polygon.js';
import { clearCanvas, drawPolygon, drawScore, drawLiveScore, drawTimer, drawPausedOverlay, drawGameOverMessage, drawWinMessage, drawScissors, drawCutLine, drawPreviewLine, drawBalls } from './renderer.js';
import { initUI } from './ui.js';
import { applyConfigToPanel } from './config.js';
import { initInput, consumeKeyPress, isKeyDown } from './input.js';
import { createScissors, updateScissorsMovement, updateScissorsMovementTouch, initiateCut, updateScissorsCut, checkCutComplete, repositionScissorsAfterCut, cancelCut, canCompleteCut, triggerPhase2 } from './scissors.js';
import { updateBall } from './ball.js';
import { calculateScore } from './scoring.js';
import { reconcileBalls, applyCompletedCut, applyStraightCut, checkCutCollision } from './game.js';

console.log('isMobile:', isMobile);

const CANVAS_PADDING = 40;
const MOBILE_CANVAS_PADDING = 16;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let mobileSizing = null;

function resizeCanvas() {
  if (isMobile) {
    const hud = document.getElementById('hud');
    const controls = document.getElementById('controls');
    const hudH = hud.getBoundingClientRect().height || 44;
    const ctrlH = controls.getBoundingClientRect().height || 52;
    const gaps = 16;

    canvas.width = window.innerWidth;
    canvas.height = Math.max(200, window.innerHeight - hudH - ctrlH - gaps);

    config.rectWidth = canvas.width - MOBILE_CANVAS_PADDING * 2;
    config.rectHeight = canvas.height - MOBILE_CANVAS_PADDING * 2;
  } else {
    canvas.width = Math.max(600, config.rectWidth + CANVAS_PADDING * 2);
    canvas.height = Math.max(400, config.rectHeight + CANVAS_PADDING * 2);
  }
}

function applyMobileSizing() {
  if (!isMobile) return;
  mobileSizing = computeMobileSizing(config.rectWidth);
  config.cornerSnapDistance = mobileSizing.cornerSnapPx;
}

resizeCanvas();
applyMobileSizing();
let rect = createInitialRectangle(config, canvas.width, canvas.height);
let poly = createPolygonFromRect(rect);
let scissors = createScissors(poly);
gameState.originalArea = polygonArea(poly);
gameState.timeRemaining = config.timerDuration;
gameState.balls = reconcileBalls(poly, gameState.balls, config, gameState.originalArea);

applyConfigToPanel();
initInput();
if (isMobile) {
  initTouch(canvas);
  setDoubleTapCallback(() => {
    if (gameState.state === RUNNING) {
      initiateCut(scissors, poly);
      setState(CUTTING);
    } else if (gameState.state === CUTTING && canCompleteCut(scissors, poly, config)) {
      triggerPhase2(scissors, poly);
    }
  });
}
initUI(() => {
  resizeCanvas();
  applyMobileSizing();
  rect = createInitialRectangle(config, canvas.width, canvas.height);
  poly = createPolygonFromRect(rect);
  scissors = createScissors(poly);
  gameState.originalArea = polygonArea(poly);
  gameState.balls = [];
  gameState.balls = reconcileBalls(poly, gameState.balls, config, gameState.originalArea);
});

let lastTime = performance.now();

function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (!isMobile && (consumeKeyPress('p') || consumeKeyPress('P'))) {
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
  } else {
    consumeKeyPress(' ');
  }

  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  gameState.timeRemaining = Math.max(0, gameState.timeRemaining - dt);

  if (gameState.timeRemaining <= 0) {
    gameState.finalScore = calculateScore(
      gameState.score, false, 0, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    setState(GAME_OVER);
    return;
  }

  for (const ball of gameState.balls) {
    updateBall(ball, poly, dt);
  }

  if (gameState.state === RUNNING) {
    if (isMobile) {
      const { x: tdx } = consumeTouchDelta();
      updateScissorsMovementTouch(scissors, poly, config, tdx);
    } else {
      const input = { left: isKeyDown('ArrowLeft'), right: isKeyDown('ArrowRight') };
      updateScissorsMovement(scissors, poly, dt, config, input);
    }

    if (!isMobile && consumeKeyPress(' ')) {
      initiateCut(scissors, poly);
      setState(CUTTING);
    }
  } else if (gameState.state === CUTTING) {
    if (isMobile) consumeTouchDelta(); // drain to prevent accumulated delta after cut ends
    updateScissorsCut(scissors, poly, dt, config);

    if (checkCutCollision(gameState.balls, scissors)) {
      gameState.failedCuts++;
      cancelCut(scissors);
      setState(RUNNING);
      return;
    }

    if (scissors.cutPhase === 1) {
      // Player-triggered Phase 2: spacebar/double-tap while in Phase 1 (takes priority)
      const playerTriggered = !isMobile && consumeKeyPress(' ') && canCompleteCut(scissors, poly, config);

      if (playerTriggered) {
        triggerPhase2(scissors, poly);
      } else {
        // Auto: when Phase 1 cut reaches opposite boundary → straight cut
        const hit = raycastToEdge(
          scissors.cutCurrent.x, scissors.cutCurrent.y,
          scissors.cutDirection, poly
        );
        const nearBoundary = !hit || hit.distance < 2;
        if (nearBoundary) {
          completeStraightCut();
        }
      }
    } else if (scissors.cutPhase === 2) {
      if (checkCutComplete(scissors)) {
        completeCut();
      }
    }
  }
}

function completeCut() {
  gameState.successfulCuts++;
  const result = applyCompletedCut(poly, scissors, gameState.originalArea, config);
  repositionScissorsAfterCut(scissors, result.newPoly);
  poly = result.newPoly;
  gameState.balls = reconcileBalls(poly, gameState.balls, config, gameState.originalArea);
  gameState.score = result.score;
  drawScore(gameState.score);
  if (result.won) {
    gameState.finalScore = calculateScore(
      gameState.score, true, gameState.timeRemaining, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    setState(WIN);
    return;
  }
  setState(RUNNING);
}

function completeStraightCut() {
  gameState.successfulCuts++;
  const result = applyStraightCut(poly, scissors, gameState.originalArea, config);
  repositionScissorsAfterCut(scissors, result.newPoly, result.exitPoint);
  poly = result.newPoly;
  gameState.balls = reconcileBalls(poly, gameState.balls, config, gameState.originalArea);
  gameState.score = result.score;
  drawScore(gameState.score);
  if (result.won) {
    gameState.finalScore = calculateScore(
      gameState.score, true, gameState.timeRemaining, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    setState(WIN);
    return;
  }
  setState(RUNNING);
}

function render() {
  clearCanvas(ctx, canvas);
  drawPolygon(ctx, poly);
  drawBalls(ctx, gameState.balls);
  drawCutLine(ctx, scissors);
  drawPreviewLine(ctx, scissors, poly);
  drawScissors(ctx, scissors, poly);
  drawTimer(gameState.timeRemaining);
  const liveScore = calculateScore(
    gameState.score, false, gameState.timeRemaining, config.timerDuration,
    gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
  );
  drawLiveScore(liveScore);

  if (gameState.state === PAUSED) {
    drawPausedOverlay(ctx, canvas);
  } else if (gameState.state === GAME_OVER) {
    drawGameOverMessage(ctx, canvas, gameState.score, gameState.finalScore);
  } else if (gameState.state === WIN) {
    drawWinMessage(ctx, canvas, gameState.score, gameState.finalScore);
  }
}

requestAnimationFrame(gameLoop);
