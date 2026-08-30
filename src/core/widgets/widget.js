/* =========================================================
   CHERRY — BASE WIDGET

   Clase madre de todos los widgets
   ========================================================= */

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

        element.dataset.widgetSize =
            this.size;

        element.dataset.widgetVariant =
            this.variant;

        element.dataset.widgetStyle =
            this.style;

        this.element =
            element;

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


    /* ---------------------------------------------
       Guardar tamaño
       --------------------------------------------- */

    this.size =
        size;


    /* ---------------------------------------------
       Aplicar dimensiones al layout
       --------------------------------------------- */

    this.layout = {

        ...this.layout,

        columns:
            preset.columns,

        rows:
            preset.rows
    };


    /* ---------------------------------------------
       Actualizar DOM
       --------------------------------------------- */

    if (this.element) {

        this.element.dataset.widgetSize =
            this.size;
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

        if (this.element) {

            this.element.remove();
        }

        this.element = null;
    }
}