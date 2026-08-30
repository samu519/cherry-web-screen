import { Widget } from "../../core/widgets/Widget.js";

export class MediaWidget extends Widget {
    constructor(config = {}) {
        super({
            ...config,
            type: "media"
        });

        this.settings = {
            showArtwork: true,
            showControls: true,
            showProgress: true,
            blurArtwork: true,
            ...this.settings
        };

        this.state = {
            playing: false,
            title: "Blinding Lights",
            artist: "The Weeknd",
            artwork: "https://picsum.photos/500",
            progress: 42,
            duration: 201,
            ...this.state
        };
    }

    createElement() {
        const element = super.createElement();

        element.classList.add("cherry-media");

        return element;
    }

    render() {
        if (!this.element) {
            return;
        }

        this.element.innerHTML = "";

        // Artwork
        if (this.settings.showArtwork) {
            const artwork = document.createElement("img");

            artwork.classList.add("cherry-media-artwork");
            artwork.src = this.state.artwork;
            artwork.alt = "Album artwork";

            this.element.appendChild(artwork);
        }

        // Información de la canción
        const info = document.createElement("div");

        info.classList.add("cherry-media-info");

        const title = document.createElement("div");

        title.classList.add("cherry-media-title");
        title.textContent = this.state.title;

        const artist = document.createElement("div");

        artist.classList.add("cherry-media-artist");
        artist.textContent = this.state.artist;

        info.appendChild(title);
        info.appendChild(artist);

        this.element.appendChild(info);

        // Barra de progreso
        if (this.settings.showProgress) {
            const progressContainer = document.createElement("div");

            progressContainer.classList.add(
                "cherry-media-progress"
            );

            const progress = document.createElement("div");

            progress.classList.add(
                "cherry-media-progress-bar"
            );

            progress.style.width = `${this.state.progress}%`;

            progressContainer.appendChild(progress);

            this.element.appendChild(progressContainer);
        }

        // Controles
        if (this.settings.showControls) {
            const controls = document.createElement("div");

            controls.classList.add("cherry-media-controls");

            const previous = document.createElement("button");

            previous.textContent = "◀";

            const play = document.createElement("button");

            play.textContent = this.state.playing
                ? "❚❚"
                : "▶";

            const next = document.createElement("button");

            next.textContent = "▶";

            controls.appendChild(previous);
            controls.appendChild(play);
            controls.appendChild(next);

            this.element.appendChild(controls);
        }
    }

    togglePlay() {
        this.state.playing = !this.state.playing;

        this.update();
    }

    update() {
        super.update();

        this.render();
    }

    destroy() {
        super.destroy();
    }
}