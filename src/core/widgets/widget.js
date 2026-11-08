/* =========================================================
   CHERRY — BASE WIDGET

   Clase madre de todos los widgets
   ========================================================= */

import { nativeService } from '../../services/nativeService.js';

export class Widget {

    constructor(config = {}) {

        /* -------------------------------------------------
           IDENTIDAD
           ------------------------------------------------- */

        this.id =
            config.id ??
            `widget-${crypto.randomUUID()}`;

        this.type =
            config.type ??
            "generic";


        /* -------------------------------------------------
           LAYOUT
           ------------------------------------------------- */

        this.layout = {

            column: 0,
            row: 0,
            columns: 1,
            rows: 1,

            ...config.layout
        };


        /* -------------------------------------------------
           TAMAÑO
           ------------------------------------------------- */

        this.size =
            config.size ??
            "small";
        this.sizePresets = config.sizePresets ?? {}

        /* -------------------------------------------------
           VARIANTE VISUAL
           ------------------------------------------------- */

        this.variant =
            config.variant ??
            "translucid";
        this.style =
            config.style ??
            "default";    

        /* -------------------------------------------------
           GEOMETRÍA REAL

           La calcula Canvas/Grid
           ------------------------------------------------- */

        this.geometry = {

            x: 0,
            y: 0,
            width: 0,
            height: 0
        };


        /* -------------------------------------------------
           CONFIGURACIÓN
           ------------------------------------------------- */

        this.settings = {

            ...config.settings
        };


        /* -------------------------------------------------
           ESTADO
           ------------------------------------------------- */

        this.state = {

            ...config.state
        };


        /* -------------------------------------------------
           ELEMENTO DOM
           ------------------------------------------------- */

        this.element = null;
        this.unsubscribeNative = nativeService.subscribe(() => {
            if (this.element && (this.type === 'system' || this.type === 'media')) this.render();
            nativeService.decorateControls(this.element, this.control?.id);
            nativeService.decorateControls(this.expansionManager?.panel?.panelElement);
        });
    }


    /* =====================================================
       CREAR ELEMENTO
       ===================================================== */

    createElement() {

        const element =
            document.createElement("section");

        element.classList.add(
            "cherry-widget"
        );

        element.dataset.widgetId =
            this.id;

        element.dataset.widgetType =
            this.type;

        element.dataset.size =
            this.size;

        element.dataset.widgetSize =
            this.size;

        element.dataset.widgetVariant =
            this.variant;

        element.dataset.widgetStyle =
            this.style;

        this.element =
            element;

        this.nativeObserver = new MutationObserver(() => nativeService.decorateControls(element, this.control?.id));
        this.nativeObserver.observe(element, { childList: true, subtree: true });

        return element;
    }


    /* =====================================================
       ACTUALIZAR GEOMETRÍA
       ===================================================== */

    setGeometry(geometry) {

        this.geometry = {

            ...this.geometry,
            ...geometry
        };

        if (this.canvas) this.geometry = this.canvas.normalizeGeometry(this, this.geometry);

        this.applyGeometry();
    }


    /* =====================================================
       APLICAR GEOMETRÍA AL DOM
       ===================================================== */

    applyGeometry() {

        if (!this.element) {
            return;
        }

        this.element.style.left =
            `${this.geometry.x}px`;

        this.element.style.top =
            `${this.geometry.y}px`;

        this.element.style.width =
            `${this.geometry.width}px`;

        this.element.style.height =
            `${this.geometry.height}px`;
    }


    /* =====================================================
       CAMBIAR LAYOUT
       ===================================================== */

    setLayout(layout) {

        this.layout = {

            ...this.layout,
            ...layout
        };

        return this.layout;
    }
    /* =====================================================
   CAMBIAR ESTILO
   ===================================================== */

    setStyle(style) {

        this.style =
            style;

        if (this.element) {

         this.element.dataset.widgetStyle =
            this.style;
        }

        return this.style;
    }

    /* =====================================================
       CAMBIAR TAMAÑO
       ===================================================== */

    setSize(size) {

        const preset =
            this.sizePresets[size];

        if (!preset) {

            console.warn(
                `Cherry: size "${size}" no está definido para ${this.type}`
            );

            return false;
        }

        this.size = size;

        if (this.settings) {
            this.settings.sizePreset = size;
        }

        this.layout = {
            ...this.layout,
            columns: preset.columns,
            rows: preset.rows
        };

        if (this.element) {
            this.element.dataset.size = this.size;
            this.element.dataset.widgetSize = this.size;
        }

        if (typeof this.updateAttributes === 'function') {
            this.updateAttributes();
        }

        if (typeof this.render === 'function') {
            this.render();
        }

        return true;
    }

    /* =====================================================
        CAMBIAR VARIANTE
    ===================================================== */

    setVariant(variant) {

        this.variant =
            variant;

        if (this.element) {

            this.element.dataset.widgetVariant =
                this.variant;
        }

        return this.variant;
    }


    /* =====================================================
       RENDER
       ===================================================== */

    render() {

        if (!this.element) {

            this.createElement();
        }
    }


    /* =====================================================
       UPDATE
       ===================================================== */

    update() {

    }


    /* =====================================================
       DESTRUIR
       ===================================================== */

    destroy() {

        this.unsubscribeNative?.();
        this.nativeObserver?.disconnect();

        if (this.element) {

            this.element.remove();
        }

        this.element = null;
    }
}
