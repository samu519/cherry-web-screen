import { Widget } from "../../core/widgets/Widget.js";
import { appState } from "../../core/state/appState.js";


export class ToggleWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "toggle"
        });




        // =====================================================
        // SETTINGS
        // =====================================================

        this.settings = {

            sizePreset: "mini",

            style: "button",

            ...this.settings,

            ...(config.size && {
                sizePreset: config.size
            }),

            ...(config.style && {
                style: config.style
            })

        };


        // =====================================================
        // CONTROL
        // =====================================================

        this.control = {

            id:
                config.id ?? "wifi",

            label:
                config.label ?? "Wi-Fi",

            value:
                config.value ?? false

        };


        // =====================================================
        // SIZE PRESETS
        // =====================================================

        this.sizePresets = {

            mini: {

                columns: 1,
                rows: 1

            },

            small: {

                columns: 2,
                rows: 1

            },

            medium: {

                columns: 2,
                rows: 2

            }

        };


        // =====================================================
        // STYLE PRESETS
        // =====================================================

        this.styles = {

            button: {

                name: "Button"

            },

            widget: {

                name: "Widget"

            }

        };


        // =====================================================
        // APPLY SIZE
        // =====================================================

        const size =
            this.settings.sizePreset;

        const sizeConfig =
            this.sizePresets[size];

        if (sizeConfig) {

            this.setLayout({

                ...sizeConfig,

                ...config.layout

            });

        }
        this.unsubscribe = null;

    }


    // =========================================================
    // CREATE ELEMENT
    // =========================================================

    createElement() {

        const element =
            super.createElement();

        element.classList.add(
            "cherry-toggle"
        );

        return element;

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

        this.element.dataset.control =
            this.control.id;

    }


    // =========================================================
    // SET SIZE
    // =========================================================

    setSizePreset(size) {

        const sizeConfig =
            this.sizePresets[size];

        if (!sizeConfig) {

            console.warn(
                `ToggleWidget: size "${size}" no está definido.`
            );

            return false;

        }

        this.settings.sizePreset =
            size;

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

        if (!this.styles[style]) {

            console.warn(
                `ToggleWidget: style "${style}" no está definido.`
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
    // GET VALUE
    // =========================================================

    getValue() {

        return this.control.value;

    }


    // =========================================================
    // SET VALUE
    // =========================================================

    setValue(value) {

        this.control.value =
            Boolean(value);

        this.render();

    }


    // =========================================================
    // TOGGLE
    // =========================================================

    
    connectState() {

        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        this.unsubscribe = appState.subscribe(
            this.control.id,
            data => {
                const val = typeof data === "object" && data !== null && "value" in data ? data.value : data;
                this.updateFromState(val);
            }
        );

        const currentVal = appState.get(this.control.id);
        const initialVal = currentVal !== undefined ? currentVal : this.control.value;
        this.updateFromState(initialVal);

    }

    updateFromState(rawVal) {

        if (!this.element) {
            return;
        }

        const value = typeof rawVal === "object" && rawVal !== null && "value" in rawVal ? rawVal.value : rawVal;
        const isActive = Boolean(value);

        this.control.value = isActive;

        this.element.classList.toggle(
            "active",
            isActive
        );

        const button =
            this.element.querySelector(
                ".cherry-toggle-button"
            );

        if (button) {
            button.classList.toggle(
                "active",
                isActive
            );
        }

    }

    toggle() {

        const currentState = appState.get(this.control.id);
        const current = currentState !== undefined ? Boolean(currentState) : Boolean(this.control.value);
        const newValue = !current;

        this.control.value = newValue;
        appState.set(
            this.control.id,
            newValue,
            this.id
        );

        this.updateFromState(newValue);

    }
    render() {

        if (!this.element) {

            this.createElement();

        }


        this.updateAttributes();
        if (this.size === "mini") {

            const size = Math.min(
                this.geometry.width,
                this.geometry.height
            );

            this.element.style.setProperty(
                "--toggle-mini-size",
                `${size}px`
            );

        } else {

            this.element.style.removeProperty(
                "--toggle-mini-size"
            );

        }


        // =====================================================
        // CLEAR
        // =====================================================

        this.element.innerHTML = "";


        // =====================================================
        // BUTTON
        // =====================================================

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.classList.add(
            "cherry-toggle-button"
        );


        if (this.control.value) {

            this.element.classList.add(
                "active"
            )

            button.classList.add(
                "active"
            );



        } else{
            this.element.classList.remove("active")
        }


        // =====================================================
        // ICON
        // =====================================================

        const icon =
            document.createElement("div");

        icon.classList.add(
            "cherry-toggle-icon"
        );

        icon.textContent =
            this.getControlIcon(
                this.control.id
            );


        // =====================================================
        // LABEL
        // =====================================================

        const label =
            document.createElement("div");

        label.classList.add(
            "cherry-toggle-label"
        );

        label.textContent =
            this.control.label;


        // =====================================================
        // STRUCTURE
        // =====================================================

        button.appendChild(
            icon
        );

        button.appendChild(
            label
        );


        this.element.appendChild(
            button
        );


        // =====================================================
        // CLICK
        // =====================================================

        button.addEventListener(
            "click",
            () => {

                this.toggle();

            }
        );
        this.connectState();

    }


    // =========================================================
    // ICONS
    // =========================================================

    getControlIcon(id) {

        const icons = {

            wifi: "W",

            bluetooth: "ᛒ",

            darkMode: "◐",

            colorMode: "◉",

            doNotDisturb: "−",

            batterySaver: "⚡"

        };

        return icons[id] ?? "•";

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

        if (this.unsubscribe) {

            this.unsubscribe();

            this.unsubscribe = null;

        }


        super.destroy();

    }

}