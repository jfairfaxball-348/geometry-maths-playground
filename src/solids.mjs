/** Canonical solid dimensions are in mathematical units. No renderer dependencies. */
export const SOLIDS = {
  cube: { name: 'Cube', symbol: '▣', params: { side: 2.6 }, fields: ['side'] },
  cuboid: { name: 'Cuboid', symbol: '▭', params: { width: 3, height: 2.3, depth: 2 }, fields: ['width', 'height', 'depth'] },
  sphere: { name: 'Sphere', symbol: '◉', params: { radius: 1.5 }, fields: ['radius'] },
  cylinder: { name: 'Cylinder', symbol: '◍', params: { radius: 1.3, height: 3 }, fields: ['radius', 'height'] },
  cone: { name: 'Cone', symbol: '△', params: { radius: 1.5, height: 3 }, fields: ['radius', 'height'] },
  tetrahedron: { name: 'Tetrahedron', symbol: '◇', params: { side: 3 }, fields: ['side'] },
  pyramid: { name: 'Square pyramid', symbol: '◬', params: { side: 3, height: 3 }, fields: ['side', 'height'] },
  prism: { name: 'Triangular prism', symbol: '⬡', params: { side: 2.8, depth: 3.2 }, fields: ['side', 'depth'] }
};

export const MIN_DIMENSION = 0.35;
export const MAX_DIMENSION = 8;
export const limitDimension = value => Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Number(value)));
export const initialSolid = type => ({ type, params: { ...SOLIDS[type].params }, scale: 1, position: [0, 0, 0], rotation: [0, 0, 0] });
export const scaledParams = (params, scale) => Object.fromEntries(Object.entries(params).map(([key, value]) => [key, value * scale]));

