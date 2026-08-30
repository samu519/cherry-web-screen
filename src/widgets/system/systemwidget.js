import { Widget } from "../../core/widgets/Widget.js";

export class SystemWidget extends Widget {
    constructor(config = {}) {
        super({
            ...config,
            type: "system"
        });

        this.settings = {
            showCPU: true,
            showGPU: true,
            showRAM: true,
            showTemperature: true,
            ...this.settings
        };

        // Datos simulados por ahora.
        // Más adelante vendrán del sistema operativo.
        this.state = {
            cpu: 42,
            gpu: 18,
            ram: 61,
            temperature: 37,
            ...this.state
        };
    }

    createElement() {
        const element = super.createElement();

        element.classList.add("cherry-system");

        return element;
    }

    render() {
        if (!this.element) {
            return;
        }

        this.element.innerHTML = "";

        const metrics = [
            {
                name: "CPU",
                value: `${this.state.cpu}%`,
                visible: this.settings.showCPU
            },
            {
                name: "GPU",
                value: `${this.state.gpu}%`,
                visible: this.settings.showGPU
            },
            {
                name: "RAM",
                value: `${this.state.ram}%`,
                visible: this.settings.showRAM
            },
            {
                name: "TEMP",
                value: `${this.state.temperature}°C`,
                visible: this.settings.showTemperature
            }
        ];

        for (const metric of metrics) {
            if (!metric.visible) {
                continue;
            }

            const metricElement = document.createElement("div");

            metricElement.classList.add(
                "cherry-system-metric"
            );

            const nameElement = document.createElement("div");

            nameElement.classList.add(
                "cherry-system-metric-name"
            );

            nameElement.textContent = metric.name;

            const valueElement = document.createElement("div");

            valueElement.classList.add(
                "cherry-system-metric-value"
            );

            valueElement.textContent = metric.value;

            metricElement.appendChild(nameElement);
            metricElement.appendChild(valueElement);

            this.element.appendChild(metricElement);
        }
    }

    update() {
        super.update();

        this.render();
    }
}