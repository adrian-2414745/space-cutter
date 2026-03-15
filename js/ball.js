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
  let { x, y, vx, vy, radius } = ball;
  x += vx * dt;
  y += vy * dt;

  const edges = getEdges(poly);
  for (const edge of edges) {
    const dx = edge.x2 - edge.x1;
    const dy = edge.y2 - edge.y1;

    // CW winding inward normal: (-dy, dx)
    const nx = -dy;
    const ny = dx;

    // Use tolerance-based checks (matching polygon.js conventions) so that
    // edges with sub-pixel coordinate differences from near-edge cuts are
    // still recognised as axis-aligned boundaries.
    const EDGE_TOL = 1;
    const isHorizontal = Math.abs(edge.y1 - edge.y2) < EDGE_TOL;
    const isVertical = Math.abs(edge.x1 - edge.x2) < EDGE_TOL;

    if (isHorizontal) {
      const insideBelow = ny > 0;

      const minX = Math.min(edge.x1, edge.x2);
      const maxX = Math.max(edge.x1, edge.x2);
      // Use averaged Y so sub-pixel differences don't shift the boundary
      const edgeY = (edge.y1 + edge.y2) / 2;

      if (x >= minX && x <= maxX) {
        if (insideBelow) {
          const limit = edgeY + radius;
          if (y < limit) {
            y = limit;
            vy = Math.abs(vy);
          }
        } else {
          const limit = edgeY - radius;
          if (y > limit) {
            y = limit;
            vy = -Math.abs(vy);
          }
        }
      }
    } else if (isVertical) {
      const insideRight = nx > 0;

      const minY = Math.min(edge.y1, edge.y2);
      const maxY = Math.max(edge.y1, edge.y2);
      // Use averaged X so sub-pixel differences don't shift the boundary
      const edgeX = (edge.x1 + edge.x2) / 2;

      if (y >= minY && y <= maxY) {
        if (insideRight) {
          const limit = edgeX + radius;
          if (x < limit) {
            x = limit;
            vx = Math.abs(vx);
          }
        } else {
          const limit = edgeX - radius;
          if (x > limit) {
            x = limit;
            vx = -Math.abs(vx);
          }
        }
      }
    }
  }

  return { x, y, vx, vy, radius };
}

export function isBallInPolygon(ball, poly) {
  return pointInPolygon(ball.x, ball.y, poly);
}
