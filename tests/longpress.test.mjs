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
