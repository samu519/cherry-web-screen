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
        this.sizePresets = {

            small: {

                columns: 2,
                rows: 2
            },

            medium: {

                columns: 4,
                rows: 2
            },

            large: {

                columns: 4,
                rows: 4
            }

        };
        this.setSize(this.size);

        this.styles = {

            onlyclock: {
                showDate: false,
                showSeconds: false
            },
            clockdate: {
                showDate: true,
                showSeconds: false
            }
        };

        this.setStyle(this.style);
    };
    
    createElement() {

        const element = super.createElement();

        element.classList.add(
            "cherry-clock"
        );

        element.style.containerType =
            "size";

        element.style.containerName =
            "clock";


        const timeElement =
        document.createElement("div");

        timeElement.classList.add(
            "cherry-clock-time"
        );


        const dateElement =
            document.createElement("div");

        dateElement.classList.add(
            "cherry-clock-date"
        );


        element.appendChild(
            timeElement
        );

        element.appendChild(
            dateElement
        );


        this.timeElement =
            timeElement;

        this.dateElement =
            dateElement;
        return element;
    }

    setStyle(style) {

    const styleConfig =
        this.styles[style];

    if (!styleConfig) {

        console.warn(
            `ClockWidget: style "${style}" no está definido.`
        );

        return false;
    }


    this.style =
        style;


    this.settings = {

        ...this.settings,

        ...styleConfig
    };


    if (this.element) {

        this.element.dataset.widgetStyle =
            this.style;
    }


    this.updateTime();

    return true;
}
    render() {

    if (!this.element) {
        this.createElement();
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

    const now =
        new Date();


    const timeOptions = {

        hour: "2-digit",

        minute: "2-digit",

        hour12:
            this.settings.format === "12h"
    };


    if (this.settings.showSeconds) {

        timeOptions.second =
            "2-digit";
    }


    const time =
        new Intl.DateTimeFormat(
            undefined,
            timeOptions
        ).format(now);


    this.timeElement.textContent =
        time;


    if (this.settings.showDate) {

        this.dateElement.textContent =
            new Intl.DateTimeFormat(
                undefined,
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long"
                }
            ).format(now);

        this.dateElement.style.display =
            "block";

    } else {

        this.dateElement.style.display =
            "none";
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