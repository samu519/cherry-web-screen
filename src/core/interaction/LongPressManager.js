import { ContextPopover } from './ContextPopover.js';
import { OverlayManager } from './OverlayManager.js';

export class LongPressManager {
    constructor({ root = document.body, threshold = 500, onOpen = null, onClose = null } = {}) {
        this.root = root || document.body;
        this.threshold = threshold;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.registry = new Map();
        this.activePress = null;
        this.suppressClickTarget = null;
        this.suppressNextClick = false;

        this.overlayManager = new OverlayManager(this.root);
        this.contextPopover = new ContextPopover({
            root: this.root,
            overlayManager: this.overlayManager
        });

        if (typeof document !== 'undefined') {
            this._documentClickHandler = (event) => {
                if (!this.suppressClickTarget) {
                    return;
                }

                const target = event.target;
                if (target === this.suppressClickTarget || this.suppressClickTarget.contains?.(target)) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.suppressClickTarget = null;
                }
            };

            document.addEventListener('click', this._documentClickHandler, true);
        }
    }

    register(target, config = {}) {
        if (!target || !target.addEventListener) {
            return null;
        }

        const payload = {
            target,
            title: config.title ?? target.dataset?.widgetType ?? 'Control',
            actions: config.actions ?? [],
            onAction: config.onAction ?? null,
            threshold: config.threshold ?? this.threshold
        };

        this.registry.set(target, payload);

        const handlePointerDown = (event) => {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            this.startPress(target, payload, event);
        };

        const handlePointerMove = (event) => {
            if (!this.activePress || this.activePress.target !== target) {
                return;
            }

            const dx = Math.abs(event.clientX - this.activePress.startX);
            const dy = Math.abs(event.clientY - this.activePress.startY);
            if (dx > 10 || dy > 10) {
                this.cancelPress();
            }
        };

        const handlePointerUp = () => {
            this.cancelPress();
        };

        if (!target.__cherryLongPressHandlers) {
            target.__cherryLongPressHandlers = new Map();
        }

        target.__cherryLongPressHandlers.set('pointerdown', handlePointerDown);
        target.__cherryLongPressHandlers.set('pointermove', handlePointerMove);
        target.__cherryLongPressHandlers.set('pointerup', handlePointerUp);
        target.__cherryLongPressHandlers.set('pointercancel', handlePointerUp);

        target.addEventListener('pointerdown', handlePointerDown);
        target.addEventListener('pointermove', handlePointerMove);
        target.addEventListener('pointerup', handlePointerUp);
        target.addEventListener('pointercancel', handlePointerUp);

        return target;
    }

    unregister(target) {
        const handlers = target?.__cherryLongPressHandlers;
        if (!handlers) {
            return;
        }

        handlers.forEach((handler, type) => {
            target.removeEventListener(type, handler);
        });

        target.__cherryLongPressHandlers = null;
        this.registry.delete(target);
    }

    startPress(target, payload, event) {
        this.cancelPress();

        this.activePress = {
            target,
            payload,
            startX: event.clientX,
            startY: event.clientY,
            timer: setTimeout(() => {
                this.open({
                    target,
                    title: payload.title,
                    actions: payload.actions,
                    onAction: payload.onAction,
                    preferredSide: 'bottom-left'
                });
            }, payload.threshold)
        };
    }

    cancelPress() {
        if (!this.activePress) {
            return;
        }

        clearTimeout(this.activePress.timer);
        this.activePress = null;
    }

    open({ target, title = 'Control', actions = [], onAction = null, preferredSide = 'bottom-left' } = {}) {
        if (!target) {
            return null;
        }

        this.cancelPress();
        this.suppressClickTarget = target;

        this.contextPopover.open({
            target,
            title,
            actions,
            onAction,
            preferredSide
        });

        if (typeof this.onOpen === 'function') {
            this.onOpen({ target, title, actions });
        }

        return this.contextPopover;
    }

    close() {
        this.contextPopover.close();
        this.suppressClickTarget = null;

        if (typeof this.onClose === 'function') {
            this.onClose();
        }
    }
}
