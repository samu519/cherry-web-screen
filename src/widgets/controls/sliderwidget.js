// =========================================================
// CHERRY — SLIDER WIDGET
// =========================================================

import { Widget } from "../../core/widgets/Widget.js";
import { appState } from "../../core/state/appState.js";


export class SliderWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "slider"
        });


        // =====================================================
        // SIZE PRESETS
        // =====================================================

        this.sizePresets = {

            mini: {
                columns: 2,
                rows: 1
            },

            medium: {
                columns: 3,
                rows: 2
            },

            large: {
                columns: 4,
                rows: 1
            }

        };


        // =====================================================
        // CONTROL
        // =====================================================

        this.control = {

            id:
                config.control?.id ??
                "volume",

            label:
                config.control?.label ??
                "Volume",

            min:
                Number(
                    config.control?.min ?? 0
                ),

            max:
                Number(
                    config.control?.max ?? 100
                ),

            step:
                Number(
                    config.control?.step ?? 1
                ),

            value:
                Number(
                    config.control?.value ?? 50
                )

        };


        // =====================================================
        // NORMALIZE CONTROL
        // =====================================================

        if (
            this.control.max <
            this.control.min
        ) {

            this.control.max =
                this.control.min;

        }


        if (
            this.control.step <= 0
        ) {

            this.control.step =
                1;

        }


        // =====================================================
        // VALUE
        // =====================================================

        this.value =
            this.normalizeValue(
                this.control.value
            );


        this.control.value =
            this.value;


        // =====================================================
        // SUBSCRIPTION
        // =====================================================

        this.unsubscribe =
            null;


        // =====================================================
        // INITIAL SHARED VALUE
        // =====================================================

        const sharedValue =
            appState.get(
                this.control.id
            );


        if (
            sharedValue !== undefined
        ) {

            this.value =
                this.normalizeValue(
                    sharedValue
                );

            this.control.value =
                this.value;

        }


        // =====================================================
        // APPLY INITIAL SIZE
        // =====================================================

        const preset =
            this.sizePresets[this.size];


        if (preset) {

            this.layout.columns =
                preset.columns;

            this.layout.rows =
                preset.rows;

        }


        // =====================================================
        // CONNECT STATE
        // =====================================================

        this.bindState();

    }


    // =========================================================
    // NORMALIZE VALUE
    // =========================================================

    normalizeValue(value) {

        let normalized =
            Number(value);


        if (
            !Number.isFinite(normalized)
        ) {

            normalized =
                this.control.min;

        }


        // -----------------------------------------------------
        // CLAMP
        // -----------------------------------------------------

        normalized =
            Math.min(
                this.control.max,
                Math.max(
                    this.control.min,
                    normalized
                )
            );


        // -----------------------------------------------------
        // STEP
        // -----------------------------------------------------

        const step =
            this.control.step;

        const min =
            this.control.min;


        if (step > 0) {

            normalized =
                min +
                Math.round(
                    (
                        normalized - min
                    ) / step
                ) * step;

        }


        return normalized;

    }


    // =========================================================
    // CREATE ELEMENT
    // =========================================================

    createElement() {

        const element =
            super.createElement();


        element.classList.add(
            "cherry-slider-widget"
        );


        return element;

    }


    // =========================================================
    // BIND STATE
    // =========================================================

    bindState() {

        // -----------------------------------------------------
        // REMOVE PREVIOUS SUBSCRIPTION
        // -----------------------------------------------------

        if (this.unsubscribe) {

            this.unsubscribe();

            this.unsubscribe =
                null;

        }


        // -----------------------------------------------------
        // SUBSCRIBE
        // -----------------------------------------------------

        this.unsubscribe = appState.subscribe(
            this.control.id,
    ({ value, source }) => {

        console.log(
            "SLIDER RECIBE:",
            {
                widget: this.id,
                control: this.control.id,
                value,
                source
            }
        );

        if (source === this.id) {
            return;
        }

        this.value = value;
        this.control.value = value;

        this.updateUI();
        this.updateBar();
    }
);
    }


    // =========================================================
    // SET SIZE
    // =========================================================

    setSize(size) {

        const preset =
            this.sizePresets[size];


        if (!preset) {

            console.warn(
                `SliderWidget: size "${size}" no está definido.`
            );

            return false;

        }


        this.size =
            size;


        this.layout = {

            ...this.layout,

            columns:
                preset.columns,

            rows:
                preset.rows

        };


        if (this.element) {

            this.element.dataset.widgetSize =
                this.size;

        }


        return true;

    }


    // =========================================================
    // GET VALUE
    // =========================================================

    getValue() {

        return this.value;

    }


    // =========================================================
    // SET VALUE
    // =========================================================

    setValue(value) {

        const newValue =
            this.normalizeValue(
                value
            );


        // -----------------------------------------------------
        // IGNORE UNCHANGED VALUE
        // -----------------------------------------------------

        if (
            Object.is(
                this.value,
                newValue
            )
        ) {

            return false;

        }


        // -----------------------------------------------------
        // UPDATE LOCAL
        // -----------------------------------------------------

        this.value =
            newValue;

        this.control.value =
            newValue;


        // -----------------------------------------------------
        // UPDATE UI
        // -----------------------------------------------------

        this.update();


        // -----------------------------------------------------
        // UPDATE SHARED STATE
        // -----------------------------------------------------

        appState.set(

            this.control.id,

            newValue,

            this.id

        );

        console.log(
    "SLIDER ENVÍA:",
    {
        widget: this.id,
        control: this.control.id,
        value: newValue
    }
);

appState.set(
    this.control.id,
    newValue,
    this.id
);


        return true;

    }


    // =========================================================
    // CREATE RANGE
    // =========================================================

    createRange() {

        const range =
            document.createElement(
                "input"
            );


        range.type =
            "range";


        range.classList.add(
            "cherry-slider-range"
        );


        range.min =
            String(
                this.control.min
            );


        range.max =
            String(
                this.control.max
            );


        range.step =
            String(
                this.control.step
            );


        range.value =
            String(
                this.value
            );


        // -----------------------------------------------------
        // INPUT
        // -----------------------------------------------------

        range.addEventListener(
            "input",
            (event) => {

                this.setValue(
                    event.target.valueAsNumber
                );

            }
        );


        return range;

    }


    // =========================================================
    // UPDATE UI
    // =========================================================

    updateUI() {

    if (!this.element) {
        return;
    }

    const min = Number(this.control.min);
    const max = Number(this.control.max);
    const currentVal = Number(this.value);
    const percentage = max > min ? Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100)) : 0;


    // =====================================================
    // RANGE
    // =====================================================

    const range =
        this.element.querySelector(
            ".cherry-slider-range"
        );

    if (range) {

        range.value =
            String(this.value);

        range.style.setProperty("--slider-progress", `${percentage}%`);

    }


    // =====================================================
    // DEFAULT VALUE
    // =====================================================

    const valueDisplay =
        this.element.querySelector(
            ".cherry-slider-value"
        );

    if (valueDisplay) {

        valueDisplay.textContent =
            this.value;

    }


    // =====================================================
    // BAR
    // =====================================================

    this.updateBar();

}


    // =========================================================
    // CREATE DEFAULT UI
    // =========================================================

    renderDefault() {

        // -----------------------------------------------------
        // ROOT
        // -----------------------------------------------------

        const slider =
            document.createElement(
                "div"
            );


        slider.classList.add(
            "cherry-slider"
        );


        // -----------------------------------------------------
        // HEADER
        // -----------------------------------------------------

        const header =
            document.createElement(
                "div"
            );


        header.classList.add(
            "cherry-slider-header"
        );


        // -----------------------------------------------------
        // LABEL
        // -----------------------------------------------------

        const label =
            document.createElement(
                "div"
            );


        label.classList.add(
            "cherry-slider-label"
        );


        label.textContent =
            this.control.label;


        // -----------------------------------------------------
        // VALUE
        // -----------------------------------------------------

        const value =
            document.createElement(
                "div"
            );


        value.classList.add(
            "cherry-slider-value"
        );


        value.textContent =
            this.value;


        // -----------------------------------------------------
        // RANGE
        // -----------------------------------------------------

        const range =
            this.createRange();


        // -----------------------------------------------------
        // STRUCTURE
        // -----------------------------------------------------

        header.appendChild(
            label
        );


        header.appendChild(
            value
        );


        slider.appendChild(
            header
        );


        slider.appendChild(
            range
        );


        this.element.appendChild(
            slider
        );

    }


    // =========================================================
    // RENDER
    // =========================================================
    render() {

    if (!this.element) {
        this.createElement();
    }

    this.element.dataset.widgetSize =
        this.size;

    this.element.dataset.widgetVariant =
        this.variant;

    this.element.dataset.widgetStyle =
        this.style;

    this.element.innerHTML = "";

    if (this.style === "bar") {

        this.renderBar();

    } else {

        this.renderDefault();

    }

    this.updateUI();
}

