import { Widget } from "../../core/widgets/Widget.js";

export class MediaVisualWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "mediaVisual"
        });


        // =====================================================
        // SETTINGS
        // =====================================================

        this.settings = {

            sizePreset: "medium",
            style: "default",
            autoplay: false,
            interval: 5000,
            loop: true,
            transition: "fade",
            showNavigation: true,
            showIndicators: true,
            ...this.settings,

            ...(config.style && {
                style: config.style
            }),

            ...(config.autoplay !== undefined && {
                autoplay: config.autoplay
            }),

            ...(config.interval !== undefined && {
                interval: config.interval
            }),

            ...(config.loop !== undefined && {
                loop: config.loop
            })

        };

        // =====================================================
        // VALIDATE STYLE BY SIZE
        // =====================================================

        if (
            (config.size === "mini" ||
            config.size === "small") &&
            this.settings.style === "gallery"
        ) {

            this.settings.style =
                "default";

        }


        // =====================================================
        // STATE
        // =====================================================

        this.state = {

            currentSlide: 0,

            slides: [

                {
                    type: "image",
                    src: "../../assets/media/portada1.jpg"
                },

                {
                    type: "image",
                    src: "../../assets/media/portada2.jpg"
                },

                {
                    type: "gif",
                    src: "../../assets/media/animation.gif"
                }

            ],

            ...this.state

        };


        // =====================================================
        // SIZE PRESETS
        // =====================================================

        this.sizePresets = {

            mini: {
                columns: 2,
                rows: 2
            },

            small: {
                columns: 3,
                rows: 2
            },

            medium: {
                columns: 4,
                rows: 3
            },

            large: {
                columns: 4,
                rows: 5
            },

            giant: {
                columns: 4,
                rows: 8
            }

        };


        // =====================================================
        // STYLES
        // =====================================================

        this.styles = {

            default: {
                name: "Default"
            },

            slideshow: {
                name: "Slideshow"
            },

            gallery: {
                name: "Gallery"
            }

        };


        // =====================================================
        // APPLY SIZE
        // =====================================================

        const selectedSize =
            config.size ?? "medium";

        const sizeConfig =
            this.sizePresets[selectedSize];

        if (sizeConfig) {

            this.settings.sizePreset =
                selectedSize;

            this.setLayout({

                ...sizeConfig,

                ...config.layout

            });

        }

    }


    // =========================================================
    // CREATE ELEMENT
    // =========================================================

    createElement() {

        const element =
            super.createElement();

        element.classList.add(
            "cherry-media-visual"
        );

        return element;

    }


    // =========================================================
    // SET SIZE
    // =========================================================

    setSizePreset(size) {

        const sizeConfig =
            this.sizePresets[size];

        if (!sizeConfig) {

            console.warn(
                `MediaVisualWidget: size "${size}" no está definido.`
            );

            return false;

        }

        this.settings.sizePreset =
            size;


        // =====================================================
        // GALLERY RESTRICTION
        // =====================================================

        if (
            (size === "mini" ||
            size === "small") &&
            this.settings.style === "gallery"
        ) {

            this.settings.style =
                "default";

        }


        this.setLayout(
            sizeConfig
        );

        this.updateAttributes();

        this.render();

        return true;

    }


    // =========================================================
    // SET STYLE
    // =========================================================

    setStyle(style) {

        const styleConfig =
            this.styles[style];

        if (!styleConfig) {

            console.warn(
                `MediaVisualWidget: style "${style}" no está definido.`
            );

            return false;

        }

        this.settings.style =
            style;

        this.updateAttributes();

        this.render();

        return true;

    }


    // =========================================================
    // UPDATE ATTRIBUTES
    // =========================================================

    updateAttributes() {

        if (!this.element) {
            return;
        }

        this.element.dataset.size =
            this.settings.sizePreset;

        this.element.dataset.style =
            this.settings.style;

    }


    // =========================================================
    // RENDER
    // =========================================================

    render() {

        if (!this.element) {
            this.createElement();
        }

        this.updateAttributes();

        this.element.innerHTML = "";


        // =====================================================
        // CONTAINER
        // =====================================================

        const container =
            document.createElement("div");

        container.classList.add(
            "cherry-media-visual-container"
        );


        // =====================================================
        // STAGE
        // =====================================================

        const stage =
            document.createElement("div");

        stage.classList.add(
            "cherry-media-visual-stage"
        );


        // =====================================================
        // CURRENT MEDIA
        // =====================================================

        const slide =
            this.createSlide(
                this.state.currentSlide
            );

        stage.appendChild(
            slide
        );


        // =====================================================
        // NAVIGATION
        // =====================================================

        /*
         * Las flechas pertenecen a los tres estilos.
         *
         * El CSS se encarga de ocultarlas hasta hacer hover.
         */

        if (
            this.settings.showNavigation &&
            this.state.slides.length > 1
        ) {

            const navigation =
                this.createNavigation();

            stage.appendChild(
                navigation
            );

        }


        // =====================================================
        // INDICATORS
        // =====================================================

        /*
         * Los indicadores SOLO pertenecen
         * al estilo slideshow.
         */

        if (
            this.settings.showIndicators &&
            this.settings.style === "slideshow" &&
            this.state.slides.length > 1
        ) {

            const indicators =
                this.createIndicators();

            stage.appendChild(
                indicators
            );

        }


        // =====================================================
        // ADD STAGE
        // =====================================================

        container.appendChild(
            stage
        );


        // =====================================================
        // GALLERY
        // =====================================================

        /*
         * Gallery reemplaza los indicadores
         * por miniaturas debajo de la imagen.
         */

        if (
            this.settings.style ===
            "gallery"
        ) {

            const gallery =
                this.createGallery();

            container.appendChild(
                gallery
            );

        }


        // =====================================================
        // APPEND
        // =====================================================

        this.element.appendChild(
            container
        );

    }


    // =========================================================
    // CREATE SLIDE
    // =========================================================

    createSlide(index) {

        const slide =
            document.createElement("div");

        slide.classList.add(
            "cherry-media-visual-slide"
        );


        const media =
            this.state.slides[index];


        if (!media) {
            return slide;
        }


        // =====================================================
        // IMAGE / GIF
        // =====================================================

        if (
            media.type === "image" ||
            media.type === "gif"
        ) {

            const image =
                document.createElement("img");

            image.classList.add(
                "cherry-media-visual-image"
            );

            image.src =
                media.src;

            image.alt =
                media.alt ?? "";


            slide.appendChild(
                image
            );

        }


        // =====================================================
        // VIDEO
        // =====================================================

        if (
            media.type === "video"
        ) {

            const video =
                document.createElement("video");

            video.classList.add(
                "cherry-media-visual-video"
            );

            video.src =
                media.src;

            video.preload =
                "metadata";

            video.playsInline =
                true;

            video.controls =
                true;


            if (media.poster) {

                video.poster =
                    media.poster;

            }


            slide.appendChild(
                video
            );

        }


        return slide;

    }


    // =========================================================
    // CREATE NAVIGATION
    // =========================================================

    createNavigation() {

        const navigation =
            document.createElement("div");

        navigation.classList.add(
            "cherry-media-visual-navigation"
        );


        // =====================================================
        // PREVIOUS
        // =====================================================

        const previous =
            document.createElement("button");

        previous.type =
            "button";

        previous.classList.add(
            "cherry-media-visual-previous"
        );

        previous.textContent =
            "‹";

        previous.setAttribute(
            "aria-label",
            "Previous slide"
        );

        previous.addEventListener(
            "click",
            () => this.previousSlide()
        );


        // =====================================================
        // NEXT
        // =====================================================

        const next =
            document.createElement("button");

        next.type =
            "button";

        next.classList.add(
            "cherry-media-visual-next"
        );

        next.textContent =
            "›";

        next.setAttribute(
            "aria-label",
            "Next slide"
        );

        next.addEventListener(
            "click",
            () => this.nextSlide()
        );


        navigation.appendChild(
            previous
        );

        navigation.appendChild(
            next
        );


        return navigation;

    }


    // =========================================================
    // CREATE INDICATORS
    // =========================================================

    createIndicators() {

        const indicators =
            document.createElement("div");

        indicators.classList.add(
            "cherry-media-visual-indicators"
        );


        this.state.slides.forEach(
            (_, index) => {

                const indicator =
                    document.createElement("button");

                indicator.type =
                    "button";

                indicator.classList.add(
                    "cherry-media-visual-indicator"
                );


                if (
                    index ===
                    this.state.currentSlide
                ) {

                    indicator.classList.add(
                        "active"
                    );

                }


                indicator.setAttribute(
                    "aria-label",
                    `Go to slide ${index + 1}`
                );


                indicator.addEventListener(
                    "click",
                    () =>
                        this.goToSlide(index)
                );


                indicators.appendChild(
                    indicator
                );

            }
        );


        return indicators;

    }


    // =========================================================
    // CREATE GALLERY
    // =========================================================

    createGallery() {

        const gallery =
            document.createElement("div");

        gallery.classList.add(
            "cherry-media-visual-gallery"
        );


        this.state.slides.forEach(
            (media, index) => {

                const thumbnail =
                    document.createElement("button");

                thumbnail.type =
                    "button";

                thumbnail.classList.add(
                    "cherry-media-visual-thumbnail"
                );


                if (
                    index ===
                    this.state.currentSlide
                ) {

                    thumbnail.classList.add(
                        "active"
                    );

                }


                const image =
                    document.createElement("img");

                /*
                 * Si en el futuro tenemos thumbnails
                 * específicos, los usamos.
                 *
                 * Si no, usamos el propio media.src.
                 */

                image.src =
                    media.thumbnail ??
                    media.src;

                image.alt =
                    media.alt ?? "";


                thumbnail.appendChild(
                    image
                );


                thumbnail.addEventListener(
                    "click",
                    () =>
                        this.goToSlide(index)
                );


                gallery.appendChild(
                    thumbnail
                );

            }
        );


        return gallery;

    }


    // =========================================================
    // GO TO SLIDE
    // =========================================================

    goToSlide(index) {

        if (
            index < 0 ||
            index >=
            this.state.slides.length
        ) {

            return;

        }


        this.state.currentSlide =
            index;


        this.render();

    }


    // =========================================================
    // PREVIOUS
    // =========================================================

    previousSlide() {

        let index =
            this.state.currentSlide - 1;


        if (index < 0) {

            if (this.settings.loop) {

                index =
                    this.state.slides.length - 1;

            } else {

                index = 0;

            }

        }


        this.goToSlide(
            index
        );

    }


    // =========================================================
    // NEXT
    // =========================================================

    nextSlide() {

        let index =
            this.state.currentSlide + 1;


        if (
            index >=
            this.state.slides.length
        ) {

            if (this.settings.loop) {

                index = 0;

            } else {

                index =
                    this.state.slides.length - 1;

            }

        }


        this.goToSlide(
            index
        );

    }


    // =========================================================
    // UPDATE
    // =========================================================

    update() {

        super.update();

        this.render();

    }


    // =========================================================
    // DESTROY
    // =========================================================

    destroy() {

        super.destroy();

    }

}

