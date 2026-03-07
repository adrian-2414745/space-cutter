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

export function drawTimer(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  document.getElementById('timer-display').textContent =
    minutes + ':' + String(seconds).padStart(2, '0');
}
