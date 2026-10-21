import {
  UNIT, WIDTH, HEIGHT, distance, clamp, createPreset,
  measurePolygon, measureCircle, rotatePolygon, scalePolygon, reflectPolygon
} from './geometry.mjs';

const svg = document.getElementById('geometry-canvas');
const metricsEl = document.getElementById('metrics');
const explanationEl = document.getElementById('math-explanation');
const discoveryEl = document.getElementById('discovery');

const state = {
  preset: 'triangle',
  regularSides: 5,
  shape: createPreset('triangle'),
  grid: true,
  lengths: true,
  snap: false,
  drag: null,
  lastAction: ''
};

const fmt = (number, digits = 2) => Number.isFinite(number) ?
  number.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
const roundPx = n => Math.round(n * 10) / 10;
const coordinate = n => Math.round(n / 20) * 20;
const snapPoint = point => state.snap ?
  { x: coordinate(point.x), y: 310 + coordinate(point.y - 310) } : point;
const pointString = p => roundPx(p.x) + ',' + roundPx(p.y);
const coordDisplay = p => '(' + fmt((p.x - 480) / UNIT, 1) + ', ' + fmt((310 - p.y) / UNIT, 1) + ')';

function svgPoint(evt) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 480, y: 310 };
  const point = svg.createSVGPoint();
  point.x = evt.clientX;
  point.y = evt.clientY;
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}

function svgLabel(x, y, text, fill = '#68738e', size = 14, weight = 700) {
  return '<text x="' + roundPx(x) + '" y="' + roundPx(y) +
    '" fill="' + fill + '" font-size="' + size + '" font-weight="' + weight +
    '" text-anchor="middle" dominant-baseline="middle">' + text + '</text>';
}

function handle(x, y, dataAttribute, primary = true) {
  return '<g class="' + (dataAttribute.includes('radius') ? 'radius-handle' : 'vertex-handle') +
    '" ' + dataAttribute + '><circle cx="' + roundPx(x) + '" cy="' + roundPx(y) +
    '" r="18" fill="#e3e5ff" fill-opacity=".85"/><circle cx="' + roundPx(x) +
    '" cy="' + roundPx(y) + '" r="9.2" fill="' + (primary ? '#656be1' : '#fff') +
    '" stroke="' + (primary ? '#fff' : '#676be0') + '" stroke-width="3"/></g>';
}

