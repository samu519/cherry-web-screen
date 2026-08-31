import { Widget } from "../../core/widgets/Widget.js";

export class TextWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "text"
        });

        // =====================================================
        // SETTINGS
        // =====================================================

        this.settings = {

            sizePreset: "small",

            style: "default",

            ...this.settings

        };


        // =====================================================
        // STATE
        // =====================================================

        this.state = {

            text: "Hello Cherry",

            ...this.state

        };


        // =====================================================
        // SIZE PRESETS
        // =====================================================

        this.sizePresets = {

            mini: {
                columns: 2,
                rows: 1
            },

            small: {
                columns: 2,
                rows: 2
            },

            medium: {
                columns: 3,
                rows: 2
            },

            large: {
                columns: 3,
                rows: 3
            },

            cardvertical: {
                columns: 2,
                rows: 4
            },

            cardhorizontal: {
                columns: 4,
                rows: 2
            },

            card: {
                columns: 3,
                rows: 4
            },

            giant: {
                columns: 4,
                rows: 6
            }

        };


        // =====================================================
        // STYLES
        // =====================================================

        this.styles = {

            default: {
                name: "Default"
            }

        };


        // =====================================================
        // APPLY SIZE
        // =====================================================

        const selectedSize =
            config.size ?? "small";

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
            "cherry-text"
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
                `TextWidget: size "${size}" no está definido.`
            );

            return false;

        }

        this.settings.sizePreset =
            size;

        this.setLayout(
            sizeConfig
        );

        this.updateAttributes();

        this.update();

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
                `TextWidget: style "${style}" no está definido.`
            );

            return false;

        }

        this.settings.style =
            style;

        this.updateAttributes();

        this.update();

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
        // CONTENT
        // =====================================================

        const content =
            document.createElement("div");

        content.classList.add(
            "cherry-text-content"
        );


        // =====================================================
        // TEXT
        // =====================================================

        const text =
            document.createElement("div");

        text.classList.add(
            "cherry-text-value"
        );

        text.textContent =
            this.state.text;


        // =====================================================
        // STRUCTURE
        // =====================================================

        content.appendChild(
            text
        );

        this.element.appendChild(
            content
        );

        requestAnimationFrame(() => {
            this.updateTextSize();
        });
    }

    updateTextSize() {

    if (!this.element) {
        return;
    }

    const textElement =
        this.element.querySelector(
            ".cherry-text-value"
        );

    const content =
        this.element.querySelector(
            ".cherry-text-content"
        );

    if (!textElement || !content) {
        return;
    }

    // =====================================================
    // RESET
    // =====================================================

    textElement.style.fontSize = "1px";

    // =====================================================
    // AVAILABLE SPACE
    // =====================================================

    const availableWidth =
        content.clientWidth;

    const availableHeight =
        content.clientHeight;

    if (
        availableWidth <= 0 ||
        availableHeight <= 0
    ) {
        return;
    }

    // =====================================================
    // FIND MAXIMUM SIZE
    // =====================================================

    let min = 1;

    let max =
        Math.min(
            availableWidth,
            availableHeight
        );

    let best = min;

    while (min <= max) {

        const size =
            Math.floor(
                (min + max) / 2
            );

        textElement.style.fontSize =
            `${size}px`;

        const fits =
            textElement.scrollWidth <=
                availableWidth &&
            textElement.scrollHeight <=
                availableHeight;

        if (fits) {

            best = size;

            min =
                size + 1;

        } else {

            max =
                size - 1;

        }

    }

    // =====================================================
    // FINAL SIZE
    // =====================================================

    textElement.style.fontSize =
        `${best}px`;

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