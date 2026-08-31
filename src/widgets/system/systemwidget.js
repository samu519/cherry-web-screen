import { Widget } from "../../core/widgets/Widget.js";

export class SystemWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "system"
        });

        /* =====================================================
           SETTINGS
           ===================================================== */

        this.settings = {

            sizePreset: "large",

            style: "default",

            variant: "system",

            showCPU: true,

            showGPU: true,

            showRAM: true,

            showTemperature: true,

            ...this.settings

        };


        /* =====================================================
           STATE
           Datos simulados por ahora
           ===================================================== */

        this.state = {

            cpu: 34,

            gpu: 51,

            ram: 72,

            temperature: 48,

            ...this.state

        };


        /* =====================================================
           SIZE PRESETS
           ===================================================== */

        this.sizePresets = {

            small: {

                columns: 3,

                rows: 3

            },

            medium: {

                columns: 4,

                rows: 4

            },

            cardvertical: {

                columns: 2,

                rows: 4

            },

            cardhorizontal: {
                columns: 4,
                rows: 2
            },

            large: {

                columns: 4,

                rows: 6

            }

        };


        /* =====================================================
           STYLES
           ===================================================== */

        this.styles = {

            default: {

                name: "Default"

            },

            compact: {

                name: "Compact"

            },

            circular: {
                name: "Circular"
            }

        };


        // =====================================================
        // APPLY SIZE
        // =====================================================

        const selectedSize =
            config.size ?? "large";

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


        // =====================================================
        // APPLY STYLE
        // =====================================================

        const selectedStyle =
            config.style ?? "default";

        if (this.styles[selectedStyle]) {

            this.settings.style =
            selectedStyle;

        }
    }


    /* =========================================================
       CREATE ELEMENT
       ========================================================= */

    createElement() {

        const element =
            super.createElement();

        element.classList.add(
            "cherry-system"
        );

        return element;

    }


    /* =========================================================
       SET SIZE
       ========================================================= */

    setSizePreset(size) {

        const sizeConfig =
            this.sizePresets[size];

        if (!sizeConfig) {

            console.warn(
                `SystemWidget: size "${size}" no está definido.`
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


    /* =========================================================
       SET STYLE
       ========================================================= */

    setStyle(style) {

        const styleConfig =
            this.styles[style];

        if (!styleConfig) {

            console.warn(
                `SystemWidget: style "${style}" no está definido.`
            );

            return false;

        }

        this.settings.style =
            style;

        this.updateAttributes();

        return true;

    }


    /* =========================================================
       UPDATE ATTRIBUTES
       ========================================================= */

    updateAttributes() {

        if (!this.element) {

            return;

        }

        this.element.dataset.size =
            this.settings.sizePreset;

        this.element.dataset.style =
            this.settings.style;

        this.element.dataset.variant =
            this.settings.variant;

    }


    /* =========================================================
       RENDER
       ========================================================= */

    render() {

        if (!this.element) {

            this.createElement();

        }

        this.updateAttributes();

        this.element.innerHTML = "";


        /* =====================================================
           HEADER
           ===================================================== */

        const header =
            document.createElement("div");

        header.classList.add(
            "cherry-system-header"
        );


        const title =
            document.createElement("div");

        title.classList.add(
            "cherry-system-title"
        );

        title.textContent =
            "System";


        header.appendChild(
            title
        );

        this.element.appendChild(
            header
        );


        /* =====================================================
           METRICS
           ===================================================== */

        const metrics =
            document.createElement("div");

        metrics.classList.add(
            "cherry-system-metrics"
        );


        /* CPU */

        if (this.settings.showCPU) {

            metrics.appendChild(
                this.createMetric(
                    "CPU",
                    this.state.cpu,
                    "%"
                )
            );

        }


        /* GPU */

        if (this.settings.showGPU) {

            metrics.appendChild(
                this.createMetric(
                    "GPU",
                    this.state.gpu,
                    "%"
                )
            );

        }


        /* RAM */

        if (this.settings.showRAM) {

            metrics.appendChild(
                this.createMetric(
                    "RAM",
                    this.state.ram,
                    "%"
                )
            );

        }


        /* TEMPERATURE */

        if (this.settings.showTemperature) {

            metrics.appendChild(
                this.createMetric(
                    "Temperature",
                    this.state.temperature,
                    "°C"
                )
            );

        }


        this.element.appendChild(
            metrics
        );

    }


    /* =========================================================
       CREATE METRIC
       ========================================================= */

createMetric(
    label,
    value,
    unit
) {

    const metric =
        document.createElement("div");

    metric.classList.add(
        "cherry-system-metric"
    );


    // =====================================================
    // LABEL
    // =====================================================

    const labelElement =
        document.createElement("div");

    labelElement.classList.add(
        "cherry-system-metric-label"
    );

    labelElement.textContent =
        label;


    // =====================================================
    // VALUE
    // =====================================================

    const valueElement =
        document.createElement("div");

    valueElement.classList.add(
        "cherry-system-metric-value"
    );

    valueElement.textContent =
        `${value}${unit}`;


    // =====================================================
    // PROGRESS BAR
    // =====================================================

    const bar =
        document.createElement("div");

    bar.classList.add(
        "cherry-system-metric-bar"
    );


    const progress =
        document.createElement("div");

    progress.classList.add(
        "cherry-system-metric-progress"
    );

    progress.style.width =
        `${value}%`;


    bar.appendChild(
        progress
    );


    // =====================================================
    // VALUE DATA
    // =====================================================

    metric.dataset.value =
        value;
    metric.style.setProperty(
        "--metric-value",
        value
    );

    // =====================================================
    // STRUCTURE
    // =====================================================

    metric.appendChild(
        labelElement
    );

    metric.appendChild(
        valueElement
    );

    metric.appendChild(
        bar
    );


    return metric;
}


    /* =========================================================
       UPDATE
       ========================================================= */

    update() {

        super.update();

        this.render();

    }


    /* =========================================================
       DESTROY
       ========================================================= */

    destroy() {

        super.destroy();

    }

}