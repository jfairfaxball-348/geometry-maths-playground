export const UNIT = 40;
export const WIDTH = 960;
export const HEIGHT = 620;
const EPS = 1e-9;

export const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const subtract = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function signedArea(points) {
  return points.reduce((sum, p, i) => sum + cross(p, points[(i + 1) % points.length]), 0) / 2;
}

function properIntersection(a, b, c, d) {
  const orient = (p, q, r) => cross(subtract(q, p), subtract(r, p));
  const onSegment = (p, q, r) => Math.min(p.x, r.x) - EPS <= q.x && q.x <= Math.max(p.x, r.x) + EPS &&
    Math.min(p.y, r.y) - EPS <= q.y && q.y <= Math.max(p.y, r.y) + EPS;
  const d1 = orient(a, b, c), d2 = orient(a, b, d);
  const d3 = orient(c, d, a), d4 = orient(c, d, b);
  if ((d1 > EPS && d2 < -EPS || d1 < -EPS && d2 > EPS) &&
      (d3 > EPS && d4 < -EPS || d3 < -EPS && d4 > EPS)) return true;
  if (Math.abs(d1) <= EPS && onSegment(a, c, b)) return true;
  if (Math.abs(d2) <= EPS && onSegment(a, d, b)) return true;
  if (Math.abs(d3) <= EPS && onSegment(c, a, d)) return true;
  if (Math.abs(d4) <= EPS && onSegment(c, b, d)) return true;
  return false;
}

export function selfIntersects(points) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (properIntersection(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return true;
    }
  }
  return false;
}

export function interiorAngles(points) {
  const n = points.length;
  const sign = Math.sign(signedArea(points)) || 1;
  return points.map((p, i) => {
    const prev = points[(i - 1 + n) % n], next = points[(i + 1) % n];
    const u = subtract(prev, p), v = subtract(next, p);
    const a = Math.atan2(Math.abs(cross(u, v)), u.x * v.x + u.y * v.y) * 180 / Math.PI;
    const turn = cross(subtract(p, prev), subtract(next, p));
    return sign * turn < -EPS ? 360 - a : a;
  });
}

const almostEqual = (a, b, tolerance = 0.025) => Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
const parallel = (a, b) => Math.abs(cross(a, b)) <= 0.018 * Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y);

export function classifyPolygon(points, lengths, angles, invalid) {
  const n = points.length;
  if (invalid) return 'Crossed polygon';
  const sameSides = lengths.every(v => almostEqual(v, lengths[0]));
  const sameAngles = angles.every(v => Math.abs(v - angles[0]) <= 1.2);
  if (n === 3) {
    if (sameSides) return 'Equilateral triangle';
    if (angles.some(a => Math.abs(a - 90) < 1.25)) return 'Right triangle';
    if (lengths.some((a, i) => lengths.some((b, j) => i !== j && almostEqual(a, b)))) return 'Isosceles triangle';
    return 'Scalene triangle';
  }
  if (n === 4) {
    const right = angles.every(a => Math.abs(a - 90) < 1.25);
    if (right && sameSides) return 'Square';
    if (right) return 'Rectangle';
    const edges = points.map((p, i) => subtract(points[(i + 1) % n], p));
    const pairs = [parallel(edges[0], edges[2]), parallel(edges[1], edges[3])];
    if (sameSides && pairs.every(Boolean)) return 'Rhombus';
    if (pairs.every(Boolean)) return 'Parallelogram';
    if (pairs.some(Boolean)) return 'Trapezium';
    return 'Irregular quadrilateral';
  }
  return sameSides && sameAngles ? 'Regular ' + n + '-gon' : 'Irregular ' + n + '-gon';
}

export function measurePolygon(points) {
  if (points.length < 3) throw new Error('A polygon needs at least three vertices');
  const rawSides = points.map((p, i) => distance(p, points[(i + 1) % points.length]));
  const lengths = rawSides.map(v => v / UNIT);
  const area = Math.abs(signedArea(points)) / (UNIT * UNIT);
  const perimeter = lengths.reduce((a, b) => a + b, 0);
  const angles = interiorAngles(points);
  const invalid = selfIntersects(points) || area < 0.0001 || rawSides.some(v => v < 1);
  const name = classifyPolygon(points, lengths, angles, invalid);
  const semiPerimeter = perimeter / 2;
  const heronArea = points.length === 3 ?
    Math.sqrt(Math.max(0, semiPerimeter * lengths.reduce((acc, s) => acc * (semiPerimeter - s), 1))) : null;
  return {
    kind: 'polygon', name, sides: points.length, area, perimeter, lengths, angles, invalid,
    angleSum: angles.reduce((a, b) => a + b, 0),
    expectedAngleSum: (points.length - 2) * 180,
    heronArea, centroid: {
      x: points.reduce((s, p) => s + p.x, 0) / points.length,
      y: points.reduce((s, p) => s + p.y, 0) / points.length
    }
  };
}

export function measureCircle(radiusPx) {
  const radius = Math.max(0, radiusPx) / UNIT;
  return {
    kind: 'circle', name: 'Circle', radius, diameter: 2 * radius,
    area: Math.PI * radius * radius, perimeter: 2 * Math.PI * radius,
    invalid: radius <= 0
  };
}

export function regularPoints(n, radius = 165, centre = { x: 480, y: 312 }) {
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + i * 2 * Math.PI / n;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
}

export function createPreset(key, sides = 5) {
  if (key === 'circle') return { kind: 'circle', centre: { x: 480, y: 310 }, radius: 156 };
  if (key === 'triangle') return { kind: 'polygon', points: [{ x: 306, y: 423 }, { x: 657, y: 417 }, { x: 474, y: 169 }] };
  if (key === 'rectangle') return { kind: 'polygon', points: [{ x: 298, y: 215 }, { x: 662, y: 215 }, { x: 662, y: 427 }, { x: 298, y: 427 }] };
  if (key === 'square') return { kind: 'polygon', points: [{ x: 348, y: 190 }, { x: 613, y: 190 }, { x: 613, y: 455 }, { x: 348, y: 455 }] };
  if (key === 'quadrilateral') return { kind: 'polygon', points: [{ x: 310, y: 220 }, { x: 612, y: 175 }, { x: 704, y: 441 }, { x: 266, y: 417 }] };
  if (key === 'regular') return { kind: 'polygon', points: regularPoints(clamp(Math.round(sides), 3, 10)) };
  throw new Error('Unknown preset: ' + key);
}

export function rotatePolygon(points, degrees) {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const a = degrees * Math.PI / 180;
  return points.map(p => ({
    x: cx + (p.x - cx) * Math.cos(a) - (p.y - cy) * Math.sin(a),
    y: cy + (p.x - cx) * Math.sin(a) + (p.y - cy) * Math.cos(a)
  }));
}

export function scalePolygon(points, factor) {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return points.map(p => ({ x: cx + factor * (p.x - cx), y: cy + factor * (p.y - cy) }));
}

export function reflectPolygon(points) {
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  return points.map(p => ({ x: 2 * cx - p.x, y: p.y }));
}
