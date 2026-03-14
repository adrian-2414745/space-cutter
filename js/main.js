import { isMobile, computeMobileSizing } from './mobile.js';
import { initTouch, consumeTouchDelta, setDoubleTapCallback } from './touch.js';
import { config } from './config.js';
import { gameState, setState, RUNNING, CUTTING, PAUSED, GAME_OVER, WIN } from './state.js';
import { createInitialRectangle } from './rectangle.js';
import { createPolygonFromRect, polygonArea, nibblePolygon, splitPolygon, raycastToEdge } from './polygon.js';
import { clearCanvas, drawPolygon, drawScore, drawLiveScore, drawTimer, drawPausedOverlay, drawGameOverMessage, drawWinMessage, drawScissors, drawCutLine, drawPreviewLine, drawBalls } from './renderer.js';
import { initUI } from './ui.js';
import { applyConfigToPanel } from './config.js';
import { initInput, consumeKeyPress } from './input.js';
import { createScissors, updateScissorsMovement, updateScissorsMovementTouch, isAtCorner, initiateCut, updateScissorsCut, checkCutComplete, repositionScissorsAfterCut, cancelCut, canCompleteCut, triggerPhase2 } from './scissors.js';
import { createBall, updateBall, isBallInPolygon } from './ball.js';
import { ballIntersectsLCut } from './collision.js';
import { calculateScore } from './scoring.js';

console.log('isMobile:', isMobile);

function reconcileBalls(poly) {
  const area = polygonArea(poly);
  gameState.balls = gameState.balls.filter(b => isBallInPolygon(b, poly));
  const target = Math.max(config.minBalls, Math.floor(area / config.ballDensityPx2));
  const delta = target - gameState.balls.length;
  if (delta > 0) {
    for (let i = 0; i < delta; i++) {
      gameState.balls.push(createBall(poly, config));
    }
  } else if (delta < 0) {
    for (let i = gameState.balls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameState.balls[i], gameState.balls[j]] = [gameState.balls[j], gameState.balls[i]];
    }
    gameState.balls.length = target;
  }
}

const CANVAS_PADDING = 40;
const MOBILE_CANVAS_PADDING = 16;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let mobileSizing = null;

function resizeCanvas() {
  if (isMobile) {
    const hud      = document.getElementById('hud');
    const controls = document.getElementById('controls');
    const hudH     = hud.getBoundingClientRect().height  || 44;
    const ctrlH    = controls.getBoundingClientRect().height || 52;
    const gaps     = 16;

    canvas.width  = window.innerWidth;
    canvas.height = Math.max(200, window.innerHeight - hudH - ctrlH - gaps);

    config.rectWidth  = canvas.width  - MOBILE_CANVAS_PADDING * 2;
    config.rectHeight = canvas.height - MOBILE_CANVAS_PADDING * 2;
  } else {
    canvas.width  = Math.max(600, config.rectWidth  + CANVAS_PADDING * 2);
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
reconcileBalls(poly);

applyConfigToPanel();
initInput();
if (isMobile) {
  initTouch(canvas);
  setDoubleTapCallback(() => {
    if (gameState.state === RUNNING && !isAtCorner(scissors, poly)) {
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
  reconcileBalls(poly);
});

drawScore(gameState.score);
drawTimer(gameState.timeRemaining);

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
  drawTimer(gameState.timeRemaining);

  const liveScore = calculateScore(
    gameState.score, false, gameState.timeRemaining, config.timerDuration,
    gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
  );
  drawLiveScore(liveScore);

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
      updateScissorsMovement(scissors, poly, dt, config);
    }

    if (!isMobile && consumeKeyPress(' ') && !isAtCorner(scissors, poly)) {
      initiateCut(scissors, poly);
      setState(CUTTING);
    }
  } else if (gameState.state === CUTTING) {
    if (isMobile) consumeTouchDelta(); // drain to prevent accumulated delta after cut ends
    updateScissorsCut(scissors, poly, dt, config);

    if (checkCutCollision()) {
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
  const newPoly = nibblePolygon(poly, scissors.cutStart, scissors.cutTurn, scissors.cutTarget);
  repositionScissorsAfterCut(scissors, newPoly);
  poly = newPoly;
  reconcileBalls(poly);
  gameState.score = Math.round(polygonArea(poly) / gameState.originalArea * 10000) / 100;
  drawScore(gameState.score);
  if (gameState.score < config.winThreshold) {
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
  // Exact exit point: raycast from cutStart in cutDirection to opposite boundary
  const hit = raycastToEdge(
    scissors.cutStart.x, scissors.cutStart.y,
    scissors.cutDirection, poly
  );
  const exitPoint = hit ? hit.point : scissors.cutCurrent;

  gameState.successfulCuts++;
  const newPoly = splitPolygon(poly, scissors.cutStart, exitPoint);
  repositionScissorsAfterCut(scissors, newPoly, exitPoint);
  poly = newPoly;
  reconcileBalls(poly);
  gameState.score = Math.round(polygonArea(poly) / gameState.originalArea * 10000) / 100;
  drawScore(gameState.score);
  if (gameState.score < config.winThreshold) {
    gameState.finalScore = calculateScore(
      gameState.score, true, gameState.timeRemaining, config.timerDuration,
      gameState.successfulCuts, gameState.failedCuts, config.winThreshold, config.failPenalty
    );
    setState(WIN);
    return;
  }
  setState(RUNNING);
}

function checkCutCollision() {
  for (const ball of gameState.balls) {
    if (ballIntersectsLCut(ball, scissors)) {
      return true;
    }
  }
  return false;
}

function render() {
  clearCanvas(ctx, canvas);
  drawPolygon(ctx, poly);
  drawBalls(ctx, gameState.balls);
  drawCutLine(ctx, scissors);
  drawPreviewLine(ctx, scissors, poly);
  drawScissors(ctx, scissors, poly);

  if (gameState.state === PAUSED) {
    drawPausedOverlay(ctx, canvas);
  } else if (gameState.state === GAME_OVER) {
    drawGameOverMessage(ctx, canvas, gameState.score, gameState.finalScore);
  } else if (gameState.state === WIN) {
    drawWinMessage(ctx, canvas, gameState.score, gameState.finalScore);
  }
}

requestAnimationFrame(gameLoop);
