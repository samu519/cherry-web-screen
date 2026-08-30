/* =========================================================
   CHERRY — TEXT WIDGET
   ========================================================= */

import { Widget } from "../../core/widgets/widget.js";


export class TextWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "text"
        });


        /* -------------------------------------------------
           CONFIGURACIÓN
           ------------------------------------------------- */

        this.settings = {

            text:
                config.settings?.text ??
                "Cherry",

            align:
                config.settings?.align ??
                "center",

            verticalAlign:
                config.settings?.verticalAlign ??
                "center",

            fontSize:
                config.settings?.fontSize ??
                "32px",

            fontWeight:
                config.settings?.fontWeight ??
                600,

            color:
                config.settings?.color ??
                "var(--cherry-text-primary)"
        };


        /* -------------------------------------------------
           ESTILO
           ------------------------------------------------- */

        this.variant =
            config.variant ?? "glass";
    }


    /* =====================================================
       RENDER
       ===================================================== */

    render() {

        super.render();


        this.element.classList.add(
            "widget-text"
        );


        this.element.classList.add(
            `variant-${this.variant}`
        );


        this.renderText();
    }


    /* =====================================================
       CREAR TEXTO
       ===================================================== */

    renderText() {

        this.element.innerHTML = "";


        const content =
            document.createElement("div");


        content.classList.add(
            "text-widget-content"
        );


        content.textContent =
            this.settings.text;


        content.style.textAlign =
            this.settings.align;

        content.style.fontSize =
            this.settings.fontSize;

        content.style.fontWeight =
            this.settings.fontWeight;

        content.style.color =
            this.settings.color;


        this.element.appendChild(
            content
        );
    }


    /* =====================================================
       CAMBIAR TEXTO
       ===================================================== */

    setText(text) {

        this.settings.text =
            text;

        this.renderText();
    }


    /* =====================================================
       CAMBIAR VARIANTE
       ===================================================== */

    setVariant(variant) {

        this.variant =
            variant;


        this.element.classList.remove(
            "variant-glass",
            "variant-solid"
        );


        this.element.classList.add(
            `variant-${variant}`
        );
    }
}