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

    open({ id = this.options.id, content = null, className = '', allowOutsideDismiss = this.options.allowOutsideDismiss, onClose = null } = {}) {
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
            overlay.style.zIndex = '30';
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

        this.overlays.set(id, { element: overlay, onClose });
        this.activeOverlayId = id;

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
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

        const { element, onClose } = overlayEntry;

        if (element) {
            element.classList.remove('visible');
            element.style.opacity = '0';
            setTimeout(() => {
                element.remove();
            }, 180);
        }

        this.overlays.delete(id);
        if (this.activeOverlayId === id) {
            this.activeOverlayId = null;
        }

        if (typeof onClose === 'function') {
            onClose();
        }
    }

    isOpen(id = this.activeOverlayId) {
        return Boolean(id && this.overlays.has(id));
    }
}
