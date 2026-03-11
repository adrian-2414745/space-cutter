// polygon.js — Rectilinear polygon module for Space Cutter
// Represents a play area with clockwise-wound, axis-aligned vertices.

const TOLERANCE = 1.0;

/**
 * Convert a rect {x, y, width, height} to a polygon with 4 CW vertices.
 * Order: top-left, top-right, bottom-right, bottom-left.
 */
export function createPolygonFromRect(rect) {
    return {
        vertices: [
            { x: rect.x, y: rect.y },
            { x: rect.x + rect.width, y: rect.y },
            { x: rect.x + rect.width, y: rect.y + rect.height },
            { x: rect.x, y: rect.y + rect.height }
        ]
    };
}

/**
 * Returns array of {x1, y1, x2, y2} from consecutive vertex pairs, wrapping last to first.
 */
export function getEdges(poly) {
    const verts = poly.vertices;
    const edges = [];
    for (let i = 0; i < verts.length; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % verts.length];
        edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    return edges;
}

/**
 * Shoelace formula, returns positive area.
 */
export function polygonArea(poly) {
    const verts = poly.vertices;
    let area = 0;
    for (let i = 0; i < verts.length; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % verts.length];
        area += (a.x * b.y) - (b.x * a.y);
    }
    return Math.abs(area) / 2;
}

/**
 * Ray-casting algorithm: cast horizontal ray to the right, count edge crossings.
 */
export function pointInPolygon(px, py, poly) {
    const verts = poly.vertices;
    let inside = false;
    for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        const xi = verts[i].x, yi = verts[i].y;
        const xj = verts[j].x, yj = verts[j].y;
        if (((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Returns {x, y, width, height} bounding box from min/max of vertices.
 */
export function boundingBox(poly) {
    const verts = poly.vertices;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of verts) {
        if (v.x < minX) minX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.x > maxX) maxX = v.x;
        if (v.y > maxY) maxY = v.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Minimum distance from point (px, py) to any edge of the polygon.
 */
function pointDistanceToEdges(px, py, poly) {
    const edges = getEdges(poly);
    let minDist = Infinity;
    for (const e of edges) {
        const dist = pointDistToSegment(px, py, e.x1, e.y1, e.x2, e.y2);
        if (dist < minDist) minDist = dist;
    }
    return minDist;
}

/**
 * Distance from point (px, py) to line segment (x1,y1)-(x2,y2).
 */
function pointDistToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
        return Math.hypot(px - x1, py - y1);
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
}

/**
 * Rejection sampling: random point inside polygon, at least `padding` from any edge.
 */
export function randomPointInPolygon(poly, padding) {
    const bb = boundingBox(poly);
    const maxAttempts = 1000;
    for (let i = 0; i < maxAttempts; i++) {
        const px = bb.x + Math.random() * bb.width;
        const py = bb.y + Math.random() * bb.height;
        if (pointInPolygon(px, py, poly) && pointDistanceToEdges(px, py, poly) >= padding) {
            return { x: px, y: py };
        }
    }
    // Fallback: return center of bounding box
    return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
}

/**
 * Raycast from (px, py) in given direction to nearest polygon edge.
 * Returns {distance, point: {x, y}} or null if no hit.
 * Only considers edges perpendicular to the ray whose span covers the ray's fixed coordinate.
 */
export function raycastToEdge(px, py, direction, poly) {
    const edges = getEdges(poly);
    let bestDist = Infinity;
    let bestPoint = null;

    for (const e of edges) {
        const isHorizontal = Math.abs(e.y1 - e.y2) < TOLERANCE;
        const isVertical = Math.abs(e.x1 - e.x2) < TOLERANCE;

        if (direction === 'down' || direction === 'up') {
            // Only hit horizontal edges
            if (!isHorizontal) continue;
            const edgeY = e.y1;
            const minX = Math.min(e.x1, e.x2);
            const maxX = Math.max(e.x1, e.x2);
            if (px < minX - TOLERANCE || px > maxX + TOLERANCE) continue;

            if (direction === 'down' && edgeY > py) {
                const dist = edgeY - py;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x: px, y: edgeY };
                }
            } else if (direction === 'up' && edgeY < py) {
                const dist = py - edgeY;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x: px, y: edgeY };
                }
            }
        } else if (direction === 'left' || direction === 'right') {
            // Only hit vertical edges
            if (!isVertical) continue;
            const edgeX = e.x1;
            const minY = Math.min(e.y1, e.y2);
            const maxY = Math.max(e.y1, e.y2);
            if (py < minY - TOLERANCE || py > maxY + TOLERANCE) continue;

            if (direction === 'right' && edgeX > px) {
                const dist = edgeX - px;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x: edgeX, y: py };
                }
            } else if (direction === 'left' && edgeX < px) {
                const dist = px - edgeX;
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = { x: edgeX, y: py };
                }
            }
        }
    }

    if (bestPoint === null) return null;
    return { distance: bestDist, point: bestPoint };
}

