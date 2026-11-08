import { Widget } from "../../core/widgets/widget.js";

import { nativeService } from '../../services/nativeService.js';

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
    const focusedAction = this.element.contains(document.activeElement) ? document.activeElement.dataset.mediaAction : null;
    const media = nativeService.snapshot?.media;
    const view = nativeService.isNative ? {
        title: media?.available ? (media.title || 'Sin título') : 'Sin sesión multimedia',
        artist: media?.available ? media.artist : (nativeService.error || media?.reason || 'Conectando con Windows…'),
        artwork: media?.artwork, playing: media?.playing || false,
        progress: media?.durationSeconds > 0 ? Math.min(100, media.positionSeconds / media.durationSeconds * 100) : 0
    } : this.state;
    this.element.dataset.mediaSource = nativeService.mode;

    this.element.innerHTML = "";

    const backdrop =
    document.createElement("div");

    backdrop.classList.add(
        "cherry-media-backdrop"
    );

    backdrop.style.backgroundImage =
        view.artwork ? `url("${view.artwork}")` : 'none';

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

    if (this.settings.showArtwork && view.artwork) {

        const artwork =
            document.createElement("img");

        artwork.classList.add(
            "cherry-media-artwork"
        );

        artwork.src =
            view.artwork;

        artwork.alt =
            "Album artwork";

        artwork.dataset.artwork =
            view.artwork;

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
        view.title;


    const artist =
        document.createElement("div");

    artist.classList.add(
        "cherry-media-artist"
    );

    artist.textContent =
        view.artist;


    const badge = document.createElement('span');
    badge.className = 'cherry-provider-badge';
    badge.textContent = { demo: 'Demo', live: nativeService.snapshot?.provider === 'windows' ? 'Windows' : 'Sin proveedor', connecting: 'Conectando…', offline: 'Sin conexión' }[nativeService.mode];
    info.appendChild(badge);
    info.appendChild(title);
    info.appendChild(artist);

    content.appendChild(info);


    /* =================================================
       PROGRESS
       ================================================= */

    if (this.settings.showProgress && (!nativeService.isNative || (media?.available && media.durationSeconds > 0 && media.positionSeconds !== null))) {

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
            `${view.progress}%`;


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
        previous.type = 'button';
        previous.setAttribute('aria-label', 'Pista anterior');


        const play =
            document.createElement("button");

        play.textContent =
            view.playing
                ? "❚❚"
                : "▶";
        play.type = 'button';
        play.setAttribute('aria-label', view.playing ? 'Pausar' : 'Reproducir');


        const next =
            document.createElement("button");

        next.textContent =
            "▶";
        next.type = 'button';
        next.setAttribute('aria-label', 'Pista siguiente');


        for (const [button, action] of [[previous, 'previous'], [play, 'playPause'], [next, 'next']]) {
            button.dataset.mediaAction = action;
            button.disabled = nativeService.isNative ? (!media?.available || !media.controls[action]) : action !== 'playPause';
            button.setAttribute('aria-busy', String(nativeService.mediaPending));
            button.setAttribute('aria-disabled', String(button.disabled || nativeService.mediaPending));
            button.addEventListener('click', () => {
                if (!nativeService.isNative) { this.togglePlay(); return; }
                nativeService.mediaAction(action).catch(error => nativeService.onError?.(error.message));
            });
        }
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
    if (focusedAction) {
        const button = Array.from(this.element.querySelectorAll('[data-media-action]')).find(node => node.dataset.mediaAction === focusedAction);
        if (button && !button.disabled) button.focus({ preventScroll: true });
    }
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
