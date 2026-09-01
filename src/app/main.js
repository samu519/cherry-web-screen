import { Canvas } from "../core/canvas/Canvas.js";

import { ClockWidget }
    from "../widgets/clock/ClockWidget.js";

import { MediaWidget }
    from "../widgets/media/mediawidget.js";

import { SystemWidget }
    from "../widgets/system/systemwidget.js";

import { ControlsWidget }
    from "../widgets/controls/controlswidget.js";

import { MediaVisualWidget }
    from "../widgets/visual/mediavisualwidget.js";    

import { TextWidget }
    from "../widgets/text/textwidget.js";

import {ToggleWidget}
    from "../widgets/controls/togglewidget.js";

import { SliderWidget } 
    from "../widgets/controls/sliderwidget.js";

const canvas = new Canvas({
    width: 480,
    height: 1920,
    columns: 4,
    rows: 22,
    gap: 12
});


const clock = new ClockWidget({
    size: "medium",
    style: "onlyclock",
    variant: "translucid",
    layout: {
        column: 0,
        row: 0,
    }
});


const media = new MediaWidget({
    size: "large",
    style: "artworkProtagonist",
    layout: {
        row: 2,
    }
});


const system = new SystemWidget({
    size: "cardvertical",
    style: "circular",
    layout: {
        row: 9,
    }
});


const controls = new ControlsWidget({
    size: "mini",
    style: "buttons",
    layout: {
        row: 6,
    }
});

const mediaVisual = new MediaVisualWidget({
    size: "medium",
    style: "gallery",
    layout: {
        column: 0,
        row: 10,
    },

});

const text = new TextWidget({
    size: "small",
    layout: {
        column: 2,
        row: 13,
    }
});

const wifi1 =
    new ToggleWidget({
        id: "wifi",
        label: "Wi-Fi",
        style: "widget",
        size: "small",
        layout: {
            column: 2,
            row: 6
        }
    });

const wifi2 =
    new ToggleWidget({
        id: "bluetooth",
        label: "Bluetooth",
        style: "widget",
        size: "medium",
        layout: {
            column: 2,
            row: 7
        }
    });

const sliderA  =
    new SliderWidget({

        id: "volume-slider-a",
        style: "bar",
        size: "mini",
        layout: {
            row: 8
        },

        control: {

            id: "volume",

            label: "Volume",

            min: 0,
            max: 100,
            step: 1,
            value: 50

        }

    });


const sliderB =
    new SliderWidget({

        id: "brightness",

        size: "mini",

        layout: {
            column: 2,
            row: 9
        },

        control: {

            id: "brightness",

            label: "brightness",

            min: 0,
            max: 100,
            step: 1,
            value: 50

        }

    });


canvas.addWidget(sliderA);

canvas.addWidget(sliderB);

console.log(media.layout);
canvas.addWidget(wifi1);
canvas.addWidget(wifi2);
canvas.addWidget(mediaVisual);
canvas.addWidget(clock);
canvas.addWidget(media);
canvas.addWidget(system);
canvas.addWidget(controls);
canvas.addWidget(text);