function renderDiagram() {
  const parts = [
    '<defs>',
    '<pattern id="minor" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="translate(0 10)"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eef1f8" stroke-width="1"/></pattern>',
    '<pattern id="major" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="translate(0 30)"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dce2f0" stroke-width="1.3"/></pattern>',
    '<linearGradient id="shapeFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7e82ea" stop-opacity=".23"/><stop offset="100%" stop-color="#747bdc" stop-opacity=".10"/></linearGradient>',
    '</defs>',
    '<rect width="' + WIDTH + '" height="' + HEIGHT + '" fill="#fcfdff"/>'
  ];
  if (state.grid) parts.push(
    '<rect width="' + WIDTH + '" height="' + HEIGHT + '" fill="url(#minor)"/>',
    '<rect width="' + WIDTH + '" height="' + HEIGHT + '" fill="url(#major)"/>',
    '<line x1="480" y1="0" x2="480" y2="' + HEIGHT + '" stroke="#c9d1e5" stroke-width="1.4" stroke-dasharray="5 5"/>',
    '<line x1="0" y1="310" x2="' + WIDTH + '" y2="310" stroke="#c9d1e5" stroke-width="1.4" stroke-dasharray="5 5"/>'
  );
  if (state.shape.kind === 'circle') {
    const { centre, radius } = state.shape;
    parts.push(
      '<circle class="shape-body" data-drag="shape" cx="' + roundPx(centre.x) + '" cy="' + roundPx(centre.y) +
        '" r="' + roundPx(radius) + '" fill="url(#shapeFill)" stroke="#777bea" stroke-width="3.5"/>',
      '<line pointer-events="none" x1="' + roundPx(centre.x) + '" y1="' + roundPx(centre.y) + '" x2="' +
        roundPx(centre.x + radius) + '" y2="' + roundPx(centre.y) + '" stroke="#6d74db" stroke-width="2.5" stroke-dasharray="7 5"/>',
      '<circle cx="' + roundPx(centre.x) + '" cy="' + roundPx(centre.y) + '" r="5" fill="#5e67ce" data-drag="shape"/>',
      svgLabel(centre.x + radius / 2, centre.y - 19, 'r = ' + fmt(radius / UNIT), '#595ec1', 15),
      handle(centre.x + radius, centre.y, 'data-radius="true"')
    );
    if (state.grid) parts.push(svgLabel(centre.x - 28, centre.y + 24, 'O', '#919db2', 12));
  } else {
    const points = state.shape.points;
    const geometry = measurePolygon(points);
    parts.push('<polygon class="shape-body" data-drag="shape" points="' + points.map(pointString).join(' ') +
      '" fill="url(#shapeFill)" stroke="#747ae7" stroke-width="3.5" stroke-linejoin="round"/>');
    const { centroid } = geometry;
    if (state.lengths && points.length <= 7) {
      points.forEach((p, i) => {
        const next = points[(i + 1) % points.length];
        const mx = (p.x + next.x) / 2, my = (p.y + next.y) / 2;
        const dx = mx - centroid.x, dy = my - centroid.y;
        const d = Math.hypot(dx, dy) || 1;
        parts.push(
          '<rect pointer-events="none" x="' + roundPx(mx + 17 * dx / d - 26) + '" y="' +
            roundPx(my + 17 * dy / d - 12) + '" rx="7" width="52" height="24" fill="white" opacity=".93"/>',
          svgLabel(mx + 17 * dx / d, my + 17 * dy / d, fmt(geometry.lengths[i]), '#5a649e', 13)
        );
      });
    }
    if (points.length <= 4 && !geometry.invalid) {
      points.forEach((p, i) => {
        const dx = centroid.x - p.x, dy = centroid.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        parts.push(svgLabel(p.x + 40 * dx / d, p.y + 40 * dy / d,
          Math.round(geometry.angles[i]) + '°', '#66728f', 13, 800));
      });
    }
    points.forEach((p, i) => {
      parts.push(handle(p.x, p.y, 'data-vertex="' + i + '"'));
      if (points.length <= 5) {
        const dx = p.x - centroid.x, dy = p.y - centroid.y;
        const d = Math.hypot(dx, dy) || 1;
        parts.push(svgLabel(p.x + 26 * dx / d, p.y + 26 * dy / d,
          String.fromCharCode(65 + i), '#57607e', 12));
      }
    });
  }
  parts.push(
    '<g pointer-events="none" transform="translate(17 20)"><rect width="134" height="31" rx="8" fill="white" stroke="#e9edf5"/>',
    '<circle cx="16" cy="15.5" r="4.5" fill="#60bfa7"/>',
    '<text x="29" y="20" fill="#7e89a2" font-size="11" font-weight="700">LIVE GEOMETRY</text></g>'
  );
  svg.innerHTML = parts.join('');
}

function metric(label, value, unit, highlighted = false) {
  return '<div class="metric-card' + (highlighted ? ' purple' : '') + '"><span class="metric-label">' +
    label + '</span><span class="metric-value">' + value + '<span class="metric-unit">' +
    unit + '</span></span></div>';
}

function detail(label, value) {
  return '<li><span>' + label + '</span><strong>' + value + '</strong></li>';
}

