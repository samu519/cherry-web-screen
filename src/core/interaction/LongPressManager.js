import { ContextPopover } from './ContextPopover.js';
import { OverlayManager } from './OverlayManager.js';
import { HoldGesture } from './HoldGesture.js';

export class LongPressManager {
    constructor({ root = document.body, threshold = 500, onOpen = null, onClose = null } = {}) {
        this.root = root; this.onOpen = onOpen; this.onClose = onClose;
        this.registry = new Map();
        this.overlayManager = new OverlayManager(root);
        this.contextPopover = new ContextPopover({ root, overlayManager: this.overlayManager,
            onClose: () => this.onClose?.() });
        this.gesture = new HoldGesture({ threshold, onHold: (target, config) => this.open({ target, ...config }) });
    }

    register(target, config = {}) {
        if (!target?.addEventListener) return null;
        this.registry.set(target, config);
        return this.gesture.register(target, config);
    }

    unregister(target) { this.gesture.unregister(target); this.registry.delete(target); }
    cancelPress() { this.gesture.cancel(); }

    open({ target, title = 'Control', actions = [], onAction = null } = {}) {
        if (!target) return null;
        this.cancelPress();
        this.contextPopover.open({ target, title, actions, onAction });
        this.onOpen?.({ target, title, actions });
        return this.contextPopover;
    }

    close() { this.contextPopover.close(); }
    destroy() { this.gesture.destroy(); this.registry.clear(); this.close(); }
}
