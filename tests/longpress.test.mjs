import test from 'node:test';
import assert from 'node:assert/strict';

function createFakeElement({ left = 0, top = 0, width = 120, height = 40 } = {}) {
  const listeners = new Map();
  const element = {
    dataset: {},
    style: {},
    attributes: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    children: [],
    parentNode: null,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    removeEventListener(type, callback) {
      listeners.set(type, (listeners.get(type) || []).filter(item => item !== callback));
    },
    dispatch(type, event = {}) {
      const callbacks = listeners.get(type) || [];
      for (const callback of callbacks) {
        callback({
          type,
          target: element,
          currentTarget: element,
          preventDefault() {},
          stopPropagation() {},
          ...event
        });
      }
    },
    getBoundingClientRect() {
      return { left, top, width, height, right: left + width, bottom: top + height };
    },
    contains(target) {
      return target === element || element.children.includes(target);
    },
    appendChild(child) {
      child.parentNode = element;
      element.children.push(child);
      return child;
    },
    remove() {
      this.parentNode = null;
      if (this.parentNode && Array.isArray(this.parentNode.children)) {
        this.parentNode.children = this.parentNode.children.filter(item => item !== this);
      }
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };

  return element;
}

test('LongPressManager fires open after hold threshold', async () => {
  const { LongPressManager } = await import('../src/core/interaction/LongPressManager.js');
  const root = createFakeElement({ left: 0, top: 0, width: 800, height: 600 });
  const control = createFakeElement({ left: 150, top: 120, width: 80, height: 40 });

  let opened = null;
  const manager = new LongPressManager({
    root,
    threshold: 300,
    onOpen: (payload) => {
      opened = payload;
    }
  });

  manager.register(control, {
    actions: [{ label: 'Action 1', callback: () => {} }]
  });

  control.dispatch('pointerdown', { clientX: 180, clientY: 150, pointerType: 'touch' });

  await new Promise(resolve => setTimeout(resolve, 350));

  assert.ok(opened, 'the long press should trigger after the threshold');
  assert.equal(opened.target, control, 'the opened target should be the control');
});

test('ContextPopover clamps menu within the visible area', async () => {
  const { ContextPopover } = await import('../src/core/interaction/ContextPopover.js');
  const root = createFakeElement({ left: 0, top: 0, width: 500, height: 600 });
  const popover = new ContextPopover({ root, title: 'Actions' });

  const position = popover.calculateMenuPosition({
    anchorRect: { left: 430, top: 520, width: 40, height: 40, right: 470, bottom: 560 },
    menuSize: { width: 220, height: 180 },
    containerRect: { left: 0, top: 0, width: 500, height: 600, right: 500, bottom: 600 },
    preferredSide: 'bottom-left'
  });

  assert.ok(position.x >= 0, 'menu should not overflow left');
  assert.ok(position.x + 220 <= 500, 'menu should not overflow right');
  assert.ok(position.y >= 0, 'menu should not overflow top');
  assert.ok(position.y + 180 <= 600, 'menu should not overflow bottom');
});

test('hold cancels on short release, movement, pointer loss and cancellation', async (t) => {
  const { HoldGesture } = await import('../src/core/interaction/HoldGesture.js');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let opened = 0;
  const target = createFakeElement();
  const gesture = new HoldGesture({ onHold: () => opened++ });
  gesture.register(target);
  for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']) {
    target.dispatch('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 });
    t.mock.timers.tick(250);
    target.dispatch(type, { pointerId: 1 });
    t.mock.timers.tick(500);
  }
  target.dispatch('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 });
  target.dispatch('pointermove', { clientX: 30, clientY: 10, pointerId: 1 });
  t.mock.timers.tick(500);
  assert.equal(opened, 0);
  target.dispatch('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 });
  t.mock.timers.tick(499);
  assert.equal(opened, 0);
  t.mock.timers.tick(1);
  assert.equal(opened, 1);
  gesture.destroy();
});

test('re-registration and destruction leave no duplicate handlers or pending holds', async (t) => {
  const { HoldGesture } = await import('../src/core/interaction/HoldGesture.js');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let opened = 0;
  const target = createFakeElement();
  const gesture = new HoldGesture({ onHold: () => opened++ });
  gesture.register(target); gesture.register(target);
  target.dispatch('pointerdown', { clientX: 0, clientY: 0 });
  t.mock.timers.tick(500);
  assert.equal(opened, 1);
  target.dispatch('pointerdown', { clientX: 0, clientY: 0 });
  gesture.destroy();
  t.mock.timers.tick(500);
  target.dispatch('pointerdown', { clientX: 0, clientY: 0 });
  t.mock.timers.tick(500);
  assert.equal(opened, 1);
});

test('post-hold click suppression targets the original control and never eats panel actions', async (t) => {
  const { HoldGesture } = await import('../src/core/interaction/HoldGesture.js');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const target = createFakeElement();
  const gesture = new HoldGesture({ onHold() {} });
  gesture.register(target);
  const hold = () => {
    target.dispatch('pointerdown', { clientX: 0, clientY: 0 });
    t.mock.timers.tick(500);
  };
  let prevented = 0;
  const click = clicked => gesture.onClick({ target: clicked, preventDefault() { prevented++; }, stopPropagation() {} });
  hold(); click(target); click(target);
  assert.equal(prevented, 1);
  hold(); click(createFakeElement());
  assert.equal(prevented, 1, 'first panel action remains clickable');
  gesture.destroy();
});
