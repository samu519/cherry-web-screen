import { Widget } from "../../core/widgets/Widget.js";

export class MediaWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "media"
        });

        /* =====================================================
           SETTINGS
           ===================================================== */

        this.settings = {

            showArtwork: true,
            showControls: true,
            showProgress: true,
            blurArtwork: true,

            sizePreset: "large",
            style: "default",

            ...this.settings

        };


        /* =====================================================
           STATE
           ===================================================== */

        this.state = {

            playing: false,

            title: "Blinding Lights",

            artist: "The Weeknd",

            artwork:
                "../../assets/media/portada.png",

            progress: 42,

            duration: 201,

            ...this.state

        };
        this.styles = {

            default: {

                name: "Default"

            },

            artworkProtagonist: {

                name: "Artwork Protagonist"

            }

        };

        /* =====================================================
           SIZE PRESETS
           ===================================================== */

        this.sizePresets = {

            small: {

                columns: 2,
                rows: 2

            },

            card: {

                columns: 2,
                rows: 4

            },

            medium: {

                columns: 4,
                rows: 2

            },

            large: {

                columns: 4,
                rows: 4

            },

            giant: {

                columns: 4,
                rows: 8

            }

        };
        const selectedSize =
            config.size ?? "large";
        const selectedStyle =
            config.style ?? "default";

        if (this.styles?.[selectedStyle]) {
            this.settings.style =
                selectedStyle;
        }
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
        /* =====================================================
           STYLES
           ===================================================== */

        

    }


    /* =====================================================
       CREATE ELEMENT
       ===================================================== */

    createElement() {

        const element =
            super.createElement();

        element.classList.add(
            "cherry-media"
        );

        return element;

    }


    /* =====================================================
       SET SIZE
       ===================================================== */

    setSizePreset(size) {

        const sizeConfig =
            this.sizePresets[size];

        if (!sizeConfig) {

            console.warn(
                `MediaWidget: size "${size}" no está definido.`
            );

            return false;

        }

        this.settings.sizePreset =
            size;

        this.setLayout(
            sizeConfig
        );

        this.updateAttributes();

        return true;

    }

    
    /* =====================================================
       SET STYLE
       ===================================================== */

    setStyle(style) {

        const styleConfig =
            this.styles[style];

        if (!styleConfig) {

            console.warn(
                `MediaWidget: style "${style}" no está definido.`
            );

            return false;

        }

        this.settings.style =
            style;

        this.updateAttributes();

        return true;

    }


    /* =====================================================
       UPDATE ATTRIBUTES
       ===================================================== */

    updateAttributes() {

        if (!this.element) {

            return;

        }

        this.element.dataset.size =
            this.settings.sizePreset;

        this.element.dataset.style =
            this.settings.style;

    }


    /* =====================================================
       RENDER
       ===================================================== */

    render() {

    if (!this.element) {
        this.createElement();
    }

    this.updateAttributes();

    this.element.innerHTML = "";

    const backdrop =
    document.createElement("div");

    backdrop.classList.add(
        "cherry-media-backdrop"
    );

    backdrop.style.backgroundImage =
        `url("${this.state.artwork}")`;

    this.element.appendChild(backdrop);

    /* =================================================
       CONTENT
       Contenedor del reproductor
       ================================================= */

    const content =
        document.createElement("div");

    content.classList.add(
        "cherry-media-content"
    );


    /* =================================================
       ARTWORK
       ================================================= */

    if (this.settings.showArtwork) {

        const artwork =
            document.createElement("img");

        artwork.classList.add(
            "cherry-media-artwork"
        );

        artwork.src =
            this.state.artwork;

        artwork.alt =
            "Album artwork";

        artwork.dataset.artwork =
            this.state.artwork;

        this.element.appendChild(
            artwork
        );
    }


    /* =================================================
       SONG INFORMATION
       ================================================= */

    const info =
        document.createElement("div");

    info.classList.add(
        "cherry-media-info"
    );


    const title =
        document.createElement("div");

    title.classList.add(
        "cherry-media-title"
    );

    title.textContent =
        this.state.title;


    const artist =
        document.createElement("div");

    artist.classList.add(
        "cherry-media-artist"
    );

    artist.textContent =
        this.state.artist;


    info.appendChild(title);
    info.appendChild(artist);

    content.appendChild(info);


    /* =================================================
       PROGRESS
       ================================================= */

    if (this.settings.showProgress) {

        const progressContainer =
            document.createElement("div");

        progressContainer.classList.add(
            "cherry-media-progress"
        );


        const progress =
            document.createElement("div");

        progress.classList.add(
            "cherry-media-progress-bar"
        );

        progress.style.width =
            `${this.state.progress}%`;


        progressContainer.appendChild(
            progress
        );

        content.appendChild(
            progressContainer
        );
    }


    /* =================================================
       CONTROLS
       ================================================= */

    if (this.settings.showControls) {

        const controls =
            document.createElement("div");

        controls.classList.add(
            "cherry-media-controls"
        );


        const previous =
            document.createElement("button");

        previous.textContent =
            "◀";


        const play =
            document.createElement("button");

        play.textContent =
            this.state.playing
                ? "❚❚"
                : "▶";


        const next =
            document.createElement("button");

        next.textContent =
            "▶";


        controls.appendChild(
            previous
        );

        controls.appendChild(
            play
        );

        controls.appendChild(
            next
        );


        content.appendChild(
            controls
        );
    }


    /* =================================================
       MEDIA CONTENT
       ================================================= */

    this.element.appendChild(
        content
    );
}


    /* =====================================================
       TOGGLE PLAY
       ===================================================== */

    togglePlay() {

        this.state.playing =
            !this.state.playing;

        this.update();

    }


    /* =====================================================
       UPDATE
       ===================================================== */

    update() {

        super.update();

        this.render();

    }


    /* =====================================================
       DESTROY
       ===================================================== */

    destroy() {

        super.destroy();

    }

}