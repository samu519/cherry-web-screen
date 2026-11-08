import { OverlayManager } from './OverlayManager.js';
import { ExpandablePanel } from './ExpandablePanel.js';
import { HoldGesture } from './HoldGesture.js';

export class ExpansionManager {
    constructor({ root = document.body, threshold = 500, animationDuration = 250 } = {}) {
        this.root = root;
        this.handlers = new Map();
        this.isExpanded = false;
        this.expandedControlId = null;
        this.expandedElement = null;
        this.activePanel = null;
        this.overlayManager = new OverlayManager(root);
        this.panel = new ExpandablePanel({ root, overlayManager: this.overlayManager, animationDuration });
        this.gesture = new HoldGesture({ threshold, onHold: (_, payload) => this._expand(payload) });
    }

    register(element, config = {}) {
        if (!element) return null;
        const payload = { ...config, element, id: config.id ?? element.dataset.control,
            label: config.label ?? '', getContent: config.getContent ?? (() => null) };
        const previous = this.handlers.get(payload.id);
        if (previous) this.unregister(previous.element);
        this.handlers.set(payload.id, payload);
        element.setAttribute('aria-haspopup', 'dialog');
        element.setAttribute('aria-expanded', 'false');
        element.setAttribute('aria-keyshortcuts', 'Shift+F10 Alt+ArrowDown');
        element.title = `${payload.label}: mantener pulsado para ajustes (Alt+↓)`;
        this.gesture.register(element, payload);
        return payload;
    }

    unregister(element) {
        this.gesture.unregister(element);
        for (const [id, payload] of this.handlers) {
            if (payload.element === element) this.handlers.delete(id);
        }
    }

    _expand(payload) {
        if (!payload || this.isControlExpanded(payload.id)) return;
        this.collapse();
        let content;
        try { content = payload.getContent({ controlId: payload.id, controlLabel: payload.label }); }
        catch (error) { console.error('Cherry: unable to open settings', error); return; }
        this.isExpanded = true;
        this.expandedControlId = payload.id;
        this.expandedElement = payload.element;
        payload.element?.setAttribute('aria-expanded', 'true');
        this.panel.open({ id: payload.id, label: payload.label, content, element: payload.element,
            onAction: payload.onAction, onClose: () => {
                payload.element?.setAttribute('aria-expanded', 'false');
                this.isExpanded = false;
                this.expandedControlId = null;
                this.expandedElement = null;
                this.activePanel = null;
            } });
        this.activePanel = this.panel;
    }

    collapse() { this.panel.close(); }

    openPanel({ id = 'more', label = 'Controles', element = null, getContent = () => null, onAction = null } = {}) {
        if (this.isControlExpanded(id)) return this.collapse();
        this._expand({ id, label, element, getContent: typeof getContent === 'function' ? getContent : () => getContent, onAction });
    }

    toggle(elementOrId) {
        const id = typeof elementOrId === 'string' ? elementOrId : elementOrId?.dataset.control;
        if (this.isControlExpanded(id)) this.collapse();
        else this._expand(this.handlers.get(id));
    }

    isControlExpanded(id) { return this.isExpanded && this.expandedControlId === id; }

    destroy() {
        this.gesture.destroy(); this.handlers.clear(); this.collapse();
    }
}
