import { isMobile, computeMobileSizing } from './mobile.js';
import { initTouch, consumeTouchDelta, setDoubleTapCallback } from './touch.js';
import { config } from './config.js';
import { createGameState, IDLE, RUNNING, CUTTING, PAUSED, GAME_OVER, WIN } from './state.js';
export { IDLE, RUNNING };
import { createPolygonFromRect, polygonArea, raycastToEdge } from './polygon.js';
import { clearCanvas, drawPolygon, drawScore, drawLiveScore, drawTimer, drawPausedOverlay, drawGameOverMessage, drawWinMessage, drawScissors, drawCutLine, drawPreviewLine, drawBalls } from './renderer.js';
import { initUI, applyConfigToPanel } from './ui.js';
import { initInput, consumeKeyPress, isKeyDown } from './input.js';
import { createScissors, updateScissorsMovement, updateScissorsMovementTouch, initiateCut, updateScissorsCut, checkCutComplete, repositionScissorsAfterCut, cancelCut, canCompleteCut, triggerPhase2 } from './scissors.js';
import { updateBall } from './ball.js';
import { calculateScore } from './scoring.js';
import { reconcileBalls, applyCompletedCut, applyStraightCut, checkCutCollision } from './game.js';

const CANVAS_PADDING = 40;
const MOBILE_CANVAS_PADDING = 16;

let canvas, ctx, mobileSizing;

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

let gameState;
let pendingDoubleTap = false;

export function setState(newPhase) {
  gameState.phase = newPhase;
}

export { gameState };

export function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  resetGameWorld();

  applyConfigToPanel();
  initInput();
  if (isMobile) {
    initTouch(canvas);
    setDoubleTapCallback(() => { pendingDoubleTap = true; });
  }
  initUI(resetGameWorld);

  requestAnimationFrame(gameLoop);
}

export function resetGameWorld() {
  if (canvas) {
    resizeCanvas();
    applyMobileSizing();
  }
  gameState = createGameState(config, canvas);
  gameState.poly = createPolygonFromRect(gameState.rect);
  gameState.scissors = createScissors(gameState.poly);
  gameState.originalArea = polygonArea(gameState.poly);
  gameState.balls = reconcileBalls(gameState.poly, [], config, gameState.originalArea);
}

export function initGameWorld(initialRect) {
  gameState.rect = initialRect;
  gameState.poly = createPolygonFromRect(gameState.rect);
  gameState.scissors = createScissors(gameState.poly);
  gameState.originalArea = polygonArea(gameState.poly);
  gameState.balls = reconcileBalls(gameState.poly, [], config, gameState.originalArea);
}

export function getWorld() {
  return { poly: gameState.poly, scissors: gameState.scissors, rect: gameState.rect };
}

let lastTime;

function gameLoop(now) {
  if (lastTime === undefined) lastTime = now;
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  const touchDelta = isMobile ? consumeTouchDelta() : null;
  const input = {
    isMobile,
    left: isKeyDown('ArrowLeft'),
    right: isKeyDown('ArrowRight'),
    action: isMobile ? pendingDoubleTap : consumeKeyPress(' '),
    pausePressed: !isMobile && (consumeKeyPress('p') || consumeKeyPress('P')),
    touchDeltaX: touchDelta ? touchDelta.x : 0,
  };
  pendingDoubleTap = false;

  update(dt, input);
  render();
  requestAnimationFrame(gameLoop);
}

