import { getEdges, randomPointInPolygon, pointInPolygon } from './polygon.js';

export function createBall(poly, config) {
  const { x, y } = randomPointInPolygon(poly, config.ballRadius * 2);
  const angle = Math.random() * Math.PI * 2;
  return {
    x, y,
    vx: Math.cos(angle) * config.ballSpeed,
    vy: Math.sin(angle) * config.ballSpeed,
    radius: config.ballRadius,
  };
}

export function updateBall(ball, poly, dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  const edges = getEdges(poly);
  for (const edge of edges) {
    const dx = edge.x2 - edge.x1;
    const dy = edge.y2 - edge.y1;

    // CW winding inward normal: (-dy, dx)
    const nx = -dy;
    const ny = dx;

    const isHorizontal = edge.y1 === edge.y2;
    const isVertical = edge.x1 === edge.x2;

    if (isHorizontal) {
      // Determine inside direction from inward normal
      // nx = dy = 0 for horizontal, ny = -dx
      // Edge left-to-right (dx > 0): ny = -dx < 0, inside is above (lower y)... wait,
      // CW normal means inside is in the direction of (dy, -dx).
      // For edge going right (dx > 0): normal is (0, -dx) => pointing down (negative y is up in math,
      // but in screen coords positive y is down). So ny < 0 means inside is upward in screen? No:
      // ny = -dx. If dx > 0, ny < 0, meaning the inward normal points toward negative y (upward on screen).
      // Actually let's just use the sign of ny to determine which side is "inside".
      const insideBelow = ny > 0; // inward normal points toward +y (downward on screen)

      const minX = Math.min(edge.x1, edge.x2);
      const maxX = Math.max(edge.x1, edge.x2);

      if (ball.x >= minX && ball.x <= maxX) {
        if (insideBelow) {
          // Inside is below the edge; ball should be below edge.y1
          const limit = edge.y1 + ball.radius;
          if (ball.y < limit) {
            ball.y = limit;
            ball.vy = Math.abs(ball.vy);
          }
        } else {
          // Inside is above the edge; ball should be above edge.y1
          const limit = edge.y1 - ball.radius;
          if (ball.y > limit) {
            ball.y = limit;
            ball.vy = -Math.abs(ball.vy);
          }
        }
      }
    } else if (isVertical) {
      // nx = dy, ny = 0 for vertical
      // Edge going down (dy > 0): nx = dy > 0, inside is to the right (+x)
      // Edge going up (dy < 0): nx = dy < 0, inside is to the left (-x)
      const insideRight = nx > 0;

      const minY = Math.min(edge.y1, edge.y2);
      const maxY = Math.max(edge.y1, edge.y2);

      if (ball.y >= minY && ball.y <= maxY) {
        if (insideRight) {
          // Inside is to the right of the edge; ball should be right of edge.x1
          const limit = edge.x1 + ball.radius;
          if (ball.x < limit) {
            ball.x = limit;
            ball.vx = Math.abs(ball.vx);
          }
        } else {
          // Inside is to the left of the edge; ball should be left of edge.x1
          const limit = edge.x1 - ball.radius;
          if (ball.x > limit) {
            ball.x = limit;
            ball.vx = -Math.abs(ball.vx);
          }
        }
      }
    }
  }
}

export function isBallInPolygon(ball, poly) {
  return pointInPolygon(ball.x, ball.y, poly);
}
