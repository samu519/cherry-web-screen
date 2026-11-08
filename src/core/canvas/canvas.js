/* =========================================================
   CHERRY — CANVAS
   Contenedor y administrador de widgets
   ========================================================= */

import { Grid } from "../layouts/grid.js";
import { fitDisplayViewport } from './displayViewport.js';


export class Canvas {

    constructor(config = {}) {

        /* -------------------------------------------------
           CONFIGURACIÓN
           ------------------------------------------------- */

        this.width =
            config.width ?? 480;

        this.height =
            config.height ?? 1920;


        /* -------------------------------------------------
           GRID
           ------------------------------------------------- */

        this.grid =
            config.grid ??
            new Grid({

                columns:
                    config.columns ?? 4,

                rows:
                    config.rows ?? 16,

                width:
                    this.width,

                height:
                    this.height,

                gap:
                    config.gap ?? 12
            });


        /* -------------------------------------------------
           WIDGETS
           ------------------------------------------------- */

        this.widgets = [];
        this.layoutMode = 'freeform';
        this.profile = { id: 'cherry-portrait', name: 'Cherry · 480 × 1920', width: this.width, height: this.height,
            columns: this.grid.columns, rows: this.grid.rows, gap: this.grid.gap, padding: this.grid.padding };


        /* -------------------------------------------------
           ELEMENTO DOM
           ------------------------------------------------- */

        this.element =
            document.querySelector(
                "#cherry-canvas"
            );


        if (!this.element) {

            throw new Error(
                "No se encontró #cherry-canvas"
            );
        }


        this.setup();
        this.stopViewportFit = fitDisplayViewport(this.width, this.height);
    }


    /* =====================================================
       CONFIGURAR CANVAS
       ===================================================== */

    setup() {

        document.documentElement.style.setProperty('--cherry-canvas-width', `${this.width}px`);
        document.documentElement.style.setProperty('--cherry-canvas-height', `${this.height}px`);
        this.element.style.setProperty('--cherry-column-step', `${this.grid.getColumnWidth() + this.grid.gap}px`);
        this.element.style.setProperty('--cherry-row-step', `${this.grid.getRowHeight() + this.grid.gap}px`);
        this.element.style.setProperty('--cherry-grid-padding', `${this.grid.padding}px`);

        this.element.style.width =
            `${this.width}px`;

        this.element.style.height =
            `${this.height}px`;
    }


    /* =====================================================
       AÑADIR WIDGET
       ===================================================== */

    addWidget(widget, { geometry: savedGeometry = null, render = true } = {}) {

        if (!widget.element) {
            widget.createElement();
        }


        /* ---------------------------------------------
           CALCULAR GEOMETRÍA
           --------------------------------------------- */

        const geometry = savedGeometry || this.grid.getGeometry(widget.layout);
        widget.canvas = this;
        widget.flags = { hidden: false, locked: false, zIndex: 1, ...widget.flags };


        /* ---------------------------------------------
           APLICAR GEOMETRÍA
           --------------------------------------------- */

        widget.setGeometry(
            geometry
        );


        /* ---------------------------------------------
           RENDERIZAR
           --------------------------------------------- */

        if (render) widget.render();


        /* ---------------------------------------------
           INSERTAR
           --------------------------------------------- */

        this.element.appendChild(
            widget.element
        );


        this.widgets.push(widget);


        return widget;
    }


    /* =====================================================
       ACTUALIZAR POSICIÓN / TAMAÑO
       ===================================================== */

    updateWidgetLayout(widget) {

        const geometry =
            this.grid.getGeometry(
                widget.layout
            );

        widget.setGeometry(
            geometry
        );

        if (typeof widget.render === 'function') {
            widget.render();
        }
    }


    /* =====================================================
       CAMBIAR LAYOUT DE UN WIDGET
       ===================================================== */

    setWidgetLayout(widget, layout) {

        widget.setLayout(layout);

        this.updateWidgetLayout(widget);
    }


    /* =====================================================
       ELIMINAR WIDGET
       ===================================================== */

    removeWidget(widget) {

        const index =
            this.widgets.indexOf(widget);


        if (index === -1) {
            return;
        }


        widget.destroy();

        this.widgets.splice(
            index,
            1
        );
    }

    configure(profile, layoutMode = this.layoutMode) {
        this.profile = { ...profile };
        this.width = profile.width;
        this.height = profile.height;
        this.grid = new Grid(profile);
        this.layoutMode = layoutMode;
        this.element.dataset.layoutMode = layoutMode;
        this.setup();
        this.stopViewportFit?.();
        this.stopViewportFit = fitDisplayViewport(this.width, this.height);
    }

    normalizeGeometry(widget, geometry) {
        const bounded = this.grid.constrainGeometry(geometry);
        widget.layout = this.grid.getLayoutFromGeometry(bounded);
        return this.layoutMode === 'grid' ? this.grid.getGeometry(widget.layout) : bounded;
    }
}
