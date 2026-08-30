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
    size: "card",
    style: "artworkProtagonist",
    layout: {
        row: 2,
    }
});


const system = new SystemWidget({
    layout: {
        column: 0,
        row: 13,
        columns: 4,
        rows: 5
    }
});


const controls = new ControlsWidget({
    layout: {
        column: 0,
        row: 10,
        columns: 4,
        rows: 3
    }
});

const mediaVisual = new MediaVisualWidget({

    layout: {
        column: 2,
        row: 8,
        columns: 2,
        rows: 2
    },

    variant: "translucid",

    settings: {
        source: "assets/media/cherry.jpg",
        type: "image",
        objectFit: "contain"
    }
});

const text = new TextWidget({
    variant: "translucid",
    layout: {
        column: 2,
        row: 18,
        columns: 2,
        rows: 2
    }
});

console.log(media.layout);
canvas.addWidget(mediaVisual);
canvas.addWidget(clock);
canvas.addWidget(media);
canvas.addWidget(system);
canvas.addWidget(controls);
canvas.addWidget(text);