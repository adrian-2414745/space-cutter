import { isMobile, computeMobileSizing } from './mobile.js';
import { initTouch, consumeTouchDelta, setDoubleTapCallback } from './touch.js';
import { config } from './config.js';
import { gameState, setState, resetState, RUNNING, CUTTING, PAUSED, GAME_OVER, WIN } from './state.js';
import { createInitialRectangle } from './rectangle.js';
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

let rect, poly, scissors;
let pendingDoubleTap = false;

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
  resetState(config.timerDuration);
  if (canvas) {
    resizeCanvas();
    applyMobileSizing();
    rect = createInitialRectangle(config, canvas.width, canvas.height);
  }
  poly = createPolygonFromRect(rect);
  scissors = createScissors(poly);
  gameState.originalArea = polygonArea(poly);
  gameState.balls = reconcileBalls(poly, [], config, gameState.originalArea);
}

export function initGameWorld(initialRect) {
  rect = initialRect;
  poly = createPolygonFromRect(rect);
  scissors = createScissors(poly);
  gameState.originalArea = polygonArea(poly);
  gameState.balls = reconcileBalls(poly, [], config, gameState.originalArea);
}

export function getWorld() {
  return { poly, scissors, rect };
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
    if (gameState.state === RUNNING || gameState.state === CUTTING) {
      gameState.previousState = gameState.state;
      setState(PAUSED);
    } else if (gameState.state === PAUSED) {
      setState(gameState.previousState || RUNNING);
      gameState.previousState = null;
    }
  }

  if (gameState.state !== RUNNING && gameState.state !== CUTTING) {
    return;
  }

  gameState.timeRemaining = Math.max(0, gameState.timeRemaining - dt);

  if (gameState.timeRemaining <= 0) {
    gameState.finalScore = calculateScore(
      gameState.score, false, 0, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    setState(GAME_OVER);
    return;
  }

  gameState.balls = gameState.balls.map(b => updateBall(b, poly, dt));

  if (gameState.state === RUNNING) {
    if (input.isMobile) {
      updateScissorsMovementTouch(scissors, poly, config, input.touchDeltaX);
    } else {
      updateScissorsMovement(scissors, poly, dt, config, { left: input.left, right: input.right });
    }

    if (input.action) {
      initiateCut(scissors, poly);
      setState(CUTTING);
    }
  } else if (gameState.state === CUTTING) {
    updateScissorsCut(scissors, poly, dt, config);

    if (checkCutCollision(gameState.balls, scissors)) {
      gameState.failedCuts++;
      cancelCut(scissors);
      setState(RUNNING);
      return;
    }

    if (scissors.cutPhase === 1) {
      // Player-triggered Phase 2: action (spacebar/double-tap) while in Phase 1
      const playerTriggered = input.action && canCompleteCut(scissors, poly, config);

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

