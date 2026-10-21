// V1 remains entirely intact. V2 is loaded only when the 3D workspace is selected.
const stageHeading = document.querySelector('.stage-heading');
const header = document.createElement('div');
header.className = 'workspace-switch';
header.setAttribute('role', 'group');
header.setAttribute('aria-label', 'Choose geometry dimensions');
header.innerHTML = '<button type="button" class="workspace-tab active" data-workspace="2d" aria-pressed="true">2D playground</button><button type="button" class="workspace-tab" data-workspace="3d" aria-pressed="false">3D laboratory <span aria-hidden="true">✦</span></button>';
stageHeading.prepend(header);

const current = {
  left: document.querySelector('.left-panel'),
  right: document.querySelector('.right-panel'),
  canvasWrap: document.querySelector('.canvas-wrap'),
  bar: document.querySelector('.canvas-bar'),
  bottom: document.querySelector('.canvas-bottom'),
  note: document.querySelector('.stage-note'),
  title: stageHeading.querySelector('h1'),
  intro: stageHeading.querySelector('p')
};
let three = null;
let initialising = false;
let active = '2d';
const stage3d = document.createElement('div');
stage3d.id = 'three-stage';
stage3d.className = 'three-stage';
stage3d.hidden = true;
// Both workspaces occupy the same canvas-card slot; never nest the 3D view inside the SVG wrapper.
current.canvasWrap.after(stage3d);
const left3d = document.createElement('div');
left3d.id = 'three-tools'; left3d.hidden = true;
current.left.append(left3d);
const right3d = document.createElement('div');
right3d.id = 'three-math'; right3d.hidden = true;
current.right.append(right3d);

function show(mode) {
  active = mode;
  const is3d = mode === '3d';
  for (const button of header.querySelectorAll('button')) {
    const on = button.dataset.workspace === mode;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', String(on));
  }
  current.left.classList.toggle('three-active', is3d);
  current.right.classList.toggle('three-active', is3d);
  // Hide the *entire* 2D canvas wrapper, not only its SVG child.
  // This ensures the inactive diagram cannot remain visible or reserve vertical space.
  current.canvasWrap.hidden = is3d;
  current.bar.hidden = is3d;
  current.bottom.hidden = is3d;
  current.note.hidden = is3d;
  left3d.hidden = !is3d;
  right3d.hidden = !is3d;
  stage3d.hidden = !is3d;
  current.title.innerHTML = is3d ? 'Shape space. <em>Explore in depth.</em>' : 'Move things. <em>Discover why.</em>';
  current.intro.textContent = is3d ? 'Orbit a solid, unfold its connected faces into a net, or resize its dimensions.' : 'Drag a coloured point to reshape. Drag inside the shape to move it.';
  three?.setActive(is3d);
}

header.addEventListener('click', async event => {
  const tab = event.target.closest('[data-workspace]');
  if (!tab || initialising) return;
  if (tab.dataset.workspace === '2d') { show('2d'); return; }
  show('3d');
  if (three) return;
  initialising = true;
  stage3d.innerHTML = '<div class="three-loading" role="status">Preparing the 3D workspace…</div>';
  try {
    const module = await import('./three-workspace.js');
    three = module.mount3D({ canvasHost: stage3d, toolsHost: left3d, mathHost: right3d });
    three.setActive(active === '3d');
  } catch (err) {
    console.error('3D laboratory failed to initialise', err);
    const detail = err instanceof Error ? err.message : String(err);
    const failure = document.createElement('div');
    failure.className = 'three-loading';
    failure.setAttribute('role', 'alert');
    const title = document.createElement('strong');
    title.textContent = 'Unable to initialise the 3D laboratory.';
    const explanation = document.createElement('p');
    explanation.textContent = detail;
    const hint = document.createElement('p');
    hint.textContent = 'Switch to 2D and back to retry. If it persists, the error above identifies what failed.';
    failure.append(title, explanation, hint);
    stage3d.replaceChildren(failure);
  } finally { initialising = false; }
});
