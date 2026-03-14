// polygon.js — Rectilinear polygon module for Space Cutter
// Represents a play area with clockwise-wound, axis-aligned vertices.



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
        const isHorizontal = e.y1 === e.y2;
        const isVertical = e.x1 === e.x2;

        if (direction === 'down' || direction === 'up') {
            // Only hit horizontal edges
            if (!isHorizontal) continue;
            const edgeY = e.y1;
            const minX = Math.min(e.x1, e.x2);
            const maxX = Math.max(e.x1, e.x2);
            if (px < minX || px > maxX) continue;

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
            if (py < minY || py > maxY) continue;

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
        const isHorizontal = e.y1 === e.y2;
        const isVertical = e.x1 === e.x2;

        if (isHorizontal) {
            if (py === e.y1) {
                const minX = Math.min(e.x1, e.x2);
                const maxX = Math.max(e.x1, e.x2);
                if (px >= minX && px <= maxX) {
                    return i;
                }
            }
        } else if (isVertical) {
            if (px === e.x1) {
                const minY = Math.min(e.y1, e.y2);
                const maxY = Math.max(e.y1, e.y2);
                if (py >= minY && py <= maxY) {
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
    const newVerts = insertSplitPoints(verts, edgeAIdx, edgeCIdx, A, C);

    // Find indices of A and C in the new vertex list
    let idxA = -1, idxC = -1;
    for (let i = 0; i < newVerts.length; i++) {
        if (newVerts[i].x === A.x && newVerts[i].y === A.y) {
            idxA = i;
        }
        if (newVerts[i].x === C.x && newVerts[i].y === C.y) {
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
 * Insert split points A and C into a copy of verts at their respective edge positions.
 * Returns augmented vertex array.
 */
function insertSplitPoints(verts, edgeAIdx, edgeCIdx, A, C) {
    let newVerts = verts.map(v => ({ x: v.x, y: v.y }));

    if (edgeAIdx === edgeCIdx) {
        // Both on same edge — insert farther one first
        const edgeStart = verts[edgeAIdx];
        const distA = Math.hypot(A.x - edgeStart.x, A.y - edgeStart.y);
        const distC = Math.hypot(C.x - edgeStart.x, C.y - edgeStart.y);
        if (distA > distC) {
            newVerts.splice(edgeAIdx + 1, 0, { x: A.x, y: A.y });
            newVerts.splice(edgeAIdx + 1, 0, { x: C.x, y: C.y });
        } else {
            newVerts.splice(edgeCIdx + 1, 0, { x: C.x, y: C.y });
            newVerts.splice(edgeCIdx + 1, 0, { x: A.x, y: A.y });
        }
    } else {
        // Insert in reverse index order to avoid shifting issues
        const insertions = [
            { idx: edgeAIdx, point: A },
            { idx: edgeCIdx, point: C }
        ];
        insertions.sort((a, b) => b.idx - a.idx);

        for (const ins of insertions) {
            const startV = newVerts[ins.idx];
            const endV = newVerts[(ins.idx + 1) % newVerts.length];
            const matchesStart = ins.point.x === startV.x && ins.point.y === startV.y;
            const matchesEnd = ins.point.x === endV.x && ins.point.y === endV.y;
            if (!matchesStart && !matchesEnd) {
                newVerts.splice(ins.idx + 1, 0, { x: ins.point.x, y: ins.point.y });
            }
        }
    }

    return newVerts;
}

/**
 * Split polygon with a straight line from A to C.
 * Returns the larger of the two resulting sub-polygons.
 */
export function splitPolygon(poly, A, C) {
    const verts = poly.vertices;

    const edgeAIdx = findEdgeAtPoint(poly, A.x, A.y);
    const edgeCIdx = findEdgeAtPoint(poly, C.x, C.y);

    if (edgeAIdx === -1 || edgeCIdx === -1 || edgeAIdx === edgeCIdx) {
        return poly;
    }

    const newVerts = insertSplitPoints(verts, edgeAIdx, edgeCIdx, A, C);
    const total = newVerts.length;

    // Find indices of A and C in augmented list
    let idxA = -1, idxC = -1;
    for (let i = 0; i < total; i++) {
        if (newVerts[i].x === A.x && newVerts[i].y === A.y) idxA = i;
        if (newVerts[i].x === C.x && newVerts[i].y === C.y) idxC = i;
    }

    if (idxA === -1 || idxC === -1) return poly;

    // Sub-polygon 1: walk CW from A to C (inclusive), closed by edge C→A
    const sub1 = [];
    {
        let cur = idxA;
        sub1.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        while (cur !== idxC) {
            cur = (cur + 1) % total;
            sub1.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        }
    }

    // Sub-polygon 2: walk CW from C to A (inclusive), closed by edge A→C
    const sub2 = [];
    {
        let cur = idxC;
        sub2.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        while (cur !== idxA) {
            cur = (cur + 1) % total;
            sub2.push({ x: newVerts[cur].x, y: newVerts[cur].y });
        }
    }

    const clean1 = removeCollinear(sub1);
    const clean2 = removeCollinear(sub2);

    const poly1 = { vertices: clean1 };
    const poly2 = { vertices: clean2 };
    const area1 = polygonArea(poly1);
    const area2 = polygonArea(poly2);

    if (Math.abs(area1 - area2) <= 1) {
        return Math.random() < 0.5 ? poly1 : poly2;
    }
    return area1 >= area2 ? poly1 : poly2;
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
            const sameX = prev.x === curr.x && curr.x === next.x;
            const sameY = prev.y === curr.y && curr.y === next.y;
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
