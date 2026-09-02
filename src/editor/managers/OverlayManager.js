/* =========================================================
   CHERRY EDITOR — OVERLAY MANAGER
   Gestiona menús, popovers y overlays de forma centralizada
   ========================================================= */

export class OverlayManager {

    constructor(containerElement) {

        this.container = containerElement;
        this.overlays = new Map(); // id -> { element, data, closeCallback }
        this.activeOverlay = null;

        this.setupContainer();
        this.setupGlobalHandlers();
    }


    /* =====================================================
       SETUP
       ===================================================== */

    setupContainer() {

        this.container.style.position = 'relative';
    }


    setupGlobalHandlers() {

        this._onKeydown = (e) => {
            if (e.key === 'Escape' && this.activeOverlay) {
                this.close(this.activeOverlay);
            }
        };

        this._onClick = (e) => {
            if (this.activeOverlay) {
                const overlay = this.overlays.get(this.activeOverlay);
                if (overlay && !overlay.element.contains(e.target)) {
                    this.close(this.activeOverlay);
                }
            }
        };

        document.addEventListener('keydown', this._onKeydown);
        document.addEventListener('click', this._onClick, true);
    }


    /* =====================================================
       CREAR OVERLAY
       ===================================================== */

    create(id, options = {}) {

        if (this.overlays.has(id)) {
            this.close(id);
        }

        if (this.activeOverlay && this.activeOverlay !== id) {
            this.close(this.activeOverlay);
        }

        const {
            content = '',
            position = { x: 0, y: 0 },
            anchor = null, // elemento de referencia
            align = 'bottom-left', // bottom-left, bottom-center, top-left, etc
            onClose = null
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'cherry-overlay';
        overlay.dataset.overlayId = id;

        if (content instanceof HTMLElement) {
            overlay.appendChild(content);
        } else {
            overlay.innerHTML = content;
        }

        this.container.appendChild(overlay);

        const finalPosition = this.calculatePosition(overlay, position, anchor, align);

        overlay.style.position = 'fixed';
        overlay.style.left = finalPosition.x + 'px';
        overlay.style.top = finalPosition.y + 'px';
        overlay.style.zIndex = '9999';
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(10px) scale(0.97)';
        overlay.style.transition = 'opacity 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1)';

        this.overlays.set(id, {
            element: overlay,
            anchor: anchor,
            align: align,
            closeCallback: onClose
        });

        this.activeOverlay = id;

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
            overlay.style.opacity = '1';
            overlay.style.transform = 'translateY(0) scale(1)';
        });

        return overlay;
    }

    open({ id, content, position, anchor, align, onClose } = {}) {
        return this.create(id || 'overlay', {
            content,
            position,
            anchor,
            align,
            onClose
        });
    }


    /* =====================================================
       CALCULAR POSICIÓN (ANTI-OVERFLOW)
       ===================================================== */

    calculatePosition(element, position, anchor, align) {

        const containerRect = this.container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = position.x;
        let y = position.y;

        if (anchor) {

            const anchorRect = anchor.getBoundingClientRect();

            // Opciones de posición basadas en align
            const positions = this.getAlignmentPositions(anchorRect, element, align);

            // Elegir la primera posición que cabe en el viewport
            for (const pos of positions) {

                if (this.canFitInViewport(pos, element, viewportWidth, viewportHeight)) {
                    x = pos.x;
                    y = pos.y;
                    break;
                }
            }

        }

        // Asegurar que no se salga del viewport (fallback)
        x = Math.max(12, Math.min(x, viewportWidth - element.offsetWidth - 12));
        y = Math.max(12, Math.min(y, viewportHeight - element.offsetHeight - 12));

        return { x, y };
    }


    /* =====================================================
       CALCULAR ALINEACIONES POSIBLES
       ===================================================== */

    getAlignmentPositions(anchorRect, element, primaryAlign) {

        const gap = 8;
        const positions = [];

        const elementWidth = element.offsetWidth || 200;
        const elementHeight = element.offsetHeight || 200;

        // Orden de preferencia según align
        const alignments = [
            primaryAlign,
            // Si primaryAlign es "bottom-left", intentar otras direcciones
            primaryAlign === 'bottom-left' ? 'top-left' : 'bottom-left',
            primaryAlign === 'bottom-right' ? 'top-right' : 'bottom-right',
            'bottom-center',
            'top-center',
            'right-center',
            'left-center'
        ];

        alignments.forEach(align => {

            let x, y;

            if (align === 'bottom-left') {
                x = anchorRect.left;
                y = anchorRect.bottom + gap;
            } else if (align === 'bottom-center') {
                x = anchorRect.left + anchorRect.width / 2 - elementWidth / 2;
                y = anchorRect.bottom + gap;
            } else if (align === 'bottom-right') {
                x = anchorRect.right - elementWidth;
                y = anchorRect.bottom + gap;
            } else if (align === 'top-left') {
                x = anchorRect.left;
                y = anchorRect.top - elementHeight - gap;
            } else if (align === 'top-center') {
                x = anchorRect.left + anchorRect.width / 2 - elementWidth / 2;
                y = anchorRect.top - elementHeight - gap;
            } else if (align === 'top-right') {
                x = anchorRect.right - elementWidth;
                y = anchorRect.top - elementHeight - gap;
            } else if (align === 'right-center') {
                x = anchorRect.right + gap;
                y = anchorRect.top + anchorRect.height / 2 - elementHeight / 2;
            } else if (align === 'left-center') {
                x = anchorRect.left - elementWidth - gap;
                y = anchorRect.top + anchorRect.height / 2 - elementHeight / 2;
            }

            positions.push({ x, y, align });
        });

        return positions;
    }


    /* =====================================================
       VERIFICAR SI CABE EN VIEWPORT
       ===================================================== */

    canFitInViewport(position, element, viewportWidth, viewportHeight) {

        const margin = 12;
        const elementWidth = element.offsetWidth || 200;
        const elementHeight = element.offsetHeight || 200;

        const fits = 
            position.x >= margin &&
            position.x + elementWidth <= viewportWidth - margin &&
            position.y >= margin &&
            position.y + elementHeight <= viewportHeight - margin;

        return fits;
    }


    /* =====================================================
       CERRAR OVERLAY
       ===================================================== */

    close(id) {

        const overlay = this.overlays.get(id);

        if (overlay) {

            overlay.element.classList.remove('visible');

            setTimeout(() => {
                if (overlay.element.parentNode) {
                    overlay.element.remove();
                }
                this.overlays.delete(id);

                if (this.activeOverlay === id) {
                    this.activeOverlay = null;
                }

                if (overlay.closeCallback) {
                    overlay.closeCallback();
                }
            }, 150);
        }
    }


    /* =====================================================
       CERRAR TODOS
       ===================================================== */

    closeAll() {

        Array.from(this.overlays.keys()).forEach(id => this.close(id));
    }


    /* =====================================================
       VERIFICAR SI HAY OVERLAY ABIERTO
       ===================================================== */

    isOpen(id) {

        return this.overlays.has(id) && this.activeOverlay === id;
    }


    getActive() {

        return this.activeOverlay;
    }

    /* =====================================================
    DESTRUIR (limpiar listeners de document)
    ===================================================== */

    destroy() {
        this.closeAll();
        if (this._onKeydown) document.removeEventListener('keydown', this._onKeydown);
        if (this._onClick) document.removeEventListener('click', this._onClick);
    }
}