renderBar() {

    // =====================================================
    // ROOT
    // =====================================================

    const slider =
        document.createElement("div");

    slider.classList.add(
        "cherry-slider",
        "cherry-slider-bar"
    );


    // =====================================================
    // TRACK VISUAL
    // =====================================================

    const track =
        document.createElement("div");

    track.classList.add(
        "cherry-slider-bar-track"
    );


    // =====================================================
    // FILL
    // =====================================================

    const fill =
        document.createElement("div");

    fill.classList.add(
        "cherry-slider-bar-fill"
    );


    // =====================================================
    // CONTENT
    // =====================================================

    const content =
        document.createElement("div");

    content.classList.add(
        "cherry-slider-bar-content"
    );


    // =====================================================
    // LABEL
    // =====================================================

    const label =
        document.createElement("span");

    label.classList.add(
        "cherry-slider-bar-label"
    );

    label.textContent =
        this.control.label;


    // =====================================================
    // VALUE
    // =====================================================

    const value =
        document.createElement("span");

    value.classList.add(
        "cherry-slider-bar-value"
    );

    value.textContent =
        this.value;


    // =====================================================
    // RANGE
    // =====================================================

    const range =
        document.createElement("input");

    range.type =
        "range";

    range.classList.add(
        "cherry-slider-range"
    );

    range.min =
        String(this.control.min);

    range.max =
        String(this.control.max);

    range.step =
        String(this.control.step);

    range.value =
        String(this.value);


    // =====================================================
    // STRUCTURE
    // =====================================================

    track.appendChild(fill);

    content.appendChild(label);
    content.appendChild(value);

    track.appendChild(content);

    slider.appendChild(track);
    slider.appendChild(range);

    this.element.appendChild(slider);


    // =====================================================
    // INITIAL VISUAL STATE
    // =====================================================

    this.updateBar();


    // =====================================================
    // INPUT
    // =====================================================

range.addEventListener(
    "input",
    (event) => {

        this.setValue(
            event.target.value
        );

    }
);

}

updateBar() {

    if (!this.element) {
        return;
    }

    const fill =
        this.element.querySelector(
            ".cherry-slider-bar-fill"
        );

    const valueElement =
        this.element.querySelector(
            ".cherry-slider-bar-value"
        );

    if (!fill) {
        return;
    }


    const min =
        Number(this.control.min);

    const max =
        Number(this.control.max);

    const value =
        Number(this.value);


    if (max <= min) {

        fill.style.width =
            "0%";

        return;

    }


    const percentage =
        (
            (value - min) /
            (max - min)
        ) * 100;


    fill.style.width =
        `${percentage}%`;


    if (valueElement) {

        valueElement.textContent =
            this.value;

    }

}
    


    // =========================================================
    // UPDATE
    // =========================================================

    update() {

        this.updateUI();

    }


    // =========================================================
    // DESTROY
    // =========================================================

    destroy() {

        if (this.unsubscribe) {

            this.unsubscribe();

            this.unsubscribe =
                null;

        }


        super.destroy();

    }

}