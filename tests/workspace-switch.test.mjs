import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the actual workspace switch with a minimal DOM model (no WebGL required).
test('2D and 3D canvases replace one another without stacking', async () => {
  class Element {
    constructor(name = 'div') {
      this.name = name; this.children = []; this.parent = null;
      this.hidden = false; this.dataset = {}; this.listeners = {};
      this.classes = new Set();
      this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
    }
    setAttribute(name, value) { this[name] = value; }
    append(child) { child.parent = this; this.children.push(child); }
    prepend(child) { child.parent = this; this.children.unshift(child); }
    after(child) {
      assert.ok(this.parent, 'Element requires a parent to insert after it');
      child.parent = this.parent;
      this.parent.children.splice(this.parent.children.indexOf(this) + 1, 0, child);
    }
    addEventListener(event, listener) { this.listeners[event] = listener; }
    closest(selector) { return selector === '[data-workspace]' && this.dataset.workspace ? this : null; }
    querySelector(selector) {
      if (this === heading && selector === 'h1') return title;
      if (this === heading && selector === 'p') return intro;
      return null;
    }
    querySelectorAll(selector) {
      return this.className === 'workspace-switch' && selector === 'button' ? buttons : [];
    }
  }

  const heading = new Element(), title = new Element('h1'), intro = new Element('p');
  const left = new Element(), right = new Element(), card = new Element();
  const bar = new Element(), wrap = new Element(), svg = new Element('svg');
  const bottom = new Element(), note = new Element();
  card.append(bar); card.append(wrap); wrap.append(svg); card.append(bottom);
  const buttons = ['2d', '3d'].map(mode => {
    const button = new Element('button'); button.dataset.workspace = mode; return button;
  });
  const selectors = new Map([
    ['.stage-heading', heading], ['.left-panel', left], ['.right-panel', right],
    ['.canvas-wrap', wrap], ['.canvas-bar', bar],
    ['.canvas-bottom', bottom], ['.stage-note', note]
  ]);
  const document = {
    querySelector: selector => selectors.get(selector),
    getElementById: id => id === 'geometry-canvas' ? svg : null,
    createElement: name => new Element(name)
  };
  const source = readFileSync(new URL('../src/workspace-switch.js', import.meta.url), 'utf8');
  // A failed dynamic WebGL import is caught in the switch handler; DOM visibility remains testable.
  runInNewContext(source, { document, console: { error() {} } }, { filename: 'workspace-switch.js' });

  const tabs = heading.children[0];
  const three = card.children.find(child => child.id === 'three-stage');
  assert.ok(three, 'The 3D view must be in the canvas card, not nested inside the 2D view');
  assert.deepEqual(card.children, [bar, wrap, three, bottom]);
  assert.equal(wrap.hidden, false);
  assert.equal(three.hidden, true);

  await tabs.listeners.click({ target: buttons[1] });
  assert.equal(wrap.hidden, true);
  assert.equal(three.hidden, false);
  assert.equal(bar.hidden, true);
  assert.equal(bottom.hidden, true);
  assert.equal(note.hidden, true);
  assert.equal(left.children[0].hidden, false);
  assert.equal(right.children[0].hidden, false);

  await tabs.listeners.click({ target: buttons[0] });
  assert.equal(wrap.hidden, false);
  assert.equal(three.hidden, true);
  assert.equal(bar.hidden, false);
  assert.equal(bottom.hidden, false);
  assert.equal(note.hidden, false);
  assert.equal(left.children[0].hidden, true);
  assert.equal(right.children[0].hidden, true);
});
