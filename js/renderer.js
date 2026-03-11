import { getScissorsScreenPosition, getPreviewLine } from './scissors.js';
import { edgeDirection } from './polygon.js';

export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawPolygon(ctx, poly) {
  ctx.fillStyle = '#16213e';
  ctx.beginPath();
  for (let i = 0; i < poly.vertices.length; i++) {
    const v = poly.vertices[i];
    if (i === 0) {
      ctx.moveTo(v.x, v.y);
    } else {
      ctx.lineTo(v.x, v.y);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawScore(score) {
  document.getElementById('score-display').textContent = score.toFixed(2) + '%';
}

export function drawLiveScore(liveScore) {
  document.getElementById('live-score-display').textContent = liveScore.toLocaleString();
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

export function drawGameOverMessage(ctx, canvas, score, finalScore) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('Score: ' + (finalScore != null ? finalScore.toLocaleString() : '0'), canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText('Area: ' + score + '%', canvas.width / 2, canvas.height / 2 + 50);
}

export function drawWinMessage(ctx, canvas, score, finalScore) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff88';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('Score: ' + (finalScore != null ? finalScore.toLocaleString() : '0'), canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText('Area: ' + score.toFixed(2) + '%', canvas.width / 2, canvas.height / 2 + 50);
}

export function drawCutLine(ctx, scissors) {
  if (!scissors.cutting || !scissors.cutStart) return;
  ctx.save();
  ctx.setLineDash([8, 4]);
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(scissors.cutStart.x, scissors.cutStart.y);
  if (scissors.cutTurn) {
    ctx.lineTo(scissors.cutTurn.x, scissors.cutTurn.y);
  }
  ctx.lineTo(scissors.cutCurrent.x, scissors.cutCurrent.y);
  ctx.stroke();
  ctx.restore();
}

export function drawPreviewLine(ctx, scissors, poly) {
  if (!scissors.cutting) return;
  const preview = getPreviewLine(scissors, poly);
  if (!preview || preview.length === 0) return;
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = 'rgba(255, 68, 68, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(preview[0].x, preview[0].y);
  for (let i = 1; i < preview.length; i++) {
    ctx.lineTo(preview[i].x, preview[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawScissors(ctx, scissors, poly) {
  const pos = getScissorsScreenPosition(scissors, poly);
  const size = 16;
  const dir = edgeDirection(poly, scissors.edgeIndex);

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  switch (dir) {
    case 'down':
      ctx.moveTo(pos.x - size / 2, pos.y);
      ctx.lineTo(pos.x + size / 2, pos.y);
      ctx.lineTo(pos.x, pos.y + size);
      break;
    case 'up':
      ctx.moveTo(pos.x - size / 2, pos.y);
      ctx.lineTo(pos.x + size / 2, pos.y);
      ctx.lineTo(pos.x, pos.y - size);
      break;
    case 'right':
      ctx.moveTo(pos.x, pos.y - size / 2);
      ctx.lineTo(pos.x, pos.y + size / 2);
      ctx.lineTo(pos.x + size, pos.y);
      break;
    case 'left':
      ctx.moveTo(pos.x, pos.y - size / 2);
      ctx.lineTo(pos.x, pos.y + size / 2);
      ctx.lineTo(pos.x - size, pos.y);
      break;
  }
  ctx.closePath();
  ctx.fill();
}

export function drawBalls(ctx, balls) {
  ctx.fillStyle = '#ff6644';
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTimer(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  document.getElementById('timer-display').textContent =
    minutes + ':' + String(seconds).padStart(2, '0');
}
