import { Widget } from "../../core/widgets/Widget.js";

export class ClockWidget extends Widget {
    constructor(config = {}) {
        super({
            ...config,
            type: "clock"
        });

        this.settings = {
            format: "24h",
            showSeconds: false,
            showDate: false,
            ...this.settings
        };

        this.interval = null;
    }

    createElement() {
        const element = super.createElement();

        element.classList.add("cherry-clock");

        return element;
    }

    render() {
        if (!this.element) {
            return;
        }

        this.updateTime();

        if (!this.interval) {
            this.interval = setInterval(() => {
                this.updateTime();
            }, 1000);
        }
    }

    updateTime() {
        if (!this.element) {
            return;
        }

        const now = new Date();

        const timeOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: this.settings.format === "12h"
        };

        if (this.settings.showSeconds) {
            timeOptions.second = "2-digit";
        }

        const time = new Intl.DateTimeFormat(
            undefined,
            timeOptions
        ).format(now);

        this.element.textContent = time;

        if (this.settings.showDate) {
            const dateElement = document.createElement("div");

            dateElement.classList.add("cherry-clock-date");

            dateElement.textContent = new Intl.DateTimeFormat(
                undefined,
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long"
                }
            ).format(now);

            this.element.appendChild(dateElement);
        }
    }

    update() {
        super.update();

        this.updateTime();
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        super.destroy();
    }
}