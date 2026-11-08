// Shared gesture lifecycle for control settings and editor context panels.
export class HoldGesture {
    constructor({ threshold = 500, onHold }) {
        this.threshold = threshold;
        this.onHold = onHold;
        this.targets = new Map();
        this.press = null;
        this.suppressed = null;
        this.document = typeof document !== 'undefined' ? document : null;
        this.onMove = event => {
            if (!this.press || event.pointerId !== this.press.pointerId) return;
            if (Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y) > 12) this.cancel();
        };
        this.onEnd = event => {
            if (this.press && event.pointerId === this.press.pointerId) this.cancel();
        };
        this.onClick = event => {
            const target = this.suppressed;
            this.suppressed = null;
            if (target && event.detail !== 0 && (event.target === target || target.contains?.(event.target))) {
                event.preventDefault();
                event.stopImmediatePropagation?.();
                event.stopPropagation();
            }
        };
        this.onBlur = () => this.cancel();
        this.document?.addEventListener('pointermove', this.onMove, true);
        this.document?.addEventListener('pointerup', this.onEnd, true);
        this.document?.addEventListener('pointercancel', this.onEnd, true);
        this.document?.addEventListener('click', this.onClick, true);
        globalThis.addEventListener?.('blur', this.onBlur);
    }

    register(target, config = {}) {
        this.unregister(target);
        const down = event => {
            if ((event.button !== undefined && event.button !== 0) || event.isPrimary === false) return;
            if (target.classList?.contains('cherry-widget') && event.target !== target &&
                event.target?.closest?.('button, input, select, textarea, a[href]')) return;
            event.stopPropagation?.();
            this.start(target, config, event);
        };
        const key = event => {
            if ((event.key === 'F10' && event.shiftKey) || (event.key === 'ArrowDown' && event.altKey)) {
                event.preventDefault(); event.stopPropagation();
                this.cancel(); this.onHold(target, config);
            }
        };
        const context = event => event.preventDefault();
        const end = () => this.cancel();
        const handlers = { pointerdown: down, pointermove: this.onMove, pointerup: end,
            pointercancel: end, lostpointercapture: end, pointerleave: end,
            keydown: key, contextmenu: context };
        Object.entries(handlers).forEach(([type, handler]) => target.addEventListener(type, handler));
        this.targets.set(target, handlers);
        return target;
    }

    start(target, config, event) {
        this.cancel(); this.suppressed = null;
        this.press = { target, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
            timer: setTimeout(() => {
                this.press = null; this.suppressed = target;
                this.onHold(target, config);
            }, config.threshold ?? this.threshold) };
    }

    cancel() {
        if (this.press) clearTimeout(this.press.timer);
        this.press = null;
    }

    unregister(target) {
        if (this.press?.target === target) this.cancel();
        const handlers = this.targets.get(target);
        if (handlers) Object.entries(handlers).forEach(([type, handler]) => target.removeEventListener(type, handler));
        this.targets.delete(target);
    }

    destroy() {
        this.cancel();
        for (const target of this.targets.keys()) this.unregister(target);
        this.document?.removeEventListener('pointermove', this.onMove, true);
        this.document?.removeEventListener('pointerup', this.onEnd, true);
        this.document?.removeEventListener('pointercancel', this.onEnd, true);
        this.document?.removeEventListener('click', this.onClick, true);
        globalThis.removeEventListener?.('blur', this.onBlur);
        this.suppressed = null;
    }
}