export function measureSolid(type, params, scale = 1) {
  if (!SOLIDS[type]) throw new RangeError('Unknown solid: ' + type);
  if (!Number.isFinite(scale) || scale <= 0) throw new RangeError('Scale must be positive');
  for (const field of SOLIDS[type].fields) {
    if (!Number.isFinite(params[field]) || params[field] <= 0) throw new RangeError('Dimensions must be positive');
  }
  const p = scaledParams(params, scale);
  const pi = Math.PI;
  let volume, surfaceArea, topology = null, formula, substitution, detail = [], classification = '';
  switch (type) {
    case 'cube': {
      const a = p.side;
      volume = a ** 3; surfaceArea = 6 * a ** 2;
      topology = [8, 12, 6]; classification = 'Regular hexahedron · all 90° dihedral angles';
      formula = 'V = a³   ·   A = 6a²';
      substitution = `V = ${n(a)}³ = ${n(volume)} u³   ·   A = 6 × ${n(a)}² = ${n(surfaceArea)} u²`;
      detail = [['12 edges', `${n(a)} u each`], ['Face area', `${n(a ** 2)} u²`]];
      break;
    }
    case 'cuboid': {
      const { width: w, height: h, depth: d } = p;
      volume = w * h * d; surfaceArea = 2 * (w * h + w * d + h * d);
      topology = [8, 12, 6]; classification = 'Rectangular prism · all 90° dihedral angles';
      formula = 'V = whd   ·   A = 2(wh + wd + hd)';
      substitution = `V = ${n(w)} × ${n(h)} × ${n(d)} = ${n(volume)} u³   ·   A = 2(${n(w * h)} + ${n(w * d)} + ${n(h * d)}) = ${n(surfaceArea)} u²`;
      detail = [['Edge lengths', `4 × ${n(w)} u · 4 × ${n(h)} u · 4 × ${n(d)} u`]];
      break;
    }
    case 'sphere': {
      const r = p.radius;
      volume = 4 * pi * r ** 3 / 3; surfaceArea = 4 * pi * r ** 2;
      classification = 'Smooth curved surface · no polyhedral faces';
      formula = 'V = 4πr³/3   ·   A = 4πr²';
      substitution = `V = 4π × ${n(r)}³/3 = ${n(volume)} u³   ·   A = 4π × ${n(r)}² = ${n(surfaceArea)} u²`;
      detail = [['Radius', `${n(r)} u`], ['Diameter', `${n(2 * r)} u`]];
      break;
    }
    case 'cylinder': {
      const { radius: r, height: h } = p;
      volume = pi * r ** 2 * h; surfaceArea = 2 * pi * r * (r + h);
      classification = 'Right circular cylinder · curved lateral surface';
      formula = 'V = πr²h   ·   A = 2πr² + 2πrh';
      substitution = `V = π × ${n(r)}² × ${n(h)} = ${n(volume)} u³   ·   A = 2π × ${n(r)}² + 2π × ${n(r)} × ${n(h)} = ${n(surfaceArea)} u²`;
      detail = [['Radius / diameter', `${n(r)} / ${n(2 * r)} u`], ['Height', `${n(h)} u`], ['Lateral area', `${n(2 * pi * r * h)} u²`]];
      break;
    }
    case 'cone': {
      const { radius: r, height: h } = p;
      const l = Math.hypot(r, h);
      volume = pi * r ** 2 * h / 3; surfaceArea = pi * r * (r + l);
      classification = 'Right circular cone · curved lateral surface';
      formula = 'V = πr²h/3   ·   A = πr² + πr√(r² + h²)';
      substitution = `V = π × ${n(r)}² × ${n(h)}/3 = ${n(volume)} u³   ·   A = π × ${n(r)} × (${n(r)} + ${n(l)}) = ${n(surfaceArea)} u²`;
      detail = [['Radius / diameter', `${n(r)} / ${n(2 * r)} u`], ['Height', `${n(h)} u`], ['Slant height', `${n(l)} u`]];
      break;
    }
    case 'tetrahedron': {
      const a = p.side;
      volume = a ** 3 / (6 * Math.SQRT2); surfaceArea = Math.sqrt(3) * a ** 2;
      topology = [4, 6, 4]; classification = 'Regular tetrahedron · 60° face angles';
      formula = 'V = a³/(6√2)   ·   A = √3a²';
      substitution = `V = ${n(a)}³/(6√2) = ${n(volume)} u³   ·   A = √3 × ${n(a)}² = ${n(surfaceArea)} u²`;
      detail = [['6 edges', `${n(a)} u each`], ['Face area', `${n(Math.sqrt(3) * a ** 2 / 4)} u²`]];
      break;
    }
    case 'pyramid': {
      const { side: a, height: h } = p;
      const l = Math.hypot(a / 2, h);
      volume = a ** 2 * h / 3; surfaceArea = a ** 2 + 2 * a * l;
      topology = [5, 8, 5]; classification = 'Right square pyramid · four isosceles triangular sides';
      formula = 'V = a²h/3   ·   A = a² + 2a√(h² + a²/4)';
      substitution = `V = ${n(a)}² × ${n(h)}/3 = ${n(volume)} u³   ·   A = ${n(a)}² + 2 × ${n(a)} × ${n(l)} = ${n(surfaceArea)} u²`;
      detail = [['Base side', `${n(a)} u`], ['Height', `${n(h)} u`], ['Face slant height', `${n(l)} u`]];
      break;
    }
    case 'prism': {
      const { side: a, depth: d } = p;
      const base = Math.sqrt(3) * a ** 2 / 4;
      volume = base * d; surfaceArea = 2 * base + 3 * a * d;
      topology = [6, 9, 5]; classification = 'Equilateral triangular prism · 60° base angles';
      formula = 'V = (√3/4)a²d   ·   A = (√3/2)a² + 3ad';
      substitution = `V = (√3/4) × ${n(a)}² × ${n(d)} = ${n(volume)} u³   ·   A = 2 × ${n(base)} + 3 × ${n(a)} × ${n(d)} = ${n(surfaceArea)} u²`;
      detail = [['Triangle side', `${n(a)} u`], ['Prism length', `${n(d)} u`], ['Base area', `${n(base)} u²`]];
      break;
    }
  }
  return { name: SOLIDS[type].name, type, params: p, volume, surfaceArea, topology, euler: topology ? topology[0] - topology[1] + topology[2] : null, classification, formula, substitution, detail };
}

export function transformObservation(previous, next, change) {
  if (change === 'rotate' || change === 'move') return `${change === 'rotate' ? 'Rotation' : 'Translation'} is rigid: volume and surface area stay unchanged. Only position or orientation changes.`;
  const vr = next.volume / previous.volume;
  const ar = next.surfaceArea / previous.surfaceArea;
  if (change === 'uniform') return `Uniform scaling: lengths ×${n(Math.cbrt(vr))}, surface area ×${n(ar)}, volume ×${n(vr)}.`;
  if (Math.abs(vr - 1) < 1e-8 && Math.abs(ar - 1) < 1e-8) return 'These dimensions preserve volume and surface area.';
  return `Compared with the previous state: volume ×${n(vr)} (${vr >= 1 ? 'larger' : 'smaller'}), surface area ×${n(ar)}. These need not change at the same rate.`;
}
function n(value) { return Number(value.toFixed(2)).toLocaleString('en-GB', { maximumFractionDigits: 2 }); }