function renderMath() {
  const isCircle = state.shape.kind === 'circle';
  const m = isCircle ? measureCircle(state.shape.radius) : measurePolygon(state.shape.points);
  const invalid = m.invalid;
  const displayName = m.name;
  document.getElementById('canvas-shape-title').textContent = displayName;
  document.getElementById('shape-type').textContent = isCircle ? 'centre + radius' : m.sides + ' vertices';
  document.getElementById('math-shape-title').textContent = displayName;
  document.getElementById('math-description').textContent = isCircle ?
    'Watch radius, diameter, area and circumference respond.' :
    'Move any point and every value is recalculated instantly.';

  if (isCircle) {
    metricsEl.innerHTML =
      metric('Area', fmt(m.area), 'u²', true) +
      metric('Circumference', fmt(m.perimeter), 'u') +
      metric('Radius', fmt(m.radius), 'u') +
      metric('Diameter', fmt(m.diameter), 'u');
    explanationEl.innerHTML =
      '<span class="formula-title">The area of a circle</span>' +
      '<div class="formula-box">A = πr² = ' + fmt(m.area) + ' u²</div>' +
      '<p class="formula-desc">A circle contains π times the square of its radius. That is why changing the radius affects area non-linearly.</p>' +
      '<ul class="detail-list">' +
      detail('Circumference: 2πr', fmt(m.perimeter) + ' u') +
      detail('Diameter: 2r', fmt(m.diameter) + ' u') +
      detail('Centre', coordDisplay(state.shape.centre)) + '</ul>';
    discoveryEl.className = 'discovery';
    discoveryEl.innerHTML = '<span class="discovery-icon">✳</span><div><strong>Radius versus area.</strong> Doubling the radius would double the circumference but multiply the area by four.' +
      (state.lastAction ? '<br>' + state.lastAction : '') + '</div>';
    document.getElementById('experiment-prompt').textContent =
      'Drag the right-hand handle outwards. Does area increase at the same rate as radius?';
    return m;
  }

  metricsEl.innerHTML =
    metric('Area', fmt(m.area), 'u²', true) +
    metric('Perimeter', fmt(m.perimeter), 'u') +
    metric('Side count', String(m.sides), '') +
    metric('Angle sum', invalid ? '—' : fmt(m.angleSum, 0) + '°', '');

  const sides = m.lengths.map((len, i) => String.fromCharCode(65 + i) +
    String.fromCharCode(65 + (i + 1) % m.sides) + ': ' + fmt(len) + ' u');
  const triangle = m.sides === 3;
  const base = m.lengths[0];
  const height = base > 1e-6 ? 2 * m.area / base : 0;
  const formula = triangle ? 'A = ½ × base × height' : 'A = ½ × |Σ (xᵢyᵢ₊₁ − yᵢxᵢ₊₁)|';
  const meaning = triangle ?
    'The altitude (perpendicular height) to side AB determines area. Moving C parallel to AB keeps that area fixed.' :
    'The shoelace formula uses each successive pair of vertex coordinates to find the enclosed area of a simple polygon.';
  explanationEl.innerHTML =
    '<span class="formula-title">' + (triangle ? 'Triangle area' : 'Polygon area · shoelace rule') + '</span>' +
    '<div class="formula-box">' + formula + '<br> = ' + fmt(m.area) + ' u²</div>' +
    '<p class="formula-desc">' + meaning + '</p>' +
    '<ul class="detail-list">' +
    (triangle ? detail('Base AB', fmt(base) + ' u') + detail('Perpendicular height', fmt(height) + ' u') +
      detail('Heron’s formula check', fmt(m.heronArea) + ' u²') : '') +
    detail('Side lengths', sides.join(' · ')) +
    detail('Interior angles', m.angles.map(v => fmt(v, 1) + '°').join(' · ')) +
    detail('Expected angle sum', fmt(m.expectedAngleSum, 0) + '°') +
    '</ul>';

  if (invalid) {
    discoveryEl.className = 'discovery warning';
    discoveryEl.innerHTML = '<span class="discovery-icon">⚠</span><div><strong>Not a simple polygon.</strong> Edges cross or the shape has collapsed. Shoelace gives a signed-area magnitude, not necessarily the physical region you expect. Pull the points apart.</div>';
  } else {
    discoveryEl.className = 'discovery';
    let insight;
    if (triangle) {
      insight = 'No matter how you drag its three corners, a non-degenerate triangle’s interior angles add to 180°. ' +
        (Math.abs(m.angleSum - 180) < .01 ? 'Your current total confirms it.' : '');
    } else if (m.sides === 4) {
      insight = 'Four interior angles add to 360°, even when the quadrilateral is irregular. ' +
        'A square only stays a square while its sides remain equal and its angles stay right angles.';
    } else {
      insight = 'The interior-angle sum of any simple ' + m.sides + '-gon is (' + m.sides +
        ' − 2) × 180° = ' + fmt(m.expectedAngleSum, 0) + '°. Equal side lengths alone do not guarantee equal angles.';
    }
    discoveryEl.innerHTML = '<span class="discovery-icon">✳</span><div><strong>A pattern worth noticing.</strong> ' +
      insight + (state.lastAction ? '<br>' + state.lastAction : '') + '</div>';
  }
  document.getElementById('experiment-prompt').textContent = triangle ?
    'Move the top vertex parallel to the base. Can you keep area fixed while changing the side lengths?' :
    m.sides === 4 ?
    'Pull one corner of the square or rectangle. Which properties survive the change?' :
    'Try moving one point. Do the interior angles still add to the same total?';
  return m;
}