export function update(dt, input) {
  if (input.pausePressed) {
    if (gameState.phase === RUNNING || gameState.phase === CUTTING) {
      gameState.previousPhase = gameState.phase;
      gameState.phase = PAUSED;
    } else if (gameState.phase === PAUSED) {
      gameState.phase = gameState.previousPhase || RUNNING;
      gameState.previousPhase = null;
    }
  }

  if (gameState.phase !== RUNNING && gameState.phase !== CUTTING) {
    return;
  }

  gameState.timeRemaining = Math.max(0, gameState.timeRemaining - dt);

  if (gameState.timeRemaining <= 0) {
    gameState.finalScore = calculateScore(
      gameState.score, false, 0, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    gameState.phase = GAME_OVER;
    return;
  }

  gameState.balls = gameState.balls.map(b => updateBall(b, gameState.poly, dt));

  if (gameState.phase === RUNNING) {
    if (input.isMobile) {
      gameState.scissors = updateScissorsMovementTouch(gameState.scissors, gameState.poly, config, input.touchDeltaX);
    } else {
      gameState.scissors = updateScissorsMovement(gameState.scissors, gameState.poly, dt, config, { left: input.left, right: input.right });
    }

    if (input.action) {
      gameState.scissors = initiateCut(gameState.scissors, gameState.poly);
      gameState.phase = CUTTING;
    }
  } else if (gameState.phase === CUTTING) {
    gameState.scissors = updateScissorsCut(gameState.scissors, gameState.poly, dt, config);

    if (checkCutCollision(gameState.balls, gameState.scissors)) {
      gameState.failedCuts++;
      gameState.scissors = cancelCut(gameState.scissors);
      gameState.phase = RUNNING;
      return;
    }

    if (gameState.scissors.cutPhase === 1) {
      // Player-triggered Phase 2: action (spacebar/double-tap) while in Phase 1
      const playerTriggered = input.action && canCompleteCut(gameState.scissors, gameState.poly, config);

      if (playerTriggered) {
        gameState.scissors = triggerPhase2(gameState.scissors, gameState.poly);
      } else {
        // Auto: when Phase 1 cut reaches opposite boundary → straight cut
        const hit = raycastToEdge(
          gameState.scissors.cutCurrent.x, gameState.scissors.cutCurrent.y,
          gameState.scissors.cutDirection, gameState.poly
        );
        const nearBoundary = !hit || hit.distance < 2;
        if (nearBoundary) {
          completeStraightCut();
        }
      }
    } else if (gameState.scissors.cutPhase === 2) {
      if (checkCutComplete(gameState.scissors)) {
        completeCut();
      }
    }
  }
}

function completeCut() {
  gameState.successfulCuts++;
  const result = applyCompletedCut(gameState.poly, gameState.scissors, gameState.originalArea, config);
  gameState.scissors = repositionScissorsAfterCut(gameState.scissors, result.newPoly);
  gameState.poly = result.newPoly;
  gameState.balls = reconcileBalls(gameState.poly, gameState.balls, config, gameState.originalArea);
  gameState.score = result.score;
  drawScore(gameState.score);
  if (result.won) {
    gameState.finalScore = calculateScore(
      gameState.score, true, gameState.timeRemaining, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    gameState.phase = WIN;
    return;
  }
  gameState.phase = RUNNING;
}

function completeStraightCut() {
  gameState.successfulCuts++;
  const result = applyStraightCut(gameState.poly, gameState.scissors, gameState.originalArea, config);
  gameState.scissors = repositionScissorsAfterCut(gameState.scissors, result.newPoly, result.exitPoint);
  gameState.poly = result.newPoly;
  gameState.balls = reconcileBalls(gameState.poly, gameState.balls, config, gameState.originalArea);
  gameState.score = result.score;
  drawScore(gameState.score);
  if (result.won) {
    gameState.finalScore = calculateScore(
      gameState.score, true, gameState.timeRemaining, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    gameState.phase = WIN;
    return;
  }
  gameState.phase = RUNNING;
}

function render() {
  clearCanvas(ctx, canvas);
  drawPolygon(ctx, gameState.poly);
  drawBalls(ctx, gameState.balls);
  drawCutLine(ctx, gameState.scissors);
  drawPreviewLine(ctx, gameState.scissors, gameState.poly);
  drawScissors(ctx, gameState.scissors, gameState.poly);
  drawTimer(gameState.timeRemaining);
  const liveScore = calculateScore(
    gameState.score, false, gameState.timeRemaining, config.timerDuration,
    gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
  );
  drawLiveScore(liveScore);

  if (gameState.phase === PAUSED) {
    drawPausedOverlay(ctx, canvas);
  } else if (gameState.phase === GAME_OVER) {
    drawGameOverMessage(ctx, canvas, gameState.score, gameState.finalScore);
  } else if (gameState.phase === WIN) {
    drawWinMessage(ctx, canvas, gameState.score, gameState.finalScore);
  }
}

