const activeManagers = new WeakMap();

export class OverlayManager {
    constructor(containerElement = document.body, options = {}) {
        this.container = containerElement || document.body;
        this.options = {
            id: 'cherry-overlay',
            className: '',
            allowOutsideDismiss: true,
            ...options
        };

        this.overlays = new Map();
        this.activeOverlayId = null;

        if (this.container) {
            this.container.style.position = this.container.style.position || 'relative';
        }
    }

    open({ id = this.options.id, content = null, className = '', allowOutsideDismiss = this.options.allowOutsideDismiss, onClose = null, returnFocus = null } = {}) {
        activeManagers.get(this.container)?.close();
        this.close(this.activeOverlayId);

        if (!this.container) {
            return null;
        }

        const createOverlayElement = () => {
            if (typeof document === 'undefined' || !document.createElement) {
                return {
                    className: '',
                    style: {},
                    dataset: {},
                    children: [],
                    appendChild(child) { this.children.push(child); },
                    addEventListener() {},
                    remove() {},
                    setAttribute() {},
                    classList: { add() {}, remove() {} }
                };
            }

            const overlay = document.createElement('div');
            overlay.className = ['cherry-overlay', className].filter(Boolean).join(' ');
            overlay.dataset.overlayId = id;
            overlay.setAttribute('aria-hidden', 'false');
            overlay.style.position = 'absolute';
            overlay.style.inset = '0';
            overlay.style.zIndex = '2000';
            overlay.style.background = 'rgba(17, 17, 17, 0.18)';
            overlay.style.backdropFilter = 'blur(8px)';
            overlay.style.webkitBackdropFilter = 'blur(8px)';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 180ms ease';
            overlay.style.pointerEvents = 'auto';

            if (content instanceof HTMLElement) {
                overlay.appendChild(content);
            } else if (content) {
                overlay.innerHTML = String(content);
            }

            if (allowOutsideDismiss) {
                overlay.addEventListener('click', (event) => {
                    if (event.target === overlay) {
                        this.close(id);
                    }
                });
            }

            return overlay;
        };

        const overlay = createOverlayElement();

        if (typeof this.container.appendChild === 'function') {
            this.container.appendChild(overlay);
        }

        const doc = typeof document !== 'undefined' ? document : null;
        const previousFocus = returnFocus || doc?.activeElement;
        const backgroundNodes = new Set(Array.from(this.container.children || []).filter(child => child !== overlay));
        // Include surrounding editor/display tools so they cannot receive clicks behind a modal.
        for (let branch = this.container; branch?.parentElement && branch !== doc?.body; branch = branch.parentElement) {
            Array.from(branch.parentElement.children).filter(child => child !== branch)
                .forEach(child => backgroundNodes.add(child));
        }
        const background = Array.from(backgroundNodes).map(child => ({ child, inert: child.inert }));
        background.forEach(({ child }) => { child.inert = true; });
        const focusable = () => Array.from(overlay.querySelectorAll?.(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        ) || []).filter(el => !el.closest('[inert]') && el.getClientRects().length);
        const focusFirst = () => (focusable()[0] || content)?.focus?.({ preventScroll: true });
        const onKeydown = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.close(id);
            } else if (event.key === 'Tab') {
                const items = focusable();
                const index = items.indexOf(doc.activeElement);
                if (!items.length || index < 0 || (!event.shiftKey && index === items.length - 1) || (event.shiftKey && index === 0)) {
                    event.preventDefault();
                    (event.shiftKey ? items.at(-1) : items[0])?.focus();
                    if (!items.length) content?.focus?.();
                }
            }
        };
        const onFocus = event => {
            if (!overlay.contains(event.target)) focusFirst();
        };
        doc?.addEventListener('keydown', onKeydown, true);
        doc?.addEventListener('focusin', onFocus);
        this.overlays.set(id, { element: overlay, onClose, previousFocus, background, onKeydown, onFocus });
        this.activeOverlayId = id;
        activeManagers.set(this.container, this);
        focusFirst();

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                if (this.overlays.get(id)?.element !== overlay) return;
                if (overlay.classList && typeof overlay.classList.add === 'function') {
                    overlay.classList.add('visible');
                }
                if (overlay.style) {
                    overlay.style.opacity = '1';
                }
            });
        } else if (overlay.style) {
            overlay.style.opacity = '1';
        }

        return overlay;
    }

    close(id = this.activeOverlayId) {
        if (!id) {
            return;
        }

        const overlayEntry = this.overlays.get(id);
        if (!overlayEntry) {
            return;
        }

        const { element, onClose, previousFocus, background, onKeydown, onFocus } = overlayEntry;

        if (typeof document !== 'undefined') {
            document.removeEventListener('keydown', onKeydown, true);
            document.removeEventListener('focusin', onFocus);
        }
        background.forEach(({ child, inert }) => { child.inert = inert; });

        if (element) {
            element.classList.remove('visible');
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.inert = true;
            element.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                element.remove();
            }, 180);
        }

        this.overlays.delete(id);
        if (this.activeOverlayId === id) {
            this.activeOverlayId = null;
        }
        if (activeManagers.get(this.container) === this) activeManagers.delete(this.container);
        if (previousFocus?.isConnected && !previousFocus.closest?.('[inert]')) {
            previousFocus.focus?.({ preventScroll: true });
        }

        if (typeof onClose === 'function') {
            onClose();
        }
    }

    isOpen(id = this.activeOverlayId) {
        return Boolean(id && this.overlays.has(id));
    }
}