function render() {
  document.querySelectorAll('[data-preset]').forEach(button => {
    const active = button.dataset.preset === state.preset;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-transform]').forEach(button => {
    button.disabled = state.shape.kind === 'circle' &&
      (button.dataset.transform === 'rotate-left' ||
       button.dataset.transform === 'rotate-right' || button.dataset.transform === 'reflect');
  });
  renderDiagram();
  renderMath();
}

function limitTranslation(points, dx, dy) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const lowX = Math.min(...xs), highX = Math.max(...xs);
  const lowY = Math.min(...ys), highY = Math.max(...ys);
  return {
    dx: clamp(dx, 24 - lowX, WIDTH - 24 - highX),
    dy: clamp(dy, 24 - lowY, HEIGHT - 24 - highY)
  };
}

svg.addEventListener('pointerdown', evt => {
  if (evt.button !== 0 && evt.pointerType === 'mouse') return;
  const hit = evt.target.closest('[data-vertex], [data-radius], [data-drag]');
  if (!hit) return;
  evt.preventDefault();
  const start = svgPoint(evt);
  state.drag = {
    pointerId: evt.pointerId,
    start,
    type: hit.hasAttribute('data-vertex') ? 'vertex' :
      hit.hasAttribute('data-radius') ? 'radius' : 'shape',
    index: Number(hit.getAttribute('data-vertex')),
    original: state.shape.kind === 'circle' ?
      { kind: 'circle', centre: { ...state.shape.centre }, radius: state.shape.radius } :
      { kind: 'polygon', points: state.shape.points.map(p => ({ ...p })) }
  };
  svg.setPointerCapture(evt.pointerId);
});

svg.addEventListener('pointermove', evt => {
  const drag = state.drag;
  if (!drag || drag.pointerId !== evt.pointerId) return;
  const pointer = svgPoint(evt);
  const dx = pointer.x - drag.start.x;
  const dy = pointer.y - drag.start.y;
  if (drag.original.kind === 'circle') {
    if (drag.type === 'radius') {
      const centre = drag.original.centre;
      state.shape.radius = clamp(distance(centre, pointer), 30, Math.min(centre.x - 24, WIDTH - centre.x - 24, centre.y - 24, HEIGHT - centre.y - 24));
    } else {
      const radius = drag.original.radius;
      state.shape.centre = snapPoint({
        x: clamp(drag.original.centre.x + dx, radius + 24, WIDTH - radius - 24),
        y: clamp(drag.original.centre.y + dy, radius + 24, HEIGHT - radius - 24)
      });
    }
  } else if (drag.type === 'vertex') {
    const next = drag.original.points.map(p => ({ ...p }));
    next[drag.index] = snapPoint({
      x: clamp(next[drag.index].x + dx, 24, WIDTH - 24),
      y: clamp(next[drag.index].y + dy, 24, HEIGHT - 24)
    });
    state.shape.points = next;
  } else {
    const delta = limitTranslation(drag.original.points, dx, dy);
    const target = drag.original.points.map(p => ({ x: p.x + delta.dx, y: p.y + delta.dy }));
    if (state.snap) {
      const offsetX = coordinate(delta.dx), offsetY = coordinate(delta.dy);
      const snapped = limitTranslation(drag.original.points, offsetX, offsetY);
      state.shape.points = drag.original.points.map(p => ({ x: p.x + snapped.dx, y: p.y + snapped.dy }));
    } else state.shape.points = target;
  }
  state.lastAction = '';
  render();
});

function finishDrag(evt) {
  if (!state.drag || state.drag.pointerId !== evt.pointerId) return;
  state.drag = null;
  if (svg.hasPointerCapture(evt.pointerId)) svg.releasePointerCapture(evt.pointerId);
}
svg.addEventListener('pointerup', finishDrag);
svg.addEventListener('pointercancel', finishDrag);
svg.addEventListener('lostpointercapture', () => { state.drag = null; });

function selectPreset(key) {
  state.preset = key;
  state.shape = createPreset(key, state.regularSides);
  state.lastAction = '';
  render();
}

document.querySelectorAll('[data-preset]').forEach(button =>
  button.addEventListener('click', () => selectPreset(button.dataset.preset)));

document.getElementById('regular-sides').addEventListener('input', evt => {
  state.regularSides = Number(evt.target.value);
  document.getElementById('sides-value').textContent = state.regularSides;
  selectPreset('regular');
});