/**
 * Find the edge index that contains point (px, py) within tolerance.
 * Returns edge index or -1 if not found.
 */
export function findEdgeAtPoint(poly, px, py) {
    const edges = getEdges(poly);
    for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const isHorizontal = Math.abs(e.y1 - e.y2) < TOLERANCE;
        const isVertical = Math.abs(e.x1 - e.x2) < TOLERANCE;

        if (isHorizontal) {
            if (Math.abs(py - e.y1) <= TOLERANCE) {
                const minX = Math.min(e.x1, e.x2);
                const maxX = Math.max(e.x1, e.x2);
                if (px >= minX - TOLERANCE && px <= maxX + TOLERANCE) {
                    return i;
                }
            }
        } else if (isVertical) {
            if (Math.abs(px - e.x1) <= TOLERANCE) {
                const minY = Math.min(e.y1, e.y2);
                const maxY = Math.max(e.y1, e.y2);
                if (py >= minY - TOLERANCE && py <= maxY + TOLERANCE) {
                    return i;
                }
            }
        }
    }
    return -1;
}

/**
 * Length of edge i.
 */
export function edgeLength(poly, i) {
    const verts = poly.vertices;
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Returns the inward-perpendicular direction for edge i assuming CW winding.
 * CW normal rule: for edge vector (dx, dy), inward normal is (-dy, dx) — but for CW winding
 * the inward normal is (dy, -dx). We determine direction from that.
 */
export function edgeDirection(poly, i) {
    const verts = poly.vertices;
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    // For CW winding, inward normal is (-dy, dx)
    const nx = -dy;
    const ny = dx;

    // Determine axis-aligned direction from inward normal
    if (Math.abs(nx) > Math.abs(ny)) {
        return nx > 0 ? 'right' : 'left';
    } else {
        return ny > 0 ? 'down' : 'up';
    }
}

/**
 * Returns {x, y} at distance t along edge from start vertex.
 */
export function pointOnEdge(poly, edgeIndex, t) {
    const verts = poly.vertices;
    const a = verts[edgeIndex];
    const b = verts[(edgeIndex + 1) % verts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len === 0) return { x: a.x, y: a.y };
    const ratio = t / len;
    return {
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio
    };
}

/**
 * Remove a rectangular corner defined by L-cut path A -> B -> C.
 * Returns a new polygon with the corner nibbled off.
 */
export function nibblePolygon(poly, A, B, C) {
    const verts = poly.vertices;
    const n = verts.length;

    // Find edges containing A and C
    const edgeAIdx = findEdgeAtPoint(poly, A.x, A.y);
    const edgeCIdx = findEdgeAtPoint(poly, C.x, C.y);

    if (edgeAIdx === -1 || edgeCIdx === -1) {
        return poly; // Can't find edges, return unchanged
    }

    // Build new vertex list with A and C inserted at their respective edge positions.
    // We need to insert A after vertex edgeAIdx and C after vertex edgeCIdx.
    // We must be careful about ordering since inserting one shifts indices.

    // First, build list with split points inserted
    let newVerts = verts.map(v => ({ x: v.x, y: v.y }));

    // We insert in reverse index order to avoid shifting issues
    const insertions = [
        { idx: edgeAIdx, point: A },
        { idx: edgeCIdx, point: C }
    ];

    // Sort by index descending so later insertions don't affect earlier indices
    insertions.sort((a, b) => b.idx - a.idx);

    // Handle case where both points are on the same edge
    if (edgeAIdx === edgeCIdx) {
        const edgeStart = verts[edgeAIdx];
        const distA = Math.hypot(A.x - edgeStart.x, A.y - edgeStart.y);
        const distC = Math.hypot(C.x - edgeStart.x, C.y - edgeStart.y);
        // Insert the farther one first (higher index position after insert)
        if (distA > distC) {
            // Insert A first (farther), then C
            newVerts.splice(edgeAIdx + 1, 0, { x: A.x, y: A.y });
            newVerts.splice(edgeAIdx + 1, 0, { x: C.x, y: C.y });
        } else {
            newVerts.splice(edgeCIdx + 1, 0, { x: C.x, y: C.y });
            newVerts.splice(edgeCIdx + 1, 0, { x: A.x, y: A.y });
        }
    } else {
        for (const ins of insertions) {
            // Check if point already matches a vertex at edge endpoints
            const startV = newVerts[ins.idx];
            const endV = newVerts[(ins.idx + 1) % newVerts.length];
            const matchesStart = Math.abs(ins.point.x - startV.x) < TOLERANCE &&
                                 Math.abs(ins.point.y - startV.y) < TOLERANCE;
            const matchesEnd = Math.abs(ins.point.x - endV.x) < TOLERANCE &&
                               Math.abs(ins.point.y - endV.y) < TOLERANCE;
            if (!matchesStart && !matchesEnd) {
                newVerts.splice(ins.idx + 1, 0, { x: ins.point.x, y: ins.point.y });
            }
        }
    }

    // Find indices of A and C in the new vertex list
    let idxA = -1, idxC = -1;
    for (let i = 0; i < newVerts.length; i++) {
        if (Math.abs(newVerts[i].x - A.x) < TOLERANCE && Math.abs(newVerts[i].y - A.y) < TOLERANCE) {
            idxA = i;
        }
        if (Math.abs(newVerts[i].x - C.x) < TOLERANCE && Math.abs(newVerts[i].y - C.y) < TOLERANCE) {
            idxC = i;
        }
    }

    if (idxA === -1 || idxC === -1) {
        return poly;
    }

    // Walk CW from C to A (the short arc — the corner being removed).
    // Count vertices in both directions and pick the shorter one.
    const total = newVerts.length;

    // CW arc from C to A: go C, C+1, C+2, ..., A
    let cwCount = 0;
    {
        let cur = idxC;
        while (cur !== idxA) {
            cur = (cur + 1) % total;
            cwCount++;
        }
    }

    // CCW arc from C to A: go C, C-1, C-2, ..., A
    let ccwCount = 0;
    {
        let cur = idxC;
        while (cur !== idxA) {
            cur = (cur - 1 + total) % total;
            ccwCount++;
        }
    }

    // The "short arc" is the one with fewer vertices — the corner being nibbled
    // We want to keep the long arc and replace the short arc with C -> B -> A
    let result;
    if (cwCount <= ccwCount) {
        // Short arc goes CW from C to A. Keep CCW arc from A to C, then insert B.
        // Build: start from A, walk CW (the long way, through the kept region) to C, then B, then back to A
        result = [];
        result.push({ x: A.x, y: A.y });
        // Walk from A CW through the KEPT vertices to C
        // The kept arc goes: A -> A-1 -> ... -> C (going CCW, which is the long way around)
        // Actually let me think again. We have CW vertex order.
        // Short arc CW from C to A means vertices C, C+1, ..., A (cwCount steps)
        // Long arc CW from A to C means vertices A, A+1, ..., C
        // We keep the long arc: A -> A+1 -> ... -> C, then replace the short arc with B
        let cur = idxA;
        result.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        while (cur !== idxC) {
            cur = (cur + 1) % total;
            result.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        }
        // Now add B between C and A (closing the polygon back to A)
        result.push({ x: B.x, y: B.y });
        // Remove the duplicate A at the start (it will close naturally)
        result.shift();
    } else {
        // Short arc goes CCW from C to A (i.e., CW from A to C is the short arc).
        // Keep CW arc from C to A (the long way).
        result = [];
        let cur = idxC;
        result.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        while (cur !== idxA) {
            cur = (cur + 1) % total;
            result.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        }
        // Insert B between A and C to close
        result.push({ x: B.x, y: B.y });
    }

    // Remove collinear vertices
    result = removeCollinear(result);

    return { vertices: result };
}

/**
 * Remove collinear vertices (3 consecutive points on the same line).
 */
function removeCollinear(verts) {
    if (verts.length < 3) return verts;
    let changed = true;
    while (changed) {
        changed = false;
        const cleaned = [];
        const n = verts.length;
        for (let i = 0; i < n; i++) {
            const prev = verts[(i - 1 + n) % n];
            const curr = verts[i];
            const next = verts[(i + 1) % n];
            // Check if prev, curr, next are collinear
            // For axis-aligned edges: all three share same x or same y
            const sameX = Math.abs(prev.x - curr.x) < TOLERANCE && Math.abs(curr.x - next.x) < TOLERANCE;
            const sameY = Math.abs(prev.y - curr.y) < TOLERANCE && Math.abs(curr.y - next.y) < TOLERANCE;
            if (sameX || sameY) {
                changed = true;
                // Skip this vertex
            } else {
                cleaned.push(curr);
            }
        }
        verts = cleaned;
        if (verts.length < 3) break;
    }
    return verts;
}
