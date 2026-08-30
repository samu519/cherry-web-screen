/* =========================================================
   CHERRY — MEDIA VISUAL WIDGET
   Imagen / GIF / Video
   ========================================================= */

import { Widget } from "../../core/widgets/Widget.js";


export class MediaVisualWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "media-visual"
        });


        /* -------------------------------------------------
           CONFIGURACIÓN
           ------------------------------------------------- */

        this.settings = {

            source:
                config.settings?.source ?? null,

            type:
                config.settings?.type ?? "image",

            autoplay:
                config.settings?.autoplay ?? true,

            loop:
                config.settings?.loop ?? true,

            muted:
                config.settings?.muted ?? true,

            objectFit:
                config.settings?.objectFit ?? "cover"
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
            "widget-media-visual"
        );

        this.element.classList.add(
            `variant-${this.variant}`
        );


        this.renderMedia();
    }


    /* =====================================================
       CREAR MEDIA
       ===================================================== */

    renderMedia() {

        /* ---------------------------------------------
           LIMPIAR CONTENIDO
           --------------------------------------------- */

        this.element.innerHTML = "";


        if (!this.settings.source) {

            this.renderPlaceholder();

            return;
        }


        /* ---------------------------------------------
           IMAGEN / GIF
           --------------------------------------------- */

        if (
            this.settings.type === "image" ||
            this.settings.type === "gif"
        ) {

            const image =
    document.createElement("img");

            image.src =
                this.settings.source;

            image.alt =
                "Cherry visual";

            image.style.width =
                "100%";

            image.style.height =
                "100%";

            image.style.objectFit =
                this.settings.objectFit;

            this.element.appendChild(
                image
            );
            image.style.display = "block";
            return;
        }


        /* ---------------------------------------------
           VIDEO
           --------------------------------------------- */

        if (
            this.settings.type === "video"
        ) {

            const video =
                document.createElement("video");

            video.src =
                this.settings.source;

            video.autoplay =
                this.settings.autoplay;

            video.loop =
                this.settings.loop;

            video.muted =
                this.settings.muted;

            video.playsInline =
                true;

            video.style.objectFit =
                this.settings.objectFit;

            this.element.appendChild(
                video
            );

            return;
        }


        this.renderPlaceholder();
    }


    /* =====================================================
       PLACEHOLDER
       ===================================================== */

    renderPlaceholder() {

        this.element.innerHTML = `

            <div class="media-visual-placeholder">

                <span>
                    No media
                </span>

            </div>

        `;
    }


    /* =====================================================
       CAMBIAR MEDIA
       ===================================================== */

    setSource(source, type = "image") {

        this.settings.source =
            source;

        this.settings.type =
            type;

        this.renderMedia();
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