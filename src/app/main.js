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
    layout: {
        column: 0,
        row: 0,
        columns: 4,
        rows: 2
    }
});


const media = new MediaWidget({
    layout: {
        column: 0,
        row: 2,
        columns: 4,
        rows: 8
    }
});


const system = new SystemWidget({
    layout: {
        column: 0,
        row: 13,
        columns: 4,
        rows: 7
    }
});


const controls = new ControlsWidget({
    layout: {
        column: 0,
        row: 10,
        columns: 4,
        rows: 8
    }
});

const mediaVisual = new MediaVisualWidget({

    layout: {
        column: 0,
        row: 20,
        columns: 2,
        rows: 2
    },

    variant: "glass",

    settings: {
        source: "assets/media/cherry.jpg",
        type: "image",
        objectFit: "contain"
    }
});

const text = new TextWidget({
    layout: {
        column: 2,
        row: 20,
        columns: 2,
        rows: 2
    }
});

canvas.addWidget(mediaVisual);
canvas.addWidget(clock);
canvas.addWidget(media);
canvas.addWidget(system);
canvas.addWidget(controls);
canvas.addWidget(text);