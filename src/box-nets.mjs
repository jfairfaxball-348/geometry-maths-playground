/**
 * Exact, hinge-compatible planar nets of cubes and rectangular cuboids.
 * Pure mathematics: no DOM or Three.js dependency. All face coordinates
 * are in scaled model units, with the front face centred on the origin.
 *
 *     [back]
 *     [top]
 * [left][front][right]
 *     [bottom]
 */
export const BOX_FACE_COLORS = Object.freeze({
  front: '#7679e8',
  back: '#5e70c8',
  top: '#51adab',
  bottom: '#e9a461',
  left: '#df8496',
  right: '#8898db'
});

export function supportsBoxNet(type) {
  return type === 'cube' || type === 'cuboid';
}

export function boxDimensions(type, params, scale = 1) {
  if (!supportsBoxNet(type)) return null;
  if (!Number.isFinite(scale) || scale <= 0) throw new RangeError('Net scale must be positive');
  const dimensions = type === 'cube'
    ? [params.side, params.side, params.side]
    : [params.width, params.height, params.depth];
  if (dimensions.some(value => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError('Net dimensions must be positive');
  }
  return dimensions.map(value => value * scale);
}

/** Each rectangle is expressed with a centre (x,y), width and height. */
export function boxNet(type, params, scale = 1) {
  const dimensions = boxDimensions(type, params, scale);
  if (!dimensions) return null;
  const [w, h, d] = dimensions;
  const defs = [
    ['front', 'Front', 0, 0, w, h],
    ['back', 'Back', 0, h + d, w, h],
    ['top', 'Top', 0, h / 2 + d / 2, w, d],
    ['bottom', 'Bottom', 0, -h / 2 - d / 2, w, d],
    ['left', 'Left', -w / 2 - d / 2, 0, d, h],
    ['right', 'Right', w / 2 + d / 2, 0, d, h]
  ];
  const faces = defs.map(([id, label, x, y, width, height]) => ({
    id, label, x, y, width, height,
    area: width * height, color: BOX_FACE_COLORS[id]
  }));
  const area = faces.reduce((sum, face) => sum + face.area, 0);
  const algebraicArea = 2 * (w * h + w * d + h * d);
  return {
    dimensions: { width: w, height: h, depth: d },
    faces, area, algebraicArea,
    // Bounding box of the complete, flat arrangement.
    bounds: {
      minX: -w / 2 - d,
      maxX: w / 2 + d,
      minY: -h / 2 - d,
      maxY: 3 * h / 2 + d
    }
  };
}

/** The folded structure always has six faces whose area sum is the surface area. */
export function netMatchesSurfaceArea(net, surfaceArea, tolerance = 1e-8) {
  return !!net && Math.abs(net.area - surfaceArea) <= tolerance * Math.max(1, surfaceArea);
}
