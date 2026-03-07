import { getScissorsScreenPosition } from './scissors.js';

export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawRectangle(ctx, rect) {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

export function drawScore(score) {
  document.getElementById('score-display').textContent = score + '%';
}

export function drawPausedOverlay(ctx, canvas) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
}

export function drawGameOverMessage(ctx, canvas, score) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.fillText('Score: ' + score + '%', canvas.width / 2, canvas.height / 2 + 30);
}

export function drawCutLine(ctx, scissors) {
  if (!scissors.cutting || !scissors.cutStart) return;
  ctx.save();
  ctx.setLineDash([8, 4]);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(scissors.cutStart.x, scissors.cutStart.y);
  ctx.lineTo(scissors.cutCurrent.x, scissors.cutCurrent.y);
  ctx.stroke();
  ctx.restore();
}

export function drawScissors(ctx, scissors, rect) {
  const pos = getScissorsScreenPosition(scissors, rect);
  const size = 10;

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  switch (scissors.edge) {
    case 'top':
      ctx.moveTo(pos.x - size / 2, pos.y);
      ctx.lineTo(pos.x + size / 2, pos.y);
      ctx.lineTo(pos.x, pos.y + size);
      break;
    case 'bottom':
      ctx.moveTo(pos.x - size / 2, pos.y);
      ctx.lineTo(pos.x + size / 2, pos.y);
      ctx.lineTo(pos.x, pos.y - size);
      break;
    case 'left':
      ctx.moveTo(pos.x, pos.y - size / 2);
      ctx.lineTo(pos.x, pos.y + size / 2);
      ctx.lineTo(pos.x + size, pos.y);
      break;
    case 'right':
      ctx.moveTo(pos.x, pos.y - size / 2);
      ctx.lineTo(pos.x, pos.y + size / 2);
      ctx.lineTo(pos.x - size, pos.y);
      break;
  }
  ctx.closePath();
  ctx.fill();
}

export function drawTimer(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  document.getElementById('timer-display').textContent =
    minutes + ':' + String(seconds).padStart(2, '0');
}