function transform(action) {
  if (state.shape.kind === 'circle') {
    if (action === 'grow' || action === 'shrink') {
      const multiplier = action === 'grow' ? 1.1 : 0.9;
      state.shape.radius = clamp(state.shape.radius * multiplier, 30, 250);
      state.lastAction = 'Scaling the radius by ' + fmt(multiplier, 1) +
        ' scales circumference by ' + fmt(multiplier, 1) + ' and area by ' + fmt(multiplier * multiplier, 2) + '.';
    }
    render();
    return;
  }
  const p = state.shape.points;
  const before = measurePolygon(p);
  let transformed;
  if (action === 'rotate-left') transformed = rotatePolygon(p, -15);
  if (action === 'rotate-right') transformed = rotatePolygon(p, 15);
  if (action === 'reflect') transformed = reflectPolygon(p);
  if (action === 'grow') transformed = scalePolygon(p, 1.1);
  if (action === 'shrink') transformed = scalePolygon(p, 0.9);
  if (!transformed) return;
  if (transformed.some(point => point.x < 24 || point.x > WIDTH - 24 || point.y < 24 || point.y > HEIGHT - 24)) {
    state.lastAction = 'This transformation would move a vertex outside the workspace. Move the shape inward first.';
    render();
    return;
  }
  state.shape.points = transformed;
  const after = measurePolygon(transformed);
  if (action === 'grow' || action === 'shrink') {
    const scale = action === 'grow' ? 1.1 : 0.9;
    state.lastAction = 'Scale ×' + fmt(scale, 1) + ': perimeter ×' + fmt(scale, 1) +
      ', area ×' + fmt(scale * scale, 2) + ' (from ' + fmt(before.area) + ' to ' + fmt(after.area) + ' u²).';
  } else {
    state.lastAction = 'Rigid transformation: area (' + fmt(after.area) +
      ' u²) and perimeter (' + fmt(after.perimeter) + ' u) stay the same.';
  }
  render();
}

document.querySelectorAll('[data-transform]').forEach(button =>
  button.addEventListener('click', () => transform(button.dataset.transform)));

document.getElementById('reset').addEventListener('click', () => selectPreset(state.preset));

document.getElementById('randomise').addEventListener('click', () => {
  if (state.shape.kind === 'circle') {
    state.shape.radius = 80 + Math.random() * 155;
    state.shape.centre = { x: 480, y: 310 };
  } else {
    const base = createPreset(state.preset, state.regularSides);
    state.shape.points = base.points.map(p => ({
      x: clamp(p.x + (Math.random() - .5) * 104, 40, WIDTH - 40),
      y: clamp(p.y + (Math.random() - .5) * 104, 40, HEIGHT - 40)
    }));
  }
  state.lastAction = '';
  render();
});

const settings = [
  ['toggle-grid', 'grid'],
  ['toggle-lengths', 'lengths'],
  ['toggle-snap', 'snap']
];
for (const [id, prop] of settings) {
  document.getElementById(id).addEventListener('change', evt => {
    state[prop] = evt.target.checked;
    render();
  });
}

document.getElementById('copy-results').addEventListener('click', async () => {
  const m = state.shape.kind === 'circle' ? measureCircle(state.shape.radius) : measurePolygon(state.shape.points);
  const lines = [
    'Geometry Maths Playground — ' + m.name,
    'Area: ' + fmt(m.area) + ' square units',
    (m.kind === 'circle' ? 'Circumference: ' : 'Perimeter: ') + fmt(m.perimeter) + ' units'
  ];
  if (m.kind === 'circle') lines.push('Radius: ' + fmt(m.radius), 'Diameter: ' + fmt(m.diameter));
  else lines.push(
    'Sides: ' + m.lengths.map(n => fmt(n)).join(', '),
    'Interior angles: ' + m.angles.map(n => fmt(n, 1) + '°').join(', '),
    'Shape is simple: ' + String(!m.invalid)
  );
  const button = document.getElementById('copy-results');
  const message = button.querySelector('span');
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    message.textContent = 'Copied to clipboard';
  } catch {
    const box = document.createElement('textarea');
    box.value = lines.join('\n');
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand('copy');
    box.remove();
    message.textContent = ok ? 'Copied to clipboard' : 'Copy not available in this browser';
  }
  button.blur();
});

render();
