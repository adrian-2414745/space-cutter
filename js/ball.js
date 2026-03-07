export function createBall(rect, config) {
  const padding = config.ballRadius * 2;
  const x = rect.x + padding + Math.random() * (rect.width - padding * 2);
  const y = rect.y + padding + Math.random() * (rect.height - padding * 2);
  const angle = Math.random() * Math.PI * 2;
  return {
    x, y,
    vx: Math.cos(angle) * config.ballSpeed,
    vy: Math.sin(angle) * config.ballSpeed,
    radius: config.ballRadius,
  };
}

export function updateBall(ball, rect, dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  const left = rect.x + ball.radius;
  const right = rect.x + rect.width - ball.radius;
  const top = rect.y + ball.radius;
  const bottom = rect.y + rect.height - ball.radius;

  if (ball.x <= left) {
    ball.x = left;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x >= right) {
    ball.x = right;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y <= top) {
    ball.y = top;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y >= bottom) {
    ball.y = bottom;
    ball.vy = -Math.abs(ball.vy);
  }
}

export function isBallInRect(ball, rect) {
  return ball.x >= rect.x && ball.x <= rect.x + rect.width &&
         ball.y >= rect.y && ball.y <= rect.y + rect.height;
}
