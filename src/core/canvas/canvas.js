/* =========================================================
   CHERRY — CANVAS
   Contenedor y administrador de widgets
   ========================================================= */

import { Grid } from "./layout/Grid.js";


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
    }


    /* =====================================================
       CONFIGURAR CANVAS
       ===================================================== */

    setup() {

        this.element.style.width =
            `${this.width}px`;

        this.element.style.height =
            `${this.height}px`;
    }


    /* =====================================================
       AÑADIR WIDGET
       ===================================================== */

    addWidget(widget) {

        if (!widget.element) {
            widget.createElement();
        }


        /* ---------------------------------------------
           CALCULAR GEOMETRÍA
           --------------------------------------------- */

        const geometry =
            this.grid.getGeometry(
                widget.layout
            );


        /* ---------------------------------------------
           APLICAR GEOMETRÍA
           --------------------------------------------- */

        widget.setGeometry(
            geometry
        );


        /* ---------------------------------------------
           RENDERIZAR
           --------------------------------------------- */

        widget.render();


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
}