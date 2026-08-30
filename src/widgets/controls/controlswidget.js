import { Widget } from "../../core/widgets/Widget.js";

export class ControlsWidget extends Widget {
    constructor(config = {}) {
        super({
            ...config,
            type: "controls"
        });

        this.settings = {
            showWiFi: true,
            showBluetooth: true,
            showVolume: true,
            showBrightness: true,
            ...this.settings
        };

        // Datos simulados por ahora.
        // Más adelante se conectarán con funciones reales del sistema.
        this.state = {
            wifi: true,
            bluetooth: false,
            volume: 65,
            brightness: 80,
            ...this.state
        };
    }

    createElement() {
        const element = super.createElement();

        element.classList.add("cherry-controls");

        return element;
    }

    render() {
        if (!this.element) {
            return;
        }

        this.element.innerHTML = "";

        // Zona de toggles
        const toggles = document.createElement("div");

        toggles.classList.add("cherry-controls-toggles");

        if (this.settings.showWiFi) {
            toggles.appendChild(
                this.createToggle(
                    "Wi-Fi",
                    this.state.wifi,
                    () => {
                        this.state.wifi = !this.state.wifi;
                        this.render();
                    }
                )
            );
        }

        if (this.settings.showBluetooth) {
            toggles.appendChild(
                this.createToggle(
                    "Bluetooth",
                    this.state.bluetooth,
                    () => {
                        this.state.bluetooth =
                            !this.state.bluetooth;

                        this.render();
                    }
                )
            );
        }

        this.element.appendChild(toggles);

        // Zona de sliders
        const sliders = document.createElement("div");

        sliders.classList.add("cherry-controls-sliders");

        if (this.settings.showVolume) {
            sliders.appendChild(
                this.createSlider(
                    "Volume",
                    this.state.volume,
                    (value) => {
                        this.state.volume = value;
                    }
                )
            );
        }

        if (this.settings.showBrightness) {
            sliders.appendChild(
                this.createSlider(
                    "Brightness",
                    this.state.brightness,
                    (value) => {
                        this.state.brightness = value;
                    }
                )
            );
        }

        this.element.appendChild(sliders);
    }

    createToggle(label, active, onClick) {
        const button = document.createElement("button");

        button.classList.add("cherry-control-toggle");

        if (active) {
            button.classList.add("active");
        }

        button.textContent = label;

        button.addEventListener("click", onClick);

        return button;
    }

    createSlider(label, value, onInput) {
        const container = document.createElement("div");

        container.classList.add("cherry-control-slider");

        const labelElement = document.createElement("span");

        labelElement.textContent = label;

        const slider = document.createElement("input");

        slider.type = "range";
        slider.min = "0";
        slider.max = "100";
        slider.value = value;

        slider.addEventListener("input", (event) => {
            onInput(Number(event.target.value));
        });

        container.appendChild(labelElement);
        container.appendChild(slider);

        return container;
    }

    update() {
        super.update();

        this.render();
    }
